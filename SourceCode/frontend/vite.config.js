import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        headers: {
          Origin: 'http://localhost:5173'
        }
      },
      '/ws-roms-native': {
        target: 'http://localhost:8080',
        ws: true,
        changeOrigin: true
      },
      '/ws-roms': {
        target: 'http://localhost:8080',
        ws: true,
        changeOrigin: true
      }
    }
  }
})
