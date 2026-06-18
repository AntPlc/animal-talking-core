// Copyright (C) 2026 AntPlc, quentinMou
// SPDX-License-Identifier: AGPL-3.0-or-later

export type LlmMessageRole = "system" | "user" | "assistant";

export interface LlmMessage {
  role: LlmMessageRole;
  content: string;
}

export interface LlmRequest {
  messages: LlmMessage[];
  temperature?: number;
  signal?: AbortSignal;
}

export interface LlmResponse {
  text: string;
  raw?: unknown;
}

export interface LlmProvider {
  complete(request: LlmRequest): Promise<LlmResponse>;
}
