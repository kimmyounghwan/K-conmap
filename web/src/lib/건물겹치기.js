/**
 * 🏢 G228 같은 건물 겹치기 — 골조(구조평면도 + 일람표로 세운 부재)와 건축 평면 덩어리(배치도 자리에 놓인 건물)가
 *   «같은 건물» 인지 보고, 같으면 골조를 그 자리로 옮기는 돌림 · 옮김을 찾습니다. (2026-10-10)
 *
 * 소장님: 현장 A 도면 시험에서 같은 건물이 두 번(왼쪽 건축 평면 덩어리 · 오른쪽 골조) 나와 콘크리트가 두 배 →
 *         「같은 건물은 하나만」(골조가 있으면 건축 평면 덩어리는 참고 · 골조는 배치도의 그 건물 자리에)
 *
 * ■ 방법(2D 발자국)
 *   ① 두 발자국을 50 cm 칸으로 칠함 — 덩어리 = 기준층 바닥판(구멍 홀짝) · 골조 = 같은 층 부재 판(슬래브 · 보 · 기둥 · 벽)을 모두 칠함
 *   ② 방향 = 변 길이를 90° 안에서 모은 가장 많은 방향(벽 · 보는 거의 직각으로 놓임) → 돌림 후보 넷(+0 · 90 · 180 · 270°)
 *   ③ 후보마다 무게중심을 맞추고 겹친 몫(IoU)을 셈 → 가장 좋은 것을 옮김 ±3 m · 돌림 ±1.5° 로 다듬음
 *   ④ 겹친 몫 0.55 넘으면 같은 건물
 * ■ 좌표: 둘 다 mm. 골조 점 p → R(θ)·p + (tx, ty)
 */

import { 통심겹치기 } from './통심.js'

const 칸 = 500

function 방향(변들) {
  // 변 [x0, y0, x1, y1] 길이 가중 · 90° 접어 1° 칸 → 가장 무거운 방향(앞뒤 1° 평균)
  const h = new Float64Array(90)
  for (const [x0, y0, x1, y1] of 변들) {
    const L = Math.hypot(x1 - x0, y1 - y0)
    if (L < 300) continue
    let a = Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI
    a = ((a % 90) + 90) % 90
    h[Math.floor(a) % 90] += L
  }
  let bi = 0
  for (let i = 1; i < 90; i++) if (h[i] > h[bi]) bi = i
  // 칸 안 고른 자리 — 이웃까지 무게중심
  let s = 0, w = 0
  for (let d = -1; d <= 1; d++) { const i = (bi + d + 90) % 90; s += (bi + d + 0.5) * h[i]; w += h[i] }
  return (w ? s / w : bi + 0.5) * Math.PI / 180
}

/** 다각형들 → 칸 칠하기(홀짝 · 여러 다각형이면 하나라도 안이면 칠함은 «합» 으로: 홀짝=false) */
function 칠하기(다각형들, 틀, 홀짝) {
  const [x0, y0, W, H] = 틀
  const M = new Uint8Array(W * H)
  if (홀짝) {
    // 줄마다 교차점 → 홀짝
    for (let j = 0; j < H; j++) {
      const y = y0 + (j + 0.5) * 칸
      const xs = []
      for (const r of 다각형들) for (let i = 0; i < r.length; i++) {
        const a = r[i], b = r[(i + 1) % r.length]
        if ((a[1] > y) === (b[1] > y)) continue
        xs.push(a[0] + (y - a[1]) * (b[0] - a[0]) / (b[1] - a[1]))
      }
      xs.sort((p, q) => p - q)
      for (let k = 0; k + 1 < xs.length; k += 2) {
        const i0 = Math.max(0, Math.ceil((xs[k] - x0) / 칸 - 0.5)), i1 = Math.min(W - 1, Math.floor((xs[k + 1] - x0) / 칸 - 0.5))
        for (let i = i0; i <= i1; i++) M[j * W + i] = 1
      }
    }
  } else {
    for (const r of 다각형들) {
      let ry0 = Infinity, ry1 = -Infinity
      for (const p of r) { if (p[1] < ry0) ry0 = p[1]; if (p[1] > ry1) ry1 = p[1] }
      const j0 = Math.max(0, Math.floor((ry0 - y0) / 칸)), j1 = Math.min(H - 1, Math.ceil((ry1 - y0) / 칸))
      for (let j = j0; j <= j1; j++) {
        const y = y0 + (j + 0.5) * 칸
        const xs = []
        for (let i = 0; i < r.length; i++) {
          const a = r[i], b = r[(i + 1) % r.length]
          if ((a[1] > y) === (b[1] > y)) continue
          xs.push(a[0] + (y - a[1]) * (b[0] - a[0]) / (b[1] - a[1]))
        }
        xs.sort((p, q) => p - q)
        for (let k = 0; k + 1 < xs.length; k += 2) {
          const i0 = Math.max(0, Math.ceil((xs[k] - x0) / 칸 - 0.5)), i1 = Math.min(W - 1, Math.floor((xs[k + 1] - x0) / 칸 - 0.5))
          for (let i = i0; i <= i1; i++) M[j * W + i] = 1
        }
      }
    }
  }
  return M
}

