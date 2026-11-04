/**
 * 🌫️ G530 «비산먼지 발생사업 신고서» 서식 화면 시험 — 구운 사이트(dist + web/public/forms/g)를 띄운 뒤:
 *   node tools/시험_비산먼지신고화면.mjs [주소=http://127.0.0.1:4996]
 *   소장님 「웹 싹 다 검색해서 필요한 서류 도구화 하자」 → 「뭐 부터 할까?」 → ⑱ 특정공사 사전신고서 · 비산먼지 발생사업 신고서(착공 전 환경 신고 한 벌)
 *   소장님 「빠짐없이 기록하고 사이트에 작업하게 하고, 다운만 받고, 이용자 안오게 하면 안돼. 계속 사이트 찾게 해야 해」(11-04)
 *   ① 서식 탭 ② 착공 칸 카드 · 찾기(«비산먼지 신고» · «비산먼지 발생사업» · «세륜시설 기준» · «방진벽 높이»)
 *   ② 서식 화면(PC): 쪽 수 = 판짜기 · 제목 · 근거 · «무료» · «클로드» 없음 · 빈 틀 엑셀(시트 7장) · PDF 단추 · 다음에 쓸 서류 링크(특정공사 사전신고서 · 비산먼지 점검표) · 사진 칸 2곳
 *   ③ «✍ 예시 채우기»(근린생활시설 신축 · 연면적 3,200 ㎡ · 토공 1,800 ㎡ · 아파트 35 m) → 판정 · 발생사업(적은 것만 차례로) · 억제시설 · 방진벽 3 m · 세륜 · 측면 살수 ·
 *      저감 · 제출 확인 · 규모 기준 · 기한(오늘 기준) · 위치도 · 배치 도면 칸에 이 서식의 예시 그림(신축 · 방진벽 · 세륜 — 특정공사 그림 아님) → 특정공사 사전신고서로 갔다가 되돌아오는 링크
 *   ④ 이용자처럼(도로 · 토목 총연장 1,200 m): 다른 서식(특정공사 사전신고서 등)에 쓴 공사명 · 회사 · 착공 · 준공 … 9칸이 먼저 · 제출일 오늘 · 규모 10배 기준 ·
 *      주택 40 m → 방진벽 3 m · 2.4 m ⚠ → 3 m ✓ · 60 m 로 바꾸면 1.8 m · 수조 세륜 · 측면 살수 · 야적 4.5 m → 1.5 · 5.63 m · 저공해(서울 · 관급 120억) ·
 *      저감 × · 착공 뒤 제출 ⚠ · 공사기간 지남 ⚠ · 새로고침 그대로 · 여기 쓴 상호가 특정공사 사전신고서에 먼저 들어감
 *   ⑤ 대상 아님 · 조례 구역 · 공사 규모 빈칸 · 도장만 · 직접 시행 · 둘 이상 시 · 군 · 구 · 세륜 없음 · 50 m 경계 · 일정 끝이 앞섬
 *   ⑥ 폰 390 · 360: 종이 뜸 · 가로 넘침 0 · 오류 0
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
const SLUG = 'bisan-singo'
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
const 기한글 = (끝) => (끝 < 오늘 ? `⚠ 신고한 공사기간이 ${날글(끝)} 에 끝났습니다 — 공사가 이어지면 바로 구청에 문의`
  : `공사기간 끝 ${날글(끝)} — 오늘부터 ${쉼(끝 - 오늘)}일 남음 · 늘면 그 전에 변경신고`)
const 대상 = '✓ 신고 대상 — 착공 전까지 구청(환경과)에 신고 · 처리 4일 · 수수료 없음'
const 밑 = '대상 아님 — 별표 13 제5호 규모 밑'
const 조례말 = '⚠ 규모 밑이지만 조례로 대상이 될 수 있는 곳 — 구청 환경과에 먼저 확인'
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
/* 칸 안 그림 색(가운데 40 % 평균 RGB) — 예시 사진 · 그림이 맞게 들어갔나 */
/* 안 — 칸 가장자리에서 뺄 몫(0.3 = 가운데 40 % · 0.05 = 칸 거의 전부 — 그림 아래쪽에 있는 세륜처럼 가운데 밖 것도 셈) */
async function 칸색(p, 시트, 열쇠, 안 = 0.3) { const [si, r, c] = 키(시트, 열쇠); return 칸색칸(p, DOC, si, r, c, 안) }
async function 칸색칸(p, doc, si, r, c, 안 = 0.3) {
  const s = doc.sheets[si]
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
    let R = 0, G = 0, B = 0, 종 = 0, 남 = 0, 연 = 0
    const 가깝 = (i, r, g2, b2, t = 14) => Math.abs(d[i] - r) <= t && Math.abs(d[i + 1] - g2) <= t && Math.abs(d[i + 2] - b2) <= t
    for (let i = 0; i < d.length; i += 4) {
      R += d[i]; G += d[i + 1]; B += d[i + 2]
      if (가깝(i, 245, 242, 234, 10)) 종++    // 예시 그림 종이색 #f5f2ea
      if (가깝(i, 30, 58, 138)) 남++         // 방진벽 남색 #1e3a8a
      if (가깝(i, 147, 197, 253)) 연++       // 세륜 연파랑 #93c5fd
    }
    const n = d.length / 4
    return [Math.round(R / n), Math.round(G / n), Math.round(B / n), Math.round(종 / n * 100), +(남 / n * 100).toFixed(2), +(연 / n * 100).toFixed(2)]
  }, [상자, 판.W, 안])
}
/* 위에서 본 예시 그림 — 종이색이 넓게 */
const 그림색 = ([, , , 종]) => 종 >= 30     // 종이색(#f5f2ea) 칸이 30 % 넘음 — 흰 빈칸(#fff)도 · 현장 사진(관 부설 갈색 · 하늘)도 0 %
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
  ok('서식 탭에 «비산먼지 발생사업 신고서» 카드(링크)', 링크 > 0, 링크)
  for (const 말 of ['비산먼지 신고', '비산먼지 발생사업', '세륜시설 기준', '방진벽 높이']) {
    await p.fill('input[placeholder*="서식 찾기"]', 말)
    await p.waitForTimeout(500)
    const 있음 = await p.evaluate(() => /비산먼지 발생사업 신고서/.test(document.querySelector('main').innerText))
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
  ok('탭 제목에 «비산먼지 발생사업 신고서»', /비산먼지 발생사업 신고서/.test(await p.title()), await p.title())
  const 본문 = await p.evaluate(() => document.querySelector('main').innerText)
  for (const t of ['제43조', '제44조', '제58조', '별표 13', '별표 14', '별지 제24호서식']) ok(`근거 «${t}» 보임`, 본문.includes(t))
  ok('새 서식 — «무료» 안 씀', !/무료/.test(본문), (본문.match(/.{0,20}무료.{0,20}/) || [''])[0])
  ok('«클로드» 안 씀', !/클로드/.test(본문))
  ok('글에 [ ]( ) 꼴이 그대로 안 보임', !/\]\(\/forms\//.test(본문))
  const 엑셀 = await p.evaluate((s) => [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')).filter((h) => h.endsWith('/forms/' + s + '.xlsx')).length, SLUG)
  ok('빈 틀 엑셀 받기 링크', 엑셀 > 0, 엑셀)
  const r = await p.request.get(BASE + '/forms/' + SLUG + '.xlsx')
  const 몸 = await r.body()
  ok('받는 파일이 엑셀(zip · 시트 7장)', r.status() === 200 && 몸[0] === 0x50 && 몸[1] === 0x4b && (몸.toString('latin1').match(/xl\/worksheets\/sheet\d+\.xml/g) || []).length >= 7, [r.status(), 몸.length])
  ok('📄 PDF 저장 단추', (await p.locator('button', { hasText: 'PDF 저장' }).count()) > 0)
  const 다음 = await p.evaluate(() => [...document.querySelectorAll('.flist a.flink[href]')].map((a) => [a.getAttribute('href'), a.textContent.trim()]))
  ok('«놓치기 쉬운 것» 에 특정공사 사전신고서 링크', 다음.some(([h, t]) => h === '/forms/teukjeong-singo' && t === '특정공사 사전신고서'), 다음)
  ok('«놓치기 쉬운 것» 에 비산먼지 점검표 링크', 다음.some(([h, t]) => h === '/forms/bisan' && t === '비산먼지 점검표'), 다음)
  await 칸누르기(p, '위치도', '위치도')
  ok('위치도 칸을 누르면 «📷 사진 고르기»', await p.evaluate(() => !!document.querySelector('.gx-ed-ph')))
  await 칸누르기(p, '시설', '배치도면')
  ok('방진벽 · 세륜시설 · 살수시설 배치 도면 칸도 사진 칸', await p.evaluate(() => !!document.querySelector('.gx-ed-ph')))
  await 칸누르기(p, '저감대책', '청소')
  ok('«노면 · 출입구 청소» 칸은 글 칸(사진 아님)', await p.evaluate(() => !document.querySelector('.gx-ed-ph') && !!document.querySelector('.gx-ed-r .fw-in')), await 이름칸(p))

  console.log('③ ✍ 예시 채우기 → 자동 칸')
  await p.locator('button', { hasText: '예시 채우기' }).click()
  await p.waitForTimeout(300)
  const 모든값 = await p.evaluate(() => { const g = window.__격자; const out = []; g.doc.sheets.forEach((s, si) => { for (const x of s.cells) if (x[5] === 2 || x[5] === 3) { const v = g.책.값(si, x[0], x[1]); out.push(v && v.e ? '#' + v.e : v) } }); return out })
  const 오류칸 = 모든값.filter((v) => typeof v === 'string' && v.startsWith('#'))
  ok('오류 칸 0', !오류칸.length, 오류칸.slice(0, 5))
  ok('판정 «✓ 신고 대상 …»', (await 값은(p, '판정', '판정')) === 대상, await 값은(p, '판정', '판정'))
  ok('건축 3,200 · 토공 1,800 ㎡ → ✓ 기준 이상 둘', (await 값은(p, '판정', '규판#1')) === '✓ 기준 이상' && (await 값은(p, '판정', '규판#9')) === '✓ 기준 이상' && (await 값은(p, '판정', '규모판정')) === '✓ 별표 13 제5호 규모 이상')
  ok('누가 «원도급사» · 어디에 «공사장 관할»', (await 값은(p, '판정', '신고자')) === '발주자로부터 공사를 처음 도급받은 회사(원도급사)가 신고' && (await 값은(p, '판정', '내는곳')) === '공사장 관할 시 · 군 · 구청(환경 담당 부서)')
  const 표 = []
  for (let k = 1; k <= 3; k++) 표.push([await 값은(p, '신고서', `발종#${k}`), await 값은(p, '신고서', `발대#${k}`), await 값은(p, '신고서', `발규#${k}`)])
  ok('신고서 발생사업 — 적은 것만 차례로', JSON.stringify(표) === JSON.stringify([['건설업', '건축물축조공사', '연면적 3,200 ㎡'], ['건설업', '토공사 · 정지공사', '공사면적 1,800 ㎡'], ['', '', '']]), 표)
  ok('억제 «공사장 경계» = 방진벽 4구간 · 220 m · 3 m', (await 값은(p, '신고서', '억경계')) === '방진벽 4구간 · 연장 220 m · 높이 3 m 이상(별표 14 1 나)', await 값은(p, '신고서', '억경계'))
  ok('억제 «야적» 저절로', (await 값은(p, '신고서', '억야적')) === '방진덮개(1일 이상 보관) · 방진벽 1.0 m · 방진망(막) 3.75 m 이상 · 물 뿌리는 시설', await 값은(p, '신고서', '억야적'))
  ok('억제 «싣기 및 내리기» 저절로', (await 값은(p, '신고서', '억싣기')) === '살수시설(반경 6 m · 수압 3.5 ㎏/㎠) · 평균 풍속 초속 8 m 이상 작업 중지', await 값은(p, '신고서', '억싣기'))
  ok('억제 «수송» 저절로(세륜 · 측면 · 덮개 · 20 ㎞ · 하루 3회)', (await 값은(p, '신고서', '억수송')) === '자동식 세륜시설 · 측면 살수시설 · 적재함 덮개 · 5 ㎝ 이하 수평 적재 · 공사장 안 시속 20 ㎞ 이하 · 통행도로 하루 3회 살수', await 값은(p, '신고서', '억수송'))
  ok('억제 «그 밖의 공정» 저절로', (await 값은(p, '신고서', '억기타')) === '작업 부위 · 층 방진막 · 면고르기 연마 방진막 · 롤러 도장', await 값은(p, '신고서', '억기타'))
  ok('공사 282일간 · 신청인 «예시건설(주) 홍길동»', (await 값은(p, '신고서', '공사일간')) === '(282일간)' && (await 값은(p, '신고서', '신고인표시')) === '예시건설(주) 홍길동')
  ok('개요 규모 저절로', (await 값은(p, '개요', '개규모')) === '건축물축조공사 연면적 3,200 ㎡ · 토공사 · 정지공사 공사면적 1,800 ㎡', await 값은(p, '개요', '개규모'))
  ok('위치도 50 m 안 «2 곳» · 주거 · 상가 «있음»', (await 값은(p, '위치도', '피수')) === '2 곳' && (await 값은(p, '위치도', '주상50')) === '있음')
  ok('방진벽 기준 «3 m 이상 …» · 4구간 ✓', (await 값은(p, '시설', '벽기준')) === '3 m 이상 — 부지 경계선 50 m 안에 주거 · 상가 건물이 있음' && (await 값은(p, '시설', '벽판정#4')) === '✓ 기준 이상')
  ok('세륜 · 싣기 · 측면 ✓', (await 값은(p, '시설', '세륜판정')) === '✓ 자동식 세륜시설' && (await 값은(p, '시설', '싣판정')) === '✓ 살수반경 5 m · 수압 3 ㎏/㎠ 이상' && (await 값은(p, '시설', '측판정')) === '✓ 측면 살수 기준')
  ok('측면 살수 길이 기준 «15.0 m 이상(차량 10.0 m × 1.5)»', (await 값은(p, '시설', '측기준')) === '길이 15.0 m 이상(차량 10.0 m × 1.5)', await 값은(p, '시설', '측기준'))
  ok('저공해 «해당 없음»(경기 · 관급 아님)', (await 값은(p, '시설', '저공해판정')) === '해당 없음 — 서울 · 인천 · 경기의 총공사금액 100억 원 이상 관급공사만')
  ok('시설 요약 ✓', (await 값은(p, '시설', '시설요약')) === '✓ 방진벽 4구간 · 연장 220 m · 자동식 세륜시설 — 별표 14 기준', await 값은(p, '시설', '시설요약'))
  ok('저감 «✓ 5가지 · 해당 없음 1가지» · 담당 = 현장 책임자', (await 값은(p, '저감대책', '저감요약')) === '✓ 저감대책 5가지 적용 · 해당 없음 1가지 (6가지 가운데)' && (await 값은(p, '저감대책', '담당')) === '김철수')
  ok('확인 «착공 전 7일 앞» · «10가지 모두»', (await 값은(p, '확인', '착공전')) === '✓ 착공 전 제출 (7일 앞)' && (await 값은(p, '확인', '제출요약')) === '✓ 10가지 모두 확인 — 제출')
  ok('규모 기준 «10 % 이상»(3호의2)', (await 값은(p, '확인', '규모기준')) === '규모를 10 % 이상 늘리거나 공사 종류를 더하면 변경신고(3호의2)')
  ok(`기한(오늘 기준) «${기한글(일련(2027, 8, 31))}»`, (await 값은(p, '확인', '기한')) === 기한글(일련(2027, 8, 31)), await 값은(p, '확인', '기한'))
  /* 📐 예시 그림 — 이 서식 것(신축 · 방진벽 남색 · 세륜 연파랑) */
  await p.waitForFunction(() => /사진 2장을 넣었습니다/.test(document.body.innerText), null, { timeout: 15000 }).catch(() => {})
  ok('예시 채우기 → «📷 사진 2장을 넣었습니다»', /사진 2장을 넣었습니다/.test(await p.evaluate(() => document.body.innerText)))
  const 색1 = await 칸색(p, '위치도', '위치도')
  ok(`위치도 칸 = 신축 위치도 그림(종이 ${색1[3]} % · 방진벽 남색 ${색1[4]} % · 세륜 ${색1[5]} %)`, 그림색(색1) && 색1[4] > 0.2 && 색1[5] > 0.05, 색1)
  const 색2 = await 칸색(p, '시설', '배치도면', 0.05)
  ok(`배치 도면 칸 = 비산먼지 억제시설 그림(칸 전체 — 종이 ${색2[3]} % · 세륜 ${색2[5]} %)`, 그림색(색2) && 색2[5] > 0.2, 색2)
  ok('오류 0(PC · 예시)', !오류.length, 오류)
  await p.locator('.flist a[href="/forms/teukjeong-singo"]').first().click()
  await p.waitForURL(/\/forms\/teukjeong-singo$/, { timeout: 10000 })
  await p.waitForTimeout(600)
  ok('특정공사 사전신고서로 감 → 거기서 이 서식으로 오는 링크', await p.evaluate((s) => [...document.querySelectorAll('.flist a[href]')].some((a) => a.getAttribute('href') === '/forms/' + s), SLUG))
  ok('오류 0(다음 서류)', !오류.length, 오류)
  await ctx.close()
}

console.log('④ 이용자처럼 빈 종이에 적기 (PC) — 다른 서식에 쓴 값이 먼저 들어옴')
const 착공 = 오늘 + 20, 준공 = 오늘 + 200
{
  const { ctx, p, 오류 } = await 새쪽(1280, 900, false)
  await 종이(p)
  await p.evaluate((공) => { localStorage.removeItem('kcm.격자'); localStorage.setItem('kcm.서식공통', JSON.stringify(공)) },
    { 현장: '시험 도로 확포장공사', 회사: '시험건설(주)', 대표: '김시험', 위치: '가나시 다라구 일원', 착공: 날ISO(착공), 준공: 날ISO(준공), 발주: '시험 발주청', 대리인: '박현장', 연락처: '000-1111-2222' })
  await 종이(p)
  const 말 = await p.locator('.fw-say').innerText().catch(() => '')
  ok('«✨ 공사명 · 회사 등 9칸을 지난번 쓴 값으로 채웠습니다»', /공사명 · 회사 등 9칸을 지난번 쓴 값으로 채웠습니다/.test(말), 말)
  const 들어옴 = {}
  for (const k of ['상호', '대표자', '현장소재지', '전화번호', '착공일', '준공일', '제출일']) 들어옴[k] = await 값은(p, '신고서', k)
  for (const k of ['공사명칭', '발주자', '현장책임자']) 들어옴[k] = await 값은(p, '개요', k)
  ok('신고서 6칸 · 개요 3칸 + 제출일(오늘)', JSON.stringify(들어옴) === JSON.stringify({ 상호: '시험건설(주)', 대표자: '김시험', 현장소재지: '가나시 다라구 일원', 전화번호: '000-1111-2222', 착공일: 착공, 준공일: 준공, 제출일: 오늘, 공사명칭: '시험 도로 확포장공사', 발주자: '시험 발주청', 현장책임자: '박현장' }), 들어옴)
  ok('공사 181일간 · 개요 기간 · 시공자 저절로', (await 값은(p, '신고서', '공사일간')) === '(181일간)' && (await 값은(p, '개요', '개기간')) === `${날글(착공)} ~ ${날글(준공)}  (181일간)` && (await 값은(p, '개요', '개시공')) === '시험건설(주)')
  ok('저감대책 담당 박현장 · 연락처 빈칸', (await 값은(p, '저감대책', '담당')) === '박현장' && (await 값은(p, '저감대책', '담당전화')) === '')
  ok('확인 «✓ 착공 전 제출 (20일 앞)»', (await 값은(p, '확인', '착공전')) === '✓ 착공 전 제출 (20일 앞)', await 값은(p, '확인', '착공전'))
  ok(`기한 «${기한글(준공)}»`, (await 값은(p, '확인', '기한')) === 기한글(준공), await 값은(p, '확인', '기한'))
  ok('아무것도 안 적으면 판정 빈칸', (await 값은(p, '판정', '판정')) === '' && (await 값은(p, '확인', '확판정')) === '' && (await 값은(p, '확인', '규모기준')) === '')
  /* 토목 총연장 — 종이의 칸을 눌러 씀 */
  await 칸누르기(p, '판정', '토목연장')
  ok('토목 총연장 칸을 누르면 아래 쓰는 칸이 열림', /연장|토목/.test(await 이름칸(p)), await 이름칸(p))
  await p.locator('.gx-ed-r .fw-in').first().fill('1200')
  await p.keyboard.press('Enter')
  await p.waitForTimeout(200)
  ok('총연장 1,200 m → ✓ → 신고 대상', (await 값은(p, '판정', '규판#4')) === '✓ 기준 이상' && (await 값은(p, '판정', '판정')) === 대상, await 값은(p, '판정', '판정'))
  ok('신고서 발생사업 «토목공사 · 총 연장 1,200 m»', (await 값은(p, '신고서', '발대#1')) === '토목공사' && (await 값은(p, '신고서', '발규#1')) === '총 연장 1,200 m' && (await 값은(p, '신고서', '발대#2')) === '')
  ok('규모 기준 «10 % 이상»', (await 값은(p, '확인', '규모기준')) === '규모를 10 % 이상 늘리거나 공사 종류를 더하면 변경신고(3호의2)')
  await 넣음(p, '판정', '토목연장', 2500)
  ok('2,500 m(최소 200 m 의 10배 넘음) → «늘리면 변경신고 · 10 % 기준 없음»', (await 값은(p, '확인', '규모기준')) === '최소 규모의 10배 이상인 공사 — 규모를 늘리거나 종류를 더하면 변경신고(3호 나목 · 10 % 기준 없음)', await 값은(p, '확인', '규모기준'))
  /* 피해대상 → 방진벽 기준 */
  await 넣음(p, '위치도', '피구분#1', '주택'); await 넣음(p, '위치도', '피거리#1', 40)
  ok('주택 40 m → 50 m 안 · 주거 · 상가 ✓ → «있음»', (await 값은(p, '위치도', '주상#1')) === '✓' && (await 값은(p, '위치도', '주상50')) === '있음')
  await 넣음(p, '시설', '벽위치#1', '도로 쪽'); await 넣음(p, '시설', '벽높이#1', 2.4); await 넣음(p, '시설', '벽연장#1', 100)
  ok('방진벽 2.4 m → «⚠ 기준(3 m) 밑» · 요약 ⚠', (await 값은(p, '시설', '벽판정#1')) === '⚠ 기준(3 m) 밑' && (await 값은(p, '시설', '시설요약')) === '⚠ 기준 밑 1곳 — 위 ⚠ 칸을 다시 보기', [await 값은(p, '시설', '벽판정#1'), await 값은(p, '시설', '시설요약')])
  await 넣음(p, '시설', '벽높이#1', 3)
  ok('3 m 로 고치면 ✓', (await 값은(p, '시설', '벽판정#1')) === '✓ 기준 이상')
  await 넣음(p, '위치도', '피거리#1', 60); await 넣음(p, '시설', '벽높이#1', 2.4)
  ok('주택이 60 m 면 기준 1.8 m → 2.4 m ✓', (await 값은(p, '위치도', '주상50')) === '없음' && (await 값은(p, '시설', '벽기준')) === '1.8 m 이상 — 50 m 안에 주거 · 상가 건물이 없음' && (await 값은(p, '시설', '벽판정#1')) === '✓ 기준 이상')
  ok('신고서 «공사장 경계» = 1.8 m', (await 값은(p, '신고서', '억경계')) === '방진벽 1구간 · 연장 100 m · 높이 1.8 m 이상(별표 14 1 나)', await 값은(p, '신고서', '억경계'))
  /* 세륜 · 측면 살수 */
  await 넣음(p, '시설', '세륜', '수조를 이용한 세륜시설'); await 넣음(p, '시설', '수조깊이', 25); await 넣음(p, '시설', '차길이', 9); await 넣음(p, '시설', '수조길이', 16)
  ok('수조 길이 16 m(차량 9 m 의 2배 밑) → ⚠', (await 값은(p, '시설', '세륜판정')) === '⚠ 수조 기준 확인 — 깊이 20 ㎝ · 길이 차량의 2배 · 넓이 1.2배 · 침전조')
  await 넣음(p, '시설', '수조길이', 20); await 넣음(p, '시설', '수조넓이', '○'); await 넣음(p, '시설', '침전', '○')
  ok('20 m · 넓이 ○ · 침전조 ○ → ✓ 수조 세륜', (await 값은(p, '시설', '세륜판정')) === '✓ 수조 세륜 — 깊이 · 길이 · 넓이 · 침전조')
  await 넣음(p, '시설', '측길이', 12); await 넣음(p, '시설', '측수압', 3); await 넣음(p, '시설', '측높이', '○')
  ok('측면 살수 기준 «13.5 m 이상» · 12 m → ⚠', (await 값은(p, '시설', '측기준')) === '길이 13.5 m 이상(차량 9.0 m × 1.5)' && (await 값은(p, '시설', '측판정')) === '⚠ 기준 확인 — 길이 1.5배 · 살수압 3 kgf/㎠ · 높이', await 값은(p, '시설', '측기준'))
  await 넣음(p, '시설', '측길이', 14)
  ok('14 m → ✓ 측면 살수 기준', (await 값은(p, '시설', '측판정')) === '✓ 측면 살수 기준')
  /* 야적 · 싣기 · 저공해 */
  await 넣음(p, '시설', '야높이', 4.5)
  ok('야적 4.5 m → 방진벽 1.5 m · 방진망 5.63 m', (await 값은(p, '시설', '야기준')) === '→ 방진벽 1.5 m 이상(1/3) · 방진망(개구율 40 %) 또는 방진막 5.63 m 이상(1.25배)', await 값은(p, '시설', '야기준'))
  await 넣음(p, '시설', '싣반경', 4); await 넣음(p, '시설', '싣수압', 3)
  ok('살수반경 4 m → ⚠', (await 값은(p, '시설', '싣판정')) === '⚠ 기준(살수반경 5 m · 수압 3 ㎏/㎠) 밑')
  await 넣음(p, '시설', '싣반경', 5)
  ok('5 m → ✓', (await 값은(p, '시설', '싣판정')) === '✓ 살수반경 5 m · 수압 3 ㎏/㎠ 이상')
  await 넣음(p, '시설', '지역', '서울특별시'); await 넣음(p, '시설', '관급', '예'); await 넣음(p, '시설', '금액억', 120)
  ok('서울 · 관급 · 120억 → 저공해 건설기계 «해당» · 신고서 «그 밖의 공정» 에 저절로', ((await 값은(p, '시설', '저공해판정')) || '').startsWith('해당 —') && (await 값은(p, '신고서', '억기타')) === '저공해 건설기계', [await 값은(p, '시설', '저공해판정'), await 값은(p, '신고서', '억기타')])
  /* 저감대책 · 제출 확인 */
  for (let i = 1; i <= 4; i++) await 넣음(p, '저감대책', `저적#${i}`, '○')
  await 넣음(p, '저감대책', '저적#5', '해당 없음'); await 넣음(p, '저감대책', '저적#6', '×')
  ok('× 하나 → «⚠ × 1가지 …»', (await 값은(p, '저감대책', '저감요약')) === '⚠ × 1가지 — 지켜야 하는 기준(별표 14)입니다')
  await 넣음(p, '저감대책', '저적#6', '○'); await 넣음(p, '저감대책', '살수횟수', 2)
  ok('○ 로 고치면 «✓ 5가지 · 해당 없음 1가지» · 살수 하루 2회 ✓', (await 값은(p, '저감대책', '저감요약')) === '✓ 저감대책 5가지 적용 · 해당 없음 1가지 (6가지 가운데)' && (await 값은(p, '저감대책', '살수판정')) === '✓ 하루 1회 이상(별표 14 3 아)')
  ok('신고서 «수송» 저절로(수조 세륜 · 측면 · 덮개 · 20 ㎞ · 하루 2회)', (await 값은(p, '신고서', '억수송')) === '수조를 이용한 세륜시설 · 측면 살수시설 · 적재함 덮개 · 5 ㎝ 이하 수평 적재 · 공사장 안 시속 20 ㎞ 이하 · 통행도로 하루 2회 살수', await 값은(p, '신고서', '억수송'))
  for (let j = 1; j <= 9; j++) await 넣음(p, '확인', `제출#${j}`, '○')
  await 넣음(p, '확인', '제출#10', '×')
  ok('× 하나 → «⚠ 남은 것 1가지»', (await 값은(p, '확인', '제출요약')) === '⚠ 남은 것 1가지')
  await 넣음(p, '확인', '제출#10', '○')
  ok('→ «✓ 10가지 모두 확인 — 제출»', (await 값은(p, '확인', '제출요약')) === '✓ 10가지 모두 확인 — 제출')
  await 넣음(p, '신고서', '제출일', 착공 + 3)
  ok('제출일이 착공 뒤 → ⚠', (await 값은(p, '확인', '착공전')) === '⚠ 제출일이 착공일 뒤 — 건설공사는 착공 전까지 내야 합니다')
  await 넣음(p, '신고서', '제출일', 오늘); await 넣음(p, '신고서', '준공일', 오늘 - 2)
  ok('공사기간 끝이 지남 → «⚠ … 끝났습니다» · «끝이 앞섬»', (await 값은(p, '확인', '기한')) === 기한글(오늘 - 2) && (await 값은(p, '신고서', '공사일간')) === '⚠ 끝이 앞섬')
  await 넣음(p, '신고서', '준공일', 준공)
  /* 마지막 한 칸은 종이에서 — 저절로 남고 · 새로고침해도 그대로 */
  await 쳐넣기(p, '개요', '공사목적', '도로 확포장(2차로 → 4차로)')
  ok('공사 목적 쳐 넣음', (await 값은(p, '개요', '공사목적')) === '도로 확포장(2차로 → 4차로)', await 값은(p, '개요', '공사목적'))
  await p.waitForTimeout(1000)
  await 종이(p)
  ok('새로고침 → 판정 · 규모 기준 · 시설 · 저감 · 확인 그대로(이 기기)', (await 값은(p, '판정', '판정')) === 대상 && (await 값은(p, '판정', '토목연장')) === 2500 && (await 값은(p, '시설', '세륜판정')) === '✓ 수조 세륜 — 깊이 · 길이 · 넓이 · 침전조' && (await 값은(p, '확인', '제출요약')) === '✓ 10가지 모두 확인 — 제출' && (await 값은(p, '개요', '공사목적')) === '도로 확포장(2차로 → 4차로)')
  ok('새로고침 → 기한 다시 셈(오늘 기준)', (await 값은(p, '확인', '기한')) === 기한글(준공))
  /* 여기 쓴 상호 → 특정공사 사전신고서에 먼저 */
  await 쳐넣기(p, '신고서', '상호', '새시험건설(주)')
  await p.waitForTimeout(300)
  await p.goto(BASE + '/forms/teukjeong-singo', { waitUntil: 'domcontentloaded' })
  await p.waitForFunction(() => window.__격자 && document.querySelectorAll('canvas.gx-page').length, null, { timeout: 25000 })
  await p.waitForTimeout(400)
  const 다른 = await p.evaluate(() => { const g = window.__격자; for (let si = 0; si < g.doc.sheets.length; si++) { const s = g.doc.sheets[si]; const a = Object.entries(s.keys).find(([, k]) => k === '상호'); if (a) { const m = /^([A-Z]+)(\d+)$/.exec(a[0]); let c = 0; for (const ch of m[1]) c = c * 26 + ch.charCodeAt(0) - 64; return [g.책.값(si, +m[2], c), (Object.entries(s.keys).find(([, k]) => k === '공사명칭') || [])[0]] } } return null })
  ok('여기 고친 상호가 특정공사 사전신고서에 먼저 들어감', !!다른 && 다른[0] === '새시험건설(주)', 다른)
  ok('오류 0(PC · 적기)', !오류.length, 오류)
  await ctx.close()
}

console.log('⑤ 대상 아님 · 조례 구역 · 누가 · 어디에 (PC)')
{
  const { ctx, p, 오류 } = await 새쪽(1280, 900, false)
  await 종이(p)
  const 판 = () => 값은(p, '판정', '판정')
  await 넣음(p, '판정', '건축연면적', 800)
  ok('건축 800 ㎡ → «대상 아님 — 별표 13 제5호 규모 밑»', (await 값은(p, '판정', '규판#1')) === '기준 밑' && (await 판()) === 밑, await 판())
  ok('신고서 발생사업은 적은 것을 그대로 보여 줌(기준 밑도)', (await 값은(p, '신고서', '발대#1')) === '건축물축조공사' && (await 값은(p, '신고서', '발규#1')) === '연면적 800 ㎡')
  await 넣음(p, '판정', '조례#7', '있음')
  ok('공동주택 50 m 안 → «⚠ 규모 밑이지만 조례로 …»', (await 값은(p, '판정', '조판#7')) === '✓ 해당' && (await 판()) === 조례말, await 판())
  await 넣음(p, '판정', '조례#7', '없음'); await 넣음(p, '판정', '조례#8', '예')
  ok('매설공사 «예» 도 조례 확인', (await 판()) === 조례말)
  await 넣음(p, '판정', '건축연면적', null)
  ok('규모를 지우면 «⚠ ㉮ 공사 규모를 적으세요»', (await 판()) === '⚠ ㉮ 공사 규모를 적으세요', await 판())
  await 넣음(p, '판정', '조례#8', null); await 넣음(p, '판정', '조례#7', null); await 넣음(p, '판정', '도장', '예')
  ok('공동주택 외부 도장만 «예» → ✓ 신고 대상 · 발생사업 «도장공사»', (await 판()) === 대상 && (await 값은(p, '신고서', '발대#1')) === '도장공사' && (await 값은(p, '신고서', '발규#1')) === '장기수선계획 공동주택 건물 외부 도장')
  await 넣음(p, '판정', '도장', '아니오')
  ok('도장 «아니오» 만 → 규모 밑', (await 값은(p, '판정', '규모판정')) === '별표 13 제5호 규모 밑' && (await 판()) === 밑 && (await 값은(p, '신고서', '발대#1')) === '')
  await 넣음(p, '판정', '도급', '아니오'); await 넣음(p, '판정', '걸침', '예')
  ok('직접 시행 · 둘 이상 시 · 군 · 구 → 누가 · 어디에', (await 값은(p, '판정', '신고자')) === '사업을 하는 자(직접 시행하는 발주자 등)가 신고' && (await 값은(p, '판정', '내는곳')) === '사업 구역 면적이 가장 큰 곳(길이로 신고하면 가장 긴 곳)의 시 · 군 · 구청')
  await 넣음(p, '시설', '세륜', '없음')
  ok('세륜 «없음» → ⚠', (await 값은(p, '시설', '세륜판정')) === '⚠ 세륜시설 없음 — 자동식 또는 수조 세륜시설(3 라)')
  await 넣음(p, '위치도', '피거리#1', 50); await 넣음(p, '위치도', '피거리#2', 50.5)
  ok('50 m 는 ✓ · 50.5 m 는 빈칸 · «1 곳» · 구분 없으면 주거 · 상가 빈칸', (await 값은(p, '위치도', '피50#1')) === '✓' && (await 값은(p, '위치도', '피50#2')) === '' && (await 값은(p, '위치도', '피수')) === '1 곳' && (await 값은(p, '위치도', '주상50')) === '')
  await 넣음(p, '개요', '시작#1', 오늘 + 10); await 넣음(p, '개요', '끝#1', 오늘 + 8)
  ok('일정 끝이 앞서면 «⚠»', (await 값은(p, '개요', '일수#1')) === '⚠')
  ok('오류 0(PC · 대상 아님)', !오류.length, 오류)
  await ctx.close()
}

console.log('⑥ 폰 390 · 360')
for (const [w, h] of [[390, 844], [360, 740]]) {
  const s = await 새쪽(w, h)
  await 종이(s.p)
  ok(`폰 ${w} 종이 뜸`, (await s.p.evaluate(() => document.querySelectorAll('canvas.gx-page').length)) === 쪽수)
  ok(`폰 ${w} 넘침 0`, (await 넘침(s.p)) <= 1, await 넘침(s.p))
  ok(`폰 ${w} 오류 0`, !s.오류.length, s.오류)
  await s.ctx.close()
}
await b.close()
console.log(`\n${bad ? '✗' : '✓'} 시험_비산먼지신고화면 ${n - bad}/${n}`)
process.exit(bad ? 1 : 0)
