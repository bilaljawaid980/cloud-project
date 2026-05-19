import { Hono } from "hono";
import { stat } from "node:fs/promises";
import { z } from "zod";

import { config } from "../config/env";
import { optionalAuth } from "../middleware/auth";
import type { AppVariables } from "../middleware/logger";
import { getVideoByShareSlug } from "../db/accessPatterns";
import { ApiError } from "../utils/errors";
import { getPlaybackUrlForVideo } from "../services/playback";
import { getLocalStorageAbsolutePath } from "../services/localFiles";
import { assertVideoAccess, getVideoOrThrow, toPublicVideoResponse } from "../services/videos";

const shareSlugParamSchema = z.object({
  shareSlug: z.string().min(1)
});

const videoParamSchema = z.object({
  videoId: z.string().min(1)
});

export const playbackRoutes = new Hono<{ Variables: AppVariables }>();

playbackRoutes.get("/dev/files/*", async (c) => {
  if (!config.devMode) {
    throw new ApiError(404, "NOT_FOUND", "Route not found.");
  }

  const pathname = new URL(c.req.url).pathname;
  const objectKey = decodeURIComponent(pathname.slice("/dev/files/".length));
  const absolutePath = getLocalStorageAbsolutePath(objectKey);

  try {
    await stat(absolutePath);
  } catch {
    throw new ApiError(404, "FILE_NOT_FOUND", "Stored file not found.");
  }

  return new Response(Bun.file(absolutePath));
});

playbackRoutes.get("/share/:shareSlug", optionalAuth, async (c) => {
  const { shareSlug } = shareSlugParamSchema.parse(c.req.param());
  const user = c.get("user");
  const video = await getVideoByShareSlug(shareSlug);

  if (!video || video.status === "deleted") {
    throw new ApiError(404, "VIDEO_NOT_FOUND", "Video not found.");
  }

  assertVideoAccess(video, user?.userId, true);
  return c.json(await toPublicVideoResponse(video));
});

playbackRoutes.post("/videos/:videoId/playback-url", optionalAuth, async (c) => {
  const { videoId } = videoParamSchema.parse(c.req.param());
  const user = c.get("user");
  const video = await getVideoOrThrow(videoId);

  assertVideoAccess(video, user?.userId, true);
  return c.json(await getPlaybackUrlForVideo(video));
});
