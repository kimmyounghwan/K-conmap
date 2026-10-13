/* 📏 통심(그리드) 기호 — X1 · Y1 · A · 1 … 원 안 글자 + 그 줄 위 긴 선 (2026-10-10 G237 · BIM모델.js 에서 나눔)
   골조(구조평면도 · BIM모델.js 통심찾기)와 건축 평면(도면 3D 일꾼 · building3d.js 쌓기)이 같은 함수로 찾습니다.
   소장님 겹치는 순서 4 「층 평면 · 구조 평면 — 통심 기호로 서로 겹치고 … 골조는 건축 평면 건물 안 제자리에」 */

/** 통심 기호 글자 꼴 — X1 · Y12 · A · B' · 1 · 12 · X-1 */
export const 통심글 = /^(?:[A-Z]{1,2}-?\d{0,2}'?|\d{1,2}'?)$/

/**
 * @param 원 [{x, y, r}] (반지름 120 ~ 1500 mm 만 넘겨도 되고 아니어도 됨)
 * @param 선 [[ax, ay, bx, by]] 긴 선(2.5 m 넘게)
 * @param 글자 [{u, x, y, h}]
 * @returns [{글, x, y, 각, 각칸, off, nx, ny, ux, uy, 끝:[ax, ay, bx, by]}]
 */
