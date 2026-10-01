/**
 * 📗 격자 엑셀 — 화면의 «종이»(HTML 표)를 칸 합치기까지 그대로 엑셀로 · 값만 (G110 · 2026-10-01)
 *
 * 소장님: 「엑셀로 값만 주는 걸로 하자. 프로그램 원칙으로 하고」 · 「2차 가자」(투입비 · 장비 · 위험성평가)
 *   + 원칙 «남이 준 서식은 원본 그대로»(2026-09-19) — 위험성평가 별지 1~5 는 서식(web/public/forms/wih-*.xlsx · tools/wihgen.py)과
 *     «같은 칸» 으로 그린 종이(tools/위험성종이.jsx)를 그대로 옮겨야 합니다. 그래서 따로 표를 새로 짜지 않고,
 *     화면에 떠 있는 종이 미리보기(.rk-paper)를 위에서부터 읽어 «합친 칸 · 결재란 · 칸 이름 · 차례» 를 그대로 엑셀에 옮깁니다.
 *     (종이와 엑셀이 어긋날 일이 없습니다 — 종이를 고치면 엑셀도 따라감)
 *
 * ■ 종이를격자(종이El) → { 칸수, 줄들:[{h, 칸:[{c, n, r, v, s}]}] }
 *     (G112) 칸에 data-n="숫자" 가 있으면 글 대신 숫자로(#,##0) — 엑셀에서 더하기가 되게
 *     (G112) 종이를격자(종이, 폭) — 칸 폭(기본 1.5 = 위험성평가 서식). 칸 수가 적은 종이(산안비 사용내역서 24칸)는 넓게.
 *     .rk-top(윗글) · .rk-bigttl(큰 제목) · table.rk-t(colSpan · rowSpan 그대로) · .rk-sec · .rk-box · .rk-photo(사진은 «인쇄본에») · .rk-foot
 * ■ 격자책([{이름, 칸수, 줄들, 가로}]) → .xlsx 바이트 — 수식 없음 · 값만
 *     칸 폭 1.5(wihgen 단위) · 얇은 검은 선 · 머리 칸 굵게(칠 없음) · 붉은 글 C00000 · 회색 EDEDED 은 «회» 칸만 · 맑은 고딕 · A4 가로/세로 · 폭 1장 맞춤 · 여백 wihgen 과 같음
 *     줄 높이는 wihgen 줄높이(한글 한 자 = 두 칸)와 같은 셈으로 — 글자가 잘리지 않게
 */
import { zipSync, strToU8 } from 'fflate'
import { numToCol } from './qtoxlsx.js'

const esc = (s) => String(s)
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/* 꾸밈 번호 — STYLES 의 cellXfs 차례와 같아야 합니다.
 * 서식(wih-*.xlsx) 그대로: 머리 칸은 칠 없이 굵게(세부작업 · 사용장비는 붉게) · 회색 칠은 별지3·4 «회의일시» 같은 칸만 ·
 * 몸 글자 9pt · 작은 글 8pt · 윗글 11pt · 가운데 제목 16pt · 별지3·4 큰 제목 18pt. 위험등급 «상» 은 종이처럼 붉게. */
export const 꼴 = { 민: 0, 칸: 1, 칸왼: 2, 칸왼위: 3, 머리: 4, 머리빨강: 5, 머리왼: 6, 굵은칸: 7, 제목: 8, 작은칸: 9, 윗글: 10, 큰제목: 11, 없음: 12, 꼬리: 13, 작은칸왼: 14, 회칸: 15, 등급상: 16, 수: 17, 굵은수: 18, 칸nb: 19, 칸왼nb: 20, 수nb: 21, 작은칸nb: 22, 작은칸왼nb: 23 }
/* (G112) 칸에 class «nb» — 가로줄 없이 세로줄만 */
const 세로만 = { [1]: 19, [2]: 20, [3]: 20, [17]: 21, [9]: 22, [14]: 23 }

