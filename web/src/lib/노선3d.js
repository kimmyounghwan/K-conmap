/**
 * 🛣 노선 3D — 평면도의 측점 글자 + 중심선 → 측점(m)마다 자리·방향 / 종단 표 → 측점마다 지반고·계획고 (2026-10-05 · G138)
 *
 * 소장님: 「횡단면도, 종단면도는 좌표로 찾기 힘들잖아. 이건 깊이 높이만 찾아 와야 하고..맞지?」
 *   → 자리는 평면도(측량에 맞춘 것)의 «측점» 에서, 높이는 종단·횡단에서 가져옵니다.
 *
 * ■ 노선찾기(측점글, 선들)
 *   ① 평면도의 측점 글자(NO.0 · NO 1 · No.1+10.00 · 0+120) — 자리는 이미 측량에 맞춘 뒤(mm)
 *   ② 중심선 레이어(중심선 · CENTER · CL · 선형) 선을 이어 줄로 만들고, 측점 글자를 그 줄에 내려 «줄 길이» 를 잽니다
 *   ③ 측점(m) = 줄 길이 + 시작값 — 측점 간격(20 · 25 · 50 · 100 m)은 줄 길이와 가장 잘 맞는 것으로 고릅니다
 *      (소장님 도면 08 은 NO 간격 50 m · 02 는 20 m — 도면마다 다릅니다)
 *   ④ 중심선이 없으면 측점 글자 자리를 이어 노선으로 씁니다(글자가 선 옆에 있어 몇 m 어긋날 수 있음 — 그렇게 적습니다)
 * ■ 종단표읽기(글자들) — 종단면도 아래 표: 측점 · 누가거리 · 지반고 · 계획고 줄을 머리 글자로 찾아 칸(x)끼리 묶습니다
 * ■ 노선열쇠(제목) — «송금지구 1호(중앙)배수로 종평면도(1/2)» 와 «… 횡단면도» 를 같은 노선으로 잇는 이름
 *
 * 좌표는 mm(화면과 같은 단위) · 측점은 m 입니다.
 */
import { 측점풀기, 간격고르기 } from './횡단3d.js'

const 붙 = (s) => String(s ?? '').normalize('NFKC').replace(/\s+/g, '')

/* ── 이름 ─────────────────────────────── */
const 끝말 = /(종\s*,?\s*횡\s*단\s*면\s*도|종횡단면도|종\s*평\s*면\s*도|종\s*단\s*면\s*도|횡\s*단\s*면\s*도|계\s*획\s*평\s*면\s*도|평\s*면\s*도|종단도|횡단도|평면도|계획도|일반도|노선도)$/
/** 도면 제목 → 노선 이름 열쇠 («송금지구1호(중앙)배수로» · «금동배수장») */
export function 노선열쇠(제목) {
  let s = String(제목 || '').normalize('NFKC').replace(/\.(dxf|dwg)$/i, '').replace(/^\s*\d{1,3}\s*[.)_-]\s*/, '')
  s = s.replace(/\s*[—-]\s*(평면|종단·표|종단)\s*$/, '')
  s = s.replace(/\(?\s*\d+\s*\/\s*\d+\s*\)?\s*$/, '')
  s = s.replace(/\s+/g, '')
  for (let k = 0; k < 2; k++) s = s.replace(끝말, '').replace(/(부근|일원|주변|구간)$/, '')
  return s
}
/** 도면 제목 → 화면에 보일 노선 이름(«송금지구 1호(중앙)배수로» · «금동배수장 부근») */
export function 노선이름(제목) {
  let s = String(제목 || '').normalize('NFKC').replace(/\.(dxf|dwg)$/i, '').replace(/^\s*\d{1,3}\s*[.)_-]\s*/, '')
  s = s.replace(/\s*[—-]\s*(평면|종단·표|종단)\s*$/, '').replace(/\(?\s*\d+\s*\/\s*\d+\s*\)?\s*$/, '').trim()
  for (let k = 0; k < 2; k++) s = s.replace(끝말, '').trim().replace(/\s*(철거|신설|기존)$/, '').trim()
  return s || String(제목 || '')
}
/** 두 노선 열쇠가 같은 노선인가 — 2 같음 · 1 한쪽이 다른 쪽을 품음(3글자 넘게) · 0 다름 */
export function 노선같음(a, b) {
  if (!a || !b) return 0
  if (a === b) return 2
  const [짧, 긴] = a.length <= b.length ? [a, b] : [b, a]
  return 짧.length >= 3 && 긴.includes(짧) ? 1 : 0
}

