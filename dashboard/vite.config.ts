import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/solana-tx-toolkit/dashboard/',
  build: {
    outDir: '../docs/dashboard',
    emptyOutDir: true,
  },
})
