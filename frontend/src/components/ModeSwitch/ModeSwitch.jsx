import { MonitorPlay, PenTool } from "lucide-react";

export default function ModeSwitch({ mode, onSwitch, disabled = false }) {
    return (
        <div className="flex items-center bg-zen-light-cream border border-zen-warm-stone rounded-full p-1 shadow-sm">
            <button
                onClick={() => onSwitch('video')}
                disabled={disabled}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    mode === 'video'
                        ? 'bg-white text-zen-text shadow-sm'
                        : 'text-zen-stone hover:text-zen-text'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                <MonitorPlay size={16} />
                Video
            </button>
            <button
                onClick={() => onSwitch('course')}
                disabled={disabled}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    mode === 'course'
                        ? 'bg-white text-zen-text shadow-sm'
                        : 'text-zen-stone hover:text-zen-text'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                <PenTool size={16} />
                Cours
            </button>
        </div>
    );
}
