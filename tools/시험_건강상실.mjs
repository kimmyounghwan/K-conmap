/**
 * 🧪 G555 4대보험 판단기 — 🩺 건강보험 상실 신고에 적을 값(보수총액 · 근무개월수 · 보험료 나오는 달) (2026-11-05)
 *   lib 모드(주소 없이):  LANG=C.UTF-8 node tools/시험_건강상실.mjs          — lib/ilyong4.js 건강상실값 셈 · 글 · 빠른찾기 낱말
 *   화면 모드(구운 사이트): LANG=C.UTF-8 node tools/시험_건강상실.mjs http://127.0.0.1:4986   · OUT=폴더 면 화면 사진
 *   소장님 「6번 부터 하자」 — 카페 도구 후보 ⑥ «4대보험 판단기에 건강보험 취득 · 상실 달 덧붙이기»
 *     (카페 질문: 건설일용 8/18 취득 · 9/17 상실 «보수총액 · 근무개월수» — 11-05 17:2x 바로잡은 셈: 취득한 달도 근무개월수 · 보수총액엔 넣고 정산월수에서만 뺌)
 *   ① 카페 사례(근로계약 1개월 이상 · 8.18~9.16 · 일당 20만) → 근무 2(8 · 9월) · 정산 1(9월) · 보수총액 520만 · 보수월액 260만 · 건강 93,470 · 요양 12,280
 *   ② 1일 취득(9.1~10.31 매일 · 월 8일 넘음) → 근무 2 · 정산 2 · «취득월 빠짐» 없음
 *   ③ 해 넘김(2025.12.10 ~ 2026.1.31) → 2026 · 2025 두 줄(늦은 해 먼저) · 2025 정산 0 · 2026 정산 1
 *   ④ 일당 없음 → 보수총액 0 · 화면 «일당을 넣으면»
 *   ⑤ 화면: 카드 · 표 · 💡 줄 · 정산(참고) · 근거 줄 · 폭 320 · 390 · 1280 넘침 0 · 오류 0 · «무료» · «클로드» 없음(카드 안)
 * 가상 자료만 씀 · 인터넷 안 부름.
 */
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
const require = createRequire(import.meta.url)
const 여기 = path.dirname(fileURLToPath(import.meta.url))
const 뿌리 = path.join(여기, '..')
const BASE = process.argv[2] || ''
const OUT = process.env.OUT || ''
let bad = 0, n = 0
const ok = (이름, c, got) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (c || got === undefined ? '' : ' = ' + JSON.stringify(got).slice(0, 600))) }
const L = await import(pathToFileURL(path.join(뿌리, 'web/src/lib/ilyong4.js')).href)

const 두자 = (x) => String(x).padStart(2, '0')
const 일요일 = (ds) => new Date(ds + 'T00:00:00Z').getUTCDay() === 0
function 날들(a, b, 일요일빼기 = true) { const out = []; for (let t = Date.parse(a + 'T00:00:00Z'); t <= Date.parse(b + 'T00:00:00Z'); t += 864e5) { const ds = new Date(t).toISOString().slice(0, 10); if (!일요일빼기 || !일요일(ds)) out.push(ds) } return out }
function 달돈(날, 일당) { const m = {}; for (const d of 날) m[d.slice(0, 7)] = (m[d.slice(0, 7)] || 0) + 일당; return m }
function 셈(날, 일당, 옵션 = {}) { const 돈 = 달돈(날, 일당); const R = L.판단({ 날, 달돈: 돈, 다른: {} }, 옵션); return { R, 돈, 값: L.건강상실값(R.건강, 돈, {}) } }

