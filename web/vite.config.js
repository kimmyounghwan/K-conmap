import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    // public/data 는 수천 개 JSON이라 인라인 금지
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // 구인구직 탭을 열기 전에는 firebase 를 받지 않게 따로 떼어낸다
          if (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase')) return 'firebase'
          if (id.includes('node_modules/react-router') || id.includes('node_modules/@remix-run')) return 'router'
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) return 'react'
        },
      },
    },
  },
})
