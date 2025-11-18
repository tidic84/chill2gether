import { useState } from "react";

export default function Playlist({ videos = [], onSelectVideo, onDeleteVideo }) {
    const [currentIndex, setCurrentIndex] = useState(0);

    const handleSelect = (index) => {
        setCurrentIndex(index);
        if (onSelectVideo) onSelectVideo(videos[index].url);
    };

    return (
        <div className="h-full overflow-y-auto">
            <div className="space-y-3">
                {videos.map((video, index) => (
                    <div
                        key={video.id}
                        className={`relative flex items-center p-2 rounded-lg shadow cursor-pointer transition-colors ${index === currentIndex
                            ? "bg-gray-400 text-black"
                            : "bg-gray-100 text-black hover:bg-gray-200"
                            }`}
                    >
                        {/* Bouton supprimer */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onDeleteVideo) onDeleteVideo(video.id);
                            }}
                            className="absolute top-1 right-2 text-base hover:text-red-600 text-gray-900 rounded-full w-3 h-3 flex items-center justify-center"
                        >
                            x
                        </button>

                        {/* Miniature */}
                        <div className="w-24 h-16 flex-shrink-0 bg-gray-300 rounded overflow-hidden mr-3">
                            {video.thumbnail && (
                                <img
                                    src={video.thumbnail}
                                    alt={video.title}
                                    className="w-full h-full object-cover"
                                />
                            )}
                        </div>

                        {/* Titre */}
                        <div className="flex-1">
                            <span className="font-medium">{video.title}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
