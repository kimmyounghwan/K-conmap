/**
 * 🩹 G770 밝은 종이 — 어두운 화면(다크 모드) 기기에서 찍어도 그림 PDF 는 «흰 종이 + 검은 글» 화면 시험 (2026-11-18). 구운 사이트(dist)를 띄운 뒤:
 *   node tools/시험_밝은종이화면.mjs [주소=http://127.0.0.1:4578]        (OUT=/tmp/g10/g770 · 클라우드에서만 — PC 올리기 시험은 node tools/시험_밝은종이.mjs)
 *   소장님 11-18 아이폰 캡처(낙찰 뒤 할 일 PDF) 「이상하지 않아 PDF . 점점해 줘」 — 흰 종이에 검은 입력 칸 · 흐린 이름 글 · 검은 할 일 표 · «2026-10 -15» 벌어진 날짜
 *   ① lib/그림인쇄.js 밝은종이(복제본 손질)만 떼어 빈 쪽에서: 어두운 규칙(@media · @supports 안 · 겹친 것) 지움 · 밝은 판 표 · 숫자 꼴 보통 · 날짜 · 시각 칸 → 글 칸(값 그대로) · 원본 쪽은 그대로
 *   ② 진짜 화면 — 같은 일을 «어두운 화면» · «밝은 화면» 브라우저에서 PDF 로: 쪽 수 같음 · 쪽 그림이 거의 같음(평균 차 < 1) · 검은 덩이 없음
 *      낙찰 뒤 할 일(인쇄판찍기 · PC 1280 · 폰 390) · 견적서 · 노무비(칸줄) · 안전 웹 서식(종이찍기)
 *   ③ 낙찰 뒤 할 일 날짜 «2026-10-15» — 복제본에서 숫자 꼴이 보통(그림 그리개와 같은 폭) · 화면에선 그대로 tabular-nums
 *   ④ 화면 오류 0 · 보는 화면은 찍은 뒤에도 어두운 화면 그대로
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
let chromium
try { ({ chromium } = require('playwright')) } catch (e) { ({ chromium } = createRequire('/tmp/g10/pw/package.json')('playwright')) }
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const BASE = process.argv[2] || 'http://127.0.0.1:4578'
const 폴더 = process.env.OUT || '/tmp/g10/g770'
fs.mkdirSync(폴더, { recursive: true })
let bad = 0, n = 0
const ok = (이름, c, got) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (c || got === undefined ? '' : ' = ' + JSON.stringify(got).slice(0, 500))) }
const 쉬어 = (ms) => new Promise((r) => setTimeout(r, ms))

/* PDF → 쪽마다 회색 그림(40dpi) */
function 쪽그림(파일, 머리) {
  execFileSync('pdftoppm', ['-r', '40', '-gray', 파일, 머리])
  const 폴 = path.dirname(머리)
  return fs.readdirSync(폴).filter((f) => f.startsWith(path.basename(머리) + '-') && f.endsWith('.pgm')).sort().map((f) => {
    const 파 = path.join(폴, f)
    const buf = fs.readFileSync(파)
    fs.unlinkSync(파)
    let i = 0, 줄 = 0
    while (줄 < 3) { if (buf[i] === 10) 줄++; i++ }
    return buf.subarray(i)
  })
}
const 검은몫 = (px) => { let k = 0; for (const v of px) if (v < 80) k++; return Math.round((k / px.length) * 10000) / 100 }
const 먹몫 = (px) => { let k = 0; for (const v of px) if (v < 230) k++; return Math.round((k / px.length) * 10000) / 100 }
const 평균차 = (a, b) => { if (a.length !== b.length) return 999; let s = 0; for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]); return Math.round((s / a.length) * 100) / 100 }

const b = await chromium.launch()
const UA폰 = 'Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'
const UAPC = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

