/**
 * 🏗️ G618 «건축물 착공신고서» 서식 화면 시험 — 구운 사이트(dist + web/public/forms/g)를 띄운 뒤:
 *   node tools/시험_건축착공신고화면.mjs [주소=http://127.0.0.1:4996]
 *   소장님 「서식과 입찰로 우리 사이트를 키우자 … 꼭 검색이 되게 하고 … 하루에 조금씩 만들어 나가자」(11-09) → 차례 1 셋째(G617 연장신고서 다음)
 *   ① 서식 탭 카드 · 찾기(«착공신고서 양식» · «건축물 착공신고» · «건축법 착공신고서» · «착공신고 첨부서류»)
 *   ② 구운 장(제목 · 설명 · canonical · 구조화 자료) · 근거(제21조 · 제14조 · 별지 제13호서식 · 별표 4의2 · 제59조) · «무료» · «클로드» 없음 ·
 *      빈 틀 엑셀(시트 5장) · PDF · 착공계 · 축조신고서 링크(착공계에서 이 서식으로도) · 고르는 단추(받은 것 3 · 공사감리자 3 · 석면 6) · 사진 칸 없음
 *   ③ «✍ 예시 채우기» → 착수 기한 2028. 9. 15. · 건설사업자 시공 · 함께 서명(감리자) · 기술지도 대상 · 판정 · 붙일 서류 · 신고서 날짜 · 도급금액 · 석면 √ ·
 *      지도대상 √ · 뒤쪽 «내야 하나» · 설계도서(○ 7 · 해당 없음 48) · 확인(7일 앞 · 착공일 전날 · 8가지) · 기한(오늘 기준)
 *   ④ 이용자처럼: 다른 서식에 쓴 회사 · 대표 · 위치 · 착공 · 준공 · 현장대리인 · 계약금액 7칸 + 제출일(오늘) · 단추로 고름 · 허가 2년 · 공장 3년 · 신고 1년 ·
 *      기한 뒤(허가 취소 · 신고 효력) · 가설건축물 허가 · 200㎡ · 용도 · 감리 셋(법 제25조 ① ② · 없음) · 기술지도(1억 · 120억 · 건축허가 · 빼는 공사 · 금액 없음) ·
 *      설계도서 셋 · 석면 · 제출일이 착공일 뒤 · 착수 기한 지남 · × · 새로고침 그대로
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
const SLUG = 'geonchuk-chakgong-singo'
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
/* 칸 찾기 — 격자 JSON 의 열쇠(keys)로 */
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
/* 날짜 — 엑셀 일련 · 서울 날 */
const 일련 = (y, m, d) => Math.round((Date.UTC(y, m - 1, d) - Date.UTC(1899, 11, 30)) / 86400000)
const 오늘 = (() => { const t = new Date(Date.now() + 9 * 3600e3); return 일련(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate()) })()
const 날 = (s) => new Date(Date.UTC(1899, 11, 30) + s * 86400000)
const 날글 = (s) => { const t = 날(s); return `${t.getUTCFullYear()}. ${t.getUTCMonth() + 1}. ${t.getUTCDate()}.` }
const 날ISO = (s) => 날(s).toISOString().slice(0, 10)
const 쉼 = (x) => x.toLocaleString('en-US')
const EDATE = (s, n) => { const t = 날(s); const y = t.getUTCFullYear(), m = t.getUTCMonth() + n; const 끝 = new Date(Date.UTC(y, m + 1, 0)).getUTCDate(); return 일련(new Date(Date.UTC(y, m, 1)).getUTCFullYear(), new Date(Date.UTC(y, m, 1)).getUTCMonth() + 1, Math.min(t.getUTCDate(), 끝)) }
/* 고르는 값(생성기와 같은 글 — 다르면 시험이 잡음) */
const 허가 = '건축허가(건축법 제11조)', 신고 = '건축신고(건축법 제14조)', 가설 = '가설건축물 건축허가(건축법 제20조제1항)'
const 용도 = ['공동주택', '다중주택 · 다가구주택 · 공관 · 단독주택 꼴 가정어린이집 등(영 제36조①)', '학교 · 어린이집 · 유치원 · 학원 · 병원 · 숙박 · 업무시설 등(영 제36조②)', '그 밖(단독주택 · 근린생활시설 · 창고 등)']
const 도서 = ['허가 · 신고 때 냄 — 바뀐 것 없음', '허가 · 신고 때 냄 — 바뀐 것 있음', '허가 · 신고 때 안 냄']
const 감리 = ['건축주가 지정(법 제25조제1항)', '허가권자가 지정(법 제25조제2항)', '감리 없음']
const 석면 = ['천장재', '단열재', '지붕재', '보온재', '기타', '해당없음']
const 시공사업자 = '건설사업자가 시공(건산법 제41조제1항) — ③ 공사시공자 · 현장배치 건설기술자를 적음'
const 직접 = '건축주가 직접 시공해도 됨 · ⑤ 현장관리인(건설기술인 1명)을 지정(건축법 제24조제6항)'
const 지도대상 = '대상 — 착공일 전날까지 건설재해예방전문지도기관과 계약 · 계약서 사본 붙임(규칙 제14조제6항)'
const 판정글 = (감리자) => `✓ 착공 전 신고 — 서명: 건축주 · 공사시공자${감리자 ? ' · 공사감리자' : ''} · 처리 3일(통지 없으면 다음 날 수리로 봄)`
const 기한뒤 = (허) => `⚠ 착공예정일이 기한 뒤 — 그대로면 ${허 ? '허가 취소(법 제11조제7항)' : '신고 효력 없어짐(법 제14조제5항)'} · 정당한 사유면 1년 범위 연장(착공연기신청서)`
const 기한글 = (기한) => (기한 < 오늘 ? `⚠ 착수 기한(${날글(기한)})이 지났습니다 — 허가권자에게 바로 문의`
  : `착수 기한 ${날글(기한)} — 오늘부터 ${쉼(기한 - 오늘)}일 남음 · 늦어지면 착공연기신청서(별지 제14호서식)`)
