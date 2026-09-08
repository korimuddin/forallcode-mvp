const { authenticated, siteUrl } = require("./lib/auth.cjs");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.handler = authenticated(async (event, user, supabase) => {
  const userId = user.id;
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  try {
    const { sessionId } = JSON.parse(event.body || "{}");

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
    const { data: certification, error } = await supabase.rpc("grant_certificate_payment", {
      buyer: userId, kind: certType, payment: session.payment_intent
    });
    if (error) throw error;
    return { statusCode: 200, body: JSON.stringify({ certification }) };

  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: "Could not complete your request. Please try again." }) };
  }
});
