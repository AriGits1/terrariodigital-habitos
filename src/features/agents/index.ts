import type { Agents } from "./types";
import { stubAgents } from "./stub";
import { geminiAgents } from "./gemini";
import { groqAgents } from "./groq";

export type {
  Agents,
  MoodInference,
  CoachContext,
  CoachHabit,
  CoachSuggestion,
  AgentKind,
  ChatTurn,
} from "./types";

/**
 * Factory that selects the active agent implementation.
 *
 * When GROQ_API_KEY is present we use Groq. If GEMINI_API_KEY is present we use Gemini.
 * Otherwise we fall back to the keyword stub.
 */
export function getAgents(): Agents {
  if (process.env.GROQ_API_KEY) return groqAgents;
  if (process.env.GEMINI_API_KEY) return geminiAgents;
  return stubAgents;
}
