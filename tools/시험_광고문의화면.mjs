/**
 * 🧪 G549 광고 · 제휴 문의 길 화면 시험 — 2026-11-05
 *   구운 사이트(dist)를 띄운 뒤:  LANG=C.UTF-8 node tools/시험_광고문의화면.mjs [주소=http://127.0.0.1:4986]  · OUT=폴더 면 화면 사진
 *   소장님 「건설맵에서 광고, 제휴 문의 한다는 걸 알려야 문의가 들어 오잖아. 모든 페이지에 뒀으면 하는데??」
 *          「건설맵 광고 제휴 문의 어떻게 할 건지 아이디어 주고 캡쳐 줘」
 *   ① 모든 쪽 바닥글 맨 앞 «📣 광고 · 제휴 문의» → /ad (첫 화면 · 도구 · 맵톡 · 보험료 계산기)
 *   ② PC 1280 머리 줄 «📣 광고 · 제휴» 보임 · 폰 390 은 숨김(넘침 0)
 *   ③ 광고 카드 위 띠 «광고 · 제휴 문의 →» → /ad (보험료 계산기 정순덕 카드)
 *   ④ 광고가 없는 쪽(도구 목록 · 서식 목록)에 «업체 광고 · 제휴 받습니다» 한 장 → /ad · 광고가 있는 쪽엔 없음
 *   ⑧ 유료 광고(광고주 모집 — 소장님 「내가 광고비를 받으려고 하는 거야」) — «명함 한 장이면» 같은 공짜처럼 읽히는 말 없음 · «광고비 · 기간» 안내 · 진행 넷(문의 → 광고비 안내 → 견본 → 게재 · 효과 보고)
 *   ⑦ 광고 · 제휴 같은 무게(소장님 「광고나 제휴잖아. 지금 광고만 받는다고 잇는데」) — 띠 · 모집 카드 · /ad 맨 위 · 문의 칸 모두 «제휴» 가 같이 · 제휴 네 가지 · 🤝 제휴 문의(?k=ad&w=p)
 *   ⑤ /ad 안내 쪽 — 자리 넷 · 견본(가상 업체 · 눌리지 않음) · 신청 세 걸음 · «문의 보내기» = /contact?k=ad · «무료» · «클로드» 없음 · 넘침 0 · 오류 0
 *   ⑥ /contact?k=ad — «무슨 일» 에 «📣 광고 · 제휴 문의» 가 미리 적힘 · 제목 바뀜(보내지는 않음)
 * 가상 자료만 씀 · 인터넷 안 부름(데이터베이스 · 애널리틱스는 막음).
 */
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const BASE = process.argv[2] || 'http://127.0.0.1:4986'
const OUT = process.env.OUT || ''
let bad = 0, n = 0
const ok = (이름, c, got) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (c || got === undefined ? '' : ' = ' + JSON.stringify(got).slice(0, 300))) }
const b = await chromium.launch()
async function 새쪽(w, h, 폰 = true) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', isMobile: 폰, hasTouch: 폰, deviceScaleFactor: 2,
    userAgent: 폰 ? 'Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36' : undefined })
  await ctx.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|googlesyndication|geojs/, (r) => r.fulfill({ status: 200, body: '' }))
  await ctx.route(/firebaseio\.com|firebasedatabase\.app/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await ctx.addInitScript(() => { try { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); sessionStorage.setItem('kcm_notice_seen', '2026-10-업체') } catch (e) { /* 없음 */ } })
  const p = await ctx.newPage()
  const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
  p.on('dialog', (d) => d.dismiss())
  return { ctx, p, 오류 }
}
const 넘침 = (p) => p.evaluate(() => document.documentElement.scrollWidth - innerWidth)
const 숨김 = (p) => p.addStyleTag({ content: '.insa{display:none!important}' })
const 바닥 = (p) => p.evaluate(() => { const a = document.querySelector('footer .ft-ad'); return a ? { 글: a.innerText.trim(), 곳: a.getAttribute('href'), 첫: a === document.querySelector('footer a') } : null })

