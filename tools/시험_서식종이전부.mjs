// ✍️ G361 서식 «종이에 바로 쓰기» 전부 훑기 — 엑셀로 굽던 서식(forms2) · 다시 만든 원본 틀(o-*) 모두
//   서식마다: 종이 쪽 수(판짜기와 같나) · ✍ 예시 채우기 → 자동 계산 칸에 값 · 화면 오류 0 · 폰 가로 넘침 0 · (PC) 그림 PDF 쪽 수 · 글꼴 0
//   + 다른 서식(안전 웹 서식 · 위험성평가 · 공내역서)은 전처럼 뜨나
//   돌리기: 4998 에 빌드 + web/public/forms/g 를 얹은 뒤 node tools/시험_서식종이전부.mjs [PC|폰] [슬러그…]
import { createRequire } from 'module'
import fs from 'fs'
import { 판짜기 } from '../web/src/lib/격자그림.js'
const require = createRequire('/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const 주소 = process.env.B || 'http://127.0.0.1:4998'
const 기기 = process.argv[2] || 'PC'
const 고른 = process.argv.slice(3)
const D = JSON.parse(fs.readFileSync('/tmp/g10/fm55/web/src/data/forms.json', 'utf8')).forms
const O = JSON.parse(fs.readFileSync('/tmp/g10/fm55/web/src/data/forms_orig.json', 'utf8'))
const ORIG = Array.isArray(O) ? O : O.forms
let 격자들 = [...D.filter((f) => f.gen === 'forms2').map((f) => f.slug), ...ORIG.filter((o) => o.re).map((o) => o.slug)]
if (고른.length) 격자들 = 격자들.filter((s) => 고른.includes(s))
const 다른들 = 고른.length ? [] : [...D.filter((f) => f.gen === 'web').slice(0, 4).map((f) => f.slug), ...D.filter((f) => f.gen === 'wihgen').slice(0, 2).map((f) => f.slug), ...D.filter((f) => f.gen === 'naeyeok').map((f) => f.slug)]
let ok = 0, bad = 0
const 틀림 = []
const 봐 = (c, m, 더 = '') => { if (c) ok++; else { bad++; 틀림.push(`✗ ${m} ${더}`); console.log('✗', m, 더) } }
const 브 = await chromium.launch()
const w = 기기 === '폰' ? 390 : 1280
const 판 = await 브.newContext({ viewport: { width: w, height: 844 }, acceptDownloads: true })
await 판.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|geojs/, (r) => r.fulfill({ status: 200, body: '' }))
await 판.route(/firebaseio\.com/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
await 판.addInitScript(() => { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); try { sessionStorage.setItem('kcm_notice_seen', '2026-10-업체') } catch (e) {} })
const A = await 판.newPage()
let 오류 = []
A.on('pageerror', (e) => 오류.push(String(e).slice(0, 160)))
const t0 = Date.now()
let n = 0
for (const slug of 격자들) {
  n++
  오류 = []
  const doc = JSON.parse(fs.readFileSync(`/tmp/g10/fm55/web/public/forms/g/${slug}.json`, 'utf8'))
  const 쪽수 = doc.sheets.reduce((a, s) => a + 판짜기(s).쪽.length, 0)
  try {
    await A.goto(`${주소}/forms/${slug}`, { waitUntil: 'domcontentloaded' })
    await A.waitForFunction(() => window.__격자 && document.querySelectorAll('canvas.gx-page').length, null, { timeout: 25000 })
  } catch (e) { 봐(false, `${slug} 종이가 안 뜸`, e.message.slice(0, 80)); continue }
  await A.waitForTimeout(250)
  const 캔 = await A.evaluate(() => document.querySelectorAll('canvas.gx-page').length)
  봐(캔 === 쪽수, `${slug} 쪽 수`, `화면 ${캔} · 셈 ${쪽수}`)
  const 예 = A.locator('button', { hasText: '예시 채우기' })
  if (await 예.count()) {
    await 예.click(); await A.waitForTimeout(200)
    const r = await A.evaluate(() => { const b = window.__격자; let 값 = 0, 오 = 0, 칸 = 0; b.doc.sheets.forEach((s, si) => { for (const x of s.cells) if (x[5] === 2 && x[1] <= s.pc) { 칸++; const v = b.책.값(si, x[0], x[1]); if (v && v.e) 오++; else if (v !== '' && v !== 0 && v !== null) 값++ } }); return { 값, 오, 칸 } })
    봐(r.칸 === 0 || r.값 > 0, `${slug} 예시 → 계산 칸에 값`, JSON.stringify(r))
    봐(r.오 === 0, `${slug} 예시 → 오류 칸 0`, JSON.stringify(r))
  }
  if (기기 === '폰') 봐((await A.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 1, `${slug} 폰 가로 넘침`)
  if (기기 === 'PC' && !process.env.NOPDF) {
    try {
      const 고름 = 쪽수 > 60 ? '1-3' : ''              // 쪽이 아주 많은 서식(검측 300항목)은 쪽을 골라야 PDF 를 만듦(화면도 그렇게 알림)
      if (고름) await A.locator('.gx-range input').fill(고름)
      const [dl] = await Promise.all([A.waitForEvent('download', { timeout: 30000 }), A.locator('button', { hasText: 'PDF 저장' }).click()])
      const p = await dl.path()
      const buf = fs.readFileSync(p)
      const 글 = buf.toString('latin1')
      const 쪽 = (글.match(/\/Type \/Page\b/g) || []).length
      봐(글.startsWith('%PDF') && 쪽 === (고름 ? 3 : 쪽수) && !/\/Font/.test(글), `${slug} 그림 PDF`, `쪽 ${쪽}/${고름 ? 3 : 쪽수} · ${(buf.length / 1024).toFixed(0)}KB`)
    } catch (e) { 봐(false, `${slug} PDF 안 됨`, e.message.slice(0, 80)) }
  }
  봐(오류.length === 0, `${slug} 화면 오류`, 오류.join(' | '))
  if (n % 20 === 0) console.log(`… ${n}/${격자들.length} · ${((Date.now() - t0) / 1000).toFixed(0)}초 · 틀림 ${bad}`)
}
for (const slug of 다른들) {
  오류 = []
  await A.goto(`${주소}/forms/${slug}`, { waitUntil: 'domcontentloaded' })
  await A.waitForTimeout(1500)
  const 있음 = await A.evaluate(() => ({ 격자: !!document.querySelector('canvas.gx-page'), 작성: !!document.querySelector('.fw, .fw-form, .card'), 글: document.body.innerText.length }))
  봐(!있음.격자 && 있음.글 > 300, `${slug} (다른 서식) 전처럼 뜸`, JSON.stringify(있음))
  봐(오류.length === 0, `${slug} (다른 서식) 화면 오류`, 오류.join(' | '))
}
await 브.close()
console.log(`\n${기기} · 서식 ${격자들.length} + 다른 ${다른들.length} · ${ok} 통과 · ${bad} 실패 · ${((Date.now() - t0) / 1000).toFixed(0)}초`)
process.exit(bad ? 1 : 0)
