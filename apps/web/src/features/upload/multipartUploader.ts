// TODO: Future enhancement — persist uploadId and ETags to IndexedDB
//       to support resuming interrupted uploads across page reloads.
import { MAX_RETRY_ATTEMPTS, RETRY_BASE_DELAY_MS, UPLOAD_CONCURRENCY } from "@clipforge/shared/constants";
import type {
  CompleteUploadRequest,
  CreateVideoResponse,
  GetPartsResponse,
  InitUploadResponse,
  UploadPart
} from "@clipforge/shared/types";
import { create } from "zustand";

import { apiRequest } from "../../lib/api";
import { env } from "../../lib/env";
import type { UploadRequestInput, UploadStatus } from "./uploadTypes";

interface UploadState {
  status: UploadStatus;
  progressPercent: number;
  uploadedBytes: number;
  totalBytes: number;
  error: string | null;
  shareSlug: string | null;
  uploadId: string | null;
  activeController: AbortController | null;
  setState: (updates: Partial<UploadState>) => void;
  reset: () => void;
}

export const useUploadStore = create<UploadState>((set) => ({
  status: "idle",
  progressPercent: 0,
  uploadedBytes: 0,
  totalBytes: 0,
  error: null,
  shareSlug: null,
  uploadId: null,
  activeController: null,
  setState: (updates) => set(updates),
  reset: () =>
    set({
      status: "idle",
      progressPercent: 0,
      uploadedBytes: 0,
      totalBytes: 0,
      error: null,
      shareSlug: null,
      uploadId: null,
      activeController: null
    })
}));

const sleep = (ms: number): Promise<void> => new Promise((resolve) => window.setTimeout(resolve, ms));

const uploadPartWithRetry = async (
  url: string,
  blob: Blob,
  signal: AbortSignal
): Promise<string> => {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(url, {
        method: "PUT",
        body: blob,
        signal
      });

      if (!response.ok) {
        throw new Error(`Part upload failed with status ${response.status}`);
      }

      const etag = response.headers.get("ETag");
      if (!etag) {
        throw new Error("ETag missing — check S3 CORS ExposeHeaders");
      }

      return etag.replace(/^"|"$/g, "");
    } catch (error) {
      lastError = error;
      if (attempt >= MAX_RETRY_ATTEMPTS || signal.aborted) {
        break;
      }

      await sleep(RETRY_BASE_DELAY_MS * 2 ** (attempt - 1));
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Unknown part upload failure.");
};

const runWithConcurrency = async <T>(tasks: Array<() => Promise<T>>, limit: number): Promise<T[]> => {
  const results: T[] = [];
  let index = 0;

  const worker = async (): Promise<void> => {
    while (index < tasks.length) {
      const currentIndex = index;
      index += 1;
      const task = tasks[currentIndex];
      if (!task) {
        return;
      }

      results[currentIndex] = await task();
    }
  };

  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, () => worker()));
  return results;
};

