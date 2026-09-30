/**
 * 📗 쪽 모형 → 한글(.hwpx) (2026-09-30, 사진대지 · 영수증 정리) — 쪽문서.js 머리말
 *
 * ■ HWPX = zip(OWPML). 한글이 저장한 실제 파일(시공계획서 .hwpx) · 공개 규격을 보고 «꼭 필요한 것만» 직접 씁니다.
 *   mimetype(맨 앞 · 압축 안 함) · version.xml · META-INF/container.xml · Contents/content.hpf(목록 — 사진은 isEmbeded="1")
 *   · Contents/header.xml(글꼴 · 테두리/바탕 · 글자 모양 · 문단 모양 · 스타일) · Contents/section0.xml(본문) · BinData/imageN.jpg
 * ■ 한 쪽 = 글자처럼 놓인 표 하나(칸 경계로 지은 격자 · 병합). 둘째 쪽부터 문단에 pageBreak="1".
 *   사진은 칸 안 문단에 글자처럼(hp:pic · treatAsChar) — 크기는 칸에 비율대로.
 *   줄 높이 캐시(linesegarray)는 넣지 않습니다 — 한글이 열 때 다시 셉니다.
 * ■ 단위: HWPUNIT = 1/7200 인치 → 1mm = 283.465
 */
import { zipSync, strToU8 } from 'fflate'
import { 격자로, 글맞춤, 그림맞춤, 싸기 } from './쪽문서.js'

const hu = (mm) => Math.round((mm * 7200) / 25.4)
const 글꼴 = '맑은 고딕'
const NS = 'xmlns:ha="http://www.hancom.co.kr/hwpml/2011/app" xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph" '
  + 'xmlns:hp10="http://www.hancom.co.kr/hwpml/2016/paragraph" xmlns:hs="http://www.hancom.co.kr/hwpml/2011/section" '
  + 'xmlns:hc="http://www.hancom.co.kr/hwpml/2011/core" xmlns:hh="http://www.hancom.co.kr/hwpml/2011/head" '
  + 'xmlns:hhs="http://www.hancom.co.kr/hwpml/2011/history" xmlns:hm="http://www.hancom.co.kr/hwpml/2011/master-page" '
  + 'xmlns:hpf="http://www.hancom.co.kr/schema/2011/hpf" xmlns:dc="http://purl.org/dc/elements/1.1/" '
  + 'xmlns:opf="http://www.idpf.org/2007/opf/" xmlns:ooxmlchart="http://www.hancom.co.kr/hwpml/2016/ooxmlchart" '
  + 'xmlns:hwpunitchar="http://www.hancom.co.kr/hwpml/2016/HwpUnitChar" xmlns:epub="http://www.idpf.org/2007/ops" '
  + 'xmlns:config="urn:oasis:names:tc:opendocument:xmlns:config:1.0"'
const XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>'

