/**
 * 🏁 낙찰 서류 한 벌 — 1순위(낙찰)가 된 공고 하나로 «계약 → 착공 → 안전 → 공사 중 → 돈» 서류를 차례대로, 공사명 · 발주 · 계약금액을 채운 채로 (G499 · 2026-11-01)
 *
 * 소장님: 바로투찰 아이디어 「1부터 4까지 한 번에 만들어서 완벽하게 검증 후에 올리자」 — ④ «낙찰 → 서류 한 벌 자동»
 *   «1순위가 되면 그 공고 자료(공사명 · 발주처 · 금액)로 착공계 · 안전 · TBM · 공정표 · 공사일보까지 미리 채워진 묶음이 열림»
 * ■ 이미 있는 것을 잇기만 합니다(새 서식을 만들지 않음):
 *     서식(종이 · 사이트에서 작성)은 «한 번 쓰면 다른 서식에도» 공통 칸(localStorage kcm.서식공통)을 이미 읽습니다(tools/격자작성.jsx · tools/서식작성.jsx) —
 *     여기서 그 공통 칸(현장 · 발주 · 계약금액 · 회사 · 대리인 · 착공 · 준공 · 위치)을 채우고 서식으로 보냅니다.
 *     날짜(언제까지)는 도구 «낙찰 뒤 할 일 달력»(/tools/after-award) · 산출내역서는 내역서 탭 — 겹치지 않게 링크만.
 * ■ 서식이 «이미 쓰던 것» 이면 그 서식은 쓰던 값 그대로 엽니다(덮어쓰지 않음) — «🧹 빈칸으로» 를 누르면 새 공통 값으로 채워짐(화면에 적음).
 * ■ 이 기기에만 남습니다(서버로 안 감). 시험: tools/시험_낙찰한벌.mjs
 */
export const 공통열쇠 = 'kcm.서식공통'
export const 한벌열쇠 = 'kcm.한벌'          // 마지막에 연 한 벌(공고 · 값) — 화면이 다시 열면 그대로

/** 한 벌 차례 — [단계, 할 일 한 줄, 서식(slug) 또는 도구 주소, 언제] · slug 는 forms.json 에 있는 것만(시험이 대 봄) */
export const 한벌차례 = [
  { k: '계약', ic: '✍️', 들: [
    { to: '/tools/after-award', t: '낙찰 뒤 할 일 달력', d: '계약 10일 · 키스콘 30일 · 착공 전 안전 서류 · 보험 신고 14일 · 하도급 30일 — 날짜를 뽑아 폰 달력에', 도구: true },
    { slug: 'gy-dogeup', t: '공사도급계약서', d: '도급계약서 — 계약금액 · 공기 · 지체상금률' },
    { slug: 'cheongryeom', t: '청렴계약 이행서약서', d: '청렴계약 이행서약서 — 계약 때 같이' },
    { slug: 'sayonginmgye', t: '사용인감계', d: '사용인감계 — 계약 · 기성 · 준공에 쓸 도장' },
  ] },
  { k: '착공', ic: '🚧', 들: [
    { slug: 'chakgong', t: '착공계', d: '착공계 — 착공일 · 현장대리인 · 공정표 · 산출내역서를 붙여' },
    { slug: 'daeriin', t: '현장대리인계', d: '현장대리인계 — 자격증 · 재직증명 사본' },
    { slug: 'gongjeongpyo', t: '공사예정공정표', d: '공사예정공정표 — 착공계에 붙임' },
    { to: '/naeyeok', t: '산출내역서', d: '100억 미만 공사는 착공신고 때 냄 — 공내역서에 단가 · 낙찰금액에 맞춤(내역서 탭)', 도구: true },
    { slug: 'jikjeop-sigong-gyehoek', t: '직접시공계획서', d: '직접시공계획서 — 70억 미만 · 계약 뒤 30일' },
    { slug: 'hyeonjang-gaeseol', t: '현장 개설 보고서', d: '현장 개설 보고서' },
  ] },
  { k: '안전', ic: '⛑', 들: [
    { slug: 'anjeonbi-gyehoek', t: '산업안전보건관리비 사용계획서', d: '산업안전보건관리비 사용계획서' },
    { slug: 'anjeon-gyehoek', t: '안전관리계획서 표지·목차', d: '안전관리계획서 표지 · 목차 — 대상 공사만(착공 전 승인)' },
    { slug: 'yuhae-gyehoek', t: '유해위험방지계획서 표지·목차', d: '유해위험방지계획서 표지 · 목차 — 대상 공사만(착공 전날까지)' },
    { slug: 'wih-choego', t: '최초·정기 위험성평가서', d: '최초 위험성평가서 — 작업 시작 전' },
    { slug: 'tbm-hoeui', t: 'TBM 회의록(Tool Box Meeting)', d: 'TBM 회의록 — 날마다 작업 전(위험요인 → 안전조치 확인 저절로)' },
  ] },
  { k: '공사 중', ic: '🏗', 들: [
    { slug: 'jakeop-ilbo', t: '작업일보', d: '작업일보' },
    { to: '/tools/photo-live', t: '실시간 사진대지', d: '폰으로 찍으면 PC 사진대지에 바로', 도구: true },
    { slug: 'hadogeup-tongbo', t: '하도급 통보서', d: '하도급 통보서 — 하도급계약 뒤 30일' },
  ] },
  { k: '돈', ic: '💰', 들: [
    { slug: 'seongeum', t: '선금 신청서', d: '선금 신청서 — 계약 뒤 · 보증서와 함께' },
    { slug: 'gisung-cheonggu', t: '기성금 청구서', d: '기성금 청구서' },
    { slug: 'jungong', t: '준공계', d: '준공계 · 준공대가 청구' },
  ] },
]

