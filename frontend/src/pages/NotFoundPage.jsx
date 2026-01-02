import { Link } from "react-router-dom";
import GridMotion from "../components/GridMotion/GridMotion";

export default function NotFoundPage() {
    return (
        <div className="relative min-h-screen overflow-hidden bg-zen-bg dark:bg-zen-dark-bg">
            <GridMotion className="absolute inset-0 -z-20" />

            <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
                <div className="absolute inset-0 z-0 bg-zen-stone/10 dark:bg-zen-dark-stone/10 pointer-events-none" />

                <div className="relative z-10 text-center p-8 bg-zen-surface dark:bg-zen-dark-surface backdrop-blur-md rounded-2xl shadow-xl border border-zen-border dark:border-zen-dark-border max-w-md py-20">

                    {/* 404 Number */}
                    <h1 className="text-7xl font-bold mb-4 text-zen-clay dark:text-zen-dark-clay">404</h1>

                    {/* Message */}
                    <h2 className="text-2xl font-semibold mb-2 text-zen-text dark:text-zen-dark-text">
                        Page introuvable
                    </h2>
                    <p className="text-zen-muted dark:text-zen-dark-muted mb-8 leading-relaxed">
                        Oups ! La page que vous recherchez n'existe pas ou a été déplacée.
                    </p>

                    {/* Actions */}
                    <div className="flex flex-col gap-3">
                        <Link
                            to="/"
                            className="px-6 py-3 bg-zen-sage dark:bg-zen-dark-sage hover:bg-zen-sage/80 dark:hover:bg-zen-dark-sage/80 text-white rounded-lg font-semibold transition shadow-md hover:shadow-lg"
                        >
                            Retour à l'accueil
                        </Link>
                        <Link
                            to="/create-room"
                            className="px-6 py-3 bg-zen-bg dark:bg-zen-dark-bg hover:bg-zen-border dark:hover:bg-zen-dark-border text-zen-text dark:text-zen-dark-text border border-zen-border dark:border-zen-dark-border rounded-lg font-semibold transition"
                        >
                            Créer une room
                        </Link>
                    </div>

                    {/* Decoration */}
                    <div className="mt-8 pt-6 border-t border-zen-border dark:border-zen-dark-border">
                        <p className="text-xs text-zen-stone dark:text-zen-dark-stone">
                            Besoin d'aide ? Contactez le support
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
