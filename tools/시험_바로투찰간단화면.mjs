/**
 * 🧭 G524 바로투찰 첫 화면 «공고 찾기 위 카드 넷 낮게» 화면 시험 — 구운 사이트(dist)를 띄운 뒤:
 *   node tools/시험_바로투찰간단화면.mjs [주소=http://127.0.0.1:4996]
 *   소장님 「사이트 점검도 해 이용자 입장에서 최대한 편하고 간단하게」 → 「이용자에게 편한걸로 해줘」(11-03)
 *   전(실제 사이트 · 폰 390): 공고 찾기 칸 1,130px — 앱 띠 · 방문자 표 · 내역서 띠 · 오늘의 기준 · 사용 방법 · 성적 · 오늘 넣을 것 · 분석실 뒤
 *   ① 폰 390: 카드 넷(사용 방법 · 성적 · 오늘 넣을 것 · 분석실)이 자리 · 차례 그대로 낮아짐(각 높이 상한) · 글 첫머리 그대로 · 덧말 숨김
 *      · 방문자 표 · 오늘의 기준 · 내역서 띠 그대로 · 공고 찾기 칸이 전보다 250px 넘게 위로
 *   ② 눌러지는 것 그대로: 사용 방법 펼치기(11단계) · 성적 → 가상 시뮬레이션으로 · 오늘 넣을 것 «면허 · 지역 고르기 ▼» 펼침 · 분석실 → /bunseok
 *   ③ PC 1280: 덧말 보임(전과 같음) / 폰 360 · 320 넘침 0 · 오류 0
 * 가상 자료만 씀 · 인터넷 안 부름(파이어베이스는 가짜 · 광고 · 애널리틱스 막음).
 */
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const BASE = process.argv[2] || 'http://127.0.0.1:4996'

let bad = 0, n = 0
const ok = (이름, c, got) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (c || got === undefined ? '' : ' = ' + JSON.stringify(got).slice(0, 300))) }

const 날 = (d) => new Date(Date.now() + d * 86400e3 + 9 * 3600e3).toISOString().slice(0, 10)
const f = ['no', 'name', 'inst', 'base', 'budget', 'close', 'lo', 'hi', 'llr', 'est', 'lic', 'aval', 'gmtrl', 'ayn', 'ptot', 'pdrw']
const 공고들 = Array.from({ length: 15 }, (_, i) => ({ no: 'R00TEST95' + String(i).padStart(3, '0'), name: '가상 새솔천 정비공사 ' + (i + 1), inst: '가상시', base: 244600000 + i * 1e6, est: 222363636, close: 날(1 + (i % 4)) + ' 10:00:00', lo: -3, hi: 3, llr: 89.745, lic: ['토목공사업/0001'], aval: 13940000, ayn: 'Y', ptot: 15, pdrw: 4 }))
const 색인 = JSON.stringify({ f, r: 공고들.map((g) => f.map((k) => (g[k] === undefined ? null : g[k]))) })
const 개요 = { rows: 168842, agencies: 5066, corps: 72494, hot: { win: 30, n: 8651, mode: 90.3, rec: 90.1 },
  bands: [{ key: 's', label: '10억 미만', min: 0, max: 1e9, llr: 89.745, off: 0.2, win: 30, n: 8851, mode: 90.3, rec: 90.1, thin: false },
    { key: 'm', label: '10억~50억', min: 1e9, max: 5e9, llr: 88.745, off: 0.3, win: 30, n: 322, mode: 89.3, rec: 89, thin: false }],
  sjq: { p10: 98.934, p25: 99.379, p50: 99.886, p75: 100.377, p90: 100.796, p95: 101.036, p98: 101.303 } }
const 성적 = { days: 30, n: 6284, tested: 6284, from: 날(-30), to: 날(-1), aAssumed: 0, aReal: 6000, dq: 12.7, win: 4.1, gap: 0.92, qn: 6000, qs: 284,
  cases: [{ name: '가상 마루로 포장 보수', dt: 날(-2), rate: 89.912, our: 89.95, limit: 89.745, sj: 99.9, win: '가상건설(주)', v: 'win' }] }
