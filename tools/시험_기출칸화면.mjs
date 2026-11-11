/**
 * 🧪 G652 (2026-11-11) 자격증 «📄 기출문제» 칸 화면 시험
 *   구운 사이트(dist)를 띄운 뒤:  LANG=C.UTF-8 node tools/시험_기출칸화면.mjs [주소=http://127.0.0.1:4986]
 *   소장님 「자격증 기출문제 연결 안되게 많아. 그리고 예상문제도 없고」 → 「클로드가 한 것 처럼 하자」(기획 ①)
 *   ① 폰 390 — 83종목 쪽마다 맨 위 카드 안에 기출 칸 하나 · 종류 = cert.json gq · 링크 = 큐넷 자료실을 종목 이름으로 찾은 쪽(새 창) ·
 *      없음 = «큐넷 자료실에 없습니다» + 제 예상문제 / 짝 예상문제 / 차례로 · 가로 넘침 0 · 오류 0
 *   ② 누름 — 큐넷 링크는 새 창(시험에선 가짜 쪽) · 셈 |자격증기출|slug 한 번 / 짝 예상문제 → /cert/{짝}/quiz · 셈 |자격증기출짝|slug
 *   ③ /cert «📝 기출문제는?» 글(공공누리 제1유형 · 43종목) · PC 1280 · 폰 320 넘침 0
 * 인터넷 안 부름(큐넷 · 파이어베이스는 가짜로 받음).
 */
import { createRequire } from 'node:module'
import fs from 'node:fs'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const BASE = process.argv[2] || 'http://127.0.0.1:4986'
const d = JSON.parse(fs.readFileSync(new URL('../web/src/data/cert.json', import.meta.url), 'utf8'))
const 공지판 = (fs.readFileSync(new URL('../web/src/감사공지.jsx', import.meta.url), 'utf8').match(/const 판 = '([^']+)'/) || [])[1] || ''
let bad = 0, n = 0
const ok = (이름, c, got) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (c || got === undefined ? '' : ' = ' + JSON.stringify(got).slice(0, 500))) }
const UA폰 = 'Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'
const 큐넷찾기 = (code, 이름) => `https://www.q-net.or.kr/cst006.do?id=cst00601&code=${code}&gSite=Q&schType=A&schText=${encodeURIComponent(이름)}`
const 기대길 = (x) => (x.gq ? 큐넷찾기(x.gq === '기출' ? '1203' : '1204', x.n) : null)
const 셈들 = []
const b = await chromium.launch()
async function 새쪽(w, h, 폰 = true) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', isMobile: 폰, hasTouch: 폰, ...(폰 ? { userAgent: UA폰 } : {}) })
  await ctx.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|googlesyndication|geojs/, (r) => r.fulfill({ status: 200, body: '' }))
  await ctx.route(/firebaseio\.com|firebasedatabase\.app/, (r) => { const u = decodeURIComponent(r.request().url()); if (/자격증기출/.test(u) && r.request().method() !== 'GET') 셈들.push(u.replace(/^.*?\.(com|app)\//, '')); r.fulfill({ status: 200, contentType: 'application/json', body: r.request().method() === 'GET' ? 'null' : (r.request().postData() || 'null') }) })
  await ctx.route(/q-net\.or\.kr/, (r) => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: '<html><body>가짜 큐넷</body></html>' }))
  await ctx.addInitScript((판) => { try { if (!sessionStorage.getItem('__시험')) { sessionStorage.setItem('__시험', '1'); localStorage.setItem('kcm_notice_seen', '2026-10-필독'); sessionStorage.setItem('kcm_notice_seen', 판); sessionStorage.setItem('kcm_visit_s', '1') } } catch (e) { /* 없음 */ } }, 공지판)
  /* 숨은 셈은 봇이면 안 셈 — 이 시험에선 사람처럼 */
  await ctx.addInitScript(() => { try { Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false }) } catch (e) { /* 없음 */ } })
  const p = await ctx.newPage()
  const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
  p.on('dialog', (x) => x.dismiss())
  return { ctx, p, 오류 }
}
const 칸읽기 = (p) => p.evaluate(() => {
  const 위 = [...document.querySelectorAll('.card')].find((c) => c.querySelector('.cert-h1'))
  if (!위) return null
  const 링크 = [...위.querySelectorAll('a.gq-go')], 없음 = [...위.querySelectorAll('.gq-none')]
  const 모두 = document.querySelectorAll('.gq-go, .gq-none').length
  return { 링크: 링크.map((a) => ({ href: a.href, t: a.target, rel: a.rel, 글: a.innerText.replace(/\s+/g, ' ').trim() })), 없음: 없음.map((x) => ({ 글: x.innerText.replace(/\s+/g, ' ').trim(), a: [...x.querySelectorAll('a')].map((a) => a.getAttribute('href')) })), 모두, 넘침: document.documentElement.scrollWidth - innerWidth }
})

