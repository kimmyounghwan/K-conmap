/* 🏔 G299 지붕 높이 구역 (2026-10-16 · 소장님 「완벽하게 하고 올리자....골조물량, 마감물량...알겠지」)
 *
 *  현장 4: 2층 벽 · 기둥을 «2층 위 바닥»(RF 7,600)에서 잘라 셈했는데, 지붕 구조평면도의 «FL 레벨» 범례는
 *  지붕이 구역마다 1FL +8,400 · +9,550 · +10,500 이고 «경사 지붕 1 · 2» 는 골조입면도에서 처마 9.4 ~ 11.5 m · 용마루 11.5 ~ 13.6 m —
 *  그 아래 벽 · 기둥(지붕까지 올라가는 몫)이 빠졌음.
 *
 *  ① 레벨범례(D)       — 범례 줄 = 견본 해치 + «1FL +8,400» · «경사 지붕 1» (같은 줄에 범례 표가 둘이면 왼쪽부터 차례로 짝 — «SLAB LEVEL» 표가 겹쳐 있음)
 *  ② 입면경사(D)       — 골조입면 · 단면 패널(«1FL +x» 레벨 글 기둥)마다 경사선 사슬 [{축, 길이, 점:[[가로, 높이(1층 바닥 기준)]]}]
 *  ③ 경사높이(상자, 사슬들) — 경사 구역 ↔ 길이가 같은 사슬(가로 · 세로 중 맞는 쪽) → (x, y) → 높이 · 못 찾으면 null
 *  ④ 구역올림(…)       — BIM 모델에서 그 층 벽 · 기둥을 지붕 높이까지(BIM모델.js 가 부름)
 */
const 붙 = (s) => String(s ?? '').replace(/\s+/g, '')

/** «1FL +8,400» → {높이: 8400} · «경사 지붕 1» → {경사: true} · 아니면 null (SL · EL 은 아님) */
export function 레벨글(s) {
  const t = 붙(s).toUpperCase().replace(/[−–]/g, '-')
  const m = /^1?F\.?L\.?([+\-±])?([\d,]+(?:\.\d+)?)$/.exec(t)
  if (m) { let v = +m[2].replace(/,/g, ''); if (m[1] === '-') v = -v; return Number.isFinite(v) ? { 높이: v } : null }
  if (/^경사지붕\d{0,2}$|^SLOPE(D)?ROOF\d{0,2}$/.test(t)) return { 경사: true }
  return null
}
/** 범례 표의 기호 칸 글(짝 차례를 셀 때 같이 봄) — 레벨글 · «SL +1,000» · «… LEVEL» */
const 범례글 = (s) => !!레벨글(s) || /^(S\.?L|E\.?L)\.?[+\-±]?[\d,]+$/.test(붙(s).toUpperCase().replace(/[−–]/g, '-')) || /LEVEL$/.test(붙(s).toUpperCase())

/**
 * ① 범례 줄 — [{g, 견본, 무늬, 높이?, 경사?}]
 *   견본 = 같은 줄(글 높이 0.8 배 안) 왼쪽 20 글자 안의 작은 해치(폭 < 12 h · 높이 < 3 h).
 *   한 줄에 범례 표가 둘 겹치면(현장 4 «FL 레벨» + «SLAB LEVEL») 그 줄의 범례 글 · 견본을 왼쪽부터 차례로 짝.
 */
