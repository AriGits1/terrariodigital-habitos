"use server";

import type { BiomeType } from "@/features/biome/biome-logic";
import { getAgents } from "@/features/agents";

/**
 * Server action wrapper for LLM kudos suggestion.
 * getAgents() runs server-side — never exposed to the client bundle.
 */
export async function suggestEncouragementAction(
  recipientName: string,
  biomeType: BiomeType,
): Promise<string> {
  return getAgents().suggestEncouragement(recipientName, biomeType);
}
