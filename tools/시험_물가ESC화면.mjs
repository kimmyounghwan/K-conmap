/**
 * 📈 G657 물가변동 ESC 화면 시험 — 구운 사이트(dist)를 띄운 뒤: node tools/시험_물가ESC화면.mjs [주소=http://127.0.0.1:4987]
 *   ① 이용자(폰 390 · PC 1280): 잠금 상자 · 🧪 예시 산출서(5.54% · 28,454,000원) · 탭 여섯 · 🔒 받기 눌러도 받기 0 · 🔒 넣기 · 가로 넘침 없음 · 오류 0
 *   ② 소장님 브라우저(kcm_op · 폰 390): 가상 ESC 엑셀 넣기 → 같은 숫자 · 📗 받기 → 다시 읽어 같은 숫자 · 선금 0 으로 고치면 공제 0
 *      · 🧪 예시로 바꾸면 받기 🔒(받기 0 · G650) · 📄 빈 틀 받기 → 다시 읽으면 품목 0
 *   가상 자료만(지어낸 공사) · 인터넷 안 부름(파이어베이스 · 광고 막음)
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const 여기 = path.dirname(fileURLToPath(import.meta.url))
const 웹 = path.join(여기, '..', 'web', 'src')
const 불러 = (p) => import(pathToFileURL(path.join(웹, p)).href)
const E = await 불러('lib/물가ESC.js')
const X = await 불러('lib/물가ESC엑셀.js')
const L = await 불러('lib/물가ESC읽기.js')
const { 예시입력 } = await 불러('data/물가ESC_예시입력.js')
const BASE = process.argv[2] || 'http://127.0.0.1:4987'

let bad = 0, n = 0
const ok = (이름, c, got) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (c || got === undefined ? '' : ' = ' + JSON.stringify(got).slice(0, 300))) }
const 쉬어 = (ms) => new Promise((r) => setTimeout(r, ms))
const 곳 = fs.mkdtempSync(path.join(os.tmpdir(), 'esc화면-'))
const R예 = E.ESC셈(예시입력)
const 넣을 = path.join(곳, '가상_들말지구_ESC.xlsx')
fs.writeFileSync(넣을, X.ESC엑셀(예시입력, R예))

const b = await chromium.launch({ env: { ...process.env, LANG: 'C.UTF-8', LC_ALL: 'C.UTF-8' } })
const UA폰 = 'Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'
async function 새쪽(w, op) {
  const 폰 = w < 600
  const ctx = await b.newContext({ viewport: { width: w, height: 900 }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', isMobile: 폰, hasTouch: 폰, acceptDownloads: true, ...(폰 ? { userAgent: UA폰 } : {}) })
  await ctx.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|googlesyndication|geojs|ads-partners\.coupang/, (r) => r.fulfill({ status: 200, body: '' }))
  await ctx.route(/firebaseio\.com|firebasedatabase\.app|identitytoolkit|securetoken|googleapis\.com/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await ctx.addInitScript((op) => {
    try {
      localStorage.setItem('kcm_notice_seen', '2026-10-필독'); sessionStorage.setItem('kcm_notice_seen', '2026-10-업체'); sessionStorage.setItem('kcm_visit_s', '1')
      if (op) localStorage.setItem('kcm_op', '1'); else localStorage.removeItem('kcm_op')
    } catch (e) { /* 없음 */ }
    window.__받기 = []
    const oc = HTMLAnchorElement.prototype.click
    HTMLAnchorElement.prototype.click = function () { if (this.download || /^blob:|^data:/.test(this.href)) window.__받기.push('a ' + (this.download || '')); return oc.apply(this, arguments) }
    window.print = function () { window.__받기.push('print') }
  }, op)
  const p = await ctx.newPage()
  const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e).slice(0, 160)))
  return { ctx, p, 오류 }
}
const 흔적 = (p) => p.evaluate(() => window.__받기.slice())
const 글 = (p, sel = 'body') => p.evaluate((sel) => (document.querySelector(sel) || {}).innerText || '', sel)
const 넘침 = (p) => p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
const 탭들 = ['조정금액', '조정율 산출표', '품목별 등락폭', '적용대가', '공종별 공정', '선금 공제']

