/**
 * 🧱 골조 모델 — 통심 위에 기둥 · 보 · 벽 · 슬라브 · 기초를 «세운» 모델 → 골조 셈(lib/골조.js)의 공사 (G386 · 2026-10-23)
 *
 * 소장님: 「그럼 이제 아까 말했던 플러그인 만들고, 사이트에서 작업 가능하게 하자」 · 「지금 있는 것과 따로 만들고 싶어」 · 「도구 셋 끝낸 뒤」
 *   (카페 «스케치업으로 골조 물량산출» 글 — 기둥 · 보 · 벽 · 슬라브를 세우면 거푸집 ㎡ · 철근 t · 콘크리트 ㎥ 이 층별 · 부호별 엑셀)
 *   ⚠️ 받은 다른 프로그램(.rbz)은 암호화 · 역공학 금지 글이 있어 열지 않았고 «기능 이름» 만 봄. 셈은 우리 골조 셈 그대로.
 *
 * ■ 모델 = { 이름, 통심: {x:[{id, 이름, 자리(mm)}], y:[…]}, 층: [{이름, 층고, 슬라브, 내림?}], 배근(골조.js 와 같은 꼴), 기준, 부재: […], 다음 }
 *   부재 = { id, 종류: 기둥|기초|보|벽|슬라브, 층, 부호, 점: [xid, yid], 끝?: [xid, yid](보 · 벽), 칸?: [x0, y0, x1, y1](슬라브 · 통심 id),
 *            구멍?(벽 OPEN «900x2100» · 슬라브 ㎡), 한면?(벽 거푸집 한 면만), 돌림?(기둥 가로 · 세로 바꿈),
 *            높이?(기둥 · 벽 mm — 그 층 바닥에서 윗면까지 · 비면 층고 · 🧭 G389 도면 단면 · 지붕 높이) , 상부?(벽 mm — 위에서 뺄 몫 · 비면 규칙) }
 * ■ 층: 맨 앞 FT층(기초 · 지중보 · 맨 아래 바닥 — 윗면 높이 0) 다음 아래층부터. n층 = n층 기둥 · 벽 + 그 위 바닥(보 · 슬라브) — 골조 셈과 같음.
 *   FT «내림»(mm) = 맨 아래 바닥 윗면에서 기초 윗면까지 깊이(맨 아래층 기둥이 그만큼 내려감).
 * ■ 셈 규칙은 골조 셈 그대로(보 = 폭×(춤−슬라브)×안목 · 기둥 = 단면×(층고−슬라브) · 슬라브 = 칸×두께 · 벽 = (길이−단부)×(높이−상부)×두께 …).
 *   모델이라 «재지 않고» 자리에서 정해지는 값:
 *   · 보 좌단 · 우단 = 그 끝 받침의 면까지(기둥이면 보 방향 기둥 크기/2 · 원형은 지름×2/5(골조 셈과 같음) · 보면 그 폭/2 · 벽이면 두께/2)
 *   · 보 S-THK = 양옆 슬라브 중 두꺼운 것(없으면 0 — 춤 그대로)
 *   · 같은 통심 위에 이어진 보는 한 «열»(주근이 이어짐 · 처음 · 끝만 정착)
 *   · 기둥 S-THK = 그 자리에 닿는 슬라브 중 두꺼운 것 · 연결 = 위층 같은 자리 기둥(없으면 R — 최상층 정착) · 맨 아래층은 F-THK = 그 자리 기초 · 내림 = FT 내림
 *   · 슬라브 단변 · 장변 = 보 가운데까지 · 옆에 슬라브가 없는 변(바깥 · 구멍 가)은 그 변의 보 · 벽 바깥 면까지 넓힘 · 정착 = 옆 슬라브가 없는 변 수
 *   · 슬라브 마구리 = 옆 슬라브가 없는 변 길이 × 두께(층 둘레 — 두께가 한 가지면 S-EDGE 한 줄)
 *   · 벽 단부 = 끝의 기둥 면까지 · 벽끼리 만나는 곳은 한쪽이 지나감(곧게 지나가는 벽 → 없으면 가로(X 방향) 벽이 모서리까지) · 상부 = 위에 보가 있으면 그 춤, 없으면 슬라브 두께
 * ■ 한 부재 = 셈 한 줄 → 같은 줄은 QT 로 묶어 산출서는 짧게 · 부재별 물량은 그 줄 ÷ QT(산출서와 한 자리도 안 다름)
 * ■ 3D 덩어리 = 위 규칙의 «셈하는 몸» 그대로(기둥은 슬라브 밑까지 · 보는 받침 면 사이 · 슬라브 밑) → 덩어리 부피 합 = 콘크리트 합(검사)
 * ■ 🔒 이용권 확인 자리는 lib/이용권.js (지금 꺼 둠 — 모두 통과 · 화면에 아무 말 없음)
 * ■ 시험: node tools/시험_골조모델.mjs (가상 2층 라멘조 · 손셈은 tools/골조모델_손셈.py 따로)
 */
import { 기준값, 셈 } from './골조.js'

export const 모델판 = 1
const 글 = (x) => String(x ?? '').trim()
const 수 = (x, d = null) => {
  if (typeof x === 'number') return Number.isFinite(x) ? x : d
  const t = String(x ?? '').replace(/,/g, '').trim()
  if (!t) return d
  const n = Number(t)
  return Number.isFinite(n) ? n : d
}
const 둥 = (v) => Math.round(v * 1000) / 1000

export const 종류들 = ['기둥', '보', '벽', '슬라브', '기초']
export const 종류색 = { 기둥: [0.80, 0.42, 0.30], 보: [0.30, 0.55, 0.85], 벽: [0.62, 0.62, 0.55], 슬라브: [0.78, 0.80, 0.84], 기초: [0.55, 0.47, 0.38] }
export const 종류표 = { 기둥: '기둥', 보: '보', 벽: '벽', 슬라브: '슬라브', 기초: '기초' }
/** 배근표 칸 이름(골조.js 배근 열쇠) */
const 배근열쇠 = { 기둥: '기둥', 보: '보', 벽: '벽', 슬라브: '슬라브', 기초: '기초' }
export const FT층 = (f) => 글(f && f.이름).toUpperCase() === 'FT'

/* ───────────────────────────── 새 모델 · 예시 */
function 통심줄(머리, 자리들) { return 자리들.map((v, k) => ({ id: 머리.toLowerCase() + (k + 1), 이름: 머리 + (k + 1), 자리: v })) }

export function 새모델() {
  return {
    판: 모델판,
    이름: '',
    통심: { x: 통심줄('X', [0, 6000, 12000]), y: 통심줄('Y', [0, 6000]) },
    층: [{ 이름: 'FT', 층고: 0, 슬라브: 0, 내림: 0 }, { 이름: '1', 층고: 3300, 슬라브: 150 }],
    기준: 기준값(),
    배근: {
      기둥: [{ 기호: 'C1', 가로: 500, 세로: 500, 지름: '', 주근: '8-D22', 대근단부: 'D10@150', 대근중앙: 'D10@300' }],
      보: [{ 기호: 'G1', 폭: 400, 춤: 600, 상부: '4-D22', 하부: '3-D22', 늑근단부: 'D10@150', 늑근중앙: 'D10@300', 부근: '' }],
      슬라브: [{ 기호: 'S1', 두께: 150, 단변하부: 'D10@200', 단변상부: 'D10@200', 장변하부: 'D10@250', 장변상부: 'D10@250', 상부꼴: '전장' }],
      벽: [{ 기호: 'W1', 두께: 200, 수직: 'D13@200', 수평: 'D10@200', 배근: '복배근' }],
      기초: [{ 기호: 'F1', 종류: '독립', 가로: 2000, 세로: 2000, 두께: 600, 하부가로: 'D19@200', 하부세로: 'D19@200', 상부가로: '', 상부세로: '' }],
      계단: [], 보강근: [],
    },
    부재: [],
    다음: 1,
  }
}

/**
 * 예시 — 가상 2층 라멘조(실제 현장 아님): 통심 X 7000 × 3칸 · Y 6000 × 2칸, 기둥 C1 600각 12개 × 2층, 독립기초 F1 12개,
 * 큰보 G1(바깥) · G2(안쪽), 슬라브 S1(칸마다 6 × 2층), 1층 벽 W1(Y1 줄 X2–X3 · 문 900×2100). FT 내림 300.
 */
