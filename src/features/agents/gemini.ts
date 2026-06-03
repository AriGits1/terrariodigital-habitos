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
  "Sos el Coach de Productividad de una app de hábitos. Tu tono es directo, " +
  "motivador y concreto; empujás a la acción y desafiás la procrastinación con " +
  "cariño. Respondé en español, cálido y breve (máximo 3 oraciones).";

const THERAPIST_SYSTEM =
  "Sos el Terapeuta de Bienestar de una app de hábitos. Tu tono es cálido, " +
  "empático y validante; nunca juzgás. Respondé en español, breve (máximo 3 oraciones).";

function client(): GoogleGenAI {
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

export const geminiAgents: Agents = {
  async inferMood(text: string): Promise<MoodInference> {
    try {
      const res = await client().models.generateContent({
        model: MODEL,
        contents: `Analizá este texto de diario y devolvé el estado de ánimo:\n"${text}"`,
        config: {
          systemInstruction:
            THERAPIST_SYSTEM +
            " Inferí el mood como uno de: motivated, calm, neutral, anxious, sad. " +
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
    } catch {
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
    } catch {
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
      const contents = [
        ...history.map((t) => ({
          role: t.role === "assistant" ? "model" : "user",
          parts: [{ text: t.content }],
        })),
        { role: "user", parts: [{ text: message }] },
      ];
      const ctx =
        agent === "coach" && context
          ? ` Contexto: completados hoy [${context.doneToday.join(", ")}], pendientes [${context.pendingToday.join(", ")}].`
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
    } catch {
      return stubAgents.chat(agent, history, message, context);
    }
  },

  async reframe(thought: string): Promise<string> {
    try {
      const res = await client().models.generateContent({
        model: MODEL,
        contents: `Reencuadrá este pensamiento negativo con compasión y una perspectiva más realista:\n"${thought}"`,
        config: { systemInstruction: THERAPIST_SYSTEM, temperature: 0.6 },
      });
      return res.text ?? "";
    } catch {
      return stubAgents.reframe(thought);
    }
  },
};
