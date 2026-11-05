/**
 * 🧪 G552 «운영은 광고로» 알림(감사공지.jsx) 시험 — 2026-11-05
 *   구운 사이트(dist)를 띄운 뒤:  LANG=C.UTF-8 node tools/시험_광고공지.mjs [주소=http://127.0.0.1:4986]  · OUT=폴더 면 화면 사진
 *   소장님 「…이용자에게 무료로 오픈하고, 광고비용으로 운영비 충당하려고 한다. 많은 관심 부탁드린다. 라는 알림을 띄워줘」
 *          → 「운영은 광고로 사이트 운영비는 업체 광고로 충당하려고 합니다. … 고맙습니다.----이걸로 알림창 다시 만들어줘」
 *   ① 들어오면 창 한 번 — 제목 «📢 운영은 광고로» · 소장님 글 그대로 · 맵톡 예의 줄(굵게 · 맨 위) · 광고 · 제휴 문의(/ad) · 맵톡 · 문의 링크 · 닫기
 *   ② 닫으면 같은 창(탭)의 다른 화면에선 다시 안 뜸 · 띠는 남음 · 띠 «공지 보기» 로 다시 열림
 *   ③ 폭 320 · 390 · 1280 넘침 없음 · 오류 0
 *   ④ 날짜 — 11-12 23:59 엔 띠 있음 · 11-13 00:01 엔 없음
 *   ⑤ 자동 브라우저(webdriver)엔 창을 저절로 안 띄움(띠는 있음) — 다른 화면 시험이 창에 가리지 않게
 * 가상 자료만 씀 · 인터넷 안 부름.
 */
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const BASE = process.argv[2] || 'http://127.0.0.1:4986'
const OUT = process.env.OUT || ''
let bad = 0, n = 0
const ok = (이름, c, got) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (c || got === undefined ? '' : ' = ' + JSON.stringify(got).slice(0, 400))) }
const b = await chromium.launch()
const 글들 = [
  '사이트 운영비는 업체 광고로 충당하려고 합니다. 이용하시는 분께는 지금처럼 무료로 열어 두겠습니다.',
  '광고 단가는 최저로 하겠습니다. 알릴 업체가 있으시면 «📣 광고 · 제휴 문의»로 연락 주세요.',
  '많은 관심과 이용 부탁드립니다. 불편한 점은 맵톡이나 문의로 알려 주시면 바로 고치겠습니다. 고맙습니다.',
]
async function 새쪽(w, h, { 때 = '2026-11-05T20:00:00+09:00', 자동끔 = true, 폰 = true } = {}) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', isMobile: 폰, hasTouch: 폰, deviceScaleFactor: 2,
    userAgent: 폰 ? 'Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36' : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36' })
  await ctx.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|googlesyndication|geojs/, (r) => r.fulfill({ status: 200, body: '' }))
  await ctx.route(/firebaseio\.com|firebasedatabase\.app/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  const t = Date.parse(때)
  await ctx.addInitScript(([t, 자동끔]) => {
    const 원 = Date; const 차 = t - 원.now()
    const D = function (...a) { return a.length ? new 원(...a) : new 원(원.now() + 차) }
    D.now = () => 원.now() + 차; D.UTC = 원.UTC; D.parse = 원.parse; D.prototype = 원.prototype
    window.Date = D
    if (자동끔) { try { Object.defineProperty(navigator, 'webdriver', { get: () => false }) } catch (e) { /* 없음 */ } }
  }, [t, 자동끔])
  const p = await ctx.newPage()
  const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
  return { ctx, p, 오류 }
}
const 넘침 = (p) => p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
const 창글 = (p) => p.evaluate(() => { const c = document.querySelector('.noticepop'); return c ? { 제목: (c.querySelector('#noticepop-h') || {}).textContent, 글: c.querySelector('.noticepop-b').innerText.replace(/\s+/g, ' '), 굵게: (c.querySelector('.noticepop-strong b') || {}).textContent, 링크: [...c.querySelectorAll('a')].map((a) => a.getAttribute('href')) } : null })
const 띠글 = (p) => p.evaluate(() => ((document.querySelector('.noticebar') || {}).innerText || '').replace(/\s+/g, ' '))

