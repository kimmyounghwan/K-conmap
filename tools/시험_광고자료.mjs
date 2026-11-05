/**
 * 🧪 업체 광고 자료(lib/광고자료.js) · 자리 — 2026-11-05 (인터넷 · 빌드 · playwright 없이 — PC 올리기 시험에도)
 *   node tools/시험_광고자료.mjs
 *   소장님 「한 페이지에 한번씩만」 · 「보증하지 않습니다 … 빼줘」 · 「유안굴착은 1순위쪽에」 · 「1순위 1페이지에 뜨게 해줘. 유안굴착하고, 보험...」
 *   ① 자료 꼴(아이디 겹침 없음 · 자리 · 전화 꼴 · 지역은 시 · 구까지 · 업체를 깎는 말 없음)
 *   ② 자리 고르기(기간 · 심의필요 · 돌아가며 고르게) ③ 화면 자리(1순위 둘 · 보험료 계산기 · 4대보험 판단기 — 쪽마다 업체마다 한 번)
 */
import fs from 'node:fs'
import { 광고들, 자리후보, 자리광고, 전화숫자, 한국날 } from '../web/src/lib/광고자료.js'
let 통과 = 0, 실패 = 0
const 봐 = (c, 무엇, 더) => { if (c) { 통과++; console.log('  ✓', 무엇) } else { 실패++; console.log('  ✗', 무엇, 더 === undefined ? '' : '— ' + JSON.stringify(더)) } }
const 읽 = (p) => fs.readFileSync(new URL('../' + p, import.meta.url), 'utf8').replace(/\r\n/g, '\n')

console.log('① 자료 꼴')
봐(new Set(광고들.map((a) => a.id)).size === 광고들.length, '아이디 겹침 없음', 광고들.map((a) => a.id))
for (const a of 광고들) {
  봐(/^[a-z0-9-]+$/.test(a.id), `${a.이름}: 아이디 «${a.id}» 는 영문 소문자 · 숫자 · - (숨은 셈 열쇠)`)
  봐(Array.isArray(a.자리) && a.자리.length > 0 && a.자리.every((x) => ['first', 'first2', 'first3', 'live', '보험', '노무'].includes(x)) && (a.고정자리 || []).every((x) => a.자리.includes(x)), `${a.이름}: 자리 ${JSON.stringify(a.자리)}${a.고정자리 ? ' · 고정 ' + JSON.stringify(a.고정자리) : ''}`)
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
봐(광고들.filter((a) => a.추천).map((a) => a.id).sort().join() === 'kb-jsd,kc-dy,yuan', '«K-건설맵 추천» 은 유안굴착 · 정순덕 · 강천 · 대유 세 곳만(소장님 — 박현희는 업체 소개)', 광고들.filter((a) => a.추천).map((a) => a.id))
봐(광고들.find((a) => a.id === 'kc-dy').대표 === '정종석' && 광고들.find((a) => a.id === 'yuan').대표 === '안정현' && 광고들.every((a) => !a.대표 || /^[가-힣]{2,5}$/.test(a.대표)), '대표 이름 — 명함 그대로(강천 · 대유 정종석 · 유안굴착 안정현 · 소장님 「대표이름 넣어 줘.」) · 이름 꼴만')
봐(['kc-dy', 'yuan', 'kb-jsd', 'kb-phh'].every((id) => { const a = 광고들.find((x) => x.id === id); const k = (a.정보 || []).map((x) => x[0]); return ['사무실', '팩스', '메일', '주소'].every((n) => k.includes(n)) }), '넷 다 명함 그대로 — 사무실 · 팩스 · 메일 · 주소(소장님 「다 넣어 줘」)')
봐(JSON.stringify(광고들.find((a) => a.id === 'kc-dy').정보) === JSON.stringify([['사무실', '061-835-6788 · 061-842-6789'], ['팩스', '061-844-1650'], ['메일', 'jinhung1650@naver.com'], ['주소', '전남 고흥군 고흥읍 여산당촌길 23, 2층']]), '강천 · 대유 정보 = 명함(두 번 대조)')
봐(JSON.stringify(광고들.find((a) => a.id === 'yuan').정보) === JSON.stringify([['사무실', '063-909-0555'], ['팩스', '063-909-3103'], ['메일', 'yuan0555@nate.com'], ['주소', '전북 전주시 덕진구 동부대로 670 클래시아A 101동 1101호']]), '유안굴착 정보 = 명함')
봐(광고들.find((a) => a.id === 'kb-jsd').정보.some(([k, v]) => k === '메일' && v === 'sun9715suns@naver.com') && 광고들.find((a) => a.id === 'kb-phh').정보.some(([k, v]) => k === '메일' && v === 'hyoun2636@hanmail.net'), '보험 두 분 메일 = 명함')
for (const a of 광고들.filter((x) => x.추천)) 봐(!/최고|1위|최저|보장|무료|100%|확실/.test(a.추천) && a.추천.length <= 60, `${a.이름}: 추천 글은 사실로만 · 짧게(«최고 · 1위 · 보장» 없음) «${a.추천}»`)

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
const 칸 = 읽('web/src/광고칸.jsx')
봐(/<span className="adc-tag">광고<\/span><span className="adc-hs">\{견본 \? '견본 — 이렇게 나옵니다' : a\.추천 \? '👍 K-건설맵 추천' : '업체 소개'\}<\/span>/.test(칸) && !/보증/.test(칸.replace(/\/\*[\s\S]*?\*\//g, '')), '광고칸 — «광고 · 업체 소개» / «광고 · 👍 K-건설맵 추천» 띠 · «보증» 말 없음')
봐(/className=\{'adc no-print' \+ \(견본 \? ' adc-demo' : ''\)\}/.test(칸), '광고칸 — 인쇄에는 안 나옴(G549 견본 카드도 같은 틀 · adc-demo 만 더함)')
봐(/세기\('\|광고보임\|' \+ a\.id\)/.test(칸) && /\|광고\$\{무엇\}\|/.test(칸), '광고칸 — 숨은 셈(보임 · 전화 · 문자)')
const css = 읽('web/src/styles.css')
봐(/\.adc \{[^}]*background: var\(--ad-bg\)/.test(css) && /prefers-color-scheme: dark\) \{ :root \{ --ad-bg:/.test(css), '광고 꼴 — 크림 바탕 · 어두운 화면 색 따로')

console.log(`\n${실패 ? '✗' : '✓'} 시험_광고자료 ${통과}/${통과 + 실패}`)
process.exit(실패 ? 1 : 0)
