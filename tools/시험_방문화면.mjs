// 👥 방문자 · 🔁 방문(세션) · ✍ 써 본 횟수 — 실제 화면(빌드한 사이트)에서 데이터베이스로 무엇을 보내는지 엿봄(가짜 데이터베이스 · 가짜 위치)
//   화면 빌드를 얹은 뒤  B=http://127.0.0.1:4998 node tools/시험_방문화면.mjs
//   📮 G474 들어오자마자 셈(5초 안 기다림) · 다 보내면 보낼 것(kcm.vis.q) 비움 · 숨은 탭은 볼 때 셈 · 세션 30분 · 지도 표 · ✍ 써 본 횟수
import { createRequire } from 'module'
const require = createRequire(process.env.PW || '/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const B = process.env.B || 'http://127.0.0.1:4998'
let ok = 0, bad = 0
const 봐 = (c, m, 더 = '') => { if (c) { ok++; console.log('✓', m) } else { bad++; console.log('✗', m, 더) } }
const 디비 = new Map(); const 쓴 = []
const br = await chromium.launch()
const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1' })
await ctx.addInitScript(() => { Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false }); try { sessionStorage.setItem('kcm_notice_seen', '2026-10-업체') } catch (e) {} })
await ctx.route('https://get.geojs.io/**', (rt) => rt.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ country_code: 'KR', region: 'Gyeonggi-do', city: 'Suwon-si', latitude: '37.26', longitude: '127.03' }) }))
await ctx.route('https://k-conmap-default-rtdb.firebaseio.com/**', async (rt) => {
  const q = rt.request(); const u = new URL(q.url()); const 길 = decodeURIComponent(u.pathname.replace(/\.json$/, '').slice(1))
  if (q.method() === 'PUT' || q.method() === 'PATCH') {
    쓴.push(길); const v = q.postData(); 디비.set(길, v)
    return rt.fulfill({ status: 200, contentType: 'application/json', body: v || 'null' })
  }
  let v = 디비.has(길) ? 디비.get(길) : 'null'
  if (v === 'null') {                       // 묶음 읽기(vis/d/{날} · vis/a 등) — 아래 칸들을 모아 줌
    const 묶 = {}; let 있음 = false
    for (const [k, x] of 디비) if (k.startsWith(길 + '/')) { 있음 = true; const 마디 = k.slice(길.length + 1).split('/'); let o = 묶; for (let i = 0; i < 마디.length - 1; i++) o = o[마디[i]] = o[마디[i]] || {}; o[마디[마디.length - 1]] = JSON.parse(x) }
    if (있음) v = JSON.stringify(묶)
  }
  return rt.fulfill({ status: 200, contentType: 'application/json', headers: { ETag: 'e' + v, 'Access-Control-Expose-Headers': 'ETag' }, body: v })
})
디비.set('fresh/map', JSON.stringify({ at: Date.parse('2026-10-22T13:04:00+09:00'), now: {}, n: 3, day: { d: '2026-10-22', c: {} } }))
디비.set('fresh/ses', JSON.stringify({ at: Date.parse('2026-10-22T13:04:00+09:00'), from: '2026-09-15', e: '2026-10-21', kr: 5540, f: 48, y: { kr: 405, f: 2 }, yd: '2026-10-21' }))
디비.set('fresh/reg', JSON.stringify({ at: Date.parse('2026-10-22T13:04:00+09:00'), from: '2026-09-15', d: '2026-10-22', e: '2026-10-18', kr: { a: 2021, t: 0, y: 281 }, r: { Seoul: { a: 390 } }, f: { a: 21, t: 0, y: 0 }, w: { a: 2042, t: 0, y: 281 } }))
const pg = await ctx.newPage()
const 오류 = []; pg.on('pageerror', (e) => 오류.push(String(e)))
const T0 = Date.parse('2026-10-22T13:05:00+09:00')
await pg.clock.install({ time: T0 })
await pg.goto(B + '/', { waitUntil: 'domcontentloaded' })
await pg.clock.runFor(500)
await pg.waitForTimeout(1500)
const 방 = (s) => 쓴.filter((x) => x === 'vis/' + s)
봐(방('d/2026-10-22/n').length === 1 && 방('d/2026-10-22/r/gyeonggi').length === 1, '📮 G474 들어오자마자(0.5초 · 5초 안 기다림) — 오늘(사람) · 시·도 1씩', JSON.stringify(쓴.filter((x) => x.startsWith('vis/'))))
봐(await pg.evaluate(() => localStorage.getItem('kcm.vis.q') === null), '📮 다 보낸 뒤 보낼 것(kcm.vis.q) 비움')
await pg.clock.runFor(8000); await pg.waitForTimeout(800)
봐(방('d/2026-10-22/n').length === 1, '8초 더 봐도 사람은 1 그대로')
봐(방('d/2026-10-22/s').length === 1 && 방('sa/n').length === 1 && !쓴.some((x) => /^vis\/(d\/[^/]+\/sr|sa\/r)(\/|$)/.test(x)), '세션 1 — 오늘 vis/d/{날}/s · 누적 vis/sa/n (시·도 세션 없음)', JSON.stringify(쓴.filter((x) => x.startsWith('vis/'))))
const 앞1 = 쓴.length
await pg.clock.runFor(10 * 60000)
await pg.waitForTimeout(800)
봐(!쓴.slice(앞1).some((x) => x === 'vis/d/2026-10-22/s'), '10분 보는 동안 — 방문 더 안 셈', JSON.stringify(쓴.slice(앞1)))
await pg.evaluate(() => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }); document.dispatchEvent(new Event('visibilitychange')) })
await pg.clock.runFor(31 * 60000)
const 앞2 = 쓴.length
await pg.evaluate(() => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' }); document.dispatchEvent(new Event('visibilitychange')) })
await pg.clock.runFor(2000)
await pg.waitForTimeout(1200)
봐(쓴.slice(앞2).filter((x) => x === 'vis/d/2026-10-22/s').length === 1 && 디비.get('vis/d/2026-10-22/s') === '2' && 디비.get('vis/sa/n') === '2' && 디비.get('vis/d/2026-10-22/n') === '1', '31분 숨겼다 다시 봄 — 세션 오늘 2 · 누적 2 · 사람(오늘)은 1 그대로', JSON.stringify([쓴.slice(앞2), 디비.get('vis/d/2026-10-22/s'), 디비.get('vis/d/2026-10-22/n')]))
await pg.clock.runFor(61000); await pg.waitForTimeout(800)
const 상자 = await pg.evaluate(() => [...document.querySelectorAll('.umap-tbl [role=row]')].map((r) => r.innerText.replace(/\s+/g, ' ').trim()))
봐(상자.length === 3 && /^방문자 2,043명 \+1 0명$/.test(상자[1]) && /^세션 5,590회 2회 407회$/.test(상자[2]), `지도 표 — 방문자 «2,043명 +1» 그대로 · 세션 누적 5,588+2 · 오늘 2 · 어제(10/21 애널리틱스) 407 «${상자.join(' / ')}»`)

// ✍ 써 본 횟수 — 도구 화면 안에서 처음 손댐 한 번
await pg.evaluate(() => { history.pushState({}, '', '/tools/nomubi'); window.dispatchEvent(new PopStateEvent('popstate')) })
await pg.clock.runFor(1500); await pg.waitForTimeout(1500)
const 씀 = () => 쓴.filter((x) => x.startsWith('dl/p/|씀|'))
봐(씀().length === 0, '들어오기만 하면 안 셈', JSON.stringify(씀()))
await pg.locator('#씀-앞 ~ * button, #씀-앞 ~ * input').first().click({ timeout: 5000 }).catch((e) => console.log('누를 것 못 찾음', String(e).slice(0, 80)))
await pg.waitForTimeout(800)
const 칸 = pg.locator('#씀-앞 ~ * input:not([type=checkbox]):not([type=radio]):not([type=file]), #씀-앞 ~ * textarea').first()
if (await 칸.count()) { await 칸.fill('12'); await 칸.press('Tab').catch(() => {}) }
await pg.waitForTimeout(800)
봐(씀().length === 1 && 씀()[0] === 'dl/p/|씀|tools-nomubi' && 디비.get('dl/p/|씀|tools-nomubi') === '1', '노무비 화면 — 단추 · 칸을 여러 번 만져도 한 번(|씀|tools-nomubi = 1)', JSON.stringify(씀()))
// 위 띠(화면 밖) 누름은 안 셈 — 다른 화면으로 가서 머리 쪽 단추
await pg.evaluate(() => { history.pushState({}, '', '/forms/tbm'); window.dispatchEvent(new PopStateEvent('popstate')) })
await pg.clock.runFor(1500); await pg.waitForTimeout(1500)
const 밖 = await pg.evaluate(() => {
  const 앞 = document.getElementById('씀-앞')
  const 후보 = [...document.querySelectorAll('button')].filter((b) => 앞 && (앞.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_PRECEDING) && b.offsetParent && !/🔄|새로/.test(b.innerText))
  const b = 후보[0]; if (!b) return null
  const r = b.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, t: b.innerText.slice(0, 20) }
})
if (밖) await pg.mouse.click(밖.x, 밖.y)
await pg.clock.runFor(800)
const 밖뒤 = await pg.evaluate(() => location.pathname)
await pg.waitForTimeout(600)
봐(밖 && !씀().some((x) => x.includes('forms-tbm')), `화면 밖(위 띠) 단추를 사람처럼 눌러도 안 셈 — 누른 것 «${밖 && 밖.t}» · 그 뒤 ${밖뒤}`, JSON.stringify(씀()))
if (밖뒤 !== '/forms/tbm') { await pg.evaluate(() => { history.pushState({}, '', '/forms/tbm'); window.dispatchEvent(new PopStateEvent('popstate')) }); await pg.clock.runFor(1500); await pg.waitForTimeout(1500) }
const tb = pg.locator('#작성 textarea, #작성 input').first()   // 서식 «종이 맞춤»(G351) 뒤로 tbm 작성 칸엔 체크 칸만(글은 종이 위에서)
await pg.keyboard.press('Escape'); await pg.clock.runFor(300); await pg.waitForTimeout(300)   // 위 띠 단추(🔎 빠른 찾기)로 열린 창 닫기
if (await tb.count()) { if (/checkbox|radio/.test((await tb.getAttribute('type')) || '')) { await tb.click({ timeout: 5000 }); await tb.click({ timeout: 5000 }) } else { await tb.focus(); await pg.keyboard.type('가상', { delay: 20 }) } }
await pg.waitForTimeout(800)
봐(씀().filter((x) => x === 'dl/p/|씀|forms-tbm').length === 1, '서식(tbm) 작성 칸에 씀 — |씀|forms-tbm 한 번', JSON.stringify(씀()))
봐(오류.length === 0, '화면 오류 없음', 오류.slice(0, 2).join(' | '))
// 📮 G474 숨은 탭으로 연 것(뒤에 연 탭) — 안 셈 · 화면을 보면 그때 셈
const ctx2 = await br.newContext({ viewport: { width: 390, height: 844 }, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1' })
await ctx2.addInitScript(() => { Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false }); Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }) })
await ctx2.route('https://get.geojs.io/**', (rt) => rt.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ country_code: 'KR', region: 'Seoul' }) }))
const 쓴2 = []
await ctx2.route('https://k-conmap-default-rtdb.firebaseio.com/**', async (rt) => {
  const q = rt.request(); const 길 = decodeURIComponent(new URL(q.url()).pathname.replace(/\.json$/, '').slice(1))
  if (q.method() === 'PUT') { 쓴2.push(길); return rt.fulfill({ status: 200, contentType: 'application/json', body: q.postData() || 'null' }) }
  return rt.fulfill({ status: 200, contentType: 'application/json', headers: { ETag: 'enull', 'Access-Control-Expose-Headers': 'ETag' }, body: 'null' })
})
const pg2 = await ctx2.newPage()
await pg2.clock.install({ time: T0 })
await pg2.goto(B + '/', { waitUntil: 'domcontentloaded' })
await pg2.clock.runFor(10000); await pg2.waitForTimeout(1500)
봐(!쓴2.some((x) => /^vis\/(d|a|sa)\//.test(x)), '숨은 탭으로 연 것 — 10초 지나도 안 셈', JSON.stringify(쓴2))
await pg2.evaluate(() => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' }); document.dispatchEvent(new Event('visibilitychange')) })
await pg2.clock.runFor(300); await pg2.waitForTimeout(1500)
봐(쓴2.filter((x) => x === 'vis/d/2026-10-22/n').length === 1 && 쓴2.filter((x) => x === 'vis/d/2026-10-22/s').length === 1, '숨은 탭을 보면 그때 바로 — 오늘 사람 1 · 세션 1', JSON.stringify(쓴2))
await ctx2.close()
await br.close()
console.log(`\n${ok} 통과 · ${bad} 실패`)
process.exit(bad ? 1 : 0)
