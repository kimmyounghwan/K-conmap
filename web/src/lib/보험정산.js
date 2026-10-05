/**
 * 🩺 국민건강 · 연금보험료 정산 청구서 — 셈 (G146 · 2026-10-05)
 *
 * 소장님: (카페 «하청인데 원청에 건강·연금·안전관리비 청구 방법/양식») 「서식없어???」 → 「어떤 서식이 있지?」 →
 *         「만들 수 있어? 다운 받게 해야 해, 아니면 사이트에서 쓰고, 다운받게 해줘야 해?」 → (클로드) 사이트에서 쓰고 엑셀로 받기 → 「해」
 *         「수식을 확실하게 넣을 수 있어?」 → 「그럼, 한 번 이면 끝이잖아 ㅎㅎ」 → 엑셀은 원칙대로 «값만» · 다음 회차는 사이트에서 이어 쓰기
 *
 * ■ 근거 — 「(계약예규) 정부 입찰ㆍ계약 집행기준」 [재정경제부계약예규 제172호, 2026. 8. 25. 시행] 제19장 (law.go.kr 원문 2026-10-05 확인)
 *   제91조  국민건강보험료 · 노인장기요양보험료 · 국민연금보험료 · 퇴직급여충당금 · 퇴직공제부금 = «국민건강보험료 등» 사후정산
 *   제94조① 기성대가 청구 때 붙임: 1. 국민건강보험료 등의 납입확인서(하수급인의 보험료 납입확인서 포함)
 *                                  2. 전회분 기성대가에 포함하여 지급된 보험료 중 해당부분을 하수급인에게 지급하였음을 증빙하는 서류
 *   제94조② 하도급 포함 전체 납부 여부 확인 → 입찰공고 등에 고지된 금액(계상액) «범위 내에서» 최종 정산
 *   제94조③ 사업자 부담분의 납입확인서 금액을 정산
 *           1. 일용근로자 = 해당 사업장단위로 기재된 납입확인서의 납입금액
 *           2. 생산직 상용근로자(직접노무비 대상) = 소속회사 납입확인서 + 현장인 명부 등으로 «실제로 투입된 일자» 를 계산해 일할 정산
 *              (해당 사업장단위로 따로 납부했으면 1호처럼)
 *   ⚠️ 예규에 «정산 청구서» 서식(별지)은 없습니다 — 이 청구서는 «정해진 서식이 아님». 원청이 정한 양식이 있으면 그것을 씁니다.
 *
 * ■ 이 프로그램의 셈 (화면 · 종이 · 엑셀이 모두 이것 하나)
 *   사업자 부담분 = 확인서 금액 ÷ 2 (확인서 금액이 «근로자 + 사업주 합» 일 때 · 기본) 또는 그대로(«사업주 몫만» 을 적었을 때)
 *   청구액 = 사업자 부담분 × 비율 (원 미만 버림)
 *     일용 = 비율 1 (현장 사업장 확인서 금액 그대로)
 *     상용 = 투입일 ÷ 그달 일수 (그달 일수는 비우면 달력 일수 — 원청이 다른 분모를 쓰면 고쳐 넣음)
 *   계상액(내역서) · 전회까지 · 이번 · 누계 · 남은 금액 — 보험 종류마다(건강 · 요양 · 연금)
 *
 * ■ 저장: 이 브라우저(localStorage 'kcm_bjs1') + 🔗 코드 + 비밀번호로 폰·PC 이어 쓰기(ns 'bj' — lib/이어쓰기.js)
 *   한 공사에 회차(제1회 · 제2회 …)를 쌓고, «전회까지» 는 앞 회차 청구액 합 + «이 프로그램 쓰기 전 받은 금액».
 */
export const 열쇠 = 'kcm_bjs1'
export const 근거 = '「(계약예규) 정부 입찰ㆍ계약 집행기준」 제94조'
export const 근거주소 = 'https://www.law.go.kr/행정규칙/(계약예규)정부입찰ㆍ계약집행기준'
export const 종류들 = [
  { k: 'h', 이름: '건강', 긴이름: '국민건강보험료' },
  { k: 'y', 이름: '장기요양', 긴이름: '노인장기요양보험료' },
  { k: 'p', 이름: '국민연금', 긴이름: '국민연금보험료' },
]

export const 수 = (v) => { const x = Number(String(v ?? '').replace(/[^\d.-]/g, '')); return Number.isFinite(x) ? x : 0 }
export const 원 = (n) => Math.round(n || 0).toLocaleString('ko-KR')
let 번 = 0
export const 새번호 = () => `${Date.now().toString(36)}${(번++).toString(36)}${Math.random().toString(36).slice(2, 5)}`

