/**
 * xlsx2line.js — 내역서 엑셀을 «당초 / 변경(/ 증감)» 여러 줄로 벌려 줍니다. (2026-09-15)
 *
 * 소장님: 「설계변경 2줄 자동변환 — 이것도 만들 수 있어? 더 좋게, 더 많은 기능이 들어 가게」
 *
 * ■ 왜 라이브러리를 안 쓰고 XML 을 직접 만지나
 *    ExcelJS 로 읽었다 쓰면 «읽은 것만» 다시 써집니다. 그림·인쇄영역·매크로·조건부서식은
 *    조용히 사라집니다. 현장 내역서는 **서식이 생명**이라 한 번 깨지면 다시 안 씁니다.
 *    그래서 xlsx(=zip) 안에서 **건드릴 XML 만 고치고 나머지는 원본 그대로 둡니다.**
 *
 * ■ 하는 일
 *    ① 고른 시트의 자료 행을 2줄(당초·변경) 또는 3줄(당초·변경·증감)로 벌립니다
 *    ② 행이 밀리므로 **수식의 행 번호를 다시 계산**합니다 (공유수식도 풀어서)
 *    ③ 합계 SUM(범위)는 라벨 열이 있으면 **SUMIF(라벨,"변경",범위)** 로 갈라 줍니다
 *       ← 이게 없으면 합계가 당초+변경을 **두 번 더합니다**
 *    ④ 병합셀을 따라 옮기고, 한 줄짜리 병합은 줄 수만큼 복제합니다
 *    ⑤ 변경 줄은 붉은 글씨, 증감 줄은 푸른 글씨 (styles.xml 에 변형을 덧붙입니다)
 *    ⑥ 증감 줄에는 «변경 − 당초» 수식을 넣습니다
 *    ⑦ 못 고친 수식은 **검산 목록**으로 돌려줍니다 — 숨기지 않습니다
 *
 * ■ 안 하는 것 (거짓말하지 않기 위해 적어 둡니다)
 *    · 구형 .xls(97-2003) — xlsx 로 저장해서 올려야 합니다
 *    · 다른 시트에서 이 시트를 가리키는 수식
 *    · 차트가 가리키는 범위
 */
import { unzipSync, zipSync, strToU8, strFromU8 } from 'fflate'

/* ── 열 글자 ↔ 번호 ───────────────────────────── */
export function colToNum(s) {
  let n = 0
  for (const ch of s.toUpperCase()) n = n * 26 + (ch.charCodeAt(0) - 64)
  return n
}
export function numToCol(n) {
  let s = ''
  while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = (n - m - 1) / 26 }
  return s
}
function splitRef(ref) {
  const m = /^([A-Za-z]{1,3})(\d+)$/.exec(ref)
  return m ? { col: m[1].toUpperCase(), row: +m[2] } : null
}

