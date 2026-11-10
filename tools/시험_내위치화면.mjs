/**
 * 📍 G644 (2026-11-10) 내 위치 좌표 화면 시험 — 구운 사이트(dist)를 띄운 뒤:  node tools/시험_내위치화면.mjs [주소=http://127.0.0.1:4644]
 *   소장님: 「핸드폰으로 gps 좌표 xy 나오게 할 수 있어?」 · 「다운 받는거 없이 건설맵 들어가서 가능해?」 · 「응 만들어 보자. 오차는 설명해 주고..」
 *   ① 쪽을 열기만 해서는 위치를 안 물음(watchPosition 0번) · 누르면 그때 한 번
 *   ② 서울(37.5665, 126.978 · 오차 4 m) → X · Y = lib(중부 저절로) · «오차 ± 4.0 m 좋음» · 위도 · 도분초
 *   ③ 원점 바꾸기(서부) → X · Y = lib(서부) + «적용 원점은 중부원점» 알림 · 다시 중부 누르면 저절로 · 부산(129.0756)으로 움직이면 동부 저절로
 *   ④ 오차 30 m → «나쁨» · ⏱ 30초 평균(시계 빨리) — 결과 = lib 평균(1/오차² · 50 m 넘는 값 뺌) · 이 평균을 점으로 저장
 *   ⑤ 💾 점 저장 · 앞 점에서 거리 · 📋 모두 복사 = lib TSV · 📗 엑셀(내위치_좌표_날.xlsx · 시트 «좌표» · 점 이름 · X) · ✕ 두 번 눌러 지움 · 새로고침해도 남음(이 브라우저)
 *   ⑥ 🎯 찾아가기 — 북으로 10 m 점 → «10.0 m · 북(0°)» · 화살표 0° · 오차 안이면 «🎯» · 50 km 넘으면 원점 확인 알림
 *   ⑦ 위치 막음(권한 없음) → «위치를 막아 두셨습니다» 안내
 *   ⑧ 폰 390 · 360 · PC 1280 넘침 0 · 오류 0 · /tools 카드 · 빵부스러기 «내 위치 좌표» · 구운 쪽(/tools/gps.html — 제목 · h1 · [별표 2] · 측량 · 먹매김)
 * 인터넷 안 부름(파이어베이스 · 광고 · 애널리틱스 막음).
 */
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import * as W from '../web/src/lib/내위치.js'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const BASE = process.argv[2] || 'http://127.0.0.1:4644'
const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))

let bad = 0, n = 0
const ok = (이름, c, got) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (c || got === undefined ? '' : ' = ' + JSON.stringify(got).slice(0, 400))) }
const b = await chromium.launch()
const UA폰 = 'Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'
const 서울 = { latitude: 37.5665, longitude: 126.978, accuracy: 4 }
async function 새쪽(w, h, 폰, 허용 = true) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', isMobile: 폰, hasTouch: 폰, acceptDownloads: true,
    ...(폰 ? { userAgent: UA폰 } : {}), ...(허용 ? { permissions: ['geolocation', 'clipboard-read', 'clipboard-write'], geolocation: 서울 } : {}) })
  await ctx.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|googlesyndication|geojs/, (r) => r.fulfill({ status: 200, body: '' }))
  await ctx.route(/firebaseio\.com|firebasedatabase\.app|identitytoolkit|securetoken/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await ctx.addInitScript(() => {
    try { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); sessionStorage.setItem('kcm_notice_seen', '2026-10-업체'); sessionStorage.setItem('kcm_visit_s', '1') } catch (e) { /* 없음 */ }
    /* 받는 파일 이름(blob 받기는 브라우저에 따라 suggestedFilename 이 «download» 로 옴 — 시험_견적틀화면과 같은 방법) */
    const c0a = HTMLAnchorElement.prototype.click
    HTMLAnchorElement.prototype.click = function () { if (this.download) (window.__받은이름 = window.__받은이름 || []).push(this.download); return c0a.call(this) }
    /* 위치를 몇 번 물었나 세기 */
    window.__물음 = 0
    try {
      const g = navigator.geolocation
      const w0 = g.watchPosition.bind(g), c0 = g.getCurrentPosition.bind(g)
      g.watchPosition = (...a) => { window.__물음++; return w0(...a) }
      g.getCurrentPosition = (...a) => { window.__물음++; return c0(...a) }
    } catch (e) { /* 없음 */ }
  })
  const p = await ctx.newPage()
  const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
  return { ctx, p, 오류 }
}
const 넘침 = (p) => p.evaluate(() => document.documentElement.scrollWidth - innerWidth)
const 쉬어 = (ms) => new Promise((r) => setTimeout(r, ms))
const 화면XY = (p) => p.evaluate(() => [...document.querySelectorAll('.gp-main .gp-xy b')].map((x) => x.innerText.trim()))
const 켠원점 = (p) => p.evaluate(() => [...document.querySelectorAll('.gp-org .chip.on')].map((x) => x.innerText.trim()))
const 단추 = (p, 글) => p.evaluate((글) => { const x = [...document.querySelectorAll('button, a.btn')].find((e) => e.innerText.trim().startsWith(글)); if (x) x.click(); return !!x }, 글)

