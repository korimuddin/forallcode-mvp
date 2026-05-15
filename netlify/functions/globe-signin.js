import { resolveRegionFromHeaders } from "../../server/geoResolver.js";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const regionEvent = await resolveRegionFromHeaders(event.headers);

  return {
    statusCode: 202,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ok: true, event: regionEvent })
  };
}
