/* 🔗 골조 도면 xref 끼워 읽기 (2026-10-10 G237 · 겹치는 순서 0 «포장 펴기» — xref 끼워 읽기)
   소장님 현장 B: 구조평면도(S-101)에는 층 제목 · 부재 기호만 있고, 보 · 벽 · 슬래브 선과 통심선은 xref(XREF_S-PLAN)에 있었습니다.
   그래서 «기호 곁 보 · 벽 선 못 찾음» · «슬래브 둘레를 못 찾음» 이 났고, XREF_S-PLAN 은 혼자 읽혀 층 제목 없이 한 층에 몰렸습니다.
   → 그 xref 파일도 같이 올렸으면, 캐드에서 보던 대로 «끼운 자리 · 자른 테두리(XCLIP) 안» 만 그 도면에 넣어 한 장으로 읽습니다.
     다른 도면에 끼워 쓴 xref 파일은 골조를 따로 읽지 않습니다(같은 부재 두 번 — 겹치는 순서 8 «한 번만»).
   모델 꼴은 골조도면.js 도면읽기 그대로(E · Q · P · T · layers · 가운데 뺀 좌표 ox · oy). */

const 줄기 = (s) => String(s || '').replace(/^.*[\\/]/, '').replace(/\.(dxf|dwg)$/i, '').trim().toUpperCase()

function 안(꼴, x, y) {
  let 속 = false
  for (let i = 0, j = 꼴.length - 1; i < 꼴.length; j = i++) {
    const [xi, yi] = 꼴[i], [xj, yj] = 꼴[j]
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) 속 = !속
  }
  return 속
}

/** 늘어나는 배열(같은 꼴 typed array) */
function 이어(a, n) { const C = a.constructor; const r = new C(a.length + n); r.set(a); return r }

/**
 * @param 들 [{모델, 이름, k}] — 골조도면 도면읽기 결과들
 * @returns { 들: 같은 차례의 새 목록(끼운 도면은 합친 모델 · 끼워 쓴 xref 파일은 빈 모델), 끼움: [{도면, xref, 수}] }
 */
export function 참조끼우기(들) {
  const 이름표 = new Map(들.map((d, i) => [줄기(d.이름), i]))
  const 씀 = new Set()
  const 끼움 = []
  const 새 = 들.map((d) => d)
  들.forEach((d, i) => {
    const M = d.모델
    const 참 = (M.참조 || []).map((r) => ({ r, j: 이름표.has(줄기(r.이름)) ? 이름표.get(줄기(r.이름)) : 이름표.get(줄기(r.길)) }))
      .filter((q) => q.j != null && q.j !== i && 들[q.j].모델 && 들[q.j].모델.E)
    if (!참.length) return
    /* 자른 테두리(XCLIP)가 이 도면 그림 범위 밖이면(배치 공간 뷰포트용으로 옮겨 둔 것) 그 끼움은 안 씀 —
       대신 «같은 글자»(부재 기호)가 겹치는 옮김을 찾아 그 둘레만 끼움(겹치는 순서 3 ③ 같은 글자) */
    const 범 = M.box, 여 = 0.05 * Math.max(범[2] - 범[0], 범[3] - 범[1])
    const 범안 = (r) => !r.경계 || r.경계.some(([x, y]) => x >= 범[0] - 여 && x <= 범[2] + 여 && y >= 범[1] - 여 && y <= 범[3] + 여)
    const 쓸 = 참.filter((q) => 범안(q.r))
    const 글끼움 = []
    const 덮은 = 쓸.map((q) => q.r.경계).filter(Boolean)
    for (const j of new Set(참.map((q) => q.j))) for (const z of 글자로끼움(M, 들[j].모델, 덮은)) 글끼움.push({ r: z, N: 들[j].모델, j, 접두: 줄기(들[j].이름) })
    const r1 = 합치기(M, [...쓸.map((q) => ({ r: q.r, N: 들[q.j].모델, 접두: q.r.이름 })), ...글끼움])
    if (!r1) return
    새[i] = { ...d, 모델: r1.모델, 끼운: [...new Set(참.map((q) => 들[q.j].이름))] }
    for (const q of 참) 씀.add(q.j)
    for (const q of 쓸) 끼움.push({ 도면: d.이름, xref: 들[q.j].이름, 수: r1.수.get(q.r) || 0, 방법: '자른 테두리' })
    for (const q of 글끼움) 끼움.push({ 도면: d.이름, xref: 들[q.j].이름, 수: r1.수.get(q.r) || 0, 방법: '같은 글자 ' + q.r.글자로 })
  })
  /* 끼워 쓴 xref 파일 — 따로 골조를 읽지 않게 빈 모델(자기도 다른 것을 끼운 도면이면 그대로) */
  for (const j of 씀) {
    if (새[j] !== 들[j]) continue
    새[j] = { ...들[j], 모델: 빈모델(들[j].모델), xref로씀: true }
  }
  return { 들: 새, 끼움 }
}

