//Si besoin de mettre photo de profil par exemple 
//stocker l'url en db + ici upload le fichier sur le serveur

// Middleware de gestion des fichiers via multer
const multer = require('multer')
const path = require('path')

/**
 * Configuration du stockage des fichiers (sur disque local)
 */
const storage = multer.diskStorage({
    // Dossier de destination des fichiers uploadés
    destination: (req, file, cb) => {
        cb(null, 'uploads/') // Modifier si besoin, ex : 'uploads/entreprises/'
    },

    // Formatage du nom de fichier (ex: "logo-entreprise-1691234567890.png")
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname) // Extension du fichier (.jpg, .png, etc.)
        const baseName = path.basename(file.originalname, ext) // Nom sans extension
        const safeName = baseName.replace(/\s+/g, '-').toLowerCase() // Remplace les espaces par des tirets
        cb(null, `${safeName}-${Date.now()}${ext}`) // Ajoute un timestamp pour éviter les doublons
    }
})

/**
 * Vérification du type de fichier et du mimetype (sécurité)
 * N'autorise que les images JPG, JPEG ou PNG
 */
const fileFilter = (req, file, cb) => {
    const allowed = /jpeg|jpg|png/
    const isExtValid = allowed.test(path.extname(file.originalname).toLowerCase()) // Vérifie extension
    const isMimeValid = allowed.test(file.mimetype) // Vérifie le type MIME réel

    if (isExtValid && isMimeValid) {
        cb(null, true)
    } else {
        const error = new Error('Format non valide. Seuls les fichiers JPG, JPEG et PNG sont autorisés (max 5 Mo).');
        error.statusCode = 400;
        cb(error);
    }
}

/**
 * Initialisation de Multer avec :
 * - stockage défini plus haut
 * - limite de taille : 5 Mo max
 * - filtre de validation de type MIME
 */
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 Mo
    fileFilter
})

module.exports = upload 
