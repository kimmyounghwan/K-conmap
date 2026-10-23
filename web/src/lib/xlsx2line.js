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
 *    · (G327 부터) 안 벌린 시트에서 이 시트를 가리키는 수식은 «당초» 줄로만 옮깁니다 — 변경 금액은 그 시트도 같이 벌려야
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

   ■ 시트 이름이 붙은 참조(=내역서!G9)도 다룹니다  ← 2026-09-15 에 고친 자리
     소장님: 「원가계산서도 두 줄로 하면 해결되는 거잖아」
     반은 맞습니다. 두 줄로 벌리기만 하면 두 줄 다 여전히 G9 를 봅니다.
     **줄끼리 짝을 맞춰야** 합니다 —
        원가계산서 당초 줄 → 내역서의 «당초» 합계
        원가계산서 변경 줄 → 내역서의 «변경» 합계
     그래서 mapRow 를 시트마다 따로 받습니다(sheetRow).
     ⚠️ 전에는 «내역서!G9» 의 G9 를 제 시트 기준으로 옮겼습니다 — 조용히 틀린 값이 됐습니다.

   문자열("..")은 건너뜁니다. LOG10( 같은 함수 이름도 건드리지 않습니다.
   ══════════════════════════════════════════════════════════ */
const REF_RE = /^(\$?)([A-Za-z]{1,3})(\$?)(\d{1,7})(?![0-9A-Za-z_.(])/
/* 시트이름! — 따옴표로 묶인 것('내 역서'!)과 안 묶인 것(내역서!) 둘 다 */
const SHEET_RE = /^(?:'((?:[^']|'')*)'|([A-Za-z0-9_.\u3131-\uD79D]+))!/

