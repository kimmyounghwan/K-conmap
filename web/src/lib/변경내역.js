/**
 * 🧰 설계변경 작업대 — 내역서를 «상태» 로 읽고, 필요한 서류로 다시 짭니다 (2026-09-30, G72)
 *
 * 소장님(9/30): 설계박사(엑셀 추가기능) · 콘엑스(웹)에 있고 우리에게 빠진 것 「다 만들자」 — 1단계 «설계변경 묶음».
 *
 * ■ 읽는 모양 — 한 품목이 몇 줄로 적혀 있든 «상태» 로 봅니다
 *     1줄  : 보통 내역서(설계 · 도급 · 계약)                                   상태 = [값]
 *     2줄  : 설계변경 내역서 — 품목마다 당초 줄 + 변경 줄(변경 줄은 품명이 비어 있음)   상태 = [당초, 변경]
 *     3줄  : 당초 · 변경 · 증감                                                상태 = [당초, 변경] (증감은 다시 셈)
 *     N줄  : 차수(연차) 내역서 — 「구분」 칸에 ①총괄당초 ②총괄변경 ③1차기시행 … 처럼 이름이 붙은 것   상태 = 그 이름들
 *   공종 줄(● · 1. · 1.1 · 1.1.1 · 1) · (1) · 가. …)은 번호 꼴로 깊이를 잽니다.
 *   2026-09-30 송금지구 변경 2회분(.xls · 내역서 874줄 · 2줄)과 7행 차수내역서(3,049줄 · 7상태)로 맞춰 봄.
 *
 * ■ 셈 규칙(실제 변경내역서에서 잰 것): 갈래 금액 = 수량 × 갈래 단가 «원 미만 버림» (1,431칸 중 1,431 맞음) ·
 *   합계 금액 = 노무비 + 재료비 + 경비 금액(수량 × 합계단가가 아님 — 버림이 세 번 들어가므로) · 합계 단가 = 세 단가의 합.
 *   조달수수료 · 공구손료처럼 수량 칸이 «비율» 인 줄은 셈이 다릅니다 → 값 그대로 두고 «특수 줄» 로 알림.
 *
 * ■ 만드는 것 (모두 새 엑셀 · 살아 있는 수식)
 *     1줄 내역서(고른 상태)  · 2줄/N줄 내역서(여러 파일을 맞춰서)  · 공사비물량대비표 · 공사비증감대비표 · 내역서총괄표
 *     차수(연차)별 대비표 · 검산
 * ■ 파일은 브라우저 안에서만 다룹니다. 아무것도 올라가지 않습니다.
 * 시험: node tools/시험_변경내역.mjs
 */
import { 변경엑셀, 수꼴, 열글, 색꼴, 색맞춤 } from './변경엑셀쓰기.js'

/* ═══════════════════════════ 낱말 ═══════════════════════════ */
const 글 = (x) => (x === null || x === undefined ? '' : String(x).trim())
const 붙 = (x) => 글(x).replace(/\s+/g, '')
const 수 = (x) => {
  if (typeof x === 'number') return Number.isFinite(x) ? x : null
  const t = 글(x).replace(/,/g, '')
  if (t === '' || !/^-?\d*\.?\d+(e[-+]?\d+)?$/i.test(t)) return null
  const v = Number(t)
  return Number.isFinite(v) ? v : null
}
const 반듯 = (v) => Math.round(v * 1e6) / 1e6
export const 버림 = (v) => (v < 0 ? -Math.floor(-v + 1e-7) : Math.floor(v + 1e-7))

/* ═══════════════════════════ 머리글 ═══════════════════════════ */
const H품명 = /^(품명|품명및규격|품목|품목명|명칭|공종명|공사명|자재명|산출명|목명|공종및품명|공종별명칭)$/
const H공종 = /^(공종|번호|no\.?|순번|항목|코드|구분번호|공종번호)$/i
const H규격 = /^(규격|형식|사양|규격및형식)$/
const H단위 = /^(단위|수량단위)$/
const H수량 = /^(수량|물량|계량)$/
const H단가 = /^단가$/
const H금액 = /^(금액|금액원)$/
const H구분 = /^(구분|상태|차수)$/
const H비고 = /^(비고|적요)$/
const H율 = /(낙찰율|낙찰률|협의율|협의률|사정율|적용율|적용률)/
const G재 = /^재료비?$/, G노 = /^노무비?$/, G경 = /^경비$/, G합 = /^(합계|계|합계금액|총계|금액계)$/
export const 갈래이름 = ['합계', '노무비', '재료비', '경비']

/* 내역서답지 않은 시트 이름 — 처음에 끄는 것 */
const 시트아님 = /일위|단가산출|단가대비|중기|기계경비|노임|자재|견적단가|품셈|산출근거|수량산출|공정|목차|안내|표지|갑지|원가계산|대비표|총괄표|적용기준/

/* ═══════════════════════════ 공종 번호 ═══════════════════════════ */
/** 번호 글자의 «꼴» — 같은 꼴이면 같은 깊이 */
export function 번호꼴(t) {
  const s = 붙(t)
  if (!s) return ''
  if (/^[●■◆▣◈★☆◎]$/.test(s)) return 'S' + s
  if (/^[○□◇▶▷►]$/.test(s)) return 'S' + s
  let m = s.match(/^(\d+)(\.\d+)*\.?$/)
  if (m) return 'D' + s.replace(/\.$/, '').split('.').length
  if (/^\d+\)$/.test(s)) return 'P'
  if (/^\(\d+\)$/.test(s)) return 'PP'
  if (/^[가-하]\.$/.test(s)) return 'K.'
  if (/^[가-하]\)$/.test(s)) return 'K)'
  if (/^\([가-하]\)$/.test(s)) return '(K)'
  if (/^[①-⑳]$/.test(s)) return 'C'
  if (/^[a-z]\.$/i.test(s)) return 'A.'
  if (/^[a-z]\)$/i.test(s)) return 'A)'
  if (/^[IVX]+\.?$/.test(s)) return 'R'
  m = s.match(/^제?\d+[장절편]$/)
  if (m) return 'J'
  return ''
}
/** 품명 앞에 번호가 붙어 있으면 떼어 냅니다 — 「1. 토공」 → ['1.', '토공'] */
export function 앞번호(이름) {
  const t = 글(이름)
  const m = t.match(/^([●■◆▣◈★☆◎○□◇▶▷►]|\d+(?:\.\d+)*\.|\d+\)|\(\d+\)|[가-하][.)]|\([가-하]\)|[①-⑳])\s*(.+)$/)
  if (m && 번호꼴(m[1])) return [m[1], m[2]]
  return ['', t]
}

/* 합계 줄 — 우리가 다시 셉니다 */
const 계줄 = /^(순공사비|순공사원가|직접공사비|공사비합계|합계|총계|총합계|소계|계|누계|중계|이월|공종계|합)$/

/* ═══════════════════════════ 시트 읽기 ═══════════════════════════ */

function 머리찾기(grid) {
  const N = (r) => (grid[r] || []).map(붙)
  for (let i = 0; i < Math.min(grid.length, 40); i++) {
    const c = N(i)
    const 품 = c.findIndex((x) => H품명.test(x))
    if (품 < 0) continue
    const 아래 = N(i + 1)
    const 있음 = (re) => c.some((x) => re.test(x)) || 아래.some((x) => re.test(x))
    if (있음(H수량) || 있음(H금액) || 있음(H단가)) return i
  }
  return -1
}

/**
 * 한 시트(2차원 표) → 내역 모형
 * @returns {{시트, 상태:string[], 갈래:string[], 줄:[], 칸, 까닭, 꼴}}
 */
