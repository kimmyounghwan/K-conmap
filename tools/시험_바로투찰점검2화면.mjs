/**
 * ⚖ G580 바로투찰 이용자 점검 둘째 — 화면 시험. 구운 사이트(dist)를 띄운 뒤:
 *   node tools/시험_바로투찰점검2화면.mjs [주소=http://127.0.0.1:4578]
 *   소장님 「사이트에서 다시 이용자 입장에서 하나 하나 해봐. 고칠 것 고쳐야 해」(11-07) — G579 다음, 이용자처럼 더 해 보다 찾은 것:
 *   가(1.8억 적격 · 예상 참가 7곳 · 근거 «이 면허·이 금액대») — «오늘 넣을 것» 카드 · 바로투찰 «자동 분위» 상자가 «기관 최근 N건» 이라 적던 것 → 근거 그대로
 *       · «사정률에 따라 1.6억 ~ 1.6억» → 만 원까지
 *   나(최저가낙찰제 · 하한율 없음) — «아직 안 실려 왔습니다 · 조금 뒤에» → «바로투찰로 계산하지 않는 공고입니다 · 낙찰방법 «최저가낙찰제»»(바로투찰 · 찾기 목록 · 공고 목록)
 *   다(100억 넘는 종합평가낙찰제) — «종합심사 대상입니다» → «낙찰방법이 «종합평가낙찰제» 입니다» · 카드 낙찰방법 칸도 공고 그대로
 *   라(100억 넘는 종합심사낙찰제) — 전처럼 «종합심사 대상입니다»
 *   마(100억 넘는 적격심사인데 하한율만 아직 없음) — 종합심사로 막지 않고 «아직 계산할 수 없습니다 · 낙찰하한율»
 *   바(공고 없이 «150억» 손으로) — «종합심사 대상입니다» 단정 → «공고마다 낙찰방법이 다릅니다» · 낙찰방법 «공고마다 다름»
 *   사(면허 고르기) — 첫 칩을 누르면 안내 글이 사라져 칩이 위로 뛰던 것 → 같은 자리
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
const 공통 = { ord: '000', inst: '가상시', dt: 오늘 + ' 09:00:00', close: 날(3) + ' 10:00:00', lo: -3, hi: 3, ptot: 15, pdrw: 4, ayn: 'Y', lic: ['토목공사업/0001'], sido: '경기', mthd: '제한경쟁', kind: '등록공고', tg: 64 }
const 가 = { ...공통, no: 'R00TEST58001', name: '가상 근린공원 시설 정비공사', base: 187500000, est: 170454545, llr: 89.745, aval: 7500000,
  swin: '적격심사제-추정가격이 2억원 미만인 입찰공사 평가기준 (실적제한 아님, 그 밖의 공사)', enp: 7, enpn: 41, enpb: 'ls' }
const 나 = { ...공통, no: 'R00TEST58002', name: '가상 대학 승강기 교체공사(최저가)', base: 0, est: 113000000, llr: null, aval: 0, ayn: '', ptot: 0, pdrw: 0,
  swin: '최저가낙찰제-최저가낙찰자', lic: ['승강기ㆍ삭도공사업/6201'] }
const 다 = { ...공통, no: 'R00TEST58003', name: '가상 복합청사 신축공사(종합평가)', base: 78000000000, est: 70900000000, llr: null, aval: 4500000000, smk: 'N',
  swin: '종합평가낙찰제-종합평가' }
const 라 = { ...공통, no: 'R00TEST58004', name: '가상 터널 신설공사(종합심사)', base: 38500000000, est: 35000000000, llr: null, aval: 2100000000, smk: 'N',
  swin: '종합심사낙찰제(공사)-일반공사 심사항목 및 배점기준' }
const 마 = { ...공통, no: 'R00TEST58005', name: '가상 학교 개축공사(적격 · 하한율 아직)', base: 22500000000, est: 20200000000, llr: null, aval: 4200000000, smk: 'Y',
  swin: '적격심사제-추정가격이 300억원미만 100억원이상인 입찰공사(실적제한 아님, 종합공사)' }
const 줄들 = [가, 나, 다, 라, 마]
const meta = { built: 오늘 + ' 06:00', chunk: 500, rankChunk: 50,
  con: { n: 5, parts: 1, from: '2026-09-15', to: 오늘, lics: [['0001', '토목공사업', 120], ['0002', '건축공사업', 80], ['6201', '승강기ㆍ삭도공사업', 9]] }, serv: { n: 0, parts: 0 } }
const f = ['no', 'name', 'inst', 'base', 'budget', 'close', 'lo', 'hi', 'llr', 'est', 'lic', 'aval', 'gmtrl', 'ayn', 'ptot', 'pdrw', 'url', 'site', 'rgnb', 'joint', 'mthd', 'swin', 'rebid', 'enp', 'enpn', 'dt', 'sido', 'dsn', 'enpb', 'jnt', 'tg', 'nt', 'licg', 'rgs', 'az', 'smk', 'pc']
const 표 = {}
for (const s of [0, 1, 2, 3]) for (const q of [0, 1, 2, 3]) 표[`s${s}n${q}`] = [120, 5.1]
const 색인 = JSON.stringify({ built: 오늘 + ' 06:00', f, pick: { tbl: 표, sz: [1e8, 3e8, 1e9], nb: [10, 30, 100] },
  r: 줄들.map((g) => f.map((k) => (g[k] === undefined ? (k === 'smk' ? '' : k === 'az' ? 0 : null) : g[k]))) })
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
async function 새쪽(w, h, 폰 = true, 면허 = true) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', isMobile: 폰, hasTouch: 폰, ...(폰 ? { userAgent: UA폰 } : {}) })
  await ctx.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|googlesyndication|geojs/, (r) => r.fulfill({ status: 200, body: '' }))
  await ctx.route(/firebaseio\.com|firebasedatabase\.app|identitytoolkit|securetoken/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await ctx.route('**/data/board/live.json*', (r) => r.fulfill({ json: meta }))
  await ctx.route('**/data/board/live-con-0.json*', (r) => r.fulfill({ json: 줄들 }))
  await ctx.route('**/data/ext/meta.json*', (r) => r.fulfill({ json: { n: 0, first: 0 } }))
  await ctx.route('**/data/pre/idx.json*', (r) => r.fulfill({ json: { all: [0, 0], n: {} } }))
  await ctx.route('**/data/health.json*', (r) => r.fulfill({ json: 헬스 }))
  await ctx.route(/\/data\/bidindex\.json/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 색인 }))
  await ctx.route(/\/data\/aparts\.json/, (r) => r.fulfill({ json: { a: {} } }))
  await ctx.route(/\/data\/overview\.json/, (r) => r.fulfill({ json: 개요 }))
  await ctx.route(/\/data\/(sim|basket|bidresult|first|agency|bstat)[^/]*\.json/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await ctx.addInitScript((면허) => {
    try {
      localStorage.setItem('kcm_notice_seen', '2026-10-필독'); sessionStorage.setItem('kcm_notice_seen', '2026-10-업체'); sessionStorage.setItem('kcm_visit_s', '1')
      if (면허 && !sessionStorage.getItem('g580_set')) { localStorage.setItem('kcm_liccodes', '["0001"]'); sessionStorage.setItem('g580_set', '1') }
    } catch (e) { /* 없음 */ }
  }, 면허)
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
    return { 글: t, 금액: (document.querySelector('.hero .amt') || {}).innerText || '', 막힘: (document.querySelector('.nogobox') || {}).innerText || '',
      띠: [...document.querySelectorAll('.alertbar')].map((e) => e.innerText).join(' | '), 카드: (document.querySelector('.c-stop') || {}).innerText || '',
      범위: (document.querySelector('.hero .range') || {}).innerText || '', 자동: (document.querySelector('.autobox .h') || {}).innerText || '' }
  })
}

