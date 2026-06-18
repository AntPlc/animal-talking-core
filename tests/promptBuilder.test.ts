// Copyright (C) 2026 AntPlc, quentinMou
// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, it } from "vitest";
import { PromptBuilder } from "../src/llm/PromptBuilder.js";
import { buildValidationContext } from "../src/validators/validateInteractionResult.js";
import { createInteractionInput } from "./testHelpers.js";

describe("PromptBuilder", () => {
  it("builds a closed prompt with constrained context", () => {
    const context = buildValidationContext(
      createInteractionInput({
        interactionContext: {
          locationZoneId: "forest",
          reason: "SAME_ZONE",
        },
      }),
    );

    const builder = new PromptBuilder({
      maxMemoriesPerKnowledge: 1,
      maxKnowledgeTargets: 1,
    });

    const prompt = builder.build(context);

    expect(prompt.systemPrompt).toContain("Return only valid JSON");
    expect(prompt.messages).toHaveLength(2);
    expect(prompt.userPrompt).toContain('"interactionId": "interaction-test"');
    expect(prompt.userPrompt).toContain('"reason": "SAME_ZONE"');
    expect(prompt.userPrompt).toContain('"weather": "RAINY"');
    expect(prompt.userPrompt).toContain('"locationZone"');
    expect(prompt.userPrompt).not.toContain("recentDialogue");
  });

  it("includes notes in the user prompt when provided", () => {
    const context = buildValidationContext(
      createInteractionInput({
        interactionContext: {
          locationZoneId: "forest",
          reason: "PROXIMITY",
          notes: "Fox and Owl have been arguing over territory all week.",
        },
      }),
    );

    const builder = new PromptBuilder();
    const prompt = builder.build(context);

    expect(prompt.userPrompt).toContain("Fox and Owl have been arguing over territory all week.");
  });

  it("omits notes key when not provided", () => {
    const context = buildValidationContext(
      createInteractionInput({
        interactionContext: { locationZoneId: "forest", reason: "PROXIMITY" },
      }),
    );

    const builder = new PromptBuilder();
    const prompt = builder.build(context);

    expect(prompt.userPrompt).not.toContain('"notes"');
  });
});
