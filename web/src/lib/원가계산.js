/**
 * 🧮 원가계산서 읽기 · 변경 원가계산서 셈 (2026-10-05, G131)
 *
 * 소장님: 「원내역서 넣으면 두 줄 변경부터 추가 시트 추가 해주는 틀을 사이트에서 가능하게」 — 그 가운데 «변경 원가계산서(원 요율 그대로)».
 *
 * ■ 읽는 것 — 원가계산서 표의 줄마다 [비목 · 구분(1 · 2 · … · A · B …) · 금액 · 요율 · 산출근거]
 *     산출근거 글(「B × 0.0356」 · 「(A + 4 + 6) × 0.004」 · 「(6:19)」 · 「((A + 4) + K/1.1) × 0.0253 + 3,300,000」)을 식으로 읽어
 *     «당초 금액이 정말 그 식으로 나오는지» 먼저 맞춰 봅니다(버림 · 반올림 · 그대로 셋 중 맞는 것).
 *     식의 숫자와 요율 칸이 다르면(「3%」인데 「D × 0.06」) 요율로 다시 맞춰 봅니다. 그래도 안 맞으면 «그대로»(변경 = 당초) + ⚠️.
 * ■ 바탕 금액(직접재료비 · 직접노무비 · 산출경비 · 관급자재 · 폐기물 · 제비율제외 …) 잇기
 *     ① 금액이 어느 공종 합계와 같으면(±2원) 그 공종에 잇습니다 — 제비율제외공종 · 폐기물처리비 · 관급자재 · 사급자재대
 *     ② 남은 재료 · 노무 · 경비 줄은 «순공사비 갈래 합 − ①에 이은 공종의 갈래 합» 과 맞춰 봅니다.
 *        (2026-10-05 실제 계약내역서 두 벌로 맞춰 봄 — 간접재료비 · 직접노무비 · 산출경비 모두 원 단위까지 같음)
 *     안 맞으면 «당초 + 증감» 으로 두고 ⚠️.
 * ■ 국가계약법 시행령 제65조⑥ — 증감분의 일반관리비 · 이윤은 산출내역서의 율 → 원 요율 그대로 씁니다.
 * 시험: node tools/시험_원내역변경.mjs
 */
import { 율꼴, 색꼴, 색맞춤 } from './변경엑셀쓰기.js'
import { 원가꼴, 이름꼴, 역매기기, 원가배우기 } from './낙찰맞추기.js'
import { 옛판빼기 } from './옛판시트.js'

const 글 = (x) => (x === null || x === undefined ? '' : String(x).trim())
const 붙 = (x) => 글(x).replace(/\s+/g, '')
const 수 = (x) => {
  if (typeof x === 'number') return Number.isFinite(x) ? x : null
  const t = 글(x).replace(/[,\s원₩]/g, '')
  if (t === '' || !/^[-△▲]?\d*\.?\d+$/.test(t)) return null
  const v = Number(t.replace(/^[△▲]/, '-'))
  return Number.isFinite(v) ? v : null
}
const 율읽기 = (x) => {
  if (typeof x === 'number') return Number.isFinite(x) ? (x > 1 ? x / 100 : x) : null
  const t = 붙(x)
  const m = t.match(/^(-?\d*\.?\d+)%$/)
  if (m) return Number(m[1]) / 100
  const v = 수(t)
  return v === null ? null : (v > 1 ? v / 100 : v)
}
const 코드꼴 = (x) => {
  if (typeof x === 'number' && Number.isInteger(x) && x > 0 && x < 100) return String(x)
  const t = 붙(x)
  if (/^\d{1,2}$/.test(t)) return String(Number(t))
  if (/^[A-Z]$/.test(t)) return t
  if (/^[A-Z][A-Z0-9]$/.test(t)) return t               /* A1 · AS · S1 · DH — 내역 프로그램 꼴(G296) */
  return ''
}

/* ═══════════════════════════ 식 ═══════════════════════════ */

/** 산출근거 글 → 식 나무 (못 읽으면 null) */
export function 식읽기(s, 코드들) {
  let t = 글(s).replace(/[×xX＊*]/g, '*').replace(/[÷／]/g, '/').replace(/[－−–]/g, '-').replace(/[＋]/g, '+')
    .replace(/[（]/g, '(').replace(/[）]/g, ')').replace(/：/g, ':')
  if (!t || /[가-힣]/.test(t)) return null
  const 낱 = []
  let i = 0
  while (i < t.length) {
    const ch = t[i]
    if (/\s/.test(ch)) { i++; continue }
    if ('+-*/():'.includes(ch)) { 낱.push({ k: ch }); i++; continue }
    if (/[A-Z]/.test(ch)) {
      const 둘 = t.slice(i, i + 2)
      if (/^[A-Z][A-Z0-9]$/.test(둘) && 코드들.has(둘)) { 낱.push({ k: '코드', v: 둘 }); i += 2; continue }
      if (/[A-Z]/.test(t[i + 1] || '')) return null
      낱.push({ k: '코드', v: ch }); i++; continue
    }
    if (/[\d.]/.test(ch)) {
      let j = i
      while (j < t.length && /[\d.,]/.test(t[j])) j++
      let raw = t.slice(i, j).replace(/,$/, '')
      j = i + raw.length
      let pct = false
      if (t[j] === '%') { pct = true; j++ }
      const 쉼표 = raw.includes(',')
      const 점 = raw.includes('.')
      const n = Number(raw.replace(/,/g, ''))
      if (!Number.isFinite(n)) return null
      if (!pct && !쉼표 && !점 && Number.isInteger(n) && n > 0 && n < 100 && 코드들.has(String(n))) 낱.push({ k: '코드', v: String(n) })
      else 낱.push({ k: '수', v: pct ? n / 100 : n })
      i = j
      continue
    }
    return null
  }
  let p = 0
  const 다음 = () => 낱[p]
  const 먹 = (k) => { if (낱[p] && 낱[p].k === k) { p++; return true } return false }
  function 더하기() {
    let a = 곱하기()
    if (!a) return null
    for (;;) {
      if (먹('+')) { const b = 곱하기(); if (!b) return null; a = { op: '+', a, b } } else if (먹('-')) { const b = 곱하기(); if (!b) return null; a = { op: '-', a, b } } else return a
    }
  }
  function 곱하기() {
    let a = 하나()
    if (!a) return null
    for (;;) {
      if (먹('*')) { const b = 하나(); if (!b) return null; a = { op: '*', a, b } } else if (먹('/')) { const b = 하나(); if (!b) return null; a = { op: '/', a, b } } else return a
    }
  }
  function 하나() {
    const x = 다음()
    if (!x) return null
    if (x.k === '-') { p++; const a = 하나(); return a ? { op: 'neg', a } : null }
    if (x.k === '(') {
      p++
      /* (6:19) — 6번부터 19번까지 더함 */
      if (낱[p] && 낱[p].k === '코드' && 낱[p + 1] && 낱[p + 1].k === ':' && 낱[p + 2] && 낱[p + 2].k === '코드' && 낱[p + 3] && 낱[p + 3].k === ')') {
        const r = { op: '범위', 부터: 낱[p].v, 까지: 낱[p + 2].v }
        p += 4
        return r
      }
      const a = 더하기()
      if (!a || !먹(')')) return null
      return a
    }
    if (x.k === '코드') {
      p++
      if (낱[p] && 낱[p].k === ':' && 낱[p + 1] && 낱[p + 1].k === '코드') { const r = { op: '범위', 부터: x.v, 까지: 낱[p + 1].v }; p += 2; return r }
      return { op: '코드', v: x.v }
    }
    if (x.k === '수') { p++; return { op: '수', v: x.v } }
    return null
  }
  const 나무 = 더하기()
  if (!나무 || p !== 낱.length) return null
  return 나무
}

const 범위코드 = (부터, 까지, 코드차례) => {
  const a = Number(부터), b = Number(까지)
  if (Number.isFinite(a) && Number.isFinite(b)) return 코드차례.filter((c) => /^\d+$/.test(c) && Number(c) >= a && Number(c) <= b)
  const i = 코드차례.indexOf(부터), j = 코드차례.indexOf(까지)
  return i >= 0 && j >= i ? 코드차례.slice(i, j + 1).filter((c) => !c.startsWith('#')) : []
}

/** 식 나무 셈 — 값(코드) 이 null 이면 0 으로 · 모르는 코드는 undefined 를 돌려 «아직» 을 알림 */
export function 식셈(n, 값, 코드차례) {
  if (!n) return undefined
  switch (n.op) {
    case '수': return n.v
    case '코드': { const v = 값(n.v); return v === undefined ? undefined : (v || 0) }
    case '범위': {
      let s = 0
      for (const c of 범위코드(n.부터, n.까지, 코드차례)) { const v = 값(c); if (v === undefined) return undefined; s += v || 0 }
      return s
    }
    case 'neg': { const a = 식셈(n.a, 값, 코드차례); return a === undefined ? undefined : -a }
    case '합': {
      let t = 0
      for (const c of n.코드들) { const v = 값(c); if (v === undefined) return undefined; t += v || 0 }
      return t
    }
    default: {
      const a = 식셈(n.a, 값, 코드차례), b = 식셈(n.b, 값, 코드차례)
      if (a === undefined || b === undefined) return undefined
      if (n.op === '+') return a + b
      if (n.op === '-') return a - b
      if (n.op === '*') return a * b
      if (n.op === '/') return b === 0 ? 0 : a / b
      return undefined
    }
  }
}

/** 식 나무 → 엑셀 식 (칸(코드) → 칸 주소) */
export function 식엑셀(n, 칸, 코드차례) {
  switch (n.op) {
    case '수': return String(n.v)
    case '코드': return 칸(n.v)
    case '범위': { const cs = 범위코드(n.부터, n.까지, 코드차례).map(칸); return cs.length ? '(' + cs.join('+') + ')' : '0' }
    case 'neg': return '-(' + 식엑셀(n.a, 칸, 코드차례) + ')'
    case '합': return n.코드들.length ? '(' + n.코드들.map(칸).join('+') + ')' : '0'
    default: return '(' + 식엑셀(n.a, 칸, 코드차례) + n.op + 식엑셀(n.b, 칸, 코드차례) + ')'
  }
}

/** 식이 더하는 코드들(소계 식만 — 곱셈 없음) · 범위는 풀어서 */
function 더하는코드(n, 코드차례, 밖 = []) {
  if (!n) return 밖
  if (n.op === '코드') 밖.push(n.v)
  else if (n.op === '범위') 밖.push(...범위코드(n.부터, n.까지, 코드차례))
  else if (n.op === '합') 밖.push(...n.코드들)
  else if (n.op === '+') { 더하는코드(n.a, 코드차례, 밖); 더하는코드(n.b, 코드차례, 밖) } else return null
  return 밖
}

/** 식 안의 «곱하는 수» 들 (요율로 바꿔 볼 자리) */
function 곱수들(n, 밖 = []) {
  if (!n || typeof n !== 'object') return 밖
  if (n.op === '*') {
    if (n.b && n.b.op === '수' && n.b.v > 0 && n.b.v < 1) 밖.push(n.b)
    if (n.a && n.a.op === '수' && n.a.v > 0 && n.a.v < 1) 밖.push(n.a)
  }
  if (n.a) 곱수들(n.a, 밖)
  if (n.b) 곱수들(n.b, 밖)
  return 밖
}

const 둥글기 = {
  버림: (v) => (v < 0 ? -Math.floor(-v + 1e-7) : Math.floor(v + 1e-7)),
  반올림: (v) => Math.round(v),
  올림: (v) => (v < 0 ? -Math.ceil(-v - 1e-7) : Math.ceil(v - 1e-7)),
  그대로: (v) => v,
}
const 둥글식 = { 버림: (e) => `ROUNDDOWN(${e},0)`, 반올림: (e) => `ROUND(${e},0)`, 올림: (e) => `ROUNDUP(${e},0)`, 그대로: (e) => e }
/** 셈 줄의 끝수 — 둥글기(버림 · 반올림 · 올림 · 그대로) × 단위(1 · 10 · 100 · 1000 …원) */
export const 둥값 = (v, s) => { const u = s.단위 || 1; return u === 1 ? 둥글기[s.둥글기 || '그대로'](v) : 둥글기[s.둥글기 || '그대로'](v / u) * u }
export const 둥식 = (e, s) => {
  const u = s.단위 || 1, d = s.둥글기 || '그대로'
  if (u === 1 || d === '그대로') return 둥글식[d](e)
  const n = -Math.round(Math.log10(u))
  return { 버림: `ROUNDDOWN(${e},${n})`, 반올림: `ROUND(${e},${n})`, 올림: `ROUNDUP(${e},${n})` }[d]
}

/* ═══════════════════════════ 원가계산서 읽기 ═══════════════════════════ */

