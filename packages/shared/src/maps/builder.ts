// ASCII floor-plan builder: each character is a 2×2m column of the world,
// extruded into voxels. Maps are authored as readable text grids.
//
// Legend:
//   '#' / ' '  solid wall mass (full height, blocks movement and vision)
//   '.'        open floor
//   ','        accent floor (visual paths/rooms, same walkability)
//   '1' / '2'  attacker / defender spawn marker (accent floor)
//   'A'-'C'    bomb-site floor (marked tiles)
//   '-'        low cover, 1m  (jumpable, shoot over)
//   '='        high cover, 2m (blocks vision, not jumpable)
//   'c'        crate, 1m
//   'x'        crate stack, 2m
//   'T','V'    teleporter entry pads     (one-way: T→U, V→W)
//   'U','W'    teleporter landing spots

import { Block, createMap, fillBox, type VoxelMap } from "../map.js";

export interface MapTheme {
  floor: number;
  wall: number;
  accent: number;
  cover: number;
}

export interface CellPos {
  x: number;
  z: number;
}

export interface AsciiBuildResult {
  map: VoxelMap;
  markers: Record<string, CellPos[]>;
}

const SCALE = 2;
const FLOOR_Y = 2; // floor surface block; players stand at y=3
const WALL_TOP = 8; // walls reach y=9: far above the 1.07m jump

export function buildFromAscii(rows: string[], theme: MapTheme): AsciiBuildResult {
  const cols = Math.max(...rows.map((r) => r.length));
  const map = createMap(cols * SCALE, 12, rows.length * SCALE);
  const markers: Record<string, CellPos[]> = {};

  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < cols; c++) {
      const ch = rows[r]![c] ?? "#";
      const x0 = c * SCALE;
      const z0 = r * SCALE;
      const x1 = x0 + SCALE - 1;
      const z1 = z0 + SCALE - 1;

      // Foundation under everything.
      fillBox(map, x0, 0, z0, x1, FLOOR_Y - 1, z1, Block.Stone);

      if (ch === "#" || ch === " ") {
        fillBox(map, x0, FLOOR_Y, z0, x1, WALL_TOP, z1, theme.wall);
        continue;
      }

      let floorBlock = theme.floor;
      switch (ch) {
        case ",":
          floorBlock = theme.accent;
          break;
        case "1":
        case "2":
          floorBlock = theme.accent;
          addMarker(markers, ch, x0, z0);
          break;
        case "A":
        case "B":
        case "C":
          floorBlock = Block.SiteMark;
          addMarker(markers, ch, x0, z0);
          break;
        case "T":
        case "U":
        case "V":
        case "W":
          floorBlock = Block.Portal;
          addMarker(markers, ch, x0, z0);
          break;
      }
      fillBox(map, x0, FLOOR_Y, z0, x1, FLOOR_Y, z1, floorBlock);

      if (ch === "-") fillBox(map, x0, 3, z0, x1, 3, z1, theme.cover);
      else if (ch === "=") fillBox(map, x0, 3, z0, x1, 4, z1, theme.cover);
      else if (ch === "c") fillBox(map, x0, 3, z0, x1, 3, z1, Block.Crate);
      else if (ch === "x") fillBox(map, x0, 3, z0, x1, 4, z1, Block.Crate);
    }
  }

  return { map, markers };
}

function addMarker(markers: Record<string, CellPos[]>, ch: string, x0: number, z0: number): void {
  (markers[ch] ??= []).push({ x: x0 + 1, z: z0 + 1 }); // center of the 2×2 cell
}

export function centroid(cells: CellPos[]): CellPos {
  let x = 0;
  let z = 0;
  for (const c of cells) {
    x += c.x;
    z += c.z;
  }
  return { x: x / cells.length, z: z / cells.length };
}
