export type VideoVisibility = "private" | "unlisted" | "public";

export type VideoStatus =
  | "created"
  | "uploading"
  | "uploaded"
  | "processing"
  | "ready"
  | "failed"
  | "deleted";

export type RecordingType = "screen" | "screen_mic" | "screen_camera_mic" | "camera";

export type UploadSessionStatus = "initiated" | "completed" | "aborted" | "expired";

export interface UserProfile {
  userId: string;
  email: string;
  name?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VideoMetadata {
  videoId: string;
  ownerId: string;
  shareSlug: string;
  title: string;
  description?: string;
  visibility: VideoVisibility;
  status: VideoStatus;
  mimeType: string;
  sizeBytes: number;
  durationMs?: number;
  recordingType: RecordingType;
  thumbnailObjectKey?: string;
  originalObjectKey?: string;
  createdAt: string;
  updatedAt: string;
  readyAt?: string;
  deletedAt?: string;
}

export interface UploadSession {
  uploadId: string;
  videoId: string;
  ownerId: string;
  s3UploadId: string;
  objectKey: string;
  mimeType: string;
  sizeBytes: number;
  partSizeBytes: number;
  partCount: number;
  status: UploadSessionStatus;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ViewEvent {
  eventId: string;
  videoId: string;
  ownerId?: string;
  watchedMs: number;
  ipHash?: string;
  userAgentHash?: string;
  createdAt: string;
}

export interface UploadPart {
  partNumber: number;
  etag: string;
  sizeBytes?: number;
}

export interface CreateVideoRequest {
  title: string;
  description?: string;
  visibility: VideoVisibility;
  mimeType: string;
  sizeBytes: number;
  recordingType: RecordingType;
}

export interface CreateVideoResponse {
  videoId: string;
  shareSlug: string;
  status: VideoStatus;
  createdAt: string;
}

export interface InitUploadRequest {
  videoId: string;
}

export interface InitUploadResponse {
  uploadId: string;
  videoId: string;
  objectKey: string;
  partSizeBytes: number;
  partCount: number;
  expiresAt: string;
}

export interface GetPartsRequest {
  uploadId: string;
  partNumbers: number[];
}

export interface GetPartsResponse {
  uploadId: string;
  urls: Array<{
    partNumber: number;
    url: string;
    expiresAt: string;
  }>;
}

export interface CompleteUploadRequest {
  uploadId: string;
  parts: UploadPart[];
  thumbnailBase64?: string;
}

export interface PlaybackUrlResponse {
  url: string;
  mode: "cloudfront-signed" | "s3-presigned";
  expiresAt: string;
}

export interface PublicVideoResponse {
  videoId: string;
  shareSlug: string;
  title: string;
  description?: string;
  visibility: VideoVisibility;
  status: VideoStatus;
  durationMs?: number;
  createdAt: string;
  updatedAt: string;
  readyAt?: string;
  thumbnailUrl?: string;
}
