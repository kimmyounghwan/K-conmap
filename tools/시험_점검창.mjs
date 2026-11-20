/**
 * 🧪 G792 · G793 · G794 점검 시험(감사공지.jsx — 점검창 · 점검둘러보기 · 점검띠)
 *   소장님 11-20 「토요일 일요일 시스템 점검으로 이용을 할 수 없다는 공지를 띄워줘. 공지창을 따로 만들어서 띄워줘」 → 「토일 사이트 사용 못하게 막고」
 *   「이용자만 사이트 사용 못하는 거고, 공고 및 다른 건 자동으로 돌아가야 해」 「내 노트북은 사용가능하게 하고」 → 「화면에 공지 띄워야지 그래야 알지」 →
 *   「점검때는 둘러볼 수 있지만 이용만 안되게 해줘」(고르심 «보기 · 읽기까지») · ⭐ 「항상 공지는 사이트 나갔다 들어오면 다시 뜨게 해줘」
 *   가짜 파이어베이스로 구운 판(굽기.sh)을 띄운 뒤:  LANG=C.UTF-8 node tools/시험_점검창.mjs [주소=http://127.0.0.1:5808] · OUT=폴더 면 화면 사진
 *   ① 점검 앞날(11-20) — 닫을 수 있는 점검창(«둘러보기는 되지만 … 이용은 하실 수 없습니다») → 닫으면 제휴 모집 창 · 폭 · 어두운 화면 · 닫기 길 · 40초 다시 · 10초 안 뜸
 *   ② 점검 날(토 · 일) 이용자 — 맨 위 띠(닫기 없음) · 화면 옮기기 · 맵톡 글 열어 읽기 · 예시 보기 · 빠른 찾기는 됨 /
 *      칸 입력 · 체크 · 받기(a[download]) · 인쇄 · PDF · 공감 · 답글 칸 · 글쓰기 칸 · 보내기(form)는 막힘 + 알림 한 줄(화면 안) · 날 경계 넷
 *   ③ 소장님 기기(kcm_op · 열쇠말) — 띠 대신 한 줄 · 입력 그대로 · «👀 이용자 화면 보기» → 막힘 + 끄기 단추
 *   ④ 로봇 · 자동 브라우저 — 안 막음 ⑤ 날이 바뀌면 저절로 — 금 23:59 → 토 0시 막음 · 일 23:59 → 월 0시 풂(1분마다 봄)
 * 가상 자료만 씀 · 인터넷 안 부름.
 */
