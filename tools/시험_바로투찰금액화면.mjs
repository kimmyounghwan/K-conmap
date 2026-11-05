/**
 * 🧪 G542 (2026-11-05) 바로투찰 금액 칸 넷 + «공고 찾기» — 억 · 만으로 넣어도 읽음 · 칸 아래 읽은 줄 — 화면 시험
 *   구운 사이트(dist)를 띄운 뒤:  LANG=C.UTF-8 node tools/시험_바로투찰금액화면.mjs [주소=http://127.0.0.1:4996]
 *   소장님 「사이트 점검도 다 햇어? 이용자 입장에서....」 → 이용자처럼 써 보니 기초금액에 «3억 8,500만» 을 치면 «38,500»
 *   (칠 때마다 숫자만 남겨 억 · 만이 사라짐 · 붙여넣은 «385,000,000원» 은 됐지만 «3억 8,500만원» 은 38,500)
 *   ① PC 1280 기초금액 — 숫자로 치면 예전처럼 칠 때마다 쉼표 · «= 2억 8,500만 원» 줄 / 억 · 만으로 쳐도 같은 투찰금액
 *      · 칸을 벗어나면 쉼표 숫자 · «3.85억» · 붙여넣은 «385,000,000원» · 못 읽는 «삼억» → ⚠(치는 동안) → 빈 칸
 *   ② 추정가격 «12억» = 1200000000 (하한율 구간이 바뀌어 투찰금액이 달라짐 — 칸이 정말 읽힘)
 *      · A값 «1,394만» = 13940000 · 순공사원가 «4억»(기초보다 큼 → «쓰지 않습니다» 안내 = 4억으로 읽음)
 *   ③ «공고 찾기» 칸에 «2억 8,500만» → 기초금액 285,000,000 (숫자 285000000 과 같은 답) · «도로 2억» 은 찾기로
 *   ④ 공고를 고르면 공고 값이 칸에(친 글은 버림) · 값 고치기에서 «2억 4,460만» 으로 고쳐도 같은 답
 *   ⑤ 폰 390 — 숫자 자판(inputmode=numeric) 그대로 · 칠 때마다 쉼표 · 줄 보임 · 320 · 360 · 390 넘침 0
 *   ⑥ 마이컨맵 단축키 /calc#go-base 가 기초금액 칸에 커서(G188 그대로)  ⑦ 오류 0
 *   OUT=폴더 면 그 폴더에 화면 사진(PC · 폰)
 * 가상 자료만 씀 · 인터넷 안 부름(파이어베이스 · 광고 · 애널리틱스 막음).
 */
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const BASE = process.argv[2] || 'http://127.0.0.1:4996'
const OUT = process.env.OUT || ''

let bad = 0, n = 0
const ok = (이름, c, got) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (c || got === undefined ? '' : ' = ' + JSON.stringify(got).slice(0, 400))) }

