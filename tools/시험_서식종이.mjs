// ✍️ G361 서식 «종이에 바로 쓰기» 화면 시험 — 칸 누르기 · 쓰기 · 자동 계산 · 저절로 남음 · 다른 서식에 공사명 · 그림 PDF · 인쇄(글자 없음) · 폰
//   돌리기: 4998 에 화면 빌드 + web/public/forms/g 를 얹은 뒤 node tools/시험_서식종이.mjs [주소=http://127.0.0.1:4998]
//   (데이터베이스는 가짜 — 진짜 사이트에 세지 않음)
import { createRequire } from 'module'
import fs from 'fs'
import { execFileSync } from 'child_process'
import { 판짜기, 칸상자, 칸쪽 } from '../web/src/lib/격자그림.js'
import { 열번호 } from '../web/src/lib/엑셀셈.js'
const require = createRequire('/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const 주소 = process.argv[2] || 'http://127.0.0.1:4998'
const 폴더 = '/tmp/g10/g361/ui'
fs.mkdirSync(폴더, { recursive: true })
let ok = 0, bad = 0
const 봐 = (c, m, 더 = '') => { if (c) { ok++; console.log('✓', m, 더) } else { bad++; console.log('✗', m, 더) } }
const 브 = await chromium.launch()

async function 판열기(w) {
  const 판 = await 브.newContext({ viewport: { width: w, height: 900 }, acceptDownloads: true, deviceScaleFactor: w < 600 ? 2 : 1 })
  await 판.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|geojs/, (r) => r.fulfill({ status: 200, body: '' }))
  await 판.route(/firebaseio\.com/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await 판.addInitScript(() => { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); try { sessionStorage.setItem('kcm_notice_seen', '2026-10-업체') } catch (e) {} })
  return 판
}
async function 서식열기(A, slug) {
  await A.goto(`${주소}/forms/${slug}`, { waitUntil: 'domcontentloaded' })
  await A.waitForFunction(() => window.__격자 && document.querySelector('canvas.gx-page'), null, { timeout: 20000 })
  await A.waitForTimeout(400)
}
const 문서 = (slug) => JSON.parse(fs.readFileSync(`/tmp/g10/fm55/web/public/forms/g/${slug}.json`, 'utf8'))
/** 칸 열쇠(공사명 · 계약#1) → 화면 위 점 */
async function 칸누르기(A, doc, si, 열쇠) {
  const s = doc.sheets[si]
  const a = Object.entries(s.keys).find(([, k]) => k === 열쇠)[0]
  const m = /^([A-Z]+)(\d+)$/.exec(a)
  const r = +m[2], c = 열번호(m[1])
  const x = s.cells.find((q) => q[0] === r && q[1] === c)
  const 판 = 판짜기(s)
  const pi = 칸쪽(판, r)
  const 상자 = 칸상자(판, pi, x)
  const cv = A.locator(`#gx-s${si} canvas.gx-page`).nth(pi)
  await cv.scrollIntoViewIfNeeded()
  let b = await cv.boundingBox()
  const 비 = b.width / 판.W
  // 사람처럼 — 칸이 화면 밖이면 종이를 옆으로 밀고 · 위아래로 굴려 화면 위쪽 1/3 에 오게(아래 쓰는 칸에 가리지 않게)
  await A.evaluate(([cx, cy]) => {
    const 감 = document.querySelector('.gx-wrap')
    if (감 && (cx < 0 || cx > innerWidth - 10)) 감.scrollLeft += cx - innerWidth / 2
    window.scrollBy(0, cy - innerHeight * 0.33)
  }, [b.x + (상자.x + 상자.w / 2) * 비, b.y + (상자.y + 상자.h / 2) * 비])
  await A.waitForTimeout(250)
  b = await cv.boundingBox()
  await A.mouse.click(b.x + (상자.x + 상자.w / 2) * 비, b.y + (상자.y + 상자.h / 2) * 비)
  await A.waitForTimeout(150)
  return { r, c }
}
const 값 = (A, si, a) => A.evaluate(([si, a]) => { const m = /^([A-Z]+)(\d+)$/.exec(a); let c = 0; for (const ch of m[1]) c = c * 26 + ch.charCodeAt(0) - 64; const v = window.__격자.책.값(si, +m[2], c); return v && v.e ? v.e : v }, [si, a])
const 이름칸 = (A) => A.locator('.gx-ed-n').innerText().catch(() => '')

