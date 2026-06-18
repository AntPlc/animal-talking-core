// Copyright (C) 2026 AntPlc, quentinMou
// SPDX-License-Identifier: AGPL-3.0-or-later

export type AnimalTalkingErrorCode =
  | "provider_unavailable"
  | "provider_timeout"
  | "invalid_json"
  | "validation_failed"
  | "configuration_error";

export interface ValidationIssue {
  path: string;
  code: string;
  message: string;
}

export class AnimalTalkingError extends Error {
  readonly code: AnimalTalkingErrorCode;

  constructor(code: AnimalTalkingErrorCode, message: string) {
    super(message);
    this.name = "AnimalTalkingError";
    this.code = code;
  }
}

export class InteractionValidationError extends AnimalTalkingError {
  readonly issues: ValidationIssue[];

  constructor(message: string, issues: ValidationIssue[]) {
    super("validation_failed", message);
    this.name = "InteractionValidationError";
    this.issues = issues;
  }
}

export class InteractionProviderError extends AnimalTalkingError {
  constructor(message: string) {
    super("provider_unavailable", message);
    this.name = "InteractionProviderError";
  }
}

export class InteractionParseError extends AnimalTalkingError {
  constructor(message: string) {
    super("invalid_json", message);
    this.name = "InteractionParseError";
  }
}
