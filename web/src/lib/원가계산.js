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
  return i >= 0 && j >= i ? 코드차례.slice(i, j + 1) : []
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
  그대로: (v) => v,
}
const 둥글식 = { 버림: (e) => `ROUNDDOWN(${e},0)`, 반올림: (e) => `ROUND(${e},0)`, 그대로: (e) => e }

/* ═══════════════════════════ 원가계산서 읽기 ═══════════════════════════ */

/** 원가계산서처럼 생긴 시트 찾기 — 이름에 «원가계산» (가로 · 총괄 · 집계는 뒤로) */
export function 원가시트찾기(책) {
  const 이름들 = Object.keys(책)
  const 후보 = 이름들.filter((n) => /원가\s*계산/.test(n))
  후보.sort((a, b) => (/가로|총괄|집계|요약/.test(a) ? 1 : 0) - (/가로|총괄|집계|요약/.test(b) ? 1 : 0))
  for (const n of 후보) { const r = 원가읽기(책[n], n); if (r.줄.length >= 5) return r }
  return null
}

/**
 * 원가계산서 표 → { 시트, 줄:[{r, 이름, 코드, 금액, 율, 근거, 식}], 두줄 }
 *   두줄(변경 원가계산서 — 당초 · 변경이 위아래)이면 아래 줄(변경)을 «지금 값» 으로 읽습니다.
 */
export function 원가읽기(grid, 시트 = '원가계산서') {
  const N = (r) => (grid[r] || []).map(붙)
  let hi = -1
  for (let i = 0; i < Math.min(grid.length, 30); i++) {
    const c = N(i)
    if (c.some((x) => /^(비목|비목명|구분|항목)$/.test(x)) && c.some((x) => /^(금액|금액원|공사금액)$/.test(x))) { hi = i; break }
  }
  if (hi < 0) return { 시트, 줄: [], 까닭: '「비목 · 금액」 머리글을 못 찾았습니다' }
  const h = N(hi)
  const 금칸 = h.findIndex((x) => /^(금액|금액원|공사금액)$/.test(x))
  let 코칸 = h.findIndex((x, j) => /^구분$/.test(x) && j < 금칸)
  const 율칸 = h.findIndex((x) => /^(요율|율|비율|적용율|적용요율)$/.test(x))
  const 근칸 = h.findIndex((x) => /^(산출근거|산출내역|산식|계산근거|근거|비고)$/.test(x))
  /* 구분 머리가 없으면 금액 바로 왼쪽 칸이 코드처럼 쓰였는지 */
  if (코칸 < 0 && 금칸 > 0) {
    let n = 0
    for (let r = hi + 1; r < Math.min(grid.length, hi + 60); r++) if (코드꼴((grid[r] || [])[금칸 - 1])) n++
    if (n >= 5) 코칸 = 금칸 - 1
  }
  const 줄 = []
  let 앞 = null
  for (let r = hi + 1; r < grid.length; r++) {
    const row = grid[r] || []
    const 코 = 코칸 >= 0 ? 코드꼴(row[코칸]) : ''
    /* 이름: 코드 칸 왼쪽의 글 가운데 두 글자 넘는 것(세로로 쓴 «재 · 료 · 비» 같은 한 글자는 갈래 표시) */
    const 왼 = (코칸 >= 0 ? row.slice(0, 코칸) : row.slice(0, Math.max(0, 금칸))).map(글).filter((x) => 붙(x).length > 1 && !/^[\d.,]+$/.test(붙(x)))
    const 이름 = 왼.length ? 왼[왼.length - 1].replace(/\s+/g, ' ') : ''
    const 금 = 수(row[금칸])
    const 율 = 율칸 >= 0 ? 율읽기(row[율칸]) : null
    const 근 = 근칸 >= 0 ? 글(row[근칸]) : ''
    if (!코 && !이름 && 금 === null) continue
    if (코 || 이름) {
      앞 = { r: r + 1, 이름: 이름 || '', 코드: 코, 금액: 금, 율, 근거: 근, 값들: [금] }
      if (!이름 && 코) 앞.이름 = '(' + 코 + ')'
      줄.push(앞)
    } else if (앞 && 금 !== null) {
      앞.값들.push(금)                                  /* 두 줄짜리 — 아래 줄(변경) 값 */
      if (율 !== null && 앞.율 === null) 앞.율 = 율
      if (근 && !앞.근거) 앞.근거 = 근
    }
  }
  const 두줄 = 줄.filter((x) => x.값들.length > 1).length >= Math.max(3, 줄.length * 0.4)
  for (const x of 줄) x.금액 = x.값들[x.값들.length - 1]
  const 코드들 = new Set(줄.map((x) => x.코드).filter(Boolean))
  for (const x of 줄) x.식 = x.근거 ? 식읽기(x.근거, 코드들) : null
  const 끝 = 줄.findIndex((x) => /총공사비/.test(붙(x.이름)))
  const 쓸 = 끝 >= 0 ? 줄.slice(0, 끝 + 1) : 줄
  return { 시트, 줄: 쓸.filter((x) => x.코드 || x.금액 !== null), 두줄, 칸: { 코칸, 금칸, 율칸, 근칸 }, 머리줄: hi + 1 }
}

