// 🧪 설계변경 2줄 자동변환(/change/twoline) 화면 시험 — G377 (2026-10-22) · 다른 예시 세 벌 · PC · 폰
//   가상 내역서: TWOLINE_FILES=/tmp/g10/g377/files python3 tools/시험_2줄셈.py 로 짓고(공사명 모두 가상), 4998 에 화면 빌드를 얹은 뒤
//   F=/tmp/g10/g377/files node tools/시험_2줄화면.mjs [PC|폰|모두]
//   A 가상A_마을안길.xlsx · 원가계산서도 고름 · 2줄 → «_2줄.xlsx» · 검산 «고치지 못한 수식은 없습니다» · 셈 |2줄|2줄
//   B 가상B_체육관바닥.xlsx · 원가 계산서도 · 3줄 → «_3줄.xlsx» · 셈 |2줄|3줄
//   C 가상C_소하천.xlsm(매크로 사용 종류) · 전기 · 집계도 · 2줄 → «_2줄.xlsm» · 안의 종류 그대로 · 셈 |2줄|xlsm  (전엔 .xlsx 로 나가 엑셀이 안 열었음)
//   + 구형 .xls 는 안내 · 폰 가로 넘침 없음 · 화면 오류 없음
import { createRequire } from 'module'
import fs from 'fs'
import path from 'path'
const require = createRequire('/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const { unzipSync, strFromU8 } = require('/tmp/g10/fm55/web/node_modules/fflate')
const 주소 = process.env.B || 'http://127.0.0.1:4998'
const F = process.env.F || '/tmp/g10/g377/files'
const 기기들 = (process.argv[2] || '모두') === '모두' ? ['PC', '폰'] : [process.argv[2]]
const 폴더 = process.env.CAP || '/tmp/g10/g377/ui'
fs.mkdirSync(폴더, { recursive: true })
let ok = 0, bad = 0
const 봐 = (c, m, 더 = '') => { if (c) ok++; else bad++; console.log(c ? '✓' : '✗', m, c ? '' : 더) }
/* 시험장 크롬은 말 설정(LANG)이 없으면 한글 받을 이름을 «download» 로 바꿉니다 — UTF-8 로 띄움(사람 브라우저와 같게) */
const 브 = await chromium.launch({ env: { ...process.env, LANG: 'C.UTF-8', LC_ALL: 'C.UTF-8' } })
for (const 기기 of 기기들) {
  const 판 = await 브.newContext({ viewport: { width: 기기 === '폰' ? 390 : 1280, height: 900 }, locale: 'ko-KR', acceptDownloads: true,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36' })
  await 판.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|geojs/, (r) => r.fulfill({ status: 200, body: '' }))
  const 셈 = []
  await 판.route(/firebaseio\.com/, (r) => {
    const q = r.request()
    if (q.method() !== 'GET') 셈.push(decodeURIComponent(q.url()))
    r.fulfill({ status: 200, contentType: 'application/json', body: 'null' })
  })
  await 판.addInitScript(() => { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); try { sessionStorage.setItem('kcm_notice_seen', '2026-10-업체') } catch (e) {}; Object.defineProperty(navigator, 'webdriver', { get: () => false }) })
  const A = await 판.newPage()
  const 오류 = []
  A.on('pageerror', (e) => 오류.push(String(e).slice(0, 160)))
  const 넘침 = () => A.evaluate(() => document.scrollingElement.scrollWidth - window.innerWidth)
  const 한벌 = async (표, 파일, 더고를, 줄, 기대이름) => {
    await A.goto(주소 + '/change/twoline', { waitUntil: 'domcontentloaded' })
    await A.waitForSelector('input[type=file]', { state: 'attached', timeout: 20000 })
    /* 이름이 한글이면 시험장 크롬이 경로로는 못 엽니다(사람 브라우저는 됨) — 내용 · 이름을 그대로 넘깁니다 */
    await A.locator('input[type=file]').first().setInputFiles({ name: 파일, mimeType: 'application/octet-stream', buffer: fs.readFileSync(path.join(F, 파일)) })
    await A.waitForSelector('.tlsheets .tlrow', { timeout: 20000 })
    for (const nm of 더고를) {
      const 줄칸 = A.locator('.tlrow', { has: A.locator('b', { hasText: new RegExp('^' + nm + '$') }) })
      const 상자 = 줄칸.locator('input[type=checkbox]')
      if (!(await 상자.isChecked())) await 상자.check()
    }
    if (줄 === 3) await A.locator('label', { hasText: '3줄 — 당초 · 변경 · 증감' }).locator('input').check()
    셈.length = 0
    await A.locator('button', { hasText: `${줄}줄로 바꾸기` }).click()
    const 받기 = A.locator('button', { hasText: '내려받기' })
    await 받기.waitFor({ timeout: 30000 })
    const 글 = await A.locator('.card', { hasText: '④ 바꿔서 내려받기' }).innerText()
    봐(/고치지 못한 수식은 없습니다/.test(글), `${기기} ${표} 검산 «고치지 못한 수식은 없습니다»`, 글.slice(0, 300))
    const [dl] = await Promise.all([A.waitForEvent('download', { timeout: 20000 }), 받기.click()])
    봐(dl.suggestedFilename() === 기대이름, `${기기} ${표} 받은 이름 ${기대이름}`, dl.suggestedFilename())
    const 저장 = path.join(폴더, `${기기}_${dl.suggestedFilename()}`)
    await dl.saveAs(저장)
    const z = unzipSync(new Uint8Array(fs.readFileSync(저장)))
    const ct = strFromU8(z['[Content_Types].xml'] || new Uint8Array())
    봐(/macroEnabled\.main\+xml/.test(ct) === /\.xlsm$/.test(기대이름), `${기기} ${표} 안의 종류 = 확장자(${/\.xlsm$/.test(기대이름) ? '매크로 사용' : '보통'})`)
    const 라벨 = Object.keys(z).filter((p) => /^xl\/(sharedStrings|worksheets\/sheet\d+)\.xml$/.test(p)).map((p) => strFromU8(z[p])).join('')
    봐(/변경/.test(라벨) && (줄 === 2 || /증감/.test(라벨)), `${기기} ${표} 파일 안에 라벨(당초 · 변경${줄 === 3 ? ' · 증감' : ''})`)
    await A.waitForTimeout(600)
    return 셈.slice()
  }
  console.log(`— ${기기}`)
  let s = await 한벌('A', '가상A_마을안길.xlsx', ['원가계산서'], 2, '가상A_마을안길_2줄.xlsx')
  봐(s.some((u) => u.includes('|2줄|2줄')), `${기기} A 셈 |2줄|2줄`, s.join(' '))
  await A.locator('.card', { hasText: '④ 바꿔서 내려받기' }).scrollIntoViewIfNeeded()
  await A.screenshot({ path: `${폴더}/A_${기기}_바꿈.png` })
  s = await 한벌('B', '가상B_체육관바닥.xlsx', ['원가 계산서'], 3, '가상B_체육관바닥_3줄.xlsx')
  봐(s.some((u) => u.includes('|2줄|3줄')), `${기기} B 셈 |2줄|3줄`, s.join(' '))
  const 미리 = await A.locator('.tlprev').innerText()
  봐(/=ROUNDDOWN\(E5\*F5,…/.test(미리) && !/=ROUNDDOWN\(E5\*F5,0(\s|$)/.test(미리), `${기기} B 미리보기 긴 수식은 «…» (괄호 빠진 채 잘리지 않음)`, 미리.slice(0, 200))
  await A.locator('.tlprev').scrollIntoViewIfNeeded()
  await A.screenshot({ path: `${폴더}/B_${기기}_3줄미리보기.png` })
  s = await 한벌('C', '가상C_소하천.xlsm', ['전기', '집계'], 2, '가상C_소하천_2줄.xlsm')
  봐(s.some((u) => u.includes('|2줄|xlsm')), `${기기} C 셈 |2줄|xlsm`, s.join(' '))
  await A.locator('.card', { hasText: '④ 바꿔서 내려받기' }).scrollIntoViewIfNeeded()
  await A.screenshot({ path: `${폴더}/C_${기기}_xlsm.png` })
  if (기기 === '폰') 봐(await 넘침() <= 1, `${기기} 가로 넘침 없음`, await 넘침())
  /* 구형 .xls */
  const 옛 = path.join(폴더, '가상_옛엑셀.xls'); fs.writeFileSync(옛, Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0, 0, 0, 0]))
  await A.goto(주소 + '/change/twoline', { waitUntil: 'domcontentloaded' })
  await A.waitForSelector('input[type=file]', { state: 'attached' })
  await A.locator('input[type=file]').first().setInputFiles({ name: '가상_옛엑셀.xls', mimeType: 'application/vnd.ms-excel', buffer: fs.readFileSync(옛) })
  await A.waitForTimeout(500)
  봐(/구형 엑셀\(\.xls\)은 아직 못 읽습니다/.test(await A.locator('body').innerText()), `${기기} 구형 .xls 안내`)
  봐(await A.locator('text=이 화면 조회').count() > 0, `${기기} 👁 이 화면 조회 보임`)
  봐(오류.length === 0, `${기기} 화면 오류 없음`, 오류.join(' | '))
  await 판.close()
}
await 브.close()
console.log(`\n${bad ? '❌' : '✅'} 2줄 화면 ${ok + bad}개 중 ${ok} 맞음 · ${bad} 틀림`)
process.exit(bad ? 1 : 0)
