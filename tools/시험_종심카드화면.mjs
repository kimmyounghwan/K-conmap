/**
 * 🧪 G808 바로투찰 «🏛 종심제 계산» 카드 화면 — 구운 사이트(가짜 파이어베이스 판)를 띄운 뒤:
 *   node tools/시험_종심카드화면.mjs [주소=http://127.0.0.1:5821] [캡처폴더]
 *   가상 공고 넷(간이형 · 일반 · 지방 종합평가 · 적격) · 가상 /data/jongsim.json 셋(보임 · 안 보임 · 없음) — 인터넷 안 부름.
 *   ① 간이형 — 카드 · 갈래 «간이형 · 가격 60점» · 묶음(간이형|조달청 — 좁은 묶음이 없으면 넓힘) 값 그대로 · 세 줄 · 누르면 «복사됨» · 내 금액 → 가격점수 · 확인 일곱 · 내역서 링크 둘
 *   ② 일반(50점) · 지방 종합평가(709억 → 40점 · 묶음 표본 적음 → 전체)
 *   ③ 안 보임(맞춰 보기 65%) → «지난 개찰 분포(참고 · 예상 아님)» · 세 줄 없음 / 자료 없음 → «자료 모으는 중»
 *   ④ 적격 공고는 예전 그대로(금액 · 카드 없음) · 띠 «종합심사낙찰제(종심제)입니다»
 *   ⑤ 폰 390 · 320 · PC 1280 · 어두운 — 넘침 0 · 오류 0 · 카드 안 글이 칸 밖으로 안 나감
 *   🛠 G812 (11-21 «넓힌 범위로 열기») — 판 새 꼴(lo · hi · 묶음뒤 · 갈래보임 · 맞춤.갈래): 간이형은 규칙 뒤 묶음 · 90% 범위 · 그 갈래 매일 적중률 /
 *      갈래가 기준 미달이면 그 갈래 적중률로 까닭 · 표본 적음이면 «기준에 못 미쳐» 라고 안 함 · 옛 판(80% · 전체 보임)도 그대로 뜸
 *   📅 G820 간이형 공고에만 «2027년 1월부터 기술형 적격심사로 바뀔 예정» 한 줄(기초금액 칸 앞) · 일반 · 지방 종합평가엔 없음
 *   🩹 G822 기초금액 공개 전(기초 0) 간이형 → 띠 «공개되면 … 뜹니다» · 카드 없음 / 취소된 간이형 → 종심 띠 없음 · ⛔ 취소 카드
 */
import { createRequire } from 'node:module'
import { 점들 } from '../web/src/lib/종심고르기.js'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const BASE = process.argv[2] || 'http://127.0.0.1:5821'
const CAP = process.argv[3] || ''

let bad = 0, n = 0
const ok = (이름, c, got) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (c || got === undefined ? '' : ' = ' + JSON.stringify(got).slice(0, 300))) }
const 날 = (d) => new Date(Date.now() + d * 86400e3 + 9 * 3600e3).toISOString().slice(0, 10)
const 오늘 = 날(0)
const 공통 = { ord: '000', dt: 오늘 + ' 09:00:00', close: 날(5) + ' 10:00:00', lo: -2, hi: 2, ptot: 15, pdrw: 4, ayn: 'Y', lic: ['토목공사업/0001'], sido: '경기', mthd: '일반경쟁', kind: '일반', url: 'https://www.g2b.go.kr/' }
const 갑 = { ...공통, no: 'R00TEST80801', name: '가상 하천 정비공사(간이형)', inst: '조달청 가상지방조달청', base: 16500000000, est: 15000000000, llr: null, aval: 900000000, smk: 'N',
  swin: '종합심사낙찰제(공사)-간이형 공사 심사항목 및 배점기준', pc: 12000000000 }
const 을 = { ...공통, no: 'R00TEST80802', name: '가상 터널 신설공사(일반)', inst: '가상공단', base: 38500000000, est: 35000000000, llr: null, aval: 2100000000, smk: 'N',
  swin: '종합심사낙찰제(공사)-일반공사 심사항목 및 배점기준' }
const 병 = { ...공통, no: 'R00TEST80803', name: '가상 복합청사 신축공사(종합평가)', inst: '가상시', base: 78000000000, est: 70900000000, llr: null, aval: 4500000000, smk: 'N',
  swin: '종합평가낙찰제-종합평가' }
const 정 = { ...공통, no: 'R00TEST80804', name: '가상 근린공원 시설 정비공사(적격)', inst: '가상시', base: 187500000, est: 170454545, llr: 89.745, aval: 7500000,
  swin: '적격심사제-추정가격이 2억원 미만인 입찰공사 평가기준 (실적제한 아님, 그 밖의 공사)', enp: 7, enpn: 41, enpb: 'ls' }
