/**
 * 🧭 G625 «다른 탭 그대로» 화면 시험 — 전(G624) 구운 사이트와 지금 구운 사이트를 같은 가짜 자료 · 같은 시각 · 같은 난수로 열어 견줍니다.
 *   node tools/시험_탭그대로화면.mjs <전 주소> <지금 주소> [그림 둘 곳]
 *   소장님(11-09): 「이미 만들어 놓은 것 잘못되지 않게 조심해 줘. 특히 공고, 1순위 공고에서 바로입찰 가는 것 등」 · 「다른 탭도 잘 봐줘. 틀어지지 안게」
 *   ① 폰 390 · PC 1280 — 화면 30곳: 본문 글 · 링크 · 단추가 전과 같음(1순위 · 분석 맨 위 «두 칸 단추» 만 더해짐)
 *   ② 같은 화면 그림(탭 띠는 숨김 — 분석 → 자격증 이름만 바뀜 · ④에서 봄)이 전과 같음 — 1순위 · 분석 화면은 ①로만 봄
 *      늦게 오는 자료(맵톡 · 그림)로 한쪽만 다르면 한 번 더 열어 봄
 *   ③ 공고 카드 «💰 바로투찰» → 바로투찰에 그 공고 · 1순위 카드 펼침 «📊 바로투찰에서 채점하기» → 바로투찰에 그 공고 — 전과 같은 주소 · 같은 글
 *   ④ 아래 탭(폰) · 위 탭 줄(PC) 10개 · 1순위 탭 불이 /first · /analysis · /corp · /agency 에서 켜짐 · 📚 자격증 → /cert
 *   ⑤ 오류(pageerror) 0 · 가로 넘침 0(전과 같거나 0)
 *   가상 자료만 · 인터넷 안 부름(광고 · 분석 · Firebase 막음) · 받기 없음.
 */
import fs from 'fs'
import path from 'path'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')

const 전 = process.argv[2] || 'http://127.0.0.1:4991'
const 지금 = process.argv[3] || 'http://127.0.0.1:4992'
const 그림곳 = process.argv[4] || '/tmp/탭그대로'
fs.mkdirSync(그림곳, { recursive: true })

let bad = 0, n = 0
const ok = (이름, c, got) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (c || got === undefined ? '' : ' = ' + JSON.stringify(got).slice(0, 600))) }

/* ── 같은 시각 · 같은 가짜 자료 ── */
const 고정 = new Date('2026-11-09T12:30:00Z')   /* 한국 21:30 */
const 날 = (d) => new Date(고정.getTime() + d * 86400e3 + 9 * 3600e3).toISOString().slice(0, 10)
const 오늘 = 날(0)
const 지금시각 = new Date(고정.getTime() + 9 * 3600e3).toISOString().slice(0, 16).replace('T', ' ')
const 헬스 = { at: 지금시각, ok: true, why: '', fails: 0, got: { first: 266, live: 815 }, note: '', maint: false, hint: '', lastok: 지금시각, newest: { first: 오늘, live: 오늘 }, n: { first: 18396, live: 21143 }, gaps: { first: [], live: [] } }
/* 1순위(시험_1순위간단화면 과 같은 꼴) */
const meta1 = { built: 오늘 + ' 06:00', chunk: 500, rankChunk: 50, con: { n: 14, parts: 1, from: '2026-09-15', to: 오늘 }, serv: { n: 0, parts: 0 } }
const 순위 = (k, base) => Array.from({ length: k }, (_, i) => [`가상건설${i + 1}(주)`, Math.round(base * (0.8995 + i * 0.0007)), null])
const 줄1 = (i, o = {}) => ({ no: `R00TEST7${String(i).padStart(4, '0')}`, ord: '000', name: `가상 새솔지구 정비공사 ${i}차`, inst: '가상군', dt: 오늘 + ' 11:00:00', amt: 523456000, rate: 89.912, np: 37, nrank: 37,
  base: 583000000, sAmt: 0, lo: -3, hi: 3, llr: 89.745, aval: 0, ayn: 'N', win: '가상건설1(주)', bno: '1238112345', ceo: '홍길동', ...o })
const rows1 = [줄1(1, { name: '가상 한빛천 재해복구사업', np: 41, nrank: 41, corps: 순위(30, 583000000) }), 줄1(2, { name: '가상 마루초 옥상 방수공사', np: 6, nrank: 6, base: 98700000, corps: 순위(6, 98700000) }),
  ...Array.from({ length: 12 }, (_, i) => 줄1(i + 3))]
