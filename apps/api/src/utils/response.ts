import { ApiError } from "./errors";

export const encodeCursor = (value: unknown): string =>
  Buffer.from(JSON.stringify(value), "utf8").toString("base64url");

export const decodeCursor = <T>(cursor: string | undefined): T | undefined => {
  if (!cursor) {
    return undefined;
  }

  try {
    const decoded = Buffer.from(cursor, "base64url").toString("utf8");
    return JSON.parse(decoded) as T;
  } catch {
    throw new ApiError(400, "INVALID_CURSOR", "Cursor is malformed.");
  }
};