/* 🩹 G822 극한 — 기초금액 공개 전(기초 0) 간이형 · 취소된 간이형(tg 4) — 전엔 둘 다 «아래 종심제 계산에서 보세요» 띠만 있고 카드가 없었음 */
const 무 = { ...공통, no: 'R00TEST80805', name: '가상 배수 개선공사(간이형 · 기초금액 공개 전)', inst: '조달청 가상지방조달청', base: 0, est: 15000000000, llr: null, aval: 0, smk: 'N',
  swin: '종합심사낙찰제(공사)-간이형 공사 심사항목 및 배점기준' }
const 취 = { ...공통, no: 'R00TEST80806', name: '가상 청사 신축공사(간이형 · 취소)', inst: '조달청 가상지방조달청', base: 0, est: 14000000000, llr: null, aval: 0, smk: 'N', tg: 4,
  swin: '종합심사낙찰제(공사)-간이형 공사 심사항목 및 배점기준' }
const 줄들 = [갑, 을, 병, 정, 무, 취]
const meta = { built: 오늘 + ' 06:00', chunk: 500, rankChunk: 50, con: { n: 4, parts: 1, from: '2026-09-15', to: 오늘, lics: [['0001', '토목공사업', 120]] }, serv: { n: 0, parts: 0 } }
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
/* 가상 jongsim.json — 묶음마다 고른 분포(가운데 ± 2%p) */
const 옛통 = (중, n_, 적음 = false, 폭 = 2) => ({ n: n_, q10: +(중 - 폭 * 0.8).toFixed(3), q50: 중, q90: +(중 + 폭 * 0.8).toFixed(3), y50: 100.12,
  d: 점들.map((p) => +(중 - 폭 + (p / 100) * 폭 * 2).toFixed(3)), 표본적음: 적음 })
const 통 = (중, n_, 적음 = false, 폭 = 2) => {   /* 🛠 G812 90% 범위 · 🛠 G815 짧은 구간(sa ~ sb) · 확률 막대(h) */
  const o = 옛통(중, n_, 적음, 폭)
  const s0 = Math.floor((o.d[0]) * 2) / 2 - 0.5
  const k = Math.round(((Math.ceil(o.d[o.d.length - 1] * 2) / 2 + 0.5) - s0) / 0.5)
  const p = Array.from({ length: k }, (_, i) => +(Math.exp(-(((s0 + i * 0.5 + 0.25) - 중) ** 2) / (2 * (폭 / 2) ** 2))).toFixed(3))
  const 합 = p.reduce((a, v) => a + v, 0)
  return { ...o, lo: o.d[0], hi: o.d[o.d.length - 1], sa: +(중 - 폭 * 0.45).toFixed(3), sb: +(중 + 폭 * 0.45).toFixed(3), h: { s: s0, w: 0.5, p: p.map((v) => +(v / 합).toFixed(3)) } }
}
/* 🛠 G815 맞춰 보기 어긋남 «잔»([균형÷기초 차이 %p, 예정÷기초 차이 %p]) — 간이형 27건(±1.2%p 안) · 일반 22건(4건은 +9%p — 균형가격이 예정가격 가까이 → 0점 위험 18%) */
const 잔간 = Array.from({ length: 27 }, (_, i) => [+(((i * 7) % 13 - 6) * 0.2).toFixed(3), +(((i * 5) % 9 - 4) * 0.1).toFixed(3)])
const 잔일 = Array.from({ length: 22 }, (_, i) => [i % 5 === 4 ? 9 : +(((i * 7) % 11 - 5) * 0.3).toFixed(3), i % 4 === 0 ? null : +(((i * 3) % 7 - 3) * 0.1).toFixed(3)])
const 갈성 = { 간이형: { n: 27, 적중: 24, 율: 88.9, 폭: 3.29, 구간: '짧은', 고른: { 적중: 23, 율: 85.2, 폭: 6.37 }, 짧은: { 적중: 24, 율: 88.9, 폭: 3.29 }, 잔: 잔간 },
  일반: { n: 22, 적중: 17, 율: 77.3, 폭: 8.58, 구간: '고른', 잔: 잔일 }, 지방종평: { n: 17, 적중: 14, 율: 82.4, 폭: 11.75, 구간: '고른' } }
const 판보임 = { t: 지금, n: 312, 기간: ['2025-11-21', 오늘],
  묶음: { '전체': 통(87.5, 312), '간이형': 통(87.9, 241), '간이형|조달청': 통(88.1, 150), '일반': 통(86.8, 31), '지방종평': 통(86, 6, true) },
  묶음뒤: { '간이형|조달청': { ...통(83.9, 24, false, 1.5), 참여: 347 } },   /* 🔧 G819 참여 업체 수 가운데 */
  맞춤: { n: 66, 적중: 54, 율: 81.8, 오차: 0.42, 자름: '2026-08-20', 학습: 125, 줄: [], 갈래: 갈성, 방식: '매일' }, 보임: true, 갈래보임: ['간이형', '일반', '지방종평'], 확인: true }
