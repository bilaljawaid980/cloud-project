import { Hono } from "hono";

import { corsMiddleware } from "./middleware/cors";
import { notFoundHandler, onError } from "./middleware/error";
import { loggerMiddleware, type AppVariables } from "./middleware/logger";
import { analyticsRoutes } from "./routes/analytics";
import { authRoutes } from "./routes/auth";
import { healthRoutes } from "./routes/health";
import { playbackRoutes } from "./routes/playback";
import { uploadRoutes } from "./routes/uploads";
import { videoRoutes } from "./routes/videos";

export const app = new Hono<{ Variables: AppVariables }>();

app.use("*", loggerMiddleware);
app.use("*", corsMiddleware);

app.route("/health", healthRoutes);
app.route("/auth", authRoutes);
app.route("/videos", videoRoutes);
app.route("/uploads", uploadRoutes);
app.route("/", playbackRoutes);
app.route("/", analyticsRoutes);

app.onError(onError);
app.notFound(notFoundHandler);
