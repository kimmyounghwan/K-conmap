/**
 * 🧊 BIM 물량 — 토목(배수로 · 수로 · 박스 · 토공 · 땅) · 구조물(배수장)을 «좌표로 읽어» 3D 덩어리 + 물량 (G225 · 2026-10-10)
 *
 * 소장님: 「토목도면과 건물도면을 한꺼번에 넣으면 모두 되게 해줘」 · 「부재가 없으면 좌표로 읽어서 물량 뽑으면 되지않아?」
 *         「최대한 3d화면이 잘 나오게 해줘」 · 「물량도..」
 *
 * ■ 재료 = 도면 3D 일꾼(lib/dxf3d.worker.js)의 r.활용 — 노선(평면 중심선) · 횡단(단면마다 콘크리트 · 터파기 · 성토 «모양») · 구조물(벽 · 바닥 다각형) · 땅(측량점 삼각망)
 * ■ 3D
 *   - 배수로 · 수로 = 횡단 단면 «콘크리트 모양» 을 노선을 따라 끌어 세움(단면마다 앞뒤 반 칸씩 · 굽은 곳은 잘게 · 기울기는 단면 바닥 높이를 이어서)
 *   - 터파기 · 성토 = 같은 방법으로 비쳐 보이는 흙 덩어리
 *   - 구조물(배수장) = 평면 겹선으로 읽은 벽 모양을 단면 EL 높이로 세움 + 바닥판(두께 짐작 — 칸에서 바꿈)
 *   - 땅 = 측량점 삼각망(비쳐 보임)
 *   - 🏢 G228 건물(건축 평면) = 일꾼 r.활용.건물(층마다 평면 겹선으로 읽은 벽 · 바닥 모양) → 층 바닥판 + 벽(층 바닥 ~ 윗층 바닥판 아래) · 지붕판
 *     소장님 「토목 도면을 넣어도, 건축도면을 넣어도, 토목하고 건축이 함께 나오도록 해줘.」 — 부재 일람표가 없는 건축 도면도 같은 3D 에
 *     자리: 일꾼이 배치도의 같은 모양(같은 방 이름 둘레)에 놓았으면 그대로 · 못 찾았으면(옆) 토목 오른쪽 20 m · 높이는 땅(측량 면)에
 *     같은 도면을 골조(부재 일람표)로 이미 세웠으면(옵.뺄건물) 빼서 겹치지 않게
 * ■ 물량 = 평균단면법(토공3d.js 평균단면 — 도면 3D 활용 · 토공 화면과 같은 셈) · 구조물 = 벽 넓이 × 높이 + 바닥 넓이 × 두께(개략)
 *   단면 하나(부재 하나)의 몫 = 앞 · 뒤 칸 평균단면 부피의 반씩 → 몫을 다 더하면 노선 합계와 꼭 같음
 * ■ 좌표: mm · 원점 = 일꾼 r.center(x, y) · 높이 = 표고(EL m × 1000)
 */
import { 평균단면 } from './토공3d.js'
import { 노선자리, 측점글 } from './활용3d.js'

export const 토목종류 = ['수로', '구조물', '건물', '흙막이', '터파기', '성토', '지형']
export const 토목색 = { 수로: [0.78, 0.75, 0.68], 구조물: [0.30, 0.70, 0.68], 구조바닥: [0.62, 0.66, 0.72], 건물: [0.95, 0.84, 0.62], 건물바닥: [0.78, 0.81, 0.88], 흙막이: [0.36, 0.39, 0.46], 토류판: [0.84, 0.64, 0.40], 띠장: [0.92, 0.30, 0.26], 버팀보: [0.14, 0.66, 0.40], 사보강: [0.98, 0.60, 0.14], 보강재: [0.66, 0.36, 0.84], 터파기: [0.80, 0.56, 0.32], 성토: [0.50, 0.70, 0.32], 지형: [0.60, 0.72, 0.52] }   // 🎨 G232 또렷한 색(BIM 프로그램처럼) · 배수로 = 콘크리트 모래색 · 흙막이 말뚝 = 강재 회색(고른 것 파랑과 안 겹치게)
export const 토목비침 = { 터파기: 0.26, 성토: 0.32, 지형: 0.42 }
export const 토목이름 = { 수로: '배수로 · 수로', 구조물: '구조물', 건물: '건물(평면)', 흙막이: '흙막이 · 가설', 터파기: '터파기', 성토: '성토', 지형: '땅' }
/* 🏢 G228 지붕 층 이름(층고 없이 맨 위) · 벽 두께가 이보다 두껍거나 얇으면 벽으로 안 봄(해치 · 설비 · 글자 덩어리) */
const 지붕층 = /^(RF|PH|R|ROOF)\d*$|옥상|지붕|옥탑/i
const 벽두께범위 = [0.05, 0.6]

const 넓 = (r) => { let A = 0; for (let i = 0; i < r.length; i++) { const a = r[i], b = r[(i + 1) % r.length]; A += a[0] * b[1] - b[0] * a[1] } return A / 2 }
const 안에 = (p, r) => {
  let c = false
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const a = r[i], b = r[j]
    if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c
  }
  return c
}
const 맞물 = (rs) => {
  /* 바깥 줄(반시계)마다 그 안의 구멍(시계) 묶기 */
  const 바 = [], 구 = []
  for (const r of rs || []) { if (!r || r.length < 3) continue; const A = 넓(r); if (Math.abs(A) < 1e-9) continue; (A > 0 ? 바 : 구).push(r) }
  const 묶 = 바.map((r) => ({ 바깥: r, 구멍: [] }))
  for (const h of 구) {
    const 집 = 묶.filter((m) => 안에(h[0], m.바깥)).sort((p, q) => Math.abs(넓(p.바깥)) - Math.abs(넓(q.바깥)))[0]
    if (집) 집.구멍.push(h)
  }
  return 묶
}

/* ── 구멍 있는 다각형 세모 나누기(구멍을 다리로 이어 한 줄로 → 귀 자르기) ── */
export function 다리잇기(바깥, 구멍들) {
  let P = 바깥.map((p) => [p[0], p[1]])
  const 구 = 구멍들.map((h) => h.map((p) => [p[0], p[1]])).sort((a, b) => Math.max(...b.map((p) => p[0])) - Math.max(...a.map((p) => p[0])))
  const 세안 = (p, a, b, c) => {     // p 가 세모 abc 안(경계 포함) — 방향 상관없이
    const d1 = (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])
    const d2 = (c[0] - b[0]) * (p[1] - b[1]) - (c[1] - b[1]) * (p[0] - b[0])
    const d3 = (a[0] - c[0]) * (p[1] - c[1]) - (a[1] - c[1]) * (p[0] - c[0])
    return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0))
  }
  for (const h of 구) {
    // 구멍의 가장 오른쪽 점 M → 오른쪽으로 쏜 줄이 처음 닿는 변(I) → 그 변의 오른쪽 끝 점 Q
    // 🩹 G228 세모(M · I · Q) 안에 안으로 꺾인 점이 있으면 그 점으로(보이는 점) — 전엔 다리가 다른 방 벽을 가로질러 뚜껑이 방을 덮음(관리동 벽 뚜껑 616 ㎡)
    let mi = 0; for (let i = 1; i < h.length; i++) if (h[i][0] > h[mi][0]) mi = i
    const M = h[mi]
    let best = -1, bx = Infinity
    for (let i = 0; i < P.length; i++) {
      const a = P[i], b = P[(i + 1) % P.length]
      if ((a[1] > M[1]) === (b[1] > M[1]) && a[1] !== M[1] && b[1] !== M[1]) continue
      if (a[1] === b[1]) continue
      const t = (M[1] - a[1]) / (b[1] - a[1])
      if (t < 0 || t > 1) continue
      const x = a[0] + t * (b[0] - a[0])
      if (x >= M[0] && x < bx) { bx = x; best = a[0] > b[0] ? i : (i + 1) % P.length }
    }
    if (best >= 0 && !(P[best][0] === bx && P[best][1] === M[1])) {
      const I = [bx, M[1]], Q = P[best]
      let 고른 = best, 각 = Infinity, 거 = Infinity
      const n = P.length
      for (let j = 0; j < n; j++) {
        if (j === best) continue
        const a = P[(j + n - 1) % n], c = P[j], d = P[(j + 1) % n]
        const 꺾 = (c[0] - a[0]) * (d[1] - c[1]) - (c[1] - a[1]) * (d[0] - c[0])
        if (꺾 >= 0) continue                         // 볼록한 점은 안 봄(반시계 기준 안으로 꺾인 점만)
        if (c[0] < M[0] || !세안(c, M, I, Q)) continue
        const dx = c[0] - M[0], dy = c[1] - M[1]
        const g = Math.abs(Math.atan2(dy, dx)), e = dx * dx + dy * dy
        if (g < 각 - 1e-12 || (Math.abs(g - 각) <= 1e-12 && e < 거)) { 각 = g; 거 = e; 고른 = j }
      }
      best = 고른
    }
    if (best < 0) {   // 못 찾으면 가장 가까운 점
      let d = Infinity
      for (let i = 0; i < P.length; i++) { const e = (P[i][0] - M[0]) ** 2 + (P[i][1] - M[1]) ** 2; if (e < d) { d = e; best = i } }
    }
    const 돌린 = h.slice(mi).concat(h.slice(0, mi))
    P = P.slice(0, best + 1).concat(돌린, [[M[0], M[1]]], [[P[best][0], P[best][1]]], P.slice(best + 1))
  }
  return P
}
/** 귀 자르기 — 같은 좌표(다리 점)는 «안의 점» 으로 보지 않음 · 반시계 다각형 */
export function 귀자르기(P) {
  const n = P.length
  if (n < 3) return []
  const idx = [...Array(n).keys()]
  const out = []
  const 넓3 = (a, b, c) => (P[b][0] - P[a][0]) * (P[c][1] - P[a][1]) - (P[b][1] - P[a][1]) * (P[c][0] - P[a][0])
  const 같 = (p, q) => p[0] === q[0] && p[1] === q[1]
  const 안 = (q, a, b, c) => {
    const p = P[q]
    if (같(p, P[a]) || 같(p, P[b]) || 같(p, P[c])) return false
    const s1 = (P[b][0] - P[a][0]) * (p[1] - P[a][1]) - (P[b][1] - P[a][1]) * (p[0] - P[a][0])
    const s2 = (P[c][0] - P[b][0]) * (p[1] - P[b][1]) - (P[c][1] - P[b][1]) * (p[0] - P[b][0])
    const s3 = (P[a][0] - P[c][0]) * (p[1] - P[c][1]) - (P[a][1] - P[c][1]) * (p[0] - P[c][0])
    return s1 >= 0 && s2 >= 0 && s3 >= 0
  }
  let 막 = 0, i = 0
  while (idx.length > 3 && 막 < idx.length * 2 + 10) {
    const m = idx.length
    const a = idx[(i + m - 1) % m], b = idx[i % m], c = idx[(i + 1) % m]
    let 됨 = false
    if (넓3(a, b, c) > 1e-12) {
      됨 = true
      for (const q of idx) { if (q === a || q === b || q === c) continue; if (안(q, a, b, c)) { 됨 = false; break } }
    }
    if (됨) { out.push(a, b, c); idx.splice(i % m, 1); 막 = 0; i = Math.max(0, (i % m) - 1) }
    else { i = (i + 1) % m; 막++ }
  }
  if (idx.length === 3) out.push(idx[0], idx[1], idx[2])
  else if (idx.length > 3) for (let k = 1; k + 1 < idx.length; k++) out.push(idx[0], idx[k], idx[k + 1])   // 꼬인 것 — 부채꼴
  return out
}

/**
 * 🩹 G228 띠 나누기 — 바깥 + 구멍 다각형을 가로 띠(점 높이마다)로 잘라 사다리꼴 → 세모(홀짝 규칙 · 다리 없이 늘 맞음)
 *   방이 여럿인 벽 테두리(구멍 넷)를 다리로 잇다 꼬여 뚜껑 세모가 방을 덮던 것(관리동 벽 뚜껑 616 ㎡ — 벽 17 ㎡) 대신
 * @returns [[x, y] × 3, …] 반시계 세모들
 */
export function 띠나누기(줄들) {
  const 변 = []
  for (const r of 줄들) for (let i = 0; i < r.length; i++) { const a = r[i], b = r[(i + 1) % r.length]; if (a[1] !== b[1]) 변.push(a[1] < b[1] ? [a[0], a[1], b[0], b[1]] : [b[0], b[1], a[0], a[1]]) }
  const ys = [...new Set(줄들.flatMap((r) => r.map((p) => p[1])))].sort((p, q) => p - q)
  const 세 = []
  const x에 = (e, y) => e[0] + (e[2] - e[0]) * (y - e[1]) / (e[3] - e[1])
  for (let k = 0; k + 1 < ys.length; k++) {
    const y0 = ys[k], y1 = ys[k + 1], ym = (y0 + y1) / 2
    if (!(y1 > y0)) continue
    const 걸 = 변.filter((e) => e[1] <= y0 && e[3] >= y1).map((e) => [x에(e, ym), x에(e, y0), x에(e, y1)]).sort((p, q) => p[0] - q[0])
    for (let j = 0; j + 1 < 걸.length; j += 2) {
      const L = 걸[j], R = 걸[j + 1]
      if (R[1] - L[1] > 1e-9) 세.push([[L[1], y0], [R[1], y0], [R[2], y1]])
      if (R[2] - L[2] > 1e-9) 세.push([[L[1], y0], [R[2], y1], [L[2], y1]])
    }
  }
  return 세
}

