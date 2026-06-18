/**
 * Validates and normalizes LLM interaction output before application.
 */

import {
  characterUpdateTypes,
  hasOnlyKeys,
  isRecord,
  moods,
  objectiveTypes,
  objectIssue,
  relationshipTypes,
  stringIssue,
} from "../schemas/interactionSchemas.js";
import type { NpcGoal } from "../types/character.js";
import type { Mood, NpcObjective, RelationshipType } from "../types/character.js";
import type { DialogueTurn } from "../types/dialogue.js";
import type {
  InteractionValidationContext,
  StartInteractionInput,
  ValidatedInteractionPayload,
} from "../types/interaction.js";
import type { ValidationIssue, InteractionValidationError } from "../types/errors.js";
import { InteractionValidationError as InteractionValidationErrorClass } from "../types/errors.js";
import type { CharacterUpdate } from "../types/updates.js";

export interface ValidationResultOk<T> {
  ok: true;
  value: T;
}

export interface ValidationResultError {
  ok: false;
  error: InteractionValidationError;
}

export type ValidationResult<T> = ValidationResultOk<T> | ValidationResultError;

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function createGeneratedId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function toError(issues: ValidationIssue[]): InteractionValidationError {
  const message = issues.map((issue) => `${issue.path}: ${issue.message}`).join("; ");
  return new InteractionValidationErrorClass(message || "Invalid interaction result.", issues);
}

function fail(...issues: ValidationIssue[]): ValidationResultError {
  return {
    ok: false,
    error: toError(issues),
  };
}

function validateObjective(
  value: unknown,
  path: string,
  context: InteractionValidationContext,
): ValidationResult<NpcObjective | null> {
  if (value === null) {
    return { ok: true, value: null };
  }

  if (!isRecord(value)) {
    return fail(objectIssue(path, "objective must be an object or null."));
  }

  if (!hasOnlyKeys(value, ["type", "targetZoneId", "targetCharacterId"])) {
    return fail(objectIssue(path, "Unexpected keys in objective."));
  }

  if (typeof value.type !== "string" || !objectiveTypes.includes(value.type as never)) {
    return fail({
      path: `${path}.type`,
      code: "invalid_enum",
      message: "objective.type must be GO_TO_LOCATION, TALK_TO_CHARACTER, or IDLE.",
    });
  }

  switch (value.type) {
    case "GO_TO_LOCATION": {
      if (typeof value.targetZoneId !== "string" || value.targetZoneId.trim() === "") {
        return fail(stringIssue(`${path}.targetZoneId`, "targetZoneId must be a non-empty string."));
      }
      if (!context.zoneIds.has(value.targetZoneId)) {
        return fail(stringIssue(`${path}.targetZoneId`, "targetZoneId must reference a known zone."));
      }
      return {
        ok: true,
        value: { type: "GO_TO_LOCATION", targetZoneId: value.targetZoneId },
      };
    }
    case "TALK_TO_CHARACTER": {
      if (typeof value.targetCharacterId !== "string" || value.targetCharacterId.trim() === "") {
        return fail(stringIssue(`${path}.targetCharacterId`, "targetCharacterId must be a non-empty string."));
      }
      if (!context.participantIds.has(value.targetCharacterId)) {
        return fail(stringIssue(`${path}.targetCharacterId`, "targetCharacterId must reference a known participant."));
      }
      return {
        ok: true,
        value: { type: "TALK_TO_CHARACTER", targetCharacterId: value.targetCharacterId },
      };
    }
    case "IDLE":
      return { ok: true, value: { type: "IDLE" } };
    default:
      return fail({
        path: `${path}.type`,
        code: "invalid_enum",
        message: "Unsupported objective type.",
      });
  }
}

function validateTurn(
  value: unknown,
  path: string,
  context: InteractionValidationContext,
): ValidationResult<DialogueTurn> {
  if (!isRecord(value)) {
    return fail(objectIssue(path, "Expected a turn object."));
  }

  if (!hasOnlyKeys(value, ["index", "speakerId", "message", "mood"])) {
    return fail(objectIssue(path, "Unexpected keys in turn."));
  }

  const { index, speakerId, message, mood } = value;

  if (typeof index !== "number" || !Number.isInteger(index) || index < 0) {
    return fail({
      path: `${path}.index`,
      code: "invalid_number",
      message: "index must be a non-negative integer.",
    });
  }

  if (typeof speakerId !== "string" || speakerId.trim() === "") {
    return fail(stringIssue(`${path}.speakerId`, "speakerId must be a non-empty string."));
  }

  if (!context.participantIds.has(speakerId)) {
    return fail(stringIssue(`${path}.speakerId`, "speakerId must reference a known participant."));
  }

  if (typeof message !== "string" || message.trim() === "") {
    return fail(stringIssue(`${path}.message`, "message must be a non-empty string."));
  }

  if (mood !== undefined && (typeof mood !== "string" || !moods.includes(mood as Mood))) {
    return fail({
      path: `${path}.mood`,
      code: "invalid_enum",
      message: "mood must be one of the allowed moods when provided.",
    });
  }

  const speakerName = context.participantNames.get(speakerId) ?? speakerId;

  return {
    ok: true,
    value: {
      index,
      speakerId,
      speakerName,
      message: normalizeText(message),
      mood: mood as Mood | undefined,
      createdAt: new Date().toISOString(),
    },
  };
}

