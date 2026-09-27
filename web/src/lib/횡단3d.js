/**
 * 🛣 횡단면도로 세우기 — 2D 횡단면도(높이가 «글자» 로만 적힌 도면)를 3D 로 (2026-09-27)
 *
 * 소장님: 「각각의 dxf캐드를 넣으면 3d로 나와야 하는데...그냥 예전 도면이야. 왜 이러는 거지? 고쳐줘.
 *          그럼, 횡단면도를 넣어 주면 가능하다는 거야? 높이가 있는 도면을 넣어 주면 자동으로 나와.」 · (소장님 도면으로 시험)
 *
 * ■ 무엇을 읽나 (도면마다 따로)
 *   ① 측점 — 「NO.」 옆 「0+10.00」(NO 간격 20m) · 「NO.3+5」 · 「STA.0+020」 · 「0+020.000」
 *   ② 그 측점 표의 「지반고」 값 (없으면 「계획고」)
 *   ③ 표 바로 위에 그려진 단면 — 가운데 표시(TICK·CL·중심) 또는 표 가운데를 중심선으로,
 *      지반선 레이어가 중심선과 만나는 높이 = 지반고 → 도면 높이를 표고(m)로 바꿈
 *   ④ 도면 단위 — 단면 폭이 수백을 넘으면 mm 로 그린 것으로 봄(÷1000). 아니면 m
 * ■ 어떻게 세우나
 *   측점 순서대로 한 줄(곧은 축)에 늘어놓습니다: X = 측점(m), Y = 중심에서 떨어진 거리, Z = 표고.
 *   선은 레이어 그대로, 지반선은 이웃 단면끼리 이어 «땅 면» 을, 계획선(터파기·계획)은 «계획 면» 을 만듭니다.
 *   (평면도의 노선 곡선을 따라 휘게 놓는 것은 다음 차례 — 지금은 곧게 폅니다)
 * ■ 좌표는 mm 로 냅니다(건물 세우기와 같은 단위 — 화면의 높이·자 표시가 같게).
 */

const 붙 = (s) => String(s ?? '').replace(/\s+/g, '')
const 수글 = /^[-+]?\(?[-+]?\)?\d+(\.\d+)?$/
function 값(s) {
  // «(-)2.17» · «-2.17» · «+1.5» · «1.96»
  const t = 붙(s).replace(/^EL\.?=?/i, '').replace(/^\(([-+])\)/, '$1')
  return /^[-+]?\d+(\.\d+)?$/.test(t) ? parseFloat(t) : NaN
}

/** 측점 글자 → m (NO 간격 20m). 못 읽으면 NaN */
export function 측점m(글, 앞NO = false) {
  const c = 붙(글).toUpperCase().replace(/^측점[:=]?/, '')
  let m = c.match(/^NO\.?(\d{1,4})(?:([+-])(\d{1,3}(?:\.\d+)?))?$/)
  if (m) { const v = +m[1] * 20; return m[3] ? (m[2] === '+' ? v + +m[3] : v - +m[3]) : v }
  m = c.match(/^STA\.?(\d{1,3})([+-])(\d{1,4}(?:\.\d+)?)$/)
  if (m) return m[2] === '+' ? +m[1] * 1000 + +m[3] : +m[1] * 1000 - +m[3]
  m = c.match(/^(\d{1,4})([+-])(\d{1,4}(?:\.\d+)?)$/)
  if (m) {
    if (앞NO) return +m[1] * 20 + (m[2] === '+' ? +m[3] : -m[3])
    if (/^\d{3}/.test(m[3])) return +m[1] * 1000 + (m[2] === '+' ? +m[3] : -m[3])
  }
  return NaN
}

