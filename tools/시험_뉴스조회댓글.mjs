// 👁💬 G735 (2026-11-17) 건설뉴스 그날 호 «조회 · 댓글» 화면 시험 — 소장님 「건설 뉴스 … 클릭수 보이게 해줘. 댓글쓰게도 해주고」
//   구운 사이트(가짜 파이어베이스로 구운 것)를 띄운 뒤:  B=http://127.0.0.1:4997 node tools/시험_뉴스조회댓글.mjs
//   ① /news/{날}: 날짜 줄 «👁 N»(시작값 + 건설맵이 센 것 · 연 것 +1) · «💬 댓글 N»(comments − comment_del 열쇠 수) · 맨 위 «👁 이 화면 조회» 줄 없음
//   ② /news(가장 최근): |news 와 그날 호 |news|{날} 둘 다 +1 · 같은 날 다시 열면 안 셈 · 소장님 기기(kcm_op)는 안 셈
//   ③ «💬 댓글» 누름 → 아래 댓글 칸이 펼쳐지고 화면에 들어옴 · 쓰는 칸 안내 «이 날 뉴스에 한마디» · 올리기 뒤 댓글이 목록에 · «댓글 N» 다시 읽음
//   ④ 폭 320 · 390 · 1280 넘침 없음 · 화면 오류 0 · «무료» · «클로드» 없음 · 다른 쪽(/forms)의 맨 위 «👁 이 화면 조회» 줄은 그대로
//   가상 자료만 씀(데이터베이스 · 위치 · 광고는 모두 가짜로 받음) · 인터넷 안 부름.
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const B = process.env.B || 'http://127.0.0.1:4997'
const 날 = process.env.NEWS_D || '2026-11-16'
let ok = 0, bad = 0
const 봐 = (c, m, 더 = '') => { if (c) { ok++; console.log('  ✓', m) } else { bad++; console.log('  ✗', m, String(더).slice(0, 300)) } }

const br = await chromium.launch()
async function 새판({ w = 390, h = 844, 운영자 = false, 디비 = new Map(), 쓴 = [], 읽은 = [] } = {}) {
  const 폰 = w < 700
  const ctx = await br.newContext({ viewport: { width: w, height: h }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', isMobile: 폰, hasTouch: 폰,
    userAgent: 폰 ? 'Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'
      : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36' })
  await ctx.addInitScript((op) => {
    Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false })
    try { if (op) localStorage.setItem('kcm_op', '1') } catch (e) { /* 없음 */ }
  }, 운영자)
  await ctx.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|googlesyndication|daumcdn|kakao|coupang/, (r) => r.fulfill({ status: 200, body: '' }))
  await ctx.route('https://get.geojs.io/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ country_code: 'KR', region: 'Seoul' }) }))
  await ctx.route('https://k-conmap-default-rtdb.firebaseio.com/**', async (rt) => {
    const q = rt.request(); const u = new URL(q.url())
    const 길 = decodeURIComponent(u.pathname.replace(/\.json$/, '').slice(1))
    if (q.method() === 'PUT' || q.method() === 'PATCH' || q.method() === 'POST') {
      쓴.push(길); const v = q.postData(); 디비.set(길, v)
      return rt.fulfill({ status: 200, contentType: 'application/json', body: v || 'null' })
    }
    읽은.push(길 + (u.searchParams.get('shallow') ? '?shallow' : ''))
    const v = 디비.has(길) ? 디비.get(길) : 'null'
    return rt.fulfill({ status: 200, contentType: 'application/json', headers: { ETag: 'e' + v, 'Access-Control-Expose-Headers': 'ETag' }, body: v })
  })
  const p = await ctx.newPage()
  const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
  return { ctx, p, 오류, 디비, 쓴, 읽은 }
}
const 넘침 = (p) => p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
const 날줄 = (p) => p.evaluate(() => {
  const d = document.querySelector('.nw-date')
  return { 글: d ? d.innerText.replace(/\s+/g, ' ').trim() : '', 눈: (document.querySelector('.nw-v') || {}).innerText || '', 댓: (document.querySelector('.nw-cmn') || {}).innerText || '', 위줄: !!document.querySelector('.pvline') }
})

