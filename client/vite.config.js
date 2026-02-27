import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    proxy: {
      // Forward all /api requests to the Express server
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      // Forward Socket.io WebSocket connections to the Express server
      // ws: true is REQUIRED for WebSocket upgrade to work
      '/socket.io': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        ws: true
      }
    }
  }
});
