import { jwtVerify } from "jose";
import { createMiddleware } from "hono/factory";

import { config } from "../config/env";
import { ApiError } from "../utils/errors";
import type { AppVariables } from "./logger";

const secret = new TextEncoder().encode(config.jwtSecret);

export interface AuthUser {
  userId: string;
  email: string;
  name?: string;
}

const parseBearerToken = (headerValue: string | undefined): string | undefined => {
  if (!headerValue) {
    return undefined;
  }

  const [scheme, token] = headerValue.split(" ");
  if (scheme !== "Bearer" || !token) {
    throw new ApiError(401, "AUTH_INVALID", "Authorization header must use Bearer token format.");
  }

  return token;
};

const verifyAuthToken = async (token: string): Promise<AuthUser> => {
  const { payload } = await jwtVerify(token, secret, {
    algorithms: ["HS256"]
  });

  const userId = typeof payload.sub === "string" ? payload.sub : undefined;
  const email = typeof payload.email === "string" ? payload.email : undefined;
  const name = typeof payload.name === "string" ? payload.name : undefined;

  if (!userId || !email) {
    throw new ApiError(401, "AUTH_INVALID", "Token payload is invalid.");
  }

  return {
    userId,
    email,
    name
  };
};

export const optionalAuth = createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
  const token = parseBearerToken(c.req.header("authorization"));

  if (token) {
    c.set("user", await verifyAuthToken(token));
  }

  await next();
});

export const requireAuth = createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
  const token = parseBearerToken(c.req.header("authorization"));
  if (!token) {
    throw new ApiError(401, "AUTH_REQUIRED", "Authentication is required.");
  }

  c.set("user", await verifyAuthToken(token));
  await next();
});

export const getAuthUser = (c: { get: <K extends keyof AppVariables>(key: K) => AppVariables[K] }): AuthUser => {
  const user = c.get("user");
  if (!user) {
    throw new ApiError(401, "AUTH_REQUIRED", "Authentication is required.");
  }

  return user;
};

export const requireVideoOwner = (ownerId: string, userId: string): void => {
  if (ownerId !== userId) {
    throw new ApiError(403, "VIDEO_FORBIDDEN", "You do not own this video.");
  }
};
