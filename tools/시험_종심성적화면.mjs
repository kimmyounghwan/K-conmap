/**
 * 🧪 📊 G816 종심 «성적표» 화면 — 구운 사이트(가짜 파이어베이스 판)를 띄운 뒤:
 *   node tools/시험_종심성적화면.mjs [주소=http://127.0.0.1:5821] [캡처폴더]
 *   ⚠️ 클라우드만 — 실제 자료(저장소 data/seed/jongsim.json · 작업 폴더에 없으면 JONGSIM_SEED=씨앗 길)로 python3 종심예측.py 가 jongsim.json · jongsim_score.json 을 구움(PC 시험 목록엔 안 넣음)
 *   가상 공고 둘(간이형 · 일반) · 인터넷 안 부름.
 *   ① 카드 ① 아래 «📊 성적표» 접힘 — 처음엔 성적표 자료를 안 받음 · 열면 받음(한 번)
 *   ② 맞춰 본 건수 · 기간 · 갈래마다 «N건 중 M건 들어맞음(율%)» · 평균 폭 · 예상 열림/닫힘 = 자료 그대로 · 이 공고 갈래가 맨 위(on)
 *   ③ 갈래마다 «기준 금액 가격점수 — 기대 평균 · 실제 평균 · 0점 위험 셈 · 실제 0점» = lib 점수맞춰보기 손셈(같은 자료)
 *   ④ 개찰 줄 — 새것부터 12줄 · 줄마다 예상 범위(그 갈래 구간) · 실제 · ✓ ✗ = 자료 · «더 보기 (N건)» → N줄
 *   ⑤ 공고번호 · 업체 이름 · 공사명 안 보임 · 근사값 · 그날 앞 자료 글 · 자료 없음(404) → «모으는 중» · 참고(안 보임) 카드에도 접힘
 *   ⑥ 폰 390 · 320 · PC 1280 · 어두운 — 넘침 0 · 오류 0 · 성적표 글이 카드 밖으로 안 나감
 */
import path from 'node:path'
import fs from 'node:fs'
import os from 'node:os'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { 갈래글, 점수맞춰보기 } from '../web/src/lib/종심고르기.js'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const BASE = process.argv[2] || 'http://127.0.0.1:5821'
const CAP = process.argv[3] || ''

let bad = 0, n = 0
const ok = (이름, c, got) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (c || got === undefined ? '' : ' = ' + JSON.stringify(got).slice(0, 300))) }

/* 실제 자료로 굽기 — 저장소 data/seed/jongsim.json → 판(jongsim.json) · 성적(jongsim_score.json) */
const 임시 = fs.mkdtempSync(path.join(os.tmpdir(), 'jss-'))
execFileSync('python3', ['-c', `
import sys, json, os
sys.path.insert(0, ${JSON.stringify(ROOT)})
import 종심예측 as P
src = ${JSON.stringify(process.env.JONGSIM_SEED || path.join(ROOT, 'data', 'seed', 'jongsim.json'))}
js = json.load(open(src, encoding="utf-8"))
판 = P.만들기(js)
json.dump(판, open(os.path.join(${JSON.stringify(임시)}, "판.json"), "w", encoding="utf-8"), ensure_ascii=False)
json.dump(P.성적판(js, 판), open(os.path.join(${JSON.stringify(임시)}, "성적.json"), "w", encoding="utf-8"), ensure_ascii=False)
`], { encoding: 'utf8' })
const 판 = JSON.parse(fs.readFileSync(path.join(임시, '판.json'), 'utf8'))
const 성 = JSON.parse(fs.readFileSync(path.join(임시, '성적.json'), 'utf8'))
const 손점 = 점수맞춰보기(성.줄)
console.log(`· 실제 자료: 맞춰 본 ${성.n}건 · 갈래 ${Object.keys(성.갈래).join(' · ')} · 열린 갈래 ${성.갈래보임.join(' · ') || '없음'}`)

