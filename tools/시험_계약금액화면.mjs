/**
 * 🧪 G544 (2026-11-05) 계약 도구 묶음(tools/계약칸.jsx) 금액 칸 — 억 · 만으로 넣어도 읽음 · 칸 아래 읽은 줄 — 화면 시험
 *   구운 사이트(dist)를 띄운 뒤:  LANG=C.UTF-8 node tools/시험_계약금액화면.mjs [주소=http://127.0.0.1:4988]
 *   이용자 점검(11-05): 칸에는 «3억 8,500만» 이 친 그대로 보이는데 셈은 38,500원(num() 이 숫자만 남김) — 옆 글 «3만 8,500 원» 만 힌트
 *   도구 다섯을 «숫자로 넣은 것» 과 «억 · 만으로 넣은 것» 이 화면 전체 글까지 같은지 견줌(칸을 벗어난 뒤):
 *   ① ⚖️ 하도급 적정성(금액 여섯) ② 📅 낙찰 뒤 할 일(도급 · 추정가격 · 하도급) ③ ⏱ 지체상금(계약 · 인수 기성)
 *   ④ 🛡 하자보수보증금(계약) ⑤ 🤝 공동도급 나누기(계약 · 이번 회 · 구성원 선금 · 지난번 기성)
 *   ⑥ 예전에 친 그대로 남은 글(«3억 8,500만» · use칸 localStorage)도 바르게 읽음 ⑦ 폰 390 · 320 넘침 0 · 오류 0
 *   OUT=폴더 면 화면 사진
 * 인터넷 안 부름(파이어베이스 · 광고 · 애널리틱스 막음) · 이 시험 브라우저 안에서만 적음.
 */
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const BASE = process.argv[2] || 'http://127.0.0.1:4988'
const OUT = process.env.OUT || ''

let bad = 0, n = 0
const ok = (이름, c, got) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (c || got === undefined ? '' : ' = ' + JSON.stringify(got).slice(0, 500))) }
const UA = { PC: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36', 폰: 'Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36' }
const b = await chromium.launch()
async function 새쪽(w, h, 폰 = true, 미리 = null) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', isMobile: 폰, hasTouch: 폰, userAgent: 폰 ? UA.폰 : UA.PC, deviceScaleFactor: OUT ? 2 : 1 })
  await ctx.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|googlesyndication|geojs/, (r) => r.fulfill({ status: 200, body: '' }))
  await ctx.route(/firebaseio\.com|firebasedatabase\.app/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: r.request().method() === 'GET' ? 'null' : (r.request().postData() || 'null') }))
  await ctx.addInitScript((미리) => { try { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); sessionStorage.setItem('kcm_notice_seen', '2026-10-업체'); sessionStorage.setItem('kcm_visit_s', '1'); if (미리 && !sessionStorage.getItem('__미리')) { for (const [k, v] of Object.entries(미리)) localStorage.setItem(k, v); sessionStorage.setItem('__미리', '1') } } catch (e) { /* 없음 */ } }, 미리)
  const p = await ctx.newPage()
  const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
  p.on('dialog', (d) => d.dismiss())
  return { ctx, p, 오류 }
}
/* 이름표(힌트 뺀 글)가 꼭 같은 칸 */
const 칸 = async (p, 이름) => {
  const id = await p.evaluate((이름) => {
    const r = [...document.querySelectorAll('.tl-row')].find((x) => { const l = x.querySelector('.tl-lab'); return l && l.childNodes[0] && l.childNodes[0].textContent.trim() === 이름 })
    if (!r) return null
    r.setAttribute('data-t', 이름); return 이름
  }, 이름)
  if (!id) throw new Error('칸 없음: ' + 이름)
  return p.locator(`.tl-row[data-t="${이름}"] input`).first()
}
const 줄 = async (p, 이름) => { await 칸(p, 이름); const l = p.locator(`.tl-row[data-t="${이름}"] .amt-read`); return (await l.count()) ? (await l.first().innerText()).trim() : null }
const 친다 = async (p, c, 글) => { await c.click(); await c.press('Control+A'); await c.press('Backspace'); if (글) await p.keyboard.type(글, { delay: 8 }); await p.waitForTimeout(120) }
const 벗어남 = async (p) => { await p.evaluate(() => document.activeElement && document.activeElement.blur()); await p.waitForTimeout(250) }
const 화면글 = (p) => p.evaluate(() => { const t = document.querySelector('.tool'); return t ? t.innerText.replace(/\s+/g, ' ').trim() : '' })
const 넘침 = (p) => p.evaluate(() => document.documentElement.scrollWidth - innerWidth)
/* 한 도구: 숫자로 한 벌 · 억 · 만으로 한 벌 → 벗어난 뒤 화면 전체 글이 같은가 */
async function 견줌(p, 날들, 금액들) {
  for (const [이름, 날] of 날들) { const c = await 칸(p, 이름); await c.fill(날) }
  const 한벌 = async (i) => { for (const x of 금액들) { const c = await 칸(p, x[0]); await 친다(p, c, x[i]) } await 벗어남(p); return 화면글(p) }
  const 숫자 = await 한벌(1)
  const 단위 = await 한벌(2)
  return { 숫자, 단위 }
}