const 수평 = (t) => !t.a || Math.abs(((t.a % 180) + 180) % 180) < 3
const 빼는층 = /^[_#!★\-\s]*(text|글|문자|dim|치수|hatch|해치|defpoints|도곽|sheet|border|form|title|table|테이블|tick|지번)/i
const 땅층 = /지반|원지반|현황지반|현지반|^EG$|^E\.G|GROUND|G\.?L\b|토사선/i
const 계획층 = /계획|터파기|^FG$|F\.?G\b|FL\b|포장|노면|설계선/i

/** 도면 하나에서 횡단면 찾기 */
export function 단면찾기(raw) {
  const T = raw.texts || []
  const 라벨 = []
  for (let i = 0; i < T.length; i++) {
    const t = T[i]
    if (!수평(t)) continue
    const c = 붙(t.s).toUpperCase()
    if (c.length > 26) continue
    let v = NaN, 글 = t.s.trim(), 값칸 = -1
    if (c === 'NO.' || c === 'NO') {
      // 같은 줄 오른쪽 가까이의 «0+10.00»
      let best = -1, bd = Infinity
      for (let j = 0; j < T.length; j++) {
        const u = T[j]
        if (j === i || Math.abs(u.y - t.y) > 0.6 * t.h) continue
        const dx = u.x - t.x
        if (dx <= 0 || dx > 14 * t.h) continue
        if (!/^\d+[+-]\d+(\.\d+)?$/.test(붙(u.s))) continue
        if (dx < bd) { bd = dx; best = j }
      }
      if (best < 0) continue
      v = 측점m(T[best].s, true); 글 = 'NO.' + 붙(T[best].s); 값칸 = best
    } else if (/^(NO\.?\d|STA\.?\d|측점)/.test(c) || /^\d{1,3}\+\d{3}(\.\d+)?$/.test(c)) {
      v = 측점m(c)
    }
    if (!Number.isFinite(v)) continue
    라벨.push({ i, 글, 측: v, x: t.x, y: t.y, h: t.h, 값칸 })
  }
  if (라벨.length < 2) return []
  /* 표 안 값: 「지반고」「계획고」 글자와 같은 줄 오른쪽 숫자 */
  const 칸값 = (L, 이름) => {
    const h = L.h
    for (let j = 0; j < T.length; j++) {
      const u = T[j]
      if (붙(u.s) !== 이름) continue
      if (Math.abs(u.x - L.x) > 20 * h || u.y > L.y + 0.5 * h || u.y < L.y - 6 * h) continue
      let best = NaN, bd = Infinity
      for (let k = 0; k < T.length; k++) {
        const w = T[k]
        if (Math.abs(w.y - u.y) > 0.6 * h) continue
        const dx = w.x - u.x
        if (dx <= 0 || dx > 16 * h) continue
        const n = 값(w.s)
        if (!Number.isFinite(n)) continue
        if (dx < bd) { bd = dx; best = n }
      }
      if (Number.isFinite(best)) return best
    }
    return NaN
  }
  /* 표 네모(그 측점 표의 글자들) — 라벨에서 아래로 */
  const 표네모 = (L) => {
    let x0 = L.x, x1 = L.x, y0 = L.y
    for (const u of T) {
      if (u.y > L.y + 0.6 * L.h || u.y < L.y - 12 * L.h) continue
      if (u.x < L.x - 22 * L.h || u.x > L.x + 40 * L.h) continue
      if (Math.abs(u.h - L.h) > 0.3 * L.h) continue
      x0 = Math.min(x0, u.x); x1 = Math.max(x1, u.x + 붙(u.s).length * u.h * 0.8); y0 = Math.min(y0, u.y)
    }
    return { x0, x1, y0, y1: L.y + L.h }
  }
  /* 열(세로로 쌓인 단면) 간격 — 가로로 가장 가까운 다른 열까지. 옆 열이 없는 끝 열은 다른 열들의 가운데 값 */
  const 폭들 = []
  for (const L of 라벨) {
    const d = 라벨.filter((M) => Math.abs(M.x - L.x) >= 10 * L.h && Math.abs(M.y - L.y) < 30 * L.h).map((M) => Math.abs(M.x - L.x))
    if (d.length) 폭들.push(Math.min(...d))
  }
  폭들.sort((a, b) => a - b)
  const 라벨폭중간 = 폭들.length ? 폭들[폭들.length >> 1] : 0
  const out = []
  for (const L of 라벨) {
    const 지반고 = 칸값(L, '지반고'), 계획고 = 칸값(L, '계획고')
    if (!Number.isFinite(지반고) && !Number.isFinite(계획고)) continue
    const 표 = 표네모(L)
    const 위 = 라벨.filter((M) => M !== L && Math.abs(M.x - L.x) < 4 * L.h && M.y > L.y + 2 * L.h).sort((a, b) => a.y - b.y)[0]
    /* 옆 열: 가로로 떨어져 있고 높이가 비슷한(같은 줄의) 측점 표 — 다른 곳(종단면도 표 등)의 측점 글자는 빼고 */
    const 옆 = 라벨.filter((M) => Math.abs(M.x - L.x) >= 10 * L.h && Math.abs(M.y - L.y) < 30 * L.h).map((M) => Math.abs(M.x - L.x))
    const 폭 = 옆.length ? Math.min(...옆) : (라벨폭중간 || 120 * L.h)
    let 윗끝
    if (위) { const 위표 = 표네모(위); 윗끝 = 위표.y0 - 0.5 * L.h } else 윗끝 = 표.y1 + Math.min(폭 * 0.6, 60 * L.h)
    const cx0 = (표.x0 + 표.x1) / 2
    out.push({ ...L, 지반고, 계획고, 창: [cx0 - 폭 * 0.48, 표.y1 + 0.2 * L.h, cx0 + 폭 * 0.48, 윗끝], cx0 })
  }
  return out
}

/** 선분을 네모 안으로 자르기 (Liang–Barsky) → [ax,ay,bx,by] | null */
function 자르기(ax, ay, bx, by, x0, y0, x1, y1) {
  let t0 = 0, t1 = 1
  const dx = bx - ax, dy = by - ay
  const p = [-dx, dx, -dy, dy], q = [ax - x0, x1 - ax, ay - y0, y1 - ay]
  for (let k = 0; k < 4; k++) {
    if (p[k] === 0) { if (q[k] < 0) return null; continue }
    const r = q[k] / p[k]
    if (p[k] < 0) { if (r > t1) return null; if (r > t0) t0 = r } else { if (r < t0) return null; if (r < t1) t1 = r }
  }
  return [ax + t0 * dx, ay + t0 * dy, ax + t1 * dx, ay + t1 * dy]
}
/** 창 안의 선 조각들 (레이어별) — 창에 걸친 선은 창 테두리에서 자릅니다(긴 지반선이 창 밖까지 그려진 도면) */
function 창선(raw, 창) {
  const [x0, y0, x1, y1] = 창
  const 조각 = new Map()
  for (const [ly, b] of raw.out) {
    if (빼는층.test(ly)) continue
    const a = b.pos.a
    let arr = null
    for (let i = 0; i < b.pos.n; i += 6) {
      const ax = a[i], ay = a[i + 1], bx = a[i + 3], by = a[i + 4]
      if (Math.max(ax, bx) < x0 || Math.min(ax, bx) > x1 || Math.max(ay, by) < y0 || Math.min(ay, by) > y1) continue
      const c = 자르기(ax, ay, bx, by, x0, y0, x1, y1)
      if (!c || (Math.abs(c[2] - c[0]) < 1e-9 && Math.abs(c[3] - c[1]) < 1e-9)) continue
      if (!arr) { arr = []; 조각.set(ly, arr) }
      arr.push([c[0], c[1], c[2], c[3], b.col.a[i], b.col.a[i + 1], b.col.a[i + 2]])
    }
  }
  return 조각
}
/** x 에서 선 조각들의 y (여럿이면 가장 위) */
function y에서(조각들, x) {
  let best = NaN
  for (const s of 조각들) {
    const [ax, ay, bx, by] = s
    if (Math.abs(bx - ax) < 1e-12) continue
    const lo = Math.min(ax, bx), hi = Math.max(ax, bx)
    if (x < lo - 1e-9 || x > hi + 1e-9) continue
    const y = ay + (by - ay) * (x - ax) / (bx - ax)
    if (!(y <= best)) best = y
  }
  return best
}
function y에서아래(조각들, x) {
  let best = NaN
  for (const s of 조각들) {
    const [ax, ay, bx, by] = s
    if (Math.abs(bx - ax) < 1e-12) continue
    const lo = Math.min(ax, bx), hi = Math.max(ax, bx)
    if (x < lo - 1e-9 || x > hi + 1e-9) continue
    const y = ay + (by - ay) * (x - ax) / (bx - ax)
    if (!(y >= best)) best = y
  }
  return best
}

/**
 * 도면 하나 → 3D 버킷
 * @param raw     parseDxf(…, {raw:true})
 * @param 새버킷  () => ({pos, col, pts, pcol})
 * @param 어긋    같은 화면에 노선이 여럿일 때 옆으로 비킬 거리(mm)
 * @returns null | { out: Map, 단면: [...], 폭m, 시작, 끝, 빠짐 }
 */
export function 횡단세우기(raw, 새버킷, 어긋 = 0, 머리 = '') {
  let 단면 = 단면찾기(raw)
  if (단면.length < 2) return null
  /* 같은 측점이 두 벌(도면 사본)이면 표가 먼저 나온 쪽(왼쪽·위) 하나만 */
  const 본 = new Map()
  for (const s of 단면.sort((a, b) => a.x - b.x || b.y - a.y)) if (!본.has(s.측)) 본.set(s.측, s)
  단면 = [...본.values()].sort((a, b) => a.측 - b.측)
  const 쓴 = []
  const 빠짐 = []
  for (const s of 단면) {
    const 조각 = 창선(raw, s.창)
    if (!조각.size) { 빠짐.push(s.글 + ' (선 없음)'); continue }
    /* 중심선: TICK·CL·중심 레이어의 짧은 세로 선 중 표 가운데에 가까운 것 */
    let cx = s.cx0, 중심근거 = '표 가운데'
    let bd = Infinity
    for (const [ly, arr] of 조각) {
      if (!/tick|^cl$|center|cen\b|중심/i.test(ly)) continue
      for (const [ax, ay, bx, by] of arr) {
        if (Math.abs(ax - bx) > 1e-6 * Math.max(1, Math.abs(ax))) continue
        const d = Math.abs(ax - s.cx0)
        if (d < bd && d < (s.창[2] - s.창[0]) * 0.2) { bd = d; cx = ax; 중심근거 = ly }
      }
    }
    // 빼는층(tick 등)은 창선에서 빠지므로 한 번 더 raw 에서 찾습니다
    if (중심근거 === '표 가운데') {
      for (const [ly, b] of raw.out) {
        if (!/tick|^cl$|center|cen\b|중심/i.test(ly)) continue
        const a = b.pos.a
        for (let i = 0; i < b.pos.n; i += 6) {
          const ax = a[i], ay = a[i + 1], bx = a[i + 3], by = a[i + 4]
          if (Math.abs(ax - bx) > 1e-6 * Math.max(1, Math.abs(ax))) continue
          if (Math.min(ay, by) < s.창[1] || Math.max(ay, by) > s.창[3]) continue
          const d = Math.abs(ax - s.cx0)
          if (d < bd && d < (s.창[2] - s.창[0]) * 0.2) { bd = d; cx = ax; 중심근거 = ly }
        }
      }
    }
    /* 높이 기준: 지반선이 중심선과 만나는 곳 = 지반고 */
    const 땅 = [...조각].filter(([ly]) => 땅층.test(ly)).flatMap(([, a]) => a)
    const 계 = [...조각].filter(([ly]) => 계획층.test(ly) && !땅층.test(ly)).flatMap(([, a]) => a)
    let 기준y = NaN, 기준값 = NaN, 근거 = ''
    if (땅.length && Number.isFinite(s.지반고)) { 기준y = y에서(땅, cx); 기준값 = s.지반고; 근거 = '지반고' }
    if (!Number.isFinite(기준y) && 계.length && Number.isFinite(s.계획고)) { 기준y = y에서아래(계, cx); 기준값 = s.계획고; 근거 = '계획고' }
    if (!Number.isFinite(기준y)) { 빠짐.push(s.글 + ' (중심에서 지반선을 못 찾음)'); continue }
    쓴.push({ ...s, 조각, cx, 기준y, 기준값, 근거, 땅, 계, 중심근거 })
  }
  if (쓴.length < 2) return null
  /* 도면 단위: 단면 창 폭이 300 을 넘으면 mm 로 그린 것 */
  const 창폭 = 쓴.map((s) => s.창[2] - s.창[0]).sort((a, b) => a - b)[쓴.length >> 1]
  const 배 = 창폭 > 300 ? 0.001 : 1                   // 도면 1 → m
  const out = new Map()
  const 면버킷 = (키) => { let b = out.get(키); if (!b) { b = 새버킷(); out.set(키, b) } if (!b.tri) { b.tri = 새버킷().pos; b.trc = 새버킷().col } return b }
  const M = 1000                                        // m → mm
  const 점 = (s, x, y) => [s.측 * M, (x - s.cx) * 배 * M + 어긋, (s.기준값 + (y - s.기준y) * 배) * M]
  for (const s of 쓴) {
    const 층키 = 머리 + s.글
    for (const [ly, arr] of s.조각) {
      const 키 = 층키 + '\u0001' + ly
      let b = out.get(키)
      if (!b) { b = 새버킷(); out.set(키, b) }
      for (const [ax, ay, bx, by, r, g, bl] of arr) {
        const p = 점(s, ax, ay), q = 점(s, bx, by)
        b.pos.push6(p[0], p[1], p[2], q[0], q[1], q[2])
        b.col.push3(r, g, bl); b.col.push3(r, g, bl)
      }
    }
  }
  /* 면 — 이웃 단면끼리 지반선·계획선을 이어 붙임 (0.5m 간격) */
  const 간격 = 0.5
  const 면만들기 = (키, 고르기, 색, 아래쪽) => {
    for (let k = 0; k + 1 < 쓴.length; k++) {
      const A = 쓴[k], B = 쓴[k + 1]
      const a선 = 고르기(A), b선 = 고르기(B)
      if (!a선.length || !b선.length) continue
      const 범위 = (s, 선) => { let lo = Infinity, hi = -Infinity; for (const [ax, , bx] of 선) { lo = Math.min(lo, (ax - s.cx) * 배, (bx - s.cx) * 배); hi = Math.max(hi, (ax - s.cx) * 배, (bx - s.cx) * 배) } return [lo, hi] }
      const [alo, ahi] = 범위(A, a선), [blo, bhi] = 범위(B, b선)
      const lo = Math.max(alo, blo), hi = Math.min(ahi, bhi)
      if (!(hi - lo > 간격)) continue
      const b = 면버킷(키)
      const z = (s, 선, o) => { const x = s.cx + o / 배; const y = 아래쪽 ? y에서아래(선, x) : y에서(선, x); return Number.isFinite(y) ? s.기준값 + (y - s.기준y) * 배 : NaN }
      let 앞 = null, 첫 = null
      const 가장자리 = (st) => {       // 면 가장자리 — 측점 사이를 잇는 선(면만 있으면 화면이 그 레이어를 안 그립니다)
        const P = (x, oo, zz) => [x * M, oo * M + 어긋, zz * M]
        const [o, za, zb] = st
        const p = P(A.측, o, za), q = P(B.측, o, zb)
        b.pos.push6(p[0], p[1], p[2], q[0], q[1], q[2])
        b.col.push3(색[0], 색[1], 색[2]); b.col.push3(색[0], 색[1], 색[2])
      }
      for (let o = lo; o <= hi + 1e-9; o += 간격) {
        const za = z(A, a선, o), zb = z(B, b선, o)
        const 지금 = Number.isFinite(za) && Number.isFinite(zb) ? [o, za, zb] : null
        if (지금 && !첫) { 첫 = 지금; 가장자리(지금) }
        if (!지금 && 앞) 가장자리(앞)
        if (앞 && 지금) {
          const [o0, a0, b0] = 앞, [o1, a1, b1] = 지금
          const P = (st, oo, zz) => [st * M, oo * M + 어긋, zz * M]
          const p1 = P(A.측, o0, a0), p2 = P(A.측, o1, a1), p3 = P(B.측, o1, b1), p4 = P(B.측, o0, b0)
          b.tri.push3(...p1); b.tri.push3(...p2); b.tri.push3(...p3)
          b.tri.push3(...p1); b.tri.push3(...p3); b.tri.push3(...p4)
          for (let q = 0; q < 6; q++) b.trc.push3(색[0], 색[1], 색[2])
        }
        앞 = 지금
      }
      if (앞) 가장자리(앞)
    }
  }
  면만들기('땅 면\u0001땅 면', (s) => s.땅, [120, 160, 90], false)
  면만들기('계획 면\u0001계획 면', (s) => s.계, [90, 150, 220], true)
  const 폭들 = 쓴.map((s) => (s.창[2] - s.창[0]) * 배)
  /* 처음엔 끌 레이어 — 선이 거의 다 «세로» 인 레이어(눈금 막대·폴대·지시선). 구조물 벽은 가로선도 있어 남습니다 */
  const 세로 = new Map()
  for (const s of 쓴) {
    const 반폭 = (s.창[2] - s.창[0]) / 2
    for (const [ly, arr] of s.조각) {
      const o = 세로.get(ly) || { 세: 0, 모두: 0, 가: 0 }
      for (const [ax, ay, bx, by] of arr) {
        const L = Math.hypot(bx - ax, by - ay); o.모두 += L
        if (Math.abs(bx - ax) < 1e-6 * Math.max(1, L)) {
          o.세 += L
          if (Math.abs(ax - s.cx) > 0.8 * 반폭) o.가 += L      // 단면 틀의 양옆 세로선(눈금 막대)
        }
      }
      세로.set(ly, o)
    }
  }
  const 끌층 = [...세로].filter(([ly, o]) => !땅층.test(ly) && !계획층.test(ly) && o.모두 > 0 && (o.세 / o.모두 > 0.95 || o.가 / Math.max(o.세, 1e-9) > 0.5 && o.세 > 0)).map(([ly]) => ly)
  return {
    끌층,
    out,
    단면: 쓴.map((s) => ({ 층: 머리 + s.글, 이름: s.글 + ' (' + s.측.toFixed(2).replace(/\.00$/, '') + ' m)', 측: s.측, 지반고: s.지반고, 계획고: s.계획고, 근거: s.근거, 중심: s.중심근거 })),
    폭m: Math.max(...폭들),
    시작: 쓴[0].측, 끝: 쓴[쓴.length - 1].측,
    배,
    빠짐,
  }
}
