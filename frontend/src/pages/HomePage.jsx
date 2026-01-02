import { Link, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import Carousel from "../components/Carousel/Carousel";
import SpotlightCard from "../components/SpotlightCard/SpotlightCard";
import Stepper, { Step } from "../components/Stepper/Stepper";
import GridMotion from "../components/GridMotion/GridMotion";
import { useSocket } from "../contexts/SocketContext";
import { roomApi } from "../services/api";

export default function HomePage() {
    const [showTutorial, setShowTutorial] = useState(false);
    const [name, setName] = useState("");
    const [joinCode, setJoinCode] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [error, setError] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const inputRef = useRef(null);
    const navigate = useNavigate();
    const socket = useSocket();

    useEffect(() => {
        socket.on("connect", () => {
            console.log("Connected to server");
        });
    }, [socket]);

    useEffect(() => {
        socket.on("disconnect", () => {
            console.log("Disconnected from server");
        });
    }, [socket]);

    const createInstantRoom = () => {
        setIsCreating(true);

        // Génération d'un ID aléatoire style "ZEN-XXXX"
        const randomId = "ZEN-" + Math.floor(1000 + Math.random() * 9000);

        setTimeout(() => {
            navigate(`/create-room`);
            setIsCreating(false);
        }, 1000);
    };

    const handleJoinRoom = async () => {
        const code = joinCode.trim();

        if (code === "") {
            setError(true);
            setErrorMessage("Veuillez entrer un code de room");
            setTimeout(() => {
                setError(false);
                setErrorMessage("");
            }, 3000);
            inputRef.current?.focus();
            return;
        }

        setIsJoining(true);
        setError(false);
        setErrorMessage("");

        try {
            // Vérifier si la room existe
            await roomApi.getRoom(code);

            // Si la room existe, naviguer vers elle
            setTimeout(() => {
                navigate(`/room/${code}`);
                setIsJoining(false);
            }, 800);
        } catch (err) {
            // Si la room n'existe pas
            setError(true);
            setErrorMessage("Cette room n'existe pas");
            setIsJoining(false);
            setTimeout(() => {
                setError(false);
                setErrorMessage("");
            }, 3000);
            inputRef.current?.focus();
        }
    };

    const handleInputChange = (e) => {
        setJoinCode(e.target.value.toUpperCase());
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter") {
            handleJoinRoom();
        }
    };

    return (
        <div className="flex flex-col h-screen selection:bg-zen-sage/20 selection:text-zen-sage overflow-hidden">
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
                        chill
                        <span className="text-zen-muted font-medium">2gether</span>
                    </h1>
                </Link>

                <div className="flex items-center gap-6">
                    <Link
                        to="/login"
                        className="hidden md:block text-sm font-semibold text-zen-muted hover:text-zen-sage transition-colors"
                    >
                        Se connecter
                    </Link>
                    <Link
                        to="/register"
                        className="px-6 py-2.5 rounded-full bg-white border border-zen-border text-zen-text text-sm font-bold hover:border-zen-sage hover:text-zen-sage transition-all shadow-sm"
                    >
                        S'inscrire
                    </Link>
                </div>
            </nav>

            {/* Main Content */}
            <main className="flex-grow flex flex-col justify-center items-center px-6 relative z-10 w-full max-w-4xl mx-auto">
                <div className="w-full text-center flex flex-col items-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-zen-border text-xs font-bold text-zen-stone shadow-sm mb-6">
                        <span className="w-2 h-2 rounded-full bg-zen-sage animate-pulse"></span>
                        Espace de détente partagé
                    </div>

                    {/* Titre */}
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-zen-text leading-[1.1] mb-6">
                        Prenez le temps,
                        <br />
                        <span className="relative inline-block">
                            <span className="relative z-10 text-zen-sage">
                                ensemble.
                            </span>
                            <span className="absolute bottom-2 left-0 w-full h-3 bg-zen-clay/20 -rotate-2 -z-0 rounded-full"></span>
                        </span>
                    </h1>

                    <p className="text-lg text-zen-stone max-w-lg mx-auto leading-relaxed font-medium mb-12">
                        Écoutez de la musique, regardez des vidéos ou discutez.
                        <br />Un espace calme, sans inscription.
                    </p>

                    {/* Actions Container */}
                    <div className="w-full max-w-sm space-y-6">
                        {/* 1. GROS BOUTON CRÉER */}
                        <button
                            onClick={createInstantRoom}
                            disabled={isCreating}
                            className="btn-create w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 group relative overflow-hidden disabled:opacity-90 disabled:pointer-events-none"
                        >
                            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                            {isCreating ? (
                                <>
                                    <i className="fa-solid fa-circle-notch fa-spin"></i>
                                    <span className="relative">Génération...</span>
                                </>
                            ) : (
                                <>
                                    <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:rotate-90 transition-transform duration-300">
                                        <i className="fa-solid fa-plus text-sm"></i>
                                    </span>
                                    <span className="relative">Créer une room</span>
                                </>
                            )}
                        </button>

                        {/* Séparateur "OU" */}
                        <div className="flex items-center gap-4 w-full opacity-60">
                            <div className="h-px bg-zen-muted/40 flex-1"></div>
                            <span className="text-xs font-bold text-zen-muted uppercase tracking-widest">
                                ou
                            </span>
                            <div className="h-px bg-zen-muted/40 flex-1"></div>
                        </div>

                        {/* 2. INPUT REJOINDRE */}
                        <div className="space-y-2">
                            <div
                                className={`join-input-container relative flex p-1.5 rounded-2xl w-full ${
                                    error ? "ring-2 ring-zen-clay animate-pulse" : ""
                                }`}
                            >
                                <input
                                    ref={inputRef}
                                    type="text"
                                    className="flex-grow bg-transparent text-zen-text px-4 py-2 outline-none font-medium text-base placeholder:text-zen-muted/70 text-center"
                                    placeholder="Entrer un code..."
                                    value={joinCode}
                                    onChange={handleInputChange}
                                    onKeyPress={handleKeyPress}
                                    maxLength={10}
                                    autoComplete="off"
                                />
                                <button
                                    onClick={handleJoinRoom}
                                    disabled={isJoining}
                                    className="px-5 py-2 rounded-xl bg-zen-surface hover:bg-zen-bg border border-transparent hover:border-zen-clay/30 text-zen-stone font-bold hover:text-zen-clay transition-all group"
                                    title="Rejoindre"
                                >
                                    {isJoining ? (
                                        <i className="fa-solid fa-circle-notch fa-spin"></i>
                                    ) : (
                                        <i className="fa-solid fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
                                    )}
                                </button>
                            </div>
                            {errorMessage && (
                                <p className="text-sm text-zen-clay font-medium text-center animate-pulse">
                                    {errorMessage}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Icons minimalistes */}
                    <div className="pt-16 flex justify-center gap-10 opacity-60">
                        <i
                            className="fa-brands fa-youtube text-2xl text-zen-stone brand-icon transition-all duration-300 cursor-pointer"
                            title="YouTube"
                        ></i>
                        <i
                            className="fa-brands fa-twitch text-2xl text-zen-stone brand-icon transition-all duration-300 cursor-pointer"
                            title="Twitch"
                        ></i>
                        <i
                            className="fa-solid fa-music text-2xl text-zen-stone brand-icon transition-all duration-300 cursor-pointer"
                            title="Musique"
                        ></i>
                    </div>
                </div>
            </main>

            {/* Footer Discret */}
            <footer className="absolute bottom-8 w-full text-center z-50">
                <div className="text-xs font-bold text-zen-muted/60 flex justify-center gap-8 uppercase tracking-widest">
                    <a
                        href="#"
                        className="hover:text-zen-sage transition-colors"
                    >
                        Concept
                    </a>
                    <a
                        href="#"
                        className="hover:text-zen-sage transition-colors"
                    >
                        Support
                    </a>
                </div>
            </footer>
        </div>
    );
}
