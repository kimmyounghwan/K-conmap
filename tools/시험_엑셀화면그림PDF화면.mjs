/**
 * 🖼 G612 엑셀 화면(원클릭 공사서류 · 수량산출서 · 하도급 계약서류) — 그림 PDF · 그림 인쇄(글자 층 없음) 화면 시험. 구운 사이트(dist)를 띄운 뒤:
 *   node tools/시험_엑셀화면그림PDF화면.mjs [주소=http://127.0.0.1:4578]        (OUT=/tmp/g10/g612 · 긴판=0 이면 3000줄 산출서 건너뜀)
 *   소장님 11-08 «엑셀은 그대로 · PDF 는 모두 그림» — 옛 «🖨 이 장 인쇄 · 🖨 N장 모두 인쇄»(window.print → 글자 PDF) →
 *   «📄 이 장 PDF · 🖨 이 장 인쇄 · 📄 N장 모두 PDF · 🖨 N장 모두 인쇄» — 장마다 따로 찍음(가로/세로 · 줄임 장마다) · 긴 장은 lib «긴 판 나눠 찍기».
 *   ① 원클릭 서류 35장 «📄 모두 PDF» → 35쪽(= 옛 인쇄 35쪽) · 세로 A4 · 글꼴 0 · 글자 0 · 쪽마다 내용 · 이름 · 알림 · 찍는 동안 단추 막음 + «만드는 중 n/35»
 *   ② 원클릭 «📄 이 장 PDF» → 1쪽 · 이름 «…_사용인감계.pdf» · 글자가 옛 인쇄와 같은 자리(낱말 사이 안 벌어짐 — zoom 안 씀) · 표 바깥 테두리 있음(칸줄 이웃 보기)
 *   ③ 원클릭 «🖨 모두 인쇄» → 몸 밑엔 쪽 그림만 35장(190 × 273mm · xv세로) → 같은 PDF 35쪽 · 닫으면 걷힘
 *   ④ 수량산출서(치수 48줄) «📄 4장 모두 PDF» → 가3 세2 가1(= 옛 인쇄 차례) · «이 장 PDF» 산출서 가로 3쪽 · «🖨 모두 인쇄» 가로 · 세로 섞인 그림 → 같은 차례 PDF
 *   ⑤ 수량산출서 3000줄 «📄 이 장 PDF» → 가로 74쪽(= 옛 인쇄) · 덩이 여럿(줄 솎음) · 쪽마다 머리줄 다시
 *   ⑥ 아이폰 흉내(사파리 쓸 칸 위 27 · 아래 32mm) «🖨 모두 인쇄» → 그림이 안 갈리고 35쪽(안드로이드 꼴 그림은 같은 흉내에서 갈림)
 *   ⑦ Ctrl+P → 장 글 안 나감 ⑧ 404 ⑨ 하도급 서류 예시는 인쇄 · PDF 단추 없음(보기만) ⑩ 폰 390 · PC 1280 넘침 0 · 오류 0
 *   🧪 G679(11-14) 뒤 — 원클릭은 «열쇠말 연 브라우저»(lib/gate.js 해시 · 예시값을 그 브라우저에 적어 둠)에서만 📄 PDF · 🖨 인쇄 → ①②③⑥⑦⑧ 은 그 꼴로 ·
 *     남(열쇠말 없음)의 원클릭 예시는 보기만(PDF · 인쇄 단추 0 · html.kcm-보기만) — ⑨ 에서 같이 봄(11-14 적산 탭 점검에서 G679 가 이 시험을 안 고친 것을 찾음)
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const BASE = process.argv[2] || 'http://127.0.0.1:4578'
const 폴더 = process.env.OUT || '/tmp/g10/g612'
const 긴판 = process.env.긴판 !== '0'
fs.mkdirSync(폴더, { recursive: true })
const 견본 = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'web', 'public', 'jeoksan', '치수표_견본.csv')   // 🪟 URL.pathname 은 PC(Windows)에서 «/E:/…» 로 넘어짐(checkimports)

/* 🔑 G679 뒤 — 원클릭 PDF · 인쇄는 열쇠말 연 브라우저에서만: lib/gate.js 의 해시 · WonClick.jsx 의 예시값을 소스에서 읽어 씀(두 벌 안 둠) */
const 뿌리 = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const HASH = (/const HASH = '([0-9a-f]{64})'/.exec(fs.readFileSync(path.join(뿌리, 'web', 'src', 'lib', 'gate.js'), 'utf8')) || [])[1]
const 예시값 = Function('return ' + (/const 예시값 = (\{[\s\S]*?\n\})/.exec(fs.readFileSync(path.join(뿌리, 'web', 'src', 'pages', 'WonClick.jsx'), 'utf8')) || [])[1])()
if (!HASH || !예시값 || !예시값.공사명) { console.log('✗ gate.js 해시 · WonClick.jsx 예시값을 못 읽음'); process.exit(1) }

