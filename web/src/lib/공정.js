/**
 * 📈 예정공정표 · S커브 — 셈 (2026-09-28)
 *
 * 소장님: 「1번부터 6번까지 한꺼번에 가자」 — ① 공정표(받은 무료 공정표 프로그램의 «방식만»: 공종·도급액 → 보할,
 *   기간 → 막대 공정표·S-Curve, 주요 공정(선후 관계), 일/주/월 간격). 그 프로그램의 코드·자료는 쓰지 않았습니다.
 *   예전 말씀(2026-09-16): 「내역서를 넣으면 예정공정표를 만들어 주는」 · 「공사기간에 맞추어」 · 「커브곡선(S커브) 포함」
 *
 * ■ 한 공종 = {이름, 금액, 시작(YYYY-MM-DD), 기간(일), 선행('2,3' — 앞 공종 번호), 간격(일, 선행 끝 다음 날부터 더 띄움·음수면 겹침)}
 * ■ 보할 = 공종 금액 ÷ 합계. 공종 금액은 그 공종 기간에 «날마다 고르게» 들어간다고 보고 칸(월·순·주)마다 나눕니다.
 * ■ 선행이 있으면 시작 = 선행 공종들의 끝 다음 날(+간격) 가운데 가장 늦은 날. 여유가 0 인 공종 = 주공정(CP).
 * ■ 날은 모두 «달력 날» (공휴일 빼기 없음) — 화면에 그렇게 적습니다.
 * ■ 시험: node tools/시험_공정.mjs
 */
import { 공종나무읽기, 막대형줄, 금액형줄 } from './공종읽기.js'

const 하루 = 86400000
/** 'YYYY-MM-DD' → 날 번호(1970-01-01 = 0) · 못 읽으면 null */
export function 날번(t) {
  const m = String(t || '').match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return null
  const v = Date.UTC(+m[1], +m[2] - 1, +m[3])
  return Number.isFinite(v) ? Math.round(v / 하루) : null
}
export function 번날(n) {
  const d = new Date(n * 하루)
  return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0')
}
const 달끝 = (y, m) => new Date(Date.UTC(y, m + 1, 0)).getUTCDate()   // m: 0~11
export const 점날 = (t) => { const m = String(t || '').match(/^(\d{4})-(\d{2})-(\d{2})$/); return m ? m[1] + '. ' + (+m[2]) + '. ' + (+m[3]) + '.' : '' }
const 수 = (x) => { const v = Number(String(x ?? '').replace(/[,\s원]/g, '')); return Number.isFinite(v) ? v : 0 }

/**
 * 칸(간격) 나누기 — 착공~준공
 * @param 간격 '월' | '순'(상·중·하순) | '주'(착공일부터 7일씩)
 * @returns [{a, b (날 번호, 둘 다 포함), 이름, 윗이름}]
 */
export function 칸만들기(착공, 준공, 간격 = '월') {
  const a0 = 날번(착공), b0 = 날번(준공)
  if (a0 === null || b0 === null || b0 < a0) return []
  const out = []
  if (간격 === '주') {
    for (let a = a0, k = 1; a <= b0 && out.length < 400; a += 7, k++) {
      const d = new Date(a * 하루)
      out.push({ a, b: Math.min(a + 6, b0), 이름: k + '주', 윗이름: d.getUTCFullYear() + '.' + (d.getUTCMonth() + 1) })
    }
    return out
  }
  let d = new Date(a0 * 하루)
  let y = d.getUTCFullYear(), m = d.getUTCMonth()
  while (out.length < 400) {
    const 첫 = Math.round(Date.UTC(y, m, 1) / 하루), 끝 = 첫 + 달끝(y, m) - 1
    if (첫 > b0) break
    if (간격 === '순') {
      for (const [p, q, nm] of [[0, 9, '상'], [10, 19, '중'], [20, 달끝(y, m) - 1, '하']]) {
        const a = Math.max(첫 + p, a0), b = Math.min(첫 + q, b0)
        if (a <= b) out.push({ a, b, 이름: nm, 윗이름: y + '.' + (m + 1) })
      }
    } else {
      const a = Math.max(첫, a0), b = Math.min(끝, b0)
      if (a <= b) out.push({ a, b, 이름: (m + 1) + '월', 윗이름: String(y) })
    }
    m++; if (m > 11) { m = 0; y++ }
  }
  return out
}

/** '2, 3' → [1, 2] (0부터) · 자기 자신·없는 번호는 뺌 */
export function 선행풀기(t, 나, n) {
  return [...new Set(String(t || '').split(/[,\s·/]+/).map((x) => parseInt(x, 10)).filter((v) => Number.isInteger(v) && v >= 1 && v <= n && v - 1 !== 나).map((v) => v - 1))]
}

/**
 * 공정 셈
 * @param P {착공, 준공, 간격, 공종:[{이름, 금액, 시작, 기간, 선행, 간격}]}
 * @returns {줄, 칸, 계획:[{금액, 율, 누계, 누계율}], 합계, 시작, 끝, 공기, 경고, 선행있음}
 */
