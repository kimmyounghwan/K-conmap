import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/* 배포할 때마다 바뀌는 도장.
   자주 바뀌는 JSON(권장 투찰률·공고 목록)의 주소 뒤에 붙여서,
   브라우저가 옛 파일을 붙잡고 있는 일을 막습니다.
   — 실제로 겪은 문제입니다. 캐시 24시간에 걸려 하루 종일 옛 값을 보여줬습니다. */
const BUILD = Date.now().toString(36)

export default defineConfig({
  define: { __BUILD__: JSON.stringify(BUILD) },
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
