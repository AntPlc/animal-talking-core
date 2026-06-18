/**
 * Interaction input/output contracts for Animal Talking.
 */

import type { TalkingCharacter } from "./character.js";
import type { DialogueTurn } from "./dialogue.js";
import type { CharacterUpdate } from "./updates.js";
import type { WorldContext } from "./world.js";

export type InteractionReason = "PROXIMITY" | "SAME_ZONE" | "SCRIPTED_EVENT";

export interface InteractionContext {
  locationZoneId: string | null;
  reason: InteractionReason;
  notes?: string;
}

export interface StartInteractionInput {
  interactionId: string;
  participants: TalkingCharacter[];
  worldContext: WorldContext;
  interactionContext: InteractionContext;
  maxTurns?: number;
}

export type InteractionStatus = "completed" | "failed";

export interface InteractionErrorSummary {
  code: string;
  message: string;
  details?: unknown;
}

export interface InteractionResult {
  interactionId: string;
  status: InteractionStatus;
  turns: DialogueTurn[];
  updates: CharacterUpdate[];
  error?: InteractionErrorSummary;
  rawResponse?: string;
}

export interface ValidatedInteractionPayload {
  turns: DialogueTurn[];
  updates: CharacterUpdate[];
}

/**
 * Context used internally for prompt building and validation.
 */
export interface InteractionValidationContext {
  interactionId: string;
  input: StartInteractionInput;
  participantIds: Set<string>;
  participantNames: Map<string, string>;
  zoneIds: Set<string>;
  maxTurns: number;
}

export interface EngineProgressEvent {
  phase:
    | "prompt-built"
    | "provider-called"
    | "response-received"
    | "validated"
    | "completed";
  interactionId: string;
  message?: string;
}
