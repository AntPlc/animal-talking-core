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
      goals: ["help visitors"],
      speakingStyle: "short and warm",
      talkingState: {
        idea: "watch the path",
        objective: null,
        history: "Met the player near the forest.",
        mood: "CURIOUS",
        activeGoals: [],
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
      goals: ["remember details"],
      speakingStyle: "measured",
      talkingState: {
        idea: "listen quietly",
        objective: null,
        history: "Prefers thoughtful exchanges.",
        mood: "NEUTRAL",
        activeGoals: [],
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
