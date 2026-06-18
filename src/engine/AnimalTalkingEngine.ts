// Copyright (C) 2026 AntPlc, quentinMou
// SPDX-License-Identifier: AGPL-3.0-or-later

/**
 * Orchestrates interaction generation, validation, and structured results.
 */

import type { LlmProvider } from "../llm/LlmProvider.js";
import { PromptBuilder, type BuiltPrompt } from "../llm/PromptBuilder.js";
import {
  buildValidationContext,
  validateInteractionResult,
} from "../validators/validateInteractionResult.js";
import type {
  EngineProgressEvent,
  InteractionErrorSummary,
  InteractionResult,
  StartInteractionInput,
} from "../types/interaction.js";
import { AnimalTalkingError, InteractionProviderError } from "../types/errors.js";

export interface AnimalTalkingEngineOptions {
  llmProvider: LlmProvider;
  promptBuilder?: PromptBuilder;
  timeoutMs?: number;
  onProgress?: (event: EngineProgressEvent) => void;
}

function summarizeError(
  error: unknown,
  fallbackCode: string,
  fallbackMessage: string,
): InteractionErrorSummary {
  if (error instanceof AnimalTalkingError) {
    return {
      code: error.code,
      message: error.message,
      details: error,
    };
  }

  if (error instanceof Error) {
    return {
      code: fallbackCode,
      message: error.message,
      details: error,
    };
  }

  return {
    code: fallbackCode,
    message: fallbackMessage,
    details: error,
  };
}

function failedResult(
  interactionId: string,
  error: InteractionErrorSummary,
  rawResponse?: string,
): InteractionResult {
  return {
    interactionId,
    status: "failed",
    turns: [],
    updates: [],
    error,
    rawResponse,
  };
}

async function runWithTimeout<T>(
  task: Promise<T>,
  timeoutMs: number | undefined,
): Promise<T> {
  if (!timeoutMs || timeoutMs <= 0) {
    return task;
  }

  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new InteractionProviderError(`Provider timed out after ${timeoutMs}ms.`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([task, timeout]);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
}

export class AnimalTalkingEngine {
  private readonly llmProvider: LlmProvider;
  private readonly promptBuilder: PromptBuilder;
  private readonly timeoutMs?: number;
  private readonly onProgress?: (event: EngineProgressEvent) => void;

  constructor(options: AnimalTalkingEngineOptions) {
    this.llmProvider = options.llmProvider;
    this.promptBuilder = options.promptBuilder ?? new PromptBuilder();
    this.timeoutMs = options.timeoutMs;
    this.onProgress = options.onProgress;
  }

  static create(options: AnimalTalkingEngineOptions): AnimalTalkingEngine {
    return new AnimalTalkingEngine(options);
  }

  async runInteraction(input: StartInteractionInput): Promise<InteractionResult> {
    const context = buildValidationContext(input);
    const prompt: BuiltPrompt = this.promptBuilder.build(context);

    this.onProgress?.({
      phase: "prompt-built",
      interactionId: input.interactionId,
      message: "Prompt built successfully.",
    });

    try {
      this.onProgress?.({
        phase: "provider-called",
        interactionId: input.interactionId,
        message: "Sending messages to provider.",
      });

      const response = await runWithTimeout(
        this.llmProvider.complete({
          messages: prompt.messages,
        }),
        this.timeoutMs,
      );

      this.onProgress?.({
        phase: "response-received",
        interactionId: input.interactionId,
        message: "Response received from provider.",
      });

      let parsed: unknown;
      try {
        parsed = JSON.parse(response.text);
      } catch (error) {
        return failedResult(
          input.interactionId,
          summarizeError(error, "invalid_json", "The provider response was not valid JSON."),
          response.text,
        );
      }

      const validation = validateInteractionResult(parsed, context);
      if (!validation.ok) {
        return failedResult(
          input.interactionId,
          summarizeError(validation.error, validation.error.code, validation.error.message),
          response.text,
        );
      }

      this.onProgress?.({
        phase: "validated",
        interactionId: input.interactionId,
        message: "Validated provider result.",
      });

      this.onProgress?.({
        phase: "completed",
        interactionId: input.interactionId,
        message: "Interaction completed.",
      });

      return {
        interactionId: input.interactionId,
        status: "completed",
        turns: validation.value.turns,
        updates: validation.value.updates,
        rawResponse: response.text,
      };
    } catch (error) {
      return failedResult(
        input.interactionId,
        summarizeError(error, "provider_unavailable", "The provider is unavailable."),
      );
    }
  }
}
