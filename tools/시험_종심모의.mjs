/**
 * 🧪 🎲 G817 종심 «모의 개찰» 셈 — lib/종심모의.js (node · 인터넷 안 씀 · 파이썬 안 부름 → PC 시험 목록에 넣어도 됨)
 *   ① 한공고 — 지난 개찰 금액 + 내 금액 → 균형가격(lib/종심셈.js 균형가격 그대로) · 내 가격점수 · 등수(같은 점수는 같은 등수) · 예정가격 넘으면 무효 = 손셈
 *   ② 모의개찰 — 같은 갈래만 · 개찰일 새것부터 · 최대 건수 · 천 원 아래 버림 · 요약(평균 · 1등 · 3등 안 · 10% 안 · 0점 · 무효) = 결과로 손셈
 *   ③ 실제 자료(있을 때) — 1순위 저장소(data/seed/first.json.gz)에서 업체 «모두» 가 실린 종심 개찰(참여 30곳 이하)만 골라
 *      균형가격(모든 금액 · 예정 · 규칙) = 수집(collect 종심넣기 — 파이썬)이 셈해 둔 균형가격(data/seed/jongsim.json)과 같음 → 모의 개찰이 쓰는 셈이 수집과 같다는 것
 *      · 씨앗 길: JONGSIM_SEED · FIRST_SEED 로 바꿀 수 있음(작업 폴더에 없으면 건너뜀 — 표시만)
 *   돌리기: node tools/시험_종심모의.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { fileURLToPath } from 'node:url'
import { 한공고, 모의개찰 } from '../web/src/lib/종심모의.js'
import { 균형가격, 종심가격점수 } from '../web/src/lib/종심셈.js'

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
let n = 0, bad = 0
const ok = (이름, c, got) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (c || got === undefined ? '' : ' = ' + JSON.stringify(got).slice(0, 400))) }

console.log('① 한공고 — 손셈')
const 기초 = 10_000_000_000, 예정 = 10_020_000_000
const 금액 = Array.from({ length: 20 }, (_, k) => 8_500_000_000 + k * 10_000_000)
const 줄 = ['2026-10-01 11:00', '간이형', 60, 기초, 예정, 1, 0, 금액]
const T = 8_600_000_000
const 손균 = 균형가격([...금액, T], 예정, true)
const 손점 = (x) => (x > 예정 ? null : (종심가격점수(x, 손균.bal, 예정, 60) ?? 0))
const 손내 = 손점(T), 손남 = 금액.map(손점)
const o = 한공고(줄, T)
ok('균형가격 = 균형가격(지난 금액 + 내 금액 · 예정 · 규칙) · 내 점수 = 종심가격점수 · 등수 = 더 높은 점수 수 + 1 · 참여 21 · 1등 점수', o.균형 === 손균.bal && o.내 === 손내
  && o.등 === 1 + 손남.filter((v) => v > 손내 + 1e-9).length && o.n === 21 && o.일 === Math.max(손내, ...손남) && Math.abs(o.균형율 - (손균.bal * 100) / 기초) < 1e-9, [o, 손균.bal, 손내])
const 같은 = 한공고(줄, 금액[5])
ok('남과 같은 금액 → 같은 점수 · 같은 등수(그 업체와 공동)', 같은.등 === 1 + 금액.map((v) => 종심가격점수(v, 같은.균형, 예정, 60) ?? 0).filter((v) => v > 같은.내 + 1e-9).length, 같은)
const 넘음 = 한공고(줄, 예정 + 1000)
ok('예정가격 넘는 금액 → 무효(내 null · 등 null) · 1등은 남들 중', 넘음 && 넘음.내 === null && 넘음.등 === null && 넘음.일 > 0, 넘음)
ok('틀린 줄 · 금액 0 · 금액 1개 → null', 한공고(null, T) === null && 한공고(줄, 0) === null && 한공고(['d', '간이형', 60, 기초, 예정, 1, 0, [5]], T) === null)

console.log('② 모의개찰 — 같은 갈래 · 새것부터 · 최대 · 요약')
const 표 = { 공고: {
  A: ['2026-10-01 11:00', '간이형', 60, 기초, 예정, 1, 0, 금액],
  B: ['2026-11-05 11:00', '간이형', 60, 12_000_000_000, 12_030_000_000, 1, 0, 금액.map((v) => Math.round(v * 1.2))],
  C: ['2026-09-01 11:00', '간이형', 60, 9_000_000_000, 8_990_000_000, 0, 0, 금액.map((v) => Math.round(v * 0.9))],
  D: ['2026-11-10 11:00', '일반', 50, 기초, 예정, 1, 0, 금액],
  E: ['2026-11-11 11:00', '간이형', 60, 0, 예정, 1, 0, 금액],          /* 기초 없음 → 뺌 */
} }
const 모 = 모의개찰(표, '간이형', 86.0)
ok('간이형만(일반 D · 기초 없는 E 뺌) · 개찰일 새것부터(B · A · C) · 내 금액 = 기초 × 86% 천 원 버림', 모.n === 3 && 모.결과.map((x) => x.no).join('') === 'BAC'
  && 모.결과.every((x) => x.T === Math.floor((표.공고[x.no][3] * 86) / 100 / 1000) * 1000), 모.결과.map((x) => [x.no, x.T]))
