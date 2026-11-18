/**
 * 🆕 G757 업그레이드 알리기 시험 — lib/고친것셈.js · public/fixes.json · 화면 자리(인터넷 · node_modules 없이 · PC 올리기에도)
 *   ① 칸 주소(lib/마이쓴곳.js 셀 주소와 같은 칸 · 속 화면 → 그 칸)
 *   ② 때(«YYYY-MM-DD HH:MM» 한국 → ms · 없는 날 · 틀린 꼴은 NaN)
 *   ③ 요즘 — 14일 안 · 미리 적은 시각은 «지금 + 하루» 까지 · 틀린 줄 버림 · 새것부터
 *   ④ 이곳 · 표칸   ⑤ 닫기 · 닫았나(새 줄이 생기면 다시 보임 · 30일 지난 것 정리 · 저장소가 없어도 안 넘어짐)
 *   ⑥ public/fixes.json — 꼴 · 칸 주소 · 있는 화면 · 시각 · 새것부터 · 글 길이(알림 40자) · 금지 말
 *   ⑦ 화면 자리 — App.jsx(길 줄 바로 아래 · 씀-앞 밖) · 도구 · 서식 · 마이컨맵 «UP» · 쓴수판 · 스타일 · 알림 함수(G222) 그대로
 *   ⑧ 자가시험 — 일부러 틀린 줄을 넣어 ⑥ 검사가 잡는지
 *   ⑨ 🩹 G767 자료 주소 — 판(빌드 도장)을 붙여 받음(올리면 바로 새 띠 · UP — 전엔 브라우저 1시간 기억으로 최대 1시간 늦음)
 *   ⑦ 🔁 G767 띠 → «UP» 단추(누르면 업데이트 내용 창) · 화면 안은 제목 옆 · 빨간 «새로» 표 없음
 * 쓰는 법: node tools/시험_고친것.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const 웹 = (...p) => path.join(ROOT, 'web', ...p)
const 읽 = (...p) => fs.readFileSync(웹(...p), 'utf8')
const L = await import(pathToFileURL(웹('src', 'lib', '고친것셈.js')).href)
const 쓴곳 = await import(pathToFileURL(웹('src', 'lib', '마이쓴곳.js')).href)
let 좋음 = 0, 나쁨 = 0
const 봐 = (ok, 말, 덧) => { if (ok) { 좋음++; console.log('  ✓ ' + 말) } else { 나쁨++; console.log('  ✗ ' + 말 + (덧 === undefined ? '' : ' = ' + JSON.stringify(덧))) } }
const 같 = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const 하루 = 86400e3
const 한국 = (s) => L.때(s)

console.log('① 칸 주소')
for (const [p, c] of [['/tools/sajincad', '/tools/sajincad'], ['/tools/tuipbi/v/abc', '/tools/tuipbi'], ['/forms/a-1?x=1#y', '/forms/a-1'], ['/change', '/change'],
  ['/change/twoline/', '/change/twoline'], ['/jeoksan/run/3', '/jeoksan/run'], ['/safety', '/safety'], ['/safety/x', '/safety'], ['/guide/x/y', '/guide/x'], ['/cad/fix', '/cad/fix']]) {
  봐(L.칸으로(p) === c, `${p} → ${c}`, L.칸으로(p))
}
for (const p of ['/', '/tools', '/forms', '/guide', '/toolsx/a', '/cadfoo', '/live', '/map/전남', '', null]) 봐(L.칸으로(p) === '', `${p} → 칸 아님`, L.칸으로(p))
const 셀들 = ['/tools/a', '/forms/b', '/change', '/change/c', '/naeyeok', '/naeyeok/d', '/jeoksan', '/jeoksan/e', '/cad', '/cad/f', '/safety', '/pdf', '/lic', '/guide/g', '/tools', '/x', '/tools/a/b']
봐(셀들.every((p) => (L.칸으로(p) === p) === 쓴곳.셀주소(p)), '마이쓴곳 셀 주소와 같은 칸(알림 함수가 쓴 화면 목록과 맞춤)', 셀들.filter((p) => (L.칸으로(p) === p) !== 쓴곳.셀주소(p)))

console.log('② 때')
봐(한국('2026-11-18 09:00') === Date.UTC(2026, 10, 18, 0, 0), '한국 09:00 = UTC 00:00')
봐(한국('2026-01-01 03:30') === Date.UTC(2025, 11, 31, 18, 30), '해 넘김(한국 새벽 = UTC 전날)')
for (const s of ['2026-11-18', '2026-11-18 9:00', '2026-02-30 10:00', '2026-11-18 24:00', '2026-11-18 10:60', '', null, '2026/11/18 10:00']) 봐(Number.isNaN(한국(s)), `«${s}» → NaN`)

console.log('③ 요즘')
const 지금 = Date.UTC(2026, 10, 18, 1, 0)   // 한국 11-18 10:00
const 줄 = (p, d, m = '좋아짐') => ({ p, d, m })
const 목록 = { r: [줄('/tools/a', '2026-11-04 10:01'), 줄('/tools/b', '2026-11-04 10:00'), 줄('/tools/c', '2026-11-19 09:59'), 줄('/tools/d', '2026-11-19 10:01'),
  줄('/tools/e', '2026-11-17 13:55'), 줄('/tools', '2026-11-17 13:00'), 줄('/tools/f', '2026-11-17 12:00', '  '), 줄('/tools/g', '11-17 12:00'), 줄('/forms/h', '2026-11-18 08:00')] }
const 요 = L.요즘(목록, 지금)
봐(같(요.map((x) => x.p), ['/tools/c', '/forms/h', '/tools/e', '/tools/a']), '14일 안(13일 23시간 59분은 안 · 14일 꼭 되면 밖) · 미리 적은 23시간 59분 뒤까지 · 새것부터', 요.map((x) => x.p))
봐(!요.some((x) => ['/tools', '/tools/f', '/tools/g', '/tools/d', '/tools/b'].includes(x.p)), '칸 아닌 주소 · 빈 글 · 틀린 시각 · 하루 넘게 뒤 · 14일 지난 줄 버림')
봐(같(L.요즘([줄('/tools/e', '2026-11-17 13:55')], 지금).length, 1) && L.요즘(null, 지금).length === 0 && L.요즘({}, 지금).length === 0 && L.요즘({ r: 'x' }, 지금).length === 0, '배열 · null · 빈 것 · 틀린 꼴도 넘어지지 않음')
봐(L.요즘({ r: [{ p: '/tools/z', d: '2026-11-18 08:00', m: ' 띄어 쓴 글 ' }] }, 지금)[0].m === '띄어 쓴 글', '글 앞뒤 빈칸 뗌')

console.log('④ 이곳 · 표칸')
봐(같(L.이곳(요, '/tools/e/v/1').map((x) => x.p), ['/tools/e']) && L.이곳(요, '/live').length === 0 && L.이곳(요, '/tools').length === 0, '속 화면도 그 칸 · 칸 아닌 곳은 없음')
const 둘 = L.요즘({ r: [줄('/tools/e', '2026-11-10 10:00', '옛 것'), 줄('/tools/e', '2026-11-17 13:55', '새 것')] }, 지금)
봐(같(L.이곳(둘, '/tools/e').map((x) => x.m), ['새 것', '옛 것']), '같은 화면 둘 — 새것이 앞')
봐(같([...L.표칸(요)].sort(), ['/forms/h', '/tools/a', '/tools/c', '/tools/e']), '표칸 = 요즘 줄의 칸')

console.log('⑤ 닫기 · 닫았나')
const 가짜 = new Map()
globalThis.localStorage = { getItem: (k) => (가짜.has(k) ? 가짜.get(k) : null), setItem: (k, v) => 가짜.set(k, String(v)), removeItem: (k) => 가짜.delete(k) }
봐(!L.닫았나(둘), '처음엔 안 닫힘')
L.닫기(둘, 지금)
봐(L.닫았나(둘), '✕ 뒤 닫힘')
const 셋 = L.요즘({ r: [줄('/tools/e', '2026-11-18 09:30', '더 새 것'), 줄('/tools/e', '2026-11-10 10:00', '옛 것'), 줄('/tools/e', '2026-11-17 13:55', '새 것')] }, 지금)
봐(!L.닫았나(셋), '새로 고친 줄이 생기면 다시 보임')
봐(L.닫았나([셋[1], 셋[2]]) && L.닫았나([셋[2]]), '그때 보이던 줄은 모두 닫힘(옛 줄이 이어서 뜨지 않음)')
L.닫기([줄('/tools/q', '2026-11-18 09:00')], 지금 + 31 * 하루)
const 저장 = JSON.parse(가짜.get(L.닫음열쇠))
봐(Object.keys(저장).length === 1 && 저장['/tools/q|2026-11-18 09:00'], '30일 지난 닫음은 정리', Object.keys(저장))
가짜.set(L.닫음열쇠, '{깨진')
봐(!L.닫았나(셋) && (L.닫기(셋, 지금), L.닫았나(셋)), '깨진 저장 값도 넘어지지 않고 새로 씀')
globalThis.localStorage = { getItem: () => { throw new Error('막힘') }, setItem: () => { throw new Error('막힘') } }
let 안넘어짐 = true
try { L.닫기(셋, 지금); L.닫았나(셋) } catch (e) { 안넘어짐 = false }
봐(안넘어짐 && !L.닫았나(셋), '저장소가 막혀도(개인 창) 넘어지지 않음')
delete globalThis.localStorage

console.log('⑥ public/fixes.json')
const 원글 = fs.readFileSync(웹('public', 'fixes.json'))
봐(!(원글[0] === 0xef && 원글[1] === 0xbb), 'BOM 없음')
let FX = null
try { FX = JSON.parse(원글.toString('utf8')) } catch (e) { FX = null }
봐(!!FX && FX.v === 1 && Array.isArray(FX.r) && FX.r.length > 0, 'JSON · v 1 · r 목록')
const 메인 = 읽('src', 'main.jsx')
const 도구슬 = new Set((JSON.parse(읽('src', 'data', 'tools.json')).tools || []).map((t) => t.slug))
const 서식슬 = new Set([...(JSON.parse(읽('src', 'data', 'forms.json')).forms || []), ...(JSON.parse(읽('src', 'data', 'forms_orig.json')).forms || [])].map((f) => f.slug))
const 금지 = /무료|클로드|Claude/   /* 실제 이름 · 상호는 올리기 전 이름 검사(커밋 전)가 따로 봄 — 이 파일(공개 저장소)엔 그 목록을 적지 않음 */
function 줄검사(r, 지금ms = Date.now()) {
  const 틀림 = []
  const 본 = new Set()
  let 앞t = Infinity
  for (const [i, x] of (r || []).entries()) {
    const 이름 = `${i + 1}째 ${x && x.p}`
    if (!x || typeof x.p !== 'string' || L.칸으로(x.p) !== x.p) { 틀림.push(이름 + ' 칸 주소 아님'); continue }
    const 있음 = 메인.includes(`path="${x.p}"`) || (/^\/tools\/[^/]+$/.test(x.p) && 도구슬.has(x.p.slice(7))) || (/^\/forms\/[^/]+$/.test(x.p) && 서식슬.has(x.p.slice(7)))
    if (!있음) 틀림.push(이름 + ' 없는 화면')
    const t = L.때(x.d)
    if (!Number.isFinite(t)) 틀림.push(이름 + ' 시각 꼴')
    else if (t > 지금ms + 하루) 틀림.push(이름 + ' 하루 넘게 뒤 시각')
    else if (t > 앞t) 틀림.push(이름 + ' 새것부터가 아님')
    if (Number.isFinite(t)) 앞t = t
    if (typeof x.m !== 'string' || !x.m.trim()) 틀림.push(이름 + ' 글 없음')
    else if ([...x.m.trim()].length > 40) 틀림.push(이름 + ' 글 40자 넘음(알림이 자름)')
    if (금지.test(String(x.m || '') + String(x.p || ''))) 틀림.push(이름 + ' 금지 말')
    const 열쇠 = x.p + '|' + x.d
    if (본.has(열쇠)) 틀림.push(이름 + ' 같은 줄 두 번')
    본.add(열쇠)
    const 남는칸 = Object.keys(x).filter((k) => !['p', 'd', 'm'].includes(k))
    if (남는칸.length) 틀림.push(이름 + ' 모르는 칸 ' + 남는칸.join(','))
  }
  return 틀림
}
const 틀린줄 = FX ? 줄검사(FX.r) : ['읽지 못함']
봐(틀린줄.length === 0, `줄 ${FX ? FX.r.length : 0}개 — 칸 주소 · 있는 화면 · 시각 · 새것부터 · 40자 · 금지 말 · 겹침 없음`, 틀린줄)
봐(!!FX && typeof FX._설명 === 'string' && /업그레이드/.test(FX._설명) && /UP/.test(FX._설명) && /알림/.test(FX._설명), '_설명 — 세 곳(띠 · UP · 알림) 적혀 있음')

