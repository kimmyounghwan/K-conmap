/**
 * 🩹 G758 «흰 화면 지킴 2» 화면 시험 (2026-11-18) — 진짜 브라우저(Playwright) · 아이폰 크기 402 × 874
 *   node tools/시험_흰화면2.mjs [주소=http://127.0.0.1:5005]
 *   (클라우드에서만 — 굽은 사이트 시험 서버가 있어야 함 · PC 올리기 시험 목록엔 시험_흰화면지킴2.mjs 를 넣음)
 *   ① 보통 — 화면이 뜨면 window.__KCM_OK · 상자 없음 · 새로 열지 않음(20초 지켜봄)
 *   ② 묶음이 깨짐(받기는 됨 · 돌지 못함) — 12초 뒤 묶음을 «cache: reload» 로 새로 받고 한 번만 다시 엶 →
 *      또 깨져 있으면 흰 화면 대신 «화면을 띄우지 못했습니다 · 🔄 다시 열기» 상자 + 오류 글 · 더는 저절로 안 엶 · 숫자 칸 «|흰화면|…» 셈
 *   ③ «다시 열기» 를 누르면 → 묶음을 새로 받고 다시 엶 → (이번엔 고쳐진 묶음) 화면이 뜨고 상자 없음
 *   ④ 느린 망 — 묶음이 20초 걸려도 받는 중에는 새로 열지 않음 · 받은 뒤 화면이 뜨고 상자 없음
 *   ⑤ 화면 오류(pageerror) — ① · ④ 에서 없음
 */
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const 주소 = process.argv[2] || 'http://127.0.0.1:5005'
let 통과 = 0, 실패 = 0
const 봄 = (이름, 참, 더 = '') => { if (참) { 통과++; console.log('  ✓', 이름, 더) } else { 실패++; console.log('  ✗', 이름, 더) } }
const 쉼 = (ms) => new Promise((r) => setTimeout(r, ms))
const 아이폰 = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1'

const 브 = await chromium.launch()
async function 판({ 묶음 = 'ok' } = {}) {
  const c = await 브.newContext({ viewport: { width: 402, height: 874 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, locale: 'ko-KR', userAgent: 아이폰 })
  const 상 = { 묶음, 셈: [], 묶음받음: 0, 새로받음: 0 }
  await c.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|geojs|coupang|daumcdn|kakao/, (r) => r.fulfill({ status: 200, body: '' }))
  /* 숫자 칸(dl/p) — 셈 요청만 적고 0 을 돌려줌 */
  await c.route(/firebaseio\.com/, (r) => {
    const u = r.request().url()
    if (/\/dl\/p\//.test(u)) { 상.셈.push(r.request().method() + ' ' + decodeURIComponent(u.split('/dl/p/')[1] || '').replace(/\.json.*$/, '')) ; return r.fulfill({ status: 200, contentType: 'application/json', headers: { ETag: 'x' }, body: '0' }) }
    return r.fulfill({ status: 200, contentType: 'application/json', body: 'null' })
  })
  /* 큰 묶음(index-*.js) — 깨짐 · 느림 흉내 */
  await c.route(/\/assets\/index-[^/]+\.js(\?|$)/, async (r) => {
    상.묶음받음++
    if (r.request().resourceType() === 'fetch') 상.새로받음++          // index.html 이 «cache: reload» 로 새로 받는 것
    if (상.묶음 === 'broken') return r.fulfill({ status: 200, contentType: 'text/javascript', body: 'export const 깨짐 = (' })
    if (상.묶음 === 'slow') { await 쉼(20000); return r.continue() }
    return r.continue()
  })
  /* 문서가 새로 열릴 때마다 하나(같은 탭 sessionStorage) — framenavigated 는 주소만 바꾸는 것(replaceState)에도 울려 못 씀 */
  await c.addInitScript(() => { try { sessionStorage.setItem('시험_열림', String((Number(sessionStorage.getItem('시험_열림')) || 0) + 1)) } catch (e) { /* 없음 */ } })
  const p = await c.newPage()
  const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e).slice(0, 160)))
  const 열림 = { get length() { return 열림.값 }, 값: 0 }
  const 셈 = async () => { try { 열림.값 = Number(await p.evaluate(() => sessionStorage.getItem('시험_열림'))) || 0 } catch (e) { /* 여는 중 */ } return 열림.값 }
  return { c, p, 오류, 열림, 상, 셈 }
}

