/**
 * 🎯 G624 «예상 참가 100곳+ → 자동 95분위» 화면 시험 — 구운 사이트(dist)를 띄운 뒤:
 *   node tools/시험_바로투찰자동95화면.mjs [주소=http://127.0.0.1:4578]
 *   소장님(11-09) 「투찰금액을 더 정교하게 다듬을 수는 없어?」 · 「다른 입찰사이트 참고해서...해줘.」 · 「시험도 해줘」 → 결과표 → 「적용해줘」
 *   바(예상 150곳) — 바로투찰 금액 = 95분위(lib/bidmath quickBid 와 같은 원 단위) · «🎯 이 공고는 95분위로» 상자 · 실격 14.6% → 5.43%
 *                  공고 탭 원클릭 줄 «사정률 95분위 (예상 참가로 자동)» · 같은 금액 · 한마디 «95분위로 조금 높여»
 *   가(예상 7곳) — 전처럼 80분위 · 상자 글 «100곳이 넘으면 95분위» / 사(예상 50곳) — 권장 그대로(자동 상자 없음)
 *   폰 390 · PC 1280 · 넘침 0 · 오류 0 · «무료» · «클로드» 없음. 가상 자료만 · 인터넷 안 부름 · 받기 없음.
 */
import { createRequire } from 'node:module'
import * as B from '../web/src/lib/bidmath.js'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const BASE = process.argv[2] || 'http://127.0.0.1:4578'

let bad = 0, n = 0
const ok = (이름, c, got) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (c || got === undefined ? '' : ' = ' + JSON.stringify(got).slice(0, 300))) }
const 날 = (d) => new Date(Date.now() + d * 86400e3 + 9 * 3600e3).toISOString().slice(0, 10)
const 오늘 = 날(0)
const 공통 = { ord: '000', inst: '가상시', dt: 오늘 + ' 09:00:00', close: 날(3) + ' 10:00:00', lo: -3, hi: 3, ptot: 15, pdrw: 4, ayn: 'Y', lic: ['토목공사업/0001'], sido: '경기', mthd: '제한경쟁', kind: '등록공고', tg: 64,
  swin: '적격심사제-추정가격이 10억원 미만 2억원 이상인 입찰공사 평가기준 (실적제한 아님, 그 밖의 공사)' }
const 가 = { ...공통, no: 'R00TEST62401', name: '가상 마을안길 포장공사', base: 187500000, est: 170454545, llr: 89.745, aval: 7500000, enp: 7, enpn: 41, enpb: 'ls',
  swin: '적격심사제-추정가격이 2억원 미만인 입찰공사 평가기준 (실적제한 아님, 그 밖의 공사)' }
const 바 = { ...공통, no: 'R00TEST62402', name: '가상 근린공원 산책로 정비공사', base: 412800000, est: 375272727, llr: 89.745, aval: 16900000, enp: 150, enpn: 66, enpb: 'ls' }
const 사 = { ...공통, no: 'R00TEST62403', name: '가상 하천 배수로 보수공사', base: 268300000, est: 243909090, llr: 89.745, aval: 9800000, enp: 50, enpn: 38, enpb: 'ls' }
const 줄들 = [가, 바, 사]
const meta = { built: 오늘 + ' 06:00', chunk: 500, rankChunk: 50,
  con: { n: 3, parts: 1, from: '2026-09-15', to: 오늘, lics: [['0001', '토목공사업', 120], ['0002', '건축공사업', 80]] }, serv: { n: 0, parts: 0 } }
