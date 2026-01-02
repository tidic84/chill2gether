import { Plus } from "lucide-react";
import { useState } from "react";
import { usePermissions } from "../../contexts/SocketContext";
import UserPermissionsModal from "../UserPermissionsModal/UserPermissionsModal";

export default function UserList({ users = [] }) {
    const [selectedUser, setSelectedUser] = useState(null);
    const [showPermissionsModal, setShowPermissionsModal] = useState(false);
    const currentUserPermissions = usePermissions();

    // Palette de couleurs pour les avatars
    const avatarColors = [
        'bg-zen-sage text-white',
        'bg-zen-terracotta text-white',
        'bg-zen-stone text-white',
        'bg-zen-warm-beige text-zen-charcoal',
        'bg-zen-dark-stone text-white',
    ];

    const getAvatarColor = (index) => {
        return avatarColors[index % avatarColors.length];
    };

    const handleOpenPermissionsModal = (user) => {
        setSelectedUser(user);
        setShowPermissionsModal(true);
    };

    const handleClosePermissionsModal = () => {
        setShowPermissionsModal(false);
        setSelectedUser(null);
    };

    // Vérifier si on peut modifier les permissions
    const canEditPermissions = currentUserPermissions?.editPermissions === true;

    return (
        <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {users.length === 0 ? (
                    <div className="col-span-full text-center text-zen-stone py-8">
                        Aucun utilisateur dans cette room
                    </div>
                ) : (
                    users.map((user, index) => (
                        <div
                            key={user.userId}
                            className="relative group"
                        >
                            <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-zen-warm-stone bg-white hover:border-zen-terracotta/50 hover:shadow-md transition-all cursor-default group">
                                {/* Avatar */}
                                <div className={`w-12 h-12 rounded-full ${getAvatarColor(index)} flex items-center justify-center text-sm font-bold mb-2 shadow-sm`}>
                                    {user.username.charAt(0).toUpperCase()}
                                </div>

                                {/* Username */}
                                <span className="text-sm font-semibold text-zen-charcoal truncate max-w-full">
                                    {user.username}
                                </span>

                                {/* Status */}
                                <span className="text-[10px] uppercase tracking-wider font-bold text-zen-stone mt-1">
                                    online
                                </span>

                                {/* Admin Badge */}
                                {user.isAdmin && (
                                    <span className="mt-2 px-2 py-0.5 bg-zen-sage/20 text-zen-sage text-[10px] font-bold rounded-full">
                                        ADMIN
                                    </span>
                                )}
                            </div>

                            {/* Permissions Modifier Button (Hover) */}
                            {canEditPermissions && !user.isAdmin && (
                                <button
                                    onClick={() => handleOpenPermissionsModal(user)}
                                    className="absolute inset-0 rounded-xl bg-black/0 group-hover:bg-black/60 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer"
                                    title="Modifier les permissions"
                                >
                                    <div className="flex flex-col items-center gap-2">
                                        <i className="fa-solid fa-lock-open text-white text-2xl"></i>
                                        <span className="text-white text-xs font-bold text-center px-2">
                                            Modifier permissions
                                        </span>
                                    </div>
                                </button>
                            )}
                        </div>
                    ))
                )}

                {/* Invite Button */}
                <button className="flex flex-col items-center justify-center p-4 rounded-xl border border-dashed border-zen-light-stone text-zen-stone hover:text-zen-terracotta hover:border-zen-terracotta hover:bg-white transition-all text-sm gap-2">
                    <div className="w-10 h-10 rounded-full bg-zen-cream flex items-center justify-center">
                        <Plus size={20} />
                    </div>
                    <span className="font-medium">Inviter</span>
                </button>
            </div>

            {/* Permissions Modal */}
            {showPermissionsModal && selectedUser && (
                <UserPermissionsModal
                    user={selectedUser}
                    currentUserPermissions={currentUserPermissions}
                    onClose={handleClosePermissionsModal}
                />
            )}
        </>
    );
}
