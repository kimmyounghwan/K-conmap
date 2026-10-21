/**
 * 📷 사진 → 캐드 · ⑥ 치수 — 읽은 숫자를 치수선(또는 벽)에 짝짓고, «적힌 숫자대로» 길이를 맞춤 (2026-10-14 G287)
 *
 * 소장님: 「치수도 자동으로」 · 「유료 보다 더 좋은 결과물이 나오게 해. 반드시…」
 *
 * ■ 유료 도구 대부분은 «길이 하나로 전체 크기» 만 맞춥니다. 여기서는 도면의 치수 숫자 «모두» 를 씁니다:
 *   ① 짝짓기 — 가로로 쓴 숫자는 바로 아래(또는 위) 가로선, 세로로 쓴 숫자는 옆 세로선. 그 선 위에서 숫자를 사이에 둔
 *              «멈춤 자리»(보조선 · 벽이 닿는 자리 · 빗금 · 선 끝) 두 개가 그 치수의 양 끝.  (Lu 들의 치수 짝짓기와 같은 생각)
 *   ② 풀기 — 가로 자리(x)마다 · 세로 자리(y)마다 실제 mm 값을 모르는 값으로 두고,
 *              «치수 = 오른 끝 − 왼 끝» 을 아주 세게, «이웃 자리 사이는 사진에서 잰 비율대로» 를 약하게 하는 최소제곱.
 *              → 치수가 적힌 곳은 숫자 그대로, 안 적힌 곳은 사진 비율대로 그 사이에 들어감.
 *   ③ 맞는지 — 부분 치수 합 ≠ 전체 치수 같은 어긋남은 «하나씩 빼 보기» 로 범인을 찾아 빼고 짚어 줌. 사진 비율과 너무 다른 숫자(잘못 읽음)도 짚음.
 */

/** 선 위의 멈춤 자리(가로선이면 x 들) */
function 멈춤자리(선, 도형, 빗금, 허용) {
  const 가로 = 선.꼴 === 'H'
  const k = 가로 ? 0 : 1, j = 1 - k
  const 줄 = 선.a[j], s0 = Math.min(선.a[k], 선.b[k]), s1 = Math.max(선.a[k], 선.b[k])
  const 자리 = [s0, s1]
  for (const t of 도형) {
    if (t === 선 || t.t !== 'L') continue
    if (t.꼴 === (가로 ? 'V' : 'H')) {
      const 위치 = t.a[k]
      const t0 = Math.min(t.a[j], t.b[j]), t1 = Math.max(t.a[j], t.b[j])
      if (위치 >= s0 - 허용 && 위치 <= s1 + 허용 && 줄 >= t0 - 허용 && 줄 <= t1 + 허용) 자리.push(위치)
    }
  }
  for (const b of 빗금 || []) {
    if (b.꼴 !== 선.꼴) continue
    const 위치 = 가로 ? b.x : b.y, 줄b = 가로 ? b.y : b.x
    if (Math.abs(줄b - 줄) <= 허용 && 위치 >= s0 - 허용 && 위치 <= s1 + 허용) 자리.push(위치)
  }
  자리.sort((p, q) => p - q)
  const 묶 = []
  for (const v of 자리) { if (묶.length && v - 묶[묶.length - 1].끝 <= 허용) { const m = 묶[묶.length - 1]; m.합 += v; m.n++; m.끝 = v } else 묶.push({ 합: v, n: 1, 끝: v }) }
  return 묶.map((m) => m.합 / m.n)
}

/**
 * @param 숫자들 [{ c:[x,y](반듯한 판), 꼴:'H'|'V', 높이, 값, 믿음, 돌림, 소수, 글 }]
 * @param 도형 반듯하게 결과(가로 · 세로 꼴)
 * @returns 치수들 [{ 값, 꼴, 줄, a, b, 숫자: 번호, 믿음, 선 }]
 */
