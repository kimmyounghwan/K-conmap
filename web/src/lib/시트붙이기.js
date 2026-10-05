/**
 * 📎 원본 엑셀(.xlsx)에 새 시트를 «붙이기» — 원본 시트는 한 글자도 안 건드립니다 (2026-10-05, G131)
 *
 * 소장님: 「설계변경은 원 내역서를 가지고 하는데, 거기에 쉬트가 추가 되는 방식이거든」
 *   → 원 내역서 파일 그대로 + 뒤에 변경내역서 · 변경원가계산서 · 대비표 · 사유서 … 를 붙입니다.
 *
 * ■ 새 시트는 변경엑셀쓰기.js 가 만든 xlsx 에서 가져옵니다(글자는 inlineStr 라 공유 문자열을 안 건드림).
 * ■ 꼴(styles.xml)은 원본 끝에 우리 글꼴 · 채우기 · 테두리 · 숫자 형식 · 칸 꼴을 덧붙이고, 새 시트의 s="n" 을 그만큼 밉니다.
 * ■ 원본이 «이름표 붙은 태그»(한셀 · <x:sheet>)여도 같은 이름표를 붙여 넣습니다.
 * ■ 열 때 모든 수식을 다시 셈하도록 fullCalcOnLoad 를 켭니다(새 시트가 원본을 가리키지는 않지만, 원본 값은 그대로).
 */
import { unzipSync, zipSync, strFromU8, strToU8 } from 'fflate'

const 시트형 = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet'
const 관계ns = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const 이름표 = (xml, 태그) => { const m = xml.match(new RegExp('<([A-Za-z_][\\w.-]*:)?' + 태그 + '[\\s>/]')); return m ? (m[1] || '') : '' }
/** 이름표 없는 조각 → 원본 이름표로 */
const 붙임표 = (조각, pre) => (pre ? 조각.replace(/<(\/?)([A-Za-z][\w]*)(?=[\s>/])/g, `<$1${pre}$2`) : 조각)

function 묶음(xml, pre, 태그) {
  const re = new RegExp(`<${pre}${태그}(\\s[^>]*)?(/>|>([\\s\\S]*?)</${pre}${태그}>)`)
  const m = xml.match(re)
  if (!m) return null
  return { 전체: m[0], 속성: m[1] || '', 안: m[3] || '', 닫힘: m[2] === '/>', 자리: m.index }
}
const 낱셈 = (안, pre, 태그) => (안.match(new RegExp(`<${pre}${태그}(?=[\\s>/])`, 'g')) || []).length
const 낱들 = (안, 태그) => 안.match(new RegExp(`<${태그}(?:\\s[^>]*)?(?:/>|>[\\s\\S]*?</${태그}>)`, 'g')) || []

function 개수고침(속성, n) {
  return /\scount="\d+"/.test(속성) ? 속성.replace(/\scount="\d+"/, ` count="${n}"`) : 속성 + ` count="${n}"`
}

/** 원본 styles.xml 에 새 꼴을 덧붙이고, 새 꼴 번호를 어떻게 밀지 돌려줍니다 */
function 꼴합치기(원, 새) {
  const pre = 이름표(원, 'styleSheet')
  let out = 원
  /* 새 쪽 조각들(이름표 없음) */
  const nb = 묶음(새, '', 'numFmts'), fb = 묶음(새, '', 'fonts'), lb = 묶음(새, '', 'fills'), bb = 묶음(새, '', 'borders'), xb = 묶음(새, '', 'cellXfs')
  const 새형식 = nb ? 낱들(nb.안, 'numFmt') : []
  const 새글꼴 = 낱들(fb.안, 'font'), 새채움 = 낱들(lb.안, 'fill'), 새테 = 낱들(bb.안, 'border'), 새꼴 = 낱들(xb.안, 'xf')
  /* 숫자 형식 번호 다시 매기기 */
  const 원nb = 묶음(out, pre, 'numFmts')
  const 있는번호 = 원nb ? [...원nb.안.matchAll(/numFmtId="(\d+)"/g)].map((m) => Number(m[1])) : []
  let 다음 = Math.max(199, ...있는번호) + 1
  const 형식맵 = new Map()
  const 형식조각 = 새형식.map((x) => {
    const id = Number((x.match(/numFmtId="(\d+)"/) || [])[1])
    const n = 다음++
    형식맵.set(id, n)
    return x.replace(/numFmtId="\d+"/, `numFmtId="${n}"`)
  })
  if (형식조각.length) {
    if (원nb) {
      const 수 = 낱셈(원nb.안, pre, 'numFmt') + 형식조각.length
      const 새묶음 = `<${pre}numFmts${개수고침(원nb.속성, 수)}>${원nb.안}${붙임표(형식조각.join(''), pre)}</${pre}numFmts>`
      out = out.replace(원nb.전체, 새묶음)
    } else {
      const 뿌리 = out.match(new RegExp(`<${pre}styleSheet[^>]*>`))
      const 넣 = `<${pre}numFmts count="${형식조각.length}">${붙임표(형식조각.join(''), pre)}</${pre}numFmts>`
      out = out.replace(뿌리[0], 뿌리[0] + 넣)
    }
  }
  const 덧붙 = (태그, 낱태그, 조각들) => {
    const b = 묶음(out, pre, 태그)
    if (!b) throw new Error('원본 꼴(styles.xml)에 ' + 태그 + ' 이 없습니다')
    const 원수 = 낱셈(b.안, pre, 낱태그)
    const 새묶음 = `<${pre}${태그}${개수고침(b.속성, 원수 + 조각들.length)}>${b.닫힘 ? '' : b.안}${붙임표(조각들.join(''), pre)}</${pre}${태그}>`
    out = out.replace(b.전체, 새묶음)
    return 원수
  }
  const 글꼴밀기 = 덧붙('fonts', 'font', 새글꼴)
  const 채움밀기 = 덧붙('fills', 'fill', 새채움)
  const 테밀기 = 덧붙('borders', 'border', 새테)
  const 고친꼴 = 새꼴.map((x) => x
    .replace(/fontId="(\d+)"/, (_, n) => `fontId="${Number(n) + 글꼴밀기}"`)
    .replace(/fillId="(\d+)"/, (_, n) => `fillId="${Number(n) + 채움밀기}"`)
    .replace(/borderId="(\d+)"/, (_, n) => `borderId="${Number(n) + 테밀기}"`)
    .replace(/numFmtId="(\d+)"/, (_, n) => `numFmtId="${형식맵.has(Number(n)) ? 형식맵.get(Number(n)) : n}"`)
    .replace(/xfId="\d+"/, 'xfId="0"'))
  const 꼴밀기 = 덧붙('cellXfs', 'xf', 고친꼴)
  return { xml: out, 꼴밀기 }
}

