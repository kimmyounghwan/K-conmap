/**
 * 🧰 G784 (2026-11-19) 공무 올인원 화면 시험 — 구운 사이트를 띄운 뒤:
 *   node tools/시험_공무화면.mjs [주소=http://127.0.0.1:4996]
 *   소장님 「하나로 연결시켜서 도구화 가능해」 → 「우리가 할 수 있는 것만 하고, 못하는 거는 제외해」 「못한다고는 하지 말고」
 *   ① 처음(현장 없음) — h1 · 탭 제목 · 단계 셋 · 도구 13(주소 = lib/공무차례.js) · ✓ 단추 없음 · «지금» 없음
 *   ② 맨 위 «내 현장» 칸에서 현장 적기 → 머리 «현장 ✓ 0 / 13» · ✓ 단추 13 · «지금» = ① 착공 전 · «🏗 이 현장 …» 표 셋
 *   ③ ✓ 누름 → 단계 수 · 머리 수 · 눌림 표시 · 새로고침 그대로 · 다시 누르면 되돌림
 *   ④ 내 현장 ✏️ 고치기(공사명 바꿈) → 머리 이름 바로 바뀜 · ✓ 그대로
 *   ⑤ 둘째 현장(준공 20일 앞) → ✓ 0 · «지금» = ③ 준공 · 칩으로 첫 현장 → ✓ 돌아옴 · «지금» = ① 착공 전
 *   ⑥ «준공계» → 이 현장 값(공사명 · 계약금액 · 착공일 · 준공일) · «공사안전보건대장» → 공사명 · 발주자 · 착공일 · 준공일 · «예정공정표» 열림
 *   ⑦ 마이컨맵(/my)에 같은 현장 · 도구 목록 «문서·파일» 맨 앞
 *   ⑧ 설명 · 새 글에 «무료 · 클로드» 없음 · 못 하는 일 글 없음 · 폰 390 · 360 · PC 1280 넘침 0 · 오류 0 · 서버로 보내는 요청 없음
 * 인터넷 안 부름(파이어베이스 · 광고 · 애널리틱스 막음).
 */
import { createRequire } from 'node:module'
import * as H from '../web/src/lib/내현장.js'
import * as G from '../web/src/lib/공무차례.js'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const BASE = process.argv[2] || 'http://127.0.0.1:4996'
let bad = 0, n = 0
const ok = (이름, c, got) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (c || got === undefined ? '' : ' = ' + JSON.stringify(got).slice(0, 400))) }
const b = await chromium.launch({ env: { ...process.env, LANG: 'C.UTF-8' } })
const UA폰 = 'Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'
const 막을 = /googletagmanager|google-analytics|pagead2|adsbygoogle|googlesyndication|geojs|firebaseio|firebasedatabase|daumcdn|kakao|coupang/
async function 새쪽(w, h, 폰 = true) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', isMobile: 폰, hasTouch: 폰, ...(폰 ? { userAgent: UA폰 } : {}) })
  await ctx.route(막을, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await ctx.addInitScript(() => { try { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); sessionStorage.setItem('kcm_notice_seen', '2026-10-업체'); sessionStorage.setItem('kcm_visit_s', '1') } catch (e) { /* 없음 */ } })
  const p = await ctx.newPage()
  const 오류 = [], 보냄 = []
  p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
  p.on('request', (r) => { if (r.method() !== 'GET' && !막을.test(r.url())) 보냄.push(r.method() + ' ' + r.url().slice(0, 90)) })
  return { ctx, p, 오류, 보냄 }
}
const 넘침 = (p) => p.evaluate(() => document.documentElement.scrollWidth - innerWidth)
const 열기 = async (p, 길 = '/tools/gongmu') => { await p.goto(BASE + 길, { waitUntil: 'domcontentloaded' }); await p.waitForSelector(길 === '/my' ? '.mc-site' : '.gmu-steps', { timeout: 20000 }); await p.waitForTimeout(400) }
const 칸 = (p, 이름) => p.locator('.mc-sited label.mc-f', { hasText: 이름 }).locator('input, select').first()
const 머리 = (p) => p.locator('#gmu-h small').innerText()
const 단계수 = (p) => p.evaluate(() => [...document.querySelectorAll('.gmu-step .gmu-cnt')].map((x) => x.textContent.trim()))
const 지금 = (p) => p.evaluate(() => [...document.querySelectorAll('.gmu-step.now h3')].map((x) => x.textContent.trim()))
const 줄 = (p, 이름) => p.locator('.gmu-item', { has: p.locator('.gmu-tx b', { hasText: 이름 }) })
const 저장된 = (p) => p.evaluate(() => { const d = JSON.parse(localStorage.getItem('kcm.my.현장') || '{"목록":[]}'); const x = d.목록.find((y) => y.id === d.지금); return x ? x.했음 : null })
const 격자값 = (p, 이름들) => p.evaluate((이름들) => {
  const g = window.__격자, 값 = {}
  for (const 이름 of 이름들) for (let si = 0; si < g.doc.sheets.length; si++) {
    const a = Object.entries(g.doc.sheets[si].keys || {}).find(([, k]) => k === 이름)
    if (!a) continue
    const m = /^([A-Z]+)(\d+)$/.exec(a[0]); let c = 0; for (const ch of m[1]) c = c * 26 + ch.charCodeAt(0) - 64
    값[이름] = g.책.값(si, +m[2], c); break
  }
  return 값
}, 이름들)
const 일련 = (s) => { const [y, m, d] = s.split('-').map(Number); return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(1899, 11, 30)) / 86400000) }
const 날같음 = (v, s) => v === 일련(s) || String(v ?? '').replace(/\D/g, '') === s.replace(/\D/g, '')
const 날더함 = (s, n) => { const t = new Date(Date.parse(s + 'T00:00:00Z') + n * 864e5); return t.toISOString().slice(0, 10) }
const 오늘 = H.오늘날()
const 가 = { 현장: '시험 하천 정비공사', 발주: '가나시', 금액: '1,250,000,000', 착공: H.달더하기(오늘, 1), 준공: H.달더하기(오늘, 10) }
const 나 = { 현장: '둘째 마을안길 포장공사', 발주: '나라군', 착공: H.달더하기(오늘, -3), 준공: 날더함(오늘, 20) }