/** 볼록 껍질에 든 점 번호(모노톤 체인) */
function 볼록점(r) {
  const idx = r.map((_, i) => i).sort((a, b) => r[a][0] - r[b][0] || r[a][1] - r[b][1])
  const 꺾 = (o, a, b) => (r[a][0] - r[o][0]) * (r[b][1] - r[o][1]) - (r[a][1] - r[o][1]) * (r[b][0] - r[o][0])
  const 아 = [], 위 = []
  for (const i of idx) { while (아.length >= 2 && 꺾(아[아.length - 2], 아[아.length - 1], i) <= 0) 아.pop(); 아.push(i) }
  for (let k = idx.length - 1; k >= 0; k--) { const i = idx[k]; while (위.length >= 2 && 꺾(위[위.length - 2], 위[위.length - 1], i) <= 0) 위.pop(); 위.push(i) }
  return new Set([...아, ...위])
}

/**
 * 2D 모양(바깥 + 구멍)을 «틀» 여럿(앞 → 뒤)을 따라 세운 덩어리
 * @param 묶 [{바깥, 구멍}] (2D)
 * @param 틀들 [(u, v) => [x, y, z]] — 첫 틀 · 끝 틀에 뚜껑
 * @returns {{면:number[], 선:number[]}}
 */
function 끌어세우기(묶, 틀들, { 모서리각 = 35 } = {}) {
  const 면 = [], 선 = []
  const K = 틀들.length
  if (K < 2) return { 면, 선 }
  const 세모 = (a, b, c) => { 면.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]) }
  for (const m of 묶) {
    const 줄들 = [m.바깥, ...m.구멍]
    for (const r of 줄들) {
      const n = r.length
      // 세로 모서리 선 — 바깥 줄의 볼록 껍질 위 꺾인 점만(계단 · 안쪽 꺾임까지 그으면 멀리서 까맣게 뭉침) · 구멍 줄은 안 그음
      const 껍 = r === m.바깥 ? 볼록점(r) : new Set()
      const 꺾 = r.map((p, i) => {
        if (!껍.has(i)) return false
        const a = r[(i + n - 1) % n], c = r[(i + 1) % n]
        const v1 = [p[0] - a[0], p[1] - a[1]], v2 = [c[0] - p[0], c[1] - p[1]]
        const l1 = Math.hypot(...v1) || 1, l2 = Math.hypot(...v2) || 1
        const cos = (v1[0] * v2[0] + v1[1] * v2[1]) / (l1 * l2)
        return Math.acos(Math.max(-1, Math.min(1, cos))) * 180 / Math.PI > 모서리각
      })
      for (let k = 0; k + 1 < K; k++) {
        const F0 = 틀들[k], F1 = 틀들[k + 1]
        const A = r.map((p) => F0(p[0], p[1])), B = r.map((p) => F1(p[0], p[1]))
        for (let i = 0; i < n; i++) {
          const j = (i + 1) % n
          세모(A[i], A[j], B[j]); 세모(A[i], B[j], B[i])
          if (꺾[i]) 선.push(...A[i], ...B[i])
        }
        for (const E of [k === 0 ? A : null, k === K - 2 ? B : null]) {
          if (!E) continue
          for (let i = 0; i < n; i++) { const j = (i + 1) % n; 선.push(...E[i], ...E[j]) }
        }
      }
    }
    // 뚜껑 — 귀 자르기(구멍은 다리로 이어)가 맞으면 그대로, 꼬이면(뒤집힌 세모 · 넓이가 안 맞음) 띠 나누기
    const P = m.구멍.length ? 다리잇기(m.바깥, m.구멍) : m.바깥
    const T = 귀자르기(P)
    let 세들 = []
    {
      let 합 = 0, 뒤 = false
      for (let i = 0; i < T.length; i += 3) {
        const a = P[T[i]], b = P[T[i + 1]], c = P[T[i + 2]]
        const A = ((b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1])) / 2
        if (A < -1e-6) 뒤 = true
        합 += Math.abs(A)
        세들.push([a, b, c])
      }
      const 참 = Math.abs(넓(m.바깥)) - m.구멍.reduce((s0, h) => s0 + Math.abs(넓(h)), 0)
      if (뒤 || Math.abs(합 - 참) > Math.max(1e-6, 참 * 1e-6)) 세들 = 띠나누기([m.바깥, ...m.구멍])
    }
    for (const [F, 뒤집] of [[틀들[0], true], [틀들[K - 1], false]]) {
      for (const [a, b, c] of 세들) {
        const A = F(a[0], a[1]), B = F(b[0], b[1]), C = F(c[0], c[1])
        if (뒤집) 세모(A, C, B)
        else 세모(A, B, C)
      }
    }
  }
  return { 면, 선 }
}

/* ── 🧊 G234 이웃 단면의 같은 덩어리를 이어 붙이기(로프트) ──────────────────────
 * 소장님 현장 E: 비탈 블록(옹벽블록)이 측점마다 옆으로 조금씩 옮겨 가는데, 단면 모양을 앞뒤 반 칸씩 «그대로» 세워
 * 계단처럼 끊긴 판 여러 장으로 보였음 → 앞 · 뒤 단면에 같은 덩어리(구멍 없는 바깥 줄 · 자리 · 크기가 비슷)가 있으면
 * 이 단면 모양 → 두 단면 가운데 모양(반반 섞음)으로 이어 세움. 물량(몫)은 그대로 평균단면 — 모양만 매끈하게 */
const 이음점수 = 64
function 고리정보(r) {
  let A = 0, cx = 0, cz = 0, o0 = Infinity, o1 = -Infinity, z0 = Infinity, z1 = -Infinity
  for (let i = 0; i < r.length; i++) {
    const a = r[i], b = r[(i + 1) % r.length], w = a[0] * b[1] - b[0] * a[1]
    A += w; cx += (a[0] + b[0]) * w; cz += (a[1] + b[1]) * w
    o0 = Math.min(o0, a[0]); o1 = Math.max(o1, a[0]); z0 = Math.min(z0, a[1]); z1 = Math.max(z1, a[1])
  }
  return { A: Math.abs(A / 2), o: A ? cx / (3 * A) : r[0][0], z: A ? cz / (3 * A) : r[0][1], w: o1 - o0, h: z1 - z0, o0, z0 }
}
/** 두 단면의 묶(바깥 + 구멍) 짝 — 구멍 없고 · 가운데가 가깝고(옆 3 m · 위아래 2.5 m 안) · 넓이 · 폭 · 높이가 0.4 ~ 2.5 배 */
function 고리짝(묶A, 묶B) {
  const 후보 = []
  묶A.forEach((m, i) => {
    if (m.구멍.length || m.바깥.length > 이음점수 / 2) return
    const a = 고리정보(m.바깥)
    묶B.forEach((n, j) => {
      if (n.구멍.length || n.바깥.length > 이음점수 / 2) return
      const b = 고리정보(n.바깥)
      const 배 = (x, y) => (x > 0 && y > 0 ? Math.max(x / y, y / x) : Infinity)
      const dO = Math.abs(a.o - b.o), dZ = Math.abs(a.z - b.z)
      if (dO > Math.max(3, 0.5 * Math.max(a.w, b.w)) || dZ > 2.5) return
      if (배(a.A, b.A) > 2.5 || 배(a.w, b.w) > 2.5 || 배(a.h, b.h) > 2.5) return
      후보.push([dO + dZ, i, j])
    })
  })
  후보.sort((p, q) => p[0] - q[0])
  const 짝 = new Map(), 쓴 = new Set()
  for (const [, i, j] of 후보) if (!짝.has(i) && !쓴.has(j)) { 짝.set(i, j); 쓴.add(j) }
  return 짝
}
/** 바깥 줄(반시계) → 같은 수(이음점수)의 점 — 둘레를 고르게 나누고 원래 꼭짓점은 가장 가까운 점에 붙임(모서리 그대로) · 왼쪽 아래 꼭짓점에서 시작 */
function 고르게(r) {
  const n = r.length
  const g = 고리정보(r)
  let s0 = 0, best = Infinity
  for (let i = 0; i < n; i++) { const v = (r[i][0] - g.o0) / Math.max(g.w, 1e-9) + (r[i][1] - g.z0) / Math.max(g.h, 1e-9); if (v < best) { best = v; s0 = i } }
  const R = r.slice(s0).concat(r.slice(0, s0))
  const 누 = [0]
  for (let i = 0; i < n; i++) { const a = R[i], b = R[(i + 1) % n]; 누.push(누[i] + Math.hypot(b[0] - a[0], b[1] - a[1])) }
  const L = 누[n] || 1
  const N = 이음점수, out = []
  let e = 0
  for (let k = 0; k < N; k++) {
    const d = (k / N) * L
    while (e < n - 1 && 누[e + 1] < d) e++
    const a = R[e], b = R[(e + 1) % n], u = (d - 누[e]) / Math.max(누[e + 1] - 누[e], 1e-12)
    out.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u])
  }
  const 붙 = new Map()
  for (let i = 0; i < n; i++) {
    const k = Math.round((누[i] / L) * N) % N
    const 거 = Math.abs(누[i] / L * N - Math.round(누[i] / L * N))
    if (!붙.has(k) || 붙.get(k)[0] > 거) 붙.set(k, [거, R[i]])
  }
  for (const [k, [, v]] of 붙) out[k] = [v[0], v[1]]
  return out
}
/** B 를 A 에 맞게 돌려 놓음(가운데를 맞춘 뒤 점 사이 거리 제곱 합이 가장 작은 시작점) */
function 맞돌림(A, B) {
  const N = A.length
  const ga = A.reduce((s, p) => [s[0] + p[0] / N, s[1] + p[1] / N], [0, 0]), gb = B.reduce((s, p) => [s[0] + p[0] / N, s[1] + p[1] / N], [0, 0])
  let bs = 0, bd = Infinity
  for (let s = 0; s < N; s++) {
    let d = 0
    for (let k = 0; k < N && d < bd; k++) { const a = A[k], b = B[(k + s) % N]; d += (a[0] - ga[0] - b[0] + gb[0]) ** 2 + (a[1] - ga[1] - b[1] + gb[1]) ** 2 }
    if (d < bd) { bd = d; bs = s }
  }
  return B.slice(bs).concat(B.slice(0, bs))
}
const 섞기 = (A, B, t) => A.map((p, k) => [p[0] + (B[k][0] - p[0]) * t, p[1] + (B[k][1] - p[1]) * t])
/**
 * 틀마다 다른 2D 줄(점 수 같음)을 이어 세운 덩어리 — 첫 · 끝 틀에 뚜껑
 * @param 줄들 [[[o, z]…]] (틀마다 · 반시계) · @param 틀들 [(o, z) => [x, y, z]] · @param 가운데 모서리 선을 뽑을 줄 번호
 */
function 이어세우기(줄들, 틀들, 가운데, { 모서리각 = 35 } = {}) {
  const 면 = [], 선 = []
  const K = 틀들.length
  if (K < 2) return { 면, 선 }
  const N = 줄들[0].length
  const 세모 = (a, b, c) => { 면.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]) }
  const P = 줄들.map((r, k) => r.map((p) => 틀들[k](p[0], p[1])))
  const 기 = 줄들[가운데]
  const 껍 = 볼록점(기)
  const 꺾 = 기.map((p, i) => {
    if (!껍.has(i)) return false
    const a = 기[(i + N - 1) % N], c = 기[(i + 1) % N]
    const v1 = [p[0] - a[0], p[1] - a[1]], v2 = [c[0] - p[0], c[1] - p[1]]
    const l1 = Math.hypot(...v1) || 1, l2 = Math.hypot(...v2) || 1
    return Math.acos(Math.max(-1, Math.min(1, (v1[0] * v2[0] + v1[1] * v2[1]) / (l1 * l2)))) * 180 / Math.PI > 모서리각
  })
  for (let k = 0; k + 1 < K; k++) {
    const A = P[k], B = P[k + 1]
    for (let i = 0; i < N; i++) {
      const j = (i + 1) % N
      세모(A[i], A[j], B[j]); 세모(A[i], B[j], B[i])
      if (꺾[i]) 선.push(...A[i], ...B[i])
    }
  }
  for (const [k, 뒤집] of [[0, true], [K - 1, false]]) {
    const r = 줄들[k]
    let T = 귀자르기(r), 세들 = []
    let 합 = 0, 뒤 = false
    for (let i = 0; i < T.length; i += 3) {
      const a = r[T[i]], b = r[T[i + 1]], c = r[T[i + 2]]
      const A2 = ((b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1])) / 2
      if (A2 < -1e-6) 뒤 = true
      합 += Math.abs(A2); 세들.push([a, b, c])
    }
    const 참 = Math.abs(넓(r))
    if (뒤 || Math.abs(합 - 참) > Math.max(1e-6, 참 * 1e-6)) 세들 = 띠나누기([r])
    for (const [a, b, c] of 세들) {
      const A3 = 틀들[k](a[0], a[1]), B3 = 틀들[k](b[0], b[1]), C3 = 틀들[k](c[0], c[1])
      if (뒤집) 세모(A3, C3, B3); else 세모(A3, B3, C3)
    }
    for (let i = 0; i < N; i++) 선.push(...P[k][i], ...P[k][(i + 1) % N])
  }
  return { 면, 선 }
}

