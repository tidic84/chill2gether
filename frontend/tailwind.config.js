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
                    bg: '#F2F0E9',
                    surface: '#FAF9F6',
                    card: '#FFFFFF',
                    border: '#E7E5E4',
                    text: '#44403C',
                    muted: '#A8A29E',
                    sage: '#4A5D4F',
                    clay: '#C67D63',
                    stone: '#78716C',
                    // Dark mode
                    'dark-bg': '#1C1917',
                    'dark-surface': '#292524',
                    'dark-card': '#1C1917',
                    'dark-border': '#44403C',
                    'dark-text': '#FAF9F6',
                    'dark-muted': '#A8A29E',
                    'dark-sage': '#6B8A7A',
                    'dark-clay': '#D4917A',
                    'dark-stone': '#A8A29E',
                },
                // shadcn/ui CSS variable colors
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))',
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover))',
                    foreground: 'hsl(var(--popover-foreground))',
                },
                primary: {
                    DEFAULT: 'hsl(var(--primary))',
                    foreground: 'hsl(var(--primary-foreground))',
                },
                secondary: {
                    DEFAULT: 'hsl(var(--secondary))',
                    foreground: 'hsl(var(--secondary-foreground))',
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))',
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent))',
                    foreground: 'hsl(var(--accent-foreground))',
                },
                destructive: {
                    DEFAULT: 'hsl(var(--destructive))',
                    foreground: 'hsl(var(--destructive-foreground))',
                },
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
                brand: 'hsl(var(--primary))',
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)',
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
    plugins: [require('tailwindcss-animate')],
}