export const uploadRecording = async (
  input: UploadRequestInput
): Promise<{ shareSlug: string; videoId: string }> => {
  const controller = new AbortController();
  const store = useUploadStore.getState();
  store.setState({
    status: "creating",
    progressPercent: 0,
    uploadedBytes: 0,
    totalBytes: input.blob.size,
    error: null,
    shareSlug: null,
    uploadId: null,
    activeController: controller
  });

  let currentUploadId: string | null = null;

  try {
    const video = await apiRequest<CreateVideoResponse>("/videos", {
      method: "POST",
      body: JSON.stringify({
        title: input.title,
        description: input.description,
        visibility: input.visibility,
        mimeType: input.mimeType.split(";")[0],
        sizeBytes: input.blob.size,
        recordingType: input.recordingType
      })
    });

    if (env.devMode) {
      useUploadStore.getState().setState({
        status: "uploading",
        progressPercent: 20,
        uploadedBytes: Math.round(input.blob.size * 0.2)
      });

      const formData = new FormData();
      formData.set("videoId", video.videoId);
      formData.set("file", input.blob, `recording.${input.mimeType.includes("mp4") ? "mp4" : "webm"}`);
      if (input.thumbnailBase64) {
        formData.set("thumbnailBase64", input.thumbnailBase64);
      }

      const complete = await apiRequest<{ shareSlug: string; videoId: string }>("/uploads/dev/local", {
        method: "POST",
        headers: undefined,
        body: formData
      });

      useUploadStore.getState().setState({
        status: "success",
        shareSlug: complete.shareSlug,
        progressPercent: 100,
        uploadedBytes: input.blob.size
      });

      return complete;
    }

    const init = await apiRequest<InitUploadResponse>("/uploads/multipart/init", {
      method: "POST",
      body: JSON.stringify({ videoId: video.videoId })
    });

    currentUploadId = init.uploadId;
    store.setState({
      status: "uploading",
      uploadId: init.uploadId
    });

    const parts: UploadPart[] = [];
    const uploadedBytesByPart = new Map<number, number>();
    const partNumbers = Array.from({ length: init.partCount }, (_, index) => index + 1);

    for (let offset = 0; offset < partNumbers.length; offset += 10) {
      const partBatch = partNumbers.slice(offset, offset + 10);
      const batchUrls = await apiRequest<GetPartsResponse>("/uploads/multipart/parts", {
        method: "POST",
        body: JSON.stringify({
          uploadId: init.uploadId,
          partNumbers: partBatch
        })
      });

      const uploadTasks = batchUrls.urls.map((entry) => async () => {
        const start = (entry.partNumber - 1) * init.partSizeBytes;
        const end = Math.min(start + init.partSizeBytes, input.blob.size);
        const blobPart = input.blob.slice(start, end);
        const etag = await uploadPartWithRetry(entry.url, blobPart, controller.signal);

        uploadedBytesByPart.set(entry.partNumber, blobPart.size);
        const uploadedBytes = Array.from(uploadedBytesByPart.values()).reduce((sum, size) => sum + size, 0);

        useUploadStore.getState().setState({
          uploadedBytes,
          progressPercent: Math.min(100, Math.round((uploadedBytes / input.blob.size) * 100))
        });

        return {
          partNumber: entry.partNumber,
          etag,
          sizeBytes: blobPart.size
        } satisfies UploadPart;
      });

      const completedParts = await runWithConcurrency(uploadTasks, UPLOAD_CONCURRENCY);
      parts.push(...completedParts);
    }

    useUploadStore.getState().setState({
      status: "completing"
    });

    const complete = await apiRequest<{ shareSlug: string; videoId: string }>("/uploads/multipart/complete", {
      method: "POST",
      body: JSON.stringify({
        uploadId: init.uploadId,
        parts,
        thumbnailBase64: input.thumbnailBase64 ?? undefined
      } satisfies CompleteUploadRequest)
    });

    useUploadStore.getState().setState({
      status: "success",
      shareSlug: complete.shareSlug,
      progressPercent: 100,
      uploadedBytes: input.blob.size
    });

    return complete;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    useUploadStore.getState().setState({
      status: controller.signal.aborted ? "cancelled" : "error",
      error: message
    });

    throw error;
  } finally {
    if (controller.signal.aborted && currentUploadId) {
      try {
        await apiRequest("/uploads/multipart/abort", {
          method: "POST",
          body: JSON.stringify({ uploadId: currentUploadId })
        });
      } catch {
        // Ignore best-effort abort failures.
      }
    }

    useUploadStore.getState().setState({
      activeController: null
    });
  }
};

export const cancelUpload = async (): Promise<void> => {
  const { activeController, uploadId, setState } = useUploadStore.getState();

  activeController?.abort();

  if (uploadId) {
    try {
      await apiRequest("/uploads/multipart/abort", {
        method: "POST",
        body: JSON.stringify({ uploadId })
      });
    } catch {
      // Ignore abort cleanup failures in the UI path.
    }
  }

  setState({
    status: "cancelled"
  });
};
