// 💻 G468 PC 연결 — 작업 화면 ↔ «K-적산컨맵 연결» 프로그램(127.0.0.1:47321) 화면 시험 · 가상 예시 도면만
//   화면 빌드를 얹은 뒤  B=http://127.0.0.1:4467 node tools/시험_PC연결화면.mjs [PC|폰|모두]
//   프로그램은 저장소 밖(소장님 PC) — 이 시험은 같은 길(/ping · /folders · /list · /file · /sent · /sentfile · /taken)을 쓰는 «흉내 프로그램» 을 띄움
//   (PCREAL=1 이면 흉내를 안 띄우고 이미 켜 둔 진짜 프로그램에 붙음 — 그때 PCDIR · PCSEND 는 그 프로그램의 폴더 · 보내기 폴더)
//   ① 프로그램을 안 쓴 브라우저는 이 PC 를 찾지 않음(127.0.0.1:4732x 물음 0) ② ?pc=1 → «💻 PC 연결 켜짐» 띠 · 기억
//   ③ 📁 PC 폴더 도면 → 목록(DWG · DXF 2 · 엑셀 1) → 하나 골라 넣기 = 같은 파일을 «📐 도면 넣기» 로 넣은 것과 부재 수 같음
//   ④ 캐드 KCM 보내기(보내기 폴더에 경로 한 줄) → 열린 화면이 3초 안팎에 받아 넣음 · 프로그램 쪽 «받음»
//   ⑤ 새로 열어도(주소에 pc 없이) 다시 붙음 ⑥ 프로그램을 끄면 띠가 내려감 · ?pc=1 인데 꺼져 있으면 알림
//   ⑦ 설명서 «⬇ K-적산컨맵 연결 받기» 주소 · 가로 넘침 없음(320 ~ 1476 · 창 열린 채) · 화면 오류 없음
import { createRequire } from 'module'
import fs from 'fs'
import os from 'os'
import path from 'path'
import http from 'http'
import { 정돈 } from '../web/src/lib/골조모델.js'
const require = createRequire(process.env.PW || '/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const 주소 = process.env.B || 'http://127.0.0.1:4467'
const 기기들 = (process.argv[2] || '모두') === '모두' ? ['PC', '폰'] : [process.argv[2]]
const 진짜 = process.env.PCREAL === '1'
const 예 = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'web', 'public', 'jeoksan')
const 틀 = fs.mkdtempSync(path.join(os.tmpdir(), 'kcm_g468_'))
const 폴더 = process.env.PCDIR || path.join(틀, '도면')
const 보내기 = process.env.PCSEND || path.join(틀, '보내기')
if (!진짜) {
  fs.mkdirSync(path.join(폴더, '하위'), { recursive: true }); fs.mkdirSync(보내기, { recursive: true })
  fs.copyFileSync(path.join(예, 'BIM_예시_3층.dxf'), path.join(폴더, 'BIM_예시_3층.dxf'))
  fs.copyFileSync(path.join(예, 'BIM_예시_3층.dxf'), path.join(폴더, '하위', '둘째.dxf'))
  fs.copyFileSync(path.join(예, '골조예시_내역서.xlsx'), path.join(폴더, '골조예시_내역서.xlsx'))
}
/* 흉내 프로그램(진짜와 같은 길 · 같은 JSON) */
let 흉내 = null, 물음 = 0
const 보낸 = []
let 다음번 = 1
function 흉내켜기() {
  const 목록 = () => { const out = []; const 걷 = (d) => { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const full = path.join(d, f.name); if (f.isDirectory()) 걷(full); else if (/\.(dwg|dxf|xlsx|xls|csv)$/i.test(f.name)) { const st = fs.statSync(full); out.push({ p: path.relative(폴더, full).split(path.sep).join('/'), 이름: f.name, 크기: st.size, 때: Math.floor(st.mtimeMs / 1000) }) } } }; 걷(폴더); return out.sort((a, b) => (a.p < b.p ? -1 : 1)) }
  const 살핌 = setInterval(() => {
    for (const fn of fs.readdirSync(보내기)) {
      if (!/\.txt$/i.test(fn)) continue
      const full = path.join(보내기, fn); const 길 = fs.readFileSync(full, 'utf8').trim().split(/\r?\n/)[0]; fs.unlinkSync(full)
      if (fs.existsSync(길)) 보낸.push({ id: 다음번++, 길, 이름: path.basename(길), 크기: fs.statSync(길).size, 때: Math.floor(Date.now() / 1000), 받음: false })
    }
  }, 500)
  흉내 = http.createServer((q, s) => {
    const o = q.headers.origin
    const 머리 = { 'Cache-Control': 'no-store', ...(o ? { 'Access-Control-Allow-Origin': o, Vary: 'Origin', 'Access-Control-Allow-Headers': 'X-KCM', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Private-Network': 'true', 'Access-Control-Expose-Headers': 'X-KCM-Name' } : {}) }
    if (q.method === 'OPTIONS') { s.writeHead(204, 머리); return s.end() }
    물음++
    const u = new URL(q.url, 'http://x')
    const j = (v, c = 200) => { s.writeHead(c, { ...머리, 'Content-Type': 'application/json; charset=utf-8' }); s.end(JSON.stringify(v)) }
    const 파일 = (full) => { s.writeHead(200, { ...머리, 'Content-Type': 'application/octet-stream', 'X-KCM-Name': encodeURIComponent(path.basename(full)) }); fs.createReadStream(full).pipe(s) }
    if (u.pathname === '/ping') return j({ 이름: 'K-적산컨맵 연결', 판: '1.0', 폴더수: 1, 보낸: 보낸.filter((x) => !x.받음).length })
    if (q.headers['x-kcm'] !== '1') return j({ 오류: 'X-KCM 머리 없음' }, 400)
    if (u.pathname === '/folders') return j([{ 번: 0, 이름: path.basename(폴더), 길: 폴더 }])
    if (u.pathname === '/list') return j(목록())
    if (u.pathname === '/file') { const full = path.join(폴더, ...String(u.searchParams.get('p')).split('/')); return fs.existsSync(full) ? 파일(full) : j({ 오류: '파일 없음' }, 404) }
    if (u.pathname === '/sent') return j(보낸.filter((x) => !x.받음).map(({ 길, ...x }) => x))
    if (u.pathname === '/sentfile') { const x = 보낸.find((y) => y.id === +u.searchParams.get('id')); return x ? 파일(x.길) : j({ 오류: '없음' }, 404) }
    if (u.pathname === '/taken') { for (const x of 보낸) if (x.id === +u.searchParams.get('id')) x.받음 = true; return j({ 됨: true }) }
    j({ 오류: '없는 길' }, 404)
  })
  흉내.살핌 = 살핌
  return new Promise((ok) => 흉내.listen(47321, '127.0.0.1', ok))
}
const 흉내끄기 = () => new Promise((ok) => { if (!흉내) return ok(); clearInterval(흉내.살핌); 흉내.closeAllConnections && 흉내.closeAllConnections(); 흉내.close(() => ok()); 흉내 = null })
const 핑 = () => new Promise((ok) => { const r = http.get('http://127.0.0.1:47321/ping', (s) => { let b = ''; s.on('data', (c) => (b += c)); s.on('end', () => { try { ok(JSON.parse(b)) } catch (e) { ok(null) } }) }); r.on('error', () => ok(null)); r.setTimeout(1500, () => { r.destroy(); ok(null) }) })

let ok = 0, bad = 0
const 브 = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] })
for (const 기기 of 기기들) {
  const 폰 = 기기 === '폰'
  if (!진짜) await 흉내켜기()
  const c = await 브.newContext({ viewport: 폰 ? { width: 390, height: 844 } : { width: 1476, height: 812 }, locale: 'ko-KR', isMobile: 폰, hasTouch: 폰 })
  await c.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|geojs|firebaseio/, (r) => r.fulfill({ status: 200, body: '' }))
  await c.addInitScript(() => { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); try { sessionStorage.setItem('kcm_notice_seen', '2026-10-업체'); sessionStorage.setItem('kcm_visit_s', '1') } catch (e) { /* 막힘 */ } })
  const p = await c.newPage()
  const 오류 = []
  let pc물음 = 0
  p.on('request', (r) => { if (/^http:\/\/127\.0\.0\.1:4732\d\//.test(r.url())) pc물음++ })
  p.on('pageerror', (e) => 오류.push(String(e.stack || e).slice(0, 400)))
  p.on('dialog', (d) => d.accept())
  const 봐 = (cnd, 말, 더 = '') => { if (cnd) ok++; else bad++; console.log(cnd ? '✓' : '✗', 기기, 말, cnd ? '' : String(더).slice(0, 600)) }
  const 누름 = (re) => p.evaluate((s) => { const r = new RegExp(s); const b = [...document.querySelectorAll('button')].find((x) => r.test(x.textContent.trim()) && !x.disabled && x.offsetParent !== null); if (b) { b.click(); return true } return false }, re.source)
  const 쉼 = (ms) => p.waitForTimeout(ms)
  const 모델 = async () => 정돈(await p.evaluate(() => JSON.parse(localStorage.getItem('kcm.model.v1') || 'null')))
  const 띠 = () => p.evaluate(() => (document.querySelector('.gmd-pcbar') || {}).innerText || '')
  const 기다림 = async (f, 초 = 60) => { for (let i = 0; i < 초 * 2; i++) { if (await f()) return true; await 쉼(500) } return false }
  const 다읽음 = () => p.evaluate(() => { const t = document.body.innerText; return /✓ 도면 \d+장 읽음/.test(t) && !/여는 중|바꾸는 중|읽는 중|세우는 중|합치는 중|받는 중/.test(t) })
  /* ① 안 쓴 브라우저 */
  await p.goto(주소 + '/jeoksan/model?ws=1', { waitUntil: 'domcontentloaded' }); await 쉼(3500)
  봐(pc물음 === 0 && !(await 띠()), '프로그램을 안 쓴 브라우저는 이 PC 를 찾지 않음(물음 0 · 띠 없음)', pc물음)
  /* 비교: 같은 파일을 «📐 도면 넣기» 로 */
  const 예도면 = path.join(os.tmpdir(), 'kcm_g468_ex.dxf'); fs.copyFileSync(path.join(폴더, 'BIM_예시_3층.dxf'), 예도면)
  await p.setInputFiles('input.gmd-ws-dwgin', 예도면)
  봐(await 기다림(다읽음, 120), '«📐 도면 넣기» 로 가상 예시 도면을 넣음')
  await 쉼(1500)
  const 기준 = (await 모델()).부재.length
  await 누름(/^✕ 나가기$/); await 쉼(300)
  /* ② ?pc=1 */
  await p.evaluate(() => { localStorage.removeItem('kcm.model.v1') })
  await p.goto(주소 + '/jeoksan/model?ws=1&pc=1', { waitUntil: 'domcontentloaded' }); await 쉼(4000)
  let g = await 띠()
  봐(/PC 연결 켜짐/.test(g) && /폴더 1곳/.test(g), '?pc=1 → «💻 PC 연결 켜짐 · 폴더 1곳» 띠', g)
  봐(await p.evaluate(() => !!localStorage.getItem('kcm.pc.v1')), '이 브라우저가 프로그램을 기억(kcm.pc.v1)')
  /* ③ PC 폴더 도면 */
  봐(await 누름(/^📁 PC 폴더 도면$/), '📁 PC 폴더 도면'); await 쉼(1500)
  const 칩 = await p.evaluate(() => [...document.querySelectorAll('.gmd-pc-kinds .gmd-gs-chip')].map((b) => b.textContent.trim()))
  봐(칩.join('|') === 'DWG · DXF 2|일람표 · 엑셀 1', '목록 — DWG · DXF 2 · 엑셀 1', 칩)
  const 줄 = await p.evaluate(() => [...document.querySelectorAll('.gmd-pc-file .gmd-pc-name')].map((x) => x.textContent))
  봐(줄.join('|') === 'BIM_예시_3층.dxf|하위/둘째.dxf', '하위 폴더까지(BIM_예시_3층.dxf · 하위/둘째.dxf)', 줄)
  if (폰) await p.screenshot({ path: path.join(틀, '폰_PC폴더창.png') })
  봐(await p.evaluate(() => [...document.querySelectorAll('.gmd-pc-file')].every((l) => { const c = l.querySelector('input').getBoundingClientRect(), n = l.querySelector('.gmd-pc-name').getBoundingClientRect(); return Math.abs((c.top + c.bottom) / 2 - (n.top + n.bottom) / 2) < 14 && c.right <= n.left + 1 })), '줄마다 ☑ 가 이름 바로 왼쪽(같은 줄)')
  await p.evaluate(() => document.querySelector('.gmd-pc-file input').click()); await 쉼(400)
  봐(await 누름(/^📐 넣기 — 1장/), '📐 넣기 — 1장')
  봐(await 기다림(다읽음, 120), 'PC 폴더에서 넣은 도면을 읽음')
  await 쉼(1500)
  const 넣은 = (await 모델()).부재.length
  봐(넣은 > 30 && 넣은 === 기준, 'PC 폴더로 넣은 부재 ' + 넣은 + ' = «📐 도면 넣기» ' + 기준, [넣은, 기준])
  if (!폰) await p.screenshot({ path: path.join(틀, 'PC_PC연결띠.png') })
  /* ④ 캐드 KCM 보내기 */
  fs.writeFileSync(path.join(보내기, 'kcm_' + Date.now() + '.txt'), path.join(폴더, '하위', '둘째.dxf') + '\r\n')
  봐(await 기다림(() => p.evaluate(() => !!document.querySelector('.gmd-askbox')), 60), '보낸 도면을 받아 읽은 뒤 «지금 모델 대신 도면에서 세울까요?» 물음(모델이 있으니)')
  봐(await 누름(/^예, 바꾸기$/), '예, 바꾸기')
  봐(await 기다림(async () => /캐드에서 보낸 «둘째\.dxf»/.test(await p.evaluate(() => document.body.innerText)) && await 다읽음(), 60), '캐드 KCM 으로 보낸 «둘째.dxf» 를 열린 화면이 받아 넣음')
  const 남 = await 핑()
  봐(남 && 남.보낸 === 0, '프로그램 쪽 보낸 것 모두 «받음»', 남)
  /* ⑤ 다시 열기(pc 없이) */
  await p.goto(주소 + '/jeoksan/model?ws=1', { waitUntil: 'domcontentloaded' }); await 쉼(4000)
  봐(/PC 연결 켜짐/.test(await 띠()), '새로 열어도(주소에 pc 없이) 다시 붙음')
  /* ⑦ 넘침 */
  for (const w of 폰 ? [320, 360, 390] : [860, 1280, 1476]) {
    await p.setViewportSize({ width: w, height: 812 }); await 쉼(600)
    let r = await p.evaluate(() => ({ 넘: document.documentElement.scrollWidth - innerWidth, 띠: (() => { const b = document.querySelector('.gmd-pcbar'); return b ? b.getBoundingClientRect().right - innerWidth : 0 })() }))
    봐(r.넘 <= 1 && r.띠 <= 1, w + ' px — 띠 넘침 없음', JSON.stringify(r))
    await 누름(/^📁 PC 폴더 도면$/); await 쉼(1200)
    r = await p.evaluate(() => { const b = document.querySelector('.gmd-pcbox'); const q = b && b.getBoundingClientRect(); return { 넘: document.documentElement.scrollWidth - innerWidth, 창: q ? Math.round(q.left) + '~' + Math.round(q.right) : null, 안: q ? q.left >= -1 && q.right <= innerWidth + 1 : false } })
    봐(r.넘 <= 1 && r.안, w + ' px — PC 폴더 창 화면 안', JSON.stringify(r))
    await 누름(/^닫기$/); await 쉼(300)
  }
  await p.setViewportSize(폰 ? { width: 390, height: 844 } : { width: 1476, height: 812 })
  /* ⑦ 설명서 받기 주소 */
  await 누름(/📘 설명서/); await 쉼(1000)
  const 받기 = await p.evaluate(() => { const a = document.querySelector('a.gmd-pc-dl'); return a ? [a.getAttribute('href'), a.getAttribute('download')] : null })
  봐(받기 && /^\/pc\/K-conmap-link-[\d.]+\.zip$/.test(받기[0]) && /\.zip$/.test(받기[1]), '설명서 «⬇ K-적산컨맵 연결 받기» — ' + (받기 && 받기[0]), 받기)
  await p.keyboard.press('Escape'); await 쉼(400)
  /* ⑥ 끄기 */
  if (!진짜) {
    await 흉내끄기()
    봐(await 기다림(async () => !(await 띠()), 15), '프로그램을 끄면 띠가 내려감')
    await p.goto(주소 + '/jeoksan/model?ws=1&pc=1', { waitUntil: 'domcontentloaded' }); await 쉼(5000)
    봐(/K-적산컨맵 연결 프로그램을 찾지 못했습니다/.test(await p.evaluate(() => document.body.innerText)), '?pc=1 인데 꺼져 있으면 «찾지 못했습니다» 알림')
  }
  봐(!오류.length, '화면 오류 없음', 오류.join(' | '))
  await c.close()
}
await 흉내끄기()
console.log(`\n💻 PC 연결 화면 · ${ok} 맞음 · ${bad} 틀림 · ${틀}`)
await 브.close()
process.exit(bad ? 1 : 0)
