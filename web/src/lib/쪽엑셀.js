/**
 * 📗 엑셀(.xlsx) 쓰기 — 사진이 들어가는 시트 (2026-09-30, 사진대지 · 영수증 정리) — 쪽문서.js 머리말
 *
 * ■ 엑셀책(시트들) — 낮은 곳: 칸 값/수식 · 모양 · 병합 · 열 너비 · 줄 높이 · 사진(한 칸에 붙임) · 쪽 나눔 · A4 한 쪽 너비 인쇄
 * ■ 쪽들시트(쪽들, 그림들) — 쪽 모형(mm 칸)을 시트 하나에 이어 붙임(쪽마다 쪽 나눔). 가로 경계는 모든 쪽이 같이 씀.
 * ⚠️ 열 너비 → 화면 점(px): 기본 글꼴을 Calibri 11(숫자 폭 7점)로 두어 엑셀이 우리가 셈한 너비 그대로 그리게 합니다.
 *    사진 자리는 그 점으로 셈합니다(칸에 딱 맞게 · 가운데).
 */
import { zipSync, strToU8 } from 'fflate'
import { 격자로, 공통가로, 글맞춤, 그림맞춤, 싸기 } from './쪽문서.js'

const px = (mm) => (mm / 25.4) * 96
const 너비값 = (mm) => Math.max(0.3, Math.round((px(mm) / 7) * 256) / 256)
/* 엑셀이 실제로 그리는 열 폭(px) — 너비값을 되돌려 셈 */
const 실폭 = (mm) => Math.floor(((256 * 너비값(mm) + Math.floor(128 / 7)) / 256) * 7)
const emu = (pxv) => Math.round(pxv * 9525)

export function 열이름(c) {
  let s = ''
  let n = c + 1
  while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26) }
  return s
}
export const 주소 = (r, c) => `${열이름(c)}${r + 1}`

/* ── 모양 목록 ── */
function 모양장부() {
  const 글꼴 = ['<font><sz val="11"/><name val="Calibri"/><family val="2"/></font>']
  const 칠 = ['<fill><patternFill patternType="none"/></fill>', '<fill><patternFill patternType="gray125"/></fill>']
  const 선 = ['<border><left/><right/><top/><bottom/><diagonal/></border>']
  const 수꼴 = []
  const xf = ['<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>']
  const 찾 = new Map()
  const 넣기 = (arr, s) => { let i = arr.indexOf(s); if (i < 0) { arr.push(s); i = arr.length - 1 } return i }
  function 번호(m = {}) {
    const k = JSON.stringify(m)
    if (찾.has(k)) return 찾.get(k)
    const f = 넣기(글꼴, `<font>${m.굵게 ? '<b/>' : ''}<sz val="${m.크기 || 10}"/>${m.색 ? `<color rgb="FF${m.색.slice(1).toUpperCase()}"/>` : ''}<name val="맑은 고딕"/><family val="3"/><charset val="129"/></font>`)
    const fl = m.바탕 ? 넣기(칠, `<fill><patternFill patternType="solid"><fgColor rgb="FF${m.바탕.slice(1).toUpperCase()}"/><bgColor indexed="64"/></patternFill></fill>`) : 0
    const 굵 = m.굵은테 ? 'medium' : 'thin'
    const b = m.테 ? 넣기(선, `<border><left style="${굵}"><color rgb="FF333333"/></left><right style="${굵}"><color rgb="FF333333"/></right><top style="${굵}"><color rgb="FF333333"/></top><bottom style="${굵}"><color rgb="FF333333"/></bottom><diagonal/></border>`) : 0
    let nf = 0
    if (m.형식) {
      const 있 = 수꼴.findIndex((x) => x.code === m.형식)
      nf = 있 >= 0 ? 수꼴[있].id : (수꼴.push({ id: 164 + 수꼴.length, code: m.형식 }), 수꼴[수꼴.length - 1].id)
    }
    const 가로 = m.정렬 === '왼' ? 'left' : m.정렬 === '오' ? 'right' : 'center'
    const s = `<xf numFmtId="${nf}" fontId="${f}" fillId="${fl}" borderId="${b}" xfId="0" applyFont="1"${fl ? ' applyFill="1"' : ''}${b ? ' applyBorder="1"' : ''}${nf ? ' applyNumberFormat="1"' : ''} applyAlignment="1">`
      + `<alignment horizontal="${가로}" vertical="center"${m.줄바꿈 === false ? '' : ' wrapText="1"'}${m.들여 ? ` indent="${m.들여}"` : ''}/></xf>`
    xf.push(s)
    찾.set(k, xf.length - 1)
    return xf.length - 1
  }
  function xml() {
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
      + (수꼴.length ? `<numFmts count="${수꼴.length}">${수꼴.map((x) => `<numFmt numFmtId="${x.id}" formatCode="${싸기(x.code)}"/>`).join('')}</numFmts>` : '')
      + `<fonts count="${글꼴.length}">${글꼴.join('')}</fonts><fills count="${칠.length}">${칠.join('')}</fills>`
      + `<borders count="${선.length}">${선.join('')}</borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>`
      + `<cellXfs count="${xf.length}">${xf.join('')}</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`
  }
  return { 번호, xml }
}

