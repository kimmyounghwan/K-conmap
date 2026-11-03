/**
 * 🧭 G522 공고 탭 «목록이 첫 화면에» 화면 시험 — 구운 사이트(dist)를 띄운 뒤:
 *   node tools/시험_공고간단화면.mjs [주소=http://127.0.0.1:4996]
 *   소장님 「사이트 점검도 해 이용자 입장에서 최대한 편하고 간단하게」 → 「이용자에게 편한걸로 해줘」(11-03)
 *   전(실제 사이트 · 폰 390 · 처음 온 사람): 첫 공고 카드 1,004px — 맨 위 가는 줄 셋(199px) · 두 거르개(167px) · 7주 줄이 밀어냄
 *   ① 폰 390(앱 띠 있는 채): 첫 카드가 첫 화면(아래 탭 위)에 보임 · 가는 줄 셋이 작은 단추로(한 개 50px 아래 · 글 그대로 · 공동도급 마당 그대로 맨 앞)
 *      · 두 거르개 나란히 · 평소엔 7주 줄 없음 · 공고 줄에 «N건 · 09.15 ~ 오늘»
 *   ② 단추 길: 공동도급 마당 → /gongdong · 나라장터 밖 → /ext · 곧 나올 공사 → /pre
 *   ③ «해볼 만한 공고만» 누르면 7주 줄(찾음)이 뜸
 *   ④ PC 1280: 가는 줄 셋은 전처럼 나란히 카드(덧말 보임) · 두 거르개 덧말 보임
 *   ⑤ 폰 360 · 320 넘침 0 · 오류 0
 * 가상 자료만 씀 · 인터넷 안 부름(파이어베이스 · 광고 · 애널리틱스 막음).
 */
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const BASE = process.argv[2] || 'http://127.0.0.1:4996'

let bad = 0, n = 0
const ok = (이름, c, got) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (c || got === undefined ? '' : ' = ' + JSON.stringify(got).slice(0, 300))) }

const 날 = (d) => new Date(Date.now() + d * 86400e3 + 9 * 3600e3).toISOString().slice(0, 10)
const 오늘 = 날(0)
const meta = { built: 오늘 + ' 06:00', chunk: 500, rankChunk: 50, con: { n: 12, parts: 1, from: '2026-09-15', to: 오늘 }, serv: { n: 0, parts: 0 } }
const 줄 = (i, o = {}) => ({ no: `R00TEST8${String(i).padStart(4, '0')}`, ord: '000', name: `가상 새솔지구 배수로 정비공사 ${i}차`, inst: '가상시', dt: 오늘 + ' 09:00:00', close: 날(3) + ' 10:00:00',
  base: 244600000, est: 222363636, lo: -3, hi: 3, llr: 89.745, aval: 13940000, ayn: 'Y', lic: ['토목공사업/0001'], sido: '경기', ...o })
const rows = Array.from({ length: 12 }, (_, i) => 줄(i + 1))
const 지금 = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 16).replace('T', ' ')   /* 갱신 알림이 «새 자료» 로 보이게 — 지금 시각 */
const 헬스 = { at: 지금, ok: true, why: '', fails: 0, got: { first: 266, live: 815 }, note: '', maint: false, hint: '', lastok: 지금, newest: { first: 오늘, live: 오늘 }, n: { first: 18396, live: 21143 }, gaps: { first: [], live: [] } }
const b = await chromium.launch()
const UA폰 = 'Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'

