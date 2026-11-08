/**
 * 🖼 G598 산업안전보건관리비 계상기 · 사용내역서(/tools/sanan) — 그림 PDF · 그림 인쇄(글자 층 없음) 화면 시험. 구운 사이트(dist)를 띄운 뒤:
 *   node tools/시험_산안비그림PDF화면.mjs [주소=http://127.0.0.1:4578]        (OUT=/tmp/g10/g598)
 *   소장님 11-08 «엑셀은 그대로 · PDF 는 모두 그림» — 인쇄 판 둘(① 계상 내역 한 장 · ④ 사용내역서 총괄 + 항목별 쪽)을 그림으로 —
 *   A4 세로 @page sn세로 10mm(글자 칸 190 × 277mm) · 쪽마다 새 쪽(.sn-쪽 break-after) 그대로 · 판 안 쪽들은 한 덩이(.sn-쪽들).
 *   ① 🧪 예시(지어낸 현장 · 2026-09) → ① 계상 «📄 계상 내역 PDF 저장» → 바로 받음 · PDF 1.4 · 글꼴 0 · 글자 0 · 그림 = 쪽 · A4 세로 · 쪽마다 내용 ·
 *      이름 «산안비_계상.pdf» · 알림 · 찍는 동안 단추 막음 · 판 걷힘
 *   ② ④ 사용내역서 «📄 사용내역서 PDF 저장 (A4 · 10쪽)» → 10쪽 · 이름 «산안비_사용내역서_2026-09.pdf» / «이 달에 쓴 항목 쪽만» → 4쪽(총괄 + 1 · 2 · 6)
 *   ③ 쪽 수 = 같은 판을 전 방식(gp-인쇄중 · 브라우저 인쇄 · 글자)으로 찍은 내용 쪽과 같거나 한 쪽 덜
 *   ④ «🖨 인쇄» → 인쇄 순간 몸 밑엔 쪽 그림만(sn세로 · 190 × 277mm) → 같은 PDF · 닫으면 걷힘
 *   ⑤ 📗 엑셀 둘(계상 · 서식 칸 그대로) 그대로 받아짐 ⑥ 단추 없이 Ctrl+P → 화면은 안 찍히고 «단추로 인쇄» 안내 ⑦ 404 ⑧ 폰 390 · PC 1280 넘침 0 · 오류 0
 *   인터넷 안 부름 · 지어낸 예시만.
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const BASE = process.argv[2] || 'http://127.0.0.1:4578'
const 폴더 = process.env.OUT || '/tmp/g10/g598'
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
    await q.goto(BASE + '/tools/sanan', { waitUntil: 'domcontentloaded' })
    await q.evaluate(() => { localStorage.removeItem('kcm_sanan1'); localStorage.removeItem('kcm_sanan_tab') })
    await q.reload({ waitUntil: 'domcontentloaded' })
    await q.waitForSelector('.wrap.sn .eq-tabs', { timeout: 20000 })
    await 쉬어(500)
    await q.locator('button', { hasText: '🧪 예시로 해 보기' }).first().click()
    await 쉬어(600)
  }
  const 탭 = async (q, 이름) => { await q.locator('.wrap.sn .eq-tabs [role=tab]', { hasText: 이름 }).click(); await 쉬어(400) }
  const 줄 = (q, 글) => q.locator('.wrap.sn .btn-row', { has: q.locator('button', { hasText: 글 }) })
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
  const 말 = (q) => q.evaluate(() => [...document.querySelectorAll('.sn-찍말')].map((x) => x.innerText).join(' | '))
  /* 한 판 PDF — 단추 글 · 기대 이름 · 기대 쪽 */
  const 한판 = async (이름표, 단추글, 이름꼴, 기대쪽) => {
    await 판엿보기(p)
    const t0 = Date.now()
    const 단추 = 줄(p, 단추글).locator('button', { hasText: 단추글 })
    const [dl, 막음] = await Promise.all([
      p.waitForEvent('download', { timeout: 60000 }),
      (async () => { await 단추.click(); await 쉬어(60); return p.evaluate(() => { const 지금 = [...document.querySelectorAll('.wrap.sn .btn-row button')].find((x) => x.textContent.includes('PDF 만드는 중')); const row = 지금 && 지금.closest('.btn-row'); return row ? [...row.querySelectorAll('button')].filter((x) => /PDF|만드는 중|🖨 인쇄|준비 중/.test(x.textContent)).map((x) => x.disabled) : [] }) })(),
    ])
    const 파일 = path.join(폴더, `산안비_${이름표}${꼬리}.pdf`)
    await dl.saveAs(파일)
    await 쉬어(400)
    const 이름 = await p.evaluate(() => (window.__받은이름 || []).slice(-1)[0] || '')
    const 알림 = await 말(p)
    const A = PDF보기(파일)
    const 먹 = 먹들(파일, path.join(폴더, `먹_${이름표}${꼬리}`))
    ok(`${앞}${이름표} 📄 PDF → 바로 받음 · PDF 1.4 · 글꼴 0 · 글자 0 · 그림 ${A.그림수} = ${A.쪽}쪽(기대 ${기대쪽}) · 세로 A4 · 쪽마다 먹 ${먹.join(' · ')}% · ${A.KB}KB · ${((Date.now() - t0) / 1000).toFixed(1)}초`,
      A.머리.startsWith('%PDF-1.4') && A.쪽 === 기대쪽 && A.글꼴 === 0 && A.글자 === '' && A.그림수 >= A.쪽 && Math.abs(A.크기[0] - 595.28) < 1 && Math.abs(A.크기[1] - 841.89) < 1 && 먹.length === A.쪽 && 먹.every((x) => x > 0), { ...A, 먹 })
    ok(`${앞}${이름표} 이름 «${이름}» · 알림 «PDF ${A.쪽}쪽» · 찍는 동안 단추 막음(${막음.join(',')}) · 판 걷힘`, 이름꼴.test(이름) && new RegExp(`PDF ${A.쪽}쪽을 만들었습니다`).test(알림) && 막음.length >= 2 && 막음.every(Boolean) && !(await p.evaluate(() => !!document.querySelector('#gp-인쇄'))), [이름, 알림, 막음])
    let 전 = null
    if (!폰) {
      전 = await 전방식(p, `산안비_${이름표}_전글자.pdf`)
      ok(`${이름표} 쪽 수 — 전 방식 내용 ${전.내용}쪽(전체 ${전.전체}) · 그림 ${A.쪽}쪽(같거나 한 쪽 덜)`, 전.내용 >= 1 && (A.쪽 === 전.내용 || A.쪽 === 전.내용 - 1), 전)
    }
    execFileSync('pdftoppm', ['-r', '30', '-png', 파일, path.join(폴더, `산안비_${이름표}${꼬리}`)])
    return { ...A, 전 }
  }

  await 새로(p)
  ok(`${앞}🧪 예시 → 알림 «예시를 채웠습니다»`, /예시를 채웠습니다/.test(await p.evaluate(() => document.querySelector('.wrap.sn [role=status]')?.innerText || '')))
  /* ① 계상 */
  await 탭(p, '① 계상')
  await 한판('계상', '📄 계상 내역 PDF 저장', /^산안비_계상\.pdf$/, 1)
  /* ② 사용내역서 — 모든 항목 쪽 */
  await 탭(p, '④ 사용내역서')
  const 단추글 = await 줄(p, '📄 사용내역서 PDF 저장').locator('button', { hasText: '📄 사용내역서 PDF 저장' }).innerText()
  ok(`${앞}④ 단추 글 «${단추글}»`, /^📄 사용내역서 PDF 저장 \(A4 · 10쪽\)$/.test(단추글.trim()), 단추글)
  const U = await 한판('사용내역서', '📄 사용내역서 PDF 저장', /^산안비_사용내역서_2026-09\.pdf$/, 10)
  /* ④ 인쇄(사용내역서) */
  {
    await p.evaluate(() => {
      window.__인쇄 = null
      window.print = () => { const 판 = document.getElementById('kcm-그림인쇄'); const 그림 = 판 ? [...판.querySelectorAll('img.kcm-쪽그림')] : []; window.__인쇄 = { 그림: 그림.length, 쪽: [...new Set(그림.map((im) => im.style.page))].join(','), 판쪽: 판 ? 판.style.page : '?', 크기: 그림[0] ? 그림[0].style.width + '×' + 그림[0].style.height : '', 다불림: 그림.every((im) => im.complete && im.naturalWidth > 1000), 몸: document.body.classList.contains('kcm-그림인쇄중') } }
    })
    await 줄(p, '📄 사용내역서 PDF 저장').locator('button', { hasText: '🖨 인쇄' }).click()
    let 순간 = null
    for (let i = 0; i < 300 && !순간; i++) { await 쉬어(100); 순간 = await p.evaluate(() => window.__인쇄) }
    ok(`${앞}④ 🖨 인쇄(사용내역서) → 몸 밑엔 쪽 그림만 ${순간 ? 순간.그림 : '?'}장(${순간 ? 순간.크기 : ''} · sn세로 · 다 불러옴)`, !!순간 && 순간.그림 === U.쪽 && 순간.쪽 === 'sn세로' && 순간.판쪽 === 'sn세로' && 순간.크기 === '190mm×277mm' && 순간.다불림 && 순간.몸, 순간)
    if (순간) {
      const 인쇄파일 = path.join(폴더, `산안비_인쇄${꼬리}.pdf`)
      fs.writeFileSync(인쇄파일, await p.pdf({ preferCSSPageSize: true, printBackground: true }))
      const B = PDF보기(인쇄파일)
      ok(`${앞}④ 인쇄 창 «PDF로 저장» 과 같은 PDF — ${B.쪽}쪽(빈 쪽 없음) · 세로 · 글꼴 0 · 글자 0`, B.쪽 === U.쪽 && B.크기[1] > B.크기[0] && B.글꼴 === 0 && B.글자 === '', B)
      await p.evaluate(() => window.dispatchEvent(new Event('afterprint')))
      await 쉬어(300)
      ok(`${앞}④ 인쇄 창을 닫으면 다 걷힘`, await p.evaluate(() => !document.getElementById('kcm-그림인쇄') && !document.body.classList.contains('kcm-그림인쇄중') && !document.getElementById('gp-인쇄')))
    }
  }
  if (!폰) {
    /* ② 이 달에 쓴 항목 쪽만 → 총괄 + 1 · 2 · 6 */
    await p.locator('.wrap.sn label.gj-check', { hasText: '이 달에 쓴 항목 쪽만' }).locator('input').check()
    await 쉬어(400)
    const 글2 = (await 줄(p, '📄 사용내역서 PDF 저장').locator('button', { hasText: '📄 사용내역서 PDF 저장' }).innerText()).trim()
    ok(`② «이 달에 쓴 항목 쪽만» → 단추 «${글2}»`, 글2 === '📄 사용내역서 PDF 저장 (A4 · 4쪽)', 글2)
    await 한판('사용내역서_쓴항목', '📄 사용내역서 PDF 저장', /^산안비_사용내역서_2026-09\.pdf$/, 4)
    /* ⑤ 엑셀 둘 그대로 */
    const [x1] = await Promise.all([p.waitForEvent('download', { timeout: 30000 }), p.locator('.wrap.sn button', { hasText: '📗 엑셀(서식 칸 그대로)' }).click()])
    await x1.saveAs(path.join(폴더, '서식칸.xlsx'))
    await 쉬어(200)
    const n1 = await p.evaluate(() => (window.__받은이름 || []).slice(-1)[0] || '')
    await 탭(p, '① 계상')
    const [x2] = await Promise.all([p.waitForEvent('download', { timeout: 30000 }), p.locator('.wrap.sn button', { hasText: '📗 엑셀 받기' }).click()])
    await x2.saveAs(path.join(폴더, '계상.xlsx'))
    await 쉬어(200)
    const n2 = await p.evaluate(() => (window.__받은이름 || []).slice(-1)[0] || '')
    const 머리 = ['서식칸.xlsx', '계상.xlsx'].map((f) => fs.readFileSync(path.join(폴더, f)).subarray(0, 2).toString('latin1'))
    ok(`⑤ 📗 엑셀 둘 그대로 받아짐 — «${n1}» · «${n2}»`, /^산안비_사용내역서_2026-09_.+\.xlsx$/.test(n1) && /^산안비_계상_.+\.xlsx$/.test(n2) && 머리.every((x) => x === 'PK'), [n1, n2, 머리])
    /* ⑥ Ctrl+P (-layout — 줄 바뀐 안내 글도 차례대로 읽음) */
    const 바로 = path.join(폴더, '바로인쇄.pdf')
    fs.writeFileSync(바로, await p.pdf({ preferCSSPageSize: true }))
    const 바글 = execFileSync('pdftotext', ['-layout', 바로, '-']).toString().replace(/\s+/g, '')
    ok('⑥ 단추 없이 Ctrl+P → «산안비 계상 내역 · 사용내역서는 화면의 … 단추로 인쇄해 주세요» 안내 · 계상기 화면 글 안 나감', /산안비계상내역·사용내역서는화면의/.test(바글) && /단추로인쇄해주세요/.test(바글) && !/산업안전보건관리비계상기/.test(바글) && !/별표1계상기준표/.test(바글) && !/관급/.test(바글), 바글.slice(0, 200))
    /* ⑦ 404 */
    const q = await ctx.newPage()
    await q.route((u) => /html2canvas|그림인쇄\./.test(decodeURIComponent(u.toString())), (r) => r.fulfill({ status: 404, body: 'not found' }))
    await 새로(q)
    await 탭(q, '① 계상')
    await 줄(q, '📄 계상 내역 PDF 저장').locator('button', { hasText: '📄 계상 내역 PDF 저장' }).click()
    let 말4 = ''
    for (let i = 0; i < 50 && !/새로/.test(말4); i++) { await 쉬어(100); 말4 = await 말(q) }
    ok('⑦ 찍는 도구 파일이 없어진 때(404) → «새로고침(↻) 뒤 다시 · 쓴 것은 그대로» 알림 · 판 걷힘 · 단추 다시 켜짐', /사이트가 새로 바뀌었습니다 — 화면을 새로고침\(↻\)한 뒤 다시 눌러 주세요\(쓴 것은 그대로 남습니다\)/.test(말4) && !(await q.evaluate(() => !!document.querySelector('#gp-인쇄'))) && !(await 줄(q, '📄 계상 내역 PDF 저장').locator('button', { hasText: '📄 계상 내역 PDF 저장' }).isDisabled()), 말4)
    await q.close()
  }
  ok(`⑧ ${기기} 넘침 0 · 오류 0`, (await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 1 && 오류.length === 0, 오류)
  await ctx.close()
}
await b.close()
console.log(`\n${n}개 중 틀림 ${bad}` + (틀림.length ? '\n  ' + 틀림.join('\n  ') : ''))
process.exit(bad ? 1 : 0)
