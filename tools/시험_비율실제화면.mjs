// 🧪 80% 비율(/naeyeok/ratio) — «실제» 설계내역서를 화면에 올려 보기 · G380 (2026-10-23)
//   소장님 「꼼꼼하게 해줘, 시험 가상으로 하지 말고…직접해」 · 「미루지 말고 … 확실하게 고치고 넘어가야지」
//   4998 에 화면 빌드를 얹은 뒤  REAL=폴더1,폴더2 node tools/시험_비율실제화면.mjs [PC|폰|모두]
//   파일마다: 화면 «당초 합계» = lib 셈(lib/비율.js 고를만한시트 · 시트고르기) · 노무비 ↔ 원가계산서 직접노무비 알림(맞음 · 경비 묶음 빼고 · 시트 몫 · 다름)
//            · 원본 머리 금액이 첫 품목을 뺀 합이면 알림 · 화면 오류 없음 · 폰 가로 넘침 없음
//   실제 파일은 저장소에 넣지 않습니다(폴더만 받음). 올릴 때 이름은 «실제_설계내역서_예N.xlsx» 로 바꿔 올립니다.
//   CAP=폴더 를 주면 알림 줄만(공사명 · 상호가 없는 칸) 잘라 PC 캡처를 남깁니다.
import { createRequire } from 'module'
import fs from 'fs'
import path from 'path'
import { readNaeyeok, 책읽기, 고를만한시트, 시트고르기, 노무맞대기 } from '../web/src/lib/비율.js'
import { 원가표찾기 } from '../web/src/lib/낙찰맞추기.js'
const require = createRequire('/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const 주소 = process.env.B || 'http://127.0.0.1:4998'
const 기기들 = (process.argv[2] || '모두') === '모두' ? ['PC', '폰'] : [process.argv[2]]
const 캡 = process.env.CAP || ''
if (캡) fs.mkdirSync(캡, { recursive: true })
if (!process.env.REAL) { console.log('REAL=폴더 를 주십시오'); process.exit(2) }
const 파일들 = []
/* G381 — 구형 엑셀(.xls)도(전엔 화면이 «못 읽습니다» 로 돌려보냄) */
for (const 폴 of process.env.REAL.split(',')) for (const n of fs.readdirSync(폴).filter((f) => /\.(xlsx|xlsm|xls)$/i.test(f)).sort()) 파일들.push(path.join(폴, n))
const 원 = (n) => Math.round(n).toLocaleString('ko-KR')
let ok = 0, bad = 0
const 봐 = (c, m, 더 = '') => { if (c) ok++; else bad++; console.log(c ? '✓' : '✗', m, c ? '' : String(더).slice(0, 300)) }
/* lib 가 기대하는 것 */
const 기대들 = 파일들.map((p, k) => {
  const b = fs.readFileSync(p); const ab = b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)
  try {
    const 책 = 책읽기(ab); const g = readNaeyeok(ab, 'x.xlsx'); const 고 = 고를만한시트(g.시트들)
    if (!고.length) return { p, k, 없음: true }
    const 읽은 = 시트고르기(g, 고)
    let 원가 = null; try { 원가 = 원가표찾기(책, g.시트들.filter((s) => !/원가/.test(s.시트)).map((s) => s.시트)) } catch (e) { 원가 = null }
    return { p, k, b, 합: 읽은.합, 노무: 노무맞대기(읽은, 원가), 첫뺌: 읽은.모음들.filter((m) => m.첫뺌).length }
  } catch (e) { return { p, k, 못읽음: String(e.message).slice(0, 60) } }
})
const 브 = await chromium.launch({ env: { ...process.env, LANG: 'C.UTF-8', LC_ALL: 'C.UTF-8' } })
for (const 기기 of 기기들) {
  const 판 = await 브.newContext({ viewport: { width: 기기 === '폰' ? 390 : 1280, height: 900 }, locale: 'ko-KR',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36' })
  await 판.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|geojs/, (r) => r.fulfill({ status: 200, body: '' }))
  await 판.route(/firebaseio\.com/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await 판.addInitScript(() => { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); try { sessionStorage.setItem('kcm_notice_seen', '2026-10-업체'); sessionStorage.setItem('kcm_visit_s', '1'); const d = new Date(), 두 = (n) => String(n).padStart(2, '0'), 날 = `${d.getFullYear()}-${두(d.getMonth() + 1)}-${두(d.getDate())}`, h = d.getHours(); localStorage.setItem('kcm_visit', JSON.stringify({ n: 5, first: 0, last: Date.now(), day: 날, slot: 날 + ' ' + (h < 12 ? '오전' : h < 18 ? '오후' : '저녁') })) } catch (e) {};   /* 인사 쪽지가 캡처를 덮지 않게 */ Object.defineProperty(navigator, 'webdriver', { get: () => false }) })
  const A = await 판.newPage()
  const 오류 = []
  A.on('pageerror', (e) => 오류.push(String(e).slice(0, 160)))
  console.log(`— ${기기} · 실제 ${파일들.length}부`)
  for (const e of 기대들) {
    if (e.없음 || e.못읽음) continue
    const 이름 = `실제_설계내역서_예${e.k + 1}${path.extname(e.p).toLowerCase()}`
    await A.goto(주소 + '/naeyeok/ratio', { waitUntil: 'domcontentloaded' })
    await A.waitForSelector('input[type=file]', { state: 'attached', timeout: 20000 })
    await A.locator('input[type=file]').first().setInputFiles({ name: 이름, mimeType: 'application/octet-stream', buffer: e.b })
    /* 아래 도움말에도 «당초 합계» 낱말이 있어 ① 칸 안에서 기다립니다 */
    try { await A.locator('.card', { hasText: '① 내역서 올리기' }).first().locator('p', { hasText: '당초 합계' }).first().waitFor({ timeout: 90000 }) } catch (x) { 봐(false, `${기기} ${이름} 읽힘`, await A.locator('body').innerText()); continue }
    await A.waitForTimeout(400)
    const 글 = await A.locator('.card', { hasText: '① 내역서 올리기' }).first().innerText()
    봐(글.includes('당초 합계 ' + 원(e.합) + '원'), `${기기} ${이름} 화면 당초 합계 = lib ${원(e.합)}`, 글.slice(0, 200))
    if (e.노무) {
      const n = e.노무
      const 말 = n.다름 ? /직접노무비 [\d,]+원의 [\d.]+(배입니다|%뿐입니다)/.test(글)
        : 글.includes('✓ 읽은 노무비가 원가계산서') && (n.맞음 !== '경비몫' || 글.includes(원(n.경비몫) + '원 빼고')) && (n.맞음 !== '시트' || 글.includes('시트 몫'))
      봐(말, `${기기} ${이름} 노무비 ↔ 직노 ${n.다름 ? '«다름» 알림' : '«맞음»(' + n.맞음 + ')'} ${(n.비 * 100).toFixed(1)}%`, 글.slice(0, 400))
    } else 봐(!/직접노무비 [\d,]+원(의|과)/.test(글), `${기기} ${이름} 원가계산서 직노를 못 찾은 파일 — 노무비 알림 없음`, 글.slice(0, 300))
    봐(!!e.첫뺌 === 글.includes('첫 품목을 빼고'), `${기기} ${이름} 첫 품목 뺀 머리 알림 ${e.첫뺌 ? e.첫뺌 + '곳' : '없음'}`)
    if (/\.xls$/i.test(e.p)) {
      const 몸 = await A.locator('body').innerText()
      봐(몸.includes('구형 엑셀(.xls)입니다') && await A.locator('button', { hasText: '올린 엑셀 그대로' }).count() === 0 && await A.locator('button', { hasText: '새 엑셀 한 벌' }).count() === 1,
        `${기기} ${이름} 구형 엑셀 — 알림 · «새 엑셀 한 벌» 만`, 몸.slice(0, 200))
      if (캡 && 기기 === 'PC') await A.locator('.note', { hasText: '구형 엑셀' }).first().screenshot({ path: path.join(캡, `PC_예${e.k + 1}_xls.png`) })
    }
    if (캡 && 기기 === 'PC') {
      /* 알림 줄만 — 파일 이름 · 시트 칩 · 품목표는 찍지 않습니다 */
      const 줄들 = A.locator('.card', { hasText: '① 내역서 올리기' }).first().locator('p', { hasText: /당초 합계|직접노무비|첫 품목을 빼고/ })
      const 개 = await 줄들.count()
      for (let i = 0; i < 개; i++) await 줄들.nth(i).screenshot({ path: path.join(캡, `PC_예${e.k + 1}_${i + 1}.png`) })
    }
    if (기기 === '폰') { const w = await A.evaluate(() => document.scrollingElement.scrollWidth - window.innerWidth); 봐(w <= 1, `${기기} ${이름} 가로 넘침 없음`, w) }
  }
  봐(오류.length === 0, `${기기} 화면 오류 없음`, 오류.join(' | '))
  await 판.close()
}
await 브.close()
console.log(`\n${bad ? '❌' : '✅'} 비율 실제 화면 ${ok + bad}개 중 ${ok} 맞음 · ${bad} 틀림`)
process.exit(bad ? 1 : 0)
