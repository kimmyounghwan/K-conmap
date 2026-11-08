/**
 * 🖼 G600 현장 손익 장부(/tools/sonik) — 그림 PDF · 그림 인쇄(글자 층 없음) 화면 시험. 구운 사이트(dist)를 띄운 뒤:
 *   node tools/시험_손익그림PDF화면.mjs [주소=http://127.0.0.1:4578]        (OUT=/tmp/g10/g600)
 *   소장님 11-08 «엑셀은 그대로 · PDF 는 모두 그림» — 인쇄 판 둘을 그림으로: 📊 손익 보고서 A4 세로(@page sk세로 12mm → 186 × 273mm) ·
 *   📒 매입매출장 A4 가로(@page sk가로 8mm → 281 × 194mm · 표 머리줄은 쪽마다 다시).
 *   ① 🧪 예시(지어낸 회사 · 현장 둘) → «전체» 📊 «📄 PDF» → 바로 받음 · PDF 1.4 · 글꼴 0 · 글자 0 · 그림 = 쪽 · A4 세로 · 쪽마다 내용 · 이름 «손익보고서_전체 현장.pdf» ·
 *      알림 · 찍는 동안 네 단추 막음 · 판 걷힘 · 쪽 수 = 전 방식(gp-인쇄중 · 브라우저 인쇄) 내용 쪽과 같거나 한 쪽 덜
 *   ② 📒 «📄 PDF» → A4 가로 · 이름 «매입매출장_전체 현장.pdf» / 줄을 여섯 벌로 늘린 장부(여러 쪽 · 머리줄 다시) → 전 방식과 같거나 한 쪽 덜
 *   ③ 현장 하나 고르면 이름 «손익보고서_현장이름.pdf» ④ 📒 «🖨 인쇄» → 몸 밑엔 쪽 그림만(sk가로 · 281 × 194mm) → 같은 PDF · 닫으면 걷힘
 *   ⑤ 📗 엑셀 받기 그대로 ⑥ 단추 없이 Ctrl+P → 화면은 안 찍히고 «단추로 인쇄» 안내 ⑦ 404 ⑧ 폰: 이름 줄 · 단추 둘 나란히 · 넘침 0 · 오류 0
 *   인터넷 안 부름 · 지어낸 예시만.
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const BASE = process.argv[2] || 'http://127.0.0.1:4578'
const 폴더 = process.env.OUT || '/tmp/g10/g600'
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
const 세로 = (A) => Math.abs(A.크기[0] - 595.28) < 1 && Math.abs(A.크기[1] - 841.89) < 1
const 가로 = (A) => Math.abs(A.크기[0] - 841.89) < 1 && Math.abs(A.크기[1] - 595.28) < 1

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
    await q.goto(BASE + '/tools/sonik', { waitUntil: 'domcontentloaded' })
    await q.evaluate(() => { localStorage.removeItem('kcm_sonik1') })
    await q.reload({ waitUntil: 'domcontentloaded' })
    await q.waitForSelector('.wrap.sk', { timeout: 20000 })
    await 쉬어(500)
    await q.locator('button', { hasText: '🧪 예시로 해 보기' }).first().click()
    await 쉬어(600)
  }
  const 줄 = (q, 글) => q.locator('.wrap.sk .tp-찍기줄', { hasText: 글 })
  const 단추들 = (q) => q.locator('.wrap.sk .tp-찍기줄 button')
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
  const 말 = (q) => q.evaluate(() => [...document.querySelectorAll('.sk-찍말')].map((x) => x.innerText).join(' | '))
  const 한판 = async (이름표, 줄글, 이름꼴, 방향, 견줌 = true) => {
    await 판엿보기(p)
    const t0 = Date.now()
    const [dl, 막음] = await Promise.all([
      p.waitForEvent('download', { timeout: 60000 }),
      (async () => { await 줄(p, 줄글).locator('button', { hasText: '📄 PDF' }).click(); await 쉬어(60); return p.evaluate(() => [...document.querySelectorAll('.wrap.sk .tp-찍기줄 button')].map((x) => x.disabled)) })(),
    ])
    const 파일 = path.join(폴더, `손익_${이름표}${꼬리}.pdf`)
    await dl.saveAs(파일)
    await 쉬어(400)
    const 이름 = await p.evaluate(() => (window.__받은이름 || []).slice(-1)[0] || '')
    const 알림 = await 말(p)
    const A = PDF보기(파일)
    const 먹 = 먹들(파일, path.join(폴더, `먹_${이름표}${꼬리}`))
    ok(`${앞}${이름표} 📄 PDF → 바로 받음 · PDF 1.4 · 글꼴 0 · 글자 0 · 그림 ${A.그림수} = ${A.쪽}쪽 · ${방향 === '가로' ? '가로' : '세로'} A4 · 쪽마다 먹 ${먹.join(' · ')}% · ${A.KB}KB · ${((Date.now() - t0) / 1000).toFixed(1)}초`,
      A.머리.startsWith('%PDF-1.4') && A.쪽 >= 1 && A.글꼴 === 0 && A.글자 === '' && A.그림수 >= A.쪽 && (방향 === '가로' ? 가로(A) : 세로(A)) && 먹.length === A.쪽 && 먹.every((x) => x > 0), { ...A, 먹 })
    ok(`${앞}${이름표} 이름 «${이름}» · 알림 «PDF ${A.쪽}쪽» · 찍는 동안 네 단추 막음(${막음.join(',')}) · 판 걷힘`, 이름꼴.test(이름) && new RegExp(`PDF ${A.쪽}쪽을 만들었습니다`).test(알림) && 막음.length === 4 && 막음.every(Boolean) && !(await p.evaluate(() => !!document.querySelector('#gp-인쇄'))), [이름, 알림, 막음])
    let 전 = null
    if (!폰 && 견줌) {
      전 = await 전방식(p, `손익_${이름표}_전글자.pdf`)
      ok(`${이름표} 쪽 수 — 전 방식 내용 ${전.내용}쪽(전체 ${전.전체}) · 그림 ${A.쪽}쪽(같거나 한 쪽 덜)`, 전.내용 >= 1 && (A.쪽 === 전.내용 || A.쪽 === 전.내용 - 1), 전)
    }
    execFileSync('pdftoppm', ['-r', '30', '-png', 파일, path.join(폴더, `손익_${이름표}${꼬리}`)])
    return { ...A, 전 }
  }

  await 새로(p)
  await 한판('보고서', '📊 손익 보고서', /^손익보고서_전체 현장\.pdf$/, '세로')
  const 장 = await 한판('매입매출장', '📒 매입매출장', /^매입매출장_전체 현장\.pdf$/, '가로')
  /* ④ 매입매출장 인쇄 */
  {
    await p.evaluate(() => {
      window.__인쇄 = null
      window.print = () => { const 판 = document.getElementById('kcm-그림인쇄'); const 그림 = 판 ? [...판.querySelectorAll('img.kcm-쪽그림')] : []; window.__인쇄 = { 그림: 그림.length, 쪽: [...new Set(그림.map((im) => im.style.page))].join(','), 판쪽: 판 ? 판.style.page : '?', 크기: 그림[0] ? 그림[0].style.width + '×' + 그림[0].style.height : '', 다불림: 그림.every((im) => im.complete && im.naturalWidth > 1000), 몸: document.body.classList.contains('kcm-그림인쇄중') } }
    })
    await 줄(p, '📒 매입매출장').locator('button', { hasText: '🖨 인쇄' }).click()
    let 순간 = null
    for (let i = 0; i < 300 && !순간; i++) { await 쉬어(100); 순간 = await p.evaluate(() => window.__인쇄) }
    ok(`${앞}④ 📒 🖨 인쇄 → 몸 밑엔 쪽 그림만 ${순간 ? 순간.그림 : '?'}장(${순간 ? 순간.크기 : ''} · sk가로 · 다 불러옴)`, !!순간 && 순간.그림 === 장.쪽 && 순간.쪽 === 'sk가로' && 순간.판쪽 === 'sk가로' && 순간.크기 === '281mm×194mm' && 순간.다불림 && 순간.몸, 순간)
    if (순간) {
      const 인쇄파일 = path.join(폴더, `손익_인쇄${꼬리}.pdf`)
      fs.writeFileSync(인쇄파일, await p.pdf({ preferCSSPageSize: true, printBackground: true }))
      const B = PDF보기(인쇄파일)
      ok(`${앞}④ 인쇄 창 «PDF로 저장» 과 같은 PDF — ${B.쪽}쪽(빈 쪽 없음) · 가로 · 글꼴 0 · 글자 0`, B.쪽 === 장.쪽 && 가로(B) && B.글꼴 === 0 && B.글자 === '', B)
      await p.evaluate(() => window.dispatchEvent(new Event('afterprint')))
      await 쉬어(300)
      ok(`${앞}④ 인쇄 창을 닫으면 다 걷힘`, await p.evaluate(() => !document.getElementById('kcm-그림인쇄') && !document.body.classList.contains('kcm-그림인쇄중') && !document.getElementById('gp-인쇄')))
    }
  }
  if (폰) {
    /* ⑧ 폰: 이름은 첫 줄 · 단추 둘은 둘째 줄에 나란히 */
    const 자리 = await p.evaluate(() => [...document.querySelectorAll('.wrap.sk .tp-찍기줄')].map((r) => { const [s, a, c] = [r.querySelector('span'), ...r.querySelectorAll('button')].map((x) => x.getBoundingClientRect()); return [Math.round(s.bottom), Math.round(a.top), Math.round(c.top)] }))
    ok(`(폰) ⑧ 줄마다 이름 밑에 단추 둘 나란히 — ${JSON.stringify(자리)}`, 자리.length === 2 && 자리.every(([s, a, c]) => a >= s - 1 && Math.abs(a - c) <= 1), 자리)
  } else {
    /* ③ 현장 하나 */
    await p.locator('.wrap.sk [aria-label="현장 고르기"] .fm-chip', { hasText: '가나지구 배수로 정비공사' }).click()
    await 쉬어(400)
    await 한판('보고서_현장', '📊 손익 보고서', /^손익보고서_가나지구 배수로 정비공사\.pdf$/, '세로')
    /* ⑤ 엑셀 */
    await p.locator('.wrap.sk [aria-label="현장 고르기"] .fm-chip', { hasText: '전체' }).click()
    await 쉬어(300)
    const [x1] = await Promise.all([p.waitForEvent('download', { timeout: 30000 }), p.locator('.wrap.sk .btn-row button', { hasText: '📗 엑셀 받기' }).click()])
    await x1.saveAs(path.join(폴더, '손익.xlsx'))
    await 쉬어(200)
    const n1 = await p.evaluate(() => (window.__받은이름 || []).slice(-1)[0] || '')
    ok(`⑤ 📗 엑셀 받기 그대로 받아짐 «${n1}»`, /^손익장부_전체_현장\.xlsx$/.test(n1) && fs.readFileSync(path.join(폴더, '손익.xlsx')).subarray(0, 2).toString('latin1') === 'PK', n1)
    /* ② 줄을 여섯 벌로 — 여러 쪽 · 머리줄 다시 */
    await p.evaluate(() => {
      const s = JSON.parse(localStorage.getItem('kcm_sonik1'))
      const R = []
      for (let i = 0; i < 6; i++) for (const r of s.R) R.push({ ...r, id: r.id + '_' + i })
      s.R = R
      localStorage.setItem('kcm_sonik1', JSON.stringify(s))
    })
    await p.reload({ waitUntil: 'domcontentloaded' })
    await p.waitForSelector('.wrap.sk .tp-찍기줄', { timeout: 20000 })
    await 쉬어(500)
    const 긴 = await 한판('매입매출장_긴', '📒 매입매출장', /^매입매출장_전체 현장\.pdf$/, '가로')
    ok(`② 줄 여섯 벌 매입매출장 → ${긴.쪽}쪽(여러 쪽)`, 긴.쪽 >= 2, 긴.쪽)
    /* ⑥ Ctrl+P */
    const 바로 = path.join(폴더, '바로인쇄.pdf')
    fs.writeFileSync(바로, await p.pdf({ preferCSSPageSize: true }))
    const 바글 = execFileSync('pdftotext', ['-layout', 바로, '-']).toString().replace(/\s+/g, '')
    ok('⑥ 단추 없이 Ctrl+P → «손익 보고서 · 매입매출장은 화면의 … 단추로 인쇄해 주세요» 안내 · 장부 화면 글 안 나감', /손익보고서·매입매출장은화면의/.test(바글) && /단추로인쇄해주세요/.test(바글) && !/가나지구/.test(바글) && !/미지급금/.test(바글), 바글.slice(0, 200))
    /* ⑦ 404 */
    const q = await ctx.newPage()
    await q.route((u) => /html2canvas|그림인쇄\./.test(decodeURIComponent(u.toString())), (r) => r.fulfill({ status: 404, body: 'not found' }))
    await 새로(q)
    await 줄(q, '📊 손익 보고서').locator('button', { hasText: '📄 PDF' }).click()
    let 말4 = ''
    for (let i = 0; i < 50 && !/새로/.test(말4); i++) { await 쉬어(100); 말4 = await 말(q) }
    ok('⑦ 찍는 도구 파일이 없어진 때(404) → «새로고침(↻) 뒤 다시 · 쓴 것은 그대로» 알림 · 판 걷힘 · 단추 다시 켜짐', /사이트가 새로 바뀌었습니다 — 화면을 새로고침\(↻\)한 뒤 다시 눌러 주세요\(쓴 것은 그대로 남습니다\)/.test(말4) && !(await q.evaluate(() => !!document.querySelector('#gp-인쇄'))) && (await q.evaluate(() => [...document.querySelectorAll('.wrap.sk .tp-찍기줄 button')].every((x) => !x.disabled))), 말4)
    await q.close()
  }
  ok(`⑧ ${기기} 넘침 0 · 오류 0`, (await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 1 && 오류.length === 0, 오류)
  await ctx.close()
}
await b.close()
console.log(`\n${n}개 중 틀림 ${bad}` + (틀림.length ? '\n  ' + 틀림.join('\n  ') : ''))
process.exit(bad ? 1 : 0)
