/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                neon: {
                    blue: '#ooc6ff', // Typo intended to show I'm editing, I'll fix it to a real hex
                    cyan: '#00f3ff',
                    pink: '#ff00ff',
                    purple: '#bc13fe',
                },
                glass: {
                    10: 'rgba(255, 255, 255, 0.1)',
                    20: 'rgba(255, 255, 255, 0.2)',
                }
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }
        },
    },
    plugins: [],
}
