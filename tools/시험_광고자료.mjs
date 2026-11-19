/**
 * 🧪 업체 광고 자료(lib/광고자료.js) · 자리 — 2026-11-05 (인터넷 · 빌드 · playwright 없이 — PC 올리기 시험에도)
 *   node tools/시험_광고자료.mjs
 *   소장님 「한 페이지에 한번씩만」 · 「보증하지 않습니다 … 빼줘」 · 「유안굴착은 1순위쪽에」 · 「1순위 1페이지에 뜨게 해줘. 유안굴착하고, 보험...」
 *   ① 자료 꼴(아이디 겹침 없음 · 자리 · 전화 꼴 · 지역은 시 · 구까지 · 업체를 깎는 말 없음)
 *   ② 자리 고르기(기간 · 심의필요 · 돌아가며 고르게) ③ 화면 자리(1순위 둘 · 보험료 계산기 · 4대보험 판단기 — 쪽마다 업체마다 한 번)
 */
import fs from 'node:fs'
import { 광고들, 자리후보, 자리광고, 전화숫자, 한국날, 광고문자글, 문자말들, 폰인가, 아이폰인가, 문자앱주소, 문자QR글 } from '../web/src/lib/광고자료.js'
let 통과 = 0, 실패 = 0
const 봐 = (c, 무엇, 더) => { if (c) { 통과++; console.log('  ✓', 무엇) } else { 실패++; console.log('  ✗', 무엇, 더 === undefined ? '' : '— ' + JSON.stringify(더)) } }
const 읽 = (p) => fs.readFileSync(new URL('../' + p, import.meta.url), 'utf8').replace(/\r\n/g, '\n')

