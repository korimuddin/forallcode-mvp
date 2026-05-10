import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export function useAuthSession() {
  const [session, setSession] = useState(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setChecked(true);
      return undefined;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecked(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setChecked(true);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return { session, checked, loggedIn: Boolean(session) };
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => (
    typeof window !== "undefined" ? window.innerWidth < 640 : false
  ));

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640);
    handler();
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  return isMobile;
}

export function useDocumentTitle(title) {
  useEffect(() => {
    if (!title) return undefined;
    const previousTitle = document.title;
    document.title = title.includes("ForAllCode") ? title : `${title} · ForAllCode`;
    return () => {
      document.title = previousTitle;
    };
  }, [title]);
}
