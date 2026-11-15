/**
 * 📝 G688 블로그에서 온 사람 세기 — 화면 시험(클라우드 · 빌드한 dist · 쓰는 법: B=http://127.0.0.1:4688 node tools/시험_블로그셈화면.mjs)
 *   ① ?b=n3 → 주소에서 b 뗌 · 화면 그대로 · |블로그|네이버 · |블로그글|n3 셈 ② 새로 고침 → 다시 안 셈 ③ ?m=1&b=g2 → 2줄 → 1줄 쪽 그대로 · 구글 · g2
 *   ④ 네이버 블로그에서 옴(꼬리 없음) → 네이버만 · 주소 그대로 ⑤ 소장님 브라우저 · 로봇 → 안 셈(꼬리는 뗌) ⑥ 그냥 들어옴 → 블로그 셈 없음 ⑦ 오류 0 · 폰 · PC
 */
import { createRequire } from 'module'
const require = createRequire('/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const 주소 = process.env.B || 'http://127.0.0.1:4688'
let ok = 0, bad = 0
const 봐 = (c, m, 더 = '') => { if (c) ok++; else bad++; console.log(c ? '✓' : '✗', m, c ? '' : String(더).slice(0, 300)) }
const 브 = await chromium.launch({ env: { ...process.env, LANG: 'C.UTF-8', LC_ALL: 'C.UTF-8' } })
const 사람 = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'
const 판짓기 = async (폭, { 운영자 = false, ua = 사람 } = {}) => {
  const 판 = await 브.newContext({ viewport: { width: 폭, height: 900 }, locale: 'ko-KR', userAgent: ua })
  await 판.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|geojs|kakaocdn|coupang/, (r) => r.fulfill({ status: 200, body: '' }))
  const 셈 = []
  await 판.route(/firebaseio\.com/, (r) => {
    const q = r.request()
    if (q.method() !== 'GET') 셈.push(decodeURIComponent(q.url()))
    r.fulfill({ status: 200, contentType: 'application/json', body: 'null' })
  })
  await 판.addInitScript((op) => {
    localStorage.setItem('kcm_notice_seen', '2026-10-필독'); try { sessionStorage.setItem('kcm_notice_seen', '2026-10-업체') } catch (e) {}
    if (op) localStorage.setItem('kcm_op', '1')
    if (!/HeadlessChrome/.test(navigator.userAgent)) Object.defineProperty(navigator, 'webdriver', { get: () => false })
  }, 운영자)
  return { 판, 셈 }
}
const 블로그셈 = (셈) => 셈.filter((u) => /\/dl\/p\/\|블로그/.test(u)).map((u) => (/\/dl\/p\/([^?]+)\.json/.exec(u) || [])[1])
const 기다림 = (ms) => new Promise((r) => setTimeout(r, ms))

