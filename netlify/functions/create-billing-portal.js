const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405 };

  const { userId, returnUrl } = JSON.parse(event.body);

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .single();

  if (!sub?.stripe_customer_id) {
    return { statusCode: 400, body: JSON.stringify({ error: "No Stripe customer found" }) };
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: returnUrl
  });

  return { statusCode: 200, body: JSON.stringify({ url: session.url }) };
};
