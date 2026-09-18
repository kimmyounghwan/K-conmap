/**
 * 비율.js — 내역서를 «비율» 로 맞춥니다 (2026-09-18)
 *
 * 소장님: 「내역서를 올리면 이 내역서를 80%에 맞춰서 하면 내역서가 자동으로 80%로
 *          맞춰지는 도구. 원가계산서, 내역서 등이 자동으로 되는 것. 만들어줘」
 *
 * ■ 무엇에 쓰나 — 셋 다 «같은 셈» 입니다
 *      하도급 내역서   도급 내역서 × 하도급률(예 80%)
 *      실행 내역서     도급 내역서 × 실행률(예 75%)
 *      계약 내역서     설계 내역서 × 낙찰률(예 87.745%)
 *
 * ■ 어디에 곱하나 — «단가» 에 곱합니다
 *    금액에만 곱하면 «단가 × 수량 ≠ 금액» 이 되어 서류가 반려됩니다.
 *    단가에 곱해 단수를 맞추고, 금액은 그 단가로 다시 셉니다.
 *    재료비·노무비·경비가 갈려 있으면 «갈래마다» 곱하고, 합계는 셋을 더해 만듭니다
 *    (합계에 따로 곱하면 재료+노무+경비 ≠ 합계 가 됩니다).
 *
 * ■ 두 가지로 내드립니다
 *    ① 올리신 엑셀 그대로 — 서식·인쇄영역·수식을 살린 채 «단가만» 갈아 끼웁니다
 *    ② 새 엑셀 한 벌 — 내역서 · 대비표(당초↔비율) · 원가계산서 · 시트별 집계 · 쓴표
 *
 * ■ 파일은 브라우저 안에서만 다룹니다. 아무것도 올라가지 않습니다.
 *
 * ⚠️ 비율이 낮으면 발주자의 «하도급계약 적정성 심사» 대상이 될 수 있습니다
 *    (건설산업기본법 제31조 · 같은 법 시행령 제34조). 기준 비율은 원문과
 *    발주처 지침을 확인하십시오 — 여기에 숫자를 적어 두지 않습니다.
 */
import { readWorkbook, writeWorkbook, ST, numToCol } from './qtoxlsx.js'
import { 원가계산서 } from './naeyeok.js'
import { unzipSync, zipSync, strToU8, strFromU8 } from 'fflate'

const txt = (x) => {
  if (x === null || x === undefined) return ''
  if (typeof x === 'number' && Number.isInteger(x)) return String(x)
  return String(x).trim()
}
const num = (x) => {
  const t = String(x === null || x === undefined ? '' : x).replace(/,/g, '').replace(/\s/g, '').trim()
  if (t === '') return null
  const v = Number(t)
  return Number.isFinite(v) ? v : null
}
/* 0.1+0.2 같은 부스러기를 떼어 냅니다 — 안 떼면 12,345.9999999 가 12,345 로 버려집니다 */
const 반듯 = (v) => Math.round(v * 1e6) / 1e6

/* ── 단수 처리 ────────────────────────────────────────────── */
export const 단수들 = [
  ['버림', '원 미만 버림 (기본)'],
  ['반올림', '원 미만 반올림'],
  ['10원버림', '10원 미만 버림'],
  ['100원버림', '100원 미만 버림'],
]
export function 단수(v, 꼴) {
  const x = 반듯(v)
  const 깎 = (t) => (x < 0 ? -Math.floor(-x / t) * t : Math.floor(x / t) * t)
  if (꼴 === '반올림') return Math.round(x)
  if (꼴 === '10원버림') return 깎(10)
  if (꼴 === '100원버림') return 깎(100)
  return 깎(1)
}

/* ── 머리글 ──────────────────────────────────────────────── */
const H_NAME = /^(품명|품명및규격|규격및품명|공종|공종명|공사명|명칭|품목|자재명|산출명|비목|목명|공종별명칭)$/
const H_SPEC = /^(규격|형식|규격및단위|규격단위|사양)$/
const H_UNIT = /^(단위|수량단위)$/
const H_QTY = /^(수량|물량|단위수량|계량)$/
const H_UP = /^단가$/
const H_AMT = /^(금액|금액원)$/
const G_MAT = /^재료비?$/
const G_LAB = /^노무비?$/
const G_EXP = /^경비$/
const G_SUM = /^(합계|계|합계금액|총계|소계)$/
/* 자료 줄이 아닌 것 — 소계·합계는 우리가 다시 셉니다 */
const NOT_ITEM = /^(합계|소계|총계|계|중계|이월|누계|재료비|노무비|경비|직접공사비|순공사원가|공사원가|비고|구분|번호|호표|산출내역|계정|공종)$/

export const 갈래차례 = ['재료비', '노무비', '경비', '합계']

/* ══════════════════════════════════════════════════════════
   ① 내역서 읽기
   ══════════════════════════════════════════════════════════ */