/* ── 머리(header.xml) 조각 ── */
const 일곱 = ['HANGUL', 'LATIN', 'HANJA', 'JAPANESE', 'OTHER', 'SYMBOL', 'USER']
function 글꼴들() {
  const f = `<hh:font id="0" face="${글꼴}" type="TTF" isEmbedded="0"><hh:typeInfo familyType="FCAT_GOTHIC" weight="6" proportion="4" contrast="0" strokeVariation="1" armStyle="1" letterform="1" midline="1" xHeight="1"/></hh:font>`
  return `<hh:fontfaces itemCnt="7">${일곱.map((l) => `<hh:fontface lang="${l}" fontCnt="1">${f}</hh:fontface>`).join('')}</hh:fontfaces>`
}
function 테바탕(id, 선있음, 바탕) {
  const 변 = (n) => `<hh:${n} type="${선있음 ? 'SOLID' : 'NONE'}" width="0.12 mm" color="#333333"/>`
  const 칠 = 바탕 ? `<hc:fillBrush><hc:winBrush faceColor="${바탕}" hatchColor="#000000" alpha="0"/></hc:fillBrush>` : ''
  return `<hh:borderFill id="${id}" threeD="0" shadow="0" centerLine="NONE" breakCellSeparateLine="0">`
    + '<hh:slash type="NONE" Crooked="0" isCounter="0"/><hh:backSlash type="NONE" Crooked="0" isCounter="0"/>'
    + `${변('leftBorder')}${변('rightBorder')}${변('topBorder')}${변('bottomBorder')}<hh:diagonal type="SOLID" width="0.1 mm" color="#000000"/>${칠}</hh:borderFill>`
}
function 글모양(id, 크기, 굵게, 색) {
  const 일곱값 = (v) => 일곱.map((l) => `${l.toLowerCase()}="${v}"`).join(' ')
  return `<hh:charPr id="${id}" height="${Math.round(크기 * 100)}" textColor="${색 || '#000000'}" shadeColor="none" useFontSpace="0" useKerning="0" symMark="NONE" borderFillIDRef="2">`
    + `<hh:fontRef ${일곱값(0)}/><hh:ratio ${일곱값(100)}/><hh:spacing ${일곱값(0)}/><hh:relSz ${일곱값(100)}/><hh:offset ${일곱값(0)}/>`
    + `${굵게 ? '<hh:bold/>' : ''}<hh:underline type="NONE" shape="SOLID" color="#000000"/><hh:strikeout shape="NONE" color="#000000"/>`
    + '<hh:outline type="NONE"/><hh:shadow type="NONE" color="#C0C0C0" offsetX="10" offsetY="10"/></hh:charPr>'
}
function 문단모양(id, 정렬, 줄간) {
  const 여백 = '<hh:margin><hc:intent value="0" unit="HWPUNIT"/><hc:left value="0" unit="HWPUNIT"/><hc:right value="0" unit="HWPUNIT"/><hc:prev value="0" unit="HWPUNIT"/><hc:next value="0" unit="HWPUNIT"/></hh:margin>'
    + `<hh:lineSpacing type="PERCENT" value="${줄간}" unit="HWPUNIT"/>`
  return `<hh:paraPr id="${id}" tabPrIDRef="0" condense="0" fontLineHeight="0" snapToGrid="0" suppressLineNumbers="0" checked="0">`
    + `<hh:align horizontal="${정렬}" vertical="BASELINE"/><hh:heading type="NONE" idRef="0" level="0"/>`
    + '<hh:breakSetting breakLatinWord="KEEP_WORD" breakNonLatinWord="BREAK_WORD" widowOrphan="0" keepWithNext="0" keepLines="0" pageBreakBefore="0" lineWrap="BREAK"/>'
    + '<hh:autoSpacing eAsianEng="0" eAsianNum="0"/>'
    + `<hp:switch><hp:case hp:required-namespace="http://www.hancom.co.kr/hwpml/2016/HwpUnitChar">${여백}</hp:case><hp:default>${여백}</hp:default></hp:switch>`
    + '<hh:border borderFillIDRef="2" offsetLeft="0" offsetRight="0" offsetTop="0" offsetBottom="0" connect="0" ignoreMargin="0"/></hh:paraPr>'
}
/* 문단 모양: 0 바탕(양쪽 160%) · 1 가운데 · 2 왼쪽 · 3 오른쪽(칸 글 120%) · 4 표 놓는 문단(가운데 100%) */
const 문단 = { 가: 1, 왼: 2, 오: 3 }

/**
 * @param 쪽들 [{ 폭, 높이, 안, 칸들 }] — 모든 쪽이 같은 용지
 * @param 그림들 Map(열쇠 → { 바이트: JPEG, w, h })
 */
