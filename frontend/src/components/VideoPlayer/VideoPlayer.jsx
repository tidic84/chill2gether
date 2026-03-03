import { useRef, useEffect, useState } from "react";
import { useSocket } from "../../contexts/SocketContext";
import { useParams } from "react-router-dom";
import { usePermissions } from "../../contexts/SocketContext";

/**
 * Extrait l'ID YouTube de différents formats d'URL
 */
function extractYouTubeID(url) {
    if (!url) return null;

    if (typeof url !== 'string') {
        return null;
    }

    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
        return url;
    }

    const match1 = url.match(/[?&]v=([^&]+)/);
    if (match1) return match1[1];

    const match2 = url.match(/youtu\.be\/([^?]+)/);
    if (match2) return match2[1];

    const match3 = url.match(/embed\/([^?]+)/);
    if (match3) return match3[1];

    return null;
}

export default function VideoPlayer({ url, onEnded, autoplay = true }) {
    const playerRef = useRef(null);
    const playerReadyRef = useRef(false);
    const loadedVideoIdRef = useRef(null);
    const socket = useSocket();
    const { roomId } = useParams();
    const permissions = usePermissions();

    const canInteractVideo = permissions?.interactionVideo !== false;

    const [isReady, setIsReady] = useState(false);
    
    const isRemoteSyncRef = useRef(false);
    const syncTimeoutRef = useRef(null);
    
    const onEndedRef = useRef(onEnded);
    const hasSyncedRef = useRef(false);
    const ignoreNextPlayRef = useRef(false);

    const videoId = extractYouTubeID(url);

    useEffect(() => {
        onEndedRef.current = onEnded;
    }, [onEnded]);

    useEffect(() => {
        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        }
    }, []);

    useEffect(() => {
        if (!videoId) return;
        if (playerRef.current) return;

        const initPlayer = () => {
            if (!window.YT || !window.YT.Player) {
                setTimeout(initPlayer, 500);
                return;
            }

            const container = document.getElementById('youtube-player');
            if (!container) {
                setTimeout(initPlayer, 500);
                return;
            }

            ignoreNextPlayRef.current = true;

            try {
                playerRef.current = new window.YT.Player('youtube-player', {
                    videoId: videoId,
                    width: '100%',
                    height: '100%',
                    playerVars: {
                        autoplay: autoplay ? 1 : 0,
                        controls: canInteractVideo ? 1 : 0,
                        modestbranding: 1,
                        rel: 0,
                        fs: canInteractVideo ? 1 : 0,
                        iv_load_policy: 3
                    },
                    events: {
                        onReady: (event) => {
                            playerReadyRef.current = true;
                            loadedVideoIdRef.current = videoId;
                            setIsReady(true);

                            if (!hasSyncedRef.current && roomId) {
                                setTimeout(() => {
                                    socket.emit('request-sync', roomId);
                                }, 500);
                            }
                        },
                        onStateChange: (event) => {
                            if (event.data === 0) {
                                if (onEndedRef.current) {
                                    onEndedRef.current();
                                }
                                return;
                            }

                            if (event.data === 3) return;

                            if (isRemoteSyncRef.current) {
                                return;
                            }

                            if (event.data === 1 && ignoreNextPlayRef.current) {
                                ignoreNextPlayRef.current = false;
                                return;
                            }

                            if (event.data === 1) {
                                if (!canInteractVideo) return;
                                socket.emit("video-play", {
                                    roomId,
                                    time: event.target.getCurrentTime()
                                });
                            } else if (event.data === 2) {
                                if (!canInteractVideo) return;
                                socket.emit("video-pause", {
                                    roomId,
                                    time: event.target.getCurrentTime()
                                });
                            }
                        },
                        onError: (event) => {
                            const errors = {
                                2: 'Requête invalide',
                                5: 'Erreur HTML5',
                                100: 'Vidéo introuvable',
                                101: 'Vidéo non disponible en embed',
                                150: 'Vidéo non disponible en embed'
                            };
                            console.error("Erreur YouTube:", errors[event.data] || event.data);
                        }
                    }
                });
            } catch (error) {
                console.error("Erreur création player:", error);
            }
        };

        initPlayer();
    }, [videoId, autoplay, roomId, socket, canInteractVideo]);

    useEffect(() => {
        return () => {
            if (syncTimeoutRef.current) {
                clearTimeout(syncTimeoutRef.current);
            }
            if (playerRef.current) {
                try {
                    playerRef.current.destroy();
                } catch (e) {
                    // Ignore cleanup errors
                } finally {
                    playerRef.current = null;
                    playerReadyRef.current = false;
                    loadedVideoIdRef.current = null;
                    hasSyncedRef.current = false;
                }
            }
        };
    }, []);

    useEffect(() => {
        if (!socket) return;

        const handleSyncResponse = (data) => {
            if (playerRef.current && playerReadyRef.current && data.hasVideo && data.isPlaying) {
                isRemoteSyncRef.current = true;
                playerRef.current.seekTo(data.currentTime, true);
                setTimeout(() => { isRemoteSyncRef.current = false; }, 500);
                hasSyncedRef.current = true;
            } else if (data.hasVideo && !data.isPlaying) {
                hasSyncedRef.current = true;
            }
        };

        socket.on("sync-response", handleSyncResponse);
        return () => socket.off("sync-response", handleSyncResponse);
    }, [socket]);

    useEffect(() => {
        if (!playerReadyRef.current || !playerRef.current) return;

        if (!videoId) {
            try {
                playerRef.current.stopVideo();
                loadedVideoIdRef.current = null;
            } catch (error) {
                // Ignore errors
            }
            return;
        }

        if (loadedVideoIdRef.current === videoId) return;

        try {
            if (autoplay) {
                playerRef.current.loadVideoById({ videoId, startSeconds: 0 });
            } else {
                playerRef.current.cueVideoById({ videoId, startSeconds: 0 });
            }
            loadedVideoIdRef.current = videoId;
        } catch (error) {
            console.error("Erreur chargement vidéo:", error);
        }
    }, [videoId, autoplay]);

    useEffect(() => {
        if (!socket || !roomId) return;

        const setSyncFlag = () => {
            if (syncTimeoutRef.current) {
                clearTimeout(syncTimeoutRef.current);
            }
            isRemoteSyncRef.current = true;
            syncTimeoutRef.current = setTimeout(() => { 
                isRemoteSyncRef.current = false; 
                syncTimeoutRef.current = null;
            }, 800);
        };

        const handlePlaySync = ({ time }) => {
            if (playerRef.current?.playVideo) {
                setSyncFlag();
                playerRef.current.seekTo(time, true);
                playerRef.current.playVideo();
            }
        };

        const handlePauseSync = ({ time }) => {
            if (playerRef.current?.pauseVideo) {
                setSyncFlag();
                playerRef.current.seekTo(time, true);
                playerRef.current.pauseVideo();
            }
        };

        const handleSeekSync = ({ time }) => {
            if (playerRef.current?.seekTo) {
                setSyncFlag();
                playerRef.current.seekTo(time, true);
            }
        };

        socket.on("video-play-sync", handlePlaySync);
        socket.on("video-pause-sync", handlePauseSync);
        socket.on("video-seek-sync", handleSeekSync);

        return () => {
            socket.off("video-play-sync", handlePlaySync);
            socket.off("video-pause-sync", handlePauseSync);
            socket.off("video-seek-sync", handleSeekSync);
        };
    }, [socket, roomId]);

    return (
        <div className="w-full h-full bg-black relative">
            {!url && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-20">
                    <p className="text-xl font-semibold">Aucune vidéo sélectionnée</p>
                    <p className="text-sm text-gray-400 mt-2">Recherchez une vidéo pour commencer</p>
                </div>
            )}

            {url && !videoId && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-20">
                    <p className="text-xl font-semibold">URL YouTube invalide</p>
                </div>
            )}

            {videoId && !isReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            )}

            <div className="absolute inset-0" style={{ visibility: videoId ? 'visible' : 'hidden' }}>
                <div id="youtube-player" className="w-full h-full" />
            </div>

            {url && videoId && !canInteractVideo && (
                <div className="absolute inset-0 z-40 cursor-not-allowed" />
            )}
        </div>
    );
}