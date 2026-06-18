// Copyright (C) 2026 AntPlc, quentinMou
// SPDX-License-Identifier: AGPL-3.0-or-later

import { RelationshipType, type TalkingCharacter } from "../src/types/character.js";
import type { StartInteractionInput } from "../src/types/interaction.js";
import type { WorldContext } from "../src/types/world.js";

export function createWorldContext(): WorldContext {
  return {
    time: { day: 1, hour: 14, minute: 30 },
    weather: "RAINY",
    zones: [
      { id: "forest", name: "Forest", description: "A quiet forest path." },
      { id: "pool", name: "Pool", description: "A community pool." },
    ],
  };
}

export function createParticipants(): TalkingCharacter[] {
  return [
    {
      id: "fox",
      name: "Fox",
      role: "guide",
      personalityTraits: ["curious", "friendly"],
      hobbies: ["help visitors"],
      speakingStyle: "short and warm",
      talkingState: {
        idea: "watch the path",
        activity: null,
        history: "Met the player near the forest.",
        mood: "CURIOUS",
        objectives: [],
        knowledge: {
          owl: {
            targetCharacterId: "owl",
            memories: [
              {
                id: "memory-1",
                content: "Owl often shares useful observations.",
                createdAt: "2026-06-15T12:00:00.000Z",
              },
            ],
            relationship: RelationshipType.Friend,
          },
        },
      },
    },
    {
      id: "owl",
      name: "Owl",
      role: "observer",
      personalityTraits: ["calm", "precise"],
      hobbies: ["remember details"],
      speakingStyle: "measured",
      talkingState: {
        idea: "listen quietly",
        activity: null,
        history: "Prefers thoughtful exchanges.",
        mood: "NEUTRAL",
        objectives: [],
        knowledge: {
          fox: {
            targetCharacterId: "fox",
            memories: [],
            relationship: RelationshipType.Stranger,
          },
        },
      },
    },
  ];
}

export function createInteractionInput(
  overrides: Partial<StartInteractionInput> = {},
): StartInteractionInput {
  return {
    interactionId: "interaction-test",
    participants: createParticipants(),
    worldContext: createWorldContext(),
    interactionContext: {
      locationZoneId: "forest",
      reason: "PROXIMITY",
    },
    maxTurns: 4,
    ...overrides,
  };
}
