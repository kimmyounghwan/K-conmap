/**
 * 🖼 G584 안전 웹 서식(사이트에서 작성 → PDF · 36가지) — 그림 PDF(글자 층 없음) 화면 시험. 구운 사이트(dist)를 띄운 뒤:
 *   node tools/시험_서식그림PDF화면.mjs [주소=http://127.0.0.1:4578] [슬러그…]      (OUT=/tmp/g10/g584 · PHONE=0 이면 PC 만 · PNG=슬러그,… 첫 쪽 그림)
 *   소장님 11-08 「PDF 도 변환 안되게 해야 하지 않아? 사이트?」 — 10-21 «그림 PDF» 가 안전 웹 서식엔 안 들어가 있었음
 *   서식마다(✍ 예시 채우기 뒤):
 *   ① «📄 PDF 저장» → 바로 내려받음 · PDF 1.4 · 글꼴 0 · 뽑히는 글자 0(pdftotext) · 그림 = 쪽 수 · 파일 이름 «서식명_현장_날짜.pdf»
 *      · 찍은 종이에 쓴 값(예시 첫 칸)이 들어 있음 · 쪽 수가 같은 종이를 브라우저로 인쇄한 것(전 방식 · 글자 PDF)과 같음(원본 그대로)
 *   ② «🖨 인쇄» → 인쇄 순간 #fw-인쇄 에는 쪽 그림(img)만(다 불러옴) · 그 모습 그대로 PDF(인쇄 창 «PDF로 저장» 과 같음) → 글꼴 0 · 글자 0 · 쪽 수 같음
 *      · 인쇄 창을 닫으면(afterprint) 다 걷힘 · 제목 되돌림
 *   ③ 단추 없이 Ctrl+P(브라우저 인쇄 바로) → 작성 칸은 안 찍히고 «단추로 인쇄» 안내만 · 쓴 값이 PDF 글자로 안 나감
 *   ④ 찍은 뒤 화면 밖 종이 걷힘 · 단추 다시 눌림 · 넘침 0 · 오류 0 (PC 1280 — 36가지 모두 · 폰 390 — 여섯 가지)
 *      · 화면을 열어 둔 사이 사이트가 새로 올라가 찍는 도구 파일이 없어진 때(404) → «새로고침 뒤 다시 · 쓴 것은 그대로» 알림
 *   ⑤ 아래 단추(끝까지 내린 뒤)로도 같은 PDF · 알림은 누른 단추 곁(화면 안 — 위 알림은 화면 밖이라 안 보였음)
 *   ⑥ 첫 쪽(과 둘째 쪽) 그림을 PNG 로 — OUT 폴더(눈으로 봄: 글 · 칸 줄 · 자른 자리 · 머리줄 다시)
 *   인터넷 안 부름(파이어베이스 · 광고 · 애널리틱스 막음) · 가상 예시만 씀.
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const 인자 = process.argv.slice(2)
const BASE = 인자.find((x) => /^https?:/.test(x)) || 'http://127.0.0.1:4578'
const 고른 = 인자.filter((x) => !/^https?:/.test(x))
const 폴더 = process.env.OUT || '/tmp/g10/g584'
fs.mkdirSync(폴더, { recursive: true })

const 서식들 = JSON.parse(fs.readFileSync(path.join(ROOT, 'web/src/data/forms.json'), 'utf8')).forms
const 웹 = []
for (const f of 서식들) if ((f.group === '안전' || f.gen === 'web') && f.gen !== 'forms2' && f.gen !== 'wihgen' && !웹.some((x) => x.slug === f.slug)) 웹.push(f)
const PC들 = 고른.length ? 웹.filter((f) => 고른.includes(f.slug)) : 웹
const 폰들 = process.env.PHONE === '0' ? [] : 고른.length ? PC들 : ['jg-charyang-geonseol', 'hg-milpye', 'tbm-hoeui', 'oegugin-gyoyuk', 'sanjae-josa', 'idong-bigye'].map((s) => 웹.find((f) => f.slug === s)).filter(Boolean)
const 그림볼 = new Set(process.env.PNG ? process.env.PNG.split(',') : ['jg-charyang-geonseol', 'hg-milpye', 'tbm-hoeui', 'oegugin-gyoyuk', 'sanjae-josa', 'dogeup-jeongbo', 'jungdae-bogo', 'idong-bigye'])

let bad = 0, n = 0
const 틀림 = []
const ok = (이름, c, got) => { n++; if (!c) { bad++; 틀림.push(이름) } console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (c || got === undefined ? '' : ' = ' + JSON.stringify(got).slice(0, 400))) }
const 쉬어 = (ms) => new Promise((r) => setTimeout(r, ms))
const 오늘 = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10)

/** PDF 보기 — 쪽 · 글꼴 · 뽑히는 글자 · 그림 */
function PDF보기(파일) {
  const buf = fs.readFileSync(파일)
  const 머리 = buf.subarray(0, 8).toString('latin1')
  const 정보 = execFileSync('pdfinfo', [파일]).toString()
  const 쪽 = Number((/Pages:\s+(\d+)/.exec(정보) || [])[1] || 0)
  const 글꼴 = execFileSync('pdffonts', [파일]).toString().trim().split('\n').slice(2).filter((x) => x.trim()).length
  const 글자 = execFileSync('pdftotext', ['-layout', 파일, '-']).toString().replace(/[\s\f]/g, '')
  const 그림 = execFileSync('pdfimages', ['-list', 파일]).toString().trim().split('\n').slice(2).filter((x) => x.trim()).map((x) => x.trim().split(/\s+/))
  return { 머리, 쪽, 글꼴, 글자, 그림수: 그림.length, 그림폭: 그림.map((c) => Number(c[3])), 그림높: 그림.map((c) => Number(c[4])), KB: Math.round(buf.length / 1024), Font: /\/Font/.test(buf.toString('latin1')) }
}
function 글자PDF쪽(파일) { return Number((/Pages:\s+(\d+)/.exec(execFileSync('pdfinfo', [파일]).toString()) || [])[1] || 0) }