/* ── 선 → 줄 ─────────────────────────────── */
/** 선분들 [[ax,ay,bx,by]] → 이어진 줄들 [[x,y,…]] (끝점이 같으면 잇고, 갈림길에서 끊음 · 그다음 끝끼리 틈 이음) */
export function 줄잇기(선들0, 틈 = 500) {
  const 열 = (x, y) => Math.round(x) + ',' + Math.round(y)
  /* 같은 선이 두 번(갔다가 되돌아온 폴리선 · 겹쳐 그린 선) — 소장님 도면 08 의 3호 · 4호 · 5호 중심선은 «갔다 오는» 닫힌 선이라
     그대로 이으면 노선 길이가 두 배가 됐습니다 → 방향을 가리지 않고 같은 선은 하나만 */
  const 본 = new Set()
  const 선들 = []
  for (const s of 선들0) {
    const a = 열(s[0], s[1]), b = 열(s[2], s[3])
    const k = a < b ? a + '|' + b : b + '|' + a
    if (a === b || 본.has(k)) continue
    본.add(k); 선들.push(s)
  }
  const 이웃 = new Map()
  const 넣 = (k, i) => { let a = 이웃.get(k); if (!a) { a = []; 이웃.set(k, a) } a.push(i) }
  선들.forEach((s, i) => { if (Math.hypot(s[2] - s[0], s[3] - s[1]) > 1e-6) { 넣(열(s[0], s[1]), i); 넣(열(s[2], s[3]), i) } })
  const 씀 = new Uint8Array(선들.length)
  const 줄들 = []
  const 걷기 = (i0, 앞쪽) => {
    // i0 에서 시작해 앞쪽 끝 방향으로
    const 점 = []
    let i = i0, 끝 = 앞쪽
    const s0 = 선들[i0]
    if (끝) 점.push(s0[0], s0[1], s0[2], s0[3]); else 점.push(s0[2], s0[3], s0[0], s0[1])
    씀[i0] = 1
    for (;;) {
      const x = 점[점.length - 2], y = 점[점.length - 1]
      const a = (이웃.get(열(x, y)) || []).filter((j) => !씀[j])
      if (a.length !== 1 || (이웃.get(열(x, y)) || []).length > 2) break
      i = a[0]; 씀[i] = 1
      const s = 선들[i]
      if (열(s[0], s[1]) === 열(x, y)) 점.push(s[2], s[3]); else 점.push(s[0], s[1])
    }
    void 끝
    return 점
  }
  /* 끝(이웃 1개) 또는 갈림길에서 시작 */
  for (const [k, a] of 이웃) {
    if (a.length === 2) continue
    for (const i of a) {
      if (씀[i]) continue
      const s = 선들[i]
      const 앞 = 열(s[0], s[1]) === k
      줄들.push(걷기(i, 앞))
    }
  }
  for (let i = 0; i < 선들.length; i++) if (!씀[i] && Math.hypot(선들[i][2] - 선들[i][0], 선들[i][3] - 선들[i][1]) > 1e-6) 줄들.push(걷기(i, true))
  /* 끝끼리 틈 이음 (가까운 것부터) */
  let 바뀜 = true
  while (바뀜 && 줄들.length > 1) {
    바뀜 = false
    let best = null
    for (let a = 0; a < 줄들.length; a++) for (let b = a + 1; b < 줄들.length; b++) {
      const A = 줄들[a], B = 줄들[b]
      const Ae = [[A[0], A[1]], [A[A.length - 2], A[A.length - 1]]], Be = [[B[0], B[1]], [B[B.length - 2], B[B.length - 1]]]
      for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
        const d = Math.hypot(Ae[i][0] - Be[j][0], Ae[i][1] - Be[j][1])
        if (d <= 틈 && (!best || d < best.d)) best = { d, a, b, i, j }
      }
    }
    if (!best) break
    let A = 줄들[best.a], B = 줄들[best.b]
    if (best.i === 0) A = 뒤집기(A)
    if (best.j === 1) B = 뒤집기(B)
    줄들[best.a] = A.concat(B.slice(2))
    줄들.splice(best.b, 1)
    바뀜 = true
  }
  return 줄들.filter((p) => p.length >= 4)
}
const 뒤집기 = (p) => { const q = []; for (let i = p.length - 2; i >= 0; i -= 2) q.push(p[i], p[i + 1]); return q }

