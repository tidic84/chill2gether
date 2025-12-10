import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { roomApi } from "../services/api";
import { useSocket } from "../contexts/SocketContext";
import MainLayout from "../components/Layout/MainLayout";
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

    const [roomState, setRoomState] = useState('loading'); // 'loading', 'not-found', 'password-required', 'authenticated'
    const [roomData, setRoomData] = useState(null);
    const [password, setPassword] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [currentVideoUrl, setCurrentVideoUrl] = useState(null);
    const [users, setUsers] = useState([]);
    const [showUsernamePopup, setShowUsernamePopup] = useState(false);
    const [currentUsername, setCurrentUsername] = useState("");
    const [newUsername, setNewUsername] = useState("");

    // Playlist simulée
    const playlistVideos = [
        { id: 1, title: "Vidéo 1", url: "https://www.youtube.com/watch?v=enyUdIyZmjU" },
        { id: 2, title: "Vidéo 2", url: "https://www.youtube.com/watch?v=enyUdIyZmjU" },
        { id: 3, title: "Vidéo 3", url: "https://www.youtube.com/watch?v=enyUdIyZmjU" },
        { id: 4, title: "Vidéo 4", url: "https://www.youtube.com/watch?v=enyUdIyZmjU" },
        { id: 5, title: "Vidéo 5", url: "https://www.youtube.com/watch?v=enyUdIyZmjU" },
        { id: 6, title: "Vidéo 6", url: "https://www.youtube.com/watch?v=enyUdIyZmjU" },
    ];

    // Vérifier si la room existe au chargement
    useEffect(() => {
        const checkRoom = async () => {
            try {
                const response = await roomApi.getRoom(roomId);

                if (response.success) {
                    setRoomData(response.room);

                    // Si la room ne nécessite pas de mot de passe, rejoindre directement
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
        setCurrentVideoUrl(playlistVideos[0].url);
    };

    // Écouter l'événement user-registered pour vérifier le username
    useEffect(() => {
        const handleUserRegistered = (data) => {
            console.log("User registered:", data);
            setCurrentUsername(data.username);

            // Si le username commence par "User", afficher la popup
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
            console.log("Username updated:", data);
            setCurrentUsername(data.username);
        };

        socket.on('username-updated', (data) => {
            handleUsernameUpdated(data);
            socket.emit('get-users', roomId);
        });

        return () => {
            socket.off('username-updated', handleUsernameUpdated);
        };
    }, [socket]);

    // Écouter les mises à jour de la liste des utilisateurs
    useEffect(() => {
        const handleUpdateUsers = (data) => {
            console.log("Utilisateurs dans la room:", data);
            setUsers(data);
        };

        socket.on('update-users', handleUpdateUsers);

        // Cleanup : retirer le listener quand le composant est démonté
        return () => {
            socket.off('update-users', handleUpdateUsers);
        };
    }, [socket]);

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

    // Annuler le changement de pseudo
    const handleCancelUsernameChange = () => {
        setShowUsernamePopup(false);
        setNewUsername("");
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

    const history = (
        <History
            videos={playlistVideos}
            onSelectVideo={(url) => setCurrentVideoUrl(url)}
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

    // Room authentifiée - afficher le contenu
    if (roomState === 'authenticated' && currentVideoUrl) {
        return (
            <>
                <MainLayout
                    video={<VideoPlayer url={currentVideoUrl} />}
                    chat={<Chat />}
                    users={<UserList users={users} />}
                    playlist={
                        <Playlist
                            videos={playlistVideos}
                            onSelectVideo={(url) => setCurrentVideoUrl(url)}
                        />
                    }
                    search={<YouTubeSearch onSelectVideo={setCurrentVideoUrl}/>}
                    history={history}
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
