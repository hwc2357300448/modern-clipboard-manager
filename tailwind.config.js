/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/renderer/**/*.{js,jsx,ts,tsx,html}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: "var(--surface)",
        // Map primary to the CSS variable
        primary: "var(--primary)",
      },
      fontFamily: {
        sans: ['"Segoe UI Variable"', '"Segoe UI"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}