async function 새쪽(w, h, 폰 = true) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', isMobile: 폰, hasTouch: 폰, ...(폰 ? { userAgent: UA폰 } : {}) })
  await ctx.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|googlesyndication|geojs/, (r) => r.fulfill({ status: 200, body: '' }))
  await ctx.route(/firebaseio\.com|firebasedatabase\.app/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await ctx.route('**/data/board/live.json*', (r) => r.fulfill({ json: meta }))
  await ctx.route('**/data/board/live-con-0.json*', (r) => r.fulfill({ json: rows }))
  await ctx.route('**/data/ext/meta.json*', (r) => r.fulfill({ json: { n: 887, first: 567 } }))
  await ctx.route('**/data/pre/idx.json*', (r) => r.fulfill({ json: { all: [1080, 225], n: {} } }))
  await ctx.route('**/data/health.json*', (r) => r.fulfill({ json: 헬스 }))
  await ctx.addInitScript(() => { try { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); sessionStorage.setItem('kcm_notice_seen', '2026-10-업체'); sessionStorage.setItem('kcm_visit_s', '1') } catch (e) { /* 없음 */ } })
  const p = await ctx.newPage()
  const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
  return { ctx, p, 오류 }
}
const 넘침 = (p) => p.evaluate(() => document.documentElement.scrollWidth - innerWidth)
const 첫카드 = (p) => p.evaluate(() => {
  const c = document.querySelector('main .notice.tap')
  const 띠 = document.querySelector('.tabbar')
  const 띠위 = 띠 && getComputedStyle(띠).position === 'fixed' && 띠.getBoundingClientRect().height > 0 ? 띠.getBoundingClientRect().top : innerHeight
  return c ? { top: Math.round(c.getBoundingClientRect().top + scrollY), 띠위: Math.round(띠위), 보임: Math.round(띠위 - c.getBoundingClientRect().top) } : null
})
const 가는줄 = (p) => p.evaluate(() => [...document.querySelectorAll('main .xlinks .xlink')].map((a) => ({ 글: a.innerText.replace(/\s+/g, ' ').trim(), 높이: Math.round(a.getBoundingClientRect().height), 덧말: (() => { const i = a.querySelector('.xl-t i'); return !!i && getComputedStyle(i).display !== 'none' })(), href: a.getAttribute('href') })))