/* 부재 기호 꼴 — C1 · 2G1 · B0 · WG1 · RW1 · DS1 · SS1 · MF1 */
const 기호꼴 = /^[0-9]?[A-Z]{1,3}\d{1,2}[A-Z]?$/
/**
 * 같은 글자로 끼울 자리 — M(도면)의 부재 기호 글자 ↔ N(xref)의 같은 기호 글자 · 옮김(50 mm 칸) 투표
 * 한 옮김에 기호 8개 넘게 모이면 그 기호들 둘레(+3 m)를 «자른 테두리» 로 하는 끼움 하나
 */
function 글자로끼움(M, N, 덮은 = []) {
  const 모 = (Md, 중) => { const a = []; for (let i = 0; i < Md.T.s.length; i++) { const u = String(Md.T.s[i] || '').trim(); if (기호꼴.test(u)) a.push({ u, x: Md.T.x[i] + (중 ? Md.ox : 0), y: Md.T.y[i] + (중 ? Md.oy : 0) }) } return a }
  /* A: M 가운데 좌표(이미 자른 테두리로 끼운 곳의 글자는 뺌) · B: N 참 좌표 */
  const A = 모(M, false).filter((a) => !덮은.some((꼴) => 안(꼴, a.x, a.y))), B = 모(N, true)
  if (A.length < 8 || B.length < 8) return []
  const 표 = new Map()
  const B글 = new Map(); for (const b of B) { const a = B글.get(b.u); if (a) a.push(b); else B글.set(b.u, [b]) }
  for (let i = 0; i < A.length; i++) for (const b of B글.get(A[i].u) || []) {
    const k = Math.round((A[i].x - b.x) / 50) + ',' + Math.round((A[i].y - b.y) / 50)
    let v = 표.get(k); if (!v) { v = new Set(); 표.set(k, v) } v.add(i)
  }
  const 봉 = [...표.entries()].filter(([, v]) => v.size >= 8).sort((p, q) => q[1].size - p[1].size)
  const 쓴 = new Set(), out = []
  for (const [k, v] of 봉) {
    /* 🧭 G245 이미 끼운 자리(앞 끼움의 테두리) 안 글자는 다시 안 씀 — 전엔 층마다 같은 기둥 기호(C1 · C2)가 되풀이되는 xref(현장 B XREF_S-PLAN)를
       한 판에 여러 층 겹쳐 끼워(2층 판에 기둥 C2 가 36개 · 실제 8개) 다른 층 선 · 글자가 섞였음 */
    const 새 = [...v].filter((i) => !쓴.has(i) && !out.some((o) => 안(o.경계, A[i].x, A[i].y)))
    if (새.length < 8) continue
    for (const i of 새) 쓴.add(i)
    const [dx, dy] = k.split(',').map((t) => +t * 50)
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
    for (const i of 새) { const a = A[i]; if (a.x < x0) x0 = a.x; if (a.x > x1) x1 = a.x; if (a.y < y0) y0 = a.y; if (a.y > y1) y1 = a.y }
    const m = 3000
    out.push({ 이름: '(같은 글자)', X: [1, 0, 0, dx, 0, 1, 0, dy, 0, 0, 1, 0], 배율: 1, 경계: [[x0 - m, y0 - m], [x1 + m, y0 - m], [x1 + m, y1 + m], [x0 - m, y1 + m]], 글자로: 새.length })
    if (out.length >= 20) break
  }
  return out
}

