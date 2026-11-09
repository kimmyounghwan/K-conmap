/**
 * 🖼 G605 일용직 실업급여 판단기(/tools/ilyong-silup) — 그림 PDF · 그림 인쇄(글자 층 없음) 화면 시험. 구운 사이트(dist)를 띄운 뒤:
 *   node tools/시험_실업급여그림PDF화면.mjs [주소=http://127.0.0.1:4578]        (OUT=/tmp/g10/g605)
 *   소장님 11-08 «엑셀은 그대로 · PDF 는 모두 그림» — 옛 «🖨 인쇄»(window.print · 화면 그대로 글자 PDF) → 화면(.wrap.sl)을 복제본에서 인쇄 CSS 로 펴서 그림으로 —
 *   A4 세로 기본 쪽(186 × 271mm · 여백 12) · 적는 칸 · 설명 · 단추는 숨음(옛 인쇄와 같은 모양).
 *   ① 👀 예시마다 «📄 PDF» → 바로 받음 · PDF 1.4 · 글꼴 0 · 글자 0 · 그림 = 쪽 · A4 세로 · 쪽마다 내용 · 이름 «실업급여판단_마지막날.pdf» · 알림 ·
 *      찍는 동안 단추 막음 · 보는 화면 그대로(적는 칸 보임) · 쪽 수 = 옛 인쇄(같은 화면을 브라우저로 인쇄) 내용 쪽과 같거나 한 쪽 덜
 *   ② «🖨 인쇄» → 몸 밑엔 쪽 그림만(186 × 271mm) → 같은 PDF · 닫으면 걷힘 ③ 단추 없이 Ctrl+P → 판단 결과는 안 찍히고 «단추로 인쇄» 안내
 *   ④ 404 ⑤ 폰 390 · PC 1280 넘침 0 · 오류 0 — 인터넷 안 부름 · 지어낸 예시만.
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const BASE = process.argv[2] || 'http://127.0.0.1:4578'
const 폴더 = process.env.OUT || '/tmp/g10/g605'
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
const 사례들 = [['건설 · 다음 달 1일부터', '2026-10-27'], ['건설 · 14일 쉬고', '2026-10-30'], ['건설 아닌 일용 · 두 달 뒤', '2026-10-30'], ['날이 모자람', '2026-10-27'], ['스스로 그만둠', '2026-10-20']]
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
    await q.goto(BASE + '/tools/ilyong-silup', { waitUntil: 'domcontentloaded' })
    await q.evaluate(() => { localStorage.removeItem('kcm_silup') })
    await q.reload({ waitUntil: 'domcontentloaded' })
    await q.waitForSelector('.wrap.sl', { timeout: 20000 })
    await 쉬어(500)
  }
  const 사례넣기 = async (q, 글) => {
    const 열림 = await q.evaluate(() => { const d = document.querySelector('.wrap.sl .iy-exd'); return d ? d.open : false })
    if (!열림) { await q.locator('.wrap.sl .iy-exd > summary').click(); await 쉬어(200) }
    await q.locator('.wrap.sl .iy-exd button', { hasText: 글 }).click()
    await 쉬어(500)
  }
  const PDF단추 = (q) => q.locator('.wrap.sl .sl-btns button', { hasText: /^📄 PDF$|PDF 만드는 중/ })
  const 인쇄단추 = (q) => q.locator('.wrap.sl .sl-btns button', { hasText: /^🖨 인쇄$|준비 중/ })
  /* 옛 인쇄 — 같은 화면을 브라우저로 인쇄(몸에 kcm-찍는중 만 달아 그림만인쇄 막이를 풂 = 옛 화면 그대로) */
  const 전방식 = async (q, 이름) => {
    const 파일 = path.join(폴더, 이름)
    await q.evaluate(() => document.body.classList.add('kcm-찍는중'))
    fs.writeFileSync(파일, await q.pdf({ preferCSSPageSize: true, printBackground: true }))
    await q.evaluate(() => document.body.classList.remove('kcm-찍는중'))
    const 먹 = 먹들(파일, path.join(폴더, '전먹_' + 이름))
    return { 내용: 먹.filter((x) => x > 0).length, 전체: 먹.length, 먹 }
  }
  const 말 = (q) => q.evaluate(() => [...document.querySelectorAll('.sl-찍말')].map((x) => x.innerText).join(' | '))
  const 한판 = async (이름표, 끝날) => {
    const t0 = Date.now()
    const [dl, 막음] = await Promise.all([
      p.waitForEvent('download', { timeout: 60000 }),
      (async () => { await PDF단추(p).click(); await 쉬어(60); return [await PDF단추(p).isDisabled(), await 인쇄단추(p).isDisabled()] })(),
    ])
    const 파일 = path.join(폴더, `실업_${이름표}${꼬리}.pdf`)
    await dl.saveAs(파일)
    await 쉬어(400)
    const 이름 = await p.evaluate(() => (window.__받은이름 || []).slice(-1)[0] || '')
    const 알림 = await 말(p)
    const A = PDF보기(파일)
    const 먹 = 먹들(파일, path.join(폴더, `먹_${이름표}${꼬리}`))
    const 화면 = await p.evaluate(() => ({ 적는칸: !!document.querySelector('.wrap.sl .sl-in') && getComputedStyle(document.querySelector('.wrap.sl .sl-in')).display !== 'none', 몸: document.body.className }))
    ok(`${앞}${이름표} 📄 PDF → 바로 받음 · PDF 1.4 · 글꼴 0 · 글자 0 · 그림 ${A.그림수} = ${A.쪽}쪽 · 세로 A4 · 쪽마다 먹 ${먹.join(' · ')}% · ${A.KB}KB · ${((Date.now() - t0) / 1000).toFixed(1)}초`,
      A.머리.startsWith('%PDF-1.4') && A.쪽 >= 1 && A.글꼴 === 0 && A.글자 === '' && A.그림수 >= A.쪽 && Math.abs(A.크기[0] - 595.28) < 1 && Math.abs(A.크기[1] - 841.89) < 1 && 먹.length === A.쪽 && 먹.every((x) => x > 0), { ...A, 먹 })
    ok(`${앞}${이름표} 이름 «${이름}» · 알림 «PDF ${A.쪽}쪽» · 찍는 동안 단추 막음(${막음.join(',')}) · 보는 화면 그대로(적는 칸 보임 · 몸 표 없음)`, 이름 === `실업급여판단_${끝날}.pdf` && new RegExp(`PDF ${A.쪽}쪽을 만들었습니다`).test(알림) && 막음.every(Boolean) && 화면.적는칸 && !/kcm-찍는중|gp-인쇄중/.test(화면.몸), [이름, 알림, 막음, 화면])
    let 전 = null
    if (!폰) {
      전 = await 전방식(p, `실업_${이름표}_전글자.pdf`)
      ok(`${이름표} 쪽 수 — 옛 인쇄 내용 ${전.내용}쪽(전체 ${전.전체}) · 그림 ${A.쪽}쪽(같거나 한 쪽 덜)`, 전.내용 >= 1 && (A.쪽 === 전.내용 || A.쪽 === 전.내용 - 1), 전)
    }
    execFileSync('pdftoppm', ['-r', '30', '-png', 파일, path.join(폴더, `실업_${이름표}${꼬리}`)])
    return { ...A, 전 }
  }

  await 새로(p)
  const 고른 = 폰 ? 사례들.slice(0, 1) : 사례들
  let 첫 = null
  for (const [글, 끝날] of 고른) {
    await 사례넣기(p, 글)
    const A = await 한판(글.replace(/[ ·]+/g, '_'), 끝날)
    if (!첫) 첫 = A
  }
  /* ② 인쇄(마지막 사례) */
  {
    await p.evaluate(() => {
      window.__인쇄 = null
      window.print = () => { const 판 = document.getElementById('kcm-그림인쇄'); const 그림 = 판 ? [...판.querySelectorAll('img.kcm-쪽그림')] : []; window.__인쇄 = { 그림: 그림.length, 크기: 그림[0] ? 그림[0].style.width + '×' + 그림[0].style.height : '', 다불림: 그림.every((im) => im.complete && im.naturalWidth > 1000), 몸: document.body.classList.contains('kcm-그림인쇄중') } }
    })
    await 인쇄단추(p).click()
    let 순간 = null
    for (let i = 0; i < 300 && !순간; i++) { await 쉬어(100); 순간 = await p.evaluate(() => window.__인쇄) }
    ok(`${앞}② 🖨 인쇄 → 몸 밑엔 쪽 그림만 ${순간 ? 순간.그림 : '?'}장(${순간 ? 순간.크기 : ''} · 다 불러옴)`, !!순간 && 순간.그림 >= 1 && 순간.크기 === '186mm×271mm' && 순간.다불림 && 순간.몸, 순간)
    if (순간) {
      const 인쇄파일 = path.join(폴더, `실업_인쇄${꼬리}.pdf`)
      fs.writeFileSync(인쇄파일, await p.pdf({ preferCSSPageSize: true, printBackground: true }))
      const B = PDF보기(인쇄파일)
      ok(`${앞}② 인쇄 창 «PDF로 저장» 과 같은 PDF — ${B.쪽}쪽(그림 ${순간.그림}장 · 빈 쪽 없음) · 세로 · 글꼴 0 · 글자 0`, B.쪽 === 순간.그림 && B.크기[1] > B.크기[0] && B.글꼴 === 0 && B.글자 === '', B)
      await p.evaluate(() => window.dispatchEvent(new Event('afterprint')))
      await 쉬어(300)
      ok(`${앞}② 인쇄 창을 닫으면 다 걷힘`, await p.evaluate(() => !document.getElementById('kcm-그림인쇄') && !document.body.classList.contains('kcm-그림인쇄중')))
    }
  }
  if (!폰) {
    /* ③ Ctrl+P */
    const 바로 = path.join(폴더, '바로인쇄.pdf')
    fs.writeFileSync(바로, await p.pdf({ preferCSSPageSize: true }))
    const 바글 = execFileSync('pdftotext', ['-layout', 바로, '-']).toString().replace(/\s+/g, '')
    ok('③ 단추 없이 Ctrl+P → «판단 결과는 화면의 … 단추로 인쇄해 주세요» 안내 · 판단 결과 글 안 나감', /판단결과는화면의/.test(바글) && /단추로인쇄해주세요/.test(바글) && !/신청할수있는날/.test(바글) && !/받는돈/.test(바글), 바글.slice(0, 300))
    /* ④ 404 */
    const q = await ctx.newPage()
    await q.route((u) => /html2canvas|그림인쇄\./.test(decodeURIComponent(u.toString())), (r) => r.fulfill({ status: 404, body: 'not found' }))
    await 새로(q)
    await 사례넣기(q, 사례들[0][0])
    await PDF단추(q).click()
    let 말4 = ''
    for (let i = 0; i < 50 && !/새로/.test(말4); i++) { await 쉬어(100); 말4 = await 말(q) }
    ok('④ 찍는 도구 파일이 없어진 때(404) → «새로고침(↻) 뒤 다시 · 쓴 것은 그대로» 알림 · 단추 다시 켜짐', /사이트가 새로 바뀌었습니다 — 화면을 새로고침\(↻\)한 뒤 다시 눌러 주세요\(쓴 것은 그대로 남습니다\)/.test(말4) && !(await PDF단추(q).isDisabled()), 말4)
    await q.close()
  }
  ok(`⑤ ${기기} 넘침 0 · 오류 0`, (await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 1 && 오류.length === 0, 오류)
  void 첫
  await ctx.close()
}
await b.close()
console.log(`\n${n}개 중 틀림 ${bad}` + (틀림.length ? '\n  ' + 틀림.join('\n  ') : ''))
process.exit(bad ? 1 : 0)
