/**
 * 📐 골조 수량산출 — 도면(.dxf)에서 «찍어 잴» 것들 읽기 (2026-09-26)
 *
 * 소장님: 「이 방식을 이용해서 수량 산출서 만드는 프로그램 만들어 줘. 잰 치수 빼고」
 *
 * ■ 도면을 «해석» 하지 않습니다. 사람이 누른 선·치수·글자의 «값» 만 돌려줍니다.
 *   선·호·폴리선 → 길이 · 닫힌 폴리선·원·해치 → 면적 · 치수선 → 보이는 치수 값 · 글자 → 글자
 * ■ 브라우저 안에서만 읽습니다(일꾼: 골조도면.worker.js). 파일은 어디로도 가지 않습니다.
 * ■ 길이는 «정확하게» 셉니다 — 호·볼록 폴리선은 반지름×각도로(그림용 토막으로 재지 않음).
 *   다만 블록을 가로·세로 다른 배율로 넣은 것(찌그러진 호)은 그림 토막으로 잽니다.
 * ■ 좌표는 double 로 셈하고, 도면 가운데를 빼서 돌려줍니다(TM 좌표 30만 m 도 떨리지 않게).
 *
 * 읽는 뼈대(쌍 읽기·OCS·스플라인)는 dxf3d.js, 글자 다듬기는 dxfplot.js 것을 그대로 씁니다.
 */
import { reader, ocs, mul, I3, unesc, num, bspline, aciRgb } from './dxf3d.js'
import { cadText, mtextLines } from './dxfplot.js'

const D2R = Math.PI / 180
const MAX_V = 6_000_000

/** 도형 종류 (E.t) */
export const 종류 = { 선: 1, 폴리선: 2, 닫힌폴리선: 3, 호: 4, 원: 5, 치수: 6, 해치: 7, 곡선: 8, 글자: 9, 채움: 10 }
export const 종류이름 = { 1: '선', 2: '폴리선', 3: '닫힌 폴리선', 4: '호', 5: '원', 6: '치수', 7: '해치', 8: '곡선', 9: '글자', 10: '채움' }

class Grow {
  constructor(T, n = 4096) { this.T = T; this.a = new T(n); this.n = 0 }
  need(k) { if (this.n + k <= this.a.length) return; let m = this.a.length * 2; while (m < this.n + k) m *= 2; const b = new this.T(m); b.set(this.a); this.a = b }
  push(v) { this.need(1); this.a[this.n++] = v }
  push2(x, y) { this.need(2); this.a[this.n++] = x; this.a[this.n++] = y }
  done() { return this.a.slice(0, this.n) }
}

/** 치수 글자에서 숫자 하나 — 「6,000」「L=6000」「6000(2@3000)」 → 6000 */
export function 치수숫자(s) {
  const t = String(s || '').replace(/\\[A-Za-z][^;]*;/g, '').replace(/[{}]/g, '')
  const m = t.replace(/(\d),(?=\d{3}\b)/g, '$1').match(/-?\d+(?:\.\d+)?/)
  return m ? parseFloat(m[0]) : NaN
}

/**
 * DXF 글자 → 찍기용 모델
 * @returns {{E, Q, P, T, I, layers, box, ox, oy, units, stats}}
 */
