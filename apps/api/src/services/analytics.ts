import type { ViewEvent } from "@clipforge/shared/types";

import { countViewEvents, createViewEvent } from "../db/accessPatterns";
import { hashViewerValue } from "../utils/crypto";
import { generateEventId } from "../utils/ids";
import { nowIso } from "../utils/time";

export const logAuditEvent = (
  action: "upload_init" | "upload_complete" | "upload_abort" | "visibility_change" | "video_delete",
  actorUserId: string,
  payload: Record<string, unknown>
): void => {
  console.log(
    JSON.stringify({
      level: "info",
      type: "audit",
      action,
      actorUserId,
      ...payload
    })
  );
};

export const recordViewEvent = async (input: {
  videoId: string;
  ownerId?: string;
  watchedMs: number;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<ViewEvent> => {
  const event: ViewEvent = {
    eventId: generateEventId(),
    videoId: input.videoId,
    ownerId: input.ownerId,
    watchedMs: input.watchedMs,
    ipHash: await hashViewerValue(input.ipAddress),
    userAgentHash: await hashViewerValue(input.userAgent),
    createdAt: nowIso()
  };

  return createViewEvent(event);
};

export const getViewCount = async (videoId: string): Promise<number> => countViewEvents(videoId);
