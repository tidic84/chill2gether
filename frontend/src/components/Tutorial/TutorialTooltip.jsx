import { useTutorial } from "../../contexts/TutorialContext";

export default function TutorialTooltip({ step, targetPosition, placement }) {
    // recuperer les fonctions et etats du context
    const {
        currentStep,
        totalSteps,
        isFirstStep,
        isLastStep,
        nextStep,
        previousStep,
        skipTutorial
    } = useTutorial();

    // securite si pas de step ou position
    if (!step || !targetPosition) return null;

    // calculer la position du tooltip selon le placement
    const getTooltipPosition = () => {
        const offset = 20; // espace entre spotlight et tooltip

        switch (placement) {
            case 'top':
                return {
                    left: targetPosition.x + 'px',
                    bottom: (window.innerHeight - targetPosition.y + offset) + 'px',
                    transform: 'translateX(0)'
                };
            case 'bottom':
                return {
                    left: targetPosition.x + 'px',
                    top: (targetPosition.y + targetPosition.height + offset) + 'px',
                    transform: 'translateX(0)'
                };
            case 'left':
                return {
                    right: (window.innerWidth - targetPosition.x + offset) + 'px',
                    top: targetPosition.y + 'px',
                    transform: 'translateY(0)'
                };
            case 'right':
                return {
                    left: (targetPosition.x + targetPosition.width + offset) + 'px',
                    top: targetPosition.y + 'px',
                    transform: 'translateY(0)'
                };
            default:
                return {
                    left: targetPosition.x + 'px',
                    top: (targetPosition.y + targetPosition.height + offset) + 'px'
                };
        }
    };

    const tooltipStyle = getTooltipPosition();

    return (
        <div
            className="absolute bg-white dark:bg-zen-dark-surface rounded-2xl shadow-2xl p-6 max-w-sm border border-zen-border dark:border-zen-dark-border animate-[slideIn_300ms_ease-out] z-10"
            style={tooltipStyle}
        >
            {/* header avec progression et bouton fermer */}
            <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-zen-sage dark:text-zen-dark-sage">
                    etape {currentStep + 1}/{totalSteps}
                </span>
                <button
                    onClick={skipTutorial}
                    className="text-zen-muted dark:text-zen-dark-muted hover:text-zen-text dark:hover:text-zen-dark-text transition-colors"
                    title="fermer le tutoriel"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* contenu */}
            <h3 className="text-lg font-bold text-zen-text dark:text-zen-dark-text mb-2">
                {step.title}
            </h3>
            <p className="text-sm text-zen-stone dark:text-zen-dark-stone mb-6 leading-relaxed">
                {step.content}
            </p>

            {/* boutons de navigation */}
            <div className="flex gap-2">
                {!isFirstStep && (
                    <button
                        onClick={previousStep}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-zen-surface dark:bg-zen-dark-surface border border-zen-border dark:border-zen-dark-border text-zen-text dark:text-zen-dark-text font-semibold hover:bg-zen-bg dark:hover:bg-zen-dark-bg transition-all"
                    >
                        precedent
                    </button>
                )}
                <button
                    onClick={nextStep}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-zen-sage dark:bg-zen-dark-sage text-white font-semibold hover:bg-zen-sage/90 dark:hover:bg-zen-dark-sage/90 transition-all shadow-md"
                >
                    {isLastStep ? 'terminer' : 'suivant'}
                </button>
            </div>
        </div>
    );
}