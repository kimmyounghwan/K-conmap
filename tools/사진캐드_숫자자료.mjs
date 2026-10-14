/**
 * 📷 사진캐드 숫자 읽기 — 학습 · 시험 자료 만들기 (G287 · 2026-10-14)
 *   node tools/사진캐드_숫자자료.mjs [나올폴더=/tmp/g10/ds]
 * 실제 쓰임과 똑같이: 글자를 12~64 픽셀로 그림 → 흐림 · 잡티 → 잉크 문턱으로 가름 → 가장 큰 덩이 → web/src/lib/사진캐드_숫자.js 의 숫자틀()
 *   0~9 : MNIST 손글씨(앞 85 % 학습 · 뒤 15 % 시험) · 이 컴퓨터 글꼴(약 40 가족 · 굵게 · 기울임 · 15 % 는 시험에만) · Hershey 한붓 글꼴(캐드 romans · simplex 꼴)
 *   10  : 다른 글자 — 한글 낱자 조각(ㅇ · ㅣ 처럼 숫자와 같은 꼴은 뺌) · 영문(O · I · l 같은 것 뺌) · 기호
 *   11  : 도형 — 네모 테두리 · 칠한 네모 · 원 · 엑스 · 세모(화살) · 짧은 막대 · 호
 * 나옴: 숫자자료_학습.bin / 숫자자료_시험.bin (한 개 = 이름표 1바이트 + 784바이트)
 */
import fs from 'fs'
import { execSync } from 'child_process'
import { createCanvas, GlobalFonts } from '../web/node_modules/@napi-rs/canvas/index.js'
import { 숫자틀, 틀방식바꾸기, 무게넣기, 무게풀기, 덩이가름 } from '../web/src/lib/사진캐드_숫자.js'
if (process.env.TLB) 틀방식바꾸기(process.env.TLB)
import { 덩이 } from '../web/src/lib/사진캐드_잉크.js'

