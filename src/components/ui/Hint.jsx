import { useEffect, useState } from "react";
import { glossaryHints } from "../../data/glossary";
import { readAppearance } from "../../lib/appearance";
import { useSubscription } from "../../lib/useSubscription";

export default function Hint({ term, children }) {
  const { isPro } = useSubscription();
  const [enabled, setEnabled] = useState(() => readAppearance().plainLanguageHints);
  const hint = glossaryHints[term];

  useEffect(() => {
    function syncHints() {
      setEnabled(readAppearance().plainLanguageHints);
    }

    window.addEventListener("forallcode-appearance-change", syncHints);
    window.addEventListener("storage", syncHints);
    return () => {
      window.removeEventListener("forallcode-appearance-change", syncHints);
      window.removeEventListener("storage", syncHints);
    };
  }, []);

  if (!hint || !enabled || isPro) return children;

  return (
    <span className="plain-hint" tabIndex={0}>
      {children}
      <span className="plain-hint-bubble" role="tooltip">{hint}</span>
    </span>
  );
}
