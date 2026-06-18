// Copyright (C) 2026 AntPlc, quentinMou
// SPDX-License-Identifier: AGPL-3.0-or-later

/**
 * Builds compact, constrained prompts for LLM interaction generation.
 */

import type { LlmMessage } from "./LlmProvider.js";
import type { InteractionValidationContext } from "../types/interaction.js";
import type { TalkingCharacter } from "../types/character.js";

export interface BuiltPrompt {
  systemPrompt: string;
  userPrompt: string;
  messages: LlmMessage[];
}

export interface PromptBuilderOptions {
  systemPrompt?: string;
  maxMemoriesPerKnowledge?: number;
  maxKnowledgeTargets?: number;
}

const DEFAULT_SYSTEM_PROMPT = [
  "You are the Animal Talking interaction planner.",
  "Return only valid JSON. Do not wrap the JSON in markdown.",
  "Generate short, realistic, on-topic dialogue between the provided participants.",
  "Avoid repetition, digressions, narration, and invented ids or update types.",
  "Use only participant ids, zone ids, objective ids, and relationship values from the context.",
  "All LLM instructions and output field names must stay in English.",

  // Conflict and tone guidance
  "Honor personality conflicts: if a participant has traits like territorial, jealous, proud, or aggressive, let those traits drive the dialogue even when no shared history exists.",
  "Negative outcomes are valid and often realistic: characters may end an exchange more irritated, distrustful, or hostile than when they started.",
  "Do not default to positivity. If the current mood is ANGRY or ANXIOUS, or if memories/history describe past conflict, the dialogue should reflect that tension.",
  "Weather and mood carry weight: STORMY or RAINY weather combined with a bad mood should produce tense or short-tempered dialogue, not cheerful small talk.",
  "If notes are provided in interactionContext, treat them as authoritative narrative context and let them directly shape the tone and outcome of the exchange.",

  // Update guidance
  "Updates are optional: only emit an update when there is a clear, specific reason.",
  "UPDATE_MOOD: reflect the character's emotional state at the END of the exchange — it may be worse than at the start.",
  "UPDATE_RELATIONSHIP: emit when the exchange meaningfully shifts how one character sees another; DISLIKED and ENEMY are valid outcomes for hostile interactions.",
  "APPEND_HISTORY: only if the exchange was meaningful enough to remember; write one concise sentence.",
  "ADD_OBJECTIVE: only if the conversation created a clear new motivation for a character; not every conversation warrants a new objective.",
  "FULFILL_OBJECTIVE: only if an existing active objective was visibly resolved during this conversation; use the exact objective id from context.",

  "The JSON shape is:",
  "{",
  '  "turns": [{ "index": number, "speakerId": string, "message": string, "mood"?: string }],',
  '  "updates": [',
  '    { "type": "UPDATE_MOOD", "characterId": string, "mood": string }',
  '    | { "type": "UPDATE_ACTIVITY", "characterId": string, "activity": object|null }',
  '    | { "type": "ADD_MEMORY", "characterId": string, "targetCharacterId": string, "memory": { "content": string } }',
  '    | { "type": "UPDATE_RELATIONSHIP", "characterId": string, "targetCharacterId": string, "relationship": string }',
  '    | { "type": "APPEND_HISTORY", "characterId": string, "summary": string }',
  '    | { "type": "ADD_OBJECTIVE", "characterId": string, "objective": { "description": string } }',
  '    | { "type": "FULFILL_OBJECTIVE", "characterId": string, "objectiveId": string }',
  "  ]",
  "}",
].join(" ");

function summarizeKnowledge(
  participant: TalkingCharacter,
  maxMemories: number,
  maxTargets: number,
): Record<string, unknown>[] {
  return Object.values(participant.talkingState.knowledge)
    .slice(0, maxTargets)
    .map((knowledge) => ({
      targetCharacterId: knowledge.targetCharacterId,
      relationship: knowledge.relationship,
      memories: knowledge.memories.slice(0, maxMemories).map((memory) => ({
        id: memory.id,
        content: memory.content,
      })),
    }));
}

function summarizeParticipant(
  participant: TalkingCharacter,
  options: Required<PromptBuilderOptions>,
): Record<string, unknown> {
  return {
    id: participant.id,
    name: participant.name,
    role: participant.role,
    personalityTraits: participant.personalityTraits ?? [],
    hobbies: participant.hobbies ?? [],
    speakingStyle: participant.speakingStyle,
    talkingState: {
      idea: participant.talkingState.idea,
      activity: participant.talkingState.activity,
      history: participant.talkingState.history,
      mood: participant.talkingState.mood,
      objectives: participant.talkingState.objectives
        .filter((objective) => objective.status === "active")
        .map((objective) => ({ id: objective.id, description: objective.description })),
      knowledge: summarizeKnowledge(
        participant,
        options.maxMemoriesPerKnowledge,
        options.maxKnowledgeTargets,
      ),
    },
  };
}

export class PromptBuilder {
  private readonly options: Required<PromptBuilderOptions>;

  constructor(options: PromptBuilderOptions = {}) {
    this.options = {
      systemPrompt: options.systemPrompt ?? DEFAULT_SYSTEM_PROMPT,
      maxMemoriesPerKnowledge: options.maxMemoriesPerKnowledge ?? 3,
      maxKnowledgeTargets: options.maxKnowledgeTargets ?? 4,
    };
  }

  build(context: InteractionValidationContext): BuiltPrompt {
    const { input } = context;
    const locationZone = input.worldContext.zones.find(
      (zone) => zone.id === input.interactionContext.locationZoneId,
    );

    const interactionContext: Record<string, unknown> = {
      locationZoneId: input.interactionContext.locationZoneId,
      reason: input.interactionContext.reason,
    };
    if (input.interactionContext.notes) {
      interactionContext.notes = input.interactionContext.notes;
    }

    const userPrompt = JSON.stringify(
      {
        interactionId: input.interactionId,
        interactionContext,
        worldContext: {
          time: input.worldContext.time,
          weather: input.worldContext.weather,
          locationZone: locationZone ?? null,
        },
        participants: input.participants.map((participant) =>
          summarizeParticipant(participant, this.options),
        ),
        maxTurns: context.maxTurns,
      },
      null,
      2,
    );

    return {
      systemPrompt: this.options.systemPrompt,
      userPrompt,
      messages: [
        { role: "system", content: this.options.systemPrompt },
        { role: "user", content: userPrompt },
      ],
    };
  }
}