/* ── 가짜 공고 셋 — 이름 · 기관은 지어낸 것 ── */
const 날 = (d) => new Date(Date.now() + d * 86400e3 + 9 * 3600e3).toISOString().slice(0, 10) + ' 10:00:00'
const f = ['no', 'name', 'inst', 'base', 'budget', 'close', 'lo', 'hi', 'llr', 'est', 'lic', 'aval', 'gmtrl', 'ayn', 'ptot', 'pdrw', 'url', 'site', 'rgnb', 'joint', 'mthd', 'swin', 'rebid', 'enp', 'enpn', 'dt', 'sido', 'dsn', 'enpb', 'jnt', 'tg', 'nt', 'licg']
const 공고들 = [
  { no: 'R00TEST91001', name: '가상 새솔천 정비공사', inst: '가상시', base: 244600000, est: 222363636, close: 날(2), lo: -3, hi: 3, llr: 89.745, lic: ['토목공사업/0001'], aval: 13940000, ayn: 'Y', ptot: 15, pdrw: 4, dt: '2026-10-30 15:00:00', sido: '경기', mthd: '전자입찰' },
  { no: 'R00TEST91002', name: '가상 한빛초 운동장 정비', inst: '모의교육청', base: 98700000, est: 89727272, close: 날(1), lo: -2, hi: 2, llr: 87.745, lic: ['조경식재공사업/0002'], aval: 5120000, ayn: 'Y', ptot: 15, pdrw: 4, dt: '2026-10-31 15:00:00', sido: '전남', mthd: '전자입찰' },
  { no: 'R00TEST91003', name: '가상 마루로 포장 보수', inst: '가상군', base: 412300000, est: 374818181, close: 날(3), lo: -3, hi: 3, llr: 89.745, lic: ['포장공사업/0003'], aval: 0, ayn: 'N', ptot: 15, pdrw: 4, dt: '2026-11-01 15:00:00', sido: '강원', mthd: '전자입찰' },
]
const 색인 = JSON.stringify({ f, r: 공고들.map((g) => f.map((k) => (g[k] === undefined ? null : g[k]))) })
const UA = { PC: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36', 폰: 'Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36' }
const b = await chromium.launch()

async function 새쪽(w, h, 폰 = true) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', isMobile: 폰, hasTouch: 폰, userAgent: 폰 ? UA.폰 : UA.PC, deviceScaleFactor: OUT ? 2 : 1 })
  await ctx.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|googlesyndication|geojs/, (r) => r.fulfill({ status: 200, body: '' }))
  await ctx.route(/firebaseio\.com|firebasedatabase\.app/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: r.request().method() === 'GET' ? 'null' : (r.request().postData() || 'null') }))
  await ctx.route(/\/data\/bidindex\.json/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 색인 }))
  await ctx.route(/\/data\/(overview|sim|basket|first|agency)[^/]*\.json/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await ctx.route(/\/data\/bidresult\.json/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ built: '2026-11-03 06:00', f: [], r: {} }) }))
  await ctx.addInitScript(() => { try { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); sessionStorage.setItem('kcm_notice_seen', '2026-10-업체'); sessionStorage.setItem('kcm_visit_s', '1') } catch (e) { /* 없음 */ } })
  const p = await ctx.newPage()
  const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
  p.on('dialog', (d) => d.dismiss())
  return { ctx, p, 오류 }
}
/* 이름표로 칸 찾기 — «기초금액 (원)» · «추정가격 (원)» · «A값 (원)» · «순공사원가 (원)» */
const 필드 = (p, 이름) => p.locator('.field', { has: p.locator('label', { hasText: 이름 }) }).first()
const 칸 = (p, 이름) => 필드(p, 이름).locator('input').first()
const 줄 = async (p, 이름) => { const l = 필드(p, 이름).locator('.amt-read'); return (await l.count()) ? { 글: (await l.first().innerText()).trim(), bad: /\bbad\b/.test(await l.first().getAttribute('class')) } : null }
const 답 = (p) => p.evaluate(() => { const a = document.querySelector('.hero .amt'), s = document.querySelector('.hero .sub'); return a ? (a.innerText.replace(/\s/g, '') + ' | ' + (s ? s.innerText.replace(/\s+/g, ' ').trim() : '')) : '' })
const 넘침 = (p) => p.evaluate(() => document.documentElement.scrollWidth - innerWidth)
const 지우고친다 = async (p, 이름, 글) => { const c = 칸(p, 이름); await c.click(); await c.press('Control+A'); await c.press('Backspace'); if (글) await p.keyboard.type(글, { delay: 15 }); await p.waitForTimeout(250) }
const 벗어남 = async (p) => { await p.evaluate(() => document.activeElement && document.activeElement.blur()); await p.waitForTimeout(200) }

