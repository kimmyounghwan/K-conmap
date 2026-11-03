/**
 * 🧭 G521 1순위 현황판 «목록이 첫 화면에» · 투찰 순위 «5곳 + 나머지 보기» 화면 시험 — 구운 사이트(dist)를 띄운 뒤:
 *   node tools/시험_1순위간단화면.mjs [주소=http://127.0.0.1:4996]
 *   소장님 「사이트 점검도 해 이용자 입장에서 최대한 편하고 간단하게」 → 「이용자에게 편한걸로 해줘」(11-03)
 *   전(실제 사이트 · 폰 390 · 처음 온 사람): 첫 카드 862px(화면 1.5장 아래) · 펼친 카드 3,100px(순위 30곳)
 *   ① 폰 390(앱 띠 · 내역서 띠 있는 채): 첫 카드가 첫 화면(아래 탭 위)에 40px 넘게 보임 · 숫자 상자 없음 · 제목 줄에 누적 · 기관 · 업체
 *      · 결과 줄에 «나라장터 밖 1순위 N건 →» · «날짜별 성적표 →» · 평소엔 «7주 전체 · 쪽을 넘기면» 줄 없음
 *   ② 순위 30곳 카드: 펼치면 5줄 + «▼ 나머지 25곳 보기» → 누르면 30줄 · «▲ 순위 접기» → 다시 5줄 · 카드 높이 줄어듦
 *   ③ 순위 6곳 카드: 6줄 다 · 단추 없음
 *   ④ 찾으면 «7주 전체 N건에서 찾음» 줄이 뜸(찾을 때만)
 *   ⑤ PC 1280: 첫 카드 첫 화면 · 결과 줄 단추 둘 한 줄 / 폰 360 · 320 넘침 0 · 오류 0
 *   ⑥ 바로투찰 첫 화면 내역서 띠(같은 띠) 폰 높이 70px 아래(전 95)
 * 가상 자료만 씀(공사 · 기관 · 업체 이름 지어냄) · 인터넷 안 부름(파이어베이스 · 광고 · 애널리틱스 막음).
 */
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const BASE = process.argv[2] || 'http://127.0.0.1:4996'

let bad = 0, n = 0
const ok = (이름, c, got) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (c || got === undefined ? '' : ' = ' + JSON.stringify(got).slice(0, 300))) }

const 오늘 = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10)
const meta = { built: 오늘 + ' 06:00', chunk: 500, rankChunk: 50, con: { n: 14, parts: 1, from: '2026-09-15', to: 오늘 }, serv: { n: 0, parts: 0 } }
const 순위 = (k, base) => Array.from({ length: k }, (_, i) => [`가상건설${i + 1}(주)`, Math.round(base * (0.8995 + i * 0.0007)), null])
const 줄 = (i, o = {}) => ({ no: `R00TEST7${String(i).padStart(4, '0')}`, ord: '000', name: `가상 새솔지구 정비공사 ${i}차`, inst: '가상군', dt: 오늘 + ' 11:00:00', amt: 523456000, rate: 89.912, np: 37, nrank: 37,
  base: 583000000, sAmt: 0, lo: -3, hi: 3, llr: 89.745, aval: 0, ayn: 'N', win: `가상건설1(주)`, bno: '1238112345', ceo: '홍길동', ...o })
const rows = [
  줄(1, { name: '가상 한빛천 재해복구사업', np: 41, nrank: 41, corps: 순위(30, 583000000) }),
  줄(2, { name: '가상 마루초 옥상 방수공사', np: 6, nrank: 6, base: 98700000, corps: 순위(6, 98700000) }),
  ...Array.from({ length: 12 }, (_, i) => 줄(i + 3)),
]
const ov = { rows: 168842, agencies: 5066, corps: 72494 }
const b = await chromium.launch()
const UA폰 = 'Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'

