import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Forward API calls to Express so the browser only ever talks to Vite's
    // origin, which keeps CORS out of the picture in development.
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
})
