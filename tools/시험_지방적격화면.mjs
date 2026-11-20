/**
 * 🧪 G795 지방 적격심사 자기평가 계산기 화면 — 가짜 파이어베이스로 구운 판(굽기.sh)을 띄운 뒤:
 *   LANG=C.UTF-8 node tools/시험_지방적격화면.mjs [주소=http://127.0.0.1:5809] · OUT=폴더 면 화면 사진
 *   ① 폭 넷(PC 1280 · 폰 390 · 좁은 폰 320 · 어두운 390) — 예시로 해 보기 → [별표 5] 띠 · 항목 점수 · 종합평점 96.6 · 통과 · 최저 입찰가격 · 넘침 0 · 오류 0 · 칸 · 고름이 화면 안
 *   ② 손으로 넣기 — 카페 질문 꼴 가상 숫자(13.8억) → [별표 4] 95 통과 · 1원 아래 94.96 미달
 *   ③ 30억 이상 → «아직» 띠 · 칸 숨김 ④ 8천만 미만([별표 7]) → 실적 칸 없음 · 시공 4점 ⑤ 실적 제한 → 10년 칸 · 실적인정기간 숨김
 *   ⑥ 적은 값이 남음(다른 화면 갔다 와도) ⑦ 서류 길잡이 · 합산기에서 이 계산기로 고리
 * 가상 자료 · 인터넷 안 부름.
 */
import { createRequire } from 'node:module'
const require = createRequire(process.env.PW || '/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const BASE = process.argv[2] || 'http://127.0.0.1:5809'
const OUT = process.env.OUT || ''
let bad = 0, n = 0
const ok = (이름, c, got) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (c || got === undefined ? '' : ' = ' + JSON.stringify(got).slice(0, 400))) }
const b = await chromium.launch()
const UA폰 = 'Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'
const UAPC = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
async function 새쪽(w, h, { 폰 = true, 어둠 = false } = {}) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', isMobile: 폰, hasTouch: 폰, deviceScaleFactor: OUT ? 2 : 1, colorScheme: 어둠 ? 'dark' : 'light', userAgent: 폰 ? UA폰 : UAPC })
  await ctx.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|googlesyndication|geojs|daumcdn|kakao|coupang/, (r) => r.fulfill({ status: 200, body: '' }))
  const p = await ctx.newPage()
  const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
  p.on('dialog', (d) => d.dismiss())
  return { ctx, p, 오류 }
}
const 넘침 = (p) => p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
const 들어감 = async (p, 길 = '/tools/qualify-self') => { await p.goto(BASE + 길, { waitUntil: 'domcontentloaded' }); await p.waitForSelector('.jq', { timeout: 15000 }); await p.waitForTimeout(600) }
const 결과 = (p) => p.evaluate(() => {
  const o = {}
  document.querySelectorAll('.jq .tl-o').forEach((e) => { o[e.querySelector('span').textContent.trim()] = e.querySelector('b').textContent.trim() })
  return { o, 띠: (document.querySelector('.jq-band') || {}).textContent || '', 최저: (document.querySelector('.jq-low') || {}).textContent || '', 칸: [...document.querySelectorAll('.jq .tl-lab')].map((e) => e.firstChild.textContent.trim()) }
})
const 넣기 = async (p, 이름, 값) => {
  /* 이름표가 «이름» 으로 시작하는 줄(«유동비율» 이 «재무비율(부채 · 유동비율)» 고름 칸에 걸리지 않게) */
  const 칸 = p.locator('.jq .tl-row').filter({ has: p.locator('.tl-lab', { hasText: new RegExp('^' + 이름.replace(/[()]/g, (c) => '\\' + c)) }) }).first().locator('input, select')
  if (await 칸.evaluate((e) => e.tagName) === 'SELECT') await 칸.selectOption(값)
  else { await 칸.fill(''); await 칸.fill(값) }
}

