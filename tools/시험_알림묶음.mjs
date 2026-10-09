// 🧪 G222 (2026-10-09) 알림 — 신청 안 한 분께 하루 한 번 오전 10시 한 통 · 무엇을 담나 · 닫기와 건설맵 링크 · 신청은 하던 대로를 잠급니다.
//   소장님: 「알림 해줘」 → 「그냥, 하루에 한번으로 하면 어때???」 → 「10시에 하자. 모아서 한 번」
//           → 「현재 하던대로 하고, 알림 신청하지 않은 이용자만 하루 한 번 알림 가게 하자.」
//           「낙찰 된 경우에 바로 알림」(☆ 담은 공고 1순위만 바로) · 「알림이 가도 반드시 닫기, 건설맵 링크가 있어야 해」
//           「업체 자가진단 알림은 삭제…」 「업체 자가진단 알림이 필요한 건 아니잖아..」
//   돌리기: node tools/시험_알림묶음.mjs   (올리기 bat 이 올리기 전에 돌립니다 — 틀리면 멈춤)
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
const require = createRequire(import.meta.url)
const M = require('../web/functions/alertpack.js')

let 틀림 = 0, 셈 = 0
const 봄 = (이름, 참, 덧 = '') => { 셈++; console.log((참 ? '✓ ' : '✗ ') + 이름 + (덧 ? ` — ${덧}` : '')); if (!참) 틀림++ }
const 때 = (s) => Date.parse(s + '+09:00')

// ① 시각 — 하루 한 통 오전 10시(10:00~21:59 첫 깨어남 · 한 번만)
봄('① 09:59 → 아직', M.칸(때('2026-10-10T09:59:00')) === '')
봄('① 10:00 → 그날 한 통', M.칸(때('2026-10-10T10:00:00')) === '2026-10-10-10')
봄('① 21:59 → 아직 그날 칸(10시에 놓쳤으면 다음 깨어남에)', M.칸(때('2026-10-10T21:59:00')) === '2026-10-10-10')
봄('① 22:00 · 08:00 → 안 보냄', M.칸(때('2026-10-10T22:00:00')) === '' && M.칸(때('2026-10-10T08:00:00')) === '')
봄('① 바로 보내던 셈 · 우리 회사 셈은 없음(하루 한 번 · 업체 자가진단 알림 뺌)', ['바로', '바로때', '낙찰맞나', '낙찰글'].every((k) => typeof M[k] === 'undefined'))

// ② 폰 알림창 — 늘 «건설맵 열기» · «닫기» 단추와 k-conmap.com (public/sw.js)
const sw = readFileSync(new URL('../web/public/sw.js', import.meta.url), 'utf8')
봄('② 단추 «🏗 건설맵 열기» · «✕ 닫기»', sw.includes("{ action: 'open', title: '🏗 건설맵 열기' }") && sw.includes("{ action: 'close', title: '✕ 닫기' }"))
봄('② «닫기» 는 닫기만(사이트를 안 엶)', /if \(e\.action === 'close'\) return/.test(sw))
봄('② 본문 끝에 k-conmap.com(단추 없는 기기 · 아이폰)', sw.includes("const 건설맵 = 'k-conmap.com'") && sw.includes('👉 ${건설맵}'))
봄('② 누르고 들어오면 ?kcm=push(숨은 누적 |알림|누름)', sw.includes("u.searchParams.set('kcm', 'push')") && readFileSync(new URL('../web/src/main.jsx', import.meta.url), 'utf8').includes("세기('|알림|누름')"))

