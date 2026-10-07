/**
 * 🧪 lib/확보예가자료.js — G184 확보 예가 «작은 자료» (2026-10-07)
 *   node tools/시험_확보예가자료.mjs [개찰 자료 first.json — 있으면 실제 자료로도 맞춰 봄]
 *   작은 자료로 센 확보 예가가 개찰 자료 통째로 센 것과 같은지(사정률 0.0001 반올림만큼만 다름) 봅니다.
 */
import fs from 'fs'
import * as B from '../web/src/lib/bidmath.js'
import * as T from '../web/src/lib/투찰자리.js'
import * as K from '../web/src/lib/확보예가자료.js'
let 통과 = 0, 실패 = 0
const 봐 = (무엇, ok, 값) => { if (ok) { 통과++; console.log('  ✓', 무엇) } else { 실패++; console.log('  ✗', 무엇, 값 === undefined ? '' : JSON.stringify(값).slice(0, 300)) } }
const 같다 = (a, b, e = 1e-9) => a != null && b != null && Math.abs(a - b) <= e

/* 지어낸 개찰 — 기초 1억 · 하한율 87.745 · ±2% */
const base = 100000000, llr = 87.745
const 금 = (s) => Math.ceil(base * s / 100 * llr / 100)
const 개찰 = (no, dt, 바꿈 = {}) => ({
  no, dt, name: '시험 공사', inst: '시험시', site: '전라남도 순천시', base: String(base), llr: String(llr), aval: '0', lo: '-2.0', hi: '2.0', ptot: '15', pdrw: '4',
  np: '5', nrank: '5', corps: [100.4, 100.9, 99.5, 99.8, 100.1].map((s, i) => ['업체' + i, 금(s), 90, '90000000' + String(i).padStart(2, '0'), '대표', 1, 2]), ...바꿈,
})
console.log('■ 만들기 · 풀기')
const 줄 = 개찰('A', '2026-09-03 10:00:00')
const m = K.미니만들기([줄, { ...줄, no: 'B', base: '' }, { ...줄, no: 'C', corps: [줄.corps[0]] }])
봐('셀 수 없는 줄(기초 없음 · 혼자)은 뺌', m.r.length === 1 && m.i.length === 1, m)
const [풀] = K.미니풀기(m)
봐('날 · 기관 · 시도(전라남도 → 전남)', 풀.dt === '2026-09-03' && 풀.inst === '시험시' && 풀.site === '전남', 풀)
봐('기초 · 하한율 · 예가범위 · 예비 수 · 참가', 풀.base === base && 같다(풀.llr, llr) && 풀.lo === -2 && 풀.hi === 2 && 풀.ptot === 15 && 풀.pdrw === 4 && 풀.np === 5)
봐('사정률 _s = 하한선 사정률(개찰 순위 차례 · 0.0001 반올림)', 풀._s.length === 5 && 풀._s.every((s, i) => Math.abs(s - B.breakEvenSj(base, llr, 0, 줄.corps[i][1])) <= 0.00005 + 1e-12), 풀._s)
봐('판이 다르면 빈 것', K.미니풀기({ v: 99, r: m.r }).length === 0 && K.미니풀기(null).length === 0)
봐('시도of — 경기도 광주시 → 경기 · 광주광역시 → 광주 · 전남광주통합특별시 → 전남', K.시도of('경기도 광주시') === '경기' && K.시도of('광주광역시 북구') === '광주' && K.시도of('전남광주통합특별시 광양시') === '전남' && K.시도of('') === '')
봐('업체조각 0~999', K.업체조각('5058131837') === 183 && K.업체조각('') === 0 && K.업체조각('123') === 0)

console.log('■ 작은 자료로 센 미리확보 = 통째로 센 것')
const 여럿 = Array.from({ length: 6 }, (_, i) => 개찰('M' + i, `2026-09-1${i} 10:00:00`, { np: i % 2 ? '400' : '5', nrank: i % 2 ? '400' : '5' }))
const 작 = K.미니풀기(K.미니만들기(여럿))
/* 격자 칸이 업체 사정률과 «딱 맞는» 칼날 자리(0.0001 반올림으로 앞뒤가 바뀜)는 피해서 고름 */
for (const s of [100.25, 100.62, 100.73, 101.03]) {
  const a = T.미리확보(여럿, s, 99.896), b = T.미리확보(작, s, 99.896)
  const ok = (a == null) === (b == null) && (!a || ((a.배가운데 == null) === (b.배가운데 == null) && (a.배가운데 == null || 같다(a.배가운데, b.배가운데, 0.02 * Math.max(1, a.배가운데)))) && a.잰 === b.잰 &&
    a.격자.every((g, i) => (g.배 == null) === (b.격자[i].배 == null) && (g.배 == null || 같다(g.배, b.격자[i].배, 0.02 * Math.max(1, g.배)))))
  봐(`사정률 ${s} — 배가운데 · 잰 · 격자 13칸 같음`, ok, [a && a.배가운데, b && b.배가운데, a && a.잰, b && b.잰])
}
const 고 = T.비슷한개찰(작, { inst: '없는기관', sido: '전남', base: 1.2e8 }, { 최소: 5 })
봐('비슷한개찰 — 작은 자료(시도 줄임말)로도 시도로 고름', 고.고른 === '전남 · 비슷한 금액' && 고.rows.length === 6, 고.고른)

