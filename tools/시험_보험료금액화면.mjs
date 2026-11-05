/**
 * 🧪 G543 (2026-11-05) 고용 · 산재 보험료 계산기(/tools/boheomryo) 금액 칸 다섯 — 억 · 만으로 넣어도 읽음 · 칸 아래 읽은 줄 — 화면 시험
 *   구운 사이트(dist)를 띄운 뒤:  LANG=C.UTF-8 node tools/시험_보험료금액화면.mjs [주소=http://127.0.0.1:4998]
 *   이용자 점검(11-05): 총공사금액에 «12억 5천만» → 125원 · «3억 8,500만» → 38,500원으로 셈(칠 때마다 숫자만 남김 · 바로투찰 G542 와 같은 탈)
 *   ① PC 1280 총공사금액 — 숫자로 치면 예전처럼 쉼표 · «= 12억 5,000만 원» 줄(옛 «12억 5,000만원» 작은 글은 뺌 — 두 줄 안 되게)
 *      / «12억 5천만» · «12.5억» · 붙여넣은 «1,250,000,000원» → 숫자와 같은 보험료 · 벗어나면 쉼표 숫자 · 새로고침해도 그대로(기록은 수)
 *      / 못 읽는 «삼억» → ⚠(치는 동안) → 빈 칸
 *   ② 실제 보수총액 «3억 2천만» · 실업 몫 없는 보수 «1,500만» = 숫자와 같은 보험료
 *   ③ 이미 낸 개산 «1,234만» → 확정 정산이 숫자와 같음
 *   ④ 📒 낸 금액 «1,234만» → ✓ 냈음 기록 → «✅ 12,340,000원» (칸 · 단추 한 줄 · 읽은 줄은 그 아래)
 *   ⑤ 폰 390 · 360 · 320 넘침 0 · 숫자 자판(inputmode=numeric)  ⑥ 오류 0
 *   OUT=폴더 면 화면 사진(PC · 폰)
 * 인터넷 안 부름(파이어베이스 · 광고 · 애널리틱스 막음) · 이 시험 브라우저 안에서만 적음.
 */
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const BASE = process.argv[2] || 'http://127.0.0.1:4998'
const OUT = process.env.OUT || ''

let bad = 0, n = 0
const ok = (이름, c, got) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (c || got === undefined ? '' : ' = ' + JSON.stringify(got).slice(0, 400))) }
const UA = { PC: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36', 폰: 'Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36' }
const b = await chromium.launch()

async function 새쪽(w, h, 폰 = true) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', isMobile: 폰, hasTouch: 폰, userAgent: 폰 ? UA.폰 : UA.PC, deviceScaleFactor: OUT ? 2 : 1 })
  await ctx.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|googlesyndication|geojs/, (r) => r.fulfill({ status: 200, body: '' }))
  await ctx.route(/firebaseio\.com|firebasedatabase\.app/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: r.request().method() === 'GET' ? 'null' : (r.request().postData() || 'null') }))
  await ctx.addInitScript(() => { try { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); sessionStorage.setItem('kcm_notice_seen', '2026-10-업체'); sessionStorage.setItem('kcm_visit_s', '1') } catch (e) { /* 없음 */ } })
  const p = await ctx.newPage()
  const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
  p.on('dialog', (d) => d.dismiss())
  return { ctx, p, 오류 }
}
const 라벨 = (p, 글) => p.locator('.hm-row > label', { hasText: 글 }).first()
const 칸 = (p, 글) => 라벨(p, 글).locator('input').first()
const 줄 = async (p, 글) => { const l = 라벨(p, 글).locator('.amt-read'); return (await l.count()) ? { 글: (await l.first().innerText()).trim(), bad: /\bbad\b/.test(await l.first().getAttribute('class')) } : null }
const 합 = (p) => p.evaluate(() => { const s = document.querySelector('.hm-sum'); return s ? s.innerText.replace(/\s+/g, ' ').trim() : '' })
const 넘침 = (p) => p.evaluate(() => document.documentElement.scrollWidth - innerWidth)
const 지우고친다 = async (p, c, 글) => { await c.click(); await c.press('Control+A'); await c.press('Backspace'); if (글) await p.keyboard.type(글, { delay: 15 }); await p.waitForTimeout(250) }
const 벗어남 = async (p) => { await p.evaluate(() => document.activeElement && document.activeElement.blur()); await p.waitForTimeout(200) }
const 총 = '총공사금액 (부가세'   /* «보수총액 정하는 법» 고르기 글에도 «총공사금액» 이 있어 더 좁게 */

