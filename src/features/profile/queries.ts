import { prisma } from "@/lib/db";

/**
 * The MVP runs as a single local user. Returns the active profile together
 * with its biome snapshot, or null if onboarding hasn't happened yet.
 */
export async function getActiveProfile() {
  return prisma.profile.findFirst({
    include: { biome: true },
    orderBy: { createdAt: "asc" },
  });
}