export function 공정셈(P) {
  const 경고 = []
  const a0 = 날번(P.착공), b0 = 날번(P.준공)
  const 공종 = (P.공종 || []).map((r, i) => ({ ...r, i, 이름: String(r.이름 || '').trim() }))
  const 쓸 = 공종.filter((r) => r.이름 || 수(r.금액) > 0)
  const n = 공종.length
  const 합계 = 쓸.reduce((s, r) => s + Math.max(0, 수(r.금액)), 0)
  // 선행 · 순환 막기
  const 앞 = 공종.map((r, i) => 선행풀기(r.선행, i, n))
  const 차례 = [], 상태 = new Array(n).fill(0)
  let 순환 = false
  const 가 = (i) => { if (상태[i] === 2) return; if (상태[i] === 1) { 순환 = true; return } 상태[i] = 1; for (const j of 앞[i]) 가(j); 상태[i] = 2; 차례.push(i) }
  for (let i = 0; i < n; i++) 가(i)
  if (순환) { 경고.push('선행이 빙 돌아 제자리로 옵니다(예: 2번의 선행이 3번, 3번의 선행이 2번) — 선행을 빼고 셈했습니다'); for (let i = 0; i < n; i++) 앞[i] = [] }
  const 선행있음 = 앞.some((x) => x.length)
  // 앞으로 셈 (ES·EF)
  const ES = new Array(n).fill(null), EF = new Array(n).fill(null), D = new Array(n).fill(0)
  for (const i of 순환 ? [...Array(n).keys()] : 차례) {
    const r = 공종[i]
    const d = Math.max(1, Math.round(수(r.기간)) || 1)
    D[i] = d
    let s
    if (앞[i].length) {
      const 띄움 = Math.round(수(r.간격))
      s = Math.max(...앞[i].map((j) => (EF[j] === null ? -Infinity : EF[j] + 1))) + 띄움
      if (!Number.isFinite(s)) s = 날번(r.시작) ?? a0
    } else s = 날번(r.시작) ?? a0
    if (s === null) continue
    ES[i] = s; EF[i] = s + d - 1
  }
  const 있는 = [...Array(n).keys()].filter((i) => ES[i] !== null && (공종[i].이름 || 수(공종[i].금액) > 0))
  const 시작 = 있는.length ? Math.min(...있는.map((i) => ES[i])) : a0
  const 끝 = 있는.length ? Math.max(...있는.map((i) => EF[i])) : b0
  // 뒤로 셈 (LS·LF) — 끝 = 가장 늦게 끝나는 공종
  const 뒤 = 공종.map(() => [])
  for (let i = 0; i < n; i++) for (const j of 앞[i]) 뒤[j].push(i)
  const LF = new Array(n).fill(null), LS = new Array(n).fill(null)
  for (const i of [...(순환 ? [...Array(n).keys()] : 차례)].reverse()) {
    if (ES[i] === null) continue
    let lf = 끝
    for (const k of 뒤[i]) if (LS[k] !== null) lf = Math.min(lf, LS[k] - 1 - Math.round(수(공종[k].간격)))
    LF[i] = lf; LS[i] = lf - D[i] + 1
  }
  if (a0 !== null && 시작 !== null && 시작 < a0) 경고.push('착공일(' + 점날(P.착공) + ')보다 먼저 시작하는 공종이 있습니다')
  if (b0 !== null && 끝 !== null && 끝 > b0) 경고.push('공종이 준공일(' + 점날(P.준공) + ')보다 ' + (끝 - b0) + '일 늦게 끝납니다 — 기간·선행을 줄이거나 준공일을 확인하십시오')
  if (합계 <= 0 && 쓸.length) 경고.push('금액이 없어 보할을 셀 수 없습니다 — 공종마다 금액(도급액)을 적으면 보할·공정률·S커브가 나옵니다')
  // 칸
  /* 🧭 G333 (2026-10-20) 착공보다 먼저 시작하는 공종이 있으면 칸을 그 날부터 — 전엔 착공 앞 몫이 칸 밖이라 S커브 누계가 100% 에 못 미쳤음
       (예: 착공 1/5 · 공종 1/3 시작 53일 → 2일 몫 7백만 원이 빠져 누계 99.5%) · 변경 공정표(변경공정셈)와 같은 규칙 */
  const 칸시작 = a0 !== null && 시작 !== null && 시작 < a0 ? 번날(시작) : (P.착공 || (시작 !== null ? 번날(시작) : ''))
  const 칸 = 칸만들기(칸시작, P.준공 || (끝 !== null ? 번날(끝) : ''), P.간격 || '월')
  if (칸.length && 끝 !== null && 끝 > 칸[칸.length - 1].b) {
    // 준공 뒤로 넘어간 공종 — 칸을 늘려 보여 줌
    const 더 = 칸만들기(번날(칸[칸.length - 1].b + 1), 번날(끝), P.간격 || '월')
    칸.push(...더)
  }
  const 줄 = 공종.map((r, i) => {
    const 금 = Math.max(0, 수(r.금액))
    const 보할 = 합계 > 0 ? 금 / 합계 : 0
    const 칸값 = 칸.map((c) => {
      if (ES[i] === null) return 0
      const 겹 = Math.min(c.b, EF[i]) - Math.max(c.a, ES[i]) + 1
      return 겹 > 0 ? 금 * 겹 / D[i] : 0
    })
    const 여유 = LS[i] !== null && ES[i] !== null ? LS[i] - ES[i] : null
    return {
      i, 이름: r.이름, 금액: 금, 보할, 시작: ES[i], 끝: EF[i], 기간: D[i], 선행: 앞[i], 간격: Math.round(수(r.간격)),
      여유, CP: 선행있음 && 여유 === 0, 칸값,                       // 주공정은 선행을 이었을 때만
      시작글: ES[i] !== null ? 번날(ES[i]) : '', 끝글: EF[i] !== null ? 번날(EF[i]) : '',
    }
  })
  let 누 = 0
  const 계획 = 칸.map((c, k) => {
    const 금 = 줄.reduce((s, z) => s + z.칸값[k], 0)
    누 += 금
    return { 금액: 금, 율: 합계 > 0 ? 금 / 합계 : 0, 누계: 누, 누계율: 합계 > 0 ? 누 / 합계 : 0 }
  })
  return { 줄, 칸, 계획, 합계, 시작, 끝, 공기: 시작 !== null && 끝 !== null ? 끝 - 시작 + 1 : 0, 경고, 선행있음 }
}

