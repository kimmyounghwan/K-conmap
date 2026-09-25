/**
 * 📦 도면(.dxf) → 3D 선 모음 (2026-09-25)
 *
 * 소장님: 「DXF 도면만 넣으면 3D 가 서는 도구 — 프로그램화 해서 도구로 넣자」 · 「도구는 되도록 사이트 안에서」
 *
 * ■ 하는 일: 도면에 «이미 적혀 있는 높이(Z)» 그대로 선을 세웁니다.
 *   등고선(높이 든 폴리선) · 3D 폴리선 · 3DFACE · 폴리페이스/메쉬 · 블록(INSERT) 안의 것까지.
 *   ⚠️ 도면을 «해석» 하지 않습니다. 평면도에 높이가 없으면 납작하게 나옵니다 — 그렇다고 화면에 적습니다.
 * ■ 브라우저 안에서만 읽습니다. 파일은 어디에도 올라가지 않습니다(서버 없음 → 동시에 몇 명이 써도 같음).
 * ■ 못 읽는 것: DWG(캐드에서 DXF 로 저장) · 바이너리 DXF · 3DSOLID/BODY/REGION(ACIS 암호) · 글자 · 해치.
 *   못 읽은 것은 «몇 개를 못 그렸는지» 세어서 돌려줍니다 — 조용히 빼지 않습니다.
 *
 * 셈은 전부 double 로 하고, 마지막에 가운데를 빼서 float32 로 옮깁니다
 * (TM 좌표 30만 m 를 그대로 float32 에 넣으면 3cm 단위로 떨립니다).
 */

/* ── ACI(캐드 색 번호) → RGB ─────────────────────────────── */
const ACI = (() => {
  const t = new Array(256)
  const fixed = { 0: [0, 0, 0], 1: [255, 0, 0], 2: [255, 255, 0], 3: [0, 255, 0], 4: [0, 255, 255],
    5: [0, 0, 255], 6: [255, 0, 255], 7: [255, 255, 255], 8: [128, 128, 128], 9: [192, 192, 192] }
  for (const k in fixed) t[k] = fixed[k]
  const hsv = (h) => {            // S=1, V=1
    const c = (n) => { const k = (n + h / 60) % 6; return 1 - Math.max(0, Math.min(k, 4 - k, 1)) }
    return [c(5), c(3), c(1)]
  }
  const vals = [255, 204, 153, 127, 76]
  for (let i = 10; i < 250; i++) {
    const h = (Math.floor(i / 10) - 1) * 15
    const o = i % 10
    const v = vals[o >> 1]
    const rgb = hsv(h)
    t[i] = rgb.map((c) => Math.round(o % 2 ? v * (0.5 + 0.5 * c) : v * c))
  }
  const g = [51, 91, 132, 173, 214, 255]
  for (let i = 250; i < 256; i++) t[i] = [g[i - 250], g[i - 250], g[i - 250]]
  return t
})()
export const aciRgb = (n) => ACI[Math.abs(n | 0)] || ACI[7]

/* ── 글자 읽기 ─────────────────────────────────────────── */
export function decodeBytes(buf) {
  const u8 = new Uint8Array(buf)
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(u8).replace(/^﻿/, '')
  } catch (e) {
    try { return new TextDecoder('euc-kr').decode(u8) } catch (e2) { /* 아래로 */ }
    return new TextDecoder('utf-8').decode(u8)
  }
}

/** 어떤 파일인지 먼저 봅니다 — DWG·바이너리 DXF 는 읽지 못합니다. */
export function sniff(buf) {
  const h = new Uint8Array(buf, 0, Math.min(32, buf.byteLength))
  const s = String.fromCharCode(...h)
  if (/^AC10\d\d/.test(s)) return 'dwg'
  if (s.startsWith('AutoCAD Binary DXF')) return 'bindxf'
  return 'dxf'
}

const UNI = /\\U\+([0-9A-Fa-f]{4})/g
const unesc = (s) => String(s).replace(UNI, (_, h) => String.fromCharCode(parseInt(h, 16)))

/* ── 늘어나는 배열 ─────────────────────────────────────── */
export class F64 {
  constructor(n = 1024) { this.a = new Float64Array(n); this.n = 0 }
  push6(a, b, c, d, e, f) {
    if (this.n + 6 > this.a.length) { const b2 = new Float64Array(this.a.length * 2); b2.set(this.a); this.a = b2 }
    const x = this.a, i = this.n
    x[i] = a; x[i + 1] = b; x[i + 2] = c; x[i + 3] = d; x[i + 4] = e; x[i + 5] = f
    this.n = i + 6
  }
  push3(a, b, c) {
    if (this.n + 3 > this.a.length) { const b2 = new Float64Array(this.a.length * 2); b2.set(this.a); this.a = b2 }
    const x = this.a, i = this.n
    x[i] = a; x[i + 1] = b; x[i + 2] = c
    this.n = i + 3
  }
}
export class U8 {
  constructor(n = 1024) { this.a = new Uint8Array(n); this.n = 0 }
  push3(a, b, c) {
    if (this.n + 3 > this.a.length) { const b2 = new Uint8Array(this.a.length * 2); b2.set(this.a); this.a = b2 }
    const x = this.a, i = this.n
    x[i] = a; x[i + 1] = b; x[i + 2] = c
    this.n = i + 3
  }
}

