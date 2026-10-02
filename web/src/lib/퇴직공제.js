/**
 * 👷 건설근로자 퇴직공제 — 근로일수 · 공제부금 집계 (G116 · 2026-10-02)
 *
 * 소장님: 「매달 신고 정리, 퇴직공제 집계, 고용·산재 보험료 계산기 … 현재 사이트에 있는 것과 연계해서」
 * ■ 출역은 따로 적지 않습니다 — 노무비 계산기(또는 투입비에서 넘겨받은) 출역을 그대로 셉니다(lib/신고정리.js 와 같은 자료).
 * ■ 설정(입찰공고일 · 계상액 · 뺄 사람)은 노무비 계산기 자료 안 st.tj 에 둡니다 → 노무비 «🔗 이어 쓰기» 코드로 폰·PC 같이 따라감.
 *   투입비에서 넘겨받은 현장은 이 브라우저(localStorage 'kcm_toejik_tp')에 현장 이름별로.
 *
 * 근거(원문 확인 2026-10-02 · 국가법령정보센터)
 *  · 가입: 건설산업기본법 제87조① 건설공사 등(공공 1억 원 이상 · 민간 50억 원 이상 등) — 원수급인이 사업주(건설근로자법 제10조①)
 *  · 피공제자 아님: 1일 소정근로시간 4시간 미만이고 1주 15시간 미만(시행규칙 제14조) · 고용형태 등 대통령령(법 제11조)
 *  · 근로일수: 소정근로시간을 일하면 1일 · 짧게 일한 날은 시간을 합쳐 1일 소정근로시간이 되면 1일(시행규칙 제15조⑤1)
 *              → 여기서는 공수 1 이상(1.5 포함) = 1일 · 공수 1 미만(0.5)은 합쳐서 1이 될 때마다 1일, 남는 것은 다음 달로 넘김(공제회 안내)
 *  · 신고 · 납부: 매달 근로일수 신고 + 부금 납부 → 다음 달 15일까지(시행규칙 제15조③)
 *  · 일액: lib/해마다.js 퇴직공제일액표 — 공사의 «입찰공고일» 로 고름(2026.4.1. 이후 8,700원 · 그 전 6,500원)
 */
import { 퇴직공제일액, 달더하기 } from './해마다.js'
import { 일한달들, 달날수 } from './신고정리.js'

export const 투입비열쇠 = 'kcm_toejik_tp'
const 두자 = (n) => String(n).padStart(2, '0')

/** 설정 · 기록 꼴 (노무비 자료 안 st.tj — 🔗 이어 쓰기로 같이 감 · 투입비 현장은 이 브라우저)
 *  {on 가입 현장(신고 정리에 줄), d 입찰공고일, c 계상액, x {id:1} 뺄 사람, paid {귀속달: {a 낸 금액, d 낸 날}}}
 *  소장님 「일의 연속성도 고려 해 주고..」 → 달마다 «낸 금액 · 낸 날» 을 남겨 셈한 부금 · 계상액과 누계로 견줌 */
export const 빈설정 = () => ({ on: false, d: '', c: 0, x: {}, paid: {} })
export function 설정정리(v) {
  const s = { ...빈설정(), ...(v || {}) }
  s.on = !!(v && (v.on || v.d))
  s.d = /^\d{4}-\d{2}-\d{2}$/.test(String(s.d || '')) ? s.d : ''
  s.c = Math.max(0, Number(s.c) || 0)
  s.x = s.x && typeof s.x === 'object' ? s.x : {}
  s.paid = s.paid && typeof s.paid === 'object' ? s.paid : {}
  return s
}
/** 그 달 낸 것 기록 / 지우기 */
export function 낸것바꿈(설정, ym, v) {
  const s = 설정정리(설정)
  const paid = { ...s.paid }
  if (v && (Number(v.a) > 0 || v.d)) paid[ym] = { a: Math.max(0, Number(v.a) || 0), d: v.d || '' }
  else delete paid[ym]
  return { ...s, on: true, paid }
}

/** 공수 배열 → {온 : 공수 1 이상 날 수, 짧은합: 1 미만 공수 합} */
export function 공수나눔(공수) {
  let 온 = 0, 짧은합 = 0
  for (const g of 공수) {
    const v = Number(g) || 0
    if (v >= 1) 온++
    else if (v > 0) 짧은합 += v
  }
  return { 온, 짧은합: Math.round(짧은합 * 1000) / 1000 }
}

