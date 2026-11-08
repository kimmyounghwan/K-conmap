/**
 * 🖼 G590 예정공정표(/tools/schedule) — 막대형 · 금액형 그림 PDF · 그림 인쇄(글자 층 없음) 화면 시험. 구운 사이트(dist)를 띄운 뒤:
 *   node tools/시험_공정표그림PDF화면.mjs [주소=http://127.0.0.1:4578]        (OUT=/tmp/g10/g590)
 *   소장님 11-08 «엑셀은 그대로 · PDF 는 모두 그림» — tools/그림인쇄훅.js 여섯째 도구(쓴 횟수 다음). 인쇄 판(#gp-인쇄)을 그림으로:
 *   막대형 A4 가로(@page gp가로 8mm · 글자 칸 281 × 194mm) · 금액형 A3 가로(gc가로A3 7mm · 406 × 283mm) · A4 가로(gc가로A4 6mm · 285 × 198mm) — 쪽은 미리 나눔.
 *   «🧪 예시로 해 보기»(화면에만 · 적어 둔 칸은 그대로) 로:
 *   ① «📄 PDF 저장» → 바로 받음 · PDF 1.4 · 글꼴 0 · 뽑히는 글자 0 · 그림 = 쪽 · 용지 크기 · 쪽마다 내용 · 이름 «예정공정표_공사명.pdf» · 알림(단추 곁)
 *   ② 쪽 수 = 같은 판을 브라우저로 인쇄(전 방식 · 글자)한 것 중 내용 있는 쪽 수 · 첫 쪽 PNG(눈으로 봄)
 *   ③ «🖨 인쇄» → 인쇄 순간 몸 밑엔 쪽 그림만(그 @page 이름 · 크기) → 그 모습 그대로 PDF 글꼴 0 · 글자 0 · 쪽 같음 · 닫으면 걷힘
 *   ④ 단추 없이 Ctrl+P → 공정표 칸은 안 찍히고 «단추로 인쇄» 안내 ⑤ 404 → «새로고침 뒤 다시» 알림 · 판 걷힘
 *   ⑥ 폰 390 · PC 1280 넘침 0 · 오류 0 ⑦ 금액형 여러 쪽(공종 24줄 더 — 쪽들이 한 덩이로 다 찍힘)
 *   인터넷 안 부름 · 예시(지어낸 공사)만 씀.
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const BASE = process.argv[2] || 'http://127.0.0.1:4578'
const 폴더 = process.env.OUT || '/tmp/g10/g590'
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
    크기: ((/Page size:\s+([\d.]+) x ([\d.]+)/.exec(정보) || []).slice(1).map(Number)),
    글꼴: execFileSync('pdffonts', [파일]).toString().trim().split('\n').slice(2).filter((x) => x.trim()).length,
    글자: execFileSync('pdftotext', ['-layout', 파일, '-']).toString().replace(/[\s\f]/g, ''),
    그림수: 그림.filter((c) => Number(c[3]) > 1000).length,
    KB: Math.round(buf.length / 1024),
  }
}
function 검은점들(파일, 머리) {
  execFileSync('pdftoppm', ['-r', '30', '-gray', 파일, 머리])
  const 파일들 = fs.readdirSync(path.dirname(머리)).filter((f) => f.startsWith(path.basename(머리) + '-') && f.endsWith('.pgm')).sort().map((f) => path.join(path.dirname(머리), f))
  return 파일들.map((그림파일) => {
    const buf = fs.readFileSync(그림파일)
    fs.unlinkSync(그림파일)
    let i = 0, 줄 = 0
    while (줄 < 3) { if (buf[i] === 10) 줄++; i++ }
    let 검 = 0
    for (let k = i; k < buf.length; k++) if (buf[k] < 128) 검++
    return Math.round((검 / (buf.length - i)) * 10000) / 100
  })
}
/* 용지 — [이름, 쪽 크기 pt(가로), @page 이름, 그림 mm] */
const 용지들 = {
  막대A4: { pt: [841.89, 595.28], 쪽: 'gp가로', mm: '281mm×194mm' },
  A3: { pt: [1190.55, 841.89], 쪽: 'gc가로A3', mm: '406mm×283mm' },
  A4: { pt: [841.89, 595.28], 쪽: 'gc가로A4', mm: '285mm×198mm' },
}

