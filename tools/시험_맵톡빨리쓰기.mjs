// ⏱ G370 맵톡 «연결을 다시 잇는 중…» 이 뜨며 느리던 것 — 웹소켓 쓰기가 1.2초 안에 안 끝나면 같은 값을 HTTPS(REST) 로도 보냄
//   가짜 파이어베이스 판(/tmp/g10/dmock · 왕복 지연 · 쓰기 멈춤) + 진짜 주소 REST 는 시험이 받아 줌(지연 같게)
//   다른 예시 세 벌 + 보통 때:
//     ⓪ 보통(웹소켓 살아 있음) — 0.7초에 끝 · REST 쓰기 0번(두 번 쓰지 않음)
//     A 답글 — 웹소켓 멈춤 → 1.2초 뒤 REST 한 번으로 끝(«다시 잇는 중» 안 뜸 · 전엔 3초 뒤 다시 잇고 4.7초)
//     B 새 글 + 삭제 숫자(핀) — 웹소켓 멈춤 → 핀 · 글 둘 다 REST 로 · 같은 값 · 로그인 표(auth) 붙음
//     C 웹소켓 멈춤 + REST 도 안 됨 → 전처럼 3초 뒤 «연결을 다시 잇는 중…» → 다시 이어 올라감
//     D 몰래 차단된 기기 — 몰래표를 HTTPS 로 읽어 sb 를 붙여 씀(웹소켓 get 없이)
//   node tools/시험_맵톡빨리쓰기.mjs [주소=http://127.0.0.1:4997]  · PC bat 에서는 안 돌림(Playwright · 가짜 판 필요)
import { createRequire } from 'module'
const require = createRequire('/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const 주소 = process.argv[2] || 'http://127.0.0.1:4997'
const 지연 = 700
let ok = 0, bad = 0
const 봐 = (c, m, 더 = '') => { if (c) { ok++; console.log('✓', m) } else { bad++; console.log('✗', m, 더) } }
const 지금 = Date.now()
const 키 = (n) => '-P3pe' + String(n).padStart(15, '0')
const 씨앗 = { qna: { [키(1)]: { t: '[후기·건의] 가상 현장 소식 공유합니다', b: '가상 내용입니다', nick: '너그러운 크레인7', uid: 'u1', at: 지금 - 7 * 3600e3 } }, qna_a: {}, qna_del: {} }
const 브 = await chromium.launch()
const 시간 = {}
for (const [기기, w] of [['PC', 1280], ['폰', 430]]) {
  const 판 = await 브.newContext({ viewport: { width: w, height: 900 } })
  await 판.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|geojs/, (r) => r.fulfill({ status: 200, body: '' }))
  const REST = []
  const 상태 = { 막힘: false, 차단: false }
  await 판.route(/firebaseio\.com/, async (r) => {
    const q = r.request(), u = q.url()
    const 길 = decodeURIComponent(new URL(u).pathname).replace(/^\//, '').replace(/\.json$/, '')
    REST.push({ m: q.method(), 길, auth: /[?&]auth=/.test(u), b: q.postData() || '', t: Date.now() })
    if (/^dl\//.test(길)) return r.fulfill({ status: 200, contentType: 'application/json', body: q.method() === 'GET' ? '0' : '1', headers: { ETag: 'x' } })
    if (상태.막힘) return r.fulfill({ status: 503, body: 'down' })
    await new Promise((s) => setTimeout(s, 지연))
    if (q.method() === 'PUT') return r.fulfill({ status: 204, body: '' })
    if (/^qna_block\//.test(길)) return r.fulfill({ status: 200, contentType: 'application/json', body: 상태.차단 ? '{"at":1}' : 'null' })
    return r.fulfill({ status: 200, contentType: 'application/json', body: 'null' })
  })
  await 판.addInitScript(([s, ms]) => {
    if (!sessionStorage.getItem('씨앗됨')) { localStorage.setItem('mockdb', JSON.stringify(s)); sessionStorage.setItem('씨앗됨', '1') }
    localStorage.setItem('mock지연', String(ms)); localStorage.setItem('kcm_notice_seen', '2026-10-필독')
    try { sessionStorage.setItem('kcm_notice_seen', '2026-10-업체') } catch (e) { /* */ }
  }, [씨앗, 지연])
  const A = await 판.newPage()
  const 오류 = []; A.on('pageerror', (e) => 오류.push(String(e).slice(0, 150)))
  await A.goto(주소 + '/qna', { waitUntil: 'domcontentloaded' })
  await A.waitForFunction(() => document.body.innerText.includes('가상 현장 소식'), null, { timeout: 15000 })
  await A.locator('.mt-card', { hasText: '가상 현장 소식' }).first().click()
  const 폼 = A.locator('.mt-af', { has: A.locator('textarea[placeholder*="너그러운 크레인7"]') }).first()
  const 칸 = 폼.locator('textarea.mt-af-t')
  const 단추 = 폼.locator('button', { hasText: /답글 올리기/ })
  await 칸.waitFor({ timeout: 8000 })
  const 다끝 = () => A.waitForFunction(() => ![...document.querySelectorAll('button')].some((b) => /올리는 중|다시 잇는 중/.test(b.innerText)), null, { timeout: 15000 }).catch(() => {})
  const 답글 = async (글, 준비) => {
    await 칸.click(); await 칸.fill(글)
    await A.waitForTimeout(지연 * 3 + 300)          // 칸을 누를 때 미리 읽기(옛 번호 · 몰래표)가 끝나게
    if (준비) await 준비()
    REST.length = 0
    await A.evaluate(() => { window.__왕복 = []; window.__잇는글 = false; window.__감시 = setInterval(() => { if ([...document.querySelectorAll('button')].some((b) => /연결을 다시 잇는 중/.test(b.innerText))) window.__잇는글 = true }, 50) })
    const t0 = Date.now()
    상태.t0 = t0
    await 단추.click()
    await A.waitForTimeout(150); await 다끝()
    const 걸림 = Date.now() - t0
    const 잇는글 = await A.evaluate(() => { clearInterval(window.__감시); return window.__잇는글 })
    const 왕복 = await A.evaluate(() => window.__왕복 || [])
    return { 걸림, 잇는글, 왕복, REST: REST.filter((x) => !/^dl\//.test(x.길)).map((x) => ({ ...x, 뒤: x.t - t0 })), 비움: (await 칸.inputValue()) === '', t0 }
  }
  // ⓪ 보통
  let R = await 답글('보통 때 답글 — 웹소켓이 살아 있음')
  시간[기기 + '⓪'] = R.걸림
  봐(R.걸림 < 1200 && !R.REST.some((x) => x.m === 'PUT') && R.비움, `${기기} ⓪ 보통 — ${(R.걸림 / 1000).toFixed(2)}초 · REST 쓰기 0번(두 번 안 씀)`, JSON.stringify(R.REST))
  const 쓰기앞 = R.왕복.slice(0, R.왕복.findIndex((x) => /^set qna_a\//.test(x)))   // 그 뒤는 화면이 목록을 다시 읽음
  봐(!R.REST.some((x) => /qna_who|qna_block/.test(x.길) && x.뒤 < R.걸림 - 50) && 쓰기앞.length === 0, `${기기} ⓪ 누른 뒤 옛 번호 · 몰래표 다시 안 읽음(미리 읽어 둠) · 쓰기 앞 왕복 0`, JSON.stringify({ 쓰기앞, REST: R.REST }))
  // A 답글 — 웹소켓 멈춤
  R = await 답글('웹소켓이 멈춘 척 — REST 로 올라가야 함', () => A.evaluate(() => localStorage.setItem('mock멈춤', '1')))
  시간[기기 + 'A'] = R.걸림
  const 쓴 = R.REST.filter((x) => x.m === 'PUT')
  let 몸 = {}; try { 몸 = JSON.parse((쓴[0] || {}).b || '{}') } catch (e) { /* */ }
  봐(쓴.length === 1 && /^qna_a\/-P3pe0+1\/-Z/.test(쓴[0].길) && 쓴[0].auth && 몸.b === '웹소켓이 멈춘 척 — REST 로 올라가야 함' && 몸.uid && 몸.nick, `${기기} A 답글 REST 한 번 — qna_a/글/새 번호 · 로그인 표 · 같은 값`, JSON.stringify(쓴).slice(0, 300))
  봐(R.걸림 < 2600 && !R.잇는글 && R.비움 && /웹소켓이 멈춘 척/.test(await A.locator('body').innerText()), `${기기} A 웹소켓 멈춤 → ${(R.걸림 / 1000).toFixed(2)}초에 올라감 · «다시 잇는 중» 안 뜸(전엔 3초 뒤 다시 잇고 4.7초)`, JSON.stringify({ 걸림: R.걸림, 잇는글: R.잇는글 }))
  await A.evaluate(() => localStorage.removeItem('mock멈춤'))
  // C 웹소켓 멈춤 + REST 도 막힘 → 예전 길(3초 뒤 다시 잇기)
  R = await 답글('웹소켓도 REST 도 안 되는 척', async () => { 상태.막힘 = true; await A.evaluate(() => localStorage.setItem('mock멈춤', '1')) })
  상태.막힘 = false
  await A.evaluate(() => localStorage.removeItem('mock멈춤'))
  시간[기기 + 'C'] = R.걸림
  봐(R.잇는글 && R.왕복.includes('goOffline ') && R.왕복.includes('goOnline ') && R.걸림 < 6000 && R.비움, `${기기} C REST 도 막히면 전처럼 3초 뒤 «연결을 다시 잇는 중…» → ${(R.걸림 / 1000).toFixed(2)}초에 올라감`, JSON.stringify({ 걸림: R.걸림, 잇는글: R.잇는글, 왕복: R.왕복 }))
  // D 몰래 차단된 기기 — 몰래표를 HTTPS 로 읽어 sb
  상태.차단 = true
  await A.goto(주소 + '/qna', { waitUntil: 'domcontentloaded' })   // 새로 열어 몰래표를 다시 읽게(10분 기억은 화면마다)
  await A.waitForFunction(() => document.body.innerText.includes('가상 현장 소식'), null, { timeout: 15000 })
  if (!(await 칸.isVisible().catch(() => false))) await A.locator('.mt-card', { hasText: '가상 현장 소식' }).first().click()
  await 칸.waitFor({ timeout: 8000 })
  R = await 답글('차단된 기기의 답글 — sb 가 붙어야 함', () => A.evaluate(() => localStorage.setItem('mock멈춤', '1')))
  await A.evaluate(() => localStorage.removeItem('mock멈춤'))
  상태.차단 = false
  const 쓴D = R.REST.filter((x) => x.m === 'PUT')
  let 몸D = {}; try { 몸D = JSON.parse((쓴D[0] || {}).b || '{}') } catch (e) { /* */ }
  const 저장 = await A.evaluate(() => { const d = JSON.parse(localStorage.getItem('mockdb') || '{}'); return Object.values((d.qna_a || {})).flatMap((o) => Object.values(o)).filter((x) => /차단된 기기/.test(x.b)) })
  봐(몸D.sb === true && 저장.length === 1 && 저장[0].sb === true, `${기기} D 몰래 차단 기기 — 몰래표를 HTTPS 로 읽어 sb 붙임(REST · 웹소켓 값 둘 다)`, JSON.stringify({ 몸D, 저장 }).slice(0, 300))
  // B 새 글 + 핀 — 웹소켓 멈춤
  await A.goto(주소 + '/qna', { waitUntil: 'domcontentloaded' })
  await A.waitForFunction(() => !!document.querySelector('#mt-title'), null, { timeout: 15000 })
  await A.keyboard.press('Escape').catch(() => {})
  await A.locator('#mt-title').focus(); await A.locator('#mt-title').fill('가상 새 글 — 웹소켓 멈춤')
  await A.locator('#mt-say').fill('내용 — REST 로 핀과 글이 같이 올라가야 함')
  const 핀 = A.locator('input[inputmode="numeric"][maxlength="4"]').first()
  if (await 핀.count()) await 핀.fill('1234')
  await A.waitForTimeout(지연 * 3 + 300)
  await A.evaluate(() => localStorage.setItem('mock멈춤', '1'))
  const 올 = A.locator('button', { hasText: /^올리기$/ }).last()
  await 올.evaluate((b) => b.scrollIntoView({ block: 'center' })); await A.waitForTimeout(200)
  REST.length = 0
  const t2 = Date.now()
  await 올.click()
  await A.waitForFunction(() => /✅ 올렸습니다/.test(document.body.innerText), null, { timeout: 15000 }).catch(() => {})
  const 걸림B = Date.now() - t2
  await A.evaluate(() => localStorage.removeItem('mock멈춤'))
  시간[기기 + 'B'] = 걸림B
  const 쓴B = REST.filter((x) => x.m === 'PUT' && !/^dl\//.test(x.길))
  const 핀쓰기 = 쓴B.find((x) => /^qna_pins\//.test(x.길)), 글쓰기 = 쓴B.find((x) => /^qna\/-Z/.test(x.길))
  let 글몸 = {}; try { 글몸 = JSON.parse((글쓰기 || {}).b || '{}') } catch (e) { /* */ }
  봐(!!핀쓰기 && !!글쓰기 && 핀쓰기.auth && 글쓰기.auth && /가상 새 글 — 웹소켓 멈춤/.test(글몸.t || '') && 핀쓰기.길.split('/')[1] === 글쓰기.길.split('/')[1] && /^"[0-9a-f]{64}"$/.test(핀쓰기.b),
    `${기기} B 새 글 — 핀(해시 64자) · 글 둘 다 REST · 같은 번호 · 로그인 표`, JSON.stringify(쓴B).slice(0, 400))
  봐(/✅ 올렸습니다/.test(await A.locator('body').innerText()) && 걸림B < 4200, `${기기} B 웹소켓 멈춤 → 새 글 ${(걸림B / 1000).toFixed(2)}초에 올라감(핀 · 글 차례로)`, String(걸림B))
  봐(오류.length === 0, `${기기} 화면 오류 0`, 오류.join(' | '))
  if (기기 === '폰') 봐((await A.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 1, '폰 가로 넘침 없음')
  await 판.close()
}
await 브.close()
console.log('\n걸린 시간(ms):', JSON.stringify(시간))
console.log(`${ok} 통과 · ${bad} 실패`)
process.exit(bad ? 1 : 0)
