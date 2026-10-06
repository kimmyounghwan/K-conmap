/**
 * 낙찰맞추기.js — 올린 설계내역서 «틀 그대로» 낙찰금액(또는 비율)에 맞춘 계약내역서 (G169 · 2026-10-06)
 *
 * 소장님: 「비율 맞추기면 내역서를 주는 거잖아. 그럼 내역서 틀을 유지 해줘야지 … 올린 내역서에서 비율만 맞춰주면 되는데」
 *         「낙찰금액 맞추기」 → 설계안(끝전은 이윤에서 · A값 항목은 설계금액 그대로) → 「해줘」
 *
 * ■ 하는 일 — 올린 엑셀의 시트 · 칸 · 서식 · 병합 · 인쇄영역을 그대로 두고 «숫자 칸만» 새 값으로 갈아 끼웁니다
 *    · 시트를 덧붙이지 않습니다 · 원본처럼 «값» 으로 넣습니다(수식을 새로 만들지 않음)
 *    ① 내역 품목: 재료비 · 노무비 · 경비 단가 × 같은 비율(단수) → 금액 = 수량 × 단가 (lib/비율.js 맞추기 그대로)
 *    ② 공종 머리 · 소계: 아래 품목을 다시 더함
 *    ③ 원가계산: 원가계산서 시트의 «구분 · 요율 · 산출근거»(예: 4 × 0.191 · B × 0.0356 · (A + B) × 0.055 · D × 0.08 ·
 *       (B + C + E) × 0.15 · (6:17) · (I + J), 천원미만 절삭)를 그대로 읽어 다시 셈 — 근거에 모르는 말(«도급자관급»)이 있으면
 *       원본 금액에서 그 몫을 거꾸로 셈해 그대로 둡니다. 안전관리비 · 운반비 · 폐기물처리비처럼 근거 없는 줄은 내역의 그 묶음 합.
 *    ④ A값 항목(국민연금 · 건강 · 노인장기요양 · 퇴직공제 · 산업안전보건관리비 · 안전관리비 · 품질관리비)은 설계금액 그대로(끌 수 있음)
 *       — 안전관리비 · 품질관리비 묶음의 품목도 그대로입니다.
 *    ⑤ 관급자재는 손대지 않습니다(lib/비율.js 관급 판별 그대로).
 *    ⑥ 낙찰금액을 넣으면: 도급액이 낙찰금액을 넘지 않는 가장 큰 비율을 찾고, 남는 끝전은 «이윤» 에서 맞춰 도급액 = 낙찰금액.
 *       (부가세가 1~2원 어긋나면 부가세 = 낙찰금액 − 공급가액 으로 맞춤)
 *    ⑦ 총괄표처럼 같은 금액이 다시 적힌 시트는 «이름 + 당초 금액» 이 같은 칸을 찾아 새 금액으로 바꿉니다.
 * ■ 못 하는 것 — 숨기지 않고 «경고» 로 돌려 드립니다(근거 없는 원가 줄은 당초 × 비율 · 못 찾은 금액 칸).
 * ■ 파일은 브라우저 안에서만 다룹니다.
 */
import { readWorkbook, numToCol } from './qtoxlsx.js'
import { 맞추기, 단수, 내부 } from './비율.js'
import { unzipSync, zipSync, strToU8, strFromU8 } from 'fflate'

const { 속성, xesc, 이름표, 덩어리, 공유풀기, 시트경로 } = 내부

/* ── 글 · 숫자 ─────────────────────────────────────────── */
const 숫자 = (x) => {
  if (typeof x === 'number') return Number.isFinite(x) ? x : null
  const t = String(x ?? '').replace(/[,\s원]/g, '').trim()
  if (!t || !/^-?\d+(\.\d+)?$/.test(t)) return null
  return Number(t)
}
const 맨 = (t) => String(t ?? '').replace(/[\s　]+/g, '')
/** 이름 맞대기용 — 빈칸 · 앞 표시(◎ ▣ 1. 가. 1) …) · 괄호 기호를 뗍니다 */
export function 이름꼴(t) {
  let s = 맨(t).replace(/^[◎▣■□●○◆◇★☆▶※*·]+/, '')
  s = s.replace(/^(\d+(?:[.-]\d+)*[.)]?|\(\d+\)|[가-하][.)]|[ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ]+\.?)(?=[가-힣A-Za-z(])/, '')
  return s.replace(/[[\]【】〔〕<>〈〉《》「」]/g, '')
}
/** 원가 비목 이름 — 국민 · 분담 · 직접경비 같은 다른 이름을 한 꼴로 */
export function 원가꼴(t) {
  let s = 이름꼴(t).replace(/\(.*?\)/g, '')
  s = s.replace(/^국민/, '').replace(/분담금$/, '부담금').replace(/^산업재해보상보험료$/, '산재보험료')
  if (/^(직접경비|산출경비|경비)$/.test(s)) s = '산출경비'
  if (/^(산업안전보건관리비|산업안전관리비|산안비)$/.test(s)) s = '산업안전보건관리비'
  if (/^(퇴직공제부금|퇴직공제부금비|퇴직공제)$/.test(s)) s = '퇴직공제부금비'
  if (/^(도급액|도급금액|도급공사비|도급예정액|계약금액)$/.test(s)) s = '도급액'
  if (/^(공급가액|총원가)$/.test(s)) s = s
  return s
}
/* A값 — 낙찰률을 곱하지 않는 법정경비(적격심사 A값 항목) */
export const A값이름 = /^(건강보험료|연금보험료|노인장기요양보험료?|퇴직공제부금비|산업안전보건관리비|안전관리비|품질관리비)$/
const 관급이름 = /^관급자재(대|비)?$|^지급자재(대|비)?$/
const 바닥 = (v) => (v < 0 ? -Math.floor(-v + 1e-7) : Math.floor(v + 1e-7))

/* ══════════════════════════════════════════════════════════
   ① 원가계산서 시트 찾기 — 머리글에 «금액» + «비목 · 구분 · 과목 …»
     설계사무소마다 꼴이 달라(비목 | 구분 | 금액 | 요율 | 산출근거 · 구분 | 비목 | 금액 | 구성비 ·
     「E. 일반관리비」처럼 이름 앞에 기호 · 「직접노무비의 19.1%」 · 「(B1)*요율」 …) 칸 이름이 아니라 «내용» 으로 읽습니다
   ══════════════════════════════════════════════════════════ */
