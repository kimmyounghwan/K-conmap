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
import { reader, ocs, mul, I3, unesc, num, bspline, aciRgb, 다중지시선 } from './dxf3d.js'
import { cadText, mtextLines } from './dxfplot.js'

const D2R = Math.PI / 180
const MAX_V = 6_000_000
const 더예산 = 4_000_000          /* 🧭 G246 점이 다 찬 뒤 구조 판(opt.범위)에 더 담는 점 */
/* 🧭 G246 끝까지 읽기 — 소장님 「캐드를 완벽하게 읽는 도구를 먼저 개발해」 · 「도면에 있는건 모조리 읽고」
   전엔 점 600만 개에서 «읽기를 멈춤»(그 뒤 글자 · 판까지 버림) — 현장 C 건축 통합본: 판 179장 중 12장 · 글자 52,632개 중 3,454개만 읽었음.
   이제 점이 다 차면 «모양» 만 더 안 담고(개수를 점검 표에) 글자 · 판 테두리(가로 · 세로 곧은 선 = 틀선)는 끝까지 읽음.
   (모양을 다 담으면 현장 D 건축 통합본은 점 5천만 개 넘어 기억이 모자람 — 2,400만 점에서 7 GB 넘어 멈췄음. 모양은 판 단위로 다시 읽기로) */

/** 도형 종류 (E.t) */
/* 🧭 G245 지시선(11) — 지시선 · 다중 지시선의 선은 부재 모양이 아니라 «글자를 가리키는 선» 이라 따로 둠(벽 · 보 · 기둥 찾기 · 길이 셈에 안 섞이게) */
export const 종류 = { 선: 1, 폴리선: 2, 닫힌폴리선: 3, 호: 4, 원: 5, 치수: 6, 해치: 7, 곡선: 8, 글자: 9, 채움: 10, 지시선: 11 }
export const 종류이름 = { 1: '선', 2: '폴리선', 3: '닫힌 폴리선', 4: '호', 5: '원', 6: '치수', 7: '해치', 8: '곡선', 9: '글자', 10: '채움', 11: '지시선' }

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
/**
 * @param opt.범위 [[x0,y0,x1,y1]…] (도면 좌표 · 가운데 빼기 전) — 점이 다 찬(600만) 뒤에도 이 네모들(구조 판)에 걸친 모양은 더 담음(400만 점까지).
 *   점이 차기 전은 예전과 한 자리도 같음. 🧭 G246 큰 통합본의 뒤쪽 구조 판(lib/끝까지읽기.js)
 */
