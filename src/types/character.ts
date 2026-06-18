// Copyright (C) 2026 AntPlc, quentinMou
// SPDX-License-Identifier: AGPL-3.0-or-later

/**
 * Character identity and Animal Talking runtime state types.
 */

export type Mood =
  | "NEUTRAL"
  | "HAPPY"
  | "SAD"
  | "CURIOUS"
  | "ANXIOUS"
  | "ANGRY";

export enum RelationshipType {
  Stranger = "STRANGER",
  Disliked = "DISLIKED",
  Friend = "FRIEND",
  Rival = "RIVAL",
  Enemy = "ENEMY",
  Family = "FAMILY",
  RomanticInterest = "ROMANTIC_INTEREST",
}

export interface MemoryEntry {
  id: string;
  content: string;
  createdAt: string;
}

export interface CharacterKnowledge {
  targetCharacterId: string;
  memories: MemoryEntry[];
  relationship: RelationshipType;
}

export interface NpcObjective {
  id: string;
  description: string;
  status: "active" | "fulfilled";
}

export type NpcActivity =
  | {
      type: "GO_TO_LOCATION";
      targetZoneId: string;
    }
  | {
      type: "TALK_TO_CHARACTER";
      targetCharacterId: string;
    }
  | {
      type: "IDLE";
    };

export interface NpcTalkingState {
  idea: string;
  activity: NpcActivity | null;
  history: string;
  mood: Mood;
  knowledge: Record<string, CharacterKnowledge>;
  objectives: NpcObjective[];
}

export interface TalkingCharacter {
  id: string;
  name: string;
  role?: string;
  personalityTraits?: string[];
  hobbies?: string[];
  speakingStyle?: string;
  talkingState: NpcTalkingState;
}
