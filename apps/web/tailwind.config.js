/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        threads: {
          dark: '#101010',
          card: '#181818',
          border: '#2a2a2a',
          hover: '#222222',
          accent: '#0095f6',
        },
      },
    },
  },
  plugins: [],
};
