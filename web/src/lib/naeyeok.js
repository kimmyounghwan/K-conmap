/**
 * 공내역서에 «단가를 채워» 내역서와 원가계산서를 만듭니다 (2026-09-16).
 *
 * ⚠️ 서식과 요율은 지어낸 것이 아닙니다. 조달청 공고에 붙어 공개된 실제 내역서
 *    (2026년 공고, 원가계산서 시트)의 «비목 차례와 산출식» 을 그대로 옮겼습니다.
 *    다만 **요율은 해마다·공사 종류마다 다릅니다.** 그래서 엑셀에서 «고치는 칸» 으로 둡니다.
 *    노란 칸을 고치면 아래가 전부 다시 셈해집니다 — 살아 있는 수식이라 그렇습니다.
 *
 * ⚠️ 단가표는 «올려 주시는 것» 만 씁니다. 사이트가 단가를 갖고 있지 않습니다.
 *    표준품셈·물가정보·노임단가는 유료라 싣지 않습니다.
 */
import { readWorkbook, writeWorkbook, ST } from './qtoxlsx.js'

const txt = (x) => {
  if (x === null || x === undefined) return ''
  if (typeof x === 'number' && Number.isInteger(x)) return String(x)
  return String(x).trim()
}
const num = (x) => {
  const t = String(x === null || x === undefined ? '' : x).replace(/,/g, '').trim()
  if (t === '') return null
  const v = Number(t)
  return Number.isFinite(v) ? v : null
}
/* 묶는 열쇠 — 공백을 떼고 견줍니다 (tools/단가규칙.py 의 방식과 같습니다) */
const key3 = (nm, sp, un) => [nm, sp, un].map((x) => txt(x).replace(/\s+/g, '')).join('\u0000')

/* ─────────────────────────────── 단가표 읽기 */

/** csv 글자 또는 xlsx 바이트 -> { 열쇠: {단가, 품명, 규격, 단위, 표본, 등급} } */
export function readPrices(input, name) {
  let grid
  if (typeof input === 'string') {
    grid = input.split(/\r\n|\r|\n/).filter((l) => l.trim() && !l.trim().startsWith('#'))
      .map((l) => splitCsv(l))
  } else {
    const wb = readWorkbook(input)
    const first = Object.values(wb)[0] || []
    grid = first.map((r) => r.map(txt))
  }
  if (!grid.length) throw new Error('단가표가 비어 있습니다.')
  /* 머리글 줄 찾기 — 「품명」과 「단가」 비슷한 칸이 같이 있는 줄 */
  let hi = -1, hdr = null
  for (let i = 0; i < Math.min(grid.length, 15); i++) {
    const c = grid[i].map((x) => txt(x).replace(/\s+/g, ''))
    const hasName = c.some((x) => /^(품명|공종|공종명|명칭|품목|자재명)$/.test(x))
    const hasPrice = c.some((x) => /단가/.test(x))
    if (hasName && hasPrice) { hi = i; hdr = c; break }
  }
  if (hi < 0) throw new Error('단가표에서 머리글을 못 찾았습니다. 「품명 · 규격 · 단위 · 단가」 칸이 있어야 합니다.')
  const at = (re) => hdr.findIndex((x) => re.test(x))
  const iN = at(/^(품명|공종|공종명|명칭|품목|자재명)$/)
  const iS = at(/^(규격|형식)$/)
  const iU = at(/^(단위)$/)
  /* 「중앙단가」 를 먼저 봅니다 — 단가사전이 내는 이름입니다 */
  let iP = at(/^중앙단가$/)
  if (iP < 0) iP = at(/단가/)
  const iC = at(/^(표본|나온횟수)$/)
  const iG = at(/^등급$/)
  const out = {}
  for (let r = hi + 1; r < grid.length; r++) {
    const row = grid[r]
    const nm = txt(row[iN]), p = num(row[iP])
    if (!nm || p === null || p <= 0) continue
    const sp = iS >= 0 ? txt(row[iS]) : ''
    const un = iU >= 0 ? txt(row[iU]) : ''
    out[key3(nm, sp, un)] = {
      단가: p, 품명: nm, 규격: sp, 단위: un,
      표본: iC >= 0 ? (num(row[iC]) || '') : '',
      등급: iG >= 0 ? txt(row[iG]) : '',
    }
  }
  if (!Object.keys(out).length) throw new Error('단가표에서 쓸 수 있는 줄을 못 찾았습니다.')
  return { table: out, name: name || '단가표', n: Object.keys(out).length }
}

