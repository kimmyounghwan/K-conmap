/**
 * 엑셀 읽기·쓰기 (아주 작은 판) — 브라우저에서만 돕니다 (2026-09-16).
 *
 * 읽기 : 재료표 .xlsx 를 시트마다 «표(2차원 배열)» 로 폅니다.
 * 쓰기 : 수량산출서 .xlsx 를 새로 만듭니다.  수식은 «살아 있는 수식» 으로 넣습니다.
 *
 * ⚠️ 왜 새로 만들었나 — `xlsx2line.js`(설계변경 2줄)는 «남의 엑셀을 고치는» 물건입니다.
 *    서식·인쇄영역·매크로를 살려야 해서 XML 을 그대로 손댑니다. 여기는 반대로
 *    «빈 종이에 새로 쓰는» 일이라 섞으면 둘 다 위험해집니다. 그래서 따로 둡니다.
 *    → 2줄 화면은 이 파일을 쓰지 않습니다. 건드리지 마십시오.
 *
 * ⚠️ 글자는 inlineStr 로 넣습니다. sharedStrings 를 안 쓰므로 파일이 조금 커지지만,
 *    표가 몇 천 줄이라도 사람이 못 느낍니다. 대신 «틀릴 구석» 이 하나 사라집니다.
 */
import { unzipSync, zipSync, strToU8, strFromU8 } from 'fflate'

/* ────────────────────────────────────────────────────────── 읽기 */

