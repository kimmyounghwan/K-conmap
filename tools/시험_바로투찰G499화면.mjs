// 🧪 G499 (2026-11-01) 바로투찰 넷 + 설명 — 화면 시험(PC · 폰 · 두 브라우저가 가짜 데이터베이스 하나를 같이 씀)
//   소장님 「1부터 4까지 한 번에 만들어서 완벽하게 검증 후에 올리자」 「바로투찰 설명을 더 자세히」
//   돌리기: 화면 빌드(D) · 작은 틀(M — 내금액 · 관심분포만 그리는 /tmp/g10/g499/mini) 을 얹고
//     LC_ALL=C.UTF-8 D=/tmp/g10/g499/dist M=/tmp/g10/g499/minidist node tools/시험_바로투찰G499화면.mjs
//     ⚠️ LC_ALL=C.UTF-8 — 없으면 리눅스 크롬이 한글 파일 이름을 «download» 로 바꿈(화면 탓 아님)
//   ① 관심도 — 두 기기가 공고를 고르면 «본 사람 1명 → 2명» · 금액 복사 때 분위가 bc/q 에(규칙처럼 아무도 못 읽음) · 같은 공고 다시 골라도 안 늚
//   ② 품의서 — PDF 받기 · 진짜 PDF · 공사명 · 화면과 같은 금액 · 결재
//   ③ 사용 방법 — 첫 화면 접힘 칸 11단계 + 묻는 것 4 · /how 에도 같은 글
//   ④ 낙찰 서류 한 벌 — 주소 값이 칸에 · 채우기 → 공통 칸 · 착공계(종이)에 공사명 · 계약금액(숫자) · 블록 서식에 공사명
//   ⑤ 복기 · 1순위면 한 벌 단추 · 마감 뒤 이용자 자리(작은 틀) ⑥ 320~1280 넘침 · 오류 0
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'module'
const require = createRequire(process.env.PW || '/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const D = process.env.D || '/tmp/g10/g499/dist', M = process.env.M || '/tmp/g10/g499/minidist'
let ok = 0, bad = 0
const 봐 = (c, m, 더 = '') => { if (c) ok++; else bad++; console.log(c ? '  ✓' : '  ✗', m, c ? '' : String(typeof 더 === 'string' ? 더 : JSON.stringify(더)).slice(0, 600)) }

/* ── 정적 서버(SPA) 둘 ── */
const 꼴 = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.webp': 'image/webp', '.wasm': 'application/wasm' }
const 서버 = (뿌리, port) => new Promise((ok) => {
  const s = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://x')
    let f = path.join(뿌리, decodeURIComponent(u.pathname))
    if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { const h = path.join(f, 'index.html'); f = fs.existsSync(h) ? h : path.join(뿌리, fs.existsSync(path.join(뿌리, 'app.html')) ? 'app.html' : 'index.html') }
    res.setHeader('Content-Type', 꼴[path.extname(f)] || 'application/octet-stream')
    fs.createReadStream(f).pipe(res)
  })
  s.listen(port, '127.0.0.1', () => ok(s))
})
const S1 = await 서버(D, 4991), S2 = await 서버(M, 4992)
const 주소 = 'http://127.0.0.1:4991', 틀 = 'http://127.0.0.1:4992'

/* ── 가짜 데이터베이스(규칙 흉내) — bc/p 처음 한 번 · 공고마다 읽기 · bc/q 못 읽음 ── */
let DB = {}
const 쪼 = (p) => p.split('/').filter(Boolean)
const 값 = (p) => { let o = DB; for (const k of 쪼(p)) { if (o == null || typeof o !== 'object') return null; o = o[k] } return o === undefined ? null : o }
const 넣 = (p, v) => { const ks = 쪼(p); let o = DB; for (let i = 0; i < ks.length - 1; i++) { if (o[ks[i]] == null || typeof o[ks[i]] !== 'object') o[ks[i]] = {}; o = o[ks[i]] } o[ks[ks.length - 1]] = v }
const 서버시각 = (v) => JSON.parse(JSON.stringify(v), (k, x) => (x && typeof x === 'object' && x['.sv'] === 'timestamp' ? Date.now() : x))
const 막힌읽기 = []
/* 👥 G504 방문자 상자 자료(가짜) — 첫 화면 · 공고 고른 화면 둘 다 같은 표인지 보려고(⑨) */
{
  const 날 = (t) => new Date(t + 9 * 3600000).toISOString().slice(0, 10), 오늘 = 날(Date.now()), 어제 = 날(Date.now() - 86400000)
  넣('/fresh/map', { at: Date.now(), now: {}, n: 3, day: { d: 오늘, c: {} } })
  넣('/fresh/ses', { at: Date.now(), from: '2026-09-15', e: 어제, kr: 5540, f: 48, y: { kr: 405, f: 2 }, yd: 어제 })
  넣('/fresh/reg', { at: Date.now(), from: '2026-09-15', d: 오늘, e: 어제, kr: { a: 2021, t: 0, y: 281 }, r: { Seoul: { a: 390 } }, f: { a: 21, t: 0, y: 0 }, w: { a: 2042, t: 0, y: 281 } })
}
async function 디비(route) {
  const req = route.request(), u = new URL(req.url())
  const p = decodeURIComponent(u.pathname.replace(/\.json$/, ''))
  const 거절 = () => route.fulfill({ status: 401, contentType: 'application/json', body: '{"error":"Permission denied"}' })
  if (req.method() === 'GET') {
    if (/^\/bc\/q/.test(p) || p === '/bc/p' || p === '/bc') { 막힌읽기.push(p); return 거절() }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(값(p)) })
  }
  if (req.method() === 'PUT') {
    const v = 서버시각(JSON.parse(req.postData() || 'null'))
    if (/^\/bc\/p\/[^/]+\/[^/]+$/.test(p)) { if (값(p) != null) return 거절(); if (Object.keys(v).sort().join() !== 'c,t') return 거절() }
    if (/^\/bc\/q\/[^/]+\/[^/]+$/.test(p) && !(Number.isInteger(v.q) && v.q >= 0 && v.q <= 100)) return 거절()
    if (/^\/(bc|vis)\//.test(p)) 넣(p, v)   /* 👥 G504 vis(방문자 셈)도 남겨 표가 숫자로 나오게 */
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(v) })
  }
  return route.fulfill({ status: 200, contentType: 'application/json', body: 'null' })
}

