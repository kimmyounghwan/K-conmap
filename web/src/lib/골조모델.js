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
 *            높이?(기둥 · 벽 mm — 그 층 바닥에서 윗면까지 · 비면 층고 · 🧭 G389 도면 단면 · 지붕 높이) , 상부?(벽 mm — 위에서 뺄 몫 · 비면 규칙),
 *            🟨 G392 판?(기초 — 자유 모양 꼭짓점 [[x, y]] mm · 통심 좌표와 같음 → MAT · 부정형 기초 = 면적 × 두께 · 둘레 × 두께 · m²당 철근) · 두께?(판 기초 mm · 비면 일람) · 윗면?(mm ≤ 0 — 기초 윗면에서 내려간 깊이 · MAT 밑 피트)
 *            🪜 G393 계단: 판(오르는 판 자리 네모 [[x, y]] mm — 참은 그 앞뒤 바깥) · 판수(꺾어 오르는 판 수 · 되돌림 = 2) · 길이(한 판 수평 길이) · 폭(한 판 폭) ·
 *              하단참 · 상단참(참 깊이 — 상단참 = 중간참) · 단수?(비면 층고 ÷ 판수 ÷ 단 높이) · L정착 · W정착 · 가로?(x 로 오름) · 참끝?(1 = 중간참이 x · y 큰 쪽) — 골조 셈 «5. 계단» 줄 그대로
 *            제안?(글 — 건설맵이 도면대로 먼저 세운 것 · 사람이 «✓ 이대로» 누르기 전 · 셈에는 넣고 노랗게) · 확인?(✓ 누른 때) }
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
/* 🟨 G392 자유 모양(판) — 넓이 mm² · 둘레 mm · 둘러싼 네모 · 점이 안에 있나 · 네모로 자른 넓이(겹침 검사) */
export const 판넓이 = (P) => { let a = 0; for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length]; a += p[0] * q[1] - q[0] * p[1] } return Math.abs(a) / 2 }
export const 판둘레 = (P) => { let l = 0; for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length]; l += Math.hypot(q[0] - p[0], q[1] - p[1]) } return l }
const 판상자 = (P) => { let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity; for (const p of P) { a = Math.min(a, p[0]); b = Math.min(b, p[1]); c = Math.max(c, p[0]); d = Math.max(d, p[1]) } return [a, b, c, d] }
export const 판안 = (P, x, y) => { let 안 = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) 안 = !안 } return 안 }
function 네모로자름(P, x0, y0, x1, y1) {
  let 점 = P
  const 자름 = (안, 교) => { const out = []; for (let i = 0; i < 점.length; i++) { const a = 점[i], b = 점[(i + 1) % 점.length]; const ia = 안(a), ib = 안(b); if (ia) out.push(a); if (ia !== ib) out.push(교(a, b)) } 점 = out }
  const x에서 = (v) => (a, b) => [v, a[1] + ((b[1] - a[1]) * (v - a[0])) / (b[0] - a[0])]
  const y에서 = (v) => (a, b) => [a[0] + ((b[0] - a[0]) * (v - a[1])) / (b[1] - a[1]), v]
  자름((p) => p[0] >= x0, x에서(x0)); if (!점.length) return 0
  자름((p) => p[0] <= x1, x에서(x1)); if (!점.length) return 0
  자름((p) => p[1] >= y0, y에서(y0)); if (!점.length) return 0
  자름((p) => p[1] <= y1, y에서(y1))
  return 점.length >= 3 ? 판넓이(점) : 0
}
const 네모판 = (P) => P.length === 4 && new Set(P.map((p) => p[0])).size === 2 && new Set(P.map((p) => p[1])).size === 2
/** 간격 배근(D19@200 …) → m²당 철근 «D19:5 D22:5»(플랜트 기초와 같은 셈) */
export function 간격단위(칸들) {
  const 합 = new Map()
  for (const c of 칸들) { const m = /D\s*(\d{2})\s*@\s*(\d{2,4})/i.exec(String(c || '')); if (!m || !(+m[2] > 0)) continue; const d = 'D' + m[1]; 합.set(d, (합.get(d) || 0) + 1000 / +m[2]) }
  return [...합].map(([d, v]) => d + ':' + (Math.round(v * 1000) / 1000)).join(' ')
}

export const 종류들 = ['기둥', '보', '벽', '슬라브', '기초', '계단']
export const 종류색 = { 기둥: [0.80, 0.42, 0.30], 보: [0.30, 0.55, 0.85], 벽: [0.62, 0.62, 0.55], 슬라브: [0.78, 0.80, 0.84], 기초: [0.55, 0.47, 0.38], 계단: [0.36, 0.66, 0.46] }
export const 제안색 = [0.96, 0.78, 0.18]      // 🟨 G392 건설맵이 먼저 세운 것(확인 전)
export const 종류표 = { 기둥: '기둥', 보: '보', 벽: '벽', 슬라브: '슬라브', 기초: '기초', 계단: '계단' }
/** 배근표 칸 이름(골조.js 배근 열쇠) */
const 배근열쇠 = { 기둥: '기둥', 보: '보', 벽: '벽', 슬라브: '슬라브', 기초: '기초', 계단: '계단' }
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

/**
 * 🧪 G393 작업 화면 예시(가상 — 실제 현장 아님) — 소장님 「이걸로 예시를 해줘」: 예시 2층 라멘조에 새 기능을 다 넣어 한 번에 해 보게
 *   🪜 계단(1층 · X3~X4 / Y2~Y3 칸 — 그 칸 1층 바닥 슬라브는 계단 구멍으로 뺌) 🟨 제안 · 🟨 MAT(EV 피트 MF1) 제안 · 🟥 빨간 곳 둘(비스듬한 보 · 일람에 없는 벽) ·
 *   📚 도면함(가상 평면 넷 · ☑) · 🧾 층별 대조 · ▭ 구간 둘(A팀 · B팀) · 📄 도면 덧줄(MAT 추가 보강근 한 줄) · 🗂 골조에 안 쓴 도면(건축 · 토목)
 */
