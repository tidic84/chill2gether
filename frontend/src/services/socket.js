import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL;
const storedUserId = localStorage.getItem('anonymousUserId');

const socket = io(SOCKET_URL, {
    autoConnect: true,
    auth: {
        userId: storedUserId || null,
        username: null
    }
});

// Logs de debug pour la connexion
socket.on('connect', () => {
    console.log('Socket connecté:', socket.id);
});

socket.on('connect_error', (error) => {
    console.error('Erreur de connexion socket:', error.message);
    console.error('URL tentée:', SOCKET_URL);
});

socket.on('user-registered', (data) => {  
    // Sauvegarder le userId dans localStorage pour les reconnexions
    localStorage.setItem('anonymousUserId', data.userId);
});

socket.on('disconnect', (reason) => {
    console.log('Socket déconnecté:', reason);
});

export default socket;