import { useState, useEffect, useCallback, useRef } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import { useSocket } from "../../contexts/SocketContext";

const THROTTLE_MS = 50;

export default function Whiteboard({ roomId, viewMode = false }) {
    const socket = useSocket();
    const [excalidrawAPI, setExcalidrawAPI] = useState(null);
    const lastEmitRef = useRef(0);
    const isRemoteUpdateRef = useRef(false);
    const initialStateRef = useRef(null);
    const [ready, setReady] = useState(false);

    // Rejoindre le whiteboard au mount
    useEffect(() => {
        socket.emit('wb:join', roomId);
    }, [socket, roomId]);

    // Écouter l'état initial (snapshot)
    useEffect(() => {
        const handleState = (data) => {
            if (data.elements && data.elements.length > 0) {
                initialStateRef.current = data.elements;
                if (excalidrawAPI) {
                    isRemoteUpdateRef.current = true;
                    excalidrawAPI.updateScene({ elements: data.elements });
                    setTimeout(() => { isRemoteUpdateRef.current = false; }, 100);
                }
            }
            setReady(true);
        };

        socket.on('wb:state', handleState);
        return () => socket.off('wb:state', handleState);
    }, [socket, excalidrawAPI]);

    // Écouter les mises à jour distantes
    useEffect(() => {
        const handleUpdate = (data) => {
            if (!excalidrawAPI || !data.elements) return;
            isRemoteUpdateRef.current = true;
            excalidrawAPI.updateScene({ elements: data.elements });
            setTimeout(() => { isRemoteUpdateRef.current = false; }, 100);
        };

        socket.on('wb:update', handleUpdate);
        return () => socket.off('wb:update', handleUpdate);
    }, [socket, excalidrawAPI]);

    // Écouter le clear
    useEffect(() => {
        const handleClear = () => {
            if (!excalidrawAPI) return;
            isRemoteUpdateRef.current = true;
            excalidrawAPI.updateScene({ elements: [] });
            setTimeout(() => { isRemoteUpdateRef.current = false; }, 100);
        };

        socket.on('wb:clear', handleClear);
        return () => socket.off('wb:clear', handleClear);
    }, [socket, excalidrawAPI]);

    // Callback onChange d'Excalidraw — envoie le delta throttlé
    const handleChange = useCallback((elements, appState) => {
        if (isRemoteUpdateRef.current || viewMode) return;

        const now = Date.now();
        if (now - lastEmitRef.current < THROTTLE_MS) return;
        lastEmitRef.current = now;

        socket.emit('wb:update', {
            roomId,
            elements: elements.map(el => ({
                ...el,
            })),
        });
    }, [socket, roomId, viewMode]);

    return (
        <div style={{ height: "600px" }}>
            {ready && (
                <Excalidraw
                    excalidrawAPI={(api) => setExcalidrawAPI(api)}
                    onChange={handleChange}
                    viewModeEnabled={viewMode}
                    initialData={{
                        elements: initialStateRef.current || [],
                        appState: {
                            viewBackgroundColor: "#fafafa",
                        },
                    }}
                    UIOptions={{
                        canvasActions: {
                            loadScene: false,
                            export: false,
                            saveAsImage: !viewMode,
                        },
                    }}
                />
            )}
        </div>
    );
}
