/**
 * 📅 G620 «2027 달력» 서식 화면 시험 — 구운 사이트(dist + web/public/forms/g)를 띄운 뒤:
 *   node tools/시험_달력2027화면.mjs [주소=http://127.0.0.1:4578]
 *   소장님 「이거 시작하자」(2027 달력부터) · 「꼭 검색 되게」 · 「달력 어플도 참고하고, 웹에 있는 달력도 참고해서 가장 유용하게」(11-09)
 *   ① 서식 탭 카드 · 찾기(«2027 달력» · «2027년 달력» · «공휴일 달력» · «2027 음력 달력»)
 *   ② 구운 장(검색 제목 · 설명 · 큰 제목 · canonical · 구조화 자료) · 화면 글(대체공휴일 · 노동절 · 제헌절 · 연차 꿀팁 · 손없는 날 · 제161조 · 119일) ·
 *      «무료» · «클로드» 없음 · 빈 틀 엑셀(시트 15장) · PDF 단추 · 고르는 단추(단위 4 · 첫날 2) · 빈 종이 빈칸
 *   ③ «✍ 예시 채우기» → 근무일(183 · 124 · 147 · 59 · 현장 쉬는 날 판정) · 기한 셋(설 연휴 · 2월 끝 · 광복절) · 날짜 셈 · 달마다 일정
 *   ④ 이용자처럼: 다른 서식에 쓴 착공 · 준공이 먼저 들어옴 · 한 해 전부(365 · 246 · 293 · 119) · 2026 · 2028 걸침 · ⚠ 셋 ·
 *      현장 쉬는 날 일곱 경우 · 날짜 아무 데나 20번(하루씩 센 값과 같음) · 기한 일곱 경우(넣고 · 주 · 년 · 2월 끝 · 2028 넘어감) · 날짜 셈 · 일정 쳐 넣기 · 새로고침 그대로
 *   ⑤ 폰 390 · 360: 종이 뜸 · 가로 넘침 0 · 오류 0
 * 인터넷 안 부름(파이어베이스 · 광고 · 애널리틱스 막음) · 파일은 받지 않고 주소만 확인.
 */
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { 판짜기, 칸상자, 칸쪽 } from '../web/src/lib/격자그림.js'
import { 열번호 } from '../web/src/lib/엑셀셈.js'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const BASE = process.argv[2] || 'http://127.0.0.1:4578'
const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const SLUG = 'dalryeok-2027'
const DOC = JSON.parse(fs.readFileSync(path.join(ROOT, 'web/public/forms/g', SLUG + '.json'), 'utf8'))
const 쪽수 = DOC.sheets.reduce((a, s) => a + 판짜기(s).쪽.length, 0)

let bad = 0, n = 0
const ok = (이름, c, got) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (c || got === undefined ? '' : ' = ' + JSON.stringify(got).slice(0, 300))) }
const b = await chromium.launch()
const UA폰 = 'Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'
async function 새쪽(w, h, 폰 = true) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', isMobile: 폰, hasTouch: 폰, ...(폰 ? { userAgent: UA폰 } : {}) })
  await ctx.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|googlesyndication|geojs|firebaseio|firebasedatabase/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await ctx.addInitScript(() => { try { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); sessionStorage.setItem('kcm_notice_seen', '2026-10-업체'); sessionStorage.setItem('kcm_visit_s', '1') } catch (e) { /* 없음 */ } })
  const p = await ctx.newPage()
  const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
  return { ctx, p, 오류 }
}
const 넘침 = (p) => p.evaluate(() => document.documentElement.scrollWidth - innerWidth)
async function 종이(p, slug = SLUG) {
  await p.goto(BASE + '/forms/' + slug, { waitUntil: 'domcontentloaded' })
  await p.waitForFunction(() => window.__격자 && document.querySelectorAll('canvas.gx-page').length, null, { timeout: 25000 })
  await p.waitForTimeout(400)
}
const 시트번호 = (이름) => DOC.sheets.findIndex((s) => s.name === 이름)
function 키(시트, 열쇠) {
  const si = 시트번호(시트)
  if (si < 0) throw new Error('시트 없음: ' + 시트)
  const ks = DOC.sheets[si].keys
  const a = Object.keys(ks).find((x) => ks[x] === 열쇠 && !x.includes(':'))
  if (!a) throw new Error('열쇠 없음: ' + 시트 + '!' + 열쇠)
  const m = /^([A-Z]+)(\d+)$/.exec(a)
  return [si, +m[2], 열번호(m[1])]
}
const 값 = (p, a) => p.evaluate(([si, r, c]) => { const v = window.__격자.책.값(si, r, c); return v && v.e ? { 오류: v.e } : v }, a)
const 넣기 = (p, a, v) => p.evaluate(([[si, r, c], v]) => { window.__격자.책.넣기(si, r, c, v === '__처음' ? undefined : v) }, [a, v === undefined ? '__처음' : v])
const 값은 = async (p, 시트, 열쇠) => 값(p, 키(시트, 열쇠))
const 넣음 = async (p, 시트, 열쇠, v) => 넣기(p, 키(시트, 열쇠), v)
/* 날짜 — 엑셀 일련 */
const 일련 = (y, m, d) => Math.round((Date.UTC(y, m - 1, d) - Date.UTC(1899, 11, 30)) / 86400000)
const 날 = (s) => new Date(Date.UTC(1899, 11, 30) + s * 86400000)
const 날ISO = (s) => 날(s).toISOString().slice(0, 10)
const 요 = (s) => '일월화수목금토'[날(s).getUTCDay()]
/* 2027 공휴일(관공서 공휴일 규정 · 월력요항) — 생성기와 따로 적음(같아야 함) */
const 공휴 = new Set([[1, 1], [2, 6], [2, 7], [2, 8], [2, 9], [3, 1], [5, 1], [5, 3], [5, 5], [5, 13], [6, 6], [7, 17], [7, 19], [8, 15], [8, 16],
  [9, 14], [9, 15], [9, 16], [10, 3], [10, 4], [10, 9], [10, 11], [12, 25], [12, 27]].map(([m, d]) => 일련(2027, m, d)))
