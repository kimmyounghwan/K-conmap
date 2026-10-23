// 🧪 하도급 내역서 만들기(/naeyeok/hado) — «실제» 설계내역서 · 변경내역서를 화면에 올려 보기 · G384 (2026-10-23)
//   소장님 「꼼꼼하게 해줘, 시험 가상으로 하지 말고…직접해」 · 「완벽하게 하되, 빨리 해줘」 · 「자, 시작해. 멈추지 말고, 그리고 올려」
//   4998 에 화면 빌드를 얹은 뒤  REAL=폴더1,폴더2 node tools/시험_하도급실제화면.mjs [PC|폰|모두]
//   파일마다(lib 와 같은지):
//     · 공내역서(단가 · 금액이 빈 것) → «공내역서입니다 — 하도급 내역서는 단가가 채워진 내역서로» 알림 · 율 칸(②) 안 나옴
//     · 내역으로 보이는 시트를 못 고른 파일 → 시트 목록이 보임(한 시트라도)
//     · 그 밖 → «내역 N줄 · 합계» = lib · «하도급 내역 금액» = lib · «원가계산서 도급액 → 하도급 도급액» = lib 원가미리 = 만든 엑셀 대비표 도급액
//     · 화면 오류 없음 · 폰 가로 넘침 없음
//   실제 파일은 저장소에 넣지 않습니다(폴더만 받음). 올릴 때 이름은 «실제_설계내역서_예N.xlsx» 로 바꿔 올립니다. 내려받기(링크)는 누르지 않습니다.
import { createRequire } from 'module'
import fs from 'fs'
import path from 'path'
import { readWorkbook } from '../web/src/lib/qtoxlsx.js'
import * as B from '../web/src/lib/비율.js'
import * as H from '../web/src/lib/하도급내역.js'
import * as V from '../web/src/lib/변경내역.js'
const require = createRequire('/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const 주소 = process.env.B || 'http://127.0.0.1:4998'
const 기기들 = (process.argv[2] || '모두') === '모두' ? ['PC', '폰'] : [process.argv[2]]
if (!process.env.REAL) { console.log('REAL=폴더 를 주십시오'); process.exit(2) }
const 파일들 = []
for (const 폴 of process.env.REAL.split(',')) for (const n of fs.readdirSync(폴).filter((f) => /\.(xlsx|xlsm|xls)$/i.test(f)).sort()) 파일들.push(path.join(폴, n))
const 원 = (n) => Math.round(n || 0).toLocaleString('ko-KR')
let ok = 0, bad = 0
const 봐 = (c, m, 더 = '') => { if (c) ok++; else bad++; console.log(c ? '✓' : '✗', m, c ? '' : String(더).slice(0, 300)) }

/* lib 로 셈한 기대값 — 화면과 같은 길(상태알기 → 상태펴기 → 격자로읽기(원가품목) → 고를만한시트 → 시트고르기) */
const 기대들 = 파일들.map((p, k) => {
  const b = fs.readFileSync(p)
  const e = { p, k, b }
  try {
    const 책0 = readWorkbook(new Uint8Array(b))
    const 알 = H.상태알기(책0, V); const 여 = 알.상태.length > 1
    const 편 = 여 ? H.상태펴기(책0, V, 알.상태.length - 1) : 책0
    let g
    try { g = B.격자로읽기(편, path.basename(p), { 원가품목: true }) } catch (x) { e.오류 = String(x.message); e.공 = /공내역서/.test(e.오류); return e }
    const 시 = B.고를만한시트(g.시트들)
    if (!시.length) { e.못고름 = true; e.공 = /공내역서/.test((g.시트말 || []).join(' ')); return e }
    const 읽 = B.시트고르기(g, 시)
    e.줄 = 읽.rows.length; e.합 = 읽.합
    if (!읽.rows.some((r) => Math.abs(r.총금액 || 0) >= 1)) { e.공 = true; return e }
    const 옵 = { 율: 80, 단수꼴: '버림', 관급그대로: true, 관급끔: new Set(), 직접: new Set(H.직접후보(읽)) }
    e.하 = H.하도급셈(읽, 옵).전체.하.합계
    const 미 = H.원가미리(편, 읽, 80, 옵)
    e.미 = 미 && 미.도급액 !== null ? 미 : null
    const 벌 = H.하도급한벌(b, 읽, { ...옵, 책: 편 })
    e.엑셀하도급 = 벌.원가하도급
  } catch (x) { e.lib오류 = String(x.message).slice(0, 120) }
  return e
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
    if (e.lib오류) { 봐(false, `${기기} lib 오류 ${path.basename(e.p).slice(0, 16)}`, e.lib오류); continue }
    const 이름 = `실제_설계내역서_예${e.k + 1}${path.extname(e.p).toLowerCase()}`
    await A.goto(주소 + '/naeyeok/hado', { waitUntil: 'domcontentloaded' })
    await A.waitForSelector('input[type=file]', { state: 'attached', timeout: 20000 })
    const 오류전 = 오류.length
    await A.locator('input[type=file]').first().setInputFiles({ name: 이름, mimeType: 'application/octet-stream', buffer: e.b })
    try { await A.waitForFunction(() => !document.body.innerText.includes('내역서를 읽는 중입니다'), null, { timeout: 120000 }); await A.waitForTimeout(150) } catch (x) { 봐(false, `${기기} ${이름} 읽기 끝`, ''); continue }
    const 글 = await A.locator('body').innerText()
    const 율칸 = await A.locator('text=② 하도급율').count()
    if (e.공) {
      봐(/공내역서입니다 — 하도급 내역서는 단가가 채워진 내역서/.test(글) && !/비율을 맞출 금액이 없습니다/.test(글), `${기기} ${이름} 공내역서 알림(하도급 말)`, 글.slice(0, 300))
      봐(율칸 === 0, `${기기} ${이름} 공내역서면 율 칸 없음`)
    } else if (e.오류) {
      봐(글.includes('내역서 표를 못 찾았습니다'), `${기기} ${이름} 표 못 찾음 알림`, 글.slice(0, 200))
    } else if (e.못고름) {
      const 시트칸 = await A.locator('.tlsheets input[type=checkbox]').count()
      봐(시트칸 >= 1 && /쓸 시트를 켜 주십시오/.test(글), `${기기} ${이름} 시트를 못 골랐으면 시트 목록 · 켜 달라는 말`, '칸 ' + 시트칸)
    } else {
      봐(글.includes(`내역 ${원(e.줄)}줄`) && 글.includes(`합계 ${원(e.합)}원`), `${기기} ${이름} 내역 ${원(e.줄)}줄 · 합계 ${원(e.합)}원`, (글.match(/내역 [\d,]+줄[^\n]{0,60}/) || [''])[0])
      봐(율칸 === 1, `${기기} ${이름} 율 칸 보임`)
      const 하글 = (글.match(/하도급 내역 금액\s*([\d,]+)\s*원/) || [])[1]
      봐(하글 === 원(e.하), `${기기} ${이름} 하도급 내역 금액 ${원(e.하)}원`, 하글)
      if (e.미) {
        const m = 글.match(/원가계산서 도급액\s*([\d,]+)\s*원\s*→\s*하도급 도급액\s*([\d,]+)/)
        봐(!!m && m[1] === 원(e.미.도급액) && m[2] === 원(e.미.하도급액), `${기기} ${이름} 원가 도급액 ${원(e.미.도급액)} → 하도급 ${원(e.미.하도급액)}`, m && m[0])
        봐(e.미.하도급액 === e.엑셀하도급, `${기기} ${이름} 화면 하도급 도급액 = 엑셀 대비표`, e.미.하도급액 + ' / ' + e.엑셀하도급)
      }
    }
    봐(오류.length === 오류전, `${기기} ${이름} 화면 오류 없음`, 오류.slice(오류전).join(' | '))
    if (기기 === '폰') {
      const 넘침 = await A.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
      봐(넘침 <= 1, `${기기} ${이름} 가로 넘침 없음`, 넘침)
    }
  }
  await 판.close()
}
await 브.close()
console.log(`\n${ok} 맞음 · ${bad} 틀림`)
if (bad) process.exit(1)
