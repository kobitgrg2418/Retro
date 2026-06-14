# BlockStrike — Development Plan

Companion to [PROMPT.md](PROMPT.md). Milestones are ordered so the game is *runnable and testable at the end of every one*.

---

## 1. Architecture overview

```
┌─────────────────────┐         inputs (20–60/s)        ┌──────────────────────┐
│  Client (browser)   │ ───────────────────────────────▶ │  Server (Node.js)    │
│  Three.js renderer  │                                  │  Authoritative sim   │
│  Input + prediction │ ◀─────────────────────────────── │  20–30 Hz tick       │
│  Interpolation      │      snapshots (20–30/s)         │  Rooms / matchmaking │
└─────────────────────┘                                  └──────────────────────┘
            ▲                                                       ▲
            └──────────────── packages/shared ──────────────────────┘
                 (physics, collision, weapon stats, protocol)
```

**Golden rule:** the server is the only source of truth. Clients send `{tick, buttons, viewAngles}` inputs. The server simulates and broadcasts world snapshots. The client *predicts* its own movement locally using the same shared physics code, then reconciles when the server snapshot for that tick arrives.

## 2. Repo structure (npm workspaces monorepo)

```
Retro/
├── package.json              # workspaces: ["packages/*"]
├── PROMPT.md / PLAN.md
└── packages/
    ├── shared/               # zero-dependency TS: the contract between client & server
    │   ├── src/physics.ts    #   movement step fn: (state, input, dt) -> state
    │   ├── src/collision.ts  #   AABB vs voxel grid sweep
    │   ├── src/weapons.ts    #   damage, fire rate, spread tables
    │   ├── src/protocol.ts   #   message types + binary encode/decode
    │   └── src/map.ts        #   voxel map format + loader
    ├── client/               # Vite + TypeScript + Three.js
    │   ├── src/render/       #   chunk mesher, texture atlas, player models, particles
    │   ├── src/game/         #   prediction, interpolation, input capture
    │   ├── src/ui/           #   HUD, buy menu, scoreboard, menus (plain DOM/CSS)
    │   └── public/atlas.png  #   16×16 pixel-art texture atlas (original art)
    └── server/               # Node + TypeScript + ws
        ├── src/room.ts       #   one match instance: tick loop, snapshot broadcast
        ├── src/lobby.ts      #   room codes, quick-join
        ├── src/lagcomp.ts    #   hitbox history ring buffer + rewind
        └── src/rounds.ts     #   round state machine, economy, spike logic
```

## 3. Key technical decisions

| Decision | Choice | Why |
|---|---|---|
| Transport | WebSockets (`ws`) | Simple, works everywhere. TCP head-of-line blocking is acceptable at 20–30 Hz with small packets. Can swap to WebRTC datachannels (geckos.io) later if needed. |
| Snapshot encoding | Binary (`ArrayBuffer` + DataView) defined in `shared/protocol.ts` | JSON snapshots at 30 Hz × 10 players waste bandwidth; binary keeps packets < 1 KB. |
| Server tick | Fixed 30 Hz, inputs consumed per-tick | Determinism between prediction and server sim requires fixed dt. |
| Map format | 3D `Uint8Array` (block id per cell), e.g. 128×32×128 | Trivial to collide against (grid lookup), trivial to mesh, fits in one file. |
| Rendering | One merged mesh per 16×16×16 chunk, faces culled between solid blocks | Standard Minecraft technique; whole map ≈ a few hundred draw calls max. Greedy meshing only if needed. |
| Characters | Box-limb rigs built from `THREE.BoxGeometry`, animated in code | No model files/skinning needed; matches the aesthetic. |
| State per player | position, velocity, yaw/pitch, hp, armor, weapon, ammo, credits, alive | Kept in shared types so snapshots are mechanical. |
| Hit registration | Server raycast against *rewound* hitboxes (lag compensation) | Shooter sees what they hit; server still validates everything. |
| Accounts | None in v1 — nickname + room code | Removes auth scope entirely; add later if it becomes a real game. |

## 4. Milestones

### M0 — Scaffolding (the skeleton runs)
- npm workspaces monorepo, TypeScript everywhere, Vite client dev server, Node server with hot-reload (tsx watch).
- Client connects to server over WebSocket, exchanges a hello message, shows "connected" on screen.
- **Done when:** `npm run dev` starts both, browser console shows a round-trip ping.

