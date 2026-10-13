/**
 * 🧱 흙막이 · 가설 물량 — 흙막이 평면도 · 전개도 · 단면도(글자)에서 H-PILE · 중간말뚝 · 토류판 · 띠장 · 버팀보 · 사보강 · 보강재 · 건물 터파기 (G229 · 2026-10-10)
 *
 * 소장님: 「흙막이(가설) 도면은 토목 물량으로 잡히지 않습니다.----이게 왜 잡히지 않지?」 → 「원래 토목 및 건축 물량 다 하기로 한거잖아. 방법을 찾아」
 *         → 「1,2,3번만 하면 물량 뽑을 수 있어?」 · 「알겠어. 그렇게 해」 (① 부재 읽기 ② 강재 무게 ③ 건물 터파기 + 화면 숫자 · 엑셀 · 시험)
 *
 * ■ 읽기(도면 3D 일꾼이 놓은 묶음 그대로 — 좌표 mm)
 *   - 부재 = 층(레이어) 이름: 측면말뚝 · 엄지말뚝 · H-PILE / 중간말뚝 · POST PILE / 토류판 · 흙막이판 · TIMBER / 띠장 · WALE / 버팀보 · STRUT / 사보강 · 경사버팀 · CORNER / 보강재
 *   - 말뚝 개수 = 평면의 H 모양 무리 수(120 ~ 600 mm) — 평면이 여러 장(1단 · 2단 · 공법 평면)이면 같은 말뚝을 또 그린 것이라 «가장 많은 한 장»(겹치기)
 *   - 말뚝 길이 = 전개도의 말뚝 세로선 무리마다(위 ~ 끝) — 전개도 말뚝 수가 평면과 다르면 평균 길이 × 평면 개수
 *   - 띠장 · 버팀보 · 사보강 · 보강재 = 단(1단 · 2단) 평면마다 선 길이 ÷ 가닥(H 형강은 두세 줄로 그림 — 나란한 줄 수의 가운데값) · 단끼리 더함
 *   - 토류판 넓이 = 전개도의 원지반선 ~ 굴착선 사이 넓이(벽을 편 그림) · 없으면 둘레 × 굴착 깊이(글자 «G.L (-) a ~ b m» 가운데)
 *   - 건물 터파기 = 흙막이 안 넓이(토류판 줄로 둘러싼 곳) × 평균 깊이(토류판 넓이 ÷ 둘레)
 * ■ 규격 = 도면 글자(«측면말뚝(H298x201x9/14) C.T.C 1,800» · «띠장(H300x300x10/15)») — 부재 이름이 든 글자 · 가까운(2.5 m) 이름표로 · 가장 많이 나온 것
 * ■ 강재 무게 = KS 단위무게(H 형강: 넓이 = 2·B·tf + (H − 2tf)·tw + (4 − π)·r² · 7.85 t/㎥) × 길이 · 할증은 화면에서
 */

export const 흙부재 = ['측면말뚝', '중간말뚝', '토류판', '띠장', '버팀보', '사보강', '보강재']
export const 흙이름 = { 측면말뚝: '측면말뚝(H-PILE)', 중간말뚝: '중간말뚝(POST PILE)', 토류판: '토류판(흙막이판)', 띠장: '띠장(WALE)', 버팀보: '버팀보(STRUT)', 사보강: '사보강(경사 버팀)', 보강재: '보강재' }
const 층꼴 = [
  ['중간말뚝', /중간\s*(말뚝|파일)|post\s*-?\s*pile|포스트/i],      /* 🧭 G237 «POST-PILE»(붙임표) — 소장님 현장 F */
  ['사보강', /사\s*보강|경사\s*버팀|corner|코너\s*버팀/i],
  ['측면말뚝', /측면\s*말뚝|엄지\s*말뚝|side\s*pile|h\s*-?\s*pile|엄지|soldier/i],
  ['토류판', /토류판|흙막이\s*판|timber|lagging|토류/i],
  ['띠장', /띠장|wale/i],
  ['버팀보', /버팀|strut|^스트럿?\d*$/i],
  ['보강재', /보강재|stiff/i],
]
/** 층 이름 → 흙막이 부재(없으면 '') */
export function 흙층(ly) {
  const s = String(ly || '').split('$').pop()
  for (const [k, re] of 층꼴) if (re.test(s)) return k
  return ''
}
export const 흙막이도면 = /흙\s*막\s*이|h\s*-?\s*pile|토\s*류|가\s*설\s*흙/i

/* ── 강재 단위무게 ── */
/** «H-300x300x10/15» · «H 298x201x9/14» · «2H310x310x20/20» → { 규격, 겹, H, B, tw, tf, kg } */
export function 형강읽기(s) {
  const m = /(\d?)\s*H\s*-?\s*(\d{2,4})\s*[x×X*]\s*(\d{2,4})\s*[x×X*]\s*(\d{1,3}(?:\.\d)?)\s*[/x×X*]\s*(\d{1,3}(?:\.\d)?)/.exec(String(s || '').replace(/\s+/g, ' '))
  if (!m) return null
  const 겹 = +(m[1] || 1) || 1, H = +m[2], B = +m[3], tw = +m[4], tf = +m[5]
  if (!(H >= 100 && H <= 1200 && B >= 50 && B <= 600 && tw > 3 && tw < 60 && tf > 3 && tf < 80)) return null
  const r = H <= 200 ? 13 : H <= 250 ? 16 : H <= 300 ? 18 : H <= 350 ? 20 : H <= 450 ? 22 : 28
  const A = 2 * B * tf + (H - 2 * tf) * tw + (4 - Math.PI) * r * r      // mm²
  const kg = Math.round(A * 7.85e-3 * 10) / 10                          // kg/m (KS 와 ±1%)
  return { 규격: `${겹 > 1 ? 겹 : ''}H-${H}x${B}x${tw}/${tf}`, 겹, H, B, tw, tf, kg: kg * 겹 }
}

