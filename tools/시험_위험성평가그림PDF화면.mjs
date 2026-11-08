/**
 * 🖼 G587 위험성평가(/tools/risk · 별지 1~5) — 그림 PDF · 그림 인쇄(글자 층 없음) 화면 시험. 구운 사이트(dist)를 띄운 뒤:
 *   node tools/시험_위험성평가그림PDF화면.mjs [주소=http://127.0.0.1:4578]        (OUT=/tmp/g10/g587)
 *   소장님 11-08 «엑셀은 그대로 · PDF 는 모두 그림» — tools/그림인쇄훅.js 셋째 도구(작업일보 · 공사일보 다음). A4 가로(rk가로 · 8mm) · 세로(rk세로 · 12mm).
 *   👀 예시 장부의 서류 일곱(별지 1 · 2 4주 · 1주 · 1일 · 3 · 4 · 5) 마다:
 *   ① «📄 PDF» → 바로 받음 · PDF 1.4 · 글꼴 0 · 뽑히는 글자 0 · 그림 = 쪽 · 쪽 크기(가로 297 × 210 / 세로 210 × 297) · 이름 «별지N_…_날짜.pdf» · 알림(누른 단추 곁)
 *   ② 쪽 수 — 같은 판을 브라우저로 인쇄(전 방식 · 글자)한 것과 같거나(꼬리만 넘치면) 한 쪽 덜 · 첫 쪽 PNG(눈으로 봄: 합친 칸 줄 · 사진)
 *   ③ «🖨 인쇄»(서류 둘) → 인쇄 순간 몸 밑엔 쪽 그림만(@page rk가로 / rk세로) → 그 모습 그대로 PDF 글꼴 0 · 글자 0 · 쪽 같음 · 빈 쪽 없음 · 닫으면 걷힘
 *   ④ 단추 없이 Ctrl+P → 서류 칸 · 미리보기는 안 찍히고 «단추로 인쇄» 안내 ⑤ 📗 엑셀 단추 그대로 ⑥ 아래(미리보기) 단추 → 알림 아래
 *   ⑦ 404 → «새로고침 뒤 다시» 알림 ⑧ 폰 390 · PC 1280 넘침 0 · 오류 0 ⑨ 서류 머리 이름 칸 폭(폰에서 단추가 늘어 이름이 세로로 서던 것 — 재발 막기)
 *   인터넷 안 부름 · 예시 장부(저장 안 됨 · 지어낸 값)만 씀.
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const BASE = process.argv[2] || 'http://127.0.0.1:4578'
const 폴더 = process.env.OUT || '/tmp/g10/g587'
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
const 쪽수 = (파일) => Number((/Pages:\s+(\d+)/.exec(execFileSync('pdfinfo', [파일]).toString()) || [])[1] || 0)
const 서류들 = [['1', '최초·정기 토공사'], ['2a', '수시 4주'], ['2b', '수시 1주'], ['2c', '수시 1일'], ['3', '회의 결과'], ['4', '교육 결과'], ['5', '성과측정표']]

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
  const 장부열기 = async (q) => {
    await q.goto(BASE + '/tools/risk', { waitUntil: 'domcontentloaded' })
    await q.waitForSelector('button', { timeout: 20000 })
    await 쉬어(800)
    await q.locator('button', { hasText: '예시로 해 보기' }).first().click()
    await 쉬어(1200)
  }
  const 서류열기 = async (q, 글) => {
    const 줄 = q.locator('button, a, [role=button], li').filter({ hasText: new RegExp('^별지 \\d+ .*' + 글.replace(/[·()]/g, '.')) })
    await 줄.first().click()
    await 쉬어(900)
  }
  await 장부열기(p)
  const 판엿보기 = () => p.evaluate(() => {
    window.__판 = null
    if (window.__ob) window.__ob.disconnect()
    const ob = new MutationObserver(() => { const el = document.querySelector('#gp-인쇄'); if (el && el.firstElementChild && !window.__판) window.__판 = el.outerHTML })
    ob.observe(document.body, { childList: true, subtree: true })
    window.__ob = ob
  })
  const 전방식 = async (이름) => {
    const html = await p.evaluate(() => window.__판)
    if (!html) return 0
    await p.evaluate((hh) => { const d = document.createElement('div'); d.innerHTML = hh; document.body.appendChild(d.firstElementChild); document.body.classList.add('gp-인쇄중'); document.documentElement.classList.add('gp-인쇄중') }, html)
    const 파일 = path.join(폴더, 이름)
    fs.writeFileSync(파일, await p.pdf({ preferCSSPageSize: true, printBackground: true }))
    await p.evaluate(() => { document.querySelectorAll('#gp-인쇄').forEach((x) => x.remove()); document.body.classList.remove('gp-인쇄중'); document.documentElement.classList.remove('gp-인쇄중') })
    return 쪽수(파일)
  }
  const 고른 = 폰 ? 서류들.filter(([k]) => k === '1' || k === '3') : 서류들
  for (const [k, 글] of 고른) {
    await 서류열기(p, 글)
    await 판엿보기()
    const t0 = Date.now()
    const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 40000 }), p.locator('.rk-edit-head button', { hasText: '📄 PDF' }).click()])
    const 파일 = path.join(폴더, `별지${k}${꼬리}.pdf`)
    await dl.saveAs(파일)
    await 쉬어(300)
    const 이름 = await p.evaluate(() => (window.__받은이름 || []).slice(-1)[0] || '')
    const 말 = await p.evaluate(() => [...document.querySelectorAll('[role=status]')].map((x) => x.innerText).join(' | '))
    const A = PDF보기(파일)
    const 가로 = A.크기[0] > A.크기[1]
    ok(`별지 ${k}${폰 ? '(폰)' : ''} ① 📄 PDF → 바로 받음 · PDF 1.4 · 글꼴 0 · 글자 0 · 그림 ${A.그림수} = ${A.쪽}쪽 · ${가로 ? '가로' : '세로'} A4 · ${A.KB}KB · ${((Date.now() - t0) / 1000).toFixed(1)}초`,
      A.머리.startsWith('%PDF-1.4') && A.쪽 >= 1 && A.글꼴 === 0 && A.글자 === '' && A.그림수 >= A.쪽 && Math.abs(Math.max(...A.크기) - 841.89) < 1 && Math.abs(Math.min(...A.크기) - 595.28) < 1, A)
    ok(`별지 ${k}${폰 ? '(폰)' : ''} ① 이름 «${이름}» · 알림 «PDF ${A.쪽}쪽» 위 단추 곁 · 판 걷힘`, /^별지\s?\d/.test(이름) && /\.pdf$/.test(이름) && new RegExp(`PDF ${A.쪽}쪽을 만들었습니다`).test(말) && !(await p.evaluate(() => !!document.querySelector('#gp-인쇄'))), [이름, 말])
    if (k === '1') {   /* 재발 막기 — 폰에서 단추가 늘어 서류 이름 칸이 좁아져 글이 한 글자씩 세로로 섰던 것(G587 캡처에서 찾음) */
      const 머리 = await p.evaluate(() => { const g = document.querySelector('.rk-edit-head .grow'); const r = g.getBoundingClientRect(); return { 폭: Math.round(r.width), 높: Math.round(r.height) } })
      ok(`별지 1${폰 ? '(폰)' : ''} ⑨ 서류 머리 — 이름 칸 폭 ${머리.폭}px · 높이 ${머리.높}px(이름이 세로로 서지 않음)`, 머리.폭 >= 200 && 머리.높 <= 64, 머리)
    }
    const 전 = await 전방식(`별지${k}${꼬리}_전글자.pdf`)
    ok(`별지 ${k}${폰 ? '(폰)' : ''} ② 쪽 수 — 전 방식 ${전}쪽 · 그림 ${A.쪽}쪽(같거나 꼬리만 넘친 쪽을 줄여 한 쪽 덜)`, 전 >= 1 && (A.쪽 === 전 || A.쪽 === 전 - 1), { 전, 그림: A.쪽 })
    execFileSync('pdftoppm', ['-r', '55', '-png', '-f', '1', '-l', '1', 파일, path.join(폴더, `별지${k}${꼬리}`)])
    if (k === '1' || k === '4') {
      await p.evaluate(() => {
        window.__인쇄 = null
        window.print = () => { const 판 = document.getElementById('kcm-그림인쇄'); const 그림 = 판 ? [...판.querySelectorAll('img.kcm-쪽그림')] : []; window.__인쇄 = { 그림: 그림.length, 쪽: [...new Set(그림.map((im) => im.style.page))].join(','), 판쪽: 판 ? 판.style.page : '', 다불림: 그림.every((im) => im.complete && im.naturalWidth > 1000), 몸: document.body.classList.contains('kcm-그림인쇄중') } }
      })
      await p.locator('.rk-edit-head button', { hasText: '🖨 인쇄' }).click()
      let 순간 = null
      for (let i = 0; i < 200 && !순간; i++) { await 쉬어(100); 순간 = await p.evaluate(() => window.__인쇄) }
      const 쪽이름 = 가로 ? 'rk가로' : 'rk세로'
      ok(`별지 ${k}${폰 ? '(폰)' : ''} ③ 🖨 인쇄 → 몸 밑엔 쪽 그림만 ${순간 ? 순간.그림 : '?'}장(쪽 이름 ${쪽이름} · 다 불러옴)`, !!순간 && 순간.그림 === A.쪽 && 순간.쪽 === 쪽이름 && 순간.판쪽 === 쪽이름 && 순간.다불림 && 순간.몸, 순간)
      if (순간) {
        const 인쇄파일 = path.join(폴더, `별지${k}${꼬리}_인쇄.pdf`)
        fs.writeFileSync(인쇄파일, await p.pdf({ preferCSSPageSize: true, printBackground: true }))
        const B = PDF보기(인쇄파일)
        ok(`별지 ${k}${폰 ? '(폰)' : ''} ③ 인쇄 창 «PDF로 저장» 과 같은 PDF — ${B.쪽}쪽(빈 쪽 없음) · ${B.크기[0] > B.크기[1] ? '가로' : '세로'} · 글꼴 0 · 글자 0`, B.쪽 === A.쪽 && (B.크기[0] > B.크기[1]) === 가로 && B.글꼴 === 0 && B.글자 === '', B)
        await p.evaluate(() => window.dispatchEvent(new Event('afterprint')))
        await 쉬어(300)
        ok(`별지 ${k}${폰 ? '(폰)' : ''} ③ 인쇄 창을 닫으면 다 걷힘`, await p.evaluate(() => !document.getElementById('kcm-그림인쇄') && !document.body.classList.contains('kcm-그림인쇄중')))
      }
    }
    if (k === '3' && !폰) {
      /* ⑥ 아래(미리보기) 단추 — 알림 아래 · ⑤ 엑셀 그대로 · ④ Ctrl+P */
      const [dl2] = await Promise.all([p.waitForEvent('download', { timeout: 40000 }), p.locator('.eq-bar button', { hasText: '📄 PDF 저장' }).click()])
      await dl2.saveAs(path.join(폴더, `별지3_아래.pdf`))
      await 쉬어(300)
      const 자리 = await p.evaluate(() => { const s = [...document.querySelectorAll('[role=status]')].find((x) => /PDF \d+쪽을 만들었습니다/.test(x.innerText)); if (!s) return null; const 미리 = document.querySelector('.rk-preview'); return { 아래: !!미리 && s.compareDocumentPosition(미리) === Node.DOCUMENT_POSITION_FOLLOWING, 위머리: !!s.previousElementSibling && s.previousElementSibling.classList.contains('rk-edit-head') } })
      ok('⑥ 아래(미리보기) «📄 PDF 저장» → 알림이 미리보기 바로 위(누른 단추 곁) · 위 머리 곁엔 없음', !!자리 && 자리.아래 && !자리.위머리, 자리)
      ok('⑤ 📗 엑셀 단추 그대로(위 · 아래)', (await p.locator('button', { hasText: '📗 엑셀' }).count()) === 2)
      const 바로 = path.join(폴더, '바로인쇄.pdf')
      fs.writeFileSync(바로, await p.pdf({ preferCSSPageSize: true }))
      const 글 = execFileSync('pdftotext', [바로, '-']).toString().replace(/\s+/g, ' ')
      ok('④ 단추 없이 Ctrl+P → «위험성평가 서류는 화면의 … 단추로 인쇄해 주세요» 안내 · 서류 칸 · 미리보기 글 안 나감', /위험성평가 서류는 화면의/.test(글) && /단추로 인쇄해 주세요/.test(글) && !/추진을 위한 계획수립/.test(글), 글.slice(0, 200))
    }
    await p.locator('button', { hasText: '← 서류 목록' }).first().click()
    await 쉬어(600)
  }
  /* ⑦ 404 */
  if (!폰) {
    const q = await ctx.newPage()
    await q.route((u) => /html2canvas|그림인쇄\./.test(decodeURIComponent(u.toString())), (r) => r.fulfill({ status: 404, body: 'not found' }))
    await 장부열기(q)
    await 서류열기(q, '회의 결과')
    await q.locator('.rk-edit-head button', { hasText: '📄 PDF' }).click()
    let 말 = ''
    for (let i = 0; i < 40 && !/새로/.test(말); i++) { await 쉬어(100); 말 = await q.evaluate(() => [...document.querySelectorAll('[role=status]')].map((x) => x.innerText).join(' | ')) }
    ok('⑦ 찍는 도구 파일이 없어진 때(404) → «새로고침(↻) 뒤 다시 · 쓴 것은 그대로» 알림 · 판 걷힘', /사이트가 새로 바뀌었습니다 — 화면을 새로고침\(↻\)한 뒤 다시 눌러 주세요\(쓴 것은 그대로 남습니다\)/.test(말) && !(await q.evaluate(() => !!document.querySelector('#gp-인쇄'))), 말)
    await q.close()
  }
  ok(`⑧ ${기기} 넘침 0 · 오류 0`, (await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0 && 오류.length === 0, 오류)
  await ctx.close()
}
await b.close()
console.log(`\n${n}개 중 틀림 ${bad}` + (틀림.length ? '\n  ' + 틀림.join('\n  ') : ''))
process.exit(bad ? 1 : 0)
