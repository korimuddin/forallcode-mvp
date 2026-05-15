import { useMemo } from "react";

const CONFETTI_COLOURS = ["#ddd5f0", "#c8d8c4", "#cce0f0", "#f5d5d8", "#f5e4c4"];

export default function ConfettiAnimation() {
  const dots = useMemo(() => (
    Array.from({ length: 30 }, (_, index) => ({
      colour: CONFETTI_COLOURS[index % CONFETTI_COLOURS.length],
      left: `${Math.random() * 100}%`,
      size: `${6 + Math.random() * 6}px`,
      duration: `${2 + Math.random() * 2}s`,
      delay: `${Math.random() * 1.5}s`
    }))
  ), []);

  return (
    <div className="onboarding-confetti" aria-hidden="true">
      {dots.map((dot, index) => (
        <span
          key={`${dot.left}-${index}`}
          style={{
            "--confetti-colour": dot.colour,
            "--confetti-left": dot.left,
            "--confetti-size": dot.size,
            "--confetti-duration": dot.duration,
            "--confetti-delay": dot.delay
          }}
        />
      ))}
    </div>
  );
}
