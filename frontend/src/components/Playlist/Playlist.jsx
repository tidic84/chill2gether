import { useSocket } from "../../contexts/SocketContext";

export default function Playlist({ videos, currentIndex, roomId, onPlayVideo }) {
    const socket = useSocket();

    const handleSelectVideo = (index) => {
        console.log("🎵 Sélection vidéo:", index);
        onPlayVideo(index);
    };

    const handleDeleteVideo = (videoId, e) => {
        e.stopPropagation();
        console.log("🗑️ Suppression vidéo:", videoId);
        
        socket.emit('remove-from-playlist', {
            roomId,
            videoId
        });
    };

    return (
        <div className="h-full overflow-y-auto">
            <div className="space-y-3">
                {videos.length === 0 && (
                    <div className="text-center p-8">
                        <div className="text-6xl mb-4">🎵</div>
                        <p className="text-gray-500 font-medium">
                            Aucune vidéo dans la playlist
                        </p>
                        <p className="text-gray-400 text-sm mt-2">
                            Recherchez-en une pour commencer !
                        </p>
                    </div>
                )}

                {videos.map((video, index) => {
                    const isCurrentVideo = index === currentIndex;
                    
                    return (
                        <div
                            key={video.id}
                            onClick={() => handleSelectVideo(index)}
                            className={`
                                flex items-center p-2 rounded cursor-pointer transition-all
                                ${isCurrentVideo 
                                    ? 'bg-blue-500 text-white shadow-lg scale-105' 
                                    : 'bg-gray-100 hover:bg-gray-200 hover:shadow'
                                }
                            `}
                        >
                            {/* Thumbnail */}
                            <div className="relative">
                                <img
                                    src={video.thumbnail || 'placeholder.jpg'}
                                    alt={video.title}
                                    className="w-24 h-16 rounded mr-3 object-cover"
                                />
                                {isCurrentVideo && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded">
                                        <span className="text-2xl">▶️</span>
                                    </div>
                                )}
                            </div>

                            {/* Titre et infos */}
                            <div className="flex-1 min-w-0">
                                <p className={`font-medium truncate ${isCurrentVideo ? 'text-white' : 'text-gray-800'}`}>
                                    {video.title}
                                </p>
                                <p className={`text-xs mt-1 ${isCurrentVideo ? 'text-blue-100' : 'text-gray-500'}`}>
                                    Ajouté par {video.addedBy?.username || 'Anonyme'}
                                </p>
                            </div>

                            {/* Indicateur + bouton supprimer */}
                            <div className="flex items-center gap-2">
                                {isCurrentVideo && (
                                    <div className="px-2 py-1 bg-white/20 rounded text-xs font-semibold">
                                        En cours
                                    </div>
                                )}
                                
                                <button
                                    onClick={(e) => handleDeleteVideo(video.id, e)}
                                    className={`
                                        px-2 py-1 rounded transition
                                        ${isCurrentVideo 
                                            ? 'text-white hover:bg-white/20' 
                                            : 'text-red-500 hover:bg-red-100'
                                        }
                                    `}
                                    title="Supprimer"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}