/** 'YYYY-MM' 의 달력 일수 — 틀린 꼴이면 0 */
export function 달일수(ym) {
  const m = String(ym || '').match(/^(\d{4})-(\d{2})$/)
  if (!m) return 0
  const y = Number(m[1]), mo = Number(m[2])
  if (mo < 1 || mo > 12) return 0
  return new Date(y, mo, 0).getDate()
}

/** 여러 꼴의 달 → 'YYYY-MM' (2026-09 · 2026.9 · 2026/09 · 2026년 9월 · 202609 · 26.9) — 못 읽으면 '' */
export function 달읽기(s) {
  const t = String(s ?? '').trim()
  if (!t) return ''
  let m = t.match(/^(\d{4})\s*[-./년]\s*(\d{1,2})/)
  if (!m) m = t.match(/^(\d{4})(\d{2})$/)
  if (!m) { const k = t.match(/^(\d{2})\s*[-./]\s*(\d{1,2})$/); if (k) m = [k[0], '20' + k[1], k[2]] }
  if (!m) return ''
  const mo = Number(m[2])
  if (mo < 1 || mo > 12) return ''
  return `${m[1]}-${String(mo).padStart(2, '0')}`
}

export const 빈줄 = (k = '상용', 덧 = {}) => ({ id: 새번호(), k, n: '', m: '', d: '', t: '', h: '', y: '', p: '', x: '', ...덧 })
export const 빈회 = (n = 1, 덧 = {}) => ({ id: 새번호(), n, 시작: '', 끝: '', 작성: '', 줄: [], ...덧 })
export const 빈공사 = () => ({
  id: 새번호(),
  공사명: '', 청구인: '', 대표: '', 받는곳: '',
  기준: 'sum',                       // 'sum' 확인서 금액 = 근로자 + 사업주 합(사업자 부담분 = ½) · 'emp' 사업주 몫만 적음
  계상: { h: '', y: '', p: '' },     // 내역서(하도급 산출내역서)의 보험료 계상액 — 정산 «범위» (제94조②)
  앞: { h: '', y: '', p: '' },       // 이 프로그램을 쓰기 전에 이미 청구 · 받은 금액(전회까지에 더함)
  회들: [빈회(1)],
  지금: null,
})
export const 빈상태 = () => { const c = 빈공사(); c.지금 = c.회들[0].id; return { cur: c, 모음: [] } }

/** 모양 고르기 — 옛 저장 · 이어 쓰기로 받은 것 · 붙여 넣은 것 모두 이것을 지남 */
export function 고르기(c0) {
  const b = 빈공사()
  const c = c0 && typeof c0 === 'object' ? c0 : {}
  const 셋 = (o) => ({ h: String(o && o.h != null ? o.h : ''), y: String(o && o.y != null ? o.y : ''), p: String(o && o.p != null ? o.p : '') })
  const 회들 = (Array.isArray(c.회들) && c.회들.length ? c.회들 : b.회들).map((r, i) => ({
    ...빈회(i + 1), ...r,
    n: Number.isFinite(Number(r && r.n)) && Number(r.n) > 0 ? Math.floor(Number(r.n)) : i + 1,
    줄: Array.isArray(r && r.줄) ? r.줄.map((x) => ({ ...빈줄(), ...x, k: x && x.k === '일용' ? '일용' : '상용' })) : [],
  }))
  const out = { ...b, ...c, 기준: c.기준 === 'emp' ? 'emp' : 'sum', 계상: 셋(c.계상), 앞: 셋(c.앞), 회들 }
  for (const k of ['공사명', '청구인', '대표', '받는곳']) out[k] = String(out[k] ?? '')
  if (!out.회들.some((r) => r.id === out.지금)) out.지금 = out.회들[out.회들.length - 1].id
  return out
}

export function 읽기() {
  try {
    const s = JSON.parse(localStorage.getItem(열쇠) || 'null')
    if (s && s.cur && typeof s.cur === 'object') {
      return { cur: 고르기(s.cur), 모음: Array.isArray(s.모음) ? s.모음.filter((x) => x && x.data).slice(0, 20) : [] }
    }
  } catch (e) { /* 깨진 저장 */ }
  return 빈상태()
}
export function 쓰기(s) { try { localStorage.setItem(열쇠, JSON.stringify(s)); return true } catch (e) { return false } }

/**
 * 한 줄 셈
 * @returns {{몫:{h,y,p}, 청:{h,y,p}, 합:number, 비율:number, 분자:number, 분모:number, 알림:string[], 빈:boolean}}
 */