const 손 = 모.결과.map((x) => 한공고(표.공고[x.no], x.T))
ok('결과 줄 = 한공고 손셈 그대로', 모.결과.every((x, i) => x.내 === 손[i].내 && x.등 === 손[i].등 && x.일 === 손[i].일), 모.결과)
const 유 = 모.결과.filter((x) => x.내 != null)
ok('요약 — 평균(유효) · 1등 평균 · 1등 · 3등 안 · 10% 안 · 0점 · 무효 = 결과로 손셈', Math.abs(모.평균 - 유.reduce((a, x) => a + x.내, 0) / 유.length) < 1e-9
  && Math.abs(모.일평균 - 모.결과.reduce((a, x) => a + x.일, 0) / 모.n) < 1e-9 && 모.일등 === 유.filter((x) => x.등 === 1).length && 모.삼등 === 유.filter((x) => x.등 <= 3).length
  && 모.십분 === 유.filter((x) => x.등 <= Math.max(1, Math.ceil(x.n * 0.1))).length && 모.영 === 유.filter((x) => x.내 <= 0).length && 모.무효 === 모.n - 유.length, 모)
ok('최대 2 → 새것 둘(B · A)', 모의개찰(표, '간이형', 86, 2).결과.map((x) => x.no).join('') === 'BA')
const 높 = 모의개찰(표, '간이형', 100.5)
ok('기초의 100.5% → 예정(A · B 는 기초 + 0.2 ~ 0.3%) 넘는 곳은 무효로 셈 · C(예정 < 기초)도 무효', 높.무효 === 3 && 높.평균 === null, 높)
ok('자료 없음 · 갈래 없음 · 율 0 → 빈 결과', 모의개찰(null, '간이형', 86).n === 0 && 모의개찰(표, '고난도', 86).n === 0 && 모의개찰(표, '간이형', 0).n === 0)
/* 묶음 거름 — 카드 «예상» 과 같은 묶음(열쇠 앞부분 · 규칙 뒤) · 5건 안 되면 갈래 전체 */
const 묶표 = { 공고: {} }
for (let i = 0; i < 9; i++) {
  const 열 = i < 6 ? '간이형|조달청|0|토목공사업' : '간이형|가상시|0|'
  묶표.공고['M' + i] = [`2026-10-${String(10 + i).padStart(2, '0')} 11:00`, '간이형', 60, 기초, 예정, i % 3 === 0 ? 0 : 1, 0, 금액, 열]
}
const 조 = 모의개찰(묶표, { kind: '간이형', 열쇠: '간이형|조달청' }, 86)
ok('묶음 «간이형|조달청» → 열쇠 앞부분이 같은 6건만(가상시 3건 뺌) · 넓힘 아님', 조.n === 6 && !조.넓힘 && 조.결과.every((x) => 묶표.공고[x.no][8].startsWith('간이형|조달청|')), 조.결과.map((x) => x.no))
const 조뒤 = 모의개찰(묶표, { kind: '간이형', 열쇠: '간이형|조달청', 규칙뒤: true }, 86)
ok('규칙 뒤 묶음 → sm 1 만(6건 중 4건) — 5건 안 됨 → 갈래 전체 9건으로 넓힘', 조뒤.n === 9 && 조뒤.넓힘 === true, [조뒤.n, 조뒤.넓힘])
const 조뒤5 = 모의개찰(묶표, { kind: '간이형', 열쇠: '간이형|조달청', 규칙뒤: true }, 86, 30, 4)
ok('최소 4 → 규칙 뒤 4건 그대로 · 넓힘 아님', 조뒤5.n === 4 && !조뒤5.넓힘 && 조뒤5.결과.every((x) => 묶표.공고[x.no][5] === 1), 조뒤5.결과.map((x) => x.no))
ok('갈래 글자만(«간이형») → 갈래 전체 · 넓힘 아님 · 열쇠 없는 옛 줄도 씀', 모의개찰(묶표, '간이형', 86).n === 9 && !모의개찰(묶표, '간이형', 86).넓힘 && 모의개찰(표, '간이형', 86).n === 3)