const 코드꼴 = /^([A-Z]\d{0,2}|\d{1,2})$/
const 머리말 = /^(비목|구분|과목|항목|구분비목|비목구분|공종|명칭|품명|공종명)$/
const 근거말 = /^(산출근거|근거|산출식|계산식|산식|내용|산출내역|비고|요율|구성비|적용요율|비율|적용기준|산출방법|산출기준|계산방법)$/
function 이름가르기(t) {
  /* 「E.일반관리비」 「5.간접노무비」 「1)직접공사비」 → 코드 + 이름 · 「(소계)」 → 소계 */
  let s = t, 코드 = ''
  const m = /^([A-Z]\d{0,2}|\d{1,2}|[가나다라마바사아자차카타파하](?:-\d{1,2})?)[.)．]+(?=[가-힣(ⓐ-ⓩ])/.exec(s)
  if (m) { 코드 = m[1]; s = s.slice(m[0].length) }
  if (!코드) s = s.replace(/^([ⓐ-ⓩ①-⑳]|[a-z][.)])[.)．]?/, '')
  if (/^\(.*\)$/.test(s)) s = s.slice(1, -1)
  return { 코드, 이름: s }
}
export function 원가표찾기(격자들, 뺄시트 = []) {
  const 뺄 = new Set(뺄시트)
  const 차례 = Object.keys(격자들 || {}).filter((k) => !뺄.has(k)).sort((a, b) => (/원가/.test(b) ? 1 : 0) - (/원가/.test(a) ? 1 : 0))
  let 고른 = null
  for (const 시트 of 차례) {
    const grid = 격자들[시트]
    if (!grid || !grid.length) continue
    for (let i = 0; i < Math.min(grid.length, 15); i++) {
      const c = (grid[i] || []).map((x) => 맨(x))
      const i금액 = c.findIndex((x) => /^금액$/.test(x))
      if (i금액 < 0) continue
      const 머리있음 = c.some((x, j) => j < i금액 && 머리말.test(x)) || (grid[i + 1] || []).some((x, j) => j < i금액 && 머리말.test(맨(x)))
      if (!머리있음) continue
      let 끝칸 = i금액 + 3
      c.forEach((x, j) => { if (j > i금액 && 근거말.test(x)) 끝칸 = Math.max(끝칸, j + 1) })
      /* 금액 앞에 있는 «산출근거 · 요율» 칸(구분 | 산출근거 | 금액 꼴) — 이름이 아니라 근거로 읽음 */
      const 첫근거 = c.findIndex((x, j) => j < i금액 && 근거말.test(x))
      const 앞근거 = new Set(첫근거 >= 0 ? Array.from({ length: i금액 - 첫근거 }, (_, k) => 첫근거 + k) : [])
      const rows = []
      for (let r = i + 1; r < grid.length; r++) {
        const row = grid[r] || []
        let 이름 = '', 이름칸 = -1, 구분 = ''
        for (let j = 0; j < i금액; j++) {
          const raw = row[j]
          if (raw === null || raw === undefined || 앞근거.has(j)) continue
          const t = 맨(raw)
          if (!t) continue
          if (코드꼴.test(t)) { 구분 = t; continue }
          if (typeof raw === 'number' || /^-?[\d,.]+%?$/.test(t)) continue
          이름 = t; 이름칸 = j
        }
        const 갈 = 이름가르기(이름)
        if (갈.코드 && !구분) 구분 = 갈.코드
        이름 = 갈.이름
        const 금 = 숫자(row[i금액])
        if (!이름 && 금 === null && !구분) continue
        const 글 = [], 수 = []
        for (const j of 앞근거) { const v = row[j]; if (v === null || v === undefined || v === '') continue; if (typeof v === 'number') 수.push(v); else { const n = 숫자(v); if (n !== null) 수.push(n); else 글.push(String(v)) } }
        if (/\(\s*\d+(\.\d+)?\s*%\s*\)/.test(String(row[이름칸] ?? ''))) 글.push(String(row[이름칸]))
        for (let j = i금액 + 1; j < Math.min(row.length, 끝칸); j++) {
          const v = row[j]
          if (v === null || v === undefined || v === '') continue
          if (typeof v === 'number') 수.push(v)
          else { const n = 숫자(v); if (n !== null) 수.push(n); else 글.push(String(v)) }
        }
        rows.push({ 줄: r + 1, 이름, 꼴: 원가꼴(이름), 구분, 금액: 금, 금액칸: i금액, 옛글: row[i금액], 글, 수, 근거: 글.join(' '),
          원이름: 이름칸 >= 0 ? String(row[이름칸] ?? '').trim() : 이름 })   /* 원이름 = 띄어 쓴 그대로(G171 하도급 대비표가 원본 글자 그대로 씀) */
      }
      if (rows.filter((x) => x.금액 !== null).length >= 5) {
        for (const x of rows) x.역 = 역할(x.꼴)
        /* 「경비」 줄과 「산출경비 · 기계경비」 줄이 함께 있으면 «경비» 는 경비 소계 */
        const 맨경비 = (x) => 이름꼴(x.이름).replace(/\(.*?\)/g, '') === '경비'
        if (rows.some((x) => x.역 === '산출경비' && !맨경비(x)) && rows.some(맨경비)) for (const x of rows) if (맨경비(x)) x.역 = '경계'
        /* 원가계산서다운지 — 알아본 비목(직접노무비 · 산재 · 일반관리비 · 이윤 · 부가세 …)이 몇 가지인지 */
        const 점 = new Set(rows.filter((x) => x.금액 !== null && x.역 && x.역 !== '소계' && x.역 !== '관급').map((x) => x.역)).size
        if (점 >= 4 && (!고른 || 점 > 고른.점)) 고른 = { 시트, 머리줄: i + 1, rows, 점 }
        break
      }
    }
  }
  return 고른
}

/* 비목 이름 → 구실(역) */
const 역표 = [
  ['관급', /^((도급자|관급자)?관급자재(대|비)?|지급자재(대|비)?|도급자관급|관급자관급|관급자재대금|관급비)$/], ['직재', /^직접재료비$/], ['간재', /^간접재료비$/],
  ['작업설', /^(작업설|작업부산물|부산물|작업설.?부산물)/], ['재계', /^재료비(소계|계)?$/],
  ['직노', /^직접노무비$/], ['간노', /^간접노무비$/], ['노계', /^노무비(소계|계)?$/],
  ['산출경비', /^(산출경비|기계경비|직접경비)$/], ['경계', /^경비(소계|계)$/],
  ['산재', /^(산재보험료|산업재해보상보험료)$/], ['고용', /^고용보험료$/], ['건강', /^건강보험료$/],
  ['연금', /^연금보험료$/], ['노인', /^노인장기요양보험료?$/], ['퇴직', /퇴직(공제|금공제)/],
  ['산안', /^산업안전보건관리비$|안전보건관리비/], ['석면', /석면/], ['임금', /임금채권/], ['법정분담', /^법정(분담|부담)금$/],
  ['환경', /환경보전비/], ['하도급보증', /하도급.*(보증|수수료)/], ['기계보증', /건설기계.*(보증|대여|대금)/], ['이행보증', /이행보증/],
  ['기타경비', /^기타경비$/], ['순공', /^순공사(원가|비)(계|합계|소계)?$|^순공사비원가$/],
  ['일관', /^일반관리비$/], ['이윤', /^이윤(이내|이하)?$/], ['공급', /^(공급가액|총원가|공급가|총공사원가|총원가계)$/], ['부가', /^부가(가치)?세$/],
  ['도급', /^도급액$/], ['총공사비', /^(총공사비|총사업비|총계|공사비총계|총공사금액)$/],
  ['폐기물', /폐기물/], ['배상', /배상/], ['소계', /^(소계|계|합계)$/],
]
function 역할(꼴) {
  if (꼴 === '산출경비' || 꼴 === '경비') return '산출경비'
  for (const [역, re] of 역표) if (re.test(꼴)) return 역
  return ''
}
const 합꼴역 = new Set(['소계', '재계', '노계', '경계', '순공', '공급', '도급', '총공사비', ''])
/* 요율 줄의 바탕(표준) — 원가계산 기준의 흔한 바탕 · 첫째가 기본, 나머지는 맞춰 볼 후보 */
const 바탕역 = {
  간노: [['직노']],
  산재: [['노계'], ['직노', '간노'], ['직노']], 고용: [['노계'], ['직노', '간노'], ['직노']],
  석면: [['노계'], ['직노']], 임금: [['노계'], ['직노']], 법정분담: [['노계'], ['직노']],
  건강: [['직노']], 연금: [['직노']], 퇴직: [['직노']], 노인: [['건강']],
  산안: [['재계', '직노'], ['재계', '직노', '관급']],
  환경: [['재계', '직노', '산출경비'], ['재계', '노계', '산출경비'], ['재계', '직노']],
  하도급보증: [['재계', '직노', '산출경비'], ['재계', '노계', '산출경비']],
  기계보증: [['재계', '직노', '산출경비'], ['재계', '노계', '산출경비']],
  이행보증: [['재계', '직노', '산출경비'], ['재계', '노계', '산출경비']],
  기타경비: [['재계', '노계'], ['재계', '직노']],
  일관: [['순공'], ['재계', '노계', '경계']],
  이윤: [['노계', '경계', '일관'], ['순공', '일관', '-재계']],
  부가: [['공급']],
  배상: [['공급'], ['순공', '일관', '이윤']],
}
const 합역 = {
  재계: [['직재', '간재', '-작업설'], ['직재', '간재'], ['직재']],
  노계: [['직노', '간노']],
  순공: [['재계', '노계', '경계'], ['재계', '직노', '산출경비']],
  공급: [['순공', '일관', '이윤']],
  도급: [['공급', '부가']],
}

/* ══════════════════════════════════════════════════════════
   ② 산출근거 읽기 — 「4 × 0.191」 「(A + 4+도급자관급) × 0.0207」 「(6:17)」 「(I +J), 천원미만 절삭」
                     「[2+3+5] x 5.5%」 「(B1)*요율」 「(D+E-A)*요율 이하」
   ══════════════════════════════════════════════════════════ */
