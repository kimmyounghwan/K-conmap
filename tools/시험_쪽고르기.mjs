/**
 * 🧪 G554 서식 «종이에 바로 쓰기» 쪽 고르기 칸 — 폰에서 오른쪽이 잘리던 것 (2026-11-05)
 *   lib 모드(주소 없이):  LANG=C.UTF-8 node tools/시험_쪽고르기.mjs          — styles.css 폰 규칙이 남아 있는지
 *   화면 모드(구운 사이트): LANG=C.UTF-8 node tools/시험_쪽고르기.mjs http://127.0.0.1:4986   · OUT=폴더 면 화면 사진
 *   소장님 「적격서류 등 최근에 올린 서류 이용자 입장에서 다시 하나씩 해보고 점검해봐. 그리고 고쳐 줘.」
 *     → 폰 390 에서 10쪽 넘는 서식(토공사 시공계획서 18쪽 · 공사안전보건대장 12쪽)의 «쪽 [전부 18쪽 · 예: 1-3, 7]» 칸이
 *       세 칸 격자 한 칸(약 107px)에 170px 로 들어가 x=442 까지 — 화면 밖(잘림 · 옆으로도 안 밀림)
 *   ① 폰 320 · 390: 쪽 칸이 화면 안 · 너비 150px 넘음 · 단추 줄(.fw-bar) 어느 것도 화면 밖 아님 · «－ ＋» 는 «빈칸으로» 와 같은 줄
 *   ② PC 1280: 쪽 칸 170px 그대로 · 화면 안
 *   ③ 쪽 칸에 «1-3, 7» 넣으면 그대로 · 오류 0
 * 가상 자료만 씀 · 인터넷 안 부름.
 */
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const require = createRequire(import.meta.url)
const 여기 = path.dirname(fileURLToPath(import.meta.url))
const BASE = process.argv[2] || ''
const OUT = process.env.OUT || ''
let bad = 0, n = 0
const ok = (이름, c, got) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (c || got === undefined ? '' : ' = ' + JSON.stringify(got).slice(0, 500))) }

console.log('◎ styles.css 폰 규칙')
const css = fs.readFileSync(path.join(여기, '..', 'web', 'src', 'styles.css'), 'utf8').replace(/\r\n/g, '\n')
ok('폰(640 이하) — 쪽 고르기 한 줄 다 씀(grid-column: 1 / -1) · 칸 width auto · flex 1', /@media \(max-width: 640px\) \{\n  \.gx \.fw-bar \.gx-range \{ grid-column: 1 \/ -1; order: 8; min-width: 0; \}\n  \.gx \.fw-bar \.gx-range \.inp \{ width: auto; flex: 1; min-width: 0; \}\n\}/.test(css))
ok('PC 는 그대로 170px', /\.gx \.fw-bar \.gx-range \.inp \{ width: 170px;/.test(css))

if (BASE) {
  const { chromium } = require('playwright')
  const b = await chromium.launch()
  for (const 길 of ['/forms/togong-sigong', '/forms/gongsa-anjeon-daejang']) {
    for (const [w, h, 폰] of [[320, 640, true], [390, 844, true], [1280, 860, false]]) {
      const ctx = await b.newContext({ viewport: { width: w, height: h }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', isMobile: 폰, hasTouch: 폰, deviceScaleFactor: 2,
        userAgent: 폰 ? 'Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36' : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36' })
      await ctx.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|googlesyndication|geojs/, (r) => r.fulfill({ status: 200, body: '' }))
      await ctx.route(/firebaseio\.com|firebasedatabase\.app/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
      const p = await ctx.newPage()
      const 오류 = []
      p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
      await p.goto(BASE + 길, { waitUntil: 'domcontentloaded' })
      await p.waitForSelector('.gx .fw-bar .gx-range .inp', { timeout: 20000 })
      await p.waitForTimeout(500)
      const r = await p.evaluate(() => {
        const W = document.documentElement.clientWidth
        const 칸 = document.querySelector('.gx .fw-bar .gx-range .inp').getBoundingClientRect()
        const 밖 = [...document.querySelectorAll('.gx .fw-bar > *')].filter((e) => { const x = e.getBoundingClientRect(); return x.width && (x.right > W + 0.5 || x.left < -0.5) }).map((e) => (e.innerText || e.className).trim().slice(0, 20))
        const 빈칸 = [...document.querySelectorAll('.gx .fw-bar .btn')].find((e) => /빈칸으로/.test(e.innerText))
        const 줌 = document.querySelector('.gx .fw-bar .gx-zoom')
        return { W, l: 칸.left, r: 칸.right, w: 칸.width, 밖, 같은줄: 빈칸 && 줌 ? Math.abs(빈칸.getBoundingClientRect().top - 줌.getBoundingClientRect().top) < 8 : null, ph: document.querySelector('.gx .fw-bar .gx-range .inp').placeholder }
      })
      const 이름 = 길.split('/').pop() + ' ' + w
      if (폰) {
        ok(`${이름} — 쪽 칸 화면 안(${Math.round(r.l)}~${Math.round(r.r)} / ${r.W}) · 너비 ${Math.round(r.w)} ≥ 150 · 단추 줄 밖으로 나간 것 없음`, r.l >= -0.5 && r.r <= r.W + 0.5 && r.w >= 150 && !r.밖.length, r)
        ok(`${이름} — «－ ＋» 는 «빈칸으로» 와 같은 줄`, r.같은줄 === true, r.같은줄)
      } else {
        ok(`${이름} — 쪽 칸 170px 그대로 · 화면 안`, Math.round(r.w) === 170 && r.r <= r.W && !r.밖.length, r)
      }
      await p.fill('.gx .fw-bar .gx-range .inp', '1-3, 7')
      ok(`${이름} — «1-3, 7» 넣으면 그대로 · 자리 글 «전부 N쪽 · 예: 1-3, 7» · 오류 0`, (await p.inputValue('.gx .fw-bar .gx-range .inp')) === '1-3, 7' && /^전부 \d+쪽 · 예: 1-3, 7$/.test(r.ph) && !오류.length, [await p.inputValue('.gx .fw-bar .gx-range .inp'), r.ph, 오류])
      if (OUT && w === 390) {
        const 줄 = await p.locator('.gx .fw-bar').first().boundingBox()
        await p.screenshot({ path: `${OUT}/쪽고르기_${길.split('/').pop()}_폰390.png`, clip: { x: 0, y: Math.max(0, 줄.y - 8), width: 390, height: 줄.height + 16 }, fullPage: true })
      }
      await ctx.close()
    }
  }
  await b.close()
}
console.log(`\n${bad ? '✗' : '✓'} 시험_쪽고르기 ${n - bad}/${n}`)
if (bad) process.exit(1)
