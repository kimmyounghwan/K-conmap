// 🧪 골조 모델(/jeoksan/model) 화면 — 실제로 눌러 세워 보기 · G386 (2026-10-23)
//   4998 에 화면 빌드를 얹은 뒤  node tools/시험_골조모델화면.mjs [PC|폰|모두]   (엑셀 다시 셈: OUT=폴더 를 주면 받은 엑셀을 거기에 둠)
//   ① 예시 → 화면 합(콘크리트 · 거푸집 · 철근) = lib 모델셈(예시모델)
//   ② 새로 → 통심 3×2 칸 · 1층: 교점 누름 = 기둥 · 교점 둘 = 보(칸마다 나뉨) · 칸 누름 = 슬라브 · «모든 교점에» · 층 더하기 → 층 복사 → 2층 부재 수 같음(14)
//   ③ 고르기 → 누른 보의 물량이 나옴 · 지우기 → 하나 줄어듦 · 되돌리기 → 다시 늘어남
//   ④ 엑셀 받기 → 시트(산출서 · 집계 · 부재별 · 모델) · 산출서 수량 칸 합(콘크리트) = lib
//   ⑤ 새로고침해도 모델이 남음(이 브라우저 저장) · 🔧 G392 보조 통심 더하기(빈칸 알림 · «3,500 mm» · 같은 자리) · 화면 오류 없음 · 폰 가로 넘침 없음
//   ⑥ 🖥 G388 작업 화면(🔒 운영자만) — 남에게는 단추 · ?ws=1 모두 없음 · 운영자: 열면 왼쪽 도구 · 가운데 3D(PC 화면 폭 절반 넘게) · 오른쪽 물량 ·
//      그 안에서 기둥 세우기 · 고르기 · 평면 / 나란히 · 나가면 주소 ?ws=1 지움 · 폰 가로 넘침 없음
//   ⑩ 🟨 G392 건설맵 제안(MAT) — 모델 열기 → «🟨 건설맵이 먼저 세운 것 1곳» · 하나씩 보기 → 제안 카드(두께) · ✓ 이대로 → 줄 사라짐 · 합 그대로 ·
//      다시 열고 🚶 둘러보기 → FT MAT 위에서 «❓ … 맞나요?» 퀘스트 → ✓ 맞음 → 빨간 곳 0
//   ⑨ 📚 G391 도면함 — 평면 다 세움 · 🧹 비우고 · ▶ 가장 아래층부터 · 📥 하나씩 = 한꺼번에(합) · 📤 빼기 · 다시 가져오기 · 🔄 다시 · 폰 넘침 없음
//   ⑦ 📐 G389 작업 화면 «도면 넣기»(🔒 운영자만) — 가상 예시 도면(BIM_예시_3층.dxf)을 넣으면 좌표대로 세움:
//      부재 수 · 화면 합 = lib(골조읽기 → BIM 모델 → 도면에서모델 → 모델셈) · 견줌표(도면 셈) · 못 옮긴 것 없음 · 되돌리기 → 전 모델 · 오류 없음 · 폰 넘침 없음
//   ⑧ 🚶 G390 둘러보기(🔒 운영자만) — 캐릭터 넷 고르기(수아 · 얼굴 그림 · 파일 받음) · 걷기(방향키) · ⬆ 층 · 🖱 누르면 그리로 · ▶ 자동(확인 늘어남) · 👁 눈으로 · 📝 점검사항 · ✕ 그만 · 고른 사람 기억 ·
//      ✂ 둘로(고른 보) → 부재 하나 늘고 콘크리트 · 거푸집 · 철근 합 그대로 · 오류 없음 · 폰 넘침 없음
import { createRequire } from 'module'
import fs from 'fs'
import path from 'path'
import * as L from '../web/src/lib/골조모델.js'
import { readWorkbook } from '../web/src/lib/qtoxlsx.js'
import { calc } from '../web/src/lib/susik.js'
import os from 'os'
import { decodeBytes } from '../web/src/lib/dxf3d.js'
import { 도면읽기끝까지 } from '../web/src/lib/끝까지읽기.js'
import { 단위배율 } from '../web/src/lib/골조도면.js'
import { 골조읽기 } from '../web/src/lib/골조자동.js'
import { 플랜트다듬기, 플랜트모델 } from '../web/src/lib/플랜트기초.js'
import { 셈방법입히기 } from '../web/src/lib/셈방법.js'
import { 모델만들기, 층고바꾸기, 겹친것빼기 } from '../web/src/lib/BIM모델.js'
import { 참조끼우기 } from '../web/src/lib/골조끼움.js'
import { 도면에서모델 } from '../web/src/lib/도면모델.js'
const require = createRequire('/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const 주소 = process.env.B || 'http://127.0.0.1:4998'
const 기기들 = (process.argv[2] || '모두') === '모두' ? ['PC', '폰'] : [process.argv[2]]
let ok = 0, bad = 0
const 봐 = (c, m, 더 = '') => { if (c) ok++; else bad++; console.log(c ? '✓' : '✗', m, c ? '' : String(더).slice(0, 300)) }
const 숫 = (t) => Number(String(t).replace(/,/g, ''))
const 예 = L.모델셈(L.예시모델())
/* ⑦ 가상 예시 도면 — lib 로 같은 길(작업 화면 lib/도면넣기.js 와 같음) · 한글 경로는 setInputFiles 가 조용히 실패해 영문 사본 */
const 예도면 = path.join(os.tmpdir(), 'kcm_g389_ex3.dxf')
fs.copyFileSync(new URL('../web/public/jeoksan/BIM_예시_3층.dxf', import.meta.url), 예도면)
const 도면예 = (() => {
  const b = fs.readFileSync(예도면)
  const D = 도면읽기끝까지(decodeBytes(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)), () => {})
  let 들 = [{ 모델: D, 이름: 'kcm_g389_ex3.dxf', k: 단위배율(D.units, D.box, D.ox, D.oy).k || 1 }]
  try { 들 = 참조끼우기(들).들 } catch (e) { /* 그대로 */ }
  const R = 플랜트다듬기(들, 골조읽기(들))
  const 모델 = 플랜트모델(모델만들기(들, R, { 높이: {} }), R)
  const 공사 = 셈방법입히기(겹친것빼기(층고바꾸기(R.공사, {}, R.읽음 && R.읽음.높이), 모델), '도면')
  const r = 도면에서모델(모델, { 공사 })
  return { ...r, S: L.모델셈(r.M) }
})()

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
  /* 🔧 G392 체크하면 «복사하면 얼마나 늘어나는지» 미리 · 단추 «📋 2층에 복사»(소장님 「체크하면 변해야 하는 거 아니야」) */
  await A.waitForTimeout(600)
  const 미리 = await A.locator('.gmd-copyprev[role=status]').innerText().catch(() => '')
  봐(/부재 \+14개/.test(미리) && /콘크리트 \+/.test(미리) && /체크만으로는/.test(미리), `${기기} 층 복사 미리 — 체크하면 «부재 +14개 · 콘크리트 +…» 보임`, 미리)
  await A.getByRole('button', { name: '📋 2층에 복사' }).click()
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
  /* 🔧 G392 보조 통심 더하기(소장님 폰 「더하기가 안돼」) — 빈칸이면 알림 · 3500 → «X1+3500»(첫 줄에서) · 같은 자리는 알림 */
  {
    await A.getByRole('tab', { name: /통심/ }).first().click()
    await A.waitForTimeout(300)
    const 더 = A.getByRole('button', { name: '더하기', exact: true })
    await 더.click()
    const 알1 = (await A.locator('[role=status]').allInnerTexts()).join(' ')
    await A.locator('input[placeholder="첫 줄에서 거리 mm"]').fill('3,500 mm')
    await 더.click()
    await A.waitForTimeout(300)
    const 알2 = (await A.locator('[role=status]').allInnerTexts()).join(' ')
    const 이름들 = await A.locator('input.gmd-in').evaluateAll((a) => a.map((x) => x.value))
    await A.locator('input[placeholder="첫 줄에서 거리 mm"]').fill('3500')
    await 더.click()
    await A.waitForTimeout(300)
    const 알3 = (await A.locator('[role=status]').allInnerTexts()).join(' ')
    봐(/숫자로/.test(알1) && /X1\+3500/.test(알2) && 이름들.includes('X1+3500') && /이미/.test(알3), `${기기} 보조 통심 더하기 — 빈칸 알림 · «3,500 mm» → X1+3500 · 같은 자리 알림`, [알1, 알2, 알3].join(' / '))
  }
  봐(오류.length === 0, `${기기} 화면 오류 없음`, 오류.join(' | '))
  if (기기 === '폰') {
    const 넘침 = await A.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    봐(넘침 <= 1, `${기기} 가로 넘침 없음`, 넘침)
  }
  /* ⑥ 작업 화면 — 남(운영자 아님)에게는 없음 */
  봐((await A.locator('.gmd-ws-open').count()) === 0, `${기기} 남에게 «작업 화면» 단추 없음`)
  봐((await A.locator('.gmd-ws-dwg, .gmd-ws-dwgin').count()) === 0 && !(await A.content()).includes('도면 넣기'), `${기기} 남에게 «도면 넣기» 없음`)
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
  /* ⑦ 📐 도면 넣기 — 가상 예시 도면 → 좌표대로 세움 */
  B.once('dialog', (d) => d.accept())
  await B.locator('.gmd-ws-dwgin').setInputFiles(예도면)
  await B.waitForSelector('.gmd-dwgres', { timeout: 60000 })
  await B.waitForTimeout(1200)
  const 결 = await B.locator('.gmd-dwgres').innerText()
  봐(new RegExp('부재 ' + 도면예.옮김 + '개').test(결) && 도면예.옮김 > 100, `${기기} 도면 넣기 — 부재 ${도면예.옮김}개 세움`, 결.slice(0, 200))
  const 합2 = await B.locator('.gmd-ws-right .gmd-sum').innerText()
  봐(합2.includes(도면예.S.합.콘크리트.toLocaleString('ko-KR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })), `${기기} 도면 넣기 — 화면 합 = lib(${도면예.S.합.콘크리트.toFixed(3)} ㎥)`, 합2)
  봐(도면예.못옮김.length === 0 && !/못 옮긴 것/.test(결), `${기기} 가상 예시 도면 — 못 옮긴 것 없음`, 결)
  봐(/기둥/.test(결) && /도면 셈/.test(결) && (await B.locator('.gmd-dwgres tbody tr').count()) >= 4, `${기기} 견줌표(도면 셈 ↔ 이 모델) 보임`)
  봐(도면예.S.검사.every((z) => z.좋음), `가상 예시 도면 모델 검사 모두 ✓(덩어리 = 산출서 · 겹침 없음)`, 도면예.S.검사.map((z) => z.글).join(' / '))
  const 층수 = await B.locator('.gmd-ws-floor').count()
  봐(층수 === 도면예.M.층.length, `${기기} 도면 층 ${층수}개 = lib`, 층수)
  if (기기 === '폰') 봐((await B.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 1, `폰 도면 넣은 뒤 가로 넘침 없음`)
  /* ⑨ 📚 G391 도면함 — 비우고 · 아래층부터 하나씩 가져오기 → 합 = 한꺼번에 · 빼기 → 줄고 · 다시 가져오면 그대로 · 🔄 다시 → 그대로 */
  const 함 = B.locator('.gmd-box')
  const 함글0 = await 함.innerText()
  const 장 = +(함글0.match(/세운 \d+ \/ (\d+)장/) || [])[1]
  봐(장 > 0 && new RegExp('세운 ' + 장 + ' / ' + 장 + '장').test(함글0), `${기기} 📚 도면함 — 평면 ${장}장 모두 세움`, 함글0.slice(0, 160))
  B.once('dialog', (d) => d.accept())
  await 함.getByRole('button', { name: '🧹 비우고 하나씩' }).click()
  await B.waitForTimeout(500)
  봐(/세운 0 \//.test(await 함.innerText()) && (await 함.locator('li.next').count()) === 1, `${기기} 🧹 비우고 — 세운 0장 · ▶ 다음 하나`)
  const 첫다음 = await 함.locator('li.next').innerText()
  봐(!도면예.M.층.some((f) => f.이름 === 'FT') || /기초/.test(첫다음), `${기기} ▶ 다음 = 가장 아래층(기초)부터 — ${첫다음.split('\n')[0]}`, 첫다음)
  let 가져옴 = 0
  for (let i = 0; i < 장 + 2 && (await 함.locator('li.next').count()); i++) { await 함.locator('li.next button', { hasText: '가져오기' }).click(); await B.waitForTimeout(500); 가져옴++ }
  const 합5 = await B.locator('.gmd-ws-right .gmd-sum').innerText()
  봐(가져옴 === 장 && 합5 === 합2 && new RegExp('세운 ' + 장 + ' / ' + 장 + '장').test(await 함.innerText()), `${기기} 📥 하나씩 ${가져옴}장 → 합 = 한꺼번에(${합5.replace(/\n/g, ' ')})`, 합2 + ' → ' + 합5)
  await 함.locator('li').first().getByRole('button', { name: '📤 빼기' }).click()
  await B.waitForTimeout(500)
  const 합6 = await B.locator('.gmd-ws-right .gmd-sum').innerText()
  await 함.locator('li.next button', { hasText: '가져오기' }).click()
  await B.waitForTimeout(500)
  const 합7 = await B.locator('.gmd-ws-right .gmd-sum').innerText()
  봐(합6 !== 합2 && 합7 === 합2, `${기기} 📤 빼기 → 줄고 · 📥 다시 가져오면 그대로`, [합6, 합7].join(' | '))
  await 함.locator('li').nth(1).getByRole('button', { name: '🔄 다시' }).click()
  await B.waitForTimeout(500)
  봐((await B.locator('.gmd-ws-right .gmd-sum').innerText()) === 합2, `${기기} 🔄 다시 — 합 그대로`)
  if (기기 === '폰') 봐((await B.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 1, `폰 도면함 가로 넘침 없음`)
  for (let i = 0; i < 30 && !/212\.014/.test(await B.locator('.gmd-ws-right .gmd-sum').innerText()) && (await B.getByTitle('되돌리기').isEnabled()); i++) { await B.getByTitle('되돌리기').click(); await B.waitForTimeout(250) }
  await B.waitForTimeout(500)
  봐(/212\.014/.test(await B.locator('.gmd-ws-right .gmd-sum').innerText()), `${기기} 되돌리기 → 도면 넣기 전 모델(예시 212.014)`)
  /* ⑧ 🚶 둘러보기 */
  await B.locator('.gmd-walkbtn').click()
  await B.waitForSelector('.gwk-pick', { timeout: 15000 })
  const 카드 = await B.locator('.gwk-card').allInnerTexts()
  봐(카드.length === 4 && ['수아', '리나', '하나', '유나'].every((k, i) => 카드[i].startsWith(k)), `${기기} 둘러보기 — 캐릭터 넷(수아 · 리나 · 하나 · 유나 · 여자만)`, 카드.join(' / '))
  봐((await B.locator('.gwk-thumb').evaluateAll((a) => a.filter((im) => im.complete && im.naturalWidth > 0).length)) === 4, `${기기} 캐릭터 얼굴 그림 넷 보임`)
  await B.locator('.gwk-card', { hasText: '수아' }).click()
  await B.locator('.gwk-go').click()
  await B.waitForFunction(() => !/불러오는 중|받지 못했/.test((document.querySelector('.gwk') || {}).innerText || ''), null, { timeout: 30000 }).catch(() => {})
  봐(!/받지 못했/.test(await B.locator('.gwk').innerText()), `${기기} 캐릭터(수아 · /jeoksan/char/f.vrm) 받음`)
  await B.waitForTimeout(600)
  const 허1 = await B.locator('.gwk-hud').innerText()
  봐(/🧭/.test(허1) && /확인/.test(허1) && (await B.locator('.gwk-pick').count()) === 0, `${기기} 둘러보기 시작 — ${허1.replace(/\n/g, ' ')}`)
  await B.locator('canvas').first().focus().catch(() => {})
  await B.keyboard.down('ArrowUp'); await B.waitForTimeout(1500); await B.keyboard.up('ArrowUp')
  await B.waitForTimeout(500)
  봐((await B.locator('.gwk-near').count()) > 0 || /확인 [1-9]/.test(await B.locator('.gwk-hud').innerText()), `${기기} 걸으면 가까운 부재 · 확인`)
  const 층1 = (await B.locator('.gwk-hud b').first().innerText())
  await B.locator('.gwk-acts button', { hasText: '⬆' }).click()
  await B.waitForTimeout(500)
  const 층2 = (await B.locator('.gwk-hud b').first().innerText())
  봐(층1 !== 층2, `${기기} ⬆ 위층 — ${층1} → ${층2}`)
  /* 🖱 누른 곳으로 걷기 — 3D 가운데 아래(사람 앞 바닥)를 누름 → «🖱» 알림 · 걸어감(확인 · 가까운 부재 바뀜) */
  {
    const cv = B.locator('.gmd-ws .gmd-3d canvas').first(), bx = await cv.boundingBox()
    const 확0 = await B.locator('.gwk-hud').innerText()
    await B.mouse.click(bx.x + bx.width * 0.7, bx.y + bx.height * 0.62)
    await B.waitForTimeout(300)
    const 알 = (await B.locator('.gwk-msg').allInnerTexts()).join(' ')
    await B.waitForTimeout(2500)
    봐(/🖱/.test(알), `${기기} 🖱 3D 를 누르면 그리로 걸어감 — «${알.replace(/\n|✕/g, '').trim()}»`, 알 + ' / ' + 확0)
  }
  await B.getByRole('button', { name: '▶ 자동' }).click()
  await B.waitForTimeout(4500)
  봐(/확인 [1-9]/.test(await B.locator('.gwk-hud').innerText()), `${기기} ▶ 자동 — 확인 늘어남`, await B.locator('.gwk-hud').innerText())
  await B.getByRole('button', { name: /멈춤/ }).click().catch(() => {})
  await B.getByRole('button', { name: '👁 눈으로' }).click()
  await B.waitForTimeout(300)
  봐((await B.getByRole('button', { name: '🎥 뒤에서' }).count()) === 1, `${기기} 👁 눈으로 ↔ 🎥 뒤에서`)
  await B.getByRole('button', { name: '📝 점검사항에 넣기' }).click()
  await B.locator('.gwk-memo input').fill('보 춤 도면과 확인')
  await B.locator('.gwk-memo input').press('Enter')
  await B.waitForTimeout(400)
  봐(/점검사항 1개/.test(await B.locator('.gmd-chk summary').innerText().catch(() => '')), `${기기} 📝 점검사항 1개(오른쪽)`)
  if (기기 === '폰') 봐((await B.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 1, `폰 둘러보기 가로 넘침 없음`)
  await B.getByRole('button', { name: '✕ 그만' }).click()
  await B.waitForTimeout(400)
  봐((await B.locator('.gwk').count()) === 0 && (await B.evaluate(() => JSON.parse(localStorage.getItem('kcm.walker') || '{}').키)) === '수아', `${기기} ✕ 그만 · 고른 사람(수아) 기억`)
  /* ✂ 고른 보를 둘로 — 합 그대로 */
  const 합3 = await B.locator('.gmd-ws-right .gmd-sum').innerText()
  await B.getByRole('button', { name: '📐 평면' }).click()
  await B.getByRole('button', { name: '👆 고르기' }).click()
  const 수0 = await B.locator('svg.gmd-svg g.gmd-m').count()
  await B.locator('svg.gmd-svg g.gmd-m[data-k^="보"]').nth(1).click({ force: true })        // 보 · 벽이 겹친 자리 — 고른 것(보 또는 벽)을 나눔
  const 고른글 = (await B.locator('.gmd-ws-right .gmd-pick b').first().innerText()).trim()
  await B.getByRole('button', { name: '✂ 둘로' }).click()
  await B.waitForTimeout(900)
  const 수1 = await B.locator('svg.gmd-svg g.gmd-m').count()
  const 합4 = await B.locator('.gmd-ws-right .gmd-sum').innerText()
  봐(/보|벽/.test(고른글) && 수1 === 수0 + 1 && 합4 === 합3, `${기기} ✂ 둘로(${고른글}) — 부재 ${수0} → ${수1} · 합 그대로(${합4.replace(/\n/g, ' ')})`, 합3 + ' → ' + 합4)
  /* ⑩ 🟨 건설맵 제안(MAT) */
  {
    let MM = L.예시모델()
    MM = { ...MM, 부재: MM.부재.filter((o) => o.종류 !== '기초'), 배근: { ...MM.배근, 기초: [...MM.배근.기초, { 기호: 'MF1', 종류: 'MAT', 두께: 800, 하부가로: 'D22@200', 하부세로: 'D22@200', 상부가로: 'D22@200', 상부세로: 'D22@200' }] } }
    MM = { ...MM, 다음: MM.다음 + 1, 부재: [...MM.부재, { id: MM.다음, 종류: '기초', 층: 'FT', 부호: 'MF1', 판: [[-1000, -1000], [22000, -1000], [22000, 13000], [-1000, 13000]], 두께: 800, 제안: '도면 외곽선 그대로 · 두께 = 도면 높이 800 mm' }] }
    const 매트파일 = path.join(os.tmpdir(), 'kcm_g392_mat.json')
    fs.writeFileSync(매트파일, JSON.stringify(MM))
    const S매트 = L.모델셈(MM)
    const 열기 = async () => { B.once('dialog', (d) => d.accept()); await B.locator('.gmd-ws input[type=file][accept*="json"]').first().setInputFiles(매트파일); await B.waitForTimeout(900) }
    await 열기()
    const 줄 = await B.locator('.gmd-prop-sum').innerText().catch(() => '')
    봐(/1곳/.test(줄) && (await B.locator('.gmd-ws-right .gmd-sum').innerText()).includes(S매트.합.콘크리트.toLocaleString('ko-KR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })), `${기기} 🟨 건설맵이 먼저 세운 것 1곳 · 합 = lib(${S매트.합.콘크리트.toFixed(3)} ㎥ · MAT 포함)`, 줄)
    await B.locator('.gmd-prop-sum button', { hasText: '하나씩 보기' }).click()
    await B.waitForTimeout(500)
    const 카드 = await B.locator('.gmd-pick .gmd-prop').innerText().catch(() => '')
    봐(/건설맵 제안/.test(카드) && (await B.locator('.gmd-pick .gmd-prop input').first().inputValue()) === '800', `${기기} 제안 카드 — 두께 800 · ✓ 이대로 · ✕ 빼기`, 카드)
    const 합전 = await B.locator('.gmd-ws-right .gmd-sum').innerText()
    await B.locator('.gmd-pick .gmd-prop button', { hasText: '✓ 이대로' }).click()
    await B.waitForTimeout(600)
    봐((await B.locator('.gmd-prop-sum').count()) === 0 && (await B.locator('.gmd-ws-right .gmd-sum').innerText()) === 합전, `${기기} ✓ 이대로 → 🟨 줄 사라짐 · 합 그대로`)
    await 열기()
    await B.locator('.gmd-walkbtn').click()
    await B.waitForTimeout(400)
    if (await B.locator('.gwk-pick').count()) { await B.locator('.gwk-go').click() }
    await B.waitForSelector('.gwk-quest', { timeout: 8000 }).catch(() => {})
    const 퀘 = await B.locator('.gwk-quest').innerText().catch(() => '')
    const 허 = await B.locator('.gwk-hud').innerText()
    봐(/맞나요/.test(퀘) && /MF1/.test(퀘) && /빨간 곳 1/.test(허.replace(/\s+/g, ' ')), `${기기} 🎮 퀘스트 — FT MAT 위에서 «❓ MF1 맞나요?» · 빨간 곳 1`, 퀘 + ' / ' + 허)
    await B.locator('.gwk-quest button', { hasText: '✓ 맞음' }).click()
    await B.waitForTimeout(700)
    봐((await B.locator('.gwk-quest').count()) === 0 && /빨간 곳 0/.test((await B.locator('.gwk-hud').innerText()).replace(/\s+/g, ' ')), `${기기} ✓ 맞음 → 퀘스트 끝 · 빨간 곳 0`)
    if (기기 === '폰') 봐((await B.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 1, `폰 퀘스트 가로 넘침 없음`)
    await B.getByRole('button', { name: '✕ 그만' }).click()
  }
  봐(오류2.length === 0, `${기기} 작업 화면 오류 없음`, 오류2.join(' | '))
  await 판2.close()
}
await 브.close()
console.log(`\n${ok} 맞음 · ${bad} 틀림`)
if (bad) process.exit(1)
