/**
 * ⚡ 마감 «도면 넣으면 자동» — lib/도면전부.js 마감자동 시험 (2026-09-28)
 *   node tools/시험_마감자동.mjs
 * 가상 평면도(web/public/jeoksan/마감_예시.dxf)만 넣고 누르지 않아도, 사람이 도면을 보고 적은 예시(lib/마감.js 예시공사)와
 * 재료별 수량이 한 자리도 안 다른지 봅니다.
 */
import fs from 'fs'
import { 도면읽기 } from '../web/src/lib/골조도면.js'
import { decodeBytes } from '../web/src/lib/dxf3d.js'
import { 표찾기 } from '../web/src/lib/도면자동.js'
import { 마감자동 } from '../web/src/lib/도면전부.js'
import { 예시공사, 새공사, 셈 } from '../web/src/lib/마감.js'

let bad = 0
const ok = (이름, c, got) => { if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (got !== undefined && !c ? ' = ' + JSON.stringify(got) : '')) }
const b = fs.readFileSync(new URL('../web/public/jeoksan/마감_예시.dxf', import.meta.url))
const M = 도면읽기(decodeBytes(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)))
const 표들 = 표찾기(M)

console.log('① 빈 공사에서 — 도면만')
{
  const R = 마감자동(M, { k: 1, 표들, 이름: '마감_예시.dxf', 옛: 새공사() })
  const 실 = R.공사.실
  ok('방 3개 · 마감표 3줄 모두 맞춤 · 창호표 4', R.말.실 === 3 && R.말.맞춘 === 3 && R.말.창호표 === 4, R.말)
  const 사 = 실.find((r) => r.실명 === '사무실')
  ok('사무실 = 48㎡ · 둘레 28m · 창호 AW1*2 WD1 · F1·B1·W1·C1 · 천장고 2.7', 사 && 사.면적 === '48' && 사.둘레 === '28' && 사.창호 === 'AW1*2 WD1' && 사.바닥 === 'F1' && 사.걸레받이 === 'B1' && 사.벽 === 'W1' && 사.천장 === 'C1' && String(사.천장고) === '2.7', 사)
  ok('🔗 줄마다 찍은 자리(그 방의 닫힌 선)', 실.every((r) => r._찍음 && r._찍음.면적 && r._찍음.면적[0].e >= 0 && r._도면 === '마감_예시.dxf'))
  ok('모르는 기호는 마감표에 이름만 더함(재료는 고쳐 씀) — 7', R.말.새마감 === 7 && R.공사.마감.some((m) => m.기호 === 'F1' && /바닥 마감 F1/.test(m.재료[0].재료)), R.말)
  ok('셈 경고 없음', 셈(R.공사).경고.length === 0, 셈(R.공사).경고.map((w) => w.글))
}

console.log('② 적어 둔 마감표(기호별 재료)가 있으면 — 그대로 쓰고 도면으로 실만')
{
  const 옛 = 예시공사()
  const R = 마감자동(M, { k: 1, 표들, 이름: '마감_예시.dxf', 옛 })
  ok('새 마감 기호 0 (적어 둔 것 그대로)', R.말.새마감 === 0 && R.공사.마감.length === 옛.마감.length)
  const 합 = (S) => new Map(S.집계.합.map((a) => [a.재료 + '|' + a.규격 + '|' + a.단위, a.수량]))
  const e = 합(셈(옛)), a = 합(셈(R.공사))
  let 다름 = 0
  for (const [k, v] of e) if (!(Math.abs((a.get(k) ?? NaN) - v) <= 1e-6)) { 다름++; console.log('     다름', k, v, a.get(k)) }
  ok('재료별 수량이 손으로 적은 예시와 한 자리도 안 다름 (' + e.size + '가지)', 다름 === 0 && e.size === a.size)
}

console.log('③ 방이 없는 도면')
{
  const 빈 = { T: { s: [], x: [], y: [], h: [], a: [], e: [] }, E: { t: [], ly: [], len: [], area: [], val: [], ins: [] }, Q: { e: [], p0: [], pn: [] }, P: [], layers: [], box: [0, 0, 1, 1] }
  let R = null
  try { R = 마감자동(빈, { k: 1, 표들: [], 옛: 새공사() }) } catch (e) { R = { 오류: e.message } }
  ok('공사 null (방 못 찾음)', R && R.공사 === null, R)
}
console.log(bad ? `\n✗ ${bad}건 틀림` : '\n✓ 모두 맞음')
process.exit(bad ? 1 : 0)
