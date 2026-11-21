/**
 * 🧪 🎲 G817 종심 «모의 개찰» 화면 — 구운 사이트(가짜 파이어베이스 판)를 띄운 뒤:
 *   node tools/시험_종심모의화면.mjs [주소=http://127.0.0.1:5821] [캡처폴더]
 *   ⚠️ 클라우드만 — 실제 자료(저장소 data/seed/jongsim.json · 작업 폴더에 없으면 JONGSIM_SEED=씨앗 길)로 python3 종심예측.py 가 jongsim.json 을 구움(PC 시험 목록엔 안 넣음)
 *   가상 공고 셋(간이형 · 일반 · 실적제한 — 실제 재료가 6건이라 펼침은 실적제한으로 · 판에서 실적제한 «예상» 만 열어 둠) · 인터넷 안 부름 · 모의 개찰 재료(jongsim_bids.json)도 실제 자료 — 1순위 저장소(data/seed/first.json.gz · 없으면 FIRST_SEED)에서
 *   업체 «모두» 가 실린 종심 개찰(참여 30곳 이하)만 골라 금액표 꼴로(이름 없음)
 *   ① ② 내 금액을 넣어야 «🎲 모의 개찰 — 지난 ○○ 개찰에 이 금액 넣어 보기» 단추 · 누르기 전엔 재료를 안 받음 · 누르면 한 번 받음
 *   ② 펼침 글 = lib/종심모의.js 모의개찰(같은 재료 · 같은 율) — 건수 · 율 · 평균 · 1등 평균 · 1등 · 3등 안 · 상위 10% · 0점 · 무효 · 줄(≤ 8) 날 · 참여 · 등수 · 점수 · 1등 점수
 *   ③ 내 금액을 바꾸면 펼친 채 다시 셈 · 단추 다시 누르면 접힘 · 재료 없음(404) · 그 갈래 재료 없음 → «모으는 중» · 5건 안 됨(간이형 2건) → «지금 N건(5건부터)» · 5 ~ 9건 → «참고만»
 *   ④ 가격점수만으로 줄 세운다는 글 · 근사값 · 업체 이름 없음 · 폰 390 · 320 · PC 1280 · 어두운 — 넘침 0 · 오류 0 · 카드 밖으로 안 나감
 */
import path from 'node:path'
import fs from 'node:fs'
import os from 'node:os'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import zlib from 'node:zlib'
import { 갈래글, 묶음고르기, 금액대, 기관첫 } from '../web/src/lib/종심고르기.js'
import { 모의개찰 } from '../web/src/lib/종심모의.js'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const BASE = process.argv[2] || 'http://127.0.0.1:5821'
const CAP = process.argv[3] || ''

let bad = 0, n = 0
const ok = (이름, c, got) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (c || got === undefined ? '' : ' = ' + JSON.stringify(got).slice(0, 300))) }