/** 어느 날까지의 계획 공정률(누계, 0~1) — 날마다 고르게 */
export function 계획률(P, 날) {
  const t = 날번(날)
  if (t === null) return null
  const R = 공정셈(P)
  if (!(R.합계 > 0)) return null
  let 금 = 0
  for (const z of R.줄) {
    if (z.시작 === null || !(z.금액 > 0)) continue
    const 겹 = Math.min(t, z.끝) - z.시작 + 1
    if (겹 > 0) 금 += z.금액 * Math.min(겹, z.기간) / z.기간
  }
  return 금 / R.합계
}

/**
 * 🪄 자동 배치 — 적은 차례대로 계단처럼(앞 공종이 먼저, 뒤 공종이 나중) 착공~준공에 놓습니다.
 *   금액이 큰 공종일수록 길게(공기의 30~80%). «준비·가설» 은 맨 앞 짧게, «정리·준공·청소» 는 맨 뒤 짧게.
 *   선행은 지웁니다(사람이 다시 잇게). 짐작일 뿐이므로 화면에 «고쳐 쓰십시오» 라고 적습니다.
 */
export function 자동배치(공종, 착공, 준공) {
  const a0 = 날번(착공), b0 = 날번(준공)
  if (a0 === null || b0 === null || b0 < a0) return 공종
  const T = b0 - a0 + 1
  const 쓸 = 공종.map((r, i) => ({ r, i })).filter(({ r }) => String(r.이름 || '').trim() || 수(r.금액) > 0)
  const n = 쓸.length
  const 큰 = Math.max(1, ...쓸.map(({ r }) => 수(r.금액)))
  const out = 공종.map((r) => ({ ...r }))
  let 앞시작 = 0
  쓸.forEach(({ r, i }, k) => {
    const 이름 = String(r.이름 || '')
    let d, s
    if (/준비|가설|측량|착공/.test(이름)) { d = Math.max(7, Math.round(T * 0.12)); s = 0 }
    else if (/정리|준공|청소|마무리/.test(이름)) { d = Math.max(7, Math.round(T * 0.1)); s = T - d }
    else {
      const w = 수(r.금액) > 0 ? 수(r.금액) / 큰 : 0.5
      d = Math.min(T, Math.max(7, Math.round(T * (0.3 + 0.5 * w))))
      s = n > 1 ? Math.round((T - d) * k / (n - 1)) : 0
      s = Math.max(s, 앞시작)                                  // 계단: 앞 공종보다 먼저 시작하지 않게
      if (s + d > T) d = Math.max(Math.min(7, T), T - s)
      if (s + d > T) s = Math.max(0, T - d)
      앞시작 = s
    }
    out[i] = { ...out[i], 시작: 번날(a0 + s), 기간: String(d), 선행: '', 간격: '' }
  })
  return out
}

/* ───────────────────────────── 내역서 → 공종·금액 */

