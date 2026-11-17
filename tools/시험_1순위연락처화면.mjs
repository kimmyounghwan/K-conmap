/**
 * 📞 G748 1순위 연락처 화면 시험 — 구운 사이트(dist)를 띄운 뒤:
 *   node tools/시험_1순위연락처화면.mjs [주소=http://127.0.0.1:4996]
 *   소장님(11-17) 「1순위 회사 주소하고 전번이 하나도 없는데, 그리고, 왜 조달청에서 주지않는 다는 말은 하지마」
 *   → 빈 연락처에 까닭 글(«조달청이 … 주지 않았» · «실려 오지 않았» · «낙찰자 정보로 줄 때만» · «셋 중 하나»)을 달지 않습니다.
 *   ① 1순위 현황판(/first) 카드 넷을 하나씩 펼침
 *      · 법인 연락처 있음(tsrc 2): 주소 · 전화(누르면 걸기 tel:) · «조달청 업체 정보»
 *      · 법인 빈칸 · 개인 빈칸: 🏆 낙찰 업체 · 대표자 · 사업자는 그대로 · 주소 · 전화 줄 없음 · 까닭 글 없음
 *      · 다른 공고에서 확인(tsrc 1): «다른 공고에서 확인»
 *   ② 공고 한 장(/notice/번호) — 빈칸 카드에도 까닭 글 없음
 *   ③ 바로투찰(/?no=번호) — 전화 있음: 📞 단추 / 전화 없음(대표 · 사업자만): 카드 그대로 · 단추 없음 · 까닭 글 없음 /
 *      대표 · 사업자 · 연락처 다 없음: 아무 글 없음 / 7주 «채점» 주소(sc=1): «7일이 지난 개찰이라 …» 그대로
 *   ④ 폰 390 · PC 1280 넘침 0 · 오류 0
 * 가상 자료만 씀(공사 · 기관 · 업체 이름 지어냄) · 인터넷 안 부름(파이어베이스 · 광고 · 애널리틱스 막음).
 */
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const BASE = process.argv[2] || 'http://127.0.0.1:4996'

let bad = 0, n = 0
const ok = (이름, c, got) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (c || got === undefined ? '' : ' = ' + JSON.stringify(got).slice(0, 300))) }
const 금지 = ['주지 않았', '실려 오지 않았', '낙찰자 정보로 줄 때만', '셋 중 하나', '아직 확인되지 않았습니다']
const 금지글 = (t) => 금지.filter((w) => String(t || '').includes(w))

const 오늘 = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10)
const meta = { built: 오늘 + ' 06:00', chunk: 500, rankChunk: 50, con: { n: 5, parts: 1, from: '2026-09-29', to: 오늘 }, serv: { n: 0, parts: 0 } }
const 줄 = (i, o = {}) => ({ no: `R26BK0074800${i}`, ord: '000', name: `가상 연락처 시험 공사 ${i}`, inst: '가상군', dt: 오늘 + ' 11:00:00',
  amt: 523456000, rate: 89.912, np: 37, base: 583000000, sAmt: 0, lo: -3, hi: 3, llr: 89.745, aval: 0, ayn: 'N',
  win: `가상건설${i}(주)`, bno: '1238112345', ceo: '홍길동', ...o })
const rows = [
  줄(1, { name: '가상 하나천 정비공사', tel: '02-123-4567', adr: '서울특별시 가상구 가상로 1', tsrc: 2 }),
  줄(2, { name: '가상 둘레길 포장공사' }),                                                         // 법인 · 빈칸
  줄(3, { name: '가상 셋별 배수공사', win: '가상개인건설', bno: '1230112345', ceo: '김가상' }),      // 개인 · 빈칸
  줄(4, { name: '가상 넷마루 보수공사', tel: '031-222-3333', adr: '경기도 가상시 가상길 2', tsrc: 1 }),
  줄(5, { name: '가상 다섯골 정비공사', win: '가상다섯(주)', bno: '', ceo: '' }),                   // 대표 · 사업자 · 연락처 다 없음
]
const F = ['win', 'amt', 'rate', 'np', 'base', 'dt', 'tel', 'ceo', 'bno', 'adr', 'tsrc', 'name', 'inst', 'aval', 'ayn', 'amts', 'rq', 'nrank', 'lo', 'hi', 'lic', 'llr']
const 결과 = { built: 오늘 + ' 06:00', f: F, r: Object.fromEntries(rows.map((r) => [r.no, F.map((k) => (k === 'amts' || k === 'rq' || k === 'lic') ? [] : (r[k] ?? (k === 'tsrc' || k === 'nrank' ? 0 : '')))])) }
const ov = { rows: 168842, agencies: 5066, corps: 72494 }

