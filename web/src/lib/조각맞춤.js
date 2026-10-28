/**
 * 🏭 G445 구조물 조각 다시 맞춤 — 일반도 평면에서 «끊어(생략) 줄여 그린» 관로 뒤 조각을 제 길이만큼 띄움 (2026-10-28)
 *   현장 S 배수펌프장: 평면에 D2,000 관 «52,600» 을 17.9 m 로 줄여 그림 → 일반도를 통째로 배치도에 겹치면 토출구가 제자리보다 34.6 m 앞에 섬
 *   → 일꾼(lib/구조3d.js 끊음찾기)이 치수(적은 값 ≫ 잰 길이)로 찾은 «끊음» 마다, 닻 조각(가장 큰 바닥판)의 반대쪽 조각을 그 치수 방향으로 «적은 값 − 잰 길이» 만큼 옮김
 *   — 짐작 아님: 도면에 적힌 치수 값 그대로(소장님 «물량은 항상 도면 근거» · «다른 도면 넣을 때도 되게 도구로»)
 *   옮기는 것: 그 조각의 바닥판 · 벽판 · 벽들 · 바닥들 · 덮개 · 중간판 · 계단 · 헌치 · 덮개 모름 자리(물량은 그대로 — 자리만)
 */
// 가운데 — 넓이 무게 가운데. 좌표가 큰 도면(2.7억 mm 같은 배치도 좌표)은 곱이 2^53 을 넘어 10 m 넘게 빗나감 → 첫 점 기준(빼고) 셈
//   꼬인 고리(나비꼴)·납작 고리처럼 가운데가 고리 밖으로 나오면 꼭짓점 평균
const 가운데 = (r) => {
  const o = r[0]
  let A = 0, x = 0, y = 0, mx = 0, my = 0, x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (let i = 0; i < r.length; i++) {
    const ax = r[i][0] - o[0], ay = r[i][1] - o[1], b = r[(i + 1) % r.length], bx = b[0] - o[0], by = b[1] - o[1], w = ax * by - bx * ay
    A += w; x += (ax + bx) * w; y += (ay + by) * w; mx += ax; my += ay
    if (ax < x0) x0 = ax; if (ax > x1) x1 = ax; if (ay < y0) y0 = ay; if (ay > y1) y1 = ay
  }
  const 평 = [o[0] + mx / r.length, o[1] + my / r.length]
  if (!A) return 평
  const cx = x / (3 * A), cy = y / (3 * A), e = 1e-6 * (x1 - x0 + y1 - y0)
  return Number.isFinite(cx) && Number.isFinite(cy) && cx >= x0 - e && cx <= x1 + e && cy >= y0 - e && cy <= y1 + e ? [o[0] + cx, o[1] + cy] : 평
}
const 넓 = (r) => { const o = r[0]; let A = 0; for (let i = 0; i < r.length; i++) { const a = r[i], b = r[(i + 1) % r.length]; A += (a[0] - o[0]) * (b[1] - o[1]) - (b[0] - o[0]) * (a[1] - o[1]) } return Math.abs(A / 2) }
const 안에 = (p, r) => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const a = r[i], b = r[j]; if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c } return c }
const 거리선 = (p, r) => { let d = Infinity; for (let i = 0; i < r.length; i++) { const a = r[i], b = r[(i + 1) % r.length]; const vx = b[0] - a[0], vy = b[1] - a[1], L2 = vx * vx + vy * vy; const t = L2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * vx + (p[1] - a[1]) * vy) / L2)) : 0; d = Math.min(d, Math.hypot(p[0] - a[0] - t * vx, p[1] - a[1] - t * vy)) } return d }

