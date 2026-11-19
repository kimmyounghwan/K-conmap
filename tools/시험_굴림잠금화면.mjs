// 🧪 G791 — 뒤 화면 막기(html) 화면 시험 (LANG=C.UTF-8 node tools/시험_굴림잠금화면.mjs [주소=http://127.0.0.1:5803]) · C=폴더 면 캡처
//   소장님 11-20 「맵톡에서 클릭을 해도 글을 쓰는걸로 전환이 안돼」 · 「답글쓰는 박스가 위쪽에서 열려」 — 화면을 내린 채 공지창이 다시 뜨면(G786b)
//   body 잠금 때문에 머리줄이 사라지고(아이폰은 떠 있는 창까지 쪽 맨 위에 그림) 맵톡 글 창이 안 보이던 것
//   폰(아이폰 흉내 · 터치 · 어두운 화면) · PC 1280:
//   ① 들어오면 공지창 — 화면 안 · html 잠김 · body 는 스크롤 상자 아님 ② 창이 열린 채 굴려도 머리줄 제자리
//   ③ 닫으면 풂 · 카드를 누르면 글 창이 화면 안(머리줄 · 창 둘 다) ④ 화면을 내린 채 앱으로 돌아옴(30초 넘게) → 공지창이 화면 안
//   ⑤ 카드 «답하기» → 글 창이 화면 안 · 답글 칸에 커서 ⑥ 빠른 찾기 위에 공지창(겹침) → 하나씩 닫아도 마지막에 풀림
//   ⑦ 바깥 스크립트가 body 에 overflow: hidden 을 걸어도 머리줄 제자리(styles.css body 막이) ⑧ PC — 잠가도 화면 폭 그대로 ⑨ 오류 0
//   가상 자료만 씀(별명 · 글 지어냄) · 인터넷 안 부름.
import { createRequire } from 'module'
const require = createRequire(process.env.PW || '/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const 주소 = process.argv[2] || 'http://127.0.0.1:5803'
const C = process.env.C || ''
let 통과 = 0, 실패 = 0
const 봄 = (참, 무엇, 더 = '') => { if (참) { 통과++; console.log('  ✓', 무엇) } else { 실패++; console.log('  ✗', 무엇, typeof 더 === 'string' ? 더 : JSON.stringify(더)) } }

const H = 3600e3, 지금 = Date.now()
const 키 = (n) => '-P9zz' + String(n).padStart(15, '0')
const 씨앗 = { qna: {}, qna_a: {}, qna_del: {}, qna_top: {}, qna_like: {}, qna_view: {} }
const 글들 = [[1, '가상 지난 글 하나입니다', 70], [2, '가상 지난 글 둘입니다', 60], [3, '가상 현장 이야기 하나', 20], [4, '가상 유용히 쓰겠습니다 고맙습니다', 18],
  [5, '가상 기성 서류는 무엇이 필요한가요?', 9], [6, '가상 오늘 타설 끝났습니다', 10], [7, '가상 거푸집 해체 했어요', 14], [8, '가상 철근 들어왔습니다', 15]]
for (const [n, t, h] of 글들) 씨앗.qna[키(n)] = { t: `[후기·건의] ${t}`, b: '가상 내용입니다', nick: `가상 별명${n}`, uid: 'u' + n, at: 지금 - h * H }
for (let n = 20; n < 60; n++) 씨앗.qna[키(n)] = { t: `[후기·건의] 가상 예전 글 ${n}번`, b: '', nick: `가상 별명${n}`, uid: 'u' + n, at: 지금 - (40 + n * 7) * H }
씨앗.qna_a[키(3)] = { a1: { b: '가상 답글입니다', nick: '가상 별명90', uid: 'u90', at: 지금 - 19 * H } }

const 브 = await chromium.launch()
async function 새판(폰) {
  const 판 = await 브.newContext(폰
    ? { viewport: { width: 393, height: 852 }, deviceScaleFactor: C ? 3 : 1, isMobile: true, hasTouch: true, colorScheme: 'dark', locale: 'ko-KR', timezoneId: 'Asia/Seoul',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1' }
    : { viewport: { width: 1280, height: 900 }, locale: 'ko-KR', timezoneId: 'Asia/Seoul',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36' })   /* 머리 없는 크롬(Headless) 글이 있으면 로봇으로 봐 공지창이 안 뜸 */
  await 판.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|googlesyndication|geojs|daumcdn|kakao|coupang/, (r) => r.fulfill({ status: 200, body: '' }))
  await 판.addInitScript(([s]) => {
    Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false })   /* 공지창이 저절로 뜨게(G552 — 자동 브라우저엔 안 뜸) */
    if (!sessionStorage.getItem('씨앗됨')) { localStorage.setItem('mockdb', JSON.stringify(s)); localStorage.setItem('mockuid', 'mockme'); sessionStorage.setItem('씨앗됨', '1') }
  }, [씨앗])
  const p = await 판.newPage()
  const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e).slice(0, 160)))
  return { 판, p, 오류 }
}
const 상태 = (p) => p.evaluate(() => {
  const r = (q) => { const e = document.querySelector(q); if (!e) return null; const b = e.getBoundingClientRect(); return { t: Math.round(b.top), b: Math.round(b.bottom), h: Math.round(b.height) } }
  return { html: document.documentElement.style.overflow, 막대자리: document.documentElement.style.scrollbarGutter, body: document.body.style.overflow,
    bodyY: getComputedStyle(document.body).overflowY, 굴림: Math.round(scrollY), 높이: innerHeight, 머리: r('.topbar'), 공지: r('.noticepop-c'), 창: r('.mt-sheet'), 커서: document.activeElement ? document.activeElement.tagName + (document.activeElement.closest('.mt-sheet') ? '@창' : '') : '' }
})
/* 🛠 G792 점검 날(11-21 · 11-22)엔 점검창 · 공지창이 차례로 뜸 — 다 닫기(터치 · 마우스) */
const 다닫기 = async (p, 터치 = true) => { for (let i = 0; i < 4; i++) { const e = await p.$('.noticepop-f .btn.line'); if (!e) break; if (터치) await e.tap(); else await e.click(); await p.waitForTimeout(400) } }
const 화면안 = (x, 높이) => !!x && x.t >= -1 && x.b <= 높이 + 1 && x.h > 120
/* 앱을 30초 넘게 떠났다가 돌아옴 흉내(G786b) — 시계를 31초 당기고 visibilitychange 두 번 */
const 떠났다옴 = (p) => p.evaluate(() => {
  const 원 = Date.now.bind(Date); let 더 = 0
  Date.now = () => 원() + 더
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => true })
  document.dispatchEvent(new Event('visibilitychange'))
  더 = 31000
  try { localStorage.setItem('kcm_notice_alive', '0') } catch (e) { /* */ }
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => false })
  document.dispatchEvent(new Event('visibilitychange'))
})