export function 시트읽기(시트, grid) {
  const hi = 머리찾기(grid)
  if (hi < 0) return { 시트, 줄: [], 상태: [], 갈래: [], 까닭: '「품명 · 수량(또는 금액)」 머리글을 못 찾았습니다' }
  const N = (r) => (grid[r] || []).map(붙)
  const c = N(hi)
  const sub = N(hi + 1)
  const 두줄머리 = sub.some((x) => H단가.test(x)) && sub.some((x) => H금액.test(x)) && !sub.some((x) => H품명.test(x))
  const 머리 = 두줄머리 ? sub : c
  const 윗줄 = 두줄머리 ? c : (hi > 0 ? N(hi - 1) : [])
  const 자료부터 = 두줄머리 ? hi + 2 : hi + 1
  const 찾기 = (re, 먼저 = c) => {
    let j = 먼저.findIndex((x) => re.test(x))
    if (j < 0 && 두줄머리) j = sub.findIndex((x) => re.test(x))
    return j
  }
  /* 대비표(당초 · 변경 칸이 옆으로 벌려진 것)는 내역서가 아닙니다 */
  if ([...c, ...sub].filter((x) => /^(당초|변경)$/.test(x)).length >= 2) {
    return { 시트, 줄: [], 상태: [], 갈래: [], 까닭: '당초 · 변경이 «옆으로» 벌려진 대비표입니다 — 내역서 시트를 고르십시오' }
  }
  const 칸 = {
    품: 찾기(H품명), 규: 찾기(H규격), 단위: 찾기(H단위), 수량: 찾기(H수량),
    구분: 찾기(H구분), 비고: 찾기(H비고), 율: c.findIndex((x) => H율.test(x)),
  }
  /* 번호(공종) 칸: 품명 왼쪽의 「공종 · 번호」 머리 — 없으면 품명 바로 왼쪽 칸이 번호처럼 쓰였는지 봅니다 */
  칸.번호 = c.findIndex((x, j) => j < 칸.품 && H공종.test(x))
  if (칸.번호 < 0 && 칸.품 > 0) {
    let 번호다움 = 0
    for (let r = 자료부터; r < Math.min(grid.length, 자료부터 + 300); r++) if (번호꼴((grid[r] || [])[칸.품 - 1])) 번호다움++
    if (번호다움 >= 3) 칸.번호 = 칸.품 - 1
  }
  /* 갈래 — 윗줄에서 왼쪽으로 걸어가며 갈래 이름을 찾습니다(병합 칸이라 오른쪽 칸은 비어 있음) */
  const 라벨 = (j) => {
    for (let k = j; k >= 0; k--) {
      const g = 윗줄[k]
      if (!g) continue
      if (G재.test(g)) return '재료비'
      if (G노.test(g)) return '노무비'
      if (G경.test(g)) return '경비'
      if (G합.test(g)) return '합계'
      return null
    }
    return null
  }
  const 갈래칸 = {}
  for (let j = 0; j < 머리.length; j++) {
    const h = 머리[j] || ''
    const 꼴 = H단가.test(h) ? '단가' : H금액.test(h) ? '금액' : null
    if (!꼴) continue
    const g = 두줄머리 ? (라벨(j) || '합계') : '합계'
    갈래칸[g] = 갈래칸[g] || { 단가: -1, 금액: -1 }
    if (갈래칸[g][꼴] < 0) 갈래칸[g][꼴] = j
  }
  /* 🧾 G131 — 머리 한 줄에 «재료비단가 · 재료비금액 · … · 합계금액» 처럼 갈래와 단가/금액을 붙여 쓴 꼴(우리 «단가 채우기» 가 내보낸 내역서) */
  if (!두줄머리) {
    for (let j = 0; j < c.length; j++) {
      const m = String(c[j] || '').match(/^(재료비|노무비|경비|합계)(단가|금액)$/)
      if (!m) continue
      갈래칸[m[1]] = 갈래칸[m[1]] || { 단가: -1, 금액: -1 }
      if (갈래칸[m[1]][m[2]] < 0) 갈래칸[m[1]][m[2]] = j
    }
  }
  /* 머리 한 줄짜리: 「재료비 · 노무비 · 경비 · 합계」 가 곧 금액 칸인 꼴 */
  if (!두줄머리) {
    for (let j = 0; j < c.length; j++) {
      const h = c[j]
      const g = G재.test(h) ? '재료비' : G노.test(h) ? '노무비' : G경.test(h) ? '경비' : null
      if (g && !갈래칸[g]) 갈래칸[g] = { 단가: -1, 금액: j }
    }
  }
  const 갈래 = Object.keys(갈래칸).sort((a, b) => {
    const pa = Math.min(...Object.values(갈래칸[a]).filter((x) => x >= 0))
    const pb = Math.min(...Object.values(갈래칸[b]).filter((x) => x >= 0))
    return pa - pb
  })
  if (칸.수량 < 0 && !갈래.length) return { 시트, 줄: [], 상태: [], 갈래: [], 까닭: '「수량」 이나 「단가 · 금액」 칸을 못 찾았습니다' }

  /* ── 줄마다 뜯기 ── */
  const 뜯은 = []
  let 빈줄연속 = 0
  for (let r = 자료부터; r < grid.length; r++) {
    const row = grid[r] || []
    const 값 = (j) => (j >= 0 ? row[j] : null)
    let 번호 = 글(값(칸.번호))
    let 이름 = 글(값(칸.품))
    if (!번호 && 이름) { const [n, rest] = 앞번호(이름); if (n) { 번호 = n; 이름 = rest } }
    const 규격 = 글(값(칸.규)), 단위 = 글(값(칸.단위)), 구분 = 글(값(칸.구분)), 비고 = 글(값(칸.비고))
    const 수량 = 수(값(칸.수량))
    const g = {}
    let 숫자있음 = 수량 !== null
    for (const k of 갈래) {
      const u = 수(값(갈래칸[k].단가)), a = 수(값(갈래칸[k].금액))
      g[k] = { 단가: u, 금액: a }
      if (u !== null || a !== null) 숫자있음 = true
    }
    const 율 = 수(값(칸.율))
    if (!번호 && !이름 && !규격 && !단위 && !구분 && !숫자있음) {
      if (++빈줄연속 > 60) break                     /* 표가 끝났습니다 */
      continue
    }
    빈줄연속 = 0
    뜯은.push({ r: r + 1, 번호, 이름, 규격, 단위, 구분, 비고, 수량, g, 율, 숫자있음 })
  }

  /* ── 덩이 짓기: 이름(또는 번호)이 있는 줄에서 새 덩이, 이름 없는 숫자 줄은 앞 덩이에 붙음 ── */
  let 덩이 = []
  for (const x of 뜯은) {
    const 머리줄 = !!(x.이름 || x.번호)
    if (머리줄 || !덩이.length) 덩이.push([x])
    else 덩이[덩이.length - 1].push(x)
  }
  /* 상태 정하기 */
  let 상태 = []
  let 상태자리 = null                                /* 덩이 안의 줄 → 상태 번호 */
  const 구분있음 = 칸.구분 >= 0 && 뜯은.filter((x) => x.구분).length >= Math.max(3, 뜯은.length * 0.3)
  if (구분있음) {
    const 본 = new Map()
    for (const x of 뜯은) if (x.구분 && !본.has(x.구분)) 본.set(x.구분, 본.size)
    상태 = [...본.keys()]
    상태자리 = (x) => (본.has(x.구분) ? 본.get(x.구분) : -1)
  } else {
    const 크기 = new Map()
    for (const d of 덩이) if (d.some((x) => x.숫자있음)) 크기.set(d.length, (크기.get(d.length) || 0) + 1)
    let K = 1
    let 많 = 0
    for (const [k, n] of 크기) if (n > 많 && k <= 3) { 많 = n; K = k }
    const 전체 = [...크기.values()].reduce((a, b) => a + b, 0)
    if (K > 1 && 많 < 전체 * 0.6) K = 1
    /* ⚠️ 2026-09-30 송금지구 — 변경 줄에도 품명이 적힐 수 있습니다(ICP말뚝 → PHCP말뚝 처럼 품목을 바꾼 것).
          이름으로 덩이를 끊으면 거기서부터 당초 · 변경이 한 줄씩 어긋나 공종 합이 통째로 틀립니다.
          → 2 · 3줄이면 다시 짓습니다: 첫 줄 뒤의 줄은 «공종 번호가 없고, (품명이 없거나 단위가 없으면)» 짝 줄. */
    if (K > 1) {
      const 새 = []
      let i = 0
      while (i < 뜯은.length) {
        const d = [뜯은[i]]
        let j = i + 1
        while (d.length < K && j < 뜯은.length) {
          const y = 뜯은[j]
          const 짝 = !(y.번호 && 번호꼴(y.번호)) && (!y.이름 || !y.단위)
          if (!짝) break
          d.push(y); j++
        }
        새.push(d)
        i = j
      }
      덩이 = 새
    }
    상태 = K === 1 ? ['값'] : ['당초', '변경']
    상태자리 = (x, i) => (i < 2 ? i : -1)            /* 3줄(증감)은 버리고 다시 셉니다 */
    if (K === 1) 상태자리 = (x, i) => (i === 0 ? 0 : -1)
  }
  const S = 상태.length

  /* ── 덩이 → 줄(공종 · 품목 · 계) ── */
  const 줄 = []
  const 깊이쌓기 = []
  const 깊이 = (번호) => {
    const k = 번호꼴(번호)
    if (!k) return null
    const i = 깊이쌓기.indexOf(k)
    if (i >= 0) { 깊이쌓기.length = i + 1; return i }
    깊이쌓기.push(k)
    return 깊이쌓기.length - 1
  }
  let 마지막깊이 = -1
  for (const d of 덩이) {
    const 첫 = d[0]
    const 상태값 = Array.from({ length: S }, () => null)
    d.forEach((x, i) => {
      const s = 상태자리(x, i)
      if (s >= 0 && s < S && !상태값[s]) 상태값[s] = x
    })
    const 이름 = 첫.이름
    const 수량있음 = d.some((x) => x.수량 !== null && x.수량 !== 0) || d.some((x) => x.단위)
    const 단위 = d.map((x) => x.단위).find(Boolean) || ''
    if (계줄.test(붙(이름)) && !첫.번호) {
      줄.push({ 꼴: '계', 이름, 원합: 상태값.map((x) => (x ? 합들(x) : null)), r: 첫.r })
      continue
    }
    /* 이름도 번호도 없고 숫자가 모두 0 인 덩이(표 끝의 빈 줄)는 버립니다 */
    if (!이름 && !첫.번호 && d.every((x) => (x.수량 || 0) === 0 && Object.values(x.g).every((v) => !v.단가 && !v.금액))) continue
    const 공종다움 = !!첫.번호 && 번호꼴(첫.번호) && !단위
    if (공종다움 || (!수량있음 && !단위 && 이름)) {
      let 깊 = 첫.번호 ? 깊이(첫.번호) : null
      if (깊 === null) 깊 = 마지막깊이 >= 0 ? 마지막깊이 : 0
      마지막깊이 = 깊
      줄.push({
        꼴: '공종', 깊이: 깊, 번호: 첫.번호, 이름, 규격: 첫.규격, 원합: 상태값.map((x) => (x ? 합들(x) : null)), r: 첫.r,
        ...(d.some((x) => /순공사비\s*밖/.test(x.비고)) ? { 별도: true } : {}),
      })
      continue
    }
    /* 1줄 내역서에서 긴 규격을 아랫줄에 이어 쓴 것(숫자 없는 줄)은 규격에 붙입니다 */
    const 이은규격 = S === 1 ? d.slice(1).filter((x) => !x.숫자있음).map((x) => [x.이름, x.규격].filter(Boolean).join(' ')).filter(Boolean) : []
    줄.push({
      꼴: '품목', 번호: 첫.번호, 이름: 이름 || '(이름 없음)',
      규격: [첫.규격 || d.map((x) => x.규격).find(Boolean) || '', ...이은규격].filter(Boolean).join(' '), 단위,
      값: 상태값.map((x, s) => (x ? {
        수량: x.수량, g: x.g, 비고: x.비고, 율: x.율,
        ...(s > 0 && x.이름 && 붙(x.이름) !== 붙(이름) ? { 이름: x.이름 } : {}),
        ...(s > 0 && x.규격 && 붙(x.규격) !== 붙(첫.규격) ? { 규격: x.규격 } : {}),
      } : null)),
      r: 첫.r,
    })
  }
  const 품목수 = 줄.filter((x) => x.꼴 === '품목').length
  const 별도 = 품목수 ? 별도찾기({ 줄, 상태, 갈래 }) : []
  const 꼴 = 구분있음 ? S + '상태(구분 칸)' : S === 1 ? '1줄' : 덩이.some((d) => d.length === 3) ? '3줄(증감 줄은 다시 셈)' : '2줄'
  return {
    시트, 상태, 갈래, 줄, 꼴, 칸, 머리줄: hi + 1, 자료부터: 자료부터 + 1, 품목수, 별도,
    까닭: 품목수 ? '' : '품목 줄이 없습니다',
  }
}

