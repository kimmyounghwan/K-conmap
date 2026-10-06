/**
 * 하도급내역.js — 원도급 내역서 → «하도급 내역서 한 벌» 6장 (G171 · 2026-10-06)
 *
 * 소장님: 「송금지구 하도급내역서 및 여수 새마을 금고 채팅창 확인해봐 … 이대로 만들어서 프로그램으로 만들어줘」
 *         「하도급 내역서 만드는 것은 현재 건설맵에 하도급내역서 만들기 탭에 이런 방식으로 하도급 내역서 만들기 프로그램 만들어」
 *   본보기: 송금지구_하도급완성본2_260725.xlsx (Claude 가 앞 채팅에서 만든 것)
 *     ① 원가계산서-원하도급대비표  ② 직접시공 원가계산서  ③ 하도급내역서(율)
 *     ④ 하도급 대상내역서  ⑤ 내역서(원도급 · 하도급 나란히)  ⑥ 직접시공내역서
 *   앞 채팅에서 정한 기준(봉산소하천 75% · 송금지구 80%):
 *     · 내역 품목의 «단가» 에 율을 곱함(도급액 일괄 · 원가계산서 다시 짓기 아님) → 금액 = 수량 × 단가
 *     · 관급자재는 하도급에서 빼고 «관급 지급분» 으로 표기만
 *     · 문화재지표조사비 · 폐기물처리비 · 지형도면고시 · 한전 및 통신납입금 · 설계안전성검토비 · 조달청계약요청비 ·
 *       공사안전보건대장작성비 같은 줄은 원도급 «직접시공» 으로 둠(하도급 0 · 직접 100%) — 화면에서 줄마다 켜고 끔
 *     · 율 칸은 첫 장 C2 «하나» — 고치면 6장이 전부 다시 셈(수식 · 엑셀이 열 때 다시 셈 · 미리 셈한 값도 같이 넣음)
 * ■ 파일은 브라우저 안에서만 다룹니다.
 */
import { zipSync, strToU8 } from 'fflate'
import { readWorkbook, numToCol } from './qtoxlsx.js'
import { 관급인가 } from './비율.js'
import { 원가표찾기 } from './낙찰맞추기.js'

/* ══════════════════════════════════════════════════════════
   직접시공(하도급에서 뺄) 줄 — 앞 채팅(송금지구) 7가지 + 비슷한 이름
   ══════════════════════════════════════════════════════════ */
const 직접이름 = /문화재.*(조사|발굴)|폐기물\s*처리|지형\s*도면\s*고시|한\s*전.*(납입|불입|인입|수탁)|통신.*납입|설계\s*안전성\s*검토|조달청.*(계약|수수료|요청)|안전\s*보건\s*대장|공사\s*손해\s*보험/
const 맨 = (t) => String(t ?? '').replace(/[\s　]+/g, '')
const 원 = (n) => new Intl.NumberFormat('ko-KR').format(Math.round(n || 0)) + '원'
export const 줄열쇠 = (r) => r.시트 + '#' + r.줄
export function 직접후보(읽은) {
  return 읽은.rows.filter((r) => 직접이름.test(맨(r.공종) + ' ' + 맨(r.규격))).map(줄열쇠)
}

/* ══════════════════════════════════════════════════════════
   당초 · 변경 «여러 줄» 내역서 → 고른 상태 «한 줄» 로 펴기
     송금지구 본보기가 바로 2줄 변경내역서(품목마다 당초 줄 + 변경 줄)에서 나왔습니다.
     하도급 계약은 «지금 금액»(보통 변경 줄)으로 하므로, 고른 상태의 숫자만 남긴 1줄 표를 만들어
     보통 내역서와 똑같이 읽습니다. 7행 차수내역서(①총괄당초 … ⑦잔공사)도 같은 길.
     원가계산서도 비목마다 상태 줄이 붙어 있으면 같은 상태로 폅니다.
   ══════════════════════════════════════════════════════════ */
export function 상태알기(책, 변경) {
  let m = null
  try { m = 변경.파일읽기(책, '') } catch (e) { return { 상태: ['값'], 시트: '', 꼴: '1줄' } }
  const s = m.시트들.find((x) => x.시트 === m.고른) || m.시트들[0]
  return { 상태: s.상태, 시트: s.시트, 꼴: s.꼴 }
}
const 글맨 = (x) => (x === null || x === undefined ? '' : String(x).replace(/[\s　]+/g, ''))
const 숫자글 = (x) => typeof x === 'number' || /^-?[\d,]*\.?\d+%?$/.test(글맨(x))
export function 상태펴기(책, 변경, 상태번호) {
  const 새 = {}
  let 원상태 = null
  for (const [이름, grid] of Object.entries(책)) {
    새[이름] = grid
    if (!grid || !grid.length) continue
    let m = null
    try { m = 변경.시트읽기(이름, grid) } catch (e) { m = null }
    if (m && m.품목수 && m.상태.length > 1) {
      if (!원상태) 원상태 = m.상태
      const s = Math.min(상태번호, m.상태.length - 1)
      const 칸 = m.칸, 수칸 = new Set([칸.수량, 칸.율, 칸.비고].filter((j) => j >= 0))
      for (const g of Object.values(m.갈래칸 || {})) for (const j of [g.단가, g.금액]) if (j >= 0) 수칸.add(j)
      const 표 = grid.slice(0, m.자료부터 - 1).map((r) => (r ? r.slice() : r))
      for (const x of m.줄) {
        const 행 = x.행 || []
        const 첫 = grid[x.r - 1] || []
        const 그 = 행[s] ? grid[행[s] - 1] || [] : null
        const row = 첫.slice()
        for (const j of 수칸) row[j] = 그 ? (그[j] ?? null) : null
        if (그) {
          for (const j of [칸.품, 칸.규]) if (j >= 0 && 글맨(그[j]) && 행[s] !== x.r) row[j] = 그[j]
          if (칸.단위 >= 0 && 글맨(그[칸.단위])) row[칸.단위] = 그[칸.단위]
        }
        if (칸.구분 >= 0) row[칸.구분] = null
        표.push(row)
      }
      표.원행 = [...Array.from({ length: m.자료부터 - 1 }, (_, i) => i + 1), ...m.줄.map((x) => x.r)]   /* 편 줄 → 원본 엑셀 줄(화면에 원본 줄 번호로 보이려고) */
      새[이름] = 표
    }
  }
  /* 원가계산서 — 비목 이름 줄 아래에 상태 줄(이름 없이 금액만)이 붙은 꼴 */
  for (const [이름, grid] of Object.entries(책)) {
    if (!/원가/.test(이름) || !grid || !grid.length || 새[이름] !== grid) continue
    const 편 = 원가펴기(grid, 원상태 || [], 상태번호)
    if (편) 새[이름] = 편
  }
  return 새
}
function 원가펴기(grid, 상태들, s) {
  let hi = -1, i금 = -1
  for (let i = 0; i < Math.min(grid.length, 15); i++) {
    const j = (grid[i] || []).findIndex((x) => 글맨(x) === '금액')
    if (j >= 0) { hi = i; i금 = j; break }
  }
  if (hi < 0) return null
  const 상태맨 = 상태들.map(글맨)
  const 상태칸수 = {}
  const 이름수 = {}
  for (let r = hi + 1; r < grid.length; r++) {
    const row = grid[r] || []
    for (let j = 0; j < i금; j++) {
      const t = 글맨(row[j])
      if (!t) continue
      if (상태맨.includes(t) || /^[①-⑳]/.test(t)) 상태칸수[j] = (상태칸수[j] || 0) + 1
      else if (t.length >= 2 && !숫자글(t)) 이름수[j] = (이름수[j] || 0) + 1
    }
  }
  const 꼽 = (o) => Object.entries(o).sort((a, b) => b[1] - a[1])[0]
  const 상태칸 = 꼽(상태칸수) && 꼽(상태칸수)[1] >= 3 ? +꼽(상태칸수)[0] : -1
  const 이름칸 = 꼽(이름수) ? +꼽(이름수)[0] : -1
  if (이름칸 < 0) return null
  /* 덩이: 이름 칸에 글이 있는 줄에서 새 덩이 · 이름 없이 숫자만 있는 줄은 앞 덩이의 다음 상태 */
  const 덩이 = []
  for (let r = hi + 1; r < grid.length; r++) {
    const row = grid[r] || []
    const 이름있음 = !!글맨(row[이름칸])
    const 빈 = row.every((x) => !글맨(x))
    if (이름있음 || !덩이.length) { 덩이.push([row]); continue }
    if (!빈) 덩이[덩이.length - 1].push(row)
  }
  const 여럿 = 덩이.filter((d) => d.length >= 2 && d[1].some((x, j) => j >= i금 && 숫자글(x) && 글맨(x))).length
  if (여럿 < 3) return null
  const 표 = grid.slice(0, hi + 1).map((r) => (r ? r.slice() : r))
  for (const d of 덩이) {
    let 그 = null
    if (상태칸 >= 0) {
      그 = d.find((row) => { const t = 글맨(row[상태칸]); const k = 상태맨.indexOf(t); return k >= 0 ? k === s : /^[①-⑳]/.test(t) && t.charCodeAt(0) - 0x2460 === s }) || null
    } else 그 = d[s] || null
    const row = d[0].slice()
    const 끝 = Math.max(row.length, ...(그 ? [그.length] : [0]))
    for (let j = i금; j < 끝; j++) {
      const v = 그 ? 그[j] : null
      if (j === i금) { row[j] = v ?? null; continue }
      if (글맨(v)) row[j] = v
      else if (숫자글(row[j])) row[j] = null
    }
    if (상태칸 >= 0) row[상태칸] = null
    표.push(row)
  }
  return 표
}

/* 단수 — 원 미만 버림(기본) · 반올림 */
/* 엑셀과 같게 — 먼저 소수 6자리로 반올림(부동소수 찌꺼기 제거) 뒤 원 미만을 끊음 */
const 여섯 = (v) => Math.round(v * 1e6) / 1e6
const 끊기 = (v, 꼴) => { const w = 여섯(v); return 꼴 === '반올림' ? Math.round(w) : w < 0 ? -Math.floor(-w) : Math.floor(w) }
const 엑셀끊기 = (식, 꼴) => (꼴 === '반올림' ? 'ROUND(' + 식 + ',0)' : 'ROUNDDOWN(ROUND(' + 식 + ',6),0)')

/* ══════════════════════════════════════════════════════════
   셈 — 줄마다 원도급 · 하도급 · 직접시공 (엑셀 수식과 똑같이)
   ══════════════════════════════════════════════════════════ */