export function 줄셈(r, 기준 = 'sum') {
  const 알림 = []
  const 반 = 기준 !== 'emp'
  const 몫 = {}, 청 = {}
  const 상용 = r.k !== '일용'
  const 분모 = 수(r.t) > 0 ? 수(r.t) : 달일수(r.m)
  const 분자 = 수(r.d)
  let 비율 = 1
  if (상용) {
    if (!r.m) 알림.push('해당 월을 넣어 주십시오 — 그달 일수로 나눕니다.')
    if (!(분자 > 0)) 알림.push('회사 고지 줄은 현장 투입일을 넣어야 일할 정산됩니다(현장인 명부 · 출역부) — 지금은 0원.')
    if (분자 > 0 && 분모 > 0 && 분자 > 분모) 알림.push(`투입일(${분자}일)이 그달 일수(${분모}일)보다 많습니다.`)
    비율 = 분모 > 0 && 분자 > 0 ? Math.min(1, 분자 / 분모) : 0
  }
  let 합 = 0, 적음 = false
  for (const { k } of 종류들) {
    const a = Math.max(0, 수(r[k]))
    if (a > 0) 적음 = true
    몫[k] = 반 ? Math.floor(a / 2) : a
    청[k] = Math.floor(몫[k] * 비율 + 1e-9)
    합 += 청[k]
  }
  if (반) for (const { k, 이름 } of 종류들) if (수(r[k]) > 0 && Math.round(수(r[k])) % 2 === 1) 알림.push(`${이름} 확인서 금액이 홀수입니다 — 사업주 몫만 적은 것이면 위에서 «사업주 몫만» 을 고르십시오.`)
  return { 몫, 청, 합, 비율, 분자, 분모, 알림, 빈: !적음 }
}

const 영 = () => ({ h: 0, y: 0, p: 0 })
const 더 = (a, b) => ({ h: a.h + b.h, y: a.y + b.y, p: a.p + b.p })
export const 셋합 = (o) => o.h + o.y + o.p

/** 한 회차 셈 — 줄마다 + 합(확인서 금액 · 청구액) */
export function 회셈(회, 기준 = 'sum') {
  const 줄 = (회 && 회.줄 ? 회.줄 : []).map((r) => ({ r, ...줄셈(r, 기준) }))
  let 확인 = 영(), 청 = 영()
  for (const x of 줄) {
    확인 = 더(확인, { h: Math.max(0, 수(x.r.h)), y: Math.max(0, 수(x.r.y)), p: Math.max(0, 수(x.r.p)) })
    청 = 더(청, x.청)
  }
  return { 줄, 확인, 청, 합: 셋합(청), 상용: 줄.filter((x) => x.r.k !== '일용').length, 일용: 줄.filter((x) => x.r.k === '일용').length }
}

/** 공사 전체 — 지금 회차의 «전회까지 · 이번 · 누계 · 남은 금액» (계상액 범위, 제94조②) */
export function 공사셈(c) {
  const 지금회 = c.회들.find((r) => r.id === c.지금) || c.회들[c.회들.length - 1]
  const 이번 = 회셈(지금회, c.기준)
  let 전 = { h: 수(c.앞.h), y: 수(c.앞.y), p: 수(c.앞.p) }
  for (const r of c.회들) if (r.id !== 지금회.id && r.n < 지금회.n) 전 = 더(전, 회셈(r, c.기준).청)
  const 누 = 더(전, 이번.청)
  const 계 = { h: 수(c.계상.h), y: 수(c.계상.y), p: 수(c.계상.p) }
  const 계있음 = 셋합(계) > 0
  const 남 = { h: 계.h - 누.h, y: 계.y - 누.y, p: 계.p - 누.p }
  const 넘음 = 계있음 ? 종류들.filter(({ k }) => 계[k] > 0 && 누[k] > 계[k]).map(({ 긴이름 }) => 긴이름) : []
  return { 회: 지금회, 이번, 전, 누, 계, 계있음, 남, 넘음 }
}

/** 붙임 서류 — 이 회차에 적은 줄에 맞게 */
export function 붙임들(이번) {
  const out = []
  const 일 = 이번.일용 > 0, 상 = 이번.상용 > 0
  const 어디 = 일 && 상 ? ' — 현장 사업장분 · 소속 회사분' : 일 ? ' — 현장 사업장분' : 상 ? ' — 소속 회사분' : ''
  out.push(`국민건강보험료 · 노인장기요양보험료 납부(납입)확인서${어디}`)
  out.push(`국민연금보험료 납부(납입)확인서${어디}`)
  if (상) out.push('현장인 명부(출역부) 등 투입일 확인 서류 — 회사 고지분 일할 정산')
  return out
}