export function 도면읽기(text, onProgress) {
  const R = reader(text)
  const stats = { ents: 0, verts: 0, capped: false, skipped: {}, hidden: 0, ver: '' }
  const skip = (k) => { stats.skipped[k] = (stats.skipped[k] || 0) + 1 }
  const layers = new Map()        // 대문자 이름 → {i, name, rgb, hide}
  const layerList = []
  const blocks = new Map()
  const header = { insunits: 0 }

  // 도형(엔티티) 한 개마다
  const Et = new Grow(Uint8Array), Ely = new Grow(Uint16Array), Ergb = new Grow(Uint32Array)
  const Elen = new Grow(Float64Array), Earea = new Grow(Float64Array), Eval = new Grow(Float64Array), Eins = new Grow(Int32Array)
  // 조각(그림 토막 묶음) — 도형 하나가 조각 여러 개일 수 있음(치수·해치)
  const Qe = new Grow(Uint32Array), Q0 = new Grow(Uint32Array), Qn = new Grow(Uint32Array)
  const PX = new Grow(Float64Array, 1 << 16)
  // 글자
  const Ts = [], Tx = new Grow(Float64Array), Ty = new Grow(Float64Array), Th = new Grow(Float64Array), Ta = new Grow(Float64Array), Te = new Grow(Int32Array)
  const inserts = []

  const P = (M, x, y, z) => M === I3 ? [x, y] : [M[0] * x + M[1] * y + M[2] * z + M[3], M[4] * x + M[5] * y + M[6] * z + M[7]]
  function g1(g, c, d = 0) { for (const [k, v] of g) if (k === c) return num(v); return d }
  function has(g, c) { for (const [k] of g) if (k === c) return true; return false }
  function gs(g, c, d = '') { for (const [k, v] of g) if (k === c) return v.trim(); return d }
  function ext(g) { return ocs(g1(g, 210, 0), g1(g, 220, 0), g1(g, 230, 1)) }
  /** 변환의 배율 — 고른(닮음) 변환이면 그 배율, 아니면 null */
  function 배율(M) {
    if (M === I3) return 1
    const ax = M[0], ay = M[4], bx = M[1], by = M[5]
    const la = Math.hypot(ax, ay), lb = Math.hypot(bx, by)
    if (!(la > 0 && lb > 0)) return null
    if (Math.abs(la - lb) > 1e-9 * Math.max(la, lb)) return null
    if (Math.abs(ax * bx + ay * by) > 1e-9 * la * lb) return null
    return la
  }

  function 새도형(t, ly, rgb, ins) {
    const i = Et.n
    Et.push(t); Ely.push(ly); Ergb.push((rgb[0] << 16) | (rgb[1] << 8) | rgb[2])
    Elen.push(NaN); Earea.push(NaN); Eval.push(NaN); Eins.push(ins)
    return i
  }
  function 조각(e, M, pts) {        // pts: [[x,y,z]…] 엔티티 좌표
    const n = pts.length
    if (n < 2) return 0
    if (stats.verts + n > MAX_V) { stats.capped = true; return 0 }
    const st = PX.n >> 1
    let cnt = 0, lx = NaN, ly = NaN
    for (let i = 0; i < n; i++) {
      const q = pts[i]
      const w = P(M, q[0], q[1], q[2] || 0)
      if (!Number.isFinite(w[0] + w[1])) continue
      if (w[0] === lx && w[1] === ly) continue
      PX.push2(w[0], w[1]); lx = w[0]; ly = w[1]; cnt++
    }
    if (cnt < 2) { PX.n = st * 2; return 0 }
    Qe.push(e); Q0.push(st); Qn.push(cnt)
    stats.verts += cnt
    return cnt
  }
  /** 마지막으로 넣은 조각(들)의 길이·면적 — 그림 토막으로 */
  function 토막길이(qFrom) {
    let L = 0
    for (let q = qFrom; q < Qe.n; q++) {
      const s = Q0.a[q] * 2, n = Qn.a[q]
      for (let k = 1; k < n; k++) L += Math.hypot(PX.a[s + k * 2] - PX.a[s + k * 2 - 2], PX.a[s + k * 2 + 1] - PX.a[s + k * 2 - 1])
    }
    return L
  }
  function 토막면적(q) {
    const s = Q0.a[q] * 2, n = Qn.a[q]
    let A = 0
    for (let k = 0; k < n; k++) {
      const j = (k + 1) % n
      A += PX.a[s + k * 2] * PX.a[s + j * 2 + 1] - PX.a[s + j * 2] * PX.a[s + k * 2 + 1]
    }
    return A / 2
  }

  /* ── 모양 도우미 ── */
  function bulgeTo(a, c, bulge, z, arr) {
    arr.push([a[0], a[1], z])
    if (!bulge) return
    const th = 4 * Math.atan(bulge)
    const dx = c[0] - a[0], dy = c[1] - a[1]
    const d = Math.hypot(dx, dy)
    if (d < 1e-12) return
    const r = d / (2 * Math.sin(th / 2))
    const mx = (a[0] + c[0]) / 2, my = (a[1] + c[1]) / 2
    const h = r * Math.cos(th / 2)
    const cx = mx - (dy / d) * h, cy = my + (dx / d) * h
    const a0 = Math.atan2(a[1] - cy, a[0] - cx)
    const n = Math.max(2, Math.min(90, Math.ceil(Math.abs(th) / (Math.PI / 45))))
    const R2 = Math.abs(r)
    for (let i = 1; i < n; i++) { const t = a0 + (th * i) / n; arr.push([cx + R2 * Math.cos(t), cy + R2 * Math.sin(t), z]) }
  }
  /** 볼록 토막 하나의 참 길이 */
  function bulgeLen(a, c, bulge) {
    const d = Math.hypot(c[0] - a[0], c[1] - a[1])
    if (!bulge || d < 1e-12) return d
    const th = 4 * Math.atan(bulge)
    return Math.abs(th * d / (2 * Math.sin(th / 2)))
  }
  function arcPts(cx, cy, cz, r, s, e) {
    let sw = e - s
    while (sw <= 0) sw += Math.PI * 2
    const n = Math.max(8, Math.min(180, Math.ceil((sw / (Math.PI * 2)) * 180)))
    const a = []
    for (let i = 0; i <= n; i++) { const t = s + (sw * i) / n; a.push([cx + r * Math.cos(t), cy + r * Math.sin(t), cz]) }
    return { pts: a, sw }
  }

  /* ── 층 ── */
  const L0 = { i: 0, name: '0', rgb: [255, 255, 255], hide: false }
  function layerOf(name) {
    const u = name.toUpperCase()
    let L = layers.get(u)
    if (!L) { L = { i: layerList.length, name, rgb: [255, 255, 255], hide: false }; layers.set(u, L); layerList.push(L) }
    return L
  }
  function 색(g, L, cx) {
    let tc = null, ci = 256
    for (const [k, v] of g) { if (k === 420) tc = parseInt(v, 10); else if (k === 62) ci = parseInt(v, 10) }
    if (tc !== null && Number.isFinite(tc)) return [(tc >> 16) & 255, (tc >> 8) & 255, tc & 255]
    if (!Number.isFinite(ci) || ci === 256) return L.rgb
    if (ci === 0) return cx.rgb || [255, 255, 255]
    return aciRgb(ci)
  }

  /* ── 글자 ── */
  function 글자넣기(e, s, M, g, isM) {
    const O = ext(g); const MM = O ? mul(M, O) : M
    const h0 = g1(g, 40, 2.5)
    let x = g1(g, 10), y = g1(g, 20), z = g1(g, 30)
    const hj = g1(g, 72, 0), vj = g1(g, 73, 0)
    if (!isM && (hj !== 0 || vj !== 0) && has(g, 11)) { x = g1(g, 11); y = g1(g, 21); z = g1(g, 31) }
    const p = P(MM, x, y, z)
    let a
    if (isM && has(g, 11)) { const d = [g1(g, 11), g1(g, 21)]; const w = M === I3 ? d : [M[0] * d[0] + M[1] * d[1], M[4] * d[0] + M[5] * d[1]]; a = Math.atan2(w[1], w[0]) }
    else { const r = g1(g, 50, 0) * D2R; const w = MM === I3 ? [Math.cos(r), Math.sin(r)] : [MM[0] * Math.cos(r) + MM[1] * Math.sin(r), MM[4] * Math.cos(r) + MM[5] * Math.sin(r)]; a = Math.atan2(w[1], w[0]) }
    const sc = MM === I3 ? 1 : Math.hypot(MM[1], MM[5]) || 1
    Ts.push(s); Tx.push(p[0]); Ty.push(p[1]); Th.push(h0 * sc); Ta.push(a); Te.push(e)
    // 정렬: 가운데·오른쪽 정렬이면 글자 상자를 옮겨야 누를 수 있음 → 대충 폭으로 옮김
    const w = s.length * h0 * sc * 0.9
    let dx = 0
    if (!isM) { if (hj === 1 || hj === 4) dx = -w / 2; else if (hj === 2) dx = -w; else if (hj === 3 || hj === 5) dx = 0 }
    else { const at = g1(g, 71, 1); const col = (at - 1) % 3; if (col === 1) dx = -w / 2; else if (col === 2) dx = -w }
    if (dx) { Tx.a[Tx.n - 1] += dx * Math.cos(a); Ty.a[Ty.n - 1] += dx * Math.sin(a) }
    let dy = 0
    if (isM) { const at = g1(g, 71, 1); const row = Math.floor((at - 1) / 3); if (row === 0) dy = -h0 * sc; else if (row === 1) dy = -h0 * sc / 2 }
    else if (vj === 2) dy = -h0 * sc / 2
    else if (vj === 3) dy = -h0 * sc
    if (dy) { Tx.a[Tx.n - 1] += -dy * Math.sin(a); Ty.a[Ty.n - 1] += dy * Math.cos(a) }
  }

  /* ── 읽기 ── */
  let pair = R.next()
  const readEnt = (type) => { const g = []; pair = R.next(); while (pair && pair[0] !== 0) { g.push(pair); pair = R.next() } return { t: type, g } }
  const readFull = () => {
    const type = pair[1].trim()
    const e = readEnt(type)
    if (type === 'POLYLINE') {
      e.v = []
      while (pair && pair[0] === 0 && pair[1].trim() === 'VERTEX') e.v.push(readEnt('VERTEX'))
      if (pair && pair[0] === 0 && pair[1].trim() === 'SEQEND') readEnt('SEQEND')
    } else if (type === 'INSERT' && e.g.some(([c, v]) => c === 66 && num(v) === 1)) {
      e.att = []
      while (pair && pair[0] === 0 && pair[1].trim() === 'ATTRIB') e.att.push(readEnt('ATTRIB'))
      if (pair && pair[0] === 0 && pair[1].trim() === 'SEQEND') readEnt('SEQEND')
    }
    return e
  }

  /** 치수 블록 안의 보이는 글자 */
  function 치수글자(bl) {
    for (const s of bl.ents) {
      if (s.t === 'MTEXT') { let raw = ''; for (const [k, v] of s.g) if (k === 3) raw += v; raw += gs(s.g, 1); return mtextLines(raw).join(' ') }
      if (s.t === 'TEXT') return cadText(unesc(gs(s.g, 1)))
    }
    return ''
  }

  function draw(e, M, cx, depth, top) {
    const g = e.g
    if (g1(g, 67, 0) === 1) { skip('배치(종이) 공간'); return }
    if (g1(g, 60, 0) === 1) return
    let lyName = gs(g, 8, '0')
    if (lyName === '0' && cx.ly) lyName = cx.ly
    const L = layerOf(lyName)
    const t = e.t
    if (L.hide && t !== 'INSERT') { stats.hidden++; return }
    stats.ents++
    const rgb = 색(g, L, cx)
    const ins = cx.ins ?? -1
    switch (t) {
      case 'LINE': {
        const a = [g1(g, 10), g1(g, 20), g1(g, 30)], b = [g1(g, 11), g1(g, 21), g1(g, 31)]
        const id = 새도형(종류.선, L.i, rgb, ins)
        const q = Qe.n
        if (!조각(id, M, [a, b])) return
        Elen.a[id] = 토막길이(q)
        return
      }
      case 'LWPOLYLINE': case 'POLYLINE': {
        let vs = [], closed = false, z = 0, MM = M
        if (t === 'LWPOLYLINE') {
          const O = ext(g); MM = O ? mul(M, O) : M
          z = g1(g, 38, 0)
          let cur = null
          for (const [k, v] of g) {
            if (k === 10) { cur = [num(v), 0, 0]; vs.push(cur) } else if (k === 20 && cur) cur[1] = num(v); else if (k === 42 && cur) cur[2] = num(v)
          }
          closed = (g1(g, 70, 0) & 1) === 1
        } else {
          const fl = g1(g, 70, 0)
          if (fl & (16 | 64)) { skip('메쉬'); return }
          const V = (e.v || []).filter((x) => !(g1(x.g, 70, 0) & 16))
          closed = (fl & 1) === 1
          if (fl & 8) vs = V.map((x) => [g1(x.g, 10), g1(x.g, 20), 0, g1(x.g, 30)])
          else { const O = ext(g); MM = O ? mul(M, O) : M; z = g1(g, 30, 0); vs = V.map((x) => [g1(x.g, 10), g1(x.g, 20), g1(x.g, 42, 0)]) }
        }
        if (vs.length < 2) return
        // 닫힌 폴리선인데 끝점이 처음과 겹치면 하나 뺌
        if (closed && vs.length > 2) { const a = vs[0], b = vs[vs.length - 1]; if (Math.abs(a[0] - b[0]) < 1e-9 && Math.abs(a[1] - b[1]) < 1e-9) vs = vs.slice(0, -1) }
        const pts = []
        let len = 0
        for (let i = 0; i < vs.length; i++) {
          const a = vs[i], c = vs[i + 1] || (closed ? vs[0] : null)
          if (c) { bulgeTo(a, c, a[2], a[3] ?? z, pts); len += bulgeLen(a, c, a[2]) } else pts.push([a[0], a[1], a[3] ?? z])
        }
        if (closed) pts.push([vs[0][0], vs[0][1], vs[0][3] ?? z])
        const id = 새도형(closed ? 종류.닫힌폴리선 : 종류.폴리선, L.i, rgb, ins)
        const q = Qe.n
        if (!조각(id, MM, pts)) return
        const s = 배율(MM)
        Elen.a[id] = s !== null ? len * s : 토막길이(q)
        if (closed) Earea.a[id] = Math.abs(토막면적(q))
        return
      }
      case 'CIRCLE': case 'ARC': {
        const O = ext(g); const MM = O ? mul(M, O) : M
        const r = g1(g, 40)
        if (!(r > 0)) return
        const s0 = t === 'ARC' ? g1(g, 50) * D2R : 0
        const e0 = t === 'ARC' ? g1(g, 51) * D2R : Math.PI * 2
        const { pts, sw } = arcPts(g1(g, 10), g1(g, 20), g1(g, 30), r, s0, t === 'ARC' ? e0 : s0 + Math.PI * 2)
        const id = 새도형(t === 'ARC' ? 종류.호 : 종류.원, L.i, rgb, ins)
        const q = Qe.n
        if (!조각(id, MM, pts)) return
        const s = 배율(MM)
        Elen.a[id] = s !== null ? r * (t === 'ARC' ? sw : Math.PI * 2) * s : 토막길이(q)
        if (t === 'CIRCLE') Earea.a[id] = s !== null ? Math.PI * r * r * s * s : Math.abs(토막면적(q))
        return
      }
      case 'ELLIPSE': case 'SPLINE': {
        let pts = []
        if (t === 'ELLIPSE') {
          const c = [g1(g, 10), g1(g, 20), g1(g, 30)], mj = [g1(g, 11), g1(g, 21), g1(g, 31)]
          const Nn = [g1(g, 210, 0), g1(g, 220, 0), g1(g, 230, 1)]
          const ratio = g1(g, 40, 1)
          const mn = [Nn[1] * mj[2] - Nn[2] * mj[1], Nn[2] * mj[0] - Nn[0] * mj[2], Nn[0] * mj[1] - Nn[1] * mj[0]]
          const Ln = Math.hypot(...mn) || 1, Lm = Math.hypot(...mj)
          for (let k = 0; k < 3; k++) mn[k] = (mn[k] / Ln) * Lm * ratio
          const s = g1(g, 41, 0), en = g1(g, 42, Math.PI * 2)
          let sw = en - s
          while (sw <= 0) sw += Math.PI * 2
          const n = Math.max(24, Math.ceil((sw / (Math.PI * 2)) * 360))
          for (let i = 0; i <= n; i++) { const u = s + (sw * i) / n, cs = Math.cos(u), sn = Math.sin(u); pts.push([c[0] + cs * mj[0] + sn * mn[0], c[1] + cs * mj[1] + sn * mn[1], c[2] + cs * mj[2] + sn * mn[2]]) }
        } else {
          const deg = g1(g, 71, 3)
          const knots = [], ctrl = [], fit = [], w = []
          let cur = null, fcur = null
          for (const [k, v] of g) {
            if (k === 40) knots.push(num(v)); else if (k === 41) w.push(num(v))
            else if (k === 10) { cur = [num(v), 0, 0]; ctrl.push(cur) } else if (k === 20 && cur) cur[1] = num(v); else if (k === 30 && cur) cur[2] = num(v)
            else if (k === 11) { fcur = [num(v), 0, 0]; fit.push(fcur) } else if (k === 21 && fcur) fcur[1] = num(v); else if (k === 31 && fcur) fcur[2] = num(v)
          }
          if (ctrl.length > deg && knots.length === ctrl.length + deg + 1) pts = bspline(deg, ctrl, knots, w.length === ctrl.length ? w : null) || []
          if (!pts.length) pts = fit.length >= 2 ? fit : ctrl
        }
        const id = 새도형(종류.곡선, L.i, rgb, ins)
        const q = Qe.n
        if (!조각(id, M, pts)) return
        Elen.a[id] = 토막길이(q)
        const a = pts[0], b = pts[pts.length - 1]
        if (pts.length > 3 && Math.hypot(a[0] - b[0], a[1] - b[1]) < 1e-6 * (Elen.a[id] || 1)) Earea.a[id] = Math.abs(토막면적(q))
        return
      }
      case 'SOLID': case 'TRACE': {
        const O = ext(g); const MM = O ? mul(M, O) : M
        const q4 = [0, 1, 3, 2].map((k) => [g1(g, 10 + k), g1(g, 20 + k), g1(g, 30, 0)])
        const id = 새도형(종류.채움, L.i, rgb, ins)
        const q = Qe.n
        if (!조각(id, MM, q4.concat([q4[0]]))) return
        Elen.a[id] = 토막길이(q); Earea.a[id] = Math.abs(토막면적(q))
        return
      }
      case 'LEADER': {
        const pts = []
        let cur = null
        for (const [k, v] of g) { if (k === 10) { cur = [num(v), 0, 0]; pts.push(cur) } else if (k === 20 && cur) cur[1] = num(v) }
        const id = 새도형(종류.폴리선, L.i, rgb, ins)
        const q = Qe.n
        if (조각(id, M, pts)) Elen.a[id] = 토막길이(q)
        return
      }
      case 'HATCH': {
        const loops = 해치경계(g)
        if (!loops.length) return
        const O = ext(g); const MM = O ? mul(M, O) : M
        const id = 새도형(종류.해치, L.i, rgb, ins)
        const areas = []
        for (const Lp of loops) { const q = Qe.n; if (조각(id, MM, Lp.concat([Lp[0]]))) areas.push(Math.abs(토막면적(q))) }
        if (!areas.length) return
        // 가장 큰 고리가 바깥, 나머지는 구멍으로 봅니다
        areas.sort((a, b) => b - a)
        Earea.a[id] = areas[0] - areas.slice(1).reduce((s2, x) => s2 + x, 0)
        return
      }
      case 'TEXT': case 'MTEXT': case 'ATTRIB': {
        if (t === 'ATTRIB' && (g1(g, 70, 0) & 1)) return
        let s
        if (t === 'MTEXT') { let raw = ''; for (const [k, v] of g) if (k === 3) raw += v; raw += gs(g, 1); s = mtextLines(raw).join(' ') }
        else s = cadText(unesc(gs(g, 1)))
        s = s.trim()
        if (!s) return
        const id = 새도형(종류.글자, L.i, rgb, ins)
        글자넣기(id, s, M, g, t === 'MTEXT')
        return
      }
      case 'DIMENSION': {
        const name = gs(g, 2)
        const bl = blocks.get(name.toUpperCase())
        const id = 새도형(종류.치수, L.i, rgb, ins)
        let v = NaN
        const ov = cadText(unesc(gs(g, 1)))
        if (ov && !ov.includes('<>')) v = 치수숫자(ov)
        if (!Number.isFinite(v) && bl) v = 치수숫자(치수글자(bl))
        if (!Number.isFinite(v)) v = g1(g, 42, NaN)
        Eval.a[id] = v
        if (bl && depth < 16) {
          const inCx = { ...cx, ly: lyName, rgb, 치수: id }
          for (const s of bl.ents) 치수조각(s, M, inCx, id, depth + 1)
        } else {
          // 블록이 없으면 정의점끼리 선 하나
          조각(id, M, [[g1(g, 13), g1(g, 23), 0], [g1(g, 14), g1(g, 24), 0]])
        }
        return
      }
      case 'INSERT': {
        const name = gs(g, 2)
        const bl = blocks.get(name.toUpperCase())
        let myIns = ins
        if (top) { myIns = inserts.length; inserts.push({ name, x: 0, y: 0, ly: L.i }) }
        if (e.att) for (const a of e.att) draw(a, M, { ...cx, ly: lyName, rgb, ins: myIns }, depth + 1, false)
        if (!bl) { skip('없는 블록'); return }
        if (depth > 16) return
        const O = ext(g)
        const sx = g1(g, 41, 1), sy = g1(g, 42, 1), sz = g1(g, 43, 1)
        const rot = g1(g, 50, 0) * D2R
        const cs = Math.cos(rot), sn = Math.sin(rot)
        const ix = g1(g, 10), iy = g1(g, 20), iz = g1(g, 30)
        const [bx, by, bz] = bl.base
        const cols = Math.max(1, g1(g, 70, 1)), rows = Math.max(1, g1(g, 71, 1))
        const csp = g1(g, 44, 0), rsp = g1(g, 45, 0)
        if (top) { const w = P(M, ix, iy, iz); inserts[myIns].x = w[0]; inserts[myIns].y = w[1] }
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
          const ox = c * csp, oy = r * rsp
          let Lm = [cs * sx, -sn * sy, 0, cs * (ox - sx * bx) - sn * (oy - sy * by) + ix,
            sn * sx, cs * sy, 0, sn * (ox - sx * bx) + cs * (oy - sy * by) + iy,
            0, 0, sz, -sz * bz + iz]
          if (O) Lm = mul(O, Lm)
          const X = mul(M, Lm)
          for (const s of bl.ents) { draw(s, X, { ...cx, ly: lyName, rgb, ins: myIns }, depth + 1, false); if (stats.capped) return }
        }
        return
      }
      default: skip(t); stats.ents--
    }
  }

  /** 치수 블록 속 도형 → 치수 도형(id)의 조각으로 (글자는 글자로도 넣음) */
  function 치수조각(s, M, cx, id, depth) {
    const g = s.g
    const t = s.t
    if (t === 'LINE') { 조각(id, M, [[g1(g, 10), g1(g, 20), g1(g, 30)], [g1(g, 11), g1(g, 21), g1(g, 31)]]); return }
    if (t === 'SOLID') { const q4 = [0, 1, 3, 2].map((k) => [g1(g, 10 + k), g1(g, 20 + k), 0]); 조각(id, M, q4.concat([q4[0]])); return }
    if (t === 'ARC' || t === 'CIRCLE') {
      const r = g1(g, 40)
      if (!(r > 0)) return
      const s0 = t === 'ARC' ? g1(g, 50) * D2R : 0, e0 = t === 'ARC' ? g1(g, 51) * D2R : Math.PI * 2
      조각(id, M, arcPts(g1(g, 10), g1(g, 20), 0, r, s0, t === 'ARC' ? e0 : s0 + Math.PI * 2).pts)
      return
    }
    if (t === 'LWPOLYLINE') {
      const vs = []
      let cur = null
      for (const [k, v] of g) { if (k === 10) { cur = [num(v), 0, 0]; vs.push(cur) } else if (k === 20 && cur) cur[1] = num(v); else if (k === 42 && cur) cur[2] = num(v) }
      const pts = []
      for (let i = 0; i < vs.length; i++) { const a = vs[i], c = vs[i + 1]; if (c) bulgeTo(a, c, a[2], 0, pts); else pts.push([a[0], a[1], 0]) }
      조각(id, M, pts)
      return
    }
    if (t === 'MTEXT' || t === 'TEXT') {
      let str
      if (t === 'MTEXT') { let raw = ''; for (const [k, v] of g) if (k === 3) raw += v; raw += gs(g, 1); str = mtextLines(raw).join(' ') }
      else str = cadText(unesc(gs(g, 1)))
      if (str.trim()) 글자넣기(id, str.trim(), M, g, t === 'MTEXT')
      return
    }
    if (t === 'INSERT' && depth < 16) {
      const bl = blocks.get(gs(g, 2).toUpperCase())
      if (!bl) return
      const sx = g1(g, 41, 1), sy = g1(g, 42, 1)
      const rot = g1(g, 50, 0) * D2R
      const cs = Math.cos(rot), sn = Math.sin(rot)
      const ix = g1(g, 10), iy = g1(g, 20)
      const [bx, by] = bl.base
      const Lm = [cs * sx, -sn * sy, 0, cs * (-sx * bx) - sn * (-sy * by) + ix, sn * sx, cs * sy, 0, sn * (-sx * bx) + cs * (-sy * by) + iy, 0, 0, 1, 0]
      const X = mul(M, Lm)
      for (const s2 of bl.ents) 치수조각(s2, X, cx, id, depth + 1)
    }
  }

  function 해치경계(g) {
    const loops = []
    let i = 0
    const N = g.length
    while (i < N && g[i][0] !== 91) i++
    const npath = i < N ? num(g[i][1]) : 0
    i++
    const at = (c) => (i < N && g[i][0] === c ? num(g[i++][1]) : null)
    const want = (c) => { while (i < N && g[i][0] !== c) i++; return i < N ? num(g[i++][1]) : 0 }
    const z = g1(g, 30, 0)
    for (let pth = 0; pth < npath && i < N; pth++) {
      const flag = want(92)
      const pts = []
      if (flag & 2) {
        const hb = at(72) || 0
        at(73)
        const nv = want(93)
        const vs = []
        for (let k = 0; k < nv && i < N; k++) { const x = want(10), y = want(20); const b = hb ? (g[i] && g[i][0] === 42 ? num(g[i++][1]) : 0) : 0; vs.push([x, y, b]) }
        for (let k = 0; k < vs.length; k++) bulgeTo(vs[k], vs[(k + 1) % vs.length], vs[k][2], z, pts)
      } else {
        const ne = want(93)
        for (let k = 0; k < ne && i < N; k++) {
          const et = want(72)
          if (et === 1) { const x0 = want(10), y0 = want(20), x1 = want(11), y1 = want(21); pts.push([x0, y0, z], [x1, y1, z]) }
          else if (et === 2) {
            const x = want(10), y = want(20), r = want(40), s = want(50), e = want(51), ccw = at(73)
            let a = ccw === 0 ? arcPts(x, y, z, r, -e * D2R, -s * D2R).pts.reverse() : arcPts(x, y, z, r, s * D2R, e * D2R).pts
            for (const q of a) pts.push(q)
          } else if (et === 3) {
            const x = want(10), y = want(20), mx = want(11), my = want(21), ra = want(40), s = want(50), e = want(51), ccw = at(73)
            const ang = Math.atan2(my, mx), A = Math.hypot(mx, my), B = A * ra
            let s0 = s * D2R, e0 = e * D2R
            if (ccw === 0) { const tt = s0; s0 = -e0; e0 = -tt }
            let sw = e0 - s0
            while (sw <= 0) sw += Math.PI * 2
            const n = Math.max(12, Math.ceil((sw / (Math.PI * 2)) * 180))
            const seg = []
            for (let q = 0; q <= n; q++) { const u = s0 + (sw * q) / n; const ex = A * Math.cos(u), ey = B * Math.sin(u); seg.push([x + ex * Math.cos(ang) - ey * Math.sin(ang), y + ex * Math.sin(ang) + ey * Math.cos(ang), z]) }
            if (ccw === 0) seg.reverse()
            for (const q of seg) pts.push(q)
          } else if (et === 4) {
            const deg = want(94); at(73); at(74)
            const nk = want(95), nc = want(96)
            const kn = [], cp = [], wt = []
            for (let q = 0; q < nk && i < N; q++) kn.push(want(40))
            for (let q = 0; q < nc && i < N; q++) { const x = want(10), y = want(20); cp.push([x, y, z]); if (g[i] && g[i][0] === 42) wt.push(num(g[i++][1])) }
            const nf = g[i] && g[i][0] === 97 && g[i + 1] && g[i + 1][0] === 11 ? num(g[i++][1]) : 0
            const fit = []
            for (let q = 0; q < nf && i < N; q++) { const x = want(11), y = want(21); fit.push([x, y, z]) }
            let sp = null
            if (cp.length > deg && kn.length === cp.length + deg + 1) sp = bspline(deg, cp, kn, wt.length === cp.length ? wt : null)
            for (const q of sp || (fit.length >= 2 ? fit : cp)) pts.push([q[0], q[1], z])
          }
        }
      }
      if (i < N && g[i][0] === 97) { const ns = num(g[i++][1]); for (let q = 0; q < ns && i < N && g[i][0] === 330; q++) i++ }
      if (pts.length >= 3) loops.push(pts)
    }
    return loops
  }

  /* ── 섹션 ── */
  let last = 0
  while (pair) {
    if (pair[0] === 0 && pair[1].trim() === 'SECTION') {
      pair = R.next()
      const sec = pair ? pair[1].trim() : ''
      pair = R.next()
      if (sec === 'HEADER') {
        let key = ''
        while (pair && !(pair[0] === 0 && pair[1].trim() === 'ENDSEC')) {
          if (pair[0] === 9) key = pair[1].trim()
          else if (key === '$ACADVER' && pair[0] === 1) stats.ver = pair[1].trim()
          else if (key === '$INSUNITS' && pair[0] === 70) header.insunits = parseInt(pair[1], 10)
          pair = R.next()
        }
      } else if (sec === 'TABLES') {
        let table = ''
        while (pair && !(pair[0] === 0 && pair[1].trim() === 'ENDSEC')) {
          if (pair[0] === 0 && pair[1].trim() === 'TABLE') { pair = R.next(); table = pair && pair[0] === 2 ? pair[1].trim() : ''; pair = R.next(); continue }
          if (pair[0] === 0 && pair[1].trim() === 'ENDTAB') { table = ''; pair = R.next(); continue }
          if (pair[0] === 0 && table === 'LAYER' && pair[1].trim() === 'LAYER') {
            const e = readEnt('LAYER')
            const name = unesc(gs(e.g, 2))
            const ci = g1(e.g, 62, 7), fl = g1(e.g, 70, 0)
            let tc = null
            for (const [k, v] of e.g) if (k === 420) tc = parseInt(v, 10)
            const L = layerOf(name)
            L.rgb = tc !== null && Number.isFinite(tc) ? [(tc >> 16) & 255, (tc >> 8) & 255, tc & 255] : aciRgb(ci)
            L.hide = ci < 0 || (fl & 1) === 1 || name.toUpperCase() === 'DEFPOINTS'
            continue
          }
          pair = R.next()
        }
      } else if (sec === 'BLOCKS') {
        let cur = null
        while (pair && !(pair[0] === 0 && pair[1].trim() === 'ENDSEC')) {
          if (pair[0] !== 0) { pair = R.next(); continue }
          const t = pair[1].trim()
          if (t === 'BLOCK') { const e = readEnt('BLOCK'); cur = { name: unesc(gs(e.g, 2)), base: [g1(e.g, 10), g1(e.g, 20), g1(e.g, 30)], ents: [] }; continue }
          if (t === 'ENDBLK') { if (cur) blocks.set(cur.name.toUpperCase(), cur); cur = null; readEnt('ENDBLK'); continue }
          const e = readFull()
          if (cur && !/^\*paper_space/i.test(cur.name)) { for (const kv of e.g) if (kv[0] === 8 || kv[0] === 2 || kv[0] === 1 || kv[0] === 3) kv[1] = unesc(kv[1]); cur.ents.push(e) }
        }
      } else if (sec === 'ENTITIES') {
        while (pair && !(pair[0] === 0 && pair[1].trim() === 'ENDSEC')) {
          if (pair[0] !== 0) { pair = R.next(); continue }
          const e = readFull()
          for (const kv of e.g) if (kv[0] === 8 || kv[0] === 2) kv[1] = unesc(kv[1])
          if (!stats.capped) draw(e, I3, { ins: -1 }, 0, true)
          if (onProgress && R.pos - last > 2_000_000) { last = R.pos; onProgress(R.pos / R.len) }
        }
      } else {
        while (pair && !(pair[0] === 0 && pair[1].trim() === 'ENDSEC')) pair = R.next()
      }
    }
    pair = R.next()
  }
  if (!layerList.length) layerOf('0')

  /* ── 묶기: 가운데를 빼고 도형마다 상자 ── */
  const xy = PX.done()
  const tx = Tx.done(), ty = Ty.done()
  const box = 범위(xy, tx, ty)
  const ox = (box[0] + box[2]) / 2, oy = (box[1] + box[3]) / 2
  for (let k = 0; k < xy.length; k += 2) { xy[k] -= ox; xy[k + 1] -= oy }
  for (let k = 0; k < tx.length; k++) { tx[k] -= ox; ty[k] -= oy }
  for (const I of inserts) { I.x -= ox; I.y -= oy }
  const E = { t: Et.done(), ly: Ely.done(), rgb: Ergb.done(), len: Elen.done(), area: Earea.done(), val: Eval.done(), ins: Eins.done() }
  const Q = { e: Qe.done(), p0: Q0.done(), pn: Qn.done() }
  const T = { s: Ts, x: tx, y: ty, h: Th.done(), a: Ta.done(), e: Te.done() }
  return {
    E, Q, P: xy, T, I: inserts,
    layers: layerList.map((L) => ({ name: L.name, rgb: L.rgb, hide: L.hide })),
    box: [box[0] - ox, box[1] - oy, box[2] - ox, box[3] - oy], ox, oy,
    units: header.insunits, stats,
  }
}

