/**
 * 🧭 G519 바로투찰 «공고를 고르면 답이 바로 보이게» 화면 시험 — 구운 사이트(dist)를 띄운 뒤:
 *   node tools/시험_바로투찰내려가기화면.mjs [주소=http://127.0.0.1:4996]
 *   소장님 「사이트 점검도 해 이용자 입장에서 최대한 편하고 간단하게」(11-03) — 폰에서 카드 «💰 바로투찰»(/?no=)로 오면
 *   권장 투찰금액이 화면 1.4장 아래에 있어 첫 화면에 답이 안 보였음(실제 사이트 소장님 크롬 390 으로 봄).
 *   서로 다른 예시 셋(공고 셋 · 길 셋 · 화면 폭 셋) + 안 내려야 하는 길 셋:
 *   ① 폰 390: 주소 ?no= 로 옴(1순위 · 공고 카드) → 금액 칸이 머리줄 아래 ~ 아래 탭 위
 *   ② 폰 390: 첫 화면 → «마감 임박 순» 을 내려 눌러 고름 → 금액 칸 보임 · 고른 공고가 맞음
 *   ③ 폰 360: «공고 찾기» 에 낱말 → 찾은 공고(A값 미적용 공고) → 금액 칸 보임
 *   ④ PC 1280: ?no= → 금액 칸 보임
 *   ⑤ 안 내림: 이 탭에 적어 둔 공고를 되살릴 때(새로 열기) · 기초금액만 손으로 넣을 때 · 분석실(/bunseok)
 *   ⑥ 내린 뒤 이용자가 곧바로 위로 올리면 다시 끌어내리지 않음
 *   ⑦ 320 · 360 · 390 넘침 0 · 오류 0
 * 가상 자료만 씀 · 인터넷 안 부름(파이어베이스 · 광고 · 애널리틱스 막음).
 */
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const BASE = process.argv[2] || 'http://127.0.0.1:4996'

let bad = 0, n = 0
const ok = (이름, c, got) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (c || got === undefined ? '' : ' = ' + JSON.stringify(got).slice(0, 300))) }