/* ── 가짜 공고(마감 앞으로 4일) ── */
const 마감 = new Date(Date.now() + 4 * 86400e3 + 9 * 3600e3).toISOString().slice(0, 10) + ' 10:00:00'
const NO = 'R26BK99990001'
const f = ['no', 'name', 'inst', 'base', 'budget', 'close', 'lo', 'hi', 'llr', 'est', 'lic', 'aval', 'gmtrl', 'ayn', 'ptot', 'pdrw', 'url', 'site', 'rgnb', 'joint', 'mthd', 'swin', 'rebid', 'enp', 'enpn', 'dt', 'sido', 'dsn', 'enpb', 'jnt', 'tg', 'nt', 'licg']
const 공고 = { no: NO, name: '가상 ○○지구 배수로 정비공사', inst: '가상시', base: 244600000, est: 222363636, close: 마감, lo: -3, hi: 3, llr: 89.745, lic: ['토목공사업/0001'], aval: 13940000, ayn: 'Y', ptot: 15, pdrw: 4, enp: 14, enpn: 68, enpb: 'ls', dt: '2026-10-30 15:00:00', sido: '경기', mthd: '전자입찰', joint: '(없음)공동수급불허', jnt: 0 }
const 색인 = JSON.stringify({ f, r: [f.map((k) => (공고[k] === undefined ? null : 공고[k]))] })
const UA = { PC: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36', 폰: 'Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36', 카톡: 'Mozilla/5.0 (Linux; Android 14; SM-S921N Build/UP1A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.0.0 Mobile Safari/537.36;KAKAOTALK 2610420', 네이버: 'Mozilla/5.0 (Linux; Android 14; SM-S921N; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.0.0 Mobile Safari/537.36 NAVER(inapp; search; 2000; 12.10.3)' }
/* 개찰 끝난 가짜 공고 한 건(참가 2곳 · 1순위가 하한보다 꽤 위) — 작은 틀(⑤)과 진짜 화면(⑦)이 같이 씀 */
const r = { no: 'R26BK99990002', name: '가상 ○○ 소화설비 정비', inst: '가상시', win: '가상1순위(주)', amt: 146278000, rate: 93.913, base: 155615000, aval: 7277751, ayn: 'Y', llr: 89.745, lo: -3, hi: 3, np: 2, enp: 14, pc: 0, amts: [146278000, 146370000], nrank: 2, rq: [[1, 146278000], [2, 146370000]], dt: '2026-10-26 11:00:00', close: '2026-10-26 10:00:00' }
/* 사이트와 같은 꼴 — bidresult.json 의 r 는 {공고번호: [f 차례 값]} (G501: 배열로 흉내 내서 «찾지 못했습니다» 를 못 잡았었음) */
const 결과f = Object.keys(r).filter((k) => k !== 'no')
const 결과자료 = JSON.stringify({ built: '2026-11-01 16:00', f: 결과f, r: { [r.no]: 결과f.map((k) => r[k]) } })
const 브 = await chromium.launch()
async function 창(기기) {
  const 폰 = 기기 === '폰'
  const c = await 브.newContext({ viewport: 폰 ? { width: 390, height: 844 } : { width: 1280, height: 900 }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', isMobile: 폰, hasTouch: 폰, userAgent: UA[기기], acceptDownloads: true })
  await c.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|geojs/, (r) => r.fulfill({ status: 200, body: '' }))
  await c.route(/firebaseio\.com/, 디비)
  await c.route(/\/data\/bidindex\.json/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 색인 }))
  await c.route(/\/data\/(overview|sim|basket|first|agency)[^/]*\.json/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await c.route(/\/data\/bidresult\.json/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 결과자료 }))
  await c.route(/\/data\/agency\/sjr\//, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ 가상시: { n: 8, med: 99.71, c: [['261020', 99.652, 89.912, 23, '가상 도로 보수공사'], ['261015', 100.211, 90.103, 41, '가상 배수관 정비']] } }) }))
  /* 사람 브라우저처럼(webdriver 끔 — 끄지 않으면 봇() 이라 관심도를 안 남김) · 인사 쪽지 안 뜨게 */
  await c.addInitScript(() => { try { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); sessionStorage.setItem('kcm_notice_seen', '2026-10-업체'); sessionStorage.setItem('kcm_visit_s', '1') } catch (e) {}; Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false }) })
  await c.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 주소 })
  const p = await c.newPage(); const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e).slice(0, 300))); p.on('dialog', (d) => d.accept())
  return { c, p, 오류, 기기 }
}
const 고르기 = async (P) => {
  await P.p.goto(주소 + '/', { waitUntil: 'domcontentloaded' }); await P.p.waitForTimeout(3500)
  const 눌 = await P.p.evaluate((nm) => { const b = [...document.querySelectorAll('button.pickrow')].find((x) => x.textContent.includes(nm)); if (b) { b.click(); return true } return false }, '배수로 정비공사')
  await P.p.waitForTimeout(2500)
  return 눌
}
const 관심글 = (P) => P.p.evaluate(() => (document.querySelector('.bc-line') || {}).innerText || '')
const 금액 = (P) => P.p.evaluate(() => Number(((document.querySelector('.amt') || {}).innerText || '').replace(/[^0-9]/g, '')))

