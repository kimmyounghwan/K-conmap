/**
 * 🧪 📄 G818 견본 보기 덮개 — 구운 사이트(가짜 파이어베이스 판)를 띄운 뒤:
 *   node tools/시험_견본보기화면.mjs [주소=http://127.0.0.1:5821] [캡처폴더]
 *   소장님 11-21 「견본보기 서류대행 닫기가 없어 ㅎㅎ」(폰 바탕화면 아이콘 앱 — 견본 PDF 가 화면을 덮어 닫을 데가 없었음)
 *   ① 문의(contact.html?k=cn) 도면 작성대행 견본 두 장 — 누르면 새 창 · 새 주소 없음 · 이 쪽 안 덮개 · 큰 그림(2000px 넘게) 읽힘 ·
 *      «✕ 닫기» 위(화면 맨 위 120px 안) · 아래(화면 안) · 누르면 닫히고 쪽 넘김(overflow) 되돌림 · Esc · 뒤로 · «🔍 크게» ↔ «🔍 작게» · 앱이 아니면 «PDF 새 창으로» · 앱이면 없음
 *   ② 분석(/analysis) 업체 성적표 견본(?m=corp) · 발주기관 분석 견본 — 같은 꼴(쪽 그림 일곱 · 위 · 아래 닫기 · Esc · 뒤로 · 크게) · 새 창 없음 · 주소 그대로
 *   ③ 재발 막기 — web/src 의 .jsx 에 «href="/….pdf" target="_blank"» 글이 없음(견본 PDF 는 견본단추로만) · contact.html 견본 고리는 견본열기로
 *   ④ 폰 390 · 320 · PC 1280 · 어두운 — 넘침 0 · 오류 0
 */
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const BASE = process.argv[2] || 'http://127.0.0.1:5821'
const CAP = process.argv[3] || ''

let bad = 0, n = 0
const ok = (이름, c, got) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (c || got === undefined ? '' : ' = ' + JSON.stringify(got).slice(0, 300))) }
const 쉬어 = (ms) => new Promise((r) => setTimeout(r, ms))

console.log('③ 재발 막기 — 글 살핌')
const jsx = []
const 훑기 = (d) => { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); if (f.isDirectory()) 훑기(p); else if (/\.jsx$/.test(f.name)) jsx.push(p) } }
훑기(path.join(ROOT, 'web', 'src'))
/* pages/Report.jsx 는 길이 없음(main.jsx /report → 첫 화면 · 9-19 내린 화면을 되살릴 때를 위해 둔 파일) — 뺌 */
const 새창pdf = jsx.filter((p) => !/[\\/]pages[\\/]Report\.jsx$/.test(p) && /href="\/[^"]+\.pdf"[^>]*target="_blank"/.test(fs.readFileSync(p, 'utf8')))
ok('web/src .jsx 에 «href="/….pdf" target="_blank"» 없음(견본 PDF 는 견본단추로 — 앱에서 PDF 가 화면을 덮지 않게 · 길 없는 Report.jsx 뺌)', 새창pdf.length === 0, 새창pdf.map((p) => path.relative(ROOT, p)))
const 문 = fs.readFileSync(path.join(ROOT, 'web', 'public', 'contact.html'), 'utf8')
ok('contact.html 견본 고리 — 누르면 막고 견본열기(덮개)', /e\.preventDefault\(\)\s*\n?\s*견본열기\(x\[1\]/.test(문) && 문.includes('function 견본열기(제목, 그림, pdf)'))

const b = await chromium.launch()
const UA폰 = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
async function 새쪽(w, h, 폰, { 어둠 = false, 앱 = false } = {}) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', isMobile: 폰, hasTouch: 폰, colorScheme: 어둠 ? 'dark' : 'light', deviceScaleFactor: CAP ? 2 : 1, ...(폰 ? { userAgent: UA폰 } : {}) })
  await ctx.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|googlesyndication|geojs|daumcdn|kakao|coupang/, (r) => r.fulfill({ status: 200, body: '' }))
  await ctx.route(/firebaseio\.com|firebasedatabase\.app|identitytoolkit|securetoken/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await ctx.route(/\/data\/[^?]*\.json/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await ctx.addInitScript((앱_) => {
    try { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); sessionStorage.setItem('kcm_notice_seen', '2026-10-업체'); sessionStorage.setItem('kcm_visit_s', '1'); localStorage.setItem('kcm_op', '1') } catch (e) { /* 없음 */ }
    if (앱_) {   /* 앱(바탕화면 아이콘)으로 연 것처럼 */
      const 원 = window.matchMedia.bind(window)
      window.matchMedia = (q) => (/display-mode:\s*standalone/.test(q) ? { matches: true, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} } : 원(q))
      try { Object.defineProperty(navigator, 'standalone', { value: true, configurable: true }) } catch (e) { /* 없음 */ }
    }
  }, 앱)
  const p = await ctx.newPage()
  const 새창 = []
  ctx.on('page', (q) => 새창.push(q.url()))   /* 이 쪽(p)을 만든 뒤에 엿들음 — 그 뒤 새로 열린 창만 */
  const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
  return { ctx, p, 오류, 새창 }
}
const 넘침 = (p) => p.evaluate(() => document.documentElement.scrollWidth - innerWidth)
const 덮개살핌 = (p, sel) => p.evaluate((s) => {
  const ov = document.querySelector(s.ov); if (!ov) return null
  const 닫 = [...ov.querySelectorAll(s.x)].map((e) => { const r = e.getBoundingClientRect(); return { 글: e.innerText.trim(), 위: Math.round(r.top), 아래: Math.round(r.bottom) } })
  const 그림 = [...ov.querySelectorAll('img')].map((im) => ({ src: im.getAttribute('src'), w: im.naturalWidth, 보임w: Math.round(im.getBoundingClientRect().width) }))
  return { 닫, 그림, pdf: !!ov.querySelector(s.pdf), 높이: innerHeight, 넓이: innerWidth, 넘김: document.documentElement.style.overflow, 주소: location.pathname + location.search }
}, sel)
const 그림기다림 = (p, sel, k = 1) => p.waitForFunction((a) => { const ims = [...document.querySelectorAll(a.ov + ' img')].slice(0, a.k); return ims.length >= a.k && ims.every((im) => im.complete && im.naturalWidth > 0) }, { ov: sel.ov, k }, { timeout: 20000 })

