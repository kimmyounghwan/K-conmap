/* 🧪 G328 (2026-10-20) 설계변경 증감 계산(/change/calc · lib/설계변경셈.js calcRow) — 다시 안 틀리게 잠금
 *   소장님 「내역서 부터 차례 차례 검증하자」 — 실제 사이트에서 세 번 넣고 손셈과 대 봄(기록_2026-10.md)
 *   ① 규정(국가계약법 시행령 제65조③): 증가 = 계약단가(예정가격단가보다 높으면 예정가격단가) · 감소 = 계약단가 · 신규 = 변경 당시 단가 × 낙찰률
 *      · 정부 요구(계약상대자 책임 없는 사유 포함) = 협의, 불성립이면 (단가 + 단가 × 낙찰률) × 50%
 *   ② 단가 · 조정액 «원 미만 버림» — 전엔 13,580.25원을 그대로 곱해 «13,580원 × 12.5 = 169,750» 인데 조정액 169,753
 *   node tools/시험_설계변경계산.mjs */
import { calcRow, 붙여읽기 } from '../web/src/lib/설계변경셈.js'
let 셈 = 0, 틀림 = 0
const 봄 = (뜻, ok, 덧 = '') => { 셈++; if (!ok) 틀림++; console.log((ok ? '✓ ' : '✗ ') + 뜻 + (덧 !== '' ? ' — ' + 덧 : '')) }
const R = (o) => ({ name: '', unit: '', q0: '', q1: '', upCtr: '', upEst: '', upNow: '', by: 'me', ...o })
const 합 = (rows, rate) => rows.map((r) => calcRow(r, rate)).reduce((a, b) => a + b.amt, 0)
/* C1 — 낙찰률 87% */
{
  const rate = 870000000 / 1000000000
  const a = calcRow(R({ kind: 'inc', q0: '100', q1: '130', upCtr: '50,000', upEst: '48,000' }), rate)
  봄('증가 — 계약 50,000 > 예가 48,000 → 48,000 × 30 = 1,440,000', a.unit === 48000 && a.amt === 1440000, `${a.unit} ${a.amt}`)
  const b = calcRow(R({ kind: 'dec', q0: '200', q1: '150', upCtr: '12,500' }), rate)
  봄('감소 — 계약단가 12,500 × −50 = −625,000', b.unit === 12500 && b.amt === -625000, `${b.unit} ${b.amt}`)
  const c = calcRow(R({ kind: 'new', q1: '40', upNow: '80,000' }), rate)
  봄('신규 — 80,000 × 87% = 69,600 × 40 = 2,784,000', c.unit === 69600 && c.amt === 2784000, `${c.unit} ${c.amt}`)
  봄('합 3,599,000', a.amt + b.amt + c.amt === 3599000)
}
/* C2 — 92% · 발주기관 요구 */
{
  const rate = 920000000 / 1000000000
  const a = calcRow(R({ kind: 'inc', q0: '10', q1: '25', upNow: '100,000', by: 'owner' }), rate)
  봄('정부 요구 증가 — (100,000 + 92,000) × 50% = 96,000 × 15', a.unit === 96000 && a.amt === 1440000 && a.owner, `${a.unit} ${a.amt}`)
  const b = calcRow(R({ kind: 'new', q1: '3', upNow: '1,234,567', by: 'owner' }), rate)
  봄('정부 요구 신규 — 1,234,567 × 1.92 / 2 = 1,185,184(버림) × 3 = 3,555,552', b.unit === 1185184 && b.amt === 3555552, `${b.unit} ${b.amt}`)
  const c = calcRow(R({ kind: 'inc', q0: '5', q1: '7.5', upCtr: '33,333', upEst: '40,000' }), rate)
  봄('증가 — 계약 33,333 < 예가 → 33,333 × 2.5 = 83,332(버림)', c.unit === 33333 && c.amt === 83332, `${c.unit} ${c.amt}`)
  봄('줄 합 = 화면 합계 5,078,884(전엔 줄 합 5,078,886 · 합계 5,078,885)', a.amt + b.amt + c.amt === 5078884)
  봄('정부 요구 설명에 «계약상대자에게 책임 없는 사유» ', /책임 없는 사유/.test(a.why) && /책임 없는 사유/.test(b.why))
}
/* C3 — 90.535% · 소수 수량 · 감소 · 예정가격단가 비움 */
{
  const rate = 543210000 / 600000000
  const a = calcRow(R({ kind: 'new', q1: '12.5', upNow: '15,000' }), rate)
  봄('신규 — 15,000 × 90.535% = 13,580(버림) × 12.5 = 169,750(전엔 169,753)', a.unit === 13580 && a.amt === 169750, `${a.unit} ${a.amt}`)
  const b = calcRow(R({ kind: 'dec', q0: '3', q1: '0', upCtr: '1,000,000' }), rate)
  봄('감소 — −3,000,000', b.amt === -3000000)
  const c = calcRow(R({ kind: 'inc', q0: '0', q1: '1', upCtr: '999' }), rate)
  봄('증가 — 예정가격단가 비우면 계약단가 999', c.unit === 999 && c.amt === 999)
  const d = calcRow(R({ kind: 'dec', q0: '10', q1: '7.3', upCtr: '1,001' }), rate)
  봄('감소 소수 — −2.7 × 1,001 = −2,702.7 → −2,702(0 쪽으로 버림)', d.amt === -2702, String(d.amt))
}
/* 모든 조정액 · 단가가 정수(원) */
{
  const rows = [R({ kind: 'new', q1: '3.33', upNow: '7,777' }), R({ kind: 'inc', q0: '1.1', q1: '2.2', upCtr: '9,999.9', upEst: '' }), R({ kind: 'inc', q0: '1', q1: '4', upNow: '12,345', by: 'owner' })]
  const out = rows.map((r) => calcRow(r, 0.87654))
  봄('단가 · 조정액이 모두 원 단위(정수)', out.every((o) => Number.isInteger(o.unit) && Number.isInteger(o.amt)), JSON.stringify(out.map((o) => [o.unit, o.amt])))
  봄('합계 = 줄 합', 합(rows, 0.87654) === out.reduce((s, o) => s + o.amt, 0))
}
/* 🧮 G371 엑셀에서 붙여넣기 — 다른 예시 세 벌(가상 품명) · 구분은 수량으로 저절로 */
{
  // ① 엑셀 머리줄 + 증가 · 감소 · 신규 · 쉼표 금액
  const 글 = '품명\t단위\t당초\t변경\t계약단가\t예정가격단가\t당시단가\n가상 L형측구\tm\t120\t150\t45,000\t47,500\n가상 보도블록 철거\t㎡\t80\t60\t23,456\n가상 배수판\t㎡\t\t12.5\t\t\t15,000'
  const { rows, 뺀 } = 붙여읽기(글)
  봄('붙여넣기 ① 머리줄 건너뜀 · 3줄 · 증가 · 감소 · 신규', rows.length === 3 && rows.map((r) => r.kind).join() === 'inc,dec,new' && !뺀.length, JSON.stringify(rows.map((r) => r.kind)))
  const out = rows.map((r) => calcRow(r, 0.87))
  봄('붙여넣기 ① 셈 = 손셈 1,350,000 · −469,120 · 163,125', out.map((o) => o.amt).join() === '1350000,-469120,163125', JSON.stringify(out.map((o) => o.amt)))
  // ② 발주기관 요구(O) · 증감 없는 줄은 뺌 · 빈 줄 · 윈도 줄끝
  const 글2 = '가상 흄관 D600\t본\t50\t80\t\t\t200,000\tO\r\n가상 변동없음\tm\t10\t10\t5,000\r\n\r\n가상 옹벽\tm\t\t300\t\t\t250,000\t'
  const r2 = 붙여읽기(글2)
  봄('붙여넣기 ② 발주기관 요구(O) · 증감 없는 줄 뺌 · 빈 줄 · \\r\\n', r2.rows.length === 2 && r2.rows[0].by === 'owner' && r2.rows[0].kind === 'inc' && r2.rows[1].kind === 'new' && r2.뺀.join() === '가상 변동없음', JSON.stringify(r2))
  const o2 = r2.rows.map((r) => calcRow(r, 0.845))
  봄('붙여넣기 ② 셈 = 손셈 184,500 × 30 · 211,250 × 300', o2.map((o) => o.amt).join() === '5535000,63375000', JSON.stringify(o2.map((o) => o.amt)))
  // ③ 수량에 쉼표 · 소수 감소 · 변경 수량 없는 줄 뺌
  const r3 = 붙여읽기('가상 잔디\t㎡\t10\t2.5\t99,999\n가상 표토\t㎥\t1,200\t1,350.5\t8,800\t9,100\n가상 수량없음\tm\t5\t\t1,000')
  봄('붙여넣기 ③ 쉼표 수량 1,350.5 · 소수 감소 · 수량 없는 줄 뺌', r3.rows.length === 2 && r3.rows[0].kind === 'dec' && r3.rows[1].q0 === '1200' && r3.rows[1].q1 === '1350.5' && r3.뺀.join() === '가상 수량없음', JSON.stringify(r3))
  const o3 = r3.rows.map((r) => calcRow(r, 0.912345678))
  봄('붙여넣기 ③ 셈 = 손셈 −749,992 · 150.5 × 8,800 = 1,324,400', o3.map((o) => o.amt).join() === '-749992,1324400', JSON.stringify(o3.map((o) => o.amt)))
}
console.log(`\n${셈}개 중 틀림 ${틀림}`)
process.exit(틀림 ? 1 : 0)