const 가 = (h, v = 'center') => `<alignment horizontal="${h}" vertical="${v}" wrapText="1"/>`
const xf = (font, fill, border, al) => `<xf numFmtId="0" fontId="${font}" fillId="${fill}" borderId="${border}" xfId="0" applyFont="1"${fill ? ' applyFill="1"' : ''}${border ? ' applyBorder="1"' : ''} applyAlignment="1">${al}</xf>`
const STYLES = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
  '<fonts count="8">' +
  '<font><sz val="9"/><name val="맑은 고딕"/></font>' +                                   /* 0 몸 */
  '<font><b/><sz val="9"/><name val="맑은 고딕"/></font>' +                               /* 1 굵게 */
  '<font><b/><sz val="9"/><color rgb="FFC00000"/><name val="맑은 고딕"/></font>' +        /* 2 붉게 */
  '<font><b/><sz val="16"/><name val="맑은 고딕"/></font>' +                              /* 3 제목 */
  '<font><sz val="8"/><name val="맑은 고딕"/></font>' +                                   /* 4 작게 */
  '<font><b/><sz val="11"/><name val="맑은 고딕"/></font>' +                              /* 5 윗글 */
  '<font><sz val="8.5"/><color rgb="FF555555"/><name val="맑은 고딕"/></font>' +          /* 6 꼬리 */
  '<font><b/><sz val="18"/><name val="맑은 고딕"/></font>' +                              /* 7 큰 제목 */
  '</fonts>' +
  '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>' +
  '<fill><patternFill patternType="solid"><fgColor rgb="FFEDEDED"/><bgColor indexed="64"/></patternFill></fill></fills>' +
  '<borders count="3"><border><left/><right/><top/><bottom/><diagonal/></border>' +
  '<border><left style="thin"><color rgb="FF000000"/></left><right style="thin"><color rgb="FF000000"/></right>' +
  '<top style="thin"><color rgb="FF000000"/></top><bottom style="thin"><color rgb="FF000000"/></bottom><diagonal/></border>' +
  /* 2 — (G112) 세로줄만(산안비 항목별 사용내역 몸통처럼 가로줄 없는 칸) */
  '<border><left style="thin"><color rgb="FF000000"/></left><right style="thin"><color rgb="FF000000"/></right><top/><bottom/><diagonal/></border></borders>' +
  '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
  '<cellXfs count="24">' +
  '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +   /* 0 민 */
  xf(0, 0, 1, 가('center')) +       /* 1 칸 */
  xf(0, 0, 1, 가('left')) +         /* 2 칸왼 */
  xf(0, 0, 1, 가('left', 'top')) +  /* 3 칸왼위 */
  xf(1, 0, 1, 가('center')) +       /* 4 머리 */
  xf(2, 0, 1, 가('center')) +       /* 5 머리빨강 */
  xf(1, 0, 1, 가('left')) +         /* 6 머리왼 */
  xf(1, 0, 1, 가('center')) +       /* 7 굵은칸 */
  xf(3, 0, 1, 가('center')) +       /* 8 제목 */
  xf(4, 0, 1, 가('center')) +       /* 9 작은칸 */
  xf(5, 0, 0, 가('left')) +         /* 10 윗글 */
  xf(7, 0, 0, 가('center')) +       /* 11 큰제목 */
  xf(0, 0, 0, 가('left')) +         /* 12 없음 */
  xf(6, 0, 0, 가('left')) +         /* 13 꼬리 */
  xf(4, 0, 1, 가('left')) +         /* 14 작은칸왼 */
  xf(1, 2, 1, 가('center')) +       /* 15 회칸 */
  xf(2, 0, 1, 가('center')) +       /* 16 등급상 */
  /* 17 수 · 18 굵은수 — (G112) 칸에 data-n 이 있으면 숫자 그대로(#,##0) · 산안비 사용내역서처럼 금액 칸이 많은 종이 */
  '<xf numFmtId="3" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1" applyAlignment="1">' + 가('right') + '</xf>' +
  '<xf numFmtId="3" fontId="1" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1" applyAlignment="1">' + 가('right') + '</xf>' +
  /* 19~23 — (G112) 세로줄만: 칸 · 칸왼 · 수 · 작은칸 · 작은칸왼 */
  xf(0, 0, 2, 가('center')) + xf(0, 0, 2, 가('left')) +
  '<xf numFmtId="3" fontId="0" fillId="0" borderId="2" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1" applyAlignment="1">' + 가('right') + '</xf>' +
  xf(4, 0, 2, 가('center')) + xf(4, 0, 2, 가('left')) +
  '</cellXfs><cellStyles count="1"><cellStyle name="표준" xfId="0" builtinId="0"/></cellStyles></styleSheet>'

