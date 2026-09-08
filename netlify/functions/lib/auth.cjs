const { createClient } = require("@supabase/supabase-js");

function serviceClient() {
  return createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } });
}

function authenticated(handler, getClient = serviceClient) {
  return async (event) => {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method not allowed" };
    try {
      const header = Object.entries(event.headers || {}).find(([key]) => key.toLowerCase() === "authorization")?.[1];
      const token = /^Bearer (\S+)$/i.exec(header || "")?.[1];
      if (!token) return { statusCode: 401, body: JSON.stringify({ error: "Sign in to continue." }) };
      const client = getClient();
      const { data, error } = await client.auth.getUser(token);
      if (error || !data?.user) return { statusCode: 401, body: JSON.stringify({ error: "Your session has expired. Sign in again." }) };
      let body;
      try { body = JSON.parse(event.body || "{}"); } catch { return { statusCode: 400, body: JSON.stringify({ error: "Invalid request." }) }; }
      if (!body || typeof body !== "object" || Array.isArray(body)) return { statusCode: 400, body: JSON.stringify({ error: "Invalid request." }) };
      return await handler({ ...event, body: JSON.stringify(body) }, data.user, client);
    } catch {
      return { statusCode: 500, body: JSON.stringify({ error: "Could not complete your request. Please try again." }) };
    }
  };
}

function siteUrl(value, fallback = "/") {
  const base = process.env.URL || "http://127.0.0.1:5173";
  const allowed = [base, process.env.DEPLOY_PRIME_URL].filter(Boolean).map((url) => new URL(url).origin);
  const url = new URL(value || fallback, base);
  if (!allowed.includes(url.origin) || url.username || url.password) throw new Error("Invalid return URL");
  return url.href;
}

module.exports = { authenticated, serviceClient, siteUrl };