export function 도면읽기(text, onProgress, opt = {}) {
  const 읽을범위 = opt && opt.범위 && opt.범위.length ? opt.범위 : null
  const R = reader(text)
  /* 🧭 G245 읽기 점검 — 파일 속 도형 종류별 개수(블록 정의 안 것도) · 배치(종이) 공간 · 안 보이게 한 것 → lib/읽기점검.js 가 표로 */
  const stats = { ents: 0, verts: 0, capped: false, 못그림: 0, 범위밖: 0, 더담음: 0, 더못: 0, skipped: {}, hidden: 0, ver: '', 파일속: {}, 배치: 0, 배치종류: {}, 안보임: 0, 인쇄안함: 0, 없는블록: {}, 못층: {} }
  const 셈 = (t) => { stats.파일속[t] = (stats.파일속[t] || 0) + 1 }
  const skip = (k) => { stats.skipped[k] = (stats.skipped[k] || 0) + 1 }
  const layers = new Map()        // 대문자 이름 → {i, name, rgb, hide}
  const layerList = []
  const blocks = new Map()
  const 블록rec = new Map()        // BLOCK_RECORD 번호(330) → 블록 — 다중 지시선의 블록 내용(341)이 이 번호로 가리킴
  const header = { insunits: 0 }
  const 무늬 = new Map()

  // 도형(엔티티) 한 개마다
  const Et = new Grow(Uint8Array), Ely = new Grow(Uint16Array), Ergb = new Grow(Uint32Array)
  const Elen = new Grow(Float64Array), Earea = new Grow(Float64Array), Eval = new Grow(Float64Array), Eins = new Grow(Int32Array)
  /* 🧭 G132 — 도형마다 «넣은 배율»(블록을 0.1배로 줄여 넣은 위치도 같은 사본은 물량에서 뺌) */
  const Esc = new Grow(Float32Array)
  let 지금배율 = 1
  /* 🏭 G294 도형마다 «끊어진 선 꼴»(CENTER · HIDDEN · DASHED · PHANTOM …) — 1 도형에 따로 준 것 · 2 층 꼴. 플랜트 기초 도면의 상세 경계(팔각 일점쇄선)는 윤곽이 아님 */
  const Elt = new Grow(Uint8Array)
  let 지금점선 = 0
  const 점선꼴 = /CENTER|HIDDEN|DASH|PHANTOM|DOT|DIVIDE|BORDER|ACAD_ISO0[2-9]|ACAD_ISO1\d/i
  // 조각(그림 토막 묶음) — 도형 하나가 조각 여러 개일 수 있음(치수·해치)
  const Qe = new Grow(Uint32Array), Q0 = new Grow(Uint32Array), Qn = new Grow(Uint32Array)
  const PX = new Grow(Float64Array, 1 << 16)
  /* 🧭 G246 점이 다 찬 뒤의 가로 · 세로 곧은 선(판 테두리 찾기용 — x0,y0,x1,y1) · 너무 많으면(150만 넘게) 짧은 것부터 버림 */
  const 틀 = new Grow(Float64Array, 1 << 12)
  let 틀최소 = 0
  // 글자
  const Ts = [], Tx = new Grow(Float64Array), Ty = new Grow(Float64Array), Th = new Grow(Float64Array), Ta = new Grow(Float64Array), Te = new Grow(Int32Array)
  /* 🧱 G298 숨은 층(끈 · 얼린 · Defpoints)의 글 — 그리지는 않고 자리만(마감: 실 이름을 Defpoints 에 적은 평면도) */
  const 숨은글 = []
  /* 🧭 G246 범위 읽기 — 점이 다 찬 뒤 구조 판 밖 글(모양을 안 담은 판의 글)은 1 · 판 목록에만 씀(골조자동 준비 → 뒤글자) */
  const T밖 = 읽을범위 ? new Grow(Uint8Array) : null
  /* 🧭 G246 배치(종이) 공간 판 — 배치 탭마다 글 · 선 · 화면틀(모형 공간을 보는 창). 읽는 동안만 배치중 = 지금 배치 */
  let 배치중 = null
  const 활성배치 = [], 배치목록 = []      // ENTITIES 의 67=1 도형 · OBJECTS 의 LAYOUT {이름, 탭, rec}
  const inserts = []
  const 안넣음 = []          // 🧭 G363 블록 안에 든 블록(개수 세기용 · INSERT 쪽 설명)
  /* 🧭 G132 — 외부참조(XREF) 넣은 자리: 블록이 비어 있어(딴 파일) 그 파일을 같이 넣으면 화면이 끼워 넣습니다 */
  const 참조들 = []
  const 사전 = new Map(), 거르개 = new Map()     // OBJECTS — DICTIONARY · SPATIAL_FILTER (XCLIP)

  const P = (M, x, y, z) => M === I3 ? [x, y] : [M[0] * x + M[1] * y + M[2] * z + M[3], M[4] * x + M[5] * y + M[6] * z + M[7]]
  /* 🛡 G397 망가진 좌표(DWG 바꾸기에서 1e210 같은 값 — 현장 Y 흙막이 도면) — 3D 읽기(dxf3d.js 1e12)처럼 버림.
       안 버리면 골조 읽기 칸 나눔(칸 번호 i++)이 2^53 넘는 수에서 안 늘어 끝없이 돌아 화면이 멈췄음 */
  const 멀리 = (w) => !(Math.abs(w[0]) < 1e12 && Math.abs(w[1]) < 1e12)
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
    Elen.push(NaN); Earea.push(NaN); Eval.push(NaN); Eins.push(ins); Esc.push(지금배율); Elt.push(지금점선)
    return i
  }
  function 조각(e, M, pts) {        // pts: [[x,y,z]…] 엔티티 좌표
    const n = pts.length
    if (n < 2) return 0
    if (배치중) {                  /* 배치 공간 — 선 토막만 모음(판 테두리 찾기) */
      let a = null
      for (const q of pts) { const w = P(M, q[0], q[1], q[2] || 0); if (멀리(w)) { a = null; continue } if (a && Number.isFinite(w[0] + w[1])) { 배치중.선.need(6); 배치중.선.a.set([a[0], a[1], 0, w[0], w[1], 0], 배치중.선.n); 배치중.선.n += 6 } a = w }
      return 0
    }
    if (!stats.capped && stats.verts + n > MAX_V) { stats.capped = true; stats.캡글 = Ts.length }
    if (stats.capped && !읽을범위) { stats.못그림++; 틀모으기(M, pts); return 0 }
    const st = PX.n >> 1
    let cnt = 0, lx = NaN, ly = NaN
    for (let i = 0; i < n; i++) {
      const q = pts[i]
      const w = P(M, q[0], q[1], q[2] || 0)
      if (!Number.isFinite(w[0] + w[1])) continue
      if (멀리(w)) { stats.멀리 = (stats.멀리 || 0) + 1; continue }
      if (w[0] === lx && w[1] === ly) continue
      PX.push2(w[0], w[1]); lx = w[0]; ly = w[1]; cnt++
    }
    if (cnt < 2) { PX.n = st * 2; return 0 }
    if (stats.capped) {           /* 읽을범위 있음 — 점이 다 찬 뒤는 구조 판에 걸친 것만 더 */
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
      for (let k = st * 2; k < PX.n; k += 2) { const x = PX.a[k], y = PX.a[k + 1]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y }
      let 안 = false
      for (const r of 읽을범위) if (x1 >= r[0] && x0 <= r[2] && y1 >= r[1] && y0 <= r[3]) { 안 = true; break }
      if (!안 || stats.verts + cnt > MAX_V + 더예산) { PX.n = st * 2; if (안) stats.더못++; else stats.범위밖++; stats.못그림++; 틀모으기(M, pts); return 0 }
      stats.더담음 += cnt
    }
    Qe.push(e); Q0.push(st); Qn.push(cnt)
    stats.verts += cnt
    return cnt
  }
  function 틀모으기(M, pts) {
    let a = null
    for (const q of pts) {
      const w = P(M, q[0], q[1], q[2] || 0)
      if (멀리(w)) { a = null; continue }
      if (a && Number.isFinite(w[0] + w[1])) {
        const dx = Math.abs(w[0] - a[0]), dy = Math.abs(w[1] - a[1])
        if ((dy <= 1e-7 * dx || dx <= 1e-7 * dy) && dx + dy > 틀최소) { 틀.need(4); 틀.a[틀.n++] = a[0]; 틀.a[틀.n++] = a[1]; 틀.a[틀.n++] = w[0]; 틀.a[틀.n++] = w[1] }
      }
      a = w
    }
    if (틀.n > 6_000_000) {
      const L = []
      for (let i = 0; i < 틀.n; i += 4) L.push(Math.abs(틀.a[i + 2] - 틀.a[i]) + Math.abs(틀.a[i + 3] - 틀.a[i + 1]))
      L.sort((x, y) => x - y)
      틀최소 = L[L.length >> 1]
      let k = 0
      for (let i = 0; i < 틀.n; i += 4) if (Math.abs(틀.a[i + 2] - 틀.a[i]) + Math.abs(틀.a[i + 3] - 틀.a[i + 1]) > 틀최소) { for (let j = 0; j < 4; j++) 틀.a[k + j] = 틀.a[i + j]; k += 4 }
      틀.n = k
    }
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
  /** 🧭 G363 볼록 토막이 든 닫힌 선의 참 면적 — 신발끈 넓이 + 토막마다 활꼴 r²/2·(θ − sinθ) (θ = 4·atan(볼록) · 부호대로 더하고 뺌) */
  function 볼록면적(vs) {
    let S = 0
    for (let i = 0; i < vs.length; i++) {
      const a = vs[i], c = vs[(i + 1) % vs.length]
      S += a[0] * c[1] - c[0] * a[1]
      const b = a[2]
      if (!b) continue
      const d = Math.hypot(c[0] - a[0], c[1] - a[1])
      if (d < 1e-12) continue
      const th = 4 * Math.atan(b), r = d / (2 * Math.sin(th / 2))
      S += r * r * (th - Math.sin(th))
    }
    return Math.abs(S) / 2
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
    if (멀리(p)) { stats.멀리 = (stats.멀리 || 0) + 1; return }
    let a
    if (isM && has(g, 11)) { const d = [g1(g, 11), g1(g, 21)]; const w = M === I3 ? d : [M[0] * d[0] + M[1] * d[1], M[4] * d[0] + M[5] * d[1]]; a = Math.atan2(w[1], w[0]) }
    else { const r = g1(g, 50, 0) * D2R; const w = MM === I3 ? [Math.cos(r), Math.sin(r)] : [MM[0] * Math.cos(r) + MM[1] * Math.sin(r), MM[4] * Math.cos(r) + MM[5] * Math.sin(r)]; a = Math.atan2(w[1], w[0]) }
    const sc = MM === I3 ? 1 : Math.hypot(MM[1], MM[5]) || 1
    if (배치중) {                  /* 배치 공간 글 — 가운데 · 오른쪽 맞춤만 대충 옮겨 모음 */
      const w0 = s.length * h0 * sc * 0.9
      let ddx = 0
      if (!isM) { if (hj === 1 || hj === 4) ddx = -w0 / 2; else if (hj === 2) ddx = -w0 } else { const col = (g1(g, 71, 1) - 1) % 3; if (col === 1) ddx = -w0 / 2; else if (col === 2) ddx = -w0 }
      배치중.글.push({ s, x: p[0] + ddx * Math.cos(a), y: p[1] + ddx * Math.sin(a), h: h0 * sc, a })
      return
    }
    Ts.push(s); Tx.push(p[0]); Ty.push(p[1]); Th.push(h0 * sc); Ta.push(a); Te.push(e)
    if (T밖) { let 밖 = 0; if (stats.capped) { 밖 = 1; for (const r of 읽을범위) if (p[0] >= r[0] && p[0] <= r[2] && p[1] >= r[1] && p[1] <= r[3]) { 밖 = 0; break } } T밖.push(밖) }
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
    if (g1(g, 67, 0) === 1 && !배치중) { skip('배치(종이) 공간'); return }
    if (g1(g, 60, 0) === 1) { stats.안보임++; return }
    let lyName = gs(g, 8, '0')
    if (lyName === '0' && cx.ly) lyName = cx.ly
    const L = layerOf(lyName)
    const t = e.t
    /* 🏭 G294 선 꼴 — BYLAYER(비어 있음) = 층 꼴 · BYBLOCK = 넣은 블록의 꼴 */
    const lt0 = gs(g, 6, '')
    const 층꼴 = !lt0 || /^BYLAYER$/i.test(lt0)
    const lt = 층꼴 ? (L.lt || '') : /^BYBLOCK$/i.test(lt0) ? (cx.lt || '') : lt0
    /* 1 = 도형에 따로 준 끊어진 선(층은 실선 · 상세 경계 팔각형 등) · 2 = 층 꼴이 끊어진 선(숨은 기초선 층 — 기초 평면에서는 윤곽) */
    지금점선 = 점선꼴.test(lt) ? (층꼴 ? 2 : 1) : 0
    if (L.인쇄안함 && t !== 'INSERT') stats.인쇄안함++
    if (L.hide && t !== 'INSERT') {
      stats.hidden++
      if ((t === 'TEXT' || t === 'MTEXT') && !배치중 && 숨은글.length < 20000) {
        let s
        if (t === 'MTEXT') { let raw = ''; for (const [k, v] of g) if (k === 3) raw += v; raw += gs(g, 1); s = mtextLines(raw).join(' ') } else s = cadText(unesc(gs(g, 1)))
        s = (s || '').trim()
        if (s && s.length <= 40) {
          const O = ext(g); const MM = O ? mul(M, O) : M
          const h0 = g1(g, 40, 2.5), hj = g1(g, 72, 0), vj = g1(g, 73, 0)
          let x = g1(g, 10), y = g1(g, 20), z = g1(g, 30)
          if (t !== 'MTEXT' && (hj !== 0 || vj !== 0) && has(g, 11)) { x = g1(g, 11); y = g1(g, 21); z = g1(g, 31) }
          const p = P(MM, x, y, z)
          const sc = MM === I3 ? 1 : Math.hypot(MM[1], MM[5]) || 1
          /* 가운데 · 오른쪽 맞춤 글은 글 가운데가 그 점 — 왼쪽 맞춤은 대충 반 폭 옮김 */
          const 가운데 = t === 'MTEXT' ? ((g1(g, 71, 1) - 1) % 3) === 1 : (hj === 1 || hj === 4)
          const dx = 가운데 ? 0 : s.length * h0 * sc * 0.45
          if (!멀리(p)) 숨은글.push({ s, x: p[0] + dx, y: p[1] + h0 * sc / 2, h: h0 * sc, ly: L.name })
        }
      }
      return
    }
    stats.ents++
    const rgb = 색(g, L, cx)
    const ins = cx.ins ?? -1
    지금배율 = M === I3 ? 1 : Math.sqrt(Math.abs(M[0] * M[5] - M[1] * M[4])) || 1
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
          if (fl & (16 | 64)) { 메쉬선(e, M, L, rgb, ins, fl); return }      /* 🧭 G245 전엔 건너뜀(메쉬) — 이제 모서리 선으로 */
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
        /* 🧭 G363 볼록(bulge) 호가 든 닫힌 선은 참 면적(꼭짓점 넓이 + 토막마다 활꼴) — 전엔 4° 꺾은선 넓이라 반원 끝 포장이 0.01% 적었음 */
        if (closed) Earea.a[id] = s !== null && vs.some((a) => a[2]) ? 볼록면적(vs) * s * s : Math.abs(토막면적(q))
        return
      }
      case 'CIRCLE': case 'ARC': {
        if (stats.capped && !읽을범위) { stats.못그림++; return }       /* 🧭 G246 점이 다 찬 뒤 — 곡선은 판 테두리가 아니라 건너뜀(개수만 · 구조 판 다시 읽기면 조각에서 가림) */
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
        if (stats.capped && !읽을범위) { stats.못그림++; return }
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
        const id = 새도형(종류.지시선, L.i, rgb, ins)
        const q = Qe.n
        if (조각(id, M, pts)) Elen.a[id] = 토막길이(q)
        return
      }
      case 'MULTILEADER': case 'MLEADER': {
        /* 🧭 G245 다중 지시선 — 선(꺾인 끝까지) · 끝 글자 · 블록 내용. 전엔 통째로 건너뜀(현장 C 토목 568개) */
        const r = 다중지시선(g)
        for (const pts of r.선) { const id = 새도형(종류.지시선, L.i, rgb, ins); const q = Qe.n; if (조각(id, M, pts)) Elen.a[id] = 토막길이(q) }
        if (r.글) {
          const s2 = mtextLines(r.글.s).join(' ').trim()
          if (s2) { const id = 새도형(종류.글자, L.i, rgb, ins); 글자넣기(id, s2, M, [[10, r.글.p[0]], [20, r.글.p[1]], [30, r.글.p[2]], [40, r.글.h], [71, r.글.맞춤 === 2 ? 2 : r.글.맞춤 === 3 ? 3 : 1], [11, Math.cos(r.글.a)], [21, Math.sin(r.글.a)]], true) }
        }
        if (r.블록 && depth < 16) {
          const bl = 블록rec.get(r.블록.rec)
          if (bl) {
            const [bx, by, bz] = bl.base, [sx, sy, sz] = r.블록.sc, cs = Math.cos(r.블록.a), sn = Math.sin(r.블록.a), [ix, iy, iz] = r.블록.p
            const X = mul(M, [cs * sx, -sn * sy, 0, -(cs * sx * bx) + sn * sy * by + ix, sn * sx, cs * sy, 0, -(sn * sx * bx) - cs * sy * by + iy, 0, 0, sz, -sz * bz + iz])
            for (const s2 of bl.ents) { draw(s2, X, { ...cx, ly: lyName, rgb, ins }, depth + 1, false) }
          }
        }
        return
      }
      case '3DFACE': {
        /* 🧭 G245 3D 면(네 점) — 채움처럼(전엔 건너뜀) */
        const q4 = [0, 1, 2, 3].map((k) => [g1(g, 10 + k), g1(g, 20 + k), g1(g, 30 + k)])
        if (Math.hypot(q4[3][0] - q4[2][0], q4[3][1] - q4[2][1]) < 1e-9) q4.pop()
        const id = 새도형(종류.채움, L.i, rgb, ins)
        const q = Qe.n
        if (!조각(id, M, q4.concat([q4[0]]))) return
        Elen.a[id] = 토막길이(q); Earea.a[id] = Math.abs(토막면적(q))
        return
      }
      case 'MESH': {
        /* 🧭 G245 새 메쉬(MESH) — 면 모서리 선으로 */
        const vs = [], faces = []
        let mode = 0, cur = null, left = 0
        for (const [k, v] of g) {
          if (k === 92) { mode = 1; continue }
          if (k === 93) { mode = 2; left = 0; continue }
          if (k === 94 || k === 95) { mode = 3; continue }
          if (mode === 1) { if (k === 10) { cur = [num(v), 0, 0]; vs.push(cur) } else if (k === 20 && cur) cur[1] = num(v); else if (k === 30 && cur) cur[2] = num(v) }
          else if (mode === 2 && k === 90) { const x = parseInt(v, 10); if (left === 0) { faces.push([]); left = x } else { faces[faces.length - 1].push(x); left-- } }
        }
        for (const f of faces) { const pts = f.map((j) => vs[j]).filter(Boolean); if (pts.length >= 2) { pts.push(pts[0]); const id = 새도형(종류.폴리선, L.i, rgb, ins); const q = Qe.n; if (조각(id, M, pts)) Elen.a[id] = 토막길이(q) } }
        return
      }
      case 'ATTDEF': {
        /* 🧭 G245 속성 정의 — 블록 안의 «고정 속성»(70 & 2)은 넣을 때마다 그 값이 보임 → 글자로. 모형 공간에 바로 있는 것은 이름표(2)가 보임.
           나머지(바뀌는 속성)는 값이 블록 속성(ATTRIB)으로 따로 오므로 여기선 셀 것 없음 */
        const fl = g1(g, 70, 0)
        if (fl & 1) return
        let s2 = ''
        if (top) s2 = cadText(unesc(gs(g, 2)))
        else if (fl & 2) s2 = cadText(unesc(gs(g, 1)))
        s2 = s2.trim()
        if (!s2) { stats.ents--; return }
        const id = 새도형(종류.글자, L.i, rgb, ins)
        글자넣기(id, s2, M, g, false)
        return
      }
      case 'ACAD_TABLE': {
        /* 🧭 G245 표 객체 — 그려진 모양은 이름 없는 블록(2)에 있음 → 넣은 자리(10)에 방향(11/21)으로 */
        const bl = blocks.get(gs(g, 2).toUpperCase())
        if (!bl || depth > 16) { skip('표(블록 없음)'); stats.ents--; return }
        const a0 = Math.atan2(g1(g, 21, 0), g1(g, 11, 1)), cs = Math.cos(a0), sn = Math.sin(a0)
        const ix = g1(g, 10), iy = g1(g, 20), iz = g1(g, 30)
        const X = mul(M, [cs, -sn, 0, ix, sn, cs, 0, iy, 0, 0, 1, iz])
        for (const s2 of bl.ents) { draw(s2, X, { ...cx, ly: lyName, rgb, ins }, depth + 1, false) }
        return
      }
      case 'POINT': return          /* 🧭 G245 점 — 길이 · 넓이가 없어 셀 것 없음(읽음) */
      case 'WIPEOUT': case 'VIEWPORT': case 'XLINE': case 'RAY':   /* 가림막 · 화면틀 · 끝없는 보조선 — 셀 것 없음 */
        /* 🧭 G246 배치 공간 화면틀 — 종이 위 자리 · 크기와 모형 공간에서 보는 곳(가운데 12/22 + 과녁 17/27 · 높이 45 · 돌림 51) */
        if (배치중 && t === 'VIEWPORT' && g1(g, 69, 0) !== 1) {
          const w = g1(g, 40, 0), h = g1(g, 41, 0), vh = g1(g, 45, 0)
          if (w > 0 && h > 0 && vh > 0) 배치중.화면.push({ x: g1(g, 10), y: g1(g, 20), w, h, mx: g1(g, 17, 0) + g1(g, 12, 0), my: g1(g, 27, 0) + g1(g, 22, 0), mh: vh, mw: vh * (w / h), 돌림: g1(g, 51, 0) })
        }
        stats.ents--; return
      case 'HATCH': {
        if (stats.capped && !읽을범위) { stats.못그림++; return }
        const loops = 해치경계(g)
        if (!loops.length) return
        const O = ext(g); const MM = O ? mul(M, O) : M
        const id = 새도형(종류.해치, L.i, rgb, ins)
        무늬.set(id, gs(g, 2).toUpperCase())             /* 🧱 G233 해치 무늬 이름(ANSI31 · SOLID …) — MAT 기초 범례 무늬 ↔ 평면 구역 */
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
        /* 🧭 G363 개수 — MINSERT(줄 × 칸으로 여러 개 넣기)는 그 수만큼 · 블록 안에 든 블록(수목군 안의 이팝나무 · 화장실 세트 안의 대변기)은
             I(모형 공간에 바로 넣은 것) 와 따로 I안 에 적음 — 조상(바깥 블록 이름들) · 축소(0.5배 미만 사본 = 위치도 안) */
        const 몇개 = Math.max(1, g1(g, 70, 1)) * Math.max(1, g1(g, 71, 1))
        if (top && 몇개 > 1) inserts[myIns].수 = 몇개
        if (!top && !배치중 && ins >= 0) {
          const w = P(M, g1(g, 10), g1(g, 20), g1(g, 30))
          if (!멀리(w)) 안넣음.push({ name, x: w[0], y: w[1], ly: L.i, 조상: cx.조상 || [], 수: 몇개, 축소: M !== I3 && Math.sqrt(Math.abs(M[0] * M[5] - M[1] * M[4])) < 0.5 })
        }
        const 조상 = [...(cx.조상 || []), name]
        /* 🧭 G132 — 블록 속성(ATTRIB) 이름표와 값도 적어 둠(횡단면 수량표 블록: 측점 · 터파기 · 모래부설 …) */
        if (top && e.att && e.att.length) inserts[myIns].속성 = e.att.map((a) => [unesc(gs(a.g, 2)), cadText(unesc(gs(a.g, 1)))])
        if (e.att) for (const a of e.att) draw(a, M, { ...cx, ly: lyName, rgb, ins: myIns, lt }, depth + 1, false)
        if (!bl) { skip('없는 블록'); stats.없는블록[name] = (stats.없는블록[name] || 0) + 1; return }
        if (depth > 16) return
        const O = ext(g)
        if (bl.xref) {
          /* 외부참조 — 블록 안이 비어 있습니다. 넣은 자리(변환)와 XCLIP 사전 번호만 적어 둠 */
          const sx0 = g1(g, 41, 1), sy0 = g1(g, 42, 1), r0 = g1(g, 50, 0) * D2R
          const c0 = Math.cos(r0), s0 = Math.sin(r0)
          const [bx0, by0, bz0] = bl.base
          let L0 = [c0 * sx0, -s0 * sy0, 0, -(c0 * sx0 * bx0) + s0 * sy0 * by0 + g1(g, 10),
            s0 * sx0, c0 * sy0, 0, -(s0 * sx0 * bx0) - c0 * sy0 * by0 + g1(g, 20),
            0, 0, g1(g, 43, 1), -g1(g, 43, 1) * bz0 + g1(g, 30)]
          if (O) L0 = mul(O, L0)
          const X0 = mul(M, L0)
          let xd = ''
          for (let k = 0; k < g.length - 1; k++) if (g[k][0] === 102 && /ACAD_XDICTIONARY/i.test(g[k][1])) { xd = String(g[k + 1][1]).trim().toUpperCase(); break }
          참조들.push({ 이름: bl.name, 길: bl.path || '', X: Array.from(X0), xd, 배율: Math.sqrt(Math.abs(X0[0] * X0[5] - X0[1] * X0[4])) || 1, 층: L.i })
        }
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
          for (const s of bl.ents) { draw(s, X, { ...cx, ly: lyName, rgb, ins: myIns, lt, 조상 }, depth + 1, false) }
        }
        return
      }
      default: { skip(t); stats.ents--; const m = stats.못층[t] || (stats.못층[t] = {}); m[lyName] = (m[lyName] || 0) + 1 }
    }
  }

  /** 🧭 G245 옛 메쉬(POLYLINE 16 · 64) → 모서리 선. 다면 메쉬(64)는 면 줄(71~74 번호, 음수 = 안 보이는 모서리) · 격자 메쉬(16)는 M×N 줄 */
  function 메쉬선(e, M, L, rgb, ins, fl) {
    const V = e.v || []
    const 선 = (pts) => { if (pts.length < 2) return; const id = 새도형(종류.폴리선, L.i, rgb, ins); const q = Qe.n; if (조각(id, M, pts)) Elen.a[id] = 토막길이(q) }
    const P3 = (x) => [g1(x.g, 10), g1(x.g, 20), g1(x.g, 30)]
    if (fl & 64) {
      const 점 = V.filter((x) => g1(x.g, 70, 0) & 64).map(P3)
      for (const x of V) {
        const vf = g1(x.g, 70, 0)
        if (!(vf & 128) || (vf & 64)) continue
        const ix = [71, 72, 73, 74].map((c) => g1(x.g, c, 0)).filter((n) => n !== 0)
        for (let j = 0; j < ix.length; j++) {
          if (ix[j] < 0) continue
          const a = 점[Math.abs(ix[j]) - 1], b = 점[Math.abs(ix[(j + 1) % ix.length]) - 1]
          if (a && b) 선([a, b])
        }
      }
      return
    }
    const m = Math.max(1, g1(e.g, 71, 0)), n = Math.max(1, g1(e.g, 72, 0))
    const 점 = V.map(P3)
    if (점.length < m * n) { 선(점); return }
    const 닫M = (fl & 1) === 1, 닫N = (fl & 32) === 32
    for (let i = 0; i < m; i++) { const row = []; for (let j = 0; j < n; j++) row.push(점[i * n + j]); if (닫N) row.push(row[0]); 선(row) }
    for (let j = 0; j < n; j++) { const col = []; for (let i = 0; i < m; i++) col.push(점[i * n + j]); if (닫M) col.push(col[0]); 선(col) }
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
            /* 🧭 G245 «인쇄 안 함» 층(290 = 0)도 숨김 — 캐드 화면엔 보여도 도면(PDF)에는 안 찍힘. 현장 A 구조도서 PDF 와 판마다 견주니
               xref 건축 «area 02»(실 면적 테두리 · 인쇄 안 함)가 캐드 선의 1/3 이었음 */
            L.인쇄안함 = g1(e.g, 290, 1) === 0
            L.lt = gs(e.g, 6, '')          /* 🏭 G294 층 선 꼴 */
            /* 🧭 G246 인쇄 안 하는 층(290=0)은 «화면에는 보이고 종이에만 안 찍힘» — 읽음(감추지 않음). 현장 B 구조평면도는 부재 이름(NAME-보 · NAME-기둥)이
                 이 층에 있어 G245 끝에 감췄더니 부재 283 → 128 로 줄었음. PDF 대조(판 대조)만 이 층을 뺌(dxfplot 도 안 그림) */
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
          if (t === 'BLOCK') { const e = readEnt('BLOCK'); const fl = g1(e.g, 70, 0); cur = { name: unesc(gs(e.g, 2)), base: [g1(e.g, 10), g1(e.g, 20), g1(e.g, 30)], ents: [], xref: (fl & 4) === 4, path: (fl & 4) ? unesc(gs(e.g, 1)) : '', rec: gs(e.g, 330).toUpperCase() }; continue }
          if (t === 'ENDBLK') { if (cur) { blocks.set(cur.name.toUpperCase(), cur); if (cur.rec) 블록rec.set(cur.rec, cur) } cur = null; readEnt('ENDBLK'); continue }
          const e = readFull()
          if (cur && /^\*paper_space/i.test(cur.name)) { stats.배치++; stats.배치종류[e.t] = (stats.배치종류[e.t] || 0) + 1; for (const kv of e.g) if (kv[0] === 8 || kv[0] === 2 || kv[0] === 1 || kv[0] === 3) kv[1] = unesc(kv[1]); cur.ents.push(e) }
          else if (cur) { 셈(e.t); if (e.att) for (let k = 0; k < e.att.length; k++) 셈('ATTRIB'); for (const kv of e.g) if (kv[0] === 8 || kv[0] === 2 || kv[0] === 1 || kv[0] === 3) kv[1] = unesc(kv[1]); cur.ents.push(e) }
        }
      } else if (sec === 'ENTITIES') {
        while (pair && !(pair[0] === 0 && pair[1].trim() === 'ENDSEC')) {
          if (pair[0] !== 0) { pair = R.next(); continue }
          const e = readFull()
          if (g1(e.g, 67, 0) === 1) { stats.배치++; stats.배치종류[e.t] = (stats.배치종류[e.t] || 0) + 1; 활성배치.push(e) }
          else { 셈(e.t); if (e.att) for (let k = 0; k < e.att.length; k++) 셈('ATTRIB') }
          for (const kv of e.g) if (kv[0] === 8 || kv[0] === 2) kv[1] = unesc(kv[1])
          draw(e, I3, { ins: -1 }, 0, true)
          if (onProgress && R.pos - last > 2_000_000) { last = R.pos; onProgress(R.pos / R.len) }
        }
      } else if (sec === 'OBJECTS') {
        /* XCLIP: INSERT 의 확장 사전 → ACAD_FILTER → SPATIAL → SPATIAL_FILTER (xref 가 있을 때만) · 🧭 G246 LAYOUT(배치 탭 이름 · 차례 · 종이 공간 블록) */
        while (pair && !(pair[0] === 0 && pair[1].trim() === 'ENDSEC')) {
          if (pair[0] !== 0) { pair = R.next(); continue }
          const t = pair[1].trim()
          if (t === 'LAYOUT') { const e = readEnt(t); const 이름 = unesc(gs(e.g, 1)); if (!/^model$/i.test(이름)) 배치목록.push({ 이름, 탭: g1(e.g, 71, 0), rec: gs(e.g, 340).toUpperCase() }); continue }
          if (!참조들.length || (t !== 'DICTIONARY' && t !== 'SPATIAL_FILTER')) { pair = R.next(); continue }
          const e = readEnt(t)
          const h = gs(e.g, 5).toUpperCase()
          if (t === 'DICTIONARY') {
            const m = new Map()
            let nm = null
            for (const [k, v] of e.g) { if (k === 3) nm = String(v).trim().toUpperCase(); else if ((k === 350 || k === 360) && nm) { m.set(nm, String(v).trim().toUpperCase()); nm = null } }
            사전.set(h, m)
          } else {
            const pts = []
            let cur = null
            const m40 = []
            for (const [k, v] of e.g) { if (k === 10) { cur = [num(v), 0]; pts.push(cur) } else if (k === 20 && cur) cur[1] = num(v); else if (k === 40) m40.push(num(v)) }
            거르개.set(h, { pts, m40 })
          }
        }
      } else {
        while (pair && !(pair[0] === 0 && pair[1].trim() === 'ENDSEC')) pair = R.next()
      }
    }
    pair = R.next()
  }
  if (!layerList.length) layerOf('0')

  /* ── 🧭 G246 배치(종이) 공간 판 — 배치 탭마다 같은 그리기로 글 · 선 · 화면틀만 모음(모형 공간 셈 · 도형 수에는 안 섞음) ── */
  const 배치 = []
  if (stats.배치) {
    const 짝 = []
    for (const L of 배치목록.slice().sort((p, q) => p.탭 - q.탭)) { const bl = 블록rec.get(L.rec); if (bl) 짝.push({ 이름: L.이름, 탭: L.탭, ents: /^\*paper_space$/i.test(bl.name) ? 활성배치 : bl.ents }) }
    if (!짝.length) {               // LAYOUT 이 없는 옛 DXF — 종이 공간 블록 이름으로
      if (활성배치.length) 짝.push({ 이름: 'Layout1', 탭: 1, ents: 활성배치 })
      let k = 2
      for (const bl of blocks.values()) if (/^\*paper_space\d+$/i.test(bl.name) && bl.ents.length) 짝.push({ 이름: 'Layout' + k++, 탭: k, ents: bl.ents })
    }
    const 백 = JSON.stringify(stats), n0 = { E: Et.n, ly: Ely.n, rgb: Ergb.n, len: Elen.n, area: Earea.n, val: Eval.n, ins: Eins.n, sc: Esc.n, lt: Elt.n }, i0 = inserts.length, r0 = 참조들.length
    for (const b of 짝) {
      if (!b.ents.length) continue
      배치중 = { 이름: b.이름, 탭: b.탭, 글: [], 선: new Grow(Float64Array, 1024), 화면: [] }
      try { for (const e of b.ents) draw(e, I3, { ins: -1 }, 0, false) } catch (er) { /* 배치 한 장 못 읽어도 모형 공간은 그대로 */ }
      if (배치중.글.length || 배치중.선.n || 배치중.화면.length) 배치.push({ 이름: 배치중.이름, 탭: 배치중.탭, 글: 배치중.글, 선: 배치중.선.done(), 화면: 배치중.화면 })
      배치중 = null
    }
    /* 배치 그리기가 남긴 도형 · 넣은 자리 · 셈은 되돌림 */
    Et.n = n0.E; Ely.n = n0.ly; Ergb.n = n0.rgb; Elen.n = n0.len; Earea.n = n0.area; Eval.n = n0.val; Eins.n = n0.ins; Esc.n = n0.sc; Elt.n = n0.lt
    for (const k of [...무늬.keys()]) if (k >= n0.E) 무늬.delete(k)
    inserts.length = i0; 참조들.length = r0
    Object.assign(stats, JSON.parse(백))
  }

  /* ── 묶기: 가운데를 빼고 도형마다 상자 ── */
  const xy = PX.done()
  const tx = Tx.done(), ty = Ty.done()
  const box = 범위(xy, tx, ty)
  const ox = (box[0] + box[2]) / 2, oy = (box[1] + box[3]) / 2
  for (let k = 0; k < xy.length; k += 2) { xy[k] -= ox; xy[k + 1] -= oy }
  for (let k = 0; k < tx.length; k++) { tx[k] -= ox; ty[k] -= oy }
  for (const I of inserts) { I.x -= ox; I.y -= oy }
  for (const I of 안넣음) { I.x -= ox; I.y -= oy }
  for (const q of 숨은글) { q.x -= ox; q.y -= oy }
  const 참조 = 참조맞춤(참조들, 사전, 거르개, ox, oy)
  stats.글수 = Ts.length          /* 🧭 G246 이 파일 글자 수(xref 끼우면 뒤에 붙음 — 캡글 ~ 글수 = 점이 다 찬 뒤 읽은 글) */
  let 틀선 = null
  if (틀.n) { const a = 틀.a.slice(0, 틀.n); for (let i = 0; i < a.length; i += 2) { a[i] -= ox; a[i + 1] -= oy } 틀선 = { a, n: a.length } }
  const E = { t: Et.done(), ly: Ely.done(), rgb: Ergb.done(), len: Elen.done(), area: Earea.done(), val: Eval.done(), ins: Eins.done(), sc: Esc.done(), lt: Elt.done() }
  const Q = { e: Qe.done(), p0: Q0.done(), pn: Qn.done() }
  const T = { s: Ts, x: tx, y: ty, h: Th.done(), a: Ta.done(), e: Te.done() }
  return {
    E, Q, P: xy, T, I: inserts, 무늬,
    layers: layerList.map((L) => ({ name: L.name, rgb: L.rgb, hide: L.hide, ...(L.인쇄안함 ? { 인쇄안함: true } : {}) })),
    box: [box[0] - ox, box[1] - oy, box[2] - ox, box[3] - oy], ox, oy,
    units: header.insunits, stats, 참조, ...(안넣음.length ? { I안: 안넣음 } : {}), ...(숨은글.length ? { 숨은글 } : {}), ...(틀선 ? { 틀선 } : {}), ...(배치.length ? { 배치: 배치.map((b) => ({ ...b, 화면: b.화면.map((v) => ({ ...v, mx: v.mx - ox, my: v.my - oy })) })) } : {}), ...(T밖 ? { T밖: T밖.done() } : {}),
  }
}