for (const [기기, w] of [['PC', 1280], ['폰', 430]]) {
  const 판 = await 판열기(w)
  const A = await 판.newPage()
  const 오류 = []; A.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
  await 서식열기(A, 'giseong-daebipyo')
  await A.evaluate(() => { localStorage.removeItem('kcm.격자'); localStorage.removeItem('kcm.서식공통') })
  await 서식열기(A, 'giseong-daebipyo')
  const doc = 문서('giseong-daebipyo')
  봐((await A.locator('canvas.gx-page').count()) === 1, `${기기} ① 기성대비표 종이 1쪽(A4 가로)`)
  // 공사명
  await 칸누르기(A, doc, 0, '공사명')
  봐(/공사명/.test(await 이름칸(A)), `${기기} ② 공사명 칸을 누르면 아래 쓰는 칸 «공사명»`, await 이름칸(A))
  await A.keyboard.type('가상 하천 정비공사')
  await A.keyboard.press('Enter')
  봐(/발주기관/.test(await 이름칸(A)), `${기기} ② Enter → 다음 칸 «발주기관»`, await 이름칸(A))
  봐((await 값(A, 0, 'C5')) === '가상 하천 정비공사', `${기기} ② 공사명이 종이에 들어감`)
  // 표 한 줄
  await 칸누르기(A, doc, 0, '계약#1')
  await A.keyboard.type('100,000,000'); await A.keyboard.press('Tab')
  봐(/전회/.test(await 이름칸(A)), `${기기} ③ Tab → 옆 칸(전회까지 누계)`, await 이름칸(A))
  await A.keyboard.type('30000000'); await A.keyboard.press('Tab')
  await A.keyboard.type('20000000'); await A.keyboard.press('Enter')
  await A.waitForTimeout(200)
  const 누계 = await 값(A, 0, 'F11'), 률 = await 값(A, 0, 'G11'), 잔여 = await 값(A, 0, 'H11')
  봐(누계 === 50000000 && Math.abs(률 - 0.5) < 1e-12 && 잔여 === 50000000, `${기기} ③ 자동 계산 — 누계 ${누계} · 기성률 ${률} · 잔여 ${잔여}`)
  const 합 = await A.evaluate(() => { const b = window.__격자; const s = b.doc.sheets[0]; const x = s.cells.find((q) => q[7] && /^SUM\(C11:C/.test(q[7])); return x ? b.책.값(0, x[0], x[1]) : null })
  봐(합 === 100000000, `${기기} ③ 합계 줄 계약금액 = ${합}`)
  // 작성일 = 오늘
  const 오늘 = await A.evaluate(() => { const n = new Date(Date.now() + 9 * 3600e3); return Math.round((Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()) - Date.UTC(1899, 11, 30)) / 86400000) })
  봐((await 값(A, 0, 'H6')) === 오늘, `${기기} ④ 작성일은 저절로 오늘`)
  // 저절로 남음
  await A.waitForTimeout(900)
  await 서식열기(A, 'giseong-daebipyo')
  봐((await 값(A, 0, 'C5')) === '가상 하천 정비공사' && (await 값(A, 0, 'F11')) === 50000000, `${기기} ⑤ 새로고침해도 쓰던 것이 남음(이 기기)`)
  // 다른 서식에 공사명 저절로
  await 서식열기(A, 'wonga')
  const wdoc = 문서('wonga')
  const w공사 = Object.entries(wdoc.sheets[0].keys).find(([, k]) => k === '공사명')
  const 말 = await A.locator('.fw-say').innerText().catch(() => '')
  봐(w공사 && (await 값(A, 0, w공사[0])) === '가상 하천 정비공사' && /채웠습니다/.test(말), `${기기} ⑥ 다른 서식(공사원가계산서)에 공사명이 저절로`, 말)
  // 예시 · 빈칸
  await A.locator('button', { hasText: '예시 채우기' }).click(); await A.waitForTimeout(300)
  const 예값 = await A.evaluate(() => { const b = window.__격자; const s = b.doc.sheets[0]; let n = 0; for (const x of s.cells) if (x[5] === 2) { const v = b.책.값(0, x[0], x[1]); if (typeof v === 'number' && v) n++ } return n })
  봐(예값 >= 10, `${기기} ⑦ 예시 채우기 → 계산 칸 ${예값}개에 값`)
  await A.locator('button', { hasText: '빈칸으로' }).click(); await A.waitForTimeout(300)
  봐((await 값(A, 0, w공사[0])) === '가상 하천 정비공사', `${기기} ⑦ 빈칸으로 → 공사명은 남김`)
  // PDF
  await 서식열기(A, 'giseong-daebipyo')
  const [dl] = await Promise.all([A.waitForEvent('download', { timeout: 20000 }), A.locator('button', { hasText: 'PDF 저장' }).click()])
  const pp = `${폴더}/${기기}_기성대비표.pdf`
  await dl.saveAs(pp)
  const buf = fs.readFileSync(pp)
  const 글 = buf.toString('latin1')
  const 쪽 = (글.match(/\/Type \/Page\b/g) || []).length
  let 텍스트 = ''
  try { 텍스트 = execFileSync('pdftotext', [pp, '-'], { encoding: 'utf8' }).trim() } catch (e) { 텍스트 = 'ERR ' + e.message }
  봐(글.startsWith('%PDF-1.4') && 쪽 === 1 && !/\/Font/.test(글) && 텍스트 === '' && buf.length > 50000, `${기기} ⑧ 그림 PDF — 1쪽 · 글꼴 0 · 뽑히는 글자 0 · ${(buf.length / 1024).toFixed(0)}KB · 이름 ${dl.suggestedFilename()}`)
  execFileSync('pdftoppm', ['-r', '60', '-png', pp, `${폴더}/${기기}_기성대비표_pdf`])
  // 인쇄(Ctrl+P 와 같은 길 — beforeprint)
  if (기기 === 'PC') {
    await A.evaluate(() => window.dispatchEvent(new Event('beforeprint')))
    const 인쇄쪽 = await A.evaluate(() => document.querySelectorAll('#gx-인쇄 canvas').length)
    const pdf = await A.pdf({ preferCSSPageSize: true, printBackground: true })
    const pq = `${폴더}/PC_인쇄.pdf`
    fs.writeFileSync(pq, pdf)
    const t2 = execFileSync('pdftotext', [pq, '-'], { encoding: 'utf8' }).trim()
    const 쪽2 = (pdf.toString('latin1').match(/\/Type \/Page\b/g) || []).length
    봐(인쇄쪽 === 1 && 쪽2 === 1 && t2 === '', `${기기} ⑨ 인쇄 — 종이 그림만 1쪽 · 사이트 글 0 · 뽑히는 글자 0`, `캔버스 ${인쇄쪽} · 쪽 ${쪽2} · 글 «${t2.slice(0, 40)}»`)
    execFileSync('pdftoppm', ['-r', '50', '-png', pq, `${폴더}/PC_인쇄`])
    await A.evaluate(() => window.dispatchEvent(new Event('afterprint')))
  }
  if (기기 === 'PC') {
    // 작업일보 — 어제 저장 → «복사해 새로» → 전일 = 어제 누계 · 일자 · 요일은 오늘
    await 서식열기(A, 'jakeop-ilbo')
    await A.locator('button', { hasText: '예시 채우기' }).click(); await A.waitForTimeout(250)
    const 어제누계 = await 값(A, 0, 'H12'), 어제누계2 = await 값(A, 0, 'H13')
    await A.locator('button', { hasText: '💾 저장' }).click(); await A.waitForTimeout(200)
    await A.locator('button', { hasText: '📂 저장한 것' }).click()
    await A.locator('.fw-li button', { hasText: '복사해 새로' }).first().click(); await A.waitForTimeout(300)
    const 전일 = await A.evaluate(() => window.__격자.책.입력값(0, 12, 6)), 전일2 = await A.evaluate(() => window.__격자.책.입력값(0, 13, 6))
    const 말2 = await A.locator('.fw-say').innerText().catch(() => '')
    봐(typeof 어제누계 === 'number' && 어제누계 > 0 && 전일 === 어제누계 && 전일2 === 어제누계2 && /전일/.test(말2), `PC ⑪ 작업일보 «복사해 새로» → 전일 = 어제 누계(${어제누계} · ${어제누계2})`, 말2)
    const 금일 = await A.evaluate(() => window.__격자.책.입력값(0, 12, 7)), 오늘누계 = await 값(A, 0, 'H12')
    봐(금일 === null && 오늘누계 === 어제누계, `PC ⑪ 어제 금일은 비움(두 번 셈 막음) → 오늘 누계 = 전일`, `금일 ${금일} · 누계 ${오늘누계}`)
    await A.evaluate(() => { localStorage.removeItem('kcm.격자') })
    await 서식열기(A, 'jakeop-ilbo')
    const 요일 = await 값(A, 0, 'E6'), 일자 = await 값(A, 0, 'C6')      // 요일 칸은 엑셀과 같은 수식(일자로 셈)
    봐(요일 === `(${'일월화수목금토'[new Date(Date.now() + 9 * 3600e3).getUTCDay()]})` && 일자 === 오늘, `PC ⑫ 작업일보 처음 열면 일자는 오늘 · 요일은 저절로`, `${일자} · ${요일}`)
  }
  if (기기 === '폰') {
    await 칸누르기(A, doc, 0, '공종#2')
    const 편 = await A.locator('.gx-ed').boundingBox()
    const 탭 = await A.locator('.tabbar').boundingBox().catch(() => null)
    봐(편 && (!탭 || 편.y + 편.height <= 탭.y + 1), `폰 ⑩ 쓰는 칸이 아래 탭 위에 뜸`, JSON.stringify({ 편, 탭 }))
    await A.screenshot({ path: `${폴더}/폰_쓰는칸.png` })
    봐((await A.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 1, '폰 가로 넘침 없음')
  }
  await A.locator('#작성').screenshot({ path: `${폴더}/${기기}_기성대비표_종이.png` })
  봐(오류.length === 0, `${기기} 화면 오류 없음`, 오류.join(' | '))
  await 판.close()
}
await 브.close()
console.log(`\n${ok} 통과 · ${bad} 실패`)
process.exit(bad ? 1 : 0)