function validateCharacterUpdate(
  value: unknown,
  path: string,
  context: InteractionValidationContext,
): ValidationResult<CharacterUpdate> {
  if (!isRecord(value)) {
    return fail(objectIssue(path, "Expected an update object."));
  }

  if (typeof value.type !== "string" || !characterUpdateTypes.includes(value.type as never)) {
    return fail({
      path: `${path}.type`,
      code: "invalid_enum",
      message: "type must be one of the supported character update types.",
    });
  }

  switch (value.type) {
    case "UPDATE_MOOD": {
      if (!hasOnlyKeys(value, ["type", "characterId", "mood"])) {
        return fail(objectIssue(path, "Unexpected keys in UPDATE_MOOD."));
      }
      const { characterId, mood } = value;
      if (typeof characterId !== "string" || !context.participantIds.has(characterId)) {
        return fail(stringIssue(`${path}.characterId`, "characterId must reference a known participant."));
      }
      if (typeof mood !== "string" || !moods.includes(mood as Mood)) {
        return fail({
          path: `${path}.mood`,
          code: "invalid_enum",
          message: "mood must be one of the allowed moods.",
        });
      }
      return { ok: true, value: { type: "UPDATE_MOOD", characterId, mood: mood as Mood } };
    }
    case "UPDATE_OBJECTIVE": {
      if (!hasOnlyKeys(value, ["type", "characterId", "objective"])) {
        return fail(objectIssue(path, "Unexpected keys in UPDATE_OBJECTIVE."));
      }
      const { characterId, objective } = value;
      if (typeof characterId !== "string" || !context.participantIds.has(characterId)) {
        return fail(stringIssue(`${path}.characterId`, "characterId must reference a known participant."));
      }
      const validatedObjective = validateObjective(objective, `${path}.objective`, context);
      if (!validatedObjective.ok) {
        return validatedObjective;
      }
      return {
        ok: true,
        value: {
          type: "UPDATE_OBJECTIVE",
          characterId,
          objective: validatedObjective.value,
        },
      };
    }
    case "ADD_MEMORY": {
      if (!hasOnlyKeys(value, ["type", "characterId", "targetCharacterId", "memory"])) {
        return fail(objectIssue(path, "Unexpected keys in ADD_MEMORY."));
      }
      const { characterId, targetCharacterId, memory } = value;
      if (typeof characterId !== "string" || !context.participantIds.has(characterId)) {
        return fail(stringIssue(`${path}.characterId`, "characterId must reference a known participant."));
      }
      if (typeof targetCharacterId !== "string" || !context.participantIds.has(targetCharacterId)) {
        return fail(stringIssue(`${path}.targetCharacterId`, "targetCharacterId must reference a known participant."));
      }
      if (!isRecord(memory)) {
        return fail(objectIssue(`${path}.memory`, "memory must be an object."));
      }
      if (!hasOnlyKeys(memory, ["id", "content", "createdAt"])) {
        return fail(objectIssue(`${path}.memory`, "Unexpected keys in memory."));
      }
      if (typeof memory.content !== "string" || memory.content.trim() === "") {
        return fail(stringIssue(`${path}.memory.content`, "memory.content must be a non-empty string."));
      }
      return {
        ok: true,
        value: {
          type: "ADD_MEMORY",
          characterId,
          targetCharacterId,
          memory: {
            id:
              typeof memory.id === "string" && memory.id.trim() !== ""
                ? memory.id.trim()
                : createGeneratedId("memory"),
            content: normalizeText(memory.content),
            createdAt:
              typeof memory.createdAt === "string" && memory.createdAt.trim() !== ""
                ? memory.createdAt
                : new Date().toISOString(),
          },
        },
      };
    }
    case "UPDATE_RELATIONSHIP": {
      if (!hasOnlyKeys(value, ["type", "characterId", "targetCharacterId", "relationship"])) {
        return fail(objectIssue(path, "Unexpected keys in UPDATE_RELATIONSHIP."));
      }
      const { characterId, targetCharacterId, relationship } = value;
      if (typeof characterId !== "string" || !context.participantIds.has(characterId)) {
        return fail(stringIssue(`${path}.characterId`, "characterId must reference a known participant."));
      }
      if (typeof targetCharacterId !== "string" || !context.participantIds.has(targetCharacterId)) {
        return fail(stringIssue(`${path}.targetCharacterId`, "targetCharacterId must reference a known participant."));
      }
      if (typeof relationship !== "string" || !relationshipTypes.includes(relationship as never)) {
        return fail({
          path: `${path}.relationship`,
          code: "invalid_enum",
          message: "relationship must be one of the allowed relationship types.",
        });
      }
      return {
        ok: true,
        value: {
          type: "UPDATE_RELATIONSHIP",
          characterId,
          targetCharacterId,
          relationship: relationship as RelationshipType,
        },
      };
    }
    case "APPEND_HISTORY": {
      if (!hasOnlyKeys(value, ["type", "characterId", "summary"])) {
        return fail(objectIssue(path, "Unexpected keys in APPEND_HISTORY."));
      }
      const { characterId, summary } = value;
      if (typeof characterId !== "string" || !context.participantIds.has(characterId)) {
        return fail(stringIssue(`${path}.characterId`, "characterId must reference a known participant."));
      }
      if (typeof summary !== "string" || summary.trim() === "") {
        return fail(stringIssue(`${path}.summary`, "summary must be a non-empty string."));
      }
      return {
        ok: true,
        value: { type: "APPEND_HISTORY", characterId, summary: normalizeText(summary) },
      };
    }
    case "ADD_GOAL": {
      if (!hasOnlyKeys(value, ["type", "characterId", "goal"])) {
        return fail(objectIssue(path, "Unexpected keys in ADD_GOAL."));
      }
      const { characterId, goal } = value;
      if (typeof characterId !== "string" || !context.participantIds.has(characterId)) {
        return fail(stringIssue(`${path}.characterId`, "characterId must reference a known participant."));
      }
      if (!isRecord(goal)) {
        return fail(objectIssue(`${path}.goal`, "goal must be an object."));
      }
      if (!hasOnlyKeys(goal, ["id", "description", "status"])) {
        return fail(objectIssue(`${path}.goal`, "Unexpected keys in goal."));
      }
      if (typeof goal.description !== "string" || goal.description.trim() === "") {
        return fail(stringIssue(`${path}.goal.description`, "goal.description must be a non-empty string."));
      }
      const normalizedGoal: NpcGoal = {
        id:
          typeof goal.id === "string" && goal.id.trim() !== ""
            ? goal.id.trim()
            : createGeneratedId("goal"),
        description: normalizeText(goal.description),
        status: "active",
      };
      return { ok: true, value: { type: "ADD_GOAL", characterId, goal: normalizedGoal } };
    }
    case "FULFILL_GOAL": {
      if (!hasOnlyKeys(value, ["type", "characterId", "goalId"])) {
        return fail(objectIssue(path, "Unexpected keys in FULFILL_GOAL."));
      }
      const { characterId, goalId } = value;
      if (typeof characterId !== "string" || !context.participantIds.has(characterId)) {
        return fail(stringIssue(`${path}.characterId`, "characterId must reference a known participant."));
      }
      if (typeof goalId !== "string" || goalId.trim() === "") {
        return fail(stringIssue(`${path}.goalId`, "goalId must be a non-empty string."));
      }
      return { ok: true, value: { type: "FULFILL_GOAL", characterId, goalId: goalId.trim() } };
    }
    default:
      return fail({
        path: `${path}.type`,
        code: "invalid_enum",
        message: "Unsupported update type.",
      });
  }
}

