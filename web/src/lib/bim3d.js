/**
 * 🧊 BIM 물량 3D — 부재(덩어리)를 꽉 찬 면 + 모서리 선으로 그리고, 누른 부재를 정확히 집습니다 (G225 · 2026-10-10)
 *
 * 소장님: 「캡쳐처럼 3D 나와???」 → 기둥 · 보 · 슬래브 · 벽 · 기초를 «꽉 찬 덩어리» 로, 부재마다 색을 달리.
 * ■ three.js 를 들이지 않았습니다(꾸러미를 늘리면 깃허브 자동 빌드 npm ci 를 건드려야 함 · gl3d.js 와 같은 까닭). WebGL1 이라 오래된 폰도 돕니다.
 * ■ 부재 고르기는 «색 번호 판»(보이지 않는 판에 부재마다 다른 색으로 그려 누른 점의 색을 읽음) — 겹친 부재도 앞에 보이는 것을 정확히.
 * ■ 좌표: 부재 모델(mm) → 화면은 m 로 (큰 건물도 떨리지 않게)
 * 조작: 끌기 = 돌리기 · 오른쪽 끌기/Shift+끌기/두 손가락 = 옮기기 · 휠/벌리기 = 확대 · 짧게 누르기 = 부재 고르기
 * ■ 🚶 G390 둘러보기 — set사람(세모 · m) 로 걷는 사람을 그림(고르기 안 됨) · 눈(눈모드 = 그 사람 눈으로 · 끌기 = 고개 돌리기) · 가까이(가까운 · 먼 면 따로)
 */

const VS = `
attribute vec3 p; attribute vec3 n; attribute vec3 c; attribute float s; attribute float q;
uniform mat4 M; uniform vec3 L1; uniform vec3 L2; uniform vec3 H; uniform float k;
varying vec3 v; varying float va; varying float vs;
void main(){ gl_Position = M * vec4(p, 1.0); vs = s;
  vec3 N = normalize(vec3(n.xy, n.z / k));
  float l1 = dot(N, L1), l2 = dot(N, L2);
  /* 🎨 G232 깔끔한 빛 — 하늘 · 땅 두 빛(위는 밝게 · 옆은 방향마다 고르게 다른 밝기) + 주빛(두 쪽 — 토목 덩어리는 면 방향이 섞여도 안 어둡게) + 채움 빛
     소장님 「디자인을 더 깔끔하게는 않돼???」 → 고르심 «3D 그림» → 「우리도 이렇게 만들자」(BIM 프로그램 그림 — 부재마다 또렷한 색 · 밝은 바탕 · 가는 윤곽) */
  float sky = 0.5 + 0.5 * N.z;
  float kk = 0.56 + 0.14 * sky + 0.30 * abs(l1) + 0.08 * max(l2, 0.0);
  vec3 b = mix(c, H, s * 0.78);
  v = min(b * kk, vec3(1.0)); va = q; }`
const FS = `
precision mediump float; varying vec3 v; varying float va; varying float vs; uniform float a;
/* 🔎 G280 비쳐 보기에서도 고른 부재는 또렷하게(검수) */
void main(){ gl_FragColor = vec4(v, mix(a, 1.0, vs) * va); }`
const VSL = `
attribute vec3 p; attribute float s; uniform mat4 M; uniform vec3 C; uniform vec3 H; varying vec3 v;
void main(){ gl_Position = M * vec4(p, 1.0); v = mix(C, H * 0.55, s); }`
const FSL = `
precision mediump float; varying vec3 v; uniform float a;
void main(){ gl_FragColor = vec4(v, a); }`
/* 🎨 G232 바탕 — 위는 희고 아래로 옅은 회청색(BIM 프로그램 화면처럼) */
const VSB = `
attribute vec2 p; varying float t;
void main(){ gl_Position = vec4(p, 0.9999, 1.0); t = p.y * 0.5 + 0.5; }`
const FSB = `
precision mediump float; varying float t; uniform vec3 T; uniform vec3 B;
void main(){ gl_FragColor = vec4(mix(B, T, t), 1.0); }`
/* 🚶 G390 그림 입힌 사람(VRM) — 그림 × 색 × 만화풍 빛(밝은 쪽 · 어두운 쪽 두 단계 + 부드러운 이음) · 알파 자름 */
const VST = `
attribute vec3 p; attribute vec3 n; attribute vec2 u; uniform mat4 M; uniform vec3 L1; varying vec2 vu; varying float vl;
void main(){ gl_Position = M * vec4(p, 1.0); vu = u; vec3 N = normalize(n);
  float d = dot(N, L1); float t = smoothstep(-0.15, 0.25, d); vl = mix(0.78, 1.04, t) + 0.06 * N.z; }`
const FST = `
precision mediump float; varying vec2 vu; varying float vl; uniform sampler2D T; uniform vec4 C; uniform float tex; uniform float cut;
void main(){ vec4 c = (tex > 0.5 ? texture2D(T, vu) : vec4(1.0)) * C; if (c.a < cut) discard; gl_FragColor = vec4(min(c.rgb * vl, vec3(1.0)), c.a); }`
const VSP = `
attribute vec3 p; attribute vec3 c; uniform mat4 M; varying vec3 v;
void main(){ gl_Position = M * vec4(p, 1.0); v = c; }`
const FSP = `
precision mediump float; varying vec3 v;
void main(){ gl_FragColor = vec4(v, 1.0); }`

