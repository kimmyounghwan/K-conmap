/**
 * 📐 토공 3D — 횡단면 면적(터파기 · 되메우기 · 구조물 · 성토) · 평균단면법 · 측량 땅 면(삼각망) · 땅 면으로 잰 부피 (2026-10-05 · G139)
 *
 * 소장님: 「이것까지 해야 프로그램이 완성되는거 아니야? 3d」 → 땅 면 + 물량까지.
 *
 * ■ 단면면적 — 레이어 이름에 기대지 않고 «선 모양» 으로 잽니다.
 *   소장님 도면 08 의 배수로 횡단면도는 터파기선이 «0» 레이어(치수선과 같이)에, 구조물은 «콘크리트개거» 레이어에 있습니다.
 *   그래서 단면을 2 cm 칸으로 그려(선 = 벽), 바깥(아래 · 옆)에서 물을 부어 닿지 않는 «지반선 아래 칸» 을 터파기로 셉니다.
 *   ① 터파기 = 지반선 아래, 지반선 + 그 아래 선들로 둘러싸인 곳(치수선처럼 열린 선은 둘러싸지 않으므로 안 셈)
 *   ② 구조물 = 한 레이어의 선이 «닫힌 모양» 을 만든 곳 + 그 사이 물길(U형 · 관의 안쪽 — 같은 구조물 양쪽 벽 사이)
 *   ③ 되메우기 = 터파기 − 구조물(물길 포함)
 *   ④ 성토 = 지반선 위, 지반선 + 그 위 선들로 둘러싸이고 지반선에 닿은 곳
 *   선 끝이 지반선에 딱 붙지 않고 조금 떨어진 도면(15 cm 안)은 이어 그려 줍니다.
 * ■ 평균단면법 — 측점 사이 (앞 면적 + 뒤 면적) ÷ 2 × 거리 (수량산출서 꼴)
 * ■ 삼각망 — 측량점(높이 든 점)을 들로네 삼각형으로 이어 현황 땅 면. 너무 긴 변(점이 없는 곳)은 버립니다.
 */

const 안씀층 = /시추|지층|주상|boring|dim|치수|point|pnt|elev|표고|지번|text|글자|문자|hatch|해치|defpoints/i
/* 🏭 G234 «점 · 표고» 이름 레이어라도 긴 선이 이어진 것은 설계선(계획 지반선 · 성토 윗면)으로 씀 — 측량 표시(짧은 십자 · 세모)만 뺌
     소장님 현장 E 06 동쪽배수장 횡단: 계획선(깎을 바닥 EL −0.83 · 배수장 터 GH 4.22)이 «PointElev» 레이어에 있어 터파기가 표의 반 · 성토 7% */
const 표식층 = /point|pnt|elev|표고/i
function 긴선층(a, 배, kz) {
  const L = a.map((s) => Math.hypot((s[2] - s[0]) * 배, (s[3] - s[1]) * kz)).sort((p, q) => p - q)
  const 합 = L.reduce((t, v) => t + v, 0)
  return L[L.length >> 1] >= 0.8 && 합 >= 5
}

/* 🏭 G234 구조물로 안 볼 레이어 — 흙(터파기 · 성토 …)을 제 레이어 선만으로 닫아 그린 도면(소장님 현장 E 06 «계획터파기» · «#여성토») */
const 흙층 = /터파기|굴착|절토|성토|되메|토공|흙깎|흙쌓|사토|치환/
/* 🧭 G251 공장 제품(옹벽 블록 · 프리캐스트) 레이어 — 구조물(흙 대신 그 자리)이지만 현장 타설 콘크리트 · 거푸집은 아님
     소장님 현장 E 08 «1호(중앙)배수로»: 블록 옹벽(«제품» 층 · 유천생태옹벽블럭)을 콘크리트로 세어 1,043 m 에 4,229 ㎥(내역 배수로 호안 무근 895 ㎥) */
const 제품층 = /제품|블[록럭]|BLOCK|PRECAST|프리캐스트|기성품|P\.?C\s*제품/i

/**
 * 🏭 G234 (2026-10-10) 속 빈 구조물 — 벽 안쪽 선이 윗선에 붙어(펌프장 · 유입 수조) «구멍» 이 홀짝으로 안 잡히는 곳을 뺍니다.
 *   소장님 현장 E 06 동쪽배수장 횡단 NO.2+0.00: 벽 0.5 m 펌프장(12.5 × 11 m)을 통콘크리트 145 ㎡ 로 셌음.
 *   구조물(홀수) 무리마다 ① 가장 두꺼운 곳(속 거리 · m) ② 둘레 선 너머가 «다른 구조물 무리» 인 몫을 재서
 *   - 속 거리 1 m 넘고(두께 2 m 넘게) · 6 ㎡ 넘고 · 둘레의 반 넘게가 다른 구조물(벽)에 둘러싸임 → 빈속(물 · 방)
 *   - 속 거리 2.5 m 넘음(어느 쪽으로나 5 m 넘게 꽉 찬 콘크리트) → 빈속(겉 테두리만 그린 큰 구조물)
 *   빈속 = «구조물 속 빈 곳»(물길과 같은 S=2) — 콘크리트 · 3D 모양엔 안 들고, 되메우기 · 성토에선 구조물로(그 자리를 흙으로 안 채움)
 * @returns null | Uint8Array(무리마다 1 = 빈속)
 */
function 빈속빼기(깊, 무, 무수, 층벽, 닿, nx, ny, dx, dy) {
  if (!무수) return
  const N = nx * ny
  const 속 = (k) => !층벽[k] && !닿[k] && 깊[k] % 2 === 1
  /* 거리(m) — 두 번 훑는 모따기 거리(속 칸 → 가장 가까운 «속 아닌 칸») */
  const D = new Float32Array(N)
  const dd = Math.hypot(dx, dy)
  for (let k = 0; k < N; k++) D[k] = 속(k) ? 1e9 : 0
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const k = j * nx + i
    if (!D[k]) continue
    let v = D[k]
    if (i > 0) v = Math.min(v, D[k - 1] + dx)
    if (j > 0) { v = Math.min(v, D[k - nx] + dy); if (i > 0) v = Math.min(v, D[k - nx - 1] + dd); if (i < nx - 1) v = Math.min(v, D[k - nx + 1] + dd) }
    if (i === 0 || j === 0 || i === nx - 1 || j === ny - 1) v = Math.min(v, dx)
    D[k] = v
  }
  for (let j = ny - 1; j >= 0; j--) for (let i = nx - 1; i >= 0; i--) {
    const k = j * nx + i
    if (!D[k]) continue
    let v = D[k]
    if (i < nx - 1) v = Math.min(v, D[k + 1] + dx)
    if (j < ny - 1) { v = Math.min(v, D[k + nx] + dy); if (i < nx - 1) v = Math.min(v, D[k + nx + 1] + dd); if (i > 0) v = Math.min(v, D[k + nx - 1] + dd) }
    D[k] = v
  }
  const 큰 = new Float32Array(무수), 수 = new Int32Array(무수), 콘 = new Int32Array(무수), 밖 = new Int32Array(무수)
  const 걸음 = [[1, 0], [-1, 0], [0, 1], [0, -1]]
  for (let k = 0; k < N; k++) {
    if (!속(k)) continue
    const c = 무[k]
    수[c]++
    if (D[k] > 큰[c]) 큰[c] = D[k]
    const i = k % nx, j = (k / nx) | 0
    for (const [si, sj] of 걸음) {
      let ii = i + si, jj = j + sj, 넘 = 0
      if (ii < 0 || jj < 0 || ii >= nx || jj >= ny || !층벽[jj * nx + ii]) continue
      while (넘 < 5 && ii >= 0 && jj >= 0 && ii < nx && jj < ny && 층벽[jj * nx + ii]) { ii += si; jj += sj; 넘++ }
      if (ii < 0 || jj < 0 || ii >= nx || jj >= ny) { 밖[c]++; continue }
      const kk = jj * nx + ii
      if (층벽[kk]) continue
      if (닿[kk]) 밖[c]++
      else if (무[kk] !== c) { if (깊[kk] % 2 === 1) 콘[c]++; else 밖[c]++ }
    }
  }
  const 칸 = dx * dy
  const 빔 = new Uint8Array(무수)
  let 있 = false
  for (let c = 0; c < 무수; c++) {
    if (!수[c]) continue
    const A = 수[c] * 칸, 둘 = 콘[c] + 밖[c]
    if ((큰[c] > 1.0 && A > 6 && 둘 && 콘[c] / 둘 >= 0.5) || 큰[c] > 2.5) { 빔[c] = 1; 있 = true }
  }
  return 있 ? 빔 : null
}

/* ── 단면 면적 ─────────────────────────────── */
/**
 * @param 조각   Map(층 → [[ax,ay,bx,by,…]])  단면 창 안 선(도면 좌표)
 * @param 땅인가 (층) => bool
 * @param 높     (y) => 표고 m  (도면 y 의 1차식)
 * @param 배     도면 x 1 → m
 * @param cx     단면 중심 x(도면)
 * @returns null | { 터파기, 되메우기, 구조물, 성토 (㎡), 바닥: [[o, z]] (m · 터파기 바닥), 지반: [[o, z]] (m), 칸 }
 */
