/**
 * 🖼 G588 일용직 4대보험 가입 판단기(/tools/ilyong-boheom) — 판단 결과 그림 PDF · 그림 인쇄(글자 층 없음) 화면 시험. 구운 사이트(dist)를 띄운 뒤:
 *   node tools/시험_일용그림PDF화면.mjs [주소=http://127.0.0.1:4578]        (OUT=/tmp/g10/g588)
 *   소장님 11-08 «엑셀은 그대로 · PDF 는 모두 그림» — tools/그림인쇄훅.js 넷째 도구(작업일보 · 공사일보 · 위험성평가 다음) · 쓴 횟수 1등 도구.
 *   인쇄 판(#gp-인쇄) 없이 화면의 판단 결과(.iy-out)를 그대로 찍음(대상) — 복제본에서만 인쇄 CSS(body.iy-print)로 펴고 접은 것을 폄(손질).
 *   예시 사례마다:
 *   ① «📄 PDF» → 바로 받음 · PDF 1.4 · 글꼴 0 · 뽑히는 글자 0 · 그림 = 쪽 · A4 세로 · 첫 쪽에 내용이 찍힘(검은 점) · 이름 «4대보험판단_…년-월.pdf» · 알림(단추 곁)
 *   ② 찍는 순간의 복제본 — 몸에 iy-print · kcm-찍는중 · 접은 것 모두 폄(사업주 몫은 화면 그대로 · as-is) · 접기 표시 «▸/▾» 글(«1.» 안 나옴)
 *      쪽 수 = 같은 화면을 브라우저로 인쇄(전 방식 · 글자)한 것과 같거나 한 쪽 덜 · 보는 화면은 그대로(접힘 · 몸 꼴)
 *   ③ «🖨 인쇄» → 인쇄 순간 몸 밑엔 쪽 그림만 → 그 모습 그대로 PDF 글꼴 0 · 글자 0 · 쪽 같음 · 빈 쪽 없음 · 닫으면 걷힘
 *   ④ 단추 없이 Ctrl+P → 판단 칸은 안 찍히고 «단추로 인쇄» 안내 ⑤ 📗 엑셀(받아짐) · 🔗 링크 보내기 그대로
 *   ⑥ 404 → «새로고침 뒤 다시» 알림 · 화면 그대로 ⑦ 폰 390 · PC 1280 넘침 0 · 오류 0 ⑧ 폰 결과 머리(제목이 세로로 서지 않음)
 *   ⑨ 같은 알림을 4초 안에 또 띄워도 둘째 알림이 4초 보임(lib/잠깐말.js — 첫 시험에서 찾은 사고)
 *   인터넷 안 부름 · 예시 사례(지어낸 날짜 · 금액)만 씀.
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const BASE = process.argv[2] || 'http://127.0.0.1:4578'
const 폴더 = process.env.OUT || '/tmp/g10/g588'
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
/* 첫 쪽의 검은 점 비율(%) — 흰 종이만 찍히는 사고 막기 */
function 검은점(파일, 머리) {
  execFileSync('pdftoppm', ['-r', '40', '-gray', '-f', '1', '-l', '1', 파일, 머리])
  const 그림파일 = fs.readdirSync(path.dirname(머리)).filter((f) => f.startsWith(path.basename(머리)) && f.endsWith('.pgm')).map((f) => path.join(path.dirname(머리), f))[0]
  const buf = fs.readFileSync(그림파일)
  fs.unlinkSync(그림파일)
  let i = 0, 줄 = 0
  while (줄 < 3) { if (buf[i] === 10) 줄++; i++ }   // P5 \n W H \n 255 \n
  let 검 = 0
  for (let k = i; k < buf.length; k++) if (buf[k] < 128) 검++
  return Math.round((검 / (buf.length - i)) * 10000) / 100
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
  const 판단기열기 = async (q) => {
    await q.goto(BASE + '/tools/ilyong-boheom', { waitUntil: 'domcontentloaded' })
    await q.waitForSelector('.iy-exd', { timeout: 20000 })
    await 쉬어(700)
  }
  const 사례넣기 = async (q, 글) => {
    await q.evaluate(() => { const d = document.querySelector('.iy-exd'); if (d) d.open = true })
    await q.locator('.iy-ex button', { hasText: 글 }).first().click()
    await 쉬어(900)
  }
  /* 찍는 순간의 복제본(html2canvas 가 몸 밑에 붙였다 떼는 iframe)을 엿봄 — 복제본 안 바뀜(onclone 손질)을 바로(마이크로태스크) 받아 마지막 모습만 남김
     (setInterval 로 엿보면 그리는 동안 틈이 없어 손질 전 모습만 보임 — 첫 시험에서 겪음) */
  const 복제엿보기 = (q) => q.evaluate(() => {
    window.__복제 = null
    if (window.__ob2) window.__ob2.disconnect()
    const 찍기 = (d) => {
      const 판 = d.querySelector('.iy-out')
      if (!판 || !d.body || !d.defaultView) return
      const ds = [...d.querySelectorAll('.iy-out details')]
      const 꼴 = (s) => d.defaultView.getComputedStyle(s)
      const 표 = [...d.querySelectorAll('.iy-out summary')]
      window.__복제 = {
        몸: d.body.className,
        접은것: ds.filter((x) => x.dataset.print !== 'as-is').map((x) => x.open),
        사업주: ds.filter((x) => x.dataset.print === 'as-is').map((x) => x.open),
        표시: 표.filter((s) => /^[▾▸]/.test((s.textContent || '').trim())).length,
        숫자표시: 표.filter((s) => 꼴(s).display === 'list-item' && /disclosure/.test(꼴(s).listStyleType)).length,
      }
    }
    const 보기 = (fr) => {
      let d = null
      try { d = fr.contentDocument } catch (e) { d = null }
      if (!d) return
      new MutationObserver(() => { try { 찍기(d) } catch (e) { /* 걷히는 중 */ } }).observe(d, { subtree: true, childList: true, attributes: true, characterData: true })
    }
    const ob = new MutationObserver((ms) => { for (const m of ms) for (const nd of m.addedNodes) if (nd.tagName === 'IFRAME') 보기(nd) })
    ob.observe(document.body, { childList: true })
    window.__ob2 = ob
  })
  const 화면꼴 = (q) => q.evaluate(() => ({
    접힘: [...document.querySelectorAll('.iy-out details')].map((x) => x.open).join(''),
    몸: ['iy-print', 'kcm-찍는중', 'kcm-그림인쇄중'].filter((c) => document.body.classList.contains(c)).join(','),
    판: !!document.getElementById('kcm-그림인쇄'),
  }))
  /* 전 방식 — 옛 «🖨 인쇄» 그대로(접은 것 펴고 몸에 iy-print) 브라우저로 인쇄한 쪽 수 · 끝나면 화면 되돌림 */
  const 전방식 = async (이름) => {
    const 파일 = path.join(폴더, 이름)
    await p.evaluate(() => { const ds = [...document.querySelectorAll('.iy-out details')].filter((d) => d.dataset.print !== 'as-is'); window.__전열림 = ds.map((d) => d.open); ds.forEach((d) => { d.open = true }); document.body.classList.add('iy-print', 'kcm-찍는중') })
    fs.writeFileSync(파일, await p.pdf({ preferCSSPageSize: true, printBackground: true }))
    await p.evaluate(() => { const ds = [...document.querySelectorAll('.iy-out details')].filter((d) => d.dataset.print !== 'as-is'); ds.forEach((d, i) => { d.open = window.__전열림[i] }); document.body.classList.remove('iy-print', 'kcm-찍는중') })
    return 쪽수(파일)
  }
  await 판단기열기(p)
  const 사례들 = 폰 ? [['two-months', '두 달에 걸쳐']] : [['two-months', '두 달에 걸쳐'], ['steady', '석 달 동안'], ['company-sum', '같은 회사 다른 현장까지'], ['age-60', '만 60세가 될 때']]
  for (const [k, 글] of 사례들) {
    await 사례넣기(p, 글)
    const 사업주로 = k === 'steady' && !폰   /* 사업주 몫(as-is) — 연 때만 찍힘 */
    if (사업주로) { await p.locator('.iy-out details[data-print="as-is"] > summary').first().click(); await 쉬어(500) }
    const 전꼴 = await 화면꼴(p)
    await 복제엿보기(p)
    const t0 = Date.now()
    const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 40000 }), p.locator('.iy-act button', { hasText: '📄 PDF' }).click()])
    const 파일 = path.join(폴더, `일용_${k}${꼬리}.pdf`)
    await dl.saveAs(파일)
    await 쉬어(300)
    const 이름 = await p.evaluate(() => (window.__받은이름 || []).slice(-1)[0] || '')
    const 말 = await p.evaluate(() => [...document.querySelectorAll('.iy-out [role=status]')].map((x) => x.innerText).join(' | '))
    const A = PDF보기(파일)
    const 점 = 검은점(파일, path.join(폴더, `점_${k}${꼬리}`))
    ok(`${k}${폰 ? '(폰)' : ''} ① 📄 PDF → 바로 받음 · PDF 1.4 · 글꼴 0 · 글자 0 · 그림 ${A.그림수} = ${A.쪽}쪽 · 세로 A4 · 검은 점 ${점}% · ${A.KB}KB · ${((Date.now() - t0) / 1000).toFixed(1)}초`,
      A.머리.startsWith('%PDF-1.4') && A.쪽 >= 1 && A.글꼴 === 0 && A.글자 === '' && A.그림수 >= A.쪽 && Math.abs(A.크기[0] - 595.28) < 1 && Math.abs(A.크기[1] - 841.89) < 1 && 점 > 0.5, { ...A, 점 })
    const 자리 = await p.evaluate(() => { const s = [...document.querySelectorAll('.iy-out [role=status]')].find((x) => /PDF \d+쪽을 만들었습니다/.test(x.innerText)); return !!s && !!s.previousElementSibling && !!s.previousElementSibling.querySelector('.iy-act') })
    ok(`${k}${폰 ? '(폰)' : ''} ① 이름 «${이름}» · 알림 «PDF ${A.쪽}쪽» 단추 바로 밑`, /^4대보험판단(_[^_]+)?_\d{4}-\d{2}\.pdf$/.test(이름) && new RegExp(`PDF ${A.쪽}쪽을 만들었습니다`).test(말) && 자리, [이름, 말, 자리])
    const 복 = await p.evaluate(() => window.__복제)
    const 뒤꼴 = await 화면꼴(p)
    ok(`${k}${폰 ? '(폰)' : ''} ② 찍는 복제본 — 몸 «${복 ? 복.몸 : '?'}» · 접은 것 ${복 ? 복.접은것.length : '?'}개 모두 폄 · 사업주 몫 ${사업주로 ? '폄(연 때)' : '화면 그대로'} · 접기 표시 글 ${복 ? 복.표시 : '?'}개 · «1.» 꼴 표시 ${복 ? 복.숫자표시 : '?'}개`,
      !!복 && /\biy-print\b/.test(복.몸) && /kcm-찍는중/.test(복.몸) && 복.접은것.length >= 1 && 복.접은것.every(Boolean) && 복.사업주.every((o) => o === 사업주로) && 복.숫자표시 === 0, 복)
    ok(`${k}${폰 ? '(폰)' : ''} ② 보는 화면은 그대로 — 접힘 «${뒤꼴.접힘}» · 몸 꼴 없음 · 판 없음`, 뒤꼴.접힘 === 전꼴.접힘 && 뒤꼴.몸 === '' && !뒤꼴.판, { 전꼴, 뒤꼴 })
    const 전 = await 전방식(`일용_${k}${꼬리}_전글자.pdf`)
    ok(`${k}${폰 ? '(폰)' : ''} ② 쪽 수 — 전 방식 ${전}쪽 · 그림 ${A.쪽}쪽(같거나 꼬리만 넘친 쪽을 줄여 한 쪽 덜)`, 전 >= 1 && (A.쪽 === 전 || A.쪽 === 전 - 1), { 전, 그림: A.쪽 })
    execFileSync('pdftoppm', ['-r', '55', '-png', 파일, path.join(폴더, `일용_${k}${꼬리}`)])
    if (k === 'two-months' || k === 'age-60') {
      await p.evaluate(() => {
        window.__인쇄 = null
        window.print = () => { const 판 = document.getElementById('kcm-그림인쇄'); const 그림 = 판 ? [...판.querySelectorAll('img.kcm-쪽그림')] : []; window.__인쇄 = { 그림: 그림.length, 쪽: [...new Set(그림.map((im) => im.style.page))].join(','), 판쪽: 판 ? 판.style.page : '?', 크기: 그림[0] ? 그림[0].style.width + '×' + 그림[0].style.height : '', 다불림: 그림.every((im) => im.complete && im.naturalWidth > 1000), 몸: document.body.classList.contains('kcm-그림인쇄중'), 제목: document.title } }
      })
      await p.locator('.iy-act button', { hasText: '🖨 인쇄' }).click()
      let 순간 = null
      for (let i = 0; i < 200 && !순간; i++) { await 쉬어(100); 순간 = await p.evaluate(() => window.__인쇄) }
      ok(`${k}${폰 ? '(폰)' : ''} ③ 🖨 인쇄 → 몸 밑엔 쪽 그림만 ${순간 ? 순간.그림 : '?'}장(${순간 ? 순간.크기 : ''} · 기본 쪽 · 다 불러옴 · 제목 «${순간 ? 순간.제목 : ''}»)`, !!순간 && 순간.그림 === A.쪽 && 순간.쪽 === '' && 순간.판쪽 === '' && 순간.크기 === '186mm×271mm' && 순간.다불림 && 순간.몸 && 순간.제목 + '.pdf' === 이름, 순간)
      if (순간) {
        const 인쇄파일 = path.join(폴더, `일용_${k}${꼬리}_인쇄.pdf`)
        fs.writeFileSync(인쇄파일, await p.pdf({ preferCSSPageSize: true, printBackground: true }))
        const B = PDF보기(인쇄파일)
        ok(`${k}${폰 ? '(폰)' : ''} ③ 인쇄 창 «PDF로 저장» 과 같은 PDF — ${B.쪽}쪽(빈 쪽 없음) · 세로 · 글꼴 0 · 글자 0`, B.쪽 === A.쪽 && B.크기[1] > B.크기[0] && B.글꼴 === 0 && B.글자 === '', B)
        await p.evaluate(() => window.dispatchEvent(new Event('afterprint')))
        await 쉬어(300)
        const 걷 = await 화면꼴(p)
        ok(`${k}${폰 ? '(폰)' : ''} ③ 인쇄 창을 닫으면 다 걷힘(화면 그대로)`, !걷.판 && 걷.몸 === '' && 걷.접힘 === 전꼴.접힘 && (await p.evaluate(() => !/^4대보험판단/.test(document.title))), 걷)
      }
    }
    if (k === 'two-months' && !폰) {
      /* ⑤ 엑셀 · 링크 그대로 · ④ Ctrl+P */
      const [dx] = await Promise.all([p.waitForEvent('download', { timeout: 40000 }), p.locator('.iy-act button', { hasText: '📗 엑셀' }).click()])
      const 엑셀 = path.join(폴더, '일용_엑셀.xlsx')
      await dx.saveAs(엑셀)
      const 엑셀이름 = await p.evaluate(() => (window.__받은이름 || []).slice(-1)[0] || '')
      ok(`⑤ 📗 엑셀 그대로 받아짐 «${엑셀이름}» · 🔗 링크 보내기 그대로`, fs.readFileSync(엑셀).subarray(0, 2).toString('latin1') === 'PK' && /\.xlsx$/.test(엑셀이름) && (await p.locator('.iy-act button', { hasText: '🔗 링크 보내기' }).count()) === 1, 엑셀이름)
      const 바로 = path.join(폴더, '바로인쇄.pdf')
      fs.writeFileSync(바로, await p.pdf({ preferCSSPageSize: true }))
      const 바글 = execFileSync('pdftotext', [바로, '-']).toString().replace(/\s+/g, ' ')
      ok('④ 단추 없이 Ctrl+P → «판단 결과는 화면의 … 단추로 인쇄해 주세요» 안내 · 판단 칸 · 입력 칸 글 안 나감', /판단 결과는 화면의/.test(바글) && /단추로 인쇄해 주세요/.test(바글) && !/실지급/.test(바글) && !/예시로 해 보기/.test(바글) && !/두 달에 걸쳐/.test(바글), 바글.slice(0, 300))
    }
    if (폰) {
      /* ⑧ 폰 결과 머리 — 단추 넷이 늘어도 «✅ 판단 결과» 가 세로로 서지 않음(G587 위험성평가에서 찾은 사고 · 재발 막기) */
      const 머리 = await p.evaluate(() => { const g = document.querySelector('.iy-out .detail-h'); const r = g.getBoundingClientRect(); const a = document.querySelector('.iy-act').getBoundingClientRect(); return { 폭: Math.round(r.width), 높: Math.round(r.height), 단추오른쪽: Math.round(a.right), 화면: innerWidth } })
      ok(`⑧ 폰 결과 머리 — «✅ 판단 결과» 폭 ${머리.폭}px · 높이 ${머리.높}px(한 줄) · 단추 줄 화면 안(${머리.단추오른쪽} ≤ ${머리.화면})`, 머리.폭 >= 50 && 머리.높 <= 30 && 머리.단추오른쪽 <= 머리.화면, 머리)
    }
  }
  /* ⑥ 404 */
  if (!폰) {
    const q = await ctx.newPage()
    await q.route((u) => /html2canvas|그림인쇄\./.test(decodeURIComponent(u.toString())), (r) => r.fulfill({ status: 404, body: 'not found' }))
    await 판단기열기(q)
    await 사례넣기(q, '두 달에 걸쳐')
    const 전꼴 = await 화면꼴(q)
    await q.locator('.iy-act button', { hasText: '📄 PDF' }).click()
    let 말 = ''
    for (let i = 0; i < 40 && !/새로/.test(말); i++) { await 쉬어(100); 말 = await q.evaluate(() => [...document.querySelectorAll('.iy-out [role=status]')].map((x) => x.innerText).join(' | ')) }
    const 뒤꼴 = await 화면꼴(q)
    ok('⑥ 찍는 도구 파일이 없어진 때(404) → «새로고침(↻) 뒤 다시 · 쓴 것은 그대로» 알림 · 화면 그대로', /사이트가 새로 바뀌었습니다 — 화면을 새로고침\(↻\)한 뒤 다시 눌러 주세요\(쓴 것은 그대로 남습니다\)/.test(말) && 뒤꼴.접힘 === 전꼴.접힘 && 뒤꼴.몸 === '' && (await q.locator('.iy-act button', { hasText: '📄 PDF' }).isEnabled()), 말)
    await q.close()
  }
  /* ⑨ 같은 알림을 4초 안에 또 — 둘째 알림도 4초 보임(전: 말이 안 바뀌어 앞 시계가 둘째 알림을 곧바로 지움 · 첫 시험에서 찾음 → lib/잠깐말.js) */
  if (!폰) {
    await 사례넣기(p, '두 달에 걸쳐')
    const 말읽기 = () => p.evaluate(() => [...document.querySelectorAll('.iy-out [role=status]')].map((x) => x.innerText).join(' | '))
    await Promise.all([p.waitForEvent('download', { timeout: 40000 }), p.locator('.iy-act button', { hasText: '📄 PDF' }).click()])
    const t1 = Date.now()
    await 쉬어(1500)
    await Promise.all([p.waitForEvent('download', { timeout: 40000 }), p.locator('.iy-act button', { hasText: '📄 PDF' }).click()])
    const t2 = Date.now()
    await 쉬어(Math.max(0, t1 + 4600 - Date.now()))
    const 말1 = await 말읽기()
    ok(`⑨ 📄 PDF 를 ${((t2 - t1) / 1000).toFixed(1)}초 사이 두 번 → 첫 알림 4.6초 뒤에도 둘째 알림 보임(둘째부터 4초를 새로 셈)`, /PDF 2쪽을 만들었습니다/.test(말1), 말1)
    await 쉬어(Math.max(0, t2 + 4500 - Date.now()))
    const 말2 = await 말읽기()
    ok('⑨ 둘째 알림도 4초 뒤엔 걷힘', 말2 === '', 말2)
  }
  ok(`⑦ ${기기} 넘침 0 · 오류 0`, (await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0 && 오류.length === 0, 오류)
  await ctx.close()
}
await b.close()
console.log(`\n${n}개 중 틀림 ${bad}` + (틀림.length ? '\n  ' + 틀림.join('\n  ') : ''))
process.exit(bad ? 1 : 0)
