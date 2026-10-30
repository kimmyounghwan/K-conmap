/**
 * 🗓 G466 골조 공정 — 칸(층 × 구간)마다 작업일을 넣으면 공정표 · 3D 재생 · 달마다 물량 · 기성 회차
 *   칸 = 📆 기성과 같은 칸(lib/골조모델.js 기성칸물량 — 구간물량과 같은 몫 규칙 · 칸 합 + 자리 없음 = 모델 전체)
 *   ■ 작업일은 소장님이 넣는 값 — ① 칸마다 같은 날 수 ② 팀 하루 거푸집 ㎡ 로(칸 거푸집 ÷ 하루 양, 올림) ③ 칸마다 고친 날 수(표에서)
 *     넣지 않은 칸은 «작업일 없음» 으로 남기고 날짜를 셈하지 않음(짐작해서 채우지 않음)
 *   ■ 날짜 = 작업일만 셈 — 쉬는 날(일요일 · 관공서 공휴일 · 토요일(고르면) · 그 밖에 넣은 날)은 건너뜀
 *     공휴일 = lib/해마다.js 공휴일표(표에 없는 해는 화면에 «그 해 공휴일 표 없음 — 일요일 · 토요일만 뺌»)
 *   ■ 차례 = 기본은 아래층부터(층 차례 · 구간 그은 차례) · 표에서 ▲▼ 로 바꿈
 *     팀 따로(구간마다 팀) = 같은 구간끼리 층을 이어 감(A팀 1층 → A팀 2층 …) · 구간끼리는 함께 · 아니면 한 줄로 차례대로
 *   ■ 달마다 물량 = 칸 물량을 그 칸 작업일에 고르게 나눠 그 달에 든 작업일만큼(예정 — 화면 · 엑셀에 그렇게 적음)
 *   시험: node tools/시험_골조공정.mjs (가상 예시 모델만)
 */
import { 공휴일표 } from './해마다.js'
import { 기성칸물량, 기성칸차례, 기성상태, 기성회차더하기, 기성칸바꾸기, 공정정돈, 공정빈 } from './골조모델.js'

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
/** 요일 번호(0 = 일) */
export const 요일번 = (n) => ((n % 7) + 7 + 4) % 7
export const 요일글 = (t) => { const n = 날번(t); return n === null ? '' : '일월화수목금토'[요일번(n)] }
export const 짧은날 = (t) => (t ? (+t.slice(5, 7)) + '.' + (+t.slice(8, 10)) : '')
const 공휴번 = new Set(Object.values(공휴일표).flat().map(날번).filter((n) => n !== null))
const 공휴해 = new Set(Object.keys(공휴일표).map(Number))
const 갈래 = ['콘크리트', '거푸집', '철근', '데크']

/** 쉬는 날 판정기 — P(정돈한 공정) 의 일쉼 · 토쉼 · 공휴쉼 · 더쉼 */
export function 쉼판(P) {
  const 더 = new Set((P.더쉼 || []).map(날번).filter((n) => n !== null))
  return (n) => {
    const w = 요일번(n)
    if (P.일쉼 && w === 0) return true
    if (P.토쉼 && w === 6) return true
    if (P.공휴쉼 && 공휴번.has(n)) return true
    return 더.has(n)
  }
}
/** 칸 작업일 — 고친 값 → (거푸집 방법) 칸 거푸집 ÷ 하루 양 올림 → (같은 날 방법) 기본 · 없으면 null */
export function 칸작업일(P, c) {
  const 고침 = P.일수 && P.일수[c.열쇠]
  if (고침) return { 일수: 고침, 근거: '고침' }
  if (P.방법 === '거푸집') {
    if (P.하루 > 0 && c.합.거푸집 > 1e-9) return { 일수: Math.max(1, Math.ceil(c.합.거푸집 / P.하루 - 1e-9)), 근거: '거푸집' }
    return { 일수: null, 근거: P.하루 > 0 ? '거푸집 없음' : '하루 양 없음' }
  }
  if (P.기본 > 0) return { 일수: P.기본, 근거: '기본' }
  return { 일수: null, 근거: '기본 없음' }
}
/** 칸 차례 — P.순서(있는 칸만) 다음에 나머지를 기본 차례로 */
export function 공정차례(M, Q, P) {
  const 기본 = 기성칸차례(M, Q).map((c) => c.열쇠)
  const 앞 = ((P && P.순서) || []).filter((k) => Q.칸.has(k))
  const 앞들 = new Set(앞)
  return [...앞, ...기본.filter((k) => !앞들.has(k))]
}

