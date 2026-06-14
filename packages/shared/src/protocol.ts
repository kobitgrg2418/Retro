// Network protocol shared by client and server.
// M0: JSON messages for the hello/ping handshake.
// M2 will replace the high-frequency paths (inputs, snapshots) with binary encoding.

export const PROTOCOL_VERSION = 1;

export type ClientMessage =
  | { type: "hello"; name: string; protocol: number }
  | { type: "ping"; t: number };

export type ServerMessage =
  | { type: "welcome"; playerId: string; serverTime: number }
  | { type: "pong"; t: number; serverTime: number };

export function encodeMessage(msg: ClientMessage | ServerMessage): string {
  return JSON.stringify(msg);
}

export function decodeClientMessage(data: string): ClientMessage | null {
  return decode<ClientMessage>(data, ["hello", "ping"]);
}

export function decodeServerMessage(data: string): ServerMessage | null {
  return decode<ServerMessage>(data, ["welcome", "pong"]);
}

function decode<T extends { type: string }>(data: string, types: readonly T["type"][]): T | null {
  try {
    const msg = JSON.parse(data) as T;
    return types.includes(msg.type) ? msg : null;
  } catch {
    return null;
  }
}
