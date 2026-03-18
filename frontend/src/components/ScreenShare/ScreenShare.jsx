import { useState, useRef, useEffect } from "react";
import { Monitor, MonitorOff } from "lucide-react";

export default function ScreenShare({ isAdmin, isSharing, onStart, onStop }) {
    const videoRef = useRef(null);
    const streamRef = useRef(null);

    const startSharing = async () => {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: { cursor: "always" },
                audio: false,
            });
            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }

            // Gérer l'arrêt natif (utilisateur clique "Arrêter le partage" dans le navigateur)
            stream.getVideoTracks()[0].onended = () => {
                handleStop();
            };

            onStart();
        } catch (error) {
            console.error("Erreur partage d'écran:", error);
        }
    };

    const handleStop = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        onStop();
    };

    // Cleanup au unmount
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // Admin voit son propre écran partagé
    if (isAdmin && isSharing) {
        return (
            <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-contain"
                />
                <button
                    onClick={handleStop}
                    className="absolute top-3 right-3 flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-lg transition text-sm"
                >
                    <MonitorOff size={16} />
                    Arrêter
                </button>
            </div>
        );
    }

    // Étudiants voient un placeholder
    if (!isAdmin && isSharing) {
        return (
            <div className="w-full aspect-video bg-gray-900 rounded-xl flex flex-col items-center justify-center text-white">
                <Monitor size={48} className="mb-4 text-blue-400 animate-pulse" />
                <p className="text-lg font-medium">L'enseignant partage son écran</p>
                <p className="text-sm text-gray-400 mt-1">
                    La transmission vidéo sera disponible prochainement
                </p>
            </div>
        );
    }

    // État par défaut (pas de partage)
    if (isAdmin) {
        return (
            <button
                onClick={startSharing}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            >
                <Monitor size={16} />
                Partager mon écran
            </button>
        );
    }

    return null;
}
