import { Link } from "react-router-dom";
import Carousel from "../components/Carousel/Carousel";
import SpotlightCard from "../components/SpotlightCard/SpotlightCard";
import Stepper, { Step } from "../components/Stepper/Stepper";
import Particles from "../components/Particles/Particles";
import PastelBackground from "../components/PastelBackground/PastelBackground";

import { useState, useEffect } from "react";
import { useSocket } from "../contexts/SocketContext";

export default function HomePage() {
    const [showTutorial, setShowTutorial] = useState(false);
    const [name, setName] = useState("");
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

    return (
        <div className="relative min-h-screen overflow-hidden">
            {/* Particles derrière tout le contenu */}
            {/* push particles further back */}
            <div className="absolute inset-0 -z-20" aria-hidden="true">
                <Particles
                    particleColors={['#ffffff', '#ffffff']}
                    particleCount={200}
                    particleSpread={10}
                    speed={0.1}
                    particleBaseSize={100}
                    moveParticlesOnHover={true}
                    alphaParticles={false}
                    disableRotation={false}
                />
            </div>
            <PastelBackground className="absolute inset-0 -z-20" />

            {/* section background is now a semi-transparent overlay so particles stay visible */}
            <section className="relative z-10 flex flex-col items-center justify-center h-screen text-white">
                {/* couche sombre semi-transparente — plus claire et sans blur */}
                <div className="absolute inset-0 z-0 bg-black/40 pointer-events-none" />

                <h1 className="text-4xl font-bold mb-8">Chill2Gether</h1>

                {showTutorial && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                        <div
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                            onClick={() => setShowTutorial(false)}
                        />
                        <div className="relative z-10 w-full max-w-2xl p-6">
                            <Stepper
                                initialStep={1}
                                onStepChange={(step) => console.log(step)}
                                onFinalStepCompleted={() => {
                                    console.log("All steps completed!");
                                    setShowTutorial(false);
                                }}
                                backButtonText="Previous"
                                nextButtonText="Next"
                                className="rounded-xl"
                            >
                                <Step>
                                    <h2>Welcome to the React Bits stepper!</h2>
                                    <p>Check out the next step!</p>
                                </Step>
                                <Step>
                                    <h2>Step 2</h2>
                                    <img
                                        style={{
                                            height: "100px",
                                            width: "100%",
                                            objectFit: "cover",
                                            objectPosition: "center -70px",
                                            borderRadius: "15px",
                                            marginTop: "1em",
                                        }}
                                        src="https://www.purrfectcatgifts.co.uk/cdn/shop/collections/Funny_Cat_Cards_640x640.png?v=1663150894"
                                    />
                                    <p>Custom step content!</p>
                                </Step>
                                <Step>
                                    <h2>How about an input?</h2>
                                    <input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Your name?"
                                        className="w-full rounded border px-2 py-1 text-black"
                                    />
                                </Step>
                                <Step>
                                    <h2>Final Step</h2>
                                    <p>You made it!</p>
                                </Step>
                            </Stepper>
                        </div>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4">
                    <Link
                        to="/login"
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold transition"
                    >
                        Se connecter
                    </Link>
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

                <div className="absolute flex bottom-4 left-4 z-20">
                    <div
                        className="
              origin-bottom-left
              scale-[0.7] sm:scale-[0.8] md:scale-[0.9] lg:scale-[1.0] xl:scale-[1.1] 2xl:scale-[1.25]
              transition-transform duration-300
            "
                    >
                        <Carousel
                            baseWidth={300}
                            autoplay
                            autoplayDelay={4000}
                            pauseOnHover
                            loop
                            round={false}
                        />
                    </div>
                </div>

                <div className="absolute flex bottom-4 right-4 z-20">
                    <div
                        className="
              origin-bottom-right
              scale-[0.7] sm:scale-[0.8] md:scale-[0.9] lg:scale-[1.0] xl:scale-[1.1] 2xl:scale-[1.25]
              transition-transform duration-300
            "
                    >
                        <SpotlightCard
                            className="custom-spotlight-card"
                            spotlightColor="rgba(120, 13, 163, 0.53)"
                        >
                            <div className="p-4 text-left max-w-xs">
                                <h3 className="text-2xl font-extrabold text-white mb-2">
                                    Tutoriel
                                </h3>
                                <p className="text-sm text-slate-200 mb-2">
                                    Découvrez comment utiliser <br />
                                    <span className="font-semibold text-white">
                                        Chill2Gether
                                    </span>
                                    en quelques <br />
                                    <span className="font-semibold">étapes simples</span> :
                                </p>
                                <button
                                    onClick={() => setShowTutorial(true)}
                                    className="duration-350 flex items-center justify-center rounded-full bg-purple-700 py-1.5 px-3.5 font-medium tracking-tight text-white transition hover:bg-purple-800 active:bg-purple-900"
                                >
                                    Voir le tutoriel
                                </button>
                            </div>
                        </SpotlightCard>
                    </div>
                </div>
            </section>
        </div>
    );
}
