// 🚫 G682 손으로 적는 틀의 짐작 값 없앰 — 화면 시험 (2026-11-14 · 소장님 «그렇게 해»)
//   빌드를 띄운 뒤  B=http://127.0.0.1:4705 node tools/시험_짐작금지화면.mjs
//   ① 골조(/jeoksan/golgo) 새 공사: 1 · 2층 층고 · 슬라브 칸 빈칸(❓ · 노랑) + 안내 한 줄 · «＋ 층» 도 빈칸 · 적으면 노랑 풀림 · 다 적으면 안내 사라짐 · 🧪 예시는 예시 도면 값(3,600 · 3,300 · 150) 그대로
//   ② 마감(/jeoksan/magam) ③ 실: 기본 천장고 빈칸(«❓ 적어 주세요» · 노랑) · 적으면 풀림 · 🧪 예시는 2.7
//   ③ 골조 모델(/jeoksan/model?ws=1) 통심 · 층: 1층 빈칸(❓) + 안내 · «＋ 위로 층» · «＋ 지하층» 도 빈칸 · 적었다 지우면 0 이 아니라 빈칸 · 세우기(3D) 탭 오류 없음
//   폰 390 · PC 1280 — 가로 넘침 없음 · 쪽 오류 0
import { createRequire } from 'module'
const require = createRequire(process.env.PW || '/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const 주소 = process.env.B || 'http://127.0.0.1:4705'
let 맞 = 0, 틀 = 0
const 봐 = (c, m, 더 = '') => { if (c) 맞++; else 틀++; console.log(c ? '  ✓' : '  ✗', m, c ? '' : JSON.stringify(더).slice(0, 500)) }
const 브 = await chromium.launch()
const 쉼 = (p, ms) => p.waitForTimeout(ms)

for (const w of [390, 1280]) {
  const 폰 = w < 600
  const 판 = 폰 ? '폰 390' : 'PC 1280'
  const c = await 브.newContext({ viewport: { width: w, height: 900 }, isMobile: 폰, hasTouch: 폰, locale: 'ko-KR' })
  await c.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|geojs|firebaseio|kakaocdn|coupang/, (r) => r.fulfill({ status: 200, body: '' }))
  await c.addInitScript(() => { try { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); sessionStorage.setItem('kcm_notice_seen', '2026-10-업체') } catch (e) {} })
  const p = await c.newPage(); const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
  const 넘침 = () => p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  const 누름 = (re) => p.evaluate((s) => { const r = new RegExp(s); const b = [...document.querySelectorAll('button')].find((x) => r.test(x.textContent.trim()) && x.offsetParent !== null); if (b) b.click(); return !!b }, re.source)

  console.log('① 골조 새 공사 — ' + 판)
  await p.goto(주소 + '/jeoksan/golgo', { waitUntil: 'domcontentloaded' }); await 쉼(p, 2500)
  const 층표 = () => p.evaluate(() => {
    const t = [...document.querySelectorAll('table.gg-t')].find((x) => [...x.querySelectorAll('th')].some((h) => h.textContent.trim() === '층고'))
    if (!t) return null
    return [...t.querySelectorAll('tbody tr')].map((tr) => { const td = tr.querySelectorAll('td'); const i = (k) => td[k] && td[k].querySelector('input'); return { 이름: i(0) && i(0).value, 층고: i(1) && i(1).value, 슬라브: i(2) && i(2).value, 노층: td[1].classList.contains('gg-q'), 노슬: td[2].classList.contains('gg-q'), 표시: i(1) && i(1).placeholder } })
  })
  const 안내 = () => p.evaluate(() => { const h = document.querySelector('.gg-qhint'); if (!h || h.offsetParent === null) return null; const r = h.getBoundingClientRect(); return { 글: h.textContent, 오른: Math.round(r.right), 폭: window.innerWidth } })
  let T = await 층표()
  봐(T && T.length === 4 && T.map((r) => r.이름).join() === 'FT,1,2,R', '층 표 FT · 1 · 2 · R', T)
  봐(T && T[1].층고 === '' && T[1].슬라브 === '' && T[2].층고 === '' && T[2].슬라브 === '', '1 · 2층 층고 · 슬라브 빈칸(3,300 · 150 짐작 없음)', T)
  봐(T && T[1].노층 && T[1].노슬 && T[2].노층 && T[2].노슬 && !T[0].노층 && !T[3].노층 && T[1].표시 === '❓', '빈칸만 노랑(gg-q) · 표시 ❓ — FT · R 의 0 은 그대로', T)
  let H = await 안내()
  봐(H && /도면 값을 적어 주세요/.test(H.글) && /짐작하지 않음/.test(H.글) && H.오른 <= H.폭, '안내 한 줄 «❓ … 도면 값을 적어 주세요 … (짐작하지 않음)» · 화면 안', H)
  await 누름(/^＋ 층$/); await 쉼(p, 300)
  T = await 층표()
  봐(T && T.length === 5 && T[4].층고 === '' && T[4].슬라브 === '' && T[4].노층, '«＋ 층» 새 줄도 빈칸(❓)', T && T[4])
  /* 적기 — 1층 층고 3000 → 그 칸만 노랑 풀림 */
  const 적기 = async (줄, k, v) => {
    await p.evaluate(([줄, k, v]) => {
      const t = [...document.querySelectorAll('table.gg-t')].find((x) => [...x.querySelectorAll('th')].some((h) => h.textContent.trim() === '층고'))
      const inp = t.querySelectorAll('tbody tr')[줄].querySelectorAll('td')[k].querySelector('input')
      const 세 = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
      세.call(inp, v); inp.dispatchEvent(new Event('input', { bubbles: true }))
    }, [줄, k, v]); await 쉼(p, 150)
  }
  await 적기(1, 1, '3000')
  T = await 층표()
  봐(T && T[1].층고 === '3000' && !T[1].노층 && T[1].노슬, '1층 층고 3000 적음 → 그 칸만 노랑 풀림(슬라브는 아직 ❓)', T && T[1])
  await 적기(1, 2, '150'); await 적기(2, 1, '3000'); await 적기(2, 2, '0')
  await p.evaluate(() => { const t = [...document.querySelectorAll('table.gg-t')].find((x) => [...x.querySelectorAll('th')].some((h) => h.textContent.trim() === '층고')); const tr = t.querySelectorAll('tbody tr'); tr[tr.length - 1].querySelectorAll('button')[1].click() }); await 쉼(p, 300)
  T = await 층표(); H = await 안내()
  봐(T && T.length === 4 && !T.some((r) => r.노층 || r.노슬) && H === null, '다 적음(0 도 값) · 새 줄 지움 → 노랑 · 안내 없음', [T, H])
  봐(await 넘침() <= 1, '가로 넘침 없음(골조 개요)', await 넘침())

  console.log('② 마감 ③ 실 — 기본 천장고 · ' + 판)
  await p.goto(주소 + '/jeoksan/magam', { waitUntil: 'domcontentloaded' }); await 쉼(p, 2500)
  await p.evaluate(() => [...document.querySelectorAll('button[role=tab]')].find((b) => /③ 실/.test(b.textContent) && b.offsetParent !== null)?.click()); await 쉼(p, 500)
  const 천 = () => p.evaluate(() => { const l = [...document.querySelectorAll('label.gg-f')].find((x) => /기본 천장고/.test(x.textContent)); if (!l) return null; const i = l.querySelector('input'); return { 값: i.value, 표시: i.placeholder, 노: l.classList.contains('gg-q') } })
  let M = await 천()
  봐(M && M.값 === '' && M.표시 === '❓ 적어 주세요' && M.노, '기본 천장고 빈칸(2.4 짐작 없음) · «❓ 적어 주세요» · 노랑', M)
  await p.evaluate(() => { const l = [...document.querySelectorAll('label.gg-f')].find((x) => /기본 천장고/.test(x.textContent)); const i = l.querySelector('input'); const 세 = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; 세.call(i, '2.6'); i.dispatchEvent(new Event('input', { bubbles: true })) }); await 쉼(p, 200)
  M = await 천()
  봐(M && M.값 === '2.6' && !M.노, '2.6 적음 → 노랑 풀림', M)
  봐(await 넘침() <= 1, '가로 넘침 없음(마감 실)', await 넘침())

  console.log('③ 골조 모델 통심 · 층 — ' + 판)
  await p.goto(주소 + '/jeoksan/model?ws=1', { waitUntil: 'domcontentloaded' }); await 쉼(p, 3000)
  await p.evaluate(() => [...document.querySelectorAll('button.gmd-tab')].find((b) => /통심/.test(b.textContent))?.click()); await 쉼(p, 500)
  const 모층 = () => p.evaluate(() => {
    const t = [...document.querySelectorAll('table.gmd-table')].find((x) => [...x.querySelectorAll('th')].some((h) => /층고/.test(h.textContent)))
    if (!t) return null
    return [...t.querySelectorAll('tbody tr')].filter((tr) => !tr.classList.contains('gmd-ft')).map((tr) => { const i = tr.querySelectorAll('input'); return { 이름: i[0] && i[0].value, 층고: i[1] && i[1].value, 슬라브: i[2] && i[2].value, 노: i[1] && i[1].classList.contains('gg-q'), 표시: i[1] && i[1].placeholder } })
  })
  let F = await 모층(); H = await 안내()
  봐(F && F.length === 1 && F[0].이름 === '1' && F[0].층고 === '' && F[0].슬라브 === '' && F[0].노 && F[0].표시 === '❓', '새 모델 1층 층고 · 슬라브 빈칸(❓ · 노랑 — 3,300 · 150 짐작 없음)', F)
  봐(H && /도면 값을 적어 주세요/.test(H.글) && H.오른 <= H.폭, '안내 한 줄 · 화면 안', H)
  await 누름(/^＋ 위로 층 더하기$/); await 쉼(p, 300); await 누름(/^＋ 지하층 더하기$/); await 쉼(p, 300)
  F = await 모층()
  봐(F && F.length === 3 && F.every((r) => r.층고 === '' && r.슬라브 === '' && r.노) && F.map((r) => r.이름).join() === '2,1,B1', '«＋ 위로 층» · «＋ 지하층» 도 빈칸(❓ — 3,300 · 3,600 · 150 짐작 없음)', F)
  const 모적기 = async (이름, k, v) => {
    await p.evaluate(([이름, k, v]) => {
      const t = [...document.querySelectorAll('table.gmd-table')].find((x) => [...x.querySelectorAll('th')].some((h) => /층고/.test(h.textContent)))
      const tr = [...t.querySelectorAll('tbody tr')].find((x) => { const i = x.querySelector('input'); return i && i.value === 이름 })
      const inp = tr.querySelectorAll('input')[k]
      const 세 = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
      세.call(inp, v); inp.dispatchEvent(new Event('input', { bubbles: true }))
    }, [이름, k, v]); await 쉼(p, 150)
  }
  await 모적기('1', 1, '3300')
  F = await 모층()
  const 일 = F && F.find((r) => r.이름 === '1')
  봐(일 && 일.층고 === '3300' && !일.노, '1층 층고 3300 적음 → 노랑 풀림', 일)
  await 모적기('1', 1, '')
  F = await 모층()
  const 일2 = F && F.find((r) => r.이름 === '1')
  봐(일2 && 일2.층고 === '' && 일2.노, '지우면 0 이 아니라 빈칸(❓) 으로 돌아감', 일2)
  봐(await 넘침() <= 1, '가로 넘침 없음(모델 통심 · 층)', await 넘침())
  await p.evaluate(() => [...document.querySelectorAll('button.gmd-tab')].find((b) => /세우기/.test(b.textContent))?.click()); await 쉼(p, 1500)
  /* 🧪 예시 — 새 창(처음 온 손님)에서 «예시로 해 보기»: 예시 도면에서 읽은 값 그대로(1층 3,600 · 2층 3,300 · 150 / 마감 기본 2.7) · 노랑 · 안내 없음 */
  for (const [쪽, 탭글] of [['/jeoksan/golgo', '① 개요'], ['/jeoksan/magam', '③ 실']]) {
    const c2 = await 브.newContext({ viewport: { width: w, height: 900 }, isMobile: 폰, hasTouch: 폰, locale: 'ko-KR' })
    await c2.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|geojs|firebaseio|kakaocdn|coupang/, (r) => r.fulfill({ status: 200, body: '' }))
    const q = await c2.newPage(); q.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
    await q.goto(주소 + 쪽, { waitUntil: 'domcontentloaded' }); await q.waitForSelector('button', { timeout: 20000 }); await 쉼(q, 1200)
    await q.locator('button', { hasText: '예시로 해 보기' }).first().click()
    await q.waitForSelector('.gg-print .gg-head', { timeout: 60000 }).catch(() => {}); await 쉼(q, 1500)
    await q.evaluate((t) => [...document.querySelectorAll('button[role=tab]')].find((b) => b.textContent.includes(t) && b.offsetParent !== null)?.click(), 탭글); await 쉼(q, 600)
    if (쪽.includes('golgo')) {
      const T2 = await q.evaluate(() => { const t = [...document.querySelectorAll('table.gg-t')].find((x) => [...x.querySelectorAll('th')].some((h) => h.textContent.trim() === '층고')); return t ? [...t.querySelectorAll('tbody tr')].map((tr) => { const td = tr.querySelectorAll('td'); return [td[0].querySelector('input').value, td[1].querySelector('input').value, td[2].querySelector('input').value, td[1].classList.contains('gg-q') || td[2].classList.contains('gg-q')] }) : null })
      const H2 = await q.evaluate(() => !!document.querySelector('.gg-qhint'))
      봐(T2 && T2[1][1] === '3600' && T2[1][2] === '150' && T2[2][1] === '3300' && !T2.some((r) => r[3]) && !H2, '골조 🧪 예시 — 예시 도면 값(1층 3,600 · 2층 3,300 · 150) 그대로 · 노랑 · 안내 없음', [T2, H2])
    } else {
      const M2 = await q.evaluate(() => { const l = [...document.querySelectorAll('label.gg-f')].find((x) => /기본 천장고/.test(x.textContent)); return l ? { 값: l.querySelector('input').value, 노: l.classList.contains('gg-q') } : null })
      봐(M2 && M2.값 === '2.7' && !M2.노, '마감 🧪 예시 — 예시 값 기본 천장고 2.7 그대로 · 노랑 없음', M2)
    }
    await c2.close()
  }
  봐(오류.length === 0, '쪽 오류 0(골조 · 마감 · 모델 · 세우기 3D 탭 · 예시)', 오류)
  await c.close()
}
await 브.close()
console.log(`\n${맞} 맞음 · ${틀} 틀림`)
process.exit(틀 ? 1 : 0)
