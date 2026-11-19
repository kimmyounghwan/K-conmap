/**
 * ⏳ G785 (2026-11-19) 공기연장 간접비 산정 화면 시험 — 구운 사이트를 띄운 뒤:
 *   node tools/시험_공기간접비화면.mjs [주소=http://127.0.0.1:4996]
 *   KC_NAEYEOK=<계약 내역서 .xlsx 경로> 를 주면 그 파일로도 «율 읽기»(실제 내역서는 저장소에 두지 않음)
 *   ① 처음(빈) — h1 · 탭 제목 · 국가 · 기간 안내 · 0원 · 방식(요율)은 지방만
 *   ② 🧪 예시 — 기간 46일 · 1.48개월 · 합계 38,122,661원(lib 손셈과 같음) · 산정서 미리보기(명세 넷) · 새로고침 그대로
 *   ③ 고치기 — 월 임금 · 직종 더하기 · 지우기 · 투입 개월 · 장비(보유 → 임대) · 승률 «직접 넣기»
 *   ④ 지방 → 요율 방식 — 예정가격 작성 {(연장 ÷ 전체) × 금액 + … × 낙찰률} ÷ 2 · 미작성 · 법정경비 줄
 *   ⑤ 📥 내역서(원가계산서) 율 읽기 — 만든 엑셀 · 못 읽는 파일
 *   ⑥ 📄 PDF — 그림 PDF(글자 층 없음 · 쪽 그림) · 파일 이름
 *   ⑦ 마이컨맵 «내 현장» 값이 먼저 · 공무 올인원 · 공기연장 때 할 일에서 이 도구로
 *   ⑧ 폰 390 · 360 · PC 1280 넘침 0 · 오류 0 · 서버로 보내는 요청 없음 · «무료 · 클로드» · 못 하는 일 글 없음
 *   🔒 (11-19) 소장님 「잠가」 — ①~⑧ 은 소장님 기기(kcm_op) 흉내 · ⑨ 손님: 🔒 문의 상자 · 입력 칸 0 · 🧪 예시 산정서(합계 38,122,661원)만 · PDF · 인쇄 단추 0 · 저장 0
 *      · ⑩ 소장님 기기 «👀 손님 화면으로 보기» → 손님 화면 → «↩ 원래대로»
 */
