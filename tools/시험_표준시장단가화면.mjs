/**
 * ⚖ G578 표준시장단가 화면 시험 — 구운 사이트(dist)를 띄운 뒤:
 *   node tools/시험_표준시장단가화면.mjs [주소=http://127.0.0.1:4578]
 *   2026.7 개편: 추정가격 100억~300억 «기술형 적격심사» 는 표준시장단가도 A값처럼 낙찰률에서 뺌(나라장터 «기초금액조회» A 에 들어 있음).
 *   가상 공고 셋 — 가(100억 넘음 · smk 없음 · 예전 A값) · 나(100억 넘음 · smk Y · 표준시장단가 더한 A값) · 다(2억 · smk 없음)
 *   ① 공고 목록(/live): 가 «💰 바로투찰» · 권장 금액 없음 + 펼치면 «표준시장단가» 안 실림 / 나 · 다 는 권장 금액 · 나는 나라장터 A 로 셈
 *   ② 공고 한 장(/notice): 가 «💰 권장 투찰금액» 없음 / 나 있음 · A값 «(표준시장단가 포함)»
 *   ③ 바로투찰(/?no=): 가 «⛔ 아직 계산할 수 없습니다» · «✕ 표준시장단가(100억 이상)» · 까닭 글 · A값 칸 비움 / 나 «표준시장단가» 로 안 막힘 · A값 42억
 *   ④ 폰 390 · PC 1280 넘침 0 · 오류 0   ⑤ 분석실(/bunseok?no=가) — «아직 계산할 수 없습니다» · 금액 없음
 * 가상 자료만 씀 · 인터넷 안 부름(파이어베이스는 가짜 · 광고 · 애널리틱스 막음).
 */
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const BASE = process.argv[2] || 'http://127.0.0.1:4578'

let bad = 0, n = 0
const ok = (이름, c, got) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (c || got === undefined ? '' : ' = ' + JSON.stringify(got).slice(0, 300))) }

const 날 = (d) => new Date(Date.now() + d * 86400e3 + 9 * 3600e3).toISOString().slice(0, 10)
const 오늘 = 날(0)
const 공통 = { ord: '000', inst: '가상시', dt: 오늘 + ' 09:00:00', close: 날(3) + ' 10:00:00', lo: -3, hi: 3, ptot: 15, pdrw: 4, ayn: 'Y', lic: ['토목공사업/0001'], sido: '경기',
  swin: '적격심사제-추정가격이 300억원미만 100억원이상인 입찰공사(실적제한 아님, 종합공사)', mthd: '일반경쟁' }
