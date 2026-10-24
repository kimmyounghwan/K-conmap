/**
 * 🚶 한 층씩 둘러보기 — 걷기 셈(자리 · 부딪힘 · 가까운 부재 · 확인) (G390 · 2026-10-23)
 *
 * 소장님: 「도면을 걸어 갈때는 사람이 걸어가게 하면 안돼?」 · 「한층 한층 사람이 보면서」 · 「게임하듯이 작업할 수 있게」 · 「토공부터 … 지하 … 1층 … 2층 … 도면에 따라서」
 * ■ 화면(Model.jsx 작업 화면) 과 따로 — 여기는 숫자만(시험: tools/시험_둘러보기.mjs).
 * ■ 단위: 덩어리(골조모델 덩어리 — mm) 를 받아 m 로 셈. 사람 = 반지름 0.25 m 원 · 키 1.7 m.
 * ■ 층 차례 = 골조 모델 층 차례(FT = 기초 → 지하 → 1층 → …) · 사람이 서는 높이 = 그 층 바닥(층높이 z0 — FT 는 0).
 * ■ 부딪힘: 그 층 기둥 · 벽(사람 키 높이와 겹치는 것)의 네모(판의 둘레 상자)에서 밀어냄 · 건물 둘레 + 4 m 밖으로는 안 나감.
 * ■ 확인: 사람이 부재 네모에서 1.8 m 안에 들면 «확인» — 층마다 «확인 n / N».
 */
export const 사람반지름 = 0.25
export const 확인거리 = 1.8
export const 고름거리 = 2.6

const 상자 = (판) => { let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity; for (const p of 판) { a = Math.min(a, p[0]); b = Math.min(b, p[1]); c = Math.max(c, p[0]); d = Math.max(d, p[1]) } return [a / 1000, b / 1000, c / 1000, d / 1000] }
/** 점(x, y) → 네모 [x0, y0, x1, y1] 거리(m · 안이면 0) */
export function 네모거리(x, y, b) { const dx = Math.max(b[0] - x, 0, x - b[2]), dy = Math.max(b[1] - y, 0, y - b[3]); return Math.hypot(dx, dy) }

/**
 * 층 판 — 덩어리 · 층높이 표로 그 층에서 걸을 판
 * @param {Array} 덩 골조모델 덩어리 [{id, 판, z0, z1, 종류, 층}]
 * @param {object} H 층높이(M) 결과
 * @param {string} 층 층 이름
 */
export function 층판(덩, H, 층) {
  const f = H.표.get(층)
  const 이층 = 덩.filter((d) => d.층 === 층)
  /* FT(기초) = 터파기 바닥 — 그 층 기초 밑면 가장 낮은 곳에 섬(기초가 둘레에 덩어리로 보이게) · 나머지는 그 층 바닥
     🟨 G392 MAT(자유 모양 · 넓은 판 기초)가 있으면 그 윗면에 섬(MAT 은 밟는 바닥 — 막지 않음) */
  const 판넓 = (P) => { let a = 0; for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length]; a += p[0] * q[1] - q[0] * p[1] } return Math.abs(a) / 2 }
  const MAT인가 = (d) => d.종류 === '기초' && Array.isArray(d.판) && (d.판.length !== 4 || 판넓(d.판) > 60e6)
  const 매트 = 이층.filter(MAT인가)
  const ft밑 = 이층.filter((d) => d.종류 === '기초').reduce((a, d) => Math.min(a, d.z0), Infinity)
  const 매트위 = 매트.reduce((a, d) => Math.max(a, d.z1), -Infinity)
  const 바닥 = f ? (f.FT ? (Number.isFinite(매트위) ? 매트위 : Number.isFinite(ft밑) ? ft밑 : 0) : f.z0) / 1000 : 0
  const 막 = []
  for (const d of 덩) {
    /* 🪜 G393 계단 — 단 · 참 조각마다(낮은 첫 단은 밟고 넘고 높은 단은 막음) */
    if (d.종류 === '계단' && Array.isArray(d.조각)) { for (const x of d.조각) { const z0 = x.z0 / 1000, z1 = x.z1 / 1000; if (z1 <= 바닥 + 0.3 || z0 >= 바닥 + 1.7) continue; 막.push({ id: d.id, b: 상자(x.판) }) } continue }
    if (d.종류 !== '기둥' && d.종류 !== '벽' && d.종류 !== '기초') continue
    if (MAT인가(d)) continue
    const z0 = d.z0 / 1000, z1 = d.z1 / 1000
    if (z1 <= 바닥 + 0.3 || z0 >= 바닥 + 1.7) continue       // 사람 키와 안 겹침
    막.push({ id: d.id, b: 상자(d.판) })
  }
  const 부재 = 이층.map((d) => ({ id: d.id, 종류: d.종류, 부호: d.부호, b: 상자(d.판), z0: d.z0 / 1000, z1: d.z1 / 1000 }))
  /* 건물 둘레(모든 층) */
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (const d of 덩) { const b = 상자(d.판); x0 = Math.min(x0, b[0]); y0 = Math.min(y0, b[1]); x1 = Math.max(x1, b[2]); y1 = Math.max(y1, b[3]) }
  const 둘레 = Number.isFinite(x0) ? [x0 - 4, y0 - 4, x1 + 4, y1 + 4] : [-20, -20, 20, 20]
  return { 층, 바닥, 막, 부재, 둘레 }
}

