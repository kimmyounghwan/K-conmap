/**
 * 🧪 G792 · G793 · G793b 점검 시험(감사공지.jsx — 점검창 · 점검막기화면 · 점검띠)
 *   소장님 11-20 「토요일 일요일 시스템 점검으로 이용을 할 수 없다는 공지를 띄워줘. 공지창을 따로 만들어서 띄워줘」 →
 *   「토일 사이트 사용 못하게 막고」 「이용자만 사이트 사용 못하는 거고, 공고 및 다른 건 자동으로 돌아가야 해」 「내 노트북은 사용가능하게 하고」 →
 *   「화면에 공지 띄워야지 그래야 알지. 맵톡에만 올리면 어떻게 알라」 · ⭐ 「항상 공지는 사이트 나갔다 들어오면 다시 뜨게 해줘」
 *   가짜 파이어베이스로 구운 판(굽기.sh)을 띄운 뒤:  LANG=C.UTF-8 node tools/시험_점검창.mjs [주소=http://127.0.0.1:5807] · OUT=폴더 면 화면 사진
 *   ① 점검 앞날(11-20) — 점검창(닫을 수 있음)이 먼저 → 닫으면 제휴 모집 창 · 글 · 폭 320 · 390 · 1280 · 어두운 화면 · 닫기 길 셋 · 40초 떠났다 오면 다시 · 10초는 안 뜸
 *   ② 점검 날(11-21 · 11-22) — 이용자 화면 전체를 덮음(닫기 없음 · Esc · 누르기로 안 풀림 · 뒤는 inert · 주소 그대로 · 공지창 안 뜸) · 날 경계 넷
 *   ③ 소장님 기기(kcm_op · 열쇠말) — 안 덮음 · 맨 위 «점검 중» 한 줄 · 제휴 창은 그대로 · «👀 이용자 화면 보기» → 덮인 화면 + 끄기 단추 → 다시 한 줄
 *   ④ 안 덮는 곳 — 검색 로봇 · 자동 브라우저(webdriver) ⑤ 날이 바뀌면 저절로 — 금 23:59 → 토 0시 덮음 · 일 23:59 → 월 0시 풂(1분마다 봄)
 * 가상 자료만 씀 · 인터넷 안 부름.
 */
import { createRequire } from 'node:module'
const require = createRequire(process.env.PW || '/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const BASE = process.argv[2] || 'http://127.0.0.1:5807'
const OUT = process.env.OUT || ''
let bad = 0, n = 0
const ok = (이름, c, got) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (c || got === undefined ? '' : ' = ' + JSON.stringify(got).slice(0, 400))) }
const b = await chromium.launch()
const 열쇠말값 = '198d0951f2337d02ab42668d11ae45be65998e0f0684bc18d070c302e40751ab'   /* lib/gate.js HASH(공개 저장소에 있는 값) */
const UA폰 = 'Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'
const UAPC = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
async function 새쪽(w, h, { 때 = '2026-11-20T10:00:00+09:00', 자동끔 = true, 폰 = true, 어둠 = false, 소장님 = '', ua = '' } = {}) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', isMobile: 폰, hasTouch: 폰, deviceScaleFactor: OUT ? 2 : 1, colorScheme: 어둠 ? 'dark' : 'light', userAgent: ua || (폰 ? UA폰 : UAPC) })
  await ctx.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|googlesyndication|geojs|daumcdn|kakao|coupang/, (r) => r.fulfill({ status: 200, body: '' }))
  await ctx.route(/firebaseio\.com|firebasedatabase\.app/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  const t = Date.parse(때)
  await ctx.addInitScript(([t, 자동끔, 소장님, 열쇠말값]) => {
    const 원 = Date; const 차 = t - 원.now()
    const D = function (...a) { return a.length ? new 원(...a) : new 원(원.now() + 차 + (window.__더 || 0)) }
    D.now = () => 원.now() + 차 + (window.__더 || 0); D.UTC = 원.UTC; D.parse = 원.parse; D.prototype = 원.prototype
    window.Date = D
    try { Object.defineProperty(document, 'hidden', { configurable: true, get: () => window.__숨김 === true }); Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (window.__숨김 === true ? 'hidden' : 'visible') }) } catch (e) { /* 없음 */ }
    if (자동끔) { try { Object.defineProperty(navigator, 'webdriver', { get: () => false }) } catch (e) { /* 없음 */ } }
    try { if (소장님 === 'op') localStorage.setItem('kcm_op', '1'); if (소장님 === '열쇠말') localStorage.setItem('kcm_lab_ok', 열쇠말값) } catch (e) { /* */ }
  }, [t, 자동끔, 소장님, 열쇠말값])
  const p = await ctx.newPage()
  const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
  p.on('dialog', (d) => d.dismiss())
  return { ctx, p, 오류 }
}
const 넘침 = (p) => p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
const 상태 = (p) => p.evaluate(() => ({
  창: [...document.querySelectorAll('.noticepop')].map((e) => (e.classList.contains('checkpop') ? '점검' : '공지')).join(','),
  막음: !!document.querySelector('.checkblock'), 띠: !!document.querySelector('.checkband'),
  inert: (document.getElementById('root') || {}).hasAttribute ? document.getElementById('root').hasAttribute('inert') : null,
  html: document.documentElement.style.overflow, body: document.body.style.overflow, 길: location.pathname,
}))
const 들어감 = async (p, 길 = '/') => { await p.goto(BASE + 길, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2300) }
const 떠났다옴 = async (p, ms) => {
  await p.evaluate(() => { window.__숨김 = true; document.dispatchEvent(new Event('visibilitychange')) })
  await p.evaluate((ms) => { window.__더 = (window.__더 || 0) + ms }, ms)
  await p.evaluate(() => { window.__숨김 = false; document.dispatchEvent(new Event('visibilitychange')) })
  await p.waitForTimeout(500)
}
const 다닫기 = async (p) => { for (let i = 0; i < 4; i++) { const e = await p.$('.noticepop-f button'); if (!e) break; await e.click(); await p.waitForTimeout(350) } }

