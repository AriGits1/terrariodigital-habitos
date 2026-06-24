import { redirect } from "next/navigation";
import { getCurrentProfile, } from "./queries";
import type { ProfileWithBiome } from "./session";

/**
 * Require a valid session. Redirects to /login if unauthenticated.
 * Returns the Profile with biome relation (guaranteed non-null to callers).
 */
export async function requireProfile(): Promise<ProfileWithBiome> {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/login");
  }
  // New users who haven't completed onboarding are sent to the welcome flow.
  // We exclude the /onboarding path itself to avoid an infinite redirect loop.
  if (!profile.onboarded) {
    redirect("/onboarding");
  }
  return profile;
}

/**
 * Require an authenticated admin. Redirects to /login if unauthenticated,
 * or to / if authenticated but not an admin.
 */
export async function requireAdmin(): Promise<ProfileWithBiome> {
  const profile = await requireProfile();
  if (profile.role !== "admin") {
    redirect("/");
  }
  return profile;
}
