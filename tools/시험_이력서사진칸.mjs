// 👤 이력서(/forms/iryeokseo) «증명사진» 칸 화면 시험 · PC · 폰 (2026-11-16 소장님 「이력서도 도구화 해서 만들어 줘」)
//   화면 빌드를 얹은 뒤  B=http://127.0.0.1:4729 node tools/시험_이력서사진칸.mjs [PC|폰|모두]
//   ① 두 장(셈 · 이력서) · «사진» 칸이 이력서 A5 · 사진 칸을 누르면 «📷 사진 고르기»(글 칸 아님) · 빈 사진 칸은 흼
//   ② 가상 사진 1장 넣기 → 칸 그림이 흰색이 아님 · 🧹 빈칸으로 → 다시 흼
//   ③ ✍ 예시 채우기 → 사진 칸은 그대로 흼(현장 사진 안 넣음 — 사진예시.js 그림종류 «증명사진») · 성명 «김가나» · 총 경력 «17년 2개월 1일»
//   ④ 폭 320 · 390 · 1280 가로 넘침 없음 · 화면 오류 없음
import { createRequire } from 'module'
const require = createRequire(process.env.PW || '/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const 주소 = process.env.B || 'http://127.0.0.1:4729'
const 기기들 = (process.argv[2] || '모두') === '모두' ? ['PC', '폰'] : [process.argv[2]]
let ok = 0, bad = 0
const 봐 = (c, m, 더 = '') => { if (c) ok++; else bad++; console.log(c ? '  ✓' : '  ✗', m, c ? '' : String(typeof 더 === 'string' ? 더 : JSON.stringify(더)).slice(0, 500)) }
const 브 = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] })
for (const 기기 of 기기들) {
  console.log('■ ' + 기기)
  const 폰 = 기기 === '폰'
  const c = await 브.newContext({ viewport: 폰 ? { width: 390, height: 844 } : { width: 1280, height: 900 }, locale: 'ko-KR', isMobile: 폰, hasTouch: 폰 })
  await c.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|geojs|firebaseio/, (r) => r.fulfill({ status: 200, body: '' }))
  await c.addInitScript(() => { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); try { sessionStorage.setItem('kcm_notice_seen', '2026-10-업체') } catch (e) {} })
  const p = await c.newPage(); const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e).slice(0, 300))); p.on('dialog', (d) => d.accept())
  const 누름 = (re) => p.evaluate((s) => { const r = new RegExp(s); const b = [...document.querySelectorAll('button')].find((x) => r.test(x.textContent.trim()) && !x.disabled && x.offsetParent !== null); if (b) { b.click(); return true } return false }, re.source)
  await p.goto(주소 + '/forms/iryeokseo', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(4000)
  /* 열쇠 이름 → [시트, 행, 열] */
  const 자리찾기 = (이름) => p.evaluate((이름) => {
    const g = window.__격자; if (!g) return null
    for (let si = 0; si < g.doc.sheets.length; si++) {
      const sh = g.doc.sheets[si]
      for (const [a, k] of Object.entries(sh.keys || {})) {
        if (k !== 이름) continue
        const m = a.match(/^([A-Z]+)(\d+)$/); let col = 0; for (const ch of m[1]) col = col * 26 + ch.charCodeAt(0) - 64
        return [si, +m[2], col]
      }
    }
    return null
  }, 이름)
  /* 칸 자리(쪽 안 pt) → 화면 좌표 · 칸 안 밝기 — 시험_사진칸화면.mjs 와 같은 셈(시트 si 의 캔버스) */
  const 칸셈 = `(si, r, col) => {
    const g = window.__격자; const sh = g.doc.sheets[si]; const x = sh.cells.find((q) => q[0] === r && q[1] === col)
    const cv = document.querySelectorAll('canvas.gx-page')[si]
    const X = [0]; for (let i = 1; i <= sh.pc; i++) X[i] = X[i - 1] + (sh.w[i - 1] || 0)
    const Y = [0]; for (let i = 1; i <= sh.pr; i++) Y[i] = Y[i - 1] + (sh.h[i - 1] ?? 15)
    const W = 595.28, H = 841.89, [ml, mr, mt] = (sh.marg || [0.45, 0.35, 0.5, 0.5]).map((v) => v * 72)
    const pw = W - ml - mr, s = Math.min(1, pw / X[sh.pc]), ox = ml + (pw - X[sh.pc] * s) / 2
    return { x, cv, X, Y, W, H, s, ox, mt }
  }`
  const 칸자리 = (si, r, col) => p.evaluate(([si, r, col, f]) => {
    const { x, cv, X, Y, W, H, s, ox, mt } = eval(f)(si, r, col); if (!x || !cv) return null
    const rect = cv.getBoundingClientRect()
    const cx = ox + (X[col - 1] + X[col - 1 + x[3]]) / 2 * s, cy = mt + (Y[r - 1] + Y[r - 1 + x[2]]) / 2 * s
    return { x: rect.left + cx / W * rect.width, y: rect.top + cy / H * rect.height, h: (Y[r - 1 + x[2]] - Y[r - 1]) * s / H * rect.height }
  }, [si, r, col, 칸셈])
  const 흰가 = (si, r, col) => p.evaluate(([si, r, col, f]) => {
    const { x, cv, X, Y, W, s, ox, mt } = eval(f)(si, r, col); const ctx = cv.getContext('2d'); const k = cv.width / W
    const x0 = (ox + X[col - 1] * s) * k, x1 = (ox + X[col - 1 + x[3]] * s) * k, y0 = (mt + Y[r - 1] * s) * k, y1 = (mt + Y[r - 1 + x[2]] * s) * k
    const d = ctx.getImageData(Math.round(x0 + (x1 - x0) * 0.3), Math.round(y0 + (y1 - y0) * 0.3), Math.max(1, Math.round((x1 - x0) * 0.4)), Math.max(1, Math.round((y1 - y0) * 0.4))).data
    let sum = 0; for (let i = 0; i < d.length; i += 4) sum += (d[i] + d[i + 1] + d[i + 2]) / 3
    return sum / (d.length / 4)
  }, [si, r, col, 칸셈])
  const 값 = (q) => p.evaluate(([si, r, col]) => window.__격자.책.값(si, r, col), q)
  /* ① 두 장 · 사진 칸 */
  const 시트 = await p.evaluate(() => (window.__격자 ? window.__격자.doc.sheets.map((s) => s.name) : []))
  봐(시트.join() === '셈,이력서', '① 두 장(셈 · 이력서)', 시트)
  const 사 = await 자리찾기('사진')
  봐(!!사 && 사[0] === 1 && 사[1] === 5 && 사[2] === 1, '① «사진» 칸 = 이력서 A5', 사)
  await p.evaluate(() => { const cv = document.querySelectorAll('canvas.gx-page')[1]; cv.scrollIntoView({ block: 'start' }); window.scrollBy(0, -40) }); await p.waitForTimeout(600)
  const 자리 = await 칸자리(...사)
  봐(!!자리 && 자리.h > 30, '① 사진 칸 자리 읽음(높이 30px 넘음)', 자리)
  await p.mouse.click(자리.x, 자리.y); await p.waitForTimeout(700)
  const e1 = await p.evaluate(() => ({ 사진단추: !!document.querySelector('.gx-ed-ph'), 글칸: !!document.querySelector('.gx-ed-r .fw-in'), 단추들: [...document.querySelectorAll('.gx-ed-ph button')].map((b) => b.textContent.trim()) }))
  봐(e1.사진단추 && !e1.글칸 && e1.단추들.some((t) => /사진 고르기/.test(t)), `${기기} ① 사진 칸을 누르면 «📷 사진 고르기»(글 칸 아님)`, e1)
  봐((await 흰가(...사)) > 235, '① 빈 사진 칸은 흼', await 흰가(...사))
  /* ② 가상 사진 1장 넣기 · 빼기 */
  const bytes = await p.evaluate(async () => {
    const cv = document.createElement('canvas'); cv.width = 300; cv.height = 400; const g = cv.getContext('2d')
    g.fillStyle = '#5b6b7b'; g.fillRect(0, 0, 300, 400); g.fillStyle = '#e8d5c0'; g.beginPath(); g.arc(150, 150, 70, 0, 7); g.fill(); g.fillRect(60, 250, 180, 150)
    const b = await new Promise((ok) => cv.toBlob(ok, 'image/jpeg', 0.9)); return [...new Uint8Array(await b.arrayBuffer())]
  })
  await p.setInputFiles('.gx-ed-phb input[type=file]:not([capture])', [{ name: '증명사진_예시.jpg', mimeType: 'image/jpeg', buffer: Buffer.from(bytes) }])
  await p.waitForTimeout(3500)
  봐((await 흰가(...사)) < 200, `${기기} ② 사진 넣으면 칸에 그림`, await 흰가(...사))
  await 누름(/🧹 빈칸으로/); await p.waitForTimeout(900)
  봐((await 흰가(...사)) > 235, '② 🧹 빈칸으로 → 사진 없음', await 흰가(...사))
  /* ③ 예시 채우기 — 사진 칸에 현장 사진 안 넣음 · 글은 예시 */
  봐(await 누름(/✍ 예시 채우기/), '③ ✍ 예시 채우기 누름'); await p.waitForTimeout(5000)
  봐((await 흰가(...사)) > 235, `${기기} ③ 예시에도 사진 칸은 비어 있음(현장 사진 안 넣음)`, await 흰가(...사))
  const 성명 = await 자리찾기('성명'), 합 = await 자리찾기('경력합계표시')
  봐((await 값(성명)) === '김가나', '③ 예시 성명 «김가나»', await 값(성명))
  봐((await 값(합)) === '17년 2개월 1일', '③ 예시 총 경력 «17년 2개월 1일»', await 값(합))
  /* ④ 넓이 · 오류 */
  for (const w of [320, 390, 1280]) {
    await p.setViewportSize({ width: w, height: 800 }); await p.waitForTimeout(300)
    const n = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    봐(n <= 1, `${기기} ④ ${w}px 가로 넘침 없음`, n)
  }
  봐(!오류.length, 기기 + ' 화면 오류 없음', 오류.join(' | '))
  await c.close()
}
await 브.close()
console.log(bad ? `✗ ${bad} 틀림 · ${ok} 맞음` : `✓ 모두 맞음(${ok})`)
process.exit(bad ? 1 : 0)