export function 단면면적(조각, 땅인가, 높, 배, cx) {
  const 땅 = [], 딴 = [], 층별 = new Map()
  const kz = 높(1) - 높(0)                 // 도면 y 1 → m
  for (const [ly, arr] of 조각) {
    const a = (arr || []).filter((s) => Math.hypot(s[2] - s[0], s[3] - s[1]) > 1e-9)
    if (!a.length) continue
    if (땅인가(ly)) { for (const s of a) 땅.push(s); continue }
    if (안씀층.test(ly) && !(표식층.test(ly) && 긴선층(a, 배, kz))) continue
    for (const s of a) 딴.push(s)
    층별.set(ly, a)
  }
  if (!땅.length) return null
  if (!(kz > 0) || !(배 > 0)) return null
  let x0 = Infinity, x1 = -Infinity, gy0 = Infinity, gy1 = -Infinity
  for (const [ax, ay, bx, by] of 땅) { x0 = Math.min(x0, ax, bx); x1 = Math.max(x1, ax, bx); gy0 = Math.min(gy0, ay, by); gy1 = Math.max(gy1, ay, by) }
  let y0 = gy0, y1 = gy1
  for (const [ax, ay, bx, by] of 딴) {
    if (Math.max(ax, bx) < x0 || Math.min(ax, bx) > x1) continue
    y0 = Math.min(y0, ay, by); y1 = Math.max(y1, ay, by)
  }
  y0 = Math.max(y0, gy0 - 20 / kz); y1 = Math.min(y1, gy1 + 10 / kz)
  const W = x1 - x0, H = y1 - y0
  if (!(W > 0) || !(H > 0)) return null
  const cw = Math.max(0.02 / 배, W / 1600), ch = Math.max(0.02 / kz, H / 1200)
  const ox = x0 - 2 * cw, oy = y0 - 2 * ch
  const nx = Math.ceil(W / cw) + 5, ny = Math.ceil(H / ch) + 5
  const N = nx * ny
  const ci = (x) => Math.floor((x - ox) / cw), cj = (y) => Math.floor((y - oy) / ch)
  const 칸면적 = cw * 배 * ch * kz

  /* 지반선 높이(칸 가운데 x 마다 · 가장 위) */
  const g = new Float64Array(nx).fill(NaN)
  for (let i = 0; i < nx; i++) {
    const x = ox + (i + 0.5) * cw
    let best = NaN
    for (const [ax, ay, bx, by] of 땅) {
      if (Math.abs(bx - ax) < 1e-12) continue
      if (x < Math.min(ax, bx) || x > Math.max(ax, bx)) continue
      const y = ay + (by - ay) * (x - ax) / (bx - ax)
      if (!(y <= best)) best = y
    }
    g[i] = best
  }
  /* 지반선이 접혀 있으면(같은 x 에 지반선이 둘 넘게 — 구조물을 지반선 레이어로 그린 단면 · 소장님 도면 08 의 1호 BOX 교량 자리)
     면적을 세지 않습니다(엉뚱한 큰 값이 됨) */
  {
    let 겹 = 0
    for (let i = 0; i < nx; i++) {
      const x = ox + (i + 0.5) * cw
      let n = 0
      for (const [ax, , bx] of 땅) { if (Math.abs(bx - ax) < 1e-12) continue; if (x > Math.min(ax, bx) && x < Math.max(ax, bx)) n++ }
      if (n >= 2) 겹++
    }
    if (겹 * cw * 배 > Math.max(1, 0.05 * W * 배)) return { 이상: '지반선이 접혀 있음(구조물 모양)' }
  }
  /* 선 그리기(8-이웃 선 — 4-이웃 물 붓기는 못 건넘) */
  const 칸선 = new Map()          // 칸 → 그 칸을 지나는 선(번호) — 벽 칸이 «안쪽» 몇 %인지 잴 때
  const 선목록 = []
  const 그리기 = (벽, s, v, 적기 = false) => {
    const si0 = 적기 ? 선목록.push(s) - 1 : -1
    let i0 = ci(s[0]), j0 = cj(s[1]); const i1 = ci(s[2]), j1 = cj(s[3])
    const di = Math.abs(i1 - i0), dj = Math.abs(j1 - j0), si = i0 < i1 ? 1 : -1, sj = j0 < j1 ? 1 : -1
    let e = di - dj, k = 0
    for (;;) {
      if (i0 >= 0 && i0 < nx && j0 >= 0 && j0 < ny) {
        const kk = j0 * nx + i0
        벽[kk] |= v
        if (적기) { let a = 칸선.get(kk); if (!a) { a = []; 칸선.set(kk, a) } if (a[a.length - 1] !== si0) a.push(si0) }
      }
      if ((i0 === i1 && j0 === j1) || k++ > 1e6) break
      const e2 = 2 * e
      if (e2 > -dj) { e -= dj; i0 += si }
      if (e2 < di) { e += di; j0 += sj }
    }
  }
  const 벽 = new Uint8Array(N)
  for (const s of 땅) 그리기(벽, s, 1, true)
  for (const s of 딴) 그리기(벽, s, 2, true)
  /* 틈 메우기 — 끝이 혼자인 선(다른 선과 안 붙음)이 지반선에서 15 cm 안이면 지반선까지 이어 그림 */
  const 이음 = []
  {
    const 열 = (x, y) => Math.round(x / (cw * 0.5)) + ',' + Math.round(y / (ch * 0.5))
    const 수 = new Map()
    for (const s of 딴) for (const [x, y] of [[s[0], s[1]], [s[2], s[3]]]) { const k = 열(x, y); 수.set(k, (수.get(k) || 0) + 1) }
    const 틈 = 0.15
    for (const s of 딴) for (const [x, y] of [[s[0], s[1]], [s[2], s[3]]]) {
      if ((수.get(열(x, y)) || 0) > 1) continue
      let best = null
      for (const t of 땅) {
        const dx = t[2] - t[0], dy = t[3] - t[1], l2 = dx * dx + dy * dy
        let u = l2 ? ((x - t[0]) * dx + (y - t[1]) * dy) / l2 : 0
        u = Math.max(0, Math.min(1, u))
        const px = t[0] + u * dx, py = t[1] + u * dy
        const d = Math.hypot((px - x) * 배, (py - y) * kz)
        if (d > 1e-9 && d <= 틈 && (!best || d < best.d)) best = { d, px, py }
      }
      if (best) { 그리기(벽, [x, y, best.px, best.py], 2, true); 이음.push([x, y, best.px, best.py]) }
    }
  }
  const 아래 = (i, j) => Number.isFinite(g[i]) && oy + (j + 0.5) * ch < g[i]
  const 위 = (i, j) => Number.isFinite(g[i]) && oy + (j + 0.5) * ch > g[i]
  /* 물 붓기 — 테두리에서 시작해 «들어갈 수 있는 칸» 으로 번짐. 닿지 않은 칸 = 둘러싸인 칸 */
  const 붓기 = (들어감, 막힘) => {
    const 닿음 = new Uint8Array(N)
    const q = new Int32Array(N)
    let h = 0, t = 0
    const 넣 = (k) => { if (!닿음[k] && !막힘[k] && 들어감(k % nx, (k / nx) | 0)) { 닿음[k] = 1; q[t++] = k } }
    for (let i = 0; i < nx; i++) { 넣(i); 넣((ny - 1) * nx + i) }
    for (let j = 0; j < ny; j++) { 넣(j * nx); 넣(j * nx + nx - 1) }
    /* 지반선이 없는 칸(단면 밖)은 «바깥» — 그 옆 칸에서 시작 */
    for (let i = 0; i < nx; i++) if (!Number.isFinite(g[i])) for (let j = 0; j < ny; j++) { if (i > 0) 넣(j * nx + i - 1); if (i < nx - 1) 넣(j * nx + i + 1) }
    while (h < t) {
      const k = q[h++], i = k % nx
      if (i > 0) 넣(k - 1)
      if (i < nx - 1) 넣(k + 1)
      if (k >= nx) 넣(k - nx)
      if (k < N - nx) 넣(k + nx)
    }
    return 닿음
  }
  /* ① 터파기 */
  const 터닿음 = 붓기(아래, 벽)
  const E = new Uint8Array(N)
  let nE = 0
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const k = j * nx + i; if (!벽[k] && 아래(i, j) && !터닿음[k]) { E[k] = 1; nE++ } }
  /* 지반선에 닿은 덩어리만 — 지반선 아래 «표(측점 · 지반고 칸)» 처럼 저 혼자 닫힌 네모는 빼야 합니다(소장님 도면 08 의 1호:
     단면 아래 표 칸 46.6 ㎡ 가 터파기 · 구조물로 세어졌음). 지반선에 닿은 칸에서 시작해 «둘러싸인 칸» 과 «그 사이 선 한 칸» 을 건너 번지게 합니다
     (U형 구조물 안쪽처럼 지반선에 안 닿아도 터파기 안에 있는 곳은 들어옴) */
  {
    const 됨 = new Uint8Array(N), q = new Int32Array(N)
    let h = 0, t = 0
    const 건넘 = (k) => {
      if (!벽[k] || (벽[k] & 1)) return false
      const i = k % nx
      return (i > 0 && E[k - 1]) || (i < nx - 1 && E[k + 1]) || (k >= nx && E[k - nx]) || (k < N - nx && E[k + nx])
    }
    for (let k = 0; k < N; k++) {
      if (!E[k]) continue
      const i = k % nx
      if ((i > 0 && 벽[k - 1] & 1) || (i < nx - 1 && 벽[k + 1] & 1) || (k >= nx && 벽[k - nx] & 1) || (k < N - nx && 벽[k + nx] & 1)) { 됨[k] = 1; q[t++] = k }
    }
    while (h < t) {
      const k = q[h++], i = k % nx
      for (const kk of [i > 0 ? k - 1 : -1, i < nx - 1 ? k + 1 : -1, k >= nx ? k - nx : -1, k < N - nx ? k + nx : -1]) {
        if (kk < 0 || 됨[kk]) continue
        if (E[kk] || (E[k] && 건넘(kk))) { 됨[kk] = 1; q[t++] = kk }
      }
    }
    nE = 0
    for (let k = 0; k < N; k++) { if (E[k] && !됨[k]) E[k] = 0; if (E[k]) nE++ }
  }
  /* ② 구조물 — 레이어마다 그 선만으로 닫힌 곳 */
  const S = new Uint8Array(N)
  const P = new Uint8Array(N)                 // 🧭 G251 공장 제품(블록) 칸
  const 무리번 = new Int32Array(N).fill(-1)   // 🧭 G251 제품 아닌 구조물 속 칸의 무리(레이어마다 닫힌 곳) — 뒷채움 띠 가려내기
  let 무리기준 = 0
  const 언제나 = () => true
  const 제품인층 = (ly) => 제품층.test(ly) && !/기초|콘크리트|CONC|버림|FOUND|천단/i.test(ly)       // «블럭기초» 는 현장 콘크리트
  /* 🧱 G398 블록(제품) 선도 다른 층의 «닫는 벽» 으로 — 현장 S 1호(중앙)배수로 블록 호안: 기초 콘크리트(0.8 × 0.5 · 턱)와 천단 콘크리트(1.0 × 0.1)는
       «0» 층 선과 블록 밑 · 옆 선(«제품» 층)이 같이 닫는 모양이라 «0» 층 혼자로는 안 닫혀 콘크리트에서 빠졌음(1,043 m 에 334 ㎥ — 수량산출서 945 ㎥).
       블록 속(제품끼리 닫은 곳)은 그 층 구조물로 안 셈 */
  let 제품벽 = null, 제품속 = null
  for (const [ly, arr] of 층별) {
    if (arr.length < 3 || 흙층.test(ly) || !제품인층(ly)) continue
    if (!제품벽) 제품벽 = new Uint8Array(N)
    for (const s of arr) 그리기(제품벽, s, 1)
  }
  if (제품벽) {
    const 밖 = 붓기(언제나, 제품벽)
    제품속 = new Uint8Array(N)
    for (let k = 0; k < N; k++) if (!밖[k] && !제품벽[k]) 제품속[k] = 1
  }
  for (const [ly, arr] of 층별) {
    if (arr.length < 3 || 흙층.test(ly)) continue
    const 제품 = 제품인층(ly)
    const 층벽 = new Uint8Array(N)
    for (const s of arr) 그리기(층벽, s, 1)
    const 자기벽 = 제품벽 && !제품 ? 층벽.slice() : 층벽
    if (제품벽 && !제품) for (let k = 0; k < N; k++) if (제품벽[k]) 층벽[k] = 1
    const 닿 = 붓기(언제나, 층벽)
    let 있 = 0
    for (let k = 0; k < N; k++) if (!닿[k] && !층벽[k]) { 있 = 1; break }
    if (!있) continue
    /* 🧊 G225 — 닫힌 모양 «안의 닫힌 모양» 은 구멍(박스 · 관의 속 빈 곳): 바깥(0) → 선 → 속(1) → 선 → 구멍(2) … 홀수만 구조물
       전에는 박스 단면(바깥 네모 + 안 네모)의 속 빈 곳까지 콘크리트로 셌습니다(2.4×2.0 박스가 4.79 ㎡ — 맞는 값 2.28 ㎡) */
    const 깊 = new Int8Array(N).fill(-1)
    const 무 = new Int32Array(N).fill(-1)       // 선 아닌 칸의 무리(4-이웃)
    const 띠 = new Int32Array(N).fill(-1)       // 선 칸의 무리(8-이웃)
    const qq = new Int32Array(N)
    let 무수 = 0, 띠수 = 0
    for (let k0 = 0; k0 < N; k0++) {
      if (층벽[k0] || 닿[k0] || 무[k0] >= 0) continue
      let h = 0, t = 0; 무[k0] = 무수; qq[t++] = k0
      while (h < t) {
        const k = qq[h++], i = k % nx
        const 이 = [i > 0 ? k - 1 : -1, i < nx - 1 ? k + 1 : -1, k >= nx ? k - nx : -1, k < N - nx ? k + nx : -1]
        for (const kk of 이) if (kk >= 0 && !층벽[kk] && !닿[kk] && 무[kk] < 0) { 무[kk] = 무수; qq[t++] = kk }
      }
      무수++
    }
    for (let k0 = 0; k0 < N; k0++) {
      if (!층벽[k0] || 띠[k0] >= 0) continue
      let h = 0, t = 0; 띠[k0] = 띠수; qq[t++] = k0
      while (h < t) {
        const k = qq[h++], i = k % nx, j = (k / nx) | 0
        for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
          const ii = i + di, jj = j + dj
          if (ii < 0 || jj < 0 || ii >= nx || jj >= ny) continue
          const kk = jj * nx + ii
          if (층벽[kk] && 띠[kk] < 0) { 띠[kk] = 띠수; qq[t++] = kk }
        }
      }
      띠수++
    }
    // 띠 ↔ 무리(바깥 = −2) 이웃
    const 띠이웃 = Array.from({ length: 띠수 }, () => new Set())
    const 무이웃 = Array.from({ length: 무수 }, () => new Set())
    const 바깥띠 = new Set()
    for (let k = 0; k < N; k++) {
      if (!층벽[k]) continue
      const i = k % nx, b = 띠[k]
      for (const kk of [i > 0 ? k - 1 : -1, i < nx - 1 ? k + 1 : -1, k >= nx ? k - nx : -1, k < N - nx ? k + nx : -1]) {
        if (kk < 0 || 층벽[kk]) continue
        if (닿[kk]) 바깥띠.add(b)
        else { 띠이웃[b].add(무[kk]); 무이웃[무[kk]].add(b) }
      }
    }
    const 무깊 = new Int32Array(무수).fill(-1)
    let 앞 = [...바깥띠], 단 = 1
    const 본띠 = new Set(앞)
    while (앞.length) {
      const 새무 = []
      for (const b of 앞) for (const c of 띠이웃[b]) if (무깊[c] < 0) { 무깊[c] = 단; 새무.push(c) }
      const 새띠 = []
      for (const c of 새무) for (const b of 무이웃[c]) if (!본띠.has(b)) { 본띠.add(b); 새띠.push(b) }
      앞 = 새띠; 단++
    }
    for (let k = 0; k < N; k++) if (!층벽[k] && !닿[k]) 깊[k] = 무깊[무[k]] < 0 ? 1 : 무깊[무[k]]
    const 빔 = 빈속빼기(깊, 무, 무수, 층벽, 닿, nx, ny, cw * 배, ch * kz)
    for (let k = 0; k < N; k++) {
      if (닿[k]) continue
      if (제품속 && !제품 && (제품속[k] || (층벽[k] && !자기벽[k]))) continue      // 🧱 G398 블록 속 · 블록 선 칸은 이 층 구조물이 아님
      if (!층벽[k]) { if (깊[k] % 2 === 1) { if (빔 && 빔[무[k]]) { if (!S[k]) S[k] = 2 } else { S[k] = 1; if (제품) P[k] = 1; else if (무리번[k] < 0) 무리번[k] = 무리기준 + 무[k] } } continue }
      /* 닫힌 모양의 테두리 선 칸도 구조물로(안쪽(홀수) 칸과 붙은 것만) */
      const i = k % nx
      const 속 = (kk) => !닿[kk] && !층벽[kk] && 깊[kk] % 2 === 1
      if ((i > 0 && 속(k - 1)) || (i < nx - 1 && 속(k + 1)) || (k >= nx && 속(k - nx)) || (k < N - nx && 속(k + nx))) { S[k] = 1; if (제품) P[k] = 1 }
    }
    무리기준 += 무수
  }
  /* 🧭 G251 블록 옹벽 뒤 «뒷채움» 띠 — 제품(블록)이 있는 단면에서, 블록에서 1 m 안에 있는 «얇고(두께 0.7 m 아래) 긴(1.5 m 넘게)» 닫힌 곳은
       뒷채움 잡석 · 필터층(현장 콘크리트 아님 — 현장 E 08 상세 «뒷채움잡석») · 블록 밑 기초 콘크리트(0.8 × 0.5) · 천단 콘크리트는 짧아서 그대로 콘크리트 */
  const 채움 = new Uint8Array(N)
  const 캡상자 = []                            // 🧱 G398 블록 맨 위에 얹힌 얇은 천단 콘크리트(칸 상자) — 거푸집 없음
  let 제품있 = false
  for (let k = 0; k < N; k++) if (P[k]) { 제품있 = true; break }
  if (제품있 && 무리기준) {
    const dx = cw * 배, dy = ch * kz, dd = Math.hypot(dx, dy)
    /* 블록까지 거리(m) — 블록 칸에서 1 m 안 */
    const 가까 = new Float32Array(N).fill(1e9)
    for (let k = 0; k < N; k++) if (P[k]) 가까[k] = 0
    for (let pass = 0; pass < 2; pass++) {
      const 앞 = pass === 0
      for (let jj = 0; jj < ny; jj++) for (let ii = 0; ii < nx; ii++) {
        const j = 앞 ? jj : ny - 1 - jj, i = 앞 ? ii : nx - 1 - ii, k = j * nx + i
        let v = 가까[k]
        const sj = 앞 ? -1 : 1, si = 앞 ? -1 : 1
        if (i + si >= 0 && i + si < nx) v = Math.min(v, 가까[k + si] + dx)
        if (j + sj >= 0 && j + sj < ny) { v = Math.min(v, 가까[k + sj * nx] + dy); if (i + si >= 0 && i + si < nx) v = Math.min(v, 가까[k + sj * nx + si] + dd); if (i - si >= 0 && i - si < nx) v = Math.min(v, 가까[k + sj * nx - si] + dd) }
        가까[k] = v
      }
    }
    /* 무리 속 거리(m) — 같은 무리 밖 칸까지 */
    const D = new Float32Array(N)
    for (let k = 0; k < N; k++) D[k] = 무리번[k] >= 0 ? 1e9 : 0
    for (let pass = 0; pass < 2; pass++) {
      const 앞 = pass === 0
      for (let jj = 0; jj < ny; jj++) for (let ii = 0; ii < nx; ii++) {
        const j = 앞 ? jj : ny - 1 - jj, i = 앞 ? ii : nx - 1 - ii, k = j * nx + i
        if (무리번[k] < 0) continue
        const r = 무리번[k], sj = 앞 ? -1 : 1, si = 앞 ? -1 : 1
        let v = D[k]
        const 이 = (kk, d) => { v = Math.min(v, 무리번[kk] === r ? D[kk] + d : d) }
        if (i + si >= 0 && i + si < nx) 이(k + si, dx); else v = Math.min(v, dx)
        if (j + sj >= 0 && j + sj < ny) { 이(k + sj * nx, dy); if (i + si >= 0 && i + si < nx) 이(k + sj * nx + si, dd); if (i - si >= 0 && i - si < nx) 이(k + sj * nx - si, dd) } else v = Math.min(v, dy)
        D[k] = v
      }
    }
    const 큰D = new Map(), 넓 = new Map(), 곁 = new Map()
    for (let k = 0; k < N; k++) {
      const r = 무리번[k]
      if (r < 0 || P[k]) continue
      if (D[k] > (큰D.get(r) || 0)) 큰D.set(r, D[k])
      넓.set(r, (넓.get(r) || 0) + 1)
      if (가까[k] <= 1.0) 곁.set(r, true)
    }
    const 띠무리 = new Set()
    for (const [r, n] of 넓) {
      const t = 큰D.get(r) || 0, A = n * dx * dy
      if (곁.get(r) && t <= 0.35 && t > 0 && A / (2 * t) >= 1.5) 띠무리.add(r)
    }
    /* 🧱 G398 블록 선을 벽으로 쓰면 생기는 것 — ① 계단꼴 블록 뒤와 뒷채움 선 사이 작은 틈(0.08 ㎡ 안 · 블록에 닿음) = 뒷채움
         ② 블록 호안 기초 콘크리트 밑에 깐 얇은 판(두께 0.25 m 안 · 위에 다른 콘크리트 무리가 올라앉음 · 그보다 넓음) = 잡석 기초(현장 S 1호 «잡석» 1.0 × 0.2 — 단면 상세도) */
    const 칸범위 = new Map()
    for (let k = 0; k < N; k++) {
      const r = 무리번[k]
      if (r < 0 || P[k]) continue
      const i = k % nx, j = (k / nx) | 0
      let b0 = 칸범위.get(r); if (!b0) { b0 = [i, j, i, j]; 칸범위.set(r, b0) }
      if (i < b0[0]) b0[0] = i; if (j < b0[1]) b0[1] = j; if (i > b0[2]) b0[2] = i; if (j > b0[3]) b0[3] = j
    }
    for (const [r, n] of 넓) {
      if (띠무리.has(r)) continue
      const A = n * dx * dy
      let 닿음 = false
      for (let k = 0; k < N && !닿음; k++) if (무리번[k] === r && 가까[k] <= Math.max(2 * dd, 0.06)) 닿음 = true
      const t = 큰D.get(r) || 0, b0 = 칸범위.get(r)
      if (닿음 && A < 0.08 && b0) {
        /* 블록 무더기 맨 위(곁 1.5 m 안 블록 칸의 가장 높은 줄)보다 밑이 낮은 틈만 — 맨 위에 얹힌 천단은 남김 */
        const 곁칸 = Math.ceil(1.5 / dx)
        let 블록위 = -1
        for (let j = ny - 1; j >= 0 && 블록위 < 0; j--) for (let i = Math.max(0, b0[0] - 곁칸); i <= Math.min(nx - 1, b0[2] + 곁칸); i++) if (P[j * nx + i]) { 블록위 = j; break }
        if (블록위 >= 0 && b0[1] < 블록위 - 1) { 띠무리.add(r); continue }      // 밑이 블록 맨 위보다 낮으면 틈(천단은 맨 위에 얹힘)
      }
      if (b0 && (b0[3] - b0[1] + 1) * dy <= 0.2) {
        const 곁칸2 = Math.ceil(1.5 / dx)
        let 블록위2 = -1
        for (let j = ny - 1; j >= 0 && 블록위2 < 0; j--) for (let i = Math.max(0, b0[0] - 곁칸2); i <= Math.min(nx - 1, b0[2] + 곁칸2); i++) if (P[j * nx + i]) { 블록위2 = j; break }
        if (블록위2 >= 0 && b0[1] >= 블록위2 - 1) 캡상자.push([b0[0] - 1, b0[1] - 1, b0[2] + 1, b0[3] + 1])
      }
      if (!b0 || !(t > 0 && t <= 0.125) || (b0[2] - b0[0] + 1) * dx < 0.6) continue
      /* 윗변 바로 위(3 칸 안)가 다른 구조물 무리인 열 */
      let 열 = 0, 위무리 = new Map()
      for (let i = b0[0]; i <= b0[2]; i++) {
        let 맨위 = -1
        for (let j = b0[3]; j >= b0[1]; j--) if (무리번[j * nx + i] === r) { 맨위 = j; break }
        if (맨위 < 0) continue
        열++
        for (let jj = 맨위 + 1; jj <= Math.min(ny - 1, 맨위 + 4); jj++) { const r2 = 무리번[jj * nx + i]; if (r2 >= 0 && r2 !== r && !P[jj * nx + i]) { 위무리.set(r2, (위무리.get(r2) || 0) + 1); break } }
      }
      let 큰 = null
      for (const [r2, c] of 위무리) if (!큰 || c > 큰[1]) 큰 = [r2, c]
      const b2 = 큰 ? 칸범위.get(큰[0]) : null
      if (큰 && 큰[1] >= 0.6 * 열 && b2 && (b2[2] - b2[0]) < (b0[2] - b0[0]) && !띠무리.has(큰[0])) 띠무리.add(r)
    }
    if (띠무리.size) for (let k = 0; k < N; k++) if (무리번[k] >= 0 && 띠무리.has(무리번[k]) && !P[k]) 채움[k] = 1
  }
  /* 물길 — 같은 구조물(8-이웃으로 붙은 덩어리)의 두 벽 사이 칸(한 줄에서 3 m 안) */
  {
    const 표 = new Int32Array(N)
    let n = 0
    const q = new Int32Array(N)
    for (let k0 = 0; k0 < N; k0++) {
      if (!S[k0] || 표[k0]) continue
      n++; let h = 0, t = 0; 표[k0] = n; q[t++] = k0
      while (h < t) {
        const k = q[h++], i = k % nx, j = (k / nx) | 0
        for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
          const ii = i + di, jj = j + dj
          if (ii < 0 || jj < 0 || ii >= nx || jj >= ny) continue
          const kk = jj * nx + ii
          if (S[kk] && !표[kk]) { 표[kk] = n; q[t++] = kk }
        }
      }
    }
    const 최대 = Math.ceil(3 / (cw * 배))
    for (let j = 0; j < ny; j++) {
      let 앞 = -1
      for (let i = 0; i < nx; i++) {
        const k = j * nx + i
        if (!S[k]) continue
        if (앞 >= 0 && i - 앞 > 1 && i - 앞 <= 최대 && 표[j * nx + 앞] === 표[k]) {
          for (let ii = 앞 + 1; ii < i; ii++) { const kk = j * nx + ii; if (E[kk] || (아래(ii, j) && !터닿음[kk])) S[kk] = 2 }
        }
        앞 = i
      }
    }
  }
  /* 🧱 (G224 · 2026-10-10) 콘크리트 · 거푸집 — 구조물 덩어리(닫힌 모양 · 물길은 뺌) 가운데 «터파기에 닿은» 것만(표 칸 · 범례 네모는 안 셈)
       거푸집 = 콘크리트 칸의 옆면(왼 · 오른쪽 이웃이 콘크리트 아님) + 아랫면(아래 이웃이 물길 · 공중 — 흙에 닿은 바닥 아랫면은 안 셈) · 윗면은 안 셈
       칸 모서리로 재므로 비스듬한 면(헌치)은 조금 길게 나옵니다 — 검산용 */
  let 콘칸 = 0, 거푸집 = 0
  const 구조폭 = [Infinity, -Infinity], 구조높 = [Infinity, -Infinity]
  const 콘속 = new Uint8Array(N)            /* 선 칸을 뺀 콘크리트 속 칸 — 넓이는 아래 영역면적(선 칸은 안쪽 몫만)으로 */
  const 콘몫 = new Uint8Array(N)            /* 🧊 G225 콘크리트 칸 전부(선 칸 포함) — 3D 모양(테두리) 뽑기 */
  {
    const 표2 = new Int32Array(N), q = new Int32Array(N)
    const 남길 = new Set()
    let n = 0
    for (let k0 = 0; k0 < N; k0++) {
      if (S[k0] !== 1 || 표2[k0]) continue
      n++; let h = 0, t = 0, 닿 = false; 표2[k0] = n; q[t++] = k0
      while (h < t) {
        const k = q[h++], i = k % nx, j = (k / nx) | 0
        if (E[k]) 닿 = true
        for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
          const ii = i + di, jj = j + dj
          if (ii < 0 || jj < 0 || ii >= nx || jj >= ny) continue
          const kk = jj * nx + ii
          if (S[kk] === 1 && !표2[kk]) { 표2[kk] = n; q[t++] = kk }
        }
      }
      if (닿) 남길.add(n)
    }
    /* 🧭 G251 선 칸은 제품 · 뒷채움이 아닌 콘크리트 속 칸과 붙었을 때만(뒷채움 띠 테두리 선을 거푸집으로 세지 않게) */
    const 속콘 = (k) => S[k] === 1 && !벽[k] && !P[k] && !채움[k]
    const 콘인가 = (k) => {
      if (S[k] !== 1 || !남길.has(표2[k]) || P[k] || 채움[k]) return false
      if (!벽[k] || !제품있) return true
      const i = k % nx
      return (i > 0 && 속콘(k - 1)) || (i < nx - 1 && 속콘(k + 1)) || (k >= nx && 속콘(k - nx)) || (k < N - nx && 속콘(k + nx))
    }
    const 세로변 = ch * kz, 가로변 = cw * 배
    /* 🧱 G398 블록 호안 — 블록(제품) · 뒷채움 · 블록 테두리 선에 닿은 옆면은 거푸집 아님(블록이 거푸집 몫) · 블록 맨 위 얇은 천단(두께 0.15 m 안)은 거푸집 없음(현장 S 수량산출서: 호안 거푸집 = 기초 옆면만 1 ㎡/m) */
    const 블록곁 = (kk) => 제품있 && (P[kk] || 채움[kk] || (벽[kk] && ((kk % nx > 0 && P[kk - 1]) || (kk % nx < nx - 1 && P[kk + 1]) || (kk >= nx && P[kk - nx]) || (kk < N - nx && P[kk + nx]))))
    const 캡속 = (i, j) => 캡상자.some((b) => i >= b[0] && i <= b[2] && j >= b[1] && j <= b[3])
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const k = j * nx + i
      if (!콘인가(k)) continue
      콘몫[k] = 1
      콘칸++
      if (!벽[k]) 콘속[k] = 1
      const o = (ox + (i + 0.5) * cw - cx) * 배, z = 높(oy + (j + 0.5) * ch)
      if (o < 구조폭[0]) 구조폭[0] = o
      if (o > 구조폭[1]) 구조폭[1] = o
      if (z < 구조높[0]) 구조높[0] = z
      if (z > 구조높[1]) 구조높[1] = z
      if (캡상자.length && 캡속(i, j)) continue
      if (i === 0 || (!콘인가(k - 1) && !블록곁(k - 1))) 거푸집 += 세로변
      if (i === nx - 1 || (!콘인가(k + 1) && !블록곁(k + 1))) 거푸집 += 세로변
      if (j > 0 && !콘인가(k - nx)) {
        const kk = k - nx
        const 흙 = E[kk] || 아래(i, j - 1)          // 아래가 터파기 · 원지반이면 흙에 닿은 바닥
        if (S[kk] === 2 || (!흙 && !벽[kk]) || (!흙 && 위(i, j - 1))) 거푸집 += 가로변
      }
    }
  }
  /* 터파기 폭 · 깊이 — 측설표 · 안전 그림에 씀 */
  const 터폭 = [Infinity, -Infinity]
  let 깊이 = 0
  for (let i = 0; i < nx; i++) {
    let 바 = -1
    for (let j = 0; j < ny; j++) if (E[j * nx + i]) { 바 = j; break }
    if (바 < 0 || !Number.isFinite(g[i])) continue
    const o = (ox + (i + 0.5) * cw - cx) * 배
    if (o < 터폭[0]) 터폭[0] = o
    if (o > 터폭[1]) 터폭[1] = o
    const d = 높(g[i]) - 높(oy + 바 * ch)
    if (d > 깊이) 깊이 = d
  }
  /* 칸 가운데로 잰 끝은 2 ~ 5 cm 안쪽에 옴(비탈 끝 쐐기 칸) → 그 가까이(15 cm · 칸 넷 안) «지반선 위에 놓인 선 꼭짓점» 이 있으면 그 자리로(측설표 cm) */
  if (Number.isFinite(터폭[0])) {
    const 붙 = (o) => {
      let best = null
      const 멀 = Math.max(0.15, 4 * cw * 배)
      for (const [ax, ay, bx, by] of 딴) for (const [x, y] of [[ax, ay], [bx, by]]) {
        const oo = (x - cx) * 배
        if (Math.abs(oo - o) > 멀) continue
        const gi = ci(x)
        if (gi < 0 || gi >= nx || !Number.isFinite(g[gi])) continue
        if (Math.abs(높(y) - 높(g[gi])) > Math.max(0.1, 3 * ch * kz)) continue
        if (best === null || Math.abs(oo - o) < Math.abs(best - o)) best = oo
      }
      return best === null ? o : best
    }
    터폭[0] = 붙(터폭[0]); 터폭[1] = 붙(터폭[1])
  }

  /* ④ 성토 — 지반선 위, 둘러싸이고 지반선에 닿은 덩어리(아래 «성토 칸 다시 모음») */
  const 성닿음 = 붓기(위, 벽)
  const n성 = 0
  /* 면적 — 칸마다 세로로 이어진 칸 줄(run)의 위 · 아래 끝을 «실제 선» 높이로 바로잡아 더함(칸 수만 세면 선 두께만큼 1~3 % 모자람) */
  /* 벽(선) 칸이 그 영역 쪽으로 몇 %인지 — 칸 안 16 점마다, 옆 영역 칸 가운데까지 선을 안 넘고 갈 수 있으면 그 영역 */
  const 넘음 = (px, py, qx, qy, t) => {
    const [ax, ay, bx, by] = t
    const d1 = (bx - ax) * (py - ay) - (by - ay) * (px - ax), d2 = (bx - ax) * (qy - ay) - (by - ay) * (qx - ax)
    const d3 = (qx - px) * (ay - py) - (qy - py) * (ax - px), d4 = (qx - px) * (by - py) - (qy - py) * (bx - px)
    return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))
  }
  const 영역면적 = (M) => {
    let n = 0, 조금 = 0
    for (let k = 0; k < N; k++) {
      if (M[k]) { n++; continue }
      if (!벽[k]) continue
      const i = k % nx, j = (k / nx) | 0
      const 이웃 = []
      if (i > 0 && M[k - 1]) 이웃.push(k - 1)
      if (i < nx - 1 && M[k + 1]) 이웃.push(k + 1)
      if (j > 0 && M[k - nx]) 이웃.push(k - nx)
      if (j < ny - 1 && M[k + nx]) 이웃.push(k + nx)
      if (!이웃.length) continue
      const 선들 = (칸선.get(k) || []).map((m) => 선목록[m])
      let c = 0
      for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) {
        const px = ox + (i + (a + 0.5) / 4) * cw, py = oy + (j + (b + 0.5) / 4) * ch
        for (const kk of 이웃) {
          const qx = ox + ((kk % nx) + 0.5) * cw, qy = oy + (((kk / nx) | 0) + 0.5) * ch
          if (!선들.some((t) => 넘음(px, py, qx, qy, t))) { c++; break }
        }
      }
      조금 += c / 16
    }
    return (n + 조금) * 칸면적
  }
  const SE = new Uint8Array(N)
  for (let k = 0; k < N; k++) if (S[k] && E[k]) SE[k] = 1
  const F = new Uint8Array(N)
  /* 성토 칸 다시 모음(위에서 센 덩어리) */
  {
    const 본 = new Uint8Array(N)
    const q = new Int32Array(N)
    for (let k0 = 0; k0 < N; k0++) {
      const i0 = k0 % nx, j0 = (k0 / nx) | 0
      if (본[k0] || 벽[k0] || 성닿음[k0] || !위(i0, j0) || S[k0]) continue
      let h = 0, t = 0, 땅닿 = false
      본[k0] = 1; q[t++] = k0
      while (h < t) {
        const k = q[h++], i = k % nx
        for (const kk of [i > 0 ? k - 1 : -1, i < nx - 1 ? k + 1 : -1, k >= nx ? k - nx : -1, k < N - nx ? k + nx : -1]) {
          if (kk < 0) continue
          if (벽[kk] & 1) 땅닿 = true
          const ii = kk % nx, jj = (kk / nx) | 0
          if (!본[kk] && !벽[kk] && !성닿음[kk] && 위(ii, jj) && !S[kk]) { 본[kk] = 1; q[t++] = kk }
        }
        const jj = (k / nx) | 0
        if (jj > 0 && Number.isFinite(g[i]) && oy + (jj - 0.5) * ch < g[i]) 땅닿 = true
      }
      if (땅닿) for (let m = 0; m < t; m++) F[q[m]] = 1
    }
  }
  void n성
  const 터 = 영역면적(E)
  const 콘크리트 = 콘칸 ? 영역면적(콘속) : 0
  const 구 = Math.min(터, 영역면적(SE))
  const 성 = 영역면적(F)
  /* 🏭 G234 되메우기 = 판 곳 가운데 «다 지은 뒤 흙으로 다시 채우는 곳»만.
       판 곳을 선(계획선 · 구조물 · 블록 · 터파기선 — 원지반선은 빼고)으로 나눈 무리마다, 원지반선 바로 위가 «빈 하늘»(성토 · 구조물 아님)인 폭이 1.5 m 넘으면
       그 무리는 «열린 채 남는 깎기»(유수지 · 수로 바닥까지 깎기 — 다시 안 채움) · 아니면 그 무리에서 구조물을 뺀 것이 되메우기
       (원지반 윗면이 계획 성토(배수장 터 GH) 아래면 하늘이 아님 → 그 아래 터파기는 되메우기 · 블록과 터파기선이 땅에서 만나는 좁은 틈은 열린 곳 아님)
       소장님 현장 E 07 유수지: 전에는 «터파기 − 구조물» 로 셈해 되메우기가 표의 6.5 배(파낸 유수지를 다 채운 셈) */
  let 되 = Math.max(0, 터 - 구), 열린 = 0
  {
    const 무 = new Int32Array(N).fill(-1), q = new Int32Array(N)
    const 열칸 = []
    let 수 = 0
    for (let k0 = 0; k0 < N; k0++) {
      if (!E[k0] || 무[k0] >= 0) continue
      let h = 0, t = 0; 무[k0] = 수; q[t++] = k0
      const 열 = new Set()
      while (h < t) {
        const k = q[h++], i = k % nx
        /* 원지반선 위 빈 하늘인가 — 위로 원지반선(만) 칸을 1 ~ 4 칸 지나 빈 칸 */
        let kk = k + nx, 지남 = 0
        while (kk < N && 벽[kk] === 1 && 지남 < 4) { kk += nx; 지남++ }
        if (지남 && kk < N && !벽[kk] && !F[kk] && !S[kk] && !E[kk]) 열.add(i)
        for (const k2 of [i > 0 ? k - 1 : -1, i < nx - 1 ? k + 1 : -1, k >= nx ? k - nx : -1, k < N - nx ? k + nx : -1]) if (k2 >= 0 && E[k2] && 무[k2] < 0) { 무[k2] = 수; q[t++] = k2 }
      }
      열칸.push(열.size * cw * 배)
      수++
    }
    /* 넓게 열린 무리라도 붙은 구조물이 그 무리 바닥까지(또는 더 얕게) 내려와 있으면 «구조물을 앉히려고 판 곳»(구조물 옆 · 다시 채움) —
       구조물(벽 · 블록)이 무리 바닥보다 0.3 m 넘게 깊이 앉아 있으면 그 구조물은 수로 · 유수지 둘레를 싼 것이고 무리는 열린 깎기 */
    const 열림 = 열칸.map((w) => w >= 1.5)
    {
      const 구무 = new Int32Array(N).fill(-1), 구바닥 = []
      const qq = new Int32Array(N)
      for (let k0 = 0; k0 < N; k0++) {
        if (!S[k0] || 구무[k0] >= 0) continue
        let h = 0, t = 0, 바 = ny; 구무[k0] = 구바닥.length; qq[t++] = k0
        while (h < t) {
          const k = qq[h++], i = k % nx, j = (k / nx) | 0
          if (j < 바) 바 = j
          for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
            const ii = i + di, jj = j + dj
            if (ii < 0 || jj < 0 || ii >= nx || jj >= ny) continue
            const kk = jj * nx + ii
            if (S[kk] && 구무[kk] < 0) { 구무[kk] = 구바닥.length; qq[t++] = kk }
          }
        }
        구바닥.push(바)
      }
      const 바닥 = new Int32Array(수).fill(ny), 붙구 = Array.from({ length: 수 }, () => new Set())
      for (let k = 0; k < N; k++) {
        if (!E[k]) continue
        const c = 무[k], i = k % nx, j = (k / nx) | 0
        if (j < 바닥[c]) 바닥[c] = j
        for (const [si, sj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          let ii = i + si, jj = j + sj, n = 0
          while (n < 4 && ii >= 0 && jj >= 0 && ii < nx && jj < ny && !S[jj * nx + ii] && 벽[jj * nx + ii]) { ii += si; jj += sj; n++ }
          if (ii < 0 || jj < 0 || ii >= nx || jj >= ny) continue
          const kk = jj * nx + ii
          if (S[kk] && 구무[kk] >= 0) 붙구[c].add(구무[kk])
        }
      }
      const 깊이칸 = Math.max(1, Math.round(0.3 / (ch * kz)))
      for (let c = 0; c < 수; c++) {
        if (!열림[c] || !붙구[c].size) continue
        const 구 = Math.min(...[...붙구[c]].map((d) => 구바닥[d]))
        if (구 > 바닥[c] - 깊이칸) 열림[c] = false
      }
    }
    const 열 = new Uint8Array(N), 채 = new Uint8Array(N)
    for (let k = 0; k < N; k++) { if (!E[k]) continue; if (열림[무[k]]) 열[k] = 1; else if (!S[k]) 채[k] = 1 }
    열린 = 영역면적(열)
    if (열린 > 0.005) 되 = Math.min(되, 영역면적(채))
  }
  /* 바닥 · 지반 모양(0.1 m 마다) — 땅 면 부피 확인에 씀 */
  const 바닥 = [], 지반 = []
  const 걸음 = Math.max(1, Math.round(0.1 / (cw * 배)))
  for (let i = 0; i < nx; i += 걸음) {
    if (!Number.isFinite(g[i])) continue
    const o = (ox + (i + 0.5) * cw - cx) * 배
    지반.push([o, 높(g[i])])
    for (let j = 0; j < ny; j++) if (E[j * nx + i]) { 바닥.push([o, 높(oy + j * ch)]); break }
  }
  /* 🧊 G225 BIM 물량 — 콘크리트 · 터파기 · 성토 칸의 «테두리» 를 단면 좌표(o 옆 m · z 표고 m)의 다각형으로(3D 덩어리 · 노선 따라 세움)
   *   칸 모서리를 따라 돈 계단 선을 1.5 칸 안에서 펴서(더글러스-포이커) 꼭짓점을 줄임 — 넓이는 위 셈 그대로(모양은 그림용) */
  const 꼴 = (M) => 테두리들(M, nx, ny, 1.5).map((ring) => ring.map(([i, j]) => [Math.round(((ox + i * cw) - cx) * 배 * 1000) / 1000, Math.round(높(oy + j * ch) * 1000) / 1000]))
  /* 터 = 파낸 자리 바깥 둘레(구조물 포함 — 3D 에서 비쳐 보이는 «판 흙» 덩어리) · 성 = 쌓은 흙 — 바깥 줄만 */
  const 바깥만 = (rs) => rs.filter((r) => { let A = 0; for (let k = 0; k < r.length; k++) { const a = r[k], b = r[(k + 1) % r.length]; A += a[0] * b[1] - b[0] * a[1] } return A > 0 })
  let 모양 = null
  try {
    const 터콘 = new Uint8Array(N)
    for (let k = 0; k < N; k++) 터콘[k] = E[k] || 콘몫[k] ? 1 : 0
    모양 = { 콘: 콘칸 ? 꼴(콘몫) : [], 터: 바깥만(꼴(터콘)), 성: 바깥만(꼴(F)) }
  } catch (e) { 모양 = null }
  return { 터파기: 터, 구조물: 구, 되메우기: 되, 열린깎기: 열린, 성토: 성, 바닥, 지반, 칸: Math.min(cw * 배, ch * kz),
    콘크리트, 거푸집, 구조폭: 콘칸 ? 구조폭 : null, 구조높: 콘칸 ? 구조높 : null, 터폭: Number.isFinite(터폭[0]) ? 터폭 : null, 깊이, 모양 }
}

