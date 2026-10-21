// ⚖ 2026-10-21 G356 바로투찰 «순공사원가 98 % 선» 계산 잠금 — bidmath.js
//   근거: 조달청 시설공사 적격심사세부기준 제5조 · 지방자치단체 입찰시 낙찰자 결정기준 제2장 제4절 (2026.7.1. 시행)
//   ① pcLine 손셈 값 · 100억 경계 · 잘못 온 값  ② limitAmount = 큰 쪽 · pc 없으면 전과 같음
//   ③ passProb 가 «사정률을 촘촘히 훑어 센 통과 확률» 과 같음(100억 걸침 두 토막까지)  ④ 권장 · 분위 금액은 그 분위까지 통과
//   ⑤ quickBid 가 r.pc 를 씀 · 기초금액보다 크면 안 씀  ⑥ buildScen 줄마다 limitAmount 와 같음
// 돌리기: node tools/시험_순공사원가셈.mjs
import * as B from '../web/src/lib/bidmath.js'
let ok = 0, bad = 0
const 봐 = (c, m, 더 = '') => { if (c) { ok++; console.log('✓', m, 더) } else { bad++; console.log('✗', m, 더) } }

// ① 손셈: 기초 4.5억 · 순공사원가 4.2억 · 예정가격 451,858,500 → 올림(4.2억 × 451,858,500 ÷ 4.5억) = 421,734,600 → × 0.98 = 413,299,908
봐(B.pcLine(450000000, 451858500, 420000000) === 413299908, '① 손셈 413,299,908', B.pcLine(450000000, 451858500, 420000000))
// 소수 올림 두 번: 기초 3억 · 순공사원가 2.85억 · 예정가격 300,000,001 → 285,000,000.95 → 285,000,001 → 279,300,000.98 → 279,300,001
봐(B.pcLine(300000000, 300000001, 285000000) === 279300001, '① 소수점 첫째 자리 이하 올림(두 번)', B.pcLine(300000000, 300000001, 285000000))
봐(B.pcLine(1e10, 1e10, 9e9) === 0 && B.pcLine(1e10, 1e10 - 1, 9e9) > 0, '① 예정가격 100억 «미만» 만 — 100억 정각은 없음')
봐(B.pcLine(450000000, 451858500, 0) === 0 && B.pcLine(450000000, 451858500, 500000000) === 0 && B.pcLine(0, 1, 1) === 0, '① 순공사원가 없음 · 기초금액보다 큼 · 기초 0 → 0')

// ② limitAmount
const L0 = B.limitAmount(450000000, 100.413, 89.745, 22000000)
봐(B.limitAmount(450000000, 100.413, 89.745, 22000000, 0) === L0 && L0 === Math.ceil((450000000 * 1.00413 - 22000000) * 0.89745 + 22000000), '② pc 없으면 전과 같은 낙찰하한', L0)
봐(B.limitAmount(450000000, 100.413, 89.745, 22000000, 420000000) === 413299908, '② 98 % 선이 높으면 그 선')
봐(B.limitAmount(450000000, 100.413, 89.745, 22000000, 380000000) === L0, '② 98 % 선이 낮으면 낙찰하한 그대로')

// ③ passProb = 사정률을 촘촘히 훑어 센 값
const 훑기 = ({ base, llRate, aVal, amt, p50, sd, pc }) => {
  let p = 0; const n = 40000, a = p50 - 8 * sd, b = p50 + 8 * sd, h = (b - a) / n
  for (let i = 0; i < n; i++) { const s = a + (i + 0.5) * h; const z = (s - p50) / sd; if (amt >= B.limitAmount(base, s, llRate, aVal, pc)) p += Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI) * h / sd }
  return p
}
const sd3 = B.sjSigma(-3, 3, 15, 4)
const 경우 = [
  ['4.5억 · 98 % 선 높음', { base: 450000000, llRate: 89.745, aVal: 22000000, amt: 414540430, p50: 99.896, sd: sd3, pc: 420000000 }],
  ['4.5억 · 98 % 선 낮음', { base: 450000000, llRate: 89.745, aVal: 22000000, amt: 409002195, p50: 99.896, sd: sd3, pc: 380000000 }],
  ['100억 걸침 · 98 % 선 대비 금액', { base: 1e10, llRate: 87.495, aVal: 4e8, amt: 9239700000, p50: 99.896, sd: sd3, pc: 9.4e9 }],
  ['100억 걸침 · 낙찰하한만 맞춘 금액(두 토막)', { base: 1e10, llRate: 87.495, aVal: 4e8, amt: 8862173744, p50: 99.896, sd: sd3, pc: 9.4e9 }],
  ['늘 100억 넘음', { base: 1.05e10, llRate: 87.495, aVal: 4e8, amt: 9302800000, p50: 99.896, sd: sd3, pc: 9.9e9 }],
]
for (const [이름, o] of 경우) {
  const pp = B.passProb(o), 셈 = 훑기(o)
  봐(pp && Math.abs(pp.p - 셈) < 2e-3, `③ ${이름} — 통과 확률 ${(pp.p * 100).toFixed(2)}% = 훑어 센 ${(셈 * 100).toFixed(2)}%`)
}
const 두토막 = B.passProb(경우[3][1])
봐(두토막.p > 0.05 && 두토막.p < 0.95 && 두토막.sj < 100, '③ 두 토막: 처음 걸리는 사정률(100 % 아래)을 말하고 확률은 100억 위 토막까지 셈', `${두토막.sj} · ${(두토막.p * 100).toFixed(1)}%`)

