// 🧪 G789 (2026-11-19) 특고 산재 · 고용보험료 계산기 «극한» 화면 시험 — 소장님 「확인해봐 이것과 맞는지? 그리고, 극한 테스트 해줘」(카페 답 6,480원과 같은지)
//   구운 사이트를 띄운 뒤  LANG=C.UTF-8 B=http://127.0.0.1:5800 node tools/시험_특고보험극한.mjs   (클라우드 · Playwright)
//   너비 아홉(280 ~ 1920 · 배율 3) · 글자 160% · 이상한 글(«4일» · «-5» · «٤» · «４» · «<b>9</b>» …) · 단추 80번 · 달 30번 연타 · 저장 막힘 · 망가진 저장 다섯 ·
//   날짜 바꿈(2027년 7월 잠정 둘 · 12월 31일 23시 59분 · 시계가 2026년 3월인 폰 → 7월분) · 다른 화면 갔다 오기 · 새로 고침 · 키보드 · PDF 세 번 연타 → 받기 하나 · 인쇄 · 어두운 280px
import { createRequire } from 'module'
const require = createRequire('/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const B = process.env.B || 'http://127.0.0.1:5798'
const 길 = '/tools/teukgo-boheom'
let ok = 0, bad = 0
const 봄 = (c, m, 더 = '') => { if (c) ok++; else { bad++; console.log('  ✗', m, String(더).slice(0, 300)) } }
const b = await chromium.launch()
const 막을 = /googletagmanager|google-analytics|pagead2|adsbygoogle|geojs|firebaseio|firebasedatabase|identitytoolkit|securetoken|daumcdn|coupang/
async function 쪽(w, h, { 어둠 = false, 앞 = null, 저장막힘 = false, 지금 = null, 배 = 1 } = {}) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 배, colorScheme: 어둠 ? 'dark' : 'light', acceptDownloads: true })
  const p = await ctx.newPage()
  await p.addInitScript(() => { Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false }) })
  if (지금) await p.addInitScript((t) => { const 원 = Date; const 차 = t - 원.now(); class 가짜 extends 원 { constructor(...a) { super(...(a.length ? a : [원.now() + 차])) } static now() { return 원.now() + 차 } } window.Date = 가짜 }, 지금)
  if (저장막힘) await p.addInitScript(() => { const 막 = () => { throw new DOMException('막힘', 'SecurityError') }; Storage.prototype.getItem = 막; Storage.prototype.setItem = 막; Storage.prototype.removeItem = 막 })
  if (앞) await p.addInitScript((v) => { try { localStorage.setItem('kcm_teukgo', v) } catch (e) { /* */ } }, 앞)
  await p.route(막을, (r) => r.fulfill({ status: 200, body: 'null' }))
  const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e.message || e)))
  p.on('console', (m) => { if (m.type() === 'error' && !/net::|Failed to load resource|favicon/i.test(m.text())) 오류.push(m.text()) })
  await p.goto(B + 길, { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('h1.tl-h1', { timeout: 20000 })
  return { ctx, p, 오류 }
}
const 큰글 = (p) => p.evaluate(() => (document.querySelector('.sl-res') || {}).textContent || '')
const 넘침 = (p) => p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
const 삐짐 = (p) => p.evaluate(() => [...document.querySelectorAll('.tg .sl-facts > div, .tg .iy-seg button, .tg .sl-res, .tg .tg-sum, .tg .sl-why li, .tg select, .tg input')].filter((e) => e.getBoundingClientRect().right > document.documentElement.clientWidth + 1 || e.scrollWidth > e.clientWidth + 2).map((e) => (e.className || e.tagName) + ':' + (e.textContent || '').slice(0, 15)))
const 예시 = async (p, 이름) => { const d = p.locator('details.iy-exd'); if (!(await d.evaluate((e) => e.open))) await p.locator('details.iy-exd > summary').click(); await p.getByRole('button', { name: 이름, exact: true }).click(); await p.waitForTimeout(120) }
const 날칸 = 'input[aria-label="일한 날"]', 명칸 = 'input[aria-label="같은 조건 사람 수"]'

console.log('■ 화면 너비 아홉 · 확대(배율 3) — 넘침 · 삐짐 · 단추가 보임')
for (const [w, h, 배] of [[280, 600, 2], [320, 640, 3], [360, 740, 3], [390, 844, 3], [414, 896, 3], [768, 1024, 2], [1024, 768, 1], [1280, 900, 1], [1920, 1080, 1]]) {
  const { ctx, p, 오류 } = await 쪽(w, h, { 배 })
  for (const 이름 of ['굴착기 4일', '살수차 10일', '장비 기사 3명 · 15일', '65세 넘어 새 계약 · 기중기 한 달']) {
    await 예시(p, 이름)
    const s = await 삐짐(p), o = await 넘침(p)
    봄(o <= 0 && !s.length, `${w}px «${이름}» 넘침 0 · 삐짐 0`, `${o} ${s.join(' | ')}`)
  }
  const 단추 = await p.evaluate(() => { const r = document.querySelector('.tg .sl-btns button'); if (!r) return null; const b = r.getBoundingClientRect(); return b.width > 30 && b.right <= document.documentElement.clientWidth })
  봄(단추, `${w}px PDF 단추 화면 안`)
  봄(!오류.length, `${w}px 오류 0`, 오류.join(' | '))
  await ctx.close()
}

console.log('■ 글자 키움(본문 160%) · 좁은 폰 — 넘침')
{
  const { ctx, p, 오류 } = await 쪽(320, 640, { 배: 2 })
  await p.addStyleTag({ content: '.tg { zoom: 1.6 }' })
  await 예시(p, '장비 기사 3명 · 15일')
  봄((await 넘침(p)) <= 0, '글자 160% 에서도 가로 넘침 없음', await 넘침(p))
  봄(!오류.length, '오류 0', 오류.join(' | '))
  await ctx.close()
}

console.log('■ 이상한 글 넣기 — 일한 날 · 사람 수')
{
  const { ctx, p, 오류 } = await 쪽(390, 844)
  await p.evaluate(() => localStorage.removeItem('kcm_teukgo')); await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForSelector('h1.tl-h1')
  const 날시험 = [['4', '4', '9,480'], ['4일', '4', '9,480'], ['abc', '', null], ['-5', '5', '11,860'], ['0', '0', 'need'], ['31', '31', 'need'], ['30', '30', null], ['007', '00', 'need'], ['12345', '12', null], ['٤', '', null], ['４', '', null], ['3.5', '35', 'need'], ['<b>9</b>', '9', null], ['  8 ', '8', null]]
  for (const [넣, 칸, 기대] of 날시험) {
    await p.fill(날칸, ''); await p.type(날칸, 넣); await p.waitForTimeout(60)
    const v = await p.inputValue(날칸)
    const 결 = await 큰글(p)
    const 맞 = v === 칸 && (기대 === null || (기대 === 'need' ? /일한 날을 넣으세요/.test(결) : 결.includes(`본인 몫 ${기대}원`)))
    봄(맞, `날 «${넣}» → 칸 «${v}» · ${결.slice(0, 30)}`, `${v} / ${결}`)
  }
  await p.fill(날칸, '30'); await p.waitForTimeout(60)
  봄((await 큰글(p)).includes('본인 몫 71,160원'), '30일 — 2,812,980 → 산재 48,660(48,664.5) + 고용 22,500(22,503.8) = 71,160', await 큰글(p))
  await p.locator('details.sl-more > summary').click()
  for (const [넣, 칸] of [['abc', ''], ['0', '0'], ['5000', '500'], ['-2', '2'], ['999', '999']]) {
    await p.fill(명칸, ''); await p.type(명칸, 넣); await p.waitForTimeout(60)
    봄((await p.inputValue(명칸)) === 칸, `사람 수 «${넣}» → 칸 «${칸}»`, await p.inputValue(명칸))
  }
  봄((await 큰글(p)).includes('본인 몫 71,088,840원'), '999명 × 30일(71,160) = 71,088,840', await 큰글(p))
  await p.fill(명칸, '')
  await p.waitForTimeout(60)
  봄((await 큰글(p)).includes('본인 몫 71,160원'), '사람 수 빈칸 → 1명으로', await 큰글(p))
  봄(!오류.length, '이상한 글 — 오류 0', 오류.join(' | '))
  await ctx.close()
}

console.log('■ 연타 — 단추 80번 · 달 바꾸기 30번')
{
  const { ctx, p, 오류 } = await 쪽(390, 844)
  await 예시(p, '굴착기 4일')
  for (let k = 0; k < 40; k++) { await p.locator('.iy-seg[aria-label="직종"] button').nth(k % 2).click({ delay: 0 }) }
  for (let k = 0; k < 40; k++) { await p.locator('.iy-seg[aria-label="일한 기간"] button').nth(k % 2).click({ delay: 0 }) }
  /* 마지막: 직종 = 화물차(39 → 홀수 → nth(1)) · 기간 = 한 달 내내(nth(1)) */
  await p.waitForTimeout(150)
  봄((await 큰글(p)).includes('본인 몫 48,660원'), '연타 뒤 마지막 고름대로(화물차 · 한 달) 48,660', await 큰글(p))
  const 달값 = await p.$$eval('select[aria-label="몇 월분"] option', (o) => o.map((x) => x.value))
  for (let k = 0; k < 30; k++) await p.selectOption('select[aria-label="몇 월분"]', 달값[k % 달값.length])
  await p.selectOption('select[aria-label="몇 월분"]', '2026-11'); await p.waitForTimeout(100)
  봄((await 큰글(p)).includes('본인 몫 48,660원') && !(await p.textContent('.tg .sl-out')).includes('잠정'), '달 30번 바꾼 뒤 11월분 · 결과 칸에 잠정 없음', await 큰글(p))
  봄(!오류.length, '연타 — 오류 0', 오류.join(' | '))
  await ctx.close()
}

console.log('■ 저장 막힘(사생활 보호 창) · 망가진 저장 · 옛 값')
{
  const { ctx, p, 오류 } = await 쪽(390, 844, { 저장막힘: true })
  봄((await p.textContent('.tg')).includes('지금 저장이 막혀 있습니다'), '저장 막힘 — 알림 글')
  await 예시(p, '굴착기 4일')
  봄((await 큰글(p)).includes('본인 몫 9,480원'), '저장 막혀도 셈은 됨', await 큰글(p))
  봄(!오류.length, '저장 막힘 — 오류 0', 오류.join(' | '))
  await ctx.close()
}
for (const [이름, 값, 기대] of [
  ['깨진 JSON', '{bad', '처음 상태'],
  ['옛 달 · 모르는 직종 · 큰 날 · 음수 명', JSON.stringify({ 달: '2025-01', 직종: 'zzz', 꼴: 'days', 날: '99', 명: '-3' }), '일한 날을 넣으세요'],
  ['숫자 대신 글', JSON.stringify({ 달: 12, 직종: null, 꼴: 'month', 날: {}, 명: 'abc' }), '본인 몫 71,160원'],
  ['배열', '[1,2,3]', '처음 상태'],
  ['null', 'null', '처음 상태'],
]) {
  const { ctx, p, 오류 } = await 쪽(390, 844, { 앞: 값 })
  const 결 = await 큰글(p)
  const 맞 = 기대 === '처음 상태' ? !(await p.$('.sl-res')) || /일한 날을 넣으세요/.test(결) : 결.includes(기대)
  봄(맞 && !오류.length, `망가진 저장 «${이름}» → ${기대}`, `${결} | ${오류.join(' | ')}`)
  await ctx.close()
}

console.log('■ 날짜를 바꿔 봄 — 2027년 7월(잠정 둘) · 2026년 12월 31일 23시 59분 · 2026년 3월(시계가 틀린 폰)')
{
  const { ctx, p, 오류 } = await 쪽(390, 844, { 지금: Date.UTC(2027, 6, 15, 3) })
  await p.evaluate(() => localStorage.removeItem('kcm_teukgo')); await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForSelector('h1.tl-h1')
  await 예시(p, '덤프 한 달')
  const t = await p.textContent('.tg')
  봄(t.includes('2027년 7월분') && t.includes('2027년 산재 기준보수') && t.includes('새 고시가 나왔는지 확인 중'), '2027년 7월 — 잠정 알림 둘', t.slice(0, 200))
  const 끝 = (await p.$$eval('select[aria-label="몇 월분"] option', (o) => o.map((x) => x.value))).slice(-1)[0]
  봄(끝 === '2027-09', '고를 달 끝 = 2027년 9월(이번 달 + 2)', 끝)
  봄(!오류.length, '2027 — 오류 0', 오류.join(' | '))
  await ctx.close()
}
{
  const { ctx, p, 오류 } = await 쪽(390, 844, { 지금: Date.UTC(2026, 11, 31, 14, 59) })   /* 한국 2026-12-31 23:59 */
  await p.evaluate(() => localStorage.removeItem('kcm_teukgo')); await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForSelector('h1.tl-h1')
  봄((await p.inputValue('select[aria-label="몇 월분"]')) === '2026-12', '한국 12월 31일 23시 59분 → 12월분', await p.inputValue('select[aria-label="몇 월분"]'))
  await ctx.close()
}
{
  const { ctx, p, 오류 } = await 쪽(390, 844, { 지금: Date.UTC(2026, 2, 1, 3) })
  await p.evaluate(() => localStorage.removeItem('kcm_teukgo')); await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForSelector('h1.tl-h1')
  await p.fill(날칸, '4'); await p.waitForTimeout(80)
  const 결 = await 큰글(p), 고른 = await p.inputValue('select[aria-label="몇 월분"]')
  봄(/본인 몫 9,480원/.test(결) && 고른 === '2026-07', '시계가 2026년 3월인 폰 — 7월분으로 셈 됨(G789 고침)', `${고른} ${결}`)
  봄(!오류.length, '틀린 시계 — 오류 0', 오류.join(' | '))
  console.log('    (참고) 틀린 시계 고른 달 =', 고른, '· 결과 =', 결.slice(0, 40))
  await ctx.close()
}

console.log('■ 다른 화면 갔다 오기 · 새로 고침 · 키보드')
{
  const { ctx, p, 오류 } = await 쪽(1280, 900)
  await 예시(p, '살수차 10일')
  await p.click('a[href="/tools/boheomryo"]'); await p.waitForTimeout(800)
  await p.goBack({ waitUntil: 'domcontentloaded' }); await p.waitForSelector('.sl-res', { timeout: 15000 })
  봄((await 큰글(p)).includes('본인 몫 16,220원'), '보험료 계산기 갔다 오면 그대로', await 큰글(p))
  await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForSelector('.sl-res', { timeout: 15000 })
  봄((await 큰글(p)).includes('본인 몫 16,220원'), '새로 고침해도 그대로', await 큰글(p))
  await p.locator('.iy-seg[aria-label="직종"] button').first().focus(); await p.keyboard.press('Enter'); await p.waitForTimeout(80)
  봄((await p.locator('.iy-seg[aria-label="직종"] button.on').textContent()).includes('건설기계'), '키보드(Enter)로 직종 고름')
  await p.locator('.iy-seg[aria-label="일한 기간"] button').nth(1).focus(); await p.keyboard.press('Space'); await p.waitForTimeout(80)
  봄((await 큰글(p)).includes('본인 몫 71,160원'), '키보드(Space)로 한 달 내내', await 큰글(p))
  봄(!오류.length, '오가기 · 키보드 — 오류 0', 오류.join(' | '))
  await ctx.close()
}

console.log('■ PDF 연타 · 인쇄 · 어두운 아주 좁은 화면')
{
  const { ctx, p, 오류 } = await 쪽(1280, 900)
  await 예시(p, '굴착기 4일')
  const 받음 = []
  p.on('download', (d) => 받음.push(d.suggestedFilename()))
  const 단 = p.getByRole('button', { name: '📄 PDF' })
  await 단.click(); await p.locator('.tg .sl-btns button').first().click({ force: true, timeout: 2000 }).catch(() => {}); await p.locator('.tg .sl-btns button').first().click({ force: true, timeout: 2000 }).catch(() => {})
  await p.waitForTimeout(9000)
  봄(받음.length === 1 && /^특고보험료_/.test(받음[0]), 'PDF 세 번 연타 → 받기 하나', 받음.join(','))
  await p.evaluate(() => { window.print = () => { window.__인쇄 = (window.__인쇄 || 0) + 1 } })
  await p.getByRole('button', { name: '🖨 인쇄' }).click(); await p.waitForTimeout(6000)
  봄(!오류.length, 'PDF · 인쇄 — 오류 0', 오류.join(' | '))
  await ctx.close()
}
{
  const { ctx, p, 오류 } = await 쪽(280, 600, { 어둠: true, 배: 2 })
  await 예시(p, '장비 기사 3명 · 15일')
  const 색 = await p.evaluate(() => [...document.querySelectorAll('.tg .sl-res, .tg .sl-facts b, .tg .sl-facts small, .tg .tg-sum')].map((e) => { const s = getComputedStyle(e); return s.color + '|' + s.backgroundColor }))
  봄(색.every((x) => x.split('|')[0] !== x.split('|')[1]), '어두운 280px — 글자 ≠ 바탕', 색.slice(0, 3).join(' / '))
  봄((await 넘침(p)) <= 0 && !(await 삐짐(p)).length, '어두운 280px — 넘침 · 삐짐 없음', (await 삐짐(p)).join(' | '))
  봄(!오류.length, '어두운 280px — 오류 0', 오류.join(' | '))
  await ctx.close()
}
await b.close()
console.log(`\n${bad ? '✗' : '✓'} 극한 화면 ${ok}/${ok + bad}`)
process.exit(bad ? 1 : 0)