/** 처음 설 자리 — 그 층 부재 둘레의 가운데(막힌 곳이면 밀어냄) · 위쪽(+y)을 바라봄 · 부재가 없으면 건물 둘레 가운데 */
export function 첫자리(판) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (const o of 판.부재) { x0 = Math.min(x0, o.b[0]); y0 = Math.min(y0, o.b[1]); x1 = Math.max(x1, o.b[2]); y1 = Math.max(y1, o.b[3]) }
  if (!Number.isFinite(x0)) [x0, y0, x1, y1] = 판.둘레
  let [x, y] = 밀어내기((x0 + x1) / 2, (y0 + y1) / 2, 판.막)
  return { x, y, 방향: Math.PI / 2 }
}

/** 원(사람)을 막힌 네모에서 밀어냄 — 한 번에 여러 개 */
export function 밀어내기(x, y, 막, r = 사람반지름) {
  for (let 돌 = 0; 돌 < 3; 돌++) {
    let 움 = false
    for (const { b } of 막) {
      const cx = Math.max(b[0], Math.min(x, b[2])), cy = Math.max(b[1], Math.min(y, b[3]))
      const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy)
      if (d >= r) continue
      if (d > 1e-9) { x = cx + (dx / d) * r; y = cy + (dy / d) * r }
      else {                                    // 네모 안 — 가까운 변으로
        const 왼 = x - b[0], 오 = b[2] - x, 아 = y - b[1], 위 = b[3] - y, m = Math.min(왼, 오, 아, 위)
        if (m === 왼) x = b[0] - r; else if (m === 오) x = b[2] + r; else if (m === 아) y = b[1] - r; else y = b[3] + r
      }
      움 = true
    }
    if (!움) break
  }
  return [x, y]
}

/**
 * 한 걸음 — 입력 {앞: -1~1, 돌: -1~1, 옆: -1~1} · dt 초 · 빠르기 m/s
 * @returns {{x, y, 방향, 감: number}} 감 = 실제로 간 거리(m)
 */
export function 걷기(사, 입력, dt, 판, 빠르기 = 1.6) {
  const 방향 = 사.방향 + (입력.돌 || 0) * 1.9 * dt
  const 앞 = Math.max(-1, Math.min(1, 입력.앞 || 0)), 옆 = Math.max(-1, Math.min(1, 입력.옆 || 0))
  const v = 빠르기 * (앞 < 0 ? 0.6 : 1)
  let x = 사.x + (Math.cos(방향) * 앞 - Math.sin(방향) * 옆) * v * dt
  let y = 사.y + (Math.sin(방향) * 앞 + Math.cos(방향) * 옆) * v * dt
  ;[x, y] = 밀어내기(x, y, 판.막)
  x = Math.max(판.둘레[0], Math.min(판.둘레[2], x)); y = Math.max(판.둘레[1], Math.min(판.둘레[3], y))
  return { x, y, 방향, 감: Math.hypot(x - 사.x, y - 사.y) }
}

