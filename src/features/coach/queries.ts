import { prisma } from "@/lib/db";
import { getHabitsWithTodayStatus } from "@/features/habits/queries";
import type { AgentKind, CoachContext } from "@/features/agents";

/** Builds the contextual snapshot the Coach reasons over: done vs pending today. */
export async function getCoachContext(profileId: string): Promise<CoachContext> {
  const habits = await getHabitsWithTodayStatus(profileId);
  return {
    doneToday: habits.filter((h) => h.doneToday).map((h) => h.title),
    pendingToday: habits.filter((h) => !h.doneToday).map((h) => h.title),
  };
}

/** Conversation history with a given agent, oldest first. */
export async function getChatHistory(profileId: string, agent: AgentKind) {
  return prisma.chatMessage.findMany({
    where: { profileId, agent },
    orderBy: { createdAt: "asc" },
  });
}
