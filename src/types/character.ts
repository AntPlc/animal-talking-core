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

export interface NpcGoal {
  id: string;
  description: string;
  status: "active" | "fulfilled";
}

export type NpcObjective =
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
  objective: NpcObjective | null;
  history: string;
  mood: Mood;
  knowledge: Record<string, CharacterKnowledge>;
  activeGoals: NpcGoal[];
}

export interface TalkingCharacter {
  id: string;
  name: string;
  role?: string;
  personalityTraits?: string[];
  goals?: string[];
  speakingStyle?: string;
  talkingState: NpcTalkingState;
}
