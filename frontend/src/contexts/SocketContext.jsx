import { createContext, useContext, useEffect, useState } from 'react';
import socket from '../services/socket';

const SocketContext = createContext();

export function SocketProvider({ children }) {
  const [userPermissions, setUserPermissions] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Récupérer les permissions initiales et le statut admin
    const handleRoomJoined = (data) => {
      if (data.user?.permissionsSet) {
        setUserPermissions(data.user.permissionsSet);
        // L'admin a tous les droits à true
        const hasAllPermissions = Object.values(data.user.permissionsSet).every(p => p === true);
        setIsAdmin(hasAllPermissions);
      }
    };

    // Mettre à jour les permissions si elles changent
    const handleRoomPermissionsUpdated = (data) => {
      // Si l'utilisateur est admin, ne pas mettre à jour ses permissions
      // (il garde tous les droits)
      if (!isAdmin) {
        setUserPermissions(prev => ({
          ...prev,
          ...data.defaultPermissions
        }));
      }
    };

    socket.on('room-joined', handleRoomJoined);
    socket.on('room-permissions-updated', handleRoomPermissionsUpdated);

    return () => {
      socket.off('room-joined', handleRoomJoined);
      socket.off('room-permissions-updated', handleRoomPermissionsUpdated);
    };
  }, [isAdmin]);

  return (
    <SocketContext.Provider value={{ socket, userPermissions, isAdmin }}>
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

export function useIsAdmin() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useIsAdmin must be used within SocketProvider');
  }
  return context.isAdmin;
}