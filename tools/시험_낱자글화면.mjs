// 🚫 G632 낱자 글 막기 · 🤫 G633 아무 말 없이 — 화면 시험(가짜 파이어베이스 판)
//   소장님(11-10): 「자음만 쓴 글 삭제해줘. 그리고, 이렇게 쓰는 글은 맵톡에 올라오지 못하게 막아줘」
//   node tools/시험_낱자글화면.mjs [주소=http://127.0.0.1:4632]
//     준비: 가짜 파이어베이스 판(/tmp/g10/mockfb + vite.config.mock632.js → /tmp/g10/dmock632)을 정적 서버로. PC bat 에서는 안 돌림(Playwright 필요)
//   PC 1280 · 폰 430 마다(진짜 데이터베이스 주소는 모두 막음 — 503):
//   🤫 G633 막을 때 아무 글도 안 뜸(소장님 「알림은 제거해」 · 「제거....») — 안 올라가고 · 안내 글 없음 · 앞서 떠 있던 말도 지워짐
//   ① 한 줄 남기기 창 — «ㄱ»(한 글자 — 원래 말 «두 글자만이라도») 뒤 «ㄱㄱ» · «ㅋㅋ!!» · 76자에서 잘려 낱자만 남는 긴 첫 줄 → 말 없음 · 글 그대로
//      / «ㅋㅋ 좋아요» → 올라감(제목 «[후기·건의] ㅋㅋ 좋아요»)
//   ② 맵톡 글쓰기 — 빈 칸(원래 말 «두 글자 이상») 뒤 제목 «ㄱㄱ» → 말 없음 · 제목 비우고 내용 «ㅇㅇ» → 말 없음 / 제목 «가상 현장 질문입니다» → 올라감
//   ③ 답글 — «ㅋㅋㅋ» → 말 없음 / «가상 답글 고맙습니다» → 올라감
//   ④ ✏️ 내 글 고치기 — 제목 «ㅎㅎ» → 말 없음 · 제목 그대로    ⑤ 내 답글 고치기 — «ㅠㅠ» → 말 없음 · 답글 그대로
//   ⑥ 도구 이야기(/tools/rebar-weight) — «ㅇㅇ» → 말 없음 · 글 그대로
//   ⑦ 오류 0 · 폰 가로 넘침 0
import { createRequire } from 'module'
import { fileURLToPath, pathToFileURL } from 'url'
import path from 'path'
const require = createRequire('/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
await import(pathToFileURL(path.join(ROOT, 'web/src/lib/낱자글.js')).href)   /* 화면이 쓰는 그 파일이 열리는지만 */
const 주소 = process.argv[2] || 'http://127.0.0.1:4632'
let ok = 0, bad = 0
const 봐 = (c, m, 더 = '') => { if (c) { ok++; console.log('✓', m) } else { bad++; console.log('✗', m, String(더).slice(0, 400)) } }
const 지금 = Date.now()
const 키 = (n) => '-P3pe' + String(n).padStart(15, '0')
const 나 = 'mockuser632'
const 씨앗 = {
  qna: {
    [키(1)]: { t: '[후기·건의] 가상 현장 소식 공유합니다', b: '가상 내용입니다', nick: '너그러운 크레인7', uid: 'u1', at: 지금 - 7 * 3600e3 },
    [키(2)]: { t: '[후기·건의] 내가 쓴 가상 글입니다', b: '가상 본문', nick: '가상 별명1', uid: 나, at: 지금 - 5 * 3600e3 },
  },
  qna_a: { [키(1)]: { a1: { b: '내가 단 가상 답글입니다', nick: '가상 별명1', uid: 나, op: false, at: 지금 - 3 * 3600e3 } } },
  qna_del: {}, qna_top: {},
}
const 브 = await chromium.launch()
const 쉬어 = (ms) => new Promise((s) => setTimeout(s, ms))
for (const [기기, w] of [['PC', 1280], ['폰', 430]]) {
  const 판 = await 브.newContext({ viewport: { width: w, height: 900 } })
  await 판.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|geojs/, (r) => r.fulfill({ status: 200, body: '' }))
  const 진짜 = []
  await 판.route(/firebaseio\.com|googleapis\.com/, (r) => { 진짜.push(r.request().method() + ' ' + r.request().url().split('?')[0]); return r.fulfill({ status: 503, body: 'down' }) })
  await 판.addInitScript(([s, u]) => {
    if (!sessionStorage.getItem('씨앗됨')) { localStorage.setItem('mockdb', JSON.stringify(s)); sessionStorage.setItem('씨앗됨', '1') }
    localStorage.setItem('mockuid', u)
    localStorage.setItem('mock지연', '60'); localStorage.setItem('kcm_notice_seen', '2026-10-필독')
    try { sessionStorage.setItem('kcm_notice_seen', '2026-10-업체') } catch (e) { /* */ }
  }, [씨앗, 나])
  const A = await 판.newPage()
  const 오류 = []; A.on('pageerror', (e) => 오류.push(String(e).slice(0, 150)))
  const 디비 = () => A.evaluate(() => JSON.parse(localStorage.getItem('mockdb') || '{}'))
  const 글수 = async () => Object.keys((await 디비()).qna || {}).length
  const 답수 = async () => Object.values((await 디비()).qna_a || {}).reduce((s, x) => s + Object.keys(x || {}).length, 0)
  const 글에 = async (m) => (await A.locator('body').innerText()).includes(m)
  const 말없음 = async () => !(await 글에('자음 · 모음')) && !(await 글에('올리지 못했습니다'))

  // ① 한 줄 남기기 창
  await A.goto(주소 + '/forms', { waitUntil: 'domcontentloaded' })
  await 쉬어(1200)
  await A.evaluate(() => sessionStorage.setItem('kcm_ask_now', 'forms'))
  await A.waitForSelector('.askbox textarea.askta', { timeout: 8000 })
  const 처음글 = await 글수()
  const 막힌창 = []
  for (const s of ['ㄱㄱ', 'ㅋㅋ!!', 'ㅋ'.repeat(75) + ' 좋아요']) {
    await A.fill('.askbox textarea.askta', 'ㄱ')
    await A.click('.askbox .askrow .btn.primary'); await 쉬어(250)
    const 원래말 = (await A.locator('.askbox .askerr').innerText().catch(() => '')).includes('두 글자만이라도')
    await A.fill('.askbox textarea.askta', s)
    await A.click('.askbox .askrow .btn.primary'); await 쉬어(350)
    막힌창.push([s.slice(0, 8), 원래말, (await A.locator('.askbox .askerr').count()) === 0 && (await 말없음())])
  }
  봐(막힌창.every(([, a, b]) => a && b) && (await 글수()) === 처음글, `${기기} ① 한 줄 남기기 창 — «ㄱㄱ» · «ㅋㅋ!!» · 긴 «ㅋ…» 첫 줄 → 안내 글 없음(떠 있던 «두 글자만이라도» 도 지워짐) · 글 그대로`, JSON.stringify(막힌창))
  await A.fill('.askbox textarea.askta', 'ㅋㅋ 좋아요')
  await A.click('.askbox .askrow .btn.primary')
  await A.waitForFunction((n) => Object.keys((JSON.parse(localStorage.getItem('mockdb') || '{}').qna) || {}).length > n, 처음글, { timeout: 8000 }).catch(() => {})
  const 올린창 = Object.values((await 디비()).qna || {}).map((x) => x.t)
  봐(올린창.includes('[후기·건의] ㅋㅋ 좋아요') && (await 글수()) === 처음글 + 1, `${기기} ① «ㅋㅋ 좋아요»(진짜 글자 있음) → 올라감`, JSON.stringify(올린창))
  await A.keyboard.press('Escape')

  // ② 맵톡 글쓰기
  await A.goto(주소 + '/qna', { waitUntil: 'domcontentloaded' })
  await A.waitForFunction(() => !!document.querySelector('#mt-title') && document.body.innerText.includes('가상 현장 소식'), null, { timeout: 15000 })
  const 자유 = A.locator('button.mt-place-b', { hasText: '지역 없이(자유)' })
  if (await 자유.count()) await 자유.first().click()
  const 핀 = A.locator('input[inputmode="numeric"][maxlength="4"]').first()
  const 글전 = await 글수()
  if (await 핀.count()) await 핀.fill('1234')
  await A.fill('#mt-title', ''); await A.fill('#mt-say', '')
  await A.click('button.mt-send'); await 쉬어(300)
  const 원래말 = await 글에('두 글자 이상 적어 주세요')
  await A.fill('#mt-title', 'ㄱㄱ'); await A.fill('#mt-say', '')
  await A.click('button.mt-send'); await 쉬어(350)
  const 제목막음 = (await 말없음()) && !(await 글에('두 글자 이상 적어 주세요'))
  await A.fill('#mt-title', ''); await A.fill('#mt-say', 'ㅇㅇ')
  await A.click('button.mt-send'); await 쉬어(350)
  const 첫줄막음 = await 말없음()
  봐(원래말 && 제목막음 && 첫줄막음 && (await 글수()) === 글전, `${기기} ② 맵톡 글쓰기 — 제목 «ㄱㄱ» · 제목 비우고 «ㅇㅇ» → 안내 글 없음(떠 있던 «두 글자 이상» 도 지워짐) · 글 그대로`, JSON.stringify([원래말, 제목막음, 첫줄막음]))
  await A.fill('#mt-title', '가상 현장 질문입니다'); await A.fill('#mt-say', '가상 내용입니다')
  if (await 핀.count()) await 핀.fill('1234')
  await A.click('button.mt-send')
  await A.waitForFunction((n) => Object.keys((JSON.parse(localStorage.getItem('mockdb') || '{}').qna) || {}).length > n, 글전, { timeout: 10000 }).catch(() => {})
  봐(Object.values((await 디비()).qna || {}).some((x) => x.t === '[후기·건의] 가상 현장 질문입니다'), `${기기} ② «가상 현장 질문입니다» → 올라감`)

  // ③ 답글
  await A.goto(주소 + '/qna', { waitUntil: 'domcontentloaded' })
  await A.waitForFunction(() => document.body.innerText.includes('가상 현장 소식'), null, { timeout: 15000 })
  await A.locator('.mt-card', { hasText: '가상 현장 소식' }).first().click()
  const 폼 = A.locator('.mt-af', { has: A.locator('textarea[placeholder*="너그러운 크레인7"]') }).first()
  await 폼.locator('textarea.mt-af-t').waitFor({ timeout: 8000 })
  const 답전 = await 답수()
  await 폼.locator('textarea.mt-af-t').fill('ㅋㅋㅋ')
  await 폼.locator('button', { hasText: /답글 올리기/ }).click(); await 쉬어(350)
  봐((await 말없음()) && (await 답수()) === 답전, `${기기} ③ 답글 «ㅋㅋㅋ» → 안내 글 없음 · 답글 그대로`)
  await 폼.locator('textarea.mt-af-t').fill('가상 답글 고맙습니다')
  await 폼.locator('button', { hasText: /답글 올리기/ }).click()
  await A.waitForFunction((n) => Object.values((JSON.parse(localStorage.getItem('mockdb') || '{}').qna_a) || {}).reduce((s, x) => s + Object.keys(x || {}).length, 0) > n, 답전, { timeout: 10000 }).catch(() => {})
  봐((await 답수()) === 답전 + 1, `${기기} ③ «가상 답글 고맙습니다» → 올라감`)

  // ⑤ 내 답글 고치기(같은 글 안)
  const 고침단추 = A.locator('button.mt-aed[aria-label="내 답글 고치기"]').first()
  await 고침단추.waitFor({ timeout: 8000 })
  await 고침단추.click()
  await A.fill('textarea[aria-label="답글 고치기"]', 'ㅠㅠ')
  await A.click('button.mt-aedit-ok'); await 쉬어(350)
  const 답글그대로 = ((await 디비()).qna_a[키(1)].a1 || {}).b === '내가 단 가상 답글입니다'
  봐((await 말없음()) && 답글그대로, `${기기} ⑤ 내 답글 고치기 «ㅠㅠ» → 안내 글 없음 · 답글 그대로`)

  // ④ 내 글 고치기
  await A.goto(주소 + '/qna/' + 키(2), { waitUntil: 'domcontentloaded' })   /* 글 한 장으로 바로(목록은 앞 글 창이 덮고 있을 수 있음) */
  await A.waitForFunction(() => document.body.innerText.includes('내가 쓴 가상 글'), null, { timeout: 15000 })
  const 글고침 = A.locator('button.btn.line', { hasText: '✏️ 고치기' }).first()
  await 글고침.waitFor({ timeout: 8000 })
  await 글고침.click()
  const 제목칸 = A.locator('input.inp[maxlength="70"]').first()
  await 제목칸.waitFor({ timeout: 5000 })
  await 제목칸.fill('ㅎㅎ')
  await A.locator('button.btn.primary', { hasText: '고친 것 올리기' }).click(); await 쉬어(350)
  봐((await 말없음()) && (await 디비()).qna[키(2)].t === '[후기·건의] 내가 쓴 가상 글입니다', `${기기} ④ 내 글 고치기 제목 «ㅎㅎ» → 안내 글 없음 · 제목 그대로`)

  // ⑥ 도구 이야기
  await A.goto(주소 + '/tools/rebar-weight', { waitUntil: 'domcontentloaded' })
  await A.waitForSelector('.dy textarea.dy-ta', { timeout: 15000 })
  const 도전 = await 글수()
  await A.fill('.dy textarea.dy-ta', 'ㅇㅇ')
  await A.locator('.dy .kt-btns button').first().click(); await 쉬어(350)
  봐((await A.locator('.dy .dy-err').count()) === 0 && (await 말없음()) && (await 글수()) === 도전, `${기기} ⑥ 도구 이야기 «ㅇㅇ» → 안내 글 없음 · 글 그대로`)

  // ⑦
  if (기기 === '폰') 봐((await A.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 1, '폰 가로 넘침 없음')
  봐(오류.length === 0, `${기기} 오류 0`, 오류.join(' | '))
  봐(!진짜.some((x) => /^(PUT|POST|PATCH)/.test(x)), `${기기} 진짜 데이터베이스로 쓰기 0`, 진짜.join(' | '))
  await 판.close()
}
await 브.close()
console.log(`\n${bad ? '❌' : '✅'} 시험_낱자글화면 ${ok}/${ok + bad}`)
process.exit(bad ? 1 : 0)
