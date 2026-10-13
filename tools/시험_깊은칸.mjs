/**
 * 🧭 G273 깊은 칸(지하수조 · 저수조 …) — lib/골조자동.js 깊은칸찾기 시험
 *   node tools/시험_깊은칸.mjs
 * tools/깊은칸_시험도면.py 로 그린 «가상» 도면: 가로 · 세로 단면(안 폭 4,000 · 10,000 · 바닥 −7,350 · 벽 300 · 바닥판 600) + 평면(안 4,000 × 10,000 · 장비 상자) + 크기 다른 방
 */
import fs from 'fs'
import { 도면읽기, 단위배율 } from '../web/src/lib/골조도면.js'
import { decodeBytes } from '../web/src/lib/dxf3d.js'
import { _준비, _깊은칸찾기 } from '../web/src/lib/골조자동.js'

let bad = 0
const ok = (이름, c, got) => { if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (got !== undefined && !c ? ' = ' + JSON.stringify(got) : '')) }
const b = fs.readFileSync(new URL('./시험자료/깊은칸_시험.dxf', import.meta.url))
const M = 도면읽기(decodeBytes(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)))
const D = { ..._준비(M, 단위배율(M.units, M.box, M.ox, M.oy).k || 1, 0), 이름: '깊은칸_시험.dxf' }
console.log('① 단면 + 평면 → 안 크기 · 바닥 · 벽 · 바닥판')
const r = _깊은칸찾기([D], -3400)
ok('하나만(크기 다른 방 6,000 × 8,000 은 단면 폭과 안 맞아 뺌)', r.length === 1, r)
const k = r[0] || {}
ok('안 4,000 × 10,000 (평면 안 장비 상자는 벽 층이 아니라 안 맞음)', k.a === 4000 && k.b === 10000, [k.a, k.b])
ok('바닥 −7,350 (바닥 선 바로 밑 레벨 글)', k.F === -7350, k.F)
ok('벽 300 · 바닥판 600', k.벽 === 300 && k.바닥 === 600, [k.벽, k.바닥])
ok('두 변 다 단면 폭과 맞음', k.둘다 === true)
console.log('② 맨 아래 층보다 얕으면 안 셈')
ok('최저 −7,000 이면 −7,350 은 500 mm 안 깊어 없음', _깊은칸찾기([D], -7000).length === 0)
console.log(bad ? `\n✗ ${bad}건 틀림` : '\n✓ 모두 맞음')
process.exit(bad ? 1 : 0)