console.log('⑦ 화면 자리')
const 앱 = 읽('src', 'App.jsx')
const 길줄 = 앱.indexOf('<Crumbs />'), 띠자리 = 앱.indexOf('<고친띠 />'), 씀앞 = 앱.indexOf('<span id="씀-앞" hidden />')
봐(길줄 > 0 && 띠자리 > 길줄 && 띠자리 < 씀앞 && !/<[A-Za-z가-힣]/.test(앱.slice(길줄 + 10, 띠자리).replace(/\{\/\*[\s\S]*?\*\/\}/g, '')), 'App.jsx — 길 줄(Crumbs) 바로 아래 · 씀-앞 밖', [길줄, 띠자리, 씀앞])
봐(/import 고친띠 from '\.\/고친띠\.jsx'/.test(앱), 'App.jsx 가 고친띠를 부름')
const 띠 = 읽('src', '고친띠.jsx')
봐(!/noti-band upg/.test(띠) && /세기\('\|업그레이드\|보임'\)/.test(띠) && /세기\('\|업그레이드\|단추'\)/.test(띠) && /로봇/.test(띠), 'G767 — 띠 없음 · 셈 둘(보임 · 단추) · 로봇 빼기')
봐(/export function 업단추/.test(띠) && /role="button" tabIndex=\{0\} aria-haspopup="dialog" aria-expanded=\{열림\}/.test(띠) && /'tlx-new up-b up-btn'/.test(띠)
  && /if \(e\.key === 'Enter' \|\| e\.key === ' '\) 누름\(e\)/.test(띠), 'UP 단추 — tlx-new · up-b 꼴 · 누르는 단추(키보드 Enter · 띄어쓰기) · 창 열림 알림')