const 주말 = (s) => { const w = 날(s).getUTCDay(); return w === 0 || w === 6 }
const 쉬5 = (s) => 주말(s) || 공휴.has(s)
/* 하루씩 세기 — 수식과 다른 길 */
function 하루씩(a, b, 더평 = [], 더토 = []) {
  const s = Math.max(a, 일련(2027, 1, 1)), e = Math.min(b, 일련(2027, 12, 31))
  if (e < s) return null
  let 일 = 0, 토 = 0, 평휴 = 0, 토휴 = 0, w5 = 0, w6 = 0
  for (let x = s; x <= e; x++) {
    const w = 날(x).getUTCDay()
    if (w === 0) 일++
    if (w === 6) 토++
    if (공휴.has(x) && w >= 1 && w <= 5) 평휴++
    if (공휴.has(x) && w === 6) 토휴++
    if (!쉬5(x) && !더평.includes(x)) w5++
    if (w !== 0 && !공휴.has(x) && !더평.includes(x) && !더토.includes(x)) w6++
  }
  return { 날수: e - s + 1, 셈시작: s, 셈끝: e, 일요: 일, 토요: 토, 평휴수: 평휴, 토휴수: 토휴, 근무5: w5, 근무6: w6, 쉬는5: e - s + 1 - w5 }
}
/* 민법 기간 셈(제157조 · 제160조 · 제161조) — 수식과 다른 길 */
function 기한(s, n, u, 첫) {
  const ins = 첫 === '넣고' ? 1 : 0
  let e
  if (u === '일') e = s + n - ins
  else if (u === '주') e = s + 7 * n - ins
  else {
    const S = 날(s + 1 - ins), M = (u === '년' ? 12 : 1) * n
    const y = S.getUTCFullYear(), m0 = S.getUTCMonth() + M, d = S.getUTCDate()
    const 끝날 = new Date(Date.UTC(y, m0 + 1, 0)).getUTCDate()
    const t = new Date(Date.UTC(y, m0, Math.min(d, 끝날)))
    e = Math.round((t - Date.UTC(1899, 11, 30)) / 86400000)
    e = d > 끝날 ? e : e - 1
  }
  let x = e
  while (쉬5(x)) x++
  return [e, x]
}
/* 칸 누르기(사람처럼 — 종이 위 그 칸 자리를 누름) */
async function 칸누르기(p, 시트, 열쇠) {
  const [si, r, c] = 키(시트, 열쇠)
  const s = DOC.sheets[si]
  const x = s.cells.find((q) => q[0] === r && q[1] === c)
  const 판 = 판짜기(s)
  const pi = 칸쪽(판, r)
  const 상자 = 칸상자(판, pi, x)
  const cv = p.locator(`#gx-s${si} canvas.gx-page`).nth(pi)
  await cv.scrollIntoViewIfNeeded()
  let bx = await cv.boundingBox()
  const 비 = bx.width / 판.W
  await p.evaluate(([cx, cy]) => {
    const 감 = document.querySelector('.gx-wrap')
    if (감 && (cx < 0 || cx > innerWidth - 10)) 감.scrollLeft += cx - innerWidth / 2
    window.scrollBy(0, cy - innerHeight * 0.33)
  }, [bx.x + (상자.x + 상자.w / 2) * 비, bx.y + (상자.y + 상자.h / 2) * 비])
  await p.waitForTimeout(250)
  bx = await cv.boundingBox()
  await p.mouse.click(bx.x + (상자.x + 상자.w / 2) * 비, bx.y + (상자.y + 상자.h / 2) * 비)
  await p.waitForTimeout(200)
}
const 칩들 = (p) => p.evaluate(() => [...document.querySelectorAll('.gx-ed-ch .gx-chip')].map((x) => x.textContent))
async function 쳐넣기(p, 시트, 열쇠, 글) {
  await 칸누르기(p, 시트, 열쇠)
  const 입 = p.locator('.gx-ed-r .fw-in').first()
  await 입.fill(글)
  await p.keyboard.press('Enter')
  await p.waitForTimeout(150)
}
const 판정글 = (r, 평 = 0, 토 = 0) => `✓ 2027년 안 ${날(r.셈시작).getUTCMonth() + 1}/${날(r.셈시작).getUTCDate()} ~ ${날(r.셈끝).getUTCMonth() + 1}/${날(r.셈끝).getUTCDate()} ${r.날수}일 — 근무일 ${r.근무5}일(주 5일) · ${r.근무6}일(주 6일)` +
  (평 + 토 ? ` · 현장 쉬는 날 뺌(평일 ${평} · 토요일 ${토})` : '')
