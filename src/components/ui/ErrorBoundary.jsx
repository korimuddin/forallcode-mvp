import React from "react";
import { supabase } from "../../lib/supabase";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("ForAllCode caught an error", error, info);
    logFrontendError(error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="error-boundary-state" role="alert">
        <span aria-hidden="true">🪴</span>
        <h1>Something needs a little care.</h1>
        <p>ForAllCode hit a snag while loading this page. A quick reload usually gets things growing again.</p>
        <button type="button" onClick={() => window.location.reload()}>Reload page</button>
      </main>
    );
  }
}

async function logFrontendError(error, info) {
  if (!supabase) return;

  try {
    const { data } = await supabase.auth.getUser();
    await supabase.from("error_log").insert({
      user_id: data?.user?.id || null,
      error_message: error?.message || "Unknown frontend error",
      error_stack: `${error?.stack || ""}\n${info?.componentStack || ""}`.slice(0, 2000),
      page_path: window.location.pathname
    });
  } catch (logError) {
    console.error("Could not log ForAllCode error", logError);
  }
}
