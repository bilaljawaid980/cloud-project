# Security

## Dev Auth Model

MVP auth uses a developer login endpoint that issues `HS256` JWTs with `jose`. The API derives a stable `userId` from email via SHA-256 and never trusts ownership fields from request bodies.

## Replacing Dev Auth With Cognito

Production migration can swap the dev login route for Cognito user pools or another IdP while keeping the rest of the authorization model mostly unchanged:

- validate external JWTs in middleware
- map identity claims to `userId`
- keep video ownership checks server-side

## S3 Privacy

All buckets stay private and use `BlockPublicAccess.BLOCK_ALL`. The application serves content either through CloudFront signed URLs or S3 presigned GET URLs in development mode.

## CloudFront OAC

CloudFront sits in front of private S3 buckets so the buckets never need public policies for playback or thumbnails.

## Signed URL Lifetimes

- private videos: 1 hour via CloudFront signer
- unlisted videos: 24 hours via CloudFront signer
- public videos: 7 days via CloudFront signer
- development fallback: S3 presigned GET URLs using `PRESIGNED_URL_EXPIRES_SECONDS`

## Upload Validation

The API validates:

- authenticated owner
- allowed MIME types
- file size ceiling
- upload session status
- upload session expiry
- multipart ownership before part URL issuance, completion, or abort

## Why S3 CORS Must Expose `ETag`

The browser needs the `ETag` response header from every `UploadPart` request so it can build the final `CompleteMultipartUpload` payload. Without `ExposeHeaders: ETag`, multipart completion breaks.

## IAM Policy Summary

API Lambda:

- `s3:PutObject`, `s3:AbortMultipartUpload`, and dev-only `s3:GetObject`
- `dynamodb:GetItem`, `PutItem`, `UpdateItem`, `Query`
- `sqs:SendMessage` if async processing is enabled

Worker Lambda target:

- `s3:GetObject` on originals
- `s3:PutObject` on derived
- `dynamodb:UpdateItem` on the table

## Analytics Privacy

View events hash IP and user-agent with SHA-256 and store only the first 32 hex characters. Raw viewer identifiers are never persisted.

## Production Hardening Checklist

- replace dev auth with Cognito or another managed IdP
- rotate `JWT_SECRET` and secrets through AWS Secrets Manager
- add WAF and rate limits to the API URL or CloudFront layer
- enable CloudFront signed URL key rotation
- tighten S3 `GetObject` permissions once dev fallback is removed
- add moderation, retention, and incident logging policies