/* ── 좌표 바꾸기 (3×4 행렬, 행 우선) ───────────────────── */
const I3 = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0]
function mul(A, B) {        // A·B (둘 다 3×4 아핀)
  const r = new Array(12)
  for (let i = 0; i < 3; i++) {
    const a0 = A[i * 4], a1 = A[i * 4 + 1], a2 = A[i * 4 + 2], a3 = A[i * 4 + 3]
    r[i * 4] = a0 * B[0] + a1 * B[4] + a2 * B[8]
    r[i * 4 + 1] = a0 * B[1] + a1 * B[5] + a2 * B[9]
    r[i * 4 + 2] = a0 * B[2] + a1 * B[6] + a2 * B[10]
    r[i * 4 + 3] = a0 * B[3] + a1 * B[7] + a2 * B[11] + a3
  }
  return r
}
/** 임의축 알고리즘(OCS) — 돌출방향 N 으로 캐드가 쓰는 좌표축을 만듭니다. */
function ocs(nx, ny, nz) {
  if (nx === 0 && ny === 0 && nz === 1) return null        // 보통의 경우 — 그대로
  const L = Math.hypot(nx, ny, nz) || 1
  nx /= L; ny /= L; nz /= L
  let ax, ay, az
  if (Math.abs(nx) < 1 / 64 && Math.abs(ny) < 1 / 64) { ax = nz; ay = 0; az = -nx }   // Wy × N
  else { ax = -ny; ay = nx; az = 0 }                                                  // Wz × N
  const La = Math.hypot(ax, ay, az) || 1
  ax /= La; ay /= La; az /= La
  const bx = ny * az - nz * ay, by = nz * ax - nx * az, bz = nx * ay - ny * ax        // N × Ax
  return [ax, bx, nx, 0, ay, by, ny, 0, az, bz, nz, 0]
}

/* ── 한 쌍씩 읽기 ─────────────────────────────────────── */
function reader(text) {
  let p = 0
  const L = text.length
  const line = () => {
    if (p >= L) return null
    let q = text.indexOf('\n', p)
    if (q < 0) q = L
    let s = text.slice(p, q)
    p = q + 1
    if (s.charCodeAt(s.length - 1) === 13) s = s.slice(0, -1)
    return s
  }
  return {
    get pos() { return p },
    len: L,
    next() {
      const c = line()
      if (c === null) return null
      const v = line()
      if (v === null) return null
      return [parseInt(c, 10), v]
    },
  }
}

/* 도형 하나 = { t: 종류, g: [[코드, 값], …] } */
const num = (v) => { const x = parseFloat(v); return Number.isFinite(x) ? x : 0 }

const NOT_DRAWN = {
  TEXT: '글자', MTEXT: '글자', ATTRIB: '글자', ATTDEF: '글자',
  HATCH: '해치(채우기)', '3DSOLID': '입체(3DSOLID)', BODY: '입체(3DSOLID)', REGION: '입체(3DSOLID)',
  SURFACE: '입체(3DSOLID)', PLANESURFACE: '입체(3DSOLID)', EXTRUDEDSURFACE: '입체(3DSOLID)',
  IMAGE: '그림', WIPEOUT: '가림막', OLE2FRAME: 'OLE', VIEWPORT: null, SEQEND: null, VERTEX: null,
  MULTILEADER: '지시선 글자', MLEADER: '지시선 글자', ACAD_TABLE: '표', TOLERANCE: '공차', XLINE: '무한선', RAY: '무한선',
}

/**
 * DXF 글자 → { layers: [{name, rgb, off, pos: Float32Array, col: Uint8Array, segs, pts: Float32Array}],
 *              center, box, zr, stats }
 * @param {string} text
 * @param {(ratio:number)=>void} [onProgress]
 * @param {{maxSegs?:number}} [opt]
 */
