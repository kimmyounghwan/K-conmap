/**
 * 🖼 G591 현장 투입비 · 🧾 달마다 청구서(/tools/tuipbi → 🧪 예시 현장 → 🧾 달마다 청구서) — 그림 PDF · 그림 인쇄(글자 층 없음) 화면 시험. 구운 사이트(dist)를 띄운 뒤:
 *   node tools/시험_투입비청구서그림PDF화면.mjs [주소=http://127.0.0.1:4578]        (OUT=/tmp/g10/g591)
 *   소장님 11-08 «엑셀은 그대로 · PDF 는 모두 그림» — 청구서 넷(이 달 모두 · 업체별 한 장씩 · 근로자별 명세서 한 장씩 · 이 화면) × 📄 PDF · 🖨 인쇄.
 *   고른 판을 잠깐 펼쳐 복제본에서만 인쇄 CSS(body.tp-print-bill)로 찍고 곧바로 걷음 — A4 가로 @page tp-land 10mm(글자 칸 277 × 190mm) · 판마다 새 쪽(.tp-pb).
 *   ① 판마다 «📄 PDF» → 바로 받음 · PDF 1.4 · 글꼴 0 · 뽑히는 글자 0 · 그림 = 쪽 · A4 가로 · 쪽마다 내용 · 이름 «판이름_현장_년-월.pdf» · 알림
 *   ② 쪽 수 = 같은 판을 전 방식(몸에 tp-print-bill · 브라우저 인쇄 · 글자)으로 찍은 것 중 내용 있는 쪽 — 이 달 모두 3 · 업체별 = 장비 업체 + 자재 · 근로자별 = 사람 수
 *      · 찍은 뒤 판 걷힘(화면은 «이 화면» 청구서 하나로 돌아옴 · 몸 꼴 없음)
 *   ③ «🖨 인쇄»(이 달 모두) → 인쇄 순간 몸 밑엔 쪽 그림만(tp-land · 277 × 190mm) → 그 모습 그대로 PDF 글꼴 0 · 글자 0 · 쪽 같음 · 닫으면 걷힘
 *   ④ 단추 없이 Ctrl+P → 청구서 판은 안 찍히고 «단추로 인쇄» 안내 ⑤ 📗 이 달 청구서 엑셀 · 달별 누계 엑셀 단추 그대로
 *   ⑥ 404 → «새로고침 뒤 다시» 알림 · 판 걷힘 ⑦ 폰 390 · PC 1280 넘침 0 · 오류 0 · 폰 단추 줄 화면 안
 *   인터넷 안 부름 · 가상 예시 현장만 씀(저장되지 않는 예시).
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const BASE = process.argv[2] || 'http://127.0.0.1:4578'
const 폴더 = process.env.OUT || '/tmp/g10/g591'
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
    for (let k = i; k < buf.length; k++) if (buf[k] < 128) 검++
    return Math.round((검 / (buf.length - i)) * 10000) / 100
  })
}
const 판들 = [['all', '🧾 이 달 청구서 모두', '투입비청구서'], ['vendor', '🏢 업체별 한 장씩', '업체별청구서'], ['worker', '👷 근로자별 명세서 한 장씩', '근로자별명세서'], ['', '👀 이 화면', '노무비청구내역서']]

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
    await 쉬어(1200)
    await q.locator('button', { hasText: '🧾 달마다 청구서' }).first().click()
    await 쉬어(900)
    /* 예시 현장에서 장비 · 자재 · 출역이 다 있는 달로(업체별 · 근로자별 단추가 켜지는 달) */
    const 달들 = await q.locator('.tp-lh select option').evaluateAll((os) => os.map((o) => o.value))
    for (const 달 of 달들) {
      await q.locator('.tp-lh select').first().selectOption(달)
      await 쉬어(300)
      const 켜짐 = await q.evaluate(() => [...document.querySelectorAll('.tp-찍기줄')].every((x) => [...x.querySelectorAll('button')].every((b) => !b.disabled)))
      if (켜짐) break
    }
    await 쉬어(400)
  }
  const 줄단추 = (q, 글, 단) => q.locator('.tp-찍기줄', { hasText: 글 }).locator('button', { hasText: 단 }).first()
  const 말읽기 = (q) => q.evaluate(() => [...document.querySelectorAll('.tp-찍기 ~ [role=status], .card [role=status]')].map((x) => x.innerText).join(' | '))
  /* 판이 펼쳐진 순간의 모습(전 방식 견줌용) — .tp-찍을판 안 카드가 둘 넘거나 첫 카드가 달라지면 */
  const 판엿보기 = (q) => q.evaluate(() => {
    window.__판 = null
    const 처음 = document.querySelector('.tp-찍을판') ? document.querySelector('.tp-찍을판').innerHTML : ''
    if (window.__ob) window.__ob.disconnect()
    const ob = new MutationObserver(() => { const el = document.querySelector('.tp-찍을판'); if (el && !window.__판 && el.innerHTML !== 처음) window.__판 = el.innerHTML })
    ob.observe(document.body, { childList: true, subtree: true })
    window.__ob = ob
    window.__처음판 = 처음
  })
  /* 전 방식 — 그 판을 따로 붙이고(.wrap.tp 안) 몸에 tp-print-bill · 다른 것은 숨겨 브라우저 인쇄 → 내용 있는 쪽 */
  const 전방식 = async (q, 이름, html) => {
    await q.evaluate((hh) => {
      const 판 = document.createElement('div'); 판.id = '시험전판'; 판.className = 'wrap tp'; 판.innerHTML = hh
      const st = document.createElement('style'); st.id = '시험전꼴'; st.textContent = '@media print { body > *:not(#시험전판) { display: none !important; } }'
      document.head.appendChild(st); document.body.appendChild(판); document.body.classList.add('tp-print-bill', 'kcm-찍는중')
    }, html)
    const 파일 = path.join(폴더, 이름)
    fs.writeFileSync(파일, await q.pdf({ preferCSSPageSize: true, printBackground: true }))
    await q.evaluate(() => { document.getElementById('시험전판').remove(); document.getElementById('시험전꼴').remove(); document.body.classList.remove('tp-print-bill', 'kcm-찍는중') })
    const 점 = 검은점들(파일, path.join(폴더, '전점_' + 이름))
    return { 내용: 점.filter((x) => x > 0.02).length, 전체: 점.length }
  }
  await 열기(p)
  const 셈 = await p.evaluate(() => ({ 판카드: document.querySelectorAll('.tp-찍을판 > .card.tp-bill').length }))
  const 고른판 = 폰 ? 판들.filter(([k]) => k === 'all' || k === '') : 판들
  for (const [k, 글, 이름머리] of 고른판) {
    const 꼬 = (k || '화면') + 꼬리
    await 판엿보기(p)
    const t0 = Date.now()
    const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 60000 }), 줄단추(p, 글, '📄 PDF').click()])
    const 파일 = path.join(폴더, `청구_${꼬}.pdf`)
    await dl.saveAs(파일)
    await 쉬어(400)
    const 이름 = await p.evaluate(() => (window.__받은이름 || []).slice(-1)[0] || '')
    const 말 = await p.evaluate(() => [...document.querySelectorAll('[role=status]')].map((x) => x.innerText).join(' | '))
    const A = PDF보기(파일)
    const 점 = 검은점들(파일, path.join(폴더, `점_${꼬}`))
    ok(`${앞}${글} ① 📄 PDF → 바로 받음 · PDF 1.4 · 글꼴 0 · 글자 0 · 그림 ${A.그림수} = ${A.쪽}쪽 · 가로 A4 · 쪽마다 검은 점 ${점.join(' · ')}% · ${A.KB}KB · ${((Date.now() - t0) / 1000).toFixed(1)}초`,
      A.머리.startsWith('%PDF-1.4') && A.쪽 >= 1 && A.글꼴 === 0 && A.글자 === '' && A.그림수 >= A.쪽 && Math.abs(A.크기[0] - 841.89) < 1 && Math.abs(A.크기[1] - 595.28) < 1 && 점.length === A.쪽 && 점.every((x) => x > 0.02), { ...A, 점 })
    ok(`${앞}${글} ① 이름 «${이름}» · 알림 «PDF ${A.쪽}쪽»`, new RegExp(`^${이름머리}_.+_\\d{4}-\\d{2}\\.pdf$`).test(이름) && new RegExp(`PDF ${A.쪽}쪽을 만들었습니다`).test(말), [이름, 말])
    const 뒤 = await p.evaluate(() => ({ 카드: document.querySelectorAll('.tp-찍을판 > .card.tp-bill').length, 몸: ['tp-print-bill', 'kcm-찍는중', 'kcm-그림인쇄중'].filter((c) => document.body.classList.contains(c)).join(','), 같음: document.querySelector('.tp-찍을판').innerHTML.replace(/ style=""/g, '') === window.__처음판.replace(/ style=""/g, '') }))   // 빈 style="" 은 리액트가 남기는 찌꺼기(내용 같음)
    ok(`${앞}${글} ② 찍은 뒤 판 걷힘 — 화면은 청구서 하나(카드 ${뒤.카드}) · 몸 꼴 없음`, 뒤.카드 === 셈.판카드 && 뒤.몸 === '' && 뒤.같음, 뒤)
    const html = k ? await p.evaluate(() => window.__판) : await p.evaluate(() => window.__처음판)
    const 전 = html ? await 전방식(p, `청구_${꼬}_전글자.pdf`, html) : { 내용: 0, 전체: 0 }
    const 판수 = (html.match(/class="card tp-bill/g) || []).length
    ok(`${앞}${글} ② 쪽 수 — 판 ${판수}장 · 전 방식 내용 ${전.내용}쪽(전체 ${전.전체}) · 그림 ${A.쪽}쪽 같음`, 전.내용 >= 1 && A.쪽 === 전.내용 && A.쪽 >= 판수, { 전, 그림: A.쪽, 판수 })
    execFileSync('pdftoppm', ['-r', '40', '-png', '-f', '1', '-l', '1', 파일, path.join(폴더, `청구_${꼬}`)])
  }
  /* ③ 인쇄 — 이 달 모두 */
  {
    await p.evaluate(() => {
      window.__인쇄 = null
      window.print = () => { const 판 = document.getElementById('kcm-그림인쇄'); const 그림 = 판 ? [...판.querySelectorAll('img.kcm-쪽그림')] : []; window.__인쇄 = { 그림: 그림.length, 쪽: [...new Set(그림.map((im) => im.style.page))].join(','), 판쪽: 판 ? 판.style.page : '?', 크기: 그림[0] ? 그림[0].style.width + '×' + 그림[0].style.height : '', 다불림: 그림.every((im) => im.complete && im.naturalWidth > 1000), 몸: document.body.classList.contains('kcm-그림인쇄중') } }
    })
    await 줄단추(p, '🧾 이 달 청구서 모두', '🖨 인쇄').click()
    let 순간 = null
    for (let i = 0; i < 300 && !순간; i++) { await 쉬어(100); 순간 = await p.evaluate(() => window.__인쇄) }
    ok(`${앞}③ 🖨 인쇄(이 달 모두) → 몸 밑엔 쪽 그림만 ${순간 ? 순간.그림 : '?'}장(${순간 ? 순간.크기 : ''} · tp-land · 다 불러옴)`, !!순간 && 순간.그림 >= 3 && 순간.쪽 === 'tp-land' && 순간.판쪽 === 'tp-land' && 순간.크기 === '277mm×190mm' && 순간.다불림 && 순간.몸, 순간)
    if (순간) {
      const 인쇄파일 = path.join(폴더, `청구_인쇄${꼬리}.pdf`)
      fs.writeFileSync(인쇄파일, await p.pdf({ preferCSSPageSize: true, printBackground: true }))
      const B = PDF보기(인쇄파일)
      ok(`${앞}③ 인쇄 창 «PDF로 저장» 과 같은 PDF — ${B.쪽}쪽(빈 쪽 없음) · 가로 · 글꼴 0 · 글자 0`, B.쪽 === 순간.그림 && B.크기[0] > B.크기[1] && B.글꼴 === 0 && B.글자 === '', B)
      await p.evaluate(() => window.dispatchEvent(new Event('afterprint')))
      await 쉬어(300)
      ok(`${앞}③ 인쇄 창을 닫으면 다 걷힘 · 판도 걷힘`, await p.evaluate((판카드) => !document.getElementById('kcm-그림인쇄') && !document.body.classList.contains('kcm-그림인쇄중') && document.querySelectorAll('.tp-찍을판 > .card.tp-bill').length === 판카드, 셈.판카드))
    }
  }
  if (!폰) {
    ok('⑤ 📗 이 달 청구서 엑셀 · 달별 누계 엑셀 단추 그대로', (await p.locator('button', { hasText: '📗 이 달 청구서 엑셀' }).count()) === 1 && (await p.locator('button', { hasText: '📗 달별 누계 엑셀' }).count()) === 1)
    const 바로 = path.join(폴더, '바로인쇄.pdf')
    fs.writeFileSync(바로, await p.pdf({ preferCSSPageSize: true }))
    const 바글 = execFileSync('pdftotext', [바로, '-']).toString().replace(/\s+/g, ' ')
    ok('④ 단추 없이 Ctrl+P → «청구서는 화면의 … 단추로 인쇄해 주세요» 안내 · 청구서 판 글 안 나감', /청구서는 화면의/.test(바글) && /단추로 인쇄해 주세요/.test(바글) && !/실지급/.test(바글) && !/청구내역서 \(/.test(바글), 바글.slice(0, 300))
  } else {
    const 줄 = await p.evaluate(() => { const r = [...document.querySelectorAll('.tp-찍기줄 button')].map((x) => x.getBoundingClientRect()); const 나란 = [...document.querySelectorAll('.tp-찍기줄')].every((z) => { const [a, b] = [...z.querySelectorAll('button')].map((x) => x.getBoundingClientRect()); const s = z.querySelector('span').getBoundingClientRect(); return Math.abs(a.top - b.top) < 2 && a.top >= s.bottom - 1 }); return { 오른쪽: Math.round(Math.max(...r.map((x) => x.right))), 화면: innerWidth, 수: r.length, 나란 } })
    ok(`${앞}⑦ 폰 단추 줄 — 단추 ${줄.수}개 화면 안(${줄.오른쪽} ≤ ${줄.화면}) · 줄마다 이름 아래 📄 PDF · 🖨 인쇄 나란히`, 줄.수 === 8 && 줄.오른쪽 <= 줄.화면 && 줄.나란, 줄)
  }
  /* ⑥ 404 */
  if (!폰) {
    const q = await ctx.newPage()
    await q.route((u) => /html2canvas|그림인쇄\./.test(decodeURIComponent(u.toString())), (r) => r.fulfill({ status: 404, body: 'not found' }))
    await 열기(q)
    await 줄단추(q, '🧾 이 달 청구서 모두', '📄 PDF').click()
    let 말 = ''
    for (let i = 0; i < 50 && !/새로/.test(말); i++) { await 쉬어(100); 말 = await q.evaluate(() => [...document.querySelectorAll('[role=status]')].map((x) => x.innerText).join(' | ')) }
    const 카드 = await q.evaluate(() => document.querySelectorAll('.tp-찍을판 > .card.tp-bill').length)
    ok('⑥ 찍는 도구 파일이 없어진 때(404) → «새로고침(↻) 뒤 다시 · 쓴 것은 그대로» 알림 · 판 걷힘', /사이트가 새로 바뀌었습니다 — 화면을 새로고침\(↻\)한 뒤 다시 눌러 주세요\(쓴 것은 그대로 남습니다\)/.test(말) && 카드 === 셈.판카드, [말, 카드])
    await q.close()
  }
  ok(`⑦ ${기기} 넘침 0 · 오류 0`, (await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0 && 오류.length === 0, 오류)
  await ctx.close()
}
await b.close()
console.log(`\n${n}개 중 틀림 ${bad}` + (틀림.length ? '\n  ' + 틀림.join('\n  ') : ''))
process.exit(bad ? 1 : 0)
