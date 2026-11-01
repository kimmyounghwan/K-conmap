// 📡 G493 (2026-11-01) 실시간 사진대지(/tools/photo-live) 화면 시험 — PC 창 · 폰 창(브라우저 프로필 둘) 이 가짜 서버(HTTP) 하나를 같이 씀
//   가짜 파이어베이스로 빌드:  cd web && npx vite build --config /tmp/g10/mockfb/vite.config.mockhttp.js   (→ /tmp/g10/g493/dmock)
//   D=/tmp/g10/g493/dmock node tools/시험_실시간사진대지화면.mjs
//   ① PC: 현장 만들기 → 코드 9자리 · 폰: ?c=코드 주소로 열면 코드가 채워짐 → 비밀번호 → 열림
//   ② 폰: 📸 찍기(카메라 입력칸) 로 2장 → PC 에 몇 초 안에 2장 ✓ · 미리보기 그림 · 폰 쪽 상태 ✓
//   ③ PC: 공사명 · 내용 적음 → 폰에도 같은 글 · 폰: 인터넷 끊김(mock끊김) 에서 1장 → ⏳ 올리기 전 · 📶 → 다시 되면 저절로 올라가 PC 3장
//   ④ PC: 1장 빼기 → 폰도 2장(묘비) · PC: PDF 받기(%PDF) · PC 새로고침해도 이 기기 창고에서 그대로(2장 · 그림) · 끊기
//   ⑤ 320 ~ 1280 가로 넘침 없음 · 화면 오류 없음 · 폰엔 📸 찍기 · PC 엔 끌어놓기
//   ⑥ 세 번째 기기가 코드로 열면 사진 그림까지 바로(🩹 G495 — 사이트 시험에서 «↓ 받는 중» 멈춤을 잡아 고침)
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'module'
import { createCanvas } from '../web/node_modules/@napi-rs/canvas/index.js'
const require = createRequire(process.env.PW || '/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const D = process.env.D || '/tmp/g10/g493/dmock'
const PORT = +(process.env.PORT || 4493)
let ok = 0, bad = 0
const 봐 = (c, m, 더 = '') => { if (c) ok++; else bad++; console.log(c ? '  ✓' : '  ✗', m, c ? '' : String(typeof 더 === 'string' ? 더 : JSON.stringify(더)).slice(0, 600)) }

/* ── 가짜 서버: 정적 파일(SPA) + /__db ── */
let 뿌리 = {}
const 쪼갬 = (p) => String(p || '').split('/').filter(Boolean)
const 값 = (p) => { let o = 뿌리; for (const k of 쪼갬(p)) { if (o == null || typeof o !== 'object') return null; o = o[k] } return o === undefined ? null : o }
const 넣기 = (p, v) => { const ks = 쪼갬(p); if (!ks.length) { 뿌리 = v || {}; return } let o = 뿌리; for (let i = 0; i < ks.length - 1; i++) { if (o[ks[i]] == null || typeof o[ks[i]] !== 'object') o[ks[i]] = {}; o = o[ks[i]] } if (v === null || v === undefined) delete o[ks[ks.length - 1]]; else o[ks[ks.length - 1]] = v }
const 꼴 = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.wasm': 'application/wasm', '.webp': 'image/webp' }
const 몸읽기 = (req) => new Promise((r) => { let s = ''; req.on('data', (c) => { s += c }); req.on('end', () => r(s)) })
const 서버 = http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x')
  if (u.pathname.startsWith('/__db')) {
    res.setHeader('Content-Type', 'application/json')
    if (req.method === 'GET') { res.end(JSON.stringify(값(u.searchParams.get('p')))); return }
    const 몸 = await 몸읽기(req)
    if (req.method === 'PUT') { 넣기(u.searchParams.get('p'), 몸 ? JSON.parse(몸) : null); res.end('null'); return }
    if (req.method === 'PATCH') { for (const [k, v] of Object.entries(JSON.parse(몸 || '{}'))) 넣기(k, v); res.end('null'); return }
    res.statusCode = 405; res.end('null'); return
  }
  let f = path.join(D, decodeURIComponent(u.pathname))
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(D, 'index.html')
  res.setHeader('Content-Type', 꼴[path.extname(f)] || 'application/octet-stream')
  fs.createReadStream(f).pipe(res)
})
await new Promise((r) => 서버.listen(PORT, '127.0.0.1', r))
const 주소 = `http://127.0.0.1:${PORT}`