export function 예시모델() {
  let M = 새모델()
  M.이름 = '가상 예시 — 2층 라멘조 (실제 현장 아님)'
  M.통심 = { x: 통심줄('X', [0, 7000, 14000, 21000]), y: 통심줄('Y', [0, 6000, 12000]) }
  M.층 = [{ 이름: 'FT', 층고: 0, 슬라브: 0, 내림: 300 }, { 이름: '1', 층고: 3600, 슬라브: 150 }, { 이름: '2', 층고: 3300, 슬라브: 150 }]
  M.배근 = {
    기둥: [{ 기호: 'C1', 가로: 600, 세로: 600, 지름: '', 주근: '12-D22', 대근단부: 'D10@150', 대근중앙: 'D10@300' }],
    보: [
      { 기호: 'G1', 폭: 400, 춤: 700, 상부: '4-D22', 하부: '3-D22', 늑근단부: 'D10@150', 늑근중앙: 'D10@300', 부근: '' },
      { 기호: 'G2', 폭: 500, 춤: 750, 상부: '5-D22', 하부: '4-D22', 늑근단부: 'D10@150', 늑근중앙: 'D10@250', 부근: '2-D13' },
    ],
    슬라브: [{ 기호: 'S1', 두께: 150, 단변하부: 'D10@200', 단변상부: 'D10@200', 장변하부: 'D10@250', 장변상부: 'D10@250', 상부꼴: '전장' }],
    벽: [{ 기호: 'W1', 두께: 200, 수직: 'D13@200', 수평: 'D10@200', 배근: '복배근' }],
    기초: [{ 기호: 'F1', 종류: '독립', 가로: 2400, 세로: 2400, 두께: 700, 하부가로: 'D19@200', 하부세로: 'D19@200', 상부가로: '', 상부세로: '' }],
    계단: [], 보강근: [],
  }
  const X = M.통심.x.map((g) => g.id), Y = M.통심.y.map((g) => g.id)
  for (const x of X) for (const y of Y) M = 기둥넣기(M, 'FT', 'F1', x, y, '기초')
  for (const 층 of ['1', '2']) {
    for (const x of X) for (const y of Y) M = 기둥넣기(M, 층, 'C1', x, y)
    for (const y of Y) M = 선넣기(M, '보', 층, y === Y[1] ? 'G2' : 'G1', [X[0], y], [X[X.length - 1], y])
    for (const x of X) M = 선넣기(M, '보', 층, x === X[0] || x === X[X.length - 1] ? 'G1' : 'G2', [x, Y[0]], [x, Y[Y.length - 1]])
    M = 칸넣기(M, 층, 'S1', X[0], Y[0], X[X.length - 1], Y[Y.length - 1])
  }
  M = 선넣기(M, '벽', '1', 'W1', [X[1], Y[0]], [X[2], Y[0]])
  M = { ...M, 부재: M.부재.map((o) => (o.종류 === '벽' ? { ...o, 구멍: '900x2100' } : o)) }
  return M
}

/** 저장한 모델 · 파일에서 연 모델을 지금 꼴로(빠진 칸 채움 · 원본은 안 건드림) */
export function 정돈(m0) {
  const d = 새모델()
  const m = m0 && typeof m0 === 'object' ? m0 : {}
  const 통 = (a) => (Array.isArray(a) ? a.filter((g) => g && 글(g.id)).map((g) => ({ id: 글(g.id), 이름: 글(g.이름) || 글(g.id), 자리: 수(g.자리, 0) })) : null)
  const M = {
    판: 모델판,
    이름: 글(m.이름),
    통심: { x: 통(m.통심 && m.통심.x) || d.통심.x, y: 통(m.통심 && m.통심.y) || d.통심.y },
    층: Array.isArray(m.층) && m.층.length ? m.층.map((f) => ({ ...f, 이름: 글(f.이름) })) : d.층,
    기준: { ...기준값(), ...(m.기준 || {}) },
    배근: { ...d.배근, ...(m.배근 || {}) },
    부재: Array.isArray(m.부재) ? m.부재.filter((o) => o && 종류들.includes(o.종류)) : [],
    다음: Math.max(수(m.다음, 1) || 1, 1),
  }
  if (!FT층(M.층[0])) M.층 = [{ 이름: 'FT', 층고: 0, 슬라브: 0, 내림: 0 }, ...M.층]
  for (const k of Object.keys(d.배근)) if (!Array.isArray(M.배근[k])) M.배근[k] = []
  const 큰 = M.부재.reduce((a, o) => Math.max(a, 수(o.id, 0) || 0), 0)
  if (M.다음 <= 큰) M.다음 = 큰 + 1
  M.통심.x.sort((a, b) => a.자리 - b.자리); M.통심.y.sort((a, b) => a.자리 - b.자리)
  return M
}

/* ───────────────────────────── 고치기(모두 새 모델을 돌려줌) */
const 같은점 = (a, b) => a && b && a[0] === b[0] && a[1] === b[1]
function 새번호(M) { return [M.다음, { ...M, 다음: M.다음 + 1 }] }

/** 기둥 · 기초 하나(같은 층 · 같은 자리에 같은 종류가 있으면 부호만 바꿈) */
export function 기둥넣기(M, 층, 부호, xid, yid, 종류 = '기둥') {
  const 있 = M.부재.find((o) => o.종류 === 종류 && o.층 === 층 && 같은점(o.점, [xid, yid]))
  if (있) return { ...M, 부재: M.부재.map((o) => (o === 있 ? { ...o, 부호 } : o)) }
  const [id, M2] = 새번호(M)
  return { ...M2, 부재: [...M2.부재, { id, 종류, 층, 부호, 점: [xid, yid] }] }
}

/** 통심 위 두 점 사이 보 · 벽 — 사이의 통심마다 한 칸씩 나눠 넣음(같은 자리면 부호만 바꿈) · 같은 줄이 아니면 그대로 돌려줌 */
export function 선넣기(M, 종류, 층, 부호, A, B) {
  const xs = M.통심.x.map((g) => g.id), ys = M.통심.y.map((g) => g.id)
  let 칸들 = []
  if (A[0] === B[0] && A[1] !== B[1]) {
    let i = ys.indexOf(A[1]), j = ys.indexOf(B[1])
    if (i < 0 || j < 0) return M
    if (i > j) [i, j] = [j, i]
    for (let k = i; k < j; k++) 칸들.push([[A[0], ys[k]], [A[0], ys[k + 1]]])
  } else if (A[1] === B[1] && A[0] !== B[0]) {
    let i = xs.indexOf(A[0]), j = xs.indexOf(B[0])
    if (i < 0 || j < 0) return M
    if (i > j) [i, j] = [j, i]
    for (let k = i; k < j; k++) 칸들.push([[xs[k], A[1]], [xs[k + 1], A[1]]])
  } else return M
  let N = M
  for (const [p, q] of 칸들) {
    const 있 = N.부재.find((o) => o.종류 === 종류 && o.층 === 층 && ((같은점(o.점, p) && 같은점(o.끝, q)) || (같은점(o.점, q) && 같은점(o.끝, p))))
    if (있) { N = { ...N, 부재: N.부재.map((o) => (o === 있 ? { ...o, 부호 } : o)) }; continue }
    const [id, N2] = 새번호(N)
    N = { ...N2, 부재: [...N2.부재, { id, 종류, 층, 부호, 점: p, 끝: q }] }
  }
  return N
}

/** 두 모서리 사이 칸마다 슬라브(같은 칸이면 부호만 바꿈) */
export function 칸넣기(M, 층, 부호, x0, y0, x1, y1) {
  const xs = M.통심.x.map((g) => g.id), ys = M.통심.y.map((g) => g.id)
  let i0 = xs.indexOf(x0), i1 = xs.indexOf(x1), j0 = ys.indexOf(y0), j1 = ys.indexOf(y1)
  if (i0 < 0 || i1 < 0 || j0 < 0 || j1 < 0) return M
  if (i0 > i1) [i0, i1] = [i1, i0]
  if (j0 > j1) [j0, j1] = [j1, j0]
  if (i0 === i1 || j0 === j1) return M
  let N = M
  for (let i = i0; i < i1; i++) for (let j = j0; j < j1; j++) {
    const 칸 = [xs[i], ys[j], xs[i + 1], ys[j + 1]]
    const 있 = N.부재.find((o) => o.종류 === '슬라브' && o.층 === 층 && o.칸 && o.칸.join() === 칸.join())
    if (있) { N = { ...N, 부재: N.부재.map((o) => (o === 있 ? { ...o, 부호 } : o)) }; continue }
    const [id, N2] = 새번호(N)
    N = { ...N2, 부재: [...N2.부재, { id, 종류: '슬라브', 층, 부호, 칸 }] }
  }
  return N
}

