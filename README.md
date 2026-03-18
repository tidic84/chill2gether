# Chill2gether

[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.1.0-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-19.1.1-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.8.1-010101?logo=socket.io&logoColor=white)](https://socket.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Vite](https://img.shields.io/badge/Vite-7.1.7-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4.17-06B6D4?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

## Description

**Chill2gether** est une plateforme collaborative orientée pédagogie. Elle permet à un professeur d'animer des sessions en ligne en temps réel : diffuser des vidéos synchronisées, partager son écran, utiliser un tableau blanc interactif, et partager des notes avec ses étudiants — le tout dans des salles de cours dédiées.

### Cas d'usage principal

Un professeur crée une salle, ses étudiants la rejoignent via un code. Le professeur contrôle le contenu diffusé (vidéos, tableau blanc, écran) tandis que les étudiants peuvent interagir selon les permissions accordées (chat, contrôle vidéo, etc.).

---

## Prérequis

- **Node.js** 20.x ou supérieur
- **PostgreSQL** 16 ou supérieur
- **npm** (inclus avec Node.js)
- Une clé API YouTube Data v3 (pour la recherche de vidéos)

---

## Installation et lancement

### 1. Cloner le dépôt

```bash
git clone <url-du-repo>
cd chill2gether
```

### 2. Backend

```bash
cd backend
npm install
```

Créer le fichier `.env` (voir section Variables d'environnement ci-dessous), puis :

```bash
# Mode développement (hot-reload + logs debug)
npm run dev

# Mode production
npm start
```

Le serveur démarre sur `http://localhost:3000` par défaut.

#### Migrations SQL

Créer la base de données et les tables via les scripts SQL du projet :

```bash
psql -U <user> -d <database> -f backend/sql/schema.sql
```

### 3. Frontend

```bash
cd frontend
npm install
```

Créer le fichier `.env` dans `frontend/` :

```env
VITE_BACKEND_URL=http://localhost:3000
```

```bash
# Mode développement
npm run dev

# Production
npm run build
```

L'interface est accessible sur `http://localhost:5173`.

---

## Fonctionnalités par rôle

### Professeur (créateur de la room)

| Fonctionnalité | Description |
|---|---|
| Gestion de la playlist | Ajouter, supprimer, réordonner les vidéos |
| Contrôle de la lecture | Play, pause, seek synchronisés pour tous |
| Tableau blanc | Dessiner et effacer en temps réel |
| Partage d'écran | Diffuser son écran via WebRTC |
| Notes partagées | Créer et supprimer des notes visibles par tous |
| Gestion des permissions | Modifier les droits de chaque étudiant |
| Chat | Envoyer des messages dans la room |

### Étudiant (participant)

| Fonctionnalité | Disponible par défaut | Modifiable par le prof |
|---|---|---|
| Voir le tableau blanc | Oui | — |
| Voir le partage d'écran | Oui | — |
| Lire les notes | Oui | — |
| Chat | Oui | Oui |
| Contrôle vidéo (play/pause/seek) | Oui | Oui |
| Ajouter des vidéos | Oui | Oui |
| Supprimer des messages | Non | Oui |
| Modifier les permissions | Non | Non |

---

## Architecture technique

```
┌─────────────────────────────────────────────────────────┐
│                        Frontend                          │
│              React 19 + Vite + Tailwind CSS              │
│         Socket.IO-client  |  REST (Axios/fetch)          │
└────────────────┬─────────────────────┬───────────────────┘
                 │ WebSocket           │ HTTP REST
┌────────────────▼─────────────────────▼───────────────────┐
│                        Backend                            │
│              Node.js + Express 5                          │
│                                                           │
│  ┌──────────────────────────────────────────────────┐     │
│  │              Socket.IO (temps réel)               │     │
│  │  • playlistHandlers   • permissionsHandlers       │     │
│  │  • whiteboardHandlers • screenShareHandlers       │     │
│  │  • noteHandlers (inline socket.js)                │     │
│  └──────────────────────────────────────────────────┘     │
│                                                           │
│  ┌──────────────────────────────────────────────────┐     │
│  │             REST API (Express Router)             │     │
│  │  /api/rooms  /api/users  /api/search              │     │
│  └──────────────────────────────────────────────────┘     │
│                                                           │
│  ┌──────────────────┐  ┌──────────────────────────────┐   │
│  │  In-Memory Stores│  │     PostgreSQL (pg)           │   │
│  │  anonymousUser   │  │  Tables: room, user, ...      │   │
│  │  whiteboard      │  │                               │   │
│  │  screenShare     │  └──────────────────────────────┘   │
│  │  playlist        │                                      │
│  └──────────────────┘                                      │
└───────────────────────────────────────────────────────────┘

WebRTC (peer-to-peer) — le serveur relaie uniquement le signaling
┌──────────┐   offer/answer/ICE via Socket.IO   ┌──────────┐
│ Prof     │ ◄──────────────────────────────── │ Étudiant │
│ (screen) │ ══════════ stream P2P ═══════════► │          │
└──────────┘                                    └──────────┘
```

---

## Variables d'environnement

### Backend (`backend/.env`)

```env
# Base de données PostgreSQL
DB_HOST=localhost
DB_USER=c2g
DB_PASSWORD=votre_mot_de_passe
DB_NAME=c2g
DB_PORT=5432

# Clé API YouTube Data v3 (recherche vidéo)
YT_API_KEY=votre_cle_api_youtube

# JWT (authentification des comptes enregistrés)
JWT_SECRET=votre_secret_jwt_long_et_aleatoire

# Serveur
PORT=3000
NODE_ENV=dev
# NODE_ENV=production  ← désactive les logs de debug
```

### Frontend (`frontend/.env`)

```env
VITE_BACKEND_URL=http://localhost:3000
```

---

## Scripts

### Backend
- `npm start` — démarrer en production
- `npm run dev` — démarrer en développement (nodemon)

### Frontend
- `npm run dev` — serveur de développement Vite
- `npm run build` — build de production
- `npm run preview` — prévisualiser le build

---

## Licence

ISC
