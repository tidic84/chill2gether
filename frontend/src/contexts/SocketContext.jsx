import { createContext, useContext, useEffect } from 'react';
  import socket from '../services/socket';

  const SocketContext = createContext();

  export const useSocket = () => useContext(SocketContext);

  export const SocketProvider = ({ children }) => {
    useEffect(() => {
      socket.connect();

      // Déconnecter proprement l'utilisateur quand la page est fermée
      const handleBeforeUnload = () => {
        socket.disconnect();
      };

      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
        socket.disconnect();
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }, []);

    return (
      <SocketContext.Provider value={socket}>
        {children}
      </SocketContext.Provider>
    );
  };