/**
 * ⚖ G582 난이도계수 — 추정가격 50억 이상 적격심사 낙찰하한율 · 화면 시험. 구운 사이트(dist)를 띄운 뒤:
 *   node tools/시험_난이도하한화면.mjs [주소=http://127.0.0.1:4578]
 *   소장님 「나머지도 고쳐 줘」 뒤 G581 확인 중 찾음 — 공고 목록 하한율(81.995)이 나라장터 «기초금액조회»(83.395)와 달라 실격 금액을 냈음:
 *   가(225억 적격 · 계수 모름 · 수집 llw dc) — 바로투찰 금액 안 냄 · «낙찰하한율이 확정» · 하한율 칸에 83.395 → 금액(참 하한 위) · 50 → 다시 막음
 *   나(225억 · 수집이 계수 0.9 로 83.395 바로잡음) — 금액 · «난이도계수 0.9 반영 · 공고 목록 81.995%» · 참 하한 위 · (G582b) 설명이 «공고에 적힌 값» 이 아님
 *   다(PQ대상 · 0.85 · llw nk) — «셈을 아직 확인하지 못해» · 칸 글에 0.85
 *   라(60억 · 0.9 → 87.995) — 공고 목록 «87.995% (난이도계수 0.9 반영)»
 *   공고 목록 가 펼침 — «난이도계수에 따라 낙찰하한율이 달라집니다» · 바로투찰 링크
 *   1순위 마(마감 · llw dc) — «채점 안 함 · 하한율 확인» · 펼침 글 · 바로투찰 «채점하지 않습니다 · 난이도계수» / 바(바로잡음) — «채점 가능»
 *   폰 390 · PC 1280 넘침 0 · 오류 0. 가상 자료만 씀(공사 · 기관 · 업체 이름 지어냄) · 인터넷 안 부름.
 */
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const BASE = process.argv[2] || 'http://127.0.0.1:4578'

let bad = 0, n = 0
const ok = (이름, c, got) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (c || got === undefined ? '' : ' = ' + JSON.stringify(got).slice(0, 300))) }
const 날 = (d) => new Date(Date.now() + d * 86400e3 + 9 * 3600e3).toISOString().slice(0, 10)
const 오늘 = 날(0)
const S100 = '적격심사제-추정가격이 300억원미만 100억원이상인 입찰공사(실적제한 아님, 종합공사)'
const S100PQ = '적격심사제-추정가격이 300억원미만 100억원이상인 입찰공사 평가기준(PQ대상)'
const S50 = '적격심사제-추정가격이 100억원 미만 50억원 이상인 입찰공사(실적제한 아님, 종합공사)'
const 공통 = { ord: '000', inst: '가상시', dt: 오늘 + ' 09:00:00', close: 날(3) + ' 10:00:00', lo: -3, hi: 3, ptot: 15, pdrw: 4, ayn: 'Y', lic: ['토목공사업/0001'], sido: '경기', mthd: '제한경쟁', kind: '등록공고', tg: 64 }
const 가 = { ...공통, no: 'R26BK09982001', name: '가상 학교 개축공사(계수 모름)', base: 22500000000, est: 20200000000, llr: 81.995, aval: 4200000000, smk: 'Y', swin: S100, llw: 'dc' }
const 나 = { ...공통, no: 'R26BK09982002', name: '가상 청사 신축공사(계수 0.9 반영)', base: 22500000000, est: 20200000000, llr: 83.395, llr0: 81.995, dc: 0.9, aval: 4200000000, smk: 'Y', swin: S100 }
const 다 = { ...공통, no: 'R26BK09982003', name: '가상 하수처리장 증설공사(PQ대상)', base: 26500000000, est: 23800000000, llr: 81.995, dc: 0.85, llw: 'nk', aval: 3400000000, smk: 'Y', swin: S100PQ }
const 라 = { ...공통, no: 'R26BK09982004', name: '가상 체육관 신축공사(60억 · 계수 0.9)', base: 6600000000, est: 6000000000, llr: 87.995, llr0: 87.495, dc: 0.9, aval: 250000000, swin: S50 }
const 줄들 = [가, 나, 다, 라]
const meta = { built: 오늘 + ' 06:00', chunk: 500, rankChunk: 50,
  con: { n: 4, parts: 1, from: '2026-09-15', to: 오늘, lics: [['0001', '토목공사업', 120]] }, serv: { n: 0, parts: 0 } }
