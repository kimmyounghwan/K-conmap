/**
 * 🧪 G557 계약 준비물 계산기(/tools/contract-ready) — 계약보증금 · 공사이행보증서 · 보증서 날짜 · 인지세 (2026-11-06)
 *   lib 모드(주소 없이):  LANG=C.UTF-8 node tools/시험_계약준비.mjs          — lib/계약준비.js · tools.json · 빠른찾기
 *   화면 모드(구운 사이트): LANG=C.UTF-8 node tools/시험_계약준비.mjs http://127.0.0.1:4986   · OUT=폴더 면 화면 사진
 *   소장님 「1번 부터 5번까지 작업해줘」 — 카페 도구 후보 ③(11-05 카페: 나라장터 수의계약 계약보증서 날짜 · 공채)
 *   ① 인지세(인지세법 제3조①1 · 3): 구간 끝 값(1천만 · 3천만 · 5천만 · 1억 · 10억 «이하» / 1원 넘음) · 증액 변경은 늘어난 세액만 · 감액 0(시행령 제12조)
 *   ② 이행보증(국가 시행령 제50조 · 제52조 · 지방 시행령 제51조 · 제53조): 10% · 40% · 70% 미만 50% · 고시 5 · 20 · 30 · 장기계속 총공사금액 ·
 *      국가 장기계속 이행보증서는 «확인» · 5천만원 이하 면제 · 원 미만 올림
 *   ③ 보증기간(국가 시행규칙 제55조①3나 · 지방 제53조①3나): 계약기간 첫날 ~ 끝날 · 끝날이 빠르면 알림
 *   ④ 글: tools.json · «무료» · «클로드» 없음 · 공채는 셈 안 함(근거 법 둘) · 빠른찾기
 *   ⑤ 화면: 예시 → 2,500만 · 1억 · 날짜 · 15만 · 체크(70% 미만 · 고시 · 장기 · 변경) · 지방 · 면제 판정 · 하자 링크 · 표 · 폭 320 · 390 · 1280 넘침 0 · 오류 0
 * 가상 자료만 씀 · 인터넷 안 부름.
 */
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
const require = createRequire(import.meta.url)
const 여기 = path.dirname(fileURLToPath(import.meta.url))
const 뿌리 = path.join(여기, '..')
const BASE = process.argv[2] || ''
const OUT = process.env.OUT || ''
let bad = 0, n = 0
const ok = (이름, c, got) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (c || got === undefined ? '' : ' = ' + JSON.stringify(got).slice(0, 600))) }
const L = await import(pathToFileURL(path.join(뿌리, 'web/src/lib/계약준비.js')).href)

