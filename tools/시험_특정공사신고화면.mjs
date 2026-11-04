/**
 * 🔇 G529 «특정공사 사전신고서» 서식 화면 시험 — 구운 사이트(dist + web/public/forms/g)를 띄운 뒤:
 *   node tools/시험_특정공사신고화면.mjs [주소=http://127.0.0.1:4996]
 *   소장님 「웹 싹 다 검색해서 필요한 서류 도구화 하자」 → 「뭐 부터 할까?」 → ⑱ 특정공사 사전신고서부터(11-04)
 *   소장님 「빠짐없이 기록하고 사이트에 작업하게 하고, 다운만 받고, 이용자 안오게 하면 안돼. 계속 사이트 찾게 해야 해」(11-04)
 *   ① 서식 탭 ② 착공 칸에 카드 · 찾기(«특정공사» · «사전신고» · «소음 진동 신고» · «방음벽 설치 곤란»)로 나옴
 *   ② 서식 화면(PC): 쪽 수 = 판짜기 · 제목 · 근거 · «무료» · «클로드» 없음 · 빈 틀 엑셀(시트 7장) · PDF 단추 ·
 *      «다음에 쓸 서류» 링크(링크로 보임 · 소음 · 진동 측정 기록부 · 비산먼지 점검표 → 거기서 다시 이 서식으로) · 사진 칸 2곳(위치도 · 방음 도면)
 *   ③ «✍ 예시 채우기»(학교 50 m 안 내부 철거) → 판정 · 장비 표(쓰는 것만 차례로) · 공사 규모 · 방음 미설치 4호 · 저감 · 제출 확인 · 기한(오늘 기준) ·
 *      위치도 · 배치 도면 칸에 예시 그림(현장 사진 아님)
 *   ④ 이용자처럼(신축 · 건축 연면적 1,500 ㎡ · 굴착기 2 · 브레이커 1 · 10일 · 방음벽 설치):
 *      다른 서식에 쓴 공사명 · 회사 · 착공 · 준공 … 9칸이 먼저 들어옴 · 제출일 = 오늘 · 판정이 차례로 바뀜 · 방음벽 기준 밑 ⚠ → 고치면 ✓ ·
 *      착공 뒤 제출 ⚠ · 공사기간 지남 ⚠ · 새로고침해도 쓰던 것 그대로(이 기기) · 여기 쓴 공사명이 다른 서식(원가계산서)에 먼저 들어감
 *   ⑤ 대상 아님 · 빠지는 경우 · 5일 미만 · 실제 작업일수 고쳐 쓰기 · 사유 2호 원문 · 예문 · 50 m 경계 · 일정 끝이 앞섬
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
const SLUG = 'teukjeong-singo'
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
const 빠짐 = '대상 아님 — 빠지는 경우(제21조제1항 단서) · 구청 환경과에 한 번 더 확인'
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
async function 칸색(p, 시트, 열쇠) { const [si, r, c] = 키(시트, 열쇠); return 칸색칸(p, DOC, si, r, c) }
async function 칸색칸(p, doc, si, r, c) {
  const s = doc.sheets[si]
  const x = s.cells.find((q) => q[0] === r && q[1] === c)
  const 판 = 판짜기(s)
  const pi = 칸쪽(판, r)
  const 상자 = 칸상자(판, pi, x)
  const cv = p.locator(`#gx-s${si} canvas.gx-page`).nth(pi)
  await cv.scrollIntoViewIfNeeded()
  await p.waitForTimeout(900)
  return cv.evaluate((el, [b, W]) => {
    const k = el.width / W
    const x0 = Math.round((b.x + b.w * 0.3) * k), y0 = Math.round((b.y + b.h * 0.3) * k), w = Math.max(1, Math.round(b.w * 0.4 * k)), h = Math.max(1, Math.round(b.h * 0.4 * k))
    const d = el.getContext('2d').getImageData(x0, y0, w, h).data
    let R = 0, G = 0, B = 0, 종 = 0
    for (let i = 0; i < d.length; i += 4) {
      R += d[i]; G += d[i + 1]; B += d[i + 2]
      if (Math.abs(d[i] - 245) <= 10 && Math.abs(d[i + 1] - 242) <= 10 && Math.abs(d[i + 2] - 234) <= 10) 종++    // 예시 그림 종이색 #f5f2ea
    }
    const n = d.length / 4
    return [Math.round(R / n), Math.round(G / n), Math.round(B / n), Math.round(종 / n * 100)]
  }, [상자, 판.W])
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
  ok('서식 탭에 «특정공사 사전신고서» 카드(링크)', 링크 > 0, 링크)
  for (const 말 of ['특정공사', '사전신고', '소음 진동 신고', '방음벽 설치 곤란']) {
    await p.fill('input[placeholder*="서식 찾기"]', 말)
    await p.waitForTimeout(500)
    const 있음 = await p.evaluate(() => /특정공사 사전신고서/.test(document.querySelector('main').innerText))
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
  ok('탭 제목에 «특정공사 사전신고서»', /특정공사 사전신고서/.test(await p.title()), await p.title())
  const 본문 = await p.evaluate(() => document.querySelector('main').innerText)
  for (const t of ['제22조', '제21조', '별표 9', '별표 10', '별지 제10호서식', '시행령 제2조제2항']) ok(`근거 «${t}» 보임`, 본문.includes(t))
  ok('새 서식 — «무료» 안 씀', !/무료/.test(본문), (본문.match(/.{0,20}무료.{0,20}/) || [''])[0])
  ok('«클로드» 안 씀', !/클로드/.test(본문))
  ok('글에 [ ]( ) 꼴이 그대로 안 보임', !/\]\(\/forms\//.test(본문))
  const 엑셀 = await p.evaluate((s) => [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')).filter((h) => h.endsWith('/forms/' + s + '.xlsx')).length, SLUG)
  ok('빈 틀 엑셀 받기 링크', 엑셀 > 0, 엑셀)
  const r = await p.request.get(BASE + '/forms/' + SLUG + '.xlsx')
  const 몸 = await r.body()
  ok('받는 파일이 엑셀(zip · 시트 7장)', r.status() === 200 && 몸[0] === 0x50 && 몸[1] === 0x4b && (몸.toString('latin1').match(/xl\/worksheets\/sheet\d+\.xml/g) || []).length >= 7, [r.status(), 몸.length])
  ok('📄 PDF 저장 단추', (await p.locator('button', { hasText: 'PDF 저장' }).count()) > 0)
  /* 🍚 다음에 쓸 서류 — 놓치기 쉬운 것 안 링크 */
  const 다음 = await p.evaluate(() => [...document.querySelectorAll('.flist a[href]')].map((a) => [a.getAttribute('href'), a.textContent.trim()]))
  ok('«놓치기 쉬운 것» 에 소음 · 진동 측정 기록부 링크', 다음.some(([h, t]) => h === '/forms/soeum' && t === '소음 · 진동 측정 기록부'), 다음)
  ok('«놓치기 쉬운 것» 에 비산먼지 점검표 링크', 다음.some(([h, t]) => h === '/forms/bisan' && t === '비산먼지 점검표'), 다음)
  const 링크꼴 = await p.evaluate(() => { const a = document.querySelector('.flist a.flink[href="/forms/soeum"]'); if (!a) return null; const c = getComputedStyle(a), b = getComputedStyle(a.parentElement); return { 색: c.color, 글색: b.color, 밑줄: c.textDecorationLine, 굵기: c.fontWeight, 뒤: (a.nextSibling && a.nextSibling.textContent || '').slice(0, 2) } })
  ok('링크가 링크로 보임(글과 다른 색 · 밑줄 · 굵게)', !!링크꼴 && 링크꼴.색 !== 링크꼴.글색 && /underline/.test(링크꼴.밑줄) && +링크꼴.굵기 >= 600, 링크꼴)
  ok('링크 뒤 토씨는 붙여 씀(«기록부로»)', !!링크꼴 && 링크꼴.뒤.startsWith('로'), 링크꼴)
  /* 사진 칸 — 위치도 · 방음 도면은 사진 고르기 · 글 칸(곤란설명)은 글 */
  await 칸누르기(p, '위치도', '위치도')
  const 사1 = await p.evaluate(() => ({ 사진: !!document.querySelector('.gx-ed-ph'), 단추: [...document.querySelectorAll('.gx-ed-phb button')].map((x) => x.textContent.trim()) }))
  ok('위치도 칸을 누르면 «📷 사진 고르기»', 사1.사진 && 사1.단추.some((t) => /사진 고르기/.test(t)), 사1)
  await 칸누르기(p, '방음', '방음도면')
  ok('방음 · 방진시설 배치 도면 칸도 사진 칸', await p.evaluate(() => !!document.querySelector('.gx-ed-ph')))
  await 칸누르기(p, '방음', '곤란설명')
  ok('«구체적으로» 칸은 글 칸(사진 아님)', await p.evaluate(() => !document.querySelector('.gx-ed-ph') && !!document.querySelector('.gx-ed-r .fw-in')), await 이름칸(p))

  console.log('③ ✍ 예시 채우기 → 자동 칸')
  await p.locator('button', { hasText: '예시 채우기' }).click()
  await p.waitForTimeout(300)
  const 모든값 = await p.evaluate(() => { const g = window.__격자; const out = []; g.doc.sheets.forEach((s, si) => { for (const x of s.cells) if (x[5] === 2 || x[5] === 3) { const v = g.책.값(si, x[0], x[1]); out.push(v && v.e ? '#' + v.e : v) } }); return out })
  const 오류칸 = 모든값.filter((v) => typeof v === 'string' && v.startsWith('#'))
  ok('오류 칸 0', !오류칸.length, 오류칸.slice(0, 5))
  ok('판정 «✓ 신고 대상 …»', (await 값은(p, '판정', '판정')) === 대상, await 값은(p, '판정', '판정'))
  ok('해체 2,400 ㎡ 는 «기준 밑» · 학교 50 m 안 «✓ 해당» → 규모 · 주변 해당', (await 값은(p, '판정', '규판#2')) === '기준 밑' && (await 값은(p, '판정', '주판#3')) === '✓ 해당' && (await 값은(p, '판정', '규모판정')) === '✓ 규모 · 주변 기준에 해당')
  ok('장비 대수 계 8 · 21일간 · 18일 → ✓ 5일 이상', (await 값은(p, '판정', '장비대수')) === 8 && (await 값은(p, '판정', '장비달력')) === '(21일간)' && (await 값은(p, '판정', '장비판정')) === '✓ 5일 이상 씀')
  const 표 = []
  for (let k = 1; k <= 5; k++) 표.push([await 값은(p, '신고서', `장종류#${k}`), await 값은(p, '신고서', `장대수#${k}`)])
  ok('신고서 장비 표 — 쓰는 것만 차례로(브레이커 4 · 발전기 1 · 압쇄기 1 · 콘크리트 절단기 2 · 다음 칸 빔)', JSON.stringify(표) === JSON.stringify([['브레이커', 4], ['발전기', 1], ['압쇄기', 1], ['콘크리트 절단기', 2], ['', '']]), 표)
  ok('신고서 형식도 따라옴(휴대용 · 전동식)', (await 값은(p, '신고서', '장형식#1')) === '휴대용 · 전동식')
  ok('공사 규모 «해체 연면적 2,400 ㎡»(판정 장에서)', (await 값은(p, '신고서', '공사규모')) === '해체 연면적 2,400 ㎡', await 값은(p, '신고서', '공사규모'))
  ok('공사 33일간 · 특정장비 21일간 · 18 일', (await 값은(p, '신고서', '공사일간')) === '(33일간)' && (await 값은(p, '신고서', '장기간')) === '(21일간)' && (await 값은(p, '신고서', '장일간')) === 18)
  ok('신고인 «예시건설(주) 홍길동»', (await 값은(p, '신고서', '신고인표시')) === '예시건설(주) 홍길동')
  ok('개요 기간 «2026. 11. 16. ~ 2026. 12. 18.  (33일간)»', (await 값은(p, '개요', '개기간')) === '2026. 11. 16. ~ 2026. 12. 18.  (33일간)', await 값은(p, '개요', '개기간'))
  ok('50 m 안 피해 대상 «3 곳»(45 · 15 · 0.5 m · 62 m 는 뺌)', (await 값은(p, '위치도', '피수')) === '3 곳', await 값은(p, '위치도', '피수'))
  ok('방음 요약 «설치 곤란 사유: 제21조제7항 4호 …»', (await 값은(p, '방음', '방음요약')) === '설치 곤란 사유: 제21조제7항 4호 — «첨부 4» 저감대책을 구체적으로', await 값은(p, '방음', '방음요약'))
  ok('사유 원문(4호) 저절로', (await 값은(p, '방음', '사유원문')) === '건축물의 해체 등으로 방음벽시설을 사전에 설치하기 곤란한 경우')
  ok('저감 «✓ 저감대책 4가지 적용»', (await 값은(p, '저감대책', '저감요약')) === '✓ 저감대책 4가지 적용 (4가지 가운데)')
  ok('민원 담당 = 현장 책임자(신고서에서)', (await 값은(p, '저감대책', '민원담당')) === '김철수')
  ok('확인 «✓ 착공 전 제출 (7일 앞)» · «✓ 8가지 모두 확인»', (await 값은(p, '확인', '착공전')) === '✓ 착공 전 제출 (7일 앞)' && (await 값은(p, '확인', '제출요약')) === '✓ 8가지 모두 확인 — 제출')
  ok('장비 30 % «8대 → 11대 이상이 되면»', (await 값은(p, '확인', '장비30')) === '신고한 장비 8대 → 11대 이상이 되면 변경신고', await 값은(p, '확인', '장비30'))
  ok(`기한(오늘 기준) «${기한글(일련(2026, 12, 18))}»`, (await 값은(p, '확인', '기한')) === 기한글(일련(2026, 12, 18)), await 값은(p, '확인', '기한'))
  /* 📐 예시 그림 — 위치도 · 방음 배치 도면 칸에 현장 사진(관 부설) 대신 위에서 본 예시 그림 */
  await p.waitForFunction(() => /사진 2장을 넣었습니다/.test(document.body.innerText), null, { timeout: 15000 }).catch(() => {})
  ok('예시 채우기 → «📷 사진 2장을 넣었습니다»(사진 칸 둘)', /사진 2장을 넣었습니다/.test(await p.evaluate(() => document.body.innerText)))
  const 색1 = await 칸색(p, '위치도', '위치도')
  ok(`위치도 칸 = 예시 위치도 그림(종이색 ${색1[3]} % — 흰 빈칸 · 사진은 0 %)`, 그림색(색1), 색1)
  const 색2 = await 칸색(p, '방음', '방음도면')
  ok(`방음 · 방진시설 배치 도면 칸 = 예시 배치 그림(종이색 ${색2[3]} % — 관 부설 사진 아님)`, 그림색(색2), 색2)
  ok('오류 0(PC · 예시)', !오류.length, 오류)
  /* 다음 서류로 갔다가 다시 이 서식으로 */
  await p.locator('.flist a[href="/forms/soeum"]').first().click()
  await p.waitForURL(/\/forms\/soeum$/, { timeout: 10000 })
  await p.waitForTimeout(600)
  const 되돌 = await p.evaluate((s) => [...document.querySelectorAll('.flist a[href]')].some((a) => a.getAttribute('href') === '/forms/' + s), SLUG)
  ok('소음 · 진동 측정 기록부로 감 → 거기 «놓치기 쉬운 것» 에 특정공사 사전신고서 링크', 되돌)
  ok('오류 0(다음 서류)', !오류.length, 오류)
  /* 다른 서식(공사 사진대지 — 사진 칸 머리 «사진»)은 전처럼 현장 사진 */
  await 종이(p, 'sajin-daeji')
  await p.locator('button', { hasText: '예시 채우기' }).click()
  await p.waitForFunction(() => /사진 3장을 넣었습니다/.test(document.body.innerText), null, { timeout: 15000 }).catch(() => {})
  const DOC2 = JSON.parse(fs.readFileSync(path.join(ROOT, 'web/public/forms/g/sajin-daeji.json'), 'utf8'))
  const 색3 = await 칸색칸(p, DOC2, 0, 10, 7)
  ok(`다른 서식(공사 사진대지)은 전처럼 현장 사진 3장(종이색 ${색3[3]} % · 평균 ${색3.slice(0, 3)})`, /사진 3장을 넣었습니다/.test(await p.evaluate(() => document.body.innerText)) && !그림색(색3) && 색3[0] + 색3[1] + 색3[2] < 3 * 235, 색3)
  ok('오류 0(사진대지)', !오류.length, 오류)
  await ctx.close()
}

