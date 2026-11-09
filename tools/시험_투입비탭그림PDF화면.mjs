/**
 * 🖼 G592 현장 투입비(/tools/tuipbi → 🧪 예시 현장) 머리 «📄 PDF» · «🖨 인쇄» — 지금 탭을 그림으로(글자 층 없음) 화면 시험. 구운 사이트(dist)를 띄운 뒤:
 *   node tools/시험_투입비탭그림PDF화면.mjs [주소=http://127.0.0.1:4578]        (OUT=/tmp/g10/g592)
 *   소장님 11-08 «엑셀은 그대로 · PDF 는 모두 그림» — 전엔 머리 «🖨 인쇄» = window.print(지금 탭 · 글자 PDF).
 *   이제 .wrap.tp 를 복제본에서 인쇄 CSS 로 펴서 찍음 — A4 세로 기본 @page(글자 칸 186 × 271mm). 📝 공사일보 · 🧾 청구서 탭은 그 탭 단추로(머리 단추 숨김).
 *   ① 탭마다(한눈에 · 적기 · 명부 · 기성 · 적은 것 · 업체 입력 · 쓰는 방법) «📄 PDF» → 바로 받음 · PDF 1.4 · 글꼴 0 · 글자 0 · 그림 = 쪽 · A4 세로 · 쪽마다 내용 ·
 *      이름 «현장투입비_탭_현장_날짜.pdf» · 알림 ② 쪽 수 = 같은 화면(.wrap.tp)을 브라우저로 인쇄(전 방식 · 글자)한 내용 쪽과 같거나 한 쪽 덜
 *   ③ «🖨 인쇄»(한눈에) → 인쇄 순간 몸 밑엔 쪽 그림만(186 × 271mm) → 같은 PDF · 닫으면 걷힘 ④ 📝 공사일보 · 🧾 청구서 탭엔 머리 단추 없음
 *   ⑤ 단추 없이 Ctrl+P → 현장 화면은 안 찍히고 «단추로 인쇄» 안내 ⑥ 📗 엑셀 칩 그대로 ⑦ 404 ⑧ 폰 390 · PC 1280 넘침 0 · 오류 0 · 폰 칩 줄 화면 안
 *   인터넷 안 부름 · 가상 예시 현장만 씀(저장되지 않는 예시).
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const BASE = process.argv[2] || 'http://127.0.0.1:4578'
const 폴더 = process.env.OUT || '/tmp/g10/g592'
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
    /* 🩹 G612 흰 종이(255)가 아니면 셈(다른 그림 PDF 시험과 같게) — 긴 판 나눠 찍기로 PC 배율이 2 그대로가 되자 가는 줄이 30dpi 에서 옅어져
       «📜 적은 것» 꼬리 쪽(머리줄 + 두 줄)이 검은 점(<128) 0.02% 로 걸렸음(내용은 같음 · 전 0.03%) */
    for (let k = i; k < buf.length; k++) if (buf[k] < 230) 검++
    return Math.round((검 / (buf.length - i)) * 10000) / 100
  })
}
const 탭들 = [['📊 한눈에', '한눈에'], ['✍️ 적기', '적기'], ['👷 명부', '명부'], ['📈 기성·공정률', '기성공정률'], ['📜 적은 것', '적은것'], ['📥 업체 입력', '업체입력'], ['❓ 쓰는 방법', '쓰는방법']]

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
    await q.goto(BASE + '/tools/tuipbi', { waitUntil: 'domcontentloaded' })
    await q.waitForSelector('button', { timeout: 20000 })
    await 쉬어(800)
    await q.locator('button', { hasText: '예시 현장 보기' }).first().click()
    await 쉬어(1300)
  }
  const 탭가기 = async (q, 글) => { await q.locator('.tp-tab', { hasText: 글 }).first().click(); await 쉬어(900) }
  const 칩 = (q, 글) => q.locator('.tp-acts button', { hasText: 글 })
  /* 전 방식 — 지금 .wrap.tp 를 따로 붙이고 다른 것은 숨겨 브라우저 인쇄(그림만인쇄 가드는 끔) → 내용 있는 쪽 */
  const 전방식 = async (이름) => {
    await p.evaluate(() => {
      const 판 = document.createElement('div'); 판.id = '시험전판'; 판.innerHTML = document.querySelector('.wrap.tp').outerHTML
      const st = document.createElement('style'); st.id = '시험전꼴'; st.textContent = '@media print { body > *:not(#시험전판) { display: none !important; } }'
      document.head.appendChild(st); document.body.appendChild(판); document.body.classList.add('kcm-찍는중')
    })
    const 파일 = path.join(폴더, 이름)
    fs.writeFileSync(파일, await p.pdf({ preferCSSPageSize: true, printBackground: true }))
    await p.evaluate(() => { document.getElementById('시험전판').remove(); document.getElementById('시험전꼴').remove(); document.body.classList.remove('kcm-찍는중') })
    const 점 = 검은점들(파일, path.join(폴더, '전점_' + 이름))
    return { 내용: 점.filter((x) => x > 0.02).length, 전체: 점.length }
  }
  await 열기(p)
  const 고른탭 = 폰 ? 탭들.filter(([, k]) => k === '한눈에' || k === '명부') : 탭들
  for (const [글, 이름머리] of 고른탭) {
    await 탭가기(p, 글)
    const t0 = Date.now()
    const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 60000 }), 칩(p, '📄 PDF').first().click()])
    const 파일 = path.join(폴더, `탭_${이름머리}${꼬리}.pdf`)
    await dl.saveAs(파일)
    await 쉬어(400)
    const 이름 = await p.evaluate(() => (window.__받은이름 || []).slice(-1)[0] || '')
    const 말 = await p.evaluate(() => [...document.querySelectorAll('.tp-sitehead [role=status]')].map((x) => x.innerText).join(' | '))
    const A = PDF보기(파일)
    const 점 = 검은점들(파일, path.join(폴더, `점_${이름머리}${꼬리}`))
    ok(`${앞}${글} ① 📄 PDF → 바로 받음 · PDF 1.4 · 글꼴 0 · 글자 0 · 그림 ${A.그림수} = ${A.쪽}쪽 · 세로 A4 · 쪽마다 검은 점 ${점.join(' · ')}% · ${A.KB}KB · ${((Date.now() - t0) / 1000).toFixed(1)}초`,
      A.머리.startsWith('%PDF-1.4') && A.쪽 >= 1 && A.글꼴 === 0 && A.글자 === '' && A.그림수 >= A.쪽 && Math.abs(A.크기[0] - 595.28) < 1 && Math.abs(A.크기[1] - 841.89) < 1 && 점.length === A.쪽 && 점.every((x) => x > 0.02), { ...A, 점 })
    ok(`${앞}${글} ① 이름 «${이름}» · 알림 «PDF ${A.쪽}쪽» 현장 머리 곁`, new RegExp(`^현장투입비_${이름머리}_.+_\\d{4}-\\d{2}-\\d{2}\\.pdf$`).test(이름) && new RegExp(`PDF ${A.쪽}쪽을 만들었습니다`).test(말), [이름, 말])
    if (!폰) {
      const 전 = await 전방식(`탭_${이름머리}_전글자.pdf`)
      ok(`${글} ② 쪽 수 — 전 방식 내용 ${전.내용}쪽(전체 ${전.전체}) · 그림 ${A.쪽}쪽(같거나 꼬리만 넘친 쪽을 줄여 한 쪽 덜)`, 전.내용 >= 1 && (A.쪽 === 전.내용 || A.쪽 === 전.내용 - 1), { 전, 그림: A.쪽 })
    }
    execFileSync('pdftoppm', ['-r', '40', '-png', '-f', '1', '-l', '1', 파일, path.join(폴더, `탭_${이름머리}${꼬리}`)])
  }
  /* ③ 인쇄 — 한눈에 */
  {
    await 탭가기(p, '📊 한눈에')
    await p.evaluate(() => {
      window.__인쇄 = null
      window.print = () => { const 판 = document.getElementById('kcm-그림인쇄'); const 그림 = 판 ? [...판.querySelectorAll('img.kcm-쪽그림')] : []; window.__인쇄 = { 그림: 그림.length, 쪽: [...new Set(그림.map((im) => im.style.page))].join(','), 판쪽: 판 ? 판.style.page : '?', 크기: 그림[0] ? 그림[0].style.width + '×' + 그림[0].style.height : '', 다불림: 그림.every((im) => im.complete && im.naturalWidth > 1000), 몸: document.body.classList.contains('kcm-그림인쇄중') } }
    })
    await 칩(p, '🖨 인쇄').first().click()
    let 순간 = null
    for (let i = 0; i < 300 && !순간; i++) { await 쉬어(100); 순간 = await p.evaluate(() => window.__인쇄) }
    ok(`${앞}③ 🖨 인쇄(한눈에) → 몸 밑엔 쪽 그림만 ${순간 ? 순간.그림 : '?'}장(${순간 ? 순간.크기 : ''} · 기본 쪽 · 다 불러옴)`, !!순간 && 순간.그림 >= 1 && 순간.쪽 === '' && 순간.판쪽 === '' && 순간.크기 === '186mm×271mm' && 순간.다불림 && 순간.몸, 순간)
    if (순간) {
      const 인쇄파일 = path.join(폴더, `탭_인쇄${꼬리}.pdf`)
      fs.writeFileSync(인쇄파일, await p.pdf({ preferCSSPageSize: true, printBackground: true }))
      const B = PDF보기(인쇄파일)
      ok(`${앞}③ 인쇄 창 «PDF로 저장» 과 같은 PDF — ${B.쪽}쪽(빈 쪽 없음) · 세로 · 글꼴 0 · 글자 0`, B.쪽 === 순간.그림 && B.크기[1] > B.크기[0] && B.글꼴 === 0 && B.글자 === '', B)
      await p.evaluate(() => window.dispatchEvent(new Event('afterprint')))
      await 쉬어(300)
      ok(`${앞}③ 인쇄 창을 닫으면 다 걷힘`, await p.evaluate(() => !document.getElementById('kcm-그림인쇄') && !document.body.classList.contains('kcm-그림인쇄중')))
    }
  }
  /* ④ 공사일보 · 청구서 탭 — 머리 단추 없음(그 탭 안 단추로) */
  for (const 글 of ['📝 공사일보', '🧾 달마다 청구서']) {
    await 탭가기(p, 글)
    const 수 = await 칩(p, '📄 PDF').count() + await 칩(p, '🖨 인쇄').count()
    const 안단추 = await p.locator('button', { hasText: '📄' }).count()
    ok(`${앞}④ ${글} 탭 — 머리 📄 PDF · 🖨 인쇄 없음(그 탭 안 단추 ${안단추}개)`, 수 === 0 && 안단추 >= 1, { 수, 안단추 })
  }
  await 탭가기(p, '📊 한눈에')
  if (!폰) {
    ok('⑥ 📗 엑셀 칩 그대로', (await 칩(p, '📗 엑셀').count()) === 1)
    const 바로 = path.join(폴더, '바로인쇄.pdf')
    fs.writeFileSync(바로, await p.pdf({ preferCSSPageSize: true }))
    const 바글 = execFileSync('pdftotext', [바로, '-']).toString().replace(/\s+/g, ' ')
    ok('⑤ 단추 없이 Ctrl+P → «현장 투입비는 화면의 … 단추로 인쇄해 주세요» 안내 · 현장 화면 글 안 나감', /현장 투입비는 화면의/.test(바글) && /단추로 인쇄해 주세요/.test(바글) && !/근린생활시설/.test(바글) && !/총공사금액/.test(바글), 바글.slice(0, 300))
  } else {
    const 줄 = await p.evaluate(() => { const r = [...document.querySelectorAll('.tp-acts button')].map((x) => x.getBoundingClientRect()); return { 오른쪽: Math.round(Math.max(...r.map((x) => x.right))), 화면: innerWidth } })
    ok(`${앞}⑧ 폰 머리 칩 줄 화면 안(${줄.오른쪽} ≤ ${줄.화면})`, 줄.오른쪽 <= 줄.화면, 줄)
  }
  /* ⑦ 404 */
  if (!폰) {
    const q = await ctx.newPage()
    await q.route((u) => /html2canvas|그림인쇄\./.test(decodeURIComponent(u.toString())), (r) => r.fulfill({ status: 404, body: 'not found' }))
    await 열기(q)
    await 칩(q, '📄 PDF').first().click()
    let 말 = ''
    for (let i = 0; i < 50 && !/새로/.test(말); i++) { await 쉬어(100); 말 = await q.evaluate(() => [...document.querySelectorAll('.tp-sitehead [role=status]')].map((x) => x.innerText).join(' | ')) }
    ok('⑦ 찍는 도구 파일이 없어진 때(404) → «새로고침(↻) 뒤 다시 · 쓴 것은 그대로» 알림', /사이트가 새로 바뀌었습니다 — 화면을 새로고침\(↻\)한 뒤 다시 눌러 주세요\(쓴 것은 그대로 남습니다\)/.test(말), 말)
    await q.close()
  }
  ok(`⑧ ${기기} 넘침 0 · 오류 0`, (await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0 && 오류.length === 0, 오류)
  await ctx.close()
}
await b.close()
console.log(`\n${n}개 중 틀림 ${bad}` + (틀림.length ? '\n  ' + 틀림.join('\n  ') : ''))
process.exit(bad ? 1 : 0)