export function 레벨범례(D) {
  const 해치 = D.해치 || [], 글자 = D.글자 || []
  const 줄 = []
  const 본 = new Set()
  const 모호 = []                 // 글 수 ≠ 견본 수인 줄 — 다른 줄에서 배운 «글 − 견본» 거리로 짝(현장 4 «SL -30» 줄은 견본이 비어 있음)
  for (const g of 글자) {
    const r = 레벨글(g.s)
    if (!r || 본.has(g)) continue
    const h0 = g.h || 200
    const 같은줄 = 글자.filter((o) => Math.abs(o.y - g.y) <= 0.8 * Math.max(h0, o.h || 0) && 범례글(o.s) && Math.abs(((o.x0 != null ? o.x0 : o.x)) - (g.x0 != null ? g.x0 : g.x)) <= 30 * h0)
      .sort((p, q) => (p.x0 != null ? p.x0 : p.x) - (q.x0 != null ? q.x0 : q.x))
    for (const o of 같은줄) 본.add(o)
    const 왼끝 = Math.min(...같은줄.map((o) => (o.x0 != null ? o.x0 : o.x)))
    const 오끝 = Math.max(...같은줄.map((o) => (o.x0 != null ? o.x0 : o.x)))
    const 견본들 = 해치.filter((h) => {
      const cx = (h.b[0] + h.b[2]) / 2, cy = (h.b[1] + h.b[3]) / 2
      return h.무늬 && Math.abs(cy - g.y) <= 0.8 * h0 && cx < 오끝 && cx >= 왼끝 - 20 * h0 && (h.b[2] - h.b[0]) < 12 * h0 && (h.b[3] - h.b[1]) < 3 * h0
    }).sort((p, q) => (p.b[0] + p.b[2]) - (q.b[0] + q.b[2]))
    if (!견본들.length) continue
    /* 짝: 범례 글과 견본 수가 같으면 차례로 · 글이 하나면 왼쪽 가장 가까운 견본 · 아니면(모호) 건너뜀 */
    const 짝 = new Map()
    if (견본들.length === 같은줄.length) 같은줄.forEach((o, i) => 짝.set(o, 견본들[i]))
    else if (같은줄.length === 1) { const x0 = 같은줄[0].x0 != null ? 같은줄[0].x0 : 같은줄[0].x; const 왼 = 견본들.filter((h) => (h.b[0] + h.b[2]) / 2 < x0); if (왼.length) 짝.set(같은줄[0], 왼[왼.length - 1]) }
    else { 모호.push({ 같은줄, 견본들 }); continue }
    for (const [o, h] of 짝) { const rr = 레벨글(o.s); if (rr) 줄.push({ g: o, 견본: h, 무늬: h.무늬, ...rr }) }
  }
  if (모호.length && 줄.length) {
    const 거리 = 줄.map((r) => (r.g.x0 != null ? r.g.x0 : r.g.x) - (r.견본.b[0] + r.견본.b[2]) / 2).sort((p, q) => p - q)
    const d0 = 거리[거리.length >> 1]
    for (const { 같은줄, 견본들 } of 모호) for (const o of 같은줄) {
      const rr = 레벨글(o.s)
      if (!rr) continue
      const x0 = o.x0 != null ? o.x0 : o.x
      const h = 견본들.map((q) => ({ q, e: Math.abs(x0 - (q.b[0] + q.b[2]) / 2 - d0) })).sort((p, q) => p.e - q.e)[0]
      if (h && h.e <= 0.25 * Math.abs(d0)) 줄.push({ g: o, 견본: h.q, 무늬: h.q.무늬, ...rr })
    }
  }
  return 줄
}

/** 레벨 글 «1FL +x» 의 진짜 레벨 선(글 바로 밑 가로 선) — 없으면 글 가운데 − 0.6 h */
function 레벨선y(D, g) {
  const h = g.h || 200
  const x = g.x0 != null ? g.x0 : g.x
  let best = null
  const 후보 = typeof D.찾기 === 'function' ? D.찾기(x - 20 * h, g.y - 2 * h, x + 20 * h, g.y + 0.2 * h) : (D.sx0 || []).map((_, s) => s)
  for (const s of 후보) {
    const y0 = D.sy0[s], y1 = D.sy1[s]
    if (Math.abs(y1 - y0) > 1) continue
    const a = Math.min(D.sx0[s], D.sx1[s]), b = Math.max(D.sx0[s], D.sx1[s])
    if (b - a < 4 * h || a > x + 8 * h || b < x - 8 * h) continue
    const y = (y0 + y1) / 2
    if (y > g.y || y < g.y - 2 * h) continue
    if (best === null || y > best) best = y
  }
  return best !== null ? best : g.y - 0.6 * h
}

/**
 * ② 입면 · 단면 패널마다 경사 지붕 사슬.
 *   패널 = 레벨 글(«1FL +x» · 셋 넘게 · 같은 x)의 기둥 → 그 오른쪽(다음 기둥 전까지). 높이 = 레벨 선 y 로 맞춘 직선(z = a·y + b).
 *   경사선 = 그 패널의 구조 선 가운데 3° ~ 28°(계단 30° 넘는 것 · 기초 모따기 45° 는 빼고) · 800 mm 넘게 · 1층 바닥 2.5 m 위.
 *   끝이 250 mm 안에 닿는 경사선끼리 한 사슬 — 위 · 아래 두 선(슬래브 두께)은 높은 쪽만. 축 = 패널 위 통심 글(X… → x · Y… → y).
 */
