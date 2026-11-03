/**
 * 🔑 G528 (2026-11-03) 맵톡 «운영자 기기로 쓴 글 · 답글 = K-건설맵» 화면 시험 — 가짜 파이어베이스 판(vite.config.mock.js)을 띄운 뒤:
 *   node tools/시험_맵톡운영자표.mjs [주소=http://127.0.0.1:4994]   (Playwright · PC bat 에서는 안 돌림)
 *   소장님 「아니 왜 내가 써도 건설맵이 안뜨지? 맵톡에」 「오늘자 올린 거 모두 내가 쓴거야」
 *   — 10/31 ~ 11/03 답글 16개가 운영자 목록에 없던 브라우저(pIFo0Q…)에서 올라가 «침착한 지게차548» 로 보였음
 *   ① 보는 사람: 그 번호의 옛 답글(op 거짓 · 자동 별명)이 «K-건설맵» · 카드 «✅ K-건설맵» · 그 번호의 옛 글 카드 · 펼친 창 맨 위 글쓴이도 K-건설맵 · 남의 답글은 별명 그대로
 *   ② 그 브라우저(운영자): 새 답글이 «K-건설맵 · op 참» 으로 저장 · 화면에 K-건설맵
 *   ③ 보통 이용자: 새 답글은 제 별명 · op 없음(그대로)
 *   ⑤ 관리 화면(/admin): 맵톡 목록의 그 번호 글 · 답글도 K-건설맵 · 남은 그대로
 *   ④ 폰 430 · 오류 0
 *   옛 판(G527b)에 돌리면 ✗ 가 나야 맞습니다(11-03 확인: 19 가운데 12 ✗)
 */
import { createRequire } from 'module'
const require = createRequire('/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const 주소 = process.argv[2] || 'http://127.0.0.1:4994'
let ok = 0, bad = 0
const 봐 = (c, m, 더 = '') => { if (c) { ok++; console.log('  ✓', m) } else { bad++; console.log('  ✗', m, 더) } }
const 지금 = Date.now()
const 키 = (n) => '-P5zz' + String(n).padStart(15, '0')
const 새기기 = 'pIFo0QpU30X8WJbrVxAg2fLmG2J3'
const 씨앗 = {
  qna: {
    [키(1)]: { t: '[후기·건의] 감사합니다', b: '잘 쓰고 있습니다', nick: '노련한 소장891', uid: 'u1', at: 지금 - 5 * 3600e3 },
    [키(2)]: { t: '[후기·건의] 토공사 시공계획서 부탁드려요', b: '초보 공무 너무 힘드네요', nick: '정확한 반장187', uid: 'u2', at: 지금 - 4 * 3600e3 },
    [키(3)]: { t: '[후기·건의] 새 서식을 올렸습니다', b: '서식 탭 ③ 시공계획서 칸', nick: '침착한 지게차548', uid: 새기기, at: 지금 - 3 * 3600e3 },
  },
  qna_a: {
    [키(1)]: { '-A1': { b: '네, 감사합니다. 잘 부탁드립니다.', nick: '침착한 지게차548', uid: 새기기, at: 지금 - 2 * 3600e3, op: false } },
    [키(2)]: {
      '-A2': { b: '저도 궁금합니다', nick: '묵직한 기사218', uid: 'u3', at: 지금 - 3.5 * 3600e3, op: false },
      '-A3': { b: '만들었습니다 — 서식 탭 ③', nick: '침착한 지게차548', uid: 새기기, at: 지금 - 3.2 * 3600e3, op: false },
    },
  },
  qna_del: {}, qna_top: {},
}
const 브 = await chromium.launch()
async function 판열기(uid, w = 1280) {
  const 판 = await 브.newContext({ viewport: { width: w, height: 900 } })
  await 판.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|geojs/, (r) => r.fulfill({ status: 200, body: '' }))
  await 판.route(/firebaseio\.com/, (r) => r.fulfill({ status: 503, body: 'down' }))      // 쓰기는 가짜 데이터베이스로(REST 막음)
  await 판.addInitScript(([s, u]) => {
    if (!sessionStorage.getItem('씨앗됨')) { localStorage.setItem('mockdb', JSON.stringify(s)); localStorage.setItem('mockuid', u); sessionStorage.setItem('씨앗됨', '1') }
    localStorage.setItem('mock지연', '0'); localStorage.setItem('kcm_notice_seen', '2026-10-필독')
    try { sessionStorage.setItem('kcm_notice_seen', '2026-10-업체') } catch (e) { /* */ }
  }, [씨앗, uid])
  const A = await 판.newPage()
  const 오류 = []; A.on('pageerror', (e) => 오류.push(String(e).slice(0, 150)))
  await A.goto(주소 + '/qna', { waitUntil: 'domcontentloaded' })
  await A.waitForFunction(() => document.body.innerText.includes('토공사 시공계획서 부탁드려요'), null, { timeout: 20000 })
  await A.waitForTimeout(800)
  return { 판, A, 오류 }
}
const 카드 = (A, 글) => A.locator('.mt-card', { hasText: 글 }).first()
async function 펼치기(A, 글, 기다릴 = '.mt-ans') {
  /* 열려 있는 글 창(운영자 기기는 처음에 안내 글이 열려 있을 수 있음)을 닫고 */
  for (let i = 0; i < 3 && (await A.locator('.mt-back:visible').count()); i++) { await A.locator('.mt-back:visible').first().click(); await A.waitForTimeout(300) }
  await 카드(A, 글).click()
  await A.waitForSelector(기다릴, { timeout: 10000 })
  await A.waitForTimeout(400)
}
const 답머리 = (A) => A.locator('.mt-ans .mt-ans-h b').allInnerTexts()