// ③ 한 사람 몫(하루 한 통)
const 부터 = 때('2026-10-09T10:00:00')   /* 지난번 한 통 뒤 */
const 공고 = [
  { no: 'A', name: '청사 현업근무자 샤워장 개선공사', inst: '전남광주통합특별시 여수시', dt: '2026-10-10 09:00:00', sido: '전남', codes: ['건축공사업/0002', '토목건축공사업/0003'] },
  { no: 'B', name: '삼향동 도로포장공사', inst: '전남광주통합특별시 목포시', dt: '2026-10-09 16:00:00', sido: '전남', codes: ['지반조성ㆍ포장공사업/4989'] },
  { no: 'C', name: '경기 아스콘 포장 보수', inst: '경기도 안양시', dt: '2026-10-09 14:00:00', sido: '경기', codes: ['지반조성ㆍ포장공사업/4989'] },
  { no: 'D', name: '옛 공고(지난번 한 통 전)', inst: '전남광주통합특별시 여수시', dt: '2026-10-09 09:00:00', sido: '전남', codes: ['지반조성ㆍ포장공사업/4989'] },
]
const c = { rg: '전남', lic: '4989', kw: '포장,샤워장', tools: '/tools/nomubi' }
const 셈1 = M.한사람(c, 부터, { 공고, 일순위: [{ no: 'F1', name: '어느 포장공사', dt: '2026-10-09 14:10:00', win: '갑' }], 고침: [{ p: '/tools/nomubi', d: '2026-10-09 13:00', m: '노무비 명세서 합계' }, { p: '/tools/other', d: '2026-10-09 13:00', m: '안 쓴 화면' }] })
봄('③ 내 조건(전남 · 포장) = 목포 B', 셈1.조건.map((x) => x.no).join() === 'B', 셈1.조건.map((x) => x.no).join())
봄('③ 찾은 말 = 경기 «포장» C · 여수 «샤워장» A(지역이 안 맞아도 말로)', 셈1.말공고.map((x) => x.no + ':' + x.w).sort().join() === 'A:샤워장,C:포장', 셈1.말공고.map((x) => x.no + ':' + x.w).join())
봄('③ 한 공고는 한 칸에만 · 지난번 한 통 전(D)은 빼기', 셈1.조건.length + 셈1.말공고.length === 3 && ![...셈1.조건, ...셈1.말공고].some((x) => x.no === 'D'))
봄('③ 찾은 말 1순위', 셈1.말일순위.length === 1 && 셈1.말일순위[0].w === '포장')
봄('③ 고친 화면은 «쓰던 화면» 만', 셈1.고침.length === 1 && 셈1.고침[0].p === '/tools/nomubi')
const 글1 = M.글(셈1, c)
봄('③ 한 통 — 제목', 글1 && 글1.title === '📢 지난 하루 새 공고 3건 · 1순위 1건 · 고친 화면 1', 글1 && 글1.title)
봄('③ 한 통 — 본문', 글1 && 글1.body.startsWith('내 조건(전남) 1 · «') && 글1.body.includes('🛠 쓰시던 화면을 고쳤습니다: 노무비 명세서 합계'), 글1 && 글1.body)
봄('③ 누르면 공고 목록', 글1 && 글1.url === '/live' && 글1.tag === 'kcm-day')
봄('③ 우리 회사 칸이 없음(업체 자가진단 알림 뺌)', !('참여' in 셈1) && !글1.body.includes('우리 회사'))

// ④ 없으면 안 보냄 · 말만 · 1순위만
봄('④ 맞는 것이 없으면 null(빈 알림 안 보냄)', M.글(M.한사람({ rg: '제주' }, 부터, { 공고, 일순위: [], 고침: [] }), {}) === null)
const 셈2 = M.한사람({ rg: '전남', lic: '', kw: '' }, 부터, { 공고, 일순위: [], 고침: [] })
봄('④ 전남만 → 전남 새 공고는 모두 «내 조건»', 셈2.조건.map((x) => x.no).sort().join() === 'A,B')
봄('④ 지역 «전국» · 면허 없음 · 말만 → 말 맞는 것만(전국 공고를 다 보내지 않음)', M.한사람({ rg: '전국', kw: '샤워장' }, 부터, { 공고, 일순위: [], 고침: [] }).조건.length === 0)
봄('④ 한 글자 말은 안 씀', M.말맞나('포장공사', ['포']) === '')
봄('④ 여러 낱말 찾은 말 = 낱말이 모두(차례 무시)', M.말맞나('도로 보수 및 포장공사', ['포장공사 보수']) === '포장공사 보수' && M.말맞나('포장공사', ['포장공사 보수']) === '')
const 글2 = M.글(M.한사람({ rg: '전국', kw: '포장' }, 부터, { 공고: [], 일순위: [{ no: 'F', name: '포장 보수', dt: '2026-10-09 13:00:00' }], 고침: [] }), {})
봄('④ 1순위만이면 1순위 화면으로', 글2 && 글2.url === '/first?q=' + encodeURIComponent('포장') && 글2.title === '📢 지난 하루 1순위 1건', 글2 && `${글2.title} ${글2.url}`)

// ⑤ 조건 없는 «폰 알림 허용» 사람 — 요약 한 통 · 0이면 안 보냄
const 요1 = M.요약(공고, [{ no: 'F', name: 'x', dt: '2026-10-09 14:00:00' }], 부터)
봄('⑤ 요약 — 새 공고 · 1순위 수', 요1 && 요1.title === '📢 지난 하루 새 공고 3건 · 1순위 1건' && 요1.url === '/live', 요1 && 요1.title)
봄('⑤ 요약 — 새 것 없으면 null', M.요약(공고, [], 때('2026-10-10T23:00:00')) === null)

// ⑥ 다시 오신 분 «지난번 오신 뒤» 셈 — 그 시간 안 것은 빼고 다음 시간부터
const D = await import('../web/src/lib/다시오심.js')
const nc = { h: { 2026100914: [5, 1], 2026100915: [7, 2], 2026100918: [3, 0] }, s: { 2026100915: { 전남: 2, 경기: 5 }, 2026100918: { 전남: 1 } } }
const r6 = D.셈(nc, 때('2026-10-09T14:40:00'), '전남')
봄('⑥ 지난번 14:40 → 15시 · 18시 것만', r6.공고 === 10 && r6.일순위 === 2 && r6.내 === 3, JSON.stringify(r6))
봄('⑥ 지역 «전국» 이면 내 지역 수 없음', D.셈(nc, 때('2026-10-09T14:40:00'), '전국').내 === 0)

