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

    // Mettre à jour les permissions si elles changent globalement dans la room
    const handleRoomPermissionsUpdated = (data) => {
      console.log('Room permissions updated:', data);
      setUserPermissions(prev => ({
        ...prev,
        ...data.defaultPermissions
      }));
    };

    // Mettre à jour les permissions si ce sont celles de l'utilisateur courant
    const handleUserPermissionsUpdated = (data) => {
      console.log('User permissions updated:', data);
      // Si c'est l'utilisateur courant, mettre à jour
      const currentUserId = localStorage.getItem('anonymousUserId');
      if (data.userId === currentUserId) {
        setUserPermissions(data.permissions);
      }
    };

    socket.on('room-joined', handleRoomJoined);
    socket.on('room-permissions-updated', handleRoomPermissionsUpdated);
    socket.on('user-permissions-updated', handleUserPermissionsUpdated);

    return () => {
      socket.off('room-joined', handleRoomJoined);
      socket.off('room-permissions-updated', handleRoomPermissionsUpdated);
      socket.off('user-permissions-updated', handleUserPermissionsUpdated);
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