console.log('① 예시로 해 보기 — 폭 넷')
for (const [이름, w, h, 폰, 어둠] of [['PC 1280', 1280, 900, false, false], ['폰 390', 390, 844, true, false], ['좁은 폰 320', 320, 640, true, false], ['폰 390 어두운', 390, 844, true, true]]) {
  const { ctx, p, 오류 } = await 새쪽(w, h, { 폰, 어둠 })
  await 들어감(p)
  await p.click('.tlx-ex button'); await p.waitForTimeout(500)
  const r = await 결과(p)
  ok(`${이름} 띠 — [별표 5] 4억 ~ 10억 · 수행능력 20 + 입찰가격 80 · 95점`, /\[별표 5\]/.test(r.띠) && /수행능력 20 \+ 입찰가격 80/.test(r.띠) && /95점 이상 통과/.test(r.띠), r.띠)
  ok(`${이름} 점수 — 시공 10 · 경영 10 · 수행 20/20 · 입찰가격 76.6 · 종합 96.6 · 통과`, r.o['시공경험'] === '10점' && r.o['경영상태'] === '10점' && r.o['수행능력'] === '20 / 20점' && r.o['입찰가격'] === '76.6점' && r.o['종합평점'] === '96.6점' && /^통과 \(\+1\.6\)$/.test(r.o['95점 통과']), r.o)
  ok(`${이름} 최저 입찰가격 줄 — 원 · 89.75%`, /통과하는 가장 낮은 입찰가격\s*598,444,775원/.test(r.최저) && /89\.75%/.test(r.최저), r.최저)
  const 자리 = await p.evaluate(() => [...document.querySelectorAll('.jq input, .jq select, .jq-band, .jq-low, .jq .tl-o')].filter((e) => e.offsetParent).map((e) => { const q = e.getBoundingClientRect(); return [Math.round(q.left), Math.round(q.right)] }).filter(([l, r]) => l < 0 || r > innerWidth + 1))
  ok(`${이름} 칸 · 고름 · 결과가 화면 안 · 넘침 0 · 오류 0`, 자리.length === 0 && (await 넘침(p)) <= 0 && !오류.length, { 자리, 오류 })
  if (어둠) { const 색 = await p.evaluate(() => ['.jq-band', '.jq-low', '.jq-why'].map((s) => { const e = document.querySelector(s); const c = getComputedStyle(e); return [c.backgroundColor, c.color] })); ok(`${이름} 띠 · 줄 글자 ≠ 바탕`, 색.every(([a, c]) => a !== c), 색) }
  if (OUT) { await p.locator('.jq').screenshot({ path: `${OUT}/G795_예시_${이름.replace(/\s+/g, '')}.png` }) }
  await ctx.close()
}

