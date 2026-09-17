/* 💬 «한 줄 남기기» 창의 셈이 맞는지 — 실제 코드를 떼어 내서 돌려 봅니다. (2026-09-17)
 *
 *   node web/시험/댓글창_시험.mjs
 *
 * ⚠️ 규칙을 고치면 여기 숫자도 같이 고치십시오. 짐작으로 「되겠지」 하지 않습니다.
 *
 * ■ 지금 규칙 — **하루에 «딱 한 번»** (소장님이 2026-09-17 에 고르셨습니다)
 *     「방문자 모두에게 하루에 한번 창이 뜬다...이게 좋은 듯, 한 번이니까」
 *   · 갈래(서식·캐드·바로투찰…)를 가리지 않습니다. 하루에 한 번이면 끝입니다
 *   · 바로투찰만 «자격» 이 따로 — 공고를 5번 골라야 그 한 번에 낍니다
 *   · 「나중에」 연달아 3번 → 마지막 거절로부터 3일 쉼
 *   · 한 줄 쓰면 그 셈은 0
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const here = path.dirname(fileURLToPath(import.meta.url))
const src = fs.readFileSync(path.join(here, '..', 'src', 'AskComment.jsx'), 'utf8').replace(/\r\n/g, '\n')
/* ⚠️ 2026-09-17 — 끝표를 «/* 갈래마다» 로 잡아 두었는데 그 주석이 없어져서
   잘라내기가 export 줄까지 먹고 SyntaxError 가 났습니다.
   → 끝표를 «반드시 남아 있을 줄» 로 바꿉니다. 없으면 여기서 바로 알려 줍니다. */
const 자르기 = (a, b) => {
  const i = src.indexOf(a), j = src.indexOf(b)
  if (i < 0 || j < 0 || j <= i) {
    console.log(`✕ AskComment.jsx 에서 «${i < 0 ? a : b}» 를 못 찾았습니다 — 시험이 코드를 못 떼어 냅니다.`)
    process.exit(1)
  }
  return src.slice(i, j)
}
const 로직 = 자르기('const FLAG =', '/* 어디서 눌렀나')
const 표 = 자르기('const 무료 =', 'export function askAfter')

const store = {}
globalThis.localStorage = { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v) } }
globalThis.window = {}
const m = new Function(로직.replace(/export function/g, 'function')
  + '\n return { 띄울까, 나중에, askWrote, 읽기, 쓰기, HITS, NOPE };')()
const { 띄울까, 나중에, askWrote, 읽기, 쓰기, HITS, NOPE } = m
const m2 = new Function(표.replace(/export function/g, 'function')
  + '\n return { 무료, 글나누기 };')()
const { 무료, 글나누기 } = m2

/* 날짜를 넘깁니다 — 오늘칸() 은 day 가 다르면 새로 시작합니다 */
const 새날 = () => 쓰기(HITS, { day: '2000-01-01', n: 9, asked: 1 })
/* 마지막 거절을 과거로 밀어 둡니다 */
const 거절뒤로 = (ms) => { const n = 읽기(NOPE); n.at = Date.now() - ms; 쓰기(NOPE, n) }
const 하루 = 24 * 3600 * 1000
const 무시 = () => {}

let ok = 0, bad = 0
const T = (n, v, w) => { v === w ? (ok++, console.log('  ○ ' + n)) : (bad++, console.log('  ✕ ' + n + ' → ' + v)) }

console.log('① 하루에 «딱 한 번» — 갈래를 가리지 않는다')
T('  첫 서식에서 뜬다', 띄울까('forms'), true)
T('  곧바로 또 받으면 안 뜬다', 띄울까('forms'), false)
T('  갈래가 달라도(캐드) 안 뜬다', 띄울까('cad'), false)
T('  갈래가 달라도(설계변경) 안 뜬다', 띄울까('change'), false)
T('  셰어원도 안 뜬다', 띄울까('shareone'), false)
새날()
T('  날이 바뀌면 다시 뜬다', 띄울까('forms'), true)
T('  그 날은 또 안 뜬다', 띄울까('cad'), false)

console.log('② 바로투찰 — 공고를 5번 골라야 그 «한 번» 에 낀다')
새날()
for (let n = 1; n <= 4; n++) T('  ' + n + '번째는 안 뜬다', 띄울까('bid'), false)
T('  5번째에 뜬다', 띄울까('bid'), true)
T('  6번째는 안 뜬다', 띄울까('bid'), false)
T('  7번째도 안 뜬다', 띄울까('bid'), false)
새날()
T('  날이 바뀌면 자격부터 다시 (1번째 안 뜬다)', 띄울까('bid'), false)

