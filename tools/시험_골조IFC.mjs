/**
 * 🧊 G467 골조 모델 → IFC4 (lib/골조IFC.js) — 가상 예시 모델만(실제 현장 아님)
 *   node tools/시험_골조IFC.mjs
 *   ① 부재 · 층 · 모양 · 물량 · 속성 ② 공정(과제 · 날짜 · 부재 묶음 · 앞뒤) ③ 받기 전 IFC 검사 — 고친 글자는 잡아냄 ④ 같은 모델 = 같은 글자(GlobalId)
 */
import { 작업예시모델, 예시모델, 모델셈, 층높이 } from '../web/src/lib/골조모델.js'
import { 공정고치기, 공정셈, 공정기성, 예시공정 } from '../web/src/lib/골조공정.js'
import { 골조IFC, 골조IFC검사 } from '../web/src/lib/골조IFC.js'
import { 글자 } from '../web/src/lib/IFC쓰기.js'

let bad = 0
const ok = (이름, c, got) => { if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (got !== undefined && !c ? ' = ' + JSON.stringify(got).slice(0, 600) : '')) }
const 때 = new Date('2027-01-01T00:00:00Z')
const 한 = (t) => 글자(t)
const 세 = (글, re) => 글.split('\n').filter((l) => re.test(l)).length