/* ── ① 이용자 ── */
for (const w of [390, 1280]) {
  console.log(`■ ① 이용자 ${w}`)
  const { ctx, p, 오류 } = await 새쪽(w, false)
  await p.goto(BASE + '/tools/esc', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('h1:has-text("물가변동 ESC")', { timeout: 30000 })
  ok('잠금 상자 «문의해 주세요» · 문의 단추 · 예시 단추(G669)', /문의해 주세요/.test(await 글(p, '.sg-lock')) && await p.locator('.sg-lock a[href^="/contact?k=cn"]').count() === 1 && await p.locator('button:has-text("🧪 예시 산출서 보기")').count() === 1)
  ok('씀 상자 · 빈 틀 단추 없음(이용자)', await p.locator('.esc-mine').count() === 0 && await p.locator('button:has-text("빈 틀 받기")').count() === 0)
  await p.locator('.tldrop.sg-locked').click(); await 쉬어(300)
  ok('🔒 넣기 누르면 잠금 알림', /ESC 엑셀 넣기는 K-건설맵에 문의해 주세요/.test(await 글(p)))
  ok('ESC 파일 칸 없음(이용자)', await p.locator('input[type=file][accept*=".xls"]').count() === 0)
  await p.locator('button:has-text("🧪 예시 산출서 보기")').click()
  await p.waitForSelector('.esc-card', { timeout: 30000 })
  const 요약 = await 글(p, '.esc-sum')
  ok('예시 요약 — 조정률 5.54% · 조정금액 · 선금 공제 · 적용금액 28,454,000원', /5\.54%/.test(요약) && /40,621,000원/.test(요약) && /12,167,000원/.test(요약) && /28,454,000원/.test(요약), 요약)
  ok('예시 — «가상» 딱지 · 보기만 안내', /가상/.test(await 글(p, '.esc-name')) && /보기만 · 받기 · 인쇄 없음/.test(await 글(p, '.esc-card .sec-title')))
  ok('요건 ✓ 경과 281일 · 조정률 3% 이상', /✓ 경과 281일/.test(await 글(p, '.esc-chips')) && /✓ 조정률 5\.54%/.test(await 글(p, '.esc-chips')))
  const 줄수 = []
  for (const t of 탭들) {
    await p.locator(`.esc-tab:has-text("${t}")`).click(); await 쉬어(150)
    줄수.push(await p.locator('.esc-tbl table tbody tr').count())
  }
  ok('탭 여섯 모두 표가 나옴(줄 수)', 줄수.every((x) => x > 5), 줄수)
  ok('품목 탭 — 22줄 + 머리 6 + 합계', 줄수[2] === 29, 줄수[2])
  await p.locator('.esc-tab:has-text("조정율 산출표")').click(); await 쉬어(150)
  ok('조정율 표 마지막 줄 — 물가변동 조정율 5.54%', /물가변동 조정율[\s\S]*5\.54%/.test(await 글(p, '.esc-tbl')))
  await p.locator('button:has-text("🔒 ESC 엑셀 받기")').click(); await 쉬어(400)
  ok('🔒 받기 눌러도 받기 0 · «예시는 보기만» 알림', (await 흔적(p)).length === 0 && /예시는 보기만 됩니다/.test(await 글(p, '.esc-dl')), await 흔적(p))
  ok('가로 넘침 없음(화면 전체)', (await 넘침(p)) <= 1, await 넘침(p))
  ok('오류 0', 오류.length === 0, 오류)
  await ctx.close()
}

/* ── ② 소장님 브라우저 ── */
{
  console.log('■ ② 소장님 브라우저 390')
  const { ctx, p, 오류 } = await 새쪽(390, true)
  await p.goto(BASE + '/tools/esc', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('.esc-mine', { timeout: 30000 })
  ok('씀 상자 · 잠금 상자 없음 · 빈 틀 단추', await p.locator('.sg-lock').count() === 0 && await p.locator('button:has-text("📄 빈 틀 받기")').count() === 1)
  await p.locator('input[type=file][accept*=".xls"]').setInputFiles(넣을)
  await p.waitForSelector('.esc-card .sec-title:has-text("내 ESC")', { timeout: 60000 })
  const 요약 = await 글(p, '.esc-sum')
  ok('가상 ESC 엑셀 넣기 → 같은 숫자(5.54% · 28,454,000원)', /5\.54%/.test(요약) && /28,454,000원/.test(요약), 요약)
  ok('건설맵 꼴로 읽음', /건설맵 꼴/.test(await 글(p, '.esc-card .sec-title')))
  const [받] = await Promise.all([p.waitForEvent('download', { timeout: 60000 }).catch(() => null), p.locator('button:has-text("📗 ESC 엑셀 받기")').click()])
  let 받숫자 = null
  if (받) {
    const 길 = path.join(곳, 'down.xlsx'); await 받.saveAs(길)
    const r = L.ESC읽기(fs.readFileSync(길)); 받숫자 = E.ESC셈(r.입력).금액.적용금액
  }
  ok('📗 받은 엑셀을 다시 읽어 셈 → 28,454,000', 받 && /_물가변동ESC\.xlsx$/.test(받.suggestedFilename()) && 받숫자 === 28454000, [받 && 받.suggestedFilename(), 받숫자])
  await p.locator('details.esc-edit > summary').click(); await 쉬어(200)
  const 선금칸 = p.locator('.esc-edit label.esc-f:has(span:text-is("선금")) input')
  await 선금칸.fill('0'); await 쉬어(400)
  const 요약2 = await 글(p, '.esc-sum')
  ok('선금 0 으로 고치면 공제 0 · 적용금액 = 조정금액 40,621,000', /선금 공제 \(F\)\s*0원/.test(요약2) && /적용금액 = G − F − H\n40,621,000원/.test(요약2), 요약2)
  await p.locator('.esc-mine button:has-text("🧪 예시 보기")').click()
  await p.waitForSelector('.esc-switch', { timeout: 20000 })
  ok('예시로 바꾸면 받기 단추 🔒', /🔒 ESC 엑셀 받기/.test(await 글(p, '.esc-dl')))
  const 전 = (await 흔적(p)).length
  await p.locator('button:has-text("🔒 ESC 엑셀 받기")').click(); await 쉬어(500)
  ok('소장님이어도 예시는 받기 0(G650)', (await 흔적(p)).length === 전 && /예시는 보기만 됩니다/.test(await 글(p, '.esc-dl')), await 흔적(p))
  await p.locator('.esc-switch button:has-text("내 ESC")').click(); await 쉬어(300)
  ok('📄 내 ESC 로 돌아오면 받기 열림 · 고친 값(선금 0) 그대로', /📗 ESC 엑셀 받기/.test(await 글(p, '.esc-dl')) && /40,621,000원/.test(await 글(p, '.esc-sum')))
  const [빈] = await Promise.all([p.waitForEvent('download', { timeout: 60000 }).catch(() => null), p.locator('button:has-text("📄 빈 틀 받기")').click()])
  let 빈품목 = null
  if (빈) { const 길 = path.join(곳, 'blank.xlsx'); await 빈.saveAs(길); 빈품목 = L.ESC읽기(fs.readFileSync(길)).입력.품목.length }
  ok('📄 빈 틀 받기 → 다시 읽으면 품목 0', 빈 && 빈.suggestedFilename() === '물가변동ESC_빈틀.xlsx' && 빈품목 === 0, [빈 && 빈.suggestedFilename(), 빈품목])
  ok('가로 넘침 없음', (await 넘침(p)) <= 1, await 넘침(p))
  ok('오류 0', 오류.length === 0, 오류)
  await ctx.close()
}
await b.close()
fs.rmSync(곳, { recursive: true, force: true })
console.log(`\n${bad ? '❌' : '✅'} 시험_물가ESC화면 ${n - bad}/${n}`)
process.exit(bad ? 1 : 0)
