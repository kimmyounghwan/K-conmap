/**
 * 🧭 외부참조(XREF) 끼워 넣기 — G132 (2026-10-05)
 *
 * 소장님: 「지우기 버튼 없고, 도면 이상하고, 굉장히 느려, 엑셀받기 하면 엑셀에 도면 물량이 나와야 하는데, 안나와」 → 「고쳐줘」
 * ■ 무엇이 문제였나 — 하수도 평면도(오수계획평면도 · 배수설비계획평면도 · 포장계획평면도 · 지장물매설도)의 본 그림(지형 + 계획 관로)은
 *   «외부참조»(xref-○○.dwg)로 붙어 있어 그 DWG 안에는 도곽 · 글자 · 귀퉁이 위치도만 있습니다. AutoCAD 는 옆 파일을 찾아 그려 주지만,
 *   브라우저는 그 파일을 모릅니다 → 빈 도곽 · 물량 0.
 * ■ 어떻게 — 외부참조 파일(DWG 나 DXF)을 «같이» 넣으면 이름으로 짝을 찾아(경로 · 확장자 빼고 같은 이름),
 *   넣은 자리(이동 · 회전 · 배율)대로 옮기고 XCLIP(자르기) 경계 밖은 잘라 냅니다. 잘린 선의 길이 · 면적은 잘린 대로 다시 셉니다.
 *   레이어 이름은 AutoCAD 처럼 «참조이름|레이어» (켜고 끈 것은 본 도면의 레이어 표를 따름).
 * ■ 0.5배보다 작게 넣은 참조(도곽 귀퉁이 위치도)는 끼우지 않습니다 — 물량도 아니고 무겁기만 합니다.
 * ■ 외부참조 원본 파일은 그 자체로는 셈하지 않습니다(같은 관로를 두 번 세지 않게) — 화면이 «참조원» 으로 표시.
 * ■ 시험: node tools/시험_외부참조.mjs
 */
import { 범위 } from './골조도면.js'

/** 경로 · 확장자를 뺀 비교용 이름 */
export function 참조키(길) {
  return String(길 || '').split(/[\\/]/).pop().replace(/\.(dwg|dxf)$/i, '').trim().toLowerCase()
}

/** 모델이 부르는 외부참조 이름들(작은 위치도 빼고) — [{키, 이름, 길, 수}] */
export function 부르는참조(M) {
  const m = new Map()
  for (const r of M.참조 || []) {
    if (!(r.배율 >= 0.5)) continue
    const 키 = 참조키(r.길 || r.이름)
    const a = m.get(키) || { 키, 이름: r.이름, 길: r.길, 수: 0 }
    a.수++
    m.set(키, a)
  }
  return [...m.values()]
}

/* ── 다각형 ── */
function 안(px, py, poly) {
  let 들 = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j]
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi || 1e-300) + xi) 들 = !들
  }
  return 들
}
/** 선분 a→b 가 다각형 안에 든 구간들 [[t0,t1]…] */
function 선분자르기(ax, ay, bx, by, poly) {
  const ts = [0, 1]
  const dx = bx - ax, dy = by - ay
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [x1, y1] = poly[j], [x2, y2] = poly[i]
    const ex = x2 - x1, ey = y2 - y1
    const d = dx * ey - dy * ex
    if (Math.abs(d) < 1e-15) continue
    const t = ((x1 - ax) * ey - (y1 - ay) * ex) / d
    const u = ((x1 - ax) * dy - (y1 - ay) * dx) / d
    if (t > 0 && t < 1 && u >= 0 && u <= 1) ts.push(t)
  }
  ts.sort((p, q) => p - q)
  const out = []
  for (let k = 0; k < ts.length - 1; k++) {
    const t0 = ts[k], t1 = ts[k + 1]
    if (t1 - t0 < 1e-12) continue
    const tm = (t0 + t1) / 2
    if (안(ax + dx * tm, ay + dy * tm, poly)) {
      if (out.length && Math.abs(out[out.length - 1][1] - t0) < 1e-12) out[out.length - 1][1] = t1
      else out.push([t0, t1])
    }
  }
  return out
}
/** 볼록 다각형으로 다각형 자르기(Sutherland–Hodgman) — 면적용 */
function 면자르기(pts, clip) {
  let out = pts
  const n = clip.length
  // 자르개 방향(반시계)으로 맞춤
  let a2 = 0
  for (let i = 0, j = n - 1; i < n; j = i++) a2 += (clip[j][0] * clip[i][1] - clip[i][0] * clip[j][1])
  const C = a2 < 0 ? clip.slice().reverse() : clip
  for (let i = 0; i < n && out.length; i++) {
    const [x1, y1] = C[i], [x2, y2] = C[(i + 1) % n]
    const 안쪽 = (p) => (x2 - x1) * (p[1] - y1) - (y2 - y1) * (p[0] - x1) >= 0
    const 만남 = (p, q) => {
      const dx = q[0] - p[0], dy = q[1] - p[1], ex = x2 - x1, ey = y2 - y1
      const d = dx * ey - dy * ex
      const t = d ? ((x1 - p[0]) * ey - (y1 - p[1]) * ex) / d : 0
      return [p[0] + dx * t, p[1] + dy * t]
    }
    const inp = out
    out = []
    for (let k = 0; k < inp.length; k++) {
      const p = inp[k], q = inp[(k + 1) % inp.length]
      const pi = 안쪽(p), qi = 안쪽(q)
      if (pi) { out.push(p); if (!qi) out.push(만남(p, q)) } else if (qi) out.push(만남(p, q))
    }
  }
  return out
}
const 넓이 = (pts) => { let a = 0; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) a += pts[j][0] * pts[i][1] - pts[i][0] * pts[j][1]; return Math.abs(a) / 2 }
const 볼록 = (poly) => {
  let 부호 = 0
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length], c = poly[(i + 2) % poly.length]
    const z = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0])
    if (Math.abs(z) < 1e-12) continue
    if (!부호) 부호 = Math.sign(z); else if (Math.sign(z) !== 부호) return false
  }
  return true
}

