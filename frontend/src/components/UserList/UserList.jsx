import { Plus } from "lucide-react";

export default function UserList({ users = [] }) {
    // Palette de couleurs pour les avatars
    const avatarColors = [
        'bg-zen-sage dark:bg-zen-dark-sage text-white',
        'bg-zen-clay dark:bg-zen-dark-clay text-white',
        'bg-zen-stone text-white',
        'bg-zen-clay dark:bg-zen-dark-clay text-zen-text dark:text-zen-dark-text',
        'bg-zen-stone text-white',
    ];

    const getAvatarColor = (index) => {
        return avatarColors[index % avatarColors.length];
    };

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {users.length === 0 ? (
                <div className="col-span-full text-center text-zen-stone dark:text-zen-dark-stone py-8">
                    Aucun utilisateur dans cette room
                </div>
            ) : (
                users.map((user, index) => (
                    <div
                        key={user.userId}
                        className="flex flex-col items-center justify-center p-4 rounded-xl border border-zen-border dark:border-zen-dark-border bg-white dark:bg-zen-dark-surface hover:border-zen-clay dark:hover:border-zen-dark-clay/50 hover:shadow-md transition-all cursor-default group"
                    >
                        {/* Avatar */}
                        <div className={`w-12 h-12 rounded-full ${getAvatarColor(index)} flex items-center justify-center text-sm font-bold mb-2 shadow-sm`}>
                            {user.username.charAt(0).toUpperCase()}
                        </div>

                        {/* Username */}
                        <span className="text-sm font-semibold text-zen-text dark:text-zen-dark-text truncate max-w-full">
                            {user.username}
                        </span>

                        {/* Status */}
                        <span className="text-[10px] uppercase tracking-wider font-bold text-zen-stone dark:text-zen-dark-stone mt-1">
                            online
                        </span>
                    </div>
                ))
            )}

            {/* Invite Button */}
            <button className="flex flex-col items-center justify-center p-4 rounded-xl border border-dashed border-zen-border dark:border-zen-dark-border text-zen-stone dark:text-zen-dark-stone hover:text-zen-clay dark:hover:text-zen-dark-clay dark:text-zen-dark-clay hover:border-zen-clay dark:hover:border-zen-dark-clay hover:bg-white dark:bg-zen-dark-surface transition-all text-sm gap-2">
                <div className="w-10 h-10 rounded-full bg-zen-bg dark:bg-zen-dark-bg flex items-center justify-center">
                    <Plus size={20} />
                </div>
                <span className="font-medium">Inviter</span>
            </button>
        </div>
    );
}