function 시트읽기(sheet, grid) {
  const N = (r) => (grid[r] || []).map((x) => txt(x).replace(/\s+/g, ''))
  let hi = -1
  for (let i = 0; i < Math.min(grid.length, 40); i++) {
    const c = N(i)
    if (c.some((x) => H_NAME.test(x)) && (c.some((x) => H_QTY.test(x)) || c.some((x) => H_AMT.test(x)))) {
      hi = i; break
    }
  }
  if (hi < 0) return { 시트: sheet, rows: [], 갈래: [], 까닭: '「품명 · 수량(또는 금액)」 머리글을 못 찾았습니다' }

  const c = N(hi)
  const sub = N(hi + 1)
  /* 머리글이 두 줄인 내역서 —  윗줄: 재료비 · 노무비 · 경비 · 합계
                              아랫줄: 단가 · 금액 · 단가 · 금액 … */
  const 아래머리 = sub.some((x) => H_UP.test(x)) && sub.some((x) => H_AMT.test(x)) &&
    !sub.some((x) => H_NAME.test(x))
  const 머리 = 아래머리 ? sub : c
  const 그룹행 = 아래머리 ? c : (hi > 0 ? N(hi - 1) : [])
  const 자료부터 = 아래머리 ? hi + 2 : hi + 1

  const 찾기 = (re) => {
    let j = c.findIndex((x) => re.test(x))
    if (j < 0 && 아래머리) j = sub.findIndex((x) => re.test(x))
    return j
  }
  const iN = 찾기(H_NAME), iS = 찾기(H_SPEC), iU = 찾기(H_UNIT), iQ = 찾기(H_QTY)

  /* 이 칸이 어느 갈래인가 — 왼쪽으로 걸어가며 «갈래 이름» 을 찾습니다.
     갈래가 아닌 글자(수량 같은 것)를 만나면 거기서 멈춥니다. 안 멈추면
     수량 왼쪽의 엉뚱한 갈래가 붙습니다. */
  const 라벨 = (j) => {
    for (let k = j; k >= 0; k--) {
      const g = 그룹행[k]
      if (!g) continue
      if (G_MAT.test(g)) return '재료비'
      if (G_LAB.test(g)) return '노무비'
      if (G_EXP.test(g)) return '경비'
      if (G_SUM.test(g)) return '합계'
      return null
    }
    return null
  }

  const 칸들 = []
  for (let j = 0; j < 머리.length; j++) {
    const h = 머리[j] || ''
    if (H_UP.test(h)) 칸들.push({ j, 꼴: '단가', g: 라벨(j) || '합계' })
    else if (H_AMT.test(h)) 칸들.push({ j, 꼴: '금액', g: 라벨(j) || '합계' })
  }
  const 갈래 = []
  for (const g of 갈래차례) {
    const u = 칸들.find((x) => x.g === g && x.꼴 === '단가')
    const a = 칸들.find((x) => x.g === g && x.꼴 === '금액')
    if (u || a) 갈래.push({ 이름: g, 단가칸: u ? u.j : -1, 금액칸: a ? a.j : -1 })
  }
  if (!갈래.length) return { 시트: sheet, rows: [], 갈래: [], 까닭: '「단가」나 「금액」 칸을 못 찾았습니다' }

  const 셋있나 = 갈래.some((g) => g.이름 !== '합계')
  const rows = []
  const 건너뛴줄 = []
  let 빈줄 = 0                     /* 이름은 있는데 단가·금액이 빈 줄 — 공내역서 */
  let 특수줄 = 0                   /* 금액 ≠ 수량 × 단가 인 줄 (아래 설명) */
  for (let r = 자료부터; r < grid.length; r++) {
    const row = grid[r] || []
    const nm = txt(row[iN])
    const 맨글 = nm.replace(/\s+/g, '')
    const q = iQ >= 0 ? num(row[iQ]) : null
    const 값 = {}
    let 있나 = false
    let 다곱셈 = true
    for (const g of 갈래) {
      const u = g.단가칸 >= 0 ? num(row[g.단가칸]) : null
      const a = g.금액칸 >= 0 ? num(row[g.금액칸]) : null
      /* ⚠️ 2026-09-18 — 「공구손료 및 경장비의 기계경비」 같은 줄이 있습니다.
            수량 칸에 «4» 가 적혀 있는데 그건 개수가 아니라 «4%» 이고,
            금액은 단가 × 4% 입니다. 수량 × 단가로 다시 세면 100배가 됩니다.
         → 올려 주신 금액이 «수량 × 단가» 와 맞는 줄만 다시 셉니다.
            안 맞는 줄은 그 관계를 그대로 두고 «금액에» 비율을 곱합니다. */
      const 곱셈 = u !== null && q !== null &&
        (a === null || Math.abs(u * q - a) <= Math.max(2, Math.abs(a) * 0.001))
      값[g.이름] = { 단가: u, 금액: a, 곱셈 }
      if (u !== null || a !== null) { 있나 = true; if (!곱셈) 다곱셈 = false }
    }
    if (!있나) { if (nm && !NOT_ITEM.test(맨글)) 빈줄++; continue }
    if (!nm || NOT_ITEM.test(맨글)) { 건너뛴줄.push({ 줄: r + 1, 이름: nm || '(빈 칸)' }); continue }
    if (!다곱셈) 특수줄++
    /* 합계 = 셋의 합 (갈래가 갈려 있으면). 합계 칸만 있으면 그것을 씁니다. */
    let 총단가 = 값['합계'] ? 값['합계'].단가 : null
    let 총금액 = 값['합계'] ? 값['합계'].금액 : null
    if (셋있나) {
      const su = 갈래차례.slice(0, 3).reduce((a, k) => a + (값[k] && 값[k].단가 !== null ? 값[k].단가 : 0), 0)
      const sa = 갈래차례.slice(0, 3).reduce((a, k) => a + (값[k] && 값[k].금액 !== null ? 값[k].금액 : 0), 0)
      if (총단가 === null && su) 총단가 = su
      if (총금액 === null && sa) 총금액 = sa
    }
    if (총금액 === null && 총단가 !== null && q !== null) 총금액 = 반듯(총단가 * q)
    rows.push({
      공종: nm,
      규격: iS >= 0 ? txt(row[iS]) : '',
      단위: iU >= 0 ? txt(row[iU]) : '',
      수량: q, 값, 총단가, 총금액, 곱셈: 다곱셈, 시트: sheet, 줄: r + 1,
    })
  }
  const 합 = rows.reduce((a, x) => a + (x.총금액 || 0), 0)
  return {
    시트: sheet, rows, 갈래, 건너뛴줄, 빈줄, 특수줄, 합,
    칸: { iN, iS, iU, iQ }, 머리줄: hi + 1, 자료부터: 자료부터 + 1,
    까닭: rows.length ? ''
      : (빈줄 ? '단가·금액이 비어 있습니다 — «공내역서» 로 보입니다 (' + 빈줄 + '줄)'
        : '머리글은 찾았는데 자료 줄이 없습니다'),
  }
}