export function 쪽들한글(쪽들, 그림들, { 제목 = '' } = {}) {
  /* 테두리/바탕 · 글자 모양 — 쓰는 것만 번호를 줍니다 */
  const 테표 = new Map([['0|', 1]])            // 1 = 선 없음(쪽 테두리 · 빈 칸)
  const 테번 = (선, 바탕) => {
    const k = `${선 ? 1 : 0}|${바탕 || ''}`
    if (!테표.has(k)) 테표.set(k, 테표.size + 2)   // 2 는 글자 모양용(선 없음 · 칠 없음)
    return 테표.get(k)
  }
  const 글표 = new Map([['10|0|#000000', 0]])
  const 글번 = (크기, 굵게, 색) => {
    const k = `${Math.round(크기 * 2) / 2}|${굵게 ? 1 : 0}|${색 || '#000000'}`
    if (!글표.has(k)) 글표.set(k, 글표.size)
    return 글표.get(k)
  }
  const 사진목록 = new Map()               // 열쇠 → { id, 경로 }
  let 개체 = 1000
  let 문단번 = 0
  const 쪽0 = 쪽들[0] || { 폭: 210, 높이: 297, 안: { x: 12, y: 12, w: 186, h: 273 } }
  const 가로 = 쪽0.폭 > 쪽0.높이

  const 본문 = []
  쪽들.forEach((쪽, pi) => {
    const g = 격자로(쪽)
    const 너비 = g.열.map(hu), 높이 = g.줄.map(hu)
    const 합w = 너비.reduce((a, b) => a + b, 0), 합h = 높이.reduce((a, b) => a + b, 0)
    const 줄들 = Array.from({ length: g.줄.length }, () => [])
    for (const p of g.칸) 줄들[p.r].push(p)
    const trs = 줄들.map((ps) => '<hp:tr>' + ps.map((p) => {
      const k = p.칸
      const w = 너비.slice(p.c, p.c + p.cs).reduce((a, b) => a + b, 0)
      const h = 높이.slice(p.r, p.r + p.rs).reduce((a, b) => a + b, 0)
      const 칸w = g.열.slice(p.c, p.c + p.cs).reduce((a, b) => a + b, 0)
      const 칸h = g.줄.slice(p.r, p.r + p.rs).reduce((a, b) => a + b, 0)
      let 속 = `<hp:p id="${문단번++}" paraPrIDRef="1" styleIDRef="0" pageBreak="0" columnBreak="0" merged="0"><hp:run charPrIDRef="${글번(1, false)}"><hp:t/></hp:run></hp:p>`
      if (k && k.그림 && 그림들.get(k.그림)) {
        const gg = 그림들.get(k.그림)
        let s = 사진목록.get(k.그림)
        if (!s) { s = { id: `image${사진목록.size + 1}` }; s.경로 = `BinData/${s.id}.jpg`; 사진목록.set(k.그림, s) }
        const 맞 = 그림맞춤(gg.w, gg.h, 칸w, 칸h, (k.그림여백 ?? 1.2) + 0.6)
        const pw = hu(맞.w), ph = hu(맞.h)
        개체 += 1
        const 행렬 = 'e1="1" e2="0" e3="0" e4="0" e5="1" e6="0"'
        const pic = `<hp:pic id="${개체}" zOrder="${개체 - 1000}" numberingType="PICTURE" textWrap="TOP_AND_BOTTOM" textFlow="BOTH_SIDES" lock="0" dropcapstyle="None" href="" groupLevel="0" instid="${개체 + 500000}" reverse="0">`
          + `<hp:offset x="0" y="0"/><hp:orgSz width="${pw}" height="${ph}"/><hp:curSz width="${pw}" height="${ph}"/><hp:flip horizontal="0" vertical="0"/>`
          + `<hp:rotationInfo angle="0" centerX="${Math.round(pw / 2)}" centerY="${Math.round(ph / 2)}" rotateimage="1"/>`
          + `<hp:renderingInfo><hc:transMatrix ${행렬}/><hc:scaMatrix ${행렬}/><hc:rotMatrix ${행렬}/></hp:renderingInfo>`
          + `<hp:imgRect><hc:pt0 x="0" y="0"/><hc:pt1 x="${pw}" y="0"/><hc:pt2 x="${pw}" y="${ph}"/><hc:pt3 x="0" y="${ph}"/></hp:imgRect>`
          + `<hp:imgClip left="0" right="${pw}" top="0" bottom="${ph}"/><hp:inMargin left="0" right="0" top="0" bottom="0"/>`
          + `<hp:imgDim dimwidth="${pw}" dimheight="${ph}"/><hc:img binaryItemIDRef="${s.id}" bright="0" contrast="0" effect="REAL_PIC" alpha="0"/><hp:effects/>`
          + `<hp:sz width="${pw}" widthRelTo="ABSOLUTE" height="${ph}" heightRelTo="ABSOLUTE" protect="0"/>`
          + '<hp:pos treatAsChar="1" affectLSpacing="0" flowWithText="1" allowOverlap="0" holdAnchorAndSO="0" vertRelTo="PARA" horzRelTo="PARA" vertAlign="TOP" horzAlign="LEFT" vertOffset="0" horzOffset="0"/>'
          + '<hp:outMargin left="0" right="0" top="0" bottom="0"/><hp:shapeComment/></hp:pic>'
        속 = `<hp:p id="${문단번++}" paraPrIDRef="1" styleIDRef="0" pageBreak="0" columnBreak="0" merged="0"><hp:run charPrIDRef="${글번(9, false)}">${pic}<hp:t/></hp:run></hp:p>`
      } else if (k && k.글) {
        const m = 글맞춤(k.글, 칸w, 칸h, k.크기 || 9, !!k.굵게)
        const cp = 글번(m.크기, !!k.굵게, k.색)
        const pp = 문단[k.정렬 || '가'] || 1
        속 = (m.줄들.length ? m.줄들 : ['']).map((줄) => `<hp:p id="${문단번++}" paraPrIDRef="${pp}" styleIDRef="0" pageBreak="0" columnBreak="0" merged="0"><hp:run charPrIDRef="${cp}">${줄 ? `<hp:t>${싸기(줄)}</hp:t>` : '<hp:t/>'}</hp:run></hp:p>`).join('')
      }
      const bf = 테번(k && k.테, k && k.바탕)
      return `<hp:tc name="" header="0" hasMargin="1" protect="0" editable="0" dirty="0" borderFillIDRef="${bf}">`
        + '<hp:subList id="" textDirection="HORIZONTAL" lineWrap="BREAK" vertAlign="CENTER" linkListIDRef="0" linkListNextIDRef="0" textWidth="0" textHeight="0" hasTextRef="0" hasNumRef="0">'
        + `${속}</hp:subList><hp:cellAddr colAddr="${p.c}" rowAddr="${p.r}"/><hp:cellSpan colSpan="${p.cs}" rowSpan="${p.rs}"/>`
        + `<hp:cellSz width="${w}" height="${h}"/><hp:cellMargin left="85" right="85" top="0" bottom="0"/></hp:tc>`
    }).join('') + '</hp:tr>')
    개체 += 1
    const tbl = `<hp:tbl id="${개체}" zOrder="${개체 - 1000}" numberingType="TABLE" textWrap="TOP_AND_BOTTOM" textFlow="BOTH_SIDES" lock="0" dropcapstyle="None" pageBreak="CELL" repeatHeader="0" rowCnt="${g.줄.length}" colCnt="${g.열.length}" cellSpacing="0" borderFillIDRef="1" noAdjust="0">`
      + `<hp:sz width="${합w}" widthRelTo="ABSOLUTE" height="${합h}" heightRelTo="ABSOLUTE" protect="0"/>`
      + '<hp:pos treatAsChar="1" affectLSpacing="0" flowWithText="1" allowOverlap="0" holdAnchorAndSO="0" vertRelTo="PARA" horzRelTo="COLUMN" vertAlign="TOP" horzAlign="LEFT" vertOffset="0" horzOffset="0"/>'
      + '<hp:outMargin left="0" right="0" top="0" bottom="0"/><hp:inMargin left="85" right="85" top="0" bottom="0"/>'
      + trs.join('') + '</hp:tbl>'
    본문.push({ tbl, 첫: pi === 0 })
  })

  const 안 = 쪽0.안
  const 위 = hu(안.y), 왼 = hu(안.x), 오 = hu(쪽0.폭 - 안.x - 안.w), 아래 = hu(Math.max(3, 쪽0.높이 - 안.y - 안.h - 2))
  /* 한글은 가로 쪽도 «세로 크기 + NARROWLY» 로 적습니다 */
  const 용지w = hu(Math.min(쪽0.폭, 쪽0.높이)), 용지h = hu(Math.max(쪽0.폭, 쪽0.높이))
  const secPr = '<hp:secPr id="" textDirection="HORIZONTAL" spaceColumns="1134" tabStop="8000" tabStopVal="4000" tabStopUnit="HWPUNIT" outlineShapeIDRef="0" memoShapeIDRef="0" textVerticalWidthHead="0" masterPageCnt="0">'
    + '<hp:grid lineGrid="0" charGrid="0" wonggojiFormat="0"/><hp:startNum pageStartsOn="BOTH" page="0" pic="0" tbl="0" equation="0"/>'
    + '<hp:visibility hideFirstHeader="0" hideFirstFooter="0" hideFirstMasterPage="0" border="SHOW_ALL" fill="SHOW_ALL" hideFirstPageNum="0" hideFirstEmptyLine="0" showLineNumber="0"/>'
    + '<hp:lineNumberShape restartType="0" countBy="0" distance="0" startNumber="0"/>'
    + `<hp:pagePr landscape="${가로 ? 'NARROWLY' : 'WIDELY'}" width="${용지w}" height="${용지h}" gutterType="LEFT_ONLY">`
    + `<hp:margin header="0" footer="0" gutter="0" left="${왼}" right="${오}" top="${위}" bottom="${아래}"/></hp:pagePr>`
    + '<hp:footNotePr><hp:autoNumFormat type="DIGIT" userChar="" prefixChar="" suffixChar=")" supscript="0"/><hp:noteLine length="-1" type="SOLID" width="0.12 mm" color="#000000"/><hp:noteSpacing betweenNotes="283" belowLine="567" aboveLine="850"/><hp:numbering type="CONTINUOUS" newNum="1"/><hp:placement place="EACH_COLUMN" beneathText="0"/></hp:footNotePr>'
    + '<hp:endNotePr><hp:autoNumFormat type="DIGIT" userChar="" prefixChar="" suffixChar=")" supscript="0"/><hp:noteLine length="14692344" type="SOLID" width="0.12 mm" color="#000000"/><hp:noteSpacing betweenNotes="0" belowLine="567" aboveLine="850"/><hp:numbering type="CONTINUOUS" newNum="1"/><hp:placement place="END_OF_DOCUMENT" beneathText="0"/></hp:endNotePr>'
    + ['BOTH', 'EVEN', 'ODD'].map((t) => `<hp:pageBorderFill type="${t}" borderFillIDRef="1" textBorder="PAPER" headerInside="0" footerInside="0" fillArea="PAPER"><hp:offset left="1417" right="1417" top="1417" bottom="1417"/></hp:pageBorderFill>`).join('')
    + '</hp:secPr>'
  const 몸 = 본문.map(({ tbl, 첫 }) => `<hp:p id="${문단번++}" paraPrIDRef="4" styleIDRef="0" pageBreak="${첫 ? 0 : 1}" columnBreak="0" merged="0">`
    + (첫 ? `<hp:run charPrIDRef="0">${secPr}<hp:ctrl><hp:colPr id="" type="NEWSPAPER" layout="LEFT" colCount="1" sameSz="1" sameGap="0"/></hp:ctrl></hp:run>` : '')
    + `<hp:run charPrIDRef="0">${tbl}<hp:t/></hp:run></hp:p>`).join('')
  const 빈첫 = 본문.length ? '' : `<hp:p id="0" paraPrIDRef="0" styleIDRef="0" pageBreak="0" columnBreak="0" merged="0"><hp:run charPrIDRef="0">${secPr}</hp:run><hp:run charPrIDRef="0"><hp:t/></hp:run></hp:p>`
  const section = `${XML}<hs:sec ${NS}>${빈첫}${몸}</hs:sec>`

  /* 머리 — 본문을 다 지은 뒤(쓴 모양만) */
  테번(true, '')
  const 테들 = [테바탕(1, false, ''), 테바탕(2, false, 'none')]
  for (const [k, id] of 테표) { if (id <= 2) continue; const [선, 바탕] = k.split('|'); 테들.push(테바탕(id, 선 === '1', 바탕)) }
  const 글들 = [...글표].map(([k, id]) => { const [크기, 굵, 색] = k.split('|'); return 글모양(id, +크기, 굵 === '1', 색) })
  const header = `${XML}<hh:head ${NS} version="1.5" secCnt="1"><hh:beginNum page="1" footnote="1" endnote="1" pic="1" tbl="1" equation="1"/><hh:refList>`
    + 글꼴들()
    + `<hh:borderFills itemCnt="${테들.length}">${테들.join('')}</hh:borderFills>`
    + `<hh:charProperties itemCnt="${글들.length}">${글들.join('')}</hh:charProperties>`
    + '<hh:tabProperties itemCnt="1"><hh:tabPr id="0" autoTabLeft="0" autoTabRight="0"/></hh:tabProperties>'
    + `<hh:paraProperties itemCnt="5">${문단모양(0, 'JUSTIFY', 160)}${문단모양(1, 'CENTER', 120)}${문단모양(2, 'LEFT', 120)}${문단모양(3, 'RIGHT', 120)}${문단모양(4, 'CENTER', 100)}</hh:paraProperties>`
    + '<hh:styles itemCnt="1"><hh:style id="0" type="PARA" name="바탕글" engName="Normal" paraPrIDRef="0" charPrIDRef="0" nextStyleIDRef="0" langID="1042" lockForm="0"/></hh:styles>'
    + '</hh:refList><hh:compatibleDocument targetProgram="HWP201X"><hh:layoutCompatibility/></hh:compatibleDocument>'
    + '<hh:docOption><hh:linkinfo path="" pageInherit="0" footnoteInherit="0"/></hh:docOption><hh:trackchageConfig flags="56"/></hh:head>'

  const 지금 = new Date().toISOString().replace(/\.\d+Z$/, 'Z')
  const 사진항목 = [...사진목록.values()].map((s) => `<opf:item id="${s.id}" href="${s.경로}" media-type="image/jpg" isEmbeded="1"/>`).join('')
  const hpf = `${XML}<opf:package ${NS} version="" unique-identifier="" id=""><opf:metadata><opf:title>${싸기(제목)}</opf:title><opf:language>ko</opf:language>`
    + '<opf:meta name="creator" content="text">K-건설맵</opf:meta><opf:meta name="subject" content="text"/><opf:meta name="description" content="text"/>'
    + `<opf:meta name="lastsaveby" content="text">K-건설맵</opf:meta><opf:meta name="CreatedDate" content="text">${지금}</opf:meta><opf:meta name="ModifiedDate" content="text">${지금}</opf:meta>`
    + '<opf:meta name="keyword" content="text"/></opf:metadata><opf:manifest>'
    + '<opf:item id="header" href="Contents/header.xml" media-type="application/xml"/><opf:item id="section0" href="Contents/section0.xml" media-type="application/xml"/>'
    + `<opf:item id="settings" href="settings.xml" media-type="application/xml"/>${사진항목}</opf:manifest>`
    + '<opf:spine><opf:itemref idref="header" linear="yes"/><opf:itemref idref="section0" linear="yes"/></opf:spine></opf:package>'

  const 미리글 = 쪽들.flatMap((쪽) => 쪽.칸들.filter((k) => k.글).map((k) => k.글.replace(/\n/g, ' '))).join(' ').slice(0, 1000)
  const 파일 = {
    mimetype: [strToU8('application/hwp+zip'), { level: 0 }],
    'version.xml': strToU8(`${XML}<hv:HCFVersion xmlns:hv="http://www.hancom.co.kr/hwpml/2011/version" tagetApplication="WORDPROCESSOR" major="5" minor="1" micro="1" buildNumber="0" os="1" xmlVersion="1.5" application="Hancom Office Hangul" appVersion="12, 0, 0, 535 WIN32LEWindows_10"/>`),
    'Contents/header.xml': strToU8(header),
    'Contents/section0.xml': strToU8(section),
    'Contents/content.hpf': strToU8(hpf),
    'settings.xml': strToU8(`${XML}<ha:HWPApplicationSetting xmlns:ha="http://www.hancom.co.kr/hwpml/2011/app" xmlns:config="urn:oasis:names:tc:opendocument:xmlns:config:1.0"><ha:CaretPosition listIDRef="0" paraIDRef="0" pos="0"/></ha:HWPApplicationSetting>`),
    'Preview/PrvText.txt': strToU8(미리글),
    'META-INF/container.xml': strToU8(`${XML}<ocf:container xmlns:ocf="urn:oasis:names:tc:opendocument:xmlns:container" xmlns:hpf="http://www.hancom.co.kr/schema/2011/hpf"><ocf:rootfiles><ocf:rootfile full-path="Contents/content.hpf" media-type="application/hwpml-package+xml"/><ocf:rootfile full-path="Preview/PrvText.txt" media-type="text/plain"/><ocf:rootfile full-path="META-INF/container.rdf" media-type="application/rdf+xml"/></ocf:rootfiles></ocf:container>`),
    'META-INF/container.rdf': strToU8(`${XML}<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description rdf:about=""><ns0:hasPart xmlns:ns0="http://www.hancom.co.kr/hwpml/2016/meta/pkg#" rdf:resource="Contents/header.xml"/></rdf:Description><rdf:Description rdf:about="Contents/header.xml"><rdf:type rdf:resource="http://www.hancom.co.kr/hwpml/2016/meta/pkg#HeaderFile"/></rdf:Description><rdf:Description rdf:about=""><ns0:hasPart xmlns:ns0="http://www.hancom.co.kr/hwpml/2016/meta/pkg#" rdf:resource="Contents/section0.xml"/></rdf:Description><rdf:Description rdf:about="Contents/section0.xml"><rdf:type rdf:resource="http://www.hancom.co.kr/hwpml/2016/meta/pkg#SectionFile"/></rdf:Description><rdf:Description rdf:about=""><rdf:type rdf:resource="http://www.hancom.co.kr/hwpml/2016/meta/pkg#Document"/></rdf:Description></rdf:RDF>`),
    'META-INF/manifest.xml': strToU8(`${XML}<odf:manifest xmlns:odf="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0"/>`),
  }
  for (const [열쇠, s] of 사진목록) 파일[s.경로] = [그림들.get(열쇠).바이트, { level: 0 }]
  return zipSync(파일)
}
