import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
  UploadPartCommand
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { UploadPart } from "@clipforge/shared/types";

import { config } from "../config/env";
import { addSeconds, nowIso } from "../utils/time";

const credentials =
  config.awsAccessKeyId && config.awsSecretAccessKey
    ? {
        accessKeyId: config.awsAccessKeyId,
        secretAccessKey: config.awsSecretAccessKey
      }
    : undefined;

const s3Client = new S3Client({
  region: config.awsRegion,
  credentials
});

const extensionFromMimeType = (mimeType: string): string => {
  if (mimeType === "video/mp4") {
    return "mp4";
  }

  if (mimeType === "video/webm") {
    return "webm";
  }

  return "bin";
};

export const buildOriginalObjectKey = (ownerId: string, videoId: string, mimeType: string): string =>
  `originals/${ownerId}/${videoId}/original.${extensionFromMimeType(mimeType)}`;

export const createMultipartUpload = async (
  ownerId: string,
  videoId: string,
  mimeType: string
): Promise<{ objectKey: string; s3UploadId: string }> => {
  const objectKey = buildOriginalObjectKey(ownerId, videoId, mimeType);
  const result = await s3Client.send(
    new CreateMultipartUploadCommand({
      Bucket: config.videoOriginalsBucket,
      Key: objectKey,
      ContentType: mimeType
    })
  );

  if (!result.UploadId) {
    throw new Error("S3 multipart upload did not return an upload ID.");
  }

  return {
    objectKey,
    s3UploadId: result.UploadId
  };
};

export const getMultipartUploadPartUrls = async (
  objectKey: string,
  s3UploadId: string,
  partNumbers: number[]
): Promise<Array<{ partNumber: number; url: string; expiresAt: string }>> => {
  const issuedAt = nowIso();
  const expiresAt = addSeconds(issuedAt, config.presignedUrlExpiresSeconds);

  const urls = await Promise.all(
    partNumbers.map(async (partNumber) => {
      const url = await getSignedUrl(
        s3Client,
        new UploadPartCommand({
          Bucket: config.videoOriginalsBucket,
          Key: objectKey,
          UploadId: s3UploadId,
          PartNumber: partNumber
        }),
        {
          expiresIn: config.presignedUrlExpiresSeconds
        }
      );

      return {
        partNumber,
        url,
        expiresAt
      };
    })
  );

  return urls;
};

export const completeMultipartUpload = async (
  objectKey: string,
  s3UploadId: string,
  parts: UploadPart[]
): Promise<void> => {
  await s3Client.send(
    new CompleteMultipartUploadCommand({
      Bucket: config.videoOriginalsBucket,
      Key: objectKey,
      UploadId: s3UploadId,
      MultipartUpload: {
        Parts: parts
          .slice()
          .sort((left, right) => left.partNumber - right.partNumber)
          .map((part) => ({
            ETag: part.etag,
            PartNumber: part.partNumber
          }))
      }
    })
  );
};

export const abortMultipartUpload = async (objectKey: string, s3UploadId: string): Promise<void> => {
  await s3Client.send(
    new AbortMultipartUploadCommand({
      Bucket: config.videoOriginalsBucket,
      Key: objectKey,
      UploadId: s3UploadId
    })
  );
};

export const putDerivedObject = async (
  key: string,
  body: Uint8Array,
  contentType: string
): Promise<void> => {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: config.videoDerivedBucket,
      Key: key,
      Body: body,
      ContentType: contentType
    })
  );
};

export const createPresignedGetUrl = async (
  bucket: string,
  key: string,
  expiresIn: number
): Promise<string> =>
  getSignedUrl(
    s3Client,
    new GetObjectCommand({
      Bucket: bucket,
      Key: key
    }),
    { expiresIn }
  );