console.log('① PC 1280 — 기초금액 칸(공고 안 고름)')
let 답285 = '', 답385 = ''
{
  const { ctx, p, 오류 } = await 새쪽(1280, 900, false)
  await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('#go-base', { timeout: 15000 })
  const 기초 = '기초금액 (원)'
  await 지우고친다(p, 기초, '285000000')
  ok('숫자로 치면 예전처럼 칠 때마다 쉼표 «285,000,000»', (await 칸(p, 기초).inputValue()) === '285,000,000', await 칸(p, 기초).inputValue())
  const z1 = await 줄(p, 기초)
  ok('칸 아래 «= 2억 8,500만 원»(괄호 없음 — 칸에 이미 숫자)', z1 && z1.글 === '= 2억 8,500만 원' && !z1.bad, z1)
  await p.waitForSelector('.hero .amt', { timeout: 8000 })
  답285 = await 답(p)
  ok('투찰금액이 나옴(숫자)', /\d{3},\d{3}/.test(답285), 답285)
  /* 억 · 만으로 — 예전엔 «38,500» 이 되던 것 */
  await 지우고친다(p, 기초, '')
  ok('지우면 빈 칸 · 줄 없음 · 투찰금액 없음', (await 칸(p, 기초).inputValue()) === '' && (await 줄(p, 기초)) === null && (await 답(p)) === '', [await 칸(p, 기초).inputValue(), await 줄(p, 기초), await 답(p)])
  await 지우고친다(p, 기초, '2억 8,500만')
  ok('«2억 8,500만» 친 글이 칸에 그대로(치는 동안)', (await 칸(p, 기초).inputValue()) === '2억 8,500만', await 칸(p, 기초).inputValue())
  const z2 = await 줄(p, 기초)
  ok('칸 아래 «= 2억 8,500만 원 (285,000,000원)»', z2 && z2.글 === '= 2억 8,500만 원 (285,000,000원)', z2)
  ok('투찰금액 = 숫자로 친 것과 같음(예전: 28,500원으로 셈)', (await 답(p)) === 답285, [await 답(p), 답285])
  await 벗어남(p)
  ok('칸을 벗어나면 «285,000,000» · 줄 «= 2억 8,500만 원»', (await 칸(p, 기초).inputValue()) === '285,000,000' && (await 줄(p, 기초))?.글 === '= 2억 8,500만 원', [await 칸(p, 기초).inputValue(), await 줄(p, 기초)])
  ok('벗어난 뒤에도 같은 투찰금액', (await 답(p)) === 답285, await 답(p))
  /* 3.85억 · 붙여넣기 */
  await 칸(p, 기초).fill('385000000'); await p.waitForTimeout(300)
  답385 = await 답(p)
  await 칸(p, 기초).fill('3.85억'); await p.waitForTimeout(300)
  ok('«3.85억» → 줄 «= 3억 8,500만 원 (385,000,000원)» · 투찰금액 = 385000000 과 같음', (await 줄(p, 기초))?.글 === '= 3억 8,500만 원 (385,000,000원)' && (await 답(p)) === 답385 && 답385 !== 답285, [await 줄(p, 기초), await 답(p), 답385])
  await 칸(p, 기초).fill('3억 8,500만원'); await p.waitForTimeout(300)
  ok('붙여넣은 «3억 8,500만원» → 같은 투찰금액', (await 답(p)) === 답385, await 답(p))
  await 칸(p, 기초).fill('385,000,000원'); await p.waitForTimeout(300)
  ok('붙여넣은 «385,000,000원» → 같은 투찰금액(예전에도 되던 것 그대로)', (await 답(p)) === 답385, await 답(p))
  await 칸(p, 기초).fill('3억8500만'); await p.waitForTimeout(300)
  ok('붙여 쓴 «3억8500만» → 같은 투찰금액', (await 답(p)) === 답385, await 답(p))
  /* 못 읽는 글 */
  await 지우고친다(p, 기초, '삼억')
  const z3 = await 줄(p, 기초)
  ok('«삼억» → 치는 동안 ⚠ 줄(빨강) · 투찰금액 안 냄', z3 && z3.bad && /읽지 못했습니다/.test(z3.글) && (await 답(p)) === '', [z3, await 답(p)])
  await 벗어남(p)
  ok('벗어나면 빈 칸(예전처럼) · 줄 없음', (await 칸(p, 기초).inputValue()) === '' && (await 줄(p, 기초)) === null, [await 칸(p, 기초).inputValue(), await 줄(p, 기초)])
  ok('폰 숫자 자판 그대로(inputmode=numeric) · id go-base 그대로', (await 칸(p, 기초).getAttribute('inputmode')) === 'numeric' && (await 칸(p, 기초).getAttribute('id')) === 'go-base')

  console.log('② PC 1280 — 추정가격 · A값 · 순공사원가')
  await 칸(p, 기초).fill('385000000'); await p.waitForTimeout(300)
  const 자동 = await 답(p)
  const 추정 = '추정가격 (원)'
  await 지우고친다(p, 추정, '12억')
  ok('추정가격 «12억» → 줄 «= 12억 원 (1,200,000,000원)»', (await 줄(p, 추정))?.글 === '= 12억 원 (1,200,000,000원)', await 줄(p, 추정))
  const 답12억 = await 답(p)
  ok('추정가격 «12억» 이 셈에 들어감(10억 넘어 하한율 구간이 바뀜 → 자동과 다른 금액)', 답12억 !== 자동 && 답12억 !== '', [답12억, 자동])
  await 칸(p, 추정).fill('1200000000'); await p.waitForTimeout(300)
  ok('숫자 «1200000000» → 같은 금액 · 칸 «1,200,000,000»', (await 답(p)) === 답12억 && (await 칸(p, 추정).inputValue()) === '1,200,000,000', [await 답(p), await 칸(p, 추정).inputValue()])
  await 지우고친다(p, 추정, '')
  ok('추정가격 비우면 다시 자동 금액 · 줄 없음', (await 답(p)) === 자동 && (await 줄(p, 추정)) === null, [await 답(p), await 줄(p, 추정)])
  const A = 'A값 (원)'
  await 지우고친다(p, A, '1,394만')
  ok('A값 «1,394만» → 줄 «= 1,394만 원 (13,940,000원)»', (await 줄(p, A))?.글 === '= 1,394만 원 (13,940,000원)', await 줄(p, A))
  const 답A = await 답(p)
  ok('A값이 셈에 들어감(자동과 다른 금액)', 답A !== 자동 && 답A !== '', [답A, 자동])
  await 칸(p, A).fill('13940000'); await p.waitForTimeout(300)
  ok('숫자 «13940000» → 같은 금액 · 칸 «13,940,000» · 줄 «= 1,394만 원»', (await 답(p)) === 답A && (await 칸(p, A).inputValue()) === '13,940,000' && (await 줄(p, A))?.글 === '= 1,394만 원', [await 답(p), await 칸(p, A).inputValue(), await 줄(p, A)])
  await 칸(p, A).fill('0'); await p.waitForTimeout(250)
  ok('A값 «0» → 칸 «0»(예전처럼) · 줄 없음', (await 칸(p, A).inputValue()) === '0' && (await 줄(p, A)) === null, [await 칸(p, A).inputValue(), await 줄(p, A)])
  const 순 = '순공사원가 (원)'
  await 지우고친다(p, 순, '4억')
  const 순안내 = await 필드(p, 순).locator('label').innerText()
  ok('순공사원가 «4억»(기초 3억 8,500만보다 큼) → «기초금액보다 커서 쓰지 않습니다» = 4억으로 읽음(예전 «4» 면 안 뜸)', /기초금액보다 커서/.test(순안내) && (await 줄(p, 순))?.글 === '= 4억 원 (400,000,000원)', [순안내, await 줄(p, 순)])
  await 지우고친다(p, 순, '3억 2천만')
  ok('순공사원가 «3억 2천만» → 줄 «= 3억 2,000만 원 (320,000,000원)» · 안내 그대로', (await 줄(p, 순))?.글 === '= 3억 2,000만 원 (320,000,000원)' && !/커서/.test(await 필드(p, 순).locator('label').innerText()), await 줄(p, 순))
  const 답순 = await 답(p)
  await 칸(p, 순).fill('320000000'); await p.waitForTimeout(300)
  ok('숫자 «320000000» → 같은 답', (await 답(p)) === 답순, [await 답(p), 답순])
  ok('PC 1280 넘침 0', (await 넘침(p)) <= 0, await 넘침(p))
  if (OUT) {
    await p.evaluate(() => { const x = document.querySelector('.insa-x'); if (x) x.click() })   /* 인사 알림은 닫고 찍음 */
    await 지우고친다(p, 기초, '3억 8,500만')
    await 필드(p, 기초).scrollIntoViewIfNeeded()
    await p.waitForTimeout(400)
    await p.screenshot({ path: OUT + '/바로투찰_금액칸_PC.png' })
  }
  ok('오류 0(①②)', !오류.length, 오류)
  await ctx.close()
}

