const API_URL = import.meta.env.VITE_BACKEND_URL;

export const roomApi = {
    async createRoom(creatorId, requiresPassword = false, password = null) {
        const response = await fetch(`${API_URL}/api/rooms/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                creatorId,
                requiresPassword,
                password
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erreur lors de la création de la room');
        }

        return response.json();
    },

    async getRoom(roomId) {
        const response = await fetch(`${API_URL}/api/rooms/${roomId}`);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erreur lors de la récupération de la room');
        }

        return response.json();
    },

    async joinRoom(roomId, password = null) {
        const response = await fetch(`${API_URL}/api/rooms/join`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                roomId,
                password
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erreur lors de la validation');
        }

        return response.json();
    },

    async getAllRooms() {
        const response = await fetch(`${API_URL}/api/rooms`);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erreur lors de la récupération des rooms');
        }

        return response.json();
    },

    async deleteRoom(roomId) {
        const response = await fetch(`${API_URL}/api/rooms/${roomId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erreur lors de la suppression de la room');
        }

        return response.json();
    }
};
