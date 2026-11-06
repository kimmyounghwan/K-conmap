/**
 * 💬 이 도구 이야기 시험 — node tools/시험_도구이야기.mjs
 *   제목 · 본문 꼴(맵톡 규칙: 제목 2 ~ 80자 · 본문 2,000자) · 그 도구 글 가리기 · 도구 쪽에 붙음(Tools.jsx) · 칸을 새로 안 만듦(규칙 그대로)
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
const 여기 = path.dirname(fileURLToPath(import.meta.url))
const 뿌리 = path.join(여기, '..')
const { 이야기머리, 그도구글, 이야기제목, 이야기본문 } = await import(pathToFileURL(path.join(뿌리, 'web', 'src', 'lib', '도구이야기.js')).href)
const { 갈래떼기 } = await import(pathToFileURL(path.join(뿌리, 'web', 'src', 'lib', '말머리.js')).href)

let bad = 0
const ok = (이름, c, got) => { if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (got !== undefined && !c ? ' = ' + JSON.stringify(got) : '')) }

console.log('① 제목 · 본문 꼴')
const t1 = 이야기제목('토적컨맵', '측점 간격이 50 인데 20 으로 나와요')
ok('제목 = «[후기·건의] 토적컨맵 · 첫 줄»', t1 === '[후기·건의] 토적컨맵 · 측점 간격이 50 인데 20 으로 나와요', t1)
ok('맵톡에서 갈래 «후기·건의» · 제목은 «토적컨맵 · …»', 갈래떼기(t1).c === '후기·건의' && 갈래떼기(t1).t.startsWith('토적컨맵 · '))
const 긴 = 이야기제목('토량환산계수(L·C) 환산기', '가'.repeat(200))
ok('긴 첫 줄도 제목 80자 안(규칙 t ≤ 80)', 긴.length <= 80 && 긴.length >= 2, 긴.length)
const b1 = 이야기본문('L 값은 어디서 보나요?', '토적컨맵', '/tools/tojeok')
ok('본문 끝에 «🧰 토적컨맵 — k-conmap.com/tools/tojeok»', b1.endsWith('\n\n🧰 토적컨맵 — k-conmap.com/tools/tojeok') && b1.startsWith('L 값은'), b1)
ok('긴 본문도 2,000자 안(꼬리는 그대로)', 이야기본문('가'.repeat(5000), '토적컨맵', '/tools/tojeok').length === 2000 && 이야기본문('가'.repeat(5000), '토적컨맵', '/tools/tojeok').endsWith('/tools/tojeok'))
ok('주소가 없으면 꼬리 없음', 이야기본문('본문', '도구', '') === '본문')

console.log('② 그 도구 글 가리기')
ok('제 도구 글 → 참', 그도구글(t1, '토적컨맵'))
ok('다른 도구 · 이름 일부만 같은 것 · 보통 글 → 거짓', !그도구글(t1, '토적') && !그도구글('[후기·건의] 토적컨맵이 좋아요', '토적컨맵') && !그도구글('[K-건설맵] 📢 공지', '토적컨맵'))
ok('머리 = 이름 24자까지 + « · »', 이야기머리('토적컨맵') === '토적컨맵 · ' && 이야기머리('가'.repeat(30)).length === 27)

console.log('③ 도구 쪽에 붙음 · 규칙 그대로')
const 툴 = fs.readFileSync(path.join(뿌리, 'web', 'src', 'pages', 'Tools.jsx'), 'utf-8')
ok('Tools.jsx 도구 쪽(계산기 있는 쪽)에 <도구이야기 이름 · 주소>', /\{Calc && <도구이야기 이름=\{String\(t\.title \|\| ''\)\.split\(' — '\)\[0\]\} 주소=\{`\/tools\/\$\{t\.slug\}`\} \/>\}/.test(툴))
const 화면 = fs.readFileSync(path.join(뿌리, 'web', 'src', '도구이야기.jsx'), 'utf-8')
ok('글은 qna 에 맵톡과 같은 칸만(t · b · nick · uid · at · 몰래표) — 새 칸 없음', /t: 이야기제목\(이름, t\),\s*\n\s*b: 이야기본문\(b, 이름, 주소\),\s*\n\s*nick: nickOf\(user\.uid\)\.slice\(0, 20\),\s*\n\s*uid: user\.uid,\s*\n\s*at: Date\.now\(\),\s*\n\s*\.\.\.\(await 몰래표\(\)\),/.test(화면))
ok('읽기는 누를 때만(📜 이 도구 이야기 보기) — 쪽을 열 때 받지 않음', /onClick=\{읽기\}>📜 이 도구 이야기 보기/.test(화면) && !/useEffect/.test(화면))

console.log(bad ? '✗ 틀림 ' + bad : '✓ 모두 맞음')
process.exit(bad ? 1 : 0)
