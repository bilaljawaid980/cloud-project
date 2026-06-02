import { SignJWT } from "jose";
import { Hono, type Context } from "hono";
import { z } from "zod";

import { config } from "../config/env";
import { getUserProfile, upsertUserProfile } from "../db/accessPatterns";
import type { AppVariables } from "../middleware/logger";
import { ApiError } from "../utils/errors";
import { hashPassword, verifyPassword } from "../utils/crypto";
import { deriveUserId } from "../utils/ids";
import { addDays, nowIso } from "../utils/time";

const registerSchema = z.object({
  email: z.string().trim().email(),
  name: z.string().trim().min(1).max(200).optional(),
  password: z.string().min(8).max(200)
});

const signInSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1).max(200)
});

const secret = new TextEncoder().encode(config.jwtSecret);

export const authRoutes = new Hono<{ Variables: AppVariables }>();

const createSessionResponse = async (profile: {
  userId: string;
  email: string;
  name?: string;
}) => {
  const timestamp = nowIso();
  const expiresAt = addDays(timestamp, 7);
  const token = await new SignJWT({
    email: profile.email,
    name: profile.name
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(profile.userId)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  return {
    token,
    userId: profile.userId,
    email: profile.email,
    name: profile.name,
    expiresAt
  };
};

authRoutes.post("/register", async (c) => {
  const body = registerSchema.parse(await c.req.json());
  const email = body.email.trim().toLowerCase();
  const userId = await deriveUserId(email);
  const existingUser = await getUserProfile(userId);

  if (existingUser?.passwordHash) {
    throw new ApiError(409, "ACCOUNT_EXISTS", "An account already exists for this email.");
  }

  const timestamp = nowIso();
  const profile = await upsertUserProfile({
    userId,
    email,
    name: body.name,
    passwordHash: await hashPassword(body.password),
    createdAt: existingUser?.createdAt ?? timestamp,
    updatedAt: timestamp
  });

  return c.json(await createSessionResponse(profile), 201);
});

const signIn = async (c: Context<{ Variables: AppVariables }>) => {
  const body = signInSchema.parse(await c.req.json());
  const email = body.email.trim().toLowerCase();
  const userId = await deriveUserId(email);
  const profile = await getUserProfile(userId);

  if (!profile?.passwordHash || !(await verifyPassword(body.password, profile.passwordHash))) {
    throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password.");
  }

  return c.json(await createSessionResponse(profile));
};

authRoutes.post("/sign-in", signIn);

authRoutes.post("/dev-login", async (c) => {
  if (!config.devMode) {
    throw new ApiError(404, "NOT_FOUND", "Route not found.");
  }

  const body = registerSchema.partial({ password: true }).parse(await c.req.json());
  const email = body.email.trim().toLowerCase();
  const userId = await deriveUserId(email);
  const timestamp = nowIso();
  const existingUser = await getUserProfile(userId);
  const profile = await upsertUserProfile({
    userId,
    email,
    name: body.name,
    passwordHash: existingUser?.passwordHash,
    createdAt: existingUser?.createdAt ?? timestamp,
    updatedAt: timestamp
  });

  return c.json(await createSessionResponse(profile));
});