/** 구조물 하나 — 끊음대로 조각 옮김. 옮길 것이 없으면 그대로(같은 값) */
export function 끊음펴기(q) {
  if (!q || q.조각맞춤 || q.자리 === '옆' || !Array.isArray(q.끊음) || !q.끊음.length || !Array.isArray(q.바닥판)) return q
  const 판 = q.바닥판.filter((r) => r && r.length >= 3)
  if (판.length < 2) return q
  const 넓이 = 판.map(넓), 닻 = 넓이.indexOf(Math.max(...넓이))
  const 가 = 판.map(가운데)
  const 밀 = 판.map(() => [0, 0])
  const 글 = []
  for (const k of q.끊음) {
    const L = Math.hypot(k.Q[0] - k.P[0], k.Q[1] - k.P[1])
    if (!(L > 0) || !(k.더 > 0)) continue
    const ux = (k.Q[0] - k.P[0]) / L, uy = (k.Q[1] - k.P[1]) / L
    const t = (p) => (p[0] - k.P[0]) * ux + (p[1] - k.P[1]) * uy
    const 옆 = (p) => Math.abs((p[0] - k.P[0]) * uy - (p[1] - k.P[1]) * ux)
    const ta = t(가[닻])
    const 앞으로 = ta <= L / 2                    // 닻이 끊음 앞쪽이면 뒤쪽 조각을 뒤로 밂
    const 옮긴 = []
    for (let i = 0; i < 판.length; i++) {
      if (i === 닻 || 옆(가[i]) > 40000) continue
      const ti = t(가[i])
      if (앞으로 ? ti > L : ti < 0) { 밀[i][0] += (앞으로 ? 1 : -1) * ux * k.더; 밀[i][1] += (앞으로 ? 1 : -1) * uy * k.더; 옮긴.push(i + 1) }
    }
    if (옮긴.length) 글.push({ 조각: 옮긴, 거리: k.더 / 1000, 적은: k.적은, 잰: k.잰 })
  }
  if (!글.length) return { ...q, 조각맞춤: true, 조각옮김: [] }
  const 누구 = (p) => { for (let k = 0; k < 판.length; k++) if (안에(p, 판[k])) return k; let b = 0, bd = Infinity; for (let k = 0; k < 판.length; k++) { const d = 거리선(p, 판[k]); if (d < bd) { bd = d; b = k } } return b }
  const 옮겨 = (p, k) => (밀[k][0] || 밀[k][1] ? [p[0] + 밀[k][0], p[1] + 밀[k][1]] : p)
  const 판옮 = (r) => { if (!Array.isArray(r) || r.length < 3) return r; const k = 누구(가운데(r)); return 밀[k][0] || 밀[k][1] ? r.map((p) => 옮겨(p, k)) : r }
  const 판들옮 = (a) => (Array.isArray(a) ? a.map((x) => { if (!x || !Array.isArray(x.판)) return x; const k = x.판.length ? 누구(가운데(x.판[0])) : 0; return { ...x, 판: x.판.map(판옮), ...(Array.isArray(x.열린) ? { 열린: x.열린.map((h) => (h && Array.isArray(h.자리) ? { ...h, 자리: 옮겨(h.자리, 누구(h.자리)) } : h)) } : {}) }; void k }) : a)
  const 자리옮 = (a) => (Array.isArray(a) ? a.map((x) => (x && Array.isArray(x.자리) ? { ...x, 자리: 옮겨(x.자리, 누구(x.자리)) } : x)) : a)
  return {
    ...q,
    조각맞춤: true,
    조각옮김: 글,
    바닥판: q.바닥판.map((r) => { const i = 판.indexOf(r); return i >= 0 ? r.map((p) => 옮겨(p, i)) : r }),
    벽판: Array.isArray(q.벽판) ? q.벽판.map(판옮) : q.벽판,
    벽들: 판들옮(q.벽들), 바닥들: 판들옮(q.바닥들), 덮개들: 판들옮(q.덮개들), 중간판들: 판들옮(q.중간판들), 계단들: 판들옮(q.계단들),
    헌치들: 자리옮(q.헌치들),
    덮개모름: q.덮개모름 && Array.isArray(q.덮개모름.꼴) ? { ...q.덮개모름, 꼴: 자리옮(q.덮개모름.꼴) } : q.덮개모름,
  }
}
/** 활용 → 구조물마다 끊음 펴기(바뀐 것이 없으면 같은 활용) */
export function 끊음펴기들(활) {
  if (!활 || !Array.isArray(활.구조) || !활.구조.some((q) => q && !q.조각맞춤 && Array.isArray(q.끊음) && q.끊음.length)) return 활
  return { ...활, 구조: 활.구조.map(끊음펴기) }
}
