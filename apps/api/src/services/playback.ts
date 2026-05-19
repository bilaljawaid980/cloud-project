import type { PlaybackUrlResponse, VideoMetadata, VideoVisibility } from "@clipforge/shared/types";

import { config } from "../config/env";
import { ApiError } from "../utils/errors";
import { addDays, addHours, addSeconds, nowIso } from "../utils/time";
import { localObjectPlaybackResponse, localObjectUrl } from "./localFiles";
import { createCloudFrontSignedUrl, isCloudFrontSigningConfigured } from "./cloudfront";
import { createPresignedGetUrl } from "./s3";

const getVisibilityExpiry = (visibility: VideoVisibility, issuedAt: string): string => {
  if (visibility === "private") {
    return addHours(issuedAt, 1);
  }

  if (visibility === "unlisted") {
    return addHours(issuedAt, 24);
  }

  return addDays(issuedAt, 7);
};

const getSignedObjectUrl = async (
  bucket: string,
  objectKey: string,
  visibility: VideoVisibility
): Promise<PlaybackUrlResponse> => {
  if (isCloudFrontSigningConfigured()) {
    const issuedAt = nowIso();
    const expiresAt = getVisibilityExpiry(visibility, issuedAt);

    return {
      url: createCloudFrontSignedUrl(objectKey, expiresAt),
      mode: "cloudfront-signed",
      expiresAt
    };
  }

  const issuedAt = nowIso();
  const expiresAt = addSeconds(issuedAt, config.presignedUrlExpiresSeconds);
  const url = await createPresignedGetUrl(bucket, objectKey, config.presignedUrlExpiresSeconds);

  return {
    url,
    mode: "s3-presigned",
    expiresAt
  };
};

export const getPlaybackUrlForVideo = async (video: VideoMetadata): Promise<PlaybackUrlResponse> => {
  if (!video.originalObjectKey) {
    throw new ApiError(409, "VIDEO_NOT_READY", "Video playback is not ready yet.");
  }

  if (video.status !== "ready" && video.status !== "uploaded" && video.status !== "processing") {
    throw new ApiError(409, "VIDEO_NOT_READY", "Video playback is not ready yet.");
  }

  if (config.devMode) {
    return localObjectPlaybackResponse(video.originalObjectKey);
  }

  return getSignedObjectUrl(config.videoOriginalsBucket, video.originalObjectKey, video.visibility);
};

export const getThumbnailUrl = async (
  thumbnailObjectKey: string,
  visibility: VideoVisibility
): Promise<string> => {
  if (config.devMode) {
    return localObjectUrl(thumbnailObjectKey);
  }

  const signed = await getSignedObjectUrl(config.videoDerivedBucket, thumbnailObjectKey, visibility);
  return signed.url;
};