/** 워크북에서 차례대로 놓인 경로 찾기 */
function 길찾기(zip) {
  const rels = zip['_rels/.rels'] ? strFromU8(zip['_rels/.rels']) : ''
  const m = rels.match(/Target="\/?([^"]*workbook[^"]*\.xml)"/i)
  const wb = m && zip[m[1]] ? m[1] : 'xl/workbook.xml'
  const 폴더 = wb.replace(/[^/]*$/, '')
  const relsPath = 폴더 + '_rels/' + wb.slice(폴더.length) + '.rels'
  return { wb, 폴더, relsPath }
}

/**
 * @param 원바이트 원본 .xlsx(.xlsm)
 * @param 새바이트 변경엑셀() 이 만든 .xlsx
 * @param 새이름들 새 시트 이름(차례대로) — 새 xlsx 의 시트 차례와 같아야
 * @param 머리줄들 [ [첫, 끝] | null ] — 인쇄할 때 쪽마다 되풀이할 줄(Print_Titles)
 */
export function 시트붙이기(원바이트, 새바이트, 새이름들, 머리줄들 = []) {
  const A = unzipSync(new Uint8Array(원바이트))
  const B = unzipSync(new Uint8Array(새바이트))
  const { wb, 폴더, relsPath } = 길찾기(A)
  if (!A[wb]) throw new Error('원본 엑셀의 통합 문서를 못 찾았습니다(.xlsx 가 맞는지 보십시오)')
  let 책 = strFromU8(A[wb])
  let rels = A[relsPath] ? strFromU8(A[relsPath]) : '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>'
  let ct = strFromU8(A['[Content_Types].xml'])
  /* 꼴 */
  const 꼴rel = rels.match(/<(?:\w+:)?Relationship[^>]*Type="[^"]*\/styles"[^>]*>/)
  const 꼴목표 = 꼴rel ? 꼴rel[0].match(/Target="([^"]+)"/)[1] : null
  const 꼴길 = 꼴목표 ? (꼴목표.startsWith('/') ? 꼴목표.slice(1) : 폴더 + 꼴목표) : null
  let 꼴밀기 = 0
  if (꼴길 && A[꼴길]) {
    const r = 꼴합치기(strFromU8(A[꼴길]), strFromU8(B['xl/styles.xml']))
    A[꼴길] = strToU8(r.xml)
    꼴밀기 = r.꼴밀기
  } else {
    /* 꼴 파일이 없는 원본(드묾) — 우리 것을 그대로 넣음 */
    A[폴더 + 'styles.xml'] = B['xl/styles.xml']
    const rp = 이름표(rels, 'Relationships')
    rels = rels.replace(`</${rp}Relationships>`, `<${rp}Relationship Id="rIdKcmStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></${rp}Relationships>`)
    if (!/PartName="\/[^"]*styles\.xml"/.test(ct)) ct = ct.replace('</Types>', `<Override PartName="/${폴더}styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`)
  }
  /* 시트 이름표 · 관계 이름표 */
  const pre = 이름표(책, 'workbook')
  /* 관계 이름표(r:)는 넣는 <sheet> 마다 스스로 밝힙니다 — 원본이 뿌리에 밝혔는지 · 시트마다 밝혔는지(openpyxl) 가리지 않게 */
  const r접두 = 'kcmr'
  const 있는id = [...책.matchAll(/sheetId="(\d+)"/g)].map((m) => Number(m[1]))
  let 다음id = Math.max(0, ...있는id) + 1
  const 원시트수 = (책.match(new RegExp(`<${pre}sheet(?=[\\s>/])`, 'g')) || []).length
  const rp = 이름표(rels, 'Relationships')
  const 새시트줄 = [], 새이름정의 = []
  const 새시트들 = Object.keys(B).filter((k) => /^xl\/worksheets\/sheet\d+\.xml$/.test(k)).sort((a, b) => Number(a.match(/(\d+)\.xml$/)[1]) - Number(b.match(/(\d+)\.xml$/)[1]))
  새시트들.forEach((k, j) => {
    let 번 = j + 1
    while (A[폴더 + `worksheets/kcmchg${번}.xml`]) 번 += 100
    const 길 = 폴더 + `worksheets/kcmchg${번}.xml`
    const xml = strFromU8(B[k]).replace(/(<c\b[^>]*?\ss=")(\d+)(")/g, (_, a, n, c) => a + (Number(n) + 꼴밀기) + c)
    A[길] = strToU8(xml)
    const rid = `rIdKcm${번}`
    rels = rels.replace(`</${rp}Relationships>`, `<${rp}Relationship Id="${rid}" Type="${시트형}" Target="worksheets/kcmchg${번}.xml"/></${rp}Relationships>`)
    ct = ct.replace('</Types>', `<Override PartName="/${길}" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`)
    const 이름 = 새이름들[j] || `변경${j + 1}`
    새시트줄.push(`<${pre}sheet xmlns:${r접두}="${관계ns}" name="${esc(이름)}" sheetId="${다음id++}" ${r접두}:id="${rid}"/>`)
    const 머 = 머리줄들[j]
    if (머 && 머[1] >= 머[0]) 새이름정의.push(`<${pre}definedName name="_xlnm.Print_Titles" localSheetId="${원시트수 + j}">'${esc(이름).replace(/'/g, "''")}'!$${머[0]}:$${머[1]}</${pre}definedName>`)
  })
  책 = 책.replace(`</${pre}sheets>`, 새시트줄.join('') + `</${pre}sheets>`)
  if (새이름정의.length) {
    const 빈칸 = 책.match(new RegExp(`<${pre}definedNames\\s*/>`))
    if (책.includes(`</${pre}definedNames>`)) 책 = 책.replace(`</${pre}definedNames>`, 새이름정의.join('') + `</${pre}definedNames>`)
    else if (빈칸) 책 = 책.replace(빈칸[0], `<${pre}definedNames>${새이름정의.join('')}</${pre}definedNames>`)
    else {
      const 뒤 = ['calcPr', 'oleSize', 'customWorkbookViews', 'pivotCaches', 'smartTagPr', 'smartTagTypes', 'webPublishing', 'fileRecoveryPr', 'webPublishObjects', 'extLst']
      const 블록 = `<${pre}definedNames>${새이름정의.join('')}</${pre}definedNames>`
      let 넣음 = false
      for (const t of 뒤) {
        const m = 책.match(new RegExp(`<${pre}${t}(?=[\\s>/])`))
        if (m) { 책 = 책.slice(0, m.index) + 블록 + 책.slice(m.index); 넣음 = true; break }
      }
      if (!넣음) 책 = 책.replace(`</${pre}workbook>`, 블록 + `</${pre}workbook>`)
    }
  }
  /* 열 때 다시 셈 */
  const 셈 = 책.match(new RegExp(`<${pre}calcPr\\b[^>]*?/?>`))
  if (셈) {
    if (!/fullCalcOnLoad=/.test(셈[0])) {
      const 고친 = 셈[0].endsWith('/>') ? 셈[0].replace(/\s*\/>$/, ' fullCalcOnLoad="1"/>') : 셈[0].replace(/>$/, ' fullCalcOnLoad="1">')
      책 = 책.replace(셈[0], 고친)
    }
  } else {
    const 뒤 = ['oleSize', 'customWorkbookViews', 'pivotCaches', 'smartTagPr', 'smartTagTypes', 'webPublishing', 'fileRecoveryPr', 'webPublishObjects', 'extLst']
    const 넣을 = `<${pre}calcPr calcId="0" fullCalcOnLoad="1"/>`
    let 넣음 = false
    for (const t of 뒤) { const m = 책.match(new RegExp(`<${pre}${t}(?=[\\s>/])`)); if (m) { 책 = 책.slice(0, m.index) + 넣을 + 책.slice(m.index); 넣음 = true; break } }
    if (!넣음) 책 = 책.replace(`</${pre}workbook>`, 넣을 + `</${pre}workbook>`)
  }
  A[wb] = strToU8(책)
  A[relsPath] = strToU8(rels)
  A['[Content_Types].xml'] = strToU8(ct)
  return zipSync(A, { level: 6 })
}