const f = ['no', 'name', 'inst', 'base', 'budget', 'close', 'lo', 'hi', 'llr', 'est', 'lic', 'aval', 'gmtrl', 'ayn', 'ptot', 'pdrw', 'url', 'site', 'rgnb', 'joint', 'mthd', 'swin', 'rebid', 'enp', 'enpn', 'dt', 'sido', 'dsn', 'enpb', 'jnt', 'tg', 'nt', 'licg', 'rgs', 'az', 'smk', 'pc', 'dc', 'llr0', 'llw']
const 표 = {}
for (const s of [0, 1, 2, 3]) for (const q of [0, 1, 2, 3]) 표[`s${s}n${q}`] = [120, 5.1]
const 빈칸 = (k) => (k === 'smk' || k === 'dc' || k === 'llr0' || k === 'llw' ? '' : k === 'az' || k === 'pc' ? 0 : null)
const 색인 = JSON.stringify({ built: 오늘 + ' 06:00', f, pick: { tbl: 표, sz: [1e8, 3e8, 1e9], nb: [10, 30, 100] },
  r: 줄들.map((g) => f.map((k) => (g[k] === undefined ? 빈칸(k) : g[k]))) })
/* 1순위(마감) — 마: 계수 모름(llw dc) · 바: 수집이 0.9 로 바로잡음 */
const 순위 = (k, base) => Array.from({ length: k }, (_, i) => [`가상건설${i + 1}(주)`, Math.round(base * (0.865 + i * 0.0007)), null])
const 개찰 = (no, o) => ({ no, ord: '000', name: '가상 공고', inst: '가상군', dt: 오늘 + ' 11:00:00', amt: 19450000000, rate: 86.444, np: 9, nrank: 9,
  base: 22500000000, est: 20200000000, sAmt: 0, lo: -3, hi: 3, ptot: 15, pdrw: 4, llr: 81.995, aval: 4200000000, ayn: 'Y', smk: 'Y', win: '가상건설1(주)', bno: '1238112345', ...o })
const 마 = 개찰('R26BK09982005', { name: '가상 복지관 신축공사(마감 · 계수 모름)', llw: 'dc' })
const 바 = 개찰('R26BK09982006', { name: '가상 도서관 신축공사(마감 · 계수 0.9)', llr: 83.395, llr0: 81.995, dc: 0.9, corps: 순위(6, 22500000000) })
const 개찰들 = [마, 바]
const fmeta = { built: 오늘 + ' 06:00', chunk: 500, rankChunk: 50, con: { n: 2, parts: 1, from: '2026-09-15', to: 오늘 }, serv: { n: 0, parts: 0 } }
const RF = ['win', 'amt', 'rate', 'np', 'base', 'dt', 'tel', 'ceo', 'bno', 'adr', 'tsrc', 'name', 'inst', 'aval', 'ayn', 'amts', 'rq', 'nrank', 'lo', 'hi', 'lic',
  'llr', 'est', 'enp', 'enpn', 'enpb', 'pc', 'az', 'smk', 'dc', 'llr0', 'llw']
