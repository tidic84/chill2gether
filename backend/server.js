const express = require("express");
const http = require("http");
const cors = require("cors");
require("dotenv").config();

//Import du fichier de gestion des erreurs globales
const errorHandler = require('./middleware/errorHandler');

// Import des fichiers de routes pour gérer les différentes entités
const searchRoutes = require('./routes/searchRoutes');
// const userRoutes = require('./routes/userRoutes');
// Import de la configuration Socket.IO
const initializeSocket = require('./config/socket');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;                // Port d'écoute du serveur
const NODE_ENV = process.env.NODE_ENV || 'development'; // Environnement d'exécution (dev ou prod)

// Configuration CORS (Cross-Origin Resource Sharing) adaptée selon l'environnement
// En production, limiter aux domaines officiels
// En développement, autoriser localhost pour tests front-end locaux
const allowedOrigins = NODE_ENV === 'production'
    ? ['https://www.website.com', 'https://website.com']
    : ['http://localhost:3000', 'http://127.0.0.1:3000'];

app.use(cors({
    origin: allowedOrigins,                // Origines autorisées pour les requêtes cross-origin
    methods: ['GET', 'POST', 'PUT', 'DELETE'],  // Méthodes HTTP acceptées
    allowedHeaders: ['Content-Type', 'Authorization'], // En-têtes autorisés
}));

// Middleware pour parser le corps des requêtes en JSON
app.use(express.json());

// Middleware pour servir les fichiers statiques (ex : logos, images uploadées)
// Accessible via l'URL /uploads/nom_du_fichier
// app.use('/uploads', express.static('uploads'));

// Définition des routes principales de l'API, avec préfixe /api
app.use('/api/search', searchRoutes);

// app.use('/api/users', userRoutes);

app.use(errorHandler);

// Initialisation de Socket.IO avec le serveur HTTP
const io = initializeSocket(server, allowedOrigins);

// Rendre l'instance io accessible dans toute l'application
app.set('io', io);

// Démarrage du serveur sur le port défini, affichage d'un message de confirmation
server.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT} [${NODE_ENV}]`);
    console.log(`🔌 Socket.IO initialized and ready`);
});