console.log('■ ① 관심도')
const A = await 창('PC'), B = await 창('폰')
봐(await 고르기(A), 'PC: 가짜 공고 고름')
const a1 = await 관심글(A)
봐(/본 사람 1명/.test(a1) && /예상 참가 14곳/.test(a1), `PC: «본 사람 1명 · 예상 참가 14곳» — ${a1}`, a1)
봐(await 고르기(B), '폰: 같은 공고 고름')
const b1 = await 관심글(B)
봐(/본 사람 2명/.test(b1) && /최근 1시간 2명/.test(b1), `폰: «본 사람 2명 · 최근 1시간 2명» — ${b1}`, b1)
await 고르기(A)
봐(Object.keys(값(`/bc/p/${NO}`) || {}).length === 2, 'PC 가 다시 골라도 «본 사람» 은 그대로 2(브라우저마다 한 번)', 값(`/bc/p/${NO}`))
const 남은 = Object.values(값(`/bc/p/${NO}`) || {})
봐(남은.every((v) => Object.keys(v).sort().join() === 'c,t' && v.c === Number(마감.replace(/[^0-9]/g, '').slice(0, 12))), 'bc/p 엔 시각 · 마감뿐(금액 없음)', 남은)
const 금 = await 금액(A)
await A.p.evaluate(() => { const b = [...document.querySelectorAll('.hbtns button')].find((x) => /금액 복사/.test(x.textContent)); b && b.click() })
await A.p.waitForTimeout(1200)
const q들 = Object.values(값(`/bc/q/${NO}`) || {})
봐(q들.length === 1 && Number.isInteger(q들[0].q) && q들[0].q >= 60 && q들[0].q <= 99, `PC 금액 복사 → bc/q 에 분위 ${q들[0] && q들[0].q}(정수 · 권장 근처)`, q들)
const 읽힘 = await A.p.evaluate(async (no) => (await fetch(`https://k-conmap-default-rtdb.firebaseio.com/bc/q/${no}.json`)).status, NO)
봐(읽힘 === 401, 'bc/q 는 화면에서 읽으면 막힘(규칙과 같게)', 읽힘)
봐(!막힌읽기.filter((x) => x !== `/bc/q/${NO}`).length, '화면이 스스로 bc/q 를 읽으려 한 적 없음', 막힌읽기)

console.log('■ ② 품의서')
const 받 = A.p.waitForEvent('download', { timeout: 60000 }).catch(() => null)
봐(await A.p.evaluate(() => { const b = [...document.querySelectorAll('.hbtns button')].find((x) => /품의서/.test(x.textContent)); if (b) { b.click(); return true } return false }), 'PC: «📄 품의서» 단추 있음 · 누름')
const d = await 받
const 길 = d ? await d.path() : null
const 바 = 길 ? fs.readFileSync(길) : Buffer.alloc(0)
봐(바.slice(0, 4).toString() === '%PDF' && 바.length > 3000 && d && /^투찰품의서_.*\.pdf$/.test(d.suggestedFilename()), `PDF 받음 «${d && d.suggestedFilename()}» ${Math.round(바.length / 1024)} KB`, d && d.suggestedFilename())
let 글 = ''
try { fs.writeFileSync('/tmp/g10/g499/품의서_화면.pdf', 바); 글 = execFileSync('pdftotext', ['-layout', '/tmp/g10/g499/품의서_화면.pdf', '-']).toString() } catch (e) { 글 = '' }
봐(/투\s*찰\s*품\s*의\s*서/.test(글) && 글.includes('배수로 정비공사') && 글.includes(금.toLocaleString('ko-KR') + '원') && /결\s*재?/.test(글) && 글.includes('가상시'), `PDF 글 — 제목 · 공사명 · 화면 금액 ${금.toLocaleString('ko-KR')}원 · 발주 · 기관 사정률`, 글.slice(0, 400))
봐(글.includes('99.710%') && 글.includes('본 사람 2명'), 'PDF — 기관 최근 사정률(가운데 99.710%) · 관심(본 사람 2명)', 글.slice(0, 1200))
const 폰품 = await B.p.evaluate(() => [...document.querySelectorAll('.hbtns button')].some((x) => /품의서/.test(x.textContent)))
봐(폰품, '폰에도 «📄 품의서» 단추')
봐(!(await A.p.evaluate(() => !!document.querySelector('.bc-app'))), '보통 크롬 — «앱 안 브라우저» 안내 없음')
/* 📄 G503 카톡 · 네이버 앱 안 브라우저 — 받기는 해 보고 «크롬 · 사파리로 열기»(카톡은 kakaotalk://web/openExternal · 이 공고가 고른 채로) */
for (const [기, 기대] of [['카톡', 'kakao'], ['네이버', '메뉴']]) {
  const K = await 창(기)
  await 고르기(K)
  await K.p.evaluate(() => { const b = [...document.querySelectorAll('.hbtns button')].find((x) => /품의서/.test(x.textContent)); b && b.click() })
  await K.p.waitForTimeout(4000)
  const 안 = await K.p.evaluate(() => { const e = document.querySelector('.bc-app'); const a = e && e.querySelector('a'); return { 글: e ? e.innerText : '', href: a ? a.getAttribute('href') : '' } })
  const 열주소 = 안.href.startsWith('kakaotalk://web/openExternal?url=') ? decodeURIComponent(안.href.split('url=')[1]) : ''
  봐(기대 === 'kakao' ? (/크롬 · 사파리로 열기/.test(안.글) && 열주소 === `${주소}/?no=${NO}`) : (/다른 브라우저로 열기/.test(안.글) && !안.href),
    `${기} 앱 안 — 품의서 누르면 안내${기대 === 'kakao' ? ` · 바깥 브라우저로 «${열주소.replace(주소, '')}»` : ' · ⋮ 메뉴 안내'}`, 안)
  await K.c.close()
}
/* 바깥 브라우저로 연 주소(?no=)가 그 공고를 고른 채로 열림 */
await A.p.goto(`${주소}/?no=${NO}`, { waitUntil: 'domcontentloaded' }); await A.p.waitForTimeout(3500)
봐(await A.p.evaluate(() => [...document.querySelectorAll('.hbtns button')].some((x) => /품의서/.test(x.textContent))), '«/?no=공고번호» 로 열면 그 공고가 골라져 «📄 품의서» 가 바로 있음')
/* 👥 G504 소장님(폰 캡처 둘) 「이게 왜 이러지 ? 공고 선택 후도 같게 해줘 방문자 수.」 — 공고를 골라도 첫 화면과 같은 표(한 줄 상자 없음) */
{
  const 상자 = (p) => p.evaluate(() => { const c = document.querySelector('.umap'); return { 큰: !!document.querySelector('.umap-only'), 한줄: !!document.querySelector('.umap-line, .umap-mini'),
    표: [...document.querySelectorAll('.umap-tbl [role=row]')].map((r) => r.innerText.replace(/\s+/g, ' ').trim()), 글: c ? c.innerText.replace(/\s+/g, ' ').replace(/지금\(30분 안\) \S+/, '') : '' } })
  const 고른 = await 상자(A.p)
  await A.p.evaluate(() => sessionStorage.removeItem('kcm.baro.no'))
  await A.p.goto(`${주소}/`, { waitUntil: 'domcontentloaded' }); await A.p.waitForTimeout(3500)
  const 첫 = await 상자(A.p)
  봐(고른.큰 && !고른.한줄 && 고른.표.length === 3 && /^방문자 /.test(고른.표[1]) && /^세션 /.test(고른.표[2]) && 고른.글 === 첫.글 && JSON.stringify(고른.표) === JSON.stringify(첫.표),
    `⑨ 공고를 골라도 방문자 상자가 첫 화면과 같은 표(방문자 · 세션 / 누적 · 오늘 · 어제) — «${고른.표.slice(1).join(' / ')}»`, { 고른, 첫 })
  /* 🩹 G505 첫 화면에 떠 있는 «/?no=» 링크(곧나올줄 «⭐ 담아 둔 공사가 공고로 나왔습니다 → 바로투찰»)를 누른 것처럼 — 같은 화면에서 주소만 바뀌어도 그 공고가 골라짐 */
  await A.p.evaluate((no) => { history.pushState(null, '', '/?no=' + no); dispatchEvent(new PopStateEvent('popstate')) }, NO)
  await A.p.waitForTimeout(1500)
  const 링크로 = await A.p.evaluate(() => ({ 단추: [...document.querySelectorAll('.hbtns button')].some((x) => /품의서/.test(x.textContent)), 기억: sessionStorage.getItem('kcm.baro.no') }))
  봐(링크로.단추 && 링크로.기억 === NO, '⑩ 첫 화면에서 «/?no=» 링크를 누르면(같은 화면 · 주소만 바뀜) 그 공고가 골라짐 — «담아 둔 공사 → 바로투찰»', 링크로)
  await A.p.goto(`${주소}/?no=${NO}`, { waitUntil: 'domcontentloaded' }); await A.p.waitForTimeout(3000)   /* 아래 차례 그대로(골라 둔 화면) */
}

