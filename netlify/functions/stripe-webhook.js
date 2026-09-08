const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  const sig = event.headers["stripe-signature"];
  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body, sig, process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  const session = stripeEvent.data.object;

  await supabase.from("system_status").upsert({
    key: "last_stripe_webhook",
    value: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }, { onConflict: "key" });

  switch (stripeEvent.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      if (session.mode === "payment" && session.metadata?.course_id) {
        if (session.payment_status !== "paid") break;
        const courseId = session.metadata.course_id;
        const userId = session.metadata.supabase_user_id;
        const price = Number(session.amount_total || 0) / 100;
        const authorPayout = Number((price * 0.7).toFixed(2));
        const platformFee = Number((price * 0.3).toFixed(2));

        const { data: existing } = await supabase
          .from("course_purchases")
          .select("id")
          .eq("user_id", userId)
          .eq("course_id", courseId)
          .maybeSingle();

        if (!existing?.id) {
          await supabase.from("course_purchases").insert({
            user_id: userId,
            course_id: courseId,
            stripe_payment_id: session.payment_intent,
            amount_gbp: price,
            author_payout_gbp: authorPayout,
            platform_fee_gbp: platformFee
          });

          const { data: course } = await supabase
            .from("marketplace_courses")
            .select("student_count")
            .eq("id", courseId)
            .maybeSingle();

          await supabase
            .from("marketplace_courses")
            .update({
              student_count: Number(course?.student_count || 0) + 1,
              updated_at: new Date().toISOString()
            })
            .eq("id", courseId);
        }
        break;
      }

      if (session.mode === "payment" && session.metadata?.cert_type) {
        const userId = session.metadata.supabase_user_id;
        const certType = session.metadata.cert_type;
        if (session.payment_status !== "paid") break;
        const { error } = await supabase.rpc("grant_certificate_payment", {
          buyer: userId, kind: certType, payment: session.payment_intent
        });
        if (error) return { statusCode: 500, body: "Could not record certificate payment" };
        break;
      }

      if (session.mode !== "subscription") break;

      const userId = session.metadata.supabase_user_id;
      const stripeSubscriptionId = session.subscription;
      const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);

      await supabase.from("subscriptions").update({
        plan_id: "pro",
        stripe_subscription_id: stripeSubscriptionId,
        stripe_customer_id: session.customer,
        status: "active",
        current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: false,
        updated_at: new Date().toISOString()
      }).eq("user_id", userId);
      break;
    }

    case "customer.subscription.updated": {
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("user_id")
        .eq("stripe_customer_id", session.customer)
        .single();

      if (sub) {
        await supabase.from("subscriptions").update({
          status: session.status,
          cancel_at_period_end: session.cancel_at_period_end,
          current_period_end: new Date(session.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString()
        }).eq("user_id", sub.user_id);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("user_id")
        .eq("stripe_customer_id", session.customer)
        .single();

      if (sub) {
        await supabase.from("subscriptions").update({
          plan_id: "free",
          status: "cancelled",
          updated_at: new Date().toISOString()
        }).eq("user_id", sub.user_id);
      }
      break;
    }

    case "invoice.payment_failed": {
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("user_id")
        .eq("stripe_customer_id", session.customer)
        .single();

      if (sub) {
        await supabase.from("subscriptions").update({
          status: "past_due",
          updated_at: new Date().toISOString()
        }).eq("user_id", sub.user_id);
      }
      break;
    }
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
