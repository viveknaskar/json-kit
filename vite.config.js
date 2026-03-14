import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
  base: '/json-kit/',
  server: { port: 3000, open: true },
  build: { outDir: 'dist', emptyOutDir: true }
})
