/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                zen: {
                    cream: '#F2F0E9',
                    'warm-stone': '#E7E5E4',
                    'light-cream': '#FAF9F6',
                    'sage': '#4A5D4F',
                    'stone': '#A8A29E',
                    'warm-beige': '#D6C0B3',
                    'terracotta': '#C67D63',
                    'charcoal': '#44403C',
                    'dark-stone': '#78716C',
                    'medium-stone': '#57534E',
                    'light-stone': '#D6D3D1',
                    'darkest': '#292524',
                    'near-black': '#1C1917',
                },
            },
            keyframes: {
                gradientShift: {
                    '0%': { backgroundPosition: '0% 50%' },
                    '50%': { backgroundPosition: '100% 50%' },
                    '100%': { backgroundPosition: '0% 50%' },
                },
            },
            animation: {
                gradientShift: 'gradientShift 30s ease infinite',
            },
            backgroundSize: {
                '400%': '400% 400%',
            },
        },
    },
    plugins: [],
}