/** 원가계산서처럼 생긴 시트 찾기 — 이름에 «원가계산» (가로 · 총괄 · 집계는 뒤로) */
export function 원가시트찾기(책) {
  const 이름들 = Object.keys(책)
  const 뒤로 = (n) => (/가로|총괄|집계|요약/.test(n) ? 1 : 0) + (심사전짝.has(n) ? 2 : 0)
  const 심사전짝 = 옛판빼기(이름들)          /* G382 — 심사 뒤 짝이 있는 «원가계산서(심사전)» 은 맨 뒤로 */
  const 후보 = 이름들.filter((n) => /원가\s*계산/.test(n))
  후보.sort((a, b) => 뒤로(a) - 뒤로(b))
  for (const n of 후보) { const r = 원가읽기(책[n], n); if (r.줄.length >= 5) return r }
  /* 🩹 G382 (2026-10-23) — 이름이 «원가계산» 이 아닌 원가계산서 시트(「원가」 · 「원가(연도)」 · 「공사원가」 · 「총괄내역서」 …).
       실제 설계내역서 484부 중 10부가 이 꼴이라 원 내역서 · 기성 도구가 원가계산서를 «못 찾았습니다» 로 넘김.
       이름에 «원가» 가 든 시트 → 그 밖의 시트 차례로, 줄이 5 넘고 «직접노무비» 와 «일반관리비 · 이윤» 줄이 다 있는 표만(내역서 · 일위대가를 원가로 잡지 않게) */
  const 원가표다움 = (r) => r.줄.length >= 5 && r.줄.some((x) => /직접노무비|^노무비$/.test(붙(x.이름))) && r.줄.some((x) => /일반관리비|이윤/.test(붙(x.이름)))
  const 더 = [...이름들.filter((n) => !후보.includes(n) && /원가/.test(n)), ...이름들.filter((n) => !후보.includes(n) && !/원가/.test(n))]
  더.sort((a, b) => 뒤로(a) - 뒤로(b))
  for (const n of 더) { const g = 책[n]; if (!g || !g.length || g.length > 400) continue; const r = 원가읽기(g, n); if (원가표다움(r)) return r }
  return null
}

/**
 * 원가계산서 표 → { 시트, 줄:[{r, 이름, 코드, 금액, 율, 근거, 식}], 두줄 }
 *   두줄(변경 원가계산서 — 당초 · 변경이 위아래)이면 아래 줄(변경)을 «지금 값» 으로 읽습니다.
 */
export function 원가읽기(grid, 시트 = '원가계산서') {
  const N = (r) => (grid[r] || []).map(붙)
  let hi = -1
  let 나열 = null
  const 숫자칸수 = (i, j) => { let n = 0; for (let r = i + 1; r < Math.min(grid.length, i + 60); r++) if (typeof (grid[r] || [])[j] === 'number') n++; return n }
  /* 🩹 G382 — 머리글 꼴을 넓힘(실측: 원가계산서 35부가 «비목 · 금액 머리글을 못 찾았습니다»):
       대각선 칸 「비 목 ⟍ 구 분」(→ 비목구분) · 「품 명」 · 「금 액(원)」 · 비목 칸이 비고 «금액» 만 있는 꼴(아래에 직접재료비 · 직접노무비 줄) */
  const 이름머리 = /^(비목|비목명|구분|항목|품명|명칭|과목|원가항목|비목구분|구분비목|비목및구분)$/
  const 금머리 = /^(금액|금액원|금액\(원\)|공사금액|합계금액)$/
  for (let i = 0; i < Math.min(grid.length, 30); i++) {
    const c = N(i)
    if (c.some((x) => 이름머리.test(x)) && c.some((x) => 금머리.test(x))) { hi = i; break }
    /* 나열형(분야별 총괄 — 비목 | 건축 | 토목 | 기계 | … | 합계) (G296) */
    if (c.some((x) => /^(비목|비목명|항목)$/.test(x))) {
      const 합j = c.findIndex((x) => /^(합계|총계|합|계)$/.test(x))
      if (합j > 0) {
        const 칸 = c.map((x, j) => (j < 합j && x && !/^(비목|비목명|구분|항목|코드)$/.test(x) && 숫자칸수(i, j) >= 5 ? j : -1)).filter((j) => j >= 0)
        if (칸.length >= 2 && 숫자칸수(i, 합j) >= 5) { hi = i; 나열 = { 합j, 칸 }; break }
      }
    }
  }
  if (hi < 0) {
    /* 비목 머리 칸이 빈 꼴 — «금액» 칸이 있고 그 아래 12줄 안 왼쪽 칸에 직접재료비 · 직접노무비가 보이면 그 줄이 머리글 */
    for (let i = 0; i < Math.min(grid.length, 30) && hi < 0; i++) {
      const j = N(i).findIndex((x) => 금머리.test(x))
      if (j <= 0) continue
      for (let r = i + 1; r < Math.min(grid.length, i + 13); r++) if (N(r).slice(0, j).some((x) => /^(직접재료비|직접노무비)$/.test(x))) { hi = i; break }
    }
  }
  if (hi < 0) return { 시트, 줄: [], 까닭: '「비목 · 금액」 머리글을 못 찾았습니다' }
  const h = N(hi)
  const 금칸 = 나열 ? 나열.합j : h.findIndex((x) => 금머리.test(x))
  const 분칸 = new Set(나열 ? 나열.칸 : [])
  let 코칸 = h.findIndex((x, j) => /^구분$/.test(x) && j < 금칸)
  /* 🩹 G382 — 「구 분」 머리 칸이 코드(1 · A · 가)가 아니라 비목 이름(직접재료비 · 간접노무비 …) 칸인 꼴 — 코드 칸으로 보면 이름이 다 빠져
       «재료비 · 노무비» 만 남고 줄 이름이 비어 산출근거 · 요율을 못 맞춤(실측: 원가계산서 여러 부 · 품목을 바꿔도 순공사비가 그대로) */
  if (코칸 >= 0) {
    let 코 = 0, 이 = 0
    for (let r = hi + 1; r < Math.min(grid.length, hi + 60); r++) { const v = (grid[r] || [])[코칸]; if (코드꼴(v)) 코++; else if (/[가-힣]{3,}/.test(붙(v))) 이++ }
    if (이 > 코) 코칸 = -1
  }
  const 율칸 = h.findIndex((x) => /^(요율|율|비율|적용율|적용요율)$/.test(x))
  /* 산출근거 칸 — 머리 이름이 여럿이면(구성비 · 비고) 식처럼 생긴 글(× · * · %)이 가장 많은 칸 */
  const 근후보 = h.map((x, j) => (/^(산출근거|산출내역|산식|계산근거|근거|구성비|비고|적요|산출방법|산출기준)$/.test(x) ? j : -1)).filter((j) => j >= 0)
  /* 🩹 G382 — «[노무비] 의» · «[재료비 + 직접노무비] 의» 처럼 비목 이름으로 적은 구성비 칸도 근거 칸(전엔 비고 칸의 «[총원가]*요율» 한 줄에 져서 구성비 글이 줄 이름이 됨 — 실측) */
  const 식글수 = (j) => { let n = 0; for (let r = hi + 1; r < Math.min(grid.length, hi + 80); r++) { const t = 글((grid[r] || [])[j]); if (t && (/[×xX*＊%]|^\(.*[+:].*\)$/.test(t) || /^\[[^\]]+\]\s*의$/.test(t))) n++ } return n }
  const 근칸 = 근후보.length ? 근후보.reduce((a, b) => (식글수(b) > 식글수(a) ? b : a)) : -1
  /* 구분 머리가 없으면 금액 바로 왼쪽 칸 → 그다음 맨 왼쪽부터 — 코드(1 · A · A1 · AS …)처럼 쓰인 칸 */
  if (코칸 < 0 && 금칸 > 0) {
    const 코수 = (j) => { let n = 0; for (let r = hi + 1; r < Math.min(grid.length, hi + 60); r++) if (코드꼴((grid[r] || [])[j])) n++; return n }
    for (const j of [금칸 - 1, ...Array.from({ length: 금칸 - 1 }, (_, k) => k)]) if (j !== 율칸 && j !== 근칸 && !분칸.has(j) && 코수(j) >= 5) { 코칸 = j; break }
  }
  const 줄 = []
  let 앞 = null
  for (let r = hi + 1; r < grid.length; r++) {
    const row = grid[r] || []
    const 코 = 코칸 >= 0 ? 코드꼴(row[코칸]) : ''
    /* 이름: 금액 칸 왼쪽(코드 · 요율 · 근거 칸 빼고)의 글 가운데 두 글자 넘는 것 — 맨 오른쪽(세로로 쓴 «재 · 료 · 비» 같은 한 글자는 갈래 표시) */
    const 칸글 = row.slice(0, Math.max(0, 금칸)).map((v, j) => (j === 코칸 || j === 율칸 || j === 근칸 || 분칸.has(j) ? '' : 글(v)))
    const 왼 = 칸글.filter((x) => 붙(x).length > 1 && !/^[\d.,]+$/.test(붙(x)) && !(코칸 < 0 ? false : 코드꼴(x)))
    const 외자 = 칸글.find((x) => /^(계|합)$/.test(붙(x)))
    const 이름 = 왼.length ? 왼[왼.length - 1].replace(/\s+/g, ' ') : 외자 ? 붙(외자) : ''
    const 금 = 수(row[금칸])
    const 율 = 율칸 >= 0 ? 율읽기(row[율칸]) : null
    const 근 = 근칸 >= 0 ? 글(row[근칸]) : ''
    if (!코 && !이름 && 금 === null) continue
    if (코 || 이름) {
      앞 = { r: r + 1, 이름: 이름 || '', 코드: 코, 금액: 금, 율, 근거: 근, 값들: [금], ...(나열 ? { 분야값: 나열.칸.map((j) => 수(row[j])) } : {}) }
      if (!이름 && 코) 앞.이름 = '(' + 코 + ')'
      줄.push(앞)
    } else if (앞 && 금 !== null && r === 앞.r - 1 + 앞.값들.length) {
      앞.값들.push(금)                                  /* 두 줄짜리 — 바로 아래 줄(변경) 값(떨어진 줄의 숫자는 검산 메모로 보고 건넘) */
      ;(앞.덧 || (앞.덧 = [])).push({ r: r + 1, 금, 율, 근 })
      if (율 !== null && 앞.율 === null) { 앞.율 = 율; 앞.율덧 = true }
      if (근 && !앞.근거) { 앞.근거 = 근; 앞.근거덧 = true }
    }
  }
  const 두줄 = 줄.filter((x) => x.값들.length > 1).length >= Math.max(3, 줄.length * 0.4)
  if (두줄) for (const x of 줄) { x.금액 = x.값들[x.값들.length - 1]; delete x.덧; delete x.근거덧; delete x.율덧 }
  else {
    /* 🩹 G382 (2026-10-23) — 두 줄짜리(당초 · 변경 위아래) 표가 «아니면» 이름 없이 금액만 있는 바로 아래 줄은 «제 줄» 입니다.
         전엔 윗줄의 변경 값으로 봐 「부가가치세 3,221,000」 이 그 아래 이름 없는 총공사비 줄 «35,431,000» 으로 읽혔음(실측: 원가계산서 한 부).
         부가가치세 바로 아래에서 금액이 공급가액 + 부가가치세 인 줄은 «총공사비» 로 이름 붙임 */
    const 펼친 = []
    for (const x of 줄) {
      x.금액 = x.값들[0]
      const 덧 = x.덧 || []
      /* 같은 비목을 두 가지로 셈해 «작은 금액 적용» 처럼 고른 꼴(산업안전보건관리비 — 관급 포함 셈 · 미포함 × 1.2 중 작은 것) — 고른 금액이 그 비목 금액(줄을 나누지 않음) */
      const 고른 = 덧.find((d) => /적용/.test(d.근 || ''))
      if (고른) { x.금액 = 고른.금; x.값들 = [고른.금]; delete x.덧; delete x.근거덧; delete x.율덧; 펼친.push(x); continue }
      if (덧.length) {
        x.값들 = [x.값들[0]]
        if (x.근거덧) x.근거 = ''            /* 아래 줄에서 가져온 근거 · 요율은 그 줄 몫 */
        if (x.율덧) x.율 = null
      }
      delete x.덧; delete x.근거덧; delete x.율덧
      펼친.push(x)
      for (const d of 덧) 펼친.push({ r: d.r, 이름: '', 코드: '', 금액: d.금, 율: d.율, 근거: d.근, 값들: [d.금] })
    }
    for (let k = 1; k < 펼친.length; k++) {
      const x = 펼친[k], 위 = 펼친[k - 1]
      if (x.이름 || !/^부가(가치)?세$/.test(붙(위.이름))) continue
      const 공 = 펼친.slice(0, k - 1).reverse().find((y) => /^(공급가액|총원가)$/.test(붙(y.이름)))
      if (공 && Math.abs((공.금액 || 0) + (위.금액 || 0) - (x.금액 || 0)) <= 1) x.이름 = '총공사비'
    }
    줄.length = 0; 줄.push(...펼친)
  }
  const 끝 = 줄.findIndex((x) => /총공사비/.test(붙(x.이름)))
  const 쓸 = (끝 >= 0 ? 줄.slice(0, 끝 + 1) : 줄).filter((x) => x.코드 || x.금액 !== null)
  코드다듬기(쓸)
  const 코드들 = new Set(쓸.map((x) => x.코드))
  for (const x of 쓸) x.식 = x.근거 ? 식읽기(x.근거, 코드들) : null
  /* 나열형 — 값이 있는 분야만 · 줄마다 분야 합 = 합계(±1원)여야 분야마다 셈 */
  let 분야 = null, 까닭 = ''
  if (나열) {
    const 쓸칸 = 나열.칸.map((j, n) => ({ j, n })).filter(({ n }) => 쓸.some((x) => x.분야값 && x.분야값[n]))
    const 맞음 = 쓸.every((x) => x.금액 === null || !x.분야값 || x.분야값.every((v) => v === null) || Math.abs(x.분야값.reduce((a, v) => a + (v || 0), 0) - x.금액) < 1.5)
    if (쓸칸.length >= 2 && 맞음) {
      분야 = 쓸칸.map(({ j }) => ({ 이름: 글((grid[hi] || [])[j]).replace(/\s+/g, ''), 칸: j }))
      for (const x of 쓸) x.분야값 = 쓸칸.map(({ n }) => (x.분야값 ? x.분야값[n] : null))
    } else 까닭 = 쓸칸.length >= 2 ? '분야 합이 합계와 다른 줄이 있어 합계로만 셉니다' : ''
  }
  return { 시트, 줄: 쓸, 두줄, 칸: { 코칸, 금칸, 율칸, 근칸 }, 머리줄: hi + 1, ...(분야 ? { 분야 } : {}), ...(까닭 ? { 까닭 } : {}) }
}

