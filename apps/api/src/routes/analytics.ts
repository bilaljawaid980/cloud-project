import { Hono } from "hono";
import { z } from "zod";

import { optionalAuth } from "../middleware/auth";
import type { AppVariables } from "../middleware/logger";
import { recordViewEvent } from "../services/analytics";
import { assertVideoAccess, getVideoOrThrow } from "../services/videos";

const videoParamSchema = z.object({
  videoId: z.string().min(1)
});

const viewEventSchema = z.object({
  watchedMs: z.number().int().min(0).max(24 * 60 * 60 * 1000)
});

export const analyticsRoutes = new Hono<{ Variables: AppVariables }>();

analyticsRoutes.post("/videos/:videoId/view-events", optionalAuth, async (c) => {
  const { videoId } = videoParamSchema.parse(c.req.param());
  const body = viewEventSchema.parse(await c.req.json());
  const user = c.get("user");
  const video = await getVideoOrThrow(videoId);

  assertVideoAccess(video, user?.userId, true);

  const forwardedFor = c.req.header("x-forwarded-for");
  const ipAddress = forwardedFor?.split(",")[0]?.trim();

  await recordViewEvent({
    videoId,
    ownerId: user?.userId,
    watchedMs: body.watchedMs,
    ipAddress,
    userAgent: c.req.header("user-agent")
  });

  return c.json({ accepted: true }, 202);
});