export function 근거읽기(글, 구분들) {
  let s = String(글 || '').trim()
  if (!s) return null
  let 절삭 = 0
  if (/천원\s*(단위)?\s*(미만|절삭|절사)|1,?000원\s*미만/.test(s)) 절삭 = 1000
  else if (/만원\s*(단위)?\s*(미만|절삭|절사)/.test(s)) 절삭 = 10000
  else if (/백원\s*(단위)?\s*(미만|절삭|절사)/.test(s)) 절삭 = 100
  s = s.replace(/[,，].*$/, '').replace(/(천원|만원|백원).*$|절삭.*$|절사.*$/, '')
  s = s.replace(/[[{［【]/g, '(').replace(/[\]}］】]/g, ')')
  s = s.replace(/\s*(이하|이내|적용|미만|이상)\s*$/g, '').replace(/배\s*$/, '')
  s = s.replace(/[×＊✕xX](?=\s*[\d(.요])/g, '*').replace(/\s[xX]\s/g, ' * ').replace(/÷/g, '/').replace(/[＋]/g, '+').replace(/[－−]/g, '-')
  /* 「[나-1]의」 「[가+나]의」 — 요율 칸의 숫자를 곱함 */
  s = s.replace(/\)\s*의\s*$/, ') * 요율')
  /* 「가 · 나-1 · 다-4」 처럼 한글 · 붙임표 코드 — 자리표(§n§)로 바꿔 «나 − 1» 로 읽히지 않게 */
  const 긴코드 = [...구분들].filter((c) => !/^([A-Z]\d{0,2}|\d{1,2})$/.test(c)).sort((a, b) => b.length - a.length)
  긴코드.forEach((c, i) => {
    const e = c.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&')
    s = s.replace(new RegExp('(^|[\\s(+\\-*/:~])' + e + '(?=$|[\\s)+\\-*/:~])', 'g'), (m0, a) => a + '§' + i + '§')
  })
  const 낱 = []
  const re = /^\s*(§\d+§|\d+(?:\.\d+)?\s*%?|[A-Z]\d{0,2}(?![A-Za-z])|[가-힣]+|[()+\-*/:~])/
  let 남은 = s
  while (남은.trim()) {
    const m = re.exec(남은)
    if (!m) return 절삭 ? { 식: null, 절삭 } : null
    낱.push(m[1].replace(/\s+/g, ''))
    남은 = 남은.slice(m[0].length)
  }
  if (!낱.length) return 절삭 ? { 식: null, 절삭 } : null
  let k = 0
  const 다음 = () => 낱[k]
  const 먹 = () => 낱[k++]
  const 코드인가 = (t, 앞) => (/^[A-Z]\d{0,2}$/.test(t) || (/^\d+$/.test(t) && 앞 !== '*' && 앞 !== '/')) && 구분들.has(t)
  function 인수() {
    const t = 먹()
    if (t === undefined) throw new Error('끝')
    if (t === '(') { const e = 식(); if (먹() !== ')') throw new Error(')'); return e }
    if (t === '-') return { 꼴: '빼기', 값: 인수() }
    const 앞 = 낱[k - 2]
    if (/^§\d+§$/.test(t)) return { 꼴: '코드', 코드: 긴코드[Number(t.slice(1, -1))] }
    if (코드인가(t, 앞)) {
      if (다음() === ':' || 다음() === '~') { 먹(); const b = 먹(); if (!구분들.has(b)) throw new Error('범위'); return { 꼴: '범위', a: t, b } }
      return { 꼴: '코드', 코드: t }
    }
    if (/^\d+(\.\d+)?%$/.test(t)) return { 꼴: '수', 값: Number(t.slice(0, -1)) / 100 }
    if (/^\d+(\.\d+)?$/.test(t)) return { 꼴: '수', 값: Number(t) }
    if (t === '요율') return { 꼴: '요율' }
    if (/^[가-힣]+$/.test(t)) return { 꼴: '모름', 말: t }
    throw new Error('낱말 ' + t)
  }
  function 곱() {
    let e = 인수()
    while (다음() === '*' || 다음() === '/') { const o = 먹(); e = { 꼴: o, a: e, b: 인수() } }
    return e
  }
  function 식() {
    let e = 곱()
    while (다음() === '+' || 다음() === '-') { const o = 먹(); e = { 꼴: o, a: e, b: 곱() } }
    return e
  }
  try {
    const e = 식()
    if (k < 낱.length) return 절삭 ? { 식: null, 절삭 } : null
    return { 식: e, 절삭 }
  } catch (err) { return 절삭 ? { 식: null, 절삭 } : null }
}
function 셈하기(e, 값, 차례, X, 율 = null) {
  switch (e.꼴) {
    case '수': return e.값
    case '코드': { const v = 값.get(e.코드); if (v === undefined) throw new Error('아직'); return v }
    case '범위': {
      const a = 차례.indexOf(e.a), b = 차례.indexOf(e.b)
      if (a < 0 || b < 0) throw new Error('범위')
      let s = 0
      for (let i = Math.min(a, b); i <= Math.max(a, b); i++) { const v = 값.get(차례[i]); if (v === undefined) throw new Error('아직'); s += v }
      return s
    }
    case '요율': if (율 === null) throw new Error('요율'); return 율
    case '모름': return X
    case '빼기': return -셈하기(e.값, 값, 차례, X, 율)
    case '+': return 셈하기(e.a, 값, 차례, X, 율) + 셈하기(e.b, 값, 차례, X, 율)
    case '-': return 셈하기(e.a, 값, 차례, X, 율) - 셈하기(e.b, 값, 차례, X, 율)
    case '*': return 셈하기(e.a, 값, 차례, X, 율) * 셈하기(e.b, 값, 차례, X, 율)
    case '/': { const d = 셈하기(e.b, 값, 차례, X, 율); return d === 0 ? 0 : 셈하기(e.a, 값, 차례, X, 율) / d }
    default: throw new Error('꼴')
  }
}
const 모름있나 = (e) => !!e && (e.꼴 === '모름' || (e.a && 모름있나(e.a)) || (e.b && 모름있나(e.b)) || (e.값 && typeof e.값 === 'object' && 모름있나(e.값)))
const 요율있나 = (e) => !!e && (e.꼴 === '요율' || (e.a && 요율있나(e.a)) || (e.b && 요율있나(e.b)) || (e.값 && typeof e.값 === 'object' && 요율있나(e.값)))
const 코드들 = (e, out = new Set()) => {
  if (!e) return out
  if (e.꼴 === '코드') out.add(e.코드)
  if (e.꼴 === '범위') { out.add(e.a); out.add(e.b) }
  for (const k of ['a', 'b']) if (e[k]) 코드들(e[k], out)
  if (e.값 && typeof e.값 === 'object') 코드들(e.값, out)
  return out
}

/* 끝수 — 원본이 원 · 10원 · 백원 · 천원 · 만원 단위로 버림 · 반올림 · 올림 했는지 당초 값으로 알아냅니다 */
const 끝 = (v, u, m) => { const q = v / u; const w = m === 'r' ? Math.round(q) : m === 'c' ? Math.ceil(q - 1e-9) : Math.floor(q + 1e-9); return w * u }
function 끝수배우기(c, old, 큰단위) {
  if (!Number.isFinite(c) || old === null) return null
  if (Math.abs(c - old) < 1e-6) return { u: 1, m: 'f' }
  for (const u of 큰단위 ? [1, 10, 100, 1000, 10000] : [1]) for (const m of ['f', 'r', 'c']) if (Math.abs(끝(c, u, m) - old) < 0.5) return { u, m }
  if (Math.abs(c - old) <= 1) return { u: 1, m: 'f' }
  return null
}
/* 요율 후보 — 그 줄의 숫자 칸(18.4 · 0.0356) · 글 속 «3.56%» «× 0.0101» · «×1.2배» */
function 율후보(x) {
  const out = []
  const 넣 = (v) => { if (Number.isFinite(v) && v > 0 && v < 1.5 && !out.some((w) => Math.abs(w - v) < 1e-12)) out.push(v) }
  for (const v of x.수) if (v > 0 && v <= 100) { 넣(v / 100); 넣(v) }
  let 배 = 1
  for (const t of x.글) {
    for (const m of t.matchAll(/(\d+(?:\.\d+)?)\s*%/g)) 넣(Number(m[1]) / 100)
    for (const m of t.matchAll(/(?:^|[^\d.])(0\.\d+)/g)) 넣(Number(m[1]))
    const b = /[×xX*]\s*(1\.\d+)\s*배?/.exec(t); if (b) 배 = Number(b[1])
  }
  if (배 !== 1) for (const v of [...out]) 넣(v * 배)
  return out
}

/* ══════════════════════════════════════════════════════════
   ③ 원가계산 다시 셈
     당초 값으로 줄마다 «규칙» 을 배웁니다(산출근거 · 위 줄들의 합 · 표준 바탕 × 요율 · 내역 묶음) →
     새 값으로 같은 규칙을 다시 셈합니다. 규칙을 못 찾은 줄만 «당초 × 비율» (경고).
     옵션: { 비율, A값그대로, 덧(역 → 더할 원), 박음(역 → 박을 값), 끔(Set 줄 — 끝수 버림 없이 원 단위) }
   ══════════════════════════════════════════════════════════ */