import { createRequire } from 'node:module'
const require = createRequire(process.env.PW || '/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const BASE = process.argv[2] || 'http://127.0.0.1:5808'
const OUT = process.env.OUT || ''
let bad = 0, n = 0
const ok = (이름, c, got) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (c || got === undefined ? '' : ' = ' + JSON.stringify(got).slice(0, 400))) }
const b = await chromium.launch()
const 열쇠말값 = '198d0951f2337d02ab42668d11ae45be65998e0f0684bc18d070c302e40751ab'   /* lib/gate.js HASH(공개 저장소에 있는 값) */
const UA폰 = 'Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'
const UAPC = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
const H = 3600e3
const 키 = (k) => '-P9zz' + String(k).padStart(15, '0')
async function 새쪽(w, h, { 때 = '2026-11-21T09:00:00+09:00', 자동끔 = true, 폰 = true, 어둠 = false, 소장님 = '', ua = '' } = {}) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', isMobile: 폰, hasTouch: 폰, deviceScaleFactor: OUT ? 2 : 1, colorScheme: 어둠 ? 'dark' : 'light', userAgent: ua || (폰 ? UA폰 : UAPC), acceptDownloads: true })
  await ctx.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|googlesyndication|geojs|daumcdn|kakao|coupang/, (r) => r.fulfill({ status: 200, body: '' }))
  const t = Date.parse(때)
  const 씨앗 = { qna: {}, qna_a: {}, qna_del: {}, qna_top: {}, qna_like: {}, qna_view: {} }
  for (let k = 1; k <= 6; k++) 씨앗.qna[키(k)] = { t: `[후기·건의] 가상 글 ${k}번 — 현장 이야기`, b: '가상 내용입니다', nick: `가상 별명${k}`, uid: 'u' + k, at: t - k * H }
  await ctx.addInitScript(([t, 자동끔, 소장님, 열쇠말값, 씨앗]) => {
    const 원 = Date; const 차 = t - 원.now()
    const D = function (...a) { return a.length ? new 원(...a) : new 원(원.now() + 차 + (window.__더 || 0)) }
    D.now = () => 원.now() + 차 + (window.__더 || 0); D.UTC = 원.UTC; D.parse = 원.parse; D.prototype = 원.prototype
    window.Date = D
    try { Object.defineProperty(document, 'hidden', { configurable: true, get: () => window.__숨김 === true }); Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (window.__숨김 === true ? 'hidden' : 'visible') }) } catch (e) { /* 없음 */ }
    if (자동끔) { try { Object.defineProperty(navigator, 'webdriver', { get: () => false }) } catch (e) { /* 없음 */ } }
    try { if (소장님 === 'op') localStorage.setItem('kcm_op', '1'); if (소장님 === '열쇠말') localStorage.setItem('kcm_lab_ok', 열쇠말값) } catch (e) { /* */ }
    if (!sessionStorage.getItem('씨앗됨')) { localStorage.setItem('mockdb', JSON.stringify(씨앗)); localStorage.setItem('mockuid', 'mockme'); sessionStorage.setItem('씨앗됨', '1') }
    window.__인쇄 = 0; const 옛 = window.print; window.print = function () { window.__인쇄++; }   /* 진짜 인쇄 창은 안 띄움 — 사이트가 덮어쓰면(점검) 이 셈이 안 오름 */
  }, [t, 자동끔, 소장님, 열쇠말값, 씨앗])
  const p = await ctx.newPage()
  const 오류 = [], 받음 = []
  p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
  p.on('dialog', (d) => d.dismiss())
  p.on('download', (d) => 받음.push(d.suggestedFilename()))
  return { ctx, p, 오류, 받음 }
}
const 넘침 = (p) => p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
const 상태 = (p) => p.evaluate(() => ({
  창: [...document.querySelectorAll('.noticepop')].map((e) => (e.classList.contains('checkpop') ? '점검' : '공지')).join(','),
  띠: !!document.querySelector('.checkbar'), 한줄: !!document.querySelector('.checkband'), 알림: !!document.querySelector('.checktoast'),
  html: document.documentElement.style.overflow, 길: location.pathname,
}))
const 들어감 = async (p, 길 = '/') => { await p.goto(BASE + 길, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2300) }
const 떠났다옴 = async (p, ms) => {
  await p.evaluate(() => { window.__숨김 = true; document.dispatchEvent(new Event('visibilitychange')) })
  await p.evaluate((ms) => { window.__더 = (window.__더 || 0) + ms }, ms)
  await p.evaluate(() => { window.__숨김 = false; document.dispatchEvent(new Event('visibilitychange')) })
  await p.waitForTimeout(500)
}
const 다닫기 = async (p) => { for (let i = 0; i < 4; i++) { const e = await p.$('.noticepop-f button'); if (!e) break; await e.click(); await p.waitForTimeout(350) } }
/* 시험용 칸 · 단추를 쪽 안(main)에 넣음 — 어느 화면이든 같은 막기가 걸리는지(가상 · 사이트 글 아님) */
const 시험칸 = (p) => p.evaluate(() => {
  const m = document.querySelector('main.shell') || document.body
  const d = document.createElement('div'); d.id = '시험칸'; d.style.cssText = 'padding:8px;margin:8px 0;border:1px dashed #999'
  d.innerHTML = '<input id="t글" type="text" style="width:140px;font-size:16px"> <input id="t수" type="number" style="width:80px;font-size:16px"> <select id="t고름"><option>가</option><option>나</option></select> <input id="t체크" type="checkbox"> '
    + '<a id="t받기" download="가상.txt" href="data:text/plain,가상">가상 받기</a> <button id="t인쇄" type="button" onclick="window.print()">🖨 인쇄</button> <button id="t펼침" type="button" aria-expanded="false" onclick="this.setAttribute(\'aria-expanded\',\'true\')">▾ 펼치기</button> '
    + '<form id="t폼" onsubmit="window.__보냄=1;return false"><button id="t보냄" type="submit">보내기</button></form>'
  m.insertBefore(d, m.firstChild.nextSibling)
  window.__보냄 = 0
})

