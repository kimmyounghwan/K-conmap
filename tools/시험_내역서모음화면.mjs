// 📑 내역서 모음(/change/naeyeok) 화면 시험 — G374 (2026-10-22) · 다른 예시 세 벌 · PC · 폰
//   가상 자료(4998 의 data/naeyeok*.json · naeyeok-rows/*.json — 공사명 · 기관 모두 가상)를 얹고 봅니다.
//   A 설계내역서 · «💰 단가 5줄 보기» → 같은 줄(보도블럭 세 번 · 경계석 두 번)은 한 번씩 → 5줄 전부 · 단가 804(잔토처리)
//   B 공내역서 칩 → 칩 숫자 = «모두» 5,537 · 목록 위에 «모두 5,537개 가운데 최근 200개 — 찾기도 이 안에서»
//   C 둘째 줄 «💰 단가 2줄» · 찾기 «맨홀» → 1줄 · 설계내역서(모두 = 목록)에는 «가운데 최근» 글 없음 · 폰 가로 넘침 없음
//   돌리기: 4998 에 화면 빌드 + 가상 자료를 얹은 뒤 node tools/시험_내역서모음화면.mjs [PC|폰|모두]
import { createRequire } from 'module'
import fs from 'fs'
const require = createRequire('/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const 주소 = process.env.B || 'http://127.0.0.1:4998'
const 기기들 = (process.argv[2] || '모두') === '모두' ? ['PC', '폰'] : [process.argv[2]]
const 폴더 = process.env.CAP || '/tmp/g10/g374/ui'
fs.mkdirSync(폴더, { recursive: true })
let ok = 0, bad = 0
const 봐 = (c, m, 더 = '') => { if (c) ok++; else bad++; console.log(c ? '✓' : '✗', m, c ? '' : 더) }
const 브 = await chromium.launch()
for (const 기기 of 기기들) {
  const 판 = await 브.newContext({ viewport: { width: 기기 === '폰' ? 390 : 1280, height: 900 }, locale: 'ko-KR' })
  await 판.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|geojs/, (r) => r.fulfill({ status: 200, body: '' }))
  await 판.route(/firebaseio\.com/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await 판.addInitScript(() => { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); try { sessionStorage.setItem('kcm_notice_seen', '2026-10-업체') } catch (e) {} })
  const A = await 판.newPage()
  const 오류 = []
  A.on('pageerror', (e) => 오류.push(String(e).slice(0, 160)))
  const 넘침 = () => A.evaluate(() => document.scrollingElement.scrollWidth - window.innerWidth)
  await A.goto(주소 + '/change/naeyeok', { waitUntil: 'domcontentloaded' })
  await A.waitForSelector('.nyrow', { timeout: 20000 })
  console.log(`— ${기기}`)

  /* A */
  const 머리 = await A.locator('.card').first().innerText()
  봐(/모두 5,636개\(최근 365일치\)/.test(머리), `${기기} A 머리글 «모두 5,636개(최근 365일치)»`, 머리.slice(0, 200))
  const 첫 = A.locator('.nyrow').first()
  봐(/💰 단가 5줄 보기/.test(await 첫.innerText()), `${기기} A 첫 줄 «💰 단가 5줄 보기»`)
  await 첫.locator('button', { hasText: '단가' }).click()
  await A.waitForSelector('.nyprice table', { timeout: 10000 })
  const 줄들 = await A.locator('.nyprice tbody tr').allInnerTexts()
  봐(줄들.length === 5, `${기기} A 같은 줄은 한 번씩 → 5줄`, 줄들.join(' / '))
  봐(줄들.filter((t) => t.includes('보도블럭')).length === 1 && 줄들.filter((t) => t.includes('경계석')).length === 1, `${기기} A 보도블럭 · 경계석 한 번씩`)
  봐(줄들.some((t) => t.includes('잔토처리') && t.includes('804')), `${기기} A 잔토처리 804`)
  봐(/5줄 전부입니다/.test(await A.locator('.nyprice .note').innerText()), `${기기} A «5줄 전부입니다»`)
  봐(!/가운데 최근/.test(await A.locator('.sec-title').first().innerText()), `${기기} A 설계내역서(모두 = 목록)에는 «가운데 최근» 없음`)
  await A.locator('.nyrow').first().scrollIntoViewIfNeeded()
  await A.evaluate(() => window.scrollBy(0, -60))
  await A.screenshot({ path: `${폴더}/A_${기기}_단가판.png`, fullPage: false })
  if (기기 === '폰') 봐(await 넘침() <= 1, `${기기} A 가로 넘침 없음`, await 넘침())

  /* B */
  const 칩 = A.locator('.chips .chip', { hasText: '공내역서' })
  봐(/5,537/.test(await 칩.innerText()), `${기기} B 칩 숫자 = 모두 5,537`, await 칩.innerText())
  await 칩.click()
  await A.waitForFunction(() => /공내역서/.test(document.querySelector('.sec-title')?.innerText || '') && /200개/.test(document.querySelector('.sec-title')?.innerText || ''), null, { timeout: 15000 })
  const 제목 = await A.locator('.sec-title').first().innerText()
  봐(/모두 5,537개 가운데 최근 200개 — 찾기도 이 안에서/.test(제목), `${기기} B «모두 5,537개 가운데 최근 200개»`, 제목)
  await A.locator('.sec-title').first().scrollIntoViewIfNeeded()
  await A.screenshot({ path: `${폴더}/B_${기기}_공내역서.png`, fullPage: false })
  if (기기 === '폰') 봐(await 넘침() <= 1, `${기기} B 가로 넘침 없음`, await 넘침())

  /* C */
  await A.locator('.chips .chip', { hasText: '설계내역서' }).click()
  await A.waitForFunction(() => /설계내역서/.test(document.querySelector('.sec-title')?.innerText || ''), null, { timeout: 15000 })
  const 둘째 = A.locator('.nyrow').nth(1)
  봐(/💰 단가 2줄 보기/.test(await 둘째.innerText()), `${기기} C 둘째 줄 «💰 단가 2줄 보기»`, await 둘째.innerText())
  await 둘째.locator('button', { hasText: '단가' }).click()
  await A.waitForFunction(() => document.querySelectorAll('.nyprice').length >= 1 && /2줄 전부/.test([...document.querySelectorAll('.nyprice .note')].map((x) => x.innerText).join(' ')), null, { timeout: 10000 })
  const 판2 = A.locator('.nyprice').last()
  await 판2.locator('input').fill('맨홀')
  await A.waitForTimeout(200)
  const 찾음 = await 판2.locator('tbody tr').allInnerTexts()
  봐(찾음.length === 1 && /210,000/.test(찾음[0]), `${기기} C 찾기 «맨홀» → 1줄 210,000`, 찾음.join(' / '))
  봐(/2줄 가운데 «맨홀» 이 든 1줄입니다/.test(await 판2.locator('.note').innerText()), `${기기} C «2줄 가운데 «맨홀» 이 든 1줄»`, await 판2.locator('.note').innerText())
  await 판2.scrollIntoViewIfNeeded()
  await A.screenshot({ path: `${폴더}/C_${기기}_찾기.png`, fullPage: false })
  if (기기 === '폰') 봐(await 넘침() <= 1, `${기기} C 가로 넘침 없음`, await 넘침())
  봐(오류.length === 0, `${기기} 화면 오류 없음`, 오류.join(' | '))
  await 판.close()
}
await 브.close()
console.log(`\n${bad ? '❌' : '✅'} 내역서 모음 화면 ${ok + bad}개 중 ${ok} 맞음 · ${bad} 틀림`)
process.exit(bad ? 1 : 0)