export function 치수짝짓기(숫자들, 도형, 빗금, o = {}) {
  const 굵 = o.굵 || 3
  const 허용 = Math.max(3, 2 * 굵)
  const 선들 = 도형.filter((s) => s.t === 'L' && (s.꼴 === 'H' || s.꼴 === 'V'))
  const 치수들 = []
  숫자들.forEach((n, ni) => {
    if (!n || !isFinite(n.값) || n.값 <= 0) return
    const 꼴 = n.꼴 === 'V' ? 'V' : 'H'
    const k = 꼴 === 'H' ? 0 : 1, j = 1 - k
    const h = Math.max(4, n.높이)
    let 최 = Infinity, 고 = null
    for (const s of 선들) {
      if (s.꼴 !== 꼴) continue
      const s0 = Math.min(s.a[k], s.b[k]), s1 = Math.max(s.a[k], s.b[k])
      if (n.c[k] < s0 + 0.3 * h || n.c[k] > s1 - 0.3 * h) continue
      const d = s.a[j] - n.c[j]   // 가로: 선이 아래(+) · 세로: 선이 오른쪽(+)
      const 거 = Math.abs(d)
      if (거 < 0.25 * h || 거 > 3.2 * h) continue
      // 글자 «아래쪽» 이 선을 보는 쪽을 좋아함: 가로 글 → 선이 아래 · 반시계로 돌려 쓴 세로 글 → 선이 오른쪽
      const 좋은쪽 = 꼴 === 'H' ? d > 0 : (n.돌림 === 90 ? d < 0 : d > 0)
      const 점수 = 거 + (좋은쪽 ? 0 : 0.8 * h)
      if (점수 < 최) { 최 = 점수; 고 = s }
    }
    /* 끊긴 치수선(2026-10-21 소장님 평면도 사진 «16,000» «36,000»): 숫자 자리에서 치수선이 끊긴 그림 — 숫자 양옆 같은 줄의 두 토막을 한 선으로 봄.
       (숫자를 치수선 «사이» 에 쓴 인쇄가 흔함 — 한 토막씩만 보면 숫자 가운데를 지나는 선이 없어 짝을 못 지음)
       지금은 칠한 평면도(벽만)에서만 — 선 도면 · 손그림은 숫자 · 선 토막이 많아 엉뚱한 짝이 생길 수 있어 예전 그대로(시험 사진 호텔 평면) */
    if (o.끊긴선) {
      const 글길 = n.글길 || (n.네모 ? (꼴 === 'H' ? n.네모[2] - n.네모[0] : n.네모[3] - n.네모[1]) : 2 * h)
      const 앞들 = [], 뒤들 = []
      for (const s of 선들) {
        if (s.꼴 !== 꼴) continue
        const s0 = Math.min(s.a[k], s.b[k]), s1 = Math.max(s.a[k], s.b[k])
        if (s1 - s0 < 1.5 * h || Math.abs(s.a[j] - n.c[j]) > 3.2 * h) continue
        if (s1 <= n.c[k] && n.c[k] - s1 <= 글길 / 2 + 3 * h) 앞들.push({ s, s0, s1 })
        else if (s0 >= n.c[k] && s0 - n.c[k] <= 글길 / 2 + 3 * h) 뒤들.push({ s, s0, s1 })
      }
      for (const p of 앞들) for (const q of 뒤들) {
        if (Math.abs(p.s.a[j] - q.s.a[j]) > Math.max(허용, 0.5 * h)) continue
        // 숫자 «때문에» 끊긴 자리만: 끊긴 틈이 글 길이쯤(0.6 배 ~ 1.5 배 + 글 높이 3 배 · 숫자 둘레 빈칸까지) — 아무 데나 끊긴 두 선을 잇지 않게
        const 틈 = q.s0 - p.s1
        if (틈 < 0.6 * 글길 || 틈 > 1.5 * 글길 + 3 * h) continue
        if (q.s1 - p.s0 < 2.5 * 글길 || p.s1 - p.s0 < 0.5 * 글길 || q.s1 - q.s0 < 0.5 * 글길) continue   // 토막이 글보다 아주 짧으면 치수선이 아님
        const 줄 = (p.s.a[j] + q.s.a[j]) / 2
        const 점수 = Math.abs(줄 - n.c[j]) + 0.2 * h
        if (점수 < 최) {
          최 = 점수
          고 = { t: 'L', 꼴, a: 꼴 === 'H' ? [p.s0, 줄] : [줄, p.s0], b: 꼴 === 'H' ? [q.s1, 줄] : [줄, q.s1], 끊김: [p.s, q.s] }
        }
      }
    }
    if (!고) return
    const 자리 = 멈춤자리(고, 선들, 빗금, Math.max(허용, 6, Math.round(0.005 * (o.크기 || 0))))   // 보조선 끝이 치수선에 몇 픽셀 못 미쳐도(뼈대 갈림 자리) 멈춤으로
    let a = null, b = null
    for (const v of 자리) { if (v <= n.c[k]) a = v; else if (b === null) b = v }
    if (a === null || b === null || b - a < 2 * h * 0.5) return
    // 자리 믿음: 치수 숫자는 대개 두 멈춤 자리 «가운데쯤» 에 · 그 사이에 들어가게 씀 — 끝에 붙었거나 글이 칸보다 길면 엉뚱한 짝일 때가 많음
    const 가운데 = Math.abs(n.c[k] - (a + b) / 2) / ((b - a) / 2)
    const 글길 = n.글길 || (n.네모 ? (꼴 === 'H' ? n.네모[2] - n.네모[0] : n.네모[3] - n.네모[1]) : 0)
    const 넘침 = 글길 / (b - a)
    const 자리믿음 = (가운데 <= 0.6 ? 1 : 가운데 <= 0.85 ? 0.75 : 0.45) * (넘침 <= 0.95 ? 1 : 넘침 <= 1.3 ? 0.65 : 0.35)
    치수들.push({ 값: n.값, 소수: !!n.소수, 단위글: !!n.단위글, 배수: n.배수, 단위: n.단위 || '', 꼴, 줄: 고.a[j], a, b, 숫자: ni, 믿음: n.믿음 * 자리믿음, 읽은믿음: n.믿음, 자리믿음, 선: 도형.indexOf(고.끊김 ? 고.끊김[0] : 고), ...(고.끊김 ? { 선2: 도형.indexOf(고.끊김[1]) } : {}), 글: n.글, 후보: n.후보 })
  })
  // 같은 자리 같은 치수가 둘(같은 숫자를 두 번 읽음)이면 하나
  const 남 = []
  for (const d of 치수들) if (!남.some((e) => e.꼴 === d.꼴 && Math.abs(e.a - d.a) < 허용 && Math.abs(e.b - d.b) < 허용 && Math.abs(e.줄 - d.줄) < 허용)) 남.push(d)
  return 남
}

