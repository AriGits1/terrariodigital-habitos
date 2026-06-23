"use client";

import { useState, useTransition } from "react";
import type { BiomeType } from "@/features/biome/biome-logic";
import { sendEncouragement } from "./actions";
import { suggestEncouragementAction } from "./suggest-action";

interface EncouragementFormProps {
  toProfileId: string;
  recipientName: string;
  biomeType: BiomeType;
}

export default function EncouragementForm({
  toProfileId,
  recipientName,
  biomeType,
}: EncouragementFormProps) {
  const [type, setType] = useState<"water" | "kudos">("water");
  const [message, setMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastError, setToastError] = useState(false);
  const [isSuggesting, startSuggestTransition] = useTransition();
  const [isPending, startSendTransition] = useTransition();

  function handleSuggest() {
    startSuggestTransition(async () => {
      const suggestion = await suggestEncouragementAction(recipientName, biomeType);
      setMessage(suggestion);
    });
  }

  function handleSubmit() {
    startSendTransition(async () => {
      try {
        await sendEncouragement(toProfileId, type, type === "kudos" ? message : undefined);
        setMessage("");
        setType("water");
        setToastError(false);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      } catch {
        setToastError(true);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-white/5 p-5">
      <h3 className="text-sm font-medium text-white/70">Enviar aliento a {recipientName}</h3>

      {/* Type toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setType("water")}
          className={`flex-1 rounded-xl border-2 py-2 text-sm transition-colors ${
            type === "water"
              ? "border-blue-400 bg-blue-500/10 text-blue-300"
              : "border-white/10 text-white/50 hover:border-white/30"
          }`}
        >
          Agua
        </button>
        <button
          type="button"
          onClick={() => setType("kudos")}
          className={`flex-1 rounded-xl border-2 py-2 text-sm transition-colors ${
            type === "kudos"
              ? "border-emerald-400 bg-emerald-500/10 text-emerald-300"
              : "border-white/10 text-white/50 hover:border-white/30"
          }`}
        >
          Felicitación
        </button>
      </div>

      {/* Message area — only shown for kudos */}
      {type === "kudos" && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-white/50">Mensaje (opcional)</label>
            <button
              type="button"
              onClick={handleSuggest}
              disabled={isSuggesting}
              className="text-xs text-emerald-400 hover:text-emerald-300 disabled:opacity-40 transition"
            >
              {isSuggesting ? "Sugiriendo…" : "Sugerir"}
            </button>
          </div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Escribe un mensaje de aliento…"
            rows={3}
            className="rounded-lg bg-white/10 px-3 py-2 text-sm outline-none focus:bg-white/15 placeholder:text-white/30 resize-none"
          />
        </div>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isPending}
        className="rounded-full bg-emerald-500 px-6 py-2 text-sm font-medium text-black hover:bg-emerald-400 hover:scale-105 transition-all disabled:opacity-40 disabled:hover:scale-100"
      >
        {isPending ? "Enviando…" : "Enviar"}
      </button>

      {/* Toast */}
      <div
        className={`fixed bottom-6 right-6 z-50 rounded-lg px-4 py-3 text-sm font-medium shadow-xl transition-all duration-500 ease-in-out ${
          toastError ? "bg-red-500 text-white" : "bg-emerald-500 text-black"
        } ${showToast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}
      >
        {toastError ? "Error al enviar el aliento" : "Aliento enviado"}
      </div>
    </div>
  );
}