/* ═══════════════════════════ 맞춰 보기 ═══════════════════════════ */

const 갈래쪽 = (이름) => {
  const t = 붙(이름)
  if (/작업설|부산물/.test(t)) return ''
  if (/재료비/.test(t)) return '재료비'
  if (/직접노무비/.test(t)) return '노무비'
  if (/산출경비|직접경비/.test(t)) return '경비'
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
  const 줄 = 원가.줄
  const 코드차례 = 줄.map((x) => x.코드).filter(Boolean)
  const 말 = []
  const 기준 = (g) => (g && typeof g === 'object' ? (g.합계 ?? ((g.재료비 || 0) + (g.노무비 || 0) + (g.경비 || 0))) : 0)
  const 셈 = 줄.map((x) => ({ 코드: x.코드, 이름: x.이름, 당초: x.금액, 꼴: '' }))
  /* ── ① 바탕 금액: 식이 없는 줄 → 공종 합계와 같은가 ── */
  const 쓴공종 = new Set()
  줄.forEach((x, k) => {
    if (x.식 || x.금액 === null || x.금액 === 0) return
    let 찾 = null
    for (const p of 내역.공종들) {
      if (쓴공종.has(p.i) || p.깊이 === 0) continue
      if (Math.abs(기준(p.합) - x.금액) <= 2) { if (!찾 || p.깊이 < 찾.깊이) 찾 = p }
    }
    if (찾) { 쓴공종.add(찾.i); 셈[k] = { ...셈[k], 꼴: '공종', 공종: 찾.i, 공종이름: 찾.이름, 별도: !!찾.별도 } }
  })
  /* ── ② 재료 · 노무 · 경비 나머지 ── */
  for (const g of ['재료비', '노무비', '경비']) {
    const 남은 = 줄.map((x, k) => k).filter((k) => !셈[k].꼴 && !줄[k].식 && 갈래쪽(줄[k].이름) === g)
    if (!남은.length) continue
    let 나 = (내역.순[g] || 0)
    const 뺀 = []
    for (const s of 셈) if (s.꼴 === '공종' && !s.별도) { const p = 내역.공종들.find((q) => q.i === s.공종); 나 -= (p && p.합[g]) || 0; 뺀.push(s.공종) }
    const 있는 = 남은.filter((k) => (줄[k].금액 || 0) !== 0)
    const 합 = 있는.reduce((a, k) => a + 줄[k].금액, 0)
    let 고른 = 있는.find((k) => Math.abs(줄[k].금액 - 나) <= 2)
    let 맞음 = 고른 !== undefined
    if (!맞음 && 있는.length > 1 && Math.abs(합 - 나) <= 2) { 고른 = 있는.reduce((a, b) => (줄[b].금액 > 줄[a].금액 ? b : a)); 맞음 = true }
    if (고른 === undefined) 고른 = (있는.length ? 있는 : 남은).reduce((a, b) => ((줄[b].금액 || 0) > (줄[a].금액 || 0) ? b : a))
    const 덜 = 맞음 ? 있는.filter((k) => k !== 고른).reduce((a, k) => a + 줄[k].금액, 0) : 0
    셈[고른] = { ...셈[고른], 꼴: '나머지', 갈래: g, 뺀, 덜, 차이: 맞음 ? 0 : (줄[고른].금액 || 0) + 덜 - 나 }
    if (!맞음) 말.push({ 무게: '확인', 무엇: `원가계산서 «${줄[고른].이름}» 당초(${(줄[고른].금액 || 0).toLocaleString('ko-KR')})가 내역서 ${g} 합과 ${Math.round(셈[고른].차이).toLocaleString('ko-KR')}원 다릅니다 — 증감만 더했습니다` })
  }
  /* ── ③ 식 줄: 당초가 정말 그 식으로 나오나 ── */
  const 당초값 = (c) => { const x = 줄.find((y) => y.코드 === c); return x ? x.금액 : undefined }
  줄.forEach((x, k) => {
    if (셈[k].꼴) return
    if (!x.식) { 셈[k].꼴 = x.금액 === null ? '빈칸' : '그대로'; if (x.금액) 말.push({ 무게: '참고', 무엇: `«${x.이름}» 은 산출근거가 없어 당초 금액 그대로 둡니다` }); return }
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
      말.push({ 무게: '확인', 무엇: `«${x.이름}» 산출근거(${x.근거})로 당초 금액이 안 나옵니다 — 변경도 당초 금액 그대로 둡니다. 손으로 확인하십시오` })
    }
  })
  return { 셈, 말, 코드차례 }
}