/** 노선 위 [a, b](m) 사이를 굽은 정도에 맞춰 나눈 측점들 */
function 나눔점(L, a, b) {
  const out = [a]
  const z = L.줄
  let 앞 = 노선자리(L, a)
  for (let i = 0; i < z.length; i += 5) {
    const s = z[i]
    if (s <= a + 0.05 || s >= b - 0.05) continue
    const p = 노선자리(L, s)
    const 각 = Math.abs(Math.atan2(p.tx * 앞.ty - p.ty * 앞.tx, p.tx * 앞.tx + p.ty * 앞.ty)) * 180 / Math.PI
    if (각 > 0.6 || s - out[out.length - 1] > 25) { out.push(s); 앞 = p }
  }
  out.push(b)
  return out
}

const 길이된 = (Q) => Q.map((x) => (Number.isFinite(x) ? x : 0))
/** 파일 이름 줄기(확장자 · 「 (2)」 뺌) — 골조로 세운 도면과 같은지 볼 때 */
export const 줄기 = (f) => String(f || '').replace(/\.(dxf|dwg)$/i, '').replace(/ \(\d+\)$/, '').trim().toLowerCase()
/** 땅(측량점 삼각망) 위 (x, y) 의 높이(mm) — 삼각형 안이면 그 면 · 밖이면 가까운 점 셋 평균(1 km 안) */
function 땅높이찾기(땅) {
  if (!땅 || !땅.점 || !땅.삼 || 땅.삼.length < 3) return null
  const P = 땅.점, T = 땅.삼
  return (x, y) => {
    for (let i = 0; i + 2 < T.length; i += 3) {
      const a = T[i] * 3, b = T[i + 1] * 3, c = T[i + 2] * 3
      const d = (P[b + 1] - P[c + 1]) * (P[a] - P[c]) + (P[c] - P[b]) * (P[a + 1] - P[c + 1])
      if (!d) continue
      const l1 = ((P[b + 1] - P[c + 1]) * (x - P[c]) + (P[c] - P[b]) * (y - P[c + 1])) / d
      const l2 = ((P[c + 1] - P[a + 1]) * (x - P[c]) + (P[a] - P[c]) * (y - P[c + 1])) / d
      const l3 = 1 - l1 - l2
      if (l1 >= -1e-9 && l2 >= -1e-9 && l3 >= -1e-9) return l1 * P[a + 2] + l2 * P[b + 2] + l3 * P[c + 2]
    }
    const 가 = []
    for (let k = 0; k < P.length; k += 3) { const dd = Math.hypot(P[k] - x, P[k + 1] - y); if (dd < 1e6) 가.push([dd, P[k + 2]]) }
    if (!가.length) return NaN
    가.sort((p, q) => p[0] - q[0])
    const q = 가.slice(0, 3)
    return q.reduce((s, v) => s + v[1], 0) / q.length
  }
}

/** 🔰 G441 구조물 이름 — 일꾼이 붙인 «박스 4장»(합친 판 수)은 처음 쓰는 분께 뜻이 없어 도면 이름(«1.배수펌프장 일반도(변경)»)으로 */
export const 구조이름 = (q) => {
  const n = String((q && q.이름) || '').replace(/\.(dxf|dwg)$/i, '').trim()
  const f = String((q && (Array.isArray(q.파일) ? q.파일[0] : q.파일)) || '').replace(/\.(dxf|dwg)$/i, '').trim()
  return (!n || /^박스 \d+장$/.test(n)) && f ? f : n || '구조물'
}
/**
 * @param 활 r.활용
 * @param 가운데 r.center ([x, y, z] mm)
 * @param 옵 { 바닥두께: {구조물 이름: mm}, 기본바닥: 600, 건물바닥: {건물 이름: mm}, 기본건물바닥: 200, 뺄건물: [파일 이름 — 골조로 이미 세운 도면] }
 * @returns {{부재: Array, 노선들: Array, 구조물들: Array, 건물들: Array, 합: Object, 경고: string[], 짐작: string[], 틀: number[]|null, 땅높이: number}}
 */
/**
 * 🛣 G397 같은 횡단면도 두 벌 — 같은 노선 · 같은 측점 · 같은 단면 넓이(도면 표 값 · 선으로 잰 값)가 모두 같으면 한 벌만
 *   현장 S: 배수로 횡단면도가 «종평 · 횡단면도» 도면과 GPS 도면(모든 도면을 모은 것) 두 곳에 똑같이 있어 1 ~ 5호 토공 · 콘크리트가 두 번 셈해졌음(터파기 · 콘크리트 합이 두 배 가까이)
 * @returns { 횡단: 한 벌씩, 뺀: [{노선, 파일, 단면}] }
 */
export function 횡단두벌빼기(횡단) {
  /* 같은 단면 — 측점 같음 · 도면 표 값 같음(±0.005) · 선으로 잰 넓이는 그린 선이 조금 달라도(사본 · 다시 그림) ±max(0.05 ㎡, 2 %) */
  const 가깝 = (p, q, 절, 비) => { const x = Number.isFinite(p) ? p : 0, y = Number.isFinite(q) ? q : 0; return Math.abs(x - y) <= Math.max(절, 비 * Math.max(Math.abs(x), Math.abs(y))) }
  const 같은단면 = (s, u) => Math.abs((s.측 ?? NaN) - (u.측 ?? NaN)) <= 0.005 &&
    ['터파기', '되메우기', '성토', '절토'].every((k) => 가깝(s.표면적 && s.표면적[k], u.표면적 && u.표면적[k], 0.005, 0)) &&
    ['터파기', '되메우기', '콘크리트', '성토', '거푸집'].every((k) => 가깝(s.면적 && s.면적[k], u.면적 && u.면적[k], 0.05, 0.02))
  const 같은벌 = (a, b) => (a.노선 || '') === (b.노선 || '') && a.단면.length === b.단면.length && a.단면.every((s, i) => 같은단면(s, b.단면[i]))
  const 남 = [], 뺀 = []
  const 사본파일 = new Set()            // 다른 도면의 횡단을 똑같이 품은 파일(모음 도면 — 현장 S GPS 도면)
  for (const t of 횡단 || []) {
    if (!(t.단면 || []).length) { 남.push(t); continue }
    const 원 = 남.find((k) => (k.단면 || []).length && 같은벌(k, t))
    if (원) { 뺀.push({ 노선: t.노선 || '', 파일: t.파일 || '', 단면: t.단면.length }); if (t.원파일 && 원.원파일 && t.원파일 !== 원.원파일) 사본파일.add(t.원파일); continue }
    남.push(t)
  }
  /* 🛣 G398 모음 도면의 «다른 판» — 사본을 품은 파일(위)에서 온 횡단이, 같은 노선을 다른 파일이 따로 가졌는데 값이 다르면 옛 사본으로 보고 뺌
       현장 S: GPS 도면 안 «배수장 횡단면도» 16 단면(옛 판)이 06 도면 18 단면과 함께 세어져 배수장 성토 · 절토가 두 배 가까이 됐음 */
  const 다른판 = []
  const 끝 = 남.filter((t) => {
    if (!t.원파일 || !사본파일.has(t.원파일) || !t.노선 || !(t.단면 || []).length) return true
    const 짝 = 남.find((k) => k !== t && k.노선 === t.노선 && k.원파일 && k.원파일 !== t.원파일 && (k.단면 || []).length)
    if (!짝) return true
    다른판.push({ 노선: t.노선, 파일: t.원파일, 단면: t.단면.length, 남김: 짝.원파일 })
    return false
  })
  return { 횡단: 끝, 뺀, 다른판 }
}

