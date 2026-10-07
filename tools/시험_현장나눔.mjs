/**
 * 🧪 lib/nomubi.js — G178 노무비 계산기 현장별로 나눠 쓰기 (2026-10-07)
 *   node tools/시험_현장나눔.mjs
 *   맵톡 이용자 건의 「현장별로 나눠서 저장이 가능해야 되는데 그 기능은 없는 것 같아요」
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

console.log('① 처음 — 목록이 없으면 첫 현장 하나(예전 자리 그대로)')
const 옛 = { co: '가나건설', site: '가 현장', ym: '2026-10', P: [{ id: 'a', n: '갑', j: '보통인부', b: '700101', w: 170000, nx: '' }], A: { '2026-10': { a: { d: { '01': 1, '02': 1 } } } } }
localStorage.setItem('kcm_nomubi1', JSON.stringify(옛))
eq(L.현장목록(), { cur: 'h1', L: [{ id: 'h1', n: '', at: 0 }] }, '목록 없음 → h1 하나')
eq(L.현장자료열쇠('h1'), 'kcm_nomubi1', '첫 현장 자료 = 예전 열쇠')
eq(L.현장연결자리('h1'), 'nm', '첫 현장 이어 쓰기 = 예전 자리 nm')
eq(L.읽기().site, '가 현장', '읽기() = 지금 쓰던 자료')
eq(L.현장이름({ id: 'h1', n: '' }, 0), '가 현장', '목록 이름 = 그 현장 자료의 현장명')

console.log('② 새 현장 — 명단 가져오기')
let m = L.현장목록()
const r1 = L.현장더하기(m, '  나 현장  ', L.읽기현장('h1'), true)
m = r1.m
L.현장목록쓰기(m)
eq(m.cur, r1.id, '새 현장이 지금 현장')
eq(m.L.length, 2, '목록 둘')
eq(L.현장자료열쇠(r1.id), 'kcm_nomubi1@' + r1.id, '새 현장 자료 자리')
eq(L.현장연결자리(r1.id), 'nm@' + r1.id, '새 현장 이어 쓰기 자리')
const 새 = L.읽기()
eq([새.site, 새.co, 새.ym, 새.P.length, Object.keys(새.A).length], ['나 현장', '가나건설', '2026-10', 1, 0], '현장명 · 회사명 · 달 · 명단 1명 · 출역 없음')
eq([새.P[0].n, 새.P[0].j, 새.P[0].b, 새.P[0].w], ['갑', '보통인부', '700101', 170000], '이름 · 직종 · 생년월일 · 일당 옮김')
eq(새.P[0].id !== 'a', true, '새 번호')
eq(JSON.parse(localStorage.getItem('kcm_nomubi1')).P.length, 1, '첫 현장 자료 그대로')

console.log('③ 현장마다 따로 쓰기')
L.쓰기({ ...새, P: [...새.P, { id: 'x', n: '을', j: '철근', w: 250000, nx: '' }] })
eq(L.읽기현장(r1.id).P.length, 2, '나 현장에만 더해짐')
eq(L.읽기현장('h1').P.length, 1, '가 현장은 그대로')
L.쓰기현장('h1', { ...옛, site: '가 현장(고침)' })
eq(L.읽기현장(r1.id).site, '나 현장', '현장을 정해 쓰면 그 현장에만')

console.log('④ 명단 안 가져오기 · 이름 없이')
const r2 = L.현장더하기(m, '', L.읽기현장(m.cur), false)
m = r2.m; L.현장목록쓰기(m)
eq([L.읽기().P.length, L.읽기().site], [0, ''], '빈 명단 · 현장명 없음')
eq(L.현장이름(m.L[2], 2), '현장 3', '이름 없으면 «현장 3»')

console.log('⑤ 빼기 · 되살리기')
let m2 = L.현장지우기(m, r2.id)
eq([m2.cur, m2.L.filter((x) => !x.del).length, !!m2.L.find((x) => x.id === r2.id).del], ['h1', 2, true], '지금 현장을 빼면 남은 첫 현장으로')
eq(L.읽기현장(r2.id) !== null, true, '자료는 남음')
m2 = L.현장지우기(m2, r1.id)
eq(L.현장지우기(m2, 'h1'), m2, '하나 남은 현장은 못 뺌')
eq(L.현장지우기(m2, 'h없음'), m2, '없는 현장 → 그대로')
const m3 = L.현장되살리기(m2, r1.id)
eq([m3.cur, m3.L.find((x) => x.id === r1.id).del], [r1.id, undefined], '되살리면 지금 현장 · del 없어짐')
L.현장목록쓰기(m3)
eq(L.지금현장(), r1.id, '목록 저장 · 지금 현장')

console.log('⑥ 깨진 목록 · 지운 현장을 cur 로 적어 둔 목록')
localStorage.setItem('kcm_nomubi_sites', '{깨짐')
eq(L.현장목록(), { cur: 'h1', L: [{ id: 'h1', n: '', at: 0 }] }, '깨지면 첫 현장 하나')
localStorage.setItem('kcm_nomubi_sites', JSON.stringify({ cur: 'hzz', L: [{ id: 'h1', n: '', at: 0 }, { id: 'hzz', n: 'z', at: 1, del: 5 }] }))
eq(L.현장목록().cur, 'h1', '뺀 현장이 cur 면 살아 있는 첫 현장')
localStorage.setItem('kcm_nomubi_sites', JSON.stringify({ cur: 'h1', L: [{ id: '../x', n: '' }, { id: 'h1', n: '' }] }))
eq(L.현장목록().L.map((x) => x.id), ['h1'], '이상한 번호는 버림')

console.log('⑦ 명단만 — 이 달에 안 보이는 사람(뺀 사람)은 안 옮김 · 그 달 일당')
const st7 = { ym: '2026-10', P: [{ id: 'a', n: '갑', j: '', w: 100000, nx: '' }, { id: 'b', n: '을', j: '', w: 100000, nx: '', r: [[null, '2026-10']] }], A: { '2026-10': { a: { w: 120000 } } } }
const 옮김 = L.명단만(st7, '2026-10')
eq(옮김.map((p) => [p.n, p.w]), [['갑', 120000]], '뺀 을은 빠짐 · 갑은 10월 일당 120,000')

console.log('⑧ G179 여러 프로그램이 같이 쓰는 lib/현장나눔.js')
{
  const { 현장나눔 } = await import('../web/src/lib/현장나눔.js')
  const 나 = 현장나눔('wc')
  eq([나.목록열쇠, 나.열쇠('kcm.wonclick.v1', 'h1'), 나.열쇠('kcm.wonclick.v1', 'habc'), 나.연결자리('h1'), 나.연결자리('habc')],
    ['kcm_sites_wc', 'kcm.wonclick.v1', 'kcm.wonclick.v1@habc', 'wc', 'wc@habc'], '열쇠 · 연결 자리')
  let m = 나.목록()
  eq(m, { cur: 'h1', L: [{ id: 'h1', n: '', at: 0 }] }, '처음 — 첫 현장 하나')
  const r = 나.더하기(m, ' 다 공사 '); m = r.m; 나.목록쓰기(m)
  eq([나.지금(), m.L.length, m.L[1].n], [r.id, 2, '다 공사'], '더하기 → 지금 현장 · 이름 다듬음')
  eq(나.빼기(나.빼기(m, r.id), 'h1').L.filter((x) => !x.del).length, 1, '하나 남으면 못 뺌')
  eq(나.되살리기(나.빼기(m, r.id), r.id).cur, r.id, '되살리기')
  eq(현장나눔('ib').목록().cur, 'h1', '프로그램마다 목록 따로(작업일보는 그대로 첫 현장)')
}
console.log('⑨ 작업일보 lib/ilbo.js — 지금 현장 · 정해 쓰기')
{
  const I = await import('../web/src/lib/ilbo.js')
  localStorage.setItem('kcm_ilbo1', JSON.stringify({ 현장: { name: '라 현장', co: '라건설' }, 공종: [], 일: { '2026-10-07': { w: '맑음' } } }))
  eq(I.읽기().현장.name, '라 현장', '첫 현장 = 예전 자리')
  const r = I.일보나눔.더하기(I.일보나눔.목록(), '마 현장'); I.일보나눔.목록쓰기(r.m)
  I.쓰기현장(r.id, { ...I.빈것(), 현장: { name: '마 현장', co: '' } })
  eq([I.읽기().현장.name, Object.keys(I.읽기().일).length], ['마 현장', 0], '지금 현장 = 새 현장 · 날마다 적은 것 없음')
  eq(I.읽기현장('h1').일['2026-10-07'].w, '맑음', '첫 현장 그대로')
  eq(localStorage.getItem('kcm_ilbo1@' + r.id) !== null, true, '새 현장 자리')
}

console.log(`\n${통과} 통과 · ${실패} 실패`)
if (실패) process.exit(1)
