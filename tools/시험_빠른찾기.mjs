/**
 * 🔎 빠른 찾기 — lib/빠른찾기.js 시험 · G404 (2026-10-25)
 *   node tools/시험_빠른찾기.mjs
 *   사이트 자료(web/src/data/*.json)로 목록을 만들어 사람들이 칠 말로 찾아 봄 — 맨 위가 그 일을 하는 화면이어야
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
const 여기 = path.dirname(fileURLToPath(import.meta.url))
const L = await import(pathToFileURL(path.join(여기, '..', 'web', 'src', 'lib', '빠른찾기.js')).href)
const 읽 = (f) => JSON.parse(fs.readFileSync(path.join(여기, '..', 'web', 'src', 'data', f), 'utf8'))

let ok = 0, bad = 0
const 봐 = (c, m, 더 = '') => { if (c) ok++; else bad++; console.log((c ? '  ✓ ' : '  ✗ ') + m + (c ? '' : ' — ' + String(더).slice(0, 600))) }

console.log('① 초성 · 고른말')
봐(L.초성('거푸집') === 'ㄱㅍㅈ' && L.초성('A값 계산') === 'Aㄱ ㄱㅅ', '초성 — 거푸집 → ㄱㅍㅈ · 한글 아닌 글자는 그대로', L.초성('A값 계산'))
봐(L.고른말(' 설계 변경 · 작업대 ') === '설계변경작업대' && L.고른말('BIM 물량') === 'bim물량', '고른말 — 띄어쓰기 · 꾸밈 글자 빼고 소문자')

console.log('② 목록 — 사이트 자료로')
const 탭 = [{ to: '/tools', ic: '🧰', label: '도구' }, { to: '/qna', ic: '🗺', label: '맵톡' }]
const 목 = L.목록만들기({ 탭, tools: 읽('tools.json'), forms: 읽('forms-min.json'), change: 읽('change.json'), guide: 읽('guide.json'), cad: 읽('cad.json') })
const 셈 = 목.reduce((a, x) => ((a[x.갈래] = (a[x.갈래] || 0) + 1), a), {})
봐(목.length >= 250 && 셈.서식 >= 150 && 셈.계산기 >= 20 && 셈.도구 >= 40 && 셈['캐드 명령'] >= 10 && 셈.설계변경 >= 5 && 셈['입찰 알아보기'] >= 10 && 셈.화면 >= 15, `목록 ${목.length}개 — ${JSON.stringify(셈)}`)
봐(new Set(목.map((x) => x.to)).size === 목.length, '같은 주소 두 번 없음')
const 관리 = 목.filter((x) => /^\/(admin|report)/.test(x.to))
봐(!관리.length, '관리자 · 소장님만 보는 화면(/admin · /report)은 목록에 없음', 관리.map((x) => x.to))

console.log('③ 사람들이 칠 말 → 맨 위')
const 맨위 = (q) => (L.찾기(목, q, 5)[0] || {}).to
const 표 = [
  ['노무비', '/tools/nomubi'], ['ㄴㅁㅂ 계산기', '/tools/nomubi'], ['거푸집', '/tools/formwork-area'], ['ㄱㅍㅈ', '/tools/formwork-area'],
  ['철근 무게', '/tools/rebar-weight'], ['기성', '/change/gisung'], ['위험성평가', '/tools/risk'], ['설계변경 작업대', '/change/work'],
  ['맵톡', '/qna'], ['A값', '/tools/a-value'], ['투찰', '/'], ['하도급 내역서', '/naeyeok/hado'], ['길이 합계', '/cad/kl'], ['bim', '/jeoksan/bim'],
]
const 틀린 = 표.filter(([q, to]) => 맨위(q) !== to)
봐(!틀린.length, `${표.length}가지 말 — 맨 위가 그 화면(노무비 · 초성 · 같은 뜻 «무게 = 중량» · 낱말 둘)`, JSON.stringify(틀린.map(([q, to]) => [q, to, 맨위(q)])))
봐(L.찾기(목, '거푸집', 10).some((x) => x.to === '/jeoksan/model'), '«거푸집» 에 적산컨맵(골조 모델)도 나옴(더 붙인 말)')
봐(!L.찾기(목, '', 5).length && !L.찾기(목, '   ', 5).length && !L.찾기(목, '쀏쀍', 5).length, '빈칸 · 없는 말 → 없음')

console.log('④ 공고 번호')
const 공 = L.찾기(목, 'r26bk01693749-000', 5)
봐(공[0] && 공[0].갈래 === '공고' && 공[0].to === '/notice/R26BK01693749', '«r26bk01693749-000» → 맨 위 «공고 R26BK01693749 열기»(대문자 · 차수 뺌)', JSON.stringify(공[0]))
봐(L.공고번호('20261024123-00') === '20261024123-00' && L.공고번호('2026') === null && L.공고번호('노무비') === null, '옛 번호(20261024123-00) · 숫자 몇 개 · 낱말은 공고 아님')

console.log(`\n${ok + bad}개 중 맞음 ${ok} · 틀림 ${bad}`)
if (bad) { console.log('✗ 틀린 것이 있음'); process.exit(1) } else console.log('✓ 모두 맞음')
