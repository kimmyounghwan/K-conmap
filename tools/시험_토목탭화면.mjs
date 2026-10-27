// 🧪 K-적산컨맵 작업 화면 «🛣 토목» 탭 — 화면에서 실제로 눌러 보기 · G396 (2026-10-24)
//   4998 에 화면 빌드를 얹은 뒤  node tools/시험_토목탭화면.mjs [PC|폰|모두]
//   ① 🏢 건축 | 🛣 토목 — 운영자 작업 화면에 둘 · 토목 고르면 빈 화면 안내(넣을 도면 넷) · 고른 분야 기억
//   ② 🧪 예시 → 길잡이 ✓ 6 · ▶ 1 · 노선 1(가상 배수로 · 평면 노선 밖 7곳) · 측점표 26줄 = lib · 측점 성과 26/26 같음 · 토공 합 = lib(토목모델)
//   ③ 평면 누름 → 고른 자리(X · Y · 땅 EL · 경위도 · STA · 옆) = lib 자리읽기(같은 자리) · 좌표계 동부로 → 경위도 바뀜
//   ④ 📊 엑셀 → 시트(토목 집계 · 측점표 · 측점 성과 대조 · 좌표계) · 측점표 26줄 / 📍 CSV → 27줄(머리 + 26)
//   ⑤ 🧊 3D · ◫ 나란히 — 캔버스 · 오류 없음 / 예시는 저장 안 함(새로고침 → 빈 화면)
//   ⑥ «내 도면» 으로 넣으면(예시 도면 파일 넣기) 이 브라우저에 저장 → 새로고침해도 남음 → 🗑 지우면 빈 화면
//   ⑦ 🏢 건축으로 돌아가면 골조 탭 그대로 · 폰 가로 넘침 없음 · 화면 오류 없음
//   🛣🏢 G397 함께 세우기 — 예시 7장(배수로 · 배수장 · 관리동 · 3층 골조 · 흙막이) + 측점 성과 한 번에 → 🏢 골조도 같이 세움(건축 탭 모델 바뀜)
//     · 함께 합(골조 = 건축 탭 합 · 토목 · 건물 평면 = lib) · 3D 에 골조 + 토목 · 같이 보기 끄고 켜기 · 엑셀 한 권(함께 합 · 골조 산출서 · 토목)
//     · 토목 도면만 다시 넣으면 골조는 그대로(같이 보기 꺼짐 — 다른 때 세운 골조) · 토목을 지우면 빈 화면 → «골조만 여기서 보기»
//   📑 G398 내역 대조 — 빈 화면에선 단추 꺼짐 · 예시 → 🧪 예시 내역서 → 공종 · 갈래 14줄(✓ 7 · △ 3 · ✗ 2 · — 2 = lib 맞대기) · 건설맵 값 = lib
//     · ✗ 거르기 · 줄 펼침(내역 품목 행 · 근거) · 3D 갔다 돌아오기 · 엑셀에 «내역 대조»(식) · «내역 품목 판정» 시트 · 카드 ✕ 로 지우기 · 폰 가로 넘침 없음
//   ✋ G399 짝 고치기 — 줄 펼침에서 묶음 ✕(빼기) → ✓ 하나 줄고 «— » · 남은 물량에서 공종 고르기 → 다시 ✓ · ↺ 짝 처음대로 / 내 도면에서 넣은 내역서는 새로고침해도 남음 · 🗑 이면 같이 지움
import { createRequire } from 'module'
import fs from 'fs'
import path from 'path'
import os from 'os'
import * as T from '../web/src/lib/토목작업.js'
import { 토목모델 } from '../web/src/lib/BIM토목.js'
import { readWorkbook } from '../web/src/lib/qtoxlsx.js'
import { 내역열기, 건설맵묶음, 맞대기 } from '../web/src/lib/토목내역.js'
const require = createRequire('/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const 주소 = process.env.B || 'http://127.0.0.1:4998'
const 기기들 = (process.argv[2] || '모두') === '모두' ? ['PC', '폰'] : [process.argv[2]]
let ok = 0, bad = 0
const 봐 = (c, m, 더 = '') => { if (c) ok++; else bad++; console.log(c ? '✓' : '✗', m, c ? '' : String(더).slice(0, 300)) }
const 숫 = (t) => Number(String(t).replace(/[,\s㎥㎡m+]/g, ''))
/* lib 기준 — 같은 예시를 일꾼으로 */
const 공 = new URL('../web/public/jeoksan/', import.meta.url)
let 끝 = null
globalThis.self = { postMessage: (m) => { if (m.type !== 'prog') 끝 = m } }
await import('../web/src/lib/dxf3d.worker.js')
const 예이름 = ['BIM예시_측량도면.dxf', 'BIM예시_계획평면도.dxf', 'BIM예시_종횡단면도.dxf', 'BIM예시_배수장일반도.dxf']
const 예이름7 = [...예이름, 'BIM예시_관리동평면도.dxf', 'BIM_예시_3층.dxf', 'BIM예시_흙막이도.dxf']     // 🛣🏢 G397 화면 예시 = 일곱 장 같이(골조 + 토목)
await self.onmessage({ data: { files: 예이름7.map((n) => { const b = fs.readFileSync(new URL(n, 공)); return { name: n, buf: b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) } }) } })
const 성 = await T.측점성과읽기('BIM예시_측점성과.csv', fs.readFileSync(new URL('BIM예시_측점성과.csv', 공)))
const D = T.토목자료(끝.r, { 측점성과: 성 })
const 땅 = T.땅찾개(D.활용)
const 표 = T.측점표(D.활용, '가상 배수로', { 땅 })
const 토 = 토목모델(D.활용, D.center, { 뺄건물: ['BIM_예시_3층.dxf'] })     // 골조로 세운 도면은 건물 평면 덩어리에서 뺌
const 건콘 = 토.건물들.reduce((a, b) => a + b.합.콘크리트, 0)
const 예내역 = 내역열기(new Uint8Array(fs.readFileSync(new URL('BIM예시_내역서.xlsx', 공))), 'BIM예시_내역서.xlsx')     // 📑 G398
/* 내 도면으로 넣을 사본(영문 이름 — setInputFiles 한글 경로) */
const 임시 = fs.mkdtempSync(path.join(os.tmpdir(), 'kcm_g396_'))
const 사본 = 예이름.map((n, i) => { const p = path.join(임시, `civ${i + 1}.dxf`); fs.copyFileSync(new URL(n, 공), p); return p })
const 예내역파일 = path.join(임시, '예시내역.xlsx'); fs.copyFileSync(new URL('BIM예시_내역서.xlsx', 공), 예내역파일)

