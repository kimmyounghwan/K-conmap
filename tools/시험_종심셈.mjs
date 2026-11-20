/**
 * 🧪 G804 종심제 셈(화면 쪽 — web/src/lib/종심셈.js) — tools/종심셈_표.json 의 손셈 답과 같은지
 *   돌리기: node tools/시험_종심셈.mjs   (짝: tools/시험_종심셈.py 가 kcm_rules.py 를 같은 표로 봄)
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { 종심갈래, 균형가격, 종심가격점수 } from '../web/src/lib/종심셈.js'

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const 표 = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', '종심셈_표.json'), 'utf8'))
let n = 0, bad = 0
const ok = (이름, c, got) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (c ? '' : ' = ' + JSON.stringify(got).slice(0, 300))) }

console.log('① 균형가격(예규 제8조 · 조달청 제7조)')
for (const t of 표.균형가격) {
  const r = 균형가격(t.금액, t.예정, t.같은금액 ?? true)
  if (t.기대 === null) ok(t.이름, r === null, r)
  else ok(t.이름, r !== null && Object.entries(t.기대).every(([k, v]) => r[k] === v), r)
}
console.log('② 가격점수([별표 3] · 조달청 [별표 4])')
for (const t of 표.가격점수) {
  const r = 종심가격점수(t.투찰, t.균형, t.예정, t.배점, t.A ?? 1, t.B ?? 1)
  ok(t.이름, (r === null && t.기대 === null) || (r !== null && t.기대 !== null && Math.abs(r - t.기대) < 1e-9), r)
}
console.log('③ 갈래 · 배점(조달청 [별표 1-1 ~ 1-5] · 행안부 예규 제3장)')
for (const t of 표.갈래) {
  const r = 종심갈래(t.swin, t.est)
  ok(`${t.swin.slice(0, 40) || '(빈 글)'} · ${(t.est / 1e8).toLocaleString()}억 → ${JSON.stringify(t.기대)}`, (r === null && t.기대 === null) || (r !== null && t.기대 !== null && JSON.stringify(r) === JSON.stringify(t.기대)), r)
}
console.log(`\n${bad ? '✗' : '✓'} 시험_종심셈(화면) ${n - bad}/${n}`)
if (bad) process.exit(1)