console.log('① 점검 앞날(11-20) — 닫을 수 있는 점검창이 먼저')
for (const [이름, w, h, 폰, 어둠] of [['폰 390', 390, 844, true, false], ['좁은 폰 320', 320, 640, true, false], ['PC 1280', 1280, 900, false, false], ['폰 390 어두운', 390, 844, true, true]]) {
  const { ctx, p, 오류 } = await 새쪽(w, h, { 때: '2026-11-20T10:00:00+09:00', 폰, 어둠 })
  await 들어감(p)
  let s = await 상태(p)
  ok(`${이름} 들어오면 점검창만(띠 · 막기 없음)`, s.창 === '점검' && !s.띠, s)
  const 글 = await p.evaluate(() => { const e = document.querySelector('.checkpop .noticepop-c'); return e ? e.innerText : '' })
  ok(`${이름} 글 — 날짜 · «둘러보기는 되지만 … 이용은 하실 수 없습니다» · 사과 · 예의 줄 · 서명 · 금지 말 없음`, /11월 21일\(토\) 0시부터 11월 22일\(일\) 24시까지/.test(글) && /둘러보기는 되지만/.test(글) && /이용은 하실 수 없습니다/.test(글) && /불편을 드려 죄송합니다/.test(글) && /예의를 갖추고 이용해 주세요/.test(글) && /— K-건설맵/.test(글) && !/무료|클로드|Claude/.test(글), 글.slice(0, 200))
  const 자리 = await p.evaluate(() => { const r = document.querySelector('.checkpop .noticepop-c').getBoundingClientRect(); const f = document.querySelector('.checkpop .noticepop-f button').getBoundingClientRect(); return { t: r.top, b: r.bottom, l: r.left, r: r.right, fb: f.bottom, w: innerWidth, h: innerHeight } })
  ok(`${이름} 창이 화면 안 · 닫기 단추가 굴리지 않고 보임 · html 잠김`, 자리.t >= 0 && 자리.b <= 자리.h + 1 && 자리.l >= 0 && 자리.r <= 자리.w + 1 && 자리.fb <= 자리.h && s.html === 'hidden', { 자리, html: s.html })
  if (어둠) { const 색 = await p.evaluate(() => { const e = document.querySelector('.checkpop .noticepop-c'); return [getComputedStyle(e).backgroundColor, getComputedStyle(e.querySelector('p')).color] }); ok(`${이름} 글자 ≠ 바탕`, 색[0] !== 색[1], 색) }
  if (OUT) await p.screenshot({ path: `${OUT}/G794_금_점검창_${이름.replace(/\s+/g, '')}.png` })
  await p.click('.checkpop .noticepop-f button'); await p.waitForTimeout(500)
  s = await 상태(p)
  ok(`${이름} 점검창을 닫으면 제휴 모집 창이 그대로`, s.창 === '공지', s)
  await 다닫기(p)
  s = await 상태(p)
  ok(`${이름} 둘 다 닫음 — 창 없음 · html 풀림 · 넘침 0 · 오류 0`, !s.창 && s.html === '' && (await 넘침(p)) <= 0 && !오류.length, { s, 오류 })
  await ctx.close()
}
for (const [길, 함] of [['✕', (p) => p.click('.checkpop .noticepop-x')], ['Esc', (p) => p.keyboard.press('Escape')], ['바깥 누르기', (p) => p.mouse.click(5, 5)]]) {
  const { ctx, p } = await 새쪽(1280, 900, { 때: '2026-11-20T10:00:00+09:00', 폰: false })
  await 들어감(p)
  const 있었음 = !!(await p.$('.checkpop'))
  await 함(p); await p.waitForTimeout(400)
  ok(`금 — ${길} 로 점검창 닫힘`, 있었음 && !(await p.$('.checkpop')))
  await ctx.close()
}
{
  const { ctx, p, 오류 } = await 새쪽(390, 844, { 때: '2026-11-20T10:00:00+09:00' })
  await 들어감(p); await 다닫기(p)
  await 떠났다옴(p, 40000)
  ok('금 — 닫은 뒤 40초 떠났다 옴 → 점검창이 먼저 다시(⭐ 항상 다시 뜸)', (await 상태(p)).창 === '점검', await 상태(p))
  await 다닫기(p)
  await 떠났다옴(p, 10000)
  ok('금 — 10초만 떠났다 옴 → 안 뜸 · 오류 0', !(await 상태(p)).창 && !오류.length, { s: await 상태(p), 오류 })
  await ctx.close()
}

