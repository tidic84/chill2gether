import { MonitorPlay, PenTool, Pencil } from "lucide-react";

export default function ModeSwitch({ mode, onSwitch, disabled = false }) {
    const modes = [
        { id: 'video', label: 'Video', icon: MonitorPlay },
        { id: 'annotation', label: 'Annoter', icon: Pencil },
        { id: 'course', label: 'Cours', icon: PenTool },
    ];

    return (
        <div className="flex items-center bg-zen-light-cream border border-zen-warm-stone rounded-full p-1 shadow-sm">
            {modes.map(({ id, label, icon: Icon }) => (
                <button
                    key={id}
                    onClick={() => onSwitch(id)}
                    disabled={disabled}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        mode === id
                            ? 'bg-white text-zen-text shadow-sm'
                            : 'text-zen-stone hover:text-zen-text'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <Icon size={16} />
                    {label}
                </button>
            ))}
        </div>
    );
}
