// 🧱 G686 «캐드 → 골조 모델 부재» 실제 캐드 시험 — 견주기(②)
//   node tools/시험_캐드부재실제캐드.mjs <캐드가 쓴 csv 폴더> <kcmb_map.json>
//   소장님 PC 오토캐드(accoreconsole)가 KCMS 로 쓴 csv(레이어마다 · 적요 «1층 기둥 C1» …)를 건설맵 lib 로
//   적요풀기 → 줄만들기 → 부재넣기 → 부재로세우기 → 모델셈 하고, 같은 도형을 건설맵이 직접 쓴 KCMS 글(map 의 «이상»)과 같은지 봄.
//   가상 모델 층고 · 슬라브 · 일람(G1 · F1)은 이 시험 안의 가상 값(실제 현장 아님 · 짐작 기본값 아님).
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const 뿌리 = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const 불러 = (f) => import(pathToFileURL(path.join(뿌리, 'web', 'src', 'lib', f)).href)
const L = await 불러('캐드고름.js'), D = await 불러('캐드부재.js'), G = await 불러('골조모델.js')
const [폴더, 지도] = process.argv.slice(2)
if (!폴더 || !지도) { console.log('쓰는 법: node tools/시험_캐드부재실제캐드.mjs <csv 폴더> <kcmb_map.json>'); process.exit(2) }
const map = JSON.parse(fs.readFileSync(지도, 'utf8'))
let 됨 = 0
const 틀 = []
const 봄 = (c, 글, 값) => { if (c) { 됨++; console.log('  ✓ ' + 글) } else { 틀.push(글); console.log('  ✗ ' + 글 + (값 !== undefined ? ' = ' + JSON.stringify(값).slice(0, 600) : '')) } }
const 모델 = () => {
  const M = G.새모델()
  M.층 = [{ 이름: 'FT', 층고: 0, 슬라브: 0, 내림: 0 }, { 이름: '1', 층고: 3600, 슬라브: 150 }, { 이름: '2', 층고: 3300, 슬라브: 150 }]
  M.배근 = { 기둥: [], 보: [{ 기호: 'G1', 폭: '400', 춤: '700' }], 슬라브: [], 벽: [], 기초: [{ 기호: 'F1', 종류: '독립', 가로: '2000', 세로: '2000', 두께: '600' }], 계단: [], 보강근: [] }
  return M
}
/* 받기 = Model.jsx 고름받기와 같은 차례 */
function 흐름(글들) {
  const M = 모델()
  let C = { 묶음: [], 줄: [] }
  const 채움 = []
  for (const 글 of 글들) {
    const 읽 = L.고름읽기(글)
    const 풀 = L.적요풀기(읽.머리.적요, M.층)
    const 끝 = C.묶음[C.묶음.length - 1]
    const 층 = 풀.층 || (풀.층적음 ? '' : 끝 ? (C.줄.find((r) => r.묶음 === 끝.id && r.층) || {}).층 || '' : '')
    const r = L.줄만들기(읽, { 이름: 'kcmb', 층, 있는핸들: L.있는핸들(C) })
    if (풀.부재) r.줄 = L.부재넣기(r.줄, () => true, 풀.부재, 풀, M.층).줄
    채움.push({ 적요: 읽.머리.적요, 단위: 읽.머리.단위, 줄: r.줄.length, 부재: r.줄.map((z) => (z.부재 || '-') + '/' + (z.부호 || '-') + '/' + (z.층 || '-')).sort().join(' '), 알림: r.알림 })
    C = L.묶음더하기(C, r).캐드
  }
  const 결 = D.부재로세우기(C, M)
  const S = G.모델셈(결.M)
  const 세운 = D.세운줄(결.M)
  const 셈 = L.캐드셈(C, { 세운 })
  return { 채움, 결, S, 셈, 대조: L.캐드대조줄(셈), C }
}
/* 캐드가 쓴 csv — 적요로 묶음 짝 */
const 파일 = fs.readdirSync(폴더).filter((n) => /^kcms_\d+\.csv$/i.test(n))
const 실제 = new Map()
for (const n of 파일) {
  const 글 = L.글풀기(new Uint8Array(fs.readFileSync(path.join(폴더, n))))
  const 읽 = L.고름읽기(글)
  if (읽) 실제.set(읽.머리.적요, { 글, n, 개수: 읽.객체.length, 캐드: 읽.머리.캐드 })
}
console.log('🧱 G686 실제 캐드 → 골조 모델 부재 견주기 — csv ' + 파일.length + '개')
봄(map.묶음.every((b) => 실제.has(b.적요)), '묶음 ' + map.묶음.length + '개 모두 캐드에서 옴(한글 적요 그대로 — CP949 · UTF-8 · UTF-16 어느 꼴이든)', [...실제.keys()])
for (const b of map.묶음) { const x = 실제.get(b.적요); if (x) 봄(x.개수 === L.고름읽기(b.글).객체.length, `«${b.적요}» 객체 ${x.개수} = 그린 것 ${L.고름읽기(b.글).객체.length}(레이어 ${b.레이어} · ${x.n} · ${x.캐드})`) }
/* 같은 번호(안 받은 것) — 스크립트가 지금 시각 번호 둘에 «PLACE» 자리를 두고 연달아 두 번 보냄 → 자리는 그대로 · 둘 다 다른 번호에 · csv 마다 다 썼다는 .txt */
if (map.연달아) {
  const 둘 = map.연달아.적요.map((a) => 실제.get(a))
  봄(둘.every((x) => x && x.개수 === map.연달아.개수) && new Set(둘.map((x) => x && x.n)).size === 2,
    `연달아 두 번 보냄(DELAY 없이) — 둘 다 남음 · ${둘.map((x) => x ? x.n + ' ' + x.개수 + '개' : '없음').join(' · ')}`, 둘.map((x) => x && x.n))
  const 표 = fs.readdirSync(폴더).filter((n) => /^kcms_\d+\.txt$/i.test(n)).map((n) => ({ n, 글: L.글풀기(new Uint8Array(fs.readFileSync(path.join(폴더, n)))).trim() }))
  const 자리 = 표.filter((x) => x.글 === 'PLACE')
  봄(자리.length === map.자리, `안 받은 자리(.txt «PLACE») ${자리.length}/${map.자리} 그대로 — 리습이 그 번호를 덮지 않음(${자리.map((x) => x.n).join(' · ')})`, 표.map((x) => x.n + '=' + x.글.slice(-30)))
  const 짝 = 파일.map((n) => { const t = 표.find((x) => x.n.toLowerCase() === n.toLowerCase().replace(/\.csv$/, '.txt')); return { n, ok: !!t && t.글.toLowerCase().endsWith('\\' + n.toLowerCase()) } })
  봄(짝.length > 0 && 짝.every((x) => x.ok), `csv ${짝.length}개 모두 같은 이름 .txt(다 썼다는 표시 · 그 csv 경로)`, 짝.filter((x) => !x.ok))
  /* 다운로드 자리 — 리습 kcms-dl(윈도 «User Shell Folders» 다운로드 자리 · 없으면 USERPROFILE\Downloads)이 준 곳의 K-conmap 에 썼나(스크립트가 after.txt 에 DL= 을 적음) */
  const 뒤 = path.join(폴더, 'after.txt')
  if (fs.existsSync(뒤)) {
    const 줄 = L.글풀기(new Uint8Array(fs.readFileSync(뒤))).split(/\r?\n/)
    const 값 = (k) => (줄.find((l) => l.startsWith(k + '=')) || '').slice(k.length + 1)
    const 경로 = 표.filter((x) => x.글 !== 'PLACE').map((x) => x.글)
    봄(값('DL') && 경로.length > 0 && 경로.every((g) => g.toLowerCase().startsWith((값('DL') + '\\K-conmap\\').toLowerCase())) && 값('D').toLowerCase() === (값('DL') + '\\K-conmap').toLowerCase(),
      `다운로드 자리 DL=${값('DL')} · 레지스트리 값(캐드가 준 꼴) REG=${값('REG')} → 그 안 K-conmap 에 씀(csv ${경로.length}개)`, 줄)
  }
}
if (!map.묶음.every((b) => 실제.has(b.적요))) { console.log(`\n✗ ${틀.length}개 틀림`); process.exit(1) }
const A = 흐름(map.묶음.map((b) => 실제.get(b.적요).글)), B = 흐름(map.묶음.map((b) => b.글))
for (let i = 0; i < map.묶음.length; i++) 봄(A.채움[i].부재 === B.채움[i].부재 && A.채움[i].줄 === B.채움[i].줄, `«${A.채움[i].적요}» 줄 ${A.채움[i].줄} · 부재/부호/층 = 건설맵이 쓴 글과 같음 — ${A.채움[i].부재.split(' ').slice(0, 3).join(' ')}${A.채움[i].줄 > 3 ? ' …' : ''}`, [A.채움[i], B.채움[i]])
봄(A.결.세움 === B.결.세움 && JSON.stringify(A.결.종류별) === JSON.stringify(B.결.종류별) && A.결.못.length === B.결.못.length, `세움 ${A.결.세움}(${Object.entries(A.결.종류별).map(([k, v]) => k + ' ' + v).join(' · ')}) · 못 세움 ${A.결.못.length} — 같음`, [D.세움글(A.결), D.세움글(B.결)])
const 합 = (S) => Object.fromEntries((S.R.집계.합 || []).map((a) => [a.항목 + '|' + a.규격, a.산출]))
const a = 합(A.S), b = 합(B.S), 열 = [...new Set([...Object.keys(a), ...Object.keys(b)])]
봄(!A.S.오류 && 열.length > 0 && 열.every((k) => Math.abs((a[k] || 0) - (b[k] || 0)) < 1e-9), '골조 물량(규격별 산출) ' + 열.length + '칸 같음 — ' + 열.map((k) => k + ' ' + a[k]).join(' · '), 열.filter((k) => Math.abs((a[k] || 0) - (b[k] || 0)) >= 1e-9).map((k) => k + ' 캐드 ' + a[k] + ' / 글 ' + b[k]))
/* 캐드는 고른 것을 «새것부터» 줌(ssget "X") → 줄 차례가 달라 더하는 차례가 바뀜 — 3.344 ↔ 3.3439999999999994 같은 끝수 흔들림은 같은 값(백만분의 1 로 맞춰 견줌) */
const 끝 = (v) => (typeof v === 'number' ? +v.toFixed(6) : v)
const 부 = (S) => S.부호별.map((x) => x.종류 + ' ' + x.부호 + ' ' + x.개수 + '개 ' + 끝(x.콘크리트) + '㎥ ' + 끝(x.거푸집) + '㎡').sort().join(' | ')
봄(부(A.S) === 부(B.S), '부호별 같음 — ' + 부(A.S), [부(A.S), 부(B.S)])
봄(JSON.stringify(A.셈.합) === JSON.stringify(B.셈.합) && A.셈.검사.세움 === B.셈.검사.세움, `캐드 탭 합(세운 줄 뺌) ${JSON.stringify(A.셈.합)} · 세운 줄 ${A.셈.검사.세움} — 같음`, [A.셈.합, B.셈.합])
봄(JSON.stringify(A.대조.map((d) => [d.품명, d.단위, d.수량])) === JSON.stringify(B.대조.map((d) => [d.품명, d.단위, d.수량])), '내역 대조 줄 같음 — ' + A.대조.map((d) => d.품명 + ' ' + d.수량 + ' ' + d.단위).join(' · '), [A.대조, B.대조])
console.log(틀.length ? `\n✗ ${틀.length}개 틀림 / ✓ ${됨}` : `\n✓ 모두 ${됨}개 통과`)
process.exit(틀.length ? 1 : 0)
