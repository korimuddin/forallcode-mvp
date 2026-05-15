export default function OnboardingStep({
  children,
  currentStep,
  totalSteps,
  cardClassName = ""
}) {
  return (
    <div className="onboarding-overlay" role="dialog" aria-modal="true" aria-label="ForAllCode onboarding">
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