/**
 * 첫 달부터 끝달까지 사람마다 달별 근로일수(넘김 포함)
 * @returns {{달들: string[], 사람: {[id]: {[ym]: {온, 짧은, 넘어옴, 일수, 남음}}}}}
 */
export function 일수표(st, 끝ym) {
  const 달들 = 일한달들(st).filter((m) => !끝ym || m <= 끝ym)
  const 사람 = {}
  if (!달들.length) return { 달들, 사람 }
  /* 빈 달이 사이에 있어도 넘김은 이어감 — 같은 현장 같은 사람 */
  const 처음 = 달들[0], 끝 = 끝ym || 달들[달들.length - 1]
  const 모든달 = []
  for (let m = 처음; m <= 끝; m = 달더하기(m, 1)) 모든달.push(m)
  for (const p of st.P || []) {
    let 넘김 = 0
    const 표 = {}
    for (const ym of 모든달) {
      const d = (((st.A || {})[ym] || {})[p.id] || {}).d || {}
      const 공수 = Array.from({ length: 달날수(ym) }, (_, i) => Number(d[두자(i + 1)]) || 0)
      const { 온, 짧은합 } = 공수나눔(공수)
      const 모음 = 짧은합 + 넘김
      const 더할 = Math.floor(모음 + 1e-9)
      const 남음 = Math.round((모음 - 더할) * 1000) / 1000
      if (온 || 짧은합 || 넘김) 표[ym] = { 온, 짧은: 짧은합, 넘어옴: 넘김, 일수: 온 + 더할, 남음 }
      넘김 = 남음
    }
    if (Object.keys(표).length) 사람[p.id] = 표
  }
  return { 달들: 모든달, 사람 }
}

/** 그 달 집계 — 줄마다 근로일수 · 부금 · 뺌 */
export function 달집계(st, 설정, ym) {
  const s = 설정정리(설정)
  const 액 = 퇴직공제일액(s.d)
  const T = 일수표(st, ym)
  const 줄 = []
  for (const p of st.P || []) {
    const v = (T.사람[p.id] || {})[ym]
    if (!v) continue
    const 뺌 = !!s.x[p.id]
    줄.push({ id: p.id, p, ...v, 뺌, 부금: 뺌 ? 0 : v.일수 * 액.일액 })
  }
  const 합 = { 인원: 줄.filter((r) => !r.뺌 && r.일수 > 0).length, 뺀인원: 줄.filter((r) => r.뺌).length, 일수: 0, 부금: 0 }
  for (const r of 줄) if (!r.뺌) { 합.일수 += r.일수; 합.부금 += r.부금 }
  return { ym, 액, 줄, 합, 기한: `${달더하기(ym, 1)}-15` }
}

/** 처음부터 그 달까지 누계 · 계상액과 견줌 */
export function 누계(st, 설정, 끝ym) {
  const s = 설정정리(설정)
  const 액 = 퇴직공제일액(s.d)
  const T = 일수표(st, 끝ym)
  const 달별 = []
  let 일수 = 0, 부금 = 0, 낸 = 0
  for (const ym of T.달들) {
    let d = 0
    for (const [id, 표] of Object.entries(T.사람)) if (표[ym] && !s.x[id]) d += 표[ym].일수
    if (!d && !Object.values(T.사람).some((표) => 표[ym])) continue
    일수 += d; 부금 += d * 액.일액
    const p = s.paid[ym] || null
    낸 += p ? p.a : 0
    달별.push({ ym, 일수: d, 부금: d * 액.일액, 누계일수: 일수, 누계부금: 부금, 낸: p, 누계낸: 낸 })
  }
  const 계상 = s.c
  const 안낸달 = 달별.filter((m) => m.부금 > 0 && !m.낸).map((m) => m.ym)
  const 다른달 = 달별.filter((m) => m.낸 && m.낸.a !== m.부금).map((m) => m.ym)
  return { 달별, 일수, 부금, 낸, 안낸달, 다른달, 계상, 남은: 계상 ? 계상 - (낸 || 부금) : null, 비율: 계상 ? (낸 || 부금) / 계상 : null, 기준: 낸 ? '낸 금액' : '셈한 부금', 액 }
}
