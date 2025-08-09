import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    cssMinify: true,
    rollupOptions: {
      output: {
        inlineDynamicImports: true as any,
        manualChunks: undefined as any,
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    css: true,
  },
})
