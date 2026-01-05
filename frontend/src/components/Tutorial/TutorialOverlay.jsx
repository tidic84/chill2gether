import { useTutorial } from "../../contexts/TutorialContext";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Spotlight from "./Spotlight";
import TutorialTooltip from "./TutorialTooltip";

export default function TutorialOverlay() {
    // recuperer les donnees du tutorial depuis le context
    const { isActive, currentStepData } = useTutorial();

    // etat pour stocker la position de l element cible
    const [targetPosition, setTargetPosition] = useState(null);

    // etat pour gerer l animation d apparition
    const [isVisible, setIsVisible] = useState(false);

    // useEffect : s execute quand isActive ou currentStepData change
    useEffect(() => {
        // si le tutorial n est pas actif, on ne fait rien
        if (!isActive || !currentStepData) {
            setTargetPosition(null);
            setIsVisible(false);
            return;
        }

        // trouver l element html avec le selecteur du step
        const element = document.querySelector(currentStepData.target);

        // si l element n existe pas
        if (!element) {
            console.warn(`element "${currentStepData.target}" introuvable`);
            setTargetPosition(null);
            return;
        }

        // calculer la position de l element
        const rect = element.getBoundingClientRect();

        // ajouter le padding defini dans le step
        const padding = currentStepData.spotlightPadding || 10;

        // creer l objet position avec padding
        const position = {
            x: rect.x - padding,
            y: rect.y - padding,
            width: rect.width + padding * 2,
            height: rect.height + padding * 2,
        };

        // mettre a jour l etat
        setTargetPosition(position);
        setIsVisible(true);

        // scroll automatique vers l element s il n est pas visible
        element.scrollIntoView({
            behavior: "smooth",
            block: "center",
            inline: "center",
        });

        // fonction pour recalculer la position lors du scroll/resize
        const updatePosition = () => {
            const rect = element.getBoundingClientRect();
            const position = {
                x: rect.x - padding,
                y: rect.y - padding,
                width: rect.width + padding * 2,
                height: rect.height + padding * 2,
            };
            setTargetPosition(position);
        };

        // ecouter les evenements scroll et resize
        window.addEventListener("scroll", updatePosition);
        window.addEventListener("resize", updatePosition);

        // nettoyage : retirer les listeners quand le composant se demonte
        return () => {
            window.removeEventListener("scroll", updatePosition);
            window.removeEventListener("resize", updatePosition);
        };
    }, [isActive, currentStepData]);

    // si le tutorial n est pas actif, ne rien afficher
    if (!isActive || !targetPosition) {
        return null;
    }

    // afficher l overlay avec createPortal
    return createPortal(
        <div
            className={`fixed inset-0 z-[9999] transition-opacity duration-300 ${isVisible ? "opacity-100" : "opacity-0"
                }`}
        >
            {/* le spotlight (cercle de lumiere) avec son box-shadow qui crée l'effet sombre */}
            <Spotlight position={targetPosition} padding={currentStepData.spotlightPadding} />

            {/* le tooltip avec le contenu du tutorial */}
            <TutorialTooltip
                step={currentStepData}
                targetPosition={targetPosition}
                placement={currentStepData.placement}
            />
        </div>,
        document.body
    );
}