async function 근무읽기(p) {
  const o = {}
  for (const k of ['날수', '셈시작', '셈끝', '일요', '토요', '평휴수', '토휴수', '근무5', '근무6', '쉬는5']) o[k] = await 값은(p, '근무일', k)
  return o
}
const 같다 = (a, b) => JSON.stringify(a) === JSON.stringify(b)

console.log('① 서식 탭 · 찾기 (폰 390)')
{
  const { ctx, p, 오류 } = await 새쪽(390, 844)
  await p.goto(BASE + '/forms', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('input[placeholder*="서식 찾기"]', { timeout: 15000 })
  await p.waitForTimeout(500)
  const 링크 = await p.evaluate((s) => [...document.querySelectorAll('a')].filter((a) => (a.getAttribute('href') || '').endsWith('/forms/' + s)).length, SLUG)
  ok('서식 탭에 «2027 달력» 카드(링크)', 링크 > 0, 링크)
  for (const 말 of ['2027 달력', '2027년 달력', '공휴일 달력', '2027 음력 달력']) {
    await p.fill('input[placeholder*="서식 찾기"]', 말)
    await p.waitForTimeout(500)
    const 있음 = await p.evaluate(() => /2027 달력/.test(document.querySelector('main').innerText))
    ok(`«${말}» 찾으면 나옴`, 있음)
  }
  ok('폰 390 넘침 0', (await 넘침(p)) <= 1, await 넘침(p))
  ok('오류 0(서식 탭)', !오류.length, 오류)
  await ctx.close()
}

console.log('② 서식 화면 (PC 1280)')
{
  const { ctx, p, 오류 } = await 새쪽(1280, 900, false)
  await 종이(p)
  const 캔 = await p.evaluate(() => document.querySelectorAll('canvas.gx-page').length)
  ok(`종이 쪽 수 = 판짜기(${쪽수}) · 시트 ${DOC.sheets.length}`, 캔 === 쪽수 && DOC.sheets.length === 15, [캔, DOC.sheets.length])
  const 구운 = await p.request.get(BASE + '/forms/' + SLUG + '.html')
  const 구h = 구운.status() === 200 ? await 구운.text() : ''
  ok('구운 장 제목 «2027 달력 — 공휴일 · 대체공휴일 · 음력 · 손없는 날 · 근무일 (인쇄 · PDF) | K-건설맵»', 구h.includes('<title>2027 달력 — 공휴일 · 대체공휴일 · 음력 · 손없는 날 · 근무일 (인쇄 · PDF) | K-건설맵</title>'), (구h.match(/<title>[^<]*/) || [구운.status()])[0])
  ok('구운 장 설명 «2027년 공휴일 24일 · 대체공휴일 7일 · …»', /<meta name="description" content="2027년 공휴일 24일 · 대체공휴일 7일 · 노동절 · 제헌절 공휴일[^"]*/.test(구h))
  ok('구운 장 큰 제목 · canonical · 구조화 자료', 구h.includes(`<link rel="canonical" href="https://k-conmap.com/forms/${SLUG}" />`) &&
    구h.includes('"@type":"BreadcrumbList"') && 구h.includes('"name":"2027 달력 — 공휴일 · 대체공휴일 · 근무일"') && /<h1[^>]*>2027 달력 — 공휴일 · 대체공휴일 · 근무일<\/h1>/.test(구h))
  ok('구운 장 글에 공휴일 목록(검색에 걸리게) — 2/9(화) 대체공휴일 · 12/27(월) 대체공휴일 · 손없는 날 · 연차 꿀팁', ['2/9(화) 대체공휴일', '12/27(월) 대체공휴일', '손없는 날', '연차 꿀팁', '9/11(토) ~ 9/19(일) 9일'].every((t) => 구h.includes(t)))
  const 본문 = await p.evaluate(() => document.querySelector('main').innerText)
  for (const t of ['대체공휴일', '노동절', '제헌절', '연차 꿀팁', '손없는 날', '제161조', '119일', '안전점검의 날']) ok(`화면 글 «${t}» 보임`, 본문.includes(t))
  ok('새 서식 — «무료» 안 씀', !/무료/.test(본문), (본문.match(/.{0,20}무료.{0,20}/) || [''])[0])
  ok('«클로드» 안 씀', !/클로드/.test(본문))
  const 엑셀 = await p.evaluate((s) => [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')).filter((h) => h.endsWith('/forms/' + s + '.xlsx')).length, SLUG)
  ok('빈 틀 엑셀 받기 링크', 엑셀 > 0, 엑셀)
  const r = await p.request.get(BASE + '/forms/' + SLUG + '.xlsx')
  const 몸 = await r.body()
  ok('받는 파일이 엑셀(zip · 시트 15장)', r.status() === 200 && 몸[0] === 0x50 && 몸[1] === 0x4b && (몸.toString('latin1').match(/xl\/worksheets\/sheet\d+\.xml/g) || []).length >= 15, [r.status(), 몸.length])
  ok('📄 PDF 저장 단추', (await p.locator('button', { hasText: 'PDF 저장' }).count()) > 0)
  await 칸누르기(p, '연휴기한', '기단#1')
  ok('기한 단위 → 고르는 단추 4개(일 · 주 · 개월 · 년)', 같다(await 칩들(p), ['일', '주', '개월', '년']), await 칩들(p))
  await 칸누르기(p, '연휴기한', '기첫#1')
  ok('첫날 → 고르는 단추 2개(빼고 · 넣고)', 같다(await 칩들(p), ['빼고', '넣고']), await 칩들(p))
  await p.locator('.gx-ed-x').click()
  ok('빈 종이 — 판정은 안내 글 · 날 수 · 기한 · 날짜 셈 빈칸 · 단위 빈칸(비우면 일) · 첫날 «빼고» 미리',
    (await 값은(p, '근무일', '판정')) === '※ 시작일(착공) · 끝날(준공)을 적으면 2027년 안 날 수 · 근무일이 나옵니다' && (await 값은(p, '근무일', '날수')) === '' &&
    (await 값은(p, '연휴기한', '기만#1')) === '' && (await 값은(p, '연휴기한', '더날')) === '' && (await 값은(p, '연휴기한', '사이')) === '' &&
    !(await 값은(p, '연휴기한', '기단#2')) && (await 값은(p, '연휴기한', '기첫#3')) === '빼고')
  ok('공휴일 표 24 · 요일 저절로(1/1 금 · 12/27 월)', (await 값은(p, '근무일', '공휴날#1')) === 일련(2027, 1, 1) && (await 값은(p, '근무일', '공휴요#1')) === '금' && (await 값은(p, '근무일', '공휴요#24')) === '월')

  console.log('③ ✍ 예시 채우기 → 자동 칸')
  await p.locator('button', { hasText: '예시 채우기' }).click()
  await p.waitForTimeout(400)
  const 모든값 = await p.evaluate(() => { const g = window.__격자; const out = []; g.doc.sheets.forEach((s, si) => { for (const x of s.cells) if (x[5] === 2 || x[5] === 3) { const v = g.책.값(si, x[0], x[1]); out.push(v && v.e ? '#' + v.e : v) } }); return out })
  const 오류칸 = 모든값.filter((v) => typeof v === 'string' && v.startsWith('#'))
  ok('오류 칸 0', !오류칸.length, 오류칸.slice(0, 5))
  const 예근 = 하루씩(일련(2027, 3, 2), 일련(2027, 8, 31), [일련(2027, 7, 29), 일련(2027, 7, 30)], [일련(2027, 7, 31)])
  ok('근무일 3/2 ~ 8/31 — 하루씩 센 값과 같음(183 · 124 · 147 · 59)', 같다(await 근무읽기(p), 예근) && 예근.근무5 === 124 && 예근.근무6 === 147, await 근무읽기(p))
  ok('현장 쉬는 날 판정 «✓ 평일 · 뺌» × 2 · «✓ 토요일 · 주 6일만 뺌» · 3일', (await 값은(p, '근무일', '더쉼판#1')) === '✓ 평일 · 뺌' && (await 값은(p, '근무일', '더쉼판#2')) === '✓ 평일 · 뺌' &&
    (await 값은(p, '근무일', '더쉼판#3')) === '✓ 토요일 · 주 6일만 뺌' && (await 값은(p, '근무일', '더쉼수')) === 3)
  ok('판정 «✓ 2027년 안 3/2 ~ 8/31 183일 — 근무일 124일(주 5일) · 147일(주 6일) · 현장 쉬는 날 뺌(평일 2 · 토요일 1)»', (await 값은(p, '근무일', '판정')) === 판정글(예근, 2, 1), await 값은(p, '근무일', '판정'))
  for (const [j, s, n_, u, 끝, 만, 설] of [[1, 일련(2027, 1, 23), 14, '일', 일련(2027, 2, 6), 일련(2027, 2, 10), '끝날 2/6(토) 쉬는 날(토요일 · 공휴일) → 다음 평일 2/10(수)'],
    [2, 일련(2027, 1, 30), 1, '개월', 일련(2027, 2, 28), 일련(2027, 3, 2), '끝날 2/28(일) 쉬는 날(토요일 · 공휴일) → 다음 평일 3/2(화)'],
    [3, 일련(2027, 7, 14), 1, '개월', 일련(2027, 8, 14), 일련(2027, 8, 17), '끝날 8/14(토) 쉬는 날(토요일 · 공휴일) → 다음 평일 8/17(화)']]) {
    ok(`기한 ${j}: ${날ISO(s)} + ${n_}${u} → 끝날 ${날ISO(끝)} · 만료 ${날ISO(만)}(${요(만)}) · 다른 길과 같음`, (await 값은(p, '연휴기한', `기끝#${j}`)) === 끝 && (await 값은(p, '연휴기한', `기만#${j}`)) === 만 &&
      (await 값은(p, '연휴기한', `기만요#${j}`)) === 요(만) && 같다(기한(s, n_, u, '빼고'), [끝, 만]) && (await 값은(p, '연휴기한', `기설#${j}`)) === 설, [await 값은(p, '연휴기한', `기만#${j}`), await 값은(p, '연휴기한', `기설#${j}`)])
  }
  ok('날짜 셈 3/2 + 100일 = 6/10(목) 평일 · 3/2 ~ 8/31 = 182 · 183 · 26주 0일', (await 값은(p, '연휴기한', '더날')) === 일련(2027, 6, 10) && (await 값은(p, '연휴기한', '더요')) === '목' &&
    (await 값은(p, '연휴기한', '더쉼')) === '평일' && (await 값은(p, '연휴기한', '사이')) === 182 && (await 값은(p, '연휴기한', '사이넣')) === 183 && (await 값은(p, '연휴기한', '사주')) === '26주 0일')
  ok('달마다 일정 예시(9월 13일 «연휴 전 안전점검» · 1월 5일 «시무식»)', (await 값은(p, '9월', '일정#13')) === '연휴 전 안전점검' && (await 값은(p, '1월', '일정#5')) === '시무식')
  ok('오류 0(PC · 예시)', !오류.length, 오류)
  await ctx.close()
}

console.log('④ 이용자처럼 (PC) — 다른 서식에 쓴 착공 · 준공이 먼저 들어옴')
{
  const { ctx, p, 오류 } = await 새쪽(1280, 900, false)
  await 종이(p)
  await p.evaluate((공) => { localStorage.removeItem('kcm.격자'); localStorage.setItem('kcm.서식공통', JSON.stringify(공)) },
    { 현장: '시험 근린생활시설 신축공사', 회사: '시험건설(주)', 대표: '김시험', 착공: '2027-04-01', 준공: '2027-09-30' })
  await 종이(p)
  const 착 = await 값은(p, '근무일', '착공일'), 준 = await 값은(p, '근무일', '준공일')
  ok('착공일 · 준공일이 다른 서식에서 들어옴(2027. 4. 1. ~ 9. 30.)', 착 === 일련(2027, 4, 1) && 준 === 일련(2027, 9, 30), [착, 준])
  ok('→ 근무일이 하루씩 센 값과 같음', 같다(await 근무읽기(p), 하루씩(착, 준)), await 근무읽기(p))
  await 넣음(p, '근무일', '착공일', 일련(2027, 1, 1)); await 넣음(p, '근무일', '준공일', 일련(2027, 12, 31))
  const 한해 = await 근무읽기(p)
  ok('한 해 전부 — 365일 · 근무일 246(주 5일) · 293(주 6일) · 쉬는 날 119 · 일 52 · 토 52 · 평일 공휴일 15 · 토요일 공휴일 5',
    한해.날수 === 365 && 한해.근무5 === 246 && 한해.근무6 === 293 && 한해.쉬는5 === 119 && 한해.일요 === 52 && 한해.토요 === 52 && 한해.평휴수 === 15 && 한해.토휴수 === 5, 한해)
  await 넣음(p, '근무일', '착공일', 일련(2026, 10, 1)); await 넣음(p, '근무일', '준공일', 일련(2028, 3, 31))
  ok('2026 ~ 2028 걸침 → 2027년 안만(1/1 ~ 12/31 · 365)', (await 값은(p, '근무일', '셈시작')) === 일련(2027, 1, 1) && (await 값은(p, '근무일', '셈끝')) === 일련(2027, 12, 31) && (await 값은(p, '근무일', '날수')) === 365)
  await 넣음(p, '근무일', '착공일', 일련(2026, 12, 1)); await 넣음(p, '근무일', '준공일', 일련(2027, 1, 31))
  ok('2026. 12. 1. ~ 2027. 1. 31. → 1월만 31일 · 근무일 20(달마다 표와 같음)', (await 값은(p, '근무일', '날수')) === 31 && (await 값은(p, '근무일', '근무5')) === 20)
  await 넣음(p, '근무일', '준공일', 일련(2026, 11, 30))
  ok('끝날이 앞 → «⚠ 끝날이 시작일보다 앞입니다» · 날 수 빈칸', (await 값은(p, '근무일', '판정')) === '⚠ 끝날이 시작일보다 앞입니다' && (await 값은(p, '근무일', '날수')) === '')
  await 넣음(p, '근무일', '착공일', 일련(2028, 1, 5)); await 넣음(p, '근무일', '준공일', 일련(2028, 6, 30))
  ok('2028년만 → «⚠ 2027년과 겹치는 날이 없습니다»', (await 값은(p, '근무일', '판정')) === '⚠ 2027년과 겹치는 날이 없습니다')
  await 넣음(p, '근무일', '준공일', null)
  ok('하나만 적음 → «⚠ 시작일 · 끝날을 둘 다 날짜로 적으세요»', (await 값은(p, '근무일', '판정')) === '⚠ 시작일 · 끝날을 둘 다 날짜로 적으세요')
  /* 현장 쉬는 날 일곱 경우 */
  await 넣음(p, '근무일', '착공일', 일련(2027, 5, 1)); await 넣음(p, '근무일', '준공일', 일련(2027, 5, 31))
  const 더 = [일련(2027, 5, 5), 일련(2027, 5, 9), 일련(2027, 6, 2), 일련(2027, 5, 14), 일련(2027, 5, 14), 일련(2027, 5, 15)]
  for (let j = 1; j <= 6; j++) await 넣음(p, '근무일', `더쉼#${j}`, 더[j - 1])
  const 판들 = []
  for (let j = 1; j <= 6; j++) 판들.push(await 값은(p, '근무일', `더쉼판#${j}`))
  ok('현장 쉬는 날 — 이미 공휴일 · 일요일 · 기간 밖 · ✓ 평일 · 앞 칸과 같은 날 · ✓ 토요일', 같다(판들, ['이미 공휴일', '일요일 · 안 뺌', '기간 밖', '✓ 평일 · 뺌', '앞 칸과 같은 날', '✓ 토요일 · 주 6일만 뺌']), 판들)
  const 오월 = 하루씩(일련(2027, 5, 1), 일련(2027, 5, 31), [일련(2027, 5, 14)], [일련(2027, 5, 15)])
  ok('→ 5월 근무일이 하루씩 센 값과 같음(평일 1 · 토 1 뺌 · 같은 날 두 번 안 뺌)', 같다(await 근무읽기(p), 오월) && (await 값은(p, '근무일', '판정')) === 판정글(오월, 1, 1), [await 근무읽기(p), 오월])
  await 넣음(p, '근무일', '더쉼#3', '칠월 이일')
  ok('날짜 아닌 글 → «⚠ 날짜로»', (await 값은(p, '근무일', '더쉼판#3')) === '⚠ 날짜로', await 값은(p, '근무일', '더쉼판#3'))
  for (let j = 1; j <= 6; j++) await 넣음(p, '근무일', `더쉼#${j}`, null)
  /* 날짜 아무 데나 20번 */
  let 시드 = 20271109
  const 난 = () => { 시드 = (시드 * 1103515245 + 12345) % 2147483648; return 시드 / 2147483648 }
  let 틀림 = 0
  for (let k = 0; k < 20; k++) {
    const a = 일련(2026, 12, 1) + Math.floor(난() * 420), bb = a + Math.floor(난() * 200)
    await 넣음(p, '근무일', '착공일', a); await 넣음(p, '근무일', '준공일', bb)
    const want = 하루씩(a, bb)
    const got = await 근무읽기(p)
    if (want ? !같다(got, want) : got.날수 !== '') { 틀림++; console.log('    다름', 날ISO(a), 날ISO(bb), JSON.stringify(got), JSON.stringify(want)) }
  }
  ok('날짜 아무 데나 20번 — 하루씩 센 값과 모두 같음', 틀림 === 0, 틀림)
  /* 기한 일곱 경우 */
  const 경우 = [[일련(2027, 3, 1), 10, '일', '넣고'], [일련(2027, 4, 30), 2, '주', '빼고'], [일련(2027, 2, 28), 1, '년', '빼고'], [일련(2027, 3, 30), 1, '개월', '빼고'],
    [일련(2027, 12, 30), 2, '일', '빼고'], [일련(2027, 9, 10), 3, '일', '빼고'], [일련(2027, 10, 1), 1, '주', '넣고']]
  let 기틀 = 0
  for (const [s, n_, u, c] of 경우) {
    await 넣음(p, '연휴기한', '기시#1', s); await 넣음(p, '연휴기한', '기수#1', n_); await 넣음(p, '연휴기한', '기단#1', u); await 넣음(p, '연휴기한', '기첫#1', c)
    const [e, x] = 기한(s, n_, u, c)
    const ge = await 값은(p, '연휴기한', '기끝#1'), gx = await 값은(p, '연휴기한', '기만#1'), 설 = await 값은(p, '연휴기한', '기설#1')
    const 밖 = 날(e).getUTCFullYear() !== 2027 || 날(x).getUTCFullYear() !== 2027
    if (ge !== e || gx !== x || 밖 !== 설.includes('⚠ 2027년 밖')) { 기틀++; console.log('    기한 다름', 날ISO(s), n_, u, c, ge, gx, e, x, 설) }
  }
  ok('기한 일곱 경우(첫날 넣고 · 주 · 년(2028. 2. 29.) · 3/31 → 4/30 · 2028 넘어감 · 추석 · 0시부터 주) — 다른 길과 같음 · 2027년 밖 알림', 기틀 === 0, 기틀)
  await 넣음(p, '연휴기한', '기시#1', 일련(2027, 2, 28)); await 넣음(p, '연휴기한', '기수#1', 1); await 넣음(p, '연휴기한', '기단#1', '년'); await 넣음(p, '연휴기한', '기첫#1', '빼고')
  ok('2027. 2. 28. + 1년 → 끝날 2028. 2. 29.(화 · 윤년) · «⚠ 2027년 밖 …»', (await 값은(p, '연휴기한', '기끝#1')) === 일련(2028, 2, 29) && (await 값은(p, '연휴기한', '기설#1')).endsWith('· ⚠ 2027년 밖 — 그해 공휴일은 안 셈(토 · 일만)'), await 값은(p, '연휴기한', '기설#1'))
  await 넣음(p, '연휴기한', '기수#1', 0)
  ok('기간 0 → 빈칸', (await 값은(p, '연휴기한', '기끝#1')) === '' && (await 값은(p, '연휴기한', '기설#1')) === '')
  await 넣음(p, '연휴기한', '기시#1', 일련(2027, 1, 23)); await 넣음(p, '연휴기한', '기수#1', 14); await 넣음(p, '연휴기한', '기단#1', null)
  ok('단위를 비우면 «일»로 셈(1/23 + 14 → 2/6 → 2/10)', (await 값은(p, '연휴기한', '기끝#1')) === 일련(2027, 2, 6) && (await 값은(p, '연휴기한', '기만#1')) === 일련(2027, 2, 10))
  /* 날짜 셈 */
  for (const [s, d_, 그날, 글] of [[일련(2027, 12, 25), 0, 일련(2027, 12, 25), '쉬는 날(토 · 일 · 공휴일)'], [일련(2027, 5, 13), 0, 일련(2027, 5, 13), '쉬는 날(토 · 일 · 공휴일)'],
    [일련(2027, 3, 2), -1, 일련(2027, 3, 1), '쉬는 날(토 · 일 · 공휴일)'], [일련(2027, 12, 31), 4, 일련(2028, 1, 4), '평일 · 2027년 밖(공휴일은 안 셈)'], [일련(2027, 12, 31), 1, 일련(2028, 1, 1), '쉬는 날(토 · 일)']]) {
    await 넣음(p, '연휴기한', '더기준', s); await 넣음(p, '연휴기한', '더일', d_)
    ok(`${날ISO(s)} ${d_ >= 0 ? '+' : ''}${d_}일 → ${날ISO(그날)}(${요(그날)}) «${글}»`, (await 값은(p, '연휴기한', '더날')) === 그날 && (await 값은(p, '연휴기한', '더요')) === 요(그날) && (await 값은(p, '연휴기한', '더쉼')) === 글, await 값은(p, '연휴기한', '더쉼'))
  }
  await 넣음(p, '연휴기한', '사앞', 일련(2027, 5, 1)); await 넣음(p, '연휴기한', '사뒤', 일련(2027, 4, 1))
  ok('두 날이 거꾸로 → «⚠ 뒷날이 앞» · 몇 주 빈칸', (await 값은(p, '연휴기한', '사이넣')) === '⚠ 뒷날이 앞' && (await 값은(p, '연휴기한', '사주')) === '' && (await 값은(p, '연휴기한', '사이')) === -30)
  /* 일정 — 종이에서 쳐 넣고 새로고침 */
  await 넣음(p, '근무일', '착공일', 일련(2027, 3, 2)); await 넣음(p, '근무일', '준공일', 일련(2027, 8, 31))
  await 쳐넣기(p, '2월', '일정#10', '시험 — 설 연휴 뒤 현장 점검')
  ok('2월 10일 칸에 일정 쳐 넣음', (await 값은(p, '2월', '일정#10')) === '시험 — 설 연휴 뒤 현장 점검', await 값은(p, '2월', '일정#10'))
  await p.waitForTimeout(1000)
  await 종이(p)
  ok('새로고침 → 일정 · 근무일 그대로(이 기기)', (await 값은(p, '2월', '일정#10')) === '시험 — 설 연휴 뒤 현장 점검' && 같다(await 근무읽기(p), 하루씩(일련(2027, 3, 2), 일련(2027, 8, 31))), await 값은(p, '2월', '일정#10'))
  ok('오류 0(PC · 적기)', !오류.length, 오류)
  await ctx.close()
}

console.log('⑤ 폰 390 · 360')
for (const [w, h] of [[390, 844], [360, 740]]) {
  const s = await 새쪽(w, h)
  await 종이(s.p)
  ok(`폰 ${w} 종이 뜸`, (await s.p.evaluate(() => document.querySelectorAll('canvas.gx-page').length)) === 쪽수)
  ok(`폰 ${w} 넘침 0`, (await 넘침(s.p)) <= 1, await 넘침(s.p))
  if (w === 390) {
    await s.p.locator('button', { hasText: '예시 채우기' }).click()
    await s.p.waitForTimeout(400)
    ok('폰 390 예시 채우기 → 근무일 124 · 만료 2/10', (await 값은(s.p, '근무일', '근무5')) === 124 && (await 값은(s.p, '연휴기한', '기만#1')) === 일련(2027, 2, 10))
    ok('폰 390 넘침 0(예시 뒤)', (await 넘침(s.p)) <= 1, await 넘침(s.p))
  }
  ok(`폰 ${w} 오류 0`, !s.오류.length, s.오류)
  await s.ctx.close()
}

await b.close()
console.log(`\n${bad ? '✗' : '✓'} 시험_달력2027화면 ${n - bad}/${n}`)
process.exit(bad ? 1 : 0)