/** 코드 다듬기(G296) — 같은 코드가 두 번(「CH」 넷 · 「CA」 둘)이면 뒤는 «CH~2» · 코드 없는 줄은 «#행» (셈 안에서만 · 엑셀에는 원래 코드 · 빈칸)
 *  식 글에 나오는 코드는 처음 나온 줄을 가리킵니다. */
function 코드다듬기(줄) {
  const 셈수 = new Map()
  for (const x of 줄) {
    x.표시코드 = x.코드 || ''
    if (!x.코드) { x.코드 = '#' + x.r; continue }
    const n = (셈수.get(x.코드) || 0) + 1
    셈수.set(x.코드, n)
    if (n > 1) x.코드 = x.코드 + '~' + n
  }
  return 줄
}

/** 셈 줄이 잇는 공종들(하나 또는 이어진 여럿) */
export const 공종목록 = (s) => (s.공종들 && s.공종들.length ? s.공종들 : [s.공종])

/* ═══════════════════════════ 맞춰 보기 ═══════════════════════════ */

const 갈래쪽 = (이름) => {
  const t = 붙(이름)
  if (/작업설|부산물/.test(t)) return ''
  if (/재료비/.test(t)) return '재료비'
  if (/직접노무비/.test(t)) return '노무비'
  if (/산출경비|직접경비|기계경비/.test(t)) return '경비'
  return ''
}
const 소계다움 = (n) => {
  if (!n) return false
  let 곱 = false
  const 걷 = (x) => { if (!x) return; if (x.op === '*' || x.op === '/') 곱 = true; 걷(x.a); 걷(x.b) }
  걷(n)
  return !곱
}

/**
 * 원가 줄마다 «어떻게 셀지» 정하기
 * @param 원가   원가읽기() 결과
 * @param 내역   { 순: {갈래:금액}, 공종들: [{i, 이름, 깊이, 별도, 합: {갈래:금액}}] } — «당초»(이번 기준) 쪽
 * @returns 원가에 붙여 { 셈:[{코드, 꼴:'식'|'공종'|'나머지'|'그대로'|'빈칸', ...}], 말:[] }
 */
export function 원가맞추기(원가, 내역) {
  if (원가.분야 && 원가.분야.length >= 2) { const r = 분야맞추기(원가, 내역); if (r) return r }
  return 한칸맞추기(원가, 내역)
}
function 한칸맞추기(원가, 내역) {
  const 줄 = 원가.줄
  const 코드차례 = 줄.map((x) => x.코드).filter(Boolean)
  const 말 = []
  const 기준 = (g) => (g && typeof g === 'object' ? (g.합계 ?? ((g.재료비 || 0) + (g.노무비 || 0) + (g.경비 || 0))) : 0)
  const 셈 = 줄.map((x) => ({ 코드: x.코드, 이름: x.이름, 당초: x.금액, 꼴: '' }))
  /* ── ① 바탕 금액: 식이 없는 줄 → 공종 합계와 같은가 ── */
  const 쓴공종 = new Set()
  /* 맨 위 공종이 하나(공사 이름)면 그것은 건넘 · 맨 위가 여럿(«< 건설안전관리비 >» 처럼 펼친 내역)이면 맨 위도 봄 */
  const 맨위하나 = 내역.공종들.filter((p) => p.깊이 === 0).length <= 1
  const 갈래줄있음 = 줄.some((x) => /재료비/.test(붙(x.이름))) && 줄.some((x) => /노무비/.test(붙(x.이름)))   /* 재료비 · 노무비 줄이 따로 있어 합계 줄을 식으로 셀 수 있는 표 */
  줄.forEach((x, k) => {
    if (x.식 || x.금액 === null || x.금액 === 0) return
    let 찾 = null
    /* 관급 줄은 천 원 미만을 잘라 적는 일이 흔함 — 금액이 천 원 단위면 내역 합 − 금액이 0 ~ 999원 도 같은 것으로 */
    const 관 = /관급|지급자재|설치분/.test(붙(x.이름)) && x.금액 % 1000 === 0
    /* 🩹 G382 — 천 원 미만을 «올려» 적은 관급도(실측: 내역 관급자재대 68,685,202원 → 원가계산서 68,686,000원 · 전엔 «산출근거 없음 — 당초 그대로») */
    const 맞 = (v) => Math.abs(v - x.금액) <= 2 || (관 && Math.abs(v - x.금액) < 1000)
    for (const p of 내역.공종들) {
      if (쓴공종.has(p.i) || (p.깊이 === 0 && 맨위하나)) continue
      /* 🩹 G382 — 합이 0 인 공종은 건넘(원가 «끝수 조정 −2원» 줄이 빈 공종과 ±2원으로 맞아 «공종» 이 되면 안 고쳐도 변경이 0 · 실측) */
      if (Math.abs(기준(p.합)) > 2 && 맞(기준(p.합))) { if (!찾 || p.깊이 < 찾.깊이) 찾 = p }
    }
    const 천 = (v) => (Math.abs(v - x.금액) > 2 ? { 단위: 1000, 둥글기: v > x.금액 ? '버림' : '올림' } : {})     /* 천 원 미만 버려(올려) 적은 관급 */
    /* 🩹 G382 — 「가. 순공사비」 · 「직접공사비」 처럼 합계 이름 줄이 맨 위 공종(본공사)과 같아 공종으로 잡힌 것은 그 공종을 따라가되, 재료비 · 노무비 · 경비 줄이 따로 있으면
         ② 나머지에서 그 공종을 빼지 않음(합계줄) — 전엔 빼서 재료비 · 노무비 · 경비가 «0 + 차이» 가 되어 품목을 바꿔도 그대로였음(실측) */
    const 합계줄 = 갈래줄있음 && /순공사|직접공사비|공급가액|총원가|도급|총공사|^공사비$/.test(원가꼴(x.이름))
    if (찾) { 쓴공종.add(찾.i); 셈[k] = { ...셈[k], 꼴: '공종', 공종: 찾.i, 공종이름: 찾.이름, 별도: !!찾.별도, ...천(기준(찾.합)), ...(합계줄 ? { 합계줄: true } : {}) }; if (합계줄) 쓴공종.delete(찾.i); return }
    /* 🩹 G382 — 품목 합으로는 안 맞지만 내역서 공종 머리에 «적힌» 합계와 원 단위까지 같은 줄(원본 머리 금액이 아래 품목 합과 다른 파일 · 실측 관급자재대 34,818원 차이)
         → 그 공종을 따라가고 차이(덧)는 그대로 둡니다 — 수량을 안 바꾸면 변경 = 당초 · 바꾸면 증감만큼 */
    for (const p of 내역.공종들) {
      if (쓴공종.has(p.i) || (p.깊이 === 0 && 맨위하나) || !p.원합) continue
      const w = 기준(p.원합), c = 기준(p.합)
      if (w && Math.abs(w - x.금액) <= 2 && Math.abs(x.금액 - c) <= Math.abs(x.금액) * 0.1) { if (!찾 || p.깊이 < 찾.깊이) 찾 = p }
    }
    if (찾) {
      const 덧 = Math.round((x.금액 - 기준(찾.합)) * 1e6) / 1e6
      쓴공종.add(찾.i); 셈[k] = { ...셈[k], 꼴: '공종', 공종: 찾.i, 공종이름: 찾.이름, 별도: !!찾.별도, 덧, ...(관 ? { 단위: 1000, 둥글기: '버림' } : {}) }
      말.push({ 무게: '참고', 무엇: `«${글(x.이름)}» 은 내역서 «${글(찾.이름).trim()}» 에 적힌 합계(${Math.round(x.금액).toLocaleString('ko-KR')}원)와 같아 그 공종을 따라갑니다 — 적힌 합계와 아래 품목 합의 차이 ${Math.round(덧).toLocaleString('ko-KR')}원은 그대로 둡니다` })
      return
    }
    /* 이어진 같은 깊이 공종 2~6개의 합(±2원) — «품질관리비 = 품질시험비 + 품질시험활동비» 처럼 나눠 적은 것 (G296)
       직접재료비 · 직접노무비 · 산출경비 · 소계 줄은 건넘(② 에서 맞춤) */
    if (갈래쪽(x.이름) || /소계|^계$|합계/.test(붙(x.이름)) || Math.abs(x.금액) < 100000) return
    const 공 = 내역.공종들
    for (let a = 0; a < 공.length && !찾; a++) {
      const p0 = 공[a]
      if (쓴공종.has(p0.i) || (p0.깊이 === 0 && 맨위하나)) continue
      const 묶 = [p0]
      let 합 = 기준(p0.합)
      for (let b = a + 1; b < 공.length && 묶.length < (관 ? 12 : 6); b++) {
        const q = 공[b]
        if (q.깊이 > p0.깊이) continue
        if (q.깊이 < p0.깊이 || 쓴공종.has(q.i)) break
        묶.push(q); 합 += 기준(q.합)
        if (묶.length >= 2 && 맞(합)) { 찾 = 묶.slice(); break }
        if (합 > x.금액 + (관 ? 999 : 2) && 기준(q.합) >= 0) break
      }
    }
    if (찾) { for (const p of 찾) 쓴공종.add(p.i); 셈[k] = { ...셈[k], 꼴: '공종', 공종: 찾[0].i, 공종들: 찾.map((p) => p.i), 공종이름: 찾.filter((p) => 기준(p.합)).map((p) => 글(p.이름).replace(/\s+/g, ' ')).join(' + '), 별도: 찾.some((p) => p.별도), ...천(찾.reduce((a, p) => a + 기준(p.합), 0)) } }
  })
  /* ── ② 재료 · 노무 · 경비 나머지 ── */
  for (const g of ['재료비', '노무비', '경비']) {
    let 나 = (내역.순[g] || 0)
    const 뺀 = []
    for (const s of 셈) if (s.꼴 === '공종' && !s.별도 && !s.합계줄) for (const i of 공종목록(s)) { const p = 내역.공종들.find((q) => q.i === i); 나 -= (p && p.합[g]) || 0; 뺀.push(i) }
    const 남은 = 줄.map((x, k) => k).filter((k) => !셈[k].꼴 && !줄[k].식 && 갈래쪽(줄[k].이름) === g)
    /* 🩹 G382 — 이름이 그냥 「경 비」 인 줄이 내역서 경비 합과 원 단위까지 같으면 그 줄이 산출경비(직접경비)입니다(실측: 원가계산서 여러 부 — 품목을 바꿔도 경비가 그대로) */
    /*   (재료비 · 노무비도 같게 — 이름이 그냥 「노 무 비」 · 「재 료 비」 인 줄이 내역 합과 원 단위까지 같으면 그 줄 · 실측: 「노무비」 줄이 «그대로» 라 보험료 · 순공사원가가 안 바뀜) */
    if (!남은.some((k) => Math.abs((줄[k].금액 || 0) - 나) <= 2)) {
      const k경 = 줄.findIndex((x, k) => !셈[k].꼴 && !x.식 && 붙(이름꼴(x.이름)) === g && Math.abs((x.금액 || 0) - 나) <= 2)
      if (k경 >= 0 && !남은.includes(k경)) 남은.push(k경)
    }
    if (!남은.length) continue
    const 있는 = 남은.filter((k) => (줄[k].금액 || 0) !== 0)
    const 합 = 있는.reduce((a, k) => a + 줄[k].금액, 0)
    let 고른 = 있는.find((k) => Math.abs(줄[k].금액 - 나) <= 2)
    let 맞음 = 고른 !== undefined
    if (!맞음 && 있는.length > 1 && Math.abs(합 - 나) <= 2) { 고른 = 있는.reduce((a, b) => (줄[b].금액 > 줄[a].금액 ? b : a)); 맞음 = true }
    if (고른 === undefined) 고른 = (있는.length ? 있는 : 남은).reduce((a, b) => ((줄[b].금액 || 0) > (줄[a].금액 || 0) ? b : a))
    /* 🩹 G382 — 한 줄이 내역 합과 바로 맞으면(나머지 줄 합으로 맞춘 것이 아니면) 다른 같은 갈래 줄을 빼지 않음 · 차이는 원 미만까지 적어 «안 고치면 변경 = 당초» 가 원 단위까지 맞게.
         전엔 「직접재료비」 가 내역 재료비와 바로 맞는데도 «[재료비 + 노무비] 의» 같은 줄 금액을 빼서, 아무것도 안 고쳐도 직접재료비가 6,052,542원 줄었음(실측) */
    const 바로 = Math.abs((줄[고른].금액 || 0) - 나) <= 2
    const 덜 = 맞음 && !바로 ? 있는.filter((k) => k !== 고른).reduce((a, k) => a + 줄[k].금액, 0) : 0
    셈[고른] = { ...셈[고른], 꼴: '나머지', 갈래: g, 뺀, 덜, 차이: Math.round(((줄[고른].금액 || 0) + 덜 - 나) * 1e6) / 1e6 }
    if (!맞음 && Math.round(셈[고른].차이) !== 0) 말.push({ 무게: '확인', 무엇: `원가계산서 «${줄[고른].이름}» 당초(${(줄[고른].금액 || 0).toLocaleString('ko-KR')})가 내역서 ${g} 합과 ${Math.round(셈[고른].차이).toLocaleString('ko-KR')}원 다릅니다 — 증감만 더했습니다` })
  }
  /* ── ③ 식 줄: 당초가 정말 그 식으로 나오나 ── */
  const 당초값 = (c) => { const x = 줄.find((y) => y.코드 === c); return x ? x.금액 : undefined }
  줄.forEach((x, k) => {
    if (셈[k].꼴) return
    if (!x.식) { 셈[k].꼴 = x.금액 === null ? '빈칸' : '그대로'; if (x.금액) 말.push({ 무게: '참고', 무엇: x.근거 ? `«${x.이름}» 산출근거(${x.근거})를 식으로 못 읽어 당초 금액 그대로 둡니다` : `«${x.이름}» 은 산출근거가 없어 당초 금액 그대로 둡니다` }); return }
    /* 🩹 G382 — 근거가 제 줄을 가리키는 식(실측 「부가가치세 I · H + I」 — 원본 오타)은 식으로 안 씀 → 금액으로 식 찾기(배운식보충).
         전엔 «H 를 빼야 맞습니다» 로 I = I 가 되어 변경 부가세 · 도급액 · 총공사비가 당초 그대로였음 */
    if (x.코드 && 더하는곳(x.식).includes(x.코드)) { 셈[k].꼴 = '그대로'; 말.push({ 무게: '참고', 무엇: `«${x.이름}» 산출근거(${x.근거})가 제 줄을 가리켜 식으로 못 씁니다 — 당초 금액 그대로 둡니다` }); return }
    const 해 = (식) => {
      const v = 식셈(식, (c) => 당초값(c) ?? 0, 코드차례)
      if (v === undefined) return null
      if (x.금액 === null) return Math.abs(v) < 1 ? '그대로' : null
      for (const [이름, f] of Object.entries(둥글기)) {
        if (이름 === '그대로' ? Math.abs(f(v) - x.금액) < 0.5 : Math.abs(f(v) - x.금액) < 0.001) return 이름
      }
      return null
    }
    let 둥 = 해(x.식)
    let 식 = x.식
    let 조정 = 0
    if (!둥 && x.율 !== null) {
      for (const 곱 of 곱수들(x.식)) {
        const 옛 = 곱.v
        곱.v = x.율
        const t = 해(x.식)
        if (t) { 둥 = t; 말.push({ 무게: '참고', 무엇: `«${x.이름}» 산출근거의 ${옛} 대신 요율 칸 ${(x.율 * 100).toFixed(3).replace(/\.?0+$/, '')}% 로 맞습니다 — 요율로 셉니다` }); break }
        곱.v = 옛
      }
    }
    /* 소계인데 안 맞음 — 같은 이름이 두 번 적힌 줄(산업안전보건관리비 «관급 포함» 비교 줄 같은 것)을 빼면 맞나 */
    if (!둥 && 소계다움(x.식) && x.금액 !== null) {
      const 코들 = 더하는코드(x.식, 코드차례)
      const v = 식셈(x.식, (c) => 당초값(c) ?? 0, 코드차례)
      if (코들 && v !== undefined) {
        const 차 = v - x.금액
        const 뺄 = 코들.find((c) => { const w = 당초값(c); return w && Math.abs(w - 차) < 1 })
        if (뺄) {
          const 새식 = { op: '합', 코드들: 코들.filter((c) => c !== 뺄) }
          const t = 해(새식)
          if (t) {
            식 = 새식; 둥 = t
            const 뺀이름 = (줄.find((y) => y.코드 === 뺄) || {}).이름 || 뺄
            말.push({ 무게: '참고', 무엇: `«${x.이름}» (${x.근거}) 은 ${뺄}번 «${뺀이름}» 을 빼야 당초와 맞습니다 — 변경도 빼고 셉니다` })
          }
        }
      }
    }
    /* 요율 식인데 몇천 원 어긋남 — 도급액을 천 원 단위로 맞추려 이윤 등을 조금 깎은 것으로 보임 → 변경은 식대로 */
    if (!둥 && !소계다움(x.식) && x.금액 !== null) {
      const v = 식셈(x.식, (c) => 당초값(c) ?? 0, 코드차례)
      if (v !== undefined && Math.abs(v - x.금액) <= Math.max(1000, Math.abs(x.금액) * 2e-5)) {
        둥 = '버림'
        조정 = x.금액 - 둥글기.버림(v)
        말.push({ 무게: '참고', 무엇: `«${x.이름}» 당초 금액이 식(${x.근거})과 ${Math.round(조정).toLocaleString('ko-KR')}원 다릅니다(천 원 단위 맞춤 조정으로 보임) — 변경에도 같은 조정값을 더합니다. 변경 도급액의 천 원 맞춤은 손으로 하십시오` })
      }
    }
    if (둥) { 셈[k] = { ...셈[k], 꼴: '식', 식, 둥글기: 둥, 조정, 소계: 소계다움(식) || 식.op === '합' } } else {
      셈[k].꼴 = '그대로'
      말.push({ 무게: '확인', 무엇: `«${x.이름}» 산출근거(${x.근거})로 당초 금액이 안 나옵니다 — 변경도 당초 금액 그대로 둡니다. 손으로 확인하십시오`, 근거안맞음: true })
    }
  })
  const 맞춘 = { 셈, 말, 코드차례 }
  배운식보충(원가, 맞춘, 내역)
  고정비맞춤(원가, 맞춘, 내역)
  합줄그대로알림(원가, 맞춘, 내역)
  return 맞춘
}
/* 🩹 G382 — 마지막 그물: 내역서 재료비 · 노무비 · 경비 · 공종을 모두 10% 늘려 셈해 보고, 순공사비 · 공급가액 · 총원가 · 도급액 · 총공사비 같은 합계 줄이
     «안 바뀌거나 줄면» 식을 못 찾았거나(그대로) 틀린 식(돌고 도는 식 · 엉뚱한 바탕)이라 «확인» 으로 알림 — 품목을 바꿔도 그 줄이 맞게 안 바뀌므로 손으로 고치라고
     (실측: #REF! 가 섞인 원가계산서 · 「시설공사 = 총공사금액 · 총공사금액 = 시설공사」 · 이윤이 거꾸로 주는 표) */