console.log('① 점검 앞날(11-20) — 닫을 수 있는 점검창이 먼저')
for (const [이름, w, h, 폰, 어둠] of [['폰 390', 390, 844, true, false], ['좁은 폰 320', 320, 640, true, false], ['PC 1280', 1280, 900, false, false], ['폰 390 어두운', 390, 844, true, true]]) {
  const { ctx, p, 오류 } = await 새쪽(w, h, { 폰, 어둠 })
  await 들어감(p)
  let s = await 상태(p)
  ok(`${이름} 들어오면 점검창만(덮지 않음 · 공지창은 아직)`, s.창 === '점검' && !s.막음, s)
  const 글 = await p.evaluate(() => { const e = document.querySelector('.checkpop .noticepop-c'); return e ? e.innerText : '' })
  ok(`${이름} 글 — 날짜 · «이용하실 수 없습니다» · 사과 · 예의 줄 · 서명 · 금지 말 없음`, /11월 21일\(토\) 0시부터 11월 22일\(일\) 24시까지/.test(글) && /시스템 점검으로 이용하실 수 없습니다/.test(글) && /불편을 드려 죄송합니다/.test(글) && /예의를 갖추고 이용해 주세요/.test(글) && /— K-건설맵/.test(글) && !/무료|클로드|Claude/.test(글), 글.slice(0, 160))
  const 자리 = await p.evaluate(() => { const r = document.querySelector('.checkpop .noticepop-c').getBoundingClientRect(); const f = document.querySelector('.checkpop .noticepop-f button').getBoundingClientRect(); return { t: r.top, b: r.bottom, l: r.left, r: r.right, fb: f.bottom, w: innerWidth, h: innerHeight } })
  ok(`${이름} 창이 화면 안 · 닫기 단추가 굴리지 않고 보임 · html 잠김`, 자리.t >= 0 && 자리.b <= 자리.h + 1 && 자리.l >= 0 && 자리.r <= 자리.w + 1 && 자리.fb <= 자리.h && s.html === 'hidden' && s.body === '', { 자리, html: s.html })
  if (어둠) { const 색 = await p.evaluate(() => { const e = document.querySelector('.checkpop .noticepop-c'); return [getComputedStyle(e).backgroundColor, getComputedStyle(e.querySelector('p')).color] }); ok(`${이름} 글자 ≠ 바탕`, 색[0] !== 색[1], 색) }
  if (OUT) await p.screenshot({ path: `${OUT}/G793_금_점검창_${이름.replace(/\s+/g, '')}.png` })
  await p.click('.checkpop .noticepop-f button'); await p.waitForTimeout(500)
  s = await 상태(p)
  ok(`${이름} 점검창을 닫으면 제휴 모집 창이 그대로`, s.창 === '공지', s)
  await 다닫기(p)
  s = await 상태(p)
  ok(`${이름} 둘 다 닫음 — 창 없음 · html 풀림 · 넘침 0 · 오류 0`, !s.창 && s.html === '' && (await 넘침(p)) <= 0 && !오류.length, { s, 오류 })
  await ctx.close()
}
for (const [길, 함] of [['✕', (p) => p.click('.checkpop .noticepop-x')], ['Esc', (p) => p.keyboard.press('Escape')], ['바깥 누르기', (p) => p.mouse.click(5, 5)]]) {
  const { ctx, p } = await 새쪽(1280, 900, { 폰: false })
  await 들어감(p)
  const 있었음 = !!(await p.$('.checkpop'))
  await 함(p); await p.waitForTimeout(400)
  ok(`금 — ${길} 로 점검창 닫힘`, 있었음 && !(await p.$('.checkpop')))
  await ctx.close()
}
{
  const { ctx, p, 오류 } = await 새쪽(390, 844)
  await 들어감(p); await 다닫기(p)
  await 떠났다옴(p, 40000)
  ok('금 — 닫은 뒤 40초 떠났다 옴 → 점검창이 먼저 다시(⭐ 항상 다시 뜸)', (await 상태(p)).창 === '점검', await 상태(p))
  await 다닫기(p)
  await 떠났다옴(p, 10000)
  ok('금 — 10초만 떠났다 옴 → 안 뜸(잠깐 다른 앱)', !(await 상태(p)).창, await 상태(p))
  await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2200)
  ok('금 — 쓰는 중 새로고침은 안 뜸(G284)', !(await 상태(p)).창 && !오류.length, 오류)
  await ctx.close()
}