const 결과 = { built: 오늘 + ' 06:00', f: RF, r: Object.fromEntries(개찰들.map((g) => [g.no, RF.map((k) => (k === 'amts' || k === 'rq' || k === 'lic' ? []
  : k === 'az' ? 0 : (k === 'smk' || k === 'dc' || k === 'llr0' || k === 'llw') ? (g[k] ?? '') : g[k] ?? (k === 'tsrc' || k === 'enp' || k === 'enpn' || k === 'pc' ? 0 : '')))])) }
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
  await ctx.route('**/data/board/first.json*', (r) => r.fulfill({ json: fmeta }))
  await ctx.route('**/data/board/first-con-0.json*', (r) => r.fulfill({ json: 개찰들 }))
  await ctx.route('**/data/ext/meta.json*', (r) => r.fulfill({ json: { n: 0, first: 0 } }))
  await ctx.route('**/data/pre/idx.json*', (r) => r.fulfill({ json: { all: [0, 0], n: {} } }))
  await ctx.route('**/data/health.json*', (r) => r.fulfill({ json: 헬스 }))
  await ctx.route(/\/data\/bidindex\.json/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 색인 }))
  await ctx.route(/\/data\/bidresult\.json/, (r) => r.fulfill({ json: 결과 }))
  await ctx.route(/\/data\/aparts\.json/, (r) => r.fulfill({ json: { a: {} } }))
  await ctx.route(/\/data\/overview\.json/, (r) => r.fulfill({ json: 개요 }))
  await ctx.route(/\/data\/(sim|basket|agency|bstat|kb|kan|kw|board\/svc|board\/goods)[^?]*\.json/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await ctx.addInitScript(() => { try { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); sessionStorage.setItem('kcm_notice_seen', '2026-10-업체'); sessionStorage.setItem('kcm_visit_s', '1') } catch (e) { /* 없음 */ } })
  const p = await ctx.newPage()
  const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
  return { ctx, p, 오류 }
}
const 넘침 = (p) => p.evaluate(() => document.documentElement.scrollWidth - innerWidth)
const 쉬어 = (ms) => new Promise((r) => setTimeout(r, ms))
const 금액수 = (t) => Number(String(t || '').replace(/[^0-9]/g, '')) || 0
const 하한at = (base, A, sj, ll) => Math.ceil((base * sj / 100 - A) * ll / 100 + A)
const 읽기 = (p) => p.evaluate(() => ({ 글: document.body.innerText, 금액: (document.querySelector('.hero .amt') || {}).innerText || '',
  막힘: (document.querySelector('.nogobox') || {}).innerText || '', 칸: (document.querySelector('.llbox') || {}).innerText || '',
  입력: !!document.querySelector('#go-llr') }))
const 바로 = async (p, g) => {
  await p.goto(BASE + '/?no=' + g.no, { waitUntil: 'domcontentloaded' })
  await p.waitForFunction((nm) => document.body.innerText.includes(nm), g.name, { timeout: 20000 })
  await 쉬어(900)
  return 읽기(p)
}