export function 입면경사(D) {
  const 글자 = D.글자 || []
  const 레벨 = []
  for (const g of 글자) { const r = 레벨글(g.s); if (r && r.높이 !== undefined) 레벨.push({ g, v: r.높이, x: g.x0 != null ? g.x0 : g.x }) }
  if (레벨.length < 3) return []
  /* 기둥 — x 가 3 h 안 · 높이 셋 넘게 */
  const 기둥들 = []
  for (const L of 레벨.slice().sort((p, q) => p.x - q.x)) {
    const c = 기둥들.find((k) => Math.abs(k.x - L.x) <= 3 * (L.g.h || 200))
    if (c) c.줄.push(L); else 기둥들.push({ x: L.x, 줄: [L] })
  }
  const 패널 = 기둥들.filter((c) => new Set(c.줄.map((L) => L.v)).size >= 3).sort((p, q) => p.x - q.x)
  const out = []
  const 층이름 = (s) => (((D.layers || [])[D.sly[s]] || {}).name || '')
  const 구조층있음 = (D.sly || []).some((_, s) => /CON|콘크|구조|STR|SLAB|WALL|BEAM|GIRD/i.test(층이름(s)))
  패널.forEach((c, pi) => {
    /* 높이 맞춤 — 레벨 선 y ↔ 값(최소 제곱) */
    const 점 = c.줄.map((L) => [레벨선y(D, L.g), L.v])
    const n = 점.length, sy = 점.reduce((t, p) => t + p[0], 0), sv = 점.reduce((t, p) => t + p[1], 0)
    const syy = 점.reduce((t, p) => t + p[0] * p[0], 0), syv = 점.reduce((t, p) => t + p[0] * p[1], 0)
    const den = n * syy - sy * sy
    if (!(Math.abs(den) > 1e-9)) return
    const a = (n * syv - sy * sv) / den, b = (sv - a * sy) / n
    if (!(a > 0.5 && a < 2)) return                      // 축척이 1 쯤이어야(입면 · 단면은 실치수)
    const z = (y) => a * y + b
    const 맨위y = Math.max(...c.줄.map((L) => L.g.y))
    const 오른끝 = pi + 1 < 패널.length ? 패널[pi + 1].x - 1000 : c.x + 200000
    const h0 = c.줄[0].g.h || 200
    /* 축 — 패널 위(맨 위 레벨 글보다 위) 통심 글 */
    let nx = 0, ny = 0
    for (const g of 글자) {
      const gx = g.x0 != null ? g.x0 : g.x
      if (gx <= c.x || gx >= 오른끝 || g.y <= 맨위y) continue
      const u = 붙(g.s).toUpperCase()
      if (/^X\d{0,2}[A-Z]?$/.test(u)) nx++
      else if (/^Y\d{0,2}[A-Z]?$/.test(u)) ny++
    }
    const 축 = nx > ny ? 'x' : ny > nx ? 'y' : ''
    /* 경사선 */
    const 선 = []
    for (let s = 0; s < (D.sx0 || []).length; s++) {
      const x0 = D.sx0[s], x1 = D.sx1[s]
      if (Math.min(x0, x1) <= c.x + 2 * h0 || Math.max(x0, x1) >= 오른끝) continue
      if (구조층있음 && !/CON|콘크|구조|STR|SLAB|WALL|BEAM|GIRD/i.test(층이름(s))) continue
      const za = z(D.sy0[s]), zb = z(D.sy1[s])
      const dx = Math.abs(x1 - x0), dz = Math.abs(zb - za)
      const L = Math.hypot(dx, dz)
      if (L < 800 || dx < 1) continue
      const 각 = Math.atan2(dz, dx) * 180 / Math.PI
      if (각 < 3 || 각 > 28) continue
      if (Math.min(za, zb) < 2500) continue
      선.push(x0 <= x1 ? [x0, za, x1, zb] : [x1, zb, x0, za])
    }
    if (!선.length) return
    /* 사슬 — 끝이 250 mm 안에 닿으면 한 무리 */
    const 무 = 선.map((_, i) => i)
    const 뿌 = (i) => { while (무[i] !== i) { 무[i] = 무[무[i]]; i = 무[i] } return i }
    const 닿 = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]) <= 250
    for (let i = 0; i < 선.length; i++) for (let j = i + 1; j < 선.length; j++) {
      const A = 선[i], B = 선[j]
      if (닿([A[0], A[1]], [B[0], B[1]]) || 닿([A[0], A[1]], [B[2], B[3]]) || 닿([A[2], A[3]], [B[0], B[1]]) || 닿([A[2], A[3]], [B[2], B[3]])) 무[뿌(i)] = 뿌(j)
    }
    const 모음 = new Map()
    선.forEach((l, i) => { const k = 뿌(i); const m = 모음.get(k) || []; m.push(l); 모음.set(k, m) })
    const 사슬들 = [...모음.values()].map((ls) => {
      /* 윗면 — 끝점 가로 자리마다 그 자리를 지나는 선들 가운데 가장 높은 값(아래 선이 위 선에 닿아 한 무리가 돼도 움푹 패지 않게) */
      const xs = [...new Set(ls.flatMap((l) => [Math.round(l[0]), Math.round(l[2])]))].sort((u, v) => u - v)
      const q = []
      for (const x of xs) {
        let z = -Infinity
        for (const l of ls) if (x >= l[0] - 1 && x <= l[2] + 1) { const t = l[2] > l[0] ? Math.max(0, Math.min(1, (x - l[0]) / (l[2] - l[0]))) : 0; z = Math.max(z, l[1] + t * (l[3] - l[1])) }
        if (q.length && x - q[q.length - 1][0] <= 10) { if (z > q[q.length - 1][1]) q[q.length - 1] = [x, z] } else q.push([x, z])
      }
      const x0 = q[0][0], x1 = q[q.length - 1][0]
      return { x0, x1, 길이: x1 - x0, 점: q, 평균: q.reduce((t, r) => t + r[1], 0) / q.length }
    }).filter((s) => s.길이 >= 1500)
    /* 위 · 아래 두 선 — 가로가 80 % 넘게 겹치고 높이가 600 mm 안이면 높은 것만 */
    사슬들.sort((p, q) => q.평균 - p.평균)
    const 남 = []
    for (const s of 사슬들) {
      if (남.some((t) => Math.min(t.x1, s.x1) - Math.max(t.x0, s.x0) >= 0.8 * Math.min(t.길이, s.길이) && t.평균 - s.평균 < 600)) continue
      남.push(s)
    }
    for (const s of 남) out.push({ 패널: pi, 축, 길이: s.길이, 점: s.점.map((t) => [t[0] - s.x0, Math.round(t[1])]) })
  })
  return out
}