const 날 = (d) => new Date(Date.now() + d * 86400e3 + 9 * 3600e3).toISOString().slice(0, 10)
const 오늘 = 날(0)
const 공통 = { ord: '000', dt: 오늘 + ' 09:00:00', close: 날(5) + ' 10:00:00', lo: -2, hi: 2, ptot: 15, pdrw: 4, ayn: 'Y', lic: ['토목공사업/0001'], sido: '경기', mthd: '일반경쟁', kind: '일반', url: 'https://www.g2b.go.kr/' }
const 갑 = { ...공통, no: 'R00TEST81601', name: '가상 하천 정비공사(간이형)', inst: '조달청 가상지방조달청', base: 16500000000, est: 15000000000, llr: null, aval: 900000000, smk: 'N',
  swin: '종합심사낙찰제(공사)-간이형 공사 심사항목 및 배점기준', pc: 12000000000 }
const 을 = { ...공통, no: 'R00TEST81602', name: '가상 청사 신축공사(일반)', inst: '조달청 가상지방조달청', base: 115000000000, est: 104500000000, llr: null, aval: 2100000000, smk: 'N',
  swin: '종합심사낙찰제(공사)-일반공사 심사항목 및 배점기준' }
const 줄들 = [갑, 을]
const meta = { built: 오늘 + ' 06:00', chunk: 500, rankChunk: 50, con: { n: 2, parts: 1, from: '2026-09-15', to: 오늘, lics: [['0001', '토목공사업', 120]] }, serv: { n: 0, parts: 0 } }
const f = ['no', 'name', 'inst', 'base', 'budget', 'close', 'lo', 'hi', 'llr', 'est', 'lic', 'aval', 'gmtrl', 'ayn', 'ptot', 'pdrw', 'url', 'site', 'rgnb', 'joint', 'mthd', 'swin', 'rebid', 'enp', 'enpn', 'dt', 'sido', 'dsn', 'enpb', 'jnt', 'tg', 'nt', 'licg', 'rgs', 'az', 'smk', 'pc']
const 표 = {}
for (const s of [0, 1, 2, 3]) for (const q of [0, 1, 2, 3]) 표[`s${s}n${q}`] = [120, 5.1]
const 색인 = JSON.stringify({ built: 오늘 + ' 06:00', f, pick: { tbl: 표, sz: [1e8, 3e8, 1e9], nb: [10, 30, 100] },
  r: 줄들.map((g) => f.map((k) => (g[k] === undefined ? (k === 'smk' ? '' : k === 'az' ? 0 : null) : g[k]))) })
const 개요 = { rows: 168842, agencies: 5066, corps: 72494, hot: { win: 30, n: 8651, mode: 90.3, rec: 90.1 },
  bands: [{ key: 'xl', label: '100억 이상', min: 1e10, max: null, llr: null, off: null, win: 90, n: 0, mode: null, rec: null, thin: true }],
  sjq: { p10: 98.934, p25: 99.379, p50: 99.886, p75: 100.377, p90: 100.796, p95: 101.036, p98: 101.303 } }

