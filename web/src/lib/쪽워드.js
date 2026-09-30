/**
 * 📘 쪽 모형 → 워드(.docx) (2026-09-30, 사진대지 · 영수증 정리) — 쪽문서.js 머리말
 *   한 쪽 = 표 하나(칸 경계로 지은 격자 · 병합). 줄 높이는 «정확히» 로 박아 쪽이 밀리지 않게 합니다.
 *   사진은 칸 안에 비율대로(글자처럼 놓임). 글은 쪽문서.글맞춤 이 정한 크기 · 줄 그대로.
 */
import { zipSync, strToU8 } from 'fflate'
import { 격자로, 글맞춤, 그림맞춤, 싸기 } from './쪽문서.js'

const tw = (mm) => Math.round((mm * 1440) / 25.4)          // twip
const emu = (mm) => Math.round(mm * 36000)
const 글꼴 = '맑은 고딕'

function 글문단(k, m) {
  const jc = k.정렬 === '왼' ? 'left' : k.정렬 === '오' ? 'right' : 'center'
  const sz = Math.round((m ? m.크기 : 9) * 2)
  const rPr = `<w:rPr><w:rFonts w:ascii="${글꼴}" w:eastAsia="${글꼴}" w:hAnsi="${글꼴}"/>${k.굵게 ? '<w:b/>' : ''}`
    + `${k.색 ? `<w:color w:val="${k.색.slice(1)}"/>` : ''}<w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/></w:rPr>`
  const 줄들 = m ? m.줄들 : []
  const runs = 줄들.map((줄, i) => `${i ? `<w:r>${rPr}<w:br/></w:r>` : ''}<w:r>${rPr}<w:t xml:space="preserve">${싸기(줄)}</w:t></w:r>`).join('')
  return `<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="${Math.round(sz * 10 * 1.2)}" w:lineRule="exact"/><w:jc w:val="${jc}"/></w:pPr>${runs}</w:p>`
}

function 그림문단(rid, id, s) {
  return '<w:p><w:pPr><w:spacing w:before="0" w:after="0"/><w:jc w:val="center"/></w:pPr><w:r><w:drawing>'
    + `<wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${emu(s.w)}" cy="${emu(s.h)}"/>`
    + `<wp:docPr id="${id}" name="사진 ${id}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr>`
    + '<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic>'
    + `<pic:nvPicPr><pic:cNvPr id="${id}" name="image${id}.jpeg"/><pic:cNvPicPr/></pic:nvPicPr>`
    + `<pic:blipFill><a:blip r:embed="${rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>`
    + `<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${emu(s.w)}" cy="${emu(s.h)}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>`
    + '</pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>'
}

const 선 = (있음) => (있음
  ? '<w:top w:val="single" w:sz="4" w:space="0" w:color="333333"/><w:left w:val="single" w:sz="4" w:space="0" w:color="333333"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="333333"/><w:right w:val="single" w:sz="4" w:space="0" w:color="333333"/>'
  : '<w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/>')

/**
 * @param 쪽들 [{ 폭, 높이, 안, 칸들 }] — 모든 쪽이 같은 용지(세로/가로)
 * @param 그림들 Map(열쇠 → { 바이트: JPEG, w, h })
 */