/** 사슬 높이(가로 u — 사슬 시작에서 mm) — 꺾인 선 사이 직선 */
export function 사슬높이(사슬, u) {
  const p = 사슬.점
  if (!p.length) return null
  if (u <= p[0][0]) return p[0][1]
  for (let i = 1; i < p.length; i++) if (u <= p[i][0]) { const a = p[i - 1], b = p[i]; const t = b[0] > a[0] ? (u - a[0]) / (b[0] - a[0]) : 0; return a[1] + t * (b[1] - a[1]) }
  return p[p.length - 1][1]
}

/**
 * ③ 경사 구역 높이 — 구역 상자 [x0, y0, x1, y1](모델 mm) · 사슬들 → {높이(x, y), 맞은: [{축, 길이}]} 또는 null.
 *   축 x(또는 모름) 사슬의 길이 ≈ 상자 가로(±4 %) → u = x − x0 · 축 y 사슬 ≈ 상자 세로 → u = y − y0. 맞는 사슬이 여럿이면 평균.
 */
export function 경사높이(상자, 사슬들) {
  const W = 상자[2] - 상자[0], H = 상자[3] - 상자[1]
  const 맞은 = []
  for (const s of 사슬들 || []) {
    if ((s.축 === 'x' || s.축 === '') && W > 0 && Math.abs(s.길이 - W) <= 0.04 * W) 맞은.push({ s, 축: 'x', 비: s.길이 / W })
    else if ((s.축 === 'y' || s.축 === '') && H > 0 && Math.abs(s.길이 - H) <= 0.04 * H) 맞은.push({ s, 축: 'y', 비: s.길이 / H })
  }
  if (!맞은.length) return null
  return {
    맞은: 맞은.map((m) => ({ 축: m.축, 길이: Math.round(m.s.길이), 낮: Math.min(...m.s.점.map((p) => p[1])), 높: Math.max(...m.s.점.map((p) => p[1])) })),
    높이: (x, y) => { let t = 0; for (const m of 맞은) t += 사슬높이(m.s, m.축 === 'x' ? (x - 상자[0]) * m.비 : (y - 상자[1]) * m.비); return t / 맞은.length },
    /* 🏔 G434 축(x | y) 방향 평면 범위 [a, b](모델 mm)의 빗길이 ÷ 평면 길이 — 그 축 사슬 평균(그 축 사슬이 없으면 1 = 그 방향은 평평) */
    빗: (축, a, b) => { const ms = 맞은.filter((m) => m.축 === 축); if (!ms.length || !(b > a)) return 1; let t = 0; for (const m of ms) { const o = 축 === 'x' ? 상자[0] : 상자[1]; t += 사슬빗(m.s, (a - o) * m.비, (b - o) * m.비) }; return t / ms.length },
    /* 🏔 G434 그 범위가 지나는 경사선 기울기들(°) — 줄 비고 «기울기 19.4° · 8.7°» */
    각: (축, a, b) => { const out = new Set(); for (const m of 맞은.filter((q) => q.축 === 축)) { const o = 축 === 'x' ? 상자[0] : 상자[1]; for (const v of 사슬각(m.s, (a - o) * m.비, (b - o) * m.비)) out.add(v) } return [...out].sort((p, q) => q - p) },
  }
}

