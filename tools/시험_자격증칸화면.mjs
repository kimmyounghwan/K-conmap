/**
 * 📱 G637 (2026-11-10) 자격증(/cert) 종목 이름 칸 — 폰에서 빈 데 줄이기 · 화면 시험
 *   소장님: 「아니 자격증 명칭이 빈공간이 넘 많찮아」(폰 캡쳐) — 왼쪽 등급 칸(70px)이 이름 줄 내내 비고,
 *   이름이 오른쪽 좁은 칸에서 한 줄에 하나씩 서서 빈 데가 많았음(390: 이름 83개가 60줄 · 360: 70줄).
 *   구운 사이트(dist)를 띄운 뒤:  node tools/시험_자격증칸화면.mjs [주소=http://127.0.0.1:4637]
 *   ① 폰 390 · 360 — 등급 이름(기술사 · 가장 높은 등급)이 이름들 «위» 한 줄 · 이름 칸이 카드 너비를 다 씀 · 이름 줄 수 ÷ 이름 수 0.6 아래(전 0.72 · 0.84)
 *   ② PC 1280 — 그대로(왼쪽 등급 칸 70px · 이름은 오른쪽)
 *   ③ 구운 쪽(/cert.html — 자바스크립트 없이)도 폰에서 ① 과 같음(구운 사이트에 있을 때만)
 *   ④ 넘침 0 · 오류 0
 * 인터넷 안 부름(파이어베이스 · 광고 · 애널리틱스 막음).
 */
import { createRequire } from 'node:module'
const require = createRequire('/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const BASE = process.argv[2] || 'http://127.0.0.1:4637'
let bad = 0, n = 0
const ok = (이름, c, got) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (c || got === undefined ? '' : ' = ' + JSON.stringify(got).slice(0, 400))) }
const b = await chromium.launch()
/* 등급 줄마다 — 등급 이름 칸 · 이름 칸 자리와 이름 줄 수 */
const 재기 = () => {
  const lvs = [...document.querySelectorAll('.cert-lv')]
  const 줄 = lvs.map((lv) => {
    const n = lv.querySelector('.cert-lvn').getBoundingClientRect()
    const c = lv.querySelector('.cert-chips').getBoundingClientRect()
    const 칩 = [...lv.querySelectorAll('.cert-chip')].map((x) => x.getBoundingClientRect())
    return { 등급: lv.querySelector('.cert-lvn b')?.textContent || '', 위: n.bottom <= c.top + 1, 옆: n.right <= c.left + 1, 등급높이: Math.round(n.height), 등급폭: Math.round(n.width),
      칸비율: c.width / lv.getBoundingClientRect().width, 이름: 칩.length, 이름줄: new Set(칩.map((r) => Math.round(r.top))).size }
  })
  return { 줄, 넘침: document.documentElement.scrollWidth - innerWidth }
}
for (const [이름, w, 폰] of [['폰 390', 390, true], ['폰 360', 360, true], ['PC 1280', 1280, false]]) {
  console.log(`— ${이름}`)
  const ctx = await b.newContext({ viewport: { width: w, height: 844 }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', isMobile: 폰, hasTouch: 폰 })
  await ctx.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|googlesyndication|geojs|firebaseio|googleapis/, (r) => r.fulfill({ status: 200, body: '' }))
  await ctx.addInitScript(() => { try { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); sessionStorage.setItem('kcm_visit_s', '1') } catch (e) { /* 없음 */ } })
  const p = await ctx.newPage()
  const 오류 = []; p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
  await p.goto(BASE + '/cert', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('.cert-lv .cert-chip', { timeout: 20000 }); await p.waitForTimeout(500)
  const r = await p.evaluate(재기)
  const 이름수 = r.줄.reduce((a, x) => a + x.이름, 0), 줄수 = r.줄.reduce((a, x) => a + x.이름줄, 0)
  if (폰) {
    ok(`${이름} ① 등급 이름이 이름들 위 한 줄(${r.줄.length}곳)`, r.줄.length >= 10 && r.줄.every((x) => x.위 && x.등급높이 <= 26), r.줄.filter((x) => !(x.위 && x.등급높이 <= 26)).slice(0, 3))
    ok(`${이름} ① 이름 칸이 카드 너비를 다 씀(95% 넘게)`, r.줄.every((x) => x.칸비율 >= 0.95), r.줄.map((x) => Math.round(x.칸비율 * 100)).slice(0, 6))
    ok(`${이름} ① 이름 ${이름수}개가 ${줄수}줄 — 줄 ÷ 이름 0.6 아래(전: 390 은 0.72 · 360 은 0.84)`, 이름수 >= 60 && 줄수 / 이름수 < 0.6, [이름수, 줄수, Math.round(줄수 / 이름수 * 100) / 100])
  } else {
    ok(`${이름} ② PC 그대로 — 왼쪽 등급 칸 70px · 이름은 옆`, r.줄.every((x) => x.옆 && Math.abs(x.등급폭 - 70) <= 1), r.줄.slice(0, 3))
  }
  ok(`${이름} ④ 넘침 0`, r.넘침 <= 1, r.넘침)
  ok(`${이름} ④ 오류 0`, 오류.length === 0, 오류)
  await ctx.close()
  /* ③ 구운 쪽 — 자바스크립트 없이 /cert.html */
  if (폰) {
    const c2 = await b.newContext({ viewport: { width: w, height: 844 }, locale: 'ko-KR', isMobile: true, hasTouch: true, javaScriptEnabled: false })
    await c2.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|googlesyndication|geojs|firebaseio|googleapis/, (r2) => r2.fulfill({ status: 200, body: '' }))
    const q = await c2.newPage()
    const res = await q.goto(BASE + '/cert.html', { waitUntil: 'load' })
    const 있음 = res && res.ok() && (await q.locator('.cert-lv .cert-chip').count()) > 0
    if (있음) {
      const r2 = await q.evaluate(재기)
      const 이2 = r2.줄.reduce((a, x) => a + x.이름, 0), 줄2 = r2.줄.reduce((a, x) => a + x.이름줄, 0)
      ok(`${이름} ③ 구운 쪽(/cert.html) — 등급 이름 위 · 이름 칸 다 씀 · 줄 ÷ 이름 0.6 아래 · 넘침 0`, r2.줄.every((x) => x.위 && x.칸비율 >= 0.95) && 이2 >= 60 && 줄2 / 이2 < 0.6 && r2.넘침 <= 1, [r2.줄.length, 이2, 줄2, r2.넘침])
    } else console.log(`  · ${이름} ③ 구운 쪽 없음(빌드만 한 판) — 건너뜀`)
    await c2.close()
  }
}
await b.close()
console.log(`\n${bad ? '❌' : '✅'} 시험_자격증칸화면 ${n - bad}/${n}`)
process.exit(bad ? 1 : 0)