/* ── 가짜 공고 셋(마감 앞으로 1 · 2 · 3일) — 이름 · 기관은 지어낸 것 ── */
const 날 = (d) => new Date(Date.now() + d * 86400e3 + 9 * 3600e3).toISOString().slice(0, 10) + ' 10:00:00'
const f = ['no', 'name', 'inst', 'base', 'budget', 'close', 'lo', 'hi', 'llr', 'est', 'lic', 'aval', 'gmtrl', 'ayn', 'ptot', 'pdrw', 'url', 'site', 'rgnb', 'joint', 'mthd', 'swin', 'rebid', 'enp', 'enpn', 'dt', 'sido', 'dsn', 'enpb', 'jnt', 'tg', 'nt', 'licg']
const 공고들 = [
  { no: 'R00TEST90001', name: '가상 새솔천 정비공사', inst: '가상시', base: 244600000, est: 222363636, close: 날(2), lo: -3, hi: 3, llr: 89.745, lic: ['토목공사업/0001'], aval: 13940000, ayn: 'Y', ptot: 15, pdrw: 4, dt: '2026-10-30 15:00:00', sido: '경기', mthd: '전자입찰' },
  { no: 'R00TEST90002', name: '가상 한빛초 운동장 정비', inst: '모의교육청', base: 98700000, est: 89727272, close: 날(1), lo: -2, hi: 2, llr: 87.745, lic: ['조경식재공사업/0002'], aval: 5120000, ayn: 'Y', ptot: 15, pdrw: 4, dt: '2026-10-31 15:00:00', sido: '전남', mthd: '전자입찰' },
  { no: 'R00TEST90003', name: '가상 마루로 포장 보수', inst: '가상군', base: 412300000, est: 374818181, close: 날(3), lo: -3, hi: 3, llr: 89.745, lic: ['포장공사업/0003'], aval: 0, ayn: 'N', ptot: 15, pdrw: 4, dt: '2026-11-01 15:00:00', sido: '강원', mthd: '전자입찰' },
]
const 색인 = JSON.stringify({ f, r: 공고들.map((g) => f.map((k) => (g[k] === undefined ? null : g[k]))) })
const UA = { PC: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36', 폰: 'Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36' }
const b = await chromium.launch()

async function 새쪽(w, h, 폰 = true) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', isMobile: 폰, hasTouch: 폰, userAgent: 폰 ? UA.폰 : UA.PC })
  await ctx.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|googlesyndication|geojs/, (r) => r.fulfill({ status: 200, body: '' }))
  await ctx.route(/firebaseio\.com|firebasedatabase\.app/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: r.request().method() === 'GET' ? 'null' : (r.request().postData() || 'null') }))
  await ctx.route(/\/data\/bidindex\.json/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 색인 }))
  await ctx.route(/\/data\/(overview|sim|basket|first|agency)[^/]*\.json/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await ctx.route(/\/data\/bidresult\.json/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ built: '2026-11-03 06:00', f: [], r: {} }) }))
  await ctx.addInitScript(() => { try { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); sessionStorage.setItem('kcm_notice_seen', '2026-10-업체'); sessionStorage.setItem('kcm_visit_s', '1') } catch (e) { /* 없음 */ } })
  const p = await ctx.newPage()
  const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
  p.on('dialog', (d) => d.dismiss())
  return { ctx, p, 오류 }
}
/* 금액 칸(또는 안내 칸)이 «머리줄 아래 ~ 아래 탭 위» 에 들어와 있나 */
const 자리 = (p) => p.evaluate(() => {
  const el = document.querySelector('.hero') || document.querySelector('.hintbox')
  if (!el) return { 없음: true, y: Math.round(window.scrollY) }
  const 머리 = document.querySelector('.topbar')
  const 위 = 머리 ? 머리.getBoundingClientRect().bottom : 0
  const 띠 = document.querySelector('.tabbar')
  const 띠위 = 띠 && getComputedStyle(띠).position === 'fixed' && 띠.getBoundingClientRect().height > 0 ? 띠.getBoundingClientRect().top : innerHeight
  const r = el.getBoundingClientRect()
  const 금액 = (document.querySelector('.hero .amt') || {}).innerText || ''
  const 금액칸 = document.querySelector('.hero .amt')
  const ar = 금액칸 ? 금액칸.getBoundingClientRect() : null
  return { top: Math.round(r.top), 위: Math.round(위), 띠위: Math.round(띠위), y: Math.round(window.scrollY),
    보임: r.top >= 위 - 3 && r.top + Math.min(r.height, 280) <= 띠위 + 1,
    금액보임: !!ar && ar.top >= 위 - 3 && ar.bottom <= 띠위 + 1, 금액: 금액.replace(/\s/g, '') }
})
const 넘침 = (p) => p.evaluate(() => document.documentElement.scrollWidth - innerWidth)
const 고른이름 = (p) => p.evaluate(() => { const i = [...document.querySelectorAll('input')].find((x) => /가상/.test(x.value || '')); return i ? i.value : '' })

