// 🧪 80% 비율(/naeyeok/ratio) 화면 시험 — G378 (2026-10-22) · PC · 폰 · 예시 파일은 가상(tools/시험자료/붙은머리_예시.xlsx · .xlsm)
//   4998 에 화면 빌드를 얹은 뒤  node tools/시험_비율화면.mjs [PC|폰|모두]
//   ① 붙은 머리글(재료단가 · 재료금액 …) 내역서가 읽힘 — 당초 982,683 · 80% 비율 합계
//   ② 매크로 사용 꼴(.xlsm): «올린 엑셀 그대로» → _80%_그대로.xlsm · «비율 시트 붙여 수식으로» → _80%.xlsm (안의 종류 = 확장자 · 전엔 .xlsx 라 엑셀이 안 엶)
//      «새 엑셀 한 벌» 은 늘 .xlsx · 보통 .xlsx 올리면 _80%.xlsx
//   + 👁 이 화면 조회 · 폰 가로 넘침 없음 · 화면 오류 없음
import { createRequire } from 'module'
import fs from 'fs'
import path from 'path'
const require = createRequire('/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const { unzipSync, strFromU8 } = require('/tmp/g10/fm55/web/node_modules/fflate')
const 주소 = process.env.B || 'http://127.0.0.1:4998'
import { fileURLToPath } from 'url'
const 자료 = fileURLToPath(new URL('./시험자료/', import.meta.url))
const 기기들 = (process.argv[2] || '모두') === '모두' ? ['PC', '폰'] : [process.argv[2]]
const 폴더 = process.env.CAP || '/tmp/g10/g378/ui'
fs.mkdirSync(폴더, { recursive: true })
let ok = 0, bad = 0
const 봐 = (c, m, 더 = '') => { if (c) ok++; else bad++; console.log(c ? '✓' : '✗', m, c ? '' : 더) }
const 브 = await chromium.launch({ env: { ...process.env, LANG: 'C.UTF-8', LC_ALL: 'C.UTF-8' } })
for (const 기기 of 기기들) {
  const 판 = await 브.newContext({ viewport: { width: 기기 === '폰' ? 390 : 1280, height: 900 }, locale: 'ko-KR', acceptDownloads: true,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36' })
  await 판.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|geojs/, (r) => r.fulfill({ status: 200, body: '' }))
  await 판.route(/firebaseio\.com/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await 판.addInitScript(() => { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); try { sessionStorage.setItem('kcm_notice_seen', '2026-10-업체') } catch (e) {}; Object.defineProperty(navigator, 'webdriver', { get: () => false }) })
  const A = await 판.newPage()
  const 오류 = []
  A.on('pageerror', (e) => 오류.push(String(e).slice(0, 160)))
  const 넘침 = () => A.evaluate(() => document.scrollingElement.scrollWidth - window.innerWidth)
  const 올리기 = async (원파일, 이름) => {
    await A.goto(주소 + '/naeyeok/ratio', { waitUntil: 'domcontentloaded' })
    await A.waitForSelector('input[type=file]', { state: 'attached', timeout: 20000 })
    await A.locator('input[type=file]').first().setInputFiles({ name: 이름, mimeType: 'application/octet-stream', buffer: fs.readFileSync(path.join(자료, 원파일)) })
    await A.locator('.card', { hasText: '③ 내려받기' }).waitFor({ timeout: 30000 })
  }
  /* 받은 뒤 하루 한 번 뜨는 «한 줄 남기기» 창(askAfter)이 단추를 덮습니다 — 사람처럼 ✕ 로 닫고 누름 */
  const 창닫기 = async () => { await A.waitForTimeout(1000); const x = A.locator('.askx'); if (await x.count()) await x.first().click().catch(() => {}) }
  const 받기 = async (단추글, 기대이름, 매크로) => {
    await 창닫기()
    await A.locator('button', { hasText: 단추글 }).click()
    const 고리 = A.locator('a[download]', { hasText: 기대이름 })
    await 고리.waitFor({ timeout: 30000 })
    await 창닫기()
    const [dl] = await Promise.all([A.waitForEvent('download', { timeout: 20000 }), 고리.click()])
    봐(dl.suggestedFilename() === 기대이름, `${기기} 받은 이름 ${기대이름}`, dl.suggestedFilename())
    const 저장 = path.join(폴더, `${기기}_${dl.suggestedFilename()}`)
    await dl.saveAs(저장)
    const z = unzipSync(new Uint8Array(fs.readFileSync(저장)))
    const ct = strFromU8(z['[Content_Types].xml'] || new Uint8Array())
    봐(/macroEnabled\.main\+xml/.test(ct) === 매크로, `${기기} ${기대이름} 안의 종류 = 확장자(${매크로 ? '매크로 사용' : '보통'})`)
    return z
  }
  console.log(`— ${기기}`)
  /* ① · ② .xlsm */
  await 올리기('붙은머리_예시.xlsm', '가상_붙은머리.xlsm')
  const 글 = await A.locator('body').innerText()
  봐(/982,683/.test(글), `${기기} 붙은 머리글 내역서 읽힘 — 당초 982,683`, 글.slice(0, 200))
  봐(!/단가」나 「금액」 칸을 못 찾았습니다/.test(글), `${기기} «단가 · 금액 칸을 못 찾았습니다» 안 나옴`)
  await A.locator('text=982,683').first().scrollIntoViewIfNeeded()
  await A.screenshot({ path: `${폴더}/${기기}_0_읽음.png` })
  let z = await 받기('올린 엑셀 그대로', '가상_붙은머리_80%_그대로.xlsm', true)
  await A.locator('a[download]').first().scrollIntoViewIfNeeded()
  await A.screenshot({ path: `${폴더}/${기기}_1_그대로_xlsm.png` })
  z = await 받기('«비율» 시트 붙여 수식으로', '가상_붙은머리_80%.xlsm', true)
  봐(/name="비율"/.test(strFromU8(z['xl/workbook.xml'])), `${기기} 수식 꼴에 «비율» 시트`)
  await A.locator('a[download]', { hasText: '_80%.xlsm' }).scrollIntoViewIfNeeded()
  await A.screenshot({ path: `${폴더}/${기기}_2_수식_xlsm.png` })
  await 받기('새 엑셀 한 벌', '내역서_80%_원가계산서.xlsx', false)
  /* 보통 .xlsx */
  await 올리기('붙은머리_예시.xlsx', '가상_붙은머리.xlsx')
  await 받기('«비율» 시트 붙여 수식으로', '가상_붙은머리_80%.xlsx', false)
  await 받기('올린 엑셀 그대로', '가상_붙은머리_80%_그대로.xlsx', false)
  봐(await A.locator('text=이 화면 조회').count() > 0, `${기기} 👁 이 화면 조회 보임`)
  if (기기 === '폰') 봐(await 넘침() <= 1, `${기기} 가로 넘침 없음`, await 넘침())
  봐(오류.length === 0, `${기기} 화면 오류 없음`, 오류.join(' | '))
  await 판.close()
}
await 브.close()
console.log(`\n${bad ? '❌' : '✅'} 비율 화면 ${ok + bad}개 중 ${ok} 맞음 · ${bad} 틀림`)
process.exit(bad ? 1 : 0)
