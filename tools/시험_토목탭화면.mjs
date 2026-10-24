// 🧪 K-적산컨맵 작업 화면 «🛣 토목» 탭 — 화면에서 실제로 눌러 보기 · G396 (2026-10-24)
//   4998 에 화면 빌드를 얹은 뒤  node tools/시험_토목탭화면.mjs [PC|폰|모두]
//   ① 🏢 건축 | 🛣 토목 — 운영자 작업 화면에 둘 · 토목 고르면 빈 화면 안내(넣을 도면 넷) · 고른 분야 기억
//   ② 🧪 예시 → 길잡이 ✓ 6 · ▶ 1 · 노선 1(가상 배수로 · 평면 노선 밖 7곳) · 측점표 26줄 = lib · 측점 성과 26/26 같음 · 토공 합 = lib(토목모델)
//   ③ 평면 누름 → 고른 자리(X · Y · 땅 EL · 경위도 · STA · 옆) = lib 자리읽기(같은 자리) · 좌표계 동부로 → 경위도 바뀜
//   ④ 📊 엑셀 → 시트(토목 집계 · 측점표 · 측점 성과 대조 · 좌표계) · 측점표 26줄 / 📍 CSV → 27줄(머리 + 26)
//   ⑤ 🧊 3D · ◫ 나란히 — 캔버스 · 오류 없음 / 예시는 저장 안 함(새로고침 → 빈 화면)
//   ⑥ «내 도면» 으로 넣으면(예시 도면 파일 넣기) 이 브라우저에 저장 → 새로고침해도 남음 → 🗑 지우면 빈 화면
//   ⑦ 🏢 건축으로 돌아가면 골조 탭 그대로 · 폰 가로 넘침 없음 · 화면 오류 없음
import { createRequire } from 'module'
import fs from 'fs'
import path from 'path'
import os from 'os'
import * as T from '../web/src/lib/토목작업.js'
import { 토목모델 } from '../web/src/lib/BIM토목.js'
import { readWorkbook } from '../web/src/lib/qtoxlsx.js'
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
await self.onmessage({ data: { files: 예이름.map((n) => { const b = fs.readFileSync(new URL(n, 공)); return { name: n, buf: b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) } }) } })
const 성 = await T.측점성과읽기('BIM예시_측점성과.csv', fs.readFileSync(new URL('BIM예시_측점성과.csv', 공)))
const D = T.토목자료(끝.r, { 측점성과: 성 })
const 땅 = T.땅찾개(D.활용)
const 표 = T.측점표(D.활용, '가상 배수로', { 땅 })
const 토 = 토목모델(D.활용, D.center, {})
/* 내 도면으로 넣을 사본(영문 이름 — setInputFiles 한글 경로) */
const 임시 = fs.mkdtempSync(path.join(os.tmpdir(), 'kcm_g396_'))
const 사본 = 예이름.map((n, i) => { const p = path.join(임시, `civ${i + 1}.dxf`); fs.copyFileSync(new URL(n, 공), p); return p })

const 브 = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] })
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
  봐((await p.locator('.tmk-need li').count()) === 4 && (await p.locator('.gmd-ws-tabs').count()) === 0, `${기기} 토목 빈 화면 — 넣을 자료 넷 안내 · 골조 탭 없음`)
  봐(await p.evaluate(() => localStorage.getItem('kcm.ws.field')) === '토목', `${기기} 고른 분야 기억(토목)`)
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
  }))
  봐(화.길 === '✓✓✓✓✓✓▶', `${기기} 길잡이 ✓ 6 · ▶ 물량`, 화.길)
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
  const [받2] = await Promise.all([p.waitForEvent('download', { timeout: 30000 }), p.click('.tmk-csv')])
  const csv = fs.readFileSync(await 받2.path(), 'utf8').replace(/^﻿/, '').trim().split(/\r?\n/)
  봐(csv.length === 27 && csv[0].startsWith('노선,측점,STA'), `${기기} 측점표 CSV 27줄(머리 + 26)`, csv.length)
  /* ⑤ 3D · 나란히 */
  await p.click('button:has-text("🧊 3D")'); await p.waitForTimeout(1500)
  봐((await p.locator('.tmk-canvas3d').count()) === 1 && (await p.locator('.tmk-canvas').count()) === 0, `${기기} 🧊 3D 캔버스`)
  await p.click('button:has-text("◫ 나란히")'); await p.waitForTimeout(1200)
  봐((await p.locator('.tmk-canvas3d').count()) === 1 && (await p.locator('.tmk-canvas').count()) === 1, `${기기} ◫ 나란히 — 평면 + 3D`)
  await p.click('button:has-text("📐 평면")')
  if (기기 === 'PC') await p.screenshot({ path: path.join(임시, 'PC.png') })
  await p.reload({ waitUntil: 'domcontentloaded' })
  await p.waitForSelector('.tmk-empty', { timeout: 30000 })
  봐(true, `${기기} 예시는 저장 안 함 — 새로고침하면 빈 화면(토목 분야는 기억)`)
  /* ⑥ 내 도면으로 넣기 → 저장 → 새로고침해도 남음 → 지우기 */
  await p.setInputFiles('.tmk-in', 사본)
  await p.waitForSelector('.tmk-body', { timeout: 90000 })
  await p.waitForTimeout(800)
  봐(!(await p.locator('.tmk-exnote').count()) && (await p.locator('.tmk-line').count()) === 1, `${기기} 내 도면(예시 사본 4장) 넣기 → 노선 1 · 예시 알림 없음`)
  await p.waitForTimeout(800)
  await p.reload({ waitUntil: 'domcontentloaded' })
  await p.waitForSelector('.tmk-body', { timeout: 30000 }).catch(() => {})
  봐((await p.locator('.tmk-line').count()) === 1, `${기기} 새로고침해도 남음(이 브라우저 IndexedDB)`)
  await p.click('button[title^="이 브라우저에 저장한 토목"]')
  await p.waitForSelector('.tmk-empty', { timeout: 10000 })
  await p.reload({ waitUntil: 'domcontentloaded' })
  await p.waitForSelector('.tmk-empty', { timeout: 30000 }).catch(() => {})
  봐((await p.locator('.tmk-empty').count()) === 1, `${기기} 🗑 지우면 새로고침해도 빈 화면`)
  /* ⑦ 건축으로 */
  await p.click('.gmd-field:has-text("건축")')
  await p.waitForSelector('.gmd-ws-tabs', { timeout: 30000 })
  봐((await p.locator('.gmd-ws-tabs .gmd-tab').count()) === 4, `${기기} 🏢 건축 — 골조 탭 넷 그대로`)
  const 넘 = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  봐(넘 <= 1, `${기기} 가로 넘침 없음`, 넘)
  const 진짜 = 오류.filter((x) => !/favicon|Failed to load resource|WebGL|GPU stall/i.test(x))
  봐(!진짜.length, `${기기} 화면 오류 없음`, 진짜.join(' | '))
  await 판.close()
}
await 브.close()
console.log(`\n${ok + bad}개 중 맞음 ${ok} · 틀림 ${bad}`)
if (bad) { console.log('✗ 틀림 있음'); process.exit(1) } else console.log('✓ 모두 맞음')
