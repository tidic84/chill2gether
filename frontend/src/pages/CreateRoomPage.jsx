import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { roomApi } from "../services/api";
import { useSocket } from "../contexts/SocketContext";

export default function CreateRoomPage() {
    const navigate = useNavigate();
    const socket = useSocket();
    const [requiresPassword, setRequiresPassword] = useState(false);
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [userId, setUserId] = useState(null);
    const [waitingForUser, setWaitingForUser] = useState(true);

    // Attendre que le userId soit disponible
    useEffect(() => {
        const checkUserId = () => {
            const storedUserId = localStorage.getItem('anonymousUserId');
            if (storedUserId) {
                setUserId(storedUserId);
                setWaitingForUser(false);
            }
        };

        // Vérifier immédiatement
        checkUserId();

        // Écouter l'événement user-registered
        const handleUserRegistered = (data) => {
            console.log('User registered:', data);
            setUserId(data.userId);
            setWaitingForUser(false);
        };

        socket.on('user-registered', handleUserRegistered);

        // Timeout de sécurité (5 secondes)
        const timeout = setTimeout(() => {
            if (!userId) {
                setWaitingForUser(false);
                setError("Impossible de se connecter au serveur. Veuillez rafraîchir la page.");
            }
        }, 5000);

        return () => {
            socket.off('user-registered', handleUserRegistered);
            clearTimeout(timeout);
        };
    }, [socket, userId]);

    const handleCreateRoom = async (e) => {
        e.preventDefault();
        setError(null);

        if (!userId) {
            setError("Vous devez être connecté pour créer une room. Veuillez rafraîchir la page.");
            return;
        }

        // Validation du mot de passe si requis
        if (requiresPassword && !password.trim()) {
            setError("Veuillez entrer un mot de passe");
            return;
        }

        setLoading(true);

        try {
            const response = await roomApi.createRoom(
                userId,
                requiresPassword,
                requiresPassword ? password : null
            );

            if (response.success) {
                // Rediriger vers la room créée
                navigate(`/room/${response.room.id}`);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-screen selection:bg-zen-sage/20 selection:text-zen-sage dark:selection:bg-zen-dark-sage/20 dark:selection:text-zen-dark-sage overflow-hidden relative">
            {/* Background Ambiance */}
            <div className="organic-shape shape-sage"></div>
            <div className="organic-shape shape-clay"></div>

            {/* Navbar */}
            <nav className="w-full z-50 py-6 px-8 flex justify-between items-center fixed top-0 left-0 bg-transparent">
                <Link to="/" className="flex items-center gap-3 cursor-pointer group">
                    <div className="w-10 h-10 bg-zen-sage dark:bg-zen-dark-sage rounded-xl flex items-center justify-center text-white shadow-md shadow-zen-sage/20 group-hover:scale-105 transition-transform duration-300">
                        <i className="fa-solid fa-mug-hot text-lg"></i>
                    </div>
                    <h1 className="text-xl font-bold tracking-tight text-zen-text dark:text-zen-dark-text">
                        chill<span className="text-zen-muted dark:text-zen-dark-muted font-medium">2gether</span>
                    </h1>
                </Link>

                <Link
                    to="/"
                    className="flex items-center gap-2 text-sm font-semibold text-zen-muted dark:text-zen-dark-muted hover:text-zen-sage dark:hover:text-zen-dark-sage transition-colors"
                >
                    <i className="fa-solid fa-arrow-left"></i>
                    <span className="hidden md:inline">Retour</span>
                </Link>
            </nav>

            {/* Main Content */}
            <main className="flex-grow flex flex-col justify-center items-center px-6 relative z-10 w-full max-w-md mx-auto">
                <div className="w-full bg-white dark:bg-zen-dark-surface rounded-3xl shadow-lg border border-zen-border dark:border-zen-dark-border p-8">

                    {/* Icon Header */}
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 bg-zen-sage/10 dark:bg-zen-dark-sage/10 rounded-2xl flex items-center justify-center">
                            <i className="fa-solid fa-door-open text-3xl text-zen-sage dark:text-zen-dark-sage"></i>
                        </div>
                    </div>

                    <h1 className="text-3xl font-bold text-center text-zen-text dark:text-zen-dark-text mb-2">Créer une Room</h1>
                    <p className="text-center text-zen-muted dark:text-zen-dark-muted text-sm mb-8">
                        Configurez votre espace de détente
                    </p>

                    {waitingForUser ? (
                        // Loader pendant l'attente du userId
                        <div className="flex flex-col items-center justify-center py-8">
                            <i className="fa-solid fa-circle-notch fa-spin text-4xl text-zen-sage dark:text-zen-dark-sage mb-4"></i>
                            <p className="text-zen-muted dark:text-zen-dark-muted text-sm">Connexion en cours...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleCreateRoom} className="space-y-6">
                            {/* Toggle pour le mot de passe */}
                            <div className="flex items-center justify-between p-4 bg-zen-surface dark:bg-zen-dark-surface rounded-xl border border-zen-border dark:border-zen-dark-border">
                                <div className="flex items-center gap-3">
                                    <i className="fa-solid fa-lock text-zen-stone dark:text-zen-dark-stone"></i>
                                    <div>
                                        <label className="text-sm font-bold text-zen-text dark:text-zen-dark-text block">
                                            Room privée
                                        </label>
                                        <span className="text-xs text-zen-muted dark:text-zen-dark-muted">Avec mot de passe</span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setRequiresPassword(!requiresPassword)}
                                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                                        requiresPassword ? 'bg-zen-sage dark:bg-zen-dark-sage' : 'bg-zen-muted/30'
                                    }`}
                                >
                                    <span
                                        className={`inline-block h-5 w-5 transform rounded-full bg-white dark:bg-zen-dark-surface shadow-md transition-transform ${
                                            requiresPassword ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                    />
                                </button>
                            </div>

                            {/* Champ mot de passe */}
                            {requiresPassword && (
                                <div className="space-y-2 animate-[fadeIn_0.3s_ease-in-out]">
                                    <label htmlFor="password" className="block text-sm font-bold text-zen-text dark:text-zen-dark-text">
                                        Mot de passe
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="password"
                                            id="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full px-4 py-3 bg-zen-surface dark:bg-zen-dark-surface border border-zen-border dark:border-zen-dark-border rounded-xl text-zen-text dark:text-zen-dark-text placeholder:text-zen-muted dark:text-zen-dark-muted/60 focus:outline-none focus:border-zen-sage focus:ring-2 focus:ring-zen-sage/20 transition-all"
                                            placeholder="Entrez un mot de passe"
                                            required={requiresPassword}
                                        />
                                        <i className="fa-solid fa-key absolute right-4 top-1/2 -translate-y-1/2 text-zen-muted dark:text-zen-dark-muted"></i>
                                    </div>
                                </div>
                            )}

                            {/* Message d'erreur */}
                            {error && (
                                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                                    <i className="fa-solid fa-circle-exclamation"></i>
                                    <span>{error}</span>
                                </div>
                            )}

                            {/* Boutons */}
                            <div className="flex flex-col gap-3 pt-2">
                                <button
                                    type="submit"
                                    className="btn-create w-full py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 group relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={loading || !userId}
                                >
                                    {loading ? (
                                        <>
                                            <i className="fa-solid fa-circle-notch fa-spin"></i>
                                            <span>Création en cours...</span>
                                        </>
                                    ) : (
                                        <>
                                            <i className="fa-solid fa-plus"></i>
                                            <span>Créer la room</span>
                                        </>
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => navigate('/')}
                                    className="w-full py-3.5 rounded-xl font-bold text-base bg-zen-surface dark:bg-zen-dark-surface hover:bg-zen-bg dark:hover:bg-zen-dark-bg dark:bg-zen-dark-bg border border-zen-border dark:border-zen-dark-border text-zen-stone dark:text-zen-dark-stone hover:text-zen-text dark:text-zen-dark-text transition-all"
                                    disabled={loading}
                                >
                                    Annuler
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </main>
        </div>
    );
}