/** 줄 → 누적 길이 */
function 길이들(p) {
  const L = [0]
  for (let i = 2; i < p.length; i += 2) L.push(L[L.length - 1] + Math.hypot(p[i] - p[i - 2], p[i + 1] - p[i - 1]))
  return L
}
/** 점을 줄에 내림 → { t(줄 길이), d(떨어진 거리) } */
function 내리기(p, L, x, y) {
  let best = null
  for (let i = 0; i + 3 < p.length; i += 2) {
    const ax = p[i], ay = p[i + 1], bx = p[i + 2], by = p[i + 3]
    const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy
    let u = l2 ? ((x - ax) * dx + (y - ay) * dy) / l2 : 0
    u = Math.max(0, Math.min(1, u))
    const d = Math.hypot(x - (ax + u * dx), y - (ay + u * dy))
    if (!best || d < best.d) best = { d, t: L[i / 2] + u * Math.sqrt(l2) }
  }
  return best
}
/** 줄 위 길이 t 의 자리 · 방향 (줄 밖이면 끝 방향으로 곧게 늘임) */
function 줄자리(p, L, t) {
  const n = L.length
  let i
  if (t <= 0) i = 0
  else if (t >= L[n - 1]) i = n - 2
  else { let lo = 0, hi = n - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (L[m] <= t) lo = m; else hi = m } i = lo }
  const ax = p[2 * i], ay = p[2 * i + 1], bx = p[2 * i + 2], by = p[2 * i + 3]
  const l = Math.hypot(bx - ax, by - ay) || 1
  const tx = (bx - ax) / l, ty = (by - ay) / l
  const u = t - L[i]
  return { x: ax + tx * u, y: ay + ty * u, tx, ty }
}

const 가운데 = (a) => { if (!a.length) return NaN; const b = a.slice().sort((x, y) => x - y); return b[b.length >> 1] }
const 간격후보 = [20, 25, 50, 100, 200]
const m로 = (q, G) => (q.m != null ? q.m : q.n * G + q.d)
/** 측점 풀이({n,d} | {m}) → m (간격 G) */
export const 측점m로 = m로
/** 중심선 레이어 이름 — 중심선 · CENTER · CL · 선형 · ALIGNMENT */
export const 중심꼴 = /중심선|^중심|center|^c\.?l$|^cl[-_ ]|[-_ ]cl$|선형|alignment|algn[-_ ]?(cl|cntr|cen|line)/i

/**
 * 측점 글자 + 중심선 → 노선
 * @param 글들  [{ s(측점 글), x, y }]  (mm · 측량에 맞춘 뒤 · 여러 장(1/2 · 2/2)이면 같이 넣음)
 * @param 선들  중심선 후보 레이어별 { 층: [[ax,ay,bx,by] …] } (mm)
 * @returns null | { 근거, 층, 간격, 범위:[s0,s1](m), n, 모두, rms(m), 어긋(m · 글자와 선 사이), 토막, 자리(s) → {x,y,tx,ty} }
 *
 * 중심선은 한 줄이 아닐 때가 많습니다(소장님 도면 08 의 5호: 남쪽에서 올라오는 선 + 동쪽으로 가는 선이 따로 · 4호: 두 토막).
 * 그래서 줄(토막)마다 그 줄에 가까운 측점 글자로 따로 맞추고, 측점 차례대로 토막을 이어 씁니다(넘어가는 곳 = 두 토막이 가장 가까운 측점).
 */
