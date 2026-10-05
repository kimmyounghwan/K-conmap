// 🎯 공사 견적서 — 목표 금액 맞추기 시험 (G140 · 2026-10-05) · node tools/시험_견적목표.mjs
import path from 'path'
import { fileURLToPath } from 'url'
const 여기 = path.dirname(fileURLToPath(import.meta.url))
const { 예시, 셈, 목표맞추기 } = await import(path.join(여기, '..', 'web', 'src', 'lib', 'gyeonjeok.js'))
let 틀림 = 0, 맞음 = 0
const 봄 = (이름, 참, 더 = '') => { if (!참) 틀림++; else 맞음++; console.log((참 ? '  ✓ ' : '  ✗ ') + 이름 + (더 ? ' — ' + 더 : '')) }
const 넣기 = (견, r) => (견.방식 === 'public' ? { ...견, 공공: { ...견.공공, 요율: { ...견.공공.요율, 이윤: String(r) } } } : { ...견, 간단: { ...견.간단, 이윤: String(r) } })
for (const 방식 of ['simple', 'public']) {
  const 견 = 예시(방식)
  const S0 = 셈(견)
  console.log(`${방식} — 지금 견적 금액 ${S0.견적금액.toLocaleString()} · 합계 ${S0.합계.toLocaleString()}`)
  const 목표 = Math.round(S0.견적금액 * 0.97 / 100000) * 100000
  for (const 기준 of ['견적', '공급', '합계']) {
    const r = 목표맞추기(견, 목표, 기준)
    const S = 셈(넣기(견, r.이윤율))
    const 값 = 기준 === '공급' ? (방식 === 'public' ? S.총원가 : S.공급) : 기준 === '합계' ? S.합계 : S.견적금액
    const S2 = 셈(넣기(견, (r.이윤율 + 0.01).toFixed(2)))
    const 값2 = 기준 === '공급' ? (방식 === 'public' ? S2.총원가 : S2.공급) : 기준 === '합계' ? S2.합계 : S2.견적금액
    봄(`${기준} ${목표.toLocaleString()} → 이윤 ${r.이윤율}% · ${r.금액.toLocaleString()} (차이 ${r.차이})`, r.됨 && 값 === r.금액 && 값 <= 목표 && 값2 > 목표)
  }
  const 못 = 목표맞추기(견, 1000, '견적')
  봄('이윤 0%로도 넘으면 «안 됨» · 최소 금액', !못.됨 && 못.최소 > 1000)
}
const 공 = 예시('public')
const 큰 = 목표맞추기(공, Math.round(셈(공).견적금액 * 1.2), '견적')
봄('공공 — 15% 넘으면 경고', 큰.됨 && 큰.이윤율 > 15 && 큰.한도넘음 === true, `${큰.이윤율}%`)
const 간 = { ...예시('simple') }; 간.간단 = { ...간.간단, 절사: 10000 }
const 꼭 = 목표맞추기(간, Math.round(셈(간).견적금액 * 0.95 / 10000) * 10000, '견적')
봄('끝전 만 원 + 견적 금액 기준 → 목표와 꼭 같음', 꼭.됨 && 꼭.차이 === 0, `차이 ${꼭.차이}`)
console.log(`\n${맞음 + 틀림}개 중 틀림 ${틀림}`)
process.exit(틀림 ? 1 : 0)