console.log('① ⚖️ 하도급 적정성 — PC 1280')
{
  const { ctx, p, 오류 } = await 새쪽(1280, 900, false)
  await p.goto(BASE + '/tools/subcontract-check', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('.tool .tl-row', { timeout: 15000 })
  const 금액들 = [['하도급계약금액', '180000000', '1억 8천만'], ['도급금액 중 하도급부분 상당금액', '250000000', '2억 5천만'], ['하도급부분의 발주자 예정가격', '260000000', '2억 6천만'],
    ['도급금액', '1200000000', '12억'], ['산출내역서 총 노무비', '300000000', '3억'], ['우리가 직접 시공할 부분의 노무비', '70000000', '7천만']]
  const r = await 견줌(p, [], 금액들)
  ok('숫자로 넣은 것 = 억 · 만으로 넣은 것(화면 전체 글)', r.숫자 === r.단위 && r.숫자.length > 200, [r.숫자.slice(0, 200), r.단위.slice(0, 200)])
  ok('하도급금액 ÷ 상당금액 72% 가 나옴(셈이 정말 억 단위)', /72(\.0+)?\s?%/.test(r.단위), r.단위.slice(0, 400))
  ok('칸은 쉼표 숫자 «180,000,000» · 줄 «= 1억 8,000만 원»', (await (await 칸(p, '하도급계약금액')).inputValue()) === '180,000,000' && (await 줄(p, '하도급계약금액')) === '= 1억 8,000만 원', [await (await 칸(p, '하도급계약금액')).inputValue(), await 줄(p, '하도급계약금액')])
  await 친다(p, await 칸(p, '하도급계약금액'), '1억 8천만')
  ok('치는 동안 친 글 그대로 · 줄 «= 1억 8,000만 원 (180,000,000원)»', (await (await 칸(p, '하도급계약금액')).inputValue()) === '1억 8천만' && (await 줄(p, '하도급계약금액')) === '= 1억 8,000만 원 (180,000,000원)', await 줄(p, '하도급계약금액'))
  ok('옛 옆 글(kt-won «1억 8,000만 원») 없음 — 줄 하나', (await p.locator('.tool .kt-won').count()) === 0, await p.locator('.tool .kt-won').count())
  await 벗어남(p)
  await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForSelector('.tool .tl-row', { timeout: 15000 }); await p.waitForTimeout(300)
  ok('새로고침해도 «180,000,000» · 같은 화면 글(숫자 글로 남김)', (await (await 칸(p, '하도급계약금액')).inputValue()) === '180,000,000' && (await 화면글(p)) === r.단위, [await (await 칸(p, '하도급계약금액')).inputValue()])
  if (OUT) { await 친다(p, await 칸(p, '하도급계약금액'), '1억 8천만'); await (await 칸(p, '하도급계약금액')).scrollIntoViewIfNeeded(); await p.evaluate(() => window.scrollBy(0, -120)); await p.waitForTimeout(300); await p.screenshot({ path: OUT + '/계약_하도급적정성_PC.png' }) }
  ok('오류 0(①)', !오류.length, 오류)
  await ctx.close()
}

console.log('② 📅 낙찰 뒤 할 일 · ③ ⏱ 지체상금 · ④ 🛡 하자보수보증금 — PC 1280')
{
  const { ctx, p, 오류 } = await 새쪽(1280, 900, false)
  await p.goto(BASE + '/tools/after-award', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('.tool .tl-row', { timeout: 15000 })
  let r = await 견줌(p, [['낙찰 통지 받은 날', '2026-11-02'], ['착공(예정)일', '2026-11-20']],
    [['도급(계약)금액', '850000000', '8억 5천만'], ['추정가격', '772727272', '7억 7,272만 7,272'], ['하도급금액', '120000000', '1억 2천만']])
  ok('② 낙찰 뒤 할 일 — 숫자 = 억 · 만(할 일 목록까지)', r.숫자 === r.단위 && /하도급/.test(r.단위) && r.숫자.length > 300, [r.숫자.length, r.단위.length])
  await p.goto(BASE + '/tools/delay-penalty', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('.tool .tl-row', { timeout: 15000 })
  r = await 견줌(p, [['준공기한', '2026-09-30'], ['준공검사 합격일', '2026-10-20']], [['계약금액', '500000000', '5억'], ['검사 받고 인수한 기성부분', '120000000', '1억 2천만']])
  ok('③ 지체상금 — 숫자 = 억 · 만 · 셈 기준 380,000,000 원', r.숫자 === r.단위 && /380,000,000/.test(r.단위), r.단위.slice(0, 400))
  await p.goto(BASE + '/tools/defect-period', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('.tool .tl-row', { timeout: 15000 })
  r = await 견줌(p, [['시작일', '2026-10-01']], [['계약금액', '300000000', '3억']])
  ok('④ 하자보수보증금 — 숫자 = 억 · 만 · 3% = 9,000,000', r.숫자 === r.단위 && /9,000,000/.test(r.단위), r.단위.slice(0, 300))
  ok('오류 0(②③④)', !오류.length, 오류)
  await ctx.close()
}

console.log('⑤ 🤝 공동도급 나누기 — PC 1280')
{
  const { ctx, p, 오류 } = await 새쪽(1280, 900, false)
  await p.goto(BASE + '/tools/joint-split', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('.tool .tl-row', { timeout: 15000 })
  const 구 = (i, 이름) => p.locator('.jvs-m').nth(i).locator('label', { hasText: 이름 }).locator('input').first()
  await 구(0, '지분').fill('60'); await 구(1, '지분').fill('40')
  const 한벌 = async (i) => {
    for (const [이름, 숫자, 단위] of [['계약금액', '1000000000', '10억'], ['이번 회 기성금', '300000000', '3억']]) await 친다(p, await 칸(p, 이름), i === 1 ? 숫자 : 단위)
    await 친다(p, 구(0, '받은 선금'), i === 1 ? '200000000' : '2억')
    await 친다(p, 구(1, '받은 선금'), i === 1 ? '80000000' : '8천만')
    await 친다(p, 구(0, '지난번까지 받은 기성'), i === 1 ? '150000000' : '1억 5천만')
    await 벗어남(p)
    return 화면글(p)
  }
  const 숫자 = await 한벌(1), 단위 = await 한벌(2)
  ok('숫자 = 억 · 만(구성원별 받을 돈까지)', 숫자 === 단위 && 숫자.length > 200, [숫자.slice(0, 200), 단위.slice(0, 200)])
  const 받을 = await p.locator('.jvs-pay').innerText().catch(() => '')
  ok('대표사 이번 회 180,000,000(3억 × 60%)이 나옴', /180,000,000/.test(받을), 받을)
  ok('구성원 칸 «200,000,000» · 줄 «= 2억 원»', (await 구(0, '받은 선금').inputValue()) === '200,000,000' && (await p.locator('.jvs-m').nth(0).locator('label', { hasText: '받은 선금' }).locator('.amt-read').innerText()).trim() === '= 2억 원', await 구(0, '받은 선금').inputValue())
  ok('오류 0(⑤)', !오류.length, 오류)
  await ctx.close()
}

console.log('⑥ 예전에 친 그대로 남은 글(use칸 localStorage) — «3억 8,500만»')
{
  const { ctx, p, 오류 } = await 새쪽(1280, 900, false, { 'kcm.calc.defect-period': JSON.stringify({ 계약: '3억 8,500만', 시작: '2026-10-01' }) })
  await p.goto(BASE + '/tools/defect-period', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('.tool .tl-row', { timeout: 15000 }); await p.waitForTimeout(400)
  const 값 = await (await 칸(p, '계약금액')).inputValue()
  const 글 = await 화면글(p)
  ok('남은 «3억 8,500만» → 칸 «385,000,000» · 줄 «= 3억 8,500만 원» · 3% = 11,550,000(예전: 38,500 → 1,155)', 값 === '385,000,000' && (await 줄(p, '계약금액')) === '= 3억 8,500만 원' && /11,550,000/.test(글), [값, await 줄(p, '계약금액'), 글.slice(0, 300)])
  ok('오류 0(⑥)', !오류.length, 오류)
  await ctx.close()
}

console.log('⑦ 폰 390 · 320')
for (const [w, h] of [[390, 844], [320, 640]]) {
  for (const [u, 이름, 글] of [['subcontract-check', '하도급계약금액', '1억 8천만'], ['after-award', '도급(계약)금액', '8억 5천만'], ['delay-penalty', '계약금액', '5억'], ['defect-period', '계약금액', '3억'], ['joint-split', '계약금액', '10억']]) {
    const { ctx, p, 오류 } = await 새쪽(w, h)
    await p.goto(BASE + '/tools/' + u, { waitUntil: 'domcontentloaded' })
    await p.waitForSelector('.tool .tl-row', { timeout: 15000 })
    const c = await 칸(p, 이름)
    await c.scrollIntoViewIfNeeded()
    await 친다(p, c, 글)
    const z = await 줄(p, 이름)
    if (u === 'joint-split') { const s = p.locator('.jvs-m').nth(0).locator('label', { hasText: '받은 선금' }).locator('input').first(); await s.scrollIntoViewIfNeeded(); await 친다(p, s, '1억 2천만') }
    ok(`폰 ${w} ${u}: 숫자 자판 · 줄 보임 · 넘침 0 · 오류 0`, (await c.getAttribute('inputmode')) === 'numeric' && /^= /.test(z || '') && (await 넘침(p)) <= 0 && !오류.length, [z, await 넘침(p), 오류])
    if (OUT && w === 390 && u === 'joint-split') { await p.addStyleTag({ content: '.insa{display:none!important}' }); await p.locator('.jvs-m').first().scrollIntoViewIfNeeded(); await p.evaluate(() => window.scrollBy(0, -140)); await p.waitForTimeout(300); await p.screenshot({ path: OUT + '/계약_공동도급_폰390.png' }) }
    await ctx.close()
  }
}

await b.close()
console.log(`\n${bad ? '✗' : '✓'} 시험_계약금액화면 ${n - bad}/${n}`)
process.exit(bad ? 1 : 0)
