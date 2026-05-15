import { WebSocketServer } from "ws";
import { resolveRegion, resolveRegionFromHeaders } from "./geoResolver.js";

const wss = new WebSocketServer({ noServer: true });
const clients = new Set();
const lastEmit = new Map();

function canEmit(region) {
  const now = Date.now();
  const last = lastEmit.get(region) || 0;
  if (now - last < 3000) return false;
  lastEmit.set(region, now);
  return true;
}

export function broadcastGlobeEvent(event) {
  if (!event || !canEmit(event.region)) return;
  const payload = JSON.stringify(event);
  for (const client of clients) {
    if (client.readyState === 1) {
      client.send(payload);
    }
  }
}

export function attachGlobeSocket(server) {
  server.on("upgrade", (req, socket, head) => {
    if (!req.url?.startsWith("/ws/globe")) return;
    wss.handleUpgrade(req, socket, head, (ws) => {
      clients.add(ws);
      ws.on("close", () => clients.delete(ws));
      ws.on("error", () => clients.delete(ws));
    });
  });
}

export async function broadcastSignIn(ip) {
  const event = await resolveRegion(ip);
  broadcastGlobeEvent(event);
  return event;
}

export async function broadcastSignInFromRequest(req) {
  const event = await resolveRegionFromHeaders(req.headers, req.socket?.remoteAddress);
  broadcastGlobeEvent(event);
  return event;
}
