import { createMiddleware } from "hono/factory";

import { generateEventId } from "../utils/ids";

export interface AppVariables {
  requestId: string;
  user?: {
    userId: string;
    email: string;
    name?: string;
  };
}

export const loggerMiddleware = createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
  const requestId = c.req.header("x-request-id") ?? generateEventId();
  const startedAt = performance.now();

  c.set("requestId", requestId);

  await next();

  const durationMs = Math.round(performance.now() - startedAt);
  console.log(
    JSON.stringify({
      level: "info",
      requestId,
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      durationMs
    })
  );
});
