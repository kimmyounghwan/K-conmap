/**
 * 🩹 G765 아이폰 «홈 화면 앱» 시계 줄 바탕(.kcm-sibar) — 화면 시험 (2026-11-18) — 진짜 브라우저(Playwright)
 *   node tools/시험_시계줄바탕화면.mjs [전=http://127.0.0.1:5762] [후=http://127.0.0.1:5765] [캡처 폴더]
 *   (클라우드에서만 — 굽은 사이트 둘: 전(G762) · 후(G765))
 *   소장님 11-18 18:10 폰 캡처 「지금도 위 쪽이 좀 그러지 않아?? 오늘 오전이랑 달라」 — 로고 줄이 아이폰 «그늘»에 덮여 흐림
 *   ① 시계 줄 0(크롬 · 안드로이드 · PC) — 고치기 전과 자리 그대로(머리줄 · ← · 🔄 · 종류띠 · 아래 탭 · 맨 위 · 600px 내림) · 바탕 칸 높이 0 · 오류 없음
 *   ② 아이폰 흉내(크롬 «안전 영역» 흉내 — 시계 줄 59px) · 밝은 · 어두운 화면:
 *      바탕 칸 = 맨 위 0 ~ 59 · 화면 폭 · 바탕색 = 머리줄 색 · 시계 줄 자리 맨 위 칸 = 바탕 칸 · 로고 줄은 59 아래(바탕 칸이 안 덮음)
 *      · 600px 내려도 그대로 · 키보드 바로잡기(vv-fix 100px) 때 머리줄과 같이 내려감
 *   ③ 캡처 — 아이폰 흉내 위쪽(밝은 · 어두운)
 */
import { createRequire } from 'module'
import fs from 'node:fs'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const [전 = 'http://127.0.0.1:5762', 후 = 'http://127.0.0.1:5765', 캡처 = ''] = process.argv.slice(2)
let 통과 = 0, 실패 = 0
const 봄 = (이름, 참, 더 = '') => { if (참) { 통과++; console.log('  ✓', 이름, 더) } else { 실패++; console.log('  ✗', 이름, 더) } }
const 쉼 = (ms) => new Promise((r) => setTimeout(r, ms))
const 쪽들 = ['/', '/live', '/tools', '/forms', '/tools/nomubi', '/mycon']
const 폰이름 = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1'
const PC이름 = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
const 시계 = 59

const 브 = await chromium.launch()
async function 열기(주소, 크기, 폰, { 색 = 'light', 안전 = 0 } = {}) {
  const c = await 브.newContext({ viewport: 크기, deviceScaleFactor: 캡처 ? 2 : 1, isMobile: 폰, hasTouch: 폰, locale: 'ko-KR', colorScheme: 색, userAgent: 폰 ? 폰이름 : PC이름 })
  await c.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|geojs|firebaseio|coupang|daumcdn|kakao/, (r) => r.fulfill({ status: 200, body: '' }))
  await c.addInitScript(() => { try { localStorage.setItem('kcm_how_seen', '1') } catch (e) { /* 없음 */ } })
  const p = await c.newPage()
  const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e).slice(0, 160)))
  if (안전) { const s = await c.newCDPSession(p); await s.send('Emulation.setSafeAreaInsetsOverride', { insets: { top: 안전, topMax: 안전 } }) }
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
const 바탕 = (p) => p.evaluate(() => {
  const s = document.querySelectorAll('.kcm-sibar'), e = s[0], h = document.querySelector('.topbar'), 안 = document.querySelector('.topbar-in')
  if (!e) return { 수: 0 }
  const b = e.getBoundingClientRect(), cs = getComputedStyle(e)
  const 위 = document.elementFromPoint(innerWidth / 2, 10), 로고자리 = 안 ? 안.getBoundingClientRect() : null
  const 로고칸 = 로고자리 ? document.elementFromPoint(innerWidth / 2, Math.round(로고자리.top + 로고자리.height / 2)) : null
  return { 수: s.length, 위: Math.round(b.top), 높이: Math.round(b.height), 폭: Math.round(b.width), 화면폭: innerWidth, 바탕색: cs.backgroundColor,
    머리색: h ? getComputedStyle(h).backgroundColor : '', 고정: cs.position, z: cs.zIndex, 맨위칸: 위 ? (위.className || 위.tagName) : '',
    로고위: 로고자리 ? Math.round(로고자리.top) : null, 로고칸바탕: !!(로고칸 && 로고칸.closest('.kcm-sibar')), 로고칸머리: !!(로고칸 && 로고칸.closest('.topbar')) }
})