/* ── 화면 종이 → 격자 ─────────────────────────────── */

/** td 의 class(위험성종이.jsx 칸: hd · red · l · top · gray · sm · xs · b · no · ttl) → 꾸밈 번호 */
function 꼴고르기(td) {
  const c = td.classList
  if (c.contains('no')) return 꼴.없음
  if (c.contains('ttl')) return 꼴.제목
  if (c.contains('gray')) return 꼴.회칸
  if (c.contains('hd')) return c.contains('red') ? 꼴.머리빨강 : c.contains('l') ? 꼴.머리왼 : 꼴.머리
  if (c.contains('g-상')) return 꼴.등급상
  if (c.contains('sm') || c.contains('xs')) return c.contains('l') ? 꼴.작은칸왼 : 꼴.작은칸
  if (c.contains('l')) return c.contains('top') ? 꼴.칸왼위 : 꼴.칸왼
  if (c.contains('b')) return 꼴.굵은칸
  return 꼴.칸
}
/** 칸 글 — <br> 은 줄바꿈 그대로 · 줄마다 앞뒤 빈칸 정리 */
function 글읽기(el) {
  const t = (el.innerText != null ? el.innerText : el.textContent) || ''
  return t.split('\n').map((x) => x.replace(/\s+$/g, '').replace(/^\s+/g, '')).join('\n').replace(/^\n+|\n+$/g, '')
}
/** wihgen 줄높이 와 같은 셈 — 한 줄에 «칸 너비(글자 폭 합) ÷ 2.05» 자 · 너비 = 칸수 × 1.5(위험성) 또는 칸마다 폭의 합(G112) */
function 높이셈(글, 너비, 작게) {
  if (!글 && 글 !== 0) return 0
  const 한줄 = Math.max(6, Math.floor(너비 / (작게 ? 1.8 : 2.05)))
  let 줄 = 0
  for (const 조각 of String(글).split('\n')) 줄 += Math.max(1, Math.ceil(조각.length / 한줄))
  return (작게 ? 13 : 14.5) * 줄 + 6
}

/**
 * @param {HTMLElement} 종이 — .rk-paper (화면에 그려진 미리보기)
 */