/* 공고(시험_공고간단화면 과 같은 꼴) */
const meta2 = { built: 오늘 + ' 06:00', chunk: 500, rankChunk: 50, con: { n: 12, parts: 1, from: '2026-09-15', to: 오늘 }, serv: { n: 0, parts: 0 } }
const 줄2 = (i, o = {}) => ({ no: `R00TEST8${String(i).padStart(4, '0')}`, ord: '000', name: `가상 새솔지구 배수로 정비공사 ${i}차`, inst: '가상시', dt: 오늘 + ' 09:00:00', close: 날(3) + ' 10:00:00',
  base: 244600000, est: 222363636, lo: -3, hi: 3, llr: 89.745, aval: 13940000, ayn: 'Y', lic: ['토목공사업/0001'], sido: '경기', ptot: 15, pdrw: 4, mthd: '전자입찰', ...o })   /* 예비가격 정보까지 — «💰 바로투찰» 알약이 붙는 공고 */
const rows2 = Array.from({ length: 12 }, (_, i) => 줄2(i + 1))
/* 바로투찰 색인 — 공고 카드 열둘 + 셋(시험_바로투찰내려가기화면 꼴) */
const f = ['no', 'name', 'inst', 'base', 'budget', 'close', 'lo', 'hi', 'llr', 'est', 'lic', 'aval', 'gmtrl', 'ayn', 'ptot', 'pdrw', 'url', 'site', 'rgnb', 'joint', 'mthd', 'swin', 'rebid', 'enp', 'enpn', 'dt', 'sido', 'dsn', 'enpb', 'jnt', 'tg', 'nt', 'licg']
const 색인 = JSON.stringify({ f, r: rows2.map((g) => f.map((k) => (k === 'mthd' ? '전자입찰' : k === 'ptot' ? 15 : k === 'pdrw' ? 4 : g[k] === undefined ? null : g[k]))) })

/* 같은 난수(두 사이트가 같은 차례로 부르면 같은 값) */
const 난수판 = `(() => { let s = 20261109; Math.random = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648 } })()`
const UA폰 = 'Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'
const b = await chromium.launch()

async function 새쪽(폰) {
  const ctx = await b.newContext({ viewport: 폰 ? { width: 390, height: 844 } : { width: 1280, height: 900 }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', isMobile: 폰, hasTouch: 폰, ...(폰 ? { userAgent: UA폰 } : {}) })
  await ctx.clock.setFixedTime(고정)
  /* 늦게 단 길이 먼저 — 나머지 /data 는 둘 다 404 */
  await ctx.route(/\/data\//, (r) => r.fulfill({ status: 404, body: '' }))
  await ctx.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|googlesyndication|geojs|doubleclick|kakao|naver/, (r) => r.fulfill({ status: 200, body: '' }))
  await ctx.route(/firebaseio\.com|firebasedatabase\.app|googleapis\.com|firestore/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: r.request().method() === 'GET' ? 'null' : (r.request().postData() || 'null') }))
  await ctx.route('**/data/board/first.json*', (r) => r.fulfill({ json: meta1 }))
  await ctx.route('**/data/board/first-con-0.json*', (r) => r.fulfill({ json: rows1 }))
  await ctx.route('**/data/board/live.json*', (r) => r.fulfill({ json: meta2 }))
  await ctx.route('**/data/board/live-con-0.json*', (r) => r.fulfill({ json: rows2 }))
  await ctx.route(/\/data\/bidindex\.json/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 색인 }))
  await ctx.route(/\/data\/bidresult\.json/, (r) => r.fulfill({ json: { built: 오늘 + ' 06:00', f: [], r: {} } }))
  await ctx.route('**/data/overview.json*', (r) => r.fulfill({ json: { rows: 168842, agencies: 5066, corps: 72494 } }))
  await ctx.route('**/data/ext/meta.json*', (r) => r.fulfill({ json: { n: 887, first: 567 } }))
  await ctx.route('**/data/pre/idx.json*', (r) => r.fulfill({ json: { all: [1080, 225], n: {} } }))
  await ctx.route('**/data/health.json*', (r) => r.fulfill({ json: 헬스 }))
  await ctx.addInitScript(난수판)
  await ctx.addInitScript(() => { try { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); sessionStorage.setItem('kcm_notice_seen', '2026-10-업체'); sessionStorage.setItem('kcm_visit_s', '1') } catch (e) { /* 없음 */ } })
  const p = await ctx.newPage()
  const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
  p.on('download', (d) => { 오류.push('받기 일어남 ' + d.suggestedFilename()); d.cancel().catch(() => {}) })
  return { ctx, p, 오류 }
}