/* 실제 자료로 굽기 — 저장소 data/seed/jongsim.json → 판(jongsim.json) */
const 임시 = fs.mkdtempSync(path.join(os.tmpdir(), 'jss-'))
execFileSync('python3', ['-c', `
import sys, json, os
sys.path.insert(0, ${JSON.stringify(ROOT)})
import 종심예측 as P
src = ${JSON.stringify(process.env.JONGSIM_SEED || path.join(ROOT, 'data', 'seed', 'jongsim.json'))}
js = json.load(open(src, encoding="utf-8"))
판 = P.만들기(js)
json.dump(판, open(os.path.join(${JSON.stringify(임시)}, "판.json"), "w", encoding="utf-8"), ensure_ascii=False)
`], { encoding: 'utf8' })
const 판 = JSON.parse(fs.readFileSync(path.join(임시, '판.json'), 'utf8'))
/* 모의 개찰 재료 — 1순위 저장소에서 업체 «모두» 가 실린 종심 개찰만(금액표 꼴 · 이름 없음) */
const 씨앗js = JSON.parse(fs.readFileSync(process.env.JONGSIM_SEED || path.join(ROOT, 'data', 'seed', 'jongsim.json'), 'utf8')).con || {}
const fc = JSON.parse(zlib.gunzipSync(fs.readFileSync(process.env.FIRST_SEED || path.join(ROOT, 'data', 'seed', 'first.json.gz'))).toString('utf8')).con || {}
const 재료 = { t: '', n: 0, 공고: {} }
for (const [no, r] of Object.entries(씨앗js)) {
  const e = fc[no]
  if (!e || !Array.isArray(e.corps) || !(Number(e.nrank) > 1) || e.corps.length < Number(e.nrank) || !(r.yp > 0) || !(r.bal > 0) || !(r.base > 0)) continue
  재료.공고[no] = [String(r.dt).slice(0, 16), r.kind, r.pt, r.base, r.yp, r.sm ? 1 : 0, r.bal, e.corps.map((c) => Math.trunc(Number(c[1]))).filter((v) => v > 0).sort((x, y) => x - y),
    `${r.kind}|${기관첫(r.inst)}|${금액대(r.est)}|${String(r.main || '').slice(0, 30)}`]   /* 금액표 열쇠(종심예측.py 열쇠글)와 같은 꼴 */
}
재료.n = Object.keys(재료.공고).length
const 갈래수 = {}
for (const a of Object.values(재료.공고)) 갈래수[a[1]] = (갈래수[a[1]] || 0) + 1
console.log(`· 실제 자료: 판 열린 갈래 ${판.갈래보임.join(' · ') || '없음'} · 모의 재료 ${재료.n}건(${Object.entries(갈래수).map(([k, v]) => k + ' ' + v).join(' · ')})`)
/* 실적제한(실제 재료 6건 — 5건 넘음)으로 펼침을 봄 — 판에서 실적제한 «예상» 만 열어 둠(② 내 금액 칸이 뜨게 · 모의 개찰 셈과는 상관없음) */
const 판실 = { ...판, 갈래보임: [...(판.갈래보임 || []), '실적제한'], 묶음: { ...판.묶음, 실적제한: { ...판.묶음['실적제한'], 표본적음: false } } }

const 날 = (d) => new Date(Date.now() + d * 86400e3 + 9 * 3600e3).toISOString().slice(0, 10)
const 오늘 = 날(0)
const 공통 = { ord: '000', dt: 오늘 + ' 09:00:00', close: 날(5) + ' 10:00:00', lo: -2, hi: 2, ptot: 15, pdrw: 4, ayn: 'Y', lic: ['토목공사업/0001'], sido: '경기', mthd: '일반경쟁', kind: '일반', url: 'https://www.g2b.go.kr/' }
const 갑 = { ...공통, no: 'R00TEST81601', name: '가상 하천 정비공사(간이형)', inst: '조달청 가상지방조달청', base: 16500000000, est: 15000000000, llr: null, aval: 900000000, smk: 'N',
  swin: '종합심사낙찰제(공사)-간이형 공사 심사항목 및 배점기준', pc: 12000000000 }
const 을 = { ...공통, no: 'R00TEST81602', name: '가상 청사 신축공사(일반)', inst: '조달청 가상지방조달청', base: 115000000000, est: 104500000000, llr: null, aval: 2100000000, smk: 'N',
  swin: '종합심사낙찰제(공사)-일반공사 심사항목 및 배점기준' }
const 병 = { ...공통, no: 'R00TEST81703', name: '가상 교량 건설공사(실적제한)', inst: '조달청 가상지방조달청', base: 22000000000, est: 20000000000, llr: null, aval: 1200000000, smk: 'N',
  swin: '종합심사낙찰제(공사)-실적제한공사(300억원미만) 심사항목 및 배점기준' }