export function parseDxf(text, onProgress, opt = {}) {
  const MAX = opt.maxSegs || 3_000_000
  const R = reader(text)
  const layerInfo = new Map()          // 이름 → {rgb, off}
  const blocks = new Map()             // 이름 → {base:[x,y,z], ents:[]}
  const out = new Map()                // 층 → {pos:F64, col:U8, pts:F64, pcol:U8}
  const stats = { segs: 0, pts: 0, ents: 0, capped: false, skipped: {}, unknown: {}, ver: '', units: 0, depthCut: 0 }
  /* 📝 2026-09-26 — 글자도 «자리와 함께» 모읍니다(그리지는 않음). 도면에서 높이(GL +5,200 · 지상 2층 · 평면도 제목)를
     스스로 찾으려면 글자가 있어야 합니다 — lib/building3d.js 가 씁니다. 블록 안 글자·속성(ATTRIB)까지. */
  const texts = []
  const 글자 = (s, w, h, ly) => {
    if (texts.length >= 300000) return
    const t = 글자다듬기(s)
    if (t && Number.isFinite(w[0] + w[1])) texts.push({ s: t, x: w[0], y: w[1], z: w[2], h, ly })
  }
  const skip = (k) => { stats.skipped[k] = (stats.skipped[k] || 0) + 1 }
  let lastProg = 0

  const bucket = (ly) => {
    let b = out.get(ly)
    if (!b) { b = { pos: new F64(), col: new U8(), pts: new F64(64), pcol: new U8(64) }; out.set(ly, b) }
    return b
  }
  const layerRgb = (ly) => (layerInfo.get(ly) || {}).rgb || ACI[7]

  /* ── 읽기: 섹션 차례대로 ── */
  let pair = R.next()
  const ents = []                      // ENTITIES 는 읽는 대로 그리므로 여기엔 안 쌓입니다
  void ents

  /** 코드 0 이 나올 때까지 모은 그룹 */
  const readEnt = (type) => {
    const g = []
    pair = R.next()
    while (pair && pair[0] !== 0) { g.push(pair); pair = R.next() }
    return { t: type, g }
  }

  /** POLYLINE 은 뒤에 VERTEX … SEQEND 가 따라옵니다 — 하나로 묶습니다. INSERT 의 ATTRIB 도 건너뜁니다. */
  const readFull = () => {
    const type = pair[1].trim()
    const e = readEnt(type)
    if (type === 'POLYLINE') {
      e.v = []
      while (pair && pair[0] === 0 && pair[1].trim() === 'VERTEX') e.v.push(readEnt('VERTEX'))
      if (pair && pair[0] === 0 && pair[1].trim() === 'SEQEND') readEnt('SEQEND')
    } else if (type === 'INSERT') {
      const has = e.g.some(([c, v]) => c === 66 && num(v) === 1)
      if (has) {
        e.att = []
        while (pair && pair[0] === 0 && pair[1].trim() === 'ATTRIB') e.att.push(readEnt('ATTRIB'))
        if (pair && pair[0] === 0 && pair[1].trim() === 'SEQEND') readEnt('SEQEND')
      }
    }
    return e
  }

  /* ── 그리기 ── */
  const P = (M, x, y, z) => M === I3 ? [x, y, z]
    : [M[0] * x + M[1] * y + M[2] * z + M[3], M[4] * x + M[5] * y + M[6] * z + M[7], M[8] * x + M[9] * y + M[10] * z + M[11]]

  function seg(b, a, c, rgb) {
    if (stats.segs >= MAX) { stats.capped = true; return }
    if (!(Number.isFinite(a[0] + a[1] + a[2] + c[0] + c[1] + c[2]))) return
    b.pos.push6(a[0], a[1], a[2], c[0], c[1], c[2])
    b.col.push3(rgb[0], rgb[1], rgb[2]); b.col.push3(rgb[0], rgb[1], rgb[2])
    stats.segs++
  }
  function poly(b, M, pts, closed, rgb) {
    let prev = null, first = null
    for (const q of pts) {
      const w = P(M, q[0], q[1], q[2])
      if (prev) seg(b, prev, w, rgb)
      else first = w
      prev = w
    }
    if (closed && prev && first && pts.length > 2) seg(b, prev, first, rgb)
  }
  /** 볼록(bulge) 한 토막을 점들로 — 끝점은 넣지 않습니다 */
  function bulgePts(a, c, bulge, z, arr) {
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
    const n = Math.max(2, Math.min(64, Math.ceil(Math.abs(th) / (Math.PI / 24))))
    const R2 = Math.abs(r)
    for (let i = 1; i < n; i++) {
      const t = a0 + (th * i) / n
      arr.push([cx + R2 * Math.cos(t), cy + R2 * Math.sin(t), z])
    }
  }
  function arcPts(cx, cy, cz, r, s, e) {       // 라디안, 반시계
    let sw = e - s
    while (sw <= 0) sw += Math.PI * 2
    const n = Math.max(6, Math.min(96, Math.ceil((sw / (Math.PI * 2)) * 72)))
    const a = []
    for (let i = 0; i <= n; i++) {
      const t = s + (sw * i) / n
      a.push([cx + r * Math.cos(t), cy + r * Math.sin(t), cz])
    }
    return a
  }

  function g1(g, c, d = 0) { for (const [k, v] of g) if (k === c) return num(v); return d }
  function gs(g, c, d = '') { for (const [k, v] of g) if (k === c) return v.trim(); return d }
  function ext(g) { return ocs(g1(g, 210, 0), g1(g, 220, 0), g1(g, 230, 1)) }

  /** 색: 256 = 층 색(BYLAYER), 0 = 블록 색(BYBLOCK), 420 = 트루컬러 */
  function colorOf(g, ly, byBlock) {
    let tc = null, ci = 256
    for (const [k, v] of g) {
      if (k === 420) tc = parseInt(v, 10)
      else if (k === 62) ci = parseInt(v, 10)
    }
    if (tc !== null && Number.isFinite(tc)) return [(tc >> 16) & 255, (tc >> 8) & 255, tc & 255]
    if (ci === 256 || !Number.isFinite(ci)) return layerRgb(ly)
    if (ci === 0) return byBlock || ACI[7]
    return aciRgb(ci)
  }

  function draw(e, M, inLayer, inRgb, depth) {
    const g = e.g
    if (g1(g, 67, 0) === 1) return                      // 배치(종이) 공간 — 안 그립니다
    let ly = gs(g, 8, '0')
    if (ly === '0' && inLayer) ly = inLayer             // 블록 안 0층은 넣은 쪽 층을 따릅니다
    const rgb = colorOf(g, ly, inRgb)
    const t = e.t
    stats.ents++
    const b = () => bucket(ly)
    switch (t) {
      case 'LINE': {
        seg(b(), P(M, g1(g, 10), g1(g, 20), g1(g, 30)), P(M, g1(g, 11), g1(g, 21), g1(g, 31)), rgb)
        return
      }
      case 'POINT': {
        const w = P(M, g1(g, 10), g1(g, 20), g1(g, 30))
        const bb = b(); bb.pts.push3(w[0], w[1], w[2]); bb.pcol.push3(rgb[0], rgb[1], rgb[2]); stats.pts++
        return
      }
      case 'LWPOLYLINE': {
        const O = ext(g); const MM = O ? mul(M, O) : M
        const z = g1(g, 38, 0)
        const vs = []
        let cur = null
        for (const [k, v] of g) {
          if (k === 10) { cur = [num(v), 0, 0]; vs.push(cur) }
          else if (k === 20 && cur) cur[1] = num(v)
          else if (k === 42 && cur) cur[2] = num(v)
        }
        const closed = (g1(g, 70, 0) & 1) === 1
        const pts = []
        for (let i = 0; i < vs.length; i++) {
          const a = vs[i], c = vs[i + 1] || (closed ? vs[0] : null)
          if (c) bulgePts(a, c, a[2], z, pts)
          else pts.push([a[0], a[1], z])
        }
        if (closed && pts.length) pts.push(pts[0])
        poly(b(), MM, pts, false, rgb)
        return
      }
      case 'POLYLINE': {
        const fl = g1(g, 70, 0)
        const V = (e.v || []).map((x) => ({ x: g1(x.g, 10), y: g1(x.g, 20), z: g1(x.g, 30), f: g1(x.g, 70, 0),
          bu: g1(x.g, 42, 0), i: [g1(x.g, 71, 0), g1(x.g, 72, 0), g1(x.g, 73, 0), g1(x.g, 74, 0)] }))
        if (fl & 64) {                                   // 폴리페이스 메쉬
          const pv = V.filter((v) => v.f & 64)
          for (const f of V.filter((v) => (v.f & 128) && !(v.f & 64))) {
            const ids = f.i.filter((k) => k !== 0)
            for (let j = 0; j < ids.length; j++) {
              if (ids[j] < 0) continue                  // 음수 = 안 보이는 모서리
              const a = pv[Math.abs(ids[j]) - 1], c = pv[Math.abs(ids[(j + 1) % ids.length]) - 1]
              if (a && c) seg(b(), P(M, a.x, a.y, a.z), P(M, c.x, c.y, c.z), rgb)
            }
          }
          return
        }
        if (fl & 16) {                                   // M×N 메쉬
          const m = g1(g, 71, 0), n = g1(g, 72, 0)
          const at = (i, j) => V[i * n + j]
          if (m > 0 && n > 0 && V.length >= m * n) {
            for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) {
              const a = at(i, j)
              const r = j + 1 < n ? at(i, j + 1) : ((fl & 32) ? at(i, 0) : null)
              const d = i + 1 < m ? at(i + 1, j) : ((fl & 1) ? at(0, j) : null)
              if (r) seg(b(), P(M, a.x, a.y, a.z), P(M, r.x, r.y, r.z), rgb)
              if (d) seg(b(), P(M, a.x, a.y, a.z), P(M, d.x, d.y, d.z), rgb)
            }
          }
          return
        }
        const vv = V.filter((v) => !(v.f & 16))          // 스플라인 틀 점은 뺍니다
        const closed = (fl & 1) === 1
        if (fl & 8) {                                    // 3D 폴리선 — 이미 WCS
          poly(b(), M, vv.map((v) => [v.x, v.y, v.z]), closed, rgb)
          return
        }
        const O = ext(g); const MM = O ? mul(M, O) : M
        const z = g1(g, 30, 0)
        const pts = []
        for (let i = 0; i < vv.length; i++) {
          const a = vv[i], c = vv[i + 1] || (closed ? vv[0] : null)
          if (c) bulgePts([a.x, a.y], [c.x, c.y], a.bu, z, pts)
          else pts.push([a.x, a.y, z])
        }
        if (closed && pts.length) pts.push(pts[0])
        poly(b(), MM, pts, false, rgb)
        return
      }
      case '3DFACE': {
        const q = [0, 1, 2, 3].map((k) => [g1(g, 10 + k), g1(g, 20 + k), g1(g, 30 + k)])
        const hid = g1(g, 70, 0)
        const tri = q[3][0] === q[2][0] && q[3][1] === q[2][1] && q[3][2] === q[2][2]
        const n = tri ? 3 : 4
        for (let k = 0; k < n; k++) {
          if (hid & (1 << k)) continue
          const a = q[k], c = q[(k + 1) % n]
          seg(b(), P(M, a[0], a[1], a[2]), P(M, c[0], c[1], c[2]), rgb)
        }
        return
      }
      case 'SOLID': case 'TRACE': {
        const O = ext(g); const MM = O ? mul(M, O) : M
        const q = [0, 1, 3, 2].map((k) => [g1(g, 10 + k), g1(g, 20 + k), g1(g, 30 + k, g1(g, 30))])
        poly(b(), MM, q, true, rgb)
        return
      }
      case 'CIRCLE': case 'ARC': {
        const O = ext(g); const MM = O ? mul(M, O) : M
        const cx = g1(g, 10), cy = g1(g, 20), cz = g1(g, 30), r = g1(g, 40)
        if (!(r > 0)) return
        const s = t === 'ARC' ? (g1(g, 50) * Math.PI) / 180 : 0
        const en = t === 'ARC' ? (g1(g, 51) * Math.PI) / 180 : Math.PI * 2
        poly(b(), MM, arcPts(cx, cy, cz, r, s, t === 'ARC' ? en : s + Math.PI * 2), false, rgb)
        return
      }
      case 'ELLIPSE': {
        const c = [g1(g, 10), g1(g, 20), g1(g, 30)]
        const mj = [g1(g, 11), g1(g, 21), g1(g, 31)]
        const N = [g1(g, 210, 0), g1(g, 220, 0), g1(g, 230, 1)]
        const ratio = g1(g, 40, 1)
        const mn = [N[1] * mj[2] - N[2] * mj[1], N[2] * mj[0] - N[0] * mj[2], N[0] * mj[1] - N[1] * mj[0]]
        const Ln = Math.hypot(...mn) || 1, Lm = Math.hypot(...mj)
        for (let k = 0; k < 3; k++) mn[k] = (mn[k] / Ln) * Lm * ratio
        let s = g1(g, 41, 0), en = g1(g, 42, Math.PI * 2)
        let sw = en - s
        while (sw <= 0) sw += Math.PI * 2
        const n = Math.max(8, Math.min(96, Math.ceil((sw / (Math.PI * 2)) * 72)))
        const pts = []
        for (let i = 0; i <= n; i++) {
          const u = s + (sw * i) / n, cs = Math.cos(u), sn = Math.sin(u)
          pts.push([c[0] + cs * mj[0] + sn * mn[0], c[1] + cs * mj[1] + sn * mn[1], c[2] + cs * mj[2] + sn * mn[2]])
        }
        poly(b(), M, pts, false, rgb)
        return
      }
      case 'SPLINE': {
        const deg = g1(g, 71, 3)
        const knots = [], ctrl = [], fit = [], w = []
        let cur = null, fcur = null
        for (const [k, v] of g) {
          if (k === 40) knots.push(num(v))
          else if (k === 41) w.push(num(v))
          else if (k === 10) { cur = [num(v), 0, 0]; ctrl.push(cur) }
          else if (k === 20 && cur) cur[1] = num(v)
          else if (k === 30 && cur) cur[2] = num(v)
          else if (k === 11) { fcur = [num(v), 0, 0]; fit.push(fcur) }
          else if (k === 21 && fcur) fcur[1] = num(v)
          else if (k === 31 && fcur) fcur[2] = num(v)
        }
        let pts = null
        if (ctrl.length > deg && knots.length === ctrl.length + deg + 1) pts = bspline(deg, ctrl, knots, w.length === ctrl.length ? w : null)
        if (!pts) pts = fit.length >= 2 ? fit : ctrl
        poly(b(), M, pts, false, rgb)
        return
      }
      case 'LEADER': {
        const pts = []
        let cur = null
        for (const [k, v] of g) {
          if (k === 10) { cur = [num(v), 0, 0]; pts.push(cur) }
          else if (k === 20 && cur) cur[1] = num(v)
          else if (k === 30 && cur) cur[2] = num(v)
        }
        poly(b(), M, pts, false, rgb)
        return
      }
      case 'MESH': {
        const vs = []; const faces = []
        let mode = 0, cur = null, left = 0
        for (const [k, v] of g) {
          if (k === 92) { mode = 1; continue }
          if (k === 93) { mode = 2; left = 0; continue }
          if (k === 94 || k === 95) { mode = 3; continue }
          if (mode === 1) {
            if (k === 10) { cur = [num(v), 0, 0]; vs.push(cur) }
            else if (k === 20 && cur) cur[1] = num(v)
            else if (k === 30 && cur) cur[2] = num(v)
          } else if (mode === 2 && k === 90) {
            const x = parseInt(v, 10)
            if (left === 0) { faces.push([]); left = x } else { faces[faces.length - 1].push(x); left-- }
          }
        }
        for (const f of faces) for (let j = 0; j < f.length; j++) {
          const a = vs[f[j]], c = vs[f[(j + 1) % f.length]]
          if (a && c) seg(b(), P(M, a[0], a[1], a[2]), P(M, c[0], c[1], c[2]), rgb)
        }
        return
      }
      case 'INSERT': case 'DIMENSION': {
        if (e.att) for (const a of e.att) draw(a, M, ly, rgb, depth + 1)   /* 속성 글자는 이미 제자리 좌표 */
        const name = gs(g, 2)
        const bl = blocks.get(name)
        if (!bl) { if (t === 'INSERT') skip('없는 블록'); return }
        if (depth > 12) { stats.depthCut++; return }
        let X
        if (t === 'DIMENSION') X = M                    // 치수 블록은 이미 제자리 좌표
        else {
          const O = ext(g)
          const sx = g1(g, 41, 1), sy = g1(g, 42, 1), sz = g1(g, 43, 1)
          const rot = (g1(g, 50, 0) * Math.PI) / 180
          const cs = Math.cos(rot), sn = Math.sin(rot)
          const ix = g1(g, 10), iy = g1(g, 20), iz = g1(g, 30)
          const [bx, by, bz] = bl.base
          const cols = Math.max(1, g1(g, 70, 1)), rows = Math.max(1, g1(g, 71, 1))
          const csp = g1(g, 44, 0), rsp = g1(g, 45, 0)
          for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
            const ox = c * csp, oy = r * rsp
            // T(ins)·R(rot)·T(ox,oy)·S(sx,sy,sz)·T(-base)
            let L = [cs * sx, -sn * sy, 0, cs * (ox - sx * bx) - sn * (oy - sy * by) + ix,
              sn * sx, cs * sy, 0, sn * (ox - sx * bx) + cs * (oy - sy * by) + iy,
              0, 0, sz, -sz * bz + iz]
            if (O) L = mul(O, L)
            X = mul(M, L)
            const inRgbNext = rgb
            for (const s of bl.ents) {
              draw(s, X, ly, inRgbNext, depth + 1)
              if (stats.capped) return
            }
          }
          return
        }
        for (const s of bl.ents) { draw(s, X, ly, rgb, depth + 1); if (stats.capped) return }
        return
      }
      case 'TEXT': case 'MTEXT': case 'ATTRIB': {
        let str = ''
        if (t === 'MTEXT') { for (const [k, v] of g) if (k === 3) str += v; str += gs(g, 1) } else str = gs(g, 1)
        const sc = M === I3 ? 1 : Math.hypot(M[0], M[4], M[8])
        글자(unesc(str), P(M, g1(g, 10), g1(g, 20), g1(g, 30)), g1(g, 40) * sc, ly)
        skip('글자'); stats.ents--
        return
      }
      default: {
        if (t in NOT_DRAWN) { const k = NOT_DRAWN[t]; if (k) skip(k); stats.ents-- }
        else stats.unknown[t] = (stats.unknown[t] || 0) + 1
      }
    }
  }

  /* ── 섹션 돌기 ── */
  while (pair) {
    if (pair[0] === 0 && pair[1].trim() === 'SECTION') {
      pair = R.next()                                   // 2 이름
      const sec = pair ? pair[1].trim() : ''
      pair = R.next()
      if (sec === 'HEADER') {
        let key = ''
        while (pair && !(pair[0] === 0 && pair[1].trim() === 'ENDSEC')) {
          if (pair[0] === 9) key = pair[1].trim()
          else if (key === '$ACADVER' && pair[0] === 1) stats.ver = pair[1].trim()
          else if (key === '$INSUNITS' && pair[0] === 70) stats.units = parseInt(pair[1], 10)
          pair = R.next()
        }
      } else if (sec === 'TABLES') {
        let inLayer = false
        while (pair && !(pair[0] === 0 && pair[1].trim() === 'ENDSEC')) {
          if (pair[0] === 0 && pair[1].trim() === 'TABLE') {
            pair = R.next(); inLayer = pair && pair[0] === 2 && pair[1].trim() === 'LAYER'; pair = R.next(); continue
          }
          if (inLayer && pair[0] === 0 && pair[1].trim() === 'LAYER') {
            const e = readEnt('LAYER')
            const name = unesc(gs(e.g, 2))
            const ci = g1(e.g, 62, 7), fl = g1(e.g, 70, 0)
            let tc = null
            for (const [k, v] of e.g) if (k === 420) tc = parseInt(v, 10)
            const rgb = tc !== null && Number.isFinite(tc) ? [(tc >> 16) & 255, (tc >> 8) & 255, tc & 255] : aciRgb(ci)
            layerInfo.set(name, { rgb, off: ci < 0 || (fl & 1) === 1 })
            continue
          }
          pair = R.next()
        }
      } else if (sec === 'BLOCKS') {
        let cur = null
        while (pair && !(pair[0] === 0 && pair[1].trim() === 'ENDSEC')) {
          if (pair[0] !== 0) { pair = R.next(); continue }
          const t = pair[1].trim()
          if (t === 'BLOCK') {
            const e = readEnt('BLOCK')
            cur = { name: unesc(gs(e.g, 2)), base: [g1(e.g, 10), g1(e.g, 20), g1(e.g, 30)], ents: [] }
            continue
          }
          if (t === 'ENDBLK') { if (cur) blocks.set(cur.name, cur); cur = null; readEnt('ENDBLK'); continue }
          const e = readFull()
          if (cur && !/^\*paper_space/i.test(cur.name)) {
            for (const kv of e.g) if (kv[0] === 8 || kv[0] === 2) kv[1] = unesc(kv[1])
            cur.ents.push(e)
          }
        }
      } else if (sec === 'ENTITIES') {
        while (pair && !(pair[0] === 0 && pair[1].trim() === 'ENDSEC')) {
          if (pair[0] !== 0) { pair = R.next(); continue }
          const e = readFull()
          for (const kv of e.g) if (kv[0] === 8 || kv[0] === 2) kv[1] = unesc(kv[1])
          if (!stats.capped) draw(e, I3, null, null, 0)
          if (onProgress && R.pos - lastProg > 2_000_000) { lastProg = R.pos; onProgress(R.pos / R.len) }
        }
      } else {
        while (pair && !(pair[0] === 0 && pair[1].trim() === 'ENDSEC')) pair = R.next()
      }
      if (onProgress && R.pos - lastProg > 2_000_000) { lastProg = R.pos; onProgress(R.pos / R.len) }
    }
    pair = R.next()
  }

  if (opt.raw) return { out, layerInfo, stats, texts }
  const r = finish(out, layerInfo, stats)
  r.texts = texts
  return r
}