const f = ['no', 'name', 'inst', 'base', 'budget', 'close', 'lo', 'hi', 'llr', 'est', 'lic', 'aval', 'gmtrl', 'ayn', 'ptot', 'pdrw', 'url', 'site', 'rgnb', 'joint', 'mthd', 'swin', 'rebid', 'enp', 'enpn', 'dt', 'sido', 'dsn', 'enpb', 'jnt', 'tg', 'nt', 'licg', 'rgs', 'az', 'smk', 'pc']
const 표 = {}
for (const s of [0, 1, 2, 3]) for (const q of [0, 1, 2, 3]) 표[`s${s}n${q}`] = [120, 5.1]
const 색인 = JSON.stringify({ built: 오늘 + ' 06:00', f, pick: { tbl: 표, sz: [1e8, 3e8, 1e9], nb: [10, 30, 100] },
  r: 줄들.map((g) => f.map((k) => (g[k] === undefined ? (k === 'smk' ? '' : k === 'az' ? 0 : null) : g[k]))) })
const P50 = 99.886
const 개요 = { rows: 168842, agencies: 5066, corps: 72494, hot: { win: 30, n: 8651, mode: 90.3, rec: 90.1 },
  bands: [{ key: 's', label: '10억 미만', min: 0, max: 1e9, llr: 89.745, off: 0.2, win: 30, n: 8851, mode: 90.3, rec: 90.1, thin: false },
    { key: 'm', label: '10억~50억', min: 1e9, max: 5e9, llr: 88.745, off: 0.3, win: 30, n: 322, mode: 89.3, rec: 89, thin: false },
    { key: 'l', label: '50억~100억', min: 5e9, max: 1e10, llr: 87.495, off: 0.55, win: 90, n: 60, mode: 88.7, rec: 88.2, thin: true },
    { key: 'xl', label: '100억 이상', min: 1e10, max: null, llr: null, off: null, win: 90, n: 0, mode: null, rec: null, thin: true }],
  sjq: { p10: 98.934, p25: 99.379, p50: P50, p75: 100.377, p90: 100.796, p95: 101.036, p98: 101.303 } }
const 지금 = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 16).replace('T', ' ')
const 헬스 = { at: 지금, ok: true, why: '', fails: 0, got: { first: 266, live: 815 }, note: '', maint: false, hint: '', lastok: 지금, newest: { first: 오늘, live: 오늘 }, n: { first: 18396, live: 21143 }, gaps: { first: [], live: [] } }
const 기대 = Object.fromEntries(줄들.map((g) => [g.no, B.quickBid(g, P50)]))

const b = await chromium.launch()
const UA폰 = 'Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'
async function 새쪽(w, h, 폰) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', isMobile: 폰, hasTouch: 폰, acceptDownloads: false, ...(폰 ? { userAgent: UA폰 } : {}) })
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
  await ctx.addInitScript(() => {
    try {
      localStorage.setItem('kcm_notice_seen', '2026-10-필독'); sessionStorage.setItem('kcm_notice_seen', '2026-10-업체'); sessionStorage.setItem('kcm_visit_s', '1')
      if (!sessionStorage.getItem('g624_set')) { localStorage.setItem('kcm_liccodes', '["0001"]'); sessionStorage.setItem('g624_set', '1') }
    } catch (e) { /* 없음 */ }
  })
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
  return p.evaluate(() => ({ 글: document.body.innerText, 금액: (document.querySelector('.hero .amt') || {}).innerText || '',
    자동머리: (document.querySelector('.autobox .h') || {}).innerText || '', 자동: (document.querySelector('.autobox') || {}).innerText || '' }))
}

