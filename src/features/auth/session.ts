import crypto from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import type { Profile, BiomeState } from "@/generated/prisma/client";

const SESSION_COOKIE = "session";
const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days

export type ProfileWithBiome = Profile & { biome: BiomeState | null };

/**
 * Insert a new Session row and return the opaque token.
 * The token is a 32-byte random hex string (64 chars) — unguessable, no PII.
 */
export async function createSession(profileId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  await prisma.session.create({
    data: { token, profileId, expiresAt },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return token;
}

/**
 * Validate a token against the Session table.
 * - Missing row → null
 * - Expired row → delete + null (eager cleanup)
 * - Valid row → Profile with biome relation
 */
export async function validateSession(
  token: string
): Promise<ProfileWithBiome | null> {
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: {
      profile: {
        include: { biome: true },
      },
    },
  });

  if (!session) return null;

  if (session.expiresAt < new Date()) {
    // Eager cleanup of expired row
    await prisma.session.delete({ where: { token } }).catch(() => undefined);
    return null;
  }

  return session.profile as ProfileWithBiome;
}

/**
 * Delete the Session row for the given token and clear the cookie.
 * Safe to call even if the row no longer exists.
 */
export async function destroySession(token: string): Promise<void> {
  await prisma.session
    .delete({ where: { token } })
    .catch(() => undefined); // ignore P2025 (not found)

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
