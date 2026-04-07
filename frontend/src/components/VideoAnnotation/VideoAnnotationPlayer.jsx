import { useRef, useState, useEffect, useCallback } from "react";
import VideoPlayer from "../VideoPlayer/VideoPlayer";
import VideoAnnotationCanvas from "./VideoAnnotationCanvas";
import VideoAnnotationToolbar from "./VideoAnnotationToolbar";
import { useSocket } from "../../contexts/SocketContext";

/**
 * Lecteur vidéo avec surcouche d'annotations.
 * Combine le VideoPlayer YouTube + un canvas d'annotation + la toolbar de contrôle.
 */
export default function VideoAnnotationPlayer({
    url,
    onEnded,
    autoplay,
    roomId,
    userRole = 'student',
    currentUserId,
    users = [],
}) {
    const socket = useSocket();
    const canvasRef = useRef(null);

    // Annotation state
    const [annotationActive, setAnnotationActive] = useState(false);
    const [drawPermissions, setDrawPermissions] = useState([]);
    const [tool, setTool] = useState('pen');
    const [color, setColor] = useState('#ef4444');
    const [lineWidth, setLineWidth] = useState(4);
    const [isVideoPaused, setIsVideoPaused] = useState(false);

    const isAdmin = userRole === 'admin';
    const canDraw = isAdmin || drawPermissions.includes(currentUserId);

    // Listen for annotation toggle from server
    useEffect(() => {
        const handleToggled = ({ active }) => {
            setAnnotationActive(active);
        };
        const handlePermissions = ({ drawPermissions: perms }) => {
            setDrawPermissions(perms || []);
        };

        socket.on('annotation:toggled', handleToggled);
        socket.on('annotation:permissions-changed', handlePermissions);

        return () => {
            socket.off('annotation:toggled', handleToggled);
            socket.off('annotation:permissions-changed', handlePermissions);
        };
    }, [socket]);

    // Toggle annotation mode (admin only)
    const handleToggleAnnotation = useCallback(() => {
        const newActive = !annotationActive;
        socket.emit('annotation:toggle', { roomId, active: newActive });
    }, [socket, roomId, annotationActive]);

    // Clear all annotations
    const handleClear = useCallback(() => {
        socket.emit('annotation:clear', roomId);
        if (canvasRef.current) canvasRef.current.clearCanvas();
    }, [socket, roomId]);

    // Undo last stroke
    const handleUndo = useCallback(() => {
        if (canvasRef.current) canvasRef.current.undoLast();
    }, []);

    // Pause/Play video via YouTube API through socket
    const handleTogglePause = useCallback(() => {
        if (isVideoPaused) {
            // Resume
            socket.emit("video-play", { roomId, time: null });
            setIsVideoPaused(false);
        } else {
            // Pause
            socket.emit("video-pause", { roomId, time: null });
            setIsVideoPaused(true);
        }
    }, [isVideoPaused, socket, roomId]);

    // Sync pause state from remote events
    useEffect(() => {
        const handlePlaySync = () => setIsVideoPaused(false);
        const handlePauseSync = () => setIsVideoPaused(true);

        socket.on('video-play-sync', handlePlaySync);
        socket.on('video-pause-sync', handlePauseSync);

        return () => {
            socket.off('video-play-sync', handlePlaySync);
            socket.off('video-pause-sync', handlePauseSync);
        };
    }, [socket]);

    return (
        <div className="flex flex-col gap-4">
            {/* Toolbar */}
            <VideoAnnotationToolbar
                roomId={roomId}
                tool={tool}
                onToolChange={setTool}
                color={color}
                onColorChange={setColor}
                lineWidth={lineWidth}
                onLineWidthChange={setLineWidth}
                onUndo={handleUndo}
                onClear={handleClear}
                isVideoPaused={isVideoPaused}
                onTogglePause={handleTogglePause}
                annotationActive={annotationActive}
                onToggleAnnotation={handleToggleAnnotation}
                isAdmin={isAdmin}
                users={users.filter(u => u.userId !== currentUserId)}
                drawPermissions={drawPermissions}
            />

            {/* Video + Canvas overlay */}
            <div className="bg-white dark:bg-zen-dark-surface p-2 rounded-2xl shadow-sm border border-zen-border dark:border-zen-dark-border">
                <div className="w-full aspect-video bg-black rounded-xl overflow-hidden relative">
                    <VideoPlayer
                        url={url}
                        onEnded={onEnded}
                        autoplay={autoplay}
                    />
                    <VideoAnnotationCanvas
                        ref={canvasRef}
                        roomId={roomId}
                        canDraw={canDraw}
                        tool={tool}
                        color={color}
                        lineWidth={lineWidth}
                        active={annotationActive}
                    />
                    {/* Annotation mode indicator */}
                    {annotationActive && (
                        <div className="absolute top-3 right-3 z-40 flex items-center gap-2 px-3 py-1.5 bg-purple-600/80 text-white text-xs font-medium rounded-full backdrop-blur-sm pointer-events-none">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                            </span>
                            Annotations actives
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