export function 원가배우기(표, 옵션 = {}) {
  const 열쇠 = 옵션.A값그대로 === false ? '끔' : '켬'
  if (표.규칙 && 표.규칙[열쇠]) return 표.규칙[열쇠]
  const rows = 표.rows
  const 구분들 = new Set(rows.map((x) => x.구분).filter(Boolean))
  const 차례 = rows.map((x) => x.구분).filter(Boolean)
  const 역줄 = new Map()
  for (const x of rows) if (x.역 && x.금액 !== null && !역줄.has(x.역)) 역줄.set(x.역, x)
  const 규칙 = new Map()
  const 열림 = []
  const 옛 = (x) => (x.금액 === null ? 0 : x.금액)
  const 표시 = (x) => (x.역 === '작업설' && 옛(x) > 0 ? -1 : 1)
  const 역값 = (이름) => {
    const 빼 = 이름.startsWith('-'); const 역 = 빼 ? 이름.slice(1) : 이름
    if (역 === '관급') { const 관 = rows.filter((y) => y.역 === '관급' && y.금액 !== null && !/총|합계/.test(y.꼴)); return 관.length ? { 줄들: 관.map((y) => [y, 빼 ? -1 : 1]) } : null }
    const y = 역줄.get(역)
    return y ? { 줄들: [[y, 빼 ? -1 : 1]] } : null
  }
  const 바탕풀기 = (목록) => {
    const 줄들 = []
    for (const 이름 of 목록) { const v = 역값(이름); if (!v) return null; 줄들.push(...v.줄들) }
    return 줄들
  }
  const 합 = (줄들) => 줄들.reduce((a, [y, s]) => a + s * 옛(y), 0)
  /* 요율 줄의 바탕은 «그 줄보다 위» 에 있는 줄만 — 아래 줄(공급가액)을 바탕으로 잡으면 서로 기다리는 고리가 됨 */
  const 위바탕 = (목록, x) => { const 줄들 = 바탕풀기(목록); return 줄들 && 줄들.every(([y]) => y.줄 < x.줄) ? 줄들 : null }
  /* 코드 → 줄 — 같은 코드가 두 번 나오는 표(「5. 공사손해보험료」 · 「5. 소계」)도 있어 «그 줄에서 가장 가까운 위 줄» (없으면 아래 줄) */
  const 가까운 = (x) => {
    const m = new Map(), i = rows.indexOf(x)
    for (let j = rows.length - 1; j > i; j--) if (rows[j].구분) m.set(rows[j].구분, rows[j])
    for (let j = 0; j < i; j++) if (rows[j].구분) m.set(rows[j].구분, rows[j])
    return m
  }
  const 옛값들 = (m) => new Map([...m].map(([c, y]) => [c, y.금액 === null ? 0 : y.금액]))
  const 식줄들 = (e, m) => {
    const out = []
    const 넣 = (y) => { if (y && !out.includes(y)) out.push(y) }
    for (const c of 코드들(e)) 넣(m.get(c))
    ;(function 범위(e2) { if (!e2) return; if (e2.꼴 === '범위') { const a = 차례.indexOf(e2.a), b = 차례.indexOf(e2.b); for (let i = Math.min(a, b); i <= Math.max(a, b); i++) 넣(m.get(차례[i])) } for (const k of ['a', 'b']) if (e2[k]) 범위(e2[k]); if (e2.값 && typeof e2.값 === 'object') 범위(e2.값) })(e)
    return out
  }
  const 다시이름 = (x, 든줄) => {
    /* 「소계」 줄이 무엇의 소계인지 — 든 줄로 알아냅니다(재료비 · 노무비 · 경비 · 순공사원가) */
    if (x.역 !== '소계' && x.역 !== '') return
    const 든 = (역) => 든줄.some((y) => y.역 === 역)
    const 재 = 든('직재') || 든('재계'), 노 = 든('직노') || 든('간노') || 든('노계'), 경 = 든('산재') || 든('산출경비') || 든('고용') || 든('기타경비') || 든('경계')
    const 새역 = 재 && 노 ? (경 && 든('재계') && 든('노계') && 든('경계') ? '순공' : '') : 재 ? '재계' : 노 ? '노계' : 경 ? '경계' : ''
    if (새역 && !역줄.has(새역)) { x.역 = 새역; 역줄.set(새역, x) }
  }
  for (const x of rows) {
    if (x.금액 === null) continue
    if (!x.이름 && !x.구분 && !x.글.length) continue        /* 이름 · 근거 없는 줄(검산용 숫자) — 손대지 않음 */
    const 큰 = 합꼴역.has(x.역) || x.역 === '부가'
    let 규 = null
    if (x.역 === '관급') 규 = { 꼴: '고정', 말: '관급 — 그대로' }
    else if (옵션.A값그대로 !== false && A값이름.test(x.꼴)) 규 = { 꼴: '고정', 말: 'A값 — 설계금액 그대로' }
    else if (x.금액 === 0) 규 = { 꼴: '영', 말: '0' }
    /* ⓐ 산출근거(코드로 된 식) */
    let 근 = null
    const 코드줄 = 가까운(x), 옛코드 = 옛값들(코드줄)
    if (!규) {
      /* 글 칸이 여럿이면(「15%」 · 「(B + C + E) × 0.15」) 코드가 든 식을 고릅니다 */
      for (const t of x.글) { const g = 근거읽기(t, 구분들); if (g && g.식 && 코드들(g.식).size) { 근 = g; 근.글 = t; break } if (g && !근) { 근 = g; 근.글 = t } }
      if (근 && 근.식 && 코드들(근.식).size && !코드들(근.식).has(x.구분)) {
        const 율들 = 요율있나(근.식) ? 율후보(x) : [null]
        for (const 율 of 율들) {
          try {
            if (모름있나(근.식)) {
              const f0 = 셈하기(근.식, 옛코드, 차례, 0, 율), f1 = 셈하기(근.식, 옛코드, 차례, 1, 율)
              const X = Math.abs(f1 - f0) > 1e-12 ? (x.금액 - f0) / (f1 - f0) : 0
              규 = { 꼴: '식', 식: 근.식, X, 율, 코드줄, 끝수: 근.절삭 ? { u: 근.절삭, m: 'f' } : { u: 1, m: 'f' }, 말: '산출근거 ' + 근.글 }
              break
            }
            const c0 = 셈하기(근.식, 옛코드, 차례, 0, 율)
            /* 「× 15.0」 처럼 % 를 빼고 쓴 근거 — 1/100 도 맞대 봄 */
            for (const 곱 of [1, 0.01]) {
              const c = c0 * 곱
              const 끝수 = 근.절삭 && Math.abs(끝(c, 근.절삭, 'f') - x.금액) < 0.5 ? { u: 근.절삭, m: 'f' } : 끝수배우기(c, x.금액, 큰 || !!근.절삭)
              if (끝수) { 규 = { 꼴: '식', 식: 근.식, X: 0, 율, 코드줄, 곱: 곱 === 1 ? undefined : 곱, 끝수, 말: '산출근거 ' + 근.글 }; break }
            }
            if (규) break
          } catch (e) { /* 못 셈 — 다른 길 */ }
        }
      }
    }
    /* ⓑ 위 줄들의 합(소계 · 순공사원가 · 공급가액 · 도급액 …) */
    if (!규 && 합꼴역.has(x.역)) {
      let 고른 = null
      for (let k = 1; k <= Math.min(열림.length, 30); k++) {
        const 줄들 = 열림.slice(-k).map((y) => [y, 표시(y)])
        if (k === 1 && x.역 === '') continue
        const 끝수 = 끝수배우기(합(줄들), x.금액, true)
        if (끝수 && (!고른 || 끝수.u < 고른.끝수.u)) 고른 = { 줄들, 끝수, k }
        if (고른 && 고른.끝수.u === 1) break
      }
      if (!고른) {
        /* 한 줄을 건너뛴 합 — 「2천미만 · 2천이상」 처럼 둘 중 하나만 더한 소계(원 단위까지 딱 맞을 때만) */
        for (let k = 3; k <= Math.min(열림.length, 30) && !고른; k++) {
          const 창 = 열림.slice(-k)
          for (let j = 0; j < k - 1 && !고른; j++) {
            const 줄들 = 창.filter((_, i) => i !== j).map((y) => [y, 표시(y)])
            if (Math.abs(합(줄들) - x.금액) < 1 && 옛(창[j]) !== 0) 고른 = { 줄들, 끝수: { u: 1, m: 'f' }, k, 뺀: 창[j] }
          }
        }
      }
      if (!고른 && 합역[x.역]) for (const 목록 of 합역[x.역]) {
        const 줄들 = 바탕풀기(목록.filter((n) => 역값(n.replace('-', '')))); if (!줄들 || !줄들.length || 줄들.some(([y]) => y === x)) continue
        const 끝수 = 끝수배우기(합(줄들), x.금액, true)
        if (끝수) { 고른 = { 줄들, 끝수, k: 0 }; break }
      }
      if (!고른 && x.구분 && !/^\d+$/.test(x.구분)) {
        /* 코드 갈래 — 「다」 = 다-1 + 다-2 + … · 「A」 = A1 + A2 (머리가 먼저 오는 꼴) */
        const 아이 = rows.filter((y) => y !== x && y.구분 && y.금액 !== null && new RegExp('^' + x.구분.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&') + '-?\\d{1,2}$').test(y.구분))
        if (아이.length) { const 줄들 = 아이.map((y) => [y, 표시(y)]); const 끝수 = 끝수배우기(합(줄들), x.금액, true); if (끝수) 고른 = { 줄들, 끝수, k: 0 } }
      }
      if (고른) {
        규 = { 꼴: '합', 줄들: 고른.줄들, 끝수: 고른.끝수, 말: '합 ' + 고른.줄들.map(([y, s]) => (s < 0 ? '−' : '') + (y.구분 || 이름꼴(y.이름))).join(' + ') }
        if (고른.k) { 열림.splice(열림.length - 고른.k, 고른.k); if (고른.뺀) 열림.push(고른.뺀) }
        다시이름(x, 고른.줄들.map(([y]) => y))
      }
    }
    /* ⓒ 표준 바탕 × 요율 (간접노무비 · 산재 · 고용 · 건강 · 연금 · 기타경비 · 일반관리비 · 이윤 · 부가세 …) */
    if (!규 && 바탕역[x.역]) {
      const 율들 = 율후보(x)
      let 고른 = null
      for (const 목록 of 바탕역[x.역]) {
        const 줄들 = 위바탕(목록, x); if (!줄들) continue
        const b = 합(줄들); if (!(b > 0)) continue
        for (const r of 율들) { const 끝수 = 끝수배우기(b * r, x.금액, false); if (끝수) { 고른 = { 줄들, r, 끝수, 말: '(' + 목록.join(' + ') + ') × ' + +(r * 100).toFixed(4) + '%' }; break } }
        if (고른) break
      }
      if (!고른) for (const 목록 of 바탕역[x.역]) {
        /* 요율 칸이 없거나 손으로 맞춘 줄(이윤 끝자리 …) — 당초 «금액 ÷ 바탕» 을 그대로 씀 */
        const 줄들 = 위바탕(목록, x); if (!줄들) continue
        const b = 합(줄들); if (!(b > 0)) continue
        고른 = { 줄들, r: x.금액 / b, 끝수: { u: 1, m: 'f' }, 말: '(' + 목록.join(' + ') + ') × 당초 비 ' + +(x.금액 / b * 100).toFixed(4) + '%' }
        break
      }
      if (고른) 규 = { 꼴: '율', 줄들: 고른.줄들, r: 고른.r, 끝수: 고른.끝수, 말: 고른.말 }
    }
    /* ⓓ 산출근거는 읽었는데 당초 값과 안 맞음 — 근거 × (당초/근거셈) */
    if (!규 && 근 && 근.식 && 코드들(근.식).size && !모름있나(근.식) && !요율있나(근.식)) {
      try { const c = 셈하기(근.식, 옛코드, 차례, 0); if (c) 규 = { 꼴: '식', 식: 근.식, X: 0, 율: null, 코드줄, 곱: x.금액 / c, 끝수: { u: 1, m: 'f' }, 말: '산출근거 ' + 근.글 + ' × 당초 비', 경고: '산출근거(' + 근.글 + ')로 셈한 당초 값이 원본 금액과 달라 «근거 × 당초 비» 로 셈했습니다' } } catch (e) { /* */ }
    }
    /* ⓔ 내역의 묶음(직접재료비 · 직접노무비 · 산출경비 · 안전관리비 · 운반비 …) — 셈할 때 바탕(x) · 못 찾으면 대안(아무 바탕 × 요율이 딱 맞는 것) */
    if (!규) {
      let 대안 = null
      const 율들 = 율후보(x)
      if (율들.length) {
        const 모든 = [['직노'], ['노계'], ['재계', '직노'], ['재계', '노계'], ['재계', '직노', '산출경비'], ['순공'], ['공급'], ['순공', '일관', '이윤']]
        for (const 목록 of 모든) {
          const 줄들 = 위바탕(목록, x); if (!줄들) continue
          const b = 합(줄들); if (!(b > 0)) continue
          for (const r of 율들) { const 끝수 = 끝수배우기(b * r, x.금액, false); if (끝수) { 대안 = { 꼴: '율', 줄들, r, 끝수, 말: '(' + 목록.join(' + ') + ') × ' + +(r * 100).toFixed(4) + '%' }; break } }
          if (대안) break
        }
      }
      규 = { 꼴: '바탕?', 대안 }
    }
    if (!규) 규 = { 꼴: '바탕?' }
    if (규.꼴 === '식' && 합꼴역.has(x.역)) {
      const 든줄 = 식줄들(규.식, 규.코드줄)
      다시이름(x, 든줄)
      for (const y of 든줄) { const i = 열림.indexOf(y); if (i >= 0) 열림.splice(i, 1) }
    }
    규칙.set(x.줄, 규)
    열림.push(x)
  }
  /* 같은 금액을 다시 적은 줄(조사금액 = 총계 · ⓐ 일반경우 = 산안비 …) — 그 줄의 새 값을 그대로 */
  for (const x of rows) {
    const 규 = 규칙.get(x.줄)
    if (!규 || 규.꼴 !== '바탕?' || 규.대안 || x.역 !== '' || !(Math.abs(x.금액) >= 1000)) continue
    const 짝 = rows.find((y) => y !== x && y.금액 !== null && Math.abs(y.금액 - x.금액) < 0.5 && 규칙.get(y.줄) && 규칙.get(y.줄).꼴 !== '바탕?')
    if (짝) 규칙.set(x.줄, { 꼴: '합', 줄들: [[짝, 1]], 끝수: { u: 1, m: 'f' }, 말: '«' + (짝.구분 || 이름꼴(짝.이름)) + '» 와 같은 금액' })
  }
  const 부가줄 = 역줄.get('부가') || null
  let 도급줄 = 역줄.get('도급') || null
  const 든다 = (y, z) => { const r = 규칙.get(y.줄); if (!r) return false; if (r.꼴 === '합') return r.줄들.some(([w]) => w === z); if (r.꼴 === '식') return 식줄들(r.식, r.코드줄).includes(z); return false }
  if (!도급줄 && 부가줄) 도급줄 = rows.find((y) => y.줄 > 부가줄.줄 && 든다(y, 부가줄)) || null
  if (!도급줄 && !rows.some((y) => y.역 === '관급' && y.금액)) 도급줄 = 역줄.get('총공사비') || null
  표.규칙 = 표.규칙 || {}
  표.규칙[열쇠] = { 규칙, 차례, 구분들, 역줄, 도급줄, 이윤줄: 역줄.get('이윤') || null, 부가줄 }
  return 표.규칙[열쇠]
}

export function 원가다시(표, 바탕, 옵션 = {}) {
  const { 비율 = 1, 덧 = new Map(), 박음 = new Map(), 끔 = new Set() } = 옵션
  const 배움 = 원가배우기(표, 옵션)
  const { 규칙, 차례 } = 배움
  const rows = 표.rows
  const 새 = new Map(), 새코드 = new Map(rows.filter((x) => x.구분 && x.금액 === null).map((x) => [x.구분, 0]))
  const 어떻게 = new Map(), 경고 = []
  const 남 = new Set(rows.filter((x) => x.금액 !== null).map((x) => x.줄))
  const 정 = (x, v, 끝수, 말) => {
    let w = 끔.has(x.줄) ? Math.floor(v + 1e-7) : 끝수 ? 끝(v, 끝수.u, 끝수.m) : v
    if (덧.has(x.역) && 배움.역줄.get(x.역) === x) w += 덧.get(x.역)
    if (박음.has(x.역) && 배움.역줄.get(x.역) === x) w = 박음.get(x.역)
    새.set(x.줄, w); if (x.구분) 새코드.set(x.구분, w); 어떻게.set(x.줄, 말); 남.delete(x.줄)
  }
  const 새값 = (y) => (y.금액 === null ? 0 : 새.has(y.줄) ? 새.get(y.줄) : undefined)
  for (let 바퀴 = 0; 바퀴 < rows.length + 3 && 남.size; 바퀴++) {
    let 나아감 = false
    for (const x of rows) {
      if (!남.has(x.줄)) continue
      const 규 = 규칙.get(x.줄)
      if (!규) { 남.delete(x.줄); continue }
      if (규.꼴 === '고정') { 정(x, x.금액, null, 규.말); 나아감 = true; continue }
      if (규.꼴 === '영') { 정(x, 0, null, 규.말); 나아감 = true; continue }
      if (규.꼴 === '식') {
        try {
          const 값 = new Map()
          for (const [c, y] of 규.코드줄) { const v0 = 새값(y); if (v0 !== undefined) 값.set(c, v0) }
          let v = 셈하기(규.식, 값, 차례, 규.X, 규.율)
          if (규.곱) v *= 규.곱
          정(x, v, 규.끝수, 규.말); 나아감 = true
          if (규.경고) 경고.push(['원가 ' + (x.이름 || x.구분), 규.경고])
        } catch (e) { /* 아직 */ }
        continue
      }
      if (규.꼴 === '합' || 규.꼴 === '율') {
        const 값들 = 규.줄들.map(([y, s]) => { const v = 새값(y); return v === undefined ? undefined : s * v })
        if (값들.some((v) => v === undefined)) continue
        const s = 값들.reduce((a, b) => a + b, 0)
        정(x, 규.꼴 === '율' ? s * 규.r : s, 규.끝수, 규.말); 나아감 = true; continue
      }
      /* 바탕? — 내역 묶음에서 · 없으면 대안 */
      const b = 바탕(x)
      if (b !== undefined && b !== null) { 정(x, b.값, null, b.말); if (b.경고) 경고.push(['원가 ' + (x.이름 || x.구분), b.경고]); 나아감 = true; continue }
      if (규.대안) {
        const 값들 = 규.대안.줄들.map(([y, s]) => { const v = 새값(y); return v === undefined ? undefined : s * v })
        if (값들.some((v) => v === undefined)) continue
        정(x, 값들.reduce((a, c) => a + c, 0) * 규.대안.r, 규.대안.끝수, 규.대안.말); 나아감 = true; continue
      }
      if (바퀴 === 0) continue
      정(x, 단수(x.금액 * 비율, '버림'), null, '근거 없음 — 당초 × 비율')
      경고.push(['원가 ' + (x.이름 || x.구분), '산출근거 · 내역 묶음을 못 찾아 «당초 × 비율» 로 셈했습니다 — 한 번 보십시오'])
      나아감 = true
    }
    if (!나아감 && 바퀴 > 0) {
      /* 서로 기다리는 줄 — 맨 위 한 줄만 «당초 × 비율» 로 풀고 나머지는 다시 셈 */
      const x = rows.find((y) => 남.has(y.줄) && y.금액 !== null)
      if (!x) break
      정(x, 단수(x.금액 * 비율, '버림'), null, '서로 기다리는 줄 — 당초 × 비율')
      경고.push(['원가 ' + (x.이름 || x.구분), '셈 차례가 서로 물려 이 줄은 «당초 × 비율» 로 두었습니다 — 한 번 보십시오'])
    }
  }
  for (const 줄 of 남) {
    const x = rows.find((y) => y.줄 === 줄)
    if (x && x.금액 !== null) { 정(x, 단수(x.금액 * 비율, '버림'), null, '셈 차례를 못 풂 — 당초 × 비율'); 경고.push(['원가 ' + (x.이름 || x.구분), '셈 차례를 풀지 못해 «당초 × 비율» 로 두었습니다']) }
  }
  return { 새, 새코드, 어떻게, 경고 }
}

/* ══════════════════════════════════════════════════════════
   ④ 내역 — 품목(맞추기) · 머리 · 소계 · 원가 줄의 새 값
   ══════════════════════════════════════════════════════════ */
function 내역셈(읽은, 옵션, 비율) {
  const R = 맞추기(읽은, { ...옵션, 비율: 비율 * 100, 목표: 0 })
  const 줄표 = new Map(R.rows.map((x) => [x.시트 + '#' + x.줄, x]))
  /* A값 묶음(안전관리비 · 품질관리비 머리) 아래 품목은 설계금액 그대로 */
  const A값줄 = new Set()
  if (옵션.A값그대로 !== false) {
    for (const s of 읽은.시트들) for (const m of s.모음들 || []) {
      if (m.모음꼴 !== '머리' || !m.아이줄) continue
      if (!A값이름.test(원가꼴(m.공종))) continue
      for (const z of m.아이줄) A값줄.add(s.시트 + '#' + z)
    }
  }
  for (const k of A값줄) {
    const x = 줄표.get(k)
    if (!x || x.관급고정) continue
    const 값 = {}
    for (const [g, v] of Object.entries(x.값)) 값[g] = { ...v }
    x.새값 = 값; x.새금액 = x.총금액 || 0; x.A값고정 = true
  }
  /* 머리 · 합계 · 중복 */
  const 모음새 = new Map()     /* 시트#줄 → {갈래: 금액} */
  for (const s of 읽은.시트들) {
    const 모음표 = new Map((s.모음들 || []).map((m) => [m.줄, m]))
    const 옛줄 = new Map(s.rows.map((y) => [y.줄, y]))
    const 새금 = (z, g) => { const x = 줄표.get(s.시트 + '#' + z); const v = x && x.새값[g]; return v && v.금액 != null ? v.금액 : 0 }
    const 옛금 = (z, g) => { const x = 옛줄.get(z); const v = x && x.값[g]; return v && v.금액 != null ? v.금액 : 0 }
    const 고정든 = (m) => (m.아이줄 || []).some((z) => { const x = 줄표.get(s.시트 + '#' + z); return x && (x.관급고정 || x.A값고정) })
    const 다고정 = (m) => !!(m.아이줄 && m.아이줄.length) && m.아이줄.every((z) => { const x = 줄표.get(s.시트 + '#' + z); return x && (x.관급고정 || x.A값고정) })
    const 값 = (m, 길 = 0) => {
      const 열쇠 = s.시트 + '#' + m.줄
      if (모음새.has(열쇠)) return 모음새.get(열쇠)
      const out = {}
      for (const g of s.갈래) {
        const 옛 = (m.값[g.이름] || {}).금액
        if (옛 === null || 옛 === undefined) continue
        if (m.아이줄 && m.아이줄.length) {
          const 합 = m.아이줄.reduce((a, z) => a + 새금(z, g.이름), 0)
          if (m.근사) {
            const 어긋 = 옛 - m.아이줄.reduce((a, z) => a + 옛금(z, g.이름), 0)
            out[g.이름] = 고정든(m) ? 합 + Math.round(어긋 * (다고정(m) ? 1 : 비율)) : 단수(옛 * 비율, 옵션.단수꼴 || '버림')
          } else out[g.이름] = 합
        } else if (m.모음꼴 === '중복' && m.짝줄 != null && 모음표.has(m.짝줄) && 길 < 5) {
          const v = 값(모음표.get(m.짝줄), 길 + 1)
          if (v && v[g.이름] !== undefined) out[g.이름] = v[g.이름]
        }
      }
      /* 합계 칸 = 그 줄 셋 칸의 합(셋이 갈려 있으면) */
      const 셋 = s.갈래.filter((g) => g.이름 !== '합계')
      if (셋.length && out['합계'] !== undefined && 셋.some((g) => out[g.이름] !== undefined) && 셋.every((g) => out[g.이름] !== undefined || (m.값[g.이름] || {}).금액 == null)) {
        out['합계'] = 셋.reduce((a, g) => a + (out[g.이름] || 0), 0)
      }
      모음새.set(열쇠, out)
      return out
    }
    for (const m of s.모음들 || []) 값(m)
  }
  /* 맨 바깥 머리들(다른 머리 안에 안 든 것) — 차례대로 이어 더해 «직접재료비 7,062,378» 같은 원가 줄의 짝을 찾습니다
     (공사명 총괄 줄 · 순공사비 줄은 아래 품목을 모르는 «총괄» 이라, 1. 토공 ~ 5. 사급자재대 를 이어 더한 값과 맞대 봅니다) */
  const 꼭대기 = []
  for (const s of 읽은.시트들) {
    const 머리 = (s.모음들 || []).filter((m) => m.모음꼴 === '머리' && m.아이줄 && m.아이줄.length)
    const 모 = 머리.map((m) => new Set(m.아이줄))
    const 안 = new Set()
    머리.forEach((a, i) => 머리.forEach((b, j) => { if (i !== j && 모[j].size > 모[i].size && a.아이줄.every((z) => 모[j].has(z))) 안.add(a.줄) }))
    for (const m of 머리.filter((x) => !안.has(x.줄)).sort((p, q) => p.줄 - q.줄)) {
      const 옛 = {}
      for (const g of s.갈래) 옛[g.이름] = (m.값[g.이름] || {}).금액
      꼭대기.push({ 시트: s.시트, m, 옛, 새: 모음새.get(s.시트 + '#' + m.줄) || {} })
    }
  }
  const 묶음합 = (g, 옛) => {
    if (옛 === null || 옛 === undefined || !Number.isFinite(옛) || Math.abs(옛) < 1) return undefined
    for (let i = 0; i < 꼭대기.length; i++) {
      let so = 0, sn = 0
      for (let j = i; j < 꼭대기.length; j++) {
        const a = 꼭대기[j]
        if (a.시트 !== 꼭대기[i].시트) break
        so += a.옛[g] || 0; sn += a.새[g] !== undefined ? a.새[g] : (a.옛[g] || 0)
        if (Math.abs(so - 옛) <= 2) return sn
        if (so > 옛 + 2 && 옛 > 0) break
      }
    }
    return undefined
  }
  return { R, 줄표, 모음새, A값줄, 묶음합 }
}

/* 이름 + 당초 금액 → 새 금액 (총괄표처럼 같은 금액을 다시 적은 시트를 고칠 때) */
function 짝표만들기(읽은, 셈, 원가, 원가셈) {
  const 표 = new Map()     /* 이름꼴|당초금액 → 새 금액 */
  const 값만 = new Map()   /* 당초금액 → Set(새 금액) — 이름이 다를 때(공사명 줄 등) 하나뿐이면 씀 */
  const 넣 = (이름, 옛, 새) => {
    if (옛 === null || 옛 === undefined || 새 === null || 새 === undefined || !Number.isFinite(옛)) return
    const k = Math.round(옛)
    for (const n of [이름꼴(이름), 원가꼴(이름)]) if (n) 표.set(n + '|' + k, 새)
    if (Math.abs(k) >= 1000) { if (!값만.has(k)) 값만.set(k, new Set()); 값만.get(k).add(새) }
  }
  for (const s of 읽은.시트들) {
    for (const m of s.모음들 || []) {
      const v = 셈.모음새.get(s.시트 + '#' + m.줄) || {}
      for (const g of s.갈래) {
        const 옛 = (m.값[g.이름] || {}).금액
        if (v[g.이름] !== undefined) 넣(m.공종, 옛, v[g.이름])
        else if (m.모음꼴 === '총괄' || m.모음꼴 === '원가' || m.총액) { const w = 셈.묶음합(g.이름, 옛); if (w !== undefined) 넣(m.공종, 옛, w) }
      }
    }
  }
  if (원가 && 원가셈) for (const x of 원가.rows) if (원가셈.새.has(x.줄)) 넣(x.이름, x.금액, 원가셈.새.get(x.줄))
  return { 찾기: (이름, 옛) => {
    if (옛 === null || 옛 === undefined) return undefined
    const k = Math.round(옛)
    for (const n of [이름꼴(이름), 원가꼴(이름)]) { const v = 표.get(n + '|' + k); if (v !== undefined) return v }
    const w = 값만.get(k)
    if (w && w.size === 1) return [...w][0]
    return undefined
  } }
}

/* 근거 없는 원가 줄의 바탕 — 직접재료비 · 직접노무비 · 산출경비 는 «당초 금액이 같은 내역 머리» 의 새 갈래 합,
   안전관리비 · 운반비 · 폐기물처리비 … 는 «이름이 같은 내역 머리» 의 새 합계 */
function 바탕만들기(읽은, 셈) {
  const 머리들 = []
  for (const s of 읽은.시트들) for (const m of s.모음들 || []) {
    const v = 셈.모음새.get(s.시트 + '#' + m.줄)
    if (v && Object.keys(v).length) 머리들.push({ m, v, 꼴: 원가꼴(m.공종) })
  }
  const 갈래이름 = { 직재: '재료비', 재계: '재료비', 직노: '노무비', 노계: '노무비', 산출경비: '경비' }
  return (x) => {
    const g = 갈래이름[x.역] || 갈래이름[{ 직접재료비: '직재', 직접노무비: '직노', 산출경비: '산출경비' }[x.꼴]]
    if (g) {
      const hit = 머리들.find((h) => h.v[g] !== undefined && Math.abs(((h.m.값[g] || {}).금액 || 0) - x.금액) <= 2)
      if (hit) return { 값: hit.v[g], 말: '내역 «' + 이름꼴(hit.m.공종) + '» 의 ' + g + ' 합' }
      const 이어 = 셈.묶음합(g, x.금액)
      if (이어 !== undefined) return { 값: 이어, 말: '내역 공종들의 ' + g + ' 합' }
      const 옛합 = 읽은.갈래합 && 읽은.갈래합[g]
      const 새합 = 셈.R.갈래합 && 셈.R.갈래합[g]
      if (옛합 && Math.abs(옛합 - x.금액) <= 2 && 새합 !== undefined) return { 값: 새합, 말: '내역 ' + g + ' 합' }
      /* 원가계산서 금액이 내역 합과 조금 다른 파일(관급 · 부산물을 따로 뺀 것 등) — 내역 «${g} 합» 이 바뀐 만큼 */
      if (옛합 > 0 && 새합 !== undefined) return { 값: Math.floor(x.금액 * 새합 / 옛합 + 1e-7), 말: '내역 ' + g + ' 합이 바뀐 비율(' + +(새합 / 옛합 * 100).toFixed(4) + '%)', 경고: '원가계산서 금액이 내역 ' + g + ' 합과 달라 «내역 ' + g + ' 합이 바뀐 비율» 로 셈했습니다 — 한 번 보십시오' }
      return undefined
    }
    const 같은역 = x.역 && !['소계', '재계', '노계', '경계', '순공', '공급', '도급', '총공사비'].includes(x.역)
    const 같은 = 머리들.filter((h) => (같은역 ? 역할(h.꼴) === x.역 : h.꼴 === x.꼴) && h.v['합계'] !== undefined)
    const hit = 같은.find((h) => Math.abs(((h.m.값['합계'] || {}).금액 || 0) - x.금액) <= 2) || (같은.length === 1 ? 같은[0] : null)
    if (hit) return { 값: hit.v['합계'], 말: '내역 «' + 이름꼴(hit.m.공종) + '» 묶음 합' }
    return undefined
  }
}

/* ══════════════════════════════════════════════════════════
   ⑤ 한 번 셈 — 비율 하나로 내역 · 원가 전부
   ══════════════════════════════════════════════════════════ */
function 한번(읽은, 원가, 옵션, 비율, 덧 = new Map(), 박음 = new Map(), 끔 = new Set()) {
  const 셈 = 내역셈(읽은, 옵션, 비율)
  const 원가셈 = 원가 ? 원가다시(원가, 바탕만들기(읽은, 셈), { 비율, A값그대로: 옵션.A값그대로 !== false, 덧, 박음, 끔 }) : null
  const 도급줄 = 원가 ? 원가배우기(원가, 옵션).도급줄 : null
  const 도급액 = 도급줄 && 원가셈 ? 원가셈.새.get(도급줄.줄) : null
  return { 셈, 원가셈, 도급액, 도급줄 }
}

/** 낙찰금액(도급액)에 맞춘 비율 · 이윤 끝전 · 부가세 끝전을 찾습니다 */
export function 낙찰셈(읽은, 원가, 옵션 = {}) {
  const 목표 = Number(옵션.낙찰금액) || 0
  if (!원가) throw new Error('원가계산서 시트(비목 · 금액 · 요율 · 산출근거)를 못 찾아 낙찰금액으로는 맞출 수 없습니다 — 비율(%)로 넣어 주십시오.')
  const 배움 = 원가배우기(원가, 옵션)
  const 도급줄 = 배움.도급줄
  if (!도급줄) throw new Error('원가계산서에서 «도급액(도급공사비)» 줄을 못 찾았습니다 — 비율(%)로 넣어 주십시오.')
  /* 이윤 아래 ~ 도급액(공급가액 · 부가세 · 도급액)은 끝수를 버리지 않고 원 단위로 — 끝전을 이윤 · 부가세로 맞추려고 */
  const 이윤줄0 = 배움.이윤줄
  const 끔 = new Set(원가.rows.filter((x) => x.금액 !== null && x.줄 <= 도급줄.줄 && (!이윤줄0 || x.줄 > 이윤줄0.줄) && ['합', '율', '식'].includes((배움.규칙.get(x.줄) || {}).꼴)).map((x) => x.줄))
  끔.add(도급줄.줄)
  const f = (r) => 한번(읽은, 원가, 옵션, r, new Map(), new Map(), 끔).도급액
  const 당초 = 도급줄.금액
  let lo = 0.05, hi = 1.5
  if (f(hi) < 목표) throw new Error('낙찰금액이 설계 도급액보다 너무 큽니다.')
  if (f(lo) > 목표) throw new Error('낙찰금액이 너무 작습니다(설계의 5% 아래).')
  for (let i = 0; i < 60 && hi - lo > 1e-10; i++) { const mid = (lo + hi) / 2; if (f(mid) <= 목표) lo = mid; else hi = mid }
  const 비율 = lo
  let 기본 = 한번(읽은, 원가, 옵션, 비율, new Map(), new Map(), 끔)
  const 이윤줄 = 배움.이윤줄
  const 부가줄 = 배움.부가줄
  let 이윤덧 = 0, 부가덧 = 0
  const 경고 = []
  if (기본.도급액 !== 목표 && 이윤줄) {
    const g = (d) => 한번(읽은, 원가, 옵션, 비율, new Map([['이윤', d]]), new Map(), 끔).도급액
    const 모자 = 목표 - 기본.도급액
    let a = 0, b = Math.max(10, Math.ceil(모자) * 2 + 10)
    while (g(b) < 목표 && b < 1e9) b *= 2
    while (b - a > 1) { const mid = Math.floor((a + b) / 2); if (g(mid) <= 목표) a = mid; else b = mid }
    이윤덧 = a
    기본 = 한번(읽은, 원가, 옵션, 비율, new Map([['이윤', 이윤덧]]), new Map(), 끔)
  } else if (기본.도급액 !== 목표) 경고.push(['이윤', '원가계산서에 «이윤» 줄이 없어 끝전을 맞추지 못했습니다'])
  if (기본.도급액 !== 목표 && 부가줄 && 기본.원가셈) {
    부가덧 = 목표 - 기본.도급액
    const 부새 = 기본.원가셈.새.get(부가줄.줄)
    기본 = 한번(읽은, 원가, 옵션, 비율, new Map([['이윤', 이윤덧]]), new Map([['부가', 부새 + 부가덧]]), 끔)
  }
  return { 비율, 이윤덧, 부가덧, 도급액: 기본.도급액, 당초도급액: 당초, 목표, 결과: 기본, 경고 }
}

/* ══════════════════════════════════════════════════════════
   ⑥ 올린 엑셀에 새 값 넣기 (값으로 · 시트 안 붙임)
   ══════════════════════════════════════════════════════════ */
const 글로 = (v, 옛) => {
  /* 원본이 «7,062,378» 같은 글자였으면 같은 꼴(쉼표)로, 숫자였으면 숫자로 */
  if (typeof 옛 === 'string') return /,/.test(옛) ? Math.round(v).toLocaleString('en-US') : String(Math.round(v))
  return null
}

export function 틀그대로(buf, 읽은, 옵션 = {}) {
  const 격자들 = readWorkbook(buf)
  const 원가 = 원가표찾기(격자들, 읽은.시트들.map((s) => s.시트))
  let 비율, 낙 = null, 판
  if (옵션.낙찰금액 > 0) { 낙 = 낙찰셈(읽은, 원가, 옵션); 비율 = 낙.비율; 판 = 낙.결과 }
  else {
    비율 = 옵션.비율 > 0 ? 옵션.비율 / 100 : 맞추기(읽은, { ...옵션, 목표: 옵션.목표 }).비율
    판 = 한번(읽은, 원가, 옵션, 비율)
  }
  const { 셈, 원가셈 } = 판
  const 꼴 = 옵션.단수꼴 || '버림'
  const 고칠 = new Map()          /* 시트 → Map(ref → {v, 옛}) */
  const 넣 = (시트, r, c, v, 옛) => {
    if (v === null || v === undefined || !Number.isFinite(v)) return
    if (!고칠.has(시트)) 고칠.set(시트, new Map())
    고칠.get(시트).set(numToCol(c + 1) + r, { v, 옛 })
  }
  const 경고 = [...(낙 ? 낙.경고 : []), ...(원가셈 ? 원가셈.경고 : [])]
  const 짝 = 짝표만들기(읽은, 셈, 원가, 원가셈)
  let 품목칸 = 0, 머리칸 = 0, 원가칸 = 0, 짝칸 = 0
  /* ① 품목 */
  for (const s of 읽은.시트들) {
    const grid = 격자들[s.시트] || []
    const 옛칸 = (줄, j) => (grid[줄 - 1] || [])[j]
    for (const x0 of s.rows) {
      const x = 셈.줄표.get(s.시트 + '#' + x0.줄)
      if (!x || x.관급고정 || x.A값고정) continue
      for (const g of s.갈래) {
        const v = x.새값[g.이름]
        if (!v) continue
        if (g.단가칸 >= 0 && v.단가 != null && x0.값[g.이름] && x0.값[g.이름].단가 != null) { 넣(s.시트, x0.줄, g.단가칸, v.단가, 옛칸(x0.줄, g.단가칸)); 품목칸++ }
        if (g.금액칸 >= 0 && v.금액 != null && x0.값[g.이름] && x0.값[g.이름].금액 != null) { 넣(s.시트, x0.줄, g.금액칸, v.금액, 옛칸(x0.줄, g.금액칸)); 품목칸++ }
      }
    }
    /* ② 머리 · 합계 · 중복 · ③ 원가 줄 */
    for (const m of s.모음들 || []) {
      const v = 셈.모음새.get(s.시트 + '#' + m.줄) || {}
      for (const g of s.갈래) {
        const 옛 = (m.값[g.이름] || {}).금액
        if (g.금액칸 < 0 || 옛 === null || 옛 === undefined) continue
        let 새 = v[g.이름]
        if (새 === undefined) 새 = 짝.찾기(m.공종, 옛)
        if (새 === undefined && (m.모음꼴 === '총괄' || m.모음꼴 === '원가' || m.총액)) 새 = 셈.묶음합(g.이름, 옛)
        if (새 === undefined) {
          if (m.총액 || 옛 === 0) continue
          새 = 단수(옛 * 비율, 꼴)
          경고.push([s.시트 + ' ' + m.줄 + '행', '«' + 이름꼴(m.공종) + '» 줄 금액을 원가계산서 · 내역 묶음에서 못 찾아 «당초 × 비율» 로 넣었습니다'])
        }
        넣(s.시트, m.줄, g.금액칸, 새, 옛칸(m.줄, g.금액칸))
        if (m.모음꼴 === '원가') 원가칸++; else 머리칸++
      }
    }
  }
  /* ③ 원가계산서 시트 */
  if (원가 && 원가셈) {
    for (const x of 원가.rows) {
      if (!원가셈.새.has(x.줄) || x.금액 === null) continue
      넣(원가.시트, x.줄, x.금액칸, 원가셈.새.get(x.줄), x.옛글); 원가칸++
    }
  }
  /* ⑦ 그 밖의 시트(총괄표 …) — 이름 + 당초 금액이 같은 칸 */
  const 손댄 = new Set([...읽은.시트들.map((s) => s.시트), ...(원가 ? [원가.시트] : [])])
  const 못바꾼 = []
  for (const [시트, grid] of Object.entries(격자들)) {
    if (손댄.has(시트) || !grid || !grid.length) continue
    if (/일위|단가산출|중기|노임|자재|품셈|수량산출|산출근거/.test(시트)) continue
    let n = 0
    for (let r = 0; r < grid.length; r++) {
      const row = grid[r] || []
      let 이름 = ''
      for (let j = 0; j < Math.min(row.length, 6); j++) { const t = 맨(row[j]); if (typeof row[j] === 'string' && 숫자(row[j]) === null && t.length > 이름.length) 이름 = t }
      if (!이름) continue
      for (let j = 0; j < row.length; j++) {
        const 옛 = 숫자(row[j])
        if (옛 === null || Math.abs(옛) < 100) continue
        const 새 = 짝.찾기(이름, 옛)
        if (새 === undefined) { if (Math.abs(옛) >= 10000) 못바꾼.push(시트 + ' ' + numToCol(j + 1) + (r + 1)); continue }
        if (새 === 옛) continue
        넣(시트, r + 1, j, 새, row[j]); n++
      }
    }
    짝칸 += n
  }
  if (못바꾼.length) 경고.push(['다른 시트', '금액처럼 보이는데 맞는 짝을 못 찾아 그대로 둔 칸 ' + 못바꾼.length + '곳 (' + 못바꾼.slice(0, 8).join(', ') + (못바꾼.length > 8 ? ' …' : '') + ')'])

  /* zip 손질 */
  const zip = unzipSync(new Uint8Array(buf))
  const 경로 = 시트경로(zip)
  let 바꾼칸 = 0
  for (const [시트, 칸] of 고칠) {
    const path = 경로[시트]
    if (!path || !zip[path]) { 경고.push([시트, '시트를 zip 안에서 못 찾아 손대지 않았습니다']); continue }
    const 날 = strFromU8(zip[path])
    const P = 이름표(날, 'sheetData') || 이름표(날, 'row')
    const 풂 = 공유풀기(날, P, new Set(칸.keys()))
    const ROW = 덩어리(P, 'row'), CELL = 덩어리(P, 'c')
    const 새xml = 풂.xml.replace(ROW, (rm) => rm.replace(CELL, (cell) => {
      const ref = 속성(cell, 'r')
      const job = ref && 칸.get(ref)
      if (!job) return cell
      바꾼칸++
      const st = /\ss="(\d+)"/.exec(cell)
      const sAttr = st ? ' s="' + st[1] + '"' : ''
      const 글 = 글로(job.v, job.옛)
      if (글 !== null) return '<' + P + 'c r="' + ref + '"' + sAttr + ' t="inlineStr"><' + P + 'is><' + P + 't>' + xesc(글) + '</' + P + 't></' + P + 'is></' + P + 'c>'
      return '<' + P + 'c r="' + ref + '"' + sAttr + '><' + P + 'v>' + job.v + '</' + P + 'v></' + P + 'c>'
    }))
    zip[path] = strToU8(새xml)
  }
  /* 엑셀이 열 때 남은 수식이 있으면 다시 셈하게 · calcChain 은 지움 */
  let wbx = strFromU8(zip['xl/workbook.xml'])
  if (/<([A-Za-z_][\w.-]*:)?calcPr\b[^>]*\/>/.test(wbx)) wbx = wbx.replace(/<([A-Za-z_][\w.-]*:)?calcPr\b[^>]*\/>/, '<$1calcPr calcId="0" fullCalcOnLoad="1"/>')
  else if (!/calcPr/.test(wbx)) wbx = wbx.replace(/<\/([A-Za-z_:.\w-]*workbook)>/, '<calcPr calcId="0" fullCalcOnLoad="1"/></$1>')
  zip['xl/workbook.xml'] = strToU8(wbx)
  if (zip['xl/calcChain.xml']) {
    delete zip['xl/calcChain.xml']
    if (zip['[Content_Types].xml']) zip['[Content_Types].xml'] = strToU8(strFromU8(zip['[Content_Types].xml']).replace(/<Override\b[^>]*calcChain\.xml[^>]*\/>/g, ''))
    if (zip['xl/_rels/workbook.xml.rels']) zip['xl/_rels/workbook.xml.rels'] = strToU8(strFromU8(zip['xl/_rels/workbook.xml.rels']).replace(/<Relationship\b[^>]*calcChain\.xml[^>]*\/>/g, ''))
  }
  const 원가줄 = 원가 && 원가셈 ? 원가.rows.filter((x) => x.금액 !== null && 원가셈.새.has(x.줄)).map((x) => ({ 이름: x.이름, 구분: x.구분, 옛: x.금액, 새: 원가셈.새.get(x.줄), 어떻게: 원가셈.어떻게.get(x.줄) || '' })) : []
  return {
    bytes: zipSync(zip, { level: 6 }), 비율, 낙, 원가시트: 원가 ? 원가.시트 : '', 원가줄,
    품목칸, 머리칸, 원가칸, 짝칸, 바꾼칸, 경고,
    A값줄: 셈.A값줄.size, 관급줄: 셈.R.관급줄,
  }
}

/** 화면용 — 파일을 다시 쓰지 않고 비율 · 도급액만 미리 셈합니다 */
export function 미리셈(격자들, 읽은, 옵션 = {}) {
  const 원가 = 원가표찾기(격자들, 읽은.시트들.map((s) => s.시트))
  if (옵션.낙찰금액 > 0) { const 낙 = 낙찰셈(읽은, 원가, 옵션); return { 원가, 비율: 낙.비율, 낙, 판: 낙.결과 } }
  const 비율 = 옵션.비율 > 0 ? 옵션.비율 / 100 : 1
  return { 원가, 비율, 낙: null, 판: 한번(읽은, 원가, 옵션, 비율) }
}
