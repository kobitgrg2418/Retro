// Map registry. Keys are the names used in URLs / lobby config.

import { TEST_MAP_SPAWN, buildTestMap } from "../map.js";
import { buildAscent } from "./ascent.js";
import { buildBind } from "./bind.js";
import { buildHaven } from "./haven.js";
import { buildSunset } from "./sunset.js";
import type { BuiltMap } from "./types.js";

export type { BuiltMap, TeleporterDef } from "./types.js";
export type { CellPos, MapTheme } from "./builder.js";

function buildPlayground(): BuiltMap {
  return {
    name: "Playground",
    map: buildTestMap(),
    attackerSpawn: TEST_MAP_SPAWN,
    defenderSpawn: TEST_MAP_SPAWN,
    sites: {},
    teleporters: [],
  };
}

export const MAPS: Record<string, () => BuiltMap> = {
  ascent: buildAscent,
  bind: buildBind,
  haven: buildHaven,
  sunset: buildSunset,
  playground: buildPlayground,
};

export const DEFAULT_MAP = "ascent";
