/**
 * 🖼 G615 도면 물량 자동(/jeoksan/auto) — ① 물량 전부(수량산출서) · ② 골조 · ③ 내역 대조 — 그림 PDF · 그림 인쇄(글자 층 없음) 화면 시험. 구운 사이트(dist)를 띄운 뒤:
 *   node tools/시험_적산자동그림PDF화면.mjs [주소=http://127.0.0.1:4578]        (OUT=/tmp/g10/g615)
 *   소장님 11-08 «엑셀은 그대로 · PDF 는 모두 그림» — 옛 «🖨 인쇄»(window.print · 쪽 전체 글자 PDF) → 지금 탭의 결과 카드(.gg-print)만 그림으로 «📄 PDF» · «🖨 인쇄».
 *   «🧪 예시로 해 보기»(가상 토목 · 건축 도면 두 장 + 가상 내역서) · «🧪 골조 예시 (가상 2층)» 로:
 *   ① 물량 전부 «📄 PDF» → 바로 받음 · PDF 1.4 · 글꼴 0 · 글자 0 · 그림 = 쪽 · A4 세로 · 쪽마다 내용 · 이름 «도면물량_수량산출서.pdf»(엑셀과 같은 꼴) · 알림 · 찍는 동안 단추 막음 ·
 *      쪽 수 ≤ 옛 인쇄(쪽 전체 — 사이트 머리까지)
 *   ② «🖨 인쇄» → 몸 밑엔 쪽 그림만(186 × 271mm) → 같은 PDF · 닫으면 걷힘
 *   ③ 내역 대조 «📄 PDF» → «도면물량_내역대조.pdf» · ④ 골조 탭(전엔 인쇄 단추 없음) «📄 PDF» → «골조_수량산출서(도면 자동).pdf»
 *   ⑤ 단추 없이 Ctrl+P → 결과 카드 대신 «단추로 인쇄» 안내 ⑥ 🖥 작업 화면에서도 같은 쪽 ⑦ 404 → «새로고침 뒤 다시» ⑧ 폰 390 · PC 1280 넘침 0 · 오류 0
 *   인터넷 안 부름 · 예시(가상 도면 · 가상 내역서)만 씀.
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const BASE = process.argv[2] || 'http://127.0.0.1:4578'
const 폴더 = process.env.OUT || '/tmp/g10/g615'
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
const A4세로 = (A) => Math.abs(A.크기[0] - 595.28) < 1 && Math.abs(A.크기[1] - 841.89) < 1

const b = await chromium.launch()
const UA폰 = 'Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'
for (const [기기, w, h, 폰] of [['PC 1280', 1280, 900, false], ['폰 390', 390, 844, true]]) {
  console.log(`■ ${기기}`)
  const ctx = await b.newContext({ viewport: { width: w, height: h }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', isMobile: 폰, hasTouch: 폰, acceptDownloads: true, ...(폰 ? { userAgent: UA폰 } : {}) })
  await ctx.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|googlesyndication|geojs/, (r) => r.fulfill({ status: 200, body: '' }))
  await ctx.route(/firebaseio\.com|firebasedatabase\.app|identitytoolkit|securetoken/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await ctx.addInitScript(() => { try { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); sessionStorage.setItem('kcm_notice_seen', '2026-10-업체'); sessionStorage.setItem('kcm_visit_s', '1') } catch (e) { /* 없음 */ } })
  await ctx.addInitScript(() => { window.__받은이름 = []; document.addEventListener('click', (e) => { const a = e.target && e.target.closest && e.target.closest('a[download]'); if (a) window.__받은이름.push(a.download) }, true) })
  /* 알림은 4초만 보임 — 시험 기계가 느려 받은 파일 저장이 늦어도 놓치지 않게 뜨는 순간 적어 둠
     (같은 글이 다시 떠도 적음 — 앞 알림이 사라졌다가(빈 글) 다시 뜨면 새 알림 · G615 시험에서 3쪽 → 3쪽 을 놓쳤음) */
  await ctx.addInitScript(() => { window.__알림들 = []; let 앞 = ''; new MutationObserver(() => { const 지금 = [...document.querySelectorAll('.ja-찍말')].map((x) => x.innerText).join(' | '); if (지금 && 지금 !== 앞) window.__알림들.push(지금); 앞 = 지금 }).observe(document, { subtree: true, childList: true, characterData: true }) })
  const p = await ctx.newPage()
  const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
  const 꼬리 = 폰 ? '_폰' : ''
  const 앞 = 폰 ? '(폰) ' : ''
  const 열기 = async (q) => {
    await q.goto(BASE + '/jeoksan/auto', { waitUntil: 'domcontentloaded' })
    await q.waitForSelector('button', { timeout: 20000 })
    await 쉬어(1200)
    await q.locator('button', { hasText: '예시로 해 보기' }).first().click()
    await q.waitForFunction(() => document.querySelectorAll('.gg-print table tbody tr').length > 3, null, { timeout: 120000 })
    await 쉬어(1500)
  }
  const 탭 = async (q, 글) => { await q.locator('.tp-tabs [role=tab]', { hasText: 글 }).first().click(); await 쉬어(800) }
  const PDF단추 = (q) => q.locator('.gg-print .gg-head button', { hasText: /^📄 PDF$|PDF 만드는 중/ })
  const 인쇄단추 = (q) => q.locator('.gg-print .gg-head button', { hasText: /^🖨 인쇄$|준비 중/ })
  const 말 = (q) => q.evaluate(() => [...document.querySelectorAll('.ja-찍말')].map((x) => x.innerText).join(' | '))
  const 받기 = async (q, 이름) => {
    const 앞수 = await q.evaluate(() => window.__알림들.length)
    const t0 = Date.now()
    const [dl, 막음] = await Promise.all([
      q.waitForEvent('download', { timeout: 180000 }),
      (async () => { await PDF단추(q).click(); await 쉬어(60); return [await PDF단추(q).isDisabled(), await 인쇄단추(q).isDisabled()] })(),
    ])
    const 파일 = path.join(폴더, 이름)
    await dl.saveAs(파일)
    const 걸림 = (Date.now() - t0) / 1000
    let 알림 = ''
    for (let i = 0; i < 30 && !알림; i++) { 알림 = await q.evaluate((k) => window.__알림들.slice(k).join(' | '), 앞수); if (!알림) await 쉬어(100) }
    return { 파일, 걸림, 막음, 받은이름: await q.evaluate(() => (window.__받은이름 || []).slice(-1)[0] || ''), 알림 }
  }

  await 열기(p)
  /* ① 물량 전부 */
  const 단추글 = await p.$$eval('.gg-print .gg-head button', (x) => x.map((y) => y.innerText.trim()))
  ok(`${앞}① 물량 전부 — 옛 «🖨 인쇄»(window.print) → «${단추글.join(' · ')}»(⬇ 엑셀 받기 그대로)`, JSON.stringify(단추글) === JSON.stringify(['⬇ 엑셀 받기', '📄 PDF', '🖨 인쇄', '📑 내역서와 대조']), 단추글)
  const 끈줄 = await p.evaluate(() => document.querySelectorAll('.gg-print tr.ja-off').length)
  const R = await 받기(p, `산출${꼬리}.pdf`)
  const A = PDF보기(R.파일)
  const 먹 = 먹들(R.파일, path.join(폴더, `먹_산출${꼬리}`))
  ok(`${앞}① 📄 PDF → 바로 받음 · PDF 1.4 · 글꼴 0 · 글자 0 · 그림 ${A.그림수} = ${A.쪽}쪽 · 세로 A4 · 쪽마다 먹 ${먹.join(' · ')}% · ${A.KB}KB · ${R.걸림.toFixed(1)}초`,
    A.머리.startsWith('%PDF-1.4') && A.쪽 >= 1 && A.글꼴 === 0 && A.글자 === '' && A.그림수 >= A.쪽 && A4세로(A) && 먹.length === A.쪽 && 먹.every((x) => x > 0), { ...A, 먹 })
  ok(`${앞}① 이름 «${R.받은이름}»(= 엑셀과 같은 꼴) · 알림 «${R.알림}» · 찍는 동안 단추 막음(${R.막음.join(',')}) · 끈 줄 ${끈줄}개는 빠짐(no-print)`,
    R.받은이름 === '도면물량_수량산출서.pdf' && new RegExp(`PDF ${A.쪽}쪽을 만들었습니다`).test(R.알림) && R.막음.every(Boolean), [R.받은이름, R.알림, R.막음])
  if (!폰) {
    /* 옛 인쇄 — 같은 화면을 브라우저로(그림만인쇄 막이 풂 = 옛 window.print 그대로) */
    const 전파일 = path.join(폴더, '산출_전글자.pdf')
    await p.evaluate(() => document.body.classList.add('kcm-찍는중'))
    fs.writeFileSync(전파일, await p.pdf({ preferCSSPageSize: true, printBackground: true }))
    await p.evaluate(() => document.body.classList.remove('kcm-찍는중'))
    const 전먹 = 먹들(전파일, path.join(폴더, '전먹_산출'))
    const 전글 = execFileSync('pdftotext', ['-layout', 전파일, '-']).toString().replace(/\s+/g, '')
    ok(`① 쪽 수 — 옛 인쇄(쪽 전체 · 사이트 머리까지 · 글자) 내용 ${전먹.filter((x) => x > 0).length}쪽 · 그림(결과 카드만) ${A.쪽}쪽(같거나 덜) · 옛 PDF 엔 글자가 있었음(${전글.length}자)`,
      A.쪽 <= 전먹.filter((x) => x > 0).length && 전글.length > 200, 전먹)
    execFileSync('pdftoppm', ['-r', '30', '-png', R.파일, path.join(폴더, '산출')])
  }
  /* ② 인쇄 */
  await p.evaluate(() => {
    window.__인쇄 = null
    window.print = () => { const 판 = document.getElementById('kcm-그림인쇄'); const 그림 = 판 ? [...판.querySelectorAll('img.kcm-쪽그림')] : []; window.__인쇄 = { 그림: 그림.length, 크기: 그림[0] ? 그림[0].style.width + '×' + 그림[0].style.height : '', 다불림: 그림.every((im) => im.complete && im.naturalWidth > 1000), 몸: document.body.classList.contains('kcm-그림인쇄중') } }
  })
  await 인쇄단추(p).click()
  let 순간 = null
  for (let i = 0; i < 600 && !순간; i++) { await 쉬어(100); 순간 = await p.evaluate(() => window.__인쇄) }
  ok(`${앞}② 🖨 인쇄 → 몸 밑엔 쪽 그림만 ${순간 ? 순간.그림 : '?'}장(${순간 ? 순간.크기 : ''} · 다 불러옴)`, !!순간 && 순간.그림 === A.쪽 && 순간.크기 === '186mm×271mm' && 순간.다불림 && 순간.몸, 순간)
  if (순간) {
    const 인쇄파일 = path.join(폴더, `산출_인쇄${꼬리}.pdf`)
    fs.writeFileSync(인쇄파일, await p.pdf({ preferCSSPageSize: true, printBackground: true }))
    const B = PDF보기(인쇄파일)
    ok(`${앞}② 인쇄 창 «PDF로 저장» 과 같은 PDF — ${B.쪽}쪽(빈 쪽 없음) · 세로 · 글꼴 0 · 글자 0`, B.쪽 === 순간.그림 && B.크기[1] > B.크기[0] && B.글꼴 === 0 && B.글자 === '', B)
    await p.evaluate(() => window.dispatchEvent(new Event('afterprint')))
    await 쉬어(300)
    ok(`${앞}② 인쇄 창을 닫으면 다 걷힘`, await p.evaluate(() => !document.getElementById('kcm-그림인쇄') && !document.body.classList.contains('kcm-그림인쇄중')))
  }
  if (!폰) {
    /* ⑤ Ctrl+P (물량 전부 탭) */
    const 바로 = path.join(폴더, '산출_바로인쇄.pdf')
    fs.writeFileSync(바로, await p.pdf({ preferCSSPageSize: true }))
    const 바글 = execFileSync('pdftotext', ['-layout', 바로, '-']).toString().replace(/\s+/g, '')
    ok('⑤ 단추 없이 Ctrl+P → «수량산출서는 화면의 … 단추로 인쇄해 주세요» 안내 · 결과(«물량 전부 — 수량산출서») 글은 안 나감', /수량산출서는화면의«📄PDF»또는«🖨인쇄»단추로인쇄해주세요/.test(바글) && !/물량전부—수량산출서/.test(바글), 바글.slice(0, 300))
  }
  /* ③ 내역 대조 */
  await 탭(p, '내역 대조')
  const 대조단추 = await p.$$eval('.gg-print .gg-head button', (x) => x.map((y) => y.innerText.trim()))
  const R3 = await 받기(p, `대조${꼬리}.pdf`)
  const A3 = PDF보기(R3.파일)
  ok(`${앞}③ 내역 대조 «${대조단추.join(' · ')}» → 📄 PDF ${A3.쪽}쪽 · 이름 «${R3.받은이름}» · 글꼴 0 · 글자 0 · 세로 A4 · ${A3.KB}KB · ${R3.걸림.toFixed(1)}초`,
    대조단추.includes('📄 PDF') && 대조단추.includes('🖨 인쇄') && 대조단추.includes('⬇ 엑셀 받기') && R3.받은이름 === '도면물량_내역대조.pdf' && A3.쪽 >= 1 && A3.글꼴 === 0 && A3.글자 === '' && A3.그림수 >= A3.쪽 && A4세로(A3) && new RegExp(`PDF ${A3.쪽}쪽을 만들었습니다`).test(R3.알림), [대조단추, R3.받은이름, A3, R3.알림])
  if (!폰) execFileSync('pdftoppm', ['-r', '30', '-png', '-l', '2', R3.파일, path.join(폴더, '대조')])
  /* ④ 골조 탭 — 전엔 인쇄 단추가 없었음 */
  await 탭(p, '골조')
  const 전골단추 = await p.$$eval('.gg-print .gg-head button', (x) => x.map((y) => y.innerText.trim()))
  await p.locator('.gg-print .gg-head button', { hasText: '골조 예시' }).first().click()
  await p.waitForFunction(() => [...document.querySelectorAll('.gg-print .gg-head button')].some((x) => x.innerText.trim() === '📄 PDF'), null, { timeout: 120000 })
  await 쉬어(1200)
  const 골단추 = await p.$$eval('.gg-print .gg-head button', (x) => x.map((y) => y.innerText.trim()))
  const R4 = await 받기(p, `골조${꼬리}.pdf`)
  const A4 = PDF보기(R4.파일)
  ok(`${앞}④ 골조 탭 — 결과 없을 땐 PDF 단추 없음(«${전골단추.join(' · ')}») · 골조 예시 뒤 «${골단추.join(' · ')}» → 📄 PDF ${A4.쪽}쪽 · 이름 «${R4.받은이름}» · 글꼴 0 · 글자 0 · 세로 A4`,
    !전골단추.includes('📄 PDF') && 골단추.includes('📄 PDF') && 골단추.includes('🖨 인쇄') && 골단추.includes('⬇ 골조 산출서 엑셀') && R4.받은이름 === '골조_수량산출서(도면 자동).pdf' && A4.쪽 >= 1 && A4.글꼴 === 0 && A4.글자 === '' && A4.그림수 >= A4.쪽 && A4세로(A4) && new RegExp(`PDF ${A4.쪽}쪽을 만들었습니다`).test(R4.알림), [전골단추, 골단추, R4.받은이름, A4, R4.알림])
  if (!폰) {
    execFileSync('pdftoppm', ['-r', '30', '-png', '-l', '2', R4.파일, path.join(폴더, '골조')])
    /* ⑥ 작업 화면 — 물량 전부 탭으로 돌아가 같은 쪽 수 */
    await 탭(p, '물량 전부')
    const 보통 = PDF보기((await 받기(p, '산출_다시.pdf')).파일)
    await p.locator('button', { hasText: '작업 화면' }).first().click()
    await 쉬어(1500)
    if (!(await p.$('.gg-print .gg-head'))) { await p.locator('[role=tab]', { hasText: '물량 전부' }).first().click(); await 쉬어(1000) }
    const 작업 = await p.evaluate(() => !!document.querySelector('.gg.gg-ws'))
    const R6 = await 받기(p, '산출_작업화면.pdf')
    const A6 = PDF보기(R6.파일)
    ok(`⑥ 🖥 작업 화면(붙박이 틀)에서도 📄 PDF ${A6.쪽}쪽(보통 화면 ${보통.쪽}쪽과 같음) · 글자 0 · 화면은 작업 화면 그대로`, 작업 && A6.쪽 === 보통.쪽 && A6.글자 === '' && A6.글꼴 === 0 && (await p.evaluate(() => !!document.querySelector('.gg.gg-ws'))), [작업, A6, 보통.쪽])
    await p.locator('button', { hasText: '나가기' }).first().click().catch(() => {})
    await 쉬어(500)
    /* ⑦ 404 */
    const q = await ctx.newPage()
    await q.route((u) => /html2canvas|그림인쇄\./.test(decodeURIComponent(u.toString())), (r) => r.fulfill({ status: 404, body: 'not found' }))
    await 열기(q)
    await PDF단추(q).click()
    let 말7 = ''
    for (let i = 0; i < 80 && !/새로/.test(말7); i++) { await 쉬어(100); 말7 = await 말(q) }
    ok('⑦ 찍는 도구 파일이 없어진 때(404) → «새로고침(↻) 뒤 다시 · 쓴 것은 그대로» 알림 · 단추 다시 켜짐', /사이트가 새로 바뀌었습니다 — 화면을 새로고침\(↻\)한 뒤 다시 눌러 주세요\(쓴 것은 그대로 남습니다\)/.test(말7) && !(await PDF단추(q).isDisabled()), 말7)
    await q.close()
  }
  ok(`⑧ ${기기} 넘침 0 · 오류 0`, (await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 1 && 오류.length === 0, 오류)
  await ctx.close()
}
await b.close()
console.log(`\n${n}개 중 틀림 ${bad}` + (틀림.length ? '\n  ' + 틀림.join('\n  ') : ''))
process.exit(bad ? 1 : 0)
