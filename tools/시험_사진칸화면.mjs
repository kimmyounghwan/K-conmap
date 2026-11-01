// 📷 G492 (2026-11-01) 서식 «종이에 바로 쓰기» 사진 칸 — 공사 사진대지(/forms/sajin-daeji) 화면 시험 · PC · 폰
//   소장님 「사진 대지도 도구화 해줘. 내 컴퓨터에서 사진 불러 와서.. 편하게 .. 이용자 입장에서」 · 「사이트에서 작업하게 해야 해. 도구는 되도록」
//   화면 빌드를 얹은 뒤  B=http://127.0.0.1:4467 node tools/시험_사진칸화면.mjs [PC|폰|모두]
//   ① 종이에 사진 칸 3곳(빈 칸엔 «사진 넣기» 안내) · 사진 칸을 누르면 «📷 사진 고르기 · 📸 찍기» 가 뜸(글 칸 아님)
//   ② 가상 사진 3장(EXIF 찍은 때 있음)을 한 번에 고르면 세 칸에 차례로 · 촬영일 3칸이 찍은 날로 · 칸 그림이 흰색이 아님
//   ③ ⟳ 돌리기 → 그림 바뀜 · ✕ 빼기 → 칸 비고 안내 다시 · 끌어다 놓기(두 번째 칸에 1장)
//   ④ 📄 PDF 저장 → 파일 받음(사진 든 쪽) · 💾 저장 → 📂 불러오기 → 사진 그대로 · 새로고침 → 쓰던 사진 그대로(IndexedDB)
//   ⑤ ✍ 예시 채우기 → 사진 3칸 참 · 🧹 빈칸으로 → 사진 없음 · 다른 서식(아차사고 보고서)엔 사진 칸 없음 · 폭 320~1280 넘침 없음 · 화면 오류 없음
import { createRequire } from 'module'
import fs from 'fs'
import path from 'path'
const require = createRequire(process.env.PW || '/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const 주소 = process.env.B || 'http://127.0.0.1:4467'
const 기기들 = (process.argv[2] || '모두') === '모두' ? ['PC', '폰'] : [process.argv[2]]
let ok = 0, bad = 0
const 봐 = (c, m, 더 = '') => { if (c) ok++; else bad++; console.log(c ? '  ✓' : '  ✗', m, c ? '' : String(typeof 더 === 'string' ? 더 : JSON.stringify(더)).slice(0, 500)) }
const 브 = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] })
for (const 기기 of 기기들) {
  console.log('■ ' + 기기)
  const 폰 = 기기 === '폰'
  const c = await 브.newContext({ viewport: 폰 ? { width: 390, height: 844 } : { width: 1280, height: 900 }, locale: 'ko-KR', isMobile: 폰, hasTouch: 폰, acceptDownloads: true })
  await c.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|geojs|firebaseio/, (r) => r.fulfill({ status: 200, body: '' }))
  await c.addInitScript(() => { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); try { sessionStorage.setItem('kcm_notice_seen', '2026-10-업체') } catch (e) {} ; window.__받은이름 = []; const 원 = HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click = function () { if (this.download) window.__받은이름.push(this.download); return 원.call(this) } })
  const p = await c.newPage(); const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e).slice(0, 300))); p.on('dialog', (d) => d.accept())
  const 누름 = (re) => p.evaluate((s) => { const r = new RegExp(s); const b = [...document.querySelectorAll('button')].find((x) => r.test(x.textContent.trim()) && !x.disabled && x.offsetParent !== null); if (b) { b.click(); return true } return false }, re.source)
  const 글 = () => p.evaluate(() => document.body.innerText)
  await p.goto(주소 + '/forms/sajin-daeji', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(3500)
  /* 칸 자리(쪽 안 pt) → 화면 좌표 */
  const 칸자리 = (r, col) => p.evaluate(([r, col]) => {
    const g = window.__격자; if (!g) return null
    const sh = g.doc.sheets[0]; const x = sh.cells.find((q) => q[0] === r && q[1] === col); if (!x) return null
    const cv = document.querySelector('canvas.gx-page'); const rect = cv.getBoundingClientRect()
    /* 판짜기와 같은 셈 — A4 세로 · 여백 */
    const X = [0]; for (let i = 1; i <= sh.pc; i++) X[i] = X[i - 1] + (sh.w[i - 1] || 0)
    const Y = [0]; for (let i = 1; i <= sh.pr; i++) Y[i] = Y[i - 1] + (sh.h[i - 1] ?? 15)
    const W = 595.28, H = 841.89, [ml, mr, mt] = (sh.marg || [0.45, 0.35, 0.5, 0.5]).map((v) => v * 72)
    const pw = W - ml - mr, s = Math.min(1, pw / X[sh.pc]), ox = ml + (pw - X[sh.pc] * s) / 2
    const cx = ox + (X[col - 1] + X[col - 1 + x[3]]) / 2 * s, cy = mt + (Y[r - 1] + Y[r - 1 + x[2]]) / 2 * s
    return { x: rect.left + cx / W * rect.width, y: rect.top + cy / H * rect.height, w: (X[col - 1 + x[3]] - X[col - 1]) * s / W * rect.width, h: (Y[r - 1 + x[2]] - Y[r - 1]) * s / H * rect.height }
  }, [r, col])
  /* 칸 안 그림이 흰색인가(가운데 네모 평균) */
  const 흰가 = (r, col) => p.evaluate(([r, col]) => {
    const g = window.__격자; const sh = g.doc.sheets[0]; const x = sh.cells.find((q) => q[0] === r && q[1] === col)
    const cv = document.querySelector('canvas.gx-page'); const ctx = cv.getContext('2d')
    const X = [0]; for (let i = 1; i <= sh.pc; i++) X[i] = X[i - 1] + (sh.w[i - 1] || 0)
    const Y = [0]; for (let i = 1; i <= sh.pr; i++) Y[i] = Y[i - 1] + (sh.h[i - 1] ?? 15)
    const W = 595.28, H = 841.89, [ml, mr, mt] = (sh.marg || [0.45, 0.35, 0.5, 0.5]).map((v) => v * 72)
    const pw = W - ml - mr, s = Math.min(1, pw / X[sh.pc]), ox = ml + (pw - X[sh.pc] * s) / 2
    const k = cv.width / W
    const x0 = (ox + X[col - 1] * s) * k, x1 = (ox + X[col - 1 + x[3]] * s) * k, y0 = (mt + Y[r - 1] * s) * k, y1 = (mt + Y[r - 1 + x[2]] * s) * k
    const d = ctx.getImageData(Math.round(x0 + (x1 - x0) * 0.3), Math.round(y0 + (y1 - y0) * 0.3), Math.max(1, Math.round((x1 - x0) * 0.4)), Math.max(1, Math.round((y1 - y0) * 0.4))).data
    let sum = 0; for (let i = 0; i < d.length; i += 4) sum += (d[i] + d[i + 1] + d[i + 2]) / 3
    return sum / (d.length / 4)
  }, [r, col])
  /* ① 사진 칸 3곳 · 안내 */
  await p.evaluate(() => { const cv = document.querySelector('canvas.gx-page'); cv.scrollIntoView({ block: 'start' }); window.scrollBy(0, -60) }); await p.waitForTimeout(500)
  const 자리 = await 칸자리(10, 7)
  봐(!!자리 && 자리.h > 20, '① 사진 칸(10행 7열) 자리 읽음', 자리)
  await p.mouse.click(자리.x, 자리.y); await p.waitForTimeout(600)
  const e1 = await p.evaluate(() => ({ 머리: (document.querySelector('.gx-ed-n') || {}).innerText || '', 사진단추: !!document.querySelector('.gx-ed-ph'), 글칸: !!document.querySelector('.gx-ed-r .fw-in'), 단추들: [...document.querySelectorAll('.gx-ed-phb button')].map((b) => b.textContent.trim()) }))
  봐(e1.사진단추 && !e1.글칸 && e1.단추들.some((t) => /사진 고르기/.test(t)) && e1.단추들.some((t) => /찍기/.test(t)) === 폰, `${기기} ① 사진 칸을 누르면 «📷 사진 고르기»(글 칸 아님 · 📸 찍기는 폰에만) — ${e1.머리}`, e1)
  const 흰0 = await 흰가(10, 7)
  봐(흰0 > 235, '① 빈 사진 칸은 희고 안내 글만', 흰0)
  /* ② 가상 사진 3장 한 번에 */
  /* 파일은 시험 쪽에서 그려 넣음(가상 · EXIF 때 넣음) */
  const 그림파일 = async (이름, 색, 때) => {
    const bytes = await p.evaluate(async ([색, 때]) => {
      const c = document.createElement('canvas'); c.width = 800; c.height = 600; const g = c.getContext('2d')
      g.fillStyle = 색; g.fillRect(0, 0, 800, 600); g.fillStyle = '#fff'; g.font = 'bold 60px sans-serif'; g.fillText('예시 ' + 때.slice(0, 10), 60, 320)
      const b = await new Promise((ok) => c.toBlob(ok, 'image/jpeg', 0.9)); const u = new Uint8Array(await b.arrayBuffer())
      /* EXIF 때 넣기(APP1 · DateTimeOriginal) — 사진예시.js 때넣기와 같은 꼴을 간단히 */
      const enc = new TextEncoder(); const 때b = enc.encode(때.replace(/-/g, ':') + '\u0000')
      const tiff = [0x4d, 0x4d, 0, 0x2a, 0, 0, 0, 8, 0, 1, 0x87, 0x69, 0, 4, 0, 0, 0, 1, 0, 0, 0, 26, 0, 0, 0, 0, 0, 1, 0x90, 0x03, 0, 2, 0, 0, 0, 20, 0, 0, 0, 44, 0, 0, 0, 0]
      const body = new Uint8Array(tiff.length + 20); body.set(tiff); body.set(때b.slice(0, 20), tiff.length)
      const app1 = new Uint8Array(2 + 2 + 6 + body.length); app1[0] = 0xff; app1[1] = 0xe1; const L = app1.length - 2; app1[2] = L >> 8; app1[3] = L & 255; app1.set([0x45, 0x78, 0x69, 0x66, 0, 0], 4); app1.set(body, 10)
      const out = new Uint8Array(u.length + app1.length); out.set(u.slice(0, 2)); out.set(app1, 2); out.set(u.slice(2), 2 + app1.length)
      return [...out]
    }, [색, 때])
    return { name: 이름, mimeType: 'image/jpeg', buffer: Buffer.from(bytes) }
  }
  const f1 = await 그림파일('01_착공전.jpg', '#8b5e3c', '2026-09-01 08:40:00'), f2 = await 그림파일('02_시공중.jpg', '#1f6f8b', '2026-09-15 10:05:00'), f3 = await 그림파일('03_준공.jpg', '#3c8b5e', '2026-10-20 13:20:00')
  await p.setInputFiles('.gx-ed-phb input[type=file]:not([capture])', [f1, f2, f3]); await p.waitForTimeout(4000)
  const 흰 = [await 흰가(10, 7), await 흰가(11, 7), await 흰가(12, 7)]
  봐(흰.every((v) => v < 200), `${기기} ② 사진 3장 한 번에 → 세 칸 모두 그림(밝기 ${흰.map((v) => Math.round(v)).join(' · ')})`, 흰)
  const 날 = await p.evaluate(() => { const g = window.__격자; return [10, 11, 12].map((r) => g.책.값(0, r, 4)) })
  봐(날.every((v) => typeof v === 'number' && v > 46000), `${기기} ② 촬영일 3칸이 찍은 날로(일련 ${날.join(' · ')})`, 날)
  const 말 = await 글()
  봐(/사진 3장을 넣었습니다/.test(말) && /촬영일 3칸/.test(말), '② 알림 «사진 3장을 넣었습니다 · 촬영일 3칸»', (말.match(/📷[^\n]*/) || [])[0])
  /* ③ 돌리기 · 빼기 · 끌어놓기 */
  const 전 = await p.evaluate(() => document.querySelector('canvas.gx-page').toDataURL().length)
  봐(await 누름(/⟳ 돌리기/), '③ ⟳ 돌리기 누름'); await p.waitForTimeout(1500)
  const 후 = await p.evaluate(() => document.querySelector('canvas.gx-page').toDataURL().length)
  봐(전 !== 후, '③ 돌리면 그림이 바뀜', [전, 후])
  봐(await 누름(/✕ 빼기/), '③ ✕ 빼기 누름'); await p.waitForTimeout(800)
  봐((await 흰가(10, 7)) > 235, '③ 뺀 칸은 다시 흼', await 흰가(10, 7))
  /* 끌어다 놓기 — 두 번째 칸 자리에 1장 */
  await p.evaluate(() => { const cv = document.querySelector('canvas.gx-page'); cv.scrollIntoView({ block: 'start' }); window.scrollBy(0, -60) }); await p.waitForTimeout(400)
  const 자리2 = await 칸자리(11, 7)
  const dt = await p.evaluateHandle(async ([bytes]) => { const dt = new DataTransfer(); dt.items.add(new File([new Uint8Array(bytes)], '끌어놓은.jpg', { type: 'image/jpeg' })); return dt }, [[...f3.buffer]])
  await p.dispatchEvent('canvas.gx-page', 'dragover', { dataTransfer: dt, clientX: 자리2.x, clientY: 자리2.y })
  await p.dispatchEvent('canvas.gx-page', 'drop', { dataTransfer: dt, clientX: 자리2.x, clientY: 자리2.y }); await p.waitForTimeout(2500)
  봐(/사진 1장을 넣었습니다/.test(await 글()), '③ 종이에 끌어다 놓기 → «사진 1장을 넣었습니다»', (await 글()).match(/📷[^\n]*/))
  /* ④ PDF · 저장 · 불러오기 · 새로고침 */
  const 기 = p.waitForEvent('download', { timeout: 60000 }).catch(() => null)
  await 누름(/📄 PDF 저장/); const d = await 기; await p.waitForTimeout(500)
  const pdf길 = d ? await d.path() : null
  const pdf머리 = pdf길 ? fs.readFileSync(pdf길).slice(0, 4).toString() : ''
  봐(!!d && pdf머리 === '%PDF' && fs.statSync(pdf길).size > 20000, `④ 📄 PDF 저장 → 진짜 PDF(${pdf길 ? Math.round(fs.statSync(pdf길).size / 1024) : 0} KB · 사진 든 쪽)`, [!!d, pdf머리])
  await 누름(/💾 저장/); await p.waitForTimeout(800)
  await 누름(/🧹 빈칸으로/); await p.waitForTimeout(800)
  봐((await 흰가(11, 7)) > 235, '④ 🧹 빈칸으로 → 사진 없음', await 흰가(11, 7))
  await 누름(/📂 저장한 것/); await p.waitForTimeout(500); await 누름(/^불러오기$/); await p.waitForTimeout(2500)
  봐((await 흰가(11, 7)) < 200 && (await 흰가(12, 7)) < 200, '④ 📂 불러오기 → 저장했던 사진 그대로(2칸)', [await 흰가(11, 7), await 흰가(12, 7)])
  await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForTimeout(3500)
  봐((await 흰가(11, 7)) < 200, '④ 새로고침 → 쓰던 사진 그대로(이 브라우저)', await 흰가(11, 7))
  /* ⑤ 예시 · 다른 서식 · 넘침 */
  await 누름(/✍ 예시 채우기/); await p.waitForTimeout(5000)
  const 예 = [await 흰가(10, 7), await 흰가(11, 7), await 흰가(12, 7)]
  봐(예.every((v) => v < 215), `${기기} ⑤ ✍ 예시 채우기 → 사진 3칸(가상 그림)`, 예)
  for (const w of [320, 360, 390, 860, 1280]) {
    await p.setViewportSize({ width: w, height: 800 }); await p.waitForTimeout(300)
    const n = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    봐(n <= 1, `${기기} ⑤ ${w}px 가로 넘침 없음`, n)
  }
  await p.goto(주소 + '/forms/achasago', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(3000)
  const 다른 = await p.evaluate(() => /사진 넣기/.test(document.body.innerText))
  봐(!다른, '⑤ 아차사고 보고서엔 사진 칸 안내 없음(글 칸만)')
  봐(!오류.length, 기기 + ' 화면 오류 없음', 오류.join(' | '))
  await c.close()
}
await 브.close()
console.log(bad ? `✗ ${bad} 틀림 · ${ok} 맞음` : `✓ 모두 맞음(${ok})`)
process.exit(bad ? 1 : 0)
