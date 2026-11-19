/**
 * 📍 G781 한 줄 창 글에도 지역 — 맵톡 지도 핀 · 빼기 · 글쓰기 칸 방 이름 (2026-11-19 · 화면 시험 · 가짜 파이어베이스 판)
 *   소장님 「글을 쓰면 지역을 선택하고 날아가서 꽂히는 건데 … 꽂히는게 너무 없어? 왜 그러지?」 → 「그렇게 해」
 *   node tools/시험_한줄핀화면.mjs [주소=http://127.0.0.1:5784]   (굽기.sh 판 · Playwright · PC 올리기에서는 안 돌림)
 *   PC 1280 · 폰 390 마다(접속 위치는 가짜 «Yongin» · 진짜 데이터베이스 주소는 모두 막음):
 *   ① «💬 한 줄 남겨 주세요» 창 — «📍 용인시 (짐작) — 맵톡 지도에 핀이 꽂힙니다» · 올리면 글에 g(용인시 곳 번호)
 *   ② 다시 열어 «빼기» → «📍 지도에 핀 없이 올라갑니다» · 올리면 g 없음(자유) · 다시 열면 빼기가 풀려 있음
 *   ③ 맵톡 — 지도에 방금 글 핀 · 글쓰기 칸 «📍 용인시 (짐작) — 경기·인천 방에 올라가요»(전엔 짐작한 곳에 시·도가 없어 «자유 방» 으로 틀리게 보임)
 *   ④ 접속 위치를 못 받으면 자리 줄 없음 · 글은 그대로 올라감(g 없음) ⑤ 오류 0 · 폰 가로 넘침 0
 * 가상 글만 씀.
 */