export function 쪽들워드(쪽들, 그림들, { 제목 = '' } = {}) {
  const 미디어 = new Map()        // 열쇠 → { rid, 이름 }
  const 파일 = {}
  let 그림번 = 0
  let 개체번 = 0
  const 몸 = []
  쪽들.forEach((쪽, pi) => {
    const g = 격자로(쪽)
    const 칸자리 = new Map(g.칸.map((p) => [p.r + ',' + p.c, p]))
    const 덮임 = Array.from({ length: g.줄.length }, () => new Array(g.열.length).fill(null))
    for (const p of g.칸) for (let r = p.r; r < p.r + p.rs; r++) for (let c = p.c; c < p.c + p.cs; c++) 덮임[r][c] = p
    if (pi > 0) 몸.push('<w:p><w:pPr><w:pageBreakBefore/><w:spacing w:before="0" w:after="0" w:line="20" w:lineRule="exact"/></w:pPr><w:r><w:rPr><w:sz w:val="2"/></w:rPr><w:t></w:t></w:r></w:p>')
    const 너비합 = g.열.reduce((a, b) => a + tw(b), 0)
    const t = [`<w:tbl><w:tblPr><w:tblW w:w="${너비합}" w:type="dxa"/><w:tblLayout w:type="fixed"/>`
      + '<w:tblBorders><w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/><w:insideH w:val="nil"/><w:insideV w:val="nil"/></w:tblBorders>'
      + '<w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:left w:w="28" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="28" w:type="dxa"/></w:tblCellMar>'
      + '<w:tblLook w:val="0000" w:firstRow="0" w:lastRow="0" w:firstColumn="0" w:lastColumn="0" w:noHBand="1" w:noVBand="1"/></w:tblPr><w:tblGrid>']
    for (const w of g.열) t.push(`<w:gridCol w:w="${tw(w)}"/>`)
    t.push('</w:tblGrid>')
    for (let r = 0; r < g.줄.length; r++) {
      t.push(`<w:tr><w:trPr><w:cantSplit/><w:trHeight w:val="${tw(g.줄[r])}" w:hRule="exact"/></w:trPr>`)
      let c = 0
      while (c < g.열.length) {
        const p = 덮임[r][c]
        const 시작 = 칸자리.get(r + ',' + c) === p
        const cs = p.cs
        const w = g.열.slice(p.c, p.c + cs).reduce((a, b) => a + tw(b), 0)
        const k = p.칸
        const vm = p.rs > 1 ? (시작 ? '<w:vMerge w:val="restart"/>' : '<w:vMerge/>') : ''
        const shd = k && k.바탕 ? `<w:shd w:val="clear" w:color="auto" w:fill="${k.바탕.slice(1)}"/>` : ''
        const tcPr = `<w:tcPr><w:tcW w:w="${w}" w:type="dxa"/>${cs > 1 ? `<w:gridSpan w:val="${cs}"/>` : ''}${vm}`
          + `<w:tcBorders>${선(k && k.테)}</w:tcBorders>${shd}<w:vAlign w:val="center"/></w:tcPr>`
        let 속 = '<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="20" w:lineRule="exact"/></w:pPr></w:p>'
        if (k && 시작 && p.r === r) {
          const 칸w = g.열.slice(p.c, p.c + cs).reduce((a, b) => a + b, 0)
          const 칸h = g.줄.slice(p.r, p.r + p.rs).reduce((a, b) => a + b, 0)
          if (k.그림 && 그림들.get(k.그림)) {
            const gg = 그림들.get(k.그림)
            let m = 미디어.get(k.그림)
            if (!m) {
              그림번 += 1
              m = { rid: 'rIdImg' + 그림번, 이름: `image${그림번}.jpeg` }
              미디어.set(k.그림, m)
              파일['word/media/' + m.이름] = gg.바이트
            }
            개체번 += 1
            속 = 그림문단(m.rid, 개체번, 그림맞춤(gg.w, gg.h, 칸w, 칸h, (k.그림여백 ?? 1.2) + 0.4))
          } else if (k.글) {
            속 = 글문단(k, 글맞춤(k.글, 칸w, 칸h, k.크기 || 9, !!k.굵게))
          }
        }
        t.push(`<w:tc>${tcPr}${속}</w:tc>`)
        c += cs
      }
      t.push('</w:tr>')
    }
    t.push('</w:tbl>')
    몸.push(t.join(''))
  })
  const 쪽0 = 쪽들[0] || { 폭: 210, 높이: 297, 안: { x: 12, y: 12, w: 186, h: 273 } }
  const 가로 = 쪽0.폭 > 쪽0.높이
  const 여 = 쪽0.안
  const sect = `<w:sectPr><w:pgSz w:w="${tw(쪽0.폭)}" w:h="${tw(쪽0.높이)}"${가로 ? ' w:orient="landscape"' : ''}/>`
    + `<w:pgMar w:top="${tw(여.y)}" w:right="${tw(쪽0.폭 - 여.x - 여.w)}" w:bottom="${tw(Math.max(3, 쪽0.높이 - 여.y - 여.h - 2))}" w:left="${tw(여.x)}" w:header="0" w:footer="0" w:gutter="0"/></w:sectPr>`
  const 끝문단 = '<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="20" w:lineRule="exact"/><w:rPr><w:sz w:val="2"/></w:rPr></w:pPr></w:p>'
  const ns = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
    + 'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '
    + 'xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"'
  파일['word/document.xml'] = strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${ns}><w:body>${몸.join('')}${끝문단}${sect}</w:body></w:document>`)
  const rels = [...미디어.values()].map((m) => `<Relationship Id="${m.rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${m.이름}"/>`).join('')
  파일['word/_rels/document.xml.rels'] = strToU8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    + '<Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
    + '<Relationship Id="rIdSettings" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>'
    + rels + '</Relationships>')
  파일['word/styles.xml'] = strToU8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
    + `<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="${글꼴}" w:eastAsia="${글꼴}" w:hAnsi="${글꼴}" w:cs="${글꼴}"/><w:sz w:val="18"/><w:szCs w:val="18"/><w:lang w:val="ko-KR" w:eastAsia="ko-KR"/></w:rPr></w:rPrDefault>`
    + '<w:pPrDefault><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>'
    + '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>'
    + '<w:style w:type="table" w:default="1" w:styleId="TableNormal"><w:name w:val="Normal Table"/><w:tblPr><w:tblInd w:w="0" w:type="dxa"/><w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:left w:w="108" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="108" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style>'
    + '</w:styles>')
  파일['word/settings.xml'] = strToU8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
    + '<w:defaultTabStop w:val="800"/><w:compat><w:compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="15"/></w:compat></w:settings>')
  파일['docProps/core.xml'] = strToU8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
    + `<dc:title>${싸기(제목)}</dc:title><dc:creator>K-건설맵</dc:creator></cp:coreProperties>`)
  파일['_rels/.rels'] = strToU8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>'
    + '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>')
  파일['[Content_Types].xml'] = strToU8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
    + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>'
    + '<Default Extension="jpeg" ContentType="image/jpeg"/>'
    + '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
    + '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>'
    + '<Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>'
    + '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>')
  /* [Content_Types].xml 을 맨 앞에 */
  const 차례 = {}
  차례['[Content_Types].xml'] = 파일['[Content_Types].xml']
  for (const [k, v] of Object.entries(파일)) if (k !== '[Content_Types].xml') 차례[k] = [v, { level: k.startsWith('word/media/') ? 0 : 6 }]
  차례['[Content_Types].xml'] = [파일['[Content_Types].xml'], { level: 6 }]
  return zipSync(차례)
}