export function buildValidationContext(input: StartInteractionInput): InteractionValidationContext {
  const participantIds = new Set(input.participants.map((participant) => participant.id));
  const participantNames = new Map(
    input.participants.map((participant) => [participant.id, participant.name]),
  );
  const zoneIds = new Set(input.worldContext.zones.map((zone) => zone.id));

  return {
    interactionId: input.interactionId,
    input,
    participantIds,
    participantNames,
    zoneIds,
    maxTurns: input.maxTurns ?? 6,
  };
}

export function validateInteractionResult(
  raw: unknown,
  context: InteractionValidationContext,
): ValidationResult<ValidatedInteractionPayload> {
  if (!isRecord(raw)) {
    return fail(objectIssue("$", "Expected an object response from the LLM."));
  }

  if (!hasOnlyKeys(raw, ["turns", "updates"])) {
    return fail(objectIssue("$", "Unexpected top-level keys in interaction result."));
  }

  const issues: ValidationIssue[] = [];
  const result: ValidatedInteractionPayload = {
    turns: [],
    updates: [],
  };

  if (!Array.isArray(raw.turns)) {
    issues.push(objectIssue("$.turns", "turns must be an array."));
  } else {
    if (raw.turns.length > context.maxTurns) {
      issues.push({
        path: "$.turns",
        code: "too_many_items",
        message: `turns cannot contain more than ${context.maxTurns} items.`,
      });
    }

    raw.turns.forEach((entry, index) => {
      const validated = validateTurn(entry, `$.turns[${index}]`, context);
      if (!validated.ok) {
        issues.push(...validated.error.issues);
        return;
      }
      result.turns.push(validated.value);
    });
  }

  if (!Array.isArray(raw.updates)) {
    issues.push(objectIssue("$.updates", "updates must be an array."));
  } else {
    raw.updates.forEach((entry, index) => {
      const validated = validateCharacterUpdate(entry, `$.updates[${index}]`, context);
      if (!validated.ok) {
        issues.push(...validated.error.issues);
        return;
      }
      result.updates.push(validated.value);
    });
  }

  if (issues.length > 0) {
    return fail(...issues);
  }

  return { ok: true, value: result };
}
