// Copyright (C) 2026 AntPlc, quentinMou
// SPDX-License-Identifier: AGPL-3.0-or-later

/**
 * Schema constants and helpers for interaction validation.
 */

import type { Mood } from "../types/character.js";
import type { InteractionReason } from "../types/interaction.js";
import type { Weather } from "../types/world.js";
import type { ValidationIssue } from "../types/errors.js";

export const characterUpdateTypes = [
  "UPDATE_MOOD",
  "UPDATE_ACTIVITY",
  "ADD_MEMORY",
  "UPDATE_RELATIONSHIP",
  "APPEND_HISTORY",
  "ADD_OBJECTIVE",
  "FULFILL_OBJECTIVE",
] as const;

export const npcObjectiveStatuses = ["active", "fulfilled"] as const;

export const moods: readonly Mood[] = [
  "NEUTRAL",
  "HAPPY",
  "SAD",
  "CURIOUS",
  "ANXIOUS",
  "ANGRY",
] as const;

export const relationshipTypes = [
  "STRANGER",
  "DISLIKED",
  "FRIEND",
  "RIVAL",
  "ENEMY",
  "FAMILY",
  "ROMANTIC_INTEREST",
] as const;

export const activityTypes = [
  "GO_TO_LOCATION",
  "TALK_TO_CHARACTER",
  "IDLE",
] as const;

export const interactionReasons: readonly InteractionReason[] = [
  "PROXIMITY",
  "SAME_ZONE",
  "SCRIPTED_EVENT",
] as const;

export const weatherTypes: readonly Weather[] = [
  "SUNNY",
  "CLOUDY",
  "RAINY",
  "STORMY",
  "SNOWY",
] as const;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function hasOnlyKeys(
  value: Record<string, unknown>,
  allowedKeys: readonly string[],
): boolean {
  return Object.keys(value).every((key) => allowedKeys.includes(key));
}

export function stringIssue(path: string, message: string): ValidationIssue {
  return {
    path,
    code: "invalid_string",
    message,
  };
}

export function enumIssue(path: string, message: string): ValidationIssue {
  return {
    path,
    code: "invalid_enum",
    message,
  };
}

export function objectIssue(path: string, message: string): ValidationIssue {
  return {
    path,
    code: "invalid_object",
    message,
  };
}