/** 튀는 점에 끌리지 않는 범위 (0.2~99.8%) */
/**
 * 🧭 G132 — 외부참조 자리 정리: XCLIP(자르기) 경계를 도면 좌표로(가운데 뺀 좌표)
 *   SPATIAL_FILTER 의 점은 «넣을 때의 역변환»(40 × 12) 으로 블록 좌표가 되고, 넣은 변환 X 로 도면 좌표가 됩니다(ezdxf xclip 과 같은 셈).
 *   점 두 개면 블록 좌표에서 네모로 폅니다.
 *   🧭 G257 점은 «자른 테두리 좌표»(자를 때의 UCS) — 뒤 40 × 12(자른 테두리 변환 = 도면 → 그 좌표)의 역변환을 먼저 해야 도면 좌표
 *     (현장 B S-101: 변환이 (−9750, −297068) 옮김이라 아홉 층 자른 테두리가 모두 판 밖 · 엉뚱한 자리로 가 4 층은 딴 층 그림을 끼우고
 *      5 층은 «같은 글자» 로만 맞췄음 — 지하1층 기초 평면은 글자가 적어 그림이 아예 안 들어왔음). 변환이 그대로(단위)인 도면은 예전과 같음.
 */
function 참조맞춤(참조들, 사전, 거르개, ox, oy) {
  const 곱 = (m, x, y) => [m[0] * x + m[1] * y + m[3], m[4] * x + m[5] * y + m[7]]
  /* 평면 몫(2 × 2 + 옮김)의 역 — 못 뒤집으면(행렬식 0) null */
  const 뒤집기 = (m) => {
    const a = m[0], b = m[1], c = m[4], d = m[5], det = a * d - b * c
    if (!(Math.abs(det) > 1e-12)) return null
    const ia = d / det, ib = -b / det, ic = -c / det, id = a / det
    return [ia, ib, 0, -(ia * m[3] + ib * m[7]), ic, id, 0, -(ic * m[3] + id * m[7]), 0, 0, 1, 0]
  }
  return 참조들.map((r) => {
    let 경계 = null
    const d1 = r.xd && 사전.get(r.xd)
    const d2 = d1 && d1.get('ACAD_FILTER') && 사전.get(d1.get('ACAD_FILTER'))
    const f = d2 && d2.get('SPATIAL') && 거르개.get(d2.get('SPATIAL'))
    if (f && f.pts.length >= 2) {
      const v = f.m40.length >= 24 ? f.m40.slice(-24, -12) : null
      const 역 = f.m40.length >= 24 ? 뒤집기(f.m40.slice(-12)) : null
      let 블 = f.pts.map(([x, y]) => { const w = 역 ? 곱(역, x, y) : [x, y]; return v ? 곱(v, w[0], w[1]) : w })
      if (블.length === 2) {
        const [a, b] = 블
        const x0 = Math.min(a[0], b[0]), x1 = Math.max(a[0], b[0]), y0 = Math.min(a[1], b[1]), y1 = Math.max(a[1], b[1])
        블 = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]
      }
      경계 = 블.map(([x, y]) => { const w = 곱(r.X, x, y); return [w[0] - ox, w[1] - oy] })
    }
    const X = r.X.slice()
    X[3] -= ox; X[7] -= oy
    return { 이름: r.이름, 길: r.길, X, 배율: r.배율, 층: r.층, 경계 }
  })
}

