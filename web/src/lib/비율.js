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

/* ⚠️ 2026-09-18 — 소장님: 「프로그램이 엑셀에서 퍼센트만 조절하게 해주면
   자동으로 모든게 맞춘비율로 바뀌는 거지. 이것만 해주면 돼」
   → 비율을 «값으로 박지» 않습니다. 「비율」 시트의 노란 칸 하나를 보게 하고,
     단가·금액·원가계산서를 전부 그 칸을 보는 «살아 있는 수식» 으로 넣습니다.
     당초 단가·금액은 숨긴 칸에 남겨 둡니다 — 그게 있어야 다시 곱할 수 있습니다.
   ⚠️ 비율은 «80 = 80%» 로 적습니다(백분율 서식이 아니라 그냥 숫자).
      올리신 원본 엑셀에도 같은 방식으로 붙이기 때문에 두 파일이 같은 꼴이라야 합니다. */
export function toBiyulXlsx(읽은, 결과, 옵션) {
  const { 단수조정 = false, 원본이름 = '', 일감 = '' } = 옵션 || {}
  const 셋 = 읽은.셋있나
  const 쓸갈래 = 셋 ? ['재료비', '노무비', '경비', '합계'] : ['합계']
  const 숨은갈래 = 쓸갈래.filter((g) => !(g === '합계' && 셋))
  const sheets = []
  const 비율칸 = '비율!$B$2'
  const 목표칸 = '비율!$B$3'
  const 곱 = (셀) => 셀 + '*' + 비율칸 + '/100'
  const 꼴 = 결과.단수꼴

  /* ── 칸 자리 — 한 곳에서만 셉니다 ── */
  const 단가칸 = {}, 금액칸 = {}
  쓸갈래.forEach((g, i) => { 단가칸[g] = numToCol(5 + i * 2); 금액칸[g] = numToCol(6 + i * 2) })
  const 시트칸 = numToCol(5 + 쓸갈래.length * 2)
  const 옛칸 = {}
  let 끝칸 = 6 + 쓸갈래.length * 2
  for (const g of 숨은갈래) { 옛칸[g] = { 단가: numToCol(끝칸 + 1), 금액: numToCol(끝칸 + 2) }; 끝칸 += 2 }

  /* ── ① 내역서 ── */
  const head = ['공종', '규격', '단위', '수량']
  for (const g of 쓸갈래) head.push(g + ' 단가', g + ' 금액')
  head.push('가져온 시트', '가져온 줄')
  for (const g of 숨은갈래) head.push('(당초) ' + g + ' 단가', '(당초) ' + g + ' 금액')
  const 숨길칸 = []
  for (let k = 7 + 쓸갈래.length * 2; k <= 끝칸; k++) 숨길칸.push(k)

  const 셋합 = (표, r) => ['재료비', '노무비', '경비'].map((k) => 표[k] + r).join('+')
  const r1 = 결과.rows.map((x, i) => {
    const r = i + 2
    const out = [x.공종, x.규격, x.단위, x.수량 === null ? '' : { v: x.수량, st: ST.QTY }]
    for (const g of 쓸갈래) {
      if (g === '합계' && 셋) {
        /* 합계는 «따로 곱하지» 않습니다 — 셋을 더합니다 */
        out.push({ f: 셋합(단가칸, r), st: ST.INT })
        out.push({ f: 셋합(금액칸, r), st: ST.INT })
        continue
      }
      const 옛 = x.값[g] || {}
      const 새 = x.새값[g] || {}
      const 고정 = !!결과.노무고정 && g === '노무비'
      const 옛단 = 옛칸[g].단가 + r
      const 옛금 = 옛칸[g].금액 + r
      /* 단가 */
      if (옛.단가 === null || 옛.단가 === undefined) out.push('')
      else out.push({ f: 고정 ? 옛단 : 엑셀단수(곱(옛단), 꼴), st: ST.INT })
      /* 금액 — «수량 × 단가 = 금액» 인 줄만 다시 셉니다.
         요율 줄(공구손료 등)은 그 관계가 아니라 «금액에» 곱합니다. */
      if (새.곱셈 && 옛.단가 !== null && 옛.단가 !== undefined && x.수량 !== null) {
        out.push({ f: 엑셀단수('D' + r + '*' + 단가칸[g] + r, 꼴), st: ST.INT })
      } else if (옛.금액 !== null && 옛.금액 !== undefined) {
        out.push({ f: 고정 ? 옛금 : 엑셀단수(곱(옛금), 꼴), st: ST.INT })
      } else out.push('')
    }
    out.push({ v: x.시트, st: ST.GRAY }, { v: x.줄, st: ST.GRAY })
    for (const g of 숨은갈래) {
      const 옛 = x.값[g] || {}
      out.push(옛.단가 === null || 옛.단가 === undefined ? '' : { v: 옛.단가, st: ST.GRAY })
      out.push(옛.금액 === null || 옛.금액 === undefined ? '' : { v: 옛.금액, st: ST.GRAY })
    }
    return out
  })

  let 끝 = 결과.rows.length + 1
  /* 단수조정 — 맞출 금액에 «정확히» 맞추는 한 줄. 이것도 살아 있는 수식입니다.
     ⚠️ 합계 칸에만 넣으면 재+노+경 ≠ 합계 가 됩니다. 첫 갈래에 넣고 합계는 셋을 더합니다. */
  const 첫갈래 = 쓸갈래.find((g) => g !== '합계') || '합계'
  if (단수조정) {
    끝 += 1
    const r = 끝
    const 맞춤 = 'IF(' + 목표칸 + '=0,0,' + 목표칸 + '-SUM(' +
      금액칸['합계'] + '2:' + 금액칸['합계'] + (r - 1) + '))'
    const one = ['단수조정', '맞출 금액에 «정확히» 맞추는 줄 — 비율만 쓰실 때는 0 이 됩니다', '식', '']
    쓸갈래.forEach((g) => {
      one.push('')
      if (g === '합계' && 셋) one.push({ f: 셋합(금액칸, r), st: ST.INT })
      else if (g === 첫갈래) one.push({ f: 맞춤, st: ST.INT })
      else one.push('')
    })
    one.push({ v: '(이 줄은 도구가 넣었습니다)', st: ST.RED }, '')
    for (const g of 숨은갈래) one.push('', '')
    r1.push(one)
  }
  const 합계행 = 끝 + 1
  const 총 = [{ v: '합  계', st: ST.HEAD }, '', '', '']
  쓸갈래.forEach((g) => {
    총.push('')
    총.push({ f: 'SUM(' + 금액칸[g] + '2:' + 금액칸[g] + Math.max(끝, 2) + ')', st: ST.INT })
  })
  총.push('', '')
  for (const g of 숨은갈래) 총.push('', '')
  r1.push(총)
  sheets.push({
    name: '내역서', head, rows: r1, hide: 숨길칸,
    widths: [30, 22, 7, 12].concat(쓸갈래.flatMap(() => [13, 15])).concat([14, 9])
      .concat(숨은갈래.flatMap(() => [13, 15])),
  })

  /* ── ② 비율 — «여기만 고치시면 됩니다» ── */
  const 단수말 = (단수들.find((x) => x[0] === 꼴) || ['', 꼴])[1]
  sheets.unshift({
    name: '비율',
    head: ['무엇을', '값', '설명 — 노란 칸 둘만 고치시면 됩니다'],
    rows: [
      ['비율 (%)', { v: Math.round(결과.비율 * 1000000) / 10000, st: ST.FILLIN },
        '⭐ 80 이라고 적으시면 80% 입니다. 이 칸만 고치면 내역서·대비표·원가계산서가 «전부» 다시 셈됩니다.'],
      ['맞출 금액 (원)', { v: 결과.목표 === null ? 0 : Math.round(결과.목표), st: ST.FILLIN },
        '0 이면 안 씁니다. 금액을 넣으시면 「단수조정」 줄이 차액을 먹어 총액이 «이 금액» 에 딱 맞습니다.'],
      ['노무비는 그대로', 결과.노무고정 ? '예 — 노무비에는 비율을 안 곱합니다' : '아니오',
        '이것을 바꾸시려면 사이트에서 다시 만드십시오 — 수식이 달라집니다.'],
      ['단수', 단수말, '이것도 바꾸시려면 사이트에서 다시 만드십시오.'],
      ['', '', ''],
      ['당초 합계 (원)', { v: Math.round(결과.원합), st: ST.INT }, '올리신 내역서의 합계입니다. 안 바뀝니다.'],
      ['비율 합계 (원)', { f: '내역서!' + 금액칸['합계'] + 합계행, st: ST.INT }, '위 비율로 셈한 합계입니다.'],
      ['실제 비율 (%)', { f: 'IF(B7=0,"",B8/B7*100)', st: ST.DEC2 },
        '줄마다 단수를 깎으므로 위에 넣으신 비율과 «조금» 다릅니다. 그게 맞습니다.'],
      ['차액 (원)', { f: 'IF(B3=0,"",B3-B8)', st: ST.INT }, '맞출 금액을 넣으셨을 때만 나옵니다. 0 이라야 맞은 것입니다.'],
      ['', '', ''],
      ['⚠️ 숨긴 칸', '내역서 오른쪽', '「(당초) … 단가·금액」 칸이 숨어 있습니다. 지우면 수식이 깨집니다.'],
      ['⚠️ 관급자재', '비율 대상이 아닐 수 있습니다', '관급·지급자재 줄은 내역서에서 그 줄만 되돌리십시오.'],
    ],
    widths: [18, 18, 82], freeze: false,
  })

  /* ── ③ 대비표 — 당초 ↔ 비율 (비율 쪽은 내역서를 그대로 봅니다) ── */
  const h2 = ['공종', '규격', '단위', '수량', '당초 단가', '당초 금액', '비율 단가', '비율 금액',
    '증감 (비율−당초)', '시트', '줄']
  const r2 = 결과.rows.map((x, i) => {
    const r = i + 2
    return [
      x.공종, x.규격, x.단위, x.수량 === null ? '' : { v: x.수량, st: ST.QTY },
      x.총단가 === null ? '' : { v: x.총단가, st: ST.INT },
      x.총금액 === null ? '' : { v: x.총금액, st: ST.INT },
      { f: '내역서!' + 단가칸['합계'] + r, st: ST.INT },
      { f: '내역서!' + 금액칸['합계'] + r, st: ST.INT },
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

  /* ── ④ 원가계산서 — 내역서 합계를 «수식으로» 받습니다 ── */
  const 쪽 = (g) => ({ f: 'SUM(내역서!' + 금액칸[g] + '2:' + 금액칸[g] + 끝 + ')' })
  sheets.push(원가계산서(셋 ? { 직재: 쪽('재료비'), 직노: 쪽('노무비'), 직경: 쪽('경비') } : {}))

  /* ── ⑤ 시트별 집계 ── */
  const 집 = 읽은.시트들.map((s, i) => {
    const r = i + 2
    const 당초 = s.rows.reduce((a, x) => a + (x.총금액 || 0), 0)
    return [s.시트, s.rows.length, { v: Math.round(당초), st: ST.INT },
      { f: 'SUMIF(내역서!' + 시트칸 + ':' + 시트칸 + ',A' + r + ',내역서!' + 금액칸['합계'] + ':' + 금액칸['합계'] + ')', st: ST.INT },
      { f: 'D' + r + '-C' + r, st: ST.INT },
      { f: 'IF(C' + r + '=0,"",D' + r + '/C' + r + '*100)', st: ST.DEC2 }]
  })
  const 집끝 = 집.length + 1
  집.push([{ v: '합  계', st: ST.HEAD }, '',
    { f: 'SUM(C2:C' + Math.max(집끝, 2) + ')', st: ST.INT },
    { f: '내역서!' + 금액칸['합계'] + 합계행, st: ST.INT },
    { f: 'D' + (집끝 + 1) + '-C' + (집끝 + 1), st: ST.INT },
    { f: 'IF(C' + (집끝 + 1) + '=0,"",D' + (집끝 + 1) + '/C' + (집끝 + 1) + '*100)', st: ST.DEC2 }])
  sheets.push({
    name: '시트별 집계',
    head: ['시트', '줄 수', '당초 금액', '비율 금액', '차액', '실제 비율(%)'],
    rows: 집, widths: [24, 9, 16, 16, 15, 13],
  })

  /* ── ⑥ 쓴표 ── */
  const now = new Date()
  const pad = (x) => String(x).padStart(2, '0')
  const when = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()) +
    ' ' + pad(now.getHours()) + ':' + pad(now.getMinutes())
  const 쓴 = [
    ['만든 때', when],
    ['올린 내역서', 원본이름 || 읽은.name],
    ['쓰임', 일감 || '(안 적음)'],
    ['', ''],
    ['⭐ 비율을 고치시려면', '«비율» 시트의 노란 칸(B2)에 숫자를 적으십시오 — 80 이면 80%.'],
    ['', '내역서 · 대비표 · 원가계산서 · 시트별 집계가 «그 자리에서» 전부 다시 셈됩니다.'],
    ['', '다시 올리실 것 없습니다. 엑셀만 여시면 됩니다.'],
    ['', ''],
    ['처음 넣은 비율', (Math.round(결과.비율 * 1000000) / 10000) + ' %'],
    ['맞출 금액', 결과.목표 === null ? '(안 넣음 — 비율만 곱했습니다)' : 돈(결과.목표) + ' 원'],
    ['단수 처리', 단수말],
    ['노무비는 그대로', 결과.노무고정 ? '예 — 노무비에는 비율을 곱하지 않았습니다' : '아니오'],
    ['당초 합계', 돈(결과.원합) + ' 원'],
    ['내역 줄', 결과.rows.length],
    ['수량×단가 ≠ 금액 인 줄', (읽은.특수줄 || 0) +
      '줄 — 「공구손료 및 경장비의 기계경비」처럼 수량 칸이 요율(%)인 줄이거나 금액만 적힌 줄입니다.'],
    ['', '그 줄은 다시 곱하지 않고 «금액에 바로» 비율을 곱합니다.'],
    ['', ''],
    ['⚠️ 어디에 곱했나', '«단가» 에 곱하고 금액을 다시 셉니다. 금액에만 곱하면 단가×수량≠금액 이 되어'],
    ['', '서류가 반려됩니다. 재료비·노무비·경비가 갈려 있으면 갈래마다 곱하고,'],
    ['', '합계는 셋을 더해 만듭니다(합계에 따로 곱하지 않습니다).'],
    ['⚠️ 숨긴 칸', '내역서 오른쪽에 «(당초) 단가·금액» 칸이 숨어 있습니다. 수식이 그 칸을 봅니다 — 지우지 마십시오.'],
    ['⚠️ 원가계산서', 읽은.셋있나
      ? '재료비·노무비·경비를 내역서에서 «수식으로» 받습니다. 요율(노란 칸)은 반드시 맞춰 보십시오.'
      : '올리신 내역서에 재료비·노무비·경비 갈래가 없어 «0» 으로 두었습니다 — 손으로 넣으십시오.'],
    ['', '요율은 2026년 조달청 공고 내역서에서 옮긴 값입니다. 해마다·공사 종류마다 다릅니다.'],
    ['⚠️ 하도급', '비율이 낮으면 발주자의 «하도급계약 적정성 심사» 대상이 될 수 있습니다'],
    ['', '(건설산업기본법 제31조 · 같은 법 시행령 제34조). 기준 비율은 원문과 발주처 지침을 보십시오.'],
    ['⚠️ 노무비', '노무비를 깎는 것은 다툼이 되기 쉽습니다. 「노무비는 그대로」 를 켜면'],
    ['', '노무비에는 비율을 곱하지 않고 나머지로만 맞춥니다.'],
    ['⚠️ 이 파일', '서식은 우리 서식입니다. 발주처 서식이 따로 있으면 값만 옮겨 쓰십시오.'],
    ['', '올리신 엑셀 그대로가 필요하시면 «원본 그대로 고치기» 로 받으십시오 — 거기에도 비율 칸이 있습니다.'],
  ]
  sheets.push({ name: '쓴표', head: ['항목', '값'], rows: 쓴, widths: [22, 88], freeze: false })

  return writeWorkbook(sheets)
}

/* ══════════════════════════════════════════════════════════
   ④ 올리신 엑셀 «그대로» 고치기

   ■ 왜 이 길이 따로 있나
     새 엑셀은 우리 서식입니다. 그런데 현장 내역서는 **서식이 생명** 이라
     인쇄영역·병합·도장칸이 바뀌면 다시 안 씁니다. 그래서 zip(=xlsx) 안에서
     «단가 칸 하나하나» 만 갈아 끼우고 나머지는 원본 그대로 둡니다.

   ■ 2026-09-18 — 소장님: 「프로그램이 엑셀에서 퍼센트만 조절하게 해주면
     자동으로 모든게 맞춘비율로 바뀌는 거지. 이것만 해주면 돼」
     → 값을 박지 않습니다. 「비율」 시트를 한 장 붙이고, 그 시트의 노란 칸(B2)을
       보는 «살아 있는 수식» 으로 단가를 채웁니다. 당초 단가는 그 시트에 남겨 둡니다.
       B2 에 80 이라고 적으면 80% 입니다(백분율 서식이 아니라 그냥 숫자 — 원본 엑셀의
       서식을 건드리지 않으려고 이렇게 합니다).

   ■ 금액 칸은 되도록 «건드리지 않습니다»
     금액이 =D12*E12 같은 수식이면 단가만 갈면 저절로 다시 셈됩니다.

   ■ 못 하는 것 — 숨기지 않고 돌려 드립니다
     · 줄을 새로 넣지 못합니다 → 「단수조정」 한 줄은 새 엑셀 쪽에만 있습니다
     · 소계·합계 줄이 «숫자로 박혀» 있으면 그대로 남습니다 (검산에 적어 드립니다)
     · 구형 .xls 는 안 됩니다
   ══════════════════════════════════════════════════════════ */

const 속성 = (tag, name) => {
  const m = new RegExp('\\s' + name + '="([^"]*)"').exec(tag)
  return m ? m[1] : null
}
const xesc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

/** 여는 태그의 «이름표»(한셀은 <x:c> 로 씁니다)를 알아냅니다 */
function 이름표(xml, 태그) {
  const m = new RegExp('<([A-Za-z_][\\w.-]*:)?' + 태그 + '[\\s>/]').exec(xml)
  return (m && m[1]) || ''
}
const 덩어리 = (P, t) => new RegExp('<' + P + t + '\\b[^>]*\\/>|<' + P + t + '\\b[^>]*>[\\s\\S]*?<\\/' + P + t + '>', 'g')

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
    for (const m of rx.match(/<[A-Za-z_:.\w-]*Relationship\b[^>]*\/?>/g) || []) {
      const id = 속성(m, 'Id')
      let t = 속성(m, 'Target')
      if (!id || !t) continue
      t = t.replace(/^\//, '').replace(/^xl\//, '')
      rels[id] = 'xl/' + t
    }
  }
  const out = {}
  let i = 0
  for (const m of wbx.match(/<[A-Za-z_:.\w-]*sheet\b[^>]*\/?>/g) || []) {
    if (/sheets|sheetPr|sheetView|sheetData|sheetFormat/.test(m)) continue
    i++
    const nm = String(속성(m, 'name') || ('시트' + i))
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'").replace(/&amp;/g, '&').trim()
    const rid = 속성(m, 'r:id') || 속성(m, 'id')
    out[nm] = (rid && rels[rid]) || ('xl/worksheets/sheet' + i + '.xml')
  }
  return out
}

/* 노란 칸 하나를 만들려고 styles.xml 에 «덧붙입니다». 안 되면 그냥 넘어갑니다
   — 색이 없다고 셈이 틀리지는 않습니다. */
function 노란칸만들기(zip) {
  try {
    const f = zip['xl/styles.xml']
    if (!f) return null
    let x = strFromU8(f)
    const FP = 이름표(x, 'fills')
    const XP = 이름표(x, 'cellXfs')
    const fm = new RegExp('<' + FP + 'fills\\b[^>]*count="(\\d+)"[^>]*>').exec(x)
    const xm = new RegExp('<' + XP + 'cellXfs\\b[^>]*count="(\\d+)"[^>]*>').exec(x)
    if (!fm || !xm) return null
    const fillId = +fm[1]
    const xfId = +xm[1]
    const 새fill = '<' + FP + 'fill><' + FP + 'patternFill patternType="solid"><' + FP +
      'fgColor rgb="FFFFF2CC"/><' + FP + 'bgColor indexed="64"/></' + FP + 'patternFill></' + FP + 'fill>'
    x = x.replace(new RegExp('</' + FP + 'fills>'), 새fill + '</' + FP + 'fills>')
      .replace(fm[0], fm[0].replace('count="' + fm[1] + '"', 'count="' + (fillId + 1) + '"'))
    const 새xf = '<' + XP + 'xf numFmtId="0" fontId="0" fillId="' + fillId +
      '" borderId="0" xfId="0" applyFill="1"/>'
    x = x.replace(new RegExp('</' + XP + 'cellXfs>'), 새xf + '</' + XP + 'cellXfs>')
      .replace(xm[0], xm[0].replace('count="' + xm[1] + '"', 'count="' + (xfId + 1) + '"'))
    zip['xl/styles.xml'] = strToU8(x)
    return xfId
  } catch (e) { return null }
}

/* 「비율」 시트 한 장을 zip 에 붙입니다. 붙인 이름을 돌려줍니다. */
function 비율시트붙이기(zip, 이름, 비율, 옛값, 말들, 노랑) {
  const C = (ref, v, s) => {
    if (v === null || v === undefined || v === '') return ''
    const st = s === null || s === undefined ? '' : ' s="' + s + '"'
    if (typeof v === 'number') return '<c r="' + ref + '"' + st + '><v>' + v + '</v></c>'
    return '<c r="' + ref + '"' + st + ' t="inlineStr"><is><t xml:space="preserve">' + xesc(v) + '</t></is></c>'
  }
  const 줄 = []
  const R = (n, cells) => 줄.push('<row r="' + n + '">' + cells.join('') + '</row>')
  R(1, [C('A1', 'K-건설맵 — 내역서 비율 맞추기')])
  R(2, [C('A2', '비율 (%)'), C('B2', 비율, 노랑),
    C('C2', '⭐ 여기만 고치십시오. 80 이라고 적으면 80% 입니다. 내역서의 단가·금액이 전부 다시 셈됩니다.')])
  R(3, [C('A3', ''), C('B3', ''), C('C3', '소수도 됩니다 — 87.745 처럼. 엑셀을 저장했다가 다시 여실 필요 없습니다.')])
  let n = 5
  for (const 말 of 말들) { R(n, [C('A' + n, ''), C('B' + n, ''), C('C' + n, 말)]); n++ }
  R(10, [C('C10', '───────── 아래는 건드리지 마십시오. 당초 단가·금액입니다 (수식이 이 칸을 봅니다) ─────────')])
  R(11, [C('C11', '어디 값인가'), C('D11', '당초 값')])
  옛값.forEach((x, i) => {
    const r = 12 + i
    R(r, [C('C' + r, x[0]), C('D' + r, x[1])])
  })
  const xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<cols><col min="1" max="1" width="18" customWidth="1"/><col min="2" max="2" width="14" customWidth="1"/>' +
    '<col min="3" max="3" width="86" customWidth="1"/><col min="4" max="4" width="16" customWidth="1"/></cols>' +
    '<sheetData>' + 줄.join('') + '</sheetData></worksheet>'
  const 길 = 'xl/worksheets/kcm_biyul.xml'
  zip[길] = strToU8(xml)

  /* 관계 · 목록 · 내용표에 등록합니다 */
  const rid = 'rIdKcmBiyul'
  let rels = strFromU8(zip['xl/_rels/workbook.xml.rels'] || strToU8(
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>'))
  rels = rels.replace(/<\/([A-Za-z_:.\w-]*Relationships)>/,
    '<Relationship Id="' + rid + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet"' +
    ' Target="worksheets/kcm_biyul.xml"/></$1>')
  zip['xl/_rels/workbook.xml.rels'] = strToU8(rels)

  let wbx = strFromU8(zip['xl/workbook.xml'])
  const WP = 이름표(wbx, 'sheets')
  let 큰 = 0
  for (const m of wbx.match(/<[A-Za-z_:.\w-]*sheet\b[^>]*\/?>/g) || []) {
    const v = +(속성(m, 'sheetId') || 0)
    if (v > 큰) 큰 = v
  }
  /* r:id 의 이름표는 이 파일이 쓰는 것을 그대로 따릅니다 */
  const idm = /<[A-Za-z_:.\w-]*sheet\b[^>]*\s([\w.-]+:id)="/.exec(wbx)
  const idAttr = (idm && idm[1]) || 'r:id'
  wbx = wbx.replace(new RegExp('</' + WP + 'sheets>'),
    '<' + WP + 'sheet name="' + xesc(이름) + '" sheetId="' + (큰 + 1) + '" ' + idAttr + '="' + rid + '"/></' + WP + 'sheets>')
  zip['xl/workbook.xml'] = strToU8(wbx)

  let ct = strFromU8(zip['[Content_Types].xml'])
  ct = ct.replace(/<\/([A-Za-z_:.\w-]*Types)>/,
    '<Override PartName="/xl/worksheets/kcm_biyul.xml"' +
    ' ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></$1>')
  zip['[Content_Types].xml'] = strToU8(ct)
}

export function 원본고치기(buf, 읽은, 결과) {
  let zip
  try { zip = unzipSync(new Uint8Array(buf)) } catch (e) {
    throw new Error('엑셀 파일을 열지 못했습니다. .xls 는 엑셀에서 «다른 이름으로 저장 → xlsx» 한 뒤 올려 주십시오.')
  }
  if (!zip['xl/workbook.xml']) throw new Error('엑셀(.xlsx) 파일이 아닙니다.')
  const 경로 = 시트경로(zip)
  const 고친것 = { 칸: 0, 지운수식: 0, 지킨수식: 0, 단수씌움: 0, 원본셈: 0, 못찾은칸: 0 }
  const 경고 = []
  const 꼴 = 결과.단수꼴

  /* 붙일 시트 이름 — 이미 「비율」 이 있으면 비율2, 비율3… */
  let 비율이름 = '비율'
  for (let k = 2; Object.prototype.hasOwnProperty.call(경로, 비율이름); k++) 비율이름 = '비율' + k
  const B = 비율이름 + '!$B$2'
  const 옛시작 = 12
  const 옛값 = []
  const 옛참조 = (설명, 값) => {
    옛값.push([설명, 값])
    return 비율이름 + '!$D$' + (옛시작 + 옛값.length - 1)
  }

  /* 줄 -> 갈 칸들 */
  const 바꾼줄 = new Map()
  for (const x of 결과.rows) {
    const s = 읽은.시트들.find((y) => y.시트 === x.시트)
    if (!s) continue
    if (!바꾼줄.has(x.시트)) 바꾼줄.set(x.시트, new Map())
    const 표 = 바꾼줄.get(x.시트)
    if (!표.has(x.줄)) 표.set(x.줄, [])
    const 일 = 표.get(x.줄)
    const qCol = s.칸 && s.칸.iQ >= 0 ? numToCol(s.칸.iQ + 1) : null
    const 셋칸 = s.갈래.filter((g) => g.이름 !== '합계')
    for (const g of s.갈래) {
      const 옛 = x.값[g.이름] || {}
      const 새 = x.새값[g.이름] || {}
      const uCol = g.단가칸 >= 0 ? numToCol(g.단가칸 + 1) : null
      const aCol = g.금액칸 >= 0 ? numToCol(g.금액칸 + 1) : null
      const 합칸 = g.이름 === '합계' && 셋칸.length > 0
      const 고정 = !!결과.노무고정 && g.이름 === '노무비'
      const 모음 = (뽑기) => 셋칸.filter((z) => 뽑기(z) >= 0).map((z) => numToCol(뽑기(z) + 1) + x.줄)
      if (uCol && 옛.단가 !== null && 옛.단가 !== undefined && 새.단가 !== null && 새.단가 !== undefined) {
        const 모 = 합칸 ? 모음((z) => z.단가칸) : []
        let f
        if (모.length) f = 모.join('+')
        else {
          const ref = 옛참조(x.시트 + ' ' + uCol + x.줄 + ' 당초 단가', 옛.단가)
          f = 고정 ? ref : 엑셀단수(ref + '*' + B + '/100', 꼴)
        }
        일.push({ ref: uCol + x.줄, v: 새.단가, f, 지킬: 모.length ? 모.map((c) => c) : null })
      }
      if (aCol && 옛.금액 !== null && 옛.금액 !== undefined && 새.금액 !== null && 새.금액 !== undefined) {
        const 모 = 합칸 ? 모음((z) => z.금액칸) : []
        let f
        if (모.length) f = 모.join('+')
        else if (새.곱셈 && uCol && qCol && x.수량 !== null) f = 엑셀단수(qCol + x.줄 + '*' + uCol + x.줄, 꼴)
        else {
          const ref = 옛참조(x.시트 + ' ' + aCol + x.줄 + ' 당초 금액', 옛.금액)
          f = 고정 ? ref : 엑셀단수(ref + '*' + B + '/100', 꼴)
        }
        const 지킬 = 모.slice()
        if (uCol) 지킬.push(uCol + x.줄)
        일.push({ ref: aCol + x.줄, v: 새.금액, f, 지킬: 지킬.length ? 지킬 : null })
      }
    }
  }

  for (const s of 읽은.시트들) {
    const path = 경로[s.시트]
    if (!path || !zip[path]) { 경고.push([s.시트, '시트를 zip 안에서 못 찾아 손대지 않았습니다']); continue }
    const 표 = 바꾼줄.get(s.시트) || new Map()
    const 건너뛴 = new Map((s.건너뛴줄 || []).map((x) => [x.줄, x.이름]))
    const 금액칸들 = new Set(s.갈래.filter((g) => g.금액칸 >= 0).map((g) => numToCol(g.금액칸 + 1)))
    const 단가칸들 = new Set(s.갈래.filter((g) => g.단가칸 >= 0).map((g) => numToCol(g.단가칸 + 1)))
    const 굳은줄 = []
    const xml = strFromU8(zip[path])
    /* 한셀(HCell)은 <x:row> <x:c> 처럼 이름표를 붙입니다 — 그대로 따라 씁니다 */
    const P = 이름표(xml, 'sheetData') || 이름표(xml, 'row')
    const ROW = 덩어리(P, 'row')
    const CELL = 덩어리(P, 'c')
    const F_RE = new RegExp('<' + P + 'f[^>]*>([\\s\\S]*?)<\\/' + P + 'f>')
    const V_RE = new RegExp('<' + P + 'v>[\\s\\S]*?<\\/' + P + 'v>')
    const 새xml = xml.replace(ROW, (rm) => {
      const rn = +(속성(rm, 'r') || 0)
      const 일 = 표.get(rn)
      const 볼까 = 건너뛴.has(rn)
      if (!일 && !볼까) return rm
      const 지도 = new Map((일 || []).map((j) => [j.ref, j]))
      let 본칸 = 0
      const out = rm.replace(CELL, (cell) => {
        const ref = 속성(cell, 'r')
        if (!ref) return cell
        if (볼까) {
          const col = /^([A-Z]+)/.exec(ref)
          if (col && (금액칸들.has(col[1]) || 단가칸들.has(col[1])) &&
              !new RegExp('<' + P + 'f[\\s>]').test(cell) && V_RE.test(cell)) {
            const v = new RegExp('<' + P + 'v>([\\s\\S]*?)<\\/' + P + 'v>').exec(cell)
            if (v && Number.isFinite(Number(v[1])) && Number(v[1]) !== 0) 굳은줄.push(rn)
          }
        }
        const job = 지도.get(ref)
        if (!job) return cell
        본칸++
        const fm = F_RE.exec(cell)
        if (job.지킬 && fm && job.지킬.some((c) => {
          const m = /^([A-Z]+)(\d+)$/.exec(c)
          return m && 가리키나(fm[1], m[1], m[2])
        })) {
          /* 원래 수식이 «우리가 바꾼 칸» 을 보고 있습니다 — 살려 둡니다.
             엑셀은 열 때 다시 셈합니다. 셈해 둔 값만 새것으로 갈아 둡니다.

             🚨 2026-09-18 — 다만 «반올림이 없는» 수식(=D12*E12)은 그냥 두면
                엑셀이 소수까지 그대로 더해, 우리가 화면에 보여 드린 합계와
                어긋났습니다(실측: 267줄짜리 내역서에서 37원).
                → 그 수식을 «감싸서» 단수를 씌웁니다. 원래 식은 그대로 안에 있습니다. */
          고친것.지킨수식++
          let c2 = cell
          if (!/(ROUND|ROUNDDOWN|ROUNDUP|TRUNC|INT|FLOOR|CEILING)\s*\(/i.test(fm[1])) {
            c2 = c2.replace(fm[0], '<' + P + 'f>' + xesc(엑셀단수(fm[1], 꼴)) + '</' + P + 'f>')
            고친것.단수씌움++
          } else {
            /* 이미 제 반올림을 갖고 있는 수식입니다(=ROUND(D29*G29,1) 같은).
               «원본 서식이 생명» 이라 그 셈법을 그대로 둡니다 — 다만 그러면 우리가
               화면에 보여 드린 합계와 원 단위로 조금 다를 수 있습니다. 세어서 알려 줍니다.
               실측: 267줄 내역서에서 3,031,692 → 3,031,729 (37원, 0.001%). */
            고친것.원본셈++
          }
          if (V_RE.test(c2)) return c2.replace(V_RE, '<' + P + 'v>' + job.v + '</' + P + 'v>')
          return c2.replace(new RegExp('</' + P + 'c>$'), '<' + P + 'v>' + job.v + '</' + P + 'v></' + P + 'c>')
        }
        if (fm) 고친것.지운수식++
        const st = /\ss="(\d+)"/.exec(cell)
        고친것.칸++
        return '<' + P + 'c r="' + ref + '"' + (st ? ' s="' + st[1] + '"' : '') + '>' +
          '<' + P + 'f>' + xesc(job.f) + '</' + P + 'f>' +
          '<' + P + 'v>' + job.v + '</' + P + 'v></' + P + 'c>'
      })
      if (일) 고친것.못찾은칸 += 일.length - 본칸
      return out
    })
    zip[path] = strToU8(새xml)
    if (굳은줄.length) {
      const 몇 = [...new Set(굳은줄)]
      경고.push([s.시트, '소계·합계처럼 보이는 줄 ' + 몇.length +
        '곳에 «수식이 아닌 숫자» 가 박혀 있습니다 — 그 줄은 당초 금액 그대로입니다 (' +
        몇.slice(0, 12).join('행, ') + '행). 엑셀에서 그 줄만 다시 더해 주십시오.'])
    }
  }
  for (const 말 of 읽은.시트말) {
    if (!/: \d+줄/.test(말)) 경고.push([말.split(':')[0], '내역 표를 못 찾아 손대지 않았습니다'])
  }

  /* 「비율」 시트를 붙입니다 */
  const 노랑 = 노란칸만들기(zip)
  비율시트붙이기(zip, 비율이름, Math.round(결과.비율 * 1000000) / 10000, 옛값, [
    '이 시트는 K-건설맵이 붙인 것입니다. 원래 내역서에는 없던 시트입니다.',
    '단가 칸이 이 시트의 B2 를 보는 수식으로 바뀌었습니다 — 비율을 바꾸시면 그 자리에서 다시 셉니다.',
    (결과.노무고정 ? '「노무비는 그대로」 로 만들었습니다 — 노무비 단가에는 비율을 곱하지 않습니다.' : ''),
    '단수는 「' + ((단수들.find((x) => x[0] === 꼴) || ['', 꼴])[1]) + '」 입니다.',
    '소계·합계 줄이 «수식이 아니라 숫자» 로 박혀 있으면 그 줄은 안 바뀝니다. 검산 목록을 보십시오.',
  ].filter(Boolean), 노랑)

  /* 엑셀이 열 때 «전부 다시 셈» 하게 합니다 */
  let wbx = strFromU8(zip['xl/workbook.xml'])
  const CP = 이름표(wbx, 'calcPr')
  if (CP !== null && new RegExp('<' + CP + 'calcPr\\b[^>]*\\/>').test(wbx)) {
    wbx = wbx.replace(new RegExp('<' + CP + 'calcPr\\b[^>]*\\/>'),
      '<' + CP + 'calcPr calcId="0" fullCalcOnLoad="1"/>')
  } else if (new RegExp('<([A-Za-z_][\\w.-]*:)?calcPr\\b').test(wbx)) {
    wbx = wbx.replace(/<([A-Za-z_][\w.-]*:)?calcPr\b[^>]*>[\s\S]*?<\/([A-Za-z_][\w.-]*:)?calcPr>/,
      '<calcPr calcId="0" fullCalcOnLoad="1"/>')
  } else {
    wbx = wbx.replace(/<\/([A-Za-z_:.\w-]*workbook)>/, '<calcPr calcId="0" fullCalcOnLoad="1"/></$1>')
  }
  zip['xl/workbook.xml'] = strToU8(wbx)

  /* 수식을 바꿨으므로 calcChain 은 어긋납니다 — 지웁니다(엑셀이 다시 만듭니다) */
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

  return { bytes: zipSync(zip, { level: 6 }), ...고친것, 경고, 비율시트: 비율이름 }
}