/* 방문자 표(파이어베이스 REST) — G499 시험과 같은 꼴 */
const DB = { fresh: { map: { at: Date.now(), now: {}, n: 3, day: { d: 날(0), c: {} } }, ses: { at: Date.now(), from: '2026-09-15', e: 날(-1), kr: 5540, f: 48, y: { kr: 405, f: 2 }, yd: 날(-1) },
  reg: { at: Date.now(), from: '2026-09-15', d: 날(0), e: 날(-1), kr: { a: 2021, t: 0, y: 281 }, r: { Seoul: { a: 390 } }, f: { a: 21, t: 0, y: 0 }, w: { a: 2042, t: 0, y: 281 } } } }
const 값 = (p) => { let o = DB; for (const k of p.split('/').filter(Boolean)) { if (o == null || typeof o !== 'object') return null; o = o[k] } return o === undefined ? null : o }
const b = await chromium.launch()
const UA폰 = 'Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'

async function 새쪽(w, h, 폰 = true) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', isMobile: 폰, hasTouch: 폰, ...(폰 ? { userAgent: UA폰 } : {}) })
  await ctx.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|googlesyndication|geojs/, (r) => r.fulfill({ status: 200, body: '' }))
  await ctx.route(/firebaseio\.com|firebasedatabase\.app/, (r) => {
    const u = new URL(r.request().url())
    if (r.request().method() !== 'GET') return r.fulfill({ status: 200, contentType: 'application/json', body: r.request().postData() || 'null' })
    return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(값(decodeURIComponent(u.pathname.replace(/\.json$/, '')))) })
  })
  await ctx.route(/\/data\/bidindex\.json/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 색인 }))
  await ctx.route(/\/data\/overview\.json/, (r) => r.fulfill({ json: 개요 }))
  await ctx.route(/\/data\/sim\.json/, (r) => r.fulfill({ json: 성적 }))
  await ctx.route(/\/data\/(basket|first|agency)[^/]*\.json/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await ctx.addInitScript(() => { try { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); sessionStorage.setItem('kcm_notice_seen', '2026-10-업체'); sessionStorage.setItem('kcm_visit_s', '1') } catch (e) { /* 없음 */ } })
  const p = await ctx.newPage()
  const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
  return { ctx, p, 오류 }
}
const 넘침 = (p) => p.evaluate(() => document.documentElement.scrollWidth - innerWidth)
const 칸 = (p) => p.evaluate(() => {
  const h = (s) => { const e = document.querySelector(s); return e ? Math.round(e.getBoundingClientRect().height) : null }
  const 보임 = (s) => { const e = document.querySelector(s); return !!e && getComputedStyle(e).display !== 'none' }
  const i = document.querySelector('input[placeholder*="도로포장"]')
  return { 사용법: h('.card.bth'), 성적: h('.simstrip'), 오늘: h('.mytoday'), 분석실: h('.bsr-cta'), 기준: h('.todaybar'), 띠: h('.naeyeok-strip'),
    찾기: i ? Math.round(i.getBoundingClientRect().top + scrollY) : null, 덧말: { 사용법: 보임('.card.bth .bth-h .muted'), 성적: 보임('.simstrip .ss-more'), 오늘: 보임('.mytoday .mt-fold'), 분석실: 보임('.bsr-cta .d') },
    글: { 사용법: (document.querySelector('.card.bth') || {}).innerText || '', 성적: (document.querySelector('.simstrip') || {}).innerText || '', 분석실: (document.querySelector('.bsr-cta') || {}).innerText || '' } }
})

