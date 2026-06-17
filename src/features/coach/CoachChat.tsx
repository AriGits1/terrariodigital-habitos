"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { sendCoachMessage } from "./actions";
import type { AgentKind, ChatTurn } from "@/features/agents";

export default function CoachChat({
  profileId,
  agent,
  initialHistory,
  autoMessage,
}: {
  profileId: string;
  agent: AgentKind;
  initialHistory: ChatTurn[];
  /** If provided, this message is sent automatically as the opening user turn. */
  autoMessage?: string;
}) {
  const [messages, setMessages] = useState<ChatTurn[]>(initialHistory);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const autoSentRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isPending]);

  // Send autoMessage once on mount (e.g. habit click from biome)
  useEffect(() => {
    if (autoMessage && !autoSentRef.current && !isPending) {
      autoSentRef.current = true;
      const userTurn: ChatTurn = { role: "user", content: autoMessage };
      setMessages((m) => [...m, userTurn]);
      startTransition(async () => {
        const reply = await sendCoachMessage(profileId, agent, autoMessage);
        if (reply) {
          setMessages((m) => [...m, { role: "assistant", content: reply }]);
        }
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function send() {
    const text = input.trim();
    if (!text || isPending) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);

    startTransition(async () => {
      const reply = await sendCoachMessage(profileId, agent, text);
      if (reply) {
        setMessages((m) => [...m, { role: "assistant", content: reply }]);
      }
    });
  }

  return (
    <div className="flex h-[28rem] flex-col rounded-2xl bg-white/5 p-4">
      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {messages.length === 0 && !isPending && (
          <p className="mt-8 text-center text-sm text-white/40">
            Escríbele al Coach. Te va a empujar a la acción.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <span
              className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                m.role === "user"
                  ? "bg-emerald-500 text-black"
                  : "bg-white/10 text-white"
              }`}
            >
              {m.content}
            </span>
          </div>
        ))}
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
