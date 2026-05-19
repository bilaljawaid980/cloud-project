import { getSignedUrl as getCloudFrontSignedUrl } from "@aws-sdk/cloudfront-signer";

import { config } from "../config/env";

export const isCloudFrontSigningConfigured = (): boolean =>
  Boolean(
    !config.devMode &&
      config.cloudfrontVideoDomain &&
      config.cloudfrontKeyPairId &&
      config.cloudfrontPrivateKeyBase64
  );

export const createCloudFrontSignedUrl = (objectKey: string, expiresAt: string): string => {
  if (!isCloudFrontSigningConfigured()) {
    throw new Error("CloudFront signing is not configured.");
  }

  const privateKey = Buffer.from(config.cloudfrontPrivateKeyBase64 ?? "", "base64").toString("utf8");
  const url = `https://${config.cloudfrontVideoDomain}/${objectKey}`;

  return getCloudFrontSignedUrl({
    url,
    keyPairId: config.cloudfrontKeyPairId ?? "",
    privateKey,
    dateLessThan: new Date(expiresAt).toISOString()
  });
};