console.log('① /news/' + 날 + ' — 날짜 줄 «👁 N» · «💬 댓글 N»')
{
  const 디비 = new Map([[`pv/a/|news|${날}`, '41'], [`comments/news-${날}`, JSON.stringify({ a: 1, b: 1, c: 1 })], [`comment_del/news-${날}`, JSON.stringify({ c: 1 })]])
  const s = await 새판({ 디비 })
  await s.p.goto(`${B}/news/${날}`, { waitUntil: 'domcontentloaded' })
  await s.p.waitForSelector('.nw-date', { timeout: 15000 })
  await s.p.waitForTimeout(2500)
  const z = await 날줄(s.p)
  봐(s.쓴.filter((x) => x === `pv/a/|news|${날}`).length === 1, `연 것 +1 — pv/a/|news|${날} 한 번 씀`, JSON.stringify(s.쓴))
  봐(/^👁 42$/.test(z.눈.trim()), `날짜 줄 «👁 42»(시작 41 + 연 것 1)`, z.글)
  봐(/^💬 댓글 2$/.test(z.댓.trim()), '날짜 줄 «💬 댓글 2»(쓴 3 − 지운 1)', z.글)
  봐(s.읽은.includes(`comments/news-${날}?shallow`) && s.읽은.includes(`comment_del/news-${날}?shallow`), '댓글 수는 열쇠만(shallow) 두 번 읽음', JSON.stringify(s.읽은.filter((x) => /comment/.test(x))))
  봐(!z.위줄, '맨 위 «👁 이 화면 조회» 줄은 뉴스 쪽에서 안 보임(숫자 둘이 다르게 보이지 않게)')
  const 섹 = await s.p.evaluate(() => { const c = document.querySelector('.nw-cm'); return c ? { 머리: (c.querySelector('.nw-cm-h') || {}).innerText || '', 단추: (c.querySelector('.cm-toggle') || {}).innerText || '', 열림: !!c.querySelector('.cm-box') } : null })
  봐(섹 && /이 날 뉴스 이야기/.test(섹.머리) && /2/.test(섹.머리) && /댓글 보기 · 쓰기/.test(섹.단추) && /2개/.test(섹.단추) && !섹.열림, '아래 댓글 칸 — «💬 이 날 뉴스 이야기 2» · 접힌 단추 «댓글 보기 · 쓰기 2개»(파이어베이스는 열 때만)', JSON.stringify(섹))
  /* ③ 날짜 줄 «💬 댓글» 누름 → 펼침 · 화면에 들어옴 */
  const 앞읽음 = s.읽은.filter((x) => x === `comments/news-${날}?shallow`).length
  await s.p.click('.nw-cmn')
  await s.p.waitForTimeout(1600)
  const 열 = await s.p.evaluate(() => {
    const c = document.querySelector('.nw-cm'); const r = c ? c.getBoundingClientRect() : null
    const t = c && c.querySelector('textarea')
    return { 열림: !!(c && c.querySelector('.cm-box')), 위: r ? Math.round(r.top) : null, 높이: innerHeight, 안내: t ? t.placeholder : '', 제목: ((c && c.querySelector('.cm-box .hint')) || {}).innerText || '' }
  })
  봐(열.열림 && 열.위 !== null && 열.위 >= -5 && 열.위 < 열.높이 * 0.6, `«💬 댓글» 누르면 아래 댓글 칸이 펼쳐지고 화면 위쪽으로 옴(위 ${열.위}px)`, JSON.stringify(열))
  봐(/이 날 뉴스에 한마디/.test(열.안내) && /건설뉴스 11\. 16\./.test(열.제목), '쓰는 칸 안내 «이 날 뉴스에 한마디 …» · 머리 «「건설뉴스 11. 16.(월)」 에 대한 이야기»', JSON.stringify(열))
  await s.p.fill('.nw-cm textarea', '가상 댓글 — 시험')
  await s.p.fill('.nw-cm .cm-row input', '1234')
  await s.p.click('.nw-cm .cm-row .btn')
  await s.p.waitForTimeout(1500)
  const 뒤 = await s.p.evaluate(() => [...document.querySelectorAll('.nw-cm .cm-item .cm-b')].map((x) => x.innerText))
  const 뒤읽음 = s.읽은.filter((x) => x === `comments/news-${날}?shallow`).length
  봐(뒤.includes('가상 댓글 — 시험'), '올리기 → 댓글이 목록에 보임(가짜 파이어베이스)', JSON.stringify(뒤))
  봐(뒤읽음 > 앞읽음, '올린 뒤 «댓글 N» 을 다시 읽음', `${앞읽음} → ${뒤읽음}`)
  봐(s.오류.length === 0, '화면 오류 0', s.오류.join(' | '))
  const 글 = await s.p.evaluate(() => { const c = document.querySelector('.nw'); return c ? c.innerText : '' })
  봐(!/무료|클로드|Claude/.test(글), '«무료» · «클로드» 없음')
  await s.ctx.close()
}

