// src/components/Chat/Chat.jsx
import { useEffect, useState } from "react";
import { io } from "socket.io-client";

// ICI AJOUTER AUSSI LE NOM DE L'USER ET L'HEURE DU MESSAGE
// + METTRE EN PLACE CÔTÉ SERVEUR

const socket = io("http://localhost:5173)");

export default function Chat() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");

    // Écoute les nouveaux messages
    useEffect(() => {
        socket.on("chat message", (msg) => {
            setMessages((prev) => [...prev, msg]);
        });

        return () => {
            socket.off("chat message");
        };
    }, []);

    // Envoi d'un message
    const sendMessage = () => {
        if (input.trim()) {
            socket.emit("chat message", input);
            setInput("");
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto mb-2 space-y-1">
                {messages.map((m, i) => (
                    <div key={i} className="bg-gray-200 rounded px-2 py-1 text-sm">
                        {m}
                    </div>
                ))}
            </div>

            {/* Champ d'envoi */}
            <div className="flex">
                <input
                    className="flex-1 border rounded-l px-2 py-1"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Écris ton message..."
                />
                <button
                    onClick={sendMessage}
                    className="bg-blue-500 text-white px-3 rounded-r"
                >
                    Envoyer
                </button>
            </div>
        </div>
    );
}
