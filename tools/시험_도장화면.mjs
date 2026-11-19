/**
 * 🖋 G780 도장 만들기 화면 시험 (2026-11-19) — 가짜 파이어베이스로 구운 판(굽기.sh) 위에서
 *   node tools/시험_도장화면.mjs [주소=http://127.0.0.1:5781] · CAPTURE=폴더 면 화면 사진 · Playwright(/tmp/g10/pw) · PC 올리기에서는 안 돌림
 *   PC 1280 · 폰 390 · 360 마다:
 *   ① 처음 = 예시(옅게) · 받기 · 저장 잠김 ② 이름을 적으면 바로 그림(모서리 투명 · 가운데 빨강) · 단추 열림
 *   ③ 모양(원 · 타원 · 네모) · «인» 붙이기 · 글씨 · 색(검정) 마다 그림이 다름 ④ ⬇ PNG 받기 = 1024 × 1024 RGBA PNG · 파일 이름 «도장_이름.png»
 *   ⑤ 💾 저장 → 내 도장 칸 · 새로고침해도 남음 · ✕ → 지우기 ⑥ 회사 직인 탭(둘레 + 가운데 · 바로 고르는 글 · 네모)
 *   ⑦ 사진 탭 — 🧪 예시 사진 → 도장만(모서리 투명 · 빨강 · «빨간 도장으로 봤습니다») · 진짜 파일 올리기(검은 도장) · 도장 없는 사진 → 안내
 *   ⑧ 설명(쓰는 순서 · 자주 묻는 것) · 넘침 0 · 오류 0 · 서버로 가는 요청 없음(그림 만들 때)
 * 가상 이름만 씀(홍길동 · 가상건설).
 */
import { createRequire } from 'module'
const require = createRequire('/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const require2 = createRequire('/tmp/g10/wt780/web/package.json')
const { createCanvas } = require2('@napi-rs/canvas')

const 주소 = process.argv[2] || 'http://127.0.0.1:5781'
const 캡처 = process.env.CAPTURE || ''
let 통과 = 0, 실패 = 0
const 봄 = (이름, 참, 더 = '') => { if (참) { 통과++; console.log('  ✓', 이름) } else { 실패++; console.log('  ✗', 이름, 더) } }

/* 올릴 사진 둘(숫자로 그림): 검은 네모 도장 · 도장 없는 흰 종이 */
const 사진만들기 = (도장) => {
  const c = createCanvas(900, 700), g = c.getContext('2d')
  g.fillStyle = '#efede8'; g.fillRect(0, 0, 900, 700)
  if (도장) { g.strokeStyle = '#2a2a2e'; g.lineWidth = 18; g.strokeRect(330, 230, 240, 240); g.fillStyle = '#2a2a2e'; g.fillRect(430, 280, 40, 140) }
  return c.toBuffer('image/png')
}
const 검은도장 = 사진만들기(true), 빈종이 = 사진만들기(false)

const 브 = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] })
const 새판 = async (크기, 폰 = false) => {
  const 판 = await 브.newContext({ viewport: 크기, isMobile: 폰, hasTouch: 폰, locale: 'ko-KR', timezoneId: 'Asia/Seoul', acceptDownloads: true, userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36' })
  await 판.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|googlesyndication|geojs|daumcdn|kakao|coupang/, (r) => r.fulfill({ status: 200, body: '' }))
  await 판.addInitScript(() => { try { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); sessionStorage.setItem('kcm_notice_seen', '2026-10-업체'); sessionStorage.setItem('kcm_since_shown', '1') } catch (e) { /* */ } })
  const p = await 판.newPage()
  const 오류 = [], 보냄 = []
  p.on('pageerror', (e) => 오류.push(String(e).slice(0, 160)))
  p.on('dialog', (d) => d.dismiss())
  p.on('request', (q) => { const u = q.url(); if (q.method() !== 'GET' && !/127\.0\.0\.1/.test(u)) 보냄.push(q.method() + ' ' + u.slice(0, 80)) })
  return { 판, p, 오류, 보냄 }
}
const 넘침 = (p) => p.evaluate(() => document.documentElement.scrollWidth - innerWidth)
/* 미리 보기 그림 읽기 — 모서리 알파 · 가운데 줄의 빨강 / 검정 점 수 · 지문 */
const 그림읽기 = (p) => p.evaluate(() => {
  const c = document.querySelector('.dj-cv'); const g = c.getContext('2d'); const W = c.width, H = c.height
  const d = g.getImageData(0, 0, W, H).data
  const a = (x, y) => d[(y * W + x) * 4 + 3]
  let 빨강 = 0, 검정 = 0, 잉크 = 0, h = 0
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] > 128) { 잉크++; if (d[i] > 150 && d[i + 1] < 90 && d[i + 2] < 90) 빨강++; if (d[i] < 70 && d[i + 1] < 70 && d[i + 2] < 70) 검정++ }
    if (i % 64 === 0) h = (h * 31 + d[i + 3]) >>> 0
  }
  return { 모서리: a(2, 2) + a(W - 3, 2) + a(2, H - 3) + a(W - 3, H - 3), 빨강, 검정, 잉크, 지문: h, 예시: c.classList.contains('ex') }
})
const 단추 = (p, 글) => p.locator('.dj button', { hasText: 글 }).first()
/* 캡처 — 도구 칸이 맨 위에 오게(위의 광고 · 띠는 화면 밖으로) */
const 도구로 = (p) => p.evaluate(() => { const el = innerWidth < 700 ? document.querySelector('.dj-body') : document.querySelector('.dj h1'); window.scrollTo(0, el.getBoundingClientRect().top + scrollY - (innerWidth < 700 ? 118 : 165)) })

