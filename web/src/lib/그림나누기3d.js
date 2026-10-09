/**
 * 🖼 그림 나누기 (G212 · 2026-10-09) — 박스(종이 한 장)나 도면 통째 안에서 «서로 떨어진 그림» 을 나눕니다.
 *
 * ■ 왜: 종이 한 장에는 평면도 · 단면도 · 상세도 · 표가 같이 그려져 있습니다. 통째로 측량 도면에 겹치려 하면
 *   평면이 아닌 그림(단면 · 표)이 섞여 같은 모양을 못 찾거나(현장 D 화장실 도면), 틀이 수백 m 로 퍼져 오래 걸렸습니다.
 *   소장님: 「이 도면 뿐 아니라 일반화 시켜서 프로그램을 만들어야 하잖아」 「도면에 정확하게 와야 하는데 엉뚱한 곳에 그림이 붙어 버리면..」
 * ■ 어떻게: 선을 칸 그림(1400 칸 안)에 찍고 «틈» 만큼 두껍게 한 뒤 이어진 덩어리마다 그림 하나.
 *   틈 = 그림 전체 크기의 1.5% — 종이 위 그림 사이 빈칸은 대개 이보다 넓습니다.
 *   글자 · 치수 · 해치 층은 덩어리를 잇지 않게 찍지 않습니다(가운데가 덩어리 안이면 그 그림에 딸림).
 * ■ 그림마다 이름(아래 · 위의 가장 큰 글자 «…평면도» «…단면도») 으로 평면인지 가립니다 — 겹치기는 평면 그림만.
 */

