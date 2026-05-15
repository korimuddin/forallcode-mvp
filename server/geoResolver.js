import path from "node:path";
import maxmind from "maxmind";
import { COUNTRY_TO_REGION, createRegionEvent } from "../shared/regions.js";

const databasePath = path.resolve(process.cwd(), "server", "data", "GeoLite2-Country.mmdb");
let lookupPromise;

async function getLookup() {
  if (!lookupPromise) {
    lookupPromise = maxmind.open(databasePath).catch(() => null);
  }
  return lookupPromise;
}

function normaliseHeaders(headers = {}) {
  const normalised = {};
  for (const [key, value] of Object.entries(headers)) {
    normalised[key.toLowerCase()] = Array.isArray(value) ? value[0] : value;
  }
  return normalised;
}

function firstForwardedIp(value = "") {
  return value.split(",").map((part) => part.trim()).find(Boolean) || "";
}

export function extractClientIp(headers = {}, socketAddress = "") {
  const lower = normaliseHeaders(headers);
  return (
    lower["x-nf-client-connection-ip"] ||
    lower["client-ip"] ||
    firstForwardedIp(lower["x-forwarded-for"]) ||
    lower["x-real-ip"] ||
    socketAddress ||
    ""
  );
}

export async function resolveRegion(ip) {
  try {
    const lookup = await getLookup();
    if (!lookup || !ip) return createRegionEvent("western-europe");

    const result = lookup.get(ip);
    const countryCode = result?.country?.iso_code || result?.registered_country?.iso_code;
    const regionId = COUNTRY_TO_REGION[countryCode] || "western-europe";
    return createRegionEvent(regionId);
  } catch {
    return createRegionEvent("western-europe");
  }
}

export async function resolveRegionFromHeaders(headers = {}, socketAddress = "") {
  const ip = extractClientIp(headers, socketAddress);
  return resolveRegion(ip);
}