for (const [기기, 폭] of [['폰', 390], ['PC', 1280]]) {
  console.log(`— ${기기}`)
  const { 판, 셈 } = await 판짓기(폭)
  const A = await 판.newPage()
  const 오류 = []
  A.on('pageerror', (e) => 오류.push(String(e).slice(0, 160)))
  /* ① */
  await A.goto(주소 + '/tools?b=n3', { waitUntil: 'domcontentloaded' })
  await A.waitForSelector('h1', { timeout: 20000 }); await 기다림(1500)
  봐(new URL(A.url()).search === '' && new URL(A.url()).pathname === '/tools', `${기기} ?b=n3 → 주소 /tools(꼬리 뗌)`, A.url())
  봐(/건설 도구/.test(await A.locator('h1').first().innerText()), `${기기} 도구 화면 그대로`)
  const 첫 = 블로그셈(셈)
  봐(JSON.stringify(첫) === JSON.stringify(['|블로그|네이버', '|블로그글|n3']), `${기기} 셈 |블로그|네이버 · |블로그글|n3`, JSON.stringify(첫))
  /* ② */
  await A.reload({ waitUntil: 'domcontentloaded' }); await A.waitForSelector('h1', { timeout: 20000 }); await 기다림(1200)
  봐(블로그셈(셈).length === 2, `${기기} 새로 고침 → 다시 안 셈`, JSON.stringify(블로그셈(셈)))
  /* ③ 같은 탭 · 다른 글(구글 g2)에서 또 옴 — ?m=1 그대로 */
  await A.goto(주소 + '/change/twoline?m=1&b=g2', { waitUntil: 'domcontentloaded' })
  await A.waitForSelector('.tl1-ex', { timeout: 20000 }); await 기다림(1200)
  봐(new URL(A.url()).search === '?m=1', `${기기} ?m=1&b=g2 → ?m=1 만 남음`, A.url())
  봐(/2줄 → 1줄/.test(await A.locator('.tlmode button.on').innerText()), `${기기} 2줄 → 1줄 쪽이 그대로 열림`)
  봐(JSON.stringify(블로그셈(셈).slice(2)) === JSON.stringify(['|블로그|구글', '|블로그글|g2']), `${기기} 셈 |블로그|구글 · |블로그글|g2`, JSON.stringify(블로그셈(셈)))
  봐(오류.length === 0, `${기기} 화면 오류 없음`, 오류.join(' | '))
  await 판.close()

  /* ④ 네이버 블로그에서 옴 — 꼬리 없음 */
  const 넷 = await 판짓기(폭)
  const B = await 넷.판.newPage()
  await B.goto(주소 + '/forms', { waitUntil: 'domcontentloaded', referer: 'https://m.blog.naver.com/kconmap/223' })
  await B.waitForSelector('h1', { timeout: 20000 }); await 기다림(1500)
  봐(await B.evaluate(() => document.referrer) === 'https://m.blog.naver.com/kconmap/223', `${기기} (시험 확인) 들어온 곳이 네이버 블로그로 보임`, await B.evaluate(() => document.referrer))
  봐(JSON.stringify(블로그셈(넷.셈)) === JSON.stringify(['|블로그|네이버']) && new URL(B.url()).pathname === '/forms', `${기기} 네이버 블로그에서 옴 → |블로그|네이버 만 · 주소 그대로`, JSON.stringify(블로그셈(넷.셈)))
  await 넷.판.close()

  /* ⑤ 소장님 브라우저 · 로봇 → 안 셈 · 꼬리는 뗌 */
  for (const [이름, 설정] of [['소장님 브라우저', { 운영자: true }], ['로봇(HeadlessChrome)', { ua: 사람.replace('Chrome/', 'HeadlessChrome/') }]]) {
    const 다 = await 판짓기(폭, 설정)
    const C = await 다.판.newPage()
    await C.goto(주소 + '/?b=n7', { waitUntil: 'domcontentloaded' }); await 기다림(2500)
    봐(블로그셈(다.셈).length === 0 && new URL(C.url()).search === '', `${기기} ${이름} → 안 셈 · 꼬리는 뗌`, JSON.stringify([블로그셈(다.셈), C.url()]))
    await 다.판.close()
  }
  /* ⑥ 그냥 들어옴(검색 · 바로) → 블로그 셈 없음 */
  const 그냥 = await 판짓기(폭)
  const D = await 그냥.판.newPage()
  await D.goto(주소 + '/live', { waitUntil: 'domcontentloaded', referer: 'https://search.naver.com/search.naver?query=x' }); await 기다림(2000)
  봐(블로그셈(그냥.셈).length === 0, `${기기} 네이버 검색에서 옴 → 블로그 셈 없음`, JSON.stringify(블로그셈(그냥.셈)))
  await 그냥.판.close()
}
await 브.close()
console.log(bad ? `\n❌ 시험_블로그셈화면 ${ok}/${ok + bad}` : `\n✅ 시험_블로그셈화면 ${ok}/${ok}`)
process.exit(bad ? 1 : 0)
