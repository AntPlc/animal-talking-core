/**
 * Structured character updates produced after an interaction.
 */

import type {
  MemoryEntry,
  Mood,
  NpcGoal,
  NpcObjective,
  RelationshipType,
} from "./character.js";

export interface UpdateMood {
  type: "UPDATE_MOOD";
  characterId: string;
  mood: Mood;
}

export interface UpdateObjective {
  type: "UPDATE_OBJECTIVE";
  characterId: string;
  objective: NpcObjective | null;
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

export interface AddGoal {
  type: "ADD_GOAL";
  characterId: string;
  goal: NpcGoal;
}

export interface FulfillGoal {
  type: "FULFILL_GOAL";
  characterId: string;
  goalId: string;
}

export type CharacterUpdate =
  | UpdateMood
  | UpdateObjective
  | AddMemory
  | UpdateRelationship
  | AppendHistory
  | AddGoal
  | FulfillGoal;