/* 숫자는 실제 공고 하나(11-07 마감 전)의 꼴 그대로 — 기초 225억 · 하한율 81.995 · 예전 A 13.8억 · 표준시장단가 28.2억 · 나라장터 A 41.99억 */
const 가 = { ...공통, no: 'R00TEST57801', name: '가상 학교 개축공사(표준 모름)', base: 22522764000, est: 20226550000, llr: 81.995, aval: 1380201371 }
const 나 = { ...공통, no: 'R00TEST57802', name: '가상 학교 개축공사(표준 받음)', base: 22522764000, est: 20226550000, llr: 81.995, aval: 4198886031, smk: 'Y' }
const 다 = { ...공통, no: 'R00TEST57803', name: '가상 마을안길 포장공사', base: 244600000, est: 222363636, llr: 89.745, aval: 13940000, swin: '적격심사제-추정가격 3억원 미만' }
const 줄들 = [가, 나, 다]
const meta = { built: 오늘 + ' 06:00', chunk: 500, rankChunk: 50, con: { n: 3, parts: 1, from: '2026-09-15', to: 오늘 }, serv: { n: 0, parts: 0 } }
const f = ['no', 'name', 'inst', 'base', 'budget', 'close', 'lo', 'hi', 'llr', 'est', 'lic', 'aval', 'gmtrl', 'ayn', 'ptot', 'pdrw', 'url', 'site', 'rgnb', 'joint', 'mthd', 'swin', 'rebid', 'enp', 'enpn', 'dt', 'sido', 'dsn', 'enpb', 'jnt', 'tg', 'nt', 'licg', 'rgs', 'smk', 'pc']
const 색인 = JSON.stringify({ built: 오늘 + ' 06:00', f, pick: {}, r: 줄들.map((g) => f.map((k) => (g[k] === undefined ? (k === 'smk' ? '' : null) : g[k]))) })
const 내역 = { a: { [나.no]: [['산업안전보건관리비', 700000000], ['국민연금보험료', 680201371], ['표준시장단가', 2818684660]], [가.no]: [['산업안전보건관리비', 700000000], ['국민연금보험료', 680201371]] } }
const 개요 = { rows: 168842, agencies: 5066, corps: 72494, hot: { win: 30, n: 8651, mode: 90.3, rec: 90.1 },
  bands: [{ key: 's', label: '10억 미만', min: 0, max: 1e9, llr: 89.745, off: 0.2, win: 30, n: 8851, mode: 90.3, rec: 90.1, thin: false },
    { key: 'm', label: '10억~50억', min: 1e9, max: 5e9, llr: 88.745, off: 0.3, win: 30, n: 322, mode: 89.3, rec: 89, thin: false },
    { key: 'l', label: '50억~100억', min: 5e9, max: 1e10, llr: 87.495, off: 0.55, win: 90, n: 60, mode: 88.7, rec: 88.2, thin: true },
    { key: 'xl', label: '100억 이상', min: 1e10, max: null, llr: null, off: null, win: 90, n: 0, mode: null, rec: null, thin: true }],
  sjq: { p10: 98.934, p25: 99.379, p50: 99.886, p75: 100.377, p90: 100.796, p95: 101.036, p98: 101.303 } }
const 지금 = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 16).replace('T', ' ')
const 헬스 = { at: 지금, ok: true, why: '', fails: 0, got: { first: 266, live: 815 }, note: '', maint: false, hint: '', lastok: 지금, newest: { first: 오늘, live: 오늘 }, n: { first: 18396, live: 21143 }, gaps: { first: [], live: [] } }
const b = await chromium.launch()
const UA폰 = 'Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'

async function 새쪽(w, h, 폰 = true) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', isMobile: 폰, hasTouch: 폰, ...(폰 ? { userAgent: UA폰 } : {}) })
  await ctx.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|googlesyndication|geojs/, (r) => r.fulfill({ status: 200, body: '' }))
  await ctx.route(/firebaseio\.com|firebasedatabase\.app|identitytoolkit|securetoken/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await ctx.route('**/data/board/live.json*', (r) => r.fulfill({ json: meta }))
  await ctx.route('**/data/board/live-con-0.json*', (r) => r.fulfill({ json: 줄들 }))
  await ctx.route('**/data/ext/meta.json*', (r) => r.fulfill({ json: { n: 0, first: 0 } }))
  await ctx.route('**/data/pre/idx.json*', (r) => r.fulfill({ json: { all: [0, 0], n: {} } }))
  await ctx.route('**/data/health.json*', (r) => r.fulfill({ json: 헬스 }))
  await ctx.route(/\/data\/bidindex\.json/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 색인 }))
  await ctx.route(/\/data\/aparts\.json/, (r) => r.fulfill({ json: 내역 }))
  await ctx.route(/\/data\/overview\.json/, (r) => r.fulfill({ json: 개요 }))
  await ctx.route(/\/data\/(sim|basket|bidresult|first|agency)[^/]*\.json/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await ctx.addInitScript(() => { try { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); sessionStorage.setItem('kcm_notice_seen', '2026-10-업체'); sessionStorage.setItem('kcm_visit_s', '1') } catch (e) { /* 없음 */ } })
  const p = await ctx.newPage()
  const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
  return { ctx, p, 오류 }
}
const 넘침 = (p) => p.evaluate(() => document.documentElement.scrollWidth - innerWidth)
const 쉬어 = (ms) => new Promise((r) => setTimeout(r, ms))
const 하한 = (A, sj = 100) => Math.ceil((22522764000 * sj / 100 - A) * 81.995 / 100 + A)
const 금액수 = (t) => Number(String(t || '').replace(/[^0-9]/g, '')) || 0

