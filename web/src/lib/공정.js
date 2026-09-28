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
import { readWorkbook } from './qtoxlsx.js'

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
  const 칸 = 칸만들기(P.착공 || (시작 !== null ? 번날(시작) : ''), P.준공 || (끝 !== null ? 번날(끝) : ''), P.간격 || '월')
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

const 글 = (x) => (x === null || x === undefined ? '' : String(x).trim())
const 붙 = (x) => 글(x).replace(/\s+/g, '')
const 합계줄 = /^[\[(]?(합계|소계|계|총계|누계|총공사비|공사비|직접공사비|간접공사비|순공사비|순공사원가|일반관리비|이윤|부가가치세|부가세|도급액|도급금액|총원가|재료비|노무비|경비|계:?|합:?)[\])]?$/

/**
 * 내역서(.xlsx)에서 공종과 금액 — «공종별 집계표» 시트를 먼저 보고, 없으면 «식» 단위 줄
 * @returns {공종:[{이름, 금액}], 시트, 말}
 */
export function 내역공종(bytes, 이름 = '내역서') {
  const wb = readWorkbook(bytes)
  const 시트들 = Object.entries(wb).filter(([, g]) => g && g.length)
  const 순 = [...시트들].sort((a, b) => 점수(b[0]) - 점수(a[0]))
  const 말 = []
  for (const [시트, grid] of 순) {
    const r = 집계읽기(grid)
    if (r.length >= 2) {
      const 금있음 = r.some((x) => x.금액 > 0)
      말.push(시트 + ': ' + r.length + '공종' + (금있음 ? '' : ' (금액 비어 있음)'))
      return { 공종: r, 시트, 말, 금있음 }
    }
    말.push(시트 + ': 공종 못 찾음')
  }
  throw new Error('내역서에서 «공종·금액» 집계를 못 찾았습니다 (' + 말.slice(0, 5).join(' / ') + ') — 공종과 금액을 직접 적어 주십시오')
}
function 점수(시트) { const u = 붙(시트); return (/공종별|집계/.test(u) ? 3 : 0) + (/총괄|총집계/.test(u) ? 1 : 0) + (/원가계산|일위|단가|명세/.test(u) ? -3 : 0) }

/** 한 시트 — 머리 줄(공종·명칭·품명 + 금액·합계) 찾고, 공종 줄마다 합계 금액(없으면 재료·노무·경비 금액의 합) */
function 집계읽기(grid) {
  let hi = -1
  for (let i = 0; i < Math.min(grid.length, 25); i++) {
    const c = (grid[i] || []).map(붙)
    if (c.some((x) => /^(공종|공종명|명칭|품명|공사명|공사종류|내역|구분)$/.test(x))) { hi = i; break }
  }
  if (hi < 0) return []
  const h1 = (grid[hi] || []).map(붙), h2 = (grid[hi + 1] || []).map(붙)
  const 넓이 = Math.max(h1.length, h2.length)
  const iN = h1.findIndex((x) => /^(공종|공종명|명칭|품명|공사명|공사종류|내역|구분)$/.test(x))
  const iU = h1.findIndex((x) => /^단위$/.test(x))
  const iQ = h1.findIndex((x) => /^수량$/.test(x))
  // 금액 열: «합계» 머리 아래 «금액» 이 있으면 그 열, 아니면 «합계»·«금액» 열 · 재료·노무·경비 금액 열(더함)
  let i합 = -1
  const 금액열 = []
  for (let j = 0; j < 넓이; j++) {
    const a = h1[j] || '', b = h2[j] || ''
    if (/^금액$/.test(b)) {
      // 어느 큰 머리 아래인가 — 왼쪽으로 가장 가까운 비어 있지 않은 윗머리
      let k = j; while (k >= 0 && !h1[k]) k--
      const 윗 = k >= 0 ? h1[k] : ''
      if (/합계|총/.test(윗)) i합 = j
      else if (/재료|노무|경비/.test(윗)) 금액열.push(j)
    } else if (/^(합계금액|합계|총액|금액|공사비)$/.test(a) && !/^(단가)$/.test(b)) {
      if (/합계|총액|공사비/.test(a) && i합 < 0) i합 = j
      else if (a === '금액' && i합 < 0) i합 = j
    }
  }
  const 데이터시작 = h2.some((x) => /^(단가|금액)$/.test(x)) ? hi + 2 : hi + 1
  const out = []
  for (let r = 데이터시작; r < grid.length; r++) {
    const row = grid[r] || []
    let 이름 = 글(row[iN])
    if (!이름) continue
    이름 = 이름.replace(/^\s*[\d]+[.)]\s*/, '').replace(/^\s*[가-하][.)]\s*/, '').trim()
    const u = 붙(이름)
    if (!u || 합계줄.test(u)) continue
    if (/합계|소계|총계|누계/.test(u)) { if (out.length) break; continue }     // 첫 합계 줄 아래는 간접비·이윤 등 — 공종이 아님
    if (/관리비|이윤|부가가치|보험료|간접|기타경비|공사손해|퇴직|환경보전|보증수수료|하도급|건설기계|물가|보정|명세/.test(u)) continue
    if (iU >= 0 && 글(row[iU]) && !/식|式|LS|L\.S/i.test(글(row[iU])) && iQ >= 0 && 수(row[iQ]) !== 1) continue   // 집계가 아닌 세부 품목
    let 금 = i합 >= 0 ? 수(row[i합]) : 0
    if (!(금 > 0) && 금액열.length) 금 = 금액열.reduce((s, j) => s + Math.max(0, 수(row[j])), 0)
    out.push({ 이름, 금액: Math.round(금) })
  }
  // 같은 이름이 여러 번이면 더함
  const m = new Map()
  for (const x of out) m.set(x.이름, (m.get(x.이름) || 0) + x.금액)
  return [...m].map(([이름, 금액]) => ({ 이름, 금액 })).slice(0, 60)
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