console.log('① 폰 390 — 83종목 쪽마다 기출 칸')
{
  const { ctx, p, 오류 } = await 새쪽(390, 844)
  const 틀림 = [], 셈 = { 기출: 0, 공개: 0, 예시: 0, 없음: 0 }
  for (const x of d.items) {
    await p.goto(BASE + '/cert/' + x.slug, { waitUntil: 'domcontentloaded' })
    await p.waitForSelector('.cert-h1', { timeout: 15000 })
    await p.waitForSelector('.gq-go, .gq-none', { timeout: 8000 }).catch(() => {})
    const r = await 칸읽기(p)
    const 짝 = x.qzRef ? d.items.find((y) => y.slug === x.qzRef.s) : null
    const 제것 = !!(d.deep[x.slug] && d.deep[x.slug].quiz)
    let 맞 = r && r.모두 === 1 && r.넘침 <= 0
    if (x.gq) {
      const 제목 = { 기출: '📄 기출문제 — 큐넷 문제지', 공개: '📄 실기 공개문제 — 큐넷', 예시: '📄 실기 예시문제 — 큐넷' }[x.gq]
      맞 = 맞 && r.링크.length === 1 && r.링크[0].href === 기대길(x) && r.링크[0].t === '_blank' && /noopener/.test(r.링크[0].rel) && r.링크[0].글.startsWith(제목)
      셈[x.gq]++
    } else {
      const 뒤 = 제것 ? /위 «📝 예상문제 풀기» 로 연습하세요\.$/ : 짝 ? new RegExp(`📝 ${짝.n} 예상문제 로 연습하세요 — `) : /예상문제는 차례로 만들고 있습니다\.$/
      맞 = 맞 && r.없음.length === 1 && /^📄 기출문제 — 이 종목 문제는 큐넷 자료실\(기출 · 공개문제\)에 없습니다\./.test(r.없음[0].글) && 뒤.test(r.없음[0].글)
        && (짝 ? r.없음[0].a.join() === `/cert/${짝.slug}/quiz` : r.없음[0].a.length === 0)
      셈.없음++
    }
    if (!맞) 틀림.push([x.slug, r])
  }
  ok('83종목 모두 — 칸 하나 · 종류 · 링크(새 창) · 없음 글 · 넘침 0', 틀림.length === 0, 틀림.slice(0, 3))
  ok('종류 수 — 기출 19 · 공개 37 · 예시 6 · 없음 21', JSON.stringify(셈) === JSON.stringify({ 기출: 19, 공개: 37, 예시: 6, 없음: 21 }), 셈)
  ok('오류 0', 오류.length === 0, 오류.slice(0, 3))

  console.log('② 누름 — 큐넷 새 창 · 셈 / 짝 예상문제')
  await p.goto(BASE + '/cert/tomok-sigong-gisulsa', { waitUntil: 'domcontentloaded' }); await p.waitForSelector('a.gq-go')
  const [새] = await Promise.all([ctx.waitForEvent('page', { timeout: 8000 }), p.locator('a.gq-go').click()])
  await 새.waitForLoadState('domcontentloaded').catch(() => {})
  const 새주소 = 새.url()
  await 새.close()
  const t0 = Date.now(); while (Date.now() - t0 < 6000 && !셈들.some((u) => /자격증기출\|tomok-sigong-gisulsa/.test(u))) await p.waitForTimeout(200)
  ok('토목시공기술사 «📄 기출문제» → 새 창 = 큐넷 기출(기술사) 자료실 «토목시공기술사» 찾기 · 이 쪽은 그대로', 새주소 === 기대길(d.items.find((x) => x.slug === 'tomok-sigong-gisulsa')) && /\/cert\/tomok-sigong-gisulsa$/.test(p.url()), [새주소, p.url()])
  ok('셈 |자격증기출|tomok-sigong-gisulsa 한 번', 셈들.filter((u) => /자격증기출\|tomok-sigong-gisulsa/.test(u)).length === 1, 셈들)
  await p.goto(BASE + '/cert/geonchuk-saneopgisa', { waitUntil: 'domcontentloaded' }); await p.waitForSelector('.gq-none a')
  await p.locator('.gq-none a').click(); await p.waitForURL(/\/cert\/geonchuk-gisa\/quiz$/, { timeout: 8000 }).catch(() => {})
  const t1 = Date.now(); while (Date.now() - t1 < 6000 && !셈들.some((u) => /자격증기출짝\|geonchuk-saneopgisa/.test(u))) await p.waitForTimeout(200)
  ok('건축산업기사 «📝 건축기사 예상문제» → /cert/geonchuk-gisa/quiz · 셈 |자격증기출짝|geonchuk-saneopgisa', /\/cert\/geonchuk-gisa\/quiz$/.test(p.url()) && 셈들.some((u) => /자격증기출짝\|geonchuk-saneopgisa/.test(u)), [p.url(), 셈들])
  ok('누름 뒤 오류 0', 오류.length === 0, 오류.slice(0, 3))
  await ctx.close()
}