// ④ 권장 · 분위 금액은 «그 분위 사정률까지» 어디로 나와도 통과
for (const [base, A, ll, pc] of [[450000000, 22000000, 89.745, 420000000], [1e10, 4e8, 87.495, 9.4e9], [9.95e9, 4e8, 87.495, 9.4e9], [3e8, 0, 89.745, 285000000]]) {
  const ro = B.recommend({ base, llRate: ll, aVal: A, aKnown: true, p50: 99.896, sd: sd3, pc })
  let 다통과 = true
  for (let s = 95; s <= ro.sj; s += 0.001) if (ro.amt < B.limitAmount(base, s, ll, A, pc)) { 다통과 = false; break }
  봐(다통과, `④ 권장 ${base.toLocaleString()} — 사정률 95 %~${ro.sj}% 어디서도 하한 아래가 아님`, ro.amt.toLocaleString())
  const qb = B.quantileBid({ base, llRate: ll, aVal: A, p50: 99.896, sd: sd3, q: 80, pc })
  let q다 = true
  for (let s = 95; s <= qb.sj; s += 0.001) if (qb.amt < B.limitAmount(base, s, ll, A, pc)) { q다 = false; break }
  봐(q다, `④ 80분위 ${base.toLocaleString()} — ${qb.sj}% 까지 통과`)
}
const 옛 = B.recommend({ base: 1e10, llRate: 87.495, aVal: 4e8, aKnown: true, p50: 99.896, sd: sd3 })
봐(옛.amt === Math.ceil(Math.ceil((1e10 * (옛.sj / 100) - 4e8) * 0.87495 + 4e8) * 1.003), '④ pc 없으면 권장 금액 식이 전과 똑같음')

// ⑤ quickBid
const 줄 = { base: 450000000, llr: 89.745, aval: 22000000, ayn: 'Y', lo: -3, hi: 3, ptot: 15, pdrw: 4, enp: 0 }
const q0 = B.quickBid(줄, 99.896), q1 = B.quickBid({ ...줄, pc: 420000000 }, 99.896), q2 = B.quickBid({ ...줄, pc: 460000000 }, 99.896)
봐(q0.amt === 409002195 && q1.amt === 414540430, `⑤ 공고 카드 금액이 r.pc 를 씀 ${q0.amt.toLocaleString()} → ${q1.amt.toLocaleString()}`)
봐(q2.amt === q0.amt, '⑤ 기초금액보다 큰 pc(잘못 온 값)는 안 씀')
const q3 = B.quickBid({ ...줄, pc: 420000000, enp: 5 }, 99.896)
봐(q3.mode === 'auto' && q3.amt >= B.limitAmount(450000000, q3.sj, 89.745, 22000000, 420000000), '⑤ 예상 참가 적은 공고(자동 80분위)도 98 % 선 위', q3.amt.toLocaleString())

// ⑥ buildScen
const sc = B.buildScen({ base: 450000000, llRate: 89.745, aVal: 22000000, p50: 99.896, sd: sd3, myAmt: 414540430, pc: 420000000 })
봐(sc.rows.every((r) => r.low === B.limitAmount(450000000, r.sj, 89.745, 22000000, 420000000) && r.pass === (414540430 >= r.low)), '⑥ 「사정률이 이 값이었다면」 줄마다 같은 하한', `통과 ${sc.passN}/10`)

console.log(`\n${ok} 통과 · ${bad} 실패`)
process.exit(bad ? 1 : 0)
