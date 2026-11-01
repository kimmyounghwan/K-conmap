/**
 * 🧪 일용직 4대보험 판단기 — «안 뗍니다» 까닭 글이 실제와 맞는지(화면) · G506 (2026-11-02)
 *   소장님 카페 «건강,연금 취득여부» Case2(10.10~11.5 · 10월 16일 · 352만)에서 연금 까닭이 «달마다 8일 · 220만원 미만» 으로 틀리게 나옴
 *   (셈은 맞음 — 첫 달은 됐지만 다음 달이 모자라 빠진 것). 이 시험이 그런 어긋남을 잡습니다.
 *   화면 빌드를 얹은 뒤  B=http://127.0.0.1:4998 node tools/시험_판단기까닭.mjs
 *   ① 카페 사례 셋(취득 · 상실 · 보험료 달) ② 까닭 글 셋(첫 달만 됨 · 달마다 모자람 · 1개월 미만)
 *   ③ 아무 날 · 돈 24가지 — «달마다 8일 · 220만원 미만» 이라고 적힌 결과는 정말 모든 달이 8일 · 220만 미만이어야 함
 */
import { createRequire } from 'module'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
const require = createRequire(process.env.PW || '/tmp/g10/pw/package.json')
const { chromium } = require('playwright')
const 여기 = path.dirname(fileURLToPath(import.meta.url))
const { 링크만들기 } = await import(pathToFileURL(path.join(여기, '..', 'web', 'src', 'lib', 'ilyong4link.js')).href)
const B = process.env.B || 'http://127.0.0.1:4998'
let ok = 0, bad = 0
const 봐 = (c, m, 더 = '') => { if (c) ok++; else bad++; console.log((c ? '  ✓ ' : '  ✗ ') + m + (c ? '' : ' — ' + String(typeof 더 === 'string' ? 더 : JSON.stringify(더)).slice(0, 500))) }
const 날들 = (a, b) => { const out = []; let t = Date.parse(a + 'T12:00:00Z'); const e = Date.parse(b + 'T12:00:00Z'); while (t <= e) { out.push(new Date(t).toISOString().slice(0, 10)); t += 86400000 } return out }
const 평일 = (a, b) => 날들(a, b).filter((d) => { const w = new Date(d + 'T12:00:00Z').getUTCDay(); return w !== 0 && w !== 6 })

const br = await chromium.launch()
const 결과 = async (st) => {
  const p = await br.newPage({ viewport: { width: 390, height: 844 } })
  await p.addInitScript(() => { Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false }) })
  await p.route(/googletagmanager|google-analytics|pagead2|adsbygoogle|geojs|firebaseio/, (r) => r.fulfill({ status: 200, body: 'null' }))
  await p.goto(`${B}/tools/ilyong-boheom?c=${링크만들기(st)}`, { waitUntil: 'domcontentloaded' })
  await p.waitForFunction(() => /국민연금\s*(안 )?뗍니다/.test(document.body.innerText), null, { timeout: 15000 }).catch(() => {})
  const r = await p.evaluate(() => {
    const t = document.body.innerText.replace(/[ \t]+/g, ' ')
    const 칸 = (이름) => { const i = t.search(new RegExp(`${이름}\\s*\\n?\\s*(안 )?뗍니다`)); return i < 0 ? '' : t.slice(i, i + 220).split(/\n(?=건강 · 요양|고용보험)/)[0].replace(/\s+/g, ' ') }
    return { 연금: 칸('국민연금'), 건강: 칸('건강 · 요양') }
  })
  await p.close()
  return r
}