/**
 * @param 시트들 [{ 이름, 열너비:[mm], 줄높이:{줄번호: mm}, 칸들:[{ r, c, 값 | 수식, 모양 }], 병합:[[r0,c0,r1,c1]],
 *                그림들:[{ 열쇠, c, r(붙일 칸), dx, dy(그 칸 왼쪽 위에서 mm), w, h(mm) }], 쪽나눔:[줄번호(이 줄 뒤에서 나눔)], 가로, 여백(mm), 고정줄 }]
 * @param 그림바이트 Map(열쇠 → { 바이트: JPEG })
 */
export function 엑셀책(시트들, 그림바이트 = new Map()) {
  const 모 = 모양장부()
  const 파일 = {}
  const 미디어 = new Map()
  let 그림수 = 0
  const 이름들 = []
  시트들.forEach((시, si) => {
    let 이름 = String(시.이름 || `시트${si + 1}`).replace(/[\\/?*[\]:]/g, ' ').slice(0, 31) || `시트${si + 1}`
    while (이름들.includes(이름)) 이름 = 이름.slice(0, 28) + ` ${si + 1}`
    이름들.push(이름)
    const 줄칸 = new Map()
    for (const k of 시.칸들 || []) {
      if (!줄칸.has(k.r)) 줄칸.set(k.r, [])
      줄칸.get(k.r).push(k)
    }
    const 줄번호들 = new Set([...줄칸.keys(), ...Object.keys(시.줄높이 || {}).map(Number)])
    const 줄xml = [...줄번호들].sort((a, b) => a - b).map((r) => {
      const hmm = 시.줄높이 && 시.줄높이[r]
      const 칸 = (줄칸.get(r) || []).sort((a, b) => a.c - b.c).map((k) => {
        const s = k.모양 ? 모.번호(k.모양) : 0
        const ref = 주소(r, k.c)
        const sa = s ? ` s="${s}"` : ''
        if (k.수식) return `<c r="${ref}"${sa}><f>${싸기(k.수식)}</f>${typeof k.값 === 'number' ? `<v>${k.값}</v>` : ''}</c>`
        if (k.값 === undefined || k.값 === null || k.값 === '') return `<c r="${ref}"${sa}/>`
        if (typeof k.값 === 'number' && Number.isFinite(k.값)) return `<c r="${ref}"${sa}><v>${k.값}</v></c>`
        return `<c r="${ref}"${sa} t="inlineStr"><is><t xml:space="preserve">${싸기(k.값)}</t></is></c>`
      }).join('')
      return `<row r="${r + 1}"${hmm ? ` ht="${(hmm * 72 / 25.4).toFixed(2)}" customHeight="1"` : ''}>${칸}</row>`
    }).join('')
    const 열 = (시.열너비 || []).map((mm, c) => `<col min="${c + 1}" max="${c + 1}" width="${너비값(mm)}" customWidth="1"/>`).join('')
    const 병합 = (시.병합 || []).filter(([r0, c0, r1, c1]) => r1 > r0 || c1 > c0)
    const 병합xml = 병합.length ? `<mergeCells count="${병합.length}">${병합.map(([r0, c0, r1, c1]) => `<mergeCell ref="${주소(r0, c0)}:${주소(r1, c1)}"/>`).join('')}</mergeCells>` : ''
    const 여 = (시.여백 ?? 10) / 25.4
    const 나눔 = (시.쪽나눔 || []).filter((r) => r >= 0)
    const 나눔xml = 나눔.length ? `<rowBreaks count="${나눔.length}" manualBreakCount="${나눔.length}">${나눔.map((r) => `<brk id="${r + 1}" max="16383" man="1"/>`).join('')}</rowBreaks>` : ''
    const 고정 = 시.고정줄 ? `<pane ySplit="${시.고정줄}" topLeftCell="A${시.고정줄 + 1}" activePane="bottomLeft" state="frozen"/>` : ''
    /* 그림 — 왼쪽 위 점이 든 칸 + 칸 안 거리(px)로 */
    let drawingXml = ''
    const 그림들 = (시.그림들 || []).filter((g) => 그림바이트.get(g.열쇠))
    if (그림들.length) {
      const 열px = (시.열너비 || []).map(실폭)
      const 줄px = (r) => ((시.줄높이 && 시.줄높이[r]) ? 시.줄높이[r] : 5.3) * 96 / 25.4
      /* 시작 칸(c · r)부터 엑셀이 실제로 그리는 폭으로 걸어가며 — 앞 칸들의 반올림이 쌓이지 않게 */
      const 찾기 = (시작, 값px, 폭함수, 끝) => {
        let i = 시작, 앞 = 0
        while (i < 끝 - 1 && 앞 + 폭함수(i) <= 값px) { 앞 += 폭함수(i); i++ }
        return [i, Math.max(0, 값px - 앞)]
      }
      const 줄끝 = Math.max(0, ...Object.keys(시.줄높이 || {}).map(Number)) + 1
      const 앵커 = 그림들.map((g, gi) => {
        let m = 미디어.get(g.열쇠)
        if (!m) { 그림수 += 1; m = { 이름: `image${그림수}.jpeg` }; 미디어.set(g.열쇠, m); 파일['xl/media/' + m.이름] = [그림바이트.get(g.열쇠).바이트, { level: 0 }] }
        const [c, dx] = 찾기(g.c || 0, px(g.dx), (i) => 열px[i] || 64, 열px.length)
        const [r, dy] = 찾기(g.r || 0, Math.round(px(g.dy)), (i) => Math.round(줄px(i)), 줄끝)
        return `<xdr:oneCellAnchor><xdr:from><xdr:col>${c}</xdr:col><xdr:colOff>${emu(dx)}</xdr:colOff><xdr:row>${r}</xdr:row><xdr:rowOff>${emu(dy)}</xdr:rowOff></xdr:from>`
          + `<xdr:ext cx="${emu(px(g.w))}" cy="${emu(px(g.h))}"/><xdr:pic><xdr:nvPicPr><xdr:cNvPr id="${gi + 2}" name="사진 ${gi + 1}"/><xdr:cNvPicPr><a:picLocks noChangeAspect="1"/></xdr:cNvPicPr></xdr:nvPicPr>`
          + `<xdr:blipFill><a:blip r:embed="rId${gi + 1}"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill>`
          + `<xdr:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${emu(px(g.w))}" cy="${emu(px(g.h))}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr></xdr:pic><xdr:clientData/></xdr:oneCellAnchor>`
      })
      파일[`xl/drawings/drawing${si + 1}.xml`] = strToU8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' + 앵커.join('') + '</xdr:wsDr>')
      파일[`xl/drawings/_rels/drawing${si + 1}.xml.rels`] = strToU8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        + 그림들.map((g, gi) => `<Relationship Id="rId${gi + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/${미디어.get(g.열쇠).이름}"/>`).join('') + '</Relationships>')
      파일[`xl/worksheets/_rels/sheet${si + 1}.xml.rels`] = strToU8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        + `<Relationship Id="rIdD" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing${si + 1}.xml"/></Relationships>`)
      drawingXml = '<drawing r:id="rIdD"/>'
    }
    파일[`xl/worksheets/sheet${si + 1}.xml`] = strToU8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
      + '<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>'
      + `<sheetViews><sheetView workbookViewId="0"${si === 0 ? ' tabSelected="1"' : ''}${시.격자숨김 ? ' showGridLines="0"' : ''}${시.보기 === '쪽' ? ' view="pageBreakPreview" zoomScaleNormal="100"' : ''}>${고정}</sheetView></sheetViews>`
      + '<sheetFormatPr defaultRowHeight="15"/>'
      + (열 ? `<cols>${열}</cols>` : '') + `<sheetData>${줄xml}</sheetData>${병합xml}`
      + '<printOptions horizontalCentered="1"/>'
      + `<pageMargins left="${여.toFixed(3)}" right="${여.toFixed(3)}" top="${여.toFixed(3)}" bottom="${여.toFixed(3)}" header="0" footer="0"/>`
      + `<pageSetup paperSize="9" orientation="${시.가로 ? 'landscape' : 'portrait'}" fitToWidth="1" fitToHeight="0"/>`
      + 나눔xml + drawingXml + '</worksheet>')
  })
  파일['xl/workbook.xml'] = strToU8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
    + `<sheets>${이름들.map((n, i) => `<sheet name="${싸기(n)}" sheetId="${i + 1}" r:id="rIdS${i + 1}"/>`).join('')}</sheets><calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>`)
  파일['xl/_rels/workbook.xml.rels'] = strToU8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    + 이름들.map((n, i) => `<Relationship Id="rIdS${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')
    + '<Relationship Id="rIdSt" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>')
  파일['xl/styles.xml'] = strToU8(모.xml())
  파일['_rels/.rels'] = strToU8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>')
  const 그림시트 = 시트들.map((시, i) => ((시.그림들 || []).some((g) => 그림바이트.get(g.열쇠)) ? i : -1)).filter((i) => i >= 0)
  const ct = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
    + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="jpeg" ContentType="image/jpeg"/>'
    + '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
    + '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
    + 이름들.map((n, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')
    + 그림시트.map((i) => `<Override PartName="/xl/drawings/drawing${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>`).join('')
    + '</Types>'
  return zipSync({ '[Content_Types].xml': strToU8(ct), ...파일 })
}

