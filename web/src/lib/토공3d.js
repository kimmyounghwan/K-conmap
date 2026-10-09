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
  for (const [ly, arr] of 조각) {
    const a = (arr || []).filter((s) => Math.hypot(s[2] - s[0], s[3] - s[1]) > 1e-9)
    if (!a.length) continue
    if (땅인가(ly)) { for (const s of a) 땅.push(s); continue }
    if (안씀층.test(ly)) continue
    for (const s of a) 딴.push(s)
    층별.set(ly, a)
  }
  if (!땅.length) return null
  const kz = 높(1) - 높(0)                 // 도면 y 1 → m
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
  const 언제나 = () => true
  for (const [, arr] of 층별) {
    if (arr.length < 3) continue
    const 층벽 = new Uint8Array(N)
    for (const s of arr) 그리기(층벽, s, 1)
    const 닿 = 붓기(언제나, 층벽)
    let 있 = 0
    for (let k = 0; k < N; k++) if (!닿[k] && !층벽[k]) { 있 = 1; break }
    if (!있) continue
    for (let k = 0; k < N; k++) {
      if (닿[k]) continue
      if (!층벽[k]) { S[k] = 1; continue }
      /* 닫힌 모양의 테두리 선 칸도 구조물로(안쪽 칸과 붙은 것만) */
      const i = k % nx
      if ((i > 0 && !닿[k - 1] && !층벽[k - 1]) || (i < nx - 1 && !닿[k + 1] && !층벽[k + 1]) || (k >= nx && !닿[k - nx] && !층벽[k - nx]) || (k < N - nx && !닿[k + nx] && !층벽[k + nx])) S[k] = 1
    }
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
    const 콘인가 = (k) => S[k] === 1 && 남길.has(표2[k])
    const 세로변 = ch * kz, 가로변 = cw * 배
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const k = j * nx + i
      if (!콘인가(k)) continue
      콘칸++
      if (!벽[k]) 콘속[k] = 1
      const o = (ox + (i + 0.5) * cw - cx) * 배, z = 높(oy + (j + 0.5) * ch)
      if (o < 구조폭[0]) 구조폭[0] = o
      if (o > 구조폭[1]) 구조폭[1] = o
      if (z < 구조높[0]) 구조높[0] = z
      if (z > 구조높[1]) 구조높[1] = z
      if (i === 0 || !콘인가(k - 1)) 거푸집 += 세로변
      if (i === nx - 1 || !콘인가(k + 1)) 거푸집 += 세로변
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
  /* 바닥 · 지반 모양(0.1 m 마다) — 땅 면 부피 확인에 씀 */
  const 바닥 = [], 지반 = []
  const 걸음 = Math.max(1, Math.round(0.1 / (cw * 배)))
  for (let i = 0; i < nx; i += 걸음) {
    if (!Number.isFinite(g[i])) continue
    const o = (ox + (i + 0.5) * cw - cx) * 배
    지반.push([o, 높(g[i])])
    for (let j = 0; j < ny; j++) if (E[j * nx + i]) { 바닥.push([o, 높(oy + j * ch)]); break }
  }
  return { 터파기: 터, 구조물: 구, 되메우기: Math.max(0, 터 - 구), 성토: 성, 바닥, 지반, 칸: Math.min(cw * 배, ch * kz),
    콘크리트, 거푸집, 구조폭: 콘칸 ? 구조폭 : null, 구조높: 콘칸 ? 구조높 : null, 터폭: Number.isFinite(터폭[0]) ? 터폭 : null, 깊이 }
}

/* ── 평균단면법 ─────────────────────────────── */
const 종류들 = ['터파기', '되메우기', '구조물', '성토', '콘크리트', '거푸집']      /* 🧱 G224 콘크리트(㎡ → ㎥) · 거푸집(m → ㎡) 도 같은 평균단면 */
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
