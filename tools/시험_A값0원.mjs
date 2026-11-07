/**
 * 🧪 ⚖ G579 바로투찰 이용자 점검 — 화면 쪽(lib/bidmath.js · lib/mentor.js) (2026-11-07)
 *   소장님 「사이트에서 다시 이용자 입장에서 하나 하나 해봐. 고칠 것 고쳐야 해」
 *   ⑥ 취소공고 — 기초금액 · A값이 이어져 와도 계산 안 함(11-07 마감 전 9건이 «💰 권장 투찰금액» 을 냈음)
 *   ⑦ A값 0원(az 1) — A값을 아는 것으로 셈(나라장터 «A 0 원») · az 0 은 전처럼 «모름»
 *   node tools/시험_A값0원.mjs
 */
import * as B from '../web/src/lib/bidmath.js'
import { noteLive } from '../web/src/lib/mentor.js'
let 통과 = 0, 실패 = 0
const 봐 = (무엇, ok, 값) => { if (ok) { 통과++; console.log('  ✓', 무엇) } else { 실패++; console.log('  ✗', 무엇, 값 === undefined ? '' : JSON.stringify(값).slice(0, 300)) } }
const 지금 = '20261107120000'
const 줄 = (덧) => ({ no: 'R26BK09990001', base: 30813000, est: 28011818, llr: 89.745, lo: -3, hi: 3, ptot: 15, pdrw: 4,
  ayn: 'Y', aval: 1200000, close: '2026-11-10 10:00:00', ...덧 })

console.log('■ ⑥ 취소공고')
const 취 = 줄({ kind: '취소공고', tg: 4 })
봐('kind «취소공고» → 빠진 것 [«취소공고»] 하나 · isReady · canBid · quickBid 안 됨', JSON.stringify(B.missingOf(취)) === '["취소공고"]' && !B.isReady(취) && !B.canBid(취, 지금) && B.quickBid(취, 99.9) === null, B.missingOf(취))
봐('kind 가 없어도 유형 비트 4(취소) 면 취소공고', B.취소공고(줄({ tg: 4 })) && B.취소공고(줄({ tg: 4 | 2 | 16 })))
봐('재공고(1) · 변경(2) · 긴급(8) 은 취소 아님', !B.취소공고(줄({ tg: 1 })) && !B.취소공고(줄({ tg: 2 | 8 })) && !B.취소공고(줄({ kind: '변경공고', tg: 2 })))
봐('취소 아닌 같은 줄은 전처럼 계산', B.isReady(줄()) && B.quickBid(줄(), 99.896) !== null)
const 말 = noteLive(취, { ready: false })
봐('한마디 — «취소된 공고» · 금액 안 냄', 말 && /취소된 공고/.test(말.text) && 말.tone === 'bad', 말)

console.log('■ ⑦ A값 0원(az)')
const 영 = 줄({ aval: 0, az: 1 })
봐('az 1 → A값 앎 · 빠진 것 없음 · 계산 됨', B.A값앎(영) && B.missingOf(영).length === 0 && B.isReady(영) && B.canBid(영, 지금), B.missingOf(영))
const q영 = B.quickBid(영, 99.896)
const qN = B.quickBid(줄({ aval: 0, ayn: 'N' }), 99.896)
봐('az 1 금액 = A값 0 으로 셈한 금액(A값 미적용 N 과 같음) · A값 앎', q영 && qN && q영.amt === qN.amt && q영.aKnown === true, [q영 && q영.amt, qN && qN.amt])
봐('az 0 · az 없음 → 전처럼 «A값» 빠짐', B.missingOf(줄({ aval: 0, az: 0 })).includes('A값') && B.missingOf(줄({ aval: 0 })).includes('A값'))
봐('문자 «1» 로 와도 앎', B.A값앎(줄({ aval: 0, az: '1' })))
봐('A값이 있으면 az 와 상관없이 앎', B.A값앎(줄({ az: 0 })) && B.A값앎(줄({})))
봐('100억 넘는 공고는 az 1 이어도 smk 없으면 «표준시장단가»(G578 그대로)', B.missingOf(줄({ base: 2e10, est: 1.8e10, aval: 0, az: 1 })).includes('표준시장단가'))
봐('한마디 — 표준시장단가 빠짐은 그 까닭을 말함', /표준시장단가/.test((noteLive(줄({ base: 2e10, est: 1.8e10 }), { ready: false }) || {}).text || ''))
봐('한마디 — 다른 빠짐은 전과 같은 말', /아직 기초금액 같은 값이 안 들어와/.test((noteLive(줄({ base: 0 }), { ready: false }) || {}).text || ''))

console.log(`\n${통과 + 실패}개 중 틀림 ${실패}`)
process.exit(실패 ? 1 : 0)