import { createRequire } from 'node:module'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import * as K from '../web/src/lib/공기간접비.js'
import { writeWorkbook } from '../web/src/lib/qtoxlsx.js'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const BASE = process.argv[2] || 'http://127.0.0.1:4996'
let bad = 0, n = 0
const ok = (이름, c, got) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (c || got === undefined ? '' : ' = ' + JSON.stringify(got).slice(0, 400))) }
const b = await chromium.launch({ env: { ...process.env, LANG: 'C.UTF-8' } })
const UA폰 = 'Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'
const 막을 = /googletagmanager|google-analytics|pagead2|adsbygoogle|googlesyndication|geojs|firebaseio|firebasedatabase|daumcdn|kakao|coupang/
async function 새쪽(w, h, 폰 = true, 미리 = null, 손님 = false) {   /* 🔒 잠근 뒤 ①~⑧ 은 소장님 기기(kcm_op) 흉내 · ⑨ 손님 */
  const ctx = await b.newContext({ viewport: { width: w, height: h }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', isMobile: 폰, hasTouch: 폰, acceptDownloads: true, ...(폰 ? { userAgent: UA폰 } : {}) })
  await ctx.route(막을, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await ctx.addInitScript(([m, 손님]) => { try { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); sessionStorage.setItem('kcm_notice_seen', '2026-10-업체'); sessionStorage.setItem('kcm_visit_s', '1'); if (!손님) localStorage.setItem('kcm_op', '1'); if (m && !sessionStorage.getItem('시험미리')) { for (const [k, v] of Object.entries(m)) localStorage.setItem(k, v); sessionStorage.setItem('시험미리', '1') } } catch (e) { /* 없음 */ } }, [미리, 손님])
  const p = await ctx.newPage()
  const 오류 = [], 보냄 = []
  p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
  p.on('request', (r) => { if (r.method() !== 'GET' && !막을.test(r.url())) 보냄.push(r.method() + ' ' + r.url().slice(0, 90)) })
  return { ctx, p, 오류, 보냄 }
}
const 넘침 = (p) => p.evaluate(() => document.documentElement.scrollWidth - innerWidth)
const 열기 = async (p, 길 = '/tools/gonggi-ganjeopbi') => { await p.goto(BASE + 길, { waitUntil: 'domcontentloaded' }); await p.waitForSelector(길 === '/tools/gonggi-ganjeopbi' ? '.ggj-res' : 'main', { timeout: 20000 }); await p.waitForTimeout(400) }
const 칸 = (p, 이름, 안 = '.ggj-form') => p.locator(`${안} label`, { hasText: 이름 }).locator('input, select').first()
const 단추 = (p, 글) => p.locator('button', { hasText: 글 }).first()
const 합계 = async (p) => (await p.locator('.ggj-amt b').innerText()).replace(/[^\d]/g, '')
const 기간 = (p) => p.locator('.ggj-period').innerText()
const 종이 = (p) => p.locator('.ggj-preview .ggj-paper').innerText()
const 줄수 = (p, i) => p.locator('.card').filter({ has: p.locator('.detail-h', { hasText: i }) }).locator('.ggj-row').count()
const 줄 = (p, 제목, k) => p.locator('.card').filter({ has: p.locator('.detail-h', { hasText: 제목 }) }).locator('.ggj-row').nth(k)

/* 원가계산서 엑셀(지어낸 값 · 실제 내역서 꼴 — 요율 칸 · 산출근거 «B × 0.0101» · «(A + B) × 0.0553») */
const 엑셀 = path.join(os.tmpdir(), '시험_공기간접비_원가.xlsx')
fs.writeFileSync(엑셀, writeWorkbook([{ name: '원가계산서', head: ['구분', '비목', '금액', '요율', '산출근거'], rows: [
  ['1', '직 접 재 료 비', 434734135, '', ''], ['2', '간 접 재 료 비', 49568408, '', ''], ['A', '소 계', 484302543, '', '(1 + 2)'],
  ['4', '직 접 노 무 비', 1587326653, '', ''], ['5', '간 접 노 무 비', 231749691, 0.146, '4 × 0.146'], ['B', '소 계', 1819076344, '', '(4 + 5)'],
  ['6', '산 출 경 비', 442165863, '', ''], ['7', '산 재 보 험 료', 64759117, 0.0356, 'B × 0.0356'], ['8', '고 용 보 험 료', 18372671, '', 'B × 0.0101'],
  ['9', '건 강 보 험 료', 56270729, 0.03545, '4 × 0.03545'], ['18', '기 타 경 비', 127347604, '', '(A + B) × 0.0553'], ['C', '소 계', 708915984, '', '(6:18)'],
  ['D', '순 공 사 원 가', 3012294871, '', '(A + B + C)'], ['E', '일 반 관 리 비', 165676217, 0.055, 'D × 0.055'], ['F', '이 윤', 311144412, '', '(B + C + E) × 0.1135'],
  ['G', '총 원 가', 3489115500, '', '(D + E + F)'], ['H', '부 가 가 치 세', 348911550, 0.1, 'G × 0.1'], ['I', '도 급 액', 3838027050, '', '(G + H)'],
] }]))
const 엉뚱 = path.join(os.tmpdir(), '시험_공기간접비_엉뚱.xlsx')
fs.writeFileSync(엉뚱, '엑셀이 아닌 글')

for (const [기기, w, h, 폰] of [['폰', 390, 844, true], ['PC', 1280, 900, false]]) {
  console.log(`① ${기기} ${w} — 처음`)
  const { ctx, p, 오류, 보냄 } = await 새쪽(w, h, 폰)
  await 열기(p)
  ok(`${기기} h1 · 탭 제목`, /공기연장 간접비 산정 — 늘어난 기간의 실비를 산정서 한 벌로/.test(await p.locator('h1').first().innerText()) && /^공기연장 간접비 산정 — 늘어난 기간의 실비 \| K-건설맵$/.test(await p.title()), await p.title())
  ok(`${기기} 처음 — 국가 · 기간 안내 · 0원 · 요율 방식 칩 없음`, (await p.locator('.ggj-chips .fm-chip.on').first().innerText()) === '국가 · 공공기관' && /준공일을 넣으면/.test(await 기간(p)) && (await 합계(p)) === '0' && (await p.locator('button', { hasText: '요율 방식' }).count()) === 0)

  console.log(`② ${기기} 예시`)
  await 단추(p, '예시로 해 보기').click(); await p.waitForTimeout(300)
  const 예 = K.실비셈(K.예시())
  ok(`${기기} 예시 — 기간 «2026. 12. 1. ~ 2027. 1. 15. · 46일 · 1.48개월»`, /2026\. 12\. 1\. ~ 2027\. 1\. 15\.\s*·\s*46일\s*·\s*달력으로\s*1\.48개월/.test(await 기간(p)), await 기간(p))
  ok(`${기기} 예시 합계 ${예.합계.toLocaleString()}원(lib 셈과 같음)`, (await 합계(p)) === String(예.합계) && 예.합계 === 38122661, await 합계(p))
  const 글 = await 종이(p)
  ok(`${기기} 산정서 미리보기 — 제목 · 총괄 · 명세 넷 · 근거 · 서명 줄`, /공기연장 간접비 산정서/.test(글) && /1\. 총괄/.test(글) && /2\. 간접노무비 명세/.test(글) && /3\. 경비 명세/.test(글) && /4\. 장비 유휴비/.test(글) && /5\. 승률 비목/.test(글) && /정부 입찰ㆍ계약 집행기준 제72조 · 제73조/.test(글) && /대표자 김○○/.test(글) && /38,122,661/.test(글) && /719,293/.test(글), 글.slice(0, 300))
  ok(`${기기} 결과 줄 — 간접노무비 20,800,000 · 일반관리비 · 이윤`, /20,800,000/.test(await p.locator('.ggj-lines').innerText()) && /일반관리비 \(6%\)/.test(await p.locator('.ggj-lines').innerText()))
  await 열기(p)
  ok(`${기기} 새로고침 → 그대로(이 기기에 저장)`, (await 합계(p)) === String(예.합계) && (await 칸(p, '공사명').inputValue()) === '○○천 수해복구 정비공사')

  console.log(`③ ${기기} 고치기`)
  const 첫 = 줄(p, '간접노무비', 0)
  await 첫.locator('label', { hasText: '월 임금' }).locator('input').fill('6,000,000'); await p.waitForTimeout(150)
  const 예2 = K.실비셈({ ...K.예시(), 사람: K.예시().사람.map((r, i) => (i === 0 ? { ...r, 월임금: '6000000' } : r)) })
  ok(`${기기} 현장대리인 월 임금 600만 → 합계 다시 셈(${예2.합계.toLocaleString()})`, (await 합계(p)) === String(예2.합계), await 합계(p))
  await 단추(p, '＋ 직종 더하기').click(); await p.waitForTimeout(150)
  ok(`${기기} ＋ 직종 → 다섯 줄`, (await 줄수(p, '간접노무비')) === 5)
  const 다섯 = 줄(p, '간접노무비', 4)
  await 다섯.locator('label', { hasText: '직종' }).locator('input').fill('자재'); await 다섯.locator('label', { hasText: '월 임금' }).locator('input').fill('3,000,000'); await 다섯.locator('label', { hasText: '투입 개월' }).locator('input').fill('0.5'); await p.waitForTimeout(150)
  ok(`${기기} 투입 개월 0.5 → 1,500,000원`, /1,500,000/.test(await 다섯.locator('.ggj-sum').innerText()), await 다섯.locator('.ggj-sum').innerText())
  await 다섯.locator('button[aria-label$="지우기"]').click(); await p.waitForTimeout(150)
  ok(`${기기} ✕ → 네 줄 · 합계 되돌아옴`, (await 줄수(p, '간접노무비')) === 4 && (await 합계(p)) === String(예2.합계))
  const 장비1 = 줄(p, '경비', 0)
  ok(`${기기} 경비 줄 넷 · 장비 둘(보유 · 임대)`, (await p.locator('.card').filter({ has: p.locator('.detail-h', { hasText: '③ 경비' }) }).locator('.ggj-eq .ggj-row').count()) === 2 && !!장비1)
  const 보유 = p.locator('.ggj-eq .ggj-row').nth(0)
  ok(`${기기} 보유 장비 식 «(150,000,000 × 0.0001786) × (1,960 ÷ 365) × 10일 × 1/2» · 719,293원 · 계수 풀이 = 0.0001786`, /\(150,000,000 × 0\.0001786\) × \(1,960 ÷ 365\) × 10일 × 1\/2/.test(await 보유.innerText()) && /719,293/.test(await 보유.innerText()) && /= 0\.0001786/.test(await 보유.innerText()), await 보유.innerText())
  await 보유.locator('button', { hasText: '임대장비' }).click(); await 보유.locator('label', { hasText: '실제 부담한 임대료' }).locator('input').fill('500,000'); await p.waitForTimeout(150)
  ok(`${기기} 보유 → 임대(실제 임대료 500,000)`, /500,000/.test(await 보유.locator('.ggj-sum').innerText()))
  const 승 = 줄(p, '산출내역서의 율', 0)
  await 승.locator('select').selectOption('직접'); await p.waitForTimeout(100)
  await 승.locator('label', { hasText: '기준 금액(원)' }).locator('input').fill('10,000,000'); await p.waitForTimeout(150)
  ok(`${기기} 승률 «직접 넣기» 1,000만 × 3.56% = 356,000`, /356,000/.test(await 승.locator('.ggj-sum').innerText()), await 승.locator('.ggj-sum').innerText())
  await 칸(p, '일반관리비율').fill('9'); await p.waitForTimeout(150)
  ok(`${기기} 일반관리비율 9% → 시행규칙 제8조 알림`, /제8조①\(공사 8%\)/.test(await p.locator('.ggj-al').innerText().catch(() => '')))
  await 칸(p, '일반관리비율').fill('6'); await p.waitForTimeout(100)

  console.log(`④ ${기기} 지방 · 요율 방식`)
  await 단추(p, '예시로 해 보기').click(); await p.waitForTimeout(200)
  await p.locator('.ggj-chips .fm-chip', { hasText: '지방자치단체' }).click(); await p.waitForTimeout(150)
  ok(`${기기} 지방 → 방식 칩 · 근거 «지방자치단체 입찰 및 계약집행기준 제1장 제8절» · 간접노무비 풀이(직종 단가)`, (await p.locator('button', { hasText: '요율 방식(지방 · 협의)' }).count()) === 1 && /제1장 제8절/.test(await p.locator('.ggj-badges').innerText()) && /시행규칙 제7조 해당 직종 단가/.test(await p.locator('.card').filter({ has: p.locator('.detail-h', { hasText: '② 간접노무비' }) }).innerText()))
  await 단추(p, '요율 방식(지방 · 협의)').click(); await p.waitForTimeout(200)
  ok(`${기기} 요율 → 간접노무비 · 경비 줄 카드 숨김 · 요율 카드`, (await p.locator('.detail-h', { hasText: '② 요율 방식' }).count()) === 1 && (await p.locator('.detail-h', { hasText: '② 간접노무비' }).count()) === 0 && /274 \(착공일 ~ 당초 준공일\)/.test(await 칸(p, '전체 계약기간').getAttribute('placeholder')))
  await 칸(p, '예정가격 상 간접노무비').fill('120,000,000'); await 칸(p, '예정가격 상 경비').fill('80,000,000'); await 칸(p, '낙찰률').fill('87.745')
  await 단추(p, '＋ 실비 줄').click(); await p.waitForTimeout(150)
  const 법 = 줄(p, '② 요율 방식', 0)
  await 법.locator('label', { hasText: '비목 · 내용' }).locator('input').fill('공사이행보증서 기간 연장 수수료'); await 법.locator('label', { hasText: '금액(원)' }).locator('input').fill('412,000'); await p.waitForTimeout(200)
  const y = { ...K.예시(), 갈래: '지방', 방식: '요율', 요율: { 예정: true, 전체: '', 낙찰률: '87.745', 예간노: '120000000', 예경비: '80000000', 산간노: '', 산경비: '', 법정: [K.빈법정({ 이름: 'x', 금액: '412000' })] } }
  const Y = K.요율셈(y)
  ok(`${기기} 요율(예정가격 작성) 합계 ${Y.합계.toLocaleString()}원 = lib`, (await 합계(p)) === String(Y.합계), [await 합계(p), Y.합계])
  ok(`${기기} 산정서 — «2. 요율 산정» · 중괄호 식 · 2.자 근거`, /2\. 요율 산정/.test(await 종이(p)) && /\{\(46 ÷ 274\) × 120,000,000 \+ \(46 ÷ 274\) × 120,000,000 × 87\.745%\} ÷ 2/.test(await 종이(p)) && /요율 방식 적용\(2\.자\)/.test(await 종이(p)), (await 종이(p)).slice(0, 400))
  await p.locator('.fm-chip', { hasText: '예정가격을 작성하지 않은 공사' }).click(); await 칸(p, '산출내역서 상 간접노무비').fill('90,000,000'); await 칸(p, '산출내역서 상 경비').fill('60,000,000'); await 칸(p, '전체 계약기간').fill('300'); await p.waitForTimeout(200)
  const Y2 = K.요율셈({ ...y, 요율: { ...y.요율, 예정: false, 전체: '300', 산간노: '90000000', 산경비: '60000000' } })
  ok(`${기기} 미작성 · 전체 300일 → ${Y2.합계.toLocaleString()}원 = lib`, (await 합계(p)) === String(Y2.합계), [await 합계(p), Y2.합계])
  await p.locator('.ggj-chips .fm-chip', { hasText: '국가 · 공공기관' }).click(); await p.waitForTimeout(150)
  ok(`${기기} 국가로 돌리면 실비 산정으로(요율 칩 없음)`, (await p.locator('.detail-h', { hasText: '② 간접노무비' }).count()) === 1 && (await p.locator('button', { hasText: '요율 방식' }).count()) === 0)

  console.log(`⑤ ${기기} 내역서 율 읽기`)
  await p.locator('label.ggj-file', { hasText: '계약 내역서' }).locator('input[type=file]').setInputFiles(엑셀); await p.waitForTimeout(1500)
  const 승률들 = await p.evaluate(() => [...document.querySelectorAll('.ggj-res')].length && [...document.querySelectorAll('.card')].filter((c) => /산출내역서의 율/.test(c.querySelector('.detail-h')?.textContent || '')).flatMap((c) => [...c.querySelectorAll('.ggj-row')].map((r) => [r.querySelector('label input').value, r.querySelectorAll('label input')[1].value])))
  ok(`${기기} 만든 원가계산서 → 산재 3.56 · 고용 1.01(산출근거 글) · 기타경비 5.53 · 일반관리비 5.5 · 이윤 11.35`, JSON.stringify(승률들) === JSON.stringify([['산재보험료', '3.56'], ['고용보험료', '1.01'], ['기타경비', '5.53']]) && (await 칸(p, '일반관리비율').inputValue()) === '5.5' && (await 칸(p, '이윤율').inputValue()) === '11.35', 승률들)
  ok(`${기기} 읽은 말 «원가계산서 에서 읽었습니다 — …»`, /«원가계산서» 에서 읽었습니다 — 산재보험료 3\.56% · 고용보험료 1\.01% · 기타경비 5\.53% · 일반관리비 5\.5% · 이윤 11\.35%/.test(await p.locator('.card .note[role=status]').first().innerText()))
  await p.locator('label.ggj-file', { hasText: '계약 내역서' }).locator('input[type=file]').setInputFiles(엉뚱); await p.waitForTimeout(800)
  ok(`${기기} 엑셀이 아닌 파일 → «읽지 못했습니다»`, /읽지 못했습니다|찾지 못했습니다/.test(await p.locator('.card .note[role=status]').first().innerText()))
  if (process.env.KC_NAEYEOK && fs.existsSync(process.env.KC_NAEYEOK)) {
    await p.locator('label.ggj-file', { hasText: '계약 내역서' }).locator('input[type=file]').setInputFiles(process.env.KC_NAEYEOK); await p.waitForTimeout(2500)
    ok(`${기기} 실제 계약 내역서(KC_NAEYEOK) → 율을 읽음`, /에서 읽었습니다 — /.test(await p.locator('.card .note[role=status]').first().innerText()), await p.locator('.card .note[role=status]').first().innerText())
  }

  console.log(`⑥ ${기기} 📄 PDF`)
  await 단추(p, '예시로 해 보기').click(); await p.waitForTimeout(300)
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 60000 }).catch(() => null), 단추(p, '산정서 PDF 저장').click()])
  let 바 = Buffer.alloc(0)
  if (dl) { const st = await dl.createReadStream(); const 조 = []; for await (const c of st) 조.push(c); 바 = Buffer.concat(조) }
  const 글자 = 바.toString('latin1')
  const 쪽 = (글자.match(/\/Type \/Page\b(?!s)/g) || []).length
  ok(`${기기} 그림 PDF — %PDF · 쪽 ${쪽} · 그림만(글꼴 없음) · 파일 이름`, !!dl && 글자.startsWith('%PDF') && 쪽 >= 1 && 쪽 <= 3 && /\/Subtype \/Image/.test(글자) && !/\/Font/.test(글자) && /^공기연장_간접비_산정서_○○천 수해복구 정비공사\.pdf$/.test(dl.suggestedFilename()), dl && [dl.suggestedFilename(), 쪽, 바.length])

  console.log(`⑦ ${기기} 글 · 넘침`)
  const 화면글 = await p.evaluate(() => document.querySelector('.ggj').innerText)
  ok(`${기기} 새 글에 «무료 · 클로드 · 유료 · 이용권» 없음`, !/무료|클로드|유료|이용권/.test(화면글))
  ok(`${기기} 못 하는 일 · 하지 않는 일 글 없음`, !/못 ?합니다|하지 않습니다|할 수 없|전문 업체|기술사/.test(화면글))
  ok(`${기기} 설명(자세한 설명 · 쓰는 순서 넷 · 묻고 답)`, /공기연장 간접비 산정 — 자세한 설명/.test(화면글) && ['① 기간', '② 간접노무비', '③ 경비 · 장비', '④ 율 · 산정서'].every((t) => 화면글.includes(t)) && /언제까지 청구하나요/.test(화면글))
  ok(`${기기} ${w} 넘침 0`, (await 넘침(p)) <= 1, await 넘침(p))
  if (폰) { await p.setViewportSize({ width: 360, height: 760 }); await p.waitForTimeout(300); ok(`${기기} 360 넘침 0`, (await 넘침(p)) <= 1, await 넘침(p)) }
  ok(`${기기} 오류 0`, !오류.length, 오류)
  ok(`${기기} 서버로 보내는 요청 없음`, !보냄.length, 보냄)
  await ctx.close()

  console.log(`⑧ ${기기} 내 현장 · 공무 올인원 · 공기연장 때 할 일`)
  const 현 = { id: 'h1abcdef', 현장: '시험 하천 정비공사', 발주: '가나시', 갈래: '지자체', 계약금액: 1250000000, 착공: '2026-03-02', 준공: '2026-11-30', 했음: [], at: 1 }
  /* 🔒 G784b 뒤 공무 올인원은 손님에게 고리가 없음(예시만) → 소장님 기기(kcm_op) 흉내로 엶 */
  const 둘 = await 새쪽(w, h, 폰, { 'kcm.my.현장': JSON.stringify({ v: 1, 지금: 현.id, 목록: [현] }), kcm_op: '1' })
  await 열기(둘.p)
  ok(`${기기} 처음 열면 내 현장 값(공사명 · 발주 · 금액 · 착공 · 당초 준공 · 지방)`, (await 칸(둘.p, '공사명').inputValue()) === 현.현장 && (await 칸(둘.p, '발주기관').inputValue()) === '가나시' && (await 칸(둘.p, '계약금액').inputValue()) === '1,250,000,000' && (await 칸(둘.p, '당초 준공일').inputValue()) === '2026-11-30' && (await 둘.p.locator('.ggj-chips .fm-chip.on').first().innerText()) === '지방자치단체' && /내 현장/.test(await 둘.p.locator('.note[role=status]').first().innerText()))
  await 열기(둘.p, '/tools/gongmu'); await 둘.p.waitForSelector('.gmu-steps', { timeout: 20000 })
  await 둘.p.locator('.gmu-item', { has: 둘.p.locator('.gmu-tx b', { hasText: '공기연장 간접비 산정' }) }).locator('a.gmu-go').click()
  await 둘.p.waitForURL(/\/tools\/gonggi-ganjeopbi$/, { timeout: 15000 }); await 둘.p.waitForSelector('.ggj-res', { timeout: 20000 })
  ok(`${기기} 공무 올인원 «공기연장 간접비 산정» → 이 도구`, true)
  await 열기(둘.p, '/tools/time-extension'); await 둘.p.waitForSelector('.tool.te', { timeout: 20000 })
  await 둘.p.locator('button', { hasText: '예시로 해 보기' }).first().click(); await 둘.p.waitForTimeout(400)
  ok(`${기기} 공기연장 때 할 일 → «공기연장 간접비 산정(실비 셈 · PDF) →» 링크 · 서식 링크 그대로`, (await 둘.p.locator('.tool.te a[href="/tools/gonggi-ganjeopbi"]').count()) === 1 && (await 둘.p.locator('.tool.te a[href="/forms/chg-ganjeopbi"]').count()) === 1)
  ok(`${기기} ⑧ 오류 0`, !둘.오류.length, 둘.오류)
  await 둘.ctx.close()
}
for (const [기기, w, h, 폰] of [['폰', 390, 844, true], ['PC', 1280, 900, false]]) {
  console.log(`⑨ ${기기} 손님 — 🔒 잠금 · 🧪 예시 산정서만`)
  const 손 = await 새쪽(w, h, 폰, null, true)
  await 손.p.goto(BASE + '/tools/gonggi-ganjeopbi', { waitUntil: 'domcontentloaded' }); await 손.p.waitForSelector('.sg-lock', { timeout: 20000 }); await 손.p.waitForTimeout(800)
  const 처음 = await 손.p.evaluate(() => {
    const 글 = (q) => [...document.querySelectorAll(q)].filter((e) => e.offsetParent !== null).map((e) => e.innerText.replace(/\s+/g, ' ').trim())
    const 문의 = [...document.querySelectorAll('main a[href^="/contact?k=cn"]')].map((a) => decodeURIComponent(a.getAttribute('href')))
    return { 잠금: (document.querySelector('.sg-lock') || {}).innerText || '', 문의, 입력: document.querySelectorAll('.ggj input:not([type=password]), .ggj select').length, 결과: !!document.querySelector('.ggj-res'),
      단추: 글('main button'), 열쇠: !!document.querySelector('.sg-lock details summary'), 띠: !!document.querySelector('.kcm-열림띠') }
  })
  ok(`${기기} 🔒 문의 상자 «공기연장 간접비 산정서는 K-건설맵이 직접 작성해 드립니다» · 문의 단추(t=공기연장 간접비 산정) · 🔑 열쇠말 · 열림띠 없음`,
    /🔒 문의해 주세요/.test(처음.잠금) && /공기연장 간접비 산정서는 K-건설맵이 직접 작성해 드립니다/.test(처음.잠금) && 처음.문의.some((h) => /t=공기연장 간접비 산정/.test(h)) && 처음.열쇠 && !처음.띠, 처음)
  ok(`${기기} 손님 — 입력 칸 0 · 결과 칸 없음(예시 전) · «예시로 해 보기 · 새로 · PDF · 인쇄» 단추 없음`, 처음.입력 === 0 && !처음.결과 && !처음.단추.some((t) => /예시로 해 보기|새로|PDF|인쇄|내 현장/.test(t)), 처음)
  await 손.p.locator('button', { hasText: '예시 산정서 보기' }).first().click(); await 손.p.waitForSelector('.ggj-res', { timeout: 15000 }); await 손.p.waitForTimeout(600)
  const 예 = await 손.p.evaluate(() => ({ 합: ((document.querySelector('.ggj-amt b') || {}).innerText || '').replace(/[^\d]/g, ''), 종이: !!document.querySelector('.ggj-preview .ggj-paper') && /공기연장 간접비 산정서/.test(document.querySelector('.ggj-preview .ggj-paper').innerText),
    끝: [...document.querySelectorAll('.kcm-예시끝')].filter((e) => e.offsetParent !== null).map((e) => e.innerText.replace(/\s+/g, ' ')), 입력: document.querySelectorAll('.ggj input:not([type=password]), .ggj select').length,
    받기: [...document.querySelectorAll('main button, main a.btn')].filter((e) => e.offsetParent !== null && !/^\/contact/.test(e.getAttribute('href') || '')).map((e) => e.innerText.replace(/\s+/g, ' ').trim()).filter((t) => /PDF|인쇄|받기|📥/.test(t)),
    저장: localStorage.getItem('kcm.공기간접비') }))
  ok(`${기기} 🧪 예시 산정서 — 합계 38,122,661원 · 산정서 종이 · «🔒 예시는 보기만» 알림`, 예.합 === '38122661' && 예.종이 && 예.끝.length === 1 && /예시는 보기만/.test(예.끝[0]), 예)
  ok(`${기기} 예시 뒤에도 입력 칸 0 · PDF · 인쇄 · 받기 단추 0 · 이 기기에 저장 안 함`, 예.입력 === 0 && 예.받기.length === 0 && 예.저장 === null, 예)
  ok(`${기기} 손님 넘침 0 · 오류 0 · 서버로 보내는 요청 없음`, (await 넘침(손.p)) <= 1 && !손.오류.length && !손.보냄.length, [await 넘침(손.p), 손.오류, 손.보냄])
  await 손.ctx.close()
}
{
  console.log('⑩ 소장님 기기 — 👀 손님 화면으로 보기 · ↩ 원래대로')
  const 소 = await 새쪽(390, 844, true)
  await 소.p.goto(BASE + '/tools/gonggi-ganjeopbi', { waitUntil: 'domcontentloaded' }); await 소.p.waitForSelector('.kcm-열림띠', { timeout: 20000 }); await 소.p.waitForTimeout(500)
  const 열 = await 소.p.evaluate(() => ({ 띠: document.querySelector('.kcm-열림띠').innerText, 잠금: !!document.querySelector('.sg-lock'), 입력: document.querySelectorAll('.ggj input').length }))
  ok('소장님 기기 — 🔑 열림띠 · 잠금 상자 없음 · 입력 칸 있음', /이 기기는 열려 있습니다/.test(열.띠) && !열.잠금 && 열.입력 > 5, 열)
  await 소.p.click('.kcm-열림띠 button'); await 소.p.waitForSelector('.sg-lock', { timeout: 20000 }); await 소.p.waitForTimeout(500)
  const 손 = await 소.p.evaluate(() => ({ 띠: (document.querySelector('.kcm-열림띠') || {}).innerText || '', 입력: document.querySelectorAll('.ggj input:not([type=password])').length, 표: sessionStorage.getItem('kcm.손님보기') }))
  ok('👀 손님 화면 — 잠금 상자 · 입력 칸 0 · «보는 중»', /보는 중/.test(손.띠) && 손.입력 === 0 && 손.표 === '1', 손)
  await 소.p.click('.kcm-열림띠 button'); await 소.p.waitForFunction(() => !document.querySelector('.sg-lock'), null, { timeout: 20000 }); await 소.p.waitForTimeout(500)
  ok('↩ 원래대로 — 다시 열림(입력 칸)', (await 소.p.locator('.ggj input').count()) > 5 && !소.오류.length, 소.오류)
  await 소.ctx.close()
}
await b.close()
console.log(`\n${bad ? '✗' : '✓'} 시험_공기간접비화면 ${n - bad}/${n}`)
process.exit(bad ? 1 : 0)
