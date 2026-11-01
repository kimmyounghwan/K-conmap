// 📷 G492 (2026-11-01) 사진대지 도구(/tools/photo) 화면 시험 — PC · 폰 (전엔 화면 시험이 저장소 밖에 있었음 → 여기 둠)
//   화면 빌드를 얹은 뒤  B=http://127.0.0.1:4467 node tools/시험_사진대지화면.mjs [PC|폰|모두]
//   ① ▶ 예시로 해 보기 → 사진 8장 · 미리보기 쪽 · 흐림 1 · 거의 같음 1 표시
//   ② 📋 보드판 체크 → 미리보기 사진마다 보드(공사명 · 공 종 · 일 자) 겹침 · 끄면 없음
//   ③ 📸 찍기 단추(폰 카메라 · capture 입력칸) 있음 · 📁 폴더째
//   ④ PDF 받기 — 보드판 켠 PDF 가 끈 PDF 보다 다름(사진에 그려 넣음) · 둘 다 진짜 PDF
//   ⑤ 320 ~ 1280 가로 넘침 없음 · 화면 오류 없음
import { createRequire } from 'module'
import fs from 'fs'
const require = createRequire(process.env.PW || '/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const 주소 = process.env.B || 'http://127.0.0.1:4467'
const 기기들 = (process.argv[2] || '모두') === '모두' ? ['PC', '폰'] : [process.argv[2]]
let ok = 0, bad = 0
const 봐 = (c, m, 더 = '') => { if (c) ok++; else bad++; console.log(c ? '  ✓' : '  ✗', m, c ? '' : String(typeof 더 === 'string' ? 더 : JSON.stringify(더)).slice(0, 500)) }
const 브 = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] })
for (const 기기 of 기기들) {
  console.log('■ ' + 기기)
  const 폰 = 기기 === '폰'
  const c = await 브.newContext({ viewport: 폰 ? { width: 390, height: 844 } : { width: 1280, height: 900 }, locale: 'ko-KR', isMobile: 폰, hasTouch: 폰, acceptDownloads: true })
  await c.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|geojs|firebaseio/, (r) => r.fulfill({ status: 200, body: '' }))
  await c.addInitScript(() => { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); try { sessionStorage.setItem('kcm_notice_seen', '2026-10-업체') } catch (e) {} })
  const p = await c.newPage(); const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e).slice(0, 300))); p.on('dialog', (d) => d.accept())
  const 누름 = (re) => p.evaluate((s) => { const r = new RegExp(s); const b = [...document.querySelectorAll('button')].find((x) => r.test(x.textContent.trim()) && !x.disabled && x.offsetParent !== null); if (b) { b.click(); return true } return false }, re.source)
  const 글 = () => p.evaluate(() => document.body.innerText)
  const 조용 = async (초 = 60) => { let 앞 = ''; for (let i = 0; i < 초; i++) { await p.waitForTimeout(1000); const g = await 글(); if (!/읽는 중|만드는 중|줄이는 중|그리는 중/.test(g) && g === 앞) return; 앞 = g } }
  await p.goto(주소 + '/tools/photo', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(3000)
  /* 새로 시작(지난 작업이 있으면 지우고) */
  await 누름(/지우고 새로/); await p.waitForTimeout(800)
  /* ① 예시 */
  봐(await 누름(/예시로 해 보기/), '① ▶ 예시로 해 보기 누름'); await 조용(90)
  const r1 = await p.evaluate(() => ({ 장: (document.body.innerText.match(/사진 올리기\s*·\s*(\d+)장/) || [])[1], 쪽: document.querySelectorAll('.pb-page').length, 그림: document.querySelectorAll('.pb-page .pb-rimg img').length }))
  봐(+r1.장 === 8 && r1.쪽 >= 1 && r1.그림 >= 2, `${기기} ① 예시 → 사진 ${r1.장}장 · 미리보기 쪽 ${r1.쪽} · 그림 ${r1.그림}`, r1)
  /* ② 보드판 */
  const 보드켜기 = async (on) => p.evaluate((on) => { const l = [...document.querySelectorAll('label')].find((x) => /보드판/.test(x.textContent)); const i = l && l.querySelector('input'); if (!i) return false; if (i.checked !== on) i.click(); return true }, on)
  봐(await 보드켜기(true), '② 📋 보드판 체크 있음 · 켬'); await p.waitForTimeout(1200)
  const r2 = await p.evaluate(() => ({ 보드: document.querySelectorAll('.pb-board').length, 글: (document.querySelector('.pb-board') || {}).innerText || '' }))
  봐(r2.보드 >= 2 && /공사명/.test(r2.글) && /일 자/.test(r2.글), `${기기} ② 미리보기 사진마다 보드판 ${r2.보드}개 — «${r2.글.replace(/\n/g, ' / ').slice(0, 60)}»`, r2)
  await 보드켜기(false); await p.waitForTimeout(800)
  봐((await p.evaluate(() => document.querySelectorAll('.pb-board').length)) === 0, '② 보드판 끄면 미리보기에 없음')
  /* ③ 찍기 · 폴더 */
  const r3 = await p.evaluate(() => ({ 찍기: [...document.querySelectorAll('button')].some((b) => /📸 찍기/.test(b.textContent)), 카메라칸: !!document.querySelector('input[type=file][capture]'), 폴더: !!document.querySelector('input[type=file][webkitdirectory]') }))
  봐(r3.찍기 === 폰 && r3.카메라칸 && r3.폴더, `③ 📸 찍기는 폰에만(${폰 ? '있음' : '없음'}) · 📁 폴더째 고르기 있음`, r3)
  /* ④ PDF — 보드 끄고 · 켜고 */
  const pdf받기 = async () => { const 기 = p.waitForEvent('download', { timeout: 90000 }).catch(() => null); const 눌 = await p.evaluate(() => { const b = document.querySelector('button.pb-fmt.f-pdf:not([disabled])'); if (b) { b.click(); return true } return false }); const d = await 기; await 조용(60); return { 눌, d, 길: d ? await d.path() : null } }
  const a = await pdf받기()
  const a바 = a.길 ? fs.readFileSync(a.길) : Buffer.alloc(0)
  봐(a.눌 && a.d && a바.slice(0, 4).toString() === '%PDF' && a바.length > 50000, `④ PDF 받기(보드 없음) ${Math.round(a바.length / 1024)} KB`, a)
  await 보드켜기(true); await p.waitForTimeout(800)
  const b = await pdf받기()
  const b바 = b.길 ? fs.readFileSync(b.길) : Buffer.alloc(0)
  봐(b.눌 && b.d && b바.slice(0, 4).toString() === '%PDF' && b바.length > 50000 && !a바.equals(b바), `④ PDF 받기(보드판 켬) ${Math.round(b바.length / 1024)} KB — 보드 없는 것과 다름`, [a바.length, b바.length])
  /* ⑤ 넘침 */
  for (const w of [320, 360, 390, 860, 1280]) {
    await p.setViewportSize({ width: w, height: 800 }); await p.waitForTimeout(400)
    const n = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    봐(n <= 1, `${기기} ⑤ ${w}px 가로 넘침 없음`, n)
  }
  봐(!오류.length, 기기 + ' 화면 오류 없음', 오류.join(' | '))
  await c.close()
}
await 브.close()
console.log(bad ? `✗ ${bad} 틀림 · ${ok} 맞음` : `✓ 모두 맞음(${ok})`)
process.exit(bad ? 1 : 0)