/* ── ① 밝은종이 떼어 보기 ── */
console.log('① 밝은종이(복제본 손질) — 빈 쪽에서')
{
  const 글 = fs.readFileSync(path.join(ROOT, 'web', 'src', 'lib', '그림인쇄.js'), 'utf8').replace(/\r\n/g, '\n')
  const a = 글.indexOf('const 어두운규칙 = '), z = 글.indexOf('\n  return 지움\n}', a)
  ok('lib/그림인쇄.js 에 밝은종이가 있음', a > 0 && z > a)
  const 몸 = 글.slice(a, z + '\n  return 지움\n}'.length).replace('export function 밝은종이', 'function 밝은종이')
  const ctx = await b.newContext({ colorScheme: 'dark', viewport: { width: 800, height: 600 } })
  const p = await ctx.newPage()
  await p.setContent('<!doctype html><html><head><meta charset="utf-8"></head><body></body></html>')
  const 결과 = await p.evaluate(async (src) => {
    const 밝은종이 = new Function(src + '\nreturn 밝은종이')()
    const 만들기 = async () => {
      const fr = document.createElement('iframe'); fr.style.width = '600px'; fr.style.height = '400px'; document.body.appendChild(fr)
      const d = fr.contentDocument
      d.open(); d.write(`<!doctype html><html><head><style>
        :root { --s: #ffffff; --t: #111111; }
        body { background: var(--s); color: var(--t); }
        .a { background: var(--s); font-variant-numeric: tabular-nums; } .b { color: #222222; } .c { background: #ffffff; } .e { color: #333333; } .f { color: #444444; }
        .g { font-feature-settings: "tnum"; }
        @media (prefers-color-scheme: dark) { :root { --s: #161a21; --t: #e8eaed; } }
        @supports (display: grid) { @media (prefers-color-scheme: dark) { .b { color: #eeeeee; } } }
        @media (prefers-color-scheme: dark) and (min-width: 1px) { .c { background: #000000; } }
        @media screen { @media (prefers-color-scheme: dark) { .e { color: #fafafa; } } }
        :root:not([data-theme="light"]) .f { color: #ff00ff; }
        </style></head><body><div class="a">2026-10-15</div><div class="b">x</div><div class="c">y</div><div class="e">z</div><div class="f">w</div><div class="g">12</div>
        <input id="d" type="date" value="2026-10-05"><input id="t" type="time" value="09:30"><input id="m" type="month" value="2026-10"><input id="x" type="text" value="850,000,000"><input id="k" type="checkbox" checked></body></html>`)
      d.close()
      await new Promise((r) => setTimeout(r, 50))
      return d
    }
    const 색 = (d) => { const w = d.defaultView, g = (s) => w.getComputedStyle(d.querySelector(s)); return { a: g('.a').backgroundColor, b: g('.b').color, c: g('.c').backgroundColor, e: g('.e').color, f: g('.f').color, 몸: w.getComputedStyle(d.body).backgroundColor, 숫자: g('.a').fontVariantNumeric, 특: g('.g').fontFeatureSettings } }
    const 원 = await 만들기()
    const 전 = 색(원)
    const d = await 만들기()
    const 지움 = 밝은종이(d)
    const 후 = 색(d)
    const 칸 = ['d', 't', 'm', 'x', 'k'].map((i) => { const e = d.getElementById(i); return [i, e.type, e.value, e.type === 'checkbox' ? e.checked : null] })
    return { 전, 후, 지움, 칸, 판: d.documentElement.getAttribute('data-theme'), 꼴: d.documentElement.style.colorScheme, 원그대로: 색(원), 두번: 밝은종이(d) }
  }, 몸)
  ok('어두운 화면 브라우저에서 손질 전엔 어두움(시험 판이 맞게 섰는지)', 결과.전.a === 'rgb(22, 26, 33)' && 결과.전.b === 'rgb(238, 238, 238)' && 결과.전.c === 'rgb(0, 0, 0)' && 결과.전.e === 'rgb(250, 250, 250)' && 결과.전.f === 'rgb(255, 0, 255)', 결과.전)
  ok(`손질 뒤 — 어두운 규칙 ${결과.지움}개 지움(@media · @supports 안 · and 겹침 · @media 안 @media) · 몸 · 칸 모두 밝음`, 결과.지움 === 4 && 결과.후.a === 'rgb(255, 255, 255)' && 결과.후.몸 === 'rgb(255, 255, 255)' && 결과.후.b === 'rgb(34, 34, 34)' && 결과.후.c === 'rgb(255, 255, 255)' && 결과.후.e === 'rgb(51, 51, 51)', 결과)
  ok('밝은 판 표(data-theme="light" — :root:not([data-theme="light"]) 규칙도 꺼짐) · color-scheme light', 결과.판 === 'light' && 결과.꼴 === 'light' && 결과.후.f === 'rgb(68, 68, 68)', [결과.판, 결과.꼴, 결과.후.f])
  ok('숫자 꼴 보통(tabular-nums · "tnum" → normal — 그림 그리개와 같은 폭)', 결과.후.숫자 === 'normal' && 결과.후.특 === 'normal', [결과.후.숫자, 결과.후.특])
  ok('날짜 · 시각 · 달 칸 → 글 칸 · 값 그대로 · 글 칸 · 체크 칸은 그대로', JSON.stringify(결과.칸) === JSON.stringify([['d', 'text', '2026-10-05', null], ['t', 'text', '09:30', null], ['m', 'text', '2026-10', null], ['x', 'text', '850,000,000', null], ['k', 'checkbox', 'on', true]]), 결과.칸)
  ok('원본 쪽(다른 문서)은 그대로 어두움 · 두 번 불러도 탈 없음(지울 것 0)', 결과.원그대로.a === 'rgb(22, 26, 33)' && 결과.두번 === 0, [결과.원그대로.a, 결과.두번])
  await ctx.close()
}

