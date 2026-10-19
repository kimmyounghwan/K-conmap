/* 🧪 G335 (2026-10-20) 수량산출서 만들기(/jeoksan/run) — 견본 재료표마다 «견본 12줄» 이 ✕ 없이 셈해지는지
 *   건축 견본을 고르고 «견본 12줄 불러오기» 를 누르면 토목 줄(땅깎기 …)이 들어와 ✕ 12가지 · 산출서 0줄이던 것
 *   → 치수표_견본_건축.csv (기둥 사각 · 원형 · 옹벽 · 슬래브 · 보 · 개구부 공제 · 층 B1 · 1F · 2F)
 *   node tools/시험_견본치수.mjs */
import fs from 'fs'
import { run } from '../web/src/lib/qto.js'
let bad = 0
const ok = (이름, c, got) => { if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (got !== undefined && !c ? ' = ' + JSON.stringify(got) : '')) }
const 길 = (f) => new URL('../web/public/jeoksan/' + f, import.meta.url)
for (const [재, 치, n] of [['재료표_토목.xlsx', '치수표_견본.csv', 30], ['재료표_건축.xlsx', '치수표_견본_건축.csv', 43]]) {
  const r = run(new Uint8Array(fs.readFileSync(길(재))), 재, fs.readFileSync(길(치), 'utf-8'), 치)
  ok(`${재} + ${치} → ${n}줄 · ✕ 없음 · 셈 오류 없음`, r.rows.length === n && !r.serious && r.rows.every((x) => !x.err), [r.rows.length, r.serious])
}
{
  const r = run(new Uint8Array(fs.readFileSync(길('재료표_건축.xlsx'))), 'a', fs.readFileSync(길('치수표_견본_건축.csv'), 'utf-8'), 'b')
  const 첫 = r.rows[0]
  ok('기둥 C1 B1 콘크리트 = 0.6 × 0.6 × (3.6 − 0.2) × 12 = 14.688', Math.abs(첫.val - 14.688) < 1e-9 && 첫.u.부호 === 'C1', [첫.val, 첫.expr])
  const 개 = r.rows.find((x) => x.u.부재 === '개구부' && x.rule.재료 === '콘크리트')
  ok('개구부 OP1 은 빼기(−1.2 × 1.5 × 0.2 × 2 = −0.72)', 개 && Math.abs(개.val + 0.72) < 1e-9, 개 && 개.val)
  const 토 = run(new Uint8Array(fs.readFileSync(길('재료표_건축.xlsx'))), 'a', fs.readFileSync(길('치수표_견본.csv'), 'utf-8'), 'b')
  ok('(전 버릇) 건축 재료표 + 토목 견본 줄 → ✕ (그래서 견본 줄을 재료표에 맞춤)', 토.serious > 0)
}
console.log(bad ? `✗ ${bad}건 틀림` : '✓ 모두 맞음')
process.exit(bad ? 1 : 0)
