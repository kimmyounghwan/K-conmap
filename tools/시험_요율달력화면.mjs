// 🧪 G790 — 요율 달력 화면 (/tools/haemada) (B=http://127.0.0.1:5801 node tools/시험_요율달력화면.mjs)
//   PC 1280 · 600 · 폰 390 · 320 — 열두 달 칸(PC 4칸 · 폰 달마다 한 줄) · 이번 달 칸 하나 · 이번 달 볼 것(원문 고리) · 넘침 · 칸 밖 글 · 오류
//   시계 바꿔 보기 — 2월(볼 것 없음 → 다음 4월) · 12월 27일(⏰ 밀림) · 어두운 화면 · 아래 값 표 그대로   캡처: C=폴더
import { createRequire } from 'module'
const require = createRequire(process.env.PW || '/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const B = process.env.B || 'http://127.0.0.1:5801'
const C = process.env.C || ''
let 통과 = 0, 틀림 = 0
const 봄 = (v, 이름, 덧 = '') => { if (v) { 통과++; console.log(`  ✓ ${이름}`) } else { 틀림++; console.log(`  ✗ ${이름} ${덧}`) } }

const b = await chromium.launch()
async function 새쪽(w, h, { 어둠 = false, 때 = 0 } = {}) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: C && w < 500 ? 2 : 1, colorScheme: 어둠 ? 'dark' : 'light' })
  const p = await ctx.newPage()
  await p.addInitScript(() => { Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false }) })
  if (때) await p.addInitScript((t) => { const 원 = Date; const 차 = t - 원.now(); class 가짜 extends 원 { constructor(...a) { super(...(a.length ? a : [원.now() + 차])) } static now() { return 원.now() + 차 } } window.Date = 가짜 }, 때)
  await p.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|geojs|firebaseio|firebasedatabase|identitytoolkit|securetoken|daumcdn|coupang/, (r) => r.fulfill({ status: 200, body: 'null' }))
  const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e.message || e)))
  p.on('console', (m) => { if (m.type() === 'error' && !/net::|Failed to load resource|favicon/i.test(m.text())) 오류.push(m.text()) })
  await p.goto(`${B}/tools/haemada`, { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('.card.rc .rc-grid', { timeout: 20000 }); await p.waitForTimeout(500)
  return { p, 오류, ctx }
}
const 넘침 = (p) => p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
const 칸 = (p) => p.evaluate(() => {
  const 달 = [...document.querySelectorAll('.rc-grid .rc-m')]
  const 왼 = [...new Set(달.map((e) => Math.round(e.getBoundingClientRect().left)))]
  const 밖 = []
  for (const m of 달) { const r = m.getBoundingClientRect(); for (const c of m.querySelectorAll('.rc-chip')) { const q = c.getBoundingClientRect(); if (q.right > r.right + 1 || q.left < r.left - 1) 밖.push(m.firstElementChild.textContent + ' ' + c.textContent) } }
  const 지금 = [...document.querySelectorAll('.rc-m.now')].map((e) => e.firstElementChild.textContent)
  const 볼 = [...document.querySelectorAll('.rc-now .rc-chip')].map((e) => ({ 글: e.textContent, 고리: e.tagName === 'A' ? e.getAttribute('href') : '', 새창: e.getAttribute('target') || '', 밀림: e.classList.contains('due') }))
  const 카드 = document.querySelector('.card.rc'), 표 = document.querySelector('table.hm-t')
  return { 수: 달.length, 왼: 왼.length, 밖, 지금, 볼, 머리: (document.querySelector('.rc-now') || {}).textContent || '', 차례: !!(카드 && 표 && (카드.compareDocumentPosition(표) & Node.DOCUMENT_POSITION_FOLLOWING)), 줄: document.querySelectorAll('table.hm-t tbody tr').length }
})
const 한국달 = () => Number(new Date(Date.now() + 9 * 3600e3).toISOString().slice(5, 7))

for (const [w, h, 이름, 몇칸] of [[1280, 900, 'PC', 4], [600, 900, '태블릿', 4], [390, 844, '폰', 1], [320, 640, '좁은 폰', 1]]) {
  console.log(`■ ${이름} ${w}`)
  const { p, 오류, ctx } = await 새쪽(w, h)
  const k = await 칸(p), 월 = 한국달()
  봄(k.수 === 12, '열두 달 칸', k.수)
  봄(k.왼 === 몇칸, `한 줄에 ${몇칸}칸`, k.왼)
  봄(k.지금.length === 1 && k.지금[0] === `${월}월`, `이번 달(${월}월) 칸 하나만 밝게`, k.지금.join())
  봄(k.머리.startsWith(`${월}월에 볼 것`), '«이번 달 볼 것» 줄', k.머리.slice(0, 40))
  봄(k.볼.length > 0 ? k.볼.every((x) => !x.고리 || (/^https:\/\//.test(x.고리) && x.새창 === '_blank')) : /없음/.test(k.머리), '볼 것 — 원문 고리(새 창) · 없으면 «없음»', JSON.stringify(k.볼).slice(0, 200))
  봄(k.밖.length === 0, '칸 밖으로 나간 이름 없음', k.밖.join(' | '))
  봄(k.차례 && k.줄 >= 15, '카드가 값 표 앞 · 값 표 줄 그대로', `${k.차례} ${k.줄}`)
  봄((await 넘침(p)) <= 0, '가로 넘침 없음', await 넘침(p))
  봄(!오류.length, '오류 없음', 오류.join(' | '))
  if (C) {
    await p.evaluate(() => { for (const e of document.querySelectorAll('body *')) { const q = getComputedStyle(e).position; if (q === 'fixed' || q === 'sticky') e.style.visibility = 'hidden' } })
    const el = await p.$('.card.rc')
    await el.screenshot({ path: `${C}/G790_요율달력_${이름}.png` })
  }
  await ctx.close()
}

console.log('■ 시계 2026-03-10 (볼 것 없는 달 · 밀린 것 없음)')
{
  const { p, 오류, ctx } = await 새쪽(390, 844, { 때: Date.UTC(2026, 2, 10, 3) })
  const k = await 칸(p)
  봄(k.지금.join() === '3월', '3월 칸 밝게', k.지금.join())
  봄(/^3월에 볼 것\s*없음 — 다음은 4월\(연금 상 · 하한\)$/.test(k.머리.trim()) && k.볼.length === 0, '«3월에 볼 것 없음 — 다음은 4월(연금 상 · 하한)»', k.머리)
  봄(!오류.length, '오류 없음', 오류.join(' | '))
  await ctx.close()
}
console.log('■ 시계 2027-02-10 (표를 안 고친 채 해가 바뀜 → 모두 ⏰)')
{
  const { p, 오류, ctx } = await 새쪽(390, 844, { 때: Date.UTC(2027, 1, 10, 3) })
  const k = await 칸(p)
  봄(k.지금.join() === '2월' && k.볼.length >= 10 && k.볼.every((x) => x.밀림) && !/없음/.test(k.머리), `2월 — 밀린 값 ${k.볼.length}가지 모두 ⏰ («없음» 아님)`, k.머리.slice(0, 80))
  봄(k.밖.length === 0 && (await 넘침(p)) <= 0, '칩 많아도 넘침 없음', k.밖.join(' | '))
  봄(!오류.length, '오류 없음', 오류.join(' | '))
  await ctx.close()
}
console.log('■ 시계 2026-12-27 (다음 확인 지난 값 ⏰)')
{
  const { p, 오류, ctx } = await 새쪽(1280, 900, { 때: Date.UTC(2026, 11, 27, 3) })
  const k = await 칸(p)
  const 밀 = k.볼.filter((x) => x.밀림)
  봄(k.지금.join() === '12월' && 밀.length >= 1 && 밀.every((x) => x.글.startsWith('⏰ ')), `12월 — 밀린 값 ${밀.length}가지 ⏰ 주황`, JSON.stringify(밀).slice(0, 160))
  const 색 = await p.evaluate(() => { const e = document.querySelector('.rc-now .rc-chip.due'); const s = getComputedStyle(e); return [s.color, s.backgroundColor, s.borderColor] })
  봄(색[0] !== 색[1], '밀림 칩 글자 ≠ 바탕', 색.join(' / '))
  봄(!오류.length, '오류 없음', 오류.join(' | '))
  await ctx.close()
}
console.log('■ 어두운 화면')
{
  const { p, 오류, ctx } = await 새쪽(390, 844, { 어둠: true })
  const 색 = await p.evaluate(() => [...document.querySelectorAll('.rc-chip, .rc-m.now, .rc-m > b')].slice(0, 30).map((e) => { const s = getComputedStyle(e); return [s.color, s.backgroundColor] }))
  봄(색.length > 5 && 색.every(([a, c]) => a !== c), '글자 ≠ 바탕(칩 · 이번 달 칸)', JSON.stringify(색.slice(0, 3)))
  봄((await 넘침(p)) <= 0, '넘침 없음')
  봄(!오류.length, '오류 없음', 오류.join(' | '))
  if (C) { const el = await p.$('.card.rc'); await el.screenshot({ path: `${C}/G790_요율달력_어둠.png` }) }
  await ctx.close()
}
await b.close()
console.log(`\n${틀림 ? '❌' : '✅'} 요율 달력 화면 ${통과}/${통과 + 틀림}`)
process.exit(틀림 ? 1 : 0)
