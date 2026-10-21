/**
 * 🔴 맵톡 «열어 둔 화면에 새 글 · 답글이 저절로 들어오나» 시험 (G288 · 2026-10-14)
 *   소장님: 「맵톡은 계속 보이게 해줘야 이용자들이 사용을 하지 이걸 실수 하면 어떻게 해」 · 「멥톡은 절대 실수하면 안돼. 방안도 마련해」
 *
 *   준비: 가짜 파이어베이스로 구운 판(vite.config.mock.js → /tmp/g10/dmock) 을 정적 서버로 띄움 — 진짜 맵톡 자료는 건드리지 않음
 *   node tools/시험_맵톡실시간.mjs [주소=http://127.0.0.1:4998]  (PLAYWRIGHT 필요: /tmp/g10/pw)
 *
 *   ① 글 3개로 연 화면(PC 1440 · 폰 430) → ② 다른 탭에서 새 글을 쓰면 «새로고침 없이» 몇 초 안에 맨 위에 보이나
 *   ③ 다른 탭에서 답글을 달면 그 글의 답글 수가 올라가나 ④ «⏳ 답 기다림» 수가 맞게 바뀌나(운영자 답이면 빠짐)
 *   ⑤ 글 지움(qna_del)이 바로 빠지나 ⑥ 듣기는 5개만(맨 끝 글 1 · 답글 · 지움 · 고정 · 명패 G320) — 글 전체를 듣지 않음(요금)
 *   ⑦ 다른 창에 갔다 오면(visibilitychange) 다시 읽음
 */
