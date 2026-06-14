// M0 smoke test: connects to the game server (directly or through the Vite proxy),
// performs the hello -> welcome handshake, then a ping -> pong round trip.
// Usage: node scripts/smoke-test.mjs [ws://localhost:8081]
import WebSocket from "ws";

const url = process.argv[2] ?? "ws://localhost:8081";
const PROTOCOL_VERSION = 1; // keep in sync with packages/shared/src/protocol.ts

const ws = new WebSocket(url);
const timeout = setTimeout(() => {
  console.error(`FAIL: timed out waiting for handshake on ${url}`);
  process.exit(1);
}, 5000);

ws.on("open", () => {
  ws.send(JSON.stringify({ type: "hello", name: "smoke-test", protocol: PROTOCOL_VERSION }));
});

ws.on("message", (data) => {
  const msg = JSON.parse(data.toString());
  if (msg.type === "welcome") {
    console.log(`OK: welcome received (playerId=${msg.playerId})`);
    ws.send(JSON.stringify({ type: "ping", t: 12345 }));
  } else if (msg.type === "pong" && msg.t === 12345) {
    console.log(`OK: pong received (serverTime=${msg.serverTime})`);
    console.log(`PASS: ${url}`);
    clearTimeout(timeout);
    ws.close();
    process.exit(0);
  }
});

ws.on("error", (err) => {
  console.error(`FAIL: ${err.message}`);
  process.exit(1);
});
