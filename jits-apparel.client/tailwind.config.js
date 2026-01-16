/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["variant", "&:where(.dark, .dark *)"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};