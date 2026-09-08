const { authenticated, siteUrl } = require("./lib/auth.cjs");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.handler = authenticated(async (event, user, supabase) => {
  const userId = user.id;
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  try {
    const { priceId, successUrl, cancelUrl } = JSON.parse(event.body);

    const prices = [process.env.VITE_STRIPE_PRICE_MONTHLY, process.env.VITE_STRIPE_PRICE_ANNUAL].filter(Boolean);
    if (!prices.includes(priceId)) return { statusCode: 400, body: JSON.stringify({ error: "Unknown subscription price." }) };
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .single();

    let customerId = sub?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email, metadata: { supabase_user_id: userId } });
      customerId = customer.id;

      await supabase.from("subscriptions")
        .update({ stripe_customer_id: customerId })
        .eq("user_id", userId);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: siteUrl(successUrl),
      cancel_url: siteUrl(cancelUrl),
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      metadata: { supabase_user_id: userId }
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ sessionId: session.id, url: session.url })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: "Could not complete your request. Please try again." }) };
  }
});
