// 🏷 G369 서식 «종이에 바로 쓰기» — 소장님 캡처(10/22 「사이트에서 쓰게 되어 있어야 하는데 … 어디서 작성하는 거지?」 「건설맵 주소를 제거할 수 있게」)
//   ① 열자마자 종이가 보임 — «이렇게 쓰세요» 열 줄 설명은 접어 둠(전엔 처음 온 기기에서 펴져 종이가 화면 아래로 밀림)
//   ② «맨 위 건설맵 주소 넣기» 를 끄면 맨 위 «K-건설맵 | k-conmap.com 건설 서식» 줄이 화면 · 인쇄 · PDF 에서 빠짐 — 다른 칸은 한 점도 안 바뀜
//   ③ 이 기기에 기억 — 새로고침 · 다른 서식에서도 꺼진 채
//   다른 예시 세 벌: 콘크리트 압축강도 관리대장(가로 · 1장) · 아차사고 보고서 · 오탁방지막 시공계획서(10장 — PDF 의 모든 장 맨 위)
//   돌리기: 4998 에 화면 빌드 + web/public/forms/g 를 얹은 뒤 node tools/시험_서식건설맵.mjs [PC|폰|모두]  (데이터베이스는 가짜)
import { createRequire } from 'module'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { execFileSync } from 'child_process'
import { 판짜기, 칸상자, 건설맵칸 } from '../web/src/lib/격자그림.js'
const require = createRequire('/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const 여기 = path.dirname(fileURLToPath(import.meta.url))
const 주소 = process.env.B || 'http://127.0.0.1:4998'
const 기기들 = (process.argv[2] || '모두') === '모두' ? ['PC', '폰'] : [process.argv[2]]
const 폴더 = process.env.CAP || '/tmp/g10/g369/ui'
fs.mkdirSync(폴더, { recursive: true })
let ok = 0, bad = 0
const 봐 = (c, m, 더 = '') => { if (c) ok++; else bad++; console.log(c ? '✓' : '✗', m, c ? '' : 더) }
const 서식 = (slug) => JSON.parse(fs.readFileSync(path.join(여기, '..', 'web', 'public', 'forms', 'g', slug + '.json'), 'utf8'))
/** 첫 장 맨 위 건설맵 칸 상자(pt) */
const 상자 = (sheet) => { const 판 = 판짜기(sheet); const x = sheet.cells.find(건설맵칸); return x ? { ...칸상자(판, 0, x), W: 판.W, H: 판.H } : null }
/** PDF 쪽 → 쪽마다 [어두운 점 수 (상자 안), 어두운 점 수(상자 밖)] — 72dpi 회색 그림 */
function PDF점(파일, 상자들) {
  const 뿌리 = 파일.replace(/\.pdf$/, '')
  for (const f of fs.readdirSync(path.dirname(파일))) if (f.startsWith(path.basename(뿌리) + '-')) fs.unlinkSync(path.join(path.dirname(파일), f))
  execFileSync('pdftoppm', ['-r', '72', '-gray', 파일, 뿌리])
  const 쪽들 = fs.readdirSync(path.dirname(파일)).filter((f) => f.startsWith(path.basename(뿌리) + '-') && f.endsWith('.pgm')).sort()
  return 쪽들.map((f, i) => {
    const b = fs.readFileSync(path.join(path.dirname(파일), f))
    const m = b.toString('latin1', 0, 64).match(/^P5\s+(\d+)\s+(\d+)\s+(\d+)\s/)
    const [w, h] = [+m[1], +m[2]]
    const 시작 = m[0].length
    const s = 상자들[i]
    let 안 = 0, 밖 = 0
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (b[시작 + y * w + x] >= 160) continue
      const X = x * (s ? s.W / w : 1), Y = y * (s ? s.H / h : 1)
      if (s && X >= s.x - 1 && X <= s.x + s.w + 1 && Y >= s.y - 1 && Y <= s.y + s.h + 1) 안++; else 밖++
    }
    return [안, 밖]
  })
}
const 예들 = [['gangdo', '콘크리트 압축강도 관리대장'], ['achasago', '아차사고 보고서'], ['otak-sigong', '오탁방지막 시공계획서']]

