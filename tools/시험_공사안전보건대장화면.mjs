/**
 * 🦺 G538 «공사안전보건대장»(건설공사 안전보건대장의 작성 등에 관한 고시 별지 제3호서식) 서식 화면 시험 — 구운 사이트를 띄운 뒤:
 *   node tools/시험_공사안전보건대장화면.mjs [주소=http://127.0.0.1:4996]
 *   소장님 «도구화 후보» ② · 「원본 그대로」 · 「빠짐없이 기록하고 사이트에 작업하게 하고 … 계속 사이트 찾게 해야 해」(11-04)
 *   ① 서식 탭 ② 착공 카드 · «착공할 때» 꾸러미 · 찾기(«공사안전보건대장» · «안전보건대장» · «이행 확인» · «장비 배치»)
 *   ② 서식 화면(PC): 쪽 수 = 판짜기 · 제목 · 근거(제67조 · 제55조 · 제86조 · 제2024-35호) · «무료» · «클로드» 없음 · 빈 틀 엑셀(시트 12) · PDF 단추 ·
 *      다음에 쓸 서류 링크(설계안전보건대장 · 유해위험방지계획서) · «3.» 네 칸은 사진(그림) 칸 · 이행계획 칸은 글 칸
 *   ③ «✍ 예시 채우기»(68억 5천만 원 · 착공 2026. 12. 2.) → 판정 · 제출 기한(화) · 확인 날짜 넷(준공 전 마지막) · 사업 개요 · ■ 예 · 오늘 기준 남은 날 ·
 *      «3.» 네 칸에 장비마다 다른 배치도(타워 빨강 · 펌프카 · 이동식크레인 주황 · 항타 흙막이 갈색) → 설계안전보건대장으로 갔다가 되돌아오는 링크
 *   ④ 이용자처럼: 다른 서식에 쓴 8칸(착공 · 준공 · 공사명 · 주소 · 발주자 · 회사 · 대표 · 전화)이 먼저 · 판정(50억 경계 · 나뉜 총액 · 분리 발주) ·
 *      종이 칸 눌러 적기 · «□ 예 □ 아니오» 고르기 · 3개월 안에 끝나는 공사 · 준공 < 착공 · 오늘 기준(남은 날 · 0일 · 지남 · 다음 확인 · 준공 끝) ·
 *      제출 전 확인 · 새로고침 그대로 · 여기 쓴 공사명이 다른 서식에 먼저 · 안전 화면 ④ 링크
 *   ⑤ 폰 390 · 360: 종이 뜸 · 가로 넘침 0 · 사진 칸 · 오류 0
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
const BASE = process.argv[2] || 'http://127.0.0.1:4996'
const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const SLUG = 'gongsa-anjeon-daejang'
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
const 일련 = (y, m, d) => Math.round((Date.UTC(y, m - 1, d) - Date.UTC(1899, 11, 30)) / 86400000)
const 날 = (s) => { const t = new Date(Date.UTC(1899, 11, 30) + s * 86400000); return [t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate(), t.getUTCDay()] }
const 날글 = (s) => { const [y, m, d] = 날(s); return `${y}. ${m}. ${d}.` }
const 요일 = (s) => '일월화수목금토'[날(s)[3]]
/** 엑셀 EDATE — 달을 더하고 말일은 그 달 끝으로 */
const 달더함 = (s, k) => { const [y, m, d] = 날(s); const t = new Date(Date.UTC(y, m - 1 + k, 1)); const 끝 = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0)).getUTCDate(); return 일련(t.getUTCFullYear(), t.getUTCMonth() + 1, Math.min(d, 끝)) }
const 오늘 = (() => { const t = new Date(Date.now() + 9 * 3600e3); return 일련(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate()) })()
const 쉼 = (v) => v.toLocaleString('en-US')
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
const 이름칸 = (p) => p.locator('.gx-ed-n').innerText().catch(() => '')
/* 칸 안 그림 색 — [종이 % · 빨강 · 주황(장비 몸) · 갈색(흙막이) · 파랑(이동 경로)] (칸 가장자리 5 % 뺌) */
async function 칸색(p, 시트, 열쇠, 안 = 0.05) {
  const [si, r, c] = 키(시트, 열쇠)
  const s = DOC.sheets[si]
  const x = s.cells.find((q) => q[0] === r && q[1] === c)
  const 판 = 판짜기(s)
  const pi = 칸쪽(판, r)
  const 상자 = 칸상자(판, pi, x)
  const cv = p.locator(`#gx-s${si} canvas.gx-page`).nth(pi)
  await cv.scrollIntoViewIfNeeded()
  await p.waitForTimeout(900)
  return cv.evaluate((el, [bb, W, m]) => {
    const k = el.width / W
    const x0 = Math.round((bb.x + bb.w * m) * k), y0 = Math.round((bb.y + bb.h * m) * k), w = Math.max(1, Math.round(bb.w * (1 - 2 * m) * k)), h = Math.max(1, Math.round(bb.h * (1 - 2 * m) * k))
    const d = el.getContext('2d').getImageData(x0, y0, w, h).data
    const 가깝 = (i, r, g2, b2, t = 14) => Math.abs(d[i] - r) <= t && Math.abs(d[i + 1] - g2) <= t && Math.abs(d[i + 2] - b2) <= t
    let 종 = 0, 빨 = 0, 주 = 0, 갈 = 0, 파 = 0
    for (let i = 0; i < d.length; i += 4) {
      if (가깝(i, 245, 242, 234, 10)) 종++      // 예시 그림 종이색 #f5f2ea
      if (가깝(i, 220, 38, 38)) 빨++            // 타워크레인 · 작업반경 #dc2626
      if (가깝(i, 245, 158, 11)) 주++           // 장비 몸 #f59e0b
      if (가깝(i, 146, 64, 14)) 갈++            // 흙막이 #92400e
      if (가깝(i, 37, 99, 235)) 파++            // 이동 경로 #2563eb
    }
    const 몫 = (v) => +(v / (d.length / 4) * 100).toFixed(2)
    return [몫(종), 몫(빨), 몫(주), 몫(갈), 몫(파)]
  }, [상자, 판.W, 안])
}
async function 쳐넣기(p, 시트, 열쇠, 글) {
  await 칸누르기(p, 시트, 열쇠)
  const 입 = p.locator('.gx-ed-r .fw-in').first()
  await 입.fill(글)
  await p.keyboard.press('Enter')
  await p.waitForTimeout(150)
}
const 대상50 = '✓ 작성 대상 — 총공사금액 50억 원 이상(시행령 제55조)', 미만 = '대상 아님 — 총공사금액 50억 원 미만(시행령 제55조)'
const 개대상 = '✓ 작성 대상 — 개별 공사금액 50억 원 이상(고시 제3조 ②)', 개미만 = '대상 아님 — 개별 공사금액 50억 원 미만(고시 제3조 ②)', 개빈 = '⚠ 개별 공사금액을 적으세요'
const 분리 = ' · 나눈 공사마다 각각 씀(통합해 써도 됨 · 고시 제4조)'
const 기한글 = (착) => `착공 전날 ${날글(착 - 1)}(${요일(착 - 1)})까지 발주자에게 제출`
const 예 = '■ 예          □ 아니오', 아니오 = '□ 예          ■ 아니오', 빈예 = '□ 예          □ 아니오'