for (const [이름, w, h, 폰] of [['폰 390', 390, 844, true], ['PC 1280', 1280, 900, false]]) {
  console.log(`■ ${이름}`)
  const { ctx, p, 오류 } = await 새쪽(w, h, 폰)
  /* ① 공고 목록 */
  await p.goto(BASE + '/live', { waitUntil: 'domcontentloaded' })
  await p.waitForFunction(() => document.querySelectorAll('.notice').length >= 3, null, { timeout: 20000 })
  const 카드 = await p.evaluate((이름들) => 이름들.map((nm) => {
    const c = [...document.querySelectorAll('.notice')].find((x) => (x.querySelector('h3') || {}).innerText === nm)
    if (!c) return null
    return { 알약: !!c.querySelector('.gocalc'), 금액: (c.querySelector('.oneclick .oc-amt') || {}).innerText || '', 덧: (c.querySelector('.oneclick .oc-sub') || {}).innerText || '' }
  }), [가.name, 나.name, 다.name])
  ok('① 가(100억 · 표준 모름) — «💰 바로투찰» 알약 · 권장 금액 없음', 카드[0] && !카드[0].알약 && !카드[0].금액, 카드[0])
  ok('① 나(100억 · 표준 받음) — 알약 · 권장 금액 있음', 카드[1] && 카드[1].알약 && 금액수(카드[1].금액) > 0, 카드[1])
  ok('① 나 — 권장 금액이 나라장터 A 로 낸 하한(사정률 100%) 위', 금액수(카드[1] && 카드[1].금액) >= 하한(4198886031), [카드[1] && 카드[1].금액, 하한(4198886031)])
  ok('① 다(2억 · 표준 대상 아님) — 전과 같이 알약 · 권장 금액', 카드[2] && 카드[2].알약 && 금액수(카드[2].금액) > 0, 카드[2])
  await p.evaluate((nm) => { const c = [...document.querySelectorAll('.notice')].find((x) => (x.querySelector('h3') || {}).innerText === nm); c && c.click() }, 가.name)
  await 쉬어(400)
  const 못함 = await p.evaluate(() => (document.querySelector('.nocalc') || {}).innerText || '')
  ok('① 가 펼침 — «바로투찰 계산이 안 됩니다 — «표준시장단가» 이 아직 안 실려 왔습니다»', /바로투찰 계산이 안 됩니다/.test(못함) && /표준시장단가/.test(못함), 못함)
  ok('① 넘침 0', (await 넘침(p)) <= 0, await 넘침(p))
  if (폰) await (await p.$('main')).screenshot({ path: '/tmp/g10/g578/out/폰_공고목록.png' })

  /* ② 공고 한 장 */
  await p.goto(BASE + '/notice/' + 가.no, { waitUntil: 'domcontentloaded' })
  await p.waitForFunction(() => /아직 개찰 전/.test(document.body.innerText), null, { timeout: 20000 })
  const 가쪽 = await p.evaluate(() => document.body.innerText)
  ok('② 가 — «💰 권장 투찰금액» 없음', !/💰 권장 투찰금액/.test(가쪽))
  await p.goto(BASE + '/notice/' + 나.no, { waitUntil: 'domcontentloaded' })
  await p.waitForFunction(() => /아직 개찰 전/.test(document.body.innerText), null, { timeout: 20000 })
  const 나쪽 = await p.evaluate(() => document.body.innerText)
  ok('② 나 — «💰 권장 투찰금액» 있음 · A값 «4,198,886,031원 (표준시장단가 포함)»', /💰 권장 투찰금액/.test(나쪽) && /4,198,886,031원 \(표준시장단가 포함\)/.test(나쪽), (나쪽.match(/A값[^\n]*\n?[^\n]*/) || [''])[0])
  if (!폰) await p.screenshot({ path: '/tmp/g10/g578/out/PC_공고한장_나.png', fullPage: false })

  /* ③ 바로투찰 */
  await p.goto(BASE + '/?no=' + 가.no, { waitUntil: 'domcontentloaded' })
  await p.waitForFunction(() => /이 공고는 아직 계산할 수 없습니다|투찰금액/.test(document.body.innerText), null, { timeout: 20000 })
  await 쉬어(600)
  const 가바로 = await p.evaluate(() => {
    const box = document.querySelector('.nogobox')
    const a = [...document.querySelectorAll('.field')].find((x) => /A값/.test((x.querySelector('label') || {}).innerText || ''))
    return { 막힘: !!box, 글: box ? box.innerText : '', 목록: box ? [...box.querySelectorAll('.needlist span')].map((s) => s.innerText) : [], A칸: a ? (a.querySelector('input') || {}).value : null, 금액: !!document.querySelector('.hero .amt') }
  })
  ok('③ 가 — «⛔ 이 공고는 아직 계산할 수 없습니다» · 빠진 것 «표준시장단가»', 가바로.막힘 && /표준시장단가/.test(가바로.글), 가바로.글.slice(0, 200))
  ok('③ 가 — 확인 목록에 «✕ 표준시장단가(100억 이상)» · A값은 ✓', 가바로.목록.includes('✕ 표준시장단가(100억 이상)') && 가바로.목록.includes('✓ A값'), 가바로.목록)
  ok('③ 가 — 까닭 글(100억~300억 적격심사 · 표준시장단가도 A값처럼)', /100억~300억 적격심사/.test(가바로.글) && /표준시장단가 금액도 A값처럼/.test(가바로.글))
  ok('③ 가 — A값 칸 비움(모자란 A값을 안 채움) · 금액 안 냄', (가바로.A칸 === '' || 가바로.A칸 === null) && !가바로.금액, 가바로)
  if (폰) await (await p.$('.nogobox')).screenshot({ path: '/tmp/g10/g578/out/폰_바로투찰_가.png' })
  await p.goto(BASE + '/?no=' + 나.no, { waitUntil: 'domcontentloaded' })
  await p.waitForFunction((nm) => document.body.innerText.includes(nm), 나.name, { timeout: 20000 })
  await 쉬어(600)
  const 나바로 = await p.evaluate(() => ({ 막힘: !!document.querySelector('.nogobox'), 글: document.body.innerText }))
  /* 100억 넘는 공고는 바로투찰 화면이 전부터 «종합심사 — 계산기 안 됨» 으로 막습니다(G578 은 손대지 않음 · 📌 기술형 적격심사로 바꿀지 따로).
     여기서는 «표준시장단가» 로 막히지 않고 · 자동으로 가져온 A값이 나라장터 A(42억)인지만 봅니다. */
  ok('③ 나 — «표준시장단가» 로 막히지 않음 · 자동으로 가져온 A값 «42억»(나라장터 A)', !나바로.막힘 && /A값 42억/.test(나바로.글), (나바로.글.match(/기초 [^\n]*A값[^\n]*/) || [''])[0])
  ok('④ 넘침 0', (await 넘침(p)) <= 0, await 넘침(p))
  /* ⑤ 분석실(바로투찰을 품음) — 가를 골라도 화면이 넘어지지 않고 금액을 안 냄 */
  await p.goto(BASE + '/bunseok?no=' + 가.no, { waitUntil: 'domcontentloaded' })
  await p.waitForFunction(() => /이 공고는 아직 계산할 수 없습니다/.test(document.body.innerText), null, { timeout: 20000 }).catch(() => {})
  await 쉬어(800)
  const 분석 = await p.evaluate(() => ({ 막힘: /이 공고는 아직 계산할 수 없습니다/.test(document.body.innerText), 금액: !!document.querySelector('.bsr-right .hero .amt') }))
  ok('⑤ 분석실 — 가는 «아직 계산할 수 없습니다» · 금액 없음', 분석.막힘 && !분석.금액, 분석)
  ok('④ 오류 0', 오류.length === 0, 오류)
  await ctx.close()
}
await b.close()
console.log(`\n${n}개 중 틀림 ${bad}`)
process.exit(bad ? 1 : 0)