export function 노선찾기(글들, 선들) {
  const 점 = []
  for (const t of 글들 || []) {
    const q = 측점풀기(t.s)
    if (q) 점.push({ q, x: t.x, y: t.y, s: t.s })
  }
  if (점.length < 2) return null
  const 모두km = 점.every((p) => p.q.m != null)
  /* 글자 사이 가장 짧은 거리 — 내려 붙일 반경 */
  const 간들 = []
  for (const a of 점) { let b = Infinity; for (const c of 점) if (c !== a && Math.hypot(a.x - c.x, a.y - c.y) > 1000) b = Math.min(b, Math.hypot(a.x - c.x, a.y - c.y)); if (Number.isFinite(b)) 간들.push(b) }
  const 반경 = Math.max(8000, Math.min(25000, 0.4 * (가운데(간들) || 20000)))

  /* ① 중심선 토막들 — 측점 글자를 가장 가까운 토막에 내림 */
  const 토막들 = []
  for (const [층, 선] of Object.entries(선들 || {})) {
    if (!선 || !선.length) continue
    for (const p of 줄잇기(선, 2000)) {
      const L = 길이들(p)
      if (L[L.length - 1] >= 5000) 토막들.push({ 층, p, L, 글: [] })
    }
  }
  const 내림들 = 점.map((a) => 토막들.map((토) => ({ 토, r: 내리기(토.p, 토.L, a.x, a.y) })).filter((o) => o.r && o.r.d <= 반경).sort((u, v) => u.r.d - v.r.d))
  const 붙이기 = (쓸토막) => {
    for (const 토 of 토막들) 토.글 = []
    점.forEach((a, i) => {
      const o = 내림들[i].find((x) => !쓸토막 || 쓸토막.has(x.토))
      if (o) o.토.글.push({ q: a.q, t: o.r.t / 1000, d: o.r.d / 1000 })
    })
  }
  붙이기(null)
  /* 글자 하나만 붙은 짧은 토막(끝 마무리 선 등)은 버리고, 그 글자는 다음으로 가까운 토막에 다시 붙임(소장님 도면 08 의 4호 끝 «NO 6+40.40») */
  const 쓸 = new Set(토막들.filter((토) => 토.글.length >= 2))
  if (쓸.size && 쓸.size < 토막들.filter((토) => 토.글.length).length) 붙이기(쓸)
  /* 간격 — 글자가 가장 많이 붙은 토막으로 정하고, 다른 토막은 같은 간격으로 */
  const 큰 = 토막들.filter((토) => 토.글.length >= 2).sort((a, b) => b.글.length - a.글.length)
  let 간격 = null
  for (const 토 of 큰) { const 맞 = 맞추기(토.글, 모두km, null); if (맞 && 맞.n >= Math.min(3, 토.글.length)) { 간격 = 맞.간격; break } }
  let 조각 = []
  if (간격 != null) {
    for (const 토 of 큰) {
      const 맞 = 맞추기(토.글, 모두km, 간격)
      if (맞) 조각.push({ ...토, 맞, 어긋: 가운데(토.글.map((g) => g.d)), 아래: Math.min(...맞.측들), 위: Math.max(...맞.측들) })
    }
    /* 같은 측점을 두 토막이 덮으면(같은 선을 두 레이어 · 사본) 글자가 많은 쪽 */
    조각.sort((a, b) => b.맞.n - a.맞.n || a.맞.rms - b.맞.rms)
    const 남 = []
    for (const z of 조각) {
      const 겹 = 남.some((y) => { const lo = Math.max(y.아래, z.아래), hi = Math.min(y.위, z.위); return hi - lo > 0.5 * Math.max(1e-6, z.위 - z.아래) && z.위 - z.아래 > 0 })
      if (!겹) 남.push(z)
    }
    조각 = 남.sort((a, b) => a.아래 - b.아래)
  }
  const 모든n = 조각.reduce((s, z) => s + z.맞.n, 0)
  if (조각.length && 모든n >= Math.min(3, 점.length)) {
    const 토자리 = (z, s) => {
      const t = (z.맞.방향 * (s - z.맞.c)) * 1000 / z.맞.k
      const r = 줄자리(z.p, z.L, t)
      return { x: r.x, y: r.y, tx: r.tx * z.맞.방향, ty: r.ty * z.맞.방향 }
    }
    /* 넘어가는 측점 — 앞 토막 마지막 글자 ~ 다음 토막 첫 글자 사이에서 두 토막 자리가 가장 가까운 곳 */
    const 넘 = []
    for (let i = 0; i + 1 < 조각.length; i++) {
      const A = 조각[i], B = 조각[i + 1]
      let lo = Math.min(A.위, B.아래), hi = Math.max(A.위, B.아래)
      const 여유 = 0.25 * 간격
      lo -= 여유; hi += 여유
      let best = { s: (A.위 + B.아래) / 2, d: Infinity }
      for (let k = 0; k <= 60; k++) {
        const s = lo + (hi - lo) * k / 60
        const a = 토자리(A, s), b = 토자리(B, s), d = Math.hypot(a.x - b.x, a.y - b.y)
        if (d < best.d) best = { s, d }
      }
      넘.push(best.s)
    }
    const 자리 = (s) => { let i = 0; while (i < 넘.length && s > 넘[i]) i++; return 토자리(조각[i], s) }
    const 측들 = 조각.flatMap((z) => z.맞.측들)
    const rms = Math.sqrt(조각.reduce((a, z) => a + z.맞.rms * z.맞.rms * z.맞.n, 0) / 모든n)
    return {
      근거: '중심선', 층: [...new Set(조각.map((z) => z.층))].join(' · '), 간격, n: 모든n, 모두: 점.length, rms, 토막: 조각.length,
      어긋: 가운데(조각.map((z) => z.어긋)), 축척: 조각[0].맞.k,
      범위: [Math.min(...측들), Math.max(...측들)], 자리,
    }
  }

  /* ② 중심선이 없으면 — 측점 글자 자리를 이은 꺾은선(글자가 선 옆에 있어 몇 m 어긋날 수 있음) */
  let best = null
  for (const G of 모두km ? [1] : 간격후보) {
    const a = 점.map((p) => ({ ...p, m: m로(p.q, G) })).sort((u, v) => u.m - v.m)
    const 고른 = []
    for (const p of a) if (!고른.length || p.m - 고른[고른.length - 1].m > 0.5) 고른.push(p)
    if (고른.length < 2) continue
    const 비 = []
    for (let i = 1; i < 고른.length; i++) {
      const ds = 고른[i].m - 고른[i - 1].m, dd = Math.hypot(고른[i].x - 고른[i - 1].x, 고른[i].y - 고른[i - 1].y) / 1000
      if (ds > 0.5) 비.push(Math.abs(dd / ds - 1))
    }
    const e = 가운데(비)
    if (!best || e < best.e) best = { e, G, 고른 }
  }
  if (!best || !(best.e < 0.15) || best.고른.length < 3) return null
  /* 너무 붙은 글자(1 m 사이 «No.0+18.89 · No.1+0.00») 로 방향을 잡으면 흔들려서 — 5 m 넘게 떨어진 것만 이음(처음 · 끝은 둠) */
  const Q = []
  for (const p of best.고른) if (!Q.length || p.m - Q[Q.length - 1].m >= 5) Q.push(p)
  const 끝 = best.고른[best.고른.length - 1]
  if (Q[Q.length - 1] !== 끝) { if (Q.length > 1 && 끝.m - Q[Q.length - 1].m < 5) Q[Q.length - 1] = 끝; else Q.push(끝) }
  /* 엇나간 글자(이웃과 길이가 안 맞음) 빼기 */
  const 남 = Q.filter((p, i) => {
    const 앞 = Q[i - 1], 뒤 = Q[i + 1]
    const ok = (o) => !o || Math.abs(Math.hypot(o.x - p.x, o.y - p.y) / 1000 / Math.max(0.5, Math.abs(o.m - p.m)) - 1) < 0.3
    return ok(앞) || ok(뒤)
  })
  if (남.length < 3) return null
  const 자리 = (s) => {
    let i = 0
    while (i < 남.length - 2 && 남[i + 1].m < s) i++
    const A = 남[i], B = 남[i + 1]
    const l = Math.hypot(B.x - A.x, B.y - A.y) || 1
    const tx = (B.x - A.x) / l, ty = (B.y - A.y) / l
    const u = (s - A.m) * 1000 * (l / 1000 / Math.max(0.5, B.m - A.m))
    return { x: A.x + tx * u, y: A.y + ty * u, tx, ty }
  }
  return { 근거: '측점 글자', 층: '', 간격: best.G, n: 남.length, 모두: 점.length, rms: best.e, 어긋: NaN, 축척: 1, 토막: 1,
    범위: [남[0].m, 남[남.length - 1].m], 자리 }
}

