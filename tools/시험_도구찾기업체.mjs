// 🔎 G364 «도구 찾기» 에 업체 찾기 길 — /tools 찾기 칸에 «업체» · «공동도급» · «낙찰 실적» 을 치면 🏢 건설업체 찾기 카드 → 누르면 /corp
//   돌리기: 4998 에 화면 빌드를 얹은 뒤 node tools/시험_도구찾기업체.mjs (데이터베이스는 가짜)
import { createRequire } from 'module'
const require = createRequire('/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const 주소 = process.env.B || 'http://127.0.0.1:4998'
let ok = 0, bad = 0
const 봐 = (c, m, 더 = '') => { if (c) ok++; else bad++; console.log(c ? '✓' : '✗', m, 더) }
const 브 = await chromium.launch()
for (const [기기, w] of [['PC', 1280], ['폰', 390]]) {
  const 판 = await 브.newContext({ viewport: { width: w, height: 860 } })
  await 판.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|geojs/, (r) => r.fulfill({ status: 200, body: '' }))
  await 판.route(/firebaseio\.com/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await 판.addInitScript(() => { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); try { sessionStorage.setItem('kcm_notice_seen', '2026-10-업체') } catch (e) {} })
  const A = await 판.newPage()
  const 오류 = []
  A.on('pageerror', (e) => 오류.push(String(e).slice(0, 160)))
  for (const 말 of ['업체', '공동도급', '낙찰 실적', '업체 찾기']) {
    await A.goto(주소 + '/tools', { waitUntil: 'domcontentloaded' })
    const 칸 = A.locator('input[aria-label="도구 찾기"]')
    await 칸.waitFor({ timeout: 20000 })
    await 칸.fill(말)
    await A.waitForTimeout(300)
    const 카드 = A.locator('a[href="/corp"]', { hasText: '건설업체 찾기' })
    봐(await 카드.count() > 0, `${기기} 도구 찾기 «${말}» → 🏢 건설업체 찾기`)
  }
  await A.locator('a[href="/corp"]', { hasText: '건설업체 찾기' }).first().click()
  await A.waitForURL(/\/corp$/, { timeout: 10000 }).catch(() => {})
  await A.waitForTimeout(800)
  봐(/\/corp$/.test(A.url()) && /🏢 업체 찾기[\s\S]*상호로 찾기/.test(await A.evaluate(() => document.body.innerText)), `${기기} 카드 누르면 /corp 업체 찾기 화면`, A.url())
  await A.goto(주소 + '/tools', { waitUntil: 'domcontentloaded' })
  await A.locator('input[aria-label="도구 찾기"]').fill('')
  await A.waitForTimeout(300)
  const 카드수 = await A.locator('a[href="/corp"]').count()
  봐(카드수 >= 1, `${기기} 찾기 칸이 비어도 입찰·개찰 묶음에 업체 찾기 카드`, String(카드수))
  if (기기 === '폰') 봐((await A.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 1, '폰 /tools 가로 넘침 없음')
  봐(!오류.length, `${기기} 화면 오류 0`, 오류.join(' | '))
  await 판.close()
}
await 브.close()
console.log(`\n${ok} 통과 · ${bad} 실패`)
process.exit(bad ? 1 : 0)
