const { authenticated, siteUrl } = require("./lib/auth.cjs");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.handler = authenticated(async (event, user, supabase) => {
  const userId = user.id;
  if (event.httpMethod !== "POST") return { statusCode: 405 };

  const { returnUrl } = JSON.parse(event.body);

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
    return_url: siteUrl(returnUrl, "/settings/account")
  });

  return { statusCode: 200, body: JSON.stringify({ url: session.url }) };
});
