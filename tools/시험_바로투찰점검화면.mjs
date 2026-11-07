/**
 * ⚖ G579 바로투찰 이용자 점검 화면 시험 — 구운 사이트(dist)를 띄운 뒤:
 *   node tools/시험_바로투찰점검화면.mjs [주소=http://127.0.0.1:4578]
 *   소장님 「사이트에서 다시 이용자 입장에서 하나 하나 해봐. 고칠 것 고쳐야 해」(11-07) — 이용자처럼 해 보다 찾은 것:
 *   가(100억~300억 적격심사 · 하한율 공고값 · smk Y) — 바로투찰이 «종합심사 — 계산기 안 됨» 으로 막던 것 → 금액이 나옴(공고 목록 · 공고 한 장과 같음)
 *   나(300억 넘는 종합심사 · 하한율 없음) — 전처럼 «계산기를 쓰면 안 됩니다»
 *   다(취소공고 · 기초 · A값 이어져 옴) — 전엔 «💰 권장 투찰금액» 이 나옴 → «취소된 공고» · 금액 없음(바로투찰 · 공고 목록 · 공고 한 장)
 *   라(A값 0원 · az 1) — 전엔 «A값이 아직 안 실려 왔습니다» → 0원으로 계산 · «A값 0원»
 *   마(A값 모름 · az 0) — 전처럼 막힘 · 요약의 추정 A값에 «(추정)»(전엔 «공고에서 자동으로 가져왔습니다 · A값 77만» 처럼 보임)
 *   폰 390 · PC 1280 넘침 0 · 오류 0. 가상 자료만 씀 · 인터넷 안 부름.
 */
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const BASE = process.argv[2] || 'http://127.0.0.1:4578'

let bad = 0, n = 0
const ok = (이름, c, got) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (c || got === undefined ? '' : ' = ' + JSON.stringify(got).slice(0, 300))) }
const 날 = (d) => new Date(Date.now() + d * 86400e3 + 9 * 3600e3).toISOString().slice(0, 10)
const 오늘 = 날(0)
const 공통 = { ord: '000', inst: '가상시', dt: 오늘 + ' 09:00:00', close: 날(3) + ' 10:00:00', lo: -3, hi: 3, ptot: 15, pdrw: 4, ayn: 'Y', lic: ['토목공사업/0001'], sido: '경기', mthd: '일반경쟁', kind: '등록공고', tg: 64 }
const 가 = { ...공통, no: 'R00TEST57901', name: '가상 학교 개축공사(기술형 적격)', base: 22522764000, est: 20226550000, llr: 81.995, aval: 4198886031, smk: 'Y',
  swin: '적격심사제-추정가격이 300억원미만 100억원이상인 입찰공사(실적제한 아님, 종합공사)' }
const 나 = { ...공통, no: 'R00TEST57902', name: '가상 터널 신설공사(종합심사)', base: 38500000000, est: 35000000000, llr: null, aval: 2100000000, smk: 'N', swin: '종합심사낙찰제' }
const 다 = { ...공통, no: 'R00TEST57903', ord: '001', name: '가상 마을회관 보수공사(취소)', base: 1100000000, est: 1000000000, llr: 87.745, aval: 62460000, kind: '취소공고', tg: 4 }
const 라 = { ...공통, no: 'R00TEST57904', name: '가상 석면 해체공사(A 0원)', base: 15608000, est: 14189091, llr: 87.745, aval: 0, az: 1, smk: 'N' }
const 마 = { ...공통, no: 'R00TEST57905', name: '가상 배수로 정비공사(A 모름)', base: 15608000, est: 14189091, llr: 87.745, aval: 0, az: 0 }
const 줄들 = [가, 나, 다, 라, 마]
const meta = { built: 오늘 + ' 06:00', chunk: 500, rankChunk: 50, con: { n: 5, parts: 1, from: '2026-09-15', to: 오늘 }, serv: { n: 0, parts: 0 } }
const f = ['no', 'name', 'inst', 'base', 'budget', 'close', 'lo', 'hi', 'llr', 'est', 'lic', 'aval', 'gmtrl', 'ayn', 'ptot', 'pdrw', 'url', 'site', 'rgnb', 'joint', 'mthd', 'swin', 'rebid', 'enp', 'enpn', 'dt', 'sido', 'dsn', 'enpb', 'jnt', 'tg', 'nt', 'licg', 'rgs', 'az', 'smk', 'pc']
const 색인 = JSON.stringify({ built: 오늘 + ' 06:00', f, pick: {}, r: 줄들.map((g) => f.map((k) => (g[k] === undefined ? (k === 'smk' ? '' : k === 'az' ? 0 : null) : g[k]))) })
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
  await ctx.route(/\/data\/aparts\.json/, (r) => r.fulfill({ json: { a: { [가.no]: [['산업안전보건관리비', 700000000], ['국민연금보험료', 680201371], ['표준시장단가', 2818684660]] } } }))
  await ctx.route(/\/data\/overview\.json/, (r) => r.fulfill({ json: 개요 }))
  await ctx.route(/\/data\/(sim|basket|bidresult|first|agency|bstat)[^/]*\.json/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await ctx.addInitScript(() => { try { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); sessionStorage.setItem('kcm_notice_seen', '2026-10-업체'); sessionStorage.setItem('kcm_visit_s', '1') } catch (e) { /* 없음 */ } })
  const p = await ctx.newPage()
  const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
  return { ctx, p, 오류 }
}
const 넘침 = (p) => p.evaluate(() => document.documentElement.scrollWidth - innerWidth)
const 쉬어 = (ms) => new Promise((r) => setTimeout(r, ms))
const 금액수 = (t) => Number(String(t || '').replace(/[^0-9]/g, '')) || 0
const 바로 = async (p, g) => {
  await p.goto(BASE + '/?no=' + g.no, { waitUntil: 'domcontentloaded' })
  await p.waitForFunction((nm) => document.body.innerText.includes(nm), g.name, { timeout: 20000 })
  await 쉬어(900)
  return p.evaluate(() => {
    const t = document.body.innerText
    const 요약 = (document.querySelector('button .v') || {}).innerText || ''
    return { 글: t, 금액: (document.querySelector('.hero .amt') || {}).innerText || '', 막힘: (document.querySelector('.nogobox .h') || {}).innerText || '',
      종심: /계산기를 쓰면 안 됩니다/.test(t), 종심띠: /종합심사 대상입니다/.test(t), 요약 }
  })
}

