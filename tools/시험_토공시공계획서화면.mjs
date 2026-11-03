/**
 * 🚜 G527 «토공사 시공계획서» 서식 화면 시험 — 구운 사이트(dist + web/public/forms/g)를 띄운 뒤:
 *   node tools/시험_토공시공계획서화면.mjs [주소=http://127.0.0.1:4996]
 *   소장님 「토공사 시공계획서 만들어 줘. 건설맵에」 「잘 만들어 줘. 다른 시공계획서도 참고 해줘. 빠진거 없는지」 「이용자 입장에서 최대한 편하게」(11-03)
 *   ① 서식 탭 ③ 시공계획서 칸에 카드 · 찾기(«토공 시공계획서» · «사토 계획»)로 나옴
 *   ② 서식 화면(PC): 종이 쪽 수 = 판짜기 · 제목 · 근거 6가지 · «무료» · «클로드» 없음 · 빈 틀 엑셀(받는 파일이 엑셀) · PDF 단추
 *   ③ «✍ 예시 채우기» → 자동 칸 값(사토 운반 7,335 · 반입 자연 4,333.33 · 대수 917 · 678 · 1,595 · 하루 42 · 총 공기 46일 · 굴착 요약 · 제출 전 확인)
 *   ④ 이용자처럼 빈 종이에 적기: 토사 깎기 1,000 · 유용 400 · L 1.25 · C 0.90 · 노체 500 · 반입 L · C · 적재량 10
 *      → 유용 다짐 360 · 사토 600 · 사토 운반 750 · 모자란 140 · 반입 자연 155.56 · 반입 운반 194.45 · 대수 75 · 20 · 계 95 · 공정표 수량 1,000 · 500 저절로
 *      굴착: 깊이 3 · 모래 · 1 : 1.5 → ⚠ · 1 : 2.0 → ✓ · 흙막이 있음 → 기술사 확인
 *   ⑤ 폰 390 · 360: 종이 뜸 · 가로 넘침 0 · 오류 0
 * 인터넷 안 부름(파이어베이스 · 광고 · 애널리틱스 막음) · 파일은 받지 않고 주소만 확인.
 */
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { 판짜기 } from '../web/src/lib/격자그림.js'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const BASE = process.argv[2] || 'http://127.0.0.1:4996'
const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const SLUG = 'togong-sigong'
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
async function 종이(p) {
  await p.goto(BASE + '/forms/' + SLUG, { waitUntil: 'domcontentloaded' })
  await p.waitForFunction(() => window.__격자 && document.querySelectorAll('canvas.gx-page').length, null, { timeout: 25000 })
  await p.waitForTimeout(300)
}
/* 칸 찾기 — 격자 JSON 의 이름표(글) 칸 오른쪽 칸 · 미리 적힌 입력칸이 있는 줄 */
const 시트번호 = (이름) => DOC.sheets.findIndex((s) => s.name === 이름)
const 글 = (x) => (x.length > 6 ? x[6] : undefined)
function 오른쪽(시트, 이름표) {
  const si = 시트번호(시트)
  const s = DOC.sheets[si]
  const L = s.cells.find((x) => 글(x) === 이름표)
  if (!L) throw new Error('이름표 없음: ' + 이름표)
  const R = s.cells.find((x) => x[0] === L[0] && x[1] === L[1] + L[3])
  return [si, R[0], R[1]]
}
function 줄(시트, 첫글) {
  const si = 시트번호(시트)
  const s = DOC.sheets[si]
  const L = s.cells.find((x) => 글(x) === 첫글)
  if (!L) throw new Error('줄 없음: ' + 첫글)
  return s.cells.filter((x) => x[0] === L[0] && x[1] >= L[1]).sort((a, c) => a[1] - c[1]).map((x) => [si, x[0], x[1]])
}
function 머리아래(시트, 머리글, k = 1) {
  const si = 시트번호(시트)
  const s = DOC.sheets[si]
  const H = s.cells.find((x) => 글(x) === 머리글)
  const r = H[0] + H[2] - 1 + k
  return s.cells.filter((x) => x[0] === r).sort((a, c) => a[1] - c[1]).map((x) => [si, x[0], x[1]])
}
const 값 = (p, a) => p.evaluate(([si, r, c]) => { const v = window.__격자.책.값(si, r, c); return v && v.e ? { 오류: v.e } : v }, a)
const 넣기 = (p, a, v) => p.evaluate(([[si, r, c], v]) => { window.__격자.책.넣기(si, r, c, v) }, [a, v])
const 가까움 = (a, b) => typeof a === 'number' && Math.abs(a - b) < 1e-6

