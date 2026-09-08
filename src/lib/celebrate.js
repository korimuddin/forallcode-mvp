export function celebrate() {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const colors = ["#ddd5f0", "#c8d8c4", "#f5d5d8", "#cce0f0", "#f5e4c4"];
  const root = document.createElement("div");
  root.className = "confetti-root";
  root.setAttribute("aria-hidden", "true");

  for (let i = 0; i < 24; i += 1) {
    const piece = document.createElement("span");
    piece.style.setProperty("--x", `${Math.random() * 100}vw`);
    piece.style.setProperty("--d", `${1.6 + Math.random()}s`);
    piece.style.setProperty("--r", `${Math.random() * 360}deg`);
    piece.style.background = colors[i % colors.length];
    root.appendChild(piece);
  }

  document.body.appendChild(root);
  setTimeout(() => root.remove(), 2600);
}
