/**
 * 📗 설계변경 작업대의 엑셀 쓰기 — 내역서 모양으로 (2026-09-30, G71)
 *
 * `qtoxlsx.writeWorkbook` 은 «머리 한 줄 + 표» 만 씁니다. 내역서 · 대비표는
 *   머리가 두 줄(합계 → 단가 · 금액)이고, 공종 줄은 굵게, 변경 줄은 붉게, 수량은 «있는 자리수만큼» 보여야
 *   현장에서 받아 줍니다. 그래서 따로 둡니다(qtoxlsx 를 건드리면 수량산출서 · 비율 도구가 흔들립니다).
 *
 * 시트: { 이름, 너비:[칸 너비], 제목, 머리:[[..],[..]], 병합:['A3:A4', ..], 줄:[[칸..]], 고정열, 가로, 숨김열:[번호] }
 * 칸  : null | 숫자 | 글 | { v, s } | { f, s }   (s = 아래 꼴 이름. 숫자는 s 가 없으면 자리수에 맞춰 고릅니다)
 */
import { zipSync, strToU8 } from 'fflate'

const esc = (s) => String(s)
  // eslint-disable-next-line no-control-regex
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export function 열글(n) {
  let s = ''
  while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = ((n - r) / 26) | 0 }
  return s
}

/* ── 꼴 ── 글꼴 · 채우기 · 테두리 · 숫자 형식을 이름으로 부릅니다 */
const 형식 = { 금: '#,##0', 수0: '#,##0', 수1: '#,##0.0', 수2: '#,##0.00', 수3: '#,##0.000', 수4: '#,##0.0000', 율: '0.00%', 율1: '0.0%' }
const 형식번호 = {}
Object.keys(형식).forEach((k, i) => { 형식번호[k] = 180 + i })
const 글꼴 = [
  '<font><sz val="10"/><name val="맑은 고딕"/></font>',                                    /* 0 보통 */
  '<font><b/><sz val="10"/><name val="맑은 고딕"/></font>',                                /* 1 굵게 */
  '<font><sz val="10"/><color rgb="FFC00000"/><name val="맑은 고딕"/></font>',             /* 2 붉게 */
  '<font><b/><sz val="10"/><color rgb="FFC00000"/><name val="맑은 고딕"/></font>',         /* 3 굵고 붉게 */
  '<font><sz val="10"/><color rgb="FF1F4E9E"/><name val="맑은 고딕"/></font>',             /* 4 파랗게(증) */
  '<font><b/><sz val="15"/><name val="맑은 고딕"/></font>',                                /* 5 제목 */
  '<font><sz val="9"/><color rgb="FF7F7F7F"/><name val="맑은 고딕"/></font>',              /* 6 흐리게 */
  '<font><b/><sz val="10"/><color rgb="FF1F4E9E"/><name val="맑은 고딕"/></font>',         /* 7 굵고 파랗게 */
]
const 채움 = [
  '<fill><patternFill patternType="none"/></fill>',
  '<fill><patternFill patternType="gray125"/></fill>',
  '<fill><patternFill patternType="solid"><fgColor rgb="FFDDE4EE"/><bgColor indexed="64"/></patternFill></fill>',  /* 2 머리 */
  '<fill><patternFill patternType="solid"><fgColor rgb="FFF2F2F2"/><bgColor indexed="64"/></patternFill></fill>',  /* 3 공종 */
  '<fill><patternFill patternType="solid"><fgColor rgb="FFFFF2CC"/><bgColor indexed="64"/></patternFill></fill>',  /* 4 확인할 칸 */
]
const 테두리 = [
  '<border><left/><right/><top/><bottom/><diagonal/></border>',
  '<border><left style="thin"><color rgb="FFA6A6A6"/></left><right style="thin"><color rgb="FFA6A6A6"/></right>' +
  '<top style="thin"><color rgb="FFA6A6A6"/></top><bottom style="thin"><color rgb="FFA6A6A6"/></bottom><diagonal/></border>',
  /* 2 — 2줄 내역에서 «당초» 줄: 아래 선을 점선으로(변경 줄과 한 덩이로 보이게) */
  '<border><left style="thin"><color rgb="FFA6A6A6"/></left><right style="thin"><color rgb="FFA6A6A6"/></right>' +
  '<top style="thin"><color rgb="FFA6A6A6"/></top><bottom style="hair"><color rgb="FFBFBFBF"/></bottom><diagonal/></border>',
  /* 3 — «변경» 줄: 위 선 점선 */
  '<border><left style="thin"><color rgb="FFA6A6A6"/></left><right style="thin"><color rgb="FFA6A6A6"/></right>' +
  '<top style="hair"><color rgb="FFBFBFBF"/></top><bottom style="thin"><color rgb="FFA6A6A6"/></bottom><diagonal/></border>',
]
/* 꼴 이름 → [형식, 글꼴, 채움, 테두리, 가로맞춤] */
const 기본꼴 = {
  민: [0, 0, 0, 0, ''],
  제목: [0, 5, 0, 0, 'center'],
  작은글: [0, 6, 0, 0, ''],
  머리: [0, 1, 2, 1, 'center'],
  글: [0, 0, 0, 1, ''],
  글가: [0, 0, 0, 1, 'center'],
  공종: [0, 1, 3, 1, ''],
  공종가: [0, 1, 3, 1, 'center'],
  확인: [0, 0, 4, 1, ''],
}
/* 숫자 꼴은 [형식] × [보통 · 굵게(공종) · 붉게(변경) · 굵고붉게 · 파랗게(증) · 굵고파랗게] × [테두리 셋] 을 모두 만들어 둡니다 */
const 숫자변형 = { '': [0, 0], 굵: [1, 3], 빨: [2, 0], 굵빨: [3, 3], 파: [4, 0], 굵파: [7, 3], 확인: [0, 4] }
const 선변형 = { '': 1, 위: 2, 아래: 3 }         /* 위 = 당초 줄(아래 점선) · 아래 = 변경 줄(위 점선) */
const 글변형 = { 글: [0, 0], 글굵: [1, 3], 글빨: [2, 0], 글굵빨: [3, 3], 글파: [4, 0] }