const 브 = await chromium.launch()
for (const 기기 of 기기들) {
  const 판 = await 브.newContext({ viewport: { width: 기기 === '폰' ? 390 : 1183, height: 860 }, acceptDownloads: true, deviceScaleFactor: 1, locale: 'ko-KR', timezoneId: 'Asia/Seoul' })
  await 판.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|geojs/, (r) => r.fulfill({ status: 200, body: '' }))
  await 판.route(/firebaseio\.com/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await 판.addInitScript(() => { if (!sessionStorage.getItem('시험처음')) { sessionStorage.setItem('시험처음', '1'); localStorage.setItem('kcm_notice_seen', '2026-10-필독') } try { sessionStorage.setItem('kcm_notice_seen', '2026-10-업체') } catch (e) {} ; window.print = () => { window.__인쇄 = (window.__인쇄 || 0) + 1 } })
  const A = await 판.newPage()
  const 오류 = []
  A.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
  const 첫그림 = () => A.evaluate(() => { const c = document.querySelector('.gx-page'); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; return { w: c.width, h: c.height, d: Array.from(d.filter((_, i) => i % 4 === 0)) } })
  for (const [i, [slug, 이름]] of 예들.entries()) {
    const S = 서식(slug)
    await A.goto(주소 + '/forms/' + slug, { waitUntil: 'domcontentloaded' })
    await A.waitForSelector('.gx-page', { timeout: 30000 })
    await A.waitForTimeout(700)
    const 칸 = A.locator('.gx-brand input')
    if (i === 0) {
      // ① 열자마자 종이가 보임
      const 위치 = await A.evaluate(() => ({ 펼침: document.querySelector('details.gx-how').open, 종이: Math.round(document.querySelector('.gx-page').getBoundingClientRect().top + scrollY), 작성: Math.round(document.getElementById('작성').getBoundingClientRect().top + scrollY), 높이: innerHeight }))
      봐(!위치.펼침 && 위치.종이 - 위치.작성 < (기기 === '폰' ? 400 : 330), `${기기} ① «이렇게 쓰세요» 접힘 · 종이가 쓰는 칸 바로 아래(작성 칸 위에서 ${위치.종이 - 위치.작성}px — 설명을 펴 둔 전엔 PC 591 · 폰 1,521px 밀림)`, JSON.stringify(위치))
      if (기기 === 'PC') 봐(위치.종이 < 위치.높이, `${기기} ① 첫 화면(860px) 안에서 종이가 보임 — 종이 위 ${위치.종이}px`, JSON.stringify(위치))
      await A.screenshot({ path: path.join(폴더, `G369_${기기}_처음화면.png`) })
      // 위 «종이에 바로 쓰기 → PDF» 를 누르면 → 종이 첫 줄이 화면 안(폰은 아래 단추 띠 위)
      await A.locator('button, a', { hasText: '종이에 바로 쓰기' }).first().click()
      await A.waitForTimeout(900)
      const 눌러 = await A.evaluate(() => { const r = document.querySelector('.gx-page').getBoundingClientRect(); const 띠 = innerWidth < 900 ? 110 : 0; return { 위: Math.round(r.top), 보임: r.top >= 0 && r.top + 60 <= innerHeight - 띠 } })
      봐(눌러.보임, `${기기} ① «종이에 바로 쓰기» 누르면 종이가 화면에 보임(종이 위 ${눌러.위}px)`, JSON.stringify(눌러))
      await A.screenshot({ path: path.join(폴더, `G369_${기기}_눌러서.png`) })
      await A.locator('details.gx-how summary').click()
      봐(await A.evaluate(() => document.querySelector('details.gx-how').open), `${기기} ① 설명은 눌러서 펼침`)
      await A.locator('details.gx-how summary').click()
      봐(await 칸.isChecked(), `${기기} ② 처음엔 «맨 위 건설맵 주소 넣기» 켜짐`)
    }
    // ② 끄면 맨 위 줄만 빠짐(화면)
    if (!(await 칸.isChecked())) await 칸.check()
    await A.locator('.gx-page').first().scrollIntoViewIfNeeded()
    await A.waitForTimeout(400)
    const 켬 = await 첫그림()
    await 칸.uncheck()
    await A.waitForTimeout(400)
    const 끔 = await 첫그림()
    const s = 상자(S.sheets[0]), k = 켬.w / s.W
    let 다른 = 0, 상자밖 = 0
    for (let p = 0; p < 켬.d.length; p++) if (켬.d[p] !== 끔.d[p]) { 다른++; const x = (p % 켬.w) / k, y = Math.floor(p / 켬.w) / k; if (!(x >= s.x - 2 && x <= s.x + s.w + 2 && y >= s.y - 2 && y <= s.y + s.h + 2)) 상자밖++ }
    봐(켬.w === 끔.w && 다른 > 30 && 상자밖 === 0, `${기기} ② ${이름} — 끄면 맨 위 건설맵 줄만 빠짐(바뀐 점 ${다른} · 그 줄 밖 0)`, `다른 ${다른} · 밖 ${상자밖}`)
    if (기기 === 'PC' && i === 0) await A.locator('.gx-page').first().screenshot({ path: path.join(폴더, 'G369_PC_압축강도_주소뺌.png') })
    // 인쇄 — 꺼진 채
    await A.locator('.fw-bar button', { hasText: '인쇄' }).first().click()
    await A.waitForTimeout(500)
    const 인쇄점 = await A.evaluate((b) => { const c = document.querySelector('#gx-인쇄 canvas, #gx-인쇄 img'); if (!c) return null; let cv = c; if (c.tagName === 'IMG') { cv = document.createElement('canvas'); cv.width = c.naturalWidth; cv.height = c.naturalHeight; cv.getContext('2d').drawImage(c, 0, 0) } const k = cv.width / b.W; const d = cv.getContext('2d').getImageData(Math.floor(b.x * k), Math.floor(b.y * k), Math.ceil(b.w * k), Math.ceil(b.h * k)).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] < 160) n++; return { n, w: cv.width } }, s)
    봐(인쇄점 && 인쇄점.n === 0, `${기기} ② ${이름} 인쇄 그림 — 맨 위 줄 자리에 글자 없음`, JSON.stringify(인쇄점))
    // PDF — 꺼진 채(모든 장 맨 위) · 켠 것과 견줌
    const 상자들 = []
    for (const sh of S.sheets) { const 판x = 판짜기(sh); const b = 상자(sh); 판x.쪽.forEach((_, pi) => 상자들.push(pi === 0 ? b : { x: -9, y: -9, w: 0, h: 0, W: 판x.W, H: 판x.H })) }
    const PDF받기 = async (이름표) => {
      const [dl] = await Promise.all([A.waitForEvent('download', { timeout: 120000 }), A.locator('.fw-bar button.primary').first().click()])
      const 파일 = path.join(폴더, `${기기}_${slug}_${이름표}.pdf`)
      await dl.saveAs(파일)
      return 파일
    }
    const 끈PDF = PDF점(await PDF받기('끔'), 상자들)
    await 칸.check(); await A.waitForTimeout(300)
    const 켠PDF = PDF점(await PDF받기('켬'), 상자들)
    await 칸.uncheck(); await A.waitForTimeout(200)
    const 장첫쪽 = 상자들.map((b, j) => (b.x >= 0 ? j : -1)).filter((j) => j >= 0)
    봐(끈PDF.length === 상자들.length && 장첫쪽.every((j) => 끈PDF[j][0] === 0 && 켠PDF[j][0] > 20) && 끈PDF.every((v, j) => Math.abs(v[1] - 켠PDF[j][1]) <= 2),
      `${기기} ② ${이름} PDF ${끈PDF.length}쪽 — 장마다 맨 위 줄: 끄면 0점 · 켜면 글자 · 다른 곳은 같음(시트 ${S.sheets.length}장)`, JSON.stringify({ 끔: 끈PDF.slice(0, 4), 켬: 켠PDF.slice(0, 4), n: 끈PDF.length, 상자: 상자들.length }))
  }
  // ③ 기억 — 새로고침 · 다른 서식
  await A.reload({ waitUntil: 'domcontentloaded' }); await A.waitForSelector('.gx-page', { timeout: 30000 })
  봐(!(await A.locator('.gx-brand input').isChecked()), `${기기} ③ 새로고침해도 꺼진 채`)
  await A.goto(주소 + '/forms/gangdo', { waitUntil: 'domcontentloaded' }); await A.waitForSelector('.gx-page', { timeout: 30000 })
  봐(!(await A.locator('.gx-brand input').isChecked()), `${기기} ③ 다른 서식(압축강도)에서도 꺼진 채`)
  if (기기 === '폰') { 봐((await A.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 1, `${기기} 가로 넘침 없음`); await A.screenshot({ path: path.join(폴더, 'G369_폰_처음화면_주소뺌.png') }) }
  봐(!오류.length, `${기기} 화면 오류 0`, 오류.join(' | '))
  await 판.close()
}
await 브.close()
console.log(`\n${ok} 통과 · ${bad} 실패`)
process.exit(bad ? 1 : 0)
