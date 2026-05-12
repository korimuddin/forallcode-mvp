import { createContext, createElement, useContext, useEffect, useMemo, useState } from "react";
import { getPlanLimits } from "./plans";
import { supabase } from "./supabase";

const SubscriptionContext = createContext(null);

const freeSubscription = {
  plan_id: "free",
  status: "active",
  cancel_at_period_end: false,
  plans: { id: "free", name: "Free" }
};

export function SubscriptionProvider({ children }) {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  async function fetchSubscription() {
    if (!supabase) {
      setSubscription(freeSubscription);
      setLoading(false);
      return freeSubscription;
    }

    setLoading(true);

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      setSubscription(freeSubscription);
      setLoading(false);
      return freeSubscription;
    }

    const { data, error } = await supabase
      .from("subscriptions")
      .select("*, plans(*)")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    const nextSubscription = error || !data ? freeSubscription : data;
    setSubscription(nextSubscription);
    setLoading(false);
    return nextSubscription;
  }

  useEffect(() => {
    let alive = true;

    async function load() {
      const nextSubscription = await fetchSubscription();
      if (!alive) return;
      setSubscription(nextSubscription);
    }

    load();

    if (!supabase) {
      return () => {
        alive = false;
      };
    }

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      fetchSubscription();
    });

    return () => {
      alive = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(() => {
    const planId = subscription?.plan_id || "free";
    const limits = getPlanLimits(planId);
    const isPro = planId === "pro" && subscription?.status === "active";
    const isCancelling = Boolean(subscription?.cancel_at_period_end);

    return {
      subscription: subscription || freeSubscription,
      loading,
      planId,
      limits,
      isPro,
      isCancelling,
      refetch: fetchSubscription
    };
  }, [subscription, loading]);

  return createElement(SubscriptionContext.Provider, { value }, children);
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}
