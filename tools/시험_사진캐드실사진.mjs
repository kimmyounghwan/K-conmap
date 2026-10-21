/**
 * 📷 사진 → 캐드 · 실제 사진 시험 (G287 · 2026-10-14) — 인터넷에서 찾은 실제 도면 사진 · 손그림 · 건물 사진을 진짜 화면에 넣어 봄
 *   node tools/시험_사진캐드실사진.mjs [주소] [사진폴더] [캡처폴더] [PC|폰]
 *   파일 이름 앞: 도면_ · 손_ · 건물_  (사진은 시험에만 — 사이트에 안 올림)
 */
import { createRequire } from 'module'
const require = createRequire('/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
import fs from 'fs'
import path from 'path'
const 주소 = process.argv[2] || 'http://127.0.0.1:4997'
const 폴더 = process.argv[3] || '/tmp/g10/real'
const 캡처 = process.argv[4] || '/tmp/g10/cap/실사진'
const 꼴폰 = process.argv[5] === '폰'
fs.mkdirSync(캡처, { recursive: true })
const 파일들 = fs.readdirSync(폴더).filter((f) => /^(도면|손|건물)_.*\.(jpe?g|png)$/i.test(f)).sort()

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
const 치우기 = (p) => p.evaluate(() => {
  document.querySelectorAll('.noticepop, .noticepop-bg').forEach((e) => { e.style.display = 'none' })
  for (const e of document.querySelectorAll('body *')) { const cs = getComputedStyle(e); if (cs.position === 'fixed' && /반갑습니다|다시 오셨네요|오랜만/.test(e.innerText || '')) e.style.visibility = 'hidden' }   // 지우면(remove) 리액트가 깨져 화면이 멈춤 — 숨기기만
})
const 표 = []
for (const f of 파일들) {
  const 꼴 = f.startsWith('도면') ? '도면' : f.startsWith('손') ? '손그림' : '건물'
  const 이름 = f.replace(/\.[^.]+$/, '')
  const 판 = await 브.newContext({ viewport: 꼴폰 ? { width: 430, height: 900 } : { width: 1440, height: 900 }, deviceScaleFactor: 꼴폰 ? 2 : 1, acceptDownloads: true })
  await 글읽기길(판)
  const p = await 판.newPage()
  const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
  await p.goto(주소 + '/tools/sajincad', { waitUntil: 'domcontentloaded' })
  await 치우기(p)
  await p.locator('.sc-kind', { hasText: 꼴 === '도면' ? '도면 사진' : 꼴 === '손그림' ? '손그림' : '건물 사진' }).first().click()
  const t0 = Date.now()
  await p.locator('input[type=file][accept="image/*"]:not([capture])').first().setInputFiles({ name: 'photo.jpg', mimeType: 'image/jpeg', buffer: fs.readFileSync(path.join(폴더, f)) })   // 한글 경로는 Playwright 가 못 넘김 → 바이트로
  const 줄 = { 이름, 꼴 }
  if (꼴 !== '건물') {
    try { await p.waitForSelector('text=캐드로 바꾸기', { timeout: 60000 }) } catch (e) { /* */ }
    줄.모서리 = (await p.locator('text=저절로 찾았습니다').count()) ? '찾음' : '못 찾음(사진 끝)'
    await 치우기(p); await p.screenshot({ path: `${캡처}/${이름}_1모서리.png` })
    await p.locator('button', { hasText: '▶ 캐드로 바꾸기' }).click()
  }
  // 끝: 결과 · 건물 네모 찍기(소실점 못 찾음) · 오류 가운데 먼저 오는 것
  try { await p.waitForFunction(() => /다 됐습니다|정면의 네모 하나를|읽지 못했습니다|펴지 못했습니다|열지 못했습니다/.test(document.body.innerText), null, { timeout: 120000 }) } catch (e) { /* */ }
  if (await p.locator('text=정면의 네모 하나를').count()) 줄.건물 = '소실점 못 찾음 → 네 점 찍기 화면'
  줄.초 = ((Date.now() - t0) / 1000).toFixed(1)
  if (await p.locator('text=다 됐습니다').count()) {
    줄.요약 = (await p.locator('.sc-sum').innerText().catch(() => '')).replace(/\s+/g, ' ')
    await 치우기(p); await p.locator('.sc-view').scrollIntoViewIfNeeded(); await p.waitForTimeout(300)
    await p.screenshot({ path: `${캡처}/${이름}_2결과.png` })
    // 📏 G360 알림 띠(크기를 모릅니다 · 문 폭으로 짐작 · 벽만)가 있으면 그 자리도 한 장
    const 띠 = p.locator('.sc-banner, .sc-note')
    if (await 띠.count()) { 줄.알림 = (await 띠.allInnerTexts()).map((x) => x.replace(/\s+/g, ' ').slice(0, 60)).join(' / '); await 띠.first().evaluate((e) => e.scrollIntoView({ block: 'start' })); await p.evaluate(() => scrollBy(0, -70)); await p.waitForTimeout(200); await p.screenshot({ path: `${캡처}/${이름}_3알림.png` }) }
    const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 15000 }).catch(() => null), p.locator('button', { hasText: '⬇ DXF 받기' }).click()])
    if (dl) { const 길 = `${캡처}/${이름}.dxf`; await dl.saveAs(길); const t = fs.readFileSync(길, 'utf8'); 줄.DXF = `${(t.length / 1024).toFixed(0)}KB 선${(t.match(/\nLINE\r?\n/g) || []).length} 치수${(t.match(/\nDIMENSION\r?\n/g) || []).length}` }
  } else {
    줄.요약 = '결과 없음 · ' + (await p.locator('.dx3-err').allInnerTexts()).join(' / ')
    await 치우기(p); await p.screenshot({ path: `${캡처}/${이름}_2결과.png` })
  }
  줄.오류 = 오류.length
  console.log(JSON.stringify(줄))
  표.push(줄)
  await 판.close()
}
fs.writeFileSync(`${캡처}/표.json`, JSON.stringify(표, null, 1))
await 브.close()
