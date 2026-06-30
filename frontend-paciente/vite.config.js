import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite config — Portal del Paciente (Sistema de Turnos Odontológicos)
// Puerto 5174 (el panel del odontólogo usa 5173).
// Proxy /api → backend :3000 para evitar CORS en desarrollo.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});