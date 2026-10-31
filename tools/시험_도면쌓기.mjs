/**
 * 📚 G483 도면 쌓기 — lib/넣은도면.js(작업 화면 «📐 도면 넣기» 가 먼저 넣은 도면을 버리던 것)
 *   node tools/시험_도면쌓기.mjs
 * 합치기(같은 이름은 새 것 · 새 것은 뒤) · 빼기(줄기 — DWG 를 DXF 로 바꾼 이름도) · 줄기(토목작업 도면줄기와 같은 셈) · 브라우저 저장소가 없을 때(노드) 쌓기 = false · 쌓인것 = 이 탭 메모
 * 화면(작업 화면 · 실제 도면 두 번 넣기 · ✕ · 새로고침)은 /tmp/g10/g483/stack.mjs
 */
import { 합치기, 빼기, 줄기, 쌓기, 쌓인것, 비우기, 크기, _메모잊기 } from '../web/src/lib/넣은도면.js'
import { 도면줄기 } from '../web/src/lib/토목작업.js'

let bad = 0
const ok = (이름, c, got) => { if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (got !== undefined && !c ? ' = ' + JSON.stringify(got) : '')) }
const 파 = (이름, n = 4) => ({ 이름, buf: new Uint8Array(n).fill(이름.length).buffer })
const 이름들 = (l) => l.map((f) => f.이름)

console.log('① 합치기 — 앞 + 새 · 같은 이름은 새 것(대소문자 무시) · 새 것은 뒤')
{
  const 앞 = [파('A 평면도.dwg'), 파('B 단면도.dxf'), 파('측량.csv')]
  const 새 = [파('b 단면도.DXF', 9), 파('C 배근도.dwg')]
  const r = 합치기(앞, 새)
  ok('A · 측량 · b(새) · C', JSON.stringify(이름들(r)) === JSON.stringify(['A 평면도.dwg', '측량.csv', 'b 단면도.DXF', 'C 배근도.dwg']), 이름들(r))
  ok('바뀐 B 는 새 몸(9바이트)', r[2].buf.byteLength === 9, r[2].buf.byteLength)
  ok('앞이 비면 새 것 그대로', JSON.stringify(이름들(합치기([], 새))) === JSON.stringify(이름들(새)))
  ok('새 것이 비면 앞 그대로', JSON.stringify(이름들(합치기(앞, []))) === JSON.stringify(이름들(앞)))
}
console.log('② 빼기 — 도면함 한 줄(줄기)로 원본 빼기')
{
  const l = [파('01. 표지.dwg'), 파('03. 계획평면도.dwg'), 파('03. 계획평면도 · 배수로'), 파('측량.xlsx')]
  ok('DWG 를 DXF 로 바꾼 이름(«03. 계획평면도.dxf») 으로 빼도 DWG 원본이 빠짐', JSON.stringify(이름들(빼기(l, '03. 계획평면도.dxf'))) === JSON.stringify(['01. 표지.dwg', '측량.xlsx']), 이름들(빼기(l, '03. 계획평면도.dxf')))
  ok('여러 줄기 한꺼번에', 빼기(l, ['01. 표지', '03. 계획평면도']).length === 1)
  ok('없는 줄기는 그대로', 빼기(l, '없는 도면').length === 4)
}
console.log('③ 줄기 — 토목작업.js 도면줄기와 같은 셈(두 벌이 같은지)')
for (const n of ['A.dwg', 'A.DXF', 'A · 노선1', ' 가 나.dxf ', '측량.csv', '']) ok(`«${n}»`, 줄기(n) === 도면줄기(n), [줄기(n), 도면줄기(n)])
console.log('④ 브라우저 저장소가 없을 때(노드 · 사생활 창) — 오류 없이 이 탭에만')
{
  _메모잊기()
  ok('처음엔 빈 도면함', (await 쌓인것()).length === 0)
  const l = [파('A.dwg'), 파('B.dxf')]
  const 됨 = await 쌓기(l, ['A.dwg', 'B.dxf'])
  ok('쌓기 = false(저장 못 함 → 알림에 «이 탭에만»)', 됨 === false, 됨)
  ok('이 탭 메모에는 남음(다음 넣기에 합쳐짐)', JSON.stringify(이름들(await 쌓인것())) === JSON.stringify(['A.dwg', 'B.dxf']))
  ok('크기 = 8바이트', 크기(l) === 8, 크기(l))
  await 비우기()
  ok('비우기 → 빈 도면함', (await 쌓인것()).length === 0)
}
console.log(bad ? `✗ ${bad} 틀림` : '✓ 모두 맞음')
process.exit(bad ? 1 : 0)