console.log('④ 이용자처럼 빈 종이에 적기 (PC) — 다른 서식에 쓴 값이 먼저 들어옴')
const 착공 = 오늘 + 27, 준공 = 오늘 + 72, 개시 = 착공 + 2, 종료 = 착공 + 11
{
  const { ctx, p, 오류 } = await 새쪽(1280, 900, false)
  await 종이(p)
  await p.evaluate((공) => { localStorage.removeItem('kcm.격자'); localStorage.setItem('kcm.서식공통', JSON.stringify(공)) },
    { 현장: '시험 근린생활시설 신축공사', 회사: '시험건설(주)', 대표: '김시험', 위치: '가나시 다라구 바사로 7', 착공: 날ISO(착공), 준공: 날ISO(준공), 발주: '시험 발주처', 대리인: '박현장', 연락처: '000-1111-2222' })
  await 종이(p)
  const 말 = await p.locator('.fw-say').innerText().catch(() => '')
  ok('«✨ 공사명 · 회사 등 9칸을 지난번 쓴 값으로 채웠습니다»', /공사명 · 회사 등 9칸을 지난번 쓴 값으로 채웠습니다/.test(말), 말)
  const 들어옴 = {}
  for (const k of ['공사명칭', '상호', '대표자', '현장소재지', '착공일', '준공일', '발주자', '현장책임자', '전화번호', '제출일']) 들어옴[k] = await 값은(p, '신고서', k)
  ok('신고서에 9칸 + 제출일(오늘)', JSON.stringify(들어옴) === JSON.stringify({ 공사명칭: '시험 근린생활시설 신축공사', 상호: '시험건설(주)', 대표자: '김시험', 현장소재지: '가나시 다라구 바사로 7', 착공일: 착공, 준공일: 준공, 발주자: '시험 발주처', 현장책임자: '박현장', 전화번호: '000-1111-2222', 제출일: 오늘 }), 들어옴)
  ok('공사 46일간 · 실제 작업일수 46 (비우면 기간 날 수)', (await 값은(p, '신고서', '공사일간')) === '(46일간)' && (await 값은(p, '신고서', '실작업일수')) === 46)
  ok('개요 — 공사명 · 기간 · 시공자 · 책임자 저절로', (await 값은(p, '개요', '개공사명')) === '시험 근린생활시설 신축공사' && (await 값은(p, '개요', '개기간')) === `${날글(착공)} ~ ${날글(준공)}  (46일간)` && (await 값은(p, '개요', '개시공')) === '시험건설(주)' && (await 값은(p, '개요', '개책임')) === '박현장')
  ok('저감대책 민원 담당 박현장(신고서에서)', (await 값은(p, '저감대책', '민원담당')) === '박현장')
  ok(`확인 «✓ 착공 전 제출 (27일 앞)»`, (await 값은(p, '확인', '착공전')) === '✓ 착공 전 제출 (27일 앞)', await 값은(p, '확인', '착공전'))
  ok(`기한 «${기한글(준공)}»`, (await 값은(p, '확인', '기한')) === 기한글(준공), await 값은(p, '확인', '기한'))
  ok('아무것도 안 적으면 판정 빈칸', (await 값은(p, '판정', '판정')) === '' && (await 값은(p, '확인', '확판정')) === '')
  /* 굴착기 대수 — 종이의 칸을 눌러 씀 */
  await 칸누르기(p, '판정', '대수#5')
  ok('굴착기 대수 칸을 누르면 아래 쓰는 칸이 열림', /대수/.test(await 이름칸(p)), await 이름칸(p))
  await p.locator('.gx-ed-r .fw-in').first().fill('2')
  await p.keyboard.press('Enter')
  await p.waitForTimeout(200)
  await 넣음(p, '판정', '형식#5', '0.6 ㎥')
  ok('대수 계 2', (await 값은(p, '판정', '장비대수')) === 2, await 값은(p, '판정', '장비대수'))
  ok('기간 안 적으면 «⚠ 쓰는 기간 · 실제 작업일수 적기»', (await 값은(p, '판정', '판정')) === '⚠ 쓰는 기간 · 실제 작업일수 적기', await 값은(p, '판정', '판정'))
  await 넣음(p, '판정', '장비개시', 개시); await 넣음(p, '판정', '장비종료', 종료)
  ok('10일간 · 실제 작업일수 10 · ✓ 5일 이상', (await 값은(p, '판정', '장비달력')) === '(10일간)' && (await 값은(p, '판정', '장비일수')) === 10 && (await 값은(p, '판정', '장비판정')) === '✓ 5일 이상 씀')
  ok('규모 · 주변 안 적으면 «⚠ ㉯ 규모나 ㉰ 주변을 적으세요»', (await 값은(p, '판정', '판정')) === '⚠ ㉯ 규모나 ㉰ 주변을 적으세요', await 값은(p, '판정', '판정'))
  await 넣음(p, '판정', '건축연면적', 1500)
  ok('건축 1,500 ㎡ → ✓ 기준 이상 → ✓ 신고 대상', (await 값은(p, '판정', '규판#1')) === '✓ 기준 이상' && (await 값은(p, '판정', '판정')) === 대상, await 값은(p, '판정', '판정'))
  ok('신고서 장비 표 첫 줄 굴착기 · 0.6 ㎥ · 2 · 다음 줄 빔', (await 값은(p, '신고서', '장종류#1')) === '굴착기' && (await 값은(p, '신고서', '장형식#1')) === '0.6 ㎥' && (await 값은(p, '신고서', '장대수#1')) === 2 && (await 값은(p, '신고서', '장종류#2')) === '')
  ok('공사 규모 «건축 연면적 1,500 ㎡» · 장비 기간 10 일', (await 값은(p, '신고서', '공사규모')) === '건축 연면적 1,500 ㎡' && (await 값은(p, '신고서', '장개시')) === 개시 && (await 값은(p, '신고서', '장일간')) === 10)
  await 넣음(p, '판정', '대수#4', 1)
  ok('브레이커 1대 더 → 표 차례 브레이커 · 굴착기(별표 9 차례)', (await 값은(p, '신고서', '장종류#1')) === '브레이커' && (await 값은(p, '신고서', '장종류#2')) === '굴착기' && (await 값은(p, '신고서', '장대수#2')) === 2)
  ok('장비 30 % «3대 → 4대 이상이 되면»', (await 값은(p, '확인', '장비30')) === '신고한 장비 3대 → 4대 이상이 되면 변경신고', await 값은(p, '확인', '장비30'))
  /* 방음벽 설치 */
  await 넣음(p, '방음', '방음여부', '설치함')
  ok('설치함 → «→ 가. 설치명세를 적습니다» · 요약 «⚠ 가. 설치명세 적기»', (await 값은(p, '방음', '방음안내')) === '→ 가. 설치명세를 적습니다' && (await 값은(p, '방음', '방음요약')) === '⚠ 가. 설치명세 적기')
  await 넣음(p, '방음', '벽위치#1', '남쪽 경계(학교 쪽)'); await 넣음(p, '방음', '벽연장#1', 40); await 넣음(p, '방음', '벽높이#1', 3); await 넣음(p, '방음', '벽형식#1', '흡음형'); await 넣음(p, '방음', '벽손실#1', 8)
  await 넣음(p, '방음', '벽위치#2', '동쪽 경계'); await 넣음(p, '방음', '벽연장#2', 25.5); await 넣음(p, '방음', '벽높이#2', 2.4); await 넣음(p, '방음', '벽손실#2', 10)
  ok('높이 3 · 8 dB → ✓ · 높이 2.4 → ⚠', (await 값은(p, '방음', '벽판정#1')) === '✓ 별표 10 기준' && (await 값은(p, '방음', '벽판정#2')) === '⚠ 높이 3 m · 7 dB 기준 밑')
  ok('요약 «⚠ 기준 밑 1곳 …» · 연장 계 65.5', (await 값은(p, '방음', '방음요약')) === '⚠ 기준 밑 1곳 — 높이 · 삽입손실 다시 보기' && (await 값은(p, '방음', '벽연장계')) === 65.5)
  await 넣음(p, '방음', '벽높이#2', 3)
  ok('높이를 3 m 로 고치면 «✓ 방음벽 2곳 · 연장 65.5 m — 별표 10 기준»', (await 값은(p, '방음', '방음요약')) === '✓ 방음벽 2곳 · 연장 65.5 m — 별표 10 기준', await 값은(p, '방음', '방음요약'))
  /* 저감대책 · 제출 확인 */
  await 넣음(p, '저감대책', '저적#1', '○'); await 넣음(p, '저감대책', '저적#2', '×')
  ok('저감 «✓ 저감대책 1가지 적용»', (await 값은(p, '저감대책', '저감요약')) === '✓ 저감대책 1가지 적용 (4가지 가운데)')
  await 넣음(p, '저감대책', '저적#1', '×')
  ok('모두 × → «⚠ 하나도 고르지 않음 …»', (await 값은(p, '저감대책', '저감요약')) === '⚠ 하나도 고르지 않음 — 방음벽이 없으면 특히 구체적으로')
  await 넣음(p, '저감대책', '저적#1', '○'); await 넣음(p, '저감대책', '저적#4', '○')
  for (let j = 1; j <= 7; j++) await 넣음(p, '확인', `제출#${j}`, '○')
  await 넣음(p, '확인', '제출#8', '×')
  ok('× 하나 → «⚠ 남은 것 1가지»', (await 값은(p, '확인', '제출요약')) === '⚠ 남은 것 1가지', await 값은(p, '확인', '제출요약'))
  await 넣음(p, '확인', '제출#8', '해당 없음')
  ok('해당 없음으로 → «✓ 8가지 모두 확인 — 제출»', (await 값은(p, '확인', '제출요약')) === '✓ 8가지 모두 확인 — 제출')
  /* 착공 뒤 제출 · 공사기간 지남 */
  await 넣음(p, '신고서', '제출일', 착공 + 4)
  ok('제출일이 착공 뒤 → «⚠ 제출일이 착공일 뒤 …»', (await 값은(p, '확인', '착공전')) === '⚠ 제출일이 착공일 뒤 — 건설공사는 착공 전까지 내야 합니다')
  await 넣음(p, '신고서', '제출일', 오늘)
  await 넣음(p, '신고서', '준공일', 오늘 - 1)
  ok('작업종료일이 어제 → «⚠ 신고한 공사기간이 … 에 끝났습니다»', (await 값은(p, '확인', '기한')) === 기한글(오늘 - 1), await 값은(p, '확인', '기한'))
  ok('끝이 앞서면 공사일간 «⚠ 끝이 앞섬»', (await 값은(p, '신고서', '공사일간')) === '⚠ 끝이 앞섬')
  await 넣음(p, '신고서', '준공일', 준공)
  /* 마지막 한 칸은 종이에서 써서 저절로 남게 — 새로고침해도 그대로 */
  await 쳐넣기(p, '개요', '공사목적', '근린생활시설(2층) 신축')
  ok('공사 목적 쳐 넣음', (await 값은(p, '개요', '공사목적')) === '근린생활시설(2층) 신축', await 값은(p, '개요', '공사목적'))
  await p.waitForTimeout(1000)
  await 종이(p)
  ok('새로고침 → 판정 · 장비 · 방음 · 확인 그대로(이 기기)', (await 값은(p, '판정', '판정')) === 대상 && (await 값은(p, '판정', '장비대수')) === 3 && (await 값은(p, '방음', '방음요약')) === '✓ 방음벽 2곳 · 연장 65.5 m — 별표 10 기준' && (await 값은(p, '확인', '제출요약')) === '✓ 8가지 모두 확인 — 제출' && (await 값은(p, '개요', '공사목적')) === '근린생활시설(2층) 신축')
  ok('새로고침 → 기한 다시 셈(오늘 기준)', (await 값은(p, '확인', '기한')) === 기한글(준공))
  /* 여기 쓴 공사명 → 다른 서식에 먼저 */
  await 쳐넣기(p, '신고서', '공사명칭', '시험 근린생활시설 신축공사(2차)')
  await p.waitForTimeout(300)
  await 종이(p, 'wonga')
  const w = await p.evaluate(() => { const g = window.__격자; const s = g.doc.sheets[0]; const a = Object.entries(s.keys).find(([, k]) => k === '공사명'); if (!a) return null; const m = /^([A-Z]+)(\d+)$/.exec(a[0]); let c = 0; for (const ch of m[1]) c = c * 26 + ch.charCodeAt(0) - 64; return g.책.값(0, +m[2], c) })
  ok('여기 고친 공사명이 다른 서식(공사원가계산서)에 먼저 들어감', w === '시험 근린생활시설 신축공사(2차)', w)
  ok('오류 0(PC · 적기)', !오류.length, 오류)
  await ctx.close()
}

