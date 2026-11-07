/**
 * ⚖ G581 마감된 공고 채점 · 용역 셈 — 화면 시험. 구운 사이트(dist)를 띄운 뒤:
 *   node tools/시험_마감채점화면.mjs [주소=http://127.0.0.1:4578]
 *   소장님 「나머지도 고쳐 줘」(11-07) — G578 · G579 뒤 남은 것:
 *   가(마감 · 100억 넘는 적격심사 · 표준시장단가 칸 없음) — 1순위 «📊 채점 가능» → 옛 A값(표준시장단가 빠짐)으로 채점하던 것
 *       → «채점 불가 · 값 부족(표준시장단가)» · 바로투찰 «채점하지 않습니다 · 표준시장단가»
 *   나(마감 · 100억 넘고 하한율 없음 — 종합심사) — «📊 채점 가능» 인데 채점하면 «0 > 0 · 밀렸을 자리» 빈 카드
 *       → «채점 안 함 · 100억 이상» · 바로투찰 «채점하지 않습니다 · 하한율 없음»
 *   다(마감 · A값 0원 az 1) — «채점 불가 · A값» 이던 것 → «📊 채점 가능» · 채점이 A값을 규모로 지어 넣지 않음(A 0)
 *   라(마감 · 100억 넘는 적격심사 · smk Y · 7일 넘음 — 주소로 채점) — 채점 단추 주소에 하한율 · 추정가격 · smk → 채점 됨
 *   마(보통 개찰) — 전과 같음 · 사(용역 계산 az=1) — A값 «0원 (나라장터 A 0원)»
 *   폰 390 · PC 1280 넘침 0 · 오류 0. 가상 자료만 씀(공사 · 기관 · 업체 이름 지어냄) · 인터넷 안 부름.
 */
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const BASE = process.argv[2] || 'http://127.0.0.1:4578'

let bad = 0, n = 0
const ok = (이름, c, got) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (c || got === undefined ? '' : ' = ' + JSON.stringify(got).slice(0, 300))) }
const 오늘 = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10)
const 날 = (d) => new Date(Date.now() + d * 86400e3 + 9 * 3600e3).toISOString().slice(0, 10)
const 순위 = (k, base) => Array.from({ length: k }, (_, i) => [`가상건설${i + 1}(주)`, Math.round(base * (0.8995 + i * 0.0007)), null])
const 줄 = (no, o = {}) => ({ no, ord: '000', name: '가상 공고', inst: '가상군', dt: 오늘 + ' 11:00:00', amt: 523456000, rate: 89.912, np: 37, nrank: 37,
  base: 583000000, est: 530000000, sAmt: 0, lo: -3, hi: 3, ptot: 15, pdrw: 4, llr: 89.745, aval: 21000000, ayn: 'Y', win: '가상건설1(주)', bno: '1238112345', ...o })
const 가 = 줄('R26BK09981001', { name: '가상 학교 개축공사(적격 · 표준 모름)', amt: 19350000000, rate: 86.038, base: 22500000000, est: 20200000000, llr: 81.995, aval: 1380000000, np: 41, nrank: 41 })
const 나 = 줄('R26BK09981002', { name: '가상 터널 신설공사(종합심사)', amt: 33215000000, rate: 86.5, base: 38500000000, est: 35000000000, llr: null, aval: 2100000000, np: 9, nrank: 9 })
const 다 = 줄('R26BK09981003', { name: '가상 석면 해체공사(A 0원)', amt: 14200000, rate: 90.512, base: 15608000, est: 14189091, llr: 87.745, aval: 0, az: 1, np: 12, nrank: 12 })
const 라 = 줄('R26BK09981004', { name: '가상 청사 신축공사(적격 · 표준 앎)', dt: 날(-9) + ' 11:00:00', amt: 19350000000, rate: 86.038, base: 22500000000, est: 20200000000, llr: 81.995, aval: 4200000000, smk: 'Y', np: 41, nrank: 41 })
const 마 = 줄('R26BK09981005', { name: '가상 마을길 포장공사(보통)', corps: 순위(6, 583000000), np: 6, nrank: 6 })
const 바 = { ...다, no: 'R26BK09981008', name: '가상 석면 해체공사(A값 미적용 N)', ayn: 'N', az: 0 }   /* 다 와 같은 공고 꼴 · A값 미적용 — 채점 금액이 같아야 함 */
const 줄들 = [가, 나, 다, 라, 마]
const meta = { built: 오늘 + ' 06:00', chunk: 500, rankChunk: 50, con: { n: 줄들.length, parts: 1, from: '2026-09-15', to: 오늘 }, serv: { n: 0, parts: 0 } }
const ov = { rows: 168842, agencies: 5066, corps: 72494, hot: { win: 30, n: 8651, mode: 90.3, rec: 90.1 },
  bands: [{ key: 's', label: '10억 미만', min: 0, max: 1e9, llr: 89.745, off: 0.2, win: 30, n: 8851, mode: 90.3, rec: 90.1, thin: false },
    { key: 'm', label: '10억~50억', min: 1e9, max: 5e9, llr: 88.745, off: 0.3, win: 30, n: 322, mode: 89.3, rec: 89, thin: false },
    { key: 'l', label: '50억~100억', min: 5e9, max: 1e10, llr: 87.495, off: 0.55, win: 90, n: 60, mode: 88.7, rec: 88.2, thin: true },
    { key: 'xl', label: '100억 이상', min: 1e10, max: null, llr: null, off: null, win: 90, n: 0, mode: null, rec: null, thin: true }],
  sjq: { p10: 98.934, p25: 99.379, p50: 99.886, p75: 100.377, p90: 100.796, p95: 101.036, p98: 101.303 } }
