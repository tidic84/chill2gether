import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const baseUrl = import.meta.env.VITE_BASE_URL; // équivalent à process.env.VUE_APP_BASE_URL

export default function LoginPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);

    const login = async (e) => {
        e.preventDefault();
        setError(null);

        if (!email.trim() || !password.trim()) {
            setError("Veuillez remplir tous les champs.");
            return;
        }

        try {
            const response = await fetch(`${baseUrl}/api/users/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: email.trim(),
                    password: password.trim(),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || data.message || "Erreur lors de la connexion.");
                return;
            }

            if (data.token) {
                localStorage.setItem("token", data.token);
                // tu pourrais aussi stocker user + token dans un context ou redux si tu veux
                navigate("/dashboard"); // Redirection vers la page dashboard
            }
        } catch {
            setError("Impossible de se connecter au serveur. Veuillez réessayer.");
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

            <form onSubmit={login} className="bg-white p-6 rounded shadow-md w-80">
                <h2 className="text-2xl font-bold mb-4">Connexion</h2>

                <div className="mb-4">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email
                    </label>
                    <input
                        id="email"
                        type="email"
                        className="mt-1 w-full px-3 py-2 border rounded"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div className="mb-4">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                        Mot de passe
                    </label>
                    <input
                        id="password"
                        type="password"
                        className="mt-1 w-full px-3 py-2 border rounded"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-2 rounded transition duration-300 hover:bg-blue-700"
                >
                    Se connecter
                </button>

                <Link to="/register">
                    <button
                        type="button"
                        className="w-full my-1 bg-blue-600 text-white py-2 rounded transition duration-300 hover:bg-blue-700"
                    >
                        Créer un compte
                    </button>
                </Link>

                {error && <p className="text-red-500 mt-2">{error}</p>}
            </form>
        </div>
    );
}
