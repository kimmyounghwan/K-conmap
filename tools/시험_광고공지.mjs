/**
 * 🧪 사이트 공지 창 시험(감사공지.jsx) — 📣 G786 (2026-11-19) «공사를 원하는 업체를 찾습니다 — 건설맵 제휴업체 모집» (G552 «운영은 광고로» 시험을 이 공지로 바꿈)
 *   가짜 파이어베이스로 구운 판(굽기.sh)을 띄운 뒤:  LANG=C.UTF-8 node tools/시험_광고공지.mjs [주소=http://127.0.0.1:4986]  · OUT=폴더 면 화면 사진
 *   소장님 「공지를 띄워줘 …」 → 「공사를 맡길 업체는 없다. 공사를 원하는 업체가 있을 뿐이지. 공지내용 바꿔」 · 「건설사. 장비, 자재, 인력..각기 따로 해야지」
 *          · 「건설맵 들어오면 공지창이 보이게 해줘」 · 「업데이트 내용도 맵톡에 올려 … 오늘 업데이트 한 것 알 수 있게」 · 「공지 화면 띄우고」 · 「바로 올려줘」
 *   ① 들어오면 창 한 번 — 제목 · 맵톡 예의 줄(굵게 · 맨 위) · 맵톡 📌 공지와 같은 글 · 업체 갈래 다섯(따로) · 적을 것 다섯 줄(업체마다 따로)
 *      · «공사를 맡길 · 먼저 연결 · 양쪽에 먼저» 같은 말 없음 · 오늘 고친 것 칸 · 신청 단추(/contact?k=ad&w=p) · 띠 없음(G656) · 화면 자리 그대로
 *   ② 닫기 · ✕ · Esc · 바깥 누르기 → 닫힘 · 같은 창(탭)의 다른 화면에선 다시 안 뜸
 *   ③ 폭 320 · 390 · 1280 — 창이 화면 안 · 신청 단추가 굴리지 않고 보임 · 넘침 0 · 오류 0 · 어두운 화면
 *   ④ 날짜 — 고친 것 칸은 11-21 까지 · 창은 12-31 까지
 *   ⑤ 자동 브라우저(webdriver) · 그 공지 글 화면 · 다른 탭이 열려 있으면(쓰는 중) 창을 저절로 안 띄움
 *   ⑥ 맵톡 맨 위 공지 줄 — 뉴스 다음 «모집» 줄(주황 · 늘 보임) · 접은 줄 3 · 누르면 그 글
 *   ⑦ 🩹 G786b 소장님 「나갔다가 들어와도 공지창 뜨게 해」 — 닫은 뒤 30초 넘게 떠났다 오면 다시 뜸 · 10초는 안 뜸 · 다른 건설맵 탭을 쓰고 있었으면 안 뜸
 *      · 건설맵 안 화면 옮김 · 쓰는 중 새로고침은 안 뜸 · 같은 창을 한참 뒤 다시 열면(새로고침) 뜸 · 그 공지 글 화면은 안 뜸
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
const 맵톡글 = '-P6mnLMidNXOA01HjA3-', 고친글 = '-P6mqrXztoAugoRKozhq'
/* 맵톡 📌 공지(G786u 로 고친 글)와 같은 말 — 창 글에 그대로 들어 있어야 함 */
const 글들 = [
  '공사를 원하는 업체를 찾습니다. K-건설맵과 함께하는 업체는 건설맵에 제휴업체로 올려 드립니다.',
  '🏢 건설사 — 종합 · 전문건설업(전국 · 공종 무관)', '🚜 장비 업체 — 굴착기 · 크레인 · 덤프 등', '🧱 자재 업체 — 철물점 · 레미콘 · 골재 등',
  '👷 인력 업체 — 기능 인력 · 일용 인력', '➕ 그 밖에 건설에 필요한 모든 업체(가설 · 운반 · 폐기물 · 공무 서류 등)',
  '건설맵에 제휴업체로 올려 드립니다', '함께하는 방식 · 조건은 상담으로 정합니다', '📝 신청 — 아래를 적어 보내 주세요',
  '회사 이름(상호) · 대표자 이름 · 사업자등록번호 · 회사 주소 · 일하는 지역 · 담당자 이름 · 전화 · 이메일 · 하시는 일 · 함께하고 싶은 일',
  '업종(면허) · 시평 · 주력 공종', '장비 종류 · 규격(톤수) · 대수', '다루는 자재 · 품목', '직종 · 인원', '남기신 내용은 운영자만 봅니다.',
]
const 없을말 = /공사를 맡길|먼저 연결|양쪽에 먼저|클로드|무료/
const OP = 'ZglL1g3X5UZFBA2590LirDnEnil1'
async function 새쪽(w, h, { 때 = '2026-11-19T20:00:00+09:00', 자동끔 = true, 폰 = true, 어둠 = false, 씨앗 = null, 더 = null } = {}) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', isMobile: 폰, hasTouch: 폰, deviceScaleFactor: 2, colorScheme: 어둠 ? 'dark' : 'light',
    userAgent: 폰 ? 'Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36' : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36' })
  await ctx.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|googlesyndication|geojs|daumcdn|kakao|coupang/, (r) => r.fulfill({ status: 200, body: '' }))
  await ctx.route(/firebaseio\.com|firebasedatabase\.app/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  const t = Date.parse(때)
  await ctx.addInitScript(([t, 자동끔, 씨앗, 더]) => {
    const 원 = Date; const 차 = t - 원.now()
    const D = function (...a) { return a.length ? new 원(...a) : new 원(원.now() + 차 + (window.__더 || 0)) }
    D.now = () => 원.now() + 차 + (window.__더 || 0); D.UTC = 원.UTC; D.parse = 원.parse; D.prototype = 원.prototype
    window.Date = D
    /* ⑦ 시험이 «화면 가려짐» 을 흉내(window.__숨김) · 시간을 앞으로 감기(window.__더 ms) */
    try { Object.defineProperty(document, 'hidden', { configurable: true, get: () => window.__숨김 === true }); Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (window.__숨김 === true ? 'hidden' : 'visible') }) } catch (e) { /* 없음 */ }
    if (자동끔) { try { Object.defineProperty(navigator, 'webdriver', { get: () => false }) } catch (e) { /* 없음 */ } }
    if (씨앗 && !sessionStorage.getItem('씨앗됨')) { localStorage.setItem('mockdb', JSON.stringify(씨앗)); localStorage.setItem('mockuid', 'mockuser786'); sessionStorage.setItem('씨앗됨', '1') }
    if (더 === '다른탭') { try { localStorage.setItem('kcm_notice_alive', String(원.now() + 차 - 3000)) } catch (e) { /* */ } }
  }, [t, 자동끔, 씨앗, 더])
  const p = await ctx.newPage()
  const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
  p.on('dialog', (d) => d.dismiss())
  return { ctx, p, 오류 }
}
const 넘침 = (p) => p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
const 창글 = (p) => p.evaluate(() => {
  const c = document.querySelector('.noticepop'); if (!c) return null
  const 몸 = c.querySelector('.noticepop-b')
  const 신 = c.querySelector('.noticepop-f a.noticepop-go')
  return { 큰: (c.querySelector('.noticepop-must') || {}).textContent, 작은: (c.querySelector('.noticepop-sub') || {}).textContent,
    글: c.innerText.replace(/\s+/g, ' '), 첫: (몸.firstElementChild || {}).className, 굵게: (c.querySelector('.noticepop-strong b') || {}).textContent,
    갈래: [...c.querySelectorAll('ul.noticepop-kinds > li')].map((e) => e.innerText.replace(/\s+/g, ' ').trim()),
    적을: [...c.querySelectorAll('.noticepop-form > div > b')].map((e) => e.textContent),
    고침: c.querySelector('.noticepop-fix') ? [...c.querySelectorAll('.noticepop-fix li')].length : 0,
    링크: [...c.querySelectorAll('a')].map((a) => a.getAttribute('href')), 신청: 신 ? 신.getAttribute('href') : null }
})
const 단추보임 = (p) => p.evaluate(() => { const a = document.querySelector('.noticepop-f a.noticepop-go'), x = document.querySelector('.noticepop-f button'); if (!a || !x) return null
  const r = a.getBoundingClientRect(), q = x.getBoundingClientRect(); return { 보임: r.top >= 0 && r.bottom <= innerHeight && q.bottom <= innerHeight && r.width > 60, 위: Math.round(r.top), 아래: Math.round(q.bottom), 높이: innerHeight } })
