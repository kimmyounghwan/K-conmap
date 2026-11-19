// 🧪 G790 — 요율 달력 (node tools/시험_요율달력.mjs) — 노드만(덧 꾸러미 없음)
//   ① 점검표(lib/해마다.js) ↔ 달표(lib/요율달력.js) 빠짐 · 남음 없음 — 새 값을 넣고 달력을 잊지 않게
//   ② 달표 꼴(짧게 · 시행 · 달 1~12 · 겹침 없음) ③ 점검표 «언제» 에 12월이 적힌 값은 12월에 있음
//   ④ 달력() 열두 달 ⑤ 이번달볼것 — 2026 ~ 2028 날마다: «그 달이 바뀌는 달» ∪ «다음 확인이 지난 것», 밀림 표시
//   ⑥ 이번월 · 다음볼달 ⑦ 화면 자리(/tools/haemada 카드 · 관리자 띠 · 스타일) ⑧ 카드 글에 금지 말 없음
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as H from '../web/src/lib/해마다.js'
import * as R from '../web/src/lib/요율달력.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const 읽 = (...p) => fs.readFileSync(path.join(ROOT, 'web', 'src', ...p), 'utf8').replace(/\r\n/g, '\n')
let 통과 = 0, 실패 = 0
const 봄 = (참, 무엇, 더 = '') => { if (참) { 통과++; console.log('  ✓', 무엇) } else { 실패++; console.log('  ✗', 무엇, 더) } }

console.log('① 점검표 ↔ 달표')
const 점k = H.점검표.map((x) => x.k), 달k = Object.keys(R.달표)
const 빠짐 = 점k.filter((k) => !R.달표[k]), 남음 = 달k.filter((k) => !점k.includes(k))
봄(빠짐.length === 0, `점검표 ${점k.length}가지 모두 달표에 있음`, '빠짐: ' + 빠짐.join(', '))
봄(남음.length === 0, '달표에만 있는 값 없음', '남음: ' + 남음.join(', '))

console.log('② 달표 꼴')
for (const [k, v] of Object.entries(R.달표)) {
  const 글자 = [...String(v.짧게 || '')].length
  const 달좋음 = Array.isArray(v.달) && v.달.length > 0 && v.달.every((m) => Number.isInteger(m) && m >= 1 && m <= 12) && new Set(v.달).size === v.달.length
  봄(글자 >= 2 && 글자 <= 16 && typeof v.시행 === 'string' && v.시행.trim().length > 1 && 달좋음, `${k} — 짧게 «${v.짧게}» · 시행 «${v.시행}» · 달 ${JSON.stringify(v.달)}`)
}

console.log('③ 점검표 «언제» 에 12월이 있으면 달에 12')
for (const x of H.점검표) if (/12월/.test(x.언제 || '')) 봄((R.달표[x.k] || { 달: [] }).달.includes(12), `${x.k} — «언제» 12월 → 달에 12`, JSON.stringify((R.달표[x.k] || {}).달))

console.log('④ 달력() 열두 달')
const 열두 = R.달력()
봄(열두.length === 12 && 열두.every((m, i) => m.월 === i + 1), '1월 ~ 12월 차례')
봄(열두.every((m) => m.항목.every((x) => R.달표[x.k].달.includes(m.월) && x.짧게 === R.달표[x.k].짧게 && x.무엇)), '달마다 그 달이 «바뀌는 달» 인 값만 · 이름 맞음')
봄(달k.every((k) => R.달표[k].달.every((m) => 열두[m - 1].항목.some((x) => x.k === k))), '달표의 달마다 빠짐없이 들어감')
봄(열두.filter((m) => m.항목.length).length >= 6, '값이 있는 달 6달 넘음', 열두.map((m) => m.항목.length).join(','))

