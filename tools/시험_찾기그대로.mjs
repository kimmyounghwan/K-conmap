/**
 * 🔎 G625 빠른 찾기 «전과 그대로» 시험 — node tools/시험_찾기그대로.mjs
 *   소장님(11-09): 「이미 만들어 놓은 것 잘못되지 않게 조심해 줘」 · 「다른 탭도 잘 봐줘. 틀어지지 안게」
 *   자격증(종목 83 · 등급 셈 · 자격증 탭)을 찾기에 넣으면서, 전에 찾던 말의 결과 차례가 바뀌지 않는지 봅니다.
 *   전(G624) = 탭에 «분석»(/analysis) · 자격증 없음  /  지금(G625) = 탭에 «자격증» · 분석은 1순위 안 · 자격증 자료 들어감
 *   ① 자격 말(기사 · 기술사 · 기능사 · 자격 · 시험 · 등급 …)이 없는 말 120여 개 — 결과 30줄이 전과 «똑같음»(자격증 줄은 맨 뒤에만)
 *   ② 자격 말이 있는 말 — 전에 나오던 줄들의 차례는 그대로(자격증 줄이 사이에 들어가도 됨)
 *   ③ «분석» · «발주기관 분석» · «업체 분석» — 맨 위가 전과 같은 /analysis(제목 «분석»)
 *   ④ «토목기사» · «거푸집기능사» · «특급» · «경력수첩» — 자격증 쪽이 맨 위
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
const 여기 = path.dirname(fileURLToPath(import.meta.url))
const L = await import(pathToFileURL(path.join(여기, '..', 'web', 'src', 'lib', '빠른찾기.js')).href)
const 읽 = (f) => JSON.parse(fs.readFileSync(path.join(여기, '..', 'web', 'src', 'data', f), 'utf8'))

let ok = 0, bad = 0
const 봐 = (c, m, 더 = '') => { if (c) ok++; else bad++; console.log((c ? '  ✓ ' : '  ✗ ') + m + (c ? '' : ' — ' + String(더).slice(0, 700))) }

/* App.jsx 의 TABS(지금) — { to, ic, label } 만 읽음 */
const app = fs.readFileSync(path.join(여기, '..', 'web', 'src', 'App.jsx'), 'utf8')
const 지금탭 = [...app.matchAll(/^\s*\{ to: '([^']*)', ic: '([^']+)', label: '([^']+)'/gm)].map((m) => ({ to: m[1], ic: m[2], label: m[3] }))
봐(지금탭.length === 10 && 지금탭.some((x) => x.to === '/cert') && !지금탭.some((x) => x.to === '/analysis'), `탭 10개 · 자격증 있음 · 분석 없음(1순위 안) — ${지금탭.map((x) => x.label).join(' · ')}`)
/* 전(G624) 탭 — 자격증 자리에 분석 */
const 전탭 = 지금탭.map((x) => (x.to === '/cert' ? { to: '/analysis', ic: '🔍', label: '분석' } : x))

const 자료 = { tools: 읽('tools.json'), forms: 읽('forms-min.json'), change: 읽('change.json'), guide: 읽('guide.json'), cad: 읽('cad.json') }
const 전목 = L.목록만들기({ 탭: 전탭, ...자료 })
const 지금목 = L.목록만들기({ 탭: 지금탭, ...자료, cert: 읽('cert.json') })
const 자격쪽 = (x) => x.갈래 === '자격증' || x.to === '/cert'
봐(지금목.filter((x) => !자격쪽(x)).length === 전목.length, `자격증 말고는 목록 수가 같음(전 ${전목.length} · 지금 ${지금목.filter((x) => !자격쪽(x)).length})`)
봐(지금목.filter((x) => x.갈래 === '자격증').length >= 80, '자격증 줄 80개 넘게(종목 83 + 등급 셈)', 지금목.filter((x) => x.갈래 === '자격증').length)
const 분 = (목) => 목.find((x) => x.to === '/analysis') || {}
봐(JSON.stringify([분(전목).t, 분(전목).d, 분(전목).ic]) === JSON.stringify([분(지금목).t, 분(지금목).d, 분(지금목).ic]), '«분석»(/analysis) 줄 — 제목 · 설명 · 아이콘 전과 같음', [분(전목).t, 분(지금목).t])

const 말들 = `노무비 거푸집 철근 철근 무게 콘크리트 레미콘 토목 건축 측량 지적 지질 안전 분석 1순위 공고 투찰 사정률 하한율 낙찰하한율 내역서 적산 서식 일보 작업일보 공사일보
 출역부 출력부 퇴직금 실업급여 주휴수당 휴업급여 산재 보험료 기성 기성청구 설계변경 착공계 착공 준공 하도급 견적 견적서 단가 물량 토공 토량 흙막이 비계 타일 방수 도배 미장 유리 창호 조적 철골
 용접 배관 전기 소방 조경 도로 교량 터널 하천 상수도 하수도 재료 품질 덤프 장비 크레인 펌프카 맵톡 구인 구직 일자리 광고 달력 공휴일 연차 최저임금 계약 보증 인지세 하자 공기연장 폐기물
 비산먼지 소음 위험성평가 안전교육 보호구 tbm 산안비 안전관리비 캐드 도면 pdf 엑셀 사진대지 지명원 손익 실행예산 유류 장비일보 청렴 지급기한 공동도급 시평 참가자격 적격심사 a값 기초금액
 예정가격 개찰 낙찰 업체 기관 발주기관 업체 분석 발주기관 분석 ㄱㅍㅈ ㄴㅁㅂ 철근 콘크리트 거푸집 면적 토목 설계 건축 설계 측량 성과 지적 측량 안전 점검 품질 관리 공정표 공정 일정`.split(/\s+/).filter(Boolean)
const 묶음 = [...new Set(말들)].concat(['철근 무게', '거푸집 면적', '토목 설계', '건축 설계', '안전 점검', '품질 관리', '업체 분석', '발주기관 분석', '낙찰 하한율'])
const 키 = (r) => r.map((x) => x.갈래 + '|' + x.to + '|' + x.t).join('\n')
let 같음 = 0
const 다름 = []
for (const q of 묶음) {
  if (L.자격말.test(q)) continue
  const a = L.찾기(전목, q, 30), b = L.찾기(지금목, q, 30)
  const b앞 = b.slice(0, a.length)
  if (키(a) === 키(b앞) && b.slice(a.length).every(자격쪽)) 같음++
  else 다름.push(q + ' :: 전 ' + a.slice(0, 4).map((x) => x.t).join('/') + ' · 지금 ' + b.slice(0, 4).map((x) => x.t).join('/'))
}
봐(!다름.length && 같음 >= 100, `① 자격 말 없는 ${같음}개 — 결과 30줄 전과 똑같음(자격증 줄은 맨 뒤만)`, 다름.slice(0, 5).join(' | '))

const 자격들 = ['토목기사', '건축기사', '거푸집기능사', '토목시공기술사', '건설안전기사', '품질시험', '시험', '특급', '경력수첩', '등급', '기술사', '기사 시험']
const 차례깨짐 = []
for (const q of 자격들) {
  const a = L.찾기(전목, q, 30), b = L.찾기(지금목, q, 60).filter((x) => !자격쪽(x))
  const ka = a.map((x) => x.to), kb = b.map((x) => x.to).filter((t) => ka.includes(t))
  if (ka.filter((t) => kb.includes(t)).join() !== kb.join()) 차례깨짐.push(q)
}
봐(!차례깨짐.length, '② 자격 말이 있어도 — 전에 나오던 줄들의 차례 그대로', 차례깨짐.join(' · '))

const 맨위 = (목, q) => (L.찾기(목, q, 5)[0] || {}).to
봐(['분석', '발주기관 분석', '업체 분석'].every((q) => 맨위(전목, q) === 맨위(지금목, q)), '③ «분석» · «발주기관 분석» · «업체 분석» — 맨 위가 전과 같음', ['분석', '발주기관 분석', '업체 분석'].map((q) => 맨위(전목, q) + '/' + 맨위(지금목, q)).join(' '))
const 기대 = [['토목기사', /^\/cert/], ['거푸집기능사', /^\/cert/], ['토목시공기술사', /^\/cert\/tomok-sigong-gisulsa$/], ['특급', /^\/cert\/grade$/], ['경력수첩', /^\/cert\/grade$/]]
봐(기대.every(([q, re]) => re.test(맨위(지금목, q) || '')), '④ 자격 이름 · 등급 말 — 자격증 쪽이 맨 위', 기대.map(([q]) => q + '→' + 맨위(지금목, q)).join(' '))

console.log(`\n${bad ? '❌' : '✅'} 시험_찾기그대로 ${ok}/${ok + bad}`)
process.exit(bad ? 1 : 0)
