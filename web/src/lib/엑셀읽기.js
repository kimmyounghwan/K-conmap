/**
 * 📗 엑셀 읽기 — xlsx 를 «화면에 그릴 수 있는 모양» 으로 풉니다 (2026-09-27)
 *
 * 소장님: 「모든 도구 및 프로그램은 사이트에서 돌게 해주고, 수정도 사이트에서 가능하게 해줘」
 *   → 공사서류 원클릭·수량산출서가 만든 엑셀을 «받지 않아도» 화면에서 보고, 칸을 고쳐, 인쇄합니다.
 *     (엑셀 받기도 그대로 둡니다 — 소장님 결정 2026-09-27 11:40)
 *
 * ■ 브라우저·노드 양쪽에서 돕니다(DOMParser 를 안 씁니다 — 시험을 노드에서 돌리려고).
 *   우리가 만든 엑셀(openpyxl 틀 · qtoxlsx) 을 읽는 것이 목적입니다. 아무 엑셀이나 완벽히 그리려는 것이 아닙니다.
 * ■ 읽는 것: 시트(이름·숨김) · 칸(값·수식·스타일) · 열 너비 · 행 높이 · 병합 · 인쇄 영역 · 용지(가로/세로·한 쪽 맞춤)
 *            · 글꼴(굵게·크기·색·밑줄) · 채우기 · 테두리 · 맞춤(가로·세로·줄바꿈) · 표시 형식
 */
import { unzipSync, strFromU8 } from 'fflate'

/* ── XML 조각 ─────────────────────────── */
export function 풀기(s) {
  if (s == null) return ''
  return String(s).replace(/&(#x[0-9a-fA-F]+|#\d+|amp|lt|gt|quot|apos);/g, (m, e) => {
    if (e[0] === '#') {
      const n = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)
      try { return String.fromCodePoint(n) } catch (er) { return m }
    }
    return { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }[e]
  })
}
export function 속성(tag) {
  const o = {}
  const re = /([\w:.-]+)\s*=\s*"([^"]*)"/g
  let m
  while ((m = re.exec(tag))) o[m[1]] = 풀기(m[2])
  return o
}
/** <이름 ...>안</이름> 또는 <이름 .../> 전부 → [{a: 속성, 안: 안쪽 글, 온: 통째}] */
function 모두(xml, 이름) {
  const out = []
  const re = new RegExp('<' + 이름 + '(\\s[^>]*?)?(/>|>([\\s\\S]*?)</' + 이름 + '>)', 'g')
  let m
  while ((m = re.exec(xml))) out.push({ a: 속성(m[1] || ''), 안: m[3] || '', 온: m[0] })
  return out
}
function 하나(xml, 이름) { const r = 모두(xml, 이름); return r.length ? r[0] : null }

/* ── 칸 주소 ─────────────────────────── */
export function 열번호(s) { let n = 0; for (const ch of s.toUpperCase()) n = n * 26 + (ch.charCodeAt(0) - 64); return n }
export function 열글(n) { let s = ''; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26) } return s }
export function 주소풀기(ref) {
  const m = /^\$?([A-Z]{1,3})\$?(\d+)$/i.exec(String(ref).trim())
  return m ? { c: 열번호(m[1]), r: +m[2] } : null
}
export function 범위풀기(ref) {
  const [a, b] = String(ref).split(':')
  const p = 주소풀기(a), q = 주소풀기(b || a)
  if (!p || !q) return null
  return { r1: Math.min(p.r, q.r), c1: Math.min(p.c, q.c), r2: Math.max(p.r, q.r), c2: Math.max(p.c, q.c) }
}
export const 칸이름 = (r, c) => 열글(c) + r

