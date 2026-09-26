/**
 * 📄 도면(.dxf) → 종이에 찍을 «평면 그림» (2026-09-26)
 *
 * 소장님: 「캐드 파일 dwg 이것을 pdf로 변환해주는 프로그램 … 도구 만들어서 사이트에 게시」
 *         「dxf로 올리면 돼지...이렇게 프로그램 만들어 줘」
 *
 * 읽기의 뼈대(쌍 읽기·블록·OCS·볼록·스플라인)는 dxf3d.js 것을 그대로 씁니다. 다른 점만:
 *   · 선을 토막 내지 않고 «한 줄(폴리선)» 로 모읍니다 — 점선(선 종류)이 이어져야 해서
 *   · 색 번호(ACI)·선 종류·선 굵기를 같이 가집니다 — 종이에서는 색마다 굵기가 다릅니다(CTB)
 *   · 채움(SOLID · 솔리드 해치 · 굵은 폴리선) · 해치 무늬 · 글자(높이·각도·폭·정렬) · 도곽 찾기
 *   · XCLIP(외부참조 자르기) — 자른 경계를 같이 넘기고, 종이에 찍을 때 그 안만 보이게 합니다
 *
 * 안 그리는 것(세어서 알려 줍니다): 끈 층 · 얼린 층 · «출력 안 함» 층 · DEFPOINTS ·
 *   배치(종이 공간) · 그림(IMAGE) · OLE · 표(ACAD_TABLE) · 다중 지시선(MLEADER) · 점(POINT)
 *
 * 모든 좌표는 «도면 좌표 그대로(double)» 입니다. 종이 좌표로 옮기는 것은 plotpdf.js · plotview.js 가 합니다.
 */
import { reader, ocs, mul, I3, unesc, num, bspline, aciRgb } from './dxf3d.js'

/* ── 늘어나는 배열 ─────────────────────────────────────── */
class Grow {
  constructor(T, n = 4096) { this.T = T; this.a = new T(n); this.n = 0 }
  need(k) {
    if (this.n + k <= this.a.length) return
    let m = this.a.length * 2
    while (m < this.n + k) m *= 2
    const b = new this.T(m); b.set(this.a); this.a = b
  }
  push(v) { this.need(1); this.a[this.n++] = v }
  push2(x, y) { this.need(2); this.a[this.n++] = x; this.a[this.n++] = y }
  done() { return this.a.slice(0, this.n) }
}

const NOT_DRAWN = {
  '3DSOLID': '솔리드(3D)', BODY: '솔리드(3D)', REGION: '영역', SURFACE: '면(3D)',
  IMAGE: '그림', WIPEOUT: '가림막', OLE2FRAME: 'OLE', OLEFRAME: 'OLE',
  MULTILEADER: '다중 지시선', MLEADER: '다중 지시선', ACAD_TABLE: '표', TOLERANCE: '공차',
  XLINE: '무한선', RAY: '무한선', POINT: null, VIEWPORT: null, SEQEND: null, VERTEX: null, ATTDEF: null,
  ACAD_PROXY_ENTITY: '프록시', HELIX: '나선', UNDERLAY: '밑그림', PDFUNDERLAY: '밑그림', DWFUNDERLAY: '밑그림',
  DGNUNDERLAY: '밑그림', LIGHT: null, SUN: null, SECTION: null, SHAPE: '모양(SHP)',
}

const D2R = Math.PI / 180
const MAX_V = 9_000_000          // 꼭짓점 상한(9백만 = 약 140MB) — 넘으면 멈추고 알립니다
const MAX_HATCH_SEG = 2_500_000  // 해치 무늬 토막 상한(도면 전체)

