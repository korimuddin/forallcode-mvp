const { authenticated, siteUrl } = require("./lib/auth.cjs");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.handler = authenticated(async (event, user, supabase) => {
  const userId = user.id;
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  try {
    const { courseId, successUrl, cancelUrl } = JSON.parse(event.body || "{}");

    if (!userId || !courseId) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing userId or courseId" }) };
    }

    const { data: course, error: courseError } = await supabase
      .from("marketplace_courses")
      .select("id, title, description, price_gbp, stripe_price_id, status")
      .eq("id", courseId)
      .maybeSingle();

    if (courseError) throw courseError;
    if (!course || course.status !== "approved") {
      return { statusCode: 404, body: JSON.stringify({ error: "Course is not available for purchase" }) };
    }

    const { data: existing } = await supabase
      .from("course_purchases")
      .select("id")
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .maybeSingle();

    if (existing?.id) {
      return { statusCode: 200, body: JSON.stringify({ alreadyPurchased: true, url: siteUrl(successUrl) }) };
    }

    const lineItem = course.stripe_price_id
      ? { price: course.stripe_price_id, quantity: 1 }
      : {
          price_data: {
            currency: "gbp",
            unit_amount: Math.round(Number(course.price_gbp || 0) * 100),
            product_data: {
              name: course.title,
              description: course.description || "ForAllCode community course"
            }
          },
          quantity: 1
        };

    const session = await stripe.checkout.sessions.create({
      line_items: [lineItem],
      mode: "payment",
      success_url: siteUrl(successUrl),
      cancel_url: siteUrl(cancelUrl),
      metadata: {
        supabase_user_id: userId,
        course_id: courseId
      }
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ sessionId: session.id, url: session.url })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: "Could not complete your request. Please try again." }) };
  }
});
