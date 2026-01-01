// src/components/History/History.jsx
import { useState } from "react";

export default function History({ videos = [], onSelectVideo }) {
    const [currentIndex, setCurrentIndex] = useState(0);

    const handleSelect = (index) => {
        setCurrentIndex(index);
        if (onSelectVideo) onSelectVideo(videos[index].url); // informe le parent
    };

    return (
        <div className="h-full overflow-y-auto">
            <ul className="space-y-1">
                {videos.map((video, index) => (
                    <li
                        key={`${video.id}-${index}`}
                        onClick={() => handleSelect(index)}
                        className={`cursor-pointer px-2 py-1 rounded ${index === currentIndex ? "bg-blue-500 text-white" : "bg-gray-100 text-black"
                            }`}
                    >
                        {video.title}
                    </li>
                ))}
            </ul>
        </div>
    );
}