let bad = 0, n = 0
const 틀림 = []
const ok = (이름, c, got) => { n++; if (!c) { bad++; 틀림.push(이름) } console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (c || got === undefined ? '' : ' = ' + JSON.stringify(got).slice(0, 500))) }
const 쉬어 = (ms) => new Promise((r) => setTimeout(r, ms))
function PDF보기(파일) {
  const buf = fs.readFileSync(파일)
  const 정보 = execFileSync('pdfinfo', ['-f', '1', '-l', '9999', 파일]).toString()
  const 그림 = execFileSync('pdfimages', ['-list', 파일]).toString().trim().split('\n').slice(2).filter((x) => x.trim()).map((x) => x.trim().split(/\s+/))
  const 쪽꼴 = [...정보.matchAll(/Page\s+\d+ size:\s+([\d.]+) x ([\d.]+)/g)].map((m) => (+m[1] > +m[2] ? '가' : '세'))
  return {
    머리: buf.subarray(0, 8).toString('latin1'),
    쪽: Number((/Pages:\s+(\d+)/.exec(정보) || [])[1] || 0),
    쪽꼴: 쪽꼴.reduce((a, x) => { if (a.length && a[a.length - 1][0] === x) a[a.length - 1] = x + (Number(a[a.length - 1].slice(1)) + 1); else a.push(x + 1); return a }, []).join(' '),
    A4: [...정보.matchAll(/Page\s+\d+ size:\s+([\d.]+) x ([\d.]+)/g)].every((m) => { const [a, b] = [+m[1], +m[2]].sort((x, y) => x - y); return Math.abs(a - 595.28) < 1 && Math.abs(b - 841.89) < 1 }),
    글꼴: execFileSync('pdffonts', [파일]).toString().trim().split('\n').slice(2).filter((x) => x.trim()).length,
    글자: execFileSync('pdftotext', ['-layout', 파일, '-']).toString().replace(/[\s\f]/g, ''),
    그림수: 그림.filter((c) => Number(c[3]) > 1000).length,
    KB: Math.round(buf.length / 1024),
  }
}
/* 쪽마다 «먹» 비율(%) — 흰 종이(255)가 아니면 셈 */
function 먹들(파일, 머리) {
  execFileSync('pdftoppm', ['-r', '20', '-gray', 파일, 머리])
  const 파일들 = fs.readdirSync(path.dirname(머리)).filter((f) => f.startsWith(path.basename(머리) + '-') && f.endsWith('.pgm')).sort().map((f) => path.join(path.dirname(머리), f))
  return 파일들.map((그림파일) => {
    const buf = fs.readFileSync(그림파일)
    fs.unlinkSync(그림파일)
    let i = 0, 줄 = 0
    while (줄 < 3) { if (buf[i] === 10) 줄++; i++ }
    let 검 = 0
    for (let k = i; k < buf.length; k++) if (buf[k] < 230) 검++
    return Math.round((검 / (buf.length - i)) * 10000) / 100
  })
}
/* 쪽 맨 위 띠(머리줄 자리)의 회색 값 — 두 쪽의 머리줄이 같은 그림인지 봄(30dpi · 위 여백 뒤 6mm) */
function 위띠(파일, 쪽) {
  const 머리 = path.join(폴더, '띠')
  execFileSync('pdftoppm', ['-r', '30', '-gray', '-f', String(쪽), '-l', String(쪽), 파일, 머리])
  const f = fs.readdirSync(폴더).find((x) => x.startsWith('띠-') && x.endsWith('.pgm'))
  const buf = fs.readFileSync(path.join(폴더, f))
  fs.unlinkSync(path.join(폴더, f))
  const 글 = buf.subarray(0, 40).toString('latin1').split(/\s+/)
  const W = Number(글[1])
  let i = 0, 줄 = 0
  while (줄 < 3) { if (buf[i] === 10) 줄++; i++ }
  const mm = 30 / 25.4
  const y0 = Math.round(10 * mm), y1 = Math.round(16 * mm)      // 가로 A4 위 여백 10mm 뒤 6mm
  const 값 = []
  for (let y = y0; y < y1; y++) for (let x = 0; x < W; x++) 값.push(buf[i + y * W + x])
  return 값
}
const 띠차 = (a, b) => { let s = 0; for (let i = 0; i < Math.min(a.length, b.length); i++) s += Math.abs(a[i] - b[i]); return s / Math.max(1, Math.min(a.length, b.length)) }