const 꼴표 = []
const 꼴번호 = {}
function 꼴더하기(이름, [f, font, fill, border, 맞춤]) {
  꼴번호[이름] = 꼴표.length
  꼴표.push('<xf numFmtId="' + (f ? 형식번호[f] : 0) + '" fontId="' + font + '" fillId="' + fill + '" borderId="' + border +
    '" xfId="0"' + (f ? ' applyNumberFormat="1"' : '') + ' applyFont="1" applyFill="1" applyBorder="1"' +
    (맞춤 ? ' applyAlignment="1"><alignment horizontal="' + 맞춤 + '" vertical="center"/></xf>'
      : ' applyAlignment="1"><alignment vertical="center"' + (f ? '' : ' wrapText="0"') + '/></xf>'))
}
Object.entries(기본꼴).forEach(([k, v]) => 꼴더하기(k, v))
for (const [선, b] of Object.entries(선변형)) {
  for (const [g, [font, fill]] of Object.entries(글변형)) 꼴더하기(g + (선 ? '_' + 선 : ''), [0, font, fill, b, ''])
  for (const f of Object.keys(형식)) {
    for (const [v, [font, fill]] of Object.entries(숫자변형)) 꼴더하기(f + v + (선 ? '_' + 선 : ''), [f, font, fill, b, ''])
  }
}
const 스타일 = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
  '<numFmts count="' + Object.keys(형식).length + '">' +
  Object.entries(형식).map(([k, v]) => '<numFmt numFmtId="' + 형식번호[k] + '" formatCode="' + esc(v) + '"/>').join('') + '</numFmts>' +
  '<fonts count="' + 글꼴.length + '">' + 글꼴.join('') + '</fonts>' +
  '<fills count="' + 채움.length + '">' + 채움.join('') + '</fills>' +
  '<borders count="' + 테두리.length + '">' + 테두리.join('') + '</borders>' +
  '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
  '<cellXfs count="' + 꼴표.length + '">' + 꼴표.join('') + '</cellXfs>' +
  '<cellStyles count="1"><cellStyle name="표준" xfId="0" builtinId="0"/></cellStyles></styleSheet>'