/**
 * 내역서(.xlsx · .xls) → 막대형 공종 [{이름, 금액}]
 *   🩹 2026-11-16 소장님 「간단하게 하는 방법없을까? 내역서만 넣으면 되게」 → 「실제로 내역서 직접 넣어 보고, 점검해줘」:
 *   전엔 «공종별 집계표» 머리 하나만 찾아 실제 내역서 58개 가운데 여럿에서 엉뚱한 시트(기계경비 · 일위대가)를 고르거나
 *   «01 ○○지구…» 처럼 번호가 붙은 이름 · 금액 없는 줄이 나왔음 → lib/공종읽기.js 공종나무읽기(번호 꼴 · 관급 · 위 합 밖 · 겹침)로 바꿈.
 *   막대형 = 맨 위 공종(넷보다 적으면 그 아래까지 · 같은 이름은 «위 · 이름»).
 * @returns {공종:[{이름, 금액}], 시트, 말, 금있음, 나무(공종나무읽기 결과)}
 */
export function 내역공종(bytes, 이름 = '내역서') {
  const R = 공종나무읽기(bytes, 이름)
  const 공종 = 막대형줄(R).map((x) => ({ 이름: x.이름, 금액: x.금액 > 0 ? Math.round(x.금액) : 0 }))
  if (!공종.length) throw new Error('내역서에서 공종을 못 찾았습니다 — 공종과 금액을 직접 적어 주십시오')
  return { 공종, 시트: R.시트, 말: R.말, 금있음: R.금있음, 나무: R }
}

/**
 * 공종 나무 → 금액형 줄(1 공종 · 1.1 세부 — 변경공정칸.jsx 빈줄 꼴) · 금액은 단위(천원이면 ÷1000 · 줄 합이 맞게 큰 나머지 반올림)
 * @returns {줄:[{깊이, 이름, 수량, 단위, 금액, 시작, 끝, 변금액, 변시작, 변끝}], 세부씀, 합(원)}
 */
export function 금액형내역줄(R, 단위 = '천원') {
  const { 줄, 세부씀 } = 금액형줄(R)
  const 천 = 단위 === '천원'
  const 잎 = 줄.map((x, i) => (x.금액 !== null && x.금액 !== undefined && x.금액 > 0 ? i : -1)).filter((i) => i >= 0)
  const 바꾼 = 천 ? 맞춰반올림(잎.map((i) => 줄[i].금액 / 1000)) : 잎.map((i) => Math.round(줄[i].금액))
  const 금 = new Map(잎.map((i, k) => [i, 바꾼[k]]))
  const out = 줄.map((x, i) => ({ 깊이: x.깊이, 이름: x.이름, 수량: '1', 단위: '식', 금액: 금.has(i) ? String(금.get(i)) : '', 시작: '', 끝: '', 변금액: '', 변시작: '', 변끝: '' }))
  const 합 = R.위.reduce((s, n) => s + (n.금액 > 0 ? n.금액 : 0), 0)
  return { 줄: out, 세부씀, 합 }
}

/**
 * 🪄 금액형 기간 놓기 — «1 공종» 줄은 착공 ~ 준공에 계단처럼(자동배치 · 금액이 클수록 길게), 그 아래 «1.1 세부» 는 공종 기간 안에서 다시 계단처럼.
 *   아래 줄을 거느린 줄(세부가 있는 공종 · ◈ 대공종)은 날을 비워 «아래 줄들의 기간» 으로 그림(공정률이 세부 날짜를 그대로 따름).
 *   금액이 빈 공종은 아래 줄 합으로 길이를 정함. 변경 칸(변금액 · 변시작 · 변끝)은 건드리지 않음. 짐작일 뿐 — 화면에 «고쳐 쓰십시오».
 */
export function 금액형배치(공종, 착공, 준공) {
  const a0 = 날번(착공), b0 = 날번(준공)
  if (a0 === null || b0 === null || b0 < a0) return 공종
  const a = 공종.map((r) => ({ ...r }))
  const 깊 = (r) => Math.max(0, Math.min(2, parseInt(r.깊이, 10) || 0))
  const 씀 = (r) => String(r.이름 || '').trim() !== '' || 있음(r.금액)
  const 아이들 = (i) => { const d = 깊(a[i]); const out = []; for (let j = i + 1; j < a.length && 깊(a[j]) > d; j++) if (깊(a[j]) === d + 1 && 씀(a[j])) out.push(j); return out }
  const 줄금 = (i) => (있음(a[i].금액) ? 수(a[i].금액) : 아이들(i).reduce((s, j) => s + 줄금(j), 0))
  const 놓기 = (목록, s, e) => {
    const 놓음 = 자동배치(목록.map((i) => ({ 이름: a[i].이름, 금액: String(줄금(i)) })), s, e)
    목록.forEach((i, k) => { const t = 날번(놓음[k].시작), d = +놓음[k].기간; if (t !== null && d > 0) { a[i].시작 = 놓음[k].시작; a[i].끝 = 번날(t + d - 1) } })
  }
  let 일들 = a.map((r, i) => i).filter((i) => 깊(a[i]) === 1 && 씀(a[i]))
  if (!일들.length) 일들 = a.map((r, i) => i).filter((i) => 깊(a[i]) === 2 && 씀(a[i]))
  if (!일들.length) return 공종
  놓기(일들, 착공, 준공)
  for (const p of 일들) {
    const 아 = 아이들(p)
    if (!아.length) continue
    놓기(아, a[p].시작, a[p].끝)
    a[p].시작 = ''; a[p].끝 = ''
  }
  for (const r of a) if (깊(r) === 0) { r.시작 = ''; r.끝 = '' }
  return a
}

