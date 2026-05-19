import { MAX_THUMBNAIL_BYTES } from "@clipforge/shared/constants";

import { config } from "../config/env";
import { decodeBase64 } from "../utils/crypto";
import { saveLocalObject } from "./localFiles";
import { putDerivedObject } from "./s3";

export const buildThumbnailObjectKey = (videoId: string): string => `thumbnails/${videoId}.jpg`;

export const uploadThumbnailBase64 = async (
  videoId: string,
  thumbnailBase64: string | undefined
): Promise<string | undefined> => {
  if (!thumbnailBase64) {
    return undefined;
  }

  try {
    const bytes = decodeBase64(thumbnailBase64);

    if (bytes.byteLength > MAX_THUMBNAIL_BYTES) {
      return undefined;
    }

    const key = buildThumbnailObjectKey(videoId);
    if (config.devMode) {
      await saveLocalObject(key, bytes);
    } else {
      await putDerivedObject(key, bytes, "image/jpeg");
    }
    return key;
  } catch (error) {
    console.warn(
      JSON.stringify({
        level: "warn",
        event: "thumbnail_upload_skipped",
        videoId,
        reason: error instanceof Error ? error.message : "unknown"
      })
    );
    return undefined;
  }
};
