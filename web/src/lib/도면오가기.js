/**
 * 🔗 결과 ↔ 도면 오가기 (2026-09-28, 소장님 「1번부터 6번까지 한꺼번에」 — 받은 설명서의 «마커↔집계표 양방향 추적» 을 «방식만»)
 *
 * ■ 결과(산출서) 줄을 누르면 → 그 줄이 나온 표의 줄(주자료·실…)에 남은 «찍은 도형»(_찍음) · «읽은 자리»(_자리) 를
 *   도면에 빛내고 그리로 화면을 옮김
 * ■ 도면을 누르면 → 그 도형을 찍었거나 그 자리에서 읽은 줄들 → 결과(산출서)에서 그 줄들을 빛냄
 * ■ 자리 모양: _찍음 = {칸: [{e, v, 점?}]} (도형 번호 e · 두 점 재기면 점:[[x,y],[x,y]]) · _도면 = 찍은 도면 이름
 *             _자리 = [{n: 도면 이름, r: [x0,y0,x1,y1]}] (자동으로 읽은 부재 — 도면 단위)
 * ■ 골조(Golgo.jsx)·마감(Magam.jsx)이 같이 씁니다.
 */

/** 한 줄이 도면의 어디서 왔나 → {ids, 네모들, 점들, 딴도면:[이름], 없음:boolean} (지금 연 도면 것만) */
export function 줄자리(줄, 도면이름) {
  const ids = new Set(), 네모 = [], 점들 = []
  const 딴 = new Set()
  if (!줄) return { ids: [], 네모들: [], 점들: [], 딴도면: [], 없음: true }
  const 찍 = 줄._찍음 || {}
  const 찍도면 = 줄._도면 || ''
  let 찍있음 = false
  for (const 목록 of Object.values(찍)) {
    if (!Array.isArray(목록)) continue
    for (const it of 목록) {
      if (!it || typeof it !== 'object') continue
      찍있음 = true
      if (찍도면 && 도면이름 && 찍도면 !== 도면이름) continue
      if (it.e >= 0) ids.add(it.e)
      if (Array.isArray(it.점)) for (const p of it.점) if (Array.isArray(p)) 점들.push(p)
    }
  }
  if (찍있음 && 찍도면 && 도면이름 && 찍도면 !== 도면이름) 딴.add(찍도면)
  for (const z of 줄._자리 || []) {
    if (!z || !Array.isArray(z.r)) continue
    if (z.n && 도면이름 && z.n !== 도면이름) { 딴.add(z.n); continue }
    네모.push(z.r)
  }
  return { ids: [...ids], 네모들: 네모, 점들, 딴도면: [...딴], 없음: !ids.size && !네모.length && !점들.length }
}

/** 도형들의 테두리 상자(도면 단위) — 없으면 null */
export function 도형상자(모델, ids) {
  if (!모델 || !ids || !ids.length) return null
  const 찾을 = new Set(ids)
  const { Q, P, T } = 모델
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (let q = 0; q < Q.e.length; q++) {
    if (!찾을.has(Q.e[q])) continue
    const s = Q.p0[q], n = Q.pn[q]
    for (let j = 0; j < n; j++) {
      const x = P[(s + j) * 2], y = P[(s + j) * 2 + 1]
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y
    }
  }
  for (let i = 0; i < T.s.length; i++) {
    if (!찾을.has(T.e[i])) continue
    const x = T.x[i], y = T.y[i], h = T.h[i] || 0, w = String(T.s[i] || '').length * h * 0.9
    if (x < x0) x0 = x; if (x + w > x1) x1 = x + w; if (y < y0) y0 = y; if (y + h > y1) y1 = y + h
  }
  return Number.isFinite(x0) ? [x0, y0, x1, y1] : null
}

/** 여러 상자·점을 품는 상자 (조금 넓혀서) */
export function 모은상자(상자들, 점들 = []) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (const r of 상자들) { if (!r) continue; x0 = Math.min(x0, r[0]); y0 = Math.min(y0, r[1]); x1 = Math.max(x1, r[2]); y1 = Math.max(y1, r[3]) }
  for (const p of 점들) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]) }
  if (!Number.isFinite(x0)) return null
  const w = Math.max(x1 - x0, 1e-6), h = Math.max(y1 - y0, 1e-6)
  const m = Math.max(w, h) * 0.25 + 1e-6
  return [x0 - m, y0 - m, x1 + m, y1 + m]
}

/**
 * 도면을 누른 곳 → 그 도형을 찍었거나 그 자리에서 읽은 줄들
 * @param 표들 [{열쇠, 줄}] — 열쇠는 결과 줄의 곳과 맞출 글자(예: '0|보|3')
 * @param e 누른 도형(-1 이면 없음) · x,y 누른 자리(도면 단위) · tol 누름 너그러움(도면 단위)
 */
export function 누른줄들(표들, e, x, y, 도면이름, tol = 0) {
  const out = []
  for (const { 열쇠, 줄 } of 표들) {
    if (!줄) continue
    let 맞음 = false
    const 찍도면 = 줄._도면 || ''
    if (e >= 0 && (!찍도면 || !도면이름 || 찍도면 === 도면이름)) {
      for (const 목록 of Object.values(줄._찍음 || {})) {
        if (Array.isArray(목록) && 목록.some((it) => it && it.e === e)) { 맞음 = true; break }
      }
    }
    if (!맞음) {
      for (const z of 줄._자리 || []) {
        if (!z || !Array.isArray(z.r)) continue
        if (z.n && 도면이름 && z.n !== 도면이름) continue
        if (x >= z.r[0] - tol && x <= z.r[2] + tol && y >= z.r[1] - tol && y <= z.r[3] + tol) { 맞음 = true; break }
      }
    }
    if (맞음) out.push(열쇠)
  }
  return out
}
