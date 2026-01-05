import { Coffee, Copy } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ThemeToggle from '../ThemeToggle/ThemeToggle';

export default function Header({ roomCode }) {
    const [copied, setCopied] = useState(false);
    const { isAuthenticated, user } = useAuth();

    const handleCopyCode = () => {
        if (roomCode) {
            navigator.clipboard.writeText(roomCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <header className="sticky top-0 z-50 bg-white/90 dark:bg-zen-dark-surface/90 backdrop-blur-md border-b border-zen-border dark:border-zen-dark-border px-6 py-4 shadow-sm">
            <div className="max-w-[1600px] mx-auto flex justify-between items-center">
                {/* Logo */} 
                <Link to="/" className="flex items-center gap-3 cursor-pointer group">
                    <div className="w-10 h-10 bg-zen-sage dark:bg-zen-dark-sage rounded-xl flex items-center justify-center text-white shadow-md shadow-zen-sage/20 group-hover:scale-105 transition-transform duration-300">
                        <i className="fa-solid fa-mug-hot text-lg"></i>
                    </div>
                    <h1 className="text-xl font-bold tracking-tight text-zen-text dark:text-zen-dark-text">
                        chill<span className="text-zen-muted dark:text-zen-dark-muted font-medium">2gether</span>
                    </h1>
                </Link>

                {/* Room Code, Profile & Theme Toggle */}
                <div className="flex items-center gap-4">
                    {roomCode && (
                        <div
                            onClick={handleCopyCode}
                            className="flex items-center gap-4 bg-zen-surface dark:bg-zen-dark-surface border border-zen-border dark:border-zen-dark-border pl-5 pr-2 py-1 rounded-full shadow-sm hover:shadow-md hover:border-zen-sage/30 dark:hover:border-zen-dark-sage/30 transition-all cursor-pointer group"
                        >
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-zen-sage dark:bg-zen-dark-sage animate-pulse"></div>
                                <span className="text-sm font-bold text-zen-stone dark:text-zen-dark-stone tracking-wide">
                                    {roomCode}
                                </span>
                            </div>
                            <div className="h-4 w-px bg-zen-border dark:bg-zen-dark-border"></div>
                            <div className="w-8 h-8 rounded-full bg-white dark:bg-zen-dark-bg border border-zen-border dark:border-zen-dark-border flex items-center justify-center text-zen-stone dark:text-zen-dark-stone group-hover:text-zen-sage dark:group-hover:text-zen-dark-sage group-hover:border-zen-sage/50 dark:group-hover:border-zen-dark-sage/50 transition-all">
                                {copied ? (
                                    <span className="text-xs font-bold">✓</span>
                                ) : (
                                    <Copy size={14} strokeWidth={2} />
                                )}
                            </div>
                        </div>
                    )}

                    {/* Profile Link - Only show if authenticated */}
                    {isAuthenticated && (
                        <Link
                            to="/profile"
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-zen-surface dark:bg-zen-dark-surface border border-zen-border dark:border-zen-dark-border text-zen-stone dark:text-zen-dark-stone hover:text-zen-sage dark:hover:text-zen-dark-sage hover:border-zen-sage/50 dark:hover:border-zen-dark-sage/50 transition-all"
                        >
                            <i className="fa-solid fa-user text-sm"></i>
                            <span className="text-sm font-bold hidden md:inline">{user?.username || user?.email}</span>
                        </Link>
                    )}

                    <ThemeToggle />
                </div>
            </div>
        </header>
    );
}
