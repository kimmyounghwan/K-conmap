// 🩹 G465 맨 위 줄 맞춤 화면 시험 — 화면 빌드를 얹은 뒤  B=http://127.0.0.1:포트 node tools/시험_맨위줄.mjs
//   폰 폭 320 ~ 430 · 860 × 🔔(안 본 알림) 있고 없고 × 📲(앱 설치 전) 있고 없고 × 첫 화면 · 아래 화면(← 있음) × 글꼴이 넓은 폰(아이폰 그림 글자 흉내)
//   → 맨 위 줄이 화면 밖으로 안 나감 · 📖 보는 방법 · 🔎 · 🔄 · 🔔 는 늘 보임 · 🌊 사라사는 맨 위 줄에 없고 바닥글에 있음 · 넘칠 때만 📲 → ← 차례로 뺌(꼭 필요한 만큼만) · 넓은 화면은 다 보임
import { createRequire } from 'module'
const require = createRequire('/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const 주소 = process.env.B || 'http://127.0.0.1:4998'
const 브 = await chromium.launch()
let ok = 0, bad = 0
const 봐 = (c, 말, 더 = '') => { if (c) ok++; else { bad++; console.log('✗', 말, String(더).slice(0, 400)) } }
const 폭들 = [320, 340, 360, 375, 390, 393, 412, 430, 860]
for (const 화면 of ['/', '/change/work']) for (const 넓글 of [0, 1]) {
  const c = await 브.newContext({ viewport: { width: 393, height: 800 }, isMobile: true, hasTouch: true, locale: 'ko-KR' })
  await c.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|geojs|firebaseio/, (r) => r.fulfill({ status: 200, body: '' }))
  await c.addInitScript(() => { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); try { sessionStorage.setItem('kcm_notice_seen', '2026-10-업체'); sessionStorage.setItem('kcm_visit_s', '1') } catch (e) {} })
  const p = await c.newPage(); const 오류 = []; p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
  await p.goto(주소 + 화면, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500)
  if (넓글) await p.addStyleTag({ content: '.topbar-r > *, .qsbtn, .brand-sub { margin-right: 4px !important; }' })   // 아이폰 그림 글자가 더 넓은 것 흉내
  for (const 종 of [0, 1]) for (const 앱 of [0, 1]) {
    await p.evaluate(([종, 앱]) => {
      const r = document.querySelector('.topbar-r')
      const 종칸 = r.querySelector('.noti-bell')
      if (종 && !종칸) { const d = document.createElement('div'); d.className = 'noti-bell'; d.innerHTML = '<button class="notibtn" style="animation:none">🔔<span class="noti-n">1</span></button>'; r.prepend(d) }
      if (!종 && 종칸) 종칸.remove()
      const ib = r.querySelector('.installbtn')
      if (!앱 && ib) ib.remove()
      if (앱 && !ib) { const b = document.createElement('button'); b.className = 'installbtn'; b.innerHTML = '📲<span class="instlong"> 앱으로</span>'; r.append(b) }
    }, [종, 앱])
    for (const w of 폭들) {
      await p.setViewportSize({ width: w, height: 800 }); await p.waitForTimeout(220)
      const m = await p.evaluate(() => {
        const t = document.querySelector('.topbar-in')
        const 보임 = (s) => { const e = document.querySelector(s); return !!(e && e.offsetParent !== null && e.getBoundingClientRect().width > 0) }
        const 끝 = Math.max(...[...t.querySelectorAll('a,button')].filter((e) => e.offsetParent !== null).map((e) => e.getBoundingClientRect().right))
        const k = +t.dataset.tight
        const 넘 = () => { const 틀 = t.getBoundingClientRect(); const 안 = Math.min(틀.right - parseFloat(getComputedStyle(t).paddingRight), innerWidth); return Math.max(...[...t.querySelectorAll('a,button')].filter((e) => e.offsetParent !== null).map((e) => e.getBoundingClientRect().right)) > 안 + 0.5 }
        let 덜 = null
        if (k > 0) { t.dataset.tight = String(k - 1); 덜 = 넘(); t.dataset.tight = String(k) }
        return { 끝: Math.round(끝), vw: innerWidth, k, 덜, 책: 보임('.brand-sub'), 찾: 보임('.qsbtn'), 새: 보임('.rfbtn'), 종: 보임('.notibtn'), 사: !!document.querySelector('.topbar .sisbtn, .topbar a[href*="sarasa"]'), 바닥사: !!document.querySelector('.footer-sis a[href*="sarasa"]'), 앱: 보임('.installbtn'), 뒤: 보임('.topback') }
      })
      const 이름 = `${화면} ${넓글 ? '넓은 글꼴 ' : ''}🔔${종} 📲${앱} ${w}px`
      봐(m.끝 <= m.vw - 4, 이름 + ' — 화면 밖으로 안 나감(오른 여백 안)', JSON.stringify(m))
      봐(m.책 && m.찾 && m.새 && (!종 || m.종), 이름 + ' — 보는 방법 · 🔎 · 🔄 · 🔔 늘 보임', JSON.stringify(m))
      봐(m.k === 0 || m.덜 === true, 이름 + ` — 넘칠 때만 뺌(단계 ${m.k})`, JSON.stringify(m))
      if (w >= 860) 봐(m.k === 0 && (!앱 || m.앱), 이름 + ' — 넓은 화면은 다 보임', JSON.stringify(m))
      봐(!m.사 && m.바닥사, 이름 + ' — 🌊 사라사는 맨 위 줄에 없음 · 바닥글에 있음', JSON.stringify(m))
      if (m.k >= 1) 봐(!m.앱, 이름 + ' — 1단계 📲 빠짐', JSON.stringify(m))
      if (m.k >= 2) 봐(!m.뒤, 이름 + ' — 2단계 ← 빠짐', JSON.stringify(m))
      if (화면 !== '/' && m.k < 2) 봐(m.뒤 || w <= 340, 이름 + ' — ← 보임', JSON.stringify(m))
      if (w === 393 && !넓글) console.log(`  ${이름} 단계 ${m.k}`)
    }
  }
  봐(!오류.length, 화면 + ' 화면 오류 없음', 오류.join(' | '))
  await c.close()
}
console.log(bad ? `✗ ${bad} 틀림 · ${ok} 맞음` : `✓ 모두 맞음(${ok})`)
await 브.close()
process.exit(bad ? 1 : 0)
