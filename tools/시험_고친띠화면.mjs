/**
 * 🆕 G757 «업그레이드» · 🔁 G767 «UP» 단추 화면 시험 (2026-11-18) — 진짜 브라우저(Playwright) · PC 1440 · 폰 390
 *   🔁 G767 소장님 「도구마다 서식마다 업데이트가 되면 조그마한 단추 만들고 클릭하면 업데이트 내용을 보이게」 → 띠 대신 «UP» 단추 · 누르면 창 · 화면 안은 제목 옆 · 빨간 «새로» 없음
 *   node tools/시험_고친띠화면.mjs [주소=http://127.0.0.1:5004] [캡처폴더]
 *   (클라우드에서만 — 굽은 사이트 시험 서버가 있어야 함 · PC 올리기 시험 목록엔 넣지 않음 · /fixes.json 은 시험이 «지금» 기준으로 지어 줌)
 *   ① 고친 화면(/tools/sajincad) — 옛 띠 없음 · UP 단추 하나 · 제목(h1) 안 · 누르면 창(🆕 업데이트 · 날짜 · 무엇 · 새것부터 두 줄) · 창이 화면 안 · 넘침 없음
 *      · 창 안을 눌러도 그대로 · 바깥 누름 · Esc · ✕ 로 닫힘 · 키보드(단추에 머물러 Enter) · 판 주소(/fixes.json?v=판)로 받음
 *   ② 더 새로 고친 줄이 생기면 창 첫 줄
 *   ③ 14일 지난 화면 · 고친 적 없는 화면 · 큰 탭(/ · /live · /first · /qna · /map · /news · /tools · /forms)엔 화면 안 단추 없음 · /tools/schedule 은 있음
 *   ④ 제목이 없는 화면(/lic)은 그 자리에 단추 한 줄
 *   ⑤ 도구 목록 «UP» 단추 — 고친 칸만 · 누르면 그 도구 창 · 주소 그대로(안 넘어감) · 빨간 «새로» 없음 · 카드를 누르면 넘어감
 *   ⑥ 서식 목록 «UP» 단추 — 고친 서식 카드만 · 누르면 창 · 안 넘어감 · 그 서식 화면은 제목(.fp-title) 옆 단추
 *   ⑦ 마이컨맵 단축키 «UP» 단추 — 칸 안 · 누르면 창 · 안 넘어감   ⑧ 로봇에겐 단추 없음
 *   ⑨ 자료를 못 받음 — 단추 없음 · 오류 없음 · 지난번 받은 것(이 기기)으로 바로   ⑩ 진짜 public/fixes.json — 제목 옆 단추 · 창 글
 *   ⑪ 화면 오류(pageerror) 없음   ⑫ 내역서 쪽 목록에도 빨간 «새로» 없음
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
  { p: '/lic', d: 한국글(지금 - 4 * 하루), m: '제목 없는 화면 시험 줄' },
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
const 기다림 = async (f, ms = 8000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await f()) return true; await 쉼(120) } return false }
const 열기 = async (p, 길, 고름 = '#root') => { await p.goto(주소 + 길, { waitUntil: 'domcontentloaded' }); await p.waitForSelector(고름, { timeout: 20000 }).catch(() => {}); await 쉼(1200); await 치우기(p) }
/* 화면 안 단추(제목 옆 .up-slot · 제목 없는 화면 .up-line) 수 · 옛 띠 수 */
const 안단추 = (p) => p.locator('.up-slot .up-btn, .up-line .up-btn').count()
const 옛띠 = (p) => p.locator('.noti-band.upg').count()
const 창글 = async (p) => (await p.locator('.up-pop').first().innerText().catch(() => '')).replace(/\s+/g, ' ')
const 창수 = (p) => p.locator('.up-pop').count()

