export const MAX_TITLE_LENGTH = 200;
export const MAX_DESCRIPTION_LENGTH = 2000;
export const MAX_THUMBNAIL_BYTES = 512 * 1024;
export const DEFAULT_PART_SIZE = 16 * 1024 * 1024;
export const MIN_PART_SIZE = 5 * 1024 * 1024;
export const MAX_PARTS = 10000;
export const UPLOAD_CONCURRENCY = 3;
export const MAX_RETRY_ATTEMPTS = 3;
export const RETRY_BASE_DELAY_MS = 1000;

export const SUPPORTED_MIME_TYPES = ["video/webm", "video/mp4"] as const;

export const VIDEO_MIME_PREFERENCE = [
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm",
  "video/mp4"
] as const;
