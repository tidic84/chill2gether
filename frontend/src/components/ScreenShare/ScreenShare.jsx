import { useRef, useEffect } from 'react';
import { Monitor } from 'lucide-react';

/**
 * Composant d'affichage pur — la logique WebRTC est dans le hook useScreenShare (RoomPage).
 *
 * Props :
 *   isAdmin      — boolean : utilisateur courant est l'admin/prof
 *   isSharing    — boolean : un partage est actif (état global wb)
 *   localStream  — MediaStream|null : flux local de l'admin (aperçu)
 *   remoteStream — MediaStream|null : flux reçu par l'étudiant via WebRTC
 *   error        — string|null : message d'erreur à afficher
 */
export default function ScreenShare({ isAdmin, isSharing, localStream, remoteStream, error }) {
    const videoRef = useRef(null);

    // Attacher le stream (local pour admin, distant pour étudiant) à la balise <video>
    const stream = isAdmin ? localStream : remoteStream;
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.srcObject = stream ?? null;
        }
    }, [stream]);

    if (!isSharing) return null;

    return (
        <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden flex items-center justify-center">
            {/* Indicateur "en direct" */}
            <div className="absolute top-3 left-3 flex items-center gap-2 z-10 pointer-events-none">
                <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                </span>
                <span className="text-white text-sm font-medium drop-shadow">Partage en cours</span>
            </div>

            {/* Flux vidéo */}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={isAdmin} // l'admin ne s'entend pas lui-même
                className={`w-full h-full object-contain transition-opacity duration-300 ${stream ? 'opacity-100' : 'opacity-0 absolute'}`}
            />

            {/* Placeholder en attente du stream WebRTC (étudiant uniquement) */}
            {!stream && !isAdmin && (
                <div className="flex flex-col items-center justify-center text-white gap-3 select-none">
                    <Monitor size={48} className="text-blue-400 animate-pulse" />
                    <p className="text-lg font-medium">L'enseignant partage son écran</p>
                    <p className="text-sm text-gray-400">Connexion WebRTC en cours…</p>
                </div>
            )}

            {/* Message d'erreur */}
            {error && (
                <div className="absolute bottom-3 left-3 right-3 px-3 py-2 bg-red-900/80 text-red-200 rounded-lg text-sm text-center">
                    {error}
                </div>
            )}
        </div>
    );
}