console.log('■ 폰 393 (아이폰 흉내 · 터치 · 어두운 화면)')
{
  const { 판, p, 오류 } = await 새판(true)
  await p.goto(주소 + '/qna', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('article.mt-card', { timeout: 25000 }); await p.waitForSelector('.noticepop-c', { timeout: 8000 }).catch(() => {}); await p.waitForTimeout(800)
  let s = await 상태(p)
  봄(화면안(s.공지, s.높이) && s.html === 'hidden' && s.body === '' && s.bodyY === 'visible', '① 들어오면 공지창 — 화면 안 · html 잠김 · body 그대로(스크롤 상자 아님)', s)
  await p.evaluate(() => window.scrollTo(0, 2200)); await p.waitForTimeout(300)
  s = await 상태(p)
  봄(s.머리 && s.머리.t === 0 && 화면안(s.공지, s.높이), '② 창이 열린 채 굴려도 머리줄 제자리 · 공지창 화면 안', s)
  await 다닫기(p)
  s = await 상태(p)
  봄(!s.공지 && s.html === '' && s.막대자리 === '' && s.body === '', '③ 닫으면 html 풂', s)
  /* 카드 하나를 눌러 글 창 */
  const 카드 = p.locator('article.mt-card .mt-say').first()
  await 카드.scrollIntoViewIfNeeded(); await p.waitForTimeout(300)
  const 자리 = await p.evaluate(() => { const r = document.querySelector('article.mt-card .mt-say').getBoundingClientRect(); return [Math.round(r.left + 20), Math.round(r.top + r.height / 2)] })
  await p.touchscreen.tap(자리[0], 자리[1]); await p.waitForTimeout(900)
  s = await 상태(p)
  봄(화면안(s.창, s.높이) && s.머리 && s.머리.t === 0 && s.굴림 > 300, '③ 내린 자리에서 카드 누름 → 글 창이 화면 안 · 머리줄 제자리', s)
  if (C) await p.screenshot({ path: `${C}/G791_폰_글창.png` })
  await p.tap('.mt-sheet .mt-x'); await p.waitForTimeout(500)
  s = await 상태(p)
  봄(!s.창, '③ 글 창 ✕ 로 닫힘', s)
  /* ④ 내린 자리에서 앱으로 돌아옴 → 공지창 다시 */
  await 떠났다옴(p); await p.waitForTimeout(700)
  s = await 상태(p)
  봄(화면안(s.공지, s.높이) && s.html === 'hidden' && s.body === '' && s.머리 && s.머리.t === 0 && s.굴림 > 300, '④ 내린 채 앱으로 돌아옴 → 공지창이 화면 안(맨 위에 숨지 않음) · 머리줄 제자리', s)
  if (C) await p.screenshot({ path: `${C}/G791_폰_돌아옴_공지창.png` })
  await 다닫기(p)
  s = await 상태(p)
  봄(!s.공지 && s.html === '', '④ 닫으면 풂', s)
  /* ⑤ 답 없는 질문 카드 «답하기» */
  const 답하기 = p.locator('article.mt-card .mt-ask').first()
  if (await 답하기.count()) {
    await 답하기.scrollIntoViewIfNeeded(); await 답하기.tap(); await p.waitForTimeout(1300)
    s = await 상태(p)
    봄(화면안(s.창, s.높이) && s.커서 === 'TEXTAREA@창', '⑤ «답하기» → 글 창이 화면 안 · 답글 칸에 커서', s)
    await p.tap('.mt-sheet .mt-x'); await p.waitForTimeout(500)
  } else 봄(false, '⑤ «답하기» 카드가 있어야 함')
  /* ⑥ 빠른 찾기 위에 공지창 — 겹침 */
  await p.evaluate(() => window.scrollTo(0, 1500)); await p.waitForTimeout(200)
  await p.tap('.qsbtn'); await p.waitForTimeout(600)
  s = await 상태(p)
  const 찾기열림 = await p.evaluate(() => !!document.querySelector('.qs-back'))
  봄(찾기열림 && s.html === 'hidden', '⑥ 빠른 찾기 — html 잠김', s)
  await 떠났다옴(p); await p.waitForTimeout(700)
  s = await 상태(p)
  봄(화면안(s.공지, s.높이) && s.html === 'hidden', '⑥ 빠른 찾기 위에 공지창 — 화면 안', s)
  for (let i = 0; i < 3 && (await p.$('.noticepop')); i++) { await p.keyboard.press('Escape'); await p.waitForTimeout(400) }   /* 공지창(점검 날엔 점검창도)만 Esc */
  s = await 상태(p)
  const 찾기남음 = await p.evaluate(() => !!document.querySelector('.qs-back'))
  봄(!s.공지 && 찾기남음 && s.html === 'hidden', '⑥ 공지창 먼저 닫음 — 빠른 찾기가 열려 있어 아직 잠김', s)
  await p.focus('.qs-in'); await p.keyboard.press('Escape'); await p.waitForTimeout(400)   /* 빠른 찾기는 글칸에서 Esc */
  s = await 상태(p)
  const 찾기닫힘 = await p.evaluate(() => !document.querySelector('.qs-back'))
  봄(찾기닫힘 && s.html === '' && s.body === '', '⑥ 빠른 찾기도 닫음 — 다 풀림(잠금이 남지 않음)', s)
  /* ⑦ 바깥 스크립트가 body 에 잠금을 걸어도 */
  await p.evaluate(() => { document.body.style.overflow = 'hidden'; window.scrollTo(0, 1800) }); await p.waitForTimeout(300)
  s = await 상태(p)
  봄(s.bodyY === 'visible' && s.머리 && s.머리.t === 0, '⑦ body 에 overflow: hidden 을 걸어도 body 는 스크롤 상자가 안 됨 · 머리줄 제자리(styles.css 막이)', s)
  await p.evaluate(() => { document.body.style.overflow = '' })
  봄(!오류.length, '⑨ 폰 오류 0', 오류.join(' | '))
  await 판.close()
}

console.log('■ PC 1280')
{
  const { 판, p, 오류 } = await 새판(false)
  await p.goto(주소 + '/qna', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('article.mt-card', { timeout: 25000 }); await p.waitForSelector('.noticepop-c', { timeout: 8000 }).catch(() => {}); await p.waitForTimeout(800)
  let s = await 상태(p)
  봄(화면안(s.공지, s.높이) && s.html === 'hidden' && s.body === '', '① PC 공지창 — 화면 안 · html 잠김', s)
  await 다닫기(p, false)
  const 폭0 = await p.evaluate(() => [innerWidth - document.documentElement.clientWidth, document.querySelector('.topbar').getBoundingClientRect().width])
  await p.click('.qsbtn'); await p.waitForTimeout(500)
  const 폭1 = await p.evaluate(() => [innerWidth - document.documentElement.clientWidth, document.querySelector('.topbar').getBoundingClientRect().width, document.documentElement.style.overflow, document.documentElement.style.scrollbarGutter])
  봄(폭1[2] === 'hidden' && Math.abs(폭0[1] - 폭1[1]) < 0.5 && (폭0[0] === 0 || 폭1[3] === 'stable'), `⑧ 잠가도 화면 폭 그대로(막대 ${폭0[0]}px · ${폭1[3] || '막대 자리 안 씀'})`, { 폭0, 폭1 })
  await p.keyboard.press('Escape'); await p.waitForTimeout(300)
  s = await 상태(p)
  봄(s.html === '' && s.막대자리 === '', '⑧ 닫으면 풂', s)
  /* 카드 누르면 옆 창 */
  await p.locator('article.mt-card .mt-say').first().click(); await p.waitForTimeout(700)
  s = await 상태(p)
  봄(!!s.창 && s.창.t >= -1, '③ PC 카드 → 옆 글 창', s)
  봄(!오류.length, '⑨ PC 오류 0', 오류.join(' | '))
  await 판.close()
}
console.log('■ PC 1280 · 자리 차지하는 스크롤 막대(윈도처럼 15px)')
{
  const 브2 = await chromium.launch({ ignoreDefaultArgs: ['--hide-scrollbars'] })
  const 판 = await 브2.newContext({ viewport: { width: 1280, height: 900 }, userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36' })
  await 판.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|googlesyndication|geojs|daumcdn|kakao|coupang/, (r) => r.fulfill({ status: 200, body: '' }))
  await 판.addInitScript(([s]) => { if (!sessionStorage.getItem('씨앗됨')) { localStorage.setItem('mockdb', JSON.stringify(s)); sessionStorage.setItem('씨앗됨', '1') } }, [씨앗])
  const p = await 판.newPage()
  await p.goto(주소 + '/qna', { waitUntil: 'domcontentloaded' }); await p.waitForSelector('article.mt-card', { timeout: 25000 }); await p.waitForTimeout(600)
  const 잼 = () => p.evaluate(() => [innerWidth - document.documentElement.clientWidth, Math.round(document.querySelector('.topbar').getBoundingClientRect().width * 10) / 10, Math.round(scrollY)])
  await p.evaluate(() => window.scrollTo(0, 900)); await p.waitForTimeout(200)
  const 전 = await 잼()
  await p.click('.qsbtn'); await p.waitForTimeout(500)
  const 중 = await 잼()
  await p.mouse.wheel(0, 800); await p.waitForTimeout(400)
  const 굴림뒤 = await 잼()
  await p.focus('.qs-in'); await p.keyboard.press('Escape'); await p.waitForTimeout(400)
  const 뒤 = await 잼()
  봄(전[0] > 0, `⑧ 막대가 자리를 차지함(${전[0]}px) — 이 판에서만 볼 수 있음`, 전)
  봄(중[1] === 전[1] && 뒤[1] === 전[1], '⑧ 빠른 찾기를 열고 닫아도 머리줄 폭 그대로(화면이 옆으로 안 밀림)', { 전, 중, 뒤 })
  봄(굴림뒤[2] === 중[2], '⑧ 창이 열린 동안 바퀴로 뒤 화면이 안 굴러감(옛 body 잠금은 굴러갔음)', { 중, 굴림뒤 })
  await 브2.close()
}
await 브.close()
console.log(`\n${실패 ? '❌' : '✅'} 굴림잠금 화면 ${통과}/${통과 + 실패}`)
process.exit(실패 ? 1 : 0)
