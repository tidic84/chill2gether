import { Link } from "react-router-dom";

export default function HomePage() {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-950 text-white">
            <h1 className="text-4xl font-bold mb-8">Chill2Gether</h1>

            <div className="flex flex-col sm:flex-row gap-4">
                <Link
                    to="/login"
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold transition"
                >
                    Se connecter
                </Link>

                <Link
                    to="/register"
                    className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-semibold transition"
                >
                    Créer un compte
                </Link>
            </div>
        </div>
    );
}
