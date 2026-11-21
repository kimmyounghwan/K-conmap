/**
 * 🧪 G813 종심제 · 종합평가 «개찰 뒤» 실제 균형가격(종심개찰.jsx) · 공고 한 장(마감 전) 종심 안내 — 구운 사이트(가짜 파이어베이스 판)를 띄운 뒤:
 *   node tools/시험_종심개찰화면.mjs [주소=http://127.0.0.1:5825] [캡처폴더]
 *   소장님 11-21 「종심제 오늘중 마무리 할 것」 — 계획 ②(개찰 뒤 실제 균형가격) · ③(공고 한 장 연결)
 *   ① 1순위 펼침(종심 개찰 · 자료 있음) — «🏛 종심제 개찰 — 실제 균형가격» · 균형가격 · 기초 대비 · 예정 대비 · 업체 수 · 내 금액 → 가격점수(손셈) · 높음/낮음 · 개찰 1순위 가격점수
 *   ② 자료에 없는 종심 개찰 · 적격 개찰 — 칸 없음 ③ 바로투찰(개찰 뒤 · /?no=) — «채점하지 않습니다» 아래 같은 칸
 *   ④ 공고 한 장 /notice/{번호} — 개찰 뒤 종심은 같은 칸 · 마감 전 종심 공고는 «종합심사낙찰제(종심제)입니다» 띠 + «🏛 바로투찰에서 종심제 계산하기 →»(/calc?no=) · 적격은 예전 그대로
 *   ⑤ jongsim_open.json 없음(404) — 칸 없음 · 오류 0 ⑥ 폰 390 · PC 1280 — 넘침 0 · 오류 0 · 가상 자료만(인터넷 안 부름)
 */
import { createRequire } from 'node:module'
import { 종심가격점수 } from '../web/src/lib/종심셈.js'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const BASE = process.argv[2] || 'http://127.0.0.1:5825'
const CAP = process.argv[3] || ''

let bad = 0, n = 0
const ok = (이름, c, got) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (c || got === undefined ? '' : ' = ' + JSON.stringify(got).slice(0, 400))) }
const 오늘 = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10)
const 날 = (d) => new Date(Date.now() + d * 86400e3 + 9 * 3600e3).toISOString().slice(0, 10)
const 줄 = (no, o = {}) => ({ no, ord: '000', name: '가상 공고', inst: '가상군', dt: 오늘 + ' 11:00:00', amt: 523456000, rate: 89.912, np: 37, nrank: 37,
  base: 583000000, est: 530000000, sAmt: 0, lo: -3, hi: 3, ptot: 15, pdrw: 4, llr: 89.745, aval: 21000000, ayn: 'Y', win: '가상건설1(주)', bno: '1238112345', ...o })
const 나 = 줄('R26BK09981302', { name: '가상 터널 신설공사(종합심사)', inst: '조달청 가상지방조달청', amt: 33215000000, rate: 86.5, base: 38500000000, est: 35000000000, llr: null, aval: 2100000000, np: 9, nrank: 9 })
const 사 = 줄('R26BK09981307', { name: '가상 교량 신설공사(종합심사 · 자료 없음)', amt: 30100000000, rate: 87.2, base: 36000000000, est: 32700000000, llr: null, aval: 1900000000, np: 7, nrank: 7 })
const 마 = 줄('R26BK09981305', { name: '가상 마을길 포장공사(적격)', np: 6, nrank: 6 })
const 줄들 = [나, 사, 마]
const 예정 = Math.round(나.amt * 100 / 나.rate)
const 균형 = 34650000000
const 개찰판 = { t: 오늘 + ' 09:00', n: 1, 공고: { [나.no]: [오늘 + ' 11:00', '일반', 50, 나.base, 균형, 예정, 9, 9] } }
const meta = { built: 오늘 + ' 06:00', chunk: 500, rankChunk: 50, con: { n: 줄들.length, parts: 1, from: '2026-09-15', to: 오늘 }, serv: { n: 0, parts: 0 } }
const ov = { rows: 168842, agencies: 5066, corps: 72494, hot: { win: 30, n: 8651, mode: 90.3, rec: 90.1 },
  bands: [{ key: 's', label: '10억 미만', min: 0, max: 1e9, llr: 89.745, off: 0.2, win: 30, n: 8851, mode: 90.3, rec: 90.1, thin: false },
    { key: 'xl', label: '100억 이상', min: 1e10, max: null, llr: null, off: null, win: 90, n: 0, mode: null, rec: null, thin: true }],
  sjq: { p10: 98.934, p25: 99.379, p50: 99.886, p75: 100.377, p90: 100.796, p95: 101.036, p98: 101.303 } }