console.log('■ ③ 사용 방법')
await A.p.evaluate(() => sessionStorage.removeItem('kcm.baro.no'))   /* 고른 공고 기억을 지워 첫 화면으로 */
await A.p.goto(주소 + '/', { waitUntil: 'domcontentloaded' }); await A.p.waitForTimeout(3000)
const 접 = await A.p.evaluate(() => { const h = document.querySelector('.bth-h'); return h ? h.innerText : '' })
봐(/바로투찰 사용 방법/.test(접) && /11단계/.test(접), `첫 화면 접힘 칸 — ${접.replace(/\n/g, ' ').slice(0, 80)}`, 접)
await A.p.evaluate(() => { const h = document.querySelector('.bth-h'); h && h.click() }); await A.p.waitForTimeout(300)
const 펼 = await A.p.evaluate(() => ({ 단계: document.querySelectorAll('.bth-steps li').length, 물음: document.querySelectorAll('.bth-qa dt').length, 글: (document.querySelector('.card.bth') || {}).innerText || '' }))
봐(펼.단계 === 11 && 펼.물음 === 4 && /75분위/.test(펼.글) && /품의서/.test(펼.글) && /복기/.test(펼.글) && /관심도/.test(펼.글) && /3\.6~4\.4%/.test(펼.글), `펼치면 11단계 · 묻는 것 4 · 75분위 · 품의서 · 복기 · 관심도 · 1순위율`, 펼)
await A.p.goto(주소 + '/how', { waitUntil: 'domcontentloaded' }); await A.p.waitForTimeout(2000)
const how = await A.p.evaluate(() => document.body.innerText)
봐(/바로투찰 — 이렇게 씁니다/.test(how) && /권장 투찰금액/.test(how) && /자주 묻는 것/.test(how) && /A값이 뭔가요/.test(how), '/how 에도 같은 글(11단계 · 묻는 것)')