for (const [이름판, 크기, 폰] of [['PC 1280', { width: 1280, height: 900 }, false], ['폰 390', { width: 390, height: 844 }, true], ['폰 360', { width: 360, height: 780 }, true]]) {
  console.log(`■ ${이름판}`)
  const { 판, p, 오류, 보냄 } = await 새판(크기, 폰)
  await p.goto(주소 + '/tools/dojang', { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('.dj-cv', { timeout: 20000 })
  await p.waitForTimeout(700)
  봄('h1 · 탭 셋', /도장 만들기/.test(await p.locator('h1').first().innerText()) && (await p.locator('.dj-seg button').count()) === 3)
  /* ① 처음 = 예시 */
  let g = await 그림읽기(p)
  봄('① 처음은 예시(옅게) · «홍길동» 그림 있음 · 받기 · 저장 잠김', g.예시 && g.잉크 > 2000 && await 단추(p, 'PNG 받기').isDisabled() && await 단추(p, '내 도장으로 저장').isDisabled(), JSON.stringify(g))
  /* ② 이름 */
  await p.locator('.dj-form input.inp').first().fill('홍길동')
  await p.waitForTimeout(300)
  g = await 그림읽기(p)
  봄('② 이름을 적으면 바로 — 모서리 투명 · 빨강 · 예시 아님 · 단추 열림', !g.예시 && g.모서리 === 0 && g.빨강 > 3000 && !(await 단추(p, 'PNG 받기').isDisabled()), JSON.stringify(g))
  /* ③ 모양 · 인 · 글씨 · 색 */
  const 지문 = { 원: g.지문 }
  for (const [k, t] of [['타원', '타원'], ['네모', '네모']]) { await 단추(p, t).click(); await p.waitForTimeout(150); 지문[k] = (await 그림읽기(p)).지문 }
  봄('③ 원 · 타원 · 네모 그림이 다 다름', new Set(Object.values(지문)).size === 3, JSON.stringify(지문))
  const 세줄안내 = /오른쪽 세로줄부터/.test(await p.locator('.dj-view').innerText())
  await p.locator('.dj-chk input').first().check(); await p.waitForTimeout(150)
  const 인 = (await 그림읽기(p)).지문
  봄('③ 네 칸(«인» 붙임)일 때만 «오른쪽 세로줄부터 읽습니다» 한 줄', !세줄안내 && /오른쪽 세로줄부터/.test(await p.locator('.dj-view').innerText()))
  await 단추(p, '고딕').click(); await p.waitForTimeout(150)
  const 고딕 = (await 그림읽기(p)).지문
  await 단추(p, '검정').click(); await p.waitForTimeout(150)
  const 검 = await 그림읽기(p)
  봄('③ «인» 붙이기 · 고딕 · 검정이 그림에 들어감(검정 점 · 빨강 없음)', 인 !== 지문.네모 && 고딕 !== 인 && 검.검정 > 3000 && 검.빨강 === 0, JSON.stringify([인, 고딕, 검.검정, 검.빨강]))
  await 단추(p, '인주 빨강').click(); await 단추(p, '⭕ 원').click(); await p.locator('.dj-chk input').first().uncheck(); await p.waitForTimeout(150)
  /* ④ 받기 */
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 10000 }), 단추(p, 'PNG 받기').click()])
  const 경로 = await dl.path(); const fs = await import('node:fs'); const b = fs.readFileSync(경로)
  const 너비 = b.readUInt32BE(16), 높이 = b.readUInt32BE(20), 색꼴 = b[25]
  봄('④ ⬇ PNG 받기 — 도장_홍길동.png · 1024 × 1024 · RGBA(투명)', dl.suggestedFilename() === '도장_홍길동.png' && b.slice(1, 4).toString() === 'PNG' && 너비 === 1024 && 높이 === 1024 && 색꼴 === 6, JSON.stringify([dl.suggestedFilename(), 너비, 높이, 색꼴]))
  봄('④ 받은 뒤 안내 «글 앞으로»', /글 앞으로/.test(await p.locator('.dj-msg').innerText()))
  /* ⑤ 저장 · 남음 · 지우기 */
  await 단추(p, '내 도장으로 저장').click(); await p.waitForTimeout(300)
  봄('⑤ 💾 저장 → 내 도장 칸에 그림 · «이 기기에만»', (await p.locator('.dj-item img').count()) === 1 && /이 기기에만/.test(await p.locator('.dj-msg').innerText()))
  await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForSelector('.dj-cv'); await p.waitForTimeout(500)
  봄('⑤ 새로고침해도 내 도장 · 적은 이름 그대로', (await p.locator('.dj-item img').count()) === 1 && (await p.locator('.dj-form input.inp').first().inputValue()) === '홍길동')
  await p.locator('.dj-x').first().click(); await p.locator('.dj-del button', { hasText: '지우기' }).click(); await p.waitForTimeout(200)
  봄('⑤ ✕ → 지우기 → 빈 칸(묻는 창 없이 두 번 누름)', (await p.locator('.dj-item').count()) === 0)
  if (캡처 && !폰) {
    await p.locator('.dj-form input.inp').first().fill('홍길동'); await 단추(p, '내 도장으로 저장').click(); await p.waitForTimeout(200)
    await 도구로(p); await p.waitForTimeout(300)
    await p.screenshot({ path: `${캡처}/G780_${이름판.replace(/\s/g, '')}_이름.png` })
    await p.locator('.dj-x').first().click(); await p.locator('.dj-del button', { hasText: '지우기' }).click()
  }
  if (캡처 && 폰 && 크기.width === 390) { await 도구로(p); await p.waitForTimeout(300); await p.screenshot({ path: `${캡처}/G780_폰390_이름.png` }) }
  /* ⑥ 회사 직인 */
  await p.locator('.dj-seg button', { hasText: '회사 직인' }).click(); await p.waitForTimeout(200)
  g = await 그림읽기(p)
  봄('⑥ 직인 탭 — 처음은 예시(가상건설 주식회사)', g.예시 && g.잉크 > 2000)
  봄('⑥ 직인 — «오른쪽 세로줄부터 읽습니다» 한 줄(가운데 글 다섯)', /오른쪽 세로줄부터/.test(await p.locator('.dj-view').innerText()))
  await p.locator('.dj-form input.inp').nth(0).fill('가상건설 주식회사'); await p.waitForTimeout(200)
  const 직원 = await 그림읽기(p)
  await p.locator('.dj-quick button', { hasText: '사용인감' }).click(); await p.waitForTimeout(150)
  const 사용 = await 그림읽기(p)
  봄('⑥ 둘레 회사 이름 · 가운데 «사용인감» 바로 고름 → 그림 바뀜', !직원.예시 && 직원.빨강 > 3000 && 직원.모서리 === 0 && 사용.지문 !== 직원.지문 && (await p.locator('.dj-form input.inp').nth(1).inputValue()) === '사용인감')
  await 단추(p, '⬜ 네모').click(); await p.waitForTimeout(150)
  봄('⑥ 네모 직인', (await 그림읽기(p)).지문 !== 사용.지문)
  if (캡처 && !폰) { await 도구로(p); await p.locator('.dj-quick button', { hasText: '대표이사인' }).click(); await 단추(p, '⭕ 원형').click(); await p.waitForTimeout(300); await p.screenshot({ path: `${캡처}/G780_${이름판.replace(/\s/g, '')}_직인.png` }) }
  /* ⑦ 사진 */
  await p.locator('.dj-seg button', { hasText: '도장 사진' }).click(); await p.waitForTimeout(200)
  봄('⑦ 사진 탭 — 처음엔 받기 잠김 · 안내', await 단추(p, 'PNG 받기').isDisabled() && /사진을 고르면/.test(await p.locator('.dj-view').innerText()))
  await 단추(p, '예시 사진').click(); await p.waitForTimeout(800)
  g = await 그림읽기(p)
  봄('⑦ 🧪 예시 사진 → 도장만(모서리 투명 · 빨강) · «빨간 도장으로 봤습니다»', g.모서리 === 0 && g.빨강 > 5000 && /빨간 도장으로 봤습니다/.test(await p.locator('.dj-form').innerText()) && !(await 단추(p, 'PNG 받기').isDisabled()), JSON.stringify(g))
  if (캡처 && !폰) { await 도구로(p); await p.waitForTimeout(300); await p.screenshot({ path: `${캡처}/G780_${이름판.replace(/\s/g, '')}_사진.png` }) }
  await p.locator('.dj-form input[type="file"]').setInputFiles({ name: 'stamp.png', mimeType: 'image/png', buffer: 검은도장 }); await p.waitForTimeout(900)
  g = await 그림읽기(p)
  봄('⑦ 올린 사진(검은 도장) → 검정으로 봄 · 잉크만 남음', g.모서리 === 0 && g.검정 > 3000 && /검은 도장으로 봤습니다/.test(await p.locator('.dj-form').innerText()), JSON.stringify(g))
  await p.locator('.dj-form input[type="file"]').setInputFiles({ name: 'paper.png', mimeType: 'image/png', buffer: 빈종이 }); await p.waitForTimeout(900)
  봄('⑦ 도장 없는 사진 → «도장을 찾지 못했습니다» · 받기 잠김', /도장을 찾지 못했습니다/.test(await p.locator('.dj-view').innerText()) && await 단추(p, 'PNG 받기').isDisabled())
  /* ⑧ */
  봄('⑧ 설명(쓰는 순서 · 자주 묻는 것)', (await p.locator('.tguide').innerText()).includes('쓰는 순서') && (await p.locator('.tguide').innerText()).includes('자주 묻는 것'))
  봄('⑧ 넘침 0', (await 넘침(p)) <= 0, String(await 넘침(p)))
  봄('⑧ 서버로 보내는 요청 없음(POST 등)', 보냄.length === 0, 보냄.join(' | '))
  봄('⑧ 오류 0', 오류.length === 0, 오류.join(' | '))
  await 판.close()
}
await 브.close()
console.log(`\n${실패 ? '❌' : '✅'} 시험_도장화면 ${통과}/${통과 + 실패}`)
process.exit(실패 ? 1 : 0)