/** 날짜 글 «2026-11-10 · 2026. 11. 10. · 2026.11.10» → 'YYYY-MM-DD' (못 읽으면 '') — 서식 공통 칸(kcm.서식공통 착공 · 준공)을 읽을 때 */
export function 날짜고르기(t) {
  const m = String(t ?? '').match(/(\d{4})\D{1,3}(\d{1,2})\D{1,3}(\d{1,2})/)
  if (!m) return ''
  const v = `${m[1]}-${String(+m[2]).padStart(2, '0')}-${String(+m[3]).padStart(2, '0')}`
  return 날번(v) !== null && 번날(날번(v)) === v ? v : ''
}

/** 서식 공통 칸(kcm.서식공통 — 서식 · 낙찰 한 벌 · 내 현장이 씀)의 착공 · 준공 → {착공, 준공} ('YYYY-MM-DD' · 없으면 '') */
export function 공통날읽기(저장소 = (typeof localStorage !== 'undefined' ? localStorage : null)) {
  try {
    const c = (저장소 && JSON.parse(저장소.getItem('kcm.서식공통') || '{}')) || {}
    return { 착공: 날짜고르기(c.착공), 준공: 날짜고르기(c.준공) }
  } catch (e) { return { 착공: '', 준공: '' } }
}

/**
 * 🧪 예시를 보는 중인가 — 예정공정표는 예시를 저장하지 않으므로(Tools.jsx 예시안남김) 그때 넣은 내역서는 저장 칸에 바로 써 두고
 *   예시를 끔(«kcm-예시끄기» → 판을 새로 깔면 넣은 값으로 열림). 예시가 아니면 null.
 * @param 판 calcs.jsx 칸창고 값 {열쇠, ex}
 */
export function 예시중저장(판) {
  if (!판 || !판.ex || !Object.keys(판.ex).length || typeof localStorage === 'undefined') return null
  let m = {}
  try { m = JSON.parse(localStorage.getItem(판.열쇠) || '{}') || {} } catch (e) { m = {} }
  return {
    값: (k) => m[k],
    쓰기: (값들) => {
      try {
        localStorage.setItem(판.열쇠, JSON.stringify({ ...m, ...값들 }))
        window.dispatchEvent(new CustomEvent('kcm-calc', { detail: 판.열쇠 }))
        window.dispatchEvent(new CustomEvent('kcm-예시끄기', { detail: 판.열쇠 }))
      } catch (e) { /* 가득 참 */ }
    },
  }
}

/** 내역서 넣은 뒤 알림 한 줄 — 어느 시트 · 몇 가지 · 순공사비 · 도급액 · 뺀 것 · 기간 */
export function 내역알림(R, { 공종수 = 0, 세부수 = 0, 단위 = '원', 도급 = null, 날됨 = false, 공통날 = false } = {}) {
  const 순 = R.위.reduce((s, n) => s + (n.금액 > 0 ? n.금액 : 0), 0)
  const 금 = (v) => (단위 === '천원' ? Math.round(v / 1000).toLocaleString('ko-KR') + '천원' : Math.round(v).toLocaleString('ko-KR') + '원')
  let t = '📥 «' + R.시트 + '» 시트에서 공종 ' + 공종수 + '가지' + (세부수 ? ' · 세부 ' + 세부수 + '가지' : '') + '를 읽었습니다'
  t += R.금있음 && 순 > 0 ? ' (순공사비 ' + 금(순) + (도급 ? ' · 도급액 ' + 금(도급) + ' — 원가계산서' : '') + ').' : ' — 금액이 비어 있는 공내역서라 금액은 직접 적어 주십시오.'
  if (R.뺀 && R.뺀.length) {
    const 이름들 = R.뺀.slice(0, 4).map((x) => x.이름 + (x.까닭 === '위 합 밖' ? '(순공사비 밖)' : ''))
    t += ' 뺀 것: ' + 이름들.join(' · ') + (R.뺀.length > 4 ? ' 외 ' + (R.뺀.length - 4) + '가지' : '') + '.'
  }
  t += 날됨 ? ' 🪄 ' + (공통날 ? '서식에 적어 둔 ' : '') + '착공 ~ 준공에 기간을 계단처럼 놓았습니다 — 짐작이니 공종마다 고쳐 쓰십시오.' : ' 📅 착공 · 준공을 적으면 기간을 바로 놓습니다.'
  return t
}