async function 새쪽(w, h, 폰 = true) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', isMobile: 폰, hasTouch: 폰, ...(폰 ? { userAgent: UA폰 } : {}) })
  await ctx.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|googlesyndication|geojs/, (r) => r.fulfill({ status: 200, body: '' }))
  await ctx.route(/firebaseio\.com|firebasedatabase\.app/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await ctx.route('**/data/board/first.json*', (r) => r.fulfill({ json: meta }))
  await ctx.route('**/data/board/first-con-0.json*', (r) => r.fulfill({ json: rows }))
  await ctx.route('**/data/overview.json*', (r) => r.fulfill({ json: ov }))
  await ctx.route('**/data/ext/meta.json*', (r) => r.fulfill({ json: { n: 887, first: 567 } }))
  /* 갱신 알림(FreshBar)도 실제 사이트처럼 한 줄 뜨게 — health.json 꼴 그대로(숫자는 지어냄) */
  await ctx.route('**/data/health.json*', (r) => r.fulfill({ json: { at: new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 16).replace('T', ' '), ok: true, why: '', fails: 0, got: { first: 266, live: 815 }, note: '', maint: false, hint: '', lastok: new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 16).replace('T', ' '), newest: { first: 오늘, live: 오늘 }, n: { first: 18396, live: 21143 }, gaps: { first: [], live: [] } } }))
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