/** .xlsx 바이트 -> 시트마다 내역 줄 */
export function readNaeyeok(bytes, name) {
  const wb = readWorkbook(bytes)
  const 시트들 = []
  const 시트말 = []
  for (const [sheet, grid] of Object.entries(wb)) {
    if (!grid || !grid.length) { 시트말.push(sheet + ': 빈 시트'); continue }
    const got = 시트읽기(sheet, grid)
    if (got.rows.length) {
      시트들.push(got)
      시트말.push(sheet + ': ' + got.rows.length + '줄' +
        (got.갈래.length > 1 ? ' · ' + got.갈래.map((g) => g.이름).join('+') : ''))
    } else 시트말.push(sheet + ': ' + (got.까닭 || '표를 못 찾음'))
  }
  if (!시트들.length) {
    if (/공내역서/.test(시트말.join(' '))) {
      throw new Error('단가가 «비어 있는» 공내역서입니다. 비율을 맞출 금액이 없습니다 — ' +
        '단가가 채워진 내역서(설계·도급·산출내역서)를 올려 주십시오.  (' + 시트말.slice(0, 6).join(' / ') + ')')
    }
    throw new Error('내역서 표를 못 찾았습니다. 「품명 · 수량 · 단가 · 금액」 칸이 있는 엑셀이어야 합니다.  (' +
      시트말.slice(0, 6).join(' / ') + ')')
  }
  return 모으기({ name: name || '내역서.xlsx', 시트말, 온시트: 시트들 }, 시트들)
}

/* 고른 시트만으로 «합계·갈래합» 을 다시 냅니다 */
function 모으기(바탕, 시트들) {
  const rows = 시트들.flatMap((s) => s.rows)
  const 합 = rows.reduce((a, r) => a + (r.총금액 || 0), 0)
  const 갈래합 = {}
  for (const k of 갈래차례) {
    갈래합[k] = rows.reduce((a, r) => a + (r.값[k] && r.값[k].금액 !== null ? r.값[k].금액
      : (r.값[k] && r.값[k].단가 !== null && r.수량 !== null ? 반듯(r.값[k].단가 * r.수량) : 0)), 0)
  }
  return {
    ...바탕, 시트들, rows, 합, 갈래합,
    셋있나: 시트들.some((s) => s.갈래.some((g) => g.이름 !== '합계')),
    특수줄: 시트들.reduce((a, s) => a + (s.특수줄 || 0), 0),
  }
}

/** 고른 시트만 남긴 «읽은 것» 을 새로 냅니다 (화면에서 시트를 켜고 끕니다) */
export function 시트고르기(읽은, 이름들) {
  const 있나 = new Set(이름들 || [])
  const 온시트 = 읽은.온시트 || 읽은.시트들
  return 모으기(읽은, 온시트.filter((s) => 있나.has(s.시트)))
}

/* ⚠️ 2026-09-18 — 산출내역서 한 벌에는 «내역서» 말고도 일위대가·단가산출·중기단가가
   같이 들어 있습니다. 전부 더하면 일위대가가 내역서 단가 속에 또 들어가 «두 번» 세어집니다.
   그래서 내역서다운 시트만 처음에 켜 두고, 나머지는 사람이 켜게 둡니다. */
const 내역다움 = /내역/
const 내역아님 = /일위|단가|중기|기계경비|노임|자재|총괄|품셈|산출근거|수량산출|공정|목차|안내|표지/

/** 처음에 켜 둘 시트 이름들 */
export function 고를만한시트(시트들) {
  const 좋 = 시트들.filter((s) => 내역다움.test(s.시트) && !내역아님.test(s.시트))
  if (좋.length) return 좋.map((s) => s.시트)
  if (시트들.length <= 1) return 시트들.map((s) => s.시트)
  let 큰 = 시트들[0]
  for (const s of 시트들) if ((s.합 || 0) > (큰.합 || 0)) 큰 = s
  return [큰.시트]
}

/* ══════════════════════════════════════════════════════════
   ② 비율 맞추기

   ■ 비율을 «정하는» 두 가지 길
     · 비율(%)을 넣으면 그대로 곱합니다
     · 맞출 금액을 넣으면 비율을 거꾸로 셉니다  비율 = 맞출금액 ÷ 당초합계
       「노무비는 그대로」 를 켜면 노무비를 뺀 나머지로만 셈합니다 —
          맞출금액 = 노무비합 + 비율 × (나머지합)
   ■ 단수를 깎으므로 «줄마다 조금씩» 모자랍니다. 그 모자란 것을 숨기지 않고
     검산에 적고, 원하시면 「단수조정」 한 줄로 정확히 맞춥니다.
   ══════════════════════════════════════════════════════════ */