const 안찍는층 = /^[_#!★\-\s]*(text|글|문자|dim|치수|hatch|해치|defpoints|tick|sym|지시|lead|cen|중심|center|콘크리트)/i
const 이름층 = (name) => { const c = name.indexOf('\u0001'); return c >= 0 ? name.slice(c + 1) : name }

/**
 * @param {Map<string, {pos:{a:Float64Array,n:number}}>} out
 * @param {{ 골라?: (키:string, 층:string) => boolean, 틈비?: number, 최대칸?: number }} [o]
 * @returns {null | { 그림: Array<{ id:number, 선:number, 길이:number, 상자:number[] }>, 어디: (x:number, y:number) => number }}
 */
export function 그림나누기(out, { 골라 = null, 틈비 = 0.015, 최대칸 = 1400 } = {}) {
  /* 1) 바깥으로 튄 선(먼 곳에 하나둘 그린 것)에 칸이 끌려가지 않게 — 가운데 점의 1~99% 범위 */
  const mx = [], my = []
  for (const [name, b] of out) {
    if (골라) { const c = name.indexOf('\u0001'); if (!골라(c >= 0 ? name.slice(0, c) : '', 이름층(name))) continue }
    const a = b.pos.a, st = Math.max(6, Math.floor(b.pos.n / 6 / 4000) * 6)
    for (let i = 0; i < b.pos.n; i += st) { mx.push((a[i] + a[i + 3]) / 2); my.push((a[i + 1] + a[i + 4]) / 2) }
  }
  if (mx.length < 20) return null
  const 끝 = (v, q) => { const s = Float64Array.from(v).sort(); return s[Math.min(s.length - 1, Math.max(0, Math.floor(q * s.length)))] }
  let X0 = 끝(mx, 0.005), X1 = 끝(mx, 0.995), Y0 = 끝(my, 0.005), Y1 = 끝(my, 0.995)
  const 크기 = Math.max(X1 - X0, Y1 - Y0, 1)
  X0 -= 크기 * 0.05; X1 += 크기 * 0.05; Y0 -= 크기 * 0.05; Y1 += 크기 * 0.05
  const 칸 = Math.max(크기 * 1.1 / 최대칸, 1e-6)
  const W = Math.ceil((X1 - X0) / 칸) + 1, H = Math.ceil((Y1 - Y0) / 칸) + 1
  /* 2) 선 찍기 */
  const g = new Uint8Array(W * H)
  for (const [name, b] of out) {
    const ly = 이름층(name)
    if (안찍는층.test(ly)) continue
    if (골라) { const c = name.indexOf('\u0001'); if (!골라(c >= 0 ? name.slice(0, c) : '', ly)) continue }
    const a = b.pos.a
    for (let i = 0; i < b.pos.n; i += 6) {
      const ax = (a[i] - X0) / 칸, ay = (a[i + 1] - Y0) / 칸, bx = (a[i + 3] - X0) / 칸, by = (a[i + 4] - Y0) / 칸
      if ((ax < 0 && bx < 0) || (ay < 0 && by < 0) || (ax >= W && bx >= W) || (ay >= H && by >= H)) continue
      const st = Math.min(4 * 최대칸, Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay))))
      for (let k = 0; k <= st; k++) {
        const x = Math.floor(ax + (bx - ax) * k / st), y = Math.floor(ay + (by - ay) * k / st)
        if (x >= 0 && y >= 0 && x < W && y < H) g[y * W + x] = 1
      }
    }
  }
  /* 3) 틈만큼 두껍게(가로 · 세로 따로 — 네모 붓) */
  const r = Math.max(1, Math.round((크기 * 틈비) / 2 / 칸))
  const 가 = new Uint8Array(W * H)
  for (let y = 0; y < H; y++) {
    let 남 = -1
    for (let x = 0; x < W; x++) { if (g[y * W + x]) 남 = x + r; if (남 >= x) 가[y * W + x] = 1 }
    남 = W + 1
    for (let x = W - 1; x >= 0; x--) { if (g[y * W + x]) 남 = x - r; if (남 <= x) 가[y * W + x] = 1 }
  }
  const 두 = new Uint8Array(W * H)
  for (let x = 0; x < W; x++) {
    let 남 = -1
    for (let y = 0; y < H; y++) { if (가[y * W + x]) 남 = y + r; if (남 >= y) 두[y * W + x] = 1 }
    남 = H + 1
    for (let y = H - 1; y >= 0; y--) { if (가[y * W + x]) 남 = y - r; if (남 <= y) 두[y * W + x] = 1 }
  }
  /* 4) 이어진 덩어리 */
  const lab = new Int32Array(W * H).fill(-1)
  let n = 0
  const 줄 = new Int32Array(W * H)
  for (let s = 0; s < W * H; s++) {
    if (!두[s] || lab[s] >= 0) continue
    let h = 0, t = 0
    줄[t++] = s; lab[s] = n
    while (h < t) {
      const o = 줄[h++], x = o % W, y = (o - x) / W
      if (x > 0 && 두[o - 1] && lab[o - 1] < 0) { lab[o - 1] = n; 줄[t++] = o - 1 }
      if (x < W - 1 && 두[o + 1] && lab[o + 1] < 0) { lab[o + 1] = n; 줄[t++] = o + 1 }
      if (y > 0 && 두[o - W] && lab[o - W] < 0) { lab[o - W] = n; 줄[t++] = o - W }
      if (y < H - 1 && 두[o + W] && lab[o + W] < 0) { lab[o + W] = n; 줄[t++] = o + W }
    }
    n++
  }
  const 어디 = (x, y) => {
    const gx = Math.floor((x - X0) / 칸), gy = Math.floor((y - Y0) / 칸)
    return gx >= 0 && gy >= 0 && gx < W && gy < H ? lab[gy * W + gx] : -1
  }
  /* 5) 덩어리마다 선 수 · 길이 · 상자(선 가운데가 든 것) */
  const 그림 = Array.from({ length: n }, (_, id) => ({ id, 선: 0, 길이: 0, 상자: [Infinity, Infinity, -Infinity, -Infinity] }))
  for (const [name, b] of out) {
    const a = b.pos.a
    for (let i = 0; i < b.pos.n; i += 6) {
      const k = 어디((a[i] + a[i + 3]) / 2, (a[i + 1] + a[i + 4]) / 2)
      if (k < 0) continue
      const p = 그림[k]
      p.선++; p.길이 += Math.hypot(a[i + 3] - a[i], a[i + 4] - a[i + 1])
      p.상자[0] = Math.min(p.상자[0], a[i], a[i + 3]); p.상자[1] = Math.min(p.상자[1], a[i + 1], a[i + 4])
      p.상자[2] = Math.max(p.상자[2], a[i], a[i + 3]); p.상자[3] = Math.max(p.상자[3], a[i + 1], a[i + 4])
    }
    void name
  }
  return { 그림: 그림.filter((p) => p.선 > 0).sort((p, q) => q.길이 - p.길이), 어디, 칸, 틈: r * 칸 }
}

/**
 * 그림 하나를 떼어 새 묶음(out) 으로 — 원래 묶음에서는 뺍니다.
 * @param {Map} out 원래 묶음(고쳐짐)
 * @param {(x:number,y:number)=>number} 어디
 * @param {number} id
 * @param {(키:string)=>string} 새키  원래 키 → 새 키
 * @param {() => any} 새버킷
 */
