// 🧪 G507 — 실업급여 판단기 화면 (B=http://127.0.0.1:4996 node tools/시험_실업급여화면.mjs)
//   PC 1280 · 폰 390 · 320 — 예시 다섯 · 손으로 넣기 · 결과 링크 오가기 · 넘침 · 오류 · 금지 말 · 4대보험 판단기에서 가는 길 · 어두운 화면
//   캡처: C=폴더 (주면 PC · 폰 화면을 찍음)
import { createRequire } from 'module'
const require = createRequire(process.env.PW || '/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const B = process.env.B || 'http://127.0.0.1:4996'
const C = process.env.C || ''
let 통과 = 0, 틀림 = 0
const 봄 = (v, 이름, 덧 = '') => { if (v) 통과++; else { 틀림++; console.log(`  ✗ ${이름} ${덧}`) } }

const b = await chromium.launch()
async function 새쪽(w, h, 어둠 = false) {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: w < 500 ? 2 : 1, colorScheme: 어둠 ? 'dark' : 'light' })
  await p.addInitScript(() => { Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false }) })
  await p.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|geojs|firebaseio|firebasedatabase|identitytoolkit|securetoken/, (r) => r.fulfill({ status: 200, body: 'null' }))
  const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e.message || e)))
  p.on('console', (m) => { if (m.type() === 'error' && !/net::|Failed to load resource|favicon/i.test(m.text())) 오류.push(m.text()) })
  return { p, 오류 }
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

