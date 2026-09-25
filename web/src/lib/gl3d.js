/**
 * 📦 선 3D 보기 — WebGL 한 장 (2026-09-25)
 *
 * three.js 를 들이지 않았습니다. 선만 그리면 되어 200줄이면 되고,
 * 꾸러미를 늘리면 깃허브 자동 빌드(npm ci)를 건드려야 해서입니다.
 * WebGL1 이라 오래된 폰에서도 돕니다.
 *
 * 조작: 끌기 = 돌리기 · 오른쪽 끌기/Shift+끌기/두 손가락 = 옮기기 · 휠/벌리기 = 확대
 */

const VS = `
attribute vec3 p; attribute vec3 c;
uniform mat4 M; uniform float zs; uniform float ps;
varying vec3 v;
void main(){ gl_Position = M * vec4(p.x, p.y, p.z * zs, 1.0); v = c; gl_PointSize = ps; }`
const FS = `
precision mediump float; varying vec3 v;
void main(){ gl_FragColor = vec4(v, 1.0); }`

/* 🏢 2026-09-26 — 세운 벽 «면» 을 그리는 두 번째 붓. 빛(한 방향)을 받아 밝고 어두움이 생겨야 입체로 보입니다. */
const VS2 = `
attribute vec3 p; attribute vec3 n; attribute vec3 c;
uniform mat4 M; uniform float zs; uniform vec3 L;
varying vec3 v;
void main(){ gl_Position = M * vec4(p.x, p.y, p.z * zs, 1.0);
  float d = abs(dot(normalize(vec3(n.x, n.y, n.z / zs)), L));
  v = c * (0.42 + 0.58 * d); }`
const FS2 = `
precision mediump float; varying vec3 v; uniform float a;
void main(){ gl_FragColor = vec4(v, a); }`

function sh(gl, t, src) {
  const s = gl.createShader(t)
  gl.shaderSource(s, src); gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s))
  return s
}

/* 4×4 (열 우선, WebGL 꼴) */
function persp(fy, a, n, f) {
  const t = 1 / Math.tan(fy / 2), nf = 1 / (n - f)
  return [t / a, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) * nf, -1, 0, 0, 2 * f * n * nf, 0]
}
function look(e, c, u) {
  let zx = e[0] - c[0], zy = e[1] - c[1], zz = e[2] - c[2]
  let l = Math.hypot(zx, zy, zz) || 1; zx /= l; zy /= l; zz /= l
  let xx = u[1] * zz - u[2] * zy, xy = u[2] * zx - u[0] * zz, xz = u[0] * zy - u[1] * zx
  l = Math.hypot(xx, xy, xz) || 1; xx /= l; xy /= l; xz /= l
  const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx
  return [xx, yx, zx, 0, xy, yy, zy, 0, xz, yz, zz, 0,
    -(xx * e[0] + xy * e[1] + xz * e[2]), -(yx * e[0] + yy * e[1] + yz * e[2]), -(zx * e[0] + zy * e[1] + zz * e[2]), 1]
}
function mm(a, b) {
  const r = new Array(16)
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
    r[j * 4 + i] = a[i] * b[j * 4] + a[4 + i] * b[j * 4 + 1] + a[8 + i] * b[j * 4 + 2] + a[12 + i] * b[j * 4 + 3]
  }
  return r
}