const b = await chromium.launch()
const UA폰 = 'Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'
const UA아이폰 = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1'
const 새판 = async (기기, 열쇠 = true) => {
  const 폰 = 기기 !== 'PC'
  const ctx = await b.newContext({ viewport: 폰 ? { width: 390, height: 844 } : { width: 1280, height: 900 }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', isMobile: 폰, hasTouch: 폰, acceptDownloads: true, ...(기기 === '폰' ? { userAgent: UA폰 } : 기기 === '아이폰' ? { userAgent: UA아이폰 } : {}) })
  await ctx.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|googlesyndication|geojs/, (r) => r.fulfill({ status: 200, body: '' }))
  await ctx.route(/firebaseio\.com|firebasedatabase\.app|identitytoolkit|securetoken/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await ctx.addInitScript(() => { try { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); sessionStorage.setItem('kcm_notice_seen', '2026-10-업체'); sessionStorage.setItem('kcm_visit_s', '1') } catch (e) { /* 없음 */ } })
  if (열쇠) await ctx.addInitScript(([h, v]) => { try { localStorage.setItem('kcm_lab_ok', h); if (!localStorage.getItem('kcm.wonclick.v1')) localStorage.setItem('kcm.wonclick.v1', JSON.stringify(v)) } catch (e) { /* 없음 */ } }, [HASH, 예시값])
  await ctx.addInitScript(() => { window.__받은이름 = []; window.__kcm찍기재기 = []; document.addEventListener('click', (e) => { const a = e.target && e.target.closest && e.target.closest('a[download]'); if (a) window.__받은이름.push(a.download) }, true) })
  return ctx
}
const 단추 = (q, 글) => q.locator('.xv-띠 button', { hasText: 글 })
const 말 = (q) => q.evaluate(() => [...document.querySelectorAll('.xv-찍말')].map((x) => x.innerText).join(' | '))
const 원클릭열기 = async (q) => {
  await q.goto(BASE + '/tools/wonclick', { waitUntil: 'domcontentloaded' })
  await q.waitForSelector('.wc-doc', { timeout: 30000 })
  await q.click('text=전부')
  await 쉬어(200)
  await q.locator('button', { hasText: '화면에서 보기' }).click()
  await q.waitForSelector('.xv-띠', { timeout: 30000 })
  await 쉬어(400)
}
const 산출열기 = async (q, 글) => {
  await q.goto(BASE + '/jeoksan/run', { waitUntil: 'domcontentloaded' })
  await q.locator('button', { hasText: '토목 견본 그대로 쓰기' }).click()
  await 쉬어(2000)
  await q.locator('button', { hasText: 'CSV·엑셀 올리기' }).click()
  await 쉬어(500)
  await q.evaluate((t) => { const dt = new DataTransfer(); dt.items.add(new File([t], '치수표.csv', { type: 'text/csv' })); document.querySelector('.tldrop').dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt })) }, 글)
  await q.waitForFunction(() => { const x = [...document.querySelectorAll('button')].find((y) => /수량산출서 만들기/.test(y.textContent)); return x && !x.disabled }, null, { timeout: 30000 })
  await q.locator('button', { hasText: '🧮 수량산출서 만들기' }).click()
  await q.waitForSelector('.xv-띠', { timeout: 120000 })
  await 쉬어(400)
}
/* PDF 받기 — 찍는 동안(1초 뒤) 단추 글 · 막음도 봄 */
const 받기 = async (q, 글, 이름, 기다림 = 300000) => {
  const t0 = Date.now()
  const [dl, 동안] = await Promise.all([
    q.waitForEvent('download', { timeout: 기다림 }),
    (async () => { await 단추(q, 글).click(); await 쉬어(900); return q.evaluate(() => ({ 글: [...document.querySelectorAll('.xv-띠 button')].map((x) => x.innerText), 막음: [...document.querySelectorAll('.xv-띠 button')].filter((x) => /PDF|인쇄/.test(x.innerText)).map((x) => x.disabled) })) })(),
  ])
  const 파일 = path.join(폴더, 이름)
  await dl.saveAs(파일)
  await 쉬어(400)
  return { 파일, 걸림: (Date.now() - t0) / 1000, 동안, 이름: await q.evaluate(() => (window.__받은이름 || []).slice(-1)[0] || ''), 알림: await 말(q), 판남음: await q.evaluate(() => !!document.getElementById('xv-인쇄')), 막음끝: await q.evaluate(() => [...document.querySelectorAll('.xv-띠 button')].some((x) => x.disabled)) }
}
/* 옛 인쇄 흉내 — 찍는 판(#xv-인쇄)을 엿보아 두고, 장마다 data-z 를 옛 zoom 으로 되살려 옛 꼴로 인쇄(window.print 그대로 = 브라우저 인쇄) */
const 판엿보기 = (q) => q.evaluate(() => {
  window.__판 = null
  if (window.__ob) window.__ob.disconnect()
  const ob = new MutationObserver(() => { const el = document.querySelector('#xv-인쇄'); if (el && el.firstElementChild && !window.__판) window.__판 = el.outerHTML })
  ob.observe(document.body, { childList: true, subtree: true })
  window.__ob = ob
})
const 옛인쇄 = async (q, 이름) => {
  const 장 = await q.evaluate(() => {
    const d = document.createElement('div'); d.innerHTML = window.__판 || ''
    const 판 = d.firstElementChild
    if (!판) return 0
    for (const s of 판.querySelectorAll('.xv-쪽')) s.firstElementChild.style.zoom = s.getAttribute('data-z')
    document.body.appendChild(판); document.body.classList.add('xv-인쇄중'); document.documentElement.classList.add('xv-인쇄중')
    return 판.querySelectorAll('.xv-쪽').length
  })
  const 파일 = path.join(폴더, 이름)
  fs.writeFileSync(파일, await q.pdf({ preferCSSPageSize: true, printBackground: true }))
  await q.evaluate(() => { document.querySelectorAll('#xv-인쇄').forEach((x) => x.remove()); document.body.classList.remove('xv-인쇄중'); document.documentElement.classList.remove('xv-인쇄중') })
  return { 장, ...PDF보기(파일), 파일 }
}
/* 인쇄 순간 엿보기(window.print 갈음) */
const 인쇄엿보기 = (q) => q.evaluate(() => {
  window.__인쇄 = null
  window.print = () => { const 판 = document.getElementById('kcm-그림인쇄'); const 그림 = 판 ? [...판.querySelectorAll('img.kcm-쪽그림')] : []; window.__인쇄 = { 그림: 그림.length, 판쪽: 판 ? 판.style.page : '?', 크기: [...new Set(그림.map((im) => im.style.width + '×' + im.style.height + '·' + im.style.page))], 다불림: 그림.every((im) => im.complete && im.naturalWidth > 500), 몸: document.body.classList.contains('kcm-그림인쇄중'), 판남음: !!document.getElementById('xv-인쇄'), 제목: document.title } }
})
const 인쇄기다림 = async (q) => { let 순간 = null; for (let i = 0; i < 1200 && !순간; i++) { await 쉬어(100); 순간 = await q.evaluate(() => window.__인쇄) } return 순간 }

