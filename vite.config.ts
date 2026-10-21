import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  // Keep credentialed XHR requests same-origin in jsdom; MSW responses are not real CORS responses.
  define:
    mode === 'test'
      ? {
          'import.meta.env.VITE_API_BASE_URL': JSON.stringify(
            'http://localhost:3000',
          ),
        }
      : undefined,
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    environmentOptions: {
      jsdom: { url: 'http://localhost:3000' },
    },
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    maxWorkers: 1,
    testTimeout: 15_000,
  },
}))