/** 튀는 점에 끌리지 않는 범위 (0.2~99.8%) */
function 범위(xy, tx, ty) {
  const n = xy.length >> 1
  const xs = [], ys = []
  const step = Math.max(1, Math.floor(n / 200000))
  for (let i = 0; i < n; i += step) { xs.push(xy[i * 2]); ys.push(xy[i * 2 + 1]) }
  for (let i = 0; i < tx.length; i += Math.max(1, Math.floor(tx.length / 20000))) { xs.push(tx[i]); ys.push(ty[i]) }
  if (!xs.length) return [0, 0, 100, 100]
  xs.sort((p, q) => p - q); ys.sort((p, q) => p - q)
  const q = (arr, f) => arr[Math.min(arr.length - 1, Math.max(0, Math.floor(arr.length * f)))]
  let x0 = q(xs, 0.002), x1 = q(xs, 0.998), y0 = q(ys, 0.002), y1 = q(ys, 0.998)
  const w = x1 - x0 || 1, h = y1 - y0 || 1
  x0 -= w * 0.03; x1 += w * 0.03; y0 -= h * 0.03; y1 += h * 0.03
  return [x0, y0, x1, y1]
}

/* ───────────────────────────── 찾기(누르기) — 화면 쪽에서 씀 */

/** 조각 토막을 칸(격자)에 나눠 담습니다 — 누른 자리 가까운 도형을 빨리 찾으려고 */
export function 찾기판(model) {
  const [x0, y0, x1, y1] = model.box
  const W = x1 - x0 || 1, H = y1 - y0 || 1
  const nseg = model.P.length >> 1
  const n = Math.max(16, Math.min(512, Math.round(Math.sqrt(nseg / 4))))
  const cw = W / n, ch = H / n
  const cells = new Map()
  const put = (c, q, k) => { let a = cells.get(c); if (!a) { a = []; cells.set(c, a) } a.push(q, k) }
  const { Q, P } = model
  for (let q = 0; q < Q.e.length; q++) {
    const s = Q.p0[q], m = Q.pn[q]
    for (let k = 0; k < m - 1; k++) {
      const i = (s + k) * 2
      const ax = P[i], ay = P[i + 1], bx = P[i + 2], by = P[i + 3]
      const c0 = Math.max(0, Math.min(n - 1, Math.floor((Math.min(ax, bx) - x0) / cw)))
      const c1 = Math.max(0, Math.min(n - 1, Math.floor((Math.max(ax, bx) - x0) / cw)))
      const r0 = Math.max(0, Math.min(n - 1, Math.floor((Math.min(ay, by) - y0) / ch)))
      const r1 = Math.max(0, Math.min(n - 1, Math.floor((Math.max(ay, by) - y0) / ch)))
      if ((c1 - c0 + 1) * (r1 - r0 + 1) > 4096) { put(-1, q, k); continue }   // 아주 긴 토막 — 따로
      for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) put(r * n + c, q, k)
    }
  }
  return { n, cw, ch, x0, y0, cells }
}