console.log('① 폰 390 — 카드 «💰 바로투찰» 처럼 주소 ?no= 로 옴')
{
  const { ctx, p, 오류 } = await 새쪽(390, 844)
  await p.goto(BASE + '/?no=R00TEST90001', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('.hero', { timeout: 15000 })
  await p.waitForTimeout(900)
  const z = await 자리(p)
  ok('금액 칸이 머리줄 아래 ~ 아래 탭 위(내려옴)', z.보임 && z.y > 0, z)
  ok('권장 투찰금액 숫자가 화면 안', z.금액보임 && /\d{3},\d{3}/.test(z.금액), z)
  ok('고른 공고 = 주소의 공고', /새솔천/.test(await 고른이름(p)), await 고른이름(p))
  ok('폰 390 넘침 0', (await 넘침(p)) <= 0, await 넘침(p))
  /* ⑥ 내린 뒤 곧바로 위로 올리면 0.45초 뒤 다시 끌어내리지 않음 */
  await p.goto(BASE + '/?no=R00TEST90002', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('.hero', { timeout: 15000 })
  await p.waitForFunction(() => window.scrollY > 0, null, { timeout: 5000 }).catch(() => {})
  await p.evaluate(() => window.scrollTo(0, 0))
  await p.waitForTimeout(1000)
  ok('⑥ 내린 뒤 이용자가 위로 올리면 그대로 둠(다시 안 끌어내림)', (await p.evaluate(() => window.scrollY)) < 5, await p.evaluate(() => window.scrollY))
  ok('오류 0(①)', !오류.length, 오류)
  await ctx.close()
}

console.log('② 폰 390 — 첫 화면 «마감 임박 순» 을 내려 눌러 고름')
{
  const { ctx, p, 오류 } = await 새쪽(390, 844)
  await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('button.pickrow', { timeout: 15000 })
  await p.waitForTimeout(600)
  const 처음 = await p.evaluate(() => window.scrollY)
  ok('처음 열면 맨 위(안 내림)', 처음 < 5, 처음)
  const 줄 = p.locator('button.pickrow', { hasText: '한빛초' })
  await 줄.scrollIntoViewIfNeeded()
  await 줄.click()
  await p.waitForSelector('.hero', { timeout: 15000 })
  await p.waitForTimeout(900)
  const z = await 자리(p)
  ok('누른 뒤 금액 칸이 화면 안(머리줄 아래 ~ 아래 탭 위)', z.보임 && z.금액보임, z)
  ok('고른 공고 = 누른 공고', /한빛초/.test(await 고른이름(p)), await 고른이름(p))
  /* ⑤-1 이 탭에 적어 둔 공고 되살리기(새로 열기 · 뒤로) — 금액을 보고 있었으면 금액 칸으로(전엔 엉뚱한 자리 2,318 에 떨어졌음) */
  await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('.hero', { timeout: 15000 })
  await p.waitForTimeout(1200)
  const z2 = await 자리(p)
  ok('⑤ 금액을 보다 새로 열면(되살림) 금액 칸이 화면 안 · 그 공고가 골라져 있음', z2.보임 && z2.금액보임 && /한빛초/.test(await 고른이름(p)), [z2, await 고른이름(p)])
  /* ⑤-1b 맨 위로 올려 두고 새로 열면 → 맨 위 그대로(안 내림) */
  await p.evaluate(() => window.scrollTo(0, 0))
  await p.waitForTimeout(400)
  await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('.hero', { timeout: 15000 })
  await p.waitForTimeout(1200)
  ok('⑤ 맨 위에서 새로 열면 맨 위 그대로(안 내림)', (await p.evaluate(() => window.scrollY)) < 5, await p.evaluate(() => window.scrollY))
  /* ⑤-1c 금액을 보다가 아래 탭 «1순위» → 휴대폰 뒤로가기 → 금액 칸 */
  const 줄2 = p.locator('button.pickrow', { hasText: '새솔천' })
  if (await 줄2.count()) { await 줄2.scrollIntoViewIfNeeded(); await 줄2.click() } else {
    await p.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === '지우기'); if (b) b.click() })
    await p.waitForTimeout(300)
    const 줄3 = p.locator('button.pickrow', { hasText: '새솔천' }); await 줄3.scrollIntoViewIfNeeded(); await 줄3.click()
  }
  await p.waitForTimeout(900)
  ok('(뒤로가기 앞) 새솔천 금액 칸 보임', (await 자리(p)).보임, await 자리(p))
  await p.locator('.tabbar a', { hasText: '1순위' }).first().click()
  await p.waitForTimeout(1200)
  await p.goBack()
  await p.waitForSelector('.hero', { timeout: 15000 })
  await p.waitForTimeout(1200)
  const z3 = await 자리(p)
  ok('⑤ «1순위» 갔다 뒤로가기 → 금액 칸이 화면 안 · 새솔천 그대로', z3.보임 && z3.금액보임 && /새솔천/.test(await 고른이름(p)), [z3, await 고른이름(p)])
  ok('오류 0(②)', !오류.length, 오류)
  await ctx.close()
}

