/**
 * 🧪 G654 쿠팡 «분야별 베스트» 줄(쿠팡칸.jsx · lib/쿠팡자료.js) 시험 — 2026-11-12
 *   자료만:   LANG=C.UTF-8 node tools/시험_쿠팡칸.mjs
 *   화면까지: 구운 사이트(dist)를 띄운 뒤  LANG=C.UTF-8 node tools/시험_쿠팡칸.mjs http://127.0.0.1:4986 [쪽=/]   (쪽: / · /first · /live · /forms …)
 *   소장님 「쿠팡 광고 상품사진 올리자」 · 「쿠팡에 제일 잘 팔리는 상품순으로」 · 「업데이트 매일 매일」 · 「상품이 나오고 그 상품을 클릭하게 해줘」
 *   · 「분야별로 많이 팔린 상품 띄워주고...페이지 마다」 · 「위치도 사람들이 보기 좋은 곳으로」 → «② 목록 중간 + 나머지 맨 아래» · 「광고는 나에게 먼저 캡쳐 보여 주고 올릴껏」
 *   ① 자료: 분야 15(배너 번호 = 11-12 파트너스 목록 · 국내여행 · 해외여행은 상품 0개라 뺌 · 🩹 G655 헬스/건강식품은 상품이 식품이라 뺌) · 추적 코드 · 배너 주소 = 쿠팡 iframe 코드 꼴 그대로 · 대가성 문구 = 쿠팡 글 그대로 · 쪽 → 분야 · 돌림
 *   ② 화면(폰 390 · 고른 쪽): 쪽에 쿠팡 줄 한 번 — 1순위 · 공고는 여섯째 카드 바로 다음(자리 목록 · 바닥 줄 없음) · 그 밖은 바닥글 바로 위(자리 바닥)
 *      «광고» · «쿠팡 ○○ 베스트» · 대가성 문구 · 배너(번호 · 추적 코드 · 폭 = 주소 폭 · 높이 140 · unsafe-url · lazy) · 넘침 0 · 높이 ≤ 230
 *      숨은 셈 |쿠팡보임|자리-분야 한 번 · 배너 안을 누르면 |쿠팡누름|자리-분야 한 번 · 다른 쪽(/how)으로 옮기면 바닥 줄 · 또 한 번 셈
 *   ③ 쪽 맞춤(자격증 · 서식 · 도구) · 목록이 여섯 장이 안 되면 바닥 줄 · PC 1280 폭 680 · 폰 320 · 어두운 화면 대비 · 인쇄 안 나옴 · 문의함 없음 · 오류 0
 *   쿠팡 배너는 인터넷을 부르지 않고 가짜 쪽으로 받음(1순위 · 공고 자료도 가상). OUT=폴더 면 화면 사진.
 */
import { createRequire } from 'node:module'
import { 쿠팡분야, 쿠팡추적, 쿠팡문구, 쪽분야, 돌림분야, 분야고르기, 배너주소 } from '../web/src/lib/쿠팡자료.js'
const require = createRequire(import.meta.url)
const BASE = process.argv[2] || ''
const 쪽 = process.argv[3] || '/'
const OUT = process.env.OUT || ''
let bad = 0, n = 0
const ok = (이름, c, got) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (c || got === undefined ? '' : ' = ' + JSON.stringify(got).slice(0, 400))) }
const 주소꼴 = /^https:\/\/ads-partners\.coupang\.com\/widgets\.html\?id=(\d{7})&template=carousel&trackingCode=AF6409328&subId=&width=(\d{3})&height=140&tsource=$/
const 목록쪽 = (p) => /^\/(first|live)$/.test(p)

