/**
 * 📱 G649 공고 목록 «🆕 방금» 은 접지 않음 — 지키는 시험 (구운 사이트(dist)를 띄운 뒤):
 *   node tools/시험_방금접기화면.mjs [주소=http://127.0.0.1:4578]
 *   소장님 2026-11-11 13:0x 「공고 접기는 하지마」 — G648(방금 줄 접기 · 바로투찰 되는 방금 줄 맨 앞)을 G649 로 뺌.
 *   방금 올라온 공고는 모두 보이고(새것 먼저 · 차례 그대로) «더 보기 · 접기» 줄은 없어야 합니다 — 다시 접기를 넣으면 ✗.
 *   가상 자료만 씀(방금 40건 = 바로투찰 됨 2 + 기초금액 전 38 · 목록 20건) · 인터넷 안 부름 · 폰 390 · 360 · PC 1280.
 */
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const BASE = process.argv[2] || 'http://127.0.0.1:4578'

let bad = 0, n = 0
const ok = (이름, c, got) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (c || got === undefined ? '' : ' = ' + JSON.stringify(got).slice(0, 300))) }
const 날 = (d) => new Date(Date.now() + d * 86400e3 + 9 * 3600e3).toISOString().slice(0, 10)
const 오늘 = 날(0), 어제 = 날(-1)
const 완비 = { base: 1100000000, est: 1000000000, llr: 87.745, aval: 62460000, ayn: 'Y', lo: -3, hi: 3, ptot: 15, pdrw: 4, smk: 'N' }
const 공통 = { ord: '000', inst: '가상시', close: 날(5) + ' 10:00:00', lic: ['토목공사업/0001'], sido: '경기', mthd: '제한경쟁', kind: '등록공고', tg: 64, swin: '적격심사제-추정가격 10억원 이상 50억원 미만' }
const 목록 = Array.from({ length: 20 }, (_, i) => ({ ...공통, ...(i % 3 === 2 ? { est: 900000000 } : 완비), no: 'R00TESTL' + String(i).padStart(4, '0'),
  name: `가상 목록 공사 ${i + 1}`, dt: 어제 + ' ' + String(17 - Math.floor(i / 3)).padStart(2, '0') + ':' + String(50 - i).padStart(2, '0') + ':00' }))
const 방금줄 = Array.from({ length: 40 }, (_, i) => {
  const 됨 = i === 17 || i === 33
  const 분 = 59 - i
  const r = { ...공통, ...(됨 ? 완비 : { est: 300000000 }), no: 'R00TESTF' + String(i).padStart(4, '0'), name: `가상 방금 공사 ${i + 1}${됨 ? '(바로투찰 됨)' : ''}`,
    dt: 오늘 + ' 09:' + String(Math.max(0, 분)).padStart(2, '0') + ':00' }
  r._ix = [r.name, r.inst, r.base || null, r.lo || null, r.hi || null, r.lic, r.sido, 0, r.est, 0, r.tg]
  return r
})
const meta = { built: 어제 + ' 18:00', chunk: 500, rankChunk: 50, con: { n: 목록.length, parts: 1, from: '2026-09-23', to: 어제 }, serv: { n: 0, parts: 0 } }
const f = ['no', 'name', 'inst', 'base', 'budget', 'close', 'lo', 'hi', 'llr', 'est', 'lic', 'aval', 'gmtrl', 'ayn', 'ptot', 'pdrw', 'url', 'site', 'rgnb', 'joint', 'mthd', 'swin', 'rebid', 'enp', 'enpn', 'dt', 'sido', 'dsn', 'enpb', 'jnt', 'tg', 'nt', 'licg', 'rgs', 'az', 'smk', 'pc']
const 색인 = JSON.stringify({ built: 어제 + ' 18:00', f, pick: {}, r: [...목록, ...방금줄].map((g) => f.map((k) => (g[k] === undefined ? (k === 'smk' ? '' : k === 'az' ? 0 : null) : g[k]))) })
const 지금 = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 16).replace('T', ' ')
const 헬스 = { at: 지금, ok: true, why: '', fails: 0, got: { first: 266, live: 815 }, note: '', maint: false, hint: '', lastok: 지금, newest: { first: 오늘, live: 오늘 }, n: { first: 18396, live: 21143 }, gaps: { first: [], live: [] } }
const 방금메타 = { at: Date.now() - 6 * 60000, built: 어제 + ' 18:00', n: 방금줄.length, p: 1, h: 'g648' }
const b = await chromium.launch()
const UA폰 = 'Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'
async function 새쪽(w, h, 폰 = true) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', isMobile: 폰, hasTouch: 폰, ...(폰 ? { userAgent: UA폰 } : {}) })
  await ctx.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|googlesyndication|geojs/, (r) => r.fulfill({ status: 200, body: '' }))
  await ctx.route(/firebaseio\.com|firebasedatabase\.app|identitytoolkit|securetoken/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await ctx.route(/firebaseio\.com\/fresh\/meta\/live\.json/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(방금메타) }))
  await ctx.route(/firebaseio\.com\/fresh\/rows\/live\/0\.json/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(JSON.stringify(방금줄)) }))
  await ctx.route('**/data/board/live.json*', (r) => r.fulfill({ json: meta }))
  await ctx.route('**/data/board/live-con-0.json*', (r) => r.fulfill({ json: 목록 }))
  await ctx.route('**/data/ext/meta.json*', (r) => r.fulfill({ json: { n: 0, first: 0 } }))
  await ctx.route('**/data/pre/idx.json*', (r) => r.fulfill({ json: { all: [0, 0], n: {} } }))
  await ctx.route('**/data/health.json*', (r) => r.fulfill({ json: 헬스 }))
  await ctx.route(/\/data\/bidindex\.json/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 색인 }))
  await ctx.route(/\/data\/(sim|basket|bidresult|first|agency|bstat|aparts|overview)[^/]*\.json/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await ctx.addInitScript(() => { try { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); sessionStorage.setItem('kcm_notice_seen', '2026-10-업체'); sessionStorage.setItem('kcm_visit_s', '1') } catch (e) { /* 없음 */ } })
  const p = await ctx.newPage()
  const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
  return { ctx, p, 오류 }
}
const 넘침 = (p) => p.evaluate(() => document.documentElement.scrollWidth - innerWidth)
const 쉬어 = (ms) => new Promise((r) => setTimeout(r, ms))
const 모양 = (p) => p.evaluate(() => {
  const 카드 = [...document.querySelectorAll('.notice')]
  const 이름 = 카드.map((c) => (c.querySelector('h3') || {}).innerText || '')
  const 알약 = 카드.map((c) => !!c.querySelector('a.gocalc'))
  const 첫 = 알약.indexOf(true)
  const 접기 = document.querySelector('button.fresh-fold')
  const 첫알약 = 첫 >= 0 ? 카드[첫].querySelector('a.gocalc').getBoundingClientRect().top + scrollY : null
  return { 수: 카드.length, 방금: 이름.filter((x) => /방금 공사/.test(x)).length, 첫, 첫알약y: 첫알약 === null ? null : Math.round(첫알약),
    알약수: 알약.filter(Boolean).length, 접기: 접기 ? 접기.innerText.replace(/\s+/g, ' ').trim() : '', 접기뒤: 접기 ? ((접기.nextElementSibling && 접기.nextElementSibling.className) || '') : '',
    접기자리: 접기 ? 카드.filter((c) => c.compareDocumentPosition(접기) & Node.DOCUMENT_POSITION_FOLLOWING).length : -1,
    머리: (document.querySelector('.freshn') || {}).innerText || '', 이름5: 이름.slice(0, 6) }
})

