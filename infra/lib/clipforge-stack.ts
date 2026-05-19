import * as path from "node:path";

import {
  CfnOutput,
  Duration,
  RemovalPolicy,
  Stack,
  type StackProps
} from "aws-cdk-lib";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as sqs from "aws-cdk-lib/aws-sqs";
import { Construct } from "constructs";

export class ClipForgeStack extends Stack {
  public constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const isProd = (process.env.NODE_ENV ?? "development") === "production";
    const removalPolicy = isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY;
    const appOrigin = process.env.APP_ORIGIN ?? "http://localhost:5173";
    const jwtSecret = process.env.JWT_SECRET ?? "replace-me-with-a-32-plus-char-secret";
    const repoRoot = path.join(__dirname, "../..");

    const frontendBucket = new s3.Bucket(this, "FrontendBucket", {
      bucketName: process.env.APP_ASSETS_BUCKET,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: false,
      removalPolicy,
      autoDeleteObjects: !isProd
    });

    const videoOriginalsBucket = new s3.Bucket(this, "VideoOriginalsBucket", {
      bucketName: process.env.VIDEO_ORIGINALS_BUCKET,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: false,
      removalPolicy,
      autoDeleteObjects: !isProd,
      cors: [
        {
          allowedHeaders: ["*"],
          allowedMethods: [s3.HttpMethods.PUT],
          allowedOrigins: [appOrigin],
          exposedHeaders: ["ETag"],
          maxAge: 3000
        }
      ],
      lifecycleRules: [
        {
          abortIncompleteMultipartUploadAfter: Duration.days(1),
          enabled: true
        },
        {
          enabled: true,
          expiration: Duration.days(7),
          tagFilters: {
            deleted: "true"
          }
        },
        {
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INTELLIGENT_TIERING,
              transitionAfter: Duration.days(30)
            }
          ]
        }
      ]
    });

    const videoDerivedBucket = new s3.Bucket(this, "VideoDerivedBucket", {
      bucketName: process.env.VIDEO_DERIVED_BUCKET,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: false,
      removalPolicy,
      autoDeleteObjects: !isProd
    });

    const frontendDistribution = new cloudfront.Distribution(this, "FrontendDistribution", {
      defaultRootObject: "index.html",
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(frontendBucket),
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED
      },
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: "/index.html"
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: "/index.html"
        }
      ],
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100
    });

    const videoDistribution = new cloudfront.Distribution(this, "VideoDistribution", {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(videoOriginalsBucket),
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS
      },
      additionalBehaviors: {
        "thumbnails/*": {
          origin: origins.S3BucketOrigin.withOriginAccessControl(videoDerivedBucket),
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS
        }
      },
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100
    });

    const table = new dynamodb.Table(this, "ClipForgeTable", {
      tableName: process.env.DYNAMODB_TABLE ?? "ClipForgeTable",
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: {
        name: "pk",
        type: dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: "sk",
        type: dynamodb.AttributeType.STRING
      },
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true
      },
      removalPolicy
    });

    table.addGlobalSecondaryIndex({
      indexName: "GSI1",
      partitionKey: {
        name: "gsi1pk",
        type: dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: "gsi1sk",
        type: dynamodb.AttributeType.STRING
      },
      projectionType: dynamodb.ProjectionType.ALL
    });

    table.addGlobalSecondaryIndex({
      indexName: "GSI2",
      partitionKey: {
        name: "gsi2pk",
        type: dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: "gsi2sk",
        type: dynamodb.AttributeType.STRING
      },
      projectionType: dynamodb.ProjectionType.INCLUDE,
      nonKeyAttributes: ["videoId", "ownerId", "visibility"]
    });

    const deadLetterQueue = new sqs.Queue(this, "ProcessingDlq", {
      retentionPeriod: Duration.days(14)
    });

    const processingQueue = new sqs.Queue(this, "ProcessingQueue", {
      visibilityTimeout: Duration.seconds(60),
      deadLetterQueue: {
        maxReceiveCount: 5,
        queue: deadLetterQueue
      }
    });

    const apiImage = lambda.DockerImageCode.fromImageAsset(repoRoot, {
      file: "apps/api/Dockerfile.lambda"
    });

    const apiFunction = new lambda.DockerImageFunction(this, "ApiFunction", {
      code: apiImage,
      architecture: lambda.Architecture.X86_64,
      memorySize: 512,
      timeout: Duration.seconds(30),
      environment: {
        NODE_ENV: isProd ? "production" : "development",
        DEV_MODE: isProd ? "false" : "true",
        PORT: "8080",
        APP_ORIGIN: appOrigin,
        API_BASE_URL: "http://localhost:3000",
        AWS_REGION: this.region,
        DYNAMODB_TABLE: table.tableName,
        VIDEO_ORIGINALS_BUCKET: videoOriginalsBucket.bucketName,
        VIDEO_DERIVED_BUCKET: videoDerivedBucket.bucketName,
        APP_ASSETS_BUCKET: frontendBucket.bucketName,
        CLOUDFRONT_VIDEO_DOMAIN: videoDistribution.distributionDomainName,
        JWT_SECRET: jwtSecret,
        MAX_UPLOAD_BYTES: process.env.MAX_UPLOAD_BYTES ?? "1073741824",
        PRESIGNED_URL_EXPIRES_SECONDS: process.env.PRESIGNED_URL_EXPIRES_SECONDS ?? "900",
        UPLOAD_PART_SIZE_BYTES: process.env.UPLOAD_PART_SIZE_BYTES ?? "16777216"
      }
    });

    const tableIndexesArn = `${table.tableArn}/index/*`;

    apiFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["s3:PutObject", "s3:AbortMultipartUpload", "s3:GetObject"],
        resources: [`${videoOriginalsBucket.bucketArn}/*`]
      })
    );

    apiFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["s3:PutObject", "s3:GetObject"],
        resources: [`${videoDerivedBucket.bucketArn}/*`]
      })
    );

    apiFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem", "dynamodb:Query"],
        resources: [table.tableArn, tableIndexesArn]
      })
    );

    apiFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["sqs:SendMessage"],
        resources: [processingQueue.queueArn]
      })
    );

    const functionUrl = apiFunction.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      cors: {
        allowedOrigins: [appOrigin],
        allowedMethods: [lambda.HttpMethod.ALL],
        allowedHeaders: ["Content-Type", "Authorization"],
        exposedHeaders: ["ETag"]
      }
    });

    new CfnOutput(this, "FrontendUrl", {
      value: `https://${frontendDistribution.distributionDomainName}`
    });

    new CfnOutput(this, "VideoDistributionDomain", {
      value: videoDistribution.distributionDomainName
    });

    new CfnOutput(this, "ApiUrl", {
      value: functionUrl.url
    });

    new CfnOutput(this, "TableName", {
      value: table.tableName
    });

    new CfnOutput(this, "VideoOriginalsBucket", {
      value: videoOriginalsBucket.bucketName
    });

    new CfnOutput(this, "VideoDerivedBucket", {
      value: videoDerivedBucket.bucketName
    });
  }
}
