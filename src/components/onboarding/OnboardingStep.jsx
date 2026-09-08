import { useEffect, useRef } from "react";

export default function OnboardingStep({
  children,
  currentStep,
  totalSteps,
  cardClassName = ""
}) {
  const dialogRef = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    return () => previous?.focus?.();
  }, []);
  useEffect(() => {
    dialogRef.current?.focus();
  }, [currentStep]);

  function trapFocus(event) {
    if (event.key !== "Tab") return;
    const elements = [...dialogRef.current.querySelectorAll('button:not(:disabled), input:not(:disabled), a[href]')];
    const first = elements[0];
    const last = elements.at(-1);
    if (!first) { event.preventDefault(); return; }
    if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault(); first.focus();
    }
  }
  return (
    <div className="onboarding-overlay" ref={dialogRef} tabIndex={-1} onKeyDown={trapFocus} role="dialog" aria-modal="true" aria-label="ForAllCode onboarding">
      <section className={`onboarding-card ${cardClassName}`}>
        <div className="onboarding-dots" aria-label={`Step ${currentStep} of ${totalSteps}`}>
          {Array.from({ length: totalSteps }).map((_, index) => {
            const stepNumber = index + 1;
            const stateClass = stepNumber === currentStep
              ? "current"
              : stepNumber < currentStep
                ? "complete"
                : "upcoming";
            return <span className={stateClass} key={stepNumber} />;
          })}
        </div>
        <p className="onboarding-counter">Step {currentStep} of {totalSteps}</p>
        <div className="onboarding-step-content" key={currentStep}>
          {children}
        </div>
      </section>
    </div>
  );
}
