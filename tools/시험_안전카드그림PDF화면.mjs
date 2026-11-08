/**
 * 🖼 G597 현장 다국어 안전카드(/tools/safecard) — 종이 그림 PDF · 그림 인쇄(글자 층 없음) 화면 시험. 구운 사이트(dist)를 띄운 뒤:
 *   node tools/시험_안전카드그림PDF화면.mjs [주소=http://127.0.0.1:4578]        (OUT=/tmp/g10/g597)
 *   소장님 11-08 «엑셀은 그대로 · PDF 는 모두 그림» — 인쇄 판(#gp-인쇄 · 안 종이들 한 덩이 .sc-종이들)을 그림으로 —
 *   A4 세로 @page sc세로 10mm(글자 칸 190 × 277mm) · 표지 꼴은 한 장에 하나(break-after) 그대로 · 빈 쪽은 뺌(lib 흰쪽).
 *   ① TBM(🧪 예시 채우기) · 안전수칙 표지(긴 글 표지 포함 넷 · 말 셋) · 작업 지시서(작업 셋) 마다 «📄 PDF 저장» → 바로 받음 · PDF 1.4 · 글꼴 0 · 글자 0 ·
 *      그림 = 쪽 · A4 세로 · 쪽마다 내용(흰 쪽 없음) · 이름 «다국어안전카드_종류_날짜.pdf» · 알림
 *   ② 쪽 수 = 같은 판을 전 방식(gp-인쇄중 · 브라우저 인쇄 · 글자)으로 찍은 내용 쪽과 같거나 한 쪽 덜(표지가 넘쳐 바닥 글 한 줄만 다음 쪽으로 가던 것)
 *   ③ «🖨 인쇄»(TBM) → 인쇄 순간 몸 밑엔 쪽 그림만(sc세로 · 190 × 277mm) → 같은 PDF · 닫으면 걷힘
 *   ④ 단추 없이 Ctrl+P → 안전카드 화면은 안 찍히고 «단추로 인쇄» 안내 ⑤ 404 ⑥ 폰 390 · PC 1280 넘침 0 · 오류 0
 *   ⑦ lib 흰쪽(빈 쪽 빼기) 판단 — 온통 흰 쪽만 뺌 · 가는 선 1줄 · 옅은 점 하나 · 못 읽는 그림은 남김
 *   인터넷 안 부름 · 미리 번역해 둔 문장 · 지어낸 예시만.
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const BASE = process.argv[2] || 'http://127.0.0.1:4578'
const 폴더 = process.env.OUT || '/tmp/g10/g597'
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
    await q.goto(BASE + '/tools/safecard', { waitUntil: 'domcontentloaded' })
    await q.evaluate(() => localStorage.removeItem('kcm.safecard.v1'))
    await q.reload({ waitUntil: 'domcontentloaded' })
    await q.waitForSelector('.sc-wrap', { timeout: 20000 })
    await 쉬어(600)
  }
  const 말누름 = async (q, 이) => { await q.locator('.sc-chips[aria-label="말 고르기"] .chip', { hasText: 이 }).first().click(); await 쉬어(150) }
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
  const 한판 = async (이름표, 종류) => {
    await 판엿보기(p)
    const t0 = Date.now()
    const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 60000 }), p.locator('.sc-headb button', { hasText: '📄 PDF 저장' }).click()])
    const 파일 = path.join(폴더, `카드_${이름표}${꼬리}.pdf`)
    await dl.saveAs(파일)
    await 쉬어(400)
    const 이름 = await p.evaluate(() => (window.__받은이름 || []).slice(-1)[0] || '')
    const 말 = await p.evaluate(() => [...document.querySelectorAll('.sc-wrap [role=status]')].map((x) => x.innerText).join(' | '))
    const A = PDF보기(파일)
    const 먹 = 먹들(파일, path.join(폴더, `먹_${이름표}${꼬리}`))
    ok(`${앞}${이름표} ① 📄 PDF → 바로 받음 · PDF 1.4 · 글꼴 0 · 글자 0 · 그림 ${A.그림수} = ${A.쪽}쪽 · 세로 A4 · 쪽마다 먹 ${먹.join(' · ')}% · ${A.KB}KB · ${((Date.now() - t0) / 1000).toFixed(1)}초`,
      A.머리.startsWith('%PDF-1.4') && A.쪽 >= 1 && A.글꼴 === 0 && A.글자 === '' && A.그림수 >= A.쪽 && Math.abs(A.크기[0] - 595.28) < 1 && Math.abs(A.크기[1] - 841.89) < 1 && 먹.length === A.쪽 && 먹.every((x) => x > 0), { ...A, 먹 })
    ok(`${앞}${이름표} ① 이름 «${이름}» · 알림 «PDF ${A.쪽}쪽» · 판 걷힘`, new RegExp(`^다국어안전카드_${종류}_\\d{4}-\\d{2}-\\d{2}\\.pdf$`).test(이름) && new RegExp(`PDF ${A.쪽}쪽을 만들었습니다`).test(말) && !(await p.evaluate(() => !!document.querySelector('#gp-인쇄'))), [이름, 말])
    let 전 = null
    if (!폰) {
      전 = await 전방식(p, `카드_${이름표}_전글자.pdf`)
      ok(`${이름표} ② 쪽 수 — 전 방식 내용 ${전.내용}쪽(전체 ${전.전체}) · 그림 ${A.쪽}쪽(같거나 한 쪽 덜)`, 전.내용 >= 1 && (A.쪽 === 전.내용 || A.쪽 === 전.내용 - 1), 전)
    }
    execFileSync('pdftoppm', ['-r', '30', '-png', 파일, path.join(폴더, `카드_${이름표}${꼬리}`)])
    return { ...A, 전 }
  }
  /* TBM — 예시 */
  await 새로(p)
  await p.locator('button', { hasText: '🧪 예시 채우기' }).first().click()
  await 쉬어(800)
  const T = await 한판('TBM', 'TBM')
  /* ③ 인쇄(TBM) */
  {
    await p.evaluate(() => {
      window.__인쇄 = null
      window.print = () => { const 판 = document.getElementById('kcm-그림인쇄'); const 그림 = 판 ? [...판.querySelectorAll('img.kcm-쪽그림')] : []; window.__인쇄 = { 그림: 그림.length, 쪽: [...new Set(그림.map((im) => im.style.page))].join(','), 판쪽: 판 ? 판.style.page : '?', 크기: 그림[0] ? 그림[0].style.width + '×' + 그림[0].style.height : '', 다불림: 그림.every((im) => im.complete && im.naturalWidth > 1000), 몸: document.body.classList.contains('kcm-그림인쇄중') } }
    })
    await p.locator('.sc-headb button', { hasText: '🖨 인쇄' }).click()
    let 순간 = null
    for (let i = 0; i < 300 && !순간; i++) { await 쉬어(100); 순간 = await p.evaluate(() => window.__인쇄) }
    ok(`${앞}③ 🖨 인쇄(TBM) → 몸 밑엔 쪽 그림만 ${순간 ? 순간.그림 : '?'}장(${순간 ? 순간.크기 : ''} · sc세로 · 다 불러옴)`, !!순간 && 순간.그림 === T.쪽 && 순간.쪽 === 'sc세로' && 순간.판쪽 === 'sc세로' && 순간.크기 === '190mm×277mm' && 순간.다불림 && 순간.몸, 순간)
    if (순간) {
      const 인쇄파일 = path.join(폴더, `카드_인쇄${꼬리}.pdf`)
      fs.writeFileSync(인쇄파일, await p.pdf({ preferCSSPageSize: true, printBackground: true }))
      const B = PDF보기(인쇄파일)
      ok(`${앞}③ 인쇄 창 «PDF로 저장» 과 같은 PDF — ${B.쪽}쪽(빈 쪽 없음) · 세로 · 글꼴 0 · 글자 0`, B.쪽 === T.쪽 && B.크기[1] > B.크기[0] && B.글꼴 === 0 && B.글자 === '', B)
      await p.evaluate(() => window.dispatchEvent(new Event('afterprint')))
      await 쉬어(300)
      ok(`${앞}③ 인쇄 창을 닫으면 다 걷힘`, await p.evaluate(() => !document.getElementById('kcm-그림인쇄') && !document.body.classList.contains('kcm-그림인쇄중') && !document.getElementById('gp-인쇄')))
    }
  }
  if (!폰) {
    /* 안전수칙 «표지» — 긴 글 표지(갈탄 · 셋째 말 베트남어가 길어 전 방식은 바닥 글 한 줄만 다음 쪽으로 넘던 것) 포함 넷 · 말 셋 */
    await 새로(p)
    await p.locator('.gp-pick-b', { hasText: '안전수칙' }).click(); await 쉬어(300)
    for (const 이 of ['우즈벡어', '러시아어', '중국어', '베트남어']) await 말누름(p, 이)
    const 켠말 = await p.locator('.sc-chips[aria-label="말 고르기"] .chip.on').allInnerTexts()
    ok(`표지 말 셋 — ${켠말.map((x) => x.split(' ')[0]).join(' · ')}`, 켠말.length === 3 && /^베트남어/.test(켠말[0]) && /^우즈벡어/.test(켠말[1]) && /^러시아어/.test(켠말[2]), 켠말)
    await p.locator('.sc-opt label', { hasText: '표지 —' }).click(); await 쉬어(300)
    await p.locator('.sc-find').fill('크레인'); await 쉬어(300)
    await p.locator('.sc-list li label').nth(0).click(); await p.locator('.sc-list li label').nth(1).click()
    await p.locator('.sc-find').fill(''); await 쉬어(300)
    await p.locator('.sc-cats .chip', { hasText: '밀폐공간' }).click(); await p.locator('.sc-list li label', { hasText: '갈탄' }).click()
    await p.locator('button', { hasText: '직접 쓴 줄 더하기' }).click()
    await p.locator('[aria-label="직접 쓴 말 1"]').fill('3층 슬래브 끝에는 가지 마세요.')
    await 쉬어(400)
    const 장 = await p.locator('.sc-preview .sc-sign').count()
    const R = await 한판('표지', '수칙')
    ok(`② 표지 ${장}장 → 그림 ${R.쪽}쪽(표지 한 장 = 한 쪽 · 넘친 흰 자리는 뺌) · 전 방식 ${R.전 ? R.전.전체 : '?'}쪽(바닥 글 한 줄만 다음 쪽)`, 장 === 4 && R.쪽 === 장 && !!R.전 && R.전.전체 === 장 + 1, { 장, 쪽: R.쪽, 전: R.전 })
    /* 작업 지시서 */
    await 새로(p)
    await p.locator('.gp-pick-b', { hasText: '작업 지시서' }).click(); await 쉬어(300)
    for (const 작 of ['배관', '용접', '자재 운반']) await p.locator('.sc-works .chip', { hasText: 작 }).click()
    await p.locator('button', { hasText: '👍 추천 넣기' }).click(); await 쉬어(500)
    await 한판('지시서', '지시')
    const 바로 = path.join(폴더, '바로인쇄.pdf')
    fs.writeFileSync(바로, await p.pdf({ preferCSSPageSize: true }))
    const 바글 = execFileSync('pdftotext', [바로, '-']).toString().replace(/\s+/g, '')
    ok('④ 단추 없이 Ctrl+P → «안전카드는 화면의 … 단추로 인쇄해 주세요» 안내 · 카드 글 안 나감', /안전카드는화면의/.test(바글) && /단추로인쇄해주세/.test(바글) && !/작업지시서/.test(바글.replace(/안전카드는화면의.*?주세요\./, '')) && !/배관/.test(바글), 바글.slice(0, 200))
    const q = await ctx.newPage()
    await q.route((u) => /html2canvas|그림인쇄\./.test(decodeURIComponent(u.toString())), (r) => r.fulfill({ status: 404, body: 'not found' }))
    await 새로(q)
    await q.locator('button', { hasText: '🧪 예시 채우기' }).first().click(); await 쉬어(800)
    await q.locator('.sc-headb button', { hasText: '📄 PDF 저장' }).click()
    let 말 = ''
    for (let i = 0; i < 50 && !/새로/.test(말); i++) { await 쉬어(100); 말 = await q.evaluate(() => [...document.querySelectorAll('.sc-wrap [role=status]')].map((x) => x.innerText).join(' | ')) }
    ok('⑤ 찍는 도구 파일이 없어진 때(404) → «새로고침(↻) 뒤 다시 · 쓴 것은 그대로» 알림 · 판 걷힘', /사이트가 새로 바뀌었습니다 — 화면을 새로고침\(↻\)한 뒤 다시 눌러 주세요\(쓴 것은 그대로 남습니다\)/.test(말) && !(await q.evaluate(() => !!document.querySelector('#gp-인쇄'))), 말)
    await q.close()
    /* ⑦ lib 흰쪽(빈 쪽 빼기) 판단 — 온통 흰 것만 뺌 · 가는 선 1줄 · 옅은 점 하나 · 못 읽는 그림은 남김(쪽을 빼는 쪽으로는 안 틀림) */
    const 소스 = fs.readFileSync(new URL('../web/src/lib/그림인쇄.js', import.meta.url), 'utf8')
    const 함수 = (/function 흰쪽\(cv\) \{[\s\S]*?\n\}/.exec(소스) || [''])[0]
    const 판단 = 함수 ? await p.evaluate((src) => {
      const 흰쪽 = new Function(src + '\nreturn 흰쪽')()
      const 새판 = (칠) => { const cv = document.createElement('canvas'); cv.width = 1795; cv.height = 2617; const g = cv.getContext('2d'); g.fillStyle = '#ffffff'; g.fillRect(0, 0, cv.width, cv.height); if (칠) 칠(g); return cv }
      return {
        흰: 흰쪽(새판()),
        거의흰: 흰쪽(새판((g) => { g.fillStyle = '#fbfbfb'; g.fillRect(0, 0, 1795, 2617) })),
        맨밑선: 흰쪽(새판((g) => { g.fillStyle = '#dddddd'; g.fillRect(0, 2616, 1795, 1) })),
        세로선: 흰쪽(새판((g) => { g.fillStyle = '#cccccc'; g.fillRect(1201, 0, 1, 2617) })),
        점하나: 흰쪽(새판((g) => { g.fillStyle = '#f0f0f0'; g.fillRect(900, 1300, 1, 1) })),
        못읽음: 흰쪽({ width: 10, height: 10, getContext() { throw new Error('막힘') } }),
      }
    }, 함수) : null
    ok('⑦ 빈 쪽 빼기 판단 — 온통 흰 쪽만 뺌 · 맨 밑 가는 선 1줄 · 세로 선 1줄 · 옅은 점 하나 · 못 읽는 그림은 남김', !!판단 && 판단.흰 === true && 판단.거의흰 === true && 판단.맨밑선 === false && 판단.세로선 === false && 판단.점하나 === false && 판단.못읽음 === false, 판단)
  }
  ok(`⑥ ${기기} 넘침 0 · 오류 0`, (await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 1 && 오류.length === 0, 오류)
  await ctx.close()
}
await b.close()
console.log(`\n${n}개 중 틀림 ${bad}` + (틀림.length ? '\n  ' + 틀림.join('\n  ') : ''))
process.exit(bad ? 1 : 0)
