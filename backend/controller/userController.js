const jwt = require('jsonwebtoken');
const bcrypt = require('c');
const userModel = require('../models/userModel');
const entrepriseModel = require('../models/entrepriseModel');
const mailer = require('../services/mailService');
const dotenv = require('dotenv');

dotenv.config();

// Inscription
exports.registerUser = async (req, res) => {
    const { email, password, nom } = req.body;

    try {
        // Vérifier si email déjà utilisé
        if (await userModel.checkEmailExists(email)) {
            return res.status(400).json({ error: 'Email déjà utilisé' });
        }

        // Hacher le mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        // Ajouter utilisateur
        const newUser = await userModel.addUser(email, hashedPassword, nom);

        // Créer une entreprise vide liée à cet utilisateur
        await entrepriseModel.createEmptyEntreprise(newUser.id);

        // 🚀 Envoi d'un mail interne pour signaler une nouvelle inscription
        await mailer.sendMail({
            to: process.env.EMAIL_USER,
            subject: "🆕 Nouvelle inscription",
            text: `Un nouvel utilisateur vient de s'inscrire :\n\nNom: ${newUser.nom}\nEmail: ${newUser.email}`
        });

        res.status(201).json({
            message: 'Utilisateur et entreprise créés avec succès',
            user: {
                id: newUser.id,
                email: newUser.email,
                nom: newUser.nom
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur lors de l\'inscription' });
    }
};


// Connexion
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await userModel.getUserByEmail(email);
        if (!user) {
            return res.status(400).json({ error: 'Utilisateur non trouvé' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ error: 'Mot de passe incorrect' });
        }

        // Générer token JWT
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '4h' }
        );

        res.status(200).json({
            message: 'Connexion réussie',
            token,
            user: {
                id: user.id,
                email: user.email,
                nom: user.nom
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur lors de la connexion' });
    }
};

// Récupérer les infos de l'utilisateur connecté
exports.getMe = async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await userModel.getUserById(userId);

        if (!user) {
            return res.status(404).json({ error: "Utilisateur non trouvé" });
        }

        let planType = null;
        let value = null;

        if (user.stripe_price_id === process.env.STRIPE_PRICE_YEARLY_ID) {
            planType = "annuel";
            value = 59.99;
        } else if (user.stripe_price_id === process.env.STRIPE_PRICE_MONTHLY_ID) {
            planType = "mensuel";
            value = 5.99;
        }

        res.status(200).json({
            ...user,
            planType,
            value,
            currency: "EUR",
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur lors de la récupération des informations" });
    }
};


exports.updateMe = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { field, value } = req.body; // { field: "email", value: "nouveau@mail.com" }

        // Transformation spéciale si c'est le mot de passe
        const dbField = field === 'password' ? 'password_hash' : field;

        // Hacher le mot de passe si nécessaire
        const finalValue = dbField === 'password_hash' ? await bcrypt.hash(value, 10) : value;

        const updatedUser = await userModel.updateUserField(userId, dbField, finalValue);

        if (!updatedUser) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        res.status(200).json({
            message: 'Champ mis à jour avec succès',
            user: updatedUser
        });
    } catch (err) {
        console.error('Erreur updateMe:', err);
        res.status(500).json({ error: 'Erreur lors de la mise à jour' });
    }
};

exports.deleteMe = async (req, res) => {
    try {
        const userId = req.user.userId;

        const deletedUser = await userModel.deleteUser(userId);

        if (!deletedUser) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        res.status(200).json({ message: 'Compte supprimé avec succès' });
    } catch (err) {
        console.error('Erreur deleteMe:', err);
        res.status(500).json({ error: 'Erreur lors de la suppression du compte' });
    }
};