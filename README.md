# Chill2gether

[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.1.0-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-19.1.1-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.8.1-010101?logo=socket.io&logoColor=white)](https://socket.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Vite](https://img.shields.io/badge/Vite-7.1.7-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4.17-06B6D4?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

Une application de streaming vidéo collaborative en temps réel permettant aux utilisateurs de regarder des vidéos ensemble.

## Architecture

### Backend
- **Framework**: Express.js
- **Base de données**: PostgreSQL
- **Temps réel**: Socket.io
- **Authentification**: JWT avec bcrypt

### Frontend
- **Framework**: React 19
- **Build**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router
- **Animations**: Framer Motion
- **Lecteur vidéo**: React Player + HLS.js
- **WebSocket**: Socket.io-client

## Installation

### Prérequis
- Node.js 20.x ou supérieur
- PostgreSQL 16 ou supérieur
- npm ou yarn

### Backend

```bash
cd backend
npm install
```

Créer un fichier `.env` dans le dossier backend:

```env
# Config DB
DB_HOST=localhost
DB_USER=c2g
DB_PASSWORD=votre_mot_de_passe
DB_NAME=c2g
DB_PORT=5432

# Config API
YT_API_KEY=votre_cle_api

# Config Server
JWT_SECRET=votre_secret_jwt
PORT=3000
NODE_ENV=dev #pour afficher les message de debug
```

Lancer le serveur:

```bash
npm run dev
```

### Frontend

```bash
cd frontend
npm install
```

Créer un fichier `.env` dans le dossier frontend:

```env
VITE_BACKEND_URL=http://localhost:3000
```

Lancer le client:

```bash
npm run dev
```

## Utilisation

1. Démarrer le serveur backend
2. Démarrer le client frontend
3. Ouvrir votre navigateur sur `http://localhost:5173`
4. Créer un compte ou se connecter
5. Créer ou rejoindre une salle de visionnage

## Scripts

### Backend
- `npm start` - Démarrer le serveur en production
- `npm run dev` - Démarrer le serveur en mode développement

### Frontend
- `npm run dev` - Démarrer le serveur de développement
- `npm run build` - Compiler pour la production

## Licence

ISC
