import { describe, expect, it } from "vitest";
import {
  buildValidationContext,
  validateInteractionResult,
} from "../src/validators/validateInteractionResult.js";
import { createInteractionInput } from "./testHelpers.js";

describe("validateInteractionResult", () => {
  it("accepts a valid interaction result and normalizes text", () => {
    const context = buildValidationContext(createInteractionInput());
    const result = validateInteractionResult(
      {
        turns: [
          {
            index: 0,
            speakerId: "fox",
            message: "  Hello there, traveler!  ",
            mood: "HAPPY",
          },
        ],
        updates: [
          {
            type: "UPDATE_MOOD",
            characterId: "fox",
            mood: "HAPPY",
          },
          {
            type: "ADD_MEMORY",
            characterId: "fox",
            targetCharacterId: "owl",
            memory: {
              content: "  The player asked for guidance.  ",
            },
          },
        ],
      },
      context,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw result.error;
    }

    expect(result.value.turns[0]).toMatchObject({
      index: 0,
      speakerId: "fox",
      speakerName: "Fox",
      message: "Hello there, traveler!",
      mood: "HAPPY",
    });
    expect(result.value.updates[0]).toEqual({
      type: "UPDATE_MOOD",
      characterId: "fox",
      mood: "HAPPY",
    });
    if (result.value.updates[1].type !== "ADD_MEMORY") {
      throw new Error("Expected ADD_MEMORY");
    }
    expect(result.value.updates[1].memory.id).toMatch(/^memory_/);
    expect(result.value.updates[1].memory.content).toBe("The player asked for guidance.");
  });

  it("rejects unknown speaker ids", () => {
    const result = validateInteractionResult(
      {
        turns: [
          {
            index: 0,
            speakerId: "unknown",
            message: "Hello",
          },
        ],
        updates: [],
      },
      buildValidationContext(createInteractionInput()),
    );

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("Expected validation failure");
    }

    expect(result.error.issues[0].path).toBe("$.turns[0].speakerId");
  });

  it("accepts DISLIKED and ENEMY as valid relationship types", () => {
    const context = buildValidationContext(createInteractionInput());
    const result = validateInteractionResult(
      {
        turns: [],
        updates: [
          {
            type: "UPDATE_RELATIONSHIP",
            characterId: "fox",
            targetCharacterId: "owl",
            relationship: "DISLIKED",
          },
          {
            type: "UPDATE_RELATIONSHIP",
            characterId: "owl",
            targetCharacterId: "fox",
            relationship: "ENEMY",
          },
        ],
      },
      context,
    );

    expect(result.ok).toBe(true);
  });

  it("rejects invalid mood enums and unknown zone objectives", () => {
    const result = validateInteractionResult(
      {
        turns: [],
        updates: [
          {
            type: "UPDATE_MOOD",
            characterId: "fox",
            mood: "SLEEPY",
          },
          {
            type: "UPDATE_OBJECTIVE",
            characterId: "fox",
            objective: {
              type: "GO_TO_LOCATION",
              targetZoneId: "unknown_place",
            },
          },
        ],
      },
      buildValidationContext(createInteractionInput()),
    );

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("Expected validation failure");
    }

    expect(result.error.issues.map((issue) => issue.path)).toContain("$.updates[0].mood");
    expect(result.error.issues.map((issue) => issue.path)).toContain("$.updates[1].objective.targetZoneId");
  });
});