/* MTEXT 서식 걷어내기 — \P(줄바꿈) · {\fArial|b0;…} · \H2.5x; · %%P(±) · %%D(°) */
function 글자다듬기(s) {
  return String(s || '')
    .replace(/\\P/gi, ' ')
    .replace(/\\[ACcFfHhQqTtWw][^;]*;/g, '')
    .replace(/\\[LlOoKkXx]/g, '')
    .replace(/\\S([^;]*)\^([^;]*);/g, '$1/$2')
    .replace(/[{}]/g, '')
    .replace(/%%[Pp]/g, '±').replace(/%%[Dd]/g, '°').replace(/%%[Cc]/g, 'Ø')
    .replace(/\s+/g, ' ')
    .trim()
}

/* 비균일 B-스플라인(드보어) — 가중치가 있으면 유리식 */
function bspline(p, P, U, W) {
  const n = P.length
  const lo = U[p], hi = U[n]
  if (!(hi > lo)) return null
  const steps = Math.max(16, Math.min(200, n * 8))
  const out = []
  for (let s = 0; s <= steps; s++) {
    let u = lo + ((hi - lo) * s) / steps
    if (s === steps) u = hi - 1e-10 * (hi - lo)
    let k = p
    while (k < n - 1 && U[k + 1] <= u) k++
    const d = []
    for (let j = 0; j <= p; j++) {
      const q = P[k - p + j], w = W ? W[k - p + j] : 1
      d.push([q[0] * w, q[1] * w, q[2] * w, w])
    }
    for (let r = 1; r <= p; r++) for (let j = p; j >= r; j--) {
      const i = k - p + j
      const den = U[i + p - r + 1] - U[i]
      const a = den ? (u - U[i]) / den : 0
      for (let c = 0; c < 4; c++) d[j][c] = (1 - a) * d[j - 1][c] + a * d[j][c]
    }
    const e = d[p]
    if (!e[3]) return null
    out.push([e[0] / e[3], e[1] / e[3], e[2] / e[3]])
  }
  return out
}