export function 부재빼기(M, ids) {
  const s = new Set([].concat(ids))
  return { ...M, 부재: M.부재.filter((o) => !s.has(o.id)) }
}
export function 부재고치기(M, id, 고칠) {
  return { ...M, 부재: M.부재.map((o) => (o.id === id ? { ...o, ...고칠 } : o)) }
}

/** 층 복사 — 가져올 층의 부재를 받을 층(들)에 그대로(받을 층에 있던 같은 종류 부재는 지우고) · 종류들 = 옮길 종류 */
export function 층복사(M, 가져올, 받을들, 옮길 = ['기둥', '보', '벽', '슬라브']) {
  let N = M
  const 원 = M.부재.filter((o) => o.층 === 가져올 && 옮길.includes(o.종류))
  for (const 받을 of [].concat(받을들)) {
    if (받을 === 가져올) continue
    N = { ...N, 부재: N.부재.filter((o) => !(o.층 === 받을 && 옮길.includes(o.종류))) }
    for (const o of 원) {
      const [id, N2] = 새번호(N)
      N = { ...N2, 부재: [...N2.부재, { ...o, id, 층: 받을 }] }
    }
  }
  return N
}

/** 통심 하나 더하기(자리 mm) — 이름은 곁 줄 이름 + «a» 처럼 · 고른 축 */
export function 통심더하기(M, 축, 자리, 이름 = '') {
  const 줄 = M.통심[축]
  let n = 1
  while (줄.some((g) => g.id === 축 + 'n' + n)) n++
  const id = 축 + 'n' + n
  const 새 = { id, 이름: 글(이름) || (축.toUpperCase() + '+' + Math.round(자리)), 자리: 수(자리, 0) }
  return { ...M, 통심: { ...M.통심, [축]: [...줄, 새].sort((a, b) => a.자리 - b.자리) } }
}
/** 통심 빼기 — 그 줄을 쓰는 부재도 같이 지움 */
export function 통심빼기(M, 축, id) {
  const 씀 = (o) => (o.점 && o.점[축 === 'x' ? 0 : 1] === id) || (o.끝 && o.끝[축 === 'x' ? 0 : 1] === id) || (o.칸 && (o.칸[축 === 'x' ? 0 : 1] === id || o.칸[축 === 'x' ? 2 : 3] === id))
  return { ...M, 통심: { ...M.통심, [축]: M.통심[축].filter((g) => g.id !== id) }, 부재: M.부재.filter((o) => !씀(o)) }
}
/** 통심 간격(앞 줄에서 거리 mm)들로 다시 — 「7000, 7000, 7000」 → 0 · 7000 · 14000 · 21000 (줄 수가 같으면 id 그대로 → 부재 유지) */
export function 통심간격(M, 축, 간격들, 머리 = 축.toUpperCase()) {
  const 간 = 간격들.map((v) => 수(v, 0)).filter((v) => v > 0)
  const 자리 = [0]
  for (const v of 간) 자리.push(자리[자리.length - 1] + v)
  const 옛 = M.통심[축]
  const 새 = 자리.map((v, k) => (옛[k] ? { ...옛[k], 자리: v } : { id: 축 + (k + 1) + '_' + Date.now().toString(36).slice(-3) + k, 이름: 머리 + (k + 1), 자리: v }))
  const 남 = new Set(새.map((g) => g.id))
  let N = { ...M, 통심: { ...M.통심, [축]: 새 } }
  for (const g of 옛) if (!남.has(g.id)) N = 통심빼기(N, 축, g.id)
  return N
}

/* ───────────────────────────── 자리 · 높이 */
export function 층높이(M) {
  const m = new Map()
  let z = 0
  const ft = M.층.find(FT층)
  const 내림 = Math.max(수(ft && ft.내림, 0) || 0, 0)
  const 위층 = M.층.filter((f) => !FT층(f))
  M.층.forEach((f, k) => {
    if (FT층(f)) { m.set(f.이름, { z0: -내림, z1: 0, 층고: 0, 슬라브: 수(f.슬라브, 0) || 0, k, FT: true }); return }
    const h = Math.max(수(f.층고, 0) || 0, 0)
    m.set(f.이름, { z0: z, z1: z + h, 층고: h, 슬라브: 수(f.슬라브, 0) || 0, k })
    z += h
  })
  return { 표: m, 내림, 맨아래: 위층.length ? 위층[0].이름 : null, 위층: 위층.map((f) => f.이름) }
}

/** 배근표에서 부호 찾기(대문자 · 빈칸 무시) */
function 일람(M, 종류, 부호) {
  const t = 글(부호).toUpperCase().replace(/\s/g, '')
  return (M.배근[배근열쇠[종류]] || []).find((r) => 글(r.기호).toUpperCase().replace(/\s/g, '') === t) || null
}

/**
 * 모델 → 부재마다 «자리 · 크기 · 받침» (셈 줄과 3D 덩어리의 바탕)
 * @returns {{기하: Map<id, object>, 경고: string[]}}
 */
