// Keyword-based stub implementation of the Agents interface. No network, no
// API key — used until a Gemini key is configured. It deliberately mimics the
// two agent voices so the UX is complete and the swap to a real LLM is seamless.

import type {
  AgentKind,
  Agents,
  ChatTurn,
  CoachContext,
  CoachSuggestion,
  MoodInference,
} from "./types";

const POSITIVE = [
  "bien", "feliz", "contento", "contenta", "energía", "energia", "motivado",
  "motivada", "tranquilo", "tranquila", "calma", "logré", "logre", "avancé",
  "avance", "orgulloso", "orgullosa", "genial", "optimista",
];
const NEGATIVE = [
  "mal", "triste", "abrumado", "abrumada", "ansioso", "ansiosa", "cansado",
  "cansada", "estresado", "estresada", "agobiado", "agobiada", "no puedo",
  "procrastin", "frustrado", "frustrada", "miedo", "solo", "sola",
];

function countMatches(text: string, words: string[]): number {
  const lower = text.toLowerCase();
  return words.reduce((n, w) => (lower.includes(w) ? n + 1 : n), 0);
}

function labelFor(score: number): string {
  if (score >= 0.5) return "motivated";
  if (score >= 0.15) return "calm";
  if (score <= -0.5) return "sad";
  if (score <= -0.15) return "anxious";
  return "neutral";
}

const THERAPIST_REPLIES: Record<string, string> = {
  motivated:
    "Me alegra sentir esa energía en ti. Aprovecha el impulso, pero recuerda descansar también.",
  calm:
    "Qué bueno que estés en calma. Ese equilibrio es tan valioso como la productividad.",
  neutral:
    "Gracias por compartir cómo estás. Estar presente con uno mismo ya es un gran paso.",
  anxious:
    "Escucho que hay algo de inquietud. Es totalmente válido sentirse así; vamos de a un paso por vez.",
  sad:
    "Lamento que estés pasando un momento difícil. Tus emociones importan, y no tienes que cargarlas solo.",
};

export const stubAgents: Agents = {
  async inferMood(text: string): Promise<MoodInference> {
    const pos = countMatches(text, POSITIVE);
    const neg = countMatches(text, NEGATIVE);
    const total = pos + neg;
    const score = total === 0 ? 0 : (pos - neg) / total;
    const mood = labelFor(score);
    return { mood, score: Number(score.toFixed(2)), reply: THERAPIST_REPLIES[mood] };
  },

  async coach(context: CoachContext): Promise<CoachSuggestion> {
    const { doneToday, pendingToday } = context;
    if (pendingToday.length === 0 && doneToday.length > 0) {
      return {
        message: `¡Completaste todo hoy! ${doneToday.length} hábitos cerrados. Eso es disciplina, no suerte. Mantén el ritmo mañana.`,
      };
    }
    if (pendingToday.length > 0) {
      const next = pendingToday[0];
      return {
        message: `Te quedan ${pendingToday.length} pendientes. Empieza por "${next}" — no esperes la motivación, genérala con la acción.`,
      };
    }
    return {
      message: "Todavía no hay hábitos para hoy. Define al menos uno y arranca: lo concreto vence a lo perfecto.",
    };
  },

  async chat(
    agent: AgentKind,
    _history: ChatTurn[],
    message: string,
    context?: CoachContext,
  ): Promise<string> {
    const lower = message.toLowerCase();

    if (agent === "therapist") {
      if (/(ansie|nervios|miedo|estr[eé]s|abrumad)/.test(lower)) {
        return "Respira hondo conmigo. Lo que sientes es real y válido. ¿Probamos una pausa de mindfulness de un minuto?";
      }
      if (/(triste|mal|solo|sola|deprim)/.test(lower)) {
        return "Gracias por confiarme esto. No estás solo. ¿Qué es lo más pequeño que te haría sentir un poco mejor hoy?";
      }
      return "Te escucho. Cuéntame un poco más de cómo te hace sentir eso.";
    }

    // Coach voice — direct, action-oriented, anti-procrastination.
    if (/(procrastin|no puedo|despu[eé]s|ma[ñn]ana|flojera|cansad)/.test(lower)) {
      return "Esa es la voz de la procrastinación, no la tuya. Regla de los 5 minutos: arranca solo 5 minutos en una tarea. El arranque es lo único difícil.";
    }
    if (/(tesis|estudiar|proyecto|trabajo)/.test(lower)) {
      return "Divídelo en una sola acción concreta que puedas hacer en 25 minutos. ¿Cuál sería ese primer bloque? Lo hacemos ahora.";
    }
    if (context && context.pendingToday.length > 0) {
      return `Antes de seguir charlando: tienes "${context.pendingToday[0]}" pendiente. Cierra eso y vuelve. La acción primero, la teoría después.`;
    }
    return "Concreto y al hueso: ¿cuál es la próxima acción de 25 minutos que vas a ejecutar? Dímela y la convertimos en hábito.";
  },

  async reframe(thought: string): Promise<string> {
    const lower = thought.toLowerCase();

    if (/(nunca|jam[aá]s|siempre|todo|nada)/.test(lower)) {
      return "Noto un pensamiento absoluto (\"siempre\", \"nunca\", \"nada\"). La realidad casi nunca es total. ¿Qué excepción, aunque sea pequeña, contradice esa idea?";
    }
    if (/(no puedo|no soy capaz|imposible|no sirvo)/.test(lower)) {
      return "Cambia el \"no puedo\" por \"todavía no puedo\". No es incapacidad, es un proceso en curso. ¿Cuál sería el primer paso del 1%?";
    }
    if (/(deber[ií]a|tengo que|culpa)/.test(lower)) {
      return "Eso suena a una exigencia muy dura contigo mismo. Si un amigo te dijera esto, ¿le hablarías con esa severidad? Prueba hablarte con la misma compasión.";
    }
    return "Gracias por compartir ese pensamiento. Veámoslo con distancia: ¿qué evidencia lo apoya y qué evidencia lo contradice? Los hechos suelen ser más amables que el miedo.";
  },
};