console.log('③ /cert 기출 글 · PC 1280 · 폰 320')
{
  const { ctx, p, 오류 } = await 새쪽(390, 844)
  await p.goto(BASE + '/cert', { waitUntil: 'domcontentloaded' }); await p.waitForSelector('.cert-chip', { timeout: 15000 })
  const 글 = await p.evaluate(() => { const c = [...document.querySelectorAll('.card')].find((x) => /📝 기출문제는\?/.test(x.innerText)); return c ? c.innerText.replace(/\s+/g, ' ') : '' })
  ok('/cert «📝 기출문제는?» — 기술사 기출 · 공공누리 제1유형 · 실기 공개 · 예시 43종목 · 필기는 자료실에 없음 · 예상문제 셋 · 큐넷 기술사 자료실', /공공누리 제1유형/.test(글) && /43종목/.test(글) && /기사 · 산업기사 · 기능사 필기 문제는 큐넷 자료실에 없습니다/.test(글) && /토목기사 예상문제/.test(글) && /큐넷 기출문제\(기술사\) 자료실/.test(글), 글.slice(0, 300))
  ok('/cert 폰 390 넘침 0 · 오류 0', (await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0 && 오류.length === 0, 오류)
  await ctx.close()
}
for (const [w, h, 폰, 이름] of [[1280, 900, false, 'PC 1280'], [320, 640, true, '폰 320']]) {
  const { ctx, p, 오류 } = await 새쪽(w, h, 폰)
  const 틀 = []
  for (const s of ['tomok-sigong-gisulsa', 'geopujip-gineungsa', 'silnae-geonchuk-gisa', 'tomok-gisa', 'geonchuk-saneopgisa', 'haeyang-gonghak-gisa']) {
    await p.goto(BASE + '/cert/' + s, { waitUntil: 'domcontentloaded' }); await p.waitForSelector('.gq-go, .gq-none', { timeout: 15000 })
    const r = await 칸읽기(p)
    if (!(r && r.모두 === 1 && r.넘침 <= 0)) 틀.push([s, r && r.넘침])
  }
  ok(`${이름} — 여섯 종목 칸 하나 · 넘침 0 · 오류 0`, 틀.length === 0 && 오류.length === 0, [틀, 오류])
  await ctx.close()
}
await b.close()
console.log(`\n${bad ? '✗' : '✓'} 시험_기출칸화면 ${n - bad}/${n}`)
process.exit(bad ? 1 : 0)
