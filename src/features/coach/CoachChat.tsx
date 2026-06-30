"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { sendCoachMessage } from "./actions";
import { coachAddHabit, coachArchiveHabit } from "./coach-habit-actions";
import type { AgentKind, ChatTurn, CoachHabit } from "@/features/agents";
import { Wind, Plus, Trash2, Check, X } from "lucide-react";

// ── Directive parsing ──────────────────────────────────────────────────────────

type DirectiveKind =
  | { type: "mindfulness" }
  | { type: "add_habit"; title: string; weight: number }
  | { type: "archive_habit"; id: string; title?: string };

/**
 * Extracts a special directive from the coach's raw reply.
 * Returns { cleanText, directive } where cleanText has the directive tag removed.
 */
function parseDirective(raw: string): { cleanText: string; directive: DirectiveKind | null } {
  // [MINDFULNESS]
  if (/\[MINDFULNESS\]/i.test(raw)) {
    return {
      cleanText: raw.replace(/\[MINDFULNESS\]/gi, "").trim(),
      directive: { type: "mindfulness" },
    };
  }
  // [ACTION:add_habit:{...}]
  const addMatch = raw.match(/\[ACTION:add_habit:(\{[^}]*\})\]/i);
  if (addMatch) {
    try {
      const payload = JSON.parse(addMatch[1]);
      return {
        cleanText: raw.replace(addMatch[0], "").trim(),
        directive: {
          type: "add_habit",
          title: String(payload.title ?? "Nuevo hábito"),
          weight: Number(payload.weight ?? 3),
        },
      };
    } catch {/* malformed JSON — ignore directive */}
  }
  // [ACTION:archive_habit:{...}]
  const archiveMatch = raw.match(/\[ACTION:archive_habit:(\{[^}]*\})\]/i);
  if (archiveMatch) {
    try {
      const payload = JSON.parse(archiveMatch[1]);
      return {
        cleanText: raw.replace(archiveMatch[0], "").trim(),
        directive: { type: "archive_habit", id: String(payload.id ?? "") },
      };
    } catch {/* malformed JSON — ignore directive */}
  }
  return { cleanText: raw, directive: null };
}

// ── Message types ──────────────────────────────────────────────────────────────

