import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { roomPageSteps } from '../config/tutorialSteps'



const TutorialContext = createContext(undefined);

export function TutorialProvider({ children }) {
    const [isActive, setIsActive] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [steps, setSteps] = useState([]);
    const [tutorialType, setTutorialType] = useState(null);

    const endTutorial = useCallback(() => {
        if (tutorialType) {
            localStorage.setItem('chill2gether_tutorial_' + tutorialType + '_completed', 'true');
        }
        setIsActive(false);
        setCurrentStep(0);
        setSteps([]);
        setTutorialType(null);
    }, [tutorialType]);

    const startTutorial = useCallback((type) => {
        if (localStorage.getItem('chill2gether_tutorial_' + type + '_completed') === 'true') {
            return;
        }

        if (type === 'room') {
            setSteps(roomPageSteps);
        } else {
            console.warn(`Tutorial type "${type}" not found`);
            return;
        }

        setTutorialType(type);
        setCurrentStep(0);
        setIsActive(true);
    }, []);

    const nextStep = useCallback(() => {
        if (currentStep >= steps.length - 1) {
            endTutorial();
        } else {
            setCurrentStep(currentStep + 1);
        }
    }, [currentStep, steps.length, endTutorial]);

    const previousStep = useCallback(() => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    }, [currentStep]);

    const skipTutorial = useCallback(() => {
        if (tutorialType) {
            localStorage.setItem('chill2gether_tutorial_' + tutorialType + '_skipped', 'true');
        }
        endTutorial();
    }, [tutorialType, endTutorial]);

    const value = useMemo(() => ({
        isActive,
        currentStep,
        tutorialType,
        currentStepData: steps[currentStep],
        totalSteps: steps.length,
        isFirstStep: currentStep === 0,
        isLastStep: currentStep === steps.length - 1,
        startTutorial,
        nextStep,
        previousStep,
        skipTutorial,
        endTutorial
    }), [isActive, currentStep, steps, tutorialType, startTutorial, nextStep, previousStep, skipTutorial, endTutorial]);

    return (
        <TutorialContext.Provider value={value}>
            {children}
        </TutorialContext.Provider>
    );
}

export function useTutorial() {
    const context = useContext(TutorialContext);

    if (context === undefined) {
        throw new Error('useTutorial doit être utilisé dans un TutorialProvider');
    }

    return context;
}
