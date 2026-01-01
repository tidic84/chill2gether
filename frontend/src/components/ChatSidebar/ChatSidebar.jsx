// src/components/ChatSidebar/ChatSidebar.jsx
import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";

export default function ChatSidebar({ chat, playlist, history }) {
    const [activeOverlay, setActiveOverlay] = useState(null); // 'playlist' | 'history' | null
    const lastActiveOverlay = useRef(null); // Garde en mémoire le dernier overlay actif

    // Met à jour lastActiveOverlay uniquement quand activeOverlay change vers une valeur non-null
    useEffect(() => {
        if (activeOverlay !== null) {
            lastActiveOverlay.current = activeOverlay;
        }
    }, [activeOverlay]);

    // Détermine quel contenu afficher (utilise le dernier actif pendant la fermeture)
    const overlayContent = activeOverlay || lastActiveOverlay.current;

    return (
        <div className="relative w-full h-full bg-white overflow-hidden flex flex-col">
            {/* Header with Toggle Buttons */}
            <div className="flex p-1 m-3 bg-zen-cream rounded-xl border border-zen-warm-stone">
                <button
                    onClick={() => setActiveOverlay((prev) => (prev === "playlist" ? null : "playlist"))}
                    className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide rounded-lg transition-all ${
                        activeOverlay === "playlist"
                            ? "bg-white text-zen-sage shadow-sm"
                            : "text-zen-stone hover:text-zen-dark-stone"
                    }`}
                >
                    File
                </button>
                <button
                    onClick={() => setActiveOverlay((prev) => (prev === "history" ? null : "history"))}
                    className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide rounded-lg transition-all ${
                        activeOverlay === "history"
                            ? "bg-white text-zen-sage shadow-sm"
                            : "text-zen-stone hover:text-zen-dark-stone"
                    }`}
                >
                    Historique
                </button>
            </div>

            {/* Contenu principal */}
            <div className="flex-1 relative overflow-hidden">
                {/* Overlay (playlist ou history) */}
                <div className={`absolute top-0 left-0 w-full bg-zen-light-cream border-b border-zen-warm-stone flex flex-col transition-all duration-200 ease-in-out z-10 ${
                    activeOverlay ? "h-[40%] opacity-100" : "h-0 opacity-0 pointer-events-none"
                }`}>
                    <div className="p-2 flex justify-end">
                        <button
                            onClick={() => setActiveOverlay(null)}
                            className="p-1 text-zen-stone hover:text-zen-dark-stone hover:bg-zen-warm-stone rounded-md transition-colors"
                        >
                            <X size={14} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {overlayContent === "playlist" ? playlist : history}
                    </div>
                </div>

                {/* Chat (toujours visible, en dessous de l'overlay) */}
                <div className={`absolute bottom-0 left-0 w-full transition-all duration-200 ease-in-out ${
                    activeOverlay ? "h-[60%]" : "h-full"
                }`}>
                    {chat}
                </div>
            </div>
        </div>
    );
}
