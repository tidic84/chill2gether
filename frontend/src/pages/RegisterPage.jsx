import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const baseUrl = import.meta.env.VITE_BASE_URL; // équivalent à process.env.VUE_APP_BASE_URL

export default function RegisterPage() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        nom: "",
        email: "",
        password: "",
    });
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const handleChange = (e) => {
        setForm({ ...form, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.nom.trim() || !form.email.trim() || !form.password.trim()) {
            setErrorMessage("Veuillez remplir tous les champs.");
            return;
        }

        try {
            setLoading(true);
            setErrorMessage("");

            // 1️⃣ Inscription
            const response = await fetch(`${baseUrl}/api/users/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
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
                navigate("/dashboard"); // redirection après inscription
            }
        } catch (error) {
            console.error("Erreur lors de l'inscription/connexion :", error);
            setErrorMessage("Une erreur est survenue. Veuillez réessayer.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 relative">
            {/* Bouton retour placé en haut à gauche */}
            <div className="absolute top-4 left-4">
                <Link to="/">
                    <button
                        type="button"
                        className="bg-blue-800 text-white py-2 px-6 rounded transition duration-300 hover:bg-blue-700"
                    >
                        ← Retour
                    </button>
                </Link>
            </div>

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md w-80">
                <h2 className="text-2xl font-bold mb-4">Créer un compte</h2>

                <div className="mb-4">
                    <label htmlFor="nom" className="block text-sm font-medium text-gray-700">
                        Nom
                    </label>
                    <input
                        id="nom"
                        type="text"
                        value={form.nom}
                        onChange={handleChange}
                        required
                        className="mt-1 w-full px-3 py-2 border rounded"
                    />
                </div>

                <div className="mb-4">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email
                    </label>
                    <input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                        className="mt-1 w-full px-3 py-2 border rounded"
                    />
                </div>

                <div className="mb-4">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                        Mot de passe
                    </label>
                    <input
                        id="password"
                        type="password"
                        value={form.password}
                        onChange={handleChange}
                        required
                        className="mt-1 w-full px-3 py-2 border rounded"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full bg-blue-600 text-white py-2 rounded transition duration-300 hover:bg-blue-700 ${loading ? "opacity-60 cursor-not-allowed" : ""
                        }`}
                >
                    {loading ? "Inscription..." : "S'inscrire"}
                </button>

                <Link to="/login">
                    <button
                        type="button"
                        className="w-full my-1 bg-blue-600 text-white py-2 rounded transition duration-300 hover:bg-blue-700"
                    >
                        Déjà un compte ? Se connecter
                    </button>
                </Link>

                {errorMessage && <p className="text-red-500 mt-2">{errorMessage}</p>}
            </form>
        </div>
    );
}
