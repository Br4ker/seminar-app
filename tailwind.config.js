/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-require-imports */
// tailwind.config.js
const colors = require('tailwindcss/colors') // Optional: um auf Standardfarben zuzugreifen

module.exports = {
  content: [
    // Pfade zu deinen Templates, JS-Dateien etc.
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    // ... andere Pfade
  ],
  theme: {
    extend: {
      colors: {
        // Eigene Farbnamen definieren
        primary: { // Eine Hauptfarbe definieren (z.B. ein Blau)
          light: '#3b82f6', // Beispiel: blue-500
          DEFAULT: '#2563eb', // Beispiel: blue-600
          dark: '#1d4ed8'   // Beispiel: blue-700
        },
        secondary: { // Eine Sekundärfarbe (z.B. ein Grau oder eine andere Akzentfarbe)
          light: '#f3f4f6', // Beispiel: gray-100
          DEFAULT: '#e5e7eb', // Beispiel: gray-200
          dark: '#d1d5db'   // Beispiel: gray-300
        },
        accent: { // Eine Akzentfarbe (z.B. für Buttons, Links)
          light: '#ec4899', // Beispiel: pink-500
          DEFAULT: '#db2777', // Beispiel: pink-600
          dark: '#be185d'   // Beispiel: pink-700
        },
        // Du kannst auch die Standard-Text/Background-Farben überschreiben,
        // aber die Verwendung von CSS-Variablen wie du es tust, ist auch gut.
        // 'foreground': '#171717', // Dein --foreground Wert
        // 'background': '#ffffff', // Dein --background Wert
      },
      fontFamily: {
        // Stelle sicher, dass deine Geist-Fonts hier oder über CSS-Variablen korrekt eingebunden sind
        sans: ['var(--font-geist-sans)', 'Arial', 'Helvetica', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      }
    },
  },
  darkMode: 'media', // oder 'class', je nach Präferenz
  plugins: [],
}