/** 가까운 부재(그 층) — 거리 차례 · 거리 안 것만 */
export function 가까운것(사, 판, 거리 = 고름거리) {
  return 판.부재.map((o) => ({ o, d: 네모거리(사.x, 사.y, o.b) })).filter((r) => r.d <= 거리).sort((a, b) => a.d - b.d || (a.o.종류 === '슬라브') - (b.o.종류 === '슬라브'))
}
/** 이 자리에서 확인되는 부재 id(그 층 · 확인거리 안) */
export function 확인들(사, 판) { return 판.부재.filter((o) => 네모거리(사.x, 사.y, o.b) <= 확인거리).map((o) => o.id) }

/** 부재 둘레에서 사람이 설 곳 — 지금 쪽 변에서 0.9 m 밖 · 긴 벽 · 보(반 > 3 m)는 가장 가까운 면에서 1.2 m 앞 */
function 설곳(p, 지금) {
  const dx = 지금.x - p.x, dy = 지금.y - p.y, l = Math.hypot(dx, dy) || 1
  const 반 = Math.max((p.b[2] - p.b[0]) / 2, (p.b[3] - p.b[1]) / 2)
  if (반 > 3) {
    const cx = Math.max(p.b[0], Math.min(지금.x, p.b[2])), cy = Math.max(p.b[1], Math.min(지금.y, p.b[3]))
    const ex = 지금.x - cx, ey = 지금.y - cy, el = Math.hypot(ex, ey)
    return el > 1e-6 ? { x: cx + (ex / el) * 1.2, y: cy + (ey / el) * 1.2 } : { x: cx + (dx / l) * 1.2, y: cy + (dy / l) * 1.2 }
  }
  return { x: p.x + (dx / l) * (반 + 0.9), y: p.y + (dy / l) * (반 + 0.9) }
}

/**
 * 🖱 누른 곳으로 걷기(게임처럼) — 그 층 부재(id)를 누르면 그 앞(사람 쪽 면 · 설곳)까지 · 바닥을 누르면 그 점까지(막힌 곳이면 밀어냄 · 둘레 안)
 *   슬라브 · 다른 층 부재 · 없는 id 는 바닥 점으로.  @returns {{x, y, id?, b?, 누름: true}[]} (자동입력 · 자동막힘 길과 같은 꼴 — 한 점)
 */
export function 누른곳길(판, 사, 점, id = null) {
  const o = id !== null && id !== undefined ? 판.부재.find((x) => x.id === id) : null
  if (o && o.종류 !== '슬라브') {
    const p = { x: (o.b[0] + o.b[2]) / 2, y: (o.b[1] + o.b[3]) / 2, b: o.b }
    let { x, y } = 설곳(p, 사)
    ;[x, y] = 밀어내기(x, y, 판.막, 사람반지름 + 0.05)
    return [{ x, y, id: o.id, b: o.b, 누름: true }]
  }
  if (!점 || !Number.isFinite(점.x) || !Number.isFinite(점.y)) return []
  let x = Math.max(판.둘레[0], Math.min(판.둘레[2], 점.x)), y = Math.max(판.둘레[1], Math.min(판.둘레[3], 점.y))
  ;[x, y] = 밀어내기(x, y, 판.막, 사람반지름 + 0.05)
  return [{ x, y, 누름: true }]
}

/**
 * 자동 둘러보기 길 — 그 층 부재 가운데를 «가까운 다음» 차례로(슬라브는 빼고 · 그 앞 0.9 m 에 섬)
 * @returns {{x, y, id}[]}
 */
