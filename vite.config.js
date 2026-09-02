import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  server: {
    host: true,
  },
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1600,

    // Vite 8 → rolldownOptions (rollupOptions 아님)
    rolldownOptions: {
      output: {
        // 객체 ❌ → 함수 ✅
        manualChunks(id) {
          if (
            id.includes('node_modules/react') ||
            id.includes('node_modules/react-dom')
          ) {
            return 'vendor-react'
          }
          if (
            id.includes('node_modules/three') ||
            id.includes('node_modules/@react-three')
          ) {
            return 'vendor-three'
          }
        },
      },
    },
  },
})