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
  let 발 = 0
  for (let i = 0; i < W * H; i++) 발 += F[i]
  if (발 * 칸 * 칸 < 2e6) return null                          // 2 ㎡ 아래 = 구조물 아님
  /* ② 방 나누기 — 가는 선(± 1 칸)으로 칠하고, 발자국 안의 빈 칸 무리마다 «넓이(가운데 거리)» */
  const L = new Uint8Array(W * H)
  const 쓸선 = 벽선 && 벽선.length >= 16 ? 벽선 : 선
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
  let 벽들 = null, 바닥들 = null
  if (o.높이 && o.높이.length >= 2) {
    const P = o.높이
    const 키들 = [...new Set(P.map((q) => Math.round(q.위 / 0.05)))].sort((a, b) => a - b)
    const 무리위 = 키들.map((k) => k * 0.05)
    const 무리아래 = 키들.map((k) => Math.min(...P.filter((q) => Math.round(q.위 / 0.05) === k).map((q) => q.아래)))
    const 점무리 = P.map((q) => 키들.indexOf(Math.round(q.위 / 0.05)))
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
      return g < 0 ? -1 : 점무리[g]
    }
    const 나눔 = (M) => {
      const 칸들 = new Map()
      const 벽이냐 = M === C
      for (let i = 0; i < W * H; i++) { if (!M[i]) continue; const c = 무리칸(i, 벽이냐); let a = 칸들.get(c); if (!a) { a = new Uint8Array(W * H); 칸들.set(c, a) } a[i] = 1 }
      return [...칸들].map(([c, A]) => { let n = 0; for (let i = 0; i < W * H; i++) n += A[i]; const 판 = 꼴(A); return { 무리: c, 위: c >= 0 ? 무리위[c] : null, 아래: c >= 0 ? 무리아래[c] : null, 판, 넓이: n * 칸 * 칸 / 1e6, 둘레: 둘(판) } }).filter((x) => x.판.length)
    }
    벽들 = 벽칸 ? 나눔(C) : []
    바닥들 = 나눔(F)
  }
  return {
    바닥, 벽, 벽들, 바닥들,
    넓이: { 바닥: 발 * 칸 * 칸 / 1e6, 벽: 벽넓이 },
    둘레: { 바닥: 둘(바닥.filter((r) => 줄넓이(r) > 0)), 벽: 벽둘레 },
    두께: 벽둘레 > 0 ? (2 * 벽넓이) / 벽둘레 : 0,
    띠두께: 띠.length ? 띠두께.reduce((a, v) => a + v, 0) / 1000 / 띠.reduce((a, Q) => a + Math.hypot(Q[1][0] - Q[0][0], Q[1][1] - Q[0][1]), 0) : 0,
    띠수: 띠.length, 방, 칸,
  }
}
