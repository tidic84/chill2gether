import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext';

export default function Permissions() {
    const { roomId } = useParams();
    const socket = useSocket();
    const [isAdmin, setIsAdmin] = useState(false);
    const [permissions, setPermissions] = useState({
        editPermissions: false,
        sendMessages: true,
        deleteMessages: false,
        changeVideo: true,
        interactionVideo: true
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!roomId) return;

        // Récupérer les permissions
        socket.emit('get-room-permissions', roomId);

        const handleRoomPermissions = (data) => {
            setPermissions(data.defaultPermissions);
            setIsAdmin(data.isAdmin);
        };

        const handlePermissionsUpdated = (data) => {
            if (data.roomId === roomId) {
                setPermissions(data.defaultPermissions);
                setMessage(`Permissions mises à jour par ${data.updatedBy}`);
                setTimeout(() => setMessage(''), 3000);
            }
        };

        const handleUpdateSuccess = () => {
            setMessage('Permissions mises à jour avec succès');
            setTimeout(() => setMessage(''), 3000);
        };

        const handlePermissionsError = (data) => {
            setMessage(`Erreur: ${data.error}`);
            setTimeout(() => setMessage(''), 3000);
        };

        socket.on('room-permissions', handleRoomPermissions);
        socket.on('room-permissions-updated', handlePermissionsUpdated);
        socket.on('update-permissions-success', handleUpdateSuccess);
        socket.on('permissions-error', handlePermissionsError);

        return () => {
            socket.off('room-permissions', handleRoomPermissions);
            socket.off('room-permissions-updated', handlePermissionsUpdated);
            socket.off('update-permissions-success', handleUpdateSuccess);
            socket.off('permissions-error', handlePermissionsError);
        };
    }, [socket, roomId]);

    const handlePermissionChange = (permission) => {
        setPermissions(prev => ({
            ...prev,
            [permission]: !prev[permission]
        }));
    };

    const handleSave = () => {
        setLoading(true);
        socket.emit('update-room-permissions', {
            roomId,
            permissions
        });
        setLoading(false);
    };

    const permissionLabels = {
        editPermissions: 'Modifier les permissions',
        sendMessages: 'Envoyer des messages',
        deleteMessages: 'Supprimer les messages',
        changeVideo: 'Changer la vidéo',
        interactionVideo: 'Interagir avec la vidéo'
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-zen-warm-stone">
                <div>
                    <h3 className="text-lg font-bold text-zen-text">Paramètres de la Room</h3>
                    <p className="text-sm text-zen-stone">
                        {isAdmin ? 'Vous êtes administrateur de cette room' : 'Vous n\'êtes pas administrateur'}
                    </p>
                </div>
                {isAdmin && (
                    <span className="px-3 py-1 bg-zen-sage/20 text-zen-sage text-xs font-bold rounded-full">
                        ADMIN
                    </span>
                )}
            </div>

            {/* Permissions List */}
            <div className="space-y-3">
                {Object.entries(permissionLabels).map(([key, label]) => (
                    <div
                        key={key}
                        className="flex items-center justify-between p-3 bg-zen-surface rounded-lg border border-zen-border hover:border-zen-sage/30 transition-colors"
                    >
                        <label className="flex items-center gap-3 cursor-pointer flex-1">
                            <input
                                type="checkbox"
                                checked={permissions[key]}
                                onChange={() => handlePermissionChange(key)}
                                disabled={!isAdmin}
                                className="w-4 h-4 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <span className={`text-sm font-medium ${!isAdmin ? 'text-zen-stone/60' : 'text-zen-text'}`}>
                                {label}
                            </span>
                        </label>
                        <span className={`text-xs px-2 py-1 rounded ${permissions[key] ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {permissions[key] ? 'Activé' : 'Désactivé'}
                        </span>
                    </div>
                ))}
            </div>

            {/* Message */}
            {message && (
                <div className={`p-3 rounded-lg text-sm font-medium ${message.includes('Erreur')
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-green-50 text-green-700 border border-green-200'
                    }`}>
                    {message}
                </div>
            )}

            {/* Save Button */}
            {isAdmin && (
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="w-full py-2.5 bg-zen-sage text-white rounded-lg font-semibold hover:bg-zen-sage/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </button>
            )}

            {/* Info Message for non-admins */}
            {!isAdmin && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                    <i className="fa-solid fa-info-circle mr-2"></i>
                    Les paramètres de la room peuvent être modifiés uniquement par l'administrateur.
                </div>
            )}
        </div>
    );
}