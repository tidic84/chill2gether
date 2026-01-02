import { Coffee, Copy } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Header({ roomCode }) {
    const [copied, setCopied] = useState(false);

    const handleCopyCode = () => {
        if (roomCode) {
            navigator.clipboard.writeText(roomCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <header className="relative top-0 z-50 bg-white/90 backdrop-blur-md border-b border-zen-warm-stone px-6 py-4 shadow-sm">
            <div className="max-w-[1600px] mx-auto flex justify-between items-center">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-3 cursor-pointer group">
                    <div className="w-10 h-10 bg-zen-sage rounded-xl flex items-center justify-center text-zen-bg shadow-md shadow-zen-sage/20 group-hover:scale-105 transition-transform duration-300">
                        <i className="fa-solid fa-mug-hot text-lg"></i>
                    </div>
                    <h1 className="text-xl font-bold tracking-tight text-zen-text">
                        chill<span className="text-zen-muted font-medium">2gether</span>
                    </h1>
                </Link>

                {/* Room Code - Only show if roomCode exists */}
                {roomCode && (
                    <div
                        onClick={handleCopyCode}
                        className="flex items-center gap-4 bg-zen-light-cream border border-zen-warm-stone pl-5 pr-2 py-1.5 rounded-full shadow-sm hover:shadow-md hover:border-zen-sage/30 transition-all cursor-pointer group"
                    >
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-zen-sage animate-pulse"></div>
                            <span className="text-sm font-bold text-zen-medium-stone tracking-wide">
                                {roomCode}
                            </span>
                        </div>
                        <div className="h-4 w-px bg-zen-warm-stone"></div>
                        <div className="w-8 h-8 rounded-full bg-white border border-zen-warm-stone flex items-center justify-center text-zen-stone group-hover:text-zen-sage group-hover:border-zen-sage/50 transition-all">
                            {copied ? (
                                <span className="text-xs font-bold">✓</span>
                            ) : (
                                <Copy size={14} strokeWidth={2} />
                            )}
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
