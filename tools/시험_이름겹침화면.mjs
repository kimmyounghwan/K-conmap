// 🧩 다른 도구끼리 CSS 이름이 겹쳐 틀어졌던 화면 — 제 모양으로 돌아왔는지 (2026-11-17 G737)
//   빌드를 띄운 뒤  B=http://127.0.0.1:4999 node tools/시험_이름겹침화면.mjs   (PLAYWRIGHT · PC bat 에서는 안 돌림)
//   안전카드(10-22)가 sc-chips · sc-list · sc-row · sc-ok · sc-head · sc-sub 를 지어, 먼저 있던 두 도구가 틀어졌음:
//   ① 사진 → 캐드(G287) 🧪 예시 → 조절 줄(.sc-row) — 회색 굵은 왼쪽 띠 · 아랫줄 없음 · 가운데 맞춤 · 사이 8px 12px · 위 10px(제 모양)
//   ② 용역 바로투찰 계산기(공고 주소로 열기) — 공고 머리 칸(.sc-head)은 위아래로 쌓임(옆으로 벌어지지 않음) · 기관 줄(.sc-sub) 굵지 않음
//   ③ 용역 바로투찰 계산기(직접) — 공고 목록(.sc-list)은 테 · 460px 상자 없이 · 고를 공고 3개 보임
//   ④ 안전카드는 sfc- 로 — 문장 줄(.sfc-row) 색 띠 · 고르기 목록(.sfc-list) 상자 · 말 고르기(.sfc-chips) 그대로 · 옛 이름(sc-row …) 없음
//   ⑤ 화면 오류 0
import { createRequire } from 'module'
const require = createRequire(process.env.PW || '/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const 주소 = process.env.B || 'http://127.0.0.1:4999'
let ok = 0, bad = 0
const 봐 = (c, m, 더 = '') => { if (c) ok++; else bad++; console.log(c ? '  ✓' : '  ✗', m, c ? '' : String(typeof 더 === 'string' ? 더 : JSON.stringify(더)).slice(0, 500)) }
const 브 = await chromium.launch()
const 오류 = []
/* 가상 공고(실제 공사명 · 기관 없음) — 용역 목록 */
const 가짜목록 = [1, 2, 3].map((i) => ({ no: `TEST-S${i}`, ord: '000', name: `○○ 가상 용역 ${i}(시험)`, inst: '가상기관', base: 100000000 + i * 1000000, llr: 87.745, lo: -2, hi: 2, close: `2099-12-${10 + i} 10:00:00`, pmth: '복수예가', swin: '' }))
async function 새판(폭 = 1280) {
  const 폰 = 폭 < 600
  const c = await 브.newContext({ viewport: { width: 폭, height: 900 }, isMobile: 폰, hasTouch: 폰, locale: 'ko-KR' })
  await c.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|geojs|firebaseio|coupang|daumcdn|kakao/, (r) => r.fulfill({ status: 200, body: '' }))
  await c.route(/\/data\/board\/svc-live-[^/]*-0\.json/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(가짜목록) }))
  await c.addInitScript(() => { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); try { sessionStorage.setItem('kcm_notice_seen', '2026-10-업체') } catch (e) {} })
  const p = await c.newPage(); p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
  return { c, p }
}
const 누름 = (p, 글) => p.evaluate((s) => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.includes(s) && x.offsetParent !== null); if (b) { b.click(); return true } return false }, 글)
const 꼴 = (p, sel, 속) => p.evaluate(([sel, 속]) => [...document.querySelectorAll(sel)].map((e) => { const s = getComputedStyle(e); return Object.fromEntries(속.map((k) => [k, s.getPropertyValue(k)])) }), [sel, 속])

