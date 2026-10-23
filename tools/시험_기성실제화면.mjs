// 🧪 기성(/change/gisung) — «실제» 설계내역서를 화면에 올려 보기 · G383 (2026-10-23)
//   소장님 「꼼꼼하게 해줘, 시험 가상으로 하지 말고…직접해」 · 「완벽하게 하되, 빨리 해줘」
//   4998 에 화면 빌드를 얹은 뒤  REAL=폴더1,폴더2 node tools/시험_기성실제화면.mjs [PC|폰|모두]
//   파일마다: 화면 «순공사비» = lib(기성읽기 · 1줄 보강) · 공내역서면 바로 알림 · «전체 한 번에 누계 37 %» 를 넣어 🎯 한눈에 계약 · 금회 · 누계 = lib 기성셈 · 화면 오류 없음 · 폰 가로 넘침 없음
//   실제 파일은 저장소에 넣지 않습니다(폴더만 받음). 올릴 때 이름은 «실제_설계내역서_예N.xlsx» 로 바꿔 올립니다. 만들기 · 내려받기는 누르지 않습니다.
import { createRequire } from 'module'
import fs from 'fs'
import path from 'path'
import { readWorkbook } from '../web/src/lib/qtoxlsx.js'
import * as K from '../web/src/lib/기성.js'
import { 격자로읽기 } from '../web/src/lib/비율.js'
const require = createRequire('/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const 주소 = process.env.B || 'http://127.0.0.1:4998'
const 기기들 = (process.argv[2] || '모두') === '모두' ? ['PC', '폰'] : [process.argv[2]]
if (!process.env.REAL) { console.log('REAL=폴더 를 주십시오'); process.exit(2) }
const 파일들 = []
for (const 폴 of process.env.REAL.split(',')) for (const n of fs.readdirSync(폴).filter((f) => /\.(xlsx|xlsm|xls)$/i.test(f)).sort()) 파일들.push(path.join(폴, n))
const 원 = (n) => Math.round(n).toLocaleString('ko-KR')
let ok = 0, bad = 0
const 봐 = (c, m, 더 = '') => { if (c) ok++; else bad++; console.log(c ? '✓' : '✗', m, c ? '' : String(더).slice(0, 300)) }
const 율 = 37
const 기대들 = 파일들.map((p, k) => {
  const b = fs.readFileSync(p)
  try {
    const 읽은 = K.기성읽기(readWorkbook(new Uint8Array(b)), path.basename(p), null, { 한줄보강: 격자로읽기 })
    const r = K.기성셈(읽은, { ...K.새기성(읽은), 전체: 율 })
    return { p, k, b, 합: 읽은.원읽은.합, 공: 읽은.말.some((m) => m.공내역서), 요: r.요약 }
  } catch (e) { return { p, k, 못읽음: String(e.message).slice(0, 80) } }
})
const 브 = await chromium.launch({ env: { ...process.env, LANG: 'C.UTF-8', LC_ALL: 'C.UTF-8' } })
for (const 기기 of 기기들) {
  const 판 = await 브.newContext({ viewport: { width: 기기 === '폰' ? 390 : 1280, height: 900 }, locale: 'ko-KR',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36' })
  await 판.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|geojs/, (r) => r.fulfill({ status: 200, body: '' }))
  await 판.route(/firebaseio\.com/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await 판.addInitScript(() => { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); try { sessionStorage.setItem('kcm_notice_seen', '2026-10-업체'); sessionStorage.setItem('kcm_visit_s', '1'); const d = new Date(), 두 = (n) => String(n).padStart(2, '0'), 날 = `${d.getFullYear()}-${두(d.getMonth() + 1)}-${두(d.getDate())}`, h = d.getHours(); localStorage.setItem('kcm_visit', JSON.stringify({ n: 5, first: 0, last: Date.now(), day: 날, slot: 날 + ' ' + (h < 12 ? '오전' : h < 18 ? '오후' : '저녁') })) } catch (e) {}; Object.defineProperty(navigator, 'webdriver', { get: () => false }) })
  const A = await 판.newPage()
  const 오류 = []
  A.on('pageerror', (e) => 오류.push(String(e).slice(0, 160)))
  console.log(`— ${기기} · 실제 ${파일들.length}부`)
  for (const e of 기대들) {
    if (e.못읽음) { console.log('  (lib 가 못 읽는 파일 — 건넘)', path.basename(e.p).slice(0, 13), e.못읽음); continue }
    const 이름 = `실제_설계내역서_예${e.k + 1}${path.extname(e.p).toLowerCase()}`
    await A.goto(주소 + '/change/gisung', { waitUntil: 'domcontentloaded' })
    await A.evaluate(() => { try { for (const k of Object.keys(localStorage)) if (/gisung|기성/.test(k)) localStorage.removeItem(k) } catch (x) {} })
    await A.waitForSelector('input[type=file]', { state: 'attached', timeout: 20000 })
    await A.locator('input[type=file]').first().setInputFiles({ name: 이름, mimeType: 'application/octet-stream', buffer: e.b })
    try { await A.locator('.cw-fs').first().waitFor({ timeout: 120000 }) } catch (x) { 봐(false, `${기기} ${이름} 읽힘`, await A.locator('body').innerText()); continue }
    const 글 = await A.locator('.cw-fs').first().innerText()
    봐(글.includes('순공사비 ' + 원(e.합) + '원'), `${기기} ${이름} 화면 순공사비 = lib ${원(e.합)}`, 글.slice(0, 200))
    const 몸 = await A.locator('body').innerText()
    봐(e.공 ? 몸.split('공내역서)입니다').length - 1 === 1 : !몸.includes('공내역서)입니다'), `${기기} ${이름} 공내역서 알림 ${e.공 ? '한 번만 뜸(G384)' : '안 뜸'}`, String(몸.split('공내역서)입니다').length - 1))
    if (!e.공) {
      await A.locator('label', { hasText: '전체 한 번에 누계' }).locator('input').first().fill(String(율))
      await A.waitForTimeout(700)
      const 판 = (await A.locator('.gg-tiles').first().innerText()).replace(/\s+/g, ' ')
      봐(판.includes('계약 ' + 원(e.요.계약)) && 판.includes('금회 기성 ' + 원(e.요.금회)) && 판.includes('누계 ' + 원(e.요.누계)),
        `${기기} ${이름} 전체 ${율}% — 🎯 계약 ${원(e.요.계약)} · 금회 ${원(e.요.금회)} = lib(${e.요.무엇})`, 판.slice(0, 300))
    }
    if (기기 === '폰') { const w = await A.evaluate(() => document.scrollingElement.scrollWidth - window.innerWidth); 봐(w <= 1, `${기기} ${이름} 가로 넘침 없음`, w) }
  }
  봐(오류.length === 0, `${기기} 화면 오류 없음`, 오류.join(' | '))
  await 판.close()
}
await 브.close()
console.log(`\n${bad ? '❌' : '✅'} 기성 실제 화면 ${ok + bad}개 중 ${ok} 맞음 · ${bad} 틀림`)
process.exit(bad ? 1 : 0)
