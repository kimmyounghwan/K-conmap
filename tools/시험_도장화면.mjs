/**
 * 🖋 G780 도장 만들기 화면 시험 (2026-11-19) — 가짜 파이어베이스로 구운 판(굽기.sh) 위에서
 *   node tools/시험_도장화면.mjs [주소=http://127.0.0.1:5781] · CAPTURE=폴더 면 화면 사진 · Playwright(/tmp/g10/pw) · PC 올리기에서는 안 돌림
 *   PC 1280 · 폰 390 · 360 마다:
 *   ① 처음 = 예시(옅게) · 받기 · 저장 잠김 ② 이름을 적으면 바로 그림(모서리 투명 · 가운데 빨강) · 단추 열림
 *   ③ 모양(원 · 타원 · 네모) · «인» 붙이기 · 글씨 · 색(검정) 마다 그림이 다름 ④ ⬇ PNG 받기 = 1024 × 1024 RGBA PNG · 파일 이름 «도장_이름.png»
 *   ⑤ 💾 저장 → 내 도장 칸 · 새로고침해도 남음 · ✕ → 지우기 ⑥ 회사 도장 탭(회사 이름 + 가운데 · 바로 고르는 글 · 종류 넷)
 *   ⑦ 사진 탭 — 🧪 예시 사진 → 도장만(모서리 투명 · 빨강 · «빨간 도장으로 봤습니다») · 진짜 파일 올리기(검은 도장) · 도장 없는 사진 → 안내
 *   ⑧ 설명(쓰는 순서 · 자주 묻는 것) · 넘침 0 · 오류 0 · 서버로 가는 요청 없음(그림 만들 때)
 *   🩹 G780a ⑦ 🧪 예시 사진 결과가 똑바로 · 📐 기울기 바로잡기(막대 10° → 그림이 돎 · ⟲ 0.5° · 0° → 처음 그림)
 *   🔁 G780b ③ 종류 그림 단추(원형만 — 이름 셋 · 회사 셋 · 누르면 고름 · 큰 그림이 바뀜) · 글씨 셋 · 색 셋(파랑) · 가로 읽기(«오른쪽 세로줄» 안내 없음)
 *     · 똑바름은 «가로획 기울기 재기»(잉크 점을 -8° ~ 8° 돌려 가로 줄이 가장 또렷한 각 — 인장체는 가로획이 많아 바로 잡힘)
 * 가상 이름만 씀(홍길동 · 가상건설).
 */