const 합계이름 = /^(순공사원가|순공사비|공급가액|총원가|총공사원가|도급액|총공사비|총공사금액|시설공사|시설공사비)$/
function 합줄그대로알림(원가, 맞춘, 내역) {
  const 합이름 = 합계이름
  const 늘림 = (g) => Object.fromEntries(Object.entries(g || {}).map(([k, v]) => [k, typeof v === 'number' ? v * 1.1 : v]))
  let 뒤 = null
  try { 뒤 = 원가변경셈(맞춘, 원가, { 순: 늘림(내역.순), 공종합: new Map((내역.공종들 || []).map((p) => [p.i, 늘림(p.합)])) }, { 줄값: 맞춘.셈.map((s) => s.당초) }).줄값 } catch (e) { 뒤 = null }
  const 걸린 = 맞춘.셈.map((s, k) => [s, 원가.줄[k], k]).filter(([s, x, k]) => {
    if (!x.금액 || !(x.금액 > 0) || !합이름.test(원가꼴(x.이름))) return false
    if (s.꼴 === '그대로') return true
    return 뒤 && 뒤[k] !== undefined && 뒤[k] !== null && 뒤[k] < x.금액 + 0.5
  })
  if (!걸린.length) return
  맞춘.말.push({ 무게: '확인', 합그대로: true, 무엇: `원가계산서 합계 줄 ${걸린.map(([, x]) => '«' + 글(x.이름).replace(/\s+/g, '') + '»').join(' · ')} 은 품목을 늘려도 안 바뀌거나 줄어듭니다(식을 못 찾았거나 원가계산서 식이 맞지 않음) — 변경 원가계산서에서 이 줄을 손으로 확인하십시오` })
}

/* ═══════════════════════════ 나열형 원가계산서 — 분야(건축 · 토목 · 기계 …)마다 따로 셈 (G296) ═══════════════════════════
 * 분야 칸마다 한 벌의 원가계산서(같은 비목 · 같은 식)로 보고 따로 맞춘 뒤 합계 = 분야 합.
 * 분야 ↔ 내역: 직접노무비가 같은 것(±2원) — ① 이 내역 전체가 한 분야(분야마다 시트가 따로) → 나머지 분야는 «이 내역 밖»(당초 그대로)
 *              ② 내역 안의 공종(«< 토목공사 >» · 묶어 읽은 시트) · 짝 없는 분야 하나는 «나머지»(전체 − 짝 지은 공종)
 *   못 맞추면 합계 칸 하나로 셉니다(말에 적음).
 */