/**
 * 공정 셈
 * @returns { P, Q, 다됨, 까닭, 줄: [{열쇠, 층, 구간, 구간이름, 차례, 일수, 근거, 사슬, 시작, 끝, a, b(날 번호), 합}], 모자람: [열쇠],
 *            시작, 끝, 작업일(시작~끝 사이 작업일), 달력일, 날들: [날 번호(작업일)], 공휴없음: [해] }
 */
export function 공정셈(M, S, Q0 = null) {
  const P = 공정정돈(M.공정) || 공정빈()
  const Q = Q0 || 기성칸물량(M, S)
  const 차례 = 공정차례(M, Q, P)
  const 줄 = 차례.map((k, i) => {
    const c = Q.칸.get(k)
    const d = 칸작업일(P, c)
    return { 열쇠: k, 층: c.층, 구간: c.구간, 구간이름: c.구간이름, 차례: i + 1, 일수: d.일수, 근거: d.근거, 사슬: P.팀 ? c.구간 : '한', 시작: '', 끝: '', a: null, b: null, 합: c.합 }
  })
  const 모자람 = 줄.filter((c) => !c.일수).map((c) => c.열쇠)
  const 시작0 = 날번(P.시작)
  const 기본 = { P, Q, 줄, 모자람, 시작: '', 끝: '', 작업일: 0, 달력일: 0, 날들: [], 공휴없음: [] }
  if (!줄.length) return { ...기본, 다됨: false, 까닭: '칸 없음' }
  if (시작0 === null) return { ...기본, 다됨: false, 까닭: '시작 날 없음' }
  if (모자람.length) return { ...기본, 다됨: false, 까닭: '작업일 없는 칸 ' + 모자람.length + '곳' }
  const 쉼 = 쉼판(P)
  const 첫일 = (n) => { let d = n; for (let i = 0; i < 400 && 쉼(d); i++) d++; return d }
  const 사슬끝 = new Map()
  for (const c of 줄) {
    const 앞 = 사슬끝.get(c.사슬)
    const a = 첫일(앞 === undefined ? 시작0 : 앞 + 1)
    let b = a
    for (let k = 1; k < c.일수;) { b++; if (!쉼(b)) k++ }
    c.a = a; c.b = b; c.시작 = 번날(a); c.끝 = 번날(b)
    사슬끝.set(c.사슬, b)
  }
  const a0 = Math.min(...줄.map((c) => c.a)), b0 = Math.max(...줄.map((c) => c.b))
  const 날들 = []
  for (let n = a0; n <= b0; n++) if (!쉼(n)) 날들.push(n)
  const 해들 = []
  for (let y = +번날(a0).slice(0, 4); y <= +번날(b0).slice(0, 4); y++) if (!공휴해.has(y)) 해들.push(y)
  return { ...기본, 다됨: true, 까닭: '', 시작: 번날(a0), 끝: 번날(b0), a: a0, b: b0, 작업일: 날들.length, 달력일: b0 - a0 + 1, 날들, 공휴없음: P.공휴쉼 ? 해들 : [] }
}

/** 그 날 칸 상태 — '전'(아직) · '중'(하는 중) · '끝' */
export function 칸날상태(c, 날) {
  const n = typeof 날 === 'number' ? 날 : 날번(날)
  if (n === null || c.a === null) return '전'
  return n < c.a ? '전' : n > c.b ? '끝' : '중'
}
/** 그 날 상태 셈 — {끝: [열쇠], 중: [열쇠], 전: [열쇠]} */
export function 날상태(R, 날) {
  const o = { 끝: [], 중: [], 전: [] }
  for (const c of R.줄) o[칸날상태(c, 날)].push(c.열쇠)
  return o
}
/** 부재 id → 그 날 상태(부재가 가장 많이 든 칸 · 칸이 없으면 '전') */
export function 부재날상태(R, 날) {
  const 칸상 = new Map(R.줄.map((c) => [c.열쇠, 칸날상태(c, 날)]))
  const m = new Map()
  for (const [id, k] of R.Q.어디) m.set(id, (k && 칸상.get(k)) || '전')
  return m
}

/**
 * 달마다(예정) — 칸 물량을 그 칸 작업일에 고르게 나눠 그 달에 든 작업일만큼
 * @returns [{달: 'YYYY-MM', 작업일, 칸: [{열쇠, 일, 시작, 끝}], 양: {갈래 → 값}, 금액, 누계금액}] · 금액은 단가(📆 기성 단가 — 고른 갈래만)가 있을 때만
 */
