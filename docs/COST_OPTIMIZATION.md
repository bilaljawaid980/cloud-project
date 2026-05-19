# Cost Optimization

## Why Video Bypasses API Lambda

Routing uploads through Lambda would multiply request count, duration, memory pressure, and network transfer cost. ClipForge avoids that by presigning multipart uploads and letting the browser stream directly to S3.

## S3 Storage Costs

Raw recordings land in the originals bucket. At roughly `$0.023/GB/month`, storage is predictable and cheap for MVP workloads, especially when lifecycle rules abort incomplete uploads and move older content toward Intelligent-Tiering.

## CloudFront Egress Costs

CloudFront is the playback edge. The CLI estimate model uses `$0.0085/GB` for egress and `PRICE_CLASS_100` to keep the footprint cost-conscious.

## Why DynamoDB On-Demand Fits MVP

On-demand capacity avoids overprovisioning and matches bursty creator activity. ClipForge also avoids scans entirely, so request-based billing stays efficient.

## Lifecycle Cleanup

- abort incomplete multipart uploads after 1 day
- expire `deleted=true` tagged objects after 7 days
- transition older originals toward Intelligent-Tiering after 30 days

## When To Add MediaConvert

Add MediaConvert or another transcode stage only when:

- viewers need adaptive bitrate playback
- cross-browser codec support becomes a bottleneck
- source file sizes become too expensive to serve directly

## Example Cost Scenarios

These are rough directional estimates using the CLI assumptions, not production billing guarantees.

### 10 users / 100 videos

- Storage: ~100 GB -> `$2.30/month`
- Egress: ~50 GB -> `$0.43/month`
- DynamoDB and PUT traffic: typically under `$1/month`

### 100 users / 1000 videos

- Storage: ~1000 GB -> `$23.00/month`
- Egress: ~500 GB -> `$4.25/month`
- DynamoDB and PUT traffic: low single digits unless analytics volume spikes

### 1000 users / 10000 videos

- Storage: ~10,000 GB -> `$230.00/month`
- Egress: ~5000 GB -> `$42.50/month`
- DynamoDB and PUT traffic: still moderate relative to media delivery, but this is the stage where lifecycle, quotas, and derived streaming formats matter more
