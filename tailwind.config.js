/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}', // <-- this tells Tailwind to scan all files in src/
  ],
  theme: {
    extend: {
      colors: {
        malibu: '#63e7f7',
        blueWhale: '#03334c',
        allports: '#057e9c',
        scooter: '#34b7d0',
        veniceBlue: '#076589',
        pictonBlue: '#45cbe4',
        easternBlue: '#239bbd',
        tealBlue: '#084668',
        brand: '#057e9c',
        lightBrand: '#34b7d0',
        darkBrand: '#084668',
        whiteBrand: '#cde5eb'
      }
    },
  },
  plugins: [],
}