console.log('① PC 1280 — 총공사금액')
let 합125 = ''
{
  const { ctx, p, 오류 } = await 새쪽(1280, 900, false)
  await p.goto(BASE + '/tools/boheomryo', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('.hm-sum', { timeout: 15000 })
  await 지우고친다(p, 칸(p, 총), '1250000000')
  ok('숫자로 치면 예전처럼 칠 때마다 쉼표 «1,250,000,000»', (await 칸(p, 총).inputValue()) === '1,250,000,000', await 칸(p, 총).inputValue())
  ok('칸 아래 «= 12억 5,000만 원» 한 줄(옛 작은 글 «12억 5,000만원» 은 뺌 — 두 줄 안 됨)', (await 줄(p, 총))?.글 === '= 12억 5,000만 원' && (await 라벨(p, 총).locator('small').count()) === 0, [await 줄(p, 총), await 라벨(p, 총).innerText()])
  합125 = await 합(p)
  ok('보험료가 나옴(보수총액 · 합계)', /보수총액 \d/.test(합125) && /보험료 합계 [1-9]/.test(합125), 합125)
  await 지우고친다(p, 칸(p, 총), '12억 5천만')
  ok('«12억 5천만» 친 글 그대로 · 줄 «= 12억 5,000만 원 (1,250,000,000원)»', (await 칸(p, 총).inputValue()) === '12억 5천만' && (await 줄(p, 총))?.글 === '= 12억 5,000만 원 (1,250,000,000원)', [await 칸(p, 총).inputValue(), await 줄(p, 총)])
  ok('보험료 = 숫자로 친 것과 같음(예전: 125원으로 셈)', (await 합(p)) === 합125, [await 합(p), 합125])
  await 벗어남(p)
  ok('벗어나면 «1,250,000,000» · 같은 보험료', (await 칸(p, 총).inputValue()) === '1,250,000,000' && (await 합(p)) === 합125, [await 칸(p, 총).inputValue(), await 합(p)])
  for (const 글 of ['12.5억', '1,250,000,000원', '12억5000만원']) {
    await 칸(p, 총).fill(글); await p.waitForTimeout(300)
    ok(`붙여넣은 «${글}» → 같은 보험료`, (await 합(p)) === 합125, await 합(p))
  }
  await 벗어남(p)
  await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForSelector('.hm-sum', { timeout: 15000 }); await p.waitForTimeout(400)
  ok('새로고침해도 «1,250,000,000» · 같은 보험료(기록은 수로)', (await 칸(p, 총).inputValue()) === '1,250,000,000' && (await 합(p)) === 합125, [await 칸(p, 총).inputValue(), await 합(p)])
  await 지우고친다(p, 칸(p, 총), '삼억')
  const z = await 줄(p, 총)
  ok('«삼억» → 치는 동안 ⚠ 줄(빨강)', z && z.bad && /읽지 못했습니다/.test(z.글), z)
  await 벗어남(p)
  ok('벗어나면 빈 칸 · 줄 없음', (await 칸(p, 총).inputValue()) === '' && (await 줄(p, 총)) === null, [await 칸(p, 총).inputValue(), await 줄(p, 총)])
  ok('폰 숫자 자판 그대로(inputmode=numeric)', (await 칸(p, 총).getAttribute('inputmode')) === 'numeric')

  console.log('② 실제 보수총액 · 실업 몫 없는 보수')
  await p.locator('.hm-row > label', { hasText: '보수총액 정하는 법' }).locator('select').selectOption('bosu')
  await p.waitForTimeout(300)
  const 보 = '보수총액 (원', 제 = '실업급여 몫이 없는 보수'
  await 지우고친다(p, 칸(p, 보), '320000000')
  const 합보 = await 합(p)
  await 지우고친다(p, 칸(p, 보), '3억 2천만')
  ok('보수총액 «3억 2천만» → 줄 «= 3억 2,000만 원 (320,000,000원)» · 같은 보험료', (await 줄(p, 보))?.글 === '= 3억 2,000만 원 (320,000,000원)' && (await 합(p)) === 합보 && /보험료 합계 [1-9]/.test(합보), [await 줄(p, 보), await 합(p), 합보])
  await 지우고친다(p, 칸(p, 제), '15000000')
  const 합제 = await 합(p)
  await 지우고친다(p, 칸(p, 제), '1,500만')
  ok('실업 몫 없는 보수 «1,500만» → 같은 보험료(숫자 15000000 과) · 줄 보임', (await 합(p)) === 합제 && 합제 !== 합보 && (await 줄(p, 제))?.글 === '= 1,500만 원 (15,000,000원)', [await 합(p), 합제, 합보, await 줄(p, 제)])
  await 벗어남(p)

  console.log('③ 이미 낸 개산 → 확정 정산')
  const 개 = '이미 낸 개산보험료'
  await 지우고친다(p, 칸(p, 개), '12340000')
  const 합개 = await 합(p)
  await 지우고친다(p, 칸(p, 개), '1,234만')
  ok('«1,234만» → 확정 정산이 숫자와 같음 · 줄 보임', /확정 정산/.test(합개) && (await 합(p)) === 합개 && (await 줄(p, 개))?.글 === '= 1,234만 원 (12,340,000원)', [await 합(p), 합개, await 줄(p, 개)])
  await 지우고친다(p, 칸(p, 개), '')
  await 벗어남(p)

  console.log('④ 📒 낸 금액 기록')
  const 낸 = p.locator('input[aria-label$="개산 낸 금액"]').first()
  await 지우고친다(p, 낸, '1,234만')
  const 행 = p.locator('.hm-paid-r', { has: 낸 })
  const 낸줄 = 행.locator('.amt-read')
  ok('낸 금액 «1,234만» → 줄 «= 1,234만 원 (12,340,000원)»', (await 낸줄.count()) === 1 && (await 낸줄.innerText()).trim() === '= 1,234만 원 (12,340,000원)', (await 낸줄.count()) ? await 낸줄.innerText() : null)
  const 자리 = await p.evaluate(() => { const i = document.querySelector('input[aria-label$="개산 낸 금액"]'); const r = i.closest('.hm-paid-r'); const bt = [...r.querySelectorAll('button')].find((x) => /냈음 기록/.test(x.textContent)); const l = r.querySelector('.amt-read'); const a = i.getBoundingClientRect(), c = bt.getBoundingClientRect(), d = l.getBoundingClientRect(); return { 한줄: Math.abs(a.top - c.top) < 12, 아래: d.top >= Math.max(a.bottom, c.bottom) - 2 } })
  ok('칸 · «✓ 냈음 기록» 단추는 한 줄 · 읽은 줄은 그 아래', 자리.한줄 && 자리.아래, 자리)
  await 행.locator('button', { hasText: '냈음 기록' }).click()
  await p.waitForTimeout(400)
  const 기록 = await p.locator('.hm-paid-r').first().innerText()
  ok('✓ 냈음 기록 → «✅ 12,340,000원»(예전: 1,234원)', /✅ 12,340,000원/.test(기록), 기록)
  ok('PC 1280 넘침 0', (await 넘침(p)) <= 0, await 넘침(p))
  if (OUT) {
    await p.evaluate(() => { const x = document.querySelector('.insa-x'); if (x) x.click() })
    await p.locator('.hm-row > label', { hasText: '보수총액 정하는 법' }).locator('select').selectOption('nomu')
    await p.waitForTimeout(300)
    await 지우고친다(p, 칸(p, 총), '12억 5천만')
    await 라벨(p, 총).scrollIntoViewIfNeeded(); await p.evaluate(() => window.scrollBy(0, -160)); await p.waitForTimeout(400)
    await p.screenshot({ path: OUT + '/보험료_금액칸_PC.png' })
  }
  ok('오류 0(①~④)', !오류.length, 오류)
  await ctx.close()
}

console.log('⑤ 폰 390 · 360 · 320')
for (const [w, h] of [[390, 844], [360, 740], [320, 640]]) {
  const { ctx, p, 오류 } = await 새쪽(w, h)
  await p.goto(BASE + '/tools/boheomryo', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('.hm-sum', { timeout: 15000 })
  await 칸(p, 총).scrollIntoViewIfNeeded()
  await 지우고친다(p, 칸(p, 총), '1250000000')
  ok(`폰 ${w}: 숫자 자판 · 칠 때마다 쉼표 · 줄 «= 12억 5,000만 원» · PC 와 같은 보험료`, (await 칸(p, 총).getAttribute('inputmode')) === 'numeric' && (await 칸(p, 총).inputValue()) === '1,250,000,000' && (await 줄(p, 총))?.글 === '= 12억 5,000만 원' && (await 합(p)) === 합125, [await 칸(p, 총).inputValue(), await 줄(p, 총), await 합(p)])
  await 칸(p, 총).fill('12억 5천만원'); await p.waitForTimeout(300)
  ok(`폰 ${w}: 붙여넣은 «12억 5천만원» → 같은 보험료`, (await 합(p)) === 합125, await 합(p))
  const 낸 = p.locator('input[aria-label$="개산 낸 금액"]').first()
  await 낸.scrollIntoViewIfNeeded(); await 낸.fill('삼백만'); await p.waitForTimeout(300)
  ok(`폰 ${w}: 낸 금액 ⚠ 줄도 화면 안(넘침 0)`, (await p.locator('.hm-paid-r .amt-read.bad').count()) === 1 && (await 넘침(p)) <= 0, await 넘침(p))
  ok(`폰 ${w} 넘침 0`, (await 넘침(p)) <= 0, await 넘침(p))
  if (OUT && w === 390) {
    await p.evaluate(() => { const x = document.querySelector('.insa-x'); if (x) x.click() })
    await 낸.fill('1,234만'); await p.waitForTimeout(300)
    await 칸(p, 총).fill('12억 5천만'); await p.waitForTimeout(300)
    await 라벨(p, 총).scrollIntoViewIfNeeded(); await p.evaluate(() => window.scrollBy(0, -120)); await p.waitForTimeout(400)
    await p.screenshot({ path: OUT + '/보험료_금액칸_폰390.png' })
    await 낸.scrollIntoViewIfNeeded(); await p.evaluate(() => window.scrollBy(0, -200)); await p.waitForTimeout(300)
    await p.screenshot({ path: OUT + '/보험료_낸금액_폰390.png' })
  }
  ok(`오류 0(폰 ${w})`, !오류.length, 오류)
  await ctx.close()
}

await b.close()
console.log(`\n${bad ? '✗' : '✓'} 시험_보험료금액화면 ${n - bad}/${n}`)
process.exit(bad ? 1 : 0)
