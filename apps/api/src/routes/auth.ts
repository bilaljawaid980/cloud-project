import { SignJWT } from "jose";
import { Hono } from "hono";
import { z } from "zod";

import { config } from "../config/env";
import { getUserProfile, upsertUserProfile } from "../db/accessPatterns";
import type { AppVariables } from "../middleware/logger";
import { deriveUserId } from "../utils/ids";
import { addDays, nowIso } from "../utils/time";

const devLoginSchema = z.object({
  email: z.string().trim().email(),
  name: z.string().trim().min(1).max(200).optional()
});

const secret = new TextEncoder().encode(config.jwtSecret);

export const authRoutes = new Hono<{ Variables: AppVariables }>();

authRoutes.post("/dev-login", async (c) => {
  const body = devLoginSchema.parse(await c.req.json());
  const userId = await deriveUserId(body.email);
  const timestamp = nowIso();
  const existingUser = await getUserProfile(userId);

  const profile = await upsertUserProfile({
    userId,
    email: body.email.trim().toLowerCase(),
    name: body.name,
    createdAt: existingUser?.createdAt ?? timestamp,
    updatedAt: timestamp
  });

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

  return c.json({
    token,
    userId: profile.userId,
    email: profile.email,
    name: profile.name,
    expiresAt
  });
});