export function 기하(M0) {
  const M = 정돈(M0)
  const 경고 = []
  const X = new Map(M.통심.x.map((g) => [g.id, g.자리])), Y = new Map(M.통심.y.map((g) => [g.id, g.자리]))
  const 이름 = (id) => (M.통심.x.find((g) => g.id === id) || M.통심.y.find((g) => g.id === id) || {}).이름 || id
  const H = 층높이(M)
  const 기 = new Map()
  const 층의 = new Map()                 // 층 → {기둥: Map(점키 → o), 보: [], 벽: [], 슬라브: []}
  const 점키 = (p) => p[0] + '|' + p[1]
  const 판 = (층) => { if (!층의.has(층)) 층의.set(층, { 기둥: new Map(), 기초: new Map(), 보: [], 벽: [], 슬라브: [] }); return 층의.get(층) }
  const 이름표 = (o) => 종류표[o.종류] + ' ' + 글(o.부호) + ' (' + o.층 + '층' + (o.점 ? ' · ' + 이름(o.점[0]) + '-' + 이름(o.점[1]) : '') + ')'

  for (const o of M.부재) {
    if (!H.표.has(o.층)) { 경고.push(이름표(o) + ' — 층 «' + o.층 + '» 이 층 목록에 없어 뺐습니다'); continue }
    const r = 일람(M, o.종류, o.부호)
    if (!r) { 경고.push(이름표(o) + ' — 부호 «' + 글(o.부호) + '» 가 ' + 종류표[o.종류] + ' 일람에 없습니다'); continue }
    const g = { o, r, id: o.id }
    if (o.종류 === '기둥' || o.종류 === '기초') {
      if (!(X.has(o.점[0]) && Y.has(o.점[1]))) { 경고.push(이름표(o) + ' — 통심이 없어 뺐습니다'); continue }
      g.x = X.get(o.점[0]); g.y = Y.get(o.점[1])
      if (o.종류 === '기둥') {
        const D = 수(r.지름, 0) || 0
        let a = 수(r.가로, 0) || 0, b = 수(r.세로, 0) || a
        if (D > 0) { a = D; b = D; g.원 = D }
        if (o.돌림) [a, b] = [b, a]
        if (!(a > 0 && b > 0)) { 경고.push(이름표(o) + ' — 일람에 가로 · 세로(또는 지름)가 없습니다'); continue }
        g.a = a; g.b = b
        판(o.층).기둥.set(점키(o.점), g)
      } else {
        if (!FT층(M.층.find((f) => f.이름 === o.층))) 경고.push(이름표(o) + ' — 기초는 FT 층에 둡니다(셈은 그대로 함)')
        const 종 = 글(r.종류) || '독립'
        if (/줄|MAT|매트|부정/i.test(종)) { 경고.push(이름표(o) + ' — 모델의 기초는 «독립» 만 됩니다(일람 종류 ' + 종 + ')'); continue }
        g.a = 수(r.가로, 0) || 0; g.b = 수(r.세로, 0) || g.a; g.t = 수(r.두께, 0) || 0
        if (!(g.a > 0 && g.t > 0)) { 경고.push(이름표(o) + ' — 일람에 가로 · 두께가 없습니다'); continue }
        판(o.층).기초.set(점키(o.점), g)
      }
    } else if (o.종류 === '보' || o.종류 === '벽') {
      if (!o.끝 || !(X.has(o.점[0]) && Y.has(o.점[1]) && X.has(o.끝[0]) && Y.has(o.끝[1]))) { 경고.push(이름표(o) + ' — 통심이 없어 뺐습니다'); continue }
      let p = o.점, q = o.끝
      let 축
      if (p[0] === q[0] && p[1] !== q[1]) 축 = 'y'
      else if (p[1] === q[1] && p[0] !== q[0]) 축 = 'x'
      else { 경고.push(이름표(o) + ' — 통심 한 줄 위에 있지 않아 뺐습니다(가로 · 세로만)'); continue }
      const 값 = (pt) => (축 === 'x' ? X.get(pt[0]) : Y.get(pt[1]))
      if (값(p) > 값(q)) [p, q] = [q, p]
      g.축 = 축; g.p = p; g.q = q
      g.줄 = 축 === 'x' ? p[1] : p[0]                      // 놓인 통심 id
      g.s0 = 값(p); g.s1 = 값(q)                            // 축 방향 자리
      g.c = 축 === 'x' ? Y.get(p[1]) : X.get(p[0])          // 줄 자리
      g.L = g.s1 - g.s0
      if (!(g.L > 0)) { 경고.push(이름표(o) + ' — 길이가 0 입니다'); continue }
      if (o.종류 === '보') { g.W = 수(r.폭, 0) || 0; g.H = 수(r.춤, 0) || 0; if (!(g.W > 0 && g.H > 0)) { 경고.push(이름표(o) + ' — 일람에 폭 · 춤이 없습니다'); continue } }
      else { g.T = 수(r.두께, 0) || 0; if (!(g.T > 0)) { 경고.push(이름표(o) + ' — 일람에 두께가 없습니다'); continue } }
      판(o.층)[o.종류].push(g)
    } else if (o.종류 === '슬라브') {
      const k = o.칸 || []
      if (!(X.has(k[0]) && Y.has(k[1]) && X.has(k[2]) && Y.has(k[3]))) { 경고.push(이름표(o) + ' — 통심이 없어 뺐습니다'); continue }
      g.x0 = Math.min(X.get(k[0]), X.get(k[2])); g.x1 = Math.max(X.get(k[0]), X.get(k[2]))
      g.y0 = Math.min(Y.get(k[1]), Y.get(k[3])); g.y1 = Math.max(Y.get(k[1]), Y.get(k[3]))
      if (!(g.x1 > g.x0 && g.y1 > g.y0)) { 경고.push(이름표(o) + ' — 칸 넓이가 0 입니다'); continue }
      const f = H.표.get(o.층)
      g.t = 수(r.두께, 0) || f.슬라브
      if (!(g.t > 0)) { 경고.push(이름표(o) + ' — 두께가 없습니다(일람 · 층 슬라브 두께)'); continue }
      판(o.층).슬라브.push(g)
    }
    기.set(o.id, g)
  }

  /* 받침 · 이웃 — 층마다 */
  const 겹 = (a0, a1, b0, b1) => Math.min(a1, b1) - Math.max(a0, b0)
  for (const [층, P] of 층의) {
    const f = H.표.get(층)
    const zt = f.z1
    /* 슬라브 이웃 · 넓힘 */
    for (const s of P.슬라브) {
      const 변 = { 왼: null, 오른: null, 아래: null, 위: null }
      for (const u of P.슬라브) {
        if (u === s) continue
        if (u.x1 === s.x0 && 겹(u.y0, u.y1, s.y0, s.y1) > 0) 변.왼 = u
        if (u.x0 === s.x1 && 겹(u.y0, u.y1, s.y0, s.y1) > 0) 변.오른 = u
        if (u.y1 === s.y0 && 겹(u.x0, u.x1, s.x0, s.x1) > 0) 변.아래 = u
        if (u.y0 === s.y1 && 겹(u.x0, u.x1, s.x0, s.x1) > 0) 변.위 = u
      }
      s.이웃 = 변
      /* 옆 슬라브가 없는 변 — 그 변 위의 보 · 벽 중 넓은 것의 절반만큼 넓힘 */
      const 변받침 = (축, 자리, a0, a1) => {
        let w = 0
        for (const b of P.보) if (b.축 === 축 && b.c === 자리 && 겹(b.s0, b.s1, a0, a1) > 0) w = Math.max(w, b.W)
        for (const b of P.벽) if (b.축 === 축 && b.c === 자리 && 겹(b.s0, b.s1, a0, a1) > 0) w = Math.max(w, b.T)
        return w / 2
      }
      s.넓 = {
        왼: 변.왼 ? 0 : 변받침('y', s.x0, s.y0, s.y1), 오른: 변.오른 ? 0 : 변받침('y', s.x1, s.y0, s.y1),
        아래: 변.아래 ? 0 : 변받침('x', s.y0, s.x0, s.x1), 위: 변.위 ? 0 : 변받침('x', s.y1, s.x0, s.x1),
      }
      s.X0 = s.x0 - s.넓.왼; s.X1 = s.x1 + s.넓.오른; s.Y0 = s.y0 - s.넓.아래; s.Y1 = s.y1 + s.넓.위
      /* 🧭 G389 안목(보 · 벽 면 사이 — 받침 없는 변은 걸침 몫 50 을 미리 뺌) → 데크 = 안목 + 걸침 100(골조 셈 G292 규칙) */
      const 면 = (축, 자리, a0, a1) => { const w = 변받침(축, 자리, a0, a1); return w > 0 ? w : 50 }
      s.안x = (s.x1 - s.x0) - 면('y', s.x0, s.y0, s.y1) - 면('y', s.x1, s.y0, s.y1)
      s.안y = (s.y1 - s.y0) - 면('x', s.y0, s.x0, s.x1) - 면('x', s.y1, s.x0, s.x1)
      s.z0 = zt - s.t; s.z1 = zt
      /* 마구리(옆 슬라브 없는 변) 길이 */
      s.마구리 = (변.왼 ? 0 : s.Y1 - s.Y0) + (변.오른 ? 0 : s.Y1 - s.Y0) + (변.아래 ? 0 : s.X1 - s.X0) + (변.위 ? 0 : s.X1 - s.X0)
    }
    /* 점에 닿는 슬라브 중 두꺼운 것 */
    const 점슬 = (x, y) => P.슬라브.reduce((t, s) => (x >= s.x0 && x <= s.x1 && y >= s.y0 && y <= s.y1 ? Math.max(t, s.t) : t), 0)
    /* 선(보 · 벽) 양옆 슬라브 중 두꺼운 것 */
    const 선슬 = (b) => P.슬라브.reduce((t, s) => {
      if (b.축 === 'x' && (s.y0 === b.c || s.y1 === b.c) && 겹(s.x0, s.x1, b.s0, b.s1) > 0) return Math.max(t, s.t)
      if (b.축 === 'y' && (s.x0 === b.c || s.x1 === b.c) && 겹(s.y0, s.y1, b.s0, b.s1) > 0) return Math.max(t, s.t)
      return t
    }, 0)
    /* FT(지중보)의 받침 기둥 = 맨 아래층 기둥(기초 윗면까지 내려온 기둥) */
    const 받침기둥 = f.FT && 층의.get(H.맨아래) ? 층의.get(H.맨아래).기둥 : P.기둥
    /* 한 점(통심 교점)에서 그 종류 선 부재 — 축 · 지나감 */
    const 점선 = (목록, x, y) => 목록.filter((b) => (b.축 === 'x' ? b.c === y && x >= b.s0 && x <= b.s1 : b.c === x && y >= b.s0 && y <= b.s1))
    const 이어짐 = (목록, b, 끝쪽) => {        // 끝쪽: 0 = 시작(s0) · 1 = 끝(s1) — 같은 줄로 곧게 이어지는 같은 종류
      const v = 끝쪽 ? b.s1 : b.s0
      return 목록.some((u) => u !== b && u.축 === b.축 && u.c === b.c && (끝쪽 ? u.s0 === v : u.s1 === v))
    }
    /**
     * 선 부재(보 · 벽) 한 끝의 공제(mm · 음수 = 모서리까지 넓힘)와 그 까닭
     *   기둥 → 그 방향 기둥 크기/2(원형 지름×2/5) · 가로지르는 같은 종류(보 · 벽) → 지나가는 쪽이 받침 · 보는 벽에도 걸침
     */
    const 끝공제 = (b, 목록, 끝쪽) => {
      const x = b.축 === 'x' ? (끝쪽 ? b.s1 : b.s0) : b.c
      const y = b.축 === 'x' ? b.c : (끝쪽 ? b.s1 : b.s0)
      const 점 = 끝쪽 ? b.q : b.p
      const c = 받침기둥.get(점키(점))
      if (c) {
        const 크기 = c.원 ? c.원 * 2 / 5 : (b.축 === 'x' ? c.a : c.b) / 2
        return { 값: 크기, 무엇: '기둥 ' + 글(c.o.부호) + ' 면', 기둥: true }
      }
      const 나 = 이어짐(목록, b, 끝쪽)
      const 옆 = 점선(목록, x, y).filter((u) => u.축 !== b.축)
      const 두께 = (u) => (u.W || u.T || 0)
      if (옆.length) {
        const t = Math.max(...옆.map(두께))
        const 옆지남 = 옆.some((u) => x > (u.축 === 'x' ? u.s0 : -Infinity) && (u.축 === 'x' ? x < u.s1 : true) && (u.축 === 'y' ? y > u.s0 && y < u.s1 : true))
          || (옆.some((u) => (u.축 === 'x' ? u.s1 === x : u.s1 === y)) && 옆.some((u) => (u.축 === 'x' ? u.s0 === x : u.s0 === y)))
        if (옆지남 && !(나 && b.축 === 'x')) return { 값: t / 2, 무엇: (b.o.종류 === '보' ? '보' : '벽') + ' 면(지나가는 ' + (옆[0].o.종류) + ' ' + 글(옆[0].o.부호) + ')' }
        if (옆지남) return { 값: 0, 무엇: '지나감' }
        if (나) return { 값: 0, 무엇: '지나감' }
        /* 둘 다 끝나는 모서리 — 가로(X 방향)가 모서리까지 · 세로는 그 면까지 */
        if (b.축 === 'x') return { 값: -t / 2, 무엇: '모서리까지(' + 옆[0].o.종류 + ' ' + 글(옆[0].o.부호) + ' 바깥 면)' }
        return { 값: t / 2, 무엇: (옆[0].o.종류) + ' ' + 글(옆[0].o.부호) + ' 면' }
      }
      if (b.o.종류 === '보') {
        const 벽옆 = 점선(P.벽, x, y).filter((u) => u.축 !== b.축)
        if (벽옆.length) return { 값: Math.max(...벽옆.map((u) => u.T)) / 2, 무엇: '벽 ' + 글(벽옆[0].o.부호) + ' 면' }
      }
      return { 값: 0, 무엇: 나 ? '이어짐' : '끝(받침 없음)' }
    }
    for (const b of P.보) {
      b.S = 선슬(b)
      b.좌 = 끝공제(b, P.보, 0); b.우 = 끝공제(b, P.보, 1)
      b.안 = b.L - b.좌.값 - b.우.값
      b.z0 = zt - b.H; b.z1 = zt - b.S
    }
    for (const w of P.벽) {
      w.좌 = 끝공제(w, P.벽, 0); w.우 = 끝공제(w, P.벽, 1)
      w.안 = w.L - w.좌.값 - w.우.값
      /* 위에 보(같은 줄 · 겹침) → 그 춤 · 없으면 슬라브 두께 */
      const 위보 = P.보.filter((b) => b.축 === w.축 && b.c === w.c && 겹(b.s0, b.s1, w.s0, w.s1) > 0)
      const 정상부 = 수(w.o.상부, null)
      w.상부 = 정상부 !== null && 정상부 >= 0 ? 정상부 : 위보.length ? Math.max(...위보.map((b) => b.H)) : 선슬(w)
      w.상부까닭 = 정상부 !== null && 정상부 >= 0 ? '정한 값' : 위보.length ? '위 보 ' + 글(위보[0].o.부호) + ' 춤' : w.상부 ? '슬라브 두께' : '위에 보 · 슬라브 없음'
      w.높이 = 수(w.o.높이, 0) > 0 ? 수(w.o.높이, 0) : 0          // 🧭 G389 정한 높이(바닥에서 윗면까지)
      w.z0 = f.z0; w.z1 = (w.높이 ? f.z0 + w.높이 : zt) - w.상부
      const 이음끝 = [이어짐(P.벽, w, 0), 이어짐(P.벽, w, 1)]
      w.X정착 = 이음끝.filter((v) => !v).length
      w.단부끝 = [0, 1].reduce((a, k) => a + (이음끝[k] ? 0 : (k ? w.우 : w.좌).기둥 || /끝/.test((k ? w.우 : w.좌).무엇) ? 1 : 0.5), 0)
    }
    for (const [k, c] of P.기둥) {
      c.S = 점슬(c.x, c.y)
      c.높이 = 수(c.o.높이, 0) > 0 ? 수(c.o.높이, 0) : 0          // 🧭 G389 정한 높이(바닥에서 윗면까지)
      c.z0 = f.z0 - (층 === H.맨아래 ? H.내림 : 0); c.z1 = (c.높이 ? f.z0 + c.높이 : zt) - c.S
      c.내림 = 층 === H.맨아래 ? H.내림 : 0
      const 위 = H.위층[H.위층.indexOf(층) + 1]
      const 위기둥 = 위 && 층의.get(위) ? 층의.get(위).기둥.get(k) : null
      c.연결 = 위기둥 ? 글(위기둥.o.부호) : 'R'
      const ftP = M.층.find(FT층) ? 층의.get(M.층.find(FT층).이름) : null
      c.기초 = 층 === H.맨아래 && ftP ? ftP.기초.get(k) || null : null
    }
    for (const [, d] of P.기초) { d.z1 = -H.내림; d.z0 = d.z1 - d.t }
  }
  /* FT 바닥 슬라브(흙 위)를 맨 아래층 기둥이 뚫고 내려감(내림 > 0) — 겹친 몫 = 기둥 단면 ∩ 슬라브 × min(내림, 두께) → 슬라브 «개구부» 로 뺌 */
  const ftF = M.층.find(FT층)
  if (ftF && 층의.get(ftF.이름) && 층의.get(H.맨아래) && H.내림 > 0) {
    const 기둥들 = [...층의.get(H.맨아래).기둥.values()]
    for (const s of 층의.get(ftF.이름).슬라브) {
      let 넓 = 0
      for (const c of 기둥들) {
        const 반a = c.a / 2, 반b = c.b / 2
        const dx = Math.min(c.x + 반a, s.X1) - Math.max(c.x - 반a, s.X0), dy = Math.min(c.y + 반b, s.Y1) - Math.max(c.y - 반b, s.Y0)
        if (dx > 0 && dy > 0) 넓 += dx * dy * (c.원 ? Math.PI / 4 : 1)
      }
      s.기둥빼기 = 넓 * Math.min(H.내림, s.t) / s.t             // mm² (두께 전체로 환산)
    }
  }
  return { 기: 기, 경고, 층의, H, M }
}