for (const [w, h, 이름] of [[1280, 900, 'PC'], [390, 844, '폰'], [320, 640, '좁은 폰']]) {
  console.log(`■ ${이름} ${w}`)
  const { p, 오류 } = await 새쪽(w, h)
  await p.goto(`${B}/tools/ilyong-silup`, { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('h1.tl-h1', { timeout: 20000 })
  await p.evaluate(() => { try { localStorage.removeItem('kcm_silup') } catch (e) { /* */ } })
  await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForSelector('h1.tl-h1')
  봄((await p.textContent('h1.tl-h1')).includes('일용직 실업급여 판단기'), '제목')
  봄(!(await p.$('.sl-res')), '처음엔 결과 없음')
  await 예시(p, '건설 · 다음 달 1일부터')
  봄((await 큰글(p)).includes('✅ 받을 수 있습니다'), '예시 a ✅', await 큰글(p))
  let t = await 글(p)
  봄(t.includes('11.1.부터') && t.includes('68,100원 × 150일 = 10,215,000원'), '예시 a 날 · 돈')
  봄(t.includes('건설일용 — 7일 대기 없이'), '예시 a 대기 없음')
  봄(t.includes('🧪 예시는 2026.11.2. 기준'), '예시 기준일 띠')
  await 예시(p, '건설 · 14일 쉬고')
  봄((await 큰글(p)).includes('⏳ 2026.11.14.부터'), '예시 b ⏳ 11.14.', await 큰글(p))
  await 예시(p, '건설 아닌 일용 · 두 달 뒤')
  봄((await 큰글(p)).includes('⏳ 2026.12.1.부터'), '예시 c ⏳ 12.1.', await 큰글(p))
  t = await 글(p)
  봄(t.includes('7일은 대기기간'), '예시 c 대기 7일')
  await 예시(p, '날이 모자람')
  봄((await 큰글(p)).includes('❌') && (await 큰글(p)).includes('180일'), '예시 d ❌ 180일')
  await 예시(p, '스스로 그만둠')
  봄((await 큰글(p)).includes('❌') && (await 큰글(p)).includes('그만둔 까닭'), '예시 e ❌ 까닭')
  // 정당한 사유 체크 → 확인
  await p.getByLabel('임금 체불 · 통근 곤란 · 질병 같은 정당한 사유가 있음').check()
  봄((await 큰글(p)).includes('⚠️'), '정당한 사유 → ⚠️ 확인', await 큰글(p))
  봄(await 넘침(p) <= 0, '가로 넘침 없음', String(await 넘침(p)))

  // 손으로 넣기 — 처음부터 → 날짜 · 날 수
  await p.getByRole('button', { name: '처음부터' }).click()
  await p.getByRole('button', { name: '지우기' }).click()
  await p.fill('input[aria-label="마지막으로 일한 날"]', '2026-10-25')
  await p.fill('input[aria-label="앞 달 출역 일수"]', '0')
  await p.fill('input[aria-label="마지막 달 출역 일수"]', '20')
  await p.fill('input[aria-label="18개월 동안 일한 날"]', '200')
  await p.getByRole('button', { name: '건설 아닌 일용', exact: true }).click()
  t = await 글(p)
  봄(t.includes('10.31. 하루 · 11.30.부터'), '손으로 — 신청할 수 있는 날 구간 둘', '')
  봄(t.includes('⚠️ 11.1. ~ 11.29.에는 안 됩니다'), '손으로 — 안 되는 구간 글')
  봄(!t.includes('🧪 예시는'), '내 것은 오늘 기준(예시 띠 없음)')
  await p.fill('input[aria-label="일당"]', '229000')
  await p.fill('input[aria-label="한 달에 보통 일한 날"]', '15')
  t = await 글(p)
  봄(/하루 6\d,\d{3}원/.test(t), '일당 넣으면 하루 금액')
  // 결과 링크 → 새 쪽에서 같은 결과
  const 앞큰 = await 큰글(p)
  await p.getByRole('button', { name: '🔗 링크 보내기' }).click()
  await p.waitForSelector('.sl-out .note a[href*="?c="]', { timeout: 5000 })
  const url = await p.getAttribute('.sl-out .note a[href*="?c="]', 'href')
  봄(/\/tools\/ilyong-silup\?c=[A-Za-z0-9_-]+$/.test(url), '링크 꼴', url)
  const { p: q, 오류: 오류2 } = await 새쪽(w, h)
  await q.goto(url.replace(/^https?:\/\/[^/]+/, B), { waitUntil: 'domcontentloaded' })
  await q.waitForSelector('.sl-res', { timeout: 20000 })
  봄((await 큰글(q)) === 앞큰, '받은 링크 = 같은 결과', `${await 큰글(q)} / ${앞큰}`)
  봄((await 글(q)).includes('🔗 받은 링크의 날짜'), '받은 링크 알림')
  봄(await q.inputValue('input[aria-label="일당"]') === '229,000', '받은 링크 일당 채움')
  봄(!오류2.length, '받은 링크 쪽 오류 없음', 오류2.join(' | '))
  await q.close()
  // 금지 말 · 오류
  t = await 글(p)
  봄(!/클로드/.test(t), '«클로드» 없음')
  const 무료 = await p.evaluate(() => [...document.querySelectorAll('.sl, .sl *')].some((e) => e.children.length === 0 && /무료/.test(e.textContent)))
  봄(!무료, '새 화면 안에 «무료» 없음')
  봄(await 넘침(p) <= 0, '가로 넘침 없음(손으로 뒤)', String(await 넘침(p)))
  봄(!오류.length, '오류 없음', 오류.join(' | '))
  if (C && w !== 320) {
    await 예시(p, '건설 · 다음 달 1일부터')
    await p.evaluate(() => document.querySelector('.sl-out').scrollIntoView({ block: 'start' }))
    await p.evaluate(() => window.scrollBy(0, -70))
    await p.waitForTimeout(300)
    await p.screenshot({ path: `${C}/실업급여_${이름}.png`, fullPage: false })
  }
  await p.close()
}

console.log('■ 어두운 화면 · 4대보험에서 가는 길 · 미리 구운 글')
{
  const { p, 오류 } = await 새쪽(390, 844, true)
  await p.goto(`${B}/tools/ilyong-silup`, { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('h1.tl-h1')
  await 예시(p, '건설 · 다음 달 1일부터')
  const 색 = await p.evaluate(() => { const e = document.querySelector('.sl-res'); const s = getComputedStyle(e); return [s.color, s.backgroundColor] })
  봄(색[0] !== 색[1], '어두운 화면 결과 글자 ≠ 바탕', 색.join(' / '))
  봄(!오류.length, '어두운 화면 오류 없음', 오류.join(' | '))
  await p.goto(`${B}/tools/ilyong-boheom`, { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('h1.tl-h1')
  const 길 = await p.$('a[href="/tools/ilyong-silup"]')
  봄(!!길, '4대보험 판단기 → 실업급여 링크')
  await p.close()
  const r = await fetch(`${B}/tools/ilyong-silup.html`).then((x) => x.text())
  봄(/<title>일용직 실업급여 판단기/.test(r), '미리 구운 쪽 제목')
  봄(r.includes('FAQPage') && r.includes('건설일용 14일은 어떻게 세나요?'), '미리 구운 쪽 자주 묻는 것(구조화)')
  봄(r.includes('66,048원') && r.includes('120일') && r.includes('270일'), '미리 구운 쪽 하한 · 표')
  봄(!/무료|클로드/.test(r.replace(/<script[\s\S]*?<\/script>/g, '').replace(/"isAccessibleForFree"/g, '')), '미리 구운 쪽 «무료» · «클로드» 없음')
  const sm = await fetch(`${B}/sitemap-main.xml`).then((x) => x.text()).catch(() => '')
  봄(sm.includes('/tools/ilyong-silup'), '사이트맵에 주소')
}
await b.close()
console.log(`\n실업급여 화면 ${통과}/${통과 + 틀림}`)
if (틀림) process.exit(1)