console.log('① 자료')
ok('분야 15 · id · 배너 번호 겹침 없음 · 배너 번호 7자리', 쿠팡분야.length === 15 && new Set(쿠팡분야.map((x) => x.id)).size === 15 && new Set(쿠팡분야.map((x) => x.배너)).size === 15 && 쿠팡분야.every((x) => /^\d{7}$/.test(String(x.배너))), 쿠팡분야)
ok('배너 번호 = 11-12 파트너스 «다이나믹 배너» 목록 그대로', 쿠팡분야.map((x) => `${x.이름}:${x.배너}`).join() === '식품:1049437,생활용품:1049444,가전디지털:1049445,자동차용품:1049446,스포츠/레저:1049447,주방용품:1049451,문구/오피스:1049452,도서:1049454,패션의류/잡화:1049460,뷰티:1049461,출산/유아동:1049462,홈인테리어:1049463,완구/취미:1049464,반려동물용품:1049465,수입상품:1049468')
ok('국내여행 1049466 · 해외여행 1049467(쿠팡 배너 상품 0개 — 빈 칸)은 안 씀', !쿠팡분야.some((x) => [1049466, 1049467].includes(x.배너)))
/* 🩹 G655 재발 막기 — 헬스/건강식품 배너(1049450)는 상품 30개가 모두 식품(11-12 크롬 확인) · 다시 넣으려면 docs/쿠팡배너_점검.md 로 상품부터 확인하고 이 줄을 고칠 것 */
ok('헬스/건강식품 1049450(상품이 식품 — G655)은 표에도 돌림에도 없음', !쿠팡분야.some((x) => x.배너 === 1049450 || x.id === 'health') && !돌림분야.includes('health'))
ok('돌림 분야는 다 표에 있음(표에 없는 이름 없음)', 돌림분야.every((id) => 쿠팡분야.some((x) => x.id === id)) && 돌림분야.length === 쿠팡분야.length)
ok('추적 코드 — AF6409328(소장님이 붙여 주신 코드)', 쿠팡추적 === 'AF6409328')
ok('배너 주소 — 쿠팡 iframe 코드 꼴 그대로(폭만 바뀜)', 쿠팡분야.every((x) => { const m = 배너주소(x, 680, 140).match(주소꼴); return m && m[1] === String(x.배너) && m[2] === '680' }) && 주소꼴.test(배너주소(쿠팡분야[0], 336, 140)), 배너주소(쿠팡분야[0], 336, 140))
ok('대가성 문구 — 쿠팡 «반드시 기재» 글 그대로', 쿠팡문구 === '이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.')
const 맞춤 = [['/cert', 'books'], ['/cert/togmok-gisa', 'books'], ['/forms', 'office'], ['/forms/x', 'office'], ['/naeyeok', 'office'], ['/jeoksan/lab', 'office'], ['/change/excel', 'office'], ['/cad', 'office'], ['/tools', 'digital'], ['/tools/wonclick', 'digital']]
ok('쪽 맞춤 — 자격증 → 도서 · 서식 · 내역서 · 적산 · 설계변경 · 캐드 → 문구/오피스 · 도구 → 가전디지털', 맞춤.every(([p, id]) => 분야고르기(p).id === id), 맞춤.map(([p]) => [p, 분야고르기(p).id]))
ok('맞춤 아닌 쪽 — 비슷한 이름에 속지 않음(/certx · /formsy · /toolsz 는 돌림)', ['/certx', '/formsy', '/toolsz'].every((p) => 돌림분야.includes(분야고르기(p).id)))
{
  const 본 = new Set(); let 틀림 = null
  for (let i = 0; i < 2000; i++) { const g = 분야고르기(i % 2 ? '/first' : '/'); 본.add(g.id); if (!돌림분야.includes(g.id)) { 틀림 = g.id; break } }
  ok('돌림 2,000번 — 열다섯 분야 다 나옴(소장님 「다 올려야 해」)', !틀림 && 본.size === 15, [...본])
}
ok('쪽분야가 가리키는 분야는 다 표에 있음', 쪽분야.every(([, id]) => 쿠팡분야.some((x) => x.id === id)))