export function 범위(xy, tx, ty) {
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
export function 단위배율(units, box, ox, oy) {
  /* 🧭 G132 — 파일 머리엔 mm(4) 인데 실제로는 m 로 그린 토목 도면이 많습니다(캐드 기본값이 남음).
   *   가운데 좌표가 TM 좌표(동서 10만~60만 · 남북 10만~80만 m)이고 도면 너비가 2만 단위보다 작으면 m 로 봅니다.
   *   (mm 로 그린 건물이 그 자리에 있으면 너비가 수만 단위를 넘습니다) */
  const w0 = box ? Math.max(box[2] - box[0], box[3] - box[1]) : 0
  const tm = Number.isFinite(ox) && Number.isFinite(oy) && ox > 1e5 && ox < 6e5 && oy > 1e5 && oy < 8e5 && w0 > 0 && w0 < 2e4
  if (tm && (units === 4 || units === 0 || units === 1 || units === 2 || units === undefined)) return { k: 1000, 글: 'm (좌표로 짐작)' }
  if (units === 4) return { k: 1, 글: 'mm' }
  if (units === 5) return { k: 10, 글: 'cm' }
  if (units === 6) return { k: 1000, 글: 'm' }
  // inch·feet 로 적혀 있어도 국내 도면은 대개 mm 로 그렸습니다(캐드 기본값이 남은 것) — 크기로 짐작합니다
  // 모름: 도면 크기로 짐작 — 건물 평면이 5m 보다 작으면 m 단위로 그린 것
  const w = Math.max(box[2] - box[0], box[3] - box[1])
  return w < 5000 && w > 5 ? { k: 1000, 글: 'm (짐작)' } : { k: 1, 글: 'mm (짐작)' }
}