import { createRequire } from 'module'
const require = createRequire('/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
import { createCanvas } from '../web/node_modules/@napi-rs/canvas/index.js'

const 주소 = process.argv[2] || 'http://127.0.0.1:5781'
const 캡처 = process.env.CAPTURE || ''
const 캡처이름 = process.env.CAPNAME || 'G780a'
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
  let 빨강 = 0, 검정 = 0, 파랑 = 0, 잉크 = 0, h = 0
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] > 128) { 잉크++; if (d[i] > 150 && d[i + 1] < 90 && d[i + 2] < 90) 빨강++; if (d[i] < 70 && d[i + 1] < 70 && d[i + 2] < 70) 검정++; if (d[i + 2] > 150 && d[i] < 90 && d[i + 1] < 130) 파랑++ }
    if (i % 64 === 0) h = (h * 31 + d[i + 3]) >>> 0
  }
  /* 기욺 — 가로획의 윗 · 아랫 가장자리 점(세로로는 확 바뀌고 가로로는 덜 바뀌는 곳 · 테두리 안쪽)만 모아 -15° ~ 15° 로 돌려 보고
     한 줄에 가장 많이 모이는 각(줄마다 점 수의 제곱 합이 가장 큼) — 인장체는 가로획이 많아 0.5° 까지 맞음 */
  const 점 = []
  for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) {
    if (Math.hypot(x - W / 2, y - H / 2) > W * 0.36) continue
    const gy = a(x, y + 1) - a(x, y - 1), gx = a(x + 1, y) - a(x - 1, y)
    if (Math.abs(gy) > 120 && Math.abs(gx) < Math.abs(gy) * 0.35) 점.push([x - W / 2, y - H / 2])
  }
  let 기욺 = 0, 좋음 = -1
  for (let a10 = -150; a10 <= 150; a10 += 5) {
    const t = a10 * Math.PI / 1800, co = Math.cos(t), si = Math.sin(t)
    const 줄 = new Map()
    for (const [x, y] of 점) { const b = Math.round(x * si + y * co); 줄.set(b, (줄.get(b) || 0) + 1) }
    let 합 = 0; for (const v of 줄.values()) 합 += v * v
    if (합 > 좋음) { 좋음 = 합; 기욺 = a10 / 10 }
  }
  return { 모서리: a(2, 2) + a(W - 3, 2) + a(2, H - 3) + a(W - 3, H - 3), 빨강, 검정, 파랑, 잉크, 지문: h, 예시: c.classList.contains('ex'), 기욺 }
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
  /* ③ 종류 · 인 · 글씨 · 색 */
  봄('③ 가로 읽기 — «오른쪽 세로줄부터» 안내 없음 · 처음 «인» 붙이기 켜짐(홍길동인)', !/오른쪽 세로줄부터/.test(await p.locator('.dj-view').innerText()) && await p.locator('.dj-chk input').first().isChecked())
  const 종류수 = await p.locator('.dj-kind').count()
  const 작은그림 = await p.evaluate(() => [...document.querySelectorAll('.dj-kind canvas')].map((c) => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 128) n++; return n }))
  봄('③ 종류 그림 셋(원 · 음각 원 · 두 줄 원 — 원형만) · 그림마다 잉크 · 처음 «원» 고름', 종류수 === 3 && 작은그림.every((n) => n > 300) && (await p.locator('.dj-kind.on').innerText()).trim() === '원', JSON.stringify(작은그림))
  const 지문 = { 원: g.지문 }
  for (let i = 1; i < 3; i++) { await p.locator('.dj-kind').nth(i).click(); await p.waitForTimeout(150); 지문['k' + i] = (await 그림읽기(p)).지문 }
  봄('③ 종류를 누르면 큰 그림이 바뀜(셋 다 다름) · 누른 것만 «고름»', new Set(Object.values(지문)).size === 3 && (await p.locator('.dj-kind.on').count()) === 1, JSON.stringify(지문))
  await p.locator('.dj-kind').nth(1).click(); await p.waitForTimeout(150)
  const 음각 = await 그림읽기(p)
  봄('③ 음각 원 — 빨간 바탕(잉크 많음) · 모서리 투명', 음각.빨강 > 60000 && 음각.모서리 === 0, JSON.stringify([음각.빨강, 음각.모서리]))
  await p.locator('.dj-kind').nth(0).click(); await p.waitForTimeout(150)
  await p.locator('.dj-chk input').first().uncheck(); await p.waitForTimeout(150)
  const 인없음 = (await 그림읽기(p)).지문
  await p.locator('.dj-chk input').first().check(); await p.waitForTimeout(150)
  봄('③ «인» 끄면 세 자(홍길 / 동) · 켜면 다시 네 자', 인없음 !== 지문.원 && (await 그림읽기(p)).지문 === 지문.원)
  봄('③ 글씨 셋 — 고딕(굵게) 이 처음', (await p.locator('.dj-pick button.on', { hasText: '고딕' }).count()) === 1)
  await 단추(p, '인장체').click(); await p.waitForTimeout(150)
  const 인장 = await 그림읽기(p)
  await 단추(p, '명조').click(); await p.waitForTimeout(150)
  const 명조 = (await 그림읽기(p)).지문
  await 단추(p, '검정').click(); await p.waitForTimeout(150)
  const 검 = await 그림읽기(p)
  await 단추(p, '파랑').click(); await p.waitForTimeout(150)
  const 파 = await 그림읽기(p)
  봄('③ 글씨(인장체 · 명조) · 색(검정 · 파랑)이 그림에 들어감', 인장.지문 !== 지문.원 && 인장.잉크 < g.잉크 && 명조 !== 인장.지문 && 명조 !== 지문.원 && 검.검정 > 3000 && 검.빨강 === 0 && 파.파랑 > 3000 && 파.빨강 === 0, JSON.stringify([인장.잉크, g.잉크, 검.검정, 파.파랑]))
  await 단추(p, '빨강').click(); await 단추(p, '고딕').click(); await p.waitForTimeout(150)
  봄('③ 다시 고딕 · 빨강 → 처음 그림 그대로', (await 그림읽기(p)).지문 === 지문.원)
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
    await p.screenshot({ path: `${캡처}/${캡처이름}_${이름판.replace(/\s/g, '')}_이름.png` })
    await p.locator('.dj-x').first().click(); await p.locator('.dj-del button', { hasText: '지우기' }).click()
  }
  if (캡처 && 폰 && 크기.width === 390) { await 도구로(p); await p.waitForTimeout(300); await p.screenshot({ path: `${캡처}/${캡처이름}_폰390_이름.png` }) }
  /* ⑥ 회사 도장 */
  await p.locator('.dj-seg button', { hasText: '회사 도장' }).click(); await p.waitForTimeout(200)
  g = await 그림읽기(p)
  봄('⑥ 회사 도장 탭 — 처음은 예시(가상건설 주식회사 · 법인 원형) · 종류 셋', g.예시 && g.잉크 > 2000 && (await p.locator('.dj-kind').count()) === 3 && /법인 원형/.test(await p.locator('.dj-kind.on').innerText()))
  await p.locator('.dj-form input.inp').nth(0).fill('가상건설 주식회사'); await p.waitForTimeout(200)
  const 직원 = await 그림읽기(p)
  await p.locator('.dj-quick button', { hasText: '사용인감' }).click(); await p.waitForTimeout(150)
  const 사용 = await 그림읽기(p)
  봄('⑥ 회사 이름 · 가운데 «사용인감» 바로 고름 → 그림 바뀜', !직원.예시 && 직원.빨강 > 3000 && 직원.모서리 === 0 && 사용.지문 !== 직원.지문 && (await p.locator('.dj-form input.inp').nth(1).inputValue()) === '사용인감')
  const 회지문 = new Set([사용.지문])
  for (let i = 1; i < 3; i++) { await p.locator('.dj-kind').nth(i).click(); await p.waitForTimeout(150); 회지문.add((await 그림읽기(p)).지문) }
  봄('⑥ 원형 · 음각 원형 — 그림 셋 다 다름', 회지문.size === 3)
  if (캡처 && !폰) { await 도구로(p); await p.locator('.dj-quick button', { hasText: '대표이사' }).first().click(); await p.locator('.dj-kind').nth(0).click(); await p.waitForTimeout(300); await p.screenshot({ path: `${캡처}/${캡처이름}_${이름판.replace(/\s/g, '')}_직인.png` }) }
  /* ⑦ 사진 */
  await p.locator('.dj-seg button', { hasText: '도장 사진' }).click(); await p.waitForTimeout(200)
  봄('⑦ 사진 탭 — 처음엔 받기 잠김 · 안내', await 단추(p, 'PNG 받기').isDisabled() && /사진을 고르면/.test(await p.locator('.dj-view').innerText()))
  await 단추(p, '예시 사진').click(); await p.waitForTimeout(800)
  g = await 그림읽기(p)
  봄('⑦ 🧪 예시 사진 → 도장만(모서리 투명 · 빨강) · «빨간 도장으로 봤습니다»', g.모서리 === 0 && g.빨강 > 5000 && /빨간 도장으로 봤습니다/.test(await p.locator('.dj-form').innerText()) && !(await 단추(p, 'PNG 받기').isDisabled()), JSON.stringify(g))
  봄('⑦ 🩹 예시 결과 도장이 똑바로(가로획 기울기 0.5° 안)', Math.abs(g.기욺) <= 0.5, String(g.기욺))
  if (캡처 && !폰) { await 도구로(p); await p.waitForTimeout(300); await p.screenshot({ path: `${캡처}/${캡처이름}_${이름판.replace(/\s/g, '')}_사진.png` }) }
  /* 📐 기울기 바로잡기 */
  const 처음사진 = g.지문
  봄('⑦ 📐 기울기 막대 · ⟲ ⟳ · 0° (처음 «사진 그대로» · 0° 잠김)', (await p.locator('.dj-tilt input[type="range"]').count()) === 1 && (await p.locator('.dj-tb').count()) === 2 && await p.locator('.dj-t0').isDisabled() && /사진 그대로/.test(await p.locator('.dj-form').innerText()))
  await p.locator('.dj-tilt input[type="range"]').fill('10'); await p.waitForTimeout(500)
  const 돌린 = await 그림읽기(p)
  봄('⑦ 📐 기울기 10° → 그림이 10° 돎(가로획 기울기 9 ~ 11°) · «시계 방향 10°» · 모서리 투명 · 빨강 그대로', 돌린.지문 !== 처음사진 && Math.abs(Math.abs(돌린.기욺) - 10) <= 1 && 돌린.모서리 === 0 && 돌린.빨강 > 5000 && /시계 방향 10°/.test(await p.locator('.dj-form').innerText()), JSON.stringify([처음사진, 돌린.기욺, 돌린.모서리, 돌린.빨강]))
  await p.locator('.dj-tb').first().click(); await p.waitForTimeout(400)
  봄('⑦ ⟲ 누르면 0.5° 덜(9.5°)', /시계 방향 9\.5°/.test(await p.locator('.dj-form').innerText()))
  await p.locator('.dj-tilt input[type="range"]').fill('-4'); await p.waitForTimeout(400)
  봄('⑦ 막대 −4° → «반시계 방향 4°»', /반시계 방향 4°/.test(await p.locator('.dj-form').innerText()))
  if (캡처 && 폰 && 크기.width === 390) { await 도구로(p); await p.evaluate(() => window.scrollBy(0, 330)); await p.waitForTimeout(300); await p.screenshot({ path: `${캡처}/${캡처이름}_폰390_기울기.png` }) }
  await p.locator('.dj-t0').click(); await p.waitForTimeout(500)
  봄('⑦ 0° → 처음 그림 그대로', (await 그림읽기(p)).지문 === 처음사진 && /사진 그대로/.test(await p.locator('.dj-form').innerText()))
  await p.locator('.dj-tilt input[type="range"]').fill('6'); await p.waitForTimeout(400)
  await p.locator('.dj-form input[type="file"]').setInputFiles({ name: 'stamp.png', mimeType: 'image/png', buffer: 검은도장 }); await p.waitForTimeout(900)
  g = await 그림읽기(p)
  봄('⑦ 올린 사진(검은 도장) → 검정으로 봄 · 잉크만 남음', g.모서리 === 0 && g.검정 > 3000 && /검은 도장으로 봤습니다/.test(await p.locator('.dj-form').innerText()), JSON.stringify(g))
  봄('⑦ 새 사진을 고르면 기울기는 0°로', (await p.locator('.dj-tilt input[type="range"]').inputValue()) === '0' && /사진 그대로/.test(await p.locator('.dj-form').innerText()))
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
