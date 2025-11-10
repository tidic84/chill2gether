const express = require('express');
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Inscription
router.post('/register', userController.registerUser);

// Connexion
router.post('/login', userController.loginUser);

// Route pour récupérer les informations de l'utilisateur connecté
router.get('/me', authenticateToken, userController.getMe);



// Route pour modifier les informations de l'utilisateur connecté
router.put('/me', authenticateToken, userController.updateMe);

// Supprimer l'utilisateur connecté
router.delete('/me', authenticateToken, userController.deleteMe);

module.exports = router;
