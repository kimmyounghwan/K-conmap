/**
 * 🧪 G822 (2026-11-21) 바로투찰은 «한 덩이» — 바로투찰(pages/BaroBid.jsx)이 부르는 파일 어디에도 lazy() 가 없어야 합니다.
 *   node tools/시험_바로투찰한덩이.mjs        (빌드 · 인터넷 · 플레이라이트 없이 — PC 올리기 시험에도 넣음)
 *
 *   왜: G166(2026-10-06) 「공고에서 바로투찰로 계산하기 누르면 계산기가 아예 안떠」 — 바로투찰 안 조각을 lazy() 로 «누를 때 받기» 하면
 *       화면을 열어 둔 채 배포가 지나간 뒤 누르는 순간 옛 조각 이름이 404 → 화면이 멈추거나(화면지킴) 쪽이 통째로 새로 고쳐져 넣던 금액이 사라짐.
 *       BaroBid.jsx 머리에 «바로투찰(첫 화면)에 lazy() 를 다시 넣지 마세요» 라고 적어 뒀는데도 G816 · G817(종심 성적표 · 모의 개찰)이
 *       종심카드.jsx 안에 lazy() 를 넣었음 → 11-21 소장님 「사이트 점검할때는 뻔한거 하지 말고 극한적으로 해」 점검에서 찾음(G822 에서 뺌).
 *   ① BaroBid.jsx 에서 import 로 이어지는 파일(./ · ../ 로 시작하는 .js · .jsx — 주석 뺌)을 모두 따라가 lazy( 0
 *   ② 따라간 파일 수가 너무 적지 않음(길 찾기가 깨져 «0 이라 통과» 하는 일 막기) · 종심카드 · 종심성적 · 종심모의 · 견본 없이도 이어짐
 *   ③ 일부러 넣어 봄 — lazy( 가 든 글은 잡고 · 주석 · 글자 줄 · lazyPage( 같은 다른 이름은 안 잡음
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const SRC = path.join(ROOT, 'web', 'src')

let bad = 0, n = 0
const ok = (이름, c, got) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (c || got === undefined ? '' : '\n      ' + [].concat(got).slice(0, 20).join('\n      '))) }

/* 주석 빼기 — 시험_화면글규칙.mjs 와 같은 꼴(글자 줄 ' " ` 안은 주석으로 안 봄 · «://» 주소는 남김) */
function 주석빼기(s) {
  let out = '', i = 0, 상태 = null
  const k = s.length
  while (i < k) {
    const c = s[i], d = s[i + 1]
    if (상태) {
      if (c === '\\') { out += c + (d || ''); i += 2; continue }
      if (c === 상태 || (상태 !== '`' && c === '\n')) 상태 = null
      out += c; i++; continue
    }
    if (c === '/' && d === '*') { const e = s.indexOf('*/', i + 2); const 끝 = e < 0 ? k : e + 2; out += s.slice(i, 끝).replace(/[^\n]/g, ' '); i = 끝; continue }
    if (c === '/' && d === '/' && s[i - 1] !== ':') { const e = s.indexOf('\n', i); const 끝 = e < 0 ? k : e; out += ' '.repeat(끝 - i); i = 끝; continue }
    if (c === "'" || c === '"' || c === '`') 상태 = c
    out += c; i++
  }
  return out
}
/* 글자 줄 안을 비움 — «'lazy('» 같은 글은 코드가 아님 */
const 글자비움 = (s) => s.replace(/'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\.|[^`\\])*`/g, (m) => m[0] + ' '.repeat(Math.max(0, m.length - 2)) + m[m.length - 1])
const lazy꼴 = /(?<![\w$가-힣])lazy\s*\(/

function 따라가기(시작) {
  const 본 = new Set(), 걸림 = [], 차례 = [시작]
  while (차례.length) {
    const f = 차례.shift()
    if (본.has(f)) continue
    본.add(f)
    let 원 = ''
    try { 원 = fs.readFileSync(f, 'utf8') } catch (e) { continue }
    const 코드 = 주석빼기(원)
    if (lazy꼴.test(글자비움(코드))) 걸림.push(path.relative(SRC, f).split(path.sep).join('/'))
    for (const m of 코드.matchAll(/(?:^|\n)\s*import\s+(?:[^'";]*?\s+from\s+)?['"](\.{1,2}\/[^'"]+)['"]/g)) {
      let p = path.resolve(path.dirname(f), m[1])
      if (!/\.(jsx?|mjs)$/.test(p)) { for (const e of ['.jsx', '.js', '/index.jsx', '/index.js']) { if (fs.existsSync(p + e)) { p = p + e; break } } }
      if (/\.(jsx?|mjs)$/.test(p) && fs.existsSync(p)) 차례.push(p)
    }
  }
  return { 본: [...본].map((f) => path.relative(SRC, f).split(path.sep).join('/')), 걸림 }
}

console.log('① 바로투찰(pages/BaroBid.jsx)이 부르는 파일 모두 — lazy( 0')
const { 본, 걸림 } = 따라가기(path.join(SRC, 'pages', 'BaroBid.jsx'))
ok(`따라간 파일 ${본.length}개 · lazy( 쓴 파일 0`, 걸림.length === 0, 걸림.map((f) => f + ' — lazy() 를 빼고 import 로(G166 · G822)'))

console.log('② 길 찾기가 제대로 도는지')
ok('따라간 파일 30개 넘음(길 찾기가 깨져 «0 이라 통과» 하지 않게)', 본.length > 30, 본.length)
ok('종심카드 · 종심성적 · 종심모의 · 종심개찰 · 금액입력이 따라간 파일에 있음', ['종심카드.jsx', '종심성적.jsx', '종심모의.jsx', '종심개찰.jsx', '금액입력.jsx'].every((f) => 본.includes(f)), 본.filter((f) => /종심|금액입력/.test(f)))

console.log('③ 일부러 넣어 봄')
const 잡을 = ["const 종심성적 = lazy(() => import('./종심성적.jsx'))", 'const 판 = React.lazy (() => import("./판.jsx"))', 'export const X = lazy(load)']
const 둘 = ["/* const 종심성적 = lazy(() => import('./종심성적.jsx')) */", "// lazy(() => import('./x.jsx'))", "const 말 = '바로투찰에 lazy() 를 넣지 마세요'", 'const P = lazyPage(() => import("./P.jsx"))', 'const 게으름lazy = 1']
ok(`lazy( 꼴 ${잡을.length}가지 잡음 · 주석 · 글자 줄 · lazyPage · 다른 이름은 안 잡음`,
  잡을.every((t) => lazy꼴.test(글자비움(주석빼기(t)))) && 둘.every((t) => !lazy꼴.test(글자비움(주석빼기(t)))),
  [...잡을.filter((t) => !lazy꼴.test(글자비움(주석빼기(t)))).map((t) => '못 잡음: ' + t), ...둘.filter((t) => lazy꼴.test(글자비움(주석빼기(t)))).map((t) => '잘못 잡음: ' + t)])

console.log(`\n${bad ? '✗' : '✓'} 시험_바로투찰한덩이 ${n - bad}/${n}`)
process.exit(bad ? 1 : 0)