/* ── 스타일 ─────────────────────────── */
const 기본색 = ['000000', 'FFFFFF', '44546A', 'E7E6E6', '4472C4', 'ED7D31', 'A5A5A5', 'FFC000', '5B9BD5', '70AD47']
function 색(a) {
  if (!a) return null
  if (a.rgb) { const h = a.rgb.length === 8 ? a.rgb.slice(2) : a.rgb; return '#' + h }
  if (a.theme != null) { const t = +a.theme; return '#' + (기본색[t === 0 ? 1 : t === 1 ? 0 : t] || '000000') }
  if (a.indexed != null) { const i = +a.indexed; if (i === 64 || i === 8) return '#000000'; if (i === 9) return '#FFFFFF'; if (i === 10) return '#FF0000' }
  return null
}
function 스타일읽기(xml) {
  const 형식 = {}
  const nf = 하나(xml, 'numFmts')
  if (nf) for (const x of 모두(nf.안, 'numFmt')) 형식[+x.a.numFmtId] = x.a.formatCode
  const 글꼴 = []
  const fo = 하나(xml, 'fonts')
  if (fo) for (const f of 모두(fo.안, 'font')) {
    const g = (n) => { const t = 하나(f.안, n); return t ? t.a : null }
    const b = g('b'), i = g('i'), u = g('u'), sz = g('sz'), c = g('color'), nm = g('name'), st = g('strike')
    글꼴.push({
      굵게: !!b && b.val !== '0' && b.val !== 'false', 기울임: !!i && i.val !== '0' && i.val !== 'false',
      밑줄: !!u && u.val !== 'none', 취소선: !!st && st.val !== '0',
      크기: sz ? +sz.val : 11, 색: 색(c), 이름: nm ? nm.val : '',
    })
  }
  const 채움 = []
  const fi = 하나(xml, 'fills')
  if (fi) for (const f of 모두(fi.안, 'fill')) {
    const p = 하나(f.안, 'patternFill')
    const fg = p ? 하나(p.안, 'fgColor') : null
    채움.push(p && p.a.patternType === 'solid' && fg ? 색(fg.a) : null)
  }
  const 테 = []
  const bo = 하나(xml, 'borders')
  if (bo) for (const b of 모두(bo.안, 'border')) {
    const 변 = {}
    for (const k of ['left', 'right', 'top', 'bottom']) {
      const t = 하나(b.안, k)
      if (t && t.a.style) { const c = 하나(t.안, 'color'); 변[k] = { 모양: t.a.style, 색: (c && 색(c.a)) || '#000000' } }
    }
    테.push(변)
  }
  const xfs = []
  const cx = 하나(xml, 'cellXfs')
  if (cx) for (const x of 모두(cx.안, 'xf')) {
    const al = 하나(x.안, 'alignment')
    xfs.push({
      형식번호: +(x.a.numFmtId || 0), 글꼴: +(x.a.fontId || 0), 채움: +(x.a.fillId || 0), 테: +(x.a.borderId || 0),
      맞춤: al ? al.a : {},
    })
  }
  return { 형식, 글꼴, 채움, 테, xfs }
}