const b = await chromium.launch()
const UA폰 = 'Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'
async function 새쪽(w, h, 폰 = true) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', isMobile: 폰, hasTouch: 폰, ...(폰 ? { userAgent: UA폰 } : {}) })
  await ctx.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|googlesyndication|geojs|coupang/, (r) => r.fulfill({ status: 200, body: '' }))
  await ctx.route(/firebaseio\.com|firebasedatabase\.app/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await ctx.route('**/data/board/first.json*', (r) => r.fulfill({ json: meta }))
  await ctx.route('**/data/board/first-con-0.json*', (r) => r.fulfill({ json: rows }))
  await ctx.route('**/data/overview.json*', (r) => r.fulfill({ json: ov }))
  await ctx.route('**/data/ext/meta.json*', (r) => r.fulfill({ json: { n: 0, first: 0 } }))
  await ctx.route(/\/data\/bidindex\.json/, (r) => r.fulfill({ json: { built: 오늘 + ' 06:00', f: [], r: [] } }))
  await ctx.route(/\/data\/bidresult\.json/, (r) => r.fulfill({ json: 결과 }))
  await ctx.route(/\/data\/(sim|basket|agency|licstat)[^/]*\.json/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await ctx.route('**/data/health.json*', (r) => r.fulfill({ json: { at: new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 16).replace('T', ' '), ok: true, why: '', fails: 0, got: { first: 5, live: 0 }, note: '', maint: false, hint: '' } }))
  await ctx.addInitScript(() => { try { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); sessionStorage.setItem('kcm_notice_seen', '2026-10-업체'); sessionStorage.setItem('kcm_visit_s', '1') } catch (e) { /* 없음 */ } })
  const p = await ctx.newPage()
  const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
  return { ctx, p, 오류 }
}
const 넘침 = (p) => p.evaluate(() => document.documentElement.scrollWidth - innerWidth)
const 본문 = (p) => p.evaluate(() => document.body.innerText)

