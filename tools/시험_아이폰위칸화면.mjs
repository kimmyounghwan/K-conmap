/**
 * 🩹 G758 아이폰 «홈 화면 앱» 시계 줄 — 화면 시험 (2026-11-18) — 진짜 브라우저(Playwright)
 *   node tools/시험_아이폰위칸화면.mjs [전=http://127.0.0.1:5004] [후=http://127.0.0.1:5005] [아이폰흉내=http://127.0.0.1:5006]
 *   (클라우드에서만 — 굽은 사이트 셋: 전(G757) · 후(G758) · 아이폰흉내(G758 CSS 의 env(safe-area-inset-top) 를 62px 로 바꾼 것))
 *   ① 크롬 · 안드로이드 · PC(시계 줄 0) — 고치기 전과 «자리 그대로»: 9쪽 × 폰 390 · PC 1280 · 맨 위 · 600px 내림
 *      (머리줄 · ← · 🔄 · 종류띠 · 아래 탭 · 붙는 칸)
 *   ② 아이폰 흉내(시계 줄 62px) — 머리줄 바탕은 맨 위(0)부터 · ← 뒤로 · 🔄 새로고침 · 로고는 62px 아래 · 종류띠는 머리줄 밑
 *      · 600px 내려도 머리줄(붙음)이 맨 위 · ← · 🔄 가 62px 아래에 보임 · 가로 넘침 없음
 *   ③ 화면 오류(pageerror) 없음
 *   ④ 📱 G760 🔎 찾기 창 — 아이폰 흉내: 입력칸 · ✕ 가 62px 아래 · 크롬 폰 390: 맨 위부터 꽉 채움(전과 같음) · PC: 가운데 7vh(전과 같음) · 찾기 · ✕ 닫기
 */
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const [전 = 'http://127.0.0.1:5004', 후 = 'http://127.0.0.1:5005', 흉내 = 'http://127.0.0.1:5006'] = process.argv.slice(2)
let 통과 = 0, 실패 = 0
const 봄 = (이름, 참, 더 = '') => { if (참) { 통과++; console.log('  ✓', 이름, 더) } else { 실패++; console.log('  ✗', 이름, 더) } }
const 쉼 = (ms) => new Promise((r) => setTimeout(r, ms))
const 쪽들 = ['/', '/live', '/first', '/tools', '/forms', '/qna', '/tools/nomubi', '/mycon', '/map']
const 폰이름 = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1'
const PC이름 = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

const 브 = await chromium.launch()
async function 열기(주소, 크기, 폰) {
  const c = await 브.newContext({ viewport: 크기, deviceScaleFactor: 1, isMobile: 폰, hasTouch: 폰, locale: 'ko-KR', userAgent: 폰 ? 폰이름 : PC이름 })
  await c.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|geojs|firebaseio|coupang|daumcdn|kakao/, (r) => r.fulfill({ status: 200, body: '' }))
  await c.addInitScript(() => { try { localStorage.setItem('kcm_how_seen', '1') } catch (e) { /* 없음 */ } })
  const p = await c.newPage()
  const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e).slice(0, 160)))
  return { c, p, 오류 }
}
const 자리 = (p) => p.evaluate(() => {
  const r = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return b.height ? [Math.round(b.top), Math.round(b.bottom)] : null }
  document.querySelectorAll('.noticepop, .noticepop-bg').forEach((e) => { e.style.display = 'none' })
  return {
    머리: r('.topbar'), 안: r('.topbar-in'), 뒤로: r('.topbar .topback'), 새로: r('.topbar .rfbtn'),
    종류: r('.kindstrip'), 탭: r('.tabbar'), 넘침: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }
})

console.log('① 시계 줄 0(크롬 · 안드로이드 · PC) — 고치기 전과 자리 그대로')
for (const [이름, 크기, 폰] of [['폰', { width: 390, height: 844 }, true], ['PC', { width: 1280, height: 900 }, false]]) {
  for (const 쪽 of 쪽들) {
    const 값 = []
    for (const 판 of [전, 후]) {
      const { c, p, 오류 } = await 열기(판, 크기, 폰)
      await p.goto(판 + 쪽, { waitUntil: 'domcontentloaded' }); await 쉼(2500)
      const 위 = await 자리(p)
      await p.evaluate(() => window.scrollTo(0, 600)); await 쉼(500)
      const 아래 = await 자리(p)
      값.push({ 위, 아래, 오류 })
      await c.close()
    }
    const 같음 = JSON.stringify(값[0].위) === JSON.stringify(값[1].위) && JSON.stringify(값[0].아래) === JSON.stringify(값[1].아래)
    봄(`${이름} ${쪽} 자리 그대로`, 같음, 같음 ? '' : JSON.stringify(값[0].위) + ' → ' + JSON.stringify(값[1].위))
    봄(`${이름} ${쪽} 화면 오류 없음`, 값[1].오류.length === 0, 값[1].오류.join(' | '))
  }
}

