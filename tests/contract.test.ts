// Copyright (C) 2026 AntPlc, quentinMou
// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, it } from "vitest";
import * as pkg from "../src/index.js";

describe("public contract", () => {
  it("exposes the expected public entry points", () => {
    expect(typeof pkg.AnimalTalkingEngine).toBe("function");
    expect(typeof pkg.PromptBuilder).toBe("function");
    expect(typeof pkg.validateInteractionResult).toBe("function");
    expect(typeof pkg.applyCharacterUpdates).toBe("function");
    expect(pkg.RelationshipType).toBeDefined();
  });
});