console.log('② /news(가장 최근) — 그날 호 열쇠로도 셈 · 같은 날 다시 열면 안 셈 · 소장님 기기는 안 셈')
{
  const s = await 새판({ 디비: new Map([[`pv/a/|news|${날}`, '10'], ['pv/a/|news', '5']]) })
  await s.p.goto(`${B}/news`, { waitUntil: 'domcontentloaded' })
  await s.p.waitForSelector('.nw-date', { timeout: 15000 })
  await s.p.waitForTimeout(2500)
  const 첫 = [...s.쓴]
  봐(첫.filter((x) => x === 'pv/a/|news').length === 1 && 첫.filter((x) => x === `pv/a/|news|${날}`).length === 1, `/news 로 열면 |news 와 |news|${날} 둘 다 한 번씩`, JSON.stringify(첫))
  const z = await 날줄(s.p)
  봐(/^👁 11$/.test(z.눈.trim()) && !z.위줄, '날짜 줄 «👁 11»(그날 호 10 + 1) · 맨 위 줄 없음', z.글)
  await s.p.reload({ waitUntil: 'domcontentloaded' }); await s.p.waitForSelector('.nw-date'); await s.p.waitForTimeout(2000)
  const 조회만 = (a) => a.filter((x) => x.startsWith('pv/a/'))
  봐(조회만(s.쓴).length === 조회만(첫).length, '같은 날 다시 열면(새로 고침) 조회는 더 안 셈(pv/a)', JSON.stringify(조회만(s.쓴.slice(첫.length))))
  await s.p.goto(`${B}/forms`, { waitUntil: 'domcontentloaded' }); await s.p.waitForTimeout(2500)
  봐(await s.p.evaluate(() => !!document.querySelector('.pvline')), '다른 쪽(/forms)은 맨 위 «👁 이 화면 조회» 줄 그대로')
  봐(s.오류.length === 0, '화면 오류 0', s.오류.join(' | '))
  await s.ctx.close()
  const o = await 새판({ 운영자: true })
  await o.p.goto(`${B}/news`, { waitUntil: 'domcontentloaded' }); await o.p.waitForSelector('.nw-date'); await o.p.waitForTimeout(2500)
  봐(!o.쓴.some((x) => x.startsWith('pv/a/')), '소장님 기기(kcm_op)는 안 셈', JSON.stringify(o.쓴))
  await o.ctx.close()
}

console.log('④ 폭 320 · 390 · 1280 — 넘침 없음 · 날짜 줄 한눈에')
for (const [w, h] of [[320, 640], [390, 844], [1280, 900]]) {
  const s = await 새판({ w, h, 디비: new Map([[`pv/a/|news|${날}`, '1234'], [`comments/news-${날}`, JSON.stringify({ a: 1 })]]) })
  await s.p.goto(`${B}/news/${날}`, { waitUntil: 'domcontentloaded' })
  await s.p.waitForSelector('.nw-date', { timeout: 15000 }); await s.p.waitForTimeout(2000)
  const n = await 넘침(s.p)
  const r = await s.p.evaluate(() => { const a = document.querySelector('.nw-v'), b = document.querySelector('.nw-cmn'), d = document.querySelector('.nw-date'); const q = (e) => (e ? e.getBoundingClientRect() : null); return { a: q(a), b: q(b), d: q(d) } })
  const 안 = r.a && r.b && r.d && r.a.right <= r.d.right + 1 && r.b.right <= r.d.right + 1 && r.b.height < 40
  봐(n <= 0 && 안, `폭 ${w} — 넘침 ${n} · 👁 · 💬 가 날짜 줄 안(💬 높이 ${r.b && Math.round(r.b.height)})`, JSON.stringify(r))
  if (process.env.OUT) await s.p.screenshot({ path: `${process.env.OUT}/뉴스_${w}.png`, fullPage: false })
  봐(s.오류.length === 0, `폭 ${w} 화면 오류 0`, s.오류.join(' | '))
  await s.ctx.close()
}
await br.close()
console.log(`\n${ok} 통과 · ${bad} 실패`)
process.exit(bad ? 1 : 0)