/* ── 선 · 무리 ── */
function 선모으기(out, 골라) {
  const by = {}
  for (const [name, b] of out) {
    const c = name.indexOf('\u0001')
    const 키 = c >= 0 ? name.slice(0, c) : '', ly = c >= 0 ? name.slice(c + 1) : name
    const k = 흙층(ly)
    if (!k || (골라 && !골라(키, ly))) continue
    const a = b.pos.a, arr = by[k] || (by[k] = [])
    for (let i = 0; i < b.pos.n; i += 6) {
      if (Math.abs(a[i + 2] - a[i + 5]) > 50) continue
      const L = Math.hypot(a[i + 3] - a[i], a[i + 4] - a[i + 1])
      if (L < 5) continue
      arr.push([a[i], a[i + 1], a[i + 3], a[i + 4]])
    }
  }
  return by
}
/** 끝점이 가까운(150 mm) 선끼리 무리 */
function 무리(segs, tol = 150) {
  const n = segs.length, par = new Int32Array(n).map((_, i) => i)
  const f = (a) => { while (par[a] !== a) { par[a] = par[par[a]]; a = par[a] } return a }
  const g = new Map()
  segs.forEach((s, i) => { for (const [x, y] of [[s[0], s[1]], [s[2], s[3]]]) { const k = Math.round(x / tol) + ',' + Math.round(y / tol); const v = g.get(k); if (v) v.push(i); else g.set(k, [i]) } })
  for (const [k, v] of g) {
    const [cx, cy] = k.split(',').map(Number)
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
      const w = g.get((cx + dx) + ',' + (cy + dy)); if (!w) continue
      for (const j of w) for (const i of v) { const a = f(i), b = f(j); if (a !== b) par[a] = b }
    }
  }
  const m = new Map()
  segs.forEach((s, i) => { const r = f(i); const v = m.get(r); if (v) v.push(s); else m.set(r, [s]) })
  return [...m.values()]
}
const 상자 = (segs) => { let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; for (const s of segs) { x0 = Math.min(x0, s[0], s[2]); x1 = Math.max(x1, s[0], s[2]); y0 = Math.min(y0, s[1], s[3]); y1 = Math.max(y1, s[1], s[3]) } return [x0, y0, x1, y1] }
/** H 모양 말뚝 가운데들 — 무리 상자 120 ~ 600 mm · 꼴 = 가장 긴 선 방향으로 돌린 네모(3D · 꼭짓점 넷) */
function 말뚝들(segs) {
  const out = []
  for (const c of 무리(segs)) {
    const [x0, y0, x1, y1] = 상자(c)
    const w = x1 - x0, h = y1 - y0
    if (!(w >= 120 && w <= 850 && h >= 120 && h <= 850)) continue
    let L = null
    for (const t of c) { const l = Math.hypot(t[2] - t[0], t[3] - t[1]); if (!L || l > L.l) L = { l, ux: (t[2] - t[0]) / l, uy: (t[3] - t[1]) / l } }
    let a0 = Infinity, a1 = -Infinity, b0 = Infinity, b1 = -Infinity
    for (const t of c) for (const [x, y] of [[t[0], t[1]], [t[2], t[3]]]) { const a = x * L.ux + y * L.uy, b = -x * L.uy + y * L.ux; a0 = Math.min(a0, a); a1 = Math.max(a1, a); b0 = Math.min(b0, b); b1 = Math.max(b1, b) }
    if (a1 - a0 > 600 || b1 - b0 > 600) continue                      // 돌려 재도 600 mm 넘으면 말뚝 아님(사선 벽의 말뚝은 상자가 커 보임)
    const 점 = (a, b) => [a * L.ux - b * L.uy, a * L.uy + b * L.ux]
    const 꼴 = [점(a0, b0), 점(a1, b0), 점(a1, b1), 점(a0, b1)]
    out.push({ c: [(꼴[0][0] + 꼴[2][0]) / 2, (꼴[0][1] + 꼴[2][1]) / 2], 꼴 })
  }
  return out
}
/** 같은 말뚝을 그린 두 평면의 옮김 — 말뚝 가운데 차이 투표(100 mm) · 맞는 말뚝 3개 넘고 30% 넘으면 [dx, dy] · 아니면 null */
export function 말뚝맞춤(기준, 이) {
  if (!기준.length || !이.length) return null
  const 표 = new Map()
  const A = 기준.length > 300 ? 기준.filter((_, i) => i % Math.ceil(기준.length / 300) === 0) : 기준
  for (const p of A) for (const q of 이) { const k = Math.round((p[0] - q[0]) / 100) + ',' + Math.round((p[1] - q[1]) / 100); 표.set(k, (표.get(k) || 0) + 1) }
  let 좋 = null
  for (const [k, n] of 표) if (!좋 || n > 좋.n) 좋 = { k, n }
  if (!좋 || 좋.n < Math.max(3, 0.3 * Math.min(A.length, 이.length))) return null
  const [i, j] = 좋.k.split(',').map(Number)
  // 다듬기 — 그 칸 둘레 차이 평균
  let sx = 0, sy = 0, n = 0
  for (const p of A) for (const q of 이) { const dx = p[0] - q[0], dy = p[1] - q[1]; if (Math.abs(dx - i * 100) <= 100 && Math.abs(dy - j * 100) <= 100) { sx += dx; sy += dy; n++ } }
  return n ? [sx / n, sy / n] : [i * 100, j * 100]
}
/** 나란한 겹선 묶음 → 가운데 줄 [{a, b, 폭}] — 두세 줄로 그린 H 형강 · 판(450 mm 안 · 겹침 30%) · 혼자인 줄은 폭 0 */
export function 가운데줄들(segs0, { 최대폭 = 450, 최소 = 300 } = {}) {
  const segs = 선합치기(segs0).filter((s) => Math.hypot(s[2] - s[0], s[3] - s[1]) >= 최소)
  const n = segs.length, par = new Int32Array(n).map((_, i) => i)
  const f = (a) => { while (par[a] !== a) { par[a] = par[par[a]]; a = par[a] } return a }
  const 방 = segs.map((s) => { const l = Math.hypot(s[2] - s[0], s[3] - s[1]); return { l, ux: (s[2] - s[0]) / l, uy: (s[3] - s[1]) / l } })
  for (let i = 0; i < n; i++) {
    const s = segs[i], d = 방[i]
    for (let j = i + 1; j < n; j++) {
      const t = segs[j], e = 방[j]
      if (Math.abs(d.ux * e.uy - d.uy * e.ux) > 0.035) continue
      const 거 = Math.abs((t[0] - s[0]) * -d.uy + (t[1] - s[1]) * d.ux)
      if (거 > 최대폭) continue
      const a0 = (t[0] - s[0]) * d.ux + (t[1] - s[1]) * d.uy, a1 = (t[2] - s[0]) * d.ux + (t[3] - s[1]) * d.uy
      const 겹 = Math.min(d.l, Math.max(a0, a1)) - Math.max(0, Math.min(a0, a1))
      if (겹 < 0.3 * Math.min(d.l, e.l)) continue
      const a = f(i), b = f(j); if (a !== b) par[a] = b
    }
  }
  const 묶 = new Map()
  for (let i = 0; i < n; i++) { const r = f(i); const v = 묶.get(r); if (v) v.push(i); else 묶.set(r, [i]) }
  const out = []
  for (const ids of 묶.values()) {
    let 긴 = ids[0]
    for (const i of ids) if (방[i].l > 방[긴].l) 긴 = i
    const { ux, uy } = 방[긴], s0 = segs[긴]
    let a0 = Infinity, a1 = -Infinity, o0 = Infinity, o1 = -Infinity
    for (const i of ids) { const s = segs[i]; for (const [x, y] of [[s[0], s[1]], [s[2], s[3]]]) { const a = (x - s0[0]) * ux + (y - s0[1]) * uy, o = (x - s0[0]) * -uy + (y - s0[1]) * ux; a0 = Math.min(a0, a); a1 = Math.max(a1, a); o0 = Math.min(o0, o); o1 = Math.max(o1, o) } }
    const om = (o0 + o1) / 2
    const 점 = (a) => [s0[0] + a * ux - om * uy, s0[1] + a * uy + om * ux]
    out.push({ a: 점(a0), b: 점(a1), 폭: ids.length > 1 ? o1 - o0 : 0 })
  }
  return out
}
/** 겹친 선 하나로 — 같은 방향(0.5°) · 같은 줄(20 mm) 위 선은 구간을 합침(같은 선을 두 번 그린 도면 · 끊어 그린 선) */
export function 선합치기(segs) {
  const 칸 = new Map()
  for (const s of segs) {
    let dx = s[2] - s[0], dy = s[3] - s[1]
    const l = Math.hypot(dx, dy)
    if (l < 1) continue
    if (dx < 0 || (dx === 0 && dy < 0)) { dx = -dx; dy = -dy }
    const ux = dx / l, uy = dy / l
    const 각 = Math.round(Math.atan2(uy, ux) * 360 / Math.PI)           // 0.5°
    const off = Math.round((-uy * s[0] + ux * s[1]) / 20)              // 20 mm
    const k = 각 + '|' + off
    const a0 = ux * s[0] + uy * s[1], a1 = ux * s[2] + uy * s[3]
    const v = 칸.get(k) || { ux, uy, off: -uy * s[0] + ux * s[1], 구: [] }
    v.구.push([Math.min(a0, a1), Math.max(a0, a1)])
    칸.set(k, v)
  }
  const out = []
  for (const v of 칸.values()) {
    v.구.sort((p, q) => p[0] - q[0])
    let [a, b] = v.구[0]
    const 내 = () => out.push([v.ux * a - v.uy * v.off, v.uy * a + v.ux * v.off, v.ux * b - v.uy * v.off, v.uy * b + v.ux * v.off])
    for (let i = 1; i < v.구.length; i++) { const [c, d] = v.구[i]; if (c <= b + 30) b = Math.max(b, d); else { 내(); a = c; b = d } }
    내()
  }
  return out
}
/** 선 길이 ÷ 가닥(나란한 줄 수 가운데값 · 1 ~ 4) — 부재 «가운데 줄» 길이(mm) · 겹친 선은 먼저 하나로 */
function 가운데길이(segs0) {
  const segs = 선합치기(segs0)
  const 긴 = segs.filter((s) => Math.hypot(s[2] - s[0], s[3] - s[1]) >= 1000)
  let L = 0
  for (const s of segs) L += Math.hypot(s[2] - s[0], s[3] - s[1])
  if (!긴.length) return { 길이: L, 가닥: 1, 두께: 0 }
  const 표본 = 긴.length > 400 ? 긴.filter((_, i) => i % Math.ceil(긴.length / 400) === 0) : 긴
  const ks = [], ds = []
  for (const s of 표본) {
    const dx = s[2] - s[0], dy = s[3] - s[1], l = Math.hypot(dx, dy), ux = dx / l, uy = dy / l
    let k = 1, dm = Infinity
    for (const t of 긴) {
      if (t === s) continue
      const ex = t[2] - t[0], ey = t[3] - t[1], m = Math.hypot(ex, ey)
      if (Math.abs(ux * ey - uy * ex) / m > 0.035) continue                 // 2° 안 나란함
      const d = Math.abs((t[0] - s[0]) * -uy + (t[1] - s[1]) * ux)          // 법선 거리
      if (d < 3 || d > 450) continue                                      // 판 두께로 두 줄씩 그린 것(15 mm)도 가닥
      const a0 = (t[0] - s[0]) * ux + (t[1] - s[1]) * uy, a1 = (t[2] - s[0]) * ux + (t[3] - s[1]) * uy
      const 겹 = Math.min(l, Math.max(a0, a1)) - Math.max(0, Math.min(a0, a1))
      if (겹 >= 0.5 * Math.min(l, m)) { k++; if (d < dm) dm = d }
    }
    ks.push(Math.min(4, k))
    if (dm < Infinity) ds.push(dm)
  }
  ks.sort((a, b) => a - b)
  const 가닥 = ks[ks.length >> 1] || 1
  ds.sort((a, b) => a - b)
  return { 길이: L / 가닥, 가닥, 두께: 가닥 > 1 && ds.length ? ds[ds.length >> 1] : 0 }      // 두께 = 가장 가까운 나란한 줄 거리(가운데값 · mm)
}

