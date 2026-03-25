import { useRef, useState, useCallback, useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';

const ICE_CONFIG = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ],
};

export function useScreenShare({ isAdmin, roomId }) {
    const socket = useSocket();

    const [isSharing, setIsSharing] = useState(false);
    const [localStream, setLocalStream] = useState(null);   // flux local (aperçu admin)
    const [remoteStream, setRemoteStream] = useState(null); // flux reçu (étudiant)
    const [error, setError] = useState(null);

    const localStreamRef = useRef(null);
    const peerConnectionsRef = useRef({}); // socketId → RTCPeerConnection

    // ─── ADMIN helpers ────────────────────────────────────────────────────────
    const createPeerConnection = useCallback(
        (viewerSocketId) => {
            if (peerConnectionsRef.current[viewerSocketId]) {
                return peerConnectionsRef.current[viewerSocketId];
            }
            const pc = new RTCPeerConnection(ICE_CONFIG);
            peerConnectionsRef.current[viewerSocketId] = pc;

            pc.onicecandidate = (e) => {
                if (e.candidate) {
                    socket.emit('screenshare:ice-candidate', {
                        roomId, targetSocketId: viewerSocketId, candidate: e.candidate,
                    });
                }
            };
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach((t) => pc.addTrack(t, localStreamRef.current));
            }
            pc.onconnectionstatechange = () => {
                if (['failed', 'closed', 'disconnected'].includes(pc.connectionState)) {
                    pc.close();
                    delete peerConnectionsRef.current[viewerSocketId];
                }
            };
            return pc;
        },
        [socket, roomId]
    );

    const sendOfferToViewer = useCallback(
        async (viewerSocketId) => {
            if (viewerSocketId === socket?.id) return;
            const pc = createPeerConnection(viewerSocketId);
            try {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                socket.emit('screenshare:offer', { roomId, targetSocketId: viewerSocketId, offer });
            } catch (err) {
                console.error('[ScreenShare] createOffer:', err);
            }
        },
        [createPeerConnection, socket, roomId]
    );

    // ─── startSharing ─────────────────────────────────────────────────────────
    // onSuccessCallback est appelé APRÈS que getDisplayMedia réussit,
    // ce qui garantit que les listeners des étudiants sont prêts avant les offres.
    const startSharing = useCallback(
        async (users = [], onSuccessCallback) => {
            setError(null);
            if (!navigator.mediaDevices?.getDisplayMedia) {
                setError("Le partage d'écran n'est pas supporté par ce navigateur.");
                return false;
            }
            try {
                const stream = await navigator.mediaDevices.getDisplayMedia({
                    video: { cursor: 'always' }, audio: false,
                });
                localStreamRef.current = stream;
                setLocalStream(stream);
                setIsSharing(true);

                // Notifier les autres APRÈS avoir obtenu le stream
                if (onSuccessCallback) onSuccessCallback();
                socket.emit('screenshare:start', { roomId });

                // Laisser React propager isScreenSharing avant d'envoyer les offres
                await new Promise((r) => setTimeout(r, 200));
                users.forEach((u) => { if (u.socketId) sendOfferToViewer(u.socketId); });

                stream.getVideoTracks()[0].addEventListener('ended', () => stopSharing());
                return true;
            } catch (err) {
                if (err.name !== 'AbortError' && err.name !== 'NotAllowedError') {
                    setError("Erreur lors du démarrage du partage d'écran.");
                }
                if (err.name === 'NotAllowedError') {
                    setError("Permission refusée pour le partage d'écran.");
                }
                console.error('[ScreenShare] getDisplayMedia:', err);
                return false;
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [socket, roomId, sendOfferToViewer]
    );

    // ─── stopSharing ──────────────────────────────────────────────────────────
    const stopSharing = useCallback(
        (onStopCallback) => {
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach((t) => t.stop());
                localStreamRef.current = null;
            }
            Object.values(peerConnectionsRef.current).forEach((pc) => pc.close());
            peerConnectionsRef.current = {};
            setIsSharing(false);
            setLocalStream(null);
            if (onStopCallback) onStopCallback();
            socket.emit('screenshare:stop', { roomId });
        },
        [socket, roomId]
    );

    // ─── handleNewViewer — offre aux nouveaux arrivants pendant un partage ────
    const handleNewViewer = useCallback(
        (viewerSocketId) => {
            if (isSharing && localStreamRef.current) sendOfferToViewer(viewerSocketId);
        },
        [isSharing, sendOfferToViewer]
    );

    // ─── Listeners socket ─────────────────────────────────────────────────────
    useEffect(() => {
        if (!socket) return;

        if (isAdmin) {
            const handleAnswer = async ({ fromSocketId, answer }) => {
                const pc = peerConnectionsRef.current[fromSocketId];
                if (!pc) return;
                try { await pc.setRemoteDescription(new RTCSessionDescription(answer)); }
                catch (e) { console.error('[ScreenShare] setRemoteDescription (admin):', e); }
            };
            const handleIce = async ({ fromSocketId, candidate }) => {
                const pc = peerConnectionsRef.current[fromSocketId];
                if (!pc) return;
                try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); }
                catch (e) { console.error('[ScreenShare] addIceCandidate (admin):', e); }
            };
            socket.on('screenshare:answer', handleAnswer);
            socket.on('screenshare:ice-candidate', handleIce);
            return () => {
                socket.off('screenshare:answer', handleAnswer);
                socket.off('screenshare:ice-candidate', handleIce);
            };
        } else {
            const handleOffer = async ({ fromSocketId, offer }) => {
                if (peerConnectionsRef.current[fromSocketId]) {
                    peerConnectionsRef.current[fromSocketId].close();
                }
                const pc = new RTCPeerConnection(ICE_CONFIG);
                peerConnectionsRef.current[fromSocketId] = pc;

                pc.onicecandidate = (e) => {
                    if (e.candidate) {
                        socket.emit('screenshare:ice-candidate', {
                            roomId, targetSocketId: fromSocketId, candidate: e.candidate,
                        });
                    }
                };
                pc.ontrack = (e) => { if (e.streams?.[0]) setRemoteStream(e.streams[0]); };
                pc.onconnectionstatechange = () => {
                    if (['failed', 'closed'].includes(pc.connectionState)) setRemoteStream(null);
                };
                try {
                    await pc.setRemoteDescription(new RTCSessionDescription(offer));
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    socket.emit('screenshare:answer', { roomId, targetSocketId: fromSocketId, answer });
                } catch (e) {
                    console.error('[ScreenShare] handleOffer (student):', e);
                }
            };
            const handleStopped = () => {
                setRemoteStream(null);
                Object.values(peerConnectionsRef.current).forEach((pc) => pc.close());
                peerConnectionsRef.current = {};
            };
            const handleIce = async ({ fromSocketId, candidate }) => {
                const pc = peerConnectionsRef.current[fromSocketId];
                if (!pc) return;
                try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); }
                catch (e) { console.error('[ScreenShare] addIceCandidate (student):', e); }
            };
            socket.on('screenshare:offer', handleOffer);
            socket.on('screenshare:stopped', handleStopped);
            socket.on('screenshare:ice-candidate', handleIce);
            return () => {
                socket.off('screenshare:offer', handleOffer);
                socket.off('screenshare:stopped', handleStopped);
                socket.off('screenshare:ice-candidate', handleIce);
            };
        }
    }, [socket, isAdmin, roomId]);

    // ─── Cleanup ──────────────────────────────────────────────────────────────
    useEffect(() => {
        return () => {
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach((t) => t.stop());
            }
            Object.values(peerConnectionsRef.current).forEach((pc) => pc.close());
        };
    }, []);

    return { isSharing, localStream, remoteStream, error, startSharing, stopSharing, handleNewViewer };
}
