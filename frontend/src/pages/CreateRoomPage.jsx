import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { roomApi } from "../services/api";
import GridMotion from "../components/GridMotion/GridMotion";

export default function CreateRoomPage() {
    const navigate = useNavigate();
    const [requiresPassword, setRequiresPassword] = useState(false);
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleCreateRoom = async (e) => {
        e.preventDefault();
        setError(null);

        // Récupérer le userId depuis localStorage
        const userId = localStorage.getItem('anonymousUserId');

        if (!userId) {
            setError("Vous devez être connecté pour créer une room");
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
        <div className="relative min-h-screen overflow-hidden">
            
            <GridMotion className="absolute inset-0 -z-20" />

            <div className="relative z-10 flex flex-col items-center justify-center min-h-screen text-white">
                {/* Couche sombre semi-transparente */}
                <div className="absolute inset-0 z-0 bg-black/40 pointer-events-none" />

                <div className="relative z-10 w-full max-w-md p-8 bg-black/60 backdrop-blur-md rounded-xl shadow-lg">
                    <h1 className="text-3xl font-bold mb-6 text-center">Créer une Room</h1>

                    <form onSubmit={handleCreateRoom} className="space-y-6">
                        {/* Toggle pour le mot de passe */}
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">
                                Room privée (avec mot de passe)
                            </label>
                            <button
                                type="button"
                                onClick={() => setRequiresPassword(!requiresPassword)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                    requiresPassword ? 'bg-blue-600' : 'bg-gray-600'
                                }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        requiresPassword ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                        </div>

                        {/* Champ mot de passe (affiché si requiresPassword est true) */}
                        {requiresPassword && (
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
                                    placeholder="Entrez un mot de passe"
                                    required={requiresPassword}
                                />
                            </div>
                        )}

                        {/* Message d'erreur */}
                        {error && (
                            <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-200 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Boutons */}
                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => navigate('/')}
                                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg font-semibold transition"
                                disabled={loading}
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={loading}
                            >
                                {loading ? 'Création...' : 'Créer la room'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