function 합들(x) {
  const o = {}
  for (const [k, v] of Object.entries(x.g || {})) o[k] = v.금액
  return o
}

/* ═══════════════════════════ 파일 읽기 ═══════════════════════════ */

/** 시트들({이름: 표}) → 파일 모형 { 이름, 시트들:[시트모형], 고른:시트이름 } */
export function 파일읽기(책, 파일이름) {
  const 시트들 = []
  const 말 = []
  for (const [이름, grid] of Object.entries(책)) {
    if (!grid || !grid.length) { 말.push(이름 + ': 빈 시트'); continue }
    const m = 시트읽기(이름, grid)
    if (m.품목수) 시트들.push(m)
    말.push(이름 + ': ' + (m.품목수 ? `${m.꼴} · 품목 ${m.품목수}` : m.까닭))
  }
  if (!시트들.length) {
    throw new Error('내역서 표를 못 찾았습니다. 「품명 · 수량 · 단가 · 금액」 칸이 있는 엑셀이어야 합니다.  (' + 말.slice(0, 8).join(' / ') + ')')
  }
  /* 처음 고를 시트: 이름에 «내역» 이 있고 대비표 · 총괄표 · 일위대가가 아닌 것 중 품목이 가장 많은 것 */
  const 후보 = 시트들.filter((s) => /내역/.test(s.시트) && !시트아님.test(s.시트))
  const 고름 = (후보.length ? 후보 : 시트들.filter((s) => !시트아님.test(s.시트)).length ? 시트들.filter((s) => !시트아님.test(s.시트)) : 시트들)
    .reduce((a, b) => (b.품목수 > a.품목수 ? b : a))
  return { 이름: 파일이름 || '내역서', 시트들, 고른: 고름.시트, 말 }
}

/* ═══════════════════════════ 셈 ═══════════════════════════ */

const 세갈래 = ['노무비', '재료비', '경비']
const 특수이름 = /수수료|손료|잡재료|공구손|잡품|잡비|보험|%|할증/

/** 한 상태의 한 품목 → 다시 셈한 {수량, 단가{}, 금액{}, 특수} */
export function 품목셈(v, 갈래) {
  if (!v) return null
  const q = v.수량
  const 단가 = {}, 금액 = {}
  let 특수 = false
  for (const k of 갈래) {
    단가[k] = v.g[k] ? v.g[k].단가 : null
    금액[k] = v.g[k] ? v.g[k].금액 : null
  }
  const 셋 = 세갈래.filter((k) => 갈래.includes(k))
  const 셈갈래 = 셋.length ? 셋 : 갈래.filter((k) => k === '합계')
  for (const k of 셈갈래) {
    const u = 단가[k]
    if (u === null) continue
    const 셈 = q === null ? null : 버림(u * q)
    if (금액[k] === null) 금액[k] = 셈
    else if (셈 !== null && Math.abs(셈 - 금액[k]) > 1) 특수 = true
  }
  if (셋.length && 갈래.includes('합계')) {
    const su = 셋.reduce((a, k) => a + (단가[k] || 0), 0)
    const sa = 셋.reduce((a, k) => a + (금액[k] || 0), 0)
    if (단가.합계 === null && 셋.some((k) => 단가[k] !== null)) 단가.합계 = 반듯(su)
    if (금액.합계 === null) 금액.합계 = 반듯(sa)
  }
  return { 수량: q, 단가, 금액, 특수 }
}

/** 모형 → 공종마다 상태별 합(갈래별) · 전체 합 */
export function 모으기(모형) {
  const { 줄, 상태, 갈래 } = 모형
  const S = 상태.length
  const 빈합 = () => Object.fromEntries(갈래.map((k) => [k, 0]))
  const 합 = Array.from({ length: S }, 빈합)
  const 공종합 = new Map()                          /* 줄 번호 → [상태] 합 */
  const 쌓 = []                                     /* 열린 공종들 [줄번호, 깊이, 별도] */
  const 별도줄 = new Set()                          /* 순공사비에 안 들어가는 품목(관급자재 처럼) */
  줄.forEach((x, i) => {
    if (x.꼴 === '공종') {
      while (쌓.length && 쌓[쌓.length - 1][1] >= x.깊이) 쌓.pop()
      쌓.push([i, x.깊이, !!x.별도])
      공종합.set(i, Array.from({ length: S }, 빈합))
      return
    }
    if (x.꼴 !== '품목') return
    /* 안쪽 공종부터 바깥으로 — «별도» 공종을 지나면 그 위(와 순공사비)에는 더하지 않습니다 */
    let 올릴곳 = 쌓.length
    for (let t = 쌓.length - 1; t >= 0; t--) if (쌓[t][2]) { 올릴곳 = t; break }
    const 별도 = 올릴곳 < 쌓.length
    if (별도) 별도줄.add(i)
    for (let s = 0; s < S; s++) {
      const c = 품목셈(x.값[s], 갈래)
      if (!c) continue
      for (const k of 갈래) {
        const a = c.금액[k] || 0
        if (!별도) 합[s][k] += a
        for (let t = 별도 ? 올릴곳 : 0; t < 쌓.length; t++) 공종합.get(쌓[t][0])[s][k] += a
      }
    }
  })
  return { 합, 공종합, 별도줄 }
}

/**
 * «별도» 공종 찾기 — 공종 줄에 적힌 합(원합)이 아래 공종들을 다 더한 것과 다르면,
 * 어느 아래 공종을 빼야 맞는지 찾습니다(관급자재 · 기타공사비처럼 순공사비 밖에 두는 것).
 * 원합이 없는 파일(1줄 · 공종 줄에 숫자 없음)은 이름으로만: «관급자재».
 */