/**
 * 측점(q) ↔ 줄 길이(t, m) → 측점 = c + 방향·t·k (k ≈ 1). 간격은 후보 중 가장 잘 맞는 것(또는 정해 준 것).
 * @returns null | { 간격, 방향, c, k, n, rms, 측들 }
 */
function 맞추기(o, 모두km, 정한간격 = null) {
  let best = null
  const 후보 = 모두km ? [1] : 정한간격 != null ? [정한간격] : 간격후보
  for (const G of 후보) {
    const s = o.map((p) => m로(p.q, G))
    for (const 방향 of [1, -1]) {
      for (const 자유 of [false, true]) {
        let k = 1
        if (자유) {
          /* 축척이 다를 때(도면 단위 · 축척) — 두 점씩 기울기의 가운데 값(Theil–Sen) */
          const 기울 = []
          for (let i = 0; i < o.length; i++) for (let j = i + 1; j < o.length; j++) { const dt = o[j].t - o[i].t; if (Math.abs(dt) > 1) 기울.push((s[j] - s[i]) / (방향 * dt)) }
          k = 가운데(기울)
          if (!(k > 0.5 && k < 2) || Math.abs(k - 1) < 0.02) continue
        }
        const c = 가운데(o.map((p, i) => s[i] - 방향 * p.t * k))
        const 틀 = Math.max(3, 0.12 * G)
        const 안 = o.map((p, i) => ({ i, e: s[i] - (c + 방향 * p.t * k) })).filter((x) => Math.abs(x.e) <= 틀)
        if (안.length < 2) continue
        const c2 = c + 가운데(안.map((x) => x.e))      // 가운데 값 — 굽은 곳 글자(모서리에서 옆 선에 내려앉음) 하나에 끌려가지 않게
        const e2 = 안.map((x) => s[x.i] - (c2 + 방향 * o[x.i].t * k))
        const rms = Math.sqrt(e2.reduce((a, e) => a + e * e, 0) / e2.length)
        /* 같은 측점 글자가 여럿(표 · 다른 노선)이어도 한 번만 셉니다 */
        const n = new Set(안.map((x) => s[x.i].toFixed(1))).size
        if (n < 2) continue
        const 점수 = n * 10 - rms - (자유 ? 5 : 0)
        if (!best || 점수 > best.점수) best = { 점수, 간격: G, 방향, c: c2, k, n, rms, 측들: 안.map((x) => s[x.i]) }
      }
    }
  }
  return best && best.rms < 4 ? best : null
}