/** 🏔 G434 사슬 가로 [u0, u1] 의 빗길이 ÷ 가로 길이(사슬 밖은 평평 — 사슬높이와 같음) */
export function 사슬빗(사슬, u0, u1) {
  const p = (사슬 && 사슬.점) || []
  if (!(u1 > u0) || p.length < 2) return 1
  let L = 0, 든 = 0
  for (let i = 1; i < p.length; i++) {
    const a = Math.max(u0, p[i - 1][0]), b = Math.min(u1, p[i][0])
    if (!(b > a)) continue
    const du = p[i][0] - p[i - 1][0]
    L += (b - a) * Math.hypot(1, du > 0 ? (p[i][1] - p[i - 1][1]) / du : 0); 든 += b - a
  }
  return (L + (u1 - u0 - 든)) / (u1 - u0)
}

/** 🏔 G434 사슬 가로 [u0, u1] 이 지나는 경사 토막 기울기(0.1° · 1° 넘는 것 · 범위 2 % 넘게 겹친 것) */
export function 사슬각(사슬, u0, u1) {
  const p = (사슬 && 사슬.점) || [], out = new Set()
  for (let i = 1; i < p.length; i++) {
    const a = Math.max(u0, p[i - 1][0]), b = Math.min(u1, p[i][0]), du = p[i][0] - p[i - 1][0]
    if (!(b - a > 0.02 * (u1 - u0)) || !(du > 0)) continue
    const g = Math.round(Math.atan(Math.abs(p[i][1] - p[i - 1][1]) / du) * 1800 / Math.PI) / 10
    if (g >= 1) out.add(g)
  }
  return [...out]
}

/**
 * ⑤ 🏔 G434 경사 지붕 빗길이 — 경사 구역 안 슬래브 · 보를 평면 길이가 아니라 기울어진 길이(빗길이)로 셈(골조읽기가 부름 · 줄 값을 바꿈).
 *   (현장 B «경사 지붕 1 · 2» — 골조입면도 경사선 19.4° · 8.7° 인데 평면 넓이로만 셈해 콘크리트 · 데크 · 철근이 모자랐음)
 *   주: 주자료 · 구역들: R.읽음.지붕구역 · 사슬들: R.읽음.지붕사슬 · k번(번) → 그 도면 배율(_자리 r · 구역 판은 도면 단위)
 *   ㉠ 줄 자리(_자리 r) 가운데가 같은 도면의 경사 구역 판 안이고 그 구역에 길이 맞는 입면 사슬(경사높이)이 있으면
 *   ㉡ 사슬 축 방향 자리 범위의 빗길이 ÷ 평면 길이 = 비(용마루를 넘는 칸 · 사슬 밖 평평한 몫은 그대로 잼)
 *   ㉢ 슬라브 — 그 축 방향 변(단변 | 장변 — 자리 폭에 가까운 쪽) × 비 · 개구부 넓이 × 비 · 데크 안목(_안) 그 변 × 비
 *      보 — 그 축으로 놓인 보만 안목 × 비(길이 = 길이 + (길이 − 좌단 − 우단) × (비 − 1)) · 가로지른 보는 그대로(높이가 같음)
 *   ㉣ 한 줄 자리마다 비가 다르면 줄을 나눔(나눈 줄은 표 끝에 — 앞 줄 차례 그대로) · 나눠야 하는데 QT 가 자리 수와 다른 줄은 손대지 않음(못 셈 수) · 비가 하나면 QT 와 상관없이 그 줄 그대로
 *   돌려줌: {슬라브, 보, 못, 각: [지난 경사선 기울기 °]}
 */