const 판확인전 = { ...판보임, 확인: false }
const 판안보임 = { ...판보임, 맞춤: { ...판보임.맞춤, n: 66, 적중: 40, 율: 60.6, 갈래: { ...갈성, 간이형: { n: 27, 적중: 17, 율: 63, 폭: 5.1 } } }, 보임: false, 갈래보임: ['일반', '지방종평'] }
const 판옛 = { t: 지금, n: 312, 기간: ['2025-11-21', 오늘], 묶음: { '간이형': 옛통(87.9, 241), '간이형|조달청': 옛통(88.1, 150) },
  맞춤: { n: 84, 적중: 69, 율: 82.1, 오차: 0.42, 자름: '2026-08-20', 학습: 228, 줄: [], 갈래: {} }, 보임: true, 확인: true }   /* 배포 뒤 자료가 다시 구워지기 전(옛 jongsim.json) */

const b = await chromium.launch()
const UA폰 = 'Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'
async function 새쪽(w, h, 폰, 판, 어둠 = false) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', isMobile: 폰, hasTouch: 폰, colorScheme: 어둠 ? 'dark' : 'light', deviceScaleFactor: CAP ? 2 : 1, ...(폰 ? { userAgent: UA폰 } : {}) })
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
  await ctx.route(/\/data\/jongsim\.json/, (r) => (판 ? r.fulfill({ json: 판 }) : r.fulfill({ status: 404, body: '' })))
  await ctx.route(/\/data\/(sim|basket|bidresult|first|agency|bstat)[^/]*\.json/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await ctx.addInitScript(() => {
    try { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); sessionStorage.setItem('kcm_notice_seen', '2026-10-업체'); sessionStorage.setItem('kcm_visit_s', '1'); localStorage.setItem('kcm_liccodes', '["0001"]') } catch (e) { /* 없음 */ }
    try { Object.defineProperty(navigator, 'clipboard', { value: { writeText: (t) => { window.__복사 = String(t); return Promise.resolve() } }, configurable: true }) } catch (e) { /* 없음 */ }
  })
  const p = await ctx.newPage()
  const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
  return { ctx, p, 오류 }
}
const 넘침 = (p) => p.evaluate(() => document.documentElement.scrollWidth - innerWidth)
const 쉬어 = (ms) => new Promise((r) => setTimeout(r, ms))
const 바로 = async (p, g) => {
  await p.goto(BASE + '/?no=' + g.no, { waitUntil: 'domcontentloaded' })
  await p.waitForFunction((nm) => document.body.innerText.includes(nm), g.name, { timeout: 20000 })
  await p.waitForFunction(() => { const c = document.querySelector('.jsc'); return !c || !/불러오는 중/.test(c.innerText) }, null, { timeout: 15000 })   /* 자료(jongsim.json) 받기 끝까지 */
  await 쉬어(800)
  return p.evaluate(() => ({
    카드: (document.querySelector('.jsc') || {}).innerText || '', 띠: [...document.querySelectorAll('.alertbar')].map((e) => e.innerText).join(' | '),
    멈춤: (document.querySelector('.c-stop') || {}).innerText || '', 금액: (document.querySelector('.hero .amt') || {}).innerText || '',
    줄: [...document.querySelectorAll('.jsc-row')].map((e) => e.innerText.replace(/\s+/g, ' ')),
  }))
}
const 칸밖 = (p) => p.evaluate(() => {
  const c = document.querySelector('.jsc'); if (!c) return ['카드 없음']
  const r = c.getBoundingClientRect(); const 밖 = []
  for (const e of c.querySelectorAll('*')) { const q = e.getBoundingClientRect(); if (q.width && (q.right > r.right + 1 || q.left < r.left - 1)) 밖.push((e.className || e.tagName) + ':' + Math.round(q.right - r.right)) }
  return 밖.slice(0, 5)
})
const 퍼 = (v) => `${Number(v).toFixed(2)}%`
const 떠있는것숨김 = (p) => p.evaluate(() => { for (const e of document.querySelectorAll('body *')) { const s = getComputedStyle(e).position; if ((s === 'fixed' || s === 'sticky') && !e.closest('.jsc')) e.style.visibility = 'hidden' } const i = document.querySelector('.insa'); if (i) i.style.display = 'none' })

