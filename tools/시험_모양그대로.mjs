// 🪞 고친 곳 말고는 «모양 그대로» — 전 판 · 새 판의 화면을 칸(요소)마다 견줌 (2026-11-17 G736)
//   소장님: 「한가지를 올리거나 수정하면 다른게 틀어져. 항상 그래. 방안 마련해서 재발되지 않게 해」
//   쓰는 법: node tools/시험_모양그대로.mjs <전 판 주소> <새 판 주소> [--뺌 '선택자,선택자'] [--쪽 '/tools/schedule|예시로 해 보기,…'(| 뒤 = 누를 단추 글)]
//     · 쪽마다(PC 1280 · 폰 390) 모든 칸의 글자색 · 바탕 · 글자 크기 · 굵기 · 줄 높이 · 바깥/안 여백 · 테두리 · 자리 · 크기를 견줌
//     · --뺌 = 일부러 바꾼 칸(그 안까지) · 광고 칸(aside.cpg · .cpc · .afit)은 늘 뺌
//     · 칸 수가 다르거나 하나라도 다르면 ❌ (어디 · 무엇이 · 전 → 지금)
//   (PLAYWRIGHT · PC bat 에서는 안 돌림)
import { createRequire } from 'module'
const require = createRequire(process.env.PW || '/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const [O, N] = process.argv.slice(2, 4)
if (!O || !N) { console.log('쓰는 법: node tools/시험_모양그대로.mjs <전 판> <새 판> [--뺌 …] [--쪽 …]'); process.exit(2) }
const 인자 = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : '' }
const 뺌 = ['aside.cpg', 'aside.cpc', 'aside.afit', '.pvline', ...인자('--뺌').split(',').map((x) => x.trim()).filter(Boolean)]
/* 쪽 · 누를 것(차례대로 · 글자로 찾는 단추) */
const 기본쪽 = [
  ['/tools/schedule', ['예시로 해 보기']],
  ['/tools/schedule', ['예시로 해 보기', '금액형']],
  ['/tools/gps', []],
  ['/tools/tojeok', ['예시로 해 보기']],
  ['/tools/ilbo', []],
  ['/tools/tuipbi', []],
  ['/jeoksan/auto', []],
  ['/tools', []],
]
const 쪽들 = 인자('--쪽') ? 인자('--쪽').split(',').map((x) => { const [쪽, ...누를] = x.trim().split('|'); return [쪽, 누를] }) : 기본쪽   /* --쪽 '/tools/schedule|예시로 해 보기|금액형,/tools/gps' */
const 속성 = ['color', 'background-color', 'font-size', 'font-weight', 'line-height', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'border-top-width', 'border-left-width', 'border-top-color', 'border-left-color',
  'border-radius', 'display', 'position', 'text-align', 'opacity', 'visibility']
let ok = 0, bad = 0
const 봐 = (c, m, 더 = '') => { if (c) ok++; else bad++; console.log(c ? '  ✓' : '  ✗', m, c ? '' : String(typeof 더 === 'string' ? 더 : JSON.stringify(더)).slice(0, 900)) }
const 브 = await chromium.launch()
async function 찍기(주소, 쪽, 누를, 폭) {
  const 폰 = 폭 < 600
  const c = await 브.newContext({ viewport: { width: 폭, height: 900 }, isMobile: 폰, hasTouch: 폰, locale: 'ko-KR', timezoneId: 'Asia/Seoul' })
  await c.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|geojs|firebaseio|coupang|daumcdn|kakao/, (r) => r.fulfill({ status: 200, body: '' }))
  await c.addInitScript(() => { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); try { sessionStorage.setItem('kcm_notice_seen', '2026-10-업체') } catch (e) {} })
  const p = await c.newPage(); const 오류 = []; p.on('pageerror', (e) => 오류.push(String(e).slice(0, 160)))
  await p.goto(주소 + 쪽, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(3500)
  for (const 글 of 누를) {
    await p.evaluate((s) => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.includes(s) && x.offsetParent !== null); if (b) b.click() }, 글)
    await p.waitForTimeout(1500)
  }
  await p.evaluate(() => { const s = document.createElement('style'); s.textContent = '*,*::before,*::after{transition:none!important;animation:none!important;caret-color:transparent!important}'; document.head.appendChild(s) })
  await p.waitForTimeout(300)
  const 칸 = await p.evaluate(([속성, 뺌]) => {
    const 뺄 = new Set(); for (const s of 뺌) { try { document.querySelectorAll(s).forEach((e) => 뺄.add(e)) } catch (e) { /* 틀린 선택자 */ } }
    const 빠짐 = (e) => { for (let x = e; x; x = x.parentElement) if (뺄.has(x)) return true; return false }
    const 길 = (e) => { const a = []; for (let x = e; x && x !== document.body; x = x.parentElement) { let i = 1; for (let y = x.previousElementSibling; y; y = y.previousElementSibling) if (y.tagName === x.tagName) i++; a.unshift(x.tagName.toLowerCase() + ':' + i) } return a.join('>') }
    const out = []
    for (const e of document.body.querySelectorAll('*')) {
      if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE'].includes(e.tagName) || e.closest('svg') && e.tagName !== 'svg' || 빠짐(e)) continue
      const s = getComputedStyle(e); const r = e.getBoundingClientRect()
      out.push({ k: 길(e), c: (e.getAttribute('class') || '').slice(0, 60), v: 속성.map((p) => s.getPropertyValue(p)), b: [Math.round(r.x), Math.round(r.y + scrollY), Math.round(r.width), Math.round(r.height)] })
    }
    return out
  }, [속성, 뺌])
  await c.close()
  return { 칸, 오류 }
}
for (const [쪽, 누를] of 쪽들) {
  for (const 폭 of [1280, 390]) {
    const 이름 = `${쪽}${누를.length ? ' («' + 누를.join('» → «') + '»)' : ''} · ${폭}`
    const [전, 지금] = [await 찍기(O, 쪽, 누를, 폭), await 찍기(N, 쪽, 누를, 폭)]
    const 다름 = []
    if (전.칸.length !== 지금.칸.length) 다름.push(`칸 수 ${전.칸.length} → ${지금.칸.length}`)
    const 지금맵 = new Map(지금.칸.map((x) => [x.k, x]))
    for (const a of 전.칸) {
      const b = 지금맵.get(a.k)
      if (!b) { if (다름.length < 12) 다름.push(`없어짐 ${a.k.split('>').slice(-3).join('>')} .${a.c}`); continue }
      속성.forEach((p, i) => { if (a.v[i] !== b.v[i] && 다름.length < 12) 다름.push(`${a.k.split('>').slice(-3).join('>')} .${a.c} — ${p}: ${a.v[i]} → ${b.v[i]}`) })
      if (a.b.some((v, i) => Math.abs(v - b.b[i]) > 1) && 다름.length < 12) 다름.push(`${a.k.split('>').slice(-3).join('>')} .${a.c} — 자리·크기 ${a.b} → ${b.b}`)
    }
    봐(다름.length === 0, `${이름} — 칸 ${지금.칸.length}개 모양 그대로`, 다름)
    봐(지금.오류.length === 0 && 전.오류.length === 0, `${이름} — 화면 오류 0`, { 전: 전.오류, 지금: 지금.오류 })
  }
}
await 브.close()
console.log(bad ? `❌ 시험_모양그대로 ${ok}/${ok + bad}` : `✓ 시험_모양그대로 ${ok}/${ok}`)
process.exit(bad ? 1 : 0)