/* ── 칸 무리의 테두리 ─────────────────────────── */
/**
 * 칸(M[j*nx+i] = 1) 무리의 테두리를 칸 모서리 점(i, j)의 닫힌 줄로 — 바깥 줄은 반시계 · 구멍은 시계(칸 왼쪽이 안)
 * 줄마다 tol(칸) 안에서 펴서(더글러스-포이커) 꼭짓점을 줄입니다. 작은 조각(4 칸 미만)은 뺌.
 * @returns {number[][][]} [[[i, j], …], …]
 */
export function 테두리들(M, nx, ny, tol = 1.5) {
  const 안 = (i, j) => i >= 0 && j >= 0 && i < nx && j < ny && M[j * nx + i] === 1
  // 방향 있는 변: 안 칸의 변 중 바깥과 맞닿은 것 — 칸 (i, j) 의 아랫변은 (i, j) → (i+1, j) (안이 왼쪽 = 위)
  const 다음 = new Map()            // 시작점 열쇠 → [끝점 …]
  const 열 = (i, j) => i * 1048576 + j
  const 넣 = (a, b, c, d) => { const k = 열(a, b); const v = 다음.get(k); const e = [c, d]; if (v) v.push(e); else 다음.set(k, [e]) }
  let 변수 = 0
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    if (M[j * nx + i] !== 1) continue
    if (!안(i, j - 1)) { 넣(i, j, i + 1, j); 변수++ }          // 아랫변 →
    if (!안(i + 1, j)) { 넣(i + 1, j, i + 1, j + 1); 변수++ }  // 오른변 ↑
    if (!안(i, j + 1)) { 넣(i + 1, j + 1, i, j + 1); 변수++ }  // 윗변 ←
    if (!안(i - 1, j)) { 넣(i, j + 1, i, j); 변수++ }          // 왼변 ↓
  }
  if (변수 > 400000) return []
  const 줄들 = []
  for (const [k0, v0] of 다음) {
    while (v0.length) {
      const 시 = [Math.floor(k0 / 1048576), k0 % 1048576]
      const 점 = [시]
      let 앞 = 시, cur = v0.pop(), 막 = 0
      while (막++ < 2000000) {
        점.push(cur)
        if (cur[0] === 시[0] && cur[1] === 시[1]) break
        const v = 다음.get(열(cur[0], cur[1]))
        if (!v || !v.length) break
        // 꼭짓점이 겹친 곳(대각으로만 닿은 칸)에서는 왼쪽으로 꺾는 변을 먼저(안을 왼쪽에 두고 돌기)
        let 고 = 0
        if (v.length > 1) {
          const dx = cur[0] - 앞[0], dy = cur[1] - 앞[1]
          let best = -9
          v.forEach((e, n) => { const ex = e[0] - cur[0], ey = e[1] - cur[1]; const 꺾 = dx * ey - dy * ex; if (꺾 > best) { best = 꺾; 고 = n } })
        }
        앞 = cur; cur = v.splice(고, 1)[0]
      }
      점.pop()
      if (점.length < 4) continue
      // 넓이(칸 수) 작은 조각은 뺌
      let A = 0; for (let n = 0; n < 점.length; n++) { const a = 점[n], b = 점[(n + 1) % 점.length]; A += a[0] * b[1] - b[0] * a[1] }
      if (Math.abs(A) / 2 < 4) continue
      줄들.push(펴기(점, tol))
    }
  }
  return 줄들.filter((r) => r.length >= 3)
}
/** 닫힌 줄 펴기(더글러스-포이커) — 가장 먼 두 점으로 둘로 나눠 폄 */
function 펴기(P, tol) {
  const n = P.length
  if (n <= 4) return P
  let a = 0, b = 0, best = -1
  for (let i = 0; i < n; i++) { const d = (P[i][0] - P[0][0]) ** 2 + (P[i][1] - P[0][1]) ** 2; if (d > best) { best = d; b = i } }
  const 한쪽 = (from, to) => { const arr = []; for (let i = from; ; i = (i + 1) % n) { arr.push(P[i]); if (i === to) break } return arr }
  const dp = (arr) => {
    if (arr.length <= 2) return arr
    const [x0, y0] = arr[0], [x1, y1] = arr[arr.length - 1]
    const L = Math.hypot(x1 - x0, y1 - y0) || 1
    let mi = -1, md = -1
    for (let i = 1; i < arr.length - 1; i++) { const d = Math.abs((x1 - x0) * (arr[i][1] - y0) - (y1 - y0) * (arr[i][0] - x0)) / L; if (d > md) { md = d; mi = i } }
    if (md <= tol) return [arr[0], arr[arr.length - 1]]
    const l = dp(arr.slice(0, mi + 1)), r = dp(arr.slice(mi))
    return l.slice(0, -1).concat(r)
  }
  const 앞반 = dp(한쪽(a, b)), 뒷반 = dp(한쪽(b, a))
  return 앞반.slice(0, -1).concat(뒷반.slice(0, -1))
}

