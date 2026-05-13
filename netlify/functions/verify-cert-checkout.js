const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  try {
    const { sessionId, userId } = JSON.parse(event.body || "{}");

    if (!sessionId || !userId) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing sessionId or userId" }) };
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.mode !== "payment" || session.payment_status !== "paid") {
      return { statusCode: 402, body: JSON.stringify({ error: "Payment is not complete" }) };
    }

    if (session.metadata?.supabase_user_id !== userId || !session.metadata?.cert_type) {
      return { statusCode: 403, body: JSON.stringify({ error: "Checkout session does not match this user" }) };
    }

    const certType = session.metadata.cert_type;
    const { data: existing } = await supabase
      .from("certifications")
      .select("*")
      .eq("user_id", userId)
      .eq("cert_type", certType)
      .maybeSingle();

    if (existing?.id) {
      const { data: updated, error } = await supabase
        .from("certifications")
        .update({ stripe_payment_id: session.payment_intent })
        .eq("id", existing.id)
        .select("*")
        .single();

      if (error) throw error;
      return { statusCode: 200, body: JSON.stringify({ certification: updated }) };
    }

    const { data: inserted, error } = await supabase
      .from("certifications")
      .insert({
        user_id: userId,
        cert_type: certType,
        stripe_payment_id: session.payment_intent
      })
      .select("*")
      .single();

    if (error) throw error;

    return { statusCode: 200, body: JSON.stringify({ certification: inserted }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