/* ── ② 진짜 화면 — 어두운 · 밝은 브라우저에서 같은 PDF ── */
console.log('② 진짜 화면 — 어두운 화면 · 밝은 화면에서 같은 PDF')
const 차림 = async (색, 폰) => {
  const ctx = await b.newContext({ viewport: 폰 ? { width: 390, height: 844 } : { width: 1280, height: 900 }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', isMobile: 폰, hasTouch: 폰, acceptDownloads: true, colorScheme: 색, userAgent: 폰 ? UA폰 : UAPC })
  await ctx.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|googlesyndication|geojs|coupang|daumcdn|kakao/, (r) => r.fulfill({ status: 200, body: '' }))
  await ctx.route(/firebaseio\.com|firebasedatabase\.app|identitytoolkit|securetoken/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await ctx.addInitScript(() => { try { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); sessionStorage.setItem('kcm_notice_seen', '2026-10-업체'); sessionStorage.setItem('kcm_visit_s', '1') } catch (e) { /* 없음 */ } })
  const p = await ctx.newPage()
  const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
  return { ctx, p, 오류 }
}
const 받기 = async (p, 단추, 파일) => {
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 60000 }), 단추.click()])
  await dl.saveAs(파일)
  await 쉬어(300)
}
const 일들 = [
  ['낙찰 뒤 할 일', false, async (p, 파일) => {
    await p.goto(BASE + '/tools/after-award', { waitUntil: 'domcontentloaded' }); await p.waitForSelector('.kt-aa', { timeout: 20000 }); await 쉬어(500)
    await p.locator('button', { hasText: '예시로 해 보기' }).first().click(); await 쉬어(900)
    await 받기(p, p.locator('.kt-aa .kt-btns button', { hasText: /^📄 PDF$/ }), 파일)
  }],
  ['낙찰 뒤 할 일', true, null],
  ['견적서', false, async (p, 파일) => {
    await p.goto(BASE + '/tools/gyeonjeok', { waitUntil: 'domcontentloaded' }); await p.waitForSelector('.gj .gj-paper', { timeout: 20000 }); await 쉬어(700)
    await p.locator('button', { hasText: '예시 — 공공' }).first().click(); await 쉬어(900)
    await 받기(p, p.locator('.gj .gj-paper button', { hasText: '📄 견적서 PDF 저장' }).first(), 파일)
  }],
  ['노무비', false, async (p, 파일) => {
    await p.goto(BASE + '/tools/nomubi', { waitUntil: 'domcontentloaded' }); await p.waitForSelector('button', { timeout: 20000 }); await 쉬어(700)
    await p.locator('button', { hasText: '예시로 채워 보기' }).first().click(); await p.waitForSelector('.nm .tp-bill', { timeout: 20000 }); await 쉬어(800)
    await 받기(p, p.locator('.nm .tp-bill button', { hasText: '📄 지급명세서 PDF 저장' }).first(), 파일)
  }],
  ['안전 웹 서식', false, async (p, 파일) => {
    await p.goto(BASE + '/forms/jg-charyang-geonseol', { waitUntil: 'domcontentloaded' }); await p.waitForSelector('.fw-bar button', { timeout: 20000 }); await 쉬어(300)
    await p.locator('.fw-bar button', { hasText: '✍ 예시 채우기' }).first().click(); await 쉬어(1300)
    /* 🧪 G650 예시는 보기만 — 예시 표만 지우고 새로고침(이 시험 브라우저 저장값만) */
    await p.evaluate(() => { const k = 'kcm.서식작성'; const v = JSON.parse(localStorage.getItem(k) || '{}'); for (const s of Object.keys(v)) if (v[s]) delete v[s].ex; localStorage.setItem(k, JSON.stringify(v)) })
    await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForSelector('.fw-bar button', { timeout: 20000 }); await 쉬어(400)
    await 받기(p, p.locator('.fw-bar button', { hasText: '📄 PDF 저장' }).first(), 파일)
  }],
]
for (const [이름, 폰, 할일0] of 일들) {
  const 할일 = 할일0 || 일들.find((x) => x[0] === 이름 && x[2])[2]
  const 뒤 = `${이름}${폰 ? ' (폰 390)' : ' (PC 1280)'}`
  const 쪽들 = {}
  let 화면어두움 = null
  for (const 색 of ['dark', 'light']) {
    const { ctx, p, 오류 } = await 차림(색, 폰)
    const 파일 = path.join(폴더, `${이름.replace(/\s/g, '')}${폰 ? '_폰' : ''}_${색}.pdf`)
    try { await 할일(p, 파일) } catch (e) { ok(`${뒤} ${색} — PDF 받기`, false, String(e).slice(0, 200)); await ctx.close(); continue }
    쪽들[색] = 쪽그림(파일, path.join(폴더, `쪽_${이름.replace(/\s/g, '')}${폰 ? '_폰' : ''}_${색}`))
    if (색 === 'dark') {
      화면어두움 = await p.evaluate(() => ({ 몸: getComputedStyle(document.body).backgroundColor, 찍는중: document.documentElement.classList.contains('kcm-찍는중') || document.body.classList.contains('kcm-찍는중'), 판: document.documentElement.getAttribute('data-theme') }))
      execFileSync('pdftoppm', ['-r', '50', '-png', '-f', '1', '-l', '1', 파일, path.join(폴더, `보기_${이름.replace(/\s/g, '')}${폰 ? '_폰' : ''}_dark`)])
    }
    ok(`${뒤} ${색} — 화면 오류 없음`, 오류.length === 0, 오류)
    await ctx.close()
  }
  if (!쪽들.dark || !쪽들.light) continue
  const D = 쪽들.dark, L = 쪽들.light
  ok(`${뒤} — 쪽 수 같음(어두운 ${D.length} · 밝은 ${L.length})`, D.length === L.length && D.length >= 1)
  const 차 = D.map((x, i) => (L[i] ? 평균차(x, L[i]) : 999))
  const 검 = D.map(검은몫), 검L = L.map(검은몫), 먹D = D.map(먹몫), 먹L = L.map(먹몫)
  ok(`${뒤} — 쪽 그림이 밝은 화면과 거의 같음(평균 차 ${차.join(' · ')} < 1)`, 차.every((x) => x < 1), { 차, 먹D, 먹L })
  ok(`${뒤} — 검은 덩이 없음(아주 검은 점 몫 ${검.join(' · ')}% ≤ 밝은 화면 ${검L.join(' · ')}% + 0.3)`, 검.every((x, i) => x <= (검L[i] ?? 0) + 0.3), { 검, 검L })
  ok(`${뒤} — 찍은 뒤 보는 화면은 그대로(어두운 바탕 · 몸 표 없음 · 판 표 없음)`, !!화면어두움 && 화면어두움.몸 !== 'rgb(255, 255, 255)' && !화면어두움.찍는중 && !화면어두움.판, 화면어두움)
}

