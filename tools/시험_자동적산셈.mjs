/**
 * ⚡ G363 도면 물량 자동 — «다른 예시 세 벌» 셈 시험 (화면 없이 · 올리기 bat 에서도 돎)
 *   node tools/시험_자동적산셈.mjs
 * 도면: tools/자동적산_시험도면.py 가 그린 가상 도면 A(횡단 + 평면) · B(건축) · C(조경)
 * 답: 자동적산_답.json (손셈) = 자동적산_답셈.py 가 도면을 다시 읽어 따로 잰 값 · 화면 시험은 시험_자동적산.mjs
 * 이번에 고친 것: 볼록 호 닫힌 선 참 면적 · 묶음 블록 안의 블록 · MINSERT · 철근 재료표 길이(mm)·총길이(m) 섞임 검산
 */
import fs from 'fs'
import { fileURLToPath } from 'url'
import { 도면읽기, 단위배율 } from '../web/src/lib/골조도면.js'
import { decodeBytes } from '../web/src/lib/dxf3d.js'
import * as 자 from '../web/src/lib/도면자동.js'
import * as 전 from '../web/src/lib/도면전부.js'

const D = fileURLToPath(new URL('./시험자료/', import.meta.url))
const 답 = JSON.parse(fs.readFileSync(D + '자동적산_답.json', 'utf8'))
let bad = 0, n = 0
const ok = (이름, c, got) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (got !== undefined && !c ? ' = ' + JSON.stringify(got) : '')) }
const 같다 = (a, b, e = 1e-6) => Number.isFinite(a) && Math.abs(a - b) <= e * Math.max(1, Math.abs(b))
function 읽기(이름) {
  const buf = fs.readFileSync(D + 이름)
  const M = 도면읽기(decodeBytes(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)))
  const 단위 = 단위배율(M.units, M.box, M.ox, M.oy)
  const 표들 = 자.표찾기(M)
  const 끈층 = new Set(M.layers.map((L, i) => (L.hide ? i : -1)).filter((i) => i >= 0))
  return { M, 표들, k: 단위.k || 1, 끈층 }
}
const 항목찾기 = (R, 구, re) => R.항목.filter((x) => x.구분.startsWith(구) && re.test(x.품명))

