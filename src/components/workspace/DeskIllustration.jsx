import { useEffect, useState } from "react";
import { getDeskTheme } from "../../data/deskThemes";

export default function DeskIllustration({
  theme = "classic",
  showClock = true,
  showDecorations = true
}) {
  const colours = typeof theme === "string" ? getDeskTheme(theme) : theme;
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    const id = window.setInterval(() => setDate(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const minute = date.getMinutes() * 6;
  const hour = (date.getHours() % 12) * 30 + date.getMinutes() / 2;
  const isNight = colours.name === "Night owl";

  return (
    <svg viewBox="0 0 900 520" role="img" aria-label={`${colours.name} illustrated workspace desk`}>
      <rect x="18" y="18" width="864" height="484" fill={colours.desk} stroke={colours.deskEdge} />
      <rect x="185" y="70" width="360" height="210" fill={colours.monitor} stroke={colours.deskEdge} />
      <rect x="215" y="100" width="300" height="150" fill={isNight ? "#141211" : colours.text} opacity={isNight ? ".78" : ".88"} />
      <path d="M248 134h142M248 166h210M248 198h118M248 230h174" stroke={colours.screenGlow} strokeWidth="9" strokeLinecap="round" />
      <rect x="292" y="288" width="150" height="16" fill={colours.accent} opacity=".72" />
      <rect x="214" y="326" width="316" height="82" fill={colours.paper} stroke={colours.deskEdge} />
      {Array.from({ length: 12 }).map((_, i) => (
        <rect key={i} x={236 + i * 22} y="348" width="14" height="12" fill={i % 3 === 0 ? colours.note1 : i % 3 === 1 ? colours.note2 : colours.note3} />
      ))}

      {showDecorations && (
        <>
          <rect x="615" y="92" width="76" height="86" fill={colours.mug} stroke={colours.deskEdge} />
          <path d="M690 116c42 0 42 42 0 42" fill="none" stroke={colours.deskEdge} strokeWidth="10" />
          <path d="M640 70c-8-18 8-28 0-44M668 70c-8-18 8-28 0-44" stroke={isNight ? "#8d8278" : "#9c918c"} strokeWidth="5" strokeLinecap="round" />
          <rect x="650" y="325" width="92" height="88" fill={colours.plant} stroke={colours.deskEdge} />
          <path d="M696 325c-42-54-98-28-54 10M696 325c34-68 92-32 44 8" fill={colours.leaf} />
          <rect x="640" y="410" width="116" height="26" fill={colours.deskEdge} />
          <circle cx="775" cy="322" r="11" fill={colours.leaf} />
          <rect x="733" y="334" width="112" height="82" fill={colours.plant} stroke={colours.deskEdge} transform="rotate(7 789 375)" />
        </>
      )}

      {showClock && (
        <>
          <circle cx="748" cy="118" r="54" fill={colours.clockFace} stroke={colours.deskEdge} />
          <circle cx="748" cy="118" r="42" fill={colours.clock} opacity=".35" />
          <line x1="748" y1="118" x2="748" y2="84" stroke={colours.accent} strokeWidth="5" transform={`rotate(${minute} 748 118)`} />
          <line x1="748" y1="118" x2="748" y2="94" stroke={colours.text} strokeWidth="6" transform={`rotate(${hour} 748 118)`} />
          <circle cx="748" cy="118" r="5" fill={colours.text} />
        </>
      )}

      <circle cx="110" cy="104" r="11" fill={isNight ? "#b96c7a" : "#d4848c"} />
      <rect x="86" y="114" width="116" height="86" fill={colours.note2} stroke={colours.deskEdge} transform="rotate(-8 144 157)" />
      <rect x="148" y="126" width="112" height="82" fill={colours.note1} stroke={colours.deskEdge} transform="rotate(-3 204 167)" />
    </svg>
  );
}