const b = await chromium.launch()
const UA폰 = 'Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'
for (const [기기, w, h, 폰] of [['PC 1280', 1280, 900, false], ['폰 390', 390, 844, true]]) {
  console.log(`■ ${기기}`)
  const ctx = await b.newContext({ viewport: { width: w, height: h }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', isMobile: 폰, hasTouch: 폰, acceptDownloads: true, ...(폰 ? { userAgent: UA폰 } : {}) })
  await ctx.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|googlesyndication|geojs/, (r) => r.fulfill({ status: 200, body: '' }))
  await ctx.route(/firebaseio\.com|firebasedatabase\.app|identitytoolkit|securetoken/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await ctx.addInitScript(() => { try { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); sessionStorage.setItem('kcm_notice_seen', '2026-10-업체'); sessionStorage.setItem('kcm_visit_s', '1') } catch (e) { /* 없음 */ } })
  await ctx.addInitScript(() => { window.__받은이름 = []; document.addEventListener('click', (e) => { const a = e.target && e.target.closest && e.target.closest('a[download]'); if (a) window.__받은이름.push(a.download) }, true) })
  const p = await ctx.newPage()
  const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
  const 꼬리 = 폰 ? '_폰' : ''
  const 앞 = 폰 ? '(폰) ' : ''
  const 예시로 = async (q) => {
    await q.goto(BASE + '/tools/schedule', { waitUntil: 'domcontentloaded' })
    await q.waitForSelector('button', { timeout: 20000 })
    await 쉬어(800)
    await q.locator('button', { hasText: '예시로 해 보기' }).first().click()
    await 쉬어(1200)
  }
  const 판엿보기 = (q) => q.evaluate(() => {
    window.__판 = null
    if (window.__ob) window.__ob.disconnect()
    const ob = new MutationObserver(() => { const el = document.querySelector('#gp-인쇄'); if (el && el.firstElementChild && !window.__판) window.__판 = el.outerHTML })
    ob.observe(document.body, { childList: true, subtree: true })
    window.__ob = ob
  })
  /* 전 방식 — 같은 판을 몸에 붙이고 gp-인쇄중(옛 use인쇄 그대로)으로 브라우저 인쇄 → 내용 있는 쪽 수 */
  const 전방식 = async (이름) => {
    const html = await p.evaluate(() => window.__판)
    if (!html) return { 내용: 0, 전체: 0 }
    await p.evaluate((hh) => { const d = document.createElement('div'); d.innerHTML = hh; document.body.appendChild(d.firstElementChild); document.body.classList.add('gp-인쇄중'); document.documentElement.classList.add('gp-인쇄중') }, html)
    const 파일 = path.join(폴더, 이름)
    fs.writeFileSync(파일, await p.pdf({ preferCSSPageSize: true, printBackground: true }))
    await p.evaluate(() => { document.querySelectorAll('#gp-인쇄').forEach((x) => x.remove()); document.body.classList.remove('gp-인쇄중'); document.documentElement.classList.remove('gp-인쇄중') })
    const 점 = 검은점들(파일, path.join(폴더, '전점_' + 이름))
    return { 내용: 점.filter((x) => x > 0.02).length, 전체: 점.length }
  }
  const 한판 = async (이름표, 용, 고르기) => {
    if (고르기) await 고르기()
    await 판엿보기(p)
    const 단 = p.locator('.kt-btns button', { hasText: '📄 PDF 저장' }).first()
    const 단글 = (await 단.innerText()).trim()
    const t0 = Date.now()
    const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 60000 }), 단.click()])
    const 파일 = path.join(폴더, `공정_${이름표}${꼬리}.pdf`)
    await dl.saveAs(파일)
    await 쉬어(300)
    const 이름 = await p.evaluate(() => (window.__받은이름 || []).slice(-1)[0] || '')
    const 말 = await p.evaluate(() => [...document.querySelectorAll('.gp-say[role=status]')].map((x) => x.innerText).join(' | '))
    const A = PDF보기(파일)
    const 점 = 검은점들(파일, path.join(폴더, `점_${이름표}${꼬리}`))
    const 쪽글 = (/(\d+)쪽\)/.exec(단글) || [])[1]
    ok(`${앞}${이름표} ① 📄 «${단글}» → 바로 받음 · PDF 1.4 · 글꼴 0 · 글자 0 · 그림 ${A.그림수} = ${A.쪽}쪽 · ${A.크기.map((x) => Math.round(x)).join('×')}pt · 쪽마다 검은 점 ${점.join(' · ')}% · ${A.KB}KB · ${((Date.now() - t0) / 1000).toFixed(1)}초`,
      A.머리.startsWith('%PDF-1.4') && A.쪽 >= 1 && A.글꼴 === 0 && A.글자 === '' && A.그림수 >= A.쪽 && Math.abs(A.크기[0] - 용.pt[0]) < 1 && Math.abs(A.크기[1] - 용.pt[1]) < 1 && 점.length === A.쪽 && 점.every((x) => x > 0.02) && (!쪽글 || Number(쪽글) === A.쪽), { ...A, 점, 단글 })
    ok(`${앞}${이름표} ① 이름 «${이름}» · 알림 «PDF ${A.쪽}쪽» · 판 걷힘`, /^예정공정표_.+\.pdf$/.test(이름) && new RegExp(`PDF ${A.쪽}쪽을 만들었습니다`).test(말) && !(await p.evaluate(() => !!document.querySelector('#gp-인쇄'))), [이름, 말])
    const 전 = await 전방식(`공정_${이름표}${꼬리}_전글자.pdf`)
    ok(`${앞}${이름표} ② 쪽 수 — 전 방식 내용 ${전.내용}쪽(전체 ${전.전체}) · 그림 ${A.쪽}쪽 같음`, 전.내용 >= 1 && A.쪽 === 전.내용, { 전, 그림: A.쪽 })
    execFileSync('pdftoppm', ['-r', '40', '-png', '-f', '1', '-l', '1', 파일, path.join(폴더, `공정_${이름표}${꼬리}`)])
    /* ③ 인쇄 */
    await p.evaluate(() => {
      window.__인쇄 = null
      window.print = () => { const 판 = document.getElementById('kcm-그림인쇄'); const 그림 = 판 ? [...판.querySelectorAll('img.kcm-쪽그림')] : []; window.__인쇄 = { 그림: 그림.length, 쪽: [...new Set(그림.map((im) => im.style.page))].join(','), 판쪽: 판 ? 판.style.page : '?', 크기: 그림[0] ? 그림[0].style.width + '×' + 그림[0].style.height : '', 다불림: 그림.every((im) => im.complete && im.naturalWidth > 500), 몸: document.body.classList.contains('kcm-그림인쇄중') } }
    })
    await p.locator('.kt-btns button', { hasText: '🖨 인쇄' }).first().click()
    let 순간 = null
    for (let i = 0; i < 300 && !순간; i++) { await 쉬어(100); 순간 = await p.evaluate(() => window.__인쇄) }
    ok(`${앞}${이름표} ③ 🖨 인쇄 → 몸 밑엔 쪽 그림만 ${순간 ? 순간.그림 : '?'}장(${순간 ? 순간.크기 : ''} · 쪽 이름 ${용.쪽} · 다 불러옴)`, !!순간 && 순간.그림 === A.쪽 && 순간.쪽 === 용.쪽 && 순간.판쪽 === 용.쪽 && 순간.크기 === 용.mm && 순간.다불림 && 순간.몸, 순간)
    if (순간) {
      const 인쇄파일 = path.join(폴더, `공정_${이름표}${꼬리}_인쇄.pdf`)
      fs.writeFileSync(인쇄파일, await p.pdf({ preferCSSPageSize: true, printBackground: true }))
      const B = PDF보기(인쇄파일)
      ok(`${앞}${이름표} ③ 인쇄 창 «PDF로 저장» 과 같은 PDF — ${B.쪽}쪽(빈 쪽 없음) · ${B.크기.map((x) => Math.round(x)).join('×')}pt · 글꼴 0 · 글자 0`, B.쪽 === A.쪽 && Math.abs(B.크기[0] - 용.pt[0]) < 1 && B.글꼴 === 0 && B.글자 === '', B)
      await p.evaluate(() => window.dispatchEvent(new Event('afterprint')))
      await 쉬어(300)
      ok(`${앞}${이름표} ③ 인쇄 창을 닫으면 다 걷힘`, await p.evaluate(() => !document.getElementById('kcm-그림인쇄') && !document.body.classList.contains('kcm-그림인쇄중') && !document.querySelector('#gp-인쇄')))
    }
    return A
  }
  await 예시로(p)
  await 한판('막대형', 용지들.막대A4)
  if (!폰) {
    const 바로 = path.join(폴더, '바로인쇄.pdf')
    fs.writeFileSync(바로, await p.pdf({ preferCSSPageSize: true }))
    const 바글 = execFileSync('pdftotext', [바로, '-']).toString().replace(/\s+/g, ' ')
    ok('④ 단추 없이 Ctrl+P → «예정공정표는 화면의 … 단추로 인쇄해 주세요» 안내 · 적은 공사명 · 공정표 글 안 나감(도구 설명 글은 나감)', /예정공정표는 화면의/.test(바글) && /단추로 인쇄해 주세요/.test(바글) && !/○○동 배수로/.test(바글) && !/공사명/.test(바글.replace(/공사명,/g, '')), 바글.slice(0, 300))
  }
  /* 금액형 — A3(처음) · A4 */
  await p.locator('[role=tab]', { hasText: '금액형' }).first().click()
  await 쉬어(1200)
  const 용지칸 = p.locator('select[aria-label="용지"]').first()
  await 한판('금액형A3', 용지들.A3, async () => { await 용지칸.selectOption('A3'); await 쉬어(500) })
  await 한판('금액형A4', 용지들.A4, async () => { await 용지칸.selectOption('A4'); await 쉬어(500) })
  /* 여러 쪽 — 공종을 24줄 더 넣어 A4 가로가 여러 쪽(쪽들을 한 덩이 .gc-쪽들 로 감싸지 않으면 첫 쪽만 찍힘 · 재발 막기) */
  if (!폰) {
    for (let i = 0; i < 24; i++) await p.locator('button', { hasText: '＋ 공종' }).first().click()
    const 줄들 = p.locator('table.gc-edit tbody tr')
    const 수 = await 줄들.count()
    for (let i = 수 - 24; i < 수; i++) await 줄들.nth(i).locator('td:nth-child(3) input').fill('시험 공종 ' + (i + 1))
    await 쉬어(800)
    const A = await 한판('금액형A4여러쪽', 용지들.A4)
    ok(`금액형 A4 여러 쪽 — ${A.쪽}쪽(2쪽 넘게 · 단추 글의 쪽 수와 같음)`, A.쪽 >= 2, A.쪽)
  }
  /* ⑤ 404 */
  if (!폰) {
    const q = await ctx.newPage()
    await q.route((u) => /html2canvas|그림인쇄\./.test(decodeURIComponent(u.toString())), (r) => r.fulfill({ status: 404, body: 'not found' }))
    await 예시로(q)
    await q.locator('[role=tab]', { hasText: '막대형' }).first().click()
    await 쉬어(600)
    await q.locator('.kt-btns button', { hasText: '📄 PDF 저장' }).first().click()
    let 말 = ''
    for (let i = 0; i < 40 && !/새로/.test(말); i++) { await 쉬어(100); 말 = await q.evaluate(() => [...document.querySelectorAll('.gp-say[role=status]')].map((x) => x.innerText).join(' | ')) }
    ok('⑤ 찍는 도구 파일이 없어진 때(404) → «새로고침(↻) 뒤 다시 · 쓴 것은 그대로» 알림 · 판 걷힘', /사이트가 새로 바뀌었습니다 — 화면을 새로고침\(↻\)한 뒤 다시 눌러 주세요\(쓴 것은 그대로 남습니다\)/.test(말) && !(await q.evaluate(() => !!document.querySelector('#gp-인쇄'))), 말)
    await q.close()
  }
  ok(`⑥ ${기기} 넘침 0 · 오류 0`, (await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0 && 오류.length === 0, 오류)
  await ctx.close()
}
await b.close()
console.log(`\n${n}개 중 틀림 ${bad}` + (틀림.length ? '\n  ' + 틀림.join('\n  ') : ''))
process.exit(bad ? 1 : 0)
