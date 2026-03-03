/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Outfit', 'sans-serif'],
            },
            colors: {
                zen: {
                    // Light mode
                    bg: '#F2F0E9',        // Fond Crème
                    surface: '#FAF9F6',   // Surface très claire
                    card: '#FFFFFF',      // Blanc pur
                    border: '#E7E5E4',    // Bordures douces
                    text: '#44403C',      // Texte Brun Sombre
                    muted: '#A8A29E',     // Texte Gris chaud
                    sage: '#4A5D4F',      // Vert Sauge (Primaire)
                    clay: '#C67D63',      // Terracotta (Secondaire)
                    stone: '#78716C',     // Gris Pierre

                    // Dark mode
                    'dark-bg': '#1C1917',        // Fond Sombre
                    'dark-surface': '#292524',   // Surface sombre
                    'dark-card': '#1C1917',      // Card sombre
                    'dark-border': '#44403C',    // Bordures sombres
                    'dark-text': '#FAF9F6',      // Texte clair
                    'dark-muted': '#A8A29E',     // Texte gris
                    'dark-sage': '#6B8A7A',      // Vert Sauge clair
                    'dark-clay': '#D4917A',      // Terracotta clair
                    'dark-stone': '#A8A29E',     // Gris Pierre
                },
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-15px)' },
                },
                breathe: {
                    '0%, 100%': { transform: 'scale(1)', opacity: '0.4' },
                    '50%': { transform: 'scale(1.1)', opacity: '0.6' },
                },
            },
            animation: {
                float: 'float 8s ease-in-out infinite',
                breathe: 'breathe 6s ease-in-out infinite',
            },
        },
    },
    plugins: [],
}
