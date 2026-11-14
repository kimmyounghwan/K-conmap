/**
 * 🗃 경리컨맵 1단계 — 현장 손익 장부(lib/sonik.js · /tools/sonik) 자료로 «회사 전체 한눈에 · 거래처 원장 · 거래처 정보(잠금)» (2026-11-14)
 *
 * 소장님: 「경리나라 프로그램 만들 수 있어?」 → 「할 수 있는 것만 완벽하게」 → 「건설 경리에게 꼭 필한 것 것만」 → 「만들고 막아놔, 예시만 보게 해줘」
 *   → 만들다 보니 «현장 손익 장부»(G112 — 현장마다 매출 · 매입 · 미수 · 미지급 · 손익 · 거래처 잔액)와 같은 일 → 여쭘 → 소장님 «손익 장부 자료로 (추천)»
 *   기획안(«건설 경리 장부 기획안» · 11-14) «있는 도구는 다시 만들지 않고 잇기» 그대로 — 같은 돈을 두 번 적지 않음:
 *   · 적기는 손익 장부에서(kcm_sonik1 — 이 파일은 읽기만 · 고치지 않음)
 *   · 경리컨맵은 그 자료로 ① 회사 전체 한눈에(결제일 기준 이번 달 들어온 · 나간 돈 · 받을 돈 · 줄 돈 · 현장마다 기성률 · 손익)
 *     ② 거래처 원장(날짜 차례 · 줄마다 받을 돈 · 줄 돈 남은 것 — 청구 · 매입 줄과 그 줄의 결제(결제일 · 결제액)를 따로 한 줄씩) ③ 거래처 정보(대표 · 전화 · 업종 · 은행 · 🔐 사업자번호 · 계좌)
 * ■ 손익 장부 줄(R): { id, h 현장id, d 날짜, k 'S'매출|'P'매입, c 항목, v 거래처(이름), t 적요, sup 공급가액, tax 부가세, ev 증빙, pd 결제일, pa 결제액 }
 *   선급금(매출 · 항목 «선급금»)은 받은 돈에만 — 손익 장부 셈 그대로(sonik.js 선급)
 * ■ 원장 끝 남은 돈 = 손익 장부 «거래처별» 미수 · 미지급(시험이 맞춰 봄) · 이번 달 들어온 · 나간 돈 = 손익 장부 «달별» 들어옴 · 나감(결제일 기준)
 * ■ 저장: 거래처 정보만 이 기기 localStorage 'kcm_gyeongri1' { v: 1, 곳: { [거래처 이름]: { 대표, 전화, 업종, 은행, x } } }
 *   — x = 사업자번호 · 계좌를 이 기기 열쇠(lib/기기잠금.js · IndexedDB 'kcm_gyeongri')로 잠근 글 · 서버로 안 보냄 · 비밀번호 안 물음
 */
import * as 손 from './sonik.js'

export const 열쇠 = 'kcm_gyeongri1'
export const 디비 = 'kcm_gyeongri'
export const 원 = 손.원
export const 수 = 손.수
export const 이름 = (v) => String(v || '').trim() || '(거래처 없음)'

/* ── 글 꼴 ── */
export const 숫자 = (s) => { const v = Number(String(s ?? '').replace(/[^\d]/g, '')); return Number.isFinite(v) ? v : 0 }
/** 사업자등록번호 000-00-00000 */
export function 사업자꼴(s) {
  const t = String(s ?? '').replace(/[^\d]/g, '').slice(0, 10)
  return t.length <= 3 ? t : t.length <= 5 ? `${t.slice(0, 3)}-${t.slice(3)}` : `${t.slice(0, 3)}-${t.slice(3, 5)}-${t.slice(5)}`
}
/** 사업자등록번호 끝자리 검사(가중치 1 3 7 1 3 7 1 3 5 · 아홉째 × 5 의 십의 자리 더함) — 10자리가 아니면 null(아직 다 안 적음) */
export function 사업자맞음(s) {
  const d = String(s ?? '').replace(/[^\d]/g, '')
  if (d.length !== 10) return null
  const k = [1, 3, 7, 1, 3, 7, 1, 3, 5]
  let 합 = 0
  for (let i = 0; i < 9; i++) 합 += Number(d[i]) * k[i]
  합 += Math.floor((Number(d[8]) * 5) / 10)
  return (10 - (합 % 10)) % 10 === Number(d[9])
}
export const 계좌꼴 = (s) => String(s ?? '').replace(/[^\d-]/g, '').slice(0, 24)
export function 전화꼴(s) {
  const t = String(s ?? '').replace(/[^\d]/g, '').slice(0, 11)
  if (t.startsWith('02')) return t.length <= 2 ? t : t.length <= 5 ? `02-${t.slice(2)}` : t.length <= 9 ? `02-${t.slice(2, 5)}-${t.slice(5)}` : `02-${t.slice(2, 6)}-${t.slice(6, 10)}`
  if (t.length <= 3) return t
  if (t.length <= 7) return `${t.slice(0, 3)}-${t.slice(3)}`
  if (t.length <= 10) return `${t.slice(0, 3)}-${t.slice(3, 6)}-${t.slice(6)}`
  return `${t.slice(0, 3)}-${t.slice(3, 7)}-${t.slice(7)}`
}