console.log('① 자료 꼴')
봐(new Set(광고들.map((a) => a.id)).size === 광고들.length, '아이디 겹침 없음', 광고들.map((a) => a.id))
for (const a of 광고들) {
  봐(/^[a-z0-9-]+$/.test(a.id), `${a.이름}: 아이디 «${a.id}» 는 영문 소문자 · 숫자 · - (숨은 셈 열쇠)`)
  봐(Array.isArray(a.자리) && a.자리.length > 0 && a.자리.every((x) => ['first', 'first2', 'first3', 'live', '보험', '노무', '물가', '공기'].includes(x)) && (a.고정자리 || []).every((x) => a.자리.includes(x)), `${a.이름}: 자리 ${JSON.stringify(a.자리)}${a.고정자리 ? ' · 고정 ' + JSON.stringify(a.고정자리) : ''}`)
  봐(/^0\d{1,2}-\d{3,4}-\d{4}$/.test(a.전화) && 전화숫자(a.전화).length >= 9, `${a.이름}: 전화 꼴 «${a.전화}»`)
  봐(!/\d+(번길|로|길)\s*\d|동\s*\d+호|\d+층/.test(a.지역 || ''), `${a.이름}: 지역은 시 · 구까지(번지 · 층 없음) «${a.지역}»`)
  const 글 = JSON.stringify(a)
  봐(!/보증하지|책임지지|직접 확인하십시오|확인하십시오/.test(글), `${a.이름}: 업체를 깎는 말 없음`)
  /* G548 — 소장님 「광고잖아」 「다 넣어 줘」: 메일 · 주소도 명함 그대로. 메일은 «정보» 칸에만 · 꼴이 맞아야 */
  봐((a.정보 || []).every(([k, v]) => typeof k === 'string' && k.length <= 5 && typeof v === 'string' && v.length > 0 && (k !== '메일' || /^[\w.+-]+@[\w-]+(\.[\w-]+)+$/.test(v))), `${a.이름}: 정보 칸 꼴(이름표 · 값 · 메일 꼴)`)
  봐(/^\d{4}-\d{2}-\d{2}$/.test(a.부터) && (a.까지 === '' || /^\d{4}-\d{2}-\d{2}$/.test(a.까지)), `${a.이름}: 기간 꼴`)
}
봐(광고들.find((a) => a.id === 'kc-dy') && JSON.stringify(광고들.find((a) => a.id === 'kc-dy').자리) === '["first","live"]' && JSON.stringify(광고들.find((a) => a.id === 'kc-dy').고정자리) === '["first","live"]', '강천건설 · 대유건설 → 1순위 제일 좋은 자리(셋째 카드 다음) · 공고 셋째 카드 다음 · 늘(소장님 「1순위 제일 좋은 자리에 항상」 「1순위 및 공고자리에도 항상」)')
봐(광고들.some((a) => a.id === 'yuan' && JSON.stringify(a.자리) === '["first2"]'), '유안굴착 → 1순위 열째 카드 다음(first2)')
봐(광고들.filter((a) => a.자리.includes('first3') && a.자리.includes('보험')).map((a) => a.id).join() === 'kb-jsd' && JSON.stringify(광고들.find((a) => a.id === 'kb-jsd').고정자리) === '["보험","first3"]', '근재보험 정순덕 FP → 1순위 열일곱째 카드 다음(first3) + 보험 계산 화면 · 그 자리는 고정(번갈지 않음 — 소장님)')
봐(광고들.filter((a) => a.자리.includes('노무')).map((a) => a.id).sort().join() === 'kb-jsd,kb-phh', '노무 자리(노무비 계산기 · 산재 휴업급여) = 정순덕 · 박현희 번갈아(소장님 「그럼, 박현희 정순덕 번갈아서 나가게 해줘. 정순덕 고정은 그대로 두고」)')
봐(광고들.filter((a) => a.추천).map((a) => a.id).sort().join() === 'barun,kb-jsd,kc-dy,yuan', '«K-건설맵 추천» 은 kc-dy · yuan · kb-jsd · barun(G759 소장님 「k건설맵 추천 넣어 줘」)만 — kb-phh 는 업체 소개', 광고들.filter((a) => a.추천).map((a) => a.id))
봐(광고들.find((a) => a.id === 'kc-dy').대표 === '정종석' && 광고들.find((a) => a.id === 'yuan').대표 === '안정현' && 광고들.every((a) => !a.대표 || /^[가-힣]{2,5}$/.test(a.대표)), '대표 이름 — 명함 그대로(강천 · 대유 정종석 · 유안굴착 안정현 · 소장님 「대표이름 넣어 줘.」) · 이름 꼴만')
봐(['kc-dy', 'yuan', 'kb-jsd', 'kb-phh'].every((id) => { const a = 광고들.find((x) => x.id === id); const k = (a.정보 || []).map((x) => x[0]); return ['사무실', '팩스', '메일', '주소'].every((n) => k.includes(n)) }), '넷 다 명함 그대로 — 사무실 · 팩스 · 메일 · 주소(소장님 「다 넣어 줘」)')
봐(JSON.stringify(광고들.find((a) => a.id === 'kc-dy').정보) === JSON.stringify([['사무실', '061-835-6788 · 061-842-6789'], ['팩스', '061-844-1650'], ['메일', 'jinhung1650@naver.com'], ['주소', '전남 고흥군 고흥읍 여산당촌길 23, 2층']]), '강천 · 대유 정보 = 명함(두 번 대조)')
봐(JSON.stringify(광고들.find((a) => a.id === 'yuan').정보) === JSON.stringify([['사무실', '063-909-0555'], ['팩스', '063-909-3103'], ['메일', 'yuan0555@nate.com'], ['주소', '전북 전주시 덕진구 동부대로 670 클래시아A 101동 1101호']]), '유안굴착 정보 = 명함')
봐(['kb-jsd', 'kb-phh'].every((id) => 광고들.find((a) => a.id === id).한줄 === '법인ㆍ화재ㆍ단체ㆍ근재 상담가능'), '보험 두 분 한 줄 = «법인ㆍ화재ㆍ단체ㆍ근재 상담가능»(소장님 11-05 글자 그대로 — 다시 바뀌지 않게)')
봐(광고들.find((a) => a.id === 'kb-jsd').정보.some(([k, v]) => k === '메일' && v === 'sun9715suns@naver.com') && 광고들.find((a) => a.id === 'kb-phh').정보.some(([k, v]) => k === '메일' && v === 'hyoun2636@hanmail.net'), '보험 두 분 메일 = 명함')
for (const a of 광고들.filter((x) => x.추천)) 봐(!/최고|1위|최저|보장|무료|100%|확실/.test(a.추천) && a.추천.length <= 60, `${a.이름}: 추천 글은 사실로만 · 짧게(«최고 · 1위 · 보장» 없음) «${a.추천}»`)
/* 📈 G759 바른경제연구원 — 소장님 11-18 「해줘.」 · 명함 그대로(두 번 대조) */
{
  const 바 = 광고들.find((a) => a.id === 'barun')
  봐(!!바 && JSON.stringify(바.자리) === '["물가","공기"]' && !바.고정자리 && 바.부터 === '2026-11-18' && 바.까지 === '', '바른경제연구원 → 물가변동 ESC 산출서(물가) · 공기연장 때 할 일(공기) · 11-18 부터 · 끝 없음', 바 && 바.자리)
  봐(!!바 && 바.이름 === '바른경제연구원' && 바.소속 === '부장 홍지훈' && !바.대표 && 바.전화 === '010-2257-5339', '바른경제연구원 — 이름 · «부장 홍지훈»(소속 칸 · 대표 아님) · 📞 010-2257-5339(명함 «010~2257~5339»)', 바 && [바.이름, 바.소속, 바.전화])
  봐(!!바 && 바.추천 === '공사비 조정이 필요할 때 — 전화 한 통으로 상담', '바른경제연구원 «K-건설맵 추천»(소장님 11-18 「k건설맵 추천 넣어 줘」) — 명함 사실(공사비 조정)로만 · 한 줄과 안 겹침', 바 && 바.추천)
  봐(!!바 && 바.한줄 === '물가변동으로 인한 계약금액조정 · 공사기간 연장에 따른 간접비 산정', '바른경제연구원 한 줄 = 명함 두 줄 그대로(물가변동으로 인한 계약금액조정 · 공사기간 연장에 따른 간접비 산정)', 바 && 바.한줄)
  봐(!!바 && JSON.stringify(바.정보) === JSON.stringify([['메일', 'oriida@hanmail.net'], ['주소', '전남광주특별시 광산구 장신로265번길 22 상가동 3층 302호']]), '바른경제연구원 정보 = 명함(메일 · 주소 — 사무실 · 팩스는 명함에 없음)', 바 && 바.정보)
}