export function 달마다(R, 단가 = {}, 고른갈래 = ['콘크리트', '거푸집', '철근']) {
  if (!R.다됨) return []
  const 쉼 = 쉼판(R.P)
  const 달 = new Map()
  const 얻 = (ym) => { let o = 달.get(ym); if (!o) { o = { 달: ym, 작업일: 0, 칸: [], 양: { 콘크리트: 0, 거푸집: 0, 철근: 0, 데크: 0 }, 금액: 0, 누계금액: 0 }; 달.set(ym, o) } return o }
  for (const n of R.날들) 얻(번날(n).slice(0, 7)).작업일++
  for (const c of R.줄) {
    const 셈 = new Map()
    for (let n = c.a; n <= c.b; n++) if (!쉼(n)) { const ym = 번날(n).slice(0, 7); 셈.set(ym, (셈.get(ym) || 0) + 1) }
    for (const [ym, 일] of 셈) {
      const o = 얻(ym)
      o.칸.push({ 열쇠: c.열쇠, 층: c.층, 구간이름: c.구간이름, 일, 시작: c.시작, 끝: c.끝 })
      for (const k of 갈래) o.양[k] += (c.합[k] || 0) * 일 / c.일수
    }
  }
  const 배 = { 콘크리트: 1, 거푸집: 1, 철근: 0.001, 데크: 1 }
  const 줄 = [...달.values()].sort((a, b) => (a.달 < b.달 ? -1 : 1))
  let 누 = 0
  const 단가있음 = 고른갈래.some((k) => 단가[k] > 0)
  for (const o of 줄) {
    if (단가있음) { o.금액 = Math.floor(고른갈래.reduce((a, k) => a + (단가[k] > 0 ? o.양[k] * 배[k] * 단가[k] : 0), 0) + 1e-6); 누 += o.금액; o.누계금액 = 누 }
  }
  return 줄
}

/** 그 날까지 끝난 칸 → 📆 기성 새 회차(앞 회차에 이미 든 칸은 뺌) — {M, 새: [열쇠], 회} */
export function 공정기성(M, R, 날) {
  const n = 날번(날)
  if (!R.다됨 || n === null) return { M, 새: [], 회: null }
  const 상 = 기성상태(M)
  const 새 = R.줄.filter((c) => c.b <= n && !상.has(c.열쇠)).map((c) => c.열쇠)
  if (!새.length) return { M, 새: [], 회: null }
  let N = 기성회차더하기(M, 날)
  const 회 = N.기성.고른
  N = 기성칸바꾸기(N, 회, 새, true)
  return { M: N, 새, 회 }
}

/** 공정 고치기(정돈해서) */
export const 공정고치기 = (M, 고칠) => {
  const 새 = 공정정돈({ ...(M.공정 || 공정빈()), ...고칠 })
  const N = { ...M }
  if (새) N.공정 = 새; else delete N.공정
  return N
}
/** 칸 차례 옮기기(▲ = -1 · ▼ = +1) */
export function 공정옮기기(M, Q, 열쇠, 쪽) {
  const 차 = 공정차례(M, Q, 공정정돈(M.공정) || 공정빈())
  const i = 차.indexOf(열쇠), j = i + 쪽
  if (i < 0 || j < 0 || j >= 차.length) return M
  ;[차[i], 차[j]] = [차[j], 차[i]]
  return 공정고치기(M, { 순서: 차 })
}
/** 🧪 가상 예시 공정(예시 모델에만 — 화면에 «예시 값» 으로 적음) */
export const 예시공정 = () => ({ 시작: '2027-03-22', 방법: '같은날', 기본: 6, 일수: {}, 팀: true, 토쉼: false, 일쉼: true, 공휴쉼: true, 더쉼: [], 순서: [] })

const 층글 = (f) => (f === 'FT' ? 'FT' : f + '층')
export const 칸이름 = (c) => (c.구간이름 === '층 전체' ? 층글(c.층) : 층글(c.층) + ' ' + c.구간이름)