console.log('③ 자격은 «바로투찰에만» — 서식은 처음부터 뜬다')
새날()
for (let n = 1; n <= 4; n++) 띄울까('bid')
T('  바로투찰 4번 뒤라도 서식은 바로 뜬다', 띄울까('forms'), true)
T('  그러고 나면 바로투찰 5번째는 안 뜬다', 띄울까('bid'), false)

console.log('④ 「나중에」 연달아 3번 → 3일 쉰다 (하루 한 번이니 사흘 걸립니다)')
쓰기(NOPE, { n: 0, at: 0 })
for (let d = 1; d <= 3; d++) {
  새날()
  T('  ' + d + '일째 뜬다', 띄울까('forms'), true)
  나중에('forms', 무시)
}
T('  「나중에」 가 3번 쌓였다', 읽기(NOPE).n, 3)
새날(); T('  4일째는 안 뜬다', 띄울까('forms'), false)
거절뒤로(2 * 하루); 새날(); T('  2일 지나도 안 뜬다', 띄울까('forms'), false)
거절뒤로(4 * 하루); 새날(); T('  3일 넘으면 다시 뜬다', 띄울까('forms'), true)

console.log('⑤ 한 줄 쓰면 「나중에」 셈이 0')
쓰기(NOPE, { n: 3, at: Date.now() })
새날(); T('  거절 3번이면 안 뜬다', 띄울까('cad'), false)
askWrote()
T('  셈이 0 이 됐다', 읽기(NOPE).n, 0)
새날(); T('  이튿날 바로 다시 뜬다', 띄울까('cad'), true)

console.log('⑥ 🚨 «묶음 2분» 같은 완충이 다시 들어오지 않았나 (2026-09-17 사고)')
T('  갈래마다 시각을 적는 칸(SEEN)이 없다', /const\s+SEEN\s*=/.test(src), false)
T('  「묶음」 이라는 값이 없다', /const\s+묶음\s*=/.test(src), false)
T('  하루 한 번을 적은 칸(HITS)이 있다', /const\s+HITS\s*=/.test(src), true)
T('  오늘 물었나(asked)로 막는다', /if\s*\(h\.asked\)\s*return false/.test(src), true)

console.log('⑦ 유료에는 안 묻는다 (소장님: 「유료는 띄우지 말자」)')
T('  적산(jeoksan) 없음', 무료.includes('jeoksan'), false)
T('  안전관리계획서(safety) 없음', 무료.includes('safety'), false)
T('  내역서 대행(naeyeok) 없음', 무료.includes('naeyeok'), false)
T('  서식(forms) 있음', 무료.includes('forms'), true)
T('  캐드(cad) 있음', 무료.includes('cad'), true)
T('  바로투찰(bid) 있음', 무료.includes('bid'), true)

console.log('⑧ 첫 줄이 제목이 된다 (창 안에서 바로 씁니다)')
T('  한 줄이면 통째로 제목', 글나누기('잘 쓰고 있습니다').t, '잘 쓰고 있습니다')
T('  한 줄이면 본문은 빈칸', 글나누기('잘 쓰고 있습니다').b, '')
T('  줄을 바꾸면 첫 줄이 제목', 글나누기('서식 잘 받았습니다\n다만 3쪽 표가 깨집니다').t, '서식 잘 받았습니다')
T('  줄을 바꾸면 나머지가 본문', 글나누기('서식 잘 받았습니다\n다만 3쪽 표가 깨집니다').b, '다만 3쪽 표가 깨집니다')
{
  const 긴 = '가'.repeat(200)
  T('  한 줄인데 길면 제목이 80자 이내', 글나누기(긴).t.length <= 80, true)
  T('  한 줄인데 길면 본문에 통째로', 글나누기(긴).b, 긴)
}
T('  앞뒤 빈칸은 털어 낸다', 글나누기('   고맙습니다   ').t, '고맙습니다')
T('  두 글자가 안 되면 제목이 짧다(막힙니다)', 글나누기(' ㅇ ').t.length < 2, true)

console.log('\n맞음 ' + ok + ' · 틀림 ' + bad)
process.exit(bad ? 1 : 0)