/* 본문 모습 — 두 칸 단추(.fa-seg)는 빼고 · 시각 · 숫자 흔들림은 고르게 */
const 모습 = (p) => p.evaluate(() => {
  const m = document.querySelector('main') || document.body
  const c = m.cloneNode(true)
  c.querySelectorAll('.fa-seg').forEach((e) => e.remove())
  /* 맵톡 «아직 글이 없습니다» 는 파이어베이스가 늦게 오면 한쪽만 뜸(시험 자리엔 인터넷 없음) — 견주기에서 뺌 */
  const 글 = (c.innerText || c.textContent || '').replace(/\s+/g, ' ').replace(/📭\s*아직 글이 없습니다\.[^📅]*/g, '').trim()
  const 링크 = [...c.querySelectorAll('a')].map((a) => (a.getAttribute('href') || '') + '|' + (a.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40))
  const 단추 = [...c.querySelectorAll('button')].map((x) => (x.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 30))
  return { 글, 링크, 단추, 넘침: document.documentElement.scrollWidth - innerWidth, 높이: document.documentElement.scrollHeight }
})

const 화면들 = ['/', '/?no=R00TEST80001', '/first', '/svc/first', '/live', '/pre', '/gongdong', '/ext', '/svc/live', '/goods/live', '/analysis', '/corp', '/agency', '/bunseok',
  '/how', '/guide', '/tools', '/tools/nomubi', '/tools/soil-volume', '/forms', '/forms/dalryeok-2027', '/naeyeok', '/naeyeok/hado', '/jeoksan', '/my', '/qna', '/change/gisung', '/cad', '/daily', '/lic']
const 단추화면 = new Set(['/first', '/svc/first', '/analysis'])
const 늦은화면 = new Set(['/qna'])   /* 파이어베이스 글 — 그림은 안 견줌(글 · 링크 · 단추로만) */
import { execFileSync } from 'node:child_process'
/* 두 그림에서 다른 점 수(크기가 다르면 -1) — 글꼴 가장자리 몇십 점은 같은 그림으로 봄 */
const 다른점 = (a, b) => { try { return Number(execFileSync('python3', ['-c', 'import sys\nfrom PIL import Image, ImageChops\na=Image.open(sys.argv[1]).convert("RGB");b=Image.open(sys.argv[2]).convert("RGB")\nprint(-1 if a.size!=b.size else sum(1 for p in ImageChops.difference(a,b).getdata() if sum(p)>24))', a, b]).toString().trim()) } catch (e) { return -2 } }

async function 열기(p, 주소, 더 = 0) {
  await p.goto(주소, { waitUntil: 'domcontentloaded' })
  try { await p.waitForLoadState('networkidle', { timeout: 4000 }) } catch (e) { /* 계속 */ }
  /* 늦게 오는 것(그림 · 자리 표시 «skel»)이 다 올 때까지 — 두 사이트가 같은 순간을 찍게 */
  await p.evaluate(() => document.querySelectorAll('img[loading="lazy"]').forEach((i) => { i.loading = 'eager' })).catch(() => {})
  try { await p.waitForFunction(() => [...document.images].every((i) => i.complete) && !document.querySelector('[class*="skel"]'), null, { timeout: 4000 }) } catch (e) { /* 계속 */ }
  await p.evaluate(() => Promise.all([...document.images].map((i) => (i.decode ? i.decode().catch(() => {}) : null)))).catch(() => {})   /* 그림 풀기(webp)까지 끝난 뒤 찍음 */
  await p.waitForTimeout(1200 + 더)
}
/* 아래(폰 tabbar) · 위(PC railnav) 탭 띠는 둘 다 숨김 — «분석 → 자격증» 이름만 바뀐 자리(④에서 따로 봄) */
async function 그림(p, 파일) {
  await p.addStyleTag({ content: 'nav.tabbar,nav.railnav{visibility:hidden !important}' })   /* 폰 = 아래 tabbar · PC = 위 railnav */
  await p.screenshot({ path: 파일, fullPage: true, animations: 'disabled', caret: 'hide' })
}

