/**
 * 🖼 G601 장비 임대료·수금 장부(/tools/equip) 🧾 청구서 — 그림 PDF · 그림 인쇄(글자 층 없음) 화면 시험. 구운 사이트(dist)를 띄운 뒤:
 *   node tools/시험_장비청구서그림PDF화면.mjs [주소=http://127.0.0.1:4578]        (OUT=/tmp/g10/g601)
 *   소장님 11-08 «엑셀은 그대로 · PDF 는 모두 그림» — 인쇄 판(#gp-인쇄 · 거래처마다 .eq-쪽 · 한 덩이 .eq-쪽들)을 그림으로 —
 *   A4 세로 @page eq세로 12mm(글자 칸 186 × 273mm) · 거래처마다 새 쪽(break-after) 그대로.
 *   ① 👀 예시 장부(지어낸 기사 · 거래처 · 이번 달) → 🧾 «📄 PDF 저장 (1장)» → 바로 받음 · PDF 1.4 · 글꼴 0 · 글자 0 · 그림 = 쪽 · A4 세로 · 쪽마다 내용 ·
 *      이름 «장비청구서_거래처_년-월.pdf»(📗 엑셀과 같게) · 알림 · 찍는 동안 단추 막음 · 판 걷힘 · 쪽 수 = 전 방식(gp-인쇄중 · 브라우저 인쇄) 내용 쪽과 같거나 한 쪽 덜
 *   ② «이 달 거래처 모두» → 2장 → 2쪽 · 이름 «장비청구서_거래처모두_년-월.pdf» ③ «🖨 인쇄» → 몸 밑엔 쪽 그림만(eq세로 · 186 × 273mm) → 같은 PDF · 닫으면 걷힘
 *   ④ 📗 엑셀 그대로 ⑤ 단추 없이 Ctrl+P → 장부 화면은 안 찍히고 «단추로 인쇄» 안내 ⑥ 404 ⑦ 폰 390 · PC 1280 넘침 0 · 오류 0
 *   인터넷 안 부름 · 지어낸 예시만(장부 서버 안 씀).
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const BASE = process.argv[2] || 'http://127.0.0.1:4578'
const 폴더 = process.env.OUT || '/tmp/g10/g601'
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
/* 쪽마다 «먹» 비율(%) — 흰 종이(255)가 아니면 셈(30dpi 에선 작은 글이 옅은 회색) */
function 먹들(파일, 머리) {
  execFileSync('pdftoppm', ['-r', '30', '-gray', 파일, 머리])
  const 파일들 = fs.readdirSync(path.dirname(머리)).filter((f) => f.startsWith(path.basename(머리) + '-') && f.endsWith('.pgm')).sort().map((f) => path.join(path.dirname(머리), f))
  return 파일들.map((그림파일) => {
    const buf = fs.readFileSync(그림파일)
    fs.unlinkSync(그림파일)
    let i = 0, 줄 = 0
    while (줄 < 3) { if (buf[i] === 10) 줄++; i++ }
    let 검 = 0
    for (let k = i; k < buf.length; k++) if (buf[k] < 230) 검++
    return Math.round((검 / (buf.length - i)) * 10000) / 100
  })
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
  const 새로 = async (q) => {
    await q.goto(BASE + '/tools/equip', { waitUntil: 'domcontentloaded' })
    await q.waitForSelector('.eq', { timeout: 20000 })
    await 쉬어(500)
    await q.locator('.eq button', { hasText: '👀 예시로 해 보기' }).first().click()
    await q.waitForSelector('.eq .eq-tabs', { timeout: 10000 })
    await 쉬어(400)
    await q.locator('.eq .eq-tabs button', { hasText: '🧾 청구서' }).click()
    await 쉬어(500)
  }
  const 이달 = await p.evaluate(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` })
  const PDF단추 = (q) => q.locator('.eq .eq-bar button', { hasText: /📄 PDF 저장|PDF 만드는 중/ })
  const 인쇄단추 = (q) => q.locator('.eq .eq-bar button', { hasText: /^🖨 인쇄$|준비 중/ })
  const 판엿보기 = (q) => q.evaluate(() => {
    window.__판 = null
    if (window.__ob) window.__ob.disconnect()
    const ob = new MutationObserver(() => { const el = document.querySelector('#gp-인쇄'); if (el && el.firstElementChild && !window.__판) window.__판 = el.outerHTML })
    ob.observe(document.body, { childList: true, subtree: true })
    window.__ob = ob
  })
  const 전방식 = async (q, 이름) => {
    const html = await q.evaluate(() => window.__판)
    if (!html) return { 내용: 0, 전체: 0 }
    await q.evaluate((hh) => { const d = document.createElement('div'); d.innerHTML = hh; document.body.appendChild(d.firstElementChild); document.body.classList.add('gp-인쇄중'); document.documentElement.classList.add('gp-인쇄중') }, html)
    const 파일 = path.join(폴더, 이름)
    fs.writeFileSync(파일, await q.pdf({ preferCSSPageSize: true, printBackground: true }))
    await q.evaluate(() => { document.querySelectorAll('#gp-인쇄').forEach((x) => x.remove()); document.body.classList.remove('gp-인쇄중'); document.documentElement.classList.remove('gp-인쇄중') })
    const 먹 = 먹들(파일, path.join(폴더, '전먹_' + 이름))
    return { 내용: 먹.filter((x) => x > 0).length, 전체: 먹.length, 먹 }
  }
  const 말 = (q) => q.evaluate(() => [...document.querySelectorAll('.eq-찍말')].map((x) => x.innerText).join(' | '))
  const 한판 = async (이름표, 이름꼴, 기대쪽) => {
    await 판엿보기(p)
    const t0 = Date.now()
    const [dl, 막음] = await Promise.all([
      p.waitForEvent('download', { timeout: 60000 }),
      (async () => { await PDF단추(p).click(); await 쉬어(60); return [await PDF단추(p).isDisabled(), await 인쇄단추(p).isDisabled()] })(),
    ])
    const 파일 = path.join(폴더, `장비_${이름표}${꼬리}.pdf`)
    await dl.saveAs(파일)
    await 쉬어(400)
    const 이름 = await p.evaluate(() => (window.__받은이름 || []).slice(-1)[0] || '')
    const 알림 = await 말(p)
    const A = PDF보기(파일)
    const 먹 = 먹들(파일, path.join(폴더, `먹_${이름표}${꼬리}`))
    ok(`${앞}${이름표} 📄 PDF → 바로 받음 · PDF 1.4 · 글꼴 0 · 글자 0 · 그림 ${A.그림수} = ${A.쪽}쪽(기대 ${기대쪽}) · 세로 A4 · 쪽마다 먹 ${먹.join(' · ')}% · ${A.KB}KB · ${((Date.now() - t0) / 1000).toFixed(1)}초`,
      A.머리.startsWith('%PDF-1.4') && A.쪽 === 기대쪽 && A.글꼴 === 0 && A.글자 === '' && A.그림수 >= A.쪽 && Math.abs(A.크기[0] - 595.28) < 1 && Math.abs(A.크기[1] - 841.89) < 1 && 먹.length === A.쪽 && 먹.every((x) => x > 0), { ...A, 먹 })
    ok(`${앞}${이름표} 이름 «${이름}» · 알림 «PDF ${A.쪽}쪽» · 찍는 동안 단추 막음(${막음.join(',')}) · 판 걷힘`, 이름꼴.test(이름) && new RegExp(`PDF ${A.쪽}쪽을 만들었습니다`).test(알림) && 막음.every(Boolean) && !(await p.evaluate(() => !!document.querySelector('#gp-인쇄'))), [이름, 알림, 막음])
    let 전 = null
    if (!폰) {
      전 = await 전방식(p, `장비_${이름표}_전글자.pdf`)
      ok(`${이름표} 쪽 수 — 전 방식 내용 ${전.내용}쪽(전체 ${전.전체}) · 그림 ${A.쪽}쪽(같거나 한 쪽 덜)`, 전.내용 >= 1 && (A.쪽 === 전.내용 || A.쪽 === 전.내용 - 1), 전)
    }
    execFileSync('pdftoppm', ['-r', '30', '-png', 파일, path.join(폴더, `장비_${이름표}${꼬리}`)])
    return { ...A, 전 }
  }
  const 이달꼴 = 이달.replace('-', '\\-')

  await 새로(p)
  const 한 = await 한판('한거래처', new RegExp(`^장비청구서_가나건설\\(주\\)_${이달꼴}\\.pdf$`), 1)
  /* ② 이 달 거래처 모두 */
  await p.locator('.eq .eq-bar label.eq-chk', { hasText: '이 달 거래처 모두' }).locator('input').check()
  await 쉬어(400)
  const 글 = (await PDF단추(p).innerText()).trim()
  ok(`${앞}② «이 달 거래처 모두» → 단추 «${글}»`, 글 === '📄 PDF 저장 (2장)', 글)
  const 모 = await 한판('모두', new RegExp(`^장비청구서_거래처모두_${이달꼴}\\.pdf$`), 2)
  /* ③ 인쇄 */
  {
    await p.evaluate(() => {
      window.__인쇄 = null
      window.print = () => { const 판 = document.getElementById('kcm-그림인쇄'); const 그림 = 판 ? [...판.querySelectorAll('img.kcm-쪽그림')] : []; window.__인쇄 = { 그림: 그림.length, 쪽: [...new Set(그림.map((im) => im.style.page))].join(','), 판쪽: 판 ? 판.style.page : '?', 크기: 그림[0] ? 그림[0].style.width + '×' + 그림[0].style.height : '', 다불림: 그림.every((im) => im.complete && im.naturalWidth > 1000), 몸: document.body.classList.contains('kcm-그림인쇄중') } }
    })
    await 인쇄단추(p).click()
    let 순간 = null
    for (let i = 0; i < 300 && !순간; i++) { await 쉬어(100); 순간 = await p.evaluate(() => window.__인쇄) }
    ok(`${앞}③ 🖨 인쇄 → 몸 밑엔 쪽 그림만 ${순간 ? 순간.그림 : '?'}장(${순간 ? 순간.크기 : ''} · eq세로 · 다 불러옴)`, !!순간 && 순간.그림 === 모.쪽 && 순간.쪽 === 'eq세로' && 순간.판쪽 === 'eq세로' && 순간.크기 === '186mm×273mm' && 순간.다불림 && 순간.몸, 순간)
    if (순간) {
      const 인쇄파일 = path.join(폴더, `장비_인쇄${꼬리}.pdf`)
      fs.writeFileSync(인쇄파일, await p.pdf({ preferCSSPageSize: true, printBackground: true }))
      const B = PDF보기(인쇄파일)
      ok(`${앞}③ 인쇄 창 «PDF로 저장» 과 같은 PDF — ${B.쪽}쪽(빈 쪽 없음) · 세로 · 글꼴 0 · 글자 0`, B.쪽 === 모.쪽 && B.크기[1] > B.크기[0] && B.글꼴 === 0 && B.글자 === '', B)
      await p.evaluate(() => window.dispatchEvent(new Event('afterprint')))
      await 쉬어(300)
      ok(`${앞}③ 인쇄 창을 닫으면 다 걷힘`, await p.evaluate(() => !document.getElementById('kcm-그림인쇄') && !document.body.classList.contains('kcm-그림인쇄중') && !document.getElementById('gp-인쇄')))
    }
  }
  if (!폰) {
    /* ④ 엑셀 */
    const [x1] = await Promise.all([p.waitForEvent('download', { timeout: 30000 }), p.locator('.eq .eq-bar button', { hasText: '📗 엑셀' }).click()])
    await x1.saveAs(path.join(폴더, '장비.xlsx'))
    await 쉬어(200)
    const n1 = await p.evaluate(() => (window.__받은이름 || []).slice(-1)[0] || '')
    ok(`④ 📗 엑셀 그대로 받아짐 «${n1}»`, new RegExp(`^장비청구서_거래처모두_${이달꼴}\\.xlsx$`).test(n1) && fs.readFileSync(path.join(폴더, '장비.xlsx')).subarray(0, 2).toString('latin1') === 'PK', n1)
    /* ⑤ Ctrl+P */
    const 바로 = path.join(폴더, '바로인쇄.pdf')
    fs.writeFileSync(바로, await p.pdf({ preferCSSPageSize: true }))
    const 바글 = execFileSync('pdftotext', ['-layout', 바로, '-']).toString().replace(/\s+/g, '')
    ok('⑤ 단추 없이 Ctrl+P → «장비 장부 청구서는 «🧾 청구서» 탭의 … 단추로 인쇄해 주세요» 안내 · 장부 화면 글 안 나감', /장비장부청구서는«🧾청구서»탭의/.test(바글) && /단추로인쇄해주세요/.test(바글) && !/가나건설/.test(바글) && !/누계미수/.test(바글), 바글.slice(0, 200))
    /* ⑥ 404 */
    const q = await ctx.newPage()
    await q.route((u) => /html2canvas|그림인쇄\./.test(decodeURIComponent(u.toString())), (r) => r.fulfill({ status: 404, body: 'not found' }))
    await 새로(q)
    await PDF단추(q).click()
    let 말4 = ''
    for (let i = 0; i < 50 && !/새로/.test(말4); i++) { await 쉬어(100); 말4 = await 말(q) }
    ok('⑥ 찍는 도구 파일이 없어진 때(404) → «새로고침(↻) 뒤 다시 · 쓴 것은 그대로» 알림 · 판 걷힘 · 단추 다시 켜짐', /사이트가 새로 바뀌었습니다 — 화면을 새로고침\(↻\)한 뒤 다시 눌러 주세요\(쓴 것은 그대로 남습니다\)/.test(말4) && !(await q.evaluate(() => !!document.querySelector('#gp-인쇄'))) && !(await PDF단추(q).isDisabled()), 말4)
    await q.close()
  }
  ok(`⑦ ${기기} 넘침 0 · 오류 0`, (await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 1 && 오류.length === 0, 오류)
  void 한
  await ctx.close()
}
await b.close()
console.log(`\n${n}개 중 틀림 ${bad}` + (틀림.length ? '\n  ' + 틀림.join('\n  ') : ''))
process.exit(bad ? 1 : 0)