/* bidresult(최근 7일 개찰) — 라(9일 전)는 안 실음 → 주소로 채점 */
const RF = ['win', 'amt', 'rate', 'np', 'base', 'dt', 'tel', 'ceo', 'bno', 'adr', 'tsrc', 'name', 'inst', 'aval', 'ayn', 'amts', 'rq', 'nrank', 'lo', 'hi', 'lic',
  'llr', 'est', 'enp', 'enpn', 'enpb', 'pc', 'az', 'smk']
const 결과 = { built: 오늘 + ' 06:00', f: RF, r: Object.fromEntries([가, 나, 다, 마, 바].map((g) => [g.no, RF.map((k) => (k === 'amts' || k === 'rq' || k === 'lic' ? [] : k === 'az' ? (g.az === 1 ? 1 : 0) : k === 'smk' ? (g.smk || '') : g[k] ?? (k === 'tsrc' || k === 'enp' || k === 'enpn' || k === 'pc' ? 0 : '')))])) }
const 지금 = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 16).replace('T', ' ')
const 헬스 = { at: 지금, ok: true, why: '', fails: 0, got: { first: 266, live: 815 }, note: '', maint: false, hint: '', lastok: 지금, newest: { first: 오늘, live: 오늘 }, n: { first: 18396, live: 21143 }, gaps: { first: [], live: [] } }
const b = await chromium.launch()
const UA폰 = 'Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'
async function 새쪽(w, h, 폰 = true) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', isMobile: 폰, hasTouch: 폰, ...(폰 ? { userAgent: UA폰 } : {}) })
  await ctx.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|googlesyndication|geojs/, (r) => r.fulfill({ status: 200, body: '' }))
  await ctx.route(/firebaseio\.com|firebasedatabase\.app|identitytoolkit|securetoken/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await ctx.route('**/data/board/first.json*', (r) => r.fulfill({ json: meta }))
  await ctx.route('**/data/board/first-con-0.json*', (r) => r.fulfill({ json: 줄들 }))
  await ctx.route('**/data/board/live.json*', (r) => r.fulfill({ json: { ...meta, con: { n: 0, parts: 0 } } }))
  await ctx.route('**/data/ext/meta.json*', (r) => r.fulfill({ json: { n: 0, first: 0 } }))
  await ctx.route('**/data/pre/idx.json*', (r) => r.fulfill({ json: { all: [0, 0], n: {} } }))
  await ctx.route('**/data/health.json*', (r) => r.fulfill({ json: 헬스 }))
  await ctx.route(/\/data\/overview\.json/, (r) => r.fulfill({ json: ov }))
  await ctx.route(/\/data\/bidresult\.json/, (r) => r.fulfill({ json: 결과 }))
  await ctx.route(/\/data\/bidindex\.json/, (r) => r.fulfill({ json: { built: 오늘, f: ['no'], pick: {}, r: [] } }))
  await ctx.route(/\/data\/(sim|basket|agency|bstat|aparts|kb|kan|kw|board\/svc|board\/goods)[^?]*\.json/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await ctx.addInitScript(() => { try { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); sessionStorage.setItem('kcm_notice_seen', '2026-10-업체'); sessionStorage.setItem('kcm_visit_s', '1') } catch (e) { /* 없음 */ } })
  const p = await ctx.newPage()
  const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
  return { ctx, p, 오류 }
}
const 넘침 = (p) => p.evaluate(() => document.documentElement.scrollWidth - innerWidth)
const 쉬어 = (ms) => new Promise((r) => setTimeout(r, ms))
const 카드읽기 = (p, nm) => p.evaluate((nm) => {
  const c = [...document.querySelectorAll('main .notice.tap')].find((x) => x.innerText.includes(nm))
  if (!c) return null
  const 딱지 = [...c.querySelectorAll('.badge')].map((x) => ({ t: x.innerText.trim(), title: x.getAttribute('title') || '' })).filter((x) => /채점/.test(x.t))
  return 딱지[0] || { t: '', title: '' }
}, nm)
const 펼침 = async (p, nm) => {
  const 카드 = p.locator('main .notice.tap', { hasText: nm })
  await 카드.scrollIntoViewIfNeeded()
  await 카드.locator('h3').click()
  await 쉬어(700)
  return p.evaluate(() => {
    const o = document.querySelector('main .notice.open')
    if (!o) return { 글: '', 주소: '' }
    const a = [...o.querySelectorAll('a')].find((x) => /채점하기/.test(x.innerText))
    return { 글: (o.querySelector('.nocalc') || {}).innerText || '', 주소: a ? a.getAttribute('href') : '' }
  })
}
const 채점 = async (p, url) => {
  await p.goto(BASE + url, { waitUntil: 'domcontentloaded' })
  await p.waitForFunction(() => document.querySelector('.scored'), null, { timeout: 20000 })
  await 쉬어(900)
  return p.evaluate(() => {
    const s = document.querySelector('.scored')
    const 칸 = [...s.querySelectorAll('.srow .s1')].find((x) => /바로투찰이 냈을 금액/.test(x.innerText))
    return { 머리: (s.querySelector('.sh') || {}).innerText || '', 글: s.innerText, 띠: (document.querySelector('.todaybar.verify') || {}).innerText || '',
      금액: 칸 ? Number(((칸.querySelector('.nm') || {}).innerText || '').replace(/[^0-9]/g, '')) || 0 : 0 }
  })
}