export function 그림떼기(out, 어디, id, 새키, 새버킷) {
  const 새 = new Map()
  for (const [name, b] of out) {
    const c = name.indexOf('\u0001')
    const 키 = c >= 0 ? name.slice(0, c) : '', ly = c >= 0 ? name.slice(c + 1) : name
    let t = null
    const 통 = () => { if (!t) { t = 새버킷(); 새.set(새키(키) + '\u0001' + ly, t) } return t }
    const a = b.pos.a, col = b.col.a
    let j = 0
    for (let i = 0; i < b.pos.n; i += 6) {
      if (어디((a[i] + a[i + 3]) / 2, (a[i + 1] + a[i + 4]) / 2) === id) {
        const d = 통()
        d.pos.push6(a[i], a[i + 1], a[i + 2], a[i + 3], a[i + 4], a[i + 5])
        d.col.push3(col[i], col[i + 1], col[i + 2]); d.col.push3(col[i + 3], col[i + 4], col[i + 5])
        continue
      }
      if (j !== i) for (let k = 0; k < 6; k++) { a[j + k] = a[i + k]; col[j + k] = col[i + k] }
      j += 6
    }
    b.pos.n = j; b.col.n = j
    const p = b.pts.a, pc = b.pcol.a
    let q = 0
    for (let i = 0; i < b.pts.n; i += 3) {
      if (어디(p[i], p[i + 1]) === id) { const d = 통(); d.pts.push3(p[i], p[i + 1], p[i + 2]); d.pcol.push3(pc[i], pc[i + 1], pc[i + 2]); continue }
      if (q !== i) for (let k = 0; k < 3; k++) { p[q + k] = p[i + k]; pc[q + k] = pc[i + k] }
      q += 3
    }
    b.pts.n = q; b.pcol.n = q
  }
  return 새
}

/* 그림 이름 — 그림 둘레(그림 크기의 35% 안)에서 가까운 글자 중 «…도» */
const 평면말 = /평면|배치|계획도|위치도|현황도|PLAN/i
const 아닌말 = /단면|입면|정면|측면|상세|배근|철근|조립|종단|횡단|SECTION|DETAIL|ELEV|표$|일람|산출|집계|목록|범례|주기|NOTE/i
/**
 * @param {Array<{x:number,y:number,h?:number,s:string}>} 글자
 * @param {number[]} 상자
 * @returns {{ 이름: string, 꼴: '평면' | '아님' | '' }}
 */
export function 그림이름(글자, 상자, 제외 = '') {
  /* 종이 이름(박스 제목 «토출부 가체절 상세도») 은 그림 이름이 아님 — 그 종이 안 평면 그림까지 «상세» 로 보지 않게 */
  const 뺄 = String(제외 || '').replace(/\s+/g, '')
  const [x0, y0, x1, y1] = 상자, w = x1 - x0, h = y1 - y0, 여 = 0.35 * Math.max(w, h)
  /* 그림에서 가까운 글자부터(옆 그림 제목을 집지 않게) — 같은 거리면 큰 글자 */
  const 거리 = (t) => Math.hypot(Math.max(0, x0 - t.x, t.x - x1), Math.max(0, y0 - t.y, t.y - y1))
  const 둘레 = 글자.filter((t) => t.x >= x0 - 여 && t.x <= x1 + 여 && t.y >= y0 - 여 && t.y <= y1 + 여 && String(t.s || '').trim().length >= 2)
    .filter((t) => /도|PLAN|SECTION|DETAIL|표/i.test(t.s) && !(뺄 && String(t.s).replace(/\s+/g, '') === 뺄))
    .sort((a, b) => Math.round(거리(a) / Math.max(1, 0.05 * 여)) - Math.round(거리(b) / Math.max(1, 0.05 * 여)) || (b.h || 0) - (a.h || 0))
  for (const t of 둘레.slice(0, 6)) {
    const s = String(t.s).replace(/\s+/g, '')
    if (s.length > 30) continue
    if (아닌말.test(s)) return { 이름: String(t.s).trim(), 꼴: '아님' }
    if (평면말.test(s)) return { 이름: String(t.s).trim(), 꼴: '평면' }
  }
  return { 이름: '', 꼴: '' }
}

/** 표처럼 생겼나 — 가로 · 세로 선이 길이로 90% 넘으면 */
export function 표같음(s) {
  let 축 = 0, 모두 = 0
  for (let i = 0; i < s.length; i += 4) {
    const dx = Math.abs(s[i + 2] - s[i]), dy = Math.abs(s[i + 3] - s[i + 1]), L = Math.hypot(dx, dy)
    모두 += L
    if (dx < L * 0.005 || dy < L * 0.005) 축 += L
  }
  return 모두 > 0 && 축 / 모두 > 0.9
}