function sh(gl, t, src) {
  const s = gl.createShader(t)
  gl.shaderSource(s, src); gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s))
  return s
}
function prog(gl, vs, fs) {
  const p = gl.createProgram()
  gl.attachShader(p, sh(gl, gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl, gl.FRAGMENT_SHADER, fs))
  gl.linkProgram(p)
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p))
  return p
}
function persp(fy, a, n, f) { const t = 1 / Math.tan(fy / 2), nf = 1 / (n - f); return [t / a, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) * nf, -1, 0, 0, 2 * f * n * nf, 0] }
function look(e, c, u) {
  let zx = e[0] - c[0], zy = e[1] - c[1], zz = e[2] - c[2]
  let l = Math.hypot(zx, zy, zz) || 1; zx /= l; zy /= l; zz /= l
  let xx = u[1] * zz - u[2] * zy, xy = u[2] * zx - u[0] * zz, xz = u[0] * zy - u[1] * zx
  l = Math.hypot(xx, xy, xz) || 1; xx /= l; xy /= l; xz /= l
  const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx
  return [xx, yx, zx, 0, xy, yy, zy, 0, xz, yz, zz, 0, -(xx * e[0] + xy * e[1] + xz * e[2]), -(yx * e[0] + yy * e[1] + yz * e[2]), -(zx * e[0] + zy * e[1] + zz * e[2]), 1]
}
/** 4×4 역행렬(열 우선) — 못 풀면 null */
function 역4(m) {
  const a = m, o = new Array(16)
  o[0] = a[5] * a[10] * a[15] - a[5] * a[11] * a[14] - a[9] * a[6] * a[15] + a[9] * a[7] * a[14] + a[13] * a[6] * a[11] - a[13] * a[7] * a[10]
  o[4] = -a[4] * a[10] * a[15] + a[4] * a[11] * a[14] + a[8] * a[6] * a[15] - a[8] * a[7] * a[14] - a[12] * a[6] * a[11] + a[12] * a[7] * a[10]
  o[8] = a[4] * a[9] * a[15] - a[4] * a[11] * a[13] - a[8] * a[5] * a[15] + a[8] * a[7] * a[13] + a[12] * a[5] * a[11] - a[12] * a[7] * a[9]
  o[12] = -a[4] * a[9] * a[14] + a[4] * a[10] * a[13] + a[8] * a[5] * a[14] - a[8] * a[6] * a[13] - a[12] * a[5] * a[10] + a[12] * a[6] * a[9]
  o[1] = -a[1] * a[10] * a[15] + a[1] * a[11] * a[14] + a[9] * a[2] * a[15] - a[9] * a[3] * a[14] - a[13] * a[2] * a[11] + a[13] * a[3] * a[10]
  o[5] = a[0] * a[10] * a[15] - a[0] * a[11] * a[14] - a[8] * a[2] * a[15] + a[8] * a[3] * a[14] + a[12] * a[2] * a[11] - a[12] * a[3] * a[10]
  o[9] = -a[0] * a[9] * a[15] + a[0] * a[11] * a[13] + a[8] * a[1] * a[15] - a[8] * a[3] * a[13] - a[12] * a[1] * a[11] + a[12] * a[3] * a[9]
  o[13] = a[0] * a[9] * a[14] - a[0] * a[10] * a[13] - a[8] * a[1] * a[14] + a[8] * a[2] * a[13] + a[12] * a[1] * a[10] - a[12] * a[2] * a[9]
  o[2] = a[1] * a[6] * a[15] - a[1] * a[7] * a[14] - a[5] * a[2] * a[15] + a[5] * a[3] * a[14] + a[13] * a[2] * a[7] - a[13] * a[3] * a[6]
  o[6] = -a[0] * a[6] * a[15] + a[0] * a[7] * a[14] + a[4] * a[2] * a[15] - a[4] * a[3] * a[14] - a[12] * a[2] * a[7] + a[12] * a[3] * a[6]
  o[10] = a[0] * a[5] * a[15] - a[0] * a[7] * a[13] - a[4] * a[1] * a[15] + a[4] * a[3] * a[13] + a[12] * a[1] * a[7] - a[12] * a[3] * a[5]
  o[14] = -a[0] * a[5] * a[14] + a[0] * a[6] * a[13] + a[4] * a[1] * a[14] - a[4] * a[2] * a[13] - a[12] * a[1] * a[6] + a[12] * a[2] * a[5]
  o[3] = -a[1] * a[6] * a[11] + a[1] * a[7] * a[10] + a[5] * a[2] * a[11] - a[5] * a[3] * a[10] - a[9] * a[2] * a[7] + a[9] * a[3] * a[6]
  o[7] = a[0] * a[6] * a[11] - a[0] * a[7] * a[10] - a[4] * a[2] * a[11] + a[4] * a[3] * a[10] + a[8] * a[2] * a[7] - a[8] * a[3] * a[6]
  o[11] = -a[0] * a[5] * a[11] + a[0] * a[7] * a[9] + a[4] * a[1] * a[11] - a[4] * a[3] * a[9] - a[8] * a[1] * a[7] + a[8] * a[3] * a[5]
  o[15] = a[0] * a[5] * a[10] - a[0] * a[6] * a[9] - a[4] * a[1] * a[10] + a[4] * a[2] * a[9] + a[8] * a[1] * a[6] - a[8] * a[2] * a[5]
  const det = a[0] * o[0] + a[1] * o[4] + a[2] * o[8] + a[3] * o[12]
  if (!det || !Number.isFinite(det)) return null
  for (let i = 0; i < 16; i++) o[i] /= det
  return o
}
function mm(a, b) { const r = new Array(16); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) r[j * 4 + i] = a[i] * b[j * 4] + a[4 + i] * b[j * 4 + 1] + a[8 + i] * b[j * 4 + 2] + a[12 + i] * b[j * 4 + 3]; return r }

/** 다각형(반시계) 귀 자르기 → 세모 번호 */
export function 세모나누기(P) {
  const n = P.length
  if (n < 3) return []
  if (n === 3) return [0, 1, 2]
  if (n === 4) return [0, 1, 2, 0, 2, 3]
  const idx = [...Array(n).keys()]
  const out = []
  const 넓 = (a, b, c) => (P[b][0] - P[a][0]) * (P[c][1] - P[a][1]) - (P[b][1] - P[a][1]) * (P[c][0] - P[a][0])
  const 안 = (p, a, b, c) => 넓(a, b, p) >= 0 && 넓(b, c, p) >= 0 && 넓(c, a, p) >= 0
  let 막 = 0
  while (idx.length > 3 && 막 < n * n) {
    막++
    let 잘림 = false
    for (let i = 0; i < idx.length; i++) {
      const a = idx[(i + idx.length - 1) % idx.length], b = idx[i], c = idx[(i + 1) % idx.length]
      if (넓(a, b, c) <= 1e-12) continue
      let 품 = false
      for (const q of idx) { if (q === a || q === b || q === c) continue; if (안(q, a, b, c)) { 품 = true; break } }
      if (품) continue
      out.push(a, b, c); idx.splice(i, 1); 잘림 = true; break
    }
    if (!잘림) break
  }
  if (idx.length === 3) out.push(idx[0], idx[1], idx[2])
  else for (let i = 1; i + 1 < idx.length; i++) out.push(idx[0], idx[i], idx[i + 1])   // 꼬인 다각형 — 부채꼴로
  return out
}