const 별도이름 = /관급|별도|제외|부가가치/
export function 별도찾기(모형) {
  const { 줄, 상태, 갈래 } = 모형
  const 기준 = 갈래.includes('합계') ? '합계' : 갈래[0]
  const S = 상태.length
  const 원합있음 = 줄.some((x) => x.꼴 === '공종' && x.원합 && x.원합.some((o) => o && o[기준]))
  if (줄.some((x) => x.꼴 === '공종' && x.별도)) {
    /* 이미 표시가 있음(우리가 만든 엑셀의 «순공사비 밖(별도)» 비고 · 여러 파일을 맞추며 옮겨 온 것) */
    return 줄.filter((x) => x.꼴 === '공종' && x.별도).map((x) => (x.번호 ? x.번호 + ' ' : '') + x.이름)
  }
  if (!원합있음) {
    /* 공종 줄에 합이 없는 파일 — 이름으로만, 그것도 얕은 공종(깊이 0 · 1)만: 건축 안의 «도급자관급» 같은 작은 묶음은 건드리지 않음 */
    줄.forEach((x) => { if (x.꼴 === '공종' && (x.깊이 || 0) <= 1 && /관급자재|관급자관급|도급자관급/.test(붙(x.이름))) x.별도 = true })
    return 줄.filter((x) => x.꼴 === '공종' && x.별도).map((x) => (x.번호 ? x.번호 + ' ' : '') + x.이름)
  }
  const 공종들 = 줄.map((x, i) => [x, i]).filter(([x]) => x.꼴 === '공종')
  const 자식들 = (i) => {
    const d = 줄[i].깊이
    const out = []
    for (let j = i + 1; j < 줄.length; j++) {
      const y = 줄[j]
      if (y.꼴 !== '공종') continue
      if (y.깊이 <= d) break
      if (y.깊이 === d + 1 || !out.length || y.깊이 < 줄[out[out.length - 1]].깊이) out.push(j)
    }
    return out.filter((j) => 줄[j].깊이 === Math.min(...out.map((k) => 줄[k].깊이)))
  }
  const 맞나 = (i, 합들) => 줄[i].원합.every((o, s) => !o || o[기준] === null || o[기준] === undefined || Math.abs(합들[s][기준] - o[기준]) <= 2)
  const 차례 = 공종들.slice().sort((a, b) => b[0].깊이 - a[0].깊이)
  for (const [x, i] of 차례) {
    if (!x.원합) continue
    let { 공종합 } = 모으기(모형)
    if (맞나(i, 공종합.get(i))) continue
    const 아래 = 자식들(i)
    if (!아래.length || 아래.length > 14) continue
    /* 빼는 것이 적을수록 · 이름이 «관급 · 별도» 다울수록 먼저 */
    const 조합 = []
    for (let m = 1; m < (1 << 아래.length); m++) {
      const 뺄 = 아래.filter((_, k) => m & (1 << k))
      if (뺄.length === 아래.length) continue
      조합.push(뺄)
    }
    조합.sort((a, b) => a.length - b.length || b.filter((j) => 별도이름.test(붙(줄[j].이름))).length - a.filter((j) => 별도이름.test(붙(줄[j].이름))).length)
    const 원 = x.원합
    for (const 뺄 of 조합) {
      const ok = 원.every((o, s) => {
        if (!o || o[기준] === null || o[기준] === undefined) return true
        const 빼고 = 공종합.get(i)[s][기준] - 뺄.reduce((a, j) => a + 공종합.get(j)[s][기준], 0)
        /* 아래 어딘가에 몇십 원 어긋난 공종이 있어도(그건 검산에 따로 나옴) 빼는 것은 찾게 — 10만분의 1 까지 */
        return Math.abs(빼고 - o[기준]) <= Math.max(2, Math.abs(o[기준]) * 1e-5)
      })
      if (ok) { 뺄.forEach((j) => { 줄[j].별도 = true }); break }
    }
  }
  void S
  return 줄.filter((x) => x.꼴 === '공종' && x.별도).map((x) => (x.번호 ? x.번호 + ' ' : '') + x.이름)
}

/* ═══════════════════════════ 검산 ═══════════════════════════ */

/** 모형 → [{줄, 상태, 무엇, 올린값, 셈값, 무게: '확인'|'참고'}] */
export function 검산(모형) {
  const { 줄, 상태, 갈래 } = 모형
  const 말 = []
  const 셋 = 세갈래.filter((k) => 갈래.includes(k))
  줄.forEach((x) => {
    if (x.꼴 !== '품목') return
    x.값.forEach((v, s) => {
      if (!v) return
      const q = v.수량
      for (const k of (셋.length ? 셋 : ['합계'])) {
        const g = v.g[k]
        if (!g || g.단가 === null || g.금액 === null || q === null) continue
        const 셈 = 버림(g.단가 * q)
        if (Math.abs(셈 - g.금액) > 1) {
          const 특 = 특수이름.test(x.이름 + x.단위) || x.단위 === '%' || x.단위 === '식' || q < 0 || 셈 === 0   /* 음수(잔공사 = 뺀 값) · 수량 0 인데 금액만 있는 줄은 원래 셈이 다름 */
          말.push({ r: x.r, 이름: x.이름, 상태: 상태[s], 무엇: `${k} 금액 ≠ 수량 × 단가`, 올린값: g.금액, 셈값: 셈, 무게: 특 ? '참고' : '확인' })
        }
      }
      if (셋.length && 갈래.includes('합계')) {
        const g = v.g.합계
        const sa = 셋.reduce((a, k) => a + ((v.g[k] && v.g[k].금액) || 0), 0)
        if (g && g.금액 !== null && Math.abs(g.금액 - sa) > 1) {
          말.push({ r: x.r, 이름: x.이름, 상태: 상태[s], 무엇: '합계 금액 ≠ 노무비 + 재료비 + 경비', 올린값: g.금액, 셈값: sa, 무게: '확인' })
        }
        const su = 셋.reduce((a, k) => a + ((v.g[k] && v.g[k].단가) || 0), 0)
        if (g && g.단가 !== null && Math.abs(g.단가 - su) > 1) {
          말.push({ r: x.r, 이름: x.이름, 상태: 상태[s], 무엇: '합계 단가 ≠ 세 단가의 합', 올린값: g.단가, 셈값: 반듯(su), 무게: '확인' })
        }
      }
    })
  })
  /* 공종 · 계 줄에 적힌 합과 우리 셈 — 한 곳이 틀리면 위 공종들도 «같은 차이» 로 틀립니다.
     가장 안쪽 공종만 «확인» 으로 알리고, 위로 번진 것은 한 줄로 묶어 «참고» 로 둡니다 */
  const { 합, 공종합 } = 모으기(모형)
  const 기준 = 갈래.includes('합계') ? '합계' : 갈래[0]
  const 어긋 = []                                   /* {i, s, 차} */
  줄.forEach((x, i) => {
    if (x.꼴 !== '공종' || !x.원합) return
    x.원합.forEach((o, s) => {
      if (!o || o[기준] === null || o[기준] === undefined) return
      const 셈 = 공종합.get(i)[s][기준]
      if (Math.abs(셈 - o[기준]) > Math.max(2, Math.abs(셈) * 1e-9)) 어긋.push({ i, s, 차: 반듯(o[기준] - 셈), 원: o[기준], 셈 })
    })
  })
  const 안쪽 = (a) => 어긋.some((b) => b !== a && b.s === a.s && b.i > a.i && Math.abs(b.차 - a.차) <= 1 && 범위안(줄, a.i, b.i))
  for (const a of 어긋) {
    const x = 줄[a.i]
    const 번짐 = 안쪽(a)
    말.push({ r: x.r, 이름: (x.번호 ? x.번호 + ' ' : '') + x.이름, 상태: 상태[a.s],
      무엇: 번짐 ? '공종 합계 ≠ 아래 품목의 합 (아래 공종의 차이가 번진 것)' : '공종 합계 ≠ 아래 품목의 합',
      올린값: a.원, 셈값: a.셈, 무게: 번짐 ? '참고' : '확인' })
  }
  const 첫계 = 줄.find((x) => x.꼴 === '계' && x.원합 && x.원합.some(Boolean))
  if (첫계) {
    첫계.원합.forEach((o, s) => {
      if (!o || o[기준] === null || o[기준] === undefined) return
      const 차 = 반듯(o[기준] - 합[s][기준])
      if (Math.abs(차) > 2) {
        const 번짐 = 어긋.some((b) => b.s === s && Math.abs(b.차 - 차) <= 1)
        말.push({ r: 첫계.r, 이름: 첫계.이름, 상태: 상태[s], 무엇: 번짐 ? '총액 ≠ 품목 전체의 합 (공종의 차이가 번진 것)' : '총액 ≠ 품목 전체의 합',
          올린값: o[기준], 셈값: 합[s][기준], 무게: 번짐 ? '참고' : '확인' })
      }
    })
  }
  return 말
}

/** j 줄이 i 공종의 범위 안인가 */
function 범위안(줄, i, j) {
  const d = 줄[i].깊이
  for (let k = i + 1; k <= j; k++) if (줄[k].꼴 === '공종' && 줄[k].깊이 <= d) return false
  return j > i
}

/* ═══════════════════════════ 여러 파일 맞추기 ═══════════════════════════ */

const 단위같게 = (u) => 붙(u).toLowerCase().replace(/㎥|m3/g, 'm3').replace(/㎡|m2/g, 'm2').replace(/㎜|mm/g, 'mm').replace(/ｍ|m$/g, 'm')
export const 열쇠 = (x) => [붙(x.이름).toLowerCase(), 붙(x.규격).toLowerCase().replace(/×/g, 'x'), 단위같게(x.단위)].join('|')
const 공종열쇠 = (x) => 붙(x.이름).toLowerCase()

/**
 * 1줄(또는 N상태) 모형 여러 개 → 하나의 N상태 모형으로 짝을 지어 합칩니다.
 *   이름들: 상태 이름(예: ['당초', '1회 변경', '2회 변경'])
 *   맞춤 = 공종 경로(공종 이름들) + 품명 · 규격 · 단위. 경로가 달라도 열쇠가 한 곳에만 있으면 짝.
 *   새 품목(앞 파일에 없음)은 뒤 파일에서 «바로 앞에 짝지은 줄» 뒤에 끼웁니다 — 차례가 흐트러지지 않게.
 */
