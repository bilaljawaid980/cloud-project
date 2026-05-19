import type { CreateVideoRequest, PublicVideoResponse, VideoMetadata } from "@clipforge/shared/types";

import {
  createVideo,
  getVideoById,
  listUserVideos,
  softDeleteVideo,
  updateVideo
} from "../db/accessPatterns";
import { ApiError } from "../utils/errors";
import { generateShareSlug, generateVideoId } from "../utils/ids";
import { nowIso } from "../utils/time";
import { getThumbnailUrl } from "./playback";

export const createVideoForOwner = async (
  ownerId: string,
  request: CreateVideoRequest
): Promise<VideoMetadata> => {
  const timestamp = nowIso();
  const video: VideoMetadata = {
    videoId: generateVideoId(),
    ownerId,
    shareSlug: generateShareSlug(),
    title: request.title,
    description: request.description,
    visibility: request.visibility,
    status: "created",
    mimeType: request.mimeType,
    sizeBytes: request.sizeBytes,
    recordingType: request.recordingType,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  return createVideo(video);
};

export const listVideosForOwner = async (
  ownerId: string,
  limit: number,
  cursor?: Record<string, unknown>
): Promise<{ videos: VideoMetadata[]; nextCursor?: Record<string, unknown> }> => {
  const result = await listUserVideos(ownerId, limit, cursor);
  return {
    videos: result.items.filter((video) => video.status !== "deleted"),
    nextCursor: result.nextKey
  };
};

export const getVideoOrThrow = async (videoId: string): Promise<VideoMetadata> => {
  const video = await getVideoById(videoId);
  if (!video || video.status === "deleted") {
    throw new ApiError(404, "VIDEO_NOT_FOUND", "Video not found.");
  }

  return video;
};

export const canAccessVideo = (
  video: VideoMetadata,
  userId: string | undefined,
  allowUnlisted = true
): boolean => {
  if (video.visibility === "public") {
    return true;
  }

  if (video.visibility === "unlisted" && allowUnlisted) {
    return true;
  }

  return userId === video.ownerId;
};

export const assertVideoAccess = (
  video: VideoMetadata,
  userId: string | undefined,
  allowUnlisted = true
): void => {
  if (!canAccessVideo(video, userId, allowUnlisted)) {
    throw new ApiError(403, "VIDEO_FORBIDDEN", "You do not have access to this video.");
  }
};

export const toPublicVideoResponse = async (video: VideoMetadata): Promise<PublicVideoResponse> => ({
  videoId: video.videoId,
  shareSlug: video.shareSlug,
  title: video.title,
  description: video.description,
  visibility: video.visibility,
  status: video.status,
  durationMs: video.durationMs,
  createdAt: video.createdAt,
  updatedAt: video.updatedAt,
  readyAt: video.readyAt,
  thumbnailUrl: video.thumbnailObjectKey ? await getThumbnailUrl(video.thumbnailObjectKey, video.visibility) : undefined
});

export const updateVideoMetadata = async (
  currentVideo: VideoMetadata,
  updates: Partial<Pick<VideoMetadata, "title" | "description" | "visibility">>
): Promise<VideoMetadata> =>
  updateVideo(currentVideo, {
    ...updates,
    updatedAt: nowIso()
  });

export const markVideoDeleted = async (currentVideo: VideoMetadata): Promise<VideoMetadata> =>
  softDeleteVideo(currentVideo, nowIso());