for (const [이름, w, h, 폰] of [['폰 390', 390, 844, true], ['PC 1280', 1280, 900, false]]) {
  console.log(`■ ${이름}`)
  const { ctx, p, 오류 } = await 새쪽(w, h, 폰)
  /* 바로투찰 */
  const 가바로 = await 바로(p, 가)
  const 하한 = Math.ceil((가.base - 가.aval) * 가.llr / 100 + 가.aval)
  ok('가(100억~300억 적격심사) — «계산기를 쓰면 안 됩니다» · «종합심사 대상» 띠 없음 · 금액 나옴', !가바로.종심 && !가바로.종심띠 && 금액수(가바로.금액) > 0, { 종심: 가바로.종심, 띠: 가바로.종심띠, 금액: 가바로.금액 })
  ok('가 — 권장 금액이 나라장터 A 로 낸 하한(사정률 100%) 위', 금액수(가바로.금액) >= 하한, [가바로.금액, 하한])
  await p.click('button.whytoggle')
  await 쉬어(400)
  ok('가 — 근거 보기 «공사 규모» 줄에 «100억 이상 · 적격심사(하한율 공고값)»(«종합심사» 아님)', await p.evaluate(() => /100억 이상 · 적격심사\(하한율 공고값\)/.test(document.body.innerText) && !/100억 이상 · 종합심사/.test(document.body.innerText)))
  if (폰) await (await p.$('.hero')).screenshot({ path: '/tmp/g10/g578/out/폰_바로투찰_100억적격.png' })
  const 나바로 = await 바로(p, 나)
  ok('나(300억 종합심사 · 하한율 없음) — «종합심사 대상» 띠 · «계산기를 쓰면 안 됩니다» · 금액 없음 · «아직 안 실려 왔습니다» 없음', 나바로.종심띠 && 나바로.종심 && !금액수(나바로.금액) && !나바로.막힘, { 띠: 나바로.종심띠, 종심: 나바로.종심, 금액: 나바로.금액, 막힘: 나바로.막힘 })
  const 다바로 = await 바로(p, 다)
  ok('다(취소공고) — «⛔ 나라장터에서 취소된 공고입니다» · 금액 없음', /취소된 공고입니다/.test(다바로.막힘) && !금액수(다바로.금액) && !/아직 계산할 수 없습니다/.test(다바로.글), 다바로.막힘)
  ok('다 — 요약에 추정 A값을 안 넣음(취소)', !/A값\(추정\)/.test(다바로.요약), 다바로.요약)
  if (폰) await (await p.$('.nogobox')).screenshot({ path: '/tmp/g10/g578/out/폰_바로투찰_취소.png' })
  const 라바로 = await 바로(p, 라)
  ok('라(A값 0원 · az 1) — 막힘 없음 · 금액 나옴 · 요약 «A값 0원»', !라바로.막힘 && 금액수(라바로.금액) > 0 && /A값 0원/.test(라바로.요약), { 막힘: 라바로.막힘, 금액: 라바로.금액, 요약: 라바로.요약 })
  const 마바로 = await 바로(p, 마)
  ok('마(A값 모름 · az 0) — 전처럼 «아직 계산할 수 없습니다» · ✕ A값', /아직 계산할 수 없습니다/.test(마바로.막힘) && /✕ A값/.test(마바로.글), 마바로.막힘)
  ok('마 — 요약의 추정 A값에 «(추정)»(공고에서 가져온 값처럼 안 보이게)', !/· A값 \d/.test(마바로.요약) && (/A값\(추정\)/.test(마바로.요약) || !/A값/.test(마바로.요약)), 마바로.요약)
  /* 공고 목록 */
  await p.goto(BASE + '/live', { waitUntil: 'domcontentloaded' })
  await p.waitForFunction(() => document.querySelectorAll('.notice').length >= 5, null, { timeout: 20000 })
  const 카드 = await p.evaluate((이름들) => 이름들.map((nm) => {
    const c = [...document.querySelectorAll('.notice')].find((x) => (x.querySelector('h3') || {}).innerText === nm)
    if (!c) return null
    return { 알약: !!c.querySelector('.gocalc'), 금액: (c.querySelector('.oneclick .oc-amt') || {}).innerText || '', 한마디: (c.querySelector('.claudesay span') || {}).innerText || '' }
  }), [가.name, 다.name, 라.name, 마.name])
  ok('공고 목록 가 — 알약 · 권장 금액(바로투찰 화면과 같은 길)', 카드[0] && 카드[0].알약 && 금액수(카드[0].금액) > 0, 카드[0])
  ok('공고 목록 다(취소) — 알약 · 권장 금액 없음 · 한마디 «취소된 공고»', 카드[1] && !카드[1].알약 && !카드[1].금액 && /취소된 공고/.test(카드[1].한마디), 카드[1])
  ok('공고 목록 라(A값 0원) — 알약 · 권장 금액', 카드[2] && 카드[2].알약 && 금액수(카드[2].금액) > 0, 카드[2])
  ok('공고 목록 마(A값 모름) — 알약 · 금액 없음(전과 같음)', 카드[3] && !카드[3].알약 && !카드[3].금액, 카드[3])
  await p.evaluate((nm) => { const c = [...document.querySelectorAll('.notice')].find((x) => (x.querySelector('h3') || {}).innerText === nm); c && c.click() }, 다.name)
  await 쉬어(400)
  const 못함 = await p.evaluate(() => (document.querySelector('.nocalc') || {}).innerText || '')
  ok('공고 목록 다 펼침 — «취소된 공고(취소공고)라 투찰 계산은 하지 않습니다»', /취소된 공고/.test(못함) && !/아직 안 실려/.test(못함), 못함)
  ok('공고 목록 넘침 0', (await 넘침(p)) <= 0, await 넘침(p))
  /* 공고 한 장 */
  await p.goto(BASE + '/notice/' + 다.no, { waitUntil: 'domcontentloaded' })
  await p.waitForFunction(() => /취소된 공고입니다|아직 개찰 전/.test(document.body.innerText), null, { timeout: 20000 })
  const 다쪽 = await p.evaluate(() => document.body.innerText)
  ok('공고 한 장 다(취소) — «⛔ 나라장터에서 취소된 공고입니다» · 권장 금액 없음 · «아직 개찰 전» 없음', /나라장터에서 취소된 공고입니다/.test(다쪽) && !/💰 권장 투찰금액/.test(다쪽) && !/아직 개찰 전입니다/.test(다쪽))
  await p.goto(BASE + '/notice/' + 라.no, { waitUntil: 'domcontentloaded' })
  await p.waitForFunction(() => /아직 개찰 전/.test(document.body.innerText), null, { timeout: 20000 })
  const 라쪽 = await p.evaluate(() => document.body.innerText)
  ok('공고 한 장 라(A값 0원) — 권장 금액 · A값 «0원 (나라장터 A 0원)»', /💰 권장 투찰금액/.test(라쪽) && /0원 \(나라장터 A 0원\)/.test(라쪽))
  await p.goto(BASE + '/notice/' + 가.no, { waitUntil: 'domcontentloaded' })
  await p.waitForFunction(() => /아직 개찰 전/.test(document.body.innerText), null, { timeout: 20000 })
  await 쉬어(1500)   /* 전국 사정률(overview)이 온 뒤의 금액 — 오기 전엔 잠깐 기본값(99.896)으로 셈 */
  const 가쪽 = await p.evaluate(() => document.body.innerText)
  const 가쪽금액 = 금액수((가쪽.match(/💰 권장 투찰금액\s*\n\s*([\d,]+)원/) || [])[1])
  ok('공고 한 장 가 금액 = 바로투찰 화면 금액(같은 공고 · 같은 숫자)', 가쪽금액 > 0 && 가쪽금액 === 금액수(가바로.금액), [가쪽금액, 가바로.금액])
  ok('넘침 0 · 오류 0', (await 넘침(p)) <= 0 && 오류.length === 0, 오류)
  await ctx.close()
}
await b.close()
console.log(`\n${n}개 중 틀림 ${bad}`)
process.exit(bad ? 1 : 0)