console.log('① 폰 390 — 처음 온 사람(앱 띠 · 내역서 띠 그대로)')
{
  const { ctx, p, 오류 } = await 새쪽(390, 844)
  await p.goto(BASE + '/first', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('main .notice.tap', { timeout: 15000 })
  await p.waitForTimeout(800)
  const z = await 첫카드(p)
  ok('첫 카드가 첫 화면에 40px 넘게 보임(전 862px · 안 보임)', z && z.보임 > 40, z)
  ok('갱신 알림 줄(최신 개찰)은 그대로 있음', /최신 개찰/.test(await p.evaluate(() => (document.querySelector('main .freshbar') || {}).innerText || '')), await p.evaluate(() => (document.querySelector('main .freshbar') || {}).innerText || ''))
  const 머리 = await p.evaluate(() => (document.querySelector('.fb-head') || {}).innerText || '')
  ok('제목 줄 한 줄에 누적 · 발주기관 · 업체 숫자', /누적 168,842건/.test(머리) && /발주기관 5,066/.test(머리) && /업체 72,494/.test(머리), 머리)
  ok('숫자 상자 넷(.tiles.c4) 없음', (await p.locator('main .tiles.c4').count()) === 0)
  const 결과줄 = await p.evaluate(() => { const t = [...document.querySelectorAll('main .sec-title')].find((x) => /결과/.test(x.innerText)); return t ? t.innerText.replace(/\s+/g, ' ') : '' })
  ok('결과 줄 — 건수 · 날짜 · «나라장터 밖 1순위 567건 →» · «날짜별 성적표 →»', /결과 14건/.test(결과줄) && /09\.15/.test(결과줄) && /나라장터 밖 1순위 567건/.test(결과줄) && /날짜별 성적표/.test(결과줄), 결과줄)
  ok('«나라장터 밖» 큰 카드(.xlink) 없음 — 작은 단추로', (await p.locator('main .xlink').count()) === 0)
  ok('평소엔 «7주 전체 · 쪽을 넘기면» 줄 없음', (await p.locator('main .rangebar').count()) === 0)
  ok('«나라장터 밖» 단추 → /ext?t=first', (await p.getAttribute('main .xchip', 'href')) === '/ext?t=first')
  ok('폰 390 넘침 0', (await 넘침(p)) <= 0, await 넘침(p))

  console.log('② 순위 30곳 카드 — 5곳 + 나머지 보기')
  const 카드 = p.locator('main .notice.tap', { hasText: '한빛천' })
  await 카드.scrollIntoViewIfNeeded()
  await 카드.click()
  await p.waitForSelector('.rk-more', { timeout: 10000 })
  const 줄수 = () => p.evaluate(() => [...document.querySelectorAll('main .notice.open .row .badge')].filter((x) => /^\d+위$/.test(x.textContent.trim())).length)
  const 높이 = () => p.evaluate(() => Math.round(document.querySelector('main .notice.open').getBoundingClientRect().height))
  const n5 = await 줄수(), h5 = await 높이()
  ok('펼치면 순위 5줄 · «▼ 나머지 25곳 보기»', n5 === 5 && /나머지 25곳 보기/.test(await p.innerText('.rk-more')), [n5, await p.innerText('.rk-more')])
  await p.click('.rk-more')
  await p.waitForTimeout(300)
  const n30 = await 줄수(), h30 = await 높이()
  ok('누르면 30줄 · «▲ 순위 접기»', n30 === 30 && /순위 접기/.test(await p.innerText('.rk-more')), [n30, await p.innerText('.rk-more')])
  ok('접은 카드가 다 편 카드보다 1,000px 넘게 짧음', h30 - h5 > 1000, [h5, h30])
  await p.click('.rk-more')
  await p.waitForTimeout(300)
  ok('«▲ 순위 접기» → 다시 5줄', (await 줄수()) === 5, await 줄수())

  console.log('③ 순위 6곳 카드 — 다 보임 · 단추 없음')
  await 카드.locator('h3').click()   /* 앞 카드 닫기 */
  await p.waitForTimeout(300)
  const 카드2 = p.locator('main .notice.tap', { hasText: '마루초' })
  await 카드2.scrollIntoViewIfNeeded()
  await 카드2.click()
  await p.waitForTimeout(800)
  ok('6줄 다 · «나머지 보기» 단추 없음', (await 줄수()) === 6 && (await p.locator('main .notice.open .rk-more').count()) === 0, await 줄수())

  console.log('④ 찾으면 «7주 전체에서 찾음» 줄')
  await p.evaluate(() => window.scrollTo(0, 0))
  await p.fill('input[placeholder*="낙찰업체 검색"]', '한빛천')
  await p.waitForTimeout(1500)
  ok('찾을 때만 «7주 전체 … 찾음» 줄이 뜸', (await p.locator('main .rangebar').count()) === 1 && /7주 전체/.test(await p.innerText('main .rangebar')), await p.locator('main .rangebar').count())
  ok('오류 0(① ~ ④)', !오류.length, 오류)
  await ctx.close()
}

console.log('⑤ PC 1280 · 폰 360 · 320')
{
  const { ctx, p, 오류 } = await 새쪽(1280, 900, false)
  await p.goto(BASE + '/first', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('main .notice.tap', { timeout: 15000 })
  await p.waitForTimeout(800)
  const z = await 첫카드(p)
  ok('PC 첫 카드 첫 화면', z && z.보임 > 200, z)
  const 같은줄 = await p.evaluate(() => { const a = document.querySelector('main .xchip'), d = [...document.querySelectorAll('main .daylink')].find((x) => /날짜별/.test(x.textContent)); return a && d ? Math.abs(a.getBoundingClientRect().top - d.getBoundingClientRect().top) < 4 : false })
  ok('PC 결과 줄 단추 둘이 한 줄', 같은줄)
  ok('오류 0(PC)', !오류.length, 오류)
  await ctx.close()
  for (const [w, h] of [[360, 740], [320, 640]]) {
    const s = await 새쪽(w, h)
    await s.p.goto(BASE + '/first', { waitUntil: 'domcontentloaded' })
    await s.p.waitForSelector('main .notice.tap', { timeout: 15000 })
    await s.p.waitForTimeout(600)
    ok(`폰 ${w} 넘침 0`, (await 넘침(s.p)) <= 0, await 넘침(s.p))
    ok(`폰 ${w} 오류 0`, !s.오류.length, s.오류)
    await s.ctx.close()
  }
}

console.log('⑥ 내역서 띠(바로투찰 · 1순위 같은 띠) 폰 높이')
{
  const { ctx, p } = await 새쪽(390, 844)
  await p.goto(BASE + '/first', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('.naeyeok-strip', { timeout: 15000 })
  const h = await p.evaluate(() => Math.round(document.querySelector('.naeyeok-strip').getBoundingClientRect().height))
  const 글 = await p.innerText('.naeyeok-strip')
  ok('폰 390 내역서 띠 70px 아래(전 95) · 글 그대로', h < 70 && /낙찰되셨습니까/.test(글) && /쓸 도구 · 서식/.test(글), [h, 글])
  await ctx.close()
}

await b.close()
console.log(`\n${bad ? '✗' : '✓'} 시험_1순위간단화면 ${n - bad}/${n}`)
process.exit(bad ? 1 : 0)
