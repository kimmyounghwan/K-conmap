// 🧪 G687 설계변경 «2줄 → 1줄» 화면 시험(/change/twoline?m=1) — PC · 폰 · 예시 파일(지어낸 공사) · 1줄 → 2줄 그대로
//   B=<빌드 주소> node tools/시험_1줄화면.mjs [PC|폰|모두]   (플레이라이트 /tmp/g10/pw · fflate /tmp/g10/fm55/web/node_modules · 캡처 CAP=…)
//   ① 맨 위 두 단추(1줄 → 2줄 · 2줄 → 1줄 · 주소 ?m=1) · ② 🧪 예시 변경내역서 → 시트 줄(원가계산서 · 내역서 ✓ 짝 확실 · 대비표 그대로)
//   ③ 미리보기(지울 줄 · 남길 줄 · → 1줄) ④ 1줄로 바꾸기 → «…_1줄.xlsx» · 안 줄 수 · 검산 글 · 셈 |2줄|1줄 · |2줄|1줄예시
//   ⑤ 1줄 → 2줄에 2줄 파일 → «2줄 → 1줄로 이 파일 열기» 안내 → 넘어가 바로 열림 / 2줄 → 1줄에 1줄 파일 → 반대 안내
//   ⑥ 1줄 → 2줄 🧪 예시 → «…_2줄.xlsx» · 셈 |2줄|예시 ⑦ .xls 안내 · 폭(320 · 360 · 380/381 · 390 · 432/433 · 520/521 · 1280 + 글꼴 10 % 넓힘) 넘침 없음 · 오류 없음
import { createRequire } from 'module'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
const require = createRequire('/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const { unzipSync, strFromU8 } = require('/tmp/g10/fm55/web/node_modules/fflate')
const 주소 = process.env.B || 'http://127.0.0.1:4687'
const 기기들 = (process.argv[2] || '모두') === '모두' ? ['PC', '폰'] : [process.argv[2]]
const 폴더 = process.env.CAP || '/tmp/g10/g687/ui'
const 여기 = path.dirname(fileURLToPath(import.meta.url))
const 예시2 = path.resolve(여기, '../web/public/tools/files/ex-twoline-2line.xlsx')
const 예시1 = path.resolve(여기, '../web/public/tools/files/ex-twoline-1line.xlsx')
fs.mkdirSync(폴더, { recursive: true })
let ok = 0, bad = 0
const 봐 = (c, m, 더 = '') => { if (c) ok++; else bad++; console.log(c ? '✓' : '✗', m, c ? '' : String(더).slice(0, 300)) }
const 브 = await chromium.launch({ env: { ...process.env, LANG: 'C.UTF-8', LC_ALL: 'C.UTF-8' } })
const 판짓기 = async (폭, 색 = 'light') => {
  const 판 = await 브.newContext({ viewport: { width: 폭, height: 900 }, locale: 'ko-KR', acceptDownloads: true, colorScheme: 색,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36' })
  await 판.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|geojs|kakaocdn|coupang/, (r) => r.fulfill({ status: 200, body: '' }))
  const 셈 = []
  await 판.route(/firebaseio\.com/, (r) => {
    const q = r.request()
    if (q.method() !== 'GET') 셈.push(decodeURIComponent(q.url()))
    r.fulfill({ status: 200, contentType: 'application/json', body: 'null' })
  })
  await 판.addInitScript(() => {
    localStorage.setItem('kcm_notice_seen', '2026-10-필독'); try { sessionStorage.setItem('kcm_notice_seen', '2026-10-업체') } catch (e) {}
    Object.defineProperty(navigator, 'webdriver', { get: () => false })
    /* 캡처에 바닥글(만든 이) · 방문 인사 쪽지 안 찍히게 */
    const st = () => { const s = document.createElement('style'); s.textContent = 'footer, .foot, .site-foot, .insa { display: none !important }'; (document.head || document.documentElement).appendChild(s) }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', st); else st()
  })
  return { 판, 셈 }
}
const 시트줄수 = (buf, 이름) => {
  const z = unzipSync(new Uint8Array(buf))
  const wb = strFromU8(z['xl/workbook.xml']); const rel = strFromU8(z['xl/_rels/workbook.xml.rels'])
  const m = new RegExp(`<sheet [^>]*name="${이름}"[^>]*r:id="([^"]+)"`).exec(wb)
  if (!m) return -1
  const t = new RegExp(`Id="${m[1]}"[^>]*Target="([^"]+)"`).exec(rel) || new RegExp(`Target="([^"]+)"[^>]*Id="${m[1]}"`).exec(rel)
  const x = strFromU8(z['xl/' + t[1].replace(/^\/?xl\//, '')])
  const rs = [...x.matchAll(/<row\b[^>]*\br="(\d+)"/g)].map((a) => +a[1])
  return Math.max(...rs)
}

for (const 기기 of 기기들) {
  const 폭 = 기기 === '폰' ? 390 : 1280
  const { 판, 셈 } = await 판짓기(폭)
  const A = await 판.newPage()
  const 오류 = []
  A.on('pageerror', (e) => 오류.push(String(e).slice(0, 160)))
  const 넘침 = () => A.evaluate(() => document.scrollingElement.scrollWidth - window.innerWidth)
  console.log(`— ${기기}`)

  /* ① 두 단추 */
  await A.goto(주소 + '/change/twoline', { waitUntil: 'domcontentloaded' })
  await A.waitForSelector('.tlmode button', { timeout: 20000 })
  const 단추 = await A.locator('.tlmode button').allInnerTexts()
  봐(단추.length === 2 && /1줄 → 2줄/.test(단추[0]) && /2줄 → 1줄/.test(단추[1]), `${기기} 맨 위 두 단추 «1줄 → 2줄 · 2줄 → 1줄»`, 단추)
  봐(await A.locator('.tlmode button.on').innerText().then((t) => /1줄 → 2줄/.test(t)), `${기기} 처음은 «1줄 → 2줄»(전 화면 그대로)`)
  봐(await A.locator('.card', { hasText: '다른 변환기와 다른 점' }).count() === 1, `${기기} 1줄 → 2줄 설명 카드 그대로`)
  await A.locator('.tlmode button', { hasText: '2줄 → 1줄' }).click()
  await A.waitForSelector('.tl1-ex', { timeout: 10000 })
  await A.screenshot({ path: `${폴더}/0_${기기}_맨위.png`, fullPage: false })
  봐(/[?&]m=1\b/.test(A.url()), `${기기} 주소 ?m=1`, A.url())
  봐(/변경 줄 하나/.test(await A.locator('.lead-card').innerText()), `${기기} 머리 글 «변경 줄 하나만 남긴 1줄»`)

  /* ② 예시 */
  셈.length = 0
  await A.locator('.tl1-ex').click()
  await A.waitForSelector('.tl1row', { timeout: 20000 })
  const 줄 = async (nm) => A.locator('.tl1row', { has: A.locator('b', { hasText: new RegExp('^' + nm + '$') }) })
  for (const nm of ['원가계산서', '내역서']) {
    const r = await 줄(nm)
    봐(await r.locator('input[type=checkbox]').isChecked(), `${기기} «${nm}» 켜짐`)
    봐(/✓ 짝 확실/.test(await r.innerText()), `${기기} «${nm}» ✓ 짝 확실`, await r.innerText())
  }
  const 대 = await 줄('공사비증감대비표')
  봐(await 대.locator('input[type=checkbox]').count() === 0 && /대비표.*그대로 둡니다/.test(await 대.innerText()), `${기기} 대비표는 상자 없이 «그대로 둡니다»`, await 대.innerText())
  봐(/짝 15개 · 지울 줄 15줄/.test(await (await 줄('내역서')).innerText()), `${기기} 내역서 «짝 15개 · 지울 줄 15줄»`, await (await 줄('내역서')).innerText())
  /* ③ 미리보기 — 내역서 */
  await (await 줄('내역서')).locator('.tl1see').click()
  await A.waitForTimeout(200)
  const 미 = await A.locator('.tl1prev').innerText()
  봐(/터파기\(토사\)/.test(미) && /465/.test(미) && /→ 1줄/.test(미), `${기기} 미리보기 — 터파기 · 변경 수량 465 · «→ 1줄»`, 미.slice(0, 300))
  봐(await A.locator('.tl1prev tr.tl1gone').count() >= 3 && await A.locator('.tl1prev tr.tl1out').count() === 3, `${기기} 미리보기 지울 줄 · 결과 줄 셋`)
  await A.locator('.card', { hasText: '② 1줄로 줄일 시트' }).scrollIntoViewIfNeeded()
  await A.screenshot({ path: `${폴더}/1_${기기}_시트고르기.png`, fullPage: false })
  await A.locator('.tl1prev').scrollIntoViewIfNeeded()
  await A.screenshot({ path: `${폴더}/2_${기기}_미리보기.png`, fullPage: false })
  /* ④ 바꾸기 */
  await A.locator('button', { hasText: '1줄로 바꾸기' }).click()
  const 받기 = A.locator('button', { hasText: '내려받기' })
  await 받기.waitFor({ timeout: 30000 })
  const 검 = await A.locator('.card', { hasText: '④ 1줄로 바꿔서 내려받기' }).innerText()
  봐(/34줄 → 19줄/.test(검) && /44줄 → 24줄/.test(검), `${기기} 검산 «내역서 34줄 → 19줄 · 원가계산서 44줄 → 24줄»`, 검.slice(0, 400))
  봐(/그때 값/.test(검) && /공사비증감대비표/.test(검), `${기기} 검산 «대비표 칸은 그때 값»`, 검.slice(0, 400))
  봐(!/짝이 엇갈린/.test(검), `${기기} 엇갈림 경고 없음`)
  await A.locator('.card', { hasText: '④ 1줄로 바꿔서 내려받기' }).scrollIntoViewIfNeeded()
  await A.screenshot({ path: `${폴더}/3_${기기}_바꿈검산.png`, fullPage: false })
  const [dl] = await Promise.all([A.waitForEvent('download', { timeout: 20000 }), 받기.click()])
  봐(dl.suggestedFilename() === '가상_솔바람마을_변경내역서_1줄.xlsx', `${기기} 받은 이름 «가상_솔바람마을_변경내역서_1줄.xlsx»`, dl.suggestedFilename())
  const 저장 = path.join(폴더, `${기기}_${dl.suggestedFilename()}`)
  await dl.saveAs(저장)
  const 받은 = fs.readFileSync(저장)
  봐(시트줄수(받은, '내역서') === 19 && 시트줄수(받은, '원가계산서') === 24 && 시트줄수(받은, '공사비증감대비표') === 8, `${기기} 받은 파일 내역서 19줄 · 원가계산서 24줄 · 대비표 8줄 그대로`, [시트줄수(받은, '내역서'), 시트줄수(받은, '원가계산서')])
  await A.waitForTimeout(500)
  봐(셈.some((u) => u.includes('|2줄|1줄예시')) && 셈.some((u) => /\|2줄\|1줄\.json/.test(u)), `${기기} 셈 |2줄|1줄예시 · |2줄|1줄`, 셈.join(' '))
  if (기기 === '폰') 봐(await 넘침() <= 1, `${기기} 2줄 → 1줄 가로 넘침 없음`, await 넘침())

  /* ⑤ 잘못 고른 쪽 — 2줄 파일을 1줄 → 2줄에 */
  await A.goto(주소 + '/change/twoline', { waitUntil: 'domcontentloaded' })
  await A.waitForSelector('input[type=file]', { state: 'attached', timeout: 20000 })
  await A.locator('input[type=file]').first().setInputFiles({ name: '가상_이미2줄.xlsx', mimeType: 'application/octet-stream', buffer: fs.readFileSync(예시2) })
  await A.waitForSelector('.tl2-already', { timeout: 20000 })
  봐(/이미.*당초 · 변경 2줄/.test(await A.locator('.tl2-already').innerText()), `${기기} 1줄 → 2줄에 2줄 파일 → «이미 2줄» 안내`)
  await A.locator('.tl2-already button').click()
  await A.waitForSelector('.tl1row', { timeout: 20000 })
  봐(/[?&]m=1\b/.test(A.url()) && /가상_이미2줄\.xlsx/.test(await A.locator('.tldrop').innerText()), `${기기} «2줄 → 1줄로 이 파일 열기» → 그 파일이 바로 열림`)
  /* 반대 — 1줄 파일을 2줄 → 1줄에 */
  await A.locator('input[type=file]').first().setInputFiles({ name: '가상_1줄.xlsx', mimeType: 'application/octet-stream', buffer: fs.readFileSync(예시1) })
  await A.waitForSelector('.card >> text=짝 줄이 있는 시트를 못 찾았습니다', { timeout: 20000 })
  봐(true, `${기기} 2줄 → 1줄에 1줄 파일 → «짝 줄이 있는 시트를 못 찾았습니다»`)
  await A.locator('button', { hasText: '1줄 → 2줄로 이 파일 열기' }).click()
  await A.waitForSelector('.tlsheets .tlrow', { timeout: 20000 })
  봐(!/[?&]m=1\b/.test(A.url()) && /가상_1줄\.xlsx/.test(await A.locator('.tldrop').innerText()), `${기기} «1줄 → 2줄로 이 파일 열기» → 1줄 → 2줄에서 열림`)

  /* ⑥ 1줄 → 2줄 예시 */
  셈.length = 0
  await A.goto(주소 + '/change/twoline', { waitUntil: 'domcontentloaded' })
  await A.waitForSelector('.tl2-ex', { timeout: 20000 })
  await A.locator('.tl2-ex').click()
  await A.waitForSelector('.tlsheets .tlrow', { timeout: 20000 })
  const 원 = A.locator('.tlrow', { has: A.locator('b', { hasText: /^원가계산서$/ }) })
  if (!(await 원.locator('input[type=checkbox]').isChecked())) await 원.locator('input[type=checkbox]').check()
  await A.locator('button', { hasText: '2줄로 바꾸기' }).click()
  const 받기2 = A.locator('button', { hasText: '내려받기' })
  await 받기2.waitFor({ timeout: 30000 })
  const [dl2] = await Promise.all([A.waitForEvent('download', { timeout: 20000 }), 받기2.click()])
  봐(dl2.suggestedFilename() === '가상_솔바람마을_내역서_2줄.xlsx', `${기기} 1줄 → 2줄 예시 → «가상_솔바람마을_내역서_2줄.xlsx»`, dl2.suggestedFilename())
  await A.waitForTimeout(500)
  봐(셈.some((u) => u.includes('|2줄|예시')) && 셈.some((u) => u.includes('|2줄|2줄')), `${기기} 셈 |2줄|예시 · |2줄|2줄`, 셈.join(' '))
  봐(await A.locator('.tl2-already').count() === 0, `${기기} 1줄 예시엔 «이미 2줄» 안내 없음`)

  /* ⑦ .xls */
  await A.goto(주소 + '/change/twoline?m=1', { waitUntil: 'domcontentloaded' })
  await A.waitForSelector('input[type=file]', { state: 'attached' })
  await A.locator('input[type=file]').first().setInputFiles({ name: '가상_옛엑셀.xls', mimeType: 'application/vnd.ms-excel', buffer: Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0, 0, 0, 0]) })
  await A.waitForTimeout(500)
  봐(/구형 엑셀\(\.xls\)은 아직 못 읽습니다/.test(await A.locator('body').innerText()), `${기기} 2줄 → 1줄 구형 .xls 안내`)

  /* ⑧ 🩹 G689 구분 칸이 병합 아래 숨은 2줄 파일(시험자료 2줄_숨은구분 — 가상) — ⚠ 의심 · 꺼 둠 → 켜고 바꾸면 짝 맞음 · 당초만 더하던 합계는 그때 값 + 알림 */
  await A.goto(주소 + '/change/twoline?m=1', { waitUntil: 'domcontentloaded' })
  await A.waitForSelector('input[type=file]', { state: 'attached' })
  await A.locator('input[type=file]').first().setInputFiles({ name: '가상_숨은구분.xlsx', mimeType: 'application/octet-stream', buffer: fs.readFileSync(path.resolve(여기, '시험자료/2줄_숨은구분.xlsx')) })
  await A.waitForSelector('.tl1row', { timeout: 20000 })
  const 숨줄 = A.locator('.tl1row', { has: A.locator('b', { hasText: /^내역서$/ }) })
  const 숨글 = await 숨줄.innerText()
  봐(/구분\(당초 · 변경\) 칸이 병합 아래 숨은 줄 3곳/.test(숨글) && !/짝 확실/.test(숨글), `${기기} 숨은 구분 → «⚠ 구분(당초 · 변경) 칸이 병합 아래 숨은 줄 3곳»`, 숨글.slice(0, 200))
  봐(!(await 숨줄.locator('input[type=checkbox]').isChecked()), `${기기} 의심 시트는 꺼 둠`)
  await 숨줄.locator('input[type=checkbox]').check()
  await 숨줄.locator('.tl1see').click()
  await A.waitForSelector('.tl1prev', { timeout: 10000 })
  const 숨미 = await A.locator('.tl1prev').innerText()
  봐(/보도블록 포장/.test(숨미) && await A.locator('.tl1prev tr.tl1out').count() >= 3, `${기기} 켠 뒤 미리보기 — 품목 짝(보도블록 포장 …)`, 숨미.slice(0, 200))
  await A.locator('button', { hasText: '1줄로 바꾸기' }).click()
  await A.locator('button', { hasText: '내려받기' }).waitFor({ timeout: 30000 })
  const 숨검 = await A.locator('.card', { hasText: '④ 1줄로 바꿔서 내려받기' }).innerText()
  봐(/14줄 → 9줄/.test(숨검) && /지운 줄만 더하던 칸이라 1줄에선 0 이 됩니다/.test(숨검) && /지운 줄만 더하던 식/.test(숨검), `${기기} 검산 «14줄 → 9줄» · 알림 «지운 줄만 더하던 칸 … 그때 값» · 굳힘 «지운 줄만 더하던 식»`, 숨검.slice(0, 500))
  const [dl3] = await Promise.all([A.waitForEvent('download', { timeout: 20000 }), A.locator('button', { hasText: '내려받기' }).click()])
  const 숨받 = fs.readFileSync(await dl3.path())
  const 숨책 = unzipSync(new Uint8Array(숨받))
  const 숨시 = strFromU8(숨책['xl/worksheets/sheet1.xml'])
  const 칸값 = (ref) => { const m = new RegExp(`<c r="${ref}"[^>]*?(?:/>|>(.*?)</c>)`).exec(숨시); return m ? m[1] || '' : '' }
  봐(/<v>8395000<\/v>/.test(칸값('E8')) && !/<f>/.test(칸값('E8')) && /<v>251850<\/v>/.test(칸값('E9')), `${기기} 받은 파일 합계 E8 = 8,395,000 · 공구손료 E9 = 251,850(0 아님 · 그때 값)`, [칸값('E8'), 칸값('E9')])
  봐(/보도블록 포장/.test(칸값('A3')) || /<f>C3\*D3<\/f>/.test(칸값('E3')), `${기기} 받은 파일 품목 줄 그대로(E3 = C3*D3)`, 칸값('E3'))
  봐(오류.length === 0, `${기기} 화면 오류 없음`, 오류.join(' | '))
  await 판.close()
}

/* 폭마다 — 두 단추 · 시트 줄이 넘치지 않음(글꼴 10 % 넓혀도) */
for (const 폭 of [320, 360, 380, 381, 390, 432, 433, 520, 521, 860, 1280]) {
  for (const 넓힘 of [false, true]) {
    const { 판 } = await 판짓기(폭)
    const A = await 판.newPage()
    await A.goto(주소 + '/change/twoline?m=1', { waitUntil: 'domcontentloaded' })
    await A.waitForSelector('.tl1-ex', { timeout: 20000 })
    if (넓힘) await A.addStyleTag({ content: '.tlmode, .tl1row, .tl1info { letter-spacing: 0.1em !important }' })
    await A.locator('.tl1-ex').click()
    await A.waitForSelector('.tl1row', { timeout: 20000 })
    const 잼 = await A.evaluate(() => {
      const 밖 = document.scrollingElement.scrollWidth - window.innerWidth
      const 단 = [...document.querySelectorAll('.tlmode button')].map((b) => [...b.children].map((c) => c.scrollWidth - c.clientWidth)).flat()
      const 줄 = [...document.querySelectorAll('.tl1row')].map((r) => r.scrollWidth - r.clientWidth)
      /* 카드 밖으로 나가 잘린 글(카드가 숨겨 문서 넘침으로는 안 잡힘 — 남길 줄 칸 설명이 폰에서 잘렸던 것) */
      const 잘림 = [...document.querySelectorAll('.card')].map((c) => {
        const cr = c.getBoundingClientRect()
        return Math.max(0, ...[...c.querySelectorAll('span, label, b, td, th, button, p, li')].filter((e) => !e.closest('.tlprev')).map((e) => e.getBoundingClientRect().right - cr.right))
      })
      return { 밖, 단: Math.max(0, ...단), 줄: Math.max(0, ...줄, ...잘림) }
    })
    if (!넓힘 || 잼.밖 > 1 || 잼.줄 > 1) 봐(잼.밖 <= 1 && 잼.줄 <= 1 && (넓힘 || 잼.단 <= 1), `${폭}px${넓힘 ? ' (글꼴 10 % 넓힘)' : ''} 넘침 없음`, JSON.stringify(잼))
    await 판.close()
  }
}
/* 어두운 화면 캡처 */
{
  const { 판 } = await 판짓기(390, 'dark')
  const A = await 판.newPage()
  await A.goto(주소 + '/change/twoline?m=1', { waitUntil: 'domcontentloaded' })
  await A.waitForSelector('.tl1-ex', { timeout: 20000 })
  await A.locator('.tl1-ex').click()
  await A.waitForSelector('.tl1prev', { timeout: 20000 })
  await A.locator('.tl1prev').scrollIntoViewIfNeeded()
  await A.screenshot({ path: `${폴더}/4_폰_어두운화면.png`, fullPage: false })
  await 판.close()
}
await 브.close()
console.log(`\n${bad ? '❌' : '✅'} 2줄 → 1줄 화면 ${ok + bad}개 중 ${ok} 맞음 · ${bad} 틀림`)
process.exit(bad ? 1 : 0)