function 풀기(A, b) {
  const n = b.length
  const M = A.map((r, i) => [...r, b[i]])
  for (let c = 0; c < n; c++) {
    let p = c
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r
    if (Math.abs(M[p][c]) < 1e-15) return null
    ;[M[p], M[c]] = [M[c], M[p]]
    for (let r = c + 1; r < n; r++) { const f = M[r][c] / M[c][c]; if (f) for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k] }
  }
  const x = new Array(n).fill(0)
  for (let r = n - 1; r >= 0; r--) { let s = M[r][n]; for (let k = r + 1; k < n; k++) s -= M[r][k] * x[k]; x[r] = s / M[r][r] }
  return x
}

/** 한 방향(가로 또는 세로) 풀기 → 매듭 [{px, mm}] · 치수마다 남은 차 */
function 한방향(치수들, 척, 허용) {
  if (!치수들.length) return { 매듭: [], 차: [] }
  // 매듭 = 치수 끝 자리들(가까우면 하나)
  const vs = []
  for (const d of 치수들) vs.push(d.a, d.b)
  vs.sort((p, q) => p - q)
  const 매 = []
  for (const v of vs) { if (매.length && v - 매[매.length - 1].끝 <= 허용) { const m = 매[매.length - 1]; m.합 += v; m.n++; m.끝 = v } else 매.push({ 합: v, n: 1, 끝: v }) }
  const px = 매.map((m) => m.합 / m.n)
  const 번 = (v) => { let k = 0, 최 = Infinity; px.forEach((p, i) => { if (Math.abs(p - v) < 최) { 최 = Math.abs(p - v); k = i } }); return k }
  const n = px.length
  const A = Array.from({ length: n }, () => new Array(n).fill(0)), b = new Array(n).fill(0)
  const 더 = (i, j, 목, w) => {   // w (K_j - K_i - 목)²
    A[i][i] += w; A[j][j] += w; A[i][j] -= w; A[j][i] -= w
    b[i] -= w * 목; b[j] += w * 목
  }
  // 약한 이음: 이웃 매듭 사이 = 척 × 픽셀 거리 (무게 = 1/거리 → 어긋남이 길이에 비례해 나뉨)
  let 최대w = 0
  for (let i = 0; i + 1 < n; i++) { const dx = Math.max(1e-3, px[i + 1] - px[i]); const w = 1 / dx; 최대w = Math.max(최대w, w); 더(i, i + 1, 척 * dx, w) }
  // 닻: 첫 매듭 = 척 × 픽셀
  A[0][0] += 1e-6; b[0] += 1e-6 * 척 * px[0]
  const 센 = Math.max(1, 최대w) * 1e5
  const 짝 = 치수들.map((d) => [번(d.a), 번(d.b)])
  치수들.forEach((d, i) => { const [p, q] = 짝[i]; if (p !== q) 더(p, q, d.mm, 센) })
  const K = 풀기(A, b)
  if (!K) return { 매듭: [], 차: 치수들.map(() => NaN) }
  const 차 = 치수들.map((d, i) => { const [p, q] = 짝[i]; return K[q] - K[p] - d.mm })
  return { 매듭: px.map((p, i) => ({ px: p, mm: K[i] })), 차, 짝 }
}