/** 점과 토막 사이 거리 */
function 거리(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay
  const L2 = dx * dx + dy * dy
  let t = L2 > 0 ? ((px - ax) * dx + (py - ay) * dy) / L2 : 0
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(px - ax - t * dx, py - ay - t * dy)
}

/**
 * (x,y) 에서 tol 안의 가장 가까운 도형
 * @param {Set<number>} [끈층] 끈 레이어 번호
 * @param {(e:number)=>boolean} [거르기]
 */
export function 가까운도형(model, 판, x, y, tol, 끈층, 거르기) {
  const { Q, P, E } = model
  let best = -1, bd = Infinity
  const seen = new Set()
  const look = (arr) => {
    if (!arr) return
    for (let j = 0; j < arr.length; j += 2) {
      const q = arr[j], k = arr[j + 1]
      const e = Q.e[q]
      if (끈층 && 끈층.has(E.ly[e])) continue
      if (거르기 && !거르기(e)) continue
      const key = q * 1e6 + k
      if (seen.has(key)) continue
      seen.add(key)
      const i = (Q.p0[q] + k) * 2
      const d = 거리(x, y, P[i], P[i + 1], P[i + 2], P[i + 3])
      if (d < bd) { bd = d; best = e }
    }
  }
  const c0 = Math.floor((x - tol - 판.x0) / 판.cw), c1 = Math.floor((x + tol - 판.x0) / 판.cw)
  const r0 = Math.floor((y - tol - 판.y0) / 판.ch), r1 = Math.floor((y + tol - 판.y0) / 판.ch)
  for (let r = Math.max(0, r0); r <= Math.min(판.n - 1, r1); r++) for (let c = Math.max(0, c0); c <= Math.min(판.n - 1, c1); c++) look(판.cells.get(r * 판.n + c))
  look(판.cells.get(-1))
  // 글자도 봅니다 (글자 상자 안이면 거리 0)
  const T = model.T
  for (let i = 0; i < T.s.length; i++) {
    const e = T.e[i]
    if (끈층 && 끈층.has(E.ly[e])) continue
    if (거르기 && !거르기(e)) continue
    const h = T.h[i], w = T.s[i].length * h * 0.9
    const ca = Math.cos(T.a[i]), sa = Math.sin(T.a[i])
    const lx = (x - T.x[i]) * ca + (y - T.y[i]) * sa, ly = -(x - T.x[i]) * sa + (y - T.y[i]) * ca
    const dx = lx < 0 ? -lx : lx > w ? lx - w : 0, dy = ly < 0 ? -ly : ly > h ? ly - h : 0
    const d = Math.hypot(dx, dy)
    if (d <= tol && d < bd) { bd = d; best = e }
  }
  return bd <= tol ? best : -1
}

