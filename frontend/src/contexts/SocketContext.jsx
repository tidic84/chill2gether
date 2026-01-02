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
    // Récupérer les permissions quand l'utilisateur rejoint une room
    const handleRoomJoined = (data) => {
      console.log('Room joined, user data:', data);
      if (data.user?.permissionsSet) {
        console.log('Mise à jour des permissions:', data.user.permissionsSet);
        setUserPermissions(data.user.permissionsSet);
      }
    };

    // ✅ IMPORTANT: Quand les permissions PERSONNELLES changent, mettre à jour
    const handleUserPermissionsUpdated = (data) => {
      console.log('User permissions updated:', data);
      // Vérifier si c'est l'utilisateur courant
      const currentUserId = localStorage.getItem('anonymousUserId');
      if (data.userId === currentUserId) {
        console.log('Mes permissions ont changé:', data.permissions);
        setUserPermissions(data.permissions);
      }
    };

    // ✅ Les permissions par défaut de la room NE changent PAS les permissions personnelles
    const handleRoomDefaultPermissionsUpdated = (data) => {
      console.log('Room default permissions updated:', data);
      // Ne rien faire - les permissions par défaut ne s'appliquent qu'aux nouveaux utilisateurs
    };

    socket.on('room-joined', handleRoomJoined);
    socket.on('user-permissions-updated', handleUserPermissionsUpdated);
    socket.on('room-default-permissions-updated', handleRoomDefaultPermissionsUpdated);

    return () => {
      socket.off('room-joined', handleRoomJoined);
      socket.off('user-permissions-updated', handleUserPermissionsUpdated);
      socket.off('room-default-permissions-updated', handleRoomDefaultPermissionsUpdated);
    };
  }, []);

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