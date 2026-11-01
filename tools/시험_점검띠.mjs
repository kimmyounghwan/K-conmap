// 🛠 G491 (2026-11-01) 점검 띠 — 소장님 「공지 하나 띄워. 자정 12시까지 사이트 점검, 이용은 가능. 12시 넘으면 공지 제거」
//   화면 빌드를 얹은 뒤  B=http://127.0.0.1:4467 node tools/시험_점검띠.mjs
//   ① / · /jeoksan · /forms 맨 위에 띠 «오늘 자정(24시)까지 사이트 점검 중 … 이용은 그대로» · 창(noticepop) 없음 · «공지 보기» 없음
//   ② 폭 320 · 360 · 390 · 860 · 1280 가로 넘침 없음(띠가 두 줄로 접힘)
//   ③ 한국 날짜가 «까지» 다음 날(11-02 0시)이면 띠 없음 — Date.now 를 앞당겨 봄 · 11-01 23:59 엔 있음
import { createRequire } from 'module'
const require = createRequire(process.env.PW || '/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const 주소 = process.env.B || 'http://127.0.0.1:4467'
let ok = 0, bad = 0
const 봐 = (c, m, 더 = '') => { if (c) ok++; else bad++; console.log(c ? '  ✓' : '  ✗', m, c ? '' : String(typeof 더 === 'string' ? 더 : JSON.stringify(더)).slice(0, 400)) }
const 브 = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] })
const 판 = async (언제) => {
  /* 헤드리스 UA 는 로봇으로 보아 띠를 안 띄우므로 보통 크롬 UA 로 */
  const c = await 브.newContext({ viewport: { width: 1280, height: 860 }, locale: 'ko-KR', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36' })
  await c.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|geojs|firebaseio/, (r) => r.fulfill({ status: 200, body: '' }))
  if (언제) await c.addInitScript((t) => { const 원 = Date; const 차 = t - 원.now(); const D = function (...a) { return a.length ? new 원(...a) : new 원(원.now() + 차) }; D.now = () => 원.now() + 차; D.UTC = 원.UTC; D.parse = 원.parse; D.prototype = 원.prototype; window.Date = D }, 언제)
  return c
}
/* ① 띠 · 창 없음 */
{
  const c = await 판(Date.parse('2026-11-01T14:00:00+09:00'))
  for (const 길 of ['/', '/jeoksan', '/forms']) {
    const p = await c.newPage(); const 오류 = []; p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
    await p.goto(주소 + 길, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500)
    const r = await p.evaluate(() => ({ 띠: (document.querySelector('.noticebar') || {}).innerText || '', 창: !!document.querySelector('.noticepop'), 보기: !!document.querySelector('.noticebar .go') }))
    봐(/자정\(24시\)까지 사이트 점검 중/.test(r.띠) && /이용은 그대로/.test(r.띠) && !r.창 && !r.보기, `${길} 띠 «자정까지 점검 · 이용은 그대로» · 창 없음 · 공지 보기 없음`, r)
    봐(!오류.length, `${길} 화면 오류 없음`, 오류.join(' | '))
    if (길 === '/') for (const w of [320, 360, 390, 860, 1280]) {
      await p.setViewportSize({ width: w, height: 800 }); await p.waitForTimeout(300)
      const n = await p.evaluate(() => ({ 쪽: document.documentElement.scrollWidth - document.documentElement.clientWidth, 띠: (() => { const b = document.querySelector('.noticebar'); return b ? b.scrollWidth - b.clientWidth : 0 })() }))
      봐(n.쪽 <= 0 && n.띠 <= 0, `② ${w}px 가로 넘침 없음(쪽 · 띠)`, n)
    }
    await p.close()
  }
  await c.close()
}
/* ③ 날짜 */
for (const [언제, 있어야] of [['2026-11-01T23:59:00+09:00', true], ['2026-11-02T00:01:00+09:00', false], ['2026-11-03T09:00:00+09:00', false]]) {
  const c = await 판(Date.parse(언제)); const p = await c.newPage()
  await p.goto(주소 + '/', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2000)
  const 띠 = await p.evaluate(() => !!document.querySelector('.noticebar'))
  봐(띠 === 있어야, `③ ${언제.slice(0, 16)} 띠 ${있어야 ? '있음' : '없음'}`, 띠)
  await c.close()
}
await 브.close()
console.log(bad ? `✗ ${bad} 틀림 · ${ok} 맞음` : `✓ 모두 맞음(${ok})`)
process.exit(bad ? 1 : 0)
