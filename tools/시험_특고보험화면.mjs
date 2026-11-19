// 🧪 G788 — 특고(노무제공자) 산재 · 고용보험료 계산기 화면 (B=http://127.0.0.1:5795 node tools/시험_특고보험화면.mjs)
//   PC 1280 · 폰 390 · 320 — 예시 다섯 · 손으로 넣기(날 · 달 · 한 달 내내 · 화물차 · 65세 · 여러 명) · 저장 · 되돌리기 · 넘침 · 오류 · 금지 말 · 어두운 화면 · PDF(그림) · 미리 구운 쪽
//   캡처: C=폴더
import { createRequire } from 'module'
const require = createRequire(process.env.PW || '/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const B = process.env.B || 'http://127.0.0.1:5795'
const C = process.env.C || ''
let 통과 = 0, 틀림 = 0
const 봄 = (v, 이름, 덧 = '') => { if (v) 통과++; else { 틀림++; console.log(`  ✗ ${이름} ${덧}`) } }

const b = await chromium.launch()
async function 새쪽(w, h, 어둠 = false) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: w < 500 ? 2 : 1, colorScheme: 어둠 ? 'dark' : 'light', acceptDownloads: true })
  const p = await ctx.newPage()
  await p.addInitScript(() => { Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false }) })
  await p.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|geojs|firebaseio|firebasedatabase|identitytoolkit|securetoken|daumcdn|coupang/, (r) => r.fulfill({ status: 200, body: 'null' }))
  const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e.message || e)))
  p.on('console', (m) => { if (m.type() === 'error' && !/net::|Failed to load resource|favicon/i.test(m.text())) 오류.push(m.text()) })
  return { p, 오류, ctx }
}
const 넘침 = (p) => p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
const 큰글 = (p) => p.evaluate(() => (document.querySelector('.sl-res') || {}).textContent || '')
const 글 = (p) => p.evaluate(() => document.body.innerText)
async function 예시(p, 이름) {
  const d = p.locator('details.iy-exd')
  if (!(await d.evaluate((e) => e.open))) await p.locator('details.iy-exd > summary').click()
  await p.getByRole('button', { name: 이름, exact: true }).click()
  await p.waitForTimeout(250)
}
const 단추 = (p, 무리, 이름) => p.locator(`.iy-seg[aria-label="${무리}"] button`, { hasText: 이름 }).click()