console.log('① 카페 사례 — 근로계약 1개월 이상 · 8.18 ~ 9.16 · 일당 20만')
const 카날 = 날들('2026-08-18', '2026-09-16')
{
  const { R, 값 } = 셈(카날, 200000, { 계약: true })
  const g = R.건강.구간[0] || {}
  ok('취득 8.18 · 상실 9.17(마지막 근로일 다음날)', g.취득 === '2026-08-18' && g.상실 === '2026-09-17', R.건강.구간)
  const x = (값[0] || { 줄: [] }).줄[0] || {}
  ok('근무개월수 2(8 · 9월) — 1일이 아닌 취득한 달도 넣음', x.근무월수 === 2 && x.근무달.join() === '2026-08,2026-09', x)
  ok('보험료 나오는 달(정산월수) 1(9월) — 취득한 달은 빠짐(제69조②)', x.정산월수 === 1 && x.정산달.join() === '2026-09', x)
  ok('보수총액 = 8 · 9월 이 현장 보수 다 더함(26일 × 20만 = 520만)', x.보수총액 === 26 * 200000, x.보수총액)
  ok('보수월액 = 보수총액 ÷ 근무개월수 = 260만 · 건강 93,470 · 요양 12,280(10원 미만 버림)', x.보수월액 === 2600000 && x.확정hi === 93470 && x.확정lc === 12280, [x.보수월액, x.확정hi, x.확정lc])
  ok('«취득월 빠짐» 표시', 값[0] && 값[0].취득월빠짐 === true)
}
console.log('② 1일 취득 — 9.1 ~ 10.31 (일요일 빼고)')
{
  const { R, 값 } = 셈(날들('2026-09-01', '2026-10-31'), 150000)
  const g = R.건강.구간[0] || {}
  const x = (값[0] || { 줄: [] }).줄[0] || {}
  ok('취득 9.1 · 상실 11.1', g.취득 === '2026-09-01' && g.상실 === '2026-11-01', R.건강.구간)
  ok('근무 2 · 정산 2(1일 취득은 그 달부터) · «취득월 빠짐» 없음', x.근무월수 === 2 && x.정산월수 === 2 && 값[0].취득월빠짐 === false, x)
}
console.log('③ 해 넘김 — 2025.12.10 ~ 2026.1.31')
{
  const { R, 값 } = 셈(날들('2025-12-10', '2026-01-31'), 180000)
  const g = R.건강.구간[0] || {}
  const 줄 = (값[0] || { 줄: [] }).줄
  ok('취득 12.10 · 상실 2.1', g.취득 === '2025-12-10' && g.상실 === '2026-02-01', R.건강.구간)
  ok('두 줄 — 2026 먼저 · 2025 다음', 줄.map((x) => x.해).join() === '2026,2025', 줄.map((x) => x.해))
  ok('2025: 근무 1(12월) · 정산 0 / 2026: 근무 1(1월) · 정산 1', 줄[1] && 줄[1].근무월수 === 1 && 줄[1].정산월수 === 0 && 줄[0].근무월수 === 1 && 줄[0].정산월수 === 1, 줄)
  ok('해마다 그해 요율(2025 · 2026)', 줄[0].요율해 === 2026 && 줄[1].요율해 === 2025, 줄.map((x) => x.요율해))
}
console.log('④ 일당 없음')
{
  const { 값 } = 셈(카날, 0, { 계약: true })
  const x = (값[0] || { 줄: [] }).줄[0] || {}
  ok('보수총액 0 · 근무 2 · 정산 1 그대로', x.보수총액 === 0 && x.근무월수 === 2 && x.정산월수 === 1, x)
}
console.log('◎ 글 · 빠른찾기')
{
  const 쪽 = fs.readFileSync(path.join(뿌리, 'web/src/pages/Ilyong4.jsx'), 'utf8')
  ok('화면 — 🩺 제목 · 💡 줄 · 정산(참고) · 근거(제69조② · 시행령 제36조① · 별지 제8호서식)', /🩺 건강보험 상실 신고에 적을 값/.test(쪽) && /근무개월수 · 보수총액에는 넣고/.test(쪽) && /정산하면\(참고\)/.test(쪽) && /국민건강보험법 제69조②/.test(쪽) && /시행령 제36조①/.test(쪽) && /별지 제8호서식/.test(쪽))
  const 가 = JSON.parse(fs.readFileSync(path.join(뿌리, 'web/src/data/ilyong_guide.json'), 'utf8'))
  const f = (가.faq || []).find((x) => /보수총액 · 근무개월수/.test(x[0]))
  ok('설명 쪽 자주 묻는 것에 «보수총액 · 근무개월수» · «무료» · «클로드» 없음', !!f && /근무개월수 2\(8 · 9월\)/.test(f[1]) && !/무료|클로드/.test(f.join(' ')), f)
  const 찾 = await import(pathToFileURL(path.join(뿌리, 'web/src/lib/빠른찾기.js')).href)
  const 읽 = (x) => JSON.parse(fs.readFileSync(path.join(뿌리, 'web/src/data', x), 'utf8'))
  const 목 = 찾.목록만들기({ 탭: [], tools: 읽('tools.json'), forms: 읽('forms-min.json'), change: 읽('change.json'), guide: 읽('guide.json'), cad: 읽('cad.json') })
  const 맨위 = (q) => (찾.찾기(목, q, 3)[0] || {}).to
  ok('빠른 찾기 «보수총액» · «근무개월수» · «상실신고» → 판단기', ['보수총액', '근무개월수', '상실신고'].every((q) => 맨위(q) === '/tools/ilyong-boheom'), ['보수총액', '근무개월수', '상실신고'].map(맨위))
}

