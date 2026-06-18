// Copyright (C) 2026 AntPlc, quentinMou
// SPDX-License-Identifier: AGPL-3.0-or-later

/**
 * Structured character updates produced after an interaction.
 */

import type {
  MemoryEntry,
  Mood,
  NpcActivity,
  NpcObjective,
  RelationshipType,
} from "./character.js";

export interface UpdateMood {
  type: "UPDATE_MOOD";
  characterId: string;
  mood: Mood;
}

export interface UpdateActivity {
  type: "UPDATE_ACTIVITY";
  characterId: string;
  activity: NpcActivity | null;
}

export interface AddMemory {
  type: "ADD_MEMORY";
  characterId: string;
  targetCharacterId: string;
  memory: MemoryEntry;
}

export interface UpdateRelationship {
  type: "UPDATE_RELATIONSHIP";
  characterId: string;
  targetCharacterId: string;
  relationship: RelationshipType;
}

export interface AppendHistory {
  type: "APPEND_HISTORY";
  characterId: string;
  summary: string;
}

export interface AddObjective {
  type: "ADD_OBJECTIVE";
  characterId: string;
  objective: NpcObjective;
}

export interface FulfillObjective {
  type: "FULFILL_OBJECTIVE";
  characterId: string;
  objectiveId: string;
}

export type CharacterUpdate =
  | UpdateMood
  | UpdateActivity
  | AddMemory
  | UpdateRelationship
  | AppendHistory
  | AddObjective
  | FulfillObjective;
