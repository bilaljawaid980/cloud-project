const encoder = new TextEncoder();

export const sha256Hex = async (value: string): Promise<string> => {
  const bytes = encoder.encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

export const hashViewerValue = async (value: string | null | undefined): Promise<string | undefined> => {
  if (!value) {
    return undefined;
  }

  const digest = await sha256Hex(value);
  return digest.slice(0, 32);
};

export const decodeBase64 = (value: string): Uint8Array => {
  const buffer = Buffer.from(value, "base64");
  return new Uint8Array(buffer);
};
