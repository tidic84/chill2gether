import { useParams, Link } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { roomApi } from "../services/api";
import { useSocket } from "../contexts/SocketContext";
import { useAuth } from "../contexts/AuthContext";
import MainLayout from "../components/Layout/MainLayout";
import Header from "../components/Header/Header";
import VideoPlayer from "../components/VideoPlayer/VideoPlayer";
import Chat from "../components/Chat/Chat";
import UserList from "../components/UserList/UserList";
import Playlist from "../components/Playlist/Playlist";
import YouTubeSearch from "../components/searchbar/YouTubeSearch";
import History from "../components/History/History";
import GridMotion from "../components/GridMotion/GridMotion";
import Whiteboard from "../components/Whiteboard/Whiteboard";
import WhiteboardToolbar from "../components/Whiteboard/WhiteboardToolbar";
import ScreenShare from "../components/ScreenShare/ScreenShare";
import ModeSwitch from "../components/ModeSwitch/ModeSwitch";
import { useTutorial } from '../contexts/TutorialContext';

export default function RoomPage() {
    const { roomId } = useParams();
    const socket = useSocket();
    const { isAuthenticated, user } = useAuth();

    const [roomState, setRoomState] = useState('loading');
    const [roomData, setRoomData] = useState(null);
    const [password, setPassword] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [users, setUsers] = useState([]);
    const [showUsernamePopup, setShowUsernamePopup] = useState(false);
    const [currentUsername, setCurrentUsername] = useState("");
    const [newUsername, setNewUsername] = useState("");

    // État de la playlist - UNIQUEMENT géré via WebSocket
    const [playlist, setPlaylist] = useState([]);
    const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
    const [currentVideoUrl, setCurrentVideoUrl] = useState(null);
    const [history, setHistory] = useState([]);
    const [shouldAutoplay, setShouldAutoplay] = useState(true);

    // État du whiteboard / mode cours
    const [roomMode, setRoomMode] = useState('video'); // 'video' | 'course'
    const [userRole, setUserRole] = useState('student'); // 'admin' | 'student'
    const [currentUserId, setCurrentUserId] = useState(null);
    const [drawPermissions, setDrawPermissions] = useState([]);
    const [isScreenSharing, setIsScreenSharing] = useState(false);

    const {
        startTutorial,
        isActive,
        currentStepData,
        nextStep,
        previousStep,
        skipTutorial,
        totalSteps,
        currentStep
    } = useTutorial();

    // Vérifier si la room existe au chargement
    useEffect(() => {
        const checkRoom = async () => {
            try {
                const response = await roomApi.getRoom(roomId);

                if (response.success) {
                    setRoomData(response.room);

                    if (!response.room.requiresPassword) {
                        setRoomState('authenticated');
                        joinSocketRoom();
                    } else {
                        setRoomState('password-required');
                    }
                }
            } catch (error) {
                console.error('Erreur:', error);
                setRoomState('not-found');
            }
        };

        checkRoom();
    }, [roomId]);

    // Rejoindre la room via Socket.IO
    const joinSocketRoom = () => {
        // Si l'utilisateur est connecté, on envoie son username
        if (isAuthenticated && user?.username) {
            socket.emit('join-room', { roomId, username: user.username });
        } else {
            socket.emit('join-room', roomId);
        }
        socket.emit('get-playlist', roomId);
        socket.emit('get-history', roomId);
    };

    // Écouter l'événement user-registered
    useEffect(() => {
        const handleUserRegistered = (data) => {
            setCurrentUsername(data.username);
            setCurrentUserId(data.userId);

            // Ne pas afficher la popup si l'utilisateur est connecté
            if (data.username.startsWith("User") && !isAuthenticated) {
                setShowUsernamePopup(true);
            }
        };

        socket.on('user-registered', handleUserRegistered);

        return () => {
            socket.off('user-registered', handleUserRegistered);
        };
    }, [socket, isAuthenticated]);

    // Écouter l'événement room-joined pour vérifier le pseudo et le rôle
    useEffect(() => {
        const handleRoomJoined = (data) => {
            if (data.user && data.user.username) {
                setCurrentUsername(data.user.username);
                setCurrentUserId(data.user.userId);

                // Ne pas afficher la popup si l'utilisateur est connecté
                if (data.user.username.startsWith("User") && !isAuthenticated) {
                    setShowUsernamePopup(true);
                }
            }
            if (data.role) {
                setUserRole(data.role);
            }
        };

        socket.on('room-joined', handleRoomJoined);

        return () => {
            socket.off('room-joined', handleRoomJoined);
        };
    }, [socket, isAuthenticated]);

    // Écouter la confirmation de changement de username
    useEffect(() => {
        const handleUsernameUpdated = (data) => {
            setCurrentUsername(data.username);
            socket.emit('get-users', roomId);
        };

        socket.on('username-updated', handleUsernameUpdated);

        return () => {
            socket.off('username-updated', handleUsernameUpdated);
        };
    }, [socket, roomId]);

    // Écouter les mises à jour de la liste des utilisateurs
    useEffect(() => {
        const handleUpdateUsers = (data) => {
            const currentUserId = localStorage.getItem('anonymousUserId');
            const enrichedUsers = data.map(user => ({
                ...user,
                isAdmin: user.userId === roomData?.creatorId
            }));
            setUsers(enrichedUsers);
        };

        socket.on('update-users', handleUpdateUsers);

        return () => {
            socket.off('update-users');
        };
    }, [socket, roomData]);

    // Écouter l'état initial de la playlist
    useEffect(() => {
        const handlePlaylistState = (data) => {
            console.log("Playlist state:", data);

            setPlaylist(data.videos);
            setCurrentVideoIndex(data.currentIndex);

            // Toujours afficher la vidéo courante même si elle n'est pas en lecture
            if (data.videos.length > 0 && data.currentIndex >= 0) {
                const currentVideo = data.videos[data.currentIndex];
                setCurrentVideoUrl(currentVideo.url);
            } else {
                setCurrentVideoUrl(null);
            }
        };

        socket.on('playlist-state', handlePlaylistState);

        return () => socket.off('playlist-state', handlePlaylistState);
    }, [socket]);

    // Écouter les mises à jour de la playlist
    useEffect(() => {
        const handlePlaylistUpdated = (data) => {
            console.log("Playlist updated:", data);

            const previousLength = playlist.length;
            setPlaylist(data.videos);
            setCurrentVideoIndex(data.currentIndex);

            // Lancer automatiquement seulement si c'est la première vidéo (playlist était vide)
            if (previousLength === 0 && data.videos.length === 1 && shouldAutoplay) {
                console.log('Première vidéo de la playlist, lecture automatique');
                socket.emit('play-video', { roomId, videoIndex: 0 });
            }

            // Toujours afficher la vidéo courante même si elle n'est pas en lecture
            if (data.videos.length > 0 && data.currentIndex >= 0) {
                const currentVideo = data.videos[data.currentIndex];
                setCurrentVideoUrl(currentVideo.url);
            } else {
                setCurrentVideoUrl(null);
            }
        };

        socket.on('playlist-updated', handlePlaylistUpdated);

        return () => socket.off('playlist-updated', handlePlaylistUpdated);
    }, [socket, playlist.length, shouldAutoplay, roomId]);

    // Écouter les changements de vidéo (play-video et video-ended)
    useEffect(() => {
        const handleVideoChanged = (data) => {
            console.log("Video changed:", data);

            setCurrentVideoIndex(data.videoIndex);
            setCurrentVideoUrl(data.video.url);
            setShouldAutoplay(true);
        };

        socket.on('video-changed', handleVideoChanged);

        return () => socket.off('video-changed', handleVideoChanged);
    }, [socket]);

    // Gérer les erreurs de la playlist
    useEffect(() => {
        socket.on('playlist-error', (data) => {
            console.error('Playlist error:', data.error);
            alert(data.error);
        });

        return () => socket.off('playlist-error');
    }, [socket]);

    useEffect(() => {
        const handleHistoryState = (data) => {
            console.log("History state:", data);
            setHistory(data.history);
        };

        socket.on('history-state', handleHistoryState);

        return () => socket.off('history-state', handleHistoryState);
    }, [socket]);

    useEffect(() => {
        const handleHistoryUpdated = (data) => {
            console.log("History updated:", data);
            setHistory(data.history);
        };

        socket.on('history-updated', handleHistoryUpdated);

        return () => socket.off('history-updated', handleHistoryUpdated);
    }, [socket]);

    // Écouter les événements whiteboard
    useEffect(() => {
        const handleModeChanged = (data) => {
            setRoomMode(data.mode);
        };
        const handleRoleChanged = (data) => {
            setDrawPermissions(data.drawPermissions || []);
        };
        const handleScreenShareStart = () => {
            setIsScreenSharing(true);
        };
        const handleScreenShareStop = () => {
            setIsScreenSharing(false);
        };

        socket.on('wb:mode-changed', handleModeChanged);
        socket.on('wb:role-changed', handleRoleChanged);
        socket.on('wb:screen-share-start', handleScreenShareStart);
        socket.on('wb:screen-share-stop', handleScreenShareStop);

        return () => {
            socket.off('wb:mode-changed', handleModeChanged);
            socket.off('wb:role-changed', handleRoleChanged);
            socket.off('wb:screen-share-start', handleScreenShareStart);
            socket.off('wb:screen-share-stop', handleScreenShareStop);
        };
    }, [socket]);

    // Handler mode switch (admin uniquement)
    const handleModeSwitch = useCallback((mode) => {
        socket.emit('wb:mode-switch', { roomId, mode });
    }, [socket, roomId]);

    // Handler screen share
    const handleScreenShareStart = useCallback(() => {
        socket.emit('wb:screen-share-start', roomId);
    }, [socket, roomId]);

    const handleScreenShareStop = useCallback(() => {
        socket.emit('wb:screen-share-stop', roomId);
    }, [socket, roomId]);

    // Déterminer si l'utilisateur peut dessiner
    const canDraw = userRole === 'admin' || drawPermissions.includes(currentUserId);

    // Gérer la sélection d'une vidéo depuis la recherche YouTube
    const handleSelectVideo = (video) => {
        console.log('Sélection vidéo:', video);
        setShouldAutoplay(true);
        socket.emit('add-to-playlist', {
            roomId,
            video
        });
    };

    //tuto automatique
    useEffect(() => {
        if (roomState === 'authenticated' && !showUsernamePopup) {
            const timer = setTimeout(() => {
                startTutorial('room');
            }, 1000);

            return () => clearTimeout(timer);
        }
    }, [roomState, showUsernamePopup, startTutorial]);

    // Gérer la fin de la vidéo
    const handleVideoEnded = () => {
        console.log('Video ended');
        socket.emit('video-ended', { roomId });
    };

    // Gérer la soumission du mot de passe
    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setPasswordError("");

        try {
            const response = await roomApi.joinRoom(roomId, password);

            if (response.success) {
                setRoomState('authenticated');
                joinSocketRoom();
            }
        } catch (error) {
            setPasswordError(error.message);
        }
    };

    // Gérer le changement de pseudo
    const handleUsernameChange = () => {
        if (newUsername.trim().length === 0) {
            alert("Le nom d'utilisateur ne peut pas être vide");
            return;
        }

        socket.emit('change-username', newUsername.trim());
        setShowUsernamePopup(false);
        setNewUsername("");
    };

    const handleCancelUsernameChange = () => {
        setShowUsernamePopup(false);
        setNewUsername("");
    };

    // Play video via WebSocket uniquement
    const handlePlayVideo = (index) => {
        console.log("Play video request:", index);
        setShouldAutoplay(true);
        socket.emit('play-video', { roomId, videoIndex: index });
    };

    // Contenu fictif pour activities et permissions
    const activities = (
        <ul className="space-y-1">
            <li className="px-2 py-1 bg-gray-100 rounded">Regarder une vidéo</li>
            <li className="px-2 py-1 bg-gray-100 rounded">Partager un lien</li>
            <li className="px-2 py-1 bg-gray-100 rounded">Discussion générale</li>
        </ul>
    );

    const permissions = (
        <ul className="space-y-1">
            <li className="px-2 py-1 bg-gray-100 rounded">Peut changer la vidéo</li>
            <li className="px-2 py-1 bg-gray-100 rounded">Peut inviter des utilisateurs</li>
            <li className="px-2 py-1 bg-gray-100 rounded">Peut supprimer des messages</li>
        </ul>
    );

    const historyComponent = (
        <History
            videos={history}
            onSelectVideo={(url) => {
                console.log("History select:", url);
                const index = playlist.findIndex(v => v.url === url);
                if (index >= 0) {
                    handlePlayVideo(index);
                }
            }}
        />
    );

    // État de chargement
    if (roomState === 'loading') {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-xl">Chargement de la room...</p>
                </div>
            </div>
        );
    }

    // Room non trouvée (404)
    if (roomState === 'not-found') {
        return (
            <div className="relative min-h-screen overflow-hidden bg-zen-bg dark:bg-zen-dark-bg">
                <GridMotion className="absolute inset-0 -z-20" />

                <div className="relative z-10 flex flex-col items-center justify-center min-h-screen">
                    <div className="absolute inset-0 z-0 bg-zen-stone/10 pointer-events-none" />

                    <div className="relative z-10 text-center p-8 bg-zen-surface dark:bg-zen-dark-surface backdrop-blur-md rounded-2xl shadow-xl border border-zen-border dark:border-zen-dark-border max-w-md">
                        <h1 className="text-6xl font-bold mb-4 text-zen-clay dark:text-zen-dark-clay">404</h1>
                        <h2 className="text-2xl font-semibold mb-2 text-zen-text dark:text-zen-dark-text">Room introuvable</h2>
                        <p className="text-zen-muted dark:text-zen-dark-muted mb-6">
                            La room <span className="font-mono text-zen-sage dark:text-zen-dark-sage font-semibold">{roomId}</span> n'existe pas ou a été supprimée.
                        </p>
                        <Link
                            to="/"
                            className="inline-block px-6 py-3 bg-zen-sage dark:bg-zen-dark-sage hover:bg-zen-sage dark:bg-zen-dark-sage/80 text-white rounded-lg font-semibold transition shadow-md"
                        >
                            Retour à l'accueil
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Demande de mot de passe
    if (roomState === 'password-required') {
        return (
            <div className="relative min-h-screen overflow-hidden bg-zen-bg dark:bg-zen-dark-bg">
                <GridMotion className="absolute inset-0 -z-20" />

                <div className="relative z-10 flex flex-col items-center justify-center min-h-screen">
                    <div className="absolute inset-0 z-0 bg-zen-stone/10 pointer-events-none" />

                    <div className="relative z-10 w-full max-w-md p-8 bg-zen-surface dark:bg-zen-dark-surface backdrop-blur-md rounded-2xl shadow-xl border border-zen-border dark:border-zen-dark-border">
                        <div className="text-center mb-6">
                            <div className="text-5xl mb-4">🔒</div>
                            <h1 className="text-3xl font-bold mb-2 text-zen-text dark:text-zen-dark-text">Room Privée</h1>
                            <p className="text-zen-muted dark:text-zen-dark-muted">
                                Cette room nécessite un mot de passe
                            </p>
                            <p className="text-sm text-zen-stone dark:text-zen-dark-stone mt-2 font-mono">
                                Room: {roomId}
                            </p>
                        </div>

                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium mb-2 text-zen-text dark:text-zen-dark-text">
                                    Mot de passe
                                </label>
                                <input
                                    type="password"
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-2 bg-white dark:bg-zen-dark-surface border border-zen-border dark:border-zen-dark-border rounded-lg text-zen-text dark:text-zen-dark-text placeholder-zen-stone focus:outline-none focus:border-zen-sage focus:ring-2 focus:ring-zen-sage/20"
                                    placeholder="Entrez le mot de passe"
                                    required
                                />
                            </div>

                            {passwordError && (
                                <div className="p-3 bg-zen-clay dark:bg-zen-dark-clay/10 border border-zen-clay rounded-lg text-zen-clay dark:text-zen-dark-clay text-sm">
                                    {passwordError}
                                </div>
                            )}

                            <div className="flex gap-4">
                                <Link
                                    to="/"
                                    className="flex-1 px-4 py-2 bg-zen-bg dark:bg-zen-dark-bg hover:bg-zen-border text-zen-text dark:text-zen-dark-text rounded-lg font-semibold transition text-center"
                                >
                                    Annuler
                                </Link>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-zen-sage dark:bg-zen-dark-sage hover:bg-zen-sage dark:bg-zen-dark-sage/80 text-white rounded-lg font-semibold transition shadow-md"
                                >
                                    Rejoindre
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    // Room authentifiée
    if (roomState === 'authenticated') {
        // Contenu principal selon le mode
        const mainContent = roomMode === 'course' ? (
            <div className="flex flex-col gap-4">
                {/* Toolbar admin */}
                {userRole === 'admin' && (
                    <WhiteboardToolbar
                        roomId={roomId}
                        users={users.filter(u => u.userId !== currentUserId)}
                        drawPermissions={drawPermissions}
                        onScreenShare={isScreenSharing ? handleScreenShareStop : handleScreenShareStart}
                        isScreenSharing={isScreenSharing}
                    />
                )}

                {/* Screen share overlay */}
                {isScreenSharing && (
                    <ScreenShare
                        isAdmin={userRole === 'admin'}
                        isSharing={isScreenSharing}
                        onStart={handleScreenShareStart}
                        onStop={handleScreenShareStop}
                    />
                )}

                {/* Whiteboard */}
                <div className="bg-white dark:bg-zen-dark-surface rounded-2xl shadow-sm border border-zen-border dark:border-zen-dark-border">
                    <Whiteboard
                        roomId={roomId}
                        viewMode={!canDraw}
                    />
                </div>
            </div>
        ) : (
            <VideoPlayer
                url={currentVideoUrl}
                onEnded={handleVideoEnded}
                autoplay={shouldAutoplay}
            />
        );

        return (
            <>
                <Header roomCode={roomId}>
                    <ModeSwitch
                        mode={roomMode}
                        onSwitch={handleModeSwitch}
                        disabled={userRole !== 'admin'}
                    />
                </Header>
                <MainLayout
                    video={mainContent}
                    rawVideoSlot={roomMode === 'course'}
                    chat={<Chat />}
                    users={<UserList users={users} />}
                    playlist={
                        <Playlist
                            videos={playlist}
                            currentIndex={currentVideoIndex}
                            roomId={roomId}
                            onPlayVideo={handlePlayVideo}
                        />
                    }
                    search={<YouTubeSearch onSelectVideo={handleSelectVideo} />}
                    history={historyComponent}
                    activities={activities}
                    permissions={permissions}
                />

                {/* Tutorial overlay */}
                <div className="fixed bottom-4 left-4 z-50 space-y-2">
                    {isActive && (
                        <>
                            <div className="bg-white p-4 rounded-lg shadow-lg max-w-xs">
                                <p className="text-sm font-bold">Step {currentStep + 1}/{totalSteps}</p>
                                <p className="text-xs">{currentStepData?.title}</p>
                                <p className="text-xs text-gray-600">{currentStepData?.content}</p>
                                <p className="text-xs mt-2">Target: {currentStepData?.target}</p>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={previousStep}
                                    className="px-3 py-1 bg-gray-500 text-white rounded text-sm"
                                >
                                    Prev
                                </button>
                                <button
                                    onClick={nextStep}
                                    className="px-3 py-1 bg-green-500 text-white rounded text-sm"
                                >
                                    Next
                                </button>
                                <button
                                    onClick={skipTutorial}
                                    className="px-3 py-1 bg-red-500 text-white rounded text-sm"
                                >
                                    Skip
                                </button>
                            </div>
                        </>
                    )}
                </div>

                {/* Popup de changement de pseudo */}
                {showUsernamePopup && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zen-stone/60 backdrop-blur-sm">
                        <div className="bg-zen-surface dark:bg-zen-dark-surface rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 border border-zen-border dark:border-zen-dark-border">
                            <div className="text-center mb-6">
                                <h2 className="text-2xl font-bold text-zen-text dark:text-zen-dark-text mb-2">
                                    Personnalisez votre pseudo
                                </h2>
                                <p className="text-zen-muted dark:text-zen-dark-muted">
                                    Votre pseudo actuel est <span className="font-mono font-semibold text-zen-sage dark:text-zen-dark-sage">{currentUsername}</span>
                                </p>
                                <p className="text-sm text-zen-stone dark:text-zen-dark-stone mt-2">
                                    Voulez-vous le modifier maintenant ?
                                </p>
                            </div>

                            <div className="mb-6">
                                <label htmlFor="newUsername" className="block text-sm font-medium text-zen-text dark:text-zen-dark-text mb-2">
                                    Nouveau pseudo
                                </label>
                                <input
                                    type="text"
                                    id="newUsername"
                                    value={newUsername}
                                    onChange={(e) => setNewUsername(e.target.value)}
                                    placeholder="Entrez votre nouveau pseudo"
                                    className="w-full px-4 py-3 bg-white dark:bg-zen-dark-surface border border-zen-border dark:border-zen-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-zen-sage focus:border-zen-sage text-zen-text dark:text-zen-dark-text"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleUsernameChange();
                                        }
                                    }}
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={handleCancelUsernameChange}
                                    className="flex-1 px-4 py-3 bg-zen-bg dark:bg-zen-dark-bg hover:bg-zen-border text-zen-text dark:text-zen-dark-text rounded-lg font-semibold transition"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleUsernameChange}
                                    className="flex-1 px-4 py-3 bg-zen-sage dark:bg-zen-dark-sage hover:bg-zen-sage dark:bg-zen-dark-sage/80 text-white rounded-lg font-semibold transition shadow-md"
                                >
                                    Modifier
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </>
        );
    }

    return null;
}