console.log('A 토목 — 횡단면도 (표 · 토공)')
{
  const { M, 표들 } = 읽기('자동적산_A_횡단.dxf')
  const R = 자.철근모으기(표들)
  for (const [d, v] of Object.entries(답.A.철근)) { const a = R.합.find((x) => x.d === d); ok(`철근 ${d} ${v.kg} kg`, a && 같다(a.kg, v.kg), a && a.kg) }
  ok('철근 재료표 «길이(mm) · 총길이(m)» 섞여도 검산 잘못 알림 0', R.검산.length === 0, R.검산.slice(0, 2))
  const Q = 자.수량모으기(표들).합
  for (const [k, v] of Object.entries(답.A.수량)) { const [p, u] = k.split('|'); const a = Q.find((x) => x.품명 === p && x.단위 === u); ok(`수량표 ${p} ${v} ${u}`, a && 같다(a.수량, v), a && a.수량) }
  const 노선 = 자.노선묶기(자.측점찾기(M))
  ok('노선 1개 · 측점 6개 (0+052.500 포함)', 노선.length === 1 && 노선[0].점.length === 6, 노선.map((g) => g.점.length))
  const g = 노선[0], s = 자.본측점고르기(g)
  const 본 = 자.본만들기(M, s, 자.본네모짐작(M, s, g.점.filter((q) => Math.abs(q.x - s.x) < 3 * s.h)), g.점)
  const r = 자.평균단면(자.본읽기(M, 본, g.점), 본.칸)
  for (const [이름, v] of Object.entries(답.A.토공)) { const j = 본.칸.findIndex((c) => c.이름 === 이름); ok(`토공 ${이름} ${v}`, j >= 0 && 본.칸[j].쓰기 && 같다(r.합[j], v), j >= 0 ? r.합[j] : 본.칸.map((c) => c.이름)) }
  ok('지반고 · 계획고 칸은 물량에 안 씀', 본.칸.filter((c) => /지반고|계획고/.test(c.이름)).every((c) => !c.쓰기))
}
console.log('A 토목 — 평면도 (레이어 · 블록)')
{
  const { M, 표들, k, 끈층 } = 읽기('자동적산_A_평면.dxf')
  const R = 전.모두(M, { k, 끈층, 표들 })
  const 층 = (n) => R.항목.find((x) => x.근거.includes('«' + n + '»'))
  for (const [n, v] of Object.entries(답.A.길이)) ok(`길이 ${n} ${v.toFixed(6)} m (호 · 볼록 · 위치도 뺌)`, 층(n) && 층(n).켬 && 같다(층(n).수량, v), 층(n) && 층(n).수량)
  for (const [n, v] of Object.entries(답.A.면적)) ok(`면적 ${n} ${v} m²`, 층(n) && 층(n).켬 && 같다(층(n).수량, v), 층(n) && 층(n).수량)
  ok('현황(기존-우수관) 은 처음엔 꺼 둠', 층('기존-우수관') && !층('기존-우수관').켬)
  for (const [n, v] of Object.entries(답.A.블록)) { const x = R.항목.find((q) => q.key === '블록:' + n); ok(`블록 ${n} ${v}`, x && x.켬 && x.수량 === v, x && x.수량) }
}
console.log('B 건축 — 실 · 마감 · 창호')
{
  const { M, 표들, k, 끈층 } = 읽기('자동적산_B.dxf')
  const R = 전.모두(M, { k, 끈층, 표들 })
  for (const [n, v] of Object.entries(답.B.실)) { const r = R.실.find((q) => q.이름 === n); ok(`실 ${n} ${v.면적} m² · 둘레 ${v.둘레} m`, r && 같다(r.면적, v.면적) && 같다(r.둘레, v.둘레), r && [r.면적, r.둘레]) }
  for (const [kk, v] of Object.entries(답.B.마감)) { const [p, u] = kk.split('|'); const x = R.항목.find((q) => q.품명 === p && q.단위 === u); ok(`마감 ${p} ${v} ${u}`, x && 같다(x.수량, v), x && x.수량) }
  for (const [c, [표, 도]] of Object.entries(답.B.창호)) { const w = R.창호.find((q) => q.기호 === c); ok(`창호 ${c} 일람표 ${표} · 평면 ${도}${표 !== 도 ? ' → 다름' : ''}`, w && w.표수 === 표 && w.도면 === 도 && w.다름 === (표 !== 도), w) }
}
console.log('C 조경 — 원 · 반원 끝 · 묶음 블록 · 부품 · MINSERT · 범례 · 위치도')
{
  const { M, 표들, k, 끈층 } = 읽기('자동적산_C.dxf')
  const R = 전.모두(M, { k, 끈층, 표들 })
  const 층 = (n) => R.항목.find((x) => x.근거.includes('«' + n + '»'))
  for (const [n, v] of Object.entries(답.C.면적)) ok(`면적 ${n} ${v.toFixed(6)} m² (참 호 넓이)`, 층(n) && 같다(층(n).수량, v, 1e-9), 층(n) && 층(n).수량)
  for (const [n, v] of Object.entries(답.C.길이)) ok(`길이 ${n} ${v.toFixed(6)} m`, 층(n) && 같다(층(n).수량, v), 층(n) && 층(n).수량)
  for (const [n, v] of Object.entries(답.C.블록)) { const x = R.항목.find((q) => q.key === '블록:' + n); ok(`블록 ${n} ${v} (켬)`, x && x.켬 && x.수량 === v, x && [x.수량, x.켬]) }
  for (const n of 답.C.묶음끔) { const x = R.항목.find((q) => q.key === '블록:' + n); ok(`묶음 블록 ${n} 은 겹치지 않게 꺼 둠`, x && !x.켬 && /묶음 블록/.test(x.근거), x && x.근거) }
  ok('부품(보안등 안의 등기구) 은 따로 안 셈', !R.항목.some((q) => q.key === '블록:등기구'))
  ok('범례 블록 안의 수목은 안 셈(소나무 7 그대로)', R.항목.find((q) => q.key === '블록:소나무').수량 === 7)
  const 블 = 전.블록모음(자.세기(M, { 끈층, k }))
  ok('⑥ 화면이 쓰는 블록모음 = ① 과 같은 수 (이팝나무 11 · 볼라드 10)', 블.find((b) => b.이름 === '이팝나무').수 === 11 && 블.find((b) => b.이름 === '볼라드').수 === 10)
  const Q = 자.수량모으기(표들).합
  for (const [kk, v] of Object.entries(답.C.수량)) { const [p, u] = kk.split('|'); const a = Q.find((x) => x.품명 === p && x.단위 === u); ok(`수량표 ${p} ${v} ${u}`, a && 같다(a.수량, v), a && a.수량) }
}
console.log(bad ? `\n✗ ${bad} / ${n} 틀림` : `\n✓ 모두 맞음 (${n})`)
process.exit(bad ? 1 : 0)