if (BASE) {
  const { chromium } = require('playwright')
  const b = await chromium.launch()
  const st = (날, 일당, 옵션) => JSON.stringify({ 일당, 시작: 날[0].slice(0, 7), 달수: 3, 날, 달돈: {}, 다른: {}, 현장들: [], 옵션, 이름: '' })
  async function 새쪽(w, h, 폰, 상태) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', isMobile: 폰, hasTouch: 폰, deviceScaleFactor: 2,
      userAgent: 폰 ? 'Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36' : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36' })
    await ctx.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|googlesyndication|geojs/, (r) => r.fulfill({ status: 200, body: '' }))
    await ctx.route(/firebaseio\.com|firebasedatabase\.app/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
    await ctx.addInitScript((s) => { try { if (!sessionStorage.getItem('시험넣음')) { localStorage.setItem('kcm_ilyong1', s); sessionStorage.setItem('시험넣음', '1') } } catch (e) { /* 없음 */ } }, 상태)
    const p = await ctx.newPage()
    const 오류 = []
    p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
    await p.goto(BASE + '/tools/ilyong-boheom', { waitUntil: 'domcontentloaded' })
    await p.waitForSelector('.iy-out', { timeout: 20000 }); await p.waitForTimeout(1500)
    return { ctx, p, 오류 }
  }
  const 넘침 = (p) => p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  console.log('⑤ 화면 — 카페 사례 · 폰 390')
  {
    const { ctx, p, 오류 } = await 새쪽(390, 844, true, st(카날, 200000, { 계약: true }))
    const 카 = await p.evaluate(() => { const c = document.querySelector('.iy-loss'); return c ? c.innerText.replace(/\s+/g, ' ') : null })
    ok('카드 «8.18. 취득 ~ 9.17. 상실» · 2026년 · 5,200,000원 · 2개월(8월 · 9월) · 1개월(9월)', !!카 && /8\.18\. 취득 ~ 9\.17\. 상실/.test(카) && /2026년/.test(카) && /5,200,000원/.test(카) && /2개월 8월 · 9월/.test(카) && /1개월 9월/.test(카), 카)
    ok('💡 «8월은 1일 취득이 아니라 근무개월수 · 보수총액에는 넣고 … 빠집니다»', !!카 && /8월은 1일 취득이 아니라 근무개월수 · 보수총액에는 넣고/.test(카), 카)
    await p.locator('.iy-loss-d summary').first().click(); await p.waitForTimeout(300)
    const 정 = await p.evaluate(() => (document.querySelector('.iy-loss-d') || {}).innerText.replace(/\s+/g, ' '))
    ok('정산(참고) — 보수월액 2,600,000 × 1개월 → 건강 93,470 · 요양 12,280 · 달마다 뗀 것 · 더 냄/돌려받음/차이 없음 · 시행령 제39조', /2,600,000원 × 1개월/.test(정) && /건강 93,470 · 요양 12,280/.test(정) && /달마다 뗀 것 건강 [\d,]+ · 요양 [\d,]+/.test(정) && /(더 냄|돌려받음|차이 없음)/.test(정) && /시행령 제39조/.test(정), 정)
    const 근 = await p.evaluate(() => (document.querySelector('.iy-loss-src') || {}).innerText)
    ok('근거 줄 — 별지 제8호서식 «해당 연도 · 전년도» · 제69조② · 시행령 제36조①', /별지 제8호서식/.test(근) && /해당 연도 · 전년도/.test(근) && /제69조②/.test(근) && /시행령 제36조①/.test(근), 근)
    ok('카드 안 «무료» · «클로드» · NaN · undefined 없음', !/무료|클로드|NaN|undefined/.test(카 + 정 + 근))
    if (OUT) {
      await p.evaluate(() => { for (const e of document.querySelectorAll('body *')) { const s = getComputedStyle(e); if (s.position === 'fixed' || s.position === 'sticky') e.style.setProperty('display', 'none', 'important') } })
      const 머 = p.locator('.iy-h2', { hasText: '건강보험 상실 신고' })
      await 머.scrollIntoViewIfNeeded()
      const 위 = await 머.evaluate((e) => e.getBoundingClientRect().top + scrollY), 아래 = await p.locator('.iy-loss-src').evaluate((e) => e.getBoundingClientRect().bottom + scrollY)
      await p.screenshot({ path: OUT + '/건강상실_카페사례_폰390.png', clip: { x: 0, y: 위 - 8, width: 390, height: 아래 - 위 + 16 }, fullPage: true })
    }
    ok('폰 390 넘침 0 · 오류 0', (await 넘침(p)) <= 0 && !오류.length, [await 넘침(p), 오류])
    await ctx.close()
  }
  console.log('⑤ 해 넘김 · 일당 없음 · 폭 320 · 1280')
  {
    const { ctx, p, 오류 } = await 새쪽(320, 640, true, st(날들('2025-12-10', '2026-01-31'), 180000, {}))
    const 줄 = await p.evaluate(() => [...document.querySelectorAll('.iy-losst tbody tr')].map((r) => r.innerText.replace(/\s+/g, ' ')))
    ok('해 넘김 — 2026년 줄 먼저 · 2025년 줄(정산 0개월 «없음»)', 줄.length === 2 && /^2026년/.test(줄[0]) && /^2025년/.test(줄[1]) && /0개월 없음/.test(줄[1]), 줄)
    ok('320 넘침 0 · 오류 0', (await 넘침(p)) <= 0 && !오류.length, [await 넘침(p), 오류])
    await ctx.close()
  }
  {
    const { ctx, p, 오류 } = await 새쪽(390, 844, true, st(카날, '', { 계약: true }))
    const 카 = await p.evaluate(() => { const c = document.querySelector('.iy-loss'); return c ? c.innerText.replace(/\s+/g, ' ') : '' })
    ok('일당 없음 — «일당을 넣으면» · 정산(참고) 안 보임 · 근무 2 · 정산 1 은 나옴', /일당을 넣으면/.test(카) && !(await p.$('.iy-loss-d')) && /2개월/.test(카) && /1개월/.test(카) && !오류.length, 카)
    await ctx.close()
  }
  {
    const { ctx, p, 오류 } = await 새쪽(1280, 860, false, st(카날, 200000, { 계약: true }))
    ok('PC 1280 — 카드 있음 · 넘침 0 · 오류 0', !!(await p.$('.iy-loss')) && (await 넘침(p)) <= 0 && !오류.length, [await 넘침(p), 오류])
    await ctx.close()
  }
  await b.close()
}
console.log(`\n${bad ? '✗' : '✓'} 시험_건강상실 ${n - bad}/${n}`)
if (bad) process.exit(1)
