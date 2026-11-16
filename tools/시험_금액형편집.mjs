// 💰 예정공정표 «금액형» 공종 편집 표 화면 시험 (2026-11-16 소장님 「공종을 늘리면 이상해져」)
//   빌드를 띄운 뒤  B=http://127.0.0.1:4734 node tools/시험_금액형편집.mjs [PC|폰|모두]   (PLAYWRIGHT: /tmp/g10/pw · PC bat 에서는 안 돌림)
//   ① 단계 고르기 칸 너비 88px 넘음(«◈ 대공종 · 1 공종 · 1.1 세부» 가 안 잘림 — 전엔 폰에서 24px)
//   ② 공종 이름 칸 왼쪽 정렬(전엔 막대형 셋째 칸 규칙이 넘어와 오른쪽 정렬) · 막대형 표 셋째 칸은 그대로(오른쪽)
//   ③ «＋ 공종» 세 번 → 줄 +3 · 빈 줄은 «–» · 이름을 적으면 번호 5 · 6 · 7
//   ④ 줄 끝 «＋»(아래에 끼우기) — 2.2 아래 세부 줄 → 이름 적으면 2.3 · 그 뒤 «3 부대공» 번호 그대로
//   ⑤ ▲ 한 칸 위로 — 7번 줄이 6번 자리로
//   ⑥ 폭 320 · 390 · 1280 쪽 가로 넘침 없음(표는 제 칸 안에서 밀림) · 화면 오류 없음
import { createRequire } from 'module'
const require = createRequire(process.env.PW || '/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const 주소 = process.env.B || 'http://127.0.0.1:4734'
const 기기들 = (process.argv[2] || '모두') === '모두' ? ['PC', '폰'] : [process.argv[2]]
let ok = 0, bad = 0
const 봐 = (c, m, 더 = '') => { if (c) ok++; else bad++; console.log(c ? '  ✓' : '  ✗', m, c ? '' : String(typeof 더 === 'string' ? 더 : JSON.stringify(더)).slice(0, 400)) }
const 브 = await chromium.launch()
for (const 기기 of 기기들) {
  console.log('■ ' + 기기)
  const 폰 = 기기 === '폰'
  const c = await 브.newContext({ viewport: 폰 ? { width: 390, height: 844 } : { width: 1280, height: 900 }, isMobile: 폰, hasTouch: 폰, locale: 'ko-KR' })
  await c.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|geojs|firebaseio|coupang/, (r) => r.fulfill({ status: 200, body: '' }))
  await c.addInitScript(() => { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); try { sessionStorage.setItem('kcm_notice_seen', '2026-10-업체') } catch (e) {} })
  const p = await c.newPage(); const 오류 = []; p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
  await p.goto(주소 + '/tools/schedule', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(3500)
  const 누름 = (re) => p.evaluate((s) => { const r = new RegExp(s); const b = [...document.querySelectorAll('button')].find((x) => r.test(x.textContent.trim()) && x.offsetParent !== null); if (b) { b.click(); return true } return false }, re.source)
  봐(await 누름(/예시로 해 보기/), '예시로 해 보기'); await p.waitForTimeout(1500)
  /* 막대형 셋째 칸(그대로 오른쪽) */
  const 막 = await p.evaluate(() => { const i = document.querySelector('.gp-edit:not(.gc-edit) tbody tr td:nth-child(3) input'); return i ? getComputedStyle(i).textAlign : '없음' })
  봐(막 === 'right' || 막 === 'end', '② 막대형 표 셋째 칸은 그대로(오른쪽)', 막)
  봐(await 누름(/금액형/), '💰 금액형'); await p.waitForTimeout(1500)
  const 줄들 = () => p.evaluate(() => [...document.querySelectorAll('.gc-edit tbody tr')].map((tr) => ({ n: (tr.querySelector('td.n') || {}).textContent.replace('▲', '').trim(), 이름: tr.querySelectorAll('input')[0].value,
    정렬: getComputedStyle(tr.querySelectorAll('input')[0]).textAlign, 폭: Math.round(tr.querySelector('select').getBoundingClientRect().width), 단계: tr.querySelector('select').value })))
  let L = await 줄들()
  봐(L.length === 10, '예시 10줄', L.length)
  봐(L.every((x) => x.폭 >= 88), `${기기} ① 단계 칸 너비 88px 넘음`, L.map((x) => x.폭))
  봐(L.every((x) => x.정렬 === 'left' || x.정렬 === 'start'), `${기기} ② 공종 이름 왼쪽 정렬`, L.map((x) => x.정렬))
  const 넣기 = (k, v) => p.evaluate(([k, v]) => { const tr = document.querySelectorAll('.gc-edit tbody tr')[k]; const inp = tr.querySelectorAll('input')[0]; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(inp, v); inp.dispatchEvent(new Event('input', { bubbles: true })) }, [k, v])
  for (let k = 0; k < 3; k++) { await 누름(/^＋ 공종$/); await p.waitForTimeout(250) }
  L = await 줄들()
  봐(L.length === 13 && L.slice(-3).every((x) => x.n === '–' && x.단계 === '1'), '③ «＋ 공종» 세 번 → 줄 +3 · 빈 줄 «–»', L.slice(-3))
  for (let k = 0; k < 3; k++) await 넣기(10 + k, '새공종' + (k + 1))
  await p.waitForTimeout(600); L = await 줄들()
  봐(L.slice(-3).map((x) => x.n).join() === '5,6,7', '③ 이름 적으면 번호 5 · 6 · 7', L.slice(-3).map((x) => x.n))
  /* ④ 2.2 구조물공 아래에 끼우기 */
  const i22 = L.findIndex((x) => x.n === '2.2')
  await p.evaluate((i) => { const tr = document.querySelectorAll('.gc-edit tbody tr')[i]; tr.querySelector('.gc-add').click() }, i22); await p.waitForTimeout(400)
  L = await 줄들()
  봐(L[i22 + 1].n === '–' && L[i22 + 1].단계 === '2' && L[i22 + 2].n === '3', '④ 2.2 아래 끼운 세부 줄은 «–» · 다음 «3 부대공» 그대로', L.slice(i22, i22 + 3))
  await 넣기(i22 + 1, '포장공'); await p.waitForTimeout(500); L = await 줄들()
  봐(L[i22 + 1].n === '2.3' && L[i22 + 2].n === '3', '④ 이름 적으면 2.3', L.slice(i22, i22 + 3))
  /* ⑤ ▲ */
  const i7 = L.findIndex((x) => x.이름 === '새공종3')
  await p.evaluate((i) => { const tr = document.querySelectorAll('.gc-edit tbody tr')[i]; tr.querySelector('.gp-up').click() }, i7); await p.waitForTimeout(400)
  L = await 줄들()
  봐(L[i7 - 1].이름 === '새공종3' && L[i7 - 1].n === '6' && L[i7].이름 === '새공종2' && L[i7].n === '7', '⑤ ▲ — 새공종3 이 6번 자리로', L.slice(i7 - 1, i7 + 1))
  /* ⑥ 넓이 */
  for (const w of (폰 ? [320, 390] : [1280])) {
    await p.setViewportSize({ width: w, height: 800 }); await p.waitForTimeout(300)
    const n = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    봐(n <= 1, `${기기} ⑥ ${w}px 쪽 가로 넘침 없음`, n)
    const 폭 = await p.evaluate(() => Math.min(...[...document.querySelectorAll('.gc-edit tbody select')].map((s) => s.getBoundingClientRect().width)))
    봐(폭 >= 88, `${기기} ⑥ ${w}px 단계 칸 88px 넘음`, 폭)
  }
  봐(!오류.length, 기기 + ' 화면 오류 없음', 오류.join(' | '))
  await c.close()
}
await 브.close()
console.log(bad ? `✗ ${bad} 틀림 · ${ok} 맞음` : `✓ 모두 맞음(${ok})`)
process.exit(bad ? 1 : 0)