/* ── 전개도 — 말뚝 길이 · 원지반 ~ 굴착 넓이 ── */
function 전개읽기(out) {
  const 말 = [], 원 = [], 굴 = []
  for (const [name, b] of out) {
    const ly = name.slice(name.indexOf('\u0001') + 1)
    const k = 흙층(ly)
    const 원지반 = /원\s*지반|지반선|g\.?\s*l\b|ground/i.test(ly), 굴착 = /굴착\s*선|굴착|excav/i.test(ly)
    if (k !== '측면말뚝' && !원지반 && !굴착) continue
    const a = b.pos.a
    for (let i = 0; i < b.pos.n; i += 6) {
      const s = [a[i], a[i + 1], a[i + 3], a[i + 4]]
      if (k === '측면말뚝') { if (Math.abs(s[0] - s[2]) < 5 && Math.abs(s[3] - s[1]) > 200) 말.push(s) }
      else if (원지반) 원.push(s)
      else 굴.push(s)
    }
  }
  // 말뚝 = 세로선 x 무리(400 mm) — 위 ~ 끝
  const xs = 말.map((s) => [s[0], Math.min(s[1], s[3]), Math.max(s[1], s[3])]).sort((p, q) => p[0] - q[0])
  const 무 = []
  for (const v of xs) { const g = 무[무.length - 1]; if (g && v[0] - g.x1 <= 400) { g.x1 = v[0]; g.y0 = Math.min(g.y0, v[1]); g.y1 = Math.max(g.y1, v[2]) } else 무.push({ x0: v[0], x1: v[0], y0: v[1], y1: v[2] }) }
  const 길이들 = 무.map((g) => g.y1 - g.y0).filter((L) => L >= 1500 && L <= 60000)
  // 원지반 ~ 굴착 — x 100 mm 마다
  let 넓이 = 0, 폭 = 0
  if (원.length && 굴.length) {
    const 높이에 = (segs, x, 위) => { let best = null; for (const s of segs) { const a = Math.min(s[0], s[2]), b = Math.max(s[0], s[2]); if (x < a || x > b || b - a < 1) continue; const y = s[1] + (s[3] - s[1]) * (x - s[0]) / (s[2] - s[0] || 1); if (best === null || (위 ? y > best : y < best)) best = y } return best }
    const [x0, , x1] = 상자([...원, ...굴])
    for (let x = x0 + 50; x < x1; x += 100) {
      const t = 높이에(원, x, true), d = 높이에(굴, x, false)
      if (t === null || d === null || t - d < 200 || t - d > 40000) continue
      넓이 += (t - d) * 100; 폭 += 100
    }
  }
  return { 길이들, 넓이, 폭 }
}

