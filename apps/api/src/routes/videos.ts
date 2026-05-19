import { createVideoRequestSchema } from "@clipforge/shared/schemas";
import { Hono } from "hono";
import { z } from "zod";

import { getAuthUser, optionalAuth, requireAuth, requireVideoOwner } from "../middleware/auth";
import type { AppVariables } from "../middleware/logger";
import { logAuditEvent } from "../services/analytics";
import {
  assertVideoAccess,
  createVideoForOwner,
  getVideoOrThrow,
  listVideosForOwner,
  markVideoDeleted,
  toPublicVideoResponse,
  updateVideoMetadata
} from "../services/videos";
import { decodeCursor, encodeCursor } from "../utils/response";

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().optional()
});

const videoParamSchema = z.object({
  videoId: z.string().min(1)
});

const updateVideoSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(2000).optional(),
    visibility: z.enum(["private", "unlisted", "public"]).optional()
  })
  .refine((value) => Object.values(value).some((item) => item !== undefined), {
    message: "At least one field must be provided."
  });

export const videoRoutes = new Hono<{ Variables: AppVariables }>();

videoRoutes.post("/", requireAuth, async (c) => {
  const body = createVideoRequestSchema.parse(await c.req.json());
  const user = getAuthUser(c);
  const video = await createVideoForOwner(user.userId, body);

  return c.json(
    {
      videoId: video.videoId,
      shareSlug: video.shareSlug,
      status: video.status,
      createdAt: video.createdAt
    },
    201
  );
});

videoRoutes.get("/", requireAuth, async (c) => {
  const user = getAuthUser(c);
  const query = listQuerySchema.parse(c.req.query());
  const cursor = decodeCursor<Record<string, unknown>>(query.cursor);
  const result = await listVideosForOwner(user.userId, query.limit, cursor);

  return c.json({
    videos: await Promise.all(result.videos.map((video) => toPublicVideoResponse(video))),
    nextCursor: result.nextCursor ? encodeCursor(result.nextCursor) : undefined
  });
});

videoRoutes.get("/:videoId", optionalAuth, async (c) => {
  const { videoId } = videoParamSchema.parse(c.req.param());
  const user = c.get("user");
  const video = await getVideoOrThrow(videoId);

  assertVideoAccess(video, user?.userId, true);
  return c.json(await toPublicVideoResponse(video));
});

videoRoutes.patch("/:videoId", requireAuth, async (c) => {
  const { videoId } = videoParamSchema.parse(c.req.param());
  const body = updateVideoSchema.parse(await c.req.json());
  const user = getAuthUser(c);
  const currentVideo = await getVideoOrThrow(videoId);

  requireVideoOwner(currentVideo.ownerId, user.userId);

  const updatedVideo = await updateVideoMetadata(currentVideo, body);
  if (body.visibility && body.visibility !== currentVideo.visibility) {
    logAuditEvent("visibility_change", user.userId, {
      videoId: currentVideo.videoId,
      from: currentVideo.visibility,
      to: body.visibility
    });
  }

  return c.json(await toPublicVideoResponse(updatedVideo));
});

videoRoutes.delete("/:videoId", requireAuth, async (c) => {
  const { videoId } = videoParamSchema.parse(c.req.param());
  const user = getAuthUser(c);
  const currentVideo = await getVideoOrThrow(videoId);

  requireVideoOwner(currentVideo.ownerId, user.userId);
  await markVideoDeleted(currentVideo);

  logAuditEvent("video_delete", user.userId, {
    videoId: currentVideo.videoId
  });

  return c.json({ ok: true });
});