for (const [w, h, 폰] of [[390, 844, true], [1280, 900, false]]) {
  console.log(`① 1순위 현황판 카드 — ${폰 ? '폰' : 'PC'} ${w}`)
  const { ctx, p, 오류 } = await 새쪽(w, h, 폰)
  await p.goto(BASE + '/first', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('main .notice.tap', { timeout: 15000 })
  await p.waitForTimeout(600)
  const 펼침 = async (이름) => {
    const 카드 = p.locator('main .notice.tap', { hasText: 이름 })
    await 카드.scrollIntoViewIfNeeded()
    await 카드.click()
    await p.waitForSelector('main .notice.open .winbox', { timeout: 10000 })
    await p.waitForTimeout(200)
    const t = await p.evaluate(() => (document.querySelector('main .notice.open .winbox') || {}).innerText || '')
    const tel = await p.evaluate(() => [...document.querySelectorAll('main .notice.open .winbox a[href^="tel:"]')].map((a) => a.getAttribute('href')))
    return { 카드, t, tel }
  }
  const 닫기 = async (카드) => { await 카드.locator('h3').click(); await p.waitForTimeout(250) }
  let z = await 펼침('하나천')
  ok('법인 연락처 있음: 주소 · 전화(tel:021234567) · «조달청 업체 정보»', /서울특별시 가상구 가상로 1/.test(z.t) && /02-123-4567/.test(z.t) && /조달청 업체 정보/.test(z.t) && z.tel.includes('tel:021234567'), [z.t, z.tel])
  await 닫기(z.카드)
  z = await 펼침('둘레길')
  ok('법인 빈칸: 낙찰 업체 · 대표자 · 사업자 그대로', /낙찰 업체/.test(z.t) && /홍길동/.test(z.t) && /123-81-12345/.test(z.t), z.t)
  ok('법인 빈칸: 주소 · 전화 줄 없음 · 까닭 글 없음', !/주소|전화/.test(z.t) && !z.tel.length && !금지글(z.t).length, [z.t, 금지글(z.t)])
  await 닫기(z.카드)
  z = await 펼침('셋별')
  ok('개인 빈칸: 대표자 · 사업자 그대로 · 까닭 글 없음(«개인사업자는 …» 없음)', /김가상/.test(z.t) && /123-01-12345/.test(z.t) && !금지글(z.t).length && !/개인사업자는/.test(z.t), [z.t, 금지글(z.t)])
  await 닫기(z.카드)
  z = await 펼침('넷마루')
  ok('다른 공고에서 확인(tsrc 1): 주소 · 전화 · «다른 공고에서 확인»', /경기도 가상시 가상길 2/.test(z.t) && /031-222-3333/.test(z.t) && /다른 공고에서 확인/.test(z.t), z.t)
  await 닫기(z.카드)
  ok('현황판 어디에도 까닭 글 없음', !금지글(await 본문(p)).length, 금지글(await 본문(p)))
  ok(`${w} 넘침 0`, (await 넘침(p)) <= 0, await 넘침(p))
  ok('오류 0', !오류.length, 오류)
  await ctx.close()
}

console.log('② 공고 한 장(/notice/번호) — 빈칸 카드')
{
  const { ctx, p, 오류 } = await 새쪽(390, 844)
  await p.goto(BASE + '/notice/' + rows[1].no, { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('.winbox', { timeout: 15000 })
  await p.waitForTimeout(400)
  const t = await p.evaluate(() => (document.querySelector('.winbox') || {}).innerText || '')
  ok('낙찰 업체 · 대표자 · 사업자 그대로 · 주소 · 전화 줄 없음', /홍길동/.test(t) && /123-81-12345/.test(t) && !/주소|전화/.test(t), t)
  ok('쪽 어디에도 까닭 글 없음', !금지글(await 본문(p)).length, 금지글(await 본문(p)))
  ok('폰 390 넘침 0 · 오류 0', (await 넘침(p)) <= 0 && !오류.length, [await 넘침(p), 오류])
  await ctx.close()
}

console.log('③ 바로투찰 채점 카드')
for (const [w, h, 폰] of [[390, 844, true], [1280, 900, false]]) {
  const { ctx, p, 오류 } = await 새쪽(w, h, 폰)
  const 열기 = async (q) => {
    await p.goto(BASE + '/?' + q, { waitUntil: 'domcontentloaded' })
    await p.waitForSelector('main .wcard, main .wno, main .s1', { timeout: 15000 })
    await p.waitForTimeout(700)
    return p.evaluate(() => ({
      카드: (document.querySelector('main .wcard') || {}).innerText || '',
      단추: [...document.querySelectorAll('main .wcard a.wtel')].map((a) => a.getAttribute('href')),
      홀로: [...document.querySelectorAll('main .wno.solo')].map((x) => x.innerText),
      빈칸글: [...document.querySelectorAll('main .wcard .wno')].map((x) => x.innerText),
    }))
  }
  let z = await 열기('no=' + rows[0].no)
  ok(`${폰 ? '폰' : 'PC'} ${w} 전화 있음: 📞 단추(tel:021234567) · 주소 · «조달청 업체 정보»`, z.단추.includes('tel:021234567') && /서울특별시 가상구 가상로 1/.test(z.카드) && /조달청 업체 정보/.test(z.카드), z)
  ok('바로투찰 쪽 어디에도 까닭 글 없음(전화 있음)', !금지글(await 본문(p)).length, 금지글(await 본문(p)))
  z = await 열기('no=' + rows[1].no)
  ok('전화 없음(대표 · 사업자만): 카드 그대로 · 📞 단추 없음 · 빈칸 글 없음', /홍길동/.test(z.카드) && /123-81-12345/.test(z.카드) && !z.단추.length && !z.빈칸글.length && !z.홀로.length, z)
  ok('바로투찰 쪽 어디에도 까닭 글 없음(전화 없음)', !금지글(await 본문(p)).length, 금지글(await 본문(p)))
  z = await 열기('no=' + rows[4].no)
  ok('대표 · 사업자 · 연락처 다 없음: 카드 · 글 다 없음', !z.카드 && !z.홀로.length, z)
  ok('바로투찰 쪽 어디에도 까닭 글 없음(다 없음)', !금지글(await 본문(p)).length, 금지글(await 본문(p)))
  z = await 열기('sc=1&no=R26BK00748009&win=' + encodeURIComponent('가상지난(주)') + '&amt=523456000&rate=89.912&np=37&base=583000000&dt=2026-10-01%2011:00:00&lo=-3&hi=3&llr=89.745')
  ok('7주 «채점» 주소(sc=1): «7일이 지난 개찰이라 …» 그대로', z.홀로.some((x) => /7일이 지난 개찰이라 연락처·대표자는 들고 있지 않습니다/.test(x)), z)
  ok(`${w} 넘침 0 · 오류 0`, (await 넘침(p)) <= 0 && !오류.length, [await 넘침(p), 오류])
  await ctx.close()
}

await b.close()
console.log(`\n${n - bad} 통과 · ${bad} 실패`)
process.exit(bad ? 1 : 0)
