import type { RecordingType, VideoVisibility } from "@clipforge/shared/types";

export type UploadStatus =
  | "idle"
  | "creating"
  | "uploading"
  | "completing"
  | "success"
  | "error"
  | "cancelled";

export interface UploadRequestInput {
  blob: Blob;
  title: string;
  description?: string;
  visibility: VideoVisibility;
  mimeType: string;
  recordingType: RecordingType;
  thumbnailBase64?: string | null;
}
