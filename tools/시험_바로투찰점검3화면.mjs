/**
 * 🧪 G810 바로투찰 점검 셋째(11-21 소장님 「만들면서 바로투찰 점검도 함께 해 줘」) — 구운 사이트(가짜 파이어베이스 판)를 띄운 뒤:
 *   node tools/시험_바로투찰점검3화면.mjs [주소=http://127.0.0.1:5821]
 *   ① 용역 · 물품 바로투찰을 «주소로 바로»(새로 고침 · 공유 링크 · 새 탭) 열어도 기초금액(b)이 안 떨어짐 → «셈에 쓴 값» · 금액
 *      (G688 블로그 꼬리 떼기가 b = 기초금액까지 떼어 «기초금액 공개 전입니다 — 셀 수 없습니다» 가 되던 것 · 11-15 부터)
 *   ② 블로그 꼬리(?b=n3)는 전처럼 뗌
 *   ③ 공고 목록 찾기 칸에 공고번호 → «💰 바로투찰에서 이 번호로 열기» → 누르면 그 공고 바로투찰(금액)
 *   ④ 폰 390 · PC 1280 · 넘침 0 · 오류 0 · 가상 자료만(인터넷 안 부름)
 */
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const BASE = process.argv[2] || 'http://127.0.0.1:5821'

let bad = 0, n = 0
const ok = (이름, c, got) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (c || got === undefined ? '' : ' = ' + JSON.stringify(got).slice(0, 300))) }
const 날 = (d) => new Date(Date.now() + d * 86400e3 + 9 * 3600e3).toISOString().slice(0, 10)
const 오늘 = 날(0)
const 가 = { no: 'R00TEST81001', ord: '000', name: '가상 근린공원 시설 정비공사', inst: '가상시', base: 187500000, est: 170454545, llr: 89.745, aval: 7500000, ayn: 'Y',
  close: 날(3) + ' 10:00:00', lo: -3, hi: 3, ptot: 15, pdrw: 4, lic: ['토목공사업/0001'], sido: '경기', mthd: '제한경쟁', kind: '일반', dt: 오늘 + ' 09:00:00',
  swin: '적격심사제-추정가격이 2억원 미만인 입찰공사 평가기준 (실적제한 아님, 그 밖의 공사)' }
const 줄들 = [가]
const meta = { built: 오늘 + ' 06:00', chunk: 500, rankChunk: 50, con: { n: 1, parts: 1, from: '2026-09-15', to: 오늘, lics: [['0001', '토목공사업', 120]] }, serv: { n: 0, parts: 0 } }
const f = ['no', 'name', 'inst', 'base', 'budget', 'close', 'lo', 'hi', 'llr', 'est', 'lic', 'aval', 'gmtrl', 'ayn', 'ptot', 'pdrw', 'url', 'site', 'rgnb', 'joint', 'mthd', 'swin', 'rebid', 'enp', 'enpn', 'dt', 'sido', 'dsn', 'enpb', 'jnt', 'tg', 'nt', 'licg', 'rgs', 'az', 'smk', 'pc']
const 표 = {}
for (const s of [0, 1, 2, 3]) for (const q of [0, 1, 2, 3]) 표[`s${s}n${q}`] = [120, 5.1]
const 색인 = JSON.stringify({ built: 오늘 + ' 06:00', f, pick: { tbl: 표, sz: [1e8, 3e8, 1e9], nb: [10, 30, 100] },
  r: 줄들.map((g) => f.map((k) => (g[k] === undefined ? (k === 'smk' ? '' : k === 'az' ? 0 : null) : g[k]))) })
const 개요 = { rows: 168842, agencies: 5066, corps: 72494, hot: { win: 30, n: 8651, mode: 90.3, rec: 90.1 },
  bands: [{ key: 's', label: '10억 미만', min: 0, max: 1e9, llr: 89.745, off: 0.2, win: 30, n: 8851, mode: 90.3, rec: 90.1, thin: false }],
  sjq: { p10: 98.934, p25: 99.379, p50: 99.886, p75: 100.377, p90: 100.796, p95: 101.036, p98: 101.303 } }
const 지금 = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 16).replace('T', ' ')
const 헬스 = { at: 지금, ok: true, why: '', fails: 0, got: { first: 266, live: 815 }, note: '', maint: false, hint: '', lastok: 지금, newest: { first: 오늘, live: 오늘 }, n: { first: 18396, live: 21143 }, gaps: { first: [], live: [] } }
const 용역주소 = (종류, no) => `/${종류}/calc?no=${no}&ord=000&n=` + encodeURIComponent('가상 청사 시설관리 용역') + '&i=' + encodeURIComponent('가상시') +
  '&b=52800000&l=87.745&lo=-2&hi=2&a=0&ay=Y&az=1&pt=15&pd=4&c=' + encodeURIComponent(날(3) + ' 10:00:00') + '&pm=' + encodeURIComponent('복수예가') + '&sw=' + encodeURIComponent('적격심사제-용역')