import { createRequire } from 'module'
const require = createRequire('/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const 주소 = process.argv[2] || 'http://127.0.0.1:5784'
let ok = 0, bad = 0
const 봐 = (c, m, 더 = '') => { if (c) { ok++; console.log('  ✓', m) } else { bad++; console.log('  ✗', m, String(더).slice(0, 400)) } }
const 나 = 'mockuser781'
const 씨앗 = { qna: {}, qna_a: {}, qna_del: {}, qna_top: {} }
const 용인 = { country_code: 'KR', city: 'Yongin', region: 'Gyeonggi-do', latitude: '37.2411', longitude: '127.1776' }
const 브 = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] })
const 쉬어 = (ms) => new Promise((s) => setTimeout(s, ms))
for (const [기기, w, 폰] of [['PC 1280', 1280, false], ['폰 390', 390, true]]) {
  console.log(`■ ${기기}`)
  const 판 = await 브.newContext({ viewport: { width: w, height: 860 }, isMobile: 폰, hasTouch: 폰, locale: 'ko-KR', timezoneId: 'Asia/Seoul' })
  await 판.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|googlesyndication|daumcdn|kakao|coupang/, (r) => r.fulfill({ status: 200, body: '' }))
  let 위치되나 = true
  await 판.route(/get\.geojs\.io/, (r) => (위치되나 ? r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(용인) }) : r.abort()))
  await 판.route(/firebaseio\.com|googleapis\.com/, (r) => r.fulfill({ status: 503, body: 'down' }))
  await 판.addInitScript(([s, u]) => {
    if (!sessionStorage.getItem('씨앗됨')) { localStorage.setItem('mockdb', JSON.stringify(s)); sessionStorage.setItem('씨앗됨', '1') }
    localStorage.setItem('mockuid', u); localStorage.setItem('kcm_notice_seen', '2026-10-필독')
    try { sessionStorage.setItem('kcm_notice_seen', '2026-10-업체'); sessionStorage.setItem('kcm_since_shown', '1') } catch (e) { /* */ }
  }, [씨앗, 나])
  const A = await 판.newPage()
  const 오류 = []; A.on('pageerror', (e) => 오류.push(String(e).slice(0, 150)))
  const 디비 = () => A.evaluate(() => JSON.parse(localStorage.getItem('mockdb') || '{}'))
  const 글들 = async () => Object.values((await 디비()).qna || {}).sort((a, b) => (a.at || 0) - (b.at || 0))
  const 창열기 = async () => {
    await A.evaluate(() => { localStorage.removeItem('kcm_ask_hits'); sessionStorage.setItem('kcm_ask_now', 'forms') })
    await A.waitForSelector('.askbox textarea.askta', { timeout: 8000 })
  }
  const 올리기 = async (글) => {
    const 전 = (await 글들()).length
    await A.fill('.askbox textarea.askta', 글)
    await A.click('.askbox .askrow .btn.primary')
    await A.waitForFunction((n) => Object.keys((JSON.parse(localStorage.getItem('mockdb') || '{}').qna) || {}).length > n, 전, { timeout: 8000 }).catch(() => {})
    const 뒤 = await 글들()
    await A.keyboard.press('Escape'); await 쉬어(200)
    return 뒤.length > 전 ? 뒤[뒤.length - 1] : null
  }

  /* ① 핀 */
  await A.goto(주소 + '/forms', { waitUntil: 'domcontentloaded' }); await 쉬어(1200)
  await 창열기()
  await A.waitForSelector('.askbox .askplace', { timeout: 8000 }).catch(() => {})
  const 줄 = await A.locator('.askbox .askplace').innerText().catch(() => '')
  봐(/📍 용인시 \(짐작\) — 맵톡 지도에 핀이 꽂힙니다/.test(줄) && /빼기/.test(줄), '① 창에 «📍 용인시 (짐작) — 맵톡 지도에 핀이 꽂힙니다 · 빼기»', 줄)
  const g1 = await 올리기('가상 한 줄 남김 — 잘 쓰고 있습니다')
  봐(g1 && g1.g === '4146' && /^\[후기·건의\] 가상 한 줄 남김/.test(g1.t), '① 올리면 글에 g = 용인시(4146) — 맵톡 지도 핀', JSON.stringify(g1))
  /* ② 빼기 */
  await 창열기()
  await A.waitForSelector('.askbox .askplace button', { timeout: 8000 })
  await A.click('.askbox .askplace button'); await 쉬어(150)
  const 뺀줄 = await A.locator('.askbox .askplace').innerText()
  봐(/지도에 핀 없이 올라갑니다/.test(뺀줄) && /핀 넣기/.test(뺀줄), '② «빼기» → «📍 지도에 핀 없이 올라갑니다 · 핀 넣기»', 뺀줄)
  const g2 = await 올리기('가상 두 번째 한 줄 — 핀 없이')
  봐(g2 && !('g' in g2), '② 빼고 올리면 g 없음(자유 방)', JSON.stringify(g2))
  await 창열기()
  await A.waitForSelector('.askbox .askplace', { timeout: 8000 })
  봐(/맵톡 지도에 핀이 꽂힙니다/.test(await A.locator('.askbox .askplace').innerText()), '② 다시 열면 빼기가 풀려 있음(늘 핀이 기본)')
  await A.keyboard.press('Escape'); await 쉬어(200)
  /* ③ 맵톡 — 지도 핀 · 글쓰기 칸 방 이름 */
  await A.goto(주소 + '/qna', { waitUntil: 'domcontentloaded' })
  await A.waitForSelector('.mt-pin', { timeout: 15000 }).catch(() => {})
  await 쉬어(800)
  const 핀 = await A.locator('.mt-pin').count()
  봐(핀 >= 1, '③ 맵톡 지도에 방금 글 핀(한 줄 창 글)', String(핀))
  await A.waitForFunction(() => { const el = document.querySelector('.mt-place'); return el && /용인/.test(el.innerText) }, null, { timeout: 8000 }).catch(() => {})
  const 칸 = await A.locator('.mt-place').first().innerText().catch(() => '')
  봐(/📍 용인시/.test(칸) && /경기·인천 방에 올라가요/.test(칸) && !/자유 방에 올라가요/.test(칸), '③ 글쓰기 칸 «📍 용인시 — 경기·인천 방에 올라가요»(🩹 전엔 «자유 방» 으로 틀리게 보임)', 칸)
  /* ④ 위치를 못 받으면 */
  위치되나 = false
  await A.evaluate(() => { try { localStorage.removeItem('kcm.mt.곳') } catch (e) { /* */ } })
  await A.goto(주소 + '/forms', { waitUntil: 'domcontentloaded' }); await 쉬어(1000)
  await 창열기(); await 쉬어(1500)
  봐((await A.locator('.askbox .askplace').count()) === 0, '④ 접속 위치를 못 받으면 자리 줄 없음')
  const g4 = await 올리기('가상 세 번째 한 줄 — 위치 없음')
  봐(g4 && !('g' in g4), '④ 글은 그대로 올라감(g 없음)', JSON.stringify(g4))
  /* ⑤ */
  봐(오류.length === 0, '⑤ 오류 0', 오류.join(' | '))
  if (폰) 봐((await A.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0, '⑤ 폰 가로 넘침 0')
  await 판.close()
}
await 브.close()
console.log(`\n${bad ? '❌' : '✅'} 시험_한줄핀화면 ${ok}/${ok + bad}`)
process.exit(bad ? 1 : 0)
