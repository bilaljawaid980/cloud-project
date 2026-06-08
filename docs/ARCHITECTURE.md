# ClipForge Architecture

# System Overview

ClipForge is a Bun monorepo built around one core rule: large video payloads never pass through the API. The browser records with native media APIs, uploads parts directly to S3 with presigned URLs, and the API only coordinates metadata, auth, access control, and playback signing.

## Upload And Playback Flow

```mermaid
flowchart TD
  A[Browser Recorder] --> B[POST /videos]
  B --> C[Hono API on Bun]
  C --> D[DynamoDB metadata]
  A --> E[POST /uploads/multipart/init]
  E --> C
  C --> F[Presigned S3 multipart URLs]
  A --> G[S3 video originals bucket]
  A --> H[POST /uploads/multipart/complete]
  H --> C
  C --> I[S3 derived bucket thumbnail]
  C --> D
  J[Viewer] --> K[GET /share/:shareSlug]
  K --> C
  C --> D
  J --> L[POST /videos/:videoId/playback-url]
  L --> C
  C --> M[CloudFront signed URL or S3 presigned GET]
  J --> N[CloudFront video distribution]
```

## DynamoDB Access Patterns

```mermaid
flowchart LR
  U[USER#userId / PROFILE] --> P[User profile]
  V[USER#ownerId / VIDEO#createdAt#videoId] --> M[Video metadata]
  G1[VIDEO#videoId / METADATA on GSI1] --> M
  G2[SHARE#shareSlug / VIDEO on GSI2] --> M
  S[USER#ownerId / UPLOAD#uploadId] --> Q[Upload session]
  Q1[UPLOAD#uploadId / SESSION on GSI1] --> Q
  W[VIDEO#videoId / VIEW#createdAt#eventId] --> E[View event]
  R[SHARE#shareSlug / REF] --> M
```

## Recording Pipeline

1. The web app chooses the best supported MIME type via `MediaRecorder.isTypeSupported`.
2. Recording modes switch between screen, screen+mic, screen+camera+mic, and camera-only capture.
3. Media chunks stay in refs and never trigger React state updates per chunk.
4. A thumbnail is generated from the recorded video element with canvas APIs.
5. The upload client slices the blob, requests presigned URLs in batches, uploads with concurrency `3`, and finalizes the multipart upload.

## Binary Deployment Model

The API and CLI are both Bun-native first-class targets. The API can run as:

- `bun apps/api/src/server.ts`
- a compiled Linux binary via `bun build --compile`
- a Lambda container using the AWS Lambda Web Adapter

The CLI ships as a single compiled executable for lightweight admin workflows.

## Post-MVP Roadmap

- HLS transcoding and derived playback formats
- resumable multipart uploads via IndexedDB
- WebCodecs compression before upload
- AI transcript, summary, chapters, and speaker analysis
- team workspaces, comments, reactions, and webhook integrations
