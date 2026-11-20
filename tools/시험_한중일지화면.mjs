/**
 * ❄️ G796 «한중 콘크리트 양생일지» 서식 화면 시험 — 구운 사이트(dist + web/public/forms/g)를 띄운 뒤:
 *   node tools/시험_한중일지화면.mjs [주소=http://127.0.0.1:4996]
 *   소장님 「우리 도구에 이거 있어? 없으면 만들어 줘. 아이디어 추가 해서 만들어 줘」(한중 콘크리트 관리 계획서 · 별첨1 양생일지)
 *   ① 서식 탭 카드 · 찾기 넷 ② 서식 화면(PC): 쪽 수 · 제목 · 근거 · «무료» · «클로드» 없음 · 엑셀 받기 없음(그림 PDF 만) · PDF 단추 · 다음 서류 둘 · 되돌아오는 링크 둘
 *   ③ ✍ 예시 채우기 → 그날 최저 · 5 ℃ 밑 · 기록 · 처음 3일 · 예보 · 적산온도 118 · 3.9일 · 공시체 · 적정공기 · 확인 6가지
 *   ④ 이용자처럼: 타설일 → 날짜 7일 이어짐 · 부위 셋 → 최저 · 5 ℃ / 0 ℃ 경계 · 처음 3일 ⚠ · 산소 18 · 23.5 · 일산화탄소 30 · 이산화탄소 1.5 경계 · 산소 빠짐 · 공시체 4.9 / 5 · 새로고침 그대로
 *   ⑤ 폰 390 · 360: 종이 뜸 · 가로 넘침 0 · 오류 0
 * 인터넷 안 부름(파이어베이스 · 광고 · 애널리틱스 막음) · 파일은 받지 않음.
 */
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { 판짜기, 칸상자, 칸쪽 } from '../web/src/lib/격자그림.js'
import { 열번호 } from '../web/src/lib/엑셀셈.js'
const require = createRequire(process.env.PW || '/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const BASE = process.argv[2] || 'http://127.0.0.1:4996'
const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const SLUG = 'hanjung-ilji'
const DOC = JSON.parse(fs.readFileSync(path.join(ROOT, 'web/public/forms/g', SLUG + '.json'), 'utf8'))
const 쪽수 = DOC.sheets.reduce((a, s) => a + 판짜기(s).쪽.length, 0)

let bad = 0, n = 0
const ok = (이름, c, got) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (c || got === undefined ? '' : ' = ' + JSON.stringify(got).slice(0, 300))) }
const b = await chromium.launch()
const UA폰 = 'Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'
async function 새쪽(w, h, 폰 = true) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', isMobile: 폰, hasTouch: 폰, ...(폰 ? { userAgent: UA폰 } : {}) })
  await ctx.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|googlesyndication|geojs|firebaseio|firebasedatabase|daumcdn|kakao|coupang/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
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
  const ks = DOC.sheets[si].keys
  const a = Object.keys(ks).find((x) => ks[x] === 열쇠 && !x.includes(':'))
  if (!a) throw new Error('열쇠 없음: ' + 시트 + '!' + 열쇠)
  const m = /^([A-Z]+)(\d+)$/.exec(a)
  return [si, +m[2], 열번호(m[1])]
}
const 값 = (p, a) => p.evaluate(([si, r, c]) => { const v = window.__격자.책.값(si, r, c); return v && v.e ? { 오류: v.e } : v }, a)
const 넣기 = (p, a, v) => p.evaluate(([[si, r, c], v]) => { window.__격자.책.넣기(si, r, c, v === '__처음' ? undefined : v) }, [a, v === undefined ? '__처음' : v])
const 값은 = async (p, 시트, 열쇠) => 값(p, 키(시트, 열쇠))
const 넣음 = async (p, 시트, 열쇠, v) => { await 넣기(p, 키(시트, 열쇠), v); await p.waitForTimeout(40) }
const 일련 = (y, m, d) => Math.round((Date.UTC(y, m - 1, d) - Date.UTC(1899, 11, 30)) / 86400000)
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
  await p.evaluate(([cx, cy]) => { window.scrollBy(0, cy - innerHeight * 0.33) }, [bx.x + (상자.x + 상자.w / 2) * 비, bx.y + (상자.y + 상자.h / 2) * 비])
  await p.waitForTimeout(250)
  bx = await cv.boundingBox()
  await p.mouse.click(bx.x + (상자.x + 상자.w / 2) * 비, bx.y + (상자.y + 상자.h / 2) * 비)
  await p.waitForTimeout(200)
}
async function 쳐넣기(p, 시트, 열쇠, 글) {
  await 칸누르기(p, 시트, 열쇠)
  const 입 = p.locator('.gx-ed-r .fw-in').first()
  await 입.fill(글)
  await p.keyboard.press('Enter')
  await p.waitForTimeout(150)
}

