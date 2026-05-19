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
APP_ORIGIN=https://your-frontend-domain.example \
JWT_SECRET=replace-with-a-long-secret \
cdk deploy
```

## Build The Frontend

```bash
bun install
bun run build:web
```

## Sync Frontend Assets To S3

```bash
aws s3 sync apps/web/dist s3://clipforge-app-assets --delete
```

## Invalidate Frontend CloudFront Cache

```bash
aws cloudfront create-invalidation \
  --distribution-id YOUR_FRONTEND_DISTRIBUTION_ID \
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
- `APP_ORIGIN=<frontend origin>`
- `AWS_REGION=<region>`
- `DYNAMODB_TABLE=ClipForgeTable`
- `VIDEO_ORIGINALS_BUCKET=<bucket>`
- `VIDEO_DERIVED_BUCKET=<bucket>`
- `APP_ASSETS_BUCKET=<bucket>`
- `CLOUDFRONT_VIDEO_DOMAIN=<video distribution domain>`
- `JWT_SECRET=<32+ char secret>`

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