export function mapFormulaRows(f, mapRow, sheetRow) {
  let out = ''
  let i = 0
  while (i < f.length) {
    const prev = i > 0 ? f[i - 1] : ''
    /* ① 시트이름! + 칸 (=내역서!G9 · ='내 역서'!G9) */
    if (!/[A-Za-z0-9_.$!]/.test(prev)) {
      const sm = SHEET_RE.exec(f.slice(i))
      if (sm) {
        const rest = f.slice(i + sm[0].length)
        const rm = REF_RE.exec(rest)
        if (rm) {
          const name = (sm[1] !== undefined ? sm[1].replace(/''/g, "'") : sm[2])
          const fn = sheetRow ? sheetRow(name) : null
          const one = (mm) => {
            const [whole, d1, col, d2, row] = mm
            const nr = fn ? fn(+row) : null      /* 안 벌린 시트면 손대지 않습니다 */
            return nr == null ? whole : `${d1}${col}${d2}${nr}`
          }
          let taken = sm[0].length + rm[0].length
          let piece = sm[0] + one(rm)
          /* 내역서!G3:G8 — 뒤쪽 끝도 «같은 시트» 입니다. 여기를 놓치면 끝만 엉뚱한 데를 봅니다. */
          const after = f.slice(i + taken)
          if (after[0] === ':') {
            const rm2 = REF_RE.exec(after.slice(1))
            if (rm2) { piece += ':' + one(rm2); taken += 1 + rm2[0].length }
          }
          out += piece
          i += taken
          continue
        }
      }
    }
    const ch = f[i]
    if (ch === '"' || ch === "'") {
      const q = ch
      let j = i + 1
      while (j < f.length) {
        if (f[j] === q) { if (f[j + 1] === q) j += 2; else { j++; break } } else j++
      }
      out += f.slice(i, j); i = j; continue
    }
    /* ② 그냥 칸 (=G9) — 앞에 ! 가 있으면 시트 참조의 꼬리라 건드리지 않습니다 */
    if (!/[A-Za-z0-9_.$!]/.test(prev)) {
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

/* 🇰🇷 G377 한셀은 글꼴 · 셀 서식을 <mc:AlternateContent><mc:Choice Requires="hs"><font hs:…>…</mc:Choice><mc:Fallback><font>…</mc:Fallback></mc:AlternateContent> 로 씁니다.
   엑셀은 hs 를 몰라 Fallback 을 씁니다 — 하나로 세어야 번호(fontId · s)가 안 밀립니다.
   전엔 Choice · Fallback 을 둘 다 세고 감싼 것을 버려 번호가 밀리고(글꼴 · 서식이 엉뚱하게) hs 이름표가 풀려 XML 이 깨졌습니다.
   → 고칠 때만(Styler.build) 감싼 것을 Fallback 하나로 바꿔 씁니다(Fallback 이 없으면 Choice 에서 남의 이름표를 뗀 것). */
function 대안풀기(inner, tag) {
  if (!/AlternateContent/.test(inner)) return inner
  return inner.replace(/<([A-Za-z_][\w.-]*):AlternateContent\b[\s\S]*?<\/\1:AlternateContent>/g, (blk) => {
    const fb = /<[A-Za-z_][\w.-]*:Fallback\b[^>]*>([\s\S]*?)<\/[A-Za-z_][\w.-]*:Fallback>/.exec(blk)
    if (fb && new RegExp('<' + tag + '\\b').test(fb[1])) return fb[1]
    const ch = /<[A-Za-z_][\w.-]*:Choice\b[^>]*>([\s\S]*?)<\/[A-Za-z_][\w.-]*:Choice>/.exec(blk)
    return ch ? ch[1].replace(/\s[A-Za-z_][\w.-]*:[\w.-]+="[^"]*"/g, '').replace(/<[A-Za-z_][\w.-]*:[^>]*\/>/g, '').replace(/<([A-Za-z_][\w.-]*):[\w.-]+\b[^>]*>[\s\S]*?<\/\1:[\w.-]+>/g, '') : blk
  })
}

class Styler {
  constructor(xml) {
    this.xml = xml
    this.fontsBlk = sliceList(xml, 'fonts')
    this.xfsBlk = sliceList(xml, 'cellXfs')
    /* 🇰🇷 G377 한셀은 글꼴을 <mc:AlternateContent><mc:Choice Requires="hs"><font hs:…>…</mc:Choice><mc:Fallback><font>…</mc:Fallback></mc:AlternateContent> 로 씁니다.
       엑셀은 hs 를 몰라 Fallback 을 씁니다 — 하나로 세어야 글꼴 번호(fontId)가 안 밀립니다. 전엔 둘 다 세고 감싼 것을 버려 번호가 밀리고 hs 이름표가 풀려(XML 깨짐) 났습니다. */
    this.fonts = this.fontsBlk ? splitItems(대안풀기(this.fontsBlk.inner, 'font'), 'font') : []
    this.xfs = this.xfsBlk ? splitItems(대안풀기(this.xfsBlk.inner, 'xf'), 'xf') : []
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
/* 머리 줄에만 나오는 말 — 이것뿐인 줄은 자료가 아닙니다 */
const HEAD_WORD = /^(단\s*가|금\s*액|수\s*량|단\s*위|재\s*료\s*비|노\s*무\s*비|경\s*비|합\s*계|비\s*고|규\s*격|품\s*명|공\s*종|공\s*종\s*명|명\s*칭|산\s*출\s*근\s*거|코\s*드|번\s*호)$/

/* 🇰🇷 G377 (2026-10-22) 한셀(한컴)이 만든 xlsx 는 본 이름공간 태그에 «이름표» 를 붙입니다 — <x:workbook> <x:sheet> <x:row> <x:c> <x:v> …
   우리 정규식이 하나도 안 걸려 «시트 0개» 로 나와 아무것도 못 바꿨습니다(실제 설계내역서 30부 중 2부 · styles 에 xmlns:hs=haansoft).
   읽기만 하는 qtoxlsx 는 모든 이름표를 떼지만, 여기는 «다시 씁니다» — 그래서 본 이름공간(spreadsheetml main)의 이름표만 떼고
   그 이름공간을 기본(xmlns=)으로 선언합니다. 다른 이름공간(r: · mc: · x14: …)과 이름표 선언(xmlns:x)은 그대로 둡니다. */
const MAIN_NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'
export function 이름표풀기(zip) {
  const nsRe = new RegExp('xmlns:([A-Za-z_][\\w.-]*)="' + MAIN_NS.replace(/[.]/g, '\\.') + '"')
  for (const p of Object.keys(zip)) {
    if (!/^xl\/.*\.xml$/.test(p)) continue
    let x = strFromU8(zip[p])
    const m = nsRe.exec(x)
    if (!m || !x.includes('<' + m[1] + ':')) continue
    x = x.replace(new RegExp('<(/?)' + m[1] + ':', 'g'), '<$1')
    if (!/\sxmlns="[^"]*"/.test(x.slice(0, x.indexOf('>', x.indexOf(m[0])) + 1))) x = x.replace(m[0], 'xmlns="' + MAIN_NS + '" ' + m[0])
    zip[p] = strToU8(x)
  }
  return zip
}

export function analyze(buf) {
  const zip = 이름표풀기(unzipSync(new Uint8Array(buf)))
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
    /* 🩹 G327 머리가 두 줄(«단 가 · 금 액» 아랫줄)이면 그 줄도 머리입니다 — 벌리면 머리가 세 벌이 됩니다 */
    if (first) {
      for (const row of readGrid(zip, path, gs2, gs2 + 2, 40).rows) {
        if (row.r !== gs2) break
        const vals = row.cells.map((v) => String(v).trim()).filter(Boolean)
        if (vals.length >= 2 && !row.nums.some(Boolean) && vals.every((v) => HEAD_WORD.test(v))) gs2++
        else break
      }
    }
    let ge2 = last || maxRow
    if (ge2 < gs2) { gs2 = Math.min(gs2, maxRow || 1); ge2 = maxRow || gs2 }
    /* «자기 합계 열쇠» 를 쓰는 시트는 줄을 벌릴 수 없습니다 — 화면에서 미리 막습니다.
       (아래 keySumRanges 주석을 보십시오. 2026-09-16 에 총액이 0 원이 된 사고) */
    let keySum = 0
    try {
      keySum = countKeySum(xml, gs2, ge2)
    } catch (e) { keySum = 0 }
    sheets.push({ name, path, maxRow, guessStart: gs2, guessEnd: ge2, keySum })
  }
  return { sheets, zip }
}

/* 시트 XML 하나에서 «벌릴 구간과 겹치는» SUMIF/SUMIFS 개수를 셉니다 */
function countKeySum(xml, from, to) {
  const re = /SUMIFS?\s*\(\s*\$?[A-Z]{1,3}\$?(\d+)\s*:\s*\$?[A-Z]{1,3}\$?(\d+)\s*,\s*\$?[A-Z]{1,3}\$?\d+/gi
  let m, n = 0
  while ((m = re.exec(xml))) {
    if (Math.max(+m[1], from) <= Math.min(+m[2], to)) n++
    if (n > 500) break
  }
  return n
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

  const zip = 이름표풀기(unzipSync(new Uint8Array(buf)))   /* 🇰🇷 G377 한셀 이름표 */
  /* 🩹 G327 공유수식은 먼저 풉니다 — 따라가는 칸이 값만 남지 않게 */
  for (const p of Object.keys(zip)) {
    if (!/^xl\/worksheets\/[^/]+\.xml$/.test(p)) continue
    const x = strFromU8(zip[p])
    if (/\st="shared"/.test(x)) zip[p] = strToU8(unshareFormulas(x))
  }
  /* ⚠️ 마지막 빗장 — 화면을 거치지 않고 불러도 «틀린 총액» 을 내보내지 않게 합니다 */
  for (const o of (sheetOpts || [])) {
    if (!zip[o.path]) continue
    const n = countKeySum(strFromU8(zip[o.path]),
                          Math.max(1, +o.startRow || 1), +o.endRow || 0)
    if (n) {
      throw new Error('이 내역서는 «자기 합계 열쇠» 를 씁니다(SUMIF ' + n + '곳). ' +
        '줄을 벌리면 합계가 두 번 세어져 총액이 틀립니다 — 바꾸지 않았습니다.')
    }
  }
  const gs = lines === 3 ? 3 : 2
  const report = { sheets: [], warns: [] }
  const order = sheetOrder(zip)          /* 경로 → 시트 차례(localSheetId) */
  const lastRowOf = {}                   /* 경로 → 바뀐 뒤 마지막 행 */

  const stylesPath = 'xl/styles.xml'
  const styler = new Styler(zip[stylesPath] ? strFromU8(zip[stylesPath]) : '<styleSheet/>')

  const jobs = sheetOpts && sheetOpts.length
    ? sheetOpts
    : sheetPaths.map((path) => ({ path, startRow, endRow, labelCol }))

  /* ① 먼저 «계획» 을 전부 세웁니다 — 시트를 넘나드는 수식의 짝을 맞추려면
        내가 벌리기 전에 «상대 시트가 몇 행으로 가는지» 를 알아야 합니다.
        (소장님: 「원가계산서도 두 줄로 하면 해결되는 거잖아」 — 짝을 맞춰야 해결됩니다) */
  const nameOf = sheetNames(zip)
  const plans = new Map()        /* 시트이름 → {dup, mapBase, labelCol} */
  for (const job of jobs) {
    if (!zip[job.path]) continue
    const nm = nameOf[job.path]
    if (!nm) continue
    plans.set(nm, {
      ...planSheet(strFromU8(zip[job.path]), {
        startRow: job.startRow ?? startRow,
        endRow: job.endRow ?? endRow,
        gs, skipEmpty,
      }),
      labelCol: (job.labelCol ?? labelCol) || '',
    })
  }

  for (const job of jobs) {
    const path = job.path
    if (!zip[path]) continue
    const xml = strFromU8(zip[path])
    const res = convertSheet(xml, {
      startRow: job.startRow ?? startRow,
      endRow: job.endRow ?? endRow,
      labelCol: job.labelCol ?? labelCol,
      gs, labels, color, diffFormula, skipEmpty, plans, selfName: nameOf[path],
    }, styler)
    zip[path] = strToU8(res.xml)
    report.sheets.push({ path, ...res.stat })
    lastRowOf[path] = res.stat.lastRow
    for (const w of res.warns) report.warns.push({ path, ...w })
  }

  /* 🩹 G327 안 벌린 시트(원가계산서 등)가 벌린 시트를 가리키면 «당초» 줄로 옮깁니다 */
  const chosenPaths = new Set(jobs.map((j) => j.path))
  for (const [p, nm] of Object.entries(nameOf)) {
    if (chosenPaths.has(p) || !zip[p]) continue
    const r = remapOtherSheet(strFromU8(zip[p]), { plans, selfName: nm, labels, gs })
    if (r.n) zip[p] = strToU8(r.xml)
    for (const w of r.warns) report.warns.push({ path: p, ...w })
  }
  /* 같은 칸 · 같은 말은 한 번만(당초 · 변경 줄이 같은 말을 두 번 냅니다) */
  {
    const seen = new Set()
    report.warns = report.warns.filter((w) => { const key = `${w.path}|${w.ref}|${w.msg}`; if (seen.has(key)) return false; seen.add(key); return true })
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
      return tag.replace(body, () => nb)
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

/* ── 시트 «계획» ─────────────────────────────────
   바꾸기 전에 «어느 행을 벌리고, 그 행이 몇 행으로 가는지» 만 먼저 셉니다.
   다른 시트의 수식이 이 시트를 가리킬 때 그 짝을 찾으려면 계획이 먼저 있어야 합니다. */
function planSheet(xml, o) {
  const { startRow, endRow, gs, skipEmpty } = o
  const sdOpen = /<sheetData\b[^>]*>/.exec(xml)
  if (!sdOpen) return { dup: new Set(), mapBase: (r) => r, maxRn: 0 }
  const sdInnerStart = sdOpen.index + sdOpen[0].length
  const sdEnd = xml.indexOf('</sheetData>', sdInnerStart)
  const body = xml.slice(sdInnerStart, sdEnd)
  const rows = body.match(/<row\b[^>]*\/>|<row\b[^>]*>[\s\S]*?<\/row>/g) || []
  const info = rows.map((r) => {
    const rn = +(attr(r, 'r') || 0)
    const cells = r.match(/<c\b[^>]*\/>|<c\b[^>]*>[\s\S]*?<\/c>/g) || []
    return { rn, filled: cells.filter((c) => /<v>|<is>|<f/.test(c)).length }
  })
  const maxRn = info.length ? Math.max(...info.map((x) => x.rn)) : 0
  const last = endRow || maxRn
  const dup = new Set()
  for (const it of info) {
    if (it.rn < startRow || it.rn > last) continue
    if (skipEmpty && it.filled === 0) continue
    dup.add(it.rn)
  }
  const newOf = new Map()
  let cur = 0
  for (let r = 1; r <= maxRn; r++) { cur += 1; newOf.set(r, cur); if (dup.has(r)) cur += gs - 1 }
  return { dup, mapBase: (r) => (newOf.has(r) ? newOf.get(r) : r), maxRn }
}

/* ── 시트 한 장 ──────────────────────────────── */
function convertSheet(xml, o, styler) {
  const { startRow, endRow, gs, labels, labelCol, color, diffFormula, skipEmpty, plans, selfName } = o
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
            plans, selfName,
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

      /* 🩹 G377 (2026-10-22) 빈 줄이 «<row … />» (닫힌 꼴)로 적힌 시트 — 전에는 그 뒤에 «</row>» 를 또 붙여 XML 이 깨졌습니다
         (실제 설계내역서 30부 중에서 나옴 — 엑셀은 «내용에 문제가 있다» 며 고치고 줄을 버림). 닫힌 꼴이면 여는 꼴로 바꿔 씁니다. */
      outRows.push(`${selfClose ? newOpen.replace(/\s*\/>$/, '>') : newOpen}${newCells.join('')}</row>`)
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
  const { srcRow, k, gs, dup, mapBase, labelCol, labels, col, warns, ref, plans, selfName } = ctx
  const fm = /<f\b([^>]*)(?:\/>|>([\s\S]*?)<\/f>)/.exec(cInner)
  if (!fm) return cInner
  const fAttrs = fm[1] || ''
  /* ⚠️ 엑셀은 수식 안의 한글을 «&#45236;&#50669;&#49436;!G9» 처럼 숫자 기호로 씁니다.
     풀어서 다루고 쓸 때 다시 묶지 않으면 «내역서!» 라는 시트 이름을 못 알아봅니다. */
  let ftext = unesc(fm[2] || '')
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
  /* 🩹 G377 (2026-10-22) 배열 수식(<f t="array" ref="F3">)은 «배열» 표시와 ref 를 그 줄로 옮겨 남깁니다.
     전에는 <f> 로만 다시 써 보통 수식이 되어 =시트!AA12:AE12 같은 가로 범위가 #VALUE! 가 됐습니다(실제 설계예산내역서 총액 칸 · 2억 원이 #VALUE!). */
  const nr = dup.has(srcRow) ? mapBase(srcRow) + k : mapBase(srcRow)
  const 새f = (nf) => {
    let at = ''
    if (/\st="array"/.test(fAttrs)) {
      const 태그 = '<f' + fAttrs.replace(/\/$/, '') + '>'
      const rf = attr(태그, 'ref') || ''
      const d = nr - srcRow
      const nrf = rf.replace(/([A-Za-z]{1,3})(\d+)/g, (_, c, r) => c + (+r + d))
      at = ' t="array"' + (nrf ? ` ref="${nrf}"` : '')
      const aca = attr(태그, 'aca')
      if (aca) at += ` aca="${aca}"`
    }
    return cInner.replace(/<f\b[^>]*(?:\/>|>[\s\S]*?<\/f>)/, () => `<f${at}>${esc(nf)}</f>`)
  }
  /* 다른 시트를 가리키는 참조 — «같은 줄끼리» 짝을 맞춥니다.
     당초 줄은 상대의 당초 줄을, 변경 줄은 상대의 변경 줄을 봅니다.
     안 벌린 시트면 null 을 돌려 손대지 않습니다. */
  const sheetRow = (name) => {
    if (!plans || !name) return null
    if (selfName && name === selfName) return mapRow
    const pl = plans.get(name)
    if (!pl) return null
    return (r) => (pl.dup.has(r) ? pl.mapBase(r) + k : pl.mapBase(r))
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
        const nf = 줄합식({ dup }, r1, r2, word, labels, gs, `${c1}${n1}:${c2}${n2}`, `$${L}$${n1}:$${L}$${n2}`)
        return 새f(nf)
      }
      warns.push({ ref, msg: `합계가 당초·변경을 모두 더합니다 — 라벨 열을 지정하면 줄별로 갈라 드립니다 (${plain})` })
      const nf = `SUM(${c1}${n1}:${c2}${n2})`
      return 새f(nf)
    }
  }

  /* 🩹 G327 — 식 «안» 의 SUM(범위)도 줄별로 가릅니다(조달수수료 · 공구손료 같은 %줄) */
  const o = { k, isDup: dup.has(srcRow), self: { dup, mapBase, labelCol }, selfName, plans, labels, gs, warns, ref, holes: [],
    mapText: (t) => mapFormulaRows(t, mapRow, sheetRow) }
  const t1 = sumInside(ftext, o)
  rangeWarn(t1, o)
  let nf = mapFormulaRows(t1, mapRow, sheetRow)
  nf = nf.replace(/"§(\d+)§"/g, (_, n) => o.holes[+n])
  /* 공유수식은 풀어서 보통 수식으로 저장합니다 (원본 si/ref 를 버립니다) */
  return 새f(nf)
}

/* ══════════════════════════════════════════════════════════
   🩹 2026-10-20 G327 — 식 «안» 의 SUM(범위) · 안 벌린 시트 · 공유수식
   소장님 「내역서 부터 차례 차례 검증하자」 — 실제 내역서를 넣어 보니 셋이 틀렸습니다.
   ① 조달수수료 =IF($E36=0,0,ROUNDDOWN((SUM(G34:G35)+G37)*0.0054/$E36,0)) 를 벌리면
      G34:G35 가 G98:G101(당초 · 변경 · 증감 · 당초)이 되어 «두 번» 셉니다
      → 당초 직접재료비 +432,462원 · 아무것도 안 바꿨는데 도급액 증감 −511,048원.
      (전에는 식 «전체» 가 SUM(범위)일 때만 SUMIF 로 갈랐습니다)
   ② 원가계산서를 같이 안 고르면(화면 기본) =내역서!$G$54 가 옛 행을 가리킨 채 남아
      다시 셈하면 직접재료비 0원 · 도급액 0원 — 그런데 화면은 «고치지 못한 수식은 없습니다».
      → 안 벌린 시트의 수식도 «당초» 줄을 보게 옮기고, 그렇게 했다고 알립니다.
   ③ 공유수식(엑셀이 «아래로 채우기» 를 줄여 적은 것)의 따라가는 칸은 값만 남겨
      변경 수량을 고쳐도 금액이 안 바뀌었습니다 → 벌리기 전에 보통 수식으로 풉니다.
   ══════════════════════════════════════════════════════════ */
const RANGE_SCAN = /^(?:('(?:[^']|'')*'|[A-Za-z0-9_.ㄱ-힝]+)!)?(\$?)([A-Za-z]{1,3})(\$?)(\d{1,7}):(\$?)([A-Za-z]{1,3})(\$?)(\d{1,7})(?![0-9A-Za-z_.(])/
const 시트이름풀기 = (p) => (p ? (p.startsWith("'") ? p.slice(1, -1).replace(/''/g, "'") : p) : '')

/* 범위가 «벌린 행» 을 둘 넘게 품는가 */
function 범위품음(pl, r1, r2) {
  if (!pl || r2 <= r1) return false
  for (const d of pl.dup) if (d >= r1 && d <= r2) return true
  return false
}
/* 이 범위가 가리키는 시트의 계획 — 제 시트면 self, 남의 시트면 plans 에서 */
function 범위계획(m, o) {
  const name = m[1] ? 시트이름풀기(m[1]) : ''
  if (!name || name === o.selfName) return o.self
  return (o.plans && o.plans.get(name)) || null
}

/* 벌린 범위에서 «이 줄(word)» 만 더하는 식.
   범위 안에 안 벌린 행(머리 · 빈 줄 · 구간 밖 줄)이 있으면 그 행은 라벨이 없어 SUMIF(…,"당초") 에서 빠집니다
   → 그때는 «전체 − 다른 줄» 로 셉니다(안 벌린 행은 그대로 들어갑니다).
   sumR · labR 은 다 옮긴 범위 글, crit 은 SUMIFS 에 덧붙일 «,조건범위,조건» */
function 줄합식(pl, r1, r2, word, labels, gs, sumR, labR, crit = '') {
  let 모두 = r2 - r1 <= 100000
  if (모두) for (let r = r1; r <= r2; r++) if (!pl.dup.has(r)) { 모두 = false; break }
  if (모두) return crit ? `SUMIFS(${sumR}${crit},${labR},"${word}")` : `SUMIF(${labR},"${word}",${sumR})`
  const others = labels.slice(0, gs).filter((w) => w !== word)
  const all = crit ? `SUMIFS(${sumR}${crit})` : `SUM(${sumR})`
  return '(' + all + others.map((w) => (crit ? `-SUMIFS(${sumR}${crit},${labR},"${w}")` : `-SUMIF(${labR},"${w}",${sumR})`)).join('') + ')'
}

/* 여는 괄호 바로 뒤(pos)부터 인자를 나눕니다 — 글자 · 안쪽 괄호는 건너뜁니다. 못 닫히면 null */
function splitArgs(f, pos) {
  let j = pos, depth = 0, start = pos
  const args = []
  while (j < f.length) {
    const c = f[j]
    if (c === '"' || c === "'") {
      const q = c; j++
      while (j < f.length) { if (f[j] === q) { if (f[j + 1] === q) j += 2; else { j++; break } } else j++ }
      continue
    }
    if (c === '(') depth++
    else if (c === ')') { if (depth === 0) { args.push([start, j]); return { args, end: j } } depth-- }
    else if (c === ',' && depth === 0) { args.push([start, j]); start = j + 1 }
    j++
  }
  return null
}

/* SUM( … ) 의 인자 가운데 «한 열 범위» 가 벌린 행을 품으면 SUMIF(라벨 열, "당초|변경|증감", 범위) 로 바꿉니다.
   바꾼 글은 mapFormulaRows 가 다시 손대지 않게 "§n§" 자리표로 두고 o.holes 에 담습니다. */
export function sumInside(f, o) {
  let out = ''
  let i = 0
  while (i < f.length) {
    const ch = f[i]
    if (ch === '"') {
      let j = i + 1
      while (j < f.length) { if (f[j] === '"') { if (f[j + 1] === '"') j += 2; else { j++; break } } else j++ }
      out += f.slice(i, j); i = j; continue
    }
    const prev = i > 0 ? f[i - 1] : ''
    /* 🩹 G377 (2026-10-22) COUNTIF · COUNTIFS · SUMIFS — 범위가 벌린 행을 품으면 «라벨 열 = 이 줄» 조건을 하나 더 붙입니다.
       실제 설계내역서: 총괄표 «세부항목수» =COUNTIF('공종별 내역서'!$B$4:$B$754,B10) 가 벌린 뒤 두 배(48 → 96)로 셌습니다(전엔 «손으로 확인» 알림만). */
    const ifsm = !/[A-Za-z0-9_.$!]/.test(prev) && /^(COUNTIFS?|SUMIFS)\(/i.exec(f.slice(i, i + 9))
    if (ifsm && o.mapText) {
      const fn = ifsm[1].toUpperCase()
      const a = splitArgs(f, i + fn.length + 1)
      const t = a ? a.args.map(([x, y]) => f.slice(x, y).trim()) : []
      /* 범위 자리: COUNTIF = 0 · COUNTIFS = 0,2,4… · SUMIFS = 0(합), 1,3,5… */
      const 범위자리 = fn === 'COUNTIF' ? (t.length === 2 ? [0] : null)
        : fn === 'COUNTIFS' ? (t.length >= 2 && t.length % 2 === 0 ? t.map((_, k) => k).filter((k) => k % 2 === 0) : null)
          : (t.length >= 3 && t.length % 2 === 1 ? t.map((_, k) => k).filter((k) => k === 0 || k % 2 === 1) : null)
      if (a && 범위자리) {
        const ms = 범위자리.map((k) => RANGE_SCAN.exec(t[k]))
        const 다범위 = ms.every((m, j) => m && m[0].length === t[범위자리[j]].length)
        const pl = 다범위 ? 범위계획(ms[0], o) : null
        const r1 = 다범위 ? +ms[0][5] : 0, r2 = 다범위 ? +ms[0][9] : 0
        const 같은줄 = 다범위 && ms.every((m) => 범위계획(m, o) === pl && +m[5] === r1 && +m[9] === r2 && m[3].toUpperCase() === m[7].toUpperCase())
        if (pl && pl.labelCol && 같은줄 && 범위품음(pl, r1, r2)) {
          const word = o.isDup ? (o.labels[o.k] || o.labels[0]) : o.labels[0]
          const L = pl.labelCol.toUpperCase()
          const n1 = pl.mapBase(r1), n2 = pl.mapBase(r2) + (pl.dup.has(r2) ? o.gs - 1 : 0)
          const rg = (m) => `${m[1] ? m[1] + '!' : ''}${m[2]}${m[3]}${m[4]}${n1}:${m[6]}${m[7]}${m[8]}${n2}`
          const p = ms[0][1] ? ms[0][1] + '!' : ''
          const labR = `${p}$${L}$${n1}:$${L}$${n2}`
          const 새인자 = t.map((x, k) => { const j = 범위자리.indexOf(k); return j >= 0 ? rg(ms[j]) : o.mapText(x) }).join(',')
          let 모두 = r2 - r1 <= 100000
          if (모두) for (let r = r1; r <= r2; r++) if (!pl.dup.has(r)) { 모두 = false; break }
          const others = o.labels.slice(0, o.gs).filter((w) => w !== word)
          let 식
          if (fn === 'SUMIFS') 식 = 모두 ? `SUMIFS(${새인자},${labR},"${word}")` : '(' + `SUMIFS(${새인자})` + others.map((w) => `-SUMIFS(${새인자},${labR},"${w}")`).join('') + ')'
          else 식 = 모두 ? `COUNTIFS(${새인자},${labR},"${word}")` : '(' + `${fn}(${새인자})` + others.map((w) => `-COUNTIFS(${새인자},${labR},"${w}")`).join('') + ')'
          o.holes.push(식)
          out += `"§${o.holes.length - 1}§"`
          i = a.end + 1
          continue
        }
      }
    }
    /* SUMIF(조건범위, 조건, 합범위) — 범위가 벌린 행을 품으면 SUMIFS(…, 라벨 열, "당초") 로
       (원가계산서 A값 =SUMIF($D$3:$D$22,"O",$B$3:$B$22) · 관급 =SUMIF(내역서!N:N,"관급",…) 같은 것) */
    const ifm = !/[A-Za-z0-9_.$!]/.test(prev) && /^SUMIF\(/i.exec(f.slice(i, i + 6))
    if (ifm) {
      const a = splitArgs(f, i + 6)
      if (a && (a.args.length === 2 || a.args.length === 3)) {
        const t = a.args.map(([x, y]) => f.slice(x, y).trim())
        const m1 = RANGE_SCAN.exec(t[0]), m3 = RANGE_SCAN.exec(t[2] ?? t[0])
        const full = (m, s) => m && m[0].length === s.length
        if (full(m1, t[0]) && full(m3, t[2] ?? t[0])) {
          const pl = 범위계획(m1, o), pl3 = 범위계획(m3, o)
          const r1 = +m1[5], r2 = +m1[9], q1 = +m3[5], q2 = +m3[9]
          const 한열 = m1[3].toUpperCase() === m1[7].toUpperCase() && m3[3].toUpperCase() === m3[7].toUpperCase()
          if (pl && pl === pl3 && pl.labelCol && 한열 && r1 === q1 && r2 === q2 && 범위품음(pl, r1, r2) && o.mapText) {
            const word = o.isDup ? (o.labels[o.k] || o.labels[0]) : o.labels[0]
            const L = pl.labelCol.toUpperCase()
            const n1 = pl.mapBase(r1), n2 = pl.mapBase(r2) + (pl.dup.has(r2) ? o.gs - 1 : 0)
            const rg = (m) => `${m[1] ? m[1] + '!' : ''}${m[2]}${m[3]}${m[4]}${n1}:${m[6]}${m[7]}${m[8]}${n2}`
            const p = m1[1] ? m1[1] + '!' : ''
            o.holes.push(줄합식(pl, r1, r2, word, o.labels, o.gs, rg(m3), `${p}$${L}$${n1}:$${L}$${n2}`, `,${rg(m1)},${o.mapText(t[1])}`))
            out += `"§${o.holes.length - 1}§"`
            i = a.end + 1
            continue
          }
        }
      }
    }
    if (!/[A-Za-z0-9_.$!]/.test(prev) && /^SUM\(/i.test(f.slice(i, i + 4))) {
      let j = i + 4, depth = 0, start = j
      const args = []
      while (j < f.length) {
        const c = f[j]
        if (c === '"' || c === "'") {
          const q = c; j++
          while (j < f.length) { if (f[j] === q) { if (f[j + 1] === q) j += 2; else { j++; break } } else j++ }
          continue
        }
        if (c === '(') depth++
        else if (c === ')') { if (depth === 0) break; depth-- }
        else if (c === ',' && depth === 0) { args.push([start, j]); start = j + 1 }
        j++
      }
      if (j >= f.length) { out += f.slice(i); break }      /* 괄호가 안 닫힘 — 그대로 둡니다 */
      args.push([start, j])
      const parts = args.map(([a, b]) => {
        const raw = f.slice(a, b)
        const s = raw.trim()
        const m = RANGE_SCAN.exec(s)
        if (!m || m[0].length !== s.length) return sumInside(raw, o)    /* 범위가 아니면 안쪽을 다시 봅니다 */
        const pl = 범위계획(m, o)
        const c1 = m[3].toUpperCase(), c2 = m[7].toUpperCase(), r1 = +m[5], r2 = +m[9]
        if (!범위품음(pl, r1, r2)) return raw
        if (c1 !== c2 || !pl.labelCol) return raw             /* 못 가름 — rangeWarn 이 알립니다 */
        const word = o.isDup ? (o.labels[o.k] || o.labels[0]) : o.labels[0]
        if (!o.isDup && pl === o.self) {
          o.warns.push({ ref: o.ref, msg: `합계 칸이 자료 구간 밖이라 범위 ${s} 는 «당초» 만 더했습니다 — 이 행까지 구간에 넣으면 줄별로 갈라집니다` })
        }
        const L = pl.labelCol.toUpperCase()
        const n1 = pl.mapBase(r1)
        const n2 = pl.mapBase(r2) + (pl.dup.has(r2) ? o.gs - 1 : 0)
        const p = m[1] ? m[1] + '!' : ''
        o.holes.push(줄합식(pl, r1, r2, word, o.labels, o.gs, `${p}${m[2]}${c1}${m[4]}${n1}:${m[6]}${c2}${m[8]}${n2}`, `${p}$${L}$${n1}:$${L}$${n2}`))
        return `"§${o.holes.length - 1}§"`
      })
      out += f.slice(i, i + 4) + parts.join(',') + ')'
      i = j + 1
      continue
    }
    out += ch; i++
  }
  return out
}

/* SUMIF 로 못 가른 범위가 벌린 행을 품으면 «숨기지 않고» 알립니다 */
function rangeWarn(f, o) {
  let i = 0
  while (i < f.length) {
    const ch = f[i]
    if (ch === '"') {
      let j = i + 1
      while (j < f.length) { if (f[j] === '"') { if (f[j + 1] === '"') j += 2; else { j++; break } } else j++ }
      i = j; continue
    }
    const prev = i > 0 ? f[i - 1] : ''
    if (!/[A-Za-z0-9_.$!]/.test(prev)) {
      const m = RANGE_SCAN.exec(f.slice(i))
      if (m) {
        if (범위품음(범위계획(m, o), +m[5], +m[9])) {
          o.warns.push({ ref: o.ref, msg: `범위 ${m[0]} 가 당초 · 변경 줄을 함께 봅니다 — 줄별로 못 갈랐습니다. 이 칸은 손으로 확인해 주십시오` })
          return
        }
        i += m[0].length; continue
      }
    }
    i++
  }
}

/* 안 벌린 시트(보통 원가계산서)의 수식이 벌린 시트를 가리키면 «당초» 줄을 보게 옮깁니다 */
function remapOtherSheet(xml, o) {
  const { plans, selfName, labels, gs } = o
  const warns = []
  const targets = new Set()
  let n = 0
  const names = [...plans.keys()].filter((nm) => nm !== selfName)
  if (!names.length) return { xml, n, warns }
  const out = xml.replace(/<c\b[^>]*?(?:\/>|>[\s\S]*?<\/c>)/g, (c) => {
    const fm = /<f\b([^>]*)>([\s\S]*?)<\/f>/.exec(c)
    if (!fm || !fm[2]) return c
    const ftext = unesc(fm[2])
    let hit = false
    for (const nm of names) {
      if (ftext.includes(nm + '!') || ftext.includes(`'${nm.replace(/'/g, "''")}'!`)) { hit = true; targets.add(nm) }
    }
    if (!hit) return c
    n++
    const ref = attr(/<c\b[^>]*?(\/?)>/.exec(c)[0], 'r') || ''
    const sheetRow = (name) => {
      if (!name || name === selfName) return null
      const pl = plans.get(name)
      return pl ? (r) => pl.mapBase(r) : null
    }
    const oo = { k: 0, isDup: false, self: null, selfName, plans, labels, gs, warns, ref, holes: [],
      mapText: (t) => mapFormulaRows(t, (r) => r, sheetRow) }
    const t1 = sumInside(ftext, oo)
    rangeWarn(t1, oo)
    let nf = mapFormulaRows(t1, (r) => r, sheetRow)
    nf = nf.replace(/"§(\d+)§"/g, (_, i) => oo.holes[+i])
    if (nf === ftext) return c
    return c.replace(fm[0], () => `<f${fm[1]}>${esc(nf)}</f>`)
  })
  if (n) {
    warns.unshift({ ref: '', msg: `이 시트의 수식 ${n}칸이 «${[...targets].join(' · ')}» 를 가리킵니다 — 벌린 뒤의 «당초» 줄을 보게 했습니다(값은 원본과 같습니다). 변경 · 증감 금액도 이 시트에서 보시려면 이 시트도 같이 골라 바꾸십시오` })
  }
  return { xml: out, n, warns }
}

/* 공유수식을 보통 수식으로 풉니다 — 따라가는 칸은 원본 칸의 식을 자리만큼 옮겨 씁니다 */
export function unshareFormulas(xml) {
  const cellRe = /<c\b[^>]*?(?:\/>|>[\s\S]*?<\/c>)/g
  const masters = new Map()
  for (const m of xml.matchAll(cellRe)) {
    const c = m[0]
    const fm = /<f\b([^>]*)>([\s\S]*?)<\/f>/.exec(c)
    if (!fm || !/\st="shared"/.test(fm[1]) || !fm[2]) continue
    const si = attr(`<f${fm[1]}>`, 'si')
    const sp = splitRef(attr(/<c\b[^>]*?(\/?)>/.exec(c)[0], 'r') || '')
    if (si != null && sp) masters.set(si, { text: unesc(fm[2]), row: sp.row, col: colToNum(sp.col) })
  }
  if (!masters.size) return xml
  return xml.replace(cellRe, (c) => {
    const fm = /<f\b([^>]*?)(\/>|>([\s\S]*?)<\/f>)/.exec(c)
    if (!fm || !/\st="shared"/.test(fm[1])) return c
    if (fm[3]) return c.replace(fm[0], () => `<f>${fm[3]}</f>`)          /* 원본 칸 — 본문 그대로, 공유 표시만 뗍니다 */
    const ms = masters.get(attr(`<f${fm[1]}>`, 'si'))
    const sp = splitRef(attr(/<c\b[^>]*?(\/?)>/.exec(c)[0], 'r') || '')
    if (!ms || !sp) return c
    return c.replace(fm[0], () => `<f>${esc(shiftFormula(ms.text, sp.row - ms.row, colToNum(sp.col) - ms.col))}</f>`)
  })
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
    /* 🩹 G378 (2026-10-22) — 품목 «자기» 세로 병합(그 품목 줄 + 아래 빈 줄 — 칸을 두 줄 높이로 보이게 한 꼴)은
         벌린 줄마다 따로 둡니다. 전엔 당초 · 변경을 한 병합으로 덮어 «변경» 줄 값이 병합 안에 숨었습니다
         (실측: 산림 설계내역서 총괄 — 모든 품목이 두 줄 세로 병합). 당초(· 변경)는 한 줄, 마지막 줄이 아래 빈 줄까지 병합.
         여러 품목을 덮는 병합(공종 이름을 세로로 합친 것)은 전처럼 늘립니다. */
    if (r2 > r1 && dup.has(r1)) {
      let 벌린 = 0
      for (let r = r1; r <= r2; r++) if (dup.has(r)) 벌린++
      if (벌린 === 1) {
        for (let k = 0; k < gs - 1; k++) if (m[1] !== m[3]) out.push(`<mergeCell ref="${m[1]}${n1 + k}:${m[3]}${n1 + k}"/>`)
        out.push(`<mergeCell ref="${m[1]}${n1 + gs - 1}:${m[3]}${n2}"/>`)
        continue
      }
    }
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

/* 라벨을 넣을 만한 «빈 열» 을 찾아 줍니다 — 비고 칸이 있으면 거기
 *
 * ⚠️ 2026-09-16 고침 — 여기서 «총액이 0 원이 되는» 사고가 났습니다.
 *    예전에는 A~P(16칸)만 보고 「마지막 칸 다음」을 골랐습니다. 그런데 적산 프로그램이
 *    만든 설계내역서는 Q·R 열을 «자기 합계 열쇠» 로 씁니다 (=SUMIF(R6:R17,Q5,M6:M17)).
 *    16칸까지만 보면 Q 가 비어 보여서 거기에 「당초/변경」 을 써 넣었고,
 *    그 순간 내역서의 모든 SUMIF 가 못 찾게 되어 총액이 0 원이 되었습니다.
 *    파일은 멀쩡히 열리고 인쇄도 됩니다 — 그래서 아무도 못 알아챕니다.
 *    → 이제 시트 «전체» 를 보고, 어디에도 글자가 없는 칸만 고릅니다. */
const WIDE_COL = 64          /* Q·R 를 놓치지 않을 만큼 넓게 */

export function suggestLabelCol(zip, path, from, to, maxCol = 16) {
  const all = readGrid(zip, path, 1, 1048576, WIDE_COL)
  const everUsed = new Array(WIDE_COL).fill(0)
  for (const row of all.rows) row.cells.forEach((v, i) => { if (String(v).trim()) everUsed[i]++ })
  const g = readGrid(zip, path, from, to, maxCol)
  const used = new Array(maxCol).fill(0)
  for (const row of g.rows) row.cells.forEach((v, i) => { if (String(v).trim()) used[i]++ })
  let lastUsed = 0
  used.forEach((n, i) => { if (n) lastUsed = i + 1 })
  /* 🩹 G378 (2026-10-22) — 자료 구간에서 «가로로 병합된» 칸은 빼고 고릅니다.
       병합 칸 안(맨 왼쪽이 아닌 칸)에 쓴 «당초 · 변경» 은 엑셀 · 한셀에서 안 보이고, 맨 왼쪽 칸이면 글이 옆 칸까지 퍼집니다
       (실측: 내역 시트 없이 갑지 · 원가계산서만 든 실제 설계내역서 — 첫 시트 갑지가 골라져 라벨이 모두 병합 칸 안에 들어감). */
  const 덮인 = new Set()
  if (zip[path]) {
    const mx = strFromU8(zip[path])
    const re = /<mergeCell\b[^>]*\bref="\$?([A-Z]{1,3})\$?(\d+):\$?([A-Z]{1,3})\$?(\d+)"/g
    let m
    while ((m = re.exec(mx))) {
      const c1 = colToNum(m[1]), c2 = colToNum(m[3]), r1 = +m[2], r2 = +m[4]
      if (c2 > c1 && Math.max(r1, from) <= Math.min(r2, to)) for (let c = c1; c <= c2; c++) 덮인.add(c - 1)
    }
  }
  /* ① 자료 구간 안에서 비어 있고, «시트 어디에도» 안 쓰인 칸 */
  for (let i = 0; i < lastUsed; i++) if (used[i] === 0 && everUsed[i] === 0 && !덮인.has(i)) return numToCol(i + 1)
  /* ② 없으면 시트 전체에서 처음으로 비어 있는 칸 */
  for (let i = lastUsed; i < WIDE_COL; i++) if (!everUsed[i] && !덮인.has(i)) return numToCol(i + 1)
  return numToCol(WIDE_COL)
}

/* 이 시트가 «자기 합계 열쇠» 를 쓰는가 — 쓰면 줄을 벌릴 수 없습니다.
 *
 *  =SUMIF(R6:R17, Q5, M6:M17)   <- R 열에 코드, Q 열에 찾을 코드
 *  줄을 당초·변경으로 벌리면 같은 코드가 두 벌이 되어 합계가 «두 배» 가 됩니다.
 *  라벨 열을 딴 데로 옮겨도 이건 안 고쳐집니다 — 구조 자체가 안 맞습니다.
 *  그래서 «고쳐서 내놓지 않고» 못 한다고 알립니다. 틀린 총액을 내는 것보다 낫습니다.
 *
 *  실제로 잰 것(2026-09-16): 설계내역서 총액 1,034,244원 -> 0원.
 *  모은 내역서 1,086부 가운데 43부(4.0%)가 이 모양입니다.
 */
export function keySumRanges(zip, path, from, to) {
  if (!zip[path]) return []
  const xml = strFromU8(zip[path])
  const out = []
  const re = /SUMIFS?\s*\(\s*\$?([A-Z]{1,3})\$?(\d+)\s*:\s*\$?([A-Z]{1,3})\$?(\d+)\s*,\s*\$?([A-Z]{1,3})\$?(\d+)/gi
  let m
  while ((m = re.exec(xml))) {
    const r1 = +m[2], r2 = +m[4]
    /* 벌릴 구간과 «겹치는» 것만 셉니다. 딴 시트·딴 구간을 보는 SUMIF 는 괜찮습니다 */
    if (Math.max(r1, from) <= Math.min(r2, to)) {
      out.push({ range: m[1] + r1 + ':' + m[3] + r2, crit: m[5] + m[6] })
      if (out.length >= 200) break
    }
  }
  return out
}


/* 시트 파일경로 → 시트 이름 */
function sheetNames(zip) {
  const out = {}
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
    const path = relMap[attr(m[0], 'r:id') || attr(m[0], 'id')]
    if (path) out[path] = unesc(attr(m[0], 'name') || '')
  }
  return out
}