export function 종이를격자(종이, 폭 = 1.5) {
  const 표들 = [...종이.querySelectorAll('table.rk-t')]
  /* (G112) <col data-w="글자 폭"> 이 모두 있으면 칸마다 폭을 따로(원본 서식의 세로줄 자리 그대로) */
  const 첫칸 = 표들.length ? [...표들[0].querySelectorAll('colgroup col')] : []
  const 폭들 = 첫칸.length && 첫칸.every((c) => Number(c.dataset.w) > 0) ? 첫칸.map((c) => Number(c.dataset.w)) : null
  const 칸수 = 폭들 ? 폭들.length : Math.max(12, ...표들.map((t) => t.querySelectorAll('colgroup col').length))
  const 너비 = (c, n) => (폭들 ? 폭들.slice(c, c + n).reduce((a, b) => a + b, 0) : n * 폭)
  const 줄들 = []
  const 한줄 = (v, s, h) => { 줄들.push({ h, 칸: [{ c: 0, n: 칸수, r: 1, v, s }] }) }
  const 표넣기 = (tbl) => {
    const trs = [...tbl.querySelectorAll(':scope > tbody > tr')]
    const 시작 = 줄들.length
    const 찬 = []
    trs.forEach((tr, ri) => {
      const 줄 = { h: 0, 칸: [] }
      줄들.push(줄)
      if (!찬[ri]) 찬[ri] = new Set()
      let c = 0
      for (const td of tr.children) {
        while (찬[ri].has(c)) c++
        const n = td.colSpan || 1, r = td.rowSpan || 1
        for (let dr = 0; dr < r; dr++) { if (!찬[ri + dr]) 찬[ri + dr] = new Set(); for (let dc = 0; dc < n; dc++) 찬[ri + dr].add(c + dc) }
        const pt = parseFloat(td.style && td.style.height) || 0
        if (r === 1) 줄.h = Math.max(줄.h, pt)
        const 그림 = td.querySelectorAll('img').length
        const 숫 = td.dataset && td.dataset.n !== undefined && td.dataset.n !== '' && Number.isFinite(Number(td.dataset.n))
        const v = 그림 ? `(사진 ${그림}장 — 인쇄본에 있습니다)` : 숫 ? Number(td.dataset.n) : 글읽기(td)
        let s0 = 숫 ? (td.classList.contains('b') ? 꼴.굵은수 : 꼴.수) : 꼴고르기(td)
        if (td.classList.contains('nb') && 세로만[s0] !== undefined) s0 = 세로만[s0]
        줄.칸.push({ c, n, r, v, s: s0, pt })
        c += n
      }
    })
    /* 줄 높이 — 글자가 다 보이게(합친 칸은 그 줄들 높이 합으로) */
    for (let i = 시작; i < 줄들.length; i++) {
      for (const k of 줄들[i].칸) {
        const 작게 = k.s === 꼴.작은칸 || k.s === 꼴.작은칸왼 || k.s === 꼴.작은칸nb || k.s === 꼴.작은칸왼nb
        const 필요 = Math.max(높이셈(k.v, 너비(k.c, k.n), 작게), k.r === 1 ? 18 : 0, k.pt || 0)
        if (k.r === 1) { 줄들[i].h = Math.max(줄들[i].h, 필요); continue }
        let 합 = 0
        for (let j = i; j < i + k.r && j < 줄들.length; j++) 합 += 줄들[j].h || 18
        if (합 < 필요) { const 끝 = Math.min(줄들.length - 1, i + k.r - 1); 줄들[끝].h = (줄들[끝].h || 18) + (필요 - 합) }
      }
    }
  }
  for (const el of 종이.children) {
    const c = el.classList
    if (el.tagName === 'TABLE' && c.contains('rk-t')) { 표넣기(el); continue }
    if (c.contains('rk-top')) { 한줄(글읽기(el), c.contains('sm') ? 꼴.꼬리 : 꼴.윗글, c.contains('sm') ? 16 : 20); continue }
    if (c.contains('rk-bigttl')) { 한줄(글읽기(el), 꼴.큰제목, 34); continue }
    if (c.contains('rk-sec')) { 한줄(글읽기(el), 꼴.윗글, 22); continue }
    if (c.contains('rk-box')) {
      const t = [...el.children].map(글읽기).filter(Boolean).join('\n')
      줄들.push({ h: Math.max(40, 높이셈(t, 너비(0, 칸수), false) + 6), 칸: [{ c: 0, n: 칸수, r: 1, v: t, s: 꼴.칸왼위 }] })
      continue
    }
    if (c.contains('rk-photo')) {
      const 그림 = el.querySelectorAll('img').length
      줄들.push({ h: 60, 칸: [{ c: 0, n: 칸수, r: 1, v: 그림 ? `(사진 ${그림}장 — 사진은 인쇄본에 있습니다)` : 글읽기(el), s: 꼴.칸 }] })
      continue
    }
    if (c.contains('rk-foot')) { 한줄(글읽기(el.firstElementChild || el), 꼴.꼬리, 18); continue }
    const t = 글읽기(el)
    if (t) 한줄(t, 꼴.없음, 18)
  }
  return { 칸수, 줄들, 폭, 폭들 }
}