console.log('② 점검 날(토 · 일) — 이용자 화면을 덮음')
for (const [때, 덮어야, 창있어야] of [['2026-11-20T23:59:00+09:00', false, '점검'], ['2026-11-21T00:00:30+09:00', true, ''], ['2026-11-22T23:59:00+09:00', true, ''], ['2026-11-23T00:00:30+09:00', false, '공지']]) {
  const { ctx, p } = await 새쪽(390, 844, { 때 })
  await 들어감(p)
  const s = await 상태(p)
  ok(`${때.slice(0, 16)} — ${덮어야 ? '덮음 · 창 없음' : '안 덮음 · ' + 창있어야 + ' 창'}`, s.막음 === 덮어야 && s.창 === 창있어야, s)
  await ctx.close()
}
for (const [이름, w, h, 폰, 어둠, 길] of [['폰 390', 390, 844, true, false, '/'], ['좁은 폰 320', 320, 640, true, false, '/qna'], ['PC 1280', 1280, 900, false, false, '/tools/teukgo-boheom'], ['폰 390 어두운', 390, 844, true, true, '/first']]) {
  const { ctx, p, 오류 } = await 새쪽(w, h, { 때: '2026-11-21T09:00:00+09:00', 폰, 어둠 })
  await 들어감(p, 길)
  const s = await 상태(p)
  ok(`${이름} ${길} — 덮음 · 뒤(#root) inert · html 잠김 · 공지창 안 뜸`, s.막음 && s.inert === true && s.html === 'hidden' && s.body === '' && !s.창, s)
  const 판 = await p.evaluate(() => { const e = document.querySelector('.checkblock'); const r = e.getBoundingClientRect(); const c = e.querySelector('.checkblock-c').getBoundingClientRect(); return { 덮음: r.top <= 0 && r.left <= 0 && r.right >= innerWidth - 1 && r.bottom >= innerHeight - 1, 안: c.top >= 0 && c.left >= 0 && c.right <= innerWidth + 1, 단추: [...e.querySelectorAll('button')].map((x) => x.textContent.trim()), 글: e.innerText, 맨위: document.elementFromPoint(innerWidth / 2, 30) && document.elementFromPoint(innerWidth / 2, 30).closest('.checkblock') ? '덮음' : '뒤가 보임' } })
  ok(`${이름} 화면 전체를 덮음 · 글은 화면 안 · 닫기 단추 없음 · 맨 위(머리줄 자리)도 덮음`, 판.덮음 && 판.안 && 판.단추.length === 0 && 판.맨위 === '덮음', 판)
  ok(`${이름} 글 — «시스템 점검 중입니다» · 날짜 · «이용하실 수 없습니다» · 예의 줄 · 금지 말 없음`, /시스템 점검 중입니다/.test(판.글) && /11월 21일\(토\) 0시부터 11월 22일\(일\) 24시까지/.test(판.글) && /이용하실 수 없습니다/.test(판.글) && /예의를 갖추고 이용해 주세요/.test(판.글) && !/무료|클로드|Claude/.test(판.글), 판.글.slice(0, 160))
  await p.keyboard.press('Escape'); await p.mouse.click(Math.round(w / 2), 30); await p.mouse.click(10, h - 30); await p.waitForTimeout(600)
  const s2 = await 상태(p)
  ok(`${이름} Esc · 누르기로 안 풀림 · 주소 그대로 · 넘침 0 · 오류 0`, s2.막음 && s2.길 === s.길 && (await 넘침(p)) <= 0 && !오류.length, { s2, 오류 })
  if (어둠) { const 색 = await p.evaluate(() => { const e = document.querySelector('.checkblock-c'); return [getComputedStyle(e).backgroundColor, getComputedStyle(e.querySelector('p')).color, getComputedStyle(document.querySelector('.checkblock')).backgroundColor] }); ok(`${이름} 글자 ≠ 바탕`, 색[0] !== 색[1] && 색[2] !== 색[1], 색) }
  if (OUT) await p.screenshot({ path: `${OUT}/G793_토_점검중_${이름.replace(/\s+/g, '')}.png` })
  await ctx.close()
}

