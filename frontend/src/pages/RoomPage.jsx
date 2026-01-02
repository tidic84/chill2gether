import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { roomApi } from "../services/api";
import { useSocket } from "../contexts/SocketContext";
import MainLayout from "../components/Layout/MainLayout";
import Header from "../components/Header/Header";
import VideoPlayer from "../components/VideoPlayer/VideoPlayer";
import Chat from "../components/Chat/Chat";
import UserList from "../components/UserList/UserList";
import Playlist from "../components/Playlist/Playlist";
import YouTubeSearch from "../components/searchbar/YouTubeSearch";
import History from "../components/History/History";
import GridMotion from "../components/GridMotion/GridMotion";

export default function RoomPage() {
    const { roomId } = useParams();
    const socket = useSocket();

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
        socket.emit('join-room', roomId);
        socket.emit('get-playlist', roomId);
        socket.emit('get-history', roomId);
    };

    // Écouter l'événement user-registered
    useEffect(() => {
        const handleUserRegistered = (data) => {
            setCurrentUsername(data.username);

            if (data.username.startsWith("User")) {
                setShowUsernamePopup(true);
            }
        };

        socket.on('user-registered', handleUserRegistered);

        return () => {
            socket.off('user-registered', handleUserRegistered);
        };
    }, [socket]);

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
        socket.on('update-users', (data) => {
            setUsers(data);
        });

        return () => {
            socket.off('update-users');
        };
    }, [socket]);

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
                console.log('🎬 Première vidéo de la playlist, lecture automatique');
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

    // Gérer la sélection d'une vidéo depuis la recherche YouTube
    const handleSelectVideo = (video) => {
        console.log('📹 Sélection vidéo:', video);
        setShouldAutoplay(true); // Lancer automatiquement une nouvelle vidéo
        socket.emit('add-to-playlist', {
            roomId,
            video
        });
        console.log('📤 Émission add-to-playlist vers le serveur');
    };

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
        setShouldAutoplay(true); // Lancer automatiquement quand l'utilisateur sélectionne
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
                // Trouver l'index de la vidéo dans la playlist
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
            <div className="relative min-h-screen overflow-hidden">
                <GridMotion className="absolute inset-0 -z-20" />

                <div className="relative z-10 flex flex-col items-center justify-center min-h-screen text-white">
                    <div className="absolute inset-0 z-0 bg-black/40 pointer-events-none" />

                    <div className="relative z-10 text-center p-8 bg-black/60 backdrop-blur-md rounded-xl shadow-lg max-w-md">
                        <h1 className="text-6xl font-bold mb-4">404</h1>
                        <h2 className="text-2xl font-semibold mb-2">Room introuvable</h2>
                        <p className="text-gray-300 mb-6">
                            La room <span className="font-mono text-blue-400">{roomId}</span> n'existe pas ou a été supprimée.
                        </p>
                        <Link
                            to="/"
                            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition"
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
            <div className="relative min-h-screen overflow-hidden">
                <GridMotion className="absolute inset-0 -z-20" />

                <div className="relative z-10 flex flex-col items-center justify-center min-h-screen text-white">
                    <div className="absolute inset-0 z-0 bg-black/40 pointer-events-none" />

                    <div className="relative z-10 w-full max-w-md p-8 bg-black/60 backdrop-blur-md rounded-xl shadow-lg">
                        <div className="text-center mb-6">
                            <div className="text-5xl mb-4">🔒</div>
                            <h1 className="text-3xl font-bold mb-2">Room Privée</h1>
                            <p className="text-gray-300">
                                Cette room nécessite un mot de passe
                            </p>
                            <p className="text-sm text-gray-400 mt-2 font-mono">
                                Room: {roomId}
                            </p>
                        </div>

                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium mb-2">
                                    Mot de passe
                                </label>
                                <input
                                    type="password"
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    placeholder="Entrez le mot de passe"
                                    required
                                />
                            </div>

                            {passwordError && (
                                <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-200 text-sm">
                                    {passwordError}
                                </div>
                            )}

                            <div className="flex gap-4">
                                <Link
                                    to="/"
                                    className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg font-semibold transition text-center"
                                >
                                    Annuler
                                </Link>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition"
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
        return (
            <>
                <Header roomCode={roomId} />
                <MainLayout
                    video={
                        <VideoPlayer
                            url={currentVideoUrl}
                            onEnded={handleVideoEnded}
                            autoplay={shouldAutoplay}
                        />
                    }
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

                {/* Popup de changement de pseudo */}
                {showUsernamePopup && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
                            <div className="text-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                                    Personnalisez votre pseudo
                                </h2>
                                <p className="text-gray-600">
                                    Votre pseudo actuel est <span className="font-mono font-semibold text-blue-600">{currentUsername}</span>
                                </p>
                                <p className="text-sm text-gray-500 mt-2">
                                    Voulez-vous le modifier maintenant ?
                                </p>
                            </div>

                            <div className="mb-6">
                                <label htmlFor="newUsername" className="block text-sm font-medium text-gray-700 mb-2">
                                    Nouveau pseudo
                                </label>
                                <input
                                    type="text"
                                    id="newUsername"
                                    value={newUsername}
                                    onChange={(e) => setNewUsername(e.target.value)}
                                    placeholder="Entrez votre nouveau pseudo"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                                    className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleUsernameChange}
                                    className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
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