// Gemini-backed implementation of the Agents interface. Activated by the
// factory in index.ts when GEMINI_API_KEY is present. Every method falls back
// to the stub on error so the app never breaks if the API is unreachable.

import { GoogleGenAI, Type } from "@google/genai";
import type {
  AgentKind,
  Agents,
  ChatTurn,
  CoachContext,
  CoachSuggestion,
  MoodInference,
} from "./types";
import { stubAgents } from "./stub";

const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

const COACH_SYSTEM =
  "Eres el Coach de Productividad de una app de hábitos. Tu tono es directo, " +
  "motivador y concreto; empujas a la acción y desafías la procrastinación con " +
  "cariño. Responde en español, cálido y breve (máximo 3 oraciones).";

const THERAPIST_SYSTEM =
  "Eres el Terapeuta de Bienestar de una app de hábitos. Tu tono es cálido, " +
  "empático y validante; nunca juzgas. Responde en español, breve (máximo 3 oraciones).";

function client(): GoogleGenAI {
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

/** Returns true when the API error is a 429 rate-limit / quota-exhausted. */
function isRateLimited(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as Record<string, unknown>;
  const status = e.status ?? (e.error as Record<string, unknown>)?.status;
  if (status === 429 || status === "RESOURCE_EXHAUSTED") return true;
  const msg = String(e.message ?? "");
  return msg.includes("RESOURCE_EXHAUSTED") || msg.includes("429");
}

export const geminiAgents: Agents = {
  async inferMood(text: string): Promise<MoodInference> {
    try {
      const res = await client().models.generateContent({
        model: MODEL,
        contents: `Analiza este texto de diario y devuelve el estado de ánimo:\n"${text}"`,
        config: {
          systemInstruction:
            THERAPIST_SYSTEM +
            " Infiere el mood como uno de: motivated, calm, neutral, anxious, sad. " +
            "El score es la valencia emocional de -1 (muy negativo) a 1 (muy positivo). " +
            "El reply es tu respuesta empática al usuario.",
          temperature: 0.4,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              mood: { type: Type.STRING },
              score: { type: Type.NUMBER },
              reply: { type: Type.STRING },
            },
            required: ["mood", "score", "reply"],
          },
        },
      });
      const parsed = JSON.parse(res.text ?? "{}");
      return {
        mood: String(parsed.mood ?? "neutral"),
        score: Number(parsed.score ?? 0),
        reply: String(parsed.reply ?? ""),
      };
    } catch (err) {
      console.error("[gemini.inferMood] error:", err);
      return stubAgents.inferMood(text);
    }
  },

  async coach(context: CoachContext): Promise<CoachSuggestion> {
    try {
      const res = await client().models.generateContent({
        model: MODEL,
        contents:
          `Hábitos completados hoy: ${context.doneToday.join(", ") || "ninguno"}. ` +
          `Pendientes: ${context.pendingToday.join(", ") || "ninguno"}. ` +
          "Dame una sugerencia breve y accionable.",
        config: { systemInstruction: COACH_SYSTEM, temperature: 0.7 },
      });
      return { message: res.text ?? "" };
    } catch (err) {
      console.error("[gemini.coach] error:", err);
      return stubAgents.coach(context);
    }
  },

  async chat(
    agent: AgentKind,
    history: ChatTurn[],
    message: string,
    context?: CoachContext,
  ): Promise<string> {
    try {
      // Build contents array, mapping assistant->model for Gemini's API.
      // The Gemini API requires strictly alternating user/model turns and
      // the conversation must start with a user turn. We sanitize the history
      // to enforce this — consecutive same-role turns are merged.
      const rawTurns = [
        ...history.map((t) => ({
          role: t.role === "assistant" ? "model" : "user",
          parts: [{ text: t.content }],
        })),
        { role: "user" as const, parts: [{ text: message }] },
      ];

      // Merge consecutive same-role turns and drop empty content.
      const contents: { role: string; parts: { text: string }[] }[] = [];
      for (const turn of rawTurns) {
        if (!turn.parts[0].text.trim()) continue;
        const last = contents[contents.length - 1];
        if (last && last.role === turn.role) {
          // Merge into the previous turn
          last.parts.push(...turn.parts);
        } else {
          contents.push({ role: turn.role, parts: [...turn.parts] });
        }
      }

      // If after merging the first turn is a model turn, prepend a dummy user turn
      if (contents.length > 0 && contents[0].role !== "user") {
        contents.unshift({ role: "user", parts: [{ text: "Hola" }] });
      }

      // Ensure the last turn is always from the user (the new message)
      if (contents.length === 0 || contents[contents.length - 1].role !== "user") {
        contents.push({ role: "user", parts: [{ text: message }] });
      }

      const ctx =
        agent === "coach" && context
          ? ` Contexto actual del usuario: hábitos completados hoy [${context.doneToday.join(", ") || "ninguno"}], pendientes [${context.pendingToday.join(", ") || "ninguno"}].`
          : "";
      const res = await client().models.generateContent({
        model: MODEL,
        contents,
        config: {
          systemInstruction:
            (agent === "coach" ? COACH_SYSTEM : THERAPIST_SYSTEM) + ctx,
          temperature: 0.7,
        },
      });
      return res.text ?? "";
    } catch (err) {
      console.error("[gemini.chat] error:", err);
      if (isRateLimited(err)) {
        return "El límite de consultas de la API está al tope por ahora. Espera un minuto e intenta de nuevo. 💡";
      }
      return stubAgents.chat(agent, history, message, context);
    }
  },

  async reframe(thought: string): Promise<string> {
    try {
      const res = await client().models.generateContent({
        model: MODEL,
        contents: `Reencuadra este pensamiento negativo con compasión y una perspectiva más realista:\n"${thought}"`,
        config: { systemInstruction: THERAPIST_SYSTEM, temperature: 0.6 },
      });
      return res.text ?? "";
    } catch (err) {
      console.error("[gemini.reframe] error:", err);
      return stubAgents.reframe(thought);
    }
  },
};
