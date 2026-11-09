/**
 * 🧹 G520 화면 글 규칙 — 소장님이 «화면에 쓰지 말라» 하신 말이 사이트 어디에도 다시 안 들어가게(재발 막기)
 *   node tools/시험_화면글규칙.mjs        (인터넷 · 빌드 · 플레이라이트 없이 — PC 올리기 시험에도 넣음)
 *
 *   ① 「값만 다운 — 이건 기재하지마」(2026-10-25) — 엑셀은 원칙대로 값만 주되 «값만 · 수식 없음» 이라고 적지 않음
 *      (G518 견적틀 때 화면 글에서 처음 걸림 → G520 사이트 점검에서 도구 단추 · 안내 · 받는 파일 안 글 · 구운 장 · 도구 설명에 30곳 넘게 남은 것을 찾음)
 *   ② «클로드» 라는 말을 사이트 글에 넣지 말 것 — «건설맵» 으로(2026-10-16)
 *   ④ (코드 꼴) 잠깐 알림은 lib/잠깐말.js use잠깐말(ms) 로 — useEffect([말]) + setTimeout(() => set말(''), N) 꼴은 같은 글을 그 시간 안에 또 띄우면
 *      둘째 알림이 곧 사라짐(G588 일용 4대보험 시험에서 찾음 · G588b 에 남은 여섯 곳 고침 — PC 올리기마다 이 시험이 돌아 다시 못 들어옴)
 *   ⑤ (코드 꼴) 「PDF 도 변환 안되게」 · «엑셀은 그대로 · PDF 는 모두 그림»(2026-11-08) — 글자 PDF 로 찍는 길이 다시 안 생기게(G604):
 *      (가) 옛 글자 인쇄 훅 use인쇄(tools/공정인쇄.js)를 가져다 쓰는 파일 0 — G585 ~ G604 에 열아홉 곳 모두 use그림인쇄 로 바꿈
 *      (나) window.print() 를 부르는 파일은 «그림만 찍는 곳» 과 «아직 하나씩 바꾸는 남은 결과지» 목록에 있는 것만 — 새 파일이 부르면 걸림 ·
 *           남은 목록에 있는데 이제 안 부르면(바꿨으면) 목록에서 빼라고 걸림(목록이 늘 참말이게)
 *
 *   보는 곳: web/src 의 .js · .jsx(주석 빼고 — 화면 글 · 받는 파일 글 · 제목(title) 모두) · web/src/data 의 .json · prerender.py(# 줄 빼고)
 *            · web/index.html · web/public 의 .html
 *   ⚠️ 이용자가 «가져오는» 파일을 말하는 글은 괜찮음 — 예: «값만 남은 내역서(적산 프로그램이 내보낸 것)» · «값만 읽으므로» (우리 받기 글이 아님)
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))

let bad = 0, n = 0
const ok = (이름, c, got) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (c || got === undefined ? '' : '\n      ' + [].concat(got).slice(0, 40).join('\n      '))) }

/* 「값만 다운」 을 적은 말꼴 — 우리 받기 · 받은 파일을 두고 «값만 · 수식 없음» 을 말하는 꼴만 */
const 값만꼴 = [
  /값만\s*(든\s*)?(엑셀|파일)/,           // 값만 엑셀 · 값만 든 엑셀 · 값만 든 파일
  /엑셀\s*(받기)?\s*\(\s*값만/,            // 엑셀(값만) · 엑셀 받기(값만)
  /(?<!못한\s)수식\s*(은\s*)?없(음|습니다|이)/,   // 수식 없음 · 수식은 없습니다 · 수식 없이 (⚠️ «고치지 못한 수식은 없습니다»(2줄 변환 검산)는 다른 뜻)
  /값만\s*\(\s*수식/,                     // 값만(수식 …
  /셈한\s*(<b>\s*)?값만/,                  // 셈한 값만
  /보관용\s*값만/,
  /엑셀(은|에는|엔)\s*(<b>\s*)?값만/,      // 엑셀은 <b>값만</b> 담깁니다 · 엑셀에는 값만 (⚖ G583 만들 때 놓친 꼴 — 11-07 찾아 고침)
  /값만\s*(<\/b>\s*)?(담|들어\s*있)/,      // 값만 담깁니다 · 값만 들어 있습니다
]
const 클로드꼴 = /클로드/
/* 옛 자료 «클로드:» 머리를 «건설맵:» 으로 바꿔 읽는 코드(lib/골조.js · 부재일람표.js · Bim.jsx — 10-16 고침의 옛 저장값 잇기)는 화면 글이 아님 */
const 클로드괜찮음 = /startsWith\('클로드:'\)|\^\(클로드\|건설맵\)/

/* 주석 빼기 — JS · JSX: 덩이 주석(JSX 의 {/* *\/} 포함) · 줄 주석(«://» 주소는 남김)
   ⚠️ 글자 줄(' " `) 안은 주석으로 안 봄 — 처음엔 정규식 하나로 뺐다가 accept="image/*" 의 «/*» 를 주석 시작으로 보아
      Jimyeong.jsx 141~214줄을 통째로 빼 «📗 값만 엑셀» 단추를 못 잡았음(G520 만들 때 찾음). ' " 는 줄 끝에서 끊음(JSX 글의 낱 따옴표). */
function 주석빼기js(s) {
  let out = '', i = 0, 상태 = null
  const n = s.length
  while (i < n) {
    const c = s[i], d = s[i + 1]
    if (상태) {
      if (c === '\\') { out += c + (d || ''); i += 2; continue }
      if (c === 상태 || (상태 !== '`' && c === '\n')) 상태 = null
      out += c; i++; continue
    }
    if (c === '/' && d === '*') { const e = s.indexOf('*/', i + 2); const 끝 = e < 0 ? n : e + 2; out += s.slice(i, 끝).replace(/[^\n]/g, ' '); i = 끝; continue }
    if (c === '/' && d === '/' && s[i - 1] !== ':') { const e = s.indexOf('\n', i); const 끝 = e < 0 ? n : e; out += ' '.repeat(끝 - i); i = 끝; continue }
    if (c === "'" || c === '"' || c === '`') 상태 = c
    out += c; i++
  }
  return out
}
function 주석빼기py(s) { return s.split('\n').map((줄) => (/^\s*#/.test(줄) ? '' : 줄)).join('\n') }

function 파일들(곳, 끝들) {
  const out = []
  const 걷기 = (d) => {
    if (!fs.existsSync(d)) return
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name)
      if (e.isDirectory()) { if (!/node_modules|dist|\.git/.test(e.name)) 걷기(p) } else if (끝들.some((x) => e.name.endsWith(x))) out.push(p)
    }
  }
  걷기(path.join(ROOT, 곳))
  return out
}
function 찾기(목록, 빼기, 꼴들, 괜찮음 = null) {
  const 걸림 = []
  for (const f of 목록) {
    const 글 = 빼기(fs.readFileSync(f, 'utf8'))
    글.split('\n').forEach((줄, i) => {
      if (괜찮음 && 괜찮음.test(줄)) return
      for (const 꼴 of 꼴들) {
        const m = 줄.match(꼴)
        if (m) { 걸림.push(`${path.relative(ROOT, f)}:${i + 1}  …${줄.slice(Math.max(0, m.index - 30), m.index + 40).trim()}…`); break }
      }
    })
  }
  return 걸림
}

const js = 파일들('web/src', ['.js', '.jsx']).filter((f) => !f.includes(path.join('web', 'src', 'data') + path.sep))
const json = 파일들('web/src/data', ['.json'])
const html = [path.join(ROOT, 'web/index.html'), ...파일들('web/public', ['.html'])].filter((f) => fs.existsSync(f))
const py = [path.join(ROOT, 'prerender.py')]
const 그대로 = (s) => s

console.log(`① «값만 · 수식 없음» 을 화면 · 받는 파일에 적지 않음 (js ${js.length} · json ${json.length} · html ${html.length} · prerender.py)`)
ok('web/src 화면 · 받는 파일 글(주석 뺌)', !찾기(js, 주석빼기js, 값만꼴).length, 찾기(js, 주석빼기js, 값만꼴))
ok('web/src/data 도구 · 서식 설명', !찾기(json, 그대로, 값만꼴).length, 찾기(json, 그대로, 값만꼴))
ok('prerender.py 구운 장 글', !찾기(py, 주석빼기py, 값만꼴).length, 찾기(py, 주석빼기py, 값만꼴))
ok('web/index.html · web/public 의 .html', !찾기(html, 그대로, 값만꼴).length, 찾기(html, 그대로, 값만꼴))

console.log('② «클로드» 를 사이트 글에 넣지 않음')
ok('web/src 화면 글(주석 뺌)', !찾기(js, 주석빼기js, [클로드꼴], 클로드괜찮음).length, 찾기(js, 주석빼기js, [클로드꼴], 클로드괜찮음))
ok('web/src/data', !찾기(json, 그대로, [클로드꼴]).length, 찾기(json, 그대로, [클로드꼴]))
ok('prerender.py', !찾기(py, 주석빼기py, [클로드꼴]).length, 찾기(py, 주석빼기py, [클로드꼴]))
ok('web/index.html · web/public 의 .html', !찾기(html, 그대로, [클로드꼴]).length, 찾기(html, 그대로, [클로드꼴]))

console.log('③ 시험이 제대로 잡는지(일부러 넣어 봄)')
const 표본 = ['<button>📗 값만 엑셀 받기</button>', "title='종이와 같은 칸으로 · 값만(수식 없음)'", '📗 엑셀(값만)', '셈한 값이 든 엑셀입니다(수식 없음)', '보관용으로 셈한 <b>값만</b> 든 엑셀', '• 수식 없이 값만 들어 있습니다', '클로드가 만든 값', '<input accept="image/*" hidden />\n<button>📗 값만 엑셀</button>\n{/* 뒤 주석 */}', '<p>📗 · 📑 엑셀은 <b>값만</b> 담깁니다.</p>', '받은 엑셀에는 값만 들어 있습니다']
const 안걸릴 = ['<p>고치지 못한 수식은 없습니다. 그래도 합계는 확인</p>', '<li><b>값만 남은 내역서</b>(적산 프로그램이 내보낸 것)', '값만 읽으므로 새 엑셀은 우리 서식으로', '🟡 제안값만 확인하십시오', '/* 📗 값만 엑셀 — 주석 */ <b>엑셀 받기</b>', '// 클로드 주석', 'https://k-conmap.com // 주소 뒤 주석 클로드']
ok(`잡아야 할 꼴 ${표본.length}가지 모두 잡음(accept="image/*" 뒤 단추 · G583 «엑셀은 값만 담깁니다» 포함)`, 표본.every((t) => [...값만꼴, 클로드꼴].some((r) => r.test(주석빼기js(t)))), 표본.filter((t) => ![...값만꼴, 클로드꼴].some((r) => r.test(주석빼기js(t)))))
ok('괜찮은 글 · 주석은 안 잡음', 안걸릴.every((t) => ![...값만꼴, 클로드꼴].some((r) => r.test(주석빼기js(t)))), 안걸릴.filter((t) => [...값만꼴, 클로드꼴].some((r) => r.test(주석빼기js(t)))))

/* ④ 잠깐 알림 꼴 — 한 줄짜리 useEffect(() => { if (!말) return undefined; const t = setTimeout(() => set말(''), 4000) … }, [말]) (값이 글일 때만 · null · 새 물건은 늘 바뀌어 괜찮음) */
const 잠깐꼴 = /useEffect\(\s*\(\)\s*=>\s*\{\s*if\s*\(\s*!\s*[\w가-힣$]+\s*\)\s*return(\s+undefined)?\s*;?\s*const\s+\w+\s*=\s*setTimeout\(\s*\(\)\s*=>\s*set[\w가-힣$]*\(\s*(''|"")\s*\)/
console.log('④ 잠깐 알림은 use잠깐말 로(같은 알림을 그 시간 안에 또 띄워도 시간을 새로 셈)')
ok('web/src 코드(주석 뺌) — useEffect([말]) + setTimeout 꼴 없음', !찾기(js, 주석빼기js, [잠깐꼴]).length, 찾기(js, 주석빼기js, [잠깐꼴]))
const 잠깐표본 = ["  useEffect(() => { if (!말) return undefined; const t = setTimeout(() => set말0(''), 4000); return () => clearTimeout(t) }, [말])", "useEffect(() => { if (!알림) return; const t = setTimeout(() => set알림(''), 8000); return () => clearTimeout(t) }, [알림])"]
const 잠깐괜찮음 = ["    if (m) 시계.current = setTimeout(() => set말0(''), ms)", "set복사(r.id); setTimeout(() => set복사(''), 1500)", "useEffect(() => { if (!되돌림) return undefined; const t = setTimeout(() => set되돌림(null), 20000); return () => clearTimeout(t) }, [되돌림])", "/* useEffect(() => { if (!말) return undefined; const t = setTimeout(() => set말(''), 4000) }, [말]) */"]
ok(`잠깐 알림 옛 꼴 ${잠깐표본.length}가지 잡음 · 새 꼴 · 복사 표시 · null · 주석은 안 잡음`, 잠깐표본.every((x) => 잠깐꼴.test(주석빼기js(x))) && 잠깐괜찮음.every((x) => !잠깐꼴.test(주석빼기js(x))), [...잠깐표본.filter((x) => !잠깐꼴.test(주석빼기js(x))), ...잠깐괜찮음.filter((x) => 잠깐꼴.test(주석빼기js(x)))])

/* ⑤ 글자 PDF 길 막기 */
console.log('⑤ PDF · 인쇄는 그림으로 — 글자 인쇄 길이 다시 안 생기게')
const 상대 = (f) => path.relative(path.join(ROOT, 'web', 'src'), f).split(path.sep).join('/')
const 코드 = js.map((f) => ({ f: 상대(f), 글: 주석빼기js(fs.readFileSync(f, 'utf8')) }))
const 옛훅꼴 = /(?<![\w$가-힣])use인쇄(?![\w$가-힣])/   // ⚠️ \b 는 한글 뒤에서 안 맞음(«use인쇄(» 를 놓침) — 앞뒤 글자를 따로 봄
const 그림만 = ['tools/그림인쇄훅.js', 'tools/서식작성.jsx', 'tools/격자작성.jsx', 'tools/공정인쇄.js']   // 그림을 찍는 곳 · 옛 훅 파일(쓰는 곳 0 — 가)
const 남은 = ['pages/Forms.jsx', 'pages/Golgo.jsx', 'pages/JeoksanAuto.jsx', 'pages/Magam.jsx',
  '엑셀화면.jsx']   // 아직 글자로 찍는 결과지 — 바꿀 때마다 여기서 뺌
const 옛훅 = 코드.filter((x) => x.f !== 'tools/공정인쇄.js' && !남은.includes(x.f) && 옛훅꼴.test(x.글)).map((x) => x.f)
ok('(가) 옛 글자 인쇄 훅 use인쇄 를 쓰는 파일 0 (남은 결과지 빼고 모두 use그림인쇄)', !옛훅.length, 옛훅)
const 부름 = 코드.filter((x) => /window\.print\s*\(/.test(x.글)).map((x) => x.f)
const 새로부름 = 부름.filter((f) => !그림만.includes(f) && !남은.includes(f))
ok(`(나) window.print() 는 그림 찍는 곳 ${그림만.length} · 남은 결과지 ${남은.length} 에만 — 새로 부르는 파일 0`, !새로부름.length, 새로부름)
const 이제안부름 = 남은.filter((f) => !부름.includes(f))
ok('(나) 남은 목록이 참말 — 바꾼 파일은 목록에서 뺐음', !이제안부름.length, 이제안부름.map((f) => f + ' — 이제 window.print 를 안 부름 → 남은 목록에서 빼십시오'))
const 훅표본 = ["import { use인쇄 } from './공정인쇄.js'", "  const [인쇄중, 인쇄] = use인쇄(`청구서_${달}`)", 'const x = use인쇄;']
const 훅괜찮음 = ["import { use그림인쇄 } from './그림인쇄훅.js'", '/* 옛 use인쇄 → use그림인쇄 */ const 그 = use그림인쇄(이름)', "// use인쇄 는 이제 안 씀", 'const 내use인쇄훅 = 1']
ok(`(가) 옛 훅 꼴 ${훅표본.length}가지 잡음 · use그림인쇄 · 주석 · 다른 이름은 안 잡음`, 훅표본.every((x) => 옛훅꼴.test(주석빼기js(x))) && 훅괜찮음.every((x) => !옛훅꼴.test(주석빼기js(x))), [...훅표본.filter((x) => !옛훅꼴.test(주석빼기js(x))), ...훅괜찮음.filter((x) => 옛훅꼴.test(주석빼기js(x)))])

console.log(`\n${bad ? '✗' : '✓'} 시험_화면글규칙 ${n - bad}/${n}`)
process.exit(bad ? 1 : 0)
