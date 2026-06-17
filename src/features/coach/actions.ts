"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getAgents, type AgentKind, type ChatTurn } from "@/features/agents";
import { getCoachContext } from "./queries";

/**
 * Sends a message to one of the agents and returns its reply. Both the user
 * message and the assistant reply are persisted so the conversation survives
 * reloads. Context (today's habits) is passed so the Coach stays contextual.
 */
export async function sendCoachMessage(
  profileId: string,
  agent: AgentKind,
  message: string,
): Promise<string | null> {
  const clean = message.trim();
  if (!clean) return null;

  // Persist the user's turn first.
  await prisma.chatMessage.create({
    data: { profileId, agent, role: "user", content: clean },
  });

  // Reconstruct history for the agent — exclude the message we just inserted
  // (the last row) because it is passed separately as `message` to the agent.
  // Sending it in both places creates back-to-back user turns which violates
  // the Gemini API's strict alternation requirement and causes silent fallback
  // to the stub.
  const prior = await prisma.chatMessage.findMany({
    where: { profileId, agent },
    orderBy: { createdAt: "asc" },
  });
  // Drop the last entry — it's the user turn we just persisted above.
  const historyRows = prior.slice(0, -1);
  const history: ChatTurn[] = historyRows.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const context = await getCoachContext(profileId);
  const reply = await getAgents().chat(agent, history, clean, context);

  await prisma.chatMessage.create({
    data: { profileId, agent, role: "assistant", content: reply },
  });

  revalidatePath("/coach");
  return reply;
}
