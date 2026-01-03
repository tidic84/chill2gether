import { createContext, useContext, useEffect, useState } from 'react';
import socket from '../services/socket';

const SocketContext = createContext();

export function SocketProvider({ children }) {
  const [userPermissions, setUserPermissions] = useState({
    editPermissions: false,
    sendMessages: true,
    deleteMessages: false,
    changeVideo: true,
    interactionVideo: true
  });

  useEffect(() => {
    if (!socket) return;

    const handleRoomJoined = (data) => {
      console.log('Room joined, user data:', data);
      if (data.user?.permissionsSet) {
        setUserPermissions(data.user.permissionsSet);
      }
    };

    const handleUserPermissionsUpdated = (data) => {
      console.log('User permissions updated:', data);
      const currentUserId = localStorage.getItem('anonymousUserId');
      if (data.userId === currentUserId) {
        console.log('✅ Mes permissions ont changé:', data.permissions);
        setUserPermissions(data.permissions);
      }
    };

    // ✅ NOUVEAU: Gérer la mise à jour des permissions par défaut
    const handleRoomDefaultPermissionsUpdated = (data) => {
      console.log('Room default permissions updated:', data);
      const currentUserId = localStorage.getItem('anonymousUserId');
      const currentUser = data; // À adapter selon votre contexte

      // Les permissions par défaut s'appliquent seulement si l'utilisateur n'a pas de permissions personnalisées
      // Cela sera géré par user-permissions-updated qui sera envoyé après
    };

    socket.on('room-joined', handleRoomJoined);
    socket.on('user-permissions-updated', handleUserPermissionsUpdated);
    socket.on('room-default-permissions-updated', handleRoomDefaultPermissionsUpdated);

    return () => {
      socket.off('room-joined', handleRoomJoined);
      socket.off('user-permissions-updated', handleUserPermissionsUpdated);
      socket.off('room-default-permissions-updated', handleRoomDefaultPermissionsUpdated);
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={{ socket, userPermissions, setUserPermissions }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context.socket;
}

export function usePermissions() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('usePermissions must be used within SocketProvider');
  }
  return context.userPermissions;
}