/* ── 지어낸 사진(JPEG) ── */
function jpeg(w, h, 색, 글) {
  const c = createCanvas(w, h); const g = c.getContext('2d')
  g.fillStyle = 색; g.fillRect(0, 0, w, h)
  for (let i = 0; i < 40; i++) { g.fillStyle = `hsl(${(i * 47) % 360} 60% ${30 + (i % 5) * 10}%)`; g.fillRect((i * 97) % w, (i * 61) % h, 60 + (i % 7) * 20, 40 + (i % 5) * 20) }
  g.fillStyle = '#fff'; g.font = 'bold 90px sans-serif'; g.fillText(글, 60, h / 2)
  return c.toBuffer('image/jpeg', 0.9)
}
const 사진들 = [['IMG_0001.jpg', jpeg(2400, 1800, '#2d6a4f', '1 터파기')], ['IMG_0002.jpg', jpeg(1800, 2400, '#7b2cbf', '2 철근')], ['IMG_0003.jpg', jpeg(2400, 1800, '#9d4edd', '3 콘크리트')]]
const 파일 = (i) => ({ name: 사진들[i][0], mimeType: 'image/jpeg', buffer: 사진들[i][1] })

const 브 = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] })
const 폰UA = 'Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'
const 새창 = async (폰) => {
  const c = await 브.newContext({ viewport: 폰 ? { width: 390, height: 844 } : { width: 1280, height: 900 }, locale: 'ko-KR', isMobile: 폰, hasTouch: 폰, acceptDownloads: true, userAgent: 폰 ? 폰UA : undefined })
  await c.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|geojs|firebaseio|gstatic/, (r) => r.fulfill({ status: 200, body: '' }))
  await c.addInitScript(() => { try { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); sessionStorage.setItem('kcm_notice_seen', '2026-10-업체') } catch (e) {} })
  const p = await c.newPage(); const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e).slice(0, 300))); p.on('dialog', (d) => d.accept())
  return { c, p, 오류 }
}
const 글 = (p) => p.evaluate(() => document.body.innerText)
const 누름 = (p, re) => p.evaluate((s) => { const r = new RegExp(s); const b = [...document.querySelectorAll('button')].find((x) => r.test(x.textContent.trim()) && !x.disabled && x.offsetParent !== null); if (b) { b.click(); return true } return false }, re.source)
const 기다림 = async (p, f, 초 = 20, 간 = 300) => { const t0 = Date.now(); while (Date.now() - t0 < 초 * 1000) { try { const v = await p.evaluate(f); if (v) return v } catch (e) { /* */ } await p.waitForTimeout(간) } return null }
const 채움 = async (p, 라벨re, 값) => p.evaluate(([s, v]) => { const r = new RegExp(s); const l = [...document.querySelectorAll('label')].find((x) => r.test(x.textContent)); const i = l && l.querySelector('input'); if (!i) return false; const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(i, v); i.dispatchEvent(new Event('input', { bubbles: true })); return true }, [라벨re.source, 값])
const 사진수 = (p) => p.evaluate(() => ({ 칸: document.querySelectorAll('.pb-item').length, 그림: document.querySelectorAll('.pb-item .pb-thumb img').length, 상태: [...document.querySelectorAll('.pl-st')].map((x) => x.textContent), 쪽그림: document.querySelectorAll('.pb-page .pb-rimg img').length }))

