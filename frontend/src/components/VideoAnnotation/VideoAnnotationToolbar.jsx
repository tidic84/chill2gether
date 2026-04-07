import {
    Pen, Highlighter, Eraser, Undo2, Trash2, Pause, Play,
    UserCheck, UserX, Pencil, PencilOff
} from "lucide-react";
import { useSocket } from "../../contexts/SocketContext";

const COLORS = [
    { name: "Rouge", value: "#ef4444" },
    { name: "Bleu", value: "#3b82f6" },
    { name: "Vert", value: "#22c55e" },
    { name: "Jaune", value: "#eab308" },
    { name: "Blanc", value: "#ffffff" },
    { name: "Noir", value: "#000000" },
];

const LINE_WIDTHS = [2, 4, 6, 10];

export default function VideoAnnotationToolbar({
    roomId,
    tool,
    onToolChange,
    color,
    onColorChange,
    lineWidth,
    onLineWidthChange,
    onUndo,
    onClear,
    isVideoPaused,
    onTogglePause,
    annotationActive,
    onToggleAnnotation,
    isAdmin = false,
    users = [],
    drawPermissions = [],
}) {
    const socket = useSocket();

    const handleToggleDraw = (userId) => {
        if (drawPermissions.includes(userId)) {
            socket.emit('annotation:revoke-draw', { roomId, targetUserId: userId });
        } else {
            socket.emit('annotation:grant-draw', { roomId, targetUserId: userId });
        }
    };

    return (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-white/90 dark:bg-zen-dark-surface/90 backdrop-blur-sm rounded-xl border border-zen-border dark:border-zen-dark-border shadow-sm">
            {/* Toggle annotation mode */}
            {isAdmin && (
                <button
                    onClick={onToggleAnnotation}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition text-sm font-medium ${
                        annotationActive
                            ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
                    }`}
                    title={annotationActive ? "Désactiver annotations" : "Activer annotations"}
                >
                    {annotationActive ? <Pencil size={16} /> : <PencilOff size={16} />}
                    <span className="hidden sm:inline">
                        {annotationActive ? "Annotations ON" : "Annotations OFF"}
                    </span>
                </button>
            )}

            {/* Separator */}
            <div className="h-6 w-px bg-zen-warm-stone dark:bg-zen-dark-border" />

            {/* Play/Pause */}
            <button
                onClick={onTogglePause}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition text-sm font-medium ${
                    isVideoPaused
                        ? 'bg-green-50 text-green-700 hover:bg-green-100'
                        : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                }`}
                title={isVideoPaused ? "Reprendre la vidéo" : "Mettre en pause"}
            >
                {isVideoPaused ? <Play size={16} /> : <Pause size={16} />}
                <span className="hidden sm:inline">
                    {isVideoPaused ? "Reprendre" : "Pause"}
                </span>
            </button>

            {annotationActive && (
                <>
                    {/* Separator */}
                    <div className="h-6 w-px bg-zen-warm-stone dark:bg-zen-dark-border" />

                    {/* Drawing tools */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => onToolChange('pen')}
                            className={`p-2 rounded-lg transition ${
                                tool === 'pen'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
                            }`}
                            title="Stylo"
                        >
                            <Pen size={16} />
                        </button>
                        <button
                            onClick={() => onToolChange('highlighter')}
                            className={`p-2 rounded-lg transition ${
                                tool === 'highlighter'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
                            }`}
                            title="Surligneur"
                        >
                            <Highlighter size={16} />
                        </button>
                        <button
                            onClick={() => onToolChange('eraser')}
                            className={`p-2 rounded-lg transition ${
                                tool === 'eraser'
                                    ? 'bg-red-100 text-red-700'
                                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
                            }`}
                            title="Gomme"
                        >
                            <Eraser size={16} />
                        </button>
                    </div>

                    {/* Separator */}
                    <div className="h-6 w-px bg-zen-warm-stone dark:bg-zen-dark-border" />

                    {/* Colors */}
                    <div className="flex items-center gap-1">
                        {COLORS.map((c) => (
                            <button
                                key={c.value}
                                onClick={() => onColorChange(c.value)}
                                className={`w-6 h-6 rounded-full border-2 transition ${
                                    color === c.value
                                        ? 'border-blue-500 scale-110'
                                        : 'border-gray-300 dark:border-gray-600 hover:scale-105'
                                }`}
                                style={{ backgroundColor: c.value }}
                                title={c.name}
                            />
                        ))}
                    </div>

                    {/* Separator */}
                    <div className="h-6 w-px bg-zen-warm-stone dark:bg-zen-dark-border" />

                    {/* Line width */}
                    <div className="flex items-center gap-1">
                        {LINE_WIDTHS.map((w) => (
                            <button
                                key={w}
                                onClick={() => onLineWidthChange(w)}
                                className={`flex items-center justify-center w-8 h-8 rounded-lg transition ${
                                    lineWidth === w
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
                                }`}
                                title={`Épaisseur ${w}px`}
                            >
                                <div
                                    className="rounded-full bg-current"
                                    style={{ width: w + 2, height: w + 2 }}
                                />
                            </button>
                        ))}
                    </div>

                    {/* Separator */}
                    <div className="h-6 w-px bg-zen-warm-stone dark:bg-zen-dark-border" />

                    {/* Undo & Clear */}
                    <button
                        onClick={onUndo}
                        className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition text-sm font-medium"
                        title="Annuler"
                    >
                        <Undo2 size={16} />
                    </button>

                    {isAdmin && (
                        <button
                            onClick={onClear}
                            className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition text-sm font-medium"
                            title="Tout effacer"
                        >
                            <Trash2 size={16} />
                            <span className="hidden sm:inline">Effacer</span>
                        </button>
                    )}

                    {/* Separator for user permissions */}
                    {isAdmin && users.length > 0 && (
                        <>
                            <div className="h-6 w-px bg-zen-warm-stone dark:bg-zen-dark-border" />
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
                                                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-400'
                                            }`}
                                            title={canDraw ? `Révoquer ${user.username}` : `Autoriser ${user.username}`}
                                        >
                                            {canDraw ? <UserCheck size={14} /> : <UserX size={14} />}
                                            {user.username}
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
}
