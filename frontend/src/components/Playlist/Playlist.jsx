// src/components/Playlist/Playlist.jsx
import { useState } from "react";

export default function Playlist({ videos = [], onSelectVideo }) {
    const [currentIndex, setCurrentIndex] = useState(0);

    const handleSelect = (index) => {
        setCurrentIndex(index);
        if (onSelectVideo) onSelectVideo(videos[index].url); // informe le parent
    };

    return (
        <div className="h-full overflow-y-auto">
            <h2 className="font-bold text-lg mb-2">Playlist</h2>
            <ul className="space-y-1">
                {videos.map((video, index) => (
                    <li
                        key={video.id}
                        onClick={() => handleSelect(index)}
                        className={`cursor-pointer px-2 py-1 rounded ${index === currentIndex ? "bg-blue-500 text-white" : "bg-gray-100"
                            }`}
                    >
                        {video.title}
                    </li>
                ))}
            </ul>
        </div>
    );
}
