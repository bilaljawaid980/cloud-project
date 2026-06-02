# AWS Deployment

## Prerequisites

- AWS CLI configured with deployment credentials
- AWS CDK v2 CLI installed
- Docker installed locally
- Bun installed locally

## Bootstrap

```bash
cd infra
cdk bootstrap
```

## Deploy The Stack

```bash
cd infra
APP_DOMAIN_NAME=clipforged.xyz \
APP_HOSTED_ZONE_NAME=clipforged.xyz \
APP_ORIGIN=https://clipforged.xyz,https://www.clipforged.xyz,https://d1ny7x1rl0edk2.cloudfront.net \
API_BASE_URL=https://xmfe23zrnivkzaomrezacvyhve0wpank.lambda-url.us-east-1.on.aws/ \
JWT_SECRET=replace-with-a-long-secret \
bunx aws-cdk deploy --require-approval never
```

## Build The Frontend

```bash
bun install
API_BASE_URL=https://xmfe23zrnivkzaomrezacvyhve0wpank.lambda-url.us-east-1.on.aws/ \
DEV_MODE=false \
bun run build:web
```

## Sync Frontend Assets To S3

```bash
aws s3 sync apps/web/dist s3://clipforgestack-frontendbucketefe2e19c-5wgb7faigkjr --delete
```

## Invalidate Frontend CloudFront Cache

```bash
aws cloudfront create-invalidation \
  --distribution-id E1N6TCKPCMQBVV \
  --paths "/*"
```

## Build And Push The API Image

```bash
docker build -f apps/api/Dockerfile.lambda -t clipforge-api-lambda .
docker tag clipforge-api-lambda:latest ACCOUNT.dkr.ecr.REGION.amazonaws.com/clipforge-api:latest
docker push ACCOUNT.dkr.ecr.REGION.amazonaws.com/clipforge-api:latest
```

## Update The Lambda Image

Use `cdk deploy` after your image tag changes, or update the Lambda image URI manually if your delivery pipeline separates image build from infrastructure deployment.

## Environment Variables

Set these for the API Lambda:

- `NODE_ENV=production`
- `DEV_MODE=false`
- `APP_ORIGIN=https://clipforged.xyz,https://www.clipforged.xyz,https://d1ny7x1rl0edk2.cloudfront.net`
- `API_BASE_URL=https://xmfe23zrnivkzaomrezacvyhve0wpank.lambda-url.us-east-1.on.aws/`
- `DYNAMODB_TABLE=ClipForgeTable`
- `VIDEO_ORIGINALS_BUCKET=<bucket>`
- `VIDEO_DERIVED_BUCKET=<bucket>`
- `APP_ASSETS_BUCKET=<bucket>`
- `CLOUDFRONT_VIDEO_DOMAIN=<video distribution domain>`
- `JWT_SECRET=<32+ char secret>`

`AWS_REGION` is provided automatically by Lambda and should not be manually set in the Lambda environment.

For the current custom domain, Porkbun delegates `clipforged.xyz` to Route53 hosted zone `Z102718032TZCRUXUMFUO`. CDK manages the ACM certificate, CloudFront aliases, and Route53 alias records for `clipforged.xyz` and `www.clipforged.xyz`.

Optional:

- `CLOUDFRONT_KEY_PAIR_ID`
- `CLOUDFRONT_PRIVATE_KEY_BASE64`
- `MAX_UPLOAD_BYTES`
- `PRESIGNED_URL_EXPIRES_SECONDS`
- `UPLOAD_PART_SIZE_BYTES`

## Cleanup

```bash
cd infra
cdk destroy
```

If you deployed in production mode with retained buckets or tables, empty and remove those resources manually after destroy.
