// 🗓 G466 골조 모델 «🗓 공정» 화면 시험 — 가상 예시 모델만(실제 현장 아님)
//   화면 빌드를 얹은 뒤  B=http://127.0.0.1:4467 node tools/시험_골조공정화면.mjs [PC|폰|보통|모두]
//   ① 🗓 공정 탭 → 시작 날 없음 알림 → 🧪 예시 값 넣기 → 공기 · 칸 날짜 = lib 공정셈(같은 모델)
//   ② 칸마다 n일 고침 · 칸 하나 작업일 고침 · ▼ 차례 · 팀 따로 끄기 → 화면 = lib
//   ③ 기준일 → 끝 · 하는 중 · 아직 수 · «끝난 칸 → 기성 새 회차» → 모델 기성 1회(끝난 칸)
//   ④ 🧊 3D 로 재생 → 세우기 · 3D 에 재생 줄 · ▶ 재생하면 날이 감 · 끝으로 → 끝 n/n칸 · 끄기
//   ⑤ 📊 엑셀 → 받기 전 검사 모두 통과 · 골조공정표 · 월별예정 · 공정조건 시트(숫자만) · 새로고침 뒤 공정 남음
//   ⑥ 가로 넘침 없음(폰 320 · 360 · 390 / PC 860 · 1280 · 1476 — 쪽 · 공정 판 · 위 탭 줄) · 화면 오류 없음
import { createRequire } from 'module'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { 정돈, 모델셈 } from '../web/src/lib/골조모델.js'
import { 공정셈, 달마다 } from '../web/src/lib/골조공정.js'
import { 엑셀읽기 } from '../web/src/lib/엑셀읽기.js'
const require = createRequire(process.env.PW || '/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const 주소 = process.env.B || 'http://127.0.0.1:4467'
const 기기들 = (process.argv[2] || '모두') === '모두' ? ['PC', '폰', '보통'] : [process.argv[2]]
const O = fs.mkdtempSync(path.join(os.tmpdir(), 'kcm_g466_'))
let ok = 0, bad = 0
const 브 = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] })
for (const 기기 of 기기들) {
  const 폰 = 기기 === '폰'
  const 작업 = 기기 !== '보통'
  const c = await 브.newContext({ viewport: 폰 ? { width: 390, height: 844 } : { width: 1476, height: 812 }, locale: 'ko-KR', isMobile: 폰, hasTouch: 폰, acceptDownloads: true })
  await c.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|geojs|firebaseio/, (r) => r.fulfill({ status: 200, body: '' }))
  await c.addInitScript(() => { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); try { sessionStorage.setItem('kcm_notice_seen', '2026-10-업체'); sessionStorage.setItem('kcm_visit_s', '1') } catch (e) { /* 막힘 */ } })
  const p = await c.newPage()
  const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e.stack || e).slice(0, 400)))
  p.on('dialog', (d) => d.accept())
  const 봐 = (cnd, 말, 더 = '') => { if (cnd) ok++; else bad++; console.log(cnd ? '✓' : '✗', 기기, 말, cnd ? '' : String(더).slice(0, 700)) }
  const 누름 = (re) => p.evaluate((s) => { const r = new RegExp(s); const b = [...document.querySelectorAll('button')].find((x) => r.test(x.textContent.trim()) && !x.disabled && x.offsetParent !== null); if (b) { b.click(); return true } return false }, re.source)
  const 쉼 = (ms) => p.waitForTimeout(ms)
  const 모델 = async () => 정돈(await p.evaluate(() => JSON.parse(localStorage.getItem('kcm.model.v1') || 'null')))
  const 팀 = 작업   // 작업 화면 예시 = 구간 둘(A팀 · B팀) · 보통 화면 예시 = 구간 없음(층마다 한 칸)
  const n칸 = 팀 ? 6 : 3
  const 판글 = () => p.evaluate(() => (document.querySelector('.gmd-gj') || {}).innerText || '')
  const 칸줄 = () => p.evaluate(() => [...document.querySelectorAll('table.gmd-gj-table tbody tr')].map((tr) => [...tr.querySelectorAll('td')].map((d) => d.innerText.trim())))
  const 점 = (t) => (+t.slice(5, 7)) + '.' + (+t.slice(8, 10)) + '(' + '일월화수목금토'[new Date(t + 'T00:00:00Z').getUTCDay()] + ')'
  const 맞대기 = async (말) => {
    const M = await 모델(), S = 모델셈(M), R = 공정셈(M, S)
    const 줄 = await 칸줄()
    const 같 = R.다됨 && 줄.length === R.줄.length && R.줄.every((x, i) => 줄[i][3] === 점(x.시작) && 줄[i][4] === 점(x.끝) && 줄[i][0].startsWith(String(x.차례)))
    봐(같, 말 + ' — 칸 날짜 · 차례 = lib(' + R.시작 + ' ~ ' + R.끝 + ' · 작업일 ' + R.작업일 + ')', JSON.stringify({ 화면: 줄.map((r) => [r[0], r[1], r[3], r[4]]), lib: R.줄.map((x) => [x.차례, x.열쇠, x.시작, x.끝]) }))
    return R
  }
  await p.goto(주소 + '/jeoksan/model' + (작업 ? '?ws=1' : ''), { waitUntil: 'domcontentloaded' })
  await 쉼(3500)
  await 누름(작업 ? /^🧪 예시$/ : /가상 예시/); await 쉼(2500)
  /* ① */
  봐(await 누름(작업 ? /^🗓 공정$/ : /🗓 공정$/), '🗓 공정 탭 단추')
  await 쉼(1200)
  봐(/시작 날을 넣으십시오/.test(await 판글()), '처음 — «시작 날을 넣으십시오» (날짜를 짐작해 채우지 않음)', await 판글())
  봐(await 누름(/^🧪 예시 값 넣기/), '🧪 예시 값 넣기'); await 쉼(1200)
  let R = await 맞대기('예시 값')
  봐(/2027-03-22 ~ 2027-04-10/.test(await 판글()) && /작업일 18일/.test(await 판글()), '공기 2027-03-22 ~ 2027-04-10 · 작업일 18일' + (팀 ? '(팀 따로)' : '(층마다 한 칸)'))
  await p.screenshot({ path: `${O}/${기기}_1_공정.png` })
  /* ② */
  await p.fill('input[aria-label="칸마다 작업일"]', '5'); await 쉼(900)
  R = await 맞대기('칸마다 5일')
  봐(R.작업일 === 15, '칸마다 5일 → 작업일 15', R.작업일)
  await p.fill('input[aria-label="칸마다 작업일"]', '6'); await 쉼(700)
  const 일A = 팀 ? '1층 A팀' : '1층', 열A = 팀 ? '1|z1' : '1|밖'
  await p.fill(`input[aria-label="${일A} 작업일"]`, '9'); await 쉼(900)
  R = await 맞대기(일A + ' 9일')
  봐(R.줄.find((x) => x.열쇠 === 열A).일수 === 9 && (await 모델()).공정.일수[열A] === 9, 일A + ' 작업일 9 — 모델에 남음')
  await p.fill(`input[aria-label="${일A} 작업일"]`, ''); await 쉼(700)
  await p.evaluate((n) => document.querySelector(`button[aria-label="${n} 아래로"]`).click(), 팀 ? 'FT A팀' : 'FT'); await 쉼(900)
  R = await 맞대기('▼ 차례')
  봐(R.줄[0].열쇠 === (팀 ? 'FT|z2' : '1|밖'), '▼ — 둘째 칸이 첫째로', R.줄.map((x) => x.열쇠))
  if (팀) {
    await p.evaluate(() => { const i = [...document.querySelectorAll('.gmd-gj-set label')].find((l) => /구간마다 팀 따로/.test(l.textContent)).querySelector('input'); i.click() }); await 쉼(900)
    R = await 맞대기('팀 따로 끔')
    봐(R.작업일 === 36, '팀 따로 끄면 한 줄 — 작업일 36', R.작업일)
    await p.evaluate(() => { const i = [...document.querySelectorAll('.gmd-gj-set label')].find((l) => /구간마다 팀 따로/.test(l.textContent)).querySelector('input'); i.click() }); await 쉼(700)
  } else 봐(!/구간마다 팀 따로/.test(await 판글()), '구간이 없으면 «팀 따로» 칸 없음')
  await p.evaluate((n) => document.querySelector(`button[aria-label="${n} 아래로"]`).click(), 팀 ? 'FT B팀' : '1층'); await 쉼(700)
  R = await 맞대기('차례 되돌림')
  봐(R.줄[0].열쇠 === (팀 ? 'FT|z1' : 'FT|밖') && R.작업일 === 18, '차례 되돌림 · 작업일 18', R.줄.map((x) => x.열쇠))
  /* 달마다 = lib */
  const 달 = 달마다(R)
  const 달화면 = await p.evaluate(() => [...document.querySelectorAll('table.gmd-gj-month tbody tr')].map((tr) => [...tr.querySelectorAll('td')].map((d) => d.innerText.trim())))
  const 수 = (t) => Number(String(t).replace(/[,\s]/g, ''))
  봐(달화면.length === 달.length + 1 && 달.every((o, i) => 달화면[i][0].startsWith(o.달) && 수(달화면[i][1]) === o.작업일 && Math.abs(수(달화면[i][3]) - o.양.콘크리트) < 0.006), '달마다 표 = lib(' + 달.map((o) => o.달 + ' ' + o.작업일 + '일').join(' · ') + ')', JSON.stringify(달화면))
  /* ③ */
  await p.fill('input[aria-label="기준일"]', '2027-03-30'); await 쉼(900)
  const 상글 = await p.evaluate(() => (document.querySelector('.gmd-gj-state') || {}).textContent || '')
  const k = 팀 ? 2 : 1
  봐(new RegExp('끝 ' + k).test(상글) && new RegExp('하는 중 ' + k).test(상글) && new RegExp('아직 ' + k).test(상글), '기준일 3.30 — 끝 ' + k + ' · 하는 중 ' + k + ' · 아직 ' + k, 상글)
  봐(await 누름(new RegExp('까지 끝난 칸 ' + k + '곳 → 기성 새 회차$')), '«끝난 칸 ' + k + '곳 → 기성 새 회차»'); await 쉼(1000)
  const M1 = await 모델()
  봐(M1.기성 && M1.기성.회차.length === 1 && M1.기성.회차[0].날짜 === '2027-03-30' && M1.기성.회차[0].칸.sort().join() === (팀 ? 'FT|z1,FT|z2' : 'FT|밖'), '모델 기성 1회(2027-03-30) = FT 칸', JSON.stringify(M1.기성))
  봐(new RegExp('기성 1회\\(2027-03-30\\)를 만들고 끝난 칸 ' + k + '곳').test(await 판글()), '알림 — 기성 1회 · 끝난 칸 ' + k + '곳')
  /* ④ 3D 재생 */
  봐(await 누름(/^🧊 3D 로 재생 ▶$/), '🧊 3D 로 재생'); await 쉼(2500)
  const 재생글 = () => p.evaluate(() => (document.querySelector('.gmd-gj-play') || {}).innerText || '')
  let g = await 재생글()
  봐(/2027-03-30/.test(g) && (팀 ? /하는 중 1층 A팀 · 1층 B팀/ : /하는 중 1층 ·/).test(g), '세우기 · 3D 에 재생 줄(3.30 · 하는 중 1층)', g)
  봐(await p.evaluate(() => !!document.querySelector('.gmd-3d .gmd-gj-play') && !!document.querySelector('.gmd-3d canvas')), '재생 줄은 3D 판 안(캔버스 위)')
  봐(await p.evaluate(() => { const q = document.querySelector('.gmd-gj-play').getBoundingClientRect(); return q.top >= -1 && q.top < innerHeight - 60 }), '재생 줄이 화면 안에 보임(폰은 맨 위로 올림)')
  봐(await p.evaluate(() => (document.querySelector('.gmd-3d select') || {}).value === '모두'), '재생하면 3D 는 모든 층')
  봐(await p.evaluate(() => [...document.querySelectorAll('.gmd-gj-playbar .btn')].every((b) => b.getBoundingClientRect().height < 40)), '재생 단추 한 줄(글이 안 꺾임)')
  await p.screenshot({ path: `${O}/${기기}_2_3D재생.png` })
  await 누름(/^▶ 재생$/); await 쉼(1800)
  g = await 재생글()
  const 날1 = (g.match(/(\d{4}-\d{2}-\d{2})/) || [])[1]
  봐(날1 && 날1 > '2027-03-30', '▶ 재생 → 날이 감(' + 날1 + ')', g)
  await 누름(/^⏸ 멈춤$/); await 쉼(400)
  await p.evaluate(() => document.querySelector('button[aria-label="끝으로"]').click()); await 쉼(800)
  g = await 재생글()
  봐(/2027-04-11/.test(g) && g.includes('끝 ' + n칸 + '/' + n칸 + '칸') && /골조 끝난 뒤/.test(g) && /다 끝/.test(g), '⏭ 끝으로 → 골조 끝난 뒤(4.11) · 다 끝 · 끝 ' + n칸 + '/' + n칸 + '칸', g)
  await p.evaluate(() => { const s = document.querySelector('.gmd-gj-play input[type=range]'); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(s, '17'); s.dispatchEvent(new Event('input', { bubbles: true })) }); await 쉼(800)
  g = await 재생글()
  봐(/2027-04-10/.test(g) && /18\/18일째/.test(g) && /하는 중 2층/.test(g), '끌개 18번째 = 끝 날 4.10 — 끝 칸은 아직 하는 중', g)
  await p.evaluate(() => document.querySelector('button[aria-label="처음으로"]').click()); await 쉼(800)
  g = await 재생글()
  봐(/2027-03-22/.test(g) && g.includes('끝 0/' + n칸 + '칸'), '⏮ 처음으로 → 3.22 · 끝 0/' + n칸 + '칸', g)
  await p.evaluate(() => { const s = document.querySelector('.gmd-gj-play input[type=range]'); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(s, '6'); s.dispatchEvent(new Event('input', { bubbles: true })) }); await 쉼(800)
  g = await 재생글()
  봐(/7\/18일째/.test(g) && /2027-03-29/.test(g), '끌개 7번째 작업일 → 3.29(3.28 일요일 건너뜀)', g)
  봐(await 누름(/^끄기$/), '끄기'); await 쉼(700)
  봐(!(await p.$('.gmd-gj-play')), '끄면 재생 줄 사라짐')
  /* ⑤ 엑셀 */
  await 누름(작업 ? /^🗓 공정$/ : /🗓 공정$/); await 쉼(1000)
  const 내 = p.waitForEvent('download', { timeout: 180000 }).catch(() => null)
  await 누름(/^📊 엑셀\(공정 시트 함께\)$/)
  const d = await 내
  await 쉼(800)
  const 검 = await p.evaluate(() => (document.querySelector('.gmd-xlchk-toast summary') || {}).textContent || '')
  봐(!!d && /모두 통과/.test(검), '📊 엑셀 → 받기 전 검사 모두 통과', 검)
  if (d) {
    const f = `${O}/${기기}_공정.xlsx`; await d.saveAs(f)
    const 책 = 엑셀읽기(fs.readFileSync(f))
    const 이름들 = 책.시트들.map((s) => s.이름)
    봐(['골조공정표', '월별예정', '공정조건', '기성내역(1회)'].every((n) => 이름들.includes(n)), '엑셀에 골조공정표 · 월별예정 · 공정조건(+ 기성내역 1회) 시트', 이름들.join(','))
    let 식 = 0
    for (const s of 책.시트들.filter((x) => /골조공정표|월별예정|공정조건/.test(x.이름))) for (const [, x] of s.칸) if (x.f) 식++
    봐(식 === 0, '공정 시트 — 숫자만(식 칸 0)', 식)
    const 표 = 책.시트들.find((s) => s.이름 === '골조공정표')
    let 네모 = 0
    for (const [, x] of 표.칸) if (x.v === '■') 네모++
    봐(네모 >= n칸, '골조공정표 — 주마다 ■ ' + 네모 + '칸', 네모)
  }
  /* 새로고침 뒤 */
  await p.reload({ waitUntil: 'domcontentloaded' }); await 쉼(4000)
  const M2 = await 모델()
  봐(M2.공정 && M2.공정.시작 === '2027-03-22' && M2.공정.기본 === 6, '새로고침 뒤에도 공정 그대로', JSON.stringify(M2.공정))
  /* ⑥ 넘침 */
  await 누름(작업 ? /^🗓 공정$/ : /🗓 공정$/); await 쉼(1200)
  for (const w of 폰 ? [320, 360, 390] : [860, 1280, 1476]) {
    await p.setViewportSize({ width: w, height: 812 }); await 쉼(900)
    const r = await p.evaluate(() => {
      const 넘 = document.documentElement.scrollWidth - window.innerWidth
      const 탭 = document.querySelector('.gmd-ws-tabs') || document.querySelector('.gmd-tabs')
      const 탭넘 = 탭 ? 탭.scrollWidth - 탭.clientWidth : 0
      const 판 = document.querySelector('.gmd-gj')
      const 판넘 = 판 ? Math.max(0, 판.getBoundingClientRect().right - window.innerWidth) : 0
      const 탭글 = 탭 ? [...탭.querySelectorAll('button')].map((b) => { const q = b.getBoundingClientRect(); return q.right <= window.innerWidth + 1 && q.left >= -1 }).every(Boolean) : true
      return { 넘, 탭넘, 판넘, 탭글 }
    })
    봐(r.넘 <= 1 && r.판넘 <= 1 && r.탭넘 <= 1 && r.탭글, w + ' px — 쪽 · 공정 판 · 위 탭 줄 가로 넘침 없음', JSON.stringify(r))
  }
  if (작업) {
    await 누름(/^세우기/); await 쉼(1000)
    for (const w of 폰 ? [320, 360, 390] : [860, 1280]) {
      await p.setViewportSize({ width: w, height: 812 }); await 쉼(700)
      const 넘 = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
      봐(넘 <= 1, w + ' px — 세우기 화면(탭 여섯) 가로 넘침 없음', 넘)
    }
  }
  봐(!오류.length, '화면 오류 없음', 오류.join(' | '))
  await c.close()
}
console.log(`\n🗓 공정 화면 · ${ok} 맞음 · ${bad} 틀림 · 캡처 ${O}`)
await 브.close()
process.exit(bad ? 1 : 0)
