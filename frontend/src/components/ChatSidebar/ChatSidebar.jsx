// src/components/ChatSidebar/ChatSidebar.jsx
import { useState } from "react";

export default function ChatSidebar({ chat, playlist, history }) {
    const [activeOverlay, setActiveOverlay] = useState(null); // 'playlist' | 'history' | null

    return (
        <div className="relative w-full h-full bg-gray-900 text-gray-100 rounded-3xl shadow-lg overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex w-full">
                <button
                    onClick={() =>
                        setActiveOverlay((prev) => (prev === "playlist" ? null : "playlist"))
                    }
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${activeOverlay === "playlist"
                        ? "bg-gray-700"
                        : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                        }`}
                >
                    Playlist
                </button>

                <button
                    onClick={() =>
                        setActiveOverlay((prev) => (prev === "history" ? null : "history"))
                    }
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${activeOverlay === "history"
                        ? "bg-gray-700"
                        : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                        }`}
                >
                    Historique
                </button>
            </div>


            {/* Contenu principal */}
            <div className="flex-1 relative overflow-hidden">
                {/* Overlay (playlist ou history) */}
                <div
                    className={`absolute top-0 left-0 w-full transition-all duration-300 ease-in-out ${activeOverlay ? "h-1/2 opacity-100" : "h-0 opacity-0 pointer-events-none"
                        }`}
                >
                    <div className="h-full overflow-y-auto p-3 bg-gray-700">
                        {activeOverlay === "playlist" ? playlist : activeOverlay === "history" ? history : null}
                    </div>
                </div>

                {/* Chat (toujours visible, en dessous de l’overlay) */}
                <div
                    className={`absolute bottom-0 left-0 w-full transition-all duration-300 ease-in-out ${activeOverlay ? "h-1/2" : "h-full"
                        }`}
                >
                    {chat}
                </div>
            </div>
        </div>
    );
}