const unesc = (s) => String(s)
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  .replace(/&apos;/g, "'")
  .replace(/&#x([0-9A-Fa-f]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
  .replace(/&amp;/g, '&')

export function colToNum(s) {
  let n = 0
  for (const c of s.toUpperCase()) n = n * 26 + (c.charCodeAt(0) - 64)
  return n
}

/** <si> 하나에서 «보이는 글자» 만 모읍니다 (rPh = 후리가나는 뺍니다) */
function siText(xml) {
  const noPh = xml.replace(/<rPh[\s\S]*?<\/rPh>/g, '')
  let out = ''
  const re = /<t[^>]*>([\s\S]*?)<\/t>/g
  let m
  while ((m = re.exec(noPh))) out += unesc(m[1])
  return out
}

function sharedStrings(zip) {
  const f = zip['xl/sharedStrings.xml']
  if (!f) return []
  const xml = 이름표떼기(strFromU8(f))
  const out = []
  const re = /<si>([\s\S]*?)<\/si>/g
  let m
  while ((m = re.exec(xml))) out.push(siText(m[1]))
  return out
}

/** 시트 이름 -> zip 안의 경로 */
function sheetMap(zip) {
  const wb = zip['xl/workbook.xml']
  if (!wb) throw new Error('엑셀 파일이 아닌 것 같습니다 (xl/workbook.xml 이 없습니다).')
  const wbx = 이름표떼기(strFromU8(wb))
  const rels = {}
  const rf = zip['xl/_rels/workbook.xml.rels']
  if (rf) {
    const rx = 이름표떼기(strFromU8(rf))
    const re = /<Relationship\b[^>]*\/?>/g
    let m
    while ((m = re.exec(rx))) {
      const id = (m[0].match(/Id="([^"]*)"/) || [])[1]
      let t = (m[0].match(/Target="([^"]*)"/) || [])[1]
      if (!id || !t) continue
      t = t.replace(/^\//, '').replace(/^xl\//, '')
      rels[id] = 'xl/' + t
    }
  }
  const out = []
  const re = /<sheet\b[^>]*\/?>/g
  let m
  let i = 0
  while ((m = re.exec(wbx))) {
    i++
    const nm = unesc((m[0].match(/name="([^"]*)"/) || [])[1] || ('시트' + i))
    const rid = (m[0].match(/r:id="([^"]*)"/) || [])[1]
    const path = (rid && rels[rid]) || ('xl/worksheets/sheet' + i + '.xml')
    out.push([nm, path])
  }
  return out
}

/** 시트 XML 하나를 2차원 배열로. 값은 «글자» 또는 «숫자» 입니다. */
function gridOf(xml, sst) {
  const rows = []
  const rowRe = /<row\b([^>]*)>([\s\S]*?)<\/row>/g
  let rm
  while ((rm = rowRe.exec(xml))) {
    const rIdx = parseInt((rm[1].match(/ r="(\d+)"/) || [])[1] || '0', 10)
    const cells = []
    const cRe = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g
    let cm
    while ((cm = cRe.exec(rm[2]))) {
      const at = cm[1] || ''
      const inner = cm[2] || ''
      const ref = (at.match(/ r="([A-Z]+)\d+"/) || [])[1]
      const ci = ref ? colToNum(ref) - 1 : cells.length
      const t = (at.match(/ t="([^"]*)"/) || [])[1] || 'n'
      let v = null
      if (t === 'inlineStr') {
        const is = (inner.match(/<is>([\s\S]*?)<\/is>/) || [])[1]
        v = is ? siText(is) : ''
      } else {
        const vm = inner.match(/<v>([\s\S]*?)<\/v>/)
        const raw = vm ? unesc(vm[1]) : null
        if (raw === null) v = null
        else if (t === 's') v = sst[parseInt(raw, 10)] ?? ''
        else if (t === 'str' || t === 'e') v = raw
        else if (t === 'b') v = raw === '1' ? 'TRUE' : 'FALSE'
        else { const f = parseFloat(raw); v = Number.isFinite(f) ? f : raw }
      }
      while (cells.length < ci) cells.push(null)
      cells[ci] = v
    }
    const at = rIdx > 0 ? rIdx - 1 : rows.length
    while (rows.length < at) rows.push([])
    rows[at] = cells
  }
  return rows
}

/** .xlsx 바이트 -> { 시트이름: 표 } */
/* 🇰🇷 2026-09-18 — 한셀(한글과컴퓨터)이 만든 xlsx 는 태그에 «이름표» 를 붙입니다.
   <x:workbook> <x:sheet> <x:row> <x:c> <x:v> … 그래서 우리 정규식이 하나도 안 걸려
   «시트가 0개» 로 나왔습니다 (내역서 20여 개가 통째로 안 읽혔습니다).
   여는 태그·닫는 태그의 이름표만 떼어 냅니다 — 속성(r:id)은 그대로 둡니다. */
const 이름표떼기 = (x) => x.replace(/<(\/?)[A-Za-z_][\w.-]*:/g, '<$1')

export function readWorkbook(bytes) {
  let zip
  try {
    zip = unzipSync(new Uint8Array(bytes))
  } catch (e) {
    throw new Error('엑셀 파일을 열지 못했습니다. .xls 는 안 됩니다 — 엑셀에서 «다른 이름으로 저장» 하여 .xlsx 로 바꿔 주십시오.')
  }
  if (!zip['xl/workbook.xml'])
    throw new Error('엑셀(.xlsx) 파일이 아닙니다. .xls 라면 엑셀에서 .xlsx 로 저장해 주십시오.')
  const sst = sharedStrings(zip)
  const out = {}
  for (const [nm, path] of sheetMap(zip)) {
    const f = zip[path]
    out[String(nm).trim()] = f ? gridOf(이름표떼기(strFromU8(f)), sst) : []
  }
  return out
}

/* ────────────────────────────────────────────────────────── 쓰기 */

const esc = (s) => String(s)
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export function numToCol(n) {
  let s = ''
  while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = ((n - r) / 26) | 0 }
  return s
}

/**
 * 시트 하나를 만듭니다.
 *   head  : ['번호','부재',...]
 *   rows  : [[셀, 셀, ...], ...]   셀은 아래 셋 중 하나입니다
 *            · 글자/숫자/null          — 그대로
 *            · {f:'A1*2', s:'#,##0.000'} — 살아 있는 «수식»
 *            · {v: 값, st: 번호}        — 값 + 꾸밈번호
 *   widths: 칸 너비, hide: 숨길 칸 번호(1부터)
 */
function sheetXml(head, rows, widths, hide, freeze) {
  const cols = []
  const W = widths || []
  const H = new Set(hide || [])
  for (let i = 0; i < Math.max(head.length, W.length); i++) {
    const w = W[i] || 12
    cols.push('<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + w + '" customWidth="1"' +
      (H.has(i + 1) ? ' hidden="1"' : '') + '/>')
  }
  const out = []
  const cell = (r, ci, val) => {
    const ref = numToCol(ci + 1) + r
    if (val === null || val === undefined || val === '') return ''
    if (typeof val === 'object') {
      const st = val.st == null ? (val.f !== undefined ? 3 : 1) : val.st
      if (val.f !== undefined)
        return '<c r="' + ref + '" s="' + st + '"><f>' + esc(val.f) + '</f></c>'
      if (typeof val.v === 'number')
        return '<c r="' + ref + '" s="' + st + '"><v>' + val.v + '</v></c>'
      return '<c r="' + ref + '" s="' + st + '" t="inlineStr"><is><t xml:space="preserve">' + esc(val.v) + '</t></is></c>'
    }
    if (typeof val === 'number')
      return '<c r="' + ref + '" s="1"><v>' + val + '</v></c>'
    return '<c r="' + ref + '" s="1" t="inlineStr"><is><t xml:space="preserve">' + esc(val) + '</t></is></c>'
  }
  out.push('<row r="1">' + head.map((h, i) =>
    '<c r="' + numToCol(i + 1) + '1" s="2" t="inlineStr"><is><t xml:space="preserve">' + esc(h) + '</t></is></c>').join('') + '</row>')
  rows.forEach((r, ri) => {
    const rn = ri + 2
    const cs = r.map((v, ci) => cell(rn, ci, v)).join('')
    out.push('<row r="' + rn + '">' + cs + '</row>')
  })
  const last = numToCol(Math.max(head.length, 1)) + (rows.length + 1)
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
    '<sheetViews><sheetView workbookViewId="0">' +
    (freeze === false ? '' : '<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>') +
    '</sheetView></sheetViews>' +
    '<cols>' + cols.join('') + '</cols>' +
    '<sheetData>' + out.join('') + '</sheetData>' +
    '<autoFilter ref="A1:' + last + '"/>' +
    '</worksheet>'
}

const STYLES = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
  '<numFmts count="4">' +
  '<numFmt numFmtId="200" formatCode="#,##0.000"/>' +
  '<numFmt numFmtId="201" formatCode="#,##0"/>' +
  '<numFmt numFmtId="202" formatCode="#,##0.00"/>' +
  '<numFmt numFmtId="203" formatCode="0.0000%"/>' +
  '</numFmts>' +
  '<fonts count="4">' +
  '<font><sz val="10"/><name val="맑은 고딕"/></font>' +
  '<font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="맑은 고딕"/></font>' +
  '<font><sz val="9"/><color rgb="FF808080"/><name val="맑은 고딕"/></font>' +
  '<font><sz val="10"/><color rgb="FFC00000"/><name val="맑은 고딕"/></font>' +
  '</fonts>' +
  '<fills count="4"><fill><patternFill patternType="none"/></fill>' +
  '<fill><patternFill patternType="gray125"/></fill>' +
  '<fill><patternFill patternType="solid"><fgColor rgb="FF1F3864"/><bgColor indexed="64"/></patternFill></fill>' +
  '<fill><patternFill patternType="solid"><fgColor rgb="FFFFF2CC"/><bgColor indexed="64"/></patternFill></fill></fills>' +
  '<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border>' +
  '<border><left style="thin"><color rgb="FFBFBFBF"/></left><right style="thin"><color rgb="FFBFBFBF"/></right>' +
  '<top style="thin"><color rgb="FFBFBFBF"/></top><bottom style="thin"><color rgb="FFBFBFBF"/></bottom><diagonal/></border></borders>' +
  '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
  '<cellXfs count="10">' +
  '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +                                    /* 0 민 것 */
  '<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"/>' +                     /* 1 보통 */
  '<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>' + /* 2 머리 */
  '<xf numFmtId="200" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>' + /* 3 수량 */
  '<xf numFmtId="0" fontId="2" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1"/>' +        /* 4 흐린 글 */
  '<xf numFmtId="0" fontId="3" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1"/>' +        /* 5 붉은 글 */
  '<xf numFmtId="201" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>' + /* 6 정수 */
  '<xf numFmtId="202" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>' + /* 7 소수2 */
  '<xf numFmtId="203" fontId="0" fillId="3" borderId="1" xfId="0" applyNumberFormat="1" applyFill="1" applyBorder="1"/>' + /* 8 요율 — 노란 칸(고치는 자리) */
  '<xf numFmtId="201" fontId="0" fillId="3" borderId="1" xfId="0" applyNumberFormat="1" applyFill="1" applyBorder="1"/>' + /* 9 넣는 금액 — 노란 칸 */
  '</cellXfs><cellStyles count="1"><cellStyle name="표준" xfId="0" builtinId="0"/></cellStyles></styleSheet>'

export const ST = { PLAIN: 0, BOX: 1, HEAD: 2, QTY: 3, GRAY: 4, RED: 5, INT: 6, DEC2: 7, PCT: 8, FILLIN: 9 }

/** 시트 여러 장을 담은 .xlsx 바이트를 만듭니다.
 *  sheets: [{name, head, rows, widths, hide, freeze}] */
export function writeWorkbook(sheets) {
  const files = {}
  const n = sheets.length
  files['[Content_Types].xml'] = strToU8(
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
    sheets.map((_, i) => '<Override PartName="/xl/worksheets/sheet' + (i + 1) +
      '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>').join('') +
    '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
    '</Types>')
  files['_rels/.rels'] = strToU8(
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
    '</Relationships>')
  files['xl/workbook.xml'] = strToU8(
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' +
    sheets.map((s, i) => '<sheet name="' + esc(s.name) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>').join('') +
    '</sheets><calcPr calcId="0" fullCalcOnLoad="1"/></workbook>')
  files['xl/_rels/workbook.xml.rels'] = strToU8(
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    sheets.map((_, i) => '<Relationship Id="rId' + (i + 1) +
      '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>').join('') +
    '<Relationship Id="rId' + (n + 1) +
    '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
    '</Relationships>')
  files['xl/styles.xml'] = strToU8(STYLES)
  sheets.forEach((s, i) => {
    files['xl/worksheets/sheet' + (i + 1) + '.xml'] =
      strToU8(sheetXml(s.head, s.rows, s.widths, s.hide, s.freeze))
  })
  return zipSync(files, { level: 6 })
}