console.log('① 카페 사례(11-02 «건강,연금 취득여부»)')
const 매일 = 날들('2026-09-20', '2026-11-04')
let r = await 결과({ 일당: 220000, 시작: '2026-09', 달수: 3, 날: 매일, 달돈: { '2026-09': 2420000, '2026-10': 6820000, '2026-11': 2400000 } })
봐(/9\.20\. 취득 → 12\.1\. 상실 · 보험료 10월 · 11월분/.test(r.연금) && /9\.20\. 취득 → 11\.1\. 상실 · 보험료 10월분/.test(r.건강), 'Case1 11월 220만 넘음 — 연금 9.20 → 12.1(10 · 11월분) · 건강 9.20 → 11.1(10월분)', r)
r = await 결과({ 일당: 220000, 시작: '2026-09', 달수: 3, 날: 매일, 달돈: { '2026-09': 2420000, '2026-10': 6820000, '2026-11': 880000 } })
봐(/9\.20\. 취득 → 11\.1\. 상실 · 보험료 10월분/.test(r.연금) && /9\.20\. 취득 → 11\.1\. 상실 · 보험료 10월분/.test(r.건강), 'Case1 나머지 — 연금 · 건강 9.20 → 11.1(10월분)', r)
const c2 = ['2026-10-10', ...평일('2026-10-12', '2026-11-05')]
r = await 결과({ 일당: 220000, 시작: '2026-10', 달수: 2, 날: c2, 달돈: { '2026-10': 16 * 220000, '2026-11': 4 * 220000 } })
봐(/안 뗍니다/.test(r.연금) && /10월은 8일 · 220만원 이상이지만 다음 달\(11월\)이 8일 · 220만원 미만/.test(r.연금) && !/달마다 8일 · 220만원 미만/.test(r.연금), 'Case2 연금 — 안 뗌 · 까닭 «10월은 8일 · 220만 이상이지만 다음 달(11월)이 미만»(«달마다 … 미만» 아님)', r.연금)
봐(/안 뗍니다/.test(r.건강) && /첫 근로일 10\.10\. 부터 1개월 되는 날 11\.9\./.test(r.건강), 'Case2 건강 — 1개월 미만(10.10 → 11.9)', r.건강)

console.log('② 까닭 글')
r = await 결과({ 일당: 150000, 시작: '2026-09', 달수: 2, 날: [...날들('2026-09-07', '2026-09-11'), ...날들('2026-10-05', '2026-10-09')], 달돈: { '2026-09': 750000, '2026-10': 750000 } })
봐(/안 뗍니다/.test(r.연금) && /달마다 8일 · 220만원 미만입니다/.test(r.연금), '달마다 5일 · 75만 — «달마다 8일 · 220만원 미만»', r.연금)
r = await 결과({ 일당: 200000, 시작: '2026-09', 달수: 1, 날: 날들('2026-09-07', '2026-09-20'), 달돈: { '2026-09': 2800000 } })
봐(/안 뗍니다/.test(r.연금) && /1개월 미만입니다 — 국민연금은 근로 시작한 달 말일/.test(r.연금), '9.7~9.20 에 끝 — «1개월 미만(시작한 달 말일까지)»', r.연금)

console.log('③ 아무 날 · 돈 24가지 — «달마다 … 미만» 이면 정말 모든 달이 8일 · 220만 미만')
let 씨 = 7
const 난 = () => { 씨 = (씨 * 1103515245 + 12345) % 2147483648; return 씨 / 2147483648 }
const 틀림 = []
for (let k = 0; k < 24; k++) {
  const 시작일 = 1 + Math.floor(난() * 27)
  const 날 = [...날들(`2026-09-${String(시작일).padStart(2, '0')}`, '2026-10-31')].filter(() => 난() < 0.35)
  if (!날.length) continue
  const 일당 = [90000, 150000, 250000, 400000][Math.floor(난() * 4)]
  const 일 = (ym) => 날.filter((d) => d.startsWith(ym)).length
  const 달돈 = { '2026-09': 일('2026-09') * 일당, '2026-10': 일('2026-10') * 일당 }
  const x = await 결과({ 일당, 시작: '2026-09', 달수: 2, 날, 달돈 })
  if (/달마다 8일 · 220만원 미만입니다/.test(x.연금)) {
    const 된달 = ['2026-09', '2026-10'].filter((ym) => 일(ym) >= 8 || 달돈[ym] >= 2200000)
    if (된달.length) 틀림.push({ k, 날수: [일('2026-09'), 일('2026-10')], 돈: [달돈['2026-09'], 달돈['2026-10']], 글: x.연금.slice(0, 80) })
  }
}
봐(!틀림.length, '«달마다 8일 · 220만원 미만» 이라고 적은 결과 — 8일 · 220만 넘은 달이 하나도 없음', 틀림)

await br.close()
console.log(`\n${ok + bad}개 중 맞음 ${ok} · 틀림 ${bad}`)
if (bad) { console.log('✗ 틀린 것이 있음'); process.exit(1) } else console.log('✓ 모두 맞음')