/* ── 평균단면법 ─────────────────────────────── */
const 종류들 = ['터파기', '되메우기', '구조물', '성토', '콘크리트', '거푸집', '절토']      /* 🧱 G224 콘크리트(㎡ → ㎥) · 거푸집(m → ㎡) 도 같은 평균단면 · 📋 G234 절토(흙깎기 — 도면 표 값만) */
/**
 * @param 단면들 [{ 측(m), 이름, 면적: {터파기, 되메우기, 구조물, 성토} }]
 * @returns { 줄: [{ 측, 이름, 거리, 면적{}, 부피{}, 누계{} }], 합: {}, 길이 }
 */
export function 평균단면(단면들) {
  const 빠진 = (단면들 || []).filter((s) => s && (!s.면적 || !Number.isFinite(s.면적.터파기))).map((s) => s.이름 + (s.면적 && s.면적.이상 ? ` — ${s.면적.이상}` : ''))
  const a = (단면들 || []).filter((s) => s && s.면적 && Number.isFinite(s.면적.터파기) && Number.isFinite(s.측)).slice().sort((p, q) => p.측 - q.측)
  const 줄 = []
  const 누 = Object.fromEntries(종류들.map((k) => [k, 0]))
  for (let i = 0; i < a.length; i++) {
    const s = a[i], 앞 = a[i - 1]
    const 거리 = 앞 ? s.측 - 앞.측 : 0
    const 부피 = {}
    for (const k of 종류들) { 부피[k] = 앞 ? ((앞.면적[k] || 0) + (s.면적[k] || 0)) / 2 * 거리 : 0; 누[k] += 부피[k] }
    줄.push({ 측: s.측, 이름: s.이름, 거리, 면적: Object.fromEntries(종류들.map((k) => [k, s.면적[k] || 0])), 부피, 누계: { ...누 } })
  }
  return { 줄, 합: { ...누 }, 길이: a.length ? a[a.length - 1].측 - a[0].측 : 0, 빠진 }
}