/* ── 격자 → .xlsx ─────────────────────────────── */
function 장xml({ 칸수, 줄들, 가로, 폭 = 1.5, 폭들 = null }) {
  const 칸들 = new Map()          // 줄 → Map(칸 → {s, v})
  const 합침 = []
  줄들.forEach((줄, ri) => {
    for (const k of 줄.칸) {
      for (let dr = 0; dr < k.r; dr++) {
        const rr = ri + dr
        if (!칸들.has(rr)) 칸들.set(rr, new Map())
        for (let dc = 0; dc < k.n; dc++) 칸들.get(rr).set(k.c + dc, { s: k.s, v: dr === 0 && dc === 0 ? k.v : null })
      }
      if (k.n > 1 || k.r > 1) 합침.push(`${numToCol(k.c + 1)}${ri + 1}:${numToCol(k.c + k.n)}${ri + k.r}`)
    }
  })
  const 줄xml = 줄들.map((줄, ri) => {
    const m = 칸들.get(ri) || new Map()
    const cs = [...m.entries()].sort((a, b) => a[0] - b[0]).map(([c, x]) => {
      const ref = numToCol(c + 1) + (ri + 1)
      if (x.v === null || x.v === undefined || x.v === '') return `<c r="${ref}" s="${x.s}"/>`
      if (typeof x.v === 'number') return `<c r="${ref}" s="${x.s}"><v>${x.v}</v></c>`
      return `<c r="${ref}" s="${x.s}" t="inlineStr"><is><t xml:space="preserve">${esc(x.v)}</t></is></c>`
    }).join('')
    const h = Math.round((줄.h || 18) * 10) / 10
    return `<row r="${ri + 1}" ht="${h}" customHeight="1">${cs}</row>`
  }).join('')
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
    '<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>' +
    '<sheetViews><sheetView workbookViewId="0" showGridLines="0"/></sheetViews>' +
    (폭들 ? `<cols>${폭들.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${Math.round(w * 100) / 100}" customWidth="1"/>`).join('')}</cols>` : `<cols><col min="1" max="${칸수}" width="${폭}" customWidth="1"/></cols>`) +
    `<sheetData>${줄xml}</sheetData>` +
    (합침.length ? `<mergeCells count="${합침.length}">${합침.map((x) => `<mergeCell ref="${x}"/>`).join('')}</mergeCells>` : '') +
    '<pageMargins left="0.25" right="0.25" top="0.35" bottom="0.35" header="0.3" footer="0.3"/>' +
    `<pageSetup paperSize="9" orientation="${가로 ? 'landscape' : 'portrait'}" fitToWidth="1" fitToHeight="0"/>` +
    '</worksheet>'
}

/** @param {Array<{이름:string, 칸수:number, 줄들:any[], 가로?:boolean}>} 장들 */
export function 격자책(장들) {
  const f = {}
  const n = 장들.length
  const 이름 = (s) => esc(String(s || '시트').replace(/[\\/?*[\]:]/g, ' ').slice(0, 31))
  f['[Content_Types].xml'] = strToU8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
    장들.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('') +
    '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>')
  f['_rels/.rels'] = strToU8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>')
  f['xl/workbook.xml'] = strToU8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' +
    장들.map((s, i) => `<sheet name="${이름(s.이름)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('') + '</sheets></workbook>')
  f['xl/_rels/workbook.xml.rels'] = strToU8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    장들.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('') +
    `<Relationship Id="rId${n + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`)
  f['xl/styles.xml'] = strToU8(STYLES)
  장들.forEach((s, i) => { f[`xl/worksheets/sheet${i + 1}.xml`] = strToU8(장xml(s)) })
  return zipSync(f, { level: 6 })
}
