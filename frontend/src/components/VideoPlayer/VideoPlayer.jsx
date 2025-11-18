import React, { useRef, useEffect } from "react";
import ReactPlayer from "react-player";
import { io } from "socket.io-client";

const socket = io("http://localhost:5173");

export default function VideoPlayer({ url }) {
    const playerRef = useRef(null);

    console.log("VideoPlayer URL:", url);

    // Événements locaux -> serveur
    const handlePlay = () => {
        if (playerRef.current) {
            const time = playerRef.current.getCurrentTime();
            socket.emit("video:play", { url, time });
        }
    };

    const handlePause = () => {
        if (playerRef.current) {
            const time = playerRef.current.getCurrentTime();
            socket.emit("video:pause", { time });
        }
    };

    const handleSeek = (seconds) => {
        socket.emit("video:seek", { time: seconds });
    };

    // Écoute des événements venant du serveur
    useEffect(() => {
        socket.on("video:play", ({ url: newUrl, time }) => {
            if (playerRef.current) {
                if (newUrl !== url) return; // ignore si vidéo différente
                playerRef.current.seekTo(time, "seconds");
                playerRef.current.getInternalPlayer().playVideo?.();
            }
        });

        socket.on("video:pause", ({ time }) => {
            if (playerRef.current) {
                playerRef.current.seekTo(time, "seconds");
                playerRef.current.getInternalPlayer().pauseVideo?.();
            }
        });

        socket.on("video:seek", ({ time }) => {
            if (playerRef.current) {
                playerRef.current.seekTo(time, "seconds");
            }
        });

        return () => {
            socket.off("video:play");
            socket.off("video:pause");
            socket.off("video:seek");
        };
    }, [url]);

    return (
        <div className="w-full h-full rounded-3xl overflow-hidden bg-black">
            <ReactPlayer
                ref={playerRef}
                src={url}
                muted={true}
                playing={true}
                controls
                width="100%"
                height="100%"
                style={{ backgroundColor: "black" }}
                onPlay={handlePlay}
                onPause={handlePause}
                onSeek={handleSeek}
            />
        </div>
    );
}