console.log('① 바닥글 · ② 머리 줄 · ④ 모집 카드 — 폰 390')
{
  const { ctx, p, 오류 } = await 새쪽(390, 844)
  for (const 길 of ['/', '/tools', '/qna', '/tools/boheomryo', '/forms']) {
    await p.goto(BASE + 길, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1500)
    const f = await 바닥(p)
    ok(`${길} 바닥글 맨 앞 «📣 광고 · 제휴 문의» → /ad`, !!f && /광고 · 제휴 문의/.test(f.글) && f.곳 === '/ad' && f.첫, f)
  }
  ok('② 폰 390 머리 줄 «광고 · 제휴» 는 숨김', await p.evaluate(() => { const a = document.querySelector('.ad-top'); return !!a && getComputedStyle(a).display === 'none' }))
  await p.goto(BASE + '/tools', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1500)
  const 모 = await p.evaluate(() => [...document.querySelectorAll('aside.adc-recruit')].map((a) => ({ 글: a.innerText.replace(/\s+/g, ' ').trim(), 곳: (a.querySelector('a') || {}).getAttribute?.('href') })))
  ok('④ 도구 목록 — 모집 카드 한 장 «이 자리에 광고하세요 — 광고주 · 제휴 모집» → /ad', 모.length === 1 && /이 자리에 광고하세요 — 광고주 · 제휴 모집/.test(모[0].글) && 모[0].곳 === '/ad', 모)
  ok('⑦ ⑧ 모집 카드 — «광고비 · 기간은 문의» · 제휴 넷 이름 · «명함 한 장이면» 없음', 모.length === 1 && /광고비 · 기간은 문의/.test(모[0].글) && /제휴\(이용자 할인 · 서로 알리기 · 교육 · 상담 연결\)/.test(모[0].글) && !/명함 한 장/.test(모[0].글), 모[0] && 모[0].글)
  ok('④ 도구 목록 — 첫 결과 위에는 없음(머리 · 많이 쓴 도구 뒤)', await p.evaluate(() => { const a = document.querySelector('aside.adc-recruit'); const h = document.querySelector('.tl-h1'); return !!a && !!h && (h.compareDocumentPosition(a) & Node.DOCUMENT_POSITION_FOLLOWING) > 0 }))
  if (OUT) { await 숨김(p); await p.evaluate(() => document.querySelector('aside.adc-recruit').scrollIntoView({ block: 'center' })); await p.waitForTimeout(300); await p.screenshot({ path: OUT + '/문의_도구목록_모집카드_폰390.png' }) }
  await p.goto(BASE + '/forms', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1500)
  ok('④ 서식 목록 — 모집 카드 한 장', (await p.locator('aside.adc-recruit').count()) === 1, await p.locator('aside.adc-recruit').count())
  await p.goto(BASE + '/tools/boheomryo', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1500)
  ok('④ 광고가 있는 쪽(보험료 계산기)엔 모집 카드 없음', (await p.locator('aside.adc-recruit').count()) === 0 && (await p.locator('aside.adc[data-ad]').count()) === 1)
  const 띠 = await p.evaluate(() => { const a = document.querySelector('aside.adc[data-ad] .adc-ask'); return a ? { 글: a.innerText.trim(), 곳: a.getAttribute('href') } : null })
  ok('③ ⑦ 광고 카드 위 띠 «광고 · 제휴 문의 →» → /ad(광고만 적지 않음)', !!띠 && /광고 · 제휴 문의/.test(띠.글) && 띠.곳 === '/ad', 띠)
  if (OUT) { await 숨김(p); await p.evaluate(() => document.querySelector('aside.adc[data-ad]').scrollIntoView({ block: 'center' })); await p.waitForTimeout(300); await p.screenshot({ path: OUT + '/문의_광고카드_띠_폰390.png' }) }
  if (OUT) { await p.evaluate(() => document.querySelector('footer').scrollIntoView({ block: 'end' })); await p.waitForTimeout(300); await p.screenshot({ path: OUT + '/문의_바닥글_폰390.png' }) }
  ok('폰 390 넘침 0 · 오류 0', (await 넘침(p)) <= 0 && !오류.length, [await 넘침(p), 오류])
  await ctx.close()
}

