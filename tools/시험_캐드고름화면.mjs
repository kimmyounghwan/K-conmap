// 📏 G685 작업 화면 «📏 캐드» 탭 화면 시험 — 캐드 KCMS → K-적산컨맵 연결 프로그램 → 작업 화면(가상 도면 · 흉내 프로그램)
//   화면 빌드를 얹은 뒤  B=http://127.0.0.1:4708 node tools/시험_캐드고름화면.mjs [PC|폰|모두]
//   보내는 csv 는 tools/시험_캐드고름리습.py --csv 가 kcm.lsp 를 흉내 해석기로 «실제로 돌려» 쓴 것(CP949 · 옛 캐드 꼴)
//   ① 손님(소장님 브라우저 아님): 📏 캐드 탭 없음 · KCMS 글을 보내도 줄 · 저장 · «도면 넣기» 없음(받음만)
//   ② 소장님: 탭 · 빈 화면 안내 · 🧪 예시 · 무리 한꺼번에(갈래 · 높이) · ⚠ 치수 고르기 · ❓ 보기 · 3D 그림
//   ③ 열린 화면이 KCMS 를 받음 → 줄 · 합 = lib 셈 · 두 번 보내면 «이미 받은 객체» · 단위 없는 도면 → 단위 고르기
//   ④ 새로 열어도 남음 · ✕ 묶음 빼기 → ↶ 되돌리기 · 📊 엑셀(받기 전 검사 통과 · 시트 셋) · 💾 모델 파일에 캐드 고름
//   ⑤ 넘침 없음(폰 320 · 360 · 390 / PC 860 · 1280 · 1476) · 탭 줄 안에 «📏 캐드» · 폰 입력 칸 16px · 화면 오류 없음
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

  /* ① 손님 */
  {
    const { c, p } = await 새쪽(false)
    await p.goto(주소 + '/jeoksan/model?ws=1&pc=1', { waitUntil: 'domcontentloaded' }); await 쉼(p, 3500)
    const t = await 탭들(p)
    봐(t.length === 6 && !t.some((x) => /캐드/.test(x)), '손님 — 탭 여섯 그대로 · «📏 캐드» 없음', t)
    const n0 = 보낸.length
    보냄(리습csv('kcms_' + (폰 ? 202 : 201) + '.csv'))
    봐(await 기다림(p, async () => 보낸.length > n0 && 보낸.every((x) => x.받음), 20), '손님 — 보낸 KCMS 글은 받음 처리만(프로그램 쪽 «받음»)', 보낸.length)
    await 쉼(p, 1200)
    const g = await 글(p)
    봐(!/캐드에서 고른 것|도면에서 세우지 못했습니다|✓ 도면 \d+장 읽음/.test(g) && !(await p.evaluate(() => localStorage.getItem('kcm.cad.v1'))), '손님 — 줄 · 저장 · «도면 넣기» 없음(아무 일 없음)')
    봐(!p.오류.length, '손님 — 화면 오류 없음', p.오류.join(' | '))
    await c.close()
  }

  /* ② 소장님 */
  const { c, p } = await 새쪽(true)
  await p.goto(주소 + '/jeoksan/model?ws=1&pc=1', { waitUntil: 'domcontentloaded' }); await 쉼(p, 3500)
  let t = await 탭들(p)
  봐(t.length === 7 && t[6] === '📏 캐드', '소장님 — 탭 일곱째 «📏 캐드»', t)
  await 누름(p, /^📏 캐드$/); await 쉼(p, 1500)
  봐(/캐드에서 명령 KCMS 를 치고/.test(await 글(p)) && /APPLOAD/.test(await 글(p)), '빈 화면 — 쓰는 법(프로그램 · APPLOAD · KCMS) 안내')
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
  /* ⑤ 넘침 · 탭 · 폰 칸 */
  for (const w of 폰 ? [320, 360, 390] : [860, 1280, 1476]) {
    await p.setViewportSize({ width: w, height: 812 }); await 쉼(p, 700)
    const r = await p.evaluate(() => {
      const 탭 = document.querySelector('.gmd-ws-tabs'), 캐드탭 = [...document.querySelectorAll('.gmd-ws-tabs .gmd-tab')].pop()
      const tb = 탭.getBoundingClientRect(), cb = 캐드탭.getBoundingClientRect()
      const 밖 = [...document.querySelectorAll('.kcs input, .kcs select, .kcs button, .kcs canvas')].filter((e) => { const q = e.getBoundingClientRect(); return q.width && (q.right > innerWidth + 1 || q.left < -1) }).length
      return { 넘: document.documentElement.scrollWidth - innerWidth, 탭안: cb.right <= tb.right + 1 && cb.left >= tb.left - 1, 탭밀림: 탭.scrollWidth - 탭.clientWidth, 밖 }
    })
    봐(r.넘 <= 1 && r.밖 === 0, w + ' px — 넘침 없음 · 칸 · 단추 화면 안', JSON.stringify(r))
    봐(r.탭안 && r.탭밀림 <= 1, w + ' px — 탭 줄 안에 «📏 캐드»(밀지 않아도 보임)', JSON.stringify(r))
  }
  await p.setViewportSize(창)
  if (폰) {
    const fs16 = await p.evaluate(() => [...document.querySelectorAll('.kcs-in')].every((e) => parseFloat(getComputedStyle(e).fontSize) >= 16))
    봐(fs16, '폰 — 입력 칸 글자 16px 이상(아이폰이 확대하지 않게)')
  }
  await p.evaluate(() => { const g = document.querySelector('.kcs-group .kcs-fold'); if (g) g.click() }); await 쉼(p, 500)
  await p.screenshot({ path: path.join(틀, 기기 + '_펼침.png'), fullPage: false })
  봐(!p.오류.length, '화면 오류 없음', p.오류.join(' | '))
  await c.close()
}
await 흉내끄기()
await 브.close()
console.log(`\n결과: ${ok} 통과 · ${bad} 틀림 · 캡처 ${틀}`)
process.exit(bad ? 1 : 0)
