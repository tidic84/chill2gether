import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export default function ThemeToggle() {
    const { isDark, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-zen-surface dark:bg-zen-dark-surface border border-zen-border dark:border-zen-dark-border text-zen-text dark:text-zen-dark-text hover:scale-105 transition-all shadow-sm"
            title={isDark ? "Mode clair" : "Mode sombre"}
        >
            {isDark ? (
                <Sun size={18} className="text-zen-dark-sage" />
            ) : (
                <Moon size={18} className="text-zen-sage" />
            )}
        </button>
    );
}