console.log('② 점검 날(토 · 일) 이용자 — 둘러보기만')
for (const [때, 띠있어야, 창] of [['2026-11-20T23:59:00+09:00', false, '점검'], ['2026-11-21T00:00:30+09:00', true, '공지'], ['2026-11-22T23:59:00+09:00', true, '공지'], ['2026-11-23T00:00:30+09:00', false, '공지']]) {
  const { ctx, p } = await 새쪽(390, 844, { 때 })
  await 들어감(p)
  const s = await 상태(p)
  ok(`${때.slice(0, 16)} — 띠 ${띠있어야 ? '있음' : '없음'} · 첫 창 «${창}»(제휴 창은 그대로)`, s.띠 === 띠있어야 && s.창.split(',')[0] === 창, s)
  await ctx.close()
}
for (const [이름, w, h, 폰, 어둠] of [['폰 390', 390, 844, true, false], ['PC 1280', 1280, 900, false, false], ['폰 390 어두운', 390, 844, true, true], ['좁은 폰 320', 320, 640, true, false]]) {
  const { ctx, p, 오류, 받음 } = await 새쪽(w, h, { 폰, 어둠 })
  await 들어감(p)
  await 다닫기(p)
  let s = await 상태(p)
  const 띠 = await p.evaluate(() => { const e = document.querySelector('.checkbar'); const r = e.getBoundingClientRect(); return { 글: e.innerText, 단추: e.querySelectorAll('button').length, 안: r.left >= 0 && r.right <= innerWidth + 1, 위: Math.round(r.top + scrollY) } })
  ok(`${이름} 맨 위 띠 — «둘러보기만» · 월요일부터 · 닫기 없음 · 화면 안`, s.띠 && /시스템 점검 중\(11\. 21\. ~ 22\.\)/.test(띠.글) && /둘러보기만/.test(띠.글) && /11월 23일\(월\)/.test(띠.글) && 띠.단추 === 0 && 띠.안 && 띠.위 < 400 && !/무료|클로드|Claude/.test(띠.글), 띠)
  await 시험칸(p)
  /* 칸 입력 */
  const 칸 = p.locator('#t글'); await 칸.click({ force: true }).catch(() => {}); await p.keyboard.type('가상입력', { delay: 5 }); await p.waitForTimeout(300)
  const 칸값 = await p.evaluate(() => [document.getElementById('t글').value, document.activeElement && document.activeElement.id])
  s = await 상태(p)
  ok(`${이름} 글칸 — 커서가 안 들어가고 글자도 안 써짐 · 알림 한 줄`, 칸값[0] === '' && 칸값[1] !== 't글' && s.알림, { 칸값, 알림: s.알림 })
  if (OUT && !어둠) await p.screenshot({ path: `${OUT}/G794_토_막힘알림_${이름.replace(/\s+/g, '')}.png` })
  const 알자리 = await p.evaluate(() => { const r = document.querySelector('.checktoast').getBoundingClientRect(); return { t: r.top, b: r.bottom, l: r.left, r: r.right, w: innerWidth, h: innerHeight } })
  ok(`${이름} 알림이 화면 안`, 알자리.t >= 0 && 알자리.b <= 알자리.h && 알자리.l >= 0 && 알자리.r <= 알자리.w + 1, 알자리)
  if (어둠) { const 색 = await p.evaluate(() => { const e = document.querySelector('.checkbar'); const t = document.querySelector('.checktoast'); return [getComputedStyle(e).backgroundColor, getComputedStyle(e).color, getComputedStyle(t).backgroundColor, getComputedStyle(t).color] }); ok(`${이름} 띠 · 알림 글자 ≠ 바탕`, 색[0] !== 색[1] && 색[2] !== 색[3], 색) }
  await p.click('#t수', { force: true }).catch(() => {}); await p.keyboard.type('123'); await p.click('#t체크', { force: true }).catch(() => {}); await p.waitForTimeout(200)
  const 값들 = await p.evaluate(() => [document.getElementById('t수').value, document.getElementById('t체크').checked])
  ok(`${이름} 숫자칸 · 체크 — 막힘`, 값들[0] === '' && 값들[1] === false, 값들)
  await p.click('#t받기', { force: true }).catch(() => {}); await p.click('#t인쇄', { force: true }).catch(() => {}); await p.click('#t보냄', { force: true }).catch(() => {}); await p.waitForTimeout(700)
  const 결과 = await p.evaluate(() => [window.__인쇄, window.__보냄])
  ok(`${이름} 받기(a[download]) · 인쇄 · 보내기(form) — 막힘`, 받음.length === 0 && 결과[0] === 0 && 결과[1] === 0, { 받음, 결과 })
  await p.click('#t펼침', { force: true }); await p.waitForTimeout(150)
  ok(`${이름} «펼치기» 같은 보기 단추 — 됨`, (await p.getAttribute('#t펼침', 'aria-expanded')) === 'true')
  /* 화면 옮기기 — 고리 */
  await p.evaluate(() => { const a = document.createElement('a'); a.id = 't고리'; a.href = '/tools'; a.textContent = '가상 도구 고리'; document.getElementById('시험칸').appendChild(a) })
  await p.click('#t고리', { force: true }); await p.waitForTimeout(1500)
  s = await 상태(p)
  ok(`${이름} 고리로 화면 옮기기 — 됨(/tools) · 띠 그대로`, s.길 === '/tools' && s.띠, s)
  ok(`${이름} 넘침 0 · 오류 0`, (await 넘침(p)) <= 0 && !오류.length, 오류)
  await ctx.close()
}
console.log('② 화면마다 — 읽기 · 예시 · 빠른 찾기는 됨 · 공감 · 답글 · 글쓰기 · PDF 는 막힘')
{
  const { ctx, p, 오류 } = await 새쪽(390, 844)
  await 들어감(p, '/qna'); await 다닫기(p)
  await p.waitForSelector('article.mt-card .mt-open', { timeout: 15000 })
  await p.locator('article.mt-card .mt-open').first().scrollIntoViewIfNeeded()
  await p.locator('article.mt-card .mt-open').first().tap()
  await p.waitForTimeout(1000)
  ok('맵톡 — 카드를 누르면 글이 열림(읽기)', !!(await p.$('.mt-sheet')))
  const 하트앞 = await p.evaluate(() => (document.querySelector('.mt-sheet .qna-like') || {}).textContent || '')
  const 하트 = await p.$('.mt-sheet .qna-like'); if (하트) { await 하트.tap(); await p.waitForTimeout(500) }
  const 하트뒤 = await p.evaluate(() => (document.querySelector('.mt-sheet .qna-like') || {}).textContent || '')
  ok('맵톡 — 공감 막힘(수 그대로) · 알림', !!하트 && 하트앞 === 하트뒤 && (await 상태(p)).알림, [하트앞, 하트뒤])
  const 답칸 = await p.$('.mt-sheet textarea')
  if (답칸) { await 답칸.tap().catch(() => {}); await p.keyboard.type('가상 답글'); await p.waitForTimeout(300) }
  ok('맵톡 — 답글 칸 막힘(글자 안 써짐)', !!답칸 && (await p.evaluate(() => (document.querySelector('.mt-sheet textarea') || {}).value || '')) === '')
  await p.tap('.mt-sheet .mt-x'); await p.waitForTimeout(500)
  ok('맵톡 — 글 창 닫기(✕) 됨', !(await p.$('.mt-sheet')))
  await p.evaluate(() => document.getElementById('mt-title').scrollIntoView({ block: 'center' }))
  await p.tap('#mt-title').catch(() => {}); await p.keyboard.type('가상 제목'); await p.waitForTimeout(300)
  ok('맵톡 — 글쓰기 칸 막힘', (await p.evaluate(() => document.getElementById('mt-title').value)) === '')
  await p.tap('.qsbtn'); await p.waitForTimeout(600)
  await p.fill('.qs-in', '특고'); await p.waitForTimeout(500)
  ok('빠른 찾기 — 됨(어디 있는지 찾기)', (await p.evaluate(() => (document.querySelector('.qs-in') || {}).value)) === '특고')
  await p.keyboard.press('Escape'); await p.waitForTimeout(300)
  ok('맵톡 · 빠른 찾기 오류 0', !오류.length, 오류)
  await ctx.close()
}
{
  const { ctx, p, 오류, 받음 } = await 새쪽(1280, 900, { 폰: false })
  await 들어감(p, '/tools/teukgo-boheom'); await 다닫기(p)
  await p.waitForSelector('h1.tl-h1', { timeout: 15000 })
  const 예시 = p.locator('details.iy-exd > summary').first()
  let 예시됨 = false
  if (await 예시.count()) {
    await 예시.click(); await p.waitForTimeout(300)
    const 첫 = p.locator('details.iy-exd button').first()
    if (await 첫.count()) { await 첫.click(); await p.waitForTimeout(600); 예시됨 = /원/.test(await p.evaluate(() => (document.querySelector('.sl-res') || {}).textContent || '')) }
  }
  ok('특고 계산기 — 예시 보기는 됨(결과가 보임)', 예시됨)
  const 칸 = await p.$('main input[type="number"], main input[inputmode="numeric"], main input[type="text"]')
  if (칸) { await 칸.click({ force: true }).catch(() => {}); await p.keyboard.type('9'); await p.waitForTimeout(200) }
  ok('특고 계산기 — 칸 입력은 막힘', !!칸 && !(await p.evaluate((e) => String(e.value).includes('9') && document.activeElement === e, 칸)))
  const pdf = p.locator('main button', { hasText: /PDF|인쇄/ }).first()
  if (await pdf.count()) { await pdf.click({ force: true }); await p.waitForTimeout(1500) }
  ok('특고 계산기 — PDF · 인쇄 막힘(받음 0 · 인쇄 0) · 오류 0', (await pdf.count()) > 0 && 받음.length === 0 && (await p.evaluate(() => window.__인쇄)) === 0 && !오류.length, { 받음, 오류 })
  await ctx.close()
}

