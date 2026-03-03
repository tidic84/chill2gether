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

        // Trouver le conteneur scrollable (le main)
        const scrollContainer = document.querySelector('main');
        
        if (scrollContainer) {
            // Calculer si l'élément est visible
            const containerRect = scrollContainer.getBoundingClientRect();
            const elementRect = element.getBoundingClientRect();
            
            // Vérifier si l'élément n'est pas complètement visible
            const isAboveViewport = elementRect.top < containerRect.top + 100;
            const isBelowViewport = elementRect.bottom > containerRect.bottom - 100;
            
            if (isAboveViewport || isBelowViewport) {
                // Calculer la position de scroll cible
                const elementOffsetTop = element.offsetTop;
                const containerHeight = scrollContainer.clientHeight;
                const elementHeight = element.offsetHeight;
                
                // Centrer l'élément, mais ne pas dépasser le max scroll
                let targetScroll = elementOffsetTop - (containerHeight / 2) + (elementHeight / 2);
                
                // Limiter le scroll au maximum disponible
                const maxScroll = scrollContainer.scrollHeight - scrollContainer.clientHeight;
                targetScroll = Math.min(Math.max(0, targetScroll), maxScroll);
                
                scrollContainer.scrollTo({
                    top: targetScroll,
                    behavior: "smooth"
                });
            }
        }

        // fonction pour recalculer la position lors du scroll/resize
        let throttleTimeout = null;
        const updatePosition = () => {
            if (throttleTimeout) return; // Skip si déjà en cours
            
            throttleTimeout = setTimeout(() => {
                const rect = element.getBoundingClientRect();
                const position = {
                    x: rect.x - padding,
                    y: rect.y - padding,
                    width: rect.width + padding * 2,
                    height: rect.height + padding * 2,
                };
                setTargetPosition(position);
                throttleTimeout = null;
            }, 100); // Throttle à 100ms
        };

        // Écouter le scroll du conteneur main et window
        window.addEventListener("scroll", updatePosition, true);
        window.addEventListener("resize", updatePosition);
        
        if (scrollContainer) {
            scrollContainer.addEventListener("scroll", updatePosition);
        }

        // nettoyage : retirer les listeners quand le composant se demonte
        return () => {
            if (throttleTimeout) clearTimeout(throttleTimeout);
            window.removeEventListener("scroll", updatePosition, true);
            window.removeEventListener("resize", updatePosition);
            if (scrollContainer) {
                scrollContainer.removeEventListener("scroll", updatePosition);
            }
        };
    }, [isActive, currentStepData]);

    // si le tutorial n est pas actif, ne rien afficher
    if (!isActive || !targetPosition) {
        return null;
    }

    // afficher l overlay avec createPortal
    return createPortal(
        <div
            className={`fixed inset-0 z-[9999] pointer-events-none transition-opacity duration-300 ${isVisible ? "opacity-100" : "opacity-0"
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