const 문의 = { ov: '.cnv-ov', x: '.cnv-x', pdf: '.cnv-pdf', zoom: '.cnv-zoom', body: '.cnv-body' }
const 분석 = { ov: '.gb-ov', x: '.gb-x', pdf: '.gb-pdf', zoom: '.gb-zoom', body: '.gb-body' }

for (const [이름, w, h, 폰, 어둠] of [['폰 390', 390, 844, true, false], ['폰 320', 320, 640, true, false], ['PC 1280', 1280, 900, false, false], ['폰 390 어두운', 390, 844, true, true]]) {
  console.log(`■ ${이름}`)
  const { ctx, p, 오류, 새창 } = await 새쪽(w, h, 폰, { 어둠 })
  /* ① 문의 · 도면 작성대행 견본 */
  await p.goto(BASE + '/contact.html?k=cn', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('.cn-sample a', { timeout: 15000 })
  const 고리 = await p.evaluate(() => [...document.querySelectorAll('.cn-sample a')].map((a) => a.innerText.trim()))
  const 이름줄 = await p.evaluate(() => (document.querySelector('.cn-sname') || {}).innerText || '')
  ok('① 견본 두 장 · 이름 줄 «누르면 크게»(PDF 말 없음)', 고리.length === 2 && /누르면 크게/.test(이름줄) && !/PDF/.test(이름줄), [고리, 이름줄])
  for (const [i, 닫는법] of [[0, '단추'], [1, 'Esc'], [0, '뒤로']]) {
    await p.locator('.cn-sample a').nth(i).scrollIntoViewIfNeeded()
    await p.locator('.cn-sample a').nth(i).click()
    await p.waitForSelector(문의.ov, { timeout: 5000 })
    await 그림기다림(p, 문의)
    const s = await 덮개살핌(p, 문의)
    ok(`① ${i + 1}번 견본 — 새 창 없음 · 주소 그대로 · 큰 그림(2000px 넘게) · «✕ 닫기» 위(맨 위 120px 안) · 아래(화면 안) · 쪽 넘김 막음 · 앱이 아니면 PDF 새 창 길`, 새창.length === 0 && /^\/contact/.test(s.주소)
      && s.그림.length === 1 && s.그림[0].w >= 2000 && /_크게\.webp$/.test(s.그림[0].src) && s.닫.length === 2 && s.닫.every((x) => x.글 === '✕ 닫기')
      && s.닫[0].위 >= 0 && s.닫[0].아래 <= 120 && s.닫[1].아래 <= s.높이 && s.넘김 === 'hidden' && s.pdf, s)
    if (닫는법 === '단추') {
      await p.locator(문의.zoom).click()
      const 큰 = await 덮개살핌(p, 문의)
      ok('① «🔍 크게» → 그림 폭이 화면보다 넓어짐(밀어 봄) · 단추 글 «🔍 작게»', 큰.그림[0].보임w > 큰.넓이 && (await p.locator(문의.zoom).innerText()).includes('작게'), 큰.그림)
      await p.locator(문의.x).first().click()
    } else if (닫는법 === 'Esc') await p.keyboard.press('Escape')
    else await p.goBack()
    await 쉬어(400)
    const 뒤 = await p.evaluate(() => ({ 있음: !!document.querySelector('.cnv-ov'), 넘김: document.documentElement.style.overflow, 주소: location.pathname + location.search }))
    ok(`① ${닫는법}로 닫힘 · 쪽 넘김 되돌림 · 문의 쪽 그대로(?k=cn)`, !뒤.있음 && 뒤.넘김 !== 'hidden' && /^\/contact.*k=cn/.test(뒤.주소), 뒤)
  }
  if (CAP && !어둠 && w === 390) {
    await p.locator('.cn-sample a').nth(0).click(); await 그림기다림(p, 문의); await 쉬어(300)
    await p.screenshot({ path: `${CAP}/G818_견본보기_문의_390.png` })
    await p.locator(문의.x).first().click(); await 쉬어(300)
  }
  /* ② 분석 · 업체 성적표 견본 · 발주기관 분석 견본 */
  for (const [주소, 제목] of [['/analysis?m=corp', '업체 입찰 성적표 견본'], ['/analysis', '발주기관 분석 견본']]) {
    await p.goto(BASE + 주소, { waitUntil: 'domcontentloaded' })
    const 단 = p.locator('a.btn.primary', { hasText: '📄 견본 보기' })
    await 단.waitFor({ timeout: 20000 })
    await 단.scrollIntoViewIfNeeded()
    await 단.click()
    await p.waitForSelector(분석.ov, { timeout: 5000 })
    await 그림기다림(p, 분석, 2)
    const s = await 덮개살핌(p, 분석)
    const 제 = await p.evaluate(() => (document.querySelector('.gb-top b') || {}).innerText || '')
    ok(`② ${주소} «📄 견본 보기» → 덮개 «${제목} (7쪽)» · 쪽 그림 일곱 · 새 창 없음 · 주소 그대로 · ✕ 닫기 위 · 아래 · PDF 새 창 길(앱 아님)`, 제.includes(`${제목} (7쪽)`) && s.그림.length === 7 && s.그림[0].w > 1000
      && 새창.length === 0 && s.주소 === 주소 && s.닫.length === 2 && s.닫[0].아래 <= 120 && s.닫[1].아래 <= s.높이 && s.pdf && s.넘김 === 'hidden', [제, s])
    await p.locator(분석.zoom).click()
    const 큰 = await 덮개살핌(p, 분석)
    ok('② «🔍 크게» → 쪽 그림이 화면보다 넓어짐', 큰.그림[0].보임w > 큰.넓이, 큰.그림[0])
    await p.locator(분석.x).last().click()
    await 쉬어(400)
    const 뒤 = await p.evaluate(() => ({ 있음: !!document.querySelector('.gb-ov'), 넘김: document.documentElement.style.overflow, 주소: location.pathname + location.search }))
    ok('② 아래 «✕ 닫기» 로 닫힘 · 쪽 넘김 되돌림 · 주소 그대로', !뒤.있음 && 뒤.넘김 !== 'hidden' && 뒤.주소 === 주소, 뒤)
    await 단.click(); await p.waitForSelector(분석.ov); await p.keyboard.press('Escape'); await 쉬어(300)
    ok('② Esc 로 닫힘', !(await p.$(분석.ov)) && (await p.evaluate(() => location.pathname + location.search)) === 주소)
    await 단.click(); await p.waitForSelector(분석.ov); await p.goBack(); await 쉬어(500)
    ok('② 뒤로(브라우저 · 안드로이드) 로 닫힘 · 분석 쪽 그대로', !(await p.$(분석.ov)) && (await p.evaluate(() => location.pathname + location.search)) === 주소, await p.evaluate(() => location.href))
  }
  if (CAP && !어둠 && w === 390) {
    await p.locator('a.btn.primary', { hasText: '📄 견본 보기' }).click(); await 그림기다림(p, 분석, 1); await 쉬어(300)
    await p.screenshot({ path: `${CAP}/G818_견본보기_분석_390.png` })
    await p.keyboard.press('Escape')
  }
  ok('④ 넘침 0 · 오류 0 · 새 창 0', (await 넘침(p)) <= 0 && 오류.length === 0 && 새창.length === 0, [오류, 새창])
  await ctx.close()
}
{
  console.log('■ 앱(바탕화면 아이콘)으로 연 것처럼 — PDF 새 창 길이 안 보임(다시 갇히지 않게)')
  const { ctx, p, 오류, 새창 } = await 새쪽(390, 844, true, { 앱: true })
  await p.goto(BASE + '/contact.html?k=cn', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('.cn-sample a')
  await p.locator('.cn-sample a').first().click()
  await p.waitForSelector(문의.ov)
  const s = await 덮개살핌(p, 문의)
  ok('문의 견본 — 앱이면 «PDF 새 창으로» 없음 · ✕ 닫기 둘', !s.pdf && s.닫.length === 2, s)
  await p.locator(문의.x).first().click(); await 쉬어(300)
  await p.goto(BASE + '/analysis?m=corp', { waitUntil: 'domcontentloaded' })
  const 단 = p.locator('a.btn.primary', { hasText: '📄 견본 보기' })
  await 단.waitFor({ timeout: 20000 }); await 단.click(); await p.waitForSelector(분석.ov)
  const s2 = await 덮개살핌(p, 분석)
  ok('분석 견본 — 앱이면 «PDF 새 창으로» 없음 · ✕ 닫기 둘 · 오류 0 · 새 창 0', !s2.pdf && s2.닫.length === 2 && 오류.length === 0 && 새창.length === 0, [s2, 오류])
  await ctx.close()
}
await b.close()
console.log(`\n${bad ? '✗' : '✓'} 시험_견본보기화면 ${n - bad}/${n}`)
if (bad) process.exit(1)
