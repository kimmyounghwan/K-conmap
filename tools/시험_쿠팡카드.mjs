/**
 * 🧪 G663 쿠팡 «카페형 상품 카드» 줄(쿠팡카드줄.jsx · lib/쿠팡카드.js · public/coupang/cards.json) 시험 — 2026-11-13
 *   자료만:   LANG=C.UTF-8 node tools/시험_쿠팡카드.mjs
 *   화면까지: 구운 사이트(dist)를 띄운 뒤  LANG=C.UTF-8 node tools/시험_쿠팡카드.mjs http://127.0.0.1:4666
 *   소장님 11-13 「쿠팡을 쪽에 맞는 상품으로 하고, 최대한 상품 많이 보이게 해줘」 · 「카페는 이렇게 하잖아」 · 「화질도 좋고」 · 「가격이 안보이는 거야?」
 *   · 「과일만 쭉… 제철 과일… 옷 만 쭉… 각 카테고리 별로」 · 「이용자가 클릭을 하게 해야지…」 · 「광고는 이용자가 불편하지 않게 해줘」
 *   ① 자료: 상품 수 · 주제 · 링크(파트너스가 만든 꼴 · 겹침 없음) · 그림(쿠팡 그림 꼴) · 값(원값 ≥ 값 · 할인 = 쿠팡 셈) · 이름(«무료» · «클로드» 없음)
 *          · 쪽 → 주제(자격증 → 수험서 · 도구 → 공구 …) · 한 쪽의 줄은 주제가 다 다름 · 깨진 자료는 버림
 *   ② 화면(폰 390): 맨 위 작은 카드 줄(예전 배너 자리 · «써 본 횟수» 밖 · 공사 연결 띠 앞) · 바닥 큰 카드 줄(바닥글 바로 위) · 목록 사이 큰 카드 줄(예전 자리)
 *          · «광고» 딱지 · 주제 이름 · «쿠팡 · ○월 ○일 가격» · 대가성 문구 · 카드(링크 · 새 창 · sponsored · 그림 320/492 · 이름 · 할인 · 값)
 *          · 옆으로 넘김 · 쪽 넘침 0 · 숨은 셈(보임 · 누름 한 번씩) · 쪽 맞춤 · 기다리는 동안 자리 잡기(덜컥임 ≤ 30px)
 *   ③ PC 1280(‹ › 단추) · 폰 320 · 어두운 화면 대비 · 인쇄 · 문의함(/admin) 없음 · 자료를 못 받으면 예전 배너로(맨 위 · 목록) · 오류 0
 *   쿠팡 그림 · 링크는 인터넷을 부르지 않고 가짜로 받음(1순위 · 공고 자료도 가상). OUT=폴더 면 화면 사진.
 */
import fs from 'node:fs'
import { createRequire } from 'node:module'
import { 카드자료풀기, 카드주제정하기, 카드쪽주제, 카드돌림, 자리차례, 그림크기, 원, 기준글 } from '../web/src/lib/쿠팡카드.js'
import { 쿠팡문구, 목록쿠팡자리 } from '../web/src/lib/쿠팡자료.js'
const require = createRequire(import.meta.url)
const BASE = process.argv[2] || ''
const OUT = process.env.OUT || ''
let bad = 0, n = 0
const ok = (이름, c, got) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (c || got === undefined ? '' : ' = ' + JSON.stringify(got).slice(0, 500))) }

