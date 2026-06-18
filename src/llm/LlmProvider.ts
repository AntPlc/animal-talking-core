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
