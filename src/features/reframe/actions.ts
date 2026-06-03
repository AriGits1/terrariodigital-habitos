"use server";

import { getAgents } from "@/features/agents";

/** Returns a cognitive reframe of a negative thought (UC-02). */
export async function reframeThought(thought: string): Promise<string | null> {
  const clean = thought.trim();
  if (!clean) return null;
  return getAgents().reframe(clean);
}