const 분야원가 = (원가, j) => ({ ...원가, 분야: undefined, 분야이름: 원가.분야[j].이름, 줄: 원가.줄.map((x) => { const v = x.분야값 ? x.분야값[j] : null; return { ...x, 금액: v, 값들: [v] } }) })
function 분야맞추기(원가, 내역) {
  const 합 = 한칸맞추기({ ...원가, 분야: undefined }, 내역)
  const 노줄 = 원가.줄.findIndex((x) => /^직접노무비/.test(붙(x.이름)))
  if (노줄 < 0) return null
  const 공종들 = 내역.공종들 || []
  const 갈 = ['재료비', '노무비', '경비', '합계']
  const 같 = (a, b) => Math.abs((a || 0) - (b || 0)) <= 2
  const 자손 = (p) => { const k = 공종들.indexOf(p); const out = []; for (let q = k + 1; q < 공종들.length && 공종들[q].깊이 > p.깊이; q++) out.push(공종들[q]); return out }
  const 쪽 = 원가.분야.map((f, j) => ({ j, 이름: f.이름, 노: 원가.줄[노줄].분야값[j] || 0 }))
  const 있는 = 쪽.filter((f) => f.노)
  let 짝
  const 전체짝 = 있는.filter((f) => 같(f.노, 내역.순 && 내역.순.노무비))
  if (전체짝.length === 1) 짝 = 쪽.map((f) => ({ ...f, 꼴: f === 전체짝[0] ? '전체' : '밖' }))
  else {
    const 쓴 = new Set()
    짝 = 쪽.map((f) => {
      if (!f.노) return { ...f, 꼴: '?' }
      const 후 = 공종들.filter((p) => !쓴.has(p.i) && p.합 && 같(p.합.노무비, f.노) && !같(p.합.노무비, 내역.순 && 내역.순.노무비))
      if (!후.length) return { ...f, 꼴: '?' }
      const p = 후.reduce((a, b) => (b.깊이 < a.깊이 ? b : a))
      쓴.add(p.i)
      return { ...f, 꼴: '공종', p }
    })
    const 모름 = 짝.filter((f) => f.꼴 === '?')
    if (모름.length > 1) {
      합.말.unshift({ 무게: '확인', 무엇: `나열형 원가계산서(${쪽.map((f) => f.이름).join(' · ')})의 분야를 내역과 짝 짓지 못해(직접노무비가 같은 공종 · 시트 없음) 합계 칸 하나로 셉니다 — 끝전이 몇 원 다를 수 있습니다` })
      return 합
    }
    if (모름.length === 1) 모름[0].꼴 = '나머지'
  }
  const 매긴 = 짝.filter((f) => f.꼴 === '공종')
  const 더함 = (a, b, 부호 = 1) => { const r = { ...a }; for (const k of 갈) if (r[k] !== undefined || (b && b[k] !== undefined)) r[k] = (r[k] || 0) + 부호 * ((b && b[k]) || 0); return r }
  const 합of = (i) => (공종들.find((p) => p.i === i) || {}).합 || {}
  /* 분야 공종 밖의 공종(펼친 내역 끝의 «관급자재 0B.토목공사» 같은 것) — 공종 분야가 먼저 가져가고(① 금액이 같은 줄), 남은 것은 나머지 분야 */
  const 안 = new Set()
  for (const f of 매긴) { 안.add(f.p.i); for (const d of 자손(f.p)) 안.add(d.i) }
  const 가져간 = new Set()
  const 빈맞춤 = (원j) => ({ 셈: 원j.줄.map((x) => ({ 코드: x.코드, 이름: x.이름, 당초: x.금액, 꼴: x.금액 === null ? '빈칸' : '그대로' })), 말: [], 코드차례: 합.코드차례 })
  const 분야들 = 짝.map((f) => ({ 이름: f.이름, j: f.j, 꼴: f.꼴, 공종: f.p ? f.p.i : null, 공종이름: f.p ? f.p.이름 : '', 덧: [], 뺄: [], 원가: 분야원가(원가, f.j), 맞춘: null, _f: f }))
  for (const d of 분야들) {
    if (d.꼴 === '전체') d.맞춘 = 한칸맞추기(d.원가, 내역)
    else if (d.꼴 === '밖') d.맞춘 = 빈맞춤(d.원가)
    else if (d.꼴 === '공종') {
      const 바깥 = 공종들.filter((p) => !안.has(p.i) && !가져간.has(p.i))
      const 내1 = { 순: d._f.p.합, 공종들: [...자손(d._f.p), ...바깥] }
      let 맞j = 한칸맞추기(d.원가, 내1)
      const 덧 = []
      for (const s of 맞j.셈) if (s.꼴 === '공종') for (const i of 공종목록(s)) if (!안.has(i)) 덧.push(i)
      if (덧.length) { let 순 = d._f.p.합; for (const i of 덧) 순 = 더함(순, 합of(i)); 맞j = 한칸맞추기(d.원가, { ...내1, 순 }) }
      for (const i of 덧) 가져간.add(i)
      d.덧 = 덧; d.맞춘 = 맞j
    }
  }
  for (const d of 분야들) {
    if (d.꼴 !== '나머지') continue
    let 순 = { ...(내역.순 || {}) }
    for (const g of 분야들) if (g.꼴 === '공종') { 순 = 더함(순, 합of(g.공종), -1); for (const i of g.덧) 순 = 더함(순, 합of(i), -1) }
    d.뺄 = 분야들.filter((g) => g.꼴 === '공종').flatMap((g) => [g.공종, ...g.덧])
    d.맞춘 = 한칸맞추기(d.원가, { 순, 공종들: 공종들.filter((p) => !안.has(p.i) && !가져간.has(p.i)) })
  }
  for (const d of 분야들) delete d._f
  const 어디 = (f) => ({ 전체: '이 내역 전체', 공종: `«${글(f.공종이름).replace(/\s+/g, ' ')}»`, 나머지: '나머지 공종', 밖: '이 내역 밖 — 당초 그대로' })[f.꼴]
  const 말 = [{ 무게: '참고', 무엇: `나열형 원가계산서 — ${분야들.map((f) => `${f.이름} = ${어디(f)}`).join(' · ')} · 분야마다 따로 셈해 합계를 냅니다`, 나열: true }]
  /* 분야마다 같은 말(줄 수만 다른 것 포함)은 한 번 — «[건축 · 토목] …» */
  const 묶음 = new Map()
  for (const f of 분야들) {
    if (f.꼴 === '밖') continue
    for (const m of f.맞춘.말) {
      const 열쇠 = m.무게 + '|' + m.무엇.replace(/\d+줄/g, 'N줄').replace(/\(.*?\)/g, '()').replace(/[\d,]+원/g, 'N원')
      if (!묶음.has(열쇠)) 묶음.set(열쇠, { m, 이름들: [] })
      묶음.get(열쇠).이름들.push(f.이름)
    }
  }
  for (const { m, 이름들 } of 묶음.values()) 말.push({ ...m, 무엇: `[${이름들.join(' · ')}] ` + m.무엇 })
  return { ...합, 말, 분야: 분야들 }
}

/* ═══════════════════════════ 원가계산서 V2 — 산출근거 없는 줄의 식 배우기 (G296) ═══════════════════════════
 * 소장님: «원가계산서 V2 … 우린 다르게 · 더 편하지만 정확성도 좋고»
 *   산출근거가 없거나 이름으로 적힌(「직접노무비 * 12.2%」 · 「(재료비+직노) * 2.93%」 · 「계 * 5%」) 원가계산서 —
 *   낙찰맞추기(G169)가 쓰는 «금액으로 식 배우기»(위 줄들의 합 · 표준 바탕 × 요율 · 끝수 단위)를 그대로 빌려 와 식으로 바꿉니다.
 *   바꾼 뒤 «당초 내역으로 다시 셈 = 당초 금액» 이 원 단위까지 맞는 줄만 남깁니다(안 맞으면 되돌려 당초 그대로 + 말).
 */
const 끝수꼴 = (끝수) => ({ 둥글기: { f: '버림', r: '반올림', c: '올림' }[(끝수 && 끝수.m) || 'f'], 단위: (끝수 && 끝수.u) || 1 })
function 배움식(규, 코드of) {
  const 합나무 = (줄들) => {
    let t = null
    for (const [y, sg] of 줄들) {
      const c = 코드of(y)
      if (!c) return null
      const n = { op: '코드', v: c }
      t = !t ? (sg < 0 ? { op: 'neg', a: n } : n) : { op: sg < 0 ? '-' : '+', a: t, b: n }
    }
    return t
  }
  /* 🩹 G382 — 합 줄도 원본이 천 원 · 만 원 단위로 자른 것(「공급가액 32,210,000」 = 32,214,559 만 원 절사)은 그 끝수로(전엔 끝수 없이 더해 당초부터 안 맞아 «그대로» → 공급가액 · 부가가치세 · 총공사비가 안 바뀜) */
  if (규.꼴 === '합') { const 식 = 합나무(규.줄들); return 식 ? { 식, ...(규.끝수 && 규.끝수.u > 1 ? 끝수꼴(규.끝수) : { 둥글기: '그대로', 단위: 1 }), 소계: true } : null }
  if (규.꼴 === '율') { const a = 합나무(규.줄들); return a ? { 식: { op: '*', a, b: { op: '수', v: 규.r } }, ...끝수꼴(규.끝수), 소계: false } : null }
  if (규.꼴 === '식') {
    const 바꿈 = (e) => {
      if (!e) return null
      switch (e.꼴) {
        case '수': return { op: '수', v: e.값 }
        case '코드': { const y = 규.코드줄.get(e.코드); const c = y && 코드of(y); return c ? { op: '코드', v: c } : null }
        case '요율': return 규.율 === null || 규.율 === undefined ? null : { op: '수', v: 규.율 }
        case '모름': return { op: '수', v: 규.X || 0 }
        case '빼기': { const a = 바꿈(e.값); return a ? { op: 'neg', a } : null }
        case '범위': return null
        default: { const a = 바꿈(e.a), b = 바꿈(e.b); return a && b ? { op: e.꼴, a, b } : null }
      }
    }
    let 식 = 바꿈(규.식)
    if (!식) return null
    if (규.곱) 식 = { op: '*', a: 식, b: { op: '수', v: 규.곱 } }
    return { 식, ...끝수꼴(규.끝수), 소계: false }
  }
  return null
}
const 식글 = (n, 이름of) => {
  if (!n) return ''
  switch (n.op) {
    case '수': return n.v > 0 && n.v < 1 ? +(n.v * 100).toFixed(4) + '%' : String(+n.v.toFixed(6))
    case '코드': return 이름of(n.v)
    case 'neg': return '−' + 식글(n.a, 이름of)
    case '합': return n.코드들.map(이름of).join(' + ')
    default: { const a = 식글(n.a, 이름of), b = 식글(n.b, 이름of); return n.op === '*' && n.a.op !== '코드' && n.a.op !== '수' ? `(${a}) × ${b}` : `${a} ${{ '+': '+', '-': '−', '*': '×', '/': '÷' }[n.op]} ${b}` }
  }
}
/** 당초 내역으로 다시 셈 → 줄마다 당초와 같은가 */
function 당초다시(원가, 맞춘, 내역) {
  const 공종합 = new Map((내역.공종들 || []).map((p) => [p.i, p.합]))
  return 원가변경셈(맞춘, 원가, { 순: 내역.순 || {}, 공종합 }).줄값
}
function 배운식보충(원가, 맞춘, 내역) {
  const { 셈, 말 } = 맞춘
  const 빈 = 셈.map((s, k) => k).filter((k) => 셈[k].꼴 === '그대로' && 원가.줄[k].금액)
  if (!빈.length) return
  /* 낙찰맞추기 꼴 표 — 줄 · 이름 · 구분 · 금액 · 글(근거) · 수(요율) */
  const rows = 원가.줄.map((x) => ({ 줄: x.r, 이름: x.이름, 꼴: 원가꼴(x.이름), 구분: x.표시코드 || '', 금액: x.금액, 글: x.근거 ? [x.근거] : [], 수: x.율 !== null && x.율 !== undefined ? [x.율 * 100] : [], 근거: x.근거 || '' }))
  역매기기(rows)
  let 배움
  try { 배움 = 원가배우기({ rows }, { A값그대로: false }) } catch (e) { return }
  const 줄코드 = new Map(원가.줄.map((x, k) => [x.r, k]))
  const 코드of = (y) => { const k = 줄코드.get(y.줄); return k === undefined ? null : 원가.줄[k].코드 }
  const 바꾼 = []
  for (const k of 빈) {
    /* 🩹 G382 — 부가가치세는 바로 위에서 가장 가까운 줄 × 10%(끝수 1 · 10 · 100 · 1,000원)가 원 단위까지 맞으면 그것으로 — 금액 비로 찾으면
         「총원가 × 10.0261%」 처럼 바탕이 어긋난 식이 나와(실측: 위 줄이 「도급공사비」 49,410,000 × 10% = 4,941,000) 변경 부가세가 몇 원 · 몇십 원 틀어짐 */
    if (/^부가(가치)?세$/.test(붙(원가.줄[k].이름).replace(/[[\]()]/g, ''))) {
      const 금 = 원가.줄[k].금액
      let 찾 = null
      for (let j = k - 1; j >= 0 && !찾; j--) {
        const y = 원가.줄[j]
        if (!y.금액 || !y.코드 || 셈[j].꼴 === '빈칸') continue
        for (const u of [1, 10, 100, 1000]) for (const m of ['버림', '반올림', '올림']) if (!찾 && Math.abs(둥값(y.금액 * 0.1, { 단위: u, 둥글기: m }) - 금) < 0.5) 찾 = { j, u, m }
      }
      if (찾) { const 옛 = 셈[k]; 셈[k] = { ...옛, 꼴: '식', 식: { op: '*', a: { op: '코드', v: 원가.줄[찾.j].코드 }, b: { op: '수', v: 0.1 } }, 둥글기: 찾.m, 단위: 찾.u, 조정: 0, 소계: false }; 바꾼.push([k, 옛]); continue }
    }
    let 규 = 배움.규칙.get(원가.줄[k].r)
    if (!규) continue
    if (규.꼴 === '바탕?' && 규.대안) 규 = 규.대안          /* 이름은 모르나 요율 칸 × 흔한 바탕이 딱 맞는 줄 */
    /* 요율 없이 «당초 비»(금액 ÷ 바탕)로 배운 줄 — 짧은 요율(3.545% · 14.6% 처럼 소수 다섯째 자리까지)로 딱 맞으면 그 요율로.
       안 맞으면 고정 금액(고지 금액 · 손으로 정한 금액)으로 봄 → 보험료 · 산안비 · 환경보전비는 «대상액 증감 비율» 로(고정비맞춤) */
    /* 🩹 G382 — 원 미만까지 적힌 금액(「석면부담금 1,241.5728…」 · 「소계 5,098,646.795…」 — 원본이 끝수를 안 자름)은 끝수 없이 맞춰 봄.
         전엔 버림으로만 맞춰 봐서 0.5원 넘게 달라 «당초 금액 그대로» → 품목을 바꿔도 경비 소계 · 순공사비 · 도급액이 그대로 남았음(실측) */
    const 소수 = Math.abs((원가.줄[k].금액 || 0) - Math.round(원가.줄[k].금액 || 0)) > 1e-6
    if (규.꼴 === '율' && /당초 비/.test(규.말 || '')) {
      const b = 규.줄들.reduce((a, [y, sg]) => a + sg * (y.금액 || 0), 0), 금 = 원가.줄[k].금액
      let 고운 = null
      for (let d = 2; d <= 7 && !고운 && b > 0; d++) {
        const u = 10 ** d
        for (const r of [Math.floor(금 / b * u) / u, Math.ceil(금 / b * u) / u]) if (소수 ? Math.abs(b * r - 금) < 0.01 : Math.abs(둥글기.버림(b * r) - 금) < 0.5) { 고운 = { r, d }; break }
      }
      if (고운 && 고운.d <= 5) 규 = { ...규, r: 고운.r }
      else if (대상규칙.some((x) => x.이름.test(붙(이름꼴(원가.줄[k].이름)).replace(/[[\]()]/g, '')))) continue
    }
    const f = 배움식(규, 코드of)
    if (!f || 더하는곳(f.식).includes(원가.줄[k].코드)) continue
    if (소수) { f.둥글기 = '그대로'; f.단위 = 1 }
    const 옛 = 셈[k]
    셈[k] = { ...옛, 꼴: '식', 식: f.식, 둥글기: f.둥글기, 단위: f.단위, 조정: 0, 소계: f.소계 }
    바꾼.push([k, 옛])
  }
  if (!바꾼.length) return
  /* 🩹 G382 — 돌고 도는 식(「시설공사 = 총공사금액」 · 「총공사금액 = 시설공사」 — 같은 금액 두 줄을 서로 바탕으로 배움)은 되돌림(실측: 변경해도 둘 다 그대로) */
  {
    const 코k = new Map(셈.map((x, k) => [x.코드, k]))
    const 가리킴 = (k) => (셈[k].꼴 === '식' ? 더하는곳(셈[k].식).map((c) => 코k.get(c)).filter((j) => j !== undefined) : [])
    const 돎 = (k0) => { const 본 = new Set(); const 길 = [...가리킴(k0)]; while (길.length) { const j = 길.pop(); if (j === k0) return true; if (본.has(j)) continue; 본.add(j); 길.push(...가리킴(j)) } return false }
    for (const [k, 옛] of 바꾼) if (돎(k)) 셈[k] = 옛
  }
  /* 🩹 G382 — 아직 «그대로» 인 합계 줄이 바로 위 줄을 천 원 · 만 원 단위로 자른 것이면(「6. 시설공사 54,702,133」 → 「7. 시설공사 54,702,000」) 그 식으로 */
  for (const k of 빈) {
    if (셈[k].꼴 !== '그대로' || k === 0) continue
    const x = 원가.줄[k], y = 원가.줄[k - 1]
    if (!y || !y.금액 || !y.코드 || !(합계이름.test(원가꼴(x.이름)) || 원가꼴(x.이름) === 원가꼴(y.이름))) continue
    let 찾 = null
    for (const u of [10, 100, 1000, 10000]) for (const m of ['버림', '반올림', '올림']) if (!찾 && Math.abs(둥값(y.금액, { 단위: u, 둥글기: m }) - x.금액) < 0.5) 찾 = { u, m }
    if (찾) { const 옛 = 셈[k]; 셈[k] = { ...옛, 꼴: '식', 식: { op: '코드', v: y.코드 }, 둥글기: 찾.m, 단위: 찾.u, 조정: 0, 소계: true }; 바꾼.push([k, 옛]) }
  }
  /* 다시 셈 검산 — 원 단위까지 같지 않은 줄은 되돌림(몇 바퀴: 되돌린 줄을 바탕으로 쓰던 줄이 다시 맞을 수 있음) */
  /* 🩹 G382 — 끝수 없이(그대로) 맞춰 본 합 줄이 원 미만 끝수 때문에 안 맞으면(「순공사원가 59,551,924」 = 59,551,924.551 버림) 버림 · 반올림으로 한 번씩 더 맞춰 본 뒤에 되돌림 */
  const 둥후보 = ['버림', '반올림'], 시도 = new Map()
  for (let 바퀴 = 0; 바퀴 < 7; 바퀴++) {
    const v = 당초다시(원가, 맞춘, 내역)
    const 틀린 = 바꾼.filter(([k]) => 셈[k].꼴 === '식' && Math.abs((v[k] || 0) - (원가.줄[k].금액 || 0)) >= 0.5)
    if (!틀린.length) break
    for (const [k, 옛] of 틀린) {
      const 금 = 원가.줄[k].금액 || 0, 정수 = Math.abs(금 - Math.round(금)) < 1e-6
      const n = 시도.has(k) ? 시도.get(k) + 1 : 0
      if (정수 && (셈[k].단위 || 1) === 1 && (시도.has(k) || 셈[k].둥글기 === '그대로') && n < 둥후보.length) { 셈[k] = { ...셈[k], 둥글기: 둥후보[n] }; 시도.set(k, n) }
      else 셈[k] = 옛
    }
  }
  const 남은 = 바꾼.filter(([k]) => 셈[k].꼴 === '식')
  if (!남은.length) return
  const 이름들 = 비목이름들(원가, 맞춘)
  const 코k = new Map(셈.map((x, k) => [x.코드, k]))
  for (const [k] of 남은) 셈[k].배움 = 식글(셈[k].식, (c) => (코k.has(c) ? 이름들[코k.get(c)] : c)) + (셈[k].단위 > 1 ? ` (${셈[k].단위.toLocaleString('ko-KR')}원 미만 ${셈[k].둥글기})` : '')
  /* «산출근거가 없어 당초 금액 그대로» 말 → 지움 · 대신 한 줄로 */
  const 바꾼이름 = new Set(남은.map(([k]) => 원가.줄[k].이름))
  맞춘.말 = 말.filter((m) => !(/당초 금액 그대로 둡니다|산출근거\(.*\)로 당초 금액이 안 나옵니다/.test(m.무엇) && [...바꾼이름].some((n) => m.무엇.includes('«' + n + '»'))))
  맞춘.말.push({ 무게: '참고', 무엇: `산출근거가 없거나 이름으로 적힌 ${남은.length}줄은 금액으로 식을 찾았습니다(당초 금액과 원 단위까지 같음) — ` + 남은.slice(0, 4).map(([k]) => `${이름들[k]} = ${셈[k].배움}`).join(' · ') + (남은.length > 4 ? ' …' : ''), 배움: 남은.map(([k]) => ({ 이름: 이름들[k], 식: 셈[k].배움 })) })
}
const 더하는곳 = (n, 밖 = []) => { if (!n) return 밖; if (n.op === '코드') 밖.push(n.v); if (n.op === '합') 밖.push(...n.코드들); 더하는곳(n.a, 밖); 더하는곳(n.b, 밖); return 밖 }

