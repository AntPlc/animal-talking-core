import { describe, expect, it, vi } from "vitest";
import { AnimalTalkingEngine } from "../src/engine/AnimalTalkingEngine.js";
import { applyCharacterUpdates } from "../src/utils/applyCharacterUpdates.js";
import { createInteractionInput, createParticipants } from "./testHelpers.js";

describe("AnimalTalkingEngine", () => {
  it("returns a completed interaction with validated turns and updates", async () => {
    const provider = {
      complete: vi.fn().mockResolvedValue({
        text: JSON.stringify({
          turns: [
            {
              index: 0,
              speakerId: "fox",
              message: "I can guide you.",
              mood: "HAPPY",
            },
          ],
          updates: [
            {
              type: "UPDATE_OBJECTIVE",
              characterId: "fox",
              objective: {
                type: "GO_TO_LOCATION",
                targetZoneId: "pool",
              },
            },
            {
              type: "ADD_MEMORY",
              characterId: "fox",
              targetCharacterId: "owl",
              memory: {
                content: "The visitor asked for help.",
              },
            },
          ],
        }),
      }),
    };

    const engine = new AnimalTalkingEngine({ llmProvider: provider });
    const result = await engine.runInteraction(createInteractionInput());

    expect(result.status).toBe("completed");
    expect(provider.complete).toHaveBeenCalledOnce();
    expect(result.turns).toHaveLength(1);
    expect(result.turns[0].speakerName).toBe("Fox");
    expect(result.updates.map((update) => update.type)).toEqual([
      "UPDATE_OBJECTIVE",
      "ADD_MEMORY",
    ]);

    const updatedParticipants = applyCharacterUpdates(createParticipants(), result.updates);
    expect(updatedParticipants[0].talkingState.objective).toEqual({
      type: "GO_TO_LOCATION",
      targetZoneId: "pool",
    });
    expect(updatedParticipants[0].talkingState.knowledge.owl.memories).toHaveLength(2);
  });

  it("returns a failed result when the provider rejects", async () => {
    const engine = new AnimalTalkingEngine({
      llmProvider: {
        complete: vi.fn().mockRejectedValue(new Error("provider offline")),
      },
    });

    const result = await engine.runInteraction(createInteractionInput());

    expect(result.status).toBe("failed");
    expect(result.turns).toHaveLength(0);
    expect(result.error?.message).toContain("provider offline");
  });

  it("returns a failed result for invalid JSON", async () => {
    const engine = new AnimalTalkingEngine({
      llmProvider: {
        complete: vi.fn().mockResolvedValue({
          text: "not json",
        }),
      },
    });

    const result = await engine.runInteraction(createInteractionInput());

    expect(result.status).toBe("failed");
    expect(result.error?.code).toBe("invalid_json");
  });
});