/* ── 종단 표 ─────────────────────────────── */
const 머리꼴 = {
  측점: /^(측점|STA(TION)?\.?|측점번호)$/i,
  누가: /^(누가|누가거리|누적거리|추가거리|누가연장|누적연장)$/,
  지반: /^(지반고|지반표고|현지반고|현황지반고|현황고|G\.?H\.?)$/i,
  계획: /^(계획고|계획표고|계획하상고|계획저고|계획관저고|계획바닥고|시공기면고|F\.?H\.?)$/i,
}
const 수 = (s) => { const t = 붙(s).replace(/^\(([-+])\)/, '$1').replace(/^EL\.?=?/i, ''); return /^[-+]?\d+(\.\d+)?$/.test(t) ? parseFloat(t) : NaN }

/**
 * 종단면도 표 → 측점마다 높이
 * @param texts  [{s, x, y, h}]  (그 박스 글자 — 도면 좌표 그대로)
 * @returns null | { 줄: [{ m, 글, 지반고, 계획고 }], 근거 }
 */
export function 종단표읽기(texts) {
  const T = (texts || []).filter((t) => t && t.s)
  const 머리 = []
  for (const t of T) {
    const c = 붙(t.s)
    for (const [k, re] of Object.entries(머리꼴)) if (re.test(c)) { 머리.push({ k, x: t.x, y: t.y, h: t.h || 1 }); break }
  }
  const 있 = (k) => 머리.some((m) => m.k === k)
  if (!(있('지반') || 있('계획')) || !(있('누가') || 있('측점'))) return null
  /* 머리 칸(왼쪽 세로 줄) — 같은 x 띠의 다른 글자(점간 · 절토 · 성토 · 구배 …)도 줄 머리로 봅니다 */
  const hx = 가운데(머리.map((m) => m.h))
  const 왼 = Math.min(...머리.map((m) => m.x)) - 2 * hx, 오 = Math.max(...머리.map((m) => m.x)) + 2 * hx
  const 줄머리 = 머리.slice()
  for (const t of T) {
    if (t.x < 왼 || t.x > 오 || Number.isFinite(수(t.s))) continue
    const c = 붙(t.s)
    if (!c || c.length > 8 || 머리.some((m) => Math.abs(m.x - t.x) < 1e-6 && Math.abs(m.y - t.y) < 1e-6)) continue
    if (!/[가-힣A-Z]/i.test(c)) continue
    줄머리.push({ k: '딴', x: t.x, y: t.y, h: t.h || 1 })
  }
  const 위 = Math.max(...머리.map((m) => m.y)) + 4 * hx, 아래 = Math.min(...머리.map((m) => m.y)) - 4 * hx
  const 줄찾기 = (t) => {
    let b = null
    for (const m of 줄머리) { const d = Math.abs(t.y - m.y); if (!b || d < b.d) b = { d, m } }
    return b && b.d < 3 * hx ? b.m.k : null
  }
  const 칸 = { 측점: [], 누가: [], 지반: [], 계획: [] }
  for (const t of T) {
    if (t.x <= 오 || t.y > 위 || t.y < 아래) continue
    const k = 줄찾기(t)
    if (!k || k === '딴') continue
    if (k === '측점') { 칸.측점.push(t); continue }
    const v = 수(t.s)
    if (Number.isFinite(v)) 칸[k].push({ x: t.x, v, h: t.h || hx })
  }
  /* 기둥(측점마다 x) — 누가거리가 있으면 그것으로(바로 m), 없으면 측점 글자(NO.n · +d)로 */
  let 기둥 = []
  if (칸.누가.length >= 2) 기둥 = 칸.누가.map((o) => ({ x: o.x, m: o.v, 글: '' }))
  if (칸.측점.length) {
    const a = 칸.측점.slice().sort((p, q) => p.x - q.x)
    const 풀 = []
    let n = null
    for (const t of a) {
      const c = 붙(t.s).toUpperCase()
      let q = 측점풀기(c)
      if (!q) { const m = c.match(/^\+(\d{1,4}(\.\d+)?)$/); if (m && n != null) q = { n, d: +m[1] } }
      if (q && q.n != null) n = q.n
      if (q) 풀.push({ x: t.x, q, 글: t.s.trim() })
    }
    if (!기둥.length && 풀.length >= 2) {
      const G = 간격고르기(풀.map((p) => p.q))
      기둥 = 풀.map((p) => ({ x: p.x, m: m로(p.q, G), 글: p.글 }))
    } else if (기둥.length) {
      for (const b of 기둥) { let best = null; for (const p of 풀) { const d = Math.abs(p.x - b.x); if (!best || d < best.d) best = { d, p } } if (best && best.d < 2 * hx) { b.글 = best.p.글; b.q = best.p.q } }
      /* 누가거리는 표 첫 칸부터 잰 길이 — 첫 칸이 «NO.0-7.0» 이면 측점과 7 m 어긋납니다(소장님 도면 08 의 2호).
         측점 글자가 붙은 칸으로 간격과 어긋남을 정해 측점(m)으로 바꿉니다 */
      const 붙은 = 기둥.filter((b) => b.q)
      if (붙은.length) {
        let best = null
        for (const G of 붙은.every((b) => b.q.m != null) ? [1] : 간격후보) {
          const 차 = 붙은.map((b) => m로(b.q, G) - b.m)
          const 가 = 가운데(차), 퍼짐 = Math.max(...차) - Math.min(...차)
          if (!best || 퍼짐 < best.퍼짐) best = { 퍼짐, 가 }
        }
        if (best && best.퍼짐 < 1) for (const b of 기둥) b.m += best.가
      }
    }
  }
  if (기둥.length < 2) return null
  기둥.sort((a, b) => a.x - b.x)
  const 사이 = []
  for (let i = 1; i < 기둥.length; i++) 사이.push(기둥[i].x - 기둥[i - 1].x)
  const 틀 = Math.max(1.5 * hx, 0.35 * Math.min(...사이.filter((d) => d > 1e-6), Infinity))
  const 값찾기 = (arr, x) => { let b = null; for (const o of arr) { const d = Math.abs(o.x - x); if (d <= 틀 && (!b || d < b.d)) b = { d, v: o.v } } return b ? b.v : null }
  const 줄 = []
  for (const b of 기둥) {
    const 지반고 = 값찾기(칸.지반, b.x), 계획고 = 값찾기(칸.계획, b.x)
    if (지반고 == null && 계획고 == null) continue
    줄.push({ m: b.m, 글: b.글 || '', 지반고, 계획고 })
  }
  줄.sort((a, b) => a.m - b.m)
  const 고른 = []
  for (const r of 줄) if (!고른.length || Math.abs(r.m - 고른[고른.length - 1].m) > 1e-6) 고른.push(r)
  if (고른.length < 3) return null
  return { 줄: 고른, 근거: 칸.누가.length >= 2 ? '누가거리' : '측점' }
}

