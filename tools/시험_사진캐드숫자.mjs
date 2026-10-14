/**
 * 📷 사진캐드 숫자 읽기 시험 — 치수 숫자(낱말) 하나를 통째로 얼마나 맞게 읽나 (G287 · 2026-10-14)
 *   node tools/시험_사진캐드숫자.mjs [무게파일] [개수=300]
 * 학습에 안 쓴 것만: MNIST 뒤 15 % 손글씨 · 시험 글꼴(학습에서 뺀 7 개 중 1 꼴) · Hershey timesi · cyrillic
 * 가로 · 세로(반시계로 돌린 도면 치수 글) · 글자 높이 14 ~ 48 px · 흐림 · 잡티 · 잉크 문턱 → 덩이 → 낱말 → 읽기
 */
import fs from 'fs'
import { createCanvas } from '../web/node_modules/@napi-rs/canvas/index.js'
import { 무게넣기, 무게풀기, 낱말읽기, 틀방식바꾸기 } from '../web/src/lib/사진캐드_숫자.js'
import { 잉크뽑기 } from '../web/src/lib/사진캐드_잉크.js'
import { 글자가르기 } from '../web/src/lib/사진캐드_글자.js'
import { MNIST읽기, 난수 } from './사진캐드_시험그림.mjs'

const 무게길 = process.argv[2] || '../web/src/lib/사진캐드_숫자무게.js'
const N = +(process.argv[3] || 300)
if (process.env.TLB) 틀방식바꾸기(process.env.TLB)
const 무 = (await import(new URL(무게길, import.meta.url).href)).default
무게넣기(무게풀기(무))
const 숫자들 = MNIST읽기()
const 허쉬 = JSON.parse(fs.readFileSync('/tmp/g10/ds/hershey.json', 'utf8'))
const R = 난수(2026)
const 값들 = [300, 450, 600, 900, 1200, 1500, 1800, 2100, 2400, 2700, 3000, 3300, 3600, 3900, 4200, 4500, 4800, 5100, 5400, 6000, 7200, 8400, 9000, 10500, 12000, 13800, 15000, 25, 75, 150, 250, 350, 820, 1050, 2350, 3150, 4250, 6750]
const 판W = 520, 판H = 200