/** B 의 도형 → 조각들 · 조각마다 상자 — 한 번만 셈(여러 도면이 같은 바탕을 끼움) */
const 준비된 = new WeakMap()
function 조각준비(B) {
  let r = 준비된.get(B)
  if (r) return r
  const 표 = new Map()
  const nQ = B.Q.e.length
  const 상 = new Float64Array(nQ * 4)
  for (let q = 0; q < nQ; q++) {
    const e = B.Q.e[q]; const a = 표.get(e); if (a) a.push(q); else 표.set(e, [q])
    const s = B.Q.p0[q] * 2, n = B.Q.pn[q]
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
    for (let k = 0; k < n; k++) { const x = B.P[s + k * 2], y = B.P[s + k * 2 + 1]; if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y }
    상[q * 4] = x0; 상[q * 4 + 1] = y0; 상[q * 4 + 2] = x1; 상[q * 4 + 3] = y1
  }
  r = { 표, 상 }
  준비된.set(B, r)
  return r
}
const 토막 = (B, q) => { const s = B.Q.p0[q] * 2, n = B.Q.pn[q], pts = new Array(n); for (let k = 0; k < n; k++) pts[k] = [B.P[s + k * 2], B.P[s + k * 2 + 1]]; return pts }

/** 배열 키우기 */
class 늘 {
  constructor(T, n) { this.T = T; this.a = new T(Math.max(16, n)); this.n = 0 }
  need(k) { if (this.n + k <= this.a.length) return; let m = this.a.length * 2; while (m < this.n + k) m *= 2; const b = new this.T(m); b.set(this.a.subarray(0, this.n)); this.a = b }
  push(v) { this.need(1); this.a[this.n++] = v }
  붙(arr) { this.need(arr.length); this.a.set(arr, this.n); this.n += arr.length }
  done() { return this.a.slice(0, this.n) }
}

/**
 * A(본 도면) 에 B(외부참조 파일) 를 A 가 넣은 자리마다 끼워 넣은 새 모델
 * @param 키 B 의 참조키(이 이름으로 넣은 것만)
 * @returns {{모델, 붙은: 넣은 자리 수, 건너뜀: 작은 위치도 수}}
 */
