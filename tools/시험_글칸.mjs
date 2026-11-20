// 🧪 G801 모든 글쓰기 칸(textarea) — 소장님 11-20 「건설맵 모든 글쓰기 칸 점검해서 고쳐줘」
//   node tools/시험_글칸.mjs <흉내 판 주소>
//   ① 화면마다 보이는 글칸: 사이트 글꼴(고정폭 아님 — 붙여넣기 칸 .cin · .tj-paste · .bj-paste · .gj-paste 만 고정폭) · 글자 12px 넘게 · 높이 40px 넘게
//   ② 쓰면 글만큼 늘어남(14줄 → 칸 안에서 안 굴림 · 화면 높이 60 % 넘으면 굴림) · 비우면 처음 높이로 돌아옴 · 붙여넣기 · 막힌 칸은 그대로
//   ③ 갈래 시험(만든 칸): CSS 높이 칸은 안 줄임 · content-box · 접힌 곳(details) · 막힌 fieldset · 읽기만 · 손으로 끌어 키운 칸 · 화면이 넣은 값(React 꼴)
//      · 뺀 칸(.cin · .gj-paste · .xv-고침판 · data-grow=no) · 쪽이 안 튐 · 칸 200개를 한꺼번에 넣어도 빠름
//   ④ 게시판 · 문의 본문 .ta-big 150px · 답글 .ta-mid 110px · 문의 쪽(contact) 150 · ⑤ 화면 오류 없음 · PC 1280 · 폰 390
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const 주소 = process.argv[2] || 'http://127.0.0.1:5815'
let 통과 = 0, 실패 = 0
const 봐 = (참, 무엇, 더 = '') => { if (참) { 통과++; console.log('  ✓', 무엇) } else { 실패++; console.log('  ✗', 무엇, 더) } }
const 쪽들 = ['/qna', '/jobs', '/naeyeok', '/gongdong', '/tools/ilbo', '/tools/tuipbi', '/tools/risk', '/tools/sigong', '/tools/anjeon', '/tools/yuhae', '/tools/hado-docs', '/change',
  '/tools/boheom-jeongsan', '/tools/jimyeong', '/tools/gyeonjeok', '/tools/sonik', '/tools/qualify-self', '/change/won']
const 열네줄 = Array.from({ length: 14 }, (_, k) => `${k + 1}째 줄 — 글칸 시험`).join('\n')

