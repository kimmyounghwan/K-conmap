/**
 * 📷 사진 → 캐드 · ⑧ 글 읽기 — PaddleOCR(PP-OCR · Baidu · Apache-2.0) 모델을 onnxruntime-web 으로 이 기기 안에서 (G287 · 2026-10-14)
 *   글읽기만들기(ort, { 찾기모델, 읽기모델, 사전 }) → { 찾기(판), 읽기(판, 상자), 찾고읽기(판, o) }
 *   판 = { w, h, d: 밝기(0~255) } — 반듯하게 편 종이(도면펴기 결과)
 *   상자 = { c:[x,y], u:[ux,uy](글 방향 단위), L(글 길이), W(글 높이) }
 *   찾기: DB(Differentiable Binarization) 확률 지도 → 0.3 문턱 → 덩이마다 방향 네모(주성분) → 1.6 배 넓힘
 *   읽기: 방향 네모를 높이 48 로 펴서 CRNN/SVTR → CTC(빈칸 · 겹침 빼기) · 세로 글은 두 방향 모두 읽어 믿음 높은 쪽
 */

const 평균 = [0.485, 0.456, 0.406], 편차 = [0.229, 0.224, 0.225]

function 겹선형(판, x, y) {
  const { w, h, d } = 판
  if (x < 0 || y < 0 || x > w - 1 || y > h - 1) return 255
  const x0 = Math.floor(x), y0 = Math.floor(y), x1 = Math.min(w - 1, x0 + 1), y1 = Math.min(h - 1, y0 + 1)
  const fx = x - x0, fy = y - y0
  const v = (d[y0 * w + x0] * (1 - fx) + d[y0 * w + x1] * fx) * (1 - fy) + (d[y1 * w + x0] * (1 - fx) + d[y1 * w + x1] * fx) * fy
  return isNaN(v) ? 255 : v
}

const 손숫자글자 = ['', ...'0123456789.,m']