import { createRequire } from 'module'
const require = createRequire('/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
import fs from 'fs'

const 주소 = process.argv[2] || 'http://127.0.0.1:4998'
const 캡처 = process.env.CAPTURE || ''
let 통과 = 0, 실패 = 0
const 봄 = (이름, 참, 더 = '') => { if (참) { 통과++; console.log('  ✓', 이름, 더) } else { 실패++; console.log('  ✗', 이름, 더) } }

const 지금 = Date.now()
const 키 = (n) => '-P3pe' + String(n).padStart(15, '0')
const 씨앗 = {
  qna: {
    [키(1)]: { t: '[후기·건의] 처음 글', b: '내역서 질문입니다 — 노란 칸이 뭔가요?', nick: '부지런한 미장공1', uid: 'u1', at: 지금 - 3600e3 },
    [키(2)]: { t: '[후기·건의] 둘째 글', b: '공고 자동 고맙습니다. 질문 하나 더 — 1순위는 어디서 봐요?', nick: '성실한 반장2', uid: 'u2', at: 지금 - 1800e3 },
    [키(3)]: { t: '[후기·건의] 셋째 글', b: '현장 이야기 — 오늘 비가 와서 타설 못 했습니다', nick: '침착한 소장3', uid: 'u3', at: 지금 - 600e3 },
  },
  qna_a: {}, qna_del: {}, qna_top: {},
}

const 브 = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] })
for (const [이름, 크기] of [['PC', { width: 1440, height: 900 }], ['폰', { width: 430, height: 900 }]]) {
  console.log(`■ ${이름} ${크기.width}px`)
  const 판 = await 브.newContext({ viewport: 크기, userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36' })
  await 판.addInitScript((s) => { if (!sessionStorage.getItem('씨앗됨')) { localStorage.setItem('mockdb', JSON.stringify(s)); sessionStorage.setItem('씨앗됨', '1') } try { localStorage.setItem('kcm_notice_seen', '2026-10-필독') } catch (e) { /* */ } }, 씨앗)
  const A = await 판.newPage()
  await A.goto(주소 + '/qna', { waitUntil: 'domcontentloaded' })
  await A.waitForFunction(() => document.body.innerText.includes('셋째 글'), null, { timeout: 15000 })
  // «지금까지 글 N» 은 올라가며 세는 숫자(움직임) — 멈출 때까지 기다렸다 읽음
  const 글수 = async (p) => { let 앞 = -2; for (let i = 0; i < 30; i++) { const v = await p.evaluate(() => { const m = document.body.innerText.match(/지금까지\s*글\s*(\d+)/); return m ? +m[1] : -1 }); if (v === 앞 && v >= 0) return v; 앞 = v; await p.waitForTimeout(250) } return 앞 }
  봄('① 처음 글 3개', (await 글수(A)) === 3, `(${await 글수(A)})`)
  /* 🩹 2026-10-21 — G320 명패(qna_pro)를 열어 둔 화면에도 바로 붙이려고 듣기가 하나 늘었는데 이 시험만 4 로 남아 있었음 → 5(명패 · 작은 칸) */
  봄('⑥ 듣기 5개(맨 끝 글 · 답글 · 지움 · 고정 · 명패)', (await A.evaluate(() => window.__듣기수 || 0)) === 5, `(${await A.evaluate(() => window.__듣기수 || 0)})`)
  // ② 다른 탭에서 새 글
  const B = await 판.newPage()
  await B.goto(주소 + '/', { waitUntil: 'domcontentloaded' })
  await B.evaluate((k) => { const d = JSON.parse(localStorage.getItem('mockdb')); d.qna[k] = { t: '[후기·건의] 33행', b: '노란 칸 = 요율·기준값(발주기관 기준으로 고쳐 씀) 이 뭔지 모르겠습니다', nick: '부지런한 미장공258', uid: 'u9', at: Date.now() }; localStorage.setItem('mockdb', JSON.stringify(d)) }, '-Z' + String(Date.now()).padStart(15, '0') + '0001')
  const t0 = Date.now()
  let 들어옴 = false
  try { await A.waitForFunction(() => document.body.innerText.includes('33행'), null, { timeout: 8000 }); 들어옴 = true } catch (e) { /* */ }
  봄('② 새 글이 새로고침 없이 들어옴', 들어옴, `(${((Date.now() - t0) / 1000).toFixed(1)}초)`)
  봄('② 글 수 3 → 4', (await 글수(A)) === 4, `(${await 글수(A)})`)
  const 맨위 = await A.evaluate(() => { const c = [...document.querySelectorAll('.mt-card')].map((e) => e.innerText); const i = c.findIndex((t) => t.includes('33행')); return i })
  봄('② 새 글이 맨 위(첫 카드)', 맨위 === 0, `(${맨위})`)
  if (캡처) await A.screenshot({ path: `${캡처}_${이름}_새글.png` })
  // ③ 답글
  const 답수 = async (p, 제목) => p.evaluate((제) => { const c = [...document.querySelectorAll('.mt-card')].find((e) => e.innerText.includes(제)); if (!c) return -1; const m = c.innerText.match(/💬\s*(\d+)/); return m ? +m[1] : -1 }, 제목)
  const 앞답 = await 답수(A, '둘째 글')
  await B.evaluate((q) => { const d = JSON.parse(localStorage.getItem('mockdb')); d.qna_a = d.qna_a || {}; d.qna_a[q] = { '-Zr1': { b: '1순위 탭에 있습니다', nick: '꼼꼼한 목수', uid: 'u7', at: Date.now() } }; localStorage.setItem('mockdb', JSON.stringify(d)) }, 키(2))
  let 답들어옴 = false
  try { await A.waitForFunction(([제, 앞]) => { const c = [...document.querySelectorAll('.mt-card')].find((e) => e.innerText.includes(제)); const m = c && c.innerText.match(/💬\s*(\d+)/); return m && +m[1] === 앞 + 1 }, ['둘째 글', 앞답], { timeout: 8000 }); 답들어옴 = true } catch (e) { /* */ }
  봄('③ 답글 수가 새로고침 없이 오름', 답들어옴, `(${앞답} → ${await 답수(A, '둘째 글')})`)
  // ④ 답 기다림 (⏳ — 운영자 화면에서만 보이는 단추 · G316 «🙋 전문가 방 · 답 기다림 N» 과 헷갈리지 않게 ⏳ 로 찾음 · 수는 셈 대신 화면 글에서) — 운영자 답(op)이 달리면 빠지는지: 운영자 단추가 없으면 건너뜀
  const 기다림 = await A.evaluate(() => { const b = [...document.querySelectorAll('button.mt-room')].find((x) => x.innerText.includes('⏳ 답 기다림')); return b ? +(b.querySelector('em')?.innerText || -1) : null })
  if (기다림 !== null) 봄('④ 답 기다림 수', 기다림 >= 0, `(${기다림})`)
  // ⑤ 지움
  await B.evaluate((q) => { const d = JSON.parse(localStorage.getItem('mockdb')); d.qna_del = d.qna_del || {}; d.qna_del[q] = { at: Date.now(), by: 'u3' }; localStorage.setItem('mockdb', JSON.stringify(d)) }, 키(3))
  let 빠짐 = false
  try { await A.waitForFunction(() => !document.body.innerText.includes('셋째 글'), null, { timeout: 8000 }); 빠짐 = true } catch (e) { /* */ }
  봄('⑤ 지운 글이 바로 빠짐', 빠짐)
  // ⑦ 다른 창에 갔다 오면 다시 읽음 — 듣기를 끊은 채로 글을 넣고, 1분 넘게 지난 것처럼 하고 visibilitychange
  await A.evaluate(() => { window.__원래now = Date.now; const d = Date.now(); Date.now = () => d + 120000 })
  await B.evaluate((k) => { const d = JSON.parse(localStorage.getItem('mockdb')); d.qna_like = { [k]: { u5: true } }; localStorage.setItem('mockdb', JSON.stringify(d)) }, 키(1))
  await A.evaluate(() => { Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true }); document.dispatchEvent(new Event('visibilitychange')) })
  let 공감 = false
  try { await A.waitForFunction(() => { const c = [...document.querySelectorAll('.mt-card')].find((e) => e.innerText.includes('처음 글')); return c && /♥\s*1/.test(c.innerText) }, null, { timeout: 8000 }); 공감 = true } catch (e) { /* */ }
  봄('⑦ 다른 창 갔다 오면 다시 읽음(공감 수)', 공감)
  await A.evaluate(() => { if (window.__원래now) Date.now = window.__원래now })
  await 판.close()
}
// ⑧ 듣기가 막혀도(규칙 · 연결) 3분마다 살펴서 새 글이 들어오나 — 시계를 앞으로 돌려 봄
{
  console.log('■ 듣기 막힘(살림)')
  const 판 = await 브.newContext({ viewport: { width: 1440, height: 900 }, userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36' })
  await 판.addInitScript((s) => { if (!sessionStorage.getItem('씨앗됨')) { localStorage.setItem('mockdb', JSON.stringify(s)); sessionStorage.setItem('씨앗됨', '1') } localStorage.setItem('mock듣기막힘', '1'); try { localStorage.setItem('kcm_notice_seen', '2026-10-필독') } catch (e) { /* */ } }, 씨앗)
  const A = await 판.newPage()
  await A.clock.install()
  await A.goto(주소 + '/qna', { waitUntil: 'domcontentloaded' })
  await A.clock.runFor(3000)
  await A.waitForFunction(() => document.body.innerText.includes('셋째 글'), null, { timeout: 15000 })
  const B = await 판.newPage()
  await B.goto(주소 + '/', { waitUntil: 'domcontentloaded' })
  await B.evaluate((k) => { const d = JSON.parse(localStorage.getItem('mockdb')); d.qna[k] = { t: '[후기·건의] 막힘 뒤 새 글', b: '듣기가 막혀도 들어와야 합니다', nick: '꼼꼼한 목수', uid: 'u8', at: Date.now() }; localStorage.setItem('mockdb', JSON.stringify(d)) }, '-Z' + String(Date.now()).padStart(15, '0') + '0009')
  await A.clock.runFor(5000)
  봄('⑧-1 막혔을 때 바로는 안 들어옴(듣기 없음 확인)', !(await A.evaluate(() => document.body.innerText.includes('막힘 뒤 새 글'))))
  await A.clock.runFor(185000)
  let 들어옴 = false
  try { await A.waitForFunction(() => document.body.innerText.includes('막힘 뒤 새 글'), null, { timeout: 8000 }); 들어옴 = true } catch (e) { /* */ }
  봄('⑧-2 3분 뒤 살림으로 들어옴', 들어옴)
  await 판.close()
}
await 브.close()
console.log(`\n맵톡 실시간 ${통과}/${통과 + 실패}`)
process.exit(실패 ? 1 : 0)
