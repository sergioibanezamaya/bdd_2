import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite config — Frontend Sistema de Turnos Odontológicos
// Proxy /api → backend :3000 para evitar CORS en desarrollo.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});