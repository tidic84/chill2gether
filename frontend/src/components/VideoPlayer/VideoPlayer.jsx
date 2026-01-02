import { useRef, useEffect, useState } from "react";
import { useSocket } from "../../contexts/SocketContext";
import { useParams } from "react-router-dom";

/**
 * Extrait l'ID YouTube de différents formats d'URL
 */
function extractYouTubeID(url) {
    if (!url) return null;

    // S'assurer que url est une string
    if (typeof url !== 'string') {
        console.warn('extractYouTubeID: url doit être une string, reçu:', typeof url, url);
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

    const [isReady, setIsReady] = useState(false);
    const isLocalActionRef = useRef(false);
    const onEndedRef = useRef(onEnded);
    const hasSyncedRef = useRef(false);
    const ignoreNextPlayRef = useRef(false);

    const videoId = extractYouTubeID(url);

    // Mettre à jour la ref onEnded
    useEffect(() => {
        onEndedRef.current = onEnded;
    }, [onEnded]);

    // Initialiser l'API YouTube IFrame UNE SEULE FOIS
    useEffect(() => {
        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        }
    }, []);

    // Créer le player UNE SEULE FOIS au premier videoId
    useEffect(() => {
        // Pas de vidéo = attendre
        if (!videoId) {
            return;
        }

        // Player déjà créé = ne rien faire
        if (playerRef.current) {
            return;
        }

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

            console.log("Création du player avec vidéo:", videoId);
            ignoreNextPlayRef.current = true; //Ignorer le premier play automatique

            try {
                playerRef.current = new window.YT.Player('youtube-player', {
                    videoId: videoId,
                    width: '100%',
                    height: '100%',
                    playerVars: {
                        autoplay: autoplay ? 1 : 0,
                        controls: 1,
                        modestbranding: 1,
                        rel: 0,
                        fs: 1,
                        iv_load_policy: 3
                    },
                    events: {
                        onReady: (event) => {
                            console.log("Player prêt");
                            playerReadyRef.current = true;
                            loadedVideoIdRef.current = videoId;
                            setIsReady(true);

                            // Demander la sync au backend
                            if (!hasSyncedRef.current && roomId) {
                                setTimeout(() => {
                                    console.log("Demande de synchronisation au backend...");
                                    socket.emit('request-sync', roomId);
                                }, 500); // Petit délai pour laisser le player s'initialiser
                            }
                        },
                        onStateChange: (event) => {
                            // Vidéo terminée
                            if (event.data === 0) {
                                console.log("Vidéo terminée");
                                if (onEndedRef.current) {
                                    onEndedRef.current();
                                }
                            }

                            //Ignorer le premier play automatique
                            if (!isLocalActionRef.current) {
                                if (event.data === 1) {
                                    if (ignoreNextPlayRef.current) {
                                        console.log("Premier play ignoré (chargement initial)");
                                        ignoreNextPlayRef.current = false;
                                        return;
                                    }

                                    socket.emit("video-play", {
                                        roomId,
                                        time: event.target.getCurrentTime()
                                    });
                                } else if (event.data === 2) {
                                    socket.emit("video-pause", {
                                        roomId,
                                        time: event.target.getCurrentTime()
                                    });
                                }
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
    }, [videoId, autoplay, roomId, socket]); // Se déclenche quand videoId change, mais ne crée qu'une fois

    // Cleanup au démontage du composant
    useEffect(() => {
        return () => {
            if (playerRef.current) {
                try {
                    console.log("Destruction du player au démontage");
                    playerRef.current.destroy();
                } catch (e) {
                    console.warn("Erreur cleanup:", e);
                } finally {
                    playerRef.current = null;
                    playerReadyRef.current = false;
                    loadedVideoIdRef.current = null;
                    hasSyncedRef.current = false;
                }
            }
        };
    }, []); // Dépendances vides = cleanup seulement au démontage

    //Écouter la réponse de synchronisation
    useEffect(() => {
        if (!socket) return;

        const handleSyncResponse = (data) => {
            console.log("Réponse de sync reçue:", data);

            // Ne pas synchroniser si déjà fait
            if (hasSyncedRef.current) {
                console.log("Déjà synchronisé, ignorer");
                return;
            }

            // Synchroniser seulement si une vidéo est en cours de lecture
            if (playerRef.current && playerReadyRef.current && data.hasVideo && data.isPlaying) {
                const currentTime = data.currentTime;
                console.log("Synchronisation au temps:", currentTime, "secondes");

                isLocalActionRef.current = true;
                playerRef.current.seekTo(currentTime, true);

                setTimeout(() => {
                    isLocalActionRef.current = false;
                }, 100);

                hasSyncedRef.current = true;
            } else if (data.hasVideo && !data.isPlaying) {
                console.log("Vidéo en pause, pas de synchronisation automatique");
                hasSyncedRef.current = true;
            }
        };

        socket.on("sync-response", handleSyncResponse);

        return () => {
            socket.off("sync-response", handleSyncResponse);
        };
    }, [socket]);

    // Charger une nouvelle vidéo quand videoId change
    useEffect(() => {
        if (!playerReadyRef.current || !playerRef.current) {
            return;
        }

        // Si pas de vidéo, stopper le player et le masquer
        if (!videoId) {
            console.log("Arrêt du player - playlist vide");
            try {
                playerRef.current.stopVideo();
                loadedVideoIdRef.current = null;
            } catch (error) {
                console.warn("Erreur arrêt vidéo:", error);
            }
            return;
        }

        // Ne pas recharger si c'est déjà la vidéo en cours
        if (loadedVideoIdRef.current === videoId) {
            return;
        }

        console.log("Chargement nouvelle vidéo:", videoId, "autoplay:", autoplay);

        try {
            if (autoplay) {
                playerRef.current.loadVideoById({
                    videoId: videoId,
                    startSeconds: 0
                });
            } else {
                playerRef.current.cueVideoById({
                    videoId: videoId,
                    startSeconds: 0
                });
            }
            loadedVideoIdRef.current = videoId;
        } catch (error) {
            console.error("Erreur chargement vidéo:", error);
        }
    }, [videoId, autoplay]); // Se déclenche à chaque changement de vidéo

    // Écouter les événements de synchronisation
    useEffect(() => {
        if (!socket) return;

        const handlePlaySync = ({ time }) => {
            if (playerRef.current && playerRef.current.playVideo) {
                console.log("Sync play reçu:", time);
                isLocalActionRef.current = true;
                playerRef.current.seekTo(time, true);
                playerRef.current.playVideo();
                setTimeout(() => {
                    isLocalActionRef.current = false;
                }, 100);
            }
        };

        const handlePauseSync = ({ time }) => {
            if (playerRef.current && playerRef.current.pauseVideo) {
                console.log("Sync pause reçu:", time);
                isLocalActionRef.current = true;
                playerRef.current.seekTo(time, true);
                playerRef.current.pauseVideo();
                setTimeout(() => {
                    isLocalActionRef.current = false;
                }, 100);
            }
        };

        const handleSeekSync = ({ time }) => {
            if (playerRef.current && playerRef.current.seekTo) {
                console.log("Sync seek reçu:", time);
                isLocalActionRef.current = true;
                playerRef.current.seekTo(time, true);
                setTimeout(() => {
                    isLocalActionRef.current = false;
                }, 100);
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
            {/* Message quand aucune vidéo */}
            {!url && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-20">
                    <div className="text-6xl mb-4"></div>
                    <p className="text-xl font-semibold">Aucune vidéo sélectionnée</p>
                    <p className="text-sm text-gray-400 mt-2">
                        Recherchez une vidéo pour commencer
                    </p>
                </div>
            )}

            {/* Message d'erreur si URL invalide */}
            {url && !videoId && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-20">
                    <div className="text-6xl mb-4"></div>
                    <p className="text-xl font-semibold">URL YouTube invalide</p>
                    <p className="text-sm text-red-400 mt-2 px-4 text-center max-w-md">
                        Impossible d'extraire l'ID de: {url}
                    </p>
                </div>
            )}

            {/* Loader pendant le chargement */}
            {videoId && !isReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <p className="text-white">Chargement de la vidéo...</p>
                    </div>
                </div>
            )}

            {/* Player YouTube wrapper - gère la visibilité sans toucher au player */}
            <div
                className="absolute inset-0"
                style={{ visibility: videoId ? 'visible' : 'hidden' }}
            >
                <div
                    id="youtube-player"
                    className="w-full h-full"
                />
            </div>
        </div>
    );
}