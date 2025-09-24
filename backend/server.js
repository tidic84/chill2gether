const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3005;                // Port d’écoute du serveur
const NODE_ENV = process.env.NODE_ENV || 'development'; // Environnement d’exécution (dev ou prod)

// Démarrage du serveur sur le port défini, affichage d’un message de confirmation
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT} [${NODE_ENV}]`);
});