const b = await chromium.launch()
const UA폰 = 'Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'
async function 새쪽(w, h, 폰) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', isMobile: 폰, hasTouch: 폰, ...(폰 ? { userAgent: UA폰 } : {}) })
  await ctx.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|googlesyndication|geojs|daumcdn|kakao|coupang/, (r) => r.fulfill({ status: 200, body: '' }))
  await ctx.route(/firebaseio\.com|firebasedatabase\.app|identitytoolkit|securetoken/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await ctx.route('**/data/board/live.json*', (r) => r.fulfill({ json: meta }))
  await ctx.route('**/data/board/live-con-0.json*', (r) => r.fulfill({ json: 줄들 }))
  await ctx.route('**/data/ext/meta.json*', (r) => r.fulfill({ json: { n: 0, first: 0 } }))
  await ctx.route('**/data/pre/idx.json*', (r) => r.fulfill({ json: { all: [0, 0], n: {} } }))
  await ctx.route('**/data/health.json*', (r) => r.fulfill({ json: 헬스 }))
  await ctx.route(/\/data\/bidindex\.json/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 색인 }))
  await ctx.route(/\/data\/aparts\.json/, (r) => r.fulfill({ json: { a: {} } }))
  await ctx.route(/\/data\/overview\.json/, (r) => r.fulfill({ json: 개요 }))
  await ctx.route(/\/data\/(sim|basket|bidresult|first|agency|bstat|jongsim)[^/]*\.json/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await ctx.addInitScript(() => {
    try { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); sessionStorage.setItem('kcm_notice_seen', '2026-10-업체'); sessionStorage.setItem('kcm_visit_s', '1') } catch (e) { /* 없음 */ }
    try { localStorage.setItem('kcm_op', '1') } catch (e) { /* 없음 */ }   /* 점검 날에도 입력 되게(소장님 기기 — 점검둘러보기는 시험_점검창이 봄) */
  })
  const p = await ctx.newPage()
  const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
  return { ctx, p, 오류 }
}
const 넘침 = (p) => p.evaluate(() => document.documentElement.scrollWidth - innerWidth)
const 쉬어 = (ms) => new Promise((r) => setTimeout(r, ms))

for (const [이름, w, h, 폰] of [['폰 390', 390, 844, true], ['PC 1280', 1280, 900, false]]) {
  console.log(`■ ${이름}`)
  const { ctx, p, 오류 } = await 새쪽(w, h, 폰)
  for (const 종류 of ['svc', 'goods']) {
    await p.goto(BASE + 용역주소(종류, 'R00TEST8100' + (종류 === 'svc' ? '6' : '7')), { waitUntil: 'domcontentloaded' })
    await p.waitForFunction(() => /셈에 쓴 값|셀 수 없습니다/.test(document.body.innerText), null, { timeout: 20000 }).catch(() => {})
    await 쉬어(600)
    const r = await p.evaluate(() => ({ b: new URLSearchParams(location.search).get('b'), 글: document.body.innerText }))
    ok(`① ${종류 === 'svc' ? '용역' : '물품'} 바로투찰 주소로 바로 — b(기초금액) 그대로 · «셈에 쓴 값» · 기초금액 52,800,000원 · «셀 수 없습니다» 없음`,
      r.b === '52800000' && /셈에 쓴 값/.test(r.글) && /52,800,000원/.test(r.글) && !/셀 수 없습니다/.test(r.글), [r.b, (r.글.match(/(셀 수 없습니다|기초금액 공개 전)[^\n]{0,40}/) || [''])[0]])
  }
  await p.goto(BASE + '/tools?b=n3', { waitUntil: 'domcontentloaded' })
  await 쉬어(800)
  ok('② 블로그 꼬리(?b=n3)는 전처럼 뗌', !(await p.evaluate(() => new URLSearchParams(location.search).has('b'))))
  await p.goto(BASE + '/live', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('input[placeholder*="공고명 · 발주기관 검색"]', { timeout: 20000 })
  await p.fill('input[placeholder*="공고명 · 발주기관 검색"]', 'r00test81001')
  await 쉬어(500)
  const 길 = await p.evaluate(() => { const a = document.querySelector('.lv-nohint a'); return a ? [a.getAttribute('href'), a.innerText] : null })
  ok('③ 공고 목록 찾기 칸에 공고번호(소문자도) → «💰 바로투찰에서 이 번호로 열기» · 주소 /?no=R00TEST81001', !!길 && 길[0] === '/?no=R00TEST81001' && /바로투찰에서 이 번호로 열기/.test(길[1]), 길)
  await p.fill('input[placeholder*="공고명 · 발주기관 검색"]', '근린공원')
  await 쉬어(400)
  ok('공고명으로 찾으면 그 안내 줄 없음(전과 같음)', !(await p.$('.lv-nohint')))
  await p.fill('input[placeholder*="공고명 · 발주기관 검색"]', 'R00TEST81001')
  await 쉬어(400)
  await p.locator('.lv-nohint a').click()
  await p.waitForFunction((nm) => document.body.innerText.includes(nm), 가.name, { timeout: 20000 }).catch(() => {})
  await 쉬어(900)
  const 금 = await p.evaluate(() => (document.querySelector('.hero .amt') || {}).innerText || '')
  const 지금길 = await p.evaluate(() => location.pathname)
  ok('누르면 그 공고 바로투찰(/) — 금액 나옴', /\d/.test(금) && 지금길 === '/', [금, 지금길])
  await p.fill('input[placeholder*="도로포장"]', '').catch(() => {})
  ok('넘침 0 · 오류 0', (await 넘침(p)) <= 0 && 오류.length === 0, 오류)
  await ctx.close()
}
await b.close()
console.log(`\n${bad ? '✗' : '✓'} 시험_바로투찰점검3화면 ${n - bad}/${n}`)
if (bad) process.exit(1)
