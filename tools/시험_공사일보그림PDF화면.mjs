/**
 * 🖼 G586 현장 투입비 · 공사일보 탭(/tools/tuipbi → 🧪 예시 현장 → 📝 공사일보) — 그림 PDF · 그림 인쇄(글자 층 없음) 화면 시험. 구운 사이트(dist)를 띄운 뒤:
 *   node tools/시험_공사일보그림PDF화면.mjs [주소=http://127.0.0.1:4578]        (OUT=/tmp/g10/g586)
 *   소장님 11-08 «엑셀은 그대로 · PDF 는 모두 그림» — tools/그림인쇄훅.js 둘째 도구(첫째 작업일보 G585 · 같은 종이 tools/일보종이.jsx · 판 #il-인쇄).
 *   ① «📄 이 날 공사일보 PDF 저장» → 바로 받음 · PDF 1.4 · 글꼴 0 · 뽑히는 글자 0 · A4 그림 = 쪽 · 이름 «공사일보_날짜_현장.pdf» · 알림
 *   ② 쪽 수 — 같은 판을 브라우저로 인쇄(전 방식 · 글자)한 것과 같거나(꼬리만 넘치면) 한 쪽 덜 · 작업 줄 40 더하면 여러 쪽(머리줄 다시)
 *   ③ «🖨 인쇄» → 인쇄 순간 몸 밑엔 쪽 그림만(@page il세로 · 186 × 273mm) → 그 모습 그대로 PDF 글꼴 0 · 글자 0 · 쪽 같음 · 빈 쪽 없음 · 닫으면 걷힘
 *   ④ 단추 없이 Ctrl+P → 공사일보 칸 · 종이는 안 찍히고(no-print) «단추로 인쇄» 안내 · 쓴 값이 글자로 안 나감
 *   ⑥ 화면을 열어 둔 사이 사이트가 새로 올라가 찍는 도구 파일이 없어진 때(404) → «새로고침 뒤 다시 · 쓴 것은 그대로» 알림
 *   ⑦ 폰 390 · PC 1280 넘침 0 · 오류 0 · 첫 쪽 PNG(눈으로 봄)
 *   인터넷 안 부름(파이어베이스 · 광고 · 애널리틱스 막음) · 가상 예시 현장만 씀(저장되지 않는 예시).
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const BASE = process.argv[2] || 'http://127.0.0.1:4578'
const 폴더 = process.env.OUT || '/tmp/g10/g586'
fs.mkdirSync(폴더, { recursive: true })

let bad = 0, n = 0
const 틀림 = []
const ok = (이름, c, got) => { n++; if (!c) { bad++; 틀림.push(이름) } console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (c || got === undefined ? '' : ' = ' + JSON.stringify(got).slice(0, 400))) }
const 쉬어 = (ms) => new Promise((r) => setTimeout(r, ms))
function PDF보기(파일) {
  const buf = fs.readFileSync(파일)
  const 정보 = execFileSync('pdfinfo', [파일]).toString()
  const 그림 = execFileSync('pdfimages', ['-list', 파일]).toString().trim().split('\n').slice(2).filter((x) => x.trim()).map((x) => x.trim().split(/\s+/))
  return {
    머리: buf.subarray(0, 8).toString('latin1'),
    쪽: Number((/Pages:\s+(\d+)/.exec(정보) || [])[1] || 0),
    글꼴: execFileSync('pdffonts', [파일]).toString().trim().split('\n').slice(2).filter((x) => x.trim()).length,
    글자: execFileSync('pdftotext', ['-layout', 파일, '-']).toString().replace(/[\s\f]/g, ''),
    그림수: 그림.length, 그림폭: 그림.map((c) => Number(c[3])), 그림높: 그림.map((c) => Number(c[4])),
    KB: Math.round(buf.length / 1024),
  }
}
const 쪽수 = (파일) => Number((/Pages:\s+(\d+)/.exec(execFileSync('pdfinfo', [파일]).toString()) || [])[1] || 0)

const b = await chromium.launch()
const UA폰 = 'Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'
for (const [기기, w, h, 폰] of [['PC 1280', 1280, 900, false], ['폰 390', 390, 844, true]]) {
  console.log(`■ ${기기}`)
  const ctx = await b.newContext({ viewport: { width: w, height: h }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', isMobile: 폰, hasTouch: 폰, acceptDownloads: true, ...(폰 ? { userAgent: UA폰 } : {}) })
  await ctx.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|googlesyndication|geojs/, (r) => r.fulfill({ status: 200, body: '' }))
  await ctx.route(/firebaseio\.com|firebasedatabase\.app|identitytoolkit|securetoken/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await ctx.addInitScript(() => { try { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); sessionStorage.setItem('kcm_notice_seen', '2026-10-업체'); sessionStorage.setItem('kcm_visit_s', '1') } catch (e) { /* 없음 */ } })
  /* 받는 파일 이름 — 시험 브라우저는 한글 이름을 «download» 로 바꿔 받으므로 누른 링크의 download 이름을 적어 둠 */
  await ctx.addInitScript(() => { window.__받은이름 = []; document.addEventListener('click', (e) => { const a = e.target && e.target.closest && e.target.closest('a[download]'); if (a) window.__받은이름.push(a.download) }, true) })
  const p = await ctx.newPage()
  const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
  const 꼬리 = 폰 ? '_폰' : ''
  const 열기 = async (q) => {
    await q.goto(BASE + '/tools/tuipbi', { waitUntil: 'domcontentloaded' })
    await q.waitForSelector('button', { timeout: 20000 })
    await 쉬어(800)
    await q.locator('button', { hasText: '예시 현장 보기' }).first().click()
    await 쉬어(1200)
    await q.locator('button', { hasText: '📝 공사일보' }).first().click()
    await 쉬어(800)
  }
  await 열기(p)
  /* 판이 붙는 순간 그 모습(전 방식 견줌용)을 적어 둠 */
  const 판엿보기 = () => p.evaluate(() => {
    window.__판 = null
    if (window.__ob) window.__ob.disconnect()
    const ob = new MutationObserver(() => { const el = document.querySelector('#il-인쇄'); if (el && el.firstElementChild && !window.__판) window.__판 = el.outerHTML })
    ob.observe(document.body, { childList: true, subtree: true })
    window.__ob = ob
  })
  const 전방식 = async (이름) => {           // 같은 판을 브라우저로 인쇄(G584 전 방식 · 글자 PDF) — 쪽 수 견줌
    const html = await p.evaluate(() => window.__판)
    if (!html) return 0
    await p.evaluate((h) => { const d = document.createElement('div'); d.innerHTML = h; document.body.appendChild(d.firstElementChild); document.body.classList.add('il-인쇄중'); document.documentElement.classList.add('il-인쇄중') }, html)
    const 파일 = path.join(폴더, 이름)
    fs.writeFileSync(파일, await p.pdf({ preferCSSPageSize: true, printBackground: true }))
    await p.evaluate(() => { document.querySelectorAll('#il-인쇄').forEach((x) => x.remove()); document.body.classList.remove('il-인쇄중'); document.documentElement.classList.remove('il-인쇄중') })
    return 쪽수(파일)
  }
  const 받기 = async (이름) => {
    await 판엿보기()
    const t0 = Date.now()
    const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 40000 }), p.locator('button', { hasText: '📄 이 날 공사일보 PDF 저장' }).click()])
    const 파일 = path.join(폴더, 이름)
    await dl.saveAs(파일)
    await 쉬어(300)
    return { 파일, 초: (Date.now() - t0) / 1000, 받은이름: await p.evaluate(() => (window.__받은이름 || []).slice(-1)[0] || ''), 말: await p.evaluate(() => [...document.querySelectorAll('[role=status]')].map((x) => x.innerText).join(' | ')) }
  }
  /* ① · ② 예시 그대로 */
  const 하나 = await 받기(`예시${꼬리}.pdf`)
  const A = PDF보기(하나.파일)
  const 쪽px = [Math.round((210 * 96 / 25.4) * 2), Math.round((297 * 96 / 25.4) * 2)]
  ok(`① 📄 PDF 저장 → 바로 받음 · PDF 1.4 · 글꼴 0 · 뽑히는 글자 0 · 그림 ${A.그림수}장 = ${A.쪽}쪽(A4 ${쪽px.join('×')}) · ${A.KB}KB · ${하나.초.toFixed(1)}초`,
    A.머리.startsWith('%PDF-1.4') && A.쪽 >= 1 && A.글꼴 === 0 && A.글자 === '' && A.그림수 === A.쪽 && A.그림폭.every((x) => Math.abs(x - 쪽px[0]) <= 2) && A.그림높.every((x) => Math.abs(x - 쪽px[1]) <= 2), A)
  ok(`① 파일 이름 «${하나.받은이름}»(공사일보_날짜_현장.pdf) · «📄 PDF ${A.쪽}쪽을 만들었습니다» 알림 · 화면 밖 판 걷힘 · 단추 다시`,
    /^공사일보_\d{4}-\d{2}-\d{2}_.+\(예시\)\.pdf$/.test(하나.받은이름) && new RegExp(`PDF ${A.쪽}쪽을 만들었습니다`).test(하나.말) &&
    (await p.evaluate(() => !document.querySelector('#il-인쇄') && ![...document.querySelectorAll('button')].some((x) => /공사일보 PDF 저장|인쇄 \(A4\)/.test(x.textContent) && x.disabled))), [하나.받은이름, 하나.말])
  const 전1 = await 전방식(`예시${꼬리}_전글자.pdf`)
  ok(`② 쪽 수 — 전 방식(브라우저 인쇄) ${전1}쪽 · 그림 ${A.쪽}쪽(같거나 꼬리만 넘친 쪽을 줄여 한 쪽 덜)`, 전1 >= 1 && (A.쪽 === 전1 || A.쪽 === 전1 - 1), { 전: 전1, 그림: A.쪽 })
  execFileSync('pdftoppm', ['-r', '60', '-png', '-f', '1', '-l', '1', 하나.파일, path.join(폴더, `예시${꼬리}`)])
  /* ③ 인쇄 */
  await p.evaluate(() => {
    window.__인쇄 = null
    window.print = () => { const 판 = document.getElementById('kcm-그림인쇄'); const 그림 = 판 ? [...판.querySelectorAll('img.kcm-쪽그림')] : []; window.__인쇄 = { 그림: 그림.length, 아이: 판 ? 판.children.length : -1, 쪽: 그림.map((im) => im.style.page).join(','), 판쪽: 판 ? 판.style.page : '', 다불림: 그림.every((im) => im.complete && im.naturalWidth > 1000), 몸: document.body.classList.contains('kcm-그림인쇄중'), 제목: document.title } }
  })
  const 옛제목 = await p.title()
  await p.locator('button', { hasText: '🖨 인쇄 (A4)' }).first().click()
  let 순간 = null
  for (let i = 0; i < 200 && !순간; i++) { await 쉬어(100); 순간 = await p.evaluate(() => window.__인쇄) }
  ok(`③ 🖨 인쇄 → 인쇄 순간 몸 밑엔 쪽 그림만 ${순간 ? 순간.그림 : '?'}장(쪽 이름 il세로 · 다 불러옴) · 제목 «${순간 ? 순간.제목 : ''}»`,
    !!순간 && 순간.그림 === A.쪽 && 순간.아이 === 순간.그림 && /^(il세로,?)+$/.test(순간.쪽) && 순간.판쪽 === 'il세로' && 순간.다불림 && 순간.몸 && /^공사일보_/.test(순간.제목), 순간)
  if (순간) {
    const 인쇄파일 = path.join(폴더, `예시${꼬리}_인쇄.pdf`)
    fs.writeFileSync(인쇄파일, await p.pdf({ preferCSSPageSize: true, printBackground: true }))
    const B = PDF보기(인쇄파일)
    ok(`③ 인쇄 창 «PDF로 저장» 과 같은 PDF — ${B.쪽}쪽(빈 쪽 없음) · 글꼴 0 · 뽑히는 글자 0(사이트 글도 0)`, B.쪽 === A.쪽 && B.글꼴 === 0 && B.글자 === '', { 쪽: B.쪽, 글꼴: B.글꼴, 글자: B.글자.slice(0, 60) })
    await p.evaluate(() => window.dispatchEvent(new Event('afterprint')))
    await 쉬어(300)
    const 걷힘 = await p.evaluate(() => ({ 판: !!document.getElementById('kcm-그림인쇄'), 몸: document.body.classList.contains('kcm-그림인쇄중') || document.documentElement.classList.contains('kcm-그림인쇄중'), 제목: document.title }))
    ok('③ 인쇄 창을 닫으면 다 걷힘 · 제목 되돌림', !걷힘.판 && !걷힘.몸 && 걷힘.제목 === 옛제목, [걷힘, 옛제목])
  }
  /* ④ Ctrl+P · ⑤ 엑셀 */
  if (!폰) {
    const 바로 = path.join(폴더, '바로인쇄.pdf')
    fs.writeFileSync(바로, await p.pdf({ preferCSSPageSize: true }))
    const 글 = execFileSync('pdftotext', [바로, '-']).toString().replace(/\s+/g, ' ')
    ok('④ 단추 없이 Ctrl+P → «공사일보는 화면의 «📄 PDF 저장» 또는 «🖨 인쇄» 단추로 인쇄해 주세요» 안내 · 공사일보 칸 · 종이 글(특기사항 · 내일 계획) 안 나감',
      /(공사일보|현장 투입비)는 화면의/.test(글) && /단추로 인쇄해 주세요/.test(글) && !/개구부 덮개/.test(글) && !/콘크리트 타설 준비/.test(글), 글.slice(0, 200))
  }
  /* ② 여러 쪽 — 작업 줄 40 더함 */
  const 더 = p.locator('button', { hasText: '＋ 작업 줄' })
  for (let i = 0; i < 40; i++) await 더.click()
  await p.evaluate(() => {
    const 칸들 = [...document.querySelectorAll('input, textarea')].filter((x) => /작업 내용|공종|예:/.test(x.placeholder || '') && !x.value)
    const set = (i, v) => { const f = Object.getOwnPropertyDescriptor(i.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, 'value').set; f.call(i, v); i.dispatchEvent(new Event('input', { bubbles: true })) }
    칸들.slice(0, 60).forEach((i, k) => set(i, '가상 작업 ' + (k + 1)))
  })
  await 쉬어(600)
  const 긴 = await 받기(`긴${꼬리}.pdf`)
  const L = PDF보기(긴.파일)
  const 전L = await 전방식(`긴${꼬리}_전글자.pdf`)
  ok(`② 작업 줄 40 더함 → 그림 ${L.쪽}쪽 · 전 방식 ${전L}쪽(같거나 꼬리만 넘친 쪽을 줄여 한 쪽 덜) · 글꼴 0 · 글자 0`,
    L.쪽 >= 2 && (L.쪽 === 전L || L.쪽 === 전L - 1) && L.글꼴 === 0 && L.글자 === '', { 그림: L.쪽, 전: 전L })
  execFileSync('pdftoppm', ['-r', '60', '-png', '-f', '1', '-l', String(Math.min(2, L.쪽)), 긴.파일, path.join(폴더, `긴${꼬리}`)])
  /* ⑥ 404 */
  if (!폰) {
    const q = await ctx.newPage()
    await q.route((u) => /html2canvas|그림인쇄\./.test(decodeURIComponent(u.toString())), (r) => r.fulfill({ status: 404, body: 'not found' }))
    await 열기(q)
    await q.locator('button', { hasText: '📄 이 날 공사일보 PDF 저장' }).click()
    let 말 = ''
    for (let i = 0; i < 40 && !/새로/.test(말); i++) { await 쉬어(100); 말 = await q.evaluate(() => [...document.querySelectorAll('[role=status]')].map((x) => x.innerText).join(' | ')) }
    const 뒤 = await q.evaluate(() => ({ 판: !!document.querySelector('#il-인쇄'), 단추: [...document.querySelectorAll('button')].some((x) => /📄 이 날 공사일보 PDF 저장/.test(x.textContent) && !x.disabled) }))
    ok('⑥ 화면을 열어 둔 사이 사이트가 새로 올라가 찍는 도구 파일이 없어진 때 → «새로고침(↻) 뒤 다시 · 쓴 것은 그대로» 알림 · 판 걷힘 · 단추 다시',
      /사이트가 새로 바뀌었습니다 — 화면을 새로고침\(↻\)한 뒤 다시 눌러 주세요\(쓴 것은 그대로 남습니다\)/.test(말) && !뒤.판 && 뒤.단추, [말, 뒤])
    await q.close()
  }
  ok(`⑦ ${기기} 넘침 0 · 오류 0`, (await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0 && 오류.length === 0, 오류)
  await ctx.close()
}
await b.close()
console.log(`\n${n}개 중 틀림 ${bad}` + (틀림.length ? '\n  ' + 틀림.join('\n  ') : ''))
process.exit(bad ? 1 : 0)