/** 점을 품은 가장 작은 닫힌 도형(닫힌 폴리선·원·해치·채움) */
export function 품은도형(model, x, y, 끈층) {
  const { E, Q, P } = model
  let best = -1, ba = Infinity
  const 조각들 = new Map()
  for (let q = 0; q < Q.e.length; q++) { const e = Q.e[q]; const a = 조각들.get(e); if (a) a.push(q); else 조각들.set(e, [q]) }
  for (const [e, qs] of 조각들) {
    const t = E.t[e]
    if (!(t === 종류.닫힌폴리선 || t === 종류.원 || t === 종류.해치 || t === 종류.채움 || (t === 종류.곡선 && E.area[e] > 0))) continue
    if (끈층 && 끈층.has(E.ly[e])) continue
    const A = E.area[e]
    if (!(A > 0) || A >= ba) continue
    let inside = false
    for (const q of qs) {
      const s = Q.p0[q], n = Q.pn[q]
      for (let k = 0, j = n - 1; k < n; j = k++) {
        const xi = P[(s + k) * 2], yi = P[(s + k) * 2 + 1], xj = P[(s + j) * 2], yj = P[(s + j) * 2 + 1]
        if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
      }
    }
    if (inside) { best = e; ba = A }
  }
  return best
}

/** 도형이 쓰는 조각 번호들 */
export function 조각들(model, e) {
  const out = []
  const { Q } = model
  for (let q = 0; q < Q.e.length; q++) if (Q.e[q] === e) out.push(q)
  return out
}

/** 도형의 글자(글자·치수) */
export function 도형글자(model, e) {
  const T = model.T
  const out = []
  for (let i = 0; i < T.s.length; i++) if (T.e[i] === e) out.push(T.s[i])
  return out.join(' ')
}

/** 도면 단위 → mm 배율. $INSUNITS: 4 mm · 5 cm · 6 m · 1 inch · 2 feet · 0 모름 */
export function 단위배율(units, box) {
  if (units === 4) return { k: 1, 글: 'mm' }
  if (units === 5) return { k: 10, 글: 'cm' }
  if (units === 6) return { k: 1000, 글: 'm' }
  // inch·feet 로 적혀 있어도 국내 도면은 대개 mm 로 그렸습니다(캐드 기본값이 남은 것) — 크기로 짐작합니다
  // 모름: 도면 크기로 짐작 — 건물 평면이 5m 보다 작으면 m 단위로 그린 것
  const w = Math.max(box[2] - box[0], box[3] - box[1])
  return w < 5000 && w > 5 ? { k: 1000, 글: 'm (짐작)' } : { k: 1, 글: 'mm (짐작)' }
}
