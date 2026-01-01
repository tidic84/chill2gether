import { useState } from "react";
import { X } from "lucide-react";

export default function Playlist({ videos = [], onSelectVideo, onDeleteVideo }) {
    const [currentIndex, setCurrentIndex] = useState(0);

    const handleSelect = (index) => {
        setCurrentIndex(index);
        if (onSelectVideo) onSelectVideo(videos[index].url);
    };

    return (
        <div className="h-full overflow-y-auto px-4 pb-4">
            <div className="space-y-2">
                {videos.length === 0 ? (
                    <div className="text-center text-zen-stone py-8 text-sm">
                        Aucune vidéo dans la playlist
                    </div>
                ) : (
                    videos.map((video, index) => (
                        <div
                            key={video.id}
                            onClick={() => handleSelect(index)}
                            className={`relative flex gap-3 items-center p-2 rounded-lg transition-all group cursor-pointer ${
                                index === currentIndex
                                    ? "bg-zen-sage/10 shadow-sm"
                                    : "hover:bg-white hover:shadow-sm"
                            }`}
                        >
                            {/* Index Badge */}
                            <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                    index === currentIndex
                                        ? "bg-zen-sage text-white"
                                        : "bg-zen-warm-stone text-zen-dark-stone"
                                }`}
                            >
                                {index + 1}
                            </div>

                            {/* Video Info */}
                            <div className="flex-1 min-w-0">
                                <p
                                    className={`text-sm font-semibold truncate ${
                                        index === currentIndex ? "text-zen-sage" : "text-zen-medium-stone"
                                    }`}
                                >
                                    {video.title}
                                </p>
                                <p className="text-xs text-zen-stone">
                                    {video.duration || "En cours"}
                                </p>
                            </div>

                            {/* Delete Button */}
                            {onDeleteVideo && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteVideo(video.id);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-zen-stone hover:text-zen-terracotta rounded transition-all"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