/** 새 회차 — 앞 회차의 «사람 줄» 을 그대로(달은 다음 달 · 금액 · 투입일은 비움) */
export function 다음회(c) {
  const 끝회 = c.회들.reduce((a, r) => (r.n > a.n ? r : a), c.회들[0])
  const 다음달 = (ym) => { const m = String(ym || '').match(/^(\d{4})-(\d{2})$/); if (!m) return ''; const d = new Date(Number(m[1]), Number(m[2]), 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` }
  const 본 = new Set()
  const 줄 = []
  for (const r of 끝회.줄) {
    const 열 = `${r.k}|${r.n}`
    if (본.has(열)) continue
    본.add(열)
    줄.push(빈줄(r.k, { n: r.n, m: 다음달(r.m), x: '' }))
  }
  return 빈회(끝회.n + 1, { 줄 })
}

/**
 * 📋 엑셀에서 붙여 넣기 — 줄마다 탭(또는 쉼표 둘 이상)으로 나뉜 칸:
 *   구분 · 성명(내용) · 해당 월 · 투입일 · 그달 일수 · 건강 · 장기요양 · 국민연금 · 비고
 *   머리 줄(«구분» 이 든 줄)은 건너뜀 · 구분 칸에 «현장» 또는 «일용» 이 있으면 현장 고지(k '일용'), 아니면 회사 고지 · 일할(k '상용')
 * @returns {{줄: any[], 못읽음: number}}
 */
export function 붙여읽기(글) {
  const 줄 = []
  let 못읽음 = 0
  for (const raw of String(글 || '').split(/\r?\n/)) {
    if (!raw.trim()) continue
    const 칸 = raw.includes('\t') ? raw.split('\t') : raw.split(/\s*,\s*/)
    const c = 칸.map((s) => String(s ?? '').trim())
    if (/구분/.test(c[0]) || /성명/.test(c[1] || '')) continue
    const m = 달읽기(c[2])
    const 금 = [c[5], c[6], c[7]].map((s) => String(수(s) || ''))
    if (!m && !금.some(Boolean)) { 못읽음++; continue }
    줄.push(빈줄(/일용|현장/.test(c[0]) ? '일용' : '상용', {
      n: c[1] || '', m, d: String(수(c[3]) || ''), t: String(수(c[4]) || ''), h: 금[0], y: 금[1], p: 금[2], x: c[8] || '',
    }))
  }
  return { 줄, 못읽음 }
}

/** 🧪 예시 — 지어낸 공사 · 업체 · 사람(○○ · 가상). 카페 질문 상황 그대로: 소장 현장 전입(현장 고지) + 공무 회사 고지(일할) + 일용(현장 고지) */
export function 예시() {
  const c = 빈공사()
  c.공사명 = '가나지구 배수개선사업 중 구조물공(예시)'
  c.청구인 = '예시건설(주)'
  c.대표 = '○○○'
  c.받는곳 = '가상종합건설(주)'
  c.기준 = 'sum'
  c.계상 = { h: '4200000', y: '550000', p: '5100000' }
  const 회1 = 빈회(1, { 시작: '2026-08-01', 끝: '2026-08-31', 작성: '2026-09-05', 줄: [
    빈줄('일용', { n: '김○○ 소장 (현장 전입)', m: '2026-08', h: '429500', y: '56380', p: '603600', x: '현장 앞으로 고지' }),
    빈줄('일용', { n: '일용 근로자 6명', m: '2026-08', h: '512640', y: '67280', p: '581400', x: '현장 사업장 고지분' }),
  ] })
  const 회2 = 빈회(2, { 시작: '2026-09-01', 끝: '2026-09-30', 작성: '2026-10-05', 줄: [
    빈줄('일용', { n: '김○○ 소장 (현장 전입)', m: '2026-09', h: '429500', y: '56380', p: '603600', x: '현장 앞으로 고지' }),
    빈줄('상용', { n: '이○○ (공무)', m: '2026-09', d: '12', h: '238200', y: '31260', p: '351000', x: '회사 고지 · 9/1~12 현장' }),
    빈줄('일용', { n: '일용 근로자 4명', m: '2026-09', h: '341760', y: '44860', p: '387600', x: '현장 사업장 고지분' }),
  ] })
  c.회들 = [회1, 회2]
  c.지금 = 회2.id
  return c
}
