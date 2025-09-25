/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}', // <-- this tells Tailwind to scan all files in src/
  ],
  theme: {
    extend: {
      colors: {
        brand: '#0EA5E9'
      }
    },
  },
  plugins: [],
}