console.log('⑤ 이번달볼것 — 2026-01-01 ~ 2028-12-31 날마다')
{
  let 틀림 = [], 날수 = 0
  for (let t = Date.UTC(2026, 0, 1); t <= Date.UTC(2028, 11, 31); t += 86400e3) {
    const d = new Date(t).toISOString().slice(0, 10), m = Number(d.slice(5, 7))
    const 볼 = R.이번달볼것(d)
    const 바람 = H.점검표.filter((x) => R.달표[x.k].달.includes(m) || x.다음 <= d).map((x) => x.k)
    const 받음 = 볼.map((x) => x.k)
    const 밀림맞음 = 볼.every((x) => x.밀림 === (H.점검표.find((y) => y.k === x.k).다음 <= d))
    if (JSON.stringify(받음) !== JSON.stringify(바람) || !밀림맞음 || 볼.some((x) => !x.짧게)) 틀림.push(d)
    날수++
  }
  봄(틀림.length === 0 && 날수 === 1096, `${날수}일 — 그 달 값 ∪ 밀린 값 · 밀림 표시 · 이름`, 틀림.slice(0, 5).join(', '))
}
봄(R.이번달볼것('2026-11-19').some((x) => x.k === 'saboheom'), '11월 — 건강 · 장기요양 · 연금(장기요양 결정 무렵) 들어 있음')
봄(R.이번달볼것('2026-12-27').filter((x) => x.밀림).length >= 1, '12월 27일 — 다음 확인(12월 26일)이 지난 값은 밀림(⏰)')

console.log('⑥ 이번월 · 다음볼달')
봄(R.이번월('2026-01-05') === 1 && R.이번월('2026-12-31') === 12 && R.이번월('2027-07-01') === 7, '이번월 — 1 · 12 · 7')
for (let m = 1; m <= 12; m++) {
  const d = `2027-${String(m).padStart(2, '0')}-10`, n = R.다음볼달(d)
  let 바람 = null
  for (let i = 1; i <= 12; i++) { const c = 열두[(m - 1 + i) % 12]; if (c.항목.length) { 바람 = c.월; break } }
  봄(!!n && n.월 === 바람, `${m}월 → 다음 볼 달 ${n && n.월}월`, `바람 ${바람}`)
}

console.log('⑦ 화면 자리')
const 해 = 읽('pages', 'Haemada.jsx'), 관 = 읽('pages', 'Admin.jsx'), 꼴 = 읽('styles.css')
봄(/import \{ 달력, 이번달볼것, 이번월, 다음볼달 \} from '\.\.\/lib\/요율달력\.js'/.test(해), '/tools/haemada 가 요율달력을 부름')
const 카 = 해.indexOf('G790 (11-19)'), 표 = 해.indexOf('<div className="tp-scroll">'), 머 = 해.indexOf('className={\'hm-band\'')
봄(카 > 머 && 카 < 표 && 머 > 0, '요율 달력 카드 자리 — 첫 카드(제목 · 밀린 띠) 뒤 · 값 표 앞')
const 카글 = 해.slice(카, 표)
봄(/className="rc-grid"/.test(카글) && /이번달볼것\(오늘\)/.test(카글) && /다음볼달\(오늘\)/.test(카글) && /rel="noopener"/.test(카글), '카드 — 열두 달 칸 · 이번 달 볼 것 · 다음 볼 달 · 원문 고리(noopener)')
봄(!/무료|클로드|유료|이용권/.test(카글), '카드 글 — 금지 말 없음')
봄(/import \{ 이번달볼것, 이번월 \} from '\.\.\/lib\/요율달력\.js'/.test(관) && /이번달볼것\(\)\.filter\(\(x\) => !x\.밀림\)/.test(관), '관리자 띠 — 이번 달 볼 것(밀린 것 빼고)')
봄(/\.rc-grid \{ display: grid; grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/.test(꼴) && /@media \(max-width: 560px\) \{\n  \.rc-grid \{ grid-template-columns: minmax\(0, 1fr\); gap: 4px; \}\n  \.rc-m \{ display: flex;/.test(꼴), '스타일 — PC 4칸 · 폰 달마다 한 줄')
봄(/\.rc-chip \{[^}]*overflow-wrap: anywhere/.test(꼴) && /\.rc-m \{[^}]*min-width: 0/.test(꼴), '스타일 — 긴 이름 줄바꿈 · 칸 안 넘침')

console.log(`\n${실패 ? '❌' : '✅'} 요율 달력 ${통과}/${통과 + 실패}`)
process.exit(실패 ? 1 : 0)
