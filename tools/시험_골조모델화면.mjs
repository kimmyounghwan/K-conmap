// 🧪 골조 모델(/jeoksan/model) 화면 — 실제로 눌러 세워 보기 · G386 (2026-10-23)
//   4998 에 화면 빌드를 얹은 뒤  node tools/시험_골조모델화면.mjs [PC|폰|모두]   (엑셀 다시 셈: OUT=폴더 를 주면 받은 엑셀을 거기에 둠)
//   ① 예시 → 화면 합(콘크리트 · 거푸집 · 철근) = lib 모델셈(예시모델)
//   ② 새로 → 통심 3×2 칸 · 1층: 교점 누름 = 기둥 · 교점 둘 = 보(칸마다 나뉨) · 칸 누름 = 슬라브 · «모든 교점에» · 층 더하기 → 층 복사 → 2층 부재 수 같음(14)
//   ③ 고르기 → 누른 보의 물량이 나옴 · 지우기 → 하나 줄어듦 · 되돌리기 → 다시 늘어남
//   ④ 엑셀 받기 → 시트(산출서 · 집계 · 부재별 · 모델) · 산출서 수량 칸 합(콘크리트) = lib
//   ⑤ 새로고침해도 모델이 남음(이 브라우저 저장) · 화면 오류 없음 · 폰 가로 넘침 없음
//   ⑥ 🖥 G388 작업 화면(🔒 운영자만) — 남에게는 단추 · ?ws=1 모두 없음 · 운영자: 열면 왼쪽 도구 · 가운데 3D(PC 화면 폭 절반 넘게) · 오른쪽 물량 ·
//      그 안에서 기둥 세우기 · 고르기 · 평면 / 나란히 · 나가면 주소 ?ws=1 지움 · 폰 가로 넘침 없음
import { createRequire } from 'module'
import fs from 'fs'
import path from 'path'
import * as L from '../web/src/lib/골조모델.js'
import { readWorkbook } from '../web/src/lib/qtoxlsx.js'
import { calc } from '../web/src/lib/susik.js'
const require = createRequire('/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const 주소 = process.env.B || 'http://127.0.0.1:4998'
const 기기들 = (process.argv[2] || '모두') === '모두' ? ['PC', '폰'] : [process.argv[2]]
let ok = 0, bad = 0
const 봐 = (c, m, 더 = '') => { if (c) ok++; else bad++; console.log(c ? '✓' : '✗', m, c ? '' : String(더).slice(0, 300)) }
const 숫 = (t) => Number(String(t).replace(/,/g, ''))
const 예 = L.모델셈(L.예시모델())

const 브 = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'], env: { ...process.env, LANG: 'C.UTF-8', LC_ALL: 'C.UTF-8' } })
for (const 기기 of 기기들) {
  const 판 = await 브.newContext({ viewport: { width: 기기 === '폰' ? 390 : 1280, height: 900 }, locale: 'ko-KR', acceptDownloads: true, hasTouch: 기기 === '폰' })
  await 판.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|geojs/, (r) => r.fulfill({ status: 200, body: '' }))
  await 판.route(/firebaseio\.com/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await 판.addInitScript(() => { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); try { sessionStorage.setItem('kcm_notice_seen', '2026-10-업체'); sessionStorage.setItem('kcm_visit_s', '1') } catch (e) {}; Object.defineProperty(navigator, 'webdriver', { get: () => false }) })
  const A = await 판.newPage()
  const 오류 = []
  A.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
  A.on('dialog', (d) => d.accept())
  console.log('— ' + 기기)
  await A.goto(주소 + '/jeoksan/model', { waitUntil: 'domcontentloaded' })
  await A.waitForSelector('text=골조 모델 — 세우면 물량', { timeout: 30000 })
  const 합읽기 = async () => {
    const t = await A.locator('.gmd-sum').first().innerText()
    const m = t.match(/콘크리트\s*([\d,.]+)[\s\S]*거푸집\s*([\d,.]+)[\s\S]*철근\s*([\d,.]+)/)
    return m ? { 콘: 숫(m[1]), 틀: 숫(m[2]), 철: 숫(m[3]) } : null
  }
  /* 셈은 한 박자 늦게(useDeferredValue) — 두 번 읽어 같을 때까지 기다림 */
  const 합안정 = async () => { let a = await 합읽기(); for (let k = 0; k < 20; k++) { await A.waitForTimeout(250); const b = await 합읽기(); if (JSON.stringify(a) === JSON.stringify(b)) return b; a = b } return a }
  const 수 = async (종) => Number(((await A.locator('.gmd-legend').innerText()).match(new RegExp(종 + '\\s+(\\d+)')) || [])[1] || -1)

  /* ① 예시 */
  await A.getByText('가상 예시(2층 라멘조)로 해 보기').click()
  await A.waitForSelector('.gmd-sum')
  const h = await 합안정()
  봐(h && h.콘 === +예.합.콘크리트.toFixed(3) && h.틀 === +예.합.거푸집.toFixed(2) && h.철 === +(예.합.철근 / 1000).toFixed(3), `${기기} 예시 합 = lib (콘 ${예.합.콘크리트.toFixed(3)} · 틀 ${예.합.거푸집.toFixed(2)} · 철 ${(예.합.철근 / 1000).toFixed(3)})`, JSON.stringify(h))
  봐((await A.locator('canvas').count()) === 1, `${기기} 3D 그림판 있음`)

  /* ③ 고르기 · 지우기 · 되돌리기 */
  await A.getByRole('button', { name: '👆 고르기' }).click()
  await A.locator('svg.gmd-svg g.gmd-m[data-k^="보"]').nth(3).click({ force: true })
  const 고름 = await A.locator('.gmd-pick').innerText().catch(() => '')
  봐(/1층 보 G[12]/.test(고름) && /콘크리트\s*[\d.]+/.test(고름) && /안목 6400|안목 5400/.test(고름), `${기기} 고르기 — 보 물량 · 안목`, 고름.slice(0, 200))
  const 보전 = await 수('보')
  await A.getByRole('button', { name: '✕ 지우기' }).click()
  await A.locator('svg.gmd-svg g.gmd-m[data-k^="보"]').nth(0).click({ force: true })
  봐((await 수('보')) === 보전 - 1, `${기기} 지우기 — 보 하나 줄어듦`, (await 수('보')) + ' / ' + 보전)
  await A.getByRole('button', { name: '↶ 되돌리기' }).click()
  봐((await 수('보')) === 보전, `${기기} 되돌리기 — 다시 ${보전}`, await 수('보'))

  /* ④ 엑셀 */
  await A.getByRole('tab', { name: '④ 물량 · 엑셀' }).click()
  const [dl] = await Promise.all([A.waitForEvent('download', { timeout: 60000 }), A.getByRole('button', { name: /엑셀 산출서 받기/ }).click()])
  const 받은곳 = path.join(process.env.OUT || '/tmp', '골조모델_시험_' + 기기 + '.xlsx')
  await dl.saveAs(받은곳)
  const 책 = readWorkbook(new Uint8Array(fs.readFileSync(받은곳)))
  const 이름들 = Object.keys(책)
  봐(['산출서', '부재별', '모델'].every((n) => 이름들.includes(n)) && 이름들.some((n) => /집계/.test(n)), `${기기} 엑셀 시트 — ${이름들.join(' · ')}`)
  const 산 = 책['산출서'] || []
  const 머 = 산[0] || []
  /* 수량 칸은 =ROUND(산출근거,3) 수식(값은 엑셀이 셈) → 산출근거 칸을 같은 셈으로 다시 셈해 더함 (LibreOffice 다시 셈은 검증 때 따로) */
  const k항 = 머.indexOf('항목'), k식 = 머.indexOf('산출근거')
  const 콘합 = 산.slice(1).filter((r) => r[k항] === '콘크리트').reduce((a, r) => a + Math.round(calc(String(r[k식]), {}, 6).val * 1000) / 1000, 0)
  봐(Math.abs(콘합 - 예.합.콘크리트) < 1e-6, `${기기} 엑셀 산출서 콘크리트(산출근거 다시 셈) 합 = lib ${예.합.콘크리트.toFixed(3)}`, 콘합)
  봐(/골조모델_/.test(dl.suggestedFilename()), `${기기} 받은 이름 «${dl.suggestedFilename()}»`)

  /* ② 새로 세우기 */
  await A.getByRole('button', { name: '새로', exact: true }).click()
  await A.getByRole('tab', { name: '③ 세우기 · 3D' }).click()
  await A.getByRole('button', { name: '▣ 기둥' }).click()
  await A.locator('svg.gmd-svg g.gmd-nodeg[data-node="X1-Y1"]').click()
  봐((await 수('기둥')) === 1, `${기기} 교점 누름 → 기둥 1`)
  await A.getByRole('button', { name: /모든 교점에 C1/ }).click()
  봐((await 수('기둥')) === 6, `${기기} «모든 교점에» → 기둥 6(3×2)`, await 수('기둥'))
  await A.getByRole('button', { name: '━ 보' }).click()
  await A.locator('svg.gmd-svg g.gmd-nodeg[data-node="X1-Y1"]').click()
  await A.locator('svg.gmd-svg g.gmd-nodeg[data-node="X3-Y1"]').click()
  봐((await 수('보')) === 2, `${기기} 교점 둘(X1 → X3) → 보 2(칸마다)`, await 수('보'))
  await A.getByRole('button', { name: /바깥 둘레에 G1/ }).click()
  봐((await 수('보')) === 6, `${기기} «바깥 둘레에» → 보 6(같은 자리는 안 늚)`, await 수('보'))
  await A.getByRole('button', { name: '▦ 슬라브' }).click()
  await A.locator('svg.gmd-svg rect.gmd-cell').first().click()
  봐((await 수('슬라브')) === 1, `${기기} 칸 누름 → 슬라브 1`, await 수('슬라브'))
  await A.getByRole('button', { name: /모든 칸에 S1/ }).click()
  봐((await 수('슬라브')) === 2, `${기기} «모든 칸에» → 슬라브 2`, await 수('슬라브'))
  /* 층 더하기 → 층 복사 */
  await A.getByRole('tab', { name: '① 통심 · 층' }).click()
  await A.getByRole('button', { name: '＋ 위로 층 더하기' }).click()
  await A.getByRole('tab', { name: '③ 세우기 · 3D' }).click()
  await A.locator('.gmd-bar.small label', { hasText: '2층' }).locator('input').check()
  await A.getByRole('button', { name: '복사', exact: true }).click()
  const 층글 = await A.locator('.gmd-build select').first().locator('option').allInnerTexts()
  봐(층글.some((t) => /^2층 · 14$/.test(t.trim())) && 층글.some((t) => /^1층 · 14$/.test(t.trim())), `${기기} 층 복사 → 2층 부재 14(기둥 6 · 보 6 · 슬라브 2 — 1층과 같음)`, 층글.join(' | '))
  const s2 = await 합안정()
  /* ⑤ 새로고침해도 남음 */
  await A.waitForTimeout(700)
  await A.reload({ waitUntil: 'domcontentloaded' })
  await A.waitForSelector('.gmd-tabs')
  await A.getByRole('tab', { name: '③ 세우기 · 3D' }).click()
  const s3 = await 합안정()
  봐(s2 && s3 && s2.콘 === s3.콘 && s2.콘 > 0, `${기기} 새로고침해도 모델 남음(콘크리트 ${s3 && s3.콘})`, JSON.stringify([s2, s3]))
  봐(오류.length === 0, `${기기} 화면 오류 없음`, 오류.join(' | '))
  if (기기 === '폰') {
    const 넘침 = await A.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    봐(넘침 <= 1, `${기기} 가로 넘침 없음`, 넘침)
  }
  /* ⑥ 작업 화면 — 남(운영자 아님)에게는 없음 */
  봐((await A.locator('.gmd-ws-open').count()) === 0, `${기기} 남에게 «작업 화면» 단추 없음`)
  await A.goto(주소 + '/jeoksan/model?ws=1', { waitUntil: 'domcontentloaded' }); await A.waitForSelector('.gmd-tabs'); await A.waitForTimeout(800)
  봐((await A.locator('.gmd-ws').count()) === 0, `${기기} 남에게 ?ws=1 로도 안 열림`)
  await 판.close()
  /* ⑥ 운영자(소장님 브라우저 표식 kcm_op) */
  const 판2 = await 브.newContext({ viewport: { width: 기기 === '폰' ? 390 : 1440, height: 900 }, locale: 'ko-KR', hasTouch: 기기 === '폰' })
  await 판2.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|geojs/, (r) => r.fulfill({ status: 200, body: '' }))
  await 판2.route(/firebaseio\.com/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await 판2.addInitScript(() => { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); localStorage.setItem('kcm_op', '1'); try { sessionStorage.setItem('kcm_notice_seen', '2026-10-업체'); sessionStorage.setItem('kcm_visit_s', '1') } catch (e) {} })
  const B = await 판2.newPage()
  const 오류2 = []
  B.on('pageerror', (e) => 오류2.push(String(e).slice(0, 200)))
  await B.goto(주소 + '/jeoksan/model', { waitUntil: 'domcontentloaded' })
  await B.waitForSelector('text=골조 모델 — 세우면 물량', { timeout: 30000 })
  await B.getByText('가상 예시(2층 라멘조)로 해 보기').click()
  await B.locator('.gmd-ws-open').click()
  await B.waitForSelector('.gmd-ws canvas', { timeout: 30000 })
  await B.waitForTimeout(800)
  const 재 = await B.evaluate(() => { const c = document.querySelector('.gmd-ws canvas').getBoundingClientRect(); return { cw: c.width, w: innerWidth, 넘침: document.documentElement.scrollWidth - innerWidth, q: location.search, 왼: !!document.querySelector('.gmd-ws-left'), 오른: !!document.querySelector('.gmd-ws-right .gmd-sum') } })
  봐(재.왼 && 재.오른 && 재.q === '?ws=1', `${기기} 작업 화면 — 왼쪽 도구 · 오른쪽 물량 · 주소 ?ws=1`, JSON.stringify(재))
  if (기기 === 'PC') 봐(재.cw > 0.55 * 재.w, `PC 작업 화면 3D 폭 ${Math.round(재.cw)} > 화면 55 %`, JSON.stringify(재))
  else 봐(재.넘침 <= 1, `폰 작업 화면 가로 넘침 없음`, 재.넘침)
  const 합1 = await B.locator('.gmd-ws-right .gmd-sum').innerText()
  봐(/212\.014/.test(합1), `${기기} 작업 화면 합 = 예시(212.014 ㎥)`, 합1)
  /* 2층 · 평면 · 고르기 */
  await B.locator('.gmd-ws-floor', { hasText: '2층' }).click()
  await B.getByRole('button', { name: '📐 평면' }).click()
  await B.getByRole('button', { name: '👆 고르기' }).click()
  await B.locator('svg.gmd-svg g.gmd-m[data-k^="보"]').nth(2).click({ force: true })
  봐(/2층 보 G1/.test(await B.locator('.gmd-ws-right .gmd-pick').innerText().catch(() => '')), `${기기} 작업 화면 고르기 → 오른쪽에 2층 보 G1`)
  /* 새 층에 기둥 하나 — 1층 · 기둥 · 교점 */
  await B.locator('.gmd-ws-floor', { hasText: '1층' }).click()
  await B.getByRole('button', { name: '✕ 지우기' }).click()
  const n0 = await B.locator('svg.gmd-svg g.gmd-m').count()
  await B.locator('svg.gmd-svg rect.gmd-m, svg.gmd-svg circle.gmd-m').first().click({ force: true })
  const n1 = await B.locator('svg.gmd-svg g.gmd-m, svg.gmd-svg rect.gmd-m, svg.gmd-svg circle.gmd-m').count()
  await B.getByRole('button', { name: '▣ 기둥' }).click()
  await B.locator('svg.gmd-svg g.gmd-nodeg[data-node="X1-Y1"]').click()
  const n2 = await B.locator('svg.gmd-svg g.gmd-m, svg.gmd-svg rect.gmd-m, svg.gmd-svg circle.gmd-m').count()
  봐(n2 === n1 + 1, `${기기} 작업 화면 — 지운 기둥 자리에 다시 세움(${n1} → ${n2})`, [n0, n1, n2])
  await B.getByRole('button', { name: '◫ 나란히' }).click()
  봐((await B.locator('.gmd-ws .gmd-plan').isVisible()) && (await B.locator('.gmd-ws .gmd-3d').isVisible()), `${기기} 나란히 — 평면 · 3D 둘 다`)
  await B.getByRole('button', { name: '✕ 나가기' }).click()
  봐((await B.locator('.gmd-ws').count()) === 0 && (await B.evaluate(() => location.search)) === '', `${기기} 나가기 — 작업 화면 닫힘 · 주소 ?ws 지움`)
  await B.goto(주소 + '/jeoksan/model?ws=1', { waitUntil: 'domcontentloaded' })
  await B.waitForSelector('.gmd-ws', { timeout: 30000 })
  봐(true, `${기기} 운영자는 ?ws=1 로 바로 작업 화면`)
  봐(오류2.length === 0, `${기기} 작업 화면 오류 없음`, 오류2.join(' | '))
  await 판2.close()
}
await 브.close()
console.log(`\n${ok} 맞음 · ${bad} 틀림`)
if (bad) process.exit(1)