const 크기들 = process.env.ONLY === 'pc' ? [['PC', { width: 1440, height: 900 }]] : process.env.ONLY === 'phone' ? [['폰', { width: 390, height: 844 }]] : [['PC', { width: 1440, height: 900 }], ['폰', { width: 390, height: 844 }]]
for (const [이름, 크기] of 크기들) {
  console.log(`■ ${이름} ${크기.width}`)
  const { c, p, 오류, 상 } = await 판(크기, 이름)
  const 받은주소 = []
  p.on('request', (q) => { if (/\/fixes\.json/.test(q.url())) 받은주소.push(q.url().replace(/^https?:\/\/[^/]+/, '')) })
  /* ── ① 고친 화면 ── */
  await 열기(p, '/tools/sajincad', 'h1')
  await 기다림(async () => (await 안단추(p)) > 0)
  봄('① 옛 띠 없음 · 화면 안 UP 단추 하나', (await 옛띠(p)) === 0 && (await 안단추(p)) === 1, `${await 옛띠(p)} · ${await 안단추(p)}`)
  const 자리 = await p.evaluate(() => {
    const b = document.querySelector('.up-slot .up-btn'); if (!b) return null
    const h = b.closest('h1'), r = b.getBoundingClientRect(), hr = h ? h.getBoundingClientRect() : null
    return { 제목안: !!h, 제목글: h ? h.textContent.replace(/UP$/, '').trim().slice(0, 30) : '', 글: b.textContent, 역할: b.getAttribute('role'), 탭: b.tabIndex, 바탕: getComputedStyle(b).backgroundColor,
      줄안: !!hr && r.top >= hr.top - 2 && r.bottom <= hr.bottom + 2, 넘침: document.documentElement.scrollWidth - innerWidth }
  })
  봄('① 단추 — 제목(h1) 안 · UP · role=button · 탭으로 감 · 초록 · 넘침 없음', !!자리 && 자리.제목안 && 자리.글 === 'UP' && 자리.역할 === 'button' && 자리.탭 === 0 && 자리.바탕 !== 'rgb(220, 38, 38)' && 자리.줄안 && 자리.넘침 <= 1, JSON.stringify(자리))
  봄('① 판 주소로 받음(/fixes.json?v=판)', 받은주소.some((u) => /^\/fixes\.json\?v=[^&]+$/.test(u)) && !받은주소.includes('/fixes.json'), 받은주소.join(' , '))
  await p.locator('.up-slot .up-btn').click()
  await 기다림(async () => (await 창수(p)) > 0, 3000)
  const 글1 = await 창글(p)
  봄('① 누르면 창 — 🆕 업데이트 · 날짜 · 새 글 · 옛 고침(두 줄 · 새것부터)', 글1.includes('🆕 업데이트') && 글1.includes(날짜글(지금 - 시간)) && 글1.includes(새글) && 글1.includes('옛 고침') && 글1.indexOf(새글) < 글1.indexOf('옛 고침'), 글1.slice(0, 120))
  const 창자리 = await p.evaluate(() => { const w = document.querySelector('.up-pop'), b = document.querySelector('.up-slot .up-btn'); if (!w || !b) return null; const r = w.getBoundingClientRect(), q = b.getBoundingClientRect(); return { 왼: Math.round(r.left), 오른: Math.round(innerWidth - r.right), 밑: Math.round(r.top - q.bottom), 높이: Math.round(r.height), 넘침: document.documentElement.scrollWidth - innerWidth, 이름: w.getAttribute('aria-label'), 부모: w.parentElement === document.body } })
  const 위칸 = await p.evaluate(() => { const w = document.querySelector('.up-pop'); if (!w) return null; const 안 = (x, y) => { const e = document.elementFromPoint(x, y); return !!(e && e.closest('.up-pop')) }; const r = w.getBoundingClientRect(), x = w.querySelector('.up-pop-x').getBoundingClientRect(); return { 닫기: 안(x.left + x.width / 2, x.top + x.height / 2), 가운데: 안(r.left + r.width / 2, r.top + r.height / 2), 오른쪽: 안(r.right - 6, r.top + r.height / 2), 왼쪽: 안(r.left + 6, r.top + r.height / 2) } })
  봄('① 창이 맨 위 — 떠 있는 «+» · 인사 쪽지가 안 덮음(✕ · 가운데 · 양쪽 끝)', !!위칸 && 위칸.닫기 && 위칸.가운데 && 위칸.오른쪽 && 위칸.왼쪽, JSON.stringify(위칸))
  봄('① 창 — 단추 바로 밑 · 화면 안(양쪽 8px 넘게) · 넘침 없음 · body 에 붙음 · 이름', !!창자리 && 창자리.왼 >= 7 && 창자리.오른 >= 7 && 창자리.밑 >= 0 && 창자리.밑 <= 14 && 창자리.넘침 <= 1 && 창자리.부모 && 창자리.이름 === '업데이트 내용', JSON.stringify(창자리))
  if (캡처) await p.screenshot({ path: `${캡처}/UP창_${이름}.png`, fullPage: false })
  await p.locator('.up-pop li').first().click()
  await 쉼(200)
  봄('① 창 안을 눌러도 그대로 · 주소 그대로', (await 창수(p)) === 1 && new URL(p.url()).pathname === '/tools/sajincad')
  await p.mouse.click(5, Math.round(크기.height / 2))
  await 쉼(250)
  봄('① 바깥 누르면 닫힘', (await 창수(p)) === 0)
  await p.locator('.up-slot .up-btn').click(); await 기다림(async () => (await 창수(p)) > 0, 3000)
  await p.keyboard.press('Escape'); await 쉼(200)
  봄('① Esc → 닫힘 · 단추로 돌아옴', (await 창수(p)) === 0 && await p.evaluate(() => !!document.activeElement && document.activeElement.classList.contains('up-btn')))
  await p.keyboard.press('Enter'); await 기다림(async () => (await 창수(p)) > 0, 3000)
  봄('① 키보드 — 단추에서 Enter → 창', (await 창수(p)) === 1)
  await p.locator('.up-pop .up-pop-x').click(); await 쉼(200)
  봄('① ✕ → 닫힘', (await 창수(p)) === 0)
  /* ── ② 더 새로 고침 ── */
  상.자료 = { v: 1, r: [{ p: '/tools/sajincad', d: 한국글(지금 - 10 * 60e3), m: '더 새로 고친 것' }, ...기본줄()] }
  await p.evaluate(() => { try { localStorage.removeItem('kcm.upg.표') } catch (e) { /* */ } })
  await 열기(p, '/tools/sajincad', 'h1')
  await 기다림(async () => (await 안단추(p)) > 0)
  await p.locator('.up-slot .up-btn').click(); await 기다림(async () => (await 창수(p)) > 0, 3000)
  const 글2 = await 창글(p)
  봄('② 더 새로 고친 줄 → 창 첫 줄 · 세 줄', 글2.indexOf('더 새로 고친 것') >= 0 && 글2.indexOf('더 새로 고친 것') < 글2.indexOf(새글) && (await p.locator('.up-pop li').count()) === 3, 글2.slice(0, 100))
  await p.keyboard.press('Escape')
  상.자료 = { v: 1, r: 기본줄() }
  await p.evaluate(() => { try { localStorage.removeItem('kcm.upg.표') } catch (e) { /* */ } })
  /* ── ③ 단추 없는 곳 ── */
  for (const 길 of ['/tools/nomubi', '/tools/gyeonjeok', '/', '/live', '/first', '/qna', '/map', '/news', '/tools', '/forms']) {
    await 열기(p, 길)
    await 쉼(400)
    봄(`③ ${길} — 화면 안 단추 · 옛 띠 없음`, (await 안단추(p)) === 0 && (await 옛띠(p)) === 0)
  }
  await 열기(p, '/tools/schedule', 'h1')
  await 기다림(async () => (await 안단추(p)) > 0)
  봄('③ /tools/schedule — 제목 옆 단추 있음(2일 전)', (await p.locator('h1 .up-slot .up-btn').count()) === 1)
  /* ── ④ 제목이 없는 화면 ── */
  await 열기(p, '/lic')
  await 기다림(async () => (await 안단추(p)) > 0)
  const 줄 = await p.evaluate(() => { const l = document.querySelector('.up-line'), 앞 = document.getElementById('씀-앞'); return l ? { 단추: !!l.querySelector('.up-btn'), 앞: !!(앞 && (l.compareDocumentPosition(앞) & Node.DOCUMENT_POSITION_FOLLOWING)) } : null })
  봄('④ 제목 없는 화면(/lic) — 씀-앞 위에 단추 한 줄', !!줄 && 줄.단추 && 줄.앞, JSON.stringify(줄))
  /* ── ⑤ 도구 목록 UP 단추 ── */
  await 열기(p, '/tools', '.tlx-card')
  await 기다림(async () => (await p.locator('.tlx-card .up-btn').count()) > 0)
  const 업카드 = await p.evaluate(() => [...document.querySelectorAll('.tlx-card')].filter((a) => a.querySelector('.up-btn')).map((a) => a.getAttribute('href')))
  봄('⑤ 도구 목록 UP — 사진→캐드 · 예정공정표(+ 자격증 카드 /lic 시험 줄)만', 업카드.length >= 2 && 업카드.every((h) => ['/tools/sajincad', '/tools/schedule', '/lic'].includes(h)) && 업카드.includes('/tools/sajincad') && 업카드.includes('/tools/schedule'), 업카드.join(' , '))
  const 새로수 = await p.evaluate(() => [...document.querySelectorAll('.tlx-card .tlx-new')].filter((e) => e.textContent.trim() === '새로').length)
  봄('⑤ 빨간 «새로» 표 없음', 새로수 === 0, String(새로수))
  await p.locator('.tlx-card[href="/tools/sajincad"] .up-btn').first().click()
  await 기다림(async () => (await 창수(p)) > 0, 3000)
  await 쉼(300)
  const 글5 = await 창글(p)
  봄('⑤ 목록 UP 누름 → 그 도구 창 · 도구로 안 넘어감', 글5.includes(새글) && !글5.includes('내역서 넣기') && new URL(p.url()).pathname === '/tools', `${new URL(p.url()).pathname} · ${글5.slice(0, 80)}`)
  if (캡처) { const 카드 = p.locator('.tlx-card[href="/tools/sajincad"]').first(); if (await 카드.count()) await p.screenshot({ path: `${캡처}/UP목록_${이름}.png`, fullPage: false }) }
  await p.keyboard.press('Escape'); await 쉼(150)
  await p.locator('.tlx-card[href="/tools/schedule"] .tlx-d').first().click()
  await 기다림(async () => new URL(p.url()).pathname === '/tools/schedule', 6000)
  봄('⑤ 카드(UP 말고)를 누르면 도구로 넘어감', new URL(p.url()).pathname === '/tools/schedule', new URL(p.url()).pathname)
  /* ── ⑥ 서식 목록 UP ── */
  await 열기(p, '/forms', 'a[href^="/forms/"]')
  const 서식길 = await p.evaluate(() => { const a = [...document.querySelectorAll('a.fm-gal[href^="/forms/"], a.fm-card[href^="/forms/"]')][0]; return a ? a.getAttribute('href') : '' })
  상.자료 = { v: 1, r: 기본줄(서식길) }
  await p.evaluate(() => { try { localStorage.removeItem('kcm.upg.표') } catch (e) { /* */ } })
  await 열기(p, '/forms', 'a[href^="/forms/"]')
  await 기다림(async () => (await p.locator('.up-btn').count()) > 0)
  const 서식업 = await p.evaluate((h) => { const 모두 = [...document.querySelectorAll('a.fm-gal, a.fm-card')]; return { 그곳: 모두.filter((a) => a.getAttribute('href') === h).map((a) => !!a.querySelector('.up-btn')), 딴곳: 모두.filter((a) => a.getAttribute('href') !== h && a.querySelector('.up-btn')).length } }, 서식길)
  봄('⑥ 서식 목록 UP — 고친 서식 카드만', !!서식길 && 서식업.그곳.length > 0 && 서식업.그곳.every(Boolean) && 서식업.딴곳 === 0, `${서식길} ${JSON.stringify(서식업)}`)
  await p.locator(`a[href="${서식길}"] .up-btn`).first().click()
  await 기다림(async () => (await 창수(p)) > 0, 3000)
  봄('⑥ 서식 목록 UP 누름 → 창 · 안 넘어감', (await 창글(p)).includes('서식 시험 줄') && new URL(p.url()).pathname === '/forms', new URL(p.url()).pathname)
  await p.keyboard.press('Escape')
  await 열기(p, 서식길, '.fp-title')
  await 기다림(async () => (await 안단추(p)) > 0)
  봄('⑥ 그 서식 화면 — 제목(.fp-title) 옆 단추', (await p.locator('.fp-title .up-slot .up-btn').count()) === 1)
  상.자료 = { v: 1, r: 기본줄() }
  await p.evaluate(() => { try { localStorage.removeItem('kcm.upg.표') } catch (e) { /* */ } })
  /* ── ⑦ 마이컨맵 단축키 ── */
  await p.evaluate(() => { localStorage.setItem('kcm.my.단축키', JSON.stringify(['/tools/sajincad', '/tools/nomubi', '/forms'])) })
  await 열기(p, '/my', '.mc-key')
  await 기다림(async () => (await p.locator('.mc-key .up-btn').count()) > 0)
  const 키업 = await p.evaluate(() => [...document.querySelectorAll('.mc-key a.mc-key-in')].map((a) => ({ h: a.getAttribute('href'), up: !!a.querySelector('.up-btn'), 안: (() => { const e = a.querySelector('.up-btn'); if (!e) return true; const r = e.getBoundingClientRect(), q = a.getBoundingClientRect(); return r.left >= q.left && r.right <= q.right && r.top >= q.top })() })))
  봄('⑦ 단축키 UP — 사진→캐드만 · 칸 안', 키업.some((x) => x.h === '/tools/sajincad' && x.up && x.안) && !키업.some((x) => x.h !== '/tools/sajincad' && x.up), JSON.stringify(키업))
  await p.locator('.mc-key a.mc-key-in[href="/tools/sajincad"] .up-btn').first().click()
  await 기다림(async () => (await 창수(p)) > 0, 3000)
  봄('⑦ 단축키 UP 누름 → 창 · 안 넘어감', (await 창글(p)).includes(새글) && new URL(p.url()).pathname === '/my', new URL(p.url()).pathname)
  await p.keyboard.press('Escape')
  if (캡처) { const 판 = p.locator('.mc-keys').first(); if (await 판.count()) await 판.screenshot({ path: `${캡처}/단축키_${이름}.png` }) }
  /* ── ⑫ 내역서 쪽 목록 ── */
  await 열기(p, '/naeyeok')
  const 내새로 = await p.evaluate(() => [...document.querySelectorAll('.tlx-new')].filter((e) => e.textContent.trim() === '새로').length)
  봄('⑫ 내역서 쪽 목록 — 빨간 «새로» 없음', 내새로 === 0, String(내새로))
  봄('⑪ 화면 오류 없음', 오류.length === 0, 오류.join(' | '))
  await c.close()

  /* ── ⑧ 로봇 ── */
  {
    const { c: c2, p: p2 } = await 판(크기, 이름, { 로봇: true })
    await 열기(p2, '/tools/sajincad', 'h1')
    await 쉼(800)
    봄('⑧ 로봇 — 화면 안 단추 없음', (await 안단추(p2)) === 0)
    await c2.close()
  }
  /* ── ⑨ 자료를 못 받음 · 지난번 받은 것 ── */
  {
    const { c: c3, p: p3, 오류: 오류3, 상: 상3 } = await 판(크기, 이름)
    상3.자료 = null
    await 열기(p3, '/tools/sajincad', 'h1')
    await 쉼(800)
    봄('⑨ 못 받음(500) — 단추 없음 · 오류 없음', (await 안단추(p3)) === 0 && 오류3.length === 0, 오류3.join(' | '))
    상3.자료 = { v: 1, r: 기본줄() }
    await 열기(p3, '/tools/sajincad', 'h1')
    await 기다림(async () => (await 안단추(p3)) > 0)
    상3.자료 = 'hang'
    const t0 = Date.now()
    await p3.goto(주소 + '/tools/sajincad', { waitUntil: 'domcontentloaded' })
    const 떴다 = await 기다림(async () => (await 안단추(p3)) > 0, 6000)
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
      await 기다림(async () => (await 안단추(p4)) > 0)
      await p4.locator('.up-slot .up-btn, .up-line .up-btn').first().click().catch(() => {})
      await 기다림(async () => (await 창수(p4)) > 0, 3000)
      const 글 = await 창글(p4)
      봄(`⑩ 진짜 자료 ${x.p} — 단추 · 창 글`, 글.includes(x.m), 글.slice(0, 70))
      await p4.keyboard.press('Escape')
    }
    봄('⑩ 진짜 자료 — 화면 오류 없음', 오류4.length === 0, 오류4.join(' | '))
    await c4.close()
  }
}
await 브.close()
console.log(실패 ? `\n❌ 시험_고친띠화면 ${통과}/${통과 + 실패}` : `\n✅ 시험_고친띠화면 ${통과}/${통과}`)
process.exit(실패 ? 1 : 0)
