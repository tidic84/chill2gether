// middleware/errorHandler.js
const multer = require('multer');

function errorHandler(err, req, res, next) {
    if (err instanceof multer.MulterError) {
        // Erreurs Multer
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).send('Le fichier est trop volumineux (max 2 Mo).');
        }
        return res.status(400).send(err.message);
    }

    if (err.statusCode && err.message) {
        // Erreurs personnalisées
        return res.status(err.statusCode).send(err.message);
    }

    // Erreur serveur générique
    console.error(err);
    res.status(500).send('Erreur serveur interne.');
}

module.exports = errorHandler;