export function 경사늘림(주, 구역들, 사슬들, k번) {
  const 결과 = { 슬라브: 0, 보: 0, 못: 0, 각: [] }
  const 구 = []
  for (const z of 구역들 || []) {
    if (!z.경사 || !Array.isArray(z.판) || z.판.length < 3) continue
    const 번 = String(z.p).split('|')[0], k = k번(+번) || 1
    const b = 상자(z.판.map((p) => [p[0] * k, p[1] * k]))
    const 경 = 경사높이(b, 사슬들)
    if (경) 구.push({ z, 번, k, 경 })
  }
  if (!구.length) return 결과
  const 둥 = (v) => Math.round(v)
  const 수 = (v) => { const n = parseFloat(String(v ?? '').replace(/,/g, '')); return Number.isFinite(n) ? n : null }
  const 글수 = (v) => Math.round(v).toLocaleString('en-US')
  /* 자리 하나 → {축, 비, 구역 이름} 또는 null */
  const 비찾기 = (a, 보) => {
    if (!a || !Array.isArray(a.r) || a.p == null) return null
    const 번 = String(a.p).split('|')[0]
    const c = [(a.r[0] + a.r[2]) / 2, (a.r[1] + a.r[3]) / 2]
    const q = 구.find((g) => g.번 === 번 && 안(c, g.z.판))
    if (!q) return null
    const k = q.k
    const x0 = a.r[0] * k, y0 = a.r[1] * k, x1 = a.r[2] * k, y1 = a.r[3] * k
    let 축들 = ['x', 'y']
    if (보) { const s = Array.isArray(a.축) && a.축.length >= 4 ? a.축 : [x0 / k, (y0 + y1) / 2 / k, x1 / k, (y0 + y1) / 2 / k]; 축들 = [Math.abs(s[2] - s[0]) >= Math.abs(s[3] - s[1]) ? 'x' : 'y'] }
    const out = {}
    let 있 = false
    for (const 축 of 축들) {
      const v = 축 === 'x' ? q.경.빗('x', x0, x1) : q.경.빗('y', y0, y1)
      if (v > 1.0005) { out[축] = Math.round(v * 1e5) / 1e5; out['각' + 축] = 축 === 'x' ? q.경.각('x', x0, x1) : q.경.각('y', y0, y1); 있 = true }
    }
    return 있 ? { ...out, 폭x: x1 - x0, 폭y: y1 - y0, 이름: q.z.이름 } : null
  }
  for (const 표 of ['슬라브', '보']) {
    const 줄 = 주[표] || []
    const n0 = 줄.length
    for (let i = 0; i < n0; i++) {
      const r = 줄[i]
      const 자 = Array.isArray(r._자리) ? r._자리 : []
      if (!자.length) continue
      const 비들 = 자.map((a) => 비찾기(a, 표 === '보'))
      if (!비들.some(Boolean)) continue
      const 무리 = new Map()
      비들.forEach((v, kk) => { const key = v ? (v.x || 1) + '|' + (v.y || 1) : '-'; if (!무리.has(key)) 무리.set(key, []); 무리.get(key).push(kk) })
      /* 줄을 나눠야 하는데(자리마다 비가 다름) QT 가 자리 수와 다르면(한 자리에 보 둘 — 현장 B RG1 QT 4 · 자리 2) 몇 개씩인지 몰라 손대지 않음 · 비가 하나면 줄 그대로 늘림 */
      if (무리.size > 1 && 수(r.QT) !== 자.length) { 결과.못++; continue }
      const 새줄 = []
      for (const [key, kks] of 무리) {
        const v = 비들[kks[0]]
        const nr = 무리.size === 1 ? r : { ...r, QT: String(kks.length), _자리: kks.map((kk) => 자[kk]), ...(Array.isArray(r._안) ? { _안: kks.map((kk) => r._안[kk]).filter(Boolean) } : {}) }
        if (key !== '-') {
          if (표 === '슬라브') {
            const Lx = 수(nr.단변), Ly = 수(nr.장변)
            if (!(Lx > 0 && Ly > 0)) { 결과.못++; 새줄.push(nr); continue }
            /* 자리 x 폭에 가까운 변 = x 방향 변 */
            const x단 = Math.abs(v.폭x - Lx) + Math.abs(v.폭y - Ly) <= Math.abs(v.폭x - Ly) + Math.abs(v.폭y - Lx)
            const 단비 = x단 ? (v.x || 1) : (v.y || 1), 장비 = x단 ? (v.y || 1) : (v.x || 1)
            const 단 = 둥(Lx * 단비), 장 = 둥(Ly * 장비)
            const 단각 = (x단 ? v.각x : v.각y) || [], 장각 = (x단 ? v.각y : v.각x) || []
            const 말 = []
            if (단비 > 1) 말.push('단변 ' + 글수(Lx) + ' → ' + 글수(단) + '(기울기 ' + 단각.map((a) => a + '°').join(' · ') + ')')
            if (장비 > 1) 말.push('장변 ' + 글수(Ly) + ' → ' + 글수(장) + '(기울기 ' + 장각.map((a) => a + '°').join(' · ') + ')')
            const 구멍 = 수(nr.개구부)
            const 안cc = 글(nr._안cc) === 글(nr.단변) + '|' + 글(nr.장변)
            Object.assign(nr, {
              단변: String(단), 장변: String(장),
              ...(구멍 > 0 ? { 개구부: String(Math.round(구멍 * 단비 * 장비 * 1e4) / 1e4) } : {}),
              ...(Array.isArray(nr._안) && 안cc ? { _안: nr._안.map((t) => (Array.isArray(t) ? (t[0] <= t[1] ? [둥(t[0] * 단비), 둥(t[1] * 장비)] : [둥(t[0] * 장비), 둥(t[1] * 단비)]) : t)), _안cc: 단 + '|' + 장 } : {}),
              _빗: '🏔 «' + v.이름 + '» 빗길이 — 평면 ' + 말.join(' · ') + ' (골조입면도 경사선)',
            })
            결과.슬라브 += kks.length
            결과.각.push(...단각, ...장각)
          } else {
            const 비 = v.x || v.y
            const L = 수(nr.길이), 좌 = 수(nr.좌단) || 0, 우 = 수(nr.우단) || 0
            if (!(L > 0)) { 결과.못++; 새줄.push(nr); continue }
            const Ln = L - 좌 - 우 > 0 ? L - 좌 - 우 : L
            const L2 = 둥(L + Ln * (비 - 1))
            const 보각 = (v.x ? v.각x : v.각y) || []
            Object.assign(nr, { 길이: String(L2), _빗: '🏔 «' + v.이름 + '» 빗길이 — 평면 안목 ' + 글수(Ln) + ' → ' + 글수(Ln * 비) + '(기울기 ' + 보각.map((a) => a + '°').join(' · ') + ') · 길이 ' + 글수(L) + ' → ' + 글수(L2) + ' (골조입면도 경사선)' })
            결과.보 += kks.length
            결과.각.push(...보각)
          }
        }
        새줄.push(nr)
      }
      if (새줄.length > 1) { 줄[i] = 새줄[0]; for (const t of 새줄.slice(1)) 줄.push(t) }
    }
  }
  결과.각 = [...new Set(결과.각)].sort((a, b) => b - a)
  return 결과
}
const 글 = (v) => String(v ?? '').trim()

