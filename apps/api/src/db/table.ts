import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

import { config } from "../config/env";

const credentials =
  config.awsAccessKeyId && config.awsSecretAccessKey
    ? {
        accessKeyId: config.awsAccessKeyId,
        secretAccessKey: config.awsSecretAccessKey,
        sessionToken: config.awsSessionToken
      }
    : undefined;

const dynamoClient = new DynamoDBClient({
  region: config.awsRegion,
  credentials
});

export const documentClient = DynamoDBDocumentClient.from(dynamoClient, {
  marshallOptions: {
    removeUndefinedValues: true
  }
});