/** 엑셀 시트 — 골조공정표(칸 · 날짜 · 물량 · 주마다 ■) · 월별예정 · 공정조건 (다 된 공정만) */
export function 공정시트(M, S, ST, R0 = null) {
  const R = R0 || 공정셈(M, S)
  if (!R.다됨) return []
  const q = (v, d) => ({ v: +(+v || 0).toFixed(d), st: ST.QTY })
  /* 주 칸 — 시작 주 월요일부터 끝 주까지 */
  const 월 = (n) => n - ((요일번(n) + 6) % 7)
  const 주들 = []
  for (let n = 월(R.a); n <= R.b; n += 7) 주들.push(n)
  const 쉼 = 쉼판(R.P)
  const 든주 = (c, w) => { for (let n = Math.max(w, c.a); n <= Math.min(w + 6, c.b); n++) if (!쉼(n)) return true; return false }
  const rows = R.줄.map((c) => [c.차례, 층글(c.층), c.구간이름, c.일수, c.시작, c.끝, q(c.합.콘크리트, 3), q(c.합.거푸집, 3), q(c.합.철근 / 1000, 4), ...주들.map((w) => (든주(c, w) ? { v: '■', st: ST.FILLIN } : ''))])
  const 합 = (k) => R.줄.reduce((a, c) => a + (c.합[k] || 0), 0)
  rows.push(['합계', '', R.줄.length + '칸', '', R.시작, R.끝, q(합('콘크리트'), 3), q(합('거푸집'), 3), q(합('철근') / 1000, 4), ...주들.map(() => '')])
  const 시트 = [{ name: '골조공정표', head: ['차례', '층', '구간', '작업일', '시작', '끝', '콘크리트(㎥)', '거푸집(㎡)', '철근(ton)', ...주들.map((w) => 짧은날(번날(w)))], rows, widths: [6, 6, 14, 7, 11, 11, 12, 12, 11, ...주들.map(() => 5)], freeze: 1 }]
  const g = M.기성 || {}
  const 달 = 달마다(R, g.단가 || {}, g.갈래 || ['콘크리트', '거푸집', '철근'])
  const 금 = 달.some((o) => o.금액 > 0)
  const 달줄 = 달.map((o) => [o.달, o.작업일, o.칸.map((c) => 칸이름(c) + '(' + c.일 + '일)').join(' · '), q(o.양.콘크리트, 3), q(o.양.거푸집, 3), q(o.양.철근 / 1000, 4), ...(금 ? [{ v: o.금액, st: ST.INT }, { v: o.누계금액, st: ST.INT }] : [])])
  달줄.push(['합계', 달.reduce((a, o) => a + o.작업일, 0), '', q(합('콘크리트'), 3), q(합('거푸집'), 3), q(합('철근') / 1000, 4), ...(금 ? [{ v: 달.reduce((a, o) => a + o.금액, 0), st: ST.INT }, ''] : [])])
  시트.push({ name: '월별예정', head: ['달', '작업일', '하는 칸(그 달 작업일)', '콘크리트(㎥)', '거푸집(㎡)', '철근(ton)', ...(금 ? ['예정 금액(원)', '누계 금액(원)'] : [])], rows: 달줄, widths: [9, 7, 60, 12, 12, 11, ...(금 ? [14, 14] : [])], freeze: 1 })
  const P = R.P
  const 쉼글 = [P.일쉼 && '일요일', P.공휴쉼 && '관공서 공휴일', P.토쉼 && '토요일'].filter(Boolean).join(' · ') || '없음'
  시트.push({ name: '공정조건', head: ['구분', '내용'], rows: [
    ['시작 날', P.시작],
    ['작업일 정하기', P.방법 === '거푸집' ? '팀 하루 거푸집 ' + P.하루 + ' ㎡ — 칸 거푸집 ÷ 하루 양(올림)' : '칸마다 ' + P.기본 + '일'],
    ['고친 칸', Object.keys(P.일수 || {}).length ? Object.entries(P.일수).map(([k, v]) => { const c = R.줄.find((x) => x.열쇠 === k); return (c ? 칸이름(c) : k) + ' ' + v + '일' }).join(' · ') : '없음'],
    ['차례', P.팀 ? '구간마다 팀 따로 — 같은 구간끼리 층을 이어 감' : '한 줄로 차례대로'],
    ['쉬는 날', 쉼글 + (P.더쉼 && P.더쉼.length ? ' · 그 밖 ' + P.더쉼.join(', ') : '')],
    ['공휴일 표', R.공휴없음.length ? R.공휴없음.join(' · ') + '년 공휴일 표 없음 — 그 해는 공휴일을 빼지 않음' : '있음(해마다 표)'],
    ['공기', R.시작 + ' ~ ' + R.끝 + ' · 작업일 ' + R.작업일 + '일 · 달력 ' + R.달력일 + '일'],
    ['달마다 물량', '칸 물량을 그 칸 작업일에 고르게 나눠 그 달 작업일만큼(예정)'],
    ['칸 물량', '📆 기성과 같은 칸(층 × 구간) — 구간 선에 걸친 부재는 길이 · 넓이로 나눔 · 칸 합 = 모델 전체(자리 없는 덧줄 빼고)'],
  ], widths: [16, 90] })
  return 시트
}
