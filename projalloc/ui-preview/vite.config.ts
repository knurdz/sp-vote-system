import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

const dir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  root: dir,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(dir, '../src'),
      '@preview': path.resolve(dir, './src'),
    },
  },
  server: {
    port: 5174,
    open: true,
  },
})