const 석면글 = (x) => 석면.map((a) => (a === x ? `[√] ${a}` : `[  ] ${a}`)).join('   ')
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
const 이름칸 = (p) => p.locator('.gx-ed-n').innerText().catch(() => '')
const 칩들 = (p) => p.evaluate(() => [...document.querySelectorAll('.gx-ed-ch .gx-chip')].map((x) => x.textContent))
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
  ok('서식 탭에 «건축물 착공신고서» 카드(링크)', 링크 > 0, 링크)
  for (const 말 of ['착공신고서 양식', '건축물 착공신고', '건축법 착공신고서', '착공신고 첨부서류']) {
    await p.fill('input[placeholder*="서식 찾기"]', 말)
    await p.waitForTimeout(500)
    const 있음 = await p.evaluate(() => /건축물 착공신고서/.test(document.querySelector('main').innerText))
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
  const 구운 = await p.request.get(BASE + '/forms/' + SLUG + '.html')
  const 구h = 구운.status() === 200 ? await 구운.text() : ''
  ok('구운 장 제목 «건축물 착공신고서 양식 — 사이트에서 작성 …»', /<title>건축물 착공신고서 양식 — 사이트에서 작성[^<]*<\/title>/.test(구h), (구h.match(/<title>[^<]*/) || [구운.status()])[0])
  ok('구운 장 설명 — 찾는 말(착공신고서 양식 · 건축물 착공신고)', /<meta name="description" content="건축물 착공신고서\(착공신고서 양식 · 건축물 착공신고\) 양식[^"]*/.test(구h))
  ok('구운 장 주소(canonical) · 구조화 자료 · h1', 구h.includes(`<link rel="canonical" href="https://k-conmap.com/forms/${SLUG}" />`) &&
    구h.includes('"@type":"BreadcrumbList"') && 구h.includes('"@type":"CreativeWork"') && /<h1[^>]*>건축물 착공신고서 양식/.test(구h))
  const 본문 = await p.evaluate(() => document.querySelector('main').innerText)
  for (const t of ['제21조', '제14조', '별지 제13호서식', '별표 4의2', '제59조', '3일']) ok(`근거 «${t}» 보임`, 본문.includes(t))
  ok('새 서식 — «무료» 안 씀', !/무료/.test(본문), (본문.match(/.{0,20}무료.{0,20}/) || [''])[0])
  ok('«클로드» 안 씀', !/클로드/.test(본문))
  ok('글에 [ ]( ) 꼴이 그대로 안 보임', !/\]\(\/forms\//.test(본문))
  const 엑셀 = await p.evaluate((s) => [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')).filter((h) => h.endsWith('/forms/' + s + '.xlsx')).length, SLUG)
  ok('빈 틀 엑셀 받기 링크', 엑셀 > 0, 엑셀)
  const r = await p.request.get(BASE + '/forms/' + SLUG + '.xlsx')
  const 몸 = await r.body()
  ok('받는 파일이 엑셀(zip · 시트 5장)', r.status() === 200 && 몸[0] === 0x50 && 몸[1] === 0x4b && (몸.toString('latin1').match(/xl\/worksheets\/sheet\d+\.xml/g) || []).length >= 5, [r.status(), 몸.length])
  ok('📄 PDF 저장 단추', (await p.locator('button', { hasText: 'PDF 저장' }).count()) > 0)
  const 다음 = await p.evaluate(() => [...document.querySelectorAll('.flist a.flink[href]')].map((a) => [a.getAttribute('href'), a.textContent.trim()]))
  ok('«놓치기 쉬운 것» 에 착공계 · 가설건축물 축조신고서 링크', 다음.some(([h, t]) => h === '/forms/chakgong' && t === '착공계') && 다음.some(([h, t]) => h === '/forms/gaseol-chukjo-singo' && t === '가설건축물 축조신고서'), 다음)
  ok('사진 칸 없음(«사진 고르기» 안 뜸) — 건축주 칸은 글 칸', await (async () => { await 칸누르기(p, '신고서', '건축주'); return p.evaluate(() => !document.querySelector('.gx-ed-ph') && !!document.querySelector('.gx-ed-r .fw-in')) })(), await 이름칸(p))
  await 칸누르기(p, '판정', '구분')
  ok('받은 것 → 고르는 단추 3개(건축허가 · 건축신고 · 가설건축물 건축허가)', JSON.stringify(await 칩들(p)) === JSON.stringify([허가, 신고, 가설]), await 칩들(p))
  await 칸누르기(p, '판정', '감리')
  ok('공사감리자 → 고르는 단추 3개(건축주가 지정 · 허가권자가 지정 · 감리 없음)', JSON.stringify(await 칩들(p)) === JSON.stringify(감리), await 칩들(p))
  await 칸누르기(p, '신고서', '석면')
  ok('석면함유 유무 → 고르는 단추 6개(서식 칸 그대로)', JSON.stringify(await 칩들(p)) === JSON.stringify(석면), await 칩들(p))
  ok('아무것도 안 적으면 판정 · 착수 기한 · 붙일 서류 빈칸 · 석면 · 지도대상 빈 네모',
    (await 값은(p, '판정', '판정')) === '' && (await 값은(p, '판정', '착수기한')) === '' && (await 값은(p, '판정', '붙일것')) === '' &&
    (await 값은(p, '신고서', '석면표시')) === 석면글('') && (await 값은(p, '신고서', '지도표시')) === '[  ] 대상   [  ] 비대상')
  await p.locator('.gx-ed-x').click()

  console.log('③ ✍ 예시 채우기 → 자동 칸')
  await p.locator('button', { hasText: '예시 채우기' }).click()
  await p.waitForTimeout(400)
  const 모든값 = await p.evaluate(() => { const g = window.__격자; const out = []; g.doc.sheets.forEach((s, si) => { for (const x of s.cells) if (x[5] === 2 || x[5] === 3) { const v = g.책.값(si, x[0], x[1]); out.push(v && v.e ? '#' + v.e : v) } }); return out })
  const 오류칸 = 모든값.filter((v) => typeof v === 'string' && v.startsWith('#'))
  ok('오류 칸 0', !오류칸.length, 오류칸.slice(0, 5))
  ok('착수 기한 2028. 9. 15.(허가일 2026. 9. 15. + 2년) · «✓ 기한 안 착수»', (await 값은(p, '판정', '착수기한')) === 일련(2028, 9, 15) && (await 값은(p, '판정', '기한판정')) === '✓ 기한 안 착수', await 값은(p, '판정', '착수기한'))
  ok('연면적 1,280 ㎡ → 건설사업자 시공', (await 값은(p, '판정', '시공판정')) === 시공사업자, await 값은(p, '판정', '시공판정'))
  ok('건축주가 감리자 지정 → 함께 서명 · 감리 계약서', (await 값은(p, '판정', '감리판정')) === '→ 공사감리자도 함께 서명(법 제21조제2항) · 감리 계약서 붙임(법 제25조제11항)', await 값은(p, '판정', '감리판정'))
  ok('건축허가 · 32억 → 기술지도계약 대상', (await 값은(p, '판정', '지도판정')) === 지도대상, await 값은(p, '판정', '지도판정'))
  ok('판정 «✓ 착공 전 신고 — 서명: 건축주 · 공사시공자 · 공사감리자 · 처리 3일 …»', (await 값은(p, '판정', '판정')) === 판정글(true), await 값은(p, '판정', '판정'))
  ok('붙일 서류 «계약서 사본 · 감리 계약서 · 보험 · 공제증서 사본 · 기술지도계약서 사본»(설계도서는 허가 때 냄)', (await 값은(p, '판정', '붙일것')) === '계약서 사본 · 감리 계약서 · 보험 · 공제증서 사본 · 기술지도계약서 사본', await 값은(p, '판정', '붙일것'))
  ok('신고서 허가(신고)일자 · 착공예정일자 · 도급금액(판정 장에서)', (await 값은(p, '신고서', '허가일표시')) === 일련(2026, 9, 15) && (await 값은(p, '신고서', '착공일표시')) === 일련(2026, 11, 20) && (await 값은(p, '신고서', '도급금액')) === 3200000000)
  ok('석면 «[√] 해당없음» · 지도대상 «[√] 대상»', (await 값은(p, '신고서', '석면표시')) === 석면글('해당없음') && (await 값은(p, '신고서', '지도표시')) === '[√] 대상   [  ] 비대상', await 값은(p, '신고서', '석면표시'))
  const 낼 = []
  for (let j = 1; j <= 5; j++) 낼.push(await 값은(p, '뒤쪽', `첨낼#${j}`))
  ok('뒤쪽 «내야 하나» = ✓ 냄 · 해당 없음 · ✓ 냄 · ✓ 냄 · ✓ 냄 · 신고인 표시', JSON.stringify(낼) === JSON.stringify(['✓ 냄', '해당 없음', '✓ 냄', '✓ 냄', '✓ 냄']) && (await 값은(p, '뒤쪽', '건축주표시')) === '(주)가나개발 대표이사 이가나', 낼)
  ok('설계도서 안내 «… 다시 내지 않습니다(규칙 제14조제1항제2호 단서)» · 요약 «○ 7 · 해당 없음 48 · × 0»', (await 값은(p, '설계도서', '도서안내')) === '✓ 허가 · 신고 때 냈고 바뀐 것이 없으면 설계도서는 다시 내지 않습니다(규칙 제14조제1항제2호 단서).' &&
    (await 값은(p, '설계도서', '도서요약')) === '○ 7 · 해당 없음 48 · × 0', await 값은(p, '설계도서', '도서요약'))
  ok('확인 — 판정 · 붙일 서류 · «✓ 착공 전 신고 (7일 앞 · 처리 3일)» · «→ 2026. 11. 19.(착공일 전날)까지 계약» · «✓ 8가지 모두 확인»',
    (await 값은(p, '확인', '확판정')) === 판정글(true) && (await 값은(p, '확인', '확붙일')) === (await 값은(p, '판정', '붙일것')) &&
    (await 값은(p, '확인', '착공전')) === '✓ 착공 전 신고 (7일 앞 · 처리 3일)' && (await 값은(p, '확인', '확지도')) === '→ 2026. 11. 19.(착공일 전날)까지 계약 · 사본 붙임' &&
    (await 값은(p, '확인', '제출요약')) === '✓ 8가지 모두 확인 — 제출', [await 값은(p, '확인', '착공전'), await 값은(p, '확인', '확지도'), await 값은(p, '확인', '제출요약')])
  ok(`착수 기한(오늘 기준) «${기한글(일련(2028, 9, 15))}»`, (await 값은(p, '확인', '기한')) === 기한글(일련(2028, 9, 15)), await 값은(p, '확인', '기한'))
  ok('오류 0(PC · 예시)', !오류.length, 오류)
  await p.locator('.flist a[href="/forms/chakgong"]').first().click()
  await p.waitForURL(/\/forms\/chakgong$/, { timeout: 10000 })
  await p.waitForTimeout(800)
  ok('착공계로 감 → 거기서 이 서식으로 오는 링크', await p.evaluate((s) => [...document.querySelectorAll('a[href]')].some((a) => a.getAttribute('href') === '/forms/' + s), SLUG))
  ok('오류 0(착공계)', !오류.length, 오류)
  await ctx.close()
}

console.log('④ 이용자처럼 빈 종이에 적기 (PC) — 다른 서식에 쓴 값이 먼저 들어옴')
{
  const { ctx, p, 오류 } = await 새쪽(1280, 900, false)
  await 종이(p)
  await p.evaluate((공) => { localStorage.removeItem('kcm.격자'); localStorage.setItem('kcm.서식공통', JSON.stringify(공)) },
    { 현장: '시험 근린생활시설 신축공사', 회사: '시험건설(주)', 대표: '김시험', 위치: '가나시 다라구 일원', 착공: 날ISO(오늘 + 20), 준공: 날ISO(오늘 + 300), 발주: '시험 발주청', 대리인: '박현장', 연락처: '000-1111-2222', 계약금액: '1,500,000,000' })
  await 종이(p)
  const 말 = await p.locator('.fw-say').innerText().catch(() => '')
  ok('«✨ 공사명 · 회사 등 7칸을 지난번 쓴 값으로 채웠습니다»', /공사명 · 회사 등 7칸을 지난번 쓴 값으로 채웠습니다/.test(말), 말)
  const 들어옴 = {}
  for (const [s, k] of [['신고서', '회사명'], ['신고서', '대표자'], ['신고서', '현장소재지'], ['판정', '착공일'], ['신고서', '준공일'], ['신고서', '현장대리인'], ['판정', '계약금액'], ['뒤쪽', '제출일']]) 들어옴[k] = await 값은(p, s, k)
  ok('회사명 · 대표자(공사시공자 성명) · 대지위치 · 착공 · 준공 · 현장배치 건설기술자 · 공사금액 + 제출일(오늘)', JSON.stringify(들어옴) === JSON.stringify({ 회사명: '시험건설(주)', 대표자: '김시험', 현장소재지: '가나시 다라구 일원', 착공일: 오늘 + 20, 준공일: 오늘 + 300, 현장대리인: '박현장', 계약금액: 1500000000, 제출일: 오늘 }), 들어옴)
  ok('건축주 · 건축주 전화는 안 들어감(시공사 값이 건축주 칸에 들어가지 않게)', !(await 값은(p, '신고서', '건축주')) && !(await 값은(p, '신고서', '건축주전화')))
  ok('신고서 착공예정일자 · 도급금액도 따라 들어옴', (await 값은(p, '신고서', '착공일표시')) === 오늘 + 20 && (await 값은(p, '신고서', '도급금액')) === 1500000000)
  /* 받은 것 — 종이의 칸을 눌러 단추로 */
  await 칸누르기(p, '판정', '구분')
  await p.locator('.gx-ed-ch .gx-chip', { hasText: '건축신고' }).click()
  await p.waitForTimeout(250)
  ok('«건축신고» 단추 → 들어가고 다음 칸(공장)으로', (await 값은(p, '판정', '구분')) === 신고 && /공장/.test(await 이름칸(p)), [await 값은(p, '판정', '구분'), await 이름칸(p)])
  await p.locator('.gx-ed-x').click().catch(() => {})
  const 허가일 = 오늘 - 200
  await 넣음(p, '판정', '허가일', 허가일)
  ok(`건축신고 → 착수 기한 1년(${날글(EDATE(허가일, 12))}) · 기한 안`, (await 값은(p, '판정', '착수기한')) === EDATE(허가일, 12) && (await 값은(p, '판정', '기한판정')) === '✓ 기한 안 착수', await 값은(p, '판정', '착수기한'))
  await 넣음(p, '판정', '착공일', EDATE(허가일, 12) + 1)
  ok('착공예정일이 1년 + 1일 → «⚠ … 신고 효력 없어짐(법 제14조제5항) …» · 판정 ⚠', (await 값은(p, '판정', '기한판정')) === 기한뒤(false) && (await 값은(p, '판정', '판정')) === '⚠ 착공예정일이 착수 기한 뒤 — 착공연기신청서부터(허가권자에게 문의)', await 값은(p, '판정', '기한판정'))
  await 넣음(p, '판정', '구분', 허가)
  ok(`건축허가 → 2년(${날글(EDATE(허가일, 24))}) · 다시 기한 안`, (await 값은(p, '판정', '착수기한')) === EDATE(허가일, 24) && (await 값은(p, '판정', '기한판정')) === '✓ 기한 안 착수')
  await 넣음(p, '판정', '착공일', EDATE(허가일, 24) + 1)
  ok('허가 2년 + 1일 → «⚠ … 허가 취소(법 제11조제7항) …»', (await 값은(p, '판정', '기한판정')) === 기한뒤(true), await 값은(p, '판정', '기한판정'))
  await 넣음(p, '판정', '공장', '예')
  ok(`산업집적법 승인 공장 → 3년(${날글(EDATE(허가일, 36))}) · 기한 안`, (await 값은(p, '판정', '착수기한')) === EDATE(허가일, 36) && (await 값은(p, '판정', '기한판정')) === '✓ 기한 안 착수')
  await 넣음(p, '판정', '공장', '아니오')
  await 넣음(p, '판정', '착공일', 오늘 + 20)
  await 넣음(p, '판정', '구분', 가설)
  ok('가설건축물 건축허가 → 착수 기한 셈 없음 · «허가 조건(존치기간 등)을 허가권자와 확인»', (await 값은(p, '판정', '착수기한')) === '' && (await 값은(p, '판정', '기한판정')) === '가설건축물 허가 — 착수 기한은 허가 조건(존치기간 등)을 허가권자와 확인')
  ok('가설건축물 허가 · 15억 → 금액으로 기술지도 대상', (await 값은(p, '판정', '지도판정')) === 지도대상)
  await 넣음(p, '판정', '계약금액', 99999999)
  ok('가설건축물 허가 · 1억 미만 → «비대상»(건축허가 대상 공사가 아님)', (await 값은(p, '판정', '지도판정')) === '비대상' && (await 값은(p, '신고서', '지도표시')) === '[  ] 대상   [√] 비대상', await 값은(p, '판정', '지도판정'))
  await 넣음(p, '판정', '구분', 허가)
  ok('건축허가 · 1억 미만 → 그래도 «대상»(건축허가 대상 공사 — 둘 중 하나)', (await 값은(p, '판정', '지도판정')) === 지도대상)
  await 넣음(p, '판정', '구분', 신고)
  await 넣음(p, '판정', '계약금액', 100000000)
  ok('건축신고 · 1억 꼭 → 대상', (await 값은(p, '판정', '지도판정')) === 지도대상)
  await 넣음(p, '판정', '계약금액', 12000000000)
  ok('건축신고 · 120억 꼭 → 비대상(120억 미만만)', (await 값은(p, '판정', '지도판정')) === '비대상')
  await 넣음(p, '판정', '계약금액', null)
  ok('건축신고 · 금액 비움 → «공사금액을 적으세요»', (await 값은(p, '판정', '지도판정')) === '공사금액을 적으세요' && (await 값은(p, '신고서', '지도표시')) === '[  ] 대상   [  ] 비대상', await 값은(p, '판정', '지도판정'))
  await 넣음(p, '판정', '계약금액', 500000000)
  await 넣음(p, '판정', '지도제외', '예')
  ok('빼는 공사 «예» → «비대상 — 산안법 시행령 제59조제1항 단서»', (await 값은(p, '판정', '지도판정')) === '비대상 — 산안법 시행령 제59조제1항 단서' && (await 값은(p, '신고서', '지도표시')) === '[  ] 대상   [√] 비대상')
  await 넣음(p, '판정', '지도제외', '아니오')
  /* 누가 시공하나 — 200㎡ · 용도 */
  await 넣음(p, '판정', '연면적', 200)
  await 넣음(p, '판정', '용도', 용도[3])
  ok('200 ㎡ 꼭 · 그 밖 용도 → 건축주 직접 시공 가능 · 현장관리인', (await 값은(p, '판정', '시공판정')) === 직접, await 값은(p, '판정', '시공판정'))
  await 넣음(p, '판정', '연면적', 200.5)
  ok('200.5 ㎡ → 건설사업자 시공', (await 값은(p, '판정', '시공판정')) === 시공사업자)
  await 넣음(p, '판정', '연면적', 150)
  for (const [i, 이름] of [[0, '공동주택'], [1, '다중주택 등'], [2, '학교 · 병원 등']]) {
    await 넣음(p, '판정', '용도', 용도[i])
    ok(`150 ㎡ · ${이름} → 건설사업자 시공`, (await 값은(p, '판정', '시공판정')) === 시공사업자)
  }
  /* 공사감리자 셋 */
  await 칸누르기(p, '판정', '감리')
  await p.locator('.gx-ed-ch .gx-chip', { hasText: '허가권자가 지정' }).click()
  await p.waitForTimeout(250)
  await p.locator('.gx-ed-x').click().catch(() => {})
  ok('허가권자가 지정 → «감리 계약서 붙임 · ④ 칸을 적음» · 서명에 감리자 없음 · 붙일 서류에 감리 계약서 · 뒤쪽 ✓ 냄',
    (await 값은(p, '판정', '감리판정')) === '→ 감리 계약서 붙임(법 제25조제11항) · ④ 공사감리자 칸을 적음' && (await 값은(p, '판정', '판정')) === 판정글(false) &&
    /감리 계약서/.test(await 값은(p, '판정', '붙일것')) && (await 값은(p, '뒤쪽', '첨낼#3')) === '✓ 냄', [await 값은(p, '판정', '감리판정'), await 값은(p, '판정', '판정')])
  await 넣음(p, '판정', '감리', 감리[2])
  ok('감리 없음 → «감리 계약서 없음 · ④ 칸 비움» · 뒤쪽 «해당 없음»', (await 값은(p, '판정', '감리판정')) === '감리 계약서 없음 · ④ 공사감리자 칸 비움' && (await 값은(p, '뒤쪽', '첨낼#3')) === '해당 없음' &&
    !/감리 계약서/.test(await 값은(p, '판정', '붙일것')))
  await 넣음(p, '판정', '감리', 감리[0])
  ok('건축주가 지정 → 서명에 공사감리자', (await 값은(p, '판정', '판정')) === 판정글(true))
  /* 설계도서 셋 */
  await 넣음(p, '판정', '도서', 도서[1])
  ok('바뀐 것 있음 → 붙일 서류 «바뀐 설계도서» · 뒤쪽 «✓ 바뀐 것» · 안내', /바뀐 설계도서/.test(await 값은(p, '판정', '붙일것')) && (await 값은(p, '뒤쪽', '첨낼#2')) === '✓ 바뀐 것' &&
    (await 값은(p, '설계도서', '도서안내')) === '→ 바뀐 것을 반영한 설계도서만 냅니다 — 바뀐 도서에 ○')
  await 넣음(p, '판정', '도서', 도서[2])
  ok('안 냄 → «설계도서(별표 4의2)» · 뒤쪽 «✓ 냄»', /설계도서\(별표 4의2\)/.test(await 값은(p, '판정', '붙일것')) && (await 값은(p, '뒤쪽', '첨낼#2')) === '✓ 냄')
  ok('건축신고 → 계약서 사본은 «해당 시»(허가 건축물만 꼭 — 법 제21조제6항)', (await 값은(p, '뒤쪽', '첨낼#1')) === '해당 시' && !/^계약서 사본/.test(await 값은(p, '판정', '붙일것')))
  await 넣음(p, '설계도서', '도#1', '○'); await 넣음(p, '설계도서', '도#2', '×'); await 넣음(p, '설계도서', '도#3', '해당 없음')
  ok('설계도서 ○ 1 · × 1 · 해당 없음 1 → «… — × 는 설계자에게 받아 챙김»', (await 값은(p, '설계도서', '도서요약')) === '○ 1 · 해당 없음 1 · × 1 — × 는 설계자에게 받아 챙김', await 값은(p, '설계도서', '도서요약'))
  /* 석면 — 단추 */
  await 칸누르기(p, '신고서', '석면')
  await p.locator('.gx-ed-ch .gx-chip', { hasText: '단열재' }).click()
  await p.waitForTimeout(250)
  await p.locator('.gx-ed-x').click().catch(() => {})
  ok('석면 «단열재» 단추 → «[√] 단열재»', (await 값은(p, '신고서', '석면표시')) === 석면글('단열재'), await 값은(p, '신고서', '석면표시'))
  /* 제출일 · 착공일 */
  await 넣음(p, '뒤쪽', '제출일', 오늘 + 21)
  ok('제출일이 착공예정일 뒤 → «⚠ … 5천만원 이하 벌금»', (await 값은(p, '확인', '착공전')) === '⚠ 제출일이 착공예정일 뒤 — 착공신고를 하고 공사에 착수합니다(신고 않고 착수하면 5천만원 이하 벌금)', await 값은(p, '확인', '착공전'))
  await 넣음(p, '뒤쪽', '제출일', 오늘)
  ok('제출일 오늘 → «✓ 착공 전 신고 (20일 앞 · 처리 3일)» · 기술지도 «착공일 전날»', (await 값은(p, '확인', '착공전')) === '✓ 착공 전 신고 (20일 앞 · 처리 3일)' &&
    (await 값은(p, '확인', '확지도')) === `→ ${날글(오늘 + 19)}(착공일 전날)까지 계약 · 사본 붙임`, [await 값은(p, '확인', '착공전'), await 값은(p, '확인', '확지도')])
  /* 착수 기한 — 오늘 기준 */
  await 넣음(p, '판정', '허가일', EDATE(오늘, -12) - 1)
  ok('건축신고 · 1년 + 1일 전 신고 → «⚠ 착수 기한(…)이 지났습니다»', (await 값은(p, '확인', '기한')) === 기한글(EDATE(EDATE(오늘, -12) - 1, 12)) && 기한글(EDATE(EDATE(오늘, -12) - 1, 12)).startsWith('⚠'), await 값은(p, '확인', '기한'))
  await 넣음(p, '판정', '허가일', 오늘 - 30)
  ok(`신고 30일 전 → «착수 기한 ${날글(EDATE(오늘 - 30, 12))} — 오늘부터 …일 남음»`, (await 값은(p, '확인', '기한')) === 기한글(EDATE(오늘 - 30, 12)), await 값은(p, '확인', '기한'))
  /* 제출 전 확인 */
  for (let j = 1; j <= 7; j++) await 넣음(p, '확인', `제출#${j}`, '○')
  await 넣음(p, '확인', '제출#8', '×')
  ok('× 하나 → «⚠ 남은 것 1가지»', (await 값은(p, '확인', '제출요약')) === '⚠ 남은 것 1가지', await 값은(p, '확인', '제출요약'))
  await 넣음(p, '확인', '제출#8', '해당 없음')
  ok('→ «✓ 8가지 모두 확인 — 제출»', (await 값은(p, '확인', '제출요약')) === '✓ 8가지 모두 확인 — 제출')
  /* 마지막 한 칸은 종이에서 — 새로고침해도 그대로 */
  await 쳐넣기(p, '신고서', '건축주', '시험건축주 홍길순')
  ok('건축주 쳐 넣음 → 뒤쪽 신고인(건축주)에도', (await 값은(p, '신고서', '건축주')) === '시험건축주 홍길순' && (await 값은(p, '뒤쪽', '건축주표시')) === '시험건축주 홍길순', await 값은(p, '뒤쪽', '건축주표시'))
  await p.waitForTimeout(1000)
  await 종이(p)
  ok('새로고침 → 판정 · 붙일 서류 · 석면 · 확인 그대로(이 기기)', (await 값은(p, '판정', '판정')) === 판정글(true) && (await 값은(p, '신고서', '석면표시')) === 석면글('단열재') &&
    (await 값은(p, '확인', '제출요약')) === '✓ 8가지 모두 확인 — 제출' && (await 값은(p, '신고서', '건축주')) === '시험건축주 홍길순', await 값은(p, '판정', '판정'))
  ok('새로고침 → 착수 기한 다시 셈(오늘 기준)', (await 값은(p, '확인', '기한')) === 기한글(EDATE(오늘 - 30, 12)))
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
    ok('폰 390 예시 채우기 → 판정 ✓', (await 값은(s.p, '판정', '판정')) === 판정글(true))
    ok('폰 390 넘침 0(예시 뒤)', (await 넘침(s.p)) <= 1, await 넘침(s.p))
  }
  ok(`폰 ${w} 오류 0`, !s.오류.length, s.오류)
  await s.ctx.close()
}
await b.close()
console.log(`\n${bad ? '✗' : '✓'} 시험_건축착공신고화면 ${n - bad}/${n}`)
process.exit(bad ? 1 : 0)
