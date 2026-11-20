// 🧪 G791 — 뒤 화면 굴림 막기는 html 에만 (node tools/시험_굴림잠금.mjs) — 노드만(덧 꾸러미 없음)
//   소장님 11-20 「맵톡에서 클릭을 해도 글을 쓰는걸로 전환이 안돼」 · 「답글쓰는 박스가 위쪽에서 열려」
//   ① web/src 에 body 잠금(document.body.style.overflow 쓰기)이 다시 나오면 잡음 — body 가 스크롤 상자가 되면 머리줄이 사라지고 아이폰은 떠 있는 창을 쪽 맨 위에 그림
//   ② 창을 여는 일곱 곳(공지창 · 빠른 찾기 · 적산 작업 화면 다섯)이 lib/굴림잠금.js 를 부르고 닫을 때 풂
//   ③ styles.css body 막이(!important) ④ 굴림잠금 셈 — 겹친 창 · 닫는 차례 · 두 번 풀기 · 옛 값 되돌림 · 막대 자리(PC 만)
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SRC = path.join(ROOT, 'web', 'src')
const 읽 = (p) => fs.readFileSync(path.join(SRC, p), 'utf8').replace(/\r\n/g, '\n')
let 통과 = 0, 실패 = 0
const 봄 = (참, 무엇, 더 = '') => { if (참) { 통과++; console.log('  ✓', 무엇) } else { 실패++; console.log('  ✗', 무엇, 더) } }