export function 맞추기(모형들, 이름들) {
  const 갈래 = [...new Set(모형들.flatMap((m) => m.갈래))].sort((a, b) => 갈래이름.indexOf(a) - 갈래이름.indexOf(b))
  const 상태 = []
  모형들.forEach((m, fi) => {
    const 이름 = (이름들 && 이름들[fi]) || `${fi + 1}번 파일`
    if (m.상태.length === 1) 상태.push(이름)
    else m.상태.forEach((s) => 상태.push(`${이름} · ${s}`))
  })
  const S = 상태.length
  const 합친 = []                                    /* {꼴, 깊이, 번호, 이름, 규격, 단위, 값:[S], 경로} */
  const 경로키 = (경로, x) => 경로.join('>') + '#' + 열쇠(x)
  let 상태시작 = 0
  모형들.forEach((m) => {
    const 이번S = m.상태.length
    /* 이 파일의 줄마다 경로를 붙입니다 */
    const 경로 = []
    const 표시 = m.줄.filter((x) => x.꼴 !== '계').map((x) => {
      if (x.꼴 === '공종') { 경로.length = x.깊이; 경로[x.깊이] = 공종열쇠(x); return { x, 경로: 경로.slice(0, x.깊이 + 1) } }
      return { x, 경로: 경로.slice() }
    })
    /* 지금까지 합친 것의 찾아보기 */
    const 자리 = new Map()          /* 경로키 → 합친 번호 */
    const 열쇠자리 = new Map()      /* 품목 열쇠 → [합친 번호] */
    const 공종자리 = new Map()      /* 공종 경로 → 합친 번호 */
    const 다시세기 = () => {
      자리.clear(); 열쇠자리.clear(); 공종자리.clear()
      합친.forEach((y, i) => {
        if (y.꼴 === '공종') 공종자리.set(y.경로.join('>'), i)
        else {
          자리.set(경로키(y.경로, y), i)
          const k = 열쇠(y)
          열쇠자리.set(k, [...(열쇠자리.get(k) || []), i])
        }
      })
    }
    다시세기()
    const 쓴 = new Set()                            /* 합친 줄(객체) — 끼워 넣으면 번호가 밀리므로 객체로 둡니다 */
    let 닻 = -1
    for (const { x, 경로: p } of 표시) {
      let i = -1
      if (x.꼴 === '공종') {
        const k = p.join('>')
        if (공종자리.has(k)) i = 공종자리.get(k)
      } else {
        const k1 = 경로키(p, x)
        if (자리.has(k1) && !쓴.has(합친[자리.get(k1)])) i = 자리.get(k1)
        else if (!공종자리.has(p.join('>'))) {
          /* ⚠️ 다른 공종의 같은 품목과 짝짓는 것은 «이 공종이 앞 파일에 아예 없을 때»(공종 이름이 바뀐 것)만.
                2026-09-30 송금지구: 유수지 유입부 BOX(삭제)의 잡석부설과 배수장 구조물(신규)의 잡석부설이 짝지어져
                새 품목들이 엉뚱한 공종 밑으로 들어갔습니다. */
          const 후보 = (열쇠자리.get(열쇠(x)) || []).filter((j) => !쓴.has(합친[j]))
          if (후보.length === 1) i = 후보[0]
        }
      }
      if (i < 0) {
        const 새 = x.꼴 === '공종'
          ? { 꼴: '공종', 깊이: x.깊이, 번호: x.번호, 이름: x.이름, 규격: x.규격, 경로: p, 별도: !!x.별도 }
          : { 꼴: '품목', 번호: x.번호, 이름: x.이름, 규격: x.규격, 단위: x.단위, 경로: p, 값: Array.from({ length: S }, () => null) }
        /* 끼울 자리: 닻 뒤. 공종이면 닻이 가리키는 공종의 «아래 품목들» 을 지나서 */
        let at = 닻 + 1
        if (x.꼴 === '공종') {
          while (at < 합친.length && !(합친[at].꼴 === '공종' && 합친[at].깊이 <= x.깊이)) at++
        }
        합친.splice(at, 0, 새)
        다시세기()
        i = at
      }
      쓴.add(합친[i])
      닻 = i
      if (x.꼴 === '품목') {
        const y = 합친[i]
        for (let s = 0; s < 이번S; s++) y.값[상태시작 + s] = x.값[s] || null
        if (!y.단위 && x.단위) y.단위 = x.단위
      } else {
        if (x.번호) 합친[i].번호 = x.번호
        if (x.별도) 합친[i].별도 = true
      }
    }
    상태시작 += 이번S
  })
  /* 모형 모양으로 */
  const 줄 = 합친.map((y) => (y.꼴 === '공종'
    ? { 꼴: '공종', 깊이: y.깊이, 번호: y.번호, 이름: y.이름, 규격: y.규격 || '', 원합: null, ...(y.별도 ? { 별도: true } : {}) }
    : { 꼴: '품목', 번호: y.번호, 이름: y.이름, 규격: y.규격, 단위: y.단위, 값: y.값.map((v) => v || null) }))
  const 맞춘 = { 시트: '맞춘 내역', 상태, 갈래, 줄, 꼴: S + '상태(파일 ' + 모형들.length + '개)', 품목수: 줄.filter((x) => x.꼴 === '품목').length }
  맞춘.별도 = 별도찾기(맞춘)
  return 맞춘
}

/** 두 상태 사이 품목마다 무엇이 바뀌었나 */
export function 바뀜(v1, v2, 갈래) {
  const a = 품목셈(v1, 갈래), b = 품목셈(v2, 갈래)
  const 있a = !!a && (a.수량 || 0) !== 0, 있b = !!b && (b.수량 || 0) !== 0
  if (!있a && 있b) return '신규'
  if (있a && !있b) return '삭제'
  if (!있a && !있b) return ''
  const 단가다름 = 갈래.some((k) => (a.단가[k] ?? null) !== null && (b.단가[k] ?? null) !== null && Math.abs(a.단가[k] - b.단가[k]) > 0.5)
  const 수량다름 = Math.abs((a.수량 || 0) - (b.수량 || 0)) > 1e-9
  return [수량다름 ? '수량' : '', 단가다름 ? '단가' : ''].filter(Boolean).join('·')
}

/** 요약 — 화면에 보일 숫자 */
export function 요약(모형, a = 0, b = 1) {
  const { 합 } = 모으기(모형)
  const 기준 = 모형.갈래.includes('합계') ? '합계' : 모형.갈래[0]
  const 셈 = { 신규: 0, 삭제: 0, 수량: 0, 단가: 0, 같음: 0 }
  if (모형.상태.length > 1) {
    for (const x of 모형.줄) {
      if (x.꼴 !== '품목') continue
      const w = 바뀜(x.값[a], x.값[b], 모형.갈래)
      if (w === '신규') 셈.신규++
      else if (w === '삭제') 셈.삭제++
      else if (!w) 셈.같음++
      else { if (w.includes('수량')) 셈.수량++; if (w.includes('단가')) 셈.단가++ }
    }
  }
  return {
    품목: 모형.줄.filter((x) => x.꼴 === '품목').length,
    공종: 모형.줄.filter((x) => x.꼴 === '공종').length,
    합: 합.map((h) => h[기준] || 0),
    셈,
  }
}

/* ═══════════════════════════ 엑셀로 ═══════════════════════════ */

const 넓이 = { 번호: 6, 품명: 30, 규격: 22, 수량: 11, 단위: 6, 단가: 11, 금액: 14, 비고: 16 }

/** 고른 상태 모두에서 수량 0 · 금액 0 인 품목과, 그래서 빈 공종을 뺍니다 */
export function 영줄빼기(줄, 고른, 갈래) {
  const 산 = 줄.map((x) => {
    if (x.꼴 !== '품목') return true
    return 고른.some((s) => {
      const c = 품목셈(x.값[s], 갈래)
      return c && ((c.수량 || 0) !== 0 || 갈래.some((k) => (c.금액[k] || 0) !== 0))
    })
  })
  /* 공종: 아래에 산 품목이 하나라도 있어야 */
  for (let i = 줄.length - 1; i >= 0; i--) {
    if (줄[i].꼴 !== '공종') continue
    let 있 = false
    for (let j = i + 1; j < 줄.length; j++) {
      if (줄[j].꼴 === '공종' && 줄[j].깊이 <= 줄[i].깊이) break
      if (줄[j].꼴 === '품목' && 산[j]) { 있 = true; break }
    }
    산[i] = 있
  }
  return 줄.filter((x, i) => 산[i] && x.꼴 !== '계')
}

/** 공종 번호가 없는 줄에도 보기 좋게 들여쓰기 */
const 들여 = (x) => (x.꼴 === '공종' ? '  '.repeat(Math.min(x.깊이 || 0, 4)) : '    ')