/** 🧪 예시 — 지어낸 공사(실제 현장 아님) */
export function 예시공정() {
  return {
    공사명: '○○동 배수로 정비공사 (예시 — 실제 공사 아님)', 착공: '2026-10-05', 준공: '2027-03-31', 간격: '월',
    공종: [
      { 이름: '준비·가설공', 금액: '42000000', 시작: '2026-10-05', 기간: '21', 선행: '', 간격: '' },
      { 이름: '토공', 금액: '185000000', 시작: '', 기간: '60', 선행: '1', 간격: '-7' },
      { 이름: '구조물공 (배수로)', 금액: '420000000', 시작: '', 기간: '95', 선행: '2', 간격: '-30' },
      { 이름: '포장공', 금액: '160000000', 시작: '', 기간: '35', 선행: '3', 간격: '-10' },
      { 이름: '부대공', 금액: '68000000', 시작: '', 기간: '40', 선행: '3', 간격: '-20' },
      { 이름: '정리·준공', 금액: '25000000', 시작: '', 기간: '14', 선행: '4,5', 간격: '' },
    ],
  }
}

/* ═════════════════════════════ 📈 변경 예정공정표 (당초·변경 대비 · 월별 금액) — 2026-09-28
 * 소장님: 「예정공정표 다른 형식이야. 이것도 올려줘. 도구 프로그램으로 올려서 이용자들이 사용할 수 있게 해줘」
 *   받은 양식(설계변경 때 내는 «예정공정표 (변경)») 의 «모양과 셈 방식만»: 공종마다 당초(빨강)·변경(검정) 두 줄,
 *   칸(월)마다 그 달 비율(%)과 금액, 아래에 순공사비계 · 제경비 · 도급액 · 공정률(누계), S커브 두 줄.
 *   받은 파일의 공사명·회사·금액은 쓰지 않았습니다(예시는 지어낸 공사).
 * ■ 한 줄 = {깊이: 0(◈ 대공종)·1(공종)·2(세부), 이름, 수량, 단위, 금액, 시작, 끝, 변금액, 변시작, 변끝}
 *   · 변경 칸이 비면 당초와 같음(바뀐 것만 적음). 변금액 0 = 변경에서 빠짐.
 *   · 아래 깊이 줄을 거느린 줄: 금액이 비면 아래 줄 합 · 날이 비면 아래 줄들의 칸값을 그 금액에 맞춰 늘이고 줄임.
 *   · 순공사비 = 맨 위 줄(부모 없는 줄)들의 합. 보할 = 금액 ÷ 순공사비.
 *   · 제경비 = 도급액 − 순공사비 (도급액을 안 적으면 0). 달마다 순공사비와 같은 비율로 나눔(받은 양식과 같음).
 *   · 공정률 = 그 달 순공사비 ÷ 순공사비 합 · 누계.
 * ■ 금액은 공종 기간에 날마다 고르게 들어간다고 보고 칸마다 나눔. 보이는 금액은 원 단위로 반올림하되 줄 합이 금액과 같게 맞춤(큰 나머지 방식).
 */
const 있음 = (x) => String(x ?? '').trim() !== ''

/** 수 목록을 정수로 반올림하되 합이 round(합)과 같게 (큰 나머지 방식) */
export function 맞춰반올림(값들) {
  const 합 = 값들.reduce((a, b) => a + b, 0)
  const 목표 = Math.round(합)
  const 내림 = 값들.map((v) => Math.floor(v))
  let 남 = 목표 - 내림.reduce((a, b) => a + b, 0)
  const 순 = 값들.map((v, i) => ({ i, r: v - Math.floor(v) })).sort((a, b) => b.r - a.r)
  const out = [...내림]
  for (let k = 0; k < 순.length && 남 > 0; k++) { if (값들[순[k].i] > 0) { out[순[k].i]++; 남-- } }
  return out
}

/**
 * @param P {착공, 준공, 변준공, 간격, 도급, 변도급, 변경(true=두 줄), 공종:[…]}
 * @returns {칸, 줄:[{i, 깊이, 번호, 이름, 수량, 단위, 뿌리, 당:{금액, 보할, 칸값[], 시작, 끝}, 변:{…}}], 합:{당, 변}, 경고, 두줄}
 *   합.당 = {순, 제, 도, 순칸[], 제칸[], 도칸[], 율칸[], 누계칸[], 제율, 순율}
 */
