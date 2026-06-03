// Agent layer contract. The rest of the app depends ONLY on this interface,
// never on a concrete provider. Today a keyword stub implements it; tomorrow a
// Gemini-backed implementation does — swapping is a one-line factory change.

export interface MoodInference {
  /** Label: "motivated" | "calm" | "anxious" | "sad" | "neutral". */
  mood: string;
  /** Valence -1.0 (negative) .. 1.0 (positive). */
  score: number;
  /** Short reply in the Terapeuta de Bienestar voice (warm, validating). */
  reply: string;
}

export interface CoachContext {
  /** Habit titles completed today. */
  doneToday: string[];
  /** Habit titles still pending today. */
  pendingToday: string[];
}

export interface CoachSuggestion {
  /** Message in the Coach de Productividad voice (direct, motivating). */
  message: string;
}

export type AgentKind = "coach" | "therapist";

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

/**
 * The two LLM agents the product promises:
 * - Terapeuta de Bienestar -> inferMood (drives Personalización continua)
 * - Coach de Productividad  -> coach / chat (drives Ayuda contextual)
 */
export interface Agents {
  inferMood(text: string): Promise<MoodInference>;
  /** Proactive, context-aware suggestion based on today's habit state. */
  coach(context: CoachContext): Promise<CoachSuggestion>;
  /** Conversational reply for the given agent, aware of prior turns + context. */
  chat(
    agent: AgentKind,
    history: ChatTurn[],
    message: string,
    context?: CoachContext,
  ): Promise<string>;
  /** Cognitive reframe of a negative thought (UC-02). */
  reframe(thought: string): Promise<string>;
}
