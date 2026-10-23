// 🧪 시공계획서 자동 만들기(/tools/sigong) — «실제» 설계내역서 · 변경내역서를 화면에 올려 보기 · G385 (2026-10-23)
//   소장님 「꼼꼼하게 해줘, 시험 가상으로 하지 말고…직접해」 · 「자, 시작해. 멈추지 말고, 그리고 올려」
//   4998 에 화면 빌드를 얹은 뒤  REAL=폴더1,폴더2 node tools/시험_시공계획실제화면.mjs [PC|폰|모두]
//   소장님 브라우저로 봄(localStorage kcm_op=1 — 잠긴 «내 파일 올리기» 를 씀). 파일마다(lib 와 같은지):
//     · 읽힘 → «📊 이름 — 품목 N개» N = lib 내역읽기(1줄 보강) · 금액 있으면 S커브 보할 표 · 산업안전보건관리비 «계상액 : X원» = 원가계산서 그 줄
//     · 원가계산서 · 일위대가 시트만 있는 파일 → «내역서 시트를 못 찾았습니다» · 표를 못 찾는 파일 → 그 말
//     · 화면 오류 없음 · 폰 가로 넘침 없음
//   실제 파일은 저장소에 넣지 않습니다(폴더만 받음). 올릴 때 이름은 «실제_설계내역서_예N.xlsx» 로 바꿔 올립니다. 받기(PDF · 한글 · 워드 · 엑셀)는 누르지 않습니다.
import { createRequire } from 'module'
import fs from 'fs'
import path from 'path'
import { readWorkbook } from '../web/src/lib/qtoxlsx.js'
import * as S from '../web/src/lib/시공계획.js'
import { 격자로읽기 } from '../web/src/lib/비율.js'
const require = createRequire('/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const 주소 = process.env.B || 'http://127.0.0.1:4998'
const 기기들 = (process.argv[2] || '모두') === '모두' ? ['PC', '폰'] : [process.argv[2]]
if (!process.env.REAL) { console.log('REAL=폴더 를 주십시오'); process.exit(2) }
const 파일들 = []
for (const 폴 of process.env.REAL.split(',')) for (const n of fs.readdirSync(폴).filter((f) => /\.(xlsx|xlsm|xls)$/i.test(f)).sort()) 파일들.push(path.join(폴, n))
const 원 = (n) => Math.round(n || 0).toLocaleString('ko-KR')
let ok = 0, bad = 0
const 산본 = { PC: 0, 폰: 0 }
const 봐 = (c, m, 더 = '') => { if (c) ok++; else bad++; console.log(c ? '✓' : '✗', m, c ? '' : String(더).slice(0, 300)) }

const 기대들 = 파일들.map((p, k) => {
  const b = fs.readFileSync(p)
  const e = { p, k, b }
  try {
    const 자 = S.내역읽기(readWorkbook(new Uint8Array(b)), path.basename(p), { 한줄보강: 격자로읽기 })
    e.품 = 자.품목들.length; e.금 = 자.금액있음; e.산 = 자.머리.산안비 || 0
  } catch (x) { e.오류 = String(x.message) }
  return e
})

const 브 = await chromium.launch({ env: { ...process.env, LANG: 'C.UTF-8', LC_ALL: 'C.UTF-8' } })
for (const 기기 of 기기들) {
  const 판 = await 브.newContext({ viewport: { width: 기기 === '폰' ? 390 : 1280, height: 900 }, locale: 'ko-KR',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36' })
  await 판.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|geojs/, (r) => r.fulfill({ status: 200, body: '' }))
  await 판.route(/firebaseio\.com/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await 판.addInitScript(() => { localStorage.setItem('kcm_op', '1'); localStorage.setItem('kcm_notice_seen', '2026-10-필독'); try { sessionStorage.setItem('kcm_notice_seen', '2026-10-업체'); sessionStorage.setItem('kcm_visit_s', '1') } catch (e) {}; Object.defineProperty(navigator, 'webdriver', { get: () => false }) })
  const A = await 판.newPage()
  const 오류 = []
  A.on('pageerror', (e) => 오류.push(String(e).slice(0, 160)))
  console.log(`— ${기기} · 실제 ${파일들.length}부`)
  for (const e of 기대들) {
    const 이름 = `실제_설계내역서_예${e.k + 1}${path.extname(e.p).toLowerCase()}`
    await A.goto(주소 + '/tools/sigong', { waitUntil: 'domcontentloaded' })
    await A.evaluate(() => { try { for (const k of Object.keys(localStorage)) if (/sigong|시공/.test(k)) localStorage.removeItem(k) } catch (x) {} })
    await A.waitForSelector('input[type=file]', { state: 'attached', timeout: 20000 })
    const 오류전 = 오류.length
    await A.locator('input[type=file]').first().setInputFiles({ name: 이름, mimeType: 'application/octet-stream', buffer: e.b })
    try { await A.waitForFunction((n) => document.body.innerText.includes('📊 ' + n + ' —') || document.body.innerText.includes('⚠️ ' + n + ' —'), 이름, { timeout: 120000 }) } catch (x) { 봐(false, `${기기} ${이름} 읽기 끝`, ''); continue }
    await A.waitForTimeout(400)
    const 글 = await A.locator('body').innerText()
    if (e.오류) {
      const 앞 = e.오류.slice(0, 20)
      봐(글.includes('⚠️ ' + 이름 + ' — ' + 앞), `${기기} ${이름} 못 읽는 까닭 «${앞}…»`, (글.match(new RegExp('⚠️ ' + 이름.replace(/[.]/g, '\\.') + '[^\\n]{0,80}')) || [''])[0])
    } else {
      const m = 글.match(new RegExp('📊 ' + 이름.replace(/[.]/g, '\\.') + ' — 품목 ([\\d,]+)개'))
      봐(!!m && m[1] === 원(e.품), `${기기} ${이름} 품목 ${원(e.품)}개 = lib`, m && m[0])
      const 말줄 = (글.match(new RegExp('📊 ' + 이름.replace(/[.]/g, '\\.') + ' — 품목[^\\n]*')) || [''])[0]
      봐(e.금 === !/금액이 없는 공내역서/.test(말줄), `${기기} ${이름} 공내역서 말 ${e.금 ? '없음' : '있음'}`, 말줄)
      if (e.산 > 0 && 산본[기기] < 12) {
        /* 미리보기는 한 쪽씩(SVG) — 쪽을 넘겨 «산업안전보건관리비 사용계획» 표의 계상액을 찾음 */
        산본[기기]++
        const 쪽수 = await A.locator('.sg-pager select option').count()
        let 찾 = ''
        for (let i = 0; i < 쪽수 && !찾; i++) {
          await A.locator('.sg-pager select').selectOption(String(i))
          const t = await A.evaluate(() => [...document.querySelectorAll('svg.sg-page')].map((x) => x.textContent).join(' '))
          const m = t.match(/계상액 : [^원(]*원?/)
          if (m) 찾 = m[0]
        }
        봐(찾.replace(/\s+/g, '') === ('계상액:' + 원(e.산) + '원'), `${기기} ${이름} 산업안전보건관리비 계상액 ${원(e.산)}원 = 원가계산서(미리보기 ${쪽수}쪽 중)`, 찾)
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
