/**
 * 🧪 G792 점검창 시험(감사공지.jsx «점검창») — 소장님 11-20 「토요일 일요일 시스템 점검으로 이용을 할 수 없다는 공지를 띄워줘. 공지창을 따로 만들어서 띄워줘」
 *   → 고르심 «K-건설맵 사이트 점검» · «토요일 0시부터 일요일 밤까지만»(제휴 모집 창은 그대로)
 *   가짜 파이어베이스로 구운 판(굽기.sh)을 띄운 뒤:  LANG=C.UTF-8 node tools/시험_점검창.mjs [주소=http://127.0.0.1:5805] · OUT=폴더 면 화면 사진
 *   ① 날 — 11-20 23:59 안 뜸 · 11-21 00:00 뜸 · 11-22 23:59 뜸 · 11-23 00:00 안 뜸(한국 시각)
 *   ② 글 — «11월 21일(토) 0시부터 11월 22일(일) 24시까지 · 이용하실 수 없습니다» · 맵톡 예의 줄(굵게) · — K-건설맵 · «무료 · 클로드» 없음 · 닫기 단추
 *   ③ 차례 — 점검창이 먼저 · 공지창(제휴 모집)은 같이 안 뜸 → 점검창을 닫으면 공지창이 그대로 뜸 → 닫으면 둘 다 없음 · html 잠금 풀림
 *   ④ 닫기 길 — ✕ · 닫기 · Esc · 바깥 누르기 ⑤ 나갔다 40초 뒤 돌아옴 → 점검창 다시 · 10초는 안 뜸
 *   ⑥ 안 뜨는 곳 — 자동 브라우저(webdriver) · 관리자 화면(/admin) · 다른 건설맵 탭을 쓰는 중
 *   ⑦ 폭 320 · 390 · 1280 · 어두운 화면 — 창이 화면 안 · 넘침 0 · 오류 0 · 맵톡(/qna)에서도 뜸
 * 가상 자료만 씀 · 인터넷 안 부름.
 */
import { createRequire } from 'node:module'
const require = createRequire(process.env.PW || '/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const BASE = process.argv[2] || 'http://127.0.0.1:5805'
const OUT = process.env.OUT || ''
let bad = 0, n = 0
const ok = (이름, c, got) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (c || got === undefined ? '' : ' = ' + JSON.stringify(got).slice(0, 400))) }
const b = await chromium.launch()
async function 새쪽(w, h, { 때 = '2026-11-21T09:00:00+09:00', 자동끔 = true, 폰 = true, 어둠 = false, 더 = null } = {}) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', isMobile: 폰, hasTouch: 폰, deviceScaleFactor: OUT ? 2 : 1, colorScheme: 어둠 ? 'dark' : 'light',
    userAgent: 폰 ? 'Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36' : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36' })
  await ctx.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|googlesyndication|geojs|daumcdn|kakao|coupang/, (r) => r.fulfill({ status: 200, body: '' }))
  await ctx.route(/firebaseio\.com|firebasedatabase\.app/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  const t = Date.parse(때)
  await ctx.addInitScript(([t, 자동끔, 더]) => {
    const 원 = Date; const 차 = t - 원.now()
    const D = function (...a) { return a.length ? new 원(...a) : new 원(원.now() + 차 + (window.__더 || 0)) }
    D.now = () => 원.now() + 차 + (window.__더 || 0); D.UTC = 원.UTC; D.parse = 원.parse; D.prototype = 원.prototype
    window.Date = D
    try { Object.defineProperty(document, 'hidden', { configurable: true, get: () => window.__숨김 === true }); Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (window.__숨김 === true ? 'hidden' : 'visible') }) } catch (e) { /* 없음 */ }
    if (자동끔) { try { Object.defineProperty(navigator, 'webdriver', { get: () => false }) } catch (e) { /* 없음 */ } }
    if (더 === '다른탭') { try { localStorage.setItem('kcm_notice_alive', String(원.now() + 차 - 3000)) } catch (e) { /* */ } }
  }, [t, 자동끔, 더])
  const p = await ctx.newPage()
  const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
  p.on('dialog', (d) => d.dismiss())
  return { ctx, p, 오류 }
}
const 넘침 = (p) => p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
const 창들 = (p) => p.evaluate(() => [...document.querySelectorAll('.noticepop')].map((e) => (e.classList.contains('checkpop') ? '점검' : '공지')).join(','))
const 들어감 = async (p, 길 = '/') => { await p.goto(BASE + 길, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2300) }