/* ── ④ BIM 모델에서 올림 ───────────────────────────────── */
function 안(p, 판) {
  let 안쪽 = false
  for (let i = 0, j = 판.length - 1; i < 판.length; j = i++) {
    const a = 판[i], b = 판[j]
    if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]) 안쪽 = !안쪽
  }
  return 안쪽
}
function 선거리(p, a, b) { const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy || 1; const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2)); return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy) }
/** 판 안이거나 테두리에서 e mm 안 */
function 곁안(p, 판, e) { return 안(p, 판) || (e > 0 && 판.some((q, k) => 선거리(p, q, 판[(k + 1) % 판.length]) <= e)) }
const 상자 = (판) => { let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; for (const p of 판) { if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1] } return [x0, y0, x1, y1] }
/** 부재 판의 긴 축을 따라 점 n 개(기둥은 가운데 하나) */
function 점들(o, n = 20) {
  const b = 상자(o.판)
  if (o.종류 !== '벽') return [[(b[0] + b[2]) / 2, (b[1] + b[3]) / 2]]
  const out = []
  if (b[2] - b[0] >= b[3] - b[1]) for (let i = 0; i < n; i++) out.push([b[0] + (b[2] - b[0]) * (i + 0.5) / n, (b[1] + b[3]) / 2])
  else for (let i = 0; i < n; i++) out.push([(b[0] + b[2]) / 2, b[1] + (b[3] - b[1]) * (i + 0.5) / n])
  return out
}

/**
 * 지붕 높이 구역 아래 벽 · 기둥을 지붕까지 — 모델만들기의 ④ 높이 뒤(판은 이미 맞춘 자리)에 부름.
 *   구역들: 골조자동 R.읽음.지붕구역 [{p, 판(도면 단위), 높이 | 경사, 이름}] · 사슬들: R.읽음.지붕사슬
 *   f: {바닥(n), 위바닥(n), 다음층(n), 일층 (1층 바닥 mm)}
 *   ㉠ 구역의 평면(p)이 든 묶음의 옮김으로 모델 자리 · 그 평면의 보 · 슬래브가 든 층 = 올릴 층(그 층 위 바닥 = 지금 벽 · 기둥 윗면)
 *   ㉡ 그 층 벽 · 기둥(기초판 · 받침 · 겹침 빼고) 가운데 — 위층 벽 · 기둥이 30 % 넘게 덮은 것(위층이 이어 감) · 다른 평면의 그 층 바닥판(옥탑 바닥 7,600) 아래는 그대로
 *   ㉢ 나머지는 긴 축 점마다 든 구역(테두리 250 mm 안 — 바깥 벽은 구역 가장자리) 가운데 높은 지붕 · 안 든 점은 지금 윗면 → 평균이 50 mm 넘게 높으면 올림(o.지붕올림)
 *   ㉣ 구역 평면의 보 · 슬래브는 3D 에서만 그 높이로(물량 그대로)
 */