export function 참조붙이기(A, B, 키) {
  const refs = (A.참조 || []).filter((r) => 참조키(r.길 || r.이름) === 키)
  const 쓸 = refs.filter((r) => r.배율 >= 0.5)
  const 건너뜀 = refs.length - 쓸.length
  if (!쓸.length) return { 모델: A, 붙은: 0, 건너뜀 }
  const 이름 = 쓸[0].이름
  const nE = A.E.t.length
  const Et = new 늘(Uint8Array, nE * 2), Ely = new 늘(Uint16Array, nE * 2), Ergb = new 늘(Uint32Array, nE * 2)
  const Elen = new 늘(Float64Array, nE * 2), Earea = new 늘(Float64Array, nE * 2), Eval = new 늘(Float64Array, nE * 2), Eins = new 늘(Int32Array, nE * 2), Esc = new 늘(Float32Array, nE * 2)
  Et.붙(A.E.t); Ely.붙(A.E.ly); Ergb.붙(A.E.rgb); Elen.붙(A.E.len); Earea.붙(A.E.area); Eval.붙(A.E.val); Eins.붙(A.E.ins)
  Esc.붙(A.E.sc || new Float32Array(nE).fill(1))
  const Qe = new 늘(Uint32Array, A.Q.e.length * 2), Q0 = new 늘(Uint32Array, A.Q.e.length * 2), Qn = new 늘(Uint32Array, A.Q.e.length * 2)
  Qe.붙(A.Q.e); Q0.붙(A.Q.p0); Qn.붙(A.Q.pn)
  const PX = new 늘(Float64Array, A.P.length * 2); PX.붙(A.P)
  const T = { s: A.T.s.slice(), x: Array.from(A.T.x), y: Array.from(A.T.y), h: Array.from(A.T.h), a: Array.from(A.T.a), e: Array.from(A.T.e) }
  const I = A.I.map((x) => ({ ...x }))
  const layers = A.layers.map((L) => ({ ...L }))
  const 층찾기 = new Map(layers.map((L, i) => [L.name.toUpperCase(), i]))
  const 층맞춤 = B.layers.map((L) => {
    const n = 이름 + '|' + L.name
    const k = n.toUpperCase()
    if (층찾기.has(k)) return 층찾기.get(k)
    layers.push({ name: n, rgb: L.rgb, hide: L.hide })
    층찾기.set(k, layers.length - 1)
    return layers.length - 1
  })
  const Bo = [B.ox || 0, B.oy || 0]
  const { 표: 조각표B, 상: 조각상 } = 조각준비(B)
  const 글표B = new Map()
  for (let i = 0; i < B.T.s.length; i++) { const e = B.T.e[i]; const a = 글표B.get(e); if (a) a.push(i); else 글표B.set(e, [i]) }
  const 닫힌 = new Set([3, 5, 7, 10])      // 닫힌폴리선 · 원 · 해치 · 채움
  let 붙은 = 0

  for (const r of 쓸) {
    const X = r.X
    const sc = r.배율
    /* B 모델 좌표(가운데 뺀) → A 모델 좌표 */
    const 옮 = (x, y) => { const u = x + Bo[0], v = y + Bo[1]; return [X[0] * u + X[1] * v + X[3], X[4] * u + X[5] * v + X[7]] }
    /* 자르개를 B 모델 좌표로 (X 의 역) */
    let 자르개 = null, 상 = null, 볼 = true
    if (r.경계 && r.경계.length >= 3) {
      const det = X[0] * X[5] - X[1] * X[4]
      if (Math.abs(det) > 1e-18) {
        자르개 = r.경계.map(([x, y]) => {
          const dx = x - X[3], dy = y - X[7]
          return [(X[5] * dx - X[1] * dy) / det - Bo[0], (-X[4] * dx + X[0] * dy) / det - Bo[1]]
        })
        상 = [Infinity, Infinity, -Infinity, -Infinity]
        for (const [x, y] of 자르개) { 상[0] = Math.min(상[0], x); 상[1] = Math.min(상[1], y); 상[2] = Math.max(상[2], x); 상[3] = Math.max(상[3], y) }
        볼 = 볼록(자르개)
      }
    }
    const 새번호 = new Map()      // B 도형 → 새 도형
    const 새도형 = (e) => {
      let id = 새번호.get(e)
      if (id !== undefined) return id
      id = Et.n
      Et.push(B.E.t[e]); Ely.push(층맞춤[B.E.ly[e]]); Ergb.push(B.E.rgb[e])
      Elen.push(NaN); Earea.push(NaN); Eval.push(B.E.val[e]); Eins.push(-1)
      Esc.push((B.E.sc ? B.E.sc[e] : 1) * sc)
      새번호.set(e, id)
      return id
    }
    const 토막넣기 = (id, pts) => {
      if (pts.length < 2) return 0
      const st = PX.n >> 1
      let L = 0
      for (let k = 0; k < pts.length; k++) {
        const [x, y] = 옮(pts[k][0], pts[k][1])
        PX.push(x); PX.push(y)
        if (k) L += Math.hypot(x - PX.a[PX.n - 4], y - PX.a[PX.n - 3])
      }
      Qe.push(id); Q0.push(st); Qn.push(pts.length)
      return L
    }
    for (const [e, qs] of 조각표B) {
      /* 상자로 먼저 거름(미리 셈한 조각 상자) — 자른 곳과 안 겹치는 도형은 점을 꺼내지도 않음 */
      let 하나라도 = !자르개
      if (자르개) {
        for (const q of qs) {
          const o = q * 4
          if (!(조각상[o + 2] < 상[0] || 조각상[o] > 상[2] || 조각상[o + 3] < 상[1] || 조각상[o + 1] > 상[3])) { 하나라도 = true; break }
        }
        if (!하나라도) continue
      }
      const 토막들 = []
      for (const q of qs) {
        const o = q * 4
        const t = { 상: [조각상[o], 조각상[o + 1], 조각상[o + 2], 조각상[o + 3]] }
        if (자르개 && (t.상[2] < 상[0] || t.상[0] > 상[2] || t.상[3] < 상[1] || t.상[1] > 상[3])) { t.밖 = true; 토막들.push(t); continue }
        t.pts = 토막(B, q)
        if (자르개) t.안 = t.상[0] >= 상[0] && t.상[2] <= 상[2] && t.상[1] >= 상[1] && t.상[3] <= 상[3] && t.pts.every(([x, y]) => 안(x, y, 자르개))
        토막들.push(t)
      }
      let 길이 = 0, 잘림 = false
      const id = 새도형(e)
      for (const t of 토막들) {
        if (t.밖) { 잘림 = true; continue }
        if (!자르개 || t.안) { 길이 += 토막넣기(id, t.pts); continue }
        잘림 = true
        let cur = null
        for (let k = 1; k < t.pts.length; k++) {
          const [ax, ay] = t.pts[k - 1], [bx, by] = t.pts[k]
          const 구 = 선분자르기(ax, ay, bx, by, 자르개)
          for (const [t0, t1] of 구) {
            const p0 = [ax + (bx - ax) * t0, ay + (by - ay) * t0], p1 = [ax + (bx - ax) * t1, ay + (by - ay) * t1]
            if (cur && t0 < 1e-12 && Math.hypot(cur[cur.length - 1][0] - p0[0], cur[cur.length - 1][1] - p0[1]) < 1e-9) cur.push(p1)
            else { if (cur) 길이 += 토막넣기(id, cur); cur = [p0, p1] }
            if (t1 < 1 - 1e-12) { 길이 += 토막넣기(id, cur); cur = null }
          }
          if (!구.length && cur) { 길이 += 토막넣기(id, cur); cur = null }
        }
        if (cur) 길이 += 토막넣기(id, cur)
      }
      /* 길이 · 면적 — 안 잘렸으면 원래 값 × 배율, 잘렸으면 잘린 대로 */
      const L0 = B.E.len[e], A0 = B.E.area[e]
      Elen.a[id] = 잘림 ? (Number.isFinite(L0) ? 길이 : NaN) : (Number.isFinite(L0) ? L0 * sc : NaN)
      if (Number.isFinite(A0)) {
        if (!잘림) Earea.a[id] = A0 * sc * sc
        else if (닫힌.has(B.E.t[e]) && 볼 && 토막들.length === 1 && 토막들[0].pts) Earea.a[id] = 넓이(면자르기(토막들[0].pts, 자르개)) * sc * sc
        else Earea.a[id] = A0 * sc * sc * (토막들.filter((t) => !t.밖 && t.안).length / 토막들.length)
      }
    }
    /* 글자 */
    for (let i = 0; i < B.T.s.length; i++) {
      const x = B.T.x[i], y = B.T.y[i]
      if (자르개 && (x < 상[0] || x > 상[2] || y < 상[1] || y > 상[3] || !안(x, y, 자르개))) continue
      const e = B.T.e[i]
      const id = 새번호.has(e) ? 새번호.get(e) : 새도형(e)
      const [nx, ny] = 옮(x, y)
      T.s.push(B.T.s[i]); T.x.push(nx); T.y.push(ny); T.h.push(B.T.h[i] * sc); T.a.push(B.T.a[i] + Math.atan2(X[4], X[0])); T.e.push(id)
    }
    /* 블록 넣은 자리(개수 세기용) */
    for (const b of B.I) {
      if (!b) continue
      if (자르개 && (b.x < 상[0] || b.x > 상[2] || b.y < 상[1] || b.y > 상[3] || !안(b.x, b.y, 자르개))) continue
      const [nx, ny] = 옮(b.x, b.y)
      I.push({ ...b, x: nx, y: ny, ly: 층맞춤[b.ly] ?? b.ly, 참조: 이름 })
    }
    붙은++
  }

  const P = PX.done()
  const Tx = Float64Array.from(T.x), Ty = Float64Array.from(T.y)
  const box = 범위(P, Tx, Ty)
  const 모델 = {
    ...A,
    E: { t: Et.done(), ly: Ely.done(), rgb: Ergb.done(), len: Elen.done(), area: Earea.done(), val: Eval.done(), ins: Eins.done(), sc: Esc.done() },
    Q: { e: Qe.done(), p0: Q0.done(), pn: Qn.done() },
    P, T: { s: T.s, x: Tx, y: Ty, h: Float64Array.from(T.h), a: Float64Array.from(T.a), e: Int32Array.from(T.e) },
    I, layers, box,
    stats: { ...A.stats, verts: P.length >> 1 },
    붙은참조: [...(A.붙은참조 || []), { 이름, 키, 자리: 붙은, 건너뜀 }],
  }
  delete 모델.판
  delete 모델.조각표
  return { 모델, 붙은, 건너뜀 }
}

