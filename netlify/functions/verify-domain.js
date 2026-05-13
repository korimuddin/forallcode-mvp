const dns = require("dns").promises;
const { createClient } = require("@supabase/supabase-js");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      }
    };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const { domain, token, userId } = JSON.parse(event.body || "{}");
    if (!domain || !token || !userId) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing domain, token, or userId" }) };
    }

    const records = await dns.resolveTxt(domain);
    const flatRecords = records.flat();
    const verified = flatRecords.includes(token);

    if (!verified) {
      return { statusCode: 200, body: JSON.stringify({ verified: false, message: "TXT record not found yet" }) };
    }

    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { error } = await supabase
      .from("custom_domains")
      .update({
        verified: true,
        dns_configured: true,
        verified_at: new Date().toISOString()
      })
      .eq("user_id", userId)
      .eq("domain", domain);

    if (error) throw error;

    return { statusCode: 200, body: JSON.stringify({ verified: true }) };
  } catch (error) {
    return {
      statusCode: 200,
      body: JSON.stringify({ verified: false, message: error.message || "Could not verify DNS yet" })
    };
  }
};