/** 읽은 것 + 설정 -> 비율을 맞춘 줄들 */
export function 맞추기(읽은, 옵션) {
  const { 단수꼴 = '버림', 노무고정 = false } = 옵션 || {}
  const 원합 = 읽은.합
  if (!(원합 > 0)) {
    throw new Error('켜 두신 시트의 당초 금액 합계가 «0» 입니다. ' +
      '다른 시트를 켜 보시거나(단가가 든 시트), 단가가 채워진 내역서를 올려 주십시오.')
  }

  /* 노무비 합 — 「노무비는 그대로」 를 켰을 때 비율에서 빼 놓을 몫 */
  const 노무합 = 읽은.rows.reduce((a, r) => {
    const v = r.값['노무비']
    if (!v) return a
    if (v.금액 !== null) return a + v.금액
    if (v.단가 !== null && r.수량 !== null) return a + 반듯(v.단가 * r.수량)
    return a
  }, 0)

  let r = null, 목표 = null
  if (옵션 && 옵션.목표 > 0) {
    목표 = 옵션.목표
    if (노무고정) {
      const 나머지 = 원합 - 노무합
      if (!(나머지 > 0)) throw new Error('노무비를 빼면 곱할 것이 남지 않습니다. 「노무비는 그대로」 를 꺼 주십시오.')
      r = (목표 - 노무합) / 나머지
      if (r <= 0) throw new Error('맞출 금액이 노무비 합계(' + Math.round(노무합).toLocaleString('ko-KR') +
        '원)보다 적습니다. 「노무비는 그대로」 로는 맞출 수 없습니다.')
    } else r = 목표 / 원합
  } else {
    const p = Number(옵션 && 옵션.비율)
    if (!Number.isFinite(p) || p <= 0) throw new Error('비율(%) 또는 맞출 금액을 넣어 주십시오.')
    r = p / 100
  }

  const rows = 읽은.rows.map((x) => {
    const 값 = {}
    let 있는갈래 = false
    for (const k of 갈래차례.slice(0, 3)) {
      const v = x.값[k]
      if (!v) continue
      있는갈래 = true
      const rr = (노무고정 && k === '노무비') ? 1 : r
      const 단가 = v.단가 === null ? null : 단수(v.단가 * rr, 단수꼴)
      let 금액 = null
      if (v.곱셈 && 단가 !== null && x.수량 !== null) 금액 = 단수(단가 * x.수량, 단수꼴)
      else if (v.금액 !== null) 금액 = 단수(v.금액 * rr, 단수꼴)
      else if (단가 !== null && x.수량 !== null) 금액 = 단수(단가 * x.수량, 단수꼴)
      값[k] = { 단가, 금액, 곱셈: !!v.곱셈 }
    }
    let 총단가 = null, 총금액 = null
    if (있는갈래) {
      /* ⚠️ 합계는 «따로 곱하지» 않습니다. 셋을 더해 만듭니다 —
            따로 곱하면 재료+노무+경비 ≠ 합계 가 되어 검사에서 걸립니다. */
      const u = 갈래차례.slice(0, 3).reduce((a, k) => a + (값[k] && 값[k].단가 !== null ? 값[k].단가 : 0), 0)
      const a2 = 갈래차례.slice(0, 3).reduce((a, k) => a + (값[k] && 값[k].금액 !== null ? 값[k].금액 : 0), 0)
      총단가 = u || null
      총금액 = a2
    } else {
      const v = x.값['합계'] || {}
      총단가 = v.단가 === null || v.단가 === undefined ? null : 단수(v.단가 * r, 단수꼴)
      if (v.곱셈 && 총단가 !== null && x.수량 !== null) 총금액 = 단수(총단가 * x.수량, 단수꼴)
      else if (v.금액 !== null && v.금액 !== undefined) 총금액 = 단수(v.금액 * r, 단수꼴)
      else if (총단가 !== null && x.수량 !== null) 총금액 = 단수(총단가 * x.수량, 단수꼴)
    }
    값['합계'] = { 단가: 총단가, 금액: 총금액, 곱셈: 있는갈래 ? true : !!(x.값['합계'] && x.값['합계'].곱셈) }
    return { ...x, 새값: 값, 새단가: 총단가, 새금액: 총금액 === null ? 0 : 총금액 }
  })

  const 합 = rows.reduce((a, x) => a + (x.새금액 || 0), 0)
  const 갈래합 = {}
  for (const k of 갈래차례) {
    갈래합[k] = rows.reduce((a, x) => a + (x.새값[k] && x.새값[k].금액 !== null ? x.새값[k].금액 : 0), 0)
  }
  return {
    rows, 비율: r, 목표, 단수꼴, 노무고정, 노무합,
    원합, 합, 갈래합,
    차액: 목표 === null ? 0 : 목표 - 합,
    실비율: 원합 > 0 ? 합 / 원합 : 0,
  }
}

/* ══════════════════════════════════════════════════════════
   ③ 새 엑셀 한 벌 — 내역서 · 대비표 · 원가계산서 · 시트별 집계 · 쓴표
   ══════════════════════════════════════════════════════════ */

/* 엑셀에서도 «같은 단수» 로 깎도록 함수 이름을 골라 줍니다.
   ROUNDDOWN 은 0 쪽으로 깎습니다 — 이 파일의 단수() 와 같습니다. */
function 엑셀단수(식, 꼴) {
  if (꼴 === '반올림') return 'ROUND(' + 식 + ',0)'
  if (꼴 === '10원버림') return 'ROUNDDOWN(' + 식 + ',-1)'
  if (꼴 === '100원버림') return 'ROUNDDOWN(' + 식 + ',-2)'
  return 'ROUNDDOWN(' + 식 + ',0)'
}
const 돈 = (n) => new Intl.NumberFormat('ko-KR').format(Math.round(n))

