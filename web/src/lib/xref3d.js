/**
 * 🔗 xref 끼움 관계 (G212 · 2026-10-09) — 올린 도면들이 서로를 «어디에 · 몇 배로 · 몇 도 돌려» 끼웠는지로 정확한 자리를 압니다.
 *
 * ■ 왜: 토목 도면 대부분은 측량 · 계획 그림을 xref 로 끼워 그립니다(xr-측량현황 · X-Ref 현황 · # xref_… _Base …).
 *   도면 파일에는 그 그림이 없지만(LibreDWG 는 xref 를 안 읽음) «끼운 자리(INSERT)» 는 남아 있습니다.
 *   그 xref 파일도 같이 올리면, 글자나 모양을 짐작할 것 없이 캐드에서 보던 그대로 겹칠 수 있습니다.
 *   ⚠️ 시험으로 확인: 현장 C 오수계획평면도는 측량 xref 를 (13.9 km, 5.4 km) 옮겨 끼운 도면 — 좌표 크기만 보고 «같은 자리» 로
 *      두면 14 km 어긋납니다. 끼운 자리가 있으면 그것이 먼저입니다.
 * ■ 관계 셋:
 *   ① 도면 F 가 xref N 을 한 자리에 끼움 → F = T · N
 *   ② 올린 파일 이름이 N 과 같음 → 그 파일 = N
 *   ③ 한 도면에서 xref 둘을 «똑같은 자리 · 배 · 돌림» 으로 끼움 → 둘은 같은 좌표(한 현장: _Base 와 _계획)
 *   같은 xref 를 여러 자리에 끼운 것(종평면도 그림마다 돌려 끼움)은 어느 그림 것인지 몰라 쓰지 않습니다.
 *   돌림 + 같은 배만(거울 · 가로세로 배가 다른 것은 안 씀).
 */

/** 점이 꼴(다각형) 안인가 */
export function 꼴안(꼴, x, y) {
  let 안 = false
  for (let i = 0, j = 꼴.length - 1; i < 꼴.length; j = i++) {
    const [xi, yi] = 꼴[i], [xj, yj] = 꼴[j]
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) 안 = !안
  }
  return 안
}

/** 이름 다듬기 — 경로 · 확장자 떼고 띄어쓰기 · 대소문자 무시. 깨진 글자(인코딩)가 있으면 '' */
export const 도면이름 = (s) => {
  const t = String(s || '').split(/[\\/]/).pop().replace(/\.(dwg|dxf)$/i, '').replace(/\s+/g, '').toLowerCase()
  return /�/.test(t) ? '' : t
}

/** 3×4 행렬 → 닮음꼴(돌림 + 같은 배 + 옮김) · 아니면 null */
export function 닮음(M) {
  const a = M[0], c = M[1], b = M[4], d = M[5]
  const s = Math.hypot(a, b)
  if (!(s > 0) || !Number.isFinite(M[3] + M[7])) return null
  if (Math.abs(a - d) > 1e-6 * s || Math.abs(b + c) > 1e-6 * s) return null     // 가로세로 배가 다르거나 거울
  return { a, b, tx: M[3], ty: M[7] }
}
/** P∘Q (Q 먼저) */
export const 잇기 = (P, Q) => ({ a: P.a * Q.a - P.b * Q.b, b: P.a * Q.b + P.b * Q.a, tx: P.a * Q.tx - P.b * Q.ty + P.tx, ty: P.b * Q.tx + P.a * Q.ty + P.ty })
export const 뒤집기 = (P) => { const k = P.a * P.a + P.b * P.b, a = P.a / k, b = -P.b / k; return { a, b, tx: -(a * P.tx - b * P.ty), ty: -(b * P.tx + a * P.ty) } }
const 같음 = (P, Q) => {
  const s = Math.hypot(P.a, P.b)
  return Math.abs(P.a - Q.a) < 1e-6 * s && Math.abs(P.b - Q.b) < 1e-6 * s &&
    Math.abs(P.tx - Q.tx) < 1e-7 * Math.max(1, Math.abs(P.tx)) + 0.01 && Math.abs(P.ty - Q.ty) < 1e-7 * Math.max(1, Math.abs(P.ty)) + 0.01
}
const 하나 = { a: 1, b: 0, tx: 0, ty: 0 }
export const 틀이름 = /도곽|도각|frame|border|title|sheet|표제|타이틀|틀$|keymap|key_?map|위치도|안내도|범례|legend|logo|로고/i

/**
 * @param {Array<{ 이름:string, xrefs?:Array<{이름:string, M:number[], 겹?:number}>, 배:number }>} 파일들  배 = 그 도면 단위 → mm
 * @returns {(i:number, j:number) => null | { T:{a,b,tx,ty}, 길:string[] }}  j 도면 좌표(mm) → i 도면 좌표(mm)
 */