/* ── 노선 위로 얹기 ─────────────────────────────── */
/**
 * 곧게 편 횡단(X = 측점 mm · Y = 중심에서 오른쪽 + mm · Z = 표고 mm) 버킷을 노선 위로 옮깁니다(제자리에서 바꿈).
 * ⚠️ 횡단면도는 «측점이 커지는 쪽(종점 쪽)을 보고» 그립니다 — 도면 오른쪽 = 진행 방향 오른쪽.
 *    소장님 도면(GPS + 02 · 03 · 04 · 08)으로 확인: 이렇게 놓으면 땅 면과 GPS 측량점 높이 차이 가운데 0.15 m(385점) ·
 *    좌우를 뒤집으면 0.55 m — 이 방향이 맞습니다.
 * @param 측바꿈  (옛 측점 m) → 새 측점 m (횡단 도면과 평면도의 측점 간격이 다를 때)
 */
export function 노선에얹기(out, 노선, 측바꿈 = null) {
  const 캐시 = new Map()
  const 자 = (x) => { let r = 캐시.get(x); if (!r) { r = 노선.자리(측바꿈 ? 측바꿈(x / 1000) : x / 1000); 캐시.set(x, r) } return r }
  for (const [, b] of out) {
    for (const arr of [b.pos, b.pts, b.tri]) {
      if (!arr) continue
      const a = arr.a
      for (let i = 0; i < arr.n; i += 3) {
        const P = 자(a[i]), o = a[i + 1]
        a[i] = P.x + o * P.ty; a[i + 1] = P.y - o * P.tx
      }
    }
  }
}

