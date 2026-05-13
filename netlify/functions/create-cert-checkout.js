const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  try {
    const { userId, certType = "git-fundamentals", successUrl, cancelUrl } = JSON.parse(event.body || "{}");

    if (!userId) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing userId" }) };
    }

    const siteUrl = process.env.URL || "http://127.0.0.1:5173";
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "gbp",
          unit_amount: 2000,
          product_data: {
            name: "ForAllCode Git Fundamentals Certificate",
            description: "Lifetime certificate with unique verification code"
          }
        },
        quantity: 1
      }],
      mode: "payment",
      success_url: successUrl || `${siteUrl}/certification/git-fundamentals/assessment?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${siteUrl}/certification/git-fundamentals`,
      metadata: {
        supabase_user_id: userId,
        cert_type: certType
      }
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ sessionId: session.id, url: session.url })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
