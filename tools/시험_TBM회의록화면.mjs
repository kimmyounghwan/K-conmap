// 🗣 G497 (2026-11-01) TBM 회의록(/forms/tbm-hoeui · 사이트에서 작성 → PDF) 화면 시험 — PC · 폰
//   소장님 「tbm 이것도 서식에 올려 주고, 도구로 만들어줘 … 이용자 입장에서 편하게 되도록 자동으로」
//   화면 빌드를 얹은 뒤  B=http://127.0.0.1:4998 node tools/시험_TBM회의록화면.mjs [PC|폰|모두]
//   ① 열면 TBM 일시에 오늘 날짜 + 08:00 ~ 08:15 가 저절로 · 위험성평가 실시여부 · 장소는 고르기(datalist)
//   ② 잠재위험요인 2줄 적으면 «작업 전 안전조치 확인» 첫 열에 저절로 · 중점위험을 적으면 한 줄 더 · 위험요인 하나를 지우면 빠짐 · 조치여부 예/아니오 고르기
//   ③ 참석자 이름을 적고 새로고침 → «새로 쓰기» 해도 이름이 그대로(이 기기 기억) · 종이(#fw-인쇄)에 저절로 들어온 줄이 찍힘
//   ④ ✍ 예시 채우기 → 안전조치 확인 표 4줄(위험요인 3 + 중점 1) · 가상 이름뿐(실제 공사명 · 상호 없음)
//   ⑤ 320 ~ 1280 가로 넘침 없음 · 화면 오류 없음
import { createRequire } from 'module'
const require = createRequire(process.env.PW || '/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const 주소 = process.env.B || 'http://127.0.0.1:4998'
const 기기들 = (process.argv[2] || '모두') === '모두' ? ['PC', '폰'] : [process.argv[2]]
let ok = 0, bad = 0
const 봐 = (c, m, 더 = '') => { if (c) ok++; else bad++; console.log(c ? '  ✓' : '  ✗', m, c ? '' : String(typeof 더 === 'string' ? 더 : JSON.stringify(더)).slice(0, 500)) }
const 브 = await chromium.launch()
const 오늘 = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10)
for (const 기기 of 기기들) {
  console.log('■ ' + 기기)
  const 폰 = 기기 === '폰'
  const c = await 브.newContext({ viewport: 폰 ? { width: 390, height: 844 } : { width: 1280, height: 900 }, locale: 'ko-KR', isMobile: 폰, hasTouch: 폰 })
  await c.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|geojs|firebaseio/, (r) => r.fulfill({ status: 200, body: 'null', contentType: 'application/json' }))
  await c.addInitScript(() => { try { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); sessionStorage.setItem('kcm_notice_seen', '2026-10-업체') } catch (e) {} })
  const p = await c.newPage(); const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e).slice(0, 300))); p.on('dialog', (d) => d.accept())
  const 글 = () => p.evaluate(() => document.body.innerText)
  const 칸 = (라벨re) => p.evaluate((s) => { const r = new RegExp(s); const l = [...document.querySelectorAll('.fw-form label.fw-kvr')].find((x) => r.test(x.querySelector('.fw-lb')?.textContent || '')); const i = l && l.querySelector('input, textarea'); return i ? { v: i.value, list: i.getAttribute('list'), ph: i.placeholder } : null }, 라벨re.source)
  const 쓰기 = (라벨re, v) => p.evaluate(([s, v]) => { const r = new RegExp(s); const l = [...document.querySelectorAll('.fw-form label.fw-kvr')].find((x) => r.test(x.querySelector('.fw-lb')?.textContent || '')); const i = l && l.querySelector('input, textarea'); if (!i) return false; const set = Object.getOwnPropertyDescriptor(i.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, 'value').set; set.call(i, v); i.dispatchEvent(new Event('input', { bubbles: true })); return true }, [라벨re.source, v])
  const 표쓰기 = (표번, j, k, v) => p.evaluate(([표번, j, k, v]) => { const t = document.querySelectorAll('.fw-form .fw-tbl')[표번]; const td = t.querySelectorAll('tbody tr')[j].children[k]; const i = td.querySelector('input, textarea'); if (!i) return false; const set = Object.getOwnPropertyDescriptor(i.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, 'value').set; set.call(i, v); i.dispatchEvent(new Event('input', { bubbles: true })); return true }, [표번, j, k, v])
  const 표읽기 = (표번) => p.evaluate((표번) => { const t = document.querySelectorAll('.fw-form .fw-tbl')[표번]; return [...t.querySelectorAll('tbody tr')].map((tr) => [...tr.children].map((td) => { const i = td.querySelector('input, textarea'); if (i) return i.value; const ro = td.querySelector('.fw-ro'); return ro && ro.querySelector('i') ? '' : td.textContent.trim() })) }, 표번)
  await p.goto(주소 + '/forms/tbm-hoeui', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500)
  const t0 = await 글()
  봐(/TBM 회의록/.test(t0) && /작업 전 안전조치 확인/.test(t0) && /참석자 확인/.test(t0), `${기기} 화면 열림 — TBM 회의록 · 안전조치 확인 · 참석자`)
  /* 새로 쓰기(지난 시험 흔적 지움) */
  await p.evaluate(() => { const b = [...document.querySelectorAll('.fw-bar button')].find((x) => /빈칸으로/.test(x.textContent)); if (b) b.click() }); await p.waitForTimeout(400)
  /* ① 일시 · 고르기 */
  const 일시 = await 칸(/TBM 일시/)
  봐(일시 && 일시.v === `${오늘} 08:00 ~ 08:15`, `① TBM 일시가 오늘 «${오늘} 08:00 ~ 08:15» 로 저절로`, 일시)
  const 여부 = await 칸(/위험성평가 실시여부/), 장소 = await 칸(/TBM 장소/)
  봐(여부 && 여부.list && 장소 && 장소.list, '① 실시여부 · 장소는 고르기(datalist)', { 여부, 장소 })
  const 옵 = await p.evaluate(() => [...document.querySelectorAll('datalist')].map((d) => [...d.options].map((o) => o.value)).filter((a) => a.includes('예') && a.includes('아니오')).length)
  봐(옵 >= 2, '① 예 / 아니오 고르기가 실시여부 · 조치여부에', 옵)
  /* ② 따름 */
  봐(await 표쓰기(0, 0, 0, '근로자와 장비와의 충돌') && await 표쓰기(0, 1, 0, '굴착면 단부로 추락'), '② 잠재위험요인 2줄 적음'); await p.waitForTimeout(400)
  let 확 = await 표읽기(1)
  봐(확[0][0] === '근로자와 장비와의 충돌' && 확[1][0] === '굴착면 단부로 추락' && !확[2][0], '② «작업 전 안전조치 확인» 첫 열에 저절로 2줄', 확.slice(0, 3))
  await 쓰기(/중점위험요인 선정/, '주변 비닐하우스 파손 우려'); await p.waitForTimeout(400)
  확 = await 표읽기(1)
  봐(확[2][0] === '주변 비닐하우스 파손 우려', '② 중점위험을 적으면 한 줄 더(3줄)', 확.slice(0, 4))
  봐(await 표쓰기(1, 0, 1, '아니오') && await 표쓰기(1, 0, 2, '신호수 배치 뒤 시작'), '② 조치여부 «아니오» · 조치 내용 적음'); await p.waitForTimeout(300)
  await 표쓰기(0, 1, 0, ''); await p.waitForTimeout(400)
  확 = await 표읽기(1)
  봐(확[0][0] === '근로자와 장비와의 충돌' && 확[1][0] === '주변 비닐하우스 파손 우려' && 확[0][1] === '아니오' && 확[0][2] === '신호수 배치 뒤 시작', '② 위험요인 하나를 지우면 빠지고 · 적어 둔 조치여부 · 내용은 그대로', 확.slice(0, 3))
  const 못고침 = await p.evaluate(() => !!document.querySelectorAll('.fw-form .fw-tbl')[1].querySelector('tbody tr td .fw-ro'))
  봐(못고침, '② 따라오는 첫 열은 손으로 못 고침(.fw-ro)')
  /* ③ 참석자 기억 · 종이 */
  봐(await 표쓰기(2, 0, 0, '이가상') && await 표쓰기(2, 0, 2, '최가상') && await 표쓰기(2, 1, 0, '정가상'), '③ 참석자 이름 셋 적음'); await p.waitForTimeout(900)
  /* 종이(#fw-인쇄)는 PDF 를 만드는 동안만 화면 밖에 펴짐(🖼 G584 — 그림으로 찍어 바로 내려받음) — 펴져 칸 맞춤을 끝낸 순간의 종이 글을 집음 */
  await p.evaluate(() => { window.__종이 = ''; const ob = new MutationObserver(() => { const el = document.querySelector('#fw-인쇄 .fw-paper[data-h]'); if (el && !window.__종이) window.__종이 = el.innerText }); ob.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-h'] }); window.__ob = ob })
  const [받음] = await Promise.all([p.waitForEvent('download', { timeout: 30000 }).catch(() => null), p.evaluate(() => { const b = [...document.querySelectorAll('.fw-bar button')].find((x) => /PDF 저장/.test(x.textContent)); if (b) b.click() })])
  const 종이 = await p.evaluate(() => { if (window.__ob) window.__ob.disconnect(); return window.__종이 || '' })
  봐(!!받음 && /근로자와 장비와의 충돌/.test(종이) && /주변 비닐하우스 파손 우려/.test(종이) && /이가상/.test(종이) && new RegExp(오늘).test(종이), '③ 📄 PDF 저장 → 바로 받음 · 종이(#fw-인쇄)에 저절로 들어온 줄 · 참석자 · 오늘 날짜가 찍힘', { 받음: !!받음, 종이: 종이.slice(0, 200) })
  await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500)
  await p.evaluate(() => { const b = [...document.querySelectorAll('.fw-bar button')].find((x) => /빈칸으로/.test(x.textContent)); if (b) b.click() }); await p.waitForTimeout(500)
  const 참 = await 표읽기(2)
  봐(참[0][0] === '이가상' && 참[0][2] === '최가상' && 참[1][0] === '정가상', '③ 새로고침 · «새로 쓰기» 해도 참석자 이름은 그대로(이 기기 기억)', 참.slice(0, 2))
  const 확2 = await 표읽기(1)
  봐(!확2[0][0], '③ 새로 쓰면 안전조치 확인 표는 비어 있음(위험요인이 없으므로)', 확2[0])
  /* ④ 예시 */
  await p.evaluate(() => { const b = [...document.querySelectorAll('.fw-bar button')].find((x) => /예시/.test(x.textContent)); if (b) b.click() }); await p.waitForTimeout(800)
  const 예 = await 표읽기(1)
  const 전체 = await 글()
  봐(예.filter((r) => r[0]).length === 4 && 예[3][0] === '작업 중 주변 비닐하우스 · 농수로 파손 우려' && 예[2][1] === '아니오', '④ 예시 — 안전조치 확인 4줄(위험 3 + 중점 1) · 셋째 줄 «아니오»', 예.slice(0, 4))
  봐(/가상/.test(전체) && !/송금|신광|박성현|금동|광양/.test(전체), '④ 예시는 가상 이름뿐(실제 공사명 · 상호 · 이름 없음)')
  /* ⑤ 넘침 */
  for (const w of (폰 ? [320, 360, 390] : [860, 1280])) {
    await p.setViewportSize({ width: w, height: 800 }); await p.waitForTimeout(400)
    const n = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    봐(n <= 1, `${기기} ⑤ ${w}px 가로 넘침 없음`, n)
  }
  봐(!오류.length, 기기 + ' 화면 오류 없음', 오류.join(' | '))
  if (process.env.CAP) { await p.setViewportSize(폰 ? { width: 390, height: 844 } : { width: 1280, height: 900 }); await p.screenshot({ path: `${process.env.CAP}_${기기}.png` }) }
  await c.close()
}
await 브.close()
console.log(bad ? `✗ ${bad} 틀림 · ${ok} 맞음` : `✓ 모두 맞음(${ok})`)
process.exit(bad ? 1 : 0)
