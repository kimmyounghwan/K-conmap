/**
 * 🤝 G518 하도급 견적틀 화면 시험 — 구운 사이트(dist)를 띄운 뒤: node tools/시험_견적틀화면.mjs [주소=http://127.0.0.1:4997]
 *   ① 1순위 카드(가상 개찰 자료) → «🤝 하도급 견적틀» 단추 → 주소에 공고번호 · 공사명 · 발주처 · 1순위만 실림 → 화면 «1순위 공고에서 왔습니다»
 *   ② 🧪 예시 내역서 → 공종 7(관급 꺼짐) · 🧱 표시 · 미리보기 · ▸ 나누기 · 표지 칸
 *   ③ 받기 — 한 파일(공종 목록 + 시트마다) · zip(공종마다) — 받은 파일을 다시 열어 봄 · 수식 0 · 단가 빈칸
 *   ④ 파일 올리기(input) · 내역이 아닌 엑셀은 까닭 · 폰 390 · 320 · 어두운 화면 넘침 0 · 오류 0 · 구운 장 · 내역서 탭 카드
 * 가상 자료만 씀 · 인터넷 안 부름(파이어베이스 · 광고 · 애널리틱스 막음).
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const 열기 = (p) => import(pathToFileURL(path.join(ROOT, p)).href)   // 🪟 file:// 주소로(Windows)
const Q = await 열기('web/src/lib/qtoxlsx.js')
const { unzipSync, strFromU8 } = await 열기('web/node_modules/fflate/esm/index.mjs')
const BASE = process.argv[2] || 'http://127.0.0.1:4997'
const CAP = process.env.CAP || ''

let bad = 0, n = 0
const ok = (이름, c, got) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (c || got === undefined ? '' : ' = ' + JSON.stringify(got).slice(0, 300))) }
const meta = { built: '2026-11-03 06:00', chunk: 500, rankChunk: 50, con: { n: 2, parts: 1, from: '2026-11-02', to: '2026-11-02' }, serv: { n: 0, parts: 0 } }
const 줄 = (o) => ({ ord: '000', inst: '가상군', dt: '2026-11-02 11:00:00', amt: 523456000, rate: 89.912, np: 37, base: 583000000, sAmt: 0, lo: -3, hi: 3, ...o })
const rows = [줄({ no: 'R00TEST00001', name: '가상 소하천 정비공사', win: '(주)가상건설', bno: '1238112345', ceo: '홍길동', tel: '02-123-4567', adr: '가상시 가상로 1' })]
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hgj-'))
const b = await chromium.launch()

async function 새쪽(w = 1280, h = 900, dark = false) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: CAP ? 2 : 1, colorScheme: dark ? 'dark' : 'light', acceptDownloads: true })
  const p = await ctx.newPage()
  const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e).slice(0, 160)))
  p.on('console', (m) => { if (m.type() === 'error' && !/net::ERR|Failed to load resource|firebase|google/i.test(m.text())) 오류.push(m.text().slice(0, 160)) })
  await p.route('**/data/board/first.json*', (r) => r.fulfill({ json: meta }))
  await p.route('**/data/board/first-con-0.json*', (r) => r.fulfill({ json: rows }))
  await p.route(/firebaseio|googletagmanager|google-analytics|pagead|googlesyndication|geojs/, (r) => r.abort())
  /* 받은 파일 이름 — 이 시험 상자의 헤드리스 크롬은 한글 이름을 «download» 로 바꿔 내놓아(실제 브라우저는 그대로) 단추가 붙인 이름을 따로 적어 둠 */
  await p.addInitScript(() => { const c = HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click = function () { if (this.download) (window.__받은이름 = window.__받은이름 || []).push(this.download); return c.call(this) } })
  return { ctx, p, 오류 }
}
const 넘침 = (p) => p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
const 받기 = async (p, sel) => {
  const [d] = await Promise.all([p.waitForEvent('download', { timeout: 15000 }), p.click(sel)])
  const f = path.join(tmp, d.suggestedFilename())
  await d.saveAs(f)
  const 이름 = (await p.evaluate(() => (window.__받은이름 || []).slice(-1)[0])) || d.suggestedFilename()
  return { 이름, 바이트: new Uint8Array(fs.readFileSync(f)) }
}

