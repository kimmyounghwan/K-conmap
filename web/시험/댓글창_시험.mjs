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
const i = src.indexOf('const FLAG ='), j = src.indexOf('/* 갈래마다')

const store = {}
globalThis.localStorage = { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v) } }
globalThis.window = {}
const m = new Function(src.slice(i, j).replace(/export function/g, 'function')
  + '\n return { 띄울까, askWrote, 읽기, 쓰기, NOPE, SEEN };')()
const { 띄울까, askWrote, 읽기, 쓰기, NOPE, SEEN } = m
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
const A = src.slice(j)
T('  적산(jeoksan) 없음', !/^\s*jeoksan:/m.test(A), true)
T('  서식(forms) 있음', /^\s*forms:/m.test(A), true)
T('  캐드(cad) 있음', /^\s*cad:/m.test(A), true)

console.log('\n맞음 ' + ok + ' · 틀림 ' + bad)
process.exit(bad ? 1 : 0)