/* 가운데를 빼고 float32 로 — 가운데는 «튀는 점» 에 끌리지 않게 가운데값(1~99%)으로 */
export function finish(out, layerInfo, stats) {
  const sample = []
  let seen = 0
  for (const b of out.values()) {
    for (const arr of [b.pos, b.pts]) {
      for (let i = 0; i < arr.n; i += 3) {
        seen++
        if (sample.length < 60000) sample.push(i, arr)
        else {
          const j = Math.floor(Math.random() * seen)
          if (j < 30000) { sample[j * 2] = i; sample[j * 2 + 1] = arr }
        }
      }
    }
  }
  const xs = [], ys = [], zs = []
  for (let k = 0; k < sample.length; k += 2) {
    const i = sample[k], a = sample[k + 1].a
    xs.push(a[i]); ys.push(a[i + 1]); zs.push(a[i + 2])
  }
  const q = (v, f) => { if (!v.length) return 0; const s = v.slice().sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(f * (s.length - 1)))] }
  const box = [q(xs, 0.01), q(ys, 0.01), q(zs, 0.01), q(xs, 0.99), q(ys, 0.99), q(zs, 0.99)]
  const center = [(box[0] + box[3]) / 2, (box[1] + box[4]) / 2, (box[2] + box[5]) / 2]
  let zmin = Infinity, zmax = -Infinity
  for (const z of zs) { if (z < zmin) zmin = z; if (z > zmax) zmax = z }
  const layers = []
  for (const [name, b] of out) {
    if (!b.pos.n && !b.pts.n) continue
    const pos = new Float32Array(b.pos.n)
    for (let i = 0; i < b.pos.n; i += 3) {
      pos[i] = b.pos.a[i] - center[0]; pos[i + 1] = b.pos.a[i + 1] - center[1]; pos[i + 2] = b.pos.a[i + 2] - center[2]
    }
    const pts = new Float32Array(b.pts.n)
    for (let i = 0; i < b.pts.n; i += 3) {
      pts[i] = b.pts.a[i] - center[0]; pts[i + 1] = b.pts.a[i + 1] - center[1]; pts[i + 2] = b.pts.a[i + 2] - center[2]
    }
    /* 🏢 건물로 세운 것은 버킷 이름이 «층\u0001레이어» 입니다 (building3d.js) */
    const cut = name.indexOf('\u0001')
    const floor = cut >= 0 ? name.slice(0, cut) : ''
    const ly = cut >= 0 ? name.slice(cut + 1) : name
    const info = layerInfo.get(ly) || {}
    /* 세운 벽 면(세모) — 면마다 바깥쪽 방향(법선)을 붙여 빛을 받게 합니다 */
    let tri = null, trn = null, trc = null
    if (b.tri && b.tri.n) {
      const n = b.tri.n
      tri = new Float32Array(n); trn = new Float32Array(n); trc = b.trc.a.slice(0, b.trc.n)
      const A = b.tri.a
      for (let i = 0; i < n; i += 9) {
        for (let k = 0; k < 9; k += 3) {
          tri[i + k] = A[i + k] - center[0]; tri[i + k + 1] = A[i + k + 1] - center[1]; tri[i + k + 2] = A[i + k + 2] - center[2]
        }
        const ux = A[i + 3] - A[i], uy = A[i + 4] - A[i + 1], uz = A[i + 5] - A[i + 2]
        const vx = A[i + 6] - A[i], vy = A[i + 7] - A[i + 1], vz = A[i + 8] - A[i + 2]
        let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx
        const L = Math.hypot(nx, ny, nz) || 1
        nx /= L; ny /= L; nz /= L
        for (let k = 0; k < 9; k += 3) { trn[i + k] = nx; trn[i + k + 1] = ny; trn[i + k + 2] = nz }
      }
    }
    layers.push({ name, floor, ly, rgb: info.rgb || ACI[7], off: !!info.off, pos, col: b.col.a.slice(0, b.col.n),
      segs: b.pos.n / 6, pts, pcol: b.pcol.a.slice(0, b.pcol.n), box: layerBox(pos, pts), smp: layerSample(pos, pts),
      tri, trn, trc })
  }
  layers.sort((a, b) => (b.segs + b.pts.length / 3) - (a.segs + a.pts.length / 3))
  return { layers, center, box, zr: Number.isFinite(zmin) ? [zmin, zmax] : [0, 0], stats }
}