console.log('① 1순위 카드 → 하도급 견적틀')
{
  const { ctx, p, 오류 } = await 새쪽(390, 844)
  await p.goto(BASE + '/first', { waitUntil: 'networkidle' })
  await p.waitForSelector('.notice', { timeout: 15000 })
  await p.click('.notice h3')
  await p.waitForSelector('.nd-hgj', { timeout: 8000 })
  const href = await p.getAttribute('.nd-hgj', 'href')
  const q = new URLSearchParams(href.split('?')[1] || '')
  ok('카드 단추 주소 — /first/hado-gyeonjeok · no · n · i · w · d 만(전화 · 주소 · 대표 · 사업자번호 없음)', href.startsWith('/first/hado-gyeonjeok?') && q.get('no') === 'R00TEST00001' && q.get('n') === '가상 소하천 정비공사' && q.get('i') === '가상군' && q.get('w') === '(주)가상건설' && q.get('d') === '2026-11-02' && !/02-123|가상로|홍길동|1238112345/.test(decodeURIComponent(href)), href)
  if (CAP) await p.locator('.nd-hgj').screenshot({ path: path.join(CAP, '견적틀_1순위카드단추.png') })
  await p.click('.nd-hgj')
  await p.waitForSelector('.hgj-from', { timeout: 15000 })
  const 글 = await p.innerText('.hgj-from')
  ok('화면 «1순위 공고에서 왔습니다» — 공사명 · 발주처 · 1순위 · 개찰일 · 나라장터 원문 단추', /가상 소하천 정비공사/.test(글) && /가상군/.test(글) && /\(주\)가상건설/.test(글) && /2026-11-02/.test(글) && /나라장터 공고 원문 열기/.test(글), 글)
  ok('1순위 탭에 불(/first/…)', await p.evaluate(() => [...document.querySelectorAll('a.on, .on a, nav a[aria-current="page"]')].some((a) => /1순위/.test(a.textContent || ''))))
  if (CAP) await p.screenshot({ path: path.join(CAP, '견적틀_1순위에서온화면_폰.png'), fullPage: false })
  ok('오류 0(카드 → 화면)', !오류.length, 오류)
  await ctx.close()
}

console.log('② 예시 · ③ 받기')
{
  const { ctx, p, 오류 } = await 새쪽(1280, 900)
  await p.goto(BASE + '/first/hado-gyeonjeok?no=R00TEST00001&n=' + encodeURIComponent('가상 소하천 정비공사') + '&i=' + encodeURIComponent('가상군') + '&w=' + encodeURIComponent('(주)가상건설') + '&d=2026-11-02', { waitUntil: 'networkidle' })
  await p.click('.hgj-ex')
  await p.waitForSelector('.hgj-row', { timeout: 15000 })
  const 줄들 = await p.$$eval('.hgj-row', (xs) => xs.map((x) => ({ 이름: x.querySelector('.tlchk b')?.textContent, 켬: x.querySelector('input').checked, 글: x.innerText.replace(/\s+/g, ' ') })))
  ok('공종 7 — 토공 · 강관 압입공 · 구조물공 · 비탈면 녹화 · 포장공 · 부대공 · 관급자재대', 줄들.map((x) => x.이름).join() === '토공,강관 압입공,구조물공,비탈면 녹화,포장공,부대공,관급자재대', 줄들.map((x) => x.이름))
  ok('관급자재대만 꺼짐(«관급 — 견적 대상 아님»)', 줄들.filter((x) => !x.켬).map((x) => x.이름).join() === '관급자재대' && /관급 — 견적 대상 아님/.test(줄들[6].글))
  ok('🧱 압입 · 비탈면 녹화 · 포장 표시', /🧱 압입 · 추진/.test(줄들[1].글) && /🧱 비탈면 녹화/.test(줄들[3].글) && /🧱 포장/.test(줄들[4].글), 줄들.map((x) => x.글))
  const 요약 = await p.innerText('.hgj-sum')
  ok('요약 «공종 7개 · 품목 24줄»', /공종 7개/.test(요약) && /품목 24줄/.test(요약), 요약)
  const 표지값 = await p.$$eval('.hgj-form input', (xs) => xs.map((x) => x.value))
  ok('표지 칸에 주소 값(수신 · 공사명 · 발주처 · 공고번호)', 표지값.join('|') === '(주)가상건설|가상 소하천 정비공사|가상군|R00TEST00001', 표지값)
  await p.click('.hgj-row:nth-child(2) .hgj-mini:last-child')
  await p.waitForSelector('.hgj-pre table', { timeout: 5000 })
  const 미리 = await p.$$eval('.hgj-pre tbody tr', (xs) => xs.map((x) => x.innerText.replace(/\s+/g, ' ').trim()))
  ok('미리보기 — 강관 압입 추진 D800 24 m … (단가 칸 빈칸)', 미리.length === 4 && /^강관 압입 추진 D800, L=24m m 24/.test(미리[0]), 미리)
  if (CAP) await p.screenshot({ path: path.join(CAP, '견적틀_목록_PC.png'), fullPage: true })
  await p.click('.hgj-row:nth-child(1) button.hgj-mini:first-of-type')
  const 나눈 = await p.$$eval('.hgj-row .tlchk b', (xs) => xs.map((x) => x.textContent))
  ok('▸ 나누기 — 토공 → 터파기 및 되메우기 · 비탈면 정리', 나눈.slice(0, 2).join() === '터파기 및 되메우기,비탈면 정리' && 나눈.length === 8, 나눈)
  const 한 = await 받기(p, '.hgj-btns .btn.primary')
  const 책 = Q.readWorkbook(한.바이트)
  ok('한 파일 받기 — «하도급견적틀_가상_소하천_정비공사.xlsx» · 공종 목록 + 7장', /^하도급견적틀_가상_소하천_정비공사\.xlsx$/.test(한.이름) && Object.keys(책).join() === '공종 목록,터파기 및 되메우기,비탈면 정리,강관 압입공,구조물공,비탈면 녹화,포장공,부대공', [한.이름, Object.keys(책)])
  const z = unzipSync(한.바이트)
  ok('수식 0', Object.keys(z).filter((k) => /worksheets\/sheet/.test(k)).every((k) => !/<f>/.test(strFromU8(z[k]))))
  const 압 = 책['강관 압입공'].map((r) => (r || []).map((v) => String(v ?? '')))
  ok('강관 압입공 시트 — 수신 «(주)가상건설 귀중» · 품목 4줄 · 단가 빈칸', 압.some((r) => r.includes('(주)가상건설  귀중')) && 압.filter((r) => /^\d+$/.test(r[0]) && r[1]).length === 4 && 압.filter((r) => /^\d+$/.test(r[0]) && r[1]).every((r) => r.slice(5, 13).every((v) => v === '')))
  const 묶 = await 받기(p, '.hgj-btns .btn.ghost')
  const zz = unzipSync(묶.바이트)
  ok('zip 받기 — 공종마다 엑셀 7개 · 다 열림', /\.zip$/.test(묶.이름) && Object.keys(zz).length === 7 && Object.keys(zz).every((f) => Object.keys(Q.readWorkbook(zz[f])).length === 1), Object.keys(zz))
  ok('받은 뒤 안내 글', /받았습니다/.test(await p.innerText('.hgj-btns + .note')))
  ok('오류 0(예시 · 받기)', !오류.length, 오류)
  await ctx.close()
}