for (const [w, h, 이름] of [[1280, 900, 'PC'], [390, 844, '폰'], [320, 640, '좁은 폰']]) {
  console.log(`■ ${이름} ${w}`)
  const { p, 오류, ctx } = await 새쪽(w, h)
  await p.goto(`${B}/tools/teukgo-boheom`, { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('h1.tl-h1', { timeout: 20000 })
  await p.evaluate(() => { try { localStorage.removeItem('kcm_teukgo') } catch (e) { /* */ } })
  await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForSelector('h1.tl-h1')
  봄((await p.textContent('h1.tl-h1')).includes('특고 산재 · 고용보험료 계산기'), '제목')
  봄((await p.title()).includes('특고(노무제공자) 산재 · 고용보험료 계산기'), '탭 제목', await p.title())
  봄(!(await p.$('.sl-res')), '처음엔 결과 없음(며칠 · 날 빈칸)')
  봄(await p.locator('.iy-seg[aria-label="직종"] button.on').textContent() === '🚜 건설기계 조종사', '처음 직종 = 건설기계 조종사')

  await 예시(p, '굴착기 4일')
  let t = await 글(p)
  봄((await 큰글(p)).includes('본인 몫 9,480원 · 회사 몫 9,480원') && (await 큰글(p)).includes('합 18,960원'), '예시 굴착기 4일 — 본인 9,480 · 회사 9,480', await 큰글(p))
  봄(t.includes('93,766원 × 4일 = 375,064원') && t.includes('375,064원 × 1.73% = 6,488.6원 → 6,480원') && t.includes('375,064원 × 0.8% = 3,000.5원 → 3,000원'), '예시 a 셈식(산재 · 고용)')
  봄(t.includes('단기노무제공자') && t.includes('🚜 건설기계 조종사 · ') && t.includes('4일(한 달이 안 되는 계약)'), '예시 a — 단기 · 조건 줄')
  봄(t.includes('매달 고지받는 사업은 월 중간에 시작한 달을 그다음 달부터 매깁니다(징수법 제16조의4'), '며칠 — 매달 고지 사업 알림(제16조의4)')
  await 예시(p, '덤프 한 달')
  봄((await 큰글(p)).includes('본인 몫 71,160원 · 회사 몫 71,160원'), '예시 덤프 한 달 — 71,160', await 큰글(p))
  봄(!(await 글(p)).includes('징수법 제16조의4'), '한 달 내내엔 제16조의4 알림 없음')
  봄((await 글(p)).includes('2,813,000원 × 1.73% = 48,664.9원 → 48,660원') && (await 글(p)).includes('2,813,000원 × 0.8% = 22,504원 → 22,500원'), '예시 b 셈식')
  await 예시(p, '살수차 10일')
  t = await 글(p)
  봄((await 큰글(p)).includes('본인 몫 16,220원 · 회사 몫 16,220원'), '예시 살수차 10일 — 16,220', await 큰글(p))
  봄(t.includes('🧾 고용보험\n없음') || /🧾 고용보험\s*없음/.test(t), '살수차 — 고용보험 없음 칸')
  봄(!(await p.$('.sl-in input[type=checkbox]')), '화물차엔 65세 칸 없음')
  봄((await p.locator('.iy-seg[aria-label="직종"] button.on').textContent()).includes('건설현장 화물차'), '예시가 직종 단추도 바꿈')
  await 예시(p, '65세 넘어 새 계약 · 기중기 한 달')
  t = await 글(p)
  봄((await 큰글(p)).includes('본인 몫 48,660원 · 회사 몫 48,660원') && t.includes('만 65세가 넘어 새로 계약하면'), '예시 65세 — 48,660 · 고용 없음 까닭', await 큰글(p))
  봄(await p.locator('.sl-in input[type=checkbox]').isChecked(), '65세 칸이 켜짐')
  await 예시(p, '장비 기사 3명 · 15일')
  t = await 글(p)
  봄((await 큰글(p)).includes('본인 몫 106,740원 · 회사 몫 106,740원') && t.includes('👥 3명') && t.includes('한 사람 몫(본인 35,580원 · 회사 35,580원) × 3명'), '예시 3명 · 15일 — 106,740', await 큰글(p))
  봄(await 넘침(p) <= 0, '가로 넘침 없음(예시)', String(await 넘침(p)))

  // 손으로 — 처음부터 → 7일 → 2027년 1월분(잠정) → 한 달 내내 → 화물차 → 여러 명
  await p.getByRole('button', { name: '처음부터' }).click()
  await p.getByRole('button', { name: '지우기', exact: true }).click()
  await p.waitForTimeout(150)
  봄(!(await p.$('.sl-res')), '지우기 → 결과 없음')
  await p.fill('input[aria-label="일한 날"]', '7')
  await p.waitForTimeout(150)
  봄((await 큰글(p)).includes('본인 몫 16,600원 · 회사 몫 16,600원'), '7일 — 656,362 → 산재 11,350 + 고용 5,250 = 16,600', await 큰글(p))
  await p.fill('input[aria-label="일한 날"]', '31')
  await p.waitForTimeout(150)
  봄((await 큰글(p)).includes('일한 날을 넣으세요(1~30일)') || (await p.inputValue('input[aria-label="일한 날"]')) === '31', '31일 → 빈 알림', await 큰글(p))
  await p.fill('input[aria-label="일한 날"]', '7일')
  봄((await p.inputValue('input[aria-label="일한 날"]')) === '7', '날 칸 — 숫자만')
  const 달값 = await p.$$eval('select[aria-label="몇 월분"] option', (o) => o.map((x) => x.value))
  봄(달값[0] === '2026-07' && 달값.includes('2026-11'), '몇 월분 — 2026.7.부터', 달값.join(','))
  if (달값.includes('2027-01')) {
    await p.selectOption('select[aria-label="몇 월분"]', '2027-01')
    await p.waitForTimeout(150)
    봄((await 글(p)).includes('2027년 산재 기준보수 · 직종 요율 고시를 아직 넣지 않았습니다'), '2027년 1월분 — 잠정 알림')
    await p.selectOption('select[aria-label="몇 월분"]', '2026-11')
  }
  await 단추(p, '일한 기간', '한 달 내내')
  await p.waitForTimeout(150)
  봄((await 큰글(p)).includes('본인 몫 71,160원'), '한 달 내내 → 71,160', await 큰글(p))
  봄(!(await p.$('input[aria-label="일한 날"]')), '한 달 내내엔 날 칸 숨음')
  await 단추(p, '직종', '건설현장 화물차')
  await p.waitForTimeout(150)
  봄((await 큰글(p)).includes('본인 몫 48,660원'), '화물차 한 달 → 48,660(산재만)', await 큰글(p))
  await p.locator('details.sl-more > summary').click()
  await p.fill('input[aria-label="같은 조건 사람 수"]', '2')
  await p.waitForTimeout(150)
  봄((await 큰글(p)).includes('본인 몫 97,320원 · 회사 몫 97,320원'), '2명 → 97,320', await 큰글(p))
  // 저장 — 다시 열어도 그대로
  await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForSelector('h1.tl-h1'); await p.waitForTimeout(300)
  봄((await 큰글(p)).includes('본인 몫 97,320원'), '다시 열어도 그대로(이 브라우저에 저장)', await 큰글(p))
  // 되돌리기 — 적어 둔 것이 있을 때 예시 → «↩ 내가 적어 둔 것으로»
  await 예시(p, '굴착기 4일')
  await p.getByRole('button', { name: '↩ 내가 적어 둔 것으로 되돌리기' }).click()
  await p.waitForTimeout(150)
  봄((await 큰글(p)).includes('본인 몫 97,320원'), '되돌리기 → 내 것(97,320)', await 큰글(p))
  t = await 글(p)
  봄(!/클로드/.test(t), '«클로드» 없음')
  const 무료 = await p.evaluate(() => [...document.querySelectorAll('.tg, .tg *')].some((e) => e.children.length === 0 && /무료/.test(e.textContent)))
  봄(!무료, '새 화면 안에 «무료» 없음')
  봄(await 넘침(p) <= 0, '가로 넘침 없음(손으로 뒤)', String(await 넘침(p)))
  // 글이 칸을 벗어나지 않음 — 결과 칸 · 단추
  const 삐짐 = await p.evaluate(() => [...document.querySelectorAll('.sl-facts > div, .iy-seg button, .sl-res, .tg-sum')].filter((e) => e.scrollWidth > e.clientWidth + 1).map((e) => e.className || e.textContent.slice(0, 20)))
  봄(!삐짐.length, '칸 넘친 글 없음', 삐짐.join(' | '))
  if (w === 1280) {
    // 📄 PDF(그림) — 받기가 생기고 이름 · 크기
    await 예시(p, '굴착기 4일')
    const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 30000 }), p.getByRole('button', { name: '📄 PDF' }).click()])
    const 경로 = await dl.path()
    const fs = await import('node:fs')
    const 크기 = fs.statSync(경로).size
    const 머리 = fs.readFileSync(경로).subarray(0, 5).toString()
    봄(/^특고보험료_\d{4}-\d{2}-\d{2}\.pdf$/.test(dl.suggestedFilename()) && 머리 === '%PDF-' && 크기 > 20000, 'PDF 받기 — 이름 · %PDF · 크기', `${dl.suggestedFilename()} ${크기}`)
    if (C) fs.copyFileSync(경로, `${C}/특고보험료_예시.pdf`)
  }
  봄(!오류.length, '오류 없음', 오류.join(' | '))
  if (C && w !== 320) {
    await 예시(p, '굴착기 4일')
    await p.evaluate(() => document.querySelector('.sl-out').scrollIntoView({ block: 'start' }))
    await p.evaluate(() => window.scrollBy(0, -70))
    await p.waitForTimeout(300)
    await p.screenshot({ path: `${C}/특고보험료_${이름}.png`, fullPage: false })
    await p.evaluate(() => window.scrollTo(0, 0))
    await p.waitForTimeout(200)
    await p.screenshot({ path: `${C}/특고보험료_${이름}_위.png`, fullPage: false })
  }
  await ctx.close()
}

