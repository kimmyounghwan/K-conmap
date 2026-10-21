// 돌리기: 4998 에 화면 빌드를 얹은 뒤 node tools/시험_받은수다시읽기.mjs (데이터베이스는 가짜로 — 진짜 사이트에 쓰지 않음)
// G362 받은 수 · 조회 — dl.json 을 못 받을 때 «시작값만의 작은 숫자» 를 보이지 않고, 다시 받으면 바른 숫자
import { createRequire } from 'module'
const require = createRequire('/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
let ok = 0, bad = 0
const 봐 = (c, m, 더 = '') => { if (c) { ok++; console.log('✓', m, 더) } else { bad++; console.log('✗', m, 더) } }
const 브 = await chromium.launch()
async function 열기(실패수, 끝까지) {
  const 판 = await 브.newContext({ viewport: { width: 430, height: 900 } })
  let n = 0
  await 판.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|geojs/, (r) => r.fulfill({ status: 200, body: '' }))
  await 판.route(/firebaseio\.com\/dl\.json/, (r) => { n++; if (끝까지 || n <= 실패수) return r.abort('failed'); return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ f: { '|forms|siljeong-bogo,xlsx': 72, '|forms|wonga,xlsx': 59 }, p: {} }) }) })
  await 판.route(/firebaseio\.com\/(fresh\/pv\/p|pv\/c)\.json/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ '|forms|siljeong-bogo': 300 }) }))
  await 판.route(/firebaseio\.com\/(?!dl\.json|fresh|pv\/c)/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await 판.addInitScript(() => { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); try { sessionStorage.setItem('kcm_notice_seen', '2026-10-업체') } catch (e) {} })
  const A = await 판.newPage()
  await A.goto('http://127.0.0.1:4998/forms', { waitUntil: 'domcontentloaded' })
  return { 판, A, 횟수: () => n }
}
const 실정 = (A) => A.evaluate(() => { const c = [...document.querySelectorAll('a.fm-gal')].find((a) => /실정보고서/.test(a.innerText)); return c ? (c.querySelector('.dlcount') || {}).innerText || '' : null })
{ // ⓪ 잘 받으면 한 번만 읽고 바른 숫자 · 도구 탭도 같음
  const { 판, A, 횟수 } = await 열기(0, false)
  await A.waitForTimeout(2500)
  const t = await 실정(A)
  봐(/⬇ 82회/.test(t || '') && 횟수() === 1, '⓪ 잘 받으면 한 번만 읽고 바른 숫자', `${t} · dl 요청 ${횟수()}번`)
  await A.evaluate(() => { history.pushState({}, '', '/tools'); dispatchEvent(new PopStateEvent('popstate')) })
  await A.waitForTimeout(2500)
  const 도구 = await A.evaluate(() => [...document.querySelectorAll('.dlcount, .pvcount')].length)
  봐(도구 > 0 && 횟수() === 1, '⓪ 도구 탭으로 옮겨도 다시 안 읽고(5분 기억) 숫자가 보임', `숫자 칸 ${도구} · dl 요청 ${횟수()}번`)
  await 판.close()
}
{ // ① 처음 한 번 못 받음 → 1.5초 뒤 다시 → 72
  const { 판, A, 횟수 } = await 열기(1, false)
  await A.waitForTimeout(4000)
  const t = await 실정(A)
  봐(/⬇ 82회/.test(t || ''), '① 한 번 끊겨도 1.5초 뒤 다시 받아 바른 숫자(데이터베이스 72 + 시작값 10 = 82)', `${t} · dl 요청 ${횟수()}번`)
  await 판.close()
}
{ // ② 계속 못 받음 → 작은 숫자를 안 보임
  const { 판, A, 횟수 } = await 열기(0, true)
  await A.waitForTimeout(4500)
  const 모두 = await A.evaluate(() => [...document.querySelectorAll('.dlcount')].map((e) => e.innerText).filter((x) => /⬇/.test(x)))
  봐(모두.length === 0, '② 계속 못 받으면 ⬇ 숫자를 하나도 안 보임(시작값만의 작은 숫자 X)', `${JSON.stringify(모두.slice(0, 3))} · dl 요청 ${횟수()}번`)
  await 판.close()
}
{ // ③ 두 번 다 못 받고 → 20초 뒤 다시 읽어 숫자가 옴
  const { 판, A, 횟수 } = await 열기(2, false)
  await A.waitForTimeout(4000)
  const t1 = await 실정(A)
  await A.waitForTimeout(19000)
  const t2 = await 실정(A)
  봐(!/⬇/.test(t1 || '') && /⬇ 82회/.test(t2 || ''), '③ 두 번 다 끊기면 숨겼다가 20초 뒤 다시 받아 바른 숫자', `${t1} → ${t2} · dl 요청 ${횟수()}번`)
  await 판.close()
}
await 브.close()
console.log(`${ok} 통과 · ${bad} 실패`)
process.exit(bad ? 1 : 0)
