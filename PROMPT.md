# BlockStrike — Project Prompt

> The refined, build-ready version of: *"i want to create a valorant in minecraft style"*

---

Build **BlockStrike**: a browser-based, online-multiplayer tactical FPS that **plays like Valorant** but **looks like Minecraft**.

## Core fantasy

Round-based attack/defend. The attacking team tries to plant the **Spike** (a bomb) on one of two sites; defenders try to stop them or defuse it. One life per round. Between rounds, players buy weapons and abilities with credits earned from kills and round results. Agents have unique abilities (smokes, flashes, dashes, heals). All of this rendered in a chunky voxel world: pixel-art block textures, cube-limbed characters, blocky muzzle flashes and particles.

## Platform & tech

- **Client:** TypeScript + Three.js + Vite. First-person camera with pointer-lock controls. Voxel map rendered as merged chunk meshes with a single pixel-art texture atlas. Runs at 60 fps on a mid-range laptop.
- **Server:** Authoritative Node.js game server (TypeScript) over WebSockets. The server owns all game state — clients send *inputs*, never positions.
- **Shared package:** Movement physics, collision, weapon stats, and the network protocol live in a shared TypeScript package so client prediction and server simulation run identical code.
- **Netcode:** Client-side prediction with server reconciliation for your own movement; snapshot interpolation (~100 ms buffer) for remote players; server-side hitscan with lag compensation (rewind player hitboxes to the shooter's perceived time).

## v1 gameplay scope

- **One map:** a classic 3-lane layout (A site, Mid, B site) built from voxels, with cover, choke points, and ramps. No verticality beyond 2–3 block ledges in v1.
- **Match format:** up to 5v5, playable from 1v1. First team to 5 round wins (configurable to 13 later). Sides swap halfway.
- **Round loop:** buy phase (15 s, frozen in spawn) → action phase (100 s) → spike planted adds 45 s defuse window → round end → economy payout.
- **Weapons (5):** Sidearm (free), SMG, Shotgun, Rifle, Sniper. Hitscan, headshot multipliers, first-shot accuracy, recoil/spread patterns.
- **Agents (3 at launch), 2 abilities each:**
  - **Smoker** — throwable smoke cloud (voxel fog block cluster); wall of slowing vines.
  - **Duelist** — short dash; flash that whites-out screens facing it.
  - **Support** — heal pulse for nearby allies; recon ping revealing enemies through walls for 2 s.
- **Economy:** credits per kill / plant / round win or loss streak; buy menu UI.
- **HUD:** crosshair, health/armor, ammo, ability icons, minimap, kill feed, round timer, scoreboard (Tab), buy menu (B).

## Art & audio direction

All assets are **original**: 16×16 pixel block textures, blocky humanoid player models (head/torso/limbs as boxes), simple procedural or freely-licensed sounds. *Inspired by* Minecraft's aesthetic and Valorant's design — **no assets, names, textures, or sounds ripped from either game.**

## Quality bar

- 60 fps client, 20–30 Hz server tick, playable up to ~150 ms ping.
- Movement feels crisp: no rubber-banding under normal latency; your own movement is never delayed by the network.
- Hit registration favors the shooter (lag-compensated) and is verified server-side (no client-claimed hits).
- A fresh player can go from URL → in a match in under 30 seconds (nickname, room code or quick-join, no accounts in v1).
