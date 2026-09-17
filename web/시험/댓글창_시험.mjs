/* 💬 «한 줄 남기기» 창의 셈이 맞는지 — 실제 코드를 떼어 내서 돌려 봅니다. (2026-09-17)
 *
 *   node web/시험/댓글창_시험.mjs
 *
 * ⚠️ 규칙을 고치면 여기 숫자도 같이 고치십시오. 짐작으로 「되겠지」 하지 않습니다.
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
  + '\n return { 띄울까, askWrote, 읽기, 쓰기, NOPE, SEEN };')()
const { 띄울까, askWrote, 읽기, 쓰기, NOPE, SEEN } = m
const m2 = new Function(표.replace(/export function/g, 'function')
  + '\n return { 무료, 글나누기 };')()
const { 무료, 글나누기 } = m2
const 뒤로 = (k, ms) => { const x = 읽기(SEEN); x[k] = Date.now() - ms; 쓰기(SEEN, x) }

let ok = 0, bad = 0
const T = (n, v, w) => { v === w ? (ok++, console.log('  ○ ' + n)) : (bad++, console.log('  ✕ ' + n + ' → ' + v)) }

console.log('① 서식·도구 — 하나 받을 때마다')
T('첫 번째는 뜬다', 띄울까('forms'), true)
T('바로 또 받으면 안 뜬다 (한 묶음에 한 번)', 띄울까('forms'), false)
T('세 번째도 안 뜬다', 띄울까('forms'), false)
뒤로('forms', 3 * 60 * 1000)
T('3분 뒤에 받으면 다시 뜬다', 띄울까('forms'), true)

console.log('② 바로투찰 — 5번 쓰면 그 날 한 번')
for (let n = 1; n <= 4; n++) T('  ' + n + '번째는 안 뜬다', 띄울까('bid'), false)
T('  5번째에 뜬다', 띄울까('bid'), true)
뒤로('bid', 3 * 60 * 1000); T('  6번째는 안 뜬다', 띄울까('bid'), false)
뒤로('bid', 3 * 60 * 1000); T('  7번째도 안 뜬다', 띄울까('bid'), false)

console.log('③ 「나중에」 3번 연달아 → 그 갈래는 3일에 한 번')
{ const n = 읽기(NOPE); n.forms = 3; 쓰기(NOPE, n) }
뒤로('forms', 5 * 60 * 1000); T('  3분 지나도 안 뜬다', 띄울까('forms'), false)
뒤로('forms', 2 * 24 * 3600 * 1000); T('  2일 지나도 안 뜬다', 띄울까('forms'), false)
뒤로('forms', 4 * 24 * 3600 * 1000); T('  3일 넘으면 다시 뜬다', 띄울까('forms'), true)

console.log('④ 글을 한 번 쓰면 「나중에」 셈이 0')
{ const n = 읽기(NOPE); n.cad = 3; 쓰기(NOPE, n) }
뒤로('cad', 5 * 60 * 1000); T('  거절 3번이면 안 뜬다', 띄울까('cad'), false)
askWrote('cad')
뒤로('cad', 5 * 60 * 1000); T('  글 쓰면 바로 다시 뜬다', 띄울까('cad'), true)

console.log('⑤ 유료에는 안 묻는다 (소장님: 「유료는 띄우지 말자」)')
T('  적산(jeoksan) 없음', 무료.includes('jeoksan'), false)
T('  안전관리계획서(safety) 없음', 무료.includes('safety'), false)
T('  내역서 대행(naeyeok) 없음', 무료.includes('naeyeok'), false)
T('  서식(forms) 있음', 무료.includes('forms'), true)
T('  캐드(cad) 있음', 무료.includes('cad'), true)
T('  바로투찰(bid) 있음', 무료.includes('bid'), true)

console.log('⑥ 첫 줄이 제목이 된다 (2026-09-17 — 창 안에서 바로 씁니다)')
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