const 나옴 = process.argv[2] || '/tmp/g10/ds'
let 씨 = 12345
const R = () => { 씨 |= 0; 씨 = (씨 + 0x6D2B79F5) | 0; let t = Math.imul(씨 ^ (씨 >>> 15), 1 | 씨); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
const 고르기 = (a) => a[Math.floor(R() * a.length)]

// ── 글꼴
const 줄들 = execSync("fc-list --format '%{file}|%{family[0]}|%{style[0]}\\n'").toString().split('\n').filter(Boolean)
const 가족 = new Map()
for (const 줄 of 줄들) {
  const [f, fam, st] = 줄.split('|')
  if (/emoji|unifont|symbol|math|opensymbol/i.test(fam)) continue
  if (!/\.(ttf|otf|ttc)$/i.test(f)) continue
  const 별 = `${fam}`.replace(/[^\w가-힣 ]/g, '')
  try { GlobalFonts.registerFromPath(f, 별) } catch (e) { continue }
  if (!가족.has(별)) 가족.set(별, new Set())
  가족.get(별).add(st)
}
try { GlobalFonts.registerFromPath('/tmp/g10/fm55/web/public/fonts/KCMGothic.ttf', 'KCMGothic'); 가족.set('KCMGothic', new Set(['Regular'])) } catch (e) { /* */ }
const 글꼴들 = [...가족.keys()].filter((f) => !/CJK (HK|JP|SC|TC)|Mono CJK|WenQuanYi|IPA|Loma|GFS/.test(f))
글꼴들.sort()
const 시험글꼴 = new Set(글꼴들.filter((_, i) => i % 7 === 3))
const 한글꼴 = ['Noto Sans CJK KR', 'Noto Serif CJK KR', 'KCMGothic', 'Noto Sans Mono CJK KR'].filter((f) => 가족.has(f))
console.log('글꼴', 글꼴들.length, '시험용', [...시험글꼴].join(', '))

const 허쉬 = JSON.parse(fs.readFileSync(`${나옴}/hershey.json`, 'utf8'))
const 허쉬이름 = Object.keys(허쉬)
const 허쉬시험 = new Set(['timesi', 'cyrillic'])

// ── 그린 판 → 실제처럼 가름 → 가장 큰 덩이 → 숫자틀
const 판 = 96
const cv = createCanvas(판, 판), g = cv.getContext('2d')
let 한덩이만 = true
function 판에서(돌림 = 0, 모두 = false) {
  const im = g.getImageData(0, 0, 판, 판).data
  const 밝 = new Float32Array(판 * 판)
  for (let i = 0; i < 밝.length; i++) 밝[i] = im[i * 4]
  // 흐림(0 ~ 2 번) + 잡티
  const 흐 = Math.floor(R() * 3)
  const t = new Float32Array(판 * 판)
  for (let k = 0; k < 흐; k++) {
    t.set(밝)   // 가장자리 줄은 그대로 두려고 먼저 베낌(안 그러면 0 이 남아 검은 막대가 생김)
    for (let y = 0; y < 판; y++) for (let x = 1; x < 판 - 1; x++) t[y * 판 + x] = 0.25 * 밝[y * 판 + x - 1] + 0.5 * 밝[y * 판 + x] + 0.25 * 밝[y * 판 + x + 1]
    for (let y = 1; y < 판 - 1; y++) for (let x = 0; x < 판; x++) 밝[y * 판 + x] = 0.25 * t[(y - 1) * 판 + x] + 0.5 * t[y * 판 + x] + 0.25 * t[(y + 1) * 판 + x]
  }
  const 문 = 255 * (0.35 + R() * 0.3)
  let m = new Uint8Array(판 * 판)
  for (let i = 0; i < m.length; i++) m[i] = 밝[i] + (R() - 0.5) * 30 < 문 ? 1 : 0
  // 굵기 흔들기(한 칸 늘이기 · 줄이기)
  const 굵흔 = R()
  if (굵흔 < 0.2 || 굵흔 > 0.85) {
    const 늘 = 굵흔 > 0.85, o = new Uint8Array(판 * 판)
    for (let y = 1; y < 판 - 1; y++) for (let x = 1; x < 판 - 1; x++) {
      const p = y * 판 + x
      const n4 = m[p - 1] + m[p + 1] + m[p - 판] + m[p + 판]
      o[p] = 늘 ? (m[p] || n4 > 0 ? 1 : 0) : (m[p] && n4 === 4 ? 1 : 0)
    }
    m = o
  }
  const { lab, 덩이들 } = 덩이(m, 판, 판)
  if (!덩이들.length) return null
  let k = 0, 전 = 0; for (let i = 0; i < 덩이들.length; i++) { 전 += 덩이들[i].n; if (덩이들[i].n > 덩이들[k].n) k = i }
  // 숫자는 «한 덩이» 로 온전히 그려진 것만(획이 끊겨 조각만 남은 것을 숫자라고 가르치면 안 됨)
  if (!모두 && 한덩이만 && 덩이들[k].n < 0.92 * 전) return null
  let b = 덩이들[k]
  let 고 = (i) => lab[i] === k
  if (모두) {   // 여러 덩이 글자(=, :, % …)는 다 합침
    let x0 = 판, y0 = 판, x1 = 0, y1 = 0
    for (const d of 덩이들) if (d.n > 2) { x0 = Math.min(x0, d.x0); y0 = Math.min(y0, d.y0); x1 = Math.max(x1, d.x1); y1 = Math.max(y1, d.y1) }
    b = { x0, y0, x1, y1 }; 고 = (i) => lab[i] >= 0
  }
  const bw = b.x1 - b.x0 + 1, bh = b.y1 - b.y0 + 1
  if (bw < 2 && bh < 2) return null
  const c = new Uint8Array(bw * bh)
  for (let y = b.y0; y <= b.y1; y++) for (let x = b.x0; x <= b.x1; x++) if (고(y * 판 + x)) c[(y - b.y0) * bw + (x - b.x0)] = 1
  마지막덩이 = { c, bw, bh }
  return 숫자틀(c, bw, bh, 돌림)
}
let 마지막덩이 = null
function 판비움() { g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#fff'; g.fillRect(0, 0, 판, 판); g.fillStyle = '#000'; g.strokeStyle = '#000' }
function 변형(크기) {
  const 돌 = (R() - 0.5) * 0.2, 기 = (R() - 0.5) * 0.35
  g.translate(판 / 2, 판 / 2); g.rotate(돌); g.transform(1, 0, 기, 1, 0, 0)
  return 크기
}

const 학습 = [], 시험 = []
const 넣기 = (곳, 이름표, x) => { if (x) 곳.push([이름표, x]) }

// ① MNIST
const 뿌리 = '/tmp/g10/ds/package/src/digits'
for (let k = 0; k < 10; k++) {
  const raw = JSON.parse(fs.readFileSync(`${뿌리}/${k}.json`, 'utf8')).data
  const n = (raw.length / 784) | 0, 끝 = Math.floor(n * 0.85)
  const 작 = createCanvas(28, 28), cg = 작.getContext('2d')
  for (let i = 0; i < n; i++) {
    const im = cg.createImageData(28, 28)
    for (let p = 0; p < 784; p++) { const v = 255 - Math.round(raw[i * 784 + p] * 255); im.data[p * 4] = v; im.data[p * 4 + 1] = v; im.data[p * 4 + 2] = v; im.data[p * 4 + 3] = 255 }
    cg.putImageData(im, 0, 0)
    const 번 = i < 끝 ? 6 : 1
    for (let r = 0; r < 번; r++) {
      판비움()
      const 높 = 14 + R() * 50
      g.save(); 변형(); g.drawImage(작, -높 / 2, -높 / 2, 높, 높); g.restore()
      넣기(i < 끝 ? 학습 : 시험, k, 판에서())
    }
  }
}
console.log('MNIST 뒤', 학습.length, 시험.length)

// ①-나 숫자 조각(→ 10 «숫자 아님») — 붙은 글자를 잘못 나누면 나오는 반쪽 · 1/3 쪽 · 두 글자에 걸친 가운데를 «숫자 아님» 으로 가르침
//   (반쪽이 숫자처럼 또렷한 것 — 8 의 오른쪽 = 3 같은 것 — 은 지금 무게로 0.95 넘게 숫자로 읽히면 뺌: 진짜 숫자를 헷갈리지 않게)
if (process.env.조각 !== '0') {
  const 지금무게 = (await import('../web/src/lib/사진캐드_숫자무게.js')).default
  무게넣기(무게풀기(지금무게))
  한덩이만 = false
  const 고른들 = []
  for (let k = 0; k < 10; k++) {
    const raw = JSON.parse(fs.readFileSync(`${뿌리}/${k}.json`, 'utf8')).data
    const n = (raw.length / 784) | 0
    for (let i = 0; i < n; i++) 고른들.push({ k, 학: i < Math.floor(n * 0.85), s: raw.slice(i * 784, (i + 1) * 784) })
  }
  const 작 = createCanvas(28, 28), cg = 작.getContext('2d')
  const 칠 = (s) => { const im = cg.createImageData(28, 28); for (let p = 0; p < 784; p++) { const v = 255 - Math.round(s[p] * 255); im.data[p * 4] = v; im.data[p * 4 + 1] = v; im.data[p * 4 + 2] = v; im.data[p * 4 + 3] = 255 } cg.putImageData(im, 0, 0) }
  const 폭 = (s) => { let x0 = 28, x1 = -1; for (let p = 0; p < 784; p++) if (s[p] > 0.3) { const x = p % 28; if (x < x0) x0 = x; if (x > x1) x1 = x } return x1 >= x0 ? [x0, x1 + 1] : [8, 20] }
  let 넣음 = 0, 뺌 = 0
  const 학들 = 고른들.filter((x) => x.학)
  for (const A of 고른들) {
    if (R() > 0.55) continue
    const 짝 = R() < 0.5
    const B = 짝 ? (A.학 ? 고르기(학들) : 고르기(고른들.filter((x) => !x.학 && x !== A))) : null
    판비움()
    const 높 = 16 + R() * 46, k = 높 / 28
    const [a0, a1] = 폭(A.s)
    let 전폭 = (a1 - a0) * k, bx = 0, b0 = 0
    if (B) { const [c0, c1] = 폭(B.s); b0 = c0; bx = 전폭 + 높 * (-0.08 + R() * 0.12); 전폭 = bx + (c1 - c0) * k }
    // 자를 자리: 한 글자면 왼쪽 · 오른쪽 · 가운데 조각(폭의 30 ~ 65 %) · 두 글자면 3 등분 가운데 하나(±8 %)
    let x0, x1
    if (!B) {
      const f = 0.3 + R() * 0.35, 쪽 = R()
      if (쪽 < 0.4) { x0 = 0; x1 = f * 전폭 } else if (쪽 < 0.8) { x0 = (1 - f) * 전폭; x1 = 전폭 } else { const m = (0.35 + R() * 0.3) * 전폭; x0 = m - f * 전폭 / 2; x1 = m + f * 전폭 / 2 }
    } else {
      const q = Math.floor(R() * 3), j = () => (R() - 0.5) * 0.16
      const 칸 = [0, 1 / 3 + j(), 2 / 3 + j(), 1]
      x0 = 칸[q] * 전폭; x1 = 칸[q + 1] * 전폭
    }
    g.save()
    g.translate(판 / 2 - 전폭 / 2, 판 / 2)
    g.beginPath(); g.rect(x0, -판, Math.max(1, x1 - x0), 판 * 2); g.clip()
    칠(A.s); g.drawImage(작, -a0 * k, -14 * k, 28 * k, 28 * k)
    if (B) { 칠(B.s); g.drawImage(작, bx - b0 * k, -14 * k + (R() - 0.5) * 높 * 0.08, 28 * k, 28 * k) }
    g.restore()
    const x = 판에서()
    if (!x || !마지막덩이) continue
    const p = 덩이가름(마지막덩이.c, 마지막덩이.bw, 마지막덩이.bh, 0)
    let 최 = 0; for (let d = 0; d < 10; d++) 최 = Math.max(최, p[d])
    if (최 > 0.95) { 뺌++; continue }
    넣기(A.학 ? 학습 : 시험, 10, x); 넣음++
  }
  한덩이만 = true
  console.log('숫자 조각', 넣음, '(숫자처럼 또렷해 뺌', 뺌, ')', 학습.length, 시험.length)
}

// ② 인쇄 숫자(글꼴)
for (const f of 글꼴들) {
  const 곳 = 시험글꼴.has(f) ? 시험 : 학습
  for (let k = 0; k < 10; k++) for (let r = 0; r < 14; r++) {
    판비움()
    const 높 = 12 + R() * 52
    const 꼴 = (R() < 0.3 ? 'italic ' : '') + (R() < 0.35 ? 'bold ' : '')
    g.save(); 변형()
    g.font = `${꼴}${높}px "${f}"`; g.textAlign = 'center'; g.textBaseline = 'middle'
    g.fillText(String(k), 0, 0)
    g.restore()
    넣기(곳, k, 판에서())
  }
}
console.log('글꼴 뒤', 학습.length, 시험.length)

// ③ Hershey 한붓
function 허쉬그리기(획, 높, 굵) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (const s of 획) for (const [x, y] of s) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y) }
  const s = 높 / Math.max(1, y1 - y0)
  g.lineWidth = 굵; g.lineCap = 'round'; g.lineJoin = 'round'
  g.beginPath()
  for (const sg of 획) { g.moveTo((sg[0][0] - (x0 + x1) / 2) * s, (sg[0][1] - (y0 + y1) / 2) * s); for (let i = 1; i < sg.length; i++) g.lineTo((sg[i][0] - (x0 + x1) / 2) * s, (sg[i][1] - (y0 + y1) / 2) * s) }
  g.stroke()
}
for (const 이 of 허쉬이름) {
  const 곳 = 허쉬시험.has(이) ? 시험 : 학습
  for (let k = 0; k < 10; k++) for (let r = 0; r < 40; r++) {
    판비움()
    const 높 = 12 + R() * 50
    g.save(); 변형(); 허쉬그리기(허쉬[이][String(k)], 높, Math.max(1, 높 * (0.05 + R() * 0.12))); g.restore()
    넣기(곳, k, 판에서())
  }
}
console.log('허쉬 뒤', 학습.length, 시험.length)