console.log('③ PC 1280 — «공고 찾기» 칸에 금액')
{
  const { ctx, p, 오류 } = await 새쪽(1280, 900, false)
  await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('button.pickrow', { timeout: 15000 })
  const 찾기 = p.locator('input[placeholder*="도로포장"]').first()
  await 찾기.fill('285000000'); await p.waitForTimeout(600)
  const 옛답 = await 답(p)
  ok('숫자 «285000000» → 기초금액(예전 그대로) · 같은 투찰금액', (await 칸(p, '기초금액 (원)').inputValue()) === '285,000,000' && 옛답 === 답285, [await 칸(p, '기초금액 (원)').inputValue(), 옛답, 답285])
  await 찾기.fill('2억 8,500만'); await p.waitForTimeout(600)
  ok('«2억 8,500만» → 기초금액 285,000,000 · 줄 «= 2억 8,500만 원»', (await 칸(p, '기초금액 (원)').inputValue()) === '285,000,000' && (await 줄(p, '기초금액 (원)'))?.글 === '= 2억 8,500만 원', [await 칸(p, '기초금액 (원)').inputValue(), await 줄(p, '기초금액 (원)')])
  ok('같은 투찰금액 · 공고 목록 안 뜸(금액으로 알아봄)', (await 답(p)) === 답285 && (await p.locator('button.pickrow').count()) === 0, [await 답(p), await p.locator('button.pickrow').count()])
  await 찾기.fill('3.85억'); await p.waitForTimeout(600)
  ok('«3.85억» → 385000000 과 같은 투찰금액', (await 답(p)) === 답385, await 답(p))
  await 찾기.fill('도로 2억'); await p.waitForTimeout(600)
  ok('«도로 2억» → 금액 아님 · 공고 이름으로 찾기(없음 안내)', /마감 전 공사 공고 중에는 없습니다/.test(await p.locator('body').innerText()), '')
  await 찾기.fill('새솔'); await p.waitForTimeout(600)
  ok('낱말 «새솔» → 공고 목록(예전 그대로)', (await p.locator('button.pickrow', { hasText: '새솔천' }).count()) === 1, await p.locator('button.pickrow').count())

  console.log('④ 공고 고르기 → 공고 값 · 값 고치기')
  await p.locator('button.pickrow', { hasText: '새솔천' }).click()
  await p.waitForSelector('.hero .amt', { timeout: 8000 })
  await p.waitForTimeout(600)
  const 공고답 = await 답(p)
  const 접힘 = p.locator('button.inbrief')
  if (await 접힘.count()) await 접힘.click()
  await p.waitForSelector('#go-base', { timeout: 5000 })
  ok('공고 기초금액이 칸에 «244,600,000» · 줄 «= 2억 4,460만 원»', (await 칸(p, '기초금액 (원)').inputValue()) === '244,600,000' && (await 줄(p, '기초금액 (원)'))?.글 === '= 2억 4,460만 원', [await 칸(p, '기초금액 (원)').inputValue(), await 줄(p, '기초금액 (원)')])
  ok('공고 A값이 칸에 «13,940,000» · 줄 «= 1,394만 원»', (await 칸(p, 'A값 (원)').inputValue()) === '13,940,000' && (await 줄(p, 'A값 (원)'))?.글 === '= 1,394만 원', [await 칸(p, 'A값 (원)').inputValue(), await 줄(p, 'A값 (원)')])
  await 지우고친다(p, '기초금액 (원)', '2억 4,460만')
  ok('값 고치기 «2억 4,460만» → 공고 값과 같은 투찰금액', (await 답(p)) === 공고답, [await 답(p), 공고답])
  await 벗어남(p)
  /* 다른 공고로 바꾸면 그 공고 값(친 글은 남지 않음) */
  await p.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === '지우기'); if (b) b.click() })
  await p.waitForTimeout(400)
  const 줄3 = p.locator('button.pickrow', { hasText: '마루로' })
  await 줄3.scrollIntoViewIfNeeded(); await 줄3.click()
  await p.waitForSelector('.hero .amt', { timeout: 8000 })
  const 접힘2 = p.locator('button.inbrief')
  if (await 접힘2.count()) await 접힘2.click()
  await p.waitForSelector('#go-base', { timeout: 5000 })
  ok('다른 공고(마루로) → 칸 «412,300,000» · A값 비어 있음(A값 미적용)', (await 칸(p, '기초금액 (원)').inputValue()) === '412,300,000' && (await 칸(p, 'A값 (원)').inputValue()) === '', [await 칸(p, '기초금액 (원)').inputValue(), await 칸(p, 'A값 (원)').inputValue()])
  ok('오류 0(③④)', !오류.length, 오류)
  await ctx.close()
}