const 줄들 = [갑, 을, 병]
const meta = { built: 오늘 + ' 06:00', chunk: 500, rankChunk: 50, con: { n: 3, parts: 1, from: '2026-09-15', to: 오늘, lics: [['0001', '토목공사업', 120]] }, serv: { n: 0, parts: 0 } }
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
async function 새쪽(w, h, 폰, { 판_ = 판실, 재_ = 재료, 어둠 = false } = {}) {
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
  const 받음 = { 재료: 0 }
  await ctx.route(/\/data\/jongsim_bids\.json/, (r) => { 받음.재료++; return 재_ ? r.fulfill({ json: 재_ }) : r.fulfill({ status: 404, body: '' }) })   /* 좁은 길은 맨 뒤(나중 등록이 먼저 맞음) */
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
const 금액넣기 = async (p, v) => { await p.fill('.jsc input[aria-label="내 투찰 금액"]', String(v)); await 쉬어(300) }
const 단추 = (p) => p.evaluate(() => { const b = document.querySelector('.jsc .jsm-btn'); return b ? b.innerText : '' })
const 펼침글 = async (p) => {
  await p.waitForFunction(() => { const w = document.querySelector('.jsc .jsm-wrap'); return w && !/불러오는 중/.test(w.innerText) && (w.querySelector('.jsm') || /모으는 중/.test(w.innerText)) }, null, { timeout: 15000 })
  await 쉬어(200)
  return p.evaluate(() => {
    const w = document.querySelector('.jsc .jsm-wrap')
    return { 글: w.innerText.replace(/\s+/g, ' '), 요약: [...w.querySelectorAll('.jsm-sum > div')].map((d) => [d.querySelector('span').innerText, d.querySelector('b').innerText]),
      줄: [...w.querySelectorAll('.jsm-row')].map((e) => e.innerText.replace(/\s+/g, ' ')) }
  })
}
const 칸밖 = (p) => p.evaluate(() => {
  const c = document.querySelector('.jsc'); if (!c) return ['카드 없음']
  const r = c.getBoundingClientRect(); const 밖 = []
  for (const e of c.querySelectorAll('.jsm-wrap *')) { const q = e.getBoundingClientRect(); if (q.width && (q.right > r.right + 1 || q.left < r.left - 1)) 밖.push((e.className || e.tagName) + ':' + Math.round(q.right - r.right)) }
  return 밖.slice(0, 5)
})
const 퍼3 = (v) => `${Number(v).toFixed(3)}%`
const 점1 = (v) => (v == null ? '-' : Number(v).toFixed(1))
const 점3 = (v) => Number(v).toFixed(3)
const 날짧게 = (d) => String(d || '').slice(5, 10).replace('-', '.')
const 기대글 = (m) => {
  const 요약 = [['내 가격점수 평균', `${점1(m.평균)}점`], ['그 공고들 1등 평균', `${점1(m.일평균)}점`], ['가격점수 1등', `${m.일등}번`], ['3등 안', `${m.삼등}번`], ['상위 10% 안', `${m.십분}번`]]
  if (m.영 > 0) 요약.push(['0점', `${m.영}번`])
  if (m.무효 > 0) 요약.push(['예정가격 넘음(무효)', `${m.무효}번`])
  const 줄 = m.결과.slice(0, 8).map((x) => `${날짧게(x.dt)} 참여 ${x.n}곳 ${x.내 == null ? '예정가격 넘음(무효)' : `${x.등}등 · ${점3(x.내)}점`} 1등 ${점3(x.일)}점`)
  return { 요약, 줄 }
}

for (const [이름, w, h, 폰, 어둠] of [['폰 390', 390, 844, true, false], ['폰 320', 320, 640, true, false], ['PC 1280', 1280, 900, false, false], ['폰 390 어두운', 390, 844, true, true]]) {
  console.log(`■ ${이름}`)
  const { ctx, p, 오류, 받음 } = await 새쪽(w, h, 폰, { 어둠 })
  await 카드열기(p, 병)
  ok('① 내 금액 넣기 전 — 모의 개찰 단추 없음 · 재료 안 받음', (await 단추(p)) === '' && 받음.재료 === 0)
  const 첫금액 = Math.floor(병.base * 0.8497 / 1000) * 1000
  await 금액넣기(p, 첫금액)
  const 단 = await 단추(p)
  ok('① 내 금액 넣으면 «🎲 모의 개찰 — 지난 실적제한 개찰에 이 금액 넣어 보기 ▼» · 아직 재료 안 받음', /🎲 모의 개찰 — 지난 실적제한 개찰에 이 금액 넣어 보기 ▼/.test(단) && 받음.재료 === 0, [단, 받음])
  await p.locator('.jsc .jsm-btn').click()
  const 가 = await 펼침글(p)
  const 율 = (첫금액 * 100) / 병.base
  const 통갑 = 묶음고르기(판실, '실적제한', 병.inst, 병.est, 병.main)
  const 거름 = { kind: '실적제한', 열쇠: 통갑.열쇠, 규칙뒤: !!통갑.규칙뒤 }
  const 묶음글 = `${통갑.열쇠.split('|').filter((x) => x && x !== '-1').slice(0, 2).join(' · ')}${통갑.규칙뒤 ? ' · 같은 금액 규칙 뒤' : ''}`
  const 기 = 모의개찰(재료, 거름, 율)
  const 기글 = 기대글(기)
  const 머리 = `지난 ${기.넓힘 ? '실적제한' : 묶음글} 개찰 ${기.n}건${기.넓힘 ? `(${묶음글} 은 자료가 모자라 실적제한 전체)` : ''}에 내 금액(기초의 ${퍼3(율)})을 넣어 보면`
  ok(`② 누르면 재료 한 번 받음 · «${머리}»(카드 ① 과 같은 묶음 «${묶음글}» · 모자라면 갈래 전체)`, 받음.재료 === 1 && 기.n > 0 && 가.글.includes(머리), [가.글.slice(0, 160), 머리])
  ok(`② ${기.n}건(5 ~ 9건) → «⚠️ 아직 ${기.n}건뿐이라 참고만 하세요»`, 기.n >= 5 && 기.n < 10 && 가.글.includes(`⚠️ 아직 ${기.n}건뿐이라 참고만 하세요`), 가.글.slice(0, 200))
  ok('② 요약 칸 = lib 모의개찰(평균 · 1등 평균 · 1등 · 3등 안 · 상위 10% · 0점 · 무효 — 있을 때만)', JSON.stringify(가.요약) === JSON.stringify(기글.요약), [가.요약, 기글.요약])
  ok('② 줄(8줄까지) = lib 결과 — 날 · 참여 · 등수 · 내 점수 · 1등 점수', JSON.stringify(가.줄) === JSON.stringify(기글.줄), [가.줄.slice(0, 2), 기글.줄.slice(0, 2)])
  ok('④ «가격점수만으로 줄 세운 것» · 제13조② · «지난 비슷한 개찰» 뜻 · 균형가격 다시 셈 · 근사값 · 업체 이름 없음', /가격점수만으로 줄 세운 것입니다/.test(가.글) && /제13조②/.test(가.글) && /균형가격도 다시 셈합니다/.test(가.글)
    && /«지난 비슷한 개찰» = 위 ① 예상과 같은 묶음의 최근 개찰\(30건까지\)/.test(가.글)
    && /근사값/.test(가.글) && !/주식회사|\(주\)|㈜/.test(가.글), 가.글.slice(-200))
  const 둘째금액 = Math.floor(병.base * 0.8612 / 1000) * 1000
  await 금액넣기(p, 둘째금액)
  const 나 = await 펼침글(p)
  const 기2 = 모의개찰(재료, 거름, (둘째금액 * 100) / 병.base)
  ok('③ 내 금액을 바꾸면 펼친 채 다시 셈(재료는 다시 안 받음)', 받음.재료 === 1 && 나.글.includes(`(기초의 ${퍼3((둘째금액 * 100) / 병.base)})`) && JSON.stringify(나.요약) === JSON.stringify(기대글(기2).요약), [나.요약, 기대글(기2).요약])
  ok('④ 넘침 0 · 펼침이 카드 밖으로 안 나감 · 오류 0', (await 넘침(p)) <= 0 && (await 칸밖(p)).length === 0 && 오류.length === 0, [await 칸밖(p), 오류])
  if (CAP && !어둠 && w === 390) {
    await 금액넣기(p, 첫금액)
    await 펼침글(p)
    await p.addStyleTag({ content: 'footer, .ft, .site-foot { visibility: hidden !important; }' })
    await p.evaluate(() => { for (const e of document.querySelectorAll('body *')) { const s = getComputedStyle(e).position; if ((s === 'fixed' || s === 'sticky') && !e.closest('.jsc')) e.style.visibility = 'hidden' } })
    await 쉬어(300)
    const 상자 = await p.evaluateHandle(() => document.querySelector('.jsc .jsm-wrap').closest('.jsc-box'))
    await 상자.asElement().screenshot({ path: `${CAP}/G817_종심모의개찰_390.png` })
  }
  await p.locator('.jsc .jsm-btn').click()
  await 쉬어(200)
  ok('③ 단추 다시 누르면 접힘(▲ → ▼)', !(await p.$('.jsc .jsm')) && /▼/.test(await 단추(p)), await 단추(p))
  await ctx.close()
}
{
  console.log('■ 재료 없음(404) · 일반')
  const { ctx, p, 오류 } = await 새쪽(390, 844, true, { 재_: null })
  await 카드열기(p, 을)
  await 금액넣기(p, Math.floor(을.base * 0.905 / 1000) * 1000)
  await p.locator('.jsc .jsm-btn').click()
  const 가 = await 펼침글(p)
  ok('재료 없음 → «모의 개찰 자료(지난 일반 개찰의 업체 금액)를 모으는 중입니다» · 오류 0', /모의 개찰 자료\(지난 일반 개찰의 업체 금액\)를 모으는 중입니다/.test(가.글) && 오류.length === 0, [가.글, 오류])
  await ctx.close()
}
{
  console.log('■ 그 갈래 재료가 5건 안 됨(간이형 — 실제 2건) · 하나도 없음(실적제한 줄만 뺌)')
  const { ctx, p, 오류 } = await 새쪽(390, 844, true)
  await 카드열기(p, 갑)
  await 금액넣기(p, Math.floor(갑.base * 0.85 / 1000) * 1000)
  await p.locator('.jsc .jsm-btn').click()
  const 가 = await 펼침글(p)
  const 간수 = 모의개찰(재료, '간이형', 85).n
  ok(`간이형 재료 ${간수}건(5건 안 됨) → «모으는 중입니다 — 지금 ${간수}건(5건부터 보여 드립니다)» · 요약 · 줄 없음`, 간수 < 5 && 가.글.includes(`지난 간이형 개찰의 업체 금액)를 모으는 중입니다 — 지금 ${간수}건(5건부터 보여 드립니다)`)
    && !(await p.$('.jsc .jsm-sum')) && 오류.length === 0, 가.글)
  await ctx.close()
  const 뺀 = { ...재료, 공고: Object.fromEntries(Object.entries(재료.공고).filter(([, a]) => a[1] !== '실적제한')) }
  const s2 = await 새쪽(390, 844, true, { 재_: 뺀 })
  await 카드열기(s2.p, 병)
  await 금액넣기(s2.p, Math.floor(병.base * 0.85 / 1000) * 1000)
  await s2.p.locator('.jsc .jsm-btn').click()
  const 나 = await 펼침글(s2.p)
  ok('실적제한 재료 없음 → «모으는 중입니다 · 모이면 저절로 뜹니다»(건수 없음) · 다른 갈래 재료를 안 씀', /지난 실적제한 개찰의 업체 금액\)를 모으는 중입니다 · 모이면 저절로 뜹니다/.test(나.글) && s2.오류.length === 0, 나.글)
  await s2.ctx.close()
}
await b.close()
fs.rmSync(임시, { recursive: true, force: true })
console.log(`\n${bad ? '✗' : '✓'} 시험_종심모의화면 ${n - bad}/${n}`)
if (bad) process.exit(1)
