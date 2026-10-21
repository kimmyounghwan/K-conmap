// 🧮 G361 서식 자동 계산 대조 — 사이트 셈(web/src/lib/엑셀셈.js) = LibreOffice 다시 계산(tools/forms2/격자검증.py 가 만든 want.json)
//   서식마다 세 벌(작성 예시 · 흔듦1 · 흔듦2) · 수식 칸 하나하나 원 단위 · 글자 · 오류까지
//   node tools/격자셈시험.mjs [폴더=/tmp/g10/g361/v] [슬러그…]
import fs from 'fs'
import { 책만들기, 열번호 } from '../web/src/lib/엑셀셈.js'
import { 꼴 } from '../web/src/lib/엑셀꼴.js'

const 폴더 = process.argv[2] || '/tmp/g10/g361/v'
const 고른 = new Set(process.argv.slice(3))
const 벌들 = JSON.parse(fs.readFileSync(폴더 + '/want.json', 'utf8'))
const 같음 = (a, b) => {
  if (a === null || a === undefined) a = ''
  if (b === null || b === undefined) b = ''
  if (a && typeof a === 'object' && 'e' in a) a = a.e
  if (typeof a === 'number' && typeof b === 'number') return Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b))
  if (typeof b === 'string' && /^#|^Err:/.test(b) && typeof a === 'string' && /^#/.test(a)) return true      // 오류끼리(종류는 프로그램마다 조금 다름)
  if (typeof a === 'boolean' && typeof b === 'number') return (a ? 1 : 0) === b
  if (typeof b === 'boolean' && typeof a === 'number') return (b ? 1 : 0) === a
  return a === b
}
let 칸ok = 0, 칸bad = 0
const 서식 = new Map()
const 틀림 = []
for (const 벌 of 벌들) {
  if (고른.size && !고른.has(벌.slug)) continue
  const doc = JSON.parse(fs.readFileSync(`${폴더}/g/${벌.slug}.json`, 'utf8'))
  const 책 = 책만들기(doc)
  책.꼴 = 꼴
  const 알림 = []
  책.알림 = (m) => 알림.push(m)
  for (const [a, v] of Object.entries(벌.inputs || {})) {
    const m = /^(\d+)!([A-Z]+)(\d+)$/.exec(a)
    책.넣기(+m[1], +m[3], 열번호(m[2]), v === null ? null : v)
  }
  let ok = 0, bad = 0
  for (const [a, want] of Object.entries(벌.want)) {
    const m = /^(\d+)!([A-Z]+)(\d+)$/.exec(a)
    const si = +m[1], r = +m[3], c = 열번호(m[2])
    const 넣음 = 벌.inputs ? 벌.inputs[a] : undefined
    if (넣음 !== undefined && !(넣음 && typeof 넣음 === 'object' && 'f' in 넣음)) continue     // 값을 넣은 칸(수식 기본 칸) · 예시 수식은 셈 대조
    const got = 책.값(si, r, c)
    if (같음(got, want)) ok++
    else { bad++; if (틀림.length < 400) 틀림.push(`${벌.slug} [${벌.tag}] ${doc.sheets[si].name}!${m[2]}${r}  사이트 ${JSON.stringify(got && got.e ? got.e : got)} ≠ LO ${JSON.stringify(want)}   = ${책.칸(si, r, c)?.f}`) }
  }
  칸ok += ok; 칸bad += bad
  const s = 서식.get(벌.slug) || { ok: 0, bad: 0, 벌: [], 알림: [] }
  s.ok += ok; s.bad += bad; s.벌.push(`${벌.tag} ${bad ? '✗' + bad : '✓'}${ok}`); s.알림.push(...알림.slice(0, 3))
  서식.set(벌.slug, s)
}
let 다맞음 = 0
for (const [slug, s] of 서식) {
  if (!s.bad) 다맞음++
  console.log(`${s.bad ? '✗' : '✓'} ${slug.padEnd(28)} ${s.벌.join(' · ')}${s.알림.length ? '  ⚠ ' + s.알림[0] : ''}`)
}
if (틀림.length) { console.log('\n── 틀린 칸(앞 400) ──'); for (const t of 틀림) console.log(t) }
console.log(`\n서식 ${서식.size} · 세 벌 모두 맞음 ${다맞음} · 수식 칸 맞음 ${칸ok} · 틀림 ${칸bad}`)
process.exit(칸bad ? 1 : 0)