console.log('① ② 창 · 띠 — 폰 390')
{
  const { ctx, p, 오류 } = await 새쪽(390, 844)
  await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500)
  const 창 = await 창글(p)
  ok('들어오면 창 — 제목 «📢 운영은 광고로»', !!창 && 창.제목 === '📢 운영은 광고로', 창 && 창.제목)
  ok('창 글 = 소장님 글 그대로(세 문단)', !!창 && 글들.every((x) => 창.글.includes(x)), 창 && 창.글)
  ok('맵톡 예의 줄 굵게 · 맨 위(G345 «항상 포함»)', !!창 && /맵톡은 여러 분이 함께 쓰는 곳입니다\. 예의를 갖추고 이용해 주세요\./.test(창.굵게 || '') && 창.글.indexOf('맵톡은 여러 분이') < 창.글.indexOf('사이트 운영비'), 창 && 창.굵게)
  ok('창 링크 — 광고 · 제휴 문의(/ad) · 맵톡(/qna) · 문의(/contact) · 아래 단추(/ad · /qna)', !!창 && ['/ad', '/qna', '/contact'].every((x) => 창.링크.includes(x)), 창 && 창.링크)
  ok('«무료» 는 소장님 글에만(창 · 띠) · «클로드» 없음', !!창 && !/클로드/.test(창.글 + (await 띠글(p))))
  const 띠 = await 띠글(p)
  ok('띠 «📢 운영은 광고로 — 이용하시는 분께는 지금처럼 무료로 열어 두겠습니다 …» · 공지 보기', /운영은 광고로/.test(띠) && /지금처럼 무료로 열어 두겠습니다/.test(띠) && /공지 보기/.test(띠), 띠)
  if (OUT) await p.screenshot({ path: OUT + '/공지_창_폰390.png' })
  ok('폰 390 넘침 0 · 오류 0(창 열린 채)', (await 넘침(p)) <= 0 && !오류.length, [await 넘침(p), 오류])
  await p.click('.noticepop-f button'); await p.waitForTimeout(300)
  ok('«닫기» → 창 닫힘 · 띠는 남음', !(await p.$('.noticepop')) && !!(await p.$('.noticebar')))
  await p.goto(BASE + '/tools', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1500)
  ok('같은 창(탭)의 다른 화면 — 창 다시 안 뜸 · 띠 있음', !(await p.$('.noticepop')) && !!(await p.$('.noticebar')))
  if (OUT) { await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(200); await p.screenshot({ path: OUT + '/공지_띠_폰390.png', clip: { x: 0, y: 0, width: 390, height: 260 } }) }
  await p.click('.noticebar .go'); await p.waitForTimeout(400)
  ok('띠 «공지 보기» → 창 다시 열림', !!(await p.$('.noticepop')))
  await p.click('.noticepop-x'); await p.waitForTimeout(200)
  ok('✕ 로 닫힘', !(await p.$('.noticepop')))
  await ctx.close()
}
console.log('③ 폭 320 · 1280')
for (const [w, h, 폰] of [[320, 640, true], [1280, 860, false]]) {
  const { ctx, p, 오류 } = await 새쪽(w, h, { 폰 })
  await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500)
  const 창 = await 창글(p)
  const 상자 = await p.evaluate(() => { const c = document.querySelector('.noticepop-c'); if (!c) return null; const r = c.getBoundingClientRect(); return { l: r.left, r: r.right, w: innerWidth } })
  ok(`${w} 창 · 화면 안(옆 넘침 없음) · 넘침 0 · 오류 0`, !!창 && !!상자 && 상자.l >= 0 && 상자.r <= 상자.w && (await 넘침(p)) <= 0 && !오류.length, [상자, await 넘침(p), 오류])
  if (OUT && !폰) await p.screenshot({ path: OUT + '/공지_창_PC1280.png' })
  await ctx.close()
}
console.log('④ 날짜')
for (const [때, 있어야] of [['2026-11-12T23:59:00+09:00', true], ['2026-11-13T00:01:00+09:00', false]]) {
  const { ctx, p } = await 새쪽(390, 844, { 때 })
  await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2000)
  const 띠 = !!(await p.$('.noticebar'))
  ok(`${때.slice(0, 16)} 띠 ${있어야 ? '있음' : '없음'}`, 띠 === 있어야, 띠)
  await ctx.close()
}
console.log('⑤ 자동 브라우저(webdriver)')
{
  const { ctx, p, 오류 } = await 새쪽(390, 844, { 자동끔: false })
  await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500)
  ok('webdriver 면 창 저절로 안 뜸 · 띠는 있음 · 오류 0', !(await p.$('.noticepop')) && !!(await p.$('.noticebar')) && !오류.length, 오류)
  await ctx.close()
}
await b.close()
console.log(`\n${bad ? '✗' : '✓'} 시험_광고공지 ${n - bad}/${n}`)
if (bad) process.exit(1)