console.log('① 시계 줄 0(크롬 · 안드로이드 · PC) — 고치기 전과 자리 그대로')
for (const [이름, 크기, 폰] of [['폰', { width: 390, height: 844 }, true], ['PC', { width: 1280, height: 900 }, false]]) {
  for (const 쪽 of 쪽들) {
    const 값 = []
    for (const 판 of [전, 후]) {
      const { c, p, 오류 } = await 열기(판, 크기, 폰)
      await p.goto(판 + 쪽, { waitUntil: 'domcontentloaded' }); await 쉼(2500)
      const 위 = await 자리(p), 칸 = 판 === 후 ? await 바탕(p) : null
      await p.evaluate(() => window.scrollTo(0, 600)); await 쉼(500)
      const 아래 = await 자리(p)
      값.push({ 위, 아래, 오류, 칸 })
      await c.close()
    }
    const 같음 = JSON.stringify(값[0].위) === JSON.stringify(값[1].위) && JSON.stringify(값[0].아래) === JSON.stringify(값[1].아래)
    봄(`${이름} ${쪽} 자리 그대로`, 같음, 같음 ? '' : JSON.stringify(값[0].위) + ' → ' + JSON.stringify(값[1].위))
    봄(`${이름} ${쪽} 바탕 칸 하나 · 높이 0`, 값[1].칸 && 값[1].칸.수 === 1 && 값[1].칸.높이 === 0 && 값[1].칸.고정 === 'fixed', JSON.stringify(값[1].칸))
    봄(`${이름} ${쪽} 화면 오류 없음`, 값[1].오류.length === 0, 값[1].오류.join(' | '))
  }
}

console.log(`② 아이폰 흉내(시계 줄 ${시계}px) — 밝은 · 어두운 화면`)
for (const 색 of ['light', 'dark']) {
  for (const 쪽 of ['/', '/tools', '/forms']) {
    const { c, p, 오류 } = await 열기(후, { width: 390, height: 844 }, true, { 색, 안전: 시계 })
    await p.goto(후 + 쪽, { waitUntil: 'domcontentloaded' }); await 쉼(2500)
    const 칸 = await 바탕(p)
    봄(`${색} ${쪽} 바탕 칸 = 맨 위 0 ~ ${시계} · 화면 폭`, 칸.수 === 1 && 칸.위 === 0 && 칸.높이 === 시계 && 칸.폭 === 칸.화면폭, JSON.stringify([칸.위, 칸.높이, 칸.폭]))
    봄(`${색} ${쪽} 바탕색 = 머리줄 색(불투명)`, 칸.바탕색 === 칸.머리색 && /^rgb\(/.test(칸.바탕색), `${칸.바탕색} · ${칸.머리색}`)
    봄(`${색} ${쪽} 시계 줄 자리 맨 위 칸 = 바탕 칸 · 머리줄보다 위(z)`, 칸.맨위칸 === 'kcm-sibar' && Number(칸.z) > 40, `${칸.맨위칸} · z ${칸.z}`)
    봄(`${색} ${쪽} 로고 줄은 시계 줄 아래 · 바탕 칸이 안 덮음`, 칸.로고위 >= 시계 && !칸.로고칸바탕 && 칸.로고칸머리, `로고 ${칸.로고위}`)
    if (쪽 === '/') {
      if (캡처) { fs.mkdirSync(캡처, { recursive: true }); await p.screenshot({ path: `${캡처}/시계줄바탕_${색}_폰390.png`, clip: { x: 0, y: 0, width: 390, height: 260 } }) }
      await p.evaluate(() => window.scrollTo(0, 600)); await 쉼(500)
      const 내림 = await 바탕(p), 머리 = await 자리(p)
      봄(`${색} 600px 내려도 바탕 칸 0 ~ ${시계} · 머리줄 맨 위에 붙음 · 로고 줄 시계 줄 아래`, 내림.위 === 0 && 내림.높이 === 시계 && 머리.머리 && 머리.머리[0] === 0 && 머리.안 && 머리.안[0] >= 시계, JSON.stringify([내림.위, 내림.높이, 머리.머리, 머리.안]))
      await p.evaluate(() => { document.documentElement.style.setProperty('--vv-dy', '100px'); document.documentElement.classList.add('vv-fix') }); await 쉼(300)
      const 키 = await 바탕(p), 머리2 = await 자리(p)
      봄(`${색} 키보드 바로잡기(vv-fix 100px) — 바탕 칸도 머리줄과 같이 100 내려감`, 키.위 === 100 && 머리2.머리 && 머리2.머리[0] === 100, JSON.stringify([키.위, 머리2.머리]))
    }
    봄(`${색} ${쪽} 화면 오류 없음`, 오류.length === 0, 오류.join(' | '))
    await c.close()
  }
}

await 브.close()
console.log(`\n시험_시계줄바탕화면: ${통과}개 통과 · ${실패}개 실패`)
process.exit(실패 ? 1 : 0)
