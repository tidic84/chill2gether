import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const baseUrl = import.meta.env.VITE_BACKEND_URL;

export default function RegisterPage() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        nom: "",
        email: "",
        password: "",
        confirm: "",
    });
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const handleChange = (e) => {
        setForm({ ...form, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.nom.trim() || !form.email.trim() || !form.password.trim() || !form.confirm.trim()) {
            setErrorMessage("Veuillez remplir tous les champs.");
            return;
        }
        if (form.password != form.confirm) {
          setErrorMessage("Les deux mot de passes doivent être identique.");
          return;
        }

        try {
            setLoading(true);
            setErrorMessage("");

            // 1️⃣ Inscription
            const response = await fetch(`${baseUrl}/api/users/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: form.email, username: form.nom, password: form.password}),
            });

            const data = await response.json();

            if (!response.ok) {
                setErrorMessage(data.error || data.message || "Erreur lors de l'inscription.");
                return;
            }

            // 2️⃣ Connexion automatique
            const loginResponse = await fetch(`${baseUrl}/api/users/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: form.email.trim(),
                    password: form.password.trim(),
                }),
            });

            const loginData = await loginResponse.json();

            if (!loginResponse.ok) {
                setErrorMessage(loginData.error || loginData.message || "Erreur lors de la connexion.");
                return;
            }

            // 3️⃣ Sauvegarde du token + redirection
            if (loginData.token) {
                localStorage.setItem("token", loginData.token);
                navigate("/profile");
            }
        } catch (error) {
            console.error("Erreur lors de l'inscription/connexion :", error);
            setErrorMessage("Une erreur est survenue. Veuillez réessayer.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-screen selection:bg-zen-sage dark:bg-zen-dark-sage/20 selection:text-zen-sage dark:text-zen-dark-sage overflow-hidden bg-zen-bg dark:bg-zen-dark-bg">
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
                    className="flex items-center gap-2 text-sm font-semibold text-zen-muted dark:text-zen-dark-muted hover:text-zen-sage dark:hover:text-zen-dark-sage dark:text-zen-dark-sage transition-colors"
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
                        <div className="w-16 h-16 bg-zen-clay/10 dark:bg-zen-dark-clay/10 rounded-2xl flex items-center justify-center">
                            <i className="fa-solid fa-user-plus text-3xl text-zen-clay dark:text-zen-dark-clay"></i>
                        </div>
                    </div>

                    <h1 className="text-3xl font-bold text-center text-zen-text dark:text-zen-dark-text mb-2">Créer un compte</h1>
                    <p className="text-center text-zen-muted dark:text-zen-dark-muted text-sm mb-8">
                        Rejoignez la communauté chill2gether
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Nom */}
                        <div className="space-y-2">
                            <label htmlFor="nom" className="block text-sm font-bold text-zen-text dark:text-zen-dark-text">
                                Nom
                            </label>
                            <div className="relative">
                                <input
                                    id="nom"
                                    type="text"
                                    value={form.nom}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 bg-zen-surface dark:bg-zen-dark-surface border border-zen-border dark:border-zen-dark-border rounded-xl text-zen-text dark:text-zen-dark-text placeholder:text-zen-muted dark:text-zen-dark-muted/60 focus:outline-none focus:border-zen-clay focus:ring-2 focus:ring-zen-clay/20 transition-all"
                                    placeholder="Votre nom"
                                />
                                <i className="fa-solid fa-signature absolute right-4 top-1/2 -translate-y-1/2 text-zen-muted dark:text-zen-dark-muted"></i>
                            </div>
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <label htmlFor="email" className="block text-sm font-bold text-zen-text dark:text-zen-dark-text">
                                Email
                            </label>
                            <div className="relative">
                                <input
                                    id="email"
                                    type="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 bg-zen-surface dark:bg-zen-dark-surface border border-zen-border dark:border-zen-dark-border rounded-xl text-zen-text dark:text-zen-dark-text placeholder:text-zen-muted dark:text-zen-dark-muted/60 focus:outline-none focus:border-zen-clay focus:ring-2 focus:ring-zen-clay/20 transition-all"
                                    placeholder="votre@email.com"
                                />
                                <i className="fa-solid fa-envelope absolute right-4 top-1/2 -translate-y-1/2 text-zen-muted dark:text-zen-dark-muted"></i>
                            </div>
                        </div>

                        {/* Mot de passe */}
                        <div className="space-y-2">
                            <label htmlFor="password" className="block text-sm font-bold text-zen-text dark:text-zen-dark-text">
                                Mot de passe
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 bg-zen-surface dark:bg-zen-dark-surface border border-zen-border dark:border-zen-dark-border rounded-xl text-zen-text dark:text-zen-dark-text placeholder:text-zen-muted dark:text-zen-dark-muted/60 focus:outline-none focus:border-zen-clay focus:ring-2 focus:ring-zen-clay/20 transition-all"
                                    placeholder="••••••••"
                                />
                                <i className="fa-solid fa-lock absolute right-4 top-1/2 -translate-y-1/2 text-zen-muted dark:text-zen-dark-muted"></i>
                            </div>
                        </div>

                        {/* Confirmation Mot de passe */}
                        <div className="space-y-2">
                            <label htmlFor="confirm" className="block text-sm font-bold text-zen-text">
                              Confirmation
                            </label>
                            <div className="relative">
                                <input
                                    id="confirm"
                                    type="password"
                                    value={form.confirm}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 bg-zen-surface border border-zen-border rounded-xl text-zen-text placeholder:text-zen-muted/60 focus:outline-none focus:border-zen-clay focus:ring-2 focus:ring-zen-clay/20 transition-all"
                                    placeholder="••••••••"
                                />
                                <i className="fa-solid fa-lock absolute right-4 top-1/2 -translate-y-1/2 text-zen-muted"></i>
                            </div>
                        </div>

                        {/* Message d'erreur */}
                        {errorMessage && (
                            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                                <i className="fa-solid fa-circle-exclamation"></i>
                                <span>{errorMessage}</span>
                            </div>
                        )}

                        {/* Boutons */}
                        <div className="flex flex-col gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 bg-zen-clay dark:bg-zen-dark-clay text-white hover:bg-zen-clay dark:bg-zen-dark-clay/90 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <i className="fa-solid fa-circle-notch fa-spin"></i>
                                        <span>Inscription...</span>
                                    </>
                                ) : (
                                    <>
                                        <i className="fa-solid fa-check"></i>
                                        <span>S'inscrire</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-4 w-full opacity-60 my-6">
                        <div className="h-px bg-zen-muted/40 flex-1"></div>
                        <span className="text-xs font-bold text-zen-muted dark:text-zen-dark-muted uppercase tracking-widest">ou</span>
                        <div className="h-px bg-zen-muted/40 flex-1"></div>
                    </div>

                    {/* Lien connexion */}
                    <Link to="/login">
                        <button
                            type="button"
                            className="w-full py-3.5 rounded-xl font-bold text-base bg-zen-surface dark:bg-zen-dark-surface hover:bg-zen-bg dark:hover:bg-zen-dark-bg dark:bg-zen-dark-bg border border-zen-border dark:border-zen-dark-border text-zen-stone dark:text-zen-dark-stone hover:text-zen-text dark:text-zen-dark-text transition-all flex items-center justify-center gap-2"
                        >
                            <i className="fa-solid fa-arrow-right-to-bracket"></i>
                            <span>Déjà un compte ? Se connecter</span>
                        </button>
                    </Link>
                </div>
            </main>
        </div>
    );
}
