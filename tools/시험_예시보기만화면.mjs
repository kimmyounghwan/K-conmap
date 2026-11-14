/**
 * 🧪 G650 «예시는 보기만» 화면 시험 — 구운 사이트(dist)를 띄운 뒤:
 *   node tools/시험_예시보기만화면.mjs [주소=http://127.0.0.1:4578]
 *   소장님 2026-11-11 「안전관리계획서 예시로 해서 다운 받기가 되는데, 안되게 해야 하는 거 아니야?」 ·
 *   「예시는 보기만 가능하게… 그리고 막아줘… 다른 것도 확인해줘」 → 고르심 «도구 + 서식 모두» ·
 *   「막아 놓은 건 예시도 받지 못하게 막고 볼 수만 있게 해」
 *   ① 서식(사이트에서 작성 · 옛) jg-gulchak(굴착 작업계획서) — 예시 채우기 → 🔒 PDF · 인쇄 · 저장 · 눌러도 받기 0 · 새로고침해도 🔒 → 🧹 빈칸으로 → PDF 받힘
 *   ② 서식(종이에 바로 쓰기 · 격자) o-balpa-jageop · anjeon-gyehoek(안전관리계획서 표지·목차) — 같은 차례 + Ctrl+P(beforeprint) 는 안내 한 장
 *   ③ 잠긴 도구 · 소장님 브라우저(kcm_op) — 안전관리 · 유해위험 «예시로 채우기» → 🔒 받기 넷 · 새로고침 🔒 → ↺ 비우기 → ⬇ PDF 받힘
 *      시공계획서 예시 내역서 → 🔒 · 컬러평면 · 캐드고침 예시 도면 → 🔒(받기 0)
 *   ④ 잠긴 도구 · 이용자 — 예시를 열고 받기를 다 눌러도 받기 0(전과 같음)
 *   📈 G657 물가변동 ESC(/tools/esc) — ③ 소장님 · ④ 이용자 둘 다 🧪 예시면 엑셀 받기 🔒
 *   ⑤ 🧪 G679(11-14) 소장님 「예시 PDF 인쇄 가능해 … 예시를 볼 수만 있게 해주고 나머지는 다 막아야지」 · 「PDF 다운도 가능하고」 —
 *      잠근 도구 9가지(원클릭 · 하도급서류 · ESC · 안전관리 · 유해위험 · 시공계획서 · 중처법 · 컬러평면 · 캐드고침) 이용자 예시:
 *      받기 · PDF · 인쇄 단추는 🔒 뿐(원클릭 엑셀 화면 📄 PDF · 🖨 인쇄가 살아 있었음) · Ctrl+P 는 안내 한 줄(사이트 화면 0) · 예시 판 고르기 · 복사 · 끌기 · 길게 누르기 막음 ·
 *      다른 쪽으로 옮기면 풂 · lib/보기만.js 예시판 = styles.css «G679» 두 벌 · ⑥ 소장님 원클릭(내 것)은 그대로(막지 않음)
 *   가상 자료만(사이트에 든 예시) · 인터넷 안 부름(파이어베이스 · 광고 막음) · 폰 390(①은 PC 1280 도)
 */
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const BASE = process.argv[2] || 'http://127.0.0.1:4578'

let bad = 0, n = 0
const ok = (이름, c, got) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (c || got === undefined ? '' : ' = ' + JSON.stringify(got).slice(0, 300))) }
const 쉬어 = (ms) => new Promise((r) => setTimeout(r, ms))
const b = await chromium.launch({ env: { ...process.env, LANG: 'C.UTF-8', LC_ALL: 'C.UTF-8' } })   // 한글 파일 이름(아니면 «download» 로 바뀜)
const UA폰 = 'Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'