export function 작업예시모델() {
  let M = 예시모델()
  M.이름 = '가상 예시 — 2층 라멘조 · 계단 · 구간 · 도면함 (실제 현장 아님)'
  M.배근 = {
    ...M.배근,
    계단: [{ 기호: 'ST1', 두께: '150', 주근: 'D13@150', 상부주근: '', 배력근: 'D10@200', 참주근: '', 참배력근: '', 배근: '단배근', 단높이: '', 단너비: '' }],
    기초: [...M.배근.기초, { 기호: 'MF1', 종류: '부정형', 가로: '', 세로: '', 두께: '800', 하부가로: 'D19@200', 하부세로: 'D19@200', 상부가로: 'D19@200', 상부세로: 'D19@200' }],
  }
  /* 계단 구멍 — 1층 바닥(1층 위 슬라브) X3~X4 / Y2~Y3 칸을 뺌 */
  M = { ...M, 부재: M.부재.filter((o) => !(o.종류 === '슬라브' && o.층 === '1' && o.칸 && o.칸.join() === 'x3,y2,x4,y3')) }
  const 판 = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]
  let id = M.다음
  M.부재.push({ id: id++, 종류: '계단', 층: '1', 부호: 'ST1', 판: 판(15500, 7000, 19500, 10000), 판수: 2, 길이: 4000, 폭: 1500, 하단참: 1500, 상단참: 1500, L정착: 2, W정착: 0, 가로: true, 참끝: 1, 제안: '도면 계단판 자리 그대로 · 판 2 · 길이 4000 · 폭 1500 · 참 1500 / 1500 · 단수 = 층고 ÷ 판 수 ÷ 단 높이 175(도면에 없음 — 단수 확인)' })
  M.부재.push({ id: id++, 종류: '기초', 층: 'FT', 부호: 'MF1', 판: [[2500, 7800], [4800, 7800], [4800, 9200], [4100, 9200], [4100, 10200], [2500, 10200]], 두께: 800, 제안: '도면 외곽선 그대로 · 두께 = 도면 높이 800 mm(EV 피트)' })
  M.다음 = id
  /* 📚 도면함 — 가상 평면 넷 · 부재마다 근거(평면 · 원 = 도면 부재 번호) */
  const 함 = [
    { 키: '0|기초구조평면도', 제목: '기초 구조평면도', 파일: 'S-201 기초 구조평면도(가상).dwg', 층: ['FT'] },
    { 키: '1|2층구조평면도', 제목: '2층 구조평면도', 파일: 'S-202 2층 구조평면도(가상).dwg', 층: ['1'] },
    { 키: '2|지붕구조평면도', 제목: '지붕 구조평면도', 파일: 'S-203 지붕 구조평면도(가상).dwg', 층: ['2'] },
    { 키: '3|계단확대평면도', 제목: '계단 확대평면도', 파일: 'S-301 계단 확대평면도(가상).dwg', 층: ['1'] },
  ]
  const 키 = (o) => (o.종류 === '계단' ? 함[3] : o.층 === 'FT' ? 함[0] : o.층 === '1' ? 함[1] : 함[2])
  M.부재 = M.부재.map((o) => { const p = 키(o); return { ...o, 근거: { 평면: p.파일.replace(/\.dwg$/, '') + ' · ' + p.제목, 키: p.키, 원: o.id } } })
  /* 🟥 빨간 곳 — 손으로 할 곳 둘 */
  M.빠짐 = [
    { 종류: '보', 층: '2', 기호: '2B5', 까닭: '비스듬한 보', 판: [[1000, 1200], [1250, 1000], [6250, 4800], [6000, 5000]], 높: 600, 키: 함[2].키 },
    { 종류: '벽', 층: '1', 기호: 'W9', 까닭: '일람표에 없는 기호', 판: 판(6900, 1500, 7100, 4500), 높: 3600, 키: 함[1].키 },
  ]
  M.도면함 = 함.map((p) => ({ ...p, 부재: M.부재.filter((o) => o.근거.키 === p.키).length, 못옮김: M.빠짐.filter((x) => x.키 === p.키).length }))
  /* ▭ 구간 둘 · 📄 도면 덧줄(MAT 추가 보강근) · 🗂 골조에 안 쓴 도면 */
  M = 구간넣기(구간넣기(M, [-1000, -1000, 10500, 13000], 'A팀'), [10500, -1000, 22000, 13000], 'B팀')
  M.덧줄 = [{ k: 0, 표: '보강', row: { 동: '', 층: 'FT', 부재: 'F-D16', 산출식: '12*2.3' } }]
  M.도면따로 = [{ 이름: 'A-111 평면도(가상).dwg', 종: '건축' }, { 이름: '02-1 공사계획평면도(가상).dwg', 종: '토목' }]
  /* 🧾 층별 대조 — 도면 = 세움 + 🟥 + 한 번만(2층 구조평면도의 보 하나를 계단 확대평면도에도 그림 → 한 번만) · 도면 셈 콘크리트 = 이 모델(가상이라 같음) */
  const S = 모델셈(M)
  M.대조 = {}
  for (const f of M.층) {
    const 세 = M.부재.filter((o) => o.층 === f.이름).length, 붉 = M.빠짐.filter((x) => x.층 === f.이름).length
    M.대조[f.이름] = { 도면: 세 + 붉 + (f.이름 === '1' ? 1 : 0), 겹침: 0, 콘: Math.round(S.층별.filter((r) => r.층 === f.이름).reduce((a, r) => a + r.콘크리트, 0) * 1000) / 1000 }
  }
  return 정돈(M)
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
  /* 🚶 G390 점검사항(둘러보기에서 넣은 것) · 빠짐(도면에서 못 옮긴 것 — 3D 빨강) — 있을 때만 */
  if (Array.isArray(m.점검) && m.점검.length) M.점검 = m.점검.filter((x) => x && typeof x === 'object')
  if (Array.isArray(m.빠짐) && m.빠짐.length) M.빠짐 = m.빠짐.filter((x) => x && Array.isArray(x.판))
  if (m.도면에서 && typeof m.도면에서 === 'object') M.도면에서 = m.도면에서
  /* ▭ G393 구간(팀별 · 기성 구간 — 평면 네모 mm) */
  if (Array.isArray(m.구간) && m.구간.length) M.구간 = m.구간.filter((z) => z && 글(z.id) && Array.isArray(z.판) && z.판.length === 4).map((z) => ({ id: 글(z.id), 이름: 글(z.이름) || 글(z.id), 판: z.판.map((v) => 수(v, 0)) }))
  /* 🛣 G393 골조에 안 쓴 도면(토목 · 건축 · 그 밖 — 이름만) */
  if (Array.isArray(m.도면따로) && m.도면따로.length) M.도면따로 = m.도면따로.filter((d) => d && 글(d.이름)).map((d) => ({ 이름: 글(d.이름), 종: 글(d.종) || '그 밖' }))
  /* 🧾 G393 층별 대조(도면 부재 수 · 겹쳐 한 번 · 도면 셈 콘크리트 — 도면 넣을 때) */
  if (m.대조 && typeof m.대조 === 'object') M.대조 = m.대조
  /* 📚 G393 도면함(넣은 평면 목록 — ☑ 체크로 빼고 넣음) · 도면원(☐ 뺀 평면의 부재 · 빨간 곳을 넣어 둔 곳 — 셈에 안 들어감) */
  if (Array.isArray(m.도면함) && m.도면함.length) M.도면함 = m.도면함.filter((p) => p && 글(p.키)).map((p) => ({ 키: 글(p.키), 제목: 글(p.제목), 파일: 글(p.파일), 층: Array.isArray(p.층) ? p.층.map(글) : [], 부재: 수(p.부재, 0) || 0, 못옮김: 수(p.못옮김, 0) || 0 }))
  if (m.도면원 && (Array.isArray(m.도면원.부재) || Array.isArray(m.도면원.빠짐))) M.도면원 = { 부재: (m.도면원.부재 || []).filter((o) => o && 종류들.includes(o.종류)), 빠짐: (m.도면원.빠짐 || []).filter((x) => x && Array.isArray(x.판)) }
  /* 🪜 G393 도면 덧줄(골조 셈 보강 · 보강근 · Dry Area 줄 — MAT 추가 보강근 · 구조물 판) */
  if (Array.isArray(m.덧줄) && m.덧줄.length) M.덧줄 = m.덧줄.filter((x) => x && x.row && ['보강', '보강근', '드라이에리어'].includes(x.표))
  if (!FT층(M.층[0])) M.층 = [{ 이름: 'FT', 층고: 0, 슬라브: 0, 내림: 0 }, ...M.층]
  for (const k of Object.keys(d.배근)) if (!Array.isArray(M.배근[k])) M.배근[k] = []
  const 큰 = [...M.부재, ...((M.도면원 && M.도면원.부재) || [])].reduce((a, o) => Math.max(a, 수(o.id, 0) || 0), 0)      // 넣어 둔 부재 번호와도 안 겹치게
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

/**
 * 🪜 G393 계단 하나 — 두 모서리(통심) 사이 네모 = 오르는 판 자리(되돌림 계단: 판 둘이 나란히 · 참은 그 앞뒤 바깥)
 *   긴 쪽 = 오르는 방향 · 길이 = 긴 쪽 · 폭 = 짧은 쪽 ÷ 판 수 · 참 0(오른쪽에서 넣음) · 같은 자리면 부호만 바꿈
 */
export function 계단넣기(M, 층, 부호, x0, y0, x1, y1, 판수 = 2) {
  const X = new Map(M.통심.x.map((g) => [g.id, g.자리])), Y = new Map(M.통심.y.map((g) => [g.id, g.자리]))
  if (![x0, x1].every((k) => X.has(k)) || ![y0, y1].every((k) => Y.has(k))) return M
  const a = Math.min(X.get(x0), X.get(x1)), c = Math.max(X.get(x0), X.get(x1)), b = Math.min(Y.get(y0), Y.get(y1)), d = Math.max(Y.get(y0), Y.get(y1))
  if (!(c > a && d > b)) return M
  const 판 = [[a, b], [c, b], [c, d], [a, d]]
  const 있 = M.부재.find((o) => o.종류 === '계단' && o.층 === 층 && JSON.stringify(o.판) === JSON.stringify(판))
  if (있) return { ...M, 부재: M.부재.map((o) => (o === 있 ? { ...o, 부호 } : o)) }
  const 가로 = c - a >= d - b
  const [id, M2] = 새번호(M)
  return { ...M2, 부재: [...M2.부재, { id, 종류: '계단', 층, 부호, 판, 판수, 길이: Math.round(가로 ? c - a : d - b), 폭: Math.round((가로 ? d - b : c - a) / 판수), 하단참: 0, 상단참: 0, L정착: 2, W정착: 0, 가로, 참끝: 1 }] }
}

export function 부재빼기(M, ids) {
  const s = new Set([].concat(ids))
  return { ...M, 부재: M.부재.filter((o) => !s.has(o.id)) }
}
export function 부재고치기(M, id, 고칠) {
  return { ...M, 부재: M.부재.map((o) => (o.id === id ? { ...o, ...고칠 } : o)) }
}

/**
 * ✂ G390 보 · 벽을 한 자리에서 둘로 — 자리 = 그 부재 축 위 mm(통심 자리와 같은 좌표) · 그 자리에 보조 통심을 더함(이미 있으면 그 줄)
 *   두 토막은 같은 줄로 곧게 이어져 «이어짐»(공제 0) — 콘크리트 · 거푸집 합은 그대로 · 보는 한 열(주근 이어짐)
 *   끝에서 50 mm 안 · 가로 · 세로가 아닌 것은 그대로 돌려줌 · 문 · 창(구멍)은 앞 토막에 남김
 */
export function 부재나누기(M, id, 자리) {
  const o = M.부재.find((x) => x.id === id)
  if (!o || !(o.종류 === '보' || o.종류 === '벽') || !o.점 || !o.끝) return M
  const 가로 = o.점[1] === o.끝[1] && o.점[0] !== o.끝[0], 세로 = o.점[0] === o.끝[0] && o.점[1] !== o.끝[1]
  if (!가로 && !세로) return M
  const 축 = 가로 ? 'x' : 'y', 칸 = 가로 ? 0 : 1
  const 줄 = M.통심[축]
  const a = (줄.find((g) => g.id === o.점[칸]) || {}).자리, b = (줄.find((g) => g.id === o.끝[칸]) || {}).자리
  const v = Math.round(수(자리, NaN) / 5) * 5
  if (!Number.isFinite(a) || !Number.isFinite(b) || !(v > Math.min(a, b) + 50 && v < Math.max(a, b) - 50)) return M
  let N = M
  let g = 줄.find((u) => Math.abs(u.자리 - v) < 0.5)
  if (!g) {
    const 본 = 줄.filter((u) => !/[+−-]\d+$/.test(글(u.이름)) && u.자리 < v).pop()
    const 이름 = 본 ? 글(본.이름) + '+' + Math.round(v - 본.자리) : ''
    N = 통심더하기(N, 축, v, 이름)
    g = N.통심[축].find((u) => Math.abs(u.자리 - v) < 0.5 && !줄.includes(u))
  }
  const 중 = 가로 ? [g.id, o.점[1]] : [o.점[0], g.id]
  const [id2, N2] = 새번호(N)
  const 앞 = { ...o, 끝: 중 }, 뒤 = { ...o, id: id2, 점: 중 }
  delete 뒤.구멍
  return { ...N2, 부재: N2.부재.flatMap((x) => (x.id === id ? [앞, 뒤] : [x])) }
}

/**
 * ✋ G393 부재 옮기기(마우스로 끌어 옮김) — 소장님 「나누기를 해야 하면, 지정을 해서 떼어서 옆으로 둘 수 있게 … 마우스로 조정해서」
 *   dx · dy(mm) 만큼 — 통심에 선 부재(기둥 · 기초 · 보 · 벽 · 슬라브)는 옮긴 자리 가까운 통심(붙음 mm 안)에 붙이고 없으면 그 자리에 보조 통심(«X2+1500» 꼴 · 5 mm 맞춤)
 *   자유 모양(MAT · 계단 — 판)은 꼭짓점을 그대로 옮김(5 mm 맞춤) · 20 mm 안 움직임은 그 방향 그대로
 */