/* ── 글자: %% 부호 · MTEXT 서식 ───────────────────────── */
export function cadText(s) {
  return String(s || '')
    .replace(/%%[cC]/g, 'Ø').replace(/%%[dD]/g, '°').replace(/%%[pP]/g, '±')
    .replace(/%%[uUoOkK]/g, '').replace(/%%%/g, '%')
    .replace(/%%(\d{3})/g, (_, d) => String.fromCharCode(parseInt(d, 10)))
    .replace(/[\u0000-\u001f]/g, '')
}
/** MTEXT 원문 → 줄 목록 (서식은 걷어냄, \P·\N 은 줄바꿈) */
export function mtextLines(raw) {
  const s = unesc(raw)
  const out = []
  let cur = ''
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (c === '\\') {
      const n = s[i + 1]
      if (n === undefined) break
      if (n === 'P' || n === 'N') { out.push(cur); cur = ''; i++; continue }
      if (n === '~') { cur += ' '; i++; continue }
      if (n === '\\' || n === '{' || n === '}') { cur += n; i++; continue }
      if ('LlOoKkXx'.includes(n)) { i++; continue }
      if (n === 'S') {
        const j = s.indexOf(';', i + 2)
        const body = j < 0 ? s.slice(i + 2) : s.slice(i + 2, j)
        cur += body.replace(/[\^#]/, '/').replace(/\^/g, '')
        i = j < 0 ? s.length : j
        continue
      }
      if ('ACcFfHhQqTtWwp'.includes(n)) { const j = s.indexOf(';', i + 2); i = j < 0 ? s.length : j; continue }
      if (n === 'M' && s[i + 2] === '+') { i += 7; continue }
      cur += n; i++; continue
    }
    if (c === '{' || c === '}' || c === '\n' || c === '\r') continue
    cur += c
  }
  out.push(cur)
  return out.map(cadText)
}

/* ── XCLIP 미리 훑기: SPATIAL_FILTER → 어느 INSERT 의 것인지 ──
   2026-09-26 여수 A-300 으로 확인: 경계점에 «역삽입 행렬(첫 번째 40 열두 개)» 을 곱하면 블록 좌표가 됩니다.
   (곱하지 않으면 블록 그림과 수백만 mm 떨어진 곳을 가리킵니다.) */
function groupsAt(text, pos) {
  const R = reader(text.slice(pos, pos + 200000))
  const g = []
  let p = R.next()
  while (p && p[0] !== 0) { g.push(p); p = R.next() }
  return g
}
function lineStart(text, i) { const k = text.lastIndexOf('\n', i); return k < 0 ? 0 : k + 1 }
function findByHandle(text, h) {
  const re = new RegExp('\\n[ \\t]*5\\r?\\n' + h.replace(/[^0-9A-Fa-f]/g, '') + '\\r?\\n', 'g')
  const m = re.exec(text)
  if (!m) return null
  // 이 객체의 머리(0 줄) 로 거슬러 올라갑니다
  const k = text.lastIndexOf('\n', m.index - 1)
  const type = text.slice(k + 1, m.index).trim()
  return { type, g: groupsAt(text, m.index + 1) }
}
export function scanClips(text) {
  const map = new Map()
  let i = 0
  let guard = 0
  while ((i = text.indexOf('SPATIAL_FILTER', i)) >= 0 && guard++ < 5000) {
    const ls = lineStart(text, i)
    const line = text.slice(ls, text.indexOf('\n', i)).trim()
    if (line !== 'SPATIAL_FILTER') { i += 14; continue }
    const prev = text.slice(lineStart(text, ls - 2), ls - 1).trim()
    if (prev !== '0') { i += 14; continue }
    const g = groupsAt(text, text.indexOf('\n', i) + 1)
    i += 14
    const pts = []
    let cur = null
    const m40 = []
    let owner = null
    for (const [k, v] of g) {
      if (k === 10) { cur = [num(v), 0]; pts.push(cur) }
      else if (k === 20 && cur) cur[1] = num(v)
      else if (k === 40) m40.push(num(v))
      else if (k === 330) owner = v.trim()
    }
    if (pts.length < 2 || !owner) continue
    // SPATIAL_FILTER ← 사전(ACAD_FILTER) ← 사전(확장 사전) ← INSERT
    let h = owner, ins = null
    for (let hop = 0; hop < 3 && h; hop++) {
      const o = findByHandle(text, h)
      if (!o) break
      if (o.type === 'INSERT') { ins = h; break }
      const ow = o.g.filter(([k]) => k === 330).map(([, v]) => v.trim())
      h = ow.length ? ow[ow.length - 1] : null
    }
    if (!ins) continue
    const M1 = m40.length >= 12 ? m40.slice(0, 12) : I3
    const bp = (pts.length === 2
      ? [[pts[0][0], pts[0][1]], [pts[1][0], pts[0][1]], [pts[1][0], pts[1][1]], [pts[0][0], pts[1][1]]]
      : pts).map(([x, y]) => [M1[0] * x + M1[1] * y + M1[3], M1[4] * x + M1[5] * y + M1[7]])
    map.set(ins.toUpperCase(), bp)
  }
  return map
}

/**
 * DXF 글자 → 평면 그림 모음
 * @returns {{paths, fills, texts, styles, ltypes, clips, box, frames, stats, units, paper}}
 */
export function parsePlot(text, onProgress) {
  const R = reader(text)
  const stats = { ents: 0, verts: 0, capped: false, skipped: {}, unknown: {}, hidden: 0, hatchCut: 0, ver: '', units: 0 }
  const skip = (k, n = 1) => { stats.skipped[k] = (stats.skipped[k] || 0) + n }
  const layers = new Map()           // 이름(대문자) → {rgb, aci, lt, lw, hide}
  const ltypeIx = new Map()          // 이름(대문자) → 번호
  const ltypes = []                  // [{name, dash}]
  const tstyles = new Map()          // 글꼴 모양 이름(대문자) → {wf, ob, h}
  const blocks = new Map()
  const header = { ltscale: 1, insunits: 0 }
  let modelPaper = null

  /* 도형 저장소 */
  const PX = new Grow(Float64Array, 1 << 16)       // 꼭짓점 x,y
  const PS = new Grow(Uint32Array), PN = new Grow(Uint32Array), PY = new Grow(Uint32Array), PC = new Grow(Uint32Array), PF = new Grow(Uint8Array)
  const LX = new Grow(Float64Array, 1 << 12)       // 채움 테두리 꼭짓점
  const LS = new Grow(Uint32Array), LN = new Grow(Uint32Array)
  const FL0 = new Grow(Uint32Array), FLN = new Grow(Uint32Array), FY = new Grow(Uint32Array), FC = new Grow(Uint32Array)
  const texts = []
  const styles = []
  const styleIx = new Map()
  const clips = [null]
  const rects = []                                  // 도곽 후보(닫힌 네모)
  const axisLines = []                              // 도곽 후보(축에 붙은 긴 선) [x0,y0,x1,y1]
  let hatchSegs = 0

  const styleId = (rgb, aci, lw, lt, lts) => {
    const k = rgb[0] + ',' + rgb[1] + ',' + rgb[2] + '|' + aci + '|' + lw + '|' + lt + '|' + (lt >= 0 ? lts.toPrecision(6) : 1)
    let id = styleIx.get(k)
    if (id === undefined) { id = styles.length; styles.push({ rgb, aci, lw, lt, lts: lt >= 0 ? lts : 1 }); styleIx.set(k, id) }
    return id
  }

  /* ── 좌표 ── */
  const P = (M, x, y, z) => M === I3 ? [x, y] : [M[0] * x + M[1] * y + M[2] * z + M[3], M[4] * x + M[5] * y + M[6] * z + M[7]]
  const lin = (M, v) => M === I3 ? [v[0], v[1]] : [M[0] * v[0] + M[1] * v[1] + M[2] * v[2], M[4] * v[0] + M[5] * v[1] + M[6] * v[2]]
  function g1(g, c, d = 0) { for (const [k, v] of g) if (k === c) return num(v); return d }
  function has(g, c) { for (const [k] of g) if (k === c) return true; return false }
  function gs(g, c, d = '') { for (const [k, v] of g) if (k === c) return v.trim(); return d }
  function ext(g) { return ocs(g1(g, 210, 0), g1(g, 220, 0), g1(g, 230, 1)) }

  /* ── 내보내기 ── */
  function addPath(M, pts, closed, sty, cx) {        // pts: [[x,y,z]…] (엔티티 좌표)
    const n = pts.length
    if (n < 2) return
    if (stats.verts + n > MAX_V) { stats.capped = true; return }
    const st = PX.n >> 1
    let cnt = 0, lx = NaN, ly = NaN
    for (let i = 0; i < n; i++) {
      const q = pts[i]
      const w = P(M, q[0], q[1], q[2] || 0)
      if (!Number.isFinite(w[0] + w[1])) continue
      if (w[0] === lx && w[1] === ly) continue
      PX.push2(w[0], w[1]); lx = w[0]; ly = w[1]; cnt++
    }
    if (cnt < 2) { PX.n = st * 2; return }
    PS.push(st); PN.push(cnt); PY.push(sty); PC.push(cx.clip); PF.push(closed ? 1 : 0)
    stats.verts += cnt
    /* 도곽 후보 */
    if (cnt === 2) {
      const a = PX.a, i0 = st * 2
      const x0 = a[i0], y0 = a[i0 + 1], x1 = a[i0 + 2], y1 = a[i0 + 3]
      if (Math.abs(y1 - y0) < 1e-9 * (Math.abs(x1 - x0) + 1) || Math.abs(x1 - x0) < 1e-9 * (Math.abs(y1 - y0) + 1)) axisLines.push([x0, y0, x1, y1])
    } else if ((closed && cnt === 4) || cnt === 5) rectCand(st, cnt)
  }
  function rectCand(st, cnt) {
    const a = PX.a, i0 = st * 2
    if (cnt === 5 && (Math.abs(a[i0] - a[i0 + 8]) > 1e-6 * (Math.abs(a[i0]) + 1) || Math.abs(a[i0 + 1] - a[i0 + 9]) > 1e-6 * (Math.abs(a[i0 + 1]) + 1))) return
    const xs = [a[i0], a[i0 + 2], a[i0 + 4], a[i0 + 6]], ys = [a[i0 + 1], a[i0 + 3], a[i0 + 5], a[i0 + 7]]
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys)
    const w = x1 - x0, h = y1 - y0
    if (!(w > 0 && h > 0)) return
    const tol = Math.max(w, h) * 1e-4
    for (let k = 0; k < 4; k++) {
      const onX = Math.abs(xs[k] - x0) < tol || Math.abs(xs[k] - x1) < tol
      const onY = Math.abs(ys[k] - y0) < tol || Math.abs(ys[k] - y1) < tol
      if (!onX || !onY) return
    }
    rects.push([x0, y0, x1, y1])
  }
  function addFill(M, loops, sty, cx) {              // loops: [[[x,y,z]…]…]
    const l0 = LS.n
    let nl = 0
    for (const L of loops) {
      if (L.length < 3) continue
      const st = LX.n >> 1
      let c = 0
      for (const q of L) {
        const w = P(M, q[0], q[1], q[2] || 0)
        if (!Number.isFinite(w[0] + w[1])) continue
        LX.push2(w[0], w[1]); c++
      }
      if (c < 3) { LX.n = st * 2; continue }
      LS.push(st); LN.push(c); nl++
      stats.verts += c
    }
    if (!nl) return
    FL0.push(l0); FLN.push(nl); FY.push(sty); FC.push(cx.clip)
  }

  /* ── 층·색·선 종류·굵기 ── */
  const L0 = { rgb: [255, 255, 255], aci: 7, lt: -1, lw: -3, hide: false }
  const layerOf = (ly) => layers.get(ly.toUpperCase()) || L0
  function ltOf(name) {
    const u = name.toUpperCase()
    if (!u || u === 'CONTINUOUS' || u === 'BYLAYER' || u === 'BYBLOCK') return -1
    const i = ltypeIx.get(u)
    return i === undefined ? -1 : i
  }
  function resolve(g, ly, cx) {
    let tc = null, ci = 256
    for (const [k, v] of g) { if (k === 420) tc = parseInt(v, 10); else if (k === 62) ci = parseInt(v, 10) }
    const L = layerOf(ly)
    let rgb, aci
    if (tc !== null && Number.isFinite(tc)) { rgb = [(tc >> 16) & 255, (tc >> 8) & 255, tc & 255]; aci = -1 }
    else if (!Number.isFinite(ci) || ci === 256) { rgb = L.rgb; aci = L.aci }
    else if (ci === 0) { rgb = cx.rgb || [255, 255, 255]; aci = cx.aci ?? 7 }
    else { rgb = aciRgb(ci); aci = Math.abs(ci) }
    const ltn = gs(g, 6, 'BYLAYER').toUpperCase()
    let lt, ltsBase = 1
    if (ltn === 'BYLAYER') lt = L.lt
    else if (ltn === 'BYBLOCK') { lt = cx.lt ?? -1; ltsBase = cx.ltsB ?? 1 }
    else lt = ltOf(ltn)
    let lw = g1(g, 370, -1)
    if (lw === -1) lw = L.lw
    else if (lw === -2) lw = cx.lw ?? -3
    const lts = g1(g, 48, 1) * ltsBase * (cx.ltsMul || 1)
    return { rgb, aci, lw, lt, lts, sty: styleId(rgb, aci, lw, lt, lts * header.ltscale) }
  }

  /* ── 읽기 ── */
  let pair = R.next()
  const readEnt = (type) => {
    const g = []
    pair = R.next()
    while (pair && pair[0] !== 0) { g.push(pair); pair = R.next() }
    return { t: type, g }
  }
  const readFull = () => {
    const type = pair[1].trim()
    const e = readEnt(type)
    if (type === 'POLYLINE') {
      e.v = []
      while (pair && pair[0] === 0 && pair[1].trim() === 'VERTEX') e.v.push(readEnt('VERTEX'))
      if (pair && pair[0] === 0 && pair[1].trim() === 'SEQEND') readEnt('SEQEND')
    } else if (type === 'INSERT') {
      if (e.g.some(([c, v]) => c === 66 && num(v) === 1)) {
        e.att = []
        while (pair && pair[0] === 0 && pair[1].trim() === 'ATTRIB') e.att.push(readEnt('ATTRIB'))
        if (pair && pair[0] === 0 && pair[1].trim() === 'SEQEND') readEnt('SEQEND')
      }
    }
    return e
  }

  /* ── 모양 만들기 도우미 ── */
  function bulgeTo(a, c, bulge, z, arr) {             // a 는 넣고 c 는 안 넣음
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
    const n = Math.max(2, Math.min(72, Math.ceil(Math.abs(th) / (Math.PI / 32))))
    const R2 = Math.abs(r)
    for (let i = 1; i < n; i++) {
      const t = a0 + (th * i) / n
      arr.push([cx + R2 * Math.cos(t), cy + R2 * Math.sin(t), z])
    }
  }
  function arc(cx, cy, cz, r, s, e) {                 // 라디안, 반시계
    let sw = e - s
    while (sw <= 0) sw += Math.PI * 2
    const n = Math.max(8, Math.min(144, Math.ceil((sw / (Math.PI * 2)) * 128)))
    const a = []
    for (let i = 0; i <= n; i++) { const t = s + (sw * i) / n; a.push([cx + r * Math.cos(t), cy + r * Math.sin(t), cz]) }
    return a
  }
  /** 굵은 폴리선 → 띠 모양 채움 (pts: [[x,y,z,w]…], 꼭짓점마다 폭) */
  function ribbon(pts, closed) {
    const n = pts.length
    if (n < 2) return null
    const L = [], Rt = []
    for (let i = 0; i < n; i++) {
      const p = pts[i]
      const a = pts[i - 1] || (closed ? pts[n - 2] : null), b = pts[i + 1] || (closed ? pts[1] : null)
      let nx = 0, ny = 0
      const add = (u, v) => { const dx = v[0] - u[0], dy = v[1] - u[1], d = Math.hypot(dx, dy); if (d > 0) { nx += -dy / d; ny += dx / d } }
      if (a) add(a, p)
      if (b) add(p, b)
      const d = Math.hypot(nx, ny) || 1
      nx /= d; ny /= d
      const w = (p[3] || 0) / 2
      L.push([p[0] + nx * w, p[1] + ny * w, p[2]])
      Rt.push([p[0] - nx * w, p[1] - ny * w, p[2]])
    }
    return L.concat(Rt.reverse())
  }

  /* ── 해치 ── */
  function hatch(g, M, rs, cx) {
    const O = ext(g); const MM = O ? mul(M, O) : M
    const z = g1(g, 30, 0)
    const loops = []
    const lines = []                                   // 무늬 줄: {a, bx, by, ox, oy, dash}
    let solid = false, name = ''
    let i = 0
    const N = g.length
    // 앞부분: 2 이름, 70 채움, 91 경계 수 … 순서대로 걷습니다
    while (i < N && g[i][0] !== 91) {
      if (g[i][0] === 2) name = g[i][1].trim()
      else if (g[i][0] === 70) solid = num(g[i][1]) === 1
      i++
    }
    const npath = i < N ? num(g[i][1]) : 0
    i++
    const at = (c) => (i < N && g[i][0] === c ? num(g[i++][1]) : null)
    const want = (c) => { while (i < N && g[i][0] !== c) i++; return i < N ? num(g[i++][1]) : 0 }
    for (let pth = 0; pth < npath && i < N; pth++) {
      const flag = want(92)
      const pts = []
      if (flag & 2) {                                   // 폴리선 경계
        const hb = at(72) || 0
        at(73)
        const nv = want(93)
        const vs = []
        for (let k = 0; k < nv && i < N; k++) {
          const x = want(10), y = want(20)
          const b = hb ? (g[i] && g[i][0] === 42 ? num(g[i++][1]) : 0) : 0
          vs.push([x, y, b])
        }
        for (let k = 0; k < vs.length; k++) bulgeTo(vs[k], vs[(k + 1) % vs.length], vs[k][2], z, pts)
      } else {
        const ne = want(93)
        for (let k = 0; k < ne && i < N; k++) {
          const et = want(72)
          if (et === 1) {
            const x0 = want(10), y0 = want(20), x1 = want(11), y1 = want(21)
            pts.push([x0, y0, z], [x1, y1, z])
          } else if (et === 2) {
            const x = want(10), y = want(20), r = want(40), s = want(50), e = want(51), ccw = at(73)
            let a
            if (ccw === 0) { a = arc(x, y, z, r, -e * D2R, -s * D2R).reverse() }
            else a = arc(x, y, z, r, s * D2R, e * D2R)
            for (const q of a) pts.push(q)
          } else if (et === 3) {
            const x = want(10), y = want(20), mx = want(11), my = want(21), ra = want(40), s = want(50), e = want(51), ccw = at(73)
            const ang = Math.atan2(my, mx), A = Math.hypot(mx, my), B = A * ra
            let s0 = s * D2R, e0 = e * D2R
            if (ccw === 0) { const t = s0; s0 = -e0; e0 = -t }
            let sw = e0 - s0
            while (sw <= 0) sw += Math.PI * 2
            const n = Math.max(8, Math.ceil((sw / (Math.PI * 2)) * 96))
            const seg = []
            for (let q = 0; q <= n; q++) {
              const u = s0 + (sw * q) / n
              const ex = A * Math.cos(u), ey = B * Math.sin(u)
              seg.push([x + ex * Math.cos(ang) - ey * Math.sin(ang), y + ex * Math.sin(ang) + ey * Math.cos(ang), z])
            }
            if (ccw === 0) seg.reverse()
            for (const q of seg) pts.push(q)
          } else if (et === 4) {
            const deg = want(94); at(73); at(74)
            const nk = want(95), nc = want(96)
            const kn = [], cp = [], wt = []
            for (let q = 0; q < nk && i < N; q++) kn.push(want(40))
            for (let q = 0; q < nc && i < N; q++) {
              const x = want(10), y = want(20)
              cp.push([x, y, z])
              if (g[i] && g[i][0] === 42) wt.push(num(g[i++][1]))
            }
            const nf = g[i] && g[i][0] === 97 && g[i + 1] && g[i + 1][0] === 11 ? num(g[i++][1]) : 0
            const fit = []
            for (let q = 0; q < nf && i < N; q++) { const x = want(11), y = want(21); fit.push([x, y, z]) }
            let sp = null
            if (cp.length > deg && kn.length === cp.length + deg + 1) sp = bspline(deg, cp, kn, wt.length === cp.length ? wt : null)
            for (const q of sp || (fit.length >= 2 ? fit : cp)) pts.push([q[0], q[1], z])
          }
        }
      }
      // 원본 경계 개수(97) + 330 들은 건너뜁니다
      if (i < N && g[i][0] === 97) { const ns = num(g[i++][1]); for (let q = 0; q < ns && i < N && g[i][0] === 330; q++) i++ }
      if (pts.length >= 3) loops.push(pts)
    }
    // 무늬 줄
    while (i < N && g[i][0] !== 78) i++
    if (!solid && i < N) {
      const nl = num(g[i++][1])
      for (let k = 0; k < nl && i < N; k++) {
        const a = want(53), bx = want(43), by = want(44), ox = want(45), oy = want(46)
        const nd = at(79) || 0
        const dash = []
        for (let q = 0; q < nd && i < N; q++) dash.push(want(49))
        lines.push({ a: a * D2R, bx, by, ox, oy, dash })
      }
    }
    if (!loops.length) return
    if (solid || /^SOLID/i.test(name)) { addFill(MM, loops, rs.sty, cx); return }
    // 무늬: 도면 좌표(월드)로 옮긴 뒤 만듭니다
    const W = loops.map((L) => L.map((q) => P(MM, q[0], q[1], q[2] || 0)))
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
    for (const L of W) for (const q of L) { if (q[0] < x0) x0 = q[0]; if (q[0] > x1) x1 = q[0]; if (q[1] < y0) y0 = q[1]; if (q[1] > y1) y1 = q[1] }
    if (!Number.isFinite(x0 + x1 + y0 + y1)) return
    const sty = styleId(rs.rgb, rs.aci, rs.lw, -1, 1)
    const edges = []
    for (const L of W) for (let k = 0; k < L.length; k++) { const a = L[k], b = L[(k + 1) % L.length]; edges.push(a[0], a[1], b[0], b[1]) }
    let made = 0
    const cap = Math.min(400000, MAX_HATCH_SEG - hatchSegs)
    for (const pl of lines) {
      // 선 방향·간격을 월드로
      const u0 = lin(MM, [Math.cos(pl.a), Math.sin(pl.a), 0])
      const us = Math.hypot(u0[0], u0[1]) || 1
      const ux = u0[0] / us, uy = u0[1] / us
      const nx = -uy, ny = ux
      const b = P(MM, pl.bx, pl.by, z)
      const o = lin(MM, [pl.ox, pl.oy, 0])
      const sp = o[0] * nx + o[1] * ny
      if (!(Math.abs(sp) > 1e-9)) continue
      let dash = pl.dash.map((d) => d * us)
      const per = dash.reduce((s2, d) => s2 + Math.abs(d), 0)
      if (dash.length && !dash.some((d) => d >= 0)) continue
      if (per > 0 && per < (x1 - x0 + y1 - y0) * 1e-5) dash = []
      const cs = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]].map(([x, y]) => ((x - b[0]) * nx + (y - b[1]) * ny) / sp)
      const k0 = Math.floor(Math.min(...cs)), k1 = Math.ceil(Math.max(...cs))
      if (k1 - k0 > 20000) { stats.hatchCut++; made = -1; break }
      const tsBuf = []
      for (let k = k0; k <= k1; k++) {
        const qx = b[0] + k * o[0], qy = b[1] + k * o[1]
        tsBuf.length = 0
        for (let e = 0; e < edges.length; e += 4) {
          const ax = edges[e], ay = edges[e + 1], bx2 = edges[e + 2], by2 = edges[e + 3]
          const da = (ax - qx) * nx + (ay - qy) * ny, db = (bx2 - qx) * nx + (by2 - qy) * ny
          if ((da > 0) === (db > 0)) continue
          const ta = (ax - qx) * ux + (ay - qy) * uy, tb = (bx2 - qx) * ux + (by2 - qy) * uy
          tsBuf.push(ta + (da / (da - db)) * (tb - ta))
        }
        if (tsBuf.length < 2) continue
        tsBuf.sort((p, q) => p - q)
        for (let m = 0; m + 1 < tsBuf.length; m += 2) {
          const t0 = tsBuf[m], t1 = tsBuf[m + 1]
          if (!(t1 > t0)) continue
          const seg = (a0, a1) => {
            if (made >= cap) return
            addPath(I3, [[qx + ux * a0, qy + uy * a0], [qx + ux * a1, qy + uy * a1]], false, sty, cx)
            made++
          }
          if (!dash.length || !(per > 0)) { seg(t0, t1); continue }
          // 무늬 자리: 줄의 시작점(q)에서 dash 가 시작합니다
          let s = Math.floor(t0 / per) * per
          while (s < t1 && made < cap) {
            for (const d of dash) {
              const len = Math.abs(d)
              if (d >= 0) {
                const a0 = Math.max(s, t0), a1 = Math.min(s + (d === 0 ? per * 0.002 : len), t1)
                if (a1 > a0 || (d === 0 && s >= t0 && s <= t1)) seg(a0, Math.max(a1, a0 + per * 0.001))
              }
              s += len
              if (s >= t1) break
            }
          }
        }
        if (made >= cap) break
      }
      if (made >= cap) break
    }
    if (made >= cap) { stats.hatchCut++; made = -1 - made }
    if (made < 0) {                                     // 너무 촘촘 — 테두리만
      for (const L of W) addPath(I3, L.concat([L[0]]), true, sty, cx)
    }
    hatchSegs += made < 0 ? -1 - made : made
  }

  /* ── 글자 ── */
  function pushText(o) { if (texts.length < 400000 && o.s) texts.push(o) }
  function textEnt(e, g, M, rs, cx) {
    const t = e.t
    if (t === 'ATTRIB' && (g1(g, 70, 0) & 1)) return
    const st = tstyles.get(gs(g, 7, 'STANDARD').toUpperCase()) || {}
    if (t === 'MTEXT') {
      let raw = ''
      for (const [k, v] of g) if (k === 3) raw += v
      raw += gs(g, 1)
      const h = g1(g, 40, 0) || st.h || 2.5
      const p = P(M, g1(g, 10), g1(g, 20), g1(g, 30))
      let dir
      if (has(g, 11)) dir = lin(M, [g1(g, 11), g1(g, 21), g1(g, 31)])
      else {
        const O = ext(g); const MM = O ? mul(M, O) : M
        const r = g1(g, 50, 0)
        dir = lin(MM, [Math.cos(r), Math.sin(r), 0])
      }
      const a = Math.atan2(dir[1], dir[0])
      const sx = M === I3 ? 1 : Math.hypot(M[0], M[4], M[8])
      const sy = M === I3 ? 1 : Math.hypot(M[1], M[5], M[9])
      const det = M === I3 ? 1 : M[0] * M[5] - M[1] * M[4]
      pushText({ mt: 1, lines: mtextLines(raw), s: 'm', x: p[0], y: p[1], h: h * sy, a, wf: (st.wf || 1) * (sx / (sy || 1)),
        ob: (st.ob || 0) * D2R, w: g1(g, 41, 0) * sx, at: g1(g, 71, 1) || 1, ls: g1(g, 44, 1) || 1,
        mir: det < 0, sty: rs.sty, clip: cx.clip })
      return
    }
    const s = cadText(unesc(gs(g, 1)))
    if (!s.trim()) return
    const O = ext(g); const MM = O ? mul(M, O) : M
    const h0 = g1(g, 40, 0) || st.h || 2.5
    const r = g1(g, 50, 0) * D2R
    const wf = g1(g, 41, 0) || st.wf || 1
    const ob = (has(g, 51) ? g1(g, 51, 0) : (st.ob || 0)) * D2R
    const hj = g1(g, 72, 0), vj = t === 'ATTRIB' ? g1(g, 74, 0) : g1(g, 73, 0)
    const gen = g1(g, 71, 0)
    const p1 = [g1(g, 10), g1(g, 20), g1(g, 30)]
    const p2 = has(g, 11) ? [g1(g, 11), g1(g, 21), g1(g, 31)] : p1
    const useP2 = (hj !== 0 || vj !== 0) && has(g, 11)
    const A = P(MM, ...(useP2 ? p2 : p1))
    const d = lin(MM, [Math.cos(r), Math.sin(r), 0]), u = lin(MM, [-Math.sin(r), Math.cos(r), 0])
    const sx = Math.hypot(d[0], d[1]) || 1, sy = Math.hypot(u[0], u[1]) || 1
    const o = { s, x: A[0], y: A[1], h: h0 * sy, a: Math.atan2(d[1], d[0]), wf: wf * sx / sy, ob, hj, vj,
      mir: ((d[0] * u[1] - d[1] * u[0]) < 0) !== !!(gen & 2), ud: !!(gen & 4), sty: rs.sty, clip: cx.clip }
    if ((hj === 3 || hj === 5) && has(g, 11)) {
      const B1 = P(MM, ...p1), B2 = P(MM, ...p2)
      o.x = B1[0]; o.y = B1[1]; o.x2 = B2[0]; o.y2 = B2[1]; o.a = Math.atan2(B2[1] - B1[1], B2[0] - B1[0])
    }
    pushText(o)
  }

  /* ── 그리기 ── */
  const clipMap = scanClips(text)
  function draw(e, M, cx, depth) {
    const g = e.g
    if (g1(g, 67, 0) === 1) { skip('배치(종이) 공간'); return }
    if (g1(g, 60, 0) === 1) return
    let ly = gs(g, 8, '0')
    if (ly === '0' && cx.ly) ly = cx.ly
    const L = layerOf(ly)
    const t = e.t
    if (L.hide && !(t === 'INSERT' && !L.frozen)) { stats.hidden++; return }
    stats.ents++
    const rs = resolve(g, ly, cx)
    switch (t) {
      case 'LINE':
        addPath(M, [[g1(g, 10), g1(g, 20), g1(g, 30)], [g1(g, 11), g1(g, 21), g1(g, 31)]], false, rs.sty, cx)
        return
      case 'LWPOLYLINE': {
        const O = ext(g); const MM = O ? mul(M, O) : M
        const z = g1(g, 38, 0)
        const cw = g1(g, 43, 0)
        const vs = []
        let cur = null, wide = cw > 0
        for (const [k, v] of g) {
          if (k === 10) { cur = [num(v), 0, 0, cw, cw]; vs.push(cur) }
          else if (k === 20 && cur) cur[1] = num(v)
          else if (k === 42 && cur) cur[2] = num(v)
          else if (k === 40 && cur) { cur[3] = num(v); if (cur[3] > 0) wide = true }
          else if (k === 41 && cur) { cur[4] = num(v); if (cur[4] > 0) wide = true }
        }
        const closed = (g1(g, 70, 0) & 1) === 1
        polyOut(MM, vs, closed, z, wide, rs, cx)
        return
      }
      case 'POLYLINE': {
        const fl = g1(g, 70, 0)
        const V = (e.v || []).map((x) => ({ x: g1(x.g, 10), y: g1(x.g, 20), z: g1(x.g, 30), f: g1(x.g, 70, 0), bu: g1(x.g, 42, 0),
          w0: g1(x.g, 40, g1(g, 40, 0)), w1: g1(x.g, 41, g1(g, 41, 0)), i: [g1(x.g, 71, 0), g1(x.g, 72, 0), g1(x.g, 73, 0), g1(x.g, 74, 0)] }))
        if (fl & 64) {                                   // 폴리페이스 — 모서리만
          const pv = V.filter((v) => v.f & 64)
          for (const f of V.filter((v) => (v.f & 128) && !(v.f & 64))) {
            const ids = f.i.filter((k) => k !== 0)
            for (let j = 0; j < ids.length; j++) {
              if (ids[j] < 0) continue
              const a = pv[Math.abs(ids[j]) - 1], c = pv[Math.abs(ids[(j + 1) % ids.length]) - 1]
              if (a && c) addPath(M, [[a.x, a.y, a.z], [c.x, c.y, c.z]], false, rs.sty, cx)
            }
          }
          return
        }
        if (fl & 16) {                                   // M×N 메쉬
          const m = g1(g, 71, 0), n = g1(g, 72, 0)
          if (m > 0 && n > 0 && V.length >= m * n) {
            for (let a = 0; a < m; a++) addPath(M, V.slice(a * n, a * n + n).map((v) => [v.x, v.y, v.z]), !!(fl & 32), rs.sty, cx)
            for (let b = 0; b < n; b++) { const col = []; for (let a = 0; a < m; a++) { const v = V[a * n + b]; col.push([v.x, v.y, v.z]) } addPath(M, col, !!(fl & 1), rs.sty, cx) }
          }
          return
        }
        const vv = V.filter((v) => !(v.f & 16))
        const closed = (fl & 1) === 1
        if (fl & 8) { addPath(M, vv.map((v) => [v.x, v.y, v.z]), closed, rs.sty, cx); return }
        const O = ext(g); const MM = O ? mul(M, O) : M
        const wide = vv.some((v) => v.w0 > 0 || v.w1 > 0)
        polyOut(MM, vv.map((v) => [v.x, v.y, v.bu, v.w0, v.w1]), closed, g1(g, 30, 0), wide, rs, cx)
        return
      }
      case '3DFACE': {
        const q = [0, 1, 2, 3].map((k) => [g1(g, 10 + k), g1(g, 20 + k), g1(g, 30 + k)])
        const hid = g1(g, 70, 0)
        const n = q[3][0] === q[2][0] && q[3][1] === q[2][1] ? 3 : 4
        for (let k = 0; k < n; k++) { if (!(hid & (1 << k))) addPath(M, [q[k], q[(k + 1) % n]], false, rs.sty, cx) }
        return
      }
      case 'SOLID': case 'TRACE': {
        const O = ext(g); const MM = O ? mul(M, O) : M
        const q = [0, 1, 3, 2].map((k) => [g1(g, 10 + k), g1(g, 20 + k), g1(g, 30, 0)])
        addFill(MM, [q], rs.sty, cx)
        return
      }
      case 'CIRCLE': case 'ARC': {
        const O = ext(g); const MM = O ? mul(M, O) : M
        const r = g1(g, 40)
        if (!(r > 0)) return
        const s = t === 'ARC' ? g1(g, 50) * D2R : 0
        const en = t === 'ARC' ? g1(g, 51) * D2R : Math.PI * 2
        addPath(MM, arc(g1(g, 10), g1(g, 20), g1(g, 30), r, s, t === 'ARC' ? en : s + Math.PI * 2), t === 'CIRCLE', rs.sty, cx)
        return
      }
      case 'ELLIPSE': {
        const c = [g1(g, 10), g1(g, 20), g1(g, 30)], mj = [g1(g, 11), g1(g, 21), g1(g, 31)]
        const Nn = [g1(g, 210, 0), g1(g, 220, 0), g1(g, 230, 1)]
        const ratio = g1(g, 40, 1)
        const mn = [Nn[1] * mj[2] - Nn[2] * mj[1], Nn[2] * mj[0] - Nn[0] * mj[2], Nn[0] * mj[1] - Nn[1] * mj[0]]
        const Ln = Math.hypot(...mn) || 1, Lm = Math.hypot(...mj)
        for (let k = 0; k < 3; k++) mn[k] = (mn[k] / Ln) * Lm * ratio
        const s = g1(g, 41, 0), en = g1(g, 42, Math.PI * 2)
        let sw = en - s
        while (sw <= 0) sw += Math.PI * 2
        const n = Math.max(12, Math.min(144, Math.ceil((sw / (Math.PI * 2)) * 128)))
        const pts = []
        for (let i = 0; i <= n; i++) {
          const u = s + (sw * i) / n, cs = Math.cos(u), sn = Math.sin(u)
          pts.push([c[0] + cs * mj[0] + sn * mn[0], c[1] + cs * mj[1] + sn * mn[1], c[2] + cs * mj[2] + sn * mn[2]])
        }
        addPath(M, pts, false, rs.sty, cx)
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
        addPath(M, pts, false, rs.sty, cx)
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
        addPath(M, pts, false, rs.sty, cx)
        return
      }
      case 'HATCH': hatch(g, M, rs, cx); return
      case 'TEXT': case 'MTEXT': case 'ATTRIB': textEnt(e, g, M, rs, cx); return
      case 'INSERT': case 'DIMENSION': {
        const ltsOwn = rs.lts / (cx.ltsMul || 1)
        if (e.att) for (const a of e.att) draw(a, M, { ...cx, ly, rgb: rs.rgb, aci: rs.aci, lt: rs.lt, ltsB: ltsOwn, lw: rs.lw }, depth + 1)
        const name = gs(g, 2)
        const bl = blocks.get(name.toUpperCase())
        if (!bl) { if (t === 'INSERT') skip('없는 블록'); return }
        if (depth > 16) return
        const inCx = { ly, rgb: rs.rgb, aci: rs.aci, lt: rs.lt, ltsB: ltsOwn, lw: rs.lw, ltsMul: cx.ltsMul || 1, clip: cx.clip }
        if (t === 'DIMENSION') { for (const s of bl.ents) { draw(s, M, inCx, depth + 1); if (stats.capped) return } return }
        const O = ext(g)
        const sx = g1(g, 41, 1), sy = g1(g, 42, 1), sz = g1(g, 43, 1)
        const rot = g1(g, 50, 0) * D2R
        const cs = Math.cos(rot), sn = Math.sin(rot)
        const ix = g1(g, 10), iy = g1(g, 20), iz = g1(g, 30)
        const [bx, by, bz] = bl.base
        const cols = Math.max(1, g1(g, 70, 1)), rows = Math.max(1, g1(g, 71, 1))
        const csp = g1(g, 44, 0), rsp = g1(g, 45, 0)
        inCx.ltsMul = (cx.ltsMul || 1) * Math.sqrt(Math.abs(sx * sy)) || 1
        const clipPts = clipMap.get(gs(g, 5).toUpperCase())
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
          const ox = c * csp, oy = r * rsp
          let Lm = [cs * sx, -sn * sy, 0, cs * (ox - sx * bx) - sn * (oy - sy * by) + ix,
            sn * sx, cs * sy, 0, sn * (ox - sx * bx) + cs * (oy - sy * by) + iy,
            0, 0, sz, -sz * bz + iz]
          if (O) Lm = mul(O, Lm)
          const X = mul(M, Lm)
          if (clipPts && rows * cols === 1) {
            const poly = clipPts.map(([x, y]) => P(X, x, y, 0))
            clips.push(poly)
            inCx.clip = clips.length - 1
          }
          for (const s of bl.ents) { draw(s, X, inCx, depth + 1); if (stats.capped) return }
        }
        return
      }
      default: {
        if (t in NOT_DRAWN) { const k = NOT_DRAWN[t]; if (k) skip(k); stats.ents-- }
        else { stats.unknown[t] = (stats.unknown[t] || 0) + 1; stats.ents-- }
      }
    }
  }
  function polyOut(MM, vs, closed, z, wide, rs, cx) {
    const pts = []
    for (let i = 0; i < vs.length; i++) {
      const a = vs[i], c = vs[i + 1] || (closed ? vs[0] : null)
      if (c) {
        const st = pts.length
        bulgeTo(a, c, a[2], z, pts)
        if (wide) {                                      // 폭을 토막 안에서 고르게
          const k = pts.length - st
          for (let j = 0; j < k; j++) pts[st + j][3] = a[3] + ((a[4] - a[3]) * j) / Math.max(1, k)
        }
      } else pts.push([a[0], a[1], z, a[3]])
    }
    if (closed && pts.length) pts.push([pts[0][0], pts[0][1], z, pts[0][3]])
    if (!closed && wide && vs.length) { const last = vs[vs.length - 1]; if (pts.length) pts[pts.length - 1][3] = vs.length > 1 ? vs[vs.length - 2][4] : last[3] }
    if (wide && pts.length >= 2) {
      // 폭이 모두 같고 넓지 않으면 선으로(굵기는 채움과 같게 보이도록) — 여기서는 늘 채움으로
      const rb = ribbon(pts, closed)
      if (rb) { addFill(MM, [rb], rs.sty, cx); return }
    }
    addPath(MM, pts, false, rs.sty, cx)
  }

  /* ── 섹션 돌기 ── */
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
          else if (key === '$LTSCALE' && pair[0] === 40) header.ltscale = num(pair[1]) || 1
          pair = R.next()
        }
      } else if (sec === 'TABLES') {
        let table = ''
        while (pair && !(pair[0] === 0 && pair[1].trim() === 'ENDSEC')) {
          if (pair[0] === 0 && pair[1].trim() === 'TABLE') {
            pair = R.next(); table = pair && pair[0] === 2 ? pair[1].trim() : ''; pair = R.next(); continue
          }
          if (pair[0] === 0 && pair[1].trim() === 'ENDTAB') { table = ''; pair = R.next(); continue }
          if (pair[0] === 0 && table === 'LAYER' && pair[1].trim() === 'LAYER') {
            const e = readEnt('LAYER')
            const name = unesc(gs(e.g, 2))
            const ci = g1(e.g, 62, 7), fl = g1(e.g, 70, 0)
            let tc = null
            for (const [k, v] of e.g) if (k === 420) tc = parseInt(v, 10)
            const rgb = tc !== null && Number.isFinite(tc) ? [(tc >> 16) & 255, (tc >> 8) & 255, tc & 255] : aciRgb(ci)
            const off = ci < 0, frozen = (fl & 1) === 1
            const plot = g1(e.g, 290, 1) !== 0
            layers.set(name.toUpperCase(), {
              rgb, aci: tc !== null && Number.isFinite(tc) ? -1 : Math.abs(ci), ltName: unesc(gs(e.g, 6, 'CONTINUOUS')),
              lw: g1(e.g, 370, -3), off, frozen, hide: off || frozen || !plot || name.toUpperCase() === 'DEFPOINTS',
            })
            continue
          }
          if (pair[0] === 0 && table === 'LTYPE' && pair[1].trim() === 'LTYPE') {
            const e = readEnt('LTYPE')
            const name = unesc(gs(e.g, 2)).toUpperCase()
            const dash = e.g.filter(([k]) => k === 49).map(([, v]) => num(v))
            if (name && dash.length && dash.some((d) => d !== 0)) { ltypeIx.set(name, ltypes.length); ltypes.push({ name, dash }) }
            continue
          }
          if (pair[0] === 0 && table === 'STYLE' && pair[1].trim() === 'STYLE') {
            const e = readEnt('STYLE')
            tstyles.set(unesc(gs(e.g, 2)).toUpperCase(), { wf: g1(e.g, 41, 1) || 1, ob: g1(e.g, 50, 0), h: g1(e.g, 40, 0) })
            continue
          }
          pair = R.next()
        }
        for (const L of layers.values()) L.lt = ltOf(L.ltName)
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
          if (t === 'ENDBLK') { if (cur) blocks.set(cur.name.toUpperCase(), cur); cur = null; readEnt('ENDBLK'); continue }
          const e = readFull()
          if (cur && !/^\*paper_space/i.test(cur.name)) {
            for (const kv of e.g) if (kv[0] === 8 || kv[0] === 2 || kv[0] === 6 || kv[0] === 7) kv[1] = unesc(kv[1])
            cur.ents.push(e)
          }
        }
      } else if (sec === 'ENTITIES') {
        let last = 0
        while (pair && !(pair[0] === 0 && pair[1].trim() === 'ENDSEC')) {
          if (pair[0] !== 0) { pair = R.next(); continue }
          const e = readFull()
          for (const kv of e.g) if (kv[0] === 8 || kv[0] === 2 || kv[0] === 6 || kv[0] === 7) kv[1] = unesc(kv[1])
          if (!stats.capped) draw(e, I3, { ltsMul: 1, clip: 0 }, 0)
          if (onProgress && R.pos - last > 2_000_000) { last = R.pos; onProgress(R.pos / R.len) }
        }
      } else if (sec === 'OBJECTS') {
        while (pair && !(pair[0] === 0 && pair[1].trim() === 'ENDSEC')) {
          if (pair[0] === 0 && pair[1].trim() === 'LAYOUT') {
            const e = readEnt('LAYOUT')
            const nm = e.g.filter(([k]) => k === 1).map(([, v]) => v.trim())
            if (nm.includes('Model')) {
              const pw = g1(e.g, 44, 0), ph = g1(e.g, 45, 0), rot = g1(e.g, 73, 0)
              if (pw > 50 && ph > 50) modelPaper = rot === 1 || rot === 3 ? [ph, pw] : [pw, ph]
            }
            continue
          }
          pair = R.next()
        }
      } else {
        while (pair && !(pair[0] === 0 && pair[1].trim() === 'ENDSEC')) pair = R.next()
      }
    }
    pair = R.next()
  }
  stats.units = header.insunits

  /* ── 묶기 ── */
  const paths = { xy: PX.done(), st: PS.done(), n: PN.done(), sty: PY.done(), clip: PC.done(), closed: PF.done() }
  const fills = { xy: LX.done(), lst: LS.done(), ln: LN.done(), l0: FL0.done(), nl: FLN.done(), sty: FY.done(), clip: FC.done() }
  const np = paths.st.length, nf = fills.l0.length
  paths.box = new Float64Array(np * 4)
  for (let i = 0; i < np; i++) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
    const a = paths.xy, s = paths.st[i] * 2, e = s + paths.n[i] * 2
    for (let k = s; k < e; k += 2) { const x = a[k], y = a[k + 1]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y }
    paths.box[i * 4] = x0; paths.box[i * 4 + 1] = y0; paths.box[i * 4 + 2] = x1; paths.box[i * 4 + 3] = y1
  }
  fills.box = new Float64Array(nf * 4)
  for (let i = 0; i < nf; i++) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
    for (let l = fills.l0[i]; l < fills.l0[i] + fills.nl[i]; l++) {
      const s = fills.lst[l] * 2, e = s + fills.ln[l] * 2
      for (let k = s; k < e; k += 2) { const x = fills.xy[k], y = fills.xy[k + 1]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y }
    }
    fills.box[i * 4] = x0; fills.box[i * 4 + 1] = y0; fills.box[i * 4 + 2] = x1; fills.box[i * 4 + 3] = y1
  }
  const box = robustBox(paths, texts)
  const frames = findFrames(rects, axisLines, box, paths)
  return { paths, fills, texts, styles, ltypes, clips, box, frames, stats, units: header.insunits, paper: modelPaper }
}

