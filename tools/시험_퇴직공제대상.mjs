/**
 * 🧪 G558 건설근로자 퇴직공제 가입 대상 판단기(/tools/toejik-check) — 당연가입 · 성립 신고 14일 · 전자카드 (2026-11-06)
 *   lib 모드(주소 없이):  LANG=C.UTF-8 node tools/시험_퇴직공제대상.mjs          — lib/퇴직공제대상.js · 낙찰 뒤 할 일 · tools.json · 빠른찾기
 *   화면 모드(구운 사이트): LANG=C.UTF-8 node tools/시험_퇴직공제대상.mjs http://127.0.0.1:4986   · OUT=폴더 면 화면 사진
 *   소장님 「1번 부터 5번까지 작업해줘」 — 카페 도구 후보 ④(10-20 카페 LH 착공계 · 퇴직공제 / 비대상 착오 확정)
 *   ① 판단(건설산업기본법 시행령 제83조① · 건설근로자법 시행령 제6조): 공공 1억 경계(9,999만 · 1억) · 민간 50억 경계 · 출자 · 재출자(건설 2의2 · 전문 2) ·
 *      민간투자 · 건축물 셋(금액 없이) · 전문 공사엔 건축물 호 없음 · 금액 없으면 null · 호 번호
 *   ② 성립 기한(제10조의4①): 착공 + 14일(첫날 안 셈) · 달 · 해 넘김 · 잘못된 날짜 → 빈칸 / 전자카드 3억 미만 앱
 *   ③ 낙찰 뒤 할 일(lib/계약셈.js): 국가 1억 이상 → «퇴직공제 관계 성립 신고» 착공 + 14 · 1억 미만 · 민간 49억 → 없음 · 민간 50억 → 있음 · 쉬는 날이면 미룸
 *   ④ 글: tools.json · «무료» · «클로드» 없음 · 빠른찾기(«퇴직공제» 는 그대로 집계 · «당연가입» «성립신고» «퇴직공제 가입대상» → 판단기) · 집계 쪽 링크
 *   ⑤ 화면: 예시 → 대상 · 기한 2026. 11. 30. · 할 일 여섯 · 민간 + 건축물 · 전문 공사 · 대상 아님 + 임의가입 · 폭 320 · 390 · 1280 넘침 0 · 오류 0
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
const L = await import(pathToFileURL(path.join(뿌리, 'web/src/lib/퇴직공제대상.js')).href)
const 억 = 1e8

console.log('① 당연가입 판단')
{
  const 판 = (o) => L.가입판단(o)
  ok('건설 · 국가 1억 → 대상 1호 · 9,999만 → 아님', 판({ 종류: '건설', 발주: '국가', 금액: 억 }).대상 === true && 판({ 종류: '건설', 발주: '국가', 금액: 억 }).호 === '1' && 판({ 종류: '건설', 발주: '국가', 금액: 99_990_000 }).대상 === false)
  ok('건설 · 출자 1억 → 2호 · 재출자 → 2의2 · 민간투자 → 4호', 판({ 종류: '건설', 발주: '출자', 금액: 억 }).호 === '2' && 판({ 종류: '건설', 발주: '재출자', 금액: 억 }).호 === '2의2' && 판({ 종류: '건설', 발주: '민투', 금액: 억 }).호 === '4')
  ok('건설 · 민간 50억 → 7호 · 49억 9,999만 → 아님(까닭 «민간 · 50억원 미만»)', 판({ 종류: '건설', 발주: '민간', 금액: 50 * 억 }).호 === '7' && 판({ 종류: '건설', 발주: '민간', 금액: 4_999_990_000 }).대상 === false && /민간 공사 · 공사예정금액 50억원 미만/.test(판({ 종류: '건설', 발주: '민간', 금액: 4_999_990_000 }).까닭))
  ok('건설 · 민간 · 건축물(공동 3호 · 복합 5호 · 오피 6호) — 금액 없어도 대상', ['공동', '복합', '오피'].map((k) => 판({ 종류: '건설', 발주: '민간', 금액: 0, 건축: k }).호).join() === '3,5,6' && 판({ 종류: '건설', 발주: '민간', 금액: 0, 건축: '오피' }).대상 === true)
  ok('전문 공사(전기 등) · 국가 1억 → 1호 · 출자 · 재출자 → 2호 · 민간투자 → 3호 · 민간 50억 → 4호', 판({ 종류: '전문', 발주: '국가', 금액: 억 }).호 === '1' && 판({ 종류: '전문', 발주: '출자', 금액: 억 }).호 === '2' && 판({ 종류: '전문', 발주: '재출자', 금액: 억 }).호 === '2' && 판({ 종류: '전문', 발주: '민투', 금액: 억 }).호 === '3' && 판({ 종류: '전문', 발주: '민간', 금액: 50 * 억 }).호 === '4')
  ok('전문 공사엔 건축물 호 없음 — 민간 · 오피 · 3억 → 아님', 판({ 종류: '전문', 발주: '민간', 금액: 3 * 억, 건축: '오피' }).대상 === false)
  ok('금액 없으면 null · 근거는 법 이름', 판({ 종류: '건설', 발주: '국가', 금액: 0 }).대상 === null && /시행령 제83조①/.test(판({ 종류: '건설', 발주: '국가', 금액: 0 }).근거))
  ok('근거 — 건설 «건설산업기본법 시행령 제83조①1» · 전문 «건설근로자법 시행령 제6조4»', 판({ 종류: '건설', 발주: '국가', 금액: 억 }).근거 === '건설산업기본법 시행령 제83조①1' && 판({ 종류: '전문', 발주: '민간', 금액: 60 * 억 }).근거 === '건설근로자법 시행령 제6조4')
  ok('발주 모르는 값 → 국가로', 판({ 종류: '건설', 발주: '??', 금액: 억 }).호 === '1')
  ok('금액 칸 풀이 — 건설 «국가계약법 장기계속» 만(건산법 시행령 제83조①1) · 전문 «국가 · 지방»(시행령 제6조1)', /^원 · 국가계약법 장기계속계약은 연차 계약이 아닌 그 공사의 예정금액$/.test(L.금액풀이.건설) && /장기계속계약\(국가 · 지방\)은/.test(L.금액풀이.전문) && !/국가계약법/.test(L.금액풀이.전문), L.금액풀이)
}
console.log('② 성립 신고 기한 · 전자카드')
{
  ok('착공 11. 16. → 11. 30.(첫날 안 셈 · 14일째)', L.성립기한('2026-11-16') === '2026-11-30', L.성립기한('2026-11-16'))
  ok('달 · 해 넘김 — 12. 25. → 1. 8. · 2. 20. → 3. 6.', L.성립기한('2026-12-25') === '2027-01-08' && L.성립기한('2027-02-20') === '2027-03-06', [L.성립기한('2026-12-25'), L.성립기한('2027-02-20')])
  ok('잘못된 날짜 → 빈칸', L.성립기한('') === '' && L.성립기한('2026-11') === '')
  ok('전자카드 — 대상 아님 null · 2억 앱 가능 · 3억 단말기', L.전자카드(false, 2 * 억) === null && L.전자카드(true, 2 * 억).앱가능 === true && L.전자카드(true, 3 * 억).앱가능 === false)
  ok('할 일 여섯(신고 · 사업주 · 매달 · 카드 · 피공제자 · 과태료) · 근거 열쇠 모두 있음', L.할일들.map((x) => x.k).join() === '신고,사업주,매달,카드,피공제자,과태료' && L.할일들.every((x) => L.근거[x.근거]))
  ok('할 일 글 — 14일 · 다음 달 15일 · 3억원 미만 · 4시간 · 15시간 · 500만원 · 300만원', /14일 안에/.test(L.할일들[0].글) && /다음 달 15일까지/.test(L.할일들[2].글) && /3억원 미만/.test(L.할일들[3].글) && /4시간 미만이고 1주 15시간 미만/.test(L.할일들[4].글) && /500만원 이하/.test(L.할일들[5].글) && /300만원 이하/.test(L.할일들[5].글))
  ok('2027. 1. 8. 바뀜 · 임의가입 글', /2027\. 1\. 8\.부터/.test(L.바뀜) && /법률 제21852호/.test(L.바뀜) && /임의가입/.test(L.아닐때))
}
console.log('③ 낙찰 뒤 할 일 — 퇴직공제 성립 신고')
{
  const 계 = await import(pathToFileURL(path.join(뿌리, 'web/src/lib/계약셈.js')).href)
  const 일 = (o) => 계.낙찰뒤할일(o).find((x) => x.열쇠 === '퇴직공제')
  const a = 일({ 낙찰일: '2026-11-02', 착공일: '2026-11-16', 발주: '국가', 도급금액: 150_000_000 })
  ok('국가 1억 5천 · 착공 11. 16. → «퇴직공제 관계 성립 신고» 11. 30.', !!a && a.날 === '2026-11-30' && /건설근로자 퇴직공제 관계 성립 신고/.test(a.제목) && /500만 원 이하 과태료/.test(a.글), a)
  ok('국가 9천만 · 민간 49억 → 없음 · 민간 50억 → 있음 · 공공기관 1억 → 있음', !일({ 착공일: '2026-11-16', 발주: '국가', 도급금액: 90_000_000 }) && !일({ 착공일: '2026-11-16', 발주: '민간', 도급금액: 4_900_000_000 }) && !!일({ 착공일: '2026-11-16', 발주: '민간', 도급금액: 5_000_000_000 }) && !!일({ 착공일: '2026-11-16', 발주: '공공기관', 도급금액: 억 }))
  const b = 일({ 착공일: '2026-11-14', 발주: '지자체', 도급금액: 2 * 억 })
  ok('기한이 쉬는 날(11. 28. 토)이면 다음 평일로 미룸(11. 30.) 안내', !!b && b.날 === '2026-11-28' && b.미룬날 === '2026-11-30' && /민법 제161조/.test(b.글), b)
  ok('착공일 없으면 날 빈칸(늘 할 일로)', 일({ 발주: '국가', 도급금액: 2 * 억 }).날 === '')
}
console.log('④ 글 · 빠른찾기 · 링크')
{
  const 자료 = JSON.parse(fs.readFileSync(path.join(뿌리, 'web/src/data/tools.json'), 'utf8'))
  const t = 자료.tools.find((x) => x.slug === 'toejik-check')
  ok('tools.json toejik-check · cat work · 설명 셋 · 제목 «건설근로자 퇴직공제 가입 대상 판단기»', !!t && t.cat === 'work' && t.secs.length === 3 && /^건설근로자 퇴직공제 가입 대상 판단기/.test(t.title), t && [t.cat, t.secs.length, t.title])
  {
    /* 구운 제목(prerender: 제목 — tail) 에 같은 말이 두 번 나오지 않게 — 새 도구 · 계약 준비물(G557) 모두 tail 빈 글 */
    const 겹침 = (x) => !!x && !!x.tail && x.tail.split(' · ').some((w) => x.title.includes(w.trim()))
    const 새것 = 자료.tools.filter((x) => ['toejik-check', 'contract-ready'].includes(x.slug))
    ok('구운 제목 겹침 없음 — toejik-check · contract-ready tail 빈 글', 새것.length === 2 && 새것.every((x) => x.tail === '' && !겹침(x)), 새것.map((x) => [x.slug, x.tail]))
  }
  ok('«무료» · «클로드» 없음', !/무료|클로드/.test(JSON.stringify(t || {}) + JSON.stringify(L)))
  const 찾 = await import(pathToFileURL(path.join(뿌리, 'web/src/lib/빠른찾기.js')).href)
  const 읽 = (x) => JSON.parse(fs.readFileSync(path.join(뿌리, 'web/src/data', x), 'utf8'))
  const 목 = 찾.목록만들기({ 탭: [], tools: 읽('tools.json'), forms: 읽('forms-min.json'), change: 읽('change.json'), guide: 읽('guide.json'), cad: 읽('cad.json') })
  const 맨위 = (q) => (찾.찾기(목, q, 3)[0] || {}).to
  ok('빠른찾기 «퇴직공제» 는 그대로 집계(/tools/toejik)', 맨위('퇴직공제') === '/tools/toejik', 맨위('퇴직공제'))
  const 말 = ['당연가입', '성립신고', '퇴직공제 가입대상', '퇴직공제 대상']
  ok('빠른찾기 «당연가입» · «성립신고» · «퇴직공제 가입대상» · «퇴직공제 대상» → 판단기', 말.every((q) => 맨위(q) === '/tools/toejik-check'), 말.map(맨위))
  const 집계 = fs.readFileSync(path.join(뿌리, 'web/src/pages/Toejik.jsx'), 'utf8')
  const 칸 = fs.readFileSync(path.join(뿌리, 'web/src/tools/계약칸.jsx'), 'utf8')
  ok('집계 쪽 · 낙찰 뒤 할 일에 판단기 링크 · 등록(계약CALCS · EXAMPLES)', /to="\/tools\/toejik-check"/.test(집계) && /<Link to="\/tools\/toejik-check" className="kr-link">퇴직공제 가입 대상 판단기 →<\/Link>/.test(칸) && /'toejik-check': ToejikCheck,/.test(칸) && /'toejik-check': \{ 글: '지자체 발주 건설공사/.test(칸))
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
    await p.goto(BASE + '/tools/toejik-check', { waitUntil: 'domcontentloaded' })
    await p.waitForSelector('.tool.tc', { timeout: 20000 }); await p.waitForTimeout(600)
    return { ctx, p, 오류 }
  }
  const 넘침 = (p) => p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  const 본문 = (p) => p.evaluate(() => (document.querySelector('.tool.tc') || {}).innerText || '')
  const 고르기 = async (p, i, v) => { await p.locator('.tool.tc select').nth(i).selectOption(v); await p.waitForTimeout(200) }
  console.log('⑤ 화면 — 폰 390')
  {
    const { ctx, p, 오류 } = await 새쪽(390, 844, true)
    ok('처음(금액 없음) → «공사예정금액을 넣으면 판단합니다»', /공사예정금액을 넣으면 판단합니다/.test(await 본문(p)))
    await p.locator('button', { hasText: '예시로 해 보기' }).first().click(); await p.waitForTimeout(500)
    let 글 = await 본문(p)
    ok('예시(지자체 건설 1억 5천 · 11. 16. 착공) → 당연가입 · 1호 · 기한 2026. 11. 30. · 할 일 여섯', /당연가입 대상입니다/.test(글) && /시행령 제83조①1/.test(글) && /2026\. 11\. 30\./.test(글) && (await p.locator('.tc-steps li').count()) === 6, 글.slice(0, 500))
    ok('일액(8,700원 · 6,500원) · 집계 링크 · 낙찰 뒤 할 일 링크 · 2027 바뀜', /8,700원/.test(글) && /6,500원/.test(글) && (await p.locator('.tool.tc a[href="/tools/toejik"]').count()) === 1 && (await p.locator('.tool.tc a[href="/tools/after-award"]').count()) === 1 && /2027\. 1\. 8\.부터/.test(글))
    ok('전자카드 — 1억 5천은 «단말기 또는 휴대폰 앱»', /단말기 또는 휴대폰 앱/.test(글))
    ok('건설 금액 칸 풀이 «국가계약법 장기계속계약은»', /국가계약법 장기계속계약은 연차 계약이 아닌/.test(글))
    const 줄수 = await p.evaluate(() => { const l = [...document.querySelectorAll('.tool.tc .tl-lab')].find((x) => x.firstChild && /공사예정금액/.test(x.firstChild.textContent || '')); if (!l) return -1; const r = document.createRange(); r.selectNodeContents(l.firstChild); return new Set([...r.getClientRects()].map((q) => Math.round(q.top))).size })
    ok('폰 390 — 이름표 «공사예정금액» 한 줄(풀이는 다음 줄로 · 두 줄로 쪼개지지 않음)', 줄수 === 1, 줄수)
    if (OUT) {
      await p.evaluate(() => { for (const e of document.querySelectorAll('body *')) { const s = getComputedStyle(e); if (s.position === 'fixed' || s.position === 'sticky') e.style.setProperty('display', 'none', 'important') } })
      await p.locator('.tool.tc').screenshot({ path: OUT + '/퇴직공제대상_예시_폰390.png' })
    }
    const 금칸 = p.locator('.tool.tc input[placeholder="150,000,000"]')
    await 금칸.fill('90000000'); await p.waitForTimeout(250)
    글 = await 본문(p)
    ok('9천만 → «당연가입 대상이 아닙니다» · 임의가입 · 할 일 안 보임', /당연가입 대상이 아닙니다/.test(글) && /임의가입/.test(글) && (await p.locator('.tc-steps li').count()) === 0)
    await 고르기(p, 1, '민간'); await 금칸.fill('1000000000'); await p.waitForTimeout(250)
    ok('민간 10억 → 건축물 칸 나옴 · 아님', (await p.locator('.tool.tc select').count()) === 3 && /당연가입 대상이 아닙니다/.test(await 본문(p)))
    await 고르기(p, 2, '오피')
    글 = await 본문(p)
    ok('민간 + 200실 이상 오피스텔 → 대상 · 6호 · 금액과 관계없이', /당연가입 대상입니다/.test(글) && /시행령 제83조①6/.test(글) && /금액과 관계없이/.test(글))
    await 고르기(p, 0, '전문'); await p.waitForTimeout(150)
    글 = await 본문(p)
    ok('전문 공사로 바꾸면 건축물 칸 없어지고 민간 10억 → 아님 · 근거 «건설근로자법 시행령 제6조»', (await p.locator('.tool.tc select').count()) === 2 && /당연가입 대상이 아닙니다/.test(글) && /건설근로자법 시행령 제6조/.test(글))
    ok('전문 금액 칸 풀이 «장기계속계약(국가 · 지방)» · 국가계약법 글 없음', /장기계속계약\(국가 · 지방\)은/.test(글) && !/국가계약법 장기계속계약은/.test(글))
    ok('폰 390 넘침 0 · 오류 0', (await 넘침(p)) <= 0 && !오류.length, [await 넘침(p), 오류])
    const { p: p2, 오류: 오류2 } = await 새쪽(390, 844, true, ctx)
    ok('다시 열면 전문 · 민간 · 10억 그대로', (await p2.locator('.tool.tc select').first().inputValue()) === '전문' && (await p2.locator('.tool.tc select').nth(1).inputValue()) === '민간' && !오류2.length)
    await ctx.close()
  }
  console.log('⑤ 폭 320 · 1280')
  {
    const { ctx, p, 오류 } = await 새쪽(320, 640, true)
    await p.locator('button', { hasText: '예시로 해 보기' }).first().click(); await p.waitForTimeout(400)
    await p.locator('.tool.tc input[type="date"]').fill('2026-11-14'); await p.waitForTimeout(250)
    const 글 = await 본문(p)
    ok('착공 11. 14. → 기한 11. 28.(토) → 2026. 11. 30. (쉬는 날이라 미룸)', /2026\. 11\. 30\. \(쉬는 날이라 미룸\)/.test(글), 글.slice(0, 300))
    ok('도구 안 «무료» · «클로드» · NaN · undefined 없음', !/무료|클로드|NaN|undefined/.test(글))
    ok('320 넘침 0 · 오류 0', (await 넘침(p)) <= 0 && !오류.length, [await 넘침(p), 오류])
    await ctx.close()
  }
  {
    const { ctx, p, 오류 } = await 새쪽(1280, 860, false)
    await p.locator('button', { hasText: '예시로 해 보기' }).first().click(); await p.waitForTimeout(400)
    const 글 = await 본문(p)
    ok('PC 1280 — 예시 대상 · 넘침 0 · 오류 0', /당연가입 대상입니다/.test(글) && (await 넘침(p)) <= 0 && !오류.length, 오류)
    if (OUT) await p.locator('.tool.tc').screenshot({ path: OUT + '/퇴직공제대상_예시_PC1280.png' })
    await ctx.close()
  }
  /* 낙찰 뒤 할 일 화면에 성립 신고 줄 */
  {
    const { ctx } = await 새쪽(390, 844, true)
    const p = await ctx.newPage()
    const 오류 = []
    p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
    await p.goto(BASE + '/tools/after-award', { waitUntil: 'domcontentloaded' })
    await p.waitForSelector('.tool', { timeout: 20000 }); await p.waitForTimeout(500)
    await p.locator('button', { hasText: '예시로 해 보기' }).first().click(); await p.waitForTimeout(600)
    const 글 = await p.evaluate(() => (document.querySelector('.tool') || {}).innerText || '')
    ok('낙찰 뒤 할 일 예시(국가 8억 5천) → «건설근로자 퇴직공제 관계 성립 신고» 줄 · 판단기 링크 · 오류 0', /건설근로자 퇴직공제 관계 성립 신고/.test(글) && (await p.locator('.tool a[href="/tools/toejik-check"]').count()) >= 1 && !오류.length, 오류)
    await ctx.close()
  }
  await b.close()
}
console.log(`\n${bad ? '✗' : '✓'} 시험_퇴직공제대상 ${n - bad}/${n}`)
if (bad) process.exit(1)