/* ── ③ 날짜 숫자 꼴 — 복제본만 보통 ── */
console.log('③ 낙찰 뒤 할 일 날짜 — 복제본 숫자 꼴')
{
  const { ctx, p, 오류 } = await 차림('dark', false)
  await p.goto(BASE + '/tools/after-award', { waitUntil: 'domcontentloaded' }); await p.waitForSelector('.kt-aa', { timeout: 20000 }); await 쉬어(500)
  await p.locator('button', { hasText: '예시로 해 보기' }).first().click(); await 쉬어(900)
  await p.evaluate(() => {
    window.__복제 = null
    const 찍기 = (d) => { const 판 = d.querySelector('[data-kcm-찍을]'); const 날 = 판 && 판.querySelector('.kt-d'); const 칸 = 판 && 판.querySelector('input'); if (!날 || !d.defaultView) return; const w = d.defaultView; window.__복제 = { 숫자: w.getComputedStyle(날).fontVariantNumeric, 몸: w.getComputedStyle(d.body).backgroundColor, 칸바탕: 칸 ? w.getComputedStyle(칸).backgroundColor : '', 날칸: [...판.querySelectorAll('input')].filter((i) => i.type === 'date').length } }
    const 보기 = (fr) => { let d = null; try { d = fr.contentDocument } catch (e) { d = null } if (!d) return; new MutationObserver(() => { try { 찍기(d) } catch (e) { /* 걷히는 중 */ } }).observe(d, { subtree: true, childList: true, attributes: true }) }
    new MutationObserver((ms) => { for (const m of ms) for (const nd of m.addedNodes) if (nd.tagName === 'IFRAME') 보기(nd) }).observe(document.body, { childList: true })
  })
  const 화면숫자 = await p.evaluate(() => getComputedStyle(document.querySelector('.kt-aa .kt-d')).fontVariantNumeric)
  await 받기(p, p.locator('.kt-aa .kt-btns button', { hasText: /^📄 PDF$/ }), path.join(폴더, '날짜꼴.pdf'))
  const 복 = await p.evaluate(() => window.__복제)
  ok(`복제본: 숫자 꼴 보통 · 밝은 화면 바탕(#eef1f6) · 입력 칸 흰 바탕 · 날짜 칸 0(글 칸으로) — 화면은 그대로 «${화면숫자}»`, !!복 && 복.숫자 === 'normal' && 복.몸 === 'rgb(238, 241, 246)' && 복.칸바탕 === 'rgb(255, 255, 255)' && 복.날칸 === 0 && 화면숫자 === 'tabular-nums', { 복, 화면숫자 })
  ok('화면 오류 없음', 오류.length === 0, 오류)
  await ctx.close()
}
await b.close()
console.log(bad ? `\n❌ 시험_밝은종이화면 ${n - bad}/${n}` : `\n✅ 시험_밝은종이화면 ${n}/${n}`)
process.exit(bad ? 1 : 0)
