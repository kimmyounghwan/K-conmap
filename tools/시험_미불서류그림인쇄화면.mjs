/**
 * 🖼 G610 미불금 서류 셋(/tools/demand-letter 내용증명 · payment-order 지급명령 신청서 · direct-payment 직접지급 요청서) — 그림 인쇄(글자 층 없음) 화면 시험.
 *   node tools/시험_미불서류그림인쇄화면.mjs [주소=http://127.0.0.1:4578]        (OUT=/tmp/g10/g610)
 *   소장님 11-08 «엑셀은 그대로 · PDF 는 모두 그림» · 9/26 방침 «결과는 화면에서 보고 인쇄만(파일로 내려받지 않음)» — «📄 PDF 저장» 단추는 없고 «🖨 인쇄» 만 그림으로:
 *   판 #mb-인쇄(부수만큼 .mb-쪽 → 한 덩이 .mb-쪽들) · 몸표 mb-인쇄중 · @page mb쪽 18 · 16mm(글자 칸 178 × 261mm) · 부수마다 새 쪽.
 *   ① 서류마다 예시 → «🖨 인쇄» → 인쇄 순간 몸 밑엔 쪽 그림만(mb쪽 · 178 × 261mm · 다 불러옴) → 인쇄 창 «PDF로 저장» = 글꼴 0 · 글자 0 · 쪽 = 그림 · 세로 ·
 *      쪽 수 = 옛 인쇄(같은 판을 mb-인쇄중 으로 브라우저 인쇄) 내용 쪽과 같거나 한 쪽 덜 · 내용증명 3부 = 3쪽 넘게 · 닫으면 걷힘 · 받기(📄 PDF) 단추 없음
 *   ② 찍는 동안 단추 막음 ③ 단추 없이 Ctrl+P → 서류 칸은 안 찍히고 «단추로 인쇄» 안내 ④ 404 ⑤ 폰 390 · PC 1280 넘침 0 · 오류 0
 *   인터넷 안 부름 · 지어낸 예시만(lib/미불셈.js 예시값).
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const BASE = process.argv[2] || 'http://127.0.0.1:4578'
const 폴더 = process.env.OUT || '/tmp/g10/g610'
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
/* [주소, 이름표, Ctrl+P 안내 머리, 최소 쪽] */
const 서류들 = [
  ['demand-letter', '내용증명', '내용증명은', 3],
  ['payment-order', '지급명령', '지급명령신청서는', 1],
  ['direct-payment', '직접지급', '직접지급요청서는', 1],
]
for (const [기기, w, h, 폰] of [['PC 1280', 1280, 900, false], ['폰 390', 390, 844, true]]) {
  console.log(`■ ${기기}`)
  const ctx = await b.newContext({ viewport: { width: w, height: h }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', isMobile: 폰, hasTouch: 폰, acceptDownloads: true, ...(폰 ? { userAgent: UA폰 } : {}) })
  await ctx.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|googlesyndication|geojs/, (r) => r.fulfill({ status: 200, body: '' }))
  await ctx.route(/firebaseio\.com|firebasedatabase\.app|identitytoolkit|securetoken/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await ctx.addInitScript(() => { try { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); sessionStorage.setItem('kcm_notice_seen', '2026-10-업체'); sessionStorage.setItem('kcm_visit_s', '1') } catch (e) { /* 없음 */ } })
  const p = await ctx.newPage()
  const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
  const 꼬리 = 폰 ? '_폰' : ''
  const 앞 = 폰 ? '(폰) ' : ''
  const 열기 = async (q, 길) => {
    await q.goto(BASE + '/tools/' + 길, { waitUntil: 'domcontentloaded' })
    await q.waitForSelector('.mb-out', { timeout: 20000 }).catch(() => {})
    await 쉬어(600)
    await q.locator('button', { hasText: '예시로 해 보기' }).first().click()
    await 쉬어(900)
    await q.waitForSelector('.mb-out', { timeout: 10000 })
  }
  const 인쇄단추 = (q) => q.locator('.mb-out .kt-btns button').first()
  const 판엿보기 = (q) => q.evaluate(() => {
    window.__판 = null
    if (window.__ob) window.__ob.disconnect()
    const ob = new MutationObserver(() => { const el = document.querySelector('#mb-인쇄'); if (el && el.firstElementChild && !window.__판) window.__판 = el.outerHTML })
    ob.observe(document.body, { childList: true, subtree: true })
    window.__ob = ob
  })
  const 전방식 = async (q, 이름) => {
    const html = await q.evaluate(() => window.__판)
    if (!html) return { 내용: 0, 전체: 0 }
    await q.evaluate((hh) => { const d = document.createElement('div'); d.innerHTML = hh; document.body.appendChild(d.firstElementChild); document.body.classList.add('mb-인쇄중'); document.documentElement.classList.add('mb-인쇄중') }, html)
    const 파일 = path.join(폴더, 이름)
    fs.writeFileSync(파일, await q.pdf({ preferCSSPageSize: true, printBackground: true }))
    await q.evaluate(() => { document.querySelectorAll('#mb-인쇄').forEach((x) => x.remove()); document.body.classList.remove('mb-인쇄중'); document.documentElement.classList.remove('mb-인쇄중') })
    const 먹 = 먹들(파일, path.join(폴더, '전먹_' + 이름))
    return { 내용: 먹.filter((x) => x > 0).length, 전체: 먹.length, 먹 }
  }
  const 고른 = 폰 ? 서류들.slice(0, 1) : 서류들
  for (const [길, 이름표, , 최소] of 고른) {
    await 열기(p, 길)
    const 단추글 = (await 인쇄단추(p).innerText()).trim()
    const PDF단추수 = await p.locator('.mb-out button', { hasText: 'PDF' }).count()
    await 판엿보기(p)
    await p.evaluate(() => {
      window.__인쇄 = null
      window.print = () => { const 판 = document.getElementById('kcm-그림인쇄'); const 그림 = 판 ? [...판.querySelectorAll('img.kcm-쪽그림')] : []; window.__인쇄 = { 그림: 그림.length, 쪽: [...new Set(그림.map((im) => im.style.page))].join(','), 판쪽: 판 ? 판.style.page : '?', 크기: 그림[0] ? 그림[0].style.width + '×' + 그림[0].style.height : '', 다불림: 그림.every((im) => im.complete && im.naturalWidth > 1000), 몸: document.body.classList.contains('kcm-그림인쇄중'), 판남음: !!document.getElementById('mb-인쇄') } }
    })
    const t0 = Date.now()
    await 인쇄단추(p).click()
    await 쉬어(60)
    const 막음 = await 인쇄단추(p).isDisabled()
    let 순간 = null
    for (let i = 0; i < 300 && !순간; i++) { await 쉬어(100); 순간 = await p.evaluate(() => window.__인쇄) }
    ok(`${앞}① ${이름표} «${단추글}» → 몸 밑엔 쪽 그림만 ${순간 ? 순간.그림 : '?'}장(${순간 ? 순간.크기 : ''} · mb쪽 · 다 불러옴 · 글자 판은 걷힘) · 찍는 동안 단추 막음 · 📄 받기 단추 없음(${PDF단추수}) · ${((Date.now() - t0) / 1000).toFixed(1)}초`,
      !!순간 && 순간.그림 >= 최소 && 순간.쪽 === 'mb쪽' && 순간.판쪽 === 'mb쪽' && 순간.크기 === '178mm×261mm' && 순간.다불림 && 순간.몸 && !순간.판남음 && 막음 && PDF단추수 === 0, { 순간, 막음, PDF단추수 })
    if (순간) {
      const 인쇄파일 = path.join(폴더, `미불_${이름표}${꼬리}.pdf`)
      fs.writeFileSync(인쇄파일, await p.pdf({ preferCSSPageSize: true, printBackground: true }))
      const B = PDF보기(인쇄파일)
      const 먹 = 먹들(인쇄파일, path.join(폴더, `먹_${이름표}${꼬리}`))
      ok(`${앞}① ${이름표} 인쇄 창 «PDF로 저장» — ${B.쪽}쪽(= 그림 ${순간.그림}장 · 쪽마다 먹 ${먹.join(' · ')}%) · 세로 A4 · 글꼴 0 · 글자 0`, B.쪽 === 순간.그림 && Math.abs(B.크기[0] - 595.28) < 1 && Math.abs(B.크기[1] - 841.89) < 1 && B.글꼴 === 0 && B.글자 === '' && 먹.every((x) => x > 0), { ...B, 먹 })
      await p.evaluate(() => window.dispatchEvent(new Event('afterprint')))
      await 쉬어(300)
      ok(`${앞}① ${이름표} 인쇄 창을 닫으면 다 걷힘`, await p.evaluate(() => !document.getElementById('kcm-그림인쇄') && !document.body.classList.contains('kcm-그림인쇄중') && !document.getElementById('mb-인쇄')))
      if (!폰) {
        const 전 = await 전방식(p, `미불_${이름표}_전글자.pdf`)
        ok(`${이름표} 쪽 수 — 옛 인쇄(mb-인쇄중 · 글자) 내용 ${전.내용}쪽(전체 ${전.전체}) · 그림 ${순간.그림}쪽(같거나 한 쪽 덜)`, 전.내용 >= 1 && (순간.그림 === 전.내용 || 순간.그림 === 전.내용 - 1), 전)
        execFileSync('pdftoppm', ['-r', '30', '-png', 인쇄파일, path.join(폴더, `미불_${이름표}${꼬리}`)])
      }
    }
  }
  if (!폰) {
    /* ③ Ctrl+P(내용증명) */
    await 열기(p, 'demand-letter')
    const 바로 = path.join(폴더, '바로인쇄.pdf')
    fs.writeFileSync(바로, await p.pdf({ preferCSSPageSize: true }))
    const 바글 = execFileSync('pdftotext', ['-layout', 바로, '-']).toString().replace(/\s+/g, '')
    ok('③ 단추 없이 Ctrl+P → «내용증명은 화면의 «🖨 인쇄» 단추로 인쇄해 주세요» 안내 · 서류 · 적는 칸 글 안 나감(도구 설명 글은 나감)', /내용증명은화면의«🖨인쇄»단추로인쇄해주세요/.test(바글) && !/가나전문건설/.test(바글) && !/수신인/.test(바글.replace(/수신인\(/g, '')), 바글.slice(0, 300))
    /* ④ 404 */
    const q = await ctx.newPage()
    await q.route((u) => /html2canvas|그림인쇄\./.test(decodeURIComponent(u.toString())), (r) => r.fulfill({ status: 404, body: 'not found' }))
    await 열기(q, 'payment-order')
    await q.evaluate(() => { window.print = () => { window.__찍음 = true } })
    await 인쇄단추(q).click()
    let 말4 = ''
    for (let i = 0; i < 50 && !/새로/.test(말4); i++) { await 쉬어(100); 말4 = await q.evaluate(() => [...document.querySelectorAll('.mb-찍말')].map((x) => x.innerText).join(' | ')) }
    ok('④ 찍는 도구 파일이 없어진 때(404) → «새로고침(↻) 뒤 다시 · 쓴 것은 그대로» 알림 · 판 걷힘 · 인쇄 창 안 뜸 · 단추 다시 켜짐', /사이트가 새로 바뀌었습니다 — 화면을 새로고침\(↻\)한 뒤 다시 눌러 주세요\(쓴 것은 그대로 남습니다\)/.test(말4) && !(await q.evaluate(() => !!document.querySelector('#mb-인쇄'))) && !(await q.evaluate(() => !!window.__찍음)) && !(await 인쇄단추(q).isDisabled()), 말4)
    await q.close()
  }
  ok(`⑤ ${기기} 넘침 0 · 오류 0`, (await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 1 && 오류.length === 0, 오류)
  await ctx.close()
}
await b.close()
console.log(`\n${n}개 중 틀림 ${bad}` + (틀림.length ? '\n  ' + 틀림.join('\n  ') : ''))
process.exit(bad ? 1 : 0)
