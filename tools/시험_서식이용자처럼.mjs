// 🧑‍🔧 서식 «이용자처럼» 전부 — 소장님 「건설맵 서식 하나 하나 이용자 처럼 사용하면서 점검 해 줘」(11-04)
//   서식마다(종이에 바로 쓰기 · forms2 + 다시 만든 원본 틀 o-*):
//   ① 종이가 뜸 ② 첫 쓰는 칸을 «손으로» 누름(종이 위 그 자리) → 아래 쓰는 칸이 열림 ③ 글(또는 수)을 쳐 넣고 Enter → 그 칸 값이 됨
//   ④ 1초 뒤 새로고침 → 그대로 남음(이 기기 저장) ⑤ «놓치기 쉬운 것» 링크가 있는 서식 · 도구를 가리킴 ⑥ 화면 오류 0
//   ⑦ 그 칸 자리가 화면에 보임(가려지지 않음 — 폰은 종이를 옆으로 밀어서 손가락으로 톡) ⑧ 폰은 «옆으로 밀면 보임» 알림 · PC 는 없음
//   + 폰 끝에: 가로 서식(주간 공정 현황보고)에서 알림의 «한눈에 보기» 한 번이면 종이가 한눈에 · 알림 사라짐
//     · 그 상태로 오른쪽 «작성자» 칸 톡 → 쓰는 칸 열림 · «＋» 로 다시 크게 → 알림 다시
//   (처음 돌렸을 때 폰에서 주간 공정 현황보고 «작성자» 칸이 오른쪽에 잘려 안 보였음 → 알림을 넣고 이 시험이 지킴)
//   나머지 서식(종이 아님 — 안전 «사이트에서 작성 → PDF» 36 · 공내역서 한 벌 1): 작성 칸이 뜸 · 첫 빈 칸 자리가 보임 · 누르면 커서 · 쳐 넣은 글
//     · 1초 뒤 새로고침해도 그대로 · 링크 · 오류 0 (공내역서는 엑셀 파일이 실제로 있음) / 위험성평가 5: 단추가 위험성평가 도구로 · 그 도구가 뜸
//   돌리기: 빌드 + web/public/forms/g 를 얹은 뒤  B=http://127.0.0.1:4996 node tools/시험_서식이용자처럼.mjs [PC|폰] [슬러그…]
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { 판짜기, 칸상자, 칸쪽 } from '../web/src/lib/격자그림.js'
const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const require = createRequire(process.env.PW || '/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const 주소 = process.env.B || 'http://127.0.0.1:4996'
const 기기 = process.argv[2] || 'PC'
const 고른 = process.argv.slice(3)
const GD = path.join(ROOT, 'web/public/forms/g')
const 서식들 = JSON.parse(fs.readFileSync(path.join(ROOT, 'web/src/data/forms.json'), 'utf8')).forms
const O = JSON.parse(fs.readFileSync(path.join(ROOT, 'web/src/data/forms_orig.json'), 'utf8'))
const 원본들 = Array.isArray(O) ? O : O.forms
const 있는서식 = new Set([...서식들.map((f) => f.slug), ...원본들.map((f) => f.slug)])
let 슬러그들 = fs.readdirSync(GD).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5)).filter((s) => 있는서식.has(s)).sort()
const 격자있음 = new Set(슬러그들)
let 웹들 = 서식들.filter((f) => !격자있음.has(f.slug)).sort((a, b) => (a.slug < b.slug ? -1 : 1))
if (고른.length) { 슬러그들 = 슬러그들.filter((s) => 고른.includes(s)); 웹들 = 웹들.filter((f) => 고른.includes(f.slug)) }
let ok = 0, bad = 0
const 틀림 = []
const 봐 = (c, m, 더 = '') => { if (c) ok++; else { bad++; 틀림.push(`✗ ${m} ${더}`); console.log('✗', m, 더) } }
const 날꼴 = (nf) => !!nf && /[yd]/.test(String(nf).replace(/"[^"]*"/g, ''))
const 수꼴 = (nf) => !!nf && /[#0]/.test(String(nf)) && !날꼴(nf)
/* 첫 «쓰는 칸» — 고르는 칸(dv) · 날 · 사진 · 인쇄 밖은 빼고, 첫 쪽에 있는 것 */
function 첫칸(doc) {
  for (let si = 0; si < doc.sheets.length; si++) {
    const s = doc.sheets[si]
    const 판 = 판짜기(s)
    for (const x of s.cells) {
      const [r, c, , , , k, v] = x
      const nf = x[8], dv = x[9]
      if (k !== 1 || dv || 날꼴(nf) || (v && typeof v === 'object') || c > s.pc) continue
      if (typeof v === 'string' && v.startsWith('=')) continue
      const pi = 칸쪽(판, r)
      if (pi < 0) continue
      const 상자 = 칸상자(판, pi, x)
      if (!상자 || 상자.h < 12 || 상자.w < 20) continue
      return { si, r, c, x, 판, pi, 상자, 수: 수꼴(nf) }
    }
  }
  return null
}
const 브 = await chromium.launch()
const w = 기기 === '폰' ? 390 : 1280
const 판 = await 브.newContext({ viewport: { width: w, height: 844 }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', ...(기기 === '폰' ? { isMobile: true, hasTouch: true } : {}) })
await 판.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|googlesyndication|geojs|firebaseio|firebasedatabase/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
await 판.addInitScript(() => { try { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); sessionStorage.setItem('kcm_notice_seen', '2026-10-업체'); sessionStorage.setItem('kcm_visit_s', '1') } catch (e) { /* 없음 */ } })
let A = await 판.newPage()
let 오류 = []
A.on('pageerror', (e) => 오류.push(String(e).slice(0, 160)))
async function 종이(slug) {
  await A.goto(주소 + '/forms/' + slug, { waitUntil: 'domcontentloaded' })
  await A.waitForFunction(() => window.__격자 && document.querySelectorAll('canvas.gx-page').length, null, { timeout: 25000 })
  await A.waitForTimeout(350)
}
const 시작 = Date.now()
let 몇 = 0
/* 서식 하나 — 종이에 바로 쓰기 */
async function 종이시험(slug) {
  const doc = JSON.parse(fs.readFileSync(path.join(GD, slug + '.json'), 'utf8'))
  오류 = []
  try {
    await A.goto(주소 + '/', { waitUntil: 'domcontentloaded' })
    await A.evaluate(() => { try { localStorage.removeItem('kcm.격자'); localStorage.removeItem('kcm.서식공통') } catch (e) { /* 없음 */ } })
    await 종이(slug)
  } catch (e) { 봐(false, `${slug} 종이가 안 뜸`, String(e).slice(0, 80)); await 새탭(); return }
  const 칸 = 첫칸(doc)
  if (!칸) { 봐(false, `${slug} 쓰는 칸 없음`); return }
  const { si, r, c, 판: pan, pi, 상자 } = 칸
  const cv = A.locator(`#gx-s${si} canvas.gx-page`).nth(pi)
  await cv.scrollIntoViewIfNeeded()
  let bx = await cv.boundingBox()
  const 비 = bx.width / pan.W
  // 손으로 하듯: 종이 틀(.gx-wrap)의 «보이는 쪽» 밖이면 옆으로 밀고(폰은 처음부터 크게 → 가로 서식 오른쪽 칸은 밀어야 보임) · 위아래는 화면 1/3 쯤에
  await A.evaluate(([cx, cy]) => { const 감 = document.querySelector('.gx-wrap'); if (감) { const R = 감.getBoundingClientRect(); if (cx < R.left + 10 || cx > R.right - 10) 감.scrollLeft += cx - (R.left + R.right) / 2 } window.scrollBy(0, cy - innerHeight * 0.33) },
    [bx.x + (상자.x + 상자.w / 2) * 비, bx.y + (상자.y + 상자.h / 2) * 비])
  await A.waitForTimeout(200)
  bx = await cv.boundingBox()
  const tx = bx.x + (상자.x + 상자.w / 2) * 비, ty = bx.y + (상자.y + 상자.h / 2) * 비
  const 맞은것 = await A.evaluate(([x, y]) => { const e = document.elementFromPoint(x, y); return e ? (e.matches('canvas.gx-page') ? '종이' : e.tagName + '.' + String(e.className).slice(0, 30)) : '없음' }, [tx, ty])
  봐(맞은것 === '종이', `${slug} 그 칸 자리가 화면에 보임(가려지지 않음)`, `(${doc.sheets[si].name} r${r} c${c} → ${맞은것})`)
  if (기기 === '폰') await A.touchscreen.tap(tx, ty)
  else await A.mouse.click(tx, ty)
  await A.waitForTimeout(220)
  const 열림 = await A.locator('.gx-ed-r .fw-in').count()
  봐(열림 > 0, `${slug} 칸을 누르면 쓰는 칸이 열림`, `(${doc.sheets[si].name} r${r} c${c})`)
  if (!열림) return
  const 글 = 칸.수 ? '123' : '이용자시험'
  await A.locator('.gx-ed-r .fw-in').first().fill(글)
  await A.keyboard.press('Enter')
  await A.waitForTimeout(220)
  const 값1 = await A.evaluate(([si, r, c]) => window.__격자.책.값(si, r, c), [si, r, c])
  const 맞음 = 칸.수 ? 값1 === 123 : 값1 === '이용자시험'
  봐(맞음, `${slug} 쳐 넣은 값이 그 칸에 들어감`, JSON.stringify(값1))
  await A.waitForTimeout(1000)
  await 종이(slug)
  const 값2 = await A.evaluate(([si, r, c]) => window.__격자.책.값(si, r, c), [si, r, c])
  봐(JSON.stringify(값2) === JSON.stringify(값1), `${slug} 새로고침해도 그대로(이 기기)`, JSON.stringify(값2))
  const 링크 = await A.evaluate(() => [...document.querySelectorAll('.flist a.flink[href]')].map((a) => a.getAttribute('href')))
  const 없는 = 링크.filter((h) => h.startsWith('/forms/') && !있는서식.has(h.slice(7)))
  봐(!없는.length, `${slug} «놓치기 쉬운 것» 링크가 있는 서식을 가리킴`, 없는.join(' '))
  봐(!오류.length, `${slug} 화면 오류 0`, 오류.slice(0, 2).join(' | '))
  const 알림 = await A.locator('.gx-slide').count()
  봐(기기 === '폰' ? 알림 === 1 : 알림 === 0, `${slug} «옆으로 밀면 보임» 알림 ${기기 === '폰' ? '있음(폰은 크게 시작)' : '없음(PC 는 한눈에)'}`, String(알림))
}
/* 하나가 멈춰도(시간 넘김 등) ✗ 로 적고 새 탭으로 이어 감 — 이용자가 탭을 다시 여는 것처럼 */
async function 새탭() { try { await A.close() } catch (e) { /* 없음 */ } A = await 판.newPage(); A.on('pageerror', (e) => 오류.push(String(e).slice(0, 160))) }
for (const slug of 슬러그들) {
  몇++
  try { await 종이시험(slug) } catch (e) { 봐(false, `${slug} 시험 중 멈춤`, String(e).split('\n')[0].slice(0, 100)); await 새탭() }
  if (몇 % 20 === 0) console.log(`… ${몇}/${슬러그들.length} · ${Math.round((Date.now() - 시작) / 1000)}초 · 틀림 ${bad}`)
}
/* 종이가 아닌 서식 — 안전 «사이트에서 작성 → PDF»(서식작성.jsx) · 공내역서 한 벌 · 위험성평가(→ 도구) */
const 링크봐 = async (slug) => {
  const 링크 = await A.evaluate(() => [...document.querySelectorAll('.flist a.flink[href]')].map((a) => a.getAttribute('href')))
  const 없는 = 링크.filter((h) => h.startsWith('/forms/') && !있는서식.has(h.slice(7)))
  봐(!없는.length, `${slug} «놓치기 쉬운 것» 링크가 있는 서식을 가리킴`, 없는.join(' '))
}
let 위험성도구봄 = false, 웹몇 = 0
async function 웹시험(f) {
  const slug = f.slug
  오류 = []
  try {
    await A.goto(주소 + '/', { waitUntil: 'domcontentloaded' })
    await A.evaluate(() => { try { for (const k of Object.keys(localStorage)) if (k.startsWith('kcm.서식')) localStorage.removeItem(k) } catch (e) { /* 없음 */ } })
    await A.goto(주소 + '/forms/' + slug, { waitUntil: 'domcontentloaded' })
    await A.waitForSelector('.fp-acts', { timeout: 25000 })
  } catch (e) { 봐(false, `${slug} 서식 장이 안 뜸`, String(e).slice(0, 80)); await 새탭(); return }
  if (f.gen === 'wihgen') {
    const 단추 = await A.locator('.fp-acts a.btn.primary').getAttribute('href').catch(() => null)
    봐(단추 === '/tools/risk', `${slug} «사이트에서 작성» 단추가 위험성평가 도구로`, String(단추))
    await A.waitForTimeout(400)
    await 링크봐(slug)
    봐(!오류.length, `${slug} 화면 오류 0`, 오류.slice(0, 2).join(' | '))
    if (!위험성도구봄 && 단추) {
      위험성도구봄 = true
      오류 = []
      await A.locator('.fp-acts a.btn.primary').click()
      await A.waitForURL(/\/tools\/risk/, { timeout: 15000 }).catch(() => {})
      await A.waitForTimeout(1500)
      const 글 = await A.evaluate(() => document.body.innerText.length)
      봐(/\/tools\/risk/.test(A.url()) && 글 > 400 && !오류.length, '위험성평가 도구가 뜸(눌러서 감 · 오류 0)', `${A.url()} · 글 ${글} · ${오류.slice(0, 1)}`)
    }
    return
  }
  if (f.slug === 'gongnaeyeok-hanbeol') {
    const 엑셀 = await A.locator('.fp-acts a[href$=".xlsx"]').getAttribute('href').catch(() => null)
    // 200 만으로는 모름(없는 파일도 앱 쪽이 200 으로 옴) → 받아서 엑셀(zip «PK») 인지 · 크기
    const 상태 = 엑셀 ? await A.evaluate(async (h) => { try { const r = await fetch(h); const u = new Uint8Array(await r.arrayBuffer()); return r.status + ' ' + String.fromCharCode(u[0], u[1]) + ' ' + u.length } catch (e) { return String(e) } }, 엑셀) : '없음'
    봐(/^200 PK \d{5,}$/.test(상태), `${slug} 엑셀 파일이 실제로 있음(엑셀 · 크기)`, `${엑셀} → ${상태}`)
  }
  try { await A.waitForSelector('#작성.fw textarea.fw-in', { timeout: 20000 }) } catch (e) { 봐(false, `${slug} 작성 칸이 안 뜸`); await 새탭(); return }
  const 몇째 = await A.evaluate(() => [...document.querySelectorAll('#작성.fw textarea.fw-in')].findIndex((t) => t.offsetParent && !t.readOnly && !t.disabled && !t.value))
  if (몇째 < 0) { 봐(false, `${slug} 빈 쓰는 칸 없음`); return }
  const 칸 = A.locator('#작성.fw textarea.fw-in').nth(몇째)
  await 칸.scrollIntoViewIfNeeded()
  let b = await 칸.boundingBox()
  await A.evaluate((dy) => window.scrollBy(0, dy), b.y + b.height / 2 - 844 * 0.33)
  await A.waitForTimeout(200)
  b = await 칸.boundingBox()
  const tx = b.x + Math.min(b.width / 2, 60), ty = b.y + b.height / 2
  const 맞은것 = await A.evaluate(([x, y]) => { const e = document.elementFromPoint(x, y); return e ? (e.matches('#작성.fw textarea.fw-in') ? '칸' : e.tagName + '.' + String(e.className).slice(0, 30)) : '없음' }, [tx, ty])
  const 이름 = await 칸.getAttribute('aria-label').catch(() => '')
  봐(맞은것 === '칸', `${slug} 첫 빈 칸 자리가 화면에 보임(가려지지 않음)`, `(${이름 || 몇째 + '째'} → ${맞은것})`)
  if (기기 === '폰') await A.touchscreen.tap(tx, ty)
  else await A.mouse.click(tx, ty)
  await A.waitForTimeout(150)
  const 커서 = await 칸.evaluate((t) => document.activeElement === t)
  봐(커서, `${slug} 칸을 누르면 커서가 들어감`, `(${이름 || 몇째 + '째'})`)
  if (!커서) return
  await A.keyboard.type('이용자시험')
  await A.waitForTimeout(150)
  봐((await 칸.inputValue()) === '이용자시험', `${slug} 쳐 넣은 글이 그 칸에 들어감`, await 칸.inputValue())
  await A.waitForTimeout(1200)
  await A.goto(주소 + '/forms/' + slug, { waitUntil: 'domcontentloaded' })
  try { await A.waitForSelector('#작성.fw textarea.fw-in', { timeout: 20000 }) } catch (e) { /* 아래에서 틀림 */ }
  const 뒤 = await A.evaluate((i) => { const t = document.querySelectorAll('#작성.fw textarea.fw-in')[i]; return t ? t.value : null }, 몇째)
  봐(뒤 === '이용자시험', `${slug} 새로고침해도 그대로(이 기기)`, JSON.stringify(뒤))
  await 링크봐(slug)
  봐(!오류.length, `${slug} 화면 오류 0`, 오류.slice(0, 2).join(' | '))
}
for (const f of 웹들) {
  웹몇++
  try { await 웹시험(f) } catch (e) { 봐(false, `${f.slug} 시험 중 멈춤`, String(e).split('\n')[0].slice(0, 100)); await 새탭() }
}
if (웹들.length) console.log(`… 종이 아닌 서식 ${웹몇}/${웹들.length} · ${Math.round((Date.now() - 시작) / 1000)}초 · 틀림 ${bad}`)

/* 폰: 가로 서식(주간 공정 현황보고)은 알림의 «한눈에 보기» 한 번에 한눈에 · 알림도 사라짐 */
if (기기 === '폰' && (!고른.length || 고른.includes('jugan-hyeonhwang'))) {
  await 종이('jugan-hyeonhwang')
  const 전 = await A.evaluate(() => { const 감 = document.querySelector('.gx-wrap'); return { 넘: 감.scrollWidth > 감.clientWidth + 2, 알림: !!document.querySelector('.gx-slide') } })
  봐(전.넘 && 전.알림, '폰 · 가로 서식은 처음에 크게(옆으로 밀림) + 알림', JSON.stringify(전))
  await A.locator('.gx-slide button', { hasText: '한눈에 보기' }).tap()
  await A.waitForTimeout(400)
  const 후 = await A.evaluate(() => { const 감 = document.querySelector('.gx-wrap'); const cv = 감.querySelector('canvas.gx-page'); return { 넘: 감.scrollWidth > 감.clientWidth + 2, 알림: !!document.querySelector('.gx-slide'), 종이폭: Math.round(cv.getBoundingClientRect().width), 틀폭: 감.clientWidth } })
  봐(!후.넘 && !후.알림 && 후.종이폭 <= 후.틀폭, '폰 · «한눈에 보기» 누르면 종이가 한눈에 · 알림 사라짐', JSON.stringify(후))
  // 한눈에 본 종이에서도 오른쪽 «작성자» 칸을 톡 → 쓰는 칸이 열림 · «＋» 로 다시 크게 하면 알림이 다시 뜸
  const jd = JSON.parse(fs.readFileSync(path.join(GD, 'jugan-hyeonhwang.json'), 'utf8'))
  const js = jd.sheets[0], jp = 판짜기(js), jx = js.cells.find((x) => x[0] === 6 && x[1] === 12)
  const jpi = 칸쪽(jp, 6), j상자 = 칸상자(jp, jpi, jx)
  const jcv = A.locator('#gx-s0 canvas.gx-page').nth(jpi)
  await jcv.scrollIntoViewIfNeeded()
  const jb = await jcv.boundingBox(), jk = jb.width / jp.W
  await A.evaluate((dy) => window.scrollBy(0, dy), jb.y + (j상자.y + j상자.h / 2) * jk - 844 * 0.33)
  await A.waitForTimeout(200)
  const jb2 = await jcv.boundingBox()
  await A.touchscreen.tap(jb2.x + (j상자.x + j상자.w / 2) * jk, jb2.y + (j상자.y + j상자.h / 2) * jk)
  await A.waitForTimeout(250)
  봐(await A.locator('.gx-ed-r .fw-in').count() > 0, '폰 · 한눈에 본 종이에서 오른쪽 «작성자» 칸 톡 → 쓰는 칸 열림')
  await A.keyboard.press('Escape')
  await A.locator('button[aria-label="크게"]').tap()
  await A.waitForTimeout(400)
  봐(await A.locator('.gx-slide').count() === 1, '폰 · «＋» 로 다시 크게 → 알림 다시 뜸')
}
try {
  await A.goto(주소 + '/', { waitUntil: 'domcontentloaded' })
  await A.evaluate(() => { try { for (const k of Object.keys(localStorage)) if (k === 'kcm.격자' || k.startsWith('kcm.서식')) localStorage.removeItem(k) } catch (e) { /* 없음 */ } })
} catch (e) { /* 끝 정리 못 함 — 시험 판(브라우저)째 닫으므로 남지 않음 */ }
await 브.close()
console.log(`\n${기기} · 서식 ${슬러그들.length + 웹들.length}(종이 ${슬러그들.length} · 그 밖 ${웹들.length}) · ${ok} 통과 · ${bad} 실패 · ${Math.round((Date.now() - 시작) / 1000)}초`)
if (틀림.length) console.log(틀림.slice(0, 40).join('\n'))
process.exit(bad ? 1 : 0)