봐(/const 막기 = \(e\) => \{ e\.stopPropagation\(\); e\.preventDefault\(\) \}/.test(띠) && /onClick=\{누름\}/.test(띠) && /const 누름 = \(e\) => \{\s*막기\(e\)/.test(띠) && /ref=\{창\} onClick=\{막기\}/.test(띠),
  'UP · 창을 눌러도 카드(링크)로 안 넘어감(막기 — 단추 · 창 둘 다)')
봐(/role="dialog" aria-label="업데이트 내용"/.test(띠) && /document\.body\)/.test(띠) && /createPortal\(/.test(띠) && /aria-label="업데이트 내용 닫기"/.test(띠)
  && /document\.addEventListener\('pointerdown', 밖, true\)/.test(띠) && /e\.key === 'Escape'/.test(띠), '창 — body 에 붙임 · 이름 · ✕ · 바깥 누름 · Esc 로 닫힘')
봐(/Math\.max\(8, Math\.min\(r\.left, 쪽폭 - 폭 - 8\)\)/.test(띠) && /r\.bottom \+ window\.scrollY \+ 6/.test(띠), '창 자리 — 단추 바로 밑 · 화면 폭 안(양쪽 8px)')
봐(/n\.matches\('h1, \.fp-title'\) \? n : n\.querySelector\('h1, \.fp-title'\)/.test(띠) && /document\.getElementById\('씀-앞'\)/.test(띠) && /n\.id !== '씀-뒤'/.test(띠)
  && /new MutationObserver\(곧\)/.test(띠) && /내자리\.className = 'up-slot'/.test(띠), '화면 안 — 본문(씀-앞 ~ 씀-뒤) 첫 제목(h1 · .fp-title) 옆 · 늦게 뜨는 제목도 지켜봄')
봐(/return <div className="up-line"><업단추 줄들=\{줄들\} \/><\/div>/.test(띠), '제목이 없는 화면 — 그 자리에 단추 한 줄')
봐(/export function 업표/.test(띠) && /<업단추 줄들=\{요\.filter\(\(x\) => x\.p === to\)\} className=\{className\} \/>/.test(띠), '업표 — 그 칸 줄로 UP 단추')
const 도구 = 읽('src', 'pages', 'Tools.jsx'), 서식 = 읽('src', 'pages', 'Forms.jsx'), 마이 = 읽('src', 'pages', 'MyConmap.jsx')
봐(/<업표 to=\{x\.to\} \/>/.test(도구) && /import \{ 업표 \} from '\.\.\/고친띠\.jsx'/.test(도구), '도구 목록 카드 «UP»')
봐(!/<em className="tlx-new">새로<\/em>/.test(도구) && !/x\.new &&/.test(도구) && !/딱지: '새로'/.test(읽('src', 'pages', 'Naeyeok.jsx')), 'G767 빨간 «새로» 표 없음(도구 목록 · 내역서 쪽 목록)')
봐((서식.match(/<div className="fp-title" style=\{\{ fontSize: 18, fontWeight: 800 \}\}>/g) || []).length === 2, '서식 화면 제목 둘(원본 · 새 서식)에 fp-title — UP 단추 자리')
봐((서식.match(/<업표 to=\{`\/forms\/\$\{f\.slug\}`\} \/>/g) || []).length === 2 && /import \{ 업표 \} from '\.\.\/고친띠\.jsx'/.test(서식), '서식 목록(그림 칸 · 카드) «UP» 두 곳')
봐(/<업표 to=\{p\} className="mc-key-up" \/>/.test(마이) && /import \{ 업표 \} from '\.\.\/고친띠\.jsx'/.test(마이), '마이컨맵 단축키 «UP»')
봐(/const 전체머리 = \[[^\]]*'\|업그레이드'/.test(읽('src', 'lib', '쓴수판.jsx')), "쓴수판 전체머리에 '|업그레이드'")
const 스 = 읽('src', 'styles.css')
봐(!/\.noti-band\.upg|\.upg-t \{|\.upg-tag \{|\.upg-more \{/.test(스) && /\.up-b \{/.test(스) && /\.mc-key-up \{/.test(스) && /\.up-btn \{ cursor: pointer;/.test(스) && /\.up-pop \{ position: absolute; z-index: 62;/.test(스)
  && /\.up-slot \{/.test(스) && /\.up-line \{/.test(스) && /@media print \{ \.up-btn, \.up-slot, \.up-line, \.up-pop \{ display: none !important; \} \}/.test(스), '스타일 — 옛 띠 없음 · UP · 단축키 · 단추 · 창(absolute) · 인쇄에선 숨김')
봐(스.indexOf('.up-b {') > 스.indexOf('.tlx-new {') && 스.indexOf('.mc-key-up {') > 스.indexOf('.up-b {'), 'UP 색이 tlx-new 뒤 · 단축키 자리가 UP 뒤(같은 무게 — 뒤가 이김)')
const 알림 = fs.readFileSync(path.join(ROOT, 'web', 'functions', 'alertpack.js'), 'utf8')
봐(/String\(f\.d \|\| ''\) > 부터글/.test(알림) && /쓰시던 화면을 고쳤습니다/.test(알림), '알림 함수(G222) — 지난번 알림 뒤 줄만 · 글 그대로')
const 셈 = 읽('src', 'lib', '고친것셈.js')
봐(!/^\s*import /m.test(셈), '고친것셈.js 는 불러오는 것 없음(node 시험 · PC 그대로)')
const 받 = 읽('src', 'lib', '고친것.js')
봐(/getJSON\(자료주소\(판\)\)/.test(받) && /kcm\.upg\.표/.test(받), '고친것.js — 자료(fixes.json) 한 번 받기 · 지난번 받은 것 먼저')

console.log('⑧ 자가시험 — 일부러 틀린 줄')
const 기준 = Date.UTC(2026, 10, 18, 1, 0)
const 틀 = [
  ['칸 아님', [{ p: '/tools', d: '2026-11-18 09:00', m: '좋아짐' }], '칸 주소 아님'],
  ['없는 화면', [{ p: '/tools/없는도구xyz', d: '2026-11-18 09:00', m: '좋아짐' }], '없는 화면'],
  ['시각 꼴', [{ p: '/tools/sajincad', d: '2026-11-18', m: '좋아짐' }], '시각 꼴'],
  ['하루 넘게 뒤', [{ p: '/tools/sajincad', d: '2026-11-20 09:00', m: '좋아짐' }], '하루 넘게 뒤'],
  ['차례', [{ p: '/tools/sajincad', d: '2026-11-10 09:00', m: '좋아짐' }, { p: '/change/twoline', d: '2026-11-11 09:00', m: '좋아짐' }], '새것부터가 아님'],
  ['40자', [{ p: '/tools/sajincad', d: '2026-11-18 09:00', m: '가'.repeat(41) }], '40자'],
  ['금지 말', [{ p: '/tools/sajincad', d: '2026-11-18 09:00', m: '무료로 더 좋아짐' }], '금지 말'],
  ['겹침', [{ p: '/tools/sajincad', d: '2026-11-18 09:00', m: '좋아짐' }, { p: '/tools/sajincad', d: '2026-11-18 09:00', m: '좋아짐' }], '두 번'],
  ['모르는 칸', [{ p: '/tools/sajincad', d: '2026-11-18 09:00', m: '좋아짐', x: 1 }], '모르는 칸'],
]
for (const [이름, r, 말] of 틀) { const t = 줄검사(r, 기준); 봐(t.some((s) => s.includes(말)), `${이름} → 잡음`, t) }
봐(줄검사([{ p: '/tools/sajincad', d: '2026-11-18 09:00', m: '좋아짐' }, { p: '/forms/' + [...서식슬][0], d: '2026-11-17 09:00', m: '좋아짐' }, { p: '/change/twoline', d: '2026-11-16 09:00', m: '좋아짐' }], 기준).length === 0, '맞게 쓴 줄(도구 · 서식 · 설계변경) → 통과')

console.log('⑨ 자료 주소 — 판을 붙여 받음(G767)')
봐(L.자료주소('d7f8fda0abcd') === '/fixes.json?v=d7f8fda0abcd', '판이 있으면 /fixes.json?v=판', L.자료주소('d7f8fda0abcd'))
봐(L.자료주소('') === '/fixes.json' && L.자료주소(undefined) === '/fixes.json' && L.자료주소(null) === '/fixes.json' && L.자료주소(3) === '/fixes.json', '판이 없거나 글이 아니면 그대로 /fixes.json')
봐(L.자료주소('a b&c') === '/fixes.json?v=a%20b%26c', '판 글은 주소 꼴로(띄어쓰기 · & )', L.자료주소('a b&c'))
봐(!/getJSON\('\/fixes\.json'\)/.test(받) && /import \{ 요즘, 자료주소 \} from '\.\/고친것셈\.js'/.test(받), '고친것.js — 판 없는 옛 주소로 받지 않음 · 자료주소를 고친것셈.js 에서 부름')
봐(/const 판 = \(\(\) => \{ try \{ return typeof window !== 'undefined' && typeof window\.__KCM_BUILD__ === 'string' \? window\.__KCM_BUILD__ : '' \} catch \(e\) \{ return '' \} \}\)\(\)/.test(받)
  && /typeof window\.__KCM_BUILD__ === 'string' && window\.__KCM_BUILD__/.test(읽('src', 'lib', 'data.js')), '판은 lib/data.js 와 같은 곳(window.__KCM_BUILD__ — vite.config.js 가 HTML 에 적음)')
봐(/window\.__KCM_BUILD__=\$\{JSON\.stringify\(BUILD\)\}/.test(fs.readFileSync(path.join(ROOT, 'web', 'vite.config.js'), 'utf8')), 'vite.config.js 가 HTML 에 판을 적음(없어지면 이 고침이 헛돎)')

console.log('⑩ 🏗 적산컨맵(G769 — 소장님 「적산 컨맵에도 업데이트 내용 기제해줘」)')
const 적산 = 읽('src', 'pages', 'Jeoksan.jsx').replace(/\r\n/g, '\n'), 모델 = 읽('src', 'pages', 'Model.jsx').replace(/\r\n/g, '\n')   /* PC git(autocrlf)은 CRLF — 여러 줄 꼴은 LF 로 맞춰 봄 */
봐(/import \{ 업표 \} from '\.\.\/고친띠\.jsx'/.test(적산) && /<span className="kcm-hero-k">🏗 K-적산컨맵<\/span><업표 to="\/jeoksan\/model" className="kcm-hero-up" \/>/.test(적산), '적산 첫 화면 «🏗 K-적산컨맵» 카드 이름 옆 «UP»(/jeoksan/model 줄)')
봐(/import \{ 업표 \} from '\.\.\/고친띠\.jsx'/.test(모델) && /<span className="gmd-ws-namebox">[^\n]*\n\s*<b className="gmd-ws-name">[^\n]*<\/b>\n\s*<업표 to="\/jeoksan\/model" className="gmd-ws-up" \/>\n\s*<\/span>/.test(모델),
  '작업 화면 막대 — 이름과 «UP» 한 묶음(.gmd-ws-namebox · 폰에서도 이름 바로 옆)')
봐(/const 판높이 = \(el\) =>/.test(띠) && /z: 판높이\(b\)/.test(띠) && /자리\.z >= 62 \? \{ zIndex: 자리\.z \+ 1 \}/.test(띠), '창 — 덮는 판(작업 화면 z 1200) 안의 단추면 그 판 위로(판높이 + 1)')
봐(/\.gmd \.gmd-ws-namebox \{ display: inline-flex;/.test(스) && /\.gmd \.gmd-ws-namebox \{ flex: 1 1 100%; \}/.test(스) && /\.gmd \.gmd-ws-namebox \.gmd-ws-name \{ flex: 0 1 auto; min-width: 0; \}/.test(스),
  '스타일 — 묶음(PC 이름 옆 · 폰 760 아래 한 줄 다 씀 · 이름은 글 폭)')
const 판스 = 스.match(/\.gmd \.gmd-ws \{[^}]*z-index: (\d+)/)
봐(!!판스 && Number(판스[1]) >= 62, `작업 화면 판 z-index ${판스 ? 판스[1] : '?'} — 창이 그 위로 가야 하는 까닭(판높이 시험은 시험_고친띠화면 ⑬)`)

console.log(나쁨 ? `\n❌ 시험_고친것 ${좋음}/${좋음 + 나쁨}` : `\n✅ 시험_고친것 ${좋음}/${좋음}`)
process.exit(나쁨 ? 1 : 0)
