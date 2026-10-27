/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 9998,
    host: '127.0.0.1',
    proxy: {
      '/api/ws': {
        target: 'ws://127.0.0.1:9999',
        ws: true,
        changeOrigin: true,
      },
      '/api': {
        target: 'http://127.0.0.1:9999',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 9998,
    host: '127.0.0.1',
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
