// src/components/Chat/Chat.jsx
import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

// ICI AJOUTER AUSSI LE NOM DE L'USER ET L'HEURE DU MESSAGE
// + METTRE EN PLACE CÔTÉ SERVEUR

const socket = io("http://localhost:5173)");

export default function Chat() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const textareaRef = useRef(null);

    function autoResize(textarea) {
        textarea.style.height = "auto";
        textarea.style.height = textarea.scrollHeight + "px";
    }

    useEffect(() => {
        if (textareaRef.current) {
            autoResize(textareaRef.current);
        }
    }, [input]);

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
        <div className="flex flex-col h-full bg-gray-900 text-gray-100 p-4">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto mb-3 space-y-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800">
                {messages.map((m, i) => (
                    <div
                        key={i}
                        className="bg-gray-800 rounded-2xl px-3 py-2 text-sm max-w-[80%] shadow-sm"
                    >
                        {m}
                    </div>
                ))}
            </div>

            {/* Champ d'envoi */}
            <div className="flex items-end gap-2 border border-gray-700 rounded-2xl bg-gray-800 px-3 py-2">
                <textarea
                    ref={textareaRef}
                    className="flex-1 bg-transparent outline-none text-sm placeholder-gray-400 resize-none overflow-hidden"
                    value={input}
                    onChange={(e) => {
                        setInput(e.target.value);
                        autoResize(e.target);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                        }
                    }}
                    placeholder="Écris ton message ... "
                    rows={1}
                />
                <button
                    onClick={sendMessage}
                    className="bg-gray-200 hover:bg-gray-400  transition-colors text-black text-sm font-medium px-4 py-1 rounded-xl shadow-sm"
                >
                    Envoyer
                </button>
            </div>
        </div>
    );

}