console.log('■ ④ 낙찰 서류 한 벌')
await A.p.evaluate(() => { localStorage.removeItem('kcm.서식공통'); localStorage.removeItem('kcm.격자'); localStorage.removeItem('kcm.서식작성'); localStorage.removeItem('kcm.한벌') })
await A.p.goto(`${주소}/forms/hanbeol?no=${NO}&n=${encodeURIComponent('가상 ○○지구 배수로 정비공사')}&i=${encodeURIComponent('가상시')}&a=222498175`, { waitUntil: 'domcontentloaded' }); await A.p.waitForTimeout(2500)
const 칸값 = await A.p.evaluate(() => Object.fromEntries([...document.querySelectorAll('.hb-f')].map((l) => [l.querySelector('span').innerText.replace(' *', ''), l.querySelector('input').value])))
봐(칸값['공사명'] === '가상 ○○지구 배수로 정비공사' && 칸값['발주기관'] === '가상시' && 칸값['계약금액(원)'] === '222,498,175', '주소 값이 칸에(공사명 · 발주 · 계약금액 쉼표)', 칸값)
const 단계 = await A.p.evaluate(() => [...document.querySelectorAll('.hb-step .hb-sh')].map((x) => x.innerText.replace(/^\d+\s*/, '')))
봐(단계.length === 5 && /계약/.test(단계[0]) && /돈/.test(단계[4]), `단계 다섯 — ${단계.join(' / ')}`, 단계)
await A.p.evaluate(() => { const i = [...document.querySelectorAll('.hb-f')].find((l) => /회사명/.test(l.innerText)).querySelector('input'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(i, '가상건설(주)'); i.dispatchEvent(new Event('input', { bubbles: true })) })
await A.p.evaluate(() => [...document.querySelectorAll('button')].find((b) => /이 값으로 서식에 채우기/.test(b.textContent)).click()); await A.p.waitForTimeout(400)
const 공 = await A.p.evaluate(() => JSON.parse(localStorage.getItem('kcm.서식공통') || '{}'))
봐(공.현장 === '가상 ○○지구 배수로 정비공사' && 공.발주 === '가상시' && 공.계약금액 === '222,498,175' && 공.회사 === '가상건설(주)', '채우기 → 공통 칸(현장 · 발주 · 계약금액 · 회사)', 공)
await A.p.evaluate(() => { const a = [...document.querySelectorAll('.hb-it')].find((x) => /착공계/.test(x.innerText)); a.click() })
await A.p.waitForTimeout(3500)
const 착 = await A.p.evaluate(() => {
  const b = window.__격자
  if (!b) return { 없음: true, url: location.pathname }
  const s = b.doc.sheets[0]
  const 키 = Object.entries(s.keys || {})
  const 칸 = (이름) => { const e = 키.find(([, k]) => k === 이름); if (!e) return undefined; const m = /^([A-Z]+)(\d+)$/.exec(e[0]); let c = 0; for (const ch of m[1]) c = c * 26 + ch.charCodeAt(0) - 64; return b.책.값(0, +m[2], c) }
  /* E9(금액한글) = C9 를 «일금 …원정» 꼴(DBNum4)로 그림(캔버스) — 값이 숫자여야 한글 숫자가 됨(글자 «222,498,175» 면 안 바뀜) */
  return { url: location.pathname, 공사명: 칸('공사명'), 계약금액: 칸('계약금액'), 상호: 칸('상호'), 한글: 칸('금액한글') }
})
봐(착.url === '/forms/chakgong' && 착.공사명 === '가상 ○○지구 배수로 정비공사' && 착.계약금액 === 222498175 && 착.상호 === '가상건설(주)', `착공계(종이) — 공사명 · 계약금액 숫자 ${착.계약금액} · 상호`, 착)
봐(착.한글 === 222498175, `착공계 — 한글 금액 칸(=계약금액)도 숫자 ${착.한글} → «일금 …원정» 으로 그려짐`, 착.한글)
/* 📄 G503 착공일 · 준공일(날짜 칸) → 착공계 날짜 칸이 «날짜» 로 들어가 공사기간(일수)까지 셈해지나 */
await A.p.goto(`${주소}/forms/hanbeol?no=${NO}&n=${encodeURIComponent('가상 ○○지구 배수로 정비공사')}&i=${encodeURIComponent('가상시')}&a=222498175`, { waitUntil: 'domcontentloaded' }); await A.p.waitForTimeout(2000)
await A.p.evaluate(() => { const 넣 = (re, v) => { const i = [...document.querySelectorAll('.hb-f')].find((l) => re.test(l.innerText)).querySelector('input'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(i, v); i.dispatchEvent(new Event('input', { bubbles: true })); i.dispatchEvent(new Event('change', { bubbles: true })) }; 넣(/착공일/, '2026-11-10'); 넣(/준공일/, '2027-03-09') })
await A.p.evaluate(() => [...document.querySelectorAll('button')].find((b) => /이 값으로 서식에 채우기/.test(b.textContent)).click()); await A.p.waitForTimeout(300)
await A.p.evaluate(() => { localStorage.removeItem('kcm.격자') })
await A.p.goto(주소 + '/forms/chakgong', { waitUntil: 'domcontentloaded' }); await A.p.waitForTimeout(3500)
const 날 = await A.p.evaluate(() => { const b = window.__격자; if (!b) return null; return { 착: b.책.값(0, 11, 3), 준: b.책.값(0, 12, 3), 기간: b.책.값(0, 10, 3) } })
봐(날 && typeof 날.착 === 'number' && typeof 날.준 === 'number' && /2026\. 11\. 10\. ~ 2027\. 3\. 9\. \(120일\)/.test(String(날.기간)), `착공계 — 착공일 · 준공일이 날짜로 들어가 공사기간 «${날 && 날.기간}»`, 날)
await A.p.goto(주소 + '/forms/jg-charyang-geonseol', { waitUntil: 'domcontentloaded' }); await A.p.waitForTimeout(2500)
const 블 = await A.p.evaluate(() => { const l = [...document.querySelectorAll('.fw-form label.fw-kvr')]; const v = (re) => { const x = l.find((y) => re.test(y.querySelector('.fw-lb').textContent)); return x ? x.querySelector('textarea, input').value : null }; return { 공사명: v(/공\s*사\s*명/), 회사명: v(/회\s*사\s*명/) } })
봐(블.공사명 === '가상 ○○지구 배수로 정비공사' && 블.회사명 === '가상건설(주)', '블록 서식(작업계획서)에도 공사명 · 회사명', 블)

console.log('■ ⑤ 복기 · 한 벌 단추 · 마감 뒤 이용자 자리(작은 틀)')
/* 참가 2곳 개찰(1순위가 하한보다 꽤 위) — 넣은 금액을 하한과 1순위 사이로 적으면 1순위 */
DB.fresh = { bcq: { R26BK999: { R26BK99990002: { n: 6, h: { 20: 1, 55: 1, 61: 1, 70: 2, 95: 1 }, p: 9, c: 202610261000 } } } }
const C = await 창('PC')
await C.p.goto(틀 + '/', { waitUntil: 'domcontentloaded' })
await C.p.evaluate((no) => { localStorage.setItem('kcm_mybid', JSON.stringify({ [no]: { a: 143000000, t: '2026-10-25 09:00', n: '가상 ○○ 소화설비 정비' } })) }, r.no)
await C.p.goto(틀 + '/?r=' + encodeURIComponent(JSON.stringify(r)), { waitUntil: 'domcontentloaded' }); await C.p.waitForTimeout(2500)
const 복 = await C.p.evaluate(() => ({ 결과: (document.querySelector('.ngm-res') || {}).innerText || '', 복기: (document.querySelector('.ngm-bk') || {}).innerText || '', 막대: !!document.querySelector('.ngm-bk-bar .ngm-bk-win'), 한벌: (document.querySelector('.ngm-hanbeol') || {}).getAttribute?.('href') || '' }))
봐(/1순위/.test(복.결과) && /왜 이 자리였나/.test(복.복기) && /사정률/.test(복.복기) && /1순위 자리/.test(복.복기) && /참가 2곳/.test(복.복기) && /이 기관 평소/.test(복.복기) && 복.막대, '복기 — 결과 1순위 · 사정률 · 1순위 자리 · 참가 · 기관 평소 · 막대', 복)
봐(/^\/forms\/hanbeol\?no=R26BK99990002&n=.*&i=.*&a=143000000$/.test(복.한벌), `1순위 → «🏁 낙찰 서류 한 벌» 단추(넣은 금액 143,000,000 이 계약금액으로) ${복.한벌}`, 복.한벌)
const 남김 = await C.p.evaluate((no) => JSON.parse(localStorage.getItem('kcm_mybid'))[no].o, r.no)
봐(남김 && 남김.s === '일순' && typeof 남김.q === 'number' && typeof 남김.lo === 'number', '복기 요약(분위)이 넣은 금액 줄에 남음', 남김)
const 분 = await C.p.evaluate(() => ({ 글: (document.querySelector('.bcd') || {}).innerText || '', 막대: document.querySelectorAll('.bcd-b').length, 초록: document.querySelectorAll('.bcd-b.win').length }))
봐(/건설맵 이용자 6명이 고른 자리/.test(분.글) && 분.막대 === 20 && /실격/.test(분.글) && /본 사람 9명/.test(분.글) && /실제 참가 2곳/.test(분.글), `마감 뒤 이용자 자리 — 6명 · 막대 20 · 실격선 · 본 사람 9 · 실제 참가 2`, 분)
/* 성향 — 3건 넘게 적어 두면 «내 성향» */
await C.p.evaluate(() => { localStorage.setItem('kcm_mybid', JSON.stringify({ a1: { a: 1, t: '2026-10-20 09:00', n: '가상1', o: { s: '실격', q: 30, lo: 50, hi: 51 } }, a2: { a: 1, t: '2026-10-21 09:00', n: '가상2', o: { s: '실격', q: 35, lo: 40, hi: 41 } }, a3: { a: 1, t: '2026-10-22 09:00', n: '가상3', o: { s: '통과', q: 42, lo: 20, hi: 25 } } })) })
await C.p.goto(틀 + '/?m=1', { waitUntil: 'domcontentloaded' }); await C.p.waitForTimeout(1500)
const 성 = await C.p.evaluate(() => (document.querySelector('.ngm-trend') || {}).innerText || '')
봐(/내 성향/.test(성) && /평균 36분위/.test(성) && /실격 2/.test(성) && /권장\(75분위\)/.test(성), `모아 보기 «내 성향» — ${성.replace(/\n/g, ' ').slice(0, 120)}`, 성)

console.log('■ ⑦ 진짜 화면 — 개찰 끝난 공고(/notice) 의 복기 · 이용자 자리 · 한 벌')
await A.p.evaluate((no) => { localStorage.setItem('kcm_mybid', JSON.stringify({ [no]: { a: 143000000, t: '2026-10-25 09:00', n: '가상 ○○ 소화설비 정비' } })) }, r.no)
for (const w of [1280, 360]) {
  await A.p.setViewportSize({ width: w, height: 900 })
  await A.p.goto(주소 + '/notice/' + r.no, { waitUntil: 'domcontentloaded' }); await A.p.waitForTimeout(3500)
  const 진 = await A.p.evaluate(() => ({ 결과: (document.querySelector('.ngm-res') || {}).innerText || '', 복기: (document.querySelector('.ngm-bk') || {}).innerText || '', 분포: (document.querySelector('.bcd') || {}).innerText || '', 한벌: [...document.querySelectorAll('a.nd-hanbeol, a.ngm-hanbeol')].map((a) => a.getAttribute('href')), 넘: document.documentElement.scrollWidth - document.documentElement.clientWidth }))
  봐(/1순위/.test(진.결과) && /왜 이 자리였나/.test(진.복기) && /건설맵 이용자 6명/.test(진.분포) && 진.한벌.length === 2 && 진.넘 <= 1, `/notice ${w}px — 복기 · 이용자 6명 자리 · 한 벌 단추 둘(내 금액 1순위 · 공고) · 넘침 없음`, 진)
  봐(진.한벌.some((h) => /a=143000000$/.test(h)) && 진.한벌.some((h) => /a=146278000$/.test(h)), `/notice ${w}px — 한 벌 금액: 내 1순위 금액 143,000,000 · 공고 1순위 146,278,000`, 진.한벌)
}
if (process.env.CAP) await A.p.screenshot({ path: process.env.CAP + '_notice_폰.png', fullPage: true })
/* 🔁 G501 — 🔎 찾기 «공고 … 열기»(앱 안에서 옮겨 감)로 개찰 공고 — 전엔 «찾지 못했습니다» */
await A.p.setViewportSize({ width: 1280, height: 900 })
await A.p.goto(주소 + '/tools', { waitUntil: 'domcontentloaded' }); await A.p.waitForTimeout(2500)
await A.p.click('.qsbtn'); await A.p.fill('.qs-in', r.no); await A.p.waitForTimeout(600)
const 찾첫 = await A.p.$eval('.qs-row .qs-t', (e) => e.textContent).catch(() => '')
await A.p.click('.qs-row'); await A.p.waitForTimeout(3500)
const 찾간 = await A.p.evaluate(() => ({ 길: location.pathname, 못: /찾지 못했습니다/.test(document.body.innerText), 결과: /개찰 결과/.test(document.body.innerText), 복기: !!document.querySelector('.ngm-bk'), 한벌: !!document.querySelector('a.nd-hanbeol') }))
봐(/공고 .* 열기/.test(찾첫) && 찾간.길 === '/notice/' + r.no && !찾간.못 && 찾간.결과 && 찾간.복기 && 찾간.한벌, `🔎 «${r.no}» → «${찾첫}» → 개찰 결과 · 복기 · 한 벌(앱 안에서 옮겨 가도 찾음)`, 찾간)

console.log('■ ⑧ 어두운 화면(폰 · PC 다크 모드) — 새 칸 글자가 바탕과 구별되나(대비 3 이상) · G503')
{
  /* 글자 색 · 바탕 색(조상까지 올라가 처음 칠해진 것) 대비 — rgb() · color(srgb …) 둘 다 읽음 */
  const 대비검사 = async (P, 고름) => P.p.evaluate((고름) => {
    const 읽 = (c) => { const m = /rgba?\(([^)]+)\)/.exec(c); if (m) { const v = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: v[0], g: v[1], b: v[2], a: v.length > 3 ? v[3] : 1 } }
      const n = /color\(srgb ([^)]+)\)/.exec(c); if (n) { const v = n[1].split(/[ /]+/).filter(Boolean).map(Number); return { r: v[0] * 255, g: v[1] * 255, b: v[2] * 255, a: v.length > 3 ? v[3] : 1 } } return null }
    const 밝 = ({ r, g, b }) => { const f = (x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
    const 바탕 = (el) => { for (let e = el; e; e = e.parentElement) { const c = 읽(getComputedStyle(e).backgroundColor); if (c && c.a > 0.5) return c } return 읽(getComputedStyle(document.body).backgroundColor) || { r: 255, g: 255, b: 255, a: 1 } }
    const 나쁜 = []
    let 본 = 0
    for (const el of document.querySelectorAll(고름)) {
      const 글 = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join('')
      if (!글 || !el.getClientRects().length) continue
      const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || Number(cs.opacity) === 0) continue
      const 글색 = 읽(cs.color), 바 = 바탕(el); if (!글색 || !바) continue
      const a = 밝(글색), b = 밝(바), 비 = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
      본++
      if (비 < 3) 나쁜.push(`${el.className || el.tagName}:${글.slice(0, 14)}=${비.toFixed(2)}`)
    }
    return { 본, 나쁜 }
  }, 고름)
  const 고름 = '.card.bth *, .bth-h, .bc-line, .bc-line *, .hero .hbtns .cbtn, .hb-head *, .hb-f, .hb-it *, .hb-sh, .ngm-bk *, .bcd *, .nd-hanbeol, .ngm-trend, .ngm-res *'
  for (const [기기, 폭] of [['PC', 1280], ['폰', 390]]) {
    const c = await 브.newContext({ viewport: { width: 폭, height: 900 }, colorScheme: 'dark', locale: 'ko-KR', userAgent: 기기 === '폰' ? UA.폰 : UA.PC, isMobile: 기기 === '폰', hasTouch: 기기 === '폰' })
    await c.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|geojs/, (r) => r.fulfill({ status: 200, body: '' }))
    await c.route(/firebaseio\.com/, 디비)
    await c.route(/\/data\/bidindex\.json/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 색인 }))
    await c.route(/\/data\/bidresult\.json/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 결과자료 }))
    await c.addInitScript(() => { try { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); sessionStorage.setItem('kcm_notice_seen', '2026-10-업체'); sessionStorage.setItem('kcm_visit_s', '1') } catch (e) {}; Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false }) })
    const P = { p: await c.newPage(), 기기 }; const 오 = []; P.p.on('pageerror', (e) => 오.push(String(e)))
    await P.p.goto(주소 + '/', { waitUntil: 'domcontentloaded' }); await P.p.waitForTimeout(3000)
    await P.p.evaluate(() => { const h = document.querySelector('.bth-h'); h && h.click() }); await P.p.waitForTimeout(300)
    const a1 = await 대비검사(P, 고름)
    await P.p.evaluate((nm) => { const b = [...document.querySelectorAll('button.pickrow')].find((x) => x.textContent.includes(nm)); b && b.click() }, '배수로 정비공사'); await P.p.waitForTimeout(3000)
    const a2 = await 대비검사(P, 고름)
    await P.p.goto(`${주소}/forms/hanbeol?no=${NO}&n=${encodeURIComponent('가상 ○○지구 배수로 정비공사')}&i=${encodeURIComponent('가상시')}&a=222498175`, { waitUntil: 'domcontentloaded' }); await P.p.waitForTimeout(2500)
    const a3 = await 대비검사(P, 고름)
    await P.p.evaluate((no) => { localStorage.setItem('kcm_mybid', JSON.stringify({ [no]: { a: 143000000, t: '2026-10-25 09:00', n: '가상' } })) }, r.no)
    await P.p.goto(주소 + '/notice/' + r.no, { waitUntil: 'domcontentloaded' }); await P.p.waitForTimeout(3500)
    const a4 = await 대비검사(P, 고름)
    const 본 = a1.본 + a2.본 + a3.본 + a4.본, 나쁜 = [...a1.나쁜, ...a2.나쁜, ...a3.나쁜, ...a4.나쁜]
    봐(본 > 40 && !나쁜.length && !오.length, `${기기} 다크 — 새 칸 글자 ${본}곳 대비 3 이상(첫 화면 사용 방법 · 금액 칸 · 한 벌 · 개찰 복기 · 이용자 자리) · 오류 0`, { 본, 나쁜: 나쁜.slice(0, 8), 오 })
    if (process.env.CAP) { await P.p.evaluate(() => { const e = document.querySelector('.ngm-bk'); e && e.scrollIntoView({ block: 'center' }) }); await P.p.screenshot({ path: `${process.env.CAP}_다크_${기기}.png` }) }
    await c.close()
  }
}

