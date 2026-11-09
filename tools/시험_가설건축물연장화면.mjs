/**
 * ⏳ G617 «가설건축물 존치기간 연장신고서» 서식 화면 시험 — 구운 사이트(dist + web/public/forms/g)를 띄운 뒤:
 *   node tools/시험_가설건축물연장화면.mjs [주소=http://127.0.0.1:4996]
 *   소장님 「서식과 입찰로 우리 사이트를 키우자 … 꼭 검색이 되게 하고 … 하루에 조금씩 만들어 나가자」(11-09) → 차례 1 둘째(G616 축조신고서 다음)
 *   ① 서식 탭 카드 · 찾기(«가설건축물 존치기간 연장» · «존치기간 연장신고서» · «컨테이너 존치기간 연장» · «가설건축물 연장신고»)
 *   ② 구운 장(제목 · 설명 · canonical · 구조화 자료) · 근거(제15조의2 · 제15조의3 · 제13조 · 별지 제11호서식) · «무료» · «클로드» 없음 · 빈 틀 엑셀(시트 4장) · PDF ·
 *      축조신고서 링크(서로) · 사진 칸 넷 · 연장사유 글 칸 · 고르는 단추(신고 · 허가)
 *   ③ «✍ 예시 채우기» → 판정 · 연장 존치기간 · 122일 · 기한(만료 7일 전) · 신고서 · 사진 넷(1개월 안) · 확인 · 기한(오늘 기준) · 다음 기한 · 사진 칸에 이 서식의 예시 그림(앞 · 뒤 · 양옆)
 *   ④ 이용자처럼: 다른 서식에 쓴 회사 · 위치 · 전화 3칸 + 제출일(오늘) · 준공일은 안 들어감 · 단추로 고름 · 허가 14일 · 신고 7일 · 공장(영 제15조의3) · 그 밖 3년(EDATE) ·
 *      끝날 앞섬 · 빈 끝날 · 찍은 날 1개월 경계 · 제출일 뒤 · 기한 뒤 제출 · 기한 지남 · 존치 끝남 · × · 찍은 날(EXIF) 있는 사진을 넣으면 «찍은 날» 저절로 · 새로고침 그대로
 *   ⑤ 폰 390 · 360: 종이 뜸 · 가로 넘침 0 · 오류 0
 * 인터넷 안 부름(파이어베이스 · 광고 · 애널리틱스 막음) · 파일은 받지 않고 주소만 확인.
 */
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { 판짜기, 칸상자, 칸쪽 } from '../web/src/lib/격자그림.js'
import { 열번호 } from '../web/src/lib/엑셀셈.js'
import { 때넣기 } from '../web/src/lib/사진예시.js'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const BASE = process.argv[2] || 'http://127.0.0.1:4996'
const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const SLUG = 'gaseol-jonchi-yeonjang'
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
const 기한글 = (만료, 기한) => (만료 < 오늘 ? `⚠ 존치기간이 ${날글(만료)} 에 끝났습니다 — 철거하거나 바로 구청 건축과에 문의`
  : 기한 < 오늘 ? `⚠ 연장신고 기한(${날글(기한)})이 지났습니다 — 바로 구청 건축과에 문의`
    : `연장신고 기한 ${날글(기한)} — 오늘부터 ${쉼(기한 - 오늘)}일 남음`)