/** 고리 확인: 이 치수를 빼도 그 두 끝이 다른 치수들로 이어지면(부분 치수 합 = 전체 치수) 서로 검산된 것 */
function 고리(짝, i) {
  const 부 = new Map()
  const 찾 = (x) => { while (부.has(x) && 부.get(x) !== x) x = 부.get(x); return x }
  짝.forEach(([p, q], k) => { if (k === i) return; const a = 찾(p), b = 찾(q); if (a !== b) 부.set(a, b) })
  return 찾(짝[i][0]) === 찾(짝[i][1])
}

/**
 * @param 치수들 치수짝짓기 결과 (+ 사람이 넣은 것 { 꼴, a, b, 값, 사람:true })
 * @param o { 손그림, 척(mm/px — 알면) }
 * @returns { 척x, 척y, 매듭x, 매듭y, 치수들(쓰임 · 차 · 까닭), x(px)→mm, y(px)→mm }
 */
export function 치수풀기(치수들, o = {}) {
  const 손 = !!o.손그림
  const 허용 = o.허용 || 4
  // ① 단위(mm · m · cm): 소수가 있는 숫자는 m(×1000)일 수 있음 → 다른 숫자와 같은 척이 되는 쪽
  // 두 자리 아래 맨 숫자(«4» · «15»)는 m 로 적었을 수도 있음 → mm · m 둘 다 견줘 봄
  const 후 = 치수들.map((d) => { const L = d.b - d.a; return { ...d, L, 배수: d.사람 ? [1] : d.배수 && d.배수.length ? d.배수 : [1, ...(d.소수 || d.단위글 ? [1000, 10] : d.값 < 100 ? [1000] : [])] } })
  const 척후 = []
  for (const d of 후) for (const m of d.배수) if (d.L > 0) 척후.push(Math.log((d.값 * m) / d.L))
  const 없음 = () => ({ 척x: o.척 || null, 척y: o.척 || null, 매듭x: [], 매듭y: [], 치수들: 후, x: (v) => v * (o.척 || 1), y: (v) => v * (o.척 || 1) })
  if (!척후.length) return 없음()
  // 가장 많이 모이는 척(로그 ±3 % 칸) — 단, 그 척으로 종이 전체가 «말이 되는 크기»(0.8 m ~ 1 km)일 때만
  //   (글 속 숫자 · 방 이름을 숫자로 잘못 읽은 것끼리 모이면 «전체 4 cm» 같은 크기가 나옴 → 치수가 아님)
  const 말됨 = (e) => !o.크기px || (Math.exp(e) * o.크기px >= 800 && Math.exp(e) * o.크기px <= 1e6)   // 종이 전체가 0.8 m ~ 1 km
  const 사람있음 = 후.some((d) => d.사람)
  let 최수 = -1, 척0 = 0
  for (const c of 척후) {
    if (!사람있음 && !말됨(c)) continue
    let 수 = 0, 합 = 0
    for (const e of 척후) if (Math.abs(e - c) < 0.03) { 수++; 합 += e }
    if (수 > 최수 || (수 === 최수 && 합 / 수 < 척0)) { 최수 = 수; 척0 = 합 / 수 }
  }
  if (최수 < 0) {
    for (const d of 후) { d.쓰임 = false; d.치수아님 = true; d.까닭 = '이 숫자들로는 도면 크기가 말이 안 됨(치수가 아닌 숫자)' }
    return 없음()
  }
  // 방향마다 척: 사진을 비스듬히 찍어 펴진 종이의 가로:세로가 조금 틀리면(초점 거리 어림 오차) 세로 치수만 다 같이 몇 % 어긋남
  //   → 가로 치수끼리 · 세로 치수끼리 따로 모이는 척을 찾아(둘 이상 같은 척일 때만 · 전체 척의 ±45 % 안) 그 방향 숫자 고르기에 씀
  const 방척0 = { H: 척0, V: 척0 }
  if (!사람있음) for (const 꼴 of ['H', 'V']) {
    const 척들 = []
    for (const d of 후) if (d.꼴 === 꼴 && d.L > 0) for (const m of d.배수) 척들.push(Math.log((d.값 * m) / d.L))
    let 수최 = 0, 값 = 0
    for (const c of 척들) {
      if (!말됨(c) || Math.abs(c - 척0) > Math.log(1.45)) continue
      let 수 = 0, 합 = 0
      for (const e of 척들) if (Math.abs(e - c) < 0.03) { 수++; 합 += e }
      if (수 > 수최) { 수최 = 수; 값 = 합 / 수 }
    }
    // 그 방향에서 전체 척에 모이는 숫자보다 많이 모일 때만 바꿈
    const 전체수 = 척들.filter((e) => Math.abs(e - 척0) < 0.03).length
    if (수최 >= 2 && 수최 > 전체수) 방척0[꼴] = 값
  }
  /* 전체 치수(2026-10-21 소장님 평면도 사진 «16,000» × «36,000»): 인쇄 도면에서 그림 둘레를 거의 끝에서 끝까지(60 % 넘게) 걸친
     또렷한(0.8 넘게) 큰(1 m 넘게) 치수가 «가로에도 세로에도» 있으면 — 방향마다 그 숫자로 척을 정함.
     (사진을 펴며 어림한 가로:세로가 틀렸거나 · 분양 그림처럼 축척대로 안 그린 그림이어도 «적힌 숫자대로») */
  let 비율차 = null
  if (!손 && !사람있음 && o.범위 && 최수 < 2) {   // 두 숫자 넘게 같은 척으로 모이면 예전 그대로(그 척을 씀)
    const 전체 = { H: null, V: null }
    for (const 꼴 of ['H', 'V']) {
      const 범 = o.범위[꼴]
      if (!(범 > 0)) continue
      for (const d of 후) {
        if (d.꼴 !== 꼴 || !(d.L >= 0.6 * 범) || (d.믿음 ?? 1) < 0.8) continue
        const mm = d.값 * (d.배수[0] || 1)
        if (!(mm >= 1000) || !말됨(Math.log(mm / d.L))) continue
        if (!전체[꼴] || d.L > 전체[꼴].L) 전체[꼴] = d
      }
    }
    if (전체.H && 전체.V) {
      for (const 꼴 of ['H', 'V']) { const d = 전체[꼴]; 방척0[꼴] = Math.log((d.값 * (d.배수[0] || 1)) / d.L); d.전체 = true }
      const r = Math.exp(방척0.V - 방척0.H)
      if (Math.abs(Math.log(r)) > Math.log(1.06)) 비율차 = r
    }
  }
  // 읽기 후보 고르기: 읽은 확률 × «둥근 수» 를 좋아함(치수는 대개 10 · 50 · 100 의 배수) × 사진에서 잰 길이와 맞음
  const σ = 손 ? 0.18 : 0.02
  const 둥근mm = (v) => { const r = Math.round(v); if (Math.abs(v - r) > 1e-6) return 1; let z = 0, t = r; while (t > 0 && t % 10 === 0 && z < 3) { z++; t /= 10 } return [1, 2, 4, 6][z] * (r % 50 === 0 ? 1.5 : 1) }
  // 피트 · 인치 치수는 mm 로 둥글지 않음 → 인치(6 · 12 인치 배수)로 봄
  const 둥근in = (v) => { const i = Math.round(v / 25.4); if (Math.abs(v / 25.4 - i) > 0.03) return 1; return i % 12 === 0 ? 6 : i % 6 === 0 ? 4 : 2 }
  const 둥근 = (v, 단위) => (단위 === 'ft' || 단위 === 'in' ? 둥근in(v) : 둥근mm(v))
  const 허비 = 손 ? [0.7, 1.43] : [0.94, 1.06]   // 손그림도 사진과 40 % 넘게 다르면 잘못 읽은 것일 때가 많음(맞는데 빠지면 빨간 숫자 → 눌러서 넣기)
  for (const d of 후) {
    const 후보 = d.사람 || !d.후보 || !d.후보.length ? [{ 값: d.값, p: 1 }] : d.후보
    let 최 = -Infinity
    const 갈래 = new Map()
    for (const c of 후보) for (const m of (d.사람 ? [1] : c.배수 && c.배수.length ? c.배수 : d.배수)) {
      if (!(c.값 > 0)) continue
      const mm = c.값 * m
      const e = Math.log(mm / d.L) - 방척0[d.꼴 === 'V' ? 'V' : 'H']
      const 점 = Math.log(Math.max(1e-6, c.p)) + Math.log(둥근(mm, c.단위 ?? d.단위)) - (e * e) / (2 * σ * σ)
      if (점 > 최) { 최 = 점; d.단위배 = m; d.고른값 = c.값; d.고른단위 = c.단위 ?? d.단위; d.고른소수 = c.소수 ?? d.소수 }
      const 비 = Math.exp(e)
      if (비 >= 허비[0] && 비 <= 허비[1] && (!갈래.has(mm) || 갈래.get(mm).점 < 점)) 갈래.set(mm, { 값: c.값, m, mm, 점 })
    }
    d.갈래 = [...갈래.values()].sort((p, q) => q.점 - p.점).slice(0, 4)   // 둘레 치수와 함께 맞춰 볼 읽기(가장 그럴듯한 4 개)
    if (d.고른값 !== d.값) { d.읽은값 = d.값; d.값 = d.고른값; d.고침 = '다른 읽기 후보(둥근 수 · 길이와 맞음)로 고름' }
    d.mm = d.값 * d.단위배
    d.비 = d.mm / d.L / Math.exp(방척0[d.꼴 === 'V' ? 'V' : 'H'])   // 사진 비율과 견준 값(1 이면 꼭 맞음)
  }
  // ② 사진 비율과 너무 다른 숫자는 잘못 읽었을 수 있음 → 쓰지 않고 짚음(사람이 넣은 것은 늘 씀)
  for (const d of 후) {
    if (d.사람) { d.쓰임 = true; continue }
    d.쓰임 = d.비 >= 허비[0] && d.비 <= 허비[1]
    if (!d.쓰임) d.까닭 = `사진에서 잰 길이와 ${Math.round(Math.abs(d.비 - 1) * 100)}% 다름 — 숫자를 확인해 주세요`
    if (!d.쓰임 && (d.비 > 3 || d.비 < 1 / 3)) d.치수아님 = true   // 세 배 넘게 다르면 치수가 아닌 숫자(방 번호 · 글 속 숫자) — 화면에 빨간 딱지도 안 띄움
  }
  // 방향마다 척 (가로 치수만 · 세로 치수만 — 사진 가로:세로가 조금 틀려도 맞게)
  const 척방 = (꼴) => {
    const L = 후.filter((d) => d.쓰임 && d.꼴 === 꼴).map((d) => Math.log(d.mm / d.L)).sort((p, q) => p - q)
    if (!L.length) return null
    const m = L.length >> 1
    return Math.exp(L.length % 2 ? L[m] : (L[m - 1] + L[m]) / 2)   // 짝수면 가운데 둘의 평균(큰 쪽으로 치우치지 않게)
  }
  let 척x = 척방('H'), 척y = 척방('V')
  if (!척x && !척y) { 척x = Math.exp(방척0.H); 척y = Math.exp(방척0.V) } else if (!척x) 척x = 척y * Math.exp(방척0.H - 방척0.V); else if (!척y) 척y = 척x * Math.exp(방척0.V - 방척0.H)
  // ③ 풀고 → 어긋나면 하나씩 빼 보기
  const 허차 = o.허차 ?? 0.6   // mm
  /* ③-가 함께 맞춰 보기: 한 방향 치수마다 «읽기 후보 4 개 + 빼기» 를 모두 엮어 보고,
     부분 치수 합 = 전체 치수가 되는 것 가운데 가장 그럴듯한(읽은 확률 × 둥근 수 × 사진 길이) 조합을 고름.
     (하나씩 빼기보다 «둘이 함께 틀린» 손글씨도 고침) — 엮음이 너무 많으면 아래 하나씩 빼기로 */
  const 뺌점 = -4
  const 함께풀기 = (모두, 척) => {
    if (!모두.length) return null
    const 갈 = 모두.map((d) => (d.사람 ? [{ 값: d.값, m: 1, mm: d.mm, 점: 0 }] : d.강제뺌 ? [null] : [...(d.갈래 || []), null]))
    if (갈.reduce((a, g) => a * g.length, 1) > 6000) return null
    const 끝최 = new Array(갈.length + 1).fill(0)
    for (let k = 갈.length - 1; k >= 0; k--) 끝최[k] = 끝최[k + 1] + Math.max(...갈[k].map((g) => (g ? g.점 : 뺌점)))
    let 최 = null
    const 고름 = new Array(모두.length)
    const 돌 = (k, 점) => {
      if (최 && 점 + 끝최[k] <= 최.점) return
      if (k === 모두.length) {
        const 쓸 = [], 원 = []
        모두.forEach((d, i) => { if (고름[i]) { 쓸.push({ ...d, mm: 고름[i].mm }); 원.push(d) } })
        const r = 쓸.length ? 한방향(쓸, 척, 허용) : { 매듭: [], 차: [] }
        if (Math.max(0, ...r.차.map(Math.abs)) > 허차) return
        최 = { 점, 고: 고름.slice(), r, 원 }
        return
      }
      for (const g of 갈[k]) { 고름[k] = g; 돌(k + 1, 점 + (g ? g.점 : 뺌점)) }
    }
    돌(0, 0)
    if (!최) return null
    모두.forEach((d, i) => {
      if (d.사람) return
      const g = 최.고[i]
      if (!g) {
        d.쓰임 = false
        if (!d.까닭) d.까닭 = '다른 치수와 안 맞음(부분 치수 합 ≠ 전체 치수) — 숫자를 확인해 주세요'
        return
      }
      d.쓰임 = true; delete d.까닭
      if (g.값 !== d.값) { d.읽은값 = d.읽은값 ?? d.값; d.값 = g.값; d.고침 = '둘레 치수와 맞는 다른 읽기 후보로 고름' }
      d.단위배 = g.m; d.mm = g.mm; d.비 = d.mm / d.L / Math.exp(방척0[d.꼴 === 'V' ? 'V' : 'H'])
    })
    return { ...최.r, 쓸: 최.원 }
  }
  const 방향풀기 = (꼴, 척) => {
    const 함께 = 함께풀기(후.filter((d) => d.꼴 === 꼴), 척)
    if (함께) return 함께
    let 쓸 = 후.filter((d) => d.쓰임 && d.꼴 === 꼴)
    for (let 회 = 0; 회 < 쓸.length; 회++) {
      const r = 한방향(쓸, 척, 허용)
      const 최차 = Math.max(0, ...r.차.map(Math.abs))
      if (최차 <= 허차 || 쓸.length <= 1) return { ...r, 쓸 }
      // 하나씩 빼 봄 → 빼면 나머지가 가장 잘 맞는 것(같으면 믿음이 낮은 것 · 사람이 넣은 것은 마지막에)
      let 고 = -1, 고점 = Infinity
      쓸.forEach((d, i) => {
        const 남 = 쓸.filter((_, k) => k !== i)
        const rr = 한방향(남, 척, 허용)
        const m = Math.max(0, ...rr.차.map(Math.abs))
        const 점 = m + (d.사람 ? 1e6 : 0) + (d.믿음 ?? 1) * 0.01
        if (점 < 고점) { 고점 = 점; 고 = i }
      })
      if (고 < 0) return { ...r, 쓸 }
      const d = 쓸[고]
      // 빼기 전에: 이 치수의 다른 읽기 후보 가운데 둘레와 꼭 맞는 것이 있으면 그것으로
      if (!d.사람 && d.후보 && d.후보.length > 1) {
        let 고친 = null
        for (const c of d.후보) {
          if (c.값 === d.값 || !(c.값 > 0)) continue
          const 옛 = d.mm; d.mm = c.값 * d.단위배
          const rr = 한방향(쓸, 척, 허용)
          const m = Math.max(0, ...rr.차.map(Math.abs))
          d.mm = 옛
          if (m <= 허차 && (!고친 || c.p > 고친.p)) 고친 = c
        }
        if (고친) { d.읽은값 = d.읽은값 ?? d.값; d.값 = 고친.값; d.mm = 고친.값 * d.단위배; d.고침 = '부분 치수 합에 맞는 다른 읽기 후보로 고침'; continue }
      }
      d.쓰임 = false
      d.까닭 = '다른 치수와 안 맞음(부분 치수 합 ≠ 전체 치수) — 숫자를 확인해 주세요'
      쓸 = 쓸.filter((_, k) => k !== 고)
    }
    return { ...한방향(쓸, 척, 허용), 쓸 }
  }
  // 손그림: 믿음이 낮은(0.5 아래) 숫자는 «다른 숫자와 척이 비슷할 때(±12 %)» 만 씀 — 글씨 · 방 이름을 숫자로 잘못 읽은 것끼리 크기를 정하지 않게
  if (손) {
    const 쓸 = 후.filter((d) => d.쓰임 && !d.사람)
    for (const d of 쓸) {
      if ((d.믿음 ?? 1) >= 0.5) continue
      const 짝 = 쓸.some((e) => e !== d && e.쓰임 && Math.abs(Math.log(e.비 / d.비)) < 0.12)
      if (!짝 && !후.some((e) => e.사람)) { d.쓰임 = false; d.강제뺌 = true; d.까닭 = '믿음이 낮고 다른 치수와 견줄 수 없어 안 씀 — 맞으면 눌러서 «숫자 고치기»' }
    }
  }
  let X, Y
  const 검산 = () => {
    for (const d of 후) delete d.확인
    for (const R of [X, Y]) R.쓸.forEach((d, i) => {
      d.차 = R.차[i]
      if (d.사람 || !d.쓰임) return
      // 검산: 다른 치수와 고리로 맞거나(부분 합 = 전체) · 도면은 사진에서 잰 길이와 2 % 안 → «확인됨»(믿음이 낮게 읽혔어도 노란색 아님)
      if (R.짝 && R.짝[i] && R.짝[i][0] !== R.짝[i][1] && 고리(R.짝, i) && Math.abs(d.차) <= 허차) d.확인 = '다른 치수와 맞음'
      else if (!손 && 최수 >= Math.max(3, 0.35 * 후.length) && (d.믿음 ?? 1) >= 0.6 && Math.abs(d.비 - 1) < 0.02) d.확인 = '사진에서 잰 길이와 맞음'   // 셋 넘게 · 짝지은 숫자의 35 % 넘게 같은 척일 때만(엉뚱한 숫자가 많은 사진에서 우연히 셋이 맞는 것은 빼려고)
    })
  }
  for (let 회 = 0; 회 < 3; 회++) {
    X = 방향풀기('H', 척x); Y = 방향풀기('V', 척y)
    검산()
    // 믿음 0.5 아래이고 검산(고리 · 사진 길이)도 안 된 숫자는 크기를 정하는 데 쓰지 않음 → 빼고 다시 풂(글씨를 숫자로 잘못 읽은 것이 도면 크기를 틀리게 하지 않게)
    if (후.some((e) => e.사람)) break
    const 뺄 = 후.filter((d) => d.쓰임 && !d.사람 && !d.확인 && (d.믿음 ?? 1) < 0.5)
    if (!뺄.length) break
    for (const d of 뺄) { d.쓰임 = false; d.강제뺌 = true; d.까닭 = '믿음이 낮고 다른 치수로 검산이 안 되어 안 씀 — 맞으면 눌러서 «숫자 고치기»' }
  }
  // 검산된 치수가 하나도 없으면(고리 · 사진 길이 모두 안 됨) 크기를 정하는 숫자를 아주 깐깐하게:
  //   또렷이 읽혔고(0.8 넘게) · 100 mm 넘는 길이인 것만 — 방 번호 · 글씨 조각(«63» «49»)이 도면 크기를 엉뚱하게 정하지 않게.
  //   남는 게 없으면 «크기를 모릅니다» 로 두고 사람이 숫자 하나를 눌러 넣게 함(틀린 크기보다 나음)
  if (!후.some((e) => e.사람) && !후.some((e) => e.쓰임 && e.확인)) {
    let 뺄 = 후.filter((d) => d.쓰임 && ((d.믿음 ?? 1) < 0.8 || !(d.mm >= 100) || (!(d.고른소수 ?? d.소수) && !(d.고른단위 ?? d.단위) && d.값 < 100)))
    // 남는 숫자가 하나뿐이거나 둘 넘어도 서로 척이 안 맞으면(인쇄 3 % · 손그림 12 %) 그것도 안 씀 — 숫자 하나는 엉뚱한 칸에 짝지어져도 «사진 비율과 꼭 맞음» 이 되어 버림(제 자신과 견주는 셈)
    const 남은 = 후.filter((d) => d.쓰임 && !뺄.includes(d))
    const 맞는짝 = (d) => 남은.some((e) => e !== d && Math.abs(Math.log(e.mm / e.L) - Math.log(d.mm / d.L)) < (손 ? 0.12 : 0.03))
    if (남은.length) 뺄 = [...뺄, ...남은.filter((d) => !d.전체 && !맞는짝(d))]   // 전체 치수(가로 · 세로 하나씩 · 둘레 끝에서 끝까지)는 남김
    if (뺄.length) {
      for (const d of 뺄) { d.쓰임 = false; d.강제뺌 = true; d.까닭 = '다른 치수로 검산이 안 되어 안 씀 — 맞으면 눌러서 «숫자 고치기»' }
      X = 방향풀기('H', 척x); Y = 방향풀기('V', 척y)
      검산()
    }
  }
  const 사상 = (매듭, 척) => (v) => {
    if (!매듭.length) return v * 척
    if (매듭.length === 1) return 매듭[0].mm + (v - 매듭[0].px) * 척
    if (v <= 매듭[0].px) return 매듭[0].mm + (v - 매듭[0].px) * 척
    const n = 매듭.length
    if (v >= 매듭[n - 1].px) return 매듭[n - 1].mm + (v - 매듭[n - 1].px) * 척
    let lo = 0, hi = n - 1
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (매듭[m].px <= v) lo = m; else hi = m }
    const t = (v - 매듭[lo].px) / (매듭[hi].px - 매듭[lo].px)
    return 매듭[lo].mm + t * (매듭[hi].mm - 매듭[lo].mm)
  }
  const 비율 = 비율차 && 후.some((d) => d.전체 && d.쓰임 && d.꼴 === 'H') && 후.some((d) => d.전체 && d.쓰임 && d.꼴 === 'V') ? 비율차 : null
  return { 척x, 척y, 매듭x: X.매듭, 매듭y: Y.매듭, 치수들: 후, x: 사상(X.매듭, 척x), y: 사상(Y.매듭, 척y), ...(비율 ? { 비율차: 비율 } : {}) }
}