/* ── 시트 ─────────────────────────── */
function 시트읽기(xml, 공유글) {
  const 칸 = new Map()   // 'B5' → {v, t, f, s}
  const 행 = new Map()   // r → {높이, 숨김}
  const 공유식 = {}      // si → {f, r, c}
  const fmt = 하나(xml, 'sheetFormatPr')
  const 기본높이 = fmt && fmt.a.defaultRowHeight ? +fmt.a.defaultRowHeight : 15
  const 기본너비 = fmt && fmt.a.defaultColWidth ? +fmt.a.defaultColWidth : (fmt && fmt.a.baseColWidth ? +fmt.a.baseColWidth + 0.71 : 8.43)
  const 열 = []
  const cols = 하나(xml, 'cols')
  if (cols) for (const c of 모두(cols.안, 'col')) 열.push({ 부터: +c.a.min, 까지: +c.a.max, 너비: c.a.width != null ? +c.a.width : 기본너비, 숨김: c.a.hidden === '1' || c.a.hidden === 'true' })
  const sd = 하나(xml, 'sheetData')
  let 끝행 = 0, 끝열 = 0
  if (sd) {
    for (const row of 모두(sd.안, 'row')) {
      const r = +row.a.r
      행.set(r, { 높이: row.a.ht != null ? +row.a.ht : null, 숨김: row.a.hidden === '1' || row.a.hidden === 'true' })
      if (r > 끝행) 끝행 = r
      for (const c of 모두(row.안, 'c')) {
        const ref = c.a.r
        const p = 주소풀기(ref)
        if (!p) continue
        const s = +(c.a.s || 0)
        const t = c.a.t || 'n'
        let v = null, f = null
        const fe = 하나(c.안, 'f')
        if (fe) {
          if (fe.a.t === 'shared') {
            if (fe.안) { f = 풀기(fe.안); 공유식[fe.a.si] = { f, r: p.r, c: p.c } } else if (공유식[fe.a.si]) {
              const 원 = 공유식[fe.a.si]
              f = 식옮기기(원.f, p.r - 원.r, p.c - 원.c)
            }
          } else if (fe.안) f = 풀기(fe.안)
        }
        const ve = 하나(c.안, 'v')
        if (t === 'inlineStr') {
          const is = 하나(c.안, 'is')
          v = is ? 모두(is.안, 't').map((x) => 풀기(x.안)).join('') : ''
        } else if (ve && ve.안 !== '') {
          const raw = 풀기(ve.안)
          if (t === 's') v = 공유글[+raw] ?? ''
          else if (t === 'str') v = raw
          else if (t === 'b') v = raw === '1'
          else if (t === 'e') v = { 오류: raw }
          else v = Number(raw)
        }
        칸.set(칸이름(p.r, p.c), { v, f, s, 행: p.r, 열: p.c })
        if (p.c > 끝열 && (v !== null && v !== '' || f)) 끝열 = p.c
        if (p.c > 끝열 && s) 끝열 = Math.max(끝열, p.c)
      }
    }
  }
  const 병합 = []
  const mc = 하나(xml, 'mergeCells')
  if (mc) for (const m of 모두(mc.안, 'mergeCell')) { const b = 범위풀기(m.a.ref); if (b) 병합.push(b) }
  const ps = 하나(xml, 'pageSetup')
  const pr = 하나(xml, 'sheetPr')
  const fitTo = pr ? 하나(pr.안, 'pageSetUpPr') : null
  const pm = 하나(xml, 'pageMargins')
  const po = 하나(xml, 'printOptions')
  const hf = 하나(xml, 'headerFooter')
  let 머리 = ''
  if (hf) {
    const oh = 하나(hf.안, 'oddHeader')
    if (oh && oh.안) 머리 = 머리글풀기(풀기(oh.안))
  }
  const sv = 하나(xml, 'sheetView')
  const dim = 하나(xml, 'dimension')
  return {
    칸, 행, 열, 병합, 기본높이, 기본너비, 끝행, 끝열,
    크기: dim ? 범위풀기(dim.a.ref) : null,
    용지: {
      정해짐: !!(ps && ps.a.orientation),
      가로: !!(ps && ps.a.orientation === 'landscape'),
      맞춤: !!(fitTo && (fitTo.a.fitToPage === '1' || fitTo.a.fitToPage === 'true')),
      너비쪽: ps && ps.a.fitToWidth != null ? +ps.a.fitToWidth : 1,
      높이쪽: ps && ps.a.fitToHeight != null ? +ps.a.fitToHeight : 1,
      배율: ps && ps.a.scale ? +ps.a.scale : 100,
      가운데: !!(po && (po.a.horizontalCentered === '1' || po.a.horizontalCentered === 'true')),
      여백: pm ? { 왼: +pm.a.left, 오른: +pm.a.right, 위: +pm.a.top, 아래: +pm.a.bottom } : { 왼: 0.7, 오른: 0.7, 위: 0.75, 아래: 0.75 },
    },
    머리,
    격자: !(sv && (sv.a.showGridLines === '0' || sv.a.showGridLines === 'false')),
  }
}