/* ═══════════════════════════ 고정 금액 보험료 · 산안비 — 대상액 비율로 조정 (G296) ═══════════════════════════
 * 소장님: 엑셀 추가기능 «4대보험 고정비 ↔ 요율 · 조정계산서» 를 «우리 방식으로» — 계약 때 고정 금액(사후정산 고지 금액)으로 적힌 줄은
 *   설계변경 · 기성 때 «대상액 증감 비율» 만큼 따라 움직임: 변경 = 당초 + 당초 × (변경 대상액 − 당초 대상액) ÷ 당초 대상액(원 미만 버림)
 *   대상액: 건강 · 연금 · 퇴직공제 = 직접노무비 · 노인장기요양 = 건강보험료 · 산재 · 고용 = 직접노무비 + 간접노무비 · 산업안전보건관리비 = 재료비 + 직접노무비
 *   · 환경보전비 = 직접재료비 + 직접노무비 + 산출경비. 산출근거 식이 있는 줄은 그 식 그대로(요율로 다시 셈).
 */
const 대상규칙 = [
  { 이름: /건강보험/, 대상: ['직접노무비'] },
  { 이름: /연금보험/, 대상: ['직접노무비'] },
  { 이름: /퇴직공제/, 대상: ['직접노무비'] },
  { 이름: /노인장기|장기요양/, 대상: ['건강보험료'] },
  { 이름: /산재보험|산업재해|고용보험/, 대상: ['노무비'] },
  { 이름: /산업안전보건관리비|^안전관리비$/, 대상: ['재료비', '직접노무비'] },
  { 이름: /환경보전비|환경관리비/, 대상: ['재료비', '직접노무비', '산출경비'] },
  /* 🩹 G382 — 천 원 · 만 원 단위로 맞춘(조정한) 원가계산서의 간접노무비 · 기타경비도 식을 못 찾으면 대상액 비율로(전엔 «그대로» — 실측) */
  { 이름: /^간접노무비$/, 대상: ['직접노무비'] },
  { 이름: /^기타경비$/, 대상: ['재료비', '노무비'] },
]
/** 대상 비목 → 코드들(없으면 null) — 재료비 · 노무비는 소계 줄, 없으면 직접 + 간접 */
const 비목찾기 = (원가, 말) => {
  /* 🩹 G382 — 「마. 건강보험료」 · 「가-1. 직접노무비」 처럼 머리 기호가 붙은 이름도(이름꼴) */
  const 찾 = (re) => { const x = 원가.줄.find((y) => re.test(붙(이름꼴(y.이름)).replace(/[[\]()]/g, '')) && y.금액 !== null); return x ? x.코드 : null }
  const 소계 = (갈) => {
    /* 「[소계]」 처럼 이름만으론 모르는 소계 — 바로 위 줄들에 그 갈래 직접비가 든 첫 소계 */
    const k0 = 원가.줄.findIndex((y) => new RegExp('^직접' + 갈).test(붙(y.이름)))
    if (k0 < 0) return null
    for (let k = k0 + 1; k < 원가.줄.length; k++) { const t = 붙(원가.줄[k].이름).replace(/[[\]()]/g, ''); if (/^(소계|계|합계)$/.test(t) || new RegExp('^' + 갈 + '(소계|계)?$').test(t)) return 원가.줄[k].금액 !== null ? 원가.줄[k].코드 : null; if (/^직접/.test(t) && k > k0) break }
    return null
  }
  if (말 === '재료비') { const c = 찾(/^재료비(소계|계)?$/) || 소계('재료비'); if (c) return [c]; const a = 찾(/^직접재료비/), b = 찾(/^간접재료비/); return a ? [a, ...(b ? [b] : [])] : null }
  if (말 === '노무비') { const c = 찾(/^노무비(소계|계)?$/) || 소계('노무비'); if (c) return [c]; const a = 찾(/^직접노무비/), b = 찾(/^간접노무비/); return a ? [a, ...(b ? [b] : [])] : null }
  /*   직접노무비 줄이 없고 「노무비」 줄 + 따로 적힌 「간접노무비」 줄이면 그 「노무비」 가 직접노무비(실측: 간접노무비를 경비 쪽에 적은 표) */
  if (말 === '직접노무비') { const c = 찾(/^직접노무비/) || (찾(/^간접노무비$/) ? 찾(/^노무비$/) : null); return c ? [c] : null }
  if (말 === '산출경비') { const c = 찾(/^(산출경비|직접경비|기계경비)/); return c ? [c] : [] }
  if (말 === '건강보험료') { const c = 찾(/건강보험/); return c ? [c] : null }
  return null
}
/** «그대로»(산출근거 · 배운 식 모두 없음)인 보험료 · 산안비 · 환경보전비 줄 → 꼴 «비율»(대상 코드들) — 맞춘을 고칩니다 */
export function 고정비맞춤(원가, 맞춘) {
  if (!원가 || !맞춘) return []
  const 바꾼 = []
  맞춘.셈.forEach((s, k) => {
    if (s.꼴 !== '그대로' || !s.당초) return
    const 이 = 붙(이름꼴(원가.줄[k].이름)).replace(/[[\]()]/g, '')
    const 규 = 대상규칙.find((r) => r.이름.test(이))
    if (!규) return
    const 묶 = 규.대상.map((m) => 비목찾기(원가, m))
    if (묶.some((c) => c === null)) return
    const 코드들 = 묶.flat()
    if (!코드들.length || 코드들.includes(s.코드)) return
    맞춘.셈[k] = { ...s, 꼴: '비율', 대상: 코드들, 대상이름: 규.대상 }
    바꾼.push(k)
  })
  if (바꾼.length) {
    const 이름들 = 바꾼.map((k) => '«' + 원가.줄[k].이름 + '»')
    맞춘.말 = 맞춘.말.filter((m) => !(/당초 금액 그대로 둡니다/.test(m.무엇) && 이름들.some((n) => m.무엇.includes(n))))
  }
  if (바꾼.length) 맞춘.말.push({ 무게: '참고', 무엇: `고정 금액 ${바꾼.length}줄(${바꾼.map((k) => 붙(원가.줄[k].이름)).join(' · ')})은 «대상액 증감 비율» 로 조정합니다 — 변경 = 당초 + 당초 × (변경 대상액 − 당초 대상액) ÷ 당초 대상액 · 근거는 조정계산서 시트`, 고정비: true })
  return 바꾼
}
/** 고정비 조정을 끈 맞춘(«비율» → «그대로») */
export function 고정비끔(맞춘) {
  if (!맞춘 || !고정비있나(맞춘)) return 맞춘
  return {
    ...맞춘, 셈: 맞춘.셈.map((s) => (s.꼴 === '비율' ? { ...s, 꼴: '그대로' } : s)), 말: 맞춘.말.filter((m) => !m.고정비 && !/고정 금액 \d+줄/.test(m.무엇)),
    ...(맞춘.분야 ? { 분야: 맞춘.분야.map((f) => ({ ...f, 맞춘: 고정비끔(f.맞춘) })) } : {}),
  }
}
/** «비율»(고정 금액 조정) 줄 이름들 — 나열형이면 분야를 모두 봄 */
export function 고정비줄(맞춘) {
  if (!맞춘) return []
  const 이름 = new Set()
  const 봄 = (m) => m.셈.forEach((s) => { if (s.꼴 === '비율') 이름.add(붙(s.이름)) })
  if (맞춘.분야) 맞춘.분야.forEach((f) => 봄(f.맞춘)); else 봄(맞춘)
  return [...이름]
}
const 고정비있나 = (m) => m.셈.some((s) => s.꼴 === '비율') || (m.분야 || []).some((f) => 고정비있나(f.맞춘))