export function 변경공정셈(P) {
  const 경고 = []
  const 두줄 = P.변경 !== false
  const 원줄 = (P.공종 || []).map((r, i) => ({ ...r, i, 이름: String(r.이름 || '').trim(), 깊이: Math.max(0, Math.min(2, parseInt(r.깊이, 10) || 0)) }))
  const 쓸 = 원줄.filter((r) => r.이름 || 있음(r.금액) || 있음(r.변금액))
  const n = 쓸.length
  // 부모 (앞쪽에서 가장 가까운, 깊이가 더 얕은 줄)
  const 부모 = new Array(n).fill(-1)
  for (let k = 0; k < n; k++) for (let j = k - 1; j >= 0; j--) if (쓸[j].깊이 < 쓸[k].깊이) { 부모[k] = j; break }
  const 아이 = 쓸.map(() => [])
  for (let k = 0; k < n; k++) if (부모[k] >= 0) 아이[부모[k]].push(k)
  // 칸 — 착공 ~ 늦은 준공(과 공종 끝) 
  const 날들 = []
  for (const r of 쓸) for (const t of [r.시작, r.끝, r.변시작, r.변끝]) { const v = 날번(t); if (v !== null) 날들.push(v) }
  const a0 = 날번(P.착공) ?? (날들.length ? Math.min(...날들) : null)
  const 끝후보 = [날번(P.준공), 두줄 ? 날번(P.변준공) : null, ...날들].filter((v) => v !== null)
  const b0 = 끝후보.length ? Math.max(...끝후보) : null
  if (a0 === null || b0 === null || b0 < a0) return { 칸: [], 줄: [], 합: null, 경고: ['착공일과 준공일(또는 공종 날짜)을 적으면 공정표가 그려집니다'], 두줄 }
  const 시작날 = Math.min(a0, ...날들.filter((v) => v < a0))
  const 칸 = 칸만들기(번날(시작날), 번날(b0), P.간격 || '월')
  if (날들.some((v) => v < a0)) 경고.push('착공일(' + 점날(P.착공) + ')보다 먼저 시작하는 공종이 있습니다')
  const 늦은준공 = Math.max(...[날번(P.준공), 두줄 ? 날번(P.변준공) : null].filter((v) => v !== null))
  if (Number.isFinite(늦은준공) && 날들.some((v) => v > 늦은준공)) 경고.push('준공일보다 늦게 끝나는 공종이 있습니다 — 날짜를 확인하십시오')

  const 고르게 = (금, a, b) => 칸.map((c) => { const 겹 = Math.min(c.b, b) - Math.max(c.a, a) + 1; return 겹 > 0 ? 금 * 겹 / (b - a + 1) : 0 })
  const 한쪽 = (쪽) => {
    const 금 = new Array(n).fill(0), 칸값 = new Array(n).fill(null), 시 = new Array(n).fill(null), 끝 = new Array(n).fill(null)
    const 셈 = (k) => {
      if (칸값[k]) return
      const r = 쓸[k]
      for (const c of 아이[k]) 셈(c)
      const 금글 = 쪽 === '변' && 있음(r.변금액) ? r.변금액 : 쪽 === '변' && !있음(r.변금액) ? r.금액 : r.금액
      const 아이합 = 아이[k].reduce((s, c) => s + 금[c], 0)
      금[k] = 있음(금글) ? Math.max(0, 수(금글)) : 아이합
      let a = 날번(쪽 === '변' && 있음(r.변시작) ? r.변시작 : r.시작), b = 날번(쪽 === '변' && 있음(r.변끝) ? r.변끝 : r.끝)
      if (a !== null && b !== null && b < a) { 경고.push((r.이름 || (k + 1) + '번째 줄') + ': ' + (쪽 === '변' ? '변경 ' : '') + '끝날이 시작날보다 앞입니다'); b = a }
      if (a !== null && b === null) b = a
      if (a === null && b !== null) a = b
      if (a !== null) {
        칸값[k] = 고르게(금[k], a, b); 시[k] = a; 끝[k] = b
      } else if (아이[k].length && 아이합 > 0) {
        const 배 = 금[k] / 아이합
        칸값[k] = 칸.map((_, j) => 아이[k].reduce((s, c) => s + 칸값[c][j], 0) * 배)
        const 시들 = 아이[k].map((c) => 시[c]).filter((v) => v !== null), 끝들 = 아이[k].map((c) => 끝[c]).filter((v) => v !== null)
        시[k] = 시들.length ? Math.min(...시들) : null; 끝[k] = 끝들.length ? Math.max(...끝들) : null
      } else {
        칸값[k] = 칸.map(() => 0)
        if (금[k] > 0) 경고.push((r.이름 || (k + 1) + '번째 줄') + ': ' + (쪽 === '변' ? '변경 ' : '') + '기간(시작·끝)이 없어 공정표에 안 나옵니다')
      }
    }
    for (let k = 0; k < n; k++) 셈(k)
    const 뿌리 = [...Array(n).keys()].filter((k) => 부모[k] < 0)
    const 순 = 뿌리.reduce((s, k) => s + 금[k], 0)
    const 순칸 = 칸.map((_, j) => 뿌리.reduce((s, k) => s + 칸값[k][j], 0))
    const 도글 = 쪽 === '변' ? (있음(P.변도급) ? P.변도급 : P.도급) : P.도급
    let 도 = 있음(도글) ? 수(도글) : 순
    if (도 < 순) { if (있음(도글)) 경고.push((쪽 === '변' ? '변경 ' : '당초 ') + '도급액이 순공사비 합보다 작습니다 — 도급액을 확인하십시오 (제경비 0 으로 셈)'); 도 = 순 }
    const 제 = 도 - 순
    const 율칸 = 순칸.map((v) => (순 > 0 ? v / 순 : 0))
    const 제칸 = 율칸.map((u) => 제 * u)
    const 도칸 = 순칸.map((v, j) => v + 제칸[j])
    let 누 = 0
    const 누계칸 = 율칸.map((u) => (누 += u))
    return { 금, 칸값, 시, 끝, 합: { 순, 제, 도, 순칸, 제칸, 도칸, 율칸, 누계칸, 순율: 도 > 0 ? 순 / 도 : 0, 제율: 도 > 0 ? 제 / 도 : 0 } }
  }
  const 당 = 한쪽('당'), 변 = 두줄 ? 한쪽('변') : null
  // 번호: ◈ · 1 · 1.1
  let 일 = 0, 이 = 0
  const 줄 = 쓸.map((r, k) => {
    let 번호 = ''
    if (r.깊이 === 0) 번호 = '◈'
    else if (r.깊이 === 1) { 일++; 이 = 0; 번호 = String(일) }
    else { 이++; 번호 = (일 || 0) + '.' + 이 }
    const 쪽 = (S) => S && { 금액: S.금[k], 보할: S.합.순 > 0 ? S.금[k] / S.합.순 : 0, 칸값: S.칸값[k], 시작: S.시[k], 끝: S.끝[k] }
    return { i: r.i, 깊이: r.깊이, 번호, 이름: r.이름, 수량: r.수량 ?? '', 단위: r.단위 ?? '', 뿌리: 부모[k] < 0, 당: 쪽(당), 변: 쪽(변), 바뀜: !!(변 && (Math.abs(변.금[k] - 당.금[k]) > 0.5 || 변.시[k] !== 당.시[k] || 변.끝[k] !== 당.끝[k])) }
  })
  if (!쓸.length) 경고.push('공종을 적으면 공정표가 그려집니다')
  return { 칸, 줄, 합: { 당: 당.합, 변: 변 ? 변.합 : null }, 경고, 두줄 }
}

