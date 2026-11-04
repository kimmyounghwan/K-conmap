/**
 * 🌡️ G531 «한중 · 서중 콘크리트 시공계획서» 서식 화면 시험 — 구운 사이트(dist + web/public/forms/g)를 띄운 뒤:
 *   node tools/시험_한중서중화면.mjs [주소=http://127.0.0.1:4996]
 *   소장님 「웹 싹 다 검색해서 필요한 서류 도구화 하자」 → 후보 ⑦ 한중 · 서중 콘크리트 시공계획서 + 적산온도
 *   소장님 「빠짐없이 기록하고 사이트에 작업하게 하고, 다운만 받고, 이용자 안오게 하면 안돼. 계속 사이트 찾게 해야 해」(11-04)
 *   ① 서식 탭 ⑤ 품질 칸 카드 · 찾기(«한중 콘크리트» · «서중 콘크리트» · «적산온도» · «기온보정강도»)
 *   ② 서식 화면(PC): 쪽 수 = 판짜기 · 제목 · 근거(KCS 14 20 40 · 41 · 10 · KCI-CT 118 · 적산온도) · «무료» · «클로드» 없음 · 빈 틀 엑셀(시트 5장) · PDF 단추 ·
 *      다음에 쓸 서류 링크(타설 체크리스트 · 레미콘 반입 검사표 · 양생 관리대장) · 거기서 되돌아오는 링크
 *   ③ «✍ 예시 채우기»(12월 기초 · 벽체 · 일평균 1.5 ℃) → 한중 · Tn 6 · 호칭강도 30 · 타설 온도 · 소요 5 MPa · 3일 · 날짜 이어짐 · 적산온도 137.5 · 4.6일 · 16 % ·
 *      공시체 4.2 → 5.8 MPa · 초기양생 끝 · 확인 9가지 · 서중 해당 없음 · 7일 전 승인
 *   ④ 이용자처럼(여름 · 서중): 다른 서식에 쓴 공사명 · 회사 · 위치 · 대리인 4칸이 먼저 · 작성일 오늘 · 판정 서중 · Tn 일반 표(0 · 3 · 6) · 단위수량 ⚠ ·
 *      35 ℃ · 1.5시간 ⚠ → ✓ · 습윤 양생 5일 · 서중 확인 · 승인일 뒤 ⚠ · 종이 칸을 눌러 적기 · 새로고침 그대로 · 여기 쓴 공사명이 다른 서식에 먼저
 *   ⑤ 경계 · 한중 깊이: 4 ℃ · 0 ℃ · 25 ℃ · 30 ℃ 경계 · 동해 · 한중 + 서중 · 예보 빠짐 · 0 ℃ 밑 Tn 직접 · 28일 승인 · 91일 · 적산온도 방식 ·
 *      W/B · AE · FA · 슬래그 섞어 씀 · 300 mm · 가혹 · 소요 15 · 12 · 10 MPa · 양생일수 12 · 3일 · 0 ℃ 밑 날 · −12 ℃ 기여 0 · 날짜 이어짐 고침 · 소요 강도 없음
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
const SLUG = 'hanjung-seojung'
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
const 한중말 = '❄ 한중 콘크리트로 시공 — KCS 14 20 40'
const 서중말 = '☀ 서중 콘크리트로 시공 — KCS 14 20 41 · 시공계획서 책임기술자 승인'
const 일반말 = '일반 콘크리트 — 한중 · 서중 조건 아님 (KCS 14 20 10)'
const CEM1 = '보통포틀랜드 · 플라이 애시 1종 · 고로 슬래그 1종', CEM2 = '플라이 애시 시멘트 2종', CEM3 = '고로 슬래그 시멘트 2종'

console.log('① 서식 탭 · 찾기 (폰 390)')
{
  const { ctx, p, 오류 } = await 새쪽(390, 844)
  await p.goto(BASE + '/forms', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('input[placeholder*="서식 찾기"]', { timeout: 15000 })
  await p.waitForTimeout(500)
  const 링크 = await p.evaluate((s) => [...document.querySelectorAll('a')].filter((a) => (a.getAttribute('href') || '').endsWith('/forms/' + s)).length, SLUG)
  ok('서식 탭에 «한중 · 서중 콘크리트 시공계획서» 카드(링크)', 링크 > 0, 링크)
  for (const 말 of ['한중 콘크리트', '서중 콘크리트', '적산온도', '기온보정강도']) {
    await p.fill('input[placeholder*="서식 찾기"]', 말)
    await p.waitForTimeout(500)
    const 있음 = await p.evaluate(() => /한중 · 서중 콘크리트 시공계획서/.test(document.querySelector('main').innerText))
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
  ok('탭 제목에 «한중 · 서중 콘크리트 시공계획서»', /한중 · 서중 콘크리트 시공계획서/.test(await p.title()), await p.title())
  const 본문 = await p.evaluate(() => document.querySelector('main').innerText)
  for (const t of ['KCS 14 20 40', 'KCS 14 20 41', 'KCS 14 20 10', 'KCI-CT 118', '적산온도 M = Σ(θ + 10)Δt', '기온보정강도']) ok(`근거 «${t}» 보임`, 본문.includes(t))
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
  for (const [h, t] of [['/forms/taseol-check', '콘크리트 타설 체크리스트'], ['/forms/remicon', '레미콘 반입 검사표'], ['/forms/yangsaeng', '콘크리트 양생 관리대장']]) {
    ok(`«놓치기 쉬운 것» 에 ${t} 링크`, 다음.some(([hh, tt]) => hh === h && tt === t), 다음)
  }
  await 칸누르기(p, '판정', '일평균')
  ok('일평균기온 칸을 누르면 아래 쓰는 칸이 열림(사진 칸 아님)', /일평균/.test(await 이름칸(p)) && await p.evaluate(() => !document.querySelector('.gx-ed-ph')), await 이름칸(p))

  console.log('③ ✍ 예시 채우기 → 자동 칸')
  await p.locator('button', { hasText: '예시 채우기' }).click()
  await p.waitForTimeout(300)
  const 모든값 = await p.evaluate(() => { const g = window.__격자; const out = []; g.doc.sheets.forEach((s, si) => { for (const x of s.cells) if (x[5] === 2 || x[5] === 3) { const v = g.책.값(si, x[0], x[1]); out.push(v && v.e ? '#' + v.e : v) } }); return out })
  const 오류칸 = 모든값.filter((v) => typeof v === 'string' && v.startsWith('#'))
  ok('오류 칸 0', !오류칸.length, 오류칸.slice(0, 5))
  ok('판정 «❄ 한중 …» · 종류 «한중»', (await 값은(p, '판정', '판정')) === 한중말 && (await 값은(p, '판정', '종류')) === '한중', await 값은(p, '판정', '판정'))
  ok('판정 칸 넷(1.5 ℃ · −3.5 ℃ · 6 ℃ · 없음)', JSON.stringify([await 값은(p, '판정', '판1'), await 값은(p, '판정', '판2'), await 값은(p, '판정', '판3'), await 값은(p, '판정', '판4')]) ===
    JSON.stringify(['❄ 4 ℃ 이하 — 한중', '❄ 0 ℃ 이하 — 한중', '30 ℃ 이하', '없음']))
  ok('품질기준강도 24 · Tn 6(한중 표 28일) · 호칭강도 30', (await 값은(p, '배합', 'fcq')) === 24 && (await 값은(p, '배합', 'Tn자동')) === 6 && (await 값은(p, '배합', 'Tn')) === 6 && (await 값은(p, '배합', 'fcn')) === 30)
  ok('Tn 근거 «KCS 14 20 40 표 2.2-1 (0 ℃ 이상 4 ℃ 미만 · 28일)»', (await 값은(p, '배합', 'Tn근거')) === 'KCS 14 20 40 표 2.2-1 (0 ℃ 이상 4 ℃ 미만 · 28일)', await 값은(p, '배합', 'Tn근거'))
  ok('주문 «레미콘을 호칭강도 30 MPa 이상으로 …»', (await 값은(p, '배합', '주문')) === '레미콘을 호칭강도 30 MPa 이상으로 주문 (품질기준강도 24 + Tn 6) — KS 규격에 없는 값이면 그보다 높은 규격', await 값은(p, '배합', '주문'))
  ok('배합 요약 «✓ 호칭강도 30 MPa · 배합 확인 5가지»', (await 값은(p, '배합', '배합요약')) === '✓ 호칭강도 30 MPa · 배합 확인 5가지', await 값은(p, '배합', '배합요약'))
  ok('타설 온도 기준 5 ~ 20 ℃ · 계획 10 ~ 18 ℃ ✓', (await 값은(p, '타설양생', '타기준')) === '5 ~ 20 ℃ (KCS 14 20 40 3.3)' && (await 값은(p, '타설양생', '타판정')) === '✓ 계획 온도가 기준 안')
  ok('소요 압축강도 5 MPa · 양생일수 3일(보통 노출 · 10 ℃ · 보통포틀랜드)', (await 값은(p, '타설양생', '소요강도')) === 5 && (await 값은(p, '타설양생', '양생일수')) === 3)
  ok('양생 요약 «❄ 콘크리트 온도 5 ℃ 이상으로 5 MPa 까지(표준 3일) → …»', (await 값은(p, '타설양생', '양생요약')) === '❄ 콘크리트 온도 5 ℃ 이상으로 5 MPa 까지(표준 3일) → 그 뒤 2일간 어느 부분이라도 0 ℃ 이상 (3.4.1)', await 값은(p, '타설양생', '양생요약'))
  ok('습윤 양생 칸 «한중 — 위 ㉯ …»(일평균 1.5 ℃ 가 저절로)', (await 값은(p, '타설양생', '습기온')) === 1.5 && (await 값은(p, '타설양생', '습윤')) === '한중 — 위 ㉯ 의 초기양생 · 보온 양생을 따름')
  const 타 = 일련(2026, 12, 9)
  ok('온도 기록 날짜 — 타설 다음 날부터 이어짐(12/10 · 12/23)', (await 값은(p, '온도기록', '날짜#1')) === 타 + 1 && (await 값은(p, '온도기록', '날짜#14')) === 타 + 14 && (await 값은(p, '온도기록', '재령#1')) === 1)
  ok('적산온도 24.5 → 137.5 °D·D · 20 ℃ 환산 0.8 → 4.6일', (await 값은(p, '온도기록', 'M#1')) === 24.5 && (await 값은(p, '온도기록', 'M#7')) === 137.5 && (await 값은(p, '온도기록', 'Z#1')) === 0.8 && (await 값은(p, '온도기록', 'Z#7')) === 4.6)
  ok('마지막 날 137.5 · 4.6일 · 840 대비 16 %', (await 값은(p, '온도기록', 'M끝')) === 137.5 && (await 값은(p, '온도기록', 'Z끝')) === 4.6 && (await 값은(p, '온도기록', 'M비')) === '16 %')
  ok('온도 요약 «기록 7일 · 5 ℃ 밑 2일 (초기양생 중이면 안 됨)»', (await 값은(p, '온도기록', '온도요약')) === '기록 7일 · 5 ℃ 밑 2일 (초기양생 중이면 안 됨)', await 값은(p, '온도기록', '온도요약'))
  ok('공시체 3일 4.2 MPa «밑» · 4일 5.8 MPa «✓» → 초기양생 끝', (await 값은(p, '온도기록', '공판#1')) === '소요 5 MPa 밑 — 보온 양생 이어서' && (await 값은(p, '온도기록', '공판#2')) === '✓ 소요 5 MPa 이상' &&
    (await 값은(p, '온도기록', '공재령#2')) === 4 && ((await 값은(p, '온도기록', '종료')) || '').startsWith('✓ 공시체 강도가 소요 강도 이상'))
  ok('확인 «✓ 9가지 모두 확인» · 서중 «해당 없음 (서중 아님)» · «✓ 타설 7일 전 승인»', (await 값은(p, '확인', '한요약')) === '✓ 9가지 모두 확인' && (await 값은(p, '확인', '서요약')) === '해당 없음 (서중 아님)' && (await 값은(p, '확인', '승인판')) === '✓ 타설 7일 전 승인')
  ok('작성자 «예시건설(주) 김철수»', (await 값은(p, '확인', '작성자표시')) === '예시건설(주) 김철수')
  ok('오류 0(PC · 예시)', !오류.length, 오류)
  await p.locator('.flist a[href="/forms/yangsaeng"]').first().click()
  await p.waitForURL(/\/forms\/yangsaeng$/, { timeout: 10000 })
  await p.waitForTimeout(600)
  ok('양생 관리대장으로 감 → 거기서 이 서식으로 오는 링크', await p.evaluate((s) => [...document.querySelectorAll('.flist a[href]')].some((a) => a.getAttribute('href') === '/forms/' + s), SLUG))
  ok('오류 0(다음 서류)', !오류.length, 오류)
  await ctx.close()
}

console.log('④ 이용자처럼 빈 종이에 적기 (PC · 여름 서중) — 다른 서식에 쓴 값이 먼저 들어옴')
const 타설 = 오늘 + 5
{
  const { ctx, p, 오류 } = await 새쪽(1280, 900, false)
  await 종이(p)
  await p.evaluate((공) => { localStorage.removeItem('kcm.격자'); localStorage.setItem('kcm.서식공통', JSON.stringify(공)) },
    { 현장: '시험 물류센터 신축공사', 회사: '시험건설(주)', 대표: '김시험', 위치: '가나시 다라구 일원', 발주: '시험 발주청', 대리인: '박현장', 연락처: '000-1111-2222' })
  await 종이(p)
  const 말 = await p.locator('.fw-say').innerText().catch(() => '')
  ok('«✨ 공사명 · 회사 등 4칸을 지난번 쓴 값으로 채웠습니다»', /공사명 · 회사 등 4칸을 지난번 쓴 값으로 채웠습니다/.test(말), 말)
  const 들어옴 = {}
  for (const k of ['공사명', '시공사', '현장위치', '현장대리인']) 들어옴[k] = await 값은(p, '판정', k)
  ok('판정 장 4칸 · 작성일 오늘', JSON.stringify(들어옴) === JSON.stringify({ 공사명: '시험 물류센터 신축공사', 시공사: '시험건설(주)', 현장위치: '가나시 다라구 일원', 현장대리인: '박현장' }) && (await 값은(p, '확인', '작성일')) === 오늘, [들어옴, await 값은(p, '확인', '작성일')])
  ok('아무것도 안 적으면 판정 · 배합 · 양생 빈칸', (await 값은(p, '판정', '판정')) === '' && (await 값은(p, '배합', 'fcn')) === '' && (await 값은(p, '타설양생', '양생요약')) === '' && (await 값은(p, '온도기록', 'M끝')) === '')
  /* 기온 — 종이의 칸을 눌러 씀 */
  await 칸누르기(p, '판정', '일평균')
  await p.locator('.gx-ed-r .fw-in').first().fill('27.5')
  await p.keyboard.press('Enter')
  await p.waitForTimeout(200)
  ok('일평균 27.5 ℃ → «☀ 25 ℃ 초과 — 서중» · 아직 «예보를 모두 적으세요» 아님(서중이 먼저)', (await 값은(p, '판정', '판1')) === '☀ 25 ℃ 초과 — 서중' && (await 값은(p, '판정', '판정')) === 서중말, await 값은(p, '판정', '판정'))
  await 넣음(p, '판정', '최저', 22); await 넣음(p, '판정', '최고', 33); await 넣음(p, '판정', '동해', '없음'); await 넣음(p, '판정', '타설일', 타설)
  ok('최고 33 ℃ «☀ 30 ℃ 초과» · 종류 서중 · KCS 14 20 41', (await 값은(p, '판정', '판3')) === '☀ 30 ℃ 초과 — 서중' && (await 값은(p, '판정', '종류')) === '서중' && (await 값은(p, '판정', '따름')) === '② ~ ⑤ 장 — KCS 14 20 41 서중 콘크리트(2025)')
  /* 주문 강도 — 일반 표 */
  await 넣음(p, '배합', 'fck', 30); await 넣음(p, '배합', '시멘트', CEM1); await 넣음(p, '배합', '재령', '28일'); await 넣음(p, '배합', '예상', 26)
  ok('fcd 없음 → fcq 30 · 26 ℃ → Tn 0 · 호칭강도 30 · 근거 일반 표', (await 값은(p, '배합', 'fcq')) === 30 && (await 값은(p, '배합', 'Tn')) === 0 && (await 값은(p, '배합', 'fcn')) === 30 && (await 값은(p, '배합', 'Tn근거')) === 'KCS 14 20 10 표 2.2-1 (4 ℃ 이상 · 28일)', await 값은(p, '배합', 'Tn근거'))
  const tn = async (c, a, t) => { await 넣음(p, '배합', '시멘트', c); await 넣음(p, '배합', '재령', a); await 넣음(p, '배합', '예상', t); return 값은(p, '배합', 'Tn자동') }
  ok('일반 표 — 보통 28일 12 ℃ 3 · 6 ℃ 6 · 42일 6 ℃ 3 · 12 ℃ 0 · 56일 5 ℃ 3 · 7 ℃ 0', JSON.stringify([await tn(CEM1, '28일', 12), await tn(CEM1, '28일', 6), await tn(CEM1, '42일', 6), await tn(CEM1, '42일', 12), await tn(CEM1, '56일', 5), await tn(CEM1, '56일', 7)]) === JSON.stringify([3, 6, 3, 0, 3, 0]))
  ok('일반 표 — FA 2종 28일 9 ℃ 6 · 42일 4.5 ℃ 6 · 5 ℃ 3 · 56일 8 ℃ 0', JSON.stringify([await tn(CEM2, '28일', 9), await tn(CEM2, '42일', 4.5), await tn(CEM2, '42일', 5), await tn(CEM2, '56일', 8)]) === JSON.stringify([6, 6, 3, 0]))
  ok('일반 표 — 고로 2종 28일 13 ℃ 3 · 42일 9 ℃ 6 · 56일 4.5 ℃ 6 · 5 ℃ 3', JSON.stringify([await tn(CEM3, '28일', 13), await tn(CEM3, '42일', 9), await tn(CEM3, '56일', 4.5), await tn(CEM3, '56일', 5)]) === JSON.stringify([3, 6, 6, 3]))
  await tn(CEM1, '28일', 26)
  await 넣음(p, '배합', 'WB', 55); await 넣음(p, '배합', 'AE', '아니오'); await 넣음(p, '배합', '단위수량', 190)
  ok('서중 — W/B · AE 는 «—»(한중만) · 단위수량 190 «⚠ 185 넘음» · 요약 ⚠ 1곳', (await 값은(p, '배합', 'WB판')) === '—' && (await 값은(p, '배합', 'AE판')) === '—' && (await 값은(p, '배합', '수량판')) === '⚠ 185 ㎏/㎥ 넘음' && (await 값은(p, '배합', '배합요약')) === '⚠ 확인할 것 1곳 — 위 ⚠ 칸', await 값은(p, '배합', '배합요약'))
  await 넣음(p, '배합', '단위수량', 175)
  ok('175 ㎏/㎥ → ✓ · 요약 «✓ 호칭강도 30 MPa · 배합 확인 1가지»', (await 값은(p, '배합', '배합요약')) === '✓ 호칭강도 30 MPa · 배합 확인 1가지', await 값은(p, '배합', '배합요약'))
  /* 타설 · 양생 — 서중 */
  await 넣음(p, '타설양생', '타최저', 28); await 넣음(p, '타설양생', '타최고', 36); await 넣음(p, '타설양생', '운반', 1.8)
  ok('서중 기준 «35 ℃ 이하» · 36 ℃ ⚠ · 1.8시간 ⚠ → 요약 ⚠ 2곳', (await 값은(p, '타설양생', '타기준')) === '35 ℃ 이하 (KCS 14 20 41 3.3)' && (await 값은(p, '타설양생', '타판정')) === '⚠ 35 ℃ 넘음 — 재료 온도를 낮추고 다시 계획' &&
    (await 값은(p, '타설양생', '운반판')) === '⚠ 1.5시간 넘음 — 슬럼프 유지 · 응결 지연 조치 + 책임기술자 승인' && (await 값은(p, '타설양생', '양생요약')) === '⚠ 확인할 것 2곳 — 위 ⚠ 칸', await 값은(p, '타설양생', '양생요약'))
  await 넣음(p, '타설양생', '타최고', 33); await 넣음(p, '타설양생', '운반', 1.4); await 넣음(p, '타설양생', '시멘트2', '보통포틀랜드')
  ok('33 ℃ · 1.4시간 → ✓ · 습윤 양생 5일(27.5 ℃ 저절로 · 보통포틀랜드)', (await 값은(p, '타설양생', '타판정')) === '✓ 35 ℃ 이하' && (await 값은(p, '타설양생', '운반판')) === '✓ 1.5시간 이내 (3.3)' &&
    (await 값은(p, '타설양생', '양생요약')) === '☀ 습윤 양생 5일 이상 — 노출면이 마르지 않게 살수 (3.4.2)', await 값은(p, '타설양생', '양생요약'))
  ok('서중이면 한중 칸(소요 강도 · 양생일수)은 빈칸', (await 값은(p, '타설양생', '소요강도')) === '' && (await 값은(p, '타설양생', '양생일수')) === '')
  await 넣음(p, '타설양생', '습기온', 12); await 넣음(p, '타설양생', '시멘트2', '혼합시멘트 B종(고로 · 플라이 애시 2종)')
  ok('양생 기간 12 ℃ · 혼합 B종 → 9일', (await 값은(p, '타설양생', '습윤')) === '습윤 양생 9일 이상 — 노출면이 마르지 않게 살수 (3.4.2)', await 값은(p, '타설양생', '습윤'))
  await 넣음(p, '타설양생', '습기온', undefined)
  ok('지우면 다시 판정 장 27.5 ℃ 를 따름', (await 값은(p, '타설양생', '습기온')) === 27.5)
  /* 확인 · 승인 */
  for (let j = 1; j <= 7; j++) await 넣음(p, '확인', `서#${j}`, '○')
  await 넣음(p, '확인', '서#5', '×')
  ok('서중 × 하나 → «⚠ × 1가지 — 고친 뒤 타설»', (await 값은(p, '확인', '서요약')) === '⚠ × 1가지 — 고친 뒤 타설')
  await 넣음(p, '확인', '서#5', '○')
  for (let j = 1; j <= 9; j++) await 넣음(p, '확인', `한#${j}`, '해당 없음')
  ok('→ «✓ 7가지 모두 확인» · 한중 «해당 없음 (한중 아님)»', (await 값은(p, '확인', '서요약')) === '✓ 7가지 모두 확인' && (await 값은(p, '확인', '한요약')) === '해당 없음 (한중 아님)')
  await 넣음(p, '확인', '승인일', 타설 + 1)
  ok('승인일이 타설일 뒤 → ⚠', (await 값은(p, '확인', '승인판')) === '⚠ 승인일이 타설일 뒤 — 타설 전에 승인받아야 합니다')
  await 넣음(p, '확인', '승인일', 타설 - 3)
  ok('3일 앞 → «✓ 타설 3일 전 승인» · 작성자 «시험건설(주) 박현장»', (await 값은(p, '확인', '승인판')) === '✓ 타설 3일 전 승인' && (await 값은(p, '확인', '작성자표시')) === '시험건설(주) 박현장')
  /* 마지막 한 칸은 종이에서 — 저절로 남고 · 새로고침해도 그대로 */
  await 쳐넣기(p, '판정', '타설부위', '2층 슬래브 · 보')
  ok('타설 부위 쳐 넣음', (await 값은(p, '판정', '타설부위')) === '2층 슬래브 · 보', await 값은(p, '판정', '타설부위'))
  await p.waitForTimeout(1000)
  await 종이(p)
  ok('새로고침 → 판정 · 주문 · 양생 · 확인 그대로(이 기기)', (await 값은(p, '판정', '판정')) === 서중말 && (await 값은(p, '배합', 'fcn')) === 30 && (await 값은(p, '타설양생', '운반판')) === '✓ 1.5시간 이내 (3.3)' &&
    (await 값은(p, '확인', '서요약')) === '✓ 7가지 모두 확인' && (await 값은(p, '판정', '타설부위')) === '2층 슬래브 · 보')
  /* 여기 쓴 공사명 → 다른 서식(비산먼지 발생사업 신고서)에 먼저 */
  await 쳐넣기(p, '판정', '공사명', '새시험 물류센터 신축공사')
  await p.waitForTimeout(300)
  await p.goto(BASE + '/forms/bisan-singo', { waitUntil: 'domcontentloaded' })
  await p.waitForFunction(() => window.__격자 && document.querySelectorAll('canvas.gx-page').length, null, { timeout: 25000 })
  await p.waitForTimeout(400)
  const 다른 = await p.evaluate(() => { const g = window.__격자; for (let si = 0; si < g.doc.sheets.length; si++) { const s = g.doc.sheets[si]; const a = Object.entries(s.keys).find(([, k]) => k === '공사명칭'); if (a) { const m = /^([A-Z]+)(\d+)$/.exec(a[0]); let c = 0; for (const ch of m[1]) c = c * 26 + ch.charCodeAt(0) - 64; return [g.책.값(si, +m[2], c)] } } return null })
  ok('여기 고친 공사명이 비산먼지 발생사업 신고서에 먼저 들어감', !!다른 && 다른[0] === '새시험 물류센터 신축공사', 다른)
  ok('오류 0(PC · 적기)', !오류.length, 오류)
  await ctx.close()
}