export function toBiyulXlsx(읽은, 결과, 옵션) {
  const { 단수조정 = false, 원본이름 = '', 일감 = '' } = 옵션 || {}
  const 셋 = 읽은.셋있나
  const 쓸갈래 = 셋 ? ['재료비', '노무비', '경비', '합계'] : ['합계']
  const sheets = []

  /* ── ① 내역서 ── */
  const head = ['공종', '규격', '단위', '수량']
  for (const g of 쓸갈래) head.push(g + ' 단가', g + ' 금액')
  head.push('가져온 시트', '가져온 줄')
  const 단가칸 = {}, 금액칸 = {}
  쓸갈래.forEach((g, i) => { 단가칸[g] = numToCol(5 + i * 2); 금액칸[g] = numToCol(6 + i * 2) })

  const r1 = 결과.rows.map((x, i) => {
    const r = i + 2
    const out = [x.공종, x.규격, x.단위, x.수량 === null ? '' : { v: x.수량, st: ST.QTY }]
    for (const g of 쓸갈래) {
      const v = x.새값[g] || {}
      if (g === '합계' && 셋) {
        /* 합계 = 재료+노무+경비 — 살아 있는 수식으로 둡니다 */
        out.push({ f: ['재료비', '노무비', '경비'].map((k) => 단가칸[k] + r).join('+'), st: ST.INT })
        out.push({ f: ['재료비', '노무비', '경비'].map((k) => 금액칸[k] + r).join('+'), st: ST.INT })
      } else {
        out.push(v.단가 === null || v.단가 === undefined ? '' : { v: v.단가, st: ST.INT })
        /* ⚠️ «수량 × 단가 = 금액» 인 줄만 살아 있는 수식으로 둡니다.
              요율 줄(공구손료 등)은 그 관계가 아니라서 수식으로 만들면 100배가 됩니다. */
        if (v.곱셈 && v.단가 !== null && v.단가 !== undefined && x.수량 !== null) {
          out.push({ f: 엑셀단수('D' + r + '*' + 단가칸[g] + r, 결과.단수꼴), st: ST.INT })
        } else out.push(v.금액 === null || v.금액 === undefined ? '' : { v: v.금액, st: ST.INT })
      }
    }
    out.push({ v: x.시트, st: ST.GRAY }, { v: x.줄, st: ST.GRAY })
    return out
  })

  let 끝 = 결과.rows.length + 1
  /* 단수조정 — 맞출 금액에 «정확히» 맞추려고 넣는 한 줄.
     ⚠️ 합계 칸에만 넣으면 «재료+노무+경비 ≠ 합계» 가 됩니다. 첫 갈래에 넣고
        합계는 여느 줄처럼 셋을 더해 만듭니다. 원가계산서도 같은 값을 받습니다. */
  const 조정 = (단수조정 && 결과.차액 !== 0) ? 결과.차액 : 0
  const 첫갈래 = 쓸갈래.find((g) => g !== '합계') || '합계'
  if (조정) {
    끝 += 1
    const r = 끝
    const one = ['단수조정', '맞출 금액에 정확히 맞추기 위한 조정', '식', '']
    쓸갈래.forEach((g) => {
      one.push('')
      if (g === '합계' && 셋) {
        one.push({ f: ['재료비', '노무비', '경비'].map((k) => 금액칸[k] + r).join('+'), st: ST.INT })
      } else if (g === 첫갈래) one.push({ v: 조정, st: ST.INT })
      else one.push('')
    })
    one.push({ v: '(이 줄은 도구가 넣었습니다)', st: ST.RED }, '')
    r1.push(one)
  }
  const 총 = ['합  계', '', '', '']
  쓸갈래.forEach((g) => {
    총.push('')
    총.push({ f: 'SUM(' + 금액칸[g] + '2:' + 금액칸[g] + Math.max(끝, 2) + ')', st: ST.INT })
  })
  총.push('', '')
  총[0] = { v: '합  계', st: ST.HEAD }
  r1.push(총)
  sheets.push({
    name: '내역서', head, rows: r1,
    widths: [30, 22, 7, 12].concat(쓸갈래.flatMap(() => [13, 15])).concat([14, 9]),
  })

  /* ── ② 대비표 — 당초 ↔ 비율 ── */
  const h2 = ['공종', '규격', '단위', '수량', '당초 단가', '당초 금액', '비율 단가', '비율 금액',
    '증감 (비율−당초)', '시트', '줄']
  const r2 = 결과.rows.map((x, i) => {
    const r = i + 2
    return [
      x.공종, x.규격, x.단위, x.수량 === null ? '' : { v: x.수량, st: ST.QTY },
      x.총단가 === null ? '' : { v: x.총단가, st: ST.INT },
      x.총금액 === null ? '' : { v: x.총금액, st: ST.INT },
      x.새단가 === null ? '' : { v: x.새단가, st: ST.INT },
      { v: x.새금액, st: ST.INT },
      { f: 'H' + r + '-F' + r, st: ST.INT },
      { v: x.시트, st: ST.GRAY }, { v: x.줄, st: ST.GRAY },
    ]
  })
  const n2 = 결과.rows.length + 1
  r2.push([{ v: '합  계', st: ST.HEAD }, '', '', '', '',
    { f: 'SUM(F2:F' + Math.max(n2, 2) + ')', st: ST.INT }, '',
    { f: 'SUM(H2:H' + Math.max(n2, 2) + ')', st: ST.INT },
    { f: 'SUM(I2:I' + Math.max(n2, 2) + ')', st: ST.INT }, '', ''])
  sheets.push({ name: '대비표', head: h2, rows: r2, widths: [28, 20, 7, 12, 13, 15, 13, 15, 15, 14, 7] })

  /* ── ③ 원가계산서 ── */
  /* 갈래가 갈려 있으면 «비율을 맞춘» 재료비·노무비·경비를 그대로 넣습니다.
     안 갈려 있으면 노란 칸(0)으로 두어 손으로 넣게 합니다 — 지어내지 않습니다. */
  sheets.push(원가계산서(셋 ? {
    직재: (결과.갈래합['재료비'] || 0) + (첫갈래 === '재료비' ? 조정 : 0),
    직노: (결과.갈래합['노무비'] || 0) + (첫갈래 === '노무비' ? 조정 : 0),
    직경: (결과.갈래합['경비'] || 0) + (첫갈래 === '경비' ? 조정 : 0),
  } : {}))

  /* ── ④ 시트별 집계 ── */
  const 집 = 읽은.시트들.map((s) => {
    const 당초 = s.rows.reduce((a, x) => a + (x.총금액 || 0), 0)
    const 뒤 = 결과.rows.filter((x) => x.시트 === s.시트).reduce((a, x) => a + (x.새금액 || 0), 0)
    return [s.시트, s.rows.length, { v: Math.round(당초), st: ST.INT }, { v: 뒤, st: ST.INT },
      { v: 뒤 - Math.round(당초), st: ST.INT },
      { v: 당초 > 0 ? Math.round((뒤 / 당초) * 10000) / 100 + '%' : '', st: ST.GRAY }]
  })
  sheets.push({
    name: '시트별 집계',
    head: ['시트', '줄 수', '당초 금액', '비율 금액', '차액', '실제 비율'],
    rows: 집.length ? 집 : [['(없음)', 0, 0, 0, 0, '']],
    widths: [24, 9, 16, 16, 15, 11],
  })

  /* ── ⑤ 쓴표 ── */
  const now = new Date()
  const pad = (x) => String(x).padStart(2, '0')
  const when = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()) +
    ' ' + pad(now.getHours()) + ':' + pad(now.getMinutes())
  const 쓴 = [
    ['만든 때', when],
    ['올린 내역서', 원본이름 || 읽은.name],
    ['쓰임', 일감 || '(안 적음)'],
    ['', ''],
    ['비율', (Math.round(결과.비율 * 1000000) / 10000) + ' %'],
    ['맞출 금액', 결과.목표 === null ? '(안 넣음 — 비율만 곱했습니다)' : 돈(결과.목표) + ' 원'],
    ['단수 처리', (단수들.find((x) => x[0] === 결과.단수꼴) || ['', ''])[1] || 결과.단수꼴],
    ['노무비는 그대로', 결과.노무고정 ? '예 — 노무비에는 비율을 곱하지 않았습니다' : '아니오'],
    ['', ''],
    ['당초 합계', 돈(결과.원합) + ' 원'],
    ['비율 합계', 돈(결과.합) + ' 원'],
    ['실제 비율', (Math.round(결과.실비율 * 1000000) / 10000) + ' % (단수를 깎아 넣은 비율과 조금 다릅니다)'],
    ['차액', 결과.목표 === null ? '(맞출 금액을 안 넣었습니다)'
      : (돈(결과.차액) + ' 원' + (단수조정 && 결과.차액 !== 0 ? ' — 「단수조정」 줄로 맞췄습니다' : ' — 줄마다 단수를 깎아 생긴 것입니다'))],
    ['내역 줄', 결과.rows.length],
    ['수량×단가 ≠ 금액 인 줄', (읽은.특수줄 || 0) +
      '줄 — 「공구손료 및 경장비의 기계경비」처럼 수량 칸이 요율(%)인 줄이거나 금액만 적힌 줄입니다.'],
    ['', '그 줄은 다시 곱하지 않고 «금액에 바로» 비율을 곱했습니다. 엑셀에서도 수식이 아니라 값입니다.'],
    ['', ''],
    ['⚠️ 어디에 곱했나', '«단가» 에 곱하고 금액을 다시 셌습니다. 금액에만 곱하면 단가×수량≠금액 이 되어'],
    ['', '서류가 반려됩니다. 재료비·노무비·경비가 갈려 있으면 갈래마다 곱하고,'],
    ['', '합계는 셋을 더해 만들었습니다(합계에 따로 곱하지 않았습니다).'],
    ['⚠️ 원가계산서', 읽은.셋있나
      ? '재료비·노무비·경비를 내역서에서 그대로 받았습니다. 요율(노란 칸)은 반드시 맞춰 보십시오.'
      : '올리신 내역서에 재료비·노무비·경비 갈래가 없어 «0» 으로 두었습니다 — 손으로 넣으십시오.'],
    ['', '요율은 2026년 조달청 공고 내역서에서 옮긴 값입니다. 해마다·공사 종류마다 다릅니다.'],
    ['⚠️ 하도급', '비율이 낮으면 발주자의 «하도급계약 적정성 심사» 대상이 될 수 있습니다'],
    ['', '(건설산업기본법 제31조 · 같은 법 시행령 제34조). 기준 비율은 원문과 발주처 지침을 보십시오.'],
    ['⚠️ 노무비', '노무비를 깎는 것은 다툼이 되기 쉽습니다. 「노무비는 그대로」 를 켜면'],
    ['', '노무비에는 비율을 곱하지 않고 나머지로만 맞춥니다.'],
    ['⚠️ 이 파일', '서식은 우리 서식입니다. 발주처 서식이 따로 있으면 값만 옮겨 쓰십시오.'],
    ['', '올리신 엑셀 그대로가 필요하시면 «원본 그대로 고치기» 로 받으십시오.'],
  ]
  sheets.push({ name: '쓴표', head: ['항목', '값'], rows: 쓴, widths: [20, 82], freeze: false })

  return writeWorkbook(sheets)
}