const 갈래들 = ['노무비', '재료비', '경비']          /* 본보기 차례: 노무 → 재료 → 경비 */
export function 하도급셈(읽은, 옵션 = {}) {
  const 율 = Number(옵션.율) > 0 ? Number(옵션.율) / 100 : 0.8
  const 꼴 = 옵션.단수꼴 || '버림'
  const 직접 = 옵션.직접 || new Set()
  const 셋 = !!읽은.셋있나
  const 줄 = []
  for (const s of 읽은.시트들) {
    const 묶음 = []
    for (const r of s.rows) 묶음.push({ 꼴: '품', r, 줄: r.줄 })
    for (const m of s.모음들 || []) if (m.모음꼴 === '머리' && m.아이줄 && m.아이줄.length) 묶음.push({ 꼴: '머리', r: m, 줄: m.줄 })
    묶음.sort((a, b) => a.줄 - b.줄 || (a.꼴 === '머리' ? -1 : 1))
    if (읽은.시트들.length > 1) 줄.push({ 꼴: '시트', 시트: s.시트, 이름: '【 ' + s.시트 + ' 】', 아이: new Set(s.rows.map((r) => r.줄)) , 시트이름: s.시트 })
    for (const x of 묶음) {
      if (x.꼴 === '머리') 줄.push({ 꼴: '머리', 시트: s.시트, 이름: x.r.공종, 규격: x.r.규격 || '', 아이: new Set(x.r.아이줄), 표시: x.r.번호 || x.r.표시 || '', 원금액: x.r.총금액 ?? null })
      else 줄.push(품줄(x.r, s))
    }
  }
  function 품줄(r, s) {
    const 관 = 관급인가(r, 옵션)
    const 뺌 = 관 ? '관급' : 직접.has(줄열쇠(r)) ? '직접' : ''
    const o = { 꼴: '품', 시트: s.시트, 줄: r.줄, r, 이름: r.공종, 규격: r.규격 || '', 단위: r.단위 || '', 수량: r.수량, 뺌, 원: {}, 하: {} }
    const 곱셈 = (g) => { const v = r.값[g]; return !!(v && v.곱셈 && r.수량 !== null && v.단가 !== null) }
    const 쓸 = 셋 ? 갈래들 : []
    for (const g of 쓸) {
      const v = r.값[g] || {}
      const 단 = v.단가 ?? null, 금 = v.금액 ?? (단 !== null && r.수량 !== null ? 끊기(단 * r.수량, 꼴) : null)
      o.원[g] = { 단가: 단, 금액: 금, 곱셈: 곱셈(g) }
      if (뺌) { o.하[g] = { 단가: 단 === null ? null : 0, 금액: 금 === null ? null : 0 }; continue }
      const 하단 = 단 === null ? null : 끊기(단 * 율, 꼴)
      const 하금 = 금 === null ? null : o.원[g].곱셈 ? 끊기(r.수량 * 하단, 꼴) : 끊기(금 * 율, 꼴)
      o.하[g] = { 단가: 하단, 금액: 하금 }
    }
    const t = r.값['합계'] || {}
    const 합단 = t.단가 ?? (셋 ? 쓸.reduce((a, g) => a + (o.원[g].단가 || 0), 0) : null)
    const 합금 = t.금액 ?? r.총금액 ?? (셋 ? 쓸.reduce((a, g) => a + (o.원[g].금액 || 0), 0) : null)
    o.원.합계 = { 단가: 합단, 금액: 합금, 곱셈: !!(t.곱셈 && r.수량 !== null && 합단 !== null) }
    /* 갈래가 있는 내역서인데 이 줄만 갈래 칸이 비고 «합계 단가 · 금액» 만 있는 꼴(일식 품목) — 합계에 율을 곱함 */
    o.합계만 = 셋 && 쓸.every((g) => o.원[g].단가 === null && o.원[g].금액 === null) && t.단가 !== null && t.단가 !== undefined && r.수량 !== null && 합금 !== null
    if (셋 && !o.합계만) {
      o.하.합계 = { 단가: 쓸.reduce((a, g) => a + (o.하[g].단가 || 0), 0), 금액: 쓸.reduce((a, g) => a + (o.하[g].금액 || 0), 0) }
    } else if (뺌) o.하.합계 = { 단가: 합단 === null ? null : 0, 금액: 합금 === null ? null : 0 }
    else {
      const 하단 = 합단 === null ? null : 끊기(합단 * 율, 꼴)
      o.하.합계 = { 단가: 하단, 금액: 합금 === null ? null : o.원.합계.곱셈 ? 끊기(r.수량 * 하단, 꼴) : 끊기(합금 * 율, 꼴) }
    }
    return o
  }
  /* 합 — 머리 · 시트 · 맨 위 «순 공 사 비» · 맨 아래 «합 계» */
  const 품들 = 줄.filter((x) => x.꼴 === '품')
  const 더 = (목록, 편, g, 거르개 = () => true) => 목록.filter(거르개).reduce((a, x) => a + ((x[편][g] && x[편][g].금액) || 0), 0)
  const 합칸 = (목록) => {
    const o = { 원: {}, 하: {}, 대상: 0, 직접: {} }
    for (const g of [...(셋 ? 갈래들 : []), '합계']) {
      o.원[g] = 더(목록, '원', g); o.하[g] = 더(목록, '하', g)
      o.직접[g] = 더(목록, '원', g, (x) => x.뺌 !== '관급') - o.하[g]
    }
    o.대상 = 더(목록, '원', '합계', (x) => !x.뺌)
    o.관급 = 더(목록, '원', '합계', (x) => x.뺌 === '관급')
    return o
  }
  for (const x of 줄) if (x.꼴 !== '품') x.합 = 합칸(품들.filter((y) => y.시트 === x.시트 && x.아이.has(y.줄)))
  const 전체 = 합칸(품들)
  for (const x of 품들) {
    x.직접 = {}
    for (const g of [...(셋 ? 갈래들 : []), '합계']) x.직접[g] = x.뺌 === '관급' ? 0 : ((x.원[g] && x.원[g].금액) || 0) - ((x.하[g] && x.하[g].금액) || 0)
  }
  return { 율, 꼴, 셋, 줄, 품들, 전체, 직접수: 품들.filter((x) => x.뺌 === '직접').length, 관급수: 품들.filter((x) => x.뺌 === '관급').length }
}

/* ══════════════════════════════════════════════════════════
   엑셀 쓰기 — 송금지구 본보기 «틀» 그대로(시트 차례 · 제목 · 칸 이름 · 칸 차례 · 색)
     만드는 차례대로 앞 장 숫자를 다음 장이 받아 셈합니다:
       ⑤ 내역서(원도급 값) → ④ 하도급 대상내역서(뺄 줄 표시 · 대상 · 하도급) → ③ 하도급내역서(갈래별 단가 × 율)
       → ⑥ 직접시공내역서(도급 − 하도급) → ① 원가계산서-원하도급대비표(원가 × 율) → ② 직접시공 원가계산서(① 을 받아)
     ⑤ 내역서의 «하도급» 칸은 ③ 을 그대로 보여 줌. 율 칸은 첫 장 C2 하나(다른 장 율 칸은 그 칸을 보여 줌).
   ══════════════════════════════════════════════════════════ */