for (const [이름, w, h, 폰, 어둠] of [['폰 390', 390, 844, true, false], ['폰 320', 320, 640, true, false], ['PC 1280', 1280, 900, false, false], ['폰 390 어두운', 390, 844, true, true]]) {
  console.log(`■ ${이름}`)
  const { ctx, p, 오류 } = await 새쪽(w, h, 폰, 판보임, 어둠)
  const 가 = await 바로(p, 갑)
  const g = 판보임.묶음뒤['간이형|조달청']
  ok('간이형 — 카드 · «간이형 · 가격 60점» · 띠 «종합심사낙찰제(종심제)입니다» · 멈춤 카드 · 적격 금액 없음', /🏛 종심제 계산/.test(가.카드) && /간이형 · 가격 60점/.test(가.카드)
    && /종합심사낙찰제\(종심제\)입니다/.test(가.띠) && !가.멈춤 && !가.금액, [가.카드.slice(0, 120), 가.띠.slice(0, 120)])
  ok(`① 🛠 G812 · G815 균형가격 예상 — 규칙 뒤 묶음 간이형|조달청(24건) · 짧은 구간 ${퍼(g.sa)} ~ ${퍼(g.sb)} · 가운데 ${퍼(g.q50)} · 범위 뜻 «80%가 들어간 가장 좁은 범위» · 이 갈래 27건 중 24건(88.9%) · «90% 범위» 이름 없음`,
    가.카드.includes(`기초금액의 ${퍼(g.sa)} ~ ${퍼(g.sb)}`) && 가.카드.includes(`가운데 ${퍼(g.q50)}`) && /24건\(간이형 · 조달청 · 같은 금액 규칙 뒤\)/.test(가.카드)
    && /«균형가격 ÷ 기초금액» 중 80%가 들어간 가장 좁은 범위입니다/.test(가.카드) && /이 갈래 27건 중 24건\(88\.9%\)이 이 범위 안에 들었습니다/.test(가.카드) && !/90% 범위|80% 범위/.test(가.카드) && !/150건/.test(가.카드), 가.카드.slice(0, 600))
  ok('🔧 G819 ① «비슷한 지난 개찰에는 보통 347곳이 넣었습니다»(묶음 참여 가운데) · 근거 보기에 공개 균형가격 대조(55건 · 54건 1원까지 같음 · 1건 1원 차이) · «근사값» 그대로',
    /비슷한 지난 개찰에는 보통 347곳이 넣었습니다/.test(가.카드) && /간이형 균형가격 55건과 대조해 보니 54건은 1원까지 같고 1건은 1원 차이였습니다/.test(await p.evaluate(() => document.querySelector('.jsc .jsc-why').textContent))
    && /근사값/.test(await p.evaluate(() => document.querySelector('.jsc .jsc-why').textContent)), 가.카드.match(/비슷한 지난 개찰[^.]*\./))
  const 막 = await p.evaluate(() => ({ 칸: document.querySelectorAll('.jsc .jsc-hist i').length, 진: document.querySelectorAll('.jsc .jsc-hist i.on').length, 글: (document.querySelector('.jsc .jsc-mode') || {}).innerText || '' }))
  ok('🛠 G815 확률 막대 — 칸 수 = 판 막대 칸 · 많이 나온 1%p 진하게(두 칸) · «가장 많이 나온 자리 … — 비슷한 지난 개찰의 ○%»', 막.칸 === g.h.p.length && 막.진 === 2
    && /가장 많이 나온 자리 [\d.]+% ~ [\d.]+% — 비슷한 지난 개찰의 \d+%/.test(막.글), 막)
  ok('③ 🛠 G815 세 줄(조금 낮게 · 기준 · 조금 높게) · 줄마다 금액 · 기초의 % · 기대 · 열에 아홉(간이형은 0점 위험 없음) · «★ 기대 최고» 한 줄', 가.줄.length === 3 && /조금 낮게/.test(가.줄[0]) && /^기준/.test(가.줄[1]) && /조금 높게/.test(가.줄[2])
    && 가.줄.every((x) => /원/.test(x) && /기초의 [\d.]+%/.test(x) && /기대 \d+\.\d점 · 열에 아홉 \d+\.\d점 이상( · 가장 낮게 \d+\.\d점)?$/.test(x) && !/끝 [\d.]+점|가운데|0점 위험/.test(x)) && 가.줄.filter((x) => /★ 기대 최고/.test(x)).length === 1, 가.줄)
  const 최고 = (줄) => 줄.map((x) => +(x.match(/기대 ([\d.]+)점/) || [0, 0])[1])
  ok('«★ 기대 최고» = 세 줄 중 기대 점수가 가장 높은 줄', (() => { const v = 최고(가.줄); const i = 가.줄.findIndex((x) => /★ 기대 최고/.test(x)); return i >= 0 && v[i] === Math.max(...v) })(), 최고(가.줄))
  const 셈글 = await p.evaluate(() => (document.querySelector('.jsc .jsc-how') || {}).innerText || '')
  ok('③ 셈 글 — «기준» = 가운데 절반 안에서 기대 최고 · 기대 · 열에 아홉 뜻 · 어긋났던 27건을 넣어 셈 · 간이형은 0점 위험 뜻 · 0점 까닭 줄 없음 · «가장 낮게» 뜻은 그 줄이 있을 때만',
    /«기준» = 지난 개찰 가운데 절반\(25 ~ 75%\) 안에서 기대가 가장 높은 금액/.test(가.카드) && /«열에 아홉» = 10번 중 9번은 이 점수 이상/.test(셈글) && !/0점 위험/.test(셈글)
    && /예상과 어긋났던 27건을 이 공고에 그대로 넣어 셈했습니다/.test(셈글) && !/0점은 균형가격보다/.test(셈글) && /«가장 낮게» = 그중 가장 낮은 점수/.test(셈글) === 가.줄.some((x) => /가장 낮게/.test(x)), 셈글)
  await p.locator('.jsc-row.mid').click()
  await 쉬어(300)
  const 복사 = await p.evaluate(() => [window.__복사 || '', (document.querySelector('.jsc [role=status]') || {}).innerText || '', !!document.querySelector('.jsc-row.mid.on')])
  ok('기준 줄 누름 → 켜짐 · «복사됨» · 복사한 값 = 줄 금액(숫자만)', 복사[2] && /복사됨|길게 눌러/.test(복사[1]) && /^\d+$/.test(복사[0]) && 가.줄[1].replace(/[^\d]/g, '').startsWith(복사[0]), 복사)
  await p.fill('.jsc input[aria-label="내 투찰 금액"]', '14,500,000,000')
  await 쉬어(300)
  const 내 = await p.evaluate(() => (document.querySelector('.jsc-me-row') || {}).innerText || '')
  ok('② 내 금액 145억 → 기초의 87.879% · 🛠 G815 기대 가격점수 먼저(소수 한 자리) · «열에 아홉은 ○점 이상» · «균형가격이 가운데(○%)로 나오면 ○점»', /기초금액의 87\.879% · 기대 가격점수 \d+\.\d점 · 열에 아홉은 \d+\.\d점 이상/.test(내)
    && new RegExp(`균형가격이 가운데\\(${퍼(g.q50).replace('.', '\\.')}\\)로 나오면 [\\d.]+점`).test(내) && !/예상 가격점수|범위 끝/.test(내), 내)
  const 점 = await p.evaluate(() => !!document.querySelector('.jsc-me'))
  ok('띠 그림에 내 금액 점', 점)
  ok('🩹 G822 보통 금액(145억)엔 예정가격 넘음 글 없음', !/예정가격을 넘/.test(내), 내)
  /* 🩹 G822 극한 — 예정가격을 넘는 금액(기초 165억 · 예가 ±2% → 가장 높은 예정가격 168.3억) */
  await p.fill('.jsc input[aria-label="내 투찰 금액"]', '17,200,000,000')
  await 쉬어(300)
  const 넘음 = await p.evaluate(() => (document.querySelector('.jsc-me-row') || {}).innerText || '')
  ok('🩹 G822 172억(기초의 104%) — «⛔ 예정가격은 기초금액의 ±2% 안 … 가장 높아도 약 16,830,000,000원 … 낙찰자가 될 수 없고 균형가격 셈에서도 빠집니다»',
    /⛔ 예정가격은 기초금액의 ±2% 안에서 정해져\(가장 높아도 약 16,830,000,000원\) 이 금액은 예정가격을 넘습니다 — 예정가격을 넘는 금액은 낙찰자가 될 수 없고 균형가격 셈에서도 빠집니다/.test(넘음), 넘음)
  await p.fill('.jsc input[aria-label="내 투찰 금액"]', '16,700,000,000')
  await 쉬어(300)
  const 어림넘음 = await p.evaluate(() => (document.querySelector('.jsc-me-row') || {}).innerText || '')
  ok('🩹 G822 167억(예정가격 어림 위 · 가장 높은 예정가격 아래) — «⚠️ 예정가격 어림(약 ○원)보다 높습니다 — 예정가격을 넘으면 …» · ⛔ 줄 없음',
    /⚠️ 예정가격 어림\(약 [\d,]+원\)보다 높습니다 — 예정가격을 넘으면 낙찰자가 될 수 없고 균형가격 셈에서도 빠집니다/.test(어림넘음) && !/⛔ 예정가격은/.test(어림넘음), 어림넘음)
  await p.fill('.jsc input[aria-label="내 투찰 금액"]', '14,500,000,000')
  await 쉬어(300)
  await p.evaluate(() => { const d = document.querySelector('.jsc-chk'); d.open = true })
  const 체크 = await p.evaluate(() => [...document.querySelectorAll('.jsc-chk input[type=checkbox]')].length)
  await p.locator('.jsc-chk input[type=checkbox]').first().check()
  ok('④ 내기 전 확인 일곱 · 누르면 켜짐', 체크 === 7 && await p.locator('.jsc-chk input[type=checkbox]').first().isChecked(), 체크)
  const 링크 = await p.evaluate(() => [...document.querySelectorAll('.jsc a')].map((a) => a.getAttribute('href')))
  ok('⑤ 내역서 도구 · 작성대행 문의(내역서 미리 고름) · 나라장터 공고서', 링크.includes('/naeyeok') && 링크.some((h) => /^\/contact\?k=cn&s=%EB%82%B4%EC%97%AD%EC%84%9C/.test(h || '')) && 링크.some((h) => /g2b/.test(h || '')), 링크)
  ok('🛠 G814 단가심사(감점) — 간이형은 기준단가(예정가격 90 ~ 100% + 균형단가 0 ~ 10%)의 ±12% · 고정비용 20% 이상 ±15% · 계약예규 [별표 3]', /단가심사\(감점\)/.test(가.카드)
    && /예정가격 90 ~ 100% \+ 균형단가 0 ~ 10%/.test(가.카드) && /±12% 밖이면 그 공종 금액 비중만큼 감점/.test(가.카드) && /±15%까지/.test(가.카드) && /계약예규 \[별표 3\]/.test(가.카드), 가.카드.match(/단가심사[^\n]{0,200}/))
  ok('무료 · 클로드 · 낙찰 보장 같은 말 없음', !/무료|클로드|보장/.test(가.카드), 가.카드.match(/무료|클로드|보장/))
  ok('카드 안 글 · 칸이 카드 밖으로 안 나감', (await 칸밖(p)).length === 0, await 칸밖(p))
  if (CAP && !어둠 && w !== 320) {
    await p.evaluate(() => { const d = document.querySelector('.jsc-chk'); d.open = false; const y = document.querySelector('.jsc').getBoundingClientRect().top + scrollY - 70; scrollTo(0, y) })
    await p.addStyleTag({ content: 'footer, .ft, .site-foot { visibility: hidden !important; }' })
    await 떠있는것숨김(p)
    await 쉬어(300)
    await (await p.$('.jsc')).screenshot({ path: `${CAP}/종심카드_${w}.png` })
  }
  const 을바 = await 바로(p, 을)
  ok('일반 — «일반 · 가격 50점» · 묶음 일반(31건 · 규칙 뒤 묶음 없음 → 모든 줄) · 고른 구간(lo ~ hi) · 범위 뜻 «위 · 아래 5%씩 뺀 범위» · 일반 22건 중 17건(77.3%)', /일반 · 가격 50점/.test(을바.카드)
    && 을바.카드.includes(`기초금액의 ${퍼(판보임.묶음['일반'].lo)} ~ ${퍼(판보임.묶음['일반'].hi)}`) && /31건\(일반\)/.test(을바.카드) && /22건 중 17건\(77\.3%\)/.test(을바.카드)
    && /«균형가격 ÷ 기초금액»에서 위 · 아래 5%씩 뺀 범위입니다/.test(을바.카드) && !/80%가 들어간/.test(을바.카드) && 을바.줄.length === 3
    && !/보통 \d+곳이 넣었습니다/.test(을바.카드), 을바.카드.slice(0, 400))   /* 🔧 G819 참여 수 없는 묶음 → 그 줄 없음 */
  ok('🛠 G815 일반 — 4/22건이 예정가격 가까이(어긋남 +9%p) → 세 줄 «⚠️ 0점 위험 18%»(열에 아홉 대신) · 0점 위험 뜻 · 0점 까닭 줄 · 어긋났던 22건', 을바.줄.every((x) => /기대 \d+\.\d점 · ⚠️ 0점 위험 18%$/.test(x) && !/열에 아홉/.test(x))
    && /«0점 위험» = 0점이 나오는 비율/.test(을바.카드) && /0점은 균형가격보다 «예정가격 − 균형가격» 이상 낮게 쓰면 나옵니다/.test(을바.카드) && /예상과 어긋났던 22건을/.test(을바.카드), 을바.줄)
  ok('🛠 G813 공고기관이 조달청 · 지자체가 아니면(가상공단) «조달청 공고가 아닙니다 — 자체 심사기준 … 공고서 확인» · 조달청(간이형)은 없음', /조달청 공고가 아닙니다/.test(을바.카드) && !/조달청 공고가 아닙니다/.test(가.카드), 을바.카드.slice(0, 200))
  ok('🛠 G814 단가심사(감점) — 일반은 기준단가(예정가격 70% + 균형단가 30%)의 ±17% · ±21%까지', /예정가격 70% \+ 균형단가 30%/.test(을바.카드) && /±17% 밖이면/.test(을바.카드) && /±21%까지/.test(을바.카드), 을바.카드.match(/단가심사[^\n]{0,200}/))
  const 병바 = await 바로(p, 병)
  ok('지방 종합평가 709억 — «지방 종합평가 · 가격 40점» · 띠 «종합평가낙찰제입니다» · 🩹 G809 갈래 표본 적음(6건) → 분포(참고)만 · 전체로 안 넓힘 · 세 줄 없음', /지방 종합평가 · 가격 40점/.test(병바.카드) && /종합평가낙찰제입니다/.test(병바.띠)
    && /지난 개찰 분포\(참고 · 예상 아님\)/.test(병바.카드) && /6건뿐\(20건 미만\)/.test(병바.카드) && 병바.카드.includes(`기초금액의 ${퍼(판보임.묶음['지방종평'].lo)}`) && !/312건/.test(병바.카드) && 병바.줄.length === 0
    && !/기준\(75%\)에 못 미쳐/.test(병바.카드) && /자료가 모이고 기준을 넘으면/.test(병바.카드) && !/조달청 공고가 아닙니다/.test(병바.카드) && !/단가심사/.test(병바.카드), [병바.카드.slice(0, 400), 병바.띠])
  /* 📅 G820 간이형 → 2027년 1월 «기술형 적격심사» 한 줄 — 간이형 공고에만(일반 · 지방 종합평가엔 없음) · 카드 머리 바로 아래(기초금액 칸 앞) */
  const 바뀜병 = await p.evaluate(() => !!document.querySelector('.jsc .jsc-chg'))
  const 바뀜자리 = 가.카드.indexOf('정부 발표(2026.7.1.)')
  ok('📅 G820 간이형만 «정부 발표(2026.7.1.) — 2027년 1월부터 100억 ~ 300억은 «기술형 적격심사»(낮은 금액부터 심사 · 내역입찰 그대로)로 바뀔 예정 · 이 공고는 종합심사라 종심제 셈» · 기초금액 칸 앞 · 일반 · 지방 종합평가엔 없음',
    /정부 발표\(2026\.7\.1\.\) — 2027년 1월부터 추정가격 100억 ~ 300억 공사는 간이형 종심제 대신 «기술형 적격심사»\(낮은 금액 입찰자부터 심사 · 내역입찰은 그대로\)로 바뀔 예정입니다/.test(가.카드)
    && /이 공고는 낙찰방법이 «종합심사»라 아래 종심제 셈을 씁니다/.test(가.카드) && 바뀜자리 > 0 && 바뀜자리 < 가.카드.indexOf('기초금액')
    && !/기술형 적격심사/.test(을바.카드) && !/기술형 적격심사/.test(병바.카드) && !바뀜병, [가.카드.match(/정부 발표[^\n]{0,200}/), 바뀜자리, 가.카드.indexOf('기초금액'), 바뀜병])
  /* 🩹 G822 기초금액 공개 전 · 취소 — 띠가 없는 카드를 가리키지 않음 */
  const 무바 = await 바로(p, 무)
  ok('🩹 G822 기초금액 공개 전 간이형 — 띠 «기초금액이 아직 공개되지 않았습니다 … 공개되면(또는 «값 고치기» 에 기초금액을 넣으면) 아래에 «🏛 종심제 계산» 이 뜹니다» · 카드 없음 · «아래 … 에서 보세요» 없음',
    /종합심사낙찰제\(종심제\)입니다/.test(무바.띠) && /기초금액이 아직 공개되지 않았습니다\. 공개되면\(또는 «값 고치기» 에 기초금액을 넣으면\) 아래에 «🏛 종심제 계산» 이 뜹니다/.test(무바.띠)
    && !무바.카드 && !/아래 «🏛 종심제 계산» 에서 균형가격 예상/.test(무바.띠), 무바.띠)
  const 취바 = await 바로(p, 취)
  const 취글 = await p.evaluate(() => document.body.innerText)
  ok('🩹 G822 취소된 간이형 — 종심 띠 없음(⛔ 취소 카드가 말함) · 종심 카드 없음', !/종합심사낙찰제\(종심제\)입니다/.test(취바.띠) && /나라장터에서 취소된 공고입니다/.test(취글) && !취바.카드, [취바.띠, 취글.match(/취소된 공고[^\n]{0,40}/)])
  const 정바 = await 바로(p, 정)
  ok('적격 공고 — 예전 그대로(금액 나옴 · 종심 카드 없음 · 종심 띠 없음)', !!정바.금액 && !정바.카드 && !/종심제/.test(정바.띠), [정바.금액, 정바.띠])
  if (!어둠 && w !== 320) {
    /* 공고 목록 펼침 — 종심 공고는 «🏛 바로투찰에서 종심제 계산하기» → 누르면 같은 카드(셈은 카드 한 곳) */
    await p.goto(BASE + '/live', { waitUntil: 'domcontentloaded' })
    await p.waitForFunction(() => document.querySelectorAll('.notice').length >= 4, null, { timeout: 20000 })
    await p.evaluate((nm) => { const c = [...document.querySelectorAll('.notice')].find((x) => (x.querySelector('h3') || {}).innerText === nm); c && c.click() }, 갑.name)
    await 쉬어(500)
    const 펼침 = await p.evaluate(() => (document.querySelector('.nocalc') || {}).innerText || '')
    ok('공고 목록 펼침(간이형) — «균형가격으로 가격점수» · «🏛 바로투찰에서 종심제 계산하기» · «계산 대상이 아닙니다» 없음', /균형가격/.test(펼침) && /🏛 바로투찰에서 종심제 계산하기/.test(펼침) && !/계산 대상이 아닙니다/.test(펼침), 펼침)
    await p.evaluate(() => { const a = [...document.querySelectorAll('.nocalc a')].find((x) => /종심제 계산하기/.test(x.innerText)); a && a.click() })
    await p.waitForSelector('.jsc', { timeout: 20000 })
    ok('누르면 바로투찰 «🏛 종심제 계산» 카드(같은 공고)', /간이형 · 가격 60점/.test(await p.evaluate(() => document.querySelector('.jsc').innerText)))
  }
  ok('넘침 0 · 오류 0', (await 넘침(p)) <= 0 && 오류.length === 0, 오류)
  await ctx.close()
}

