/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      screens: {
        'xs': '480px',
      },
      spacing: {
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-top': 'env(safe-area-inset-top)',
      },
      fontSize: {
        'fluid-sm': 'clamp(0.75rem, 2vw, 0.875rem)',
        'fluid-base': 'clamp(0.875rem, 2.5vw, 1rem)',
        'fluid-lg': 'clamp(1rem, 3vw, 1.125rem)',
        'fluid-xl': 'clamp(1.125rem, 3.5vw, 1.25rem)',
        'fluid-2xl': 'clamp(1.25rem, 4vw, 1.5rem)',
        'fluid-3xl': 'clamp(1.5rem, 5vw, 1.875rem)',
        'fluid-4xl': 'clamp(1.875rem, 6vw, 2.25rem)',
        'fluid-5xl': 'clamp(2rem, 7vw, 3rem)',
        'fluid-6xl': 'clamp(2.5rem, 8vw, 3.75rem)',
      },
      minHeight: {
        'screen-safe': 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
      },
    },
  },
  plugins: [],
}
