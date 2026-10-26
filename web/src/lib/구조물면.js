/**
 * 🧊 구조물(배수장 · 박스 · 집수정) 평면도 → 콘크리트 «벽 모양» · «바닥 모양» (G225 BIM 물량 · 2026-10-10)
 *
 * 소장님: 「부재가 없으면 좌표로 읽어서 물량 뽑으면 되지않아?」
 *   → 토목 구조물 일반도에는 부재 일람표가 없고, 벽 두께는 «평면의 겹선 사이» 로만 그려져 있습니다.
 *     그래서 선(좌표)으로 셉니다 — 도면은 고치지 않습니다.
 *
 * ■ 하는 일 (칸 그림 — 50~100 mm 칸)
 *   ① 바깥 둘레(발자국): 선을 굵게(± 200 mm) 칠해 바깥에서 물을 부어 안 닿는 곳 → 다시 200 mm 깎음(굵게 칠한 만큼 되돌림)
 *   ② 발자국 안을 선으로 나뉜 «방» 들로 나눔 — 넓은 방(가운데에서 벽까지 0.75 m 넘음 = 폭 1.5 m 넘음)은 «빈 곳»(물길 · 펌프실)
 *      좁은 방(겹선 사이 = 벽 속)은 콘크리트
 *   ③ 콘크리트 = 발자국 − 빈 곳 · 외줄 선(1 칸 굵기)은 깎아 냄
 *   ④ 테두리를 다각형으로(바깥 줄 반시계 · 구멍 시계) — 3D 덩어리 · IFC · 물량(넓이 · 둘레)
 * ■ 두께 짐작: 벽 평균 두께 ≈ 2 × 넓이 ÷ 둘레(벽 양쪽 면) — 화면에 «짐작» 으로 적음
 * ■ 높이는 이 파일이 정하지 않습니다(단면 EL 글자 → 일꾼이 넘김).
 */
import { 테두리들 } from './토공3d.js'

/** 1D 열 · 행 따로 늘이기(dilate)/줄이기(erode) — 네모 꼴(반지름 r 칸) */
function 늘줄(M, W, H, r, 늘) {
  if (r <= 0) return M
  const A = new Uint8Array(W * H), B = new Uint8Array(W * H)
  // 가로
  for (let y = 0; y < H; y++) {
    const o = y * W
    let n = 0                                      // 창 안의 1 개수
    for (let x = -r; x < W + r; x++) {
      const 들어 = x + r, 나가 = x - r - 1
      if (들어 < W && 들어 >= 0 && M[o + 들어]) n++
      if (나가 >= 0 && 나가 < W && M[o + 나가]) n--
      if (x >= 0 && x < W) {
        const 칸수 = Math.min(W - 1, x + r) - Math.max(0, x - r) + 1
        A[o + x] = 늘 ? (n > 0 ? 1 : 0) : (n === 칸수 && Math.max(0, x - r) === x - r && x + r <= W - 1 ? 1 : 0)
      }
    }
  }
  // 세로
  for (let x = 0; x < W; x++) {
    let n = 0
    for (let y = -r; y < H + r; y++) {
      const 들어 = y + r, 나가 = y - r - 1
      if (들어 < H && 들어 >= 0 && A[들어 * W + x]) n++
      if (나가 >= 0 && 나가 < H && A[나가 * W + x]) n--
      if (y >= 0 && y < H) {
        const 칸수 = Math.min(H - 1, y + r) - Math.max(0, y - r) + 1
        B[y * W + x] = 늘 ? (n > 0 ? 1 : 0) : (n === 칸수 && y - r >= 0 && y + r <= H - 1 ? 1 : 0)
      }
    }
  }
  return B
}

/** 바깥(가장자리)에서 0 칸을 따라 4 방향으로 물 붓기 → 닿은 칸 1 */
function 물붓기(벽, W, H) {
  const 밖 = new Uint8Array(W * H)
  const q = new Int32Array(W * H)
  let qh = 0, qt = 0
  const 넣 = (i) => { if (!밖[i] && !벽[i]) { 밖[i] = 1; q[qt++] = i } }
  for (let x = 0; x < W; x++) { 넣(x); 넣((H - 1) * W + x) }
  for (let y = 0; y < H; y++) { 넣(y * W); 넣(y * W + W - 1) }
  while (qh < qt) {
    const i = q[qh++], x = i % W
    if (x > 0) 넣(i - 1)
    if (x < W - 1) 넣(i + 1)
    if (i >= W) 넣(i - W)
    if (i < W * (H - 1)) 넣(i + W)
  }
  return 밖
}

/** 칸마다 «막힌 칸(0)까지 거리»(칸 · 3-4 모따기 ÷ 3) */
function 거리(M, W, H) {
  const D = new Float32Array(W * H)
  const 큰 = 1e9
  for (let i = 0; i < W * H; i++) D[i] = M[i] ? 큰 : 0
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x
    if (!D[i]) continue
    let v = D[i]
    if (x > 0) v = Math.min(v, D[i - 1] + 3)
    else v = Math.min(v, 3)
    if (y > 0) {
      v = Math.min(v, D[i - W] + 3)
      if (x > 0) v = Math.min(v, D[i - W - 1] + 4)
      if (x < W - 1) v = Math.min(v, D[i - W + 1] + 4)
    } else v = Math.min(v, 3)
    D[i] = v
  }
  for (let y = H - 1; y >= 0; y--) for (let x = W - 1; x >= 0; x--) {
    const i = y * W + x
    if (!D[i]) continue
    let v = D[i]
    if (x < W - 1) v = Math.min(v, D[i + 1] + 3)
    else v = Math.min(v, 3)
    if (y < H - 1) {
      v = Math.min(v, D[i + W] + 3)
      if (x < W - 1) v = Math.min(v, D[i + W + 1] + 4)
      if (x > 0) v = Math.min(v, D[i + W - 1] + 4)
    } else v = Math.min(v, 3)
    D[i] = v
  }
  for (let i = 0; i < W * H; i++) D[i] /= 3
  return D
}

/** 선 하나 칠하기(8 방향으로 이어지게 — 4 방향 물은 못 지나감) */
function 선칠(G, W, H, ax, ay, bx, by, r) {
  const st = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) * 2))
  for (let k = 0; k <= st; k++) {
    const x = Math.floor(ax + (bx - ax) * k / st), y = Math.floor(ay + (by - ay) * k / st)
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      const xx = x + dx, yy = y + dy
      if (xx >= 0 && yy >= 0 && xx < W && yy < H) G[yy * W + xx] = 1
    }
  }
}

/**
 * 겹선 짝(벽 두 면) 찾기 — 나란한(1.5° 안) 두 선, 사이 120 ~ 1,600 mm, 겹친 길이 250 mm 넘게
 *   · 두 면 사이(가운데 줄)를 가로지르는 선이 있으면 그 자리에서 끊음(눈금 · 스크린 살 · 이음 선)
 *   · 선의 «자리마다» 양쪽 중 더 가까운 짝이 있는 쪽이 벽 쪽 — 두 선 모두에게 서로가 그 자리의 가장 가까운 짝일 때만 벽 띠
 *     (긴 벽 면 한 군데에 가까운 기계 테두리가 있어도 그 자리만 빠지고 나머지는 벽으로)
 * @returns {{띠: number[][][], 두께: number[]}} 띠 = 네모(꼭짓점 넷 · mm)
 */