console.log('■ 업체요약 = 투찰자리에서 업체 페이지가 쓰는 것')
const t = T.투찰자리('9000000001', 여럿, 99.896)
const 요 = K.업체요약(t)
봐('요약 칸 · 최근 20줄 이하', 요 && 요.잰개찰 === t.잰개찰 && 요.몫잰 === t.몫잰 && 요.배가운데 === t.배가운데 && 요.기대1순위 === t.기대1순위 && 요.잰1순위 === t.잰1순위 && 요.최근.length === Math.min(20, t.최근.length), 요)
/* 🔎 G189 사업자번호로 보기 — 평균 예가 합 · 확보 예가 합 · 1순위 · 분포 */
const 잰줄 = t.최근.filter((x) => x.확보 != null)
봐('G189 확보합 · 평균합 = 잰 개찰의 합(반올림)', Math.abs(요.확보합 - 잰줄.reduce((p, x) => p + x.확보, 0)) <= 잰줄.length && Math.abs(요.평균합 - 잰줄.reduce((p, x) => p + x.평균, 0)) <= 잰줄.length, [요.확보합, 요.평균합])
봐('G189 평균1순위 = Σ 1/참가', Math.abs(요.평균1순위 - t.최근.reduce((p, x) => p + 1 / x.n, 0)) < 0.01, 요.평균1순위)
봐('G189 분포 20칸 · 합 = 넣은 개찰 수(내 · 1순위)', 요.분포.내.length === 20 && 요.분포.내.reduce((p, q) => p + q, 0) === t.잰개찰 && 요.분포.일순.reduce((p, q) => p + q, 0) === t.잰개찰, 요.분포)
봐('G189 최근 줄에 예정 사정률 · 1순위 사정률 · 실격', 요.최근.every((x) => 'dt' in x && '예정s' in x && '일순s' in x && (x.실격 === 0 || x.실격 === 1)))
봐('G189 분포찾기 — 98 미만은 첫 칸 · 102 넘으면 끝 칸 · 100.05 → 10칸', T.분포찾기(97.1) === 0 && T.분포찾기(103) === 19 && T.분포찾기(100.05) === 10 && T.분포찾기(null) === -1)
봐('최근 줄 칸(개찰일 · 공고 · 등수 · 참가 · 투찰 사정률 · 확보 · 배)', 요.최근.every((x) => 'dt' in x && 'name' in x && 'rank' in x && 'n' in x && '내s' in x && '확보' in x && '배' in x))
봐('업체요약(null) = null', K.업체요약(null) === null)

/* 실제 자료 — 개찰마다 하나씩 짝지어(같은 참고 개찰) 맞춰 봄 */
const 길 = process.argv[2]
if (길 && fs.existsSync(길)) {
  console.log('■ 실제 개찰 자료로')
  const rows = Object.values(JSON.parse(fs.readFileSync(길, 'utf8')).con || {})
  const 짝 = []
  for (const r of rows) { const x = K.미니풀기(K.미니만들기([r])); if (x.length === 1) 짝.push([r, x[0]]) }
  봐(`짝 ${짝.length}개 — 작은 자료가 받은 줄 수와 같음`, 짝.length === K.미니만들기(rows).r.length)
  let 다름 = 0, 잰다름 = 0, 잰 = 0, 최대 = 0, 큰차 = 0
  for (let k = 0; k < 300; k++) {
    const 시작 = (k * 37) % Math.max(1, 짝.length - 60)
    const 묶 = 짝.slice(시작, 시작 + 60)
    const r0 = 묶[0][0]
    const q = B.quickBid(r0, 99.896)
    if (!q) continue
    const s = B.breakEvenSj(Number(r0.base), Number(r0.llr), r0.ayn === 'N' ? 0 : Number(r0.aval) || 0, q.amt)
    for (const d of [-0.2, 0, 0.2]) {
      const a = T.미리확보(묶.map((p) => p[0]), s + d, 99.896), b = T.미리확보(묶.map((p) => p[1]), s + d, 99.896)
      if (!a || !b) { if (!!a !== !!b) 다름++; continue }
      잰++
      if (a.잰 !== b.잰) 잰다름++
      if (a.배가운데 != null && b.배가운데 != null) { const dd = Math.abs(a.배가운데 - b.배가운데) / Math.max(1, a.배가운데); 최대 = Math.max(최대, dd); if (dd > 0.02) 큰차++ }
      else if ((a.배가운데 == null) !== (b.배가운데 == null)) 다름++
    }
  }
  봐(`실제 ${잰}번 — 잴 수 있음 · 없음 같음`, 다름 === 0, 다름)
  봐(`실제 — 잰 개찰 수 다른 경우 ${잰다름}번(0.001 반올림 경계 · 1% 이하)`, 잰다름 <= 잰 * 0.01, 잰다름)
  /* 2% 넘게 다른 것은 내 사정률이 어떤 업체 사정률과 0.0001 안으로 붙은 «칼날» 자리 — 통째로 센 값도 1원만 움직이면 뒤집힘 */
  봐(`실제 — 배가운데가 2% 넘게 다른 경우 ${큰차}번 / ${잰}번(최대 ${(최대 * 100).toFixed(1)}% · 반올림 경계 · 1% 이하)`, 큰차 <= 잰 * 0.01, 큰차)
}
console.log(`\n${통과} 통과 · ${실패} 실패`)
if (실패) process.exit(1)
