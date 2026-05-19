import { customAlphabet, nanoid } from "nanoid";

import { sha256Hex } from "./crypto";

const shareSlugGenerator = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 10);

export const generateVideoId = (): string => nanoid(21);
export const generateUploadId = (): string => nanoid(21);
export const generateEventId = (): string => nanoid(12);
export const generateShareSlug = (): string => shareSlugGenerator();

export const deriveUserId = async (email: string): Promise<string> => {
  const normalized = email.trim().toLowerCase();
  const digest = await sha256Hex(normalized);
  return `usr_${digest.slice(0, 21)}`;
};