export class LineView {
  constructor(canvas) {
    this.cv = canvas
    const gl = canvas.getContext('webgl', { antialias: true, preserveDrawingBuffer: false })
      || canvas.getContext('experimental-webgl')
    if (!gl) throw new Error('webgl')
    this.gl = gl
    const pr = gl.createProgram()
    gl.attachShader(pr, sh(gl, gl.VERTEX_SHADER, VS))
    gl.attachShader(pr, sh(gl, gl.FRAGMENT_SHADER, FS))
    gl.linkProgram(pr)
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr))
    this.pr = pr
    this.aP = gl.getAttribLocation(pr, 'p'); this.aC = gl.getAttribLocation(pr, 'c')
    this.uM = gl.getUniformLocation(pr, 'M'); this.uZ = gl.getUniformLocation(pr, 'zs'); this.uS = gl.getUniformLocation(pr, 'ps')
    const p2 = gl.createProgram()
    gl.attachShader(p2, sh(gl, gl.VERTEX_SHADER, VS2))
    gl.attachShader(p2, sh(gl, gl.FRAGMENT_SHADER, FS2))
    gl.linkProgram(p2)
    if (!gl.getProgramParameter(p2, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p2))
    this.p2 = p2
    this.bP = gl.getAttribLocation(p2, 'p'); this.bN = gl.getAttribLocation(p2, 'n'); this.bC = gl.getAttribLocation(p2, 'c')
    this.vM = gl.getUniformLocation(p2, 'M'); this.vZ = gl.getUniformLocation(p2, 'zs'); this.vL = gl.getUniformLocation(p2, 'L'); this.vA = gl.getUniformLocation(p2, 'a')
    this.면투명 = 0.55
    this.L = []
    this.zs = 1
    this.t = [0, 0, 0]; this.d = 100; this.yaw = -Math.PI / 3; this.pit = 0.55
    this.bg = [0.043, 0.071, 0.125]
    this._dirty = true; this._raf = 0
    this._bind()
    this._loop = this._loop.bind(this)
    this._raf = requestAnimationFrame(this._loop)
  }

  setLayers(layers) {
    const gl = this.gl
    for (const l of this.L) for (const b of [l.vb, l.cb, l.pb, l.pcb, l.tb, l.tnb, l.tcb]) if (b) gl.deleteBuffer(b)
    this.L = layers.map((x) => {
      const o = { name: x.name, on: !x.off, n: x.pos.length / 3, pn: x.pts.length / 3, tn: x.tri ? x.tri.length / 3 : 0 }
      if (o.tn) {
        o.tb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, o.tb); gl.bufferData(gl.ARRAY_BUFFER, x.tri, gl.STATIC_DRAW)
        o.tnb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, o.tnb); gl.bufferData(gl.ARRAY_BUFFER, x.trn, gl.STATIC_DRAW)
        o.tcb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, o.tcb); gl.bufferData(gl.ARRAY_BUFFER, x.trc, gl.STATIC_DRAW)
      }
      if (o.n) {
        o.vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, o.vb); gl.bufferData(gl.ARRAY_BUFFER, x.pos, gl.STATIC_DRAW)
        o.cb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, o.cb); gl.bufferData(gl.ARRAY_BUFFER, x.col, gl.STATIC_DRAW)
      }
      if (o.pn) {
        o.pb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, o.pb); gl.bufferData(gl.ARRAY_BUFFER, x.pts, gl.STATIC_DRAW)
        o.pcb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, o.pcb); gl.bufferData(gl.ARRAY_BUFFER, x.pcol, gl.STATIC_DRAW)
      }
      return o
    })
    this.dirty()
  }
  setOn(name, on) { for (const l of this.L) if (l.name === name) l.on = on; this.dirty() }
  setAll(fn) { for (const l of this.L) l.on = !!fn(l.name); this.dirty() }
  set면(a) { this.면투명 = a; this.dirty() }
  setZ(z) { const k = z / this.zs; this.t[2] *= k; this.zs = z; this.dirty() }

  /** box = [x0,y0,z0,x1,y1,z1] (가운데를 뺀 좌표) */
  fit(box, view = 'tilt') {
    if (!box) return
    this.t = [(box[0] + box[3]) / 2, (box[1] + box[4]) / 2, ((box[2] + box[5]) / 2) * this.zs]
    const r = Math.max(box[3] - box[0], box[4] - box[1], (box[5] - box[2]) * this.zs, 1e-3)
    this.d = r * (view === 'top' ? 1.25 : 1.75)
    if (view === 'top') { this.yaw = -Math.PI / 2; this.pit = Math.PI / 2 - 1e-3 }
    else if (view === 'side') { this.yaw = -Math.PI / 2; this.pit = 0.02 }
    else { this.yaw = -Math.PI / 3; this.pit = 0.55 }
    this.dirty()
  }

  dirty() { this._dirty = true }

  _cam() {
    const cp = Math.cos(this.pit)
    const e = [this.t[0] + this.d * cp * Math.cos(this.yaw), this.t[1] + this.d * cp * Math.sin(this.yaw), this.t[2] + this.d * Math.sin(this.pit)]
    return e
  }

  draw() {
    const gl = this.gl, cv = this.cv
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = Math.max(1, Math.round(cv.clientWidth * dpr)), h = Math.max(1, Math.round(cv.clientHeight * dpr))
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h }
    gl.viewport(0, 0, w, h)
    gl.clearColor(this.bg[0], this.bg[1], this.bg[2], 1)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.enable(gl.DEPTH_TEST)
    gl.useProgram(this.pr)
    const e = this._cam()
    const P = persp(Math.PI / 4, w / h, this.d / 2000, this.d * 50)
    const V = look(e, this.t, [0, 0, 1])
    gl.uniformMatrix4fv(this.uM, false, new Float32Array(mm(P, V)))
    gl.uniform1f(this.uZ, this.zs)
    gl.uniform1f(this.uS, 3 * dpr)
    gl.enableVertexAttribArray(this.aP); gl.enableVertexAttribArray(this.aC)
    for (const l of this.L) {
      if (!l.on) continue
      if (l.n) {
        gl.bindBuffer(gl.ARRAY_BUFFER, l.vb); gl.vertexAttribPointer(this.aP, 3, gl.FLOAT, false, 0, 0)
        gl.bindBuffer(gl.ARRAY_BUFFER, l.cb); gl.vertexAttribPointer(this.aC, 3, gl.UNSIGNED_BYTE, true, 0, 0)
        gl.drawArrays(gl.LINES, 0, l.n)
      }
      if (l.pn) {
        gl.bindBuffer(gl.ARRAY_BUFFER, l.pb); gl.vertexAttribPointer(this.aP, 3, gl.FLOAT, false, 0, 0)
        gl.bindBuffer(gl.ARRAY_BUFFER, l.pcb); gl.vertexAttribPointer(this.aC, 3, gl.UNSIGNED_BYTE, true, 0, 0)
        gl.drawArrays(gl.POINTS, 0, l.pn)
      }
    }
    gl.disableVertexAttribArray(this.aP); gl.disableVertexAttribArray(this.aC)
    /* 면 — 반투명으로 얹습니다 (속의 층 선이 비쳐 보이게). 깊이는 쓰지 않아 순서에 덜 탑니다 */
    if (this.L.some((l) => l.on && l.tn)) {
      gl.useProgram(this.p2)
      gl.uniformMatrix4fv(this.vM, false, new Float32Array(mm(P, V)))
      gl.uniform1f(this.vZ, this.zs)
      gl.uniform3f(this.vL, 0.42, -0.55, 0.72)
      gl.uniform1f(this.vA, this.면투명)
      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false)
      gl.enableVertexAttribArray(this.bP); gl.enableVertexAttribArray(this.bN); gl.enableVertexAttribArray(this.bC)
      for (const l of this.L) {
        if (!l.on || !l.tn) continue
        gl.bindBuffer(gl.ARRAY_BUFFER, l.tb); gl.vertexAttribPointer(this.bP, 3, gl.FLOAT, false, 0, 0)
        gl.bindBuffer(gl.ARRAY_BUFFER, l.tnb); gl.vertexAttribPointer(this.bN, 3, gl.FLOAT, false, 0, 0)
        gl.bindBuffer(gl.ARRAY_BUFFER, l.tcb); gl.vertexAttribPointer(this.bC, 3, gl.UNSIGNED_BYTE, true, 0, 0)
        gl.drawArrays(gl.TRIANGLES, 0, l.tn)
      }
      gl.disableVertexAttribArray(this.bP); gl.disableVertexAttribArray(this.bN); gl.disableVertexAttribArray(this.bC)
      gl.depthMask(true); gl.disable(gl.BLEND)
    }
  }

  _loop() {
    if (this._dead) return
    if (this._dirty || this.cv.width !== Math.round(this.cv.clientWidth * Math.min(window.devicePixelRatio || 1, 2))) {
      this._dirty = false; this.draw()
    }
    this._raf = requestAnimationFrame(this._loop)
  }

  /** 지금 화면을 PNG 로 */
  png() { this.draw(); return this.cv.toDataURL('image/png') }

  _pan(dx, dy) {
    const k = (this.d * 2 * Math.tan(Math.PI / 8)) / Math.max(1, this.cv.clientHeight)
    const cy = Math.cos(this.yaw), sy = Math.sin(this.yaw), sp = Math.sin(this.pit), cp = Math.cos(this.pit)
    const rx = -sy, ry = cy                                  // 오른쪽
    const ux = -sp * cy, uy = -sp * sy, uz = cp              // 위쪽
    this.t[0] += (-dx * rx + dy * ux) * k
    this.t[1] += (-dx * ry + dy * uy) * k
    this.t[2] += (dy * uz) * k
    this.dirty()
  }
  _rot(dx, dy) {
    this.yaw -= dx * 0.006
    this.pit = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 1e-3, this.pit + dy * 0.006))
    this.dirty()
  }
  _zoom(f) { this.d = Math.max(1e-3, this.d * f); this.dirty() }

  _bind() {
    const cv = this.cv
    const ps = new Map()
    let pinch = null
    const down = (e) => {
      cv.setPointerCapture(e.pointerId)
      ps.set(e.pointerId, { x: e.clientX, y: e.clientY, b: e.button, s: e.shiftKey || e.ctrlKey })
      if (ps.size === 2) {
        const [a, b] = [...ps.values()]
        pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 }
      }
    }
    const move = (e) => {
      const p = ps.get(e.pointerId)
      if (!p) return
      const dx = e.clientX - p.x, dy = e.clientY - p.y
      if (ps.size === 1) {
        if (p.b === 2 || p.b === 1 || p.s || e.shiftKey) this._pan(dx, dy)
        else this._rot(dx, dy)
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
    const up = (e) => { ps.delete(e.pointerId); if (ps.size < 2) pinch = null }
    const wheel = (e) => { e.preventDefault(); this._zoom(Math.exp(Math.max(-100, Math.min(100, e.deltaY)) * 0.0015)) }
    const ctx = (e) => e.preventDefault()
    cv.addEventListener('pointerdown', down)
    cv.addEventListener('pointermove', move)
    cv.addEventListener('pointerup', up)
    cv.addEventListener('pointercancel', up)
    cv.addEventListener('wheel', wheel, { passive: false })
    cv.addEventListener('contextmenu', ctx)
    this._unbind = () => {
      cv.removeEventListener('pointerdown', down); cv.removeEventListener('pointermove', move)
      cv.removeEventListener('pointerup', up); cv.removeEventListener('pointercancel', up)
      cv.removeEventListener('wheel', wheel); cv.removeEventListener('contextmenu', ctx)
    }
  }

  dispose() {
    this._dead = true
    cancelAnimationFrame(this._raf)
    if (this._unbind) this._unbind()
    const gl = this.gl
    for (const l of this.L) for (const b of [l.vb, l.cb, l.pb, l.pcb, l.tb, l.tnb, l.tcb]) if (b) gl.deleteBuffer(b)
    this.L = []
  }
}
