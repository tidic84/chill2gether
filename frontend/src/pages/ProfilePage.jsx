import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSocket } from "../contexts/SocketContext";
import { useAuth } from "../contexts/AuthContext";

const baseUrl = import.meta.env.VITE_BACKEND_URL;

export default function ProfilePage() {
    const navigate = useNavigate();
    const socket = useSocket();
    const { updateUser: updateAuthUser } = useAuth();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // États pour l'édition
    const [isEditing, setIsEditing] = useState(false);
    const [editField, setEditField] = useState("");
    const [editValue, setEditValue] = useState("");
    const [editLoading, setEditLoading] = useState(false);

    // Charger les informations utilisateur
    useEffect(() => {
        const fetchUserData = async () => {
            const token = localStorage.getItem("token");

            if (!token) {
                navigate("/login");
                return;
            }

            try {
                const response = await fetch(`${baseUrl}/api/users/me`, {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    if (response.status === 403) {
                        localStorage.removeItem("token");
                        navigate("/login");
                        return;
                    }
                    throw new Error("Erreur lors de la récupération du profil");
                }

                const data = await response.json();
                setUser(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [navigate]);

    // Fonction de déconnexion
    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/login");
    };

    // Fonction pour démarrer l'édition d'un champ
    const startEdit = (field, currentValue) => {
        setEditField(field);
        setEditValue(currentValue || "");
        setIsEditing(true);
        setError(null);
        setSuccess(null);
    };

    // Fonction pour annuler l'édition
    const cancelEdit = () => {
        setIsEditing(false);
        setEditField("");
        setEditValue("");
    };

    // Fonction pour sauvegarder les modifications
    const saveEdit = async (e) => {
        e.preventDefault();
        setEditLoading(true);
        setError(null);
        setSuccess(null);

        const token = localStorage.getItem("token");

        try {
            const response = await fetch(`${baseUrl}/api/users/me`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    field: editField,
                    value: editValue,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Erreur lors de la mise à jour");
            }

            // Mettre à jour l'état local
            const updatedData = {
                [editField]: editField === "password" ? user[editField] : editValue,
            };

            setUser(prev => ({
                ...prev,
                ...updatedData,
            }));

            // Mettre à jour le contexte d'authentification (pour la navbar)
            if (editField !== "password") {
                updateAuthUser(updatedData);
            }

            // Si le username a été modifié, synchroniser avec Socket.IO
            if (editField === "username") {
                socket.emit('change-username', editValue);
            }

            setSuccess("Modification enregistrée avec succès");
            setIsEditing(false);
            setEditField("");
            setEditValue("");
        } catch (err) {
            setError(err.message);
        } finally {
            setEditLoading(false);
        }
    };

    // Fonction pour supprimer le compte
    const handleDeleteAccount = async () => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.")) {
            return;
        }

        const token = localStorage.getItem("token");

        try {
            const response = await fetch(`${baseUrl}/api/users/me`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error("Erreur lors de la suppression du compte");
            }

            localStorage.removeItem("token");
            navigate("/");
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-zen-bg">
                <i className="fa-solid fa-circle-notch fa-spin text-4xl text-zen-sage"></i>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen selection:bg-zen-sage/20 selection:text-zen-sage overflow-hidden bg-zen-bg">
            {/* Background Ambiance */}
            <div className="organic-shape shape-sage"></div>
            <div className="organic-shape shape-clay"></div>

            {/* Navbar */}
            <nav className="w-full z-50 py-6 px-8 flex justify-between items-center fixed top-0 left-0 bg-transparent">
                <Link to="/" className="flex items-center gap-3 cursor-pointer group">
                    <div className="w-10 h-10 bg-zen-sage rounded-xl flex items-center justify-center text-white shadow-md shadow-zen-sage/20 group-hover:scale-105 transition-transform duration-300">
                        <i className="fa-solid fa-mug-hot text-lg"></i>
                    </div>
                    <h1 className="text-xl font-bold tracking-tight text-zen-text">
                        chill<span className="text-zen-muted font-medium">2gether</span>
                    </h1>
                </Link>

                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-sm font-semibold text-zen-muted hover:text-zen-sage transition-colors"
                >
                    <i className="fa-solid fa-arrow-left"></i>
                    <span className="hidden md:inline">Retour</span>
                </button>
            </nav>

            {/* Main Content */}
            <main className="flex-grow flex flex-col justify-center items-center px-6 relative z-10 w-full max-w-2xl mx-auto pt-24 pb-12">
                <div className="w-full bg-white rounded-3xl shadow-lg border border-zen-border p-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-zen-sage/10 rounded-2xl flex items-center justify-center">
                                <i className="fa-solid fa-user text-3xl text-zen-sage"></i>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-zen-text">Mon profil</h1>
                                <p className="text-zen-muted text-sm">Gérez vos informations personnelles</p>
                            </div>
                        </div>
                    </div>

                    {/* Messages */}
                    {error && (
                        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm mb-4">
                            <i className="fa-solid fa-circle-exclamation"></i>
                            <span>{error}</span>
                        </div>
                    )}

                    {success && (
                        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm mb-4">
                            <i className="fa-solid fa-circle-check"></i>
                            <span>{success}</span>
                        </div>
                    )}

                    {/* User Info */}
                    {user && !isEditing && (
                        <div className="space-y-4">
                            {/* Email */}
                            <div className="flex items-center justify-between p-4 bg-zen-surface rounded-xl border border-zen-border">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-zen-muted uppercase tracking-wide mb-1">
                                        Email
                                    </label>
                                    <p className="text-zen-text font-medium">{user.email}</p>
                                </div>
                                <button
                                    onClick={() => startEdit("email", user.email)}
                                    className="ml-4 text-zen-sage hover:text-zen-sage/80 transition-colors"
                                >
                                    <i className="fa-solid fa-pen-to-square"></i>
                                </button>
                            </div>

                            {/* Username */}
                            <div className="flex items-center justify-between p-4 bg-zen-surface rounded-xl border border-zen-border">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-zen-muted uppercase tracking-wide mb-1">
                                        Nom d&apos;utilisateur
                                    </label>
                                    <p className="text-zen-text font-medium">{user.username || "Non défini"}</p>
                                </div>
                                <button
                                    onClick={() => startEdit("username", user.username)}
                                    className="ml-4 text-zen-sage hover:text-zen-sage/80 transition-colors"
                                >
                                    <i className="fa-solid fa-pen-to-square"></i>
                                </button>
                            </div>

                            {/* Mot de passe */}
                            <div className="flex items-center justify-between p-4 bg-zen-surface rounded-xl border border-zen-border">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-zen-muted uppercase tracking-wide mb-1">
                                        Mot de passe
                                    </label>
                                    <p className="text-zen-text font-medium">••••••••</p>
                                </div>
                                <button
                                    onClick={() => startEdit("password", "")}
                                    className="ml-4 text-zen-sage hover:text-zen-sage/80 transition-colors"
                                >
                                    <i className="fa-solid fa-pen-to-square"></i>
                                </button>
                            </div>

                            {/* Date de création */}
                            {user.created_at && (
                                <div className="p-4 bg-zen-surface rounded-xl border border-zen-border">
                                    <label className="block text-xs font-bold text-zen-muted uppercase tracking-wide mb-1">
                                        Membre depuis
                                    </label>
                                    <p className="text-zen-text font-medium">
                                        {new Date(user.created_at).toLocaleDateString("fr-FR", {
                                            day: "numeric",
                                            month: "long",
                                            year: "numeric",
                                        })}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Edit Form */}
                    {isEditing && (
                        <form onSubmit={saveEdit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-zen-text capitalize">
                                    {editField === "password" ? "Nouveau mot de passe" : editField}
                                </label>
                                <input
                                    type={editField === "password" ? "password" : editField === "email" ? "email" : "text"}
                                    className="w-full px-4 py-3 bg-zen-surface border border-zen-border rounded-xl text-zen-text placeholder:text-zen-muted/60 focus:outline-none focus:border-zen-sage focus:ring-2 focus:ring-zen-sage/20 transition-all"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    placeholder={editField === "password" ? "Nouveau mot de passe" : `Modifier ${editField}`}
                                    required
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    disabled={editLoading}
                                    className="flex-1 btn-create py-3 rounded-xl font-bold text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {editLoading ? (
                                        <>
                                            <i className="fa-solid fa-circle-notch fa-spin"></i>
                                            <span>Enregistrement...</span>
                                        </>
                                    ) : (
                                        <>
                                            <i className="fa-solid fa-check"></i>
                                            <span>Enregistrer</span>
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={cancelEdit}
                                    className="flex-1 py-3 rounded-xl font-bold text-base bg-zen-surface hover:bg-zen-bg border border-zen-border text-zen-stone hover:text-zen-text transition-all"
                                >
                                    Annuler
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Actions */}
                    {!isEditing && (
                        <div className="mt-8 space-y-3 pt-6 border-t border-zen-border">
                            <button
                                onClick={handleLogout}
                                className="w-full py-3 rounded-xl font-bold text-base bg-zen-surface hover:bg-zen-bg border border-zen-border text-zen-stone hover:text-zen-text transition-all flex items-center justify-center gap-2"
                            >
                                <i className="fa-solid fa-arrow-right-from-bracket"></i>
                                <span>Se déconnecter</span>
                            </button>

                            <button
                                onClick={handleDeleteAccount}
                                className="w-full py-3 rounded-xl font-bold text-base bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 hover:text-red-700 transition-all flex items-center justify-center gap-2"
                            >
                                <i className="fa-solid fa-trash"></i>
                                <span>Supprimer mon compte</span>
                            </button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