/** 🧪 예시 — 지어낸 공사(실제 현장 아님) · 금액 단위 천원 */
export function 예시변경공정() {
  return {
    공사명: '○○지구 배수개선사업 (예시 — 실제 공사 아님)', 제목말: '총괄 (변경)', 착공: '2026-03-02', 준공: '2027-06-30', 변준공: '2027-10-29',
    간격: '월', 단위: '천원', 도급: '3480000', 변도급: '3720000', 변경: true, 상호: '',
    공종: [
      { 깊이: 0, 이름: '토목공사', 수량: '1', 단위: '식', 금액: '', 시작: '', 끝: '', 변금액: '', 변시작: '', 변끝: '' },
      { 깊이: 1, 이름: '배수장공사', 수량: '1', 단위: '식', 금액: '1120000', 시작: '2026-06-01', 끝: '2027-03-31', 변금액: '1260000', 변시작: '2026-07-01', 변끝: '2027-06-30' },
      { 깊이: 2, 이름: '토공', 수량: '1', 단위: '식', 금액: '210000', 시작: '2026-06-01', 끝: '2026-09-30', 변금액: '245000', 변시작: '2026-07-01', 변끝: '2026-11-30' },
      { 깊이: 2, 이름: '가물막이', 수량: '1', 단위: '식', 금액: '42000', 시작: '2026-06-01', 끝: '2026-07-31', 변금액: '', 변시작: '', 변끝: '' },
      { 깊이: 2, 이름: '유수지', 수량: '1', 단위: '식', 금액: '95000', 시작: '2026-10-01', 끝: '2027-01-31', 변금액: '102000', 변시작: '2026-11-01', 변끝: '2027-03-31' },
      { 깊이: 1, 이름: '배수로공사', 수량: '1', 단위: '식', 금액: '720000', 시작: '2026-03-02', 끝: '2027-02-28', 변금액: '760000', 변시작: '', 변끝: '2027-06-30' },
      { 깊이: 2, 이름: '토공', 수량: '1', 단위: '식', 금액: '118000', 시작: '2026-03-02', 끝: '2026-08-31', 변금액: '', 변시작: '', 변끝: '2026-10-31' },
      { 깊이: 2, 이름: '구조물공', 수량: '1', 단위: '식', 금액: '350000', 시작: '2026-05-01', 끝: '2027-01-31', 변금액: '372000', 변시작: '', 변끝: '2027-05-31' },
      { 깊이: 1, 이름: '부대공', 수량: '1', 단위: '식', 금액: '150000', 시작: '2027-01-01', 끝: '2027-06-30', 변금액: '175000', 변시작: '2027-03-01', 변끝: '2027-10-29' },
      { 깊이: 1, 이름: '사급자재대', 수량: '1', 단위: '식', 금액: '380000', 시작: '2026-04-01', 끝: '2027-05-31', 변금액: '400000', 변시작: '2026-05-01', 변끝: '2027-09-30' },
    ],
  }
}