const RF = ['win', 'amt', 'rate', 'np', 'base', 'dt', 'tel', 'ceo', 'bno', 'adr', 'tsrc', 'name', 'inst', 'aval', 'ayn', 'amts', 'rq', 'nrank', 'lo', 'hi', 'lic', 'llr', 'est', 'enp', 'enpn', 'enpb', 'pc', 'az', 'smk']
const 결과 = { built: 오늘 + ' 06:00', f: RF, r: Object.fromEntries(줄들.map((g) => [g.no, RF.map((k) => (k === 'amts' || k === 'rq' || k === 'lic' ? [] : k === 'az' ? 0 : k === 'smk' ? '' : g[k] ?? (k === 'tsrc' || k === 'enp' || k === 'enpn' || k === 'pc' ? 0 : '')))])) }
/* 마감 전 공고(공고 한 장) — 종심 하나 · 적격 하나 */
const 공통 = { ord: '000', dt: 오늘 + ' 09:00:00', close: 날(5) + ' 10:00:00', lo: -2, hi: 2, ptot: 15, pdrw: 4, ayn: 'Y', lic: ['토목공사업/0001'], sido: '경기', mthd: '일반경쟁', kind: '일반', url: 'https://www.g2b.go.kr/' }
const 열종 = { ...공통, no: 'R26BK09981311', name: '가상 하천 정비공사(간이형 · 마감 전)', inst: '조달청 가상지방조달청', base: 16500000000, est: 15000000000, llr: null, aval: 900000000, smk: 'N', swin: '종합심사낙찰제(공사)-간이형 공사 심사항목 및 배점기준' }
const 열적 = { ...공통, no: 'R26BK09981312', name: '가상 근린공원 정비공사(적격 · 마감 전)', inst: '가상시', base: 187500000, est: 170454545, llr: 89.745, aval: 7500000, swin: '적격심사제-추정가격이 2억원 미만인 입찰공사 평가기준 (실적제한 아님, 그 밖의 공사)' }
const f = ['no', 'name', 'inst', 'base', 'budget', 'close', 'lo', 'hi', 'llr', 'est', 'lic', 'aval', 'gmtrl', 'ayn', 'ptot', 'pdrw', 'url', 'site', 'rgnb', 'joint', 'mthd', 'swin', 'rebid', 'enp', 'enpn', 'dt', 'sido', 'dsn', 'enpb', 'jnt', 'tg', 'nt', 'licg', 'rgs', 'az', 'smk', 'pc']
const 표 = {}
for (const s of [0, 1, 2, 3]) for (const q of [0, 1, 2, 3]) 표[`s${s}n${q}`] = [120, 5.1]
const 색인 = { built: 오늘 + ' 06:00', f, pick: { tbl: 표, sz: [1e8, 3e8, 1e9], nb: [10, 30, 100] }, r: [열종, 열적].map((g) => f.map((k) => (g[k] === undefined ? (k === 'smk' ? '' : k === 'az' ? 0 : null) : g[k]))) }
const 지금 = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 16).replace('T', ' ')
const 헬스 = { at: 지금, ok: true, why: '', fails: 0, got: { first: 266, live: 815 }, note: '', maint: false, hint: '', lastok: 지금, newest: { first: 오늘, live: 오늘 }, n: { first: 18396, live: 21143 }, gaps: { first: [], live: [] } }