console.log('④ 올리기 · 폰 · 어두운 화면 · 구운 장')
{
  const { ctx, p, 오류 } = await 새쪽(390, 844, true)
  await p.goto(BASE + '/first/hado-gyeonjeok', { waitUntil: 'networkidle' })
  ok('1순위에서 안 왔으면 «왔습니다» 상자 없음', !(await p.$('.hgj-from')))
  await p.setInputFiles('.tldrop input[type=file]', path.join(ROOT, 'web/public/tools/files/ex-hado-gyeonjeok.xlsx'))
  await p.waitForSelector('.hgj-row', { timeout: 15000 })
  ok('파일 올리기 → 공종 7', (await p.$$('.hgj-row')).length === 7)
  ok('폰 390 어두운 화면 넘침 0', (await 넘침(p)) <= 0, await 넘침(p))
  if (CAP) { await p.screenshot({ path: path.join(CAP, '견적틀_폰390_어둠.png'), fullPage: true }) }
  const 아님 = path.join(tmp, 'wonga_only.xlsx')   // 이 시험 상자의 헤드리스 크롬은 한글 이름 파일을 못 올림(실제 브라우저는 됨)
  fs.writeFileSync(아님, Q.writeWorkbook([{ name: '원가계산서', head: ['비목', '금액'], rows: [['직접재료비', 1000]] }]))
  await p.setInputFiles('.tldrop input[type=file]', 아님)
  await p.waitForSelector('.cwarn', { timeout: 10000 })
  ok('내역이 아닌 엑셀 — 까닭(«품명 · 규격 · 단위 · 수량» 칸)', /품명 · 규격 · 단위 · 수량/.test(await p.innerText('.cwarn')))
  await p.setViewportSize({ width: 320, height: 700 })
  await p.click('.hgj-ex')
  await p.waitForSelector('.hgj-row', { timeout: 15000 })
  await p.click('.hgj-row:nth-child(2) .hgj-mini:last-child')
  ok('폰 320 넘침 0(미리보기 연 채)', (await 넘침(p)) <= 0, await 넘침(p))
  if (CAP) await p.screenshot({ path: path.join(CAP, '견적틀_폰320_미리보기.png'), fullPage: true })
  ok('오류 0(폰)', !오류.length, 오류)
  const r = await p.request.get(BASE + '/first/hado-gyeonjeok.html')
  const h = await r.text()
  ok('구운 장 — 제목 · 설명 · FAQ 구조화 자료', r.ok() && /<title>하도급 견적틀 — 내역서를 공종별 견적서로/.test(h) && /"FAQPage"/.test(h) && /공내역서/.test(h))
  await p.goto(BASE + '/naeyeok', { waitUntil: 'networkidle' })
  ok('내역서 탭 — 하도급 칸에 «하도급 견적틀» 카드', await p.evaluate(() => [...document.querySelectorAll('a')].some((a) => a.getAttribute('href') === '/first/hado-gyeonjeok' && /하도급 견적틀/.test(a.textContent))))
  await ctx.close()
}

await b.close()
console.log(`\n${bad ? '✗' : '✓'} 시험_견적틀화면 ${n - bad}/${n}`)
process.exit(bad ? 1 : 0)