/* ───────────────────────────── 모델 → 골조 공사(주자료) */
const 빈보 = { C: '', F: '', 공제F: '', R: '' }
/**
 * @returns {{공사, 곳들: Map<'표|i', {ids:number[], 몫?:Map<id,number>}>, 경고: string[], G}}
 *   곳들 — 셈 줄의 곳(표 · 줄 번호) → 그 줄을 만든 부재들(같은 줄 QT 묶음) · 층 마구리(S-EDGE)는 슬라브마다 몫(마구리 길이)
 */
export function 공사로(M0) {
  const G = 기하(M0)
  const M = G.M
  const 경고 = [...G.경고]
  const 주 = { 보: [], 기둥: [], 슬라브: [], 옹벽: [], 계단: [], 기초: [], 드라이에리어: [], 보강: [], 보강근: [] }
  const 곳들 = new Map()
  const 묶기 = (표, 줄들) => {            // 줄들: [{row, id}] — 같은 줄(QT 뺀 모든 칸)은 하나로
    const m = new Map()
    for (const { row, id } of 줄들) {
      const 키 = JSON.stringify(row)
      if (!m.has(키)) m.set(키, { row, ids: [] })
      m.get(키).ids.push(id)
    }
    for (const { row, ids } of m.values()) {
      const i = 주[표].length
      주[표].push({ ...row, QT: ids.length })
      곳들.set(표 + '|' + i, { ids })
    }
  }
  const 거푸집 = 글(M.기준 && M.기준.거푸집) || 기준값().거푸집
  const 층차례 = M.층.map((f) => f.이름)
  const 층별 = [...G.층의.entries()].sort((a, b) => 층차례.indexOf(a[0]) - 층차례.indexOf(b[0]))
  const 층마구리 = new Map()
  /* FT 바닥 슬라브 = 흙 위(밑면 거푸집 없음 — 골조 셈 «_흙») · 같은 부호를 위층에도 쓰면 «부호(바닥)» 로 따로 */
  const ftN = (M.층.find(FT층) || {}).이름
  const 바닥부호 = new Set(M.부재.filter((o) => o.종류 === '슬라브' && o.층 === ftN).map((o) => 글(o.부호)))
  const 위부호 = new Set(M.부재.filter((o) => o.종류 === '슬라브' && o.층 !== ftN).map((o) => 글(o.부호)))
  const 흙기호 = (층, 부호) => (층 === ftN && 위부호.has(부호) ? 부호 + '(바닥)' : 부호)
  const 배근 = { ...M.배근, 슬라브: (M.배근.슬라브 || []).map((r) => (바닥부호.has(글(r.기호)) && !위부호.has(글(r.기호)) ? { ...r, _흙: '1' } : r)) }
  for (const r of M.배근.슬라브 || []) if (바닥부호.has(글(r.기호)) && 위부호.has(글(r.기호))) 배근.슬라브.push({ ...r, 기호: 글(r.기호) + '(바닥)', _흙: '1' })

  for (const [층, P] of 층별) {
    /* 기둥 */
    묶기('기둥', [...P.기둥.values()].sort((a, b) => a.x - b.x || a.y - b.y).map((c) => ({
      id: c.id,
      row: { 층, 기호: 글(c.o.부호), 높이: c.높이 ? String(c.높이) : '', 내림: c.내림 ? String(c.내림) : '', S: String(c.S), FT: c.기초 ? 글(c.기초.o.부호) : '', 연결: c.연결, C: '', F: '', 원형F: '', R: '', ...(c.o.돌림 ? { _돌림: 1 } : {}) },
    })))
    /* 보 — 같은 통심 위 이어진 보를 열로(축 · 줄 · 자리 차례) */
    const 열들 = []
    const 보들 = [...P.보].sort((a, b) => (a.축 === b.축 ? 0 : a.축 === 'x' ? -1 : 1) || a.c - b.c || a.s0 - b.s0)
    for (const b of 보들) {
      const 앞 = 열들[열들.length - 1]
      const 끝 = 앞 && 앞[앞.length - 1]
      if (끝 && 끝.축 === b.축 && 끝.c === b.c && 끝.s1 === b.s0) 앞.push(b)
      else 열들.push([b])
    }
    const 열묶 = new Map()
    for (const 열 of 열들) {
      const rows = 열.map((b) => ({ 층, 기호: 글(b.o.부호), 길이: String(둥(b.L)), 좌단: String(둥(b.좌.값)), 우단: String(둥(b.우.값)), S: String(b.S), ...빈보 }))
      const 키 = JSON.stringify(rows)
      const 줄이름 = (M.통심[열[0].축 === 'x' ? 'y' : 'x'].find((g) => g.id === 열[0].줄) || {}).이름 || ''
      if (!열묶.has(키)) 열묶.set(키, { rows, 열: [], 이름: [] })
      열묶.get(키).열.push(열); 열묶.get(키).이름.push(줄이름)
    }
    for (const { rows, 열, 이름 } of 열묶.values()) {
      const n = rows.length
      rows.forEach((row, k) => {
        const i = 주.보.length
        const 열칸 = n === 1 ? '' : k === 0 ? (이름.join('·') || 'L') : k === n - 1 ? 'E' : ''
        주.보.push({ 층: row.층, 열: 열칸, 기호: row.기호, 길이: row.길이, 좌단: row.좌단, 우단: row.우단, S: row.S, QT: 열.length, ...빈보 })
        곳들.set('보|' + i, { ids: 열.map((l) => l[k].id) })
      })
    }
    /* 슬라브 */
    const 바깥말 = (s) => {
      const 넓 = Object.entries(s.넓).filter(([, v]) => v > 0)
      return 넓.length ? '보 가운데까지 · 옆 슬라브 없는 ' + 넓.map(([k]) => k).join(' · ') + ' 변은 보 · 벽 바깥 면까지' : ''
    }
    묶기('슬라브', [...P.슬라브].sort((a, b) => a.y0 - b.y0 || a.x0 - b.x0).map((s) => {
      const Lx = s.X1 - s.X0, Ly = s.Y1 - s.Y0
      const x짧 = Lx <= Ly
      const 정x = (s.이웃.왼 ? 0 : 1) + (s.이웃.오른 ? 0 : 1), 정y = (s.이웃.아래 ? 0 : 1) + (s.이웃.위 ? 0 : 1)
      const 구 = Math.round(((수(s.o.구멍, 0) || 0) + (s.기둥빼기 || 0) / 1e6) * 1e6) / 1e6
      const 단글 = String(둥(Math.min(Lx, Ly))), 장글 = String(둥(Math.max(Lx, Ly)))
      const 데크 = /데크/.test(글(s.r.종류)) && s.안x > 0 && s.안y > 0
      return {
        id: s.id,
        row: { 층, 기호: 흙기호(층, 글(s.o.부호)), 단변: 단글, 장변: 장글, ...(데크 ? { _안: [[Math.round(s.안x), Math.round(s.안y)]], _안cc: 단글 + '|' + 장글 } : {}), 개구부: 구 > 0 ? String(구) : '', 단변정착: x짧 ? 정x : 정y, 장변정착: x짧 ? 정y : 정x, C: '', F: '', R: '', ...(바깥말(s) ? { _바깥: 바깥말(s) } : {}) },
      }
    }))
    /* 슬라브 마구리(S-EDGE) — 두께가 한 가지면 층 둘레, 여러 가지면 두께마다 보강 줄 */
    const 마 = P.슬라브.filter((s) => s.마구리 > 0)
    if (마.length) 층마구리.set(층, 마)
    /* 벽 */
    묶기('옹벽', [...P.벽].sort((a, b) => (a.축 === b.축 ? 0 : a.축 === 'x' ? -1 : 1) || a.c - b.c || a.s0 - b.s0).map((w) => {
      const 위 = G.H.위층[G.H.위층.indexOf(층) + 1]
      const 위벽 = 위 && G.층의.get(위) ? G.층의.get(위).벽.some((u) => u.축 === w.축 && u.c === w.c && u.s0 === w.s0 && u.s1 === w.s1) : false
      return {
        id: w.id,
        row: { 층, 기호: 글(w.o.부호), 길이: String(둥(w.L)), 높이: w.높이 ? String(w.높이) : '', 하부: '', 상부: String(둥(w.상부)), 단부: String(둥(w.좌.값 + w.우.값)), X정착: w.X정착, 상부이음: 위벽 ? '1' : 'A', OPEN: 글(w.o.구멍), C: '', F: '', F2: w.o.한면 ? '' : 거푸집, R: '', _단부끝: w.단부끝 },
      }
    }))
    /* 기초 */
    묶기('기초', [...P.기초.values()].sort((a, b) => a.x - b.x || a.y - b.y).map((d) => ({
      id: d.id,
      row: { 층, 기호: 글(d.o.부호), 줄기초: '', MAT단변: '', MAT장변: '', 형틀공제: '', 추가: '', 단부공제: '', C: '', F: '', 공제F: '', R: '' },
    })))
  }

  /* 층 — 골조 셈의 층 표(층고 · 슬라브 · 둘레) */
  const 층표 = M.층.map((f) => ({ 이름: f.이름, 층고: FT층(f) ? 0 : 수(f.층고, 0) || 0, 슬라브: 수(f.슬라브, 0) || 0 }))
  for (const [층, 마] of 층마구리) {
    const 두께들 = [...new Set(마.map((s) => s.t))]
    const k = 층표.findIndex((f) => f.이름 === 층)
    if (두께들.length === 1) {
      층표[k] = { ...층표[k], 슬라브: 두께들[0], 둘레: 둥(마.reduce((a, s) => a + s.마구리, 0) / 1000) }
      곳들.set('층|' + k, { ids: 마.map((s) => s.id), 몫: new Map(마.map((s) => [s.id, s.마구리])) })
    } else {
      for (const t of 두께들) {
        const 들 = 마.filter((s) => s.t === t)
        const i = 주.보강.length
        주.보강.push({ 동: '', 층, 부재: 'S-거푸집', 산출식: 둥(들.reduce((a, s) => a + s.마구리, 0) / 1000) + '*' + t / 1000 })
        곳들.set('보강|' + i, { ids: 들.map((s) => s.id), 몫: new Map(들.map((s) => [s.id, s.마구리])) })
      }
      경고.push(층 + '층 슬라브 두께가 여러 가지라 마구리를 두께마다 «보강» 줄로 셈했습니다')
    }
  }
  const 공사 = {
    ver: 1,
    이름: M.이름,
    기준: M.기준,
    층: 층표,
    배근,
    동: [{ 이름: '', 공구: '', 유형: '', 연면적: '', 같은동: '', 층: null, 주자료: 주 }],
    유닛: [],
  }
  return { 공사, 곳들, 경고, G }
}

