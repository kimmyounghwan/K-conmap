/**
 * 🔢 G771 서식 가짓수 — 서식을 올리면 사이트에 적힌 «서식 몇 가지» 도 맞게 바뀌는지 (node · PC 올리기 시험 · 2026-11-18)
 *   node tools/시험_서식가짓수.mjs
 *   소장님 11-18 「서식 302가지 —- 서식이 올라가면 바뀌어야 하는거 아니야?? 점검해줘」
 *     → /forms 머리 숫자는 목록(forms.json + forms_orig.json)에서 저절로 셈(반영 전이라 302 · 반영되면 306) ·
 *       대신 «보는 방법»(pages/How.jsx) · 소개(public/about.html) 에 «190여 가지» 가 남아 있었음 → «300여 가지»
 *   ① 실제 가짓수 N = forms.json + forms_orig.json (Forms.jsx 와 같은 셈)
 *   ② /forms 머리 · «갈래별로 전부 보기» 숫자는 셈({FORMS.length + ORIG.length}) — 손으로 박은 숫자 아님
 *   ③ 화면 글(주석 뺌) · public/*.html 의 «서식 · 양식 … N여 가지» = N 의 백 단위(302 → 300) · «서식 NNN가지» 처럼 세 자리 숫자를 박지 않음
 *      (서식이 400 가지가 되면 여기서 잡힘 → «400여 가지» 로 고칠 것)
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const 웹 = (...p) => path.join(ROOT, 'web', ...p)
const 읽 = (p) => fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n')   /* PC git(autocrlf)은 CRLF — LF 로 맞춰 봄 */
let 좋음 = 0, 나쁨 = 0
const 봐 = (참, 이름, 더) => { if (참) { 좋음++; console.log('  ✓ ' + 이름) } else { 나쁨++; console.log('  ✗ ' + 이름 + (더 === undefined ? '' : ' = ' + JSON.stringify(더).slice(0, 400))) } }

console.log('① 실제 가짓수')
const 새 = JSON.parse(읽(웹('src', 'data', 'forms.json'))).forms || []
const 옛 = JSON.parse(읽(웹('src', 'data', 'forms_orig.json'))).forms || []
const N = 새.length + 옛.length
const 백 = Math.floor(N / 100) * 100
봐(N >= 100 && 새.every((f) => f && f.slug) && 옛.every((f) => f && f.slug), `서식 ${N}가지(새 ${새.length} + 원본 ${옛.length}) → «${백}여 가지»`)
const 슬 = [...새, ...옛].map((f) => f.slug)
봐(new Set(슬).size === 슬.length, '같은 slug 두 번 없음(한 서식을 두 번 세지 않음)', 슬.filter((s, i) => 슬.indexOf(s) !== i))

console.log('② /forms 숫자는 셈')
const 폼 = 읽(웹('src', 'pages', 'Forms.jsx'))
봐(/const FORMS = DATA\.forms \|\| \[\]/.test(폼) && /const ORIG = ORIG_DATA\.forms \|\| \[\]/.test(폼), 'Forms.jsx — FORMS = forms.json · ORIG = forms_orig.json')
봐((폼.match(/\{FORMS\.length \+ ORIG\.length\}가지/g) || []).length === 2, '머리 «서식 N가지» · «갈래별로 전부 보기 — N가지» 둘 다 셈')

console.log('③ 적어 둔 «N여 가지» · 박은 숫자')
const 주석뺌 = (s) => s.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' ')).replace(/(^|[^:])\/\/.*$/gm, '$1').replace(/\{\s*\}/g, '')
const 파일들 = []
const 걷기 = (d) => {
  for (const n of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, n.name)
    if (n.isDirectory()) { if (!['node_modules', 'data'].includes(n.name)) 걷기(p) } else if (/\.(jsx|js)$/.test(n.name)) 파일들.push(p)
  }
}
걷기(웹('src'))
for (const n of fs.readdirSync(웹('public'))) if (/\.html$/.test(n)) 파일들.push(웹('public', n))
if (fs.existsSync(웹('index.html'))) 파일들.push(웹('index.html'))
const 틀린여 = [], 박음 = [], 맞은여 = []
const 꼴 = /(서식|양식)((?:(?!가지)[^\n]){0,40}?)(\d{2,4})(여)? ?가지/g
for (const p of 파일들) {
  const 글 = /\.html$/.test(p) ? 읽(p) : 주석뺌(읽(p))
  const 줄들 = 글.split('\n')
  줄들.forEach((줄, i) => {
    for (const m of 줄.matchAll(꼴)) {
      const 수 = Number(m[3]), 곳 = `${path.relative(ROOT, p)}:${i + 1} «${m[0].slice(0, 60)}»`
      if (m[4]) { if (수 >= 100) (수 === 백 ? 맞은여 : 틀린여).push(곳) } else if (수 >= 100) 박음.push(곳)
    }
  })
}
봐(맞은여.length >= 4, `«${백}여 가지» 가 보는 방법 · 소개에 있음(${맞은여.length}곳)`, 맞은여)
봐(틀린여.length === 0, `«서식 … N여 가지» 가 모두 ${백} (실제 ${N}) — 다르면 «${백}여 가지» 로 고칠 것`, 틀린여)
봐(박음.length === 0, '화면 글에 «서식 NNN가지» 처럼 세 자리 숫자를 박지 않음(셈으로 · 또는 «~여 가지»)', 박음)
const 방법 = 읽(웹('src', 'pages', 'How.jsx')), 소개 = 읽(웹('public', 'about.html'))
봐(방법.includes(`일반 양식 ${백}여 가지.`) && 방법.includes(`<b>건설 서식</b> ${백}여 가지는`), `pages/How.jsx(보는 방법) 두 곳 = ${백}여 가지`)
봐(소개.includes(`일반 양식 ${백}여 가지 —`) && 소개.includes(`<b>건설 서식</b> ${백}여 가지는`), `public/about.html(소개) 두 곳 = ${백}여 가지`)

console.log(나쁨 ? `\n❌ 시험_서식가짓수 ${좋음}/${좋음 + 나쁨}` : `\n✅ 시험_서식가짓수 ${좋음}/${좋음}`)
process.exit(나쁨 ? 1 : 0)