console.log('① 보는 사람(보통 이용자 기기)')
{
  const { 판, A, 오류 } = await 판열기('u_viewer')
  const c1 = await 카드(A, '감사합니다').innerText()
  봐(/✅ K-건설맵/.test(c1), '옛 답글(op 거짓)이 운영자 번호 → 카드에 «✅ K-건설맵»', c1.replace(/\s+/g, ' ').slice(0, 120))
  const c3 = await 카드(A, '새 서식을 올렸습니다').innerText()
  봐(/K-건설맵/.test(c3) && !/침착한 지게차548/.test(c3), '그 번호의 옛 글 카드 글쓴이 = K-건설맵', c3.replace(/\s+/g, ' ').slice(0, 120))
  await 펼치기(A, '감사합니다')
  const h1 = await 답머리(A)
  봐(h1.includes('K-건설맵') && !h1.some((t) => t.includes('침착한 지게차548')), '펼친 글 답글 머리 = K-건설맵', JSON.stringify(h1))
  await A.keyboard.press('Escape'); await A.waitForTimeout(300)
  await A.goto(주소 + '/qna', { waitUntil: 'domcontentloaded' }); await A.waitForTimeout(1200)
  await 펼치기(A, '토공사 시공계획서 부탁드려요')
  const h2 = await 답머리(A)
  봐(h2.some((t) => t.includes('묵직한 기사218')) && h2.includes('K-건설맵') && !h2.some((t) => t.includes('침착한 지게차548')), '남의 답글은 별명 그대로 · 운영자 번호 답글만 K-건설맵', JSON.stringify(h2))
  await A.keyboard.press('Escape'); await A.waitForTimeout(300)
  await A.goto(주소 + '/qna', { waitUntil: 'domcontentloaded' }); await A.waitForTimeout(1200)
  await 펼치기(A, '새 서식을 올렸습니다', '.mt-sheet .mt-who')   // 답글 없는 글 — 창 맨 위 글쓴이를 기다림
  const 위 = (await A.locator('.mt-sheet .mt-who').last().innerText()).trim()
  봐(/K-건설맵/.test(위) && !/침착한 지게차548/.test(위), '그 번호의 옛 글을 펼친 창 맨 위 글쓴이 = K-건설맵', 위)
  봐(!오류.length, '오류 0(보는 사람)', 오류.join(' | '))
  await 판.close()
}

async function 답쓰기(A, 글, 글쓴이, 말) {
  await 펼치기(A, 글)
  /* 펼친 글 창의 «글쓴이 님에게» 칸(뒤쪽 안내 글에도 답글 칸이 있어 글쓴이 별명으로 고름) */
  const 폼 = A.locator('.mt-af', { has: A.locator(`textarea[placeholder*="${글쓴이}"]`) }).last()
  const 칸 = 폼.locator('textarea.mt-af-t')
  await 칸.click(); await 칸.fill(말)
  await 폼.locator('button', { hasText: /답글 올리기/ }).first().click()
  await A.waitForFunction((m) => document.body.innerText.includes(m), 말, { timeout: 10000 })
  await A.waitForTimeout(500)
  return A.evaluate((m) => { const d = JSON.parse(localStorage.getItem('mockdb') || '{}'); for (const g of Object.values(d.qna_a || {})) for (const a of Object.values(g || {})) if (a && a.b === m) return a; return null }, 말)
}