console.log('① 서식 탭 · 찾기 (폰 390)')
{
  const { ctx, p, 오류 } = await 새쪽(390, 844)
  await p.goto(BASE + '/forms', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('input[placeholder*="서식 찾기"]', { timeout: 15000 })
  await p.waitForTimeout(500)
  const 링크 = await p.evaluate((s) => [...document.querySelectorAll('a')].filter((a) => (a.getAttribute('href') || '').endsWith('/forms/' + s)).length, SLUG)
  ok('서식 탭에 «토공사 시공계획서» 카드(링크)', 링크 > 0, 링크)
  for (const 말 of ['토공 시공계획서', '사토 계획', '흙깎기 흙쌓기']) {
    await p.fill('input[placeholder*="서식 찾기"]', 말)
    await p.waitForTimeout(500)
    const 있음 = await p.evaluate(() => /토공사 시공계획서/.test(document.querySelector('main').innerText))
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
  ok(`종이 쪽 수 = 판짜기(${쪽수})`, 캔 === 쪽수, 캔)
  ok('탭 제목에 «토공사 시공계획서»', /토공사 시공계획서/.test(await p.title()), await p.title())
  const 본문 = await p.evaluate(() => document.querySelector('main').innerText)
  for (const t of ['별표 11', '제38조', '별표 14', '제22조', '제101조의2', '제91조']) ok(`근거 «${t}» 보임`, 본문.includes(t))
  ok('새 서식 — «무료» 안 씀', !/무료/.test(본문), (본문.match(/.{0,20}무료.{0,20}/) || [''])[0])
  ok('«클로드» 안 씀', !/클로드/.test(본문))
  const 엑셀 = await p.evaluate((s) => [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')).filter((h) => h.endsWith('/forms/' + s + '.xlsx')).length, SLUG)
  ok('빈 틀 엑셀 받기 링크', 엑셀 > 0, 엑셀)
  const r = await p.request.get(BASE + '/forms/' + SLUG + '.xlsx')
  const 몸 = await r.body()
  ok('받는 파일이 엑셀(zip · 시트 7장)', r.status() === 200 && 몸[0] === 0x50 && 몸[1] === 0x4b && (몸.toString('latin1').match(/xl\/worksheets\/sheet\d+\.xml/g) || []).length >= 7, [r.status(), 몸.length])
  ok('📄 PDF 저장 단추', (await p.locator('button', { hasText: 'PDF 저장' }).count()) > 0)

  console.log('③ ✍ 예시 채우기 → 자동 칸')
  await p.locator('button', { hasText: '예시 채우기' }).click()
  await p.waitForTimeout(300)
  const 모든값 = await p.evaluate(() => { const g = window.__격자; const out = []; g.doc.sheets.forEach((s, si) => { for (const x of s.cells) if (x[5] === 2 || x[5] === 3) { const v = g.책.값(si, x[0], x[1]); out.push(v && v.e ? '#' + v.e : v) } }); return out })
  const 오류칸 = 모든값.filter((v) => typeof v === 'string' && v.startsWith('#'))
  ok('오류 칸 0', !오류칸.length, 오류칸.slice(0, 5))
  for (const [이름, v] of [['사토 운반 합 7,335', 7335], ['반입 자연 4,333.33', 4333.33], ['반입 운반 5,416.66', 5416.66], ['사토 대수 917', 917], ['반입 대수 678', 678],
    ['대수 계 1,595', 1595], ['하루 평균 42', 42], ['총 공기 46일', 46]]) ok(이름, 모든값.some((x) => 가까움(x, v)))
  for (const t of ['반입(순성토) 필요 — 모자란 양을 승인 토취장에서', '굴착면 높이 2 m 이상 4곳 → «굴착 작업계획서» 필요 · ⚠ 확인할 구간 1곳',
    '⚠ 기준(1 : 1.8)보다 급함 — 완만하게 · 흙막이', '흙막이 2 m 이상 — 구조 안전성 확인(기술사)', '✓ 사전조사 4가지 끝', '✓ 10가지 모두 넣음', '✓ 10가지 모두 넣음 — 제출']) ok(`«${t}»`, 모든값.includes(t))
  ok('점검표 결과 «× 1 · 해당 없음 1 → ⚠»', 모든값.some((x) => typeof x === 'string' && x.startsWith('○ 10 · × 1 · 해당 없음 1') && x.includes('⚠ × 항목을 고친 뒤 다시 점검')))
  ok('오류 0(PC · 예시)', !오류.length, 오류)
  await ctx.close()
}

console.log('④ 이용자처럼 빈 종이에 적기 (PC)')
{
  const { ctx, p, 오류 } = await 새쪽(1280, 900, false)
  await 종이(p)
  const 토사 = 줄('개요', '토    사')            // [토질, 깎기, L, C, 유용, 유용다짐, 사토, 사토운반]
  const 노체 = 줄('개요', '노 체 쌓 기')          // [구분, 쌓기량, 비고]
  await 넣기(p, 토사[1], 1000); await 넣기(p, 토사[2], 1.25); await 넣기(p, 토사[3], 0.9); await 넣기(p, 토사[4], 400)
  await 넣기(p, 노체[1], 500)
  await 넣기(p, 오른쪽('개요', '반입토 변화율 L'), 1.25); await 넣기(p, 오른쪽('개요', '반입토 변화율 C'), 0.9)
  await 넣기(p, 오른쪽('개요', '1대 적재량'), 10)
  ok('유용 → 다짐 360', 가까움(await 값(p, 토사[5]), 360), await 값(p, 토사[5]))
  ok('사토 600', 가까움(await 값(p, 토사[6]), 600), await 값(p, 토사[6]))
  ok('사토 운반 750', 가까움(await 값(p, 토사[7]), 750), await 값(p, 토사[7]))
  ok('모자란 양 140', 가까움(await 값(p, 오른쪽('개요', '모자란 양 (다짐 ㎥)')), 140), await 값(p, 오른쪽('개요', '모자란 양 (다짐 ㎥)')))
  ok('반입 자연 155.56', 가까움(await 값(p, 오른쪽('개요', '반입(순성토) 자연 ㎥')), 155.56), await 값(p, 오른쪽('개요', '반입(순성토) 자연 ㎥')))
  const 반입운반 = 오른쪽('개요', '반입 운반 (흐트러진 ㎥)')
  ok('반입 운반 194.45', 가까움(await 값(p, 반입운반), 194.45), await 값(p, 반입운반))
  ok('판정 «반입 필요»', (await 값(p, [반입운반[0], 반입운반[1], 반입운반[2] + 3])) === '반입(순성토) 필요 — 모자란 양을 승인 토취장에서', await 값(p, [반입운반[0], 반입운반[1], 반입운반[2] + 3]))
  ok('사토 대수 75', 가까움(await 값(p, 오른쪽('개요', '사토 운반 대수')), 75), await 값(p, 오른쪽('개요', '사토 운반 대수')))
  ok('반입 대수 20 (19.4 올림)', 가까움(await 값(p, 오른쪽('개요', '반입 운반 대수')), 20), await 값(p, 오른쪽('개요', '반입 운반 대수')))
  ok('대수 계 95', 가까움(await 값(p, 오른쪽('개요', '대 수 계')), 95), await 값(p, 오른쪽('개요', '대 수 계')))
  ok('하루 평균은 운반 일수를 적어야(빈칸)', (await 값(p, 오른쪽('개요', '하루 평균'))) === '', await 값(p, 오른쪽('개요', '하루 평균')))
  const 반입토 = 줄('개요', '반입토(순성토)')
  ok('자재표 반입토 수량 155.56 저절로', 가까움(await 값(p, 반입토[2]), 155.56), await 값(p, 반입토[2]))
  const 깎기줄 = 줄('공정표', '흙깎기 (토사)'), 노체줄 = 줄('공정표', '흙쌓기 · 다짐 (노체)'), 운반줄 = 줄('공정표', '유용 · 사토 · 반입 운반')
  ok('공정표 흙깎기 수량 1,000 저절로', 가까움(await 값(p, 깎기줄[1]), 1000), await 값(p, 깎기줄[1]))
  ok('공정표 노체 수량 500 저절로', 가까움(await 값(p, 노체줄[1]), 500), await 값(p, 노체줄[1]))
  ok('공정표 운반 수량 944.45 (750 + 194.45)', 가까움(await 값(p, 운반줄[1]), 944.45), await 값(p, 운반줄[1]))
  await 넣기(p, 깎기줄[3], 100); await 넣기(p, 깎기줄[5], 3)
  ok('흙깎기 1일 100 · 3일차 → 10일 · 12일차', 가까움(await 값(p, 깎기줄[4]), 10) && 가까움(await 값(p, 깎기줄[6]), 12), [await 값(p, 깎기줄[4]), await 값(p, 깎기줄[6])])
  const 굴 = 머리아래('굴착안전', '굴 착 구 간')     // [구간, 깊이, 지반, 기울, 막이, 기준, 수평, 판정]
  await 넣기(p, 굴[0], '시험 터파기'); await 넣기(p, 굴[1], 3); await 넣기(p, 굴[2], '모래'); await 넣기(p, 굴[3], 1.5); await 넣기(p, 굴[4], '없음')
  ok('모래 기준 1.8 · 수평 4.5', 가까움(await 값(p, 굴[5]), 1.8) && 가까움(await 값(p, 굴[6]), 4.5), [await 값(p, 굴[5]), await 값(p, 굴[6])])
  ok('1 : 1.5 → ⚠ 급함', (await 값(p, 굴[7])) === '⚠ 기준(1 : 1.8)보다 급함 — 완만하게 · 흙막이', await 값(p, 굴[7]))
  await 넣기(p, 굴[3], 2)
  ok('1 : 2.0 → ✓', (await 값(p, 굴[7])) === '✓ 기준보다 완만(같음 포함)', await 값(p, 굴[7]))
  await 넣기(p, 굴[4], '있음')
  ok('흙막이 있음 · 3 m → 기술사 확인', (await 값(p, 굴[7])) === '흙막이 2 m 이상 — 구조 안전성 확인(기술사)', await 값(p, 굴[7]))
  ok('오류 0(PC · 적기)', !오류.length, 오류)
  await ctx.close()
}

console.log('⑤ 폰 390 · 360')
for (const [w, h] of [[390, 844], [360, 740]]) {
  const s = await 새쪽(w, h)
  await 종이(s.p)
  ok(`폰 ${w} 종이 뜸`, (await s.p.evaluate(() => document.querySelectorAll('canvas.gx-page').length)) === 쪽수)
  ok(`폰 ${w} 넘침 0`, (await 넘침(s.p)) <= 1, await 넘침(s.p))
  ok(`폰 ${w} 오류 0`, !s.오류.length, s.오류)
  await s.ctx.close()
}
await b.close()
console.log(`\n${bad ? '✗' : '✓'} 시험_토공시공계획서화면 ${n - bad}/${n}`)
process.exit(bad ? 1 : 0)