console.log('② 손으로 넣기 · ③ ~ ⑥')
{
  const { ctx, p, 오류 } = await 새쪽(390, 844)
  await 들어감(p)
  await 넣기(p, '추정가격', '1,380,000,000')
  await p.waitForTimeout(200)
  let r = await 결과(p)
  ok('13.8억 → [별표 4] 10억 ~ 30억 · 수행능력 30 + 입찰가격 70', /\[별표 4\]/.test(r.띠) && /수행능력 30 \+ 입찰가격 70/.test(r.띠), r.띠)
  ok('[별표 4] 칸 — 실적은 «최근 5년» · 실적인정기간 칸 없음', !r.칸.includes('실적인정기간') && r.칸.includes('업종 실적') && (await p.locator('.jq .tl-row', { hasText: '업종 실적' }).first().textContent()).includes('최근 5년'), r.칸)
  for (const [k, v] of [['업종 실적', '5,800,000,000'], ['부채비율', '16.4'], ['업종평균 부채비율', '120'], ['유동비율', '850.5'], ['업종평균 유동비율', '150'], ['입찰가격(투찰금액)', '1,358,108,601'], ['예정가격', '1,520,345,000'], ['A값', '78,500,000']]) await 넣기(p, k, v)
  await p.waitForTimeout(300)
  r = await 결과(p)
  ok('점수 — 15 · 15 · 65 · 종합 95 · 통과(+0)', r.o['시공경험'] === '15점' && r.o['경영상태'] === '15점' && r.o['입찰가격'] === '65점' && r.o['종합평점'] === '95점' && /^통과/.test(r.o['95점 통과']), r.o)
  ok('최저 입찰가격 1,358,065,346원 · 88.75%', /1,358,065,346원/.test(r.최저) && /88\.75%/.test(r.최저), r.최저)
  const 까닭 = await p.evaluate(() => [...document.querySelectorAll('.jq-why')].map((e) => e.textContent))
  ok('까닭 줄 — 실적 비율 · 부채 · 유동 · 반올림 비율', 까닭.some((t) => /420\.29%/.test(t)) && 까닭.some((t) => /부채 13\.67%\(8\)/.test(t) && /유동 567%\(7\)/.test(t)) && 까닭.some((t) => /88\.748%/.test(t) && /88\.75%/.test(t)), 까닭)
  await 넣기(p, '입찰가격(투찰금액)', '1,358,065,345'); await p.waitForTimeout(200)
  r = await 결과(p)
  ok('1원 아래 → 94.96 · 미달(0.04점 모자람)', r.o['종합평점'] === '94.96점' && /미달 \(0\.04점 모자람\)/.test(r.o['95점 통과']), r.o)
  /* ⑥ 남음 */
  await p.goto(BASE + '/tools', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(800)
  await 들어감(p)
  r = await 결과(p)
  ok('다른 화면 갔다 와도 적은 값 그대로(94.96)', r.o['종합평점'] === '94.96점', r.o)
  /* ⑤ 실적 제한 */
  await 넣기(p, '입찰 방법', '제한'); await p.waitForTimeout(200)
  r = await 결과(p)
  ok('실적 제한 → 10년 동일 종류 칸 · 업종 실적 칸(실적계수) 그대로', r.칸.includes('10년 동일 종류 실적') && r.칸.includes('업종 실적'), r.칸)
  await 넣기(p, '10년 동일 종류 실적', '100'); await p.waitForTimeout(200)
  r = await 결과(p)
  ok('제한 · 100% → 13.5 + 1.5 = 15', r.o['시공경험'] === '15점', r.o)
  await 넣기(p, '입찰 방법', '아님')
  /* ③ 30억 이상 */
  await 넣기(p, '추정가격', '3,000,000,000'); await p.waitForTimeout(200)
  r = await 결과(p)
  ok('30억 → «아직» 띠 · 아래 칸 숨김', /30억 원 이상/.test(r.띠) && /점수 합산기/.test(r.띠) && r.칸.length === 2 && !Object.keys(r.o).length, { 띠: r.띠, 칸: r.칸 })
  /* ④ 8천만 미만 */
  await 넣기(p, '추정가격', '75,000,000'); await p.waitForTimeout(200)
  r = await 결과(p)
  ok('7,500만 → [별표 7] · 실적 칸 없음 · 시공 4점(만점) · 접근성 칸 보임', /\[별표 7\]/.test(r.띠) && !r.칸.includes('업종 실적') && r.o['시공경험'] === '4점' && (await p.$$('.jq-chk .qd-c')).length === 2, { 칸: r.칸, o: r.o })
  ok('넘침 0 · 오류 0', (await 넘침(p)) <= 0 && !오류.length, 오류)
  await ctx.close()
}
console.log('⑦ 이어지는 고리')
{
  const { ctx, p, 오류 } = await 새쪽(1280, 900, { 폰: false })
  await p.goto(BASE + '/tools/qualify-docs', { waitUntil: 'domcontentloaded' }); await p.waitForSelector('.qd-go a', { timeout: 15000 })
  const 고리 = await p.evaluate(() => [...document.querySelectorAll('.qd-go a')].map((a) => a.getAttribute('href')).join())
  ok('서류 길잡이 — 자기평가 · 합산기 · 하한율', 고리 === '/tools/qualify-self,/tools/qualify-score,/tools/floor-rate', 고리)
  await p.goto(BASE + '/tools/qualify-score', { waitUntil: 'domcontentloaded' }); await p.waitForSelector('.tool', { timeout: 15000 })
  await p.click('.tool .hint a[href="/tools/qualify-self"]'); await p.waitForSelector('.jq', { timeout: 15000 })
  ok('합산기 → 자기평가 계산기로 감 · 오류 0', p.url().endsWith('/tools/qualify-self') && !오류.length, 오류)
  const 목록 = await (async () => { await p.goto(BASE + '/tools', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1200); return p.evaluate(() => [...document.querySelectorAll('a[href="/tools/qualify-self"]')].length) })()
  ok('도구 탭에 카드 있음', 목록 >= 1, 목록)
  await ctx.close()
}
await b.close()
console.log(`\n${bad ? '✗' : '✓'} 시험_지방적격화면 ${n - bad}/${n}`)
process.exit(bad ? 1 : 0)