function 한번(꼴, 세로) {
  const 값 = 값들[Math.floor(R() * 값들.length)]
  const 글 = String(값)
  const cv = createCanvas(판W, 판H), g = cv.getContext('2d')
  g.fillStyle = '#fff'; g.fillRect(0, 0, 판W, 판H)
  const 높 = 14 + R() * 34
  g.save(); g.translate(판W / 2, 판H / 2)
  if (세로) g.rotate(-Math.PI / 2)
  g.rotate((R() - 0.5) * 0.04)
  if (꼴 === '손') {
    const 고른 = [...글].map((ch) => { const 들 = 숫자들[+ch]; return 들[Math.floor(R() * 들.length)] })
    const 폭들 = 고른.map((s) => { let x0 = 28, x1 = -1; for (let p = 0; p < 784; p++) if (s[p] > 0.3) { const x = p % 28; if (x < x0) x0 = x; if (x > x1) x1 = x } return x1 >= x0 ? [x0, x1] : [10, 17] })
    const k = 높 / 20, 사이 = 폭들.map(() => 높 * (-0.03 + R() * 0.25))
    let 전 = 0; 폭들.forEach(([a, b], i) => { 전 += (b - a + 1) * k + (i ? 사이[i] : 0) })
    let x = -전 / 2
    const 작 = createCanvas(28, 28), cg = 작.getContext('2d')
    for (let i = 0; i < 고른.length; i++) {
      const s = 고른[i], [a, b] = 폭들[i]
      if (i) x += 사이[i]
      const im = cg.createImageData(28, 28)
      for (let p = 0; p < 784; p++) { const v = 255 - Math.round(s[p] * 255); im.data[p * 4] = v; im.data[p * 4 + 1] = v; im.data[p * 4 + 2] = v; im.data[p * 4 + 3] = 255 }
      cg.putImageData(im, 0, 0)
      g.save(); g.globalCompositeOperation = 'multiply'
      g.translate(x - a * k + 14 * k, (R() - 0.5) * 높 * 0.08); g.rotate((R() - 0.5) * 0.1); g.drawImage(작, -14 * k, -14 * k, 28 * k, 28 * k)
      g.restore()
      x += (b - a + 1) * k
    }
  } else if (꼴 === '허쉬') {
    const 이 = R() < 0.5 ? 'timesi' : 'cyrillic'
    const 획들 = [...글].map((ch) => 허쉬[이][ch])
    let 전 = 0
    const 폭 = 획들.map((획) => { let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity; for (const s of 획) for (const [x, y] of s) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y) } return { x0, x1, y0, y1 } })
    const s = 높 / 21
    for (const f of 폭) 전 += (f.x1 - f.x0) * s + 높 * 0.2
    let x = -전 / 2
    g.lineWidth = Math.max(1, 높 * (0.06 + R() * 0.08)); g.lineCap = 'round'; g.strokeStyle = '#000'
    획들.forEach((획, i) => {
      const f = 폭[i]
      g.beginPath()
      for (const sg of 획) { g.moveTo(x + (sg[0][0] - f.x0) * s, (sg[0][1] + 2) * s); for (const [px, py] of sg.slice(1)) g.lineTo(x + (px - f.x0) * s, (py + 2) * s) }
      g.stroke()
      x += (f.x1 - f.x0) * s + 높 * 0.2
    })
  } else {
    const 글꼴 = ['DejaVu Sans Mono', 'Latin Modern Sans', 'TeX Gyre Heros', 'Noto Sans CJK KR', 'KCMGothic'][Math.floor(R() * 5)]
    g.font = `${R() < 0.3 ? 'bold ' : ''}${높}px "${글꼴}"`; g.fillStyle = '#000'; g.textAlign = 'center'; g.textBaseline = 'middle'
    g.fillText(R() < 0.5 ? 값.toLocaleString('en-US') : 글, 0, 0)
  }
  g.restore()
  // 흐림 · 잡티 → 잉크
  const im = g.getImageData(0, 0, 판W, 판H).data
  const d = new Float32Array(판W * 판H)
  for (let i = 0; i < d.length; i++) d[i] = im[i * 4] * 0.9 + 20 + (R() - 0.5) * 16
  const 잉 = 잉크뽑기({ w: 판W, h: 판H, d })
  const 글자 = 글자가르기(잉, Math.max(1.5, 높 * 0.12), { 글자최대: 높 * 4.5 })
  // 가장 큰 낱말
  let 고 = null
  for (const n of 글자.낱말들) if (!고 || n.들.length > 고.들.length) 고 = n
  if (!고) return { 값, 읽음: null, 후보: [] }
  const r = 낱말읽기(고, 글자.덩이들, 글자.lab, 판W)
  return { 값, 읽음: r.숫자임 ? r.값 : null, 후보: (r.후보 || []).map((c) => c.값), 믿음: r.믿음 || 0 }
}

const 결과 = {}
for (const 꼴 of ['손', '글꼴', '허쉬']) for (const 세로 of [false, true]) {
  let 맞 = 0, 후보안 = 0, 못 = 0
  const 틀린 = []
  for (let i = 0; i < N; i++) {
    const r = 한번(꼴, 세로)
    if (r.읽음 === r.값) 맞++
    else if (틀린.length < 6) 틀린.push(`${r.값}→${r.읽음}`)
    if (r.후보.includes(r.값)) 후보안++
    if (r.읽음 == null) 못++
  }
  const k = `${꼴}${세로 ? '·세로' : '·가로'}`
  결과[k] = { 맞: 맞 / N, 후보안: 후보안 / N, 못: 못 / N }
  console.log(k.padEnd(8), `통째로 맞음 ${(맞 / N * 100).toFixed(1)}% · 후보 안에 ${(후보안 / N * 100).toFixed(1)}% · 숫자 아님 ${(못 / N * 100).toFixed(1)}%`, '예:', 틀린.join(' '))
}
