/**
 * 🏗️ G616 «가설건축물 축조신고서» 서식 화면 시험 — 구운 사이트(dist + web/public/forms/g)를 띄운 뒤:
 *   node tools/시험_가설건축물신고화면.mjs [주소=http://127.0.0.1:4996]
 *   소장님 「서식과 입찰로 우리 사이트를 키우자 … 서식을 확장하는 걸로 가자. 꼭 검색이 되게 하고. 기록 후 하루에 조금씩 만들어 나가자」(11-09)
 *   → docs/서식_확장_계획_2026-11-09.md 차례 1(건설 법정 서식)의 첫 서식
 *   ① 서식 탭 카드 · 찾기(«가설건축물 축조신고» · «현장사무실 가설건축물» · «컨테이너 가설건축물 신고» · «대지사용승낙서»)
 *   ② 서식 화면(PC): 쪽 수 = 판짜기 · 제목 · 근거(제20조 · 제15조 · 제13조 · 별지 제8호서식) · «무료» · «클로드» 없음 · 빈 틀 엑셀(시트 6장) · PDF 단추 ·
 *      놓치기 쉬운 것 링크(특정공사 사전신고서 · 비산먼지 발생사업 신고서) · 배치도 · 평면도는 사진 칸 · 승낙자는 글 칸
 *   ③ «✍ 예시 채우기»(현장사무실 36 · 자재창고 18 · 휴게실 18 ㎡ 컨테이너 3동 · 발주자 땅) → 판정 · 붙일 서류 · 존치기간 · 대지소유 √ · 합계 72 ㎡ ·
 *      첨부 «✓ 냄» · 대지사용승낙서 · 설치 전 7일 · 7가지 · 285일 · 연장신고 기한 · 기한(오늘 기준) · 배치도 · 평면도 칸에 이 서식의 예시 그림(현장 사진 아님)
 *   ④ 이용자처럼: 다른 서식에 쓴 회사 · 사업자 · 전화 · 현장 위치 · 준공일 5칸 + 제출일(오늘) · 용도 칩 고르기 · 컨테이너 옥상 · 계획시설 · 함께 냄 ·
 *      본인 땅 · 3층 · 그 밖의 용도 3년(EDATE) · 끝날 앞섬 · 설치 뒤 제출 · 존치 끝남 · 연장 기한 지남 · × 남음 · 새로고침 그대로 · 상호가 다른 서식에 먼저
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
const SLUG = 'gaseol-chukjo-singo'
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
const 기한글 = (끝) => (끝 < 오늘 ? `⚠ 존치기간이 ${날글(끝)} 에 끝났습니다 — 철거하거나 바로 구청 건축과에 문의`
  : 끝 - 7 < 오늘 ? '⚠ 연장신고 기한(만료 7일 전)이 지났습니다 — 바로 구청 건축과에 문의'
    : `존치기간 끝 ${날글(끝)} — 오늘부터 ${쉼(끝 - 오늘)}일 남음 · 늘려야 하면 만료 7일 전까지 연장신고`)
const 공사용 = '공사용 가설건축물 · 공작물(현장사무실 · 창고 · 숙소 등)'
const 컨테이너 = '컨테이너 임시사무실 · 임시창고 · 임시숙소'
const 그밖 = '그 밖(재해복구 · 흥행 · 전람회 · 가설점포 등)'
const 대상 = '✓ 신고 대상 — 설치(착공) 전에 시 · 군 · 구청 건축신고 부서 · 처리기간 3일'
const 구조서류 = ' · 입면도 · 단면도 · 구조도 · 구조계산서 · 구조안전 · 피난안전 확인서'
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
/* 칸 안 그림 색 — [종이 % · 컨테이너 파랑 % · 창 연파랑 % · 벽 % · 평균 밝기] (안 = 칸 가장자리에서 뺄 몫) */
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
  return cv.evaluate((el, [b, W, m]) => {
    const k = el.width / W
    const x0 = Math.round((b.x + b.w * m) * k), y0 = Math.round((b.y + b.h * m) * k), w = Math.max(1, Math.round(b.w * (1 - 2 * m) * k)), h = Math.max(1, Math.round(b.h * (1 - 2 * m) * k))
    const d = el.getContext('2d').getImageData(x0, y0, w, h).data
    let 종 = 0, 컨 = 0, 창 = 0, 벽 = 0, 밝 = 0
    const 가깝 = (i, r, g2, b2, t = 14) => Math.abs(d[i] - r) <= t && Math.abs(d[i + 1] - g2) <= t && Math.abs(d[i + 2] - b2) <= t
    for (let i = 0; i < d.length; i += 4) {
      밝 += (d[i] + d[i + 1] + d[i + 2]) / 3
      if (가깝(i, 245, 242, 234, 10)) 종++    // 예시 그림 종이색 #f5f2ea
      if (가깝(i, 219, 234, 254, 8)) 컨++     // 컨테이너 #dbeafe
      if (가깝(i, 147, 197, 253)) 창++        // 창 #93c5fd
      if (가깝(i, 55, 65, 81)) 벽++           // 벽 · 경계 #374151
    }
    const q = d.length / 4
    return [Math.round(종 / q * 100), +(컨 / q * 100).toFixed(2), +(창 / q * 100).toFixed(2), +(벽 / q * 100).toFixed(2), Math.round(밝 / q)]
  }, [상자, 판.W, 안])
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
  ok('서식 탭에 «가설건축물 축조신고서» 카드(링크)', 링크 > 0, 링크)
  for (const 말 of ['가설건축물 축조신고', '현장사무실 가설건축물', '컨테이너 가설건축물 신고', '대지사용승낙서', '가설건축물 존치기간']) {
    await p.fill('input[placeholder*="서식 찾기"]', 말)
    await p.waitForTimeout(500)
    const 있음 = await p.evaluate(() => /가설건축물 축조신고서/.test(document.querySelector('main').innerText))
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
  /* 🔎 검색 — 구운 장(prerender · 실제 사이트는 cleanUrls 로 이 파일을 먼저 줌)의 제목 · 설명 · 주소 · 구조화 자료 */
  const 구운 = await p.request.get(BASE + '/forms/' + SLUG + '.html')
  const 구h = 구운.status() === 200 ? await 구운.text() : ''
  ok('구운 장 제목 «가설건축물 축조신고서 양식 — 사이트에서 작성 …»', /<title>가설건축물 축조신고서 양식 — 사이트에서 작성[^<]*<\/title>/.test(구h), (구h.match(/<title>[^<]*/) || [구운.status()])[0])
  ok('구운 장 설명 — 찾는 말(축조신고 · 양식) · 현장사무실 · 컨테이너', /<meta name="description" content="가설건축물 축조신고서\(가설건축물 축조신고 · 가설건축물 축조신고서 양식\) 양식[^"]*현장사무실[^"]*컨테이너/.test(구h))
  ok('구운 장 주소(canonical) · 구조화 자료(BreadcrumbList · CreativeWork) · h1', 구h.includes(`<link rel="canonical" href="https://k-conmap.com/forms/${SLUG}" />`) &&
    구h.includes('"@type":"BreadcrumbList"') && 구h.includes('"@type":"CreativeWork"') && /<h1[^>]*>가설건축물 축조신고서 양식/.test(구h))
  const 본문 = await p.evaluate(() => document.querySelector('main').innerText)
  for (const t of ['제20조', '제15조', '제13조', '별지 제8호서식', '별지 제11호서식']) ok(`근거 «${t}» 보임`, 본문.includes(t))
  ok('새 서식 — «무료» 안 씀', !/무료/.test(본문), (본문.match(/.{0,20}무료.{0,20}/) || [''])[0])
  ok('«클로드» 안 씀', !/클로드/.test(본문))
  ok('글에 [ ]( ) 꼴이 그대로 안 보임', !/\]\(\/forms\//.test(본문))
  const 엑셀 = await p.evaluate((s) => [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')).filter((h) => h.endsWith('/forms/' + s + '.xlsx')).length, SLUG)
  ok('빈 틀 엑셀 받기 링크', 엑셀 > 0, 엑셀)
  const r = await p.request.get(BASE + '/forms/' + SLUG + '.xlsx')
  const 몸 = await r.body()
  ok('받는 파일이 엑셀(zip · 시트 6장)', r.status() === 200 && 몸[0] === 0x50 && 몸[1] === 0x4b && (몸.toString('latin1').match(/xl\/worksheets\/sheet\d+\.xml/g) || []).length >= 6, [r.status(), 몸.length])
  ok('📄 PDF 저장 단추', (await p.locator('button', { hasText: 'PDF 저장' }).count()) > 0)
  const 다음 = await p.evaluate(() => [...document.querySelectorAll('.flist a.flink[href]')].map((a) => [a.getAttribute('href'), a.textContent.trim()]))
  ok('«놓치기 쉬운 것» 에 특정공사 사전신고서 링크', 다음.some(([h, t]) => h === '/forms/teukjeong-singo' && t === '특정공사 사전신고서'), 다음)
  ok('«놓치기 쉬운 것» 에 비산먼지 발생사업 신고서 링크', 다음.some(([h, t]) => h === '/forms/bisan-singo' && t === '비산먼지 발생사업 신고서'), 다음)
  await 칸누르기(p, '배치도', '배치도')
  ok('배치도 칸을 누르면 «📷 사진 고르기»', await p.evaluate(() => !!document.querySelector('.gx-ed-ph')))
  await 칸누르기(p, '배치도', '평면도')
  ok('평면도 칸도 사진 칸', await p.evaluate(() => !!document.querySelector('.gx-ed-ph')))
  await 칸누르기(p, '대지사용승낙서', '승낙자')
  ok('승낙자 칸은 글 칸(사진 아님)', await p.evaluate(() => !document.querySelector('.gx-ed-ph') && !!document.querySelector('.gx-ed-r .fw-in')), await 이름칸(p))
  await 칸누르기(p, '판정', '축조용도')
  const 칩 = await p.evaluate(() => [...document.querySelectorAll('.gx-ed-ch .gx-chip')].map((x) => x.textContent))
  ok('용도 칸 → 고르는 단추 4개(공사용 · 컨테이너 · 견본주택 · 그 밖)', JSON.stringify(칩) === JSON.stringify([공사용, 컨테이너, '견본주택', 그밖]), 칩)
  ok('아무것도 안 적으면 판정 · 붙일 서류 · 존치 빈칸', (await 값은(p, '판정', '판정')) === '' && (await 값은(p, '판정', '붙일것')) === '' && (await 값은(p, '신고서', '존치표시')) === '          년        월        일까지')
  await p.locator('.gx-ed-x').click()

  console.log('③ ✍ 예시 채우기 → 자동 칸')
  await p.locator('button', { hasText: '예시 채우기' }).click()
  await p.waitForTimeout(300)
  const 모든값 = await p.evaluate(() => { const g = window.__격자; const out = []; g.doc.sheets.forEach((s, si) => { for (const x of s.cells) if (x[5] === 2 || x[5] === 3) { const v = g.책.값(si, x[0], x[1]); out.push(v && v.e ? '#' + v.e : v) } }); return out })
  const 오류칸 = 모든값.filter((v) => typeof v === 'string' && v.startsWith('#'))
  ok('오류 칸 0', !오류칸.length, 오류칸.slice(0, 5))
  ok('판정 «✓ 신고 대상 …»', (await 값은(p, '판정', '판정')) === 대상, await 값은(p, '판정', '판정'))
  ok('붙일 서류 «배치도 · 평면도 · 대지사용승낙서»', (await 값은(p, '판정', '붙일것')) === '배치도 · 평면도 · 대지사용승낙서', await 값은(p, '판정', '붙일것'))
  ok('확인할 것 — 계획시설 · 함께 냄 · 남의 땅 · 2층 이하 · 옥상(컨테이너 아님 → 빈칸)',
    (await 값은(p, '판정', '계획판정')) === '✓ 신고(제20조제3항)' && (await 값은(p, '판정', '함께판정')) === '따로 신고' &&
    (await 값은(p, '판정', '땅판정')) === '→ 대지사용승낙서를 붙임(시행규칙 제13조제1항제2호)' && (await 값은(p, '판정', '층판정')) === '2층 이하' &&
    (await 값은(p, '판정', '최고층')) === 1 && (await 값은(p, '판정', '옥상판정')) === '')
  ok('존치기간 = 공사 준공일 2027. 8. 31. · «✓ 공사용 — 해당 공사의 완료일까지»', (await 값은(p, '판정', '존치끝일')) === 일련(2027, 8, 31) && (await 값은(p, '판정', '존치판정')) === '✓ 공사용 — 해당 공사의 완료일까지')
  ok('신고서 대지소유구분 «[√] 타인소유»', (await 값은(p, '신고서', '소유표시')) === '[  ] 본인소유   [√] 타인소유', await 값은(p, '신고서', '소유표시'))
  ok('건축면적 · 연면적 합계 72 ㎡(36 + 18 + 18)', (await 값은(p, '신고서', '전건축')) === 72 && (await 값은(p, '신고서', '전연면적')) === 72)
  ok('존치기간 «2027년 8월 31일까지» · 건축주 표시', (await 값은(p, '신고서', '존치표시')) === '2027년 8월 31일까지' && (await 값은(p, '신고서', '건축주표시')) === '예시건설(주) 대표이사 홍길동')
  const 첨 = []
  for (let j = 1; j <= 6; j++) 첨.push(await 값은(p, '신고안내', `첨낼#${j}`))
  ok('신고안내 첨부 «✓ 냄» 셋 · 구조 서류 «해당 없음»', JSON.stringify(첨) === JSON.stringify(['✓ 냄', '✓ 냄', '✓ 냄', '해당 없음', '해당 없음', '해당 없음']), 첨)
  ok('대지사용승낙서 — 소재지 · 면적 · 건축면적 저절로', (await 값은(p, '대지사용승낙서', '승소재')) === '가나시 다라구 사아동 56-7' && (await 값은(p, '대지사용승낙서', '승면적')) === 1850 &&
    (await 값은(p, '대지사용승낙서', '승건축')) === 72 && (await 값은(p, '대지사용승낙서', '승낙대상')) === '')
  ok('대지사용승낙서 — 목적 · 기간 저절로', (await 값은(p, '대지사용승낙서', '승목적')) === '가설건축물 축조 — ' + 공사용 &&
    (await 값은(p, '대지사용승낙서', '승기간')) === '2026. 11. 20. ~ 2027. 8. 31.  (가설건축물 존치기간)', await 값은(p, '대지사용승낙서', '승기간'))
  ok('대지사용승낙서 — 사용자 = 건축주(이름 · 주소 · 전화)', (await 값은(p, '대지사용승낙서', '사용자')) === '예시건설(주) 대표이사 홍길동' &&
    (await 값은(p, '대지사용승낙서', '사주소')) === '가나시 다라구 마바로 45, 2층' && (await 값은(p, '대지사용승낙서', '사전화')) === '000-0000-0000')
  ok('확인 — 판정 · «✓ 설치 전 신고 (7일 앞 · 처리기간 3일)» · «✓ 7가지 모두 확인»', (await 값은(p, '확인', '확판정')) === 대상 &&
    (await 값은(p, '확인', '설치전')) === '✓ 설치 전 신고 (7일 앞 · 처리기간 3일)' && (await 값은(p, '확인', '제출요약')) === '✓ 7가지 모두 확인 — 제출', await 값은(p, '확인', '설치전'))
  ok('존치기간 «2026. 11. 20. ~ 2027. 8. 31.  (285일)»', (await 값은(p, '확인', '확존치')) === '2026. 11. 20. ~ 2027. 8. 31.  (285일)', await 값은(p, '확인', '확존치'))
  ok('연장신고 기한 «만료 7일 전 — 2027. 8. 24. 까지 …(별지 제11호서식)»', (await 값은(p, '확인', '연장기한')) === '만료 7일 전 — 2027. 8. 24. 까지 존치기간 연장신고서(별지 제11호서식)', await 값은(p, '확인', '연장기한'))
  ok(`기한(오늘 기준) «${기한글(일련(2027, 8, 31))}»`, (await 값은(p, '확인', '기한')) === 기한글(일련(2027, 8, 31)), await 값은(p, '확인', '기한'))
  /* 📐 예시 그림 — 이 서식 것(가설건축물 배치도 · 평면도 — 현장 사진 아님) */
  await p.waitForFunction(() => /사진 2장을 넣었습니다/.test(document.body.innerText), null, { timeout: 15000 }).catch(() => {})
  ok('예시 채우기 → «📷 사진 2장을 넣었습니다»', /사진 2장을 넣었습니다/.test(await p.evaluate(() => document.body.innerText)))
  const 색1 = await 칸색(p, '배치도', '배치도')
  ok(`배치도 칸 = 가설건축물 배치도 그림(종이 ${색1[0]} % · 컨테이너 파랑 ${색1[1]} % · 경계 ${색1[3]} %)`, 색1[0] >= 30 && 색1[1] > 0.5 && 색1[3] > 0.2, 색1)
  const 색2 = await 칸색(p, '배치도', '평면도')
  ok(`평면도 칸 = 가설건축물 평면도 그림(종이 ${색2[0]} % · 창 ${색2[2]} % · 벽 ${색2[3]} %)`, 색2[0] >= 30 && 색2[2] > 0.1 && 색2[3] > 1, 색2)
  ok('오류 0(PC · 예시)', !오류.length, 오류)
  await p.locator('.flist a[href="/forms/bisan-singo"]').first().click()
  await p.waitForURL(/\/forms\/bisan-singo$/, { timeout: 10000 })
  await p.waitForTimeout(600)
  ok('비산먼지 발생사업 신고서로 감 → 거기서 이 서식으로 오는 링크', await p.evaluate((s) => [...document.querySelectorAll('.flist a[href]')].some((a) => a.getAttribute('href') === '/forms/' + s), SLUG))
  await p.goto(BASE + '/forms/teukjeong-singo', { waitUntil: 'domcontentloaded' })
  await p.waitForFunction(() => window.__격자 && document.querySelectorAll('canvas.gx-page').length, null, { timeout: 25000 })
  ok('특정공사 사전신고서에서도 이 서식으로 오는 링크', await p.evaluate((s) => [...document.querySelectorAll('.flist a[href]')].some((a) => a.getAttribute('href') === '/forms/' + s), SLUG))
  ok('오류 0(다음 서류)', !오류.length, 오류)
  await ctx.close()
}

console.log('④ 이용자처럼 빈 종이에 적기 (PC) — 다른 서식에 쓴 값이 먼저 들어옴')
const 준공 = 오늘 + 200
{
  const { ctx, p, 오류 } = await 새쪽(1280, 900, false)
  await 종이(p)
  await p.evaluate((공) => { localStorage.removeItem('kcm.격자'); localStorage.setItem('kcm.서식공통', JSON.stringify(공)) },
    { 현장: '시험 근린생활시설 신축공사', 회사: '시험건설(주)', 대표: '김시험', 위치: '가나시 다라구 일원', 착공: 날ISO(오늘 + 20), 준공: 날ISO(준공), 발주: '시험 발주청', 대리인: '박현장', 연락처: '000-1111-2222', 사업자: '000-11-22222' })
  await 종이(p)
  const 말 = await p.locator('.fw-say').innerText().catch(() => '')
  ok('«✨ 공사명 · 회사 등 5칸을 지난번 쓴 값으로 채웠습니다»', /공사명 · 회사 등 5칸을 지난번 쓴 값으로 채웠습니다/.test(말), 말)
  const 들어옴 = {}
  for (const k of ['상호', '사업자등록번호', '전화번호', '현장소재지', '제출일']) 들어옴[k] = await 값은(p, '신고서', k)
  들어옴.준공일 = await 값은(p, '판정', '준공일')
  ok('신고서 4칸 + 제출일(오늘) + 판정 준공일', JSON.stringify(들어옴) === JSON.stringify({ 상호: '시험건설(주)', 사업자등록번호: '000-11-22222', 전화번호: '000-1111-2222', 현장소재지: '가나시 다라구 일원', 제출일: 오늘, 준공일: 준공 }), 들어옴)
  ok('대지사용승낙서 사용자 · 전화 저절로 · 승낙일은 빈칸', (await 값은(p, '대지사용승낙서', '사용자')) === '시험건설(주)' && (await 값은(p, '대지사용승낙서', '사전화')) === '000-1111-2222' && !(await 값은(p, '대지사용승낙서', '승낙일')))
  ok('용도를 안 고르면 판정 · 존치 빈칸(준공일만 있어도)', (await 값은(p, '판정', '판정')) === '' && (await 값은(p, '판정', '존치끝일')) === '' && (await 값은(p, '확인', '기한')) === '')
  /* 용도 — 종이의 칸을 눌러 단추로 고름 */
  await 칸누르기(p, '판정', '축조용도')
  ok('용도 칸을 누르면 아래 쓰는 칸이 열림', /용\s*도/.test(await 이름칸(p)), await 이름칸(p))
  await p.locator('.gx-ed-ch .gx-chip', { hasText: '컨테이너 임시사무실' }).click()
  await p.waitForTimeout(250)
  ok('«컨테이너 …» 단추 → 들어가고 다음 칸(옥상)으로', (await 값은(p, '판정', '축조용도')) === 컨테이너 && /옥상/.test(await 이름칸(p)), [await 값은(p, '판정', '축조용도'), await 이름칸(p)])
  await p.locator('.gx-ed-ch .gx-chip', { hasText: '예' }).first().click()
  await p.waitForTimeout(250)
  ok('옥상 «예» → ⚠ 옥상 컨테이너는 신고 가설건축물이 아님', (await 값은(p, '판정', '옥상판정')) === '⚠ 건축물 옥상의 컨테이너는 신고 가설건축물에서 빠짐(영 제15조제5항제8호)' &&
    (await 값은(p, '판정', '판정')) === '⚠ 건축물 옥상의 컨테이너는 신고 대상 가설건축물이 아님 — 시 · 군 · 구 건축과에 먼저 확인', await 값은(p, '판정', '판정'))
  await p.locator('.gx-ed-x').click()
  await 넣음(p, '판정', '옥상', '아니오')
  ok('옥상 «아니오» → ✓ 옥상 아님 · ✓ 신고 대상', (await 값은(p, '판정', '옥상판정')) === '✓ 옥상 아님' && (await 값은(p, '판정', '판정')) === 대상)
  ok('컨테이너는 «존치 끝날» 을 적어야 존치기간이 생김(준공일 안 씀)', (await 값은(p, '판정', '존치끝일')) === '' && (await 값은(p, '신고서', '존치표시')) === '          년        월        일까지')
  await 넣음(p, '판정', '계획시설', '예')
  ok('도시 · 군계획시설 «예» → ⚠ «허가» 대상(제20조제1항)', (await 값은(p, '판정', '계획판정')) === '⚠ 신고가 아니라 «허가» 대상(건축법 제20조제1항)' &&
    (await 값은(p, '판정', '판정')) === '⚠ 도시 · 군계획시설(예정지) 안 — 신고가 아니라 «허가» 대상(건축법 제20조제1항) · 시 · 군 · 구 건축과에 먼저 확인')
  await 넣음(p, '판정', '계획시설', '아니오')
  await 넣음(p, '판정', '축조용도', 공사용); await 넣음(p, '판정', '함께냄', '예')
  ok('공사용 · 건축허가 때 함께 냄 «예» → 따로 내지 않음(영 제15조제8항 단서)', (await 값은(p, '판정', '함께판정')) === '✓ 함께 냈으면 축조신고서는 내지 않음(영 제15조제8항 단서)' &&
    (await 값은(p, '판정', '판정')) === '✓ 건축허가 때 함께 냈으면 축조신고서는 따로 내지 않음(영 제15조제8항 단서)' && (await 값은(p, '판정', '옥상판정')) === '')
  await 넣음(p, '판정', '함께냄', '아니오')
  ok('공사용 → 존치기간 = 준공일(다른 서식에서 온 날) · 신고서 «…까지»', (await 값은(p, '판정', '존치끝일')) === 준공 && (await 값은(p, '신고서', '존치표시')) === `${날(준공).getUTCFullYear()}년 ${날(준공).getUTCMonth() + 1}월 ${날(준공).getUTCDate()}일까지`)
  /* 땅 · 층 */
  await 넣음(p, '판정', '대지소유', '본인소유')
  ok('본인 땅 → 승낙서 없음 · [√] 본인소유 · 첨부 3 «해당 없음» · 승낙서 장에 안내', (await 값은(p, '판정', '붙일것')) === '배치도 · 평면도' && (await 값은(p, '신고서', '소유표시')) === '[√] 본인소유   [  ] 타인소유' &&
    (await 값은(p, '신고안내', '첨낼#3')) === '해당 없음' && (await 값은(p, '대지사용승낙서', '승낙대상')) === '※ 본인 땅이면 이 장은 내지 않습니다.' && (await 값은(p, '판정', '땅판정')) === '본인 땅 — 대지사용승낙서 없음')
  await 넣음(p, '신고서', '동별#1', '숙소동'); await 넣음(p, '신고서', '건축면적#1', 40.5); await 넣음(p, '신고서', '연면적#1', 121.5); await 넣음(p, '신고서', '층수#1', 3)
  await 넣음(p, '신고서', '동별#2', '창고'); await 넣음(p, '신고서', '건축면적#2', 18); await 넣음(p, '신고서', '연면적#2', 18); await 넣음(p, '신고서', '층수#2', 1)
  ok('3층 동 → 최고층 3 · 구조 서류까지 · 첨부 4 ~ 6 «✓ 심의 생략 때»', (await 값은(p, '판정', '최고층')) === 3 && (await 값은(p, '판정', '붙일것')) === '배치도 · 평면도' + 구조서류 &&
    (await 값은(p, '신고안내', '첨낼#4')) === '✓ 심의 생략 때' && (await 값은(p, '신고안내', '첨낼#6')) === '✓ 심의 생략 때' &&
    (await 값은(p, '판정', '층판정')) === '→ 3층 이상 — 입면도 · 단면도 · 구조도 · 구조계산서 · 구조안전 · 피난안전 확인서(심의를 생략하려면)')
  ok('합계 58.5 ㎡ · 연면적 139.5 ㎡(소수 그대로)', (await 값은(p, '신고서', '전건축')) === 58.5 && (await 값은(p, '신고서', '전연면적')) === 139.5, [await 값은(p, '신고서', '전건축'), await 값은(p, '신고서', '전연면적')])
  /* 그 밖의 용도 — 3년(EDATE) */
  const 설치 = 일련(2026, 12, 1)
  await 넣음(p, '판정', '축조용도', 그밖); await 넣음(p, '판정', '설치일', 설치); await 넣음(p, '판정', '존치끝', 일련(2029, 12, 1))
  ok('그 밖의 용도 · 2026. 12. 1. ~ 2029. 12. 1. → «✓ 3년 이내»', (await 값은(p, '판정', '존치끝일')) === 일련(2029, 12, 1) && (await 값은(p, '판정', '존치판정')) === '✓ 3년 이내', await 값은(p, '판정', '존치판정'))
  await 넣음(p, '판정', '존치끝', 일련(2029, 12, 2))
  ok('하루 넘김(2029. 12. 2.) → «⚠ 3년을 넘음 …»', (await 값은(p, '판정', '존치판정')) === '⚠ 3년을 넘음 — 3년 이내로(연장은 조례로 정한 횟수만큼)', await 값은(p, '판정', '존치판정'))
  await 넣음(p, '판정', '존치끝', 일련(2026, 11, 30))
  ok('끝날이 설치일보다 앞 → «⚠ 끝날이 설치일보다 앞섬»', (await 값은(p, '판정', '존치판정')) === '⚠ 끝날이 설치일보다 앞섬')
  /* 설치 뒤 제출 · 존치 끝남 · 연장 기한 지남 */
  await 넣음(p, '판정', '축조용도', 공사용); await 넣음(p, '판정', '설치일', 오늘 - 3)
  ok('제출일(오늘)이 설치일 뒤 → ⚠ 신고한 뒤에 설치', (await 값은(p, '확인', '설치전')) === '⚠ 제출일이 설치일 뒤 — 신고한 뒤에 설치(착공)합니다(건축법 제20조제3항)', await 값은(p, '확인', '설치전'))
  await 넣음(p, '판정', '설치일', 오늘 + 10)
  ok('설치 10일 전 제출 → «✓ 설치 전 신고 (10일 앞 · 처리기간 3일)»', (await 값은(p, '확인', '설치전')) === '✓ 설치 전 신고 (10일 앞 · 처리기간 3일)', await 값은(p, '확인', '설치전'))
  await 넣음(p, '판정', '준공일', 오늘 + 3)
  ok('준공(존치 끝) 3일 남음 → «⚠ 연장신고 기한(만료 7일 전)이 지났습니다»', (await 값은(p, '확인', '기한')) === 기한글(오늘 + 3) && 기한글(오늘 + 3).startsWith('⚠ 연장신고'), await 값은(p, '확인', '기한'))
  await 넣음(p, '판정', '준공일', 오늘 - 2)
  ok('존치 끝이 지남 → «⚠ 존치기간이 … 에 끝났습니다»', (await 값은(p, '확인', '기한')) === 기한글(오늘 - 2) && 기한글(오늘 - 2).startsWith('⚠ 존치기간이'), await 값은(p, '확인', '기한'))
  await 넣음(p, '판정', '준공일', 준공)
  ok(`준공 되돌림 → 기한 «${기한글(준공)}» · 연장기한 «${날글(준공 - 7)} 까지»`, (await 값은(p, '확인', '기한')) === 기한글(준공) && (await 값은(p, '확인', '연장기한')) === `만료 7일 전 — ${날글(준공 - 7)} 까지 존치기간 연장신고서(별지 제11호서식)`)
  /* 제출 전 확인 */
  for (let j = 1; j <= 6; j++) await 넣음(p, '확인', `제출#${j}`, '○')
  await 넣음(p, '확인', '제출#7', '×')
  ok('× 하나 → «⚠ 남은 것 1가지»', (await 값은(p, '확인', '제출요약')) === '⚠ 남은 것 1가지', await 값은(p, '확인', '제출요약'))
  await 넣음(p, '확인', '제출#7', '○')
  ok('→ «✓ 7가지 모두 확인 — 제출»', (await 값은(p, '확인', '제출요약')) === '✓ 7가지 모두 확인 — 제출')
  /* 마지막 한 칸은 종이에서 — 새로고침해도 그대로 */
  await 쳐넣기(p, '신고서', '지번', '12-3')
  ok('지번 쳐 넣음 → 승낙서 소재지 «가나시 다라구 일원 12-3»', (await 값은(p, '신고서', '지번')) === '12-3' && (await 값은(p, '대지사용승낙서', '승소재')) === '가나시 다라구 일원 12-3', await 값은(p, '대지사용승낙서', '승소재'))
  await p.waitForTimeout(1000)
  await 종이(p)
  ok('새로고침 → 판정 · 붙일 서류 · 합계 · 확인 그대로(이 기기)', (await 값은(p, '판정', '판정')) === 대상 && (await 값은(p, '판정', '붙일것')) === '배치도 · 평면도' + 구조서류 &&
    (await 값은(p, '신고서', '전건축')) === 58.5 && (await 값은(p, '확인', '제출요약')) === '✓ 7가지 모두 확인 — 제출' && (await 값은(p, '신고서', '지번')) === '12-3')
  ok('새로고침 → 기한 다시 셈(오늘 기준)', (await 값은(p, '확인', '기한')) === 기한글(준공))
  /* 여기 쓴 상호 → 다른 서식(비산먼지 발생사업 신고서)에 먼저 */
  await 쳐넣기(p, '신고서', '상호', '새시험건설(주)')
  await p.waitForTimeout(300)
  await p.goto(BASE + '/forms/bisan-singo', { waitUntil: 'domcontentloaded' })
  await p.waitForFunction(() => window.__격자 && document.querySelectorAll('canvas.gx-page').length, null, { timeout: 25000 })
  await p.waitForTimeout(400)
  const 다른 = await p.evaluate(() => { const g = window.__격자; for (let si = 0; si < g.doc.sheets.length; si++) { const s = g.doc.sheets[si]; const a = Object.entries(s.keys).find(([, k]) => k === '상호'); if (a) { const m = /^([A-Z]+)(\d+)$/.exec(a[0]); let c = 0; for (const ch of m[1]) c = c * 26 + ch.charCodeAt(0) - 64; return [g.책.값(si, +m[2], c)] } } return null })
  ok('여기 고친 상호가 비산먼지 발생사업 신고서에 먼저 들어감', !!다른 && 다른[0] === '새시험건설(주)', 다른)
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
    ok('폰 390 예시 채우기 → 판정 ✓', (await 값은(s.p, '판정', '판정')) === 대상)
    ok('폰 390 넘침 0(예시 뒤)', (await 넘침(s.p)) <= 1, await 넘침(s.p))
  }
  ok(`폰 ${w} 오류 0`, !s.오류.length, s.오류)
  await s.ctx.close()
}
await b.close()
console.log(`\n${bad ? '✗' : '✓'} 시험_가설건축물신고화면 ${n - bad}/${n}`)
process.exit(bad ? 1 : 0)