/* ───────────────────────────── 셈 · 부재별 · 3D · 검사 */
const 항목열쇠 = (x) => (x.항목 === '철근' ? '철근' : x.항목 === '콘크리트' ? (/버림/.test(x.비고 || '') ? '버림' : '콘크리트') : x.항목 === '거푸집' ? '거푸집' : x.항목 === '데크' ? '데크' : '기타')

/**
 * 모델 한 벌 셈
 * @returns {{공사, R, 부재별: Map<id,{콘크리트, 거푸집, 철근, 데크, 버림, 줄: Array}>, 합, 층별, 부호별, 경고, 덩어리, 검사}}
 */
export function 모델셈(M0) {
  const { 공사, 곳들, 경고, G } = 공사로(M0)
  const R = 셈(공사)
  const 부재별 = new Map()
  const 빈 = () => ({ 콘크리트: 0, 거푸집: 0, 철근: 0, 데크: 0, 버림: 0, 줄: [] })
  for (const id of G.기.keys()) 부재별.set(id, 빈())
  let 안나눔 = 0
  for (const x of R.줄) {
    const 곳 = x.곳 && 곳들.get(x.곳.표 + '|' + x.곳.i)
    if (!곳 || !곳.ids.length) { 안나눔++; continue }
    const 열 = 항목열쇠(x)
    let 몫들
    if (곳.몫) { const 합 = [...곳.몫.values()].reduce((a, v) => a + v, 0) || 1; 몫들 = 곳.ids.map((id) => [id, 곳.몫.get(id) / 합]) }
    else 몫들 = 곳.ids.map((id) => [id, 1 / 곳.ids.length])
    for (const [id, w] of 몫들) {
      const b = 부재별.get(id)
      if (!b) continue
      const v = x.수량 * w
      if (열 in b) b[열] += v
      b.줄.push({ ...x, 몫: w, 수량몫: v })
    }
  }
  /* 합 · 층별 · 부호별 · 종류별(철근은 kg) */
  const 합 = { 콘크리트: 0, 거푸집: 0, 철근: 0, 데크: 0, 버림: 0 }
  for (const x of R.줄) { const k = 항목열쇠(x); if (k in 합) 합[k] += x.수량 }
  const 모 = (키) => {
    const m = new Map()
    for (const [id, q] of 부재별) {
      const g = G.기.get(id)
      if (!g) continue
      const k = 키(g)
      if (!m.has(k)) m.set(k, { 개수: 0, 콘크리트: 0, 거푸집: 0, 철근: 0, 데크: 0, 버림: 0 })
      const a = m.get(k)
      a.개수++
      for (const c of ['콘크리트', '거푸집', '철근', '데크', '버림']) a[c] += q[c]
    }
    return m
  }
  const 층차례 = G.M.층.map((f) => f.이름)
  const 층별 = [...모((g) => g.o.층 + '|' + g.o.종류)].map(([k, v]) => { const [층, 종류] = k.split('|'); return { 층, 종류, ...v } })
    .sort((a, b) => 층차례.indexOf(a.층) - 층차례.indexOf(b.층) || 종류들.indexOf(a.종류) - 종류들.indexOf(b.종류))
  const 부호별 = [...모((g) => g.o.종류 + '|' + 글(g.o.부호))].map(([k, v]) => { const [종류, 부호] = k.split('|'); return { 종류, 부호, ...v } })
    .sort((a, b) => 종류들.indexOf(a.종류) - 종류들.indexOf(b.종류) || a.부호.localeCompare(b.부호, 'ko', { numeric: true }))
  const 덩 = 덩어리(G)
  const 검 = 검사(G, 덩, 합, R)
  return { 공사, R, 부재별, 합, 층별, 부호별, 경고: [...경고, ...R.경고.map((w) => w.글)], 덩어리: 덩, 검사: 검, G, 안나눔 }
}

