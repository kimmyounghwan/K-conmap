/**
 * 🏗 G539 (2026-11-05) 마이컨맵 «내 현장 · 내 일» 화면 시험 — 구운 사이트를 띄운 뒤:
 *   node tools/시험_내현장화면.mjs [주소=http://127.0.0.1:4996]
 *   소장님 「마이컨맵을 새로게 리모델링」 · 「자료를 줄때, 다시 방문하게 해야 해」 · 「페이지 전체를 리모델링 해주고, 설명글도 자세히」
 *   ① 맨 위 «내 현장 · 내 일»(단축키 · 작업대 · 내 페이지 · 명함 · 쓰는 법은 그대로 아래) · 처음엔 «＋ 내 현장 적기» · 지난번 서식 공통 칸으로 미리 채움
 *   ② 적기 — 빈 공사명 · 날짜 없음 · 준공 < 착공 알림 → 저장 → 현장 카드(발주 · 금액 억 · 공기 막대) · «서식 N칸»
 *   ③ 오늘 할 일 5 — D 글이 lib 셈과 같음 · «서식 →» 누르면 공사안전보건대장이 이 현장 값(공사명 · 착공일)으로 열림
 *   ④ ✓ 했음 → 맨 위에서 빠짐 · 새로고침 그대로 · 전체 보기(늘 지킬 것 «늘») · 📲 폰 달력(.ics · 이어 보기)
 *   ⑤ 둘째 현장 → 고르기 칩 · 바꾸면 서식 공통 칸도 · 고치기(했음 그대로) · 지우기 두 번 눌러
 *   ⑥ 쓰는 법 새 칸 다섯 · «무료» 새 글에 없음 · 폰 390 · PC 1280 넘침 0 · 오류 0
 * 인터넷 안 부름(파이어베이스 · 광고 · 애널리틱스 막음) · 받은 파일은 메모리에서만 봄.
 */
import { createRequire } from 'node:module'
import * as H from '../web/src/lib/내현장.js'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const BASE = process.argv[2] || 'http://127.0.0.1:4996'
let bad = 0, n = 0
const ok = (이름, c, got) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (c || got === undefined ? '' : ' = ' + JSON.stringify(got).slice(0, 300))) }
const b = await chromium.launch({ env: { ...process.env, LANG: 'C.UTF-8' } })
const UA폰 = 'Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'
async function 새쪽(w, h, 폰 = true, 공통 = null) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', isMobile: 폰, hasTouch: 폰, acceptDownloads: true, ...(폰 ? { userAgent: UA폰 } : {}) })
  await ctx.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|googlesyndication|geojs|firebaseio|firebasedatabase/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await ctx.addInitScript((c) => { try { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); sessionStorage.setItem('kcm_notice_seen', '2026-10-업체'); sessionStorage.setItem('kcm_visit_s', '1'); if (c && !sessionStorage.getItem('시험공통')) { localStorage.setItem('kcm.서식공통', JSON.stringify(c)); sessionStorage.setItem('시험공통', '1') } } catch (e) { /* 없음 */ } }, 공통)
  const p = await ctx.newPage()
  const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
  return { ctx, p, 오류 }
}
const 넘침 = (p) => p.evaluate(() => document.documentElement.scrollWidth - innerWidth)
const 열기 = async (p) => { await p.goto(BASE + '/my', { waitUntil: 'domcontentloaded' }); await p.waitForSelector('.mc-site', { timeout: 20000 }); await p.waitForTimeout(400) }
const 칸 = (p, 이름) => p.locator('.mc-sited label.mc-f', { hasText: 이름 }).locator('input, select').first()
const 말 = (p) => p.locator('.mc-site .claudesay').last().innerText().catch(() => '')
const 일들 = (p) => p.evaluate(() => [...document.querySelectorAll('.mc-site .mc-todo')].map((li) => [li.querySelector('.mc-d').textContent, li.querySelector('.mc-todo-b b').textContent]))
const 오늘 = H.오늘날()
const 가 = { 현장: '시험 복합청사 신축공사', 발주: '가나시', 갈래: '지자체', 계약금액: 6850000000, 착공: H.달더하기(오늘, 1), 준공: H.달더하기(오늘, 12), 낙찰일: H.달더하기(오늘, 0), 유해: true, 안전: true }

