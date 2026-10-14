/**
 * 📷 사진 → 캐드 화면 시험 (G287 · 2026-10-14) — 진짜 브라우저(Playwright)로 예시 세 가지를 끝까지
 *   node tools/시험_사진캐드화면.mjs [주소=http://127.0.0.1:4997] [캡처폴더]
 *   도면 사진 · 손그림 · 건물 사진 × PC 1440 · 폰 430 → 모서리 → 캐드로 바꾸기 → 결과 요약 · 캡처 → DXF 받기(파일 저장)
 *   + 건물 자동 치수(크기 넣은 뒤 DIMENSION 4 개 넘게) · 도면 · 손그림 3D(판 · 3D DXF 3DFACE · OBJ)
 */
import { createRequire } from 'module'
const require = createRequire('/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
import fs from 'fs'
const 주소 = process.argv[2] || 'http://127.0.0.1:4997'
const 캡처 = process.argv[3] || ''
let 통과 = 0, 실패 = 0
const 치우기 = (p) => process.env.NO_CLEAN ? Promise.resolve() : p.evaluate(() => {
  document.querySelectorAll('.noticepop, .noticepop-bg').forEach((e) => { e.style.display = 'none' })
  for (const e of document.querySelectorAll('body *')) { const cs = getComputedStyle(e); if (cs.position === 'fixed' && /반갑습니다|다시 오셨네요|오랜만/.test(e.innerText || '')) e.style.visibility = 'hidden' }   // 지우면(remove) 리액트가 깨져 화면이 멈춤 — 숨기기만
})
const 봄 = (이름, 참, 더 = '') => { if (참) { 통과++; console.log('  ✓', 이름, 더) } else { 실패++; console.log('  ✗', 이름, 더) } }

// 시험 컨테이너는 jsDelivr 에 못 나가므로 글 읽기(PaddleOCR) 실행기 · 모델을 이 기기 복사본으로 대신 줌(실제 사이트에서는 jsDelivr)
const 대신줄곳 = (u) => {
  const 이름 = u.split('?')[0].split('/').pop()
  if (u.includes('/onnxruntime-web@')) return '/tmp/g10/ocr/node_modules/onnxruntime-web/dist/' + 이름
  if (u.includes('/paddle-ocr-onnx-models@')) return '/tmp/g10/ocr/pom/package/models/' + 이름
  // 손글씨 숫자 모델: 실제 사이트는 jsDelivr(깃허브 저장소) 먼저 → 이 저장소 복사본 · SON_FALLBACK=1 이면 404 로 «사이트에서 받기» 길을 시험
  if (u.includes('/gh/kimmyounghwan/K-conmap@')) return process.env.SON_FALLBACK === '1' ? null : '/tmp/g10/fm55/' + u.split('?')[0].replace(/^.*\/gh\/kimmyounghwan\/K-conmap@[^/]+\//, '')
  return null
}
const 글읽기길 = async (판) => {
  if (process.env.NO_OCR === '1') return
  await 판.route('https://cdn.jsdelivr.net/**', async (route) => {
    const 곳 = 대신줄곳(route.request().url())
    if (!곳 || !fs.existsSync(곳)) return route.fulfill({ status: 404, body: 'x' })
    const ct = 곳.endsWith('.mjs') ? 'text/javascript' : 곳.endsWith('.wasm') ? 'application/wasm' : 'application/octet-stream'
    route.fulfill({ status: 200, body: fs.readFileSync(곳), headers: { 'content-type': ct, 'access-control-allow-origin': '*' } })
  })
}
const 브 = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] })
const 크기들 = process.env.ONLY === 'pc' ? [['PC', { width: 1440, height: 900 }]] : process.env.ONLY === 'phone' ? [['폰', { width: 430, height: 900 }]] : [['PC', { width: 1440, height: 900 }], ['폰', { width: 430, height: 900 }]]
for (const [이름, 크기] of 크기들) for (const 꼴 of ['도면', '손그림', '건물']) {
  console.log(`■ ${이름} · ${꼴}`)
  const 판 = await 브.newContext({ viewport: 크기, deviceScaleFactor: 이름 === '폰' ? 2 : 1, acceptDownloads: true, userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36' })
  await 글읽기길(판)
  const p = await 판.newPage()
  const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e)))
  p.on('worker', (w) => w.on('console', (m) => { if (m.type() === 'error') 오류.push('일꾼: ' + m.text().slice(0, 160)); if (process.env.DIAG) console.log('   일꾼:', m.text().slice(0, 300)) }))
  await p.goto(주소 + '/tools/sajincad', { waitUntil: 'domcontentloaded' })
  await p.evaluate(() => document.querySelectorAll('.noticepop, .noticepop-bg').forEach((e) => { e.style.display = 'none' }))
  await p.locator('.sc-kind', { hasText: 꼴 === '도면' ? '도면 사진' : 꼴 === '손그림' ? '손그림' : '건물 사진' }).first().click()
  const t0 = Date.now()
  await p.locator('.sc-ex').click()
  if (꼴 !== '건물') {
    await p.waitForSelector('text=캐드로 바꾸기', { timeout: 60000 })
    봄('모서리 찾음', await p.locator('text=저절로 찾았습니다').count() > 0)
    if (캡처) { await 치우기(p); await p.screenshot({ path: `${캡처}_${이름}_${꼴}_1모서리.png` }) }
    await p.locator('button', { hasText: '▶ 캐드로 바꾸기' }).click()
  }
  try { await p.waitForSelector('text=다 됐습니다', { timeout: 120000 }) } catch (e) { /* */ }
  const 됨 = await p.locator('text=다 됐습니다').count() > 0
  봄('결과까지', 됨, `(${((Date.now() - t0) / 1000).toFixed(1)}초)`)
  if (!됨) { console.log('   오류', 오류.slice(0, 3), await p.locator('.dx3-err').allInnerTexts(), '진행:', await p.locator('.dx3-bar').allInnerTexts()); if (캡처) await p.screenshot({ path: `${캡처}_${이름}_${꼴}_실패.png` }); await 판.close(); continue }
  const 요약 = await p.locator('.sc-sum').innerText().catch(() => '')
  console.log('   요약:', 요약.replace(/\s+/g, ' '))
  if (꼴 !== '건물' && process.env.NO_OCR !== '1') {
    const 글 = await p.locator('.sc-sum').getAttribute('data-ocr'), 손 = await p.locator('.sc-sum').getAttribute('data-son')
    봄('글 읽기 · 손글씨 숫자 모델 켬', 글 === '켬' && 손 === '켬', `(글 ${글} · 손 ${손})`)
  }
  await p.waitForTimeout(500)
  if (캡처) { await 치우기(p); await p.locator('.sc-view').scrollIntoViewIfNeeded(); await p.waitForTimeout(300); await p.screenshot({ path: `${캡처}_${이름}_${꼴}_2결과.png`, fullPage: false }) }
  // 건물: 크기를 모르면 가장 긴 가로선을 눌러 넓이 18000 넣기
  if (꼴 === '건물' && await p.locator('text=크기를 모릅니다').count()) {
    const 뷰 = await p.locator('.sc-view canvas').boundingBox()
    // 판 위쪽 1/8 쯤 가운데(지붕선) 를 눌러 봄
    // 지붕선(맨 위 가로선)을 찾을 때까지 위에서부터 눌러 봄(PC · 폰 판 크기가 달라서)
    for (let f = 0.04; f < 0.3 && !(await p.locator('.sc-pick').count()); f += 0.015) { await p.mouse.click(뷰.x + 뷰.width / 2, 뷰.y + 뷰.height * f); await p.waitForTimeout(80) }
    if (await p.locator('.sc-pick').count()) { await p.locator('.sc-pick input').fill('18000'); await p.locator('.sc-pick button', { hasText: '길이 넣기' }).click() }
    봄('건물 크기 넣음', await p.locator('text=크기를 모릅니다').count() === 0)
    if (캡처) { await 치우기(p); await p.locator('.sc-view').scrollIntoViewIfNeeded(); await p.waitForTimeout(400); await p.screenshot({ path: `${캡처}_${이름}_${꼴}_3치수.png` }) }
  }
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 15000 }).catch(() => null), p.locator('button', { hasText: '⬇ DXF 받기' }).click()])
  if (dl) {
    const 길 = `/tmp/g10/sc/화면_${이름}_${꼴}.dxf`; await dl.saveAs(길); const t = fs.readFileSync(길, 'utf8')
    const 치수수 = (t.match(/\nDIMENSION\r?\n/g) || []).length
    봄('DXF 받음', /SECTION/.test(t) && /EOF\s*$/.test(t), `(${(t.length / 1024).toFixed(0)}KB · 선 ${(t.match(/\nLINE\r?\n/g) || []).length} · 치수 ${치수수})`)
    // 🏢 건물: 크기를 넣으면 창 · 문 자리 치수 줄 + 전체 폭 · 높이가 저절로(G287 「저절로 넣게 만들어줘 치수」)
    if (꼴 === '건물') 봄('건물 자동 치수', 치수수 >= 4, `(치수 ${치수수})`)
  } else 봄('DXF 받음', false)
  // 🧊 3D(G287 「3D도 가능하게 해줘」): 도면 · 손그림 — 3D 로 보기 → 3D DXF(3DFACE) · OBJ 받기
  if (꼴 !== '건물') {
    await p.locator('button', { hasText: '🧊 3D 로 보기' }).click()
    await p.waitForTimeout(600)
    const 판크기 = await p.locator('.sc-3dcv').boundingBox()
    봄('3D 판', !!판크기 && 판크기.width > 200 && 판크기.height > 150, 판크기 ? `(${Math.round(판크기.width)}×${Math.round(판크기.height)})` : '')
    if (캡처) { await 치우기(p); await p.locator('.sc-3dcv').scrollIntoViewIfNeeded(); await p.waitForTimeout(400); await p.screenshot({ path: `${캡처}_${이름}_${꼴}_3D.png` }) }
    const [d3] = await Promise.all([p.waitForEvent('download', { timeout: 15000 }).catch(() => null), p.locator('button', { hasText: '⬇ 3D DXF 받기' }).click()])
    if (d3) { const 길 = `/tmp/g10/sc/화면_${이름}_${꼴}_3D.dxf`; await d3.saveAs(길); const t = fs.readFileSync(길, 'utf8'); const 면 = (t.match(/\n3DFACE\r?\n/g) || []).length; 봄('3D DXF 받음', 면 > 4 && /EOF\s*$/.test(t), `(3DFACE ${면})`) } else 봄('3D DXF 받음', false)
    const [d4] = await Promise.all([p.waitForEvent('download', { timeout: 15000 }).catch(() => null), p.locator('button', { hasText: '⬇ OBJ 받기' }).click()])
    if (d4) { const 길 = `/tmp/g10/sc/화면_${이름}_${꼴}.obj`; await d4.saveAs(길); const t = fs.readFileSync(길, 'utf8'); const v = (t.match(/^v /gm) || []).length, f = (t.match(/^f /gm) || []).length; 봄('OBJ 받음', v >= 8 && f >= 2 && v === f * 4, `(점 ${v} · 면 ${f})`) } else 봄('OBJ 받음', false)
  }
  봄('화면 오류 없음', 오류.length === 0, 오류.slice(0, 2).join(' | '))
  await 판.close()
}
await 브.close()
console.log(`\n사진캐드 화면 ${통과}/${통과 + 실패}`)
process.exit(실패 ? 1 : 0)
