import { z } from "zod";

import {
  MAX_DESCRIPTION_LENGTH,
  MAX_PARTS,
  MAX_TITLE_LENGTH,
  SUPPORTED_MIME_TYPES
} from "./constants";
import type {
  CompleteUploadRequest,
  CreateVideoRequest,
  CreateVideoResponse,
  GetPartsRequest,
  GetPartsResponse,
  InitUploadRequest,
  InitUploadResponse,
  PlaybackUrlResponse,
  PublicVideoResponse,
  RecordingType,
  UploadPart,
  UploadSession,
  UploadSessionStatus,
  UserProfile,
  VideoMetadata,
  VideoStatus,
  VideoVisibility,
  ViewEvent
} from "./types";

export const videoVisibilitySchema: z.ZodType<VideoVisibility> = z.enum([
  "private",
  "unlisted",
  "public"
]);

export const videoStatusSchema: z.ZodType<VideoStatus> = z.enum([
  "created",
  "uploading",
  "uploaded",
  "processing",
  "ready",
  "failed",
  "deleted"
]);

export const recordingTypeSchema: z.ZodType<RecordingType> = z.enum([
  "screen",
  "screen_mic",
  "screen_camera_mic",
  "camera"
]);

export const uploadSessionStatusSchema: z.ZodType<UploadSessionStatus> = z.enum([
  "initiated",
  "completed",
  "aborted",
  "expired"
]);

export const userProfileSchema: z.ZodType<UserProfile> = z.object({
  userId: z.string().min(1),
  email: z.string().email(),
  name: z.string().min(1).max(200).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export const videoMetadataSchema: z.ZodType<VideoMetadata> = z.object({
  videoId: z.string().min(1),
  ownerId: z.string().min(1),
  shareSlug: z.string().min(1),
  title: z.string().trim().min(1).max(MAX_TITLE_LENGTH),
  description: z.string().trim().max(MAX_DESCRIPTION_LENGTH).optional(),
  visibility: videoVisibilitySchema,
  status: videoStatusSchema,
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().nonnegative(),
  durationMs: z.number().int().nonnegative().optional(),
  recordingType: recordingTypeSchema,
  thumbnailObjectKey: z.string().min(1).optional(),
  originalObjectKey: z.string().min(1).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  readyAt: z.string().datetime().optional(),
  deletedAt: z.string().datetime().optional()
});

export const uploadSessionSchema: z.ZodType<UploadSession> = z.object({
  uploadId: z.string().min(1),
  videoId: z.string().min(1),
  ownerId: z.string().min(1),
  s3UploadId: z.string().min(1),
  objectKey: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
  partSizeBytes: z.number().int().positive(),
  partCount: z.number().int().positive().max(MAX_PARTS),
  status: uploadSessionStatusSchema,
  expiresAt: z.string().datetime(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export const viewEventSchema: z.ZodType<ViewEvent> = z.object({
  eventId: z.string().min(1),
  videoId: z.string().min(1),
  ownerId: z.string().min(1).optional(),
  watchedMs: z.number().int().nonnegative(),
  ipHash: z.string().length(32).optional(),
  userAgentHash: z.string().length(32).optional(),
  createdAt: z.string().datetime()
});

export const uploadPartSchema: z.ZodType<UploadPart> = z.object({
  partNumber: z.number().int().min(1).max(MAX_PARTS),
  etag: z.string().min(1),
  sizeBytes: z.number().int().positive().optional()
});

export const createVideoRequestSchema: z.ZodType<CreateVideoRequest> = z.object({
  title: z.string().trim().min(1).max(MAX_TITLE_LENGTH),
  description: z.string().trim().max(MAX_DESCRIPTION_LENGTH).optional(),
  visibility: videoVisibilitySchema,
  mimeType: z.enum(SUPPORTED_MIME_TYPES),
  sizeBytes: z.number().int().positive(),
  recordingType: recordingTypeSchema
});

export const createVideoResponseSchema: z.ZodType<CreateVideoResponse> = z.object({
  videoId: z.string().min(1),
  shareSlug: z.string().min(1),
  status: videoStatusSchema,
  createdAt: z.string().datetime()
});

export const initUploadRequestSchema: z.ZodType<InitUploadRequest> = z.object({
  videoId: z.string().min(1)
});

export const initUploadResponseSchema: z.ZodType<InitUploadResponse> = z.object({
  uploadId: z.string().min(1),
  videoId: z.string().min(1),
  objectKey: z.string().min(1),
  partSizeBytes: z.number().int().positive(),
  partCount: z.number().int().positive(),
  expiresAt: z.string().datetime()
});

export const getPartsRequestSchema: z.ZodType<GetPartsRequest> = z.object({
  uploadId: z.string().min(1),
  partNumbers: z.array(z.number().int().min(1).max(MAX_PARTS)).min(1).max(20)
});

export const getPartsResponseSchema: z.ZodType<GetPartsResponse> = z.object({
  uploadId: z.string().min(1),
  urls: z.array(
    z.object({
      partNumber: z.number().int().min(1).max(MAX_PARTS),
      url: z.string().url(),
      expiresAt: z.string().datetime()
    })
  )
});

export const completeUploadRequestSchema: z.ZodType<CompleteUploadRequest> = z.object({
  uploadId: z.string().min(1),
  parts: z.array(uploadPartSchema).min(1).max(MAX_PARTS),
  thumbnailBase64: z.string().min(1).optional()
});

export const playbackUrlResponseSchema: z.ZodType<PlaybackUrlResponse> = z.object({
  url: z.string().url(),
  mode: z.enum(["cloudfront-signed", "s3-presigned"]),
  expiresAt: z.string().datetime()
});

export const publicVideoResponseSchema: z.ZodType<PublicVideoResponse> = z.object({
  videoId: z.string().min(1),
  shareSlug: z.string().min(1),
  title: z.string().trim().min(1).max(MAX_TITLE_LENGTH),
  description: z.string().trim().max(MAX_DESCRIPTION_LENGTH).optional(),
  visibility: videoVisibilitySchema,
  status: videoStatusSchema,
  durationMs: z.number().int().nonnegative().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  readyAt: z.string().datetime().optional(),
  thumbnailUrl: z.string().url().optional()
});

export type UserProfileSchemaType = z.infer<typeof userProfileSchema>;
export type VideoMetadataSchemaType = z.infer<typeof videoMetadataSchema>;
export type UploadSessionSchemaType = z.infer<typeof uploadSessionSchema>;
export type ViewEventSchemaType = z.infer<typeof viewEventSchema>;
export type UploadPartSchemaType = z.infer<typeof uploadPartSchema>;
export type CreateVideoRequestSchemaType = z.infer<typeof createVideoRequestSchema>;
export type CreateVideoResponseSchemaType = z.infer<typeof createVideoResponseSchema>;
export type InitUploadRequestSchemaType = z.infer<typeof initUploadRequestSchema>;
export type InitUploadResponseSchemaType = z.infer<typeof initUploadResponseSchema>;
export type GetPartsRequestSchemaType = z.infer<typeof getPartsRequestSchema>;
export type GetPartsResponseSchemaType = z.infer<typeof getPartsResponseSchema>;
export type CompleteUploadRequestSchemaType = z.infer<typeof completeUploadRequestSchema>;
export type PlaybackUrlResponseSchemaType = z.infer<typeof playbackUrlResponseSchema>;
export type PublicVideoResponseSchemaType = z.infer<typeof publicVideoResponseSchema>;