console.log('■ 어두운 화면 · 도구 탭 · 찾기 · 미리 구운 쪽')
{
  const { p, 오류, ctx } = await 새쪽(390, 844, true)
  await p.goto(`${B}/tools/teukgo-boheom`, { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('h1.tl-h1')
  await 예시(p, '살수차 10일')
  const 색 = await p.evaluate(() => { const e = document.querySelector('.sl-res'); const s = getComputedStyle(e); return [s.color, s.backgroundColor] })
  봄(색[0] !== 색[1], '어두운 화면 글자 ≠ 바탕', 색.join(' / '))
  봄(await 넘침(p) <= 0, '어두운 화면 넘침 없음')
  봄(!오류.length, '어두운 화면 오류 없음', 오류.join(' | '))
  await p.goto(`${B}/tools`, { waitUntil: 'domcontentloaded' })
  await p.waitForTimeout(1500)
  봄(!!(await p.$('a[href="/tools/teukgo-boheom"]')), '도구 탭에 카드 고리')
  await p.goto(`${B}/tools/haemada`, { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('h1', { timeout: 20000 }); await p.waitForTimeout(800)
  const 해고리 = await p.evaluate(() => [...document.querySelectorAll('a[href="/tools/teukgo-boheom"]')].map((a) => a.textContent.trim()))
  봄(해고리.includes('특고 산재 · 고용보험료') && (await 글(p)).includes('노무제공자(특고) 기준보수 · 산재 직종 요율'), '해마다 바뀌는 값 — 특고 줄 · 쓰는 화면 이름', 해고리.join(' | '))
  await ctx.close()
  const r = await fetch(`${B}/tools/teukgo-boheom.html`).then((x) => x.text())
  봄(/<title>특고 산재 · 고용보험료 계산기/.test(r), '미리 구운 쪽 제목')
  봄(r.includes('FAQPage') && r.includes('9,480원') && r.includes('71,160원'), '미리 구운 쪽 FAQ · 예')
  봄(!/무료|클로드/.test(r.replace(/<script[\s\S]*?<\/script>/g, '')), '미리 구운 쪽 «무료» · «클로드» 없음')
}
await b.close()
console.log(`\n${틀림 ? '✗' : '✓'} 시험_특고보험화면 ${통과}/${통과 + 틀림}`)
if (틀림) process.exit(1)
