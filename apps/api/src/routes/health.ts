import { Hono } from "hono";

import { nowIso } from "../utils/time";
import type { AppVariables } from "../middleware/logger";

export const healthRoutes = new Hono<{ Variables: AppVariables }>();

healthRoutes.get("/", (c) =>
  c.json({
    ok: true,
    runtime: "bun",
    version: Bun.version,
    timestamp: nowIso()
  })
);
