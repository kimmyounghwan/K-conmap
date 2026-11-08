/**
 * 🖼 G595 신고 정리(/tools/singo — 원천세 · 근로내용 · 기한) — 결과 그림 PDF · 그림 인쇄(글자 층 없음) 화면 시험. 구운 사이트(dist)를 띄운 뒤:
 *   node tools/시험_신고정리그림PDF화면.mjs [주소=http://127.0.0.1:4578]        (OUT=/tmp/g10/g595)
 *   소장님 11-08 «엑셀은 그대로 · PDF 는 모두 그림» — 결과 칸(.hm-out)을 복제본에서만 인쇄 CSS(body.hm-print)로 펴서 찍음 — A4 세로 기본 @page(186 × 271mm).
 *   노무비 계산기 «예시로 채워 보기»(같은 브라우저 · 지어낸 사람 다섯) 뒤 신고 정리를 열고:
 *   ① «📄 PDF 저장» → 바로 받음 · PDF 1.4 · 글꼴 0 · 뽑히는 글자 0 · 그림 = 쪽 · A4 세로 · 쪽마다 내용 · 이름 «신고정리_현장_년-월.pdf» · 알림(단추 줄 밑)
 *   ② 찍는 복제본 몸에 hm-print · kcm-찍는중 · 쪽 수 = 전 방식(몸에 hm-print · 브라우저 인쇄 · 글자) 내용 쪽과 같거나 한 쪽 덜 · 보는 화면 몸 꼴 없음
 *   ③ «🖨 인쇄» → 인쇄 순간 몸 밑엔 쪽 그림만(기본 쪽 · 186 × 271mm) → 같은 PDF · 닫으면 걷힘
 *   ④ 단추 없이 Ctrl+P → 계산기는 안 찍히고 «단추로 인쇄» 안내 ⑤ 📗 엑셀 받기 그대로(받아짐) ⑥ 404 ⑦ 폰 390 · PC 1280 넘침 0 · 오류 0 · 폰 단추 줄
 *   인터넷 안 부름.
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const BASE = process.argv[2] || 'http://127.0.0.1:4578'
const 폴더 = process.env.OUT || '/tmp/g10/g595'
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
    for (let k = i; k < buf.length; k++) if (buf[k] < 230) 검++   // 30dpi 에선 작은 글이 옅은 회색(136~)으로 나옴 — 흰 종이(255)만 아니면 셈(꼬리 몇 줄 쪽도 «내용 있음»)
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
  const 열기 = async (q) => {
    if (!(await q.evaluate(() => { try { return Object.keys(localStorage).some((k) => /nomubi|노무/.test(k) && (localStorage.getItem(k) || '').includes('가나다')) } catch (e) { return false } }).catch(() => false))) {
      await q.goto(BASE + '/tools/nomubi', { waitUntil: 'domcontentloaded' })
      await q.waitForSelector('button', { timeout: 20000 })
      await 쉬어(700)
      const 예 = q.locator('button', { hasText: '예시로 채워 보기' })
      if (await 예.count()) { await 예.first().click(); await 쉬어(1200) }
    }
    await q.goto(BASE + '/tools/singo', { waitUntil: 'domcontentloaded' })
    await q.waitForSelector('.sg .hm-out', { timeout: 20000 })
    await 쉬어(800)
  }
  const 단추 = (q, 글) => q.locator('.sg .hm-out button', { hasText: 글 }).first()
  const 말읽기 = (q) => q.evaluate(() => [...document.querySelectorAll('.sg .hm-out [role=status]')].map((x) => x.innerText).join(' | '))
  const 복제엿보기 = (q) => q.evaluate(() => {
    window.__복제 = null
    if (window.__ob2) window.__ob2.disconnect()
    const 찍기 = (d) => { const 판 = d.querySelector('[data-kcm-찍을]'); if (!판 || !d.body) return; const 머리 = 판.querySelector('.hm-print-h'); window.__복제 = { 몸: d.body.className, 머리: 머리 ? d.defaultView.getComputedStyle(머리).display : '없음' } }
    const 보기 = (fr) => { let d = null; try { d = fr.contentDocument } catch (e) { d = null } if (!d) return; new MutationObserver(() => { try { 찍기(d) } catch (e) { /* 걷히는 중 */ } }).observe(d, { subtree: true, childList: true, attributes: true }) }
    const ob = new MutationObserver((ms) => { for (const m of ms) for (const nd of m.addedNodes) if (nd.tagName === 'IFRAME') 보기(nd) })
    ob.observe(document.body, { childList: true })
    window.__ob2 = ob
  })
  await 열기(p)
  await 복제엿보기(p)
  const t0 = Date.now()
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 60000 }), 단추(p, '📄 PDF 저장').click()])
  const 파일 = path.join(폴더, `신고${꼬리}.pdf`)
  await dl.saveAs(파일)
  await 쉬어(400)
  const 이름 = await p.evaluate(() => (window.__받은이름 || []).slice(-1)[0] || '')
  const 말 = await 말읽기(p)
  const A = PDF보기(파일)
  const 점 = 검은점들(파일, path.join(폴더, `점${꼬리}`))
  ok(`${앞}① 📄 PDF → 바로 받음 · PDF 1.4 · 글꼴 0 · 글자 0 · 그림 ${A.그림수} = ${A.쪽}쪽 · 세로 A4 · 쪽마다 검은 점 ${점.join(' · ')}% · ${A.KB}KB · ${((Date.now() - t0) / 1000).toFixed(1)}초`,
    A.머리.startsWith('%PDF-1.4') && A.쪽 >= 1 && A.글꼴 === 0 && A.글자 === '' && A.그림수 >= A.쪽 && Math.abs(A.크기[0] - 595.28) < 1 && Math.abs(A.크기[1] - 841.89) < 1 && 점.length === A.쪽 && 점.every((x) => x > 0), { ...A, 점 })
  const 자리 = await p.evaluate(() => { const s = [...document.querySelectorAll('.sg .hm-out [role=status]')].find((x) => /PDF \d+쪽을 만들었습니다/.test(x.innerText)); return !!s && !!s.previousElementSibling && /PDF 저장/.test(s.previousElementSibling.textContent) })
  ok(`${앞}① 이름 «${이름}» · 알림 «PDF ${A.쪽}쪽» 단추 줄 바로 밑`, /^신고정리_가나지구 배수로 정비공사_\d{4}-\d{2}\.pdf$/.test(이름) && new RegExp(`PDF ${A.쪽}쪽을 만들었습니다`).test(말) && 자리, [이름, 말, 자리])
  const 복 = await p.evaluate(() => window.__복제)
  const 몸 = await p.evaluate(() => ['hm-print', 'kcm-찍는중', 'kcm-그림인쇄중'].filter((c) => document.body.classList.contains(c)).join(','))
  ok(`${앞}② 찍는 복제본 몸 «${복 ? 복.몸 : '?'}» · 인쇄용 머리줄 ${복 ? 복.머리 : '?'} · 보는 화면 몸 꼴 없음`, !!복 && /\bhm-print\b/.test(복.몸) && /kcm-찍는중/.test(복.몸) && 복.머리 === 'block' && 몸 === '', { 복, 몸 })
  if (!폰) {
    const 전파일 = path.join(폴더, '신고_전글자.pdf')
    await p.evaluate(() => document.body.classList.add('hm-print', 'kcm-찍는중'))
    fs.writeFileSync(전파일, await p.pdf({ preferCSSPageSize: true, printBackground: true }))
    await p.evaluate(() => document.body.classList.remove('hm-print', 'kcm-찍는중'))
    const 전점 = 검은점들(전파일, path.join(폴더, '전점'))
    const 전 = 전점.filter((x) => x > 0).length          // 빈 쪽 = 검은 점 0 · 글 몇 줄만 있는 쪽도 셈(0.02% 로 자르면 꼬리 몇 줄 쪽을 빈 쪽으로 봤음)
    ok(`② 쪽 수 — 전 방식 내용 ${전}쪽(전체 ${전점.length}) · 그림 ${A.쪽}쪽(같거나 꼬리만 넘친 쪽을 줄여 한 쪽 덜)`, 전 >= 1 && (A.쪽 === 전 || A.쪽 === 전 - 1), { 전점, 그림: A.쪽 })
    execFileSync('pdftoppm', ['-r', '40', '-png', 전파일, path.join(폴더, '신고_전')])
  }
  execFileSync('pdftoppm', ['-r', '40', '-png', 파일, path.join(폴더, `신고${꼬리}`)])
  {
    await p.evaluate(() => {
      window.__인쇄 = null
      window.print = () => { const 판 = document.getElementById('kcm-그림인쇄'); const 그림 = 판 ? [...판.querySelectorAll('img.kcm-쪽그림')] : []; window.__인쇄 = { 그림: 그림.length, 쪽: [...new Set(그림.map((im) => im.style.page))].join(','), 판쪽: 판 ? 판.style.page : '?', 크기: 그림[0] ? 그림[0].style.width + '×' + 그림[0].style.height : '', 다불림: 그림.every((im) => im.complete && im.naturalWidth > 1000), 몸: document.body.classList.contains('kcm-그림인쇄중'), 제목: document.title } }
    })
    await 단추(p, '🖨 인쇄').click()
    let 순간 = null
    for (let i = 0; i < 300 && !순간; i++) { await 쉬어(100); 순간 = await p.evaluate(() => window.__인쇄) }
    ok(`${앞}③ 🖨 인쇄 → 몸 밑엔 쪽 그림만 ${순간 ? 순간.그림 : '?'}장(${순간 ? 순간.크기 : ''} · 기본 쪽 · 다 불러옴)`, !!순간 && 순간.그림 === A.쪽 && 순간.쪽 === '' && 순간.판쪽 === '' && 순간.크기 === '186mm×271mm' && 순간.다불림 && 순간.몸 && 순간.제목 + '.pdf' === 이름, 순간)
    if (순간) {
      const 인쇄파일 = path.join(폴더, `신고_인쇄${꼬리}.pdf`)
      fs.writeFileSync(인쇄파일, await p.pdf({ preferCSSPageSize: true, printBackground: true }))
      const B = PDF보기(인쇄파일)
      ok(`${앞}③ 인쇄 창 «PDF로 저장» 과 같은 PDF — ${B.쪽}쪽(빈 쪽 없음) · 세로 · 글꼴 0 · 글자 0`, B.쪽 === A.쪽 && B.크기[1] > B.크기[0] && B.글꼴 === 0 && B.글자 === '', B)
      await p.evaluate(() => window.dispatchEvent(new Event('afterprint')))
      await 쉬어(300)
      ok(`${앞}③ 인쇄 창을 닫으면 다 걷힘`, await p.evaluate(() => !document.getElementById('kcm-그림인쇄') && !document.body.classList.contains('kcm-그림인쇄중') && !/^신고정리_/.test(document.title)))
    }
  }
  if (!폰) {
    const [dx] = await Promise.all([p.waitForEvent('download', { timeout: 40000 }), 단추(p, '📗 엑셀 받기').click()])
    const 엑셀 = path.join(폴더, '신고_엑셀.xlsx')
    await dx.saveAs(엑셀)
    const 엑셀이름 = await p.evaluate(() => (window.__받은이름 || []).slice(-1)[0] || '')
    ok(`⑤ 📗 엑셀 받기 그대로 받아짐 «${엑셀이름}»`, fs.readFileSync(엑셀).subarray(0, 2).toString('latin1') === 'PK' && /\.xlsx$/.test(엑셀이름), 엑셀이름)
    const 바로 = path.join(폴더, '바로인쇄.pdf')
    fs.writeFileSync(바로, await p.pdf({ preferCSSPageSize: true }))
    const 바글 = execFileSync('pdftotext', [바로, '-']).toString().replace(/\s+/g, ' ')
    ok('④ 단추 없이 Ctrl+P → «신고 정리는 화면의 … 단추로 인쇄해 주세요» 안내 · 신고 정리 글 안 나감', /신고 정리는 화면의/.test(바글) && /단추로 인쇄해 주세요/.test(바글) && !/가나지구 배수로/.test(바글) && !/근로일수/.test(바글), 바글.slice(0, 300))
  } else {
    const 줄 = await p.evaluate(() => { const r = [...document.querySelectorAll('.sg .hm-out .btn-row button')].map((x) => x.getBoundingClientRect()); return { 오른쪽: Math.round(Math.max(...r.map((x) => x.right))), 화면: innerWidth } })
    ok(`${앞}⑦ 폰 단추 줄 화면 안(${줄.오른쪽} ≤ ${줄.화면})`, 줄.오른쪽 <= 줄.화면, 줄)
  }
  if (!폰) {
    const q = await ctx.newPage()
    await q.route((u) => /html2canvas|그림인쇄\./.test(decodeURIComponent(u.toString())), (r) => r.fulfill({ status: 404, body: 'not found' }))
    await 열기(q)
    await 단추(q, '📄 PDF 저장').click()
    let 말4 = ''
    for (let i = 0; i < 50 && !/새로/.test(말4); i++) { await 쉬어(100); 말4 = await 말읽기(q) }
    ok('⑥ 찍는 도구 파일이 없어진 때(404) → «새로고침(↻) 뒤 다시 · 쓴 것은 그대로» 알림 · 몸 꼴 없음', /사이트가 새로 바뀌었습니다 — 화면을 새로고침\(↻\)한 뒤 다시 눌러 주세요\(쓴 것은 그대로 남습니다\)/.test(말4) && (await q.evaluate(() => !document.body.classList.contains('hm-print'))), 말4)
    await q.close()
  }
  ok(`⑦ ${기기} 넘침 0 · 오류 0`, (await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0 && 오류.length === 0, 오류)
  await ctx.close()
}
await b.close()
console.log(`\n${n}개 중 틀림 ${bad}` + (틀림.length ? '\n  ' + 틀림.join('\n  ') : ''))
process.exit(bad ? 1 : 0)