export function 통심기호({ 원: 원0, 선: 선0, 글자, 최대원 = 1500 }) {
  /* 🧭 G240 통합본 큰 축척 판(1:300 배치)은 기호 원도 그만큼 큼(반지름 2 m 넘게) — 도면 3D 일꾼은 최대원을 크게 넘김 */
  const 원 = 원0.filter((c) => c.r >= 120 && c.r <= 최대원)
  const 선 = 선0.filter((L) => Math.hypot(L[2] - L[0], L[3] - L[1]) >= 2500)
  /* 큰 도면(원 수만 · 선 수십만)도 빠르게 — 3 m 칸으로 나눠 가까운 것만 봄 */
  const 칸 = 3000, 칸열쇠 = (x, y) => Math.floor(x / 칸) * 100003 + Math.floor(y / 칸)
  const 원칸 = new Map()
  for (const c of 원) { const key = 칸열쇠(c.x, c.y); const a = 원칸.get(key); if (a) a.push(c); else 원칸.set(key, [c]) }
  /* 긴 선을 «방향(0.5°) → 자리(법선 쪽 거리 50 mm 칸)» 로 — 원과 한 줄 위(같은 방향 · 같은 자리)에 있는 통심선을 바로 찾게.
   * 기호 원과 통심선 끝 사이가 멀어도(치수선이 사이에 있는 도면 — 9 m 떨어진 것도 봄) 같은 줄이면 그 선 */
  const 줄표 = new Map()
  for (const L of 선) {
    let 각 = Math.atan2(L[3] - L[1], L[2] - L[0]); if (각 < 0) 각 += Math.PI; if (각 >= Math.PI - 1e-9) 각 -= Math.PI
    const 각칸 = Math.round(각 * 180 / Math.PI * 2) / 2
    const ux = Math.cos(각칸 * Math.PI / 180), uy = Math.sin(각칸 * Math.PI / 180), nx = -uy, ny = ux
    const off = nx * L[0] + ny * L[1]
    const ta = ux * L[0] + uy * L[1], tb = ux * L[2] + uy * L[3]
    let m = 줄표.get(각칸); if (!m) { m = { ux, uy, nx, ny, 칸: new Map(), n: 0 }; 줄표.set(각칸, m) }
    m.n++
    const bin = Math.round(off / 50)
    const a = m.칸.get(bin), o = { off, t0: Math.min(ta, tb), t1: Math.max(ta, tb), 길이: Math.abs(tb - ta) }
    if (a) a.push(o); else m.칸.set(bin, [o])
  }
  const 방향들 = [...줄표.entries()].filter(([, m]) => m.n >= 2)
  const 곁 = (표, x, y) => { const out = []; const i0 = Math.floor(x / 칸), j0 = Math.floor(y / 칸); for (let i = i0 - 1; i <= i0 + 1; i++) for (let j = j0 - 1; j <= j0 + 1; j++) { const a = 표.get(i * 100003 + j); if (a) out.push(...a) } return out }
  /* 기호 글자 — 원 안의 글자를 모두 모아 읽는 차례로 붙임(「X」 + 작은 「1」 처럼 두 글자로 쓴 기호도 X1) */
  const 글칸 = new Map()
  for (const g of 글자) { if (!g.u || g.u.length > 4) continue; const key = 칸열쇠(g.x, g.y); const a = 글칸.get(key); if (a) a.push(g); else 글칸.set(key, [g]) }
  /* ① 글자 든 원(기호)부터 모음 */
  const 든 = []
  for (const 둘레 of 원) {
    /* 🧭 G237 같은 자리에 같은 글자가 겹쳐 있으면(기호 블록을 여러 번 넣은 도면 — 현장 B A-111 «X» «1» 여섯 겹) 하나로 */
    const 본 = new Set()
    const 안 = 곁(글칸, 둘레.x, 둘레.y).filter((g) => Math.hypot(g.x - 둘레.x, g.y - 둘레.y) <= 둘레.r * 0.95 && g.h < 둘레.r * 1.6)
      .filter((g) => { const k = g.u + '|' + Math.round(g.x / 10) + '|' + Math.round(g.y / 10); if (본.has(k)) return false; 본.add(k); return true })
    if (!안.length || 안.length > 3) continue
    안.sort((a, b) => (Math.abs(a.y - b.y) > Math.max(a.h, b.h) * 0.9 && Math.abs(a.x - b.x) < Math.max(a.h, b.h) * 0.6 ? b.y - a.y : a.x - b.x))
    let u = 안.map((g) => g.u.replace(/[()]/g, '')).join('')
    /* 🧭 G237 세로로 돌려 쓴 기호(«Y» 위에 «3» — 현장 B 구조평면도)는 아래에서 위로 읽음 */
    const 거꾸로 = 안.slice().reverse().map((g) => g.u.replace(/[()]/g, '')).join('')
    if (!통심글.test(u) || (/^\d/.test(u) && /^[A-Z]/.test(거꾸로) && 통심글.test(거꾸로))) u = 거꾸로
    if (!통심글.test(u)) continue
    든.push({ 둘레, u })
  }
  const 든칸 = new Map()
  for (const d of 든) { const key = 칸열쇠(d.둘레.x, d.둘레.y); const a = 든칸.get(key); if (a) a.push(d); else 든칸.set(key, [d]) }
  /* 🧭 G237 줄 위에 «다른 글자 기호» 가 또 있으면 그 줄은 통심선이 아님 — 기호들이 늘어선 치수선 · 테두리(현장 B 골조: Y1 ~ Y4 기호를 세로로 꿴 선을 Y 통심선으로 잡았음) */
  const 꿴 = (m, o, 나) => {
    const 폭 = 나.둘레.r * 0.6
    const t0 = o.t0 - 2 * 나.둘레.r, t1 = o.t1 + 2 * 나.둘레.r
    const L = Math.min(o.t1 - o.t0, 200000)
    for (let t = Math.max(t0, -1e12); t <= t1; t += 칸) {
      if (t - t0 > L + 4 * 칸) break
      const x = m.ux * t + m.nx * o.off, y = m.uy * t + m.ny * o.off
      for (const d of 곁(든칸, x, y)) {
        if (d === 나 || d.u === 나.u) continue
        const dt = m.ux * d.둘레.x + m.uy * d.둘레.y
        if (dt < t0 || dt > t1) continue
        if (Math.abs(m.nx * d.둘레.x + m.ny * d.둘레.y - o.off) <= 폭) return true
      }
    }
    return false
  }
  const 기호 = []
  for (const 나 of 든) {
    const { 둘레, u } = 나
    // 이 원과 한 줄 위의 긴 선(통심선) — 원이 선 끝에서 떨어져 있어도(15 m 안) 같은 방향 · 같은 자리면
    const 후보 = []
    for (const [각칸, m] of 방향들) {
      const oc = m.nx * 둘레.x + m.ny * 둘레.y, tc = m.ux * 둘레.x + m.uy * 둘레.y
      const 폭 = 둘레.r * 0.5, b0 = Math.round((oc - 폭) / 50), b1 = Math.round((oc + 폭) / 50)
      for (let bin = b0; bin <= b1; bin++) for (const o of m.칸.get(bin) || []) {
        const 옆 = Math.abs(o.off - oc)
        if (옆 > 폭) continue
        const 틈 = tc < o.t0 ? o.t0 - tc : tc > o.t1 ? tc - o.t1 : 0
        if (틈 > Math.max(15000, 10 * 둘레.r)) continue
        const 점 = 틈 + 옆 * 4 - Math.min(o.길이, 60000) * 0.01
        후보.push({ 점, 각칸, m, o })
      }
    }
    후보.sort((p, q) => p.점 - q.점)
    let best = null
    for (const c of 후보.slice(0, 12)) { if (!꿴(c.m, c.o, 나)) { best = c; break } }
    if (!best) continue
    const { m, o } = best
    const 각 = best.각칸 * Math.PI / 180
    기호.push({ 글: u, x: 둘레.x, y: 둘레.y, 각, 각칸: best.각칸, off: o.off, nx: m.nx, ny: m.ny, ux: m.ux, uy: m.uy,
      끝: [m.ux * o.t0 + m.nx * o.off, m.uy * o.t0 + m.ny * o.off, m.ux * o.t1 + m.nx * o.off, m.uy * o.t1 + m.ny * o.off] })
  }
  return 기호
}

