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

const toBase64 = (bytes: Uint8Array): string => Buffer.from(bytes).toString("base64");

const fromBase64 = (value: string): Uint8Array => new Uint8Array(Buffer.from(value, "base64"));

const toArrayBuffer = (bytes: Uint8Array): ArrayBuffer => {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
};

const constantTimeEqual = (left: Uint8Array, right: Uint8Array): boolean => {
  if (left.byteLength !== right.byteLength) {
    return false;
  }

  let diff = 0;
  for (let index = 0; index < left.byteLength; index += 1) {
    diff |= (left[index] ?? 0) ^ (right[index] ?? 0);
  }

  return diff === 0;
};

const derivePasswordBytes = async (
  password: string,
  salt: Uint8Array,
  iterations: number
): Promise<Uint8Array> => {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: toArrayBuffer(salt),
      iterations
    },
    key,
    256
  );

  return new Uint8Array(bits);
};

export const hashPassword = async (password: string): Promise<string> => {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iterations = 210_000;
  const hash = await derivePasswordBytes(password, salt, iterations);

  return `pbkdf2-sha256$${iterations}$${toBase64(salt)}$${toBase64(hash)}`;
};

export const verifyPassword = async (password: string, encodedHash: string): Promise<boolean> => {
  const [algorithm, iterationsValue, saltValue, hashValue] = encodedHash.split("$");
  if (algorithm !== "pbkdf2-sha256" || !iterationsValue || !saltValue || !hashValue) {
    return false;
  }

  const iterations = Number(iterationsValue);
  if (!Number.isInteger(iterations) || iterations <= 0) {
    return false;
  }

  const salt = fromBase64(saltValue);
  const expectedHash = fromBase64(hashValue);
  const actualHash = await derivePasswordBytes(password, salt, iterations);

  return constantTimeEqual(actualHash, expectedHash);
};