/** 수량 꼴 — 적힌 자리수만큼만 보여 줍니다 (4,674 · 12,750.4 · 0.036) */
export function 수꼴(v) {
  if (typeof v !== 'number' || !Number.isFinite(v)) return '수0'
  const t = Math.abs(v)
  for (let d = 0; d <= 4; d++) if (Math.abs(Math.round(t * 10 ** d) - t * 10 ** d) < 1e-6) return '수' + d
  return '수4'
}

function 칸xml(ref, val) {
  if (val === null || val === undefined || val === '') return ''
  let v = val
  let s = null
  if (typeof val === 'object') { s = val.s || null; v = val }
  const 번호 = (이름, 대신) => {
    if (꼴번호[이름] !== undefined) return 꼴번호[이름]
    const 민 = String(이름 || '').replace(/_(위|아래)$/, '')          /* 선 변형이 없는 꼴(글가 · 공종가)은 선 없이 */
    return 꼴번호[민] !== undefined ? 꼴번호[민] : 꼴번호[대신]
  }
  if (typeof v === 'object' && v.f !== undefined) {
    const 캐시 = typeof v.v === 'number' && Number.isFinite(v.v) ? '<v>' + v.v + '</v>' : ''
    return '<c r="' + ref + '" s="' + 번호(s || '금', '금') + '"><f>' + esc(String(v.f).replace(/^=/, '')) + '</f>' + 캐시 + '</c>'
  }
  const x = typeof v === 'object' ? v.v : v
  if (x === null || x === undefined || x === '') {
    return s ? '<c r="' + ref + '" s="' + 번호(s, '글') + '"/>' : ''
  }
  if (typeof x === 'number' && Number.isFinite(x)) {
    return '<c r="' + ref + '" s="' + 번호(s || 수꼴(x), '수0') + '"><v>' + x + '</v></c>'
  }
  return '<c r="' + ref + '" s="' + 번호(s || '글', '글') + '" t="inlineStr"><is><t xml:space="preserve">' + esc(x) + '</t></is></c>'
}

