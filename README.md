# animal-talking-core

A runtime-agnostic TypeScript library for LLM-backed NPC dialogue in host simulations.

`animal-talking-core` sits between your simulation and an LLM provider. It builds prompts, calls the provider, validates the JSON response, and returns structured dialogue and character updates. The host app owns everything else: world state, rendering, persistence, and the world loop.

---

## Table of contents

- [Installation](#installation)
- [Quick start](#quick-start)
- [How it works](#how-it-works)
- [Configuration](#configuration)
- [LlmProvider contract](#llmprovider-contract)
- [Public API](#public-api)
- [Validation and failure behavior](#validation-and-failure-behavior)
- [Integration patterns](#integration-patterns)
- [Development](#development)
- [Interface contract](#interface-contract)

---

## Installation

```bash
npm install animal-talking-core
```

**Requirements:** Node.js 18+ · TypeScript strict mode recommended

---

## Quick start

```ts
import {
  AnimalTalkingEngine,
  RelationshipType,
  applyCharacterUpdates,
  type LlmProvider,
  type StartInteractionInput,
} from "animal-talking-core";

const input: StartInteractionInput = {
  interactionId: "interaction-1",
  participants: [
    {
      id: "fox",
      name: "Fox",
      role: "guide",
      personalityTraits: ["curious", "helpful"],
      goals: ["help visitors find the right trail"],
      speakingStyle: "short and practical",
      talkingState: {
        idea: "help visitors",
        objective: null,
        history: "Recently arrived in the forest.",
        mood: "CURIOUS",
        knowledge: {},
        activeGoals: [],
      },
    },
    {
      id: "owl",
      name: "Owl",
      role: "observer",
      personalityTraits: ["calm", "thoughtful"],
      goals: ["protect the balance of the forest"],
      speakingStyle: "measured and polite",
      talkingState: {
        idea: "listen carefully",
        objective: null,
        history: "Prefers thoughtful exchanges.",
        mood: "NEUTRAL",
        knowledge: {
          fox: {
            targetCharacterId: "fox",
            memories: [],
            relationship: RelationshipType.Stranger,
          },
        },
        activeGoals: [],
      },
    },
  ],
  worldContext: {
    time: { day: 1, hour: 14, minute: 30 },
    weather: "RAINY",
    zones: [{ id: "forest", name: "Forest" }],
  },
  interactionContext: {
    locationZoneId: "forest",
    reason: "PROXIMITY",
  },
  maxTurns: 4,
};

// Inject your own LlmProvider implementation
const provider: LlmProvider = {
  async complete({ messages }) {
    // Call your LLM here (OpenAI, Ollama, etc.)
    // Must return { text: string } where text is a JSON string
    return {
      text: JSON.stringify({
        turns: [
          { index: 0, speakerId: "fox", message: "Need help finding the path?", mood: "CURIOUS" },
          { index: 1, speakerId: "owl", message: "Tell me where you want to go first.", mood: "NEUTRAL" },
        ],
        updates: [{ type: "UPDATE_MOOD", characterId: "fox", mood: "HAPPY" }],
      }),
    };
  },
};

const engine = new AnimalTalkingEngine({ llmProvider: provider });
const result = await engine.runInteraction(input);

if (result.status === "completed") {
  const updatedParticipants = applyCharacterUpdates(input.participants, result.updates);
  console.log(result.turns);          // DialogueTurn[]
  console.log(updatedParticipants);   // TalkingCharacter[] with applied updates
} else {
  console.error(result.error);        // { code, message, details? }
}
```

---

## How it works

```
Host App → AnimalTalkingEngine.runInteraction(input)
         → PromptBuilder.build()
         → LlmProvider.complete()
         → validateInteractionResult()
         → InteractionResult
         → applyCharacterUpdates() (optional, in host)
```

| What the package owns | What the host owns |
|-----------------------|--------------------|
| Prompt construction | World loop and tick |
| LLM call orchestration | Movement, proximity, triggers |
| JSON parsing and validation | Rendering and UI |
| Structured output | Persistence and history |
| `applyCharacterUpdates()` helper | When to call `runInteraction()` |

---

## Configuration

### `AnimalTalkingEngine`

```ts
new AnimalTalkingEngine({
  llmProvider,               // required — LlmProvider implementation
  promptBuilder,             // optional — custom PromptBuilder instance
  timeoutMs: 6000,           // optional — fails with provider timeout if exceeded
  onProgress: (event) => {}, // optional — observe lifecycle phases
});
```

Progress phases emitted in order: `prompt-built` → `provider-called` → `response-received` → `validated` → `completed`.

### `PromptBuilder`

```ts
import { PromptBuilder } from "animal-talking-core";

const builder = new PromptBuilder({
  systemPrompt: "You are the Animal Talking interaction planner...",
  maxMemoriesPerKnowledge: 2,  // default: 3
  maxKnowledgeTargets: 3,      // default: 4
});

const engine = new AnimalTalkingEngine({ llmProvider, promptBuilder: builder });
```

---

## LlmProvider contract

Implement this interface to plug in any LLM:

```ts
interface LlmProvider {
  complete(request: {
    messages: { role: "system" | "user" | "assistant"; content: string }[];
    temperature?: number;
    signal?: AbortSignal;
  }): Promise<{ text: string; raw?: unknown }>;
}
```

The `text` field must be a raw JSON string (not markdown-wrapped) with exactly two top-level keys: `turns` and `updates`. The engine validates and normalizes this output before returning it.

---

## Public API

### Classes

| Export | Role |
|--------|------|
| `AnimalTalkingEngine` | Runs one interaction end to end — **never throws** |
| `PromptBuilder` | Builds compact LLM messages from interaction input |

### Functions

| Export | Role |
|--------|------|
| `runInteraction(input)` | Main entry point (method on `AnimalTalkingEngine`) |
| `applyCharacterUpdates(participants, updates)` | Applies validated updates immutably |
| `validateInteractionResult(raw, context)` | Validates raw LLM JSON (usable standalone) |
| `buildValidationContext(input)` | Builds validation metadata from input |

### Key types

```ts
// Input
type StartInteractionInput = {
  interactionId: string;
  participants: TalkingCharacter[];
  worldContext: WorldContext;
  interactionContext: InteractionContext;
  maxTurns?: number;          // default: 6
};

// Output — engine never throws
type InteractionResult = {
  interactionId: string;
  status: "completed" | "failed";
  turns: DialogueTurn[];      // empty on failure
  updates: CharacterUpdate[]; // empty on failure
  error?: { code: string; message: string; details?: unknown };
  rawResponse?: string;
};
```

### Character updates (discriminated union)

The LLM proposes updates; the package validates them; the host applies them.

| Type | Fields |
|------|--------|
| `UPDATE_MOOD` | `characterId`, `mood` |
| `UPDATE_OBJECTIVE` | `characterId`, `objective` (`GO_TO_LOCATION \| TALK_TO_CHARACTER \| IDLE \| null`) |
| `ADD_MEMORY` | `characterId`, `targetCharacterId`, `memory` |
| `UPDATE_RELATIONSHIP` | `characterId`, `targetCharacterId`, `relationship` |
| `APPEND_HISTORY` | `characterId`, `summary` |
| `ADD_GOAL` | `characterId`, `goal` |
| `FULFILL_GOAL` | `characterId`, `goalId` |

### Enumerations

| Enum | Values |
|------|--------|
| `Mood` | `NEUTRAL \| HAPPY \| SAD \| CURIOUS \| ANXIOUS \| ANGRY` |
| `RelationshipType` | `STRANGER \| FRIEND \| RIVAL \| FAMILY \| ROMANTIC_INTEREST` |
| `Weather` | `SUNNY \| CLOUDY \| RAINY \| STORMY \| SNOWY` |
| `InteractionReason` | `PROXIMITY \| SAME_ZONE \| SCRIPTED_EVENT` |

---

## Validation and failure behavior

Every provider response is validated before being returned. Rejected cases:

- non-JSON text
- unknown participant or zone ids
- invalid enum values (`Mood`, `RelationshipType`, etc.)
- unexpected top-level keys
- too many dialogue turns (capped by `maxTurns`)
- invalid memory or objective shapes

On failure, `status` is `"failed"`, `turns` and `updates` are `[]`, and `error` describes the cause.

| Failure | `error.code` |
|---------|-------------|
| Provider throws / timeout | `provider_unavailable` |
| Non-JSON response | `invalid_json` |
| JSON fails validation | `validation_failed` |

---

## Integration patterns

### Mock provider (development)

```ts
const mockProvider: LlmProvider = {
  async complete() {
    return {
      text: JSON.stringify({
        turns: [{ index: 0, speakerId: "fox", message: "I can help." }],
        updates: [{ type: "UPDATE_MOOD", characterId: "fox", mood: "HAPPY" }],
      }),
    };
  },
};
```

### Web Worker

The package is environment-agnostic. Run `AnimalTalkingEngine` inside a Web Worker and `postMessage` the `InteractionResult` back to the UI thread.

### Safe fallback

Keep your world loop running even when interactions fail — check `result.status` before applying updates.

```ts
const result = await engine.runInteraction(input);
if (result.status === "completed") {
  applyCharacterUpdates(participants, result.updates);
}
// simulation continues regardless
```

---

## Development

```bash
npm install
npm test           # run Vitest test suite
npm run typecheck  # TypeScript strict check (no emit)
npm run build      # compile src/ → dist/
```

---

## Interface contract

For the complete type reference, validation rules, data ownership model, behavioral invariants, and error codes, see [`docs/INTERFACE_CONTRACT.md`](docs/INTERFACE_CONTRACT.md).

---

## License

MIT — see [LICENSE](LICENSE).