/* ── 거래처 정보(이 기기) ── */
export function 빈정보() { return { v: 1, 곳: {} } }
export function 정보읽기() {
  try {
    const v = JSON.parse(localStorage.getItem(열쇠) || 'null')
    if (!v || typeof v.곳 !== 'object' || Array.isArray(v.곳)) return 빈정보()
    return { ...빈정보(), ...v }
  } catch (e) { return 빈정보() }
}
export function 정보쓰기(s) { try { localStorage.setItem(열쇠, JSON.stringify(s)); return true } catch (e) { return false } }

/**
 * 손익 장부 줄 → 원장 사건(날짜 하나 · 금액 하나)
 *   매출(선급금 아님) → «청구» 합계(공급가 + 부가세) · 결제액이 있으면 «수금» 결제액(결제일 · 없으면 장부 날짜 — 결제일없음 표시)
 *   선급금 → «수금» 결제액만(선급) · 매입 → «매입» 합계 · 결제액이 있으면 «지급» 결제액
 *   차례 = 장부에 적은 차례(n) · 청구 · 매입이 결제보다 먼저(같은 날)
 */
export function 사건들(R) {
  const out = []
  ;(R || []).forEach((r, n) => {
    const 거 = 이름(r.v), 합 = 손.합계(r), pa = 수(r.pa)
    const 결날 = r.pd || r.d || ''
    const 바탕 = { 줄: r.id, n, 거래처: 거, 현장: r.h || '', 항목: r.c || '', 적요: r.t || '', 증빙: r.ev || '' }
    if (r.k === 'S') {
      if (손.선급(r)) { if (pa) out.push({ ...바탕, 날: 결날, 갈래: '수금', 선급: true, 금액: pa, 결제일없음: !r.pd }); return }
      out.push({ ...바탕, 날: r.d || '', 갈래: '청구', 금액: 합, 공급: 수(r.sup), 세: 수(r.tax) })
      if (pa) out.push({ ...바탕, 날: 결날, 갈래: '수금', 금액: pa, 결제일없음: !r.pd })
    } else if (r.k === 'P') {
      out.push({ ...바탕, 날: r.d || '', 갈래: '매입', 금액: 합, 공급: 수(r.sup), 세: 수(r.tax) })
      if (pa) out.push({ ...바탕, 날: 결날, 갈래: '지급', 금액: pa, 결제일없음: !r.pd })
    }
  })
  return out
}
const 먼저 = { 청구: 0, 매입: 0, 수금: 1, 지급: 1 }

/**
 * 거래처 원장 — 날짜 차례 · 줄마다 받을 돈(청구 − 수금) · 줄 돈(매입 − 지급) 남은 것
 *   끝 남은 돈 = 손익 장부 거래처별 미수(매출처) · 미지급(매입처) — 선급금은 받을 돈을 줄임(앞서 받음)
 */
export function 원장(R, 거래처) {
  const k = 이름(거래처)
  const 줄 = 사건들(R).filter((e) => e.거래처 === k)
    .sort((a, b) => (a.날 < b.날 ? -1 : a.날 > b.날 ? 1 : 먼저[a.갈래] - 먼저[b.갈래] || a.n - b.n))
  let 받을 = 0, 줄돈 = 0
  return 줄.map((e) => {
    if (e.갈래 === '청구') 받을 += e.금액
    else if (e.갈래 === '수금') 받을 -= e.금액
    else if (e.갈래 === '매입') 줄돈 += e.금액
    else if (e.갈래 === '지급') 줄돈 -= e.금액
    return { ...e, 받을, 줄돈 }
  })
}

