# Bun Binary Deployment

## What `bun build --compile` Does

`bun build --compile` turns a Bun entrypoint into a standalone executable that bundles the runtime and your application code into one Linux binary.

## Build Commands

```bash
bun run build:api:binary
bun run build:cli:binary
```

## Running The API Binary

```bash
PORT=3001 ./dist/clipforge-api
```

The compiled API still reads configuration from environment variables. No source files need to exist beside the binary.

## Running The CLI Binary

```bash
./dist/clipforge health --url http://localhost:3001
./dist/clipforge estimate-cost --storage-gb 100 --egress-gb 50
```

## Normal Bun Runtime Vs Compiled Binary

- normal Bun runtime: easiest for local development and watch mode
- compiled binary: simpler ops footprint, fewer moving parts, useful for bare hosts and small containers

## Docker Binary Image

The binary Dockerfile compiles in a Bun builder image and copies only the executable into a small Debian runtime. `ca-certificates` is required so the AWS SDK can make HTTPS requests successfully.

## Lambda Considerations

ClipForge supports Lambda with a container image and the AWS Lambda Web Adapter. Lambda does not run the compiled binary directly in this repo because the container flow is more flexible for workspace installs and AWS environment wiring.

## Known Limitations

- avoid dynamic runtime file loading relative to the executable
- avoid native dependencies that require platform-specific shared libraries
- keep entrypoints straightforward and free of runtime path tricks
- remember that environment variables still supply secrets and deployment configuration