/* ══════════════════════════════════════════════════════════
   ④ 올리신 엑셀 «그대로» 고치기

   ■ 왜 이 길이 따로 있나
     새 엑셀은 우리 서식입니다. 그런데 현장 내역서는 **서식이 생명** 이라
     인쇄영역·병합·도장칸이 바뀌면 다시 안 씁니다. 그래서 zip(=xlsx) 안에서
     «단가 칸 하나하나» 만 갈아 끼우고 나머지는 원본 그대로 둡니다.

   ■ 금액 칸은 되도록 «건드리지 않습니다»
     금액이 =D12*E12 같은 수식이면 단가만 갈면 저절로 다시 셈됩니다.
     숫자로 박혀 있거나 남의 시트를 가리키는 수식이면 그때만 값을 넣습니다.

   ■ 못 하는 것 — 숨기지 않고 돌려 드립니다
     · 줄을 새로 넣지 못합니다 → 「단수조정」 한 줄은 새 엑셀 쪽에만 있습니다
     · 소계·합계 줄이 «숫자로 박혀» 있으면 그대로 남습니다 (검산에 적어 드립니다)
     · 구형 .xls 는 안 됩니다
   ══════════════════════════════════════════════════════════ */

const 속성 = (tag, name) => {
  const m = new RegExp('\\s' + name + '="([^"]*)"').exec(tag)
  return m ? m[1] : null
}
const CELL_RE = /<c\b[^>]*\/>|<c\b[^>]*>[\s\S]*?<\/c>/g
const ROW_RE = /<row\b[^>]*\/>|<row\b[^>]*>[\s\S]*?<\/row>/g