export function 부재옮기기(M, id, dx, dy, 붙음 = 100) {
  const o = M.부재.find((x) => x.id === id)
  if (!o) return M
  const 둥5 = (v) => Math.round(v / 5) * 5
  const ddx = Math.abs(dx) < 20 ? 0 : dx, ddy = Math.abs(dy) < 20 ? 0 : dy
  if (!ddx && !ddy) return M
  if (Array.isArray(o.판) && o.판.length >= 3) {
    const 판 = o.판.map((p) => [둥5(수(p[0], 0) + ddx), 둥5(수(p[1], 0) + ddy)])
    return { ...M, 부재: M.부재.map((x) => (x.id === id ? { ...x, 판 } : x)) }
  }
  let N = M
  const 옮긴줄 = (축, gid, d) => {
    if (!d) return gid
    const 줄 = N.통심[축]
    const g0 = 줄.find((g) => g.id === gid)
    if (!g0) return gid
    const v = g0.자리 + d
    const 가까 = 줄.reduce((m, g) => (Math.abs(g.자리 - v) < Math.abs((m ? m.자리 : Infinity) - v) ? g : m), null)
    if (가까 && Math.abs(가까.자리 - v) <= 붙음) return 가까.id
    const vv = 둥5(v)
    const 본 = 줄.filter((g) => !/[+−-]\d+$/.test(글(g.이름)) && g.자리 < vv).pop()
    const 이름 = 본 ? 글(본.이름) + '+' + Math.round(vv - 본.자리) : 축.toUpperCase() + '+' + vv
    const 앞 = new Set(줄.map((g) => g.id))
    N = 통심더하기(N, 축, vv, 이름)
    return (N.통심[축].find((g) => !앞.has(g.id)) || {}).id || gid
  }
  const 새 = { ...o }
  if (o.칸) { const [x0, y0, x1, y1] = o.칸; 새.칸 = [옮긴줄('x', x0, ddx), 옮긴줄('y', y0, ddy), 옮긴줄('x', x1, ddx), 옮긴줄('y', y1, ddy)] }
  if (o.점) 새.점 = [옮긴줄('x', o.점[0], ddx), 옮긴줄('y', o.점[1], ddy)]
  if (o.끝) 새.끝 = [옮긴줄('x', o.끝[0], ddx), 옮긴줄('y', o.끝[1], ddy)]
  if (새.칸 && (새.칸[0] === 새.칸[2] || 새.칸[1] === 새.칸[3])) return M
  if (새.끝 && 새.점[0] === 새.끝[0] && 새.점[1] === 새.끝[1]) return M
  return { ...N, 부재: N.부재.map((x) => (x.id === id ? 새 : x)) }
}