for (const [기기, w, h, 폰] of [['폰', 390, 844, true], ['PC', 1280, 900, false]]) {
  console.log(`① ${기기} ${w} — 맨 위 · 처음`)
  const { ctx, p, 오류 } = await 새쪽(w, h, 폰, { 현장: '지난번 하천 정비공사', 회사: '시험건설(주)', 대리인: '박현장' })
  await 열기(p)
  const 차례 = await p.evaluate(() => [...document.querySelectorAll('.mc-wrap > *')].map((x) => x.className.split(' ')[0]))
  ok(`${기기} 차례 — 머리 · 내 현장 · 단축키 · 작업대 · 내 페이지 · …`, 차례[0] === 'mc-top' && 차례[1] === 'mc-site' && 차례[2] === 'mc-keys' && 차례[3] === 'mc-desk' && 차례.indexOf('mc-hero') > 3, 차례)
  ok(`${기기} h1 «마이컨맵 내 현장 · 내 일 · 내 명함» · 탭 제목`, /마이컨맵\s*내 현장 · 내 일 · 내 명함/.test(await p.locator('h1').first().innerText()) && /내 현장 · 내 일/.test(await p.title()), await p.title())
  ok(`${기기} 현장 없으면 «＋ 내 현장 적기» · 지난번 공사명 안내`, (await p.locator('button', { hasText: '＋ 내 현장 적기' }).count()) === 1 && /지난번 하천 정비공사/.test(await p.locator('.mc-site-0').innerText()))
  await p.locator('button', { hasText: '＋ 내 현장 적기' }).click(); await p.waitForTimeout(200)
  ok(`${기기} 적기 — 지난번 공통 칸으로 미리(공사명 · 회사 · 대리인)`, (await 칸(p, '공사명').inputValue()) === '지난번 하천 정비공사' && (await 칸(p, '우리 회사').inputValue()) === '시험건설(주)' && (await 칸(p, '현장대리인').inputValue()) === '박현장')
  console.log(`② ${기기} 적기 · 알림 · 저장`)
  await 칸(p, '공사명').fill('')
  await p.locator('button', { hasText: '＋ 이 현장 저장' }).click(); await p.waitForTimeout(150)
  ok(`${기기} 빈 공사명 → «공사명을 적어 주세요»`, /공사명을 적어 주세요/.test(await p.locator('.mc-sited .claudesay').innerText()))
  await 칸(p, '공사명').fill(가.현장)
  await p.locator('button', { hasText: '＋ 이 현장 저장' }).click(); await p.waitForTimeout(150)
  ok(`${기기} 날짜 없음 → «착공일 · 준공일을 넣어 주세요»`, /착공일 · 준공일을 넣어 주세요/.test(await p.locator('.mc-sited .claudesay').innerText()))
  await 칸(p, '착공일').fill(가.준공); await 칸(p, '준공일').fill(가.착공)
  await p.locator('button', { hasText: '＋ 이 현장 저장' }).click(); await p.waitForTimeout(150)
  ok(`${기기} 준공 < 착공 → «준공일이 착공일보다 앞섭니다»`, /준공일이 착공일보다 앞섭니다/.test(await p.locator('.mc-sited .claudesay').innerText()))
  await 칸(p, '발주기관').fill(가.발주); await 칸(p, '발주 갈래').selectOption(가.갈래); await 칸(p, '도급금액').fill('6,850,000,000')
  await 칸(p, '착공일').fill(가.착공); await 칸(p, '준공일').fill(가.준공)
  await p.locator('.mc-more summary').click(); await 칸(p, '낙찰 통지일').fill(가.낙찰일)
  await p.locator('.mc-site-ck label', { hasText: '유해위험방지계획서 대상' }).locator('input').check()
  await p.locator('.mc-site-ck label', { hasText: '안전관리계획서 대상' }).locator('input').check()
  await p.locator('button', { hasText: '＋ 이 현장 저장' }).click(); await p.waitForTimeout(400)
  ok(`${기기} 저장 → 현장 카드 · «서식 N칸에 … 먼저»`, (await p.locator('.mc-site-n').innerText()).includes(가.현장) && /서식 \d칸에 이 현장 값이 먼저/.test(await 말(p)), await 말(p))
  const 줄 = await p.locator('.mc-site-l').innerText()
  ok(`${기기} 카드 줄 — 발주 · 6,850,000,000원 (68억 5,000만 원) · 착공 ~ 준공`, 줄.includes('가나시') && 줄.includes('6,850,000,000원 (68억 5,000만 원)') && 줄.includes(H.날보기(가.착공, false)) && 줄.includes(H.날보기(가.준공, false)), 줄)
  ok(`${기기} 공기 막대 «착공 전 — 착공까지 N일»`, /착공 전 — 착공까지 \d+일 · 공기 \d+일/.test(await p.locator('.mc-bar span').innerText()), await p.locator('.mc-bar span').innerText())
  const 공통 = await p.evaluate(() => JSON.parse(localStorage.getItem('kcm.서식공통') || '{}'))
  ok(`${기기} 서식 공통 칸 = 이 현장(공사명 · 발주 · 금액 · 착공 · 준공) · 회사 그대로`, 공통.현장 === 가.현장 && 공통.발주 === 가.발주 && 공통.계약금액 === '6,850,000,000' && 공통.착공 === 가.착공 && 공통.준공 === 가.준공 && 공통.회사 === '시험건설(주)', 공통)
  console.log(`③ ${기기} 오늘 할 일 · 서식으로`)
  const 기대 = H.오늘할일(H.할일(H.현장정리(가), 오늘), 5).map((x) => [H.D글(x.D), x.제목])
  ok(`${기기} 오늘 할 일 5 — D · 제목이 lib 셈과 같음`, JSON.stringify(await 일들(p)) === JSON.stringify(기대), [await 일들(p), 기대])
  const 대장 = p.locator('.mc-todo', { hasText: '공사안전보건대장 제출' })
  ok(`${기기} «공사안전보건대장 제출» 줄 · 근거 펼치기`, (await 대장.count()) === 1 && /고시 제7조②/.test(await 대장.locator('.mc-todo-more').evaluate((el) => { el.open = true; return el.innerText })))
  await 대장.locator('a', { hasText: '서식' }).click()
  await p.waitForURL(/\/forms\/gongsa-anjeon-daejang$/, { timeout: 15000 })
  await p.waitForFunction(() => window.__격자 && document.querySelectorAll('canvas.gx-page').length, null, { timeout: 25000 }); await p.waitForTimeout(500)
  const 서식값 = await p.evaluate(() => { const g = window.__격자; const 찾 = (시, 열) => { const si = g.doc.sheets.findIndex((s) => s.name === 시); const a = Object.entries(g.doc.sheets[si].keys).find(([, k]) => k === 열); const m = /^([A-Z]+)(\d+)$/.exec(a[0]); let c = 0; for (const ch of m[1]) c = c * 26 + ch.charCodeAt(0) - 64; return g.책.값(si, +m[2], c) }; return [찾('사업개요', '공사명'), 찾('판정', '착공일'), 찾('판정', '대상판정'), 찾('사업개요', '발주자')] })
  const 일련 = (s) => { const [y, m, d] = s.split('-').map(Number); return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(1899, 11, 30)) / 86400000) }
  ok(`${기기} «서식 →» → 공사안전보건대장이 이 현장 값으로(공사명 · 착공일 · 발주자)`, 서식값[0] === 가.현장 && 서식값[1] === 일련(가.착공) && 서식값[3] === 가.발주, 서식값)
  await p.goBack({ waitUntil: 'domcontentloaded' }); await p.waitForSelector('.mc-site-c', { timeout: 15000 }); await p.waitForTimeout(300)
  console.log(`④ ${기기} 했음 · 새로고침 · 전체 · 달력`)
  const 첫 = (await 일들(p))[0][1]
  await p.locator('.mc-todo').first().locator('.mc-ck').click(); await p.waitForTimeout(250)
  ok(`${기기} ✓ 했음 → 맨 위에서 빠짐`, !(await 일들(p)).some(([, t]) => t === 첫), await 일들(p))
  await 열기(p)
  ok(`${기기} 새로고침 → 현장 · 했음 그대로`, (await p.locator('.mc-site-n').innerText()).includes(가.현장) && !(await 일들(p)).some(([, t]) => t === 첫))
  await p.locator('button', { hasText: '전체 보기' }).click(); await p.waitForTimeout(250)
  const 전체 = await 일들(p)
  const 기대수 = H.할일(H.현장정리(가), 오늘).length
  ok(`${기기} 전체 보기 — 날 있는 것 + 늘 지킬 것 = ${기대수} · 했음 줄 «✓ 했음» · 늘 «늘»`, 전체.length === 기대수 && 전체.some(([d, t]) => d === '✓ 했음' && t === 첫) && 전체.filter(([d]) => d === '늘').length === 3, 전체.map((x) => x[0]))
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 10000 }).catch(() => null), p.locator('button', { hasText: '폰 달력에 넣기' }).click()])
  let ics = ''
  if (dl) { const st = await dl.createReadStream(); for await (const c of st) ics += c.toString('utf8') }
  ok(`${기기} 📲 폰 달력 — 파일 이름 · 일정 수(안 한 것) · «이어 보기»`, !!dl && dl.suggestedFilename() === H.달력이름(가) && (ics.match(/BEGIN:VEVENT/g) || []).length === H.할일(H.현장정리(가), 오늘).filter((x) => x.날).length - 1 && /이어 보기: https:\/\/k-conmap\.com\/my/.test(ics.replace(/\r\n /g, '')), dl && dl.suggestedFilename())
  console.log(`⑤ ${기기} 둘째 현장 · 바꾸기 · 고치기 · 지우기`)
  await p.locator('button', { hasText: '＋ 현장' }).click(); await p.waitForTimeout(200)
  await 칸(p, '공사명').fill('둘째 하수관로 공사'); await 칸(p, '발주기관').fill('나라시'); await 칸(p, '착공일').fill(H.달더하기(오늘, 2)); await 칸(p, '준공일').fill(H.달더하기(오늘, 5)); await 칸(p, '현장 위치').fill('나라시 가동')
  await p.locator('button', { hasText: '＋ 이 현장 저장' }).click(); await p.waitForTimeout(400)
  const 칩 = await p.evaluate(() => [...document.querySelectorAll('.mc-site .chip')].map((c) => [c.textContent, c.classList.contains('on')]))
  ok(`${기기} 현장 둘 → 고르기 칩(지금 = 둘째)`, 칩.length === 2 && 칩.some(([t, on]) => t === '둘째 하수관로 공사' && on), 칩)
  await p.locator('.mc-site .chip', { hasText: 가.현장 }).click(); await p.waitForTimeout(300)
  const 공2 = await p.evaluate(() => JSON.parse(localStorage.getItem('kcm.서식공통') || '{}'))
  ok(`${기기} 첫 현장으로 바꿈 → 카드 · 서식 공통 칸(위치는 비움 — 둘째 현장 값 안 섞임)`, (await p.locator('.mc-site-n').innerText()).includes(가.현장) && 공2.현장 === 가.현장 && !('위치' in 공2) && /바꿈 — 서식도/.test(await 말(p)), 공2)
  await p.locator('button', { hasText: '✏️ 고치기' }).click(); await p.waitForTimeout(200)
  await 칸(p, '발주기관').fill('가나시청'); await p.locator('button', { hasText: /^저장$/ }).click(); await p.waitForTimeout(300)
  ok(`${기기} 고치기 → 발주 바뀜 · 했음 그대로(전체 보기 그대로 — 그 줄 «✓ 했음»)`, (await p.locator('.mc-site-l').innerText()).includes('가나시청') && (await 일들(p)).some(([d, t]) => t === 첫 && d === '✓ 했음'), [await p.locator('.mc-site-l').innerText().catch(() => '없음'), 첫])
  await p.locator('button', { hasText: '✏️ 고치기' }).click(); await p.waitForTimeout(200)
  await p.locator('button', { hasText: '이 현장 지우기' }).click(); await p.waitForTimeout(150)
  ok(`${기기} 지우기 — 한 번 누르면 «정말 지웁니다» 로 바뀜(바로 안 지움)`, (await p.locator('button', { hasText: '정말 지웁니다' }).count()) === 1 && (await p.evaluate(() => JSON.parse(localStorage.getItem('kcm.my.현장')).목록.length)) === 2)
  await p.locator('button', { hasText: '정말 지웁니다' }).click(); await p.waitForTimeout(300)
  ok(`${기기} 두 번째에 지움 → 남은 현장(둘째)이 지금`, (await p.evaluate(() => JSON.parse(localStorage.getItem('kcm.my.현장')).목록.length)) === 1 && (await p.locator('.mc-site-n').innerText()).includes('둘째 하수관로 공사'))
  console.log(`⑥ ${기기} 쓰는 법 · 그대로 있는 것 · 넘침`)
  const 설명 = await p.locator('.mc-guide').innerText().catch(() => '')
  ok(`${기기} 쓰는 법 새 칸 다섯(내 현장 · 오늘 할 일 · 폰 달력 · 근거 · 이 기기에만)`, ['내 현장 — 한 번 적으면', '오늘 할 일 — 열 때마다', '폰 달력에 넣기', '날짜의 근거', '내 현장은 이 기기에만'].every((t) => 설명.includes(t)))
  const 새글 = await p.evaluate(() => (document.querySelector('.mc-site') || {}).innerText + (document.querySelector('.mc-top') || {}).innerText)
  ok(`${기기} 새 글에 «무료» · «클로드» 없음`, !/무료|클로드/.test(새글))
  ok(`${기기} 단축키 · 작업대 · 만들기 · 다른 기기 그대로`, (await p.locator('.mc-keys').count()) === 1 && (await p.locator('.mc-desk').count()) === 1 && (await p.locator('.mc-hero').count()) === 1 && /다른 기기/.test(await p.locator('.mc-wrap').innerText()))
  ok(`${기기} 넘침 0`, (await 넘침(p)) <= 1, await 넘침(p))
  ok(`${기기} 오류 0`, !오류.length, 오류)
  await ctx.close()
}
await b.close()
console.log(`\n${bad ? '✗' : '✓'} 시험_내현장화면 ${n - bad}/${n}`)
process.exit(bad ? 1 : 0)
