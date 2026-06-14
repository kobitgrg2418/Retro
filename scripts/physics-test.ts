// Physics sanity tests for the shared movement code, run headless in Node:
//   npx tsx scripts/physics-test.ts
// Exercises walking, wall clamping, jumping, block collision and crouching
// against the real M1 test map.

import {
  SIM_DT,
  TEST_MAP_SPAWN,
  buildTestMap,
  createPlayerState,
  stepPlayer,
  type MoveInput,
  type PlayerPhysicsState,
} from "@blockstrike/shared";

const map = buildTestMap();
let failures = 0;

function check(name: string, cond: boolean, detail = ""): void {
  if (cond) {
    console.log(`PASS  ${name}`);
  } else {
    failures++;
    console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function makeInput(partial: Partial<MoveInput>): MoveInput {
  return { forward: 0, strafe: 0, yaw: 0, jump: false, walk: false, crouch: false, ...partial };
}

function simulate(s: PlayerPhysicsState, input: MoveInput, steps: number): void {
  for (let i = 0; i < steps; i++) stepPlayer(map, s, input, SIM_DT);
}

// 1. Settle on spawn ground.
{
  const s = createPlayerState(TEST_MAP_SPAWN.x, TEST_MAP_SPAWN.y + 0.5, TEST_MAP_SPAWN.z);
  simulate(s, makeInput({}), 120);
  check("settles on ground at y=3", s.onGround && Math.abs(s.y - 3) < 1e-6, `y=${s.y}`);
}

// 2. Run forward ~1s covers close to run speed.
{
  const s = createPlayerState(10.5, 3, 10.5);
  simulate(s, makeInput({ forward: 1, yaw: -Math.PI / 2 }), 60); // +x direction
  const dx = s.x - 10.5;
  check("runs ~5m in 1s on ground", dx > 4.5 && dx < 6, `dx=${dx.toFixed(2)}`);
  check("stays grounded while running", s.onGround && Math.abs(s.y - 3) < 1e-6, `y=${s.y}`);
}

// 3. Perimeter wall stops the player flush (never clips out of the map).
{
  const s = createPlayerState(10.5, 3, 10.5);
  simulate(s, makeInput({ forward: 1, yaw: -Math.PI / 2 }), 1200); // run east 20s
  check("wall clamps at x=62.7", Math.abs(s.x - 62.7) < 1e-3, `x=${s.x.toFixed(4)}`);
  check("velocity zeroed on wall hit", s.vx === 0, `vx=${s.vx}`);
}

// 4. Jump apex clears exactly one block.
{
  const s = createPlayerState(10.5, 3, 10.5);
  simulate(s, makeInput({}), 10);
  let maxY = s.y;
  const input = makeInput({ jump: true });
  for (let i = 0; i < 60; i++) {
    stepPlayer(map, s, input, SIM_DT);
    maxY = Math.max(maxY, s.y);
  }
  const apex = maxY - 3;
  check("jump apex between 1.0 and 1.2 blocks", apex > 1.0 && apex < 1.2, `apex=${apex.toFixed(3)}`);
}

// 5. A 1-block crate stops horizontal movement (no auto-step).
{
  const s = createPlayerState(8.5, 3, 28.5); // crate at (8,3,30)
  simulate(s, makeInput({ forward: 1, yaw: Math.PI }), 60); // +z direction
  check("crate blocks walking at z=29.7", Math.abs(s.z - 29.7) < 1e-3, `z=${s.z.toFixed(4)}`);
  check("no climbing without jump", Math.abs(s.y - 3) < 1e-6, `y=${s.y}`);
}

// 6. A single jump while pushing forward climbs onto the crate.
{
  const s = createPlayerState(8.5, 3, 28.5);
  simulate(s, makeInput({ forward: 1, yaw: Math.PI }), 60); // walk flush against crate
  stepPlayer(map, s, makeInput({ forward: 1, yaw: Math.PI, jump: true }), SIM_DT);
  let stoodOnCrate = false;
  const input = makeInput({ forward: 1, yaw: Math.PI });
  for (let i = 0; i < 120; i++) {
    stepPlayer(map, s, input, SIM_DT);
    if (s.onGround && Math.abs(s.y - 4) < 1e-6 && s.z > 29.5 && s.z < 31) stoodOnCrate = true;
  }
  check("jump+forward climbs onto crate top (y=4)", stoodOnCrate, `y=${s.y} z=${s.z.toFixed(2)}`);
}

// 7. Crouching shrinks speed; stands back up with headroom.
{
  const s = createPlayerState(10.5, 3, 10.5);
  simulate(s, makeInput({}), 10);
  simulate(s, makeInput({ forward: 1, yaw: -Math.PI / 2, crouch: true }), 60);
  const dx = s.x - 10.5;
  check("crouch walk is slow (<2.2m in 1s)", s.crouching && dx < 2.2, `dx=${dx.toFixed(2)}`);
  simulate(s, makeInput({}), 10);
  check("stands back up in the open", !s.crouching);
}

if (failures > 0) {
  console.error(`\n${failures} failure(s)`);
  process.exit(1);
}
console.log("\nAll physics tests passed.");