/**
 * 쪽 모형들 → 시트 하나(쪽마다 쪽 나눔) · 사진은 칸 가운데
 */
export function 쪽들시트(쪽들, 그림들, 이름 = '인쇄용') {
  if (!쪽들.length) return { 이름, 칸들: [], 열너비: [] }
  const xs = 공통가로(쪽들)
  const 열너비 = xs.slice(1).map((x, i) => x - xs[i])
  const 칸들 = [], 병합 = [], 줄높이 = {}, 그림놓기 = [], 쪽나눔 = []
  let 줄0 = 0
  for (const 쪽 of 쪽들) {
    const g = 격자로(쪽, 0.6, xs)
    g.줄.forEach((h, r) => { 줄높이[줄0 + r] = h })
    for (const p of g.칸) {
      const k = p.칸
      if (!k) continue
      const r0 = 줄0 + p.r, c0 = p.c, r1 = r0 + p.rs - 1, c1 = c0 + p.cs - 1
      const 칸w = g.열.slice(p.c, p.c + p.cs).reduce((a, b) => a + b, 0)
      const 칸h = g.줄.slice(p.r, p.r + p.rs).reduce((a, b) => a + b, 0)
      const 모양 = { 테: k.테 ? 1 : 0, 굵은테: k.굵은테 ? 1 : 0, 바탕: k.바탕 || '', 정렬: k.정렬 || '가', 굵게: !!k.굵게, 색: k.색 || '' }
      let 값 = ''
      if (k.글) {
        const m = 글맞춤(k.글, 칸w, 칸h, k.크기 || 9, !!k.굵게)
        값 = m.줄들.join('\n')
        모양.크기 = m.크기
      }
      if (typeof k.수 === 'number') { 값 = k.수; 모양.형식 = k.형식 || '#,##0'; 모양.크기 = 모양.크기 || k.크기 || 9 }
      칸들.push({ r: r0, c: c0, 값, 모양 })
      /* 병합 칸의 나머지 자리에도 같은 테두리(엑셀은 병합해도 칸마다 선을 봄) */
      for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) if (r !== r0 || c !== c0) 칸들.push({ r, c, 값: '', 모양 })
      if (r1 > r0 || c1 > c0) 병합.push([r0, c0, r1, c1])
      if (k.그림 && 그림들.get(k.그림)) {
        const gg = 그림들.get(k.그림)
        const s = 그림맞춤(gg.w, gg.h, 칸w, 칸h, (k.그림여백 ?? 1.2) + 0.5)
        그림놓기.push({ 열쇠: k.그림, c: c0, r: r0, dx: (칸w - s.w) / 2, dy: (칸h - s.h) / 2, w: s.w, h: s.h })
      }
    }
    줄0 += g.줄.length
    쪽나눔.push(줄0 - 1)
  }
  쪽나눔.pop()
  const 가로 = 쪽들[0].폭 > 쪽들[0].높이
  return { 이름, 칸들, 병합, 열너비, 줄높이, 그림들: 그림놓기, 쪽나눔, 가로, 여백: Math.max(5, 쪽들[0].안.x - 2), 격자숨김: true }
}