const esc = (s) => String(s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/* 꾸밈 — 쓰는 꼴마다 번호를 매겨 styles.xml 을 짓습니다 */
function 꾸밈() {
  const fonts = ['<font><sz val="9"/><name val="맑은 고딕"/></font>']
  const fills = ['<fill><patternFill patternType="none"/></fill>', '<fill><patternFill patternType="gray125"/></fill>']
  const fmts = []
  const xfs = ['<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>']
  const 표 = new Map()
  const 붙박이 = { General: 0, '#,##0': 3, '0%': 9, '0.00%': 10 }
  const 하나 = (arr, x) => { let i = arr.indexOf(x); if (i < 0) { arr.push(x); i = arr.length - 1 } return i }
  function 꼴(d = {}) {
    const k = JSON.stringify(d)
    if (표.has(k)) return 표.get(k)
    const fi = 하나(fonts, '<font>' + (d.b ? '<b/>' : '') + (d.i ? '<i/>' : '') + '<sz val="' + (d.sz || 9) + '"/>' + (d.c ? '<color rgb="FF' + d.c + '"/>' : '') + '<name val="맑은 고딕"/></font>')
    const fl = d.bg ? 하나(fills, '<fill><patternFill patternType="solid"><fgColor rgb="FF' + d.bg + '"/><bgColor indexed="64"/></patternFill></fill>') : 0
    let nf = 0
    if (d.n) {
      if (d.n in 붙박이) nf = 붙박이[d.n]
      else { let f = fmts.find((x) => x[1] === d.n); if (!f) { f = [200 + fmts.length, d.n]; fmts.push(f) } nf = f[0] }
    }
    const al = '<alignment' + (d.h ? ' horizontal="' + d.h + '"' : '') + ' vertical="center"' + (d.wrap ? ' wrapText="1"' : '') + '/>'
    xfs.push('<xf numFmtId="' + nf + '" fontId="' + fi + '" fillId="' + fl + '" borderId="' + (d.선 === false ? 0 : 1) + '" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">' + al + '</xf>')
    표.set(k, xfs.length - 1)
    return xfs.length - 1
  }
  function xml() {
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      (fmts.length ? '<numFmts count="' + fmts.length + '">' + fmts.map(([id, c]) => '<numFmt numFmtId="' + id + '" formatCode="' + esc(c) + '"/>').join('') + '</numFmts>' : '') +
      '<fonts count="' + fonts.length + '">' + fonts.join('') + '</fonts>' +
      '<fills count="' + fills.length + '">' + fills.join('') + '</fills>' +
      '<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border>' +
      '<border><left style="thin"><color rgb="FFA6A6A6"/></left><right style="thin"><color rgb="FFA6A6A6"/></right><top style="thin"><color rgb="FFA6A6A6"/></top><bottom style="thin"><color rgb="FFA6A6A6"/></bottom><diagonal/></border></borders>' +
      '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
      '<cellXfs count="' + xfs.length + '">' + xfs.join('') + '</cellXfs>' +
      '<cellStyles count="1"><cellStyle name="표준" xfId="0" builtinId="0"/></cellStyles></styleSheet>'
  }
  return { 꼴, xml }
}

/** 시트 하나: { name, rows: Map(r → [{c, v?, f?, s}]), merges, widths, hide, freeze:{r,c}, ht: Map(r → 높이), 가로 } */
function 새시트(name) { return { name, rows: new Map(), merges: [], widths: [], hide: [], freeze: null, ht: new Map(), 가로: true, 제목줄: null } }
function 칸(sh, r, c, 내용, s) {
  if (!sh.rows.has(r)) sh.rows.set(r, [])
  const o = typeof 내용 === 'object' && 내용 !== null ? { ...내용 } : { v: 내용 }
  o.c = c; o.s = s || 0
  const 줄 = sh.rows.get(r)
  const i = 줄.findIndex((x) => x.c === c)
  if (i >= 0) 줄[i] = o; else 줄.push(o)
}
let 값빼기 = false        /* 시험용 — 미리 셈한 값을 빼고 수식만(LibreOffice 로 다시 셈해 맞대 봄) */
function 시트xml(sh) {
  const out = []
  for (const r of [...sh.rows.keys()].sort((a, b) => a - b)) {
    const cs = sh.rows.get(r).sort((a, b) => a.c - b.c).map((o) => {
      const ref = numToCol(o.c) + r
      if (o.f !== undefined) {
        const v = 값빼기 ? null : o.v
        if (v === null || v === undefined || v === '') return '<c r="' + ref + '" s="' + o.s + '"><f>' + esc(o.f) + '</f></c>'
        if (typeof v === 'number') return '<c r="' + ref + '" s="' + o.s + '"><f>' + esc(o.f) + '</f><v>' + (Number.isFinite(v) ? v : 0) + '</v></c>'
        return '<c r="' + ref + '" s="' + o.s + '" t="str"><f>' + esc(o.f) + '</f><v>' + esc(v) + '</v></c>'
      }
      const v = o.v
      if (v === null || v === undefined || v === '') return '<c r="' + ref + '" s="' + o.s + '"/>'
      if (typeof v === 'number') return '<c r="' + ref + '" s="' + o.s + '"><v>' + (Number.isFinite(v) ? v : 0) + '</v></c>'
      return '<c r="' + ref + '" s="' + o.s + '" t="inlineStr"><is><t xml:space="preserve">' + esc(v) + '</t></is></c>'
    }).join('')
    const ht = sh.ht.get(r)
    out.push('<row r="' + r + '"' + (ht ? ' ht="' + ht + '" customHeight="1"' : '') + '>' + cs + '</row>')
  }
  const H = new Set(sh.hide)
  const cols = sh.widths.map((w, i) => '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + (w || 10) + '" customWidth="1"' + (H.has(i + 1) ? ' hidden="1"' : '') + '/>').join('')
  const 넓 = Math.max(sh.widths.length, ...[...sh.rows.values()].flat().map((o) => o.c))
  const 끝 = Math.max(1, ...sh.rows.keys())
  const fz = sh.freeze
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
    '<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>' +
    '<dimension ref="A1:' + numToCol(넓) + 끝 + '"/>' +
    '<sheetViews><sheetView workbookViewId="0" zoomScale="90">' +
    (fz ? '<pane ' + (fz.c > 1 ? 'xSplit="' + (fz.c - 1) + '" ' : '') + 'ySplit="' + (fz.r - 1) + '" topLeftCell="' + numToCol(fz.c) + fz.r + '" activePane="' + (fz.c > 1 ? 'bottomRight' : 'bottomLeft') + '" state="frozen"/>' : '') +
    '</sheetView></sheetViews>' +
    '<sheetFormatPr defaultRowHeight="15"/>' +
    (cols ? '<cols>' + cols + '</cols>' : '') +
    '<sheetData>' + out.join('') + '</sheetData>' +
    (sh.merges.length ? '<mergeCells count="' + sh.merges.length + '">' + sh.merges.map((m) => '<mergeCell ref="' + m + '"/>').join('') + '</mergeCells>' : '') +
    '<pageMargins left="0.4" right="0.4" top="0.6" bottom="0.6" header="0.3" footer="0.3"/>' +
    '<pageSetup paperSize="9" orientation="' + (sh.가로 ? 'landscape' : 'portrait') + '" fitToWidth="1" fitToHeight="0"/>' +
    '</worksheet>'
}
function 책쓰기(sheets, 꼴xml) {
  const files = {}
  const n = sheets.length
  files['[Content_Types].xml'] = strToU8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
    sheets.map((_, i) => '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>').join('') +
    '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>')
  files['_rels/.rels'] = strToU8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>')
  const 제목줄 = sheets.map((s, i) => (s.제목줄 ? '<definedName name="_xlnm.Print_Titles" localSheetId="' + i + '">\'' + esc(s.name).replace(/'/g, "''") + '\'!$' + s.제목줄[0] + ':$' + s.제목줄[1] + '</definedName>' : '')).join('')
  files['xl/workbook.xml'] = strToU8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' +
    sheets.map((s, i) => '<sheet name="' + esc(s.name) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>').join('') + '</sheets>' +
    (제목줄 ? '<definedNames>' + 제목줄 + '</definedNames>' : '') + '<calcPr calcId="0" fullCalcOnLoad="1"/></workbook>')
  files['xl/_rels/workbook.xml.rels'] = strToU8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    sheets.map((_, i) => '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>').join('') +
    '<Relationship Id="rId' + (n + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>')
  files['xl/styles.xml'] = strToU8(꼴xml)
  sheets.forEach((s, i) => { files['xl/worksheets/sheet' + (i + 1) + '.xml'] = strToU8(시트xml(s)) })
  return zipSync(files, { level: 6 })
}

/* ══════════════════════════════════════════════════════════
   여섯 장 만들기 — 시트 차례는 본보기 그대로 ①②③④⑤⑥
   ══════════════════════════════════════════════════════════ */
const 장 = { 대비: '원가계산서-원하도급대비표', 직원: '직접시공 원가계산서', 하내: '하도급내역서', 대상: '하도급 대상내역서', 내역: '내역서', 직내: '직접시공내역서' }
const 따 = (n) => "'" + n.replace(/'/g, "''") + "'!"
const pct = (r) => Math.round(r * 10000) / 100
const 넷 = (v) => { let t = v.toFixed(4); while (t.endsWith('0') && t.split('.')[1].length > 2) t = t.slice(0, -1); return t }   /* 엑셀 TEXT(x,"0.00##") 와 같게 */
const 반올 = (v) => { const w = 여섯(v); return w < 0 ? -Math.round(-w) : Math.round(w) }     /* 엑셀 ROUND(x,0) 과 같게 */
const 경비역 = new Set(['산출경비', '산재', '고용', '건강', '연금', '노인', '퇴직', '산안', '석면', '임금', '법정분담', '환경', '하도급보증', '기계보증', '이행보증', '기타경비', '경계', '배상', '폐기물'])
const 재역 = new Set(['직재', '간재', '작업설', '재계']), 노역 = new Set(['직노', '간노', '노계'])

/** 화면 미리 보기 — 원가계산서 도급액과 하도급 도급액(도급액 × 율 · 원 미만 반올림) */
export function 원가미리(책, 읽은, 율퍼) {
  let 원가 = null
  try { 원가 = 원가표찾기(책 || {}, 읽은.시트들.map((s) => s.시트)) } catch (e) { 원가 = null }
  if (!원가) return null
  const 도 = 원가.rows.find((x) => x.역 === '도급' && typeof x.금액 === 'number')
  if (!도) return { 시트: 원가.시트, 도급액: null, 하도급액: null }
  const 율 = Number(율퍼) > 0 ? Number(율퍼) / 100 : 0.8
  return { 시트: 원가.시트, 도급액: 도.금액, 하도급액: 반올(도.금액 * 율) }
}

export function 하도급한벌(buf, 읽은, 옵션 = {}) {
  const 셈 = 하도급셈(읽은, 옵션)
  const { 율, 꼴: 단꼴, 셋 } = 셈
  const 율p = pct(율)
  const 이름 = { ...장, 하내: '하도급내역서(' + 율p + '%)' }
  const 꾸 = 꾸밈(), 꼴 = 꾸.꼴
  const 공사명 = String(옵션.공사명 || '').trim(), 발주처 = String(옵션.발주처 || '').trim()
  const 누가 = [옵션.원도급사 && '원도급 ' + String(옵션.원도급사).trim(), 옵션.하도급사 && '하도급 ' + String(옵션.하도급사).trim()].filter(Boolean).join(' → ')
  const 꼬리 = (사이) => (공사명 ? 사이 + '공사명: ' + 공사명 : '') + (발주처 ? 사이 + '발주처: ' + 발주처 : '') + (누가 ? 사이 + 누가 : '')
  const 경고 = []
  const 끊 = (식) => 엑셀끊기(식, 단꼴)
  const 율글 = (앞, 뒤, 칸식) => ({ f: '"' + 앞 + '"&ROUND(' + 칸식 + '*100,2)&"%' + 뒤 + '"', v: 앞 + 율p + '%' + 뒤 })
  const 직율글 = (앞, 뒤, 칸식) => ({ f: '"' + 앞 + '"&ROUND((1-' + 칸식 + ')*100,2)&"%' + 뒤 + '"', v: 앞 + pct(1 - 율) + '%' + 뒤 })
  const 첫율 = 따(이름.대비) + '$C$2'
  const 책 = 옵션.책 || (() => { try { return readWorkbook(buf) } catch (e) { return null } })()
  let 원가 = null
  try { 원가 = 원가표찾기(책 || {}, 읽은.시트들.map((s) => s.시트)) } catch (e) { 원가 = null }

  /* ── 줄: 맨 위 «순 공 사 비» (원본에 첫 줄로 있으면 그 줄) · 품목 · 머리 차례 그대로 ── */
  const 원줄들 = 셈.줄
  const 순첫 = 읽은.시트들.length === 1 && 원줄들[0] && 원줄들[0].꼴 === '머리' && /^[^가-힣]*순공사비(계|합계)?$/.test(맨(원줄들[0].이름))
  const L = 순첫 ? 원줄들.slice() : [{ 꼴: '순', 이름: '순 공 사 비', 표시: '' }, ...원줄들]
  L.forEach((x, i) => { x.i = i })
  const n = L.length
  const 품들 = L.filter((x) => x.꼴 === '품')
  const 갈 = 셋 ? ['노무비', '재료비', '경비'] : []
  const 더 = (목록, f) => 목록.reduce((a, x) => a + (f(x) || 0), 0)
  const 합값 = (목록) => {
    const o = { 원: {}, 하: {}, 직접: {}, 대상: 0 }
    for (const g of [...갈, '합계']) {
      o.원[g] = 더(목록, (x) => x.원[g] && x.원[g].금액); o.하[g] = 더(목록, (x) => x.하[g] && x.하[g].금액); o.직접[g] = 더(목록, (x) => x.직접[g])
    }
    o.대상 = 더(목록, (x) => (x.뺌 ? 0 : x.원.합계 && x.원.합계.금액))
    return o
  }
  const 전 = 합값(품들)
  const 범 = (x) => {                         /* 머리 줄이 더할 품목 자리(L 차례) */
    if (x.꼴 === '순') return [1, n - 1]
    const ids = 품들.filter((y) => y.시트 === x.시트 && x.아이 && x.아이.has(y.줄)).map((y) => y.i)
    return ids.length ? [Math.min(...ids), Math.max(...ids)] : [x.i, x.i]
  }
  /* 맨 위 «순 공 사 비» — 원본 첫 줄이 순공사비면 그 줄.
     아니면 맨 윗단 묶음(공종 · 따로 선 품목) 가운데 원가계산서 직접공사비(재료비 + 직접노무비 + 산출경비)와 합이 맞는 것만 —
     설계내역서에는 안전관리비 · 운반비 · 폐기물처리비 · 관급자재 묶음이 따로 붙어 있어, 다 더하면 순공사비가 아닙니다. */
  const 직공 = (() => {
    if (!원가) return 0
    const 첫값 = {}
    for (const x of 원가.rows) if (x.역 && !(x.역 in 첫값) && typeof x.금액 === 'number') 첫값[x.역] = x.금액
    const 있 = (k) => k in 첫값
    /* 재료비: 직접 · 간접 · 작업설이 따로 있으면 그 합, 없으면 «재료비(계)» · 노무비: 직접노무비, 없으면 «노무비»(간접노무비가 따로 붙은 꼴) · 경비: 산출경비 */
    const 재 = 있('직재') || 있('간재') || 있('작업설') ? (첫값.직재 || 0) + (첫값.간재 || 0) + (첫값.작업설 || 0) : (첫값.재계 || 0)
    const 노 = 있('직노') ? 첫값.직노 : (첫값.노계 || 0)
    return 재 + 노 + (첫값.산출경비 || 0)
  })()
  let 순밖 = null, 순라벨 = '순 공 사 비'          /* 순밖 = 순공사비에서 뺄 맨 윗단 묶음(관급 묶음은 늘 빠짐) · null 이면 관급 뺀 전부 */
  if (!순첫) {
    const 머리들 = L.filter((x) => (x.꼴 === '머리' || x.꼴 === '시트') && x.아이 && x.아이.size)
    const 담김 = (x, y) => y.시트 === x.시트 && y.아이.size >= x.아이.size && [...x.아이].every((z) => y.아이.has(z))
    const 윗 = 머리들.filter((x) => !머리들.some((y) => y !== x && 담김(x, y) && (y.아이.size > x.아이.size || y.i < x.i)))
    const 낱 = 품들.filter((p) => !머리들.some((y) => y.시트 === p.시트 && y.아이.has(p.줄)))
    const 값 = (u) => (u.꼴 === '품' ? (u.뺌 === '관급' ? 0 : (u.원.합계 && u.원.합계.금액) || 0) : (u.합.원.합계 || 0) - (u.합.관급 || 0))
    const 후보 = [...윗, ...낱].filter((u) => Math.abs(값(u)) > 0.5).sort((a, b) => a.i - b.i)
    const 허용 = Math.max(2, Math.abs(직공) * 1e-5)
    const 합 = (목록) => 목록.reduce((a, u) => a + 값(u), 0)
    const 맞 = (밖) => Math.abs(합(후보) - 합(밖) - 직공) <= 허용
    let 정해짐 = false
    if (!원가 || 후보.length <= 1 || (직공 && 맞([]))) 정해짐 = true                     /* 원가계산서가 없음 · 묶음 하나 · 관급 뺀 전부가 원가계산서 직접공사비와 맞음 */
    if (!정해짐 && 직공) {
      /* ① 원가계산서에 따로 적힌 항목(운반비 · 안전관리비 · 폐기물처리비 · 고재처리 …)과 이름이 같은 묶음 · 품목은 순공사비 밖 */
      const 이름맨 = (t) => 맨(String(t || '')).replace(/^[^가-힣a-zA-Z]+/, '').replace(/\(.*?\)/g, '')
      const 직역 = new Set(['직재', '간재', '작업설', '재계', '직노', '노계', '간노', '산출경비', '경계', '소계', '순공', '공급', '부가', '도급', '총공사비', '관급'])
      const 밖줄 = 원가.rows.filter((x) => x.이름 && !직역.has(x.역 || ''))
      const 밖이름 = 밖줄.map((x) => 이름맨(x.이름).replace(/비$/, '')).filter((t) => t.length >= 2)
      const 밖금액 = 밖줄.map((x) => x.금액).filter((v) => typeof v === 'number' && Math.abs(v) >= 1)
      const 이름같 = (u) => { const t = 이름맨(u.이름).replace(/비$/, ''); return t.length >= 2 && 밖이름.some((m) => m === t || (m.length >= 3 && t.includes(m)) || (t.length >= 3 && m.includes(t))) }
      const 금액같 = (u) => 밖금액.some((v) => Math.abs(v - 값(u)) <= Math.max(1, Math.abs(v) * 1e-6))
      const 밖후보 = 후보.filter((u) => 이름같(u) || 금액같(u))
      if (밖후보.length && 맞(밖후보)) { 순밖 = 밖후보; 정해짐 = true }
      else if (밖후보.length > 1 && 밖후보.length <= 12) {
        for (let m = 1; m < (1 << 밖후보.length) && !정해짐; m++) {
          const 밖 = 밖후보.filter((_, k) => m & (1 << k))
          if (맞(밖)) { 순밖 = 밖; 정해짐 = true }
        }
      }
    }
    if (!정해짐 && 직공 && 후보.length <= 16) {
      /* ② 맨 윗단 묶음 가운데 몇 개를 빼면 원가계산서 직접공사비와 맞는지(적게 빼는 것부터) */
      const 묶 = 후보.length
      for (let 뺄수 = 1; 뺄수 < 묶 && !정해짐; 뺄수++) {
        for (let m = 1; m < (1 << 묶) && !정해짐; m++) {
          let c = 0; for (let k = 0; k < 묶; k++) if (m & (1 << k)) c++
          if (c !== 뺄수) continue
          const 밖 = 후보.filter((_, k) => m & (1 << k))
          if (맞(밖)) { 순밖 = 밖; 정해짐 = true }
        }
      }
    }
    if (!정해짐) 순라벨 = '합  계 (관급 제외)'
    L[0].이름 = 순라벨
    const 밖에 = (p) => !!순밖 && 순밖.some((u) => (u.꼴 === '품' ? u === p : u.시트 === p.시트 && u.아이.has(p.줄)))
    L[0].합 = 합값(품들.filter((p) => p.뺌 !== '관급' && !밖에(p)))
    L[0].밖 = 순밖 || []
  }
  /* 맨 위 줄의 수식 — 전체(관급 뺀) − 순공사비 밖 묶음 */
  const 순식 = (편, col, 행번, 품표, 관표, 전체식) => {
    const 밖 = (L[0].밖 || []).map((u) => {
      if (u.꼴 === '품') return col + 행번(u)
      const [a, b] = 범(u), ra = 행번({ i: a }), rb = 행번({ i: b })
      if (편 === '원') return 'SUMIFS(' + col + '$' + ra + ':' + col + '$' + rb + ',$' + 품표 + '$' + ra + ':$' + 품표 + '$' + rb + ',"품",$' + 관표 + '$' + ra + ':$' + 관표 + '$' + rb + ',"<>관급")'
      return col + 행번(u)
    })
    return 밖.length ? 전체식 + '-' + 밖.join('-') : 전체식
  }
  /* 원본 머리 금액 ↔ 아래 품목 합 */
  const 어긋 = 원줄들.filter((x) => x.꼴 === '머리' && typeof x.원금액 === 'number' && x.합 && Math.abs(x.원금액 - x.합.원.합계) >= 1)
  if (어긋.length) {
    const 보기 = 어긋.slice().sort((a, b) => a.아이.size - b.아이.size).slice(0, 3).map((x) => '«' + String(x.이름).trim() + '» 원본 ' + 원(x.원금액) + ' ↔ 품목 합 ' + 원(x.합.원.합계)).join(' · ')
    경고.push(['머리 금액', '원본 머리 금액이 아래 품목 합과 다른 곳이 ' + 어긋.length + '곳 있습니다 (' + 보기 + ') — 새 엑셀의 머리 · 합계는 품목 합(SUMIF)으로 셉니다'])
  }
  /* 원본 줄 점검 — ① 합계 금액 ≠ 노무 + 재료 + 경비 금액(원본 오기 · 깨진 수식 값)  ② 갈래 없이 합계만 있는 줄  ③ 단가 · 갈래 없이 금액만 있는 줄(하도급 0) */
  if (셋) {
    const 원줄번 = (x) => (책 && 책[x.시트] && 책[x.시트].원행 ? 책[x.시트].원행[x.줄 - 1] || x.줄 : x.줄)
    const 갈합 = (x) => 갈.reduce((a, g) => a + ((x.원[g] && x.원[g].금액) || 0), 0)
    const 갈있 = (x) => 갈.some((g) => x.원[g] && (x.원[g].금액 !== null || x.원[g].단가 !== null))
    const 틀린 = 품들.filter((x) => 갈있(x) && typeof (x.원.합계 && x.원.합계.금액) === 'number' && Math.abs(x.원.합계.금액 - 갈합(x)) > 1)
    if (틀린.length) {
      경고.push(['원본 합계 칸', '원본에서 «합계 금액» 이 노무비 + 재료비 + 경비 금액과 다른 줄이 ' + 틀린.length + '줄 있습니다 (' +
        틀린.slice(0, 3).map((x) => 원줄번(x) + '행 ' + String(x.이름).trim().slice(0, 14) + ' 합계 ' + 원(x.원.합계.금액) + ' ↔ 갈래 합 ' + 원(갈합(x))).join(' · ') +
        ') — 원도급 합계는 원본 그대로 두고, 하도급은 갈래(노무 · 재료 · 경비)마다 셈합니다. 원본을 한 번 보십시오'])
    }
    const 합만 = 품들.filter((x) => x.합계만)
    if (합만.length) 경고.push(['합계만 있는 줄', '노무 · 재료 · 경비 칸 없이 «합계» 만 있는 줄 ' + 합만.length + '줄 (' + 합만.slice(0, 3).map((x) => 원줄번(x) + '행 ' + String(x.이름).trim().slice(0, 14)).join(' · ') + ') 은 합계 단가에 율을 곱했습니다'])
    const 금만 = 품들.filter((x) => !x.합계만 && !갈있(x) && !x.뺌 && (x.원.합계 && x.원.합계.금액))
    if (금만.length) 경고.push(['금액만 있는 줄', '단가 · 갈래 없이 금액만 있는 줄 ' + 금만.length + '줄 (' + 금만.slice(0, 3).map((x) => 원줄번(x) + '행 ' + String(x.이름).trim().slice(0, 14) + ' ' + 원(x.원.합계.금액)).join(' · ') + ') 은 하도급 0(원도급 몫)으로 두었습니다 — 원가 · 머리 줄이 품목으로 읽힌 것인지 보십시오'])
  }
  if (!셋) 경고.push(['재료비 · 노무비 · 경비', '올리신 내역서에 갈래(재료비 · 노무비 · 경비)가 없어 «합계» 칸으로만 셈했습니다 — 갈래 칸은 비어 있습니다'])

  /* 원본의 낙찰율 · 비고 칸(있으면 그대로 옮김) */
  const 덧칸 = new Map()
  for (const s of 읽은.시트들) {
    const g = 책 && 책[s.시트]
    if (!g) continue
    const hi = (s.머리줄 || 1) - 1
    let 율j = -1, 비j = -1
    for (const rr of [hi, hi + 1, hi - 1]) {
      (g[rr] || []).forEach((t, j) => {
        const m = 맨(t)
        if (율j < 0 && /^(낙찰|협의|적용|사정|투찰)(율|률)(\(%\)|%)?$/.test(m)) 율j = j
        if (비j < 0 && /^비고$/.test(m)) 비j = j
      })
    }
    덧칸.set(s.시트, { g, 율j, 비j })
  }
  const 덧 = (x) => {
    const d = 덧칸.get(x.시트)
    if (!d || x.꼴 !== '품') return { 율: '', 비고: '' }
    const row = d.g[x.줄 - 1] || []
    let 율v = d.율j >= 0 ? row[d.율j] : ''
    if (typeof 율v === 'string' && /^-?[\d,.]+$/.test(율v.trim())) 율v = Number(율v.replace(/,/g, ''))
    const 비 = d.비j >= 0 && row[d.비j] !== null && row[d.비j] !== undefined ? String(row[d.비j]).trim() : ''
    return { 율: 율v === null || 율v === undefined ? '' : 율v, 비고: 비 }
  }
  const 행 = (x) => 5 + x.i            /* ③ ④ ⑤ 자료 줄(5행부터) */
  const 행6 = (x) => 6 + x.i           /* ⑥ 은 머리가 한 줄 더 */

  /* ════════════ ⑤ 내역서 — 원도급 값(바탕) · 하도급 칸은 ③ 을 받아 보임 ════════════ */
  const 내 = 새시트(이름.내역)
  /* B 공종 C 품명 D 규격 E 구분 F 수량 G 단위 | H,I 합계(원) J,K 합계(하) | L,M 노무(원) N,O 노무(하) | P,Q 재료(원) R,S 재료(하) | T,U 경비(원) V,W 경비(하) | X 낙찰율 Y 비고 | Z 품 · AA 관급(숨김) */
  내.widths = [3, 7, 24, 18, 8, 9, 6, 12, 14, 12, 14, 12, 14, 12, 14, 12, 14, 12, 14, 12, 14, 12, 14, 8, 14, 3, 3]
  내.hide = [26, 27]
  const 내꼴 = { 머리: 꼴({ h: 'center', wrap: true }), 글: 꼴({ h: 'left' }), 가: 꼴({ h: 'center' }), 돈: 꼴({ n: '#,##0', h: 'right' }), 수: 꼴({ n: '#,##0.###', h: 'right' }), 율: 꼴({ h: 'right' }), 숨: 꼴({ 선: false }), 제목: 꼴({ h: 'center', 선: false }) }
  칸(내, 1, 2, '내역서', 내꼴.제목)
  const 내머리 = [['B', '공종'], ['C', '품    명'], ['D', '규   격'], ['E', '구분'], ['F', '수 량'], ['G', '단위'], ['H', '합계(원도급)'], ['J', '합계(하도급)'], ['L', '노무비(원도급)'], ['N', '노무비(하도급)'], ['P', '재료비(원도급)'], ['R', '재료비(하도급)'], ['T', '경    비(원도급)'], ['V', '경    비(하도급)'], ['X', '낙찰율(%)'], ['Y', '비    고']]
  for (let c = 2; c <= 25; c++) { 칸(내, 3, c, '', 내꼴.머리); 칸(내, 4, c, '', 내꼴.머리) }
  for (const [c, t] of 내머리) 칸(내, 3, colN(c), t, 내꼴.머리)
  for (const c of 'HJLNPRTV') { 칸(내, 4, colN(c), '단  가', 내꼴.머리); 칸(내, 4, colN(c) + 1, '금   액', 내꼴.머리) }
  내.freeze = { r: 5, c: 8 }; 내.제목줄 = [3, 4]
  const 원칸 = { 합계: ['H', 'I'], 노무비: ['L', 'M'], 재료비: ['P', 'Q'], 경비: ['T', 'U'] }
  const 하칸 = { 합계: ['J', 'K'], 노무비: ['N', 'O'], 재료비: ['R', 'S'], 경비: ['V', 'W'] }
  const 하내칸 = { 합계: ['L', 'M'], 노무비: ['F', 'G'], 재료비: ['H', 'I'], 경비: ['J', 'K'] }    /* ③ 의 칸 */
  const 내참 = (col, r) => 따(이름.내역) + col + r
  const 하참 = (col, r) => 따(이름.하내) + col + r
  const 대참 = (col, r) => 따(이름.대상) + col + r
  for (const x of L) {
    const r = 행(x)
    if (x.꼴 === '품') {
      const d = 덧(x)
      칸(내, r, 2, '', 내꼴.가); 칸(내, r, 3, x.이름, 내꼴.글); 칸(내, r, 4, x.규격, 내꼴.글); 칸(내, r, 5, '', 내꼴.가)
      칸(내, r, 6, x.수량 === null ? '' : x.수량, 내꼴.수); 칸(내, r, 7, x.단위, 내꼴.가)
      for (const g of [...갈, '합계']) {
        const o = x.원[g] || {}, h = x.하[g] || {}
        const [a, b] = 원칸[g], [c, e] = 하칸[g], [hc, he] = 하내칸[g]
        칸(내, r, colN(a), o.단가 ?? '', 내꼴.돈); 칸(내, r, colN(b), o.금액 ?? '', 내꼴.돈)
        칸(내, r, colN(c), o.단가 === null || o.단가 === undefined ? '' : { f: 하참(hc, r), v: h.단가 }, 내꼴.돈)
        칸(내, r, colN(e), o.금액 === null || o.금액 === undefined ? '' : { f: 하참(he, r), v: h.금액 }, 내꼴.돈)
      }
      if (!셋) for (const g of ['노무비', '재료비', '경비']) for (const col of [...원칸[g], ...하칸[g]]) 칸(내, r, colN(col), '', 내꼴.돈)
      칸(내, r, 24, d.율, 내꼴.율); 칸(내, r, 25, d.비고, 내꼴.가)
      칸(내, r, 26, '품', 내꼴.숨); 칸(내, r, 27, x.뺌 === '관급' ? '관급' : '', 내꼴.숨)
      continue
    }
    const [a, b] = 범(x), ra = 5 + a, rb = 5 + b
    칸(내, r, 2, x.표시 || '', 내꼴.가); 칸(내, r, 3, x.이름, 내꼴.글); 칸(내, r, 4, x.규격 || '', 내꼴.글); 칸(내, r, 5, '원도급', 내꼴.가)
    for (const c of [6, 7]) 칸(내, r, c, '', 내꼴.가)
    for (const g of ['합계', '노무비', '재료비', '경비']) {
      const [aa, bb] = 원칸[g], [cc, ee] = 하칸[g], [, he] = 하내칸[g]
      칸(내, r, colN(aa), '', 내꼴.돈); 칸(내, r, colN(cc), '', 내꼴.돈)
      if (g !== '합계' && !셋) { 칸(내, r, colN(bb), '', 내꼴.돈); 칸(내, r, colN(ee), '', 내꼴.돈); continue }
      const 식 = x.꼴 === '순'
        ? 순식('원', bb, 행, 'Z', 'AA', 'SUMIFS(' + bb + '$' + ra + ':' + bb + '$' + rb + ',$Z$' + ra + ':$Z$' + rb + ',"품",$AA$' + ra + ':$AA$' + rb + ',"<>관급")')
        : 'SUMIF($Z$' + ra + ':$Z$' + rb + ',"품",' + bb + '$' + ra + ':' + bb + '$' + rb + ')'
      칸(내, r, colN(bb), { f: 식, v: x.합.원[g] }, 내꼴.돈)
      칸(내, r, colN(ee), { f: 하참(he, r), v: x.합.하[g] }, 내꼴.돈)
    }
    칸(내, r, 24, '', 내꼴.율); 칸(내, r, 25, '', 내꼴.가)
  }

  /* ════════════ ④ 하도급 대상내역서 — ⑤ 를 받아: 뺄 줄(비고) → 대상 → 하도급 ════════════ */
  const 대 = 새시트(이름.대상)
  /* A 공종 B 품명 C 규격 D 수량 E 단위 | F,G 도급 | H,I 대상(100%) | J,K 하도급 | L 비고 | M 품 · N 뺌(숨김) */
  대.widths = [7, 20, 18, 9, 6, 11, 15, 11, 15, 11, 15, 14, 3, 4]
  대.hide = [13, 14]
  const 대꼴 = {
    제목: 꼴({ b: true, sz: 15, c: 'FFFFFF', bg: '003366', h: 'center' }), 율말: 꼴({ b: true, bg: 'F2F2F2', h: 'left' }), 율칸: 꼴({ b: true, sz: 10, c: 'C00000', bg: 'FFF2CC', n: '0.00%', h: 'center' }),
    쪽지: 꼴({ sz: 8, c: '595959', bg: 'FFF2CC', h: 'left', 선: false }), 머리: 꼴({ b: true, c: 'FFFFFF', bg: '003366', h: 'center', wrap: true }),
    묶글: 꼴({ b: true, bg: 'C7E2F7', h: 'left' }), 묶번: 꼴({ b: true, bg: 'C7E2F7', h: 'center' }), 묶돈: 꼴({ b: true, bg: 'C7E2F7', n: '#,##0', h: 'right' }),
    글: 꼴({ sz: 8, h: 'left' }), 가: 꼴({ sz: 8, h: 'center' }), 수: 꼴({ sz: 8, n: '#,##0.###', h: 'right' }), 돈: 꼴({ sz: 8, n: '#,##0', h: 'right' }),
    대돈: 꼴({ sz: 8, c: 'CC0000', bg: 'FFF9F0', n: '#,##0', h: 'right' }), 하돈: 꼴({ sz: 8, c: '2D9654', bg: 'E1F5EE', n: '#,##0', h: 'right' }),
    합글: 꼴({ b: true, sz: 11, c: 'FFFFFF', bg: '003366', h: 'center' }), 합돈: 꼴({ b: true, sz: 11, c: 'FFFFFF', bg: '003366', n: '#,##0', h: 'right' }), 숨: 꼴({ 선: false }),
  }
  칸(대, 1, 1, '하도급 대상내역서 (원도급 기준)', 대꼴.제목); 대.merges.push('A1:L1'); 대.ht.set(1, 27.75)
  칸(대, 2, 1, '하도급율:', 대꼴.율말); 칸(대, 2, 2, { f: 첫율, v: 율 }, 대꼴.율칸)
  칸(대, 2, 3, '← 첫 장(' + 이름.대비 + ') C2 셀만 수정하면 전체 자동계산 (0.80=80%)' + 꼬리(' | '), 대꼴.쪽지); 대.merges.push('C2:L2'); 대.ht.set(2, 21.75)
  for (let c = 1; c <= 12; c++) { 칸(대, 3, c, '', 대꼴.머리); 칸(대, 4, c, '', 대꼴.머리) }
  for (const [c, t] of [['A', '공종'], ['B', '품    명'], ['C', '규   격'], ['D', '수 량'], ['E', '단위'], ['F', '도  급  금  액'], ['H', '하도급 대상금액 (100%)'], ['J', 율글('하도급 금액 (', ')', '$B$2')], ['L', '비  고']]) 칸(대, 3, colN(c), t, 대꼴.머리)
  for (const c of 'ABCDEL') 대.merges.push(c + '3:' + c + '4')
  for (const c of 'FHJ') { 대.merges.push(c + '3:' + numToCol(colN(c) + 1) + '3'); 칸(대, 4, colN(c), '단  가', 대꼴.머리); 칸(대, 4, colN(c) + 1, '금   액', 대꼴.머리) }
  대.ht.set(3, 37.5); 대.ht.set(4, 21.75); 대.freeze = { r: 5, c: 1 }; 대.제목줄 = [3, 4]
  const 뺌식 = (r) => '$N' + r + '="뺌"'
  const 하단식 = (g, r) => 끊(내참(원칸[g][0], r) + '*$B$2')
  for (const x of L) {
    const r = 행(x)
    if (x.꼴 === '품') {
      const o = x.원.합계 || {}, h = x.하.합계 || {}
      칸(대, r, 1, '', 대꼴.가); 칸(대, r, 2, x.이름, 대꼴.글); 칸(대, r, 3, x.규격, 대꼴.글)
      칸(대, r, 4, x.수량 === null ? '' : { f: 내참('F', r), v: x.수량 }, 대꼴.수); 칸(대, r, 5, x.단위, 대꼴.가)
      칸(대, r, 6, o.단가 === null || o.단가 === undefined ? '' : { f: 내참('H', r), v: o.단가 }, 대꼴.돈)
      칸(대, r, 7, o.금액 === null || o.금액 === undefined ? '' : { f: 내참('I', r), v: o.금액 }, 대꼴.돈)
      칸(대, r, 8, o.단가 === null || o.단가 === undefined ? '' : { f: 'IF(' + 뺌식(r) + ',0,F' + r + ')', v: x.뺌 ? 0 : o.단가 }, 대꼴.대돈)
      칸(대, r, 9, o.금액 === null || o.금액 === undefined ? '' : { f: 'IF(' + 뺌식(r) + ',0,G' + r + ')', v: x.뺌 ? 0 : o.금액 }, 대꼴.대돈)
      /* 하도급 단가 · 금액 — 갈래마다 단가 × 율(단수) → 수량 × 단가 (③ 과 같은 셈) */
      let J = '', K = ''
      if (셋 && !x.합계만) {
        const 단 = 갈.filter((g) => x.원[g] && x.원[g].단가 !== null && x.원[g].단가 !== undefined).map((g) => 하단식(g, r))
        const 금 = 갈.filter((g) => x.원[g] && x.원[g].금액 !== null && x.원[g].금액 !== undefined).map((g) => (x.원[g].곱셈 ? 끊('D' + r + '*' + 하단식(g, r)) : 끊(내참(원칸[g][1], r) + '*$B$2')))
        if (단.length) J = { f: 'IF(' + 뺌식(r) + ',0,' + 단.join('+') + ')', v: h.단가 }
        if (금.length) K = { f: 'IF(' + 뺌식(r) + ',0,' + 금.join('+') + ')', v: h.금액 }
      } else {
        if (o.단가 !== null && o.단가 !== undefined) J = { f: 'IF(' + 뺌식(r) + ',0,' + 하단식('합계', r) + ')', v: h.단가 }
        if (o.금액 !== null && o.금액 !== undefined) K = { f: 'IF(' + 뺌식(r) + ',0,' + (o.곱셈 ? 끊('D' + r + '*J' + r) : 끊(내참('I', r) + '*$B$2')) + ')', v: h.금액 }
      }
      칸(대, r, 10, J, 대꼴.하돈); 칸(대, r, 11, K, 대꼴.하돈)
      칸(대, r, 12, x.뺌 === '직접' ? '원도급 직접시공' : x.뺌 === '관급' ? '관급 지급분' : '', 대꼴.가)
      칸(대, r, 13, '품', 대꼴.숨)
      칸(대, r, 14, { f: 'IF(OR(ISNUMBER(SEARCH("직접",L' + r + ')),ISNUMBER(SEARCH("관급",L' + r + '))),"뺌","")', v: x.뺌 ? '뺌' : '' }, 대꼴.숨)
      continue
    }
    const [a, b] = 범(x), ra = 5 + a, rb = 5 + b
    const 합식 = (col) => 'SUMIF($M$' + ra + ':$M$' + rb + ',"품",' + col + '$' + ra + ':' + col + '$' + rb + ')'
    칸(대, r, 1, x.표시 || '', 대꼴.묶번); 칸(대, r, 2, x.이름, 대꼴.묶글); for (const c of [3, 4, 5]) 칸(대, r, c, '', 대꼴.묶글); 대.merges.push('B' + r + ':E' + r)
    for (const c of [6, 8, 10]) 칸(대, r, c, '', 대꼴.묶돈)
    칸(대, r, 7, x.꼴 === '순' ? { f: 내참('I', r), v: x.합.원.합계 } : { f: 합식('G'), v: x.합.원.합계 }, 대꼴.묶돈)
    칸(대, r, 9, { f: x.꼴 === '순' ? 순식('하', 'I', 행, '', '', 합식('I')) : 합식('I'), v: x.합.대상 }, 대꼴.묶돈); 칸(대, r, 11, { f: x.꼴 === '순' ? 순식('하', 'K', 행, '', '', 합식('K')) : 합식('K'), v: x.합.하.합계 }, 대꼴.묶돈)
    칸(대, r, 12, '', 대꼴.묶글)
  }
  const 대합 = 5 + n
  칸(대, 대합, 1, '합          계', 대꼴.합글); for (const c of [2, 3, 4, 5, 6, 8, 10, 12]) 칸(대, 대합, c, '', 대꼴.합글); 대.merges.push('A' + 대합 + ':E' + 대합)
  for (const [c, col, v] of [[7, 'G', 전.원.합계], [9, 'I', 전.대상], [11, 'K', 전.하.합계]]) 칸(대, 대합, c, { f: 'SUMIF($M$5:$M$' + (대합 - 1) + ',"품",' + col + '$5:' + col + '$' + (대합 - 1) + ')', v }, 대꼴.합돈)

  /* ════════════ ③ 하도급내역서(율) — ④ 를 받아: 대상 줄의 갈래 단가 × 율 ════════════ */
  const 하 = 새시트(이름.하내)
  /* A 공종 B 품명 C 규격 D 수량 E 단위 | F,G 노무 | H,I 재료 | J,K 경비 | L,M 합계 | N 낙찰율 | O 품(숨김) */
  하.widths = [7, 24, 18, 8, 6, 11, 13, 11, 13, 10, 12, 11, 13, 8, 3]
  하.hide = [15]
  const 하꼴 = {
    제목: 꼴({ b: true, sz: 12, c: 'FFFFFF', bg: '1F4E79', h: 'center', 선: false }), 율말: 꼴({ b: true, bg: 'F2F2F2', h: 'left' }), 율칸: 꼴({ b: true, sz: 10, c: 'C00000', bg: 'FFF2CC', n: '0.00%', h: 'center' }),
    쪽지: 꼴({ sz: 8, c: '595959', bg: 'FFF2CC', h: 'left', 선: false }), 머리: 꼴({ b: true, c: 'FFFFFF', bg: '2E75B6', h: 'center', wrap: true }), 머리2: 꼴({ b: true, sz: 8, c: 'FFFFFF', bg: '2E75B6', h: 'center' }),
    묶글: 꼴({ b: true, bg: 'BDD7EE', h: 'left' }), 묶번: 꼴({ b: true, bg: 'BDD7EE', h: 'center' }), 묶돈: 꼴({ b: true, bg: 'E2EFDA', n: '#,##0', h: 'right' }),
    글: 꼴({ h: 'left' }), 가: 꼴({ h: 'center' }), 수: 꼴({ n: '#,##0.###', h: 'right' }), 돈: 꼴({ bg: 'E2EFDA', n: '#,##0', h: 'right' }), 합칸: 꼴({ bg: 'D6E4F0', n: '#,##0', h: 'right' }), 율: 꼴({ h: 'right' }),
    합글: 꼴({ b: true, sz: 11, c: 'FFFFFF', bg: '1F4E79', h: 'center' }), 합돈: 꼴({ b: true, sz: 11, c: 'FFFFFF', bg: '1F4E79', n: '#,##0', h: 'right' }), 숨: 꼴({ 선: false }),
  }
  칸(하, 1, 1, 율글('하도급내역서 (하도급율 ', ' — 노무비·재료비·경비 포함)', '$B$2'), 하꼴.제목); 하.merges.push('A1:N1'); 하.ht.set(1, 25.5)
  칸(하, 2, 1, '하도급율:', 하꼴.율말); 칸(하, 2, 2, { f: 첫율, v: 율 }, 하꼴.율칸)
  칸(하, 2, 3, '← 첫 장(' + 이름.대비 + ') C2 셀 수정 → 전체 자동계산' + 꼬리('  |  '), 하꼴.쪽지); 하.merges.push('C2:N2'); 하.ht.set(2, 19.5)
  for (let c = 1; c <= 14; c++) { 칸(하, 3, c, '', 하꼴.머리); 칸(하, 4, c, '', 하꼴.머리2) }
  for (const [c, t] of [['A', '공종'], ['B', '품    명'], ['C', '규   격'], ['D', '수 량'], ['E', '단위'], ['F', 율글('노  무  비 (하도급 ', ')', '$B$2')], ['H', 율글('재  료  비 (하도급 ', ')', '$B$2')], ['J', 율글('경    비 (하도급 ', ')', '$B$2')], ['L', 율글('합  계 (하도급 ', ')', '$B$2')], ['N', '낙찰율(%)']]) 칸(하, 3, colN(c), t, c === 'N' ? 하꼴.머리2 : 하꼴.머리)
  for (const c of 'ABCDEN') 하.merges.push(c + '3:' + c + '4')
  for (const c of 'FHJL') { 하.merges.push(c + '3:' + numToCol(colN(c) + 1) + '3'); 칸(하, 4, colN(c), '단  가', 하꼴.머리2); 칸(하, 4, colN(c) + 1, '금   액', 하꼴.머리2) }
  하.ht.set(3, 31.5); 하.ht.set(4, 16.5); 하.freeze = { r: 5, c: 1 }; 하.제목줄 = [3, 4]
  const 대뺌 = (r) => 대참('$N', r) + '="뺌"'
  for (const x of L) {
    const r = 행(x)
    if (x.꼴 === '품') {
      const d = 덧(x)
      칸(하, r, 1, '', 하꼴.가); 칸(하, r, 2, x.이름, 하꼴.글); 칸(하, r, 3, x.규격, 하꼴.글)
      칸(하, r, 4, x.수량 === null ? '' : { f: 대참('D', r), v: x.수량 }, 하꼴.수); 칸(하, r, 5, x.단위, 하꼴.가)
      if (셋 && !x.합계만) {
        for (const [g, cu, ca] of [['노무비', 6, 7], ['재료비', 8, 9], ['경비', 10, 11]]) {
          const o = x.원[g] || {}, h = x.하[g] || {}
          칸(하, r, cu, o.단가 === null || o.단가 === undefined ? '' : { f: 'IF(' + 대뺌(r) + ',0,' + 하단식(g, r) + ')', v: h.단가 }, 하꼴.돈)
          칸(하, r, ca, o.금액 === null || o.금액 === undefined ? '' : { f: 'IF(' + 대뺌(r) + ',0,' + (o.곱셈 ? 끊('D' + r + '*' + numToCol(cu) + r) : 끊(내참(원칸[g][1], r) + '*$B$2')) + ')', v: h.금액 }, 하꼴.돈)
        }
        칸(하, r, 12, { f: 'N(F' + r + ')+N(H' + r + ')+N(J' + r + ')', v: (x.하.합계 || {}).단가 ?? 0 }, 하꼴.합칸)
        칸(하, r, 13, { f: 'N(G' + r + ')+N(I' + r + ')+N(K' + r + ')', v: (x.하.합계 || {}).금액 ?? 0 }, 하꼴.합칸)
      } else {
        for (const c of [6, 7, 8, 9, 10, 11]) 칸(하, r, c, '', 하꼴.돈)
        const o = x.원.합계 || {}, h = x.하.합계 || {}
        칸(하, r, 12, o.단가 === null || o.단가 === undefined ? '' : { f: 'IF(' + 대뺌(r) + ',0,' + 하단식('합계', r) + ')', v: h.단가 }, 하꼴.합칸)
        칸(하, r, 13, o.금액 === null || o.금액 === undefined ? '' : { f: 'IF(' + 대뺌(r) + ',0,' + (o.곱셈 ? 끊('D' + r + '*L' + r) : 끊(내참('I', r) + '*$B$2')) + ')', v: h.금액 }, 하꼴.합칸)
      }
      칸(하, r, 14, d.율 === '' ? '' : { f: 내참('X', r), v: d.율 }, 하꼴.율)
      칸(하, r, 15, '품', 하꼴.숨)
      continue
    }
    const [a, b] = 범(x), ra = 5 + a, rb = 5 + b
    const 합식 = (col) => 'SUMIF($O$' + ra + ':$O$' + rb + ',"품",' + col + '$' + ra + ':' + col + '$' + rb + ')'
    칸(하, r, 1, x.표시 || '', 하꼴.묶번); 칸(하, r, 2, x.이름, 하꼴.묶글); 칸(하, r, 3, '', 하꼴.묶글); 칸(하, r, 4, '', 하꼴.묶글); 하.merges.push('B' + r + ':D' + r)
    칸(하, r, 5, '', 하꼴.묶글)
    for (const [g, cu, ca] of [['노무비', 6, 7], ['재료비', 8, 9], ['경비', 10, 11], ['합계', 12, 13]]) {
      칸(하, r, cu, '', 하꼴.묶돈)
      칸(하, r, ca, g !== '합계' && !셋 ? '' : { f: x.꼴 === '순' ? 순식('하', numToCol(ca), 행, '', '', 합식(numToCol(ca))) : 합식(numToCol(ca)), v: x.합.하[g] }, 하꼴.묶돈)
    }
    칸(하, r, 14, '', 하꼴.묶글)
  }
  const 하합 = 5 + n
  칸(하, 하합, 1, '합          계', 하꼴.합글); for (const c of [2, 3, 4, 5, 6, 8, 10, 12, 14]) 칸(하, 하합, c, '', 하꼴.합글); 하.merges.push('A' + 하합 + ':E' + 하합)
  for (const [g, c] of [['노무비', 7], ['재료비', 9], ['경비', 11], ['합계', 13]]) 칸(하, 하합, c, g !== '합계' && !셋 ? '' : { f: 'SUMIF($O$5:$O$' + (하합 - 1) + ',"품",' + numToCol(c) + '$5:' + numToCol(c) + '$' + (하합 - 1) + ')', v: 전.하[g] }, 하꼴.합돈)

  /* ════════════ ⑥ 직접시공내역서 — ④ · ③ 을 받아: 직접 = 도급 − 하도급 ════════════ */
  const 직 = 새시트(이름.직내)
  /* A 공종 B 품명 C 규격 D 수량 E 단위 | F,G 도급 | H,I 직접시공 | J,K 하도급 | L,M 노무 직접/하도급 | N,O 재료 | P,Q 경비 | R 낙찰율 | S 품(숨김) */
  직.widths = [7, 22, 15, 9, 5, 11, 13.5, 11, 13.5, 11, 13.5, 12.2, 13.5, 12.2, 13.5, 12.2, 13.5, 7, 3]   /* 수량 칸 9(본보기 7 은 소수 수량이 ### 로 보임) */
  직.hide = [19]
  const 직꼴 = {
    제목: 꼴({ b: true, sz: 11, c: 'FFFFFF', bg: '1F4E79', h: 'center', 선: false }), 율말: 꼴({ b: true, bg: 'F2F2F2', h: 'left' }), 율칸: 꼴({ b: true, sz: 10, c: 'C00000', bg: 'FFF2CC', n: '0.00%', h: 'center' }),
    쪽지: 꼴({ sz: 8, c: '595959', bg: 'FFF2CC', h: 'left', 선: false }),
    머리: 꼴({ b: true, c: 'FFFFFF', bg: '2E75B6', h: 'center', wrap: true }), 머리합: 꼴({ b: true, sz: 10, c: 'FFFFFF', bg: '1F4E79', h: 'center' }), 머리도: 꼴({ b: true, c: 'FFFFFF', bg: '2C5F8A', h: 'center' }), 머리도2: 꼴({ b: true, sz: 8, c: 'FFFFFF', bg: '2C5F8A', h: 'center' }),
    머리직: 꼴({ b: true, c: 'FFFFFF', bg: '2D9654', h: 'center' }), 머리직2: 꼴({ b: true, sz: 8, c: 'FFFFFF', bg: '2D9654', h: 'center' }), 머리하: 꼴({ b: true, c: 'FFFFFF', bg: 'C00000', h: 'center' }), 머리하2: 꼴({ b: true, sz: 8, c: 'FFFFFF', bg: 'C00000', h: 'center' }), 머리갈: 꼴({ b: true, sz: 8, c: 'FFFFFF', bg: '2E75B6', h: 'center' }),
    묶글: 꼴({ b: true, bg: 'BDD7EE', h: 'left' }), 묶번: 꼴({ b: true, bg: 'BDD7EE', h: 'center' }), 묶도: 꼴({ b: true, bg: 'DEEAF1', n: '#,##0', h: 'right' }), 묶직: 꼴({ b: true, c: '2D9654', bg: 'E2EFDA', n: '#,##0', h: 'right' }), 묶하: 꼴({ b: true, c: 'C00000', bg: 'FCE4D6', n: '#,##0', h: 'right' }),
    글: 꼴({ h: 'left' }), 가: 꼴({ h: 'center' }), 수: 꼴({ n: '#,##0.###', h: 'right' }), 도: 꼴({ bg: 'DEEAF1', n: '#,##0', h: 'right' }), 직: 꼴({ c: '2D9654', bg: 'E2EFDA', n: '#,##0', h: 'right' }), 하: 꼴({ c: 'C00000', bg: 'FCE4D6', n: '#,##0', h: 'right' }), 율: 꼴({ h: 'right' }),
    합글: 꼴({ b: true, sz: 11, c: 'FFFFFF', bg: '1F4E79', h: 'center' }), 합돈: 꼴({ b: true, sz: 11, c: 'FFFFFF', bg: '1F4E79', n: '#,##0', h: 'right' }), 숨: 꼴({ 선: false }),
  }
  칸(직, 1, 1, '직접시공내역서 (노무비·재료비·경비 포함 — 도급/직접시공/하도급 구분)', 직꼴.제목); 직.merges.push('A1:R1'); 직.ht.set(1, 25.5)
  칸(직, 2, 1, '하도급율:', 직꼴.율말); 칸(직, 2, 2, { f: 첫율, v: 율 }, 직꼴.율칸)
  칸(직, 2, 3, '← 첫 장 C2 셀 수정 → 자동계산  |  직접시공율=1-하도급율  |  건설산업기본법 제28조의2(직접시공)' + 꼬리('  |  '), 직꼴.쪽지); 직.merges.push('C2:R2'); 직.ht.set(2, 19.5)
  for (let c = 1; c <= 18; c++) for (const rr of [3, 4, 5]) 칸(직, rr, c, '', 직꼴.머리)
  for (const [c, t] of [['A', '공종'], ['B', '품    명'], ['C', '규   격'], ['D', '수 량'], ['E', '단위'], ['R', '낙찰율(%)']]) { 칸(직, 3, colN(c), t, 직꼴.머리); 직.merges.push(c + '3:' + c + '5') }
  칸(직, 3, 6, '합  계  금  액', 직꼴.머리합); for (let c = 7; c <= 11; c++) 칸(직, 3, c, '', 직꼴.머리합); 직.merges.push('F3:K3')
  for (const [c, t] of [['L', '노  무  비'], ['N', '재  료  비'], ['P', '경    비']]) {
    칸(직, 3, colN(c), t, 직꼴.머리); 직.merges.push(c + '3:' + numToCol(colN(c) + 1) + '3')
    칸(직, 4, colN(c), '직접 / 하도급', 직꼴.머리갈); 칸(직, 4, colN(c) + 1, '', 직꼴.머리갈); 직.merges.push(c + '4:' + numToCol(colN(c) + 1) + '4')
    칸(직, 5, colN(c), '직  접', 직꼴.머리직2); 칸(직, 5, colN(c) + 1, '하도급', 직꼴.머리하2)
  }
  for (const [c, t, s4, s5] of [['F', '도  급', 직꼴.머리도, 직꼴.머리도2], ['H', 직율글('직접시공 (', ')', '$B$2'), 직꼴.머리직, 직꼴.머리직2], ['J', 율글('하도급 (', ')', '$B$2'), 직꼴.머리하, 직꼴.머리하2]]) {
    칸(직, 4, colN(c), t, s4); 칸(직, 4, colN(c) + 1, '', s4); 직.merges.push(c + '4:' + numToCol(colN(c) + 1) + '4')
    칸(직, 5, colN(c), '단  가', s5); 칸(직, 5, colN(c) + 1, '금   액', s5)
  }
  직.ht.set(3, 25.5); 직.ht.set(4, 19.5); 직.ht.set(5, 16.5); 직.freeze = { r: 6, c: 1 }; 직.제목줄 = [3, 5]
  const 관급식 = (r) => 'ISNUMBER(SEARCH("관급",' + 대참('$L', r) + '))'
  for (const x of L) {
    const r = 행(x), R = 행6(x)
    if (x.꼴 === '품') {
      const d = 덧(x)
      const o = x.원.합계 || {}, h = x.하.합계 || {}
      const 관 = x.뺌 === '관급'
      칸(직, R, 1, '', 직꼴.가); 칸(직, R, 2, x.이름, 직꼴.글); 칸(직, R, 3, x.규격, 직꼴.글)
      칸(직, R, 4, x.수량 === null ? '' : { f: 대참('D', r), v: x.수량 }, 직꼴.수); 칸(직, R, 5, x.단위, 직꼴.가)
      const 있 = (v) => v !== null && v !== undefined
      칸(직, R, 6, 있(o.단가) ? { f: 대참('F', r), v: o.단가 } : '', 직꼴.도); 칸(직, R, 7, 있(o.금액) ? { f: 대참('G', r), v: o.금액 } : '', 직꼴.도)
      칸(직, R, 10, 있(o.단가) ? { f: 하참('L', r), v: h.단가 ?? 0 } : '', 직꼴.하); 칸(직, R, 11, 있(o.금액) ? { f: 하참('M', r), v: h.금액 ?? 0 } : '', 직꼴.하)
      칸(직, R, 8, 있(o.단가) ? { f: 'IF(' + 관급식(r) + ',0,N(F' + R + ')-N(J' + R + '))', v: 관 ? 0 : (o.단가 || 0) - (h.단가 || 0) } : '', 직꼴.직)
      칸(직, R, 9, 있(o.금액) ? { f: 'IF(' + 관급식(r) + ',0,N(G' + R + ')-N(K' + R + '))', v: x.직접.합계 } : '', 직꼴.직)
      for (const [g, c, hc] of [['노무비', 12, 'G'], ['재료비', 14, 'I'], ['경비', 16, 'K']]) {
        const ov = 셋 ? x.원[g] || {} : {}
        if (!셋 || !있(ov.금액)) { 칸(직, R, c, '', 직꼴.직); 칸(직, R, c + 1, '', 직꼴.하); continue }
        칸(직, R, c, { f: 'IF(' + 관급식(r) + ',0,N(' + 내참(원칸[g][1], r) + ')-N(' + 하참(hc, r) + '))', v: x.직접[g] }, 직꼴.직)
        칸(직, R, c + 1, { f: 하참(hc, r), v: (x.하[g] || {}).금액 ?? 0 }, 직꼴.하)
      }
      칸(직, R, 18, d.율 === '' ? '' : { f: 내참('X', r), v: d.율 }, 직꼴.율)
      칸(직, R, 19, '품', 직꼴.숨)
      continue
    }
    const [a, b] = 범(x), ra = 6 + a, rb = 6 + b
    const 합식 = (col) => 'SUMIF($S$' + ra + ':$S$' + rb + ',"품",' + col + '$' + ra + ':' + col + '$' + rb + ')'
    칸(직, R, 1, x.표시 || '', 직꼴.묶번); 칸(직, R, 2, x.이름, 직꼴.묶글); for (const c of [3, 4, 5]) 칸(직, R, c, '', 직꼴.묶글); 직.merges.push('B' + R + ':E' + R)
    for (const c of [6, 8, 10]) 칸(직, R, c, '', 직꼴.묶도)
    칸(직, R, 7, x.꼴 === '순' ? { f: 대참('G', r), v: x.합.원.합계 } : { f: 합식('G'), v: x.합.원.합계 }, 직꼴.묶도)
    const 직식 = (col) => (x.꼴 === '순' ? 순식('하', col, 행6, '', '', 합식(col)) : 합식(col))
    칸(직, R, 9, { f: 직식('I'), v: x.합.직접.합계 }, 직꼴.묶직); 칸(직, R, 11, { f: 직식('K'), v: x.합.하.합계 }, 직꼴.묶하)
    for (const [g, c] of [['노무비', 12], ['재료비', 14], ['경비', 16]]) {
      칸(직, R, c, 셋 ? { f: 직식(numToCol(c)), v: x.합.직접[g] } : '', 직꼴.묶직)
      칸(직, R, c + 1, 셋 ? { f: 직식(numToCol(c + 1)), v: x.합.하[g] } : '', 직꼴.묶하)
    }
    칸(직, R, 18, '', 직꼴.묶글)
  }
  const 직합 = 6 + n
  칸(직, 직합, 1, '합          계', 직꼴.합글); for (const c of [2, 3, 4, 5, 6, 8, 10, 18]) 칸(직, 직합, c, '', 직꼴.합글); 직.merges.push('A' + 직합 + ':E' + 직합)
  const 직합식 = (c) => ({ f: 'SUMIF($S$6:$S$' + (직합 - 1) + ',"품",' + numToCol(c) + '$6:' + numToCol(c) + '$' + (직합 - 1) + ')' })
  칸(직, 직합, 7, { ...직합식(7), v: 전.원.합계 }, 직꼴.합돈); 칸(직, 직합, 9, { ...직합식(9), v: 전.직접.합계 }, 직꼴.합돈); 칸(직, 직합, 11, { ...직합식(11), v: 전.하.합계 }, 직꼴.합돈)
  for (const [g, c] of [['노무비', 12], ['재료비', 14], ['경비', 16]]) { 칸(직, 직합, c, 셋 ? { ...직합식(c), v: 전.직접[g] } : '', 직꼴.합돈); 칸(직, 직합, c + 1, 셋 ? { ...직합식(c + 1), v: 전.하[g] } : '', 직꼴.합돈) }

  /* ════════════ ① 원가계산서-원하도급대비표 · ② 직접시공 원가계산서(① 을 받아) ════════════ */
  const 율자 = (글) => (글 || []).map((t) => String(t).trim()).find((t) => /^-?\d+(\.\d+)?\s*%$/.test(t)) || ''
  const 근거자 = (글) => (글 || []).map((t) => String(t).trim()).filter((t) => t && !/^-?\d+(\.\d+)?\s*%$/.test(t)).join(' ')
  let 원줄 = []
  if (원가) {
    for (const x of 원가.rows) {
      if (!x.이름 && !x.구분) continue
      const 역 = x.역 || ''
      if (역 === '총공사비') continue
      let 원이름 = String(x.원이름 || x.이름).trim()
      if (x.구분) 원이름 = 원이름.replace(new RegExp('^\\(?' + x.구분.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[.)．]\\s*'), '')
      원줄.push({ 역, 이름: 원이름 || x.이름, 기호: x.구분 || '', 금액: x.금액 === null ? 0 : x.금액, 요율: 율자(x.글), 근거: 근거자(x.글) })
      if (역 === '도급') break
    }
  } else {
    경고.push(['원가계산서', '올리신 파일에서 원가계산서 시트를 못 찾아 «직접공사비(재료비 · 노무비 · 경비)» 만 넣었습니다 — 간접노무비 · 보험료 · 일반관리비 · 이윤은 원도급 원가계산서에서 옮겨 적으십시오'])
    const 순 = L[0].합
    if (셋) for (const [g, 역, 이] of [['재료비', '직재', '직   접   재   료   비'], ['노무비', '직노', '직   접   노   무   비'], ['경비', '산출경비', '산     출     경    비']]) 원줄.push({ 역, 이름: 이, 기호: '', 금액: 순.원[g] || 0, 요율: '', 근거: '내역서 ' + g + ' 합' })
    원줄.push({ 역: '', 이름: '직  접  공  사  비', 기호: '', 금액: 순.원.합계 || 0, 요율: '', 근거: '내역서 순공사비' })
  }
  /* 원가계산서 직접공사비(재료비 · 직접노무비 · 산출경비) ↔ 내역서 순공사비 — 크게 다르면 알림(다른 차수 · 다른 공종 원가계산서 · 관급이 섞인 것) */
  if (원가) {
    const 내순 = L[0].합.원.합계 || 0
    if (직공 > 0 && Math.abs(직공 - 내순) > Math.max(1000, 직공 * 0.0001)) {
      경고.push(['원가 ↔ 내역', '원가계산서 직접공사비(재료비 + 직접노무비 + 산출경비) ' + 원(직공) + ' ↔ 내역서 «' + String(L[0].이름).trim() + '» ' + 원(내순) + ' — ' + 원(Math.abs(직공 - 내순)) + ' 차이입니다. 원가계산서가 다른 차수 · 공종이거나 내역에 관급 · 순공사비 밖 줄이 섞였는지 보십시오(대비표는 원가계산서 금액 그대로 × 율)'])
    }
  }
  /* 비목 · 분류 글자 — 순공사원가 덩이(재료 · 노무 · 경비)는 세로 글자, 그 뒤는 이름 그대로 */
  const 순자리 = 원줄.findIndex((x) => x.역 === '순공')
  const 덩끝 = 순자리 >= 0 ? 순자리 : -1                 /* 이 자리 앞까지가 순공사원가 덩이 */
  let 무리 = ''
  원줄.forEach((x, i) => {
    x.A = ''; x.B = ''
    if (i < 덩끝) {
      if (i === 0) x.A = '순\n공\n사\n원\n가'
      const 새 = 재역.has(x.역) ? '재' : 노역.has(x.역) ? '노' : 경비역.has(x.역) ? '경' : 무리
      if (새 && 새 !== 무리) x.B = { 재: '재\n료\n비', 노: '노\n무\n비', 경: '경\n비' }[새]
      무리 = 새 || 무리
      x.무리 = 무리
    } else x.A = x.이름                              /* 순공사원가 · 일반관리비 · 이윤 … — 비목 칸(A:B 합침)에 이름 */
    x.하 = x.금액 ? 반올(x.금액 * 율) : 0
  })
  /* 세로 글자 칸은 묶음 줄만큼 합침(한 줄에 갇혀 잘려 보이지 않게) */
  const 무리칸 = []
  for (let i = 0; i < 덩끝; i++) {
    const m = 원줄[i].무리 || ''
    if (m && (!무리칸.length || 무리칸[무리칸.length - 1].m !== m)) 무리칸.push({ m, s: i, e: i })
    else if (m) 무리칸[무리칸.length - 1].e = i
  }
  const 대비 = 새시트(이름.대비); 대비.가로 = false
  대비.widths = [6, 8, 24, 8, 6, 14, 14, 10, 16, 8]
  const 비꼴 = {
    제목: 꼴({ b: true, sz: 15, c: 'FFFFFF', bg: '003366', h: 'center' }), 율말: 꼴({ b: true, sz: 10, c: 'FFFFFF', bg: 'CC0000', h: 'center' }), 율칸: 꼴({ b: true, sz: 13, c: 'CC0000', bg: 'FFFF00', n: '0.00%', h: 'center' }),
    쪽지: 꼴({ c: 'CC0000', bg: 'FFFACD', h: 'left' }), 머리: 꼴({ b: true, c: 'FFFFFF', bg: '003366', h: 'center', wrap: true }),
    세로: 꼴({ sz: 8, bg: 'FFFFFF', h: 'center', wrap: true }), 가: 꼴({ sz: 8, bg: 'FFFFFF', h: 'center' }), 글: 꼴({ sz: 8, bg: 'FFFFFF', h: 'left' }), 순글: 꼴({ sz: 8, bg: 'E8F4FD', h: 'center' }),
    돈: 꼴({ sz: 8, bg: 'FFFFFF', n: '#,##0', h: 'right' }), 하돈: 꼴({ sz: 8, c: 'CC0000', bg: 'FFF9F0', n: '#,##0', h: 'right' }), 율: 꼴({ sz: 8, c: 'CC0000', bg: 'FFFACD', n: '0.00%', h: 'center' }), 율글: 꼴({ sz: 8, c: 'CC0000', bg: 'FFFACD', h: 'center' }),
    도돈: 꼴({ b: true, sz: 8, c: '0C447C', bg: 'FFE6B3', n: '#,##0', h: 'right' }), 도하: 꼴({ b: true, sz: 8, c: 'CC0000', bg: 'FFF9F0', n: '#,##0', h: 'right' }),
  }
  칸(대비, 1, 1, '원가계산서-원하도급대비표', 비꼴.제목); for (let c = 2; c <= 10; c++) 칸(대비, 1, c, '', 비꼴.제목); 대비.merges.push('A1:J1'); 대비.ht.set(1, 25.5)
  칸(대비, 2, 1, '하도급율:', 비꼴.율말); 칸(대비, 2, 2, '', 비꼴.율말); 칸(대비, 2, 3, 율, 비꼴.율칸)
  대비.merges.push('A2:B2')
  칸(대비, 2, 4, '← C2 셀 수정 → 전체 자동계산' + 꼬리('  '), 비꼴.쪽지); for (let c = 5; c <= 10; c++) 칸(대비, 2, c, '', 비꼴.쪽지); 대비.merges.push('D2:J2'); 대비.ht.set(2, 21.75)
  for (const [c, t] of [[1, '비목'], [2, '분류'], [3, '항   목'], [4, '구분'], [5, '기호'], [6, '원도급금액'], [7, 율글('하도급금액(', ')', '$C$2')], [8, '하도급율'], [9, '산출근거'], [10, '비고']]) 칸(대비, 3, c, t, 비꼴.머리)
  대비.ht.set(3, 36); 대비.제목줄 = [3, 3]
  원줄.forEach((x, i) => {
    const r = 4 + i
    x.행1 = r
    const 도 = x.역 === '도급'
    칸(대비, r, 1, x.A, x.A && x.A.includes('\n') ? 비꼴.세로 : 비꼴.가); 칸(대비, r, 2, x.B, x.B && x.B.includes('\n') ? 비꼴.세로 : 비꼴.가)
    칸(대비, r, 3, x.이름, i === 덩끝 ? 비꼴.순글 : 비꼴.글); 칸(대비, r, 4, x.역 === '관급' ? '관급' : '원도급', 비꼴.가); 칸(대비, r, 5, x.기호, 비꼴.가)
    칸(대비, r, 6, x.금액, 도 ? 비꼴.도돈 : 비꼴.돈)
    const 영 = !x.금액 || x.역 === '관급'
    칸(대비, r, 7, 영 ? 0 : { f: 'ROUND(F' + r + '*$C$2,0)', v: x.하 }, 도 ? 비꼴.도하 : 비꼴.하돈)
    칸(대비, r, 8, 영 ? (x.역 === '관급' ? '관급 지급분' : x.요율) : { f: '$C$2', v: 율 }, 영 ? 비꼴.율글 : 비꼴.율)
    칸(대비, r, 9, String(x.근거 || '').replace(/\s+/g, ''), 비꼴.글); 칸(대비, r, 10, '', 비꼴.글)
    if (x.역 === '관급') x.하 = 0
    대비.ht.set(r, 16.5)
    if (i >= 덩끝 && 덩끝 >= 0 || 덩끝 < 0) 대비.merges.push('A' + r + ':B' + r)
  })
  if (덩끝 > 1) 대비.merges.push('A4:A' + (3 + 덩끝))
  for (const g of 무리칸) if (g.e > g.s) 대비.merges.push('B' + (4 + g.s) + ':B' + (4 + g.e))

  const 직원 = 새시트(이름.직원); 직원.가로 = false
  직원.widths = [3, 4, 24, 6, 17.4, 18.4, 16.4, 10, 22]
  const 원꼴 = {
    제목: 꼴({ b: true, sz: 16, c: 'FFFFFF', bg: '2D9654', h: 'center' }), 율말: 꼴({ b: true, sz: 10, c: 'FFFFFF', bg: 'CC0000', h: 'center' }), 율칸: 꼴({ b: true, sz: 13, c: 'CC0000', bg: 'FFFF00', n: '0.00%', h: 'center' }),
    쪽지: 꼴({ c: 'CC0000', bg: 'FFFACD', h: 'left' }), 머리: 꼴({ b: true, c: 'FFFFFF', bg: '2D9654', h: 'center', wrap: true }), 율줄: 꼴({ b: true, sz: 10, c: '2D9654', bg: 'E1F5EE', h: 'center' }),
    세로A: 꼴({ b: true, sz: 10, c: '003366', bg: 'E8F4FD', h: 'center', wrap: true }), 세로: 꼴({ sz: 9, h: 'center', wrap: true }), 가: 꼴({ sz: 9, h: 'center' }), 글: 꼴({ sz: 9, h: 'left' }),
    돈: 꼴({ sz: 10, n: '#,##0', h: 'right' }), 직돈: 꼴({ sz: 10, c: '388E3C', bg: 'E1F5EE', n: '#,##0', h: 'right' }), 하돈: 꼴({ sz: 10, c: '994400', bg: 'FFF9F0', n: '#,##0', h: 'right' }),
    검머리: 꼴({ b: true, sz: 10, c: 'FFFFFF', bg: '003366', h: 'center' }), 검글: 꼴({ b: true, sz: 11, bg: 'E8F4FD', h: 'center' }), 검돈: 꼴({ b: true, sz: 12, c: '003366', bg: 'E8F4FD', n: '#,##0', h: 'right' }), 검율: 꼴({ b: true, sz: 11, c: '003366', bg: 'E8F4FD', n: '0.00%', h: 'center' }),
    기준: 꼴({ b: true, sz: 11, c: 'FFFFFF', bg: '2D9654', h: 'center' }), 줄글: 꼴({ sz: 9, bg: 'F0FFF4', h: 'left' }),
  }
  칸(직원, 1, 1, '직접시공 원가계산서', 원꼴.제목); for (let c = 2; c <= 9; c++) 칸(직원, 1, c, '', 원꼴.제목); 직원.merges.push('A1:I1'); 직원.ht.set(1, 27.75)
  칸(직원, 2, 1, '하도급율:', 원꼴.율말); 칸(직원, 2, 2, '', 원꼴.율말); 칸(직원, 2, 3, { f: 첫율, v: 율 }, 원꼴.율칸)
  직원.merges.push('A2:B2')
  칸(직원, 2, 4, '← 첫 장 C2 셀 수정 → 전체 자동계산' + 꼬리('  '), 원꼴.쪽지); for (let c = 5; c <= 9; c++) 칸(직원, 2, c, '', 원꼴.쪽지); 직원.merges.push('D2:I2'); 직원.ht.set(2, 21.75)
  for (const [c, t] of [[1, '비            목'], [2, ''], [3, '항            목'], [4, '기\n호'], [5, '도  급  금  액'], [6, '직접시공금액\n(도급×직접율)'], [7, '하도급(예정)금액\n(도급×하도급율)'], [8, '요    율'], [9, '산   출   근   거']]) 칸(직원, 3, c, t, 원꼴.머리)
  직원.merges.push('A3:B3'); 직원.ht.set(3, 36); 직원.제목줄 = [3, 3]
  칸(직원, 4, 1, {
    f: '"직접시공율 = 1 - 하도급율 = 1 - "&$C$2&" = "&TEXT(1-$C$2,"0.00##")&"  [직접시공금액 = 도급금액 × "&ROUND((1-$C$2)*100,2)&"%  /  하도급금액 = 도급금액 × "&ROUND($C$2*100,2)&"%]"',
    v: '직접시공율 = 1 - 하도급율 = 1 - ' + 율 + ' = ' + 넷(1 - 율) + '  [직접시공금액 = 도급금액 × ' + pct(1 - 율) + '%  /  하도급금액 = 도급금액 × ' + 율p + '%]',
  }, 원꼴.율줄)
  for (let c = 2; c <= 9; c++) 칸(직원, 4, c, '', 원꼴.율줄); 직원.merges.push('A4:I4'); 직원.ht.set(4, 19.5)
  let 도급행 = 0, 순행 = 0, 일관율 = '', 이윤율 = ''
  원줄.forEach((x, i) => {
    const r = 5 + i
    칸(직원, r, 1, i === 0 && 덩끝 > 0 ? '순\n\n\n공\n\n\n사\n\n\n원\n\n\n가' : '', 원꼴.세로A)
    칸(직원, r, 2, i < 덩끝 ? x.B : '', 원꼴.세로)
    칸(직원, r, 3, x.이름, 원꼴.글); 칸(직원, r, 4, x.기호, 원꼴.가)
    칸(직원, r, 5, { f: 따(이름.대비) + 'F' + x.행1, v: x.금액 }, 원꼴.돈)
    const 영 = !x.금액 || x.역 === '관급'
    칸(직원, r, 6, 영 ? 0 : { f: 'ROUND(E' + r + '*(1-$C$2),0)', v: 반올(x.금액 * (1 - 율)) }, 원꼴.직돈)
    칸(직원, r, 7, { f: 따(이름.대비) + 'G' + x.행1, v: x.하 }, 원꼴.하돈)
    칸(직원, r, 8, x.역 === '관급' ? '관급 지급분' : x.요율, 원꼴.가); 칸(직원, r, 9, x.근거, 원꼴.글)
    직원.ht.set(r, 18)
    if (x.역 === '도급') 도급행 = r
    if (x.역 === '순공') 순행 = r
    if (x.역 === '일관') 일관율 = x.요율
    if (x.역 === '이윤') 이윤율 = x.요율
  })
  if (덩끝 > 1) 직원.merges.push('A5:A' + (4 + 덩끝))
  for (const g of 무리칸) if (g.e > g.s) 직원.merges.push('B' + (5 + g.s) + ':B' + (5 + g.e))
  if (!도급행) 도급행 = 4 + 원줄.length
  const 도급값 = (원줄.find((x) => x.역 === '도급') || 원줄[원줄.length - 1] || { 금액: 0 }).금액
  let wr = 5 + 원줄.length + 1
  for (const [c, t] of [[1, '[ 검  증 ]'], [2, ''], [3, ''], [4, ''], [5, '도급금액'], [6, 직율글('직접시공금액 (', ')', '$C$2')], [7, 율글('하도급금액 (', ')', '$C$2')], [8, '직접율'], [9, '하도급율']]) 칸(직원, wr, c, t, 원꼴.검머리)
  직원.merges.push('A' + wr + ':D' + wr); wr++
  칸(직원, wr, 1, '도  급  액  기  준', 원꼴.검글); for (const c of [2, 3, 4]) 칸(직원, wr, c, '', 원꼴.검글); 직원.merges.push('A' + wr + ':D' + wr)
  칸(직원, wr, 5, { f: 'E' + 도급행, v: 도급값 }, 원꼴.검돈)
  칸(직원, wr, 6, { f: 'ROUND(E' + wr + '*(1-$C$2),0)', v: 반올(도급값 * (1 - 율)) }, 원꼴.검돈)
  칸(직원, wr, 7, { f: 'ROUND(E' + wr + '*$C$2,0)', v: 반올(도급값 * 율) }, 원꼴.검돈)
  칸(직원, wr, 8, { f: '1-$C$2', v: 1 - 율 }, 원꼴.검율); 칸(직원, wr, 9, { f: '$C$2', v: 율 }, 원꼴.검율)
  wr += 2
  const 순공사비칸 = 대참('$G$', 5)
  const 순공사비값 = L[0].합.원.합계
  const 콤 = (v) => new Intl.NumberFormat('ko-KR').format(Math.round(v || 0))
  const 기준줄 = [
    '【 산출 기준 】',
    { f: '"① 직접시공율 = 1 - 하도급율 = 1 - "&ROUND($C$2*100,2)&"% = "&ROUND((1-$C$2)*100,2)&"%  (C2셀 하도급율 변경 시 자동 적용)"', v: '① 직접시공율 = 1 - 하도급율 = 1 - ' + 율p + '% = ' + pct(1 - 율) + '%  (C2셀 하도급율 변경 시 자동 적용)' },
    '② 직접시공금액 = 도급금액 × 직접시공율  (건설산업기본법 제28조의2 직접시공)',
    '③ 하도급(예정)금액 = 도급금액 × 하도급율  (하도급 계약금액 기준)',
    순행 ? { f: '"④ 순공사원가(D): "&TEXT(E' + 순행 + ',"#,##0")&"원' + (일관율 ? '  /  일반관리비율 ' + 일관율 : '') + (이윤율 ? '  /  이윤율 ' + 이윤율 : '') + '"', v: '④ 순공사원가(D): ' + 콤((원줄.find((x) => x.역 === '순공') || {}).금액) + '원' + (일관율 ? '  /  일반관리비율 ' + 일관율 : '') + (이윤율 ? '  /  이윤율 ' + 이윤율 : '') } : '④ 순공사원가: 원가계산서 금액 그대로',
    { f: '"⑤ 도급액 = "&TEXT(E' + 도급행 + ',"#,##0")&"원 (부가세 포함)  /  순공사비 = "&TEXT(' + 순공사비칸 + ',"#,##0")&"원"', v: '⑤ 도급액 = ' + 콤(도급값) + '원 (부가세 포함)  /  순공사비 = ' + 콤(순공사비값) + '원' },
  ]
  for (const t of 기준줄) {
    const 머 = t === '【 산출 기준 】'
    칸(직원, wr, 1, t, 머 ? 원꼴.기준 : 원꼴.줄글); for (let c = 2; c <= 9; c++) 칸(직원, wr, c, '', 머 ? 원꼴.기준 : 원꼴.줄글); 직원.merges.push('A' + wr + ':I' + wr); wr++
  }

  값빼기 = !!옵션.시험값빼기
  const bytes = 책쓰기([대비, 직원, 하, 대, 내, 직], 꾸.xml())
  값빼기 = false
  return {
    bytes, 율, 경고, 원가시트: 원가 ? 원가.시트 : '', 원가줄: 원줄.length,
    원가도급: (원줄.find((x) => x.역 === '도급') || {}).금액 ?? null, 원가하도급: (원줄.find((x) => x.역 === '도급') || {}).하 ?? null, 순라벨: String(L[0].이름).trim(), 순확인: 원가 && 직공 ? Math.abs(직공 - (L[0].합.원.합계 || 0)) <= Math.max(1000, 직공 * 0.0001) : null,
    도급: 전.원.합계, 대상: 전.대상, 하도급: 전.하.합계, 직접: 전.직접.합계, 관급: 셈.전체.관급,
    직접수: 셈.직접수, 관급수: 셈.관급수, 품목: 품들.length, 머리: L.filter((x) => x.꼴 !== '품').length,
    시트: [이름.대비, 이름.직원, 이름.하내, 이름.대상, 이름.내역, 이름.직내],
  }
}
function colN(c) { let n = 0; for (const ch of c) n = n * 26 + ch.charCodeAt(0) - 64; return n }