/** A 모델 좌표의 경계 → B 모델 좌표 (넣은 변환 X 의 역) */
export function 경계를B로(r, B) {
  const X = r.X
  const det = X[0] * X[5] - X[1] * X[4]
  if (!r.경계 || r.경계.length < 3 || Math.abs(det) < 1e-18) return null
  const Bo = [B.ox || 0, B.oy || 0]
  return r.경계.map(([x, y]) => {
    const dx = x - X[3], dy = y - X[7]
    return [(X[5] * dx - X[1] * dy) / det - Bo[0], (-X[4] * dx + X[0] * dy) / det - Bo[1]]
  })
}

/**
 * 🧭 외부참조 한 벌을 «한 번만» 세기 — 여러 도면(오수계획평면도 · 배수설비 · 포장 · 지장물…)이 같은 바탕도를 끼워 쓰면
 *   도면마다 세면 같은 관로가 다섯 번 들어갑니다. 그래서 도면들이 보여 주는 자리(자른 경계)를 «합쳐» 그 안만 한 번 셉니다.
 * @param 경계들 B 모델 좌표의 다각형들 (null 이면 자르지 않은 참조가 있다는 뜻 → 통째로)
 * @param 배율 넣은 배율(보통 1)
 * @returns 셀 수 있는 모델(B 좌표 · 레이어 이름 «참조이름|레이어»)
 */