console.log('① 날(한국 시각)')
for (const [때, 있어야] of [['2026-11-20T23:59:00+09:00', false], ['2026-11-21T00:00:30+09:00', true], ['2026-11-22T23:59:00+09:00', true], ['2026-11-23T00:00:30+09:00', false]]) {
  const { ctx, p } = await 새쪽(390, 844, { 때 })
  await 들어감(p)
  const 있음 = !!(await p.$('.noticepop.checkpop'))
  ok(`${때.slice(0, 16)} — 점검창 ${있어야 ? '뜸' : '안 뜸'}`, 있음 === 있어야, await 창들(p))
  await ctx.close()
}

console.log('② 글 · ③ 차례 · ⑦ 폭')
for (const [이름, w, h, 폰, 어둠] of [['폰 390', 390, 844, true, false], ['좁은 폰 320', 320, 640, true, false], ['PC 1280', 1280, 900, false, false], ['폰 390 어두운', 390, 844, true, true]]) {
  const { ctx, p, 오류 } = await 새쪽(w, h, { 폰, 어둠 })
  await 들어감(p)
  const 처음 = await 창들(p)
  ok(`${이름} 들어오면 점검창만(공지창은 아직 안 뜸)`, 처음 === '점검', 처음)
  const 글 = await p.evaluate(() => { const e = document.querySelector('.checkpop .noticepop-c'); return e ? e.innerText : '' })
  ok(`${이름} 글 — 날짜 · «이용하실 수 없습니다» · 사과 · 서명`, /11월 21일\(토\) 0시부터 11월 22일\(일\) 24시까지/.test(글) && /시스템 점검으로 이용하실 수 없습니다/.test(글) && /불편을 드려 죄송합니다/.test(글) && /— K-건설맵/.test(글), 글.slice(0, 200))
  const 예의 = await p.evaluate(() => { const e = document.querySelector('.checkpop .noticepop-strong b'); return e ? [e.textContent, getComputedStyle(e).fontWeight] : null })
  ok(`${이름} 맵톡 예의 줄(굵게 · G345 늘 넣음)`, !!예의 && /예의를 갖추고 이용해 주세요/.test(예의[0]) && Number(예의[1]) >= 700, 예의)
  ok(`${이름} «무료 · 클로드 · Claude» 없음`, !/무료|클로드|Claude/.test(글))
  const 자리 = await p.evaluate(() => { const r = document.querySelector('.checkpop .noticepop-c').getBoundingClientRect(); const f = document.querySelector('.checkpop .noticepop-f button').getBoundingClientRect(); return { t: r.top, b: r.bottom, l: r.left, r: r.right, fb: f.bottom, w: innerWidth, h: innerHeight } })
  ok(`${이름} 창이 화면 안 · 닫기 단추가 굴리지 않고 보임`, 자리.t >= 0 && 자리.b <= 자리.h + 1 && 자리.l >= 0 && 자리.r <= 자리.w + 1 && 자리.fb <= 자리.h, 자리)
  ok(`${이름} html 잠김(G791) · body 그대로`, (await p.evaluate(() => document.documentElement.style.overflow + '|' + document.body.style.overflow)) === 'hidden|')
  if (어둠) {
    const 색 = await p.evaluate(() => { const e = document.querySelector('.checkpop .noticepop-c'); const s = getComputedStyle(e), t = getComputedStyle(e.querySelector('p')); return [s.backgroundColor, t.color] })
    ok(`${이름} 글자 ≠ 바탕`, 색[0] !== 색[1], 색)
  }
  if (OUT) await p.screenshot({ path: `${OUT}/G792_점검창_${이름.replace(/\s+/g, '')}.png` })
  await p.click('.checkpop .noticepop-f button'); await p.waitForTimeout(500)
  const 다음 = await 창들(p)
  ok(`${이름} 점검창을 닫으면 공지창(제휴 모집)이 그대로 뜸`, 다음 === '공지' && /제휴업체 모집/.test(await p.evaluate(() => document.querySelector('.noticepop-c').innerText)), 다음)
  await p.click('.noticepop-f .btn.line'); await p.waitForTimeout(400)
  ok(`${이름} 둘 다 닫음 — 창 없음 · html 풀림 · 넘침 0 · 오류 0`, !(await 창들(p)) && (await p.evaluate(() => document.documentElement.style.overflow)) === '' && (await 넘침(p)) <= 0 && !오류.length, 오류)
  await ctx.close()
}