/** 튀는 점(수 km 밖 찌꺼기)에 끌리지 않는 도면 범위 — 꼭짓점 0.3~99.7% */
function robustBox(paths, texts) {
  const a = paths.xy
  const n = a.length >> 1
  if (!n) {
    if (!texts.length) return [0, 0, 100, 100]
    const xs = texts.map((t) => t.x), ys = texts.map((t) => t.y)
    return [Math.min(...xs), Math.min(...ys), Math.max(...xs) + 1, Math.max(...ys) + 1]
  }
  const step = Math.max(1, Math.floor(n / 200000))
  const xs = [], ys = []
  for (let i = 0; i < n; i += step) { xs.push(a[i * 2]); ys.push(a[i * 2 + 1]) }
  xs.sort((p, q) => p - q); ys.sort((p, q) => p - q)
  const q = (arr, f) => arr[Math.min(arr.length - 1, Math.max(0, Math.floor(arr.length * f)))]
  let x0 = q(xs, 0.003), x1 = q(xs, 0.997), y0 = q(ys, 0.003), y1 = q(ys, 0.997)
  const w = x1 - x0 || 1, h = y1 - y0 || 1
  x0 -= w * 0.02; x1 += w * 0.02; y0 -= h * 0.02; y1 += h * 0.02
  return [x0, y0, x1, y1]
}

