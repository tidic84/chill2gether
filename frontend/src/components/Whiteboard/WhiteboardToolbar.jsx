import { Trash2, UserCheck, UserX, Monitor } from "lucide-react";
import { useSocket } from "../../contexts/SocketContext";

export default function WhiteboardToolbar({
    roomId,
    users = [],
    drawPermissions = [],
    onScreenShare,
    isScreenSharing = false,
}) {
    const socket = useSocket();

    const handleClear = () => {
        socket.emit('wb:clear', roomId);
    };

    const handleToggleDraw = (userId) => {
        if (drawPermissions.includes(userId)) {
            socket.emit('wb:revoke-draw', { roomId, targetUserId: userId });
        } else {
            socket.emit('wb:grant-draw', { roomId, targetUserId: userId });
        }
    };

    return (
        <div className="flex items-center gap-3 p-3 bg-white/90 backdrop-blur-sm rounded-xl border border-zen-warm-stone shadow-sm">
            {/* Clear button */}
            <button
                onClick={handleClear}
                className="flex items-center gap-2 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition text-sm font-medium"
                title="Effacer le tableau"
            >
                <Trash2 size={16} />
                <span className="hidden sm:inline">Effacer</span>
            </button>

            {/* Screen share toggle */}
            <button
                onClick={onScreenShare}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition text-sm font-medium ${
                    isScreenSharing
                        ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
                title={isScreenSharing ? "Arrêter le partage" : "Partager l'écran"}
            >
                <Monitor size={16} />
                <span className="hidden sm:inline">
                    {isScreenSharing ? "Arrêter" : "Partager"}
                </span>
            </button>

            {/* Separator */}
            <div className="h-6 w-px bg-zen-warm-stone" />

            {/* User permission toggles */}
            <div className="flex items-center gap-1 overflow-x-auto">
                {users.map((user) => {
                    const canDraw = drawPermissions.includes(user.userId);
                    return (
                        <button
                            key={user.userId}
                            onClick={() => handleToggleDraw(user.userId)}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition text-xs font-medium whitespace-nowrap ${
                                canDraw
                                    ? 'bg-green-50 text-green-700 hover:bg-green-100'
                                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                            }`}
                            title={canDraw ? `Révoquer ${user.username}` : `Autoriser ${user.username}`}
                        >
                            {canDraw ? <UserCheck size={14} /> : <UserX size={14} />}
                            {user.username}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
