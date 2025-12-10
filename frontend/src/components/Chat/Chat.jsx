// src/components/Chat/Chat.jsx
import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import socket from "../../services/socket";

export default function Chat() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const textareaRef = useRef(null);
    const messagesEndRef = useRef(null);
    const { roomId } = useParams();

    function autoResize(textarea) {
        textarea.style.height = "auto";
        textarea.style.height = textarea.scrollHeight + "px";
    }

    useEffect(() => {
        if (textareaRef.current) {
            autoResize(textareaRef.current);
        }
    }, [input]);

    // Auto-scroll vers le bas quand de nouveaux messages arrivent
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Écoute les nouveaux messages
    useEffect(() => {
        if (!roomId) return;

        const handleChatMessage = (msg) => {
            setMessages((prev) => [...prev, msg]);
        };

        socket.on("chat-message", handleChatMessage);

        return () => {
            socket.off("chat-message", handleChatMessage);
        };
    }, [roomId]);

    // Envoi d'un message
    const sendMessage = () => {
        if (input.trim() && roomId) {
            socket.emit("chat-message", {
                roomId,
                message: input
            });
            setInput("");
        }
    };

    // Formater l'heure
    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="flex flex-col h-full bg-gray-900 text-gray-100 p-4">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto mb-3 space-y-3 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800">
                {messages.map((m, i) => (
                    <div
                        key={i}
                        className="bg-gray-800 rounded-2xl px-3 py-2 shadow-sm"
                    >
                        <div className="flex items-baseline justify-between mb-1">
                            <span className="text-xs font-semibold text-blue-400">
                                {m.username}
                            </span>
                            <span className="text-xs text-gray-500">
                                {formatTime(m.timestamp)}
                            </span>
                        </div>
                        <div className="text-sm text-gray-100">
                            {m.message}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
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
