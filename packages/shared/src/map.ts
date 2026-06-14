// Voxel map: a dense 3D grid of block ids.
// Index layout: x + z*sizeX + y*sizeX*sizeZ (one full horizontal layer per y).
// World units: 1 block = 1 meter. A block at (x,y,z) occupies [x,x+1)×[y,y+1)×[z,z+1).

export const Block = {
  Air: 0,
  Stone: 1,
  Grass: 2,
  Dirt: 3,
  Planks: 4,
  Bricks: 5,
  Sand: 6,
  Crate: 7,
  Sandstone: 8,
  Slate: 9,
  Portal: 10,
  SiteMark: 11,
} as const;

export type BlockId = (typeof Block)[keyof typeof Block];

export interface VoxelMap {
  sizeX: number;
  sizeY: number;
  sizeZ: number;
  blocks: Uint8Array;
}

export function createMap(sizeX: number, sizeY: number, sizeZ: number): VoxelMap {
  return { sizeX, sizeY, sizeZ, blocks: new Uint8Array(sizeX * sizeY * sizeZ) };
}

export function inBounds(map: VoxelMap, x: number, y: number, z: number): boolean {
  return x >= 0 && x < map.sizeX && y >= 0 && y < map.sizeY && z >= 0 && z < map.sizeZ;
}

function index(map: VoxelMap, x: number, y: number, z: number): number {
  return x + z * map.sizeX + y * map.sizeX * map.sizeZ;
}

/** Block id at cell, Air outside the map (use for rendering/neighbor tests). */
export function getBlock(map: VoxelMap, x: number, y: number, z: number): number {
  if (!inBounds(map, x, y, z)) return Block.Air;
  return map.blocks[index(map, x, y, z)] ?? Block.Air;
}

export function setBlock(map: VoxelMap, x: number, y: number, z: number, id: number): void {
  if (inBounds(map, x, y, z)) map.blocks[index(map, x, y, z)] = id;
}

/**
 * Collision query. Outside the map, the void below and beyond the horizontal
 * edges counts as solid (players can never leave), while the sky stays open.
 */
export function isSolid(map: VoxelMap, x: number, y: number, z: number): boolean {
  if (y >= map.sizeY) return false;
  if (y < 0 || x < 0 || x >= map.sizeX || z < 0 || z >= map.sizeZ) return true;
  return map.blocks[index(map, x, y, z)] !== Block.Air;
}

/** Fill an inclusive box of cells. Filling with Air carves space out. */
export function fillBox(
  map: VoxelMap,
  x0: number, y0: number, z0: number,
  x1: number, y1: number, z1: number,
  id: number,
): void {
  for (let y = y0; y <= y1; y++)
    for (let z = z0; z <= z1; z++)
      for (let x = x0; x <= x1; x++) setBlock(map, x, y, z, id);
}

export interface SpawnPoint {
  x: number; y: number; z: number; yaw: number;
}

/** Feet position on the ground (ground surface is the top of the y=2 layer). */
export const TEST_MAP_SPAWN: SpawnPoint = { x: 10.5, y: 3, z: 10.5, yaw: (-3 * Math.PI) / 4 };

/**
 * M1 playground: 64×64 grassy yard ringed by a brick wall, with a central
 * building (jump-step access to the roof), crates, cover walls and a tower.
 */
export function buildTestMap(): VoxelMap {
  const map = createMap(64, 16, 64);

  // Ground: two layers of stone capped with grass. Surface at y=3.
  fillBox(map, 0, 0, 0, 63, 1, 63, Block.Stone);
  fillBox(map, 0, 2, 0, 63, 2, 63, Block.Grass);
  fillBox(map, 40, 2, 40, 52, 2, 52, Block.Sand);

  // Perimeter wall, 3 blocks high.
  fillBox(map, 0, 3, 0, 63, 5, 0, Block.Bricks);
  fillBox(map, 0, 3, 63, 63, 5, 63, Block.Bricks);
  fillBox(map, 0, 3, 0, 0, 5, 63, Block.Bricks);
  fillBox(map, 63, 3, 0, 63, 5, 63, Block.Bricks);

  // Central building: hollow brick box with a planks roof and two doorways.
  fillBox(map, 26, 3, 28, 36, 5, 34, Block.Bricks);
  fillBox(map, 27, 3, 29, 35, 5, 33, Block.Air);
  fillBox(map, 26, 6, 28, 36, 6, 34, Block.Planks);
  fillBox(map, 30, 3, 28, 32, 4, 28, Block.Air); // south doorway
  fillBox(map, 36, 3, 30, 36, 4, 32, Block.Air); // east doorway

  // Jump-steps up to the roof (1 block per jump, roof surface at y=7).
  fillBox(map, 22, 3, 30, 22, 3, 32, Block.Planks);
  fillBox(map, 23, 3, 30, 23, 4, 32, Block.Planks);
  fillBox(map, 24, 3, 30, 25, 5, 32, Block.Planks);

  // Crates: singles, a 2-stack and a 2×2×2 cluster.
  setBlock(map, 12, 3, 40, Block.Crate);
  setBlock(map, 18, 3, 52, Block.Crate);
  setBlock(map, 33, 3, 14, Block.Crate);
  setBlock(map, 8, 3, 30, Block.Crate);
  setBlock(map, 56, 3, 33, Block.Crate);
  setBlock(map, 44, 3, 12, Block.Crate);
  setBlock(map, 44, 4, 12, Block.Crate);
  fillBox(map, 50, 3, 18, 51, 4, 19, Block.Crate);

  // Free-standing cover walls.
  fillBox(map, 14, 3, 22, 18, 4, 22, Block.Bricks);
  fillBox(map, 46, 3, 30, 46, 4, 34, Block.Bricks);

  // Tower for fall testing (top surface at y=8).
  fillBox(map, 54, 3, 54, 57, 7, 57, Block.Bricks);

  return map;
}