/**
 * 변경 값 셈
 * @param 맞춘    원가맞추기() 결과
 * @param 원가    원가읽기() 결과
 * @param 변경내역 { 순: {갈래}, 공종합: Map(i → {갈래}) } — «변경» 쪽
 * @param 전기준  «비율» 줄의 설계변경 전 값(줄마다) — 없으면 당초(직전 차수 기준이면 그 차수 셈)
 * @returns {Map 코드 → 변경 금액, 줄별: [변경 금액]}
 */
export function 원가변경셈(맞춘, 원가, 변경내역, 전기준 = null) {
  if (맞춘.분야) return 분야변경셈(맞춘, 변경내역, 전기준)
  if (전기준 && !Array.isArray(전기준)) 전기준 = 전기준.줄값 || null
  const { 셈, 코드차례 } = 맞춘
  const 값 = new Map()
  const 줄값 = 셈.map(() => undefined)
  const 기준 = (g) => (g && typeof g === 'object' ? (g.합계 ?? ((g.재료비 || 0) + (g.노무비 || 0) + (g.경비 || 0))) : 0)
  셈.forEach((s, k) => {
    let v
    if (s.꼴 === '공종') v = 둥값(공종목록(s).reduce((a, i) => a + 기준(변경내역.공종합.get(i)), 0) + (s.덧 || 0), s)
    else if (s.꼴 === '나머지') {
      v = (변경내역.순[s.갈래] || 0)
      for (const i of s.뺀) v -= ((변경내역.공종합.get(i) || {})[s.갈래]) || 0
      v = v - s.덜 + s.차이
    } else if (s.꼴 === '그대로') v = s.당초
    else if (s.꼴 === '빈칸') v = null
    if (v !== undefined) { 줄값[k] = v; if (s.코드) 값.set(s.코드, v) }
  })
  /* «비율» 줄의 기준(설계변경 전) — 기본은 당초 · 직전 차수 기준이면 그 차수 값(기준[k]) */
  const 전값 = (k) => (전기준 ? 전기준[k] : (셈[k].계약당초 ?? 셈[k].당초)) || 0
  const 당초값 = new Map(셈.map((s, k) => [s.코드, 전값(k)]).filter(([c]) => c))
  for (let 바퀴 = 0; 바퀴 < 60; 바퀴++) {
    let 더 = false
    셈.forEach((s, k) => {
      if (s.꼴 === '비율' && 줄값[k] === undefined) {
        if (!s.대상.every((c) => 값.has(c))) return
        const 새 = s.대상.reduce((a, c) => a + (값.get(c) || 0), 0), 옛 = s.대상.reduce((a, c) => a + (당초값.get(c) || 0), 0)
        const 전 = 전값(k)
        const w = 옛 ? 전 + 둥글기.버림(전 * (새 - 옛) / 옛) : 전
        줄값[k] = w
        if (s.코드) 값.set(s.코드, w)
        더 = true
        return
      }
      if (s.꼴 !== '식' || 줄값[k] !== undefined) return
      const v = 식셈(s.식, (c) => (값.has(c) ? 값.get(c) : (코드차례.includes(c) ? undefined : 0)), 코드차례)
      if (v === undefined) return
      const w = 둥값(v, s) + (s.조정 || 0)
      줄값[k] = w
      if (s.코드) 값.set(s.코드, w)
      더 = true
    })
    if (!더) break
  }
  셈.forEach((s, k) => { if (줄값[k] === undefined) 줄값[k] = s.당초 })
  return { 값, 줄값 }
}

/** 나열형 — 분야마다 셈해 더함 · 돌려줌에 분야줄값(다음 차수의 전기준) */
function 분야변경셈(맞춘, 변경내역, 전기준) {
  const 전분 = 전기준 && !Array.isArray(전기준) ? 전기준.분야줄값 || null : null
  const 갈 = ['재료비', '노무비', '경비', '합계']
  const 분야줄값 = 맞춘.분야.map((f, n) => {
    const 전 = 전분 ? 전분[n] : null
    if (f.꼴 === '밖') return f.맞춘.셈.map((s, k) => (전 ? 전[k] : s.당초))
    let 순
    if (f.꼴 === '전체') 순 = 변경내역.순
    else if (f.꼴 === '공종') {
      순 = { ...(변경내역.공종합.get(f.공종) || {}) }
      for (const i of f.덧 || []) { const g = 변경내역.공종합.get(i) || {}; for (const k of 갈) if (순[k] !== undefined || g[k] !== undefined) 순[k] = (순[k] || 0) + (g[k] || 0) }
    } else {
      순 = { ...(변경내역.순 || {}) }
      for (const i of f.뺄) { const g = 변경내역.공종합.get(i) || {}; for (const k of 갈) if (순[k] !== undefined || g[k] !== undefined) 순[k] = (순[k] || 0) - (g[k] || 0) }
    }
    return 원가변경셈(f.맞춘, f.원가, { 순, 공종합: 변경내역.공종합 }, 전).줄값
  })
  const 줄값 = 맞춘.셈.map((s, k) => {
    const vs = 분야줄값.map((a) => a[k])
    if (vs.every((v) => v === null || v === undefined)) return s.꼴 === '빈칸' ? null : s.당초
    return vs.reduce((a, v) => a + (v || 0), 0)
  })
  return { 값: new Map(맞춘.셈.map((s, k) => [s.코드, 줄값[k]])), 줄값, 분야줄값 }
}

/**
 * 변경 원가계산서 시트 (변경엑셀쓰기 꼴) — 줄마다 당초(위) · 변경(아래 · 붉게) 두 줄 · 원 서식의 칸 차례(비목 · 구분 · 금액 · 요율 · 산출근거)
 * @param 칸링크 { 순(갈래) → 엑셀 주소, 공종(i, 갈래|'합계') → 엑셀 주소 } — 변경내역서 시트의 «변경» 줄 칸
 */
export function 원가시트(원가, 맞춘, 변경, { 칸링크 = null, 부제 = '', 색 = null } = {}) {
  const 고색 = 색맞춤(색)
  const 위칠 = (꼴) => 색꼴(꼴, 고색.위 === '빨'), 아래칠 = (꼴) => 색꼴(꼴, 고색.아래 === '빨')
  const { 셈, 코드차례 } = 맞춘
  const 행 = new Map()                  /* 코드 → 변경 줄 엑셀 행 */
  const 첫 = 4                          /* 제목(1) · 부제(2) · 머리(3) 다음 */
  셈.forEach((s, k) => { if (s.코드) 행.set(s.코드, 첫 + k * 2 + 1) })
  const 칸 = (c) => (행.has(c) ? 'C' + 행.get(c) : '0')
  const 줄들 = []
  셈.forEach((s, k) => {
    const x = 원가.줄[k]
    const R당 = 첫 + k * 2, R변 = R당 + 1
    const 율있음 = x.율 !== null && x.율 !== undefined
    const 율글 = 율있음 ? { v: x.율, s: 위칠(율꼴(x.율) + '_위') } : { v: '', s: '글_위' }
    const 이름 = { v: x.이름, s: 위칠(s.소계 || /^[A-Z]$/.test(x.표시코드 ?? s.코드 ?? '') ? '글굵_위' : '글_위') }
    줄들.push([이름, { v: x.표시코드 ?? s.코드 ?? '', s: 위칠('글가_위') }, { v: s.당초 ?? '', s: 위칠('금' + (s.소계 ? '굵' : '') + '_위') }, 율글,
      { v: x.근거 || '', s: 위칠('글_위') }, { v: '', s: '글_위' }])
    let f = null
    const v = 변경.줄값[k]
    if (s.꼴 === '식') f = 둥식(식엑셀(s.식, 칸, 코드차례), s) + (s.조정 ? (s.조정 > 0 ? '+' : '') + s.조정 : '')
    else if (s.꼴 === '공종' && 칸링크) f = 둥식(공종목록(s).map((i) => 칸링크.공종(i, '합계')).join('+') + (s.덧 ? (s.덧 > 0 ? '+' : '') + s.덧 : ''), s)
    else if (s.꼴 === '나머지' && 칸링크) {
      f = 칸링크.순(s.갈래) + s.뺀.map((i) => '-' + 칸링크.공종(i, s.갈래)).join('') + (s.덜 ? '-' + s.덜 : '') + (s.차이 ? (s.차이 > 0 ? '+' : '') + s.차이 : '')
    } else if (s.꼴 === '비율') {
      const 새 = s.대상.map((c) => 칸(c)).join('+'), 옛 = s.대상.map((c) => (행.has(c) ? 'C' + (행.get(c) - 1) : '0')).join('+')
      f = `C${R당}+IF((${옛})=0,0,ROUNDDOWN(C${R당}*((${새})-(${옛}))/(${옛}),0))`
    } else if (s.꼴 === '그대로') f = 'C' + R당
    const 금칸 = v === null ? { v: '', s: '금빨_아래' } : f ? { f, v, s: 아래칠('금' + (s.소계 ? '굵' : '') + '빨_아래') } : { v, s: 아래칠('금빨_아래') }
    const 증 = v === null && (s.당초 === null || s.당초 === undefined) ? { v: '', s: '글_아래' } : { f: `C${R변}-C${R당}`, v: (v || 0) - (s.당초 || 0), s: '금파_아래' }
    const 표 = 출처글(s)
    줄들.push([{ v: '', s: '글_아래' }, { v: '', s: '글_아래' }, 금칸, 율있음 ? { v: x.율, s: 아래칠(율꼴(x.율) + '_아래') } : { v: '', s: '글_아래' },
      { v: 표 || x.근거 || '', s: (표 ? '글흐림_아래' : '글_아래') }, 증])
  })
  return {
    이름: '변경원가계산서', 제목: '원 가 계 산 서 (변 경)', 부제: 부제 || `위 = 당초${고색.위 === '빨' ? '(붉게)' : ''} · 아래${고색.아래 === '빨' ? '(붉게)' : ''} = 변경 · 원 요율 그대로(국가계약법 시행령 제65조⑥)`,
    너비: [30, 7, 18, 9, 40, 16], 머리: [['비            목', '구분', '금    액', '요율', '산   출   근   거', '증    감']], 줄: 줄들, 세로: true,
  }
}

/** 셈 줄의 «어디서 왔나» 글(변경원가계산서 산출근거 칸 아래 줄) */
const 출처글 = (s) => (s.꼴 === '공종' ? `= 변경내역서 «${s.공종이름}»` + (s.덧 ? ` ${s.덧 > 0 ? '+' : '−'} ${Math.round(Math.abs(s.덧)).toLocaleString('ko-KR')}(원본 적힌 합과 차이)` : '') : s.꼴 === '나머지' ? `= 변경내역서 ${s.갈래}` + (s.뺀.length ? ' − 따로 잡은 공종' : '') : s.꼴 === '그대로' ? '당초 그대로' : s.꼴 === '비율' ? `당초 × (1 + ${s.대상이름.join(' + ')} 증감 비율) — 조정계산서` : s.꼴 === '식' && s.배움 ? '= ' + s.배움 : '')

/**
 * 나열형 변경 원가계산서 (G296) — 비목 · 구분 · 분야마다(건축 · 토목 · 기계 …) · 합계 · 요율 · 산출근거 · 증감
 *   분야 칸은 분야마다 셈한 값 · 합계 = 분야 칸 더하기(식) · 증감 = 합계 변경 − 당초(식)
 * @param 당초 원가변경셈 결과(직전 차수 기준일 때) 또는 null(당초 = 계약)
 */