/** 층 복사 — 가져올 층의 부재를 받을 층(들)에 그대로(받을 층에 있던 같은 종류 부재는 지우고) · 종류들 = 옮길 종류 */
export function 층복사(M, 가져올, 받을들, 옮길 = ['기둥', '보', '벽', '슬라브', '계단']) {
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
  const 판 = (층) => { if (!층의.has(층)) 층의.set(층, { 기둥: new Map(), 기초: new Map(), 판기초: [], 보: [], 벽: [], 슬라브: [], 계단: [] }); return 층의.get(층) }
  const 이름표 = (o) => 종류표[o.종류] + ' ' + 글(o.부호) + ' (' + o.층 + '층' + (o.점 ? ' · ' + 이름(o.점[0]) + '-' + 이름(o.점[1]) : '') + ')'

  for (const o of M.부재) {
    if (!H.표.has(o.층)) { 경고.push(이름표(o) + ' — 층 «' + o.층 + '» 이 층 목록에 없어 뺐습니다'); continue }
    const r = 일람(M, o.종류, o.부호)
    if (!r) { 경고.push(이름표(o) + ' — 부호 «' + 글(o.부호) + '» 가 ' + 종류표[o.종류] + ' 일람에 없습니다'); continue }
    const g = { o, r, id: o.id }
    if (o.종류 === '계단') {
      /* 🪜 G393 계단 — 그 층 바닥에서 위층 바닥까지(층고) · 오르는 판 자리(네모) · 판 수 · 길이 · 폭 · 참 · 단(골조 셈 «5. 계단» 과 같은 값) */
      const f = H.표.get(o.층)
      if (f.FT) { 경고.push(이름표(o) + ' — 계단은 FT 층에 두지 않습니다(그 층 바닥에서 위층 바닥까지 오름)'); continue }
      const P = Array.isArray(o.판) ? o.판.map((p) => [수(p && p[0], NaN), 수(p && p[1], NaN)]) : []
      if (P.length < 3 || !P.every((p) => Number.isFinite(p[0]) && Number.isFinite(p[1]))) { 경고.push(이름표(o) + ' — 계단 자리(네모)가 없습니다'); continue }
      const [a, b, c, d] = 판상자(P)
      g.상 = [a, b, c, d]; g.판 = P; g.x = (a + c) / 2; g.y = (b + d) / 2
      g.판수 = Math.max(1, Math.trunc(수(o.판수, 2)) || 2)
      const L0 = 수(o.길이, 0) || 0
      g.가로 = o.가로 !== undefined && o.가로 !== null && o.가로 !== '' ? !!o.가로 : L0 > 0 ? Math.abs(c - a - L0) <= Math.abs(d - b - L0) : c - a >= d - b
      g.L = L0 > 0 ? L0 : g.가로 ? c - a : d - b
      g.W = 수(o.폭, 0) > 0 ? 수(o.폭, 0) : (g.가로 ? d - b : c - a) / g.판수
      /* 참 — 골조 셈과 같게(한쪽만 적으면 다른 쪽도 그 값) */
      let 아 = 수(o.하단참, null), 위 = 수(o.상단참, null)
      if (아 === null && 위 !== null) 아 = 위
      if (위 === null && 아 !== null) 위 = 아
      g.아 = 아 || 0; g.위 = 위 || 0
      g.참끝 = o.참끝 === 0 || o.참끝 === '0' ? 0 : 1
      g.T = 수(r.두께, 0) || 0
      g.H = f.층고
      g.L정착 = Math.min(Math.max(Math.trunc(수(o.L정착, 2) ?? 2), 0), 2); g.W정착 = Math.min(Math.max(Math.trunc(수(o.W정착, 0) ?? 0), 0), 2)
      if (!(g.H > 0)) { 경고.push(이름표(o) + ' — 층고가 없습니다(① 통심 · 층)'); continue }
      if (!(g.T > 0 && g.L > 0 && g.W > 0)) { 경고.push(이름표(o) + ' — 두께(일람) · 길이 · 폭 중 빈 것이 있습니다'); continue }
      g.h2 = g.H / g.판수
      g.단높이 = 수(r.단높이, 0) || 175
      g.n = Math.trunc(수(o.단수, 0)) > 0 ? Math.trunc(수(o.단수, 0)) : Math.max(1, Math.round(g.h2 / g.단높이))
      g.s = Math.sqrt(g.L * g.L + g.h2 * g.h2)
      g.z0 = f.z0; g.z1 = f.z1
      판(o.층).계단.push(g)
      기.set(o.id, g)
      continue
    }
    if (o.종류 === '기초' && Array.isArray(o.판) && o.판.length >= 3) {
      /* 🟨 G392 자유 모양 기초(MAT · 부정형) — 꼭짓점 그대로 · 두께 = 부재 두께(도면 높이) · 없으면 일람 두께 */
      if (!FT층(M.층.find((f) => f.이름 === o.층))) 경고.push(이름표(o) + ' — 기초는 FT 층에 둡니다(셈은 그대로 함)')
      const P = o.판.map((p) => [수(p && p[0], NaN), 수(p && p[1], NaN)])
      if (!P.every((p) => Number.isFinite(p[0]) && Number.isFinite(p[1]))) { 경고.push(이름표(o) + ' — 모양 꼭짓점이 숫자가 아닙니다'); continue }
      const [a, b, c, d] = 판상자(P)
      g.판 = P; g.넓 = 판넓이(P); g.둘 = 판둘레(P); g.x = (a + c) / 2; g.y = (b + d) / 2; g.a = c - a; g.b = d - b
      g.t = 수(o.두께, 0) || 수(r.두께, 0) || 0
      if (!(g.넓 > 0 && g.t > 0)) { 경고.push(이름표(o) + ' — 넓이 · 두께가 없습니다'); continue }
      판(o.층).판기초.push(g)
      기.set(o.id, g)
      continue
    }
    if (o.종류 === '기둥' || o.종류 === '기초') {
      if (!o.점 || !(X.has(o.점[0]) && Y.has(o.점[1]))) { 경고.push(이름표(o) + ' — 통심이 없어 뺐습니다'); continue }
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
    /* 🧩 G393 구멍 · 꺾인 바깥의 안쪽 모서리 — 두 슬라브가 둘 다 보 · 벽 바깥 면까지 넓혀 같은 모서리(보가 만나는 자리 위)를 두 번 덮음
       → 세로 변(왼 · 오른)으로 넓힌 쪽이 그 몫을 «개구부» 로 뺌(벽 모서리 규칙과 같게 가로가 모서리까지) · 둘 다 세로면 뒤(아래 → 위 · 왼 → 오른) 것이 뺌 */
    for (const s of P.슬라브) for (const u of P.슬라브) {
      if (!(s.id < u.id)) continue
      /* 꼭짓점 하나만 맞닿은 대각선 두 칸만(안쪽 모서리) — 칸끼리 겹치거나 틈이 있는 것은 여기서 안 건드리고 검사 «겹친 곳» 으로(G394 겹침 정리) */
      if (!((s.x1 === u.x0 || s.x0 === u.x1) && (s.y1 === u.y0 || s.y0 === u.y1))) continue
      const dx = 겹(s.X0, s.X1, u.X0, u.X1), dy = 겹(s.Y0, s.Y1, u.Y0, u.Y1)
      if (!(dx > 0.5 && dy > 0.5)) continue
      /* g 가 세로 변(왼 · 오른)으로 넓힌 몫이 h 와 겹치나 — h 가 g 의 통심 칸 밖(넓힌 띠) 쪽에 있음 */
      const 세넓 = (g, h) => (g.넓.왼 > 0 && h.X1 > g.X0 && h.X1 <= g.x0 + 0.5) || (g.넓.오른 > 0 && h.X0 < g.X1 && h.X0 >= g.x1 - 0.5)
      const 뒤 = (s.y0 > u.y0 || (s.y0 === u.y0 && s.x0 > u.x0)) ? s : u
      const 내줌 = 세넓(s, u) && !세넓(u, s) ? s : 세넓(u, s) && !세넓(s, u) ? u : 뒤
      const 다른 = 내줌 === s ? u : s
      const t겹 = Math.min(s.t, u.t)
      if (!(t겹 > 0)) continue
      내줌.모서리빼기 = (내줌.모서리빼기 || 0) + dx * dy * t겹 / 내줌.t      // mm² (두께 전체로 환산)
      ;(내줌.모서리짝 = 내줌.모서리짝 || []).push(다른.id)
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
      w.이음끝 = 이음끝
      w.단부끝들 = [0, 1].map((k) => (이음끝[k] ? 0 : (k ? w.우 : w.좌).기둥 || /끝/.test((k ? w.우 : w.좌).무엇) ? 1 : 0.5))
      w.단부끝 = w.단부끝들[0] + w.단부끝들[1]
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
      c.기초 = 층 === H.맨아래 && ftP ? ftP.기초.get(k) || ftP.판기초.find((d) => 판안(d.판, c.x, c.y)) || null : null      // 🟨 G392 MAT 위 기둥 = 그 판 기초에 정착
    }
    for (const [, d] of P.기초) { d.z1 = -H.내림; d.z0 = d.z1 - d.t }
    for (const d of P.판기초) { d.z1 = -H.내림 + Math.min(수(d.o.윗면, 0) || 0, 0); d.z0 = d.z1 - d.t }      // 윗면(≤ 0 mm) = MAT 밑 깊은 곳 · 피트
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
  const 묶기 = (표, 줄들) => {            // 줄들: [{row, id}] 또는 [{row, ids, 몫(Map id → 길이)}](이어 붙인 부재) — 같은 줄(QT 뺀 모든 칸)은 하나로
    const m = new Map()
    for (const { row, id, ids, 몫 } of 줄들) {
      const 키 = JSON.stringify(row)
      if (!m.has(키)) m.set(키, { row, ids: [], qt: 0, 몫: null })
      const e = m.get(키)
      e.qt++
      if (ids) { e.ids.push(...ids); e.몫 = e.몫 || new Map(); for (const [k, v] of 몫) e.몫.set(k, v) }
      else { e.ids.push(id); if (e.몫) e.몫.set(id, 1) }
    }
    for (const { row, ids, qt, 몫 } of m.values()) {
      const i = 주[표].length
      주[표].push({ ...row, QT: qt })
      곳들.set(표 + '|' + i, 몫 ? { ids, 몫 } : { ids })
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
  /* 🟨 G392 판 기초(MAT · 부정형) — 모양마다 골조 셈 «부정형» 배근(면적 · 둘레 · 두께 · m²당 철근)을 만듦
       같은 부호에 모양이 하나이고 점 기초(독립)가 그 부호를 안 쓰면 이름 그대로 · 아니면 «부호·1 · 부호·2» */
  const 판들 = [...G.층의.values()].flatMap((P) => P.판기초)
  if (판들.length) {
    배근.기초 = [...(M.배근.기초 || [])]
    const 점부호 = new Set(M.부재.filter((o) => o.종류 === '기초' && !Array.isArray(o.판)).map((o) => 글(o.부호)))
    const 모양 = new Map()                  // 부호 → Map(모양 키 → 배근)
    for (const d of 판들) {
      const 부 = 글(d.o.부호), r0 = d.r
      const 단위 = 글(r0.단위철근) || 간격단위([r0.하부가로, r0.하부세로, r0.상부가로, r0.상부세로, r0.단변하부, r0.단변상부, r0.장변하부, r0.장변상부])
      const e = { ...r0, 종류: '부정형', 면적: String(Math.round(d.넓 / 1e3) / 1e3), 둘레: String(Math.round(d.둘) / 1e3), 두께: String(Math.round(d.t)), 단위철근: 단위, _길x: String(Math.round(d.a)), _길y: String(Math.round(d.b)) }
      const 키 = JSON.stringify([e.면적, e.둘레, e.두께, e.단위철근])
      if (!모양.has(부)) 모양.set(부, new Map())
      if (!모양.get(부).has(키)) 모양.get(부).set(키, e)
      d.셈배근 = 모양.get(부).get(키)
    }
    for (const [부, 들] of 모양) {
      const 목록 = [...들.values()]
      if (목록.length === 1 && !점부호.has(부)) { 목록[0].기호 = 부; 배근.기초 = 배근.기초.filter((r) => 글(r.기호) !== 부) }
      else 목록.forEach((e, k) => { e.기호 = 부 + '·' + (k + 1) })
      배근.기초.push(...목록)
      if (!목록.some((e) => 글(e.단위철근))) 경고.push('기초 ' + 부 + ' — 철근(m²당 · 간격)이 일람에 없어 철근을 못 셌습니다(오른쪽에서 넣으십시오)')
    }
    for (const d of 판들) d.셈기호 = d.셈배근.기호
  }

  for (const [층, P] of 층별) {
    /* 기둥 */
    묶기('기둥', [...P.기둥.values()].sort((a, b) => a.x - b.x || a.y - b.y).map((c) => ({
      id: c.id,
      row: { 층, 기호: 글(c.o.부호), 높이: c.높이 ? String(c.높이) : '', 내림: c.내림 ? String(c.내림) : '', S: String(c.S), FT: c.기초 ? c.기초.셈기호 || 글(c.기초.o.부호) : '', 연결: c.연결, C: '', F: '', 원형F: '', R: '', ...(c.o.돌림 ? { _돌림: 1 } : {}) },
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
    /* 🧭 G390 받침 없는 이음(양쪽 «이어짐» — 기둥 · 가로지르는 보 · 벽 없음)에서 곧게 이어진 같은 보는 한 줄로 셈
         (✂ 나눈 보 · 통심마다 나눠 넣은 보 — 늑근 단부 · 정착이 토막마다 갈리지 않게 · 부재별 물량은 길이 몫) */
    const 같은보 = (a, b) => 글(a.o.부호) === 글(b.o.부호) && a.W === b.W && a.H === b.H && a.S === b.S && a.우.무엇 === '이어짐' && b.좌.무엇 === '이어짐'
    const 마디들 = 열들.map((열) => { const out = []; for (const b of 열) { const 끝 = out[out.length - 1]; if (끝 && 같은보(끝[끝.length - 1], b)) 끝.push(b); else out.push([b]) } return out })
    const 열묶 = new Map()
    for (const 열 of 마디들) {
      const rows = 열.map((g) => ({ 층, 기호: 글(g[0].o.부호), 길이: String(둥(g.reduce((a, b) => a + b.L, 0))), 좌단: String(둥(g[0].좌.값)), 우단: String(둥(g[g.length - 1].우.값)), S: String(g[0].S), ...빈보 }))
      const 키 = JSON.stringify(rows)
      const 줄이름 = (M.통심[열[0][0].축 === 'x' ? 'y' : 'x'].find((g) => g.id === 열[0][0].줄) || {}).이름 || ''
      if (!열묶.has(키)) 열묶.set(키, { rows, 열: [], 이름: [] })
      열묶.get(키).열.push(열); 열묶.get(키).이름.push(줄이름)
    }
    for (const { rows, 열, 이름 } of 열묶.values()) {
      const n = rows.length
      rows.forEach((row, k) => {
        const i = 주.보.length
        const 열칸 = n === 1 ? '' : k === 0 ? (이름.join('·') || 'L') : k === n - 1 ? 'E' : ''
        주.보.push({ 층: row.층, 열: 열칸, 기호: row.기호, 길이: row.길이, 좌단: row.좌단, 우단: row.우단, S: row.S, QT: 열.length, ...빈보 })
        const 토막 = 열.flatMap((l) => l[k])
        곳들.set('보|' + i, 토막.length > 열.length ? { ids: 토막.map((b) => b.id), 몫: new Map(토막.map((b) => [b.id, b.L])) } : { ids: 토막.map((b) => b.id) })
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
      const 구 = Math.round(((수(s.o.구멍, 0) || 0) + ((s.기둥빼기 || 0) + (s.모서리빼기 || 0)) / 1e6) * 1e6) / 1e6
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
    /* 🧭 G390 벽도 받침 없는 이음(양쪽 «이어짐»)에서 곧게 이어진 같은 벽(부호 · 두께 · 높이 · 상부 · 한 면)은 한 줄로 — 문 · 창(OPEN)은 한 줄에 하나까지 */
    const 위층 = G.H.위층[G.H.위층.indexOf(층) + 1]
    const 위벽 = (w) => (위층 && G.층의.get(위층) ? G.층의.get(위층).벽.some((u) => u.축 === w.축 && u.c === w.c && u.s0 === w.s0 && u.s1 === w.s1) : false)
    const 같은벽 = (a, b) => a.축 === b.축 && a.c === b.c && a.s1 === b.s0 && 글(a.o.부호) === 글(b.o.부호) && a.T === b.T && a.상부 === b.상부 && a.높이 === b.높이 && !!a.o.한면 === !!b.o.한면 && a.우.무엇 === '이어짐' && b.좌.무엇 === '이어짐'
    const 벽마디 = []
    for (const w of [...P.벽].sort((a, b) => (a.축 === b.축 ? 0 : a.축 === 'x' ? -1 : 1) || a.c - b.c || a.s0 - b.s0)) {
      const g = 벽마디[벽마디.length - 1], p = g && g[g.length - 1]
      if (p && 같은벽(p, w) && !(글(w.o.구멍) && g.some((u) => 글(u.o.구멍)))) g.push(w)
      else 벽마디.push([w])
    }
    묶기('옹벽', 벽마디.map((g) => {
      const a = g[0], z = g[g.length - 1]
      const row = { 층, 기호: 글(a.o.부호), 길이: String(둥(g.reduce((t, w) => t + w.L, 0))), 높이: a.높이 ? String(a.높이) : '', 하부: '', 상부: String(둥(a.상부)), 단부: String(둥(a.좌.값 + z.우.값)), X정착: (a.이음끝[0] ? 0 : 1) + (z.이음끝[1] ? 0 : 1), 상부이음: g.every(위벽) ? '1' : 'A', OPEN: 글((g.find((w) => 글(w.o.구멍)) || a).o.구멍), C: '', F: '', F2: a.o.한면 ? '' : 거푸집, R: '', _단부끝: a.단부끝들[0] + z.단부끝들[1] }
      return g.length > 1 ? { row, ids: g.map((w) => w.id), 몫: new Map(g.map((w) => [w.id, w.L])) } : { id: a.id, row }
    }))
    /* 기초 */
    묶기('기초', [...P.기초.values(), ...P.판기초].sort((a, b) => a.x - b.x || a.y - b.y).map((d) => ({
      id: d.id,
      row: { 층, 기호: d.셈기호 || 글(d.o.부호), 줄기초: '', MAT단변: '', MAT장변: '', 형틀공제: '', 추가: '', 단부공제: '', C: '', F: '', 공제F: '', R: '' },
    })))
    /* 🪜 G393 계단 — 골조 셈 «5. 계단» 줄(단수가 비면 셈이 층고 ÷ 판 수 ÷ 단 높이) */
    const 참글 = (v) => (수(v, null) === null ? '' : String(Math.round(수(v, 0))))
    묶기('계단', [...P.계단].sort((a, b) => a.x - b.x || a.y - b.y).map((t) => ({
      id: t.id,
      row: { 층, 기호: 글(t.o.부호), 단수: Math.trunc(수(t.o.단수, 0)) > 0 ? String(Math.trunc(수(t.o.단수, 0))) : '', 길이: String(Math.round(t.L)), 폭: String(Math.round(t.W)), 하단참: 참글(t.o.하단참), 상단참: 참글(t.o.상단참), L정착: String(t.L정착), W정착: String(t.W정착), C: '', F: '', 챌판F: '', R: '', _판수: String(t.판수) },
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
  /* 🪜 G393 도면 덧줄 — 그 층에 세운 부재가 있을 때만(«F-» 기초 줄은 그 층에 기초가 있을 때) · 부재가 아니라 부재별에는 안 나눔 */
  const 세운 = [...G.기.values()].map((g) => g.o)
  let 덧수 = 0
  for (const x of M.덧줄 || []) {
    const 층 = 글(x.row.층), 기초줄 = /^F-/i.test(글(x.row.부재))
    if (!주[x.표] || !세운.some((o) => o.층 === 층 && (!기초줄 || o.종류 === '기초'))) continue
    주[x.표].push({ ...x.row }); 덧수++
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
  return { 공사, 곳들, 경고, G, 덧수 }
}

/* ───────────────────────────── 셈 · 부재별 · 3D · 검사 */
const 항목열쇠 = (x) => (x.항목 === '철근' ? '철근' : x.항목 === '콘크리트' ? (/버림/.test(x.비고 || '') ? '버림' : '콘크리트') : x.항목 === '거푸집' ? '거푸집' : x.항목 === '데크' ? '데크' : '기타')

/**
 * 모델 한 벌 셈
 * @returns {{공사, R, 부재별: Map<id,{콘크리트, 거푸집, 철근, 데크, 버림, 줄: Array}>, 합, 층별, 부호별, 경고, 덩어리, 검사}}
 */
export function 모델셈(M0) {
  const { 공사, 곳들, 경고, G, 덧수 } = 공사로(M0)
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
  /* 🪜 G393 도면 덧줄 몫(부재 아닌 줄 — 보강 · 보강근 · Dry Area 중 도면에서 옮긴 것) */
  const 덧 = { 줄: 덧수, 콘크리트: 0, 거푸집: 0, 철근: 0 }
  if (덧수) for (const x of R.줄) { const 곳 = x.곳 && 곳들.get(x.곳.표 + '|' + x.곳.i); if (곳 || !x.곳 || !['보강', '보강근', '드라이에리어'].includes(x.곳.표)) continue; const k = 항목열쇠(x); if (k in 덧) 덧[k] += x.수량 }
  return { 공사, R, 부재별, 합, 층별, 부호별, 경고: [...경고, ...R.경고.map((w) => w.글)], 덩어리: 덩, 검사: 검, G, 안나눔, 덧 }
}

/**
 * 🪜 G393 계단 몸 — 오르는 판마다 단(디딤 윗면 + 비스듬한 밑면 = 경사판 두께) · 참(네모 판) → bim3d «면»(세모) · «선» 한 덩어리
 *   판 k(0 부터)는 폭 W 씩 옆으로 · 짝수 판은 시작 → 중간참 쪽, 홀수 판은 되돌아옴 · 한 판이 층고 ÷ 판 수를 오름
 *   단 i 기둥 몫 = 디딤 너비 × 폭 × (단 높이/2 + 두께 × 빗길이/길이) → 합 = 골조 셈 «경사판 × 폭 × 두께 × 빗길이 + 디딤 삼각형» 과 같음
 *   참 = 상단참(중간참 — 오르는 판 끝 바깥 · 한 판 높이) · 하단참(시작 끝 바깥 · 그 층 바닥) — 넓이 = 깊이 × min(판 수, 2) × 폭 × 두께(골조 셈과 같음)
 * @returns {{면: number[], 선: number[], 조각: {판, z0, z1}[], 판, z0, z1, 부피}}
 */
export function 계단몸(g) {
  const 면 = [], 선 = [], 조각 = []
  let 부피 = 0
  const 가 = g.가로
  const 점 = (u, v, z) => (가 ? [u, v, z] : [v, u, z])
  const 차 = (p, q) => [p[0] - q[0], p[1] - q[1], p[2] - q[2]]
  const 외 = (p, q) => [p[1] * q[2] - p[2] * q[1], p[2] * q[0] - p[0] * q[2], p[0] * q[1] - p[1] * q[0]]
  /* 네 점(u, v, z) 둘레 · 밖 = 바깥 방향(u, v, z) — 세모 둘로(바깥을 보게 차례를 맞춤) */
  const 넷 = (A, B, C, D, 밖) => {
    const [a, b, c, d] = [A, B, C, D].map((p) => 점(p[0], p[1], p[2])), h = 점(밖[0], 밖[1], 밖[2])
    const n = 외(차(b, a), 차(c, a))
    const [p, q, r, t] = n[0] * h[0] + n[1] * h[1] + n[2] * h[2] < 0 ? [a, d, c, b] : [a, b, c, d]
    면.push(...p, ...q, ...r, ...p, ...r, ...t)
  }
  const 줄 = (A, B) => 선.push(...점(A[0], A[1], A[2]), ...점(B[0], B[1], B[2]))
  const 네모판 = (u0, u1, v0, v1) => { const a = Math.min(u0, u1), b = Math.max(u0, u1); return 가 ? [[a, v0], [b, v0], [b, v1], [a, v1]] : [[v0, a], [v1, a], [v1, b], [v0, b]] }
  /* u 방향 사다리꼴 기둥(u0 → u1 · 밑면 za → zb 비스듬 · 윗면 zt 평평) · v0 ~ v1 */
  const 기둥 = (u0, u1, v0, v1, za, zb, zt, 선도) => {
    const s0 = Math.sign(u1 - u0) || 1
    넷([u0, v0, zt], [u1, v0, zt], [u1, v1, zt], [u0, v1, zt], [0, 0, 1])
    넷([u0, v0, za], [u0, v1, za], [u1, v1, zb], [u1, v0, zb], [0, 0, -1])
    넷([u0, v0, za], [u0, v0, zt], [u0, v1, zt], [u0, v1, za], [-s0, 0, 0])
    넷([u1, v0, zb], [u1, v1, zb], [u1, v1, zt], [u1, v0, zt], [s0, 0, 0])
    넷([u0, v0, za], [u1, v0, zb], [u1, v0, zt], [u0, v0, zt], [0, -1, 0])
    넷([u0, v1, za], [u0, v1, zt], [u1, v1, zt], [u1, v1, zb], [0, 1, 0])
    if (선도) for (const v of [v0, v1]) { 줄([u0, v, zt], [u1, v, zt]); 줄([u0, v, za], [u1, v, zb]) }
    조각.push({ 판: 네모판(u0, u1, v0, v1), z0: Math.min(za, zb), z1: zt })
  }
  const 상자 = (u0, u1, v0, v1, z0, z1) => {
    기둥(u0, u1, v0, v1, z0, z0, z1, true)
    for (const [u, v] of [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]) 줄([u, v, z0], [u, v, z1])
    줄([u0, v0, z1], [u0, v1, z1]); 줄([u1, v0, z1], [u1, v1, z1]); 줄([u0, v0, z0], [u0, v1, z0]); 줄([u1, v0, z0], [u1, v1, z0])
  }
  const [a, b, c, d] = g.상
  const u끝 = g.참끝 ? (가 ? c : d) : (가 ? a : b)            // 중간참 쪽 끝 — 오르는 판이 여기서 꺾임
  const 방 = g.참끝 ? 1 : -1
  const u시작 = u끝 - 방 * g.L
  const v0 = 가 ? b : a
  const h = g.h2 / g.n, w = g.L / g.n, 밑 = g.T * g.s / g.L           // 단 높이 · 디딤 너비 · 경사판 수직 두께
  for (let k = 0; k < g.판수; k++) {
    const va = v0 + k * g.W, vb = va + g.W
    const 오름 = k % 2 === 0
    const z기 = g.z0 + k * g.h2
    const u0 = 오름 ? u시작 : u끝, dir = 오름 ? 방 : -방
    for (let i = 0; i < g.n; i++) {
      const ua = u0 + dir * i * w, ub = ua + dir * w
      const zt = z기 + (i + 1) * h, za = z기 + i * h - 밑, zb = z기 + (i + 1) * h - 밑
      기둥(ua, ub, va, vb, za, zb, zt, false)
      부피 += w * g.W * (h / 2 + 밑) / 1e9
      /* 단 모양 선(옆면 톱니) · 가로 모서리 */
      for (const v of [va, vb]) { 줄([ua, v, zt - h], [ua, v, zt]); 줄([ua, v, zt], [ub, v, zt]) }
      줄([ua, va, zt], [ua, vb, zt])
    }
    const ue = u0 + dir * g.L
    for (const v of [va, vb]) { 줄([u0, v, z기 - 밑], [ue, v, z기 + g.h2 - 밑]); 줄([u0, v, z기 - 밑], [u0, v, z기]); 줄([ue, v, z기 + g.h2 - 밑], [ue, v, z기 + g.h2]) }
  }
  const 참폭 = Math.min(g.판수, 2) * g.W
  if (g.위 > 0) { const zt = g.z0 + (g.판수 >= 2 ? g.h2 : g.H); 상자(u끝, u끝 + 방 * g.위, v0, v0 + 참폭, zt - g.T, zt); 부피 += g.위 * 참폭 * g.T / 1e9 }
  if (g.아 > 0) { const zt = g.z0; 상자(u시작 - 방 * g.아, u시작, v0, v0 + 참폭, zt - g.T, zt); 부피 += g.아 * 참폭 * g.T / 1e9 }
  /* 둘레(평면) · 높이 */
  const us = [u시작 - 방 * g.아, u끝 + 방 * g.위], vs = [v0, v0 + Math.max(g.판수 * g.W, 참폭)]
  const 판 = 네모판(us[0], us[1], vs[0], vs[1])
  const z0 = Math.min(...조각.map((x) => x.z0)), z1 = Math.max(...조각.map((x) => x.z1))
  return { 면, 선, 조각, 판, z0, z1, 부피 }
}

/** 3D 덩어리 — 부재보기(bim3d.js) 꼴 [{id, 판:[[x,y]](mm), z0, z1, 색, 부피(m³)}] · 🪜 계단은 «면 · 선 · 조각» 도 */
export function 덩어리(G) {
  const out = []
  const 네모 = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]
  for (const [id, g] of G.기) {
    const 색 = 종류색[g.o.종류]
    if (g.o.종류 === '계단') {
      const m = 계단몸(g)
      if (m.조각.length) out.push({ id, 판: m.판, z0: m.z0, z1: m.z1, 면: m.면, 선: m.선, 조각: m.조각, 색: g.o.제안 ? 제안색 : 색, 부피: m.부피, 종류: '계단', 층: g.o.층, 부호: 글(g.o.부호), ...(g.o.제안 ? { 제안: true } : {}) })
      continue
    }
    let 판 = null, z0 = g.z0, z1 = g.z1, 넓이 = 0
    if (g.o.종류 === '기둥') {
      if (g.원) { 판 = Array.from({ length: 24 }, (_, k) => [g.x + g.원 / 2 * Math.cos(k * Math.PI / 12), g.y + g.원 / 2 * Math.sin(k * Math.PI / 12)]); 넓이 = Math.PI / 4 * g.원 * g.원 }
      else { 판 = 네모(g.x - g.a / 2, g.y - g.b / 2, g.x + g.a / 2, g.y + g.b / 2); 넓이 = g.a * g.b }
    } else if (g.o.종류 === '기초' && g.판) { 판 = g.판; 넓이 = g.넓 }                  // 🟨 G392 자유 모양
    else if (g.o.종류 === '기초') { 판 = 네모(g.x - g.a / 2, g.y - g.b / 2, g.x + g.a / 2, g.y + g.b / 2); 넓이 = g.a * g.b }
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
    if (g.o.종류 === '슬라브' && g.모서리빼기) 부피 -= g.모서리빼기 * g.t / 1e9
    out.push({ id, 판, z0, z1, 색: g.o.제안 ? 제안색 : 색, 부피, 종류: g.o.종류, 층: g.o.층, 부호: 글(g.o.부호), ...(g.기둥빼기 ? { FT빼기: true } : {}), ...(g.모서리짝 ? { 모서리짝: g.모서리짝 } : {}), ...(g.o.제안 ? { 제안: true } : {}) })
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
  /* 겹침 — 네모 덩어리끼리(원형은 바깥 네모로) · 칸 나눔으로 빠르게 · 🪜 계단은 조각(단 · 참)마다 */
  const 상자 = 덩.flatMap((d) => (d.조각 ? d.조각.map((x) => ({ ...d, 판: x.판, z0: x.z0, z1: x.z1, 조각: null })) : [d])).map((d) => { const xs = d.판.map((p) => p[0]), ys = d.판.map((p) => p[1]); return { d, x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) } })
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
  let 벽보 = 0, 벽보n = 0, 계단바 = 0
  const 쌍표 = new Map(), 계단바쌍 = new Set()
  for (const 목록 of 통.values()) for (let a = 0; a < 목록.length; a++) for (let b = a + 1; b < 목록.length; b++) {
    const i = 목록[a], j = 목록[b]
    const 키 = i < j ? i + '|' + j : j + '|' + i
    if (본.has(키)) continue
    본.add(키)
    const A = 상자[i], B = 상자[j]
    if (A.d.id === B.d.id) continue                 // 한 부재의 조각끼리(계단 단 · 참)
    if ((A.d.종류 === '기둥' && B.d.종류 === '슬라브' && B.d.FT빼기) || (B.d.종류 === '기둥' && A.d.종류 === '슬라브' && A.d.FT빼기)) continue   // FT 바닥 슬라브에서 이미 뺀 기둥 몫
    if ((A.d.모서리짝 && A.d.모서리짝.includes(B.d.id)) || (B.d.모서리짝 && B.d.모서리짝.includes(A.d.id))) continue   // 🧩 G393 안쪽 모서리 — 한쪽 슬라브 «개구부» 로 이미 뺀 몫
    const dx = Math.min(A.x1, B.x1) - Math.max(A.x0, B.x0), dy = Math.min(A.y1, B.y1) - Math.max(A.y0, B.y0), dz = Math.min(A.d.z1, B.d.z1) - Math.max(A.d.z0, B.d.z0)
    if (dx > 0.5 && dy > 0.5 && dz > 0.5) {
      /* 🟨 G392 자유 모양(판 기초)은 네모 상자가 아니라 모양으로 겹친 넓이 */
      const 겹넓 = !네모판(A.d.판) ? 네모로자름(A.d.판, B.x0, B.y0, B.x1, B.y1) : !네모판(B.d.판) ? 네모로자름(B.d.판, A.x0, A.y0, A.x1, A.y1) : dx * dy
      const v = 겹넓 * dz / 1e9
      if (v >= 0.0005 && ((A.d.종류 === '보' && 정상부(B.d)) || (B.d.종류 === '보' && 정상부(A.d)))) { 벽보 += v; 벽보n++; continue }
      /* 🪜 G393 계단 참 · 경사판 끝이 바닥(기초 · 슬라브) · 아래위 층 계단과 닿는 곳 — 골조 셈은 계단 줄에 참까지 넣어 둘 다 셈(관례) */
      const 계바 = (p, q) => p.종류 === '계단' && (q.종류 === '기초' || q.종류 === '슬라브' || q.종류 === '계단' || q.종류 === '보')
      if (v >= 0.0005 && (계바(A.d, B.d) || 계바(B.d, A.d))) { 계단바 += v; 계단바쌍.add(A.d.id < B.d.id ? A.d.id + '|' + B.d.id : B.d.id + '|' + A.d.id); continue }
      /* 🪜 계단이 옆 벽 면에 얇게(50 mm 안) 닿음 — 도면 계단 폭 × 판 수가 벽 사이보다 조금 넓은 것(줄 맞춤 몫) · 알림으로 */
      if (v >= 0.0005 && (A.d.종류 === '계단') !== (B.d.종류 === '계단') && (A.d.종류 === '벽' || B.d.종류 === '벽') && Math.min(dx, dy) <= 50) { 계단바 += v; 계단바쌍.add(A.d.id < B.d.id ? A.d.id + '|' + B.d.id : B.d.id + '|' + A.d.id); continue }
      if (v >= 0.0005) {
        /* 같은 두 부재(계단 단 · 참 조각)는 한 곳으로 묶음 */
        const 쌍 = A.d.id < B.d.id ? A.d.id + '|' + B.d.id : B.d.id + '|' + A.d.id
        const 앞 = 쌍표.get(쌍)
        if (앞) { 앞.부피 += v; 앞.글 = 앞.머리 + ' — ' + 앞.부피.toFixed(3) + ' ㎥'; continue }
        const 머리 = A.d.층 + '층 ' + A.d.종류 + ' ' + A.d.부호 + ' ↔ ' + B.d.층 + '층 ' + B.d.종류 + ' ' + B.d.부호
        const e = { ids: [A.d.id, B.d.id], 부피: v, 머리, 글: 머리 + ' — ' + v.toFixed(3) + ' ㎥', 상자: [Math.max(A.x0, B.x0), Math.max(A.y0, B.y0), Math.min(A.d.z1, B.d.z1) > Math.max(A.d.z0, B.d.z0) ? Math.max(A.d.z0, B.d.z0) : 0, Math.min(A.x1, B.x1), Math.min(A.y1, B.y1), Math.min(A.d.z1, B.d.z1)] }
        쌍표.set(쌍, e); 겹친.push(e)
      }
    }
  }
  겹친.sort((a, b) => b.부피 - a.부피)
  if (겹친.length) 줄.push({ 좋음: false, 글: '겹친 곳 ' + 겹친.length + '군데(같은 콘크리트를 두 번 셈 · 합 ' + 겹친.reduce((a, x) => a + x.부피, 0).toFixed(3) + ' ㎥) — 아래 목록을 눌러 3D 에서 보십시오', 겹친 })
  else 줄.push({ 좋음: true, 글: '겹친 덩어리 없음(같은 콘크리트를 두 번 세지 않음)' })
  /* 🔧 G392 빈 층 — 위에 부재가 있는데 비어 있는 층(소장님 폰: B3 · B2 · B1 을 더하고 비워 둠 → 1층이 떠서 기둥이 기초에 안 닿음 · 물량이 슬쩍 줄어듦) */
  {
    const 위 = G.M.층.filter((f) => !FT층(f)).map((f) => f.이름)
    const 있 = new Set(G.M.부재.map((o) => o.층))
    const 빈 = 위.filter((f, k) => !있.has(f) && 위.slice(k + 1).some((u) => 있.has(u)))
    if (빈.length) {
      const 맨 = 위[0], 첫찬 = 위.find((f) => 있.has(f))
      줄.push({ 좋음: false, 빈층: 빈, 글: '빈 층 ' + 빈.map((f) => f + '층').join(' · ') + ' — 위층이 떠 있습니다' + (빈.includes(맨) && G.M.부재.some((o) => o.종류 === '기초') ? '(' + 첫찬 + '층 기둥이 기초에 안 닿아 기둥 내림 · 기초 정착이 빠짐)' : '') + ' · «층 복사» 로 채우거나 ① 통심 · 층에서 그 층을 빼십시오' })
    }
  }
  if (계단바쌍.size) 줄.push({ 좋음: true, 알림: true, 글: '계단 참 · 경사판 끝이 바닥(기초 · 슬라브 · 보) · 아래위 계단 · 옆 벽 면과 닿는 곳 ' + 계단바쌍.size + '군데 ' + 계단바.toFixed(3) + ' ㎥ 는 둘 다 셈 — 골조 셈 관례(계단 줄에 참까지 넣음)' })
  if (벽보n) 줄.push({ 좋음: true, 알림: true, 글: '벽 위 보 ' + 벽보n + '군데 ' + 벽보.toFixed(3) + ' ㎥ 는 벽과 보에 둘 다 셈 — 도면 셈(내역서식: 벽 높이 = 층고 − 슬라브)대로 둔 벽 · 벽에서 빼려면 그 벽의 «위에서 뺄 몫» 을 비우십시오' })
  return 줄
}

/** 부재 이름(화면 · 엑셀) */
export function 부재글(M, o) {
  const 이름 = (id) => (M.통심.x.find((g) => g.id === id) || M.통심.y.find((g) => g.id === id) || {}).이름 || id
  if (Array.isArray(o.판) && o.판.length >= 3) {          // 🟨 G392 자유 모양 · 🪜 G393 계단 자리 — 둘러싼 네모에 가까운 통심
    const [a, b, c, d] = 판상자(o.판.map((p) => [수(p[0], 0), 수(p[1], 0)]))
    const 가 = (줄, v) => (줄.length ? 줄.reduce((m, g) => (Math.abs(g.자리 - v) < Math.abs(m.자리 - v) ? g : m)).이름 : '')
    return (o.종류 === '계단' ? '계단 ' : '자유 모양 ') + 가(M.통심.x, a) + '~' + 가(M.통심.x, c) + ' / ' + 가(M.통심.y, b) + '~' + 가(M.통심.y, d)
  }
  if (o.칸) return 이름(o.칸[0]) + '~' + 이름(o.칸[2]) + ' / ' + 이름(o.칸[1]) + '~' + 이름(o.칸[3])
  if (o.끝) return 이름(o.점[0]) + '-' + 이름(o.점[1]) + ' ~ ' + 이름(o.끝[0]) + '-' + 이름(o.끝[1])
  return 이름(o.점[0]) + '-' + 이름(o.점[1])
}

/* ───────────────────────────── ▭ G393 구간(팀별 · 기성 구간) — 소장님 「다음으로 미루지 마. 지금해줘」
   구간 = 평면 네모(mm · 모든 층 같은 자리) · 물량 = 부재별 몫 × 구간에 든 비율(선에 걸친 보 · 벽 · 슬라브도 길이 · 넓이로 나눔 — 산출서 합과 한 자리도 안 다름)
   «구간 선에서 자르기» 는 부재 자체를 둘로 나누고 싶을 때(팀별 도면 · 3D 색) — 보 · 벽은 이어진 한 줄 그대로 셈 */
export const 구간색들 = [[0.96, 0.55, 0.18], [0.22, 0.62, 0.92], [0.50, 0.78, 0.28], [0.86, 0.38, 0.74], [0.95, 0.82, 0.22], [0.30, 0.80, 0.78], [0.72, 0.52, 0.36], [0.58, 0.58, 0.96]]
export function 구간넣기(M, 판, 이름 = '') {
  const a = Math.round(Math.min(판[0], 판[2])), b = Math.round(Math.min(판[1], 판[3])), c = Math.round(Math.max(판[0], 판[2])), d = Math.round(Math.max(판[1], 판[3]))
  if (!(c - a >= 300 && d - b >= 300)) return M
  const 목 = M.구간 || []
  let n = 1
  while (목.some((z) => z.id === 'z' + n)) n++
  return { ...M, 구간: [...목, { id: 'z' + n, 이름: 글(이름) || n + '구간', 판: [a, b, c, d] }] }
}
export const 구간빼기 = (M, id) => ({ ...M, 구간: (M.구간 || []).filter((z) => z.id !== id) })
export const 구간고치기 = (M, id, 고칠) => ({ ...M, 구간: (M.구간 || []).map((z) => (z.id === id ? { ...z, ...고칠 } : z)) })
/** 부재 평면 가운데(mm) — 기하(G.기) 한 칸 */
export function 부재가운데(g) {
  if (g.o.종류 === '보' || g.o.종류 === '벽') { const m = (g.s0 + g.s1) / 2; return g.축 === 'x' ? [m, g.c] : [g.c, m] }
  if (g.o.종류 === '슬라브') return [(g.X0 + g.X1) / 2, (g.Y0 + g.Y1) / 2]
  return [g.x, g.y]
}
/**
 * 구간마다 물량 — 부재별 몫 × 그 구간에 든 비율(보 · 벽 = 길이 · 슬라브 = 넓이 · 기둥 · 기초 · 계단 = 가운데 · 자유 모양 = 둘레 네모 넓이)
 *   선에 걸친 부재도 자르지 않고 나눠 셈 → 구간 합 + 밖 + 덧줄 = 전체(한 자리도 안 다름) · 구간이 겹치면 먼저 그은 구간이 먼저
 */
export function 구간물량(M, S) {
  const 빈 = () => ({ 콘크리트: 0, 거푸집: 0, 철근: 0, 데크: 0, 개수: 0, 층별: new Map(), 종별: new Map() })
  const 줄 = (M.구간 || []).map((z) => ({ z, ...빈() }))
  const 밖 = 빈()
  const 어디 = new Map()
  const 더 = (t, k, q, w) => { if (!t.has(k)) t.set(k, { 콘크리트: 0, 거푸집: 0, 철근: 0, 개수: 0 }); const a = t.get(k); a.콘크리트 += (q.콘크리트 || 0) * w; a.거푸집 += (q.거푸집 || 0) * w; a.철근 += (q.철근 || 0) * w; a.개수++ }
  const 겹1 = (a0, a1, b0, b1) => Math.max(0, Math.min(a1, b1) - Math.max(a0, b0))
  const 몫 = (g, z) => {
    const [a, b, c, d] = z.판
    if (g.o.종류 === '보' || g.o.종류 === '벽') {
      const L = g.s1 - g.s0
      if (g.축 === 'x') return g.c >= b && g.c <= d && L > 0 ? 겹1(g.s0, g.s1, a, c) / L : 0
      return g.c >= a && g.c <= c && L > 0 ? 겹1(g.s0, g.s1, b, d) / L : 0
    }
    if (g.o.종류 === '슬라브') { const A = (g.X1 - g.X0) * (g.Y1 - g.Y0); return A > 0 ? 겹1(g.X0, g.X1, a, c) * 겹1(g.Y0, g.Y1, b, d) / A : 0 }
    if (Array.isArray(g.판) && g.o.종류 !== '계단') {
      const xs = g.판.map((p) => p[0]), ys = g.판.map((p) => p[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys)
      const A = (x1 - x0) * (y1 - y0)
      return A > 0 ? 겹1(x0, x1, a, c) * 겹1(y0, y1, b, d) / A : 0
    }
    const [x, y] = 부재가운데(g)
    return x >= a && x <= c && y >= b && y <= d ? 1 : 0
  }
  for (const [id, q] of S.부재별) {
    const g = S.G.기.get(id)
    if (!g) continue
    let 남 = 1, 큰 = -1, 큰몫 = 0
    줄.forEach((r, k) => {
      const w = Math.min(몫(g, r.z), 남)
      if (!(w > 1e-9)) return
      남 -= w
      if (w > 큰몫) { 큰몫 = w; 큰 = k }
      for (const c of ['콘크리트', '거푸집', '철근', '데크']) r[c] += (q[c] || 0) * w
      r.개수++
      더(r.층별, g.o.층, q, w); 더(r.종별, g.o.종류, q, w)
    })
    if (남 > 1e-9) {
      for (const c of ['콘크리트', '거푸집', '철근', '데크']) 밖[c] += (q[c] || 0) * 남
      밖.개수++
      더(밖.층별, g.o.층, q, 남); 더(밖.종별, g.o.종류, q, 남)
      if (남 > 큰몫) 큰 = -1
    }
    어디.set(id, 큰)
  }
  return { 줄, 밖, 덧: S.덧 || { 줄: 0, 콘크리트: 0, 거푸집: 0, 철근: 0 }, 어디 }
}
/** ✂ 구간 선에서 자르기 — 구간 네모 변이 지나가는 보 · 벽(가로지름)은 그 자리에서 둘로 · 슬라브 칸은 그 줄에서 둘로(보조 통심) */
export function 구간선자르기(M) {
  let N = M, 나눔 = 0
  const 자리 = (축, id) => (N.통심[축].find((g) => g.id === id) || {}).자리
  const 줄얻기 = (축, v) => {
    const 있 = N.통심[축].find((g) => Math.abs(g.자리 - v) <= 5)
    if (있) return 있.id
    const 본 = N.통심[축].filter((g) => !/[+−-]\d+$/.test(글(g.이름)) && g.자리 < v).pop()
    const 앞 = new Set(N.통심[축].map((g) => g.id))
    N = 통심더하기(N, 축, Math.round(v), 본 ? 글(본.이름) + '+' + Math.round(v - 본.자리) : 축.toUpperCase() + '+' + Math.round(v))
    return (N.통심[축].find((g) => !앞.has(g.id)) || {}).id
  }
  for (const z of N.구간 || []) {
    const [a, b, c, d] = z.판
    for (const [축, v, 범0, 범1] of [['x', a, b, d], ['x', c, b, d], ['y', b, a, c], ['y', d, a, c]]) {
      const 옆 = 축 === 'x' ? 'y' : 'x', i = 축 === 'x' ? 0 : 1, j = 1 - i
      for (const o of [...N.부재]) {
        if ((o.종류 === '보' || o.종류 === '벽') && o.점 && o.끝 && o.점[j] === o.끝[j] && o.점[i] !== o.끝[i]) {
          const 줄자리 = 자리(옆, o.점[j]), p = 자리(축, o.점[i]), q = 자리(축, o.끝[i])
          if (!(줄자리 >= 범0 - 1 && 줄자리 <= 범1 + 1) || !(v > Math.min(p, q) + 50 && v < Math.max(p, q) - 50)) continue
          const N2 = 부재나누기(N, o.id, v)
          if (N2 !== N) { N = N2; 나눔++ }
        } else if (o.종류 === '슬라브' && o.칸) {
          const k0 = 축 === 'x' ? 0 : 1, k1 = k0 + 2, m0 = 축 === 'x' ? 1 : 0, m1 = m0 + 2
          const p = 자리(축, o.칸[k0]), q = 자리(축, o.칸[k1]), r0 = 자리(옆, o.칸[m0]), r1 = 자리(옆, o.칸[m1])
          if (!(v > Math.min(p, q) + 50 && v < Math.max(p, q) - 50) || Math.min(범1, Math.max(r0, r1)) - Math.max(범0, Math.min(r0, r1)) <= 1) continue
          const gid = 줄얻기(축, v)
          const lo = p < q ? o.칸[k0] : o.칸[k1], hi = p < q ? o.칸[k1] : o.칸[k0]
          const 앞칸 = [...o.칸], 뒤칸 = [...o.칸]
          앞칸[k0] = lo; 앞칸[k1] = gid; 뒤칸[k0] = gid; 뒤칸[k1] = hi
          const [id2, N2] = 새번호(N)
          const 뒤 = { ...o, id: id2, 칸: 뒤칸 }; delete 뒤.구멍
          N = { ...N2, 부재: N2.부재.flatMap((x) => (x.id === o.id ? [{ ...o, 칸: 앞칸 }, 뒤] : [x])) }
          나눔++
        }
      }
    }
  }
  return { M: N, 나눔 }
}

/** 🪜 G393 계단 크기 글 — «판 2 · 길이 2,800 · 폭 1,300 · 참 1,250 / 1,250 · 12단 × 177 · T150» */
export function 계단글(g) {
  const 쉼 = (v) => Math.round(v).toLocaleString('ko-KR')
  return '판 ' + g.판수 + ' · 길이 ' + 쉼(g.L) + ' · 폭 ' + 쉼(g.W) + (g.아 || g.위 ? ' · 참 ' + 쉼(g.아) + ' / ' + 쉼(g.위) : '') + ' · ' + g.n + '단 × ' + Math.round(g.h2 / g.n) + ' · T' + g.T + (g.o.제안 ? ' · 🟨 제안(확인 전)' : '')
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
    const 크기 = g.o.종류 === '계단' ? 계단글(g) : g.o.종류 === '기둥' ? (g.원 ? 'Ø' + g.원 : g.a + '×' + g.b) + 높글 : g.o.종류 === '보' ? g.W + '×' + g.H + ' · 안목 ' + Math.round(g.안) : g.o.종류 === '벽' ? 'T' + g.T + ' · 길이 ' + Math.round(g.안) + 높글 : g.o.종류 === '슬라브' ? Math.round(g.X1 - g.X0) + '×' + Math.round(g.Y1 - g.Y0) + ' · T' + g.t : g.판 ? '자유 모양 ' + (g.넓 / 1e6).toFixed(2) + '㎡ · T' + g.t + (g.o.제안 ? ' · 🟨 제안(확인 전)' : '') : g.a + '×' + g.b + '×' + g.t
    return [i + 1, o.층, o.종류, 글(o.부호), 부재글(M, o), 크기,
      { v: +(q.콘크리트 || 0).toFixed(4), st: ST.QTY }, { v: +(q.거푸집 || 0).toFixed(3), st: ST.QTY }, { v: +((q.철근 || 0) / 1000).toFixed(4), st: ST.QTY }, o.id]
  })
  const 시트 = [{ name: '부재별', head: ['번호', '층', '부재', '부호', '자리(통심)', '크기(mm)', '콘크리트(㎥)', '거푸집(㎡)', '철근(ton)', '부재 번호'], rows, widths: [6, 6, 7, 8, 26, 26, 12, 12, 12, 9], freeze: 1 }]
  /* ▭ G393 구간별(구간 × 층 × 부재 종류) */
  if (M.구간 && M.구간.length) {
    const Q = 구간물량(M, S)
    const 차례 = M.층.map((f) => f.이름)
    const 줄들 = []
    for (const r of [...Q.줄, { z: { 이름: '구간 밖' }, ...Q.밖 }]) {
      for (const [층, a] of [...r.층별].sort((p, q) => 차례.indexOf(p[0]) - 차례.indexOf(q[0]))) 줄들.push([r.z.이름, 층 === 'FT' ? 'FT' : 층 + '층', a.개수, { v: +a.콘크리트.toFixed(3), st: ST.QTY }, { v: +a.거푸집.toFixed(3), st: ST.QTY }, { v: +(a.철근 / 1000).toFixed(4), st: ST.QTY }])
      줄들.push([r.z.이름 + ' 합', '', r.개수, { v: +r.콘크리트.toFixed(3), st: ST.QTY }, { v: +r.거푸집.toFixed(3), st: ST.QTY }, { v: +(r.철근 / 1000).toFixed(4), st: ST.QTY }])
    }
    if (Q.덧.줄) 줄들.push(['도면 덧줄(부재 아님 — 보강 표)', '', Q.덧.줄, { v: +Q.덧.콘크리트.toFixed(3), st: ST.QTY }, { v: +Q.덧.거푸집.toFixed(3), st: ST.QTY }, { v: +(Q.덧.철근 / 1000).toFixed(4), st: ST.QTY }])
    시트.push({ name: '구간별', head: ['구간', '층', '부재 수', '콘크리트(㎥)', '거푸집(㎡)', '철근(ton)'], rows: 줄들, widths: [22, 8, 9, 13, 13, 12], freeze: 1 })
  }
  /* 🚶 G390 점검사항(둘러보기에서 넣은 것) */
  if (M.점검 && M.점검.length) 시트.push({ name: '점검사항', head: ['번호', '층', '부재', '부호', '자리(통심)', '내용', '넣은 때', '부재 번호'], rows: M.점검.map((x, i) => [i + 1, x.층 === 'FT' ? 'FT' : 글(x.층) + '층', 글(x.종류), 글(x.부호), 글(x.자리), 글(x.글), 글(x.때), x.id ?? '']), widths: [6, 6, 7, 8, 24, 60, 18, 9], freeze: 1 })
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

/* ───────────────────────────── 🟨 G392 건설맵 제안(먼저 세운 것) — 확인 · 빼기 */
/** 제안 하나 «✓ 이대로» — 제안 글을 걷고 확인 때를 남김(값은 그대로) */
export function 제안확인(M, id, 때 = '') {
  return { ...M, 부재: M.부재.map((o) => { if (o.id !== id || !o.제안) return o; const n = { ...o, 확인: 때 || '확인' }; delete n.제안; return n }) }
}
/** 제안 모두 «✓ 이대로» */
export function 제안모두확인(M, 때 = '') { let N = M; for (const o of M.부재) if (o.제안) N = 제안확인(N, o.id, 때); return N }
/** 제안 «✕ 빼기» — 부재를 빼고 그 자리를 빨강(손으로 할 곳 · M.빠짐)으로 되돌림 */
export function 제안빼기(M, id) {
  const o = M.부재.find((x) => x.id === id)
  if (!o) return M
  const 까닭 = o.종류 === '계단' ? '계단(건설맵 제안을 뺌 — 손으로)' : 'MAT · 부정형 기초(건설맵 제안을 뺌 — 손으로)'
  const 빠 = Array.isArray(o.판) ? [{ 종류: o.종류, 층: o.층, 기호: 글(o.부호), 까닭, 판: o.판, 높: o.종류 === '계단' ? 150 : 수(o.두께, 0) || 0, ...(o.근거 && o.근거.키 ? { 키: o.근거.키 } : {}) }] : []
  return { ...M, 부재: M.부재.filter((x) => x.id !== id), 빠짐: [...(M.빠짐 || []), ...빠] }
}
/** 판 기초 철근을 간격으로(상 · 하부 양방향 같은 간격 «D19@200») — 그 부호 일람에 넣음 */
export function 기초철근넣기(M, 부호, 간격) {
  const t = 글(간격).toUpperCase().replace(/\s/g, '')
  const 단위 = 간격단위([t, t, t, t])
  if (!단위) return M
  const 목록 = (M.배근.기초 || []).map((r) => (글(r.기호).toUpperCase() === 글(부호).toUpperCase() ? { ...r, 하부가로: t, 하부세로: t, 상부가로: t, 상부세로: t, 단위철근: 단위 } : r))
  return { ...M, 배근: { ...M.배근, 기초: 목록 } }
}