for (const [이름, w, h, 폰] of [['폰 390', 390, 844, true], ['PC 1280', 1280, 900, false]]) {
  console.log(`■ ${이름}`)
  /* 사 — 면허 고르기(아직 아무것도 안 고른 이) */
  {
    const { ctx, p } = await 새쪽(w, h, 폰, false)
    await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' })
    await p.waitForSelector('.mytoday', { timeout: 20000 })
    await p.evaluate(() => { const bt = [...document.querySelectorAll('.mytoday button')].find((x) => /고르기 ▼/.test(x.innerText)); bt && bt.click() })
    await p.waitForSelector('.mt-setup .chip', { timeout: 20000 })
    const 자리 = () => p.evaluate(() => [...document.querySelectorAll('.mt-setup .chip')].slice(0, 6).map((c) => Math.round(c.getBoundingClientRect().top + scrollY)))
    const 앞 = await 자리()
    const 안내앞 = await p.evaluate(() => !!document.querySelector('.mt-setup .mt-lead'))
    await p.evaluate(() => { const c = [...document.querySelectorAll('.mt-setup .chip')].find((x) => x.innerText.trim() === '토목'); c && c.click() })
    await 쉬어(300)
    const 뒤 = await 자리()
    const 켜짐 = await p.evaluate(() => !!([...document.querySelectorAll('.mt-setup .chip.on')].find((x) => x.innerText.trim() === '토목')))
    ok('사 면허 고르기 — 첫 칩(토목)을 눌러도 칩 자리 그대로 · 안내 글 그대로 · 칩 켜짐', 안내앞 && 켜짐 && JSON.stringify(앞) === JSON.stringify(뒤)
      && (await p.evaluate(() => !!document.querySelector('.mt-setup .mt-lead'))), { 앞, 뒤, 켜짐 })
    await ctx.close()
  }
  const { ctx, p, 오류 } = await 새쪽(w, h, 폰, true)
  /* 가 — 오늘 넣을 것 카드 */
  await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' })
  await p.waitForFunction((nm) => [...document.querySelectorAll('.tp-card .tp-name')].some((e) => e.innerText === nm), 가.name, { timeout: 20000 })
  const 카드글 = await p.evaluate((nm) => { const c = [...document.querySelectorAll('.tp-card')].find((x) => (x.querySelector('.tp-name') || {}).innerText === nm); return c ? c.innerText : '' }, 가.name)
  ok('가 «오늘 넣을 것» 카드 — 예상 참가 7곳 «(이 면허·이 금액대 개찰 41건의 중앙)» · «기관 최근» 없음', /예상 참가 7곳/.test(카드글) && /이 면허·이 금액대 개찰 41건의 중앙/.test(카드글) && !/기관 최근/.test(카드글), 카드글.slice(0, 200))
  ok('«오늘 넣을 것» — 최저가(나) · 종합평가(다) · 종합심사(라) · 하한율 없는 적격(마)은 안 뜸(계산 안 되는 공고)', await p.evaluate((nms) => nms.every((nm) => ![...document.querySelectorAll('.tp-card .tp-name')].some((e) => e.innerText === nm)), [나.name, 다.name, 라.name, 마.name]))
  /* 가 — 바로투찰 */
  const 가바로 = await 바로(p, 가)
  ok('가 바로투찰 — 금액 나옴 · 자동 80분위 상자', 금액수(가바로.금액) > 0 && /80분위/.test(가바로.자동), [가바로.금액, 가바로.자동])
  const 자동글 = await p.evaluate(() => (document.querySelector('.autobox') || {}).innerText || '')
  ok('가 자동 분위 상자 — 근거 «이 면허·이 금액대 개찰 41건의 중앙» · «이 기관 최근 개찰» 없음', /이 면허·이 금액대 개찰 41건의 중앙/.test(자동글) && !/이 기관 최근 개찰/.test(자동글), 자동글.slice(0, 200))
  const [범위앞, 범위뒤] = 가바로.범위.replace('사정률에 따라', '').trim().split(' ~ ')
  ok('가 «사정률에 따라» — 두 끝이 다른 글(전엔 «1.6억 ~ 1.6억») · 억 · 만으로', 범위앞 && 범위뒤 && 범위앞 !== 범위뒤 && /억 [\d,]+만/.test(범위앞), 가바로.범위)
  if (폰) await (await p.$('.hero')).screenshot({ path: '/tmp/g10/g580/out/폰_바로투찰_범위.png' })
  /* 나 — 최저가낙찰제 */
  const 나바로 = await 바로(p, 나)
  ok('나(최저가낙찰제) 바로투찰 — «⛔ 바로투찰로 계산하지 않는 공고입니다» · 낙찰방법 «최저가낙찰제» · 금액 없음',
    /바로투찰로 계산하지 않는 공고입니다/.test(나바로.막힘) && /«최저가낙찰제»/.test(나바로.막힘) && !금액수(나바로.금액), 나바로.막힘.slice(0, 200))
  ok('나 — «아직 계산할 수 없습니다» · «조금 뒤에 열어보세요» · «종합심사» 없음', !/아직 계산할 수 없습니다|조금 뒤에 열어보세요/.test(나바로.글) && !/종합심사/.test(나바로.띠 + 나바로.카드))
  if (폰) await (await p.$('.nogobox')).screenshot({ path: '/tmp/g10/g580/out/폰_바로투찰_최저가.png' })
  /* 찾기 목록 */
  await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('input[placeholder*="도로포장"]', { timeout: 20000 })
  await p.fill('input[placeholder*="도로포장"]', '승강기')
  await 쉬어(700)
  const 감춤 = await p.evaluate(() => (document.querySelector('.hidenote') || {}).innerText || '')
  ok('나 찾기 — 감춘 까닭 «바로투찰로 계산할 수 없는 공고 1건은 감췄습니다(… 하한율 없는 낙찰방법)»', /계산할 수 없는 공고 1건은 감췄습니다/.test(감춤) && /하한율 없는 낙찰방법/.test(감춤), 감춤)
  await p.evaluate(() => { const bt = [...document.querySelectorAll('.hidenote button')].find((x) => /그래도 보기/.test(x.innerText)); bt && bt.click() })
  await 쉬어(400)
  const 찾기글 = await p.evaluate((nm) => { const r = [...document.querySelectorAll('.pickrow')].find((x) => x.innerText.includes(nm)); return r ? r.innerText : '' }, 나.name)
  ok('나 찾기 목록 — «계산 대상 아님 — 최저가낙찰제»(전엔 «계산 불가 — 기초금액·낙찰하한율·… 없음»)', /계산 대상 아님 — 최저가낙찰제/.test(찾기글) && !/계산 불가/.test(찾기글), 찾기글.slice(0, 200))
  /* 다 — 100억 넘는 종합평가 */
  const 다바로 = await 바로(p, 다)
  ok('다(종합평가낙찰제 · 100억 넘음) — 띠 «낙찰방법이 «종합평가낙찰제» 입니다» · «종합심사 대상» 없음', /낙찰방법이 «종합평가낙찰제» 입니다/.test(다바로.띠) && !/종합심사 대상/.test(다바로.띠), 다바로.띠)
  ok('다 — «계산기를 쓰면 안 됩니다» 카드 낙찰방법 «종합평가낙찰제» · «종합심사낙찰제» 아님 · 금액 없음', /계산기를 쓰면 안 됩니다/.test(다바로.카드) && /종합평가낙찰제/.test(다바로.카드) && !/종합심사/.test(다바로.카드) && !금액수(다바로.금액), 다바로.카드.slice(0, 220))
  /* 라 — 100억 넘는 종합심사(전과 같음) */
  const 라바로 = await 바로(p, 라)
  ok('라(종합심사낙찰제) — 전처럼 «종합심사 대상입니다» · 카드 «종합심사는 가격만으로…» · 금액 없음', /종합심사 대상입니다/.test(라바로.띠) && /종합심사는 가격만으로/.test(라바로.카드) && /종합심사낙찰제\(공사\)/.test(라바로.카드) && !금액수(라바로.금액), [라바로.띠, 라바로.카드.slice(0, 120)])
  /* 마 — 100억 넘는 적격인데 하한율만 아직 */
  const 마바로 = await 바로(p, 마)
  ok('마(적격 · 하한율 아직) — 종합심사로 막지 않음 · «아직 계산할 수 없습니다» · ✕ 낙찰하한율', !/종합심사|계산기를 쓰면 안 됩니다/.test(마바로.띠 + 마바로.카드) && /아직 계산할 수 없습니다/.test(마바로.막힘) && /✕ 낙찰하한율/.test(마바로.막힘), [마바로.띠, 마바로.막힘.slice(0, 120)])
  /* 바 — 공고 없이 150억 */
  await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('input[placeholder*="도로포장"]', { timeout: 20000 })
  await p.fill('input[placeholder*="도로포장"]', '150억')
  await 쉬어(900)
  const 바 = await p.evaluate(() => ({ 띠: [...document.querySelectorAll('.alertbar')].map((e) => e.innerText).join(' | '), 카드: (document.querySelector('.c-stop') || {}).innerText || '' }))
  ok('바(공고 없이 150억) — 띠 «공고마다 낙찰방법이 다릅니다» · «종합심사 대상입니다» 단정 없음', /공고마다 낙찰방법이 다릅니다/.test(바.띠) && !/종합심사 대상입니다/.test(바.띠), 바.띠)
  ok('바 — 카드 제목 «추정가격 100억 이상 — 공고를 골라야 계산합니다»(«이 공고는» 아님) · 낙찰방법 «공고마다 다름» · «공고 찾기» 에서 고르라는 말',
    /공고를 골라야 계산합니다/.test(바.카드) && !/이 공고는/.test(바.카드) && /공고마다 다름/.test(바.카드) && /공고 찾기/.test(바.카드) && !/종합심사낙찰제 \(추정가격/.test(바.카드), 바.카드.slice(0, 220))
  if (폰) await (await p.$('.c-stop')).screenshot({ path: '/tmp/g10/g580/out/폰_바로투찰_150억.png' })
  /* 공고 목록 — 나 펼침 */
  await p.goto(BASE + '/live', { waitUntil: 'domcontentloaded' })
  await p.waitForFunction(() => document.querySelectorAll('.notice').length >= 5, null, { timeout: 20000 })
  await p.evaluate((nm) => { const c = [...document.querySelectorAll('.notice')].find((x) => (x.querySelector('h3') || {}).innerText === nm); c && c.click() }, 나.name)
  await 쉬어(500)
  const 못함 = await p.evaluate(() => (document.querySelector('.nocalc') || {}).innerText || '')
  ok('공고 목록 나 펼침 — «낙찰방법 «최저가낙찰제» — … 바로투찰 계산 대상이 아닙니다» · «아직 안 실려» 없음', /낙찰방법 «최저가낙찰제»/.test(못함) && /계산 대상이 아닙니다/.test(못함) && !/아직 안 실려/.test(못함), 못함)
  const 한마디 = await p.evaluate((nm) => { const c = [...document.querySelectorAll('.notice')].find((x) => (x.querySelector('h3') || {}).innerText === nm); return c ? ((c.querySelector('.claudesay span') || {}).innerText || '') : '' }, 나.name)
  ok('공고 목록 나 한마디 — 낙찰방법을 말함 · «들어오면 자동으로» 없음', !한마디 || (/최저가낙찰제/.test(한마디) && !/들어오면/.test(한마디)), 한마디)
  ok('넘침 0 · 오류 0', (await 넘침(p)) <= 0 && 오류.length === 0, 오류)
  await ctx.close()
}
await b.close()
console.log(`\n${n}개 중 틀림 ${bad}`)
process.exit(bad ? 1 : 0)