console.log('① 자료')
const 날 = JSON.parse(fs.readFileSync(new URL('../web/public/coupang/cards.json', import.meta.url), 'utf8'))
const D = 카드자료풀기(날)
ok('cards.json 이 풀림 · 버려진 줄 없음(모든 줄이 꼴에 맞음)', !!D && D.상품.length === 날.상품.length, D && [D.상품.length, 날.상품.length])
ok('상품 200개 넘음(소장님 「최대한 상품 많이」)', D.상품.length >= 200, D.상품.length)
const 주제수 = Object.fromEntries(D.주제들.map((t) => [t.id, D.상품.filter((p) => p.주제 === t.id).length]))
ok('주제 17 · 주제마다 여섯 개 넘음', D.주제들.length === 17 && Object.values(주제수).every((v) => v >= 6), 주제수)
ok('돌림 = 자료의 주제 전부(빠진 것 · 없는 것 없음)', 카드돌림.length === D.주제들.length && 카드돌림.every((id) => 주제수[id] > 0), 카드돌림)
ok('쪽 맞춤이 가리키는 주제는 다 자료에 있음', 카드쪽주제.every(([, ids]) => ids.every((id) => 주제수[id] > 0)))
ok('링크 — 다 쿠팡 «상품 링크» 꼴(link.coupang.com/a/…) · 겹침 없음', D.상품.every((p) => /^https:\/\/link\.coupang\.com\/a\/[A-Za-z0-9]{6,}$/.test(p.짧은)) && new Set(D.상품.map((p) => p.짧은)).size === D.상품.length)
ok('그림 — 다 쿠팡 그림 꼴(…coupangcdn.com/thumbnails/remote/212x212ex/image/…)', D.상품.every((p) => /^https:\/\/[a-z0-9]+\.coupangcdn\.com\/thumbnails\/remote\/212x212ex\/image\/\S+\.(jpg|jpeg|png)$/.test(p.그림)))
ok('값 — 0 < 값 ≤ 원값 · 할인 = 쿠팡 셈(내림 · ±1)', D.상품.every((p) => p.값 > 0 && p.값 <= p.원값 && Math.abs(p.할인 - Math.floor((p.원값 - p.값) * 100 / p.원값)) <= 1), D.상품.filter((p) => !(p.값 > 0 && p.값 <= p.원값 && Math.abs(p.할인 - Math.floor((p.원값 - p.값) * 100 / p.원값)) <= 1)).slice(0, 3))
ok('별 4.0 ~ 5 · 평 1 넘음', D.상품.every((p) => p.별 >= 4 && p.별 <= 5 && p.평 >= 1))
ok('이름 — «무료» · «클로드» 없음 · 앞에 [광고 꼬리] 없음 · 3 ~ 60자', D.상품.every((p) => !/무료|클로드/.test(p.이름) && !/^\[/.test(p.이름) && p.이름.length >= 3 && p.이름.length <= 60), D.상품.filter((p) => /무료|클로드|^\[/.test(p.이름) || p.이름.length > 60).map((p) => p.이름))
ok('같은 상품(그림 주소 같음)이 두 번 없음', new Set(D.상품.map((p) => p.그림.replace(/^https:\/\/[^/]+/, ''))).size === D.상품.length)
ok('기준일 2026-11-13 → «11월 13일»', D.기준 === '2026-11-13' && 기준글(D.기준) === '11월 13일')
ok('자격증 수험서 — 건설 자격증 책만(토목 · 건축 · 건설안전 · 산업안전 · 콘크리트 · 측량)', D.상품.filter((p) => p.주제 === 'cert').every((p) => /토목기사|건축기사|건설안전기사|산업안전기사|콘크리트기사|측량/.test(p.이름)), D.상품.filter((p) => p.주제 === 'cert').map((p) => p.이름))
const 맞춤 = [['/cert', 'cert'], ['/cert/togmok-gisa', 'cert'], ['/tools', 'tools'], ['/tools/wonclick', 'tools'], ['/jeoksan', 'tools'], ['/tools/risk', 'sitewinter'], ['/safety', 'sitewinter'], ['/forms', 'office'], ['/naeyeok', 'office'], ['/change/excel', 'office'], ['/jobs', 'sitewinter'], ['/qna', 'fruit'], ['/', 'sitewinter'], ['/first', 'sitewinter'], ['/live', 'sitewinter']]
const 있는 = D.주제들.map((t) => t.id)
ok('쪽 맞춤 — 맨 위 줄 주제(자격증 → 수험서 · 도구 → 공구 · 위험성평가 → 현장 겨울 · 서식 → 사무 · 첫 화면 → 현장 겨울)', 맞춤.every(([p, id]) => 카드주제정하기(p, 0, 7, 있는) === id), 맞춤.map(([p]) => [p, 카드주제정하기(p, 0, 7, 있는)]))
ok('비슷한 이름에 속지 않음(/certx · /toolsz · /formsy → 돌림)', ['/certx', '/toolsz', '/formsy'].every((p) => 카드돌림.includes(카드주제정하기(p, 0, 3, 있는)) && 카드주제정하기(p, 0, 3, 있는) === 카드돌림[3 % 카드돌림.length]))
ok('한 쪽의 줄 17개(위 · 바닥 · 목록 1~15) — 씨앗 0~199 어느 것이든 주제가 다 다름', Array.from({ length: 200 }, (_, s) => new Set([0, 1, ...Array.from({ length: 15 }, (_, k) => 자리차례('목록', k + 1))].map((m) => 카드주제정하기('/first', m, s, 있는))).size === 17).every(Boolean))
ok('자리차례 — 위 0 · 바닥 1 · 목록1 2 · 목록2 3', 자리차례('위') === 0 && 자리차례('바닥') === 1 && 자리차례('목록', 1) === 2 && 자리차례('목록', 2) === 3)
ok('그림 크기 바꾸기 — 212 → 320 · 492', 그림크기('https://t1a.coupangcdn.com/thumbnails/remote/212x212ex/image/a.jpg', 320) === 'https://t1a.coupangcdn.com/thumbnails/remote/320x320ex/image/a.jpg' && /\/492x492ex\//.test(그림크기(D.상품[0].그림)))
ok('값 글 — 12,900', 원(12900) === '12,900' && 원(0) === '0')
{
  const 틀린 = { 기준: '2026-11-13', 주제들: [['fruit', '과일']], 칸: 날.칸, 상품: [
    ['fruit', '좋은 것', 'https://t1a.coupangcdn.com/thumbnails/remote/212x212ex/image/a.jpg', 100, 90, 10, 5, 3, 'https://link.coupang.com/a/abcDEF12'],
    ['fruit', '나쁜 링크', 'https://t1a.coupangcdn.com/thumbnails/remote/212x212ex/image/b.jpg', 100, 90, 10, 5, 3, 'https://evil.example.com/a/x'],
    ['fruit', '나쁜 그림', 'https://evil.example.com/b.jpg', 100, 90, 10, 5, 3, 'https://link.coupang.com/a/abcDEF13'],
    ['fruit', '값 0', 'https://t1a.coupangcdn.com/thumbnails/remote/212x212ex/image/c.jpg', 100, 0, 10, 5, 3, 'https://link.coupang.com/a/abcDEF14'],
    ['nope', '없는 주제', 'https://t1a.coupangcdn.com/thumbnails/remote/212x212ex/image/d.jpg', 100, 90, 10, 5, 3, 'https://link.coupang.com/a/abcDEF15'],
    'x', null] }
  const r = 카드자료풀기(틀린)
  ok('깨진 줄은 버림(남의 링크 · 남의 그림 · 값 0 · 없는 주제) — 좋은 줄만', r && r.상품.length === 1 && r.상품[0].이름 === '좋은 것', r)
  ok('엉뚱한 자료는 null(→ 화면은 예전 배너로)', [null, {}, { 상품: [] }, { 주제들: [], 칸: [], 상품: [] }, '깨짐'].every((x) => 카드자료풀기(x) === null))
}

if (BASE) {
  const { chromium } = require('playwright')
  const 공지판 = (fs.readFileSync(new URL('../web/src/감사공지.jsx', import.meta.url), 'utf8').match(/const 판 = '([^']+)'/) || [])[1] || ''
  const UA폰 = 'Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'
  const 오늘 = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10)
  const 마감 = (d) => new Date(Date.now() + d * 86400e3 + 9 * 3600e3).toISOString().slice(0, 10) + ' 10:00:00'
  const meta = (k) => ({ built: 오늘 + ' 06:00', chunk: 500, rankChunk: 50, con: { n: k, parts: 1, from: '2026-09-15', to: 오늘 }, serv: { n: 0, parts: 0 } })
  const 일순위 = (k) => Array.from({ length: k }, (_, i) => ({ no: `R00TEST8${String(i).padStart(4, '0')}`, ord: '000', name: `가상 새솔지구 정비공사 ${i + 1}차`, inst: '가상군', dt: 오늘 + ' 11:00:00', amt: 523456000, rate: 89.912, np: 37, nrank: 37,
    base: 583000000, sAmt: 0, lo: -3, hi: 3, llr: 89.745, aval: 0, ayn: 'N', win: '가상건설1(주)', bno: '1238112345', ceo: '홍길동' }))
  const 공고 = (k) => Array.from({ length: k }, (_, i) => ({ no: `R00TEST9${String(i).padStart(4, '0')}`, ord: '000', name: `가상 들말 배수로 정비공사 ${i + 1}`, inst: '가상시', dt: 오늘 + ' 09:00:00', close: 마감(i % 4 + 1), base: 244600000, est: 222363636, lo: -3, hi: 3, llr: 89.745, lic: ['토목공사업/0001'], aval: 0, ayn: 'N', ptot: 15, pdrw: 4, url: '' }))
  const b = await chromium.launch()
  const 셈들 = []
  const 그림들 = []
  const 가짜그림 = (u) => { const s = (u.match(/\/(\d+)x\1ex\//) || [])[1] || '100'; return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}"><rect width="100%" height="100%" fill="#dbeafe"/><text x="50%" y="55%" font-size="${Math.round(s / 6)}" text-anchor="middle" fill="#1e3a8a">${s}</text></svg>` }
  async function 새쪽(w, h, { 폰 = true, 어둠 = false, 몇장 = 34, 자료 = 'ok' } = {}) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', isMobile: 폰, hasTouch: 폰, colorScheme: 어둠 ? 'dark' : 'light',
      userAgent: 폰 ? UA폰 : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36', deviceScaleFactor: OUT ? 2 : 1 })
    await ctx.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|googlesyndication|geojs/, (r) => r.fulfill({ status: 200, body: '' }))
    await ctx.route(/firebaseio\.com|firebasedatabase\.app/, (r) => { const u = decodeURIComponent(r.request().url()); if (/쿠팡/.test(u) && r.request().method() !== 'GET') 셈들.push(u.replace(/^.*?\.(com|app)\//, '')); r.fulfill({ status: 200, contentType: 'application/json', body: r.request().method() === 'GET' ? 'null' : (r.request().postData() || 'null') }) })
    await ctx.route(/coupangcdn\.com/, (r) => { 그림들.push(r.request().url()); r.fulfill({ status: 200, contentType: 'image/svg+xml', body: 가짜그림(r.request().url()) }) })
    await ctx.route(/ads-partners\.coupang\.com/, (r) => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: '<!doctype html><meta charset="utf-8"><a href="https://link.coupang.com/a/test" target="_blank">쿠팡 배너(시험용 가짜)</a>' }))
    await ctx.route(/link\.coupang\.com/, (r) => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: '<title>쿠팡(가짜)</title>쿠팡' }))
    if (자료 === '없음') await ctx.route('**/coupang/cards.json*', (r) => r.fulfill({ status: 404, body: '' }))
    if (자료 === '깨짐') await ctx.route('**/coupang/cards.json*', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"상품":[깨짐' }))
    if (자료 === '늦게') await ctx.route('**/coupang/cards.json*', async (r) => { await new Promise((x) => setTimeout(x, 1500)); r.continue() })
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
  const 줄 = (p, 고름) => p.evaluate((고름) => {
    const a = [...document.querySelectorAll('aside.cpc')]
    const 카드들 = [...document.querySelectorAll('main .notice')]
    const 앞카드 = (y) => { let 앞 = y.previousElementSibling; while (앞 && 앞.matches('aside.adc')) 앞 = 앞.previousElementSibling; return 앞 && 앞.matches('.notice') ? 카드들.indexOf(앞) + 1 : 0 }
    const 모두 = { 수: a.length, 이름들: a.map((y) => y.dataset.cpgN), 주제들: a.map((y) => y.dataset.cpc), 앞카드들: a.map(앞카드), 카드수: 카드들.length, 배너: document.querySelectorAll('aside.cpg').length, 기다림: document.querySelectorAll('.cpc-wait').length }
    const x = 고름 ? document.querySelector(고름) : null
    if (!x) return 모두
    const r = x.getBoundingClientRect(), s = document.getElementById('씀-앞'), 띠 = document.querySelector('.noti-band.cn'), 바닥 = document.querySelector('footer.footer')
    const 줄칸 = x.querySelector('.cpc-row')
    const cs = [...x.querySelectorAll('a.cpc-c')]
    return { ...모두, 자리: x.dataset.cpgAt, 이름: x.dataset.cpgN, 주제: x.dataset.cpc, 작게: x.classList.contains('cpc-sm'), 위끝: Math.round(r.top + scrollY), 높이: Math.round(r.height), 앞카드: 앞카드(x),
      씀밖: !!(s && (x.compareDocumentPosition(s) & Node.DOCUMENT_POSITION_FOLLOWING)), 띠앞: 띠 ? !!(x.compareDocumentPosition(띠) & Node.DOCUMENT_POSITION_FOLLOWING) : '띠없음',
      바닥바로위: x.nextElementSibling === 바닥, 딱지: (x.querySelector('.adc-tag') || {}).textContent, 제목: (x.querySelector('.cpc-t') || {}).textContent, 머리: (x.querySelector('.cpc-hs') || {}).textContent,
      문구: (x.querySelector('.cpc-dis') || {}).textContent, 넘김: 줄칸 ? 줄칸.scrollWidth - 줄칸.clientWidth : -1, 머리넘침: x.querySelector('.cpc-h').scrollWidth - x.querySelector('.cpc-h').clientWidth,
      카드: cs.length, 카드들: cs.slice(0, 40).map((c) => ({ href: c.getAttribute('href'), target: c.target, rel: c.rel, rp: c.getAttribute('referrerpolicy'), img: (c.querySelector('img') || {}).getAttribute ? c.querySelector('img').getAttribute('src') : '', 이름: (c.querySelector('.cpc-n') || {}).textContent, 값: (c.querySelector('.cpc-p b') || {}).textContent, 할인: (c.querySelector('.cpc-p em') || {}).textContent || '', 원값: (c.querySelector('.cpc-o') || {}).textContent || '', 별: (c.querySelector('.cpc-r') || {}).textContent || '', w: Math.round(c.getBoundingClientRect().width) })) }
  }, 고름)
  const 넘침 = (p) => p.evaluate(() => document.documentElement.scrollWidth - innerWidth)
  const 숨김 = (p) => p.addStyleTag({ content: '.insa{display:none!important}' })
  const 기다림 = async (f, ms = 6000) => { const t = Date.now(); while (Date.now() - t < ms) { if (f()) return true; await new Promise((r) => setTimeout(r, 150)) } return false }
  const 셈수 = (종류, 이름, 주제) => 셈들.filter((u) => u.includes(종류) && u.includes(`|카드-${이름}-${주제}`)).length
  const 이름of = (id) => (D.주제들.find((t) => t.id === id) || {}).이름
  const 카드꼴 = (z, 크기) => z.카드 >= 6 && z.카드들.every((c) => /^https:\/\/link\.coupang\.com\/a\/[A-Za-z0-9]+$/.test(c.href) && c.target === '_blank' && /sponsored/.test(c.rel) && /noopener/.test(c.rel) && c.rp === 'unsafe-url'
    && new RegExp(`/${크기}x${크기}ex/`).test(c.img) && c.이름.length >= 3 && /^\d{1,3}(,\d{3})*원$/.test(c.값) && (!c.할인 || /^\d{1,2}%$/.test(c.할인)))
  const 자료에있음 = (z) => z.카드들.every((c) => { const q = D.상품.find((x) => x.짧은 === c.href); return q && q.주제 === z.주제 && q.이름 === c.이름 && `${원(q.값)}원` === c.값 })

  console.log('② 화면 — 폰 390 · 첫 화면(/)')
  {
    const { ctx, p, 오류 } = await 새쪽(390, 844)
    await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' })
    await p.waitForSelector('aside.cpc[data-cpg-n="위"] a.cpc-c', { timeout: 15000 })
    await p.waitForSelector('aside.cpc[data-cpg-n="바닥"] a.cpc-c', { timeout: 15000 })
    await p.waitForTimeout(800)
    const 위 = await 줄(p, 'aside.cpc[data-cpg-n="위"]')
    ok('맨 위 작은 카드 줄 하나 — 첫 화면 위쪽(260px 안) · «써 본 횟수» 칸 밖 · 공사 연결 띠 앞 · 예전 배너 없음', 위.이름들.filter((x) => x === '위').length === 1 && 위.작게 && 위.위끝 <= 260 && 위.씀밖 && 위.띠앞 === true && 위.배너 === 0, 위)
    ok(`쪽 맞춤 — 첫 화면 맨 위 «${이름of('sitewinter')}»`, 위.주제 === 'sitewinter', 위.주제)
    ok('«광고» 딱지 · 주제 이름 · «쿠팡 · 11월 13일 가격»', 위.딱지 === '광고' && 위.제목 === 이름of(위.주제) && 위.머리 === '쿠팡 · 11월 13일 가격', [위.딱지, 위.제목, 위.머리])
    ok('대가성 문구 그대로 + «가격은 바뀔 수 있습니다.»', 위.문구 === `${쿠팡문구} 가격은 바뀔 수 있습니다.`, 위.문구)
    ok(`카드 ${위.카드}장 — 링크(쿠팡 상품 링크) · 새 창 · sponsored · noopener · 그림 320 · 이름 · 값(12,900원) · 할인(%)`, 카드꼴(위, 320), 위.카드들.slice(0, 3))
    ok('카드 글이 자료 그대로(이름 · 값 · 주제)', 자료에있음(위), 위.카드들.slice(0, 2))
    ok('그 주제 상품이 다 나옴(주제 하나 = 한 줄)', 위.카드 === D.상품.filter((x) => x.주제 === 위.주제).length, [위.카드])
    ok('작은 카드 — 원값 · 별점은 안 보임(줄을 낮게)', 위.카드들.every((c) => !c.원값 && !c.별))
    ok('옆으로 넘김(줄 폭보다 김) · 쪽 넘침 0 · 머리 넘침 0', 위.넘김 > 300 && await 넘침(p) <= 0 && 위.머리넘침 <= 0, { 넘김: 위.넘김, 넘침: await 넘침(p), 머리넘침: 위.머리넘침 })
    ok(`맨 위 줄 높이 ${위.높이}px ≤ 250(예전 배너 줄과 비슷 · 첫 화면을 덜 가림)`, 위.높이 <= 250, 위.높이)
    const 바닥 = await 줄(p, 'aside.cpc[data-cpg-n="바닥"]')
    ok('바닥 큰 카드 줄 — 바닥글 바로 위 · 큰 카드(그림 492 · 원값 · 별점) · 맨 위 줄과 다른 주제', 바닥.바닥바로위 && !바닥.작게 && 카드꼴(바닥, 492) && 바닥.카드들.some((c) => c.원값 && c.별) && 바닥.주제 !== 위.주제, { 주제: [위.주제, 바닥.주제], 바로위: 바닥.바닥바로위, 첫: 바닥.카드들[0] })
    ok('큰 카드 폭 156 · 작은 카드 폭 104', 바닥.카드들.every((c) => c.w === 156) && 위.카드들.every((c) => c.w === 104), [바닥.카드들[0].w, 위.카드들[0].w])
    ok('별점 글 «★ 4.5 (1,234)» 꼴', 바닥.카드들.filter((c) => c.별).every((c) => /^★ \d\.\d \([\d,]+\)$/.test(c.별.trim())), 바닥.카드들.slice(0, 2).map((c) => c.별))
    ok('원값 «12,900원»(줄 그음)', 바닥.카드들.filter((c) => c.원값).every((c) => /^\d{1,3}(,\d{3})*원$/.test(c.원값)))
    if (OUT) { await 숨김(p); await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(400); await p.screenshot({ path: `${OUT}/카드_폰390_위.png` }); await p.evaluate(() => document.querySelector('aside.cpc[data-cpg-n="바닥"]').scrollIntoView({ block: 'center' })); await p.waitForTimeout(500); await p.screenshot({ path: `${OUT}/카드_폰390_바닥.png` }) }
    await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(300)
    await 기다림(() => 셈수('쿠팡보임', '위', 위.주제) > 0); await p.waitForTimeout(500)
    ok(`숨은 셈 — 보이면 «|쿠팡보임|카드-위-${위.주제}» 한 번`, 셈수('쿠팡보임', '위', 위.주제) === 1, 셈들)
    const [새창] = await Promise.all([ctx.waitForEvent('page', { timeout: 8000 }).catch(() => null), p.click('aside.cpc[data-cpg-n="위"] a.cpc-c >> nth=1')])
    await 기다림(() => 셈수('쿠팡누름', '위', 위.주제) > 0)
    ok(`카드를 누르면 새 창(쿠팡 링크) · «|쿠팡누름|카드-위-${위.주제}» 한 번`, !!새창 && /link\.coupang\.com\/a\//.test(새창.url()) && 셈수('쿠팡누름', '위', 위.주제) === 1 && 셈들.filter((u) => u.includes('쿠팡누름')).length === 1, [새창 && 새창.url(), 셈들])
    if (새창) await 새창.close()
    await p.bringToFront()
    await p.evaluate(() => document.querySelector('aside.cpc[data-cpg-n="바닥"]').scrollIntoView({ block: 'center' }))
    await 기다림(() => 셈수('쿠팡보임', '바닥', 바닥.주제) > 0)
    ok(`바닥 줄이 보이면 «|쿠팡보임|카드-바닥-${바닥.주제}» 한 번`, 셈수('쿠팡보임', '바닥', 바닥.주제) === 1, 셈들)
    const 그림주소 = 그림들.filter((u) => /coupangcdn/.test(u))
    ok('그림은 쿠팡 그림 주소로만 받음(320 · 492) · 처음 세 장 빼고 늦게(lazy)', 그림주소.length > 0 && 그림주소.every((u) => /\/(320x320|492x492)ex\//.test(u)) && await p.evaluate(() => [...document.querySelectorAll('aside.cpc')].every((a) => [...a.querySelectorAll('img')].every((im, i) => im.getAttribute('loading') === (i < 3 ? 'eager' : 'lazy')))), 그림주소.slice(0, 3))
    await p.click('footer a[href="/how"]')
    await p.waitForURL(/\/how$/, { timeout: 10000 }); await p.waitForTimeout(900)
    const z2 = await 줄(p, 'aside.cpc[data-cpg-n="위"]')
    ok('다른 쪽(/how) — 맨 위 줄 하나 · 돌림 주제 · 바닥 줄도 있음 · 둘이 다른 주제', z2.이름들.filter((x) => x === '위').length === 1 && 카드돌림.includes(z2.주제) && z2.이름들.includes('바닥') && new Set(z2.주제들).size === z2.주제들.length, z2.이름들.concat(z2.주제들))
    await p.evaluate(() => window.scrollTo(0, 0))
    await 기다림(() => 셈수('쿠팡보임', '위', z2.주제) > 0)
    ok('쪽을 옮겨 보이면 그 주제로 또 셈', 셈수('쿠팡보임', '위', z2.주제) >= 1, 셈들)
    ok('오류 0', !오류.length, 오류)
    await ctx.close()
  }

  console.log('② 목록 사이 — 1순위(/first) · 공고(/live) 34장')
  for (const 곳 of ['/first', '/live']) {
    const { ctx, p, 오류 } = await 새쪽(390, 844)
    await p.goto(BASE + 곳, { waitUntil: 'domcontentloaded' })
    await p.waitForSelector('main .notice', { timeout: 15000 })
    await p.waitForSelector('aside.cpc[data-cpg-n="목록1"] a.cpc-c', { timeout: 15000 }); await p.waitForTimeout(700)
    const 모두 = await 줄(p)
    const 업체 = 곳 === '/first' ? [2, 9, 16] : [Math.min(2, 모두.카드수 - 1)]
    const 기대 = 목록쿠팡자리(모두.카드수, 업체).map((q) => q + 1)
    const 목록앞 = 모두.이름들.map((x, k) => [x, 모두.앞카드들[k]]).filter(([x]) => /^목록/.test(x)).map(([, c]) => c)
    ok(`${곳} 목록 사이 — 카드 ${모두.카드수}장 중 ${기대.join(' · ')}째 다음(예전 배너 자리 그대로)`, 기대.length >= 2 && 목록앞.join() === 기대.join(), { 기대, 목록앞 })
    ok(`${곳} 한 쪽의 쿠팡 줄(위 · 목록 ${기대.length} · 바닥) 주제가 다 다름`, 모두.주제들.length === 기대.length + 2 && new Set(모두.주제들).size === 모두.주제들.length, 모두.주제들)
    const z = await 줄(p, 'aside.cpc[data-cpg-n="목록1"]')
    ok(`${곳} 목록 줄 — 큰 카드(그림 492) · 링크 · 값 · 쪽 넘침 0`, !z.작게 && 카드꼴(z, 492) && 자료에있음(z) && await 넘침(p) <= 0, z.카드들.slice(0, 2))
    await p.evaluate(() => document.querySelector('aside.cpc[data-cpg-n="목록1"]').scrollIntoView({ block: 'center' }))
    await 기다림(() => 셈수('쿠팡보임', '목록1', z.주제) > 0)
    ok(`${곳} 목록 줄이 보이면 «|쿠팡보임|카드-목록1-${z.주제}» 한 번`, 셈수('쿠팡보임', '목록1', z.주제) === 1)
    if (OUT && 곳 === '/first') { await 숨김(p); await p.waitForTimeout(400); await p.screenshot({ path: `${OUT}/카드_폰390_목록.png` }) }
    ok(`${곳} 오류 0`, !오류.length, 오류)
    await ctx.close()
  }

  console.log('③ 쪽 맞춤 · 목록 짧을 때 · PC 1280 · 폰 320 · 어두운 화면 · 인쇄 · 문의함 · 자료 못 받을 때')
  for (const [곳, id] of [['/cert', 'cert'], ['/tools', 'tools'], ['/forms', 'office'], ['/tools/risk', 'sitewinter']]) {
    const { ctx, p, 오류 } = await 새쪽(390, 844)
    await p.goto(BASE + 곳, { waitUntil: 'domcontentloaded' })
    await p.waitForSelector('aside.cpc[data-cpg-n="위"] a.cpc-c', { timeout: 15000 }); await p.waitForTimeout(300)
    const z = await 줄(p, 'aside.cpc[data-cpg-n="위"]')
    ok(`${곳} → 맨 위 «${이름of(id)}» · 오류 0`, z.주제 === id && z.제목 === 이름of(id) && !오류.length, [z.주제, 오류])
    await ctx.close()
  }
  for (const 곳 of ['/first', '/live']) {
    const { ctx, p, 오류 } = await 새쪽(390, 844, { 몇장: 4 })
    await p.goto(BASE + 곳, { waitUntil: 'domcontentloaded' })
    await p.waitForSelector('main .notice', { timeout: 15000 })
    await p.waitForSelector('aside.cpc[data-cpg-n="위"] a.cpc-c', { timeout: 15000 }); await p.waitForTimeout(500)
    const z = await 줄(p)
    ok(`${곳} 목록이 넉 장뿐 — 목록 줄 없이 위 · 바닥만`, z.이름들.join() === '위,바닥' && !오류.length, [z.이름들, 오류])
    await ctx.close()
  }
  {
    const { ctx, p, 오류 } = await 새쪽(1280, 900, { 폰: false })
    await p.goto(BASE + '/first', { waitUntil: 'domcontentloaded' })
    await p.waitForSelector('aside.cpc[data-cpg-n="목록1"] a.cpc-c', { timeout: 15000 }); await p.waitForTimeout(600)
    const z = await 줄(p, 'aside.cpc[data-cpg-n="목록1"]')
    const 단추 = await p.evaluate(() => { const b = document.querySelectorAll('aside.cpc[data-cpg-n="목록1"] .cpc-nav button'); return [...b].map((x) => getComputedStyle(x.parentElement).display + '/' + Math.round(x.getBoundingClientRect().width)) })
    const 앞 = await p.evaluate(() => document.querySelector('aside.cpc[data-cpg-n="목록1"] .cpc-row').scrollLeft)
    await p.click('aside.cpc[data-cpg-n="목록1"] .cpc-nav button >> nth=1'); await p.waitForTimeout(900)
    const 뒤 = await p.evaluate(() => document.querySelector('aside.cpc[data-cpg-n="목록1"] .cpc-row').scrollLeft)
    ok('PC 1280 — ‹ › 단추 보임 · › 를 누르면 줄이 넘어감 · 큰 카드 168 · 넘침 0', 단추.length === 2 && 단추.every((x) => /^flex\/28$/.test(x)) && 뒤 > 앞 + 200 && z.카드들.every((c) => c.w === 168) && await 넘침(p) <= 0, { 단추, 앞, 뒤, w: z.카드들[0].w })
    if (OUT) { await 숨김(p); await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(400); await p.screenshot({ path: `${OUT}/카드_PC1280_위.png` }) }
    await p.emulateMedia({ media: 'print' })
    ok('PC — 인쇄에는 안 나옴 · 오류 0', await p.evaluate(() => [...document.querySelectorAll('aside.cpc')].every((x) => getComputedStyle(x).display === 'none')) && !오류.length, 오류)
    await ctx.close()
  }
  {
    const { ctx, p, 오류 } = await 새쪽(390, 844)
    await p.goto(BASE + '/first', { waitUntil: 'domcontentloaded' })
    await p.waitForSelector('aside.cpc[data-cpg-n="위"] a.cpc-c', { timeout: 15000 }); await p.waitForTimeout(400)
    ok('폰 — ‹ › 단추는 안 보임(손으로 밀어 넘김)', await p.evaluate(() => getComputedStyle(document.querySelector('aside.cpc .cpc-nav')).display === 'none'))
    await ctx.close()
  }
  {
    const { ctx, p, 오류 } = await 새쪽(320, 700)
    await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' })
    await p.waitForSelector('aside.cpc[data-cpg-n="위"] a.cpc-c', { timeout: 15000 }); await p.waitForTimeout(500)
    const z = await 줄(p, 'aside.cpc[data-cpg-n="위"]')
    ok('폰 320 — 쪽 넘침 0 · 머리 넘침 0 · 줄은 옆으로 넘김 · 오류 0', await 넘침(p) <= 0 && z.머리넘침 <= 0 && z.넘김 > 200 && !오류.length, { 넘침: await 넘침(p), 머리넘침: z.머리넘침, 오류 })
    await ctx.close()
  }
  {
    const { ctx, p, 오류 } = await 새쪽(390, 844, { 어둠: true })
    await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' })
    await p.waitForSelector('aside.cpc[data-cpg-n="바닥"] a.cpc-c', { timeout: 15000 }); await p.waitForTimeout(400)
    const 대비 = await p.evaluate(() => {
      const rgb = (s) => (s.match(/\d+(\.\d+)?/g) || []).slice(0, 3).map(Number)
      const 밝기 = ([r, g, bb]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(bb) }
      const 비 = (a, c) => { const x = 밝기(rgb(a)), y = 밝기(rgb(c)); return Math.round((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) * 100) / 100 }
      const x = document.querySelector('aside.cpc[data-cpg-n="바닥"]'), 바탕 = getComputedStyle(x).backgroundColor
      const 색 = (q) => getComputedStyle(x.querySelector(q)).color
      return { 제목: 비(색('.cpc-t'), 바탕), 머리: 비(색('.cpc-hs'), 바탕), 문구: 비(색('.cpc-dis'), 바탕), 이름: 비(색('.cpc-n'), 바탕), 값: 비(색('.cpc-p b'), 바탕), 할인: 비(색('.cpc-p em'), 바탕), 원값: 비(색('.cpc-o'), 바탕), 바탕 }
    })
    ok('어두운 화면 — 제목 · 머리 · 문구 · 이름 · 값 · 할인 · 원값 대비 4.5 넘음', Object.entries(대비).filter(([k]) => k !== '바탕').every(([, v]) => v >= 4.5), 대비)
    ok('어두운 화면 오류 0', !오류.length, 오류)
    await ctx.close()
  }
  {
    const { ctx, p, 오류 } = await 새쪽(390, 844)
    await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' })
    await p.waitForSelector('aside.cpc[data-cpg-n="바닥"] a.cpc-c', { timeout: 15000 }); await p.waitForTimeout(300)
    const 대비 = await p.evaluate(() => {
      const rgb = (s) => (s.match(/\d+(\.\d+)?/g) || []).slice(0, 3).map(Number)
      const 밝기 = ([r, g, bb]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(bb) }
      const 비 = (a, c) => { const x = 밝기(rgb(a)), y = 밝기(rgb(c)); return Math.round((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) * 100) / 100 }
      const x = document.querySelector('aside.cpc[data-cpg-n="바닥"]'), 바탕 = getComputedStyle(x).backgroundColor
      const 색 = (q) => getComputedStyle(x.querySelector(q)).color
      return { 머리: 비(색('.cpc-hs'), 바탕), 문구: 비(색('.cpc-dis'), 바탕), 할인: 비(색('.cpc-p em'), 바탕), 원값: 비(색('.cpc-o'), 바탕) }
    })
    ok('밝은 화면 — 머리 · 문구 · 할인 · 원값 대비 4.5 넘음', Object.values(대비).every((v) => v >= 4.5), 대비)
    await ctx.close()
  }
  {
    const { ctx, p } = await 새쪽(390, 844)
    await p.goto(BASE + '/admin', { waitUntil: 'domcontentloaded' })
    await p.waitForSelector('footer.footer', { timeout: 15000 }); await p.waitForTimeout(1500)
    const z = await 줄(p)
    ok('문의함(/admin)에는 카드 줄 · 배너 · 빈 틀 다 없음', z.수 === 0 && z.배너 === 0 && z.기다림 === 0, z)
    await ctx.close()
  }
  for (const 꼴 of ['없음', '깨짐']) {
    const { ctx, p, 오류 } = await 새쪽(390, 844, { 자료: 꼴 })
    await p.goto(BASE + '/first', { waitUntil: 'domcontentloaded' })
    await p.waitForSelector('main .notice', { timeout: 15000 })
    await p.waitForSelector('aside.cpg[data-cpg-n="위"] iframe', { timeout: 15000 }); await p.waitForTimeout(800)
    const z = await 줄(p)
    const 배너들 = await p.evaluate(() => [...document.querySelectorAll('aside.cpg')].map((a) => a.dataset.cpgN))
    ok(`자료를 못 받으면(${꼴}) — 예전 배너로(맨 위 · 목록 사이) · 카드 줄 · 빈 틀 없음 · 바닥 없음 · 오류 0`, z.수 === 0 && z.기다림 === 0 && 배너들[0] === '위' && 배너들.includes('목록1') && !배너들.includes('바닥') && !오류.length, [배너들, z.수, 오류])
    await ctx.close()
  }
  {
    const { ctx, p, 오류 } = await 새쪽(390, 844, { 자료: '늦게' })
    await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' })
    await p.waitForSelector('.cpc-wait', { timeout: 10000 })
    await p.waitForSelector('.noti-band.cn', { timeout: 10000 })
    const 전 = await p.evaluate(() => [Math.round(document.querySelector('.noti-band.cn').getBoundingClientRect().top + scrollY), Math.round(document.querySelector('.cpc-wait').getBoundingClientRect().height), document.querySelector('.cpc-wait').getAttribute('aria-hidden')])
    await p.waitForSelector('aside.cpc[data-cpg-n="위"] a.cpc-c', { timeout: 10000 }); await p.waitForTimeout(400)
    const 후 = await p.evaluate(() => [Math.round(document.querySelector('.noti-band.cn').getBoundingClientRect().top + scrollY), Math.round(document.querySelector('aside.cpc[data-cpg-n="위"]').getBoundingClientRect().height)])
    const z = await 줄(p)
    ok(`자료가 늦게 와도 — 먼저 같은 높이 빈 틀(${전[1]} → ${후[1]}px · 읽기 프로그램엔 숨김)로 자리 잡음 · 덜컥임 ${후[0] - 전[0]}px ≤ 4 · 오면 빈 틀은 사라짐 · 오류 0`, Math.abs(후[0] - 전[0]) <= 4 && Math.abs(후[1] - 전[1]) <= 4 && 전[2] === 'true' && z.기다림 === 0 && z.이름들.includes('위') && !오류.length, { 전, 후, 기다림: z.기다림, 오류 })
    await ctx.close()
  }
  await b.close()
}
console.log(`\n${bad ? '✗' : '✓'} ${n - bad}/${n}`)
process.exit(bad ? 1 : 0)
