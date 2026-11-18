/**
 * 🆕 G757 «업그레이드» 띠 · «UP» 표 화면 시험 (2026-11-18) — 진짜 브라우저(Playwright) · PC 1440 · 폰 390
 *   node tools/시험_고친띠화면.mjs [주소=http://127.0.0.1:5004] [캡처폴더]
 *   (클라우드에서만 — 굽은 사이트 시험 서버가 있어야 함 · PC 올리기 시험 목록엔 넣지 않음 · /fixes.json 은 시험이 «지금» 기준으로 지어 줌)
 *   ① 고친 화면(/tools/sajincad) — 띠 하나 · 글(🆕 업그레이드 · 날짜 · 무엇 · 그 전에도 1번) · 길 줄 바로 아래 · 도구 위 · 가로 넘침 없음 · 두 줄 안
 *   ② ✕ → 사라짐 · 새로 열어도 닫힘 · 닫음 열쇠   ③ 더 새로 고친 줄이 생기면 다시 보임
 *   ④ 14일 지난 화면 · 고친 적 없는 화면 · 큰 탭(/ · /live · /first · /qna · /map · /news · /tools · /forms)엔 띠 없음
 *   ⑤ 도구 목록 «UP» — 고친 칸만(14일 지난 칸 · 다른 칸엔 없음)   ⑥ 서식 목록 «UP» — 고친 서식 카드만
 *   ⑦ 마이컨맵 단축키 «UP»   ⑧ 로봇에겐 띠 없음   ⑨ 자료를 못 받음 — 띠 없음 · 오류 없음 · 지난번 받은 것(이 기기)으로 바로 뜸
 *   ⑩ 진짜 public/fixes.json 그대로 — 띠 · UP   ⑪ 화면 오류(pageerror) 없음
 */
import { createRequire } from 'module'
const require = createRequire('/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const 주소 = process.argv[2] || 'http://127.0.0.1:5004'
const 캡처 = process.argv[3] || ''
let 통과 = 0, 실패 = 0
const 봄 = (이름, 참, 더 = '') => { if (참) { 통과++; console.log('  ✓', 이름, 더) } else { 실패++; console.log('  ✗', 이름, 더) } }
const 쉼 = (ms) => new Promise((r) => setTimeout(r, ms))
const 한국글 = (ms) => { const d = new Date(ms + 9 * 3600e3); const z = (n) => String(n).padStart(2, '0'); return `${d.getUTCFullYear()}-${z(d.getUTCMonth() + 1)}-${z(d.getUTCDate())} ${z(d.getUTCHours())}:${z(d.getUTCMinutes())}` }
const 날짜글 = (ms) => { const d = new Date(ms + 9 * 3600e3); return `${d.getUTCMonth() + 1}. ${d.getUTCDate()}.` }
const 지금 = Date.now(), 시간 = 3600e3, 하루 = 86400e3
const 새글 = '모눈종이 손그림도 벽만 · 선 하나 길이로 전체 크기 맞춤'
const 기본줄 = (서식 = '') => [
  { p: '/tools/sajincad', d: 한국글(지금 - 시간), m: 새글 },
  { p: '/tools/schedule', d: 한국글(지금 - 2 * 하루), m: '내역서 넣기 한 번에(공종 · 금액 · 기간) · 막대 색 또렷하게' },
  { p: '/tools/sajincad', d: 한국글(지금 - 3 * 하루), m: '옛 고침' },
  ...(서식 ? [{ p: 서식, d: 한국글(지금 - 5 * 하루), m: '서식 시험 줄' }] : []),
  { p: '/tools/nomubi', d: 한국글(지금 - 15 * 하루), m: '14일 지난 고침' },
]

const 브 = await chromium.launch()
const 치우기 = (p) => p.evaluate(() => {
  document.querySelectorAll('.noticepop, .noticepop-bg').forEach((e) => { e.style.display = 'none' })
})
/** 판 — /fixes.json 은 «자료» 함수가 정함(null = 500 · 'hang' = 안 줌 · 'real' = 진짜) */
async function 판(크기, 이름, { 저장 = {}, 로봇 = false } = {}) {
  const 폰 = 이름 === '폰'
  /* ⚠️ 시험 브라우저 기본 이름(HeadlessChrome)은 사이트가 로봇으로 봄(lib/인사.js 로봇) → 보통 크롬 · 폰 크롬 이름으로 */
  const 이름표 = 로봇 ? 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
    : 폰 ? 'Mozilla/5.0 (Linux; Android 14; SM-S918N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36'
      : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
  const c = await 브.newContext({ viewport: 크기, deviceScaleFactor: 1, isMobile: 폰, hasTouch: 폰, locale: 'ko-KR', userAgent: 이름표 })
  await c.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|geojs|firebaseio|coupang|daumcdn|kakao/, (r) => r.fulfill({ status: 200, body: '' }))
  const 상 = { 자료: { v: 1, r: 기본줄() } }
  await c.route(/\/fixes\.json(\?|$)/, (r) => {
    if (상.자료 === 'real') return r.continue()
    if (상.자료 === 'hang') return undefined
    if (상.자료 === null) return r.fulfill({ status: 500, body: 'x' })
    return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(상.자료) })
  })
  await c.addInitScript((s) => {
    try { if (!sessionStorage.getItem('시험_놓음')) { for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v); sessionStorage.setItem('시험_놓음', '1') } } catch (e) { /* */ }
  }, 저장)
  const p = await c.newPage()
  const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
  return { c, p, 오류, 상 }
}
const 띠수 = (p) => p.locator('.noti-band.upg').count()
const 기다림 = async (f, ms = 8000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await f()) return true; await 쉼(120) } return false }
const 열기 = async (p, 길, 고름 = '#root') => { await p.goto(주소 + 길, { waitUntil: 'domcontentloaded' }); await p.waitForSelector(고름, { timeout: 20000 }).catch(() => {}); await 쉼(1200); await 치우기(p) }

