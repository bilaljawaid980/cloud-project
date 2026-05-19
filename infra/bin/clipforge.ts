#!/usr/bin/env bun
import * as cdk from "aws-cdk-lib";

import { ClipForgeStack } from "../lib/clipforge-stack";

const app = new cdk.App();

new ClipForgeStack(app, "ClipForgeStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? process.env.AWS_REGION ?? "us-east-1"
  }
});