console.log('① 서식 탭 · 찾기 (폰 390)')
{
  const { ctx, p, 오류 } = await 새쪽(390, 844)
  await p.goto(BASE + '/forms', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('input[placeholder*="서식 찾기"]', { timeout: 15000 })
  await p.waitForTimeout(500)
  const 링크 = await p.evaluate((s) => [...document.querySelectorAll('a')].filter((a) => (a.getAttribute('href') || '').endsWith('/forms/' + s)).length, SLUG)
  ok('서식 탭에 «공사안전보건대장» 카드(링크)', 링크 > 0, 링크)
  ok('«착공할 때» 꾸러미 — «총공사금액 50억 원 이상 · 착공 전날까지»', await p.evaluate(() => /공사안전보건대장 — 총공사금액 50억 원 이상 · 착공 전날까지/.test(document.querySelector('main').textContent)))
  for (const 말 of ['공사안전보건대장', '안전보건대장', '이행 확인', '장비 배치']) {
    await p.fill('input[placeholder*="서식 찾기"]', 말)
    await p.waitForTimeout(500)
    const 있음 = await p.evaluate(() => /공사안전보건대장/.test(document.querySelector('main').innerText))
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
  ok('탭 제목에 «공사안전보건대장»', /공사안전보건대장/.test(await p.title()), await p.title())
  const 본문 = await p.evaluate(() => document.querySelector('main').innerText)
  for (const t of ['제67조', '제55조', '제86조', '제2024-35호', '착공 전날', '3개월', '별지 제3호서식']) ok(`근거 «${t}» 보임`, 본문.includes(t))
  ok('새 서식 — «무료» 안 씀', !/무료/.test(본문), (본문.match(/.{0,20}무료.{0,20}/) || [''])[0])
  ok('«클로드» 안 씀', !/클로드/.test(본문))
  ok('글에 [ ]( ) 꼴이 그대로 안 보임', !/\]\(\/forms\//.test(본문))
  const 엑셀 = await p.evaluate((s) => [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')).filter((h) => h.endsWith('/forms/' + s + '.xlsx')).length, SLUG)
  ok('빈 틀 엑셀 받기 링크', 엑셀 > 0, 엑셀)
  const r = await p.request.get(BASE + '/forms/' + SLUG + '.xlsx')
  const 몸 = await r.body()
  ok('받는 파일이 엑셀(zip · 시트 12장)', r.status() === 200 && 몸[0] === 0x50 && 몸[1] === 0x4b && (몸.toString('latin1').match(/xl\/worksheets\/sheet\d+\.xml/g) || []).length >= 12, [r.status(), 몸.length])
  ok('📄 PDF 저장 단추', (await p.locator('button', { hasText: 'PDF 저장' }).count()) > 0)
  const 다음 = await p.evaluate(() => [...document.querySelectorAll('.flist a.flink[href]')].map((a) => [a.getAttribute('href'), a.textContent.trim()]))
  ok('«놓치기 쉬운 것» 에 설계안전보건대장 링크', 다음.some(([h, t]) => h === '/forms/seolgye-anjeon-daejang' && t === '설계안전보건대장'), 다음)
  ok('«놓치기 쉬운 것» 에 유해위험방지계획서 링크', 다음.some(([h, t]) => h === '/forms/yuhae-gyehoek' && t === '유해위험방지계획서'), 다음)
  for (const [시트, 열쇠, 말] of [['기타장비', '타워', '1) 타워크레인'], ['기타장비', '펌프', '2) 콘크리트 펌프카'], ['장비확인자', '이동크', '3) 이동식크레인'], ['장비확인자', '항타', '4) 항타·항발기']]) {
    await 칸누르기(p, 시트, 열쇠)
    ok(`«${말} …» 칸을 누르면 «📷 사진 고르기»(대지 평면도)`, await p.evaluate(() => !!document.querySelector('.gx-ed-ph')), await 이름칸(p))
  }
  await 칸누르기(p, '기타장비', '기감#1')
  ok('«시공단계 위험성 감소방안» 칸은 글 칸(사진 아님)', await p.evaluate(() => !document.querySelector('.gx-ed-ph') && !!document.querySelector('.gx-ed-r .fw-in')), await 이름칸(p))

  console.log('③ ✍ 예시 채우기 → 자동 칸 · 장비 배치도')
  await p.locator('button', { hasText: '예시 채우기' }).click()
  await p.waitForTimeout(300)
  const 모든값 = await p.evaluate(() => { const g = window.__격자; const out = []; g.doc.sheets.forEach((s, si) => { for (const x of s.cells) if (x[5] === 2 || x[5] === 3) { const v = g.책.값(si, x[0], x[1]); out.push(v && v.e ? '#' + v.e : v) } }); return out })
  const 오류칸 = 모든값.filter((v) => typeof v === 'string' && v.startsWith('#'))
  ok('오류 칸 0', !오류칸.length, 오류칸.slice(0, 5))
  ok('총공사금액 «68억 5,000만 원» · 판정 «✓ 작성 대상 — 50억 원 이상»', (await 값은(p, '판정', '총금액말')) === '68억 5,000만 원' && (await 값은(p, '판정', '대상판정')) === 대상50, [await 값은(p, '판정', '총금액말'), await 값은(p, '판정', '대상판정')])
  const 착예 = 일련(2026, 12, 2), 준예 = 일련(2027, 11, 26)
  ok('제출 기한 «착공 전날 2026. 12. 1.(화)까지 발주자에게 제출»', (await 값은(p, '판정', '제출기한')) === '착공 전날 2026. 12. 1.(화)까지 발주자에게 제출' && 기한글(착예) === '착공 전날 2026. 12. 1.(화)까지 발주자에게 제출', await 값은(p, '판정', '제출기한'))
  const 확예 = []
  for (let k = 1; k <= 5; k++) 확예.push([await 값은(p, '판정', `확인날#${k}`), await 값은(p, '판정', `확인말#${k}`)])
  ok('이행 확인 3. 2. · 6. 2. · 9. 2. · 준공 11. 26.(마지막) · 다섯째 없음', JSON.stringify(확예) === JSON.stringify([[일련(2027, 3, 2), '착공 뒤 3개월 되는 날'], [일련(2027, 6, 2), '착공 뒤 6개월 되는 날'], [일련(2027, 9, 2), '착공 뒤 9개월 되는 날'], [준예, '준공 전에 마지막 확인'], ['', '']]), 확예)
  ok('사업 개요 — 공사금액 6,850,000,000 · 공사기간 «2026. 12. 2. ~ 2027. 11. 26.»', (await 값은(p, '사업개요', '공사금액')) === 6850000000 && (await 값은(p, '사업개요', '공사기간표시')) === '2026. 12. 2. ~ 2027. 11. 26.', [await 값은(p, '사업개요', '공사금액'), await 값은(p, '사업개요', '공사기간표시')])
  ok('유해위험방지계획서 «■ 예» · 기술지도계약 «■ 아니오»(원본 □ · ■)', (await 값은(p, '사업개요', '위방대상')) === 예 && (await 값은(p, '사업개요', '기술지도')) === 아니오)
  const 남 = 일련(2026, 12, 1) - 오늘
  ok('확인 장 — 판정 · 기한이 앞 장과 같음', (await 값은(p, '확인', '확판정')) === 대상50 && (await 값은(p, '확인', '확기한')) === 기한글(착예))
  ok(`오늘 기준 «${남 >= 0 ? `제출 기한까지 ${쉼(남)}일 남음` : '⚠ 착공 전날이 지났습니다'}»`, (await 값은(p, '확인', '오늘제출')) === (남 >= 0 ? `제출 기한까지 ${쉼(남)}일 남음` : '⚠ 착공 전날이 지났습니다 — 냈는지 확인 · 안 냈으면 바로'), await 값은(p, '확인', '오늘제출'))
  const 다음날 = [일련(2027, 3, 2), 일련(2027, 6, 2), 일련(2027, 9, 2), 준예].find((d) => d >= 오늘)
  ok('다음 이행 확인(오늘 기준)', (await 값은(p, '확인', '다음확인')) === `${날글(다음날)} 전에 1회 이상 — 오늘부터 ${쉼(다음날 - 오늘)}일`, await 값은(p, '확인', '다음확인'))
  ok('제출 전 확인 «✓ 8가지 모두 확인 — 제출»', (await 값은(p, '확인', '제출요약')) === '✓ 8가지 모두 확인 — 제출', await 값은(p, '확인', '제출요약'))
  await p.waitForFunction(() => /사진 4장을 넣었습니다/.test(document.body.innerText), null, { timeout: 20000 }).catch(() => {})
  ok('예시 채우기 → «📷 사진 4장을 넣었습니다»', /사진 4장을 넣었습니다/.test(await p.evaluate(() => document.body.innerText)))
  const 타 = await 칸색(p, '기타장비', '타워'), 펌 = await 칸색(p, '기타장비', '펌프'), 이 = await 칸색(p, '장비확인자', '이동크'), 항 = await 칸색(p, '장비확인자', '항타')
  console.log('     [종이 · 빨강 · 주황 · 갈색 · 파랑 %]', JSON.stringify({ 타, 펌, 이, 항 }))
  ok('네 칸 모두 대지 평면도 그림(종이색 30 % 넘음 — 흰 빈칸 · 현장 사진 아님)', [타, 펌, 이, 항].every((c) => c[0] >= 30), [타[0], 펌[0], 이[0], 항[0]])
  ok('1) 타워크레인 칸 = 타워크레인 그림(빨강 있음 · 장비 몸 주황 없음 · 이동 경로 없음)', 타[1] > 0.05 && 타[2] < 0.02 && 타[4] < 0.02, 타)
  ok('2) 펌프카 칸 = 펌프카 그림(주황 몸 · 이동 경로 파랑 · 빨강 없음)', 펌[2] > 0.05 && 펌[4] > 0.05 && 펌[1] < 0.02, 펌)
  ok('3) 이동식크레인 칸 = 이동식크레인 그림(주황 몸 · 작업반경 빨강 · 이동 경로)', 이[2] > 0.05 && 이[1] > 0.02 && 이[4] > 0.05, 이)
  ok('4) 항타·항발기 칸 = 항타 그림(흙막이 갈색이 다른 그림보다 훨씬 많음 · 이동 경로)', 항[3] > 2 * Math.max(타[3], 펌[3], 이[3]) && 항[4] > 0.05, 항)
  ok('오류 0(PC · 예시)', !오류.length, 오류)
  await p.locator('.flist a[href="/forms/seolgye-anjeon-daejang"]').first().click()
  await p.waitForURL(/\/forms\/seolgye-anjeon-daejang$/, { timeout: 10000 })
  await p.waitForTimeout(600)
  ok('설계안전보건대장으로 감 → 거기서 이 서식으로 오는 링크', await p.evaluate((s) => [...document.querySelectorAll('.flist a[href]')].some((a) => a.getAttribute('href') === '/forms/' + s), SLUG))
  ok('오류 0(다음 서류)', !오류.length, 오류)
  await ctx.close()
}

console.log('④ 이용자처럼 빈 종이에 적기 (PC) — 다른 서식에 쓴 값이 먼저 들어옴')
{
  const { ctx, p, 오류 } = await 새쪽(1280, 900, false)
  await 종이(p)
  await p.evaluate(() => { localStorage.removeItem('kcm.격자'); localStorage.removeItem('kcm.서식공통') })
  await 종이(p)
  ok('아무것도 안 적으면 판정 · 기한 · 확인 날짜 · 공사금액 · 기간 빈칸', (await 값은(p, '판정', '대상판정')) === '' && (await 값은(p, '판정', '제출기한')) === '' && (await 값은(p, '판정', '확인날#1')) === '' &&
    (await 값은(p, '사업개요', '공사금액')) === '' && (await 값은(p, '사업개요', '공사기간표시')) === '' && (await 값은(p, '확인', '다음확인')) === '' && (await 값은(p, '확인', '제출요약')) === '')
  ok('빈 종이 «□ 예 □ 아니오»(원본 그대로)', (await 값은(p, '사업개요', '위방대상')) === 빈예 && (await 값은(p, '사업개요', '기술지도')) === 빈예)
  await p.evaluate((공) => { localStorage.removeItem('kcm.격자'); localStorage.setItem('kcm.서식공통', JSON.stringify(공)) },
    { 현장: '시험 복합청사 신축공사', 회사: '시험건설(주)', 대표: '김시험', 발주: '시험시', 착공: '2027-01-04', 준공: '2028-06-30', 위치: '시험시 가동 1', 연락처: '000-1111-2222' })
  await 종이(p)
  const 말 = await p.locator('.fw-say').innerText().catch(() => '')
  ok('«✨ 공사명 · 회사 등 8칸을 지난번 쓴 값으로 채웠습니다»', /공사명 · 회사 등 8칸을 지난번 쓴 값으로 채웠습니다/.test(말), 말)
  ok('사업 개요 6칸(공사명 · 주소 · 발주자 · 회사 · 대표 · 전화)', (await 값은(p, '사업개요', '공사명')) === '시험 복합청사 신축공사' && (await 값은(p, '사업개요', '현장주소')) === '시험시 가동 1' && (await 값은(p, '사업개요', '발주자')) === '시험시' &&
    (await 값은(p, '사업개요', '회사명')) === '시험건설(주)' && (await 값은(p, '사업개요', '대표자')) === '김시험' && (await 값은(p, '사업개요', '전화번호')) === '000-1111-2222')
  ok('설계자 회사 · 시공자 주소는 안 채움(남의 값 안 섞임)', !(await 값은(p, '사업개요', '설회사')) && !(await 값은(p, '사업개요', '시주소')))
  const 착 = 일련(2027, 1, 4), 준 = 일련(2028, 6, 30)
  ok('판정 착공 · 준공 = 다른 서식 값 → 제출 기한 «2027. 1. 3.(일)»', (await 값은(p, '판정', '착공일')) === 착 && (await 값은(p, '판정', '준공일')) === 준 && (await 값은(p, '판정', '제출기한')) === '착공 전날 2027. 1. 3.(일)까지 발주자에게 제출', await 값은(p, '판정', '제출기한'))
  ok('공사기간 «2027. 1. 4. ~ 2028. 6. 30.»(판정 장에서)', (await 값은(p, '사업개요', '공사기간표시')) === '2027. 1. 4. ~ 2028. 6. 30.', await 값은(p, '사업개요', '공사기간표시'))
  const 확 = []
  for (let k = 1; k <= 7; k++) 확.push([await 값은(p, '판정', `확인날#${k}`), await 값은(p, '판정', `확인말#${k}`)])
  const 기대 = [1, 2, 3, 4, 5].map((k) => [달더함(착, 3 * k), `착공 뒤 ${3 * k}개월 되는 날`]).concat([[준, '준공 전에 마지막 확인'], ['', '']])
  ok('3개월마다 다섯 번 · 여섯째 = 준공(2028. 7. 4. 이 준공 뒤) · 일곱째 없음', JSON.stringify(확) === JSON.stringify(기대), 확)
  ok('금액을 안 적으면 판정 빈칸', (await 값은(p, '판정', '대상판정')) === '')
  const 판 = async (o) => { for (const [k, v] of Object.entries(o)) await 넣음(p, '판정', k, v); return 값은(p, '판정', '대상판정') }
  ok('50억 → 작성 대상 · 49억 9,999만 9,999 원 → 대상 아님', (await 판({ 총공사금액: 5000000000 })) === 대상50 && (await 판({ 총공사금액: 4999999999 })) === 미만)
  ok('총금액 한글 «50억 원» · «1,234억 5,678만 원» · 1억 미만 빈칸', await (async () => { await 넣음(p, '판정', '총공사금액', 5000000000); const a = await 값은(p, '판정', '총금액말'); await 넣음(p, '판정', '총공사금액', 123456789012); const b2 = await 값은(p, '판정', '총금액말'); await 넣음(p, '판정', '총공사금액', 99999999); const c = await 값은(p, '판정', '총금액말'); return a === '50억 원' && b2 === '1,234억 5,678만 원' && c === '' })())
  ok('나뉜 총액 «예» · 개별 금액 빈칸 → «⚠ 개별 공사금액을 적으세요» · 설명 «개별 금액으로 봄»', (await 판({ 총공사금액: 9000000000, 나뉜총액: '예' })) === 개빈 && (await 값은(p, '판정', '나뉜말')) === '개별 금액으로 봄(고시 제3조 ②)')
  ok('개별 60억 → 대상 · 30억 → 대상 아님(총액 90억이어도)', (await 판({ 개별금액: 6000000000 })) === 개대상 && (await 판({ 개별금액: 3000000000 })) === 개미만)
  ok('분리 발주 «예» → «… · 나눈 공사마다 각각 씀(통합해 써도 됨 · 고시 제4조)»', (await 판({ 나뉜총액: '아니오', 개별금액: undefined, 총공사금액: 6850000000, 분리발주: '예' })) === 대상50 + 분리)
  await 판({ 분리발주: '아니오' })
  /* 종이 칸을 눌러 적기 · 고르기 */
  await 쳐넣기(p, '사업개요', '주요공법', '건축(철근콘크리트 — 알루미늄 거푸집)')
  ok('종이 «주요공법» 칸을 눌러 적음', (await 값은(p, '사업개요', '주요공법')) === '건축(철근콘크리트 — 알루미늄 거푸집)', await 값은(p, '사업개요', '주요공법'))
  await 칸누르기(p, '사업개요', '위방대상')
  const 고름 = await p.evaluate(() => [...document.querySelectorAll('.gx-ed-ch .gx-chip')].map((x) => x.textContent))
  ok('«유해위험방지계획서 작성 대상 여부» 를 누르면 «■ 예 □ 아니오 / □ 예 ■ 아니오» 고르기', JSON.stringify(고름) === JSON.stringify([예, 아니오]), 고름)
  await p.locator('.gx-ed-ch .gx-chip').first().click()
  await p.waitForTimeout(200)
  ok('«■ 예» 를 고름', (await 값은(p, '사업개요', '위방대상')) === 예)
  /* 3개월 안에 끝나는 공사 · 준공 < 착공 */
  await 넣음(p, '판정', '착공일', 오늘 + 20); await 넣음(p, '판정', '준공일', 오늘 + 80)
  ok('3개월 안에 끝남 → 1회 = 준공일 «3개월 안에 끝남 — 준공 전에 확인» · 2회 없음', (await 값은(p, '판정', '확인날#1')) === 오늘 + 80 && (await 값은(p, '판정', '확인말#1')) === '3개월 안에 끝남 — 준공 전에 확인' && (await 값은(p, '판정', '확인날#2')) === '')
  ok('오늘 기준 «제출 기한까지 19일 남음»', (await 값은(p, '확인', '오늘제출')) === '제출 기한까지 19일 남음', await 값은(p, '확인', '오늘제출'))
  ok('다음 이행 확인 = 준공일(80일)', (await 값은(p, '확인', '다음확인')) === `${날글(오늘 + 80)} 전에 1회 이상 — 오늘부터 80일`, await 값은(p, '확인', '다음확인'))
  await 넣음(p, '판정', '준공일', 오늘 + 10)
  ok('준공 < 착공 → «⚠ 준공이 착공보다 앞섭니다» · 확인 날짜 없음', (await 값은(p, '판정', '제출기한')) === '⚠ 준공이 착공보다 앞섭니다' && (await 값은(p, '판정', '확인날#1')) === '')
  await 넣음(p, '판정', '착공일', 오늘 + 1); await 넣음(p, '판정', '준공일', 오늘 + 400)
  ok('착공이 내일 → «제출 기한까지 0일 남음»(오늘이 기한)', (await 값은(p, '확인', '오늘제출')) === '제출 기한까지 0일 남음', await 값은(p, '확인', '오늘제출'))
  await 넣음(p, '판정', '착공일', 오늘)
  ok('착공이 오늘 → «⚠ 착공 전날이 지났습니다 — 냈는지 확인 · 안 냈으면 바로»', (await 값은(p, '확인', '오늘제출')) === '⚠ 착공 전날이 지났습니다 — 냈는지 확인 · 안 냈으면 바로')
  await 넣음(p, '판정', '착공일', 오늘 - 100); await 넣음(p, '판정', '준공일', 오늘 + 300)
  const 다음 = [1, 2, 3, 4, 5, 6].map((k) => 달더함(오늘 - 100, 3 * k)).find((d) => d >= 오늘)
  ok('공사 중(착공 100일 뒤) → 다음 이행 확인 = 오늘 뒤 첫 3개월 날', (await 값은(p, '확인', '다음확인')) === `${날글(다음)} 전에 1회 이상 — 오늘부터 ${쉼(다음 - 오늘)}일`, [await 값은(p, '확인', '다음확인'), 날글(다음)])
  await 넣음(p, '판정', '착공일', 오늘 - 400); await 넣음(p, '판정', '준공일', 오늘 - 10)
  ok('준공이 지남 → «준공 — 이행 확인 끝»', (await 값은(p, '확인', '다음확인')) === '준공 — 이행 확인 끝', await 값은(p, '확인', '다음확인'))
  await 넣음(p, '판정', '착공일', 착); await 넣음(p, '판정', '준공일', 준)
  for (let j = 1; j <= 8; j++) await 넣음(p, '확인', `제출#${j}`, j === 5 ? '해당 없음' : '○')
  ok('제출 전 확인 ○ 7 · 해당 없음 1 → «✓ 8가지 모두 확인 — 제출»', (await 값은(p, '확인', '제출요약')) === '✓ 8가지 모두 확인 — 제출')
  await 넣음(p, '확인', '제출#8', '×')
  ok('× 하나 → «⚠ 남은 것 1가지»', (await 값은(p, '확인', '제출요약')) === '⚠ 남은 것 1가지', await 값은(p, '확인', '제출요약'))
  await 넣음(p, '확인', '제출#8', '○')
  await p.waitForTimeout(1000)
  await 종이(p)
  ok('새로고침 → 판정 · 기한 · 주요공법 · ■ 예 · 확인 그대로(이 기기)', (await 값은(p, '판정', '대상판정')) === 대상50 && (await 값은(p, '판정', '제출기한')) === '착공 전날 2027. 1. 3.(일)까지 발주자에게 제출' &&
    (await 값은(p, '사업개요', '주요공법')) === '건축(철근콘크리트 — 알루미늄 거푸집)' && (await 값은(p, '사업개요', '위방대상')) === 예 && (await 값은(p, '확인', '제출요약')) === '✓ 8가지 모두 확인 — 제출')
  await 쳐넣기(p, '사업개요', '공사명', '새시험 복합청사 신축공사')
  await p.waitForTimeout(300)
  await p.goto(BASE + '/forms/pumjil-sanchul', { waitUntil: 'domcontentloaded' })
  await p.waitForFunction(() => window.__격자 && document.querySelectorAll('canvas.gx-page').length, null, { timeout: 25000 })
  await p.waitForTimeout(400)
  const 다른 = await p.evaluate(() => { const g = window.__격자; for (let si = 0; si < g.doc.sheets.length; si++) { const s = g.doc.sheets[si]; const a = Object.entries(s.keys).find(([, k]) => k === '공사명'); if (a) { const m = /^([A-Z]+)(\d+)$/.exec(a[0]); let c = 0; for (const ch of m[1]) c = c * 26 + ch.charCodeAt(0) - 64; return [g.책.값(si, +m[2], c)] } } return null })
  ok('여기 고친 공사명이 품질관리비 산출내역서에 먼저 들어감', !!다른 && 다른[0] === '새시험 복합청사 신축공사', 다른)
  await p.goto(BASE + '/safety', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('#sf-d', { timeout: 15000 })
  ok('안전 화면 ④ 안전보건대장 칸 → 공사안전보건대장 · 설계안전보건대장 링크', await p.evaluate(() => { const d = document.querySelector('#sf-d'); const h = [...d.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')); return h.includes('/forms/gongsa-anjeon-daejang') && h.includes('/forms/seolgye-anjeon-daejang') }))
  ok('오류 0(PC · 적기)', !오류.length, 오류)
  await ctx.close()
}

console.log('⑤ 폰 390 · 360')
for (const [w, h] of [[390, 844], [360, 740]]) {
  const s = await 새쪽(w, h)
  await 종이(s.p)
  ok(`폰 ${w} 종이 뜸`, (await s.p.evaluate(() => document.querySelectorAll('canvas.gx-page').length)) === 쪽수)
  ok(`폰 ${w} 넘침 0`, (await 넘침(s.p)) <= 1, await 넘침(s.p))
  await 칸누르기(s.p, '장비확인자', '항타')
  ok(`폰 ${w} «4) 항타·항발기 …» 칸 → «📷 사진 고르기»`, await s.p.evaluate(() => !!document.querySelector('.gx-ed-ph')), await 이름칸(s.p))
  ok(`폰 ${w} 오류 0`, !s.오류.length, s.오류)
  await s.ctx.close()
}
await b.close()
console.log(`\n${bad ? '✗' : '✓'} 시험_공사안전보건대장화면 ${n - bad}/${n}`)
process.exit(bad ? 1 : 0)
