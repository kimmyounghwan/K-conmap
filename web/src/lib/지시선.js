/**
 * 🧭 G248 지시선 따라가기 — 글자(철근 «HD19@200» · 높이 «-250» …)에서 나온 꺾인 선을 끝까지 따라가 «가리키는 점» 을 찾음
 *   소장님 「다 있는데, 클로드가 못 읽는 거라고」 — 단면도의 철근 글자는 지시선 끝이 가리키는 철근(슬래브 위 · 아래 줄)의 것.
 *   글자 자리만으로는 어느 부재 것인지 모름(슬래브 철근 글자가 보 위에 적혀 있기도) → 선을 따라가야 함.
 *
 * ■ 지시선 = 글자 밑을 지나는(밑줄처럼 그은) 선 · 또는 글자 끝에 닿은 선 → 같은 층의 이어진 선(끝점이 맞닿은 것)을 양쪽으로 다 이어
 *   글자에서 더 먼 끝이 가리키는 점. 부재 선(다른 층)으로는 안 넘어감.
 * ■ D = 골조자동 준비(…) 결과(선분 sx0 · sy0 · sx1 · sy1 · sly(층) · se(도형) · 찾기(상자)) — 주석 층(TEXT · DIM …)의 선은 D 에 없어
 *   지시선이 그 층에 있으면 못 따라감(null) — 그때는 쓰는 쪽에서 글자 자리로만 봄.
 */

/** 글자 g 의 지시선 끝점 {x, y, 길이, 꺾임, 층} | null */
export function 지시선끝(D, g, o = {}) {
  const h = g.h || 100
  const tol = Math.max(0.1 * h, 3)
  const c = Math.cos(g.a || 0), s = Math.sin(g.a || 0)
  /* 글자 왼쪽 아래 기준점(g.x0 · 글 넣은 점) — 없으면 가운데에서 거꾸로 */
  const 왼 = g.x0 != null ? g.x0 : g.x - (g.w / 2) * c + (h / 2) * s
  const 왼y = g.x0 != null ? g.y - (g.w / 2) * s - (h / 2) * c : g.y - (g.w / 2) * s - (h / 2) * c
  const 글좌표 = (x, y) => { const dx = x - 왼, dy = y - 왼y; return [dx * c + dy * s, -dx * s + dy * c] }   // u: 글자 방향 · v: 글자 위쪽 +
  /* 글자 밑 띠(아래 0.9h ~ 위 0.3h · 글자 폭 안) 를 지나거나 글자 양 끝(h 안)에 끝이 닿은 선 */
  const 닿음 = (k) => {
    for (let i = 0; i <= 10; i++) {
      const t = i / 10
      const [u, v] = 글좌표(D.sx0[k] + (D.sx1[k] - D.sx0[k]) * t, D.sy0[k] + (D.sy1[k] - D.sy0[k]) * t)
      if (u >= -0.3 * h && u <= g.w + 0.3 * h && v >= -0.9 * h && v <= 0.3 * h) return true
    }
    for (const [x, y] of [[D.sx0[k], D.sy0[k]], [D.sx1[k], D.sy1[k]]]) {
      const [u, v] = 글좌표(x, y)
      const 여 = o.끝여유 || h            // 🧭 G254 지시선만 모은 판에서는 글 끝과 지시선 끝 사이가 더 떨어져도(한글 폭 짐작이 좁음)
      if (((u >= -여 && u <= 0) || (u >= g.w && u <= g.w + 여)) && v >= -0.9 * h && v <= 1.2 * h) return true
    }
    return false
  }
  const R = g.w + 3 * h
  let k0 = -1, 긴 = 0
  for (const k of D.찾기(g.x - R, g.y - R, g.x + R, g.y + R)) {
    const L = Math.hypot(D.sx1[k] - D.sx0[k], D.sy1[k] - D.sy0[k])
    if (L > (o.최대길이 || 60 * h) || !닿음(k)) continue
    if (o.층 && !o.층(D.sly[k])) continue
    if (L > 긴) { 긴 = L; k0 = k }
  }
  if (k0 < 0) return null
  const 층 = D.sly[k0]
  /* 양쪽으로 잇기 — 같은 층 · 끝점이 맞닿은 선 */
  const 쓴 = new Set([k0])
  const 잇기 = (x, y) => {
    let 길이 = 0, 꺾임 = 0
    for (let n = 0; n < (o.최대 || 12); n++) {
      let 다음 = null
      for (const k of D.찾기(x - tol, y - tol, x + tol, y + tol)) {
        if (쓴.has(k) || D.sly[k] !== 층) continue
        const m0 = Math.hypot(D.sx0[k] - x, D.sy0[k] - y) <= tol, m1 = Math.hypot(D.sx1[k] - x, D.sy1[k] - y) <= tol
        if (!m0 && !m1) continue
        const 같은 = D.se && D.se[k] === D.se[k0]
        if (!다음 || (같은 && !다음.같은)) 다음 = { k, 점: m0 ? [D.sx1[k], D.sy1[k]] : [D.sx0[k], D.sy0[k]], 같은 }
      }
      if (!다음) break
      쓴.add(다음.k)
      길이 += Math.hypot(다음.점[0] - x, 다음.점[1] - y)
      ;[x, y] = 다음.점
      꺾임++
    }
    return { x, y, 길이, 꺾임 }
  }
  const A = 잇기(D.sx0[k0], D.sy0[k0]), B = 잇기(D.sx1[k0], D.sy1[k0])
  const dA = Math.hypot(A.x - g.x, A.y - g.y), dB = Math.hypot(B.x - g.x, B.y - g.y)
  const 끝 = dA >= dB ? A : B
  /* 끝이 글자 바로 곁이면(글자 밑줄만 있음) 가리키는 곳이 없음 */
  if (Math.max(dA, dB) < g.w / 2 + 1.5 * h) return null
  return { x: 끝.x, y: 끝.y, 길이: A.길이 + B.길이 + 긴, 꺾임: A.꺾임 + B.꺾임, 층 }
}