const 공사 = '○○동 ○○시설 개보수공사'
const 견본글 = fs.readFileSync(견본, 'utf8').replace(/^﻿/, '')
const 줄들 = 견본글.split(/\r?\n/)
const 머리줄 = 줄들.filter((x) => x.startsWith('#'))
const 몸줄 = 줄들.filter((x) => x.trim() && !x.startsWith('#'))
const 치수 = (줄수) => { const 나 = [...머리줄, 몸줄[0]]; for (let i = 0; i < 줄수; i++) 나.push(몸줄[1 + (i % (몸줄.length - 1))]); return 나.join('\n') + '\n' }

/* ───────── PC ───────── */
{
  console.log('■ PC 1280 — 원클릭 공사서류')
  const ctx = await 새판('PC')
  const p = await ctx.newPage()
  const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
  await 원클릭열기(p)
  const 글들 = await p.$$eval('.xv-띠 button', (x) => x.map((y) => y.innerText))
  ok(`옛 «🖨 이 장 인쇄 · 35장 모두 인쇄» → «${글들.slice(0, 4).join(' · ')}»`, JSON.stringify(글들.slice(0, 4)) === JSON.stringify(['📄 이 장 PDF', '🖨 이 장 인쇄', '📄 35장 모두 PDF', '🖨 35장 모두 인쇄']), 글들)
  await 판엿보기(p)
  const R1 = await 받기(p, '35장 모두 PDF', '원클릭_모두.pdf')
  const A1 = PDF보기(R1.파일)
  const 먹1 = 먹들(R1.파일, path.join(폴더, '먹_원클릭'))
  ok(`① 📄 35장 모두 PDF → ${A1.쪽}쪽 · ${A1.쪽꼴} · A4 · PDF 1.4 · 글꼴 0 · 글자 0 · 그림 ${A1.그림수} · 쪽마다 내용(가장 적은 쪽 먹 ${Math.min(...먹1)}%) · ${A1.KB}KB · ${R1.걸림.toFixed(1)}초`,
    A1.머리.startsWith('%PDF-1.4') && A1.쪽 === 35 && A1.쪽꼴 === '세35' && A1.A4 && A1.글꼴 === 0 && A1.글자 === '' && A1.그림수 >= 35 && 먹1.length === 35 && 먹1.every((x) => x > 0), { ...A1, 먹1 })
  ok(`① 이름 «${R1.이름}» · 알림 «${R1.알림}» · 찍는 동안 단추 막음 + «${R1.동안.글.find((x) => /만드는 중/.test(x)) || '?'}» · 끝나면 판 걷힘 · 단추 다시 켜짐`,
    R1.이름 === `공사서류_${공사}.pdf` && /PDF 35쪽을 만들었습니다/.test(R1.알림) && R1.동안.막음.every(Boolean) && R1.동안.글.some((x) => /PDF 만드는 중… \d+\/35/.test(x)) && !R1.판남음 && !R1.막음끝, R1)
  const 옛1 = await 옛인쇄(p, '원클릭_모두_옛글자.pdf')
  ok(`① 옛 인쇄(글자 · window.print) ${옛1.장}장 → ${옛1.쪽}쪽 ${옛1.쪽꼴} = 그림 ${A1.쪽}쪽(서류 하나 = 한 장 그대로)`, 옛1.장 === 35 && 옛1.쪽 === A1.쪽 && 옛1.쪽꼴 === A1.쪽꼴, 옛1)
  /* ② 이 장 */
  await 판엿보기(p)
  const R2 = await 받기(p, '이 장 PDF', '원클릭_이장.pdf')
  const A2 = PDF보기(R2.파일)
  const 옛2 = await 옛인쇄(p, '원클릭_이장_옛글자.pdf')
  ok(`② 📄 이 장 PDF → ${A2.쪽}쪽 · 이름 «${R2.이름}» · 글자 0 · ${R2.걸림.toFixed(1)}초 (옛 인쇄 ${옛2.쪽}쪽)`, A2.쪽 === 1 && 옛2.쪽 === 1 && A2.글자 === '' && A2.글꼴 === 0 && R2.이름 === `공사서류_${공사}_사용인감계.pdf` && /PDF 1쪽을/.test(R2.알림), [A2, R2.이름])
  /* ② 글자 자리 · 테두리 — 새 그림(PDF)과 옛 인쇄를 같은 해상도로 그려 겹쳐 봄(글자 · 줄이 같은 자리면 차가 작음) */
  execFileSync('pdftoppm', ['-r', '60', '-gray', R2.파일, path.join(폴더, '겹새')])
  execFileSync('pdftoppm', ['-r', '60', '-gray', 옛2.파일, path.join(폴더, '겹옛')])
  const 읽기 = (머리) => { const f = fs.readdirSync(폴더).find((x) => x.startsWith(머리 + '-') && x.endsWith('.pgm')); const buf = fs.readFileSync(path.join(폴더, f)); fs.unlinkSync(path.join(폴더, f)); const 글 = buf.subarray(0, 40).toString('latin1').split(/\s+/); let i = 0, 줄 = 0; while (줄 < 3) { if (buf[i] === 10) 줄++; i++ } return { W: Number(글[1]), H: Number(글[2]), d: buf.subarray(i) } }
  const G1 = 읽기('겹새'), G2 = 읽기('겹옛')
  /* 새 그림의 먹 점이 옛 인쇄 먹 점 1px 둘레 안에 드는 비율(래스터 · 벡터 굵기 차이는 둘레로 너그럽게) — 제자리(0,0)가 가장 높아야(밀림 없음) */
  const 겹비 = (dx, dy) => {
    let 새 = 0, 안 = 0
    const 먹 = (G, x, y) => x >= 0 && y >= 0 && x < G.W && y < G.H && G.d[y * G.W + x] < 160
    for (let y = 0; y < G1.H; y++) for (let x = 0; x < G1.W; x++) {
      if (G1.d[y * G1.W + x] >= 160) continue
      새++
      let 있음 = false
      for (let j = -1; j <= 1 && !있음; j++) for (let i = -1; i <= 1 && !있음; i++) if (먹(G2, x + i + dx, y + j + dy)) 있음 = true
      if (있음) 안++
    }
    return Math.round((안 / Math.max(1, 새)) * 100)
  }
  const 겹 = 겹비(0, 0)
  const 밀린 = [[3, 0], [-3, 0], [0, 3], [0, -3]].map(([dx, dy]) => 겹비(dx, dy))
  /* 표 왼쪽 테두리 — 새 그림에서 «상 호» 칸 왼쪽 세로줄이 있는지(옛 인쇄와 같은 자리 · 아래로 이어진 검은 점) */
  const 세로줄 = (G) => { let 최대 = 0; for (let x = 0; x < G.W * 0.3; x++) { let 길 = 0, 긴 = 0; for (let y = Math.round(G.H * 0.08); y < G.H * 0.3; y++) { if (G.d[y * G.W + x] < 200) { 길++; if (길 > 긴) 긴 = 길 } else 길 = 0 } if (긴 > 최대) 최대 = 긴 } return 최대 }
  ok(`② 새 그림과 옛 인쇄가 같은 자리(새 먹 점 ${겹}% 가 옛 먹 1px 안 · 3px 밀면 ${밀린.join('/')}%) · 표 왼쪽 세로 테두리 새 ${세로줄(G1)}px · 옛 ${세로줄(G2)}px(칸줄 이웃 보기 — 바깥 테두리 안 사라짐)`, 겹 >= 75 && 밀린.every((x) => x < 겹) && 세로줄(G1) >= 세로줄(G2) * 0.8, { 겹, 밀린, 새: 세로줄(G1), 옛: 세로줄(G2) })
  /* ③ 모두 인쇄 */
  await 인쇄엿보기(p)
  await 단추(p, '35장 모두 인쇄').click()
  const 순간 = await 인쇄기다림(p)
  ok(`③ 🖨 35장 모두 인쇄 → 몸 밑엔 쪽 그림만 ${순간 ? 순간.그림 : '?'}장(${순간 ? 순간.크기.join(' / ') : ''}) · 다 불러옴 · 찍는 판은 걷힘 · 제목 «${순간 ? 순간.제목 : ''}»`,
    !!순간 && 순간.그림 === 35 && 순간.크기.length === 1 && 순간.크기[0] === '190mm×273mm·xv세로' && 순간.판쪽 === 'xv세로' && 순간.다불림 && 순간.몸 && !순간.판남음 && 순간.제목 === `공사서류_${공사}`, 순간)
  if (순간) {
    const 인쇄파일 = path.join(폴더, '원클릭_인쇄.pdf')
    fs.writeFileSync(인쇄파일, await p.pdf({ preferCSSPageSize: true, printBackground: true }))
    const B = PDF보기(인쇄파일)
    ok(`③ 인쇄 창 «PDF로 저장» → ${B.쪽}쪽 ${B.쪽꼴} · 글꼴 0 · 글자 0`, B.쪽 === 35 && B.쪽꼴 === '세35' && B.글꼴 === 0 && B.글자 === '', B)
    await p.evaluate(() => window.dispatchEvent(new Event('afterprint')))
    await 쉬어(300)
    ok('③ 인쇄 창을 닫으면 다 걷힘', await p.evaluate(() => !document.getElementById('kcm-그림인쇄') && !document.body.classList.contains('kcm-그림인쇄중')))
  }
  /* ⑦ Ctrl+P — 장(엑셀 화면)은 no-print · 글자로 안 나감 */
  {
    const 바로 = path.join(폴더, '원클릭_바로인쇄.pdf')
    fs.writeFileSync(바로, await p.pdf({ preferCSSPageSize: true }))
    const 글 = execFileSync('pdftotext', ['-layout', 바로, '-']).toString().replace(/\s+/g, '')
    ok('⑦ 단추 없이 Ctrl+P → 서류 장 글(«이 계약의 체결부터 하자담보책임기간이») 안 나감', !/이계약의체결부터하자담보책임기간이/.test(글), 글.slice(0, 200))
  }
  /* ⑧ 404 */
  {
    const q = await ctx.newPage()
    await q.route((u) => /html2canvas|그림인쇄\./.test(decodeURIComponent(u.toString())), (r) => r.fulfill({ status: 404, body: 'not found' }))
    await 원클릭열기(q)
    await 단추(q, '이 장 PDF').click()
    let 말8 = ''
    for (let i = 0; i < 80 && !/새로/.test(말8); i++) { await 쉬어(100); 말8 = await 말(q) }
    ok('⑧ 찍는 도구 파일이 없어진 때(404) → «새로고침(↻) 뒤 다시 · 쓴 것은 그대로» 알림 · 판 걷힘 · 단추 다시 켜짐', /사이트가 새로 바뀌었습니다 — 화면을 새로고침\(↻\)한 뒤 다시 눌러 주세요\(쓴 것은 그대로 남습니다\)/.test(말8) && !(await q.evaluate(() => !!document.getElementById('xv-인쇄'))) && !(await 단추(q, '이 장 PDF').isDisabled()), 말8)
    await q.close()
  }
  ok('PC 원클릭 넘침 0 · 오류 0', (await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 1 && 오류.length === 0, 오류)

  console.log('■ PC 1280 — 수량산출서(치수 48줄)')
  const s = await ctx.newPage()
  const 오류2 = []
  s.on('pageerror', (e) => 오류2.push(String(e).slice(0, 200)))
  await 산출열기(s, 치수(48))
  const 글2 = await s.$$eval('.xv-띠 button', (x) => x.map((y) => y.innerText))
  ok(`④ 단추 «${글2.slice(0, 4).join(' · ')}»`, JSON.stringify(글2.slice(0, 4)) === JSON.stringify(['📄 이 장 PDF', '🖨 이 장 인쇄', '📄 4장 모두 PDF', '🖨 4장 모두 인쇄']), 글2)
  await 판엿보기(s)
  const R4 = await 받기(s, '4장 모두 PDF', '산출_모두.pdf')
  const A4 = PDF보기(R4.파일)
  const 옛4 = await 옛인쇄(s, '산출_모두_옛글자.pdf')
  ok(`④ 📄 4장 모두 PDF → ${A4.쪽}쪽 ${A4.쪽꼴}(장마다 가로/세로) = 옛 인쇄 ${옛4.쪽}쪽 ${옛4.쪽꼴} · 글꼴 0 · 글자 0 · 이름 «${R4.이름}» · ${R4.걸림.toFixed(1)}초`,
    A4.쪽 === 옛4.쪽 && A4.쪽꼴 === 옛4.쪽꼴 && /가/.test(A4.쪽꼴) && /세/.test(A4.쪽꼴) && A4.A4 && A4.글꼴 === 0 && A4.글자 === '' && R4.이름 === '수량산출서.pdf', { A4, 옛4, 이름: R4.이름 })
  await 판엿보기(s)
  const R5 = await 받기(s, '이 장 PDF', '산출_이장.pdf')
  const A5 = PDF보기(R5.파일)
  const 옛5 = await 옛인쇄(s, '산출_이장_옛글자.pdf')
  const 띠1 = 위띠(R5.파일, 1), 띠2 = 위띠(R5.파일, A5.쪽)
  ok(`④ 📄 이 장 PDF(산출서) → ${A5.쪽}쪽 ${A5.쪽꼴} = 옛 ${옛5.쪽}쪽 · 이름 «${R5.이름}» · 마지막 쪽 위에도 머리줄(첫 쪽과 띠 차 ${띠차(띠1, 띠2).toFixed(1)})`,
    A5.쪽 === 옛5.쪽 && A5.쪽 >= 2 && /^가\d+$/.test(A5.쪽꼴) && R5.이름 === '수량산출서_산출서.pdf' && 띠차(띠1, 띠2) < 12, { A5, 옛5: 옛5.쪽, 이름: R5.이름 })
  await 인쇄엿보기(s)
  await 단추(s, '4장 모두 인쇄').click()
  const 순간4 = await 인쇄기다림(s)
  ok(`④ 🖨 4장 모두 인쇄 → 그림 ${순간4 ? 순간4.그림 : '?'}장(${순간4 ? 순간4.크기.join(' / ') : ''}) — 가로 장은 273 × 190 · xv가로 · 세로 장은 190 × 273 · xv세로`,
    !!순간4 && 순간4.그림 === A4.쪽 && 순간4.크기.includes('273mm×190mm·xv가로') && 순간4.크기.includes('190mm×273mm·xv세로') && 순간4.판쪽 === 'xv가로' && 순간4.다불림, 순간4)
  if (순간4) {
    const 인쇄파일 = path.join(폴더, '산출_인쇄.pdf')
    fs.writeFileSync(인쇄파일, await s.pdf({ preferCSSPageSize: true, printBackground: true }))
    const B = PDF보기(인쇄파일)
    ok(`④ 인쇄 창 «PDF로 저장» → ${B.쪽}쪽 ${B.쪽꼴}(= 📄 PDF) · 글자 0`, B.쪽 === A4.쪽 && B.쪽꼴 === A4.쪽꼴 && B.글자 === '', B)
    await s.evaluate(() => window.dispatchEvent(new Event('afterprint')))
    await 쉬어(300)
  }
  ok('PC 수량산출서 넘침 0 · 오류 0', (await s.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 1 && 오류2.length === 0, 오류2)

  if (긴판) {
    console.log('■ PC 1280 — 수량산출서 3000줄(긴 판 나눠 찍기)')
    const L = await ctx.newPage()
    const 오류3 = []
    L.on('pageerror', (e) => 오류3.push(String(e).slice(0, 200)))
    await 산출열기(L, 치수(3000))
    await L.evaluate(() => { window.__kcm찍기재기 = [] })
    await 판엿보기(L)
    const R6 = await 받기(L, '이 장 PDF', '산출3000_이장.pdf', 600000)
    const A6 = PDF보기(R6.파일)
    const 재기 = await L.evaluate(() => window.__kcm찍기재기)
    const 옛6 = await 옛인쇄(L, '산출3000_이장_옛글자.pdf')
    const 띠a = 위띠(R6.파일, 2), 띠b = 위띠(R6.파일, A6.쪽)
    ok(`⑤ 3000줄 산출서 📄 이 장 PDF → ${A6.쪽}쪽 ${A6.쪽꼴} = 옛 인쇄 ${옛6.쪽}쪽 · 덩이 ${재기.length}개(줄 솎음 ${Math.max(...재기.map((x) => x.버림))}줄 · 덩이마다 ${재기.map((x) => x.ms).join('/')}ms) · 글자 0 · ${R6.걸림.toFixed(1)}초`,
      A6.쪽 === 옛6.쪽 && A6.쪽 >= 60 && /^가\d+$/.test(A6.쪽꼴) && 재기.length > 1 && 재기.slice(1).every((x) => x.버림 > 0) && A6.글자 === '' && A6.글꼴 === 0 && R6.걸림 < 120, { A6: { 쪽: A6.쪽, 쪽꼴: A6.쪽꼴 }, 옛: 옛6.쪽, 재기 })
    ok(`⑤ 덩이를 넘어도 쪽마다 머리줄 그대로(2쪽 · 마지막 쪽 띠 차 ${띠차(띠a, 띠b).toFixed(1)}) · «만드는 중» 에 쪽 셈 «${R6.동안.글.find((x) => /만드는 중/.test(x)) || '?'}»`, 띠차(띠a, 띠b) < 12 && R6.동안.글.some((x) => /PDF 만드는 중…/.test(x)), [띠차(띠a, 띠b), R6.동안.글])
    ok('PC 3000줄 오류 0', 오류3.length === 0, 오류3)
    await L.close()
  }
  /* ⑨ 하도급 서류 예시 — 보기만(인쇄 · PDF 없음) · 🧪 G679 남(열쇠말 없음)의 원클릭 예시도 보기만 — 열쇠 없는 판에서 */
  {
    const ctx9 = await 새판('PC', false)
    const w = await ctx9.newPage()
    await 원클릭열기(w)
    const 글w = await w.$$eval('.xv-띠 button', (x) => x.map((y) => y.innerText))
    ok(`⑨ 남(열쇠말 없음)의 원클릭 예시 → 보기만(PDF · 인쇄 단추 0 · html.kcm-보기만) «${글w.join(' · ')}»`, 글w.every((x) => !/PDF|인쇄/.test(x)) && await w.evaluate(() => document.documentElement.classList.contains('kcm-보기만')), 글w)
    await w.close()
    const h = await ctx9.newPage()
    await h.goto(BASE + '/tools/hado-docs', { waitUntil: 'domcontentloaded' })
    await h.locator('button', { hasText: '예시 한 벌 보기' }).first().click()
    await h.waitForSelector('.xv-띠', { timeout: 60000 })
    await 쉬어(300)
    const 글9 = await h.$$eval('.xv-띠 button', (x) => x.map((y) => y.innerText))
    ok(`⑨ 하도급 계약서류 예시(보기만) → 인쇄 · PDF 단추 없음(«${글9.join(' · ')}»)`, 글9.length >= 1 && 글9.every((x) => !/PDF|인쇄/.test(x)), 글9)
    await h.close()
    await ctx9.close()
  }
  await ctx.close()
}

/* ───────── 폰(안드로이드) ───────── */
{
  console.log('■ 폰 390 — 원클릭 공사서류')
  const ctx = await 새판('폰')
  const p = await ctx.newPage()
  const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
  await 원클릭열기(p)
  const R = await 받기(p, '35장 모두 PDF', '원클릭_모두_폰.pdf')
  const A = PDF보기(R.파일)
  ok(`(폰) 📄 35장 모두 PDF → ${A.쪽}쪽 ${A.쪽꼴} · 글자 0 · 이름 «${R.이름}» · ${R.걸림.toFixed(1)}초`, A.쪽 === 35 && A.쪽꼴 === '세35' && A.글자 === '' && A.글꼴 === 0 && R.이름 === `공사서류_${공사}.pdf`, { ...A, 이름: R.이름 })
  /* 안드로이드 꼴 그림(190 × 273mm)은 사파리 쓸 칸(위 27 · 아래 32mm)에선 갈림 — 아이폰 맞춤이 필요한 까닭 */
  await 인쇄엿보기(p)
  await 단추(p, '35장 모두 인쇄').click()
  const 순간 = await 인쇄기다림(p)
  if (순간) {
    await p.addStyleTag({ content: '@page xv세로 { margin: 27mm 14mm 32mm !important; }' })
    const 파일 = path.join(폴더, '원클릭_인쇄_사파리흉내_안드로이드꼴.pdf')
    fs.writeFileSync(파일, await p.pdf({ preferCSSPageSize: true, printBackground: true }))
    const B = PDF보기(파일)
    ok(`(폰) 비교 — 안드로이드 꼴 그림 35장을 사파리 쓸 칸에 찍으면 ${B.쪽}쪽(그림이 갈림 · 아이폰 맞춤 없을 때)`, B.쪽 > 35, B.쪽)
    await p.evaluate(() => window.dispatchEvent(new Event('afterprint')))
    await 쉬어(300)
  }
  ok('(폰) 넘침 0 · 오류 0', (await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 1 && 오류.length === 0, 오류)
  await ctx.close()
}

/* ───────── 아이폰 흉내 ───────── */
{
  console.log('■ 아이폰 흉내(웹킷 인쇄 쓸 칸 — 위 27 · 아래 32 · 양옆 14mm)')
  const ctx = await 새판('아이폰')
  const p = await ctx.newPage()
  const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
  await 원클릭열기(p)
  await 인쇄엿보기(p)
  await 단추(p, '35장 모두 인쇄').click()
  const 순간 = await 인쇄기다림(p)
  const 크기 = 순간 ? 순간.크기 : []
  ok(`⑥ 아이폰 🖨 35장 모두 인쇄 → 그림 ${순간 ? 순간.그림 : '?'}장 · 아래 빈칸 자르고 쓸 칸에 맞춤(${크기.slice(0, 3).join(' / ')}${크기.length > 3 ? ' …' : ''})`, !!순간 && 순간.그림 === 35 && 크기.every((x) => /mm×auto·xv세로$/.test(x)), 순간)
  if (순간) {
    await p.addStyleTag({ content: '@page xv세로 { margin: 27mm 14mm 32mm !important; }' })
    const 파일 = path.join(폴더, '원클릭_인쇄_아이폰흉내.pdf')
    fs.writeFileSync(파일, await p.pdf({ preferCSSPageSize: true, printBackground: true }))
    const B = PDF보기(파일)
    const 먹 = 먹들(파일, path.join(폴더, '먹_아이폰'))
    ok(`⑥ 사파리 쓸 칸 흉내로 찍어도 ${B.쪽}쪽(서류 하나 = 한 장 · 그림 안 갈림 · 쪽마다 내용) · 글자 0`, B.쪽 === 35 && 먹.every((x) => x > 0) && B.글자 === '', { 쪽: B.쪽, 먹 })
    await p.evaluate(() => window.dispatchEvent(new Event('afterprint')))
    await 쉬어(300)
  }
  /* 가로 장(산출서) */
  const s = await ctx.newPage()
  await 산출열기(s, 치수(48))
  await 인쇄엿보기(s)
  await 단추(s, '이 장 인쇄').click()
  const 순간2 = await 인쇄기다림(s)
  if (순간2) {
    await s.addStyleTag({ content: '@page xv가로 { margin: 27mm 14mm 32mm !important; }' })
    const 파일 = path.join(폴더, '산출_인쇄_아이폰흉내.pdf')
    fs.writeFileSync(파일, await s.pdf({ preferCSSPageSize: true, printBackground: true }))
    const B = PDF보기(파일)
    ok(`⑥ 아이폰 가로 장(산출서) 🖨 → 그림 ${순간2.그림}장 → 쓸 칸 흉내에서 ${B.쪽}쪽 ${B.쪽꼴}(안 갈림)`, B.쪽 === 순간2.그림 && /^가\d+$/.test(B.쪽꼴), { B, 순간2 })
    await s.evaluate(() => window.dispatchEvent(new Event('afterprint')))
  }
  ok('⑥ 아이폰 흉내 오류 0', 오류.length === 0, 오류)
  await ctx.close()
}
await b.close()
console.log(`\n${n}개 중 틀림 ${bad}` + (틀림.length ? '\n  ' + 틀림.join('\n  ') : ''))
process.exit(bad ? 1 : 0)