console.log('① 폰 390 — 처음 온 사람')
{
  const { ctx, p, 오류 } = await 새쪽(390, 844)
  await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('button.pickrow', { timeout: 15000 })
  await p.waitForTimeout(1500)
  const z = await 칸(p)
  ok('카드 넷 낮아짐 — 사용 방법 ≤ 50 · 성적 ≤ 90 · 오늘 넣을 것 ≤ 45 · 분석실 ≤ 62', z.사용법 <= 50 && z.성적 <= 90 && z.오늘 <= 45 && z.분석실 <= 62, z)
  ok('덧말만 숨김(사용 방법 · 성적 · 오늘 넣을 것 · 분석실)', !z.덧말.사용법 && !z.덧말.성적 && !z.덧말.오늘 && !z.덧말.분석실, z.덧말)
  ok('글 첫머리 그대로 — «바로투찰 사용 방법» · «바로투찰 성적 · 1순위였을 자리 4.1%» · «입찰 분석실»', /바로투찰 사용 방법/.test(z.글.사용법) && /바로투찰 성적/.test(z.글.성적) && /4\.1%/.test(z.글.성적) && /입찰 분석실/.test(z.글.분석실), z.글)
  ok('오늘의 기준 · 내역서 띠 그대로 있음', z.기준 > 40 && z.띠 > 30, [z.기준, z.띠])
  const 방문 = await p.evaluate(() => (document.querySelector('main').innerText.match(/K-건설맵 방문자/) || [])[0] || '')
  ok('방문자 표 그대로 있음', !!방문, 방문)
  ok('공고 찾기 칸 y < 900(전 실제 사이트 1,130)', z.찾기 < 900, z.찾기)
  ok('폰 390 넘침 0', (await 넘침(p)) <= 0, await 넘침(p))

  console.log('② 눌러지는 것 그대로')
  await p.click('.card.bth .bth-h')
  await p.waitForTimeout(300)
  ok('사용 방법 펼치면 11단계', (await p.locator('.bth-steps li').count()) >= 11, await p.locator('.bth-steps li').count())
  await p.click('.card.bth .bth-h')
  await p.click('.mytoday .mt-h .lnk')
  await p.waitForTimeout(300)
  ok('오늘 넣을 것 «면허 · 지역 고르기 ▼» → 고르는 칸 펼침', (await p.locator('.mytoday .mt-setup').count()) === 1)
  ok('분석실 → /bunseok', (await p.getAttribute('.bsr-cta', 'href')) === '/bunseok')
  await p.click('.simstrip')
  await p.waitForTimeout(500)
  ok('성적 → 가상 시뮬레이션(#sim)으로 내려감', await p.evaluate(() => { const s = document.getElementById('sim'); return !!s && Math.abs(s.getBoundingClientRect().top) < 200 }))
  ok('오류 0(폰)', !오류.length, 오류)
  await ctx.close()
}

console.log('③ PC 1280 · 폰 360 · 320')
{
  const { ctx, p, 오류 } = await 새쪽(1280, 900, false)
  await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('button.pickrow', { timeout: 15000 })
  await p.waitForTimeout(1200)
  const z = await 칸(p)
  ok('PC 덧말 그대로 보임', z.덧말.사용법 && z.덧말.성적 && z.덧말.오늘 && z.덧말.분석실, z.덧말)
  ok('오류 0(PC)', !오류.length, 오류)
  await ctx.close()
  for (const [w, h] of [[360, 740], [320, 640]]) {
    const s = await 새쪽(w, h)
    await s.p.goto(BASE + '/', { waitUntil: 'domcontentloaded' })
    await s.p.waitForSelector('button.pickrow', { timeout: 15000 })
    await s.p.waitForTimeout(800)
    ok(`폰 ${w} 넘침 0`, (await 넘침(s.p)) <= 0, await 넘침(s.p))
    ok(`폰 ${w} 오류 0`, !s.오류.length, s.오류)
    await s.ctx.close()
  }
}
await b.close()
console.log(`\n${bad ? '✗' : '✓'} 시험_바로투찰간단화면 ${n - bad}/${n}`)
process.exit(bad ? 1 : 0)