const PC = await 새창(false), 폰 = await 새창(true)
console.log('■ ① 현장 만들기(PC) · 코드로 열기(폰)')
await PC.p.goto(주소 + '/tools/photo-live', { waitUntil: 'domcontentloaded' }); await PC.p.waitForTimeout(2500)
const t0 = await 글(PC.p)
봐(/실시간 사진대지/.test(t0) && /현장 만들기/.test(t0) && /코드로 열기/.test(t0), 'PC: 화면 열림 · «현장 만들기» · «코드로 열기» 단추')
봐(/위에서 «현장 만들기»/.test(t0) && !!(await PC.p.$('.pb-drop')) && !(await PC.p.$('.pl-shootb')), 'PC: 끌어놓기 칸(📸 큰 단추는 없음)')
봐(/사용 방법/.test(t0) && /PC 에서 현장 만들기/.test(t0) && /폰에서 찍기/.test(t0) && /7일 뒤 지워집니다/.test(t0), 'PC: 📖 사용 방법이 처음엔 펼쳐짐 — 만들기 · 열기 · 찍기 · 7일')
봐(await 누름(PC.p, /^현장 만들기$/), 'PC: «현장 만들기» 누름'); await PC.p.waitForTimeout(300)
await 채움(PC.p, /현장 이름/, '시험 현장'); await 채움(PC.p, /비밀번호 \(6자/, 'test1234'); await 채움(PC.p, /비밀번호 한 번 더/, 'test1234')
봐(await 누름(PC.p, /^만들기$/), 'PC: «만들기» 누름')
const 코드글 = await 기다림(PC.p, () => { const b = document.querySelector('.bk-big'); return b && b.textContent.trim() }, 15)
const 코드 = String(코드글 || '').replace(/-/g, '')
봐(코드.length === 9 && /^[A-Z0-9]{9}$/.test(코드), `PC: 코드 9자리 나옴 «${코드글}»`, 코드글)
봐(!!값(`pb_doc/${코드}`) && (값(`pb_doc/${코드}`) || {}).r === 1 && String((값(`pb_doc/${코드}`) || {}).s || '').startsWith('v1.'), '서버: pb_doc 에 잠근 상태(v1.) · 판 1', 값(`pb_doc/${코드}`))
await 폰.p.goto(`${주소}/tools/photo-live?c=${코드}`, { waitUntil: 'domcontentloaded' }); await 폰.p.waitForTimeout(2500)
const 폰0 = await 폰.p.evaluate(() => ({ 열기칸: !![...document.querySelectorAll('label')].find((x) => /코드 9자리/.test(x.textContent)), 코드값: ([...document.querySelectorAll('label')].find((x) => /코드 9자리/.test(x.textContent)) || { querySelector: () => null }).querySelector('input')?.value, 찍기: !!document.querySelector('.pl-shootb'), 카메라칸: !!document.querySelector('input[type=file][capture]') }))
봐(폰0.열기칸 && String(폰0.코드값).replace(/-/g, '') === 코드, '폰: ?c= 주소로 열면 «코드로 열기» 가 열리고 코드가 채워져 있음', 폰0)
봐(폰0.찍기 && 폰0.카메라칸, '폰: 📸 찍기 큰 단추 · 카메라 입력칸', 폰0)
await 채움(폰.p, /^비밀번호/, 'test1234')
봐(await 누름(폰.p, /^열기$/), '폰: «열기» 누름')
const 폰열림 = await 기다림(폰.p, () => /코드 [A-Z0-9]{3}-[A-Z0-9]{3}-[A-Z0-9]{3}/.test(document.querySelector('.bk-bar')?.textContent || ''), 15)
봐(!!폰열림, '폰: 현장이 열려 띠에 코드가 보임', await 글(폰.p).then((t) => t.slice(0, 300)))

console.log('■ ② 폰에서 2장 찍기 → PC')
const t찍 = Date.now()
await 폰.p.setInputFiles('input[type=file][capture]', [파일(0)]); await 폰.p.waitForTimeout(300)
await 폰.p.setInputFiles('input[type=file][capture]', [파일(1)])
const PC2 = await 기다림(PC.p, () => document.querySelectorAll('.pb-item .pb-thumb img').length >= 2 && [...document.querySelectorAll('.pl-st')].every((x) => x.textContent === '✓') ? document.querySelectorAll('.pb-item').length : 0, 40)
const 걸림 = ((Date.now() - t찍) / 1000).toFixed(1)
봐(PC2 === 2, `PC: 폰이 찍은 2장이 ${걸림}초 안에 들어옴(그림 · ✓)`, await 사진수(PC.p))
const 폰2 = await 기다림(폰.p, () => [...document.querySelectorAll('.pl-st')].length === 2 && [...document.querySelectorAll('.pl-st')].every((x) => x.textContent === '✓'), 15)
봐(!!폰2, '폰: 2장 모두 ✓(올림)', await 사진수(폰.p))
const PC쪽 = await 사진수(PC.p)
봐(PC쪽.쪽그림 >= 2, 'PC: 미리보기 쪽에 사진 2장', PC쪽)
const pic수 = Object.keys(값(`pb_pic/${코드}`) || {}).length
봐(pic수 === 2 && Object.keys(값(`pb_pic/${코드}`)).every((id) => /^[0-9a-z]+-m[0-9a-z]+$/.test(id)) && Object.values(값(`pb_pic/${코드}`)).every((v) => String(v.s).startsWith('v1.') && v.s.length < 1500000), '서버: pb_pic 에 잠근 사진 2장(id 는 폰 m · v1. · 1,500,000 자 안)', Object.keys(값(`pb_pic/${코드}`) || {}))
봐(!JSON.stringify(값(`pb_doc/${코드}`)).includes('IMG_0001'), '서버: 상태 글에 파일 이름이 안 보임(잠김)')

console.log('■ ③ PC 에서 적으면 폰에도 · 폰 인터넷 끊김')
await 채움(PC.p, /^공사명/, '시험 공사')
await PC.p.evaluate(() => { const i = document.querySelectorAll('.pb-item')[0].querySelectorAll('.pb-kv input'); const 칸 = [...i].find((x, k) => k > 0) || i[0]; const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(칸, '터파기 전경'); 칸.dispatchEvent(new Event('input', { bubbles: true })) })
const 폰글 = await 기다림(폰.p, () => { const 공 = [...document.querySelectorAll('label')].find((x) => /^공사명/.test(x.textContent)); const v = 공 && 공.querySelector('input').value; const 내 = [...document.querySelectorAll('.pb-item input')].some((x) => x.value === '터파기 전경'); return v === '시험 공사' && 내 }, 20)
봐(!!폰글, '폰: PC 가 적은 공사명 «시험 공사» · 내용 «터파기 전경» 이 몇 초 안에 들어옴')
await 폰.p.evaluate(() => localStorage.setItem('mock끊김', '1'))
await 폰.p.setInputFiles('input[type=file][capture]', [파일(2)])
const 끊 = await 기다림(폰.p, () => [...document.querySelectorAll('.pl-st')].some((x) => /올리기 전/.test(x.textContent)) && /인터넷이 안 됩니다|모아 두었다가/.test(document.querySelector('.bk-bar')?.textContent || ''), 20)
봐(!!끊, '폰: 인터넷 끊김 — 3번째 사진 ⏳ 올리기 전 · 📶 모아 두었다가 올림 안내', (await 글(폰.p)).slice(0, 400))
await 폰.p.waitForTimeout(1500)
봐((await 사진수(PC.p)).칸 === 2, 'PC: 아직 2장(폰이 못 올림)')
await 폰.p.evaluate(() => { localStorage.setItem('mock끊김', '0'); window.dispatchEvent(new Event('online')) })
const PC3 = await 기다림(PC.p, () => document.querySelectorAll('.pb-item .pb-thumb img').length === 3 ? 3 : 0, 40)
봐(PC3 === 3, 'PC: 인터넷이 다시 되자 3번째 사진이 저절로 올라와 3장', await 사진수(PC.p))
봐(!!(await 기다림(폰.p, () => [...document.querySelectorAll('.pl-st')].every((x) => x.textContent === '✓') && /폰 · PC 같음/.test(document.querySelector('.bk-bar')?.textContent || ''), 15)), '폰: 모두 ✓ · «폰 · PC 같음»')

console.log('■ ⑥ 세 번째 기기(사무실 다른 PC)가 코드로 열면 사진 그림까지 받음 — 🩹 G495(사이트 시험에서 «↓ 받는 중» 멈춤)')
{
  const PC2 = await 새창(false)
  await PC2.p.goto(주소 + '/tools/photo-live', { waitUntil: 'domcontentloaded' }); await PC2.p.waitForTimeout(2500)
  봐(await 누름(PC2.p, /^코드로 열기$/), 'PC2: «코드로 열기» 누름'); await PC2.p.waitForTimeout(300)
  await 채움(PC2.p, /코드 9자리/, 코드); await 채움(PC2.p, /^비밀번호/, 'test1234')
  const t3 = Date.now(); 봐(await 누름(PC2.p, /^열기$/), 'PC2: «열기» 누름')
  const r6 = await 기다림(PC2.p, () => document.querySelectorAll('.pb-item').length === 3 && document.querySelectorAll('.pb-item .pb-thumb img').length === 3 && [...document.querySelectorAll('.pl-st')].every((x) => x.textContent === '✓') ? 3 : 0, 30)
  봐(r6 === 3, `PC2: 연 직후 사진 3장 그림까지 ✓ (${((Date.now() - t3) / 1000).toFixed(1)}초) — «↓ 받는 중» 에 멈추지 않음`, await 사진수(PC2.p))
  봐((await 사진수(PC2.p)).쪽그림 >= 2, 'PC2: 미리보기에도 그림', await 사진수(PC2.p))
  const 공 = await PC2.p.evaluate(() => (([...document.querySelectorAll('label')].find((x) => /^공사명/.test(x.textContent)) || { querySelector: () => ({}) }).querySelector('input') || {}).value)
  봐(공 === '시험 공사', 'PC2: PC 가 적은 공사명도 그대로', 공)
  await PC2.c.close()
}

console.log('■ ④ 빼기 → 묘비 · PDF · 새로고침 · 끊기')
await PC.p.evaluate(() => document.querySelectorAll('.pb-item')[1].querySelector('.pb-del').click())
const 폰빼 = await 기다림(폰.p, () => document.querySelectorAll('.pb-item').length === 2 ? 2 : 0, 20)
봐(폰빼 === 2 && (await 사진수(PC.p)).칸 === 2, 'PC 가 1장 빼면 폰도 2장(묘비 — 되살아나지 않음)', { 폰: await 사진수(폰.p), PC: await 사진수(PC.p) })
봐(Object.keys(값(`pb_pic/${코드}`) || {}).length === 2 && (값(`pb_doc/${코드}`) || {}).r >= 4, '서버: 뺀 사진은 pb_pic 에서도 지워짐 · 판이 올라감', { pic: Object.keys(값(`pb_pic/${코드}`) || {}).length, r: (값(`pb_doc/${코드}`) || {}).r })
const 받 = PC.p.waitForEvent('download', { timeout: 60000 }).catch(() => null)
봐(await PC.p.evaluate(() => { const b = document.querySelector('button.pb-fmt.f-pdf:not([disabled])'); if (b) { b.click(); return true } return false }), 'PC: PDF 받기 누름')
const d = await 받; const 바 = d ? fs.readFileSync(await d.path()) : Buffer.alloc(0)
봐(바.slice(0, 4).toString() === '%PDF' && 바.length > 40000, `PC: 진짜 PDF ${Math.round(바.length / 1024)} KB`, 바.length)
await PC.p.reload({ waitUntil: 'domcontentloaded' }); await PC.p.waitForTimeout(3000)
const 다시 = await 사진수(PC.p)
봐(다시.칸 === 2 && 다시.그림 === 2 && /코드 [A-Z0-9]{3}-/.test(await PC.p.evaluate(() => document.querySelector('.bk-bar')?.textContent || '')), 'PC: 새로고침해도 이 기기 창고에서 2장 · 그림 · 현장 연결 그대로', 다시)
봐(await 누름(PC.p, /^끊기$/) && await 누름(PC.p, /한 번 더 누르면 끊습니다/), 'PC: «끊기» 두 번 → 끊음')
await PC.p.waitForTimeout(800)
const 끊뒤 = await PC.p.evaluate(() => ({ 띠: document.querySelector('.bk-bar')?.textContent || '', 칸: document.querySelectorAll('.pb-item').length }))
봐(/현장 만들기/.test(끊뒤.띠) && 끊뒤.칸 === 2, 'PC: 끊은 뒤에도 이 기기 사진 2장은 남고 «현장 만들기» 로 돌아감', 끊뒤)

console.log('■ ⑤ 넘침 · 오류')
for (const [창, w들] of [[폰, [320, 360, 390]], [PC, [860, 1280]]]) {
  for (const w of w들) {
    await 창.p.setViewportSize({ width: w, height: 800 }); await 창.p.waitForTimeout(400)
    const n = await 창.p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    봐(n <= 1, `${창 === 폰 ? '폰' : 'PC'} ${w}px 가로 넘침 없음`, n)
  }
}
봐(!PC.오류.length, 'PC 화면 오류 없음', PC.오류.join(' | '))
봐(!폰.오류.length, '폰 화면 오류 없음', 폰.오류.join(' | '))
if (process.env.CAP) {
  await PC.p.setViewportSize({ width: 1280, height: 900 }); await PC.p.screenshot({ path: process.env.CAP + '_PC.png', fullPage: false })
  await 폰.p.setViewportSize({ width: 390, height: 844 }); await 폰.p.screenshot({ path: process.env.CAP + '_폰.png', fullPage: false })
}
await PC.c.close(); await 폰.c.close(); await 브.close(); 서버.close()
console.log(bad ? `✗ ${bad} 틀림 · ${ok} 맞음` : `✓ 모두 맞음(${ok})`)
process.exit(bad ? 1 : 0)
