/**
 * 🖼 골조 수량산출 — 도면 그리기 (캔버스) (2026-09-26)
 * 골조도면.js 가 읽은 모델을 화면에 그립니다. 확대·이동은 화면(Golgo.jsx)이 view 로 넘겨줍니다.
 * 색마다 Path2D 하나로 묶어 한 번에 그립니다(선 수십만 개도 버팁니다).
 */
import { 종류 } from './골조도면.js'

export const 바탕 = '#0b0f16'

/** 색이 바탕(검정)과 너무 가까우면 밝게 */
function 보이는색(rgb) {
  const r = (rgb >> 16) & 255, g = (rgb >> 8) & 255, b = rgb & 255
  const Y = 0.2126 * r + 0.7152 * g + 0.0722 * b
  if (Y < 60) return 'rgb(200,200,200)'
  return 'rgb(' + r + ',' + g + ',' + b + ')'
}

/** 모델 → {층번호 → {색 → Path2D}} (레이어를 끄고 켤 수 있게 층별로) */
export function 길만들기(model) {
  const { E, Q, P } = model
  const 층들 = new Map()
  for (let q = 0; q < Q.e.length; q++) {
    const e = Q.e[q]
    const ly = E.ly[e]
    let m = 층들.get(ly)
    if (!m) { m = new Map(); 층들.set(ly, m) }
    const c = E.rgb[e]
    let p = m.get(c)
    if (!p) { p = new Path2D(); m.set(c, p) }
    const s = Q.p0[q] * 2, n = Q.pn[q]
    p.moveTo(P[s], P[s + 1])
    for (let k = 1; k < n; k++) p.lineTo(P[s + k * 2], P[s + k * 2 + 1])
  }
  return 층들
}

/** 도형 하나의 Path2D (강조용) */
export function 도형길(model, e, 조각표) {
  const { Q, P } = model
  const p = new Path2D()
  for (const q of 조각표.get(e) || []) {
    const s = Q.p0[q] * 2, n = Q.pn[q]
    p.moveTo(P[s], P[s + 1])
    for (let k = 1; k < n; k++) p.lineTo(P[s + k * 2], P[s + k * 2 + 1])
  }
  return p
}

/** 도형 → 조각 번호들 */
export function 조각표만들기(model) {
  const m = new Map()
  const { Q } = model
  for (let q = 0; q < Q.e.length; q++) { const e = Q.e[q]; const a = m.get(e); if (a) a.push(q); else m.set(e, [q]) }
  return m
}

/**
 * @param view {s: 화면px/도면단위, cx, cy: 화면 가운데의 도면 좌표}
 * @param 강조 [{ids:Set|Array, color, w}] — 덧그릴 도형들
 */
export function 그리기(ctx, W, H, dpr, model, 길들, view, 끈층, 강조, 조각표, 글꼴) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.fillStyle = 바탕
  ctx.fillRect(0, 0, W, H)
  if (!model) return
  const { s, cx, cy } = view
  const toWorld = () => ctx.setTransform(dpr * s, 0, 0, -dpr * s, dpr * (W / 2 - s * cx), dpr * (H / 2 + s * cy))
  toWorld()
  ctx.lineWidth = 1 / s
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  for (const [ly, m] of 길들) {
    if (끈층 && 끈층.has(ly)) continue
    for (const [c, p] of m) { ctx.strokeStyle = 보이는색(c); ctx.stroke(p) }
  }
  // 글자
  const T = model.T
  const x0 = cx - W / 2 / s, x1 = cx + W / 2 / s, y0 = cy - H / 2 / s, y1 = cy + H / 2 / s
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.textBaseline = 'alphabetic'
  let drawn = 0
  const 강조글 = new Map()
  for (const k of 강조 || []) for (const e of k.ids) 강조글.set(e, k.color)
  for (let i = 0; i < T.s.length; i++) {
    const e = T.e[i]
    if (끈층 && 끈층.has(model.E.ly[e])) continue
    const hpx = T.h[i] * s
    const 강 = 강조글.get(e)
    if (hpx < 3.5 && !강) continue
    const x = T.x[i], y = T.y[i]
    const wlen = T.s[i].length * T.h[i]
    if (x + wlen < x0 || x - wlen > x1 || y + wlen < y0 || y - wlen > y1) continue
    if (++drawn > 6000 && !강) continue
    const sx = W / 2 + (x - cx) * s, sy = H / 2 - (y - cy) * s
    ctx.save()
    ctx.translate(sx, sy)
    ctx.rotate(-T.a[i])
    ctx.font = Math.max(hpx, 3.5) + 'px ' + (글꼴 || 'sans-serif')
    ctx.fillStyle = 강 || 보이는색(model.E.rgb[e])
    ctx.fillText(T.s[i], 0, 0)
    if (강) {
      const w = ctx.measureText(T.s[i]).width
      ctx.strokeStyle = 강; ctx.lineWidth = 1.5
      ctx.strokeRect(-2, -hpx - 2, w + 4, hpx + 5)
    }
    ctx.restore()
  }
  // 강조
  if (강조 && 강조.length) {
    toWorld()
    for (const k of 강조) {
      ctx.strokeStyle = k.color
      ctx.lineWidth = (k.w || 3) / s
      for (const e of k.ids) {
        if (model.E.t[e] === 종류.글자) continue
        ctx.stroke(도형길(model, e, 조각표))
      }
    }
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
}

/** 도면 전체가 보이는 view */
export function 전체보기(model, W, H) {
  const [x0, y0, x1, y1] = model.box
  const s = Math.min(W / ((x1 - x0) || 1), H / ((y1 - y0) || 1)) * 0.95
  return { s: s > 0 && Number.isFinite(s) ? s : 1, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 }
}

/** 두 점 재기용 — 가까운 꼭짓점(끝점·가운데점) */
export function 가까운점(model, 판, x, y, tol) {
  const { P, Q } = model
  let best = null, bd = tol
  const c0 = Math.floor((x - tol - 판.x0) / 판.cw), c1 = Math.floor((x + tol - 판.x0) / 판.cw)
  const r0 = Math.floor((y - tol - 판.y0) / 판.ch), r1 = Math.floor((y + tol - 판.y0) / 판.ch)
  const see = (px, py) => { const d = Math.hypot(px - x, py - y); if (d < bd) { bd = d; best = [px, py] } }
  const look = (arr) => {
    if (!arr) return
    for (let j = 0; j < arr.length; j += 2) {
      const q = arr[j], k = arr[j + 1]
      const i = (Q.p0[q] + k) * 2
      see(P[i], P[i + 1]); see(P[i + 2], P[i + 3])
    }
  }
  for (let r = Math.max(0, r0); r <= Math.min(판.n - 1, r1); r++) for (let c = Math.max(0, c0); c <= Math.min(판.n - 1, c1); c++) look(판.cells.get(r * 판.n + c))
  return best || [x, y]
}
