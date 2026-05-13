const { createClient } = require("@supabase/supabase-js");

const ADMIN_USER_IDS = ["906e01d3-a655-4299-9269-437900cda4df"];

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAccessToken = process.env.SUPABASE_ACCESS_TOKEN;
const explicitProjectRef = process.env.SUPABASE_PROJECT_REF;

const supabaseAdmin = supabaseUrl && supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey)
  : null;

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return json(405, { error: "Method not allowed" });
  }

  try {
    const user = await getAuthenticatedUser(event.headers.authorization || event.headers.Authorization);
    if (!user?.id || !ADMIN_USER_IDS.includes(user.id)) {
      return json(403, { error: "Admin access required." });
    }

    if (!supabaseAccessToken) {
      return json(200, {
        configured: false,
        source: "fallback",
        message: "SUPABASE_ACCESS_TOKEN is not configured.",
        usage: null
      });
    }

    const projectRef = explicitProjectRef || projectRefFromUrl(supabaseUrl);
    if (!projectRef) {
      return json(200, {
        configured: false,
        source: "fallback",
        message: "SUPABASE_PROJECT_REF or VITE_SUPABASE_URL is required.",
        usage: null
      });
    }

    const [apiCounts, apiRequestCount, storageConfig, databaseContext] = await Promise.allSettled([
      managementFetch(projectRef, "/analytics/endpoints/usage.api-counts?interval=1d"),
      managementFetch(projectRef, "/analytics/endpoints/usage.api-requests-count"),
      managementFetch(projectRef, "/config/storage"),
      managementFetch(projectRef, "/database/context")
    ]);

    return json(200, {
      configured: true,
      source: "supabase-management-api",
      projectRef,
      usage: {
        apiCounts: settledValue(apiCounts),
        apiRequestCount: settledValue(apiRequestCount),
        storageConfig: settledValue(storageConfig),
        databaseContext: settledValue(databaseContext)
      },
      errors: {
        apiCounts: settledError(apiCounts),
        apiRequestCount: settledError(apiRequestCount),
        storageConfig: settledError(storageConfig),
        databaseContext: settledError(databaseContext)
      }
    });
  } catch (error) {
    return json(500, { error: error.message || "Could not load Supabase usage." });
  }
};

async function getAuthenticatedUser(authorizationHeader) {
  const token = authorizationHeader?.replace(/^Bearer\s+/i, "");
  if (!token || !supabaseAdmin || !supabaseAnonKey || !supabaseUrl) return null;

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: supabaseAnonKey
    }
  });

  if (!response.ok) return null;
  return response.json();
}

async function managementFetch(projectRef, path) {
  const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}${path}`, {
    headers: {
      Authorization: `Bearer ${supabaseAccessToken}`,
      Accept: "application/json"
    }
  });

  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }

  if (!response.ok) {
    const message = typeof payload === "object" ? payload?.message || payload?.error : payload;
    throw new Error(message || `Supabase Management API returned ${response.status}.`);
  }

  return payload;
}

function projectRefFromUrl(url) {
  try {
    return new URL(url).hostname.split(".")[0];
  } catch {
    return "";
  }
}

function settledValue(result) {
  return result.status === "fulfilled" ? result.value : null;
}

function settledError(result) {
  return result.status === "rejected" ? result.reason?.message || "Request failed." : null;
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  };
}