console.log('■ ⑥ 넘침 · 오류')
await B.p.evaluate(() => sessionStorage.removeItem('kcm.baro.no'))   /* 폰 첫 화면 = 사용 방법 펼친 채 */
for (const [P, w들, 길] of [[B, [320, 360, 390], 주소 + '/'], [A, [320, 390, 860, 1280], `${주소}/forms/hanbeol?no=${NO}&n=${encodeURIComponent('가상 ○○지구 배수로 정비공사')}&i=${encodeURIComponent('가상시')}&a=222498175`], [A, [320, 390], 주소 + '/how'], [C, [320, 1280], 틀 + '/?m=1'], [C, [320, 390], 틀 + '/?r=' + encodeURIComponent(JSON.stringify(r))]]) {
  await P.p.goto(길, { waitUntil: 'domcontentloaded' }); await P.p.waitForTimeout(2000)
  if (길.endsWith('/')) await P.p.evaluate(() => { const h = document.querySelector('.bth-h'); h && h.click() })   /* 사용 방법을 펼친 채로 */
  for (const w of w들) {
    await P.p.setViewportSize({ width: w, height: 800 }); await P.p.waitForTimeout(400)
    const n = await P.p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    봐(n <= 1, `${P.기기} ${w}px 가로 넘침 없음(${P.p.url().replace(/^https?:\/\/[^/]+/, '').slice(0, 30)})`, n)
  }
}
await B.p.setViewportSize({ width: 360, height: 800 }); await 고르기(B)
const 폰넘 = await B.p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
봐(폰넘 <= 1, '폰 360px 공고 고른 화면(관심 줄 · 품의서 단추) 넘침 없음', 폰넘)
/* 단추 넷(복사 · 공유 · 담기 · 품의서) — 글자가 두 줄로 끊기지 않음(폰은 2 × 2) */
const 단추줄 = async (P) => P.p.evaluate(() => [...document.querySelectorAll('.hero .hbtns .cbtn')].map((b) => ({ t: b.innerText.trim(), h: Math.round(b.getBoundingClientRect().height), w: Math.round(b.getBoundingClientRect().width), sw: b.scrollWidth - b.clientWidth })))
for (const w of [320, 360, 390]) {
  await B.p.setViewportSize({ width: w, height: 800 }); await B.p.waitForTimeout(300)
  const 줄 = await 단추줄(B)
  봐(줄.length === 4 && 줄.every((x) => x.h <= 48 && x.sw <= 0), `폰 ${w}px 단추 넷 한 줄 글자(${줄.map((x) => x.t + ' ' + x.w + '×' + x.h).join(' · ')})`, 줄)
}
await 고르기(A)
for (const w of [521, 600, 700, 860, 1280]) {   /* 🩹 G503 폰 2 × 2 가 끝나는 바로 위(521)까지 */
  await A.p.setViewportSize({ width: w, height: 900 }); await A.p.waitForTimeout(300)
  const 줄 = await 단추줄(A)
  봐(줄.length === 4 && 줄.every((x) => x.h <= 48 && x.sw <= 0) && new Set(줄.map((x) => x.h)).size === 1, `PC ${w}px 단추 넷 한 줄(${줄.map((x) => x.t + ' ' + x.w + '×' + x.h).join(' · ')})`, 줄)
}
if (process.env.CAP) {
  await B.p.evaluate(() => { const e = document.querySelector('.bc-line'); e && e.scrollIntoView({ block: 'center' }) }); await B.p.waitForTimeout(300)
  await B.p.screenshot({ path: process.env.CAP + '_폰_금액.png' })
  await A.p.goto(`${주소}/forms/hanbeol?no=${NO}&n=${encodeURIComponent('가상 ○○지구 배수로 정비공사')}&i=${encodeURIComponent('가상시')}&a=222498175`, { waitUntil: 'domcontentloaded' }); await A.p.setViewportSize({ width: 1280, height: 900 }); await A.p.waitForTimeout(2000)
  await A.p.screenshot({ path: process.env.CAP + '_PC_한벌.png' })
  await C.p.evaluate((no) => { localStorage.setItem('kcm_mybid', JSON.stringify({ [no]: { a: 143000000, t: '2026-10-25 09:00', n: '가상 ○○ 소화설비 정비' } })) }, r.no)
  await C.p.goto(틀 + '/?r=' + encodeURIComponent(JSON.stringify(r)), { waitUntil: 'domcontentloaded' }); await C.p.setViewportSize({ width: 820, height: 900 }); await C.p.waitForTimeout(2000)
  await C.p.screenshot({ path: process.env.CAP + '_복기.png', fullPage: true })
}
for (const P of [A, B, C]) 봐(!P.오류.length, `${P.기기} 화면 오류 없음`, P.오류.join(' | '))
await 브.close(); S1.close(); S2.close()
console.log(bad ? `✗ ${bad} 틀림 · ${ok} 맞음` : `✓ 모두 맞음(${ok})`)
process.exit(bad ? 1 : 0)
