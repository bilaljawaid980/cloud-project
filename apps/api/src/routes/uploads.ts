import {
  completeUploadRequestSchema,
  getPartsRequestSchema,
  initUploadRequestSchema
} from "@clipforge/shared/schemas";
import { Hono } from "hono";
import { z } from "zod";

import { getAuthUser, requireAuth } from "../middleware/auth";
import type { AppVariables } from "../middleware/logger";
import { config } from "../config/env";
import {
  abortMultipartUploadSession,
  completeMultipartUploadSession,
  getMultipartPartBatch,
  initMultipartUploadForVideo
} from "../services/uploads";
import { getVideoOrThrow } from "../services/videos";
import { saveLocalObject } from "../services/localFiles";
import { buildOriginalObjectKey } from "../services/s3";
import { nowIso } from "../utils/time";
import { updateVideo } from "../db/accessPatterns";
import { uploadThumbnailBase64 } from "../services/thumbnails";
import { ApiError } from "../utils/errors";

const abortUploadSchema = z.object({
  uploadId: z.string().min(1)
});

export const uploadRoutes = new Hono<{ Variables: AppVariables }>();

uploadRoutes.post("/dev/local", requireAuth, async (c) => {
  if (!config.devMode) {
    throw new ApiError(404, "NOT_FOUND", "Route not found.");
  }

  const user = getAuthUser(c);
  const formData = await c.req.formData();
  const videoId = z.string().min(1).parse(formData.get("videoId"));
  const thumbnailBase64 = z.preprocess(
    (value) => (value == null ? undefined : value),
    z.string().optional()
  ).parse(formData.get("thumbnailBase64"));
  const file = formData.get("file");

  if (!(file instanceof File)) {
    throw new ApiError(400, "FILE_REQUIRED", "A recording file is required.");
  }

  const video = await getVideoOrThrow(videoId);
  if (video.ownerId !== user.userId) {
    throw new ApiError(403, "VIDEO_FORBIDDEN", "You do not own this video.");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const objectKey = buildOriginalObjectKey(video.ownerId, video.videoId, video.mimeType);
  await saveLocalObject(objectKey, bytes);

  const thumbnailObjectKey = await uploadThumbnailBase64(video.videoId, thumbnailBase64);
  const timestamp = nowIso();

  await updateVideo(video, {
    status: "ready",
    originalObjectKey: objectKey,
    thumbnailObjectKey: thumbnailObjectKey ?? video.thumbnailObjectKey,
    updatedAt: timestamp,
    readyAt: timestamp
  });

  return c.json({
    shareSlug: video.shareSlug,
    videoId: video.videoId
  });
});

uploadRoutes.post("/multipart/init", requireAuth, async (c) => {
  const user = getAuthUser(c);
  const body = initUploadRequestSchema.parse(await c.req.json());
  const response = await initMultipartUploadForVideo(user.userId, body.videoId);

  return c.json(response, 201);
});

uploadRoutes.post("/multipart/parts", requireAuth, async (c) => {
  const user = getAuthUser(c);
  const body = getPartsRequestSchema.parse(await c.req.json());
  const response = await getMultipartPartBatch(user.userId, body);

  return c.json(response);
});

uploadRoutes.post("/multipart/complete", requireAuth, async (c) => {
  const user = getAuthUser(c);
  const body = completeUploadRequestSchema.parse(await c.req.json());
  const response = await completeMultipartUploadSession(user.userId, body);

  return c.json(response);
});

uploadRoutes.post("/multipart/abort", requireAuth, async (c) => {
  const user = getAuthUser(c);
  const body = abortUploadSchema.parse(await c.req.json());
  const response = await abortMultipartUploadSession(user.userId, body.uploadId);

  return c.json(response);
});