console.log('⑤ /ad 안내 쪽 — 폰 390 · PC 1280')
for (const [w, h, 폰] of [[390, 844, true], [320, 640, true], [1280, 900, false]]) {
  const { ctx, p, 오류 } = await 새쪽(w, h, 폰)
  await p.goto(BASE + '/ad', { waitUntil: 'domcontentloaded' }); await p.waitForSelector('.adinfo-h1', { timeout: 15000 }); await p.waitForTimeout(800)
  const 글 = await p.evaluate(() => document.querySelector('.adinfo').innerText.replace(/\s+/g, ' '))
  ok(`${w} 제목 «광고주 · 제휴 모집» · 자리 넷 · 진행 넷 · 제휴 분야 · 광고비 · 기간은 문의`, /K-건설맵 광고주 · 제휴 모집/.test(글) && (await p.locator('#ad-guide .adinfo-spots li').count()) === 4 && (await p.locator('.adinfo-steps li').count()) === 4 && /건설 장비/.test(글) && /광고비 · 기간은 문의/.test(글) && /광고비 · 기간 안내/.test(글) && /게재 · 효과 보고/.test(글), 글.slice(0, 200))
  ok(`${w} ⑧ 공짜처럼 읽히는 말 없음(«명함 한 장이면» · «만들어 드립니다» · «무료»)`, !/명함 한 장|만들어 드립니다|무료/.test(글), (글.match(/.{0,20}(명함 한 장|만들어 드립니다|무료).{0,20}/) || [''])[0])
  ok(`${w} «중기» 라는 말 없음(어떤 업체가 올지 모름 — 소장님 「중기라는 말을 넣으면 안돼지」)`, !/중기/.test(글) && !/중기/.test(await p.title()), (글.match(/.{0,20}중기.{0,20}/) || [''])[0])
  const 견 = await p.evaluate(() => { const a = document.querySelector('aside.adc-demo'); return a ? { 글: a.innerText.replace(/\s+/g, ' '), 링크: a.querySelectorAll('a').length, 셈: a.hasAttribute('data-ad') } : null })
  ok(`${w} 견본 카드 — «견본 — 이렇게 나옵니다» · 가상 업체 · 눌리는 전화 · 문자 · 메일 없음 · 셈 안 함`, !!견 && /견본 — 이렇게 나옵니다/.test(견.글) && /업체 이름/.test(견.글) && /하시는 일을 한 줄로/.test(견.글) && 견.링크 === 0 && !견.셈, 견)
  const 보내기 = await p.evaluate(() => [...document.querySelectorAll('.adinfo a.adinfo-go')].map((a) => a.getAttribute('href')))
  ok(`${w} «문의 보내기» 둘 = 광고 · 제휴(/contact?k=ad) · 🤝 제휴(/contact?k=ad&w=p)`, 보내기.length === 2 && 보내기[0] === '/contact?k=ad' && 보내기[1] === '/contact?k=ad&w=p', 보내기)
  const 위 = await p.evaluate(() => ({ 글: document.querySelector('.adinfo-hero').innerText.replace(/\s+/g, ' '), 칸: [...document.querySelectorAll('.adinfo-two .adinfo-pick b')].map((b) => b.textContent) }))
  ok(`${w} ⑦ 맨 위에 광고 · 제휴 두 칸 · 첫 글에 «광고주와 제휴를 모십니다»`, 위.칸.join('|') === '📣 광고|🤝 제휴' && /광고주와 제휴를 모십니다/.test(위.글), 위)
  const 제 = await p.evaluate(() => [...document.querySelectorAll('#ad-partner .adinfo-spots li b')].map((b) => b.textContent))
  ok(`${w} ⑦ 제휴 네 가지(이용자 할인 · 서로 알리기 · 설명회 · 교육 · 자료 · 상담 연결)`, 제.join('|') === '이용자 할인|서로 알리기|설명회 · 교육 · 자료|상담 연결', 제)
  const 내려 = await p.evaluate(async () => { document.querySelectorAll('.adinfo-pick')[1].click(); await new Promise((r) => setTimeout(r, 900)); const t = document.getElementById('ad-partner').getBoundingClientRect().top; return { t: Math.round(t), h: innerHeight, y: Math.round(scrollY) } })
  ok(`${w} ⑦ «🤝 제휴» 칸 누르면 제휴 칸으로 내려감(머리 줄에 안 가림)`, 내려.y > 100 && 내려.t >= 40 && 내려.t <= 내려.h * 0.6, 내려)
  ok(`${w} «무료» · «클로드» 없음`, !/무료|클로드/.test(글))
  if (!폰) ok('② PC 1280 머리 줄 «📣 광고 · 제휴» 보임 → /ad', await p.evaluate(() => { const a = document.querySelector('.ad-top'); return !!a && getComputedStyle(a).display !== 'none' && a.getAttribute('href') === '/ad' }))
  ok(`${w} 넘침 0 · 오류 0`, (await 넘침(p)) <= 0 && !오류.length, [await 넘침(p), 오류])
  if (OUT && w !== 320) {
    await 숨김(p)
    await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(300)
    await p.screenshot({ path: OUT + `/문의_안내쪽_위_${폰 ? '폰390' : 'PC1280'}.png` })
    if (폰) { await p.evaluate(() => document.querySelector('aside.adc-demo').scrollIntoView({ block: 'center' })); await p.waitForTimeout(300); await p.screenshot({ path: OUT + '/문의_안내쪽_견본_폰390.png' }) }
    if (폰) { await p.evaluate(() => document.querySelector('.adinfo-steps').scrollIntoView({ block: 'center' })); await p.waitForTimeout(300); await p.screenshot({ path: OUT + '/문의_안내쪽_신청_폰390.png' }) }
    if (폰) { await p.evaluate(() => document.getElementById('ad-partner').scrollIntoView({ block: 'center' })); await p.waitForTimeout(300); await p.screenshot({ path: OUT + '/문의_안내쪽_제휴_폰390.png' }) }
  }
  await ctx.close()
}

