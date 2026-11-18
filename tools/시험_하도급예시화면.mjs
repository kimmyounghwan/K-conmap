// 🧪 G777 하도급 내역서 만들기 — «🧪 예시 내역서로 해 보기» 화면 시험 (2026-11-19 소장님 「예시로 해 보기」 · 「엑셀에서 수식은 빼고」)
//   화면 빌드를 얹은 뒤  B=http://127.0.0.1:5777 node tools/시험_하도급예시화면.mjs [PC|폰|모두]
//   ① 예시 단추 → 이름 칸 «(예시)» · 여섯 장 한 벌까지 저절로 · 받는 고리(.xlsx) 하나
//   ② 받은 엑셀 = 수식 칸 0 · 시트 여섯 · 요약 줄에 «율 바꾸기» · «노란 칸» 없음 · 묻는 창(askbox) 안 뜸
//   ③ 그다음 진짜 파일을 올리면 «(예시)» 이름은 비우고 파일 이름으로 · ④ 화면 오류 0 · 폰 가로 넘침 없음
import { createRequire } from 'module'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { unzipSync, strFromU8 } from '../web/node_modules/fflate/esm/index.mjs'
const require = createRequire('/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const 주소 = process.env.B || 'http://127.0.0.1:5777'
const 기기들 = (process.argv[2] || '모두') === '모두' ? ['PC', '폰'] : [process.argv[2]]
const 루트 = fileURLToPath(new URL('..', import.meta.url))   /* PC(Windows)에서도 — checkimports «URL.pathname 을 파일 경로로 쓰지 말 것» */
const 예시바이트 = fs.readFileSync(루트 + 'web/public/jeoksan/비율예시_내역서.xlsx')
let ok = 0, bad = 0
const 봐 = (c, m, 더 = '') => { if (c) ok++; else bad++; console.log(c ? '  ✓' : '  ✗', m, c ? '' : String(더).slice(0, 300)) }
const b = await chromium.launch()
for (const 기 of 기기들) {
  console.log('■ ' + 기)
  const ctx = await b.newContext(기 === '폰' ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 900 } })
  const p = await ctx.newPage()
  const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e.message).slice(0, 120)))
  await p.goto(주소 + '/naeyeok/hado', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('h1', { timeout: 20000 })
  const 단추 = p.getByRole('button', { name: /🧪 예시 내역서로 해 보기/ })
  봐(await 단추.count() === 1, '예시 단추 하나')
  await 단추.click()
  const 고리 = p.locator('a[download$=".xlsx"]', { hasText: '하도급내역서' })
  try { await 고리.first().waitFor({ timeout: 25000 }) } catch (e) { /* 아래에서 셈 */ }
  봐(await 고리.count() === 1, '여섯 장 한 벌까지 저절로 — 받는 고리 하나', String(await 고리.count()))
  const 칸값 = await p.evaluate(() => [...document.querySelectorAll('input')].map((i) => i.value))
  봐(칸값.includes('(예시) 가상 마을안길 정비공사') && 칸값.includes('(예시) 가상군') && 칸값.includes('(예시) 가상건설(주)') && 칸값.includes('(예시) 가상토건(주)'), '이름 칸 넷 «(예시)»', JSON.stringify(칸값).slice(0, 200))
  const 이름 = await 고리.first().getAttribute('download')
  봐(/^예시_내역서\(가상 마을안길 정비공사\)_하도급내역서\(80%\)\.xlsx$/.test(이름 || ''), '받는 이름 ' + 이름)
  const 바 = await p.evaluate(async () => { const a = [...document.querySelectorAll('a[download]')].find((x) => /하도급내역서/.test(x.getAttribute('download'))); const r = await fetch(a.href); return Array.from(new Uint8Array(await r.arrayBuffer())) })
  const fz = unzipSync(new Uint8Array(바))
  let nf = 0, 시트 = 0
  for (const k of Object.keys(fz)) if (/^xl\/worksheets\/sheet\d+\.xml$/.test(k)) { 시트++; nf += (strFromU8(fz[k]).match(/<f[ >]/g) || []).length }
  봐(nf === 0, '받은 엑셀 수식 칸 0', String(nf))
  봐(시트 === 6, '받은 엑셀 시트 여섯', String(시트))
  const 요약 = await p.evaluate(() => [...document.querySelectorAll('ul.flist li')].map((x) => x.innerText).join(' | '))
  봐(/율 바꾸기/.test(요약) && !/노란 칸|전부 다시 셈/.test(요약), '요약 줄 «율 바꾸기» · «노란 칸» 없음', 요약.slice(0, 200))
  await p.waitForTimeout(2500)
  봐(await p.locator('.askbox').count() === 0, '예시로 만든 뒤 묻는 창 안 뜸')
  const 화면글 = await p.evaluate(() => document.querySelector('main') ? document.querySelector('main').innerText : document.body.innerText)
  봐(!/노란 칸|율 칸 하나로|전부 다시 셈/.test(화면글), '화면 글에 «노란 칸 · 율 칸 하나로» 없음')
  봐(!/수식 없/.test(화면글), '화면에 «수식 없음» 말 안 적음(G442)')
  const 넘 = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  봐(넘 <= 1, '가로 넘침 없음', String(넘))
  if (기 === '폰') {
    await 단추.scrollIntoViewIfNeeded()
    await p.screenshot({ path: '/tmp/g10/t777/hado_ex_폰.png' })
  } else {
    await p.screenshot({ path: '/tmp/g10/t777/hado_ex_PC.png' })
  }
  /* ③ 진짜 파일(이름만 다른 같은 파일) */
  await p.setInputFiles('input[type=file]', { name: '우리현장_도급내역서.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer: 예시바이트 })
  await p.waitForTimeout(2500)
  const 칸값2 = await p.evaluate(() => [...document.querySelectorAll('input')].map((i) => i.value))
  봐(!칸값2.some((v) => /^\(예시\)/.test(v)), '진짜 파일 → «(예시)» 이름 비움', JSON.stringify(칸값2).slice(0, 200))
  봐(칸값2.includes('우리현장 도급내역서'), '공사명 = 파일 이름', JSON.stringify(칸값2).slice(0, 200))
  봐(await p.locator('a[download$=".xlsx"]', { hasText: '하도급내역서' }).count() === 0, '진짜 파일은 저절로 안 만듦(누를 때)')
  봐(오류.length === 0, '화면 오류 0', 오류.join(' / '))
  await ctx.close()
}
await b.close()
console.log((bad ? '❌' : '✅') + ' 시험_하도급예시화면 ' + ok + '/' + (ok + bad))
process.exit(bad ? 1 : 0)