for (const [이름, w, h, 폰] of [['폰 390', 390, 844, true], ['폰 360', 360, 780, true], ['PC 1280', 1280, 900, false]]) {
  console.log(`■ ${이름}`)
  const { ctx, p, 오류 } = await 새쪽(w, h, 폰)
  await p.goto(BASE + '/live', { waitUntil: 'domcontentloaded' })
  await p.waitForFunction(() => document.querySelectorAll('.notice').length >= 20 && !!document.querySelector('.freshn'), null, { timeout: 20000 })
  await 쉬어(600)
  const 처음 = await 모양(p)
  ok('머리 «🆕 방금 40건» 그대로', /방금 40건/.test(처음.머리), 처음.머리)
  ok('방금 카드 40 모두 보임 · 목록 20 그대로(접지 않음)', 처음.방금 === 40 && 처음.수 === 60, { 방금: 처음.방금, 수: 처음.수 })
  ok('«더 보기 · 접기» 줄 없음(button.fresh-fold 0)', 처음.접기 === '' && 처음.접기자리 === -1, { 접기: 처음.접기, 자리: 처음.접기자리 })
  ok('방금 차례 = 새것 먼저 그대로(1 · 2 · 3 …) — 바로투찰 되는 줄을 앞으로 옮기지 않음', 처음.이름5[0] === '가상 방금 공사 1' && 처음.이름5[1] === '가상 방금 공사 2' && 처음.이름5[2] === '가상 방금 공사 3', 처음.이름5)
  ok('첫 «💰 바로투찰» = 18번째 카드(방금 18 · 차례 그대로)', 처음.첫 === 17, { 첫: 처음.첫, y: 처음.첫알약y })
  ok('바로투찰 알약 = 방금 되는 2 + 목록 완비 14(목록은 그대로)', 처음.알약수 === 16, 처음.알약수)
  ok(`${이름} 넘침 0`, (await 넘침(p)) <= 0, await 넘침(p))
  await p.reload({ waitUntil: 'domcontentloaded' })
  await p.waitForFunction(() => document.querySelectorAll('.notice').length >= 20 && !!document.querySelector('.freshn'), null, { timeout: 20000 })
  await 쉬어(600)
  const 다시 = await 모양(p)
  ok('새로고침해도 같음(방금 40 · 접기 줄 없음)', 다시.방금 === 40 && 다시.접기 === '', { 방금: 다시.방금, 접기: 다시.접기 })
  /* 방금 카드 알약 → 바로투찰(그 공고) */
  await p.evaluate(() => { const c = [...document.querySelectorAll('.notice')].find((x) => x.querySelector('a.gocalc')); c.querySelector('a.gocalc').click() })
  await p.waitForFunction(() => location.pathname === '/' && /no=R00TESTF0017/.test(location.search), null, { timeout: 10000 })
  await p.waitForFunction(() => document.body.innerText.includes('가상 방금 공사 18'), null, { timeout: 20000 })
  ok('방금 카드 «💰 바로투찰» → 바로투찰(?no= 그 공고) · 공고 이름이 뜸', true)
  ok(`${이름} 오류 0`, 오류.length === 0, 오류)
  await ctx.close()
}
await b.close()
console.log(`\n${bad ? '❌' : '✅'} 시험_방금접기화면(접지 않음) ${n - bad}/${n}`)
process.exit(bad ? 1 : 0)
