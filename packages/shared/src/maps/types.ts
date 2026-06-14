import type { VoxelMap } from "../map.js";
import type { SpawnPoint } from "../map.js";
import { centroid, type AsciiBuildResult, type CellPos } from "./builder.js";

export interface TeleporterDef {
  from: CellPos;
  to: CellPos & { yaw: number };
}

export interface BuiltMap {
  name: string;
  map: VoxelMap;
  attackerSpawn: SpawnPoint;
  defenderSpawn: SpawnPoint;
  sites: Record<string, CellPos[]>;
  teleporters: TeleporterDef[];
}

const FLOOR = 3; // players stand on the floor surface

/**
 * Standard assembly from ASCII markers: '1' = attacker spawn (faces north/-z),
 * '2' = defender spawn (faces south/+z), 'A'-'C' = sites.
 * Teleporters are wired as one-way pairs: T→U and V→W.
 */
export function assembleMap(name: string, parsed: AsciiBuildResult): BuiltMap {
  const { map, markers } = parsed;
  const a = centroid(markers["1"] ?? [{ x: 4, z: 4 }]);
  const d = centroid(markers["2"] ?? [{ x: 4, z: 4 }]);

  const sites: Record<string, CellPos[]> = {};
  for (const s of ["A", "B", "C"]) if (markers[s]?.length) sites[s] = markers[s]!;

  const teleporters: TeleporterDef[] = [];
  for (const [fromCh, toCh] of [
    ["T", "U"],
    ["V", "W"],
  ] as const) {
    const from = markers[fromCh];
    const to = markers[toCh];
    if (from?.length && to?.length) {
      const dest = centroid(to);
      for (const pad of from) teleporters.push({ from: pad, to: { ...dest, yaw: 0 } });
    }
  }

  return {
    name,
    map,
    attackerSpawn: { x: a.x, y: FLOOR, z: a.z, yaw: 0 },
    defenderSpawn: { x: d.x, y: FLOOR, z: d.z, yaw: Math.PI },
    sites,
    teleporters,
  };
}
