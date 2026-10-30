// 🧊 G467 골조 모델 «🧊 IFC 받기» 화면 시험 — 가상 예시 모델만(실제 현장 아님)
//   화면 빌드를 얹은 뒤  B=http://127.0.0.1:4467 node tools/시험_골조IFC화면.mjs [PC|폰|보통|모두]   (OUT=폴더 면 받은 IFC 를 거기 둠)
//   ① 물량 탭 «🧊 IFC 받기» → 받기 전 검사 모두 통과 · 받음 → 받은 글자 = 같은 모델을 lib 로 쓴 IFC(때 빼고) · 부재 수 = 3D 덩어리
//   ② 🗓 공정 탭 🧪 예시 값 → «🧊 IFC(공정 담김)» → 과제 = 칸 수 · 과제마다 시작 · 끝
//   ③ 가로 넘침 없음(폰 320 · 360 · 390 / PC 860 · 1280 · 1476 — 물량 · 공정 판) · 화면 오류 없음
import { createRequire } from 'module'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { 정돈, 모델셈 } from '../web/src/lib/골조모델.js'
import { 공정셈 } from '../web/src/lib/골조공정.js'
import { 골조IFC, 골조IFC검사 } from '../web/src/lib/골조IFC.js'
const require = createRequire(process.env.PW || '/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const 주소 = process.env.B || 'http://127.0.0.1:4467'
const 기기들 = (process.argv[2] || '모두') === '모두' ? ['PC', '폰', '보통'] : [process.argv[2]]
const O = process.env.OUT || fs.mkdtempSync(path.join(os.tmpdir(), 'kcm_g467_'))
fs.mkdirSync(O, { recursive: true })
let ok = 0, bad = 0
const 브 = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] })
const 때빼고 = (t) => t.replace(/FILE_NAME\([^\n]*\n/, '').replace(/IFCOWNERHISTORY\(([^)]*),\d+\)/, 'IFCOWNERHISTORY($1,0)').replace(/,'\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}',\$,\$,\$,\$,/, ",'때',$,$,$,$,")
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
  const 받기 = async (re, 이름) => {
    const 내 = p.waitForEvent('download', { timeout: 120000 }).catch(() => null)
    await p.evaluate(() => { const x = document.querySelector('.gmd-xlchk-toast .gmd-x'); if (x) x.click() })
    봐(await 누름(re), re.source.replace(/[\\^$]/g, '') + ' 단추')
    const d = await 내
    await 쉼(700)
    const 검 = await p.evaluate(() => (document.querySelector('.gmd-xlchk-toast summary') || {}).textContent || '')
    if (!d) { 봐(false, '받기 전 검사 모두 통과 · 받음', 검); return null }
    const f = path.join(O, 기기 + '_' + 이름 + '.ifc'); await d.saveAs(f)
    const t = fs.readFileSync(f, 'utf8')
    /* 한글 파일 이름은 머리 없는 크롬에서 «download» 로 보임(받는 이름 문제 아님) — 글자 머리로 IFC 인지 봄 */
    봐(/모두 통과/.test(검) && t.startsWith('ISO-10303-21;') && /FILE_SCHEMA\(\('IFC4'\)\)/.test(t), '받기 전 검사 모두 통과 · IFC4 받음', 검)
    return t
  }
  await p.goto(주소 + '/jeoksan/model' + (작업 ? '?ws=1' : ''), { waitUntil: 'domcontentloaded' })
  await 쉼(3500)
  await 누름(작업 ? /^🧪 예시$/ : /가상 예시/); await 쉼(2500)
  /* ① 물량 탭 */
  봐(await 누름(작업 ? /^물량/ : /④ 물량/), '물량 탭')
  await 쉼(1200)
  let 글 = await 받기(/^🧊 IFC 받기$/, '물량')
  if (글) {
    const M = await 모델(), S = 모델셈(M)
    const r = 골조IFC(M, S, { 이름: M.이름 || '골조 모델', 파일: 'x' })
    봐(때빼고(글) === 때빼고(r.글), '받은 IFC = 같은 모델을 lib 로 쓴 IFC(때 빼고 · ' + 글.length.toLocaleString() + '자)', [글.length, r.글.length])
    const 검 = 골조IFC검사(글, r.셈, M, S)
    봐(검.통과 && r.셈.부재 === S.덩어리.length, '받은 파일 다시 검사 통과 · 부재 ' + r.셈.부재 + ' = 덩어리', 검.줄.filter((x) => !x.됨))
    봐(!/=IFCTASK\(/.test(글), '공정 없으면 과제 없음')
  }
  /* ② 공정 탭 */
  봐(await 누름(작업 ? /^🗓 공정$/ : /🗓 공정$/), '🗓 공정 탭'); await 쉼(1000)
  봐(await p.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /^🧊 IFC\(공정 담김\)$/.test(x.textContent.trim())); return !!b && b.disabled }), '공정이 다 안 정해지면 «🧊 IFC(공정 담김)» 꺼짐')
  await 누름(/^🧪 예시 값 넣기/); await 쉼(1200)
  글 = await 받기(/^🧊 IFC\(공정 담김\)$/, '공정')
  if (글) {
    const M = await 모델(), S = 모델셈(M), R = 공정셈(M, S)
    const 과 = 글.split('\n').filter((l) => /=IFCTASK\(/.test(l)).length
    봐(R.다됨 && 과 === R.줄.length && R.줄.every((x) => 글.includes("'" + x.시작 + "T08:00:00','" + x.끝 + "T17:00:00'")), '과제 ' + 과 + ' = 칸 ' + R.줄.length + ' · 과제마다 시작 · 끝 = 공정', 과)
  }
  /* ③ 넘침 */
  for (const [탭, re] of [['물량', 작업 ? /^물량/ : /④ 물량/], ['공정', 작업 ? /^🗓 공정$/ : /🗓 공정$/]]) {
    await 누름(re); await 쉼(900)
    for (const w of 폰 ? [320, 360, 390] : [860, 1280, 1476]) {
      await p.setViewportSize({ width: w, height: 812 }); await 쉼(700)
      const r = await p.evaluate(() => {
        const 넘 = document.documentElement.scrollWidth - window.innerWidth
        const b = [...document.querySelectorAll('.gmd-ifcbtn')].filter((x) => x.offsetParent !== null)
        const 단추 = b.every((x) => { const q = x.getBoundingClientRect(); return q.right <= window.innerWidth + 1 && q.height < 60 })
        return { 넘, 단추, 수: b.length }
      })
      봐(r.넘 <= 1 && r.단추 && r.수 === 1, w + ' px — ' + 탭 + ' 판 넘침 없음 · IFC 단추 한 줄', JSON.stringify(r))
    }
    await p.setViewportSize(폰 ? { width: 390, height: 844 } : { width: 1476, height: 812 }); await 쉼(500)
  }
  봐(!오류.length, '화면 오류 없음', 오류.join(' | '))
  await c.close()
}
console.log(`\n🧊 IFC 화면 · ${ok} 맞음 · ${bad} 틀림 · 받은 파일 ${O}`)
await 브.close()
process.exit(bad ? 1 : 0)