/** 3D 덩어리 — 부재보기(bim3d.js) 꼴 [{id, 판:[[x,y]](mm), z0, z1, 색, 부피(m³)}] */
export function 덩어리(G) {
  const out = []
  const 네모 = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]
  for (const [id, g] of G.기) {
    const 색 = 종류색[g.o.종류]
    let 판 = null, z0 = g.z0, z1 = g.z1, 넓이 = 0
    if (g.o.종류 === '기둥') {
      if (g.원) { 판 = Array.from({ length: 24 }, (_, k) => [g.x + g.원 / 2 * Math.cos(k * Math.PI / 12), g.y + g.원 / 2 * Math.sin(k * Math.PI / 12)]); 넓이 = Math.PI / 4 * g.원 * g.원 }
      else { 판 = 네모(g.x - g.a / 2, g.y - g.b / 2, g.x + g.a / 2, g.y + g.b / 2); 넓이 = g.a * g.b }
    } else if (g.o.종류 === '기초') { 판 = 네모(g.x - g.a / 2, g.y - g.b / 2, g.x + g.a / 2, g.y + g.b / 2); 넓이 = g.a * g.b }
    else if (g.o.종류 === '보' || g.o.종류 === '벽') {
      const w = (g.W || g.T) / 2, s0 = g.s0 + g.좌.값, s1 = g.s1 - g.우.값
      if (!(s1 > s0)) continue
      판 = g.축 === 'x' ? 네모(s0, g.c - w, s1, g.c + w) : 네모(g.c - w, s0, g.c + w, s1)
      넓이 = (s1 - s0) * w * 2
    } else if (g.o.종류 === '슬라브') { 판 = 네모(g.X0, g.Y0, g.X1, g.Y1); 넓이 = (g.X1 - g.X0) * (g.Y1 - g.Y0) }
    if (!판 || !(z1 > z0)) continue
    let 부피 = 넓이 * (z1 - z0) / 1e9
    /* 구멍은 덩어리에 안 그리고 부피에서만 뺌(셈과 맞춤) */
    if (g.o.종류 === '벽' && 글(g.o.구멍)) {
      const m = 글(g.o.구멍).toUpperCase().replace(/\s/g, '').match(/^(\d+(?:\.\d+)?)[X×*](\d+(?:\.\d+)?)(?:[*×](\d+))?$/)
      if (m) 부피 -= +m[1] * +m[2] * (m[3] ? +m[3] : 1) * g.T / 1e9
    }
    if (g.o.종류 === '슬라브' && 수(g.o.구멍, 0) > 0) 부피 -= 수(g.o.구멍, 0) * g.t / 1000
    if (g.o.종류 === '슬라브' && g.기둥빼기) 부피 -= g.기둥빼기 * g.t / 1e9
    out.push({ id, 판, z0, z1, 색, 부피, 종류: g.o.종류, 층: g.o.층, 부호: 글(g.o.부호), ...(g.기둥빼기 ? { FT빼기: true } : {}) })
  }
  return out
}