const 브 = await chromium.launch()
for (const [이름, w, h] of [['PC 1280', 1280, 900], ['폰 390', 390, 844]]) {
  console.log(`■ ${이름}`)
  const 판 = await 브.newContext({ viewport: { width: w, height: h }, isMobile: w < 500, hasTouch: w < 500, locale: 'ko-KR', timezoneId: 'Asia/Seoul' })
  await 판.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|googlesyndication|geojs|coupang/, (r) => r.fulfill({ status: 200, body: '' }))
  await 판.route(/firebaseio\.com|identitytoolkit|securetoken/, (r) => r.fulfill({ status: 503, body: 'down' }))
  await 판.addInitScript(() => { try { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); sessionStorage.setItem('kcm_visit_s', '1'); localStorage.setItem('mock지연', '0') } catch (e) { /* 없음 */ } })
  const 오류 = []
  let 본칸 = 0, 늘칸 = 0, 붙칸 = 0
  for (const 길 of 쪽들) {
    const A = await 판.newPage()
    A.on('pageerror', (e) => 오류.push(길 + ' ' + String(e).slice(0, 120)))
    await A.goto(주소 + 길, { waitUntil: 'domcontentloaded' })
    try { await A.waitForSelector('main.shell', { timeout: 20000 }) } catch (e) { 봐(false, `${길} 쪽이 열림`); await A.close(); continue }
    await A.waitForTimeout(1500)
    for (let i = 0; i < 3; i++) { const x = A.locator('.noticepop-f .btn.line'); if (!(await x.count())) break; await x.first().click(); await A.waitForTimeout(250) }
    if (길 === '/jobs') { const 글 = A.getByRole('button', { name: '글 올리기' }); if (await 글.count()) { await 글.first().click(); await A.waitForTimeout(400) } }   /* 구인 글쓰기 칸(.ta-big)도 봄 */
    await A.evaluate(() => document.querySelectorAll('details.gj-paste').forEach((d) => { d.open = true }))   /* 엑셀 붙여넣기 칸도 봄 */
    await A.waitForTimeout(100)
    const 칸들 = await A.evaluate(() => {
      const 몸 = getComputedStyle(document.body).fontFamily
      return [...document.querySelectorAll('textarea')].map((t, i) => {
        const cs = getComputedStyle(t), r = t.getBoundingClientRect()
        const 보임 = (t.checkVisibility ? t.checkVisibility() : !!t.getClientRects().length) && r.width > 0
        const 붙 = t.matches('.cin, .tj-paste, .bj-paste, .gj-paste textarea')
        const 제 = t.matches('.mt-af-t, .adm-ta, .fw-in, .xv-고침판 textarea, [data-grow="no"]')
        return { i, cls: t.className, ff: cs.fontFamily, 몸, fs: parseFloat(cs.fontSize), h: Math.round(r.height), 보임, 붙, 제, 막힘: t.readOnly || t.matches(':disabled') }
      }).filter((x) => x.보임)
    })
    for (const x of 칸들) {
      본칸++
      if (x.붙) { 붙칸++; 봐(/mono|consolas/i.test(x.ff), `${길} 붙여넣기 칸(${x.cls || '엑셀 붙여넣기'}) — 고정폭 그대로`, x.ff) }
      else 봐(x.ff === x.몸 && !/monospace/i.test(x.ff), `${길} 글칸 #${x.i}(${x.cls || '이름 없음'}) — 사이트 글꼴`, `${x.ff} / ${x.몸}`)
      봐(x.fs >= 12 && x.h >= 40, `${길} 글칸 #${x.i} — 글자 ${x.fs}px · 높이 ${x.h}px`, JSON.stringify(x))
      const 칸 = A.locator('textarea').nth(x.i)
      if (x.막힘) continue
      try {
        await 칸.scrollIntoViewIfNeeded()
        const 처음 = await 칸.evaluate((t) => Math.round(t.getBoundingClientRect().height))
        await 칸.fill(열네줄)
        await A.waitForTimeout(150)
        const 쓴뒤 = await 칸.evaluate((t) => ({ h: Math.round(t.getBoundingClientRect().height), sh: t.scrollHeight, ch: t.clientHeight, 최대: Math.max(220, Math.round(innerHeight * 0.6)) }))
        await 칸.fill('')
        await A.waitForTimeout(150)
        const 비운뒤 = await 칸.evaluate((t) => Math.round(t.getBoundingClientRect().height))
        if (x.붙 || x.제) {
          /* 뺀 칸 — 붙여넣기 칸은 늘지 않음(제 늘림이 있는 칸은 그 칸 시험이 봄) */
          if (x.붙) 봐(쓴뒤.h === 처음 && 비운뒤 === 처음, `${길} 붙여넣기 칸 — 14줄 넣어도 그대로(${처음} → ${쓴뒤.h} · 비우면 ${비운뒤})`)
          continue
        }
        const 다보임 = 쓴뒤.sh <= 쓴뒤.ch + 2 || (쓴뒤.h >= 쓴뒤.최대 - 4 && 쓴뒤.h <= 쓴뒤.최대 + 4)
        늘칸++
        봐(쓴뒤.h > 처음 && 다보임 && Math.abs(비운뒤 - 처음) <= 2, `${길} 글칸 #${x.i} — 14줄 쓰면 늘어남(${처음} → ${쓴뒤.h}) · 비우면 ${비운뒤}`, JSON.stringify({ 처음, 쓴뒤, 비운뒤 }))
      } catch (e) { 봐(false, `${길} 글칸 #${x.i} 쓰기`, String(e).slice(0, 160)) }
    }
    await A.close()
  }
  봐(본칸 >= 8 && 늘칸 >= 5 && 붙칸 >= 1, `글칸 ${본칸}곳 봄 · ${늘칸}곳 늘림 · 붙여넣기 ${붙칸}곳(나머지 갈래는 ③ 만든 칸이 봄)`)

  /* ③ 갈래 시험 — 만든 칸으로(사이트가 켠 lib/글칸늘림.js 그대로) */
  const B = await 판.newPage()
  B.on('pageerror', (e) => 오류.push('갈래 ' + String(e).slice(0, 120)))
  await B.goto(주소 + '/jobs', { waitUntil: 'domcontentloaded' })
  await B.waitForSelector('main.shell', { timeout: 20000 }); await B.waitForTimeout(1200)
  for (let i = 0; i < 3; i++) { const x = B.locator('.noticepop-f .btn.line'); if (!(await x.count())) break; await x.first().click(); await B.waitForTimeout(250) }
  await B.evaluate(() => {
    const 판 = document.createElement('div'); 판.id = 'gk'; 판.style.cssText = 'padding:20px;background:#fff'
    판.innerHTML = `<style>#gk textarea{display:block;width:300px;margin:8px 0}#gk .고정{height:300px;min-height:0}#gk .박스{box-sizing:content-box;padding:20px;min-height:0;height:60px}</style>
      <textarea id="g1"></textarea><textarea id="g2" class="고정"></textarea><textarea id="g3" class="박스"></textarea>
      <details id="gd"><summary>접힘</summary><textarea id="g4"></textarea></details>
      <fieldset disabled><textarea id="g5"></textarea></fieldset><textarea id="g6" readonly></textarea>
      <textarea id="g7"></textarea><textarea id="g8" class="cin"></textarea><div class="gj-paste"><textarea id="g9"></textarea></div>
      <div class="xv-고침판"><textarea id="g10"></textarea></div><textarea id="g11" data-grow="no"></textarea><textarea id="g12"></textarea>
      <div id="gm"></div><div style="height:1400px"></div>`
    document.querySelector('main.shell').appendChild(판)
  })
  const 높 = (id) => B.evaluate((i) => Math.round(document.getElementById(i).getBoundingClientRect().height), id)
  const 다 = (id) => B.evaluate((i) => { const t = document.getElementById(i); return t.scrollHeight <= t.clientHeight + 2 }, id)
  const 최대 = await B.evaluate(() => Math.max(220, Math.round(innerHeight * 0.6)))
  // g1 보통 칸
  const g1처음 = await 높('g1')
  await B.locator('#g1').fill(열네줄); await B.waitForTimeout(80)
  const g1쓴 = await 높('g1'), g1다 = await 다('g1')
  await B.locator('#g1').fill(''); await B.waitForTimeout(80)
  봐(g1쓴 > g1처음 && (g1다 || g1쓴 === 최대) && (await 높('g1')) === g1처음, `③ 보통 칸 ${g1처음} → ${g1쓴} → 비우면 ${await 높('g1')}`)
  // g2 CSS 높이 300 — 짧은 글엔 그대로(안 줄임) · 긴 글엔 늘어남
  await B.locator('#g2').fill('한 줄\n두 줄'); await B.waitForTimeout(80)
  const g2짧 = await 높('g2')
  await B.locator('#g2').fill(Array.from({ length: 40 }, (_, k) => `${k + 1}째`).join('\n')); await B.waitForTimeout(80)
  const g2긴 = await 높('g2')
  await B.locator('#g2').fill(''); await B.waitForTimeout(80)
  봐(g2짧 === 300 && g2긴 >= 300 && g2긴 <= Math.max(최대, 300) && (await 높('g2')) === 300, `③ CSS 높이 300 칸 — 짧은 글 ${g2짧} · 긴 글 ${g2긴} · 비우면 ${await 높('g2')} (안 줄임)`)
  // g3 content-box
  await B.locator('#g3').fill(열네줄); await B.waitForTimeout(80)
  봐((await 다('g3')) || (await 높('g3')) === 최대, `③ content-box 칸 — 늘어나 다 보임(${await 높('g3')}px)`)
  // g4 접힌 곳 — 값을 넣어도 안 건드림 · 열고 누르면 맞춤
  await B.evaluate(() => { document.getElementById('g4').value = Array.from({ length: 14 }, (_, k) => k + 1).join('\n') }); await B.waitForTimeout(100)
  const g4닫 = await B.evaluate(() => document.getElementById('g4').style.height)
  await B.evaluate(() => { document.getElementById('gd').open = true }); await B.locator('#g4').focus(); await B.waitForTimeout(80)
  봐(g4닫 === '' && (await 다('g4')), `③ 접힌 곳 — 닫혔을 땐 그대로 · 열고 누르면 맞춤(${await 높('g4')}px)`)
  // g5 막힌 fieldset · g6 읽기만 — 값을 넣어도 그대로
  const g5처음 = await 높('g5'), g6처음 = await 높('g6')
  await B.evaluate(() => { for (const i of ['g5', 'g6']) document.getElementById(i).value = Array.from({ length: 14 }, (_, k) => k + 1).join('\n') }); await B.waitForTimeout(100)
  봐((await 높('g5')) === g5처음 && (await 높('g6')) === g6처음, `③ 막힌 칸 · 읽기만 칸 — 그대로(${g5처음} · ${g6처음})`)
  // g7 손으로 끌어 키운 칸(인라인 높이 250) — 써도 그대로
  await B.evaluate(() => { document.getElementById('g7').style.height = '250px' })
  await B.locator('#g7').fill(Array.from({ length: 40 }, (_, k) => `${k + 1}째`).join('\n')); await B.waitForTimeout(80)
  봐((await 높('g7')) === 250, `③ 손으로 키운 칸 — 써도 그대로(${await 높('g7')})`)
  // g8 · g9 · g10 · g11 뺀 칸 — 늘지 않음
  const 뺀처음 = {}
  for (const i of ['g8', 'g9', 'g10', 'g11']) 뺀처음[i] = await 높(i)
  for (const i of ['g8', 'g9', 'g10', 'g11']) { await B.locator('#' + i).fill(열네줄) }
  await B.waitForTimeout(80)
  const 뺀뒤 = {}
  for (const i of ['g8', 'g9', 'g10', 'g11']) 뺀뒤[i] = await 높(i)
  봐(Object.keys(뺀처음).every((i) => 뺀처음[i] === 뺀뒤[i]), '③ 뺀 칸(.cin · .gj-paste · .xv-고침판 · data-grow=no) — 늘지 않음', JSON.stringify([뺀처음, 뺀뒤]))
  // g12 화면이 넣은 값(React 꼴 — value = …) · 비우면 돌아옴
  const g12처음 = await 높('g12')
  await B.evaluate(() => { document.getElementById('g12').value = Array.from({ length: 14 }, (_, k) => `${k + 1}째 줄`).join('\n') }); await B.waitForTimeout(120)
  const g12넣 = await 높('g12'), g12다 = await 다('g12')
  await B.evaluate(() => { document.getElementById('g12').value = '' }); await B.waitForTimeout(120)
  봐(g12넣 > g12처음 && g12다 && (await 높('g12')) === g12처음, `③ 화면이 넣은 값 — ${g12처음} → ${g12넣} → 비우면 ${await 높('g12')}`)
  // 쪽이 안 튐 — 굴린 채 칸을 비워도 window.scrollY 그대로
  await B.evaluate(() => { const t = document.getElementById('g1'); t.value = Array.from({ length: 30 }, (_, k) => k).join('\n'); t.focus(); t.scrollIntoView({ block: 'center' }) }); await B.waitForTimeout(150)
  const 쪽 = await B.evaluate(() => new Promise((ok) => {
    const t = document.getElementById('g1'), 앞 = scrollY, 앞높 = Math.round(t.getBoundingClientRect().height)
    t.value = '짧게'; t.dispatchEvent(new Event('input', { bubbles: true }))   /* 이용자가 지운 것과 같은 길(input) */
    requestAnimationFrame(() => requestAnimationFrame(() => ok({ 앞, 뒤: scrollY, 앞높, 뒤높: Math.round(t.getBoundingClientRect().height) })))
  }))
  봐(쪽.앞높 > 200 && 쪽.뒤높 < 쪽.앞높 && Math.abs(쪽.앞 - 쪽.뒤) <= 1, `③ 칸을 줄여도 쪽이 안 튐(쪽 ${쪽.앞} → ${쪽.뒤} · 칸 ${쪽.앞높} → ${쪽.뒤높})`)
  // 칸 200개를 한꺼번에(긴 서식 불러오기) — 한 번 그림 안에 맞춤 · 빠름
  const 많 = await B.evaluate(() => new Promise((ok) => {
    const m = document.getElementById('gm'); for (let i = 0; i < 200; i++) { const t = document.createElement('textarea'); t.className = 'gm'; m.appendChild(t) }
    const 칸들 = [...m.querySelectorAll('textarea')]
    const t0 = performance.now()
    칸들.forEach((t, i) => { t.value = i % 2 ? Array.from({ length: 12 }, (_, k) => k).join('\n') : '짧게' })
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const 걸림 = Math.round(performance.now() - t0)
      const 맞음 = 칸들.every((t, i) => (i % 2 ? t.scrollHeight <= t.clientHeight + 2 : t.style.height === ''))
      m.innerHTML = ''; ok({ 걸림, 맞음 })
    }))
  }))
  봐(많.맞음 && 많.걸림 < 600, `③ 칸 200개 한꺼번에 — 긴 칸만 늘고 짧은 칸은 그대로 · ${많.걸림}ms`)
  await B.evaluate(() => document.getElementById('gk').remove())
  /* ④ 크기 — 이름 붙은 글칸 */
  const 큰 = await B.evaluate(() => { const t = document.createElement('textarea'); t.className = 'ta-big'; document.body.appendChild(t); const a = Math.round(t.getBoundingClientRect().height); t.className = 'ta-mid'; const b = Math.round(t.getBoundingClientRect().height); t.remove(); return [a, b] })
  봐(큰[0] >= 149 && 큰[1] >= 109, `④ .ta-big ${큰[0]}px · .ta-mid ${큰[1]}px`)
  await B.close()
  /* ④ 문의 쪽(contact.html — 정적 쪽) */
  const C = await 판.newPage()
  await C.goto(주소 + '/contact.html', { waitUntil: 'domcontentloaded' }); await C.waitForTimeout(800)
  const 문 = C.locator('#memo')
  if (await 문.count()) {
    const 처음 = await 문.evaluate((t) => ({ h: Math.round(t.getBoundingClientRect().height), ff: getComputedStyle(t).fontFamily }))
    await 문.fill(열네줄); await C.waitForTimeout(150)
    const 쓴 = await 문.evaluate((t) => ({ h: Math.round(t.getBoundingClientRect().height), sh: t.scrollHeight, ch: t.clientHeight }))
    봐(처음.h >= 149 && !/monospace/i.test(처음.ff), `④ 문의 쪽 «자세히» 칸 ${처음.h}px · 사이트 글꼴`, JSON.stringify(처음))
    봐(쓴.h > 처음.h && 쓴.sh <= 쓴.ch + 2, '④ 문의 쪽 — 14줄 쓰면 늘어남', JSON.stringify(쓴))
  } else 봐(false, '④ 문의 쪽 #memo 찾음')
  await C.close()
  봐(!오류.length, '⑤ 화면 오류 없음', 오류.slice(0, 4).join(' | '))
  await 판.close()
}
await 브.close()
console.log(`\n${실패 ? '❌' : '✅'} 글칸 ${통과}/${통과 + 실패}`)
process.exit(실패 ? 1 : 0)
