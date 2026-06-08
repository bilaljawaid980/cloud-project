import * as path from "node:path";

import {
  CfnOutput,
  Duration,
  Fn,
  RemovalPolicy,
  Stack,
  type StackProps
} from "aws-cdk-lib";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as targets from "aws-cdk-lib/aws-route53-targets";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as sqs from "aws-cdk-lib/aws-sqs";
import { Construct } from "constructs";

export class ClipForgeStack extends Stack {
  public constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const isProd = (process.env.NODE_ENV ?? "development") === "production";
    const removalPolicy = isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY;
    const appOrigin = process.env.APP_ORIGIN ?? "http://localhost:5173";
    const appOrigins = appOrigin
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean);
    const apiBaseUrl = process.env.API_BASE_URL ?? "http://localhost:3000";
    const jwtSecret = process.env.JWT_SECRET ?? "replace-me-with-a-32-plus-char-secret";
    const appDomainName = process.env.APP_DOMAIN_NAME;
    const appHostedZoneName = process.env.APP_HOSTED_ZONE_NAME ?? appDomainName;
    const apiDomainName =
      process.env.API_DOMAIN_NAME ?? (appDomainName ? `api.${appDomainName}` : undefined);
    const lambdaDomainName =
      process.env.LAMBDA_DOMAIN_NAME ?? (appDomainName ? `lambda.${appDomainName}` : undefined);
    const repoRoot = path.join(__dirname, "../..");
    const appDomainAliases = appDomainName ? [appDomainName, `www.${appDomainName}`] : [];
    const apiDomainAliases = [apiDomainName, lambdaDomainName].filter(
      (domainName): domainName is string => Boolean(domainName)
    );
    const toHostedZoneRecordName = (domainName: string) => {
      if (!appHostedZoneName) {
        return domainName;
      }

      const suffix = `.${appHostedZoneName}`;
      return domainName.endsWith(suffix) ? domainName.slice(0, -suffix.length) : domainName;
    };
    const appHostedZone =
      appDomainName && appHostedZoneName
        ? route53.HostedZone.fromLookup(this, "AppHostedZone", {
            domainName: appHostedZoneName
          })
        : undefined;
    const frontendCertificate =
      appDomainName && appHostedZone
        ? new acm.Certificate(this, "FrontendCertificate", {
            domainName: appDomainName,
            subjectAlternativeNames: [`www.${appDomainName}`],
            validation: acm.CertificateValidation.fromDns(appHostedZone)
          })
        : undefined;
    const apiCertificate =
      apiDomainName && lambdaDomainName && appHostedZone
        ? new acm.Certificate(this, "ApiCertificate", {
            domainName: apiDomainName,
            subjectAlternativeNames: [lambdaDomainName],
            validation: acm.CertificateValidation.fromDns(appHostedZone)
          })
        : undefined;

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
          allowedOrigins: appOrigins,
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
      domainNames: appDomainAliases.length > 0 ? appDomainAliases : undefined,
      certificate: frontendCertificate,
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(frontendBucket),
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS
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

    if (appDomainName && appHostedZone) {
      new route53.ARecord(this, "FrontendRootAliasRecord", {
        zone: appHostedZone,
        recordName: appDomainName,
        target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(frontendDistribution))
      });

      new route53.ARecord(this, "FrontendWwwAliasRecord", {
        zone: appHostedZone,
        recordName: `www.${appDomainName}`,
        target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(frontendDistribution))
      });
    }

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
      file: "apps/api/Dockerfile.lambda",
      exclude: [
        ".git",
        ".codex-runtime",
        ".clipforge-storage",
        "node_modules",
        "**/node_modules",
        ".env",
        ".env.*",
        "dist",
        "apps/*/dist",
        "infra/cdk.out",
        "infra/dist",
        "infra/node_modules",
        "cdk.out"
      ]
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
        API_BASE_URL: apiBaseUrl,
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
      authType: lambda.FunctionUrlAuthType.NONE
    });

    const apiDistribution =
      apiDomainAliases.length > 0 && apiCertificate && appHostedZone
        ? new cloudfront.Distribution(this, "ApiDistribution", {
            domainNames: apiDomainAliases,
            certificate: apiCertificate,
            defaultBehavior: {
              origin: new origins.HttpOrigin(Fn.select(2, Fn.split("/", functionUrl.url)), {
                protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY
              }),
              allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
              cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
              originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
              viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS
            },
            priceClass: cloudfront.PriceClass.PRICE_CLASS_100
          })
        : undefined;

    if (apiDistribution && appHostedZone) {
      if (apiDomainName) {
        new route53.ARecord(this, "ApiAliasRecord", {
          zone: appHostedZone,
          recordName: toHostedZoneRecordName(apiDomainName),
          target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(apiDistribution))
        });
      }

      if (lambdaDomainName) {
        new route53.ARecord(this, "LambdaAliasRecord", {
          zone: appHostedZone,
          recordName: toHostedZoneRecordName(lambdaDomainName),
          target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(apiDistribution))
        });
      }
    }

    new CfnOutput(this, "FrontendUrl", {
      value: `https://${frontendDistribution.distributionDomainName}`
    });

    new CfnOutput(this, "FrontendDistributionId", {
      value: frontendDistribution.distributionId
    });

    if (appDomainName) {
      new CfnOutput(this, "CustomFrontendUrl", {
        value: `https://${appDomainName}`
      });

      new CfnOutput(this, "CustomWwwFrontendUrl", {
        value: `https://www.${appDomainName}`
      });
    }

    new CfnOutput(this, "VideoDistributionDomain", {
      value: videoDistribution.distributionDomainName
    });

    new CfnOutput(this, "VideoDistributionId", {
      value: videoDistribution.distributionId
    });

    new CfnOutput(this, "ApiUrl", {
      value: functionUrl.url
    });

    if (apiDomainName) {
      new CfnOutput(this, "CustomApiUrl", {
        value: `https://${apiDomainName}`
      });
    }

    if (lambdaDomainName) {
      new CfnOutput(this, "CustomLambdaUrl", {
        value: `https://${lambdaDomainName}`
      });
    }

    if (apiDistribution) {
      new CfnOutput(this, "ApiDistributionId", {
        value: apiDistribution.distributionId
      });

      new CfnOutput(this, "ApiDistributionDomain", {
        value: apiDistribution.distributionDomainName
      });
    }

    new CfnOutput(this, "TableName", {
      value: table.tableName
    });

    new CfnOutput(this, "FrontendBucketName", {
      value: frontendBucket.bucketName
    });

    new CfnOutput(this, "VideoOriginalsBucketName", {
      value: videoOriginalsBucket.bucketName
    });

    new CfnOutput(this, "VideoDerivedBucketName", {
      value: videoDerivedBucket.bucketName
    });
  }
}