const 자리 = (p) => p.evaluate(() => [...document.querySelector('main.shell').children].slice(0, 4).map((e) => [e.tagName + '.' + String(e.className).split(' ')[0], Math.round(e.getBoundingClientRect().top)]))

console.log('① 들어오면 창 — 폰 390 · 11-19 20시')
{
  const { ctx, p, 오류 } = await 새쪽(390, 844)
  await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500)
  const 창 = await 창글(p)
  ok('창 제목 «📣 공사를 원하는 업체를 찾습니다» · «K-건설맵 제휴업체 모집»', !!창 && 창.큰 === '📣 공사를 원하는 업체를 찾습니다' && 창.작은 === 'K-건설맵 제휴업체 모집', 창 && [창.큰, 창.작은])
  ok('맵톡 예의 줄 굵게 · 몸 맨 위(G345 «항상 포함»)', !!창 && 창.굵게 === '🗺 맵톡은 여러 분이 함께 쓰는 곳입니다. 예의를 갖추고 이용해 주세요.' && 창.첫 === 'noticepop-strong', 창 && [창.굵게, 창.첫])
  const 빠짐 = 창 ? 글들.filter((x) => !창.글.includes(x)) : 글들
  ok('창 글 = 맵톡 📌 공지와 같은 말(15줄)', !빠짐.length, 빠짐)
  ok('업체 갈래 다섯 — 건설사 · 장비 · 자재(철물점) · 인력 · 그 밖 «따로»', !!창 && 창.갈래.length === 5 && ['🏢 건설사', '🚜 장비 업체', '🧱 자재 업체', '👷 인력 업체', '➕ 그 밖에'].every((x, i) => 창.갈래[i].startsWith(x)) && /철물점/.test(창.갈래[2]), 창 && 창.갈래)
  ok('적어 보낼 것 — 모든 업체 · 건설사 · 장비 · 자재 · 인력 «따로»', !!창 && JSON.stringify(창.적을) === JSON.stringify(['모든 업체', '건설사', '장비 업체', '자재 업체', '인력 업체']), 창 && 창.적을)
  ok('«공사를 맡길 · 먼저 연결 · 양쪽에 먼저 · 클로드 · 무료» 없음(소장님 「공사를 맡길 업체는 없다」)', !!창 && !없을말.test(창.글), 창 && (창.글.match(없을말) || [])[0])
  ok('오늘 고친 것 칸 일곱 줄(11-21 까지)', !!창 && 창.고침 === 7, 창 && 창.고침)
  ok('고리 — 신청(/contact?k=ad&w=p) · 맵톡 공지 · 고친 것 글 · 도장 · 공무 올인원 · 하도급', !!창 && 창.신청 === '/contact?k=ad&w=p' && ['/qna/' + 맵톡글, '/qna/' + 고친글, '/tools/dojang', '/tools/gongmu', '/naeyeok/hado'].every((x) => 창.링크.includes(x)), 창 && 창.링크)
  ok('띠 없음(G656 «공지보기 제거» — 그 자리는 쿠팡 줄)', !(await p.$('.noticebar')))
  const 단 = await 단추보임(p)
  ok('신청 · 닫기 단추가 굴리지 않고 보임', !!단 && 단.보임, 단)
  ok('넘침 0 · 오류 0(창 열린 채)', (await 넘침(p)) <= 0 && !오류.length, [await 넘침(p), 오류])
  if (OUT) await p.screenshot({ path: OUT + '/공지_창_폰390.png' })
  const 열림자리 = await 자리(p)
  await p.click('.noticepop-f button'); await p.waitForTimeout(300)
  ok('«닫기» → 창 닫힘 · 띠 없음', !(await p.$('.noticepop')) && !(await p.$('.noticebar')))
  await p.goto(BASE + '/tools', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1500)
  ok('같은 창(탭)의 다른 화면 — 창 다시 안 뜸', !(await p.$('.noticepop')))
  await ctx.close()
  /* 화면 자리 그대로 — 창이 안 뜨는 자동 브라우저와 맨 위 칸 자리가 같음(창은 위에 덮일 뿐) */
  const { ctx: c2, p: p2 } = await 새쪽(390, 844, { 자동끔: false })
  await p2.goto(BASE + '/', { waitUntil: 'domcontentloaded' }); await p2.waitForTimeout(2500)
  const 안열림자리 = await 자리(p2)
  ok('맨 위 칸 자리 그대로(새판 · 쿠팡 줄 · 공사 연결 띠 — 창 있을 때와 같음)', JSON.stringify(열림자리) === JSON.stringify(안열림자리), [열림자리, 안열림자리])
  await c2.close()
}
console.log('② 닫는 길 — ✕ · Esc · 바깥 누르기')
for (const [길, 함] of [['✕', (p) => p.click('.noticepop-x')], ['Esc', (p) => p.keyboard.press('Escape')], ['바깥', (p) => p.mouse.click(5, 5)]]) {
  const { ctx, p } = await 새쪽(390, 844)
  await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2200)
  const 있었음 = !!(await p.$('.noticepop'))
  await 함(p); await p.waitForTimeout(300)
  ok(`${길} 로 닫힘 · 몸 굴림 되돌림`, 있었음 && !(await p.$('.noticepop')) && (await p.evaluate(() => document.body.style.overflow + '|' + document.documentElement.style.overflow)) === '|')   /* 🔒 G791 잠금은 html 에 — 닫히면 둘 다 빈칸 */
  await ctx.close()
}
console.log('③ 폭 320 · 1280 · 어두운 화면')
for (const [w, h, 폰, 어둠] of [[320, 640, true, false], [1280, 860, false, false], [390, 844, true, true]]) {
  const { ctx, p, 오류 } = await 새쪽(w, h, { 폰, 어둠 })
  await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500)
  const 창 = await 창글(p)
  const 상자 = await p.evaluate(() => { const c = document.querySelector('.noticepop-c'); if (!c) return null; const r = c.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom, w: innerWidth, h: innerHeight } })
  const 단 = await 단추보임(p)
  ok(`${w}${어둠 ? ' 어두운' : ''} 창 · 화면 안 · 신청 단추 보임 · 넘침 0 · 오류 0`, !!창 && !!상자 && 상자.l >= 0 && 상자.r <= 상자.w && 상자.t >= 0 && 상자.b <= 상자.h && !!단 && 단.보임 && (await 넘침(p)) <= 0 && !오류.length, [상자, 단, await 넘침(p), 오류])
  if (어둠) {
    const 색 = await p.evaluate(() => { const c = getComputedStyle(document.querySelector('.noticepop-c')), t = getComputedStyle(document.querySelector('.noticepop-b')); return [c.backgroundColor, t.color] })
    ok('어두운 화면 — 창 바탕과 글씨 색이 다름 · 바탕이 흰색 아님', 색[0] !== 색[1] && !/255, 255, 255/.test(색[0]), 색)
  }
  if (OUT) await p.screenshot({ path: `${OUT}/공지_창_${폰 ? '폰' : 'PC'}${w}${어둠 ? '_어둠' : ''}.png` })
  await ctx.close()
}
console.log('④ 날짜')
for (const [때, 창있어야, 고침있어야] of [['2026-11-21T23:59:00+09:00', true, true], ['2026-11-22T00:01:00+09:00', true, false], ['2026-12-31T23:59:00+09:00', true, false], ['2027-01-01T00:01:00+09:00', false, false]]) {
  const { ctx, p } = await 새쪽(390, 844, { 때 })
  await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2000)
  const 점검 = await p.$('.checkpop .noticepop-f button'); if (점검) { await 점검.click(); await p.waitForTimeout(400) }   /* 🛠 G792 점검 날(11-21 · 11-22)엔 점검창이 먼저 — 닫으면 이 공지창 */
  const 창 = !!(await p.$('.noticepop')), 고침 = !!(await p.$('.noticepop-fix'))
  ok(`${때.slice(0, 16)} 창 ${창있어야 ? '있음' : '없음'} · 고친 것 칸 ${고침있어야 ? '있음' : '없음'} · 띠 없음`, 창 === 창있어야 && 고침 === 고침있어야 && !(await p.$('.noticebar')), [창, 고침])
  await ctx.close()
}
console.log('⑤ 저절로 안 뜨는 때')
{
  const { ctx, p, 오류 } = await 새쪽(390, 844, { 자동끔: false })
  await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500)
  ok('자동 브라우저(webdriver) — 창 저절로 안 뜸 · 띠 없음 · 오류 0', !(await p.$('.noticepop')) && !(await p.$('.noticebar')) && !오류.length, 오류)
  await ctx.close()
}
for (const 길 of ['/qna/' + 맵톡글, '/qna/' + 고친글]) {
  const { ctx, p } = await 새쪽(390, 844)
  await p.goto(BASE + 길, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500)
  ok(`그 글 화면(${길.slice(0, 12)}…) — 같은 글이라 창 안 뜸`, !(await p.$('.noticepop')))
  await ctx.close()
}
{
  const { ctx, p } = await 새쪽(390, 844, { 더: '다른탭' })
  await p.goto(BASE + '/tools', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2200)
  ok('다른 K-건설맵 탭이 열려 있으면(쓰는 중 · G284) 새 탭엔 창 안 뜸', !(await p.$('.noticepop')))
  await ctx.close()
}
console.log('⑥ 맵톡 맨 위 공지 줄 — 모집 줄')
{
  const 때 = '2026-11-19T20:00:00+09:00', 지금 = Date.parse(때), H = 3600e3
  const 씨앗 = { qna: {}, qna_a: {}, qna_del: {}, qna_top: {}, qna_like: {}, qna_view: {} }
  const 넣기 = (id, t, 몇, 고정 = true, 더 = {}) => { 씨앗.qna[id] = { t, b: '가상 내용입니다', nick: 'K-건설맵', uid: OP, at: 지금 - 몇 * H, ...더 }; if (고정) 씨앗.qna_top[id] = 지금 - 몇 * H }
  넣기('-P9zz000000000000001', '[K-건설맵] 옛 공지 — 가상', 200)
  넣기('-P9zz000000000000002', '[K-건설맵] 🖋 도장 만들기 — 이제 사용하실 수 있습니다', 9)
  넣기('-P9zz000000000000003', '[K-건설맵] 📰 건설뉴스 — 가상', 4, false)   /* 맵톡이 제목 앞 [K-건설맵] 을 말머리로 뗌(갈래떼기) → 공지 · 📰 = 뉴스 */
  넣기('-P9zz000000000000004', '[K-건설맵] 📣 공사를 원하는 업체를 찾습니다 — 건설맵 제휴업체 모집', 3)
  넣기('-P9zz000000000000005', '[K-건설맵] 🛠 11월 19일 새로 넣고 고친 것 — 도장 만들기 · 공무 올인원 등', 2.8)
  for (let i = 6; i <= 12; i++) 씨앗.qna['-P9zz0000000000000' + String(i).padStart(2, '0')] = { t: `[후기·건의] 가상 글 ${i}`, b: '가상', nick: `가상 별명${i}`, uid: 'u' + i, at: 지금 - (20 - i) * H }
  for (const [이름, w, h, 폰, 어둠] of [['PC 1440', 1440, 1000, false, false], ['폰 390', 390, 844, true, false], ['폰 390 어두운', 390, 844, true, true]]) {
    const { ctx, p, 오류 } = await 새쪽(w, h, { 때, 폰, 어둠, 씨앗, 자동끔: false })
    await p.goto(BASE + '/qna', { waitUntil: 'domcontentloaded' })
    await p.waitForFunction(() => document.querySelectorAll('.mt-nrow').length >= 3, null, { timeout: 25000 }).catch(() => {})
    await p.waitForTimeout(800)
    const 줄 = await p.evaluate(() => [...document.querySelectorAll('.mt-notice .mt-nrow')].filter((e) => (e.querySelector('.mt-nt') || {}).textContent !== '안내').map((e) => ({ 표: (e.querySelector('.mt-nt') || {}).textContent, 뜨거움: e.classList.contains('hot'), 제목: (e.querySelector('b') || {}).textContent || '',
      바탕: getComputedStyle(e).backgroundColor, 글색: getComputedStyle(e.querySelector('b')).color, 표색: getComputedStyle(e.querySelector('.mt-nt')).backgroundColor })))
    const 더보기 = await p.evaluate(() => ((document.querySelector('.mt-nmore') || {}).textContent || ''))
    ok(`${이름} 접은 공지 줄 셋(맨 위 «안내» 줄 빼고) — 뉴스 · 모집 · 가장 새 공지`, 줄.length === 3 && 줄[0].표 === '뉴스' && 줄[1].표 === '모집' && 줄[1].뜨거움 && /제휴업체 모집/.test(줄[1].제목) && 줄[2].표 === '공지' && /새로 넣고 고친 것/.test(줄[2].제목), 줄.map((x) => [x.표, x.제목.slice(0, 24)]))
    ok(`${이름} 모집 줄만 주황(바탕 · 표) · 제목 글씨가 바탕과 다름`, 줄.length === 3 && 줄[1].바탕 !== 줄[2].바탕 && /234, 88, 12/.test(줄[1].표색) && 줄[1].글색 !== 줄[1].바탕 && !줄[0].뜨거움 && !줄[2].뜨거움, 줄.map((x) => [x.바탕, x.글색, x.표색]))
    ok(`${이름} «▾ 공지 5개 모두 보기»(뉴스 · 모집 · 고친 것 · 도장 · 옛 공지) · 넘침 0 · 오류 0`, /공지 5개 모두 보기/.test(더보기) && (await 넘침(p)) <= 0 && !오류.length, [더보기, await 넘침(p), 오류])
    if (OUT) { const 상자 = await p.$('.mt-notice'); if (상자) await 상자.screenshot({ path: `${OUT}/맵톡_공지줄_${이름.replace(/\s+/g, '')}.png` }) }
    if (!어둠 && 폰) {
      await p.click('.mt-nrow.hot'); await p.waitForTimeout(1200)
      const 열림 = await p.evaluate(() => document.body.innerText.includes('가상 내용입니다') && /제휴업체 모집/.test(document.body.innerText))
      ok('모집 줄을 누르면 그 글이 열림', 열림)
    }
    await ctx.close()
  }
}
console.log('⑦ 나갔다가 들어오기(🩹 G786b)')
{
  const 떠났다옴 = async (p, ms, 딴탭 = false) => {
    await p.evaluate(() => { window.__숨김 = true; document.dispatchEvent(new Event('visibilitychange')) })
    await p.evaluate(([ms, 딴탭]) => { window.__더 = (window.__더 || 0) + ms; if (딴탭) localStorage.setItem('kcm_notice_alive', String(Date.now() - 2000)) }, [ms, 딴탭])
    await p.evaluate(() => { window.__숨김 = false; document.dispatchEvent(new Event('visibilitychange')) })
    await p.waitForTimeout(500)
    return !!(await p.$('.noticepop'))
  }
  const 닫기 = async (p) => { await p.click('.noticepop-f button'); await p.waitForTimeout(300) }
  const { ctx, p, 오류 } = await 새쪽(390, 844)
  await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500)
  ok('처음 들어옴 — 창 뜸', !!(await p.$('.noticepop')))
  await 닫기(p)
  ok('닫은 뒤 40초 떠났다 옴(다른 앱 · 다른 사이트) — 다시 뜸', await 떠났다옴(p, 40000))
  await 닫기(p)
  ok('10초만 떠났다 옴 — 안 뜸(잠깐 다른 앱)', !(await 떠났다옴(p, 10000)))
  ok('40초 가려졌지만 다른 건설맵 탭을 쓰고 있었음 — 안 뜸(쓰는 중)', !(await 떠났다옴(p, 40000, true)))
  await p.evaluate(() => { history.pushState(null, '', '/tools'); dispatchEvent(new PopStateEvent('popstate')) }); await p.waitForTimeout(1200)
  ok('건설맵 안에서 화면 옮김 — 안 뜸', !(await p.$('.noticepop')))
  await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2200)
  ok('쓰는 중 새로고침 — 안 뜸(G284 그대로)', !(await p.$('.noticepop')))
  await p.evaluate(() => { window.__숨김 = true; document.dispatchEvent(new Event('visibilitychange')); localStorage.setItem('kcm_notice_alive', String(Date.now() - 60000)) })
  await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500)
  ok('같은 창을 한참 뒤 다시 엶(폰이 살려 둔 창 · 새로고침) — 다시 뜸(이 창에서 닫았어도)', !!(await p.$('.noticepop')))
  await 닫기(p)
  await p.goto(BASE + '/qna/' + 맵톡글, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2000)
  ok('그 공지 글 화면에서 떠났다 옴 — 안 뜸(같은 글)', !(await 떠났다옴(p, 40000)))
  ok('⑦ 오류 0', !오류.length, 오류)
  await ctx.close()
}
await b.close()
console.log(`\n${bad ? '✗' : '✓'} 시험_광고공지 ${n - bad}/${n}`)
if (bad) process.exit(1)
