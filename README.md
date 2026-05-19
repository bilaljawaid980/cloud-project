# ClipForge

ClipForge is a Bun-first Loom-style screen recording platform that records in the browser, uploads video parts directly to S3, and shares playback links through CloudFront or presigned S3 URLs.

## Workspace

- `apps/api` — Hono API for auth, metadata, upload orchestration, and playback URLs
- `apps/web` — Vite + React frontend recorder and player
- `apps/worker` — SQS/Lambda-friendly async processing stub
- `apps/cli` — Bun CLI for operational tasks
- `packages/shared` — shared types, schemas, and constants
- `infra` — AWS CDK deployment stack

## Quick Start

1. Install dependencies with `bun install`
2. Copy `.env.example` to `.env`
3. Start the API with `bun run dev:api`
4. Start the frontend with `bun run dev:web`

## Build Targets

- Standard Bun runtime
- Standalone Bun API binary
- Standalone Bun CLI binary
- Lambda container image via AWS Lambda Web Adapter