export function 구역올림(부재, 묶음들, 원점, 도면들, 구역들, 사슬들, f) {
  const 알림 = []
  if (!구역들 || !구역들.length) return { 알림, 벽: 0, 기둥: 0 }
  const 구 = []
  let 못찾은경사 = 0
  for (const z of 구역들) {
    const m = 묶음들.find((q) => !q.겹침 && q.부재.some((o) => o.평면 === z.p && !o.겹침))
    if (!m || !m.옮김) continue
    const 번 = +String(z.p).split('|')[0]
    const kd = (도면들[번] && 도면들[번].k) || 1
    const dx = m.옮김[0] - 원점.x, dy = m.옮김[1] - 원점.y
    const 판 = z.판.map((p) => [p[0] * kd + dx, p[1] * kd + dy])
    const 층셈 = new Map()
    for (const o of 부재) if (o.평면 === z.p && !o.겹침 && (o.종류 === '보' || o.종류 === '슬라브')) 층셈.set(o.층, (층셈.get(o.층) || 0) + 1)
    const 층 = [...층셈].sort((a, b) => b[1] - a[1])[0]
    if (!층) continue
    const b = 상자(판)
    let 높 = null, 경 = null
    if (z.경사) {
      경 = 경사높이(b, 사슬들)
      if (!경) { 못찾은경사++; continue }
      높 = (x, y) => f.일층 + 경.높이(x, y)
    } else if (Number.isFinite(+z.높이)) { const H = f.일층 + +z.높이; 높 = () => H }
    else continue
    구.push({ z, 판, b, 층: 층[0], 높, 경 })
  }
  if (못찾은경사) 알림.push('경사 지붕 구역 ' + 못찾은경사 + '곳은 골조입면도에서 길이가 맞는 경사선을 못 찾아 높이를 그대로 두었습니다')
  if (!구.length) return { 알림, 벽: 0, 기둥: 0 }
  let 벽 = 0, 기둥 = 0, 더 = 0
  for (const 층 of new Set(구.map((q) => q.층))) {
    const 이구 = 구.filter((q) => q.층 === 층)
    const 평면들 = new Set(이구.map((q) => q.z.p))
    const 위 = f.위바닥(층), 다음 = f.다음층(층)
    const 위층 = 다음 ? 부재.filter((o) => o.층 === 다음 && !o.겹침 && (o.종류 === '벽' || o.종류 === '기둥')) : []
    const 다른판 = 부재.filter((o) => o.층 === 층 && !o.겹침 && (o.종류 === '슬라브' || o.종류 === '계단') && !평면들.has(o.평면))
    for (const o of 부재) {
      if (o.층 !== 층 || o.겹침 || o.기초판 || o.받침높이 || (o.종류 !== '벽' && o.종류 !== '기둥')) continue
      if (!(Math.abs(o.z1 - 위) <= 1)) continue
      const P = 점들(o)
      if (P.filter((p) => 위층.some((u) => 곁안(p, u.판, 50))).length >= 0.3 * P.length) continue
      if (P.filter((p) => 다른판.some((s) => 곁안(p, s.판, 150))).length >= 0.5 * P.length) continue
      let 합 = 0, 든 = 0
      for (const p of P) {
        let h = null
        for (const q of 이구) if (p[0] >= q.b[0] - 250 && p[0] <= q.b[2] + 250 && p[1] >= q.b[1] - 250 && p[1] <= q.b[3] + 250 && 곁안(p, q.판, 250)) { const v = q.높(p[0], p[1]); if (h === null || v > h) h = v }
        if (h !== null && h > 위) { 합 += h; 든++ } else 합 += 위
      }
      if (!든) continue
      const hm = 합 / P.length
      if (hm <= 위 + 50) continue
      더 += (hm - 위)
      o.z1 = Math.round(hm)
      o.지붕올림 = true
      if (o.종류 === '벽') 벽++; else 기둥++
    }
    /* ㉣ 3D — 구역 평면의 보 · 슬래브를 그 지붕 높이로 */
    for (const o of 부재) {
      if (o.층 !== 층 || o.겹침 || !평면들.has(o.평면) || (o.종류 !== '보' && o.종류 !== '슬라브')) continue
      const b = 상자(o.판), c = [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2]
      let h = null
      for (const q of 이구) if (곁안(c, q.판, 0)) { const v = q.높(c[0], c[1]); if (h === null || v > h) h = v }
      if (h === null || h <= 위 + 50) continue
      const 두 = o.z1 - o.z0
      o.z1 = Math.round(h); o.z0 = o.z1 - 두; o.지붕높이 = true
    }
  }
  if (벽 || 기둥) {
    const 경사 = 구.filter((q) => q.경), 평 = 구.filter((q) => !q.경)
    const 입면 = 경사.length ? ' · 경사 지붕 ' + 경사.length + '곳은 골조입면도 경사선(' + [...new Set(경사.map((q) => [...new Set(q.경.맞은.map((m) => (m.낮 / 1000).toFixed(1) + ' ~ ' + (m.높 / 1000).toFixed(1) + ' m'))].join(', ')))].join(' / ') + ')' : ''
    알림.push('🏔 지붕 높이 구역 — 지붕 평면 «FL 레벨» 범례 ' + 평.length + '곳' + 입면 + '으로 벽 ' + 벽 + '개 · 기둥 ' + 기둥 + '개를 지붕까지 올렸습니다(평균 +' + ((더 / (벽 + 기둥)) / 1000).toFixed(2) + ' m)')
  }
  return { 알림, 벽, 기둥 }
}