function 시트xml(t) {
  const 너비 = t.너비 || []
  const 숨김 = new Set(t.숨김열 || [])
  const cols = 너비.map((w, i) => '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + (w || 10) +
    '" customWidth="1"' + (숨김.has(i + 1) ? ' hidden="1"' : '') + '/>').join('')
  const 줄들 = []
  let r = 0
  const 넣기 = (칸들, 높이) => {
    r++
    const cs = (칸들 || []).map((v, i) => 칸xml(열글(i + 1) + r, v)).join('')
    줄들.push('<row r="' + r + '"' + (높이 ? ' ht="' + 높이 + '" customHeight="1"' : '') + '>' + cs + '</row>')
  }
  const 폭 = Math.max(너비.length, ...(t.머리 || [[]]).map((x) => x.length), 1)
  const 병합 = [...(t.병합 || [])]
  if (t.제목) {
    넣기([{ v: t.제목, s: '제목' }], 26)
    병합.unshift('A1:' + 열글(폭) + '1')
    넣기(t.부제 ? [{ v: t.부제, s: '작은글' }] : [])
  }
  const 머리시작 = r + 1
  for (const h of t.머리 || []) 넣기(h.map((x) => (x === null ? { v: '', s: '머리' } : { v: x, s: '머리' })), 20)
  const 머리끝 = r
  for (const 줄 of t.줄 || []) 넣기(줄)
  const 고정줄 = 머리끝
  const pane = 고정줄 || t.고정열
    ? '<pane' + (t.고정열 ? ' xSplit="' + t.고정열 + '"' : '') + (고정줄 ? ' ySplit="' + 고정줄 + '"' : '') +
      ' topLeftCell="' + 열글((t.고정열 || 0) + 1) + (고정줄 + 1) + '" activePane="' +
      (t.고정열 && 고정줄 ? 'bottomRight' : 고정줄 ? 'bottomLeft' : 'topRight') + '" state="frozen"/>'
    : ''
  /* 병합 칸 안의 빈자리에도 머리 꼴(테두리)이 있어야 선이 끊기지 않습니다 — 머리 줄은 위에서 null 도 꼴을 줬습니다 */
  return {
    xml: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
      'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
      '<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>' +
      '<sheetViews><sheetView workbookViewId="0" zoomScale="90">' + pane + '</sheetView></sheetViews>' +
      '<sheetFormatPr defaultRowHeight="16.5"/>' +
      (cols ? '<cols>' + cols + '</cols>' : '') +
      '<sheetData>' + 줄들.join('') + '</sheetData>' +
      (병합.length ? '<mergeCells count="' + 병합.length + '">' + 병합.map((m) => '<mergeCell ref="' + m + '"/>').join('') + '</mergeCells>' : '') +
      '<printOptions horizontalCentered="1"/>' +
      '<pageMargins left="0.4" right="0.4" top="0.6" bottom="0.6" header="0.3" footer="0.3"/>' +
      '<pageSetup paperSize="9" orientation="' + (t.세로 ? 'portrait' : 'landscape') + '" fitToWidth="1" fitToHeight="0"/>' +
      '<headerFooter><oddFooter>&amp;C&amp;P / &amp;N</oddFooter></headerFooter>' +
      '</worksheet>',
    머리시작, 머리끝,
  }
}

/** 시트들 → .xlsx 바이트 */
export function 변경엑셀(시트들) {
  const files = {}
  const n = 시트들.length
  const 그림 = 시트들.map(시트xml)
  files['[Content_Types].xml'] = strToU8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
    시트들.map((_, i) => '<Override PartName="/xl/worksheets/sheet' + (i + 1) +
      '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>').join('') +
    '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
    '</Types>')
  files['_rels/.rels'] = strToU8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
    '</Relationships>')
  /* 인쇄할 때 머리 줄이 쪽마다 나오게 (Print_Titles) */
  const 이름정의 = 그림.map((g, i) => (g.머리끝 >= g.머리시작
    ? '<definedName name="_xlnm.Print_Titles" localSheetId="' + i + '">\'' + esc(시트들[i].이름).replace(/'/g, "''") +
      '\'!$' + g.머리시작 + ':$' + g.머리끝 + '</definedName>' : '')).join('')
  files['xl/workbook.xml'] = strToU8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' +
    시트들.map((s, i) => '<sheet name="' + esc(s.이름) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>').join('') +
    '</sheets>' + (이름정의 ? '<definedNames>' + 이름정의 + '</definedNames>' : '') +
    '<calcPr calcId="0" fullCalcOnLoad="1"/></workbook>')
  files['xl/_rels/workbook.xml.rels'] = strToU8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    시트들.map((_, i) => '<Relationship Id="rId' + (i + 1) +
      '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>').join('') +
    '<Relationship Id="rId' + (n + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
    '</Relationships>')
  files['xl/styles.xml'] = strToU8(스타일)
  그림.forEach((g, i) => { files['xl/worksheets/sheet' + (i + 1) + '.xml'] = strToU8(g.xml) })
  return zipSync(files, { level: 6 })
}

/** 꼴 이름이 있나 (시험용) */
export const 꼴있나 = (이름) => 꼴번호[이름] !== undefined
