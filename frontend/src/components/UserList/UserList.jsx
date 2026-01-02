import { Plus } from "lucide-react";

export default function UserList({ users = [] }) {
    // Palette de couleurs pour les avatars
    const avatarColors = [
        'bg-zen-sage text-white',
        'bg-zen-clay text-white',
        'bg-zen-stone text-white',
        'bg-zen-clay text-zen-text',
        'bg-zen-stone text-white',
    ];

    const getAvatarColor = (index) => {
        return avatarColors[index % avatarColors.length];
    };

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {users.length === 0 ? (
                <div className="col-span-full text-center text-zen-stone py-8">
                    Aucun utilisateur dans cette room
                </div>
            ) : (
                users.map((user, index) => (
                    <div
                        key={user.userId}
                        className="flex flex-col items-center justify-center p-4 rounded-xl border border-zen-border bg-white hover:border-zen-clay/50 hover:shadow-md transition-all cursor-default group"
                    >
                        {/* Avatar */}
                        <div className={`w-12 h-12 rounded-full ${getAvatarColor(index)} flex items-center justify-center text-sm font-bold mb-2 shadow-sm`}>
                            {user.username.charAt(0).toUpperCase()}
                        </div>

                        {/* Username */}
                        <span className="text-sm font-semibold text-zen-text truncate max-w-full">
                            {user.username}
                        </span>

                        {/* Status */}
                        <span className="text-[10px] uppercase tracking-wider font-bold text-zen-stone mt-1">
                            online
                        </span>
                    </div>
                ))
            )}

            {/* Invite Button */}
            <button className="flex flex-col items-center justify-center p-4 rounded-xl border border-dashed border-zen-border text-zen-stone hover:text-zen-clay hover:border-zen-clay hover:bg-white transition-all text-sm gap-2">
                <div className="w-10 h-10 rounded-full bg-zen-surface flex items-center justify-center">
                    <Plus size={20} />
                </div>
                <span className="font-medium">Inviter</span>
            </button>
        </div>
    );
}