/**
 * 🛣 G236 튀는 측량점 — 세모로 이어진 이웃 «모두» 보다 15 m 넘게 낮거나 높은 점(소장님 현장 G: 높이 120 m 땅에 −34 ~ −40 m 점 셋 → 3D 땅에 바늘 셋)
 *   이웃 셋 넘게 있을 때만 · 높낮이가 고르게 바뀌는 곳(비탈 · 옹벽)은 이웃 가운데 높고 낮은 것이 섞여 안 걸림
 * @returns Set(뺄 점 번호)
 */
export function 튀는점(점들, 삼, 한 = 15000) {
  const 이웃 = 점들.map(() => new Set())
  for (const [a, b, c] of 삼 || []) { 이웃[a].add(b).add(c); 이웃[b].add(a).add(c); 이웃[c].add(a).add(b) }
  const 뺄 = new Set()
  점들.forEach((p, i) => {
    if (이웃[i].size < 3) return
    let lo = Infinity, hi = -Infinity
    for (const j of 이웃[i]) { lo = Math.min(lo, 점들[j][2]); hi = Math.max(hi, 점들[j][2]) }
    if (p[2] < lo - 한 || p[2] > hi + 한) 뺄.add(i)
  })
  return 뺄
}

/**
 * 🏭 G234 땅 면 가장자리 «가시» 다듬기 — 떨어진 측량점 하나에 닿은 가늘고 긴 세모(가시)를 뗌(소장님 현장 E: 땅 면 테두리가 뾰족뾰족)
 *   가장자리 세모 가운데 «그 세모만 쓰는 꼭짓점» 이 바늘 끝(그 꼭짓점 쪽 두 변이 맞은편 변의 2.5 배 넘음)이면 뗌
 *   (가장 작은 각만 보면 줄 측량의 모서리 세모까지 깎여 들어감 — 시험 ⑮ (자))
 *   세 번까지(가시 둘이 붙은 부채꼴) — 줄 측량(노선 따라 길쭉한 세모)은 꼭짓점을 여러 세모가 같이 써서 안 깎임
 * @param 점들 [[x, y, z]] · @param 삼 [[a, b, c]] → 남은 [[a, b, c]]
 */
