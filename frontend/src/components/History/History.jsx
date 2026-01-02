// src/components/History/History.jsx
import { useState } from "react";
import { usePermissions } from "../../contexts/SocketContext";

export default function History({ videos = [], onSelectVideo }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const permissions = usePermissions();
    const canChangeVideo = permissions?.changeVideo !== false;

    const handleSelect = (index) => {
        if (!canChangeVideo) {
            return;
        }
        setCurrentIndex(index);
        if (onSelectVideo) onSelectVideo(videos[index].url);
    };

    return (
        <div className="h-full overflow-y-auto px-4 pb-4">
            {!canChangeVideo && (
                <div className="p-3 mb-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
                    <i className="fa-solid fa-lock"></i>
                    Vous n'avez pas la permission de gérer l'historique
                </div>
            )}

            <div className="space-y-2">
                {videos.length === 0 ? (
                    <div className="text-center text-zen-stone py-8 text-sm">
                        Aucune vidéo dans l'historique
                    </div>
                ) : (
                    videos.map((video, index) => (
                        <div
                            key={`${video.id}-${index}`}
                            onClick={() => handleSelect(index)}
                            className={`relative flex gap-3 items-center p-2 rounded-lg transition-all ${index === currentIndex
                                    ? "bg-zen-sage/20 shadow-sm"
                                    : "bg-zen-sage/10 hover:shadow-sm"
                                } ${canChangeVideo ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
                        >
                            {/* Thumbnail */}
                            <div className="relative flex-shrink-0">
                                {video.thumbnail ? (
                                    <img
                                        src={video.thumbnail}
                                        alt={video.title}
                                        className="w-24 h-16 rounded-lg object-cover"
                                    />
                                ) : (
                                    <div className="w-24 h-16 rounded-lg bg-zen-warm-stone flex items-center justify-center">
                                        <span className="text-xs text-zen-dark-stone">
                                            Pas d'image
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Video Info */}
                            <div className="flex-1 min-w-0">
                                <p
                                    className={`text-sm font-semibold truncate ${index === currentIndex ? "text-zen-sage" : "text-zen-medium-stone"
                                        }`}
                                >
                                    {video.title}
                                </p>
                                <p className="text-xs text-zen-stone">
                                    {video.addedBy?.username ? `Ajouté par ${video.addedBy.username}` : (video.duration || "Durée inconnue")}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