async function 새쪽(w, op) {
  const 폰 = w < 600
  const ctx = await b.newContext({ viewport: { width: w, height: 900 }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', isMobile: 폰, hasTouch: 폰, acceptDownloads: true, ...(폰 ? { userAgent: UA폰 } : {}) })
  await ctx.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|googlesyndication|geojs/, (r) => r.fulfill({ status: 200, body: '' }))
  await ctx.route(/firebaseio\.com|firebasedatabase\.app|identitytoolkit|securetoken|googleapis\.com/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await ctx.addInitScript((op) => {
    try {
      if (!sessionStorage.getItem('__시험')) { localStorage.clear(); sessionStorage.setItem('__시험', '1') }   // 처음 한 번만 비움(새로고침엔 그대로)
      localStorage.setItem('kcm_notice_seen', '2026-10-필독'); sessionStorage.setItem('kcm_notice_seen', '2026-10-업체'); sessionStorage.setItem('kcm_visit_s', '1')
      if (op) localStorage.setItem('kcm_op', '1'); else localStorage.removeItem('kcm_op')
    } catch (e) { /* 없음 */ }
    window.__받기 = []
    const oc = HTMLAnchorElement.prototype.click
    HTMLAnchorElement.prototype.click = function () { if (this.download || /^blob:|^data:/.test(this.href)) window.__받기.push('a ' + (this.download || '')); return oc.apply(this, arguments) }
    const ou = URL.createObjectURL; URL.createObjectURL = function (o) { if (o && o.type !== 'text/javascript') window.__받기.push('blob ' + (o && o.type)); return ou.apply(this, arguments) }
    window.print = function () { window.__받기.push('print') }
  }, op)
  const p = await ctx.newPage()
  const 오류 = [], 받음 = []
  p.on('pageerror', (e) => 오류.push(String(e).slice(0, 160)))
  p.on('download', (d) => 받음.push(d.suggestedFilename()))
  return { ctx, p, 오류, 받음 }
}
const 흔적 = (p) => p.evaluate(() => window.__받기.slice())
const 글 = (p) => p.evaluate(() => document.body.innerText)
const 단추글 = (p, sel) => p.evaluate((sel) => [...document.querySelectorAll(sel)].filter((e) => e.offsetParent).map((e) => e.innerText.replace(/\s+/g, ' ').trim()), sel)
const 누르기 = async (p, 글자) => { const l = p.locator(`button:visible:has-text("${글자}")`).first(); await l.click({ timeout: 8000 }) }
/* 🧪 G679 — 예시는 보기만: html 표시 · Ctrl+P(인쇄 매체)로 찍히는 모습 */
const 보기만켬 = (p) => p.evaluate(() => document.documentElement.classList.contains('kcm-보기만'))
async function 인쇄모습(p) {
  await p.emulateMedia({ media: 'print' })
  const r = await p.evaluate(() => ({ 보임: [...document.body.children].filter((e) => e.getClientRects().length > 0).length, 글: (document.body.innerText || '').trim().length, 앞글: getComputedStyle(document.body, '::before').content }))
  await p.emulateMedia({ media: 'screen' })
  return r
}

/* ── ① 옛 서식(사이트에서 작성) ── */
for (const w of [390, 1280]) {
  console.log(`■ ① 서식(사이트에서 작성) jg-gulchak · ${w}`)
  const { ctx, p, 오류, 받음 } = await 새쪽(w, false)
  await p.goto(BASE + '/forms/jg-gulchak', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('button:has-text("예시 채우기")', { timeout: 30000 })
  await 누르기(p, '예시 채우기')
  await p.waitForFunction(() => /작성 예시/.test(document.body.innerText) && [...document.querySelectorAll('button')].some((e) => /🔒 PDF 저장/.test(e.innerText)), null, { timeout: 20000 }).catch(() => {})
  const 바1 = await 단추글(p, '.fw-bar button')
  ok('예시 채우면 🔒 PDF 저장 · 🔒 인쇄 · 🔒 저장(위 · 아래 단추 줄 모두)', 바1.filter((x) => x === '🔒 PDF 저장').length >= 1 && 바1.includes('🔒 인쇄') && 바1.includes('🔒 저장') && !바1.includes('📄 PDF 저장'), 바1)
  ok('«지금은 작성 예시입니다 — 보기만» 안내가 늘 보임', /지금은 작성 예시입니다 — 보기만 됩니다/.test(await 글(p)))
  await 누르기(p, '🔒 PDF 저장'); await 쉬어(1500)
  ok('🔒 PDF 저장 → 받기 0 · «예시는 보기만» 알림', (await 흔적(p)).length === 0 && 받음.length === 0 && /예시는 보기만 됩니다/.test(await 글(p)), { 흔적: await 흔적(p), 받음 })
  await 누르기(p, '🔒 인쇄'); await 쉬어(1200)
  await 누르기(p, '🔒 저장'); await 쉬어(800)
  ok('🔒 인쇄 · 🔒 저장 → 인쇄 0 · 저장한 것 0', (await 흔적(p)).length === 0 && (await 단추글(p, '.fw-bar button')).some((x) => x === '📂 저장한 것 0'), { 흔적: await 흔적(p) })
  await 쉬어(900)   // 쓰던 것 저절로(0.6초) 뒤 새로고침
  await p.reload({ waitUntil: 'domcontentloaded' })
  await p.waitForSelector('button:has-text("빈칸으로")', { timeout: 30000 })
  await 쉬어(800)
  ok('새로고침해도 예시면 그대로 🔒', (await 단추글(p, '.fw-bar button')).includes('🔒 PDF 저장'), await 단추글(p, '.fw-bar button'))
  await 누르기(p, '빈칸으로'); await 쉬어(700)
  const 바2 = await 단추글(p, '.fw-bar button')
  ok('🧹 빈칸으로 → 📄 PDF 저장 · 🖨 인쇄 · 💾 저장(잠금 풂) · 안내 사라짐', 바2.includes('📄 PDF 저장') && 바2.includes('🖨 인쇄') && 바2.includes('💾 저장') && !/지금은 작성 예시입니다/.test(await 글(p)), 바2)
  await p.locator('.fw-in').first().fill('가상 시험 현장')
  await 쉬어(400)
  await 누르기(p, '📄 PDF 저장')
  await p.waitForFunction(() => window.__받기.length > 0, null, { timeout: 30000 }).catch(() => {})
  ok('내 글로 적으면 PDF 받힘', (await 흔적(p)).some((x) => /pdf|^a /.test(x)) || 받음.length > 0, { 흔적: await 흔적(p), 받음 })
  ok(`오류 0`, 오류.length === 0, 오류)
  await ctx.close()
}

/* ── ② 격자 서식(종이에 바로 쓰기) ── */
for (const 슬 of ['o-balpa-jageop', 'anjeon-gyehoek']) {
  console.log(`■ ② 서식(종이에 바로 쓰기) ${슬} · 390`)
  const { ctx, p, 오류, 받음 } = await 새쪽(390, false)
  await p.goto(BASE + '/forms/' + 슬, { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('button:has-text("예시 채우기")', { timeout: 30000 })
  await 누르기(p, '예시 채우기'); await 쉬어(1500)
  const 바1 = await 단추글(p, '.fw-bar button')
  ok('예시 채우면 🔒 PDF 저장 · 🔒 인쇄 · 🔒 저장 · 안내', 바1.includes('🔒 PDF 저장') && 바1.includes('🔒 인쇄') && 바1.includes('🔒 저장') && /지금은 작성 예시입니다 — 보기만 됩니다/.test(await 글(p)), 바1)
  await 누르기(p, '🔒 PDF 저장'); await 쉬어(1500)
  await 누르기(p, '🔒 인쇄'); await 쉬어(800)
  await 누르기(p, '🔒 저장'); await 쉬어(600)
  ok('🔒 셋 → 받기 · 인쇄 0 · 저장한 것 0 · 알림', (await 흔적(p)).length === 0 && 받음.length === 0 && /예시는 보기만 됩니다/.test(await 글(p)) && (await 단추글(p, '.fw-bar button')).includes('📂 저장한 것 0'), { 흔적: await 흔적(p), 받음 })
  const 찍힘 = await p.evaluate(() => { window.dispatchEvent(new Event('beforeprint')); const box = document.getElementById('gx-인쇄'); return box ? { 글: box.innerText.slice(0, 60), 그림: box.querySelectorAll('canvas').length } : null })
  ok('Ctrl+P(beforeprint) → 종이 그림 없이 «보기만» 안내 한 장', 찍힘 && 찍힘.그림 === 0 && /작성 예시는 보기만/.test(찍힘.글), 찍힘)
  await p.evaluate(() => window.dispatchEvent(new Event('afterprint')))
  await 쉬어(900)
  await p.reload({ waitUntil: 'domcontentloaded' })
  await p.waitForSelector('button:has-text("빈칸으로")', { timeout: 30000 })
  await 쉬어(1200)
  ok('새로고침해도 예시면 그대로 🔒', (await 단추글(p, '.fw-bar button')).includes('🔒 PDF 저장'), await 단추글(p, '.fw-bar button'))
  await 누르기(p, '빈칸으로'); await 쉬어(800)
  ok('🧹 빈칸으로 → 📄 PDF 저장(잠금 풂)', (await 단추글(p, '.fw-bar button')).includes('📄 PDF 저장'), await 단추글(p, '.fw-bar button'))
  const 찍힘2 = await p.evaluate(() => { window.dispatchEvent(new Event('beforeprint')); const box = document.getElementById('gx-인쇄'); const r = box ? box.querySelectorAll('canvas').length : -1; window.dispatchEvent(new Event('afterprint')); return r })
  ok('빈칸으로 뒤 Ctrl+P → 종이 그림', 찍힘2 > 0, 찍힘2)
  await 누르기(p, '📄 PDF 저장')
  await p.waitForFunction(() => window.__받기.length > 0, null, { timeout: 30000 }).catch(() => {})
  ok('빈칸으로 뒤 PDF 받힘', (await 흔적(p)).length > 0 || 받음.length > 0, { 흔적: await 흔적(p), 받음 })
  ok('오류 0', 오류.length === 0, 오류)
  await ctx.close()
}

/* ── ③ 잠긴 도구 · 소장님 브라우저 ── */
for (const [길, 머리] of [['/tools/anjeon', '안전관리계획서 한 벌'], ['/tools/yuhae', '유해위험방지계획서 한 벌']]) {
  console.log(`■ ③ 소장님 브라우저 ${길}`)
  const { ctx, p, 오류, 받음 } = await 새쪽(390, true)
  await p.goto(BASE + 길, { waitUntil: 'domcontentloaded' })
  await p.waitForSelector(`h1:has-text("${머리}")`, { timeout: 30000 })
  await 누르기(p, '예시(가상 공사)로 채우기')
  await p.waitForSelector('svg.sg-page', { timeout: 90000 })
  await 쉬어(1500)
  const 받단추 = await 단추글(p, '.sg-dl button')
  ok('예시로 채우면 받기 넷 모두 🔒', 받단추.length === 4 && 받단추.every((x) => x.startsWith('🔒')), 받단추)
  ok('«예시(가상 공사)로 채운 것입니다 — 보기만» 안내', /예시\(가상 공사\)로 채운 것입니다 — 보기만 됩니다/.test(await 글(p)))
  ok('예시로 채우면 html.kcm-보기만 · Ctrl+P 는 안내 한 줄(G679)', (await 보기만켬(p)) && (await 인쇄모습(p)).보임 === 0, await 인쇄모습(p))
  for (const x of 받단추) { await p.locator(`.sg-dl button:has-text("${x}")`).click(); await 쉬어(900) }
  ok('🔒 넷 눌러도 받기 0 · 알림', (await 흔적(p)).length === 0 && 받음.length === 0 && /받기는 «↺ 비우기» 를 누르고 내 공사로 적은 뒤에 됩니다/.test(await 글(p)), { 흔적: await 흔적(p), 받음 })
  await p.reload({ waitUntil: 'domcontentloaded' })
  await p.waitForSelector('svg.sg-page', { timeout: 90000 })
  await 쉬어(1500)
  ok('새로고침해도 예시면 🔒', (await 단추글(p, '.sg-dl button')).every((x) => x.startsWith('🔒')), await 단추글(p, '.sg-dl button'))
  await 누르기(p, '↺ 비우기'); await 쉬어(1200)
  await p.locator('label:has-text("공사명") input').first().fill('가상 시험 내 공사')
  await 쉬어(1800)
  const 받단추2 = await 단추글(p, '.sg-dl button')
  ok('↺ 비우기 → 받기 ⬇(잠금 풂) · 안내 사라짐', 받단추2.every((x) => x.startsWith('⬇')) && !/예시\(가상 공사\)로 채운 것입니다/.test(await 글(p)), 받단추2)
  ok('↺ 비우기 → html.kcm-보기만 풂 · Ctrl+P 막지 않음(G679)', !(await 보기만켬(p)) && (await 인쇄모습(p)).보임 > 0, await 인쇄모습(p))
  const [받기] = await Promise.all([p.waitForEvent('download', { timeout: 180000 }).catch(() => null), p.locator('.sg-dl button:has-text("⬇ PDF")').click()])
  ok('내 공사로 적으면 PDF 받힘', !!받기 && /\.pdf$/.test(받기.suggestedFilename()), 받기 && 받기.suggestedFilename())
  ok('오류 0', 오류.length === 0, 오류)
  await ctx.close()
}
{
  console.log('■ ③ 소장님 브라우저 /tools/sigong — 예시 내역서')
  const { ctx, p, 오류, 받음 } = await 새쪽(390, true)
  await p.goto(BASE + '/tools/sigong', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('button:has-text("예시 내역서로 보기")', { timeout: 30000 })
  await 누르기(p, '예시 내역서로 보기')
  await p.waitForFunction(() => /예시_내역서\.xlsx/.test(document.body.innerText), null, { timeout: 60000 }).catch(() => {})
  await 쉬어(2000)
  const 받단추 = await 단추글(p, '.sg-dl button')
  ok('예시 내역서면 받기 넷 🔒 · 안내', 받단추.filter((x) => /PDF|한글|워드|엑셀/.test(x)).every((x) => x.startsWith('🔒')) && /예시 내역서<?\/?b?>?로 만든 것입니다|예시 내역서로 만든 것입니다/.test(await 글(p)), 받단추)
  await p.locator('.sg-dl button:has-text("🔒 PDF")').click(); await 쉬어(1200)
  ok('🔒 PDF → 받기 0 · 알림', (await 흔적(p)).length === 0 && 받음.length === 0 && /받기는 내 내역서를 올린 뒤에 됩니다/.test(await 글(p)), await 흔적(p))
  ok('오류 0', 오류.length === 0, 오류)
  await ctx.close()
}
for (const [길, 결과기다림] of [['/tools/colorplan', '.cpl-dl'], ['/tools/cadfix', null]]) {
  console.log(`■ ③ 소장님 브라우저 ${길} — 예시 도면`)
  const { ctx, p, 오류, 받음 } = await 새쪽(390, true)
  await p.goto(BASE + 길, { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('button:has-text("🧪")', { timeout: 30000 })
  await p.locator('button:visible:has-text("🧪")').first().click()
  if (결과기다림) {
    await p.waitForSelector(결과기다림, { timeout: 90000 })
    await 쉬어(1500)
    const 단 = await 단추글(p, '.cpl-dl button')
    ok('예시 도면 → PDF · PNG · DXF 모두 🔒', 단.length === 3 && 단.every((x) => x.startsWith('🔒')), 단)
    for (const x of 단) { await p.locator(`.cpl-dl button:has-text("${x}")`).click(); await 쉬어(900) }
  } else {
    await p.waitForSelector('button:has-text("고치기")', { timeout: 90000 })
    await 쉬어(1500)
    await p.locator('button:visible:has-text("🛠 고치기")').first().click()
    await p.waitForFunction(() => [...document.querySelectorAll('button')].some((e) => /받기/.test(e.innerText)), null, { timeout: 90000 }).catch(() => {})
    await 쉬어(800)
    const 단 = (await 단추글(p, 'button')).filter((x) => /받기/.test(x))
    ok('예시 도면 → 받기 단추 🔒', 단.length >= 1 && 단.every((x) => x.startsWith('🔒')), 단)
    for (const x of 단) { await p.locator(`button:visible:has-text("${x}")`).first().click(); await 쉬어(900) }
  }
  ok('🔒 눌러도 받기 0 · «예시 도면은 보기만» 알림', (await 흔적(p)).length === 0 && 받음.length === 0 && /예시 도면은 보기만 됩니다/.test(await 글(p)), { 흔적: await 흔적(p), 받음 })
  ok('오류 0', 오류.length === 0, 오류)
  await ctx.close()
}

/* 📈 G657 물가변동 ESC — 소장님 브라우저여도 🧪 예시면 엑셀 받기 🔒(받기 0) */
{
  console.log('■ ③ 소장님 브라우저 /tools/esc — 🧪 예시')
  const { ctx, p, 오류, 받음 } = await 새쪽(390, true)
  await p.goto(BASE + '/tools/esc', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('.esc-mine button:has-text("🧪 예시 보기")', { timeout: 30000 })
  await p.locator('.esc-mine button:has-text("🧪 예시 보기")').click()
  await p.waitForSelector('.esc-card', { timeout: 30000 })
  const 단 = await 단추글(p, '.esc-dl button')
  ok('예시면 엑셀 받기 🔒', 단.length === 1 && 단[0].startsWith('🔒'), 단)
  await p.locator('.esc-dl button').click(); await 쉬어(800)
  ok('🔒 눌러도 받기 0 · «예시는 보기만 됩니다» 알림', (await 흔적(p)).length === 0 && 받음.length === 0 && /예시는 보기만 됩니다/.test(await 글(p)), await 흔적(p))
  ok('오류 0', 오류.length === 0, 오류)
  await ctx.close()
}

/* ── ④ 잠긴 도구 · 이용자(전과 같음) ── */
for (const [길, 예시글] of [['/tools/anjeon', '예시로 미리 보기'], ['/tools/yuhae', '예시로 미리 보기'], ['/tools/sigong', '예시로 미리 보기']]) {
  console.log(`■ ④ 이용자 ${길}`)
  const { ctx, p, 오류, 받음 } = await 새쪽(390, false)
  await p.goto(BASE + 길, { waitUntil: 'domcontentloaded' })
  await p.waitForSelector(`button:has-text("${예시글}")`, { timeout: 30000 })
  await 누르기(p, 예시글)
  await p.waitForSelector('svg.sg-page', { timeout: 90000 })
  await 쉬어(1200)
  const 단 = await 단추글(p, '.sg-dl button')
  for (const x of 단) { await p.locator(`.sg-dl button:has-text("${x}")`).first().click(); await 쉬어(700) }
  ok('예시 미리보기 받기 모두 🔒 · 눌러도 받기 0', 단.filter((x) => /PDF|한글|워드|엑셀/.test(x)).every((x) => x.startsWith('🔒')) && (await 흔적(p)).length === 0 && 받음.length === 0, { 단, 흔적: await 흔적(p) })
  ok('오류 0', 오류.length === 0, 오류)
  await ctx.close()
}
{
  console.log('■ ④ 이용자 /tools/esc')
  const { ctx, p, 오류, 받음 } = await 새쪽(390, false)
  await p.goto(BASE + '/tools/esc', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('button:has-text("🧪 예시 산출서 보기")', { timeout: 30000 })
  await 누르기(p, '🧪 예시 산출서 보기')
  await p.waitForSelector('.esc-card', { timeout: 30000 })
  await p.locator('.esc-dl button').click(); await 쉬어(700)
  ok('예시 산출서 받기 🔒 · 눌러도 받기 0 · ESC 파일 칸 없음', (await 단추글(p, '.esc-dl button')).every((x) => x.startsWith('🔒')) && (await 흔적(p)).length === 0 && 받음.length === 0 && await p.locator('input[type=file][accept*=".xls"]').count() === 0, await 흔적(p))
  ok('오류 0', 오류.length === 0, 오류)
  await ctx.close()
}
/* ── ⑤ 🧪 G679(11-14) 잠근 도구 9가지 · 이용자 — 예시는 화면에서 보기만(단추 🔒 뿐 · Ctrl+P 안내 한 줄 · 고르기 · 복사 · 끌기 · 길게 누르기 막음) ── */
{
  const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
  const 판js = fs.readFileSync(path.join(ROOT, 'web/src/lib/보기만.js'), 'utf8')
  const css = fs.readFileSync(path.join(ROOT, 'web/src/styles.css'), 'utf8')
  const 목록 = ((판js.match(/export const 예시판 = '([^']+)'/) || [])[1] || '').split(',').map((x) => x.trim()).filter(Boolean)
  const 줄 = (css.match(/html\.kcm-보기만 \.xv-판[^{]*\{/) || [''])[0]
  const css목록 = [...줄.matchAll(/html\.kcm-보기만 (\.[^\s,{]+)/g)].map((x) => x[1])
  ok('⑤ 두 벌 — lib/보기만.js 예시판 = styles.css «G679» 고르기 막음 칸', 목록.length >= 6 && 목록.length === css목록.length && 목록.every((x) => css목록.includes(x)), { 목록, css목록 })
  ok('⑤ styles.css — 인쇄면 html.kcm-보기만 body > * 숨김 · body::before 안내', /html\.kcm-보기만 body > \* \{ display: none !important; \}/.test(css) && /html\.kcm-보기만 body::before \{\s*content: "🧪 예시는 화면에서 보기만/.test(css))
  const 잠근도구 = ['wonclick', 'hado-docs', 'esc', 'anjeon', 'yuhae', 'sigong', 'jungcheo', 'colorplan', 'cadfix']
  const 쪽파일 = { wonclick: 'WonClick', 'hado-docs': 'HadoDocs', esc: 'Esc', anjeon: 'SafetyPlan', yuhae: 'HazardPlan', sigong: 'SigongPlan', jungcheo: 'Jungcheo', colorplan: 'ColorPlan', cadfix: 'CadFix' }
  const 안부름 = 잠근도구.filter((k) => !/use보기만\(/.test(fs.readFileSync(path.join(ROOT, `web/src/pages/${쪽파일[k]}.jsx`), 'utf8')))
  ok('⑤ 잠근 도구 9가지 모두 use보기만 을 부름', 안부름.length === 0, 안부름)
}
const 보기만도구 = [
  ['/tools/wonclick', async (p) => { await 누르기(p, '화면에서 보기'); await p.waitForSelector('.xv-판', { timeout: 60000 }) }, '.xv-판'],
  ['/tools/hado-docs', async (p) => { await 누르기(p, '예시 한 벌 보기'); await p.waitForSelector('.xv-판', { timeout: 60000 }) }, '.xv-판'],
  ['/tools/esc', async (p) => { await 누르기(p, '예시 산출서 보기'); await p.waitForSelector('.esc-ex', { timeout: 60000 }) }, '.esc-ex'],
  ['/tools/anjeon', async (p) => { await 누르기(p, '예시로 미리 보기'); await p.waitForSelector('.sg-view svg.sg-page', { timeout: 90000 }) }, '.sg-view'],
  ['/tools/yuhae', async (p) => { await 누르기(p, '예시로 미리 보기'); await p.waitForSelector('.sg-view svg.sg-page', { timeout: 90000 }) }, '.sg-view'],
  ['/tools/sigong', async (p) => { await 누르기(p, '예시로 미리 보기'); await p.waitForSelector('.sg-view svg.sg-page', { timeout: 90000 }) }, '.sg-view'],
  ['/tools/jungcheo', async (p) => { await p.locator('button[role=tab]:has-text("서류 한 벌")').first().click(); await 누르기(p, '예시로 미리 보기'); await p.waitForSelector('.sg-view svg.sg-page', { timeout: 60000 }) }, '.sg-view'],
  ['/tools/colorplan', async (p) => { await p.locator('button:visible:has-text("🧪")').first().click(); await p.waitForSelector('.cpl-view canvas', { timeout: 90000 }) }, '.cpl-view'],
  ['/tools/cadfix', async (p) => { await p.locator('button:visible:has-text("🧪")').first().click(); await p.waitForSelector('button:has-text("고치기")', { timeout: 90000 }); await p.locator('button:visible:has-text("🛠 고치기")').first().click(); await p.waitForSelector('.cfx-view canvas', { timeout: 90000 }) }, '.cfx-view'],
]
for (const [길, 열기, 판] of 보기만도구) {
  for (const w of (길 === '/tools/wonclick' ? [390, 1280] : [390])) {
    console.log(`■ ⑤ 이용자 ${길} · ${w} — 예시는 보기만(G679)`)
    const { ctx, p, 오류, 받음 } = await 새쪽(w, false)
    await p.goto(BASE + 길, { waitUntil: 'domcontentloaded' })
    await 쉬어(1500)
    if (길 === '/tools/wonclick') ok('원클릭은 들어오자마자 예시(잠금) — html.kcm-보기만 켜짐', await 보기만켬(p))
    else ok('예시 열기 전엔 html.kcm-보기만 꺼짐', !(await 보기만켬(p)))
    await 열기(p)
    await 쉬어(1500)
    const 단 = await p.evaluate(() => [...document.querySelectorAll('button')].filter((e) => e.offsetParent && !/^🧪/.test(e.innerText.trim()) && /PDF|인쇄|받기|한글|워드|엑셀|PNG|DXF|저장/.test(e.innerText)).map((e) => e.innerText.replace(/\s+/g, ' ').trim()))   // 🧪 예시 고르기 단추(«한글이 깨지는 옛 도면» 등)는 뺌
    ok('받기 · PDF · 인쇄 단추는 🔒 뿐', 단.every((x) => x.includes('🔒')), 단)
    for (const x of 단) { await p.locator(`button:visible:has-text("${x}")`).first().click({ timeout: 5000 }).catch(() => {}); await 쉬어(700) }
    ok('눌러도 받기 · 인쇄 0', (await 흔적(p)).length === 0 && 받음.length === 0, { 흔적: await 흔적(p), 받음 })
    ok('html.kcm-보기만 켜짐', await 보기만켬(p))
    const 인 = await 인쇄모습(p)
    ok('Ctrl+P → 사이트 화면 0 · «예시는 화면에서 보기만» 안내 한 줄', 인.보임 === 0 && 인.글 === 0 && /예시는 화면에서 보기만/.test(인.앞글), 인)
    const 판모습 = await p.evaluate((판) => {
      const el = document.querySelector(판)
      if (!el) return { 없음: true }
      const 고르기 = getComputedStyle(el).userSelect
      let 복사막힘 = null
      const 봄 = (e) => { 복사막힘 = e.defaultPrevented }
      window.addEventListener('copy', 봄)
      const r = document.createRange(); r.selectNodeContents(document.body); const s = getSelection(); s.removeAllRanges(); s.addRange(r)   // Ctrl+A 처럼 판을 감쌈
      document.dispatchEvent(new ClipboardEvent('copy', { bubbles: true, cancelable: true, clipboardData: new DataTransfer() }))
      window.removeEventListener('copy', 봄); s.removeAllRanges()
      const 안 = el.querySelector('svg, canvas, table, td, div') || el
      const 메뉴 = new MouseEvent('contextmenu', { bubbles: true, cancelable: true }); 안.dispatchEvent(메뉴)
      const 끌기 = new DragEvent('dragstart', { bubbles: true, cancelable: true }); 안.dispatchEvent(끌기)
      return { 고르기, 복사막힘, 메뉴막힘: 메뉴.defaultPrevented, 끌기막힘: 끌기.defaultPrevented }
    }, 판)
    ok(`예시 판(${판}) 고르기 · 복사 · 길게 누르기 · 끌기 막음`, 판모습.고르기 === 'none' && 판모습.복사막힘 === true && 판모습.메뉴막힘 && 판모습.끌기막힘, 판모습)
    const 밖메뉴 = await p.evaluate(() => { const h = document.querySelector('h1') || document.body; const e = new MouseEvent('contextmenu', { bubbles: true, cancelable: true }); h.dispatchEvent(e); return e.defaultPrevented })
    ok('판 밖(제목 등)은 그대로 — 길게 누르기 안 막음', 밖메뉴 === false)
    await p.evaluate(() => { history.pushState({}, '', '/tools'); window.dispatchEvent(new PopStateEvent('popstate')) })
    await 쉬어(1500)
    ok('다른 쪽으로 옮기면 html.kcm-보기만 풂 · Ctrl+P 그대로', !(await 보기만켬(p)) && (await 인쇄모습(p)).보임 > 0)
    ok('오류 0', 오류.length === 0, 오류)
    await ctx.close()
  }
}
/* ── ⑥ G679 소장님 브라우저 원클릭(내 것) — 보기만 안 걸림(막지 않음) ── */
{
  console.log('■ ⑥ 소장님 브라우저 /tools/wonclick — 내 것은 그대로')
  const { ctx, p, 오류 } = await 새쪽(1280, true)
  await p.goto(BASE + '/tools/wonclick', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('button:has-text("화면에서 보기")', { timeout: 30000 })
  await 쉬어(1200)
  ok('소장님 원클릭 — html.kcm-보기만 꺼짐 · Ctrl+P 막지 않음', !(await 보기만켬(p)) && (await 인쇄모습(p)).보임 > 0, await 인쇄모습(p))
  const 열림 = await p.locator('button:visible:has-text("화면에서 보기")').first().isEnabled()
  if (열림) {
    await 누르기(p, '화면에서 보기')
    await p.waitForSelector('.xv-판', { timeout: 60000 })
    await 쉬어(1200)
    const 단 = await p.evaluate(() => [...document.querySelectorAll('button')].filter((e) => e.offsetParent).map((e) => e.innerText.replace(/\s+/g, ' ').trim()))
    ok('소장님 원클릭 화면 보기 — 📄 이 장 PDF · 🖨 이 장 인쇄 그대로 · 보기만 꺼짐', 단.some((x) => /📄 이 장 PDF/.test(x)) && 단.some((x) => /🖨 이 장 인쇄/.test(x)) && !(await 보기만켬(p)), 단.filter((x) => /PDF|인쇄/.test(x)))
  } else ok('소장님 원클릭 — 서류 고르기 전(보기 단추 잠김)이라 화면 보기는 건너뜀', true)
  ok('오류 0', 오류.length === 0, 오류)
  await ctx.close()
}
await b.close()
console.log(`\n${bad ? '❌' : '✅'} 시험_예시보기만화면 ${n - bad}/${n}`)
process.exit(bad ? 1 : 0)
