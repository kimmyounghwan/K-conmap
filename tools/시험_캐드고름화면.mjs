// 📏 G685 작업 화면 «📏 캐드» 탭 화면 시험 — 캐드 KCMS → K-적산컨맵 연결 프로그램 → 작업 화면(가상 도면 · 흉내 프로그램)
//   화면 빌드를 얹은 뒤  B=http://127.0.0.1:4708 node tools/시험_캐드고름화면.mjs [PC|폰|모두]
//   보내는 csv 는 tools/시험_캐드고름리습.py --csv 가 kcm.lsp 를 흉내 해석기로 «실제로 돌려» 쓴 것(CP949 · 옛 캐드 꼴)
//   ① 손님(소장님 브라우저 아님): 📏 캐드 탭 없음 · KCMS 글을 보내도 줄 · 저장 · «도면 넣기» 없음(받음만)
//   ② 소장님: 탭 · 빈 화면 안내 · 🧪 예시 · 무리 한꺼번에(갈래 · 높이) · ⚠ 치수 고르기 · ❓ 보기 · 3D 그림
//   ③ 열린 화면이 KCMS 를 받음 → 줄 · 합 = lib 셈 · 두 번 보내면 «이미 받은 객체» · 단위 없는 도면 → 단위 고르기
//   ④ 새로 열어도 남음 · ✕ 묶음 빼기 → ↶ 되돌리기 · 📊 엑셀(받기 전 검사 통과 · 시트 셋) · 💾 모델 파일에 캐드 고름
//   ⑤ 넘침 없음(폰 320 ~ 520 아홉 폭 / PC 521 ~ 1476 아홉 폭 · G685b) · 탭 줄 안에 «📏 캐드»(글꼴이 10 % 넓어도) · 폰 입력 칸 16px · 화면 오류 없음
//   ⑥ G686 캐드 폴더(PC — OPFS 로 흉내): .txt 있는 csv 만 읽고 지움 · 사이트 안 쪽 옮겨도 이어짐 · 새로 열면 다시 잇기(손잡이 저장 안 함 —
//      이 시험 창은 시크릿 꼴이라 예전 판(IndexedDB 손잡이)은 여기서 브라우저가 통째로 꺼졌음) · 폴더 읽기 없는 브라우저 안내
//   ⑦ G686 캐드 → 골조 모델 부재: 적요 «1층 기둥 C9» · «2층 보 G9» → 부재 · 부호 · 층(보 «2층 바닥 · 1층») · 🧱 세우기 → 세우기 탭 · 물량 부호별 · 캐드 합에서 빠짐 ·
//      레이어 이름 🟨 제안 · 📑 내역 대조 캐드 물량(내역 줄 고르기) · ↶ 되돌리면 다시 셈
import { createRequire } from 'module'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'
import http from 'http'
import * as L from '../web/src/lib/캐드고름.js'
import { 엑셀읽기 } from '../web/src/lib/엑셀읽기.js'
const require = createRequire(process.env.PW || '/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const 주소 = process.env.B || 'http://127.0.0.1:4708'
const 기기들 = (process.argv[2] || '모두') === '모두' ? ['PC', '폰'] : [process.argv[2]]
const 뿌리 = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const 틀 = fs.mkdtempSync(path.join(os.tmpdir(), 'kcm_g685_'))
const 보내기 = path.join(틀, '보내기')
fs.mkdirSync(보내기, { recursive: true })
const 리습csv = (이름, 단위 = 4, 날 = 2461359.5) => { const out = path.join(보내기, 이름); execFileSync('python3', [path.join(뿌리, 'tools', '시험_캐드고름리습.py'), '--csv', out, '--단위', String(단위), '--날', String(날)]); return out }
const 보냄 = (csv) => fs.writeFileSync(path.join(보내기, path.basename(csv).replace(/\.csv$/, '.txt')), csv + '\r\n')
/* lib 셈(답) */
const 답 = (() => { const 읽 = L.고름읽기(L.글풀기(fs.readFileSync(리습csv('kcms_101.csv')))); const r = L.줄만들기(읽, { 이름: 'kcms_101.csv' }); return { 줄: r.줄.length, 합: L.캐드셈({ 묶음: [r.묶음], 줄: r.줄 }).합 } })()

/* 흉내 프로그램(진짜와 같은 길 · 같은 JSON — 시험_PC연결화면 꼴) */
let 흉내 = null
const 보낸 = []
let 다음번 = 1
function 흉내켜기() {
  const 살핌 = setInterval(() => {
    for (const fn of fs.readdirSync(보내기)) {
      if (!/\.txt$/i.test(fn)) continue
      const full = path.join(보내기, fn); const 길 = fs.readFileSync(full, 'utf8').trim().split(/\r?\n/)[0]; fs.unlinkSync(full)
      if (fs.existsSync(길)) 보낸.push({ id: 다음번++, 길, 이름: path.basename(길), 크기: fs.statSync(길).size, 때: Math.floor(Date.now() / 1000), 받음: false })
    }
  }, 400)
  흉내 = http.createServer((q, s) => {
    const o = q.headers.origin
    const 머리 = { 'Cache-Control': 'no-store', ...(o ? { 'Access-Control-Allow-Origin': o, Vary: 'Origin', 'Access-Control-Allow-Headers': 'X-KCM', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Private-Network': 'true', 'Access-Control-Expose-Headers': 'X-KCM-Name' } : {}) }
    if (q.method === 'OPTIONS') { s.writeHead(204, 머리); return s.end() }
    const u = new URL(q.url, 'http://x')
    const j = (v, c = 200) => { s.writeHead(c, { ...머리, 'Content-Type': 'application/json; charset=utf-8' }); s.end(JSON.stringify(v)) }
    if (u.pathname === '/ping') return j({ 이름: 'K-적산컨맵 연결', 판: '1.0', 폴더수: 0, 보낸: 보낸.filter((x) => !x.받음).length })
    if (q.headers['x-kcm'] !== '1') return j({ 오류: 'X-KCM 머리 없음' }, 400)
    if (u.pathname === '/folders') return j([])
    if (u.pathname === '/sent') return j(보낸.filter((x) => !x.받음).map(({ 길, ...x }) => x))
    if (u.pathname === '/sentfile') { const x = 보낸.find((y) => y.id === +u.searchParams.get('id')); if (!x) return j({ 오류: '없음' }, 404); s.writeHead(200, { ...머리, 'Content-Type': 'application/octet-stream', 'X-KCM-Name': encodeURIComponent(x.이름) }); return fs.createReadStream(x.길).pipe(s) }
    if (u.pathname === '/taken') { for (const x of 보낸) if (x.id === +u.searchParams.get('id')) x.받음 = true; return j({ 됨: true }) }
    j({ 오류: '없는 길' }, 404)
  })
  흉내.살핌 = 살핌
  return new Promise((ok) => 흉내.listen(47321, '127.0.0.1', ok))
}
const 흉내끄기 = () => new Promise((ok) => { if (!흉내) return ok(); clearInterval(흉내.살핌); 흉내.closeAllConnections && 흉내.closeAllConnections(); 흉내.close(() => ok()); 흉내 = null })

let ok = 0, bad = 0
const 브 = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] })
await 흉내켜기()
for (const 기기 of 기기들) {
  const 폰 = 기기 === '폰'
  const 창 = 폰 ? { width: 390, height: 844 } : { width: 1476, height: 812 }
  const 새쪽 = async (운영자) => {
    const c = await 브.newContext({ viewport: 창, locale: 'ko-KR', isMobile: 폰, hasTouch: 폰, acceptDownloads: true })
    await c.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|geojs|firebaseio|kakaocdn|coupang/, (r) => r.fulfill({ status: 200, body: '' }))
    await c.addInitScript((op) => {
      localStorage.setItem('kcm_notice_seen', '2026-10-필독')
      if (op) localStorage.setItem('kcm_op', '1')
      const 원click = HTMLAnchorElement.prototype.click
      HTMLAnchorElement.prototype.click = function () { (window.__받은이름 = window.__받은이름 || []).push(this.download || ''); return 원click.call(this) }
      try { sessionStorage.setItem('kcm_notice_seen', '2026-10-업체'); sessionStorage.setItem('kcm_visit_s', '1') } catch (e) { /* 막힘 */ }
    }, 운영자)
    const p = await c.newPage()
    p.오류 = []
    p.on('pageerror', (e) => p.오류.push(String(e.stack || e).slice(0, 400)))
    p.on('dialog', (d) => d.accept())
    return { c, p }
  }
  const 봐 = (cnd, 말, 더 = '') => { if (cnd) ok++; else bad++; console.log(cnd ? '✓' : '✗', 기기, 말, cnd ? '' : String(더).slice(0, 700)) }
  const 쉼 = (p, ms) => p.waitForTimeout(ms)
  const 누름 = (p, re) => p.evaluate((s) => { const r = new RegExp(s); const b = [...document.querySelectorAll('button')].find((x) => r.test(x.textContent.trim()) && !x.disabled && x.offsetParent !== null); if (b) { b.click(); return true } return false }, re.source)
  const 기다림 = async (p, f, 초 = 30) => { for (let i = 0; i < 초 * 2; i++) { if (await f()) return true; await 쉼(p, 500) } return false }
  const 글 = (p) => p.evaluate(() => document.body.innerText)
  const 탭들 = (p) => p.evaluate(() => [...document.querySelectorAll('.gmd-ws-tabs .gmd-tab')].map((b) => b.textContent.trim()))
  const 머리합 = (p) => p.evaluate(() => (document.querySelector('.kcs-head .kcs-sum') || {}).textContent || '')
  const 합글 = (합) => ['m', '㎡', '㎥', '개'].filter((u) => 합[u] !== undefined).map((u) => 합[u].toLocaleString('ko-KR', { maximumFractionDigits: 3 }) + ' ' + u).join(' · ')   // 화면과 같은 차례

  /* ① 손님(소장님 표식 없음) — 🧪 G686 시험판: 모든 이용자에게 «📏 캐드» 탭 · 시험판 딱지 · 리습 받기 · 프로그램 길로 보낸 것도 받음 */
  {
    const { c, p } = await 새쪽(false)
    await p.goto(주소 + '/jeoksan/model?ws=1&pc=1', { waitUntil: 'domcontentloaded' }); await 쉼(p, 3500)
    const t = await 탭들(p)
    봐(t.length === 7 && t[6] === '📏 캐드', '손님 — 탭 일곱째 «📏 캐드»(G686 시험판 — 모든 이용자)', t)
    await 누름(p, /^📏 캐드$/); await 쉼(p, 1500)
    const 빈 = await p.evaluate(() => ({ 딱지: (document.querySelector('.kcs-empty .kcs-beta') || {}).textContent || '', 리습: (document.querySelector('.kcs-folder a[download]') || {}).getAttribute ? document.querySelector('.kcs-folder a[download]').getAttribute('href') + '|' + document.querySelector('.kcs-folder a[download]').getAttribute('download') : '', 잇기: [...document.querySelectorAll('.kcs-folder button')].map((b) => b.textContent.trim()).join(','), 글: document.querySelector('.kcs-empty').innerText }))
    봐(빈.딱지 === '시험판' && 빈.리습 === '/tools/files/kcm.lsp|kcm.lsp' && /📂 캐드 폴더 잇기/.test(빈.잇기) && /다운로드 → K-conmap/.test(빈.글) && /보안 경고가 뜨면 로드/.test(빈.글) && !/연결<\/b> 프로그램을 켜 둡니다/.test(빈.글), '손님 빈 화면 — 시험판 딱지 · 📥 리습 받기(/tools/files/kcm.lsp) · 📂 캐드 폴더 잇기 · 다운로드 → K-conmap · 보안 경고 «로드»', JSON.stringify(빈).slice(0, 400))
    const 리습 = await p.evaluate(async () => { const r = await fetch('/tools/files/kcm.lsp'); const b = new Uint8Array(await r.arrayBuffer()); return { s: r.status, n: b.length, 글: new TextDecoder('euc-kr').decode(b).slice(0, 80) } })
    봐(리습.s === 200 && 리습.n > 9000 && /K-적산컨맵 연결 1\.2/.test(리습.글), '📥 리습 파일 받아짐(200 · CP949 · 1.2 판)', JSON.stringify(리습))
    const n0 = 보낸.length
    보냄(리습csv('kcms_' + (폰 ? 202 : 201) + '.csv'))
    봐(await 기다림(p, async () => 보낸.length > n0 && 보낸.every((x) => x.받음), 20), '손님 — 프로그램 길로 보낸 KCMS 도 받음(프로그램 쪽 «받음»)', 보낸.length)
    봐(await 기다림(p, async () => /\d+줄/.test(await 머리합(p)), 15), '손님 — 줄로 들어옴(📏 캐드 탭)', await 머리합(p))
    봐(await 기다림(p, async () => !!(await p.evaluate(() => localStorage.getItem('kcm.cad.v1'))), 6), '손님 — 이 브라우저에 저장(kcm.cad.v1)')
    봐(!p.오류.length, '손님 — 화면 오류 없음', p.오류.join(' | '))
    await c.close()
  }

  /* ② 소장님 */
  const { c, p } = await 새쪽(true)
  await p.goto(주소 + '/jeoksan/model?ws=1&pc=1', { waitUntil: 'domcontentloaded' }); await 쉼(p, 3500)
  let t = await 탭들(p)
  봐(t.length === 7 && t[6] === '📏 캐드', '소장님 — 탭 일곱째 «📏 캐드»(손님과 같음)', t)
  await 누름(p, /^📏 캐드$/); await 쉼(p, 1500)
  봐(/캐드에서 명령 KCMS 를 치고/.test(await 글(p)) && /APPLOAD/.test(await 글(p)), '빈 화면 — 쓰는 법(리습 받기 · APPLOAD · 캐드 폴더 잇기 · KCMS) 안내')
  봐(await 누름(p, /예시\(가상 평면\)로 해 보기/), '🧪 예시(가상 평면)로 해 보기')
  await 쉼(p, 1500)
  let 합 = await 머리합(p)
  봐(/16줄/.test(합) && /53\.212 m/.test(합) && /75\.566 ㎡/.test(합) && /5 개/.test(합), '예시 — 16줄 · 53.212 m · 75.566 ㎡ · 5 개', 합)
  봐(/치수 글과 그려진 길이가 다른 줄 1/.test(await 글(p)), '검사 — ⚠ 치수 다른 줄 1')
  /* 무리 한꺼번에 — 외벽 레이어: 길이 × 높이 2.8 */
  const 외벽 = async (f) => p.evaluate(f)
  await 외벽(() => {
    const g = [...document.querySelectorAll('.kcs-group')].find((x) => /레이어 외벽/.test(x.querySelector('.kcs-gname').textContent))
    const s = g.querySelector('.kcs-gedit select.kcs-kind')
    const set = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set
    set.call(s, '길이높이'); s.dispatchEvent(new Event('change', { bubbles: true }))
  })
  await 쉼(p, 600)
  let 외벽글 = await 외벽(() => [...document.querySelectorAll('.kcs-group')].find((x) => /레이어 외벽/.test(x.querySelector('.kcs-gname').textContent)).querySelector('.kcs-gsum').textContent)
  봐(/❓ 4/.test(외벽글), '외벽 무리 «길이 × 높이» 로 — 높이 빈칸 4줄 ❓(짐작 안 함)', 외벽글)
  await 외벽(() => {
    const g = [...document.querySelectorAll('.kcs-group')].find((x) => /레이어 외벽/.test(x.querySelector('.kcs-gname').textContent))
    const i = [...g.querySelectorAll('.kcs-gedit input')].find((x) => /높이/.test(x.getAttribute('aria-label')))
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
    set.call(i, '2.8'); i.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await 쉼(p, 600)
  외벽글 = await 외벽(() => [...document.querySelectorAll('.kcs-group')].find((x) => /레이어 외벽/.test(x.querySelector('.kcs-gname').textContent)).querySelector('.kcs-gsum').textContent)
  봐(/^98 ㎡$/.test(외벽글.trim()), '외벽 무리 높이 2.8 → 35 m × 2.8 = 98 ㎡', 외벽글)
  /* ⚠ 치수 */
  봐(await 누름(p, /^⚠ 줄만 보기$/), '⚠ 줄만 보기'); await 쉼(p, 500)
  const 보인줄 = await p.evaluate(() => document.querySelectorAll('.kcs-row').length)
  봐(보인줄 === 1 && /7,400/.test(await p.evaluate(() => document.querySelector('.kcs-row').innerText)), '⚠ 보기 — 치수 다른 줄 하나(«7,400» ≠ 7,500)', 보인줄)
  봐(await 누름(p, /^치수 값으로$/), '«치수 값으로»'); await 쉼(p, 600)
  봐(/7\.4 m/.test(await p.evaluate(() => (document.querySelector('.kcs-row .kcs-qty') || {}).textContent || '')) && !/다른 줄 1/.test(await 글(p)), '그 줄 7.4 m · 검사 풀림')
  await 누름(p, /^모두 보기$/); await 쉼(p, 400)
  /* 3D */
  const 판 = await p.evaluate(() => { const c = document.querySelector('canvas.kcs-3d'); if (!c) return null; const r = c.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)] })
  봐(판 && 판[0] > 200 && 판[1] > 150, '3D 판 그려짐 ' + JSON.stringify(판), 판)
  if (판) {
    const png = await p.locator('canvas.kcs-3d').screenshot()
    const 색 = await p.evaluate(async (b64) => { const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode(); const cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height; const x = cv.getContext('2d'); x.drawImage(im, 0, 0); const d = x.getImageData(0, 0, cv.width, cv.height).data; const s = new Set(); let 주황 = 0; for (let i = 0; i < d.length; i += 16) { s.add((d[i] >> 4) * 256 + (d[i + 1] >> 4) * 16 + (d[i + 2] >> 4)); if (d[i] > 150 && d[i + 1] > 60 && d[i + 1] < 160 && d[i + 2] < 110) 주황++ } return [s.size, 주황] }, png.toString('base64'))
    봐(색[0] > 30 && 색[1] > 20, `3D 에 덩어리가 그려짐(색 ${색[0]}가지 · 주황 · 빨강 점 ${색[1]})`, 색)
    fs.writeFileSync(path.join(틀, 기기 + '_3D.png'), png)
  }
  await p.screenshot({ path: path.join(틀, 기기 + '_예시.png') })

  /* ③ KCMS 받기 */
  const 앞줄 = await p.evaluate(() => JSON.parse(localStorage.getItem('kcm.cad.v1') || '{"줄":[]}').줄.length)
  보냄(리습csv('kcms_' + (폰 ? 302 : 301) + '.csv'))
  봐(await 기다림(p, async () => /캐드에서 고른 것 \d+줄을 받았습니다/.test(await 글(p)), 20), '열린 작업 화면이 KCMS 를 받음(3초 돌기)')
  await 쉼(p, 1200)
  const 받은 = await p.evaluate(() => JSON.parse(localStorage.getItem('kcm.cad.v1') || '{"줄":[],"묶음":[]}'))
  봐(받은.줄.length - 앞줄 === 답.줄 && 받은.묶음.length === 2, `줄 ${받은.줄.length - 앞줄} = lib ${답.줄} · 묶음 둘(예시 + 받은 것)`, [받은.줄.length, 앞줄, 답.줄])
  봐(/1층 평면도\.dwg/.test(await p.evaluate(() => [...document.querySelectorAll('.kcs-bname')].map((x) => x.textContent).join('|'))), '묶음 이름 = 캐드 도면 이름(«1층 평면도.dwg»)')
  const 받은합 = L.캐드셈(L.캐드정돈(받은)).합
  합 = await 머리합(p)
  봐(합.includes(합글(받은합)), '화면 머리 합 = lib 셈(저장된 줄) ' + 합글(받은합), 합)
  /* 두 번 */
  보냄(리습csv('kcms_' + (폰 ? 304 : 303) + '.csv', 4, 2461359.7))
  봐(await 기다림(p, async () => /이미 받은 객체 \d+개는 빼고/.test(await 글(p)), 20), '같은 것을 또 보내면 «이미 받은 객체 n개는 빼고»')
  await 쉼(p, 1000)
  const 둘째 = await p.evaluate(() => JSON.parse(localStorage.getItem('kcm.cad.v1')).줄.length)
  봐(둘째 === 받은.줄.length, '줄 수 그대로(두 번 안 셈)', [둘째, 받은.줄.length])
  /* 단위 없는 도면 */
  await 누름(p, /^🗑$/); await 쉼(p, 400)
  보냄(리습csv('kcms_' + (폰 ? 306 : 305) + '.csv', 0, 2461359.9))
  봐(await 기다림(p, async () => /단위 ❓/.test(await 글(p)), 20), '단위(INSUNITS 0) 도면 → 묶음 «단위 ❓» · 고르기 단추')
  const 단위전 = await 머리합(p)
  봐(/도면 단위가 없는 묶음 1/.test(await 글(p)) && !/ m\b| ㎡| ㎥/.test(단위전) && / 개/.test(단위전), '길이 · 면적은 ❓(짐작 안 함) · 블록 개수만 셈 — ' + 단위전, 단위전)
  봐(await p.evaluate(() => { const b = [...document.querySelectorAll('.kcs-units button')].find((x) => x.textContent.trim() === 'mm'); if (b) { b.click(); return true } return false }), '«mm» 고름'); await 쉼(p, 800)
  합 = await 머리합(p)
  봐(합.includes(합글(답.합)), '단위를 고르면 바로 셈 — ' + 합, [합, 합글(답.합)])
  /* ④ 다시 열기 · 빼기 · 되돌리기 */
  await p.goto(주소 + '/jeoksan/model?ws=1', { waitUntil: 'domcontentloaded' }); await 쉼(p, 3000)
  await 누름(p, /^📏 캐드$/); await 쉼(p, 1500)
  봐((await 머리합(p)).includes(합글(답.합)), '새로 열어도 남음(이 브라우저 kcm.cad.v1)', await 머리합(p))
  await p.evaluate(() => { const b = document.querySelector('.kcs-bundle .gmd-x'); if (b) b.click() }); await 쉼(p, 600)
  봐(/캐드에서 명령 KCMS 를 치고/.test(await 글(p)), '✕ 묶음 빼기 → 빈 화면')
  await 누름(p, /예시\(가상 평면\)로 해 보기/); await 쉼(p, 800)
  const 앞 = await p.evaluate(() => document.querySelectorAll('.kcs-group').length)
  await p.evaluate(() => { const b = document.querySelector('.kcs-group .kcs-ghead .gmd-x'); if (b) b.click() }); await 쉼(p, 500)
  const 뺀뒤 = await p.evaluate(() => document.querySelectorAll('.kcs-group').length)
  봐(await 누름(p, /^↶/), '↶ 되돌리기'); await 쉼(p, 600)
  const 되 = await p.evaluate(() => document.querySelectorAll('.kcs-group').length)
  봐(앞 > 3 && 뺀뒤 === 앞 - 1 && 되 === 앞, '무리 ✕ 빼기 → ↶ 로 돌아옴', [앞, 뺀뒤, 되])
  /* 엑셀 */
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 30000 }).catch(() => null), p.evaluate(() => { const b = [...document.querySelectorAll('.kcs-acts button')].find((x) => x.textContent.trim() === '📊 엑셀'); if (b) b.click() })])
  const 엑셀이름 = await p.evaluate(() => (window.__받은이름 || []).slice(-1)[0] || '')
  봐(!!dl && /^캐드고름_.+\.xlsx$/.test(엑셀이름), '📊 엑셀 — 받기 전 검사 통과하면 바로 받음 · ' + 엑셀이름, 엑셀이름)
  if (dl) {
    const f = path.join(틀, 기기 + '_캐드고름.xlsx'); await dl.saveAs(f)
    const 책 = 엑셀읽기(new Uint8Array(fs.readFileSync(f)))
    const 결 = 책.시트들[0]
    봐(책.시트들.map((s) => s.이름).join() === '검사 결과,캐드고름,캐드집계' && [...결.칸.values()].some((x) => String(x.v) === '모두 통과'), '엑셀 시트 셋 · «검사 결과» 모두 통과', 책.시트들.map((s) => s.이름))
  }
  봐(/받기 전 검사 \d+가지 모두 통과/.test(await 글(p)), '«받기 전 검사 … 모두 통과 · 받았습니다» 알림')
  /* 💾 모델 파일에 캐드 고름 */
  const [dj] = await Promise.all([p.waitForEvent('download', { timeout: 15000 }).catch(() => null), p.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => x.title === '모델 파일 저장'); if (b) b.click() })])
  if (dj) { const f = path.join(틀, 기기 + '_모델.json'); await dj.saveAs(f); const j = JSON.parse(fs.readFileSync(f, 'utf8')); 봐(j.캐드 && j.캐드.줄.length === 16 && j.캐드.묶음.length === 1, '💾 모델 파일에 캐드 고름(16줄)', j.캐드 && j.캐드.줄.length) } else 봐(false, '💾 모델 파일 받기')
  /* ⑤ 넘침 · 탭 · 폰 칸 — G685b: 폭을 촘촘히(옛 시험은 320 · 360 · 390 · 860 · 1280 · 1476 만 봐 521 ~ 600 넘침(리눅스 글꼴 45 px)을 놓침)
     + «글꼴이 10 % 넓어도»(윈도 크롬 맑은 고딕은 이 글꼴보다 5 ~ 9 % 넓음 — 실제 사이트 잼 11-14: 300 ~ 606 px 곳곳 8 ~ 86 px 넘쳤음) */
  const 폭들 = 폰 ? [320, 360, 375, 390, 402, 414, 433, 460, 520] : [521, 560, 600, 680, 681, 768, 860, 1280, 1476]
  const 탭재기 = () => p.evaluate(() => {
    const 탭 = document.querySelector('.gmd-ws-tabs'), 캐드탭 = [...document.querySelectorAll('.gmd-ws-tabs .gmd-tab')].pop()
    const tb = 탭.getBoundingClientRect(), cb = 캐드탭.getBoundingClientRect()
    const 밖 = [...document.querySelectorAll('.kcs input, .kcs select, .kcs button, .kcs canvas')].filter((e) => { const q = e.getBoundingClientRect(); return q.width && (q.right > innerWidth + 1 || q.left < -1) }).length
    return { 넘: document.documentElement.scrollWidth - innerWidth, 탭안: cb.right <= tb.right + 1 && cb.left >= tb.left - 1, 탭밀림: 탭.scrollWidth - 탭.clientWidth, 밖, 캐드글: 캐드탭.innerText.trim() }
  })
  for (const w of 폭들) {
    await p.setViewportSize({ width: w, height: 812 }); await 쉼(p, 500)
    const r = await 탭재기()
    봐(r.넘 <= 1 && r.밖 === 0, w + ' px — 넘침 없음 · 칸 · 단추 화면 안', JSON.stringify(r))
    봐(r.탭안 && r.탭밀림 <= 1, w + ' px — 탭 줄 안에 «📏 캐드»(밀지 않아도 보임)', JSON.stringify(r))
    봐(r.캐드글 === (w <= 520 ? '캐드' : '📏 캐드'), w + ' px — 탭 글 «' + (w <= 520 ? '캐드»(폰 폭은 그림 글자 숨김)' : '📏 캐드»'), r.캐드글)
  }
  await p.addStyleTag({ content: '.gmd .gmd-ws-tabs.t7 .gmd-tab { letter-spacing: 0.1em !important; }' })
  const 넓은글 = []
  for (const w of 폭들) { await p.setViewportSize({ width: w, height: 812 }); await 쉼(p, 300); const r = await 탭재기(); if (!(r.탭안 && r.탭밀림 <= 1)) 넓은글.push(w + ':' + r.탭밀림) }
  봐(!넓은글.length, '글꼴이 10 % 넓어도(letter-spacing 0.1em — 윈도 글꼴 흉내) ' + 폭들.join(' · ') + ' px 모두 탭 한 줄', 넓은글.join(' '))
  await p.evaluate(() => { for (const s of document.querySelectorAll('style')) if (/letter-spacing: 0\.1em !important/.test(s.textContent)) s.remove() })
  await p.setViewportSize(창)
  if (폰) {
    const fs16 = await p.evaluate(() => [...document.querySelectorAll('.kcs-in')].every((e) => parseFloat(getComputedStyle(e).fontSize) >= 16))
    봐(fs16, '폰 — 입력 칸 글자 16px 이상(아이폰이 확대하지 않게)')
  }
  await p.evaluate(() => { const g = document.querySelector('.kcs-group .kcs-fold'); if (g) g.click() }); await 쉼(p, 500)
  await p.screenshot({ path: path.join(틀, 기기 + '_펼침.png'), fullPage: false })
  봐(!p.오류.length, '화면 오류 없음', p.오류.join(' | '))
  await c.close()

  /* ⑦ 🧱 G686 캐드 → 골조 모델 부재(스케치업 꼴) — 적요 «1층 기둥 C9» · «2층 보 G9» 로 받으면 부재 · 부호 · 층이 채워지고 «🧱 골조 모델에 세우기» 한 번
       → 세우기 탭 · 물량 탭 부호별 · 캐드 탭 «🧱 … 골조 모델»(합에서 빠짐) · ↶ 되돌리면 다시 캐드 탭에서 셈 · 레이어 이름 🟨 제안 · 📑 내역 대조에 캐드 물량 */
  {
    const { c, p } = await 새쪽(false)
    await p.goto(주소 + '/jeoksan/model?ws=1&pc=1', { waitUntil: 'domcontentloaded' }); await 쉼(p, 3500)
    봐(await 누름(p, /^🧪 예시$/), '🧱 작업 화면 🧪 예시(가상 2층 라멘조 — 층고 · 일람이 든 모델)'); await 쉼(p, 1500)
    const 캐드글 = (적요, 줄들) => ['KCMSEL\t1\tC:\\가상\\구조평면.dwg\t4\t' + 적요 + '\t' + 줄들.length + '\t24.3\tAutoCAD', ...줄들.map((c) => c.join('\t'))].join('\r\n') + '\r\n'
    const 보낼 = (이름, 글) => { const f = path.join(보내기, 이름); fs.writeFileSync(f, 글, 'utf8'); 보냄(f) }
    const 기둥판 = [['LWPOLYLINE', 'S-COL', '9A1', '1', '0', '29650,-350,0;30350,-350,0;30350,350,0;29650,350,0', '', '', ''], ['TEXT', 'S-COL', '9A2', '0', '0', '30000,0', '250', 'C9', '']]
    const n0 = 보낸.length
    보낼('kcms_' + (폰 ? 412 : 411) + '.csv', 캐드글('1층 기둥 C9', 기둥판))
    봐(await 기다림(p, async () => 보낸.length > n0 && 보낸.every((x) => x.받음), 20) && await 기다림(p, async () => /캐드에서 고른 것 1줄을 받았습니다/.test(await 글(p)), 15), '적요 «1층 기둥 C9» 묶음을 받음(1줄)', (await 글(p)).slice(0, 300))
    봐(/적요 «1층 기둥 C9» → 🧱 기둥 C9 · 1층 1줄/.test(await 글(p)), '알림 — «적요 «1층 기둥 C9» → 🧱 기둥 C9 · 1층 1줄»(무엇을 채웠는지)', (await 글(p)).slice(0, 400))
    const 무리값 = () => p.evaluate(() => [...document.querySelectorAll('.kcs-group')].map((g) => ({ 이름: g.querySelector('.kcs-gname').textContent, 부재: (g.querySelector('.kcs-gedit select.kcs-member') || {}).value, 부호: (g.querySelector('.kcs-gedit input.kcs-sign') || {}).value, 층: ((g.querySelector('.kcs-gedit select.kcs-floor') || {}).selectedOptions || [{}])[0].textContent, 제안: !!g.querySelector('.kcs-suggest') })))
    let 무 = await 무리값()
    봐(무.length === 1 && 무[0].부재 === '기둥' && 무[0].부호 === 'C9' && 무[0].층 === '1층' && !무[0].제안, '무리 줄 — 부재 🧱 기둥 · 부호 C9(닫힌 선 안 글자) · 층 1층', JSON.stringify(무))
    보낼('kcms_' + (폰 ? 414 : 413) + '.csv', 캐드글('2층 보 G9', [['LINE', 'S-BEAM', '9B1', '0', '0', '21000,-200;29650,-200', '0,0', '', ''], ['LINE', 'S-BEAM', '9B2', '0', '0', '21000,200;29650,200', '0,0', '', '']]))
    봐(await 기다림(p, async () => (await 무리값()).length === 2, 20), '적요 «2층 보 G9» 묶음 — 무리 둘')
    무 = await 무리값()
    const 보무 = 무.find((g) => /S-BEAM/.test(g.이름)) || {}
    봐(보무.부재 === '보' && 보무.부호 === 'G9' && 보무.층 === '2층 바닥 · 1층', '보 무리 — «2층 보» → 층 칸 «2층 바닥 · 1층»(모델 1층 = 1층 + 그 위 바닥)', JSON.stringify(보무))
    const 검글 = () => p.evaluate(() => (document.querySelector('.kcs-check') || {}).innerText || '')
    봐(/🧱 부재를 고른 줄 3/.test(await 검글()) && /🧱 골조 모델에 세우기/.test(await 검글()), '검사 줄 — «🧱 부재를 고른 줄 3 · 🧱 골조 모델에 세우기»', await 검글())
    봐(await 누름(p, /^🧱 골조 모델에 세우기$/), '«🧱 골조 모델에 세우기» 누름')
    봐(await 기다림(p, async () => /골조 모델에 2개를 세웠습니다\(기둥 1 · 보 1\)/.test(await 글(p)), 10), '알림 — «골조 모델에 2개를 세웠습니다(기둥 1 · 보 1)»(두 선 짝 = 보 하나)', (await 글(p)).slice(0, 500))
    봐(await p.evaluate(() => (document.querySelector('.gmd-ws-tabs .gmd-tab[aria-selected="true"]') || {}).textContent === '세우기 · 3D'), '세우기 탭(3D)으로 감')
    봐(/부호 일람에 새 부호 2\((보 G9 · 기둥 C9|기둥 C9 · 보 G9)\)/.test(await 글(p)), '일람에 새 부호 둘(캐드에서 잰 크기 — 보 춤 · 철근 ❓ 는 일람에서)', (await 글(p)).slice(0, 600))
    await 누름(p, /^물량/); await 쉼(p, 1500)
    const 부호표 = await p.evaluate(() => [...document.querySelectorAll('.gmd-table')].map((t) => t.innerText).find((t) => /부호/.test(t) && /C9/.test(t)) || '')
    봐(/기둥\s+C9\s+1\s+1\.911/.test(부호표), '물량 탭 부호별 — 기둥 C9 1개 · 콘크리트 1.911 ㎥(0.7 × 0.7 × 3.9 — 캐드에서 잰 크기 · 예시 1층 3.6 + FT 내림 0.3 · lib 셈과 같음)', 부호표.split('\n').filter((x) => /C9|G9/.test(x)).join(' / '))
    await 누름(p, /^📏 캐드$/); await 쉼(p, 1200)
    봐(/🧱 골조 모델로 세운 줄 3/.test(await 검글()) && /수량 없음/.test(await 머리합(p)), '캐드 탭 — 세운 줄 3 · 합에서 빠짐(«수량 없음» — 두 번 안 셈)', await 검글() + ' | ' + await 머리합(p))
    await p.evaluate(() => { const b = document.querySelector('.kcs-group .kcs-fold'); if (b && b.getAttribute('aria-expanded') === 'false') b.click() }); await 쉼(p, 500)
    봐(/🧱 기둥 C9 — 골조 모델/.test(await p.evaluate(() => [...document.querySelectorAll('.kcs-built')].map((e) => e.textContent).join('|'))), '줄 — «🧱 기둥 C9 — 골조 모델» · 수량 칸 «골조 물량에서 셈»')
    /* 레이어 이름 제안 — 적요 없이 S-COL 닫힌 네모 */
    보낼('kcms_' + (폰 ? 416 : 415) + '.csv', 캐드글('', [['LWPOLYLINE', 'S-COL', '9C1', '1', '0', '34650,-350,0;35350,-350,0;35350,350,0;34650,350,0', '', '', '']]))
    봐(await 기다림(p, async () => (await 무리값()).some((g) => g.제안), 20), '적요 없는 «S-COL» 무리 — «🟨 기둥으로 세우기?» 제안(저절로 넣지 않음)', JSON.stringify(await 무리값()))
    봐(await 누름(p, /^🟨 기둥으로 세우기\?$/), '제안 누름'); await 쉼(p, 600)
    봐((await 무리값()).filter((g) => g.부재 === '기둥').length === 2, '그 무리 부재 = 기둥(부호는 사람이 적음)', JSON.stringify(await 무리값()))
    /* 📑 내역 대조 — 캐드 물량(세우지 않은 줄) */
    await p.evaluate(() => { const g = [...document.querySelectorAll('.kcs-group')].find((x) => x.querySelector('.kcs-suggest') === null && x.querySelector('select.kcs-member') && x.querySelector('select.kcs-member').value === '기둥' && !x.querySelector('.kcs-built')); const s = g && g.querySelector('select.kcs-member'); if (s) { Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(s, ''); s.dispatchEvent(new Event('change', { bubbles: true })) } }); await 쉼(p, 500)
    await 누름(p, /^물량/); await 쉼(p, 1200)
    봐(await 누름(p, /^🧪 예시 내역서$/), '물량 탭 📑 🧪 예시 내역서'); 
    봐(await 기다림(p, async () => /📏 캐드 짝 0\/1/.test(await 글(p)), 15), '«📏 캐드 짝 0/1» · 캐드 물량 한 줄(S-COL 0.49 ㎡)', (await 글(p)).split('\n').filter((x) => /캐드/.test(x)).join(' / '))
    봐(/📏 캐드 물량 — 내역 줄을 아직 못 찾은 것 1/.test(await 글(p)), '«📏 캐드 물량 — 내역 줄을 아직 못 찾은 것 1» — 내역 줄 고르기')
    const 골라 = await p.evaluate(() => { const s = document.querySelector('.gmd-cv-cad select'); if (!s) return ''; const o = [...s.options].find((x) => /합판거푸집 슬라브|합판거푸집/.test(x.textContent)); if (!o) return ''; Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(s, o.value); s.dispatchEvent(new Event('change', { bubbles: true })); return o.textContent })
    await 쉼(p, 800)
    봐(!!골라 && /📏 캐드 짝 1\/1/.test(await 글(p)), '내역 줄을 고르면 짝 1/1(' + 골라 + ') · 위 표에 올라감', 골라)
    /* ↶ 되돌리기 → 세운 부재가 빠지면 캐드 탭에서 다시 셈 */
    await 누름(p, /^📏 캐드$/); await 쉼(p, 800)
    for (let i = 0; i < 3 && /세운 줄 3/.test(await 검글()); i++) { await p.evaluate(() => { const b = document.querySelector('.gmd-undo'); if (b && !b.disabled) b.click() }); await 쉼(p, 600) }
    봐(!/세운 줄/.test(await 검글()) && /🧱 부재를 고른 줄/.test(await 검글()), '↶ 되돌리기로 세운 부재를 빼면 캐드 탭이 다시 셈(🧱 부재를 고른 줄)', await 검글())
    봐(!p.오류.length, '🧱 세우기 길 — 화면 오류 없음', p.오류.join(' | '))
    await p.screenshot({ path: path.join(틀, 기기 + '_세우기.png') })
    await c.close()
  }

  /* ⑥ 📂 G686 캐드 폴더(프로그램 없이) — showDirectoryPicker 를 이 브라우저 OPFS 폴더(K-conmap)로 흉내 · 리습이 쓴 csv(+ 다 썼다는 .txt)를 화면이 직접 읽음 */
  if (!폰) {
    const { c: c6, p: p6 } = await 새쪽(false)
    await c6.addInitScript(() => {
      window.showDirectoryPicker = async () => { const r = await navigator.storage.getDirectory(); return r.getDirectoryHandle('K-conmap', { create: true }) }
    })
    const 폴더글 = () => p6.evaluate(() => (document.querySelector('.kcs-folder') || {}).innerText || '')
    const 씀 = (이름, 바이트) => p6.evaluate(async ([n, b]) => { const r = await navigator.storage.getDirectory(); const d = await r.getDirectoryHandle('K-conmap', { create: true }); const f = await d.getFileHandle(n, { create: true }); const w = await f.createWritable(); await w.write(new Uint8Array(b)); await w.close() }, [이름, [...바이트]])
    const 목록 = () => p6.evaluate(async () => { const r = await navigator.storage.getDirectory(); const d = await r.getDirectoryHandle('K-conmap', { create: true }); const l = []; for await (const [n] of d.entries()) l.push(n); return l.sort() })
    await p6.goto(주소 + '/jeoksan/model?ws=1', { waitUntil: 'domcontentloaded' }); await 쉼(p6, 3500)
    await 누름(p6, /^📏 캐드$/); await 쉼(p6, 1200)
    봐(await 누름(p6, /^📂 캐드 폴더 잇기$/), '📂 캐드 폴더 잇기 누름')
    봐(await 기다림(p6, async () => /K-conmap\s*이어짐/.test(await 폴더글()), 8), '폴더 «K-conmap» 이어짐', await 폴더글())
    await 씀('kcms_311.csv', fs.readFileSync(리습csv('kcms_311.csv')))
    await 쉼(p6, 4500)
    봐((await 목록()).join() === 'kcms_311.csv' && !/\d+줄/.test(await 머리합(p6)), '.txt 없는 csv(리습이 아직 쓰는 중)는 안 읽음', (await 목록()).join())
    await 씀('kcms_311.txt', Buffer.from('C:\\Users\\시험\\Downloads\\K-conmap\\kcms_311.csv\r\n', 'utf8'))
    봐(await 기다림(p6, async () => new RegExp('^' + 답.줄 + '줄').test(await 머리합(p6)), 8), `.txt 가 오면 읽어 줄로 — ${답.줄}줄(2초마다 봄)`, await 머리합(p6))
    봐(await 기다림(p6, async () => (await 목록()).length === 0, 6), '읽은 csv · txt 는 지움(폴더가 쌓이지 않게)', (await 목록()).join())
    /* 사이트 안 다른 쪽에 갔다 와도 이어짐(손잡이는 lib/캐드폴더.js 변수 — 이 창 안) */
    await p6.evaluate(() => { history.pushState({}, '', '/jeoksan'); dispatchEvent(new PopStateEvent('popstate')) }); await 쉼(p6, 1500)
    await p6.evaluate(() => { history.back() }); await 쉼(p6, 2500)
    await 누름(p6, /^📏 캐드$/); await 쉼(p6, 1000)
    봐(/K-conmap\s*이어짐/.test(await 폴더글()), '사이트 안 다른 쪽에 갔다 와도 이어짐(이 창 안 변수)', await 폴더글())
    /* 🚫 G686 창을 새로 열면 다시 잇기 — 손잡이를 IndexedDB 에 안 넣음(이 시험 창 = 시크릿 꼴 · 예전 판은 여기서 브라우저가 통째로 꺼졌음) */
    await p6.reload({ waitUntil: 'domcontentloaded' }); await 쉼(p6, 3500)
    await 누름(p6, /^📏 캐드$/); await 쉼(p6, 1000)
    봐(브.isConnected() && /📂 캐드 폴더 잇기/.test(await 폴더글()) && !/이어짐/.test(await 폴더글()), '새로 열면 «📂 캐드 폴더 잇기» 다시(손잡이 저장 안 함 — 시크릿 창에서도 브라우저가 안 꺼짐)', await 폴더글())
    봐(await 누름(p6, /^📂 캐드 폴더 잇기$/) && await 기다림(p6, async () => /K-conmap\s*이어짐/.test(await 폴더글()), 8), '다시 잇기 — 단추 한 번', await 폴더글())
    await 씀('kcms_312.csv', fs.readFileSync(리습csv('kcms_312.csv', 4, 2461359.6))); await 씀('kcms_312.txt', Buffer.from('x\r\n'))
    const 둘째 = await 기다림(p6, async () => (await 목록()).length === 0 && (await p6.evaluate(() => document.querySelectorAll('.kcs-bundle').length)) === 2, 25)
    const 둘째글 = await p6.evaluate(() => ({ 묶음: document.querySelectorAll('.kcs-bundle').length, 알림: [...document.querySelectorAll('.gmd-note')].map((e) => e.innerText).join(' | ').slice(0, 300) }))
    봐(둘째 && /이미 받은 객체 \d+개는 빼고/.test(둘째글.알림), '둘째 KCMS 도 받음(묶음 둘 · 같은 핸들은 «이미 받은 객체» 로 빼고 · 폴더 비움)', JSON.stringify({ ...둘째글, 목록: await 목록() }))
    봐(!p6.오류.length, '폴더 길 — 화면 오류 없음', p6.오류.join(' | '))
    await c6.close()
    /* 폴더 읽기가 없는 브라우저(파이어폭스 · 사파리 · 폰) */
    const { c: c7, p: p7 } = await 새쪽(false)
    await c7.addInitScript(() => { try { window.showDirectoryPicker = undefined } catch (e) { /* 막힘 */ } })
    await p7.goto(주소 + '/jeoksan/model?ws=1', { waitUntil: 'domcontentloaded' }); await 쉼(p7, 3500)
    await 누름(p7, /^📏 캐드$/); await 쉼(p7, 1000)
    봐(/폴더를 못 읽습니다 — PC 크롬 · 엣지/.test(await p7.evaluate(() => (document.querySelector('.kcs-folder') || {}).innerText || '')) && !(await p7.evaluate(() => [...document.querySelectorAll('.kcs-folder button')].length)), '폴더 읽기 없는 브라우저 — «PC 크롬 · 엣지에서 여십시오» · 잇기 단추 없음(리습 받기는 그대로)')
    await c7.close()
  }
}
await 흉내끄기()
await 브.close()
console.log(`\n결과: ${ok} 통과 · ${bad} 틀림 · 캡처 ${틀}`)
process.exit(bad ? 1 : 0)