export function 끼움관계(파일들) {
  /* 마디 = 다듬은 이름(올린 파일 · xref 이 같은 이름이면 한 마디). 줄 = (u, v, T): u 좌표 = T · v 좌표(둘 다 그 도면 원래 단위) */
  const 줄 = new Map()
  const 잇 = (u, v, T, 근거) => {
    if (!u || !v || u === v) return
    if (!줄.has(u)) 줄.set(u, [])
    if (!줄.has(v)) 줄.set(v, [])
    줄.get(u).push({ v, T, 근거 }); 줄.get(v).push({ v: u, T: 뒤집기(T), 근거 })
  }
  const 마디 = 파일들.map((f) => 도면이름(f.이름))
  for (let i = 0; i < 파일들.length; i++) {
    const h = 마디[i]
    if (!h) continue
    /* xref 이름별 끼운 자리들(겹쳐 끼운 배열 INSERT 는 뺌) */
    const 끼 = new Map()
    for (const x of 파일들[i].xrefs || []) {
      const n = 도면이름(x.이름) || 도면이름(x.경로)
      if (!n || n === h || (x.겹 || 1) > 1) continue
      /* 도곽 · 표제 · 범례 · 위치도(keymap) xref 는 종이마다 다른 자리에 끼우므로 «같은 좌표» 의 근거가 못 됨 */
      if (틀이름.test(n)) continue
      const T = 닮음(x.M)
      if (!T) { 끼.set(n, null); continue }
      if (!끼.has(n)) 끼.set(n, [])
      const L = 끼.get(n)
      if (L && !L.some((q) => 같음(q, T))) L.push(T)
    }
    /* ① 한 자리에만 끼운 것 */
    for (const [n, L] of 끼) if (L && L.length === 1) 잇(h, n, L[0], `${파일들[i].이름} ← ${n}`)
    /* ③ 같은 자리로 같이 끼운 xref 둘 = 같은 좌표 */
    const 이름들 = [...끼.keys()]
    for (let p = 0; p < 이름들.length; p++) for (let q = p + 1; q < 이름들.length; q++) {
      const A = 끼.get(이름들[p]), B = 끼.get(이름들[q])
      if (A && B && A.some((x) => B.some((y) => 같음(x, y)))) 잇(이름들[p], 이름들[q], 하나, `${파일들[i].이름} 에 같은 자리로 끼움`)
    }
  }
  /* 마디 사이 원래 단위 관계 — 처음 찾은 길(넓이 우선) */
  const 길찾기 = (from, to) => {
    if (!from || !to) return null
    if (from === to) return { T: 하나, 길: [] }
    const 본 = new Map([[from, { T: 하나, 길: [] }]])
    const 줄서기 = [from]
    while (줄서기.length) {
      const u = 줄서기.shift()
      const cu = 본.get(u)
      for (const e of 줄.get(u) || []) {
        if (본.has(e.v)) continue
        /* from 좌표 = cu.T · u 좌표 , u 좌표 = e.T · v 좌표 */
        const c = { T: 잇기(cu.T, e.T), 길: [...cu.길, e.근거] }
        if (e.v === to) return c
        본.set(e.v, c); 줄서기.push(e.v)
      }
    }
    return null
  }
  const 기억 = new Map()
  /**
   * 🔗 자른(XCLIP) 끼움 — 같은 xref 를 그림마다 돌려 끼운 도면(종평면도). 자른 테두리 안의 선은 그 끼움 자리로.
   * @returns {Array<{ 상자:number[], 꼴:number[][]|null, T:{a,b,tx,ty}, 이름:string }>}  상자 · 꼴(자른 테두리) = i 도면 좌표(mm) · T = i(mm) → j(mm)
   */
  const 구역 = (i, j) => {
    const L = []
    const bi = 파일들[i].배 || 1, bj = 파일들[j].배 || 1
    for (const x of 파일들[i].xrefs || []) {
      if (!x.자르기 || (x.겹 || 1) > 1) continue
      const n = 도면이름(x.이름) || 도면이름(x.경로)
      if (!n || 틀이름.test(n)) continue
      const T = 닮음(x.M)
      if (!T) continue
      const P = 길찾기(마디[j], n)
      if (!P) continue
      const R = 잇기(P.T, 뒤집기(T))          // j(raw) ← i(raw)
      L.push({ 상자: x.자르기.map((v) => v * bi), 꼴: x.자른꼴 ? x.자른꼴.map(([u, v]) => [u * bi, v * bi]) : null, T: { a: R.a * bj / bi, b: R.b * bj / bi, tx: R.tx * bj, ty: R.ty * bj }, 이름: n })
    }
    return L
  }
  const 관계 = (i, j) => {
    const k = i + ',' + j
    if (기억.has(k)) return 기억.get(k)
    const r = 길찾기(마디[i], 마디[j])
    let out = null
    if (r) {
      const bi = 파일들[i].배 || 1, bj = 파일들[j].배 || 1
      /* i(mm) = bi · T · (j(mm) / bj) */
      out = { T: { a: r.T.a * bi / bj, b: r.T.b * bi / bj, tx: r.T.tx * bi, ty: r.T.ty * bi }, 길: r.길 }
    }
    기억.set(k, out)
    return out
  }
  관계.구역 = 구역
  return 관계
}