/** 거래처 목록 — 남은 돈 큰 차례(받을 돈 · 줄 돈 합) · 같으면 최근 거래 · 건수 = 장부 줄 수(손익 장부 거래처별과 같음) · 매출처/매입처 표시 */
export function 거래처들(R) {
  const m = new Map()
  const 곳 = (v) => { let x = m.get(v); if (!x) { x = { 이름: v, 받을: 0, 줄돈: 0, 매출: false, 매입: false, 건: 0, 마지막: '' }; m.set(v, x) } return x }
  for (const r of R || []) {
    if (r.k !== 'S' && r.k !== 'P') continue
    const x = 곳(이름(r.v)); x.건++
    if (r.k === 'S') x.매출 = true; else x.매입 = true
    if ((r.d || '') > x.마지막) x.마지막 = r.d
  }
  for (const e of 사건들(R)) {
    const x = 곳(e.거래처)
    if (e.갈래 === '청구') x.받을 += e.금액; else if (e.갈래 === '수금') x.받을 -= e.금액
    else if (e.갈래 === '매입') x.줄돈 += e.금액; else if (e.갈래 === '지급') x.줄돈 -= e.금액
    if (e.날 > x.마지막) x.마지막 = e.날
  }
  return [...m.values()].sort((a, b) => (Math.abs(b.받을) + Math.abs(b.줄돈)) - (Math.abs(a.받을) + Math.abs(a.줄돈)) || b.마지막.localeCompare(a.마지막) || a.이름.localeCompare(b.이름))
}

/**
 * 회사 전체 한눈에 — 장부 = 손익 장부 { co, 현장, R } · 달 = 'YYYY-MM'
 *   들어옴 · 나감 = 손익 장부 달별(결제일 기준) · 받을 돈 · 줄 돈 = 손익 장부 셈(모든 현장) · 현장마다 = 손익 장부 셈(그 현장)
 */
export function 한눈에(장부, 달) {
  const R = (장부 && 장부.R) || []
  const 달들 = 손.달별(R)
  const 이달 = 달들.find((x) => x.ym === 달) || { ym: 달, 매출: 0, 매입: 0, 들어옴: 0, 나감: 0, 손익: 0 }
  const 전체 = 손.셈(R)
  const 아는 = new Set(((장부 && 장부.현장) || []).map((h) => h.id))
  const 현장들 = ((장부 && 장부.현장) || []).map((h) => ({ h, S: 손.셈(R.filter((r) => r.h === h.id), h) }))
  const 밖 = R.filter((r) => !아는.has(r.h))
  return {
    달, 들어옴: 이달.들어옴, 나감: 이달.나감, 청구: 이달.매출, 매입: 이달.매입,
    받을: 전체.매출.미, 줄돈: 전체.매입.미, 손익: 전체.손익,
    현장들, 밖: 밖.length ? 손.셈(밖) : null, 밖수: 밖.length,
    돈있는달: 달들.filter((x) => x.들어옴 || x.나감).map((x) => x.ym),
  }
}
/** 기성률(%) — 도급액(공급가) 대비 매출 공급가(선급금 뺌) · 도급액이 없으면 null */
export const 기성률 = (S) => (S && S.도급 > 0 ? Math.round((S.매출.공급 / S.도급) * 1000) / 10 : null)
/** 처음 보일 달 — 오늘 달에 돈 흐름이 있으면 오늘 달, 없으면 돈 흐름이 있는 마지막 달(예시 · 오래 안 적은 장부) */
export function 처음달(장부, 오늘달) {
  const 있는 = 손.달별((장부 && 장부.R) || []).filter((x) => x.들어옴 || x.나감).map((x) => x.ym)
  if (!있는.length || 있는.includes(오늘달)) return 오늘달
  const 앞 = 있는.filter((m) => m <= 오늘달)
  return 앞.length ? 앞[앞.length - 1] : 있는[0]
}

/** 🧪 예시 — 손익 장부 예시(지어낸 회사 · 현장 · 거래처 · 다섯 달) 그대로 + 거래처 정보(지어낸 · 사업자번호 · 계좌는 가림) */
export function 예시() { return 손.예시() }
export const 예시정보 = {
  가상레미콘: { 대표: '김가상', 전화: '010-0000-1201', 업종: '레미콘', 은행: '농협', 사업자: '***-**-*****', 계좌: '***-****-****-01' },
  가상중기: { 대표: '이가상', 전화: '010-0000-1202', 업종: '굴착기 · 덤프 임대', 은행: '국민', 사업자: '***-**-*****', 계좌: '***-******-**-102' },
  가상흄관: { 대표: '박가상', 전화: '010-0000-1203', 업종: '흄관 · 관 자재', 은행: '신한', 사업자: '***-**-*****', 계좌: '***-***-******' },
  '가상철골(외주)': { 대표: '최가상', 전화: '010-0000-1204', 업종: '철골 제작 · 설치', 은행: '기업', 사업자: '***-**-*****', 계좌: '***-******-**-***' },
}