function 겹선띠(선, 막힘, W, H, x0, y0, 칸, 최소 = 120, 최대 = 1600) {
  const ox = x0 + W * 칸 / 2, oy = y0 + H * 칸 / 2          // 가운데를 0 으로(큰 좌표에서 각도 오차가 커지지 않게)
  const S = []
  for (let i = 0; i + 3 < 선.length; i += 4) {
    const ax = 선[i] - ox, ay = 선[i + 1] - oy, bx = 선[i + 2] - ox, by = 선[i + 3] - oy
    const L = Math.hypot(bx - ax, by - ay)
    if (L < 300) continue
    let ux = (bx - ax) / L, uy = (by - ay) / L
    if (ux < -1e-9 || (Math.abs(ux) < 1e-9 && uy < 0)) { ux = -ux; uy = -uy }
    const nx = -uy, ny = ux
    const ta = ax * ux + ay * uy, tb = bx * ux + by * uy
    S.push({ ux, uy, nx, ny, c: ax * nx + ay * ny, t0: Math.min(ta, tb), t1: Math.max(ta, tb), 각: Math.atan2(uy, ux), 몫: [[], []] })
  }
  if (S.length > 20000) return { 띠: [], 두께: [] }
  const 칸각 = new Map()
  const 각키 = (a) => ((Math.round(a * 180 / Math.PI) % 180) + 180) % 180
  S.forEach((q, i) => { const k = 각키(q.각); if (!칸각.has(k)) 칸각.set(k, []); 칸각.get(k).push(i) })
  const 점 = (q, t, c = q.c) => [q.ux * t + q.nx * c, q.uy * t + q.ny * c]
  const 가 = (x, y) => { const gx = Math.floor((x + ox - x0) / 칸), gy = Math.floor((y + oy - y0) / 칸); return gx >= 0 && gy >= 0 && gx < W && gy < H && 막힘[gy * W + gx] === 1 }
  /* ① 짝 후보 → 가운데 줄 검사로 «빈 토막» 들 */
  const 짝 = []          // { i, j, d(s 쪽 부호), a, b(s 의 t), 쪽i, 쪽j }
  for (let i = 0; i < S.length; i++) {
    const s = S[i], k = 각키(s.각)
    for (const kk of [k - 1, k, k + 1]) {
      const 들 = 칸각.get((kk + 180) % 180)
      if (!들) continue
      for (const j of 들) {
        if (j <= i) continue
        const q = S[j]
        if (Math.abs(s.ux * q.uy - s.uy * q.ux) > 0.026) continue
        const [p0x, p0y] = 점(q, q.t0), [p1x, p1y] = 점(q, q.t1)
        const d0 = p0x * s.nx + p0y * s.ny - s.c, d1 = p1x * s.nx + p1y * s.ny - s.c
        const d = (d0 + d1) / 2, ad = Math.abs(d)
        if (ad < 최소 || ad > 최대 || Math.abs(d1 - d0) > 60) continue
        const qa = p0x * s.ux + p0y * s.uy, qb = p1x * s.ux + p1y * s.uy
        const a = Math.max(s.t0, Math.min(qa, qb)), b = Math.min(s.t1, Math.max(qa, qb))
        if (b - a < 250) continue
        // 가운데 줄 — 칸마다 보고 걸린 곳에서 끊기
        const st = Math.max(2, Math.ceil((b - a) / (칸 * 0.7)))
        let 시작 = a, 앞걸림 = false
        const 토막 = []
        for (let m = 0; m <= st; m++) {
          const t = a + (b - a) * m / st
          const [x, y] = 점(s, t, s.c + d / 2)
          const 걸 = 가(x, y)
          if (걸 && !앞걸림) { if (t - 시작 >= 250) 토막.push([시작, t]) }
          if (!걸 && 앞걸림) 시작 = t
          앞걸림 = 걸
        }
        if (!앞걸림 && b - 시작 >= 250) 토막.push([시작, b])
        const 같 = q.nx * s.nx + q.ny * s.ny > 0
        const 쪽i = d > 0 ? 1 : 0, 쪽j = (d > 0) === 같 ? 0 : 1
        for (const [ta, tb] of 토막) 짝.push({ i, j, d, a: ta, b: tb, 쪽i, 쪽j })
      }
    }
  }
  /* ② 선마다 자리(토막)별로 «양쪽 가장 가까운 짝» → 벽 쪽의 가장 가까운 짝이 그 자리 임자 */
  const 내몫 = new Map()       // 짝 번호 → [[a, b] (s 의 t) …] — s 쪽에서 임자로 뽑힌 자리
  const 남몫 = new Map()       //            — q 쪽에서 임자로 뽑힌 자리(s 의 t 로 바꿔 둠)
  const 선짝 = S.map(() => [])
  짝.forEach((p, n) => {
    선짝[p.i].push({ n, 쪽: p.쪽i, d: Math.abs(p.d), a: p.a, b: p.b, 나: 'i' })
    // q 의 t 로
    const s = S[p.i], q = S[p.j]
    const [ax, ay] = 점(s, p.a, s.c + p.d), [bx, by] = 점(s, p.b, s.c + p.d)
    const qa = ax * q.ux + ay * q.uy, qb = bx * q.ux + by * q.uy
    선짝[p.j].push({ n, 쪽: p.쪽j, d: Math.abs(p.d), a: Math.min(qa, qb), b: Math.max(qa, qb), 나: 'j' })
  })
  for (let k = 0; k < S.length; k++) {
    const L = 선짝[k]
    if (!L.length) continue
    const 끝 = [...new Set(L.flatMap((x) => [x.a, x.b]))].sort((p, q) => p - q)
    for (let e = 0; e + 1 < 끝.length; e++) {
      const e0 = 끝[e], e1 = 끝[e + 1]
      if (e1 - e0 < 1) continue
      const em = (e0 + e1) / 2
      let 최 = [null, null]
      for (const x of L) if (x.a <= em && x.b >= em && (!최[x.쪽] || x.d < 최[x.쪽].d)) 최[x.쪽] = x
      const 벽 = !최[0] ? 최[1] : !최[1] ? 최[0] : 최[0].d <= 최[1].d ? 최[0] : 최[1]
      if (!벽) continue
      let ra = e0, rb = e1
      if (벽.나 === 'j') {      // q(이 선) 의 t → s 의 t
        const p = 짝[벽.n], s = S[p.i], q = S[k]
        const [ax, ay] = 점(q, e0), [bx, by] = 점(q, e1)
        const sa = ax * s.ux + ay * s.uy, sb = bx * s.ux + by * s.uy
        ra = Math.min(sa, sb); rb = Math.max(sa, sb)
      }
      const 통 = 벽.나 === 'i' ? 내몫 : 남몫
      if (!통.has(벽.n)) 통.set(벽.n, [])
      통.get(벽.n).push([ra, rb])
    }
  }
  /* ③ 두 선 모두 임자로 뽑은 자리 = 벽 띠 */
  const 합 = (rs) => { rs.sort((p, q) => p[0] - q[0]); const o = []; for (const r of rs) { if (o.length && r[0] <= o[o.length - 1][1] + 2) o[o.length - 1][1] = Math.max(o[o.length - 1][1], r[1]); else o.push([...r]) } return o }
  const 띠 = [], 두께 = []
  for (const [n, rs] of 내몫) {
    const 남 = 남몫.get(n)
    if (!남) continue
    const A = 합(rs), B = 합(남)
    const p = 짝[n], s = S[p.i]
    for (const [a1, b1] of A) for (const [a2, b2] of B) {
      const a = Math.max(a1, a2), b = Math.min(b1, b2)
      if (b - a < 200) continue
      const P = (t, c) => { const [x, y] = 점(s, t, c); return [x + ox, y + oy] }
      띠.push([P(a, s.c), P(b, s.c), P(b, s.c + p.d), P(a, s.c + p.d)])
      두께.push(Math.abs(p.d) * (b - a))
    }
  }
  if (globalThis.__구조디버그) globalThis.__구조디버그 = { 선수: S.length, 짝: 짝.length, 띠: 띠.length }
  return { 띠, 두께 }
}

/** 볼록 네모 칠하기(칸 가운데가 안이면 1) */
function 네모칠(M, W, H, x0, y0, 칸, Q) {
  let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity
  for (const [x, y] of Q) { a = Math.min(a, x); b = Math.min(b, y); c = Math.max(c, x); d = Math.max(d, y) }
  const i0 = Math.max(0, Math.floor((a - x0) / 칸)), i1 = Math.min(W - 1, Math.ceil((c - x0) / 칸))
  const j0 = Math.max(0, Math.floor((b - y0) / 칸)), j1 = Math.min(H - 1, Math.ceil((d - y0) / 칸))
  const 안 = (x, y) => {
    let 부호 = 0
    for (let k = 0; k < 4; k++) {
      const p = Q[k], q = Q[(k + 1) % 4]
      const cr = (q[0] - p[0]) * (y - p[1]) - (q[1] - p[1]) * (x - p[0])
      if (Math.abs(cr) < 1e-9) continue
      const sg = cr > 0 ? 1 : -1
      if (!부호) 부호 = sg
      else if (sg !== 부호) return false
    }
    return true
  }
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) if (안(x0 + (i + 0.5) * 칸, y0 + (j + 0.5) * 칸)) M[j * W + i] = 1
}

const 줄길이 = (r) => { let L = 0; for (let i = 0; i < r.length; i++) { const a = r[i], b = r[(i + 1) % r.length]; L += Math.hypot(b[0] - a[0], b[1] - a[1]) } return L }
const 줄넓이 = (r) => { let A = 0; for (let i = 0; i < r.length; i++) { const a = r[i], b = r[(i + 1) % r.length]; A += a[0] * b[1] - b[0] * a[1] } return A / 2 }

/**
 * @param {number[]|Float64Array} 선 평면 선 [x1,y1,x2,y2, …] (mm) — 발자국용(구조 평면의 보이는 선 전부)
 * @param {number[]|Float64Array|null} 벽선 방 나누기용(구조물 레이어 선) — 없으면 «선» 을 씀
 * @param {{방폭?:number, 벽최소?:number, 벽최대?:number, 칸최소?:number}} o 방폭: 이보다 넓으면 «빈 곳»(mm · 기본 1500) · 벽최소: 겹선 짝 최소 사이(기본 120 · 건물 판넬 70) · 벽최대: 짝 최대 사이(기본 1600 · 건물 1000 — 🧭 G242 치수 두 줄 1.2 m 를 벽으로 읽지 않게) · 칸최소: 칸 크기 하한(기본 50 mm)
 * @returns {null | {바닥:number[][][], 벽:number[][][], 넓이:{바닥:number, 벽:number}, 둘레:{바닥:number, 벽:number}, 두께:number, 방:number, 칸:number}}
 *   바닥 · 벽 = 다각형들([[x, y] mm …]) — 바깥 줄 반시계 · 구멍(빈 곳) 시계 · 넓이 ㎡ · 둘레 m · 두께 m
 */
/** 🧾 G402 관 글자(«D2,000mm» · «(=D2,032mm)» · «Φ900» — {x, y, D mm}) 를 사이에 두고 간격 D 로 나란한 두 선 = 관 테두리 → 벽 · 바닥 선에서 뺌
     (현장 S 토출 관: D2,000 관 둘 사이 0.4 m 틈을 벽으로 읽어 길이 12 m · 높이 2 m 벽이 섰음 · 관 밑을 바닥판으로) — 글자 자리를 지나는 선만(같은 줄의 BOX 벽은 그대로) */
export function 관선빼기(선, 관글) {
  if (!관글 || !관글.length || !선 || 선.length < 8) return 선
  const 뺄 = new Set()
  for (const p of 관글) {
    const D = p.D
    if (!(D >= 200 && D <= 4000)) continue
    const 후보 = []
    for (let i = 0; i + 3 < 선.length; i += 4) {
      const ax = 선[i], ay = 선[i + 1], bx = 선[i + 2], by = 선[i + 3]
      const L = Math.hypot(bx - ax, by - ay)
      if (!(L >= D)) continue
      const ux = (bx - ax) / L, uy = (by - ay) / L
      const t = (p.x - ax) * ux + (p.y - ay) * uy
      if (t < -D || t > L + D) continue
      const d = -(p.x - ax) * uy + (p.y - ay) * ux
      if (Math.abs(d) > D * 1.2) continue
      후보.push({ i, ux, uy, d })
    }
    let 좋 = null
    for (const a of 후보) for (const b of 후보) {
      if (a === b || Math.abs(a.ux * b.uy - a.uy * b.ux) > 0.02) continue
      const db = a.ux * b.ux + a.uy * b.uy > 0 ? b.d : -b.d
      if (!(a.d < 0 && db > 0)) continue
      if (Math.abs(db - a.d - D) > Math.max(0.04 * D, 60)) continue
      const 치 = Math.abs((a.d + db) / 2)
      if (!좋 || 치 < 좋.치) 좋 = { a, b, 치 }
    }
    if (좋) { 뺄.add(좋.a.i); 뺄.add(좋.b.i) }
  }
  if (!뺄.size) return 선
  const 새 = []
  for (let i = 0; i + 3 < 선.length; i += 4) if (!뺄.has(i)) 새.push(선[i], 선[i + 1], 선[i + 2], 선[i + 3])
  return 새
}
/** 글자 → 관 지름(mm) — «D2,000mm» · «(=D2,032mm)» · «Φ900» · «%%c600» · «D900» */
export function 관지름(s) {
  const m = String(s || '').trim().match(/^\(?=?\s*(?:[DΦφ∅Ø]|%%[cC])\s*([\d,]{3,6})\s*(?:mm|MM)?\s*\)?$/)
  if (!m) return null
  const D = +m[1].replace(/,/g, '')
  return D >= 200 && D <= 4000 ? D : null
}