/**
 * 변경 값 셈
 * @param 맞춘    원가맞추기() 결과
 * @param 원가    원가읽기() 결과
 * @param 변경내역 { 순: {갈래}, 공종합: Map(i → {갈래}) } — «변경» 쪽
 * @returns {Map 코드 → 변경 금액, 줄별: [변경 금액]}
 */
export function 원가변경셈(맞춘, 원가, 변경내역) {
  const { 셈, 코드차례 } = 맞춘
  const 값 = new Map()
  const 줄값 = 셈.map(() => undefined)
  const 기준 = (g) => (g && typeof g === 'object' ? (g.합계 ?? ((g.재료비 || 0) + (g.노무비 || 0) + (g.경비 || 0))) : 0)
  셈.forEach((s, k) => {
    let v
    if (s.꼴 === '공종') v = 기준(변경내역.공종합.get(s.공종))
    else if (s.꼴 === '나머지') {
      v = (변경내역.순[s.갈래] || 0)
      for (const i of s.뺀) v -= ((변경내역.공종합.get(i) || {})[s.갈래]) || 0
      v = v - s.덜 + s.차이
    } else if (s.꼴 === '그대로') v = s.당초
    else if (s.꼴 === '빈칸') v = null
    if (v !== undefined) { 줄값[k] = v; if (s.코드) 값.set(s.코드, v) }
  })
  for (let 바퀴 = 0; 바퀴 < 60; 바퀴++) {
    let 더 = false
    셈.forEach((s, k) => {
      if (s.꼴 !== '식' || 줄값[k] !== undefined) return
      const v = 식셈(s.식, (c) => (값.has(c) ? 값.get(c) : (코드차례.includes(c) ? undefined : 0)), 코드차례)
      if (v === undefined) return
      const w = 둥글기[s.둥글기](v) + (s.조정 || 0)
      줄값[k] = w
      if (s.코드) 값.set(s.코드, w)
      더 = true
    })
    if (!더) break
  }
  셈.forEach((s, k) => { if (줄값[k] === undefined) 줄값[k] = s.당초 })
  return { 값, 줄값 }
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
    const 이름 = { v: x.이름, s: 위칠(s.소계 || /^[A-Z]$/.test(s.코드 || '') ? '글굵_위' : '글_위') }
    줄들.push([이름, { v: s.코드 || '', s: 위칠('글가_위') }, { v: s.당초 ?? '', s: 위칠('금' + (s.소계 ? '굵' : '') + '_위') }, 율글,
      { v: x.근거 || '', s: 위칠('글_위') }, { v: '', s: '글_위' }])
    let f = null
    const v = 변경.줄값[k]
    if (s.꼴 === '식') f = 둥글식[s.둥글기](식엑셀(s.식, 칸, 코드차례)) + (s.조정 ? (s.조정 > 0 ? '+' : '') + s.조정 : '')
    else if (s.꼴 === '공종' && 칸링크) f = 칸링크.공종(s.공종, '합계')
    else if (s.꼴 === '나머지' && 칸링크) {
      f = 칸링크.순(s.갈래) + s.뺀.map((i) => '-' + 칸링크.공종(i, s.갈래)).join('') + (s.덜 ? '-' + s.덜 : '') + (s.차이 ? (s.차이 > 0 ? '+' : '') + s.차이 : '')
    } else if (s.꼴 === '그대로') f = 'C' + R당
    const 금칸 = v === null ? { v: '', s: '금빨_아래' } : f ? { f, v, s: 아래칠('금' + (s.소계 ? '굵' : '') + '빨_아래') } : { v, s: 아래칠('금빨_아래') }
    const 증 = v === null && (s.당초 === null || s.당초 === undefined) ? { v: '', s: '글_아래' } : { f: `C${R변}-C${R당}`, v: (v || 0) - (s.당초 || 0), s: '금파_아래' }
    const 표 = s.꼴 === '공종' ? `= 변경내역서 «${s.공종이름}»` : s.꼴 === '나머지' ? `= 변경내역서 ${s.갈래}` + (s.뺀.length ? ' − 따로 잡은 공종' : '') : s.꼴 === '그대로' ? '당초 그대로' : ''
    줄들.push([{ v: '', s: '글_아래' }, { v: '', s: '글_아래' }, 금칸, 율있음 ? { v: x.율, s: 아래칠(율꼴(x.율) + '_아래') } : { v: '', s: '글_아래' },
      { v: 표 || x.근거 || '', s: (표 ? '글흐림_아래' : '글_아래') }, 증])
  })
  return {
    이름: '변경원가계산서', 제목: '원 가 계 산 서 (변 경)', 부제: 부제 || `위 = 당초${고색.위 === '빨' ? '(붉게)' : ''} · 아래${고색.아래 === '빨' ? '(붉게)' : ''} = 변경 · 원 요율 그대로(국가계약법 시행령 제65조⑥)`,
    너비: [30, 7, 18, 9, 40, 16], 머리: [['비            목', '구분', '금    액', '요율', '산   출   근   거', '증    감']], 줄: 줄들, 세로: true,
  }
}