for (const [이름, w, h, 폰] of [['폰 390', 390, 844, true], ['PC 1280', 1280, 900, false]]) {
  console.log(`■ ${이름}`)
  const { ctx, p, 오류 } = await 새쪽(w, h, 폰)
  /* 가 — 계수 모름 */
  const a1 = await 바로(p, 가)
  ok('가(계수 모름) — 금액 없음 · 막힘 «낙찰하한율이 확정» · «실격» · 하한율 칸(#go-llr)', !a1.금액 && /낙찰하한율이 확정/.test(a1.막힘) && /실격/.test(a1.막힘) && a1.입력 && /기초금액조회/.test(a1.칸), [a1.금액, a1.막힘.slice(0, 160)])
  ok('가 — 막힘 칸 목록 «✕ 낙찰하한율(난이도계수)» · 끝 글 «자동 갱신 때 들어오면 저절로»', /✕ 낙찰하한율\(난이도계수\)/.test(a1.막힘) && /저절로 계산됩니다/.test(a1.막힘), a1.막힘.slice(0, 400))
  ok('가 — 칸 글 «난이도계수는 아직 자료에 안 실려 왔습니다» · 공고 목록 81.995%', /아직 자료에 안 실려 왔습니다/.test(a1.칸) && /81\.995%/.test(a1.칸), a1.칸.slice(0, 220))
  if (폰) await (await p.$('.llbox')).screenshot({ path: '/tmp/g10/g582/out/폰_하한율칸_빈.png' })
  await p.fill('#go-llr', '83.395')
  await 쉬어(900)
  const a2 = await 읽기(p)
  const 참하한 = 하한at(가.base, 가.aval, 100, 83.395)
  ok('가 — 83.395 넣음 → 금액이 나옴 · 사정률 100% 참 하한(83.395) 위 · 막힘 사라짐', 금액수(a2.금액) > 참하한 && !a2.막힘, [금액수(a2.금액), 참하한, a2.막힘.slice(0, 80)])
  ok('가 — 칸은 남아 «✓ 넣은 낙찰하한율 83.395%» · 금액 설명에 «직접 넣은 낙찰하한율(나라장터 기초금액조회)»', /✓ 넣은 낙찰하한율 83\.395%/.test(a2.칸) && /직접 넣은 낙찰하한율\(나라장터 기초금액조회\)/.test(a2.글), a2.칸.slice(0, 200))
  if (폰) await (await p.$('.llbox')).screenshot({ path: '/tmp/g10/g582/out/폰_하한율칸_넣음.png' })
  await p.fill('#go-llr', '50')
  await 쉬어(700)
  const a3 = await 읽기(p)
  ok('가 — 50 넣음(말이 안 되는 값) → 다시 금액 없음 · «60 ~ 100 사이»', !a3.금액 && /60 ~ 100 사이/.test(a3.칸) && /낙찰하한율이 확정/.test(a3.막힘), [a3.금액, a3.칸.slice(0, 120)])
  /* 나 — 바로잡은 줄 */
  const b1 = await 바로(p, 나)
  ok('나(0.9 반영 83.395) — 금액 · 참 하한 위 · «난이도계수 0.9 반영 · 공고 목록 81.995%» · 하한율 칸 없음', 금액수(b1.금액) > 하한at(나.base, 나.aval, 100, 83.395) && /난이도계수 0\.9 반영 · 공고 목록 81\.995%/.test(b1.글) && !b1.입력,
    [금액수(b1.금액), /난이도계수 0\.9 반영/.test(b1.글), b1.입력])
  /* ⚖ G582b 바로잡은 하한율 글 — «공고 하한율 · 이 공고에 실제로 적힌 값입니다» 가 아니라 «나라장터 «기초금액조회» 낙찰하한율 · 난이도계수를 반영한 값» */
  ok('나 — 설명 «하한율 83.395% + A값» · «나라장터 «기초금액조회» 낙찰하한율 — 난이도계수 0.9 반영» · «난이도계수를 반영한 값입니다» · «공고 하한율» · «이 공고에 실제로 적힌 값» 없음',
    /하한율 83\.395% \+ A값/.test(b1.글) && !/공고 하한율 83\.395%/.test(b1.글) && /나라장터 «기초금액조회» 낙찰하한율 — 난이도계수 0\.9 반영 · 공고 목록 81\.995%/.test(b1.글)
    && /난이도계수를 반영한 값입니다/.test(b1.글) && !/이 공고에 실제로 적힌 값입니다/.test(b1.글), (b1.글.match(/.{0,60}난이도계수를 반영한.{0,20}/) || [''])[0])
  /* 다 — PQ대상 셈 모름 */
  const c1 = await 바로(p, 다)
  ok('다(PQ대상 · nk) — 금액 없음 · «셈을 아직 확인하지 못해» · 칸 글에 0.85', !c1.금액 && /셈을 아직 확인하지 못해/.test(c1.막힘) && /0\.85/.test(c1.칸), [c1.금액, c1.막힘.slice(-160), c1.칸.slice(0, 160)])
  ok('바로투찰 넘침 0', (await 넘침(p)) <= 0, await 넘침(p))
  /* 공고 목록 */
  await p.goto(BASE + '/live', { waitUntil: 'domcontentloaded' })
  await p.waitForFunction(() => document.querySelectorAll('.notice').length >= 4, null, { timeout: 20000 })
  const 펼쳐읽기 = async (nm) => {
    await p.evaluate((nm) => { const c = [...document.querySelectorAll('.notice')].find((x) => (x.querySelector('h3') || {}).innerText === nm); c && c.click() }, nm)
    await 쉬어(600)
    return p.evaluate((nm) => {
      const c = [...document.querySelectorAll('.notice')].find((x) => (x.querySelector('h3') || {}).innerText === nm)
      if (!c) return { 못함: '', 링크: '', 하한: '' }
      const 칸 = [...c.querySelectorAll('.kv > div')].find((d) => /^낙찰하한율/.test((d.querySelector('span') || {}).innerText || ''))
      const a = [...c.querySelectorAll('.nocalc a')].map((x) => x.getAttribute('href'))
      return { 못함: (c.querySelector('.nocalc') || {}).innerText || '', 링크: a[0] || '', 하한: 칸 ? 칸.innerText : '' }
    }, nm)
  }
  const L가 = await 펼쳐읽기(가.name)
  ok('공고 목록 가 펼침 — «난이도계수에 따라 낙찰하한율이 달라집니다» · 바로투찰 링크(/?no=) · 하한율 칸 «(난이도계수 확인 중)»',
    /난이도계수에 따라 낙찰하한율이 달라집니다/.test(L가.못함) && L가.링크 === '/?no=' + 가.no && /난이도계수 확인 중/.test(L가.하한), L가)
  const L라 = await 펼쳐읽기(라.name)
  ok('공고 목록 라 펼침 — 하한율 «87.995% (난이도계수 0.9 반영)»', /87\.995%/.test(L라.하한) && /난이도계수 0\.9 반영/.test(L라.하한), L라.하한)
  ok('공고 목록 넘침 0', (await 넘침(p)) <= 0, await 넘침(p))
  /* 1순위 */
  await p.goto(BASE + '/first', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('main .notice.tap', { timeout: 20000 })
  await 쉬어(800)
  const 딱지 = (nm) => p.evaluate((nm) => {
    const c = [...document.querySelectorAll('main .notice.tap')].find((x) => x.innerText.includes(nm))
    if (!c) return null
    const d = [...c.querySelectorAll('.badge')].map((x) => ({ t: x.innerText.trim(), title: x.getAttribute('title') || '' })).filter((x) => /채점/.test(x.t))
    return d[0] || { t: '', title: '' }
  }, nm)
  const d마 = await 딱지(마.name), d바 = await 딱지(바.name)
  ok('1순위 마(계수 모름) — «채점 안 함 · 하한율 확인»', d마 && /채점 안 함 · 하한율 확인/.test(d마.t) && /난이도계수/.test(d마.title), d마)
  ok('1순위 바(0.9 반영) — «채점 가능»', d바 && /채점 가능/.test(d바.t), d바)
  const 카드 = p.locator('main .notice.tap', { hasText: 마.name })
  await 카드.scrollIntoViewIfNeeded()
  await 카드.locator('h3').click()
  await 쉬어(700)
  const e마 = await p.evaluate(() => { const o = document.querySelector('main .notice.open'); return o ? { 글: (o.querySelector('.nocalc') || {}).innerText || '', 단추: [...o.querySelectorAll('a')].some((x) => /채점하기/.test(x.innerText)) } : { 글: '', 단추: false } })
  ok('1순위 마 펼침 — 채점 단추 없음 · «50억 이상 적격심사 … 난이도계수 … 채점하지 않습니다»', !e마.단추 && /50억 이상 적격심사/.test(e마.글) && /난이도계수/.test(e마.글) && /채점하지 않습니다/.test(e마.글), e마)
  ok('1순위 넘침 0', (await 넘침(p)) <= 0, await 넘침(p))
  /* 바로투찰 채점(개찰 자료) */
  await p.goto(BASE + '/?no=' + 마.no, { waitUntil: 'domcontentloaded' })
  await p.waitForFunction(() => document.querySelector('.scored'), null, { timeout: 20000 })
  await 쉬어(900)
  const s마 = await p.evaluate(() => { const s = document.querySelector('.scored'); return { 머리: (s.querySelector('.sh') || {}).innerText || '', 글: s.innerText } })
  ok('바로투찰 마(개찰 · 계수 모름) — «채점하지 않습니다» · 까닭 «난이도계수에 따라 낙찰하한율이 달라지는데» · «밀렸을 자리» 없음',
    /채점하지 않습니다/.test(s마.머리) && /난이도계수에 따라 낙찰하한율이 달라지는데/.test(s마.글) && !/밀렸을 자리/.test(s마.글), s마.글.slice(0, 240))
  if (폰) await (await p.$('.scored')).screenshot({ path: '/tmp/g10/g582/out/폰_채점_계수모름.png' })
  ok('넘침 0 · 오류 0', (await 넘침(p)) <= 0 && 오류.length === 0, 오류)
  await ctx.close()
}
await b.close()
console.log(`\n${n}개 중 틀림 ${bad}`)
process.exit(bad ? 1 : 0)