console.log('④ 닫기 길')
for (const [길, 함] of [['✕', (p) => p.click('.checkpop .noticepop-x')], ['Esc', (p) => p.keyboard.press('Escape')], ['바깥 누르기', (p) => p.mouse.click(5, 5)]]) {
  const { ctx, p } = await 새쪽(1280, 900, { 폰: false })
  await 들어감(p)
  const 있었음 = !!(await p.$('.checkpop'))
  await 함(p); await p.waitForTimeout(400)
  ok(`${길} 로 점검창 닫힘`, 있었음 && !(await p.$('.checkpop')))
  await ctx.close()
}

console.log('⑤ 나갔다가 돌아옴(G786b 와 같은 길)')
{
  const 떠났다옴 = async (p, ms) => {
    await p.evaluate(() => { window.__숨김 = true; document.dispatchEvent(new Event('visibilitychange')) })
    await p.evaluate((ms) => { window.__더 = (window.__더 || 0) + ms }, ms)
    await p.evaluate(() => { window.__숨김 = false; document.dispatchEvent(new Event('visibilitychange')) })
    await p.waitForTimeout(500)
  }
  const 다닫기 = async (p) => { for (let i = 0; i < 4; i++) { const e = await p.$('.noticepop-f button'); if (!e) break; await e.click(); await p.waitForTimeout(350) } }
  const { ctx, p, 오류 } = await 새쪽(390, 844)
  await 들어감(p)
  await 다닫기(p)
  ok('처음 두 창 닫음 — 창 없음', !(await 창들(p)))
  await 떠났다옴(p, 40000)
  ok('40초 떠났다 옴 — 점검창이 먼저 다시 뜸', (await 창들(p)) === '점검', await 창들(p))
  await 다닫기(p)
  await 떠났다옴(p, 10000)
  ok('10초만 떠났다 옴 — 안 뜸', !(await 창들(p)), await 창들(p))
  ok('오류 0', !오류.length, 오류)
  await ctx.close()
}

console.log('⑥ 안 뜨는 곳')
{
  const { ctx, p } = await 새쪽(390, 844, { 자동끔: false })
  await 들어감(p)
  ok('자동 브라우저(webdriver) — 점검창 저절로 안 뜸', !(await p.$('.checkpop')))
  await ctx.close()
}
{
  const { ctx, p } = await 새쪽(390, 844)
  await 들어감(p, '/admin')
  ok('관리자 화면(/admin) — 점검창 안 뜸', !(await p.$('.checkpop')))
  await ctx.close()
}
{
  const { ctx, p } = await 새쪽(390, 844, { 더: '다른탭' })
  await 들어감(p, '/tools')
  ok('다른 건설맵 탭을 쓰는 중 — 새 탭엔 안 뜸', !(await p.$('.checkpop')))
  await ctx.close()
}
{
  const { ctx, p, 오류 } = await 새쪽(390, 844)
  await 들어감(p, '/qna')
  ok('맵톡(/qna)에서도 점검창 · 오류 0', !!(await p.$('.checkpop')) && !오류.length, 오류)
  await ctx.close()
}
await b.close()
console.log(`\n${bad ? '✗' : '✓'} 시험_점검창 ${n - bad}/${n}`)
process.exit(bad ? 1 : 0)
