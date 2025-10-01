// services/mailService.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: "ssl0.ovh.net",
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    tls: {
        rejectUnauthorized: false,
    }
});

exports.sendMail = async (options) => {
    const mailOptions = {
        from: options.from || process.env.EMAIL_USER,
        to: options.to || process.env.EMAIL_USER,
        subject: options.subject || "Sans sujet",
        text: options.text || "",
        replyTo: options.replyTo
    };

    return transporter.sendMail(mailOptions);
};

// 🎉 Mail de bienvenue 
exports.sendWelcomeEmail = async (to) => {
    return transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject: "",
        text: ""
    });
};

// 📩 Mail d’annulation abonnement
exports.sendCancelEmail = async (to, nom, endDate) => {
    return transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject: "Confirmation de l’annulation de votre abonnement",
        text: ""
    });
};

module.exports = exports;
