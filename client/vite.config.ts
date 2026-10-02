import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Forward server routes to Express so the browser only ever talks to Vite's
    // origin, which keeps CORS out of the picture in development. The trailing
    // slashes stop '/api' from also swallowing client routes like '/apis'.
    proxy: {
      '/api/': 'http://localhost:4000',
      // OAuth lives outside /api: its cookie is scoped to /auth/osu and osu!
      // redirects back to a registered /auth/osu/callback URL.
      '/auth/': 'http://localhost:4000',
    },
  },
})