console.log('① 인지세')
{
  const 값 = [[0, 0], [10_000_000, 0], [10_000_001, 20_000], [30_000_000, 20_000], [30_000_001, 40_000], [50_000_000, 40_000], [50_000_001, 70_000],
    [100_000_000, 70_000], [100_000_001, 150_000], [1_000_000_000, 150_000], [1_000_000_001, 350_000], [25_000_000_000, 350_000]]
  const 틀린 = 값.filter(([a, b]) => L.인지세(a) !== b).map(([a, b]) => [a, b, L.인지세(a)])
  ok('구간 끝 값 열두 개(1천만원 이하 없음 · «이하» 는 그 칸 · 1원 넘으면 다음 칸)', !틀린.length, 틀린)
  ok('표 다섯 칸 · 2만 · 4만 · 7만 · 15만 · 35만', L.인지세표.map((x) => x.세액).join() === '20000,40000,70000,150000,350000', L.인지세표.map((x) => x.세액))
  ok('증액 변경 9천만 → 1억 2천만: 15만 − 7만 = 8만', L.변경인지세(90_000_000, 120_000_000) === 80_000, L.변경인지세(90_000_000, 120_000_000))
  ok('같은 칸 안 증액(1억 2천만 → 1억 5천만) 0 · 감액 0', L.변경인지세(120_000_000, 150_000_000) === 0 && L.변경인지세(150_000_000, 120_000_000) === 0)
}
console.log('② 계약보증금 · 공사이행보증서')
{
  const a = L.이행보증({ 발주: '국가', 계약금액: 250_000_000 })
  ok('국가 2억 5천만: 계약보증금 2,500만(10%) · 이행보증서 1억(40%) · 면제 아님', a.보증금 === 25_000_000 && a.이행보증금 === 100_000_000 && a.보증율 === 10 && a.이행율 === 40 && !a.면제될수, a)
  const b = L.이행보증({ 발주: '국가', 계약금액: 250_000_000, 칠십미만: true })
  ok('예정가격 70% 미만 낙찰: 이행보증서 50% = 1억 2,500만 · 계약보증금 그대로 10%', b.이행보증금 === 125_000_000 && b.보증금 === 25_000_000, b)
  const c = L.이행보증({ 발주: '지방', 계약금액: 250_000_000, 고시: true })
  const d = L.이행보증({ 발주: '지방', 계약금액: 250_000_000, 고시: true, 칠십미만: true })
  ok('고시 기간: 5% = 1,250만 · 이행 20% = 5천만 · 70% 미만 30% = 7,500만', c.보증금 === 12_500_000 && c.이행보증금 === 50_000_000 && d.이행보증금 === 75_000_000, [c, d])
  const e = L.이행보증({ 발주: '국가', 계약금액: 300_000_000, 장기: true, 총공사: 1_200_000_000 })
  const f = L.이행보증({ 발주: '지방', 계약금액: 300_000_000, 장기: true, 총공사: 1_200_000_000 })
  ok('장기계속: 총공사 12억 기준 계약보증금 1억 2천만 · 국가 이행보증서는 «확인»(null) · 지방은 총공사 40% = 4억 8천만', e.보증금 === 120_000_000 && e.이행보증금 === null && f.보증금 === 120_000_000 && f.이행보증금 === 480_000_000, [e, f])
  ok('장기계속인데 총공사금액 비면 계약금액 기준', L.이행보증({ 발주: '국가', 계약금액: 300_000_000, 장기: true, 총공사: 0 }).보증금 === 30_000_000)
  ok('5천만원 이하 면제될 수 있음 · 5천만 1원은 아님', L.이행보증({ 계약금액: 50_000_000 }).면제될수 === true && L.이행보증({ 계약금액: 50_000_001 }).면제될수 === false)
  ok('«10% 이상» — 원 미만 올림(1억 2,345만 6,789 → 1,234만 5,679)', L.이행보증({ 계약금액: 123_456_789 }).보증금 === 12_345_679, L.이행보증({ 계약금액: 123_456_789 }).보증금)
  ok('금액 없으면 0 · 이행보증서 null', L.이행보증({}).보증금 === 0 && L.이행보증({}).이행보증금 === null)
}
console.log('③ 보증서 날짜')
{
  const g = L.보증기간('2026-11-16', '2027-03-31')
  ok('계약기간 첫날 ~ 끝날 그대로', g && g.첫날 === '2026-11-16' && g.끝날 === '2027-03-31', g)
  ok('끝날이 첫날보다 빠르면 틀림 · 날짜 아니면 null', L.보증기간('2027-03-31', '2026-11-16').틀림 === true && L.보증기간('', '2027-03-31') === null && L.보증기간('2026-11', '2027-03-31') === null)
  ok('피보증인 — 국가 대한민국정부 · 지방 그 지방자치단체', L.발주들.map((x) => x.피보증인).join() === '대한민국정부,그 지방자치단체')
  ok('근거 — 시행규칙 제55조① · 제53조① · 계약 확정 제11조② · 제14조③ · 시행령 제50조 · 제51조 · 인지세법', /시행규칙 제55조①/.test(L.근거.국가) && /시행규칙 제53조①/.test(L.근거.지방) && /제11조②/.test(L.근거.국가) && /제14조③/.test(L.근거.지방) && /시행령 제50조 · 제52조①/.test(L.근거.국가) && /시행령 제51조/.test(L.근거.지방) && /인지세법 제3조/.test(L.근거.인지세))
}
console.log('④ 글 · 공채 · 빠른찾기')
{
  const 자료 = JSON.parse(fs.readFileSync(path.join(뿌리, 'web/src/data/tools.json'), 'utf8'))
  const t = 자료.tools.find((x) => x.slug === 'contract-ready')
  ok('tools.json contract-ready · cat work · tail 빈 글(제목에 이미 있는 말 — 구운 제목 겹침 없게 · G558 때 고침) · 설명 넷(보증금 · 날짜 · 인지세 · 공채)', !!t && t.cat === 'work' && t.tail === '' && t.secs.length === 4 && t.secs.map((x) => x.h).join() === '계약보증금 · 공사이행보증서,보증서 날짜,인지세,공채', t && [t.cat, t.tail, t.secs.map((x) => x.h)])
  const 모두 = JSON.stringify(t || {}) + JSON.stringify(L)
  ok('«무료» · «클로드» 없음', !/무료|클로드/.test(모두))
  ok('공채는 셈 안 함 — 지역개발채권(조례) · 도시철도채권(대통령령) · 근거 둘', L.공채글.length === 3 && /조례/.test(L.공채글[0]) && /대통령령/.test(L.공채글[1]) && /셈하지 않습니다/.test(L.공채글[2]) && /지방공기업법 제19조③④ · 도시철도법 제21조/.test(L.공채근거))
  ok('설명 글 숫자 = lib 표(2만 · 4만 · 7만 · 15만 · 35만)', /2만원 · 5천만원 이하 4만원 · 1억원 이하 7만원 · 10억원 이하 15만원 · 10억원 넘으면 35만원/.test(JSON.stringify(t.secs[2])))
  const 찾 = await import(pathToFileURL(path.join(뿌리, 'web/src/lib/빠른찾기.js')).href)
  const 읽 = (x) => JSON.parse(fs.readFileSync(path.join(뿌리, 'web/src/data', x), 'utf8'))
  const 목 = 찾.목록만들기({ 탭: [], tools: 읽('tools.json'), forms: 읽('forms-min.json'), change: 읽('change.json'), guide: 읽('guide.json'), cad: 읽('cad.json') })
  const 맨위 = (q) => (찾.찾기(목, q, 3)[0] || {}).to
  const 말 = ['계약보증금', '공사이행보증서', '인지세', '지역개발채권']
  ok('빠른찾기 «계약보증금» · «공사이행보증서» · «인지세» · «지역개발채권» → /tools/contract-ready', 말.every((q) => 맨위(q) === '/tools/contract-ready'), 말.map(맨위))
  ok('빠른찾기 «하자보증» 은 그대로 하자 도구', 맨위('하자보증') === '/tools/defect-period', 맨위('하자보증'))
  const 칸 = fs.readFileSync(path.join(뿌리, 'web/src/tools/계약칸.jsx'), 'utf8')
  ok('낙찰 뒤 할 일(after-award) 아래에 이 도구 링크 · 등록(계약CALCS · 계약EXAMPLES)', /<Link to="\/tools\/contract-ready" className="kr-link">계약 준비물 계산기 →<\/Link>/.test(칸) && /'contract-ready': ContractReady,/.test(칸) && /'contract-ready': \{ 글: '국가 공사 2억 5천만 원/.test(칸))
}

if (BASE) {
  const { chromium } = require('playwright')
  const b = await chromium.launch()
  async function 새쪽(w, h, 폰, ctx0) {
    const ctx = ctx0 || await b.newContext({ viewport: { width: w, height: h }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', isMobile: 폰, hasTouch: 폰, deviceScaleFactor: 2,
      userAgent: 폰 ? 'Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36' : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36' })
    if (!ctx0) {
      await ctx.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|googlesyndication|geojs/, (r) => r.fulfill({ status: 200, body: '' }))
      await ctx.route(/firebaseio\.com|firebasedatabase\.app/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
    }
    const p = await ctx.newPage()
    const 오류 = []
    p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
    await p.goto(BASE + '/tools/contract-ready', { waitUntil: 'domcontentloaded' })
    await p.waitForSelector('.tool.kr', { timeout: 20000 }); await p.waitForTimeout(600)
    return { ctx, p, 오류 }
  }
  const 넘침 = (p) => p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  const 나온 = (p) => p.evaluate(() => [...document.querySelectorAll('.tool.kr .out-row, .tool.kr .tl-out > *, .tool.kr [class*=out] > div')].map((e) => e.innerText.replace(/\s+/g, ' ').trim()).filter(Boolean).join(' | '))
  const 본문 = (p) => p.evaluate(() => (document.querySelector('.tool.kr') || {}).innerText || '')
  console.log('⑤ 화면 — 폰 390')
  {
    const { ctx, p, 오류 } = await 새쪽(390, 844, true)
    await p.locator('button', { hasText: '예시로 해 보기' }).first().click(); await p.waitForTimeout(500)
    let 글 = await 본문(p)
    ok('예시(국가 2억 5천만 · 11. 16. ~ 3. 31.) → 계약보증금 25,000,000원 · 이행보증서 100,000,000원 · 날짜 · 인지세 150,000원', /25,000,000원/.test(글) && /100,000,000원/.test(글) && /2026\. 11\. 16\. ~ 2027\. 3\. 31\. 이후/.test(글) && /150,000원/.test(글), 글.slice(0, 600))
    ok('피보증인 대한민국정부 · «2026. 5. 12.부터 10%» · 하자 링크', /대한민국정부/.test(글) && /2026\. 5\. 12\.부터 10%/.test(글) && (await p.locator('.tool.kr a.kr-link[href="/tools/defect-period"]').count()) === 1)
    if (OUT) {
      await p.evaluate(() => { for (const e of document.querySelectorAll('body *')) { const s = getComputedStyle(e); if (s.position === 'fixed' || s.position === 'sticky') e.style.setProperty('display', 'none', 'important') } })
      await p.locator('.tool.kr').screenshot({ path: OUT + '/계약준비_예시_폰390.png' })
    }
    await p.locator('.kt-chk', { hasText: '70% 미만' }).locator('input').check(); await p.waitForTimeout(150)
    글 = await 본문(p)
    ok('70% 미만 체크 → 이행보증서 (50%) 125,000,000원', /공사이행보증서 \(50%\)/.test(글) && /125,000,000원/.test(글))
    await p.locator('.kt-chk', { hasText: '경제위기' }).locator('input').check(); await p.waitForTimeout(150)
    글 = await 본문(p)
    ok('고시 기간 체크 → 계약보증금 (5%) 12,500,000원 · 이행 (30%) 75,000,000원', /계약금액의 5%/.test(글) && /12,500,000원/.test(글) && /공사이행보증서 \(30%\)/.test(글) && /75,000,000원/.test(글))
    await p.locator('.kt-chk', { hasText: '경제위기' }).locator('input').uncheck(); await p.locator('.kt-chk', { hasText: '70% 미만' }).locator('input').uncheck(); await p.waitForTimeout(150)
    await p.locator('.kt-chk', { hasText: '장기계속' }).locator('input').check(); await p.waitForTimeout(150)
    await p.locator('.tool.kr input[placeholder="1,200,000,000"]').fill('1200000000'); await p.waitForTimeout(250)
    글 = await 본문(p)
    ok('장기계속 + 총공사 12억 → 총공사금액의 10% 120,000,000원 · 국가 이행보증서 «공고 · 계약담당 확인»', /총공사금액의 10%/.test(글) && /120,000,000원/.test(글) && /공고 · 계약담당 확인/.test(글))
    await p.locator('.tool.kr select').first().selectOption('지방'); await p.waitForTimeout(200)
    글 = await 본문(p)
    ok('지방 → 이행보증서 총공사 40% 480,000,000원 · 피보증인 «그 지방자치단체» · «일괄입찰» · 근거 지방계약법', /480,000,000원/.test(글) && /그 지방자치단체/.test(글) && /일괄입찰/.test(글) && /지방계약법 제14조③ · 제15조 · 시행령 제51조/.test(글), 글.slice(0, 900))
    await p.locator('.kt-chk', { hasText: '장기계속' }).locator('input').uncheck(); await p.waitForTimeout(150)
    ok('폰 390 넘침 0 · 오류 0', (await 넘침(p)) <= 0 && !오류.length, [await 넘침(p), 오류])
    /* 다시 열면 넣은 값 남음(use칸) */
    const { p: p2, 오류: 오류2 } = await 새쪽(390, 844, true, ctx)
    ok('다시 열면 지방 · 2억 5천만 그대로', (await p2.locator('.tool.kr select').first().inputValue()) === '지방' && /25,000,000원/.test(await 본문(p2)) && !오류2.length)
    await ctx.close()
  }
  console.log('⑤ 폭 320 · 1280 · 면제 · 변경 · 표')
  {
    const { ctx, p, 오류 } = await 새쪽(320, 640, true)
    await p.locator('button', { hasText: '예시로 해 보기' }).first().click(); await p.waitForTimeout(400)
    const 칸 = p.locator('.tool.kr input[placeholder="250,000,000"]')
    await 칸.fill('30000000'); await p.waitForTimeout(250)
    let 글 = await 본문(p)
    ok('3천만 → 면제될 수 있음 판정 · 확약 문서 · 인지세 20,000원 · 계약보증금 3,000,000원', /면제할 수 있습니다/.test(글) && /확약하는 문서/.test(글) && /20,000원/.test(글) && /3,000,000원/.test(글))
    await 칸.fill('9000000'); await p.waitForTimeout(250)
    글 = await 본문(p)
    ok('9백만 → 인지세 «없음 (1천만원 이하)»', /없음 \(1천만원 이하\)/.test(글))
    await 칸.fill('120000000'); await p.locator('.kt-chk', { hasText: '변경계약' }).locator('input').check(); await p.waitForTimeout(150)
    await p.locator('.tool.kr input[placeholder="200,000,000"]').fill('90000000'); await p.waitForTimeout(250)
    글 = await 본문(p)
    ok('변경계약 9천만 → 1억 2천만 → 인지세 (늘어난 만큼) 80,000원 · 칸 이름 «바뀐 뒤 계약금액»', /인지세 \(늘어난 만큼\)/.test(글) && /80,000원/.test(글) && /바뀐 뒤 계약금액/.test(글))
    await p.locator('.tool.kr details.kt-all summary').click(); await p.waitForTimeout(150)
    글 = await 본문(p)
    ok('표 열면 인지세 여섯 줄(없음 + 다섯) · 공채 셋 · 근거', (await p.locator('.tool.kr details.kt-all .kt-allg').first().locator('.kt-allr').count()) === 6 && (await p.locator('.tool.kr .kr-p').count()) === 3 && /지방공기업법 제19조/.test(글))
    ok('도구 안 «무료» · «클로드» · NaN · undefined 없음', !/무료|클로드|NaN|undefined/.test(글))
    ok('320 넘침 0 · 오류 0', (await 넘침(p)) <= 0 && !오류.length, [await 넘침(p), 오류])
    await ctx.close()
  }
  {
    const { ctx, p, 오류 } = await 새쪽(1280, 860, false)
    await p.locator('button', { hasText: '예시로 해 보기' }).first().click(); await p.waitForTimeout(400)
    const 글 = await 본문(p)
    ok('PC 1280 — 예시 값 · 넘침 0 · 오류 0', /25,000,000원/.test(글) && /150,000원/.test(글) && (await 넘침(p)) <= 0 && !오류.length, 오류)
    if (OUT) await p.locator('.tool.kr').screenshot({ path: OUT + '/계약준비_예시_PC1280.png' })
    await ctx.close()
  }
  await b.close()
}
console.log(`\n${bad ? '✗' : '✓'} 시험_계약준비 ${n - bad}/${n}`)
if (bad) process.exit(1)