/**
 * N상태 내역서(1줄 · 2줄 · 차수) 시트
 *   고른: 상태 번호들 — 1개면 1줄 내역서, 여럿이면 품목마다 그만큼의 줄(뒤 상태는 붉게)
 *   구분칸: 상태 이름 칸을 보일지(3상태 이상이면 늘 보임)
 */
export function 내역시트(모형, 고른, { 제목 = '내 역 서', 이름 = '내역서', 구분칸 = null, 빼기0 = null, 색 = null } = {}) {
  const { 상태, 갈래 } = 모형
  const K = 고른.length
  /* G131 두 줄 글자색 — 위 줄(첫 상태) · 아래 줄(뒤 상태들). 1줄 내역서는 늘 검정 */
  const 고색 = 색맞춤(색)
  const 빨 = (k) => K > 1 && (k === 0 ? 고색.위 : 고색.아래) === '빨'
  const 칠 = (꼴, k) => 색꼴(꼴, 빨(k))
  /* 2줄 · 차수 내역에서 1줄을 뽑을 때는 그 상태에서 수량이 0 인 품목(삭제된 것 · 아직 안 한 것)을 뺍니다 */
  const 뺄까 = 빼기0 === null ? (K === 1 && 상태.length > 1) : 빼기0
  const 줄 = 뺄까 ? 영줄빼기(모형.줄, 고른, 갈래) : 모형.줄
  /* 미리 셈한 값도 같이 적어 둡니다 — 엑셀이 다시 셈하기 전(미리보기 · 폰)에도 합이 보이고, 이 파일을 다시 올려도 공종 합을 읽음 */
  const 모인 = 모으기({ 줄, 상태, 갈래 })
  /* «별도» 공종(관급자재 처럼 순공사비 밖) 아래 줄 — 셈 표를 X 로 달아 위 공종 · 순공사비 합에서 빠지게 */
  const 별도아래 = []
  {
    const 쌓 = []
    줄.forEach((x) => {
      if (x.꼴 === '공종') {
        while (쌓.length && 쌓[쌓.length - 1].깊이 >= x.깊이) 쌓.pop()
        쌓.push(x)
      }
      별도아래.push(쌓.some((y) => y.별도))
    })
  }
  const 구분 = 구분칸 === null ? K > 2 : 구분칸
  const 머리1 = ['공종', '품    명', '규    격', '수 량', '단위']
  const 머리2 = [null, null, null, null, null]
  if (구분) { 머리1.splice(3, 0, '구 분'); 머리2.push(null) }
  const 값칸시작 = 머리1.length                         /* 0부터: 첫 갈래 단가 칸 */
  for (const k of 갈래) { 머리1.push(k === '합계' ? '합    계' : k, null); 머리2.push('단 가', '금 액') }
  머리1.push('비    고'); 머리2.push(null)
  /* 숨은 표(라벨) 칸 — SUMIF 로 상태마다 공종 합을 내려고 */
  const 라벨칸 = 머리1.length
  머리1.push('(셈 표)'); 머리2.push(null)
  const 너비 = [넓이.번호, 넓이.품명, 넓이.규격, ...(구분 ? [12] : []), 넓이.수량, 넓이.단위,
    ...갈래.flatMap(() => [넓이.단가, 넓이.금액]), 넓이.비고, 8]
  const 병합 = []
  const 머리위 = 3                                   /* 제목 · 부제 뒤 3행부터 머리 */
  for (let j = 0; j < 값칸시작; j++) 병합.push(열글(j + 1) + 머리위 + ':' + 열글(j + 1) + (머리위 + 1))
  갈래.forEach((_, gi) => 병합.push(열글(값칸시작 + gi * 2 + 1) + 머리위 + ':' + 열글(값칸시작 + gi * 2 + 2) + 머리위))
  병합.push(열글(값칸시작 + 갈래.length * 2 + 1) + 머리위 + ':' + 열글(값칸시작 + 갈래.length * 2 + 1) + (머리위 + 1))
  병합.push(열글(라벨칸 + 1) + 머리위 + ':' + 열글(라벨칸 + 1) + (머리위 + 1))

  const 칸수량 = 구분 ? 4 : 3
  const 줄들 = []
  const 첫자료행 = 머리위 + 2                          /* 엑셀 행 번호 */
  /* 행 번호를 미리 셉니다: 순공사비 K줄 + 줄마다 K줄 */
  const 행 = []
  let r = 첫자료행 + K
  for (let i = 0; i < 줄.length; i++) {
    if (줄[i].꼴 === '계') { 행.push(-1); continue }
    행.push(r); r += K
  }
  const 끝행 = r - 1
  /* 공종의 범위: 다음 같은 깊이 이하 공종 전까지 */
  const 범위끝 = (i) => {
    const d = 줄[i].깊이
    for (let j = i + 1; j < 줄.length; j++) if (줄[j].꼴 === '공종' && 줄[j].깊이 <= d) return 행[j] - 1
    return 끝행
  }
  const 라벨 = (s, i) => (i !== undefined && 별도아래[i] ? 'X' : 'S') + s
  const 선 = (k) => (K === 1 ? '' : k === 0 ? '_위' : k === K - 1 ? '_아래' : '')
  const 꾸밈 = (k) => (빨(k) ? '빨' : '')
  const 합칸 = (col, 위, 아래, s, i) => ({
    f: `SUMIF($${열글(라벨칸 + 1)}$${위}:$${열글(라벨칸 + 1)}$${아래},"${라벨(s, i)}",${열글(col)}${위}:${열글(col)}${아래})`,
  })
  /* 순공사비 */
  for (let k = 0; k < K; k++) {
    const s = 고른[k]
    const row = [k === 0 ? { v: '', s: '공종' + 선(k) } : { v: '', s: '글' + 선(k) }, k === 0 ? { v: '순 공 사 비', s: 칠('글굵' + 선(k), k) } : { v: '', s: '글' + 선(k) }, { v: '', s: '글' + 선(k) }]
    if (구분) row.push({ v: 상태[s], s: 칠('글' + 선(k), k) })
    row.push({ v: '', s: '글' + 선(k) }, { v: '', s: '글' + 선(k) })
    갈래.forEach((_, gi) => {
      const col = 값칸시작 + gi * 2 + 2
      row.push({ v: '', s: '글' + 선(k) }, { ...합칸(col, 첫자료행 + K, 끝행, s), v: 모인.합[s][갈래[gi]], s: '금굵' + 꾸밈(k) + 선(k) })
    })
    row.push({ v: '', s: '글' + 선(k) }, { v: '계' + s, s: '작은글' })
    줄들.push(row)
  }
  줄.forEach((x, i) => {
    if (x.꼴 === '계') return
    const 위 = 행[i]
    for (let k = 0; k < K; k++) {
      const s = 고른[k]
      const R = 위 + k
      const row = []
      if (x.꼴 === '공종') {
        const 아래 = 범위끝(i)
        row.push(k === 0 ? { v: x.번호 || '', s: 칠('공종가' + 선(k), k) } : { v: '', s: '글' + 선(k) })
        row.push(k === 0 ? { v: 들여(x) + x.이름, s: 칠('글굵' + 선(k), k) } : { v: '', s: '글' + 선(k) })
        row.push(k === 0 ? { v: x.규격 || '', s: 칠('글' + 선(k), k) } : { v: '', s: '글' + 선(k) })
        if (구분) row.push({ v: 상태[s], s: 칠('글' + 선(k), k) })
        row.push({ v: '', s: '글' + 선(k) }, { v: '', s: '글' + 선(k) })
        갈래.forEach((_, gi) => {
          const col = 값칸시작 + gi * 2 + 2
          row.push({ v: '', s: '글' + 선(k) }, 위 + K <= 아래 ? { ...합칸(col, 위 + K, 아래, s, i), v: 모인.공종합.get(i)[s][갈래[gi]], s: '금굵' + 꾸밈(k) + 선(k) } : { v: 0, s: '금굵' + 꾸밈(k) + 선(k) })
        })
        row.push({ v: k === 0 && x.별도 ? '순공사비 밖(별도)' : '', s: 칠('글' + 선(k), k) }, { v: '계' + s, s: '작은글' })
        줄들.push(row)
        continue
      }
      const v = x.값[s]
      const c = 품목셈(v, 갈래) || { 수량: 0, 단가: {}, 금액: {}, 특수: false }
      const q = c.수량 === null ? 0 : c.수량
      row.push(k === 0 ? { v: x.번호 || '', s: 칠('글가' + 선(k), k) } : { v: '', s: '글' + 선(k) })
      const 바뀐이름 = v && v.이름, 바뀐규격 = v && v.규격
      const 이름칸 = K === 1 ? (바뀐이름 || x.이름) : (k === 0 ? x.이름 : 바뀐이름 || '')
      const 규격칸 = K === 1 ? (바뀐규격 || x.규격 || '') : (k === 0 ? x.규격 || '' : 바뀐규격 || '')
      row.push(이름칸 ? { v: 들여(x) + 이름칸, s: 칠('글' + 선(k), k) } : { v: '', s: '글' + 선(k) })
      row.push(규격칸 ? { v: 규격칸, s: 칠('글' + 선(k), k) } : { v: '', s: '글' + 선(k) })
      if (구분) row.push({ v: 상태[s], s: 칠('글' + 선(k), k) })
      const 수량칸 = 열글(칸수량 + 1) + R
      row.push({ v: q, s: 수꼴(q) + 꾸밈(k) + 선(k) })
      row.push(k === 0 ? { v: x.단위 || '', s: 칠('글가' + 선(k), k) } : { v: '', s: '글' + 선(k) })
      const 셋 = 세갈래.filter((g) => 갈래.includes(g))
      갈래.forEach((g, gi) => {
        const uc = 값칸시작 + gi * 2 + 1, ac = uc + 1
        const u = c.단가[g] === null || c.단가[g] === undefined ? 0 : c.단가[g]
        const a = c.금액[g] === null || c.금액[g] === undefined ? 0 : c.금액[g]
        if (g === '합계' && 셋.length) {
          const 단가식 = 셋.map((h) => 열글(값칸시작 + 갈래.indexOf(h) * 2 + 1) + R).join('+')
          const 금액식 = 셋.map((h) => 열글(값칸시작 + 갈래.indexOf(h) * 2 + 2) + R).join('+')
          /* 🩹 G131 — 갈래 단가가 빈 줄(금액만 있음)은 합계 단가를 수식으로 더하면 0 이 됩니다 → 그 줄은 값 그대로 */
          const 빈단가 = 셋.some((h) => c.단가[h] === null || c.단가[h] === undefined)
          row.push(빈단가 && u ? { v: u, s: 수꼴(u) + 꾸밈(k) + 선(k) } : { f: 단가식, v: u, s: 수꼴(u) + 꾸밈(k) + 선(k) }, { f: 금액식, v: a, s: '금' + 꾸밈(k) + 선(k) })
        } else if (c.특수) {
          row.push({ v: u, s: 수꼴(u) + 꾸밈(k) + 선(k) }, { v: a, s: '금확인' + 선(k) })
        } else if ((c.단가[g] === null || c.단가[g] === undefined) && a !== 0) {
          /* 🩹 G131 — 단가 칸이 비었는데 금액만 적힌 줄(원 파일의 수식 · 병합 칸) — «수량 × 0» 수식을 넣으면 금액이 0 이 됩니다. 값 그대로 */
          row.push({ v: '', s: 수꼴(0) + 꾸밈(k) + 선(k) }, { v: a, s: '금확인' + 선(k) })
        } else {
          row.push({ v: u, s: 수꼴(u) + 꾸밈(k) + 선(k) },
            { f: `TRUNC(${수량칸}*${열글(uc)}${R})`, v: a, s: '금' + 꾸밈(k) + 선(k) })
        }
      })
      const 비고 = [v && v.비고, c.특수 ? '수량 칸이 비율 — 값 그대로' : ''].filter(Boolean).join(' · ')
      row.push({ v: 비고, s: 칠('글' + 선(k), k) }, { v: 라벨(s, i), s: '작은글' })
      줄들.push(row)
    }
  })
  /* 🧾 G131 — 다른 시트(변경 원가계산서)가 이 시트의 칸을 가리킬 수 있게 «어느 줄이 몇 행» 을 같이 돌려줍니다(엑셀에는 안 들어감) */
  const 행맵 = new Map()
  줄.forEach((x, i) => { if (행[i] > 0) 행맵.set(x, 행[i]) })
  return { 이름, 제목, 부제: 모형.부제 || '', 너비, 머리: [머리1, 머리2], 병합, 줄: 줄들, 고정열: 2, 숨김열: [라벨칸 + 1],
    _행맵: 행맵, _값칸시작: 값칸시작, _갈래: 갈래, _첫자료행: 첫자료행, _K: K }
}