// ④ 다른 글자 (10)
한덩이만 = false
const 한글 = '거실침주방욕화장현관드레스룸계단창고기계전실발코니다용도사무소회의대기층평면도축척주차장출입구복도엘리베이터홀실외기공용부벽체기초슬래브보옹벽단면상세배근철근콘크리트거푸집토공터파기되메우기흙막이배수로관로맨홀집수정포장도로경사면옹벽'
const 영문 = 'ACEFHKMNPRTUVWXYacefhkmnprtuvwxy'
const 기호 = '+=@():%#&*~㎡㎥Ø'
// 숫자와 같은 꼴인 한글 조각을 거르려고: ㅇ · ㅣ · ㄹ · ㄱ 따로 그린 견본
const 견본 = []
for (const 자 of ['ㅇ', 'ㅣ', 'ㄹ', 'ㄱ', 'ㅡ', 'ㅁ']) for (const f of 한글꼴) {
  판비움(); g.font = `48px "${f}"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(자, 판 / 2, 판 / 2)
  const x = 판에서(); if (x) 견본.push(x)
}
const 닮음 = (a, b) => { let ab = 0, aa = 0, bb = 0; for (let i = 0; i < 784; i++) { ab += a[i] * b[i]; aa += a[i] * a[i]; bb += b[i] * b[i] } return ab / Math.sqrt(aa * bb + 1e-9) }
let 한글수 = 0
for (const 글 of 한글) for (const f of 한글꼴) for (let r = 0; r < 3; r++) {
  판비움()
  const 높 = 14 + R() * 50
  g.save(); 변형(); g.font = `${R() < 0.3 ? 'bold ' : ''}${높}px "${f}"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(글, 0, 0); g.restore()
  // 글자 하나의 «모든 덩이» 를 따로따로 (실제로 한글은 조각으로 나뉨)
  const im = g.getImageData(0, 0, 판, 판).data
  const m = new Uint8Array(판 * 판); for (let i = 0; i < m.length; i++) m[i] = im[i * 4] < 128 ? 1 : 0
  const { lab, 덩이들 } = 덩이(m, 판, 판)
  덩이들.forEach((b, id) => {
    if (b.n < 8) return
    const bw = b.x1 - b.x0 + 1, bh = b.y1 - b.y0 + 1
    const c = new Uint8Array(bw * bh)
    for (let y = b.y0; y <= b.y1; y++) for (let x = b.x0; x <= b.x1; x++) if (lab[y * 판 + x] === id) c[(y - b.y0) * bw + (x - b.x0)] = 1
    const x = 숫자틀(c, bw, bh, 0)
    if (견본.some((s) => 닮음(s, x) > 0.72)) return
    넣기(R() < 0.12 ? 시험 : 학습, 10, x); 한글수++
  })
}
for (const 글 of 영문 + 기호) for (const f of 글꼴들) for (let r = 0; r < 2; r++) {
  판비움()
  const 높 = 14 + R() * 50
  g.save(); 변형(); g.font = `${R() < 0.3 ? 'bold ' : ''}${높}px "${f}"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(글, 0, 0); g.restore()
  넣기(시험글꼴.has(f) ? 시험 : 학습, 10, 판에서(0, true))
}
for (const 이 of 허쉬이름) for (const 글 of 영문 + '+=@():%#&*') if (허쉬[이][글]) for (let r = 0; r < 3; r++) {
  판비움(); const 높 = 14 + R() * 50
  g.save(); 변형(); 허쉬그리기(허쉬[이][글], 높, Math.max(1, 높 * (0.05 + R() * 0.12))); g.restore()
  넣기(허쉬시험.has(이) ? 시험 : 학습, 10, 판에서(0, true))
}
console.log('다른 글자 뒤', 학습.length, 시험.length, '한글 조각', 한글수)

// ⑤ 도형 (11)
for (let r = 0; r < 6000; r++) {
  판비움()
  const 크 = 12 + R() * 60, 굵 = Math.max(1, 크 * (0.04 + R() * 0.12))
  g.save(); g.translate(판 / 2, 판 / 2); g.rotate((R() - 0.5) * (R() < 0.7 ? 0.1 : 3)); g.lineWidth = 굵
  const 꼴 = Math.floor(R() * 9)
  const a = 크 * (0.4 + R() * 0.6), b = 크 * (0.4 + R() * 0.6)
  if (꼴 === 0) g.strokeRect(-a / 2, -b / 2, a, b)
  else if (꼴 === 1) g.fillRect(-a / 2, -b / 2, a, b)
  else if (꼴 === 2) { g.beginPath(); g.ellipse(0, 0, a / 2, a / 2 * (0.9 + R() * 0.2), 0, 0, 7); g.stroke() }
  else if (꼴 === 3) { g.beginPath(); g.moveTo(-a / 2, -b / 2); g.lineTo(a / 2, b / 2); g.moveTo(a / 2, -b / 2); g.lineTo(-a / 2, b / 2); g.stroke() }
  else if (꼴 === 4) { g.beginPath(); g.moveTo(-a / 2, b / 3); g.lineTo(a / 2, 0); g.lineTo(-a / 2, -b / 3); g.closePath(); g.fill() }
  else if (꼴 === 5) { g.setTransform(1, 0, 0, 1, 판 / 2, 판 / 2); g.rotate((R() - 0.5) * 0.25); g.beginPath(); g.moveTo(-a / 2, 0); g.lineTo(a / 2, 0); g.stroke() }   // 막대는 가로만(세로 · 빗긴 막대는 손글씨 «1» 과 같아서 뺌)
  else if (꼴 === 6) { g.beginPath(); g.arc(0, 0, a / 2, 0, Math.PI * (0.3 + R() * 1.2)); g.stroke() }
  else if (꼴 === 7) { g.strokeRect(-a / 2, -b / 2, a, b); g.beginPath(); g.moveTo(-a / 2, -b / 2); g.lineTo(a / 2, b / 2); g.moveTo(a / 2, -b / 2); g.lineTo(-a / 2, b / 2); g.stroke() }
  else { g.beginPath(); g.arc(0, 0, a / 2, 0, 7); g.fill() }
  g.restore()
  넣기(r % 8 === 0 ? 시험 : 학습, 11, 판에서())
}
console.log('도형 뒤', 학습.length, 시험.length)

function 쓰기(곳, 길) {
  const buf = Buffer.alloc(곳.length * 785)
  곳.forEach(([y, x], i) => { buf[i * 785] = y; for (let p = 0; p < 784; p++) buf[i * 785 + 1 + p] = Math.round(Math.max(0, Math.min(1, x[p])) * 255) })
  fs.writeFileSync(길, buf)
}
쓰기(학습, `${나옴}/숫자자료_학습.bin`)
쓰기(시험, `${나옴}/숫자자료_시험.bin`)
const 셈 = (곳) => { const c = new Array(12).fill(0); for (const [y] of 곳) c[y]++; return c.join(' ') }
console.log('학습', 학습.length, '|', 셈(학습))
console.log('시험', 시험.length, '|', 셈(시험))
