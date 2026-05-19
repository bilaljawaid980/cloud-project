import { cors } from "hono/cors";

import { config } from "../config/env";

export const corsMiddleware = cors({
  origin: config.appOrigins,
  allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
  exposeHeaders: ["ETag"],
  credentials: true
});
