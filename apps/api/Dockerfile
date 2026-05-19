FROM oven/bun:1-slim

WORKDIR /app

COPY package.json bun.lock ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN bun install --frozen-lockfile

COPY packages/shared packages/shared
COPY apps/api apps/api

EXPOSE 3000

CMD ["bun", "apps/api/src/server.ts"]
