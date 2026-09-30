import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

/* 📄 pdf.js 가 «한글을 푸는 표»(cmaps)와 기본 글꼴을 따로 받아야 합니다.
   🚨 2026-09-18 — 이 둘이 없으면 한글(HWP)·오피스가 만든 PDF 에서
      글자가 «조용히 빈 글자» 로 나옵니다. 시험에서 「흄관」 을 못 찾아 잡았습니다.
      성내지 않고 그냥 아무것도 안 나오므로 눈으로는 절대 못 찾습니다.
   저장소에 1.8MB 를 넣지 않으려고, 빌드할 때 node_modules 에서 dist 로 옮깁니다. */
function pdfjs자료() {
  const 뿌리 = path.resolve('node_modules/pdfjs-dist')
  const 것들 = [['cmaps', 'pdfjs/cmaps'], ['standard_fonts', 'pdfjs/standard_fonts']]
  let 낼곳 = 'dist'
  return {
    name: 'pdfjs-자료',
    configResolved(c) { 낼곳 = c.build.outDir },   // --outDir 로 딴 데 구울 때도 따라갑니다
    configureServer(서버) {           /* npm run dev 에서도 같은 주소로 나오게 */
      서버.middlewares.use((req, res, next) => {
        const m = /^\/pdfjs\/(cmaps|standard_fonts)\/(.+)$/.exec(String(req.url || '').split('?')[0])
        if (!m) return next()
        const 길 = path.join(뿌리, m[1], decodeURIComponent(m[2]))
        if (!길.startsWith(뿌리) || !fs.existsSync(길)) return next()
        res.setHeader('Content-Type', 'application/octet-stream')
        fs.createReadStream(길).pipe(res)
      })
    },
    closeBundle() {
      for (const [안, 밖] of 것들) {
        const 밑 = path.join(뿌리, 안)
        if (!fs.existsSync(밑)) {
          this.warn(`pdfjs 의 ${안} 이 없습니다 — web 에서 npm install 을 하셨는지 보십시오`)
          continue
        }
        fs.cpSync(밑, path.resolve(낼곳, 밖), { recursive: true })
      }
    },
  }
}

/* 배포할 때마다 바뀌는 도장.
   자주 바뀌는 JSON(권장 투찰률·공고 목록)의 주소 뒤에 붙여서,
   브라우저가 옛 파일을 붙잡고 있는 일을 막습니다.
   — 실제로 겪은 문제입니다. 캐시 24시간에 걸려 하루 종일 옛 값을 보여줬습니다. */
const BUILD = Date.now().toString(36)

/* 🔄 화면 판 번호 (2026-09-30 · src/새판.jsx) — web/src 와 index.html 글이 바뀔 때만 바뀝니다.
   BUILD 는 자료만 새로 굽는 회차(한 시간쯤마다)에도 바뀌어서 «화면이 바뀌었나» 를 가를 수 없습니다.
   화면 안(__CODE__)과 dist/version.json 에 같은 번호를 적고, 폰이 둘을 견줘 옛 화면이면 새로 엽니다.
   줄 끝(CRLF · LF)은 LF 로 맞춰서 셉니다 — 받는 곳마다 줄 끝이 달라도 같은 번호가 나오게. */
import crypto from 'node:crypto'
const CODE = (() => {
  const h = crypto.createHash('sha1')
  const 걷기 = (d) => fs.readdirSync(d, { withFileTypes: true })
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
    .forEach((e) => {
      const p = path.join(d, e.name)
      if (e.isDirectory()) return 걷기(p)
      h.update(path.relative('.', p).split(path.sep).join('/'))
      h.update(fs.readFileSync(p).toString('latin1').replace(/\r\n/g, '\n'))
    })
  try { 걷기(path.resolve('src')); h.update(fs.readFileSync('index.html', 'latin1').replace(/\r\n/g, '\n')) } catch { return '' }
  return h.digest('hex').slice(0, 12)
})()
function 판번호() {
  let 낼곳 = 'dist'
  return {
    name: '판번호',
    configResolved(c) { 낼곳 = c.build.outDir },
    closeBundle() {
      if (CODE) fs.writeFileSync(path.resolve(낼곳, 'version.json'), JSON.stringify({ code: CODE, build: BUILD }))
    },
  }
}

export default defineConfig({
  define: { __BUILD__: JSON.stringify(BUILD), __CODE__: JSON.stringify(CODE) },
  plugins: [react(), pdfjs자료(), 판번호()],
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
          // 📄 PDF 도구를 열기 전에는 2MB 짜리 pdf 라이브러리를 «받지 않게» 떼어냅니다
          if (id.includes('node_modules/pdfjs-dist')) return 'pdfjs'
          if (id.includes('node_modules/pdf-lib') || id.includes('node_modules/@pdf-lib')) return 'pdflib'
        },
      },
    },
  },
})