for (const [이름, w, h, 폰] of [['폰 390', 390, 844, true], ['PC 1280', 1280, 900, false]]) {
  console.log(`■ ${이름}`)
  const { ctx, p, 오류 } = await 새쪽(w, h, 폰)
  await p.goto(BASE + '/first', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('main .notice.tap', { timeout: 20000 })
  await 쉬어(800)
  const k가 = await 카드읽기(p, 가.name), k나 = await 카드읽기(p, 나.name), k다 = await 카드읽기(p, 다.name), k라 = await 카드읽기(p, 라.name), k마 = await 카드읽기(p, 마.name)
  ok('가(100억 적격 · 표준 모름) 1순위 딱지 — «채점 불가 · 값 부족» · 까닭에 «표준시장단가»(전엔 «📊 채점 가능»)', k가 && /채점 불가/.test(k가.t) && /표준시장단가/.test(k가.title), k가)
  ok('나(100억 · 하한율 없음) — «채점 안 함 · 100억 이상»(전엔 «📊 채점 가능»)', k나 && /채점 안 함 · 100억 이상/.test(k나.t), k나)
  ok('다(A값 0원) — «📊 채점 가능»(전엔 «채점 불가 · 값 부족 · A값»)', k다 && /채점 가능/.test(k다.t), k다)
  ok('라(100억 적격 · smk Y) · 마(보통) — «📊 채점 가능»', k라 && /채점 가능/.test(k라.t) && k마 && /채점 가능/.test(k마.t), [k라, k마])
  const e가 = await 펼침(p, 가.name)
  ok('가 펼침 — 채점 단추 없음 · «… «표준시장단가» 이 안 실려 왔습니다»', !e가.주소 && /표준시장단가/.test(e가.글), e가)
  await p.locator('main .notice.open h3').click(); await 쉬어(300)
  const e나 = await 펼침(p, 나.name)
  ok('나 펼침 — 채점 단추 없음 · «100억 이상인데 공고에 낙찰하한율이 없습니다 … 채점하지 않습니다»', !e나.주소 && /100억 이상/.test(e나.글) && /낙찰하한율이 없습니다/.test(e나.글) && /채점하지 않습니다/.test(e나.글), e나)
  await p.locator('main .notice.open h3').click(); await 쉬어(300)
  const e다 = await 펼침(p, 다.name)
  ok('다 펼침 — 채점 단추 주소에 az=1', /[?&]az=1(&|$)/.test(e다.주소), e다.주소)
  await p.locator('main .notice.open h3').click(); await 쉬어(300)
  const e라 = await 펼침(p, 라.name)
  ok('라 펼침 — 채점 단추 주소에 하한율 · 추정가격 · smk=Y(7일 넘은 개찰도 공고 값 그대로)', /[?&]llr=81\.995/.test(e라.주소) && /[?&]est=20200000000/.test(e라.주소) && /[?&]smk=Y/.test(e라.주소), e라.주소)
  ok('1순위 넘침 0', (await 넘침(p)) <= 0, await 넘침(p))

  /* 바로투찰 채점 */
  const s가 = await 채점(p, '/?no=' + 가.no)
  ok('가 바로투찰(개찰 자료) — «채점하지 않습니다» · 까닭 «표준시장단가» · «0 > 0» · «밀렸을 자리» 없음', /채점하지 않습니다/.test(s가.머리) && /표준시장단가/.test(s가.글) && !/밀렸을 자리/.test(s가.글) && !/\b0\s*>\s*0\b/.test(s가.글) && !s가.띠, s가.글.slice(0, 200))
  const s나 = await 채점(p, '/?no=' + 나.no)
  ok('나 바로투찰 — «채점하지 않습니다» · «낙찰하한율이 없습니다»(전엔 «밀렸을 자리 · 0 > 0» 빈 카드)', /채점하지 않습니다/.test(s나.머리) && /낙찰하한율이 없습니다/.test(s나.글) && !/밀렸을 자리/.test(s나.글), s나.글.slice(0, 200))
  const s다 = await 채점(p, e다.주소 || ('/?no=' + 다.no))
  const s바 = await 채점(p, '/?no=' + 바.no)
  ok('다 바로투찰 — 채점 됨(판정 띠) · «바로투찰이 냈을 금액» = A값 미적용(N) 같은 공고 금액(A 0 을 앎 — 전엔 규모 비율로 A값을 지어 넣고 95분위)',
    /실격|1순위|밀림/.test(s다.띠) && s다.금액 > 0 && s다.금액 === s바.금액, [s다.띠.slice(0, 60), s다.금액, s바.금액])
  const s라 = await 채점(p, e라.주소)
  ok('라 바로투찰(주소로 · 7일 넘음) — 채점 됨 · 하한은 공고 하한율 81.995%(규모 추정 아님)', /실격|1순위|밀림/.test(s라.띠) && !/채점하지 않습니다/.test(s라.머리), [s라.머리.slice(0, 60), s라.띠.slice(0, 80)])
  ok('바로투찰 넘침 0', (await 넘침(p)) <= 0, await 넘침(p))
  if (폰) await (await p.$('.scored')).screenshot({ path: '/tmp/g10/g581/out/폰_채점_라.png' })

  /* 사 — 용역 계산 */
  await p.goto(BASE + '/svc/calc?no=R26BK09981006&ord=000&n=' + encodeURIComponent('가상 청사 시설관리 용역') + '&i=' + encodeURIComponent('가상시') + '&b=52800000&l=87.745&lo=-2&hi=2&a=0&ay=Y&az=1&pt=15&pd=4&c=' + encodeURIComponent(날(3) + ' 10:00:00') + '&pm=' + encodeURIComponent('복수예가') + '&sw=' + encodeURIComponent('적격심사제-용역'), { waitUntil: 'domcontentloaded' })
  await p.waitForFunction(() => /셈에 쓴 값/.test(document.body.innerText), null, { timeout: 20000 }).catch(() => {})
  await 쉬어(700)
  const 용 = await p.evaluate(() => { const t = document.body.innerText; const i = t.indexOf('셈에 쓴 값'); return i >= 0 ? t.slice(i, i + 400) : '' })
  ok('사 용역 계산(az=1) — A값 «0원 (나라장터 A 0원)»(전엔 «공고에 없음 → 0 · 95분위로 넉넉히»)', /A값\s*\n?\s*0원 \(나라장터 A 0원\)/.test(용), 용.slice(0, 200))
  await p.goto(BASE + '/svc/calc?no=R26BK09981007&ord=000&n=' + encodeURIComponent('가상 청사 청소 용역') + '&i=' + encodeURIComponent('가상시') + '&b=52800000&l=87.745&lo=-2&hi=2&pt=15&pd=4&c=' + encodeURIComponent(날(3) + ' 10:00:00') + '&pm=' + encodeURIComponent('복수예가') + '&sw=' + encodeURIComponent('적격심사제-용역'), { waitUntil: 'domcontentloaded' })
  await p.waitForFunction(() => /셈에 쓴 값/.test(document.body.innerText), null, { timeout: 20000 }).catch(() => {})
  await 쉬어(700)
  const 용2 = await p.evaluate(() => { const t = document.body.innerText; const i = t.indexOf('셈에 쓴 값'); return i >= 0 ? t.slice(i, i + 400) : '' })
  ok('사 용역 계산(A값 칸 없음 — 지금 용역 공고 모두) — 전처럼 «공고에 없음 → 0 · 95분위로 넉넉히»', /공고에 없음 → 0 · 95분위로 넉넉히/.test(용2), 용2.slice(0, 200))
  ok('넘침 0 · 오류 0', (await 넘침(p)) <= 0 && 오류.length === 0, 오류)
  await ctx.close()
}
await b.close()
console.log(`\n${n}개 중 틀림 ${bad}`)
process.exit(bad ? 1 : 0)
