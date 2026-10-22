// ⏱ G357 맵톡 «올리는 중…» 이 길던 것 — 가짜 데이터베이스(왕복마다 지연)로 «누른 뒤 기다리는 시간 · 서버 왕복 수»
//   ① 답글: 칸을 누르면 미리 읽고(옛 번호 · 몰래표) → 올리기를 누른 뒤에는 쓰기 1번만 · 시간  ② 새 글도 같음
//   ③ 연결이 멈춘 듯하면(쓰기가 안 끝남) 3초 뒤 «연결을 다시 잇는 중…» → 다시 이어 올라감  ④ 폰 · 오류
// node tools/시험_맵톡올리기.mjs [주소=http://127.0.0.1:4997] · env 지연(ms, 기본 700) · CAP
//   준비: 가짜 파이어베이스 판(/tmp/g10/mockfb · vite.config.mock.js → /tmp/g10/dmock — 왕복 지연 · goOffline/goOnline 이 든 판)을 정적 서버로. PC bat 에서는 안 돌림(Playwright 필요)
import { createRequire } from 'module'
const require = createRequire('/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const 주소 = process.argv[2] || 'http://127.0.0.1:4997'
const 지연 = Number(process.env.지연 || 700)
let ok = 0, bad = 0
const 봐 = (c, m, 더 = '') => { if (c) { ok++; console.log('✓', m, 더) } else { bad++; console.log('✗', m, 더) } }
const 지금 = Date.now()
const 키 = (n) => '-P3pe' + String(n).padStart(15, '0')
const 씨앗 = { qna: { [키(1)]: { t: '[후기·건의] 처음 알게 됐는데 유익합니다', b: '도움 많이 받겠습니다', nick: '너그러운 크레인7', uid: 'u1', at: 지금 - 7 * 3600e3 } }, qna_a: {}, qna_del: {}, qna_top: {} }
const 브 = await chromium.launch()
const 결과 = {}
for (const [이름, w] of [['PC', 1280], ['폰', 430]]) {
  const 판 = await 브.newContext({ viewport: { width: w, height: 900 } })
  await 판.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|geojs/, (r) => r.fulfill({ status: 200, body: '' }))
  /* ⏱ G370 뒤 — 이 시험은 «REST 가 안 되는 때» (웹소켓만) 그대로 봅니다. REST 로 빨리 끝나는 것은 tools/시험_맵톡빨리쓰기.mjs */
  await 판.route(/firebaseio\.com/, (r) => r.fulfill({ status: 503, body: 'down' }))
  await 판.addInitScript(([s, ms]) => {
    if (!sessionStorage.getItem('씨앗됨')) { localStorage.setItem('mockdb', JSON.stringify(s)); sessionStorage.setItem('씨앗됨', '1') }
    localStorage.setItem('mock지연', String(ms)); localStorage.setItem('kcm_notice_seen', '2026-10-필독')
    try { sessionStorage.setItem('kcm_notice_seen', '2026-10-업체') } catch (e) { /* */ }
  }, [씨앗, 지연])
  const A = await 판.newPage()
  const 오류 = []; A.on('pageerror', (e) => 오류.push(String(e).slice(0, 150)))
  await A.goto(주소 + '/qna', { waitUntil: 'domcontentloaded' })
  await A.waitForFunction(() => document.body.innerText.includes('처음 알게 됐는데'), null, { timeout: 15000 })
  await A.locator('.mt-card', { hasText: '처음 알게 됐는데' }).first().click()
  const 폼 = A.locator('.mt-af', { has: A.locator('textarea[placeholder*="너그러운 크레인7"]') }).first()
  const 칸 = 폼.locator('textarea.mt-af-t')
  await 칸.waitFor({ timeout: 8000 })
  // ① 답글 — 칸을 누르고(미리 읽기) 적는 동안 지연 두 번이 지나감
  await 칸.click(); await 칸.fill('감사합니다. 맵톡에 일상 업무도 공유해 주세요~~')
  await A.waitForTimeout(지연 * 3 + 300)
  await A.evaluate(() => { window.__왕복 = [] })
  const 단추 = 폼.locator('button', { hasText: /답글 올리기/ })
  const t0 = Date.now()
  await 단추.click()
  await A.waitForFunction(() => [...document.querySelectorAll('.mt-af')].some((e) => /감사합니다\. 맵톡에 일상/.test(document.body.innerText)) && ![...document.querySelectorAll('button')].some((b) => /올리는 중/.test(b.innerText)), null, { timeout: 15000 }).catch(() => {})
  const 걸림 = Date.now() - t0
  const 왕복모두 = await A.evaluate(() => (window.__왕복 || []).filter((x) => /^(get|set) /.test(x)))
  const 왕복 = 왕복모두.slice(0, 왕복모두.findIndex((x) => /^set qna_a\//.test(x)) + 1)   // 쓰기까지(그 뒤는 화면이 목록을 다시 읽음)
  결과[이름 + '답'] = 걸림
  봐(왕복.length === 1 && /^set qna_a\//.test(왕복[0]), `${이름} ① 답글 — 올리기를 누른 뒤 서버 왕복 ${왕복.length}번(쓰기만)`, 왕복.join(' | '))
  봐(걸림 < 지연 + 900, `${이름} ① 답글 — 누르고 ${(걸림 / 1000).toFixed(2)}초 (왕복 한 번 ${지연}ms)`)
  봐((await 칸.inputValue()) === '' && /감사합니다\. 맵톡에 일상 업무도/.test(await A.locator('body').innerText()), `${이름} ① 답글이 보이고 칸이 비워짐`)
  if (!process.env.멈춤없이) {
  // ③ 연결 멈춤 → 3초 뒤 다시 잇기
  await A.evaluate(() => { localStorage.setItem('mock멈춤', '1'); window.__왕복 = [] })
  await 칸.click(); await 칸.fill('두 번째 답글 — 연결이 멈춘 척')
  await A.waitForTimeout(300)
  const t1 = Date.now()
  await 단추.click()
  let 잇는글 = false
  try { await A.waitForFunction(() => [...document.querySelectorAll('button')].some((b) => /연결을 다시 잇는 중/.test(b.innerText)), null, { timeout: 6000 }); 잇는글 = true } catch (e) { /* */ }
  const 보임때 = Date.now() - t1
  if (process.env.CAP && 잇는글) await 폼.screenshot({ path: `/tmp/g10/g357/${이름}_다시잇는중.png` }).catch(() => {})
  await A.waitForFunction(() => ![...document.querySelectorAll('button')].some((b) => /올리는 중|다시 잇는 중/.test(b.innerText)), null, { timeout: 12000 }).catch(() => {})
  const 걸림2 = Date.now() - t1
  const 왕복2 = await A.evaluate(() => window.__왕복 || [])
  await A.evaluate(() => localStorage.removeItem('mock멈춤'))
  봐(잇는글 && 왕복2.includes('goOffline ') && 왕복2.includes('goOnline ') && 걸림2 < 6000 && (await 칸.inputValue()) === '', `${이름} ③ 쓰기가 멈추면 3초 뒤 «연결을 다시 잇는 중…» → 다시 이어 올라감(문구 ${(보임때 / 1000).toFixed(1)}초 · 끝 ${(걸림2 / 1000).toFixed(1)}초)`, 왕복2.join(' | '))
  }
  // ② 새 글
  await A.goto(주소 + '/qna', { waitUntil: 'domcontentloaded' })
  await A.waitForFunction(() => !!document.querySelector('#mt-title'), null, { timeout: 15000 })
  await A.keyboard.press('Escape').catch(() => {})
  await A.locator('#mt-title').focus(); await A.locator('#mt-title').fill('새 글 빠르기 시험')
  await A.locator('#mt-say').fill('내용 — 올리기를 누른 뒤 얼마나 걸리나')
  const 핀 = A.locator('input[inputmode="numeric"][maxlength="4"]').first()
  if (await 핀.count()) await 핀.fill('1234')
  const 자유 = A.locator('button', { hasText: /자유/ }).first()
  await A.waitForTimeout(지연 * 3 + 300)
  await A.evaluate(() => { window.__왕복 = [] })
  const t2 = Date.now()
  const 올단추 = A.locator('button', { hasText: /^올리기$/ }).last()
  await 올단추.evaluate((b) => b.scrollIntoView({ block: 'center' })); await A.waitForTimeout(200)
  await A.evaluate(() => { window.__왕복 = [] })
  await 올단추.click()
  await A.waitForFunction(() => /✅ 올렸습니다/.test(document.body.innerText), null, { timeout: 15000 }).catch(() => {})
  const 걸림3 = Date.now() - t2
  const 왕복3 = await A.evaluate(() => (window.__왕복 || []).filter((x) => /^(get|set) /.test(x)))
  결과[이름 + '글'] = 걸림3
  봐(/✅ 올렸습니다/.test(await A.locator('body').innerText()), `${이름} ② 새 글 올라감 — 누르고 ${(걸림3 / 1000).toFixed(2)}초`, 왕복3.join(' | '))
  봐(!왕복3.some((x) => /qna_who|qna_block/.test(x)), `${이름} ② 새 글 — 누른 뒤에 옛 번호 · 몰래표를 다시 읽지 않음`)
  봐(오류.length === 0, `${이름} 화면 오류 없음`, 오류.join(' | '))
  if (이름 === '폰') 봐((await A.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 1, '폰 가로 넘침 없음')
  await 판.close()
}
await 브.close()
console.log('\n걸린 시간(ms):', JSON.stringify(결과))
console.log(`${ok} 통과 · ${bad} 실패`)
process.exit(bad ? 1 : 0)
