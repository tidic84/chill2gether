import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const baseUrl = import.meta.env.VITE_BACKEND_URL;

export default function LoginPage() {
    const navigate = useNavigate();
    const { login: authLogin } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(null);

        if (!email.trim() || !password.trim()) {
            setError("Veuillez remplir tous les champs.");
            return;
        }

        setLoading(true);

        try {
            await authLogin(email.trim(), password.trim());
            navigate("/profile");
        } catch (err) {
            setError(err.message || "Erreur lors de la connexion.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-screen selection:bg-zen-sage/20 selection:text-zen-sage overflow-hidden bg-zen-bg">
            {/* Background Ambiance */}
            <div className="organic-shape shape-sage"></div>
            <div className="organic-shape shape-clay"></div>

            {/* Navbar */}
            <nav className="w-full z-50 py-6 px-8 flex justify-between items-center fixed top-0 left-0 bg-transparent">
                <Link to="/" className="flex items-center gap-3 cursor-pointer group">
                    <div className="w-10 h-10 bg-zen-sage rounded-xl flex items-center justify-center text-zen-bg shadow-md shadow-zen-sage/20 group-hover:scale-105 transition-transform duration-300">
                        <i className="fa-solid fa-mug-hot text-lg"></i>
                    </div>
                    <h1 className="text-xl font-bold tracking-tight text-zen-text">
                        chill<span className="text-zen-muted font-medium">2gether</span>
                    </h1>
                </Link>

                <Link
                    to="/"
                    className="flex items-center gap-2 text-sm font-semibold text-zen-muted hover:text-zen-sage transition-colors"
                >
                    <i className="fa-solid fa-arrow-left"></i>
                    <span className="hidden md:inline">Retour</span>
                </Link>
            </nav>

            {/* Main Content */}
            <main className="flex-grow flex flex-col justify-center items-center px-6 relative z-10 w-full max-w-md mx-auto">
                <div className="w-full bg-white rounded-3xl shadow-lg border border-zen-border p-8">

                    {/* Icon Header */}
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 bg-zen-sage/10 rounded-2xl flex items-center justify-center">
                            <i className="fa-solid fa-user text-3xl text-zen-sage"></i>
                        </div>
                    </div>

                    <h1 className="text-3xl font-bold text-center text-zen-text mb-2">Connexion</h1>
                    <p className="text-center text-zen-muted text-sm mb-8">
                        Accédez à votre espace personnel
                    </p>

                    <form onSubmit={handleLogin} className="space-y-5">
                        {/* Email */}
                        <div className="space-y-2">
                            <label htmlFor="email" className="block text-sm font-bold text-zen-text">
                                Email
                            </label>
                            <div className="relative">
                                <input
                                    id="email"
                                    type="email"
                                    className="w-full px-4 py-3 bg-zen-surface border border-zen-border rounded-xl text-zen-text placeholder:text-zen-muted/60 focus:outline-none focus:border-zen-sage focus:ring-2 focus:ring-zen-sage/20 transition-all"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="votre@email.com"
                                    required
                                />
                                <i className="fa-solid fa-envelope absolute right-4 top-1/2 -translate-y-1/2 text-zen-muted"></i>
                            </div>
                        </div>

                        {/* Mot de passe */}
                        <div className="space-y-2">
                            <label htmlFor="password" className="block text-sm font-bold text-zen-text">
                                Mot de passe
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type="password"
                                    className="w-full px-4 py-3 bg-zen-surface border border-zen-border rounded-xl text-zen-text placeholder:text-zen-muted/60 focus:outline-none focus:border-zen-sage focus:ring-2 focus:ring-zen-sage/20 transition-all"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                />
                                <i className="fa-solid fa-lock absolute right-4 top-1/2 -translate-y-1/2 text-zen-muted"></i>
                            </div>
                        </div>

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
                                disabled={loading}
                                className="btn-create w-full py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <i className="fa-solid fa-circle-notch fa-spin"></i>
                                        <span>Connexion...</span>
                                    </>
                                ) : (
                                    <>
                                        <i className="fa-solid fa-arrow-right"></i>
                                        <span>Se connecter</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-4 w-full opacity-60 my-6">
                        <div className="h-px bg-zen-muted/40 flex-1"></div>
                        <span className="text-xs font-bold text-zen-muted uppercase tracking-widest">ou</span>
                        <div className="h-px bg-zen-muted/40 flex-1"></div>
                    </div>

                    {/* Lien inscription */}
                    <Link to="/register">
                        <button
                            type="button"
                            className="w-full py-3.5 rounded-xl font-bold text-base bg-zen-surface hover:bg-zen-bg border border-zen-border text-zen-stone hover:text-zen-text transition-all flex items-center justify-center gap-2"
                        >
                            <i className="fa-solid fa-user-plus"></i>
                            <span>Créer un compte</span>
                        </button>
                    </Link>
                </div>
            </main>
        </div>
    );
}