if (BASE) {
  const { chromium } = require('playwright')
  const 공지판 = (require('node:fs').readFileSync(new URL('../web/src/감사공지.jsx', import.meta.url), 'utf8').match(/const 판 = '([^']+)'/) || [])[1] || ''
  const UA폰 = 'Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'
  const 오늘 = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10)
  const 마감 = (d) => new Date(Date.now() + d * 86400e3 + 9 * 3600e3).toISOString().slice(0, 10) + ' 10:00:00'
  const meta = (k) => ({ built: 오늘 + ' 06:00', chunk: 500, rankChunk: 50, con: { n: k, parts: 1, from: '2026-09-15', to: 오늘 }, serv: { n: 0, parts: 0 } })
  const 일순위 = (k) => Array.from({ length: k }, (_, i) => ({ no: `R00TEST8${String(i).padStart(4, '0')}`, ord: '000', name: `가상 새솔지구 정비공사 ${i + 1}차`, inst: '가상군', dt: 오늘 + ' 11:00:00', amt: 523456000, rate: 89.912, np: 37, nrank: 37,
    base: 583000000, sAmt: 0, lo: -3, hi: 3, llr: 89.745, aval: 0, ayn: 'N', win: '가상건설1(주)', bno: '1238112345', ceo: '홍길동' }))
  const 공고 = (k) => Array.from({ length: k }, (_, i) => ({ no: `R00TEST9${String(i).padStart(4, '0')}`, ord: '000', name: `가상 들말 배수로 정비공사 ${i + 1}`, inst: '가상시', dt: 오늘 + ' 09:00:00', close: 마감(i % 4 + 1), base: 244600000, est: 222363636, lo: -3, hi: 3, llr: 89.745, lic: ['토목공사업/0001'], aval: 0, ayn: 'N', ptot: 15, pdrw: 4, url: '' }))
  const b = await chromium.launch()
  const 셈들 = []
  const 가짜배너 = (u) => { const id = (u.match(/id=(\d+)/) || [])[1]; const x = 쿠팡분야.find((y) => String(y.배너) === id); return `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;height:100%;font:600 14px sans-serif}a{display:flex;gap:6px;align-items:center;justify-content:center;height:100%;background:#eef6ff;color:#1e3a8a;text-decoration:none}i{display:inline-block;width:70px;height:110px;border-radius:8px;background:#bfdbfe}</style><a href="https://link.coupang.com/a/test" target="_blank"><i></i><i></i><i></i><span>쿠팡 ${x ? x.이름 : '?'} 베스트(시험용 가짜)</span></a>` }
  async function 새쪽(w, h, 폰 = true, 어둠 = false, 몇장 = 34) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', isMobile: 폰, hasTouch: 폰, colorScheme: 어둠 ? 'dark' : 'light',
      userAgent: 폰 ? UA폰 : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36', deviceScaleFactor: OUT ? 2 : 1 })
    await ctx.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|googlesyndication|geojs/, (r) => r.fulfill({ status: 200, body: '' }))
    await ctx.route(/firebaseio\.com|firebasedatabase\.app/, (r) => { const u = decodeURIComponent(r.request().url()); if (/쿠팡/.test(u) && r.request().method() !== 'GET') 셈들.push(u.replace(/^.*?\.(com|app)\//, '')); r.fulfill({ status: 200, contentType: 'application/json', body: r.request().method() === 'GET' ? 'null' : (r.request().postData() || 'null') }) })
    await ctx.route(/ads-partners\.coupang\.com/, (r) => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: 가짜배너(r.request().url()) }))
    await ctx.route(/link\.coupang\.com/, (r) => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: '<title>쿠팡(가짜)</title>쿠팡' }))
    await ctx.route('**/data/board/first.json*', (r) => r.fulfill({ json: meta(몇장) }))
    await ctx.route('**/data/board/first-con-0.json*', (r) => r.fulfill({ json: 일순위(몇장) }))
    await ctx.route('**/data/board/live.json*', (r) => r.fulfill({ json: { ...meta(몇장), con: { n: 몇장, parts: 1, from: 오늘, to: 오늘 } } }))
    await ctx.route('**/data/board/live-con-0.json*', (r) => r.fulfill({ json: 공고(몇장) }))
    await ctx.route('**/data/overview.json*', (r) => r.fulfill({ json: { rows: 168842, agencies: 5066, corps: 72494 } }))
    await ctx.route('**/data/ext/meta.json*', (r) => r.fulfill({ json: { n: 0, first: 0 } }))
    await ctx.addInitScript(() => { try { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); sessionStorage.setItem('kcm_notice_seen', '2026-10-업체'); sessionStorage.setItem('kcm_visit_s', '1') } catch (e) { /* 없음 */ } })
    await ctx.addInitScript(() => { try { Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false }) } catch (e) { /* 없음 */ } })
    await ctx.addInitScript((판) => { try { sessionStorage.setItem('kcm_notice_seen', 판) } catch (e) { /* 없음 */ } }, 공지판)
    const p = await ctx.newPage()
    const 오류 = []
    p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
    p.on('dialog', (d) => d.dismiss())
    return { ctx, p, 오류 }
  }
  const 줄 = (p) => p.evaluate(() => {
    const a = [...document.querySelectorAll('aside.cpg')]
    const x = a[0]
    if (!x) return { 수: 0 }
    const f = x.querySelector('iframe')
    /* 앞 카드 — 바로 앞 형제가 카드(.notice)인지 · 카드 차례(몇째) */
    const 카드들 = [...document.querySelectorAll('main .notice')]
    let 앞 = x.previousElementSibling
    while (앞 && 앞.matches('aside.adc')) 앞 = 앞.previousElementSibling
    return {
      수: a.length, 자리: x.dataset.cpgAt, 뒤: x.nextElementSibling ? x.nextElementSibling.className : '', 앞카드: 앞 && 앞.matches('.notice') ? 카드들.indexOf(앞) + 1 : 0,
      분야: x.dataset.cpg, 딱지: (x.querySelector('.adc-tag') || {}).textContent, 머리: (x.querySelector('.adc-hs') || {}).textContent,
      문구: (x.querySelector('.cpg-dis') || {}).textContent, 높이: Math.round(x.getBoundingClientRect().height),
      틀: f ? { src: f.getAttribute('src'), w: Math.round(f.getBoundingClientRect().width), h: Math.round(f.getBoundingClientRect().height), wa: f.getAttribute('width'), rp: f.getAttribute('referrerpolicy'), lazy: f.getAttribute('loading'), title: f.getAttribute('title') } : null,
    }
  })
  const 넘침 = (p) => p.evaluate(() => document.documentElement.scrollWidth - innerWidth)
  const 숨김 = (p) => p.addStyleTag({ content: '.insa{display:none!important}' })
  const 기다림 = async (f, ms = 6000) => { const t = Date.now(); while (Date.now() - t < ms) { if (f()) return true; await new Promise((r) => setTimeout(r, 150)) } return false }
  const 이름 = (id) => (쿠팡분야.find((x) => x.id === id) || {}).이름
  const 맞나 = (z) => { const m = z.틀 && z.틀.src.match(주소꼴); const x = 쿠팡분야.find((y) => y.id === z.분야); return !!(m && x && m[1] === String(x.배너) && Number(m[2]) === z.틀.w && Number(z.틀.wa) === z.틀.w) }
  const 셈수 = (종류, z) => 셈들.filter((u) => u.includes(종류) && u.includes(`${z.자리}-${z.분야}`)).length

  console.log(`② 화면 — 폰 390 · 쪽 ${쪽}`)
  {
    const { ctx, p, 오류 } = await 새쪽(390, 844)
    await p.goto(BASE + 쪽, { waitUntil: 'domcontentloaded' })
    await p.waitForSelector('aside.cpg iframe', { timeout: 15000 }); await p.waitForTimeout(800)
    const z = await 줄(p)
    if (목록쪽(쪽)) ok('쪽에 쿠팡 줄 한 번 — 여섯째 카드 바로 다음(자리 목록) · 바닥 줄 없음', z.수 === 1 && z.자리 === '목록' && z.앞카드 === 6, z)
    else ok('쪽에 쿠팡 줄 한 번 — 바닥글(footer) 바로 위(자리 바닥)', z.수 === 1 && z.자리 === '바닥' && /footer/.test(z.뒤), z)
    ok(`«광고» 딱지 · «쿠팡 ${이름(z.분야)} 베스트»`, z.딱지 === '광고' && z.머리 === `쿠팡 ${이름(z.분야)} 베스트`, [z.딱지, z.머리])
    ok('대가성 문구 그대로', z.문구 === 쿠팡문구, z.문구)
    const 기대 = 쪽분야.find(([re]) => re.test(쪽))
    ok(기대 ? `쪽 맞춤 — ${쪽} → ${이름(기대[1])}` : `돌림 분야(${이름(z.분야)})`, 기대 ? z.분야 === 기대[1] : 돌림분야.includes(z.분야), z.분야)
    ok('배너 — 그 분야 번호 · 추적 코드 · 폭이 주소와 같음 · 높이 140', 맞나(z) && z.틀.h === 140, z.틀)
    ok('referrerpolicy=unsafe-url · 늦게 불러옴(lazy) · 제목 있음', z.틀.rp === 'unsafe-url' && z.틀.lazy === 'lazy' && /베스트 상품$/.test(z.틀.title || ''), z.틀)
    ok('폰 390 — 배너 폭 300~358 · 쪽 넘침 0 · 줄 높이 ≤ 230', z.틀.w >= 300 && z.틀.w <= 358 && await 넘침(p) <= 0 && z.높이 <= 230, { 폭: z.틀.w, 넘침: await 넘침(p), 높이: z.높이 })
    await p.evaluate(() => document.querySelector('aside.cpg').scrollIntoView({ block: 'center' }))
    await 기다림(() => 셈수('쿠팡보임', z) > 0); await p.waitForTimeout(700)
    ok(`숨은 셈 — 화면에 들어오면 «|쿠팡보임|${z.자리}-${z.분야}» 한 번`, 셈수('쿠팡보임', z) === 1 && 셈들.filter((u) => u.includes('쿠팡보임')).length === 1, 셈들)
    if (OUT) { await 숨김(p); await p.waitForTimeout(300); await p.screenshot({ path: `${OUT}/쿠팡줄_폰390${쪽.replace(/\//g, '_') || '_'}.png` }) }
    const 틀 = p.frameLocator('aside.cpg iframe')
    const [새창] = await Promise.all([ctx.waitForEvent('page', { timeout: 8000 }).catch(() => null), 틀.locator('a').click()])
    await 기다림(() => 셈수('쿠팡누름', z) > 0)
    ok(`배너 안을 누르면 «|쿠팡누름|${z.자리}-${z.분야}» 한 번`, 셈수('쿠팡누름', z) === 1, 셈들)
    ok('누르면 새 창(쿠팡)', !!새창, null)
    if (새창) await 새창.close()
    await p.bringToFront()
    const 앞셈 = 셈들.filter((u) => u.includes('쿠팡보임')).length
    await p.click('footer a[href="/how"]')
    await p.waitForURL(/\/how$/, { timeout: 10000 }); await p.waitForTimeout(900)
    const z2 = await 줄(p)
    ok('다른 쪽(/how) — 바닥 줄 한 번 · 바닥글 바로 위 · 돌림 분야', z2.수 === 1 && z2.자리 === '바닥' && /footer/.test(z2.뒤) && 돌림분야.includes(z2.분야), z2)
    await p.evaluate(() => document.querySelector('aside.cpg').scrollIntoView({ block: 'center' }))
    await 기다림(() => 셈들.filter((u) => u.includes('쿠팡보임')).length > 앞셈)
    ok('쪽을 옮겨 보이면 «|쿠팡보임|바닥-분야» 한 번 더', 셈들.filter((u) => u.includes('쿠팡보임')).length === 앞셈 + 1 && 셈수('쿠팡보임', z2) >= 1, 셈들)
    ok('오류 0', !오류.length, 오류)
    await ctx.close()
  }

  console.log('③ 쪽 맞춤 · 목록 짧을 때 · PC 1280 · 폰 320 · 어두운 화면 · 인쇄 · 문의함')
  for (const [곳, id] of [['/cert', 'books'], ['/forms', 'office'], ['/tools', 'digital']]) {
    const { ctx, p, 오류 } = await 새쪽(390, 844)
    await p.goto(BASE + 곳, { waitUntil: 'domcontentloaded' })
    await p.waitForSelector('aside.cpg iframe', { timeout: 15000 }); await p.waitForTimeout(400)
    const z = await 줄(p)
    ok(`${곳} → 바닥 줄 «쿠팡 ${이름(id)} 베스트» · 배너 번호 맞음 · 오류 0`, z.수 === 1 && z.자리 === '바닥' && z.분야 === id && z.머리 === `쿠팡 ${이름(id)} 베스트` && 맞나(z) && !오류.length, [z.자리, z.분야, z.머리, 오류])
    await ctx.close()
  }
  for (const 곳 of ['/first', '/live']) {
    const { ctx, p, 오류 } = await 새쪽(390, 844, true, false, 4)
    await p.goto(BASE + 곳, { waitUntil: 'domcontentloaded' })
    await p.waitForSelector('main .notice', { timeout: 15000 })
    await p.waitForSelector('aside.cpg iframe', { timeout: 15000 }); await p.waitForTimeout(500)
    const z = await 줄(p)
    ok(`${곳} 목록이 넉 장뿐 — 목록 줄 없이 바닥 줄 한 번`, z.수 === 1 && z.자리 === '바닥' && /footer/.test(z.뒤) && !오류.length, [z, 오류])
    await ctx.close()
  }
  for (const 곳 of ['/first', '/live']) {
    const { ctx, p, 오류 } = await 새쪽(1280, 900, false)
    await p.goto(BASE + 곳, { waitUntil: 'domcontentloaded' })
    await p.waitForSelector('aside.cpg iframe', { timeout: 15000 }); await p.waitForTimeout(500)
    const z = await 줄(p)
    ok(`PC 1280 ${곳} — 여섯째 카드 다음 · 배너 폭 680 · 주소 폭 680 · 넘침 0`, z.수 === 1 && z.자리 === '목록' && z.앞카드 === 6 && z.틀.w === 680 && 맞나(z) && await 넘침(p) <= 0, z)
    if (OUT) { await 숨김(p); await p.evaluate(() => document.querySelector('aside.cpg').scrollIntoView({ block: 'center' })); await p.waitForTimeout(400); await p.screenshot({ path: `${OUT}/쿠팡줄_PC1280${곳.replace(/\//g, '_')}.png` }) }
    await p.emulateMedia({ media: 'print' })
    ok(`PC ${곳} — 인쇄에는 안 나옴 · 오류 0`, await p.evaluate(() => getComputedStyle(document.querySelector('aside.cpg')).display === 'none') && !오류.length, 오류)
    await ctx.close()
  }
  {
    const { ctx, p, 오류 } = await 새쪽(320, 700)
    await p.goto(BASE + 쪽, { waitUntil: 'domcontentloaded' })
    await p.waitForSelector('aside.cpg iframe', { timeout: 15000 }); await p.waitForTimeout(500)
    const z = await 줄(p)
    ok('폰 320 — 쪽 넘침 0 · 배너 폭 = 줄 안쪽 폭(240~300 · 안 잘림) · 주소 폭 = 실제 폭', await 넘침(p) <= 0 && z.틀.w >= 240 && z.틀.w <= 300 && 맞나(z), { 넘침: await 넘침(p), 틀: z.틀 })
    ok('폰 320 오류 0', !오류.length, 오류)
    await ctx.close()
  }
  {
    const { ctx, p, 오류 } = await 새쪽(390, 844, true, true)
    await p.goto(BASE + 쪽, { waitUntil: 'domcontentloaded' })
    await p.waitForSelector('aside.cpg iframe', { timeout: 15000 }); await p.waitForTimeout(400)
    const 대비 = await p.evaluate(() => {
      const rgb = (s) => (s.match(/\d+(\.\d+)?/g) || []).slice(0, 3).map(Number)
      const 밝기 = ([r, g, bb]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(bb) }
      const 비 = (a, c) => { const x = 밝기(rgb(a)), y = 밝기(rgb(c)); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) }
      const x = document.querySelector('aside.cpg'), 바탕 = getComputedStyle(x).backgroundColor
      const 딱지 = x.querySelector('.adc-tag'), 머리 = x.querySelector('.adc-hs'), 머리바탕 = getComputedStyle(x.querySelector('.adc-h')).backgroundColor
      return { 문구: 비(getComputedStyle(x.querySelector('.cpg-dis')).color, 바탕), 딱지: 비(getComputedStyle(딱지).color, getComputedStyle(딱지).backgroundColor), 머리: 비(getComputedStyle(머리).color, 머리바탕), 바탕 }
    })
    ok('어두운 화면 — 문구 · 딱지 · 머리 글 대비 4.5 넘음', 대비.문구 >= 4.5 && 대비.딱지 >= 4.5 && 대비.머리 >= 4.5, 대비)
    ok('어두운 화면 오류 0', !오류.length, 오류)
    await ctx.close()
  }
  {
    const { ctx, p } = await 새쪽(390, 844)
    await p.goto(BASE + '/admin', { waitUntil: 'domcontentloaded' })
    await p.waitForSelector('footer.footer', { timeout: 15000 }); await p.waitForTimeout(1200)
    ok('문의함(/admin)에는 없음', (await 줄(p)).수 === 0)
    await ctx.close()
  }
  await b.close()
}
console.log(`\n${bad ? '✗' : '✓'} ${n - bad}/${n}`)
process.exit(bad ? 1 : 0)