console.log('③ 소장님 기기 — 안 막음 · 한 줄')
{
  const { ctx, p, 오류 } = await 새쪽(1280, 900, { 폰: false, 소장님: 'op' })
  await 들어감(p); await 다닫기(p)
  let s = await 상태(p)
  ok('kcm_op 기기(소장님 노트북) — 띠 대신 한 줄', !s.띠 && s.한줄, s)
  const 줄글 = await p.evaluate(() => document.querySelector('.checkband').innerText)
  ok('한 줄 — «이용자는 둘러보기만» · 소장님 기기', /이용자는 둘러보기만 됩니다/.test(줄글) && /소장님 기기/.test(줄글), 줄글)
  await 시험칸(p)
  await p.click('#t글'); await p.keyboard.type('가상'); await p.waitForTimeout(200)
  ok('소장님 기기 — 칸 입력 그대로 됨', (await p.evaluate(() => document.getElementById('t글').value)) === '가상')
  if (OUT) await p.screenshot({ path: `${OUT}/G794_토_소장님기기_PC.png` })
  await p.click('.checkband-go'); await p.waitForLoadState('domcontentloaded'); await p.waitForTimeout(2300); await 다닫기(p)
  s = await 상태(p)
  const 끄기 = await p.$('.checkbar .checkband-go')
  ok('«👀 이용자 화면 보기» — 띠 + 막힘 + 끄기 단추', s.띠 && !!끄기, s)
  await 끄기.click(); await p.waitForLoadState('domcontentloaded'); await p.waitForTimeout(2300)
  s = await 상태(p)
  ok('끄기 — 다시 소장님 기기(한 줄) · 오류 0', !s.띠 && s.한줄 && !오류.length, { s, 오류 })
  await ctx.close()
}
{
  const { ctx, p } = await 새쪽(390, 844, { 때: '2026-11-22T20:00:00+09:00', 소장님: '열쇠말' })
  await 들어감(p, '/qna')
  const s = await 상태(p)
  ok('열쇠말 기기(소장님 폰) — 일요일 맵톡도 안 막음 · 한 줄', !s.띠 && s.한줄, s)
  await ctx.close()
}