/** 통심 기호로 옮김 — 같은 글자 · 같은 방향 줄끼리 n·t = off기준 − off옮길 (최소제곱) */
export function 통심옮김(기준, 옮길) {
  const 줄 = []
  for (const b of 옮길) {
    const a = 기준.filter((x) => x.글 === b.글 && Math.abs(x.각칸 - b.각칸) < 1.01)
    if (!a.length) continue
    const offA = a.reduce((s, x) => s + x.off, 0) / a.length
    줄.push({ n: [b.nx, b.ny], d: offA - b.off, 글: b.글, 각: b.각칸 })
  }
  // 같은 글자가 양 끝(두 원)에 있으면 한 번만
  const 한번 = new Map()
  for (const z of 줄) { const key = z.글 + '|' + z.각; if (!한번.has(key)) 한번.set(key, z) }
  const L = [...한번.values()]
  let a11 = 0, a12 = 0, a22 = 0, b1 = 0, b2 = 0
  for (const z of L) { a11 += z.n[0] * z.n[0]; a12 += z.n[0] * z.n[1]; a22 += z.n[1] * z.n[1]; b1 += z.n[0] * z.d; b2 += z.n[1] * z.d }
  const det = a11 * a22 - a12 * a12
  if (L.length < 2 || Math.abs(det) < 0.25 * (a11 + a22) * 0.5) return null       // 두 방향(가로 · 세로) 모두 있어야
  const tx = (a22 * b1 - a12 * b2) / det, ty = (a11 * b2 - a12 * b1) / det
  // 남는 차(잘 맞았나)
  let 최대 = 0
  for (const z of L) 최대 = Math.max(최대, Math.abs(z.n[0] * tx + z.n[1] * ty - z.d))
  return { tx, ty, 줄수: L.length, 최대, 글들: [...new Set(L.map((z) => z.글))] }
}

/**
 * 🧭 G237 통심으로 두 건물 겹치기(돌림 + 옮김) — 골조(모델 좌표)의 통심 ↔ 건축 평면(현장 좌표)의 통심.
 * 같은 글자 줄끼리 방향 차이 = 돌림(0 · 180° 둘 다 보고 남는 차가 작은 쪽) → 줄 법선 쪽 옮김 최소제곱.
 * @param 골 [{글, 끝}] · 건 [{글, 끝}]
 * @returns null | {θ, tx, ty, 줄수, 최대, 글들}   골조 점 p → R(θ)·p + (tx, ty)
 */