// ⑦ 함수 · 규칙 · 화면이 같은 칸 이름을 쓰는가 · 신청은 하던 대로인가 · 업체 자가진단 알림이 남아 있지 않은가
const 읽기 = (p) => readFileSync(new URL(p, import.meta.url), 'utf8')
const 함수 = 읽기('../web/functions/index.js')
const 규칙 = 읽기('../web/database.rules.json')
const 화면 = 읽기('../web/src/lib/저절로알림.js')
const 신청 = 읽기('../web/src/lib/관심알림.js')
const 줄 = 읽기('../web/src/내조건.jsx')
const 종 = 읽기('../web/src/알림종.jsx')
const 칸규칙 = 규칙.slice(규칙.indexOf('"watch_cond"'), 규칙.indexOf('"watch_auto"'))
const 기억규칙 = 규칙.slice(규칙.indexOf('"watch_auto"'), 규칙.indexOf('"watch_last"'))
봄('⑦ 함수가 alertpack 을 씀 · 신청(조건묶음 8시 · 13시)과 하루한통(10시)을 둘 다 부름', 함수.includes("require('./alertpack.js')") && /await 조건묶음\(d\)[\s\S]{0,120}await 하루한통\(d\)/.test(함수) && 함수.includes("h >= 13 ? 13 : h >= 8 ? 8 : 0"))
봄('⑦ 하루한통은 신청한 분(watch_cond) · ☆ 담은 분(watch) · 끈 분(off)을 뺌', /!신청\[r\] && !담은사람\.has\(r\) && !\(기억\[r\] && 기억\[r\]\.off\)/.test(함수))
봄('⑦ 규칙 — 신청(watch_cond)은 하던 대로 rg · lic · none · at 만', ['"rg"', '"lic"', '"none"', '"at"'].every((k) => 칸규칙.includes(k)) && !['"kw"', '"tools"', '"off"'].some((k) => 칸규칙.includes(k)))
봄('⑦ 규칙 — 신청 안 한 분 기억(watch_auto)은 kw · tools · off 도 받음 · watch_day_last 는 함수만', ['"kw"', '"tools"', '"off"'].every((k) => 기억규칙.includes(k)) && 규칙.includes('"watch_day_last": { ".read": false, ".write": false }'))
봄('⑦ 화면 — 저절로 올리는 곳은 watch_auto(신청 watch_cond 를 건드리지 않음)', 화면.includes('watch_auto/${r}') && !/ref\(f\.db, `watch_cond/.test(화면))
봄('⑦ 화면 — 내 조건 줄 신청 단추는 하던 대로(«🔔 새 공고 알림 받기» · 하루 두 번) · 끄면 하루 한 번도 끔', 줄.includes("'🔔 새 공고 알림 받기'") && 줄.includes('조건알림(켜짐 ? null : 조건, !켜짐)') && 줄.includes('알림끄기(켜짐, true)') && 신청.includes("'아침 8시 · 낮 1시, 새 공고를 묶어 한 번 — '"))
봄('⑦ 화면 — 🔔 안 «하루 한 번 끄기» 줄은 신청 안 한 분께만', 종.includes('if (조건알림켜짐()) return null') && 종.includes('공고 소식 — 하루 한 번(오전 10시)'))
봄('⑦ 업체 자가진단 알림이 남아 있지 않음(규칙 co · watch_win · 함수 chamyeo · 화면 우리회사)', !칸규칙.includes('"co"') && !기억규칙.includes('"co"') && !규칙.includes('watch_win') && !함수.includes('chamyeo') && !함수.includes('우리회사낙찰') && !화면.includes('우리회사정하기') && !읽기('../web/src/Spot.jsx').includes('회사알림'))
봄('⑦ 숨은 누적(허용 · 막음 · 조건 · 끔 · 켬 · 신청 · 신청끔 · 담기)', ['|알림|허용', '|알림|막음', '|알림|조건', '|알림|끔', '|알림|켬'].every((k) => 화면.includes(k)) && ['|알림|신청', '|알림|신청끔', '|알림|담기'].every((k) => 신청.includes(k)))

const 꾸밈 = 읽기('../web/src/styles.css')
봄('⑦ 폰 — 🔔 창이 화면 밖으로 안 잘림(560px 아래는 양쪽 12px 고정)', /@media \(max-width: 560px\) \{\s*\.noti-pop \{ position: fixed; left: 12px; right: 12px;/.test(꾸밈))

console.log(`\n${셈}개 중 틀림 ${틀림}`)
process.exit(틀림 ? 1 : 0)
