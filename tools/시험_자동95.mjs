/**
 * 🎯 G624 «예상 참가 100곳+ → 자동 95분위» 셈 시험 — node tools/시험_자동95.mjs
 *   소장님(11-09) 「투찰금액을 더 정교하게」 → 지난 개찰 다시 재 봄(tools/시험_투찰자리뒤로.py) → 「적용해줘」
 *   ① autoRule 경계(0 · 5 · 9 · 10 · 99 · 100 · 2,000) ② smartBid · quickBid 가 95분위 금액(quantileBid)과 같음 ③ 30~99곳 · 모름은 권장 그대로
 *   ④ 2~9곳은 전처럼 80분위 ⑤ A값 모름이면 권장(z 1.63)과 0.05 % 안 ⑥ 순공사원가 98 % 선(pc)도 같이 지킴
 */
import * as B from '../web/src/lib/bidmath.js'

let bad = 0, n = 0
const ok = (이름, c, got) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (c || got === undefined ? '' : ' = ' + JSON.stringify(got).slice(0, 300))) }
const P50 = 99.896

/* ① 경계 */
const q = (e) => (B.autoRule(e) || {}).q ?? null
ok('autoRule 0 · −1 → 없음', q(0) === null && q(-1) === null)
ok('autoRule 5 · 9 → 80분위', q(5) === 80 && q(9) === 80)
ok('autoRule 10 · 30 · 99 → 없음(권장)', q(10) === null && q(30) === null && q(99) === null)
ok('autoRule 100 · 150 · 2,000 → 95분위', q(100) === 95 && q(150) === 95 && q(2000) === 95)
ok('AUTO_RULE 95분위 칸 — 실측 숫자(4,789건 · 1순위 2.57 · 실격 5.43 · 권장 2.69 · 14.6)', (() => {
  const r = B.AUTO_RULE.find((x) => x.minNp === 100)
  return r && r.q === 95 && r.n === 4789 && r.win === 2.57 && r.dq === 5.43 && r.recWin === 2.69 && r.recDq === 14.6
})())

/* ② ~ ⑥ 가상 공고 */
const 줄 = { base: 312400000, llr: 89.745, aval: 14800000, ayn: 'Y', lo: -3, hi: 3, ptot: 15, pdrw: 4, enp: 150 }
const sd = B.sjSigma(-3, 3, 15, 4)
const q95 = B.quantileBid({ base: 줄.base, llRate: 줄.llr, aVal: 줄.aval, p50: P50, sd, q: 95 })
const sb = B.smartBid({ base: 줄.base, llRate: 줄.llr, aVal: 줄.aval, aKnown: true, p50: P50, sd, enp: 150 })
ok('smartBid(예상 150곳) — 자동 · 95분위 · 금액 = quantileBid 95', sb && sb.mode === 'auto' && sb.pctile === 95 && sb.amt === q95.amt && sb.rate === q95.rate, { sb, q95 })
const qb = B.quickBid(줄, P50)
ok('quickBid(공고 카드 · 원클릭) = smartBid 같은 금액', qb && qb.amt === sb.amt && qb.mode === 'auto', qb)
const rec = B.recommend({ base: 줄.base, llRate: 줄.llr, aVal: 줄.aval, aKnown: true, p50: P50, sd })
const recShown = B.shownBid(줄.base, P50, rec.amt)
ok('95분위 금액이 권장보다 높음(실격을 줄이는 쪽) · 차이 1% 안', sb.amt > recShown.amt && (sb.amt - recShown.amt) / recShown.amt < 0.01, { auto: sb.amt, rec: recShown.amt })
const sb50 = B.smartBid({ base: 줄.base, llRate: 줄.llr, aVal: 줄.aval, aKnown: true, p50: P50, sd, enp: 50 })
ok('예상 50곳 — 권장 그대로(75분위 + 0.3 %)', sb50 && sb50.mode === 'rec' && sb50.amt === recShown.amt, sb50)
const sb0 = B.smartBid({ base: 줄.base, llRate: 줄.llr, aVal: 줄.aval, aKnown: true, p50: P50, sd, enp: 0 })
ok('예상 참가 모름 — 권장 그대로', sb0 && sb0.mode === 'rec' && sb0.amt === recShown.amt)
const sb7 = B.smartBid({ base: 줄.base, llRate: 줄.llr, aVal: 줄.aval, aKnown: true, p50: P50, sd, enp: 7 })
const q80 = B.quantileBid({ base: 줄.base, llRate: 줄.llr, aVal: 줄.aval, p50: P50, sd, q: 80 })
ok('예상 7곳 — 전처럼 80분위', sb7 && sb7.mode === 'auto' && sb7.pctile === 80 && sb7.amt === q80.amt)
const sbA = B.smartBid({ base: 줄.base, llRate: 줄.llr, aVal: 0, aKnown: false, p50: P50, sd, enp: 0 })
const sbA150 = B.smartBid({ base: 줄.base, llRate: 줄.llr, aVal: 0, aKnown: false, p50: P50, sd, enp: 150 })
ok('A값 모름 — 예상 150곳은 자동 95분위(z 1.6449) · 모름은 권장(z 1.63 · 여유 없음) — 금액 차 0.05 % 안', sbA && sbA150 && sbA150.mode === 'auto' && sbA.mode === 'rec'
  && sbA150.amt >= sbA.amt && (sbA150.amt - sbA.amt) / sbA.amt < 0.0005, { sbA: sbA.amt, sbA150: sbA150.amt })
/* 순공사원가 98 % 선 — 예정가격이 100억 아래인 공고에서 95분위 금액도 그 선 아래로 안 내려감 */
const pc = Math.round(줄.base * 0.93)
const sbPc = B.smartBid({ base: 줄.base, llRate: 줄.llr, aVal: 줄.aval, aKnown: true, p50: P50, sd, enp: 150, pc })
const sj95 = Math.round((P50 + 1.6449 * sd) * 1000) / 1000
const 선 = B.pcLine(줄.base, 줄.base * (sj95 / 100), pc)
ok('순공사원가 98 % 선 — 95분위 금액 ≥ 그 선(사정률 95분위 예정가격 기준)', sbPc && sbPc.amt >= 선, { amt: sbPc && sbPc.amt, 선 })
/* ±2 % 공고도 */
const sd2 = B.sjSigma(-2, 2, 15, 4)
const sb2 = B.smartBid({ base: 98700000, llRate: 89.745, aVal: 3100000, aKnown: true, p50: P50, sd: sd2, enp: 420 })
const q952 = B.quantileBid({ base: 98700000, llRate: 89.745, aVal: 3100000, p50: P50, sd: sd2, q: 95 })
ok('±2 % 공고(예상 420곳) — 95분위 금액', sb2 && sb2.mode === 'auto' && sb2.amt === q952.amt)

console.log(`\n${bad ? '❌' : '✅'} 시험_자동95 ${n - bad}/${n}`)
process.exit(bad ? 1 : 0)
