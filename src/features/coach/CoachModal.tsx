import { getAgents, type ChatTurn } from "@/features/agents";
import { getCoachContext, getChatHistory } from "@/features/coach/queries";
import CoachChat from "./CoachChat";
import { X } from "lucide-react";
import Link from "next/link";

export default async function CoachModal({
  profileId,
  habitId,
  habitTitle,
}: {
  profileId: string;
  habitId?: string;
  habitTitle?: string;
}) {
  const context = await getCoachContext(profileId);
  const history = await getChatHistory(profileId, "coach");
  const initialHistory: ChatTurn[] = history.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  // If a habit was clicked, auto-generate an opening question about it
  let habitQuestion: string | undefined;
  if (habitId && habitTitle) {
    const statusStr =
      context.doneToday.includes(habitTitle)
        ? "completado hoy"
        : context.pendingToday.includes(habitTitle)
        ? "pendiente para hoy"
        : "registrado en tu semana";
    habitQuestion = `Quiero hablar sobre mi hábito "${habitTitle}" (${statusStr}).`;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm sm:justify-end sm:p-6">
      <div className="relative flex h-full w-full max-w-md flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl sm:h-auto sm:max-h-[85vh]">
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Coach de Productividad</h2>
            <p className="text-xs text-white/60">
              {context.doneToday.length} completados · {context.pendingToday.length} pendientes
            </p>
          </div>
          <Link
            href="/"
            scroll={false}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <CoachChat
            profileId={profileId}
            agent="coach"
            initialHistory={initialHistory}
            autoMessage={habitQuestion}
          />
        </div>
      </div>
    </div>
  );
}