interface MessageEntry {
  turn: ChatTurn;
  directive?: DirectiveKind | null;
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function CoachChat({
  profileId,
  agent,
  initialHistory,
  autoMessage,
  coachHabits = [],
}: {
  profileId: string;
  agent: AgentKind;
  initialHistory: ChatTurn[];
  /** If provided, this message is sent automatically as the opening user turn. */
  autoMessage?: string;
  /** Habit list from the server (with ids) for action confirmation. */
  coachHabits?: CoachHabit[];
}) {
  const router = useRouter();

  const [messages, setMessages] = useState<MessageEntry[]>(
    initialHistory.map((t) => ({ turn: t })),
  );
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const autoSentRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  // Track which directives have been acted on
  const [actedDirectives, setActedDirectives] = useState<Set<number>>(new Set());
  const [actionPending, setActionPending] = useState(false);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isPending]);

  // Send autoMessage once on mount
  useEffect(() => {
    if (autoMessage && !autoSentRef.current && !isPending) {
      autoSentRef.current = true;
      const userEntry: MessageEntry = { turn: { role: "user", content: autoMessage } };
      setMessages((m) => [...m, userEntry]);
      startTransition(async () => {
        const reply = await sendCoachMessage(profileId, agent, autoMessage);
        if (reply) {
          const { cleanText, directive } = parseDirective(reply);
          setMessages((m) => [...m, { turn: { role: "assistant", content: cleanText }, directive }]);
        }
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function send() {
    const text = input.trim();
    if (!text || isPending) return;
    setInput("");
    setMessages((m) => [...m, { turn: { role: "user", content: text } }]);

    startTransition(async () => {
      const reply = await sendCoachMessage(profileId, agent, text);
      if (reply) {
        const { cleanText, directive } = parseDirective(reply);
        setMessages((m) => [...m, { turn: { role: "assistant", content: cleanText }, directive }]);
      }
    });
  }

  async function handleConfirmAdd(msgIndex: number, directive: Extract<DirectiveKind, { type: "add_habit" }>) {
    setActionPending(true);
    const res = await coachAddHabit(directive.title, directive.weight);
    setActionPending(false);
    setActedDirectives((s) => new Set([...s, msgIndex]));
    if (!res.success) {
      alert(res.error ?? "Error al agregar el hábito.");
    } else {
      router.refresh();
    }
  }

  async function handleConfirmArchive(msgIndex: number, directive: Extract<DirectiveKind, { type: "archive_habit" }>) {
    setActionPending(true);
    const res = await coachArchiveHabit(directive.id);
    setActionPending(false);
    setActedDirectives((s) => new Set([...s, msgIndex]));
    if (!res.success) {
      alert(res.error ?? "Error al eliminar el hábito.");
    } else {
      router.refresh();
    }
  }

  function dismissDirective(msgIndex: number) {
    setActedDirectives((s) => new Set([...s, msgIndex]));
  }

  return (
    <div className="flex h-[28rem] flex-col rounded-2xl bg-white/5 p-4">
      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {messages.length === 0 && !isPending && (
          <p className="mt-8 text-center text-sm text-white/40">
            Escríbele al Coach. Te va a empujar a la acción.
          </p>
        )}

        {messages.map((entry, i) => {
          const acted = actedDirectives.has(i);
          return (
            <div key={i} className="flex flex-col gap-1.5">
              {/* Chat bubble */}
              <div className={`flex ${entry.turn.role === "user" ? "justify-end" : "justify-start"}`}>
                <span
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm leading-relaxed ${
                    entry.turn.role === "user"
                      ? "bg-emerald-500 text-black"
                      : "bg-white/10 text-white"
                  }`}
                >
                  {entry.turn.content}
                </span>
              </div>

              {/* Directive action cards — only on assistant messages, not yet acted */}
              {entry.turn.role === "assistant" && entry.directive && !acted && (
                <div className="ml-2">
                  {/* MINDFULNESS */}
                  {entry.directive.type === "mindfulness" && (
                    <div className="flex items-center gap-2 rounded-xl bg-teal-500/10 px-3 py-2 ring-1 ring-teal-500/25">
                      <Wind className="h-4 w-4 shrink-0 text-teal-400" />
                      <span className="flex-1 text-xs text-teal-200">Sesión de respiración recomendada</span>
                      <a
                        href="/mindfulness"
                        onClick={() => dismissDirective(i)}
                        className="rounded-lg bg-teal-500 px-3 py-1 text-xs font-semibold text-black hover:bg-teal-400 transition"
                      >
                        Ir ahora
                      </a>
                      <button
                        onClick={() => dismissDirective(i)}
                        className="text-white/30 hover:text-white/70 transition"
                        title="Ignorar"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  {/* ADD HABIT */}
                  {entry.directive.type === "add_habit" && (
                    <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-2 ring-1 ring-emerald-500/25">
                      <Plus className="h-4 w-4 shrink-0 text-emerald-400" />
                      <span className="flex-1 text-xs text-emerald-200">
                        Agregar hábito: <strong>&quot;{entry.directive.title}&quot;</strong> (peso {entry.directive.weight})
                      </span>
                      <button
                        disabled={actionPending}
                        onClick={() => handleConfirmAdd(i, entry.directive as Extract<DirectiveKind, { type: "add_habit" }>)}
                        className="flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1 text-xs font-semibold text-black hover:bg-emerald-400 transition disabled:opacity-50"
                      >
                        <Check className="h-3 w-3" /> Agregar
                      </button>
                      <button
                        onClick={() => dismissDirective(i)}
                        className="text-white/30 hover:text-white/70 transition"
                        title="Ignorar"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  {/* ARCHIVE HABIT */}
                  {entry.directive.type === "archive_habit" && (() => {
                    const archiveDirective = entry.directive as Extract<DirectiveKind, { type: "archive_habit" }>;
                    const habit = coachHabits.find((h) => h.id === archiveDirective.id);
                    const label = habit?.title ?? archiveDirective.id;
                    return (
                      <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 px-3 py-2 ring-1 ring-rose-500/25">
                        <Trash2 className="h-4 w-4 shrink-0 text-rose-400" />
                        <span className="flex-1 text-xs text-rose-200">
                          Eliminar hábito: <strong>&quot;{label}&quot;</strong>
                        </span>
                        <button
                          disabled={actionPending}
                          onClick={() => handleConfirmArchive(i, entry.directive as Extract<DirectiveKind, { type: "archive_habit" }>)}
                          className="flex items-center gap-1 rounded-lg bg-rose-500 px-3 py-1 text-xs font-semibold text-white hover:bg-rose-400 transition disabled:opacity-50"
                        >
                          <Trash2 className="h-3 w-3" /> Eliminar
                        </button>
                        <button
                          onClick={() => dismissDirective(i)}
                          className="text-white/30 hover:text-white/70 transition"
                          title="Ignorar"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* "Done" indicator after acting */}
              {entry.turn.role === "assistant" && entry.directive && acted && (
                <div className="ml-2 flex items-center gap-1 text-xs text-white/30">
                  <Check className="h-3 w-3" /> Acción realizada
                </div>
              )}
            </div>
          );
        })}

        {isPending && (
          <div className="flex justify-start">
            <span className="rounded-2xl bg-white/10 px-4 py-2 text-sm text-white/50">
              escribiendo…
            </span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Escribe tu mensaje…"
          className="flex-1 rounded-lg bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40 focus:bg-white/20"
        />
        <button
          type="button"
          onClick={send}
          disabled={isPending || !input.trim()}
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-black disabled:opacity-40"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
