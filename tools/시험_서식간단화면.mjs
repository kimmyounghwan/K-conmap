/**
 * 🧭 G523 서식 첫 화면 «찾기 칸이 첫 화면에» 화면 시험 — 구운 사이트(dist)를 띄운 뒤:
 *   node tools/시험_서식간단화면.mjs [주소=http://127.0.0.1:4996]
 *   소장님 「사이트 점검도 해 이용자 입장에서 최대한 편하고 간단하게」 → 「이용자에게 편한걸로 해줘」(11-03)
 *   전(폰 390): 소개 글 다섯 줄 뒤에 찾기 칸(640px) — 인사 쪽지에 가림
 *   ① 폰 390: 소개는 첫 문장만(서식 N가지 · 사이트에서 작성 · 무료 · 회원가입 없음) · 찾기 칸이 화면 위쪽(520px 위) · 찾으면 나옴
 *   ② PC 1280: 소개 세 문장 그대로
 *   ③ 폰 360 · 320 넘침 0 · 오류 0
 * 인터넷 안 부름(파이어베이스 · 광고 · 애널리틱스 막음).
 */
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const BASE = process.argv[2] || 'http://127.0.0.1:4996'

let bad = 0, n = 0
const ok = (이름, c, got) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (c || got === undefined ? '' : ' = ' + JSON.stringify(got).slice(0, 300))) }
const b = await chromium.launch()
const UA폰 = 'Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'
async function 새쪽(w, h, 폰 = true) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', isMobile: 폰, hasTouch: 폰, ...(폰 ? { userAgent: UA폰 } : {}) })
  await ctx.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|googlesyndication|geojs|firebaseio|firebasedatabase/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await ctx.addInitScript(() => { try { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); sessionStorage.setItem('kcm_notice_seen', '2026-10-업체'); sessionStorage.setItem('kcm_visit_s', '1') } catch (e) { /* 없음 */ } })
  const p = await ctx.newPage()
  const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
  return { ctx, p, 오류 }
}
const 넘침 = (p) => p.evaluate(() => document.documentElement.scrollWidth - innerWidth)
const 소개 = (p) => p.evaluate(() => (document.querySelector('.lead-card .why2') || {}).innerText || '')
const 찾기위 = (p) => p.evaluate(() => { const i = document.querySelector('input[placeholder*="서식 찾기"]'); return i ? Math.round(i.getBoundingClientRect().top) : null })

console.log('① 폰 390')
{
  const { ctx, p, 오류 } = await 새쪽(390, 844)
  await p.goto(BASE + '/forms', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('input[placeholder*="서식 찾기"]', { timeout: 15000 })
  await p.waitForTimeout(600)
  const 글 = await 소개(p)
  ok('소개는 첫 문장만 — 서식 N가지 · 사이트에서 작성 · 무료 · 회원가입 없음', /서식 \d+가지/.test(글) && /무료/.test(글) && /회원가입 없음/.test(글) && !/현장에서 쓰던 틀/.test(글), 글)
  ok('찾기 칸이 화면 위쪽(520px 위 · 전 640)', (await 찾기위(p)) < 520, await 찾기위(p))
  await p.fill('input[placeholder*="서식 찾기"]', '착공계')
  await p.waitForTimeout(600)
  ok('«착공계» 찾으면 나옴', /착공/.test(await p.evaluate(() => document.querySelector('main').innerText)))
  ok('폰 390 넘침 0', (await 넘침(p)) <= 0, await 넘침(p))
  ok('오류 0(폰)', !오류.length, 오류)
  await ctx.close()
}
console.log('② PC 1280 — 소개 그대로')
{
  const { ctx, p, 오류 } = await 새쪽(1280, 900, false)
  await p.goto(BASE + '/forms', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('input[placeholder*="서식 찾기"]', { timeout: 15000 })
  ok('PC 소개 세 문장 다', /현장에서 쓰던 틀/.test(await 소개(p)) && /그것부터 보여 드립니다/.test(await 소개(p)), await 소개(p))
  ok('오류 0(PC)', !오류.length, 오류)
  await ctx.close()
}
console.log('③ 폰 360 · 320')
for (const [w, h] of [[360, 740], [320, 640]]) {
  const s = await 새쪽(w, h)
  await s.p.goto(BASE + '/forms', { waitUntil: 'domcontentloaded' })
  await s.p.waitForSelector('input[placeholder*="서식 찾기"]', { timeout: 15000 })
  ok(`폰 ${w} 넘침 0`, (await 넘침(s.p)) <= 0, await 넘침(s.p))
  ok(`폰 ${w} 오류 0`, !s.오류.length, s.오류)
  await s.ctx.close()
}
await b.close()
console.log(`\n${bad ? '✗' : '✓'} 시험_서식간단화면 ${n - bad}/${n}`)
process.exit(bad ? 1 : 0)
