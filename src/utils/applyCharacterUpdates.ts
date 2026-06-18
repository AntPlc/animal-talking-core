// Copyright (C) 2026 AntPlc, quentinMou
// SPDX-License-Identifier: AGPL-3.0-or-later

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
      case "UPDATE_ACTIVITY":
        character.talkingState.activity = update.activity;
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
      case "ADD_OBJECTIVE": {
        character.talkingState.objectives.push(update.objective);
        break;
      }
      case "FULFILL_OBJECTIVE": {
        const objective = character.talkingState.objectives.find(
          (entry) => entry.id === update.objectiveId,
        );
        if (objective) {
          objective.status = "fulfilled";
        }
        break;
      }
    }
  });

  return next;
}