console.log('② 자리 고르기')
const 오늘 = '2026-11-05'
봐(자리후보('first', 오늘).map((a) => a.id).join() === 'kc-dy' && 자리후보('live', 오늘).map((a) => a.id).join() === 'kc-dy' && 자리후보('first2', 오늘).map((a) => a.id).join() === 'yuan', 'first · live 자리 = 강천 · 대유 · first2 = 유안굴착', ['first', 'live', 'first2'].map((x) => 자리후보(x, 오늘).map((a) => a.id)))
봐(자리후보('first3', 오늘).map((a) => a.id).join() === 'kb-jsd' && 자리후보('보험', 오늘).map((a) => a.id).join() === 'kb-jsd', 'first3 · 보험 자리 = 정순덕 FP')
{ const 셈 = {}; for (let i = 0; i < 1000; i++) { const a = 자리광고('노무', 오늘, () => (i + 0.5) / 1000); 셈[a.id] = (셈[a.id] || 0) + 1 } 봐(셈['kb-jsd'] === 500 && 셈['kb-phh'] === 500, '노무 자리 — 1,000번에 정순덕 500 · 박현희 500(번갈아 · 고정 아님)', 셈) }
봐([0, 0.3, 0.6, 0.99].every((g) => 자리광고('first3', 오늘, () => g).id === 'kb-jsd' && 자리광고('보험', 오늘, () => g).id === 'kb-jsd' && 자리광고('first', 오늘, () => g).id === 'kc-dy' && 자리광고('live', 오늘, () => g).id === 'kc-dy'), '고정자리 — 고르기 값과 상관없이 늘(정순덕 FP · 강천 · 대유)')
{ const 둘 = [{ id: 'p', 자리: ['보험'], 부터: '2026-11-01', 까지: '', 전화: '010-0000-0000' }, { id: 'q', 자리: ['보험'], 부터: '2026-11-01', 까지: '', 전화: '010-0000-0000' }]
  const 셈 = {}; for (let i = 0; i < 1000; i++) { const a = 자리광고('보험', 오늘, () => (i + 0.5) / 1000, 둘); 셈[a.id] = (셈[a.id] || 0) + 1 } 봐(셈.p === 500 && 셈.q === 500, '고정 없으면 고르게 — 1,000번에 500 · 500', 셈)
  봐(자리광고('보험', 오늘, () => 0.99, [...둘, { ...둘[1], id: 'r', 고정: true }]).id === 'r', '고정이 섞이면 고정이 이김') }
