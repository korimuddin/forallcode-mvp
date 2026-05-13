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
    case "checkout.session.completed": {
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