export function 가시떼기(점들, 삼, 번 = 3) {
  let 남 = 삼
  for (let k = 0; k < 번; k++) {
    const 수 = new Map(), 변 = new Map()
    const 키 = (a, b) => (a < b ? a + ',' + b : b + ',' + a)
    for (const t of 남) for (let i = 0; i < 3; i++) { 수.set(t[i], (수.get(t[i]) || 0) + 1); const e = 키(t[i], t[(i + 1) % 3]); 변.set(e, (변.get(e) || 0) + 1) }
    const 길 = (a, b) => Math.hypot(점들[a][0] - 점들[b][0], 점들[a][1] - 점들[b][1])
    const 뗄 = (t) => {
      for (let i = 0; i < 3; i++) {
        const v = t[i], a = t[(i + 1) % 3], b = t[(i + 2) % 3]
        if (수.get(v) !== 1) continue
        if (변.get(키(v, a)) !== 1 || 변.get(키(v, b)) !== 1) continue        // v 쪽 두 변이 모두 가장자리
        const la = 길(v, a), lb = 길(v, b), lc = 길(a, b)
        if (!(lc > 0)) return true
        if (Math.min(la, lb) > 2.5 * lc) return true                                  // v 가 바늘 끝(긴 두 변 · 짧은 밑변)
      }
      return false
    }
    const 새 = 남.filter((t) => !뗄(t))
    if (새.length === 남.length) break
    남 = 새
  }
  /* 꼭짓점 하나로만 붙은 작은 조각(변을 같이 쓰는 세모 3개 미만 무리)도 뗌 — 나비넥타이처럼 매달린 세모 */
  const 변세모 = new Map()
  const 키 = (a, b) => (a < b ? a + ',' + b : b + ',' + a)
  남.forEach((t, i) => { for (let k = 0; k < 3; k++) { const e = 키(t[k], t[(k + 1) % 3]); let v = 변세모.get(e); if (!v) { v = []; 변세모.set(e, v) } v.push(i) } })
  const 무 = new Int32Array(남.length).fill(-1), 크기 = []
  for (let i0 = 0; i0 < 남.length; i0++) {
    if (무[i0] >= 0) continue
    const q = [i0]; 무[i0] = 크기.length; let n = 0
    while (q.length) {
      const i = q.pop(); n++
      const t = 남[i]
      for (let k = 0; k < 3; k++) for (const j of 변세모.get(키(t[k], t[(k + 1) % 3]))) if (무[j] < 0) { 무[j] = 크기.length; q.push(j) }
    }
    크기.push(n)
  }
  return 남.filter((t, i) => 크기[무[i]] >= 3)
}