const 시험표 = [
  { id: 'a', 자리: ['보험'], 부터: '2026-11-01', 까지: '2026-11-30', 전화: '010-0000-0000' },
  { id: 'b', 자리: ['보험'], 부터: '2026-12-01', 까지: '', 전화: '010-0000-0000' },
  { id: 'c', 자리: ['보험'], 부터: '2026-11-01', 까지: '', 심의필요: true, 심의: '', 전화: '010-0000-0000' },
  { id: 'd', 자리: ['보험'], 부터: '2026-11-01', 까지: '', 심의필요: true, 심의: '심의필 제2026-000호', 전화: '010-0000-0000' },
]
봐(자리후보('보험', '2026-11-05', 시험표).map((a) => a.id).join() === 'a,d', '기간 안 · 심의필요인데 심의 글 없는 것은 뺌(a · d 만)', 자리후보('보험', '2026-11-05', 시험표).map((a) => a.id))
봐(자리후보('보험', '2026-12-05', 시험표).map((a) => a.id).join() === 'b,d', '기간 끝난 것 빠지고 새 것 들어옴', 자리후보('보험', '2026-12-05', 시험표).map((a) => a.id))
봐(자리광고('없는자리', 오늘) === null, '없는 자리 → 없음')
봐(자리후보('물가', '2026-11-18').map((a) => a.id).join() === 'barun' && 자리후보('공기', '2026-11-18').map((a) => a.id).join() === 'barun' && [0, 0.5, 0.99].every((g) => 자리광고('물가', '2026-11-20', () => g).id === 'barun' && 자리광고('공기', '2026-11-20', () => g).id === 'barun'), '📈 G759 물가 · 공기 자리 = 바른경제연구원(한 곳 · 늘)')
봐(자리광고('물가', '2026-11-17') === null && 자리광고('공기', '2026-11-17') === null, '📈 G759 11-18 전에는 안 나옴(부터)')
봐(['first', 'first2', 'first3', 'live', '보험', '노무'].every((x) => !자리후보(x, '2026-11-20').some((a) => a.id === 'barun')), '📈 G759 바른경제연구원은 1순위 · 공고 · 보험 · 노무 자리엔 안 나옴(옛 광고 자리 그대로)')
봐(전화숫자('010-3658-3104') === '01036583104' && /^\d{4}-\d{2}-\d{2}$/.test(한국날()), '전화숫자 · 한국날')