console.log('⑥ /contact?k=ad — 미리 적힘(보내지는 않음)')
{
  const { ctx, p, 오류 } = await 새쪽(390, 844)
  await p.goto(BASE + '/contact?k=ad', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(800)
  const 칸 = await p.evaluate(() => ({ 일: document.getElementById('work').value, 제목: (document.querySelector('.card h2') || {}).textContent, 자세히: document.getElementById('memo').placeholder }))
  ok('«무슨 일» = «📣 광고 · 제휴 문의» · 제목 바뀜 · 자세히 안내 글(광고 · 제휴 둘 다)', 칸.일 === '📣 광고 · 제휴 문의' && /광고 · 제휴 문의/.test(칸.제목) && /광고비 · 기간은 답장으로/.test(칸.자세히) && /제휴 — 회사 이름/.test(칸.자세히) && !/명함/.test(칸.자세히), 칸)
  await p.goto(BASE + '/contact?k=ad&w=p', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(600)
  const 칸2 = await p.evaluate(() => ({ 일: document.getElementById('work').value, 제목: (document.querySelector('.card h2') || {}).textContent, 자세히: document.getElementById('memo').placeholder }))
  ok('⑦ /contact?k=ad&w=p = «🤝 제휴 문의» · 제목 · 자세히(함께하고 싶은 일)', 칸2.일 === '🤝 제휴 문의' && /제휴 문의/.test(칸2.제목) && /함께하고 싶은 일/.test(칸2.자세히), 칸2)
  ok('⑦ contact.html 메일 갈래 — 제휴만 «제휴» · 나머지 «광고 · 제휴»(소스)', /want: 광고 \? \(제휴만 \? '제휴' : '광고 · 제휴'\) : '사이트 문의'/.test(require('node:fs').readFileSync(new URL('../web/public/contact.html', import.meta.url), 'utf8')))
  await p.goto(BASE + '/contact', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(500)
  ok('그냥 /contact 는 예전 그대로(빈 칸)', (await p.evaluate(() => document.getElementById('work').value)) === '')
  ok('오류 0', !오류.length, 오류)
  if (OUT) { await p.goto(BASE + '/contact?k=ad', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(500); await p.screenshot({ path: OUT + '/문의_보내기_폰390.png' }) }
  if (OUT) { await p.goto(BASE + '/contact?k=ad&w=p', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(500); await p.screenshot({ path: OUT + '/문의_보내기_제휴_폰390.png' }) }
  await ctx.close()
}
if (OUT) {
  const { ctx, p } = await 새쪽(1280, 800, false)
  await p.goto(BASE + '/tools', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1200); await 숨김(p)
  await p.screenshot({ path: OUT + '/문의_머리줄_PC1280.png', clip: { x: 0, y: 0, width: 1280, height: 80 } })
  await ctx.close()
}
await b.close()
console.log(`\n${bad ? '✗' : '✓'} 시험_광고문의화면 ${n - bad}/${n}`)
if (bad) process.exit(1)