export class 부재보기 {
  constructor(canvas) {
    this.cv = canvas
    /* alpha:false — 비쳐 그린 곳(선 · 흙 · 땅)이 판을 투명하게 만들어 뒤의 흰 종이가 비치던 것(하얀 선) 막음 */
    const gl = canvas.getContext('webgl', { antialias: true, preserveDrawingBuffer: false, alpha: false }) || canvas.getContext('experimental-webgl', { alpha: false })
    if (!gl) throw new Error('webgl')
    this.gl = gl
    this.pF = prog(gl, VS, FS); this.pL = prog(gl, VSL, FSL); this.pP = prog(gl, VSP, FSP); this.pB = prog(gl, VSB, FSB)
    this.uint = !!gl.getExtension('OES_element_index_uint')
    this.Bg = { p: gl.getAttribLocation(this.pB, 'p'), T: gl.getUniformLocation(this.pB, 'T'), B: gl.getUniformLocation(this.pB, 'B'), buf: gl.createBuffer() }
    gl.bindBuffer(gl.ARRAY_BUFFER, this.Bg.buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1]), gl.STATIC_DRAW)
    const loc = (p, a) => gl.getAttribLocation(p, a), uni = (p, a) => gl.getUniformLocation(p, a)
    this.F = { p: loc(this.pF, 'p'), n: loc(this.pF, 'n'), c: loc(this.pF, 'c'), s: loc(this.pF, 's'), q: loc(this.pF, 'q'), M: uni(this.pF, 'M'), L1: uni(this.pF, 'L1'), L2: uni(this.pF, 'L2'), H: uni(this.pF, 'H'), a: uni(this.pF, 'a'), k: uni(this.pF, 'k') }
    this.Lp = { p: loc(this.pL, 'p'), s: loc(this.pL, 's'), M: uni(this.pL, 'M'), C: uni(this.pL, 'C'), H: uni(this.pL, 'H'), a: uni(this.pL, 'a') }
    this.P = { p: loc(this.pP, 'p'), c: loc(this.pP, 'c'), M: uni(this.pP, 'M') }
    this.bg = [0.93, 0.945, 0.96]
    this.bgT = [0.99, 0.995, 1.0]; this.bgB = [0.86, 0.89, 0.93]      // 🎨 G232 바탕 위 · 아래
    this.선색 = [0.14, 0.16, 0.20]; this.선알 = 0.5      // 🎨 G232 가는 윤곽 — BIM 프로그램처럼 또렷하되 작은 부재가 까맣게 뭉치지 않게
    this.hi = [0.12, 0.45, 0.95]
    this.투명 = false
    this.t = [0, 0, 0]; this.d = 50; this.yaw = -Math.PI / 3; this.pit = 0.5
    this.높이배 = 1; this.zc = 0
    this.B = null; this.BG = null
    this.사람 = null                // 🚶 G390 {p, nn, c, n} — 세상 m
    this.눈 = null                  // 🚶 G390 눈모드 {E:[x,y,z] m, h(방향), p(위아래)} — 있으면 그 사람 눈으로 봄
    this.고른 = new Set()
    this._dirty = true
    this._bind()
    this._loop = this._loop.bind(this)
    this._raf = requestAnimationFrame(this._loop)
  }

  /**
   * @param {Array} 부재들 [{id, 판:[[x,y]](mm), z0, z1, 색:[r,g,b](0~1)}]  — 기둥 · 보 · 벽(평면 다각형을 세움)
   *                    또는 {id, 면: 세모 꼭짓점 [x,y,z, …](mm), 선?: [x,y,z, …](mm · 둘씩), 색, 비침?: 0~1(비쳐 보임 · 고르기 안 됨)}  — 토목 덩어리 · 땅
   * @param {{바닥?:boolean, 바닥색?:number[]}} o 바닥: 건물 둘레 바닥 판
   */
  set부재(부재들, o = {}) {
    const gl = this.gl
    this._지움()
    const 짐 = () => ({ 위: [], 노: [], 색: [], 고: [], 번: [], 알: [] })
    const 단 = 짐(), 비 = 짐()          // 단단한 것 · 비쳐 보이는 것
    const 선 = [], 선고 = []
    this.범위 = new Map()           // id → {f0, fn, l0, ln, 비}
    let x0 = Infinity, y0 = Infinity, z0 = Infinity, x1 = -Infinity, y1 = -Infinity, z1 = -Infinity
    const 넓힘 = (x, y, z) => { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; if (z < z0) z0 = z; if (z > z1) z1 = z }
    for (const b of 부재들) {
      const rgb = b.색 || [0.7, 0.7, 0.7]
      const idc = [((b.id + 1) & 255) / 255, (((b.id + 1) >> 8) & 255) / 255, (((b.id + 1) >> 16) & 255) / 255]
      const 비침 = b.비침 > 0 && b.비침 < 1
      const T = 비침 ? 비 : 단
      const 알 = 비침 ? b.비침 : 1
      const f0 = T.위.length / 3, l0 = 선.length / 3
      const 꼭 = (x, y, z, nx, ny, nz) => { T.위.push(x, y, z); T.노.push(nx, ny, nz); T.색.push(rgb[0], rgb[1], rgb[2]); T.고.push(0); T.번.push(idc[0], idc[1], idc[2]); T.알.push(알) }
      if (b.면) {
        const m = b.면
        for (let i = 0; i + 8 < m.length; i += 9) {
          const ax = m[i] / 1000, ay = m[i + 1] / 1000, az = m[i + 2] / 1000
          const bx = m[i + 3] / 1000, by = m[i + 4] / 1000, bz = m[i + 5] / 1000
          const cx = m[i + 6] / 1000, cy = m[i + 7] / 1000, cz = m[i + 8] / 1000
          let nx = (by - ay) * (cz - az) - (bz - az) * (cy - ay), ny = (bz - az) * (cx - ax) - (bx - ax) * (cz - az), nz = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax)
          const l = Math.hypot(nx, ny, nz)
          if (!(l > 1e-12)) continue
          nx /= l; ny /= l; nz /= l
          꼭(ax, ay, az, nx, ny, nz); 꼭(bx, by, bz, nx, ny, nz); 꼭(cx, cy, cz, nx, ny, nz)
          if (!비침 || b.틀에) { 넓힘(ax, ay, az); 넓힘(bx, by, bz); 넓힘(cx, cy, cz) }
        }
        if (b.선) for (let i = 0; i + 5 < b.선.length; i += 6) { 선.push(b.선[i] / 1000, b.선[i + 1] / 1000, b.선[i + 2] / 1000, b.선[i + 3] / 1000, b.선[i + 4] / 1000, b.선[i + 5] / 1000); 선고.push(0, 0) }
        this.범위.set(b.id, { f0, fn: T.위.length / 3 - f0, l0, ln: 선.length / 3 - l0, 비: 비침 })
        continue
      }
      let P = b.판.map((q) => [q[0] / 1000, q[1] / 1000])
      if (P.length < 3) continue
      // 반시계로
      let s = 0; for (let i = 0; i < P.length; i++) { const a = P[i], c = P[(i + 1) % P.length]; s += a[0] * c[1] - c[0] * a[1] }
      if (s < 0) P = P.slice().reverse()
      const za = b.z0 / 1000, zb = b.z1 / 1000
      if (!(zb > za)) continue
      const T3 = 세모나누기(P)
      for (let i = 0; i < T3.length; i += 3) {
        for (const k of [T3[i], T3[i + 1], T3[i + 2]]) 꼭(P[k][0], P[k][1], zb, 0, 0, 1)
        for (const k of [T3[i], T3[i + 2], T3[i + 1]]) 꼭(P[k][0], P[k][1], za, 0, 0, -1)
      }
      for (let i = 0; i < P.length; i++) {
        const a = P[i], c = P[(i + 1) % P.length]
        const dx = c[0] - a[0], dy = c[1] - a[1], L = Math.hypot(dx, dy) || 1
        const nx = dy / L, ny = -dx / L
        꼭(a[0], a[1], za, nx, ny, 0); 꼭(c[0], c[1], za, nx, ny, 0); 꼭(c[0], c[1], zb, nx, ny, 0)
        꼭(a[0], a[1], za, nx, ny, 0); 꼭(c[0], c[1], zb, nx, ny, 0); 꼭(a[0], a[1], zb, nx, ny, 0)
        선.push(a[0], a[1], za, c[0], c[1], za, a[0], a[1], zb, c[0], c[1], zb)
        선고.push(0, 0, 0, 0)
      }
      // 세로 모서리 — 둥근 것(꼭짓점 많음)은 네 곳만
      const 둥근 = P.length > 8
      for (let i = 0; i < P.length; i++) {
        if (둥근 && i % Math.round(P.length / 4) !== 0) continue
        선.push(P[i][0], P[i][1], za, P[i][0], P[i][1], zb); 선고.push(0, 0)
      }
      this.범위.set(b.id, { f0, fn: T.위.length / 3 - f0, l0, ln: 선.length / 3 - l0, 비: 비침 })
      for (const q of P) 넓힘(q[0], q[1], za)
      넓힘(P[0][0], P[0][1], zb)
    }
    this.틀 = Number.isFinite(x0) ? [x0, y0, z0, x1, y1, z1] : null
    this.zc = this.틀 ? (this.틀[2] + this.틀[5]) / 2 : 0
    // 바닥 판(살짝 아래) — 건물이 땅에 선 느낌
    if (o.바닥 !== false && this.틀) {
      const m = Math.max(x1 - x0, y1 - y0) * 0.12 + 1, z = Number.isFinite(o.바닥z) ? o.바닥z / 1000 - 0.004 : z0 - 0.02     // 🚶 G390 바닥z(mm) — 둘러보기 맨 아래층 땅 높이
      const g = o.바닥색 || [0.86, 0.88, 0.90]
      const q = [[x0 - m, y0 - m], [x1 + m, y0 - m], [x1 + m, y1 + m], [x0 - m, y1 + m]]
      for (const k of [0, 1, 2, 0, 2, 3]) { 단.위.push(q[k][0], q[k][1], z); 단.노.push(0, 0, 1); 단.색.push(...g); 단.고.push(0); 단.번.push(0, 0, 0); 단.알.push(1) }
    }
    const 판 = (arr, T, 바뀜 = false) => { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, arr instanceof T ? arr : new T(arr), 바뀜 ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW); return b }
    const 묶 = (X) => {
      const 고배열 = new Float32Array(X.고)
      return { n: X.위.length / 3, 위치: new Float32Array(X.위), 고배열,
        p: null, nn: 판(X.노, Float32Array), c: 판(X.색, Float32Array), id: 판(X.번, Float32Array), q: 판(X.알, Float32Array), s: 판(고배열, Float32Array, true) }
    }
    const A = 묶(단), Bv = 묶(비)
    A.p = 판(A.위치, Float32Array); Bv.p = 판(Bv.위치, Float32Array)
    this.선고배열 = new Float32Array(선고)
    this.B = {
      n: A.n, ln: 선.length / 3, 단: A, 비: Bv,
      lp: 판(선, Float32Array),
      ls: 판(this.선고배열, Float32Array, true),
    }
    this.고른 = new Set()
    this.dirty()
  }

  /** 바탕 선(도면 선 · 노선) — [x,y,z, x,y,z, …](mm) · 고르기 안 됨 */
  set배경(선, 색 = [0.35, 0.38, 0.42], 알 = 0.35) {
    const gl = this.gl
    if (this.BG) { gl.deleteBuffer(this.BG.p); this.BG = null }
    if (!선 || !선.length) { this.dirty(); return }
    const a = new Float32Array(선.length)
    for (let i = 0; i < 선.length; i++) a[i] = 선[i] / 1000
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, a, gl.STATIC_DRAW)
    this.BG = { p: b, n: a.length / 3, 색, 알 }
    this.dirty()
  }
  /** 🚶 G390 걷는 사람 — {위, 노, 색}(Float32Array · m · 세상 좌표) 또는 그림 입힌 모델 {부분: [{위, 노, 부분: {uv, 색인, 재}}]} · null 이면 지움 */
  set사람(몸) {
    const gl = this.gl
    if (몸 && Array.isArray(몸.부분)) { this._사람그림(몸.부분); return }
    if (this.사람그림) this._사람그림(null)
    if (!몸 || !몸.위 || !몸.위.length) { if (this.사람) { for (const k of ['p', 'nn', 'c']) gl.deleteBuffer(this.사람[k]); this.사람 = null } this.dirty(); return }
    const 올 = (buf, arr) => { gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, arr, gl.DYNAMIC_DRAW) }
    if (!this.사람) this.사람 = { p: gl.createBuffer(), nn: gl.createBuffer(), c: gl.createBuffer(), n: 0 }
    올(this.사람.p, 몸.위); 올(this.사람.nn, 몸.노); 올(this.사람.c, 몸.색)
    this.사람.n = 몸.위.length / 3
    this.dirty()
  }
  /** 🚶 G390 그림 입힌 사람 — 부분마다 uv · 색인 · 그림은 한 번만 올리고(같은 부분이면 다시 안 씀) 위 · 노만 매번 */
  _사람그림(부분들) {
    const gl = this.gl
    if (!this.pT) {
      this.pT = prog(gl, VST, FST)
      this.Tp = { p: gl.getAttribLocation(this.pT, 'p'), n: gl.getAttribLocation(this.pT, 'n'), u: gl.getAttribLocation(this.pT, 'u'), M: gl.getUniformLocation(this.pT, 'M'), L1: gl.getUniformLocation(this.pT, 'L1'), T: gl.getUniformLocation(this.pT, 'T'), C: gl.getUniformLocation(this.pT, 'C'), tex: gl.getUniformLocation(this.pT, 'tex'), cut: gl.getUniformLocation(this.pT, 'cut') }
      this._그림판 = new Map()     // 그림(이미지) → 텍스처
    }
    const 옛 = this.사람그림 || []
    /* 부분들이 같은 꼭짓점 배열을 나눠 쓰면(VRoid) GPU 칸도 나눠 씀 — 지울 때는 한 번만 */
    const 다지움 = (목록) => { const 본 = new Set(); for (const r of 목록) for (const k of ['p', 'n', 'u', 'i']) if (r[k] && !본.has(r[k])) { 본.add(r[k]); gl.deleteBuffer(r[k]) } }
    if (!부분들) { 다지움(옛); for (const t of this._그림판.values()) gl.deleteTexture(t); this._그림판.clear(); this.사람그림 = null; this.dirty(); return }
    const 같음 = 옛.length === 부분들.length && 옛.every((r, k) => r.원 === 부분들[k].부분)
    if (!같음) {
      다지움(옛)
      const 나눔 = new Map()        // 원본 꼭짓점 배열(q.위치) → {p, n} · uv 배열 → u
      const 나눔u = new Map()
      this.사람그림 = 부분들.map(({ 부분: q }) => {
        const 키 = q.위치 || q, 덧 = q.노드 + '|' + q.스킨번
        if (!나눔.has(키)) 나눔.set(키, new Map())
        if (!나눔.get(키).has(덧)) 나눔.get(키).set(덧, { p: gl.createBuffer(), n: gl.createBuffer() })
        const 칸 = 나눔.get(키).get(덧)
        const r = { 원: q, p: 칸.p, n: 칸.n, u: null, i: gl.createBuffer(), 수: q.색인.length, 큰: false, 재: q.재 }
        if (q.uv) { if (!나눔u.has(q.uv)) { const u = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, u); gl.bufferData(gl.ARRAY_BUFFER, q.uv, gl.STATIC_DRAW); 나눔u.set(q.uv, u) } r.u = 나눔u.get(q.uv) }
        let 최대 = 0; for (let k = 0; k < q.색인.length; k++) if (q.색인[k] > 최대) 최대 = q.색인[k]
        r.큰 = 최대 > 65535
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, r.i); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, r.큰 ? q.색인 : Uint16Array.from(q.색인), gl.STATIC_DRAW)
        if (r.큰 && !this.uint) r.수 = 0
        const 그림 = q.재 && q.재.그림
        if (그림 && !this._그림판.has(그림)) {
          const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t)
          try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, 그림) } catch (e) { /* 못 올림 — 색만 */ }
          const 두제곱 = (v) => v > 0 && (v & (v - 1)) === 0
          const w = 그림.width || 0, h = 그림.height || 0
          if (두제곱(w) && 두제곱(h)) { gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR) }
          else { gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE) }
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
          this._그림판.set(그림, t)
        }
        r.t = 그림 ? this._그림판.get(그림) : null
        return r
      })
    }
    const 올림 = new Set()
    this.사람그림.forEach((r, k) => {
      if (올림.has(r.p)) return
      올림.add(r.p)
      gl.bindBuffer(gl.ARRAY_BUFFER, r.p); gl.bufferData(gl.ARRAY_BUFFER, 부분들[k].위, gl.DYNAMIC_DRAW)
      gl.bindBuffer(gl.ARRAY_BUFFER, r.n); gl.bufferData(gl.ARRAY_BUFFER, 부분들[k].노, gl.DYNAMIC_DRAW)
    })
    if (this.사람) { for (const k of ['p', 'nn', 'c']) gl.deleteBuffer(this.사람[k]); this.사람 = null }
    this.dirty()
  }
  _사람그림그리기(M) {
    const gl = this.gl, T = this.Tp
    gl.useProgram(this.pT)
    gl.uniformMatrix4fv(T.M, false, M); gl.uniform3f(T.L1, 0.38, -0.62, 0.69); gl.uniform1i(T.T, 0)
    gl.activeTexture(gl.TEXTURE0)
    const 그리기 = (r) => {
      if (!r.수) return
      gl.bindBuffer(gl.ARRAY_BUFFER, r.p); gl.enableVertexAttribArray(T.p); gl.vertexAttribPointer(T.p, 3, gl.FLOAT, false, 0, 0)
      gl.bindBuffer(gl.ARRAY_BUFFER, r.n); gl.enableVertexAttribArray(T.n); gl.vertexAttribPointer(T.n, 3, gl.FLOAT, false, 0, 0)
      if (r.u && T.u >= 0) { gl.bindBuffer(gl.ARRAY_BUFFER, r.u); gl.enableVertexAttribArray(T.u); gl.vertexAttribPointer(T.u, 2, gl.FLOAT, false, 0, 0) } else if (T.u >= 0) { gl.disableVertexAttribArray(T.u); gl.vertexAttrib2f(T.u, 0, 0) }
      const c = (r.재 && r.재.색) || [1, 1, 1, 1]
      gl.uniform4f(T.C, c[0], c[1], c[2], c[3] ?? 1)
      gl.uniform1f(T.tex, r.t ? 1 : 0); if (r.t) gl.bindTexture(gl.TEXTURE_2D, r.t)
      gl.uniform1f(T.cut, r.재 && r.재.알파 === 'MASK' ? (r.재.자름 ?? 0.5) : r.재 && r.재.알파 === 'BLEND' ? 0.02 : -1)
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, r.i)
      gl.drawElements(gl.TRIANGLES, r.수, r.큰 ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT, 0)
    }
    gl.disable(gl.BLEND); gl.depthMask(true)
    for (const r of this.사람그림) if (!(r.재 && r.재.알파 === 'BLEND')) 그리기(r)
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false)
    for (const r of this.사람그림) if (r.재 && r.재.알파 === 'BLEND') 그리기(r)
    gl.depthMask(true); gl.disable(gl.BLEND)
    for (const loc of [T.p, T.n, T.u]) if (loc >= 0) gl.disableVertexAttribArray(loc)
  }
  /** 🚶 G390 눈모드 — e = {E:[x,y,z](m), h, p} · null 이면 보통(돌려 보기) */
  set눈(e) { this.눈 = e ? { E: e.E.slice(), h: +e.h || 0, p: +e.p || 0 } : null; this.dirty() }
  /** 높이 키우기(넓은 토목 현장에서 높낮이가 잘 보이게) — 1 = 그대로 */
  set높이배(k) { this.높이배 = Math.max(1, Math.min(20, +k || 1)); this.dirty() }

  /** 고른 부재(ids) 칠하기 */
  set고름(ids) {
    if (!this.B) return
    const gl = this.gl
    const 새 = new Set(ids || [])
    const 바뀜 = new Set([...this.고른].filter((x) => !새.has(x)).concat([...새].filter((x) => !this.고른.has(x))))
    for (const id of 바뀜) {
      const r = this.범위.get(id); if (!r) continue
      const v = 새.has(id) ? 1 : 0
      ;(r.비 ? this.B.비 : this.B.단).고배열.fill(v, r.f0, r.f0 + r.fn)
      this.선고배열.fill(v, r.l0, r.l0 + r.ln)
    }
    this.고른 = 새
    for (const X of [this.B.단, this.B.비]) { if (!X.n) continue; gl.bindBuffer(gl.ARRAY_BUFFER, X.s); gl.bufferSubData(gl.ARRAY_BUFFER, 0, X.고배열) }
    if (this.선고배열.length) { gl.bindBuffer(gl.ARRAY_BUFFER, this.B.ls); gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.선고배열) }
    this.dirty()
  }
  set투명(v) { this.투명 = !!v; this.dirty() }

  /** view: 'tilt' 기울여 · 'top' 위 · 'front' 앞 · 'side' 옆 */
  fit(view = 'tilt', box = this.틀) {
    if (!box) return
    const k = this.높이배 || 1
    this.t = [(box[0] + box[3]) / 2, (box[1] + box[4]) / 2, this.zc + ((box[2] + box[5]) / 2 - this.zc) * k]
    const dx = Math.max(box[3] - box[0], 0.1), dy = Math.max(box[4] - box[1], 0.1), dz = Math.max((box[5] - box[2]) * k, 0.1)
    const a = Math.min(3, Math.max(0.4, (this.cv.clientWidth || 1) / (this.cv.clientHeight || 1)))
    /* 거리 L 에서 화면 세로로 보이는 길이 = 2·L·tan(22.5°) ≈ 0.83·L — 가까운 면(지붕 · 앞면)까지 다 들게 깊이의 반을 더함 */
    const 보임 = 2 * Math.tan(Math.PI / 8)
    if (view === 'top') { this.yaw = -Math.PI / 2; this.pit = Math.PI / 2 - 1e-3; this.d = (Math.max(dy, dx / a) / 보임) * 1.12 + dz / 2 }
    else if (view === 'front') { this.yaw = -Math.PI / 2; this.pit = 0.03; this.d = (Math.max(dz, dx / a) / 보임) * 1.12 + dy / 2 }
    else if (view === 'side') { this.yaw = 0; this.pit = 0.03; this.d = (Math.max(dz, dy / a) / 보임) * 1.12 + dx / 2 }
    else {
      /* 건물 전체를 품는 공(반지름 r)이 화면의 좁은 쪽 화각 안에 들게 — 바닥 · 꼭대기가 잘리지 않게 */
      this.yaw = -Math.PI / 3; this.pit = 0.45
      const r = 0.5 * Math.hypot(dx, dy, dz)
      const 세로 = Math.PI / 4, 가로 = 2 * Math.atan(Math.tan(세로 / 2) * a)
      this.d = (r / Math.sin(Math.min(세로, 가로) / 2)) * 1.02
    }
    this.dirty()
  }
  /** 부재 하나(또는 여럿)로 다가가기 */
  보기로(ids, 최소 = 6) {
    if (!this.B || !ids || !ids.length) return
    let b = null
    for (const id of ids) {
      const r = this.범위.get(id); if (!r) continue
      const X = r.비 ? this.B.비 : this.B.단
      const src = X.위치.subarray(r.f0 * 3, (r.f0 + r.fn) * 3)
      b = b || [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity]
      for (let i = 0; i < src.length; i += 3) { b[0] = Math.min(b[0], src[i]); b[1] = Math.min(b[1], src[i + 1]); b[2] = Math.min(b[2], src[i + 2]); b[3] = Math.max(b[3], src[i]); b[4] = Math.max(b[4], src[i + 1]); b[5] = Math.max(b[5], src[i + 2]) }
    }
    if (!b || !Number.isFinite(b[0])) return
    const k = this.높이배 || 1
    this.t = [(b[0] + b[3]) / 2, (b[1] + b[4]) / 2, this.zc + ((b[2] + b[5]) / 2 - this.zc) * k]
    this.d = Math.max(Math.max(b[3] - b[0], b[4] - b[1], (b[5] - b[2]) * k) * 2.2, 최소)          // 🔎 G280 검수에서는 둘레가 보이게 더 멀리(최소 14 m)
    this.dirty()
  }

  dirty() { this._dirty = true }
  _cam() { if (this.눈) return this.눈.E; const cp = Math.cos(this.pit); return [this.t[0] + this.d * cp * Math.cos(this.yaw), this.t[1] + this.d * cp * Math.sin(this.yaw), this.t[2] + this.d * Math.sin(this.pit)] }
  _M(w, h) {
    const 눈 = this.눈
    /* 🚶 G390 눈모드 · 걷기 — 가까운 면 5 cm · 먼 면 3 km(건물 안에서도 먼 끝까지) */
    const P = 눈 ? persp(Math.PI / 3, w / h, 0.05, 3000) : persp(Math.PI / 4, w / h, this.가까이 ? Math.min(this.d / 400, 0.03) : this.d / 400, this.가까이 ? Math.max(this.d * 60, 1500) : this.d * 60)
    const k = 눈 ? 1 : (this.높이배 || 1)
    /* 높이 키우기 — z' = zc + (z − zc)·k */
    const S = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, k, 0, 0, 0, this.zc * (1 - k), 1]
    if (눈) { const cp = Math.cos(눈.p); const T = [눈.E[0] + Math.cos(눈.h) * cp, 눈.E[1] + Math.sin(눈.h) * cp, 눈.E[2] + Math.sin(눈.p)]; return mm(mm(P, look(눈.E, T, [0, 0, 1])), S) }
    return mm(mm(P, look(this._cam(), this.t, [0, 0, 1])), S)
  }

  draw() {
    const gl = this.gl, cv = this.cv
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = Math.max(1, Math.round(cv.clientWidth * dpr)), h = Math.max(1, Math.round(cv.clientHeight * dpr))
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h }
    gl.viewport(0, 0, w, h)
    gl.clearColor(this.bg[0], this.bg[1], this.bg[2], 1)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    /* 바탕 그러데이션 */
    gl.disable(gl.DEPTH_TEST); gl.useProgram(this.pB)
    gl.uniform3f(this.Bg.T, this.bgT[0], this.bgT[1], this.bgT[2]); gl.uniform3f(this.Bg.B, this.bgB[0], this.bgB[1], this.bgB[2])
    gl.bindBuffer(gl.ARRAY_BUFFER, this.Bg.buf); gl.enableVertexAttribArray(this.Bg.p); gl.vertexAttribPointer(this.Bg.p, 2, gl.FLOAT, false, 0, 0)
    gl.drawArrays(gl.TRIANGLES, 0, 6); gl.disableVertexAttribArray(this.Bg.p)
    if (!this.B || (!this.B.단.n && !this.B.비.n && !this.BG)) return
    const M = new Float32Array(this._M(w, h))
    gl.enable(gl.DEPTH_TEST)
    const 붙 = (loc, buf, n) => { gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, n, gl.FLOAT, false, 0, 0) }
    /* 면 */
    gl.useProgram(this.pF)
    gl.uniformMatrix4fv(this.F.M, false, M)
    gl.uniform3f(this.F.L1, 0.38, -0.62, 0.69); gl.uniform3f(this.F.L2, -0.55, 0.45, 0.35)
    gl.uniform3f(this.F.H, this.hi[0], this.hi[1], this.hi[2])
    gl.uniform1f(this.F.k, this.높이배 || 1)
    const 면그리기 = (X) => {
      if (!X.n) return
      붙(this.F.p, X.p, 3); 붙(this.F.n, X.nn, 3); 붙(this.F.c, X.c, 3); 붙(this.F.s, X.s, 1); 붙(this.F.q, X.q, 1)
      gl.drawArrays(gl.TRIANGLES, 0, X.n)
    }
    gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(1, 1)
    if (this.투명) {
      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false)
      gl.uniform1f(this.F.a, 0.3)
    } else gl.uniform1f(this.F.a, 1)
    면그리기(this.B.단)
    gl.disable(gl.POLYGON_OFFSET_FILL)
    /* 비쳐 보이는 것(흙 · 땅) — 단단한 것 뒤에, 깊이는 안 씀 */
    if (this.B.비.n) {
      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false)
      gl.uniform1f(this.F.a, this.투명 ? 0.6 : 1)
      면그리기(this.B.비)
      if (!this.투명) gl.depthMask(true)
    }
    for (const loc of [this.F.p, this.F.n, this.F.c, this.F.s, this.F.q]) gl.disableVertexAttribArray(loc)
    /* 🚶 G390 걷는 사람 — 단단히(비침 · 투명 보기에서도 또렷하게) */
    if (this.사람그림 && this.사람그림.length) { this._사람그림그리기(M); gl.useProgram(this.pF) }
    if (this.사람 && this.사람.n) {
      gl.disable(gl.BLEND); gl.depthMask(true); gl.uniform1f(this.F.a, 1)
      붙(this.F.p, this.사람.p, 3); 붙(this.F.n, this.사람.nn, 3); 붙(this.F.c, this.사람.c, 3)
      gl.disableVertexAttribArray(this.F.s); gl.vertexAttrib1f(this.F.s, 0); gl.disableVertexAttribArray(this.F.q); gl.vertexAttrib1f(this.F.q, 1)
      gl.drawArrays(gl.TRIANGLES, 0, this.사람.n)
      for (const loc of [this.F.p, this.F.n, this.F.c]) gl.disableVertexAttribArray(loc)
    }
    /* 모서리 · 바탕 선 */
    gl.useProgram(this.pL)
    gl.uniformMatrix4fv(this.Lp.M, false, M)
    gl.uniform3f(this.Lp.H, this.hi[0], this.hi[1], this.hi[2])
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    if (this.BG && this.BG.n) {
      gl.uniform3f(this.Lp.C, this.BG.색[0], this.BG.색[1], this.BG.색[2]); gl.uniform1f(this.Lp.a, this.BG.알)
      붙(this.Lp.p, this.BG.p, 3); gl.disableVertexAttribArray(this.Lp.s); gl.vertexAttrib1f(this.Lp.s, 0)
      gl.drawArrays(gl.LINES, 0, this.BG.n)
    }
    if (this.B.ln) {
      gl.uniform3f(this.Lp.C, this.선색[0], this.선색[1], this.선색[2])
      gl.uniform1f(this.Lp.a, this.투명 ? 0.45 : this.선알)
      붙(this.Lp.p, this.B.lp, 3); 붙(this.Lp.s, this.B.ls, 1)
      gl.drawArrays(gl.LINES, 0, this.B.ln)
    }
    gl.disableVertexAttribArray(this.Lp.p); gl.disableVertexAttribArray(this.Lp.s)
    gl.disable(gl.BLEND); gl.depthMask(true)
  }

  /** 💬 G393 3D 점(m) → 캔버스 안 화면 자리(CSS px) · 뒤 · 화면 밖이면 null (둘러보기 말풍선) */
  화면점(x, y, z) {
    const cv = this.cv, w = cv.width || 1, h = cv.height || 1
    const m = this._M(w, h)
    const o = [0, 1, 2, 3].map((i) => m[i] * x + m[4 + i] * y + m[8 + i] * z + m[12 + i])
    if (!(o[3] > 1e-6)) return null
    const nx = o[0] / o[3], ny = o[1] / o[3]
    if (Math.abs(nx) > 1.05 || Math.abs(ny) > 1.05) return null
    const r = cv.getBoundingClientRect()
    return { x: ((nx + 1) / 2) * r.width, y: ((1 - ny) / 2) * r.height }
  }

  /** 화면 (clientX, clientY) 의 부재 id — 없으면 -1 */
  /** 🖱 G390 누른 화면 자리 → 높이 z 바닥 위 점(m) — 하늘을 누르면 null (둘러보기 «누른 곳으로 걷기») */
  바닥점(cx, cy, z = 0) {
    const cv = this.cv, r = cv.getBoundingClientRect()
    const w = cv.width || 1, h = cv.height || 1
    const nx = ((cx - r.left) / Math.max(1, r.width)) * 2 - 1, ny = 1 - ((cy - r.top) / Math.max(1, r.height)) * 2
    const I = 역4(this._M(w, h))
    if (!I) return null
    const 풀 = (zn) => { const o = [0, 1, 2, 3].map((i) => I[i] * nx + I[4 + i] * ny + I[8 + i] * zn + I[12 + i]); return [o[0] / o[3], o[1] / o[3], o[2] / o[3]] }
    const a = 풀(-1), b = 풀(1), dz = b[2] - a[2]
    if (Math.abs(dz) < 1e-12) return null
    const t = (z - a[2]) / dz
    if (!(t >= 0 && t <= 1)) return null
    return { x: a[0] + (b[0] - a[0]) * t, y: a[1] + (b[1] - a[1]) * t }
  }

  고르기(cx, cy) {
    if (!this.B || !this.B.단.n) return -1
    const gl = this.gl, cv = this.cv
    const r = cv.getBoundingClientRect()
    const w = cv.width, h = cv.height
    const px = Math.round(((cx - r.left) / Math.max(1, r.width)) * w), py = Math.round((1 - (cy - r.top) / Math.max(1, r.height)) * h)
    if (px < 0 || py < 0 || px >= w || py >= h) return -1
    if (!this._fb || this._fbw !== w || this._fbh !== h) {
      if (this._fb) { gl.deleteFramebuffer(this._fb); gl.deleteTexture(this._ft); gl.deleteRenderbuffer(this._fr) }
      this._ft = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, this._ft)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      this._fr = gl.createRenderbuffer(); gl.bindRenderbuffer(gl.RENDERBUFFER, this._fr); gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, w, h)
      this._fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, this._fb)
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this._ft, 0)
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this._fr)
      this._fbw = w; this._fbh = h
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, this._fb)
    gl.viewport(0, 0, w, h)
    gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.enable(gl.DEPTH_TEST); gl.disable(gl.BLEND)
    gl.useProgram(this.pP)
    gl.uniformMatrix4fv(this.P.M, false, new Float32Array(this._M(w, h)))
    gl.bindBuffer(gl.ARRAY_BUFFER, this.B.단.p); gl.enableVertexAttribArray(this.P.p); gl.vertexAttribPointer(this.P.p, 3, gl.FLOAT, false, 0, 0)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.B.단.id); gl.enableVertexAttribArray(this.P.c); gl.vertexAttribPointer(this.P.c, 3, gl.FLOAT, false, 0, 0)
    gl.drawArrays(gl.TRIANGLES, 0, this.B.단.n)
    gl.disableVertexAttribArray(this.P.p); gl.disableVertexAttribArray(this.P.c)
    // 손가락은 굵으니 둘레 몇 픽셀도 봄(가운데부터)
    const 반 = 4
    const buf = new Uint8Array((반 * 2 + 1) * (반 * 2 + 1) * 4)
    const x0 = Math.max(0, px - 반), y0 = Math.max(0, py - 반)
    const ww = Math.min(w - x0, 반 * 2 + 1), hh = Math.min(h - y0, 반 * 2 + 1)
    gl.readPixels(x0, y0, ww, hh, gl.RGBA, gl.UNSIGNED_BYTE, buf)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    let best = -1, bd = Infinity
    for (let j = 0; j < hh; j++) for (let i = 0; i < ww; i++) {
      const k = (j * ww + i) * 4
      const id = buf[k] + (buf[k + 1] << 8) + (buf[k + 2] << 16) - 1
      if (id < 0) continue
      const d = (x0 + i - px) ** 2 + (y0 + j - py) ** 2
      if (d < bd) { bd = d; best = id }
    }
    this.dirty()
    return best
  }

  _loop() {
    if (this._dead) return
    /* 🩹 G386 높이도 봄 — 폭은 그대로인데 칸 높이만 바뀌면(폰에서 칸이 늦게 자리 잡음 · «크게») 예전 판 크기로 남아 아래가 검게 비던 것 */
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const 맞나 = this.cv.width === Math.round(this.cv.clientWidth * dpr) && this.cv.height === Math.max(1, Math.round(this.cv.clientHeight * dpr))
    if (this._dirty || !맞나) { this._dirty = false; this.draw() }
    this._raf = requestAnimationFrame(this._loop)
  }
  png() { this.draw(); return this.cv.toDataURL('image/png') }

  _pan(dx, dy) {
    const k = (this.d * 2 * Math.tan(Math.PI / 8)) / Math.max(1, this.cv.clientHeight)
    const cy = Math.cos(this.yaw), sy = Math.sin(this.yaw), sp = Math.sin(this.pit), cp = Math.cos(this.pit)
    const rx = -sy, ry = cy, ux = -sp * cy, uy = -sp * sy, uz = cp
    this.t[0] += (-dx * rx + dy * ux) * k; this.t[1] += (-dx * ry + dy * uy) * k; this.t[2] += (dy * uz) * k
    this.dirty()
  }
  _rot(dx, dy) {
    if (this.눈) { this.눈.h -= dx * 0.005; this.눈.p = Math.max(-1.2, Math.min(1.2, this.눈.p - dy * 0.005)); if (this.onLook) this.onLook(this.눈.h, this.눈.p); this.dirty(); return }   // 🚶 G390 눈모드 = 고개 돌리기
    this.yaw -= dx * 0.006; this.pit = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 1e-3, this.pit + dy * 0.006)); this.dirty()
  }
  _zoom(f) { if (this.눈) return; this.d = Math.max(this.가까이 ? 1.2 : 0.5, Math.min(5000, this.d * f)); this.dirty() }

  _bind() {
    const cv = this.cv
    const ps = new Map()
    let pinch = null, 누름 = null
    const down = (e) => {
      if (ps.size === 0) 누름 = { x: e.clientX, y: e.clientY, b: e.button }
      try { cv.setPointerCapture(e.pointerId) } catch (er) { /* 무시 */ }
      ps.set(e.pointerId, { x: e.clientX, y: e.clientY, b: e.button, s: e.shiftKey || e.ctrlKey })
      if (ps.size === 2) { const [a, b] = [...ps.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 }; 누름 = null }
    }
    const move = (e) => {
      const p = ps.get(e.pointerId)
      if (!p) return
      const dx = e.clientX - p.x, dy = e.clientY - p.y
      if (ps.size === 1) {
        const 옮 = p.b === 2 || p.b === 1 || p.s || e.shiftKey
        if ((this.끌어옮기기 ? !옮 : 옮) && !this.눈 && !this.가까이) this._pan(dx, dy); else this._rot(dx, dy)
      }
      p.x = e.clientX; p.y = e.clientY
      if (ps.size === 2 && pinch) {
        const [a, b] = [...ps.values()]
        const d = Math.hypot(a.x - b.x, a.y - b.y), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2
        if (d > 0 && pinch.d > 0) this._zoom(pinch.d / d)
        this._pan(mx - pinch.mx, my - pinch.my)
        pinch = { d, mx, my }
      }
    }
    const up = (e) => {
      ps.delete(e.pointerId); if (ps.size < 2) pinch = null
      if (누름 && ps.size === 0) {
        const 짧 = Math.hypot(e.clientX - 누름.x, e.clientY - 누름.y) < 6 && 누름.b === 0
        누름 = null
        if (짧 && this.onPick) this.onPick(this.고르기(e.clientX, e.clientY), e)
      }
    }
    const wheel = (e) => { e.preventDefault(); this._zoom(Math.exp(Math.max(-100, Math.min(100, e.deltaY)) * 0.0015)) }
    const ctx = (e) => e.preventDefault()
    cv.addEventListener('pointerdown', down); cv.addEventListener('pointermove', move)
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up)
    cv.addEventListener('wheel', wheel, { passive: false }); cv.addEventListener('contextmenu', ctx)
    this._unbind = () => {
      cv.removeEventListener('pointerdown', down); cv.removeEventListener('pointermove', move)
      cv.removeEventListener('pointerup', up); cv.removeEventListener('pointercancel', up)
      cv.removeEventListener('wheel', wheel); cv.removeEventListener('contextmenu', ctx)
    }
  }
  _지움() {
    const gl = this.gl
    if (this.B) {
      for (const X of [this.B.단, this.B.비]) if (X) for (const k of ['p', 'nn', 'c', 'id', 's', 'q']) if (X[k]) gl.deleteBuffer(X[k])
      for (const k of ['lp', 'ls']) if (this.B[k]) gl.deleteBuffer(this.B[k])
    }
    this.B = null
  }
  dispose() {
    this._dead = true
    cancelAnimationFrame(this._raf)
    if (this._unbind) this._unbind()
    this._지움()
    const gl = this.gl
    if (this.BG) { gl.deleteBuffer(this.BG.p); this.BG = null }
    if (this.사람) { for (const k of ['p', 'nn', 'c']) gl.deleteBuffer(this.사람[k]); this.사람 = null }
    if (this.사람그림) this._사람그림(null)
    if (this._fb) { gl.deleteFramebuffer(this._fb); gl.deleteTexture(this._ft); gl.deleteRenderbuffer(this._fr) }
  }
}
