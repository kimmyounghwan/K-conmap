// 🧱 G471 골조 모델 작업 화면 — 폰 · 어두운 화면 칸 시험(소장님 아이폰 10-30 «이게 맞는거야. 점검해줘»)
//   화면 빌드를 얹은 뒤  B=http://127.0.0.1:4467 node tools/시험_골조폰칸.mjs
//   온 사이트 input 규칙(width 100% · 안쪽 여백)이 체크에도 걸려 «⟋ 비스듬히» 체크가 한 줄을 다 차지 → 글이 오른쪽 끝에 세로로 밀림 · 층 복사 체크가 큼직
//   어두운 화면에서 꺼진 테두리 단추(«복사») 글이 #0b1220(바탕과 거의 같음) → 안 보임
//   밝은 · 어두운 × 320 · 360 · 390 · 860 · 1280: 비스듬히 칸 한 줄 · 체크 18px · 층 복사 체크 18px · 꺼진 «복사» 글과 바탕 대비 · 가로 넘침 없음 · 화면 오류 없음
import { createRequire } from 'module'
const require = createRequire(process.env.PW || '/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const 주소 = process.env.B || 'http://127.0.0.1:4467'
let ok = 0, bad = 0
const 봐 = (c, m, 더 = '') => { if (c) ok++; else bad++; console.log(c ? '  ✓' : '  ✗', m, c ? '' : JSON.stringify(더).slice(0, 400)) }
/* 글색 · 바탕색 대비(WCAG) — 꺼진 단추는 흐림(opacity)도 곱함 */
const 밝기 = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
const 섞 = (a, b, t) => a.map((v, i) => v * t + b[i] * (1 - t))
const 대비 = (a, b) => { const x = 밝기(a), y = 밝기(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) }
const 수들 = (s) => (String(s).match(/[\d.]+/g) || []).slice(0, 3).map(Number)
const 브 = await chromium.launch()
for (const 색 of ['light', 'dark']) for (const w of [320, 360, 390, 860, 1280]) {
  const 폰 = w < 600
  const c = await 브.newContext({ viewport: { width: w, height: 900 }, colorScheme: 색, isMobile: 폰, hasTouch: 폰, locale: 'ko-KR' })
  await c.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|geojs|firebaseio/, (r) => r.fulfill({ status: 200, body: '' }))
  await c.addInitScript(() => { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); try { sessionStorage.setItem('kcm_notice_seen', '2026-10-업체') } catch (e) {} })
  const p = await c.newPage(); const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
  await p.goto(주소 + '/jeoksan/model?ws=1', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500)
  await p.evaluate(() => [...document.querySelectorAll('button')].find((b) => /^🧪 예시$/.test(b.textContent.trim()))?.click()); await p.waitForTimeout(2500)
  await p.evaluate(() => [...document.querySelectorAll('button')].find((b) => /^예, 바꾸기/.test(b.textContent.trim()))?.click()); await p.waitForTimeout(800)
  await p.evaluate(() => [...document.querySelectorAll('.gmd-tool')].find((b) => /벽/.test(b.textContent))?.click()); await p.waitForTimeout(700)
  const r = await p.evaluate(() => {
    const l = document.querySelector('.gmd-check-l'); const bar = l && l.closest('.gmd-bar')
    const lr = l && l.getBoundingClientRect(), br = bar && bar.getBoundingClientRect(), ib = l && l.querySelector('input').getBoundingClientRect()
    const 글 = l && [...l.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim()
    const 층칸 = [...document.querySelectorAll('.gmd-kv input[type=checkbox]')].map((x) => { const b = x.getBoundingClientRect(); return Math.round(Math.max(b.width, b.height)) })
    const 복 = [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === '복사')
    const cs = 복 && getComputedStyle(복)
    /* 단추 바탕이 투명이면 조상 바탕 */
    let 바 = 복, 바탕 = 'rgba(0, 0, 0, 0)'
    while (바 && /rgba\(0, 0, 0, 0\)|transparent/.test(바탕)) { 바탕 = getComputedStyle(바).backgroundColor; 바 = 바.parentElement }
    const 쪽바탕 = getComputedStyle(document.body).backgroundColor
    return { 비스: lr && { h: Math.round(lr.height), 오른: Math.round(lr.right - br.right), 체크: [Math.round(ib.width), Math.round(ib.height)], 글 }, 층칸, 복사: 복 && { 꺼짐: 복.disabled, 글색: cs.color, 바탕, 쪽바탕, 흐림: +cs.opacity }, 밖: document.documentElement.scrollWidth - document.documentElement.clientWidth }
  })
  const 이 = `${색 === 'dark' ? '어두운' : '밝은'} ${w}px`
  봐(r.비스 && r.비스.h <= 26 && r.비스.오른 <= 0 && r.비스.체크[0] <= 20 && r.비스.체크[1] <= 20 && /비스듬히/.test(r.비스.글), 이 + ' «⟋ 비스듬히» 한 줄 · 체크 18px · 칸 안', r.비스)
  봐(r.층칸.length > 0 && r.층칸.every((v) => v <= 20), 이 + ' 층 복사 체크 ' + r.층칸.length + '개 18px 이하', r.층칸)
  const 글 = 수들(r.복사.글색), 바 = 수들(r.복사.바탕)
  const 보임 = 섞(글, 바, r.복사.흐림)
  const k = 대비(보임, 바)
  봐(r.복사 && r.복사.꺼짐 && k >= 1.8, 이 + ' 꺼진 «복사» 글이 보임(대비 ' + k.toFixed(2) + ')', r.복사)
  봐(r.밖 <= 0, 이 + ' 가로 넘침 없음', r.밖)
  봐(!오류.length, 이 + ' 화면 오류 없음', 오류)
  await c.close()
}
await 브.close()
console.log(`\n${ok} 통과 · ${bad} 실패`)
process.exit(bad ? 1 : 0)
