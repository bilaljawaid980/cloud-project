import { MAX_PARTS, SUPPORTED_MIME_TYPES } from "@clipforge/shared/constants";
import type {
  CompleteUploadRequest,
  GetPartsRequest,
  GetPartsResponse,
  InitUploadResponse,
  UploadSession
} from "@clipforge/shared/types";

import { config } from "../config/env";
import {
  createUploadSession,
  getUploadSession,
  updateUploadSession,
  updateVideo
} from "../db/accessPatterns";
import { ApiError } from "../utils/errors";
import { generateUploadId } from "../utils/ids";
import { addHours, isExpired, nowIso } from "../utils/time";
import { logAuditEvent } from "./analytics";
import {
  abortMultipartUpload,
  completeMultipartUpload,
  createMultipartUpload,
  getMultipartUploadPartUrls
} from "./s3";
import { uploadThumbnailBase64 } from "./thumbnails";
import { getVideoOrThrow } from "./videos";

const assertUploadOwner = (ownerId: string, sessionOwnerId: string): void => {
  if (ownerId !== sessionOwnerId) {
    throw new ApiError(403, "UPLOAD_FORBIDDEN", "You do not have access to this upload session.");
  }
};

const assertSessionActive = (session: UploadSession): void => {
  if (session.status !== "initiated") {
    throw new ApiError(409, "UPLOAD_SESSION_INACTIVE", "Upload session is no longer active.");
  }

  if (isExpired(session.expiresAt)) {
    throw new ApiError(410, "UPLOAD_SESSION_EXPIRED", "Upload session has expired.");
  }
};

export const initMultipartUploadForVideo = async (
  ownerId: string,
  videoId: string
): Promise<InitUploadResponse> => {
  const video = await getVideoOrThrow(videoId);

  if (video.ownerId !== ownerId) {
    throw new ApiError(403, "VIDEO_FORBIDDEN", "You do not own this video.");
  }

  if (video.status !== "created" && video.status !== "failed") {
    throw new ApiError(
      409,
      "VIDEO_UPLOAD_STATE_INVALID",
      "Video must be in created or failed state before uploading."
    );
  }

  if (!SUPPORTED_MIME_TYPES.includes(video.mimeType as (typeof SUPPORTED_MIME_TYPES)[number])) {
    throw new ApiError(400, "UNSUPPORTED_MIME_TYPE", "Unsupported video MIME type.");
  }

  if (video.sizeBytes > config.maxUploadBytes) {
    throw new ApiError(413, "VIDEO_TOO_LARGE", "Video exceeds the maximum upload size.");
  }

  const partCount = Math.ceil(video.sizeBytes / config.uploadPartSizeBytes);
  if (partCount > MAX_PARTS) {
    throw new ApiError(400, "TOO_MANY_PARTS", "Upload would exceed the maximum multipart part count.");
  }

  const timestamp = nowIso();
  const { objectKey, s3UploadId } = await createMultipartUpload(ownerId, video.videoId, video.mimeType);
  const uploadSession: UploadSession = {
    uploadId: generateUploadId(),
    videoId: video.videoId,
    ownerId,
    s3UploadId,
    objectKey,
    mimeType: video.mimeType,
    sizeBytes: video.sizeBytes,
    partSizeBytes: config.uploadPartSizeBytes,
    partCount,
    status: "initiated",
    expiresAt: addHours(timestamp, 24),
    createdAt: timestamp,
    updatedAt: timestamp
  };

  await createUploadSession(uploadSession);
  await updateVideo(video, {
    status: "uploading",
    originalObjectKey: objectKey,
    updatedAt: timestamp
  });

  logAuditEvent("upload_init", ownerId, {
    videoId: video.videoId,
    uploadId: uploadSession.uploadId
  });

  return {
    uploadId: uploadSession.uploadId,
    videoId: uploadSession.videoId,
    objectKey: uploadSession.objectKey,
    partSizeBytes: uploadSession.partSizeBytes,
    partCount: uploadSession.partCount,
    expiresAt: uploadSession.expiresAt
  };
};

export const getMultipartPartBatch = async (
  ownerId: string,
  request: GetPartsRequest
): Promise<GetPartsResponse> => {
  const session = await getUploadSession(request.uploadId);
  if (!session) {
    throw new ApiError(404, "UPLOAD_NOT_FOUND", "Upload session not found.");
  }

  assertUploadOwner(ownerId, session.ownerId);
  assertSessionActive(session);

  const urls = await getMultipartUploadPartUrls(
    session.objectKey,
    session.s3UploadId,
    request.partNumbers
  );

  return {
    uploadId: session.uploadId,
    urls
  };
};

export const completeMultipartUploadSession = async (
  ownerId: string,
  request: CompleteUploadRequest
): Promise<{ shareSlug: string; videoId: string }> => {
  const session = await getUploadSession(request.uploadId);
  if (!session) {
    throw new ApiError(404, "UPLOAD_NOT_FOUND", "Upload session not found.");
  }

  assertUploadOwner(ownerId, session.ownerId);
  assertSessionActive(session);

  const video = await getVideoOrThrow(session.videoId);
  if (video.ownerId !== ownerId) {
    throw new ApiError(403, "VIDEO_FORBIDDEN", "You do not own this video.");
  }

  await completeMultipartUpload(session.objectKey, session.s3UploadId, request.parts);

  const thumbnailObjectKey = await uploadThumbnailBase64(video.videoId, request.thumbnailBase64);
  const timestamp = nowIso();

  await updateUploadSession(session, {
    status: "completed",
    updatedAt: timestamp
  });

  await updateVideo(video, {
    status: "ready",
    updatedAt: timestamp,
    readyAt: timestamp,
    thumbnailObjectKey: thumbnailObjectKey ?? video.thumbnailObjectKey,
    originalObjectKey: session.objectKey
  });

  logAuditEvent("upload_complete", ownerId, {
    videoId: video.videoId,
    uploadId: session.uploadId
  });

  return {
    shareSlug: video.shareSlug,
    videoId: video.videoId
  };
};

export const abortMultipartUploadSession = async (
  ownerId: string,
  uploadId: string
): Promise<{ uploadId: string; videoId: string }> => {
  const session = await getUploadSession(uploadId);
  if (!session) {
    throw new ApiError(404, "UPLOAD_NOT_FOUND", "Upload session not found.");
  }

  assertUploadOwner(ownerId, session.ownerId);
  if (session.status !== "initiated") {
    throw new ApiError(409, "UPLOAD_SESSION_INACTIVE", "Only initiated upload sessions can be aborted.");
  }

  await abortMultipartUpload(session.objectKey, session.s3UploadId);

  const video = await getVideoOrThrow(session.videoId);
  const timestamp = nowIso();

  await updateUploadSession(session, {
    status: "aborted",
    updatedAt: timestamp
  });

  await updateVideo(video, {
    status: "failed",
    updatedAt: timestamp
  });

  logAuditEvent("upload_abort", ownerId, {
    videoId: video.videoId,
    uploadId: session.uploadId
  });

  return {
    uploadId: session.uploadId,
    videoId: session.videoId
  };
};