/* ── 삼각망(들로네 · Bowyer–Watson) ─────────────────────────────── */
/**
 * @param 점들 [[x, y, z]]
 * @param 최대변 이보다 긴 변이 있는 삼각형은 버림(점이 없는 빈 곳을 가로지르지 않게)
 * @returns [[a, b, c]] 점 번호
 */
export function 삼각망(점들, 최대변 = Infinity) {
  const n = 점들.length
  if (n < 3) return []
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (const p of 점들) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]) }
  const d = Math.max(x1 - x0, y1 - y0) || 1, mx = (x0 + x1) / 2, my = (y0 + y1) / 2
  const P = 점들.map((p) => [p[0], p[1]])
  P.push([mx - 20 * d, my - d], [mx, my + 20 * d], [mx + 20 * d, my - d])
  /* 삼각형: [a, b, c, 외접원 x, y, r²] */
  const 원 = (a, b, c) => {
    const [ax, ay] = P[a], [bx, by] = P[b], [cx, cy] = P[c]
    const D = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by))
    if (Math.abs(D) < 1e-12) return [a, b, c, 0, 0, Infinity]
    const ux = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / D
    const uy = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / D
    return [a, b, c, ux, uy, (ax - ux) ** 2 + (ay - uy) ** 2]
  }
  let T = [원(n, n + 1, n + 2)]
  /* 점을 x 차례로 넣으면 외접원이 넘어간 삼각형(«끝난 것») 을 따로 빼 두어 빨라집니다 */
  const 차례 = [...Array(n).keys()].sort((a, b) => P[a][0] - P[b][0])
  const 끝난 = []
  for (const k of 차례) {
    const [px, py] = P[k]
    const 나쁜 = [], 남 = []
    for (const t of T) {
      const dx = px - t[3]
      if (dx > 0 && dx * dx > t[5]) { 끝난.push(t); continue }
      if (dx * dx + (py - t[4]) ** 2 < t[5]) 나쁜.push(t); else 남.push(t)
    }
    /* 나쁜 삼각형들의 테두리(한 번만 나온 변) */
    const 변 = new Map()
    for (const t of 나쁜) for (const [a, b] of [[t[0], t[1]], [t[1], t[2]], [t[2], t[0]]]) {
      const key = a < b ? a + ',' + b : b + ',' + a
      변.set(key, 변.has(key) ? null : [a, b])
    }
    for (const e of 변.values()) if (e) 남.push(원(e[0], e[1], k))
    T = 남
  }
  const 모두 = 끝난.concat(T)
  const 최2 = 최대변 * 최대변
  const out = []
  for (const t of 모두) {
    if (t[0] >= n || t[1] >= n || t[2] >= n) continue
    let ok = true
    for (const [a, b] of [[t[0], t[1]], [t[1], t[2]], [t[2], t[0]]]) if ((P[a][0] - P[b][0]) ** 2 + (P[a][1] - P[b][1]) ** 2 > 최2) { ok = false; break }
    if (ok) out.push([t[0], t[1], t[2]])
  }
  return out
}

