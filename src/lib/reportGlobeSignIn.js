const REPORTED_SESSION_KEY = "forallcode:globe-signin:reported-session";

function getSessionMarker(session) {
  if (!session?.expires_at) return "";
  return String(session.expires_at);
}

export async function reportGlobeSignIn(session) {
  if (typeof window === "undefined" || !session) return;

  const marker = getSessionMarker(session);
  if (!marker || window.sessionStorage.getItem(REPORTED_SESSION_KEY) === marker) return;

  try {
    await fetch("/.netlify/functions/globe-signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });
    window.sessionStorage.setItem(REPORTED_SESSION_KEY, marker);
  } catch {
    // The globe has demo mode, so sign-in reporting should never block auth.
  }
}