const 브 = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'], env: { ...process.env, LANG: 'C.UTF-8', LC_ALL: 'C.UTF-8' } })   // 한글 받은 이름(시험 기계 locale)
for (const 기기 of 기기들) {
  const 판 = await 브.newContext({ viewport: { width: 기기 === '폰' ? 390 : 1440, height: 900 }, locale: 'ko-KR', acceptDownloads: true, hasTouch: 기기 === '폰' })
  await 판.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|geojs/, (r) => r.fulfill({ status: 200, body: '' }))
  await 판.addInitScript(() => { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); localStorage.setItem('kcm_op', '1'); try { sessionStorage.setItem('kcm_notice_seen', '2026-10-업체'); sessionStorage.setItem('kcm_visit_s', '1') } catch (e) {} })
  const p = await 판.newPage()
  p.on('dialog', (d) => d.accept())
  const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e)))
  p.on('console', (m) => { if (m.type() === 'error') 오류.push(m.text().slice(0, 200)) })
  await p.goto(주소 + '/jeoksan/model?ws=1', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('.gmd-ws-field', { timeout: 30000 })
  /* ① */
  봐((await p.locator('.gmd-field').count()) === 2 && (await p.locator('.gmd-field.on').innerText()).includes('건축'), `${기기} 작업 화면에 🏢 건축 | 🛣 토목 · 처음은 건축`)
  await p.click('.gmd-field:has-text("토목")')
  await p.waitForSelector('.tmk-empty', { timeout: 30000 })
  봐((await p.locator('.tmk-need li').count()) === 5 && (await p.locator('.gmd-ws-tabs').count()) === 0 && /골조도 같이 세워/.test(await p.locator('.tmk-empty').innerText()), `${기기} 토목 빈 화면 — 넣을 자료 다섯(🏢 건축 평면 · 일람표 포함) 안내 · 골조 탭 없음`)
  봐(await p.evaluate(() => localStorage.getItem('kcm.ws.field')) === '토목', `${기기} 고른 분야 기억(토목)`)
  봐(await p.evaluate(() => { const b = document.querySelector('.tmk-nybtn'); return !!b && b.disabled && !document.querySelector('.tmk-nycard') }), `${기기} 📑 내역 대조 단추 — 빈 화면에선 꺼짐`)
  /* ② 예시 */
  await p.click('.tmk-ex')
  await p.waitForSelector('.tmk-body', { timeout: 90000 })
  await p.waitForTimeout(800)
  const 화 = await p.evaluate(() => ({
    길: [...document.querySelectorAll('.tmk-mark')].map((x) => x.textContent).join(''),
    노선: [...document.querySelectorAll('.tmk-line')].map((x) => x.textContent),
    표: [...document.querySelectorAll('.tmk-sta tbody tr')].map((tr) => [...tr.children].map((td) => td.textContent)),
    밖: document.querySelectorAll('.tmk-sta tbody tr.out').length,
    대조: [...document.querySelectorAll('.tmk-cmpg summary')].map((x) => x.textContent),
    합: [...document.querySelectorAll('.tmk-sum .tmk-kv td')].map((x) => x.textContent),
    예시: !!document.querySelector('.tmk-exnote'),
    함: [...document.querySelectorAll('.tmk-bothq tbody tr')].map((tr) => [...tr.children].map((td) => td.textContent)),
    켬: !!(document.querySelector('.tmk-both input') || {}).checked,
    함글: (document.querySelector('.tmk-both') || {}).innerText || '',
    말: (document.querySelector('.tmk-said') || {}).innerText || '',
  }))
  봐(화.길 === '✓✓✓✓✓✓▶⚠', `${기기} 길잡이 ✓ 6 · ▶ 물량 · ⚠ 🏢 골조(같은 건물 자리 못 찾아 옆 — 배치도 없음)`, 화.길)
  봐(/부재 \d+개를 좌표대로 세웠습니다/.test(화.말) && /노선 1/.test(화.말), `${기기} 한 번 넣기 → 🏢 골조 세움 + 🛣 토목(알림)`, 화.말)
  const 함행 = (k) => 화.함.find((r) => r[0].includes(k))
  const 골행 = 함행('골조'), 토행 = 함행('토목'), 건행 = 함행('건물'), 합행 = 함행('합')
  const 골조합 = 골행 ? { 콘: 숫(골행[1]), 틀: 숫(골행[2]), 철: 숫(골행[3]) } : null
  const 큰줄 = 화.함.filter((r) => !/^·/.test(r[0]))
  봐(화.켬 && /같이 넣은 도면/.test(화.함글) && 골행 && 토행 && 건행 && 합행 && 큰줄.length === 4, `${기기} 함께 합 — 같이 넣은 골조 같이 봄 · 골조 · 토목 · 건물 평면 · 합 네 줄`, JSON.stringify(화.함))
  /* 📚 G440 토목 아래 «· 노선 · · 구조물» 두 줄 — 더하면 토목 줄 */
  const 잔 = 화.함.filter((r) => /^·/.test(r[0]))
  봐(잔.length >= 2 && Math.abs(잔.reduce((a, r) => a + 숫(r[1]), 0) - 숫(토행[1])) < 0.02 && Math.abs(잔.reduce((a, r) => a + 숫(r[2]), 0) - 숫(토행[2])) < 0.2, `${기기} 🛣 토목 = · 노선 + · 구조물(G440)`, JSON.stringify(잔))
  봐(토행 && Math.abs(숫(토행[1]) - 토.합.콘크리트) < 0.006 && Math.abs(숫(토행[2]) - 토.합.거푸집) < 0.06 && 건행 && Math.abs(숫(건행[1]) - 건콘) < 0.006, `${기기} 함께 합 토목 = lib(콘크리트 ${토.합.콘크리트.toFixed(2)}) · 건물 평면(관리동) = lib(${건콘.toFixed(2)}) · 3층 골조 도면은 덩어리에서 뺌`, JSON.stringify([토행, 건행]))
  봐(골조합 && 골조합.콘 > 0 && 골조합.철 > 0 && Math.abs(숫(합행[1]) - (골조합.콘 + 숫(토행[1]) + 숫(건행[1]))) < 0.02 && Math.abs(숫(합행[3]) - 골조합.철) < 0.0006, `${기기} 합 = 골조 + 토목 + 건물 · 철근 = 골조`, JSON.stringify(합행))
  봐(/오른쪽 20 m/.test(화.함글), `${기기} 골조 자리 — 같은 건물을 못 찾아 토목 오른쪽 20 m · 땅 높이(BIM 물량 화면과 같음)`, 화.함글)
  봐(화.노선.length === 1 && /가상 배수로/.test(화.노선[0]) && /평면 노선 밖 7곳/.test(화.노선[0]) && 화.예시, `${기기} 노선 1(가상 배수로 · 밖 7곳) · 예시 알림`, 화.노선.join(' | '))
  봐(화.표.length === 표.length && 화.밖 === 7 && 화.표.every((r, i) => r[0] === 표[i].측글 && Math.abs(숫(r[2]) - 표[i].X) < 0.0006 && Math.abs(숫(r[3]) - 표[i].Y) < 0.0006), `${기기} 측점표 ${화.표.length}줄 = lib(측점 · X · Y)`, JSON.stringify(화.표.slice(0, 2)))
  봐(화.대조.length === 1 && /같음 26\/26/.test(화.대조[0]) && /0\.03 m/.test(화.대조[0]), `${기기} 측점 성과 ↔ 종단 26/26 · 시공 − 설계 최대 0.03`, 화.대조.join(' | '))
  봐(Math.abs(숫(화.합[0]) - 토.합.터파기) < 0.06 && Math.abs(숫(화.합[3]) - 토.합.콘크리트) < 0.006, `${기기} 토공 합 = lib(터파기 ${토.합.터파기.toFixed(1)} · 콘크리트 ${토.합.콘크리트.toFixed(2)})`, 화.합.join(','))
  /* ③ 평면 누름 → 자리 */
  await p.evaluate(() => document.querySelector('.tmk-canvas').scrollIntoView({ block: 'center' }))
  const bb = await (await p.$('.tmk-canvas')).boundingBox()
  await p.mouse.click(bb.x + bb.width * 0.45, bb.y + bb.height * 0.55)
  await p.waitForTimeout(400)
  const 자 = await p.evaluate(() => { const t = [...document.querySelectorAll('.tmk-spot .tmk-kv td')].map((x) => x.textContent); const n = document.querySelector('.tmk-spot .tmk-near'); return { t, n: n ? n.textContent : '' } })
  const X = 숫(자.t[0]), Y = 숫(자.t[1])
  const 다시 = T.자리읽기(D.활용, Y * 1000, X * 1000, 땅)
  봐(자.t.length >= 4 && Number.isFinite(X) && Number.isFinite(Y) && /°/.test(자.t[3]) && 다시.노선.length && 자.n.includes(다시.노선[0].측글) && 자.n.includes(다시.노선[0].STA), `${기기} 평면 누름 → X · Y · 땅 EL · 경위도 · 측점(${다시.노선[0] && 다시.노선[0].측글}) = lib 자리읽기`, JSON.stringify(자))
  const 경1 = 자.t[3]
  await p.selectOption('.tmk-crs select', '동부')
  await p.waitForTimeout(300)
  const 경2 = await p.evaluate(() => [...document.querySelectorAll('.tmk-spot .tmk-kv td')].map((x) => x.textContent)[3])
  봐(경1 !== 경2 && /°/.test(경2), `${기기} 좌표계 동부원점 → 경위도 바뀜`, 경1 + ' → ' + 경2)
  await p.selectOption('.tmk-crs select', '중부')
  /* ④ 엑셀 · CSV */
  const [받] = await Promise.all([p.waitForEvent('download', { timeout: 30000 }), p.click('.tmk-xlsx')])
  const 책 = readWorkbook(new Uint8Array(fs.readFileSync(await 받.path())))
  const 이름들 = Object.keys(책)
  const 측시 = 책['측점표 가상 배수로']
  봐(['토목 집계', '측점표 가상 배수로', '측점 성과 대조', '좌표계'].every((n) => 이름들.includes(n)) && 측시 && 측시.filter((r) => r && r.length).length === 27, `${기기} 엑셀 — 토목 집계 · 측점표 · 측점 성과 대조 · 좌표계 · 측점표 26줄`, 이름들.join(' / '))
  봐(이름들[0] === '함께 합' && ['산출서', '집계', '모델'].every((n) => 이름들.includes(n)) && new Set(이름들).size === 이름들.length && /^골조토목_/.test(받.suggestedFilename()), `${기기} 엑셀 한 권 — 첫 장 «함께 합» · 🏢 골조 산출서 · 집계 · 모델 + 🛣 토목(${이름들.length}장 · 이름 안 겹침)`, 받.suggestedFilename() + ' ' + 이름들.join(' / '))
  const 함시 = 책['함께 합'] || []
  봐(함시.some((r) => r && String(r[0]).includes('골조')) && 함시.some((r) => r && r[0] === '합계') && 함시.some((r) => r && r[0] === '골조 자리'), `${기기} 함께 합 시트 — 골조 · 토목 · 합계 · 골조 자리`, JSON.stringify(함시.map((r) => r && r[0])))
  const [받2] = await Promise.all([p.waitForEvent('download', { timeout: 30000 }), p.click('.tmk-csv')])
  const csv = fs.readFileSync(await 받2.path(), 'utf8').replace(/^﻿/, '').trim().split(/\r?\n/)
  봐(csv.length === 27 && csv[0].startsWith('노선,측점,STA') && 받2.suggestedFilename() === '측점표_가상_배수로.csv', `${기기} 측점표 CSV 27줄(머리 + 26) · 받은 이름 «${받2.suggestedFilename()}»`, csv.length)
  /* ⑤ 3D · 나란히 */
  await p.click('button:has-text("🧊 3D")'); await p.waitForTimeout(1500)
  봐((await p.locator('.tmk-canvas3d').count()) === 1 && (await p.locator('.tmk-canvas').count()) === 0, `${기기} 🧊 3D 캔버스`)
  const 셈글 = await p.locator('.tmk-3dn').innerText().catch(() => '')
  봐(/골조 \d{2,}/.test(셈글) && /토목 \d+/.test(셈글), `${기기} 3D 에 🏢 골조 + 🛣 토목 같이`, 셈글)
  /* 같이 보기 끄고 켜기 */
  await p.click('.tmk-both input'); await p.waitForTimeout(800)
  const 끈 = await p.evaluate(() => ({ 줄: [...document.querySelectorAll('.tmk-bothq tbody tr th')].map((x) => x.textContent), 셈: document.querySelectorAll('.tmk-3dn').length, 길: [...document.querySelectorAll('.tmk-mark')].map((x) => x.textContent).join('') }))
  봐(!끈.줄.some((t) => t.includes('골조')) && 끈.셈 === 0 && 끈.길 === '✓✓✓✓✓✓▶·', `${기기} 같이 보기 끔 → 골조 줄 · 3D 골조 빠짐(토목만)`, JSON.stringify(끈))
  await p.click('.tmk-both input'); await p.waitForTimeout(800)
  봐((await p.locator('.tmk-3dn').count()) === 1, `${기기} 다시 켬 → 골조 같이`)
  await p.click('button:has-text("◫ 나란히")'); await p.waitForTimeout(1200)
  봐((await p.locator('.tmk-canvas3d').count()) === 1 && (await p.locator('.tmk-canvas').count()) === 1, `${기기} ◫ 나란히 — 평면 + 3D`)
  await p.click('button:has-text("📐 평면")')
  if (기기 === 'PC') await p.screenshot({ path: path.join(임시, 'PC.png') })
  /* 📖 G401 도면 보는 차례 — 도면함 아래(docs/도면보는순서.md) */
  const 차례글 = await p.evaluate(() => [...document.querySelectorAll('.tmk-order li')].map((li) => li.textContent.replace(/\s+/g, ' ').trim()))
  봐(차례글.length === 7 && /^건축/.test(차례글[0]) && /^토목 ③ 측량/.test(차례글[2]) && /^토목 ④ .*계획평면도/.test(차례글[3]) && /^토목 ⑫/.test(차례글[6]), `${기기} 📖 G401 도면 보는 차례 — 예시 7장(건축 평면 → 토목 ③ 측량 → ④ 계획평면 → … → ⑫ 흙막이)`, JSON.stringify(차례글))
  /* 📑 G398 내역 대조 — 🧪 예시 내역서 */
  봐(!(await p.locator('.tmk-nybtn').isDisabled()) && (await p.locator('.tmk-nyex').count()) === 1, `${기기} 📑 내역 대조 단추 켜짐 · 카드에 🧪 예시 내역서`)
  await p.click('.tmk-nyex')
  await p.waitForSelector('.tmk-nyt tbody tr.tmk-nyrow', { timeout: 30000 })
  const 기대 = 맞대기(예내역, 건설맵묶음(토, { 콘크리트: 골조합.콘, 거푸집: 골조합.틀, 철근: 골조합.철, 버림: 0 }, {}), {})
  const 내 = await p.evaluate(() => ({
    줄: [...document.querySelectorAll('.tmk-nyt tbody tr.tmk-nyrow')].map((tr) => [...tr.children].map((td) => td.textContent)),
    셈: [...document.querySelectorAll('.tmk-nytable .tmk-nycount button')].map((b) => b.textContent),
    카드: (document.querySelector('.tmk-nycard') || {}).innerText || '',
    on: (document.querySelector('.gmd-ws-views button.on') || {}).textContent || '',
  }))
  봐(내.줄.length === 기대.단위들.length && 기대.단위들.length === 14 && 기대.단셈.맞음 === 7 && 기대.단셈.비슷 === 3 && 기대.단셈.다름 === 2 && 기대.단셈.없음 === 2 && ['맞음 7', '비슷 3', '다름 2', '없음 2'].every((t) => 내.셈.some((x) => x.includes(t))), `${기기} 📑 대조 표 14줄 · ✓ 7 · △ 3 · ✗ 2 · — 2 = lib 맞대기`, JSON.stringify([내.셈, 기대.단셈]))
  봐(내.줄.every((r, i) => { const d = 기대.단위들[i]; const 건 = 숫(r[4]); return r[0] === ({ 맞음: '✓', 비슷: '△', 다름: '✗', 없음: '—' })[d.판정] && (d.건설맵 > 0 ? Math.abs(건 - d.건설맵) < (d.갈래 === '철근' ? 0.0006 : 0.06) : r[4] === '—') }), `${기기} 줄마다 판정 · 건설맵 값 = lib(배수로 터파기 ${기대.단위들[0].건설맵.toFixed(1)} …)`, JSON.stringify(내.줄.slice(0, 3)))
  봐(/내역 대조/.test(내.on) && /✓ 7/.test(내.카드) && /견준 품목 12 \/ 내역 품목 20/.test(내.카드) && /· 수량/.test(내.카드), `${기기} 보기 «📑 내역 대조» 켜짐 · 카드(✓ 7 · 견준 12 / 20 · 상태 «수량»)`, 내.카드)
  await p.click('.tmk-nytable .tmk-nycount button.c-다름')
  const 거른 = await p.locator('.tmk-nyt tbody tr.tmk-nyrow').count()
  await p.click('.tmk-nytable .tmk-nycount button.c-다름')
  봐(거른 === 2 && (await p.locator('.tmk-nyt tbody tr.tmk-nyrow').count()) === 14, `${기기} ✗ 다름만 거르기 2줄 → 다시 모두 14줄`, 거른)
  await p.click('.tmk-nyrow.p-다름 >> nth=0')
  const 펼 = await p.locator('.tmk-nydetail').innerText().catch(() => '')
  봐(/건설맵[\s\S]{0,6}가상 배수로/.test(펼) && /내역 품목 — \d+행 성토/.test(펼) && /ⓘ/.test(펼) && /✋ 값 고치기/.test(펼), `${기기} 줄 펼침 — 건설맵 묶음 · 내역 품목(행) · 근거`, 펼)
  if (기기 === '폰') 봐((await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 1, `${기기} 내역 대조 표 — 가로 넘침 없음`)
  await p.click('.gmd-ws-views button:has-text("3D")'); await p.waitForTimeout(800)
  const 삼 = await p.evaluate(() => !document.querySelector('.tmk-nyt') && !!document.querySelector('.tmk-canvas3d'))
  await p.click('.gmd-ws-views button:has-text("내역 대조")'); await p.waitForTimeout(500)
  봐(삼 && (await p.locator('.tmk-nyt tbody tr.tmk-nyrow').count()) === 14, `${기기} 3D 갔다가 «📑 내역 대조» 로 돌아옴(표 그대로)`)
  /* ✋ G399 짝 고치기 — «배수로공사 콘크리트»(✓) 줄을 펼쳐 «가상 배수로» 를 빼면 — 로 · 남은 물량에서 다시 그 공종으로 → ✓ · ↺ */
  const 콘줄 = p.locator('.tmk-nyrow', { hasText: '콘크리트' }).first()
  await 콘줄.click()
  await p.click('.tmk-nydetail .tmk-nyx')
  await p.waitForTimeout(400)
  const 뺀뒤 = await p.evaluate(() => ({ 셈: [...document.querySelectorAll('.tmk-nytable .tmk-nycount button')].map((b) => b.textContent), 되돌: (document.querySelector('.tmk-nyreset') || {}).textContent || '', 남: [...document.querySelectorAll('.tmk-nyleft li')].map((x) => x.textContent), 첫: [...document.querySelectorAll('.tmk-nyrow')].find((r) => /콘크리트/.test(r.textContent)).children[0].textContent }))
  봐(뺀뒤.셈.some((x) => /맞음 6/.test(x)) && 뺀뒤.셈.some((x) => /없음 3/.test(x)) && /처음대로 1/.test(뺀뒤.되돌) && 뺀뒤.남.some((x) => /✋ 가상 배수로 · 콘크리트/.test(x)) && 뺀뒤.첫 === '—', `${기기} ✋ 묶음 빼기 → 배수로 콘크리트 «—» · ✓ 6 · 남은 물량에 ✋ · ↺ 1`, JSON.stringify(뺀뒤))
  await p.click('.tmk-nyleft summary')
  await p.selectOption('.tmk-nyleft li select.tmk-nypair', { label: '배수로공사' })
  await p.waitForTimeout(400)
  const 고른뒤 = await p.evaluate(() => ({ 셈: [...document.querySelectorAll('.tmk-nytable .tmk-nycount button')].map((b) => b.textContent), 남: document.querySelectorAll('.tmk-nyleft li').length }))
  봐(고른뒤.셈.some((x) => /맞음 7/.test(x)) && 고른뒤.남 === 0, `${기기} ✋ 남은 물량에서 «배수로공사» 고름 → 다시 ✓ 7`, JSON.stringify(고른뒤))
  await p.click('.tmk-nyreset')
  await p.waitForTimeout(300)
  봐(!(await p.locator('.tmk-nyreset').count()) && (await p.locator('.tmk-nytable .tmk-nycount button.c-맞음').textContent()).includes('7'), `${기기} ↺ 짝 처음대로 → 고친 짝 없음 · ✓ 7`)
  /* ＋ 더하기 — ✗ 배수장 거푸집 줄에 «가상 배수로» 거푸집을 더하면 값이 늘어남 */
  const 틀줄 = p.locator('.tmk-nyrow.p-다름', { hasText: '거푸집' }).first()
  await 틀줄.click()
  const 앞값 = 숫((await 틀줄.locator('td').nth(4).textContent()))
  await p.selectOption('.tmk-nydetail .tmk-nyadd select', { index: 1 })
  await p.waitForTimeout(400)
  const 뒤값 = 숫((await p.locator('.tmk-nyrow', { hasText: '배수장' }).filter({ hasText: '거푸집' }).first().locator('td').nth(4).textContent()))
  봐(뒤값 > 앞값 + 100 && /✋/.test(await p.locator('.tmk-nydetail').innerText()), `${기기} ✋ ＋ 묶음 더하기 — 배수장 거푸집 ${앞값} → ${뒤값}(✋ 표시)`, [앞값, 뒤값])
  await p.click('.tmk-nyreset')
  await p.waitForTimeout(300)
  /* ✋ 값 고치기 — ✗ 성토(52 / 37.8) 에 값 직접 52 → ✓ · 지우면 다시 ✗ / 할증 % */
  const 성줄 = p.locator('.tmk-nyrow', { hasText: '성토' }).first()
  await 성줄.click()
  await p.fill('.tmk-nydetail input[aria-label="건설맵 값 직접"]', '52')
  await p.press('.tmk-nydetail input[aria-label="건설맵 값 직접"]', 'Enter')
  await p.waitForTimeout(400)
  const 값뒤 = await p.evaluate(() => { const r = [...document.querySelectorAll('.tmk-nyrow')].find((x) => /성토/.test(x.textContent)); return { 첫: r.children[0].textContent, 건: r.children[4].textContent, 왜: (document.querySelector('.tmk-nydetail .tmk-nywhy') || {}).textContent || '' } })
  봐(값뒤.첫 === '✓' && /52/.test(값뒤.건) && /✋ 사람이 값 고침 52/.test(값뒤.왜) && /건설맵 셈 37\.8/.test(값뒤.왜), `${기기} ✋ 값 직접 52 → 성토 ✓(까닭에 건설맵 셈 37.8 남김)`, JSON.stringify(값뒤))
  await p.click('.tmk-nydetail .tmk-nyunfix')
  await p.waitForTimeout(300)
  await p.fill('.tmk-nydetail input[aria-label="할증 %"]', '10')
  await p.press('.tmk-nydetail input[aria-label="할증 %"]', 'Enter')
  await p.waitForTimeout(400)
  const 율뒤 = await p.evaluate(() => { const r = [...document.querySelectorAll('.tmk-nyrow')].find((x) => /성토/.test(x.textContent)); return r.children[4].textContent })
  봐(Math.abs(숫(율뒤) - 37.82 * 1.1) < 0.1, `${기기} ✋ 할증 10 % → 성토 건설맵 ${율뒤}(37.8 × 1.1)`, 율뒤)
  await p.click('.tmk-nyreset')
  await p.waitForTimeout(300)
  const [받3] = await Promise.all([p.waitForEvent('download', { timeout: 30000 }), p.click('.tmk-xlsx')])
  const 책3 = readWorkbook(new Uint8Array(fs.readFileSync(await 받3.path())))
  const 이3 = Object.keys(책3)
  const 대시 = 책3['내역 대조'] || [], 품시 = 책3['내역 품목 판정'] || []
  봐(이3[0] === '함께 합' && 이3[1] === '내역 대조' && 이3[2] === '내역 품목 판정' && 대시.filter((r) => r && r.length).length === 15 && 품시.filter((r) => r && r.length).length === 21 && new Set(이3).size === 이3.length, `${기기} 엑셀 — 함께 합 다음 «내역 대조» 14줄 · «내역 품목 판정» 20줄`, JSON.stringify([이3.slice(0, 4), 대시.length, 품시.length]))
  const 제시 = 책3['변경 수량 제안'] || []
  봐(이3[3] === '변경 수량 제안' && 제시.filter((r) => r && r.length).length === 13 && 제시.some((r) => r && r[2] === '성토' && Math.abs(+r[6] - 37.8) < 0.05), `${기기} 📤 G401 엑셀 «변경 수량 제안» — 견준 품목 12줄(성토 52 → 37.8)`, JSON.stringify([이3, 제시.length]))
  await p.click('.tmk-nycard button[title="내역 대조 지우기"]'); await p.waitForTimeout(500)
  봐(!(await p.locator('.tmk-nyt').count()) && (await p.locator('.tmk-nyex').count()) === 1 && !/내역 대조/.test(await p.locator('.gmd-ws-views button.on').textContent()), `${기기} 카드 ✕ → 내역 대조 지움 · 평면으로`)
  await p.reload({ waitUntil: 'domcontentloaded' })
  await p.waitForSelector('.tmk-empty', { timeout: 30000 })
  봐(true, `${기기} 예시는 저장 안 함 — 새로고침하면 빈 화면(토목 분야는 기억)`)
  /* ⑥ 내 도면으로 넣기 → 저장 → 새로고침해도 남음 → 지우기 */
  await p.setInputFiles('.tmk-in', 사본)
  await p.waitForSelector('.tmk-body', { timeout: 90000 })
  await p.waitForTimeout(800)
  봐(!(await p.locator('.tmk-exnote').count()) && (await p.locator('.tmk-line').count()) === 1, `${기기} 내 도면(예시 사본 4장) 넣기 → 노선 1 · 예시 알림 없음`)
  const 뒤 = await p.evaluate(() => ({ 켬: !!(document.querySelector('.tmk-both input') || {}).checked, 글: (document.querySelector('.tmk-both') || {}).innerText || '', 말: (document.querySelector('.tmk-said') || {}).innerText || '' }))
  봐(!뒤.켬 && /다른 때 세운 골조/.test(뒤.글) && /골조/.test(뒤.말) && /노선 1/.test(뒤.말), `${기기} 토목 도면만 넣으면 🏢 골조 모델은 그대로 · 같이 보기 꺼짐(다른 때 세운 골조 — 켜면 같이)`, JSON.stringify(뒤))
  await p.setInputFiles('.tmk-nyin', 예내역파일)
  await p.waitForSelector('.tmk-nyt tbody tr.tmk-nyrow', { timeout: 30000 })
  const 내도면대조 = await p.evaluate(() => [...document.querySelectorAll('.tmk-nytable .tmk-nycount button')].map((b) => b.textContent).join(' '))
  await p.waitForTimeout(1200)
  await p.reload({ waitUntil: 'domcontentloaded' })
  await p.waitForSelector('.tmk-body', { timeout: 30000 }).catch(() => {})
  봐((await p.locator('.tmk-line').count()) === 1, `${기기} 새로고침해도 남음(이 브라우저 IndexedDB)`)
  await p.waitForSelector('.tmk-nycard .tmk-nyfile', { timeout: 15000 }).catch(() => {})
  const 남은카드 = await p.evaluate(() => (document.querySelector('.tmk-nycard') || {}).innerText || '')
  봐(/예시내역\.xlsx/.test(남은카드) && /✓/.test(남은카드), `${기기} 📑 내 도면에서 넣은 내역서도 새로고침 뒤 남음(G399 저장) · ${내도면대조.slice(0, 40)}`, 남은카드)
  await p.click('button[title^="이 브라우저에 저장한 토목"]')
  await p.waitForSelector('.tmk-empty', { timeout: 10000 })
  await p.reload({ waitUntil: 'domcontentloaded' })
  await p.waitForSelector('.tmk-empty', { timeout: 30000 }).catch(() => {})
  봐((await p.locator('.tmk-empty').count()) === 1, `${기기} 🗑 지우면 새로고침해도 빈 화면`)
  봐(await p.evaluate(() => new Promise((res) => { const r = indexedDB.open('kcm_jeoksan'); r.onsuccess = () => { try { const db = r.result; const q = db.transaction('자료').objectStore('자료').get('kcm.civil.ny.v1'); q.onsuccess = () => res(q.result === undefined); q.onerror = () => res(false) } catch (e) { res(String(e)) } }; r.onerror = () => res(false) })) === true, `${기기} 🗑 이면 내역 대조 저장도 같이 지움`)
  /* 토목 없이 골조만 */
  await p.click('.tmk-empty .gmd-link')
  await p.waitForSelector('.tmk-body.tmk-only', { timeout: 10000 })
  const 만 = await p.evaluate(() => ({ 캔: document.querySelectorAll('.tmk-canvas3d').length, 평: document.querySelectorAll('.tmk-canvas').length, 줄: [...document.querySelectorAll('.tmk-bothq tbody tr')].map((tr) => [...tr.children].map((td) => td.textContent)) }))
  봐(만.캔 === 1 && 만.평 === 0 && 만.줄.length === 2 && 만.줄[0][0].includes('골조') && 골조합 && Math.abs(숫(만.줄[0][1]) - 골조합.콘) < 0.006, `${기기} «골조만 여기서 보기» — 3D 골조 · 함께 합 골조 줄(같은 값)`, JSON.stringify(만))
  await p.click('.tmk-both input')
  await p.waitForSelector('.tmk-empty', { timeout: 10000 })
  봐(true, `${기기} 같이 보기 끄면 다시 빈 화면`)
  /* ⑦ 건축으로 */
  await p.click('.gmd-field:has-text("건축")')
  await p.waitForSelector('.gmd-ws-tabs', { timeout: 30000 })
  봐((await p.locator('.gmd-ws-tabs .gmd-tab').count()) === 4, `${기기} 🏢 건축 — 골조 탭 넷 그대로`)
  const 건합 = await p.evaluate(() => [...document.querySelectorAll('.gmd-sum b')].slice(0, 3).map((x) => x.textContent))
  봐(골조합 && 건합.length === 3 && Math.abs(숫(건합[0]) - 골조합.콘) < 0.006 && Math.abs(숫(건합[1]) - 골조합.틀) < 0.06 && Math.abs(숫(건합[2]) - 골조합.철) < 0.0006, `${기기} 🏢 건축 탭 합 = 토목 탭 «함께 합» 골조 줄(같은 모델)`, JSON.stringify([건합, 골조합]))
  const 넘 = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  봐(넘 <= 1, `${기기} 가로 넘침 없음`, 넘)
  const 진짜 = 오류.filter((x) => !/favicon|Failed to load resource|WebGL|GPU stall/i.test(x))
  봐(!진짜.length, `${기기} 화면 오류 없음`, 진짜.join(' | '))
  await 판.close()
}
await 브.close()
console.log(`\n${ok + bad}개 중 맞음 ${ok} · 틀림 ${bad}`)
if (bad) { console.log('✗ 틀림 있음'); process.exit(1) } else console.log('✓ 모두 맞음')
