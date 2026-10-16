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
  }
}

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