console.log('① 보통')
{
  const { c, p, 오류, 열림, 셈 } = await 판()
  await p.goto(주소 + '/', { waitUntil: 'domcontentloaded' })
  await 쉼(20000); await 셈()
  봄('뜸 표(__KCM_OK)', await p.evaluate(() => window.__KCM_OK === 1))
  봄('상자 없음', (await p.locator('#kcm-boot-box').count()) === 0)
  봄('새로 열지 않음', 열림.length === 1, `열림 ${열림.length}`)
  봄('화면 그려짐', (await p.evaluate(() => (document.getElementById('root').innerText || '').length)) > 200)
  봄('화면 오류 없음', 오류.length === 0, 오류.join(' | '))
  await c.close()
}

console.log('② 묶음 깨짐 → 한 번 새로 받아 다시 엶 → 그래도 깨짐 → 상자')
let 둘
{
  둘 = await 판({ 묶음: 'broken' })
  const { p, 열림, 상, 셈 } = 둘
  await p.goto(주소 + '/', { waitUntil: 'domcontentloaded' })
  await 쉼(9000); await 셈()
  봄('12초 전엔 아무것도 안 함', 열림.length === 1 && (await p.locator('#kcm-boot-box').count()) === 0)
  await 쉼(9000); await 셈()
  봄('한 번 새로 엶', 열림.length === 2, `열림 ${열림.length}`)
  봄('묶음을 새로 받음(cache: reload)', 상.새로받음 >= 1, `새로받음 ${상.새로받음} · 받음 ${상.묶음받음}`)
  await 쉼(16000); await 셈()
  const 상자 = p.locator('#kcm-boot-box')
  봄('상자 보임', (await 상자.count()) === 1 && (await 상자.isVisible()))
  const 글 = (await 상자.innerText().catch(() => '')).replace(/\s+/g, ' ')
  봄('상자 글', /화면을 띄우지 못했습니다/.test(글) && /다시 열기/.test(글), 글.slice(0, 120))
  봄('오류 글 앞부분이 적힘', /깨짐|Unexpected|SyntaxError|token|end of input/i.test(글), 글.slice(-80))
  봄('더는 저절로 안 엶', 열림.length === 2, `열림 ${열림.length}`)
  봄('숫자 칸 셈(새로받기 · 상자)', 상.셈.some((s) => /^PUT \|흰화면\|새로받기-i웹-/.test(s)) && 상.셈.some((s) => /^PUT \|흰화면\|상자-i웹-/.test(s)), 상.셈.filter((s) => /^PUT/.test(s)).join(' / ').slice(0, 200))
  봄('셈 열쇠 꼴(| 두 마디 · 80자 · . / 없음)', 상.셈.every((s) => { const k = s.replace(/^\w+ /, ''); return /^[|][^|]+[|][^|./#$[\]]+$/.test(k) && k.length <= 80 }))
}

console.log('③ «다시 열기» → 고쳐진 묶음으로 뜸')
{
  const { c, p, 열림, 상, 오류, 셈 } = 둘
  상.묶음 = 'ok'
  const 전 = await 셈()
  await p.locator('#kcm-boot-box button').click()
  await 쉼(8000); await 셈()
  봄('다시 엶', 열림.length === 전 + 1, `열림 ${열림.length}`)
  봄('뜸 표', await p.evaluate(() => window.__KCM_OK === 1))
  봄('상자 사라짐', (await p.locator('#kcm-boot-box').count()) === 0)
  봄('표 지움(kcm_boot_fix)', await p.evaluate(() => sessionStorage.getItem('kcm_boot_fix') === null))
  void 오류
  await c.close()
}

console.log('④ 느린 망 — 받는 중에는 새로 열지 않음')
{
  const { c, p, 오류, 열림, 셈 } = await 판({ 묶음: 'slow' })
  await p.goto(주소 + '/', { waitUntil: 'commit' })
  await 쉼(30000); await 셈()
  봄('새로 열지 않음', 열림.length === 1, `열림 ${열림.length}`)
  봄('뜸 표', await p.evaluate(() => window.__KCM_OK === 1))
  봄('상자 없음', (await p.locator('#kcm-boot-box').count()) === 0)
  봄('화면 오류 없음', 오류.length === 0, 오류.join(' | '))
  await c.close()
}

await 브.close()
console.log(`\n시험_흰화면2: ${통과}개 통과 · ${실패}개 실패`)
process.exit(실패 ? 1 : 0)