console.log('③ 소장님 기기 — 안 덮음 · 맨 위 한 줄')
{
  const { ctx, p, 오류 } = await 새쪽(1280, 900, { 때: '2026-11-21T09:00:00+09:00', 폰: false, 소장님: 'op' })
  await 들어감(p)
  let s = await 상태(p)
  ok('kcm_op 기기(소장님 노트북) — 안 덮음 · «점검 중» 한 줄 · 제휴 창은 그대로', !s.막음 && s.띠 && s.창 === '공지' && s.inert === false, s)
  const 띠글 = await p.evaluate(() => document.querySelector('.checkband').innerText)
  ok('한 줄 — «점검 중(11. 21. ~ 22.)» · 이용자에겐 점검 화면 · 소장님 기기', /점검 중\(11\. 21\. ~ 22\.\)/.test(띠글) && /이용자에게는 «점검 중» 화면만/.test(띠글) && /소장님 기기/.test(띠글), 띠글)
  if (OUT) { await 다닫기(p); await p.screenshot({ path: `${OUT}/G793_토_소장님기기_PC.png` }) }
  await 다닫기(p)
  await p.click('.checkband-go'); await p.waitForLoadState('domcontentloaded'); await p.waitForTimeout(2300)
  s = await 상태(p)
  const 끄기 = await p.$('.checkblock .checkband-go')
  ok('«👀 이용자 화면 보기» — 덮인 화면 그대로 + 끄는 단추(이 탭만)', s.막음 && !!끄기, s)
  await 끄기.click(); await p.waitForLoadState('domcontentloaded'); await p.waitForTimeout(2300)
  s = await 상태(p)
  ok('끄기 — 다시 소장님 기기(안 덮음 · 한 줄) · 오류 0', !s.막음 && s.띠 && !오류.length, { s, 오류 })
  await ctx.close()
}
{
  const { ctx, p } = await 새쪽(390, 844, { 때: '2026-11-22T20:00:00+09:00', 소장님: '열쇠말' })
  await 들어감(p, '/qna')
  const s = await 상태(p)
  ok('열쇠말 기기(소장님 폰) — 일요일 맵톡도 안 덮음 · 한 줄', !s.막음 && s.띠, s)
  await ctx.close()
}

console.log('④ 안 덮는 곳 — 로봇 · 자동 브라우저')
{
  const { ctx, p } = await 새쪽(390, 844, { 때: '2026-11-21T09:00:00+09:00', ua: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' })
  await 들어감(p)
  ok('검색 로봇 — 안 덮음(검색 순위 그대로)', !(await 상태(p)).막음)
  await ctx.close()
}
{
  const { ctx, p } = await 새쪽(390, 844, { 때: '2026-11-21T09:00:00+09:00', 자동끔: false })
  await 들어감(p)
  ok('자동 브라우저(webdriver — 아침 점검 · 시험) — 안 덮음', !(await 상태(p)).막음)
  await ctx.close()
}

console.log('⑤ 날이 바뀌면 저절로(1분마다 봄 · 61초 기다림 둘)')
{
  const { ctx, p, 오류 } = await 새쪽(390, 844, { 때: '2026-11-20T23:59:30+09:00' })
  await 들어감(p)
  ok('금 23:59 — 점검창(안 덮음)', (await 상태(p)).창 === '점검' && !(await 상태(p)).막음, await 상태(p))
  await p.evaluate(() => { window.__더 = (window.__더 || 0) + 60000 })
  await p.waitForTimeout(61500)
  const s = await 상태(p)
  ok('토 0시 넘음 — 열어 둔 화면도 저절로 덮음 · 점검창은 사라짐', s.막음 && !s.창 && s.inert === true, s)
  ok('오류 0', !오류.length, 오류)
  await ctx.close()
}
{
  const { ctx, p } = await 새쪽(390, 844, { 때: '2026-11-22T23:59:30+09:00' })
  await 들어감(p)
  ok('일 23:59 — 덮음', (await 상태(p)).막음)
  await p.evaluate(() => { window.__더 = (window.__더 || 0) + 60000 })
  await p.waitForTimeout(61500)
  const s = await 상태(p)
  ok('월 0시 넘음 — 저절로 풀림(뒤 inert 풀림 · 제휴 창이 뜨면 그 창만 잠금)', !s.막음 && s.inert === false && (s.창 === '공지' ? s.html === 'hidden' : s.html !== 'hidden'), s)
  await ctx.close()
}
await b.close()
console.log(`\n${bad ? '✗' : '✓'} 시험_점검창 ${n - bad}/${n}`)
process.exit(bad ? 1 : 0)
