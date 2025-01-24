/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          darkest: '#000033',  // Darkest blue
          dark: '#1A1A4D',     // Dark purple
          medium: '#333366',   // Medium purple
          light: '#4B0082',    // Light purple
          lighter: '#6A5ACD',  // Lighter purple
          lightest: '#E6E6FA', // Lightest purple
        }
      }
    },
  },
  plugins: [],
};