for (const [기기, w, h, 폰] of [['폰', 390, 844, true], ['PC', 1280, 900, false]]) {
  console.log(`① ${기기} ${w} — 처음(현장 없음)`)
  const { ctx, p, 오류, 보냄 } = await 새쪽(w, h, 폰)
  await 열기(p)
  ok(`${기기} h1 «공무 올인원 — 착공부터 준공까지 한 곳에서» · 탭 제목`, /공무 올인원 — 착공부터 준공까지 한 곳에서/.test(await p.locator('h1').first().innerText()) && /^공무 올인원 — 착공부터 준공까지 한 곳에서 \| K-건설맵$/.test(await p.title()), await p.title())
  const 단계 = await p.evaluate(() => [...document.querySelectorAll('.gmu-step h3')].map((x) => x.textContent.trim()))
  ok(`${기기} 단계 셋 — ① 착공 전 · ② 공사 중 · ③ 준공`, 단계.join('|') === G.단계들.map((s) => s.이름).join('|'), 단계)
  const 주소들 = await p.evaluate(() => [...document.querySelectorAll('.gmu-item a.gmu-go')].map((a) => a.getAttribute('href')))
  ok(`${기기} 도구 13 — 주소 차례가 lib 와 같음`, 주소들.join() === G.모든도구.map((t) => t.주소).join(), 주소들)
  ok(`${기기} 현장 없으면 ✓ 단추 · 단계 수 · «지금» 없음 · 머리 «현장을 적으면 …»`, (await p.locator('.gmu-chk').count()) === 0 && (await 단계수(p)).length === 0 && (await 지금(p)).length === 0 && /현장을 적으면/.test(await 머리(p)))
  ok(`${기기} 맨 위 «내 현장» 칸 — «＋ 내 현장 적기»`, (await p.locator('.gmu-site .mc-site button', { hasText: '＋ 내 현장 적기' }).count()) === 1)

  console.log(`② ${기기} 현장 적기 → 공무 차례`)
  await p.locator('.gmu-site button', { hasText: '＋ 내 현장 적기' }).click(); await p.waitForTimeout(200)
  await 칸(p, '공사명').fill(가.현장); await 칸(p, '발주기관').fill(가.발주); await 칸(p, '도급금액').fill(가.금액)
  await 칸(p, '착공일').fill(가.착공); await 칸(p, '준공일').fill(가.준공)
  await p.locator('.gmu-site button', { hasText: '＋ 이 현장 저장' }).click(); await p.waitForTimeout(500)
  ok(`${기기} 저장 → 머리 «${가.현장}» ✓ 0 / 13 (새로고침 없이)`, (await 머리(p)) === `«${가.현장}» ✓ 0 / 13`, await 머리(p))
  ok(`${기기} ✓ 단추 13 · 단계 수 0/5 · 0/6 · 0/2`, (await p.locator('.gmu-chk').count()) === 13 && (await 단계수(p)).join() === '✓ 0 / 5,✓ 0 / 6,✓ 0 / 2', await 단계수(p))
  ok(`${기기} «지금» = ① 착공 전(착공 한 달 앞)`, (await 지금(p)).length === 1 && /^① 착공 전\s*지금$/.test((await 지금(p))[0]) && (await p.locator('.gmu-now').count()) === 1, await 지금(p))
  const 표들 = await p.evaluate(() => [...document.querySelectorAll('.gmu-val')].map((x) => [x.closest('.gmu-item').querySelector('b').textContent, x.textContent]))
  ok(`${기기} «🏗 이 현장 …» 표 셋 — 예정공정표(내역서를 넣을 때) · 공사안전보건대장 · 준공계`, JSON.stringify(표들) === JSON.stringify([['예정공정표 · S커브', '🏗 이 현장 착공 · 준공(내역서를 넣을 때)'], ['공사안전보건대장', '🏗 이 현장 공사명 · 발주자 · 착공 · 준공'], ['준공계', '🏗 이 현장 공사명 · 금액 · 착공 · 준공']]), 표들)

  console.log(`③ ${기기} ✓ 누름 · 새로고침 · 되돌림`)
  await 줄(p, '시공계획서 한 벌').locator('.gmu-chk').click(); await p.waitForTimeout(150)
  await 줄(p, '물가변동(ESC)').locator('.gmu-chk').click(); await p.waitForTimeout(150)
  const 눌림 = await 줄(p, '시공계획서 한 벌').locator('.gmu-chk').evaluate((x) => [x.getAttribute('aria-pressed'), x.textContent, x.closest('li').classList.contains('done')])
  ok(`${기기} ✓ → «✓ 했음» · 눌림 · 줄 흐림`, 눌림.join() === 'true,✓ 했음,true', 눌림)
  ok(`${기기} 단계 수 1/5 · 1/6 · 0/2 · 머리 ✓ 2 / 13`, (await 단계수(p)).join() === '✓ 1 / 5,✓ 1 / 6,✓ 0 / 2' && (await 머리(p)).endsWith('✓ 2 / 13'), [await 단계수(p), await 머리(p)])
  ok(`${기기} 저장 — 그 현장 «했음» 에 gm:sigong · gm:esc`, JSON.stringify((await 저장된(p)).filter((k) => k.startsWith('gm:')).sort()) === JSON.stringify(['gm:esc', 'gm:sigong']), await 저장된(p))
  await 열기(p)
  ok(`${기기} 새로고침 → ✓ 그대로`, (await 머리(p)).endsWith('✓ 2 / 13') && (await p.locator('.gmu-chk.on').count()) === 2, await 머리(p))
  await 줄(p, '물가변동(ESC)').locator('.gmu-chk').click(); await p.waitForTimeout(150)
  ok(`${기기} 다시 누르면 되돌림 → ✓ 1 / 13`, (await 머리(p)).endsWith('✓ 1 / 13') && (await 줄(p, '물가변동(ESC)').locator('.gmu-chk').getAttribute('aria-pressed')) === 'false', await 머리(p))
  await 줄(p, '물가변동(ESC)').locator('.gmu-chk').click(); await p.waitForTimeout(150)

  console.log(`④ ${기기} 내 현장 고치기 → 머리 · ✓ 그대로`)
  await p.locator('.gmu-site button', { hasText: '✏️ 고치기' }).click(); await p.waitForTimeout(200)
  await 칸(p, '공사명').fill(가.현장 + '(1공구)')
  await p.locator('.gmu-site button', { hasText: /^저장$/ }).click(); await p.waitForTimeout(400)
  ok(`${기기} 고치기 → 머리 «${가.현장}(1공구)» · ✓ 2 / 13 그대로`, (await 머리(p)) === `«${가.현장}(1공구)» ✓ 2 / 13`, await 머리(p))

  console.log(`⑤ ${기기} 둘째 현장 · 칩으로 바꾸기`)
  await p.locator('.gmu-site button', { hasText: '＋ 현장' }).click(); await p.waitForTimeout(200)
  await 칸(p, '공사명').fill(나.현장); await 칸(p, '발주기관').fill(나.발주); await 칸(p, '착공일').fill(나.착공); await 칸(p, '준공일').fill(나.준공)
  await p.locator('.gmu-site button', { hasText: '＋ 이 현장 저장' }).click(); await p.waitForTimeout(500)
  ok(`${기기} 둘째 현장 → 머리 «${나.현장}» ✓ 0 / 13 · ✓ 켜진 것 없음`, (await 머리(p)) === `«${나.현장}» ✓ 0 / 13` && (await p.locator('.gmu-chk.on').count()) === 0, await 머리(p))
  ok(`${기기} 둘째 «지금» = ③ 준공(준공 20일 앞)`, (await 지금(p)).length === 1 && /^③ 준공\s*지금$/.test((await 지금(p))[0]), await 지금(p))
  await 줄(p, '준공계').locator('.gmu-chk').click(); await p.waitForTimeout(150)
  await p.locator('.gmu-site .chip', { hasText: 가.현장 }).click(); await p.waitForTimeout(400)
  ok(`${기기} 칩으로 첫 현장 → ✓ 2 / 13 돌아옴 · «지금» = ① 착공 전`, (await 머리(p)) === `«${가.현장}(1공구)» ✓ 2 / 13` && /^① 착공 전/.test((await 지금(p))[0] || '') && (await 줄(p, '준공계').locator('.gmu-chk').getAttribute('aria-pressed')) === 'false', [await 머리(p), await 지금(p)])
  await p.locator('.gmu-site .chip', { hasText: 나.현장 }).click(); await p.waitForTimeout(400)
  ok(`${기기} 다시 둘째 → 준공계만 ✓ (현장마다 따로)`, (await 머리(p)) === `«${나.현장}» ✓ 1 / 13` && (await 줄(p, '준공계').locator('.gmu-chk').getAttribute('aria-pressed')) === 'true', await 머리(p))
  await p.locator('.gmu-site .chip', { hasText: 가.현장 }).click(); await p.waitForTimeout(400)

  console.log(`⑥ ${기기} 도구 열기 — 이 현장 값이 먼저`)
  await 줄(p, '준공계').locator('a.gmu-go').click()
  await p.waitForURL(/\/forms\/jungong$/, { timeout: 15000 })
  await p.waitForFunction(() => window.__격자 && document.querySelectorAll('canvas.gx-page').length, null, { timeout: 25000 }); await p.waitForTimeout(500)
  const 준 = await 격자값(p, ['공사명', '계약금액', '착공일', '준공일'])
  ok(`${기기} «준공계» → 공사명 · 계약금액 · 착공일 · 준공일 = 이 현장`, 준.공사명 === 가.현장 + '(1공구)' && Number(String(준.계약금액).replace(/,/g, '')) === 1250000000 && 날같음(준.착공일, 가.착공) && 날같음(준.준공일, 가.준공), 준)
  await p.goBack({ waitUntil: 'domcontentloaded' }); await p.waitForSelector('.gmu-steps', { timeout: 15000 }); await p.waitForTimeout(300)
  ok(`${기기} 뒤로 → 공무 올인원 그대로(✓ 2 / 13)`, (await 머리(p)).endsWith('✓ 2 / 13'), await 머리(p))
  await 줄(p, '공사안전보건대장').locator('a.gmu-go').click()
  await p.waitForURL(/\/forms\/gongsa-anjeon-daejang$/, { timeout: 15000 })
  await p.waitForFunction(() => window.__격자 && document.querySelectorAll('canvas.gx-page').length, null, { timeout: 25000 }); await p.waitForTimeout(500)
  const 대 = await 격자값(p, ['공사명', '발주자', '착공일', '준공일'])
  ok(`${기기} «공사안전보건대장» → 공사명 · 발주자 · 착공일 · 준공일 = 이 현장`, 대.공사명 === 가.현장 + '(1공구)' && 대.발주자 === 가.발주 && 날같음(대.착공일, 가.착공) && 날같음(대.준공일, 가.준공), 대)
  await p.goBack({ waitUntil: 'domcontentloaded' }); await p.waitForSelector('.gmu-steps', { timeout: 15000 }); await p.waitForTimeout(300)
  await 줄(p, '예정공정표 · S커브').locator('a.gmu-go').click()
  await p.waitForURL(/\/tools\/schedule$/, { timeout: 15000 }); await p.waitForTimeout(1200)
  ok(`${기기} «예정공정표 · S커브» → 예정공정표 열림`, /예정공정표/.test(await p.locator('h1').first().innerText().catch(() => '')), await p.locator('h1').first().innerText().catch(() => '없음'))
  await p.goBack({ waitUntil: 'domcontentloaded' }); await p.waitForSelector('.gmu-steps', { timeout: 15000 }); await p.waitForTimeout(300)

  console.log(`⑦ ${기기} 마이컨맵 · 도구 목록`)
  await 열기(p, '/my')
  const 칩들 = await p.evaluate(() => [...document.querySelectorAll('.mc-site .chip')].map((c) => c.textContent))
  ok(`${기기} 마이컨맵 «내 현장» 에 같은 현장 둘(같은 장부)`, 칩들.length === 2 && 칩들.includes(가.현장 + '(1공구)') && 칩들.includes(나.현장), 칩들)
  await p.goto(BASE + '/tools', { waitUntil: 'domcontentloaded' }); await p.waitForSelector('#t-file', { timeout: 20000 }); await p.waitForTimeout(300)
  const 문서 = await p.evaluate(() => [...document.querySelectorAll('#t-file a[href]')].map((a) => [a.getAttribute('href'), a.textContent.replace(/\s+/g, ' ').trim().slice(0, 40)]).filter(([h]) => h.startsWith('/')))
  ok(`${기기} 도구 목록 «문서·파일» 맨 앞 = 🧰 공무 올인원`, 문서.length > 1 && 문서[0][0] === '/tools/gongmu' && /공무 올인원/.test(문서[0][1]), 문서.slice(0, 2))

  console.log(`⑧ ${기기} 설명 · 글 · 넘침`)
  await 열기(p)
  const 설명 = await p.locator('.tguide').innerText().catch(() => '')
  ok(`${기기} 설명 — 자세한 설명 · 쓰는 순서 셋 · 묻고 답`, /공무 올인원 — 자세한 설명/.test(설명) && ['① 현장 적기', '② 차례대로 열기', '③ ✓ 해 두기'].every((t) => 설명.includes(t)) && /서버로 가나요/.test(설명), 설명.slice(0, 200))
  const 글 = await p.evaluate(() => document.querySelector('.gmu').innerText)
  ok(`${기기} 새 글에 «무료 · 클로드 · 유료 · 이용권» 없음`, !/무료|클로드|유료|이용권/.test(글))
  ok(`${기기} 못 하는 일 · 하지 않는 일 글 없음(「못한다고는 하지 말고」)`, !/못 ?합니다|하지 않습니다|할 수 없|토목설계|구조 검토|수리수문|도로대장|기술사|전문 업체/.test(글))
  ok(`${기기} ${w} 넘침 0`, (await 넘침(p)) <= 1, await 넘침(p))
  const 폭들 = await p.evaluate(() => [...new Set([...document.querySelectorAll('.gmu-chk')].map((c) => Math.round(c.getBoundingClientRect().width)))])
  ok(`${기기} ✓ 단추 폭 모두 같음(«✓ 했음» 이 섞여도 줄이 들쭉날쭉하지 않게)`, 폭들.length === 1 && (await p.locator('.gmu-chk.on').count()) > 0, 폭들)
  if (폰) {
    await p.setViewportSize({ width: 360, height: 760 }); await p.waitForTimeout(300)
    ok(`${기기} 360 넘침 0`, (await 넘침(p)) <= 1, await 넘침(p))
    const 겹침 = await p.evaluate(() => [...document.querySelectorAll('.gmu-item')].filter((li) => { const a = li.querySelector('.gmu-go').getBoundingClientRect(), c = li.querySelector('.gmu-chk'); if (!c) return false; const r = c.getBoundingClientRect(); return r.left < a.right - 1 || r.width < 40 || r.height < 34 }).length)
    ok(`${기기} 360 — ✓ 단추가 도구 이름과 안 겹침 · 누르기 넉넉(40×34 이상)`, 겹침 === 0, 겹침)
  }
  ok(`${기기} 오류 0`, !오류.length, 오류)
  ok(`${기기} 서버로 보내는 요청 없음`, !보냄.length, 보냄)
  await ctx.close()
}
await b.close()
console.log(`\n${bad ? '✗' : '✓'} 시험_공무화면 ${n - bad}/${n}`)
process.exit(bad ? 1 : 0)