/** 공사비물량대비표 — 품목마다 수량 · 금액의 두 상태와 증 · 감 */
export function 물량대비시트(모형, a, b) {
  const { 줄, 상태, 갈래 } = 모형
  const 기준 = 갈래.includes('합계') ? '합계' : 갈래[0]
  const { 공종합, 합 } = 모으기(모형)
  const 머리1 = ['공종', '품    명', '규    격', '단위', '수        량', null, null, null, '금        액', null, null, null, '비    고']
  const 머리2 = [null, null, null, null, 상태[a], 상태[b], '증(+)', '감(-)', 상태[a], 상태[b], '증(+)', '감(-)', null]
  const 병합 = ['A3:A4', 'B3:B4', 'C3:C4', 'D3:D4', 'E3:H3', 'I3:L3', 'M3:M4']
  const 줄들 = []
  let R = 5
  const 증감 = (c1, c2, st) => [
    { f: `IF(${c2}${R}>${c1}${R},${c2}${R}-${c1}${R},"")`, s: st },
    { f: `IF(${c1}${R}>${c2}${R},${c1}${R}-${c2}${R},"")`, s: st },
  ]
  줄들.push(['', { v: '순 공 사 비', s: '글굵' }, '', '', '', '', '', '',
    { v: 합[a][기준], s: '금굵' }, { v: 합[b][기준], s: '금굵' }, ...증감('I', 'J', '금굵'), '']); R++
  줄.forEach((x, i) => {
    if (x.꼴 === '계') return
    if (x.꼴 === '공종') {
      const h = 공종합.get(i)
      줄들.push([{ v: x.번호 || '', s: '공종가' }, { v: 들여(x) + x.이름, s: '공종' }, { v: x.규격 || '', s: '공종' }, { v: '', s: '공종' },
        { v: '', s: '공종' }, { v: '', s: '공종' }, { v: '', s: '공종' }, { v: '', s: '공종' },
        { v: h[a][기준], s: '금굵' }, { v: h[b][기준], s: '금굵' }, ...증감('I', 'J', '금굵'), { v: '', s: '공종' }])
      R++
      return
    }
    const c1 = 품목셈(x.값[a], 갈래), c2 = 품목셈(x.값[b], 갈래)
    const q1 = c1 && c1.수량 !== null ? c1.수량 : 0, q2 = c2 && c2.수량 !== null ? c2.수량 : 0
    const m1 = c1 ? c1.금액[기준] || 0 : 0, m2 = c2 ? c2.금액[기준] || 0 : 0
    const w = 바뀜(x.값[a], x.값[b], 갈래)
    const 수증 = { f: `IF(F${R}>E${R},F${R}-E${R},"")`, s: 수꼴(Math.abs(q2 - q1)) }
    const 수감 = { f: `IF(E${R}>F${R},E${R}-F${R},"")`, s: 수꼴(Math.abs(q2 - q1)) }
    줄들.push([{ v: x.번호 || '', s: '글가' }, { v: 들여(x) + x.이름, s: '글' }, { v: x.규격 || '', s: '글' }, { v: x.단위 || '', s: '글가' },
      { v: q1, s: 수꼴(q1) }, { v: q2, s: 수꼴(q2) + (w ? '빨' : '') }, 수증, 수감,
      { v: m1, s: '금' }, { v: m2, s: '금' + (w ? '빨' : '') }, ...증감('I', 'J', '금'),
      { v: w === '신규' ? '신규' : w === '삭제' ? '삭제' : w ? w + ' 바뀜' : '', s: w === '신규' ? '글파' : w ? '글빨' : '글' }])
    R++
  })
  return { 이름: '공사비물량대비표', 제목: '공 사 비 물 량 대 비 표', 부제: 모형.부제 || '', 너비: [6, 30, 22, 6, 11, 11, 11, 11, 15, 15, 14, 14, 14], 머리: [머리1, 머리2], 병합, 줄: 줄들, 고정열: 2 }
}

/** 공사비증감대비표 — 공종마다 두 상태의 금액과 증 · 감 */
export function 증감대비시트(모형, a, b) {
  const { 줄, 상태, 갈래 } = 모형
  const 기준 = 갈래.includes('합계') ? '합계' : 갈래[0]
  const { 공종합, 합 } = 모으기(모형)
  const 줄들 = []
  let R = 4
  const 줄하나 = (번호, 이름, 규격, m1, m2, 굵) => {
    줄들.push([{ v: 번호, s: 굵 ? '공종가' : '글가' }, { v: 이름, s: 굵 ? '글굵' : '글' }, { v: 규격, s: '글' },
      { v: m1, s: 굵 ? '금굵' : '금' }, { v: m2, s: 굵 ? '금굵' : '금' },
      { f: `IF(E${R}>D${R},E${R}-D${R},"")`, s: 굵 ? '금굵파' : '금파' }, { f: `IF(D${R}>E${R},D${R}-E${R},"")`, s: 굵 ? '금굵빨' : '금빨' },
      { f: `IF(D${R}=0,"",E${R}/D${R}-1)`, s: '율' }, { v: '', s: '글' }])
    R++
  }
  줄하나('', '순 공 사 비', '', 합[a][기준], 합[b][기준], true)
  줄.forEach((x, i) => {
    if (x.꼴 !== '공종') return
    const h = 공종합.get(i)
    줄하나(x.번호 || '', 들여(x) + x.이름, x.규격 || '', h[a][기준], h[b][기준], (x.깊이 || 0) <= 1)
  })
  return { 이름: '공사비증감대비표', 제목: '공 사 비 증 감 대 비 표', 부제: 모형.부제 || '', 너비: [7, 34, 20, 16, 16, 15, 15, 9, 14],
    머리: [['공종', '품    명', '규    격', 상태[a], 상태[b], '증(+)', '감(-)', '증감률', '비    고']], 줄: 줄들, 고정열: 2 }
}