const b = await chromium.launch()
const UA폰 = 'Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'

for (const [기기, w, h, 폰, 목록] of [['PC 1280', 1280, 900, false, PC들], ['폰 390', 390, 844, true, 폰들]]) {
  if (!목록.length) continue
  console.log(`■ ${기기} — ${목록.length}가지`)
  const ctx = await b.newContext({ viewport: { width: w, height: h }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', isMobile: 폰, hasTouch: 폰, acceptDownloads: true, ...(폰 ? { userAgent: UA폰 } : {}) })
  await ctx.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|googlesyndication|geojs/, (r) => r.fulfill({ status: 200, body: '' }))
  await ctx.route(/firebaseio\.com|firebasedatabase\.app|identitytoolkit|securetoken/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await ctx.addInitScript(() => { try { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); sessionStorage.setItem('kcm_notice_seen', '2026-10-업체'); sessionStorage.setItem('kcm_visit_s', '1') } catch (e) { /* 없음 */ } })
  /* 받는 파일 이름 — 시험 브라우저(headless)는 한글 이름을 «download» 로 바꿔 받으므로 누른 링크의 download 이름을 적어 둠 */
  await ctx.addInitScript(() => { window.__받은이름 = []; document.addEventListener('click', (e) => { const a = e.target && e.target.closest && e.target.closest('a[download]'); if (a) window.__받은이름.push(a.download) }, true) })
  const p = await ctx.newPage()
  const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
  const 꼬리 = 폰 ? '_폰' : ''
  for (const f of 목록) {
    const 앞 = `${f.slug}${폰 ? ' (폰)' : ''}`
    await p.goto(`${BASE}/forms/${f.slug}`, { waitUntil: 'domcontentloaded' })
    await p.waitForSelector('.fw-bar button', { timeout: 20000 })
    await 쉬어(300)
    await p.evaluate(() => { const x = [...document.querySelectorAll('.fw-bar button')].find((y) => /빈칸으로/.test(y.textContent)); if (x) x.click() })
    await 쉬어(200)
    await p.locator('.fw-bar button', { hasText: '✍ 예시 채우기' }).first().click()
    await 쉬어(500)
    const 첫값 = await p.evaluate(() => { const i = [...document.querySelectorAll('.fw-form input.fw-in, .fw-form textarea.fw-in')].find((x) => x.value && x.value.trim().length >= 4 && !/^\d{4}-\d{2}-\d{2}/.test(x.value)); return i ? i.value.trim() : '' })
    /* ① PDF 저장 — 화면 밖 종이가 펴지는 순간 그 글 · 배율을 적어 둠(시험만) */
    await p.evaluate(() => {
      window.__종이 = null
      if (window.__ob) window.__ob.disconnect()
      const ob = new MutationObserver(() => {
        const el = document.querySelector('#fw-인쇄.fw-그림 .fw-paper[data-h]')
        if (el && !window.__종이) window.__종이 = { html: el.outerHTML, z: Number(el.dataset.z) || 1, h: Number(el.dataset.h), 글: el.innerText }
      })
      ob.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-h'] })
      window.__ob = ob
    })
    const t0 = Date.now()
    const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 40000 }), p.locator('.fw-bar button', { hasText: '📄 PDF 저장' }).first().click()])
    const 걸림 = Date.now() - t0
    const 이름 = (await p.evaluate(() => (window.__받은이름 || []).slice(-1)[0])) || dl.suggestedFilename()
    const 파일 = path.join(폴더, `${f.slug}${꼬리}.pdf`)
    await dl.saveAs(파일)
    await 쉬어(300)
    const 종이 = await p.evaluate(() => window.__종이)
    const 뒤 = await p.evaluate(() => ({ 판: document.querySelectorAll('#fw-인쇄').length, 단추: [...document.querySelectorAll('.fw-bar button')].filter((x) => /📄 PDF 저장/.test(x.textContent) && !x.disabled).length, 말: (document.querySelector('.card.fw > .fw-say') || {}).innerText || '', 아래말: !!document.querySelector('.fw-bar.bottom .fw-say') }))
    const A = PDF보기(파일)
    const 쪽px = [Math.round((210 * 96 / 25.4) * 2), Math.round((297 * 96 / 25.4) * 2)]
    ok(`${앞} ① 📄 PDF 저장 → 바로 받음 · PDF 1.4 · 글꼴 0 · 뽑히는 글자 0 · 그림 ${A.쪽}장 = ${A.쪽}쪽(A4 ${쪽px.join('×')}) · ${A.KB}KB · ${(걸림 / 1000).toFixed(1)}초`,
      A.머리.startsWith('%PDF-1.4') && A.쪽 >= 1 && A.글꼴 === 0 && !A.Font && A.글자 === '' && A.그림수 === A.쪽 && A.그림폭.every((x) => Math.abs(x - 쪽px[0]) <= 2) && A.그림높.every((x) => Math.abs(x - 쪽px[1]) <= 2) && A.KB < 1500, A)
    const 이름꼴 = new RegExp('^' + f.title.replace(/[\\/:*?"<>|]/g, '').replace(/[.()+[\]]/g, '\\$&') + '(_.+)?_' + 오늘 + '\\.pdf$')
    const 제목글 = f.title.replace(/[\\/:*?"<>|]/g, '')
    ok(`${앞} ① 파일 이름 «${이름}»(서식명_공사명_오늘.pdf — 날짜 칸이 이름에 안 붙음) · 다 찍은 뒤 화면 밖 종이 걷힘 · 단추 다시 · «📄 PDF ${A.쪽}쪽을 만들었습니다» 알림`,
      이름꼴.test(이름) && 이름.startsWith(제목글 + '_') && !/^_\d{4}/.test(이름.slice(제목글.length)) && 뒤.판 === 0 && 뒤.단추 === 2 && new RegExp(`PDF ${A.쪽}쪽을 만들었습니다`).test(뒤.말) && !뒤.아래말, [이름, 뒤])
    ok(`${앞} ① 찍은 종이에 쓴 값이 들어 있음(예시 첫 칸 «${첫값.slice(0, 20)}») · K-건설맵 표시`, !!종이 && !!첫값 && 종이.글.replace(/\s+/g, ' ').includes(첫값.replace(/\s+/g, ' ').slice(0, 40)) && /K-건설맵 · k-conmap\.com/.test(종이.글), 종이 ? 종이.글.slice(0, 120) : null)
    /* 같은 종이를 브라우저로 인쇄(전 방식 — 글자 PDF) → 쪽 수가 같아야 «원본 그대로» */
    if (종이) {
      await p.evaluate(({ html, z }) => {
        const d = document.createElement('div'); d.id = 'fw-인쇄'; d.innerHTML = html
        const el = d.firstElementChild; if (z < 1) { el.style.width = ''; el.style.zoom = String(z) }   /* 전 방식 = 종이 폭 그대로 zoom(그림은 1/z 로 넓게 펴서 찍고 줄임) */
        document.body.appendChild(d)
        document.body.classList.add('fw-인쇄중'); document.documentElement.classList.add('fw-인쇄중')
      }, 종이)
      const 옛 = path.join(폴더, `${f.slug}${꼬리}_전글자.pdf`)
      fs.writeFileSync(옛, await p.pdf({ preferCSSPageSize: true, printBackground: true }))
      await p.evaluate(() => { document.querySelectorAll('#fw-인쇄').forEach((x) => x.remove()); document.body.classList.remove('fw-인쇄중'); document.documentElement.classList.remove('fw-인쇄중') })
      const M = 글자PDF쪽(옛)
      ok(`${앞} ① 쪽 수가 같은 종이를 브라우저로 인쇄한 것(전 방식)과 같음 — 그림 ${A.쪽} · 전 ${M} (종이 ${종이.h}mm · 줄임 ${종이.z})`, A.쪽 === M, { 그림: A.쪽, 전: M })
    }
    if (그림볼.has(f.slug)) execFileSync('pdftoppm', ['-r', '60', '-png', '-f', '1', '-l', String(Math.min(2, A.쪽)), 파일, path.join(폴더, `${f.slug}${꼬리}`)])
    /* ② 🖨 인쇄 — print() 를 가로채 그 순간 모습을 PDF 로 */
    await p.evaluate(() => {
      window.__인쇄 = null
      window.print = () => {
        const 판 = document.querySelector('#fw-인쇄')
        const 그림 = 판 ? [...판.querySelectorAll('img.fw-쪽그림')] : []
        window.__인쇄 = { 그림: 그림.length, 종이: 판 ? 판.querySelectorAll('.fw-paper').length : -1, 아이: 판 ? 판.children.length : -1, 다불림: 그림.every((im) => im.complete && im.naturalWidth > 1000), 인쇄중: document.body.classList.contains('fw-인쇄중'), 제목: document.title }
      }
    })
    const 옛제목 = await p.title()
    await p.locator('.fw-bar button', { hasText: '🖨 인쇄' }).first().click()
    let 순간 = null
    for (let i = 0; i < 200 && !순간; i++) { await 쉬어(100); 순간 = await p.evaluate(() => window.__인쇄) }
    ok(`${앞} ② 🖨 인쇄 → 인쇄 순간 #fw-인쇄 에는 쪽 그림만 ${순간 ? 순간.그림 : '?'}장(글 종이 0 · 다 불러옴) · 제목 «${순간 ? 순간.제목.slice(0, 30) : ''}»`,
      !!순간 && 순간.그림 === A.쪽 && 순간.종이 === 0 && 순간.아이 === 순간.그림 && 순간.다불림 && 순간.인쇄중 && /_\d{4}-\d{2}-\d{2}$/.test(순간.제목), 순간)
    if (순간) {
      const 인쇄파일 = path.join(폴더, `${f.slug}${꼬리}_인쇄.pdf`)
      fs.writeFileSync(인쇄파일, await p.pdf({ preferCSSPageSize: true, printBackground: true }))
      const B = PDF보기(인쇄파일)
      ok(`${앞} ② 인쇄 창 «PDF로 저장» 과 같은 PDF — ${B.쪽}쪽 · 글꼴 0 · 뽑히는 글자 0(사이트 글도 0)`, B.쪽 === A.쪽 && B.글꼴 === 0 && B.글자 === '', { 쪽: B.쪽, 글꼴: B.글꼴, 글자: B.글자.slice(0, 60) })
      await p.evaluate(() => window.dispatchEvent(new Event('afterprint')))
      await 쉬어(300)
      const 걷힘 = await p.evaluate(() => ({ 판: document.querySelectorAll('#fw-인쇄').length, 인쇄중: document.body.classList.contains('fw-인쇄중') || document.documentElement.classList.contains('fw-인쇄중'), 제목: document.title }))
      ok(`${앞} ② 인쇄 창을 닫으면 다 걷힘 · 제목 되돌림`, 걷힘.판 === 0 && !걷힘.인쇄중 && 걷힘.제목 === 옛제목, [걷힘, 옛제목])
    }
    /* ⑤ 아래 단추(끝까지 내린 뒤 — 다 쓰고 누르는 자리) → 같은 PDF · 알림은 누른 단추 곁(화면 안) · 위엔 없음 */
    await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    await 쉬어(200)
    const 아래단추 = p.locator('.fw-bar.bottom button', { hasText: '📄 PDF 저장' })
    const [dl2] = await Promise.all([p.waitForEvent('download', { timeout: 40000 }), 아래단추.click()])
    const 파일2 = path.join(폴더, `${f.slug}${꼬리}_아래.pdf`)
    await dl2.saveAs(파일2)
    await 쉬어(300)
    const 알림 = await p.evaluate(() => { const 아 = document.querySelector('.fw-bar.bottom .fw-say'); const r = 아 ? 아.getBoundingClientRect() : null; return { 아래: 아 ? 아.innerText : '', 위: !!document.querySelector('.card.fw > .fw-say'), 보임: !!r && r.top >= 0 && r.bottom <= innerHeight } })
    const 첫쪽 = (파) => { execFileSync('pdftoppm', ['-r', '40', '-png', '-f', '1', '-l', '1', '-singlefile', 파, 파 + '_1']); return fs.readFileSync(파 + '_1.png') }
    const B2 = PDF보기(파일2)
    ok(`${앞} ⑤ 아래 단추(끝까지 내린 뒤) → 같은 PDF(${B2.쪽}쪽 · 첫 쪽 그림 같음 · 글꼴 0) · «PDF ${B2.쪽}쪽을 만들었습니다» 알림은 누른 단추 곁(화면 안) · 위엔 없음`,
      B2.쪽 === A.쪽 && B2.글꼴 === 0 && B2.글자 === '' && 첫쪽(파일2).equals(첫쪽(파일)) && new RegExp(`PDF ${A.쪽}쪽을 만들었습니다`).test(알림.아래) && 알림.보임 && !알림.위, [B2.쪽, A.쪽, 알림])
    /* ③ 단추 없이 Ctrl+P — 작성 칸은 안 찍히고 안내만 */
    if (!폰) {
      const 바로 = path.join(폴더, `${f.slug}_바로인쇄.pdf`)
      fs.writeFileSync(바로, await p.pdf({ preferCSSPageSize: true }))
      const 글 = execFileSync('pdftotext', [바로, '-']).toString().replace(/\s+/g, ' ')
      const 값 = 첫값.replace(/\s+/g, ' ').slice(0, 40)
      ok(`${앞} ③ 단추 없이 Ctrl+P → «📄 PDF 저장 또는 🖨 인쇄 단추로 인쇄해 주세요» 안내 · 쓴 값(«${값.slice(0, 16)}») 글자로 안 나감`,
        /이 서식은 화면의/.test(글) && /단추로 인쇄해 주세요/.test(글) && !!값 && !글.includes(값), 글.slice(0, 200))
    }
  }
  /* ④ 화면을 열어 둔 사이 사이트가 새로 올라가 «찍는 도구» 파일(html2canvas · 그림인쇄)이 없어진 때 — 404 를 흉내 */
  if (!폰) {
    const q = await ctx.newPage()
    /* 🩹 G611 서식 쪽(Forms.jsx)이 빈 서식 미리보기 PDF 로 그림 인쇄 «훅»(그림인쇄훅-…js)을 처음부터 불러옴 — 훅은 쪽과 같이 이미 와 있는 파일이라 막지 않고, 누를 때 늦게 오는
       «찍는 도구»(html2canvas · lib 그림인쇄-…js)만 404 로(전엔 훅까지 막혀 서식 쪽이 안 떴음) */
    await q.route((u) => /html2canvas|그림인쇄(?!훅)/.test(decodeURIComponent(u.toString())), (r) => r.fulfill({ status: 404, body: 'not found' }))
    await q.goto(`${BASE}/forms/jg-charyang-geonseol`, { waitUntil: 'domcontentloaded' })
    await q.waitForSelector('.fw-bar button', { timeout: 20000 })
    await q.locator('.fw-bar button', { hasText: '📄 PDF 저장' }).first().click()
    let 말 = ''
    for (let i = 0; i < 40 && !말; i++) { await 쉬어(100); 말 = await q.evaluate(() => (document.querySelector('.fw-say') || {}).innerText || '') }
    const 뒤 = await q.evaluate(() => ({ 판: document.querySelectorAll('#fw-인쇄').length, 단추: [...document.querySelectorAll('.fw-bar button')].filter((x) => /📄 PDF 저장/.test(x.textContent) && !x.disabled).length }))
    ok(`${기기} ④ 화면을 열어 둔 사이 사이트가 새로 올라가 찍는 도구 파일이 없어진 때 → «새로고침(↻) 뒤 다시 · 쓴 것은 그대로» 알림 · 화면 밖 종이 걷힘 · 단추 다시`,
      /사이트가 새로 바뀌었습니다 — 화면을 새로고침\(↻\)한 뒤 다시 눌러 주세요\(쓴 것은 그대로 남습니다\)/.test(말) && 뒤.판 === 0 && 뒤.단추 === 2, [말, 뒤])
    await q.close()
  }
  ok(`${기기} 넘침 0 · 오류 0`, (await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0 && 오류.length === 0, 오류)
  await ctx.close()
}
await b.close()
console.log(`\n${n}개 중 틀림 ${bad}` + (틀림.length ? '\n  ' + 틀림.slice(0, 30).join('\n  ') : ''))
process.exit(bad ? 1 : 0)