/* ── 아주 작은 XML 도우미 — 여는 태그의 속성만 만집니다 ── */
function attr(tag, name) {
  const m = new RegExp(`\\s${name}="([^"]*)"`).exec(tag)
  return m ? m[1] : null
}
function setAttr(tag, name, val) {
  const re = new RegExp(`(\\s${name}=")[^"]*(")`)
  if (re.test(tag)) return tag.replace(re, `$1${val}$2`)
  return tag.replace(/(<[A-Za-z:]+)/, `$1 ${name}="${val}"`)
}
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
/* 엑셀은 한글을 &#46020; 같은 숫자 기호로도 씁니다 — 미리보기에서 풀어 줍니다 */
const unesc = (s) => String(s)
  .replace(/&#x([0-9A-Fa-f]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
  .replace(/&amp;/g, '&')

/* ══════════════════════════════════════════════════════════
   수식 — 행 번호 옮기기
   문자열("..")과 시트이름('..')은 건너뜁니다. LOG10( 같은 함수 이름도 건드리지 않습니다.
   ══════════════════════════════════════════════════════════ */
const REF_RE = /^(\$?)([A-Za-z]{1,3})(\$?)(\d{1,7})(?![0-9A-Za-z_.(])/

export function mapFormulaRows(f, mapRow) {
  let out = ''
  let i = 0
  while (i < f.length) {
    const ch = f[i]
    if (ch === '"' || ch === "'") {
      const q = ch
      let j = i + 1
      while (j < f.length) {
        if (f[j] === q) { if (f[j + 1] === q) j += 2; else { j++; break } } else j++
      }
      out += f.slice(i, j); i = j; continue
    }
    const prev = i > 0 ? f[i - 1] : ''
    if (!/[A-Za-z0-9_.$]/.test(prev)) {
      const m = REF_RE.exec(f.slice(i))
      if (m) {
        const [whole, d1, col, d2, row] = m
        const nr = mapRow(+row)
        out += nr == null ? whole : `${d1}${col}${d2}${nr}`
        i += whole.length
        continue
      }
    }
    out += ch; i++
  }
  return out
}

/* 공유수식(t="shared") 을 보통 수식으로 풀 때 쓰는 «칸 옮기기» */
export function shiftFormula(f, dRow, dCol) {
  let out = ''
  let i = 0
  while (i < f.length) {
    const ch = f[i]
    if (ch === '"' || ch === "'") {
      const q = ch
      let j = i + 1
      while (j < f.length) { if (f[j] === q) { if (f[j + 1] === q) j += 2; else { j++; break } } else j++ }
      out += f.slice(i, j); i = j; continue
    }
    const prev = i > 0 ? f[i - 1] : ''
    if (!/[A-Za-z0-9_.$]/.test(prev)) {
      const m = REF_RE.exec(f.slice(i))
      if (m) {
        const [whole, d1, col, d2, row] = m
        const c = d1 ? col : numToCol(Math.max(1, colToNum(col) + dCol))
        const r = d2 ? row : String(Math.max(1, +row + dRow))
        out += `${d1}${c}${d2}${r}`
        i += whole.length
        continue
      }
    }
    out += ch; i++
  }
  return out
}

/* ══════════════════════════════════════════════════════════
   styles.xml — 붉은/푸른 글씨 변형 만들기
   ══════════════════════════════════════════════════════════ */
function sliceList(xml, tag) {
  const open = new RegExp(`<${tag}\\b[^>]*>`).exec(xml)
  if (!open) return null
  const start = open.index
  const close = xml.indexOf(`</${tag}>`, start)
  if (close < 0) return null
  const inner = xml.slice(start + open[0].length, close)
  return { head: open[0], inner, start, end: close + tag.length + 3 }
}
function splitItems(inner, tag) {
  const re = new RegExp(`<${tag}\\b[^>]*\\/>|<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, 'g')
  return inner.match(re) || []
}

class Styler {
  constructor(xml) {
    this.xml = xml
    this.fontsBlk = sliceList(xml, 'fonts')
    this.xfsBlk = sliceList(xml, 'cellXfs')
    this.fonts = this.fontsBlk ? splitItems(this.fontsBlk.inner, 'font') : []
    this.xfs = this.xfsBlk ? splitItems(this.xfsBlk.inner, 'xf') : []
    this.cache = new Map()
    this.touched = false
  }
  /* 글꼴에 색을 입힙니다 — 이미 있던 색은 갈아 끼웁니다 */
  _colorFont(fontXml, rgb, bold) {
    let f = fontXml
    const body = f.endsWith('/>') ? f.slice(0, -2) + '>' + '</font>' : f
    let inner = /<font\b[^>]*>([\s\S]*)<\/font>/.exec(body)?.[1] ?? ''
    inner = inner.replace(/<color\b[^>]*\/>/g, '').replace(/<color\b[^>]*>[\s\S]*?<\/color>/g, '')
    if (bold && !/<b\s*\/>/.test(inner)) inner = '<b/>' + inner
    return `<font><color rgb="${rgb}"/>${inner}</font>`
  }
  variant(styleIdx, rgb, bold) {
    if (!this.fontsBlk || !this.xfsBlk) return styleIdx
    const key = `${styleIdx}|${rgb}|${bold ? 1 : 0}`
    if (this.cache.has(key)) return this.cache.get(key)
    const si = Number.isFinite(styleIdx) ? styleIdx : 0
    const xf = this.xfs[si] || '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'
    const fontId = +(attr(xf, 'fontId') || 0)
    const baseFont = this.fonts[fontId] || '<font><sz val="11"/><name val="맑은 고딕"/></font>'
    const newFont = this._colorFont(baseFont, rgb, bold)
    let newFontId = this.fonts.indexOf(newFont)
    if (newFontId < 0) { this.fonts.push(newFont); newFontId = this.fonts.length - 1 }
    let nxf = setAttr(xf, 'fontId', String(newFontId))
    nxf = setAttr(nxf, 'applyFont', '1')
    let idx = this.xfs.indexOf(nxf)
    if (idx < 0) { this.xfs.push(nxf); idx = this.xfs.length - 1 }
    this.touched = true
    this.cache.set(key, idx)
    return idx
  }
  build() {
    if (!this.touched) return this.xml
    let out = this.xml
    const fb = sliceList(out, 'fonts')
    out = out.slice(0, fb.start) + `<fonts count="${this.fonts.length}">${this.fonts.join('')}</fonts>` + out.slice(fb.end)
    const xb = sliceList(out, 'cellXfs')
    out = out.slice(0, xb.start) + `<cellXfs count="${this.xfs.length}">${this.xfs.join('')}</cellXfs>` + out.slice(xb.end)
    return out
  }
}

/* ══════════════════════════════════════════════════════════
   ① 파일 살펴보기 — 시트 목록과 자료 구간 짐작
   ══════════════════════════════════════════════════════════ */
export function analyze(buf) {
  const zip = unzipSync(new Uint8Array(buf))
  const has = (p) => Object.prototype.hasOwnProperty.call(zip, p)
  if (!has('xl/workbook.xml')) {
    throw new Error('엑셀 파일(xlsx)이 아닙니다. 구형 .xls 는 엑셀에서 «다른 이름으로 저장 → xlsx» 한 뒤 올려 주십시오.')
  }
  const wb = strFromU8(zip['xl/workbook.xml'])
  const rels = has('xl/_rels/workbook.xml.rels') ? strFromU8(zip['xl/_rels/workbook.xml.rels']) : ''
  const relMap = {}
  for (const m of rels.matchAll(/<Relationship\b[^>]*\/>/g)) {
    const id = attr(m[0], 'Id'); let t = attr(m[0], 'Target') || ''
    if (t.startsWith('/')) t = t.slice(1); else if (!t.startsWith('xl/')) t = 'xl/' + t
    relMap[id] = t.replace(/^xl\/\.\.\//, '')
  }
  const sheets = []
  for (const m of wb.matchAll(/<sheet\b[^>]*\/>/g)) {
    const name = (attr(m[0], 'name') || '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    const rid = attr(m[0], 'r:id') || attr(m[0], 'id')
    const path = relMap[rid]
    if (!path || !has(path)) continue
    const xml = strFromU8(zip[path])
    const rows = []
    for (const r of xml.matchAll(/<row\b[^>]*/g)) {
      const rn = +(attr(r[0] + '>', 'r') || 0)
      if (rn) rows.push(rn)
    }
    const maxRow = rows.length ? Math.max(...rows) : 0
    /* 자료 구간 짐작 — 값이 둘 이상 든 행이 처음 나오는 곳부터 마지막 값 행까지 */
    let first = 0, last = 0
    const rowRe = /<row\b[^>]*\/>|<row\b[^>]*>[\s\S]*?<\/row>/g
    for (const rm of xml.match(rowRe) || []) {
      const rn = +(attr(rm, 'r') || 0)
      const cells = (rm.match(/<c\b[^>]*>[\s\S]*?<\/c>/g) || []).length
      if (cells >= 2) { if (!first) first = rn; last = rn }
    }
    let gs2 = first ? first + 1 : 2
    let ge2 = last || maxRow
    if (ge2 < gs2) { gs2 = Math.min(gs2, maxRow || 1); ge2 = maxRow || gs2 }
    sheets.push({ name, path, maxRow, guessStart: gs2, guessEnd: ge2 })
  }
  return { sheets, zip }
}

/* ══════════════════════════════════════════════════════════
   ② 바꾸기
   ══════════════════════════════════════════════════════════ */
const RED = 'FFC00000'
const BLUE = 'FF0070C0'

export function convert(buf, opts) {
  const {
    sheets: sheetOpts = null,  /* [{path, startRow, endRow, labelCol}] — 시트마다 다르게 */
    sheetPaths = [],
    startRow = 2,
    endRow = 0,
    lines = 2,                 /* 2 = 당초·변경 · 3 = 당초·변경·증감 */
    labels = ['당초', '변경', '증감'],
    labelCol = '',             /* 'B' 처럼. 비우면 라벨을 안 씁니다 */
    color = 'blackred',        /* blackred | redonly | none */
    diffFormula = true,        /* 증감 줄에 «변경 − 당초» 수식 */
    skipEmpty = true,          /* 빈 행은 벌리지 않습니다 */
  } = opts || {}

  const zip = unzipSync(new Uint8Array(buf))
  const gs = lines === 3 ? 3 : 2
  const report = { sheets: [], warns: [] }
  const order = sheetOrder(zip)          /* 경로 → 시트 차례(localSheetId) */
  const lastRowOf = {}                   /* 경로 → 바뀐 뒤 마지막 행 */

  const stylesPath = 'xl/styles.xml'
  const styler = new Styler(zip[stylesPath] ? strFromU8(zip[stylesPath]) : '<styleSheet/>')

  const jobs = sheetOpts && sheetOpts.length
    ? sheetOpts
    : sheetPaths.map((path) => ({ path, startRow, endRow, labelCol }))

  for (const job of jobs) {
    const path = job.path
    if (!zip[path]) continue
    const xml = strFromU8(zip[path])
    const res = convertSheet(xml, {
      startRow: job.startRow ?? startRow,
      endRow: job.endRow ?? endRow,
      labelCol: job.labelCol ?? labelCol,
      gs, labels, color, diffFormula, skipEmpty,
    }, styler)
    zip[path] = strToU8(res.xml)
    report.sheets.push({ path, ...res.stat })
    lastRowOf[path] = res.stat.lastRow
    for (const w of res.warns) report.warns.push({ path, ...w })
  }

  /* 인쇄영역 · 반복할 행 — 워크북의 이름 정의에 들어 있습니다 */
  if (zip['xl/workbook.xml']) {
    let wb = strFromU8(zip['xl/workbook.xml'])
    let changed = false
    wb = wb.replace(/<definedName\b[^>]*>[\s\S]*?<\/definedName>/g, (tag) => {
      const nm = attr(tag, 'name') || ''
      if (!/Print_Area|Print_Titles/.test(nm)) return tag
      const lsi = attr(tag, 'localSheetId')
      if (lsi == null) return tag
      const path = order[+lsi]
      const lr = path ? lastRowOf[path] : null
      if (!lr) return tag
      const body = /<definedName\b[^>]*>([\s\S]*?)<\/definedName>/.exec(tag)[1]
      const nb = body.replace(/(\$?[A-Za-z]{1,3}\$?)(\d+)(\s*:\s*)(\$?[A-Za-z]{1,3}\$?)(\d+)/g,
        (all, a, r1, mid, b, r2) => `${a}${r1}${mid}${b}${Math.max(+r2, lr)}`)
      if (nb === body) return tag
      changed = true
      return tag.replace(body, nb)
    })
    if (changed) zip['xl/workbook.xml'] = strToU8(wb)
  }

  if (zip[stylesPath]) zip[stylesPath] = strToU8(styler.build())

  /* 계산 사슬은 지웁니다 — 행이 밀렸으니 엑셀이 다시 만들게 둡니다 */
  if (zip['xl/calcChain.xml']) {
    delete zip['xl/calcChain.xml']
    if (zip['[Content_Types].xml']) {
      zip['[Content_Types].xml'] = strToU8(
        strFromU8(zip['[Content_Types].xml']).replace(/<Override[^>]*calcChain\.xml[^>]*\/>/g, ''))
    }
    if (zip['xl/_rels/workbook.xml.rels']) {
      zip['xl/_rels/workbook.xml.rels'] = strToU8(
        strFromU8(zip['xl/_rels/workbook.xml.rels']).replace(/<Relationship[^>]*calcChain\.xml[^>]*\/>/g, ''))
    }
  }
  /* 열 때 한 번 다시 셈하게 합니다 */
  if (zip['xl/workbook.xml']) {
    let wb = strFromU8(zip['xl/workbook.xml'])
    if (/<calcPr\b[^>]*\/>/.test(wb)) {
      wb = wb.replace(/<calcPr\b[^>]*\/>/, (t) => setAttr(t, 'fullCalcOnLoad', '1'))
    } else {
      wb = wb.replace('</workbook>', '<calcPr calcId="0" fullCalcOnLoad="1"/></workbook>')
    }
    zip['xl/workbook.xml'] = strToU8(wb)
  }

  const out = zipSync(zip, { level: 6 })
  return { data: out, report }
}

/* ── 시트 한 장 ──────────────────────────────── */
function convertSheet(xml, o, styler) {
  const { startRow, endRow, gs, labels, labelCol, color, diffFormula, skipEmpty } = o
  const warns = []

  const sdOpen = /<sheetData\b[^>]*>/.exec(xml)
  if (!sdOpen) return { xml, stat: { rows: 0 }, warns: [{ msg: 'sheetData 를 못 찾았습니다' }] }
  const sdStart = sdOpen.index
  const sdInnerStart = sdStart + sdOpen[0].length
  const sdEnd = xml.indexOf('</sheetData>', sdInnerStart)
  const body = xml.slice(sdInnerStart, sdEnd)

  const rowRe = /<row\b[^>]*\/>|<row\b[^>]*>[\s\S]*?<\/row>/g
  const rows = body.match(rowRe) || []

  /* 1) 어떤 행을 벌릴지 정합니다 */
  const info = rows.map((r) => {
    const rn = +(attr(r, 'r') || 0)
    const cells = r.match(/<c\b[^>]*\/>|<c\b[^>]*>[\s\S]*?<\/c>/g) || []
    const filled = cells.filter((c) => /<v>|<is>|<f/.test(c)).length
    return { xml: r, rn, cells, filled }
  })
  const last = endRow || (info.length ? Math.max(...info.map((x) => x.rn)) : 0)
  const dup = new Set()
  for (const it of info) {
    if (it.rn < startRow || it.rn > last) continue
    if (skipEmpty && it.filled === 0) continue
    dup.add(it.rn)
  }

  /* 2) 옛 행 → 새 행 (그 묶음의 첫 줄) */
  const maxRn = info.length ? Math.max(...info.map((x) => x.rn)) : 0
  const newOf = new Map()
  let cur = 0
  for (let r = 1; r <= maxRn; r++) {
    cur += 1
    newOf.set(r, cur)
    if (dup.has(r)) cur += gs - 1
  }
  const mapBase = (r) => (newOf.has(r) ? newOf.get(r) : r)

  /* 3) 행을 다시 씁니다 */
  const styleOf = (s, k) => {
    if (color === 'none') return s
    if (k === 0) return s
    if (k === 1) return styler.variant(s, RED, false)
    return styler.variant(s, BLUE, false)
  }
  const outRows = []
  let made = 0

  for (const it of info) {
    const isDup = dup.has(it.rn)
    const copies = isDup ? gs : 1
    for (let k = 0; k < copies; k++) {
      const nr = mapBase(it.rn) + k
      let row = it.xml
      const rowOpen = /<row\b[^>]*?(\/?)>/.exec(row)[0]
      let newOpen = setAttr(rowOpen, 'r', String(nr))
      newOpen = newOpen.replace(/\s(?:spans|x14ac:dyDescent)="[^"]*"/g, (m) => m) /* 그대로 둡니다 */
      const selfClose = /\/>$/.test(rowOpen)
      const inner = selfClose ? '' : row.slice(rowOpen.length, row.lastIndexOf('</row>'))

      const cells = inner.match(/<c\b[^>]*\/>|<c\b[^>]*>[\s\S]*?<\/c>/g) || []
      const newCells = []
      for (const c of cells) {
        const cOpen = /<c\b[^>]*?(\/?)>/.exec(c)[0]
        const ref = attr(cOpen, 'r') || ''
        const sp = splitRef(ref)
        if (!sp) { newCells.push(c); continue }
        const nref = `${sp.col}${nr}`
        const sIdx = attr(cOpen, 's')
        let nOpen = setAttr(cOpen, 'r', nref)
        const ns = styleOf(sIdx == null ? 0 : +sIdx, k)
        if (color !== 'none' && k > 0) nOpen = setAttr(nOpen, 's', String(ns))
        const cSelf = /\/>$/.test(cOpen)
        let cInner = cSelf ? '' : c.slice(cOpen.length, c.lastIndexOf('</c>'))

        /* 증감 줄 — 숫자 칸에 «변경 − 당초» 를 넣습니다 */
        if (k === 2 && diffFormula && isDup) {
          const isNum = /<v>[-+0-9.eE]+<\/v>/.test(cInner) || /<f[\s>]/.test(cInner)
          const isText = /\st="(s|str|inlineStr)"/.test(cOpen)
          if (isNum && !isText) {
            const a = `${sp.col}${mapBase(it.rn)}`
            const b = `${sp.col}${mapBase(it.rn) + 1}`
            nOpen = nOpen.replace(/\st="[^"]*"/g, '')
            if (cSelf) nOpen = nOpen.replace(/\/>$/, '>')
            newCells.push(`${nOpen}<f>${b}-${a}</f></c>`)
            continue
          }
          if (!isNum) { /* 글자 칸은 비웁니다 — 라벨만 남깁니다 */
            if (cSelf) { newCells.push(nOpen); continue }
            newCells.push(`${nOpen}</c>`)
            continue
          }
        }

        /* 수식 — 행 번호를 다시 계산합니다 */
        if (!cSelf && /<f[\s>]/.test(cInner)) {
          const r = rewriteFormula(cInner, {
            srcRow: it.rn, k, gs, dup, mapBase, labelCol, labels, col: sp.col, warns, ref,
          })
          cInner = r
        }
        if (cSelf) { newCells.push(nOpen); continue }
        newCells.push(`${nOpen}${cInner}</c>`)
      }

      /* 라벨 칸 */
      if (isDup && labelCol) {
        const lref = `${labelCol.toUpperCase()}${nr}`
        const exist = newCells.findIndex((c) => attr(/<c\b[^>]*?(\/?)>/.exec(c)[0], 'r') === lref)
        const sBase = exist >= 0 ? attr(/<c\b[^>]*?(\/?)>/.exec(newCells[exist])[0], 's') : null
        const ls = color === 'none' ? (sBase == null ? 0 : +sBase) : styleOf(sBase == null ? 0 : +sBase, k)
        const cell = `<c r="${lref}" s="${ls}" t="inlineStr"><is><t>${esc(labels[k] || '')}</t></is></c>`
        if (exist >= 0) newCells[exist] = cell
        else {
          const at = colToNum(labelCol)
          let ins = newCells.length
          for (let i = 0; i < newCells.length; i++) {
            const rr = attr(/<c\b[^>]*?(\/?)>/.exec(newCells[i])[0], 'r')
            const s2 = splitRef(rr || '')
            if (s2 && colToNum(s2.col) > at) { ins = i; break }
          }
          newCells.splice(ins, 0, cell)
        }
      }

      outRows.push(`${newOpen}${newCells.join('')}</row>`)
      made++
    }
  }

  let out = xml.slice(0, sdInnerStart) + outRows.join('') + xml.slice(sdEnd)

  /* 4) 병합셀 */
  out = fixMerges(out, dup, mapBase, gs)
  /* 5) 범위를 쓰는 것들 */
  out = fixSqrefs(out, dup, mapBase, gs)
  /* 6) dimension */
  const lastNew = mapBase(maxRn) + (dup.has(maxRn) ? gs - 1 : 0)
  out = out.replace(/<dimension\b[^>]*\/>/, (t) => {
    const ref = attr(t, 'ref') || ''
    const m = /^([A-Za-z]+\d+):([A-Za-z]+)(\d+)$/.exec(ref)
    return m ? setAttr(t, 'ref', `${m[1]}:${m[2]}${Math.max(+m[3], lastNew)}`) : t
  })

  out = out.replace(/<autoFilter\b[^>]*\/>/g, (t) => {
    const r = attr(t, 'ref')
    return r ? setAttr(t, 'ref', mapRange(r, dup, mapBase, gs)) : t
  })

  return { xml: out, stat: { rows: dup.size, made, lastRow: lastNew }, warns }
}

/* 수식 한 칸 */
function rewriteFormula(cInner, ctx) {
  const { srcRow, k, gs, dup, mapBase, labelCol, labels, col, warns, ref } = ctx
  const fm = /<f\b([^>]*)(?:\/>|>([\s\S]*?)<\/f>)/.exec(cInner)
  if (!fm) return cInner
  const fAttrs = fm[1] || ''
  let ftext = fm[2] || ''
  const isShared = /\st="shared"/.test(fAttrs)

  if (isShared && !ftext) {
    /* 따라가는 공유수식인데 본문이 없습니다 — 원본을 못 찾으면 값만 남깁니다 */
    warns.push({ ref, msg: '공유수식을 풀지 못해 수식을 지우고 값만 남겼습니다' })
    return cInner.replace(/<f\b[^>]*(?:\/>|>[\s\S]*?<\/f>)/, '')
  }

  const mapRow = (r) => {
    if (!dup.has(r)) return mapBase(r)
    return mapBase(r) + k
  }

  /* 합계 SUM/SUBTOTAL(9, ...) — 라벨이 있으면 줄별로 갈라 줍니다 */
  const plain = ftext.trim()
  const sumM = /^(SUM|SUBTOTAL)\(\s*(?:9\s*,\s*)?([A-Za-z]{1,3})(\$?)(\d+)\s*:\s*([A-Za-z]{1,3})(\$?)(\d+)\s*\)$/i.exec(plain)
  if (sumM) {
    const c1 = sumM[2].toUpperCase(), r1 = +sumM[4], c2 = sumM[5].toUpperCase(), r2 = +sumM[7]
    const spans = [...Array(Math.max(0, r2 - r1 + 1)).keys()].some((i) => dup.has(r1 + i))
    if (spans && c1 === c2) {
      const n1 = mapBase(r1)
      const n2 = mapBase(r2) + (dup.has(r2) ? gs - 1 : 0)
      if (labelCol && !dup.has(srcRow)) {
        warns.push({ ref, msg: `합계 행(${srcRow}행)이 자료 구간 밖이라 «당초» 합계만 만들었습니다 — 합계 행까지 구간에 넣으면 줄별로 갈라집니다` })
      }
      if (labelCol) {
        const L = labelCol.toUpperCase()
        const word = labels[k] || labels[0]
        const nf = `SUMIF($${L}$${n1}:$${L}$${n2},"${word}",${c1}${n1}:${c2}${n2})`
        return cInner.replace(/<f\b[^>]*(?:\/>|>[\s\S]*?<\/f>)/, `<f>${esc(nf)}</f>`)
      }
      warns.push({ ref, msg: `합계가 당초·변경을 모두 더합니다 — 라벨 열을 지정하면 줄별로 갈라 드립니다 (${plain})` })
      const nf = `SUM(${c1}${n1}:${c2}${n2})`
      return cInner.replace(/<f\b[^>]*(?:\/>|>[\s\S]*?<\/f>)/, `<f>${esc(nf)}</f>`)
    }
  }

  const nf = mapFormulaRows(ftext, mapRow)
  /* 공유수식은 풀어서 보통 수식으로 저장합니다 (원본 si/ref 를 버립니다) */
  return cInner.replace(/<f\b[^>]*(?:\/>|>[\s\S]*?<\/f>)/, `<f>${nf}</f>`)
}

function mapRange(ref, dup, mapBase, gs) {
  const m = /^(\$?)([A-Za-z]{1,3})(\$?)(\d+)(?::(\$?)([A-Za-z]{1,3})(\$?)(\d+))?$/.exec(ref)
  if (!m) return ref
  const r1 = +m[4]
  const n1 = mapBase(r1)
  if (!m[5] && !m[8]) return `${m[1]}${m[2]}${m[3]}${n1}`
  const r2 = +m[8]
  const n2 = mapBase(r2) + (dup.has(r2) ? gs - 1 : 0)
  return `${m[1]}${m[2]}${m[3]}${n1}:${m[5]}${m[6]}${m[7]}${n2}`
}

function fixMerges(xml, dup, mapBase, gs) {
  const blk = sliceList(xml, 'mergeCells')
  if (!blk) return xml
  const items = splitItems(blk.inner, 'mergeCell')
  const out = []
  for (const it of items) {
    const ref = attr(it, 'ref') || ''
    const m = /^([A-Za-z]{1,3})(\d+):([A-Za-z]{1,3})(\d+)$/.exec(ref)
    if (!m) { out.push(it); continue }
    const r1 = +m[2], r2 = +m[4]
    if (r1 === r2 && dup.has(r1)) {
      for (let k = 0; k < gs; k++) {
        const nr = mapBase(r1) + k
        out.push(`<mergeCell ref="${m[1]}${nr}:${m[3]}${nr}"/>`)
      }
      continue
    }
    const n1 = mapBase(r1)
    const n2 = mapBase(r2) + (dup.has(r2) ? gs - 1 : 0)
    out.push(`<mergeCell ref="${m[1]}${n1}:${m[3]}${n2}"/>`)
  }
  return xml.slice(0, blk.start) + `<mergeCells count="${out.length}">${out.join('')}</mergeCells>` + xml.slice(blk.end)
}

function fixSqrefs(xml, dup, mapBase, gs) {
  return xml.replace(/(<(?:dataValidation|conditionalFormatting)\b[^>]*)(sqref="([^"]*)")/g,
    (all, head, whole, val) => {
      const nv = val.split(/\s+/).map((r) => mapRange(r, dup, mapBase, gs)).join(' ')
      return `${head}sqref="${nv}"`
    })
}


/* 워크북에 적힌 시트 차례 — 인쇄영역의 localSheetId 가 이 번호입니다 */
function sheetOrder(zip) {
  const out = []
  if (!zip['xl/workbook.xml']) return out
  const wb = strFromU8(zip['xl/workbook.xml'])
  const rels = zip['xl/_rels/workbook.xml.rels'] ? strFromU8(zip['xl/_rels/workbook.xml.rels']) : ''
  const relMap = {}
  for (const m of rels.matchAll(/<Relationship\b[^>]*\/>/g)) {
    const id = attr(m[0], 'Id'); let t = attr(m[0], 'Target') || ''
    if (t.startsWith('/')) t = t.slice(1); else if (!t.startsWith('xl/')) t = 'xl/' + t
    relMap[id] = t.replace(/^xl\/\.\.\//, '')
  }
  for (const m of wb.matchAll(/<sheet\b[^>]*\/>/g)) {
    out.push(relMap[attr(m[0], 'r:id') || attr(m[0], 'id')] || null)
  }
  return out
}

/* ══════════════════════════════════════════════════════════
   미리보기 — 바꾸기 전에 «무엇이 어떻게 되는지» 눈으로 보게 합니다
   ══════════════════════════════════════════════════════════ */
export function readGrid(zip, path, from, to, maxCol = 12) {
  if (!zip[path]) return { head: [], rows: [] }
  const xml = strFromU8(zip[path])
  let shared = []
  if (zip['xl/sharedStrings.xml']) {
    const ss = strFromU8(zip['xl/sharedStrings.xml'])
    shared = (ss.match(/<si>[\s\S]*?<\/si>/g) || []).map((si) =>
      (si.match(/<t[^>]*>([\s\S]*?)<\/t>/g) || [])
        .map((t) => t.replace(/<[^>]+>/g, ''))
        .join(''))
      .map(unesc)
  }
  const rowRe = /<row\b[^>]*\/>|<row\b[^>]*>[\s\S]*?<\/row>/g
  const rows = []
  for (const rm of xml.match(rowRe) || []) {
    const rn = +(attr(rm, 'r') || 0)
    if (rn < from || rn > to) continue
    const line = new Array(maxCol).fill('')
    const nums = new Array(maxCol).fill(false)
    for (const c of rm.match(/<c\b[^>]*\/>|<c\b[^>]*>[\s\S]*?<\/c>/g) || []) {
      const open = /<c\b[^>]*?(\/?)>/.exec(c)[0]
      const sp = splitRef(attr(open, 'r') || '')
      if (!sp) continue
      const ci = colToNum(sp.col)
      if (ci > maxCol) continue
      const t = attr(open, 't')
      let v = ''
      if (/<f[\s>]/.test(c)) {
        const f = /<f\b[^>]*>([\s\S]*?)<\/f>/.exec(c)
        v = f ? '=' + unesc(f[1]) : '='
      } else if (t === 's') {
        const vv = /<v>([\s\S]*?)<\/v>/.exec(c)
        v = vv ? (shared[+vv[1]] ?? '') : ''
      } else if (t === 'inlineStr') {
        v = unesc((c.match(/<t[^>]*>([\s\S]*?)<\/t>/g) || []).map((x) => x.replace(/<[^>]+>/g, '')).join(''))
      } else {
        const vv = /<v>([\s\S]*?)<\/v>/.exec(c)
        v = vv ? vv[1] : ''
      }
      line[ci - 1] = v
      nums[ci - 1] = (!t || t === 'n') && (/<v>/.test(c) || /<f[\s>]/.test(c))
    }
    rows.push({ r: rn, cells: line, nums })
  }
  return { rows }
}

/* 라벨을 넣을 만한 «빈 열» 을 찾아 줍니다 — 비고 칸이 있으면 거기 */
export function suggestLabelCol(zip, path, from, to, maxCol = 16) {
  const g = readGrid(zip, path, from, to, maxCol)
  const used = new Array(maxCol).fill(0)
  for (const row of g.rows) row.cells.forEach((v, i) => { if (String(v).trim()) used[i]++ })
  let lastUsed = 0
  used.forEach((n, i) => { if (n) lastUsed = i + 1 })
  /* 자료 구간 안에서 «전부 빈» 열이 있으면 거기, 없으면 마지막 열 다음 */
  for (let i = 0; i < lastUsed; i++) if (used[i] === 0) return numToCol(i + 1)
  return numToCol(lastUsed + 1)
}