console.log('⑤ 대상 아님 · 빠지는 경우 · 고쳐 쓰기 (PC)')
{
  const { ctx, p, 오류 } = await 새쪽(1280, 900, false)
  await 종이(p)
  const 판 = () => 값은(p, '판정', '판정')
  await 넣음(p, '판정', '건축연면적', 800)
  ok('건축 800 ㎡ 만 → 규판 «기준 밑» · 판정 «⚠ ㉮ 특정장비 · 쓰는 기간을 적으세요»', (await 값은(p, '판정', '규판#1')) === '기준 밑' && (await 판()) === '⚠ ㉮ 특정장비 · 쓰는 기간을 적으세요', await 판())
  await 넣음(p, '판정', '대수#5', 1); await 넣음(p, '판정', '장비개시', 오늘 + 10); await 넣음(p, '판정', '장비종료', 오늘 + 16)
  for (let i = 1; i <= 7; i++) await 넣음(p, '판정', `주변#${i}`, '없음')
  ok('굴착기 7일 · 주변 모두 없음 → «대상 아님 — 규모 · 주변 기준 밑»', (await 판()) === '대상 아님 — 규모 · 주변 기준 밑', await 판())
  await 넣음(p, '판정', '장비일수', 4)
  ok('실제 작업일수를 4 로 고쳐 쓰면 «5일 미만» → «대상 아님 — 특정장비를 5일 이상 쓰지 않음»', (await 값은(p, '판정', '장비판정')) === '5일 미만 — 장비 조건 밑' && (await 판()) === '대상 아님 — 특정장비를 5일 이상 쓰지 않음', await 판())
  await 넣음(p, '판정', '장비일수', undefined)
  ok('처음 값으로 → 7일 다시', (await 값은(p, '판정', '장비일수')) === 7)
  await 넣음(p, '판정', '장비종료', 오늘 + 12)
  ok('기간 3일 → «대상 아님 — 특정장비를 5일 이상 쓰지 않음»', (await 값은(p, '판정', '장비일수')) === 3 && (await 판()) === '대상 아님 — 특정장비를 5일 이상 쓰지 않음')
  await 넣음(p, '판정', '장비종료', 오늘 + 16)
  await 넣음(p, '판정', '주변#3', '있음')
  ok('학교 50 m 안 있음 → 800 ㎡ 여도 «✓ 신고 대상»', (await 값은(p, '판정', '주판#3')) === '✓ 해당' && (await 판()) === 대상, await 판())
  await 넣음(p, '판정', '제외지역', '전용공업지역')
  ok('전용공업지역 → «대상 아님 — 빠지는 경우 …»', (await 판()) === 빠짐, await 판())
  await 넣음(p, '판정', '제외지역', '해당 없음')
  ok('«해당 없음» 으로 → 다시 ✓ 신고 대상', (await 판()) === 대상)
  await 넣음(p, '판정', '저소음', '예')
  ok('저소음 인정 장비만 «예» → 빠지는 경우', (await 판()) === 빠짐)
  await 넣음(p, '판정', '저소음', '아니오')
  await 넣음(p, '판정', '장비종료', 오늘 + 5)
  ok('끝이 앞서면 «⚠ 끝이 앞섬» · 작업일수 빈칸 → 판정 «⚠ 쓰는 기간 …»', (await 값은(p, '판정', '장비달력')) === '⚠ 끝이 앞섬' && (await 값은(p, '판정', '장비일수')) === '' && (await 판()) === '⚠ 쓰는 기간 · 실제 작업일수 적기', await 판())
  await 넣음(p, '판정', '장비종료', 오늘 + 16)
  /* 방음벽 설치 곤란 — 2호 */
  await 넣음(p, '방음', '방음여부', '설치가 곤란함(제21조제7항)')
  ok('설치가 곤란함 → 안내 «→ 나. …» · 요약 «⚠ 나. 사유 고르기»', (await 값은(p, '방음', '방음안내')) === '→ 나. 사유 · 대신하는 것을 적습니다' && (await 값은(p, '방음', '방음요약')) === '⚠ 나. 사유 고르기')
  await 넣음(p, '방음', '곤란사유', '선형공사(2호)')
  ok('2호 원문 저절로', (await 값은(p, '방음', '사유원문')) === '도로공사 등 공사구역이 광범위한 선형공사에 해당하는 경우', await 값은(p, '방음', '사유원문'))
  ok('2호 예문 저절로(고쳐 쓸 수 있게)', (await 값은(p, '방음', '곤란설명')) === '공사 구간이 길게 이어져 미리 세우기 곤란함 — 작업하는 구간에만 이동식 방음벽을 옮겨 가며 둠', await 값은(p, '방음', '곤란설명'))
  ok('요약 «설치 곤란 사유: 제21조제7항 2호 …»', (await 값은(p, '방음', '방음요약')) === '설치 곤란 사유: 제21조제7항 2호 — «첨부 4» 저감대책을 구체적으로')
  await 넣음(p, '방음', '곤란설명', '하천변 400 m 구간 — 구간마다 이동식 방음벽')
  ok('예문을 고쳐 쓰면 고친 글 그대로', (await 값은(p, '방음', '곤란설명')) === '하천변 400 m 구간 — 구간마다 이동식 방음벽')
  /* 50 m 경계 · 일정 */
  await 넣음(p, '위치도', '피거리#1', 50); await 넣음(p, '위치도', '피거리#2', 50.5)
  ok('50 m 는 ✓ · 50.5 m 는 빈칸 · «1 곳»', (await 값은(p, '위치도', '피50#1')) === '✓' && (await 값은(p, '위치도', '피50#2')) === '' && (await 값은(p, '위치도', '피수')) === '1 곳')
  await 넣음(p, '개요', '시작#1', 오늘 + 10); await 넣음(p, '개요', '끝#1', 오늘 + 14)
  ok('일정 5일', (await 값은(p, '개요', '일수#1')) === 5)
  await 넣음(p, '개요', '끝#1', 오늘 + 8)
  ok('끝이 앞서면 «⚠»', (await 값은(p, '개요', '일수#1')) === '⚠')
  ok('개요 «특정장비 쓰는 기간» 줄 «실제 작업 7일»', (await 값은(p, '개요', '일실제')) === '실제 작업 7일', await 값은(p, '개요', '일실제'))
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
console.log(`\n${bad ? '✗' : '✓'} 시험_특정공사신고화면 ${n - bad}/${n}`)
process.exit(bad ? 1 : 0)
