import type { Agents } from "./types";
import { stubAgents } from "./stub";
import { geminiAgents } from "./gemini";

export type {
  Agents,
  MoodInference,
  CoachContext,
  CoachSuggestion,
  AgentKind,
  ChatTurn,
} from "./types";

/**
 * Factory that selects the active agent implementation.
 *
 * When GEMINI_API_KEY is present we use the Gemini-backed agents; otherwise we
 * fall back to the keyword stub. This is the single swap point — no other file
 * imports a concrete provider.
 */
export function getAgents(): Agents {
  // The single swap point: real LLM when a key exists, deterministic stub when
  // it doesn't. No other file knows which implementation is active.
  return process.env.GEMINI_API_KEY ? geminiAgents : stubAgents;
}