console.log('⑤ 경계 · 한중 깊이 (PC)')
{
  const { ctx, p, 오류 } = await 새쪽(1280, 900, false)
  await 종이(p)
  await p.evaluate(() => { localStorage.removeItem('kcm.격자'); localStorage.removeItem('kcm.서식공통') })
  await 종이(p)
  const 판 = () => 값은(p, '판정', '판정')
  const 예보 = async (a, l, h) => { await 넣음(p, '판정', '일평균', a); await 넣음(p, '판정', '최저', l); await 넣음(p, '판정', '최고', h); return 판() }
  await 넣음(p, '판정', '일평균', 10)
  ok('일평균만 10 ℃ → «⚠ 일평균 · 최저 · 최고기온 예보를 모두 적으세요»', (await 판()) === '⚠ 일평균 · 최저 · 최고기온 예보를 모두 적으세요', await 판())
  ok('4 ℃ 는 한중(이하) · 4.1 ℃ · 0.5 ℃ · 10 ℃ 는 일반', (await 예보(4, 2, 9)) === 한중말 && (await 예보(4.1, 0.5, 10)) === 일반말)
  ok('최저 0 ℃ 는 한중(이하)', (await 예보(6, 0, 12)) === 한중말)
  ok('일평균 25 ℃ · 최고 30 ℃ 는 일반(초과만 서중) · 30.5 ℃ 는 서중', (await 예보(25, 18, 30)) === 일반말 && (await 예보(25, 18, 30.5)) === 서중말)
  ok('일평균 26 ℃ · 최저 −1 ℃ → «⚠ 한중 · 서중 조건이 함께»', (await 예보(26, -1, 31)) === '⚠ 한중 · 서중 조건이 함께 나옵니다 — 예보 값을 다시 확인')
  await 예보(8, 3, 14); await 넣음(p, '판정', '동해', '있음')
  ok('초기동해 위험 «있음» → 한중', (await 값은(p, '판정', '판4')) === '❄ 초기동해 위험 — 한중' && (await 판()) === 한중말)
  /* Tn — 표 밖 · 승인 · 91일 · 적산온도 방식 */
  await 넣음(p, '배합', 'fck', 27); await 넣음(p, '배합', 'fcd', 30); await 넣음(p, '배합', '시멘트', CEM1); await 넣음(p, '배합', '재령', '28일'); await 넣음(p, '배합', '예상', -1)
  ok('fcd 30 > fck 27 → fcq 30 · 예상 −1 ℃ → Tn 빈칸 · «⚠ 0 ℃ 밑 — 표 범위 밖»', (await 값은(p, '배합', 'fcq')) === 30 && (await 값은(p, '배합', 'Tn자동')) === '' && (await 값은(p, '배합', 'fcn')) === '' &&
    ((await 값은(p, '배합', 'Tn근거')) || '').startsWith('⚠ 예상평균기온 0 ℃ 밑'), await 값은(p, '배합', 'Tn근거'))
  await 넣음(p, '배합', 'Tn직접', 6)
  ok('Tn 직접 6 → 호칭강도 36', (await 값은(p, '배합', 'Tn')) === 6 && (await 값은(p, '배합', 'fcn')) === 36)
  await 넣음(p, '배합', 'Tn직접', undefined); await 넣음(p, '배합', '예상', 2); await 넣음(p, '배합', '승인28', '아니오')
  ok('0 ~ 4 ℃ · 28일 · 승인 «아니오» → Tn 6 + «⚠ 28일 관리는 … 승인이 있을 때만»', (await 값은(p, '배합', 'Tn')) === 6 && (await 값은(p, '배합', 'Tn근거')) === 'KCS 14 20 40 표 2.2-1 (0 ℃ 이상 4 ℃ 미만 · 28일) — ⚠ 28일 관리는 보온 양생 계획 승인이 있을 때만(아니면 42 · 56 · 91일)', await 값은(p, '배합', 'Tn근거'))
  const 한표 = []
  for (const a of ['42일', '56일', '91일']) { await 넣음(p, '배합', '재령', a); 한표.push(await 값은(p, '배합', 'Tn자동')) }
  ok('한중 표 — 42일 6 · 56일 3 · 91일 0', JSON.stringify(한표) === JSON.stringify([6, 3, 0]), 한표)
  await 넣음(p, '배합', '예상', 10)
  ok('4 ℃ 이상 · 91일 → Tn 빈칸 · «⚠ … 91일이 없음»', (await 값은(p, '배합', 'Tn자동')) === '' && (await 값은(p, '배합', 'Tn근거')) === '⚠ KCS 14 20 10 표 2.2-1 에 91일이 없음 — 책임기술자와 정해 아래 칸에')
  await 넣음(p, '배합', '재령', '42일'); await 넣음(p, '배합', '방법', '적산온도 방식')
  ok('적산온도 방식 → 호칭강도 빈칸 · 주문 «적산온도 방식 — 기온보정강도를 더하지 않음 …»', (await 값은(p, '배합', 'fcn')) === '' && ((await 값은(p, '배합', '주문')) || '').startsWith('적산온도 방식 — 기온보정강도를 더하지 않음'))
  await 넣음(p, '배합', '방법', '기온보정강도(Tn)')
  /* 배합 확인 — 한중 */
  await 넣음(p, '배합', 'WB', 62); await 넣음(p, '배합', 'AE', '아니오'); await 넣음(p, '배합', 'FA', 20)
  ok('한중 W/B 62 · AE 아니오 · FA 20 → ⚠ 셋', (await 값은(p, '배합', 'WB판')) === '⚠ 60 % 넘음 — 한중은 원칙적으로 60 % 이하' && (await 값은(p, '배합', 'AE판')) === '⚠ 한중은 공기연행콘크리트가 원칙' &&
    (await 값은(p, '배합', 'FA판')) === '⚠ 15 % 넘음 — 한중 최대 15 %' && (await 값은(p, '배합', '배합요약')) === '⚠ 확인할 것 3곳 — 위 ⚠ 칸', await 값은(p, '배합', '배합요약'))
  await 넣음(p, '배합', 'FA', 10); await 넣음(p, '배합', 'BS', 25)
  ok('FA 10 + 슬래그 25 = 35 % → «⚠ 섞어 쓰면 합 30 % …» · 15 % 로 → ✓', (await 값은(p, '배합', 'BS판')) === '⚠ 섞어 쓰면 합 30 % · FA 15 % 이하')
  await 넣음(p, '배합', 'BS', 15)
  ok('→ «✓ 섞어 씀 30 % 이하 (FA 15 % 이하)»', (await 값은(p, '배합', 'BS판')) === '✓ 섞어 씀 30 % 이하 (FA 15 % 이하)')
  await 넣음(p, '배합', 'FA', 0); await 넣음(p, '배합', 'BS', 31)
  ok('슬래그만 31 % → «⚠ 30 % 넘음»', (await 값은(p, '배합', 'BS판')) === '⚠ 30 % 넘음 — 한중 최대 30 %')
  /* 타설 · 양생 — 한중 */
  await 넣음(p, '타설양생', '두께', 250); await 넣음(p, '타설양생', '타최저', 8); await 넣음(p, '타설양생', '타최고', 18)
  ok('두께 250 mm → 기준 10 ~ 20 ℃ · 8 ℃ «⚠ 기준 밖»', ((await 값은(p, '타설양생', '타기준')) || '').startsWith('10 ~ 20 ℃') && (await 값은(p, '타설양생', '타판정')) === '⚠ 기준 밖 — 최저 10 ℃ 이상 · 최고 20 ℃ 이하로 계획', await 값은(p, '타설양생', '타판정'))
  await 넣음(p, '타설양생', '두께', 600)
  ok('600 mm → 5 ~ 20 ℃ · 8 ℃ ✓', (await 값은(p, '타설양생', '타기준')) === '5 ~ 20 ℃ (KCS 14 20 40 3.3)' && (await 값은(p, '타설양생', '타판정')) === '✓ 계획 온도가 기준 안')
  await 넣음(p, '타설양생', '가혹', '예')
  ok('가혹한 기상 «예» → 최저 10 ℃ · 8 ℃ ⚠', (await 값은(p, '타설양생', '타판정')) === '⚠ 기준 밖 — 최저 10 ℃ 이상 · 최고 20 ℃ 이하로 계획')
  await 넣음(p, '타설양생', '가혹', '아니오'); await 넣음(p, '타설양생', '타최고', 22)
  ok('최고 22 ℃ → ⚠(20 ℃ 넘음)', ((await 값은(p, '타설양생', '타판정')) || '').startsWith('⚠ 기준 밖'))
  await 넣음(p, '타설양생', '노출', '계속 · 자주 물로 포화')
  const 소요 = []
  for (const d of [250, 500, 900]) { await 넣음(p, '타설양생', '두께', d); 소요.push(await 값은(p, '타설양생', '소요강도')) }
  ok('포화 — 300 이하 15 · 800 이하 12 · 넘으면 10 MPa', JSON.stringify(소요) === JSON.stringify([15, 12, 10]), 소요)
  await 넣음(p, '타설양생', '두께', undefined)
  ok('포화인데 두께가 없으면 «단면 두께를 적으세요»', (await 값은(p, '타설양생', '소요강도')) === '' && (await 값은(p, '타설양생', '소요근거')) === '단면 두께를 적으세요')
  await 넣음(p, '타설양생', '두께', 500); await 넣음(p, '타설양생', '양생온도', '5 ℃'); await 넣음(p, '타설양생', '시멘트2', '혼합시멘트 B종(고로 · 플라이 애시 2종)')
  ok('포화 · 5 ℃ · 혼합 B종 → 12일', (await 값은(p, '타설양생', '양생일수')) === 12)
  await 넣음(p, '타설양생', '노출', '보통의 노출 상태'); await 넣음(p, '타설양생', '시멘트2', '조강포틀랜드 · 보통포틀랜드+촉진제')
  ok('보통 노출 · 5 ℃ · 조강 → 3일 · 소요 5 MPa', (await 값은(p, '타설양생', '양생일수')) === 3 && (await 값은(p, '타설양생', '소요강도')) === 5)
  /* 온도 기록 */
  await 넣음(p, '판정', '타설일', 일련(2027, 1, 10))
  ok('타설일 1/10 → 날짜 1/11 부터', (await 값은(p, '온도기록', '날짜#1')) === 일련(2027, 1, 11) && (await 값은(p, '온도기록', '날짜#3')) === 일련(2027, 1, 13))
  await 넣음(p, '온도기록', '날짜#2', 일련(2027, 1, 15))
  ok('둘째 날짜를 고치면 그 뒤가 따라감(1/15 → 1/16)', (await 값은(p, '온도기록', '날짜#3')) === 일련(2027, 1, 16) && (await 값은(p, '온도기록', '재령#3')) === 6)
  await 넣음(p, '온도기록', '평균#1', 12); await 넣음(p, '온도기록', '평균#2', -12); await 넣음(p, '온도기록', '평균#4', 8)
  ok('−12 ℃ 는 기여 0 · 비운 날 건너뜀 → 22 · 22 · 40', (await 값은(p, '온도기록', '기여#2')) === 0 && (await 값은(p, '온도기록', 'M#2')) === 22 && (await 값은(p, '온도기록', 'M#3')) === '' && (await 값은(p, '온도기록', 'M#4')) === 40 && (await 값은(p, '온도기록', 'M끝')) === 40)
  await 넣음(p, '온도기록', '최저#1', 6); await 넣음(p, '온도기록', '최저#2', -0.5)
  ok('최저 −0.5 ℃ → «⚠ 0 ℃ 밑» · 요약 «⚠ 0 ℃ 밑인 날 1일 …»', (await 값은(p, '온도기록', '확인#2')) === '⚠ 0 ℃ 밑' && (await 값은(p, '온도기록', '온도요약')) === '⚠ 0 ℃ 밑인 날 1일 — 보온 보강 · 책임기술자 확인')
  await 넣음(p, '온도기록', '공강도#1', 4.9)
  ok('공시체 4.9 MPa(소요 5) → «밑» · 초기양생 «아직»', (await 값은(p, '온도기록', '공판#1')) === '소요 5 MPa 밑 — 보온 양생 이어서' && (await 값은(p, '온도기록', '종료')) === '아직 — 소요 강도가 나올 때까지 콘크리트 온도 5 ℃ 이상')
  await 예보(12, 6, 18); await 넣음(p, '판정', '동해', '없음')
  ok('일반이 되면 소요 강도가 없어 «③ 장의 소요 압축강도가 없음»', (await 판()) === 일반말 && (await 값은(p, '온도기록', '공판#1')) === '③ 장의 소요 압축강도가 없음')
  ok('오류 0(PC · 경계)', !오류.length, 오류)
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
console.log(`\n${bad ? '✗' : '✓'} 시험_한중서중화면 ${n - bad}/${n}`)
process.exit(bad ? 1 : 0)