export function 토목모델(활, 가운데 = [0, 0, 0], 옵 = {}) {
  const 부재 = [], 경고 = [], 짐작 = []
  if (!활) return { 부재, 노선들: [], 구조물들: [], 건물들: [], 흙막이: [], 합: { 콘크리트: 0, 거푸집: 0, 터파기: 0, 되메우기: 0, 성토: 0, 절토: 0 }, 경고, 짐작, 틀: null, 땅높이: NaN }
  const cx = 0, cy = 0          // 좌표는 일꾼 값 그대로(가운데 빼기 전 mm) — 끝에 원점으로 옮김
  void 가운데
  let id = 0
  const 넣 = (o) => { o.id = id++; 부재.push(o); return o }
  const 노선표 = new Map((활.노선 || []).map((L) => [L.이름, L]))
  const 노선들 = []
  /* 🏭 G234 홀로 선 구조물(평면으로 세우는 배수장 · 박스)의 발자국 — 그 자리에 놓인 횡단 콘크리트는 구조물 쪽에서 셈(두 번 세우지 않음)
       소장님 현장 E: 동쪽배수장 횡단면도 NO.0 ~ NO.2+6.98 의 펌프장 단면이 평면으로 세운 배수장 «박스 4장» 위에 한 번 더 섰음 */
  const 발자국 = []
  for (const q of 활.구조 || []) {
    if (!q.바닥판 || !q.바닥판.length || !((q.위 - q.아래) * 1000 > 200)) continue
    for (const r of q.바닥판) if (r && r.length >= 3 && 넓(r) > 0) 발자국.push({ 이름: 구조이름(q), r })
  }
  const 겹뺀 = []
  const 표종 = ['터파기', '되메우기', '성토', '절토']
  const 두벌 = 횡단두벌빼기(활.횡단)
  for (const x of 두벌.뺀) 경고.push(`같은 횡단면도 두 벌 — «${x.노선 || x.파일}» 단면 ${x.단면}개가 다른 도면에도 똑같이 있어 한 번만 셈`)
  for (const x of 두벌.다른판) 경고.push(`«${x.노선}» 횡단이 두 판 — 모음 도면(${x.파일})의 옛 사본 단면 ${x.단면}개는 빼고 «${x.남김}» 것으로 셈`)
  /* ① 노선 따라 — 배수로 · 수로 · 터파기 · 성토 */
  for (const t of 두벌.횡단) {
    const L = t.노선 ? 노선표.get(t.노선) : null
    let 단 = (t.단면 || []).filter((s) => s.면적 && Number.isFinite(s.측)).slice().sort((p, q) => p.측 - q.측)
    /* 📋 G234 도면 표 값이 모든 단면에 있으면 — 선으로 면적을 못 읽은 단면(지반선이 접힘 등)도 넣음(토공 = 표 값 · 콘크리트 = 앞뒤 단면으로 메움 · 3D 덩어리는 없음)
         메움 = 직선으로 이음(평균단면법에서 그 단면을 건너뛴 것과 같은 값) · 끝 단면은 0 */
    const 원 = (t.단면 || []).filter((s) => Number.isFinite(s.측) && (s.면적 || s.표면적)).slice().sort((p, q) => p.측 - q.측)
    const 표모두 = 원.length >= 2 && 표종.some((k) => 원.every((s) => s.표면적 && Number.isFinite(s.표면적[k])))
    const 메운 = []
    if (표모두 && 원.length > 단.length) {
      const 끼움 = (x) => {
        let a = null, b = null
        for (const s of 단) { if (s.측 <= x) a = s; if (s.측 >= x && !b) b = s }
        const o = {}
        for (const k of ['터파기', '되메우기', '구조물', '성토', '콘크리트', '거푸집']) {
          const va = a ? a.면적[k] || 0 : NaN, vb = b ? b.면적[k] || 0 : NaN
          o[k] = a && b ? (b.측 - a.측 > 1e-9 ? va + (vb - va) * (x - a.측) / (b.측 - a.측) : va) : 0
        }
        return o
      }
      단 = 원.map((s) => { if (s.면적) return s; 메운.push(s.이름 || 측점글(s.측)); return { ...s, 면적: 끼움(s.측), 모양: null } })
    }
    if (!단.length) continue
    if (L && 발자국.length) {
      const 단0 = 단
      let 뺀수 = 0, 뺀면 = 0
      const 이름들 = new Set()
      단 = 단.map((s) => {
        const 모 = s.모양
        if (!모 || !모.콘 || !모.콘.length || !((s.면적.콘크리트 || 0) > 0)) return s
        const q = 노선자리(L, s.측)
        const rx = q.ty, ry = -q.tx
        const 묶 = 맞물(모.콘)
        const 순 = (m) => Math.abs(넓(m.바깥)) - m.구멍.reduce((a, h) => a + Math.abs(넓(h)), 0)
        let 모두 = 0, 남김 = 0
        const 남 = []
        for (const m of 묶) {
          let A = 0, ox = 0
          const r = m.바깥
          for (let i = 0; i < r.length; i++) { const a = r[i], b = r[(i + 1) % r.length], w = a[0] * b[1] - b[0] * a[1]; A += w; ox += (a[0] + b[0]) * w }
          const o = A ? ox / (3 * A) : r[0][0]
          const P = [q.x + o * 1000 * rx, q.y + o * 1000 * ry]
          const 집 = 발자국.find((f) => 안에(P, f.r))
          const a = 순(m)
          모두 += a
          if (집) { 이름들.add(집.이름); continue }
          남김 += a; 남.push(m)
        }
        if (남.length === 묶.length || !(모두 > 0)) return s
        const 몫 = 남김 / 모두
        뺀수++; 뺀면 += (s.면적.콘크리트 || 0) * (1 - 몫)
        const 줄들 = 남.flatMap((m) => [m.바깥, ...m.구멍])
        return { ...s, 면적: { ...s.면적, 콘크리트: (s.면적.콘크리트 || 0) * 몫, 거푸집: (s.면적.거푸집 || 0) * 몫 }, 모양: { ...모, 콘: 줄들 }, 구조겹: [...이름들] }
      })
      if (뺀수) {
        const 셈 = (a) => 평균단면(a.map((s) => ({ 측: s.측, 이름: s.이름 || 측점글(s.측), 면적: { ...s.면적 } }))).합.콘크리트 || 0
        겹뺀.push({ 노선: t.노선 || String(t.파일 || ''), 단면: 뺀수, 면: 뺀면, 부피: 셈(단0) - 셈(단), 구조물: [...이름들] })
      }
    }
    /* 📋 G234 도면 표(측점 표의 터파기 · 되메우기 · 흙쌓기 · 흙깎기 ㎡)가 모든 단면에 있으면 그 값으로 셈(설계자 값) — 선으로 잰 값은 맞춰 보기용(선합)
         소장님 현장 E 06: 선으로 잰 터파기가 표의 반도 안 됨(지반선과 안 붙은 터파기선 · 성토 둑) → 표가 있으면 표를 따름 */
    const 표씀 = {}
    for (const k of 표종) 표씀[k] = 단.length >= 2 && 단.every((s) => s.표면적 && Number.isFinite(s.표면적[k]))
    if (메운.length) 짐작.push(`«${t.노선 || t.파일}» 단면 ${메운.length}개(${메운.slice(0, 3).join(' · ')}${메운.length > 3 ? ' …' : ''})는 선으로 면적을 못 읽어 토공은 도면 표 값 · 콘크리트는 앞뒤 단면으로 이어 셈(3D 덩어리 없음)`)
    const 표있음 = 표종.some((k) => 표씀[k])
    const 줄로 = (a) => a.map((s) => ({ 측: s.측, 이름: s.이름 || 측점글(s.측), 면적: { ...s.면적 } }))
    const 선p = 표있음 ? 평균단면(줄로(단)) : null
    if (표있음) 단 = 단.map((s) => ({ ...s, 선면적: s.면적, 면적: { ...s.면적, ...Object.fromEntries(표종.filter((k) => 표씀[k]).map((k) => [k, s.표면적[k]])) } }))
    const p = 평균단면(줄로(단))
    const 이름 = t.노선 || String(t.파일 || '').replace(/\.dxf$/i, '')
    const 노 = { 번: 노선들.length, 이름, 파일: t.파일, 간격: L ? L.간격 : null, 단면수: 단.length, 길이: p.길이, 시작: 단[0].측, 끝: 단[단.length - 1].측, 합: { 콘크리트: p.합.콘크리트 || 0, 거푸집: p.합.거푸집 || 0, 터파기: p.합.터파기 || 0, 되메우기: p.합.되메우기 || 0, 성토: p.합.성토 || 0, 절토: p.합.절토 || 0 }, 줄: p.줄, 빠진: p.빠진, 세움: !!L, ids: [], 남: { 콘크리트: 0, 거푸집: 0, 터파기: 0, 되메우기: 0, 성토: 0, 절토: 0 },
      표씀, 선합: 선p ? { 터파기: 선p.합.터파기 || 0, 되메우기: 선p.합.되메우기 || 0, 성토: 선p.합.성토 || 0 } : null, 선줄: 선p ? 선p.줄 : null }
    노선들.push(노)
    const 만든 = []            // { i, 종류, 이름, g, 공통 } — 몫은 다 만든 뒤 나눔
    if (!L) {
      경고.push(`«${이름}» 횡단은 평면 노선을 못 찾아 3D 로는 못 세웠습니다(물량은 셈)${t.까닭 ? ' — ' + t.까닭 : ''} — 같은 이름의 노선이 그려진 평면도(종평면도 · 계획평면도)를 같이 넣어 주십시오.`)
      for (const k of Object.keys(노.남)) 노.남[k] = 노.합[k]
      continue
    }
    // 단면마다 앞뒤 경계(반 칸씩)
    const 경 = 단.map((s, i) => [i ? (단[i - 1].측 + s.측) / 2 : s.측, i + 1 < 단.length ? (s.측 + 단[i + 1].측) / 2 : s.측])
    if (단.length === 1) 경[0] = [단[0].측 - 2.5, 단[0].측 + 2.5]
    // 높이 이음 — 단면 바닥(구조물 아래) 또는 계획고
    const 기준 = 단.map((s) => (s.구조높 && Number.isFinite(s.구조높[0]) ? s.구조높[0] : Number.isFinite(s.계획고) ? s.계획고 : NaN))
    const 높이에 = (s) => {
      let i = 0; while (i + 1 < 단.length && 단[i + 1].측 < s) i++
      const j = Math.min(단.length - 1, i + 1)
      const a = 기준[i], b = 기준[j]
      if (!Number.isFinite(a) || !Number.isFinite(b) || j === i) return Number.isFinite(a) ? a : NaN
      const u = Math.max(0, Math.min(1, (s - 단[i].측) / Math.max(1e-9, 단[j].측 - 단[i].측)))
      return a + (b - a) * u
    }
    /* 🧊 G234 이웃 단면끼리 같은 덩어리 짝(콘 · 터 · 성) — 80 m 넘게 떨어진 단면끼리는 안 이음 */
    const 갈 = ['콘', '터', '성']
    const 묶들 = 단.map((s) => (s.모양 ? Object.fromEntries(갈.map((k) => [k, 맞물(s.모양[k] || [])])) : null))
    const 짝들 = 단.map((s, i) => (i + 1 < 단.length && 묶들[i] && 묶들[i + 1] && 단[i + 1].측 - s.측 <= 80 ? Object.fromEntries(갈.map((k) => [k, 고리짝(묶들[i][k], 묶들[i + 1][k])])) : null))
    const 틀만들기 = (m, dz) => {
      const q = 노선자리(L, m)
      const rx = q.ty, ry = -q.tx                     // 진행 방향 오른쪽
      return (o, z) => [q.x - cx + o * 1000 * rx, q.y - cy + o * 1000 * ry, (z + dz) * 1000]
    }
    단.forEach((s, i) => {
      const 모 = s.모양
      if (!모) return
      const [a, b] = 경[i]
      if (!(b - a > 0.05)) return
      const 점들 = 나눔점(L, a, b)
      const 이음z = (m) => { const v = 높이에(m) - 기준[i]; return Number.isFinite(v) ? v : 0 }
      const 틀들 = 점들.map((m) => 틀만들기(m, 이음z(m)))
      const 측글 = L.간격 === 1 && s.측 >= -0.005 ? `${Math.floor((s.측 + 1e-6) / 1000)}+${(s.측 - Math.floor((s.측 + 1e-6) / 1000) * 1000).toFixed(2).padStart(6, '0')}` : 측점글(s.측)      /* 🛣 G236 도로(km 꼴)는 «0+020.00» */
      const 공통 = { 노선: 이름, 노선번: 노.번, 측: s.측, 측글, 범위: [a, b], 파일: t.파일, 원파일: t.원파일 || '', 면적: s.면적 }   // 📚 G440 원파일 = 넣은 도면(«그 도면만 보기»)
      /* 덩어리 하나 — 짝이 있는 묶은 이어 세우고(앞 짝 → 이 단면 → 뒤 짝, 가운데까지), 나머지는 그대로 세움 */
      const 세우기 = (k, 선있음) => {
        const 묶 = 묶들[i][k]
        const 앞짝 = i > 0 && 짝들[i - 1] ? new Map([...짝들[i - 1][k]].map(([x, y]) => [y, x])) : new Map()
        const 뒤짝 = 짝들[i] ? 짝들[i][k] : new Map()
        const 그대로 = [], 면 = [], 선 = []
        묶.forEach((m, j) => {
          const pj = 앞짝.get(j), nj = 뒤짝.get(j)
          if (pj === undefined && nj === undefined) { 그대로.push(m); return }
          const R = 고르게(m.바깥)
          const 앞R = pj !== undefined ? 섞기(R, 맞돌림(R, 고르게(묶들[i - 1][k][pj].바깥)), 0.5) : null
          const 뒤R = nj !== undefined ? 섞기(R, 맞돌림(R, 고르게(묶들[i + 1][k][nj].바깥)), 0.5) : null
          const 앞점 = 나눔점(L, a, s.측), 뒤점 = 나눔점(L, s.측, b)
          const 줄들 = [], 틀 = []
          const 넣 = (mm, r, dz) => { 줄들.push(r); 틀.push(틀만들기(mm, dz)) }
          if (s.측 - a > 0.05) for (const mm of 앞점.slice(0, -1)) { const u = (s.측 - mm) / (s.측 - a); 앞R ? 넣(mm, 섞기(R, 앞R, u), 0) : 넣(mm, R, 이음z(mm)) }
          const 가운데 = 줄들.length
          넣(s.측, R, 0)
          if (b - s.측 > 0.05) for (const mm of 뒤점.slice(1)) { const u = (mm - s.측) / (b - s.측); 뒤R ? 넣(mm, 섞기(R, 뒤R, u), 0) : 넣(mm, R, 이음z(mm)) }
          const g = 이어세우기(줄들, 틀, 가운데)
          for (const v of g.면) 면.push(v)
          if (선있음) for (const v of g.선) 선.push(v)
        })
        if (그대로.length) { const g = 끌어세우기(그대로, 틀들); for (const v of g.면) 면.push(v); if (선있음) for (const v of g.선) 선.push(v) }
        return { 면, 선 }
      }
      if (모.콘 && 모.콘.length && (s.면적.콘크리트 || 0) > 0) {
        const g = 세우기('콘', true)
        if (g.면.length) 만든.push({ i, 종류: '수로', 이름: `${이름} ${측글}`, g, 공통 })
      }
      if (모.터 && 모.터.length && (s.면적.터파기 || 0) > 0) {
        const g = 세우기('터', false)
        if (g.면.length) 만든.push({ i, 종류: '터파기', 이름: `${이름} ${측글} 터파기`, g: { 면: g.면, 선: [] }, 공통 })
      }
      if (모.성 && 모.성.length && (s.면적.성토 || 0) > 0.05) {
        const g = 세우기('성', false)
        if (g.면.length) 만든.push({ i, 종류: '성토', 이름: `${이름} ${측글} 성토`, g: { 면: g.면, 선: [] }, 공통 })
      }
    })
    /* 몫 나누기 — 칸(앞 단면 ~ 이 단면) 부피를 양 끝 덩어리에 반씩. 한쪽만 덩어리가 있으면 그쪽에 다(합계와 꼭 같게) */
    const 갈래 = { 수로: ['콘크리트', '거푸집'], 터파기: ['터파기', '되메우기', '절토'], 성토: ['성토'] }
    for (const [종, 항목] of Object.entries(갈래)) {
      const 있 = new Map(만든.filter((x) => x.종류 === 종).map((x) => [x.i, x]))
      for (const x of 있.values()) x.몫 = x.몫 || {}
      for (const k of 항목) {
        for (const x of 있.values()) x.몫[k] = 0
        for (let i = 1; i < p.줄.length; i++) {
          const V = p.줄[i].부피[k] || 0
          if (!V) continue
          const A = 있.get(i - 1), B = 있.get(i)
          if (A && B) { A.몫[k] += V / 2; B.몫[k] += V / 2 } else if (A) A.몫[k] += V; else if (B) B.몫[k] += V; else 노.남[k] += V
        }
      }
    }
    for (const x of 만든) 노.ids.push(넣({ 종류: x.종류, 이름: x.이름, 면: x.g.면, 선: x.g.선, ...x.공통, 몫: x.몫 }).id)
    if (p.빠진.length) 경고.push(`«${이름}» 단면 ${p.빠진.length}개는 면적을 못 읽어 뺐습니다: ${p.빠진.slice(0, 4).join(' · ')}${p.빠진.length > 4 ? ' …' : ''}`)
  }
  for (const g of 겹뺀) 짐작.push(`«${g.노선}» 횡단 ${g.단면}개의 콘크리트 중 구조물 «${g.구조물.join(' · ')}» 자리에 놓인 것(평균단면 ${g.부피.toFixed(1)} ㎥)은 그 구조물(평면으로 세운 벽 · 바닥)에서 셉니다 — 두 번 세우지 않음`)
  /* ② 홀로 선 구조물(배수장 · 집수정 · 박스) — 벽 · 바닥 */
  const 구조물들 = []
  for (const q of 활.구조 || []) {
    const 높이 = (q.위 - q.아래) * 1000
    const 이름 = 구조이름(q)
    if (!q.바닥판 || !q.바닥판.length || !(높이 > 200)) {
      if (q.넓이) 경고.push(`«${이름}» 은 평면 바깥 모양만 읽어(벽 겹선 없음) 3D 로 세우지 않았습니다 — 바닥 ${Math.round(q.넓이)} ㎡`)
      continue
    }
    /* 🧾 G400 바닥판 두께 짐작 — 단면에서 읽은 값(같은 벽 두 면의 아래 차이)이 있으면 그것 · 없으면 600 mm */
    const 단면두께 = Number.isFinite(q.바닥판두께) && q.바닥판두께 >= 0.25 && q.바닥판두께 <= 1.5 ? Math.round(q.바닥판두께 * 1000) : 0
    const 기본 = 옵.기본바닥 || 단면두께 || 600
    const t = Math.max(100, Math.min(Math.max(200, 높이 - 200), (옵.바닥두께 && 옵.바닥두께[이름]) || 기본))
    const z0 = q.아래 * 1000, z1 = z0 + t, z2 = q.위 * 1000
    const 판틀 = (z) => (u, v) => [u - cx, v - cy, z]
    const A바 = (q.면넓이 && q.면넓이.바닥) || q.넓이 || 0, A벽 = (q.면넓이 && q.면넓이.벽) || 0
    const P바 = (q.면둘레 && q.면둘레.바닥) || q.둘레 || 0, P벽 = (q.면둘레 && q.면둘레.벽) || 0
    const 공 = { 구조물: 이름, 파일: (q.파일 || [])[0] || '' }
    /* 🔰 G441 단면도에서 잰 두께(단면두께)는 «짐작» 이 아니라 «도면에서 잼» — 전엔 사람이 안 넣었으면 모두 «(짐작)» 이라 적었음(현장 S 배수펌프장 700 mm = 단면에서 잼) */
    const 사람두께 = !!(옵.바닥두께 && 옵.바닥두께[이름])
    const 기본두께 = !사람두께 && !(단면두께 && !옵.기본바닥)
    const 두께근거 = 사람두께 ? '사람이 넣음' : 기본두께 ? '짐작' : '단면도에서 잼(같은 벽 두 면의 아래 차이)'
    /* 📐 G234 높이별 — 평면 자르는 선(A ─ A …)에 세운 단면의 벽 면 높이로 무리마다 벽 위 · 바닥 아래(일꾼 구조물면 벽들 · 바닥들)
         소장님 「평면 절단선(A-A)과 단면도를 이어 높이를 그 자리에 붙이는 방법 … 지금 해결해줘」 — 전에는 모든 벽을 «단면 가운데 아래 ~ G.L» 한 높이로 */
    const 높이별 = q.벽들 && q.벽들.length && q.바닥들 && q.바닥들.length
    const 무리들 = []
    if (높이별) {
      const 무아 = (w) => (w.아래 != null && Number.isFinite(w.아래) && w.아래 < q.위 ? w.아래 : q.아래)
      for (const f of q.바닥들) {
        const a = 무아(f) * 1000
        무리들.push({ 부분: '바닥', 무리: f.무리, 맞닿음: f.맞닿음, 판: f.판, z0: a, z1: a + t, 넓이: f.넓이, 둘레: f.둘레, 글: f.위 != null ? `EL ${(a / 1000).toFixed(2)} ~ ${((a + t) / 1000).toFixed(2)}` : '기본' })
      }
      for (const w of q.벽들) {
        /* 🧾 G400 벽 아래가 구조물 바닥(단면 가운데 아래)보다 바닥판 두께의 반 넘게 높으면 «바닥판 윗면에 선 벽»(칸막이 · 높은 바닥) — 바닥판 두께를 더하지 않음
             (현장 S 배수장 칸막이: EL −0.51 ~ 3.92 = 산출서 벽 높이 4.43 m) */
        const 아0 = 무아(w)
        const 위 = (w.위 != null && Number.isFinite(w.위) ? w.위 : q.위) * 1000, 아 = 아0 * 1000 + (!w.밑면 && 아0 >= q.아래 + t / 2000 ? 0 : t)   // 🧾 G402 밑면 = 윤곽에서 읽은 바닥판 아랫면 → 두께 더함
        if (!(위 - 아 > 200)) continue
        무리들.push({ 부분: '벽', 무리: w.무리, 맞닿음: w.맞닿음, 판: w.판, z0: 아, z1: 위, 넓이: w.넓이, 둘레: w.둘레, 글: w.위 != null ? `EL ${(아 / 1000).toFixed(2)} ~ ${(위 / 1000).toFixed(2)}` : `기본 EL ${(아 / 1000).toFixed(2)} ~ ${(위 / 1000).toFixed(2)}` })
      }
    } else {
      무리들.push({ 부분: '바닥', 판: q.바닥판, z0: z0, z1: z1, 넓이: A바, 둘레: P바, 글: '' })
      if (q.벽판 && q.벽판.length) 무리들.push({ 부분: '벽', 판: q.벽판, z0: z1, z1: z2, 넓이: A벽, 둘레: P벽, 글: '' })
    }
    const 합 = { 콘크리트: 0, 거푸집: 0 }
    const ids = []
    let 벽부피 = 0, 벽넓 = 0
    /* 🧭 G292 ⑤ 높이가 달라 나눈 무리끼리 맞닿은 자른 면은 거푸집이 아님 — 그 길이만큼 둘레에서 빼고, 이웃보다 높이 솟은 만큼만(겹치지 않는 높이) 더함
         (현장 E 배수장: 벽 무리 10 · 바닥 무리 13 의 자른 면을 다 거푸집으로 세어 둘레가 71 m 더 — 벽 높이 6 m 면 약 400 ㎡) */
    const 짝무리 = new Map(무리들.filter((m) => m.무리 != null).map((m) => [m.부분 + '|' + m.무리, m]))
    let 자른면 = 0
    /* 🧾 G424d 덮개가 닿은 벽 면(구조물면 덮개들.닿음 — 벽 무리마다 길이) — 벽이 덮개 밑 ~ 윗면까지 올라간 만큼(겹친 높이 × 닿은 길이)은 덮개 속이라 벽 거푸집이 아님
         (현장 S 토출수조: 벽 위 2.05 = 덮개 윗면 · 덮개 0.4 · 펌프장 바깥벽 4.2 = 덮개 윗면 · 칸막이 3.9 = 덮개 밑이라 안 겹침 — 전에는 안쪽 면을 벽 위까지 다 세었음) */
    const 덮닿 = new Map()
    for (const d of (높이별 && [...(q.덮개들 || []), ...(q.중간판들 || [])]) || []) for (const n of d.닿음 || []) { const a = 덮닿.get(n.무리) || []; a.push({ 길이: n.길이, z0: d.밑 * 1000, z1: (d.밑 + d.두께) * 1000 }); 덮닿.set(n.무리, a) }   // 중간 슬래브도(벽이 판을 지남)
    let 덮뺀 = 0
    for (const m of 무리들) {
      const h = (m.z1 - m.z0) / 1000
      let 둘레 = m.둘레, 드러남 = 0
      for (const t of m.맞닿음 || []) {
        const n = 짝무리.get(m.부분 + '|' + t.무리)
        if (!n || !(t.길이 > 0)) continue
        const 겹 = Math.max(0, Math.min(m.z1, n.z1) - Math.max(m.z0, n.z0)) / 1000
        /* 🧾 G402 이웃 무리보다 위로 솟은 만큼만 — 아래로 내려간 만큼은 이웃의 바닥판 · 흙에 닿아 거푸집 아님(전엔 위 · 아래 다 세어 바닥판 단을 두 번) */
        const 위만 = Math.max(0, m.z1 - Math.max(n.z1, m.z0)) / 1000
        둘레 -= t.길이; 드러남 += t.길이 * 위만; 자른면 += t.길이 * 겹
      }
      const 몫 = { 콘크리트: m.넓이 * h, 거푸집: Math.max(0, 둘레) * h + 드러남 }
      if (m.부분 === '벽' && 덮닿.has(m.무리)) {
        const 뺌 = Math.min(몫.거푸집, 덮닿.get(m.무리).reduce((t, n) => t + n.길이 * Math.max(0, Math.min(m.z1, n.z1) - Math.max(m.z0, n.z0)) / 1000, 0))
        몫.거푸집 -= 뺌; 덮뺀 += 뺌
      }
      합.콘크리트 += 몫.콘크리트; 합.거푸집 += 몫.거푸집
      if (m.부분 === '벽') { 벽부피 += m.넓이 * h; 벽넓 += m.넓이 }
      const g = 끌어세우기(맞물(m.판), [판틀(m.z0), 판틀(m.z1)])
      if (!g.면.length) continue
      const 이름2 = m.부분 === '바닥' ? `${이름} 바닥판${m.글 ? ' (' + m.글 + ')' : ''}` : `${이름} 벽${m.글 ? ' (' + m.글 + ')' : ''}`
      const 크기 = m.부분 === '바닥' ? `${Math.round(m.넓이)} ㎡ × 두께 ${t} mm` : `벽 넓이 ${m.넓이.toFixed(1)} ㎡ × 높이 ${h.toFixed(2)} m · 평균 두께 약 ${(q.두께 || 0).toFixed(2)} m`
      ids.push(넣({ 종류: '구조물', 부분: m.부분, 이름: 이름2, 면: g.면, 선: g.선, ...(m.부분 === '바닥' ? { 색: 토목색.구조바닥 } : {}), 몫, 크기, ...공 }).id)
    }
    /* 🧾 G402 덮개 슬래브(구조물면 덮개들 — 단면 바깥 · 안쪽 면 위 차이) — 밑면 거푸집 · 두께만큼 콘크리트(열린 곳 · 헌치는 아직 안 뺌 · 안 더함) */
    /* 🧾 G424 열린 곳(단면의 덮개 구멍 짝 ↔ 평면 닫힌 네모 · 원) — 넓이는 이미 뺀 칸 · 구멍 옆 = 둘레 × 두께 거푸집 */
    let 덮넓 = 0, 열린수 = 0, 열린넓 = 0, 종덮넓 = 0
    const 열린단면 = new Set()
    for (const d of (높이별 && q.덮개들) || []) {
      const z0d = d.밑 * 1000, z1d = z0d + d.두께 * 1000
      const 열 = d.열린 || [], 옆 = 열.reduce((t, h) => t + h.둘레, 0) * d.두께
      const 몫 = { 콘크리트: d.넓이 * d.두께, 거푸집: d.넓이 + 옆 }
      합.콘크리트 += 몫.콘크리트; 합.거푸집 += 몫.거푸집; 덮넓 += d.넓이; if (d.종단) 종덮넓 += d.넓이
      열린수 += 열.length; 열린넓 += 열.reduce((t, h) => t + h.뺀칸, 0); for (const h of 열) 열린단면.add(h.단면)
      const g = 끌어세우기(맞물(d.판), [판틀(z0d), 판틀(z1d)])
      if (!g.면.length) continue
      const 열글 = 열.length ? ` · 열린 곳 ${열.length}곳(${열.map((h) => h.크기).join(' · ')}) ${열.reduce((t, h) => t + h.뺀칸, 0).toFixed(1)} ㎡ 뺌 · 옆 ${옆.toFixed(1)} ㎡ 더함` : ''
      ids.push(넣({ 종류: '구조물', 부분: '덮개', 이름: `${이름} 덮개 슬래브 (EL ${d.밑.toFixed(2)} ~ ${(d.밑 + d.두께).toFixed(2)})`, 면: g.면, 선: g.선, 색: 토목색.구조바닥, 몫, 크기: `${d.넓이.toFixed(1)} ㎡ × 두께 ${Math.round(d.두께 * 1000)} mm${열글}${d.종단 ? ' — 종단 맨 위 두 선(가로 단면이 안 지남)' : ''}`, ...공 }).id)
    }
    /* 🧾 G424 중간 슬래브(구조물면 중간판들 — 단면 둘레 벽 면 사이 가로선 둘) — 콘크리트 = 넓이 × 두께 + 헌치 ½ × 다리² × 길이 · 거푸집 = 밑면(밑 헌치 자리 뺌) + 헌치 빗면 √2 × 다리 × 길이 */
    let 중넓 = 0
    const 중글 = []
    for (const d of (높이별 && q.중간판들) || []) {
      const z0d = d.밑 * 1000, z1d = z0d + d.두께 * 1000
      const 헌 = d.헌치 || []
      const 헌콘 = 헌.reduce((t, h) => t + 0.5 * h.다리 * h.다리 * h.길이, 0), 밑헌 = 헌.filter((h) => h.쪽 === '아래').reduce((t, h) => t + h.다리 * h.길이, 0), 빗 = 헌.reduce((t, h) => t + Math.SQRT2 * h.다리 * h.길이, 0)
      const 몫 = { 콘크리트: d.넓이 * d.두께 + 헌콘, 거푸집: Math.max(0, d.넓이 - 밑헌) + 빗 }
      합.콘크리트 += 몫.콘크리트; 합.거푸집 += 몫.거푸집; 중넓 += d.넓이
      const g = 끌어세우기(맞물(d.판), [판틀(z0d), 판틀(z1d)])
      if (!g.면.length) continue
      const 헌글 = 헌.length ? ` · 헌치 ${헌.length}줄(${헌.map((h) => `${h.다리} × ${h.길이.toFixed(1)} m`).join(' · ')})` : ''
      ids.push(넣({ 종류: '구조물', 부분: '중간 슬래브', 이름: `${이름} 중간 슬래브 (EL ${d.밑.toFixed(2)} ~ ${(d.밑 + d.두께).toFixed(2)})`, 면: g.면, 선: g.선, 색: 토목색.구조바닥, 몫, 크기: `${d.넓이.toFixed(1)} ㎡ × 두께 ${Math.round(d.두께 * 1000)} mm${헌글} — 단면 ${d.단면.join(' · ')}`, ...공 }).id)
      중글.push(`중간 슬래브 ${d.넓이.toFixed(1)} ㎡ × ${Math.round(d.두께 * 1000)} mm(단면 ${d.단면.join(' · ')} 의 벽 면 사이 가로선 둘${d.한방향 ? ' — ❓ 한 방향 단면뿐이라 다른 방향은 방 끝까지로 봄' : ''})`)
    }
    /* 🧾 G424 계단(구조물면 계단들 — 평면 디딤 무리 · «계단» 글자 · 계단상세도 단 높이) — 콘크리트 = 단 × ½ × 디딤 × 높이 × 너비 · 거푸집 = 단 × (챌판 높이 × 너비 + 옆 세모 둘) — 3D 는 바닥판 위 자리만(높이 한 단) */
    const 계글 = []
    for (const z of q.계단들 || []) {
      if (!z.높이) { 짐작.push(`❓ «${이름}» ${z.이름} 디딤 ${z.단}단(간격 ${z.간격} mm) — 단 높이가 도면 글에 없어 안 셈`); continue }
      const 몫 = { 콘크리트: z.부피, 거푸집: z.거푸집 }
      합.콘크리트 += 몫.콘크리트; 합.거푸집 += 몫.거푸집
      const zz0 = z1, zz1 = z1 + z.높이 * 1000
      const 판 = z.판 || (z.r ? [[[z.r[0], z.r[1]], [z.r[2], z.r[1]], [z.r[2], z.r[3]], [z.r[0], z.r[3]]]] : [])
      const g = 끌어세우기(맞물(판), [판틀(zz0), 판틀(zz1)])
      if (!g.면.length) continue
      ids.push(넣({ 종류: '구조물', 부분: '계단', 이름: `${이름} ${z.이름}`, 면: g.면, 선: g.선, 색: 토목색.구조바닥, 몫, 크기: `${z.단}단 × 디딤 ${z.간격} mm × 높이 ${z.높이} m × 너비 ${z.너비.toFixed(2)} m(평면 디딤 줄 · 계단상세도)`, ...공 }).id)
      계글.push(`${z.이름} ${z.단}단`)
    }
    if (계글.length) 짐작.push(`«${이름}» 계단 ${계글.join(' · ')} — 평면 디딤 줄(옆 선 길이 ÷ 디딤 간격) · 단 높이는 계단상세도 글 · 3D 는 자리만`)
    /* 🧾 G424 헌치(구조물면 헌치들 — 평면 벽 모서리 45° 사선 · 단면 벽 면 위 · 아래 끝 사선) — 콘크리트 ½ × 다리² × 길이 · 거푸집 빗면 √2 × 다리 × 길이(설계 산출서 셈과 같은 꼴) */
    {
      const 헌 = ((높이별 && q.헌치들) || []).filter((h) => h.길이 > 0)
      const 못 = ((높이별 && q.헌치들) || []).filter((h) => !(h.길이 > 0))
      if (헌.length) {
        const 콘 = 헌.reduce((t, h) => t + 0.5 * h.다리 * h.다리 * h.길이, 0), 틀 = 헌.reduce((t, h) => t + Math.SQRT2 * h.다리 * h.길이, 0)
        합.콘크리트 += 콘; 합.거푸집 += 틀
        const 묶 = new Map()
        for (const h of 헌) { const k = `${h.쪽 === '세로' ? '세로' : '가로'} ${h.다리}`; const e = 묶.get(k) || { n: 0, 길: 0 }; e.n++; e.길 += h.길이; 묶.set(k, e) }
        const 글 = [...묶].map(([k, e]) => `${k} m × ${e.n}줄 ${e.길.toFixed(1)} m`).join(' · ')
        const 판 = 헌.map((h) => { const [x, y] = h.자리, r = 150; return [[x - r, y - r], [x + r, y - r], [x + r, y + r], [x - r, y + r]] })
        const g = 끌어세우기(맞물(판), [판틀(z1), 판틀(z1 + 200)])
        ids.push(넣({ 종류: '구조물', 부분: '헌치', 이름: `${이름} 헌치`, 면: g.면, 선: g.선, 색: 토목색.구조바닥, 몫: { 콘크리트: 콘, 거푸집: 틀 }, 크기: `${글}(평면 벽 모서리 사선 · 단면 벽 면 끝 사선) — 3D 는 자리 표시만`, ...공 }).id)
        짐작.push(`«${이름}» 헌치 ${헌.length}줄 — ${글} · 콘크리트 ${콘.toFixed(2)} ㎥ · 빗면 거푸집 ${틀.toFixed(1)} ㎡`)
      }
      const 못세 = 못.filter((h) => h.쪽 === '세로'), 못가 = 못.filter((h) => h.쪽 !== '세로')
      if (못세.length) 짐작.push(`❓ «${이름}» 평면 헌치 사선 ${못세.length}곳 — 가까운 단면에서 벽 높이를 못 읽어 안 셈`)
      if (못가.length) 짐작.push(`❓ «${이름}» 단면 헌치 사선 ${못가.length}곳 — 그 벽 면에 닿은 방 옆면 길이를 못 정해 안 셈(단면 줄이 칸막이 · 벽 끝에 걸침)`)
    }
    const 모름 = (q.덮개모름 && q.덮개모름.꼴) || [], 짝없 = (q.덮개모름 && q.덮개모름.짝없음) || []
    const 벽높 = 벽넓 > 0 ? 벽부피 / 벽넓 : (z2 - z1) / 1000
    const 높이수 = 높이별 ? new Set(q.벽들.filter((w) => w.위 != null).map((w) => w.위)).size : 0
    const 자른 = (q.자름 || []).filter((d) => d.자름 && d.높이점).map((d) => d.이름.replace(/^단면\s*/, ''))
    const 구 = { 이름, 파일: 공.파일, 아래: q.아래, 위: q.위, 바닥두께: t, 기본두께, 두께근거, 두께: q.두께 || 0, 방: q.방 || 0,
      넓이: { 바닥: A바, 벽: A벽 }, 둘레: { 바닥: P바, 벽: P벽 }, 벽높, 높이별: 높이수, 자른,
      합, ids, 자리: q.자리 }
    구조물들.push(구)
    if (높이별) 짐작.push(`«${이름}» 벽 높이 ${높이수}가지 — 평면 자르는 선(${자른.join(' · ') || '종단'})에 세운 단면의 벽 높이를 그 자리 벽에 붙임(가까운 단면 벽 면) · 바닥판 두께 ${t} mm${기본두께 ? (단면두께 && t === 단면두께 ? '(단면의 벽 두 면 아래 차이로 읽음 — 아래 칸에서 바꿀 수 있음)' : '(짐작 — 아래 칸에서 바꿀 수 있음)') : ''} · ${덮넓 > 0 ? `덮개 슬래브 ${덮넓.toFixed(1)} ㎡(단면의 바깥 · 안쪽 면 위 차이로 읽음${종덮넓 > 0 ? ` · 그중 ${종덮넓.toFixed(1)} ㎡ 는 종단 맨 위 두 선(가로 단면이 안 지나는 곳)` : ''}${열린수 ? ` · 열린 곳 ${열린수}곳 ${열린넓.toFixed(1)} ㎡ 뺌 — 단면 ${[...열린단면].join(' · ')} 의 덮개 구멍 짝 = 평면 닫힌 네모 · 원` : ''}${덮뺀 > 0.5 ? ` · 덮개 · 중간 슬래브가 닿은 벽 안쪽 면 ${덮뺀.toFixed(1)} ㎡ 는 벽 거푸집에서 뺌(판 속)` : ''})` : '덮개 슬래브는 단면에서 못 찾음(안 셈)'}${자른면 > 1 ? ` · 높이가 바뀌는 자리의 자른 면 ${Math.round(자른면)} ㎡ 는 거푸집에서 뺌(이웃보다 솟은 만큼만 셈)` : ''}${중글.length ? ' · ' + 중글.join(' · ') : ''}`)
    /* 🧾 G424c «높이별 아님» 글은 if (높이별) 의 else — G424b 에서 ❓ 두 줄을 그 사이에 넣어 else 가 «짝없음» 에 붙었음
         (현장 S 배수장: 높이별로 다 센 구조물에 «바닥판 두께 700 mm(짐작) · 벽은 평면 겹선 … 덮개 슬래브는 아직 안 셈» 이 같이 떴음 — 숫자는 그대로) */
    else 짐작.push(`«${이름}» 바닥판 두께 ${t} mm${기본두께 ? '(짐작 — 아래 칸에서 바꿀 수 있음)' : 사람두께 ? '' : '(' + 두께근거 + ')'} · 벽은 평면 겹선 사이를 벽으로 읽어 EL ${q.아래.toFixed(2)} ~ ${q.위.toFixed(2)} m 로 세움(높이가 다른 벽 · 덮개 슬래브는 아직 안 셈)`)
    if (높이별 && 모름.length) 짐작.push(`❓ «${이름}» 덮개 아래 닫힌 꼴 ${모름.length}곳(${모름.map((f) => f.크기.join(' · ') + ((f.보임 || []).length ? ` — 단면 ${f.보임.join(' · ')} 에 같은 폭 덮개 틈` : '')).join(' / ')}) — 자르는 선이 안 지나 덮개 구멍인지 도면으로 모름(안 뺌)`)
    if (높이별 && 짝없.length) 짐작.push(`❓ «${이름}» 단면 ${짝없.map((h) => `${h.단면} ${h.폭.toFixed(2)} m`).join(' · ')} 의 덮개 구멍 — 평면에 맞는 닫힌 네모 · 원이 없어 크기를 모름(안 뺌)`)
  }
  /* ③ 땅 */
  let 땅높이 = NaN
  if (활.땅 && 활.땅.점 && 활.땅.삼 && 활.땅.삼.length >= 3) {
    const P = 활.땅.점, T = 활.땅.삼
    const 면 = new Float32Array(T.length * 3)
    for (let i = 0; i < T.length; i++) { const k = T[i] * 3; 면[i * 3] = P[k] - cx; 면[i * 3 + 1] = P[k + 1] - cy; 면[i * 3 + 2] = P[k + 2] }
    const zs = []; for (let i = 2; i < P.length; i += 3 * Math.max(1, Math.floor(P.length / 3 / 2000))) zs.push(P[i])
    zs.sort((a, b) => a - b); 땅높이 = zs.length ? zs[zs.length >> 1] : NaN
    넣({ 종류: '지형', 이름: `땅(측량점 ${Math.round(P.length / 3)}개)`, 면, 선: [], 몫: null })
  }
  if (!Number.isFinite(땅높이)) {
    const g = 노선들.flatMap((n) => (활.횡단 || []).filter((t) => (t.노선 || '') === n.이름).flatMap((t) => t.단면.map((s) => s.지반고))).filter(Number.isFinite)
    if (g.length) { g.sort((a, b) => a - b); 땅높이 = g[g.length >> 1] * 1000 }
  }
  /* 📚 G440 현장 자리를 못 찾은(옆) 구조물 — 일꾼 좌표 그대로면 현장에서 몇 km 떨어져(현장 S 배수장 3.5 km) 3D 「전체」 가 쪼그라듦
       → 건물(아래 ④)처럼 토목 덩어리 오른쪽 20 m 에 나란히 옮김. 자리만 옮김 — 물량(넓이 · 두께 · 높이)은 그대로 */
  {
    const 옆구 = 구조물들.filter((q) => q.자리 === '옆' && (q.ids || []).length)
    if (옆구.length) {
      const 옆id = new Set(옆구.flatMap((q) => q.ids))
      let b = null
      for (const 땅도 of [false, true]) {
        for (const o of 부재) {
          if (옆id.has(o.id) || (o.종류 === '지형') !== 땅도) continue
          const a = o.면 || []
          for (let i = 0; i + 2 < a.length; i += 3) {
            if (!b) b = [a[i], a[i + 1], a[i], a[i + 1]]
            else { if (a[i] < b[0]) b[0] = a[i]; if (a[i + 1] < b[1]) b[1] = a[i + 1]; if (a[i] > b[2]) b[2] = a[i]; if (a[i + 1] > b[3]) b[3] = a[i + 1] }
          }
        }
        if (b) break
      }
      if (b) {
        const 쪽 = new Map(부재.map((o) => [o.id, o]))
        let 오른 = b[2]
        for (const q of 옆구) {
          let x0 = Infinity, y0 = Infinity, x1 = -Infinity
          for (const id of q.ids) { const a = (쪽.get(id) || {}).면 || []; for (let i = 0; i + 2 < a.length; i += 3) { if (a[i] < x0) x0 = a[i]; if (a[i] > x1) x1 = a[i]; if (a[i + 1] < y0) y0 = a[i + 1] } }
          if (!Number.isFinite(x0)) continue
          const dx = 오른 + 20000 - x0, dy = b[1] - y0
          for (const id of q.ids) {
            const o = 쪽.get(id); if (!o) continue
            for (const k of ['면', '선']) { const a = o[k]; if (!a || !a.length) continue; for (let i = 0; i + 2 < a.length; i += 3) { a[i] += dx; a[i + 1] += dy } }
          }
          q.옮김 = [dx, dy]
          오른 += 20000 + (x1 - x0)
          짐작.push(`«${구조이름(q)}» 은 평면에서 자리를 못 찾아 3D 에서는 토목 오른쪽 20 m 에 세움(자리만 — 물량은 그대로)`)
        }
      }
    }
  }
  /* ④ 🏢 G228 건물(건축 평면 — 층마다 겹선으로 읽은 벽 · 바닥 모양) — 부재 일람표가 없어도 덩어리로 세움(개략) */
  const 건물들 = []
  const 뺄 = new Set((옵.뺄건물 || []).map(줄기))
  const 땅에 = 땅높이찾기(활.땅)
  /* 토목 덩어리 틀(x0, y0, x1, y1) — 현장 자리를 못 찾은(옆) 건물은 이 오른쪽 20 m 에 나란히(일꾼의 «옆» 자리가 멀리 떨어질 때가 있어) */
  let 토틀 = null
  for (const 땅도 of [false, true]) {
    for (const o of 부재) {
      if ((o.종류 === '지형') !== 땅도) continue
      const a = o.면
      for (let i = 0; i < a.length; i += 3) {
        if (!토틀) 토틀 = [a[i], a[i + 1], a[i], a[i + 1]]
        else { if (a[i] < 토틀[0]) 토틀[0] = a[i]; if (a[i + 1] < 토틀[1]) 토틀[1] = a[i + 1]; if (a[i] > 토틀[2]) 토틀[2] = a[i]; if (a[i + 1] > 토틀[3]) 토틀[3] = a[i + 1] }
      }
    }
    if (토틀) break
  }
  let 옆오른 = 토틀 ? 토틀[2] : 0
  for (const b of 활.건물 || []) {
    const 이름 = String(b.이름 || '건물').replace(/\.(dxf|dwg)$/i, '')
    if ((b.파일 || [이름]).some((f) => 뺄.has(줄기(f)))) continue     // 같은 도면을 골조(부재 일람표)로 이미 세움 — 겹치지 않게
    const 층 = (b.층 || []).filter((f) => f.바닥판 && f.바닥판.length).slice().sort((p, q) => p.z0 - q.z0)
    if (!층.length) continue
    const t = Math.max(100, Math.min(600, (옵.건물바닥 && 옵.건물바닥[이름]) || 옵.기본건물바닥 || 200))
    // 땅 높이 — 건물 바닥 가운데의 땅(측량점 삼각망) · 없으면 0(건물 도면 높이 그대로)
    let cxb = 0, cyb = 0, nb = 0
    for (const r of 층[0].바닥판) for (const p of r) { cxb += p[0]; cyb += p[1]; nb++ }
    let 땅z = nb && 땅에 ? 땅에(cxb / nb, cyb / nb) : NaN
    if (!Number.isFinite(땅z) && (노선들.length || 구조물들.length) && Number.isFinite(땅높이)) 땅z = 땅높이     // 측량점이 없으면 토목 지반고 가운데값
    let ox = 0, oy = 0
    const 옆 = b.자리 === '옆' && 토틀
    if (옆) {
      let bx0 = Infinity, by0 = Infinity, bx1 = -Infinity
      for (const f of 층) for (const r of f.바닥판) for (const p of r) { if (p[0] < bx0) bx0 = p[0]; if (p[0] > bx1) bx1 = p[0]; if (p[1] < by0) by0 = p[1] }
      ox = 옆오른 + 20000 - bx0; oy = 토틀[1] - by0
      옆오른 += 20000 + (bx1 - bx0)
      땅z = Number.isFinite(땅높이) ? 땅높이 : NaN                  // 현장 밖 — 토목 땅 높이 가운데값에
    }
    const dz = b.높이맞춤 && !옆 ? 0 : Number.isFinite(땅z) ? 땅z : 0            // 일꾼이 이미 땅 높이로 올렸으면 그대로
    const 판틀 = (z) => (u, v) => [u - cx + ox, v - cy + oy, z + dz]
    const 건 = { 이름, 파일: (b.파일 || [])[0] || '', 자리: 옆 ? '옆' : b.자리 || '', 옆: !!옆, 방이름: !!b.방이름, 바닥두께: t, 기본두께: !(옵.건물바닥 && 옵.건물바닥[이름]), 땅: Number.isFinite(땅z) ? 땅z / 1000 : null,
      층: [], 발자국: [], 연면적: 0, 합: { 콘크리트: 0, 거푸집: 0, 바닥콘: 0, 벽콘: 0 }, ids: [],
      /* 🧭 G237 통심(X1 · Y1) — 발자국과 같은 자리(원점은 끝에서 뺌) · 골조를 이 건물 안 제자리에(lib/건물겹치기.js) */
      통심: (b.통심 || []).map((q) => ({ 글: q.글, 끝: [q.끝[0] - cx + ox, q.끝[1] - cy + oy, q.끝[2] - cx + ox, q.끝[3] - cy + oy] })) }
    const 공 = { 건물: 이름, 파일: 건.파일 }
    for (let i = 0; i < 층.length; i++) {
      const f = 층[i]
      const 높 = (Number.isFinite(f.z1) ? f.z1 : f.z0) - f.z0
      const 지붕 = !(높 > 200)
      const 층이름 = 지붕 && /옥탑·옥상지붕|^PH$/.test(String(f.이름 || f.층)) ? '지붕' : String(f.이름 || f.층)     // 맨 위 층고 없는 «지붕층 평면도»
      const A바 = (f.넓이 && f.넓이.바닥) || 0, P바 = (f.둘레 && f.둘레.바닥) || 0
      const 줄 = { 층: f.층, 이름: 층이름, z0: f.z0 / 1000, z1: (Number.isFinite(f.z1) ? f.z1 : f.z0) / 1000, 지붕, 바닥: A바, 바닥둘레: P바, 벽: 0, 벽둘레: 0, 벽높: 0, 두께: f.두께 || 0, 뺀벽: '' }
      // 바닥판(윗면 = 층 바닥 높이)
      const 바 = 끌어세우기(맞물(f.바닥판), [판틀(f.z0 - t), 판틀(f.z0)])
      const 바물 = { 콘크리트: A바 * t / 1000, 거푸집: A바 + P바 * t / 1000 }
      if (바.면.length) 건.ids.push(넣({ 종류: '건물', 부분: '바닥', 층: 층이름, 이름: `${이름} ${층이름 === '지붕' ? '' : 층이름 + ' '}${지붕 ? '지붕판' : '바닥판'}`, 면: 바.면, 선: 바.선, 색: 토목색.건물바닥, 몫: 바물, 크기: `${Math.round(A바)} ㎡ × 두께 ${t} mm`, ...공 }).id)
      건.합.바닥콘 += 바물.콘크리트; 건.합.거푸집 += 바물.거푸집
      if (!지붕) 건.연면적 += A바
      // 벽 — 바닥 위 ~ 윗층 바닥판 아래
      const 벽높 = 지붕 ? 0 : (높 - t) / 1000
      const A벽 = (f.넓이 && f.넓이.벽) || 0, P벽 = (f.둘레 && f.둘레.벽) || 0
      const 두 = f.두께 || 0
      if (!지붕 && f.벽판 && f.벽판.length && 벽높 > 1) {
        if (두 < 벽두께범위[0] || 두 > 벽두께범위[1] || A벽 > A바 * 0.4) 줄.뺀벽 = `벽 두께가 ${두.toFixed(2)} m 로 읽혀(해치 · 설비 선으로 보임) 벽은 안 세움`
        else {
          const 벽 = 끌어세우기(맞물(f.벽판), [판틀(f.z0), 판틀(f.z1 - t)])
          const 벽물 = { 콘크리트: A벽 * 벽높, 거푸집: P벽 * 벽높 }
          if (벽.면.length) {
            건.ids.push(넣({ 종류: '건물', 부분: '벽', 층: 층이름, 이름: `${이름} ${층이름} 벽`, 면: 벽.면, 선: 벽.선, 몫: 벽물, 크기: `벽 넓이 ${A벽.toFixed(1)} ㎡ × 높이 ${벽높.toFixed(2)} m · 평균 두께 약 ${두.toFixed(2)} m`, ...공 }).id)
            줄.벽 = A벽; 줄.벽둘레 = P벽; 줄.벽높 = 벽높
            건.합.벽콘 += 벽물.콘크리트; 건.합.거푸집 += 벽물.거푸집
          }
        }
      }
      건.층.push(줄)
      // 🏢 같은 건물 겹치기용 — 층 바닥판 테두리(현장 좌표 · 원점은 끝에서 뺌) · 층 바닥 높이(땅 높이 더함)
      건.발자국.push({ 층: f.층, 이름: 층이름, 줄들: f.바닥판.map((r) => r.map((p) => [p[0] - cx + ox, p[1] - cy + oy])), z0: f.z0 + dz })
      // 맨 위층에 지붕 평면이 없으면 — 같은 모양 지붕판을 층 높이 위에(줄 하나 더)
      if (i === 층.length - 1 && !지붕) {
        const 지 = 끌어세우기(맞물(f.바닥판), [판틀(f.z1 - t), 판틀(f.z1)])
        const 지물 = { 콘크리트: A바 * t / 1000, 거푸집: A바 + P바 * t / 1000 }
        const 지이름 = `${층이름} 위 지붕(짐작)`
        if (지.면.length) {
          건.ids.push(넣({ 종류: '건물', 부분: '바닥', 층: 지이름, 이름: `${이름} ${지이름} 지붕판`, 면: 지.면, 선: 지.선, 색: 토목색.건물바닥, 몫: 지물, 크기: `${Math.round(A바)} ㎡ × 두께 ${t} mm`, ...공 }).id)
          건.합.바닥콘 += 지물.콘크리트; 건.합.거푸집 += 지물.거푸집
          건.층.push({ 층: 지이름, 이름: 지이름, z0: f.z1 / 1000, z1: f.z1 / 1000, 지붕: true, 바닥: A바, 바닥둘레: P바, 벽: 0, 벽둘레: 0, 벽높: 0, 두께: 0, 뺀벽: '', 짐작: true })
          짐작.push(`«${이름}» 지붕 평면이 없어 ${층이름} 모양 그대로 지붕판을 얹었습니다`)
        }
      }
    }
    건.합.콘크리트 = 건.합.바닥콘 + 건.합.벽콘
    if (!건.ids.length) continue
    건물들.push(건)
    const 뺀 = 건.층.filter((x) => x.뺀벽)
    짐작.push(`«${이름}» 은 건축 평면 ${층.length}개 층을 겹선으로 읽어 덩어리로 세움(개략) — 바닥판 ${t} mm${건.기본두께 ? '(짐작 — 아래 칸에서 바꿀 수 있음)' : ''} · 벽은 층 바닥 ~ 윗층 바닥판 아래 · 기둥 · 창 · 문 구멍은 안 뺌${b.높이맞춤 && !옆 ? ` · ${b.높이글}` : Number.isFinite(땅z) ? ` · 땅 높이 EL ${(땅z / 1000).toFixed(2)} m 에 놓음` : ''}${옆 ? ' · 현장 자리를 못 찾아 토목 오른쪽 20 m 에 놓음' : b.자리 === '모양' ? ' · 배치도의 같은 모양 자리에 놓음' + (b.방이름 ? '(같은 방 이름 둘레)' : '') : ''}`)
    if (뺀.length) 경고.push(`«${이름}» ${뺀.map((x) => x.이름).join(' · ')} — ${뺀[0].뺀벽}`)
  }
  /* ⑤ 🧱 G230 흙막이 · 가설 3D — 소장님 「지금 도면을 넣으면 흙막이도 되어야 하는거 아니야? … 어떤 도면이든 3d가 되어야 하는 거지」
     말뚝 = 평면 H 꼴 그대로 세움(위 = 땅 + 단면도의 말뚝 머리 · 길이 = 전개도 평균) · 중간말뚝 · 토류판(가운데 줄 · 땅 ~ 굴착 깊이) ·
     띠장 · 버팀보 · 사보강 · 보강재 = 단마다 가운데 줄을 H 형강 크기(규격 B × H) 막대로 · 높이 = 단면도 E.L(없으면 짐작) · 흙막이 안 = 터파기 덩어리
     높이는 단면도 표고를 «원지반 가운데 = 이 자리 땅 높이» 로 맞춤(건축 · 측량 도면과 기준이 달라도 땅 위에 섬) */
  const 흙막이 = (활.흙막이 || []).filter((h) => h && (h.말뚝.개수 || (h.토류판 && h.토류판.넓이) || ['띠장', '버팀보'].some((k) => (h[k] || []).length)))
  const 흙ids표 = new Map()
  for (const h of 흙막이) {
    const G = h.그림
    if (!G || (!G.말뚝.length && !G.토류판.length)) continue
    const 이름 = String(h.파일 || '흙막이').replace(/\.(dxf|dwg)$/i, '').slice(0, 40)
    let cx = 0, cy = 0, n0 = 0
    for (const q of G.말뚝) for (const p of q) { cx += p[0]; cy += p[1]; n0++ }
    if (!n0) for (const c of G.토류판) { cx += c.a[0] + c.b[0]; cy += c.a[1] + c.b[1]; n0 += 2 }
    cx /= n0 || 1; cy /= n0 || 1
    let 땅z = 땅에 ? 땅에(cx, cy) : NaN
    if (!Number.isFinite(땅z)) 땅z = Number.isFinite(땅높이) ? 땅높이 : 0
    const 땅at = () => 땅z          // 흙막이 하나는 한 높이 기준(측량점이 드문 땅에서 판 윗면이 물결치지 않게) — 표고 차이는 단면도 E.L 로
    const S = h.단면, GL = S && S.지반 ? (S.지반[0] + S.지반[1]) / 2 : null
    const 표z = (EL) => (EL - GL) * 1000 + 땅z
    const 깊 = (h.평균깊이 > 0 ? h.평균깊이 : S && S.바닥.length && GL != null ? GL - S.바닥.reduce((a, b) => a + b, 0) / S.바닥.length : 6) * 1000
    const 말L = h.말뚝.개수 && h.말뚝.길이 > 0 ? h.말뚝.길이 / h.말뚝.개수 * 1000 : S && S.말뚝 ? (S.말뚝.위 - S.말뚝.끝) * 1000 : 깊 + 3000
    const 머리 = S && S.말뚝 && S.지반 ? Math.max(0, Math.min(1500, (S.말뚝.위 - S.지반[1]) * 1000)) : 0
    const 규 = h.규격 || {}
    const kg = (k) => (규[k] || 규.띠장 || { kg: 0 }).kg
    const 상 = (꼴, z0, z1) => { const r = 넓(꼴) < 0 ? 꼴.slice().reverse() : 꼴; return 끌어세우기([{ 바깥: r, 구멍: [] }], [(x, y) => [x, y, z0], (x, y) => [x, y, z1]], { 모서리각: 30 }) }
    const 막대 = (a, b, w) => { const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, nx = -(b[1] - a[1]) / l * w / 2, ny = (b[0] - a[0]) / l * w / 2; return [[a[0] + nx, a[1] + ny], [b[0] + nx, b[1] + ny], [b[0] - nx, b[1] - ny], [a[0] - nx, a[1] - ny]] }
    const 합치 = (목록) => { const 면 = [], 선 = []; for (const m of 목록) { for (const v of m.면) 면.push(v); for (const v of m.선) 선.push(v) } return { 면, 선 } }
    const 흙ids = []
    const 공 = { 흙막이: 이름, 파일: h.파일 }
    // 단 높이(m 표고 · 단면도) — 가장 긴 단 = 1단 · 그 아래 1.5 m 넘게 낮은 것 중 가장 긴 것 = 다음 단 · 모자라면 2.5 m 아래(짐작)
    const 단수 = Math.max(1, ...Object.values(G.부재).flatMap((v) => v.map((d) => d.단 || 1)))
    const 단z = new Map()
    let 단짐작 = ''
    if (S && S.단.length && GL != null) {
      let 앞 = null
      for (let k = 1; k <= 단수; k++) {
        const 후 = S.단.filter((d) => 앞 == null || d.EL < 앞 - 1.5).sort((a, b) => b.길이 - a.길이)
        const EL = 후.length ? 후[0].EL : (앞 != null ? 앞 - 2.5 : GL - 1)
        if (!후.length) 단짐작 = ' · 단면도에 없는 단은 2.5 m 아래(짐작)'
        단z.set(k, 표z(EL)); 앞 = EL
      }
    } else {
      for (let k = 1; k <= 단수; k++) 단z.set(k, Math.max(땅z - 깊 + 500, 땅z - 1000 - (k - 1) * 2500))
      단짐작 = ' · 단면도가 없어 1단 = 땅 − 1.0 m · 단 사이 2.5 m(짐작)'
    }
    // 말뚝
    G.말뚝.forEach((꼴, i) => {
      const pc = [(꼴[0][0] + 꼴[2][0]) / 2, (꼴[0][1] + 꼴[2][1]) / 2], zt = 땅at(pc[0], pc[1]) + 머리
      const m = 상(꼴, zt - 말L, zt)
      흙ids.push(넣({ 종류: '흙막이', 부분: '말뚝', 이름: `${이름} H-PILE ${i + 1}`, 면: m.면, 선: m.선, 색: 토목색.흙막이, 몫: { 강재: 말L / 1000 * kg('측면말뚝') / 1000, 길이: 말L / 1000 }, 크기: `${(규.측면말뚝 || {}).규격 || 'H 형강'} · 길이 ${(말L / 1000).toFixed(2)} m`, ...공 }).id)
    })
    const 중L = (h.중간말뚝.길이 > 0 ? h.중간말뚝.길이 : 말L / 1000) * 1000
    const 중위 = S && S.중간 && GL != null ? 표z(S.중간.위) : 땅z
    G.중간.forEach((꼴, i) => {
      const m = 상(꼴, 중위 - 중L, 중위)
      흙ids.push(넣({ 종류: '흙막이', 부분: '중간말뚝', 이름: `${이름} 중간말뚝 ${i + 1}`, 면: m.면, 선: m.선, 색: 토목색.흙막이, 몫: { 강재: 중L / 1000 * kg('중간말뚝') / 1000, 길이: 중L / 1000 }, 크기: `${(규.중간말뚝 || 규.버팀보 || {}).규격 || 'H 형강'} · 길이 ${(중L / 1000).toFixed(2)} m`, ...공 }).id)
    })
    // 토류판 — 가운데 줄마다 땅 ~ 굴착 깊이 (판 두께 = 두 줄 사이 · 없으면 80 mm)
    if (G.토류판.length) {
      const ms = G.토류판.map((c) => { const w = c.폭 >= 30 && c.폭 <= 250 ? c.폭 : 80, zt = 땅at((c.a[0] + c.b[0]) / 2, (c.a[1] + c.b[1]) / 2); return 상(막대(c.a, c.b, w), zt - 깊, zt) })
      const m = 합치(ms)
      흙ids.push(넣({ 종류: '흙막이', 부분: '토류판', 이름: `${이름} 토류판`, 면: m.면, 선: m.선, 색: 토목색.토류판, 몫: { 토류판: h.토류판.넓이 }, 크기: `둘레 ${h.토류판.둘레.toFixed(1)} m × 깊이 ${(깊 / 1000).toFixed(2)} m`, ...공 }).id)
    }
    // 띠장 · 버팀보 · 사보강 · 보강재 — 단마다 한 덩어리
    for (const k of ['띠장', '버팀보', '사보강', '보강재']) {
      for (const d of G.부재[k] || []) {
        const 단 = d.단 || 1, zc = 단z.get(단)
        const r = 규[k] || 규.띠장 || null, Hh = r ? r.H : 300, B = r ? r.B : 300
        const L = d.줄.reduce((s0, c) => s0 + Math.hypot(c.b[0] - c.a[0], c.b[1] - c.a[1]), 0) / 1000
        const 길이 = ((h[k] || []).find((x) => (x.단 || 1) === 단) || {}).길이 || L
        const m = 합치(d.줄.map((c) => 상(막대(c.a, c.b, c.폭 >= 150 && c.폭 <= 650 ? c.폭 : B), zc - Hh / 2, zc + Hh / 2)))
        흙ids.push(넣({ 종류: '흙막이', 부분: k, 단, 이름: `${이름} ${k} ${단}단`, 면: m.면, 선: m.선, 색: 토목색[k] || 토목색.흙막이, 몫: { 강재: 길이 * kg(k) / 1000, 길이 }, 크기: `${r ? r.규격 : 'H 형강'} · ${길이.toFixed(1)} m · ${단}단 EL 높이 ${((zc - 땅z) / 1000).toFixed(2)} m(땅 기준)`, ...공 }).id)
      }
    }
    // 흙막이 안 = 터파기(비쳐 보이는 흙)
    if (G.안줄 && G.안줄.length >= 3 && h.터파기) {
      const m = 상(G.안줄, 땅z - 깊, 땅z)
      흙ids.push(넣({ 종류: '터파기', 부분: '흙막이 안', 이름: `${이름} 건물 터파기(흙막이 안)`, 면: m.면, 선: m.선, 몫: { 터파기: h.터파기.부피 }, 크기: `${h.터파기.넓이.toFixed(1)} ㎡ × ${(깊 / 1000).toFixed(2)} m`, ...공 }).id)
    }
    흙ids표.set(h, 흙ids)
    짐작.push(`«${이름}» 흙막이 3D — 말뚝 ${G.말뚝.length}본(길이 평균 ${(말L / 1000).toFixed(2)} m) · 중간말뚝 ${G.중간.length}본 · 토류판 · ${Object.entries(G.부재).filter(([, v]) => v.length).map(([k, v]) => k + ' ' + v.map((d) => (d.단 || 1) + '단').join('·')).join(' · ')} · 굴착 ${(깊 / 1000).toFixed(2)} m · 높이 = ${S && GL != null ? `단면도 E.L(원지반 ${GL.toFixed(2)} = 땅 ${(땅z / 1000).toFixed(2)} m)` : '땅 기준'}${단짐작}${G.놓임 ? '' : ' · 흙막이 평면의 현장 자리를 못 찾아 도면 자리 그대로'}`)
  }
  /* 합 */
  const 합 = { 콘크리트: 0, 거푸집: 0, 터파기: 0, 되메우기: 0, 성토: 0, 절토: 0 }
  for (const n of 노선들) for (const k of Object.keys(합)) 합[k] += n.합[k] || 0
  for (const s of 구조물들) { 합.콘크리트 += s.합.콘크리트; 합.거푸집 += s.합.거푸집 }
  /* 틀 · 원점(덩어리들 가운데 · 1 m 맞춤) → 모두 원점 기준으로 옮기고 Float32 로(큰 측량 좌표에서 떨리지 않게) */
  let 틀 = null
  for (const o of 부재) {
    if (o.종류 === '지형') continue
    const a = o.면
    for (let i = 0; i < a.length; i += 3) {
      if (!틀) 틀 = [a[i], a[i + 1], a[i + 2], a[i], a[i + 1], a[i + 2]]
      else { 틀[0] = Math.min(틀[0], a[i]); 틀[1] = Math.min(틀[1], a[i + 1]); 틀[2] = Math.min(틀[2], a[i + 2]); 틀[3] = Math.max(틀[3], a[i]); 틀[4] = Math.max(틀[4], a[i + 1]); 틀[5] = Math.max(틀[5], a[i + 2]) }
    }
  }
  if (!틀) for (const o of 부재) { const a = o.면; for (let i = 0; i < a.length; i += 3) { if (!틀) 틀 = [a[i], a[i + 1], a[i + 2], a[i], a[i + 1], a[i + 2]]; else { 틀[0] = Math.min(틀[0], a[i]); 틀[1] = Math.min(틀[1], a[i + 1]); 틀[3] = Math.max(틀[3], a[i]); 틀[4] = Math.max(틀[4], a[i + 1]); 틀[2] = Math.min(틀[2], a[i + 2]); 틀[5] = Math.max(틀[5], a[i + 2]) } } }
  const 원점 = 틀 ? [Math.round((틀[0] + 틀[3]) / 2000) * 1000, Math.round((틀[1] + 틀[4]) / 2000) * 1000] : [0, 0]
  for (const o of 부재) {
    const 옮 = (a) => { const f = new Float32Array(a.length); for (let i = 0; i < a.length; i += 3) { f[i] = a[i] - 원점[0]; f[i + 1] = a[i + 1] - 원점[1]; f[i + 2] = a[i + 2] } return f }
    o.면 = 옮(o.면); o.선 = 옮(o.선 || [])
    // 면 방향 맞추기(바깥으로) — 부피가 − 이면 뒤집음 · 부피(㎥)도 같이
    if (o.종류 !== '지형') {
      let V = 0
      const a = o.면
      for (let i = 0; i + 8 < a.length; i += 9) V += (a[i] * (a[i + 4] * a[i + 8] - a[i + 7] * a[i + 5]) - a[i + 3] * (a[i + 1] * a[i + 8] - a[i + 7] * a[i + 2]) + a[i + 6] * (a[i + 1] * a[i + 5] - a[i + 4] * a[i + 2])) / 6
      if (V < 0) for (let i = 0; i + 8 < a.length; i += 9) for (let k = 0; k < 3; k++) { const t = a[i + 3 + k]; a[i + 3 + k] = a[i + 6 + k]; a[i + 6 + k] = t }
      o.부피 = Math.abs(V) / 1e9
    }
  }
  if (틀) 틀 = [틀[0] - 원점[0], 틀[1] - 원점[1], 틀[2], 틀[3] - 원점[0], 틀[4] - 원점[1], 틀[5]]
  for (const b of 건물들) for (const f of b.발자국) f.줄들 = f.줄들.map((r) => r.map((p) => [p[0] - 원점[0], p[1] - 원점[1]]))
  for (const b of 건물들) b.통심 = (b.통심 || []).map((q) => ({ 글: q.글, 끝: [q.끝[0] - 원점[0], q.끝[1] - 원점[1], q.끝[2] - 원점[0], q.끝[3] - 원점[1]] }))
  void 길이된
  return { 부재, 노선들, 구조물들, 건물들, 흙막이: 흙막이.map((h) => ({ ...h, ids: 흙ids표.get(h) || [] })), 합, 경고, 짐작, 틀, 땅높이, 원점 }
}

/** 화면 · 엑셀용 노선 물량 줄(평균단면 표) */
export function 평균단면줄(노) {
  return 노.줄.map((r) => ({ 측: r.측, 측글: 측점글(r.측), 거리: r.거리, 면적: r.면적, 부피: r.부피 }))
}
