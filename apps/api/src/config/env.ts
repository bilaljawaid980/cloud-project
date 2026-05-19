import { DEFAULT_PART_SIZE, MIN_PART_SIZE } from "@clipforge/shared/constants";
import { z } from "zod";

const emptyToUndefined = (value: unknown): unknown => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
};

const booleanFromString = z.preprocess((value) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value.trim().toLowerCase() === "true";
  }

  return false;
}, z.boolean());

const numberFromString = (defaultValue?: number) =>
  z.preprocess((value) => {
    if (value === undefined || value === null || value === "") {
      return defaultValue;
    }

    if (typeof value === "number") {
      return value;
    }

    if (typeof value === "string") {
      return Number(value);
    }

    return value;
  }, z.number().int().positive());

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DEV_MODE: booleanFromString.default(false),
  PORT: numberFromString(3000),
  APP_ORIGIN: z.string().min(1),
  API_BASE_URL: z.string().url(),
  AWS_REGION: z.string().min(1),
  AWS_ACCESS_KEY_ID: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  AWS_SECRET_ACCESS_KEY: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  DYNAMODB_TABLE: z.string().min(1),
  VIDEO_ORIGINALS_BUCKET: z.string().min(1),
  VIDEO_DERIVED_BUCKET: z.string().min(1),
  APP_ASSETS_BUCKET: z.string().min(1),
  CLOUDFRONT_VIDEO_DOMAIN: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  CLOUDFRONT_KEY_PAIR_ID: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  CLOUDFRONT_PRIVATE_KEY_BASE64: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  JWT_SECRET: z.string().min(1),
  MAX_UPLOAD_BYTES: numberFromString(1024 * 1024 * 1024),
  PRESIGNED_URL_EXPIRES_SECONDS: numberFromString(900),
  UPLOAD_PART_SIZE_BYTES: numberFromString(DEFAULT_PART_SIZE)
});

type RawEnv = z.infer<typeof envSchema>;

const parseEnv = (): RawEnv => {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const message = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");

    throw new Error(`ClipForge API startup error: invalid environment configuration. ${message}`);
  }

  return parsed.data;
};

const rawEnv = parseEnv();

if (rawEnv.NODE_ENV === "production" && rawEnv.JWT_SECRET.length < 32) {
  throw new Error("ClipForge API startup error: JWT_SECRET must be at least 32 characters in production.");
}

if (rawEnv.UPLOAD_PART_SIZE_BYTES < MIN_PART_SIZE) {
  throw new Error(
    `ClipForge API startup error: UPLOAD_PART_SIZE_BYTES must be at least ${MIN_PART_SIZE}.`
  );
}

if (
  (rawEnv.AWS_ACCESS_KEY_ID && !rawEnv.AWS_SECRET_ACCESS_KEY) ||
  (!rawEnv.AWS_ACCESS_KEY_ID && rawEnv.AWS_SECRET_ACCESS_KEY)
) {
  throw new Error(
    "ClipForge API startup error: AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY must be provided together."
  );
}

export const config = {
  nodeEnv: rawEnv.NODE_ENV,
  devMode: rawEnv.DEV_MODE,
  port: rawEnv.PORT,
  appOrigin: rawEnv.APP_ORIGIN,
  appOrigins: rawEnv.APP_ORIGIN.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  apiBaseUrl: rawEnv.API_BASE_URL,
  awsRegion: rawEnv.AWS_REGION,
  awsAccessKeyId: rawEnv.AWS_ACCESS_KEY_ID,
  awsSecretAccessKey: rawEnv.AWS_SECRET_ACCESS_KEY,
  dynamoTable: rawEnv.DYNAMODB_TABLE,
  videoOriginalsBucket: rawEnv.VIDEO_ORIGINALS_BUCKET,
  videoDerivedBucket: rawEnv.VIDEO_DERIVED_BUCKET,
  appAssetsBucket: rawEnv.APP_ASSETS_BUCKET,
  cloudfrontVideoDomain: rawEnv.CLOUDFRONT_VIDEO_DOMAIN,
  cloudfrontKeyPairId: rawEnv.CLOUDFRONT_KEY_PAIR_ID,
  cloudfrontPrivateKeyBase64: rawEnv.CLOUDFRONT_PRIVATE_KEY_BASE64,
  jwtSecret: rawEnv.JWT_SECRET,
  maxUploadBytes: rawEnv.MAX_UPLOAD_BYTES,
  presignedUrlExpiresSeconds: rawEnv.PRESIGNED_URL_EXPIRES_SECONDS,
  uploadPartSizeBytes: rawEnv.UPLOAD_PART_SIZE_BYTES
} as const;

export type AppConfig = typeof config;
