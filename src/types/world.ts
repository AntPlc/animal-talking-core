// Copyright (C) 2026 AntPlc, quentinMou
// SPDX-License-Identifier: AGPL-3.0-or-later

/**
 * World context passed into an interaction request.
 */

export interface WorldTime {
  day: number;
  hour: number;
  minute: number;
}

export type Weather = "SUNNY" | "CLOUDY" | "RAINY" | "STORMY" | "SNOWY";

export interface WorldZone {
  id: string;
  name: string;
  description?: string;
}

export interface WorldContext {
  time: WorldTime;
  weather: Weather;
  zones: WorldZone[];
}