function 빈모델(M) {
  const 비 = (a) => new a.constructor(0)
  return {
    ...M,
    E: Object.fromEntries(Object.entries(M.E).map(([k, a]) => [k, 비(a)])),
    Q: Object.fromEntries(Object.entries(M.Q).map(([k, a]) => [k, 비(a)])),
    P: 비(M.P),
    T: { s: [], x: 비(M.T.x), y: 비(M.T.y), h: 비(M.T.h), a: 비(M.T.a), e: 비(M.T.e) },
    I: [], 참조: [], 무늬: Array.isArray(M.무늬) ? [] : M.무늬,
  }
}

function 합치기(M, 넣을) {
  const 층 = M.layers.map((L) => ({ ...L }))
  const 층번 = new Map(층.map((L, i) => [String(L.name).toUpperCase(), i]))
  const 층찾기 = (L) => { const u = String(L.name).toUpperCase(); if (!층번.has(u)) { 층번.set(u, 층.length); 층.push({ ...L }) } return 층번.get(u) }
  /* 먼저 셈 — 들어갈 도형 · 조각 · 점 · 글자 */
  const 판 = []
  let nE = 0, nQ = 0, nP = 0, nT = 0
  const 수 = new Map()
  for (const { r, N, 접두 } of 넣을) {
    const X = r.X, 배 = r.배율 || 1
    /* 🧭 G245 xref 레이어 켜짐/꺼짐은 «끼운 도면» 의 것(VISRETAIN — 호스트 레이어 표 «XREF이름|레이어»)을 따름 · 꺼진 것은 안 끼움.
       전엔 xref 파일 자체의 켜짐을 써서, 호스트에서 끈 xref 레이어 도형이 들어올 수 있었음 */
    const 층표 = N.layers.map((L) => {
      const 호 = 접두 ? 층번.get((String(접두).trim() + '|' + L.name).toUpperCase()) : undefined
      return 호 !== undefined ? { i: 호, 숨김: !!층[호].hide } : { i: null, 숨김: !!L.hide }
    })
    const 옮 = (x, y) => { const u = x + N.ox, v = y + N.oy; return [X[0] * u + X[1] * v + X[3], X[4] * u + X[5] * v + X[7]] }
    const 꼴 = r.경계 && r.경계.length >= 3 ? r.경계 : null
    let bx0 = Infinity, by0 = Infinity, bx1 = -Infinity, by1 = -Infinity
    if (꼴) for (const [x, y] of 꼴) { if (x < bx0) bx0 = x; if (x > bx1) bx1 = x; if (y < by0) by0 = y; if (y > by1) by1 = y }
    const 속 = (x, y) => !꼴 || (x >= bx0 && x <= bx1 && y >= by0 && y <= by1 && 안(꼴, x, y))
    const e새 = new Map()           // N 도형 번 → 새 번(나중에 더할 자리)
    const 조각들 = []
    const Q = N.Q, P = N.P
    for (let q = 0; q < Q.e.length; q++) {
      const s = Q.p0[q], n = Q.pn[q]
      if (n < 2) continue
      if ((층표[N.E.ly[Q.e[q]]] || {}).숨김) continue
      let sx = 0, sy = 0
      const 점 = new Float64Array(n * 2)
      for (let k = 0; k < n; k++) { const [x, y] = 옮(P[(s + k) * 2], P[(s + k) * 2 + 1]); 점[k * 2] = x; 점[k * 2 + 1] = y; sx += x; sy += y }
      if (!속(sx / n, sy / n)) continue
      const e = Q.e[q]
      if (!e새.has(e)) e새.set(e, e새.size)
      조각들.push({ e, 점 })
      nQ++; nP += n
    }
    const 글들 = []
    for (let j = 0; j < N.T.s.length; j++) {
      if ((층표[N.E.ly[N.T.e[j]]] || {}).숨김) continue
      const [x, y] = 옮(N.T.x[j], N.T.y[j])
      if (!속(x, y)) continue
      const e = N.T.e[j]
      if (!e새.has(e)) e새.set(e, e새.size)
      글들.push({ j, x, y })
      nT++
    }
    if (!e새.size) continue
    const 돌 = Math.atan2(X[4], X[0])
    판.push({ r, N, 배, 돌, e새, 조각들, 글들, 층표 })
    nE += e새.size
    수.set(r, e새.size)
  }
  if (!nE) return null
  const E0 = M.E, eBase = E0.t.length
  const E = Object.fromEntries(Object.entries(E0).map(([k, a]) => [k, 이어(a, nE)]))
  const Q = { e: 이어(M.Q.e, nQ), p0: 이어(M.Q.p0, nQ), pn: 이어(M.Q.pn, nQ) }
  const P = 이어(M.P, nP * 2)
  const T = { s: M.T.s.slice(), x: 이어(M.T.x, nT), y: 이어(M.T.y, nT), h: 이어(M.T.h, nT), a: 이어(M.T.a, nT), e: 이어(M.T.e, nT) }
  let e0 = eBase, q0 = M.Q.e.length, p0 = M.P.length / 2, t0 = M.T.s.length
  /* 🧭 G253 해치 무늬 이름도 끼움(현장 B «기초 두께» 범례 무늬 ↔ xref 평면의 구역 해치 — 예전엔 끼운 해치의 무늬가 비어 두꺼운 구역을 못 찾았음) */
  const 무늬 = M.무늬 instanceof Map ? new Map(M.무늬) : new Map()
  for (const { N, 배, 돌, e새, 조각들, 글들, 층표 } of 판) {
    for (const [e, k] of e새) {
      const i = e0 + k
      if (N.무늬 instanceof Map && N.무늬.has(e)) 무늬.set(i, N.무늬.get(e))
      for (const key of Object.keys(E)) E[key][i] = N.E[key] ? N.E[key][e] : 0
      const 호층 = (층표[N.E.ly[e]] || {}).i
      E.ly[i] = 호층 != null ? 호층 : 층찾기(N.layers[N.E.ly[e]] || { name: '0', rgb: [255, 255, 255], hide: false })
      if (E.len) E.len[i] = N.E.len[e] * 배
      if (E.area) E.area[i] = N.E.area[e] * 배 * 배
      if (E.ins) E.ins[i] = -1
      if (E.sc) E.sc[i] = (N.E.sc[e] || 1) * 배
    }
    for (const { e, 점 } of 조각들) {
      Q.e[q0] = e0 + e새.get(e); Q.p0[q0] = p0; Q.pn[q0] = 점.length / 2; q0++
      P.set(점, p0 * 2); p0 += 점.length / 2
    }
    for (const { j, x, y } of 글들) {
      T.s.push(N.T.s[j]); T.x[t0] = x; T.y[t0] = y; T.h[t0] = N.T.h[j] * 배; T.a[t0] = N.T.a[j] + 돌; T.e[t0] = e0 + e새.get(N.T.e[j]); t0++
    }
    e0 += e새.size
  }
  return { 모델: { ...M, E, Q, P, T, layers: 층, 참조: [], 끼운수: nE, 무늬 }, 수 }
}

/** 🧪 G253 시험용 — 모델 합치기(해치 무늬 끼움 확인) */
export const _합치기 = 합치기