### M1 — Voxel world + first-person movement (single-player feel)
- Map format + a hand-authored test map in `shared/map.ts` (flat ground, some walls/boxes).
- Chunk mesher + texture atlas rendering in Three.js; sky color; basic directional light.
- Pointer-lock FPS controller: WASD, sprint-walk toggle, jump, crouch; AABB-vs-voxel collision in `shared/physics.ts` (this exact code will run on the server later).
- **Done when:** you can run and jump around the blocky map at 60 fps, collision is solid (no clipping through corners).

### M2 — Multiplayer movement (the hard one — netcode core)
- Server tick loop simulating all players from queued inputs using shared physics.
- Binary protocol: input messages up, snapshot messages down.
- Client-side prediction + reconciliation (replay unacknowledged inputs on correction).
- Remote players rendered with snapshot interpolation (render ~100 ms in the past).
- Rooms: create with code / join by code; players spawn as blocky characters.
- **Done when:** two browser windows see each other move smoothly; artificially adding 150 ms latency (server-side delay flag) causes no rubber-banding for your own movement.

### M3 — Combat
- Hitscan shooting: client fires immediately (visual), server validates via lag-compensated raycast (hitbox history ring buffer, head/body boxes).
- Health, damage falloff, headshot multiplier, death + spectate-teammate camera, respawn (free-for-all mode for now as the test bed).
- Feedback: muzzle flash, blocky tracer, hit marker, kill feed, damage direction indicator, blocky death "poof" particles.
- Weapon set: Sidearm, SMG, Shotgun, Rifle, Sniper — stats in `shared/weapons.ts`; switching, reload, ammo.
- **Done when:** a free-for-all deathmatch between two real clients feels fair at 100+ ms ping.

### M4 — The Valorant loop
- Teams (attack/defend), team spawns, round state machine: buy → action → spike planted → round end → side swap → match end.
- Spike: pick up, plant on site (channel 4 s), defuse (7 s, half-defuse persists), explosion.
- Economy: credits for kills/plant/win/loss-streak; buy menu UI (weapons + armor); weapons drop on death and are pickupable.
- One real map: 3-lane layout with A site, Mid, B site, attacker/defender spawns — authored as a small map-builder script that writes the voxel array.
- Win conditions: elimination, detonation, defusal, timeout. First to 5.
- **Done when:** a full 2v2 match can be played start to finish with correct scoring and economy.

### M5 — Agents & abilities
- Agent select screen at match start (unique per team).
- Smoker (smoke cloud = temporary fog voxels; slow-vine wall), Duelist (dash; directional flash), Support (heal pulse; recon ping with wallhack outline for 2 s).
- Ability state synced through snapshots; flash/smoke effects fully server-validated (a flash you can't see doesn't blind you).
- **Done when:** all 6 abilities work in multiplayer and counter-play is possible (e.g., turning away from a flash).

### M6 — Polish & ship
- Main menu (nickname, create/join/quick-play), settings (sensitivity, FOV, volume).
- Sound: shots, footsteps (with distance/occlusion-lite), spike beeps, round stings — original/CC0.
- Minimap, scoreboard, end-of-match screen.
- Performance pass (target: 60 fps with 10 players + particles) and bandwidth pass (snapshot delta compression if needed).
- Deploy: client as static build (Netlify/Vercel/Cloudflare Pages), server on a WebSocket-friendly host (Fly.io / Railway / a small VPS). WSS via the host's TLS.
- **Done when:** a friend can open a URL, enter your room code, and play a full match.

## 5. Risks & mitigations

- **Netcode is the project's hard core.** That's why M2 lands before any gameplay — if prediction/reconciliation works early, everything else stacks on top. Build a latency/packet-loss simulator flag into the server from day one.
- **Physics drift between client and server** breaks prediction. Mitigation: *one* movement function in `shared/`, fixed dt, no `Math.random()` in movement, integer tick numbers.
- **TCP stalls on packet loss** (WebSocket limitation). Acceptable for v1; if play tests feel bad on lossy Wi-Fi, swap transport to WebRTC datachannels — the protocol layer is isolated so this is a contained change.
- **Scope creep** (more agents/maps/guns). The line: nothing new enters until M6 ships. v1 is 1 map, 5 guns, 3 agents.
- **IP caution:** "inspired by" is the rule — original textures, original names, no Valorant/Minecraft assets or trademarks anywhere, especially if it goes public.

## 6. Suggested first session

1. M0 scaffolding (≈ one session).
2. M1 map + movement (1–2 sessions) — this is also where the game first *feels* like something.
3. M2 netcode (2–3 sessions, the hardest part).
Then combat and the round loop come surprisingly fast because the foundations carry them.