const b = await chromium.launch()
const UA폰 = 'Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'
async function 새쪽(w, h, 폰 = true, 개찰 = 개찰판) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', isMobile: 폰, hasTouch: 폰, deviceScaleFactor: CAP ? 2 : 1, ...(폰 ? { userAgent: UA폰 } : {}) })
  await ctx.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|googlesyndication|geojs|daumcdn|kakao|coupang/, (r) => r.fulfill({ status: 200, body: '' }))
  await ctx.route(/firebaseio\.com|firebasedatabase\.app|identitytoolkit|securetoken/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await ctx.route('**/data/board/first.json*', (r) => r.fulfill({ json: meta }))
  await ctx.route('**/data/board/first-con-0.json*', (r) => r.fulfill({ json: 줄들 }))
  await ctx.route('**/data/board/live.json*', (r) => r.fulfill({ json: { ...meta, con: { n: 0, parts: 0 } } }))
  await ctx.route('**/data/ext/meta.json*', (r) => r.fulfill({ json: { n: 0, first: 0 } }))
  await ctx.route('**/data/pre/idx.json*', (r) => r.fulfill({ json: { all: [0, 0], n: {} } }))
  await ctx.route('**/data/health.json*', (r) => r.fulfill({ json: 헬스 }))
  await ctx.route(/\/data\/overview\.json/, (r) => r.fulfill({ json: ov }))
  await ctx.route(/\/data\/bidresult\.json/, (r) => r.fulfill({ json: 결과 }))
  await ctx.route(/\/data\/bidindex\.json/, (r) => r.fulfill({ json: 색인 }))
  await ctx.route(/\/data\/(sim|basket|agency|bstat|aparts|kb|kan|kw|board\/svc|board\/goods)[^?]*\.json/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await ctx.route(/\/data\/jongsim\.json/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  /* ⚠️ 나중에 단 길이 먼저 잡힘(Playwright) — jongsim_open 은 맨 뒤에 */
  await ctx.route(/\/data\/jongsim_open\.json/, (r) => (개찰 ? r.fulfill({ json: 개찰 }) : r.fulfill({ status: 404, body: '' })))
  await ctx.addInitScript(() => {
    try { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); sessionStorage.setItem('kcm_notice_seen', '2026-10-업체'); sessionStorage.setItem('kcm_visit_s', '1') } catch (e) { /* 없음 */ }
  })
  const p = await ctx.newPage()
  const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
  return { ctx, p, 오류 }
}
const 넘침 = (p) => p.evaluate(() => document.documentElement.scrollWidth - innerWidth)
const 쉬어 = (ms) => new Promise((r) => setTimeout(r, ms))
const 원 = (v) => Math.round(v).toLocaleString('ko-KR') + '원'
const 칸글 = (p) => p.evaluate(() => { const c = document.querySelector('.jsc-open'); return c ? c.innerText.replace(/\s+/g, ' ') : '' })
const 펼침 = async (p, nm) => {
  await p.evaluate((nm) => { const c = [...document.querySelectorAll('main .notice.tap')].find((x) => (x.querySelector('h3') || {}).innerText === nm); c && c.querySelector('h3').click() }, nm)
  await 쉬어(1200)
}
const 내점 = 종심가격점수(34000000000, 균형, 예정, 50)
const 일점 = 종심가격점수(나.amt, 균형, 예정, 50)

for (const [이름, w, h, 폰] of [['폰 390', 390, 844, true], ['PC 1280', 1280, 900, false]]) {
  console.log(`■ ${이름}`)
  const { ctx, p, 오류 } = await 새쪽(w, h, 폰)
  await p.goto(BASE + '/first', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('main .notice.tap', { timeout: 20000 })
  await 쉬어(800)
  await 펼침(p, 나.name)
  const t = await 칸글(p)
  ok('① 1순위 펼침(종심 · 자료 있음) — «🏛 종심제 개찰 — 실제 균형가격» · «일반 · 가격 50점» · 균형가격(근사) · 기초 대비 90.000% · 예정 대비 · 업체 9곳 · 이름표 한 줄',
    /🏛 종심제 개찰 — 실제 균형가격/.test(t) && /일반 · 가격 50점/.test(t) && t.includes(원(균형)) && /기초 대비 90\.000%/.test(t)
    && t.includes(`예정 대비 ${(균형 * 100 / 예정).toFixed(3)}%`) && /투찰 업체 9곳/.test(t) && /근사값/.test(t)
    && (await p.evaluate(() => [...document.querySelectorAll('.jsc-open .kv2 span')].every((e) => e.getBoundingClientRect().height < 22))), t.slice(0, 400))
  ok(`① 개찰 1순위(가장 낮은 금액) 가격점수 = 손셈 ${일점.toFixed(3)}점`, t.includes(`개찰 1순위(가장 낮은 금액) ${원(나.amt)} — 가격점수 ${일점.toFixed(3)}점`), t.slice(0, 600))
  await p.fill('.jsc-open input[aria-label="내 투찰 금액(개찰 뒤)"]', '34,000,000,000')
  await 쉬어(300)
  const t2 = await 칸글(p)
  ok(`① 내 금액 340억 → 기초의 88.312% · 가격점수 ${내점.toFixed(3)}점 / 50점(손셈) · 균형가격보다 650,000,000원 낮음`,
    /기초금액의 88\.312%/.test(t2) && t2.includes(`가격점수 ${내점.toFixed(3)}점 / 50점`) && /균형가격보다 650,000,000원 낮음/.test(t2), t2.slice(0, 600))
  ok('① 업체 이름 · 무료 · 클로드 · 보장 같은 말 없음', !/가상건설|무료|클로드|보장/.test(t2), t2.match(/가상건설|무료|클로드|보장/))
  if (CAP && 폰) {
    await p.addStyleTag({ content: 'footer, .ft, .site-foot { visibility: hidden !important; } .insa { display: none !important; }' })
    await p.evaluate(() => { for (const x of document.querySelectorAll('body *')) { const s = getComputedStyle(x).position; if ((s === 'fixed' || s === 'sticky') && !x.closest('.jsc-open')) x.style.visibility = 'hidden' } })
    await 쉬어(300)
    await (await p.$('.jsc-open')).screenshot({ path: `${CAP}/G813_1순위_종심개찰.png` })
  }
  await p.locator('main .notice.open h3').click(); await 쉬어(300)
  await 펼침(p, 사.name)
  ok('② 자료에 없는 종심 개찰 — 칸 없음(«채점하지 않습니다» 글은 그대로)', !(await p.$('.jsc-open')) && /낙찰하한율이 없습니다/.test(await p.evaluate(() => (document.querySelector('main .notice.open') || {}).innerText || '')))
  await p.locator('main .notice.open h3').click(); await 쉬어(300)
  await 펼침(p, 마.name)
  ok('② 적격 개찰 — 칸 없음', !(await p.$('.jsc-open')))
  ok('1순위 넘침 0', (await 넘침(p)) <= 0, await 넘침(p))
  /* ③ 바로투찰(개찰 뒤) */
  await p.goto(BASE + '/?no=' + 나.no, { waitUntil: 'domcontentloaded' })
  await p.waitForFunction(() => document.querySelector('.scored'), null, { timeout: 20000 })
  await p.waitForSelector('.jsc-open', { timeout: 15000 }).catch(() => {})
  const t3 = await 칸글(p)
  ok('③ 바로투찰(개찰 뒤 /?no=) — «채점하지 않습니다» 아래 같은 칸 · 균형가격', /채점하지 않습니다/.test(await p.evaluate(() => document.querySelector('.scored').innerText)) && t3.includes(원(균형)), t3.slice(0, 200))
  ok('바로투찰 넘침 0', (await 넘침(p)) <= 0, await 넘침(p))
  /* ④ 공고 한 장 */
  await p.goto(BASE + '/notice/' + 나.no, { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('.jsc-open', { timeout: 20000 }).catch(() => {})
  ok('④ 공고 한 장(개찰 뒤 종심) — 같은 칸 · 균형가격', (await 칸글(p)).includes(원(균형)))
  await p.goto(BASE + '/notice/' + 열종.no, { waitUntil: 'domcontentloaded' })
  await p.waitForFunction((nm) => document.body.innerText.includes(nm), 열종.name, { timeout: 20000 })
  await 쉬어(800)
  const 열 = await p.evaluate(() => ({ 띠: (document.querySelector('.jsc-alert') || {}).innerText || '', 단추: [...document.querySelectorAll('.btn-row a.btn')].map((a) => [a.innerText.trim(), a.getAttribute('href')]),
    크기: [...(([...document.querySelectorAll('.btn-row')].find((r) => r.querySelector('a[href^="/calc?no="]')) || document.createElement('div')).querySelectorAll('a.btn'))].map((a) => [Math.round(a.getBoundingClientRect().width), Math.round(a.getBoundingClientRect().height)]) }))
  if (CAP && 폰) {
    await p.addStyleTag({ content: 'footer, .ft, .site-foot { visibility: hidden !important; }' })
    await p.evaluate(() => { const e = document.querySelector('.jsc-alert'); if (e) { e.scrollIntoView({ block: 'center' }) } for (const x of document.querySelectorAll('body *')) { const s = getComputedStyle(x).position; if (s === 'fixed' || s === 'sticky') x.style.visibility = 'hidden' } })
    await 쉬어(300)
    await p.screenshot({ path: `${CAP}/G813_공고한장_마감전종심.png` })
  }
  ok('④ 공고 한 장(마감 전 종심) — «종합심사낙찰제(종심제)입니다» · 균형가격 · «🏛 종심제 계산하기 →»(/calc?no=)', /종합심사낙찰제\(종심제\)입니다/.test(열.띠) && /균형가격/.test(열.띠)
    && 열.단추.some(([t, h]) => /🏛 종심제 계산하기/.test(t) && h === '/calc?no=' + 열종.no), 열)
  ok('④ 단추 줄(마감 전 종심) — 두 단추 모두 한 줄 높이(≤ 60px) · 첫 단추 폭 ≥ 150px(🐞 전엔 첫 단추가 한 글자 폭으로 눌려 세로로 길게 섰음)', 열.크기.length === 2 && 열.크기.every(([, hh]) => hh <= 60) && 열.크기[0][0] >= 150, 열.크기)
  await p.goto(BASE + '/notice/' + 열적.no, { waitUntil: 'domcontentloaded' })
  await p.waitForFunction((nm) => document.body.innerText.includes(nm), 열적.name, { timeout: 20000 })
  await 쉬어(800)
  const 적 = await p.evaluate(() => ({ 띠: !!document.querySelector('.jsc-alert'), 단추: [...document.querySelectorAll('.btn-row a.btn')].map((a) => a.innerText.trim()),
    크기: [...(([...document.querySelectorAll('.btn-row')].find((r) => r.querySelector('a[href^="/calc?no="]')) || document.createElement('div')).querySelectorAll('a.btn'))].map((a) => [Math.round(a.getBoundingClientRect().width), Math.round(a.getBoundingClientRect().height)]) }))
  ok('④ 공고 한 장(마감 전 적격) — 예전 그대로(종심 띠 없음 · «💰 바로투찰에서 열기 →»)', !적.띠 && 적.단추.some((t) => /💰 바로투찰에서 열기/.test(t)), 적)
  ok('④ 단추 줄(마감 전 적격) — 두 단추 모두 한 줄 높이 · 첫 단추 폭 ≥ 150px', 적.크기.length === 2 && 적.크기.every(([, hh]) => hh <= 60) && 적.크기[0][0] >= 150, 적.크기)
  ok('공고 한 장 넘침 0 · 오류 0', (await 넘침(p)) <= 0 && 오류.length === 0, 오류)
  await ctx.close()
}
console.log('■ jongsim_open.json 없음(404)')
{
  const { ctx, p, 오류 } = await 새쪽(390, 844, true, null)
  await p.goto(BASE + '/notice/' + 나.no, { waitUntil: 'domcontentloaded' })
  await p.waitForFunction((nm) => document.body.innerText.includes(nm), 나.name, { timeout: 20000 })
  await 쉬어(1500)
  ok('⑤ 자료 없음 — 칸 없음 · 오류 0 · «채점하지 않습니다» 글 그대로', !(await p.$('.jsc-open')) && 오류.length === 0 && /낙찰하한율이 없습니다/.test(await p.evaluate(() => document.body.innerText)), 오류)
  await ctx.close()
}
await b.close()
console.log(`\n${bad ? '✗' : '✓'} 시험_종심개찰화면 ${n - bad}/${n}`)
if (bad) process.exit(1)
