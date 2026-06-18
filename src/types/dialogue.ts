// Copyright (C) 2026 AntPlc, quentinMou
// SPDX-License-Identifier: AGPL-3.0-or-later

/**
 * Turn-by-turn dialogue types returned by the package.
 */

import type { Mood } from "./character.js";

export interface DialogueTurn {
  index: number;
  speakerId: string;
  speakerName: string;
  message: string;
  mood?: Mood;
  createdAt: string;
}
