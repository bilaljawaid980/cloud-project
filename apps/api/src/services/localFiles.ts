import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

import { config } from "../config/env";
import { addDays, nowIso } from "../utils/time";

const storageRoot = resolve(process.cwd(), ".clipforge-storage");

const ensureParentDirectory = async (absolutePath: string): Promise<void> => {
  await mkdir(dirname(absolutePath), { recursive: true });
};

export const getLocalStorageAbsolutePath = (objectKey: string): string =>
  join(storageRoot, ...objectKey.split("/"));

export const saveLocalObject = async (objectKey: string, bytes: Uint8Array): Promise<void> => {
  const absolutePath = getLocalStorageAbsolutePath(objectKey);
  await ensureParentDirectory(absolutePath);
  await writeFile(absolutePath, bytes);
};

export const localObjectUrl = (objectKey: string): string =>
  `${config.apiBaseUrl}/dev/files/${objectKey}`;

export const localObjectPlaybackResponse = (objectKey: string) => ({
  url: localObjectUrl(objectKey),
  mode: "s3-presigned" as const,
  expiresAt: addDays(nowIso(), 7)
});