console.log('⑤ 폰 390 · 360 · 320')
for (const [w, h] of [[390, 844], [360, 740], [320, 640]]) {
  const { ctx, p, 오류 } = await 새쪽(w, h)
  await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('#go-base', { timeout: 15000 })
  const 기초 = '기초금액 (원)'
  await 칸(p, 기초).scrollIntoViewIfNeeded()
  await 지우고친다(p, 기초, '285000000')
  ok(`폰 ${w}: 숫자 자판 칸 · 칠 때마다 쉼표 · 줄 «= 2억 8,500만 원»`, (await 칸(p, 기초).getAttribute('inputmode')) === 'numeric' && (await 칸(p, 기초).inputValue()) === '285,000,000' && (await 줄(p, 기초))?.글 === '= 2억 8,500만 원', [await 칸(p, 기초).inputValue(), await 줄(p, 기초)])
  ok(`폰 ${w}: PC 와 같은 투찰금액`, (await 답(p)) === 답285, [await 답(p), 답285])
  await 칸(p, 기초).fill('3억 8,500만원'); await p.waitForTimeout(300)
  ok(`폰 ${w}: 붙여넣은 «3억 8,500만원» → 같은 투찰금액 · 줄 보임`, (await 답(p)) === 답385 && (await 줄(p, 기초))?.글 === '= 3억 8,500만 원 (385,000,000원)', [await 답(p), await 줄(p, 기초)])
  await 칸(p, 'A값 (원)').fill('삼백만'); await p.waitForTimeout(300)
  ok(`폰 ${w}: 못 읽는 글 ⚠ 줄도 칸 안에(넘침 0)`, (await 줄(p, 'A값 (원)'))?.bad === true && (await 넘침(p)) <= 0, [await 줄(p, 'A값 (원)'), await 넘침(p)])
  ok(`폰 ${w} 넘침 0`, (await 넘침(p)) <= 0, await 넘침(p))
  if (OUT && w === 390) {
    await p.evaluate(() => { const x = document.querySelector('.insa-x'); if (x) x.click() })   /* 인사 알림은 닫고 찍음 */
    await 칸(p, 'A값 (원)').fill('1,394만'); await p.waitForTimeout(300)
    await 벗어남(p)
    await 필드(p, 기초).scrollIntoViewIfNeeded()
    await p.evaluate(() => window.scrollBy(0, -90))
    await p.waitForTimeout(400)
    await p.screenshot({ path: OUT + '/바로투찰_금액칸_폰390.png' })
  }
  ok(`오류 0(폰 ${w})`, !오류.length, 오류)
  await ctx.close()
}