export function 원가시트나열(원가, 맞춘, 변경, { 부제 = '', 색 = null, 당초 = null } = {}) {
  const 고색 = 색맞춤(색)
  const 위칠 = (꼴) => 색꼴(꼴, 고색.위 === '빨'), 아래칠 = (꼴) => 색꼴(꼴, 고색.아래 === '빨')
  const 분 = 맞춘.분야, n = 분.length
  const 첫 = 4
  const 열 = (j) => 열이름(3 + j)                 /* C 부터 분야 · 그다음 합계 */
  const 합열 = 열(n), 증열 = 열이름(3 + n + 3)
  const 전분 = (f, k, m) => (당초 && 당초.분야줄값 ? 당초.분야줄값[m][k] : f.맞춘.셈[k].당초)
  const 줄들 = []
  맞춘.셈.forEach((s, k) => {
    const x = 원가.줄[k]
    const R당 = 첫 + k * 2, R변 = R당 + 1
    const 굵 = s.소계 || 분.some((f) => f.맞춘.셈[k].소계) || /^[A-Z]$/.test(x.표시코드 ?? '')
    const 율있음 = x.율 !== null && x.율 !== undefined
    const 전합 = 당초 ? 당초.줄값[k] : s.당초, 후합 = 변경.줄값[k]
    const 빈 = (전합 === null || 전합 === undefined) && (후합 === null || 후합 === undefined)
    const 값칸 = (v, 쪽) => (v === null || v === undefined ? { v: '', s: 쪽 === '위' ? '글_위' : '글_아래' } : { v, s: (쪽 === '위' ? 위칠 : 아래칠)('금' + (굵 ? '굵' : '') + (쪽 === '아래' ? '빨' : '') + '_' + 쪽) })
    const 합칸 = (R, v, 쪽) => (빈 ? { v: '', s: 쪽 === '위' ? '글_위' : '글_아래' } : { f: `SUM(${열(0)}${R}:${열(n - 1)}${R})`, v: v || 0, s: (쪽 === '위' ? 위칠 : 아래칠)('금' + (굵 ? '굵' : '') + (쪽 === '아래' ? '빨' : '') + '_' + 쪽) })
    줄들.push([
      { v: x.이름, s: 위칠(굵 ? '글굵_위' : '글_위') }, { v: x.표시코드 ?? '', s: 위칠('글가_위') },
      ...분.map((f, m) => 값칸(전분(f, k, m), '위')), 합칸(R당, 전합, '위'),
      율있음 ? { v: x.율, s: 위칠(율꼴(x.율) + '_위') } : { v: '', s: '글_위' }, { v: x.근거 || '', s: 위칠('글_위') }, { v: '', s: '글_위' },
    ])
    const 쓴 = 분.find((f) => f.꼴 !== '밖' && f.맞춘.셈[k].꼴 && f.맞춘.셈[k].꼴 !== '빈칸')
    const 표 = 쓴 ? 출처글(쓴.맞춘.셈[k]) : ''
    줄들.push([
      { v: '', s: '글_아래' }, { v: '', s: '글_아래' },
      ...분.map((f, m) => 값칸(변경.분야줄값[m][k], '아래')), 합칸(R변, 후합, '아래'),
      율있음 ? { v: x.율, s: 아래칠(율꼴(x.율) + '_아래') } : { v: '', s: '글_아래' }, { v: 표, s: '글흐림_아래' },
      빈 ? { v: '', s: '글_아래' } : { f: `${합열}${R변}-${합열}${R당}`, v: (후합 || 0) - (전합 || 0), s: '금파_아래' },
    ])
  })
  return {
    이름: '변경원가계산서', 제목: '원 가 계 산 서 (변 경 · 나 열 형)', _합열: 합열, _증열: 증열,
    부제: 부제 || `위 = 당초 · 아래 = 변경 · 분야(${분.map((f) => f.이름).join(' · ')})마다 따로 셈 · 합계 = 분야 합 · 원 요율 그대로(국가계약법 시행령 제65조⑥)`,
    너비: [28, 6, ...분.map(() => 16), 17, 8, 34, 15], 머리: [['비            목', '구분', ...분.map((f) => f.이름), '합    계', '요율', '산   출   근   거', '증    감']], 줄: 줄들, 세로: true,
  }
}
const 열이름 = (n) => { let t = ''; while (n > 0) { const r = (n - 1) % 26; t = String.fromCharCode(65 + r) + t; n = ((n - r) / 26) | 0 } return t }

/* ═══════════════════════════ 보험료 · 안전관리비 조정계산서 (G296) ═══════════════════════════
 * 소장님: 엑셀 추가기능의 «4대보험 조정계산서» 를 우리 방식으로 — 따로 넣을 것 없이 변경원가계산서에서 저절로.
 *   줄: 산재 · 고용 · 건강 · 연금 · 노인장기요양 · 퇴직공제 · 산업안전보건관리비 · 환경보전비
 *   칸: 비목 · 대상액 · 설계변경 전 대상액 · 후 대상액 · 대상액 증감 비율 · 전 금액 · 증감액 · 후 금액 · 셈 방법
 *   값은 변경원가계산서 칸을 그대로 이어(식) — 원가계산서를 고치면 같이 바뀝니다.
 *   «비율»(고정 금액) 줄: 후 = 전 + 전 × 증감 비율(원 미만 버림) · «식» 줄: 후 대상액 × 원 요율.
 */
const 조정이름 = /산재보험|산업재해|고용보험|건강보험|연금보험|노인장기|장기요양|퇴직공제|산업안전보건관리비|^안전관리비$|환경보전비|환경관리비/
/** 원가 줄 보이는 이름 — «소계 · [소계]» 는 무엇의 소계인지(재료비 · 노무비 · 경비) 붙임 */
export function 비목이름들(원가, 맞춘) {
  const 맨 = (x) => 붙(x.이름).replace(/[[\]()]/g, '')
  return 원가.줄.map((x, k) => {
    const t = 맨(x)
    if (!/^(소계|계|합계)$/.test(t)) return t
    const s = 맞춘 && 맞춘.셈[k]
    const 든 = s && s.식 ? 더하는곳(s.식).map((c) => { const y = 원가.줄.find((z) => z.코드 === c); return y ? 맨(y) : '' }) : []
    if (든.some((n) => /^직접재료비/.test(n))) return '재료비 ' + t
    if (든.some((n) => /^(직접|간접)노무비/.test(n))) return '노무비 ' + t
    if (든.some((n) => /보험료|경비|관리비/.test(n))) return '경비 ' + t
    return t
  })
}
function 곱나눔(n) {
  if (n && n.op === '*') {
    if (n.b && n.b.op === '수') return { 대상: n.a, 율: n.b.v }
    if (n.a && n.a.op === '수') return { 대상: n.b, 율: n.a.v }
  }
  return null
}
/**
 * @param 전줄값 · 후줄값  원가 줄마다 설계변경 전 · 후 값(원가변경셈 줄값)
 * @param 원가칸 { 시트: 변경원가계산서 이름, 전행(k), 후행(k) } — 있으면 그 칸을 식으로 이음
 * @returns 시트 또는 null(조정할 줄 없음)
 */
export function 조정계산시트(원가, 맞춘, 전줄값, 후줄값, { 원가칸 = null, 부제 = '' } = {}) {
  if (!원가 || !맞춘) return null
  const 이름들 = 비목이름들(원가, 맞춘)
  const 코k = new Map(맞춘.셈.map((s, k) => [s.코드, k]))
  const 이름of = (c) => (코k.has(c) ? 이름들[코k.get(c)] : c)
  const 시 = 원가칸 ? 따옴표(원가칸.시트) : null
  const 금열 = (원가칸 && 원가칸.열) || 'C'
  const 칸 = (c, 쪽) => (코k.has(c) && 시 ? `${시}!${금열}${쪽 === '전' ? 원가칸.전행(코k.get(c)) : 원가칸.후행(코k.get(c))}` : '0')
  const 나열 = !!맞춘.분야
  const 첫 = 4
  const 줄들 = []
  맞춘.셈.forEach((s0, k) => {
    if (!조정이름.test(붙(원가.줄[k].이름))) return
    /* 나열형 — 셈 꼴은 분야(이 내역에 든 첫 분야)의 것 */
    const 쓴 = 나열 ? 맞춘.분야.find((f) => f.꼴 !== '밖') : null
    const s = 쓴 ? 쓴.맞춘.셈[k] : s0
    if (s.꼴 !== '비율' && s.꼴 !== '식') return
    const 전 = 전줄값[k], 후 = 후줄값[k]
    if ((전 === null || 전 === undefined) && (후 === null || 후 === undefined)) return
    const R = 첫 + 줄들.length
    let 대상 = null, 대상글 = '', 방법 = '', 율 = null
    if (s.꼴 === '비율') {
      대상 = { 코드들: s.대상 }
      대상글 = s.대상.map(이름of).join(' + ')
      방법 = '고정 금액 — 전 + 전 × 증감 비율(원 미만 버림)'
    } else {
      const g = 곱나눔(s.식)
      if (g) { 대상 = { 식: g.대상 }; 율 = g.율; 대상글 = 식글(g.대상, 이름of); 방법 = `후 대상액 × ${+(g.율 * 100).toFixed(4)}% (원 요율)` + (s.단위 > 1 ? ` · ${s.단위.toLocaleString('ko-KR')}원 미만 ${s.둥글기}` : '') } else { 방법 = '산출근거 식 그대로 — ' + (원가.줄[k].근거 || s.배움 || '') }
    }
    const 셈값 = (줄값) => {
      if (!대상) return null
      const 값 = (c) => (코k.has(c) ? 줄값[코k.get(c)] ?? 0 : 0)
      if (대상.코드들) return 대상.코드들.reduce((a, c) => a + (값(c) || 0), 0)
      const v = 식셈(대상.식, (c) => (코k.has(c) ? (값(c) || 0) : 0), 맞춘.코드차례)
      return v === undefined ? null : v
    }
    const 전대 = 셈값(전줄값), 후대 = 셈값(후줄값)
    const 대식 = (쪽) => (대상 && 시 ? (대상.코드들 ? 대상.코드들.map((c) => 칸(c, 쪽)).join('+') : 식엑셀(대상.식, (c) => 칸(c, 쪽), 맞춘.코드차례)) : null)
    const 수칸 = (v, f) => (v === null || v === undefined ? { v: '', s: '글' } : f ? { f, v, s: '금' } : { v, s: '금' })
    줄들.push([
      { v: 이름들[k], s: '글' },
      { v: 대상글, s: '글감' },
      수칸(전대, 대식('전')), 수칸(후대, 대식('후')),
      전대 === null ? { v: '', s: '글' } : { f: `IF(C${R}=0,0,(D${R}-C${R})/C${R})`, v: 전대 ? (후대 - 전대) / 전대 : 0, s: '율4' },
      수칸(전, 시 ? `${시}!${금열}${원가칸.전행(k)}` : null),
      { f: `H${R}-F${R}`, v: (후 || 0) - (전 || 0), s: '금파' },
      수칸(후, 시 ? `${시}!${금열}${원가칸.후행(k)}` : null),
      { v: 방법 + (나열 ? ' · 분야마다 셈해 더함' : ''), s: '글흐림' },
    ])
  })
  if (!줄들.length) return null
  const R0 = 첫, R1 = 첫 + 줄들.length - 1
  줄들.push([{ v: '계', s: '글굵' }, { v: '', s: '글' }, { v: '', s: '글' }, { v: '', s: '글' }, { v: '', s: '글' },
    { f: `SUM(F${R0}:F${R1})`, v: 줄들.reduce((a, r) => a + (Number(r[5].v) || 0), 0), s: '금굵' },
    { f: `SUM(G${R0}:G${R1})`, v: 줄들.reduce((a, r) => a + (Number(r[6].v) || 0), 0), s: '금굵파' },
    { f: `SUM(H${R0}:H${R1})`, v: 줄들.reduce((a, r) => a + (Number(r[7].v) || 0), 0), s: '금굵' }, { v: '', s: '글' }])
  return {
    이름: '조정계산서', 제목: '보 험 료 · 안 전 관 리 비  조 정 계 산 서', 부제: 부제 || '대상액 증감 비율 = (설계변경 후 대상액 − 설계변경 전 대상액) ÷ 설계변경 전 대상액',
    너비: [20, 26, 16, 16, 11, 15, 14, 15, 36], 머리: [['비          목', '대 상 액', '설계변경 전 대상액', '설계변경 후 대상액', '증감 비율', '설계변경 전 금액', '증 감 액', '설계변경 후 금액', '셈  방  법']], 줄: 줄들, 세로: false,
  }
}
const 따옴표 = (n) => (/^[A-Za-z0-9_]+$/.test(n) ? n : "'" + String(n).replace(/'/g, "''") + "'")