for (const [이름, w, h, 폰] of [['폰 390', 390, 844, true], ['PC 1280', 1280, 900, false]]) {
  console.log(`■ ${이름}`)
  const { ctx, p, 오류 } = await 새쪽(w, h, 폰)
  /* 바 — 예상 150곳 */
  const 바바로 = await 바로(p, 바)
  ok('바(예상 150곳) 바로투찰 금액 = 95분위(quickBid 와 원 단위까지 같음)', 기대[바.no] && 기대[바.no].pctile === 95 && 금액수(바바로.금액) === 기대[바.no].amt,
    [바바로.금액, 기대[바.no] && 기대[바.no].amt])
  ok('바 자동 상자 — «🎯 이 공고는 95분위로 넣습니다 — 예상 참가 150곳»', /95분위/.test(바바로.자동머리) && /예상 참가\s*150곳/.test(바바로.자동머리), 바바로.자동머리)
  ok('바 자동 상자 글 — «예상 100곳 넘게» · «실격은 14.6% → 5.43%» · «권장(2.69%)과 거의 같았고»',
    /예상 100곳 넘게/.test(바바로.자동) && /실격은 14\.6% → 5\.43%/.test(바바로.자동) && /권장\(2\.69%\)과 거의 같았고/.test(바바로.자동), 바바로.자동.slice(0, 300))
  /* 가 — 예상 7곳 */
  const 가바로 = await 바로(p, 가)
  ok('가(예상 7곳) — 전처럼 80분위 금액 · 상자 «100곳이 넘으면 95분위»', 금액수(가바로.금액) === 기대[가.no].amt && 기대[가.no].pctile === 80
    && /80분위/.test(가바로.자동머리) && /100곳이 넘으면 95분위/.test(가바로.자동), [가바로.금액, 기대[가.no].amt, 가바로.자동머리])
  /* 사 — 예상 50곳 */
  const 사바로 = await 바로(p, 사)
  ok('사(예상 50곳) — 권장 그대로(자동 상자 없음 · 금액 = quickBid 권장)', 기대[사.no].mode === 'rec' && 금액수(사바로.금액) === 기대[사.no].amt && !사바로.자동머리,
    [사바로.금액, 기대[사.no].amt, 사바로.자동머리])
  /* 새로 쓴 글(자동 상자)만 — 사이트 공지(옛 글)는 그대로라 화면 전체로 보지 않음 */
  ok('자동 상자 글에 «무료» · «클로드» 없음', ![바바로.자동, 가바로.자동].some((t) => /무료|클로드/.test(t)), [바바로.글.match(/.{0,30}(무료|클로드).{0,30}/)?.[0] || ''])
  /* 공고 탭 — 원클릭 줄 · 한마디 */
  await p.goto(BASE + '/live', { waitUntil: 'domcontentloaded' })
  await p.waitForFunction((nm) => document.body.innerText.includes(nm), 바.name, { timeout: 20000 })
  await 쉬어(800)
  const 카드 = await p.evaluate((nm) => {
    const el = [...document.querySelectorAll('.oneclick')].map((o) => o.closest('[class]') && o.parentElement).filter(Boolean)
    const 찾기 = [...document.querySelectorAll('*')].filter((x) => x.children.length && x.innerText && x.innerText.includes(nm) && x.querySelector('.oneclick'))
    const c = 찾기.sort((a, b2) => a.innerText.length - b2.innerText.length)[0]
    return c ? { 금액: (c.querySelector('.oc-amt') || {}).innerText || '', 줄: (c.querySelector('.oc-sub') || {}).innerText || '', 한마디: (c.querySelector('.claudesay') || {}).innerText || '', n: el.length } : null
  }, 바.name)
  ok('공고 탭 바 — 원클릭 금액 = 바로투찰 금액 · «사정률 95분위 (예상 참가로 자동)»', 카드 && 금액수(카드.금액) === 기대[바.no].amt && /사정률 95분위 \(예상 참가로 자동\)/.test(카드.줄), 카드)
  ok('공고 탭 바 — 한마디 «95분위로 조금 높여 실격을 줄입니다»', 카드 && /95분위로 조금 높여 실격을 줄입니다/.test(카드.한마디), 카드 && 카드.한마디)
  ok(`${이름} 넘침 0`, (await 넘침(p)) <= 1, await 넘침(p))
  ok(`${이름} 화면 오류 0`, 오류.length === 0, 오류)
  await ctx.close()
}
await b.close()
console.log(`\n${bad ? '❌' : '✅'} 시험_바로투찰자동95화면 ${n - bad}/${n}`)
process.exit(bad ? 1 : 0)
