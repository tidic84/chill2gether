import React, { useRef, useEffect, useState } from "react";
import ReactPlayer from "react-player";
import { useSocket } from "../../contexts/SocketContext";

export default function VideoPlayer({ url, roomId }) {
    const playerRef = useRef(null);
    const socket = useSocket();
    const isSyncing = useRef(false); // Flag pour éviter les boucles infinies
    const currentTime = useRef(0); // Stocke le temps actuel de la vidéo
    const [isReady, setIsReady] = useState(false); // Player prêt
    const [videoState, setVideoState] = useState({
        url: url,
        playing: false,
        time: 0
    });

    console.log("VideoPlayer URL:", url, "RoomID:", roomId);

    // Quand le player est prêt
    const handleReady = () => {
        console.log("✅ Player is ready");
        setIsReady(true);
    };

    // Fonction helper pour faire un seekTo de manière sécurisée
    const safeSeekTo = (time) => {
        if (!playerRef.current) {
            console.warn("⚠️ Cannot seek: player ref is null");
            return false;
        }

        try {
            console.log(`🎯 Seeking to ${time} seconds`);

            // Pour YouTube, utiliser l'API interne
            if (playerRef.current.api && playerRef.current.api.seekTo) {
                playerRef.current.api.seekTo(time, true);
                console.log("✅ Using YouTube API seekTo");
            }
            // Sinon, utiliser l'API standard ReactPlayer
            else if (playerRef.current.seekTo) {
                playerRef.current.seekTo(time, "seconds");
                console.log("✅ Using ReactPlayer seekTo");
            }
            else {
                console.warn("⚠️ No seekTo method available");
                return false;
            }

            currentTime.current = time;
            return true;
        } catch (error) {
            console.error("❌ Error during seekTo:", error);
            return false;
        }
    };

    // Tracker le temps actuel de la vidéo
    const handleProgress = (state) => {
        if (!isSyncing.current) {
            currentTime.current = state.playedSeconds;
        }
    };

    // Fonction pour obtenir le temps actuel de la vidéo
    const getCurrentVideoTime = () => {
        // Essayer d'abord l'API YouTube
        if (playerRef.current?.api?.getCurrentTime) {
            const time = playerRef.current.api.getCurrentTime();
            console.log("🕐 Getting current time from YouTube API:", time);
            return time;
        }
        // Sinon utiliser la valeur trackée
        console.log("🕐 Getting current time from ref:", currentTime.current);
        return currentTime.current;
    };

    // Événements locaux -> serveur
    const handlePlay = () => {
        if (isSyncing.current) {
            console.log("🔄 Ignoring play event (syncing)");
            return;
        }

        const time = getCurrentVideoTime();
        console.log("▶️ Émission video:play", { roomId, url, time });
        socket.emit("video:play", { roomId, url, time });
    };

    const handlePause = () => {
        if (isSyncing.current) {
            console.log("🔄 Ignoring pause event (syncing)");
            return;
        }

        const time = getCurrentVideoTime();
        console.log("⏸️ Émission video:pause", { roomId, time });
        socket.emit("video:pause", { roomId, time });
    };

    const handleSeek = (seconds) => {
        if (isSyncing.current) {
            console.log("🔄 Ignoring seek event (syncing)");
            return;
        }

        console.log("⏩ Émission video:seek", { roomId, time: seconds });
        socket.emit("video:seek", { roomId, time: seconds });
    };

    // Écoute des événements venant du serveur
    useEffect(() => {
        const handleRemotePlay = ({ url: newUrl, time }) => {
            console.log("📥 Réception video:play", { newUrl, time });

            isSyncing.current = true;
            console.log("🎬 Setting video state to playing");

            // Mettre à jour l'état (cela déclenchera le rendu avec playing=true)
            setVideoState({ url: newUrl, time, playing: true });

            // Attendre que le state soit mis à jour, puis faire le seek
            setTimeout(() => {
                if (safeSeekTo(time)) {
                    // Forcer le play si on utilise l'API YouTube
                    if (playerRef.current?.api?.playVideo) {
                        playerRef.current.api.playVideo();
                        console.log("🎬 Forcing YouTube playVideo");
                    }
                    console.log("✅ Play sync successful");
                } else {
                    console.warn("⚠️ Play sync failed, retrying...");
                    // Retry après 500ms si le player n'est pas prêt
                    setTimeout(() => {
                        safeSeekTo(time);
                        if (playerRef.current?.api?.playVideo) {
                            playerRef.current.api.playVideo();
                        }
                    }, 500);
                }

                // Autoriser à nouveau les événements locaux
                setTimeout(() => {
                    isSyncing.current = false;
                }, 500);
            }, 100);
        };

        const handleRemotePause = ({ time }) => {
            console.log("📥 Réception video:pause", { time });

            isSyncing.current = true;
            console.log("⏸️ Setting video state to paused");

            // Mettre à jour l'état (cela déclenchera le rendu avec playing=false)
            setVideoState((prev) => ({ ...prev, time, playing: false }));

            // Attendre que le state soit mis à jour, puis faire le seek
            setTimeout(() => {
                if (safeSeekTo(time)) {
                    // Forcer la pause si on utilise l'API YouTube
                    if (playerRef.current?.api?.pauseVideo) {
                        playerRef.current.api.pauseVideo();
                        console.log("⏸️ Forcing YouTube pauseVideo");
                    }
                    console.log("✅ Pause sync successful");
                } else {
                    console.warn("⚠️ Pause sync failed, retrying...");
                    setTimeout(() => {
                        safeSeekTo(time);
                        if (playerRef.current?.api?.pauseVideo) {
                            playerRef.current.api.pauseVideo();
                        }
                    }, 500);
                }

                setTimeout(() => {
                    isSyncing.current = false;
                }, 500);
            }, 100);
        };

        const handleRemoteSeek = ({ time }) => {
            console.log("📥 Réception video:seek", { time });

            isSyncing.current = true;
            console.log("⏩ Seeking to", time);

            setVideoState((prev) => ({ ...prev, time }));

            setTimeout(() => {
                if (safeSeekTo(time)) {
                    console.log("✅ Seek sync successful");
                } else {
                    console.warn("⚠️ Seek sync failed, retrying...");
                    setTimeout(() => safeSeekTo(time), 500);
                }

                setTimeout(() => {
                    isSyncing.current = false;
                }, 500);
            }, 100);
        };

        console.log("🔌 Setting up socket listeners for roomId:", roomId);
        socket.on("video:play", handleRemotePlay);
        socket.on("video:pause", handleRemotePause);
        socket.on("video:seek", handleRemoteSeek);

        return () => {
            console.log("🔌 Cleaning up socket listeners");
            socket.off("video:play", handleRemotePlay);
            socket.off("video:pause", handleRemotePause);
            socket.off("video:seek", handleRemoteSeek);
        };
    }, [socket, roomId]);

    // Mettre à jour l'URL si elle change depuis les props
    useEffect(() => {
        if (url !== videoState.url) {
            setVideoState((prev) => ({ ...prev, url }));
        }
    }, [url]);

    return (
        <div className="w-full h-full rounded-3xl overflow-hidden bg-black">
            <ReactPlayer
                ref={playerRef}
                src={videoState.url}
                playing={videoState.playing}
                muted={true}
                controls
                width="100%"
                height="100%"
                style={{ backgroundColor: "black" }}
                onReady={handleReady}
                onPlay={handlePlay}
                onPause={handlePause}
                onSeek={handleSeek}
                onProgress={handleProgress}
                progressInterval={100}
            />
        </div>
    );
}
