import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { fs: { strict: true, allow: [fileURLToPath(new URL('.', import.meta.url))] }, host: '127.0.0.1', port: 5173, strictPort: true, proxy: { '/api': 'http://127.0.0.1:8000', '/outputs': 'http://127.0.0.1:8000' } },
})