/* 층 하나의 자리 — 튀는 점 몇 개에 끌리지 않게 2~98% (가운데를 뺀 좌표) + 높이는 끝까지 */
function layerBox(pos, pts) {
  const n = pos.length / 3 + pts.length / 3
  if (!n) return null
  const step = Math.max(1, Math.floor(n / 4000))
  const xs = [], ys = [], zs = []
  let zmin = Infinity, zmax = -Infinity
  const take = (a) => {
    for (let i = 0; i < a.length; i += 3) {
      const z = a[i + 2]
      if (z < zmin) zmin = z
      if (z > zmax) zmax = z
      if ((i / 3) % step === 0) { xs.push(a[i]); ys.push(a[i + 1]); zs.push(z) }
    }
  }
  take(pos); take(pts)
  const q = (v, f) => { const s = v.slice().sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(f * (s.length - 1)))] }
  return [q(xs, 0.02), q(ys, 0.02), q(zs, 0.02), q(xs, 0.98), q(ys, 0.98), q(zs, 0.98), zmin, zmax]
}

/* 층마다 점 몇백 개를 떼어 둡니다 — 화면 맞추기(켠 층들 전체의 1~99%)에 씁니다.
   한쪽 구석에 점 세 개만 찍힌 층이 있어도 화면이 그리로 끌려가지 않게. [x,y,z,…] + 무게(한 점이 몇 점 몫인지) */
