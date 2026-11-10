/**
 * ✍ G635 (2026-11-10) 서식 «작성 예시» 화면 시험 — 구운 사이트(dist)를 띄운 뒤:  node tools/시험_서식예시화면.mjs [주소=http://127.0.0.1:4635]
 *   소장님: 「예시 만들어 주고」 — 점검에서 서식 200 중 6이 «예시 없음»(공내역서 한 벌 · 위험성평가 5종)
 *   ① /forms/gongnaeyeok-hanbeol — «✍ 예시 채우기» → 공사명 · 발주기관 · 위치 · 작성일이 가상 값 · 서명 칸 · «🧹 빈칸으로» → 빈 칸(현장명 · 회사명 기억은 그대로)
 *   ② /forms/wih-* 다섯 — 미리보기 이름 «✍ 작성 예시(지어낸 현장)» · 종이에 예시가 들어 있음(빈 종이 아님)
 *   ③ /forms 목록 — «✍ 작성 예시» 거르기에 위험성평가 · 공내역서가 들어감(카드 표도)
 *   ④ PC 1280 · 폰 390 넘침 0 · 오류 0
 */
import { createRequire } from 'node:module'
const require = createRequire('/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const BASE = process.argv[2] || 'http://127.0.0.1:4635'
let bad = 0, n = 0
const ok = (이름, c, got) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (c || got === undefined ? '' : ' = ' + JSON.stringify(got).slice(0, 400))) }
const b = await chromium.launch()
const 위험 = ['wih-choego', 'wih-susi', 'wih-hoeui', 'wih-gyoyuk', 'wih-seonggwa']
for (const [이름, w, h, 폰] of [['PC 1280', 1280, 900, false], ['폰 390', 390, 844, true]]) {
  console.log(`— ${이름}`)
  const ctx = await b.newContext({ viewport: { width: w, height: h }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', isMobile: 폰, hasTouch: 폰 })
  await ctx.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|googlesyndication|geojs|firebaseio|googleapis/, (r) => r.fulfill({ status: 200, body: '' }))
  await ctx.addInitScript(() => { try { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); sessionStorage.setItem('kcm_notice_seen', '2026-10-업체'); sessionStorage.setItem('kcm_visit_s', '1') } catch (e) { /* 없음 */ } })
  const p = await ctx.newPage()
  const 오류 = []; p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
  // ①
  await p.goto(BASE + '/forms/gongnaeyeok-hanbeol', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('.fw-bar', { timeout: 20000 })
  const 단추 = p.locator('.fw-bar button', { hasText: '✍ 예시 채우기' })
  ok(`${이름} ① 공내역서 한 벌 — «✍ 예시 채우기» 단추`, (await 단추.count()) === 1)
  await 단추.click(); await p.waitForTimeout(400)
  const 칸값 = await p.evaluate(() => [...document.querySelectorAll('#작성 input, #작성 textarea')].map((e) => e.value).filter(Boolean))
  ok(`${이름} ① 예시 — 공사명 «가상 OO지구 배수로 정비공사» · 발주 «가상시 건설과» · 위치 · 작성일 · 서명 둘`, ['가상 OO지구 배수로 정비공사', '가상시 건설과', '가상시 OO동 123 일원', '2026. 11. 10.', '박가상', '김가상'].every((v) => 칸값.includes(v)), 칸값.slice(0, 12))
  const 말 = await p.locator('.fw-say').first().innerText().catch(() => '')
  ok(`${이름} ① 알림 «가상의 현장으로 채운 작성 예시»`, /가상의 현장으로 채운 작성 예시/.test(말), 말)
  await p.locator('.fw-bar button', { hasText: '🧹 빈칸으로' }).click(); await p.waitForTimeout(300)
  const 빈뒤 = await p.evaluate(() => [...document.querySelectorAll('#작성 input, #작성 textarea')].map((e) => e.value))
  ok(`${이름} ① «🧹 빈칸으로» → 가상 값 사라짐`, !빈뒤.some((v) => /가상/.test(v)), 빈뒤.slice(0, 8))
  ok(`${이름} ① 넘침 0`, (await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 1)
  // ②
  for (const s of 위험) {
    await p.goto(BASE + '/forms/' + s, { waitUntil: 'domcontentloaded' })
    await p.waitForSelector('.rk-preview', { timeout: 20000 }); await p.waitForTimeout(300)
    const v = await p.evaluate(() => ({ 머리: [...document.querySelectorAll('.sec-title')].map((e) => e.innerText).find((t) => /미리보기/.test(t)) || '', 글: (document.querySelector('.rk-preview') || {}).innerText || '' }))
    ok(`${이름} ② ${s} — «✍ 작성 예시(지어낸 현장)» · 종이에 예시 글`, /✍ 작성 예시\(지어낸 현장\)/.test(v.머리) && v.글.replace(/\s+/g, '').length > 80 && !/예문/.test(v.머리), [v.머리, v.글.length])
  }
  // ③
  await p.goto(BASE + '/forms', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('.fm-card, .fm-gal', { timeout: 20000 }); await p.waitForTimeout(500)
  const 표 = await p.evaluate(() => {
    const 카드 = [...document.querySelectorAll('a.fm-card, a.fm-gal')]
    const 찾 = (slug) => 카드.filter((a) => a.getAttribute('href') === '/forms/' + slug)
    const 붙음 = (slug) => 찾(slug).some((a) => !!a.querySelector('.fm-ex'))
    return { 있음: 카드.length, 위험: ['wih-choego', 'wih-susi', 'wih-hoeui', 'wih-gyoyuk', 'wih-seonggwa'].map((s) => [s, 찾(s).length, 붙음(s)]), 공: [찾('gongnaeyeok-hanbeol').length, 붙음('gongnaeyeok-hanbeol')] }
  })
  ok(`${이름} ③ 목록 카드 — 위험성평가 5종 · 공내역서에 «✍ 작성 예시» 표`, 표.위험.every(([, c, 붙]) => c === 0 || 붙) && 표.위험.some(([, c]) => c > 0) && (표.공[0] === 0 || 표.공[1]), 표)
  const 거르개 = p.locator('button, .chip', { hasText: '✍ 작성 예시' }).first()
  if (await 거르개.count()) {
    await 거르개.click(); await p.waitForTimeout(500)
    const 걸 = await p.evaluate(() => [...document.querySelectorAll('a.fm-card, a.fm-gal')].map((a) => a.getAttribute('href')))
    ok(`${이름} ③ «✍ 작성 예시» 거르기 — 위험성평가 · 공내역서 들어감`, 걸.includes('/forms/wih-susi') && 걸.includes('/forms/gongnaeyeok-hanbeol'), 걸.length)
  } else ok(`${이름} ③ «✍ 작성 예시» 거르기 단추`, false)
  ok(`${이름} ④ 넘침 0`, (await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 1)
  ok(`${이름} ④ 오류 0`, 오류.length === 0, 오류)
  await ctx.close()
}
await b.close()
console.log(`\n${bad ? '❌' : '✅'} 시험_서식예시화면 ${n - bad}/${n}`)
process.exit(bad ? 1 : 0)
