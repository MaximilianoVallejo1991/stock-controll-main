// tailwind.config.js
export default {
  darkMode: 'class', // Usa la clase 'dark' para alternar el modo oscuro
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        light: {
          background: '#f9f9f9',
          text: '#1a1a1a',
          primary: '#2563eb',
          secondary: '#64748b'
        },
        dark: {
          background: '#1e1e2f',
          text: '#f3f4f6',
          primary: '#3b82f6',
          secondary: '#94a3b8'
        }
      }
    }
  },
  plugins: []
}