const b = await chromium.launch()
const UA폰 = 'Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'
async function 새쪽(w, h, 폰, { 판_ = 판, 성_ = 성, 어둠 = false } = {}) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', isMobile: 폰, hasTouch: 폰, colorScheme: 어둠 ? 'dark' : 'light', deviceScaleFactor: CAP ? 2 : 1, ...(폰 ? { userAgent: UA폰 } : {}) })
  await ctx.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|googlesyndication|geojs|daumcdn|kakao|coupang/, (r) => r.fulfill({ status: 200, body: '' }))
  await ctx.route(/firebaseio\.com|firebasedatabase\.app|identitytoolkit|securetoken/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await ctx.route('**/data/board/live.json*', (r) => r.fulfill({ json: meta }))
  await ctx.route('**/data/board/live-con-0.json*', (r) => r.fulfill({ json: 줄들 }))
  await ctx.route('**/data/ext/meta.json*', (r) => r.fulfill({ json: { n: 0, first: 0 } }))
  await ctx.route('**/data/pre/idx.json*', (r) => r.fulfill({ json: { all: [0, 0], n: {} } }))
  await ctx.route(/\/data\/bidindex\.json/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 색인 }))
  await ctx.route(/\/data\/overview\.json/, (r) => r.fulfill({ json: 개요 }))
  await ctx.route(/\/data\/(sim|basket|bidresult|first|agency|bstat|aparts)[^/]*\.json/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await ctx.route(/\/data\/jongsim\.json/, (r) => r.fulfill({ json: 판_ }))
  const 받음 = { 성적: 0 }
  await ctx.route(/\/data\/jongsim_score\.json/, (r) => { 받음.성적++; return 성_ ? r.fulfill({ json: 성_ }) : r.fulfill({ status: 404, body: '' }) })   /* 좁은 길은 맨 뒤(나중 등록이 먼저 맞음) */
  await ctx.addInitScript(() => {
    try { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); sessionStorage.setItem('kcm_notice_seen', '2026-10-업체'); sessionStorage.setItem('kcm_visit_s', '1'); localStorage.setItem('kcm_op', '1') } catch (e) { /* 없음 */ }
  })
  const p = await ctx.newPage()
  const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
  return { ctx, p, 오류, 받음 }
}
const 쉬어 = (ms) => new Promise((r) => setTimeout(r, ms))
const 넘침 = (p) => p.evaluate(() => document.documentElement.scrollWidth - innerWidth)
const 카드열기 = async (p, g) => {
  await p.goto(BASE + '/?no=' + g.no, { waitUntil: 'domcontentloaded' })
  await p.waitForFunction((nm) => document.body.innerText.includes(nm), g.name, { timeout: 20000 })
  await p.waitForFunction(() => { const c = document.querySelector('.jsc'); return c && !/불러오는 중/.test(c.innerText) }, null, { timeout: 15000 })
  await 쉬어(500)
}
const 성적열기 = async (p) => {
  await p.evaluate(() => { const d = document.querySelector('.jsc .jsc-score'); d.scrollIntoView({ block: 'center' }) })
  await p.locator('.jsc .jsc-score > summary').click()
  await p.waitForFunction(() => { const s = document.querySelector('.jsc .jsc-score'); return s && s.open && !/불러오는 중/.test(s.innerText) && s.innerText.length > 40 }, null, { timeout: 15000 })
  await 쉬어(300)
}
const 칸밖 = (p) => p.evaluate(() => {
  const c = document.querySelector('.jsc'); if (!c) return ['카드 없음']
  const r = c.getBoundingClientRect(); const 밖 = []
  for (const e of c.querySelectorAll('.jsc-score *')) { const q = e.getBoundingClientRect(); if (q.width && (q.right > r.right + 1 || q.left < r.left - 1)) 밖.push((e.className || e.tagName) + ':' + Math.round(q.right - r.right)) }
  return 밖.slice(0, 5)
})
const 퍼 = (v, k = 2) => `${Number(v).toFixed(k)}%`