function splitCsv(line) {
  const out = []
  let cur = '', q = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (q) { if (c === '"') { if (line[i + 1] === '"') { cur += '"'; i++ } else q = false } else cur += c }
    else if (c === '"') q = true
    else if (c === ',') { out.push(cur); cur = '' }
    else cur += c
  }
  out.push(cur)
  return out.map((x) => x.replace(/^﻿/, '').trim())
}

/* ─────────────────────────────── 공내역서 읽기 */

const H_NAME = /^(품명|공종|공종명|명칭|품목|자재명|공사명|규격및품명|품명및규격|산출명)$/
const H_SPEC = /^(규격|형식|규격및단위)$/
const H_UNIT = /^(단위|수량단위)$/
const H_QTY = /^(수량|물량|단위수량)$/
const NOT_ITEM = /^(합계|소계|총계|계|재료비|노무비|경비|직접공사비|순공사원가|공사원가|비고|구분|번호|호표)$/

/**
 * 공내역서(.xlsx) -> [{공종, 규격, 단위, 수량, 시트, 줄}]
 * «수량은 있고 단가는 비어 있는» 표를 찾습니다. 그것이 공내역서입니다.
 */
export function readGongNaeyeok(bytes, name) {
  const wb = readWorkbook(bytes)
  const 나온것 = []
  const 시트말 = []
  for (const [sheet, grid] of Object.entries(wb)) {
    if (!grid || !grid.length) continue
    let hi = -1, hdr = null
    for (let i = 0; i < Math.min(grid.length, 30); i++) {
      const c = (grid[i] || []).map((x) => txt(x).replace(/\s+/g, ''))
      if (c.some((x) => H_NAME.test(x)) && c.some((x) => H_QTY.test(x))) { hi = i; hdr = c; break }
    }
    if (hi < 0) { 시트말.push(sheet + ': 「품명·수량」 머리글을 못 찾음'); continue }
    const at = (re) => hdr.findIndex((x) => re.test(x))
    const iN = at(H_NAME), iS = at(H_SPEC), iU = at(H_UNIT), iQ = at(H_QTY)
    let n = 0
    for (let r = hi + 1; r < grid.length; r++) {
      const row = grid[r] || []
      const nm = txt(row[iN])
      const q = iQ >= 0 ? num(row[iQ]) : null
      if (!nm || q === null) continue
      if (NOT_ITEM.test(nm.replace(/\s+/g, ''))) continue
      나온것.push({
        공종: nm,
        규격: iS >= 0 ? txt(row[iS]) : '',
        단위: iU >= 0 ? txt(row[iU]) : '',
        수량: q, 시트: sheet, 줄: r + 1,
      })
      n++
    }
    시트말.push(sheet + ': ' + n + '줄')
  }
  if (!나온것.length) {
    throw new Error('공내역서에서 「품명·수량」 표를 못 찾았습니다.  (' + 시트말.slice(0, 6).join(' / ') + ')')
  }
  return { rows: 나온것, name: name || '공내역서.xlsx', 시트말 }
}

/* ─────────────────────────────── 단가 채우기 */

/** 내역 줄에 단가를 붙입니다. 못 찾은 것은 «못 찾음» 으로 남깁니다 — 0 으로 채우지 않습니다. */
export function fillPrices(rows, table) {
  let 찾음 = 0
  const out = rows.map((r) => {
    const k1 = key3(r.공종, r.규격, r.단위)
    const k2 = key3(r.공종, '', r.단위)
    const k3 = key3(r.공종, r.규격, '')
    const hit = table[k1] || table[k2] || table[k3]
    if (hit) 찾음++
    return {
      ...r,
      단가: hit ? hit.단가 : null,
      맞춤: hit ? (table[k1] ? '품명+규격+단위' : (table[k2] ? '품명+단위' : '품명+규격')) : '',
      표본: hit ? hit.표본 : '',
      등급: hit ? hit.등급 : '',
    }
  })
  return { rows: out, 찾음, 못찾음: rows.length - 찾음 }
}

/* ─────────────────────────────── 원가계산서 요율 */

/* 2026년 조달청 공고 내역서에서 그대로 옮긴 요율입니다.
   ⚠️ 해마다·공사 종류마다 다릅니다. 엑셀에서 «노란 칸» 을 고쳐 쓰십시오. */