console.log('② 그 브라우저(운영자 · 11-03 등록)')
{
  const { 판, A, 오류 } = await 판열기(새기기)
  const a = await 답쓰기(A, '토공사 시공계획서 부탁드려요', '정확한 반장187', '확인했습니다 — 링크 드립니다')
  봐(a && a.nick === 'K-건설맵' && a.op === true && a.uid === 새기기, '새 답글 저장 = K-건설맵 · op 참', JSON.stringify(a))
  const h = await 답머리(A)
  봐(h.filter((t) => t === 'K-건설맵').length >= 2, '화면 답글 머리 K-건설맵(옛 것 + 새 것)', JSON.stringify(h))
  봐(!오류.length, '오류 0(운영자)', 오류.join(' | '))
  await 판.close()
}

console.log('③ 보통 이용자 — 그대로')
{
  const { 판, A, 오류 } = await 판열기('u_normal_77')
  const a = await 답쓰기(A, '감사합니다', '노련한 소장891', '저도 잘 쓰고 있어요')
  봐(a && a.nick && a.nick !== 'K-건설맵' && !a.op, '보통 이용자 새 답글 = 제 별명 · op 없음', JSON.stringify(a))
  봐(!오류.length, '오류 0(보통 이용자)', 오류.join(' | '))
  await 판.close()
}

console.log('⑤ 관리 화면(/admin · 사무실 크롬 번호)')
{
  const 판 = await 브.newContext({ viewport: { width: 1280, height: 900 } })
  await 판.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|geojs/, (r) => r.fulfill({ status: 200, body: '' }))
  await 판.route(/firebaseio\.com/, (r) => r.fulfill({ status: 503, body: 'down' }))
  await 판.addInitScript(([s]) => {
    if (!sessionStorage.getItem('씨앗됨')) { localStorage.setItem('mockdb', JSON.stringify(s)); localStorage.setItem('mockuid', 'ZglL1g3X5UZFBA2590LirDnEnil1'); sessionStorage.setItem('씨앗됨', '1') }
    localStorage.setItem('mock지연', '0')
  }, [씨앗])
  const A = await 판.newPage()
  const 오류 = []; A.on('pageerror', (e) => 오류.push(String(e).slice(0, 150)))
  await A.goto(주소 + '/admin', { waitUntil: 'domcontentloaded' })
  await A.waitForFunction(() => document.body.innerText.includes('새 서식을 올렸습니다'), null, { timeout: 20000 })
  await A.waitForTimeout(600)
  const 글 = await A.evaluate(() => document.body.innerText)
  봐(!/침착한 지게차548/.test(글), '관리 화면에 자동 별명이 안 보임(글 · 답글 모두 K-건설맵)', (글.match(/.{0,40}침착한 지게차548.{0,20}/) || [''])[0])
  /* 맵톡 칸(카드)마다 — 겹친 카드는 빼고 */
  const 칸 = await A.evaluate(() => [...document.querySelectorAll('.card')].filter((c) => !c.querySelector('.card')).map((c) => c.innerText.replace(/\s+/g, ' ')))
  const 칸글 = (말) => 칸.find((t) => t.includes(말)) || ''
  봐(/새 서식을 올렸습니다 K-건설맵 · /.test(칸글('새 서식을 올렸습니다')), '관리: 그 번호의 옛 글 글쓴이 = K-건설맵', 칸글('새 서식을 올렸습니다').slice(0, 120))
  봐(/잘 쓰고 있습니다 K-건설맵 · .*네, 감사합니다/.test(칸글('감사합니다')), '관리: 그 번호의 옛 답글 = K-건설맵', 칸글('감사합니다').slice(0, 160))
  봐(/묵직한 기사218 · .*K-건설맵 · /.test(칸글('토공사 시공계획서 부탁드려요')) && /정확한 반장187 · /.test(칸글('토공사 시공계획서 부탁드려요')), '관리: 남의 글 · 답글은 별명 그대로 · 운영자 번호 답글만 K-건설맵', 칸글('토공사 시공계획서 부탁드려요').slice(0, 200))
  봐(!오류.length, '오류 0(관리 화면)', 오류.join(' | '))
  await 판.close()
}

console.log('④ 폰 430')
{
  const { 판, A, 오류 } = await 판열기('u_phone', 430)
  const c1 = await 카드(A, '감사합니다').innerText()
  봐(/✅ K-건설맵/.test(c1), '폰 카드 «✅ K-건설맵»')
  봐((await A.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 1, '폰 가로 넘침 0')
  봐(!오류.length, '오류 0(폰)', 오류.join(' | '))
  await 판.close()
}
await 브.close()
console.log(`\n${bad ? '✗' : '✓'} 시험_맵톡운영자표 ${ok}/${ok + bad}`)
process.exit(bad ? 1 : 0)