const 무게 = (M, 틀) => {
  const [x0, y0, W, H] = 틀
  let n = 0, sx = 0, sy = 0
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) if (M[j * W + i]) { n++; sx += i; sy += j }
  return n ? { n, x: x0 + (sx / n + 0.5) * 칸, y: y0 + (sy / n + 0.5) * 칸 } : { n: 0, x: 0, y: 0 }
}

/**
 * @param 골판들 [[x, y]…] 골조 기준층 부재 판(mm · 골조 좌표)
 * @param 덩줄들 [[x, y]…] 건축 덩어리 기준층 바닥판 줄(바깥 + 구멍 · mm · 현장 좌표)
 * @returns {null | { θ, tx, ty, 몫, 같음 }}
 */
export function 건물겹치기(골판들, 덩줄들, { 문턱 = 0.55 } = {}) {
  if (!골판들.length || !덩줄들.length) return null
  const 변 = (rs) => rs.flatMap((r) => r.map((p, i) => [p[0], p[1], r[(i + 1) % r.length][0], r[(i + 1) % r.length][1]]))
  const θd = 방향(변(덩줄들)), θg = 방향(변(골판들))
  // 덩어리 칸(틀 = 덩어리 상자 + 여유 20 m)
  let X0 = Infinity, Y0 = Infinity, X1 = -Infinity, Y1 = -Infinity
  for (const r of 덩줄들) for (const p of r) { if (p[0] < X0) X0 = p[0]; if (p[0] > X1) X1 = p[0]; if (p[1] < Y0) Y0 = p[1]; if (p[1] > Y1) Y1 = p[1] }
  const 여 = 20000
  const 틀 = [X0 - 여, Y0 - 여, Math.ceil((X1 - X0 + 2 * 여) / 칸), Math.ceil((Y1 - Y0 + 2 * 여) / 칸)]
  if (틀[2] * 틀[3] > 4e6) return null                     // 너무 큼(덩어리가 아닌 것)
  const D = 칠하기(덩줄들, 틀, true)
  const gD = 무게(D, 틀)
  if (!gD.n) return null
  // 골조 무게중심(골조 좌표) — 골조 상자로 따로 칠해 셈
  let gx0 = Infinity, gy0 = Infinity, gx1 = -Infinity, gy1 = -Infinity
  for (const r of 골판들) for (const p of r) { if (p[0] < gx0) gx0 = p[0]; if (p[0] > gx1) gx1 = p[0]; if (p[1] < gy0) gy0 = p[1]; if (p[1] > gy1) gy1 = p[1] }
  const 골틀 = [gx0 - 칸, gy0 - 칸, Math.ceil((gx1 - gx0) / 칸) + 2, Math.ceil((gy1 - gy0) / 칸) + 2]
  if (골틀[2] * 골틀[3] > 4e6) return null
  const gG = 무게(칠하기(골판들, 골틀, false), 골틀)
  const 겹 = (θ, tx, ty) => {
    const c = Math.cos(θ), s = Math.sin(θ)
    const 돌 = 골판들.map((r) => r.map(([x, y]) => [c * x - s * y + tx, s * x + c * y + ty]))
    const G = 칠하기(돌, 틀, false)
    let 둘 = 0, 하나 = 0
    for (let i = 0; i < G.length; i++) { if (G[i] && D[i]) 둘++; if (G[i] || D[i]) 하나++ }
    return 하나 ? 둘 / 하나 : 0
  }
  const 맞춤 = (θ) => { const c = Math.cos(θ), s = Math.sin(θ); return [gD.x - (c * gG.x - s * gG.y), gD.y - (s * gG.x + c * gG.y)] }
  let 좋 = null
  for (let k = 0; k < 4; k++) {
    const θ = θd - θg + k * Math.PI / 2
    const [tx, ty] = 맞춤(θ)
    const m = 겹(θ, tx, ty)
    if (!좋 || m > 좋.몫) 좋 = { θ, tx, ty, 몫: m }
  }
  // 다듬기 — 옮김 ±3 m(50 cm) · 돌림 ±1.5°(0.5°)
  for (const 걸음 of [1000, 500]) {
    let 나아짐 = true, 번 = 0
    while (나아짐 && 번++ < 12) {
      나아짐 = false
      for (const [dθ, dx, dy] of [[0, 걸음, 0], [0, -걸음, 0], [0, 0, 걸음], [0, 0, -걸음], [Math.PI / 360, 0, 0], [-Math.PI / 360, 0, 0]]) {
        const θ = 좋.θ + dθ, tx = 좋.tx + dx, ty = 좋.ty + dy
        const m = 겹(θ, tx, ty)
        if (m > 좋.몫 + 1e-4) { 좋 = { θ, tx, ty, 몫: m }; 나아짐 = true }
      }
    }
  }
  return { ...좋, 같음: 좋.몫 >= 문턱 }
}

