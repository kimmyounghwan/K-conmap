/**
 * 🧮 G532 «품질관리비 산출내역서»(건설기술 진흥법 시행규칙 별표 6) 서식 화면 시험 — 구운 사이트를 띄운 뒤:
 *   node tools/시험_품질관리비화면.mjs [주소=http://127.0.0.1:4996]
 *   소장님 「웹 싹 다 검색해서 필요한 서류 도구화 하자」 → 후보 ⑥ 품질관리비 산출 · 사용계획서 / 사용내역서(사용내역은 이미 있는 o-anjeon-pumjil-bi 로 이어 씀)
 *   소장님 「빠짐없이 기록하고 사이트에 작업하게 하고, 다운만 받고, 이용자 안오게 하면 안돼. 계속 사이트 찾게 해야 해」(11-04)
 *   ① 서식 탭 ② 착공 칸 카드 · 찾기(«품질관리비» · «품질시험비» · «품질관리활동비» · «별표 6 품질관리비»)
 *   ② 서식 화면(PC): 쪽 수 = 판짜기 · 제목 · 근거(제56조 · 제89조 · 제53조 · 별표 6) · «무료» · «클로드» 없음 · 빈 틀 엑셀(시트 3장) · PDF 단추 ·
 *      다음에 쓸 서류 링크(품질시험계획서 · 안전 · 품질관리비 사용내역서) · 거기서 되돌아오는 링크
 *   ③ «✍ 예시 채우기»(토목 32억) → 품질시험계획 대상 · 인건비 3,893,600 · 공공요금 93,200 · 재료비 39,868 · 장비손료 90,096 · 시설 123,502 · 시험비 4,480,266 ·
 *      활동비 46,044,802 · 합계 50,525,068 · 1.58 % · 확인 9가지
 *   ④ 이용자처럼: 다른 서식에 쓴 공사명 · 회사 · 발주 3칸이 먼저 · 작성일 오늘 · 대상 판정(500억 · 3만 ㎡ · 계약 · 5억 · 660 ㎡ · 2억 · 경계) · 종이 칸을 눌러 적기 ·
 *      장비손료 방법 바꿈 · 내용연수 고침 · 그 밖의 비용 한도 ⚠ → ✓ · 새로고침 그대로 · 여기 쓴 공사명이 다른 서식에 먼저
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
const BASE = process.argv[2] || 'http://127.0.0.1:4996'
const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const SLUG = 'pumjil-sanchul'
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
const 오늘 = (() => { const t = new Date(Date.now() + 9 * 3600e3); return 일련(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate()) })()
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
async function 쳐넣기(p, 시트, 열쇠, 글) {
  await 칸누르기(p, 시트, 열쇠)
  const 입 = p.locator('.gx-ed-r .fw-in').first()
  await 입.fill(글)
  await p.keyboard.press('Enter')
  await p.waitForTimeout(150)
}
const 품시 = '품질시험계획 수립 대상 (시행령 제89조제2항)', 품관 = '품질관리계획 수립 대상 (시행령 제89조제1항)', 아님 = '대상 아님 — 설계도서에 수립하도록 되어 있으면 수립 (제89조제3항 단서)'

console.log('① 서식 탭 · 찾기 (폰 390)')
{
  const { ctx, p, 오류 } = await 새쪽(390, 844)
  await p.goto(BASE + '/forms', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('input[placeholder*="서식 찾기"]', { timeout: 15000 })
  await p.waitForTimeout(500)
  const 링크 = await p.evaluate((s) => [...document.querySelectorAll('a')].filter((a) => (a.getAttribute('href') || '').endsWith('/forms/' + s)).length, SLUG)
  ok('서식 탭에 «품질관리비 산출내역서» 카드(링크)', 링크 > 0, 링크)
  for (const 말 of ['품질관리비', '품질시험비', '품질관리활동비', '별표 6 품질관리비']) {
    await p.fill('input[placeholder*="서식 찾기"]', 말)
    await p.waitForTimeout(500)
    const 있음 = await p.evaluate(() => /품질관리비 산출내역서/.test(document.querySelector('main').innerText))
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
  ok('탭 제목에 «품질관리비 산출내역서»', /품질관리비 산출내역서/.test(await p.title()), await p.title())
  const 본문 = await p.evaluate(() => document.querySelector('main').innerText)
  for (const t of ['제56조', '제89조', '제53조', '별표 6', '1/100', '3/100']) ok(`근거 «${t}» 보임`, 본문.includes(t))
  ok('새 서식 — «무료» 안 씀', !/무료/.test(본문), (본문.match(/.{0,20}무료.{0,20}/) || [''])[0])
  ok('«클로드» 안 씀', !/클로드/.test(본문))
  ok('글에 [ ]( ) 꼴이 그대로 안 보임', !/\]\(\/forms\//.test(본문))
  const 엑셀 = await p.evaluate((s) => [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')).filter((h) => h.endsWith('/forms/' + s + '.xlsx')).length, SLUG)
  ok('빈 틀 엑셀 받기 링크', 엑셀 > 0, 엑셀)
  const r = await p.request.get(BASE + '/forms/' + SLUG + '.xlsx')
  const 몸 = await r.body()
  ok('받는 파일이 엑셀(zip · 시트 3장)', r.status() === 200 && 몸[0] === 0x50 && 몸[1] === 0x4b && (몸.toString('latin1').match(/xl\/worksheets\/sheet\d+\.xml/g) || []).length >= 3, [r.status(), 몸.length])
  ok('📄 PDF 저장 단추', (await p.locator('button', { hasText: 'PDF 저장' }).count()) > 0)
  const 다음 = await p.evaluate(() => [...document.querySelectorAll('.flist a.flink[href]')].map((a) => [a.getAttribute('href'), a.textContent.trim()]))
  for (const [h, t] of [['/forms/pumjil-gyehoek', '품질시험계획서'], ['/forms/o-anjeon-pumjil-bi', '안전 · 품질관리비 사용내역서']]) ok(`«놓치기 쉬운 것» 에 ${t} 링크`, 다음.some(([hh, tt]) => hh === h && tt === t), 다음)
  await 칸누르기(p, '시험비', '횟수#1')
  ok('시험 횟수 칸을 누르면 아래 쓰는 칸이 열림', /횟수/.test(await 이름칸(p)), await 이름칸(p))

  console.log('③ ✍ 예시 채우기 → 자동 칸')
  await p.locator('button', { hasText: '예시 채우기' }).click()
  await p.waitForTimeout(300)
  const 모든값 = await p.evaluate(() => { const g = window.__격자; const out = []; g.doc.sheets.forEach((s, si) => { for (const x of s.cells) if (x[5] === 2 || x[5] === 3) { const v = g.책.값(si, x[0], x[1]); out.push(v && v.e ? '#' + v.e : v) } }); return out })
  const 오류칸 = 모든값.filter((v) => typeof v === 'string' && v.startsWith('#'))
  ok('오류 칸 0', !오류칸.length, 오류칸.slice(0, 5))
  ok('토목 32억 → «품질시험계획 수립 대상»', (await 값은(p, '총괄', '계획')) === 품시, await 값은(p, '총괄', '계획'))
  ok('시험 1 줄 48 × 11,500 = 552,000 · 공공 9,600', (await 값은(p, '시험비', '인건#1')) === 552000 && (await 값은(p, '시험비', '공공#1')) === 9600)
  ok('소계 인건비 3,893,600 · 공공요금 93,200', (await 값은(p, '시험비', '인건계')) === 3893600 && (await 값은(p, '시험비', '공공계')) === 93200)
  ok('장비 상각 + 수리 1.4 · 1.2 · 1.6 · 내용연수 10 · 3 · 10', (await 값은(p, '시험비', '장률#1')) === 1.4 && (await 값은(p, '시험비', '장률#2')) === 1.2 && (await 값은(p, '시험비', '장률#4')) === 1.6 &&
    (await 값은(p, '시험비', '장연#1')) === 10 && (await 값은(p, '시험비', '장연#2')) === 3 && (await 값은(p, '시험비', '장연#4')) === 10)
  ok('손료 75,600 · 9,600 · 1,440 · 3,456 → 90,096', JSON.stringify([await 값은(p, '시험비', '장손#1'), await 값은(p, '시험비', '장손#2'), await 값은(p, '시험비', '장손#3'), await 값은(p, '시험비', '장손#4'), await 값은(p, '시험비', '장손계')]) === JSON.stringify([75600, 9600, 1440, 3456, 90096]))
  ok('재료비 39,868 · 장비손료 90,096 · 시설 123,502 · 시험비 계 4,480,266', (await 값은(p, '시험비', '재료비')) === 39868 && (await 값은(p, '시험비', '장비손료')) === 90096 && (await 값은(p, '시험비', '시설비')) === 123502 && (await 값은(p, '시험비', '시험비계')) === 4480266)
  ok('활동비 — 45,000,000 · 문서 450,000 · 교육 450,000 · 검사 44,802', (await 값은(p, '활동비', '기인계')) === 45000000 && (await 값은(p, '활동비', '문서비')) === 450000 && (await 값은(p, '활동비', '교육비')) === 450000 && (await 값은(p, '활동비', '검사비')) === 44802)
  ok('그 밖의 비용 100,000 · 한도 459,448 원 · ✓', (await 값은(p, '활동비', '그밖한도')) === '한도 459,448 원' && (await 값은(p, '활동비', '그밖판정')) === '✓ 1) ~ 4) 합의 1/100 이내 (5)')
  ok('활동비 계 46,044,802 · 합계 50,525,068 · «총공사비 대비 1.58 %»', (await 값은(p, '활동비', '활동비계')) === 46044802 && (await 값은(p, '총괄', '합계')) === 50525068 && (await 값은(p, '총괄', '비율')) === '총공사비 대비 1.58 %')
  ok('확인 «✓ 9가지 모두 확인» · 작성자 «예시건설(주)»', (await 값은(p, '총괄', '확요약')) === '✓ 9가지 모두 확인' && (await 값은(p, '총괄', '작성자표시')) === '예시건설(주)')
  ok('오류 0(PC · 예시)', !오류.length, 오류)
  await p.locator('.flist a[href="/forms/pumjil-gyehoek"]').first().click()
  await p.waitForURL(/\/forms\/pumjil-gyehoek$/, { timeout: 10000 })
  await p.waitForTimeout(600)
  ok('품질시험계획서로 감 → 거기서 이 서식으로 오는 링크', await p.evaluate((s) => [...document.querySelectorAll('.flist a[href]')].some((a) => a.getAttribute('href') === '/forms/' + s), SLUG))
  ok('오류 0(다음 서류)', !오류.length, 오류)
  await ctx.close()
}

console.log('④ 이용자처럼 빈 종이에 적기 (PC) — 다른 서식에 쓴 값이 먼저 들어옴')
{
  const { ctx, p, 오류 } = await 새쪽(1280, 900, false)
  await 종이(p)
  await p.evaluate((공) => { localStorage.removeItem('kcm.격자'); localStorage.setItem('kcm.서식공통', JSON.stringify(공)) },
    { 현장: '시험 하천 정비공사', 회사: '시험건설(주)', 대표: '김시험', 발주: '시험 발주청', 대리인: '박현장' })
  await 종이(p)
  const 말 = await p.locator('.fw-say').innerText().catch(() => '')
  ok('«✨ 공사명 · 회사 등 3칸을 지난번 쓴 값으로 채웠습니다»', /공사명 · 회사 등 3칸을 지난번 쓴 값으로 채웠습니다/.test(말), 말)
  ok('총괄 3칸 · 작성일 오늘 · 작성자', (await 값은(p, '총괄', '공사명')) === '시험 하천 정비공사' && (await 값은(p, '총괄', '시공사')) === '시험건설(주)' && (await 값은(p, '총괄', '발주자')) === '시험 발주청' &&
    (await 값은(p, '총괄', '작성일')) === 오늘 && (await 값은(p, '총괄', '작성자표시')) === '시험건설(주)')
  ok('아무것도 안 적으면 대상 · 합계 빈칸', (await 값은(p, '총괄', '계획')) === '' && (await 값은(p, '총괄', '합계')) === '' && (await 값은(p, '시험비', '시험비계')) === '')
  const 대상 = async (o) => { for (const [k, v] of Object.entries(o)) await 넣음(p, '총괄', k, v); return 값은(p, '총괄', '계획') }
  ok('토목 5억 → 품질시험계획 · 4.99억 → 대상 아님', (await 대상({ 종류: '토목공사', 총공사비: 500000000 })) === 품시 && (await 대상({ 총공사비: 499000000 })) === 아님)
  ok('전문 2억 → 품질시험계획 · 건축 660 ㎡ → 품질시험계획 · 659 ㎡ → 아님', (await 대상({ 종류: '전문공사', 총공사비: 200000000 })) === 품시 && (await 대상({ 종류: '건축공사', 총공사비: 100000000, 연면적: 660 })) === 품시 && (await 대상({ 연면적: 659 })) === 아님)
  ok('건설사업관리 대상 · 500억 → 품질관리계획 · 499억 → 품질시험계획(건축 660 ㎡ 넘음)', (await 대상({ 연면적: 5000, CM: '예', 총공사비: 50000000000 })) === 품관 && (await 대상({ 총공사비: 49900000000 })) === 품시)
  ok('다중이용 3만 ㎡ → 품질관리계획 · 계약에 명시 → 품질관리계획', (await 대상({ CM: '아니오', 다중: '예', 연면적: 30000 })) === 품관 && (await 대상({ 다중: '아니오', 연면적: 800, 계약: '예' })) === 품관)
  await 대상({ 계약: '아니오', 종류: '토목공사', 총공사비: 1800000000, 연면적: undefined })
  /* 시험비 — 종이의 칸을 눌러 씀 */
  await 칸누르기(p, '시험비', '종목#1')
  await p.locator('.gx-ed-r .fw-in').first().fill('콘크리트 압축강도 시험')
  await p.keyboard.press('Enter'); await p.waitForTimeout(150)
  await 넣음(p, '시험비', '횟수#1', 30); await 넣음(p, '시험비', '인단#1', 20000); await 넣음(p, '시험비', '공단#1', 500)
  await 넣음(p, '시험비', '횟수#2', 10); await 넣음(p, '시험비', '인단#2', 33333); await 넣음(p, '시험비', '공단#2', 333)
  ok('30 × 20,000 = 600,000 · 10 × 33,333 = 333,330 · 공공 15,000 · 3,330', (await 값은(p, '시험비', '인건계')) === 933330 && (await 값은(p, '시험비', '공공계')) === 18330)
  ok('재료비 (933,330 + 18,330) / 100 → 9,516(원 미만 버림)', (await 값은(p, '시험비', '재료비')) === 9516, await 값은(p, '시험비', '재료비'))
  ok('장비손료 방법 빈칸 → 인건비의 1/100 = 9,333', (await 값은(p, '시험비', '장비손료')) === 9333, await 값은(p, '시험비', '장비손료'))
  ok('시설 · 검정 · 교정 (951,660 + 9,516 + 9,333) × 3/100 = 29,115', (await 값은(p, '시험비', '시설비')) === 29115, await 값은(p, '시험비', '시설비'))
  await 넣음(p, '시험비', '장구#1', '유리류'); await 넣음(p, '시험비', '장가#1', 500000); await 넣음(p, '시험비', '장시#1', 100)
  ok('유리류 — 상각 + 수리 1.0 · 내용연수 3 · 손료 8,333', (await 값은(p, '시험비', '장률#1')) === 1 && (await 값은(p, '시험비', '장연#1')) === 3 && (await 값은(p, '시험비', '장손#1')) === 8333)
  await 넣음(p, '시험비', '장연#1', 5)
  ok('내용연수를 5 로 고치면 손료 5,000', (await 값은(p, '시험비', '장손#1')) === 5000)
  await 넣음(p, '시험비', '손료방법', '계산식(아래 장비)')
  ok('방법 «계산식» → 장비손료 = 장비 합 5,000', (await 값은(p, '시험비', '장비손료')) === 5000)
  await 넣음(p, '시험비', '차량', 120000)
  const 시험비 = await 값은(p, '시험비', '시험비계')
  ok('품질시험비 계 = 951,660 + 9,516 + 5,000 + 시설 + 120,000', 시험비 === 951660 + 9516 + 5000 + Math.floor((951660 + 9516 + 5000) * 3 / 100) + 120000, 시험비)
  /* 활동비 */
  await 넣음(p, '활동비', '등급#1', '중급'); await 넣음(p, '활동비', '인원#1', 1); await 넣음(p, '활동비', '개월#1', 6); await 넣음(p, '활동비', '월인#1', 5000000)
  await 넣음(p, '활동비', '등급#2', '초급'); await 넣음(p, '활동비', '인원#2', 0.5); await 넣음(p, '활동비', '개월#2', 6); await 넣음(p, '활동비', '월인#2', 4000000)
  ok('30,000,000 + 12,000,000 = 42,000,000 · 문서 · 교육 420,000', (await 값은(p, '활동비', '기인계')) === 42000000 && (await 값은(p, '활동비', '문서비')) === 420000 && (await 값은(p, '활동비', '교육비')) === 420000)
  const 검 = Math.floor(시험비 / 100)
  ok(`품질검사비 = 품질시험비의 1/100 (${검})`, (await 값은(p, '활동비', '검사비')) === 검)
  const 한도 = Math.floor((42000000 + 420000 + 420000 + 검) / 100)
  await 넣음(p, '활동비', '그밖', 한도 + 1)
  ok('그 밖의 비용 한도 + 1 원 → «⚠ 한도를 넘음»', (await 값은(p, '활동비', '그밖판정')) === '⚠ 한도를 넘음 — 1) ~ 4) 합의 1/100 을 넘을 수 없음' && (await 값은(p, '활동비', '그밖한도')) === `한도 ${한도.toLocaleString('en-US')} 원`)
  await 넣음(p, '활동비', '그밖', 한도)
  ok('한도와 같으면 ✓', (await 값은(p, '활동비', '그밖판정')) === '✓ 1) ~ 4) 합의 1/100 이내 (5)')
  const 합 = 시험비 + 42000000 + 840000 + 검 + 한도
  ok('총괄 합계 · 18억 대비 %', (await 값은(p, '총괄', '합계')) === 합 && (await 값은(p, '총괄', '비율')) === `총공사비 대비 ${(합 / 1800000000 * 100).toFixed(2)} %`, [await 값은(p, '총괄', '합계'), await 값은(p, '총괄', '비율')])
  for (let j = 1; j <= 8; j++) await 넣음(p, '총괄', `확#${j}`, '○')
  await 넣음(p, '총괄', '확#9', '×')
  ok('× 하나 → «⚠ × 1가지»', (await 값은(p, '총괄', '확요약')) === '⚠ × 1가지')
  await 넣음(p, '총괄', '확#9', '○')
  ok('→ «✓ 9가지 모두 확인»', (await 값은(p, '총괄', '확요약')) === '✓ 9가지 모두 확인')
  await p.waitForTimeout(1000)
  await 종이(p)
  ok('새로고침 → 대상 · 시험비 · 활동비 · 합계 그대로(이 기기)', (await 값은(p, '총괄', '계획')) === 품시 && (await 값은(p, '시험비', '시험비계')) === 시험비 && (await 값은(p, '총괄', '합계')) === 합 && (await 값은(p, '시험비', '종목#1')) === '콘크리트 압축강도 시험')
  await 쳐넣기(p, '총괄', '공사명', '새시험 하천 정비공사')
  await p.waitForTimeout(300)
  await p.goto(BASE + '/forms/hanjung-seojung', { waitUntil: 'domcontentloaded' })
  await p.waitForFunction(() => window.__격자 && document.querySelectorAll('canvas.gx-page').length, null, { timeout: 25000 })
  await p.waitForTimeout(400)
  const 다른 = await p.evaluate(() => { const g = window.__격자; for (let si = 0; si < g.doc.sheets.length; si++) { const s = g.doc.sheets[si]; const a = Object.entries(s.keys).find(([, k]) => k === '공사명'); if (a) { const m = /^([A-Z]+)(\d+)$/.exec(a[0]); let c = 0; for (const ch of m[1]) c = c * 26 + ch.charCodeAt(0) - 64; return [g.책.값(si, +m[2], c)] } } return null })
  ok('여기 고친 공사명이 한중 · 서중 콘크리트 시공계획서에 먼저 들어감', !!다른 && 다른[0] === '새시험 하천 정비공사', 다른)
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
console.log(`\n${bad ? '✗' : '✓'} 시험_품질관리비화면 ${n - bad}/${n}`)
process.exit(bad ? 1 : 0)