/* ── 단면도 — 축척대로 그린 그림: E.L 글자를 그 높이 선에 맞춰 «도면 y → 표고» · 띠장 · 버팀보 단 높이 · 굴착 바닥 · 원지반 · 말뚝 위 · 끝 ── */
const EL꼴 = /E\.?\s*L\.?\s*[=:]?\s*\(?\s*([+-]?\d{1,3}\.\d{1,3})/i
/**
 * @param out 묶음 선(Map 이름 → 버킷 · mm) — 일꾼이 박스를 만든 그때(자리 옮기기 전 · 글자와 같은 좌표)
 * @param 글자 [{x, y, s}] (mm)
 * @returns {null | { 단: [{EL, 길이}], 바닥: [EL], 지반: [작, 큰], 말뚝: {위, 끝, 길이들}, 중간: {위, 끝, 길이들}, 근거 }}  (EL = m)
 */
export function 흙단면읽기(out, 글자) {
  const 선 = []
  for (const [name, b] of out) {
    const ly = name.slice(name.indexOf('\u0001') + 1)
    let k = 흙층(ly)
    if (/원\s*지반|지반\s*선/i.test(ly)) k = '원지반'
    else if (/굴착/i.test(ly)) k = '굴착'
    const a = b.pos.a
    for (let i = 0; i < b.pos.n; i += 6) 선.push([a[i], a[i + 1], a[i + 3], a[i + 4], k])
  }
  if (!선.some((s) => s[4] === '측면말뚝' || s[4] === '띠장' || s[4] === '버팀보')) return null
  const 글 = []
  for (const t of 글자 || []) { const m = EL꼴.exec(String(t.s || '')); if (m) 글.push({ v: +m[1], x: t.x, y: t.y }) }
  if (글.length < 2) return null
  /* 글자 바로 아래(−0.2 ~ 1 m)를 지나는 거의 가로 선 → «선 y − 표고» 후보 · 서로 다른 표고 글자 둘 넘게 같은 값(±40 mm)이면 그 값 */
  const 후보 = []
  for (const [gi, t] of 글.entries()) {
    for (const q of 선) {
      const a = Math.min(q[0], q[2]), b = Math.max(q[0], q[2])
      if (b - a < 300 || t.x < a - 1500 || t.x > b + 1500 || Math.abs(q[3] - q[1]) > 0.15 * (b - a)) continue
      const xx = Math.max(a, Math.min(b, t.x)), y = q[1] + (q[3] - q[1]) * (xx - q[0]) / ((q[2] - q[0]) || 1)
      const d = t.y - y
      if (d < -200 || d > 1000) continue
      후보.push({ off: y - t.v * 1000, gi, v: t.v })
    }
  }
  let 좋 = null
  for (const c of 후보) {
    const 같 = 후보.filter((o) => Math.abs(o.off - c.off) <= 40)
    const 값 = new Set(같.map((o) => o.v)), 글수 = new Set(같.map((o) => o.gi)).size
    if (값.size >= 2 && (!좋 || 글수 > 좋.n || (글수 === 좋.n && 같.length > 좋.m))) 좋 = { n: 글수, m: 같.length, off: 같.reduce((s0, o) => s0 + o.off, 0) / 같.length }
  }
  if (!좋) return null
  const off = 좋.off, EL = (y) => Math.round((y - off) / 10) / 100
  /* 흙막이 벽(측면말뚝 세로선 3 m 넘게) 사이 · 위아래 안만 — 같은 박스의 키 플랜 · 상세 그림은 뺌 */
  const 벽 = 선.filter((q) => q[4] === '측면말뚝' && Math.abs(q[2] - q[0]) < 0.02 * Math.abs(q[3] - q[1]) && Math.abs(q[3] - q[1]) >= 3000)
  const 틀 = 벽.length ? [Math.min(...벽.map((q) => q[0])) - 600, Math.min(...벽.map((q) => Math.min(q[1], q[3]))) - 1000, Math.max(...벽.map((q) => q[0])) + 600, Math.max(...벽.map((q) => Math.max(q[1], q[3]))) + 1000] : null
  const 안 = (q) => !틀 || ((q[0] + q[2]) / 2 >= 틀[0] && (q[0] + q[2]) / 2 <= 틀[2] && (q[1] + q[3]) / 2 >= 틀[1] && (q[1] + q[3]) / 2 <= 틀[3])
  /* 띠장 · 버팀보 가로 선 → y 무리(450 mm 안 이음) · 길이 1.5 m 넘거나 띠장 조각 4개 넘으면 한 단 */
  const 가로 = 선.filter((q) => (q[4] === '띠장' || q[4] === '버팀보') && 안(q) && Math.abs(q[3] - q[1]) < 0.05 * Math.abs(q[2] - q[0]) && Math.abs(q[2] - q[0]) >= (q[4] === '띠장' ? 200 : 800))
    .map((q) => ({ y: (q[1] + q[3]) / 2, L: Math.abs(q[2] - q[0]), k: q[4] })).sort((p, q) => p.y - q.y)
  const 무 = []
  for (const h of 가로) { const g = 무[무.length - 1]; if (g && h.y - g.y1 <= 450) { g.y1 = h.y; g.L += h.L; g.n++ } else 무.push({ y0: h.y, y1: h.y, L: h.L, n: 1 }) }
  const 단 = 무.filter((g) => g.L >= 1500 || g.n >= 4).map((g) => ({ EL: EL((g.y0 + g.y1) / 2), 길이: g.L / 1000 })).sort((p, q) => q.EL - p.EL)
  const 바닥 = [...new Set(선.filter((q) => q[4] === '굴착' && 안(q) && Math.abs(q[3] - q[1]) < 0.05 * Math.abs(q[2] - q[0]) && Math.abs(q[2] - q[0]) >= 500).map((q) => EL((q[1] + q[3]) / 2)))].sort((p, q) => p - q)
  const 지 = 선.filter((q) => q[4] === '원지반' && 안(q)).flatMap((q) => [q[1], q[3]])
  const 세로 = (k) => {
    const v = 선.filter((q) => q[4] === k && 안(q) && Math.abs(q[2] - q[0]) < 0.02 * Math.abs(q[3] - q[1]) && Math.abs(q[3] - q[1]) >= 1500).map((q) => [(q[0] + q[2]) / 2, Math.min(q[1], q[3]), Math.max(q[1], q[3])]).sort((p, q) => p[0] - q[0])
    const 무2 = []
    for (const z of v) { const g = 무2[무2.length - 1]; if (g && z[0] - g.x1 <= 400) { g.x1 = z[0]; g.y0 = Math.min(g.y0, z[1]); g.y1 = Math.max(g.y1, z[2]) } else 무2.push({ x1: z[0], y0: z[1], y1: z[2] }) }
    if (!무2.length) return null
    return { 위: EL(Math.max(...무2.map((g) => g.y1))), 끝: EL(Math.min(...무2.map((g) => g.y0))), 길이들: 무2.map((g) => (g.y1 - g.y0) / 1000) }
  }
  return { 단, 바닥, 지반: 지.length ? [EL(Math.min(...지)), EL(Math.max(...지))] : null, 말뚝: 세로('측면말뚝'), 중간: 세로('중간말뚝'),
    근거: `E.L 글자 ${좋.n}개를 그 높이 선에 맞춤(도면 y − 표고 = ${Math.round(off)} mm)` }
}
/** 단면도 여러 장 → 하나(단 높이 0.4 m 안은 같은 단 · 길이 더함) */
function 단면합치기(목록) {
  const 단 = []
  for (const d of 목록) for (const x of d.단) { const g = 단.find((o) => Math.abs(o.EL - x.EL) <= 0.4); if (g) { g.EL = (g.EL * g.길이 + x.EL * x.길이) / (g.길이 + x.길이); g.길이 += x.길이 } else 단.push({ ...x }) }
  const 모 = (k) => 목록.map((d) => d[k]).filter(Boolean)
  const 지 = 모('지반'), 말 = 모('말뚝'), 중 = 모('중간')
  return {
    단: 단.sort((p, q) => q.EL - p.EL), 바닥: [...new Set(목록.flatMap((d) => d.바닥))].sort((p, q) => p - q),
    지반: 지.length ? [Math.min(...지.map((x) => x[0])), Math.max(...지.map((x) => x[1]))] : null,
    말뚝: 말.length ? { 위: Math.max(...말.map((x) => x.위)), 끝: Math.min(...말.map((x) => x.끝)), 길이들: 말.flatMap((x) => x.길이들) } : null,
    중간: 중.length ? { 위: Math.max(...중.map((x) => x.위)), 끝: Math.min(...중.map((x) => x.끝)), 길이들: 중.flatMap((x) => x.길이들) } : null,
    근거: 목록.map((d) => d.근거),
  }
}

/* ── 글자 — 규격 · 간격 · 굴착 깊이 ── */
/** 말뚝 간격 글자 → mm — «C.T.C 1,800» · «@1800» · 🧭 G237 «C.T.C=1.60m» · «C.T.C: 1.60m»(m) */
/* 🧭 G237 말뚝 간격 글 — «C.T.C=1.60m»(m) · «C.T.C 1,800» · «@1800»(mm) → mm (500 ~ 5000 만) */
export function 간격글(s) {
  const t = String(s || '')
  const m = /(?:C\.?\s*T\.?\s*C\.?|@)\s*[:=]?\s*(\d{1,2}\.\d{1,3})\s*m(?![m\w])/i.exec(t)
  if (m) { const v = Math.round(+m[1] * 1000); return v >= 500 && v <= 5000 ? v : null }
  const c = /(?:C\.?\s*T\.?\s*C\.?|@)\s*[:=]?\s*([\d,]{3,6})/i.exec(t)
  if (c) { const v = +c[1].replace(/,/g, ''); return v >= 500 && v <= 5000 ? v : null }
  return null
}
const 이름꼴 = [['중간말뚝', /중간\s*말뚝|post\s*-?\s*pile/i], ['사보강', /사\s*보강|경사\s*버팀|corner/i], ['측면말뚝', /측면\s*말뚝|엄지|side\s*pile|h\s*-?\s*pile/i], ['띠장', /띠장|wale/i], ['버팀보', /버팀|strut/i], ['보강재', /보강재/i]]
function 글자읽기(글자) {
  const 표 = {}, 간격표 = new Map()
  const 이름에 = (s) => { for (const [k, re] of 이름꼴) if (re.test(s)) return k; return '' }
  const 이름표 = 글자.filter((t) => 이름에(t.s))
  let 깊이 = null
  for (const t of 글자) {
    const s = String(t.s || '')
    const g = /G\.?\s*L\s*\(?\s*[-−]\s*\)?\s*([\d.]+)\s*(?:~|∼|-)\s*([\d.]+)\s*m/i.exec(s)
    if (g) { const a = +g[1], b = +g[2]; if (a > 0 && b > 0 && b < 40) 깊이 = { 작: Math.min(a, b), 큰: Math.max(a, b), 글: s.slice(0, 80) } }
    const h = 형강읽기(s)
    if (!h) continue
    let k = 이름에(s)
    if (!k) {
      let best = null
      for (const q of 이름표) { const d = Math.hypot(q.x - t.x, q.y - t.y); if (d < 2500 && (!best || d < best.d)) best = { d, k: 이름에(q.s) } }
      k = best ? best.k : ''
    }
    if (!k) continue
    const m = 표[k] || (표[k] = new Map())
    m.set(h.규격, (m.get(h.규격) || 0) + 1)
    if (k === '측면말뚝') { const v = 간격글(s); if (v) 간격표.set(v, (간격표.get(v) || 0) + 1) }
  }
  for (const t of 이름표) {
    if (이름에(t.s) !== '측면말뚝') continue
    const v = 간격글(t.s); if (v) 간격표.set(v, (간격표.get(v) || 0) + 1)
  }
  const 규격 = {}
  for (const [k, m] of Object.entries(표)) { const [g] = [...m].sort((a, b) => b[1] - a[1])[0]; 규격[k] = 형강읽기(g) }
  const 간격 = 간격표.size ? [...간격표].sort((a, b) => b[1] - a[1])[0][0] : null
  return { 규격, 간격, 깊이 }
}

/**
 * @param 그룹 도면 3D 일꾼 묶음들({종류, 제목, 파일, 파일번, out, 글자, 평면, 자리})
 * @param 안넓이찾기 (선[x0,y0,x1,y1 …]) => ㎡ — 토류판 줄로 둘러싼 넓이(일꾼이 구조물면으로)
 * @returns [{ 파일, 제목들, 규격, 간격, 깊이, 말뚝:{개수, 길이들, 길이}, 중간말뚝:{개수}, 토류판:{둘레, 넓이, 근거}, 띠장 · 버팀보 · 사보강 · 보강재:{길이, 단:[{단, 길이}]}, 터파기:{넓이, 깊이, 부피}, 근거:[] }]
 */
export function 흙막이읽기(그룹, 안넓이찾기 = null) {
  const 파일들 = new Map()
  const 이름 = (g) => String(g.제목 || '').trim() || String((g.파일 || [])[0] || '').replace(/\.(dxf|dwg)$/i, '')
  for (const g of 그룹) {
    if (!g.out || g.파일번 == null) continue
    const 흙선 = [...g.out.keys()].some((k) => 흙층(k.slice(k.indexOf('\u0001') + 1)))
    if (!흙선 && !흙막이도면.test(이름(g))) continue
    const f = 파일들.get(g.파일번) || { 파일: (g.파일 || [])[0] || '', 그룹: [], 글자: [] }
    f.그룹.push(g)
    for (const t of g.흙글 || g.글자 || []) f.글자.push(t)
    파일들.set(g.파일번, f)
  }
  /* 🧭 G237 흙막이를 파일 여러 장(평면도 · 단면도 · 전개도 · 표준단면도 및 공사개요)으로 나눠 그렸으면 한 벌로 — 소장님 현장 F 00-03 ~ 00-06
       흙막이 이름(제목 · 파일 이름)인 파일이 둘 넘고 «말뚝을 그린 평면» 이 있는 파일이 하나뿐일 때만(두 현장 흙막이를 섞지 않게) */
  {
    const 흙파일 = [...파일들.entries()].filter(([, f]) => f.그룹.some((g) => 흙막이도면.test(이름(g))))
    const 평면파일 = 흙파일.filter(([, f]) => f.그룹.some((g) => (g.평면 || /평면/.test(이름(g))) && [...g.out.keys()].some((k) => 흙층(k.slice(k.indexOf('\u0001') + 1)) === '측면말뚝')))
    if (흙파일.length >= 2 && 평면파일.length === 1) {
      const [주번, 주] = 평면파일[0]
      for (const [번, f] of 흙파일) {
        if (번 === 주번) continue
        for (const g of f.그룹) 주.그룹.push(g)
        for (const t of f.글자) 주.글자.push(t)
        주.합친 = (주.합친 || []).concat(f.파일)
        파일들.delete(번)
      }
    }
  }
  const 결과 = []
  for (const f of 파일들.values()) {
    const { 규격, 간격, 깊이 } = 글자읽기(f.글자)
    const 근거 = []
    const 평면들 = [], 전개들 = [], 단면들 = []
    for (const g of f.그룹) {
      const 제 = 이름(g).replace(/\s+/g, '')
      if (g.흙단면) { 단면들.push({ 제목: g.제목, ...g.흙단면 }); continue }
      if (/전개도/.test(제)) { const e = 전개읽기(g.out); if (e.길이들.length || e.넓이) 전개들.push({ 제목: g.제목, ...e }) ; continue }
      if (/단면|상세|주상|계측|위치도|키플랜|keyplan/i.test(제)) continue
      if (!(g.평면 || /평면/.test(제))) continue
      const by = 선모으기(g.out)
      if (!Object.keys(by).length) continue
      const 단m = /(\d)\s*단/.exec(제)
      const how = g.자리 && g.자리.how
      평면들.push({ 제목: g.제목, 단: 단m ? +단m[1] : 0, by, 놓임: !!how && how !== '옆', 말: 말뚝들(by.측면말뚝 || []), 중: 말뚝들(by.중간말뚝 || []), 복공: /복공/.test(제) })
    }
    if (!평면들.length && !전개들.length) continue
    // 흙막이 도면이 맞는지 — 말뚝 · 토류판 선이 있거나 제목이 흙막이(건축 도면의 «보강재» 층만으로는 안 봄)
    if (!평면들.some((p) => (p.by.측면말뚝 || []).length || (p.by.토류판 || []).length) && !f.그룹.some((g) => 흙막이도면.test(g.제목 || ''))) continue
    // 말뚝 · 토류판 — 가장 많이 그린 한 장(같은 말뚝을 여러 장에 그림 = 겹침)
    let 말 = [], 중 = [], 토 = { 길이: 0, 가닥: 1, 두께: 0 }, 토선 = [], 토평 = null
    for (const p of 평면들) {
      if (p.말.length > 말.length) 말 = p.말
      if (p.중.length > 중.length) 중 = p.중
      const t = 가운데길이(p.by.토류판 || [])
      if (t.길이 > 토.길이) { 토 = t; 토선 = p.by.토류판; 토평 = p }
    }
    // 띠장 · 버팀보 · 사보강 · 보강재 — 단마다(같은 단이 두 장이면 긴 쪽) · 단 평면이 없으면 단 없는 평면
    const 단평면 = 평면들.filter((p) => p.단 > 0)
    const 쓸 = 단평면.length ? 단평면 : 평면들.slice(0, 1)
    const 단별 = {}
    for (const k of ['띠장', '버팀보', '사보강', '보강재']) {
      const m = new Map()
      for (const p of 쓸) { const L = 가운데길이(p.by[k] || []).길이; if (L > (m.get(p.단) || 0)) m.set(p.단, L) }
      단별[k] = [...m].filter(([, L]) => L > 0).map(([단, L]) => ({ 단, 길이: L / 1000 }))
    }
    // 말뚝 길이 — 전개도
    const 전길이 = 전개들.flatMap((e) => e.길이들)
    let 길이들 = 전길이.map((L) => L / 1000)
    let 말개수 = 말.length
    if (!말개수 && 길이들.length) 말개수 = 길이들.length
    let 말길이 = 길이들.reduce((s, v) => s + v, 0)
    if (길이들.length && 말개수 && Math.abs(길이들.length - 말개수) > Math.max(2, 0.15 * 말개수)) {
      const 평 = 말길이 / 길이들.length
      근거.push(`전개도 말뚝 ${길이들.length}개 · 평면 말뚝 ${말개수}개로 달라 평균 길이 ${평.toFixed(2)} m × ${말개수}개`)
      말길이 = 평 * 말개수
    } else if (길이들.length) 근거.push(`말뚝 길이 = 전개도 말뚝 ${길이들.length}개 세로선(위 ~ 끝) 합`)
    // 토류판 · 터파기
    const 둘레 = 토.길이 / 1000 || (간격 && 말개수 ? 간격 * 말개수 / 1000 : 0)
    const 전넓이 = 전개들.reduce((s, e) => s + e.넓이, 0) / 1e6
    const 전폭 = 전개들.reduce((s, e) => s + e.폭, 0) / 1000
    let 토넓이 = 0, 평균깊이 = 0, 토근거 = ''
    if (전넓이 > 0 && 전폭 > 0) { 토넓이 = 전넓이 * (둘레 > 0 && 전폭 > 0 && Math.abs(전폭 / 둘레 - 1) > 0.15 ? 둘레 / 전폭 : 1); 평균깊이 = 전넓이 / 전폭; 토근거 = '전개도'; 근거.push(`토류판 = 전개도 원지반선 ~ 굴착선 사이 ${전넓이.toFixed(1)} ㎡(펼친 길이 ${전폭.toFixed(1)} m · 평균 깊이 ${평균깊이.toFixed(2)} m)` + (토넓이 !== 전넓이 ? ` × 둘레 ${둘레.toFixed(1)} m ÷ 펼친 길이` : '')) }
    else if (깊이 && 둘레 > 0) { 평균깊이 = (깊이.작 + 깊이.큰) / 2; 토넓이 = 둘레 * 평균깊이; 토근거 = '글자'; 근거.push(`토류판 = 둘레 ${둘레.toFixed(1)} m × 굴착 깊이 가운데 ${평균깊이.toFixed(2)} m(글자 «${깊이.글}»)`) }
    let 안 = 0, 안줄 = null
    if (안넓이찾기 && 토선.length) { try { const r = 안넓이찾기(토선.flat()); if (r && typeof r === 'object') { 안 = r.넓이 || 0; 안줄 = r.줄 || null } else 안 = r || 0 } catch (e) { 안 = 0 } }
    if (안 > 0 && 토.두께 > 0 && 둘레 > 0) 안 = Math.max(0, 안 - 둘레 * 토.두께 / 2000)          // 바깥 줄 안 → 판 가운데 줄 안
    const 터 = 안 > 0 && 평균깊이 > 0 ? { 넓이: 안, 깊이: 평균깊이, 부피: 안 * 평균깊이 } : null
    if (터) 근거.push(`건물 터파기 = 흙막이 안 넓이 ${안.toFixed(1)} ㎡ × 평균 깊이 ${평균깊이.toFixed(2)} m`)
    if (토.가닥 > 1) 근거.push(`토류판 줄이 ${토.가닥} 가닥으로 그려져 ÷ ${토.가닥}`)
    /* 📐 단면도 — 단 높이 · 굴착 바닥 · 원지반 · 말뚝 끝(표고) · 중간말뚝 길이(단면의 세로선 · 있으면 짐작 대신) */
    const 단면 = 단면들.length ? 단면합치기(단면들) : null
    let 중길이 = null
    if (단면 && 단면.중간 && 단면.중간.길이들.length) { 중길이 = 단면.중간.길이들.reduce((a, b) => a + b, 0) / 단면.중간.길이들.length; 근거.push(`중간말뚝 길이 = 단면도 중간말뚝 ${단면.중간.길이들.length}개 평균 ${중길이.toFixed(2)} m`) }
    if (단면) 근거.push(`단면도 ${단면들.length}장 — ${단면.근거[0]} · 단 ${단면.단.map((d) => 'EL ' + d.EL.toFixed(2)).join(' · ') || '없음'} · 굴착 바닥 ${단면.바닥.map((v) => v.toFixed(2)).join(' · ') || '—'}${단면.지반 ? ` · 원지반 ${단면.지반[0].toFixed(2)} ~ ${단면.지반[1].toFixed(2)}` : ''}`)
    /* 🧊 3D 그림 — 놓인(자리 맞춘) 평면 중 말뚝이 가장 많은 것이 기준 · 다른 평면(단마다)은 말뚝 맞춤으로 옮겨 겹침 */
    const 그림 = (() => {
      const 놓인 = 평면들.filter((p) => p.놓임 && p.말.length)
      const 기 = (놓인.length ? 놓인 : 평면들.filter((p) => p.말.length)).sort((a, b) => b.말.length - a.말.length)[0]
      if (!기) return null
      const 기c = 기.말.map((m) => m.c)
      const 옮김 = (p) => { if (p === 기) return [0, 0]; const t = 말뚝맞춤(기c, p.말.map((m) => m.c)); return t || (p.놓임 && 기.놓임 ? [0, 0] : null) }
      const 옮 = (pt, t) => [pt[0] + t[0], pt[1] + t[1]]
      const 중평 = 평면들.filter((p) => p.중.length && 옮김(p)).sort((a, b) => b.중.length - a.중.length)[0]
      const 중t = 중평 ? 옮김(중평) : null
      const 토t = 토평 ? 옮김(토평) : null
      const 부재 = {}
      for (const k of ['띠장', '버팀보', '사보강', '보강재']) {
        부재[k] = []
        for (const p of 쓸) {
          const t = 옮김(p); if (!t || !(p.by[k] || []).length) continue
          const 줄 = 가운데줄들(p.by[k]).filter((c) => Math.hypot(c.b[0] - c.a[0], c.b[1] - c.a[1]) >= 500).map((c) => ({ a: 옮(c.a, t), b: 옮(c.b, t), 폭: c.폭 }))
          if (줄.length) 부재[k].push({ 단: p.단, 줄 })
        }
      }
      return {
        말뚝: 기.말.slice(0, 2000).map((m) => m.꼴), 중간: 중평 ? 중평.중.slice(0, 2000).map((m) => m.꼴.map((q) => 옮(q, 중t))) : [],
        토류판: 토평 && 토t ? 가운데줄들(토선, { 최대폭: 250 }).filter((c) => Math.hypot(c.b[0] - c.a[0], c.b[1] - c.a[1]) >= 300).map((c) => ({ a: 옮(c.a, 토t), b: 옮(c.b, 토t), 폭: c.폭 })) : [],
        부재, 안줄: 안줄 && 토t ? 안줄.map((q) => 옮(q, 토t)) : null, 놓임: 기.놓임,
      }
    })()
    결과.push({
      파일: f.파일, 제목들: [...평면들.map((p) => p.제목), ...전개들.map((e) => e.제목), ...단면들.map((d) => d.제목)], 규격, 간격, 깊이,
      말뚝: { 개수: 말개수, 길이들, 길이: 말길이, 자리: 말.map((m) => m.c) }, 중간말뚝: { 개수: 중.length, 자리: 중.map((m) => m.c), 길이: 중길이 }, 단면, 그림,
      토류판: { 둘레, 넓이: 토넓이, 깊이: 평균깊이, 근거: 토근거 }, 띠장: 단별.띠장, 버팀보: 단별.버팀보, 사보강: 단별.사보강, 보강재: 단별.보강재,
      터파기: 터, 평균깊이, 근거,
    })
  }
  return 결과
}

/**
 * 흙막이 읽은 것 → 물량 줄(엑셀 · 화면) — 강재 중량 = 길이 × 단위무게 × (1 + 할증) ÷ 1000
 *   중간말뚝 길이는 도면에 길이 글자가 없으면 측면말뚝 평균 길이(짐작 · 표에 표시)
 * @returns {{ 줄: [{공종, 규격, 단위, 수량, 길이, kg, 중량, 짐작}], 강재: ton, 토류판: {넓이, 길이, 깊이}, 터파기: {넓이, 깊이, 부피} | null }}
 */
export function 흙막이물량(h, { 할증 = 0, 중간말뚝길이 = null } = {}) {
  const 줄 = []
  const 강 = (공종, 규, 수량, 길이, 짐작 = '', 부분 = '', 단 = 0) => {
    const kg = 규 ? 규.kg : 0
    줄.push({ 공종, 규격: 규 ? 규.규격 : '', 단위: 'ton', 수량, 길이, kg, 중량: 길이 * kg * (1 + 할증) / 1000, 짐작: 규 ? 짐작 : '규격 글자를 못 읽음' + (짐작 ? ' · ' + 짐작 : ''), 부분, 단 })
  }
  if (h.말뚝.개수) 강('측면말뚝(H-PILE)', h.규격.측면말뚝, h.말뚝.개수, h.말뚝.길이 || 0, h.말뚝.길이들.length ? '' : '전개도가 없어 길이를 못 읽음', '말뚝')
  if (h.중간말뚝.개수) {
    const 평 = h.말뚝.개수 && h.말뚝.길이 ? h.말뚝.길이 / h.말뚝.개수 : 0
    const 단면L = h.중간말뚝.길이 > 0 ? h.중간말뚝.길이 : null
    const L = 중간말뚝길이 != null ? 중간말뚝길이 : 단면L != null ? 단면L : 평
    강('중간말뚝(POST PILE)', h.규격.중간말뚝 || h.규격.버팀보, h.중간말뚝.개수, L * h.중간말뚝.개수, 중간말뚝길이 != null ? '' : 단면L != null ? `길이 = 단면도 평균 ${단면L.toFixed(2)} m` : `길이 = 측면말뚝 평균 ${평.toFixed(2)} m(짐작)`, '중간말뚝')
  }
  for (const [k, 이름] of [['띠장', '띠장(WALE)'], ['버팀보', '버팀보(STRUT)'], ['사보강', '사보강(경사 버팀)'], ['보강재', '보강재']]) {
    for (const d of h[k] || []) 강(이름 + (d.단 ? ` ${d.단}단` : ''), h.규격[k] || h.규격.띠장 || null, null, d.길이, h.규격[k] ? '' : h.규격.띠장 ? '띠장 규격으로 봄(짐작)' : '', k, d.단 || 1)
  }
  const 강재 = 줄.reduce((s, x) => s + x.중량, 0)
  const T = h.토류판 || {}
  const 토류판 = T.넓이 > 0 ? { 넓이: T.넓이, 깊이: T.깊이 || 0, 길이: T.깊이 > 0 ? T.넓이 / T.깊이 : T.둘레 } : null
  return { 줄, 강재, 토류판, 터파기: h.터파기 || null }
}