/** 🧭 G237 정한 돌림 · 옮김으로 두 발자국이 겹친 몫(IoU) — 통심으로 맞춘 뒤 확인용 */
export function 겹친몫(골판들, 덩줄들, θ, tx, ty) {
  if (!골판들.length || !덩줄들.length) return 0
  let X0 = Infinity, Y0 = Infinity, X1 = -Infinity, Y1 = -Infinity
  for (const r of 덩줄들) for (const p of r) { if (p[0] < X0) X0 = p[0]; if (p[0] > X1) X1 = p[0]; if (p[1] < Y0) Y0 = p[1]; if (p[1] > Y1) Y1 = p[1] }
  const 여 = 20000
  const 틀 = [X0 - 여, Y0 - 여, Math.ceil((X1 - X0 + 2 * 여) / 칸), Math.ceil((Y1 - Y0 + 2 * 여) / 칸)]
  if (틀[2] * 틀[3] > 4e6) return 0
  const D = 칠하기(덩줄들, 틀, true)
  const c = Math.cos(θ), s = Math.sin(θ)
  const G = 칠하기(골판들.map((r) => r.map(([x, y]) => [c * x - s * y + tx, s * x + c * y + ty])), 틀, false)
  let 둘 = 0, 하나 = 0
  for (let i = 0; i < G.length; i++) { if (G[i] && D[i]) 둘++; if (G[i] || D[i]) 하나++ }
  return 하나 ? 둘 / 하나 : 0
}

/**
 * 골조 모델(BIM모델 모델만들기) · 건축 평면 덩어리들(BIM토목 건물들) → 같은 건물 하나(가장 잘 겹친 층)
 *   🧭 G237 먼저 «통심»(X1 · Y1 …): 골조 모델 통심 ↔ 건물 통심이 같은 글자 셋 넘게 · 두 방향 · 남는 차 0.5 m 안이면 그 돌림 · 옮김
 *     (소장님 겹치는 순서 4 — 골조는 건축 평면 건물 안 제자리에. 현장 B: 골조에 슬래브가 없어 발자국 겹침이 15 % 라 옆에 따로 섰음)
 *   골조 20개 넘게 · 층마다(지하 · 숫자 층) 골조 부재 판(자리 맞춘 것 8개 넘게) ↔ 덩어리 그 층 바닥판
 *   같음 = 겹친 몫 0.55 넘음 + 층 수가 같음(±1 · 지하 있음/없음 같음 · 2개 넘게) — 네모 꼴은 모양만으론 다른 건물과도 잘 겹침
 * @returns {null | { θ, tx, ty, 몫, 같음, 층맞음, 층수:[골, 덩], 번, 층, dz }}
 */