/** 머리글 암호(&R&"맑은 고딕,보통"&8 &K808080글) → 오른쪽 글만 */
function 머리글풀기(s) {
  const 오른 = s.split('&R')[1] ?? s.replace(/&[LC]/g, '')
  return 오른.replace(/&"[^"]*"/g, '').replace(/&K[0-9A-Fa-f]{6}/g, '').replace(/&\d+/g, '').replace(/&[LCRPNDTFABZIUSEXYO]/g, '').replace(/&&/g, '&').trim()
}

/** 공유 수식 옮기기 — $ 없는 칸 주소만 옮깁니다 */
export function 식옮기기(f, dr, dc) {
  return String(f).replace(/("[^"]*")|(\$?)([A-Z]{1,3})(\$?)(\d+)(?![\w(])/g, (m, 글, d1, col, d2, row) => {
    if (글) return 글
    const c = d1 ? 열번호(col) : 열번호(col) + dc
    const r = d2 ? +row : +row + dr
    if (c < 1 || r < 1) return m
    return d1 + 열글(c) + d2 + r
  })
}

/** xlsx 바이트 → 책 */
export function 엑셀읽기(bytes) {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  const files = unzipSync(u8)
  const 글 = (p) => (files[p] ? strFromU8(files[p]) : '')
  const wb = 글('xl/workbook.xml')
  const rels = {}
  for (const r of 모두(글('xl/_rels/workbook.xml.rels'), 'Relationship')) rels[r.a.Id] = r.a.Target
  const 공유글 = []
  const ss = 글('xl/sharedStrings.xml')
  if (ss) for (const si of 모두(ss, 'si')) 공유글.push(모두(si.안, 't').map((x) => 풀기(x.안)).join(''))
  const 스타일 = 스타일읽기(글('xl/styles.xml'))
  const 이름들 = []
  const dn = 하나(wb, 'definedNames')
  if (dn) for (const d of 모두(dn.안, 'definedName')) 이름들.push({ 이름: d.a.name, 시트번호: d.a.localSheetId != null ? +d.a.localSheetId : null, 값: 풀기(d.안) })
  const 시트들 = []
  const shs = 하나(wb, 'sheets')
  let i = 0
  for (const s of 모두(shs ? shs.안 : '', 'sheet')) {
    let 길 = rels[s.a['r:id']] || ''
    길 = 길.startsWith('/') ? 길.slice(1) : ('xl/' + 길.replace(/^\.\//, ''))
    const 시 = 시트읽기(글(길), 공유글)
    시.이름 = s.a.name
    시.숨김 = s.a.state === 'hidden' || s.a.state === 'veryHidden'
    시.길 = 길
    const pa = 이름들.find((d) => d.이름 === '_xlnm.Print_Area' && d.시트번호 === i)
    if (pa) { const m = /!(\$?[A-Z]+\$?\d+(?::\$?[A-Z]+\$?\d+)?)/.exec(pa.값.split(',')[0]); if (m) 시.인쇄영역 = 범위풀기(m[1].replace(/\$/g, '')) }
    const pt = 이름들.find((d) => d.이름 === '_xlnm.Print_Titles' && d.시트번호 === i)
    if (pt) { const m = /!\$?(\d+):\$?(\d+)/.exec(pt.값); if (m) 시.머리행 = { 부터: +m[1], 까지: +m[2] } }
    시트들.push(시)
    i++
  }
  const wp = 하나(wb, 'workbookPr')
  return { 시트들, 스타일, 이름들, 날짜1904: !!(wp && (wp.a.date1904 === '1' || wp.a.date1904 === 'true')), files }
}