console.log('③ 화면 자리 — 쪽마다 업체마다 한 번')
const 첫 = 읽('web/src/pages/FirstBoard.jsx')
봐((첫.match(/<광고칸 자리="first" \/>/g) || []).length === 1 && /i === Math\.min\(2, view\.length - 1\) && <광고칸 자리="first" \/>/.test(첫), '1순위 — 셋째 카드 다음 한 자리(first)')
봐((첫.match(/<광고칸 자리="first2" \/>/g) || []).length === 1 && /view\.length >= 8 && i === Math\.min\(9, view\.length - 1\) && <광고칸 자리="first2" \/>/.test(첫), '1순위 — 열째 카드 다음 한 자리(first2 · 8건 넘을 때만)')
봐((첫.match(/<광고칸 자리="first3" \/>/g) || []).length === 1 && /view\.length >= 15 && i === Math\.min\(16, view\.length - 1\) && <광고칸 자리="first3" \/>/.test(첫), '1순위 — 열일곱째 카드 다음 한 자리(first3 · 15건 넘을 때만)')
봐([2, 9, 16].every((x, k, a) => k === 0 || x - a[k - 1] >= 6), '「이용자가 불편하지 않게」 — 광고 사이 카드 여섯 장 넘게(셋째 · 열째 · 열일곱째) · 첫 결과 위엔 없음')
const 공 = 읽('web/src/pages/LiveBoard.jsx')
봐((공.match(/<광고칸 /g) || []).length === 1 && /const 광고 = i === Math\.min\(2, view\.length - 1\) \? <광고칸 자리="live" \/> : null/.test(공) && (공.match(/\{광고\}/g) || []).length === 2, '공고 — 셋째 카드 다음 한 자리(live · 지난 공고 줄이어도 같은 자리)')
const 보 = 읽('web/src/pages/Boheomryo.jsx'), 사 = 읽('web/src/pages/Ilyong4.jsx')
봐((보.match(/<광고칸 /g) || []).length === 1 && /<광고칸 자리="보험" \/>\n\s*<div className="detail-h"[^>]*>🗓 신고 · 납부 기한/.test(보), '보험료 계산기 — 결과 표 다음 · 신고 기한 앞 한 자리')
봐((사.match(/<광고칸 /g) || []).length === 1 && /<광고칸 자리="보험" \/>\n\s*<details className="card iy-in iy-know">/.test(사), '4대보험 판단기 — 판단 결과 카드 다음 한 자리')
const 노 = 읽('web/src/pages/Nomubi.jsx'), 휴 = 읽('web/src/pages/Hyueop.jsx')
봐((노.match(/<광고칸 /g) || []).length === 1 && /<광고칸 자리="노무" \/>\n\s*<details className="card js-more">/.test(노), '노무비 계산기 — 청구서 · 신고 다음 · 쓰는 방법 앞 한 자리(노무)')
봐((휴.match(/<광고칸 /g) || []).length === 1 && /<광고칸 자리="노무" \/>[^\n]*\n\s*<div className="card sl-guide">/.test(휴), '산재 휴업급여 계산기 — 결과 다음 · 안내 앞 한 자리(노무)')
const 물 = 읽('web/src/pages/Esc.jsx'), 계 = 읽('web/src/tools/계약칸.jsx')
봐((물.match(/<광고칸 /g) || []).length === 1 && /엑셀받기=\{엑셀받기\} \/>\n\s*\)\}\n\s*<광고칸 자리="물가" \/>[^\n]*\n\s*<\/div>\n\s*\)\n\}/.test(물) && /^import 광고칸 from '\.\.\/광고칸\.jsx'/m.test(물), '📈 G759 물가변동 ESC 산출서 — 넣기 칸 · 산출서 다음 맨 아래 한 자리(물가)')
{
  const te = 계.slice(계.indexOf('export function TimeExtension'), 계.indexOf('\n}\n', 계.indexOf('export function TimeExtension')))
  봐((계.match(/<광고칸 /g) || []).length === 1 && /<\/ol>\n\s*<광고칸 자리="공기" \/>[^\n]*\n\s*\{r\.판정 === 'yes' && \(\n\s*<details className="kt-all te-why">/.test(te) && /^import 광고칸 from '\.\.\/광고칸\.jsx'/m.test(계), '📈 G759 공기연장 때 할 일 — 할 일 목록 다음 한 자리(공기 · 다른 계약 도구엔 없음)')
}
const 칸 = 읽('web/src/광고칸.jsx')
봐(/<span className="adc-tag">광고<\/span><span className="adc-hs">\{견본 \? '견본 — 이렇게 나옵니다' : a\.추천 \? '👍 K-건설맵 추천' : '업체 소개'\}<\/span>/.test(칸) && !/보증/.test(칸.replace(/\/\*[\s\S]*?\*\//g, '')), '광고칸 — «광고 · 업체 소개» / «광고 · 👍 K-건설맵 추천» 띠 · «보증» 말 없음')
봐(/className=\{'adc no-print' \+ \(견본 \? ' adc-demo' : ''\)\}/.test(칸), '광고칸 — 인쇄에는 안 나옴(G549 견본 카드도 같은 틀 · adc-demo 만 더함)')
봐(/세기\('\|광고보임\|' \+ a\.id\)/.test(칸) && /\|광고\$\{무엇\}\|/.test(칸), '광고칸 — 숨은 셈(보임 · 전화 · 문자)')
봐(/<details className="adc-more" onToggle=\{\(e\) => \{ if \(!견본 && e\.currentTarget\.open\) \{ try \{ 세기\('\|광고더보기\|' \+ a\.id\)/.test(칸) && /<summary>📇 \{a\.정보\.map\(\(\[k\]\) => k\)\.join\(' · '\)\}<\/summary>/.test(칸), '📐 G651 광고칸 — 연락처는 «📇 …» 한 줄로 접음(누르면 펼침 · 셈 |광고더보기|id · 견본은 안 셈)')
const css = 읽('web/src/styles.css')
봐(/\.adc \{[^}]*background: var\(--ad-bg\)/.test(css) && /prefers-color-scheme: dark\) \{ :root \{ --ad-bg:/.test(css), '광고 꼴 — 크림 바탕 · 어두운 화면 색 따로')
봐(/\.adc-call, \.adc-sms \{[^}]*height: 34px/.test(css) && /\.adc-b \{ padding: 6px 10px 7px; \}/.test(css) && !/\.adc-rec \{[^}]*background/.test(css), '📐 G651 광고 크기 — 단추 34px · 여백 6/10/7 · 추천 상자 없음(소장님 「광고 크기 줄여줘」)')

console.log('④ 💬 G781 광고 문자 틀(「문자보내기를 하면, 바로 건설맵에서 보낸다는 문구가 들어가 잇는 틀」 「간단한 틀을 만들어 줘」)')
{
  const a = { 이름: '가상 보험 FP', 전화: '010-1234-5678', id: 'x' }
  봐(광고문자글(a) === '안녕하세요. K-건설맵에서 가상 보험 FP 광고 보고 연락드립니다.\n', '미리 들어가는 글 — «K-건설맵에서 ○○ 광고 보고 연락드립니다.» + 줄바꿈(이어 쓰기)', 광고문자글(a))
  봐(문자말들.length === 3 && 문자말들.every((t) => t.length <= 20 && /[.]$/.test(t)), '자주 쓰는 말 셋(짧게 · 마침표)', 문자말들)
  const 안드 = 'Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36'
  const 아폰 = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
  const 윈도 = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36'
  const 맥 = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15'
  봐([폰인가(안드, 5, 'Linux'), 폰인가(아폰, 5, 'iPhone'), 폰인가(윈도, 0, 'Win32'), 폰인가(맥, 0, 'MacIntel'), 폰인가(맥, 5, 'MacIntel')].join() === 'true,true,false,false,true', '폰인가 — 안드로이드 · 아이폰 · 아이패드(맥 꼴 + 터치) = 폰 / 윈도 · 맥 = PC')
  봐([아이폰인가(안드, 5, 'Linux'), 아이폰인가(아폰, 5, 'iPhone'), 아이폰인가(맥, 5, 'MacIntel')].join() === 'false,true,true', '아이폰인가 — 아이폰 · 아이패드')
  const 글 = 광고문자글(a) + '상담 받고 싶습니다.'
  봐(문자앱주소(a.전화, 글, false) === 'sms:01012345678?body=' + encodeURIComponent(글), '문자 앱 주소(안드로이드) — sms:번호?body=글', 문자앱주소(a.전화, 글, false))
  봐(문자앱주소(a.전화, 글, true) === 'sms:01012345678&body=' + encodeURIComponent(글), '문자 앱 주소(아이폰) — sms:번호&body=글', 문자앱주소(a.전화, 글, true))
  봐(decodeURIComponent(문자앱주소(a.전화, 글, false).split('body=')[1]) === 글 && /%0A/.test(문자앱주소(a.전화, 글, false)), '글 · 줄바꿈이 그대로 담김')
  봐(문자앱주소(a.전화, '', false) === 'sms:01012345678', '글이 없으면 번호만')
  봐(문자QR글(a.전화, '안녕하세요') === 'SMSTO:01012345678:안녕하세요', 'QR 글 — SMSTO:번호:글(폰 카메라가 문자 창으로 엶)')
  const 창 = 읽('web/src/광고문자창.jsx')
  봐(/createPortal\(/.test(창) && /e\.key === 'Escape'/.test(창) && /className="adsm-back" onClick=\{닫기\}/.test(창) && /e\.stopPropagation\(\)/.test(창), '문자 창 — 바깥 · Esc · ✕ 로 닫힘(창 안을 눌러도 안 닫힘)')
  봐(/href=\{문자앱주소\(a\.전화, 글\.trim\(\)\)\}/.test(창) && /onClick=\{QR보기\}/.test(창) && /import\('qrcode-generator'\)/.test(창) && /stringToBytesFuncs\['UTF-8'\]/.test(창), '보내기 — 폰은 문자 앱 주소 · PC 는 QR(QR 글꼴은 열 때만 받음 · 한글 UTF-8)')
  for (const k of ['광고문자보냄', '광고문자QR', '광고문자복사']) 봐(창.includes(`'${k}'`), `숨은 셈 |${k}|id`)
  봐(!/무료|클로드|유료|이용권/.test(창 + 광고문자글(a) + 문자말들.join('')), '새 글에 «무료 · 클로드 · 유료 · 이용권» 없음')
  봐(/const 문자누름 = \(e\) => \{ e\.preventDefault\(\); 누름\('문자'\)\(\); set문자틀\(true\) \}/.test(칸) && /\{문자틀 && !견본 && <광고문자창 a=\{a\} 닫기=\{\(\) => set문자틀\(false\)\} \/>\}/.test(칸), '광고칸 — «💬 문자» 누르면 틀 창(견본은 안 엶) · 셈 |광고문자| 그대로')
}

console.log(`\n${실패 ? '✗' : '✓'} 시험_광고자료 ${통과}/${통과 + 실패}`)
process.exit(실패 ? 1 : 0)