export function 같은건물찾기(모델, 건물들) {
  if (!모델 || !모델.부재 || 모델.부재.length < 20 || !건물들 || !건물들.length) return null
  const 층들 = (xs) => new Set(xs.filter((k) => /^B?\d+$/.test(String(k))))
  const 골층들 = 층들(모델.부재.filter((o) => !o.자리짐작).map((o) => o.층))
  const 지하 = (S) => [...S].some((k) => /^B/.test(k))
  /* ① 통심 */
  if (모델.통심 && 모델.통심.length >= 3) {
    let 통 = null
    건물들.forEach((b, bi) => {
      if (!b.통심 || b.통심.length < 3) return
      const r = 통심겹치기(모델.통심, b.통심)
      if (!r || r.최대 > 500) return
      if (!통 || r.줄수 > 통.r.줄수 || (r.줄수 === 통.r.줄수 && r.최대 < 통.r.최대)) 통 = { r, bi }
    })
    if (통) {
      const b = 건물들[통.bi]
      const 덩층들 = 층들(b.층.filter((f) => !f.지붕).map((f) => f.층))
      const 층맞음 = 지하(골층들) === 지하(덩층들) && [...골층들].some((k) => 덩층들.has(k))
      /* 높이 맞출 층 — 1층 · 없으면 둘 다 있는 가장 낮은 층 */
      const 같은층 = [...골층들].filter((k) => 덩층들.has(k)).sort((p, q) => (p === '1' ? -1 : q === '1' ? 1 : (p[0] === 'B' ? -+p.slice(1) : +p) - (q[0] === 'B' ? -+q.slice(1) : +q)))[0]
      const f = 같은층 && (b.발자국 || []).find((x) => x.층 === 같은층)
      const 골층 = (모델.층 || []).find((x) => x.이름 === 같은층)
      const 판 = 같은층 ? 모델.부재.filter((o) => o.층 === 같은층 && !o.자리짐작 && o.판 && o.판.length >= 3).map((o) => o.판) : []
      const 몫 = f && 판.length ? 겹친몫(판, f.줄들, 통.r.θ, 통.r.tx, 통.r.ty) : 0
      if (층맞음 && f) {
        return { θ: 통.r.θ, tx: 통.r.tx, ty: 통.r.ty, 몫, 같음: true, 층맞음, 층수: [골층들.size, 덩층들.size], 번: 통.bi, 층: 같은층, 바닥: f.z0,
          dz: Math.round(f.z0 - (골층 && Number.isFinite(골층.바닥) ? 골층.바닥 : 0)), 방법: '통심', 통심: { 줄수: 통.r.줄수, 최대: Math.round(통.r.최대), 글들: 통.r.글들 } }
      }
    }
  }
  /* ② 발자국 모양(통심을 못 찾을 때) */
  let 좋 = null
  건물들.forEach((b, bi) => {
    for (const f of b.발자국 || []) {
      if (!/^B?\d+$/.test(String(f.층))) continue
      const 판 = 모델.부재.filter((o) => o.층 === f.층 && !o.자리짐작 && o.판 && o.판.length >= 3).map((o) => o.판)
      if (판.length < 8) continue
      let r = null
      try { r = 건물겹치기(판, f.줄들) } catch (e) { r = null }
      if (r && (!좋 || r.몫 > 좋.몫)) 좋 = { ...r, 번: bi, 층: f.층, 바닥: f.z0 }
    }
  })
  if (!좋) return null
  const 덩층들 = 층들(건물들[좋.번].층.filter((f) => !f.지붕).map((f) => f.층))
  const 층맞음 = Math.abs(골층들.size - 덩층들.size) <= 1 && 지하(골층들) === 지하(덩층들) && 골층들.size >= 2
  const 골층 = (모델.층 || []).find((x) => x.이름 === 좋.층)
  return { ...좋, 같음: 좋.같음 && 층맞음, 층맞음, 층수: [골층들.size, 덩층들.size], dz: Math.round(좋.바닥 - (골층 && Number.isFinite(골층.바닥) ? 골층.바닥 : 0)) }
}