export function 자동길(판, 시작) {
  const 남 = 판.부재.filter((o) => o.종류 !== '슬라브').map((o) => ({ id: o.id, x: (o.b[0] + o.b[2]) / 2, y: (o.b[1] + o.b[3]) / 2, b: o.b }))
  const 길 = []
  let 지금 = { x: 시작.x, y: 시작.y }
  while (남.length) {
    let k = 0, bd = Infinity
    남.forEach((p, i) => { const d = Math.hypot(p.x - 지금.x, p.y - 지금.y); if (d < bd) { bd = d; k = i } })
    const p = 남.splice(k, 1)[0]
    const 섬 = 설곳(p, 지금)
    길.push({ ...섬, id: p.id, b: p.b })
    지금 = 섬
  }
  return 길
}

/** 다음 점으로 가는 입력(자동) — 방향 돌리고 앞으로 · 닿으면 null */
export function 따라가기(사, 점, dt) {
  const dx = 점.x - 사.x, dy = 점.y - 사.y, d = Math.hypot(dx, dy)
  if (d < 0.35) return null
  const 목 = Math.atan2(dy, dx)
  let 차 = 목 - 사.방향
  while (차 > Math.PI) 차 -= Math.PI * 2
  while (차 < -Math.PI) 차 += Math.PI * 2
  const 돌 = Math.max(-1, Math.min(1, 차 / Math.max(dt * 1.9, 1e-6)))
  return { 돌, 앞: Math.abs(차) < 0.6 ? Math.min(1, d / 0.8) : 0.15 }
}

/**
 * 자동 둘러보기 한 걸음 — A = {길, k, 막} · 닿은 점(그 부재가 확인 거리 안에 든 때 포함)은 건너뜀 · 끝이면 null
 * @returns {{앞, 돌, 옆?} | null}
 */
export function 자동입력(A, 사, dt) {
  const 닿음 = (점) => 점.b && 네모거리(사.x, 사.y, 점.b) <= 확인거리 - 0.3
  let 점 = A.길[A.k], 입 = null
  while (점 && (닿음(점) || !(입 = 따라가기(사, 점, dt)))) { A.k++; A.막 = 0; A.옆때 = 0; A.가장 = Infinity; 점 = A.길[A.k]; 입 = null }
  if (!점) return null
  /* 막혔을 때 — 0.7 초 옆걸음으로 기둥 · 벽을 돌아 감 */
  if (입 && A.옆때 > 0) { A.옆때 -= dt; 입 = { ...입, 앞: 입.앞 * 0.35, 옆: A.옆쪽 || 1 } }
  return 입
}
/** 막힘 — 점까지 거리가 0.5 초 넘게 줄지 않으면 옆걸음 · 2.5 초 넘으면 그 점은 건너뜀(벽 너머 · 기둥 뒤) · 건너뛴 점은 길 끝에 한 번 더 */
export function 자동막힘(A, 사, dt) {
  const 점 = A.길[A.k]
  if (!점) return
  const d = Math.hypot(점.x - 사.x, 점.y - 사.y)
  if (!(d < (A.가장 ?? Infinity) - 0.15)) A.막 = (A.막 || 0) + dt
  else { A.가장 = d; A.막 = 0 }
  if (A.막 > 0.5 && !(A.옆때 > 0) && (A.옆번 || 0) < 3) { A.옆때 = 0.7; A.옆쪽 = (A.옆번 || 0) % 2 ? -1 : 1; A.옆번 = (A.옆번 || 0) + 1 }
  if (A.막 > 2.5) { if (!점.재) A.길.push({ ...점, 재: true }); A.k++; A.막 = 0; A.옆때 = 0; A.옆번 = 0; A.가장 = Infinity }
}

/** 🟥 가까운 빨간 곳(도면에서 못 옮긴 것 · M.빠짐) — 그 층 · 둘레 네모에서 거리 안 · 가까운 차례 첫째 { x, k, d } */
export function 가까운빠짐(사, 빠짐, 층, 거리 = 고름거리) {
  let best = null
  ;(빠짐 || []).forEach((x, k) => {
    if (x.층 !== 층 || !Array.isArray(x.판) || x.판.length < 3) return
    const b = 상자(x.판)
    const d = 네모거리(사.x, 사.y, b)
    if (d <= 거리 && (!best || d < best.d)) best = { x, k, d }
  })
  return best
}