for (const [이름, w, h, 폰, 어둠] of [['폰 390', 390, 844, true, false], ['폰 320', 320, 640, true, false], ['PC 1280', 1280, 900, false, false], ['폰 390 어두운', 390, 844, true, true]]) {
  console.log(`■ ${이름}`)
  const { ctx, p, 오류, 받음 } = await 새쪽(w, h, 폰, { 어둠 })
  await 카드열기(p, 갑)
  const 접힘 = await p.evaluate(() => { const s = document.querySelector('.jsc .jsc-score'); return s ? [s.open, s.querySelector('summary').innerText] : null })
  ok('① 카드 ① 아래 «📊 성적표 — 지난 3개월 매일 맞춰 본 기록» 접힘 · 처음엔 닫힘 · 성적표 자료 안 받음', 접힘 && 접힘[0] === false && /📊 성적표 — 지난 3개월 매일 맞춰 본 기록/.test(접힘[1]) && 받음.성적 === 0, [접힘, 받음])
  await 성적열기(p)
  const 글 = await p.evaluate(() => document.querySelector('.jsc .jsc-score .jss').innerText)
  const 처음 = 성.줄[0][1], 끝 = 성.줄[성.줄.length - 1][1]
  ok(`② 열면 받음(한 번) · «지난 3개월(${처음} ~ ${끝}) 종심 개찰 ${성.n}건 … 그날 앞 자료로만»`, 받음.성적 === 1 && 글.includes(`지난 3개월(${처음} ~ ${끝}) 종심 개찰 ${성.n}건`) && /그날 앞 자료로만/.test(글), 글.slice(0, 200))
  const 블록 = await p.evaluate(() => [...document.querySelectorAll('.jsc .jss-g')].map((e) => ({ 글: e.innerText.replace(/\s+/g, ' '), on: e.classList.contains('on') })))
  const 갈들 = Object.entries(성.갈래)
  ok('② 갈래마다 한 칸 · 이 공고 갈래(간이형)가 맨 위 · on', 블록.length === 갈들.length && /^간이형/.test(블록[0].글) && 블록[0].on && 블록.filter((x) => x.on).length === 1, 블록.map((x) => x.글.slice(0, 30)))
  ok('② 갈래마다 «N건 중 M건 들어맞음(율%)» · 평균 폭 · 구간 뜻 · 예상 열림/닫힘 = 자료 그대로', 갈들.every(([k, g]) => {
    const x = 블록.find((y) => y.글.startsWith(갈래글[k] || k))
    return x && x.글.includes(`${g.n}건 중 ${g.적중}건 들어맞음(${g.율}%)`) && x.글.includes(`평균 폭 ${Number(g.폭).toFixed(2)}%p`)
      && x.글.includes(g.구간 === '짧은' ? '80%가 든 가장 좁은 범위' : '위 · 아래 5%씩 뺀 범위') && x.글.includes(성.갈래보임.includes(k) ? '예상 열림' : '예상 닫힘')
  }), 블록.map((x) => x.글))
  ok('③ 갈래마다 기준 금액 점수 = 점수맞춰보기 손셈(기대 평균 · 실제 평균 · 0점 위험 셈 · 실제 0점)', 갈들.every(([k]) => {
    const s = 손점[k]; const x = 블록.find((y) => y.글.startsWith(갈래글[k] || k))
    return !s || !s.n || (x && x.글.includes(`기대 평균 ${s.기대.toFixed(1)}점 · 실제 평균 ${s.실제.toFixed(1)}점`) && x.글.includes(`0점 위험 셈 ${Math.round(s.영셈 * 100)}% · 실제 0점 ${s.영실}/${s.n}건`))
  }), 손점)
  const 줄글 = await p.evaluate(() => [...document.querySelectorAll('.jsc .jss-row')].map((e) => e.innerText.replace(/\s+/g, ' ')))
  const 새것 = [...성.줄].reverse()
  const 맞게 = (a, t) => {
    const 짧 = (성.갈래[a[2]] || {}).구간 === '짧은'
    const [lo, hi, 든] = 짧 ? [a[9], a[10], a[11]] : [a[3], a[5], a[7]]
    return t.includes(`예상 ${퍼(lo, 1)} ~ ${퍼(hi, 1)}`) && t.includes(`실제 ${퍼(a[6])} ${든 ? '✓' : '✗'}`) && t.includes(갈래글[a[2]] || a[2])
  }
  ok('④ 개찰 줄 새것부터 12줄 · 줄마다 예상 범위(그 갈래 구간) · 실제 · ✓ ✗ = 자료', 줄글.length === Math.min(12, 성.n) && 줄글.every((t, i) => 맞게(새것[i], t)), 줄글.slice(0, 3))
  const 띠 = await p.evaluate(() => [...document.querySelectorAll('.jsc .jss-row .jss-bar')].length)
  ok('④ 줄마다 작은 띠(범위 · 실제 점)', 띠 === 줄글.length, 띠)
  if (성.n > 12) {
    await p.locator('.jsc .jss-more').click()
    await 쉬어(300)
    const 다 = await p.evaluate(() => [[...document.querySelectorAll('.jsc .jss-row')].map((e) => e.innerText.replace(/\s+/g, ' ')), !!document.querySelector('.jsc .jss-more')])
    ok(`④ «더 보기 (${성.n}건)» → ${성.n}줄 · 단추 사라짐 · 줄 모두 자료와 같음`, 다[0].length === 성.n && !다[1] && 다[0].every((t, i) => 맞게(새것[i], t)), 다[0].length)
  }
  const 다글 = await p.evaluate(() => document.querySelector('.jsc .jsc-score').innerText)
  ok('⑤ 공고번호 · 업체 · 공사명 안 보임 · 근사값 · 그날 · 뒷날 안 섞음 · 75 · 70 글', !/R\d{2}[A-Z]{2}\d{6,}|주식회사|\(주\)|건설\s/.test(다글) && /근사값/.test(다글) && /그날 · 뒷날 자료는 안 섞음/.test(다글) && /75% 넘으면 «예상» 을 열고 70% 밑으로 떨어지면 닫습니다/.test(다글),
    다글.match(/R\d{2}[A-Z]{2}\d{6,}|주식회사|\(주\)|건설\s/))
  ok('⑥ 넘침 0 · 성적표 글이 카드 밖으로 안 나감 · 오류 0', (await 넘침(p)) <= 0 && (await 칸밖(p)).length === 0 && 오류.length === 0, [await 칸밖(p), 오류])
  if (CAP && !어둠 && w === 390) {
    await p.addStyleTag({ content: 'footer, .ft, .site-foot { visibility: hidden !important; }' })
    await p.evaluate(() => { for (const e of document.querySelectorAll('body *')) { const s = getComputedStyle(e).position; if ((s === 'fixed' || s === 'sticky') && !e.closest('.jsc')) e.style.visibility = 'hidden' } })
    await 쉬어(300)
    await (await p.$('.jsc .jsc-score')).screenshot({ path: `${CAP}/G816_종심성적표_390.png` })
  }
  await ctx.close()
}
{
  console.log('■ 자료 없음(404) · 일반 공고')
  const { ctx, p, 오류 } = await 새쪽(390, 844, true, { 성_: null })
  await 카드열기(p, 을)
  await 성적열기(p)
  const 글 = await p.evaluate(() => document.querySelector('.jsc .jsc-score').innerText)
  ok('성적표 자료 없음 → «성적표 자료를 모으는 중입니다» · 오류 0', /성적표 자료를 모으는 중입니다/.test(글) && 오류.length === 0, [글.slice(0, 120), 오류])
  await ctx.close()
}
{
  console.log('■ 참고(예상 닫힘) 카드에도 접힘 · 일반 공고 맨 위')
  const 닫힘판 = { ...판, 갈래보임: [] }
  const { ctx, p, 오류 } = await 새쪽(390, 844, true, { 판_: 닫힘판, 성_: { ...성, 갈래보임: [] } })
  await 카드열기(p, 을)
  const 참고 = await p.evaluate(() => document.querySelector('.jsc').innerText)
  await 성적열기(p)
  const 블록 = await p.evaluate(() => [...document.querySelectorAll('.jsc .jss-g')].map((e) => ({ 글: e.innerText.replace(/\s+/g, ' '), on: e.classList.contains('on') })))
  ok('참고 카드 «지난 개찰 분포(참고 · 예상 아님)» 에도 성적표 · 이 공고 갈래(일반)가 맨 위 · 모두 «예상 닫힘(참고만)»', /지난 개찰 분포\(참고 · 예상 아님\)/.test(참고) && /^일반/.test(블록[0].글) && 블록[0].on
    && 블록.every((x) => /예상 닫힘\(참고만\)/.test(x.글)) && 오류.length === 0, [블록.map((x) => x.글.slice(0, 40)), 오류])
  await ctx.close()
}
await b.close()
fs.rmSync(임시, { recursive: true, force: true })
console.log(`\n${bad ? '✗' : '✓'} 시험_종심성적화면 ${n - bad}/${n}`)
if (bad) process.exit(1)