console.log('③ 폰 360 — «공고 찾기» 에 낱말 → 찾은 공고(A값 미적용)')
{
  const { ctx, p, 오류 } = await 새쪽(360, 740)
  await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('button.pickrow', { timeout: 15000 })
  const 칸 = p.locator('input[placeholder*="도로포장"]').first()
  await 칸.scrollIntoViewIfNeeded()
  await 칸.fill('마루로')
  await p.waitForTimeout(500)
  const 찾은 = p.locator('button.pickrow', { hasText: '마루로' })
  ok('찾은 공고가 한 줄 뜸', (await 찾은.count()) === 1, await 찾은.count())
  await 찾은.click()
  await p.waitForSelector('.hero', { timeout: 15000 })
  await p.waitForTimeout(900)
  const z = await 자리(p)
  ok('금액 칸이 화면 안(360)', z.보임 && z.금액보임, z)
  ok('폰 360 넘침 0', (await 넘침(p)) <= 0, await 넘침(p))
  /* ⑤-2 기초금액만 손으로 넣으면 안 내림(공고를 고른 게 아님) */
  await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' })
  await p.evaluate(() => { try { sessionStorage.removeItem('kcm.baro.no') } catch (e) { /* 없음 */ } })
  await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('button.pickrow', { timeout: 15000 })
  const 칸2 = p.locator('input[placeholder*="도로포장"]').first()
  await 칸2.scrollIntoViewIfNeeded()
  /* 창 옮기기(scrollTo)를 부른 횟수를 셈 — 위 칸이 접히며 브라우저가 스스로 맞추는 것(스크롤 고정)은 화면 탓이 아님 */
  await p.evaluate(() => { window.__옮김 = 0; const o = window.scrollTo.bind(window); window.scrollTo = (...a) => { window.__옮김++; return o(...a) } })
  await 칸2.fill('285000000')
  await p.waitForSelector('.hero', { timeout: 15000 })
  await p.waitForTimeout(1200)
  ok('⑤ 기초금액만 넣으면 저절로 안 내림(창 옮기기 0번) · 금액은 나옴', (await p.evaluate(() => window.__옮김)) === 0, await p.evaluate(() => window.__옮김))
  ok('오류 0(③)', !오류.length, 오류)
  await ctx.close()
}

console.log('④ PC 1280 — ?no= · 분석실은 안 내림')
{
  const { ctx, p, 오류 } = await 새쪽(1280, 900, false)
  await p.goto(BASE + '/?no=R00TEST90003', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('.hero', { timeout: 15000 })
  await p.waitForTimeout(900)
  const z = await 자리(p)
  ok('PC 금액 칸 보임', z.보임 && z.금액보임, z)
  await p.goto(BASE + '/bunseok?no=R00TEST90001', { waitUntil: 'domcontentloaded' })
  await p.waitForTimeout(3000)
  ok('⑤ 분석실(/bunseok)은 창을 안 내림', (await p.evaluate(() => window.scrollY)) < 5, await p.evaluate(() => window.scrollY))
  ok('오류 0(④)', !오류.length, 오류)
  await ctx.close()
}

console.log('⑦ 폰 320 — 좁은 폰도')
{
  const { ctx, p, 오류 } = await 새쪽(320, 640)
  await p.goto(BASE + '/?no=R00TEST90001', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('.hero', { timeout: 15000 })
  await p.waitForTimeout(900)
  const z = await 자리(p)
  ok('320 금액 칸 윗머리가 머리줄 바로 아래 · 숫자 보임', z.top >= z.위 - 3 && z.top <= z.위 + 20 && z.금액보임, z)
  ok('폰 320 넘침 0', (await 넘침(p)) <= 0, await 넘침(p))
  ok('오류 0(⑦)', !오류.length, 오류)
  await ctx.close()
}

await b.close()
console.log(`\n${bad ? '✗' : '✓'} 시험_바로투찰내려가기화면 ${n - bad}/${n}`)
process.exit(bad ? 1 : 0)