console.log('③ 실제 자료 — 업체 «모두» 가 실린 종심 개찰로 균형가격이 수집(파이썬)과 같은가')
const 씨앗 = process.env.JONGSIM_SEED || path.join(ROOT, 'data', 'seed', 'jongsim.json')
const 첫 = process.env.FIRST_SEED || path.join(ROOT, 'data', 'seed', 'first.json.gz')
if (!fs.existsSync(씨앗) || !fs.existsSync(첫)) {
  console.log(`  · 실제 자료 없음(${!fs.existsSync(씨앗) ? 씨앗 : 첫}) — ③ 건너뜀`)
} else {
  const js = JSON.parse(fs.readFileSync(씨앗, 'utf8')).con || {}
  const fc = (JSON.parse(zlib.gunzipSync(fs.readFileSync(첫)).toString('utf8')).con) || {}
  const 실 = []
  for (const [no, r] of Object.entries(js)) {
    const e = fc[no]
    if (!e || !Array.isArray(e.corps) || !(Number(e.nrank) > 1) || e.corps.length < Number(e.nrank)) continue
    if (!(r.yp > 0) || !(r.bal > 0) || !(r.base > 0)) continue
    실.push([no, r, e.corps.map((c) => Math.trunc(Number(c[1]))).filter((v) => v > 0)])
  }
  console.log(`  · 업체 모두가 실린 종심 개찰 ${실.length}건(씨앗 ${Object.keys(js).length}줄 · 1순위 저장소 ${Object.keys(fc).length}건)`)
  if (!실.length) { console.log('  · 맞는 개찰이 아직 없음 — ③ 건너뜀') } else {
    const 틀림 = 실.filter(([, r, a]) => { const b = 균형가격(a, r.yp, !!r.sm); return !b || b.bal !== r.bal || b.n0 !== r.n0 || b.n1 !== r.n1 })
    ok(`실제 ${실.length}건 — 균형가격 · 받은 수 · 빼기 뒤 수 = 수집이 셈해 둔 값(모의 개찰이 쓰는 셈 = 수집 셈)`, 틀림.length === 0, 틀림.slice(0, 3).map(([no, r, a]) => [no, r.bal, (균형가격(a, r.yp, !!r.sm) || {}).bal]))
    const 실표 = { 공고: Object.fromEntries(실.map(([no, r, a]) => [no, [r.dt, r.kind, r.pt, r.base, r.yp, r.sm, r.bal, [...a].sort((x, y) => x - y)]])) }
    const 갈래들 = [...new Set(실.map(([, r]) => r.kind))]
    const 모실 = 갈래들.map((k) => {
      const 율 = 실.filter(([, r]) => r.kind === k).map(([, r]) => r.br)[0]
      return [k, 모의개찰(실표, k, 율)]
    })
    ok('실제 — 갈래마다 모의 개찰(그 갈래 첫 개찰의 균형÷기초 % 를 넣음) · 등수 1 ~ 참여 수 · 점수 0 ~ 배점', 모실.every(([k, m]) => m.n === 실.filter(([, r]) => r.kind === k).length
      && m.결과.every((x) => (x.내 == null || (x.등 >= 1 && x.등 <= x.n && x.내 >= 0 && x.내 <= 표점(x.no))))), 모실.map(([k, m]) => [k, m.n, m.평균]))
    function 표점(no) { return 실표.공고[no][2] }
  }
}

console.log(`\n${bad ? '✗' : '✓'} 시험_종심모의 ${n - bad}/${n}`)
if (bad) process.exit(1)
