/**
 * 🔎 G622 서식 종이 «글자 잘림» 시험 — 화면 종이(캔버스)에 그린 글 가운데 칸 밖으로 잘려 안 보이는 것을 찾습니다.
 *   node tools/시험_글자잘림.mjs [주소=http://127.0.0.1:4578] [slug ...]   (slug 를 안 주면 dalryeok-2027)
 *   11-09 사이트 점검: «2027 달력» 근무일 · 연휴기한 쪽 머리 밑 설명이 두 줄로 접혀 윗줄이 반쯤 잘렸음 — 다시 안 나게
 *   빈 종이 · «✍ 예시 채우기» 뒤 두 번 봄 · 쪽마다 끝까지 내려 그린 뒤 셈
 *   잘림 = 글자 높이의 20 % 넘게 위 · 아래가 칸 밖 / 옆으로 글자 높이의 30 % 넘게 칸 밖(옆 빈 칸으로 넘친 뒤에도)
 * 인터넷 안 부름(파이어베이스 · 광고 · 애널리틱스 막음).
 */
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const 인자 = process.argv.slice(2)
const BASE = 인자[0] && /^https?:/.test(인자[0]) ? 인자.shift() : 'http://127.0.0.1:4578'
const SLUGS = 인자.length ? 인자 : ['dalryeok-2027']

let bad = 0, n = 0
const ok = (이름, c, got) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (c || got === undefined ? '' : ' = ' + JSON.stringify(got).slice(0, 900))) }

/* 캔버스에 덫 — rect + clip 으로 잡은 칸 상자 안에 글이 다 들어가는지 fillText 마다 잼 */
function 덫() {
  const P = CanvasRenderingContext2D.prototype
  const oBegin = P.beginPath, oRect = P.rect, oClip = P.clip, oSave = P.save, oRestore = P.restore, oFill = P.fillText
  window.__잘림 = new Map()
  P.beginPath = function () { this.__r = null; return oBegin.call(this) }
  P.rect = function (x, y, w, h) { this.__r = [x, y, x + w, y + h]; return oRect.call(this, x, y, w, h) }
  P.clip = function (...a) { this.__c = this.__r; return oClip.apply(this, a) }
  P.save = function () { (this.__s || (this.__s = [])).push(this.__c || null); return oSave.call(this) }
  P.restore = function () { this.__c = this.__s && this.__s.length ? this.__s.pop() : null; return oRestore.call(this) }
  P.fillText = function (t, x, y, ...r) {
    const c = this.__c
    const 글 = String(t ?? '')
    if (c && 글.trim()) {
      const m = this.measureText(글)
      const L = x - m.actualBoundingBoxLeft, R = x + m.actualBoundingBoxRight
      const T = y - m.actualBoundingBoxAscent, B = y + m.actualBoundingBoxDescent
      const h = Math.max(1, B - T)
      const 위 = Math.max(0, c[1] - T), 아래 = Math.max(0, B - c[3])
      const 옆 = Math.max(0, c[0] - L) + Math.max(0, R - c[2])
      if ((위 + 아래) / h > 0.2 || 옆 > h * 0.3) {
        const cv = this.canvas
        const k = (cv && cv.dataset && cv.dataset.k) || '?'
        const key = k + '|' + 글
        if (!window.__잘림.has(key)) window.__잘림.set(key, { 쪽: k, 글: 글.slice(0, 50), 위: +(위 / h).toFixed(2), 아래: +(아래 / h).toFixed(2), 옆: +(옆 / h).toFixed(1) })
      }
    }
    return oFill.call(this, t, x, y, ...r)
  }
}

const b = await chromium.launch()
async function 새쪽() {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, locale: 'ko-KR', timezoneId: 'Asia/Seoul' })
  await ctx.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|googlesyndication|geojs|firebaseio|firebasedatabase/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await ctx.addInitScript(() => { try { localStorage.setItem('kcm_notice_seen', '2026-10-필독'); sessionStorage.setItem('kcm_notice_seen', '2026-10-업체'); sessionStorage.setItem('kcm_visit_s', '1') } catch (e) { /* 없음 */ } })
  await ctx.addInitScript(덫)
  const p = await ctx.newPage()
  const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e).slice(0, 200)))
  return { ctx, p, 오류 }
}

/* 쪽마다 끝까지 내려 다 그리게 한 뒤 잘림 모음 */
async function 다그려모음(p) {
  await p.evaluate(() => window.__잘림.clear())
  const 장 = await p.evaluate(() => document.querySelectorAll('canvas.gx-page').length)
  for (let i = 0; i < 장; i++) {
    await p.evaluate((i) => document.querySelectorAll('canvas.gx-page')[i].scrollIntoView({ block: 'center' }), i)
    await p.waitForTimeout(120)
  }
  await p.waitForTimeout(300)
  const 그린 = await p.evaluate(() => [...document.querySelectorAll('canvas.gx-page')].filter((c) => c.width > 1).length)
  const 잘림 = await p.evaluate(() => {
    const 시트 = (window.__격자 && window.__격자.doc && window.__격자.doc.sheets) || []
    return [...window.__잘림.values()].map((x) => { const [si, pi] = String(x.쪽).split('-').map(Number); return { 시트: (시트[si] || {}).name || x.쪽, 쪽: pi + 1, 글: x.글, 위: x.위, 아래: x.아래, 옆: x.옆 } })
  })
  return { 장, 그린, 잘림 }
}

for (const slug of SLUGS) {
  console.log(`\n■ ${slug}`)
  const s = await 새쪽()
  await s.p.goto(BASE + '/forms/' + slug, { waitUntil: 'domcontentloaded' })
  await s.p.waitForFunction(() => window.__격자 && document.querySelectorAll('canvas.gx-page').length, null, { timeout: 25000 })
  await s.p.waitForTimeout(500)
  const 빈 = await 다그려모음(s.p)
  ok(`${slug} 빈 종이 — 쪽 ${빈.장}장 다 그림`, 빈.그린 >= 1 && 빈.장 >= 1, 빈)
  ok(`${slug} 빈 종이 — 글자 잘림 0`, 빈.잘림.length === 0, 빈.잘림)
  const 예시 = s.p.getByRole('button', { name: /예시 채우기/ }).first()
  if (await 예시.count()) {
    await 예시.click()
    await s.p.waitForTimeout(600)
    const 찬 = await 다그려모음(s.p)
    ok(`${slug} 예시 채운 뒤 — 글자 잘림 0`, 찬.잘림.length === 0, 찬.잘림)
  }
  ok(`${slug} 화면 오류 0`, s.오류.length === 0, s.오류)
  await s.ctx.close()
}
await b.close()
console.log(`\n${bad ? '❌' : '✅'} 시험_글자잘림 ${n - bad}/${n}`)
process.exit(bad ? 1 : 0)