export const 요율 = [
  ['간접노무비', 0.191, '직접노무비 × '],
  ['산재보험료', 0.0356, '(직접+간접노무비) × '],
  ['고용보험료', 0.0101, '(직접+간접노무비) × '],
  ['건강보험료', 0.03595, '직접노무비 × '],
  ['연금보험료', 0.0475, '직접노무비 × '],
  ['노인장기요양보험료', 0.1314, '건강보험료 × '],
  ['퇴직금공제부금비', 0.0023, '직접노무비 × '],
  ['산업안전보건관리비', 0.0207, '(재료비+직접노무비) × '],
  ['건설기계대여대금 지급보증', 0.001, '(재료비+직접노무비+산출경비) × '],
  ['환경보전비', 0.005, '(재료비+직접노무비+산출경비) × '],
  ['석면분담금', 0.00006, '노무비 × '],
  ['임금채권부담금', 0.0009, '노무비 × '],
  ['기타경비', 0.055, '(재료비+노무비) × '],
  ['일반관리비', 0.08, '순공사원가 × '],
  ['이윤', 0.15, '(노무비+경비+일반관리비) × '],
  ['부가가치세', 0.1, '총원가 × '],
]

/* 산출내역 글에 적을 이름 — D7 같은 칸 이름 대신 사람 말로 */
function 이름풀기(ref, L) {
  const 말 = {
    직재: '직접재료비', 간재: '간접재료비', 재계: '재료비', 직노: '직접노무비',
    간노: '간접노무비', 노계: '노무비', 직경: '직접경비', 건강: '건강보험료',
  }
  for (const k of Object.keys(말)) if ('D' + L[k] === ref) return 말[k]
  return ref
}

/* ─────────────────────────────── 원가계산서 한 장

   ⚠️ 행 번호를 «세어서» 쓰면 항목 하나만 늘려도 전부 어긋납니다.
      그래서 항목마다 이름으로 행을 적어 두고, 수식은 그 이름으로만 씁니다.

   초기 = {직재, 간재, 직노, 직경, 관급} — 아는 값이 있으면 노란 칸에 미리 채웁니다.
   (lib/비율.js 가 «비율을 맞춘» 재료비·노무비·경비를 그대로 넣습니다.)
   ⚠️ 채워 넣어도 «노란 칸» 그대로입니다 — 고칠 수 있어야 하기 때문입니다.
   ⚠️ 2026-09-18 에 toNaeyeokXlsx 안에서 «그대로» 떼어냈습니다. 나오는 시트는 같습니다. */
