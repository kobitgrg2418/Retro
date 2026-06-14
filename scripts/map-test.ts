// Map validation: builds every registered map, prints a top-down render
// reconstructed from the voxels, and BFS-checks that the defender spawn,
// every bomb site, and every teleporter landing are reachable from the
// attacker spawn (4-dir movement, max 1-block step up = a jump).
//   npx tsx scripts/map-test.ts

import {
  Block,
  MAPS,
  getBlock,
  type BuiltMap,
  type VoxelMap,
} from "@blockstrike/shared";

const MAX_STAND_HEIGHT = 6; // surfaces above this are wall tops, not playable
let failures = 0;

function check(name: string, cond: boolean, detail = ""): void {
  if (cond) console.log(`PASS  ${name}`);
  else {
    failures++;
    console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

/** Top of the highest solid block in the column (the y your feet rest at). */
function surfaceHeight(map: VoxelMap, x: number, z: number): number {
  for (let y = map.sizeY - 1; y >= 0; y--) {
    if (getBlock(map, x, y, z) !== Block.Air) return y + 1;
  }
  return 0;
}

function standable(map: VoxelMap, x: number, z: number): boolean {
  if (x < 0 || z < 0 || x >= map.sizeX || z >= map.sizeZ) return false;
  return surfaceHeight(map, x, z) <= MAX_STAND_HEIGHT;
}

/** BFS over walkable columns; returns the set of reachable "x,z" keys. */
function reachableFrom(built: BuiltMap, startX: number, startZ: number): Set<string> {
  const { map } = built;
  const key = (x: number, z: number) => `${x},${z}`;
  const seen = new Set<string>();
  const queue: [number, number][] = [[Math.floor(startX), Math.floor(startZ)]];
  seen.add(key(queue[0]![0], queue[0]![1]));

  while (queue.length) {
    const [x, z] = queue.shift()!;
    const h = surfaceHeight(map, x, z);

    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nx = x + dx;
      const nz = z + dz;
      if (seen.has(key(nx, nz)) || !standable(map, nx, nz)) continue;
      if (surfaceHeight(map, nx, nz) - h > 1) continue; // too high to jump
      seen.add(key(nx, nz));
      queue.push([nx, nz]);
    }

    // One-way teleporter edges.
    for (const tp of built.teleporters) {
      if (Math.abs(tp.from.x - x) <= 1 && Math.abs(tp.from.z - z) <= 1) {
        const tx = Math.floor(tp.to.x);
        const tz = Math.floor(tp.to.z);
        if (!seen.has(key(tx, tz)) && standable(map, tx, tz)) {
          seen.add(key(tx, tz));
          queue.push([tx, tz]);
        }
      }
    }
  }
  return seen;
}

/** Downsampled (2×2 -> 1 char) top-down render straight from the voxels. */
function render(built: BuiltMap): string {
  const { map } = built;
  const lines: string[] = [];
  for (let z = 0; z < map.sizeZ; z += 2) {
    let line = "";
    for (let x = 0; x < map.sizeX; x += 2) {
      const h = surfaceHeight(map, x, z);
      const surface = getBlock(map, x, h - 1, z);
      if (h > MAX_STAND_HEIGHT) line += "#";
      else if (surface === Block.Portal) line += "T";
      else if (surface === Block.SiteMark) line += "s";
      else if (h === 4) line += "-";
      else if (h === 5) line += "=";
      else line += ".";
    }
    lines.push(line);
  }
  return lines.join("\n");
}

for (const [id, build] of Object.entries(MAPS)) {
  const built = build();
  console.log(`\n=== ${id} ("${built.name}") ${built.map.sizeX}×${built.map.sizeZ} ===`);
  console.log(render(built));

  const { attackerSpawn: atk, defenderSpawn: def } = built;
  check(`${id}: attacker spawn standable`, standable(built.map, Math.floor(atk.x), Math.floor(atk.z)));
  check(`${id}: defender spawn standable`, standable(built.map, Math.floor(def.x), Math.floor(def.z)));

  const reach = reachableFrom(built, atk.x, atk.z);
  check(`${id}: defender spawn reachable from attacker spawn`,
    reach.has(`${Math.floor(def.x)},${Math.floor(def.z)}`));

  for (const [site, cells] of Object.entries(built.sites)) {
    const ok = cells.some((c) => reach.has(`${Math.floor(c.x)},${Math.floor(c.z)}`));
    check(`${id}: site ${site} reachable`, ok);
  }

  for (let i = 0; i < built.teleporters.length; i++) {
    const tp = built.teleporters[i]!;
    check(`${id}: teleporter ${i} landing standable`,
      standable(built.map, Math.floor(tp.to.x), Math.floor(tp.to.z)));
  }
}

if (failures > 0) {
  console.error(`\n${failures} failure(s)`);
  process.exit(1);
}
console.log("\nAll map checks passed.");