console.log('① 작업 화면 예시 — 공정 없음')
let M = 작업예시모델()
let S = 모델셈(M)
let r = 골조IFC(M, S, { 때 })
let 검 = 골조IFC검사(r.글, r.셈, M, S)
ok('검사 통과', 검.통과, 검.줄.filter((x) => !x.됨))
ok('부재 수 = 3D 덩어리 수(86)', r.셈.부재 === S.덩어리.length && S.덩어리.length === 86, [r.셈.부재, S.덩어리.length])
ok('종류마다 IFC 꼴(기둥 · 보 · 벽 · 슬라브 · 기초 · 계단)', 세(r.글, /=IFCCOLUMN\(/) === r.셈.종류별.기둥 && 세(r.글, /=IFCBEAM\(/) === r.셈.종류별.보 && 세(r.글, /=IFCSLAB\(/) === r.셈.종류별.슬라브 && 세(r.글, /=IFCFOOTING\(/) === r.셈.종류별.기초 && 세(r.글, /=IFCWALL\(/) === r.셈.종류별.벽 && 세(r.글, /=IFCSTAIR\(/) === 1, r.셈.종류별)
ok('계단은 세모 면(IfcTriangulatedFaceSet) · 나머지는 밀어 올린 덩어리', 세(r.글, /=IFCTRIANGULATEDFACESET\(/) === 1 && 세(r.글, /=IFCEXTRUDEDAREASOLID\(/) === 85)
const H = 층높이(M)
ok('층 셋 · 바닥 높이(mm) = 층높이', 세(r.글, /=IFCBUILDINGSTOREY\(/) === 3 && r.글.includes(한('1층') + ",$,$,") && M.층.every((f) => r.글.includes(',.ELEMENT.,' + (H.표.get(f.이름).z0 % 1 ? H.표.get(f.이름).z0 : H.표.get(f.이름).z0 + '.') + ')')))
ok('한글은 \\X2\\ 로(ASCII 만)', !/[^\x09\x0a\x0d\x20-\x7e]/.test(r.글) && r.글.includes(한('콘크리트')))
ok('물량 — 산출서 콘크리트 · 거푸집 · 철근 · 3D 부피(부재마다)', 세(r.글, /IFCQUANTITYVOLUME\('GrossVolume'/) === 86 && 세(r.글, new RegExp('IFCQUANTITYAREA\\(' + 한('거푸집').replace(/[\\$()]/g, '\\$&'))) === 86)
ok('산출서 콘크리트 합(IFC 에 담긴 값) = 화면 합', Math.abs(r.셈.콘크리트 - S.합.콘크리트) < 0.01, [r.셈.콘크리트, S.합.콘크리트])
ok('속성 «Pset_Kconmap» — 부재마다 부호 · 층 · 자리 · 칸 · 레미콘 규격', 세(r.글, /'Pset_Kconmap'/) === 86 && r.글.includes(한('칸')) && r.글.includes(한('레미콘 규격')))
ok('공정 없으면 과제 없음', 세(r.글, /=IFCTASK\(/) === 0 && r.셈.과제 === 0)
const 제수 = S.덩어리.filter((d) => d.제안).length
ok('🟨 확인 전 제안(예시 3) — 노란 색 · 속성 «확인 전 제안» · 까닭 · 검사 줄', 제수 === 3 && r.셈.제안 === 3 && r.글.includes("IFCSURFACESTYLE('\\X2\\C81CC548\\X0\\',") && r.글.split(글자('확인 전 제안(건설맵이 먼저 세운 것)')).length - 1 === 3 && r.글.split(글자('제안 까닭')).length - 1 === 3 && 검.줄.some((x) => x.됨 && /확인 전 제안 3개 = 화면 노란 덩어리 3개/.test(x.글)), [제수, r.셈.제안])
const 노란 = r.글.match(/#(\d+)=IFCSURFACESTYLE\('\\X2\\C81CC548\\X0\\'/)
ok('제안 덩어리 3개만 노란 색(IfcStyledItem)', 노란 && r.글.split('\n').filter((l) => /=IFCSTYLEDITEM\(/.test(l) && l.includes(',(#' + 노란[1] + '),$)')).length === 3)
ok('재료(레미콘 규격) 묶음', 세(r.글, /=IFCMATERIAL\(/) >= 1 && 세(r.글, /=IFCRELASSOCIATESMATERIAL\(/) >= 1)
const r2 = 골조IFC(M, S, { 때 })
ok('같은 모델 · 같은 때 → 같은 글자(GlobalId 늘 같음)', r2.글 === r.글)

console.log('② 공정 · 기성')
M = 공정고치기(작업예시모델(), 예시공정())
S = 모델셈(M)
const R = 공정셈(M, S)
M = 공정기성(M, R, '2027-03-30').M
r = 골조IFC(M, S, { 때 })
검 = 골조IFC검사(r.글, r.셈, M, S)
ok('검사 통과(공정 과제 6 = 칸 6)', 검.통과 && 검.줄.some((x) => /공정 과제 6개 = 칸 6곳/.test(x.글)), 검.줄)
ok('IfcWorkSchedule 하나 · 시작 · 끝 = 공기', 세(r.글, /=IFCWORKSCHEDULE\(/) === 1 && r.글.includes("'2027-03-22T08:00:00','2027-04-10T17:00:00',.PLANNED.)"))
ok('과제마다 작업일 · 시작 · 끝(IfcTaskTime)', R.줄.every((c) => r.글.includes(".WORKTIME.,'P" + c.일수 + "D','" + c.시작 + "T08:00:00','" + c.끝 + "T17:00:00'")))
ok('과제 ↔ 부재 묶음 6 · 묶인 부재 = 86', 세(r.글, /=IFCRELASSIGNSTOPROCESS\(/) === 6 && r.글.split('\n').filter((l) => /=IFCRELASSIGNSTOPROCESS\(/.test(l)).reduce((a, l) => a + l.match(/\(([#\d,]+)\),\$,#/)[1].split(',').length, 0) === 86)
ok('같은 팀 앞뒤 과제(끝-시작) 4 — 팀 둘 × 층 셋', 세(r.글, /=IFCRELSEQUENCE\(.*\.FINISH_START\./) === 4)
ok('속성에 공정 시작 · 끝 · 작업일 · 기성 회차(FT = 1회)', r.글.includes(한('공정 시작')) && r.글.includes(한('기성 회차')) && r.글.includes('IFCLABEL(' + 한('1회') + ')'))
ok('일정은 프로젝트에 선언(IfcRelDeclares) · 과제는 일정이 다스림(IfcRelAssignsToControl)', 세(r.글, /=IFCRELDECLARES\(/) === 1 && 세(r.글, /=IFCRELASSIGNSTOCONTROL\(/) === 1)

console.log('③ 받기 전 IFC 검사 — 고친 글자를 잡아냄')
const 줄들 = r.글.split('\n')
const i기둥 = 줄들.findIndex((l) => /=IFCCOLUMN\(/.test(l))
const 빠진 = 줄들.filter((_, i) => i !== i기둥).join('\n')
let 검2 = 골조IFC검사(빠진, r.셈, M, S)
ok('부재 한 줄을 빼면 못 통과(부재 수 · 담김 · 없는 번호)', !검2.통과 && 검2.줄.some((x) => !x.됨 && /부재/.test(x.글)), 검2.줄.filter((x) => !x.됨))
const 깊이 = r.글.replace(/(=IFCEXTRUDEDAREASOLID\(#\d+,#\d+,#\d+,)(\d+(?:\.\d*)?)\)/, (m, a, d) => a + (+d + 1000) + '.)')
검2 = 골조IFC검사(깊이, r.셈, M, S)
ok('덩어리 높이를 1 m 늘리면 못 통과(다시 잰 부피 ≠ 3D)', !검2.통과 && 검2.줄.some((x) => !x.됨 && /다시 읽어 잰 부피/.test(x.글)), 검2.줄.filter((x) => !x.됨))
검2 = 골조IFC검사(r.글.replace('END-ISO-10303-21;', ''), r.셈, M, S)
ok('끝맺음이 없으면 못 통과', !검2.통과)
검2 = 골조IFC검사(r.글.replace("IFCLABEL('C1')", "IFCLABEL('기둥')"), r.셈, M, S)
ok('ASCII 밖 글자가 섞이면 못 통과', !검2.통과)

console.log('④ 보통 화면 예시(구간 없음)')
M = 예시모델()
S = 모델셈(M)
r = 골조IFC(M, S, { 때 })
검 = 골조IFC검사(r.글, r.셈, M, S)
ok('검사 통과 · 부재 = 덩어리', 검.통과 && r.셈.부재 === S.덩어리.length, 검.줄)
ok('칸 = 층 이름(구간 없음)', r.글.includes('IFCLABEL(' + 한('1층') + ')'))

console.log(bad ? `\n✗ ${bad}개 틀림` : '\n✓ 모두 맞음')
process.exit(bad ? 1 : 0)