console.log('① 폰 390 — 처음 온 사람(앱 띠 그대로)')
{
  const { ctx, p, 오류 } = await 새쪽(390, 844)
  await p.goto(BASE + '/live', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('main .notice.tap', { timeout: 15000 })
  await p.waitForTimeout(900)
  const z = await 첫카드(p)
  ok('첫 공고 카드가 첫 화면에 40px 넘게 보임(전 1,004px)', z && z.보임 > 40, z)
  const xs = await 가는줄(p)
  ok('가는 줄 셋 — 공동도급 마당(맨 앞) · 나라장터 밖 887 · 곧 나올 공사 1,080', xs.length === 3 && /공동도급 마당/.test(xs[0].글) && /나라장터 밖 공고 887건/.test(xs[1].글) && /곧 나올 공사 1,080건/.test(xs[2].글), xs.map((x) => x.글))
  ok('폰에선 작은 단추(한 개 50px 아래) · 덧말 숨김', xs.every((x) => x.높이 < 50 && !x.덧말), xs.map((x) => [x.높이, x.덧말]))
  const 거르개 = await p.evaluate(() => [...document.querySelectorAll('main .goodrow .goodonly')].map((x) => Math.round(x.getBoundingClientRect().top)))
  ok('두 거르개(해볼 만한 · 설계내역서) 나란히', 거르개.length === 2 && Math.abs(거르개[0] - 거르개[1]) < 3, 거르개)
  ok('평소엔 «7주 전체 · 쪽을 넘기면» 줄 없음', (await p.locator('main .rangebar').count()) === 0)
  const 공고줄 = await p.evaluate(() => { const t = [...document.querySelectorAll('main .sec-title')].find((x) => /^공고\s/.test(x.innerText.trim())); return t ? t.innerText.replace(/\s+/g, ' ') : '' })
  ok('공고 줄 — «12건 · 09.15 ~ …»', /12건/.test(공고줄) && /09\.15/.test(공고줄), 공고줄)
  ok('갱신 알림 줄(최신 공고) 그대로', /최신 공고/.test(await p.evaluate(() => (document.querySelector('main .freshbar') || {}).innerText || '')))
  ok('폰 390 넘침 0', (await 넘침(p)) <= 0, await 넘침(p))
  /* 앱 띠(모든 화면 맨 위 · 10-05 «항상 위») — 자리 그대로 · 폰 높이만 105 → 60 아래 · 글 · 단추 · ✕ 한 줄 */
  const 띠 = await p.evaluate(() => { const b = document.querySelector('.installbar'); if (!b) return null; const r = b.getBoundingClientRect(); const go = b.querySelector('.go').getBoundingClientRect(), x = b.querySelector('.x').getBoundingClientRect(); return { h: Math.round(r.height), 한줄: Math.abs(go.top - x.top) < 6, 글: b.innerText.replace(/\s+/g, ' ') } })
  ok('앱 띠 그대로 있음 · 폰 높이 60px 아래(전 105) · «추가하기» · ✕ 한 줄 · «홈 화면에 추가» 글', 띠 && 띠.h < 60 && 띠.한줄 && /홈 화면에 추가/.test(띠.글) && /추가하기/.test(띠.글), 띠)
  console.log('② 단추 길')
  ok('공동도급 → /gongdong · 나라장터 밖 → /ext · 곧 나올 공사 → /pre', xs[0].href === '/gongdong' && xs[1].href === '/ext' && xs[2].href === '/pre', xs.map((x) => x.href))
  console.log('③ 해볼 만한 공고만 → 찾음 줄')
  await p.click('main .goodrow .goodonly:not(.docbtn)')
  await p.waitForTimeout(1500)
  ok('거르면 «7주 전체 … 찾음» 줄이 뜸', (await p.locator('main .rangebar').count()) === 1, await p.locator('main .rangebar').count())
  ok('오류 0(① ~ ③)', !오류.length, 오류)
  await ctx.close()
}

console.log('④ PC 1280 — 넓은 화면은 전처럼')
{
  const { ctx, p, 오류 } = await 새쪽(1280, 900, false)
  await p.goto(BASE + '/live', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('main .notice.tap', { timeout: 15000 })
  await p.waitForTimeout(800)
  const xs = await 가는줄(p)
  const 줄위 = await p.evaluate(() => [...document.querySelectorAll('main .xlinks .xlink')].map((a) => Math.round(a.getBoundingClientRect().top)))
  ok('PC 가는 줄 셋 나란히 · 덧말 보임', xs.length === 3 && xs.every((x) => x.덧말) && Math.max(...줄위) - Math.min(...줄위) < 3, [줄위, xs.map((x) => x.덧말)])
  ok('PC 두 거르개 덧말 보임', await p.evaluate(() => [...document.querySelectorAll('main .goodrow .goodonly i')].every((i) => getComputedStyle(i).display !== 'none')))
  ok('PC 첫 카드 첫 화면', ((await 첫카드(p)) || {}).보임 > 100, await 첫카드(p))
  ok('PC 앱 띠 글 그대로(«설치 파일 없이» 덧말 보임 — PC 는 아이콘 글)', await p.evaluate(() => { const b = document.querySelector('.installbar'); return !b || getComputedStyle(b).display !== 'none' }))
  ok('오류 0(PC)', !오류.length, 오류)
  await ctx.close()
}

console.log('⑤ 폰 360 · 320')
for (const [w, h] of [[360, 740], [320, 640]]) {
  const s = await 새쪽(w, h)
  await s.p.goto(BASE + '/live', { waitUntil: 'domcontentloaded' })
  await s.p.waitForSelector('main .notice.tap', { timeout: 15000 })
  await s.p.waitForTimeout(600)
  ok(`폰 ${w} 넘침 0`, (await 넘침(s.p)) <= 0, await 넘침(s.p))
  ok(`폰 ${w} 오류 0`, !s.오류.length, s.오류)
  await s.ctx.close()
}

await b.close()
console.log(`\n${bad ? '✗' : '✓'} 시험_공고간단화면 ${n - bad}/${n}`)
process.exit(bad ? 1 : 0)
