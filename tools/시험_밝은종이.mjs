/**
 * 🩹 G770 밝은 종이 — 그림 PDF · 인쇄 그림 찍기 길(lib/그림인쇄.js)이 «다크 모드 기기에서도 흰 종이» 손질을 늘 거치는지 (node · PC 올리기 시험 · 2026-11-18)
 *   node tools/시험_밝은종이.mjs
 *   소장님 11-18 아이폰 캡처(낙찰 뒤 할 일 PDF) 「이상하지 않아 PDF . 점점해 줘」 → 「고치면 항상 업데이트 표시하고, 내용도 기재 해 줘」
 *   ① 밝은종이 — 어두운 규칙 지움(@media 안 · @supports 안 · 뒤에서부터 · 못 지우면 not all) · 밝은 판 표 · 숫자 꼴 보통 · 날짜 · 시각 칸 → 글 칸
 *   ② 찍기 두 길(종이찍기 · 인쇄판찍기)이 모두 부름 · html2canvas 를 부르는 곳은 lib/그림인쇄.js 두 곳뿐(새 찍기 길이 생기면 여기서 잡음)
 *   ③ 화면 시험(클라우드 — tools/시험_밝은종이화면.mjs)이 있음 · fixes.json 에 «다크 모드» 고침 줄(낙찰 뒤 할 일)
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const 읽 = (...p) => fs.readFileSync(path.join(ROOT, 'web', ...p), 'utf8').replace(/\r\n/g, '\n')   /* PC git(autocrlf)은 CRLF — LF 로 맞춰 봄(G770 PC 첫 올림이 여기서 멈췄음) */
let 좋음 = 0, 나쁨 = 0
const 봐 = (참, 이름, 더) => { if (참) { 좋음++; console.log('  ✓ ' + 이름) } else { 나쁨++; console.log('  ✗ ' + 이름 + (더 === undefined ? '' : ' = ' + JSON.stringify(더).slice(0, 300))) } }

console.log('① 밝은종이(lib/그림인쇄.js)')
const 글 = 읽('src', 'lib', '그림인쇄.js')
const a = 글.indexOf('export function 밝은종이(doc)'), z = 글.indexOf('\n  return 지움\n}', a)
const 몸 = a > 0 && z > a ? 글.slice(a, z) : ''
봐(!!몸, 'export function 밝은종이(doc) 있음')
봐(/const 어두운규칙 = \/prefers-color-scheme\\s\*:\\s\*dark\/i/.test(글), '어두운 규칙 = prefers-color-scheme: dark(띄어쓰기 달라도)')
봐(/for \(let i = list\.length - 1; i >= 0; i--\)/.test(몸) && /판\.deleteRule\(i\)/.test(몸) && /r\.media\.mediaText = 'not all'/.test(몸), '뒤에서부터 지움(차례 안 밀림) · 못 지우면 not all')
봐(/r\.type === 4/.test(몸) && /걷기\(r, r\.cssRules\)/.test(몸) && /r\.type === 12 && r\.cssRules/.test(몸), '@media 안 · @supports 안까지 걸음')
봐(/setAttribute\('data-theme', 'light'\)/.test(몸) && /style\.colorScheme = 'light'/.test(몸), '밝은 판 표(data-theme · color-scheme)')
봐(/font-variant-numeric: normal !important; font-feature-settings: normal !important;/.test(몸), '숫자 꼴 보통(tabular-nums · tnum — 그림 그리개와 같은 폭)')
봐(/\/\^\(date\|time\|month\|week\|datetime-local\)\$\/\.test\(i\.type\)/.test(몸) && /i\.type = 'text'; i\.value = v/.test(몸), '날짜 · 시각 칸 → 글 칸(값 그대로)')

console.log('② 찍기 두 길이 모두 부름')
봐(/html2canvas\(el, \{[^\n]*onclone: \(doc\) => \{ 밝은종이\(doc\) \}/.test(글), '종이찍기(안전 웹 서식) — onclone 에서 밝은종이')
const 펴 = 글.indexOf('const 펴기 = (doc) => {')
봐(펴 > 0 && /^\s*밝은종이\(doc\)/.test(글.slice(펴 + 'const 펴기 = (doc) => {'.length, 펴 + 200)), '인쇄판찍기(도구 · 적산 · 서식 미리보기) — 펴기 첫 줄에서 밝은종이(복제본마다)')
/* html2canvas 를 부르는 곳 — lib/그림인쇄.js 두 곳뿐(새로 생기면 밝은종이를 부르는지 봐야 함) */
const 부른곳 = []
const 걷기 = (d) => { for (const n of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, n.name); if (n.isDirectory()) { if (n.name !== 'node_modules') 걷기(p) } else if (/\.(js|jsx|mjs)$/.test(n.name)) { const s = fs.readFileSync(p, 'utf8'); const k = (s.match(/import\(['"]html2canvas['"]\)|from ['"]html2canvas['"]/g) || []).length; if (k) 부른곳.push([path.relative(path.join(ROOT, 'web', 'src'), p), k]) } } }
걷기(path.join(ROOT, 'web', 'src'))
봐(부른곳.length === 1 && 부른곳[0][0] === path.join('lib', '그림인쇄.js') && 부른곳[0][1] === 2, 'html2canvas 를 부르는 곳 = lib/그림인쇄.js 두 곳뿐(새 찍기 길은 밝은종이를 꼭 부를 것)', 부른곳)

console.log('③ 화면 시험 · 업데이트 표')
봐(fs.existsSync(path.join(ROOT, 'tools', '시험_밝은종이화면.mjs')), '화면 시험 tools/시험_밝은종이화면.mjs(클라우드 — 다크 · 밝은 화면 PDF 같음)')
const FX = JSON.parse(읽('public', 'fixes.json'))
봐((FX.r || []).some((x) => x.p === '/tools/after-award' && /다크 모드/.test(x.m)), 'fixes.json — 낙찰 뒤 할 일에 «다크 모드» 고침 줄(소장님 「고치면 항상 업데이트 표시하고, 내용도 기재 해 줘」)')

console.log(나쁨 ? `\n❌ 시험_밝은종이 ${좋음}/${좋음 + 나쁨}` : `\n✅ 시험_밝은종이 ${좋음}/${좋음}`)
process.exit(나쁨 ? 1 : 0)