for (const 폭 of [1280, 390]) {
  console.log(`■ ${폭}`)
  /* ① 사진 → 캐드 */
  {
    const { c, p } = await 새판(폭)
    await p.goto(주소 + '/tools/sajincad', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(3000)
    봐(await 누름(p, '예시로 해 보기'), '① 사진 → 캐드 🧪 예시로 해 보기')
    await p.waitForSelector('.sc-row', { timeout: 20000 }).catch(() => {})
    const R = await 꼴(p, '.sc-row', ['border-left-width', 'border-bottom-width', 'align-items', 'row-gap', 'column-gap', 'margin-top', 'padding-left'])
    봐(R.length >= 2, '① 조절 줄(.sc-row) 보임', R.length)
    봐(R.length && R.every((x) => x['border-left-width'] === '0px' && x['border-bottom-width'] === '0px' && x['padding-left'] === '0px'), '① 회색 왼쪽 띠 · 아랫줄 · 안 여백 없음(전엔 5px 띠 · 1px 줄)', R.slice(0, 2))
    봐(R.length && R.every((x) => x['align-items'] === 'center' && x['row-gap'] === '8px' && x['column-gap'] === '12px' && x['margin-top'] === '10px'), '① 가운데 맞춤 · 사이 8px 12px · 위 10px(제 모양)', R.slice(0, 2))
    await c.close()
  }
  /* ② 용역 계산기 — 공고 주소 */
  {
    const { c, p } = await 새판(폭)
    const q = new URLSearchParams({ no: 'TEST-S9', ord: '000', n: '○○ 가상 용역(시험)', i: '가상기관', b: '100000000', l: '87.745', lo: '-2', hi: '2', c: '2099-12-31 10:00:00', pm: '복수예가' })
    await p.goto(주소 + '/svc/calc?' + q.toString(), { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(3000)
    const H = await 꼴(p, '.sc-head', ['display', 'justify-content'])
    const S = await 꼴(p, '.sc-head .sc-sub', ['font-weight', 'margin-bottom', 'font-size'])
    봐(H.length === 1 && H[0].display === 'block', '② 공고 머리 칸(.sc-head) 위아래로 쌓임(전엔 flex · 옆으로 벌어짐)', H)
    봐(S.length === 1 && S[0]['font-weight'] === '400' && S[0]['margin-bottom'] === '0px' && S[0]['font-size'] === '12.5px', '② 기관 · 마감 줄(.sc-sub) 굵지 않음 · 아래 여백 없음', S)
    const 이름 = await p.evaluate(() => { const n = document.querySelector('.sc-head .sc-name'), s = document.querySelector('.sc-head .sc-sub'); if (!n || !s) return null; return n.getBoundingClientRect().bottom <= s.getBoundingClientRect().top + 1 })
    봐(이름 === true, '② 공고명 아래에 기관 줄(옆이 아님)', 이름)
    await c.close()
  }
  /* ③ 용역 계산기 — 직접(목록) */
  {
    const { c, p } = await 새판(폭)
    await p.goto(주소 + '/svc/calc', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(3000)
    const L = await 꼴(p, '.sc-list', ['border-top-width', 'max-height', 'overflow-y', 'display', 'flex-direction', 'row-gap'])
    const n = await p.evaluate(() => document.querySelectorAll('.sc-list .sc-item').length)
    봐(L.length === 1 && n === 3, '③ 고를 공고 3개(가상)', [L.length, n])
    봐(L.length === 1 && L[0]['border-top-width'] === '0px' && L[0]['max-height'] === 'none' && L[0]['overflow-y'] === 'visible', '③ 목록에 테 · 460px 상자 없음(전엔 테 + 스크롤 상자)', L)
    봐(L.length === 1 && L[0].display === 'flex' && L[0]['flex-direction'] === 'column' && L[0]['row-gap'] === '6px', '③ 세로 · 사이 6px(제 모양)', L)
    const C = await 꼴(p, '.sc-chips', ['display', 'margin-top'])
    봐(C.length >= 1 && C.every((x) => x.display === 'flex' && x['margin-top'] === '4px'), '③ 예가 범위 칩 줄 그대로(flex · 위 4px)', C)
    await c.close()
  }
  /* ④ 안전카드 */
  {
    const { c, p } = await 새판(폭)
    await p.goto(주소 + '/tools/safecard', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(3000)
    await 누름(p, '추천 넣기'); await p.waitForTimeout(1200)
    const 옛 = await p.evaluate(() => document.querySelectorAll('.sc-row, .sc-list, .sc-chips, .sc-ok, .sc-head, .sc-sub').length)
    봐(옛 === 0, '④ 안전카드에 옛 이름(sc-row · sc-list …) 없음', 옛)
    const R = await 꼴(p, '.sfc-row', ['border-left-width', 'border-bottom-width', 'align-items', 'margin-top', 'flex-wrap'])
    봐(R.length >= 3 && R.every((x) => x['border-left-width'] === '5px' && x['border-bottom-width'] === '1px' && x['align-items'] === 'flex-start' && x['margin-top'] === '10px' && x['flex-wrap'] === 'wrap'), '④ 문장 줄(.sfc-row) 색 띠 5px · 아랫줄 · 위 10px 그대로', [R.length, R[0]])
    const L = await 꼴(p, '.sfc-list', ['border-top-width', 'max-height', 'display', 'row-gap'])
    봐(L.length === 1 && L[0]['border-top-width'] === '1px' && L[0]['max-height'] === '460px' && L[0].display === 'flex' && L[0]['row-gap'] === '6px', '④ 고르기 목록(.sfc-list) 상자 그대로', L)
    const C = await 꼴(p, '.sfc-chips', ['flex-wrap', 'margin-top'])
    봐(C.length >= 2 && C.every((x) => x['flex-wrap'] === 'wrap' && x['margin-top'] === '4px'), '④ 말 고르기 · 분류 칩(.sfc-chips) 그대로', C)
    const H = await 꼴(p, '.sfc-head', ['display', 'justify-content'])
    봐(H.length >= 2 && H.every((x) => x.display === 'flex' && x['justify-content'] === 'space-between'), '④ 칸 머리(.sfc-head) 그대로', H)
    await c.close()
  }
}
봐(오류.length === 0, '⑤ 화면 오류 0', 오류)
await 브.close()
console.log(bad ? `❌ 시험_이름겹침화면 ${ok}/${ok + bad}` : `✓ 시험_이름겹침화면 ${ok}/${ok}`)
process.exit(bad ? 1 : 0)
