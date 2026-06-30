// Groq-backed implementation of the Agents interface. Activated by the
// factory in index.ts when GROQ_API_KEY is present. Every method falls back
// to the stub on error so the app never breaks if the API is unreachable.

import Groq from "groq-sdk";
import type {
  AgentKind,
  Agents,
  ChatTurn,
  CoachContext,
  CoachSuggestion,
  MoodInference,
} from "./types";
import type { BiomeType } from "../biome/biome-logic";
import { stubAgents } from "./stub";

const MODEL = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";

const ENCOURAGEMENT_SYSTEM =
  "Eres parte de una app cooperativa de hábitos. Escribe un mensaje de aliento " +
  "breve (1-2 oraciones), cálido y genuino para felicitar a otra persona por cuidar " +
  "su terrario. Español, sin emojis excesivos, sin signos de exclamación múltiples.";

const COACH_SYSTEM =
  "Eres el Coach de Productividad de una app de hábitos. Tu tono es directo, " +
  "motivador y concreto; empujas a la acción y desafías la procrastinación con " +
  "cariño. Responde en español, cálido y breve (máximo 3-4 oraciones).\n\n" +
  "ACCIONES DISPONIBLES — emite estas directivas al FINAL de tu mensaje cuando aplique:\n" +
  "- Si recomiendas una sesión de mindfulness/respiración, añade exactamente: [MINDFULNESS]\n" +
  "- Si sugieres agregar un hábito: [ACTION:add_habit:{\"title\":\"NOMBRE\",\"weight\":N}] (weight 1-5)\n" +
  "- Si sugieres eliminar un hábito por su ID: [ACTION:archive_habit:{\"id\":\"ID_HABIT\"}]\n" +
  "Solo emite UNA directiva por respuesta. No expliques la directiva, el sistema la procesará.\n" +
  "Si el usuario pregunta sobre sus hábitos o pide agregar/eliminar uno, usa el ID real de la lista que se te proporciona en el contexto.";

const THERAPIST_SYSTEM =
  "Eres el Terapeuta de Bienestar de una app de hábitos. Tu tono es cálido, " +
  "empático y validante; nunca juzgas. Responde en español, breve (máximo 3 oraciones).";

function client(): Groq {
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

export const groqAgents: Agents = {
  async inferMood(text: string): Promise<MoodInference> {
    try {
      const res = await client().chat.completions.create({
        model: MODEL,
        messages: [
          {
            role: "system",
            content:
              THERAPIST_SYSTEM +
              " Infiere el mood como uno de: motivated, calm, neutral, anxious, sad. " +
              "El score es la valencia emocional de -1 (muy negativo) a 1 (muy positivo). " +
              "El reply es tu respuesta empática al usuario. Responde en formato JSON estricto devolviendo solo un objeto JSON y nada más.",
          },
          {
            role: "user",
            content: `Analiza este texto de diario y devuelve el estado de ánimo:\n"${text}"`,
          },
        ],
        temperature: 0.4,
        response_format: { type: "json_object" },
      });
      const parsed = JSON.parse(res.choices[0]?.message?.content ?? "{}");
      return {
        mood: String(parsed.mood ?? "neutral"),
        score: Number(parsed.score ?? 0),
        reply: String(parsed.reply ?? ""),
      };
    } catch (err) {
      console.error("[groq.inferMood] error:", err);
      return stubAgents.inferMood(text);
    }
  },

  async coach(context: CoachContext): Promise<CoachSuggestion> {
    try {
      const res = await client().chat.completions.create({
        model: MODEL,
        messages: [
          { role: "system", content: COACH_SYSTEM },
          {
            role: "user",
            content:
              `Hábitos completados hoy: ${context.doneToday.join(", ") || "ninguno"}. ` +
              `Pendientes: ${context.pendingToday.join(", ") || "ninguno"}. ` +
              "Dame una sugerencia breve y accionable.",
          },
        ],
        temperature: 0.7,
      });
      return { message: res.choices[0]?.message?.content ?? "" };
    } catch (err) {
      console.error("[groq.coach] error:", err);
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
      const ctx =
        agent === "coach" && context
          ? ` Contexto actual del usuario: hora ${context.currentHour}:00 (usa esto para recomendar hábitos según el momento del día). ` +
            `Hábitos completados hoy: [${context.doneToday.join(", ") || "ninguno"}]. ` +
            `Pendientes: [${context.pendingToday.join(", ") || "ninguno"}]. ` +
            `Lista completa de hábitos con IDs (para acciones): [${context.habits.map(h => `id="${h.id}" title="${h.title}" peso=${h.weight}`).join(" | ") || "ninguno"}].`
          : "";
          
      const messages: Groq.Chat.ChatCompletionMessageParam[] = [
        {
          role: "system",
          content: (agent === "coach" ? COACH_SYSTEM : THERAPIST_SYSTEM) + ctx,
        },
        ...history.map(t => ({ role: t.role, content: t.content }) as Groq.Chat.ChatCompletionMessageParam),
        { role: "user", content: message },
      ];

      const res = await client().chat.completions.create({
        model: MODEL,
        messages,
        temperature: 0.7,
      });
      return res.choices[0]?.message?.content ?? "";
    } catch (err) {
      console.error("[groq.chat] error:", err);
      return stubAgents.chat(agent, history, message, context);
    }
  },

  async reframe(thought: string): Promise<string> {
    try {
      const res = await client().chat.completions.create({
        model: MODEL,
        messages: [
          { role: "system", content: THERAPIST_SYSTEM },
          {
            role: "user",
            content: `Reencuadra este pensamiento negativo con compasión y una perspectiva más realista:\n"${thought}"`,
          },
        ],
        temperature: 0.6,
      });
      return res.choices[0]?.message?.content ?? "";
    } catch (err) {
      console.error("[groq.reframe] error:", err);
      return stubAgents.reframe(thought);
    }
  },

  async suggestEncouragement(recipientName: string, biomeType: BiomeType): Promise<string> {
    try {
      const res = await client().chat.completions.create({
        model: MODEL,
        messages: [
          { role: "system", content: ENCOURAGEMENT_SYSTEM },
          {
            role: "user",
            content: `Felicita a ${recipientName} por el progreso de su bioma tipo "${biomeType}".`,
          },
        ],
        temperature: 0.8,
      });
      return res.choices[0]?.message?.content ?? stubAgents.suggestEncouragement(recipientName, biomeType);
    } catch (err) {
      console.error("[groq.suggestEncouragement] error:", err);
      return stubAgents.suggestEncouragement(recipientName, biomeType);
    }
  },
};