console.log('■ 맞춰 보기 기준 못 넘음 · 자료 없음(폰 390)')
{
  const { ctx, p, 오류 } = await 새쪽(390, 844, true, 판확인전)
  const 가 = await 바로(p, 갑)
  ok('기준은 넘었지만 성적 확인 전 — «지난 개찰 분포(참고 · 예상 아님)» · «성적을 점검하는 중» · 세 줄 없음', /지난 개찰 분포\(참고 · 예상 아님\)/.test(가.카드) && /성적을 점검하는 중/.test(가.카드) && 가.줄.length === 0, 가.카드.slice(0, 400))
  ok('넘침 0 · 오류 0', (await 넘침(p)) <= 0 && 오류.length === 0, 오류)
  await ctx.close()
}
{
  const { ctx, p, 오류 } = await 새쪽(390, 844, true, 판안보임)
  const 가 = await 바로(p, 갑)
  ok('안 보임(간이형 기준 미달) — «지난 개찰 분포(참고 · 예상 아님)» · 이 갈래 매일 맞춰 보기 63%(17/27건) · 기준(75%)에 못 미쳐 · 세 줄 없음 · 내 금액 칸 없음',
    /지난 개찰 분포\(참고 · 예상 아님\)/.test(가.카드) && /이 갈래\(간이형\) 범위에 든 비율이 63%\(17\/27건\)라 기준\(75%\)에 못 미쳐/.test(가.카드)
    && 가.줄.length === 0 && !(await p.$('.jsc input[aria-label="내 투찰 금액"]')), 가.카드.slice(0, 500))
  const 을안 = await 바로(p, 을)
  ok('같은 판 — 일반은 기준을 넘어 «예상» · 세 줄(갈래마다 따로 엶)', /① 균형가격 예상/.test(을안.카드) && 을안.줄.length === 3, 을안.카드.slice(0, 200))
  if (CAP) { await p.addStyleTag({ content: 'footer, .ft, .site-foot { visibility: hidden !important; }' }); await 떠있는것숨김(p); await (await p.$('.jsc')).screenshot({ path: `${CAP}/종심카드_안보임.png` }) }
  ok('넘침 0 · 오류 0', (await 넘침(p)) <= 0 && 오류.length === 0, 오류)
  await ctx.close()
}
{
  const { ctx, p, 오류 } = await 새쪽(390, 844, true, 판옛)
  const 가 = await 바로(p, 갑)
  const g = 판옛.묶음['간이형|조달청']
  ok('옛 판(배포 뒤 자료가 다시 구워지기 전) — 그대로 «예상» · q10 ~ q90(«위 · 아래 10%씩 뺀 범위») · 전체 맞춰 보기 69/84 · 막대 없음 · 셈은 지난 개찰 분포로', /① 균형가격 예상/.test(가.카드) && 가.카드.includes(`기초금액의 ${퍼(g.q10)} ~ ${퍼(g.q90)}`)
    && /위 · 아래 10%씩 뺀 범위입니다/.test(가.카드) && /69\/84건 들어맞음\(82\.1%\)/.test(가.카드) && 가.줄.length === 3 && /^기준/.test(가.줄[1]) && !(await p.$('.jsc .jsc-hist'))
    && /균형가격이 지난 개찰처럼 나온다고 보고 셈했습니다/.test(가.카드) && !/어긋났던/.test(가.카드), 가.카드.slice(0, 400))
  ok('넘침 0 · 오류 0', (await 넘침(p)) <= 0 && 오류.length === 0, 오류)
  await ctx.close()
}
{
  const { ctx, p, 오류 } = await 새쪽(390, 844, true, null)
  const 가 = await 바로(p, 갑)
  ok('자료 없음 — «자료 모으는 중» · 세 줄 없음 · 확인 · 내역서는 그대로', /자료 모으는 중/.test(가.카드) && 가.줄.length === 0 && /내기 전 확인/.test(가.카드) && /산출내역서/.test(가.카드), 가.카드.slice(0, 300))
  if (CAP) { await p.addStyleTag({ content: 'footer, .ft, .site-foot { visibility: hidden !important; }' }); await 떠있는것숨김(p); await (await p.$('.jsc')).screenshot({ path: `${CAP}/종심카드_자료없음.png` }) }
  ok('넘침 0 · 오류 0', (await 넘침(p)) <= 0 && 오류.length === 0, 오류)
  await ctx.close()
}
await b.close()
console.log(`\n${bad ? '✗' : '✓'} 시험_종심카드화면 ${n - bad}/${n}`)
if (bad) process.exit(1)