export function 통심겹치기(골, 건) {
  const 말 = (g) => String(g.글 || '').replace(/[-']/g, '').toUpperCase()
  /* 통심 글자만 — X1 · Y12 · A · 1 (S1 · SS1 · FS · C1 같은 부재 · 기호 원은 안 씀) */
  const 통꼴 = /^(?:[XY]\d{1,2}|[A-Z]|\d{1,2})$/
  골 = (골 || []).filter((g) => 통꼴.test(말(g))); 건 = (건 || []).filter((g) => 통꼴.test(말(g)))
  const 줄 = (g) => { const [ax, ay, bx, by] = g.끝; let a = Math.atan2(by - ay, bx - ax); if (a < 0) a += Math.PI; if (a >= Math.PI) a -= Math.PI; const ux = Math.cos(a), uy = Math.sin(a), nx = -uy, ny = ux; return { 글: 말(g), a, nx, ny, off: nx * ax + ny * ay } }
  const G = new Map(), K = new Map()
  for (const g of 골 || []) { if (g && g.끝) { const z = 줄(g); if (!G.has(z.글)) G.set(z.글, z) } }
  for (const g of 건 || []) { if (g && g.끝) { const z = 줄(g); if (!K.has(z.글)) K.set(z.글, z) } }
  const 짝 = [...G.keys()].filter((k) => K.has(k)).map((k) => [G.get(k), K.get(k)])
  if (짝.length < 3) return null
  /* 돌림 — 짝마다 (건 − 골) 방향 차이(0 ~ π) 를 모아 가장 많이 모인 값 */
  const 차 = 짝.map(([g, k]) => { let d = k.a - g.a; while (d < 0) d += Math.PI; while (d >= Math.PI) d -= Math.PI; return d })
  let 좋θ = 0, 좋n = -1
  for (const d of 차) { const n = 차.filter((e) => Math.min(Math.abs(e - d), Math.PI - Math.abs(e - d)) < 0.02).length; if (n > 좋n) { 좋n = n; 좋θ = d } }
  let 최 = null
  for (const θ of [좋θ, 좋θ + Math.PI]) {
    const c = Math.cos(θ), s = Math.sin(θ)
    const L = []
    for (const [g, k] of 짝) {
      const nx = c * g.nx - s * g.ny, ny = s * g.nx + c * g.ny
      const 같 = nx * k.nx + ny * k.ny
      if (Math.abs(같) < 0.995) continue                          // 방향이 안 맞는 줄(다른 뜻의 같은 글자)
      const offK = 같 > 0 ? k.off : -k.off
      L.push({ n: [nx, ny], d: offK - g.off, 글: g.글 })
    }
    /* 최소제곱 → 가장 안 맞는 줄을 하나씩 빼며(다른 층 · 다른 뜻 기호) 남는 차 0.3 m 안까지 — 두 방향 넷 넘게 남아야 */
    const 풀기 = (L) => {
      let a11 = 0, a12 = 0, a22 = 0, b1 = 0, b2 = 0
      for (const z of L) { a11 += z.n[0] * z.n[0]; a12 += z.n[0] * z.n[1]; a22 += z.n[1] * z.n[1]; b1 += z.n[0] * z.d; b2 += z.n[1] * z.d }
      const det = a11 * a22 - a12 * a12
      if (Math.abs(det) < 0.25 * (a11 + a22) * 0.5) return null
      const tx = (a22 * b1 - a12 * b2) / det, ty = (a11 * b2 - a12 * b1) / det
      let 큰 = 0, 큰z = null
      for (const z of L) { const e = Math.abs(z.n[0] * tx + z.n[1] * ty - z.d); if (e > 큰) { 큰 = e; 큰z = z } }
      return { tx, ty, 큰, 큰z }
    }
    let r = 풀기(L)
    while (r && r.큰 > 300 && L.length > 4) { L.splice(L.indexOf(r.큰z), 1); r = 풀기(L) }
    if (!r || L.length < 4) continue
    const { tx, ty, 큰 } = r
    if (!최 || L.length > 최.줄수 || (L.length === 최.줄수 && 큰 < 최.최대)) 최 = { θ: θ % (2 * Math.PI), tx, ty, 줄수: L.length, 최대: 큰, 글들: L.map((z) => z.글) }
  }
  return 최
}