const 크기들 = process.env.ONLY === 'pc' ? [['PC', { width: 1440, height: 900 }]] : process.env.ONLY === 'phone' ? [['폰', { width: 390, height: 844 }]] : [['PC', { width: 1440, height: 900 }], ['폰', { width: 390, height: 844 }]]
for (const [이름, 크기] of 크기들) {
  console.log(`■ ${이름} ${크기.width}`)
  const { c, p, 오류, 상 } = await 판(크기, 이름)
  /* ── ① 고친 화면 ── */
  await 열기(p, '/tools/sajincad', '.noti-band.upg')
  await 기다림(async () => (await 띠수(p)) > 0)
  봄('① 띠 하나', (await 띠수(p)) === 1, String(await 띠수(p)))
  const 띠글 = (await p.locator('.noti-band.upg').first().innerText().catch(() => '')).replace(/\s+/g, ' ')
  봄('① 글 — 🆕 업그레이드 · 날짜 · 무엇 · 그 전에도 1번', 띠글.includes('🆕 업그레이드') && 띠글.includes(날짜글(지금 - 시간)) && 띠글.includes(새글) && 띠글.includes('그 전에도 1번'), 띠글.slice(0, 90))
  const 자리 = await p.evaluate(() => {
    const b = document.querySelector('.noti-band.upg'), cr = document.querySelector('.crumbs'), 씀 = document.getElementById('씀-앞')
    if (!b) return null
    const r = b.getBoundingClientRect()
    const 앞 = (a, z) => !!(a && z && (a.compareDocumentPosition(z) & Node.DOCUMENT_POSITION_FOLLOWING))
    const t = b.querySelector('.upg-t'), lh = t ? parseFloat(getComputedStyle(t).lineHeight) : 20
    const x = b.querySelector('button.noti-x'), 캠 = document.querySelector('.cam-tab')
    const 겹 = (p, q) => !!(p && q) && !(p.right <= q.left || q.right <= p.left || p.bottom <= q.top || q.bottom <= p.top)
    const xr = x ? x.getBoundingClientRect() : null, cr2 = 캠 && getComputedStyle(캠).display !== 'none' ? 캠.getBoundingClientRect() : null
    return { 길뒤: cr ? 앞(cr, b) : 'no-crumbs', 씀앞: 앞(b, 씀), 높이: r.height, 줄: t ? Math.round(t.getBoundingClientRect().height / lh) : 0, 넘침: document.documentElement.scrollWidth - innerWidth, 왼: r.left, 오른: innerWidth - r.right, 닫기: !!b.querySelector('button.noti-x[aria-label="업그레이드 알림 닫기"]'),
      캠겹침: (() => { if (!xr || !cr2) return false; for (let y = 0; y <= 900; y += 20) { const dy = y - r.top; const 옮긴 = { left: xr.left, right: xr.right, top: xr.top + dy, bottom: xr.bottom + dy }; if (겹(옮긴, cr2)) return y } return false })() }
  })
  봄('① ✕ 를 «+» 찍기 단추가 덮지 않음(띠가 어느 높이에 있어도)', !!자리 && 자리.캠겹침 === false, JSON.stringify(자리 && 자리.캠겹침))
  봄('① 자리 — 길 줄 뒤 · 씀-앞(도구) 앞', !!자리 && 자리.길뒤 !== false && 자리.씀앞 === true, JSON.stringify(자리))
  봄('① 가로 넘침 없음 · 두 줄 안 · 화면 안', !!자리 && 자리.넘침 <= 1 && 자리.줄 <= 2 && 자리.왼 >= 0 && 자리.오른 >= 0, JSON.stringify(자리))
  봄('① ✕ 단추(이름 있음)', !!자리 && 자리.닫기)
  if (캡처) await p.screenshot({ path: `${캡처}/띠_${이름}.png`, fullPage: false })
  /* ── ② ✕ ── */
  await p.locator('.noti-band.upg .noti-x').click()
  await 쉼(300)
  봄('② ✕ → 사라짐', (await 띠수(p)) === 0)
  const 닫음 = await p.evaluate(() => { try { return JSON.parse(localStorage.getItem('kcm.upg.닫음') || '{}') } catch (e) { return {} } })
  봄('② 닫음 열쇠 — 그때 보이던 두 줄', Object.keys(닫음).filter((k) => k.startsWith('/tools/sajincad|')).length === 2, Object.keys(닫음).join(' , '))
  await 열기(p, '/tools/sajincad')
  봄('② 새로 열어도 닫힘', (await 띠수(p)) === 0)
  /* ── ③ 더 새로 고침 ── */
  상.자료 = { v: 1, r: [{ p: '/tools/sajincad', d: 한국글(지금 - 10 * 60e3), m: '더 새로 고친 것' }, ...기본줄()] }
  await p.evaluate(() => { try { localStorage.removeItem('kcm.upg.표') } catch (e) { /* */ } })
  await 열기(p, '/tools/sajincad')
  await 기다림(async () => (await 띠수(p)) > 0)
  const 새띠 = (await p.locator('.noti-band.upg').first().innerText().catch(() => '')).replace(/\s+/g, ' ')
  봄('③ 더 새로 고친 줄 → 다시 보임', 새띠.includes('더 새로 고친 것') && 새띠.includes('그 전에도 2번'), 새띠.slice(0, 80))
  상.자료 = { v: 1, r: 기본줄() }
  await p.evaluate(() => { try { localStorage.removeItem('kcm.upg.표'); localStorage.removeItem('kcm.upg.닫음') } catch (e) { /* */ } })
  /* ── ④ 띠 없는 곳 ── */
  for (const 길 of ['/tools/nomubi', '/tools/gyeonjeok', '/', '/live', '/first', '/qna', '/map', '/news', '/tools', '/forms']) {
    await 열기(p, 길)
    await 쉼(400)
    봄(`④ ${길} — 띠 없음`, (await 띠수(p)) === 0)
  }
  await 열기(p, '/tools/schedule')
  await 기다림(async () => (await 띠수(p)) > 0)
  봄('④ /tools/schedule — 띠 있음(2일 전)', (await 띠수(p)) === 1)
  /* ── ⑤ 도구 목록 UP ── */
  await 열기(p, '/tools', '.tlx-card')
  await 기다림(async () => (await p.locator('.tlx-card .up-b').count()) > 0)
  const 업카드 = await p.evaluate(() => [...document.querySelectorAll('.tlx-card')].filter((a) => a.querySelector('.up-b')).map((a) => a.getAttribute('href')))
  봄('⑤ 도구 목록 UP — 사진→캐드 · 예정공정표만', 업카드.length >= 2 && 업카드.every((h) => ['/tools/sajincad', '/tools/schedule'].includes(h)) && 업카드.includes('/tools/sajincad') && 업카드.includes('/tools/schedule'), 업카드.join(' , '))
  const 업모양 = await p.evaluate(() => { const e = document.querySelector('.tlx-card .up-b'); if (!e) return null; const s = getComputedStyle(e); const t = e.closest('.tlx-t').getBoundingClientRect(), r = e.getBoundingClientRect(); return { 글: e.textContent, 바탕: s.backgroundColor, 색: s.color, 안: r.right <= t.right + 1 && r.left >= t.left - 1 } })
  봄('⑤ UP 모양 — 초록 바탕 · 제목 칸 안', !!업모양 && 업모양.글 === 'UP' && 업모양.바탕 !== 'rgb(220, 38, 38)' && 업모양.안, JSON.stringify(업모양))
  if (캡처) { const 카드 = p.locator('.tlx-card[href="/tools/sajincad"]').first(); if (await 카드.count()) await 카드.screenshot({ path: `${캡처}/UP카드_${이름}.png` }) }
  /* ── ⑥ 서식 목록 UP ── */
  await 열기(p, '/forms', 'a[href^="/forms/"]')
  const 서식길 = await p.evaluate(() => { const a = [...document.querySelectorAll('a.fm-gal[href^="/forms/"], a.fm-card[href^="/forms/"]')][0]; return a ? a.getAttribute('href') : '' })
  상.자료 = { v: 1, r: 기본줄(서식길) }
  await p.evaluate(() => { try { localStorage.removeItem('kcm.upg.표') } catch (e) { /* */ } })
  await 열기(p, '/forms', 'a[href^="/forms/"]')
  await 기다림(async () => (await p.locator('.up-b').count()) > 0)
  const 서식업 = await p.evaluate((h) => { const 모두 = [...document.querySelectorAll('a.fm-gal, a.fm-card')]; return { 그곳: 모두.filter((a) => a.getAttribute('href') === h).map((a) => !!a.querySelector('.up-b')), 딴곳: 모두.filter((a) => a.getAttribute('href') !== h && a.querySelector('.up-b')).length } }, 서식길)
  봄('⑥ 서식 목록 UP — 고친 서식 카드만', !!서식길 && 서식업.그곳.length > 0 && 서식업.그곳.every(Boolean) && 서식업.딴곳 === 0, `${서식길} ${JSON.stringify(서식업)}`)
  await 열기(p, 서식길)
  await 기다림(async () => (await 띠수(p)) > 0)
  봄('⑥ 그 서식 화면 — 띠 있음', (await 띠수(p)) === 1)
  상.자료 = { v: 1, r: 기본줄() }
  await p.evaluate(() => { try { localStorage.removeItem('kcm.upg.표') } catch (e) { /* */ } })
  /* ── ⑦ 마이컨맵 단축키 ── */
  await p.evaluate(() => { localStorage.setItem('kcm.my.단축키', JSON.stringify(['/tools/sajincad', '/tools/nomubi', '/forms'])) })
  await 열기(p, '/my', '.mc-key')
  await 기다림(async () => (await p.locator('.mc-key .up-b').count()) > 0)
  const 키업 = await p.evaluate(() => [...document.querySelectorAll('.mc-key a.mc-key-in')].map((a) => ({ h: a.getAttribute('href'), up: !!a.querySelector('.up-b'), 안: (() => { const e = a.querySelector('.up-b'); if (!e) return true; const r = e.getBoundingClientRect(), q = a.getBoundingClientRect(); return r.left >= q.left && r.right <= q.right && r.top >= q.top })() })))
  봄('⑦ 단축키 UP — 사진→캐드만 · 칸 안', 키업.some((x) => x.h === '/tools/sajincad' && x.up && x.안) && !키업.some((x) => x.h !== '/tools/sajincad' && x.up), JSON.stringify(키업))
  if (캡처) { const 판 = p.locator('.mc-keys').first(); if (await 판.count()) await 판.screenshot({ path: `${캡처}/단축키_${이름}.png` }) }
  봄('⑪ 화면 오류 없음', 오류.length === 0, 오류.join(' | '))
  await c.close()

  /* ── ⑧ 로봇 ── */
  {
    const { c: c2, p: p2 } = await 판(크기, 이름, { 로봇: true })
    await 열기(p2, '/tools/sajincad')
    await 쉼(800)
    봄('⑧ 로봇 — 띠 없음', (await 띠수(p2)) === 0)
    await c2.close()
  }
  /* ── ⑨ 자료를 못 받음 · 지난번 받은 것 ── */
  {
    const { c: c3, p: p3, 오류: 오류3, 상: 상3 } = await 판(크기, 이름)
    상3.자료 = null
    await 열기(p3, '/tools/sajincad')
    await 쉼(800)
    봄('⑨ 못 받음(500) — 띠 없음 · 오류 없음', (await 띠수(p3)) === 0 && 오류3.length === 0, 오류3.join(' | '))
    상3.자료 = { v: 1, r: 기본줄() }
    await 열기(p3, '/tools/sajincad')
    await 기다림(async () => (await 띠수(p3)) > 0)
    상3.자료 = 'hang'
    const t0 = Date.now()
    await p3.goto(주소 + '/tools/sajincad', { waitUntil: 'domcontentloaded' })
    const 떴다 = await 기다림(async () => (await 띠수(p3)) > 0, 6000)
    봄('⑨ 자료가 늦어도 지난번 받은 것으로 바로 뜸', 떴다, `${Date.now() - t0}ms`)
    await c3.close()
  }
  /* ── ⑩ 진짜 fixes.json ── */
  {
    const { c: c4, p: p4, 오류: 오류4, 상: 상4 } = await 판(크기, 이름)
    상4.자료 = 'real'
    const 진짜 = await (await fetch(주소 + '/fixes.json')).json()
    const 요즘 = (진짜.r || []).filter((x) => { const m = String(x.d).match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/); if (!m) return false; const t = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4] - 9, +m[5]); return t <= 지금 + 하루 && 지금 - t < 14 * 하루 })
    for (const x of 요즘.slice(0, 3)) {
      await 열기(p4, x.p)
      await 기다림(async () => (await 띠수(p4)) > 0)
      const 글 = (await p4.locator('.noti-band.upg').first().innerText().catch(() => '')).replace(/\s+/g, ' ')
      봄(`⑩ 진짜 자료 ${x.p} — 띠`, 글.includes(x.m), 글.slice(0, 70))
    }
    봄('⑩ 진짜 자료 — 화면 오류 없음', 오류4.length === 0, 오류4.join(' | '))
    await c4.close()
  }
}
await 브.close()
console.log(실패 ? `\n❌ 시험_고친띠화면 ${통과}/${통과 + 실패}` : `\n✅ 시험_고친띠화면 ${통과}/${통과}`)
process.exit(실패 ? 1 : 0)