for (const [이름, w, h, 폰] of [['폰 390', 390, 844, true], ['폰 360', 360, 780, true], ['PC 1280', 1280, 900, false]]) {
  console.log(`■ ${이름}`)
  const { ctx, p, 오류 } = await 새쪽(w, h, 폰)
  await p.clock.install()
  await p.goto(BASE + '/tools/gps', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('.gp-go', { timeout: 20000 })
  await p.clock.runFor(800)
  /* ① */
  ok('① 쪽을 열기만 해서는 위치를 안 물음(0번) · «📍 내 위치 재기» 단추 · «위치 허용» 안내', (await p.evaluate(() => window.__물음)) === 0 && /위치 허용/.test(await p.evaluate(() => document.querySelector('.gp-main').innerText)))
  await p.click('.gp-go')
  await p.waitForSelector('.gp-main .gp-xy', { timeout: 20000 })
  await p.clock.runFor(300)
  ok('① 누르면 그때 한 번 물음', (await p.evaluate(() => window.__물음)) === 1, await p.evaluate(() => window.__물음))
  /* ② */
  const 기대 = W.좌표(서울.latitude, 서울.longitude)
  const xy = await 화면XY(p)
  ok(`② 서울 → X ${W.수(기대.X)} · Y ${W.수(기대.Y)}(lib · 중부 저절로)`, xy[0] === W.수(기대.X) && xy[1] === W.수(기대.Y), xy)
  const 판 = await p.evaluate(() => ({ 오차: (document.querySelector('.gp-acc') || {}).innerText || '', 꼴: (document.querySelector('.gp-acc') || {}).className || '', 글: document.querySelector('.gp-main').innerText }))
  ok('② 오차 «± 4.0 m · 좋음» · 위도 37.5665000° · 37° 33′ 59.40″ · 원점 «중부원점 (저절로)» 켜짐', /± 4\.0 m/.test(판.오차) && /좋음/.test(판.꼴) && 판.글.includes('37.5665000°') && 판.글.includes('37° 33′ 59.40″')
    && (await 켠원점(p)).join() === '중부원점 (저절로)', { ...판, 글: 판.글.slice(0, 200), 원: await 켠원점(p) })
  /* ③ */
  await 단추(p, '서부원점')
  await p.clock.runFor(200)
  const 서 = W.좌표(서울.latitude, 서울.longitude, W.원점키('서부'))
  ok('③ 서부원점 누름 → X · Y = lib(서부) · «적용 원점은 중부원점» 알림', (await 화면XY(p)).join() === [W.수(서.X), W.수(서.Y)].join() && /적용 원점은 중부원점/.test(await p.evaluate(() => document.querySelector('.gp-main').innerText)), await 화면XY(p))
  await 단추(p, '중부원점')
  await p.clock.runFor(200)
  ok('③ 중부원점(저절로) 다시 누르면 저절로로', (await 켠원점(p)).join() === '중부원점 (저절로)' && (await 화면XY(p))[0] === W.수(기대.X), await 켠원점(p))
  const 부산 = { latitude: 35.1796, longitude: 129.0756, accuracy: 3 }
  await ctx.setGeolocation(부산)
  await p.clock.runFor(1500)
  await p.waitForFunction((x) => [...document.querySelectorAll('.gp-main .gp-xy b')].map((e) => e.innerText.trim())[0] === x, W.수(W.좌표(부산.latitude, 부산.longitude).X), { timeout: 10000 }).catch(() => {})
  const 동 = W.좌표(부산.latitude, 부산.longitude)
  ok('③ 부산으로 움직임 → 동부원점 저절로 · X · Y = lib(동부)', (await 켠원점(p)).join() === '동부원점 (저절로)' && (await 화면XY(p)).join() === [W.수(동.X), W.수(동.Y)].join(), { 원: await 켠원점(p), xy: await 화면XY(p) })
  /* ④ */
  await ctx.setGeolocation({ ...서울, accuracy: 30 })
  await p.clock.runFor(1500)
  await p.waitForFunction(() => /나쁨/.test((document.querySelector('.gp-acc') || {}).className || ''), null, { timeout: 10000 }).catch(() => {})
  ok('④ 오차 30 m → «나쁨 — 하늘이 트인 곳에서»', /나쁨/.test(await p.evaluate(() => document.querySelector('.gp-acc').className)) && /하늘이 트인 곳/.test(await p.evaluate(() => document.querySelector('.gp-acc').innerText)))
  await 단추(p, '30초')
  await p.clock.runFor(300)
  const 표본 = [{ latitude: 37.56650, longitude: 126.97800, accuracy: 2 }, { latitude: 37.56652, longitude: 126.97803, accuracy: 4 }, { latitude: 37.56700, longitude: 126.97900, accuracy: 80 }, { latitude: 37.56649, longitude: 126.97798, accuracy: 3 }]
  for (const s of 표본) { await ctx.setGeolocation(s); await p.clock.runFor(1200) }
  const 모음 = await p.evaluate(() => (document.querySelector('.gp-avg') || {}).innerText || '')
  await p.clock.runFor(31000)
  await p.waitForSelector('.gp-avgres', { timeout: 10000 }).catch(() => {})
  const 평화면 = await p.evaluate(() => ({ xy: [...document.querySelectorAll('.gp-avgres .gp-xy b')].map((x) => x.innerText.trim()), 글: (document.querySelector('.gp-avgres') || {}).innerText || '' }))
  /* 화면이 받은 값 = 설정한 표본(첫 값 앞에 30 m 짜리가 한 번 더 들어올 수 있음 — lib 평균은 같은 규칙으로 셈) */
  const 원 = W.원점들[1]
  const 기대평 = W.평균(표본.map((s) => ({ 위도: s.latitude, 경도: s.longitude, 오차: s.accuracy, ...W.좌표(s.latitude, s.longitude, 원) })))
  const 기대평2 = W.평균([{ ...서울, accuracy: 30 }, ...표본].map((s) => ({ 위도: s.latitude, 경도: s.longitude, 오차: s.accuracy, ...W.좌표(s.latitude, s.longitude, 원) })))
  const 맞 = [기대평, 기대평2].some((e) => e && 평화면.xy.join() === [W.수(e.X), W.수(e.Y)].join())
  ok('④ ⏱ 30초 평균 — 결과 = lib 평균(1/오차² · 80 m 값 뺌) · «개 평균 · 오차 큰 1개 뺌 · 흩어짐»', 맞 && /오차 큰 1개 뺌/.test(평화면.글) && /흩어짐/.test(평화면.글) && /모은 값/.test(모음), { 평화면, 기대: 기대평 && [W.수(기대평.X), W.수(기대평.Y)], 모음 })
  await p.fill('.gp-save input >> nth=0', '평균점')
  await 단추(p, '💾 이 평균을 점으로 저장')
  await p.clock.runFor(200)
  ok('④ 이 평균을 점으로 저장 → 표 1줄 «평균점 · 개 평균»', await p.evaluate(() => { const r = [...document.querySelectorAll('.gp-list li')]; return r.length === 1 && /평균점/.test(r[0].innerText) && /개 평균/.test(r[0].innerText) }))
  /* ⑤ */
  await ctx.setGeolocation(서울)
  await p.clock.runFor(1500)
  await p.fill('.gp-save input >> nth=0', '맨홀1')
  await p.fill('.gp-save input >> nth=1', '우수맨홀 뚜껑 가운데')
  await 단추(p, '💾 지금 값 저장')
  await p.clock.runFor(200)
  const 점들 = await p.evaluate((k) => JSON.parse(localStorage.getItem(k) || '[]'), W.열쇠)
  const 앞거리 = 점들.length === 2 ? W.거리방향(점들[0], 점들[1]) : null
  const 표글 = await p.evaluate(() => [...document.querySelectorAll('.gp-list li')].map((r) => r.innerText.replace(/\s+/g, ' ')))
  ok('⑤ 💾 지금 값 저장 → 2점(이 브라우저) · 이름 · 메모 · X = lib · «앞 점에서» 거리 = lib', 점들.length === 2 && 점들[1].이름 === '맨홀1' && 점들[1].메모 === '우수맨홀 뚜껑 가운데'
    && W.수(점들[1].X) === W.수(기대.X) && 앞거리 && 표글[1].includes(`${앞거리.거리.toFixed(1)} m`), { 점: 점들.map((x) => x.이름), 표글 })
  await 단추(p, '📋 모두 복사')
  await p.clock.runFor(300)
  const 복사 = await p.evaluate(() => navigator.clipboard.readText().catch(() => ''))
  ok('⑤ 📋 모두 복사 = lib TSV(머리 + 2줄)', 복사 === W.점TSV(점들), 복사.slice(0, 200))
  const [받음] = await Promise.all([p.waitForEvent('download', { timeout: 15000 }).catch(() => null), 단추(p, '📗 엑셀 받기')])
  let 엑셀 = null
  if (받음) {
    const 자리 = await 받음.path()
    const { unzipSync, strFromU8 } = await import(pathToFileURL(path.join(ROOT, 'web/node_modules/fflate/esm/index.mjs')).href)
    const z = unzipSync(new Uint8Array(fs.readFileSync(자리)))
    const 다 = Object.keys(z).map((k) => strFromU8(z[k])).join('\n')
    엑셀 = { 이름: (await p.evaluate(() => (window.__받은이름 || []).slice(-1)[0])) || 받음.suggestedFilename(), 시트: /name="좌표"/.test(다), 맨홀: 다.includes('맨홀1'), X: 다.includes(String(Number(W.수(기대.X)))) || 다.includes(W.수(기대.X)) }
  }
  ok('⑤ 📗 엑셀 받기 — 내위치_좌표_YYYYMMDD.xlsx · 시트 «좌표» · 점 이름 · X 값', 엑셀 && /^내위치_좌표_\d{8}\.xlsx$/.test(엑셀.이름) && 엑셀.시트 && 엑셀.맨홀 && 엑셀.X, 엑셀)
  await p.reload({ waitUntil: 'domcontentloaded' })
  await p.waitForSelector('.gp-go', { timeout: 20000 })
  await p.clock.runFor(600)
  ok('⑤ 새로고침해도 저장한 2점이 남음(이 브라우저) · 위치는 다시 누를 때만', (await p.evaluate(() => document.querySelectorAll('.gp-list li').length)) === 2 && (await p.evaluate(() => window.__물음)) === 0)
  await p.evaluate(() => document.querySelector('.gp-list li .gp-li-h button').click())
  await p.clock.runFor(150)
  const 물음뜸 = await p.evaluate(() => /지움/.test(document.querySelector('.gp-list li .gp-li-h').innerText))
  await p.evaluate(() => [...document.querySelectorAll('.gp-list li .gp-li-h button')].find((x) => x.innerText === '지움').click())
  await p.clock.runFor(150)
  ok('⑤ ✕ → «지움 · 둠» → 지움 → 1점', 물음뜸 && (await p.evaluate(() => document.querySelectorAll('.gp-list li').length)) === 1 && (await p.evaluate((k) => JSON.parse(localStorage.getItem(k) || '[]').length, W.열쇠)) === 1)
  /* ⑥ */
  await p.click('.gp-go')
  await p.waitForSelector('.gp-main .gp-xy', { timeout: 20000 })
  await p.clock.runFor(300)
  const 목 = { X: 기대.X + 10, Y: 기대.Y }
  await p.fill('input[aria-label="찾아갈 X"]', W.수(목.X))
  await p.fill('input[aria-label="찾아갈 Y"]', W.수(목.Y))
  await p.clock.runFor(200)
  const 길 = await p.evaluate(() => ({ 글: (document.querySelector('.gp-way') || {}).innerText || '', 돎: (document.querySelector('.gp-arrow') || { style: {} }).style.transform || '' }))
  const 돎 = parseFloat((길.돎.match(/rotate\(([-\d.]+)deg\)/) || [])[1])
  ok('⑥ 🎯 북으로 10 m 점 → «10.0 m · 북(0°)» · 화살표 거의 0°(적은 X · Y 가 소수 둘이라 0.1° 안) · 북으로 +10.0 m', /10\.0 m · 북\(0°\)/.test(길.글) && (돎 < 0.1 || 돎 > 359.9) && /북으로 \+10\.0 m/.test(길.글), 길)
  await p.fill('input[aria-label="찾아갈 X"]', W.수(기대.X + 2))
  await p.clock.runFor(200)
  ok('⑥ 오차(± 4 m) 안이면 «🎯 폰 오차 안까지 왔습니다»', /폰 오차\(± 4 m\) 안까지/.test(await p.evaluate(() => document.querySelector('.gp-way').innerText)))
  await p.fill('input[aria-label="찾아갈 X"]', W.수(기대.X + 90000))
  await p.clock.runFor(200)
  ok('⑥ 50 km 넘게 떨어짐 → 원점 · X · Y 확인 알림', /원점이 다르거나/.test(await p.evaluate(() => (document.querySelector('.gp-main ~ .card .gp-bad') || document.body).innerText)))
  /* ⑧ */
  ok(`${이름} 넘침 0`, (await 넘침(p)) <= 1, await 넘침(p))
  ok(`${이름} 빵부스러기 «내 위치 좌표»`, await p.evaluate(() => /내 위치 좌표/.test((document.querySelector('.crumbs, nav[aria-label*="위치"], .bc') || document.body).innerText)))
  ok(`${이름} 오류 0`, 오류.length === 0, 오류)
  await ctx.close()
}
/* ⑦ 위치 막음 */
{
  const { ctx, p, 오류 } = await 새쪽(390, 844, true, false)
  await p.goto(BASE + '/tools/gps', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('.gp-go', { timeout: 20000 })
  await p.click('.gp-go')
  await p.waitForSelector('.gp-bad', { timeout: 15000 }).catch(() => {})
  ok('⑦ 위치 막음(권한 없음) → «위치를 막아 두셨습니다 · 사이트 설정 · 다시 누름» 안내 · 단추 그대로', /위치를 막아 두셨습니다/.test(await p.evaluate(() => (document.querySelector('.gp-bad') || {}).innerText || '')) && !!(await p.$('.gp-go')))
  ok('⑦ 오류 0', 오류.length === 0, 오류)
  await ctx.close()
}
/* ⑧ /tools 카드 */
{
  const { ctx, p } = await 새쪽(390, 844, true)
  await p.goto(BASE + '/tools', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('a[href="/tools/gps"]', { timeout: 20000 }).catch(() => {})
  ok('⑧ /tools — «📍 내 위치 좌표» 카드 → /tools/gps', await p.evaluate(() => [...document.querySelectorAll('a[href="/tools/gps"]')].some((a) => /내 위치 좌표/.test(a.innerText))))
  await ctx.close()
}
/* ⑧ 구운 쪽 */
const 구운 = path.join(ROOT, 'web/dist/tools/gps.html')
if (fs.existsSync(구운)) {
  const h = fs.readFileSync(구운, 'utf8')
  const 몸 = h.replace(/<script[\s\S]*?<\/script>/g, '')
  ok('⑧ 구운 /tools/gps.html — 제목 «내 위치 좌표 — 폰 GPS …» · h1 · [별표 2] 적용 구역 넷 · 측량 · 먹매김 · canonical · «무료» · «클로드» 없음',
    /<title>내 위치 좌표 — 폰 GPS 로 측량 좌표 X · Y/.test(h) && /<h1[^>]*>📍 내 위치 좌표 — 폰 GPS 로 X · Y<\/h1>/.test(h) && /\[별표 2\]/.test(몸) && /동경 130° ~ 132°/.test(몸) && /측량 · 먹매김/.test(몸)
      && /rel="canonical" href="https:\/\/k-conmap\.com\/tools\/gps"/.test(h) && !/무료|클로드/.test(몸), (h.match(/<title>[^<]*/) || [''])[0])
} else ok('⑧ 구운 /tools/gps.html 있음(prerender 뒤)', false)
await b.close()
console.log(`\n${bad ? '❌' : '✅'} 시험_내위치화면 ${n - bad}/${n}`)
process.exit(bad ? 1 : 0)
