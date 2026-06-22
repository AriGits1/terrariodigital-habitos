import { cookies } from "next/headers";
import { validateSession, type ProfileWithBiome } from "./session";

/**
 * Resolve the currently authenticated profile from the session cookie.
 * Returns the Profile (with biome relation) or null if unauthenticated.
 *
 * Uses `await cookies()` — required in Next.js 15+/16 where the cookies API
 * became async.
 */
export async function getCurrentProfile(): Promise<ProfileWithBiome | null> {
  const token = (await cookies()).get("session")?.value;
  if (!token) return null;
  return validateSession(token);
}