export function 구조물면(선, 벽선 = null, o = {}) {
  /* 벽 레이어 선만으로 벽이 거의 안 나오면(벽이 «0» 레이어에 그려진 도면 — 관리동 판넬 벽) 모든 선으로 한 번 더 */
  const r = 구조물면1(선, 벽선, o)
  if (벽선 && r && r.넓이.벽 < 0.02 * r.넓이.바닥) {
    const r2 = 구조물면1(선, null, o)
    if (r2 && r2.넓이.벽 > r.넓이.벽) return r2
  }
  return r
}
function 구조물면1(선, 벽선 = null, o = {}) {
  if (o.관글 && o.관글.length) { 선 = 관선빼기(선, o.관글); if (벽선) 벽선 = 관선빼기(벽선, o.관글) }
  if (!선 || 선.length < 16) return null
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (let i = 0; i < 선.length; i += 2) { x0 = Math.min(x0, 선[i]); x1 = Math.max(x1, 선[i]); y0 = Math.min(y0, 선[i + 1]); y1 = Math.max(y1, 선[i + 1]) }
  const 넓 = (x1 - x0) * (y1 - y0)
  if (!(넓 > 1e6)) return null
  /* 칸 — 2.5 백만 칸 안쪽(70 × 25 m → 50 mm) · 건물(o.칸최소 25)은 판넬 벽(100 mm)도 두 칸 넘게 */
  const 칸 = Math.max(o.칸최소 || 50, Math.ceil(Math.sqrt(넓 / 2.5e6) / 5) * 5)
  const 테 = Math.ceil(300 / 칸) + 2
  x0 -= 테 * 칸; y0 -= 테 * 칸; x1 += 테 * 칸; y1 += 테 * 칸
  const W = Math.ceil((x1 - x0) / 칸), H = Math.ceil((y1 - y0) / 칸)
  if (W * H > 6e6 || W < 8 || H < 8) return null
  const 굵 = Math.max(1, Math.round(200 / 칸))
  /* ① 발자국 */
  const G = new Uint8Array(W * H)
  for (let i = 0; i + 3 < 선.length; i += 4) 선칠(G, W, H, (선[i] - x0) / 칸, (선[i + 1] - y0) / 칸, (선[i + 2] - x0) / 칸, (선[i + 3] - y0) / 칸, 굵)
  const 밖 = 물붓기(G, W, H)
  let F = new Uint8Array(W * H)
  for (let i = 0; i < W * H; i++) F[i] = 밖[i] ? 0 : 1
  F = 늘줄(F, W, H, 굵, false)                                 // 굵게 칠한 만큼 되돌림
  F = 늘줄(늘줄(F, W, H, 2, false), W, H, 2, true)               // 아주 가는 꼬리(선 한 가닥 · 지시선) 깎기
  /* 작은 조각(단면 표시 화살표 · 글자 테두리 · 맨홀 기호) 빼기 — 가장 큰 덩어리의 3 % 또는 4 ㎡ 보다 작은 것 */
  {
    const 번F = new Int32Array(W * H).fill(-1), 크기 = [], 가는 = []
    const qq = new Int32Array(W * H)
    for (let s0 = 0; s0 < W * H; s0++) {
      if (!F[s0] || 번F[s0] >= 0) continue
      const id = 크기.length
      let h = 0, t = 0, bx0 = W, bx1 = 0, by0 = H, by1 = 0
      번F[s0] = id; qq[t++] = s0
      while (h < t) {
        const i = qq[h++], x = i % W, y = (i - x) / W
        if (x < bx0) bx0 = x; if (x > bx1) bx1 = x; if (y < by0) by0 = y; if (y > by1) by1 = y
        if (x > 0 && F[i - 1] && 번F[i - 1] < 0) { 번F[i - 1] = id; qq[t++] = i - 1 }
        if (x < W - 1 && F[i + 1] && 번F[i + 1] < 0) { 번F[i + 1] = id; qq[t++] = i + 1 }
        if (i >= W && F[i - W] && 번F[i - W] < 0) { 번F[i - W] = id; qq[t++] = i - W }
        if (i < W * (H - 1) && F[i + W] && 번F[i + W] < 0) { 번F[i + W] = id; qq[t++] = i + W }
      }
      크기.push(t)
      /* 🧭 G242 건물(o.가는바닥): 평균 폭(넓이 ÷ 긴 변)이 이보다 좁은 조각은 바닥이 아님 — 도면 가장자리 치수 줄 사이(1.2 m 띠)가 떠 있는 바닥판이 됐음 */
      가는.push(o.가는바닥 > 0 && (t * 칸) / (Math.max(bx1 - bx0, by1 - by0) + 1) < o.가는바닥)
    }
    /* 가장 큰 조각은 늘 남김(작은 옥탑 바닥 하나뿐인 층) */
    let 큰번 = -1
    for (let k = 0; k < 크기.length; k++) if (큰번 < 0 || 크기[k] > 크기[큰번]) 큰번 = k
    if (큰번 >= 0) 가는[큰번] = false
    const 큰 = Math.max(0, ...크기.filter((v, k) => !가는[k]))
    const 문 = Math.max(4e6 / (칸 * 칸), 0.03 * 큰)
    for (let i = 0; i < W * H; i++) if (F[i] && (크기[번F[i]] < 문 || 가는[번F[i]])) F[i] = 0
  }
  /* 🧾 G424 종단 윤곽(구조 선이 있는 자리 0.25 m 마다)이 1 m 넘게 빈 곳은 발자국에서 뺌 — 구조물 사이에 묻힌 관 · 관 테두리 선이 두 구조물을 이어 한 발자국이 됐음
       (현장 S 펌프장 ~ 토출수조 사이 관 자리가 바닥판 · 벽으로 섰음 — 종단 A1-A1 그 자리엔 관 선(구조 레이어 아님)뿐) */
  if (o.윤곽 && o.윤곽.length && o.높이 && o.높이.length) {
    const 틈들 = []
    for (const w of o.윤곽) {
      const ts = w.점.filter((q) => q.구 !== false).map((q) => q.x * w.u[0] + q.y * w.u[1]).sort((p, q) => p - q)   // 구조 레이어 선이 없는 자리(관 · 기계 선뿐)는 빈 곳
      for (let k = 0; k + 1 < ts.length; k++) if (ts[k + 1] - ts[k] > 1000) 틈들.push({ u: w.u, a: ts[k] + 125, b: ts[k + 1] - 125 })
    }
    if (틈들.length) {
      let 뺌 = 0
      for (let i = 0; i < W * H; i++) {
        if (!F[i]) continue
        const px = x0 + ((i % W) + 0.5) * 칸, py = y0 + (((i / W) | 0) + 0.5) * 칸
        if (틈들.some((g) => { const t = px * g.u[0] + py * g.u[1]; return t > g.a && t < g.b })) { F[i] = 0; 뺌++ }
      }
    }
  }
  let 발 = 0
  for (let i = 0; i < W * H; i++) 발 += F[i]
  if (발 * 칸 * 칸 < 2e6) return null                          // 2 ㎡ 아래 = 구조물 아님
  /* ② 방 나누기 — 가는 선(± 1 칸)으로 칠하고, 발자국 안의 빈 칸 무리마다 «넓이(가운데 거리)» */
  const L = new Uint8Array(W * H)
  const 쓸선0 = 벽선 && 벽선.length >= 16 ? 벽선 : 선
  /* 🧾 G424 방 안의 닫힌 네모(0.4 ~ 4 m · 네 변이 딱 그 길이 — 더 긴 선의 일부가 아님) — 덮개 구멍 · 받침 · 구멍 틀 · 피트 테두리. 벽이 아님
       (현장 S 배관실: 덮개 구멍 2.5 × 1.75 세 개 · 2.2 × 1.35 사이 1.35 m 틈과 벽 면까지 0.25 m 틈을 겹선 벽 띠로 읽어 없는 벽 약 10 ㎡ 넓이가 섰음)
       토목 구조물(단면 높이 점이 있는 것)만 — 건물 평면의 기둥 네모는 그대로 */
  const 닫힌네모 = []
  let 쓸선 = 쓸선0
  if (o.높이 && o.높이.length) {
    const 가 = [], 세 = []
    for (let i = 0; i + 3 < 쓸선0.length; i += 4) {
      const ax = 쓸선0[i], ay = 쓸선0[i + 1], bx = 쓸선0[i + 2], by = 쓸선0[i + 3]
      if (Math.abs(by - ay) < 2 && Math.abs(bx - ax) > 100) 가.push({ i, a: Math.min(ax, bx), b: Math.max(ax, bx), c: ay })
      else if (Math.abs(bx - ax) < 2 && Math.abs(by - ay) > 100) 세.push({ i, a: Math.min(ay, by), b: Math.max(ay, by), c: ax })
    }
    const 틈 = 30, 뺄 = new Set()
    const 변 = (목록, c, lo, hi) => 목록.filter((v) => Math.abs(v.c - c) < 틈 && v.a <= lo + 틈 && v.b >= hi - 틈 && v.b - v.a <= hi - lo + 3 * 틈)
    for (let p = 0; p < 가.length; p++) for (let q = p + 1; q < 가.length; q++) {
      const A = 가[p], B = 가[q]
      if (Math.abs(A.a - B.a) > 틈 || Math.abs(A.b - B.b) > 틈) continue
      const w = A.b - A.a, lo = Math.min(A.c, B.c), hi = Math.max(A.c, B.c), h = hi - lo
      if (w < 400 || w > 4000 || h < 400 || h > 4000) continue
      const L = 변(세, A.a, lo, hi), R = 변(세, A.b, lo, hi)
      if (!L.length || !R.length) continue
      /* 네 변이 더 긴 선의 일부가 아님 — 같은 줄에 이어진 선(틈 30 안)이 없음 */
      const 이어짐 = (목록, v) => 목록.some((u) => u !== v && Math.abs(u.c - v.c) < 2 && (Math.abs(u.a - v.b) < 틈 || Math.abs(u.b - v.a) < 틈))
      if (이어짐(가, A) || 이어짐(가, B) || 이어짐(세, L[0]) || 이어짐(세, R[0])) continue
      닫힌네모.push({ r: [A.a, lo, A.b, hi], w, h })
      for (const v of [A, B, L[0], R[0]]) 뺄.add(v.i)
    }
    /* 🧾 G424 계단 디딤 줄 — 같은 길이(±30) · 같은 시작 · 끝(±30) 짧은 나란한 선(0.4 ~ 3 m) 넷 넘게가 같은 간격(0.15 ~ 0.7 m · ±30)으로 늘어선 것
         (현장 S 펌프 칸 계단A: 디딤 557 마다 선 → 두 선 사이 557 를 겹선 벽 띠로 읽어 칸마다 없는 벽 셋씩 · 약 5 ㎡ 넓이가 섰음) */
    const 계단줄 = []
    for (const [목록, 세로] of [[가, false], [세, true]]) {
      const 쓴 = new Set()
      const 차 = [...목록].sort((p, q) => p.c - q.c)
      for (let p = 0; p < 차.length; p++) {
        if (쓴.has(차[p])) continue
        const A = 차[p], 길 = A.b - A.a
        if (길 < 400 || 길 > 3000) continue
        const 무 = [A]
        for (let q = p + 1; q < 차.length; q++) {
          const B = 차[q], 끝 = 무[무.length - 1], 간 = B.c - 끝.c
          if (간 > 750) break
          if (Math.abs(B.a - A.a) > 30 || Math.abs(B.b - A.b) > 30 || 간 < 150) continue
          if (무.length >= 2 && Math.abs(간 - (무[1].c - 무[0].c)) > 30) continue
          무.push(B)
        }
        if (무.length >= 5) { for (const v of 무) { 쓴.add(v); 뺄.add(v.i) } 계단줄.push({ 세로, 수: 무.length, 간격: Math.round(무[1].c - 무[0].c), 길이: Math.round(길), r: 세로 ? [무[0].c, A.a, 무[무.length - 1].c, A.b] : [A.a, 무[0].c, A.b, 무[무.length - 1].c] }) }
      }
    }
    if (뺄.size) { const n = []; for (let i = 0; i + 3 < 쓸선0.length; i += 4) if (!뺄.has(i)) n.push(쓸선0[i], 쓸선0[i + 1], 쓸선0[i + 2], 쓸선0[i + 3]); 쓸선 = n }
    /* 🧾 G424 계단 — 디딤 줄 무리 옆의 긴 두 선(계단 옆 테두리) 길이 ÷ 디딤 간격 = 단 수(끝 선이 벽 면이라 안 잡혀도) · 평면 «계단» 글자가 2 m 안에 있는 무리만
         (현장 S 펌프장 계단A: 옆 선 3.9 m ÷ 557 = 7 단 × 4 칸 = 28 · 토출 계단B: 3.7 m ÷ 411 = 9 단 × 2 = 18 — 산출서와 같음 · 220 간격 400 길이 무리는 글자가 없어 계단 아님) */
    for (const z of 계단줄) {
      const [rx0, ry0, rx1, ry1] = z.r
      const 옆 = (z.세로 ? 가 : 세).filter((v) => (Math.abs(v.c - (z.세로 ? ry0 : rx0)) < 30 || Math.abs(v.c - (z.세로 ? ry1 : rx1)) < 30) && v.a <= (z.세로 ? rx0 : ry0) + 30 && v.b >= (z.세로 ? rx1 : ry1) - 30)
      const L = 옆.length ? Math.max(...옆.map((v) => v.b - v.a)) : 0
      z.단 = L > 0 ? Math.round(L / z.간격) : z.수 - 1
      z.옆선 = Math.round(L)
      const 글 = (o.계단글 || []).find((t) => t.x >= rx0 - 2000 && t.x <= rx1 + 2000 && t.y >= ry0 - 2000 && t.y <= ry1 + 2000)
      z.이름 = 글 ? 글.s : ''
    }
    o.계단줄 = 계단줄
  }
  for (let i = 0; i + 3 < 쓸선.length; i += 4) 선칠(L, W, H, (쓸선[i] - x0) / 칸, (쓸선[i + 1] - y0) / 칸, (쓸선[i + 2] - x0) / 칸, (쓸선[i + 3] - y0) / 칸, 1)
  const 빈 = new Uint8Array(W * H)
  for (let i = 0; i < W * H; i++) 빈[i] = F[i] && !L[i] ? 1 : 0
  const D = 거리(빈, W, H)
  const 번 = new Int32Array(W * H).fill(-1)
  const 넓은 = []
  const q = new Int32Array(W * H)
  const 문턱 = ((o.방폭 || 1500) / 2) / 칸
  let 방 = 0
  for (let s = 0; s < W * H; s++) {
    if (!빈[s] || 번[s] >= 0) continue
    const id = 넓은.length
    let qh = 0, qt = 0, 큰 = 0
    번[s] = id; q[qt++] = s
    while (qh < qt) {
      const i = q[qh++], x = i % W
      if (D[i] > 큰) 큰 = D[i]
      const 이웃 = [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i >= W ? i - W : -1, i < W * (H - 1) ? i + W : -1]
      for (const j of 이웃) if (j >= 0 && 빈[j] && 번[j] < 0) { 번[j] = id; q[qt++] = j }
    }
    넓은.push(큰 >= 문턱)
    if (큰 >= 문턱) 방++
  }
  let R = new Uint8Array(W * H)
  for (let i = 0; i < W * H; i++) R[i] = 번[i] >= 0 && 넓은[번[i]] ? 1 : 0
  R = 늘줄(R, W, H, 1, true)                                    // 방 쪽 선 칸(± 1 칸 굵기)을 방으로 되돌림
  /* ③ 겹선 짝(벽 띠) — 좁은 칸 무리 중 «벽 띠 안에 든 것» 만 벽 속으로(기계 · 스크린 사이 좁은 틈은 뺌) */
  const Lc = new Uint8Array(W * H)                              // 가운데 줄 검사용(가장 가는 선)
  for (let i = 0; i + 3 < 쓸선.length; i += 4) 선칠(Lc, W, H, (쓸선[i] - x0) / 칸, (쓸선[i + 1] - y0) / 칸, (쓸선[i + 2] - x0) / 칸, (쓸선[i + 3] - y0) / 칸, 0)
  const { 띠, 두께: 띠두께 } = 겹선띠(쓸선, Lc, W, H, x0, y0, 칸, o.벽최소 || 120, o.벽최대 || 1600)
  const B = new Uint8Array(W * H)
  for (const Q of 띠) 네모칠(B, W, H, x0, y0, 칸, Q)
  const 무리수 = new Int32Array(넓은.length), 무리띠 = new Int32Array(넓은.length)
  for (let i = 0; i < W * H; i++) { const b = 번[i]; if (b < 0) continue; 무리수[b]++; if (B[i]) 무리띠[b]++ }
  const C0 = new Uint8Array(W * H)
  for (let i = 0; i < W * H; i++) {
    const b = 번[i]
    if (B[i] && F[i]) C0[i] = 1
    else if (b >= 0 && !넓은[b] && 무리띠[b] >= 0.4 * 무리수[b]) C0[i] = 1
  }
  /* 이음 · 모서리의 작은 틈만 메움(닫기 1 칸) — 선 칸을 통째로 붙이면 벽이 양쪽 면마다 한 칸씩 두꺼워짐(600 → 700) */
  const C1 = 늘줄(늘줄(C0, W, H, 1, true), W, H, 1, false)
  let C = new Uint8Array(W * H)
  for (let i = 0; i < W * H; i++) C[i] = F[i] && !R[i] && C1[i] ? 1 : 0
  C = 늘줄(늘줄(C, W, H, 1, false), W, H, 1, true)               // 외줄 선(방 사이 한 가닥 · 기계 테두리) 깎기
  for (let i = 0; i < W * H; i++) if (!F[i]) C[i] = 0
  let 벽칸 = 0
  for (let i = 0; i < W * H; i++) 벽칸 += C[i]
  /* ④ 다각형 */
  const 꼴 = (M) => 테두리들(M, W, H, 1.2).map((r) => r.map(([i, j]) => [Math.round(x0 + i * 칸), Math.round(y0 + j * 칸)]))
  const 바닥 = 꼴(F), 벽 = 벽칸 ? 꼴(C) : []
  const 둘 = (rs) => rs.reduce((s, r) => s + 줄길이(r), 0) / 1000
  const 벽둘레 = 둘(벽)
  const 벽넓이 = 벽칸 * 칸 * 칸 / 1e6
  /* 📐 G234 높이별 벽 · 바닥 — 평면 자르는 선(A ─ A …)에 세운 단면의 벽 면 «위 · 아래 EL» 점(o.높이 [{x, y, 위, 아래}] mm · m)
       칸마다 가장 가까운 점(12 m 안 · 1 m 칸 표로 찾음)의 위 높이(5 cm 맞춤)로 무리 → 무리마다 벽 다각형 · 그 무리 점들의 가장 낮은 아래 = 바닥판 아래
       멀어서 점이 없는 칸은 «기본»(무리 −1 — 일꾼이 주는 단면 가운데 아래 ~ G.L) */
  let 벽들 = null, 바닥들 = null, 바닥판두께 = null, 덮개들 = null, 덮개모름 = null, 중간판들 = null, 헌치들 = null
  if (o.높이 && o.높이.length >= 2) {
    /* 🧾 G400 바닥판 두께 — 같은 벽 두 면(1.6 m 안 · 위 같음)의 아래 차이(안쪽 면 = 바닥판 윗면 · 바깥 면 = 아랫면)가 가장 흔한 값(0.25 ~ 1.5 m · 두 번 넘게) */
    {
      const 셈 = new Map()
      for (const q of o.높이) for (const r of o.높이) {
        if (r === q || !q.방향 || !r.방향 || Math.abs(q.방향[0] * r.방향[0] + q.방향[1] * r.방향[1]) < 0.99 || Math.abs(q.위 - r.위) > 0.05) continue
        if (!(Math.hypot(r.x - q.x, r.y - q.y) <= 1600) || !(r.아래 > q.아래)) continue
        const d = Math.round((r.아래 - q.아래) / 0.05) * 0.05
        if (d >= 0.25 && d <= 1.5) 셈.set(d, (셈.get(d) || 0) + 1)
      }
      const 젤 = [...셈].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0]
      if (젤 && 젤[1] >= 2) 바닥판두께 = +젤[0].toFixed(2)
      /* 🧾 G424 단면에서 바로 읽은 바닥판 두께(바닥판 위에 선 벽 면 아래 끝 − 바닥판 아랫면 · 버림 뺌)가 두 번 넘게 같으면 그것을 먼저 */
      const 셈2 = new Map()
      for (const q of o.높이) if (q.바닥두께) { const d = Math.round(q.바닥두께 / 0.05) * 0.05; 셈2.set(d, (셈2.get(d) || 0) + 1) }
      const 젤2 = [...셈2].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0]
      if (젤2 && 젤2[1] >= 2) 바닥판두께 = +젤2[0].toFixed(2)
    }
    /* 🧾 G400 벽 두 면(같은 단면 · 1.6 m 안)의 아래는 둘 중 낮은 것 — 안쪽 면은 바닥판 윗면, 바깥 면은 아랫면에서 끝나 무리가 갈리지 않게 */
    const P = o.높이.map((q) => {
      let 아래 = q.아래
      for (const r of o.높이) {
        if (r === q || !q.방향 || !r.방향 || Math.abs(q.방향[0] * r.방향[0] + q.방향[1] * r.방향[1]) < 0.99) continue
        /* 🧾 G402 두 면 아래 차이가 바닥판 두께(1.5 m)보다 크면 서로 다른 선(현장 S 토출수조 앞벽: 바깥 면 EL 1.63 · 안쪽은 옆벽 끝 선이 −2.17 까지) — 제 것을 씀 */
        if (Math.hypot(r.x - q.x, r.y - q.y) <= 1600 && r.위 >= q.위 - 0.05 && r.아래 < 아래 && q.아래 - r.아래 <= 1.5) 아래 = r.아래
      }
      return 아래 === q.아래 ? q : { ...q, 아래 }
    })
    /* 🧾 G400 무리 = (위 · 아래) 짝 — 전에는 위만으로 무리를 지어 «위가 같은 벽» 이 그중 가장 낮은 아래를 같이 씀
         (현장 S 배수장: 칸막이 벽 EL −0.51 ~ 3.92 가 펌프장 바닥 −2.75 부터 세워져 벽 높이 4.43 → 6.05 m) */
    /*   아래는 0.65 m 넘게 떨어진 것만 가름(바닥판 윗면 · 아랫면 차이 0.6 m 쯤은 한 무리 — 가장 낮은 아래 · 더 떨어진 «바닥판 윗면에 선 벽» 은 BIM토목 이 두께를 안 더함) */
    const 위키 = (v) => Math.round(v / 0.05)
    const 아래띠 = new Map()                                       // 위키 → [[띠 아래 시작 · 끝] …]
    for (const k of [...new Set(P.map((q) => 위키(q.위)))]) {
      const 값 = P.filter((q) => 위키(q.위) === k).map((q) => q.아래).sort((a, b) => a - b)
      const 띠 = []
      for (const v of 값) { const L = 띠[띠.length - 1]; if (L && v - L[1] <= 0.65) L[1] = v; else 띠.push([v, v]) }
      아래띠.set(k, 띠)
    }
    const 쌍키 = (위, 아래) => { const k = 위키(위), 띠 = 아래띠.get(k) || []; const j = 띠.findIndex((L) => 아래 >= L[0] - 1e-9 && 아래 <= L[1] + 1e-9); return `${k}|${j >= 0 ? j : Math.round(아래 / 0.05) + 'r'}` }
    const 키들 = [...new Set(P.map((q) => 쌍키(q.위, q.아래)))].sort((a, b) => { const [p1, q1] = a.split('|').map(parseFloat), [p2, q2] = b.split('|').map(parseFloat); return p1 - p2 || q1 - q2 })
    const 무리위 = 키들.map((k) => parseFloat(k.split('|')[0]) * 0.05)
    const 무리아래 = 키들.map((k) => Math.min(...P.filter((q) => 쌍키(q.위, q.아래) === k).map((q) => q.아래)))
    const 점무리 = P.map((q) => 키들.indexOf(쌍키(q.위, q.아래)))
    /* 🧾 G400 종단 윤곽(o.윤곽 [{u, 점:[{x, y, 위}]}] — 짝 없는 긴 단면의 «그 자리 가장 높은 구조 선») — 단면 점에서 3 m 넘게 먼 벽 칸은 이 높이를 넘지 않게
         (현장 S 배수장: 토출수조 10.3 m 단면 점 하나가 깔때기 벽(2 ~ 3.8 m) 까지 번져 거푸집을 크게 셈) */
    const 윤들 = (o.윤곽 || []).filter((w) => w && w.u && w.점 && w.점.length >= 4).map((w) => {
      const [ux, uy] = w.u, p0 = w.점[0]
      const T = w.점.map((q) => (q.x - p0.x) * ux + (q.y - p0.y) * uy)
      const 순 = T.map((t, i) => i).sort((a, b) => T[a] - T[b])
      return { ux, uy, p0, T: 순.map((i) => T[i]), V: 순.map((i) => w.점[i].위), B: 순.map((i) => w.점[i].아래), D: 순.map((i) => w.점[i].가 || undefined), W: 순.map((i) => !!w.점[i].벽) }
    })
    /* 🧾 G402 종단 윤곽의 «그 자리 가장 낮은 구조 선»(바닥판 아랫면) — ±0.5 m 안 가장 낮은 값 */
    const 윤밑 = (cx, cy) => {
      let 밑 = null
      for (const w of 윤들) {
        if (!w.B.every(Number.isFinite)) continue
        const t = (cx - w.p0.x) * w.ux + (cy - w.p0.y) * w.uy
        let lo = 0, hi = w.T.length - 1
        while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (w.T[mid] < t) lo = mid; else hi = mid }
        const j = Math.abs(w.T[lo] - t) <= Math.abs(w.T[hi] - t) ? lo : hi
        if (Math.abs(w.T[j] - t) > 700) continue
        let v = Infinity
        for (let k = j; k >= 0 && w.T[j] - w.T[k] <= 500; k--) v = Math.min(v, w.B[k])
        for (let k = j; k < w.T.length && w.T[k] - w.T[j] <= 500; k++) v = Math.min(v, w.B[k])
        밑 = 밑 === null ? v : Math.min(밑, v)
      }
      return 밑
    }
    const 윤높 = (cx, cy) => {
      let 높 = null
      for (const w of 윤들) {
        const t = (cx - w.p0.x) * w.ux + (cy - w.p0.y) * w.uy
        let lo = 0, hi = w.T.length - 1
        while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (w.T[mid] < t) lo = mid; else hi = mid }
        const j = Math.abs(w.T[lo] - t) <= Math.abs(w.T[hi] - t) ? lo : hi
        if (Math.abs(w.T[j] - t) > 700) continue
        let v = -Infinity                                            // ±0.5 m 안 가장 높은 값(벽 두께 안에서 흔들리지 않게)
        for (let k = j; k >= 0 && w.T[j] - w.T[k] <= 500; k--) v = Math.max(v, w.V[k])
        for (let k = j; k < w.T.length && w.T[k] - w.T[j] <= 500; k++) v = Math.max(v, w.V[k])
        높 = 높 === null ? v : Math.max(높, v)
      }
      return 높
    }
    /* 🧾 G424 종단 윤곽의 덮개 띠 — 이 칸 자리(종단 줄에 내린 자리)의 가로선 높이들에 덮개 밑 · 위가 다 있으면 그 덮개(맞음(가) → 덮개 | null)
         · 위 선이 없어도(둘레 턱 · 구멍) 밑 선이 있고 양옆 3 m 안이 같은 덮개면 덮개(구멍은 열린 곳 맞대기에서 뺌) · 종단이 없거나 멀면 undefined */
    const 윤덮 = (cx, cy, 맞음) => {
      let r
      for (const w of 윤들) {
        if (!w.D.some((v) => v !== undefined)) continue
        const t = (cx - w.p0.x) * w.ux + (cy - w.p0.y) * w.uy
        let lo = 0, hi = w.T.length - 1
        while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (w.T[mid] < t) lo = mid; else hi = mid }
        const j = Math.abs(w.T[lo] - t) <= Math.abs(w.T[hi] - t) ? lo : hi
        if (Math.abs(w.T[j] - t) > 700) { if (t > w.T[0] && t < w.T[w.T.length - 1]) r = null; continue }   // 종단 안인데 그 자리에 구조 선이 없음 = 덮개 없음
        const 여기 = w.D[j] ? 맞음(w.D[j]) : null
        if (여기) return 여기
        let 왼 = null, 오 = null
        for (let k = j - 1; k >= 0 && w.T[j] - w.T[k] <= 3000; k--) { const q = w.D[k] ? 맞음(w.D[k]) : null; if (q) { 왼 = q; break } }
        for (let k = j + 1; k < w.T.length && w.T[k] - w.T[j] <= 3000; k++) { const q = w.D[k] ? 맞음(w.D[k]) : null; if (q) { 오 = q; break } }
        if (왼 && 오 && 왼 === 오 && (w.D[j] || []).some((u) => Math.abs(u - 왼.밑) <= 0.03)) return 왼      // 덮개 밑 선은 이어짐(구멍 둘레 턱 · 구멍) — 벽 위끝만 있는 자리는 안 메움
        r = null
      }
      return r
    }
    const 덮키 = new Map()
    const 무리밑면 = []                                               // 🧾 G402 아래가 바닥판 아랫면(윤곽)인 무리 — BIM토목 이 바닥판 두께를 더해 벽을 세움
    const 덮무리 = (위, 아래, 밑면 = false) => {
      const k = `${위키(위)}|${Math.round(아래 / 0.05)}${밑면 ? '|b' : ''}`
      let i = 덮키.get(k)
      if (i === undefined) { i = 무리위.length; 덮키.set(k, i); 무리위.push(Math.round(위 / 0.05) * 0.05); 무리아래.push(아래); 무리밑면[i] = 밑면 } else 무리아래[i] = Math.min(무리아래[i], 아래)
      return i
    }
    const 큰칸 = 1000, GW = Math.ceil((x1 - x0) / 큰칸) + 1, GH = Math.ceil((y1 - y0) / 큰칸) + 1
    const 멀리 = 12000
    /* 가까운 점 표 셋 — 모든 점 · 가로 벽용(자르는 선이 세로인 점) · 세로 벽용(자르는 선이 가로인 점)
       벽 칸은 «그 벽에 직각으로 자른 단면» 의 점을 먼저(종단면 가운데 줄의 낮은 칸막이 높이가 옆 바깥벽으로 번지지 않게) */
    const 표만들기 = (고르개) => {
      const A = new Int32Array(GW * GH).fill(-1)
      for (let gj = 0; gj < GH; gj++) for (let gi = 0; gi < GW; gi++) {
        const cx = x0 + (gi + 0.5) * 큰칸, cy = y0 + (gj + 0.5) * 큰칸
        let b = -1, bd = 멀리
        for (let n = 0; n < P.length; n++) { if (!고르개(P[n])) continue; const d = Math.hypot(P[n].x - cx, P[n].y - cy); if (d < bd) { bd = d; b = n } }
        A[gj * GW + gi] = b
      }
      return A
    }
    const 모든표 = 표만들기(() => true)
    const 가로표 = 표만들기((q) => q.방향 && Math.abs(q.방향[1]) > 0.7), 세로표 = 표만들기((q) => q.방향 && Math.abs(q.방향[0]) > 0.7)
    /* 벽 칸 방향 — 가로 · 세로로 이어진 벽 칸 길이 */
    const 가로길 = new Int32Array(W * H), 세로길 = new Int32Array(W * H)
    for (let y = 0; y < H; y++) { let s0 = -1; for (let x = 0; x <= W; x++) { const i = y * W + x; if (x < W && C[i]) { if (s0 < 0) s0 = x } else if (s0 >= 0) { for (let k = s0; k < x; k++) 가로길[y * W + k] = x - s0; s0 = -1 } } }
    for (let x = 0; x < W; x++) { let s0 = -1; for (let y = 0; y <= H; y++) { const i = y * W + x; if (y < H && C[i]) { if (s0 < 0) s0 = y } else if (s0 >= 0) { for (let k = s0; k < y; k++) 세로길[k * W + x] = y - s0; s0 = -1 } } }
    const 무리칸 = (i, 벽칸이냐) => {
      const x = i % W, y = (i / W) | 0
      const gi = Math.min(GW - 1, Math.floor((x * 칸) / 큰칸)), gj = Math.min(GH - 1, Math.floor((y * 칸) / 큰칸)), gk = gj * GW + gi
      let g = -1
      if (벽칸이냐) g = 가로길[i] >= 세로길[i] ? 가로표[gk] : 세로표[gk]
      if (g < 0) g = 모든표[gk]
      if (g >= 0 && 윤들.length) {
        const cx = x0 + (x + 0.5) * 칸, cy = y0 + (y + 0.5) * 칸
        let 위 = P[g].위, 아래 = P[g].아래, 바뀜 = false, 밑면 = false
        /* 🧾 G402 윤곽이 그 단면 점 자리에서 점 높이를 보면(같거나 높음) 칸 자리 윤곽도 믿음 — 3 m 안이라도 낮춤
             (현장 S 토출수조 → 깔때기 벽: 10.5 m 점에서 1 ~ 3 m 떨어진 깔때기 벽(4.2 m)이 10.5 m 로 섰음) */
        if (벽칸이냐) {
          const 덮 = 윤높(cx, cy)
          if (덮 !== null && 덮 < 위 - 0.1) {
            const 제 = 윤높(P[g].x, P[g].y)
            if (Math.hypot(P[g].x - cx, P[g].y - cy) > 3000 || (제 !== null && 제 >= 위 - 0.1)) { 위 = 덮; 바뀜 = true }
          }
        }
        /* 🧾 G402 바닥도 윤곽으로 — 칸 자리의 가장 낮은 구조 선(바닥판 아랫면) → 그 자리 바닥(벽은 바닥판 위부터)
             · 위를 윤곽으로 낮춘 칸(점과 다른 자리): 점 자리 윤곽 바닥과 0.3 m 넘게 다르면 칸 자리 바닥(앞벽 아래 1.63 옆 수로 벽 → 수로 바닥)
             · 그 밖: 칸 자리 바닥이 점 아래보다 0.3 m 넘게 높고 점 자리에선 윤곽이 점 아래를 볼 때만 올림
             (현장 S 토출 BOX: 끝벽 EL −3.02 를 따라 BOX 벽이 EL −3.02 부터 섰음 → BOX 바닥 −1.17) */
        {
          const 밑 = 윤밑(cx, cy), 제밑 = 윤밑(P[g].x, P[g].y)
          const 다른자리 = 위 < P[g].위 - 0.1
          if (밑 !== null && 제밑 !== null && (다른자리 ? Math.abs(밑 - 제밑) > 0.3 : 밑 > 아래 + 0.3 && 제밑 <= 아래 + 0.3)) { 아래 = 밑 + (벽칸이냐 && 바닥판두께 ? 바닥판두께 : 0); 밑면 = 벽칸이냐 && !바닥판두께; 바뀜 = true }
        }
        if (바뀜 && 위 - 아래 >= 0.2) return 덮무리(위, 아래, 밑면)                  // 위가 아래 밑으로 가면(윤곽이 엉뚱) 고치지 않음
      }
      return g < 0 ? -1 : 점무리[g]
    }
    const 나눔 = (M) => {
      const 칸들 = new Map()
      const 벽이냐 = M === C
      for (let i = 0; i < W * H; i++) { if (!M[i]) continue; const c = 무리칸(i, 벽이냐); let a = 칸들.get(c); if (!a) { a = new Uint8Array(W * H); 칸들.set(c, a) } a[i] = 1 }
      /* 🧭 G292 ⑤ 무리끼리 맞닿은 길이(m) — 높이가 달라 나눈 자리의 자른 면은 거푸집이 아님(높이 차만큼만 드러남 · BIM토목 이 씀) */
      const 라벨 = new Int32Array(W * H).fill(-9), 키 = [...칸들.keys()]
      키.forEach((c, k) => { const A = 칸들.get(c); for (let i = 0; i < W * H; i++) if (A[i]) 라벨[i] = k })
      const 접 = 키.map(() => new Map())
      for (let i = 0; i < W * H; i++) {
        const a = 라벨[i]; if (a < 0) continue
        const x = i % W
        for (const j of [x < W - 1 ? i + 1 : -1, i < W * (H - 1) ? i + W : -1]) { if (j < 0) continue; const b = 라벨[j]; if (b < 0 || b === a) continue; 접[a].set(b, (접[a].get(b) || 0) + 1); 접[b].set(a, (접[b].get(a) || 0) + 1) }
      }
      return 키.map((c, k) => { const A = 칸들.get(c); let n = 0; for (let i = 0; i < W * H; i++) n += A[i]; const 판 = 꼴(A); return { 무리: c, 위: c >= 0 ? 무리위[c] : null, 아래: c >= 0 ? 무리아래[c] : null, ...(c >= 0 && 무리밑면[c] ? { 밑면: true } : {}), 판, 넓이: n * 칸 * 칸 / 1e6, 둘레: 둘(판), 맞닿음: [...접[k]].map(([b, m]) => ({ 무리: 키[b], 길이: m * 칸 / 1000 })) } }).filter((x) => x.판.length)
    }
    벽들 = 벽칸 ? 나눔(C) : []
    바닥들 = 나눔(F)
    /* 🧾 G402 덮개 슬래브 — 같은 단면 줄에서 바깥 면 위가 안쪽 면 위보다 0.15 ~ 0.6 m 높으면 그 사이가 덮개 두께(안쪽 면 위 = 덮개 밑면)
         · 같은 줄에서 위가 그 밑면과 같은 점(칸막이 두 면)도 덮개 밑 · 벽이 아닌 바닥 칸 중 가장 가까운 점이 덮개 밑이면 덮인 칸(밑면 거푸집 · 두께만큼 콘크리트)
         · 종단 윤곽이 있으면 그 자리에 덮개 윗면 높이의 선이 있을 때만
         (현장 S 펌프장: 바깥벽 EL 4.22 · 안쪽 면 · 칸막이 3.92 → 덮개 0.3 m — 설계사 산출서 «상부슬래브» 밑면 126.9 ㎡ 를 안 셌음) */
    {
      const 같은줄 = (q, r) => q.방향 && r.방향 && Math.abs(q.방향[0] * r.방향[0] + q.방향[1] * r.방향[1]) >= 0.99 && Math.abs((r.x - q.x) * q.방향[1] - (r.y - q.y) * q.방향[0]) < 300
      const 짝들 = []
      for (const q of P) for (const r of P) {
        if (r === q || !같은줄(q, r) || !(Math.hypot(r.x - q.x, r.y - q.y) <= 1600)) continue
        const d = r.위 - q.위
        if (d >= 0.15 && d <= 0.6) 짝들.push({ q, r, 밑: q.위, 두께: Math.round(d / 0.05) * 0.05 })
      }
      const 덮점 = P.map((q) => 짝들.find((m) => 같은줄(m.q, q) && Math.abs(m.밑 - q.위) <= 0.05) || null)
      const 덮칸 = new Map()                                           // 키 → { 밑, 두께, A: 칸 표 }
      /* 🧾 G424 덮개 정의(밑 · 두께)마다 하나 · 방향마다 덮개 짝 점이 놓인 옆 범위(그 방향 단면들이 보여 준 덮개 폭 — 펌프장 바깥 계단 터 · 토출 쪽 방은 빠짐) · 종단 방향은 종단 덮개 띠가 정함 */
      const 덮정의 = []
      for (const m of 짝들) if (!덮정의.some((q) => Math.abs(q.밑 - m.밑) < 0.03 && Math.abs(q.두께 - m.두께) < 0.03)) 덮정의.push({ 밑: m.밑, 두께: m.두께 })
      const 정의 = (m) => 덮정의.find((q) => Math.abs(q.밑 - m.밑) < 0.03 && Math.abs(q.두께 - m.두께) < 0.03)
      const 옆범위 = []
      for (const m of 짝들) {
        const u = m.q.방향, k = 정의(m)
        let g = 옆범위.find((e) => e.k === k && Math.abs(e.u[0] * u[0] + e.u[1] * u[1]) >= 0.99)
        if (!g) { g = { k, u: [Math.abs(u[0]), Math.abs(u[1])], lo: Infinity, hi: -Infinity }; 옆범위.push(g) }
        for (const p of [m.q, m.r]) { const t = p.x * g.u[0] + p.y * g.u[1]; g.lo = Math.min(g.lo, t); g.hi = Math.max(g.hi, t) }
      }
      const 옆안 = (k, cx, cy) => 옆범위.filter((g) => g.k === k && !윤들.some((w) => Math.abs(w.ux * g.u[0] + w.uy * g.u[1]) >= 0.99)).every((g) => { const t = cx * g.u[0] + cy * g.u[1]; return t >= g.lo - 300 && t <= g.hi + 300 })
      const 맞음 = (가) => 덮정의.find((q) => 가.some((u) => Math.abs(u - q.밑) <= 0.03) && 가.some((u) => Math.abs(u - (q.밑 + q.두께)) <= 0.03)) || null
      if (덮점.some(Boolean)) {
        for (let i = 0; i < W * H; i++) {
          if (!F[i] || C[i]) continue
          const x = i % W, y = (i / W) | 0
          const gi = Math.min(GW - 1, Math.floor((x * 칸) / 큰칸)), gj = Math.min(GH - 1, Math.floor((y * 칸) / 큰칸))
          const g = 모든표[gj * GW + gi]
          const 띠 = 윤덮(x0 + (x + 0.5) * 칸, y0 + (y + 0.5) * 칸, 맞음)
          let m = null
          if (띠 !== undefined) {
            /* 🧾 G424 종단에 덮개 띠가 있으면 그것으로(가로 단면의 덮개 밑 · 위 선이 종단 그 자리에 다 있을 때만) — 가까운 높이 점 따라 들쭉날쭉 · 유입부 · 바깥까지 번지던 것 */
            if (!띠 || !옆안(띠, x0 + (x + 0.5) * 칸, y0 + (y + 0.5) * 칸)) continue
            m = 띠
          } else {
            m = g >= 0 ? 덮점[g] : null
            if (!m) continue
            if (윤들.length) { const 덮 = 윤높(x0 + (x + 0.5) * 칸, y0 + (y + 0.5) * 칸); if (덮 !== null && 덮 < m.밑 + m.두께 - 0.1) continue }
          }
          const k = `${Math.round(m.밑 / 0.05)}|${Math.round(m.두께 / 0.05)}`
          let e = 덮칸.get(k); if (!e) { e = { 밑: Math.round(m.밑 / 0.05) * 0.05, 두께: m.두께, A: new Uint8Array(W * H) }; 덮칸.set(k, e) }
          e.A[i] = 1
        }
      }
      /* 🧾 G424 덮개 열린 곳 — 단면의 덮개 구멍 짝(o.열린곳 — 덮개 두께만큼인 세로 선 둘을 평면 자르는 줄 위 두 점으로)이 지나는 평면 닫힌 네모 · 원 중
           그 줄에서 잘린 길이 · 가운데가 짝과 같은(±10 % · 0.1 m / 0.3 m) 꼴 → 덮개 칸에서 뺌(넓이 · 콘크리트) · 둘레 × 두께는 구멍 옆 거푸집
           단면이 안 지나는 덮개 아래 닫힌 꼴은 «❓ 구멍인지 도면으로 모름»(맨홀 · 피트 — 단면 · 상세가 있어야 앎) · 단면이 지나는데 구멍 짝이 없으면 구멍 아님
           (현장 S 배수장: 단면 B-B 1.8 × 3 · 1.5 = 평면 원 Ø1.8 · Ø1.5 · C-C 1.75 × 3 · 1.35 = 배관실 네모 2.5 × 1.75 · 2.2 × 1.35 — 설계사 산출서 상부슬래브 공제와 같음) */
      const 꼴목록 = [
        ...닫힌네모.map((q) => ({ 꼴: '네모', x0: q.r[0], y0: q.r[1], x1: q.r[2], y1: q.r[3], cx: (q.r[0] + q.r[2]) / 2, cy: (q.r[1] + q.r[3]) / 2, 넓이: (q.w * q.h) / 1e6, 둘레: (2 * (q.w + q.h)) / 1000, 크기: `${(q.w / 1000).toFixed(2)} × ${(q.h / 1000).toFixed(2)}` })),
        ...(o.원 || []).filter((c) => c.r >= 150 && c.r <= 2500).map((c) => ({ 꼴: '원', cx: c.x, cy: c.y, r: c.r, 넓이: (Math.PI * c.r * c.r) / 1e6, 둘레: (2 * Math.PI * c.r) / 1000, 크기: `Ø${(2 * c.r / 1000).toFixed(2)}` })),
      ]
      /* 줄(a → b, 길이 L) 이 꼴을 자르는 구간 [t0, t1] (줄 방향 거리 · 끝 없이) */
      const 자른구간 = (a, b, f) => {
        const L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 1) return null
        const ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L
        if (f.꼴 === '원') {
          const dx = f.cx - a[0], dy = f.cy - a[1], tc = dx * ux + dy * uy, dn = Math.abs(dx * uy - dy * ux)
          if (dn >= f.r) return null
          const h = Math.sqrt(f.r * f.r - dn * dn); return [tc - h, tc + h, L]
        }
        let t0 = -Infinity, t1 = Infinity
        for (const [p, q, lo, hi] of [[a[0], ux, f.x0, f.x1], [a[1], uy, f.y0, f.y1]]) {
          if (Math.abs(q) < 1e-9) { if (p < lo || p > hi) return null; continue }
          let s0 = (lo - p) / q, s1 = (hi - p) / q; if (s0 > s1) [s0, s1] = [s1, s0]
          t0 = Math.max(t0, s0); t1 = Math.min(t1, s1)
        }
        return t1 - t0 > 1 ? [t0, t1, L] : null
      }
      const 칸안 = (f, x, y) => (f.꼴 === '원' ? Math.hypot(x - f.cx, y - f.cy) <= f.r : x >= f.x0 && x <= f.x1 && y >= f.y0 && y <= f.y1)
      const 덮칸들 = [...덮칸.values()]
      const 칸번 = (x, y) => { const i = Math.floor((x - x0) / 칸), j = Math.floor((y - y0) / 칸); return i >= 0 && j >= 0 && i < W && j < H ? j * W + i : -1 }
      const 덮개에 = (f) => { const k = 칸번(f.cx, f.cy); return k < 0 ? null : 덮칸들.find((e) => e.A[k]) || null }
      const 쓴꼴 = new Set(), 짝없음 = []
      for (const e of 덮칸들) e.열린 = []
      for (const h of o.열린곳 || []) {
        if (!덮칸들.some((e) => Math.abs(e.밑 - h.밑) <= 0.06)) continue        // 덮개 높이의 틈만(바닥 피트 가장자리 등은 뺌)
        let 고른 = null
        for (const f of 꼴목록) {
          if (쓴꼴.has(f)) continue
          const c = 자른구간(h.a, h.b, f); if (!c) continue
          const [t0, t1, L] = c, 오 = Math.abs(t1 - t0 - L), 가오 = Math.abs((t0 + t1) / 2 - L / 2)
          if (오 > Math.max(0.1 * L, 100) || 가오 > Math.max(300, 0.2 * L)) continue
          if (!고른 || 오 + 가오 < 고른.e) 고른 = { f, e: 오 + 가오 }
        }
        const e = 고른 && 덮개에(고른.f)
        if (!고른 || !e || Math.abs(e.밑 - h.밑) > 0.06) { 짝없음.push({ 단면: h.단면, 폭: Math.round(Math.hypot(h.b[0] - h.a[0], h.b[1] - h.a[1])) / 1000, h }); continue }
        const f = 고른.f
        쓴꼴.add(f)
        let n = 0
        for (let i = 0; i < W * H; i++) if (e.A[i] && 칸안(f, x0 + ((i % W) + 0.5) * 칸, y0 + (((i / W) | 0) + 0.5) * 칸)) { e.A[i] = 0; n++ }
        e.열린.push({ 꼴: f.꼴, 크기: f.크기, 넓이: f.넓이, 둘레: f.둘레, 뺀칸: (n * 칸 * 칸) / 1e6, 단면: h.단면, 자리: [f.cx, f.cy] })
      }
      /* 단면 틈(평면 위 두 점)과 꼴을 그 단면 줄 방향으로 내려 본 폭이 같은지(±0.1 m) — 뒤로 보이는 구멍 */
      const 투영맞음 = (z, f) => {
        const { a, b } = z.h, L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 1) return false
        const ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L
        const c = (f.cx - a[0]) * ux + (f.cy - a[1]) * uy
        const 투 = f.꼴 === '원' ? [c - f.r, c + f.r] : (() => { const ts = [[f.x0, f.y0], [f.x1, f.y0], [f.x0, f.y1], [f.x1, f.y1]].map(([x, y]) => (x - a[0]) * ux + (y - a[1]) * uy); return [Math.min(...ts), Math.max(...ts)] })()
        return Math.abs(투[0]) <= 100 && Math.abs(투[1] - L) <= 100
      }
      /* ❓ 단면이 안 지나는 덮개 아래 닫힌 꼴(같은 가운데 꼴은 하나로 — 맨홀 1.0 · 테 1.2) */
      const 모름 = []
      for (const f of 꼴목록) {
        if (쓴꼴.has(f) || !덮개에(f)) continue
        if ((o.자름선 || []).some((z) => { const c = 자른구간(z.a, z.b, f); return c && c[1] > 0 && c[0] < c[2] })) continue
        /* 다른 줄의 단면(대개 종단)에 같은 자리 · 폭의 덮개 틈이 보이면 적어 둠(뒤로 보이는 것일 수 있어 빼지는 않음 — ✋ 로 정함) */
        const 보임 = [...new Set(짝없음.filter((z) => 투영맞음(z, f)).map((z) => z.단면))]
        const g = 모름.find((m) => Math.hypot(m.자리[0] - f.cx, m.자리[1] - f.cy) < 60)
        if (g) { if (!g.크기.includes(f.크기)) g.크기.push(f.크기); for (const v of 보임) if (!g.보임.includes(v)) g.보임.push(v) } else 모름.push({ 꼴: f.꼴, 크기: [f.크기], 자리: [f.cx, f.cy], 보임 })
      }
      덮개모름 = { 꼴: 모름, 짝없음: 짝없음.filter((z) => !꼴목록.some((f) => 투영맞음(z, f))).map((z) => ({ 단면: z.단면, 폭: z.폭 })) }   // 평면 꼴로 설명되는 틈(뒤로 보이는 구멍)은 뺌
      덮개들 = 덮칸들.map((e) => { let n = 0; for (let i = 0; i < W * H; i++) n += e.A[i]; return { 밑: e.밑, 두께: e.두께, 판: 꼴(e.A), 넓이: n * 칸 * 칸 / 1e6, 열린: e.열린 } }).filter((e) => e.판.length && e.넓이 >= 1)
    }
    /* 🧾 G424 중간 슬래브 — 단면의 중간판(벽 면 둘 사이 · 평면 위 두 점 a → b) → 그 가운데가 든 방(벽으로 막힌 칸 무리) 안에서
         같은 밑 · 위의 중간판마다 그 줄 방향으로 두 벽 면 사이(±1 칸)인 칸 · 두 방향 단면이 다 있으면 네모 · 한 방향뿐이면 «한방향»
         헌치(중간판 끝의 45° 사선) = 그 끝 벽 면을 따라 판 너비(다른 방향 길이)만큼 — 부피 ½ × 다리² × 길이 · 밑 헌치 자리는 밑면 거푸집에서 뺌
         (현장 S 배관실: C-C 11.4 m · 종단 A1-A1 3.0 m(2.6 + 헌치 0.2 × 2) · EL 0.895 ~ 1.295 → 3.0 × 11.4 × 0.4 = 13.68 · 밑면 2.6 × 11.4 = 29.64 — 산출서와 같음) */
    if ((o.중간판 || []).length) {
      const 방 = new Int32Array(W * H).fill(-1), q2 = new Int32Array(W * H)
      let n방 = 0
      for (let s0 = 0; s0 < W * H; s0++) {
        if (!F[s0] || C[s0] || 방[s0] >= 0) continue
        let qh = 0, qt = 0; 방[s0] = n방; q2[qt++] = s0
        while (qh < qt) { const i = q2[qh++], x = i % W; for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i >= W ? i - W : -1, i < W * (H - 1) ? i + W : -1]) if (j >= 0 && F[j] && !C[j] && 방[j] < 0) { 방[j] = n방; q2[qt++] = j } }
        n방++
      }
      const 칸번 = (x, y) => { const i = Math.floor((x - x0) / 칸), j = Math.floor((y - y0) / 칸); return i >= 0 && j >= 0 && i < W && j < H ? j * W + i : -1 }
      const 무리 = new Map()
      for (const h of o.중간판) {
        const k0 = 칸번((h.a[0] + h.b[0]) / 2, (h.a[1] + h.b[1]) / 2), r = k0 >= 0 ? 방[k0] : -1
        if (r < 0) continue
        const 키 = `${r}|${Math.round(h.밑 / 0.02)}|${Math.round(h.위 / 0.02)}`
        let g = 무리.get(키); if (!g) { g = { r, 밑: h.밑, 위: h.위, 줄: [] }; 무리.set(키, g) }
        const L = Math.hypot(h.b[0] - h.a[0], h.b[1] - h.a[1]); if (L < 300) continue
        if (!g.줄.some((z) => Math.abs(z.ux * (h.b[0] - h.a[0]) / L + z.uy * (h.b[1] - h.a[1]) / L) > 0.99 && Math.abs(z.L - L) < 100)) g.줄.push({ a: h.a, ux: (h.b[0] - h.a[0]) / L, uy: (h.b[1] - h.a[1]) / L, L, 헌치: h.헌치 || [], 단면: h.단면 })
      }
      중간판들 = []
      for (const g of 무리.values()) {
        if (!g.줄.length) continue
        const A = new Uint8Array(W * H)
        let n = 0
        for (let i = 0; i < W * H; i++) {
          if (방[i] !== g.r) continue
          const px = x0 + ((i % W) + 0.5) * 칸, py = y0 + (((i / W) | 0) + 0.5) * 칸
          if (g.줄.every((z) => { const t = (px - z.a[0]) * z.ux + (py - z.a[1]) * z.uy; return t >= -칸 && t <= z.L + 칸 })) { A[i] = 1; n++ }
        }
        if (n * 칸 * 칸 < 1e6) continue
        /* 헌치 — 줄마다 그 끝 벽 면을 따라 «다른 방향 판 길이» (판 칸을 이 줄에 직각으로 내린 폭) */
        const 헌 = []
        for (const z of g.줄) {
          let lo = Infinity, hi = -Infinity
          for (let i = 0; i < W * H; i++) if (A[i]) { const px = x0 + ((i % W) + 0.5) * 칸, py = y0 + (((i / W) | 0) + 0.5) * 칸, t = -(px - z.a[0]) * z.uy + (py - z.a[1]) * z.ux; if (t < lo) lo = t; if (t > hi) hi = t }
          const 길 = (hi - lo + 칸) / 1000
          for (const h of z.헌치) 헌.push({ 쪽: h.쪽, 다리: h.다리, 길이: +길.toFixed(3), 단면: z.단면 })
        }
        중간판들.push({ 밑: g.밑, 두께: +(g.위 - g.밑).toFixed(3), 판: 꼴(A), 넓이: n * 칸 * 칸 / 1e6, 단면: [...new Set(g.줄.map((z) => z.단면))], 한방향: g.줄.length < 2, 헌치: 헌 })
      }
    }
    /* 🧾 G424 헌치 — ① 평면 45° 사선(다리 0.1 ~ 0.65 m · 두 끝이 벽 칸에 닿고 가운데는 방) = 벽 모서리 세로 헌치 · 높이 = 가까운 단면 점의 벽 면 위 − 바닥판 윗면
         ② 단면 벽 면 위 · 아래 끝의 45° 사선(높이 점 헌치위 · 헌치아래) = 덮개 · 바닥판과 벽 사이 가로 헌치 · 길이 = 그 벽 면에 닿은 방이 벽 면을 따라 가는 길이
         (현장 S 펌프장: 평면 0.2 사선 8 · 0.5 사선 1(유입부) · 배관실 종단 위 · 아래 0.2 × 11.4 — 산출서 «헌치» 와 같은 꼴) */
    헌치들 = []
    {
      const 방2 = new Int32Array(W * H).fill(-1), q3 = new Int32Array(W * H)
      let n2 = 0
      for (let s0 = 0; s0 < W * H; s0++) {
        if (!F[s0] || C[s0] || 방2[s0] >= 0) continue
        let qh = 0, qt = 0; 방2[s0] = n2; q3[qt++] = s0
        while (qh < qt) { const i = q3[qh++], x = i % W; for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i >= W ? i - W : -1, i < W * (H - 1) ? i + W : -1]) if (j >= 0 && F[j] && !C[j] && 방2[j] < 0) { 방2[j] = n2; q3[qt++] = j } }
        n2++
      }
      const 칸번2 = (x, y) => { const i = Math.floor((x - x0) / 칸), j = Math.floor((y - y0) / 칸); return i >= 0 && j >= 0 && i < W && j < H ? j * W + i : -1 }
      const 벽가까이 = (x, y) => { for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const k = 칸번2(x + dx * 칸, y + dy * 칸); if (k >= 0 && C[k]) return true } return false }
      const 맑은높이 = (x, y) => {
        let b = null, bd = Infinity
        for (const q of o.높이) { const d = Math.hypot(q.x - x, q.y - y); if (d < bd && q.바닥두께) { bd = d; b = q } }
        if (!b || bd > 12000) return null
        return { 높이: +(b.위 - (b.아래 + b.바닥두께)).toFixed(3), 점: b }
      }
      /* ① 평면 사선 */
      const 본 = []
      for (let i = 0; i + 3 < 쓸선0.length; i += 4) {
        const ax = 쓸선0[i], ay = 쓸선0[i + 1], bx = 쓸선0[i + 2], by = 쓸선0[i + 3], dx = Math.abs(bx - ax), dy = Math.abs(by - ay)
        if (dx < 100 || dx > 650 || Math.abs(dx - dy) > 0.15 * dx) continue
        const mx = (ax + bx) / 2, my = (ay + by) / 2
        if (본.some((p) => Math.hypot(p[0] - mx, p[1] - my) < 60)) continue
        if (!벽가까이(ax, ay) || !벽가까이(bx, by)) continue
        /* 모서리 쪽(두 벽 면이 만나는 점)은 벽 칸 · 반대쪽(방 쪽)은 방 칸 */
        const 벽점 = (x, y) => { let n = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const k = 칸번2(x + dx * 칸, y + dy * 칸); if (k >= 0 && C[k]) n++ } return n }
        const n1 = 벽점(ax, by), n2 = 벽점(bx, ay)
        const [kx, ky] = n1 >= 3 && n1 >= n2 ? [ax, by] : n2 >= 3 ? [bx, ay] : [NaN, NaN]
        if (!Number.isFinite(kx)) continue                                   // 모서리 점이 벽 속이 아니면(바깥 모서리를 깎은 사선) 헌치 아님
        const rx = mx + (mx - kx) * 0.6, ry = my + (my - ky) * 0.6, kr = 칸번2(rx, ry)
        if (kr < 0 || C[kr]) continue                                        // 사선 너머(방 · 물길 쪽)는 벽이 아님
        const h = 맑은높이(mx, my)
        본.push([mx, my])
        헌치들.push({ 쪽: '세로', 다리: +(dx / 1000).toFixed(3), 길이: h ? h.높이 : null, 자리: [mx, my], 모서리: [kx, ky], 끝: [[ax, ay], [bx, by]] })
      }
      /* ② 단면 가로 헌치 */
      const 못쪽 = []
      for (const q of o.높이) for (const [쪽, 다리] of [['위', q.헌치위], ['아래', q.헌치아래]]) {
        if (!다리 || !q.방향) continue
        const [ux, uy] = q.방향, nx = -uy, ny = ux
        /* 벽 면에서 단면 줄 방향 양쪽 0.15 ~ 0.6 m 칸 — 방인 쪽 */
        for (const 부호 of [1, -1]) {
          /* 벽 면 바로 옆(0.05 ~ 0.2 m)이 방이어야 그쪽(벽 속을 지나 건너편 방을 잡지 않게) */
          let r = -1, 벽쪽 = false
          for (let t = 칸 / 2; t <= 200 && r < 0 && !벽쪽; t += 칸) { const k = 칸번2(q.x + 부호 * ux * t, q.y + 부호 * uy * t); if (k < 0) break; if (C[k]) 벽쪽 = true; else if (F[k] && 방2[k] >= 0) r = 방2[k] }
          if (r < 0) continue
          /* 그 방 칸 중 벽 면 띠(줄 방향 0 ~ 0.3 m) 안의 칸이 벽 면 방향(n)으로 덮는 길이(칸 줄 합 — 칸막이 벽 자리는 빠짐) */
          const 덮음 = new Set()
          let lo = Infinity, hi = -Infinity
          for (let i = 0; i < W * H; i++) {
            if (방2[i] !== r) continue
            const px = x0 + ((i % W) + 0.5) * 칸 - q.x, py = y0 + (((i / W) | 0) + 0.5) * 칸 - q.y
            const t = 부호 * (px * ux + py * uy); if (t < 0 || t > 300) continue
            const v = px * nx + py * ny; 덮음.add(Math.round(v / 칸)); if (v < lo) lo = v; if (v > hi) hi = v
          }
          if (!덮음.size) continue
          /* 벽 면 띠가 그 방 옆면을 거의 다(80 % 넘게) 덮을 때만 — 단면 점이 칸막이 · 다른 벽 끝에 걸쳐 방 한 귀퉁이만 닿은 것은 빼고 ❓ */
          if (덮음.size * 칸 < 0.8 * (hi - lo + 칸) || 덮음.size * 칸 < 1000) { 못쪽.push({ q, 쪽, 다리 }); continue }
          const 키 = `${r}|${쪽}|${Math.round((q.x * ux + q.y * uy) / 200)}`
          if (헌치들.some((h) => h.키 === 키)) continue
          let 방칸 = 0; for (let i = 0; i < W * H; i++) if (방2[i] === r) 방칸++
          헌치들.push({ 쪽, 다리, 길이: +((덮음.size * 칸) / 1000).toFixed(3), 자리: [q.x, q.y], 방향: [nx, ny], 범위: [lo, hi], 키, 방넓이: 방칸 * 칸 * 칸 / 1e6 })
        }
      }
      /* 한쪽도 못 정한 벽 면 끝 사선만 ❓ */
      for (const m of 못쪽) if (!헌치들.some((h) => h.쪽 === m.쪽 && h.자리 && Math.hypot(h.자리[0] - m.q.x, h.자리[1] - m.q.y) < 1)) 헌치들.push({ 쪽: m.쪽, 다리: m.다리, 길이: null, 자리: [m.q.x, m.q.y], 키: '', 못: '벽 면 띠가 방 옆면을 다 안 덮음' })
    }
  }
  return {
    바닥, 벽, 벽들, 바닥들, 바닥판두께, 덮개들, 덮개모름, 중간판들, 헌치들, 닫힌네모, 계단줄: o.계단줄 || [],
    /* 🧾 G424 계단 — «계단» 글자가 있는 디딤 무리 · 높이(단 높이)는 계단상세도 글(«높이는 0.2m») — 없으면 높이 null(❓) */
    계단들: (o.계단줄 || []).filter((z) => z.이름).map((z) => { const 높 = o.계단말 && o.계단말.높이 ? o.계단말.높이 : null, 너 = z.길이 / 1000, 런 = z.간격 / 1000; return { 이름: z.이름, 단: z.단, 간격: z.간격, 너비: 너, 높이: 높, r: z.r, 부피: 높 ? z.단 * 0.5 * 런 * 높 * 너 : 0, 거푸집: 높 ? z.단 * (높 * 너 + 런 * 높) : 0 } }),
    넓이: { 바닥: 발 * 칸 * 칸 / 1e6, 벽: 벽넓이 },
    둘레: { 바닥: 둘(바닥.filter((r) => 줄넓이(r) > 0)), 벽: 벽둘레 },
    두께: 벽둘레 > 0 ? (2 * 벽넓이) / 벽둘레 : 0,
    띠두께: 띠.length ? 띠두께.reduce((a, v) => a + v, 0) / 1000 / 띠.reduce((a, Q) => a + Math.hypot(Q[1][0] - Q[0][0], Q[1][1] - Q[0][1]), 0) : 0,
    띠수: 띠.length, 방, 칸,
  }
}