/* ── 도곽 찾기 ─────────────────────────────────────────
   종이(A·B 계열)는 가로:세로 = √2 : 1. 도곽은 그 비율의 큰 네모입니다.
   ① 닫힌 네모(폴리선) ② 가로·세로 긴 선 네 개로 된 네모 — 둘 다 봅니다.
   바깥 재단선 안에 안쪽 테두리가 또 있으면 바깥 것만 남깁니다. */
const PAPERS = [['A0', 1189, 841], ['A1', 841, 594], ['A2', 594, 420], ['A3', 420, 297], ['A4', 297, 210]]
const NICE = [1, 2, 2.5, 3, 4, 5, 6, 8, 10, 15, 20, 25, 30, 40, 50, 60, 75, 80, 100, 120, 125, 150, 200, 250, 300, 400,
  500, 600, 700, 750, 800, 1000, 1200, 1250, 1500, 2000, 2500, 3000, 4000, 5000, 6000, 10000]
export function guessScale(w, h, units) {
  const mm = { 1: 25.4, 2: 304.8, 4: 1, 5: 10, 6: 1000, 7: 1e6 }[units] || 1
  const W = Math.max(w, h) * mm
  let best = null
  for (const [nm, pw] of PAPERS) {
    for (const trim of [1, 0.976, 0.965]) {             // 바깥 재단선 / 안쪽 테두리
      const s = W / (pw * trim)
      for (const n of NICE) {
        const err = Math.abs(s - n) / n
        if (err < 0.02 && (!best || err < best.err - 1e-6 || (Math.abs(err - best.err) < 1e-6 && nm === 'A1'))) best = { paper: nm, scale: n, err }
      }
    }
  }
  return best
}
function findFrames(rects, lines, box, paths) {
  const diag = Math.hypot(box[2] - box[0], box[3] - box[1])
  const cand = []
  const ok = (w, h) => { const r = Math.max(w, h) / Math.min(w, h); return r > 1.33 && r < 1.5 }
  for (const r of rects) { const w = r[2] - r[0], h = r[3] - r[1]; if (ok(w, h) && Math.max(w, h) > diag * 0.02) cand.push(r) }
  /* 긴 선 네모 */
  const minL = diag * 0.03
  const H = [], V = []
  for (const [x0, y0, x1, y1] of lines) {
    if (Math.abs(y1 - y0) < 1e-9 && Math.abs(x1 - x0) > minL) H.push([Math.min(x0, x1), Math.max(x0, x1), y0])
    else if (Math.abs(x1 - x0) < 1e-9 && Math.abs(y1 - y0) > minL) V.push([Math.min(y0, y1), Math.max(y0, y1), x0])
  }
  if (H.length < 2000 && V.length < 2000) {
    H.sort((p, q) => p[2] - q[2])
    for (let i = 0; i < H.length; i++) {
      for (let j = i + 1; j < H.length; j++) {
        const a = H[i], b = H[j]
        const w = a[1] - a[0], tol = w * 0.004
        if (Math.abs(a[0] - b[0]) > tol || Math.abs(a[1] - b[1]) > tol) continue
        const h = b[2] - a[2]
        if (!ok(w, h)) continue
        const hasV = (x) => V.some((v) => Math.abs(v[2] - x) < tol && v[0] <= a[2] + tol && v[1] >= b[2] - tol)
        if (hasV(a[0]) && hasV(a[1])) cand.push([a[0], a[2], a[1], b[2]])
      }
    }
  }
  if (!cand.length) return []
  /* 크기: 가장 큰 것의 20% 이상만 */
  const area = (r) => (r[2] - r[0]) * (r[3] - r[1])
  const amax = Math.max(...cand.map(area))
  let keep = cand.filter((r) => area(r) >= amax * 0.2)
  /* 겹치는 것 정리: 같은 네모 · 안에 든 네모 → 바깥 것만 */
  keep.sort((p, q) => area(q) - area(p))
  const out = []
  for (const r of keep) {
    const tol = Math.max(r[2] - r[0], r[3] - r[1]) * 0.002
    const inside = out.some((o) => r[0] >= o[0] - tol && r[1] >= o[1] - tol && r[2] <= o[2] + tol && r[3] <= o[3] + tol)
    if (!inside) out.push(r)
  }
  /* 속이 빈 네모는 뺍니다 (꼭짓점 40개 이상이 안에 있어야) */
  const a = paths.xy
  const n = a.length >> 1
  const step = Math.max(1, Math.floor(n / 300000))
  const cnt = out.map(() => 0)
  for (let i = 0; i < n; i += step) {
    const x = a[i * 2], y = a[i * 2 + 1]
    for (let k = 0; k < out.length; k++) { const r = out[k]; if (x > r[0] && x < r[2] && y > r[1] && y < r[3]) cnt[k]++ }
  }
  const res = out.filter((_, k) => cnt[k] * step >= 40)
  /* 차례: 위 줄부터, 왼쪽부터 */
  if (!res.length) return []
  const hAvg = res.reduce((s, r) => s + (r[3] - r[1]), 0) / res.length
  res.sort((p, q) => {
    const dy = (q[3] + q[1]) / 2 - (p[3] + p[1]) / 2
    if (Math.abs(dy) > hAvg * 0.5) return dy
    return p[0] - q[0]
  })
  return res.map((r) => ({ x0: r[0], y0: r[1], x1: r[2], y1: r[3] }))
}