console.log('④ 안 막는 곳 — 로봇 · 자동 브라우저')
for (const [이름, 옵] of [['검색 로봇', { ua: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' }], ['자동 브라우저(webdriver)', { 자동끔: false }]]) {
  const { ctx, p } = await 새쪽(390, 844, 옵)
  await 들어감(p)
  await 시험칸(p)
  await p.click('#t글', { force: true }).catch(() => {}); await p.keyboard.type('가상'); await p.waitForTimeout(200)
  ok(`${이름} — 띠 없음 · 입력 됨`, !(await 상태(p)).띠 && (await p.evaluate(() => document.getElementById('t글').value)) === '가상')
  await ctx.close()
}

console.log('⑤ 날이 바뀌면 저절로(1분마다 봄 · 61초 기다림 둘)')
{
  const { ctx, p, 오류 } = await 새쪽(390, 844, { 때: '2026-11-20T23:59:30+09:00' })
  await 들어감(p); await 다닫기(p)
  await 시험칸(p)
  ok('금 23:59 — 띠 없음', !(await 상태(p)).띠)
  await p.evaluate(() => { window.__더 = (window.__더 || 0) + 60000 })
  await p.waitForTimeout(61500)
  await p.click('#t글', { force: true }).catch(() => {}); await p.keyboard.type('가상'); await p.waitForTimeout(200)
  ok('토 0시 넘음 — 열어 둔 화면도 띠 · 막기 걸림', (await 상태(p)).띠 && (await p.evaluate(() => document.getElementById('t글').value)) === '' && !오류.length, { s: await 상태(p), 오류 })
  await ctx.close()
}
{
  const { ctx, p } = await 새쪽(390, 844, { 때: '2026-11-22T23:59:30+09:00' })
  await 들어감(p); await 다닫기(p)
  await 시험칸(p)
  ok('일 23:59 — 띠 있음', (await 상태(p)).띠)
  await p.evaluate(() => { window.__더 = (window.__더 || 0) + 60000 })
  await p.waitForTimeout(61500)
  await 다닫기(p)
  await p.click('#t글', { force: true }).catch(() => {}); await p.keyboard.type('가상'); await p.waitForTimeout(200)
  ok('월 0시 넘음 — 띠 사라짐 · 입력 됨', !(await 상태(p)).띠 && (await p.evaluate(() => document.getElementById('t글').value)) === '가상', await 상태(p))
  await ctx.close()
}
await b.close()
console.log(`\n${bad ? '✗' : '✓'} 시험_점검창 ${n - bad}/${n}`)
process.exit(bad ? 1 : 0)