/**
 * 종단 표 줄 → 노선 위 3D 선 (지반선 · 계획선 · 측점마다 계획고~지반고 깃)
 * @returns Map(층키 → 버킷)
 */
export function 종단선(줄, 노선, 새버킷, 머리) {
  const out = new Map()
  const 색 = { '종단 지반선': [176, 132, 80], '종단 계획선': [80, 160, 255], '종단 깃': [150, 150, 150] }
  const 선 = (ly, p, q) => {
    const k = 머리 + '\u0001' + ly
    let b = out.get(k); if (!b) { b = 새버킷(); out.set(k, b) }
    const c = 색[ly]
    b.pos.push6(p[0], p[1], p[2], q[0], q[1], q[2]); b.col.push3(c[0], c[1], c[2]); b.col.push3(c[0], c[1], c[2])
  }
  for (const [k, ly] of [['지반고', '종단 지반선'], ['계획고', '종단 계획선']]) {
    const a = 줄.filter((r) => r[k] != null)
    for (let i = 0; i + 1 < a.length; i++) {
      const A = a[i], B = a[i + 1]
      const 칸 = Math.max(1, Math.ceil((B.m - A.m) / 5))       // 5 m 마다 — 노선이 휘면 따라 휘게
      let 앞 = null
      for (let j = 0; j <= 칸; j++) {
        const m = A.m + (B.m - A.m) * j / 칸, z = (A[k] + (B[k] - A[k]) * j / 칸) * 1000
        const P = 노선.자리(m), p = [P.x, P.y, z]
        if (앞) 선(ly, 앞, p)
        앞 = p
      }
    }
  }
  for (const r of 줄) if (r.지반고 != null && r.계획고 != null && Math.abs(r.지반고 - r.계획고) > 1e-6) { const P = 노선.자리(r.m); 선('종단 깃', [P.x, P.y, r.계획고 * 1000], [P.x, P.y, r.지반고 * 1000]) }
  return out
}