export function 원가계산서(초기) {
  const 처음 = 초기 || {}
  /* ⚠️ 행 번호를 «세어서» 쓰면 항목 하나만 늘려도 전부 어긋납니다.
        그래서 항목마다 이름으로 행을 적어 두고, 수식은 그 이름으로만 씁니다. */
  const 원 = []
  const L = {}
  const put = (이름, 비목, 구분, 세목, 금액, 산출, 요율칸) => {
    원.push([비목, 구분, 세목, 금액, 산출, 요율칸 === undefined ? '' : 요율칸])
    L[이름] = 원.length + 1              /* 머리글이 1행이므로 +1 */
    return L[이름]
  }
  const D = (k) => 'D' + L[k]
  /* 노란 칸 — 손으로 넣는 자리.
     아는 값이 있으면 미리 적어 둡니다. «수식» 으로 줄 수도 있습니다 — 그러면
     내역서가 바뀔 때 원가계산서도 따라 바뀝니다 (lib/비율.js 의 「비율」 칸).
     ⚠️ 2026-09-18 — 여기서 수식을 못 받아 원가계산서가 통째로 NaN 이었습니다. */
  const FILL = (k) => {
    const v = 처음[k]
    if (v && typeof v === 'object' && v.f !== undefined) return { f: v.f, st: ST.FILLIN }
    return { v: Math.round(v || 0), st: ST.FILLIN }
  }
  const P = (v) => ({ v, st: ST.PCT })   /* 노란 칸 — 요율 */

  /* 값을 미리 채워 드린 칸에는 «넣으십시오» 가 아니라 «어디서 왔는지» 를 적습니다 */
  const 말 = (k, 기본) => (처음[k] ? '내역서에서 받았습니다 — 고치실 수 있습니다' : 기본)
  put('직재', '순공사원가', '재료비', '직접재료비', FILL('직재'), 말('직재', '내역서 「재료비」 합계를 넣으십시오'), '')
  put('간재', '', '', '간접재료비', FILL('간재'), '', '')
  put('재계', '', '', '소     계', { f: D('직재') + '+' + D('간재'), st: ST.INT }, '직접+간접', '')
  put('직노', '', '노무비', '직접노무비', FILL('직노'), 말('직노', '내역서 「노무비」 합계를 넣으십시오'), '')
  put('간노', '', '', '간접노무비', null, '직접노무비 ×', P(0.191))
  원[L['간노'] - 2][3] = { f: 'ROUND(' + D('직노') + '*F' + L['간노'] + ',0)', st: ST.INT }
  put('노계', '', '', '소     계', { f: D('직노') + '+' + D('간노'), st: ST.INT }, '직접+간접', '')
  put('직경', '', '경비', '직접경비', FILL('직경'), 말('직경', '내역서 「경비」 합계를 넣으십시오'), '')

  /* 경비 항목 — 앞의 것을 가리키는 것이 있으므로(노인장기요양=건강보험료) 이름으로 씁니다 */
  const 경비 = [
    ['산재', '산재보험료', 0.0356, () => '(' + D('직노') + '+' + D('간노') + ')'],
    ['고용', '고용보험료', 0.0101, () => '(' + D('직노') + '+' + D('간노') + ')'],
    ['건강', '건강보험료', 0.03595, () => D('직노')],
    ['연금', '연금보험료', 0.0475, () => D('직노')],
    ['노인', '노인장기요양보험료', 0.1314, () => D('건강')],
    ['퇴직', '퇴직금공제부금비', 0.0023, () => D('직노')],
    ['안전', '산업안전보건관리비', 0.0207, () => '(' + D('재계') + '+' + D('직노') + ')'],
    ['보증', '건설기계대여대금 지급보증', 0.001, () => '(' + D('재계') + '+' + D('직노') + '+' + D('직경') + ')'],
    ['환경', '환경보전비', 0.005, () => '(' + D('재계') + '+' + D('직노') + '+' + D('직경') + ')'],
    ['석면', '석면분담금', 0.00006, () => D('노계')],
    ['임금', '임금채권부담금', 0.0009, () => D('노계')],
    ['기타', '기타경비', 0.055, () => '(' + D('재계') + '+' + D('노계') + ')'],
  ]
  for (const [k, nm, v, base] of 경비) {
    put(k, '', '', nm, null, base().replace(/D\d+/g, (m) => 이름풀기(m, L)) + ' ×', P(v))
    원[L[k] - 2][3] = { f: 'ROUND(' + base() + '*F' + L[k] + ',0)', st: ST.INT }
  }
  put('경계', '', '', '소     계',
    { f: D('직경') + '+' + 경비.map(([k]) => D(k)).join('+'), st: ST.INT }, '직접경비 + 위 항목', '')
  put('순공', '', '', '계 (순공사원가)',
    { f: D('재계') + '+' + D('노계') + '+' + D('경계'), st: ST.INT }, '재료비+노무비+경비', '')
  put('일반', '일반관리비', '', '', null, '순공사원가 ×', P(0.08))
  원[L['일반'] - 2][3] = { f: 'ROUND(' + D('순공') + '*F' + L['일반'] + ',0)', st: ST.INT }
  put('이윤', '이윤', '', '', null, '(노무비+경비+일반관리비) ×', P(0.15))
  원[L['이윤'] - 2][3] = {
    f: 'ROUND((' + D('노계') + '+' + D('경계') + '+' + D('일반') + ')*F' + L['이윤'] + ',0)', st: ST.INT,
  }
  put('총원', '총원가', '', '', { f: D('순공') + '+' + D('일반') + '+' + D('이윤'), st: ST.INT },
    '순공사원가+일반관리비+이윤', '')
  put('부가', '부가가치세', '', '', null, '총원가 ×', P(0.1))
  원[L['부가'] - 2][3] = { f: 'ROUND(' + D('총원') + '*F' + L['부가'] + ',0)', st: ST.INT }
  put('합계', '합계', '', '', { f: D('총원') + '+' + D('부가'), st: ST.INT }, '총원가+부가가치세', '')
  put('도급', '도급공사비', '', '', { f: D('합계'), st: ST.INT }, '', '')
  put('관급', '관급자재비', '', '', FILL('관급'), '따로 넣으십시오', '')
  put('총공', '총공사비', '', '', { f: D('도급') + '+' + D('관급'), st: ST.INT }, '도급공사비+관급자재비', '')

  return {
    name: '원가계산서',
    head: ['비  목', '구  분', '세  목', '금  액', '산 출 내 역', '요율(고치는 칸)'],
    rows: 원, widths: [16, 10, 26, 16, 36, 15],
  }
}

/* ─────────────────────────────── 엑셀 내보내기 */