export function 참조모음(B, 경계들, 배율, 이름) {
  const 통째 = 경계들.some((p) => !p)
  const 자르개들 = 통째 ? [] : 경계들.map((poly) => {
    const 상 = [Infinity, Infinity, -Infinity, -Infinity]
    for (const [x, y] of poly) { 상[0] = Math.min(상[0], x); 상[1] = Math.min(상[1], y); 상[2] = Math.max(상[2], x); 상[3] = Math.max(상[3], y) }
    return { poly, 상, 볼: 볼록(poly) }
  })
  const 안에 = (x, y) => 통째 || 자르개들.some((c) => x >= c.상[0] && x <= c.상[2] && y >= c.상[1] && y <= c.상[3] && 안(x, y, c.poly))
  const sc = 배율 || 1
  const n = B.E.t.length
  const len = new Float64Array(n).fill(NaN), area = new Float64Array(n).fill(NaN), 살 = new Uint8Array(n)
  const { 표: 조각표B, 상: 조각상 } = 조각준비(B)
  const 닫힌 = new Set([3, 5, 7, 10])
  const 겹 = (q) => { const o = q * 4; return 자르개들.some((c) => !(조각상[o + 2] < c.상[0] || 조각상[o] > c.상[2] || 조각상[o + 3] < c.상[1] || 조각상[o + 1] > c.상[3])) }
  for (const [e, qs] of 조각표B) {
    let L = 0, 잘림 = false, 하나 = false
    if (!통째 && !qs.some(겹)) continue
    const 토막들 = []
    for (const q of qs) {
      if (!통째 && !겹(q)) { 잘림 = true; continue }
      토막들.push(토막(B, q))
    }
    if (통째) { 하나 = true } else {
      for (const pts of 토막들) {
        /* 빠른 길 — 조각이 볼록한 경계 하나 안에 통째로 들면 자를 것 없음 */
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
        for (const [x, y] of pts) { if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y }
        const 통 = 자르개들.find((c) => c.볼 && x0 >= c.상[0] && x1 <= c.상[2] && y0 >= c.상[1] && y1 <= c.상[3] && pts.every(([x, y]) => 안(x, y, c.poly)))
        if (통) {
          하나 = true
          for (let k = 1; k < pts.length; k++) L += Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1])
          continue
        }
        for (let k = 1; k < pts.length; k++) {
          const [ax, ay] = pts[k - 1], [bx, by] = pts[k]
          const 구 = []
          const sx0 = Math.min(ax, bx), sx1 = Math.max(ax, bx), sy0 = Math.min(ay, by), sy1 = Math.max(ay, by)
          for (const c of 자르개들) {
            if (sx1 < c.상[0] || sx0 > c.상[2] || sy1 < c.상[1] || sy0 > c.상[3]) continue
            구.push(...선분자르기(ax, ay, bx, by, c.poly))
          }
          const 전체 = Math.hypot(bx - ax, by - ay)
          if (!구.length) { 잘림 = true; continue }
          구.sort((p, q) => p[0] - q[0])
          let 합 = 0, c0 = 구[0][0], c1 = 구[0][1]
          for (let j = 1; j < 구.length; j++) { if (구[j][0] <= c1 + 1e-12) c1 = Math.max(c1, 구[j][1]); else { 합 += c1 - c0; c0 = 구[j][0]; c1 = 구[j][1] } }
          합 += c1 - c0
          if (합 < 1 - 1e-9) 잘림 = true
          if (합 > 0) 하나 = true
          L += 합 * 전체
        }
      }
    }
    if (!하나) continue
    살[e] = 1
    const L0 = B.E.len[e], A0 = B.E.area[e]
    len[e] = Number.isFinite(L0) ? (잘림 ? L : L0) * sc : NaN
    if (Number.isFinite(A0)) {
      if (!잘림) area[e] = A0 * sc * sc
      else if (닫힌.has(B.E.t[e]) && 토막들.length === 1) {
        let a = 0
        for (const c of 자르개들) if (c.볼) a += 넓이(면자르기(토막들[0], c.poly))
        area[e] = a * sc * sc
      } else area[e] = NaN
    }
  }
  /* 글자 · 블록 */
  const 글살 = []
  for (let i = 0; i < B.T.s.length; i++) if (안에(B.T.x[i], B.T.y[i])) { 글살.push(i); 살[B.T.e[i]] = 1 }
  const I = B.I.filter((b) => b && 안에(b.x, b.y)).map((b) => ({ ...b, 참조: 이름 }))
  /* 살아남은 것만 담은 모델 (조각은 그대로 — 셈만 하는 모델) */
  const 남 = []
  for (let e = 0; e < n; e++) if (살[e]) 남.push(e)
  const 새 = new Map(남.map((e, i) => [e, i]))
  const E = {
    t: Uint8Array.from(남, (e) => B.E.t[e]), ly: Uint16Array.from(남, (e) => B.E.ly[e]), rgb: Uint32Array.from(남, (e) => B.E.rgb[e]),
    len: Float64Array.from(남, (e) => len[e]), area: Float64Array.from(남, (e) => area[e]), val: Float64Array.from(남, (e) => B.E.val[e]),
    ins: new Int32Array(남.length).fill(-1), sc: new Float32Array(남.length).fill(1),
  }
  const T = { s: 글살.map((i) => B.T.s[i]), x: Float64Array.from(글살, (i) => B.T.x[i]), y: Float64Array.from(글살, (i) => B.T.y[i]), h: Float64Array.from(글살, (i) => B.T.h[i] * sc), a: Float64Array.from(글살, (i) => B.T.a[i]), e: Int32Array.from(글살, (i) => 새.get(B.T.e[i])) }
  return {
    ...B, E, Q: { e: new Uint32Array(0), p0: new Uint32Array(0), pn: new Uint32Array(0) }, P: new Float64Array(0), T, I,
    layers: B.layers.map((L) => ({ ...L, name: 이름 + '|' + L.name })),
    모음: { 이름, 자리: 경계들.length, 통째 },
  }
}
