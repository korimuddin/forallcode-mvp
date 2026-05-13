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

    const certProducts = {
      "git-fundamentals": {
        amount: 2000,
        name: "ForAllCode Git Fundamentals Certificate",
        path: "git-fundamentals"
      },
      "git-for-teams": {
        amount: 2500,
        name: "ForAllCode Git for Teams Certificate",
        path: "git-for-teams"
      },
      "command-line-essentials": {
        amount: 2000,
        name: "ForAllCode Command Line Essentials Certificate",
        path: "command-line-essentials"
      },
      "open-source-contributor": {
        amount: 2000,
        name: "ForAllCode Open Source Contributor Certificate",
        path: "open-source-contributor"
      }
    };
    const product = certProducts[certType] || certProducts["git-fundamentals"];
    const siteUrl = process.env.URL || "http://127.0.0.1:5173";
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "gbp",
          unit_amount: product.amount,
          product_data: {
            name: product.name,
            description: "Lifetime certificate with unique verification code"
          }
        },
        quantity: 1
      }],
      mode: "payment",
      success_url: successUrl || `${siteUrl}/certification/${product.path}/assessment?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${siteUrl}/certification/${product.path}`,
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