console.log('⑥ 마이컨맵 단축키 /calc#go-base (G188)')
{
  const { ctx, p, 오류 } = await 새쪽(390, 844)
  await p.goto(BASE + '/calc#go-base', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('#go-base', { timeout: 15000 })
  await p.waitForFunction(() => document.activeElement && document.activeElement.id === 'go-base', null, { timeout: 6000 }).catch(() => {})
  ok('기초금액 칸에 커서', await p.evaluate(() => document.activeElement && document.activeElement.id === 'go-base'), await p.evaluate(() => document.activeElement && document.activeElement.id))
  await p.keyboard.type('98700000', { delay: 10 }); await p.waitForTimeout(300)
  ok('커서 자리에서 바로 숫자 → «98,700,000» · 줄 «= 9,870만 원»', (await 칸(p, '기초금액 (원)').inputValue()) === '98,700,000' && (await 줄(p, '기초금액 (원)'))?.글 === '= 9,870만 원', [await 칸(p, '기초금액 (원)').inputValue(), await 줄(p, '기초금액 (원)')])
  ok('오류 0(⑥)', !오류.length, 오류)
  await ctx.close()
}

await b.close()
console.log(`\n${bad ? '✗' : '✓'} 시험_바로투찰금액화면 ${n - bad}/${n}`)
process.exit(bad ? 1 : 0)
