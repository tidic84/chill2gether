// src/components/Chat/Chat.jsx
import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { Send, Smile } from "lucide-react";
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
        <div className="flex flex-col h-full bg-white relative">
            {/* Chat Header */}
            <div className="p-3 flex justify-between items-center border-b border-zen-warm-stone">
                <span className="text-xs font-bold text-zen-stone uppercase tracking-widest px-2">
                    Live Chat
                </span>
                <span className="text-xs bg-zen-cream text-zen-dark-stone px-2 py-0.5 rounded text-[10px] font-bold border border-zen-warm-stone">
                    EN LIGNE
                </span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((m, i) => {
                    // Alternate colors for different users
                    const isCurrentUser = false; // TODO: compare with actual current user
                    const colorClass = isCurrentUser
                        ? 'bg-zen-sage text-white'
                        : 'bg-zen-cream text-zen-charcoal border border-zen-warm-stone';
                    const roundedClass = isCurrentUser
                        ? 'rounded-2xl rounded-br-sm'
                        : 'rounded-2xl rounded-bl-sm';

                    return (
                        <div
                            key={i}
                            className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}
                        >
                            <div className="max-w-[85%]">
                                {!isCurrentUser && (
                                    <p className="text-[10px] font-bold text-zen-stone mb-1 ml-1">
                                        {m.username}
                                    </p>
                                )}
                                <div className={`px-4 py-2.5 text-sm font-medium shadow-sm ${colorClass} ${roundedClass}`}>
                                    {m.message}
                                </div>
                                <p className="text-[10px] text-zen-stone mt-1 ml-1">
                                    {formatTime(m.timestamp)}
                                </p>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white mt-auto border-t border-zen-warm-stone">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        sendMessage();
                    }}
                    className="flex gap-2 bg-zen-light-cream p-1.5 rounded-full border border-zen-warm-stone focus-within:border-zen-terracotta focus-within:ring-2 focus-within:ring-zen-terracotta/10 transition-all shadow-sm"
                >
                    <input
                        ref={textareaRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm px-4 text-zen-charcoal placeholder-zen-stone outline-none"
                        placeholder="Écrire un message..."
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                sendMessage();
                            }
                        }}
                    />
                    <button
                        type="button"
                        className="p-2 text-zen-stone hover:text-zen-terracotta rounded-full hover:bg-zen-cream transition-colors"
                    >
                        <Smile size={20} />
                    </button>
                    <button
                        type="submit"
                        className="p-2 bg-zen-sage text-white rounded-full hover:bg-zen-sage/80 transition-all shadow-md center-content"
                    >
                        <Send size={16} className="mx-0.5" />
                    </button>
                </form>
            </div>
        </div>
    );

}
