import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useSocket } from '../../contexts/SocketContext';
import { useParams } from 'react-router-dom';

export default function UserPermissionsModal({ user, currentUserPermissions, onClose }) {
    const socket = useSocket();
    const { roomId } = useParams();
    const [permissions, setPermissions] = useState({});
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');

    useEffect(() => {
        if (user?.permissionsSet) {
            setPermissions(user.permissionsSet);
        }
    }, [user]);

    const permissionLabels = {
        editPermissions: 'Modifier les permissions',
        sendMessages: 'Envoyer des messages',
        deleteMessages: 'Supprimer les messages',
        changeVideo: 'Changer la vidéo',
        interactionVideo: 'Interagir avec la vidéo'
    };

    const permissionDescriptions = {
        editPermissions: 'Gérer les permissions des autres utilisateurs',
        sendMessages: 'Envoyer et recevoir des messages',
        deleteMessages: 'Supprimer les messages du chat',
        changeVideo: 'Ajouter, supprimer et changer les vidéos',
        interactionVideo: 'Contrôler le lecteur vidéo (play, pause, seek)'
    };

    // Vérifier si l'utilisateur peut modifier une permission
    const canModifyPermission = (permissionKey) => {
        return currentUserPermissions?.[permissionKey] === true;
    };

    const handlePermissionChange = (permission) => {
        if (!canModifyPermission(permission)) {
            setMessage(`Vous n'avez pas la permission de modifier "${permissionLabels[permission]}"`);
            setMessageType('error');
            setTimeout(() => setMessage(''), 3000);
            return;
        }

        setPermissions(prev => ({
            ...prev,
            [permission]: !prev[permission]
        }));
    };

    const handleSave = () => {
        setLoading(true);
        socket.emit('update-user-permissions', {
            roomId,
            targetUserId: user.userId,
            permissions
        });

        // Écouter la réponse
        const handleSuccess = () => {
            setMessageType('success');
            setMessage('Permissions mises à jour avec succès');
            setTimeout(() => {
                socket.off('update-user-permissions-success', handleSuccess);
                socket.off('permissions-error', handleError);
                onClose();
            }, 1500);
        };

        const handleError = (data) => {
            setMessageType('error');
            setMessage(data.error || 'Erreur lors de la mise à jour');
            setLoading(false);
            setTimeout(() => {
                socket.off('update-user-permissions-success', handleSuccess);
                socket.off('permissions-error', handleError);
            }, 3000);
        };

        socket.on('update-user-permissions-success', handleSuccess);
        socket.on('permissions-error', handleError);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl border border-zen-border w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-zen-border p-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-zen-text">
                            Permissions de {user.username}
                        </h2>
                        <p className="text-sm text-zen-stone mt-1">
                            Gérez les droits de cet utilisateur
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="p-2 hover:bg-zen-cream rounded-lg transition-colors disabled:opacity-50"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Permissions List */}
                <div className="p-6 space-y-3">
                    {Object.entries(permissionLabels).map(([key, label]) => {
                        const canModify = canModifyPermission(key);
                        const isEnabled = permissions[key];

                        return (
                            <div
                                key={key}
                                className={`p-4 rounded-lg border transition-all ${isEnabled
                                        ? 'bg-green-50 border-green-200'
                                        : 'bg-red-50 border-red-200'
                                    } ${!canModify ? 'opacity-60' : ''}`}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-3 flex-1">
                                        <input
                                            type="checkbox"
                                            checked={isEnabled}
                                            onChange={() => handlePermissionChange(key)}
                                            disabled={!canModify || loading}
                                            className="w-4 h-4 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                        />
                                        <div>
                                            <label className={`text-sm font-semibold cursor-pointer ${canModify ? 'text-zen-text' : 'text-zen-stone/60'
                                                }`}>
                                                {label}
                                            </label>
                                            <p className="text-xs text-zen-stone/70 mt-0.5">
                                                {permissionDescriptions[key]}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded font-semibold whitespace-nowrap ml-2 ${isEnabled
                                            ? 'bg-green-200 text-green-700'
                                            : 'bg-red-200 text-red-700'
                                        }`}>
                                        {isEnabled ? 'Activé' : 'Désactivé'}
                                    </span>
                                </div>

                                {/* Info sur la modification possible */}
                                {!canModify && (
                                    <div className="ml-7 mt-2 text-xs text-red-600 flex items-center gap-1">
                                        <i className="fa-solid fa-lock text-xs"></i>
                                        Vous n'avez pas cette permission
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Message */}
                {message && (
                    <div className={`mx-6 p-3 rounded-lg text-sm font-medium flex items-center gap-2 ${messageType === 'success'
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                        <i className={`fa-solid ${messageType === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
                        {message}
                    </div>
                )}

                {/* Footer */}
                <div className="sticky bottom-0 bg-zen-light-cream border-t border-zen-border p-6 flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 px-4 py-2.5 bg-zen-surface border border-zen-border rounded-lg font-semibold text-zen-text hover:bg-zen-bg transition-colors disabled:opacity-50"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex-1 px-4 py-2.5 bg-zen-sage text-white rounded-lg font-semibold hover:bg-zen-sage/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <i className="fa-solid fa-circle-notch fa-spin"></i>
                                Enregistrement...
                            </>
                        ) : (
                            <>
                                <i className="fa-solid fa-check"></i>
                                Enregistrer
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}