/**
 * 삼각망 높이 찾기 — 격자 칸에 삼각형을 넣어 두고 (x, y) 의 높이(없으면 NaN)
 */
export function 높이찾개(점들, 삼각, 칸 = 5000) {
  const 격 = new Map()
  삼각.forEach((t, i) => {
    const xs = t.map((k) => 점들[k][0]), ys = t.map((k) => 점들[k][1])
    for (let a = Math.floor(Math.min(...xs) / 칸); a <= Math.floor(Math.max(...xs) / 칸); a++) for (let b = Math.floor(Math.min(...ys) / 칸); b <= Math.floor(Math.max(...ys) / 칸); b++) {
      const k = a + ',' + b; let v = 격.get(k); if (!v) { v = []; 격.set(k, v) } v.push(i)
    }
  })
  return (x, y) => {
    const v = 격.get(Math.floor(x / 칸) + ',' + Math.floor(y / 칸))
    if (!v) return NaN
    for (const i of v) {
      const [A, B, C] = 삼각[i].map((k) => 점들[k])
      const d = (B[1] - C[1]) * (A[0] - C[0]) + (C[0] - B[0]) * (A[1] - C[1])
      if (Math.abs(d) < 1e-12) continue
      const u = ((B[1] - C[1]) * (x - C[0]) + (C[0] - B[0]) * (y - C[1])) / d
      const w = ((C[1] - A[1]) * (x - C[0]) + (A[0] - C[0]) * (y - C[1])) / d
      const z = 1 - u - w
      if (u >= -1e-9 && w >= -1e-9 && z >= -1e-9) return u * A[2] + w * B[2] + z * C[2]
    }
    return NaN
  }
}

/**
 * 측량 땅 면으로 잰 터파기 부피(확인용) — 이웃 단면의 터파기 바닥을 이어 바닥 면을 만들고, 그 위 땅 높이는 측량 땅 면에서
 * @param 단면들 [{ 측(m), 면적: { 바닥: [[o, z]] } }]  (노선 위에 세운 것)
 * @param 노선   { 자리(s) → {x,y,tx,ty} } (mm)
 * @param 땅높이 (x mm, y mm) → z mm | NaN
 * @returns null | { 부피(㎥ · 측량 땅 면), 같은곳도면(㎥ · 같은 칸을 도면 지반선으로), 덮음(0~1) }
 */
export function 땅면부피(단면들, 노선, 땅높이) {
  const a = 단면들.filter((s) => s.면적 && s.면적.바닥 && s.면적.바닥.length >= 2 && s.면적.지반).sort((p, q) => p.측 - q.측)
  if (a.length < 2) return null
  const 사이값 = (arr, o) => {
    if (o < arr[0][0] || o > arr[arr.length - 1][0]) return NaN
    for (let i = 1; i < arr.length; i++) if (o <= arr[i][0]) { const [o0, z0] = arr[i - 1], [o1, z1] = arr[i]; return o1 - o0 > 1e-9 ? z0 + (z1 - z0) * (o - o0) / (o1 - o0) : z1 }
    return NaN
  }
  let V = 0, V도 = 0, 칸 = 0, 덮 = 0
  const ds = 1, dO = 0.1
  for (let k = 0; k + 1 < a.length; k++) {
    const A = a[k], B = a[k + 1], L = B.측 - A.측
    if (!(L > 0) || L > 200) continue
    const lo = Math.max(A.면적.바닥[0][0], B.면적.바닥[0][0]), hi = Math.min(A.면적.바닥[A.면적.바닥.length - 1][0], B.면적.바닥[B.면적.바닥.length - 1][0])
    if (!(hi > lo)) continue
    const 걸 = Math.max(1, Math.round(L / ds))
    for (let m = 0; m < 걸; m++) {
      const f = (m + 0.5) / 걸, s = A.측 + L * f
      const P = 노선.자리(s)
      for (let o = lo + dO / 2; o < hi; o += dO) {
        const zb = (1 - f) * 사이값(A.면적.바닥, o) + f * 사이값(B.면적.바닥, o)
        const zg도 = (1 - f) * 사이값(A.면적.지반, o) + f * 사이값(B.면적.지반, o)
        if (!Number.isFinite(zb) || !Number.isFinite(zg도)) continue
        칸++
        const z = 땅높이(P.x + o * 1000 * P.ty, P.y - o * 1000 * P.tx)
        if (!Number.isFinite(z)) continue
        덮++
        V += Math.max(0, z / 1000 - zb) * (L / 걸) * dO
        V도 += Math.max(0, zg도 - zb) * (L / 걸) * dO
      }
    }
  }
  if (!칸) return null
  return { 부피: V, 같은곳도면: V도, 덮음: 덮 / 칸 }
}