export function 글읽기만들기(ort, { 찾기모델, 읽기모델, 사전, 손숫자모델 }) {
  // CTC 칸: 0 = 빈칸, 1.. = 사전, (모델에 따라) 끝 = 띄어쓰기. 사전 파일 첫 줄이 비어 있으면 그 줄이 빈칸 자리
  let 글자들 = null
  const 글자표 = (C) => {
    if (글자들 && 글자들.length === C) return 글자들
    const A = 사전[0] === '' ? [...사전] : ['', ...사전]
    while (A.length < C) A.push(' ')
    글자들 = A.slice(0, C)
    return 글자들
  }

  /** DB 글자리 찾기 — 판의 한 조각(x0,y0,w,h)을 k 배로 키우거나 줄여서 */
  async function 조각찾기(판, x0, y0, w, h, k, o = {}) {
    const W = Math.max(32, Math.round((w * k) / 32) * 32), H = Math.max(32, Math.round((h * k) / 32) * 32)
    const sx = w / W, sy = h / H
    const x = new Float32Array(3 * W * H)
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      let g
      if (sx < 1 && sy < 1) g = 겹선형(판, x0 + (i + 0.5) * sx - 0.5, y0 + (j + 0.5) * sy - 0.5) / 255   // 키울 때: 겹선형
      else {
        // 줄일 때는 칸 평균(작은 글자가 사라지지 않게)
        let s = 0, n = 0
        const xa = x0 + i * sx, ya = y0 + j * sy
        for (let yy = Math.floor(ya); yy < Math.max(Math.floor(ya) + 1, Math.floor(ya + sy)); yy++) for (let xx = Math.floor(xa); xx < Math.max(Math.floor(xa) + 1, Math.floor(xa + sx)); xx++) {
          if (xx < 0 || yy < 0 || xx >= 판.w || yy >= 판.h) continue
          const v = 판.d[yy * 판.w + xx]; s += isNaN(v) ? 255 : v; n++
        }
        g = (n ? s / n : 255) / 255
      }
      for (let c = 0; c < 3; c++) x[c * W * H + j * W + i] = (g - 평균[c]) / 편차[c]
    }
    const 입 = new ort.Tensor('float32', x, [1, 3, H, W])
    const 나 = await 찾기모델.run({ [찾기모델.inputNames[0]]: 입 })
    const p = 나[찾기모델.outputNames[0]].data
    // 문턱 → 덩이
    const 문 = o.문턱 || 0.3
    const lab = new Int32Array(W * H).fill(-1)
    const 상자들 = []
    const 줄 = new Int32Array(W * H)
    const 끝 = o.끝 || [false, false, false, false]   // 조각의 왼 · 위 · 오른 · 아래 가장자리가 «판 안쪽» 이면 거기 닿은 덩이는 버림(이웃 조각이 온전히 봄)
    let id = 0
    for (let s0 = 0; s0 < W * H; s0++) {
      if (p[s0] <= 문 || lab[s0] >= 0) continue
      let qh = 0, qt = 0; 줄[qt++] = s0; lab[s0] = id++
      let n = 0, 합p = 0, mx = 0, my = 0, 닿 = false
      const 점 = []
      while (qh < qt) {
        const q = 줄[qh++], qx = q % W, qy = (q / W) | 0
        n++; 합p += p[q]; mx += qx; my += qy; 점.push(qx, qy)
        if ((끝[0] && qx <= 1) || (끝[1] && qy <= 1) || (끝[2] && qx >= W - 2) || (끝[3] && qy >= H - 2)) 닿 = true
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const ax = qx + dx, ay = qy + dy
          if (ax < 0 || ay < 0 || ax >= W || ay >= H) continue
          const r = ay * W + ax
          if (p[r] > 문 && lab[r] < 0) { lab[r] = lab[s0]; 줄[qt++] = r }
        }
      }
      if (n < 6 || 닿) continue
      const 점수 = 합p / n
      if (점수 < (o.상자문턱 || 0.55)) continue
      mx /= n; my /= n
      let xx = 0, xy = 0, yy = 0
      for (let i = 0; i < 점.length; i += 2) { const dx = 점[i] - mx, dy = 점[i + 1] - my; xx += dx * dx; xy += dx * dy; yy += dy * dy }
      let θ = 0.5 * Math.atan2(2 * xy, xx - yy)
      // 거의 가로 · 세로면 딱 맞춤(도면 글은 대개 0° · 90°)
      const 도 = θ * 180 / Math.PI
      if (Math.abs(도) < 4) θ = 0; else if (Math.abs(Math.abs(도) - 90) < 4) θ = Math.sign(도) * Math.PI / 2
      let ux = Math.cos(θ), uy = Math.sin(θ)
      let t0 = Infinity, t1 = -Infinity, s0b = Infinity, s1b = -Infinity
      for (let i = 0; i < 점.length; i += 2) {
        const dx = 점[i] + 0.5 - mx, dy = 점[i + 1] + 0.5 - my
        const t = dx * ux + dy * uy, s = -dx * uy + dy * ux
        if (t < t0) t0 = t; if (t > t1) t1 = t; if (s < s0b) s0b = s; if (s > s1b) s1b = s
      }
      let L = t1 - t0 + 1, Wd = s1b - s0b + 1
      if (Wd > L) { [L, Wd] = [Wd, L]; const tx = ux; ux = -uy; uy = tx; const a = t0, b = t1; t0 = s0b; t1 = s1b; s0b = -b; s1b = -a }
      // 넓힘(DB unclip: 넓이 × 1.5 / 둘레)
      const 넓 = (L * Wd * 1.5) / (2 * (L + Wd))
      const cx = mx + ux * (t0 + t1) / 2 - uy * (s0b + s1b) / 2, cy = my + uy * (t0 + t1) / 2 + ux * (s0b + s1b) / 2
      상자들.push({ c: [x0 + (cx + 0.5) * sx, y0 + (cy + 0.5) * sy], u: [ux, uy], L: (L + 2 * 넓) * Math.hypot(ux * sx, uy * sy), W: (Wd + 2 * 넓) * Math.hypot(-uy * sx, ux * sy), 점수 })
    }
    return 상자들.filter((b) => b.W >= 6 && b.L >= 6)
  }

  /** 글자리 찾기 — ① 판 전체(긴 변 1280) ② 작은 글자용으로 더 키워 조각조각(960 칸 · 겹침 160) → 겹친 상자는 하나로 */
  async function 찾기(판, o = {}) {
    const 최대 = o.최대 || 1280
    const 긴 = Math.max(판.w, 판.h)
    const k1 = Math.min(2, 최대 / 긴)
    const 온 = await 조각찾기(판, 0, 0, 판.w, 판.h, k1, o)
    // 잘게 볼 배율: 전체 배율의 약 2 배(작은 사진은 3 배까지) · 전체 넓이가 너무 커지지 않게(약 900 만 칸)
    let k2 = Math.min(3, Math.max(1, k1 * 2))
    if (판.w * 판.h * k2 * k2 > 9e6) k2 = Math.sqrt(9e6 / (판.w * 판.h))
    if (o.잘게 === false || k2 < k1 * 1.4) return 온
    const 칸 = 960 / k2, 겹 = 160 / k2
    const 잘 = []
    const nx = Math.max(1, Math.ceil((판.w - 겹) / (칸 - 겹))), ny = Math.max(1, Math.ceil((판.h - 겹) / (칸 - 겹)))
    const 보폭x = nx > 1 ? (판.w - 칸) / (nx - 1) : 0, 보폭y = ny > 1 ? (판.h - 칸) / (ny - 1) : 0
    let 몇 = 0
    for (let jy = 0; jy < ny; jy++) for (let ix = 0; ix < nx; ix++) {
      const x0 = Math.max(0, Math.round(ix * 보폭x)), y0 = Math.max(0, Math.round(jy * 보폭y))
      const w = Math.min(판.w - x0, Math.round(칸)), h = Math.min(판.h - y0, Math.round(칸))
      잘.push(...(await 조각찾기(판, x0, y0, w, h, k2, { ...o, 끝: [x0 > 0, y0 > 0, x0 + w < 판.w, y0 + h < 판.h] })))
      if (o.찾기진행) o.찾기진행(++몇 / (nx * ny))
    }
    // 겹친 상자 하나로: 전체에서 찾은 상자를 먼저(숫자 한 줄이 통째로) — 잘게 본 상자는 전체에서 못 찾은 작은 글자만 더함
    const 테 = (b) => { const ex = (Math.abs(b.u[0]) * b.L + Math.abs(b.u[1]) * b.W) / 2, ey = (Math.abs(b.u[1]) * b.L + Math.abs(b.u[0]) * b.W) / 2; return [b.c[0] - ex, b.c[1] - ey, b.c[0] + ex, b.c[1] + ey] }
    const 겹침 = (a, b) => { const A = 테(a), B = 테(b); const iw = Math.min(A[2], B[2]) - Math.max(A[0], B[0]), ih = Math.min(A[3], B[3]) - Math.max(A[1], B[1]); if (iw <= 0 || ih <= 0) return 0; const I = iw * ih; return I / Math.min((A[2] - A[0]) * (A[3] - A[1]), (B[2] - B[0]) * (B[3] - B[1])) }
    const 남 = [...온]
    for (const b of 잘.sort((p, q) => q.점수 - p.점수)) if (!남.some((e) => 겹침(e, b) > 0.3)) 남.push(b)
    return 남
  }

  /** 한 방향으로 펴서 읽기 */
  async function 한번읽기(판, c, u, L, Wd) {
    const v = [-u[1], u[0]]   // 글 아래쪽
    const 높 = 48
    const 폭 = Math.max(16, Math.min(1600, Math.round((높 * L) / Math.max(1, Wd))))
    const x = new Float32Array(3 * 높 * 폭)
    for (let j = 0; j < 높; j++) for (let i = 0; i < 폭; i++) {
      const a = ((i + 0.5) / 폭 - 0.5) * L, b = ((j + 0.5) / 높 - 0.5) * Wd
      const g = 겹선형(판, c[0] + u[0] * a + v[0] * b - 0.5, c[1] + u[1] * a + v[1] * b - 0.5) / 255
      const z = (g - 0.5) / 0.5
      x[j * 폭 + i] = z; x[높 * 폭 + j * 폭 + i] = z; x[2 * 높 * 폭 + j * 폭 + i] = z
    }
    const 나 = await 읽기모델.run({ [읽기모델.inputNames[0]]: new ort.Tensor('float32', x, [1, 3, 높, 폭]) })
    const t = 나[읽기모델.outputNames[0]]
    const [, T, C] = t.dims
    const q = t.data
    const 표 = 글자표(C)
    let 글 = '', 앞 = -1, 합 = 0, n = 0
    const 자리 = []   // 글자마다 [위치(0~1), 확률, 위 3개 후보]
    for (let s = 0; s < T; s++) {
      let k = 0, m = -Infinity
      for (let c2 = 0; c2 < C; c2++) { const val = q[s * C + c2]; if (val > m) { m = val; k = c2 } }
      if (k !== 0 && k !== 앞) {
        const ch = 표[k] ?? ''
        글 += ch; 합 += m; n++
        // 숫자 자리의 다른 후보(치수 풀기에서 «둘레와 맞는 읽기» 를 고를 수 있게)
        const 후 = []
        for (let c2 = 1; c2 < C; c2++) { const ch2 = 표[c2]; if (ch2 >= '0' && ch2 <= '9') 후.push([ch2, q[s * C + c2]]) }
        후.sort((a2, b2) => b2[1] - a2[1])
        자리.push({ ch, p: m, 후: 후.slice(0, 3) })
      }
      앞 = k
    }
    return { 글: 글.trim(), 믿음: n ? 합 / n : 0, 자리 }
  }

  /** 손글씨 치수 숫자 전용 읽기(이 사이트가 배운 작은 모델 · 0-9 . , m) — 높이 32 로 펴서 · 글 찾기 상자의 위아래 여백은 조금 줄여서(배울 때 글 높이 50 ~ 80 %) */
  async function 손한번(판, c, u, L, Wd) {
    const v = [-u[1], u[0]]
    const 높 = 32, Wd2 = Wd * 0.78
    let 폭 = Math.max(16, Math.min(320, Math.round((높 * L) / Math.max(1, Wd2))))
    폭 = Math.ceil(폭 / 4) * 4
    const x = new Float32Array(높 * 폭)
    for (let j = 0; j < 높; j++) for (let i = 0; i < 폭; i++) {
      const a = ((i + 0.5) / 폭 - 0.5) * L, b = ((j + 0.5) / 높 - 0.5) * Wd2
      x[j * 폭 + i] = (겹선형(판, c[0] + u[0] * a + v[0] * b - 0.5, c[1] + u[1] * a + v[1] * b - 0.5) / 255 - 0.5) / 0.5
    }
    const 나 = await 손숫자모델.run({ [손숫자모델.inputNames[0]]: new ort.Tensor('float32', x, [1, 1, 높, 폭]) })
    const t = 나[손숫자모델.outputNames[0]]
    const [, T, C] = t.dims
    const q = t.data
    let 글 = '', 앞 = 0, 합 = 0, n = 0
    const 자리 = []
    for (let s2 = 0; s2 < T; s2++) {
      let k = 0, m = -1
      for (let c2 = 0; c2 < C; c2++) if (q[s2 * C + c2] > m) { m = q[s2 * C + c2]; k = c2 }
      if (k !== 0 && k !== 앞) {
        const ch = 손숫자글자[k] ?? ''
        글 += ch; 합 += m; n++
        const 후 = []
        for (let c2 = 1; c2 <= 10 && c2 < C; c2++) 후.push([손숫자글자[c2], q[s2 * C + c2]])
        후.sort((a2, b2) => b2[1] - a2[1])
        자리.push({ ch, p: m, 후: 후.slice(0, 3) })
      }
      앞 = k
    }
    return { 글, 믿음: n ? 합 / n : 0, 자리 }
  }

  /** 상자 읽기 — 세로 글은 두 방향(반시계 · 시계) 다, 가로 글도 믿음이 낮으면 뒤집어 봄 */
  async function 읽기(판, 상자) {
    const { c, L, W: Wd } = 상자
    let u = 상자.u
    const 세로 = Math.abs(u[1]) > Math.abs(u[0])
    // 기본: 가로는 오른쪽으로 · 세로는 위로(도면 세로 치수는 반시계로 돌려 씀)
    if (세로 ? u[1] > 0 : u[0] < 0) u = [-u[0], -u[1]]
    const 첫 = await 한번읽기(판, c, u, L, Wd)
    let 고 = null
    if (!세로 && 첫.믿음 > 0.85) 고 = { ...첫, 방향: u }
    else {
      const 둘 = await 한번읽기(판, c, [-u[0], -u[1]], L, Wd)
      const 세로가산 = 세로 ? 1.02 : 1   // 같으면 반시계(아래 → 위)
      고 = 첫.믿음 * 세로가산 >= 둘.믿음 ? { ...첫, 방향: u } : { ...둘, 방향: [-u[0], -u[1]] }
    }
    // 손글씨 숫자 전용 읽기 — 숫자(또는 숫자 닮은 글자)가 든 상자만 · 같은 방향으로(뒤집힌 글은 반대 방향도 견줌)
    // 숫자가 든 상자 · 또는 글로 읽혔어도 흐릿한(믿음 0.75 아래) 짧은 상자만(«BATH» «ROOM» 처럼 또렷한 글은 숫자 모델에 안 줌 — 숫자 모델은 무엇이든 숫자로 읽음)
    const 숫든 = /[0-9]/.test(고.글), 흐린짧은 = 고.믿음 < 0.75 && 고.글.length <= 6 && /[OoIlSsBbZzGgq|.,]/.test(고.글)
    if (손숫자모델 && (숫든 || 흐린짧은)) {
      try {
        // 두 방향 다 읽음(손그림은 거꾸로 · 옆으로 쓴 숫자가 흔함) — 화면 쪽은 믿음 높은 쪽 · 다른 쪽은 «뒤» 로 남겨 후보에 넣음
        const a = await 손한번(판, c, 고.방향, L, Wd)
        const b = await 손한번(판, c, [-고.방향[0], -고.방향[1]], L, Wd)
        const 앞b = b.믿음 > a.믿음 * 1.05
        고.손 = 앞b ? { ...b, 뒤집음: true, 뒤: a } : { ...a, 뒤: b }
      } catch (e) { /* 손글씨 읽기 실패는 건너뜀 */ }
    }
    return 고
  }

  async function 찾고읽기(판, o = {}) {
    const 상자들 = await 찾기(판, o)
    const 나 = []
    for (const b of 상자들) {
      try { const r = await 읽기(판, b); if (r.글) 나.push({ ...b, ...r }) } catch (e) { /* 한 상자 실패는 건너뜀 */ }
      if (o.진행) o.진행(나.length / 상자들.length)
    }
    return 나
  }

  return { 찾기, 읽기, 찾고읽기 }
}