const 신고 = '신고 대상(가설건축물 축조신고)', 허가 = '허가 대상(가설건축물 건축허가)'
const 공사용 = '공사용 가설건축물(현장사무실 · 창고 · 숙소 등)', 그밖 = '그 밖의 가설건축물'
const 사진다 = '✓ 앞 · 뒤 · 양옆 4장 — 모두 제출일 전 1개월 안'
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
      if (가깝(i, 223, 229, 234, 6)) 컨++     // 컨테이너 벽 #dfe5ea
      if (가깝(i, 142, 197, 232, 8)) 창++     // 유리 #8ec5e8
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
  ok('서식 탭에 «가설건축물 존치기간 연장신고서» 카드(링크)', 링크 > 0, 링크)
  for (const 말 of ['가설건축물 존치기간 연장', '존치기간 연장신고서', '컨테이너 존치기간 연장', '가설건축물 연장신고']) {
    await p.fill('input[placeholder*="서식 찾기"]', 말)
    await p.waitForTimeout(500)
    const 있음 = await p.evaluate(() => /가설건축물 존치기간 연장신고서/.test(document.querySelector('main').innerText))
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
  ok('구운 장 제목 «가설건축물 존치기간 연장신고서 양식 — 사이트에서 작성 …»', /<title>가설건축물 존치기간 연장신고서 양식 — 사이트에서 작성[^<]*<\/title>/.test(구h), (구h.match(/<title>[^<]*/) || [구운.status()])[0])
  ok('구운 장 설명 — 찾는 말(연장신고 · 양식) · 컨테이너', /<meta name="description" content="가설건축물 존치기간 연장신고서\(가설건축물 존치기간 연장신고 · 가설건축물 존치기간 연장신고서 양식\) 양식[^"]*/.test(구h))
  ok('구운 장 주소(canonical) · 구조화 자료 · h1', 구h.includes(`<link rel="canonical" href="https://k-conmap.com/forms/${SLUG}" />`) &&
    구h.includes('"@type":"BreadcrumbList"') && 구h.includes('"@type":"CreativeWork"') && /<h1[^>]*>가설건축물 존치기간 연장신고서 양식/.test(구h))
  const 본문 = await p.evaluate(() => document.querySelector('main').innerText)
  for (const t of ['제15조의2', '제15조의3', '제13조', '별지 제11호서식', '1개월']) ok(`근거 «${t}» 보임`, 본문.includes(t))
  ok('새 서식 — «무료» 안 씀', !/무료/.test(본문), (본문.match(/.{0,20}무료.{0,20}/) || [''])[0])
  ok('«클로드» 안 씀', !/클로드/.test(본문))
  ok('글에 [ ]( ) 꼴이 그대로 안 보임', !/\]\(\/forms\//.test(본문))
  const 엑셀 = await p.evaluate((s) => [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')).filter((h) => h.endsWith('/forms/' + s + '.xlsx')).length, SLUG)
  ok('빈 틀 엑셀 받기 링크', 엑셀 > 0, 엑셀)
  const r = await p.request.get(BASE + '/forms/' + SLUG + '.xlsx')
  const 몸 = await r.body()
  ok('받는 파일이 엑셀(zip · 시트 4장)', r.status() === 200 && 몸[0] === 0x50 && 몸[1] === 0x4b && (몸.toString('latin1').match(/xl\/worksheets\/sheet\d+\.xml/g) || []).length >= 4, [r.status(), 몸.length])
  ok('📄 PDF 저장 단추', (await p.locator('button', { hasText: 'PDF 저장' }).count()) > 0)
  const 다음 = await p.evaluate(() => [...document.querySelectorAll('.flist a.flink[href]')].map((a) => [a.getAttribute('href'), a.textContent.trim()]))
  ok('«놓치기 쉬운 것» 에 가설건축물 축조신고서 링크', 다음.some(([h, t]) => h === '/forms/gaseol-chukjo-singo' && t === '가설건축물 축조신고서'), 다음)
  for (let i = 1; i <= 4; i++) {
    await 칸누르기(p, '사진', `사진#${i}`)
    ok(`사진 칸 ${i} 을 누르면 «📷 사진 고르기»`, await p.evaluate(() => !!document.querySelector('.gx-ed-ph')))
  }
  await 칸누르기(p, '신고서', '연장사유')
  ok('연장사유 칸은 글 칸(사진 아님)', await p.evaluate(() => !document.querySelector('.gx-ed-ph') && !!document.querySelector('.gx-ed-r .fw-in')), await 이름칸(p))
  await 칸누르기(p, '판정', '구분')
  const 칩 = await p.evaluate(() => [...document.querySelectorAll('.gx-ed-ch .gx-chip')].map((x) => x.textContent))
  ok('처음 받은 것 → 고르는 단추 2개(신고 대상 · 허가 대상)', JSON.stringify(칩) === JSON.stringify([신고, 허가]), 칩)
  ok('아무것도 안 적으면 판정 · 연장 존치기간 빈칸', (await 값은(p, '판정', '판정')) === '' && (await 값은(p, '판정', '연장끝')) === '' && (await 값은(p, '신고서', '연장표시')) === '          년        월        일까지')
  await p.locator('.gx-ed-x').click()

  console.log('③ ✍ 예시 채우기 → 자동 칸')
  await p.locator('button', { hasText: '예시 채우기' }).click()
  await p.waitForTimeout(300)
  const 모든값 = await p.evaluate(() => { const g = window.__격자; const out = []; g.doc.sheets.forEach((s, si) => { for (const x of s.cells) if (x[5] === 2 || x[5] === 3) { const v = g.책.값(si, x[0], x[1]); out.push(v && v.e ? '#' + v.e : v) } }); return out })
  const 오류칸 = 모든값.filter((v) => typeof v === 'string' && v.startsWith('#'))
  ok('오류 칸 0', !오류칸.length, 오류칸.slice(0, 5))
  ok('판정 «✓ 연장 신고 — 2027. 8. 24.까지 · 앞 · 뒤 · 양옆 사진 …»', (await 값은(p, '판정', '판정')) === '✓ 연장 신고 — 2027. 8. 24.까지 · 앞 · 뒤 · 양옆 사진(제출일 전 1개월 안) 붙임', await 값은(p, '판정', '판정'))
  ok('연장 존치기간 2027. 12. 31. · 122일 늘어남 · 공사용 범위', (await 값은(p, '판정', '연장끝')) === 일련(2027, 12, 31) && (await 값은(p, '판정', '늘어난날')) === 122 &&
    (await 값은(p, '판정', '범위판정')) === '✓ 공사용 — 해당 공사의 완료일까지(영 제15조제7항 단서)')
  ok('기한 2027. 8. 24.(만료 7일 전) · 공장 «아니오»', (await 값은(p, '판정', '신고기한')) === 일련(2027, 8, 24) && (await 값은(p, '판정', '기한글')) === '만료 7일 전까지 연장 신고(영 제15조의2제2항제2호)' &&
    (await 값은(p, '판정', '공장판정')) === '연장하려면 기한 안에 신고(허가 신청)')
  ok('신고서 연장 존치기간 «2027년 12월 31일까지» · 건축주', (await 값은(p, '신고서', '연장표시')) === '2027년 12월 31일까지' && (await 값은(p, '신고서', '건축주표시')) === '예시건설(주) 대표이사 홍길동')
  const 촬 = []
  for (let i = 1; i <= 4; i++) 촬.push(await 값은(p, '사진', `촬확#${i}`))
  ok('사진 넷 «✓ 1개월 안» · 요약', 촬.every((x) => x === '✓ 1개월 안') && (await 값은(p, '사진', '사진요약')) === 사진다, 촬)
  ok('확인 — 판정 · «✓ 기한 안 제출 (4일 앞)» · 사진 · «✓ 6가지 모두 확인»', (await 값은(p, '확인', '확판정')) === (await 값은(p, '판정', '판정')) &&
    (await 값은(p, '확인', '기한안')) === '✓ 기한 안 제출 (4일 앞)' && (await 값은(p, '확인', '확사진')) === 사진다 && (await 값은(p, '확인', '제출요약')) === '✓ 6가지 모두 확인 — 제출')
  ok('늘린 존치기간 «2027. 8. 31. → 2027. 12. 31.  (122일 늘어남)»', (await 값은(p, '확인', '확존치')) === '2027. 8. 31. → 2027. 12. 31.  (122일 늘어남)', await 값은(p, '확인', '확존치'))
  ok(`기한(오늘 기준) «${기한글(일련(2027, 8, 31), 일련(2027, 8, 24))}»`, (await 값은(p, '확인', '기한')) === 기한글(일련(2027, 8, 31), 일련(2027, 8, 24)), await 값은(p, '확인', '기한'))
  ok('다음 기한 «… 또 늘리려면 2027. 12. 24. 까지 다시 연장»', (await 값은(p, '확인', '다음기한')) === '연장 뒤 존치기간 끝 2027. 12. 31. — 또 늘리려면 2027. 12. 24. 까지 다시 연장', await 값은(p, '확인', '다음기한'))
  /* 📐 예시 그림 — 이 서식 것(가설건축물 앞 · 뒤 · 양옆 — 현장 사진 아님) */
  await p.waitForFunction(() => /사진 4장을 넣었습니다/.test(document.body.innerText), null, { timeout: 15000 }).catch(() => {})
  ok('예시 채우기 → «📷 사진 4장을 넣었습니다»', /사진 4장을 넣었습니다/.test(await p.evaluate(() => document.body.innerText)))
  for (let i = 1; i <= 4; i++) {
    const 색 = await 칸색(p, '사진', `사진#${i}`)
    ok(`사진 칸 ${i} = 가설건축물 그림(컨테이너 벽 ${색[1]} % · 유리 ${색[2]} %)`, 색[1] > 5 && 색[2] > 0.3, 색)
  }
  ok('오류 0(PC · 예시)', !오류.length, 오류)
  await p.locator('.flist a[href="/forms/gaseol-chukjo-singo"]').first().click()
  await p.waitForURL(/\/forms\/gaseol-chukjo-singo$/, { timeout: 10000 })
  await p.waitForTimeout(600)
  ok('축조신고서로 감 → 거기서 이 서식으로 오는 링크', await p.evaluate((s) => [...document.querySelectorAll('.flist a[href]')].some((a) => a.getAttribute('href') === '/forms/' + s), SLUG))
  ok('오류 0(다음 서류)', !오류.length, 오류)
  await ctx.close()
}

console.log('④ 이용자처럼 빈 종이에 적기 (PC) — 다른 서식에 쓴 값이 먼저 들어옴')
{
  const { ctx, p, 오류 } = await 새쪽(1280, 900, false)
  await 종이(p)
  await p.evaluate((공) => { localStorage.removeItem('kcm.격자'); localStorage.setItem('kcm.서식공통', JSON.stringify(공)) },
    { 현장: '시험 근린생활시설 신축공사', 회사: '시험건설(주)', 대표: '김시험', 위치: '가나시 다라구 일원', 착공: 날ISO(오늘 - 100), 준공: 날ISO(오늘 + 60), 발주: '시험 발주청', 대리인: '박현장', 연락처: '000-1111-2222' })
  await 종이(p)
  const 말 = await p.locator('.fw-say').innerText().catch(() => '')
  ok('«✨ 공사명 · 회사 등 3칸을 지난번 쓴 값으로 채웠습니다»', /공사명 · 회사 등 3칸을 지난번 쓴 값으로 채웠습니다/.test(말), 말)
  const 들어옴 = {}
  for (const k of ['상호', '현장소재지', '전화번호', '제출일']) 들어옴[k] = await 값은(p, '신고서', k)
  ok('신고서 3칸 + 제출일(오늘)', JSON.stringify(들어옴) === JSON.stringify({ 상호: '시험건설(주)', 현장소재지: '가나시 다라구 일원', 전화번호: '000-1111-2222', 제출일: 오늘 }), 들어옴)
  ok('준공일은 «늘어난 준공일» 칸에 안 들어감(옛 준공일로 잘못 늘리지 않게)', !(await 값은(p, '판정', '연장준공일')) && !(await 값은(p, '판정', '만료일')))
  /* 처음 받은 것 — 종이의 칸을 눌러 단추로 */
  await 칸누르기(p, '판정', '구분')
  await p.locator('.gx-ed-ch .gx-chip', { hasText: '허가 대상' }).click()
  await p.waitForTimeout(250)
  ok('«허가 대상» 단추 → 들어가고 다음 칸(용도)으로', (await 값은(p, '판정', '구분')) === 허가 && /용\s*도/.test(await 이름칸(p)), [await 값은(p, '판정', '구분'), await 이름칸(p)])
  await p.locator('.gx-ed-ch .gx-chip', { hasText: '공사용' }).click()
  await p.waitForTimeout(250)
  await p.locator('.gx-ed-x').click().catch(() => {})
  await 넣음(p, '판정', '만료일', 오늘 + 30)
  ok('만료일만 → «⚠ 늘릴 끝날(공사용은 늘어난 준공일)을 적으세요»', (await 값은(p, '판정', '판정')) === '⚠ 늘릴 끝날(공사용은 늘어난 준공일)을 적으세요', await 값은(p, '판정', '판정'))
  await 넣음(p, '판정', '연장준공일', 오늘 + 200)
  ok(`허가 대상 → 기한 만료 14일 전(${날글(오늘 + 16)}) · «연장 허가 신청»`, (await 값은(p, '판정', '신고기한')) === 오늘 + 16 && (await 값은(p, '판정', '기한글')) === '만료 14일 전까지 연장 허가 신청(영 제15조의2제2항제1호)' &&
    (await 값은(p, '판정', '판정')) === `✓ 연장 허가 신청 — ${날글(오늘 + 16)}까지 · 앞 · 뒤 · 양옆 사진(제출일 전 1개월 안) 붙임`, await 값은(p, '판정', '판정'))
  ok('170일 늘어남 · 다음 기한도 14일 전', (await 값은(p, '판정', '늘어난날')) === 170 && (await 값은(p, '확인', '다음기한')) === `연장 뒤 존치기간 끝 ${날글(오늘 + 200)} — 또 늘리려면 ${날글(오늘 + 186)} 까지 다시 연장`)
  await 넣음(p, '판정', '구분', 신고)
  ok(`신고 대상 → 기한 만료 7일 전(${날글(오늘 + 23)})`, (await 값은(p, '판정', '신고기한')) === 오늘 + 23 && (await 값은(p, '확인', '기한')) === 기한글(오늘 + 30, 오늘 + 23), await 값은(p, '확인', '기한'))
  await 넣음(p, '판정', '공장', '예')
  ok('공장 · 예정지 «예» → 영 제15조의3 안내', (await 값은(p, '판정', '공장판정')) === '→ «연장을 원하지 않는다»고 알리지 않으면 같은 기간으로 연장한 것으로 봄(영 제15조의3) — 해당하는지 건축과에 확인')
  /* 그 밖의 용도 — 3년(EDATE) */
  await 넣음(p, '판정', '용도', 그밖)
  ok('그 밖 용도는 늘어난 준공일을 안 씀 → 끝날 빈칸', (await 값은(p, '판정', '연장끝')) === '' && (await 값은(p, '판정', '판정')) === '⚠ 늘릴 끝날(공사용은 늘어난 준공일)을 적으세요')
  const 삼년 = EDATE(오늘 + 30, 36)
  await 넣음(p, '판정', '새끝', 삼년)
  ok(`그 밖 · ${날글(삼년)}(3년 꼭) → «✓ 이번 연장 3년 안»`, (await 값은(p, '판정', '범위판정')) === '✓ 이번 연장 3년 안 — 횟수별 3년의 범위(몇 번까지는 건축조례)', await 값은(p, '판정', '범위판정'))
  await 넣음(p, '판정', '새끝', 삼년 + 1)
  ok('하루 넘김 → «⚠ 한 번에 3년을 넘음»', (await 값은(p, '판정', '범위판정')) === '⚠ 한 번에 3년을 넘음 — 횟수별 3년의 범위에서(영 제15조제7항)', await 값은(p, '판정', '범위판정'))
  await 넣음(p, '판정', '새끝', 오늘 + 10)
  ok('늘릴 끝날이 만료일보다 앞 → ⚠ (판정 · 확인 둘 다)', (await 값은(p, '판정', '판정')) === '⚠ 늘릴 끝날이 지금 끝날보다 앞섬' && (await 값은(p, '확인', '확존치')) === '⚠ 늘릴 끝날이 지금 끝날보다 앞섬' &&
    (await 값은(p, '판정', '늘어난날')) === '')
  await 넣음(p, '판정', '용도', 공사용)
  /* 사진 찍은 날 — 1개월 경계 */
  const 한달전 = EDATE(오늘, -1)
  await 넣음(p, '사진', '촬영#1', 한달전); await 넣음(p, '사진', '촬영#2', 한달전 - 1); await 넣음(p, '사진', '촬영#3', 오늘 + 1); await 넣음(p, '사진', '촬영#4', 오늘)
  ok(`찍은 날 ${날글(한달전)}(1개월 꼭) ✓ · 하루 앞 ⚠ 1개월 넘음 · 제출일 뒤 ⚠ · 오늘 ✓`, (await 값은(p, '사진', '촬확#1')) === '✓ 1개월 안' && (await 값은(p, '사진', '촬확#2')) === '⚠ 1개월 넘음' &&
    (await 값은(p, '사진', '촬확#3')) === '⚠ 제출일 뒤' && (await 값은(p, '사진', '촬확#4')) === '✓ 1개월 안')
  ok('사진 요약 «⚠ 2장 다시 확인 …» · 확인 장에도', (await 값은(p, '사진', '사진요약')) === '⚠ 2장 다시 확인(찍은 날 · 제출일 전 1개월)' && (await 값은(p, '확인', '확사진')) === '⚠ 2장 다시 확인(찍은 날 · 제출일 전 1개월)')
  /* 찍은 날(EXIF) 있는 사진을 넣으면 «찍은 날» 이 저절로 */
  await 넣음(p, '사진', '촬영#2', null)
  const 찍은날 = 오늘 - 5, t날 = 날(찍은날)
  const 때 = `${t날.getUTCFullYear()}:${String(t날.getUTCMonth() + 1).padStart(2, '0')}:${String(t날.getUTCDate()).padStart(2, '0')} 10:20:00`
  const 사진b64 = await p.evaluate(() => { const c = document.createElement('canvas'); c.width = 640; c.height = 360; const g = c.getContext('2d'); g.fillStyle = '#9ec5e0'; g.fillRect(0, 0, 640, 200); g.fillStyle = '#b9b2a4'; g.fillRect(0, 200, 640, 160); g.fillStyle = '#dfe5ea'; g.fillRect(160, 110, 320, 150); return c.toDataURL('image/jpeg', 0.9).split(',')[1] })
  const 사진 = Buffer.from(때넣기(new Uint8Array(Buffer.from(사진b64, 'base64')), 때))
  await 칸누르기(p, '사진', '사진#2')
  await p.locator('.gx-ed-ph input[type=file]').first().setInputFiles({ name: '후면.jpg', mimeType: 'image/jpeg', buffer: 사진 })
  await p.waitForFunction(() => /사진 1장을 넣었습니다/.test(document.body.innerText), null, { timeout: 15000 }).catch(() => {})
  ok(`찍은 날(EXIF ${날글(찍은날)}) 있는 사진을 넣으면 «찍은 날» 칸이 저절로 → ✓ 1개월 안`, (await 값은(p, '사진', '촬영#2')) === 찍은날 && (await 값은(p, '사진', '촬확#2')) === '✓ 1개월 안',
    [await 값은(p, '사진', '촬영#2'), await 값은(p, '사진', '촬확#2')])
  await 넣음(p, '사진', '촬영#3', 오늘 - 2)
  ok('→ 사진 요약 «✓ 앞 · 뒤 · 양옆 4장 …»', (await 값은(p, '사진', '사진요약')) === 사진다, await 값은(p, '사진', '사진요약'))
  /* 기한 뒤 제출 · 기한 지남 · 존치 끝남 */
  await 넣음(p, '판정', '만료일', 오늘 + 3)
  ok(`만료 3일 남음 → 기한(${날글(오늘 - 4)}) 뒤 제출 ⚠ · 오늘 기준 «기한이 지났습니다»`, (await 값은(p, '확인', '기한안')) === `⚠ 기한(${날글(오늘 - 4)}) 뒤 제출 — 바로 구청 건축과에 문의` &&
    (await 값은(p, '확인', '기한')) === 기한글(오늘 + 3, 오늘 - 4), [await 값은(p, '확인', '기한안'), await 값은(p, '확인', '기한')])
  await 넣음(p, '판정', '만료일', 오늘 - 1)
  ok('만료일이 어제 → «⚠ 존치기간이 … 에 끝났습니다»', (await 값은(p, '확인', '기한')) === 기한글(오늘 - 1, 오늘 - 8) && 기한글(오늘 - 1, 오늘 - 8).startsWith('⚠ 존치기간이'), await 값은(p, '확인', '기한'))
  await 넣음(p, '판정', '만료일', 오늘 + 30)
  ok('만료일 되돌림 → «✓ 기한 안 제출 (23일 앞)»', (await 값은(p, '확인', '기한안')) === '✓ 기한 안 제출 (23일 앞)', await 값은(p, '확인', '기한안'))
  /* 제출 전 확인 */
  for (let j = 1; j <= 5; j++) await 넣음(p, '확인', `제출#${j}`, '○')
  await 넣음(p, '확인', '제출#6', '×')
  ok('× 하나 → «⚠ 남은 것 1가지»', (await 값은(p, '확인', '제출요약')) === '⚠ 남은 것 1가지', await 값은(p, '확인', '제출요약'))
  await 넣음(p, '확인', '제출#6', '○')
  ok('→ «✓ 6가지 모두 확인 — 제출»', (await 값은(p, '확인', '제출요약')) === '✓ 6가지 모두 확인 — 제출')
  /* 마지막 한 칸은 종이에서 — 새로고침해도 그대로 */
  await 쳐넣기(p, '신고서', '연장사유', '공사기간 연장(설계변경)')
  ok('연장사유 쳐 넣음', (await 값은(p, '신고서', '연장사유')) === '공사기간 연장(설계변경)', await 값은(p, '신고서', '연장사유'))
  await p.waitForTimeout(1000)
  await 종이(p)
  ok('새로고침 → 판정 · 연장 존치기간 · 사진 날 · 확인 그대로(이 기기)', (await 값은(p, '판정', '판정')) === `✓ 연장 신고 — ${날글(오늘 + 23)}까지 · 앞 · 뒤 · 양옆 사진(제출일 전 1개월 안) 붙임` &&
    (await 값은(p, '판정', '연장끝')) === 오늘 + 200 && (await 값은(p, '사진', '촬영#2')) === 찍은날 && (await 값은(p, '확인', '제출요약')) === '✓ 6가지 모두 확인 — 제출' &&
    (await 값은(p, '신고서', '연장사유')) === '공사기간 연장(설계변경)', await 값은(p, '판정', '판정'))
  ok('새로고침 → 기한 다시 셈(오늘 기준)', (await 값은(p, '확인', '기한')) === 기한글(오늘 + 30, 오늘 + 23))
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
    ok('폰 390 예시 채우기 → 판정 ✓', (await 값은(s.p, '판정', '판정')) === '✓ 연장 신고 — 2027. 8. 24.까지 · 앞 · 뒤 · 양옆 사진(제출일 전 1개월 안) 붙임')
    ok('폰 390 넘침 0(예시 뒤)', (await 넘침(s.p)) <= 1, await 넘침(s.p))
  }
  ok(`폰 ${w} 오류 0`, !s.오류.length, s.오류)
  await s.ctx.close()
}
await b.close()
console.log(`\n${bad ? '✗' : '✓'} 시험_가설건축물연장화면 ${n - bad}/${n}`)
process.exit(bad ? 1 : 0)
