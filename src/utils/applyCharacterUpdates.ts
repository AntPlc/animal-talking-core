/**
 * Applies validated character updates to participant talking state.
 */

import { RelationshipType, type TalkingCharacter } from "../types/character.js";
import type { CharacterUpdate } from "../types/updates.js";

function cloneParticipants(participants: TalkingCharacter[]): TalkingCharacter[] {
  return JSON.parse(JSON.stringify(participants)) as TalkingCharacter[];
}

export function applyCharacterUpdates(
  participants: TalkingCharacter[],
  updates: CharacterUpdate[],
): TalkingCharacter[] {
  const next = cloneParticipants(participants);
  const byId = new Map(next.map((participant) => [participant.id, participant]));

  updates.forEach((update) => {
    const character = byId.get(update.characterId);
    if (!character) {
      return;
    }

    switch (update.type) {
      case "UPDATE_MOOD":
        character.talkingState.mood = update.mood;
        break;
      case "UPDATE_OBJECTIVE":
        character.talkingState.objective = update.objective;
        break;
      case "ADD_MEMORY": {
        const knowledge =
          character.talkingState.knowledge[update.targetCharacterId] ?? {
            targetCharacterId: update.targetCharacterId,
            memories: [],
            relationship: RelationshipType.Stranger,
          };
        knowledge.memories.push(update.memory);
        character.talkingState.knowledge[update.targetCharacterId] = knowledge;
        break;
      }
      case "UPDATE_RELATIONSHIP": {
        const knowledge =
          character.talkingState.knowledge[update.targetCharacterId] ?? {
            targetCharacterId: update.targetCharacterId,
            memories: [],
            relationship: update.relationship,
          };
        knowledge.relationship = update.relationship;
        character.talkingState.knowledge[update.targetCharacterId] = knowledge;
        break;
      }
      case "APPEND_HISTORY": {
        const separator = character.talkingState.history.length > 0 ? "\n" : "";
        character.talkingState.history += separator + update.summary;
        break;
      }
      case "ADD_GOAL": {
        character.talkingState.activeGoals.push(update.goal);
        break;
      }
      case "FULFILL_GOAL": {
        const goal = character.talkingState.activeGoals.find((g) => g.id === update.goalId);
        if (goal) {
          goal.status = "fulfilled";
        }
        break;
      }
    }
  });

  return next;
}