/** 내역서총괄표 — 공종마다 고른 상태들의 합계 · 갈래 금액 */
export function 총괄시트(모형, 고른, { 색 = null } = {}) {
  const { 줄, 상태, 갈래 } = 모형
  const K = 고른.length
  const 고색 = 색맞춤(색)
  const 빨 = (k) => K > 1 && (k === 0 ? 고색.위 : 고색.아래) === '빨'
  const 칠 = (꼴, k) => 색꼴(꼴, 빨(k))
  const { 공종합, 합 } = 모으기(모형)
  const 머리 = ['공종', '품    명', '규    격', ...(K > 1 ? ['구 분'] : []), ...갈래.map((k) => (k === '합계' ? '합    계' : k)), '비    고']
  const 줄들 = []
  const 선 = (k) => (K === 1 ? '' : k === 0 ? '_위' : k === K - 1 ? '_아래' : '')
  const 넣 = (번호, 이름, 규격, 값들, 굵) => {
    고른.forEach((s, k) => {
      const 꾸 = (굵 ? '굵' : '') + (빨(k) ? '빨' : '')
      줄들.push([
        k === 0 ? { v: 번호, s: 칠((굵 ? '공종가' : '글가') + 선(k), k) } : { v: '', s: '글' + 선(k) },
        k === 0 ? { v: 이름, s: 칠((굵 ? '글굵' : '글') + 선(k), k) } : { v: '', s: '글' + 선(k) },
        k === 0 ? { v: 규격, s: 칠('글' + 선(k), k) } : { v: '', s: '글' + 선(k) },
        ...(K > 1 ? [{ v: 상태[s], s: 칠('글' + 선(k), k) }] : []),
        ...갈래.map((g) => ({ v: 값들[s][g] || 0, s: '금' + 꾸 + 선(k) })),
        { v: '', s: '글' + 선(k) },
      ])
    })
  }
  넣('', '순 공 사 비', '', 합, true)
  줄.forEach((x, i) => { if (x.꼴 === '공종') 넣(x.번호 || '', 들여(x) + x.이름, x.규격 || '', 공종합.get(i), (x.깊이 || 0) <= 1) })
  return { 이름: '내역서총괄표', 제목: '내 역 서 총 괄 표', 부제: 모형.부제 || '', 너비: [7, 34, 20, ...(K > 1 ? [12] : []), ...갈래.map(() => 16), 14], 머리: [머리], 줄: 줄들, 고정열: 2 }
}

/** 차수(연차)별 대비표 — 품목마다 모든 상태의 수량 · 금액을 옆으로 */
export function 차수대비시트(모형, 증감 = null) {
  const { 줄, 상태, 갈래 } = 모형
  const S = 상태.length
  const [ea, eb] = 증감 || [0, S - 1]
  const 기준 = 갈래.includes('합계') ? '합계' : 갈래[0]
  const { 공종합, 합 } = 모으기(모형)
  const 머리1 = ['공종', '품    명', '규    격', '단위', ...상태.flatMap((s) => [s, null]), `증감(${상태[eb]} − ${상태[ea]})`, null]
  const 머리2 = [null, null, null, null, ...상태.flatMap(() => ['수 량', '금 액']), '수 량', '금 액']
  const 병합 = ['A3:A4', 'B3:B4', 'C3:C4', 'D3:D4']
  for (let s = 0; s <= S; s++) 병합.push(열글(5 + s * 2) + '3:' + 열글(6 + s * 2) + '3')
  const 줄들 = []
  let R = 5
  const 끝수 = 열글(5 + eb * 2), 첫수 = 열글(5 + ea * 2), 끝금 = 열글(6 + eb * 2), 첫금 = 열글(6 + ea * 2)
  const 증감칸 = (굵) => [{ f: `${끝수}${R}-${첫수}${R}`, s: '수3' + (굵 ? '굵' : '') }, { f: `${끝금}${R}-${첫금}${R}`, s: '금' + (굵 ? '굵' : '') }]
  줄들.push(['', { v: '순 공 사 비', s: '글굵' }, '', '', ...상태.flatMap((_, s) => [{ v: '', s: '글' }, { v: 합[s][기준], s: '금굵' }]), { v: '', s: '글' }, { f: `${끝금}${R}-${첫금}${R}`, s: '금굵' }]); R++
  줄.forEach((x, i) => {
    if (x.꼴 === '계') return
    if (x.꼴 === '공종') {
      const h = 공종합.get(i)
      줄들.push([{ v: x.번호 || '', s: '공종가' }, { v: 들여(x) + x.이름, s: '공종' }, { v: x.규격 || '', s: '공종' }, { v: '', s: '공종' },
        ...상태.flatMap((_, s) => [{ v: '', s: '공종' }, { v: h[s][기준], s: '금굵' }]), { v: '', s: '공종' }, { f: `${끝금}${R}-${첫금}${R}`, s: '금굵' }])
      R++
      return
    }
    const 칸들 = 상태.flatMap((_, s) => {
      const c = 품목셈(x.값[s], 갈래)
      const q = c && c.수량 !== null ? c.수량 : 0
      return [{ v: q, s: 수꼴(q) + (s ? '빨' : '') }, { v: c ? c.금액[기준] || 0 : 0, s: '금' + (s ? '빨' : '') }]
    })
    줄들.push([{ v: x.번호 || '', s: '글가' }, { v: 들여(x) + x.이름, s: '글' }, { v: x.규격 || '', s: '글' }, { v: x.단위 || '', s: '글가' }, ...칸들, ...증감칸(false)])
    R++
  })
  return { 이름: '차수별대비표', 제목: '차 수 별 대 비 표', 부제: 모형.부제 || '', 너비: [6, 30, 20, 6, ...상태.flatMap(() => [10, 14]), 10, 14], 머리: [머리1, 머리2], 병합, 줄: 줄들, 고정열: 2 }
}

/** 검산 시트 */
export function 검산시트(말들) {
  const 줄들 = 말들.length
    ? 말들.map((m) => [{ v: m.무게, s: m.무게 === '확인' ? '글빨' : '글' }, m.파일 || '', m.r || '', m.상태 || '', m.이름 || '', m.무엇,
      { v: m.올린값 ?? '', s: '금' }, { v: m.셈값 ?? '', s: '금' }, { v: (m.셈값 ?? 0) - (m.올린값 ?? 0), s: '금' }])
    : [['', '', '', '', '', '틀린 곳이 없습니다 — 모든 품목의 금액이 «수량 × 단가(원 미만 버림)» 와 맞고, 공종 합계도 맞습니다.']]
  return {
    이름: '검산', 제목: '검    산', 부제: '확인 = 손으로 다시 보실 곳 · 참고 = 수량 칸이 비율(%)인 줄처럼 셈이 원래 다른 줄',
    너비: [7, 18, 7, 12, 30, 30, 15, 15, 13], 머리: [['무게', '파일', '원래 행', '상태', '품명', '무엇이', '올린 값', '다시 셈한 값', '차이']], 줄: 줄들, 세로: false,
  }
}

/* ═══════════════════════════ 한 번에 ═══════════════════════════ */

/**
 * 만들 것 → xlsx 바이트
 *   할것: { 한줄: 상태번호 | null, 여러줄: [상태번호] | null, 대비: [a,b] | null, 차수: bool, 총괄: [상태번호] | null, 검산: 말들 | null }
 */
export function 만들기(모형, 할것) {
  const 시트들 = []
  if (할것.한줄 !== null && 할것.한줄 !== undefined) {
    const s = 할것.한줄
    const 이름 = 모형.상태.length > 1 ? `내역서(${모형.상태[s]})` : '내역서'
    시트들.push(내역시트(모형, [s], { 제목: '내 역 서', 이름: 시트이름(이름), 빼기0: 할것.빼기0 === undefined ? null : 할것.빼기0 }))
  }
  if (할것.여러줄 && 할것.여러줄.length > 1) {
    시트들.push(내역시트(모형, 할것.여러줄, { 제목: 할것.여러줄.length === 2 ? '변 경 내 역 서' : '차 수 내 역 서', 이름: 할것.여러줄.length === 2 ? '변경내역서' : '차수내역서', 색: 할것.색 }))
  }
  if (할것.총괄) 시트들.push(총괄시트(모형, 할것.총괄, { 색: 할것.색 }))
  if (할것.대비) {
    시트들.push(증감대비시트(모형, 할것.대비[0], 할것.대비[1]))
    시트들.push(물량대비시트(모형, 할것.대비[0], 할것.대비[1]))
  }
  if (할것.차수 && 모형.상태.length > 2) 시트들.push(차수대비시트(모형, 할것.대비 || null))
  if (할것.검산) 시트들.push(검산시트(할것.검산))
  if (!시트들.length) throw new Error('만들 것을 하나 이상 고르십시오.')
  return 변경엑셀(시트들)
}

const 시트이름 = (s) => String(s).replace(/[\\/?*[\]:]/g, ' ').slice(0, 31)
