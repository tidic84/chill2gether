import { createContext, useContext, useEffect } from 'react';
  import socket from '../services/socket';

  const SocketContext = createContext();

  export const useSocket = () => useContext(SocketContext);

  export const SocketProvider = ({ children }) => {
    useEffect(() => {
      socket.connect();

      return () => socket.disconnect();
    }, []);

    return (
      <SocketContext.Provider value={socket}>
        {children}
      </SocketContext.Provider>
    );
  };