for (const 폰 of [true, false]) {
  const 이름 = 폰 ? '폰 390' : 'PC 1280'
  console.log(`① · ② ${이름} — 화면 ${화면들.length}곳 전 · 지금 견주기`)
  const A = await 새쪽(폰), B = await 새쪽(폰)
  const 다른글 = [], 다른그림 = [], 넘침 = []
  for (const u of 화면들) {
    await 열기(A.p, 전 + u); await 열기(B.p, 지금 + u)
    let a = await 모습(A.p), bb = await 모습(B.p)
    /* 늦게 온 자료(맵톡 · 그림)로 한쪽만 다르면 — 한 번 더 열어 봄(더 기다림) */
    if (a.글 !== bb.글 || a.링크.join('\n') !== bb.링크.join('\n')) {
      await 열기(A.p, 전 + u, 2500); await 열기(B.p, 지금 + u, 2500)
      a = await 모습(A.p); bb = await 모습(B.p)
    }
    if (a.글 !== bb.글 || a.링크.join('\n') !== bb.링크.join('\n') || a.단추.join('\n') !== bb.단추.join('\n')) {
      let i = 0; while (i < a.글.length && a.글[i] === bb.글[i]) i++
      다른글.push(`${u} :: 전 «${a.글.slice(Math.max(0, i - 30), i + 60)}» · 지금 «${bb.글.slice(Math.max(0, i - 30), i + 60)}» · 링크 ${a.링크.length}/${bb.링크.length} · 단추 ${a.단추.length}/${bb.단추.length}`)
    }
    if (bb.넘침 > 0 && bb.넘침 > a.넘침) 넘침.push(`${u} ${a.넘침}→${bb.넘침}`)
    if (!단추화면.has(u) && !늦은화면.has(u)) {
      const 꼴 = u.replace(/[^a-z0-9]+/gi, '_') || 'root'
      const fa = path.join(그림곳, `${폰 ? 'm' : 'p'}_${꼴}_전.png`), fb = path.join(그림곳, `${폰 ? 'm' : 'p'}_${꼴}_지금.png`)
      await 그림(A.p, fa); await 그림(B.p, fb)
      const 같다 = () => { if (fs.readFileSync(fa).equals(fs.readFileSync(fb))) return true; const k = 다른점(fa, fb); return k >= 0 && k <= 60 }
      let 같은그림 = 같다()
      if (!같은그림) {   /* 한 번 더(늦게 온 그림 · 자료) */
        await 열기(A.p, 전 + u, 2500); await 열기(B.p, 지금 + u, 2500)
        await 그림(A.p, fa); await 그림(B.p, fb)
        같은그림 = 같다()
      }
      if (!같은그림) 다른그림.push(u)
      else { fs.unlinkSync(fa); fs.unlinkSync(fb) }
    }
  }
  ok(`${이름} — 본문 글 · 링크 · 단추 전과 같음(1순위 · 분석은 두 칸 단추만 뺀 나머지)`, !다른글.length, 다른글.slice(0, 4))
  ok(`${이름} — 화면 그림 전과 같음(탭 띠 숨김 · 1순위 · 분석 · 맵톡 빼고 ${화면들.length - 단추화면.size - 늦은화면.size}곳 · 글꼴 가장자리 60점까지)`, !다른그림.length, 다른그림)
  ok(`${이름} — 가로 넘침 늘어난 곳 없음`, !넘침.length, 넘침)
  ok(`${이름} — 오류 0(전 ${A.오류.length} · 지금 ${B.오류.length})`, B.오류.length <= A.오류.length && !B.오류.some((x) => /받기/.test(x)), B.오류.slice(0, 3))
  await A.ctx.close(); await B.ctx.close()
}

console.log('③ 공고 → 바로투찰 · 1순위 → 바로투찰(채점) — 전과 같은 길')
async function 공고길(주소) {
  const { ctx, p, 오류 } = await 새쪽(true)
  await 열기(p, 주소 + '/live')
  const 알약 = p.locator('main a', { hasText: '💰 바로투찰' }).first()
  const href = await 알약.getAttribute('href')
  await 알약.click()
  await p.waitForTimeout(1800)
  const u = new URL(p.url())
  const 글 = await p.evaluate(() => (document.querySelector('main') || document.body).innerText.replace(/\s+/g, ' '))
  await ctx.close()
  return { href, 길: u.pathname + u.search, 공고: /가상 새솔지구 배수로 정비공사 1차/.test(글), 금액: /권장 투찰금액|투찰금액/.test(글), 오류: 오류.length }
}
const g전 = await 공고길(전), g지금 = await 공고길(지금)
ok('공고 카드 «💰 바로투찰» → /?no=R00TEST80001 · 바로투찰에 그 공고 · 금액 — 전과 같음', g지금.길 === '/?no=R00TEST80001' && g지금.공고 && g지금.금액 && JSON.stringify(g전) === JSON.stringify(g지금), [g전, g지금])
async function 일순길(주소) {
  const { ctx, p, 오류 } = await 새쪽(true)
  await 열기(p, 주소 + '/first')
  const 카드 = p.locator('main .notice.tap, main .notice').first()
  await 카드.click()
  await p.waitForTimeout(1200)
  const 채점 = p.locator('main a', { hasText: '바로투찰에서 채점하기' }).first()
  const 있음 = await 채점.count()
  let 길 = '', 공고 = false
  if (있음) {
    await 채점.click()
    await p.waitForTimeout(1800)
    const u = new URL(p.url()); 길 = u.pathname + '?' + [...u.searchParams.keys()].join(',') + '|no=' + u.searchParams.get('no')
    공고 = /가상 한빛천 재해복구사업/.test(await p.evaluate(() => (document.querySelector('main') || document.body).innerText))
  }
  await ctx.close()
  return { 있음, 길, 공고, 오류: 오류.length }
}
const f전 = await 일순길(전), f지금 = await 일순길(지금)
ok('1순위 카드 펼침 → «📊 바로투찰에서 채점하기» → 바로투찰(no · sc · amt …) — 전과 같은 주소 · 같은 화면', f지금.있음 > 0 && /^\/\?no,sc,amt,rate/.test(f지금.길) && /no=R00TEST70001/.test(f지금.길) && JSON.stringify(f전) === JSON.stringify(f지금), [f전, f지금])

console.log('④ 아래 탭')
{
  const { ctx, p } = await 새쪽(true)
  const 불 = {}
  for (const u of ['/first', '/analysis', '/corp', '/agency', '/live', '/cert']) {
    await 열기(p, 지금 + u)
    불[u] = await p.evaluate(() => [...document.querySelectorAll('nav.tabbar a.on')].map((a) => a.textContent.replace(/\s+/g, '')).join(','))
  }
  const 탭 = await p.evaluate(() => [...document.querySelectorAll('nav.tabbar a')].map((a) => a.textContent.replace(/\s+/g, '') + '=' + a.getAttribute('href')))
  ok('탭 10개 · 맨 끝 📚 자격증 → /cert · «분석» 탭 없음', 탭.length === 10 && 탭[9] === '📚자격증=/cert' && !탭.some((x) => /분석/.test(x)), 탭)
  ok('1순위 탭 불 — /first · /analysis · /corp · /agency / 공고 탭 — /live / 자격증 탭 — /cert', ['/first', '/analysis', '/corp', '/agency'].every((u) => 불[u] === '🏆1순위') && 불['/live'] === '📋공고' && 불['/cert'] === '📚자격증', 불)
  await ctx.close()
}
{
  /* PC 위 탭 줄(railnav) — 같은 열 개 · 맨 끝 자격증 · /corp 에서 1순위 불 */
  const { ctx, p } = await 새쪽(false)
  await 열기(p, 지금 + '/corp')
  const r = await p.evaluate(() => ({ 탭: [...document.querySelectorAll('nav.railnav a')].map((a) => a.textContent.replace(/\s+/g, '') + '=' + a.getAttribute('href')),
    불: [...document.querySelectorAll('nav.railnav a.on, nav.railnav a.active, nav.railnav a[aria-current="page"]')].map((a) => a.textContent.replace(/\s+/g, '')) }))
  ok('PC 위 탭 줄 — 10개 · 맨 끝 📚 자격증 → /cert · «분석» 없음 · /corp 에서 1순위 불', r.탭.length === 10 && r.탭[9] === '📚자격증=/cert' && !r.탭.some((x) => /분석/.test(x)) && r.불.includes('🏆1순위'), r)
  await ctx.close()
}

await b.close()
console.log(`\n${bad ? '❌' : '✅'} 시험_탭그대로화면 ${n - bad}/${n}`)
process.exit(bad ? 1 : 0)