console.log('② 아이폰 흉내(시계 줄 62px)')
for (const 쪽 of 쪽들) {
  const { c, p, 오류 } = await 열기(흉내, { width: 402, height: 874 }, true)
  await p.goto(흉내 + 쪽, { waitUntil: 'domcontentloaded' }); await 쉼(2500)
  const 위 = await 자리(p)
  봄(`${쪽} 머리줄 바탕 맨 위부터`, 위.머리 && 위.머리[0] === 0, JSON.stringify(위.머리))
  봄(`${쪽} 머리줄 안쪽이 시계 줄 아래(62px)`, 위.안 && 위.안[0] >= 62, JSON.stringify(위.안))
  봄(`${쪽} ← 뒤로 · 🔄 새로고침이 시계 줄 아래`, (!위.뒤로 || 위.뒤로[0] >= 62) && 위.새로 && 위.새로[0] >= 62, JSON.stringify({ 뒤로: 위.뒤로, 새로: 위.새로 }))
  if (위.종류) 봄(`${쪽} 종류띠는 머리줄 밑`, 위.종류[0] >= 위.머리[1] - 1, JSON.stringify({ 종류: 위.종류, 머리: 위.머리 }))
  봄(`${쪽} 가로 넘침 없음`, 위.넘침 <= 0, String(위.넘침))
  await p.evaluate(() => window.scrollTo(0, 600)); await 쉼(500)
  const 아래 = await 자리(p)
  const 길었나 = await p.evaluate(() => document.documentElement.scrollHeight > window.innerHeight + 650)
  if (길었나) 봄(`${쪽} 600px 내려도 머리줄 맨 위 · 🔄 보임`, 아래.머리 && 아래.머리[0] === 0 && 아래.새로 && 아래.새로[0] >= 62, JSON.stringify({ 머리: 아래.머리, 새로: 아래.새로 }))
  봄(`${쪽} 화면 오류 없음`, 오류.length === 0, 오류.join(' | '))
  await c.close()
}

/* 📱 G760 소장님 11-18 아이폰 캡처 — 🔎 찾기 창(폰은 꽉 채움) 입력칸 · ✕ 가 시계 줄 뒤로 숨음 → 창도 시계 줄만큼 내림 */
console.log('④ 🔎 찾기 창 — 아이폰 흉내: 입력칸 · ✕ 가 시계 줄(62px) 아래 · 크롬 폰 · PC: 전과 같은 자리')
for (const [이름, 판, 크기, 폰, 아래] of [['아이폰 흉내', 흉내, { width: 402, height: 874 }, true, 62], ['크롬 폰 390', 후, { width: 390, height: 844 }, true, 0], ['PC 1280', 후, { width: 1280, height: 900 }, false, null]]) {
  for (const 쪽 of ['/', '/tools', '/first']) {
    const { c, p, 오류 } = await 열기(판, 크기, 폰)
    await p.goto(판 + 쪽, { waitUntil: 'domcontentloaded' }); await 쉼(2000)
    await p.evaluate(() => document.querySelectorAll('.noticepop, .noticepop-bg').forEach((e) => { e.style.display = 'none' }))
    await p.locator('.qsbtn').first().click(); await p.waitForSelector('.qs-head', { timeout: 8000 }); await 쉼(400)
    const r = await p.evaluate(() => { const b = (s) => { const e = document.querySelector(s); if (!e) return null; const x = e.getBoundingClientRect(); return [Math.round(x.top), Math.round(x.bottom)] }; return { 바탕: b('.qs-back'), 상자: b('.qs-box'), 머리: b('.qs-head'), 칸: b('.qs-in'), 닫기: b('.qs-x'), 높이: innerHeight } })
    if (아래 === 62) 봄(`${이름} ${쪽} 입력칸 · ✕ 가 시계 줄 아래 · 창 아래 끝은 화면 안`, r.바탕 && r.바탕[0] === 0 && r.머리[0] >= 62 && r.칸[0] >= 62 && r.닫기[0] >= 62 && r.상자[1] <= r.높이, JSON.stringify(r))
    else if (아래 === 0) 봄(`${이름} ${쪽} 찾기 창 맨 위부터 꽉 채움(전과 같음)`, r.머리 && r.머리[0] === 0 && r.상자[0] === 0 && r.상자[1] === r.높이, JSON.stringify(r))
    else 봄(`${이름} ${쪽} 가운데 뜬 창(위 7vh — 전과 같음)`, r.상자 && Math.abs(r.상자[0] - Math.round(r.높이 * 0.07)) <= 1, JSON.stringify(r))
    await p.locator('.qs-in').fill('노무비'); await 쉼(500)
    봄(`${이름} ${쪽} 찾기 결과가 나옴`, (await p.locator('.qs-row').count()) > 0)
    await p.locator('.qs-x').click(); await 쉼(300)
    봄(`${이름} ${쪽} ✕ 로 닫힘 · 화면 오류 없음`, (await p.locator('.qs-back').count()) === 0 && 오류.length === 0, 오류.join(' | '))
    await c.close()
  }
}

await 브.close()
console.log(`\n시험_아이폰위칸화면: ${통과}개 통과 · ${실패}개 실패`)
process.exit(실패 ? 1 : 0)