/**
 * 치수 글 풀기 — «12,000» «3600» «3.6» «0.8m» «1.2 m» «450mm» «12'-6"» «L=3600» → { mm 후보, 소수, 단위 }
 *   단위를 알면 mm 하나, 모르면 값과 «배수 후보»(치수 풀기에서 다른 치수와 맞는 쪽)
 *   치수가 아닌 글(방 이름 · «12×16» 같은 방 크기 · 날짜)은 null
 */
export function 치수글풀기(글0) {
  if (!글0) return null
  let 글 = String(글0).replace(/\s+/g, '').replace(/[，､]/g, ',').replace(/[‘’`´′]/g, "'").replace(/[“”″]/g, '"').replace(/''/g, '"')
  // 흔한 잘못 읽음: 숫자 사이 O · o → 0, l · I · | → 1
  글 = 글.replace(/(?<=\d)[Oo](?=[\d,.'"-]|$)/g, '0').replace(/(?<=[\d,'-])[lI|](?=\d)/g, '1').replace(/(?<=^|[-'])[Oo](?=["'-]|$)/g, '0')
  if (/[×xX*]/.test(글) && /\d[×xX*]\d/.test(글)) return null            // 방 크기 «12×16»
  if (/\d{4}[./-]\d{1,2}[./-]\d{1,2}/.test(글)) return null                // 날짜
  // 피트 · 인치 — «15'-0"» «15'-0'»(인치 표를 ' 로 읽음) «15'0"» «9'-3 1/2"» «15-0"» «12'»
  const 피 = (ft, inch, 분자, 분모, 추정) => ({ 값: Math.round(Number(ft) * 304.8 + (inch ? Number(inch) * 25.4 : 0) + (분자 && 분모 ? (Number(분자) / Number(분모)) * 25.4 : 0)), 배수: [1], 단위: 'ft', 글: 글0, ...(추정 ? { 추정: true } : {}) })
  let m = 글.match(/^(\d{1,3})'-?(\d{1,2}(?:\.\d+)?)(?:-?(\d)\/(\d{1,2}))?["']?$/)
  if (m && Number(m[2]) < 12) return 피(m[1], m[2], m[3], m[4])
  m = 글.match(/^(\d{1,3})-(\d{1,2})(?:-?(\d)\/(\d{1,2}))?["']$/)
  if (m && Number(m[2]) < 12) return 피(m[1], m[2], m[3], m[4])
  m = 글.match(/^(\d{1,3})'$/)
  if (m) return 피(m[1])
  m = 글.match(/^(\d{1,3}(?:\.\d+)?)"$/)
  if (m) return { 값: Math.round(Number(m[1]) * 25.4), 배수: [1], 단위: 'in', 글: 글0 }
  m = 글.match(/^(\d{1,2})-(\d{1,2})$/)   // «15-0» — 표가 빠진 피트-인치일 수 있음(다른 치수와 맞을 때만 쓰임)
  if (m && Number(m[2]) < 12 && Number(m[1]) >= 2) return 피(m[1], m[2], null, null, true)
  // 앞 글자(L= · W= · H= · D= · @) 떼기
  글 = 글.replace(/^[A-Za-z@]{1,2}=?/, '')
  // 단위
  let 배수 = null, 단위 = ''
  const u = 글.match(/(mm|MM|cm|CM|m|M)$/)
  if (u) { 단위 = u[1].toLowerCase(); 글 = 글.slice(0, -u[1].length); 배수 = 단위 === 'mm' ? [1] : 단위 === 'cm' ? [10] : [1000] }
  // 손글씨 소수점: «1'2m» «1·2» (윗점 · 가운뎃점) → 1.2
  if (/^\d+['·•]\d{1,3}$/.test(글) && (단위 === 'm' || /^\d['·•]\d$/.test(글))) 글 = 글.replace(/['·•]/, '.')
  if (!/^[\d.,]+$/.test(글)) return null
  const 숫 = 글.replace(/[^\d]/g, '')
  if (!숫.length || 숫.length > 7) return null
  let 값, 소수 = false
  if (/^\d{1,3}(,\d{3})+$/.test(글)) 값 = Number(글.replace(/,/g, ''))                    // 12,000
  else if (/^\d{1,3}(\.\d{3})+$/.test(글) && !단위) 값 = Number(글.replace(/\./g, ''))   // «4.800» = 쉼표를 점으로 읽음(4.8 m 이어도 4800 mm 로 같음)
  else if (/^\d+[.,]\d{1,3}$/.test(글) && !/^\d{1,3},\d{3}$/.test(글)) { 값 = Number(글.replace(',', '.')); 소수 = true }   // 3.6 · 0,8
  else if (/^0\d{1,2}$/.test(글) && 단위 !== 'mm') { 값 = Number('0.' + 글.slice(1)); 소수 = true }   // «07» «07m» = 0.7(점을 못 읽음)
  else if (/^\d+$/.test(글)) 값 = Number(글)
  else return null
  if (!(값 > 0)) return null
  if (단위 === 'm' && !소수) 배수 = 값 < 10 ? [1000, 100] : [1000, 100, 10]   // «5m» 가 «0.5m» · «12m» 가 «1.2m» 일 수도(점을 못 읽음) → 둘레와 맞는 쪽
  if (!배수) 배수 = 소수 ? [1000, 1, 10] : 값 < 100 ? [1, 1000] : [1]
  return { 값, 배수, 단위, 소수, 글: 글0 }
}
