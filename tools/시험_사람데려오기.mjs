/**
 * 🧪 lib/nomubi.js — G182 이름만 쳐서 다른 현장 명단의 사람 데려오기 (2026-10-07)
 *   node tools/시험_사람데려오기.mjs
 *   맵톡 이용자 답글 「기존 현장에 입력되어 있는 명단도 이름만 치며 정보를 가지고 올 수 있도록」
 *   이름 · 번호는 모두 지어낸 것입니다.
 */
const 저장 = new Map()
globalThis.localStorage = {
  getItem: (k) => (저장.has(k) ? 저장.get(k) : null),
  setItem: (k, v) => { 저장.set(k, String(v)) },
  removeItem: (k) => { 저장.delete(k) },
}
const L = await import('../web/src/lib/nomubi.js')
let 통과 = 0, 실패 = 0
const eq = (a, b, 무엇) => {
  const ok = JSON.stringify(a) === JSON.stringify(b)
  if (ok) { 통과++; console.log('  ✓', 무엇) } else { 실패++; console.log('  ✗', 무엇, '\n     받음', JSON.stringify(a), '\n     기대', JSON.stringify(b)) }
}

/* 현장 셋: 가(h1 · 지금) · 나 · 다(뺀 현장) */
const 가 = { co: '가건설', site: '가 현장', ym: '2026-10', P: [{ id: 'a1', n: '갑을병', j: '보통인부', b: '700101', w: 170000, nx: '', r: [['2026-10', null]] }], A: {} }
const 나 = { co: '가건설', site: '나 현장', ym: '2026-10', P: [
  { id: 'b1', n: '홍 길동', j: '형틀목공', b: '650315', w: 250000, nx: 'P' },
  { id: 'b2', n: '홍길순', j: '철근공', b: '', w: 240000, nx: '' },
  { id: 'b3', n: '갑을병', j: '보통인부', b: '700101', w: 170000, nx: '' },
  { id: 'b4', n: '', j: '빈이름', b: '', w: 1, nx: '' },
], A: {
  '2026-08': { b1: { d: { '03': 1 }, w: 230000 } },
  '2026-09': { b1: { d: { '05': 1 } } },
} }
const 다 = { co: '가건설', site: '다 현장', ym: '2026-10', P: [{ id: 'c1', n: '홍길동', j: '형틀목공', b: '650315', w: 260000, nx: '' }], A: {} }
localStorage.setItem('kcm_nomubi1', JSON.stringify(가))
localStorage.setItem('kcm_nomubi1@hb', JSON.stringify(나))
localStorage.setItem('kcm_nomubi1@hc', JSON.stringify(다))
localStorage.setItem('kcm_nomubi_sites', JSON.stringify({ cur: 'h1', L: [{ id: 'h1', n: '', at: 0 }, { id: 'hb', n: '', at: 1 }, { id: 'hc', n: '', at: 2, del: 3 }] }))

console.log('① 다른 현장 명단 — 지금 현장 · 뺀 현장 · 이름 빈 사람 빼고')
const 다른 = L.다른현장명단('h1')
eq(다른.map((h) => [h.현장id, h.현장명, h.사람.length]), [['hb', '나 현장', 3]], '나 현장만 · 3명(이름 빈 사람 뺌) · 뺀 다 현장 안 봄')
const 홍 = 다른[0].사람.find((p) => p.id === 'b1')
eq([홍.w, 홍.nx, 홍.마지막], [250000, 'P', '2026-09'], '일당 · 늘 빼기 = 마지막으로 일한 달(9월 · 명단 값 250,000)')
eq(L.현장사람들(나, 'hb', '나').find((p) => p.id === 'b2').마지막, '', '일한 달 없으면 마지막 = 빈칸')

console.log('② 이름으로 찾기')
eq(L.사람찾기(다른, '홍').map((p) => p.n), ['홍 길동', '홍길순'], '«홍» → 두 사람 · 최근 일한 사람 먼저')
eq(L.사람찾기(다른, '홍길동').map((p) => p.n), ['홍 길동'], '띄어쓰기 무시(«홍 길동» = «홍길동»)')
eq(L.사람찾기(다른, '길순').map((p) => p.n), ['홍길순'], '가운데 글자로도 찾음')
eq(L.사람찾기(다른, '  ').length, 0, '빈 글 → 없음')
eq(L.사람찾기(다른, '갑을병', new Set([L.사람열쇠(가.P[0])])).length, 0, '이 달 명단에 이미 있는 같은 사람(이름 + 생년월일)은 뺌')
eq(L.사람찾기(다른, '갑을병').length, 1, '안 빼면 나옴')
/* 같은 사람 · 같은 값이 두 현장에 → 한 번만(최근) · 값이 다르면 둘 다 */
const 두곳 = [{ 현장id: 'x', 현장명: 'x', 사람: [{ 현장id: 'x', 현장명: 'x', id: '1', n: '김가', j: '보통인부', b: '', w: 1, nx: '', 마지막: '2026-08' }] },
  { 현장id: 'y', 현장명: 'y', 사람: [{ 현장id: 'y', 현장명: 'y', id: '2', n: '김가', j: '보통인부', b: '', w: 1, nx: '', 마지막: '2026-09' }, { 현장id: 'y', 현장명: 'y', id: '3', n: '김가나', j: '보통인부', b: '', w: 2, nx: '', 마지막: '2026-10' }] }]
eq(L.사람찾기(두곳, '김가').map((p) => p.현장id + p.id), ['y2', 'y3'], '같은 값은 최근 현장 하나 · 이름 똑같은 사람 먼저')
eq(L.사람찾기(두곳, '김', new Set(), 1).length, 1, '최대 개수')

console.log('③ 빈 줄 채우기 · 여러 명 데려오기')
const 빈 = { ...가, P: [...가.P, { id: 'n1', n: '홍', j: '', b: '', w: 0, nx: '', r: [['2026-10', null]] }] }
const 채움 = L.줄에채움(빈, 'n1', 홍)
eq(채움.P.find((p) => p.id === 'n1'), { id: 'n1', n: '홍 길동', j: '형틀목공', b: '650315', w: 250000, nx: 'P', r: [['2026-10', null]] }, '빈 줄 → 이름 · 직종 · 생년월일 · 일당 · 늘 빼기(달 범위 그대로)')
eq(채움.A, 가.A, '출역은 안 건드림')
const 데 = L.데려오기(가, '2026-10', 다른[0].사람)
eq([데.넣음, 데.건넘], [2, 1], '세 명 중 이미 있는 갑을병(이름 + 생년월일) 건너뜀')
eq(데.st.P.slice(1).map((p) => [p.n, p.j, p.w, p.nx, JSON.stringify(p.r)]), [['홍 길동', '형틀목공', 250000, 'P', '[["2026-10",null]]'], ['홍길순', '철근공', 240000, '', '[["2026-10",null]]']], '이 달부터 명단에 · 값 그대로')
eq(new Set(데.st.P.map((p) => p.id)).size, 데.st.P.length, '새 번호 겹치지 않음')
eq(L.데려오기(데.st, '2026-10', 다른[0].사람).넣음, 0, '두 번 데려와도 겹쳐 넣지 않음')
eq(L.달셈(데.st, '2026-10').줄.length, 0, '출역이 없으니 지급명세에는 아직 안 나옴')
eq(JSON.parse(localStorage.getItem('kcm_nomubi1@hb')).P.length, 4, '다른 현장 자료는 그대로(읽기만)')

console.log(`\n${통과} 통과 · ${실패} 실패`)
if (실패) process.exit(1)