/** 공통 칸 이름 — 서식이 읽는 열쇠(tools/격자작성.jsx 공통칸 · tools/서식작성.jsx 공통칸과 같은 이름) */
export const 한벌칸 = [
  ['현장', '공사명', true], ['발주', '발주기관', true], ['계약금액', '계약금액(원)', true],
  ['회사', '회사명(우리 회사)'], ['대리인', '현장대리인'], ['착공', '착공일'], ['준공', '준공일'], ['위치', '현장 위치'],
]

const 쉼 = (n) => (Number(n) > 0 ? Math.round(Number(n)).toLocaleString('ko-KR') : '')

/** 공고 → 한 벌 주소(/forms/hanbeol?no=…&n=…&i=…&a=…) — 값은 주소에 실어 보냄(개찰 7일이 지나도 열림) */
export function 한벌주소({ no = '', 이름 = '', 발주 = '', 금액 = 0 } = {}) {
  const q = new URLSearchParams()
  if (no) q.set('no', String(no).slice(0, 30))
  if (이름) q.set('n', String(이름).slice(0, 80))
  if (발주) q.set('i', String(발주).slice(0, 40))
  if (Number(금액) > 0) q.set('a', String(Math.round(Number(금액))))
  const s = q.toString()
  return '/forms/hanbeol' + (s ? '?' + s : '')
}

/** 주소 → 처음 값 {no, 현장, 발주, 계약금액} */
export function 주소값(search) {
  const q = new URLSearchParams(String(search || '').replace(/^\?/, ''))
  const a = Number(String(q.get('a') || '').replace(/[^0-9]/g, '')) || 0
  return { no: (q.get('no') || '').slice(0, 30), 현장: (q.get('n') || '').slice(0, 80), 발주: (q.get('i') || '').slice(0, 40), 계약금액: a > 0 ? 쉼(a) : '' }
}

/** 공통 칸에 넣기 — 빈 값은 건드리지 않음(지난번 회사명 · 대리인은 그대로) · 돌려줌: 넣은 칸 수 */
export function 공통넣기(값, 저장소 = (typeof localStorage !== 'undefined' ? localStorage : null)) {
  if (!저장소) return 0
  let 공통 = {}
  try { 공통 = JSON.parse(저장소.getItem(공통열쇠) || '{}') || {} } catch (e) { 공통 = {} }
  let n = 0
  for (const [k] of 한벌칸) {
    const v = String((값 && 값[k]) || '').trim()
    if (v) { 공통[k] = v.slice(0, 80); n++ }
  }
  try { 저장소.setItem(공통열쇠, JSON.stringify(공통)) } catch (e) { return 0 }
  return n
}

/** 지금 공통 칸 — 화면 처음 값(주소 값이 먼저 · 없으면 지난번) */
export function 공통읽기(저장소 = (typeof localStorage !== 'undefined' ? localStorage : null)) {
  try { return (저장소 && JSON.parse(저장소.getItem(공통열쇠) || '{}')) || {} } catch (e) { return {} }
}
