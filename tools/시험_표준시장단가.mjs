/**
 * 🧪 ⚖ G578 표준시장단가 — 화면 쪽(lib/bidmath.js) «100억 넘는 공고는 표준시장단가를 A값에 더한 줄(smk)만 계산» (2026-11-07)
 *   2026.7 개편: 추정가격 100억~300억 «기술형 적격심사» 는 표준시장단가 적용 공종 금액도 A값처럼 낙찰률에서 뺌
 *   (나라장터 «기초금액조회» A = 7개 항목 + 표준시장단가). smk 없는 줄은 A값이 모자랄 수 있어 금액을 내지 않습니다.
 *   node tools/시험_표준시장단가.mjs
 */
import * as B from '../web/src/lib/bidmath.js'
let 통과 = 0, 실패 = 0
const 봐 = (무엇, ok, 값) => { if (ok) { 통과++; console.log('  ✓', 무엇) } else { 실패++; console.log('  ✗', 무엇, 값 === undefined ? '' : JSON.stringify(값).slice(0, 300)) } }
const 지금 = '20261107120000'
/* 실제 공고 꼴(11-07 마감 전 하나 · 숫자는 나라장터 «기초금액조회» 그대로) — 공고번호 · 공고명은 안 씀(가상 번호) */
const 줄 = (덧) => ({ no: 'R26BK09990001', base: 22522764000, est: 20226550000, llr: 81.995, lo: -3, hi: 3, ptot: 15, pdrw: 4,
  ayn: 'Y', aval: 1380201371, close: '2026-11-10 10:00:00', ...덧 })

console.log('■ 표준대상 선')
봐('추정가격 100억 → 대상 · 99.99억 → 아님', B.표준대상({ est: 1e10 }) && !B.표준대상({ est: 9999999999 }))
봐('추정가격 없으면 기초금액 110억 → 대상 · 109.99억 → 아님', B.표준대상({ base: 1.1e10 }) && !B.표준대상({ base: 10999999999 }))
봐('추정가격이 있으면 그것으로(99억 · 기초 120억 → 아님)', !B.표준대상({ est: 9.9e9, base: 1.2e10 }))
봐('빈 줄 · null 은 아님', !B.표준대상({}) && !B.표준대상(null) && !B.표준모름(null))

console.log('■ smk 없는 100억 넘는 공고 — 계산하지 않음')
const 옛 = 줄()
봐('빠진 것에 «표준시장단가»', B.missingOf(옛).includes('표준시장단가') && !B.missingOf(옛).includes('A값'), B.missingOf(옛))
봐('isReady · canBid · quickBid 모두 «안 됨»', !B.isReady(옛) && !B.canBid(옛, 지금) && B.quickBid(옛, 99.9) === null)
봐('A값 미적용(N)인데 smk 가 없어도 «표준시장단가» 로 멈춤', B.missingOf(줄({ ayn: 'N', aval: 0 })).includes('표준시장단가'))
봐('smk Y 인데 A값 미적용(N) — 어떻게 셀지 몰라 멈춤', B.missingOf(줄({ ayn: 'N', smk: 'Y', aval: 4198886031 })).includes('표준시장단가'))
봐('A값 자체가 없으면 전처럼 «A값»(표준시장단가는 따로 안 붙임)', JSON.stringify(B.missingOf(줄({ aval: 0 }))) === JSON.stringify(['A값']))

console.log('■ smk 있는 줄 — 계산함 · 하한은 나라장터 A 로')
const 새 = 줄({ smk: 'Y', aval: 4198886031 })
봐('빠진 것 없음 · 계산 됨', B.missingOf(새).length === 0 && B.isReady(새) && B.canBid(새, 지금), B.missingOf(새))
const q = B.quickBid(새, 99.896)
const 하한 = (sj) => Math.ceil((새.base * sj / 100 - 새.aval) * 새.llr / 100 + 새.aval)
봐('권장 금액이 사정률 100% 하한(나라장터 A) 위', q && q.amt >= 하한(100), [q && q.amt, 하한(100)])
const q옛 = (() => { const r = { ...새, aval: 1380201371 }; return B.quickBid(r, 99.896) })()
봐('예전 A(표준시장단가 빠짐)로 낸 금액은 같은 하한 밑이었음 — 이번에 고친 까닭', q옛 && q옛.amt < 하한(100), [q옛 && q옛.amt, 하한(100)])
봐('smk N(표준시장단가 없음)도 계산 됨', B.isReady(줄({ smk: 'N' })))

console.log('■ 100억 아래는 전과 같음')
const 작은 = { ...줄({ base: 5e9, est: 4.5e9, aval: 1e8 }) }
봐('smk 없어도 계산 됨(표준시장단가 대상 아님)', B.missingOf(작은).length === 0 && B.isReady(작은))
const 작은q = B.quickBid(작은, 99.896)
봐('금액도 smk 있을 때와 같음', 작은q && B.quickBid({ ...작은, smk: 'N' }, 99.896).amt === 작은q.amt)

console.log(`\n${통과 + 실패}개 중 틀림 ${실패}`)
process.exit(실패 ? 1 : 0)