console.log('① 서식 탭 · 찾기 (폰 390)')
{
  const { ctx, p, 오류 } = await 새쪽(390, 844)
  await p.goto(BASE + '/forms', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('input[placeholder*="서식 찾기"]', { timeout: 15000 })
  await p.waitForTimeout(500)
  const 링크 = await p.evaluate((s) => [...document.querySelectorAll('a')].filter((a) => (a.getAttribute('href') || '').endsWith('/forms/' + s)).length, SLUG)
  ok('서식 탭에 «한중 콘크리트 양생일지» 카드(링크)', 링크 > 0, 링크)
  for (const 말 of ['한중 콘크리트 양생일지', '양생일지', '갈탄', '보온양생']) {
    await p.fill('input[placeholder*="서식 찾기"]', 말)
    await p.waitForTimeout(500)
    ok(`«${말}» 찾으면 나옴`, await p.evaluate(() => /한중 콘크리트 양생일지/.test(document.querySelector('main').innerText)))
  }
  ok('폰 390 넘침 0 · 오류 0', (await 넘침(p)) <= 1 && !오류.length, [await 넘침(p), 오류])
  await ctx.close()
}

console.log('② 서식 화면 (PC 1280)')
{
  const { ctx, p, 오류 } = await 새쪽(1280, 900, false)
  await 종이(p)
  const 캔 = await p.evaluate(() => document.querySelectorAll('canvas.gx-page').length)
  ok(`종이 쪽 수 = 판짜기(${쪽수}) · 시트 3`, 캔 === 쪽수 && DOC.sheets.length === 3, [캔, DOC.sheets.length])
  /* 탭 제목은 미리 구운 쪽(prerender — 깃허브에서 구움)의 <title> 을 읽음 → 구운 쪽이 있을 때만 봄(흉내 판에는 없음) */
  const 구운 = await (await p.request.get(BASE + '/forms/' + SLUG + '.html').catch(() => null))?.text?.().catch(() => '') || ''
  if (/<title>[^<]*한중 콘크리트 양생일지/.test(구운)) ok('탭 제목에 «한중 콘크리트 양생일지»', /한중 콘크리트 양생일지/.test(await p.title()), await p.title())
  else console.log('  · 탭 제목 — 미리 구운 쪽 없음(흉내 판) · 사이트에서 따로 봄')
  const 본문 = await p.evaluate(() => document.querySelector('main').innerText)
  for (const t of ['KCS 14 20 40', '제618조', '적정공기', '5 ℃ 이상', '제619조의2']) ok(`근거 «${t}» 보임`, 본문.includes(t))
  ok('«무료» · «클로드» 안 씀 · [ ]( ) 꼴 안 보임', !/무료|클로드/.test(본문) && !/\]\(\/forms\//.test(본문))
  const 엑셀 = await p.evaluate((s) => [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')).filter((h) => h.endsWith('/forms/' + s + '.xlsx')).length, SLUG)
  const r = await p.request.get(BASE + '/forms/' + SLUG + '.xlsx')
  const 몸 = await r.body()
  ok('엑셀 받기 없음(새 서식 — 그림 PDF 만)', 엑셀 === 0 && !(몸[0] === 0x50 && 몸[1] === 0x4b), [엑셀, r.status()])
  ok('📄 PDF 저장 단추', (await p.locator('button', { hasText: 'PDF 저장' }).count()) > 0)
  const 다음 = await p.evaluate(() => [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')))
  ok('다음 서류 — 한중 · 서중 시공계획서 · 양생 관리대장', 다음.includes('/forms/hanjung-seojung') && 다음.includes('/forms/yangsaeng'))
  for (const s of ['hanjung-seojung', 'yangsaeng']) {
    await 종이(p, s)
    ok(`되돌아오는 링크 — /forms/${s} → 양생일지`, await p.evaluate((x) => [...document.querySelectorAll('a[href]')].some((a) => a.getAttribute('href') === '/forms/' + x), SLUG))
  }
  await 종이(p)

  console.log('③ ✍ 예시 채우기 → 자동 칸')
  await p.locator('button', { hasText: '예시 채우기' }).click()
  await p.waitForTimeout(400)
  const 모든값 = await p.evaluate(() => { const g = window.__격자; const out = []; g.doc.sheets.forEach((s, si) => { for (const x of s.cells) if (x[5] === 2 || x[5] === 3) { const v = g.책.값(si, x[0], x[1]); out.push(v && v.e ? '#' + v.e : v) } }); return out })
  ok('오류 칸 0', !모든값.filter((v) => typeof v === 'string' && v.startsWith('#')).length)
  ok('그날 최저 8.5 · 넷째 날 ⚠ 5 ℃ 밑', (await 값은(p, '양생일지', '최저#1')) === 8.5 && (await 값은(p, '양생일지', '판#4')) === '⚠ 5 ℃ 밑', [await 값은(p, '양생일지', '최저#1'), await 값은(p, '양생일지', '판#4')])
  ok('기록 7일 · 5 ℃ 밑 1일 · 0 ℃ 밑 0일', (await 값은(p, '양생일지', '기록')) === '기록 7일 · 5 ℃ 밑 1일 · 0 ℃ 밑 0일', await 값은(p, '양생일지', '기록'))
  ok('처음 3일 ✓ · 0 ℃ 밑 예보 4번', (await 값은(p, '양생일지', '처음3일')) === '✓ 처음 3일 모두 5 ℃ 이상' && (await 값은(p, '양생일지', '예보요약')) === '❄ 4번 — 전날 보온 덮개 · 급열 보강을 미리')
  ok('적산온도 118 · 3.9일', (await 값은(p, '적산온도', 'M끝')) === 118 && (await 값은(p, '적산온도', 'Z끝')) === 3.9, [await 값은(p, '적산온도', 'M끝'), await 값은(p, '적산온도', 'Z끝')])
  ok('공시체 4.1 밑 → 5.6 ✓ → 초기양생 끝', (await 값은(p, '적산온도', '공판#1')) === '소요 5 MPa 밑 — 보온 양생 이어서' && /^✓ 소요 강도 이상/.test(await 값은(p, '적산온도', '종료')))
  ok('셋째 날 일산화탄소 35 → ⚠ · 요약 1일 · 확인 6가지', (await 값은(p, '질식예방', '공기#3')) === '⚠ 일산화탄소 — 들어가지 말고 환기' && /^⚠ 적정공기 아닌 날 1일/.test(await 값은(p, '질식예방', '공기요약')) && (await 값은(p, '질식예방', '한요약')) === '✓ 6가지 모두 확인')

  ok('오류 0(PC · 예시)', !오류.length, 오류)
  await ctx.close()
}

console.log('④ 이용자처럼 — 빈 종이(이 기기 저장 지움)')
{
  const { ctx, p, 오류 } = await 새쪽(1280, 900, false)
  await 종이(p)
  await p.evaluate(() => { localStorage.removeItem('kcm.격자') })
  await 종이(p)
  await 넣음(p, '양생일지', '타설일', 일련(2027, 1, 30))
  ok('타설일 1/30 → 날짜 1/31 · 2/6(7일째) · 재령 1 · 7', (await 값은(p, '양생일지', '날짜#1')) === 일련(2027, 1, 31) && (await 값은(p, '양생일지', '날짜#7')) === 일련(2027, 2, 6) && (await 값은(p, '양생일지', '재령#7')) === 7, [await 값은(p, '양생일지', '날짜#1'), await 값은(p, '양생일지', '날짜#7')])
  await 넣음(p, '양생일지', '모#1', 6); await 넣음(p, '양생일지', '중#1', 5); await 넣음(p, '양생일지', '단#1', 7)
  ok('부위 셋 6 · 5 · 7 → 최저 5 · ✓(5 ℃ 이상)', (await 값은(p, '양생일지', '최저#1')) === 5 && (await 값은(p, '양생일지', '판#1')) === '✓')
  await 넣음(p, '양생일지', '중#1', 4.9)
  ok('4.9 → ⚠ 5 ℃ 밑 · 처음 3일 ⚠', (await 값은(p, '양생일지', '판#1')) === '⚠ 5 ℃ 밑' && /^⚠ 처음 3일 가운데 1일/.test(await 값은(p, '양생일지', '처음3일')))
  await 넣음(p, '양생일지', '단#2', -0.5)
  ok('−0.5 → ⚠ 0 ℃ 밑 · 적산 θ + 10 = 9.5', (await 값은(p, '양생일지', '판#2')) === '⚠ 0 ℃ 밑' && (await 값은(p, '적산온도', '기여#2')) === 9.5)
  await 넣음(p, '양생일지', '단#3', -12)
  ok('−12 → 적산 기여 0(0 밑은 0)', (await 값은(p, '적산온도', '기여#3')) === 0)
  const 공 = async (o2, co, co2) => { await 넣음(p, '질식예방', '산소#1', o2); await 넣음(p, '질식예방', 'CO#1', co); await 넣음(p, '질식예방', 'CO2#1', co2); return 값은(p, '질식예방', '공기#1') }
  ok('산소 18 · CO 29 · CO2 1.4 → ✓ 적정공기', (await 공(18, 29, 1.4)) === '✓ 적정공기')
  ok('산소 17.9 → ⚠ 산소', (await 공(17.9, 29, 1.4)) === '⚠ 산소 — 들어가지 말고 환기')
  ok('산소 23.5 → ⚠ 산소(미만이어야)', (await 공(23.5, 0, 0)) === '⚠ 산소 — 들어가지 말고 환기')
  ok('CO 30 → ⚠ 일산화탄소', (await 공(20.9, 30, 0.1)) === '⚠ 일산화탄소 — 들어가지 말고 환기')
  ok('CO2 1.5 → ⚠ 이산화탄소', (await 공(20.9, 5, 1.5)) === '⚠ 이산화탄소 — 들어가지 말고 환기')
  ok('산소 빠짐 → ⚠ 산소를 재야 함', (await 공(undefined, 5, 0.2)) === '⚠ 산소를 재야 함')
  await 넣음(p, '적산온도', '소요', 5); await 넣음(p, '적산온도', '공강도#1', 4.9)
  ok('공시체 4.9 → 밑 · 초기양생 아직', (await 값은(p, '적산온도', '공판#1')) === '소요 5 MPa 밑 — 보온 양생 이어서' && /^아직/.test(await 값은(p, '적산온도', '종료')))
  await 넣음(p, '적산온도', '공강도#1', 5)
  ok('공시체 5 → ✓ 소요 5 MPa 이상', (await 값은(p, '적산온도', '공판#1')) === '✓ 소요 5 MPa 이상')
  /* 마지막 한 칸은 종이에서 — 저절로 남고 · 새로고침해도 그대로 */
  await 쳐넣기(p, '양생일지', '타설부위', '가상 기초 · 벽체')
  ok('타설 부위 쳐 넣음', (await 값은(p, '양생일지', '타설부위')) === '가상 기초 · 벽체', await 값은(p, '양생일지', '타설부위'))
  await p.waitForTimeout(1000)
  await 종이(p)
  ok('새로고침 — 적은 값 그대로(타설일 · 최저 · 공시체)', (await 값은(p, '양생일지', '타설일')) === 일련(2027, 1, 30) && (await 값은(p, '양생일지', '최저#1')) === 4.9 && (await 값은(p, '적산온도', '공판#1')) === '✓ 소요 5 MPa 이상')
  ok('오류 0(PC)', !오류.length, 오류)
  await ctx.close()
}

console.log('⑤ 폰')
for (const w of [390, 360]) {
  const { ctx, p, 오류 } = await 새쪽(w, 800)
  await 종이(p)
  ok(`폰 ${w} — 종이 뜸 · 넘침 0 · 오류 0`, (await p.evaluate(() => document.querySelectorAll('canvas.gx-page').length)) === 쪽수 && (await 넘침(p)) <= 1 && !오류.length, [await 넘침(p), 오류])
  await ctx.close()
}
await b.close()
console.log(`\n${bad ? '✗' : '✓'} 시험_한중일지화면 ${n - bad}/${n}`)
process.exit(bad ? 1 : 0)