/** 검사 — ① 덩어리 부피 합 = 셈 콘크리트(버림 뺌) ② 덩어리끼리 겹친 곳(같은 콘크리트를 두 번 셈) */
export function 검사(G, 덩, 합, R) {
  const 줄 = []
  const 부피 = 덩.reduce((a, d) => a + d.부피, 0)
  const 콘 = 합.콘크리트
  const 차 = 콘 - 부피
  줄.push({ 좋음: Math.abs(차) <= Math.max(0.002 * R.줄.filter((x) => x.항목 === '콘크리트').length, 0.01), 글: '3D 덩어리 부피 ' + 부피.toFixed(3) + ' ㎥ · 산출서 콘크리트 ' + 콘.toFixed(3) + ' ㎥ (차 ' + 차.toFixed(3) + ' — 줄마다 소수 셋째 자리 반올림 몫)' })
  /* 겹침 — 네모 덩어리끼리(원형은 바깥 네모로) · 칸 나눔으로 빠르게 */
  const 상자 = 덩.map((d) => { const xs = d.판.map((p) => p[0]), ys = d.판.map((p) => p[1]); return { d, x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) } })
  const 칸 = 2000
  const 통 = new Map()
  상자.forEach((b, k) => {
    for (let i = Math.floor(b.x0 / 칸); i <= Math.floor((b.x1 - 1e-6) / 칸); i++) for (let j = Math.floor(b.y0 / 칸); j <= Math.floor((b.y1 - 1e-6) / 칸); j++) {
      const key = i + '|' + j
      if (!통.has(key)) 통.set(key, [])
      통.get(key).push(k)
    }
  })
  const 본 = new Set()
  const 겹친 = []
  /* 🧭 G389 벽 «상부» 를 정한 값(도면 셈 — 슬라브 두께만 뺌 · 내역서식)으로 둔 벽 ↔ 그 위 보: 보 춤 몫을 둘 다 셈 — 잘못이 아니라 셈 방식이라 따로 알림 */
  const 정상부 = (d) => { const g = d.종류 === '벽' && G.기.get(d.id); return !!(g && g.o && 수(g.o.상부, null) !== null) }
  let 벽보 = 0, 벽보n = 0
  for (const 목록 of 통.values()) for (let a = 0; a < 목록.length; a++) for (let b = a + 1; b < 목록.length; b++) {
    const i = 목록[a], j = 목록[b]
    const 키 = i < j ? i + '|' + j : j + '|' + i
    if (본.has(키)) continue
    본.add(키)
    const A = 상자[i], B = 상자[j]
    if ((A.d.종류 === '기둥' && B.d.종류 === '슬라브' && B.d.FT빼기) || (B.d.종류 === '기둥' && A.d.종류 === '슬라브' && A.d.FT빼기)) continue   // FT 바닥 슬라브에서 이미 뺀 기둥 몫
    const dx = Math.min(A.x1, B.x1) - Math.max(A.x0, B.x0), dy = Math.min(A.y1, B.y1) - Math.max(A.y0, B.y0), dz = Math.min(A.d.z1, B.d.z1) - Math.max(A.d.z0, B.d.z0)
    if (dx > 0.5 && dy > 0.5 && dz > 0.5) {
      const v = dx * dy * dz / 1e9
      if (v >= 0.0005 && ((A.d.종류 === '보' && 정상부(B.d)) || (B.d.종류 === '보' && 정상부(A.d)))) { 벽보 += v; 벽보n++; continue }
      if (v >= 0.0005) 겹친.push({ ids: [A.d.id, B.d.id], 부피: v, 글: A.d.층 + '층 ' + A.d.종류 + ' ' + A.d.부호 + ' ↔ ' + B.d.층 + '층 ' + B.d.종류 + ' ' + B.d.부호 + ' — ' + v.toFixed(3) + ' ㎥' })
    }
  }
  겹친.sort((a, b) => b.부피 - a.부피)
  if (겹친.length) 줄.push({ 좋음: false, 글: '겹친 곳 ' + 겹친.length + '군데(같은 콘크리트를 두 번 셈 · 합 ' + 겹친.reduce((a, x) => a + x.부피, 0).toFixed(3) + ' ㎥) — 아래 목록을 눌러 3D 에서 보십시오', 겹친 })
  else 줄.push({ 좋음: true, 글: '겹친 덩어리 없음(같은 콘크리트를 두 번 세지 않음)' })
  if (벽보n) 줄.push({ 좋음: true, 알림: true, 글: '벽 위 보 ' + 벽보n + '군데 ' + 벽보.toFixed(3) + ' ㎥ 는 벽과 보에 둘 다 셈 — 도면 셈(내역서식: 벽 높이 = 층고 − 슬라브)대로 둔 벽 · 벽에서 빼려면 그 벽의 «위에서 뺄 몫» 을 비우십시오' })
  return 줄
}

/** 부재 이름(화면 · 엑셀) */
export function 부재글(M, o) {
  const 이름 = (id) => (M.통심.x.find((g) => g.id === id) || M.통심.y.find((g) => g.id === id) || {}).이름 || id
  if (o.칸) return 이름(o.칸[0]) + '~' + 이름(o.칸[2]) + ' / ' + 이름(o.칸[1]) + '~' + 이름(o.칸[3])
  if (o.끝) return 이름(o.점[0]) + '-' + 이름(o.점[1]) + ' ~ ' + 이름(o.끝[0]) + '-' + 이름(o.끝[1])
  return 이름(o.점[0]) + '-' + 이름(o.점[1])
}

/** 엑셀에 붙일 «부재별» · «모델» 시트 */
export function 모델시트(M0, S, ST) {
  const M = 정돈(M0)
  const 차 = M.층.map((f) => f.이름)
  const 목록 = [...M.부재].filter((o) => S.G.기.has(o.id)).sort((a, b) => 차.indexOf(a.층) - 차.indexOf(b.층) || 종류들.indexOf(a.종류) - 종류들.indexOf(b.종류) || a.id - b.id)
  const rows = 목록.map((o, i) => {
    const q = S.부재별.get(o.id) || {}
    const g = S.G.기.get(o.id)
    const 높글 = g.높이 ? ' · 높이 ' + g.높이 : ''
    const 크기 = g.o.종류 === '기둥' ? (g.원 ? 'Ø' + g.원 : g.a + '×' + g.b) + 높글 : g.o.종류 === '보' ? g.W + '×' + g.H + ' · 안목 ' + Math.round(g.안) : g.o.종류 === '벽' ? 'T' + g.T + ' · 길이 ' + Math.round(g.안) + 높글 : g.o.종류 === '슬라브' ? Math.round(g.X1 - g.X0) + '×' + Math.round(g.Y1 - g.Y0) + ' · T' + g.t : g.a + '×' + g.b + '×' + g.t
    return [i + 1, o.층, o.종류, 글(o.부호), 부재글(M, o), 크기,
      { v: +(q.콘크리트 || 0).toFixed(4), st: ST.QTY }, { v: +(q.거푸집 || 0).toFixed(3), st: ST.QTY }, { v: +((q.철근 || 0) / 1000).toFixed(4), st: ST.QTY }, o.id]
  })
  const 시트 = [{ name: '부재별', head: ['번호', '층', '부재', '부호', '자리(통심)', '크기(mm)', '콘크리트(㎥)', '거푸집(㎡)', '철근(ton)', '부재 번호'], rows, widths: [6, 6, 7, 8, 26, 26, 12, 12, 12, 9], freeze: 1 }]
  시트.push({
    name: '모델',
    head: ['구분', '내용'],
    rows: [
      ['통심 X', M.통심.x.map((g) => g.이름 + ' ' + g.자리).join(' · ')],
      ['통심 Y', M.통심.y.map((g) => g.이름 + ' ' + g.자리).join(' · ')],
      ...M.층.map((f) => ['층 ' + f.이름, FT층(f) ? '기초 · 지중보 · 맨 아래 바닥 · 기초 윗면 깊이 ' + (수(f.내림, 0) || 0) + ' mm' : '층고 ' + f.층고 + ' · 슬라브 ' + f.슬라브]),
      ...S.검사.map((z) => [z.좋음 ? '검사 ✓' : '검사 ⚠', z.글]),
      ...S.경고.map((w) => ['경고', w]),
      ['만든 곳', 'K-건설맵 골조 모델(k-conmap.com/jeoksan/model) — 셈은 골조 수량산출과 같은 규칙'],
    ],
    widths: [14, 120],
  })
  return 시트
}