function layerSample(pos, pts) {
  const n = pos.length / 3 + pts.length / 3
  if (!n) return null
  const k = Math.min(n, 600)
  const out = new Float32Array(k * 3)
  for (let j = 0; j < k; j++) {
    const i = Math.floor((j * n) / k)
    const a = i < pos.length / 3 ? pos : pts
    const ii = (i < pos.length / 3 ? i : i - pos.length / 3) * 3
    out[j * 3] = a[ii]; out[j * 3 + 1] = a[ii + 1]; out[j * 3 + 2] = a[ii + 2]
  }
  return { p: out, w: n / k }
}

/** 켠 층들의 자리 [x0,y0,z0,x1,y1,z1] — 점 수로 무게를 단 1~99% */
export function fitBox(layers, on) {
  const xs = [], ys = [], zs = []
  for (const l of layers) {
    if (!on[l.name] || !l.smp) continue
    const { p, w } = l.smp
    for (let i = 0; i < p.length; i += 3) { xs.push([p[i], w]); ys.push([p[i + 1], w]); zs.push([p[i + 2], w]) }
  }
  if (!xs.length) return null
  const q = (v, lo, hi) => {
    v.sort((a, b) => a[0] - b[0])
    const tot = v.reduce((s, x) => s + x[1], 0)
    let acc = 0, a = v[0][0], b = v[v.length - 1][0], gotA = false
    for (const [x, w] of v) {
      acc += w
      if (!gotA && acc >= tot * lo) { a = x; gotA = true }
      if (acc >= tot * hi) { b = x; break }
    }
    return [a, b]
  }
  const [x0, x1] = q(xs, 0.01, 0.99), [y0, y1] = q(ys, 0.01, 0.99), [z0, z1] = q(zs, 0.005, 0.995)
  return [x0, y0, z0, x1, y1, z1]
}

/** 단위 번호 → 글 */
export const UNITS = { 0: '', 1: 'in', 2: 'ft', 4: 'mm', 5: 'cm', 6: 'm', 7: 'km' }