console.log('① body 잠금 없음')
const 파일들 = []
const 돌기 = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) { if (e.name !== 'node_modules') 돌기(p) } else if (/\.(jsx?|mjs)$/.test(e.name)) 파일들.push(p) } }
돌기(SRC)
const 주석뺌 = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1')
const 잠금꼴 = /document\.body\.style\.overflow\s*=(?!=)|body\.style\.setProperty\(\s*['"]overflow|document\.body\.style\.cssText\s*\+?=/
const 걸린 = 파일들.filter((p) => 잠금꼴.test(주석뺌(fs.readFileSync(p, 'utf8'))))
봄(파일들.length > 100, `web/src 파일 ${파일들.length}개 훑음`)
봄(걸린.length === 0, 'document.body.style.overflow 쓰기 없음(뒤 막기는 lib/굴림잠금.js 만)', 걸린.map((p) => path.relative(SRC, p)).join(', '))

console.log('② 창 일곱 곳이 굴림잠금을 부름')
const 일곱 = [['감사공지.jsx', './lib/굴림잠금.js'], ['빠른찾기창.jsx', './lib/굴림잠금.js'], ['pages/Model.jsx', '../lib/굴림잠금.js'], ['pages/Golgo.jsx', '../lib/굴림잠금.js'],
  ['pages/JeoksanAuto.jsx', '../lib/굴림잠금.js'], ['pages/Bim.jsx', '../lib/굴림잠금.js'], ['pages/Magam.jsx', '../lib/굴림잠금.js']]
for (const [f, 길] of 일곱) {
  const s = 읽(f)
  const 들임 = s.includes(`import { 굴림잠금 } from '${길}'`)
  const 부름 = (s.match(/const 풀기 = 굴림잠금\(\)/g) || []).length === (f === '감사공지.jsx' ? 3 : 1)   /* 감사공지 = 공지창 + 🛠 G792 점검창 + G793 점검막기화면 */
  const 풂 = /return \(\) => \{ (window\.removeEventListener\('keydown', 키\); )?풀기\(\) \}/.test(s)
  봄(들임 && 부름 && 풂, `${f} — 들임 · 열 때 잠금 · 닫을 때 풂`)
}
{
  const s = 읽('감사공지.jsx')
  const i = s.indexOf('function 공지창(')
  const 몸 = s.slice(i, s.indexOf('return createPortal(', i))
  봄(/addEventListener\('keydown', 키\)/.test(몸) && /풀기 = 굴림잠금\(\)/.test(몸) && /removeEventListener\('keydown', 키\); 풀기\(\)/.test(몸), '공지창 — Esc 듣기 · 잠금 · 닫을 때 둘 다 풂(한 효과 안)')
  const j = s.indexOf('function 점검창(')
  const 몸2 = j > 0 ? s.slice(j, s.indexOf('return createPortal(', j)) : ''
  봄(/addEventListener\('keydown', 키\)/.test(몸2) && /풀기 = 굴림잠금\(\)/.test(몸2) && /removeEventListener\('keydown', 키\); 풀기\(\)/.test(몸2), '🛠 G792 점검창 — Esc 듣기 · 잠금 · 닫을 때 둘 다 풂(한 효과 안)')
  const k = s.indexOf('function 점검막기화면(')
  const 몸3 = k > 0 ? s.slice(k, s.indexOf('return createPortal(', k)) : ''
  봄(/const 풀기 = 굴림잠금\(\)/.test(몸3) && /return \(\) => \{ 풀기\(\); if \(뿌리\)/.test(몸3) && /setAttribute\('inert', ''\)/.test(몸3) && /removeAttribute\('inert'\)/.test(몸3), '🛠 G793 점검막기화면 — 잠금 · 뒤 inert · 풀 때 둘 다 되돌림')
}

console.log('③ styles.css body 막이')
const 꼴 = 읽('styles.css')
봄(/\nbody \{ overflow-x: clip !important; overflow-y: visible !important; \}\n/.test(꼴), 'body { overflow-x: clip !important; overflow-y: visible !important; }')
봄(/html, body \{[\s\S]*?overflow-x: hidden;\n  overflow-x: clip;\n\}/.test(꼴), 'html, body 의 overflow-x: hidden → clip(옛 브라우저 대비) 그대로')
봄(!/\n\s*(html|body)[^{]*\{[^}]*overflow(-y)?:\s*(hidden|auto|scroll)\s*!important/.test(꼴), 'html · body 에 overflow hidden · auto · scroll !important 없음')

console.log('④ 굴림잠금 셈(가짜 문서)')
const 가짜 = (안폭, 바탕폭, 옛 = {}) => {
  globalThis.window = { innerWidth: 안폭 }
  globalThis.document = { documentElement: { clientWidth: 바탕폭, style: { overflow: 옛.o || '', scrollbarGutter: 옛.g || '' } } }
  return globalThis.document.documentElement.style
}
const { 굴림잠금, 잠긴수 } = await import('../web/src/lib/굴림잠금.js')
{
  const st = 가짜(1280, 1265)
  const 가 = 굴림잠금()
  봄(st.overflow === 'hidden' && st.scrollbarGutter === 'stable' && 잠긴수() === 1, 'PC(막대 15px) — overflow hidden · 막대 자리 stable')
  const 나 = 굴림잠금()
  봄(잠긴수() === 2 && st.overflow === 'hidden', '두 번째 창 — 그대로 잠김')
  가()
  봄(잠긴수() === 1 && st.overflow === 'hidden', '먼저 연 창을 먼저 닫음 — 아직 잠김(닫는 차례가 바뀌어도)')
  가()
  봄(잠긴수() === 1, '같은 풀기를 두 번 — 한 번만 셈')
  나()
  봄(잠긴수() === 0 && st.overflow === '' && st.scrollbarGutter === '', '마지막 창을 닫으면 풂 — 빈칸으로')
}
{
  const st = 가짜(393, 393)
  const 가 = 굴림잠금()
  봄(st.overflow === 'hidden' && st.scrollbarGutter === '', '폰(막대가 떠 있음) — 막대 자리 안 씀')
  가()
  봄(st.overflow === '' && 잠긴수() === 0, '폰 — 닫으면 풂')
}
{
  const st = 가짜(1280, 1265, { o: 'auto', g: 'auto' })
  const 가 = 굴림잠금(), 나 = 굴림잠금()
  나(); 가()
  봄(st.overflow === 'auto' && st.scrollbarGutter === 'auto' && 잠긴수() === 0, '원래 값(auto)이 있었으면 그 값으로 되돌림 · 나중 창 먼저 닫아도')
}
{
  const st = 가짜(1280, 1265)
  const 풀기들 = Array.from({ length: 5 }, () => 굴림잠금())
  ;[3, 0, 4, 1].forEach((i) => 풀기들[i]())
  봄(st.overflow === 'hidden' && 잠긴수() === 1, '다섯 겹 · 넷 닫음 — 아직 잠김')
  풀기들[2]()
  봄(st.overflow === '' && 잠긴수() === 0, '다섯째 닫음 — 풂')
}
{
  delete globalThis.document
  let 안터짐 = true
  try { const 풀 = 굴림잠금(); 풀() } catch (e) { 안터짐 = false }
  봄(안터짐, '문서 없는 곳(미리 굽기 · 노드)에서 불러도 안 터짐')
}

console.log(`\n${실패 ? '❌' : '✅'} 굴림잠금 ${통과}/${통과 + 실패}`)
process.exit(실패 ? 1 : 0)