/** 수식이 그 칸(예 E12)을 가리키나 */
function 가리키나(f, col, rn) {
  return new RegExp('(^|[^A-Za-z0-9_])\\$?' + col + '\\$?' + rn + '(?![0-9])').test(f)
}

/** 시트 이름 -> zip 안의 경로 */
function 시트경로(zip) {
  const wbx = strFromU8(zip['xl/workbook.xml'])
  const rels = {}
  const rf = zip['xl/_rels/workbook.xml.rels']
  if (rf) {
    const rx = strFromU8(rf)
    for (const m of rx.match(/<Relationship\b[^>]*\/?>/g) || []) {
      const id = 속성(m, 'Id')
      let t = 속성(m, 'Target')
      if (!id || !t) continue
      t = t.replace(/^\//, '').replace(/^xl\//, '')
      rels[id] = 'xl/' + t
    }
  }
  const out = {}
  let i = 0
  for (const m of wbx.match(/<sheet\b[^>]*\/?>/g) || []) {
    i++
    const nm = String(속성(m, 'name') || ('시트' + i))
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'").replace(/&amp;/g, '&').trim()
    const rid = 속성(m, 'r:id') || 속성(m, 'id')
    out[nm] = (rid && rels[rid]) || ('xl/worksheets/sheet' + i + '.xml')
  }
  return out
}

export function 원본고치기(buf, 읽은, 결과) {
  let zip
  try { zip = unzipSync(new Uint8Array(buf)) } catch (e) {
    throw new Error('엑셀 파일을 열지 못했습니다. .xls 는 엑셀에서 «다른 이름으로 저장 → xlsx» 한 뒤 올려 주십시오.')
  }
  if (!zip['xl/workbook.xml']) throw new Error('엑셀(.xlsx) 파일이 아닙니다.')
  const 경로 = 시트경로(zip)
  const 고친것 = { 칸: 0, 지운수식: 0, 지킨수식: 0, 못찾은칸: 0 }
  const 경고 = []

  /* 줄 -> 갈 칸들 */
  const 바꾼줄 = new Map()
  for (const x of 결과.rows) {
    const s = 읽은.시트들.find((y) => y.시트 === x.시트)
    if (!s) continue
    const key = x.시트
    if (!바꾼줄.has(key)) 바꾼줄.set(key, new Map())
    const 표 = 바꾼줄.get(key)
    if (!표.has(x.줄)) 표.set(x.줄, [])
    const 일 = 표.get(x.줄)
    /* 「합계」 칸은 «재료+노무+경비» 를 더하는 수식인 경우가 많습니다.
       그 수식도 살려 둡니다 — 우리가 값으로 덮으면 살아 있던 표가 죽습니다. */
    const 셋칸 = s.갈래.filter((g) => g.이름 !== '합계')
    for (const g of s.갈래) {
      const 옛 = x.값[g.이름] || {}
      const 새 = x.새값[g.이름] || {}
      const uCol = g.단가칸 >= 0 ? numToCol(g.단가칸 + 1) : null
      const aCol = g.금액칸 >= 0 ? numToCol(g.금액칸 + 1) : null
      const 합칸 = g.이름 === '합계' && 셋칸.length > 0
      const 셈 = (뽑기) => 셋칸.filter((z) => 뽑기(z) >= 0).map((z) => ({ col: numToCol(뽑기(z) + 1), rn: x.줄 }))
      if (uCol && 옛.단가 !== null && 옛.단가 !== undefined && 새.단가 !== null && 새.단가 !== undefined) {
        const 지킬 = 합칸 ? 셈((z) => z.단가칸) : null
        일.push({ ref: uCol + x.줄, v: 새.단가, 지킬: 지킬 && 지킬.length ? 지킬 : null })
      }
      if (aCol && 옛.금액 !== null && 옛.금액 !== undefined && 새.금액 !== null && 새.금액 !== undefined) {
        let 지킬 = 합칸 ? 셈((z) => z.금액칸) : []
        if (uCol) 지킬 = 지킬.concat([{ col: uCol, rn: x.줄 }])
        일.push({ ref: aCol + x.줄, v: 새.금액, 지킬: 지킬.length ? 지킬 : null })
      }
    }
  }

  for (const s of 읽은.시트들) {
    const path = 경로[s.시트]
    if (!path || !zip[path]) { 경고.push([s.시트, '시트를 zip 안에서 못 찾아 손대지 않았습니다']); continue }
    const 표 = 바꾼줄.get(s.시트) || new Map()
    /* 소계·합계처럼 «건너뛴 줄» 에 숫자가 박혀 있는지 봅니다 */
    const 건너뛴 = new Map((s.건너뛴줄 || []).map((x) => [x.줄, x.이름]))
    const 금액칸들 = new Set(s.갈래.filter((g) => g.금액칸 >= 0).map((g) => numToCol(g.금액칸 + 1)))
    const 단가칸들 = new Set(s.갈래.filter((g) => g.단가칸 >= 0).map((g) => numToCol(g.단가칸 + 1)))
    const 굳은줄 = []
    const xml = strFromU8(zip[path])
    const 새xml = xml.replace(ROW_RE, (rm) => {
      const rn = +(속성(rm, 'r') || 0)
      const 일 = 표.get(rn)
      const 볼까 = 건너뛴.has(rn)
      if (!일 && !볼까) return rm
      const 지도 = new Map((일 || []).map((j) => [j.ref, j]))
      let 본칸 = 0
      const out = rm.replace(CELL_RE, (cell) => {
        const ref = 속성(cell, 'r')
        if (!ref) return cell
        if (볼까) {
          const col = /^([A-Z]+)/.exec(ref)
          if (col && (금액칸들.has(col[1]) || 단가칸들.has(col[1])) && !/<f[\s>]/.test(cell) && /<v>/.test(cell)) {
            const v = /<v>([\s\S]*?)<\/v>/.exec(cell)
            if (v && Number.isFinite(Number(v[1])) && Number(v[1]) !== 0) 굳은줄.push([rn, 건너뛴.get(rn)])
          }
        }
        const job = 지도.get(ref)
        if (!job) return cell
        본칸++
        const fm = /<f[^>]*>([\s\S]*?)<\/f>/.exec(cell)
        if (job.지킬 && fm && job.지킬.some((z) => 가리키나(fm[1], z.col, z.rn))) {
          /* 수식은 그대로 두고 «셈해 둔 값» 만 새것으로 갈아 둡니다.
             엑셀은 열 때 어차피 다시 셉니다(fullCalcOnLoad). 그런데 미리보기나
             다시 셈하지 않는 뷰어에서는 옛 금액이 그대로 보입니다 — 그걸 막습니다. */
          고친것.지킨수식++
          if (/<v>[\s\S]*?<\/v>/.test(cell)) return cell.replace(/<v>[\s\S]*?<\/v>/, '<v>' + job.v + '</v>')
          if (/<\/c>$/.test(cell)) return cell.replace(/<\/c>$/, '<v>' + job.v + '</v></c>')
          return cell
        }
        if (fm) 고친것.지운수식++
        const st = /\ss="(\d+)"/.exec(cell)
        고친것.칸++
        return '<c r="' + ref + '"' + (st ? ' s="' + st[1] + '"' : '') + '><v>' + job.v + '</v></c>'
      })
      if (일) 고친것.못찾은칸 += 일.length - 본칸
      return out
    })
    zip[path] = strToU8(새xml)
    if (굳은줄.length) {
      const 줄들 = [...new Set(굳은줄.map((x) => x[0]))].slice(0, 12)
      경고.push([s.시트, '소계·합계처럼 보이는 줄 ' + [...new Set(굳은줄.map((x) => x[0]))].length +
        '곳에 «수식이 아닌 숫자» 가 박혀 있습니다 — 그 줄은 당초 금액 그대로입니다 (' +
        줄들.join('행, ') + '행). 엑셀에서 그 줄만 다시 더해 주십시오.'])
    }
  }
  for (const 말 of 읽은.시트말) {
    if (!/: \d+줄/.test(말)) 경고.push([말.split(':')[0], '내역 표를 못 찾아 손대지 않았습니다'])
  }

  /* 엑셀이 열 때 «전부 다시 셈» 하게 합니다 — 남아 있는 수식의 옛 값을 씻어 냅니다 */
  let wbx = strFromU8(zip['xl/workbook.xml'])
  if (/<calcPr\b[^>]*\/>/.test(wbx)) wbx = wbx.replace(/<calcPr\b[^>]*\/>/, '<calcPr calcId="0" fullCalcOnLoad="1"/>')
  else if (/<calcPr\b[^>]*>[\s\S]*?<\/calcPr>/.test(wbx)) wbx = wbx.replace(/<calcPr\b[^>]*>[\s\S]*?<\/calcPr>/, '<calcPr calcId="0" fullCalcOnLoad="1"/>')
  else wbx = wbx.replace('</workbook>', '<calcPr calcId="0" fullCalcOnLoad="1"/></workbook>')
  zip['xl/workbook.xml'] = strToU8(wbx)

  /* 수식을 지웠으므로 calcChain 은 어긋납니다 — 지웁니다(엑셀이 다시 만듭니다) */
  if (zip['xl/calcChain.xml']) {
    delete zip['xl/calcChain.xml']
    if (zip['[Content_Types].xml']) {
      zip['[Content_Types].xml'] = strToU8(strFromU8(zip['[Content_Types].xml'])
        .replace(/<Override\b[^>]*calcChain\.xml[^>]*\/>/g, ''))
    }
    if (zip['xl/_rels/workbook.xml.rels']) {
      zip['xl/_rels/workbook.xml.rels'] = strToU8(strFromU8(zip['xl/_rels/workbook.xml.rels'])
        .replace(/<Relationship\b[^>]*calcChain\.xml[^>]*\/>/g, ''))
    }
  }

  return { bytes: zipSync(zip, { level: 6 }), ...고친것, 경고 }
}
