// Deterministic player movement vs the voxel grid.
// This exact code runs on the client (prediction) and the server (authority),
// so: fixed dt only, no randomness, no rendering concerns.

import { isSolid, type VoxelMap } from "./map.js";

export const SIM_RATE = 60;
export const SIM_DT = 1 / SIM_RATE;

export const PLAYER = {
  width: 0.6,
  height: 1.8,
  crouchHeight: 1.5,
  eyeHeight: 1.62,
  crouchEyeHeight: 1.32,
} as const;

export const MOVE = {
  runSpeed: 5.5,
  walkSpeed: 2.6, // shift: slow + (later) silent
  crouchSpeed: 2.0,
  groundAccel: 60,
  airAccel: 12,
  gravity: 23,
  jumpVelocity: 7.0, // max jump height ≈ 1.07m — clears exactly one block
  terminalVelocity: 50,
} as const;

export interface MoveInput {
  forward: number; // -1..1, +1 = forward
  strafe: number; // -1..1, +1 = right
  yaw: number; // radians around +Y; yaw 0 looks toward -Z
  jump: boolean;
  walk: boolean;
  crouch: boolean;
}

export interface PlayerPhysicsState {
  x: number; // feet position = bottom-center of the AABB
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  yaw: number;
  pitch: number;
  onGround: boolean;
  crouching: boolean;
}

export function createPlayerState(x: number, y: number, z: number, yaw = 0): PlayerPhysicsState {
  return { x, y, z, vx: 0, vy: 0, vz: 0, yaw, pitch: 0, onGround: false, crouching: false };
}

export function playerHeight(s: PlayerPhysicsState): number {
  return s.crouching ? PLAYER.crouchHeight : PLAYER.height;
}

export function eyeHeight(s: PlayerPhysicsState): number {
  return s.crouching ? PLAYER.crouchEyeHeight : PLAYER.eyeHeight;
}

const EPS = 1e-7;

/** Does a player AABB with feet at (x,y,z) and the given height overlap any solid cell? */
export function collidesAt(
  map: VoxelMap,
  x: number,
  y: number,
  z: number,
  height: number,
): boolean {
  const hw = PLAYER.width / 2;
  const x0 = Math.floor(x - hw + EPS);
  const x1 = Math.floor(x + hw - EPS);
  const y0 = Math.floor(y + EPS);
  const y1 = Math.floor(y + height - EPS);
  const z0 = Math.floor(z - hw + EPS);
  const z1 = Math.floor(z + hw - EPS);
  for (let cy = y0; cy <= y1; cy++)
    for (let cz = z0; cz <= z1; cz++)
      for (let cx = x0; cx <= x1; cx++) if (isSolid(map, cx, cy, cz)) return true;
  return false;
}

function approach(current: number, target: number, maxDelta: number): number {
  if (current < target) return Math.min(current + maxDelta, target);
  return Math.max(current - maxDelta, target);
}

// Move along one axis with collision, in sub-steps small enough that a single
// check can only ever penetrate one cell. Returns true if a collision clamped us.
function moveAxis(
  map: VoxelMap,
  s: PlayerPhysicsState,
  height: number,
  axis: 0 | 1 | 2,
  delta: number,
): boolean {
  const hw = PLAYER.width / 2;
  const MAX_STEP = 0.45;
  let remaining = delta;
  while (remaining !== 0) {
    const d = Math.abs(remaining) > MAX_STEP ? Math.sign(remaining) * MAX_STEP : remaining;
    remaining -= d;
    if (axis === 0) s.x += d;
    else if (axis === 1) s.y += d;
    else s.z += d;

    if (!collidesAt(map, s.x, s.y, s.z, height)) continue;

    // Clamp flush against the cell boundary we just crossed.
    if (axis === 0) {
      s.x = d > 0 ? Math.floor(s.x + hw) - hw : Math.floor(s.x - hw) + 1 + hw;
    } else if (axis === 1) {
      s.y = d > 0 ? Math.floor(s.y + height) - height : Math.floor(s.y) + 1;
    } else {
      s.z = d > 0 ? Math.floor(s.z + hw) - hw : Math.floor(s.z - hw) + 1 + hw;
    }
    return true;
  }
  return false;
}

/** Advance one fixed simulation step. Mutates `s`. */
export function stepPlayer(
  map: VoxelMap,
  s: PlayerPhysicsState,
  input: MoveInput,
  dt: number,
): void {
  s.yaw = input.yaw;

  // Crouch on demand; stand back up only when there's headroom.
  if (input.crouch) {
    s.crouching = true;
  } else if (s.crouching && !collidesAt(map, s.x, s.y, s.z, PLAYER.height)) {
    s.crouching = false;
  }
  const height = playerHeight(s);

  // Wish direction in the horizontal plane (yaw 0 faces -Z).
  const fwdX = -Math.sin(input.yaw);
  const fwdZ = -Math.cos(input.yaw);
  const rightX = Math.cos(input.yaw);
  const rightZ = -Math.sin(input.yaw);
  let wishX = fwdX * input.forward + rightX * input.strafe;
  let wishZ = fwdZ * input.forward + rightZ * input.strafe;
  const wishLen = Math.hypot(wishX, wishZ);
  if (wishLen > 1) {
    wishX /= wishLen;
    wishZ /= wishLen;
  }
  const speed = s.crouching ? MOVE.crouchSpeed : input.walk ? MOVE.walkSpeed : MOVE.runSpeed;
  const accel = (s.onGround ? MOVE.groundAccel : MOVE.airAccel) * dt;
  s.vx = approach(s.vx, wishX * speed, accel);
  s.vz = approach(s.vz, wishZ * speed, accel);

  if (input.jump && s.onGround) {
    s.vy = MOVE.jumpVelocity;
    s.onGround = false;
  }
  s.vy = Math.max(s.vy - MOVE.gravity * dt, -MOVE.terminalVelocity);

  // Y first so ground contact is resolved before horizontal sliding.
  const fallVy = s.vy;
  const hitY = moveAxis(map, s, height, 1, s.vy * dt);
  if (hitY) {
    s.onGround = fallVy < 0;
    s.vy = 0;
  } else {
    s.onGround = false;
  }
  if (moveAxis(map, s, height, 0, s.vx * dt)) s.vx = 0;
  if (moveAxis(map, s, height, 2, s.vz * dt)) s.vz = 0;
}
