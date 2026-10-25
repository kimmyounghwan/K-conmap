/**
 * 🔒 공사서류 원클릭 잠금 화면 시험 · G403 (2026-10-25) — 소장님 「공사서류 한벌도 예시만 보게 해줘. 잠가」
 *   4998 에 화면 빌드를 얹은 뒤  node tools/시험_원클릭잠금화면.mjs   (B=주소)
 *   남(열쇠말 없음): «준비 중» 띠 · 🧪 예시 칸(○○) · 칸 고치기 · 받기 잠김(받기 없음) · 서류 고르기 · ③ 화면에서 보기는 됨 · 이 기기에 적어 둔 값은 안 지움
 *   열쇠말을 연 브라우저: 띠 없음 · 적어 둔 값 그대로 · 칸 고치기 됨
 */
import { createRequire } from 'module'
const require = createRequire('/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const BASE = process.env.B || 'http://127.0.0.1:4998'
const 찍기 = process.env.CAP || ''
const HASH = '198d0951f2337d02ab42668d11ae45be65998e0f0684bc18d070c302e40751ab'   // lib/gate.js 의 열쇠말 해시(열쇠말 자체 아님)
let ok = 0, bad = 0
const 봐 = (c, m, 더 = '') => { if (c) ok++; else bad++; console.log((c ? '  ✓ ' : '  ✗ ') + m + (c ? '' : ' — ' + String(더).slice(0, 400))) }
const b = await chromium.launch()
for (const [기기, vp] of [['PC', { width: 1280, height: 900 }], ['폰', { width: 390, height: 844 }]]) {
  console.log(`① ${기기} — 남(열쇠말 없음)`)
  const ctx = await b.newContext({ viewport: vp, acceptDownloads: true })
  /* 전에 이 기기에 적어 둔 값 — 잠가도 지우지 않아야 */
  await ctx.addInitScript(() => { try { if (!localStorage.getItem('kcm.wonclick.v1')) localStorage.setItem('kcm.wonclick.v1', JSON.stringify({ 공사명: '내가 적어 둔 공사' })) } catch (e) { /* */ } })
  const p = await ctx.newPage()
  const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e)))
  let 받음 = 0
  p.on('download', () => { 받음++ })
  await p.goto(BASE + '/tools/wonclick', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('.sg-lock', { timeout: 20000 })
  const 공사명 = await p.$eval('#wc-공사명', (e) => e.value)
  봐(/○○동 ○○시설 개보수공사/.test(공사명), `${기기} 🔒 «준비 중» 띠 · 🧪 예시 칸(공사명 ${공사명})`)
  await p.fill('#wc-공사명', '바꿔 보기')
  await p.waitForTimeout(200)
  const 공사명2 = await p.$eval('#wc-공사명', (e) => e.value)
  const 말 = await p.$eval('.wc-go .cwarn', (e) => e.textContent).catch(() => '')
  봐(공사명2 === 공사명 && /칸 채우기는 지금 준비 중/.test(말), `${기기} 칸 고치기 잠김(그대로 · «${말.slice(0, 30)}…»)`, 공사명2)
  const 받기 = await p.$('.wc-go .btn.primary')
  await 받기.click()
  await p.waitForTimeout(800)
  const 말2 = await p.$eval('.wc-go .cwarn', (e) => e.textContent).catch(() => '')
  봐(받음 === 0 && /엑셀 받기는 지금 준비 중/.test(말2) && /🔒/.test(await 받기.textContent()), `${기기} ⬇ 엑셀 받기 🔒 — 받은 파일 0`, [받음, 말2])
  봐(!(await p.$('.nm-sites')) && !(await p.$('.bk[data-ns="wc"]')) && !(await p.$('text=코드 만들기')), `${기기} 현장 나누기 · 이어 쓰기 칸 · «코드 만들기» 안내 안 보임`)
  /* 서류 고르기 · 화면에서 보기는 됨 */
  await p.click('text=모두 끄기')
  await p.waitForTimeout(150)
  const 끔 = await p.$$eval('.wc-doc input:checked', (es) => es.length)
  await p.click('text=전부')
  await p.waitForTimeout(150)
  const 켬 = await p.$$eval('.wc-doc input:checked', (es) => es.length)
  봐(끔 === 0 && 켬 >= 20, `${기기} 서류 고르기는 됨(끔 ${끔} · 전부 ${켬})`)
  await p.click('button:has-text("화면에서 보기")')
  await p.waitForFunction(() => /○○동 ○○시설 개보수공사/.test(document.body.innerText.split('③')[2] || document.body.innerText), null, { timeout: 30000 }).catch(() => {})
  const 보임 = await p.evaluate(() => { const c = [...document.querySelectorAll('.card')].find((x) => /③ 화면에서 보고/.test(x.textContent)); return c ? c.innerText.length : 0 })
  봐(보임 > 400, `${기기} ③ 화면에서 보기 — 예시 서류가 그려짐(글 ${보임}자)`)
  if (찍기) await p.screenshot({ path: `${찍기}/${기기}_원클릭잠금.png`, fullPage: false })
  const 남은 = await p.evaluate(() => localStorage.getItem('kcm.wonclick.v1'))
  봐(/내가 적어 둔 공사/.test(남은 || ''), `${기기} 이 기기에 적어 둔 값은 그대로(지우지 않음)`, 남은)
  봐(!오류.length, `${기기} 화면 오류 없음`, 오류.join(' | '))
  await ctx.close()

  console.log(`② ${기기} — 열쇠말을 연 브라우저`)
  const ctx2 = await b.newContext({ viewport: vp })
  await ctx2.addInitScript((h) => { try { localStorage.setItem('kcm_lab_ok', h); localStorage.setItem('kcm.wonclick.v1', JSON.stringify({ 공사명: '내가 적어 둔 공사' })) } catch (e) { /* */ } }, HASH)
  const q = await ctx2.newPage()
  await q.goto(BASE + '/tools/wonclick', { waitUntil: 'domcontentloaded' })
  await q.waitForSelector('#wc-공사명', { timeout: 20000 })
  await q.waitForTimeout(300)
  const 띠 = await q.$('.sg-lock')
  const v = await q.$eval('#wc-공사명', (e) => e.value)
  await q.fill('#wc-공사명', '열쇠로 고침')
  const v2 = await q.$eval('#wc-공사명', (e) => e.value)
  봐(!띠 && v === '내가 적어 둔 공사' && v2 === '열쇠로 고침', `${기기} 띠 없음 · 적어 둔 값 그대로 · 칸 고치기 됨`, [!!띠, v, v2])
  await ctx2.close()
}
await b.close()
console.log(`\n${ok + bad}개 중 맞음 ${ok} · 틀림 ${bad}`)
if (bad) { console.log('✗ 틀린 것이 있음'); process.exit(1) } else console.log('✓ 모두 맞음')
