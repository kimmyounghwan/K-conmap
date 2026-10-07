/**
 * 🧪 lib/fresh.js — 빠른 길(«🆕 방금») 겹침 막기 · G193 (2026-10-07) · node tools/시험_빠른길.mjs
 *   소장님 폰 20:07 — 11:00 개찰이 첫 묶음(500)과 둘째 묶음에 걸쳐 나뉘자 둘째 묶음의 11:00 개찰이 «방금» 으로 17:30 위에 떴음.
 *   바닥시각(받아 둔 첫 묶음들의 가장 오래된 시각 · 뒤 묶음이 있을 때만) 과 freshRows(floor) 를 봅니다.
 */
import { 바닥시각, freshRows, 시각숫자 } from '../web/src/lib/fresh.js'
let 통과 = 0, 실패 = 0
const 봐 = (무엇, ok, 값) => { if (ok) { 통과++; console.log('  ✓', 무엇) } else { 실패++; console.log('  ✗', 무엇, 값 === undefined ? '' : JSON.stringify(값).slice(0, 300)) } }
const 줄 = (no, dt) => ({ no, dt, _ix: ['공사 ' + no, '', '', [], ''] })
const 만들기 = (시각들) => { const rows = []; let n = 0; for (const [dt, c] of 시각들) for (let i = 0; i < c; i++) rows.push(줄(`B${String(++n).padStart(5, '0')}`, dt)); const ch = {}; for (let i = 0; i * 500 < rows.length; i++) ch[i] = rows.slice(i * 500, i * 500 + 500); return { ch, rows } }

console.log('■ 시각숫자 — fast.py C.dt_digits 와 같은 12자리')
봐('2026-10-07 11:00:00 → 202610071100', 시각숫자('2026-10-07 11:00:00') === '202610071100' && 시각숫자('') === '' && 시각숫자(null) === '')

console.log('■ 바닥시각')
const { ch, rows } = 만들기([['2026-10-07 17:30:00', 100], ['2026-10-07 16:00:00', 100], ['2026-10-07 14:00:00', 94], ['2026-10-07 11:00:00', 300], ['2026-10-02 15:00:00', 300]])
const parts = Object.keys(ch).length
봐('첫 묶음만 받았고 뒤가 있음 → 첫 묶음 가장 오래된 시각(11:00)', 바닥시각({ 0: ch[0] }, parts) === '202610071100')
봐('묶음 둘 다 받음(끝까지) → 없음', 바닥시각({ 0: ch[0], 1: ch[1] }, parts) === '')
봐('0번이 없으면(아직 못 받음) → 없음', 바닥시각({ 1: ch[1] }, parts) === '')
봐('0 · 2번만(끊김) → 0번까지만 셈', 바닥시각({ 0: ch[0], 2: [] }, 3) === '202610071100')
봐('묶음 하나뿐인 목록 → 없음', 바닥시각({ 0: ch[0] }, 1) === '' && 바닥시각(null, 3) === '' && 바닥시각({ 0: ch[0] }, 0) === '')

console.log('■ freshRows — 그날의 모습')
const 오늘 = rows.filter((r) => r.dt.startsWith('2026-10-07'))
const 둘째의11시 = ch[1].filter((r) => r.dt.startsWith('2026-10-07 11'))
const 새것 = [줄('N0001', '2026-10-07 18:30:00'), 줄('N0002', '2026-10-07 11:00:00')]
const fresh = { rows: [...새것, ...둘째의11시] }
const have = new Set(ch[0].map((r) => r.no))
봐('둘째 묶음으로 넘어간 11:00 줄 94건', 둘째의11시.length === 94)
const 옛 = freshRows(fresh, have, null)
봐('floor 없이(고치기 전) — 96건이 «방금» 으로 얹힘(그날의 오류 재현)', 옛.length === 96, 옛.length)
const 새 = freshRows(fresh, have, null, 바닥시각({ 0: ch[0] }, parts))
봐('floor 로 — 18:30 진짜 새 줄 하나만(경계 11:00 줄은 뒤 묶음 몫)', 새.map((r) => r.no).join() === 'N0001', 새.map((r) => r.no))
const 끝까지 = freshRows(fresh, new Set([...ch[0], ...ch[1]].map((r) => r.no)), null, 바닥시각({ 0: ch[0], 1: ch[1] }, parts))
봐('묶음을 다 받았으면 floor 없음 · have 로 겹침 빠짐 · 경계 시각 진짜 새 줄은 남음', 끝까지.map((r) => r.no).join() === 'N0001,N0002', 끝까지.map((r) => r.no))
const 거름 = freshRows(fresh, have, (ix) => String(ix[0]).includes('N0002'), '')
봐('match(거르기)는 예전 그대로', 거름.map((r) => r.no).join() === 'N0002')
봐('fresh 가 없으면 빈 목록', freshRows(null, have, null, '202610071100').length === 0)
void 오늘
console.log(`\n${통과} 통과 · ${실패} 실패`)
if (실패) process.exit(1)