/** 내역서 + 원가계산서 + 못 찾은 것, 세 장짜리 엑셀 */
export function toNaeyeokXlsx({ rows, 찾음, 못찾음, src, priceName }) {
  const sheets = []

  /* ── ① 내역서 ── */
  const head = ['공종', '규격', '단위', '수량', '단가', '금액', '재료비', '노무비', '경비',
    '단가 어디서', '표본', '등급', '가져온 시트']
  const r1 = rows.map((x, i) => {
    const r = i + 2
    const 단가칸 = x.단가 === null
      ? { v: '', st: ST.BOX }
      : { v: x.단가, st: ST.INT }
    return [
      x.공종, x.규격, x.단위,
      { v: x.수량, st: ST.QTY },
      단가칸,
      { f: 'ROUND(D' + r + '*E' + r + ',0)', st: ST.INT },
      '', '', '',                                   /* 재료비·노무비·경비 — 손으로 가르는 자리 */
      { v: x.맞춤 || '못 찾음', st: x.맞춤 ? ST.GRAY : ST.RED },
      { v: x.표본 === '' ? '' : x.표본, st: ST.BOX },
      { v: x.등급 || '', st: ST.BOX },
      { v: x.시트, st: ST.GRAY },
    ]
  })
  const last = rows.length + 1
  r1.push([{ v: '합  계', st: ST.HEAD }, '', '', '',
    '', { f: 'SUM(F2:F' + Math.max(last, 2) + ')', st: ST.INT },
    { f: 'SUM(G2:G' + Math.max(last, 2) + ')', st: ST.INT },
    { f: 'SUM(H2:H' + Math.max(last, 2) + ')', st: ST.INT },
    { f: 'SUM(I2:I' + Math.max(last, 2) + ')', st: ST.INT }, '', '', '', ''])
  sheets.push({
    name: '내역서', head, rows: r1,
    widths: [30, 20, 7, 12, 12, 14, 13, 13, 13, 14, 7, 9, 14],
  })
  const 합계행 = rows.length + 2

  sheets.push(원가계산서())

  /* ── ③ 못 찾은 단가 ── */
  const 못 = rows.filter((r) => r.단가 === null)
  sheets.push({
    name: '못 찾은 단가',
    head: ['공종', '규격', '단위', '수량', '가져온 시트', '무엇을 해야 하나'],
    rows: 못.length
      ? 못.map((x) => [x.공종, x.규격, x.단위, { v: x.수량, st: ST.QTY }, x.시트,
        { v: '단가표에 이 줄을 넣거나, 내역서 E칸에 손으로 적으십시오', st: ST.GRAY }])
      : [['(없음)', '', '', '', '', '모든 줄에 단가가 붙었습니다']],
    widths: [30, 20, 7, 12, 16, 46],
  })

  /* ── ④ 쓴표 ── */
  const now = new Date()
  const pad = (x) => String(x).padStart(2, '0')
  const when = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()) +
    ' ' + pad(now.getHours()) + ':' + pad(now.getMinutes())
  sheets.push({
    name: '쓴표',
    head: ['항목', '값'],
    rows: [
      ['만든 때', when],
      ['공내역서', src || ''],
      ['단가표', priceName || ''],
      ['내역 줄', rows.length],
      ['단가를 찾은 줄', 찾음],
      ['못 찾은 줄', 못찾음],
      ['', ''],
      ['⚠️ 요율', '원가계산서의 노란 칸입니다. 2026년 조달청 공고 내역서에서 옮긴 값이라'],
      ['', '해마다·공사 종류마다 다릅니다. «반드시» 공고 서류와 맞춰 보고 고치십시오.'],
      ['⚠️ 재료비·노무비·경비', '내역서 G·H·I 칸입니다. 단가 하나로는 가를 수 없어 비워 두었습니다.'],
      ['', '일위대가가 있으면 거기서 갈라 넣으십시오. 원가계산서가 그 합계를 받습니다.'],
      ['⚠️ 단가', '올려 주신 단가표에서 온 값입니다. 사이트가 단가를 갖고 있지 않습니다.'],
      ['', '표준품셈·물가정보·노임단가는 유료라 싣지 않습니다.'],
    ],
    widths: [20, 74], freeze: false,
  })

  return writeWorkbook(sheets)
}

/** 화면에서 한 번에 부르는 것 */
export function runNaeyeok(gongBytes, gongName, priceInput, priceName) {
  const g = readGongNaeyeok(gongBytes, gongName)
  const p = readPrices(priceInput, priceName)
  const f = fillPrices(g.rows, p.table)
  const bytes = toNaeyeokXlsx({
    rows: f.rows, 찾음: f.찾음, 못찾음: f.못찾음, src: g.name, priceName: p.name,
  })
  return { bytes, ...f, 단가표수: p.n, 시트말: g.시트말 }
}
