/**
 * K-적산 셈 엔진 — `kqto.py` 의 읽기·셈하기·검산·내보내기를 브라우저로 옮긴 것입니다 (2026-09-16).
 *
 * ⚠️ PC 프로그램(`K-적산/kqto.py`)과 «같은 수량» 을 내야 합니다.
 *    한쪽만 고치지 마십시오. 맞는지는 tools/시험_적산.mjs 가 봅니다.
 *
 * ⚠️ 도면(.dxf)은 여기서 안 읽습니다. 사이트에서는 «캐드가 낸 산출단위 CSV» 만 받습니다.
 *    도면 파일은 사이트에 올리지도, 읽지도 않습니다 — 남의 설계도면입니다.
 */
import { calc, SusikError } from './susik.js'
import { readWorkbook, writeWorkbook, ST } from './qtoxlsx.js'

export const VER = '1.0'
const MM_BIG = 1000.0
const HUGE = 1000000.0
const MM_DOUBT = 100.0

const txt = (x) => {
  if (x === null || x === undefined) return ''
  if (typeof x === 'number' && Number.isInteger(x)) return String(x)
  return String(x).trim()
}
const numOf = (x, d) => {
  const t = String(x === null || x === undefined ? '' : x).replace(/,/g, '').trim()
  if (t === '') return d === undefined ? null : d
  const v = Number(t)
  return Number.isFinite(v) ? v : (d === undefined ? null : d)
}
function fmt(x, prec) {
  let s = Number(x).toFixed(prec === undefined ? 4 : prec)
  if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '')
  return (s === '' || s === '-') ? '0' : s
}

/* ───────────────────────────────────────────── 산출단위 CSV 읽기 */

/** 따옴표를 지키며 CSV 한 줄을 가릅니다 */
function csvRows(s) {
  const out = []
  let row = [], cur = '', q = false
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (q) {
      if (c === '"') { if (s[i + 1] === '"') { cur += '"'; i++ } else q = false }
      else cur += c
    } else if (c === '"') q = true
    else if (c === ',') { row.push(cur); cur = '' }
    else if (c === '\n') { row.push(cur); out.push(row); row = []; cur = '' }
    else if (c === '\r') { /* 넘김 */ }
    else cur += c
  }
  if (cur !== '' || row.length) { row.push(cur); out.push(row) }
  return out
}

/** 캐드에서 내보낸 산출단위 CSV -> [{칸이름: 값}] */
export function readUnits(text) {
  const lines = csvRows(text).filter((r) => r.some((c) => String(c).trim() !== '') &&
    !String(r[0] || '').trim().startsWith('#'))
  if (!lines.length) throw new Error('산출단위 파일이 비어 있습니다.')
  const hdr = lines[0].map((h) => String(h).replace(/^﻿/, '').trim())
  const out = []
  for (let i = 1; i < lines.length; i++) {
    const d = {}
    hdr.forEach((k, j) => { if (k) d[k] = txt(lines[i][j]) })
    if (!Object.values(d).some((v) => v !== '')) continue
    if (!d['번호']) d['번호'] = String(i)
    out.push(d)
  }
  if (!out.length) throw new Error('산출단위 파일에 줄이 없습니다 (머리글만 있습니다).')
  if (!hdr.includes('부재'))
    throw new Error('산출단위 파일에 «부재» 칸이 없습니다. 캐드에서 낸 파일이 맞습니까? (지금 칸: ' + hdr.filter(Boolean).join(', ') + ')')
  return out
}

/* ───────────────────────────────────────────── 재료표(.xlsx) 읽기 */

export class Book {
  constructor(bytes, name) {
    this.name = name || '재료표.xlsx'
    this.sheets = readWorkbook(bytes)
    this.설정 = this._pairs('설정')
    this.값표 = this._table('값표')
    this.재료표 = this._rows('재료표', true)
    this.일람표 = this._rows('일람표', false)
    this.태그이름 = [this.설정['태그1이름'] || '태그1',
                     this.설정['태그2이름'] || '태그2',
                     this.설정['태그3이름'] || '태그3']
    this.일람 = {}
    this.일람부재 = new Set()
    for (const r of this.일람표) {
      const k1 = txt(r['부재']), k2 = txt(r['부호'])
      if (k2) { this.일람[k1 + '\u0000' + k2] = r; this.일람부재.add(k1) }
    }
    if (!this.재료표.length) throw new Error('재료표 시트에 줄이 하나도 없습니다.')
  }
  _head(name) {
    const g = this.sheets[name]
    if (!g) return [null, null]
    for (let i = 0; i < g.length; i++) {
      const cells = g[i].map(txt)
      if (cells.filter((c) => c).length >= 2) return [i, cells]
    }
    return [null, null]
  }
  _rows(name, required) {
    if (!(name in this.sheets)) {
      if (required) throw new Error('재료표 파일에 «' + name + '» 시트가 없습니다.')
      return []
    }
    const [i, hdr] = this._head(name)
    if (hdr === null) return []
    const out = []
    for (const row of this.sheets[name].slice(i + 1)) {
      const cells = row.map(txt)
      if (!cells.some((c) => c)) continue
      if ((cells[0] || '').startsWith('#')) continue
      const d = {}
      hdr.forEach((k, j) => { if (k) d[k] = cells[j] === undefined ? '' : cells[j] })
      out.push(d)
    }
    return out
  }
  _pairs(name) {
    const d = {}
    for (const row of (this.sheets[name] || [])) {
      const cells = row.map(txt)
      if (cells.length >= 2 && cells[0] && !cells[0].startsWith('#')) d[cells[0]] = cells[1]
    }
    return d
  }
  _table(name) {
    const t = {}
    for (const r of this._rows(name, false)) {
      const g = txt(r['분류']), k = txt(r['키']), v = numOf(r['값'])
      if (g && k && v !== null) t[g + '\u0000' + k] = v
    }
    return t
  }
}

/* ───────────────────────────────────────────── 셈하기 */

function envOf(u, book) {
  const e = {}
  for (const [k, v] of Object.entries(book.설정)) if (!k.endsWith('이름')) e[k] = v
  const ref = book.일람[txt(u['부재']) + '\u0000' + txt(u['부호'])]
  if (ref) for (const [k, v] of Object.entries(ref)) {
    if (k !== '부재' && k !== '부호' && txt(v) !== '') e[k] = v
  }
  for (const [k, v] of Object.entries(u)) {
    if (k === '부재' || k === '부호' || k === '비고' || txt(v) === '') continue
    e[k] = v
  }
  book.태그이름.forEach((nm, i) => {
    const t = txt(u['태그' + (i + 1)])
    if (t) { e[nm] = t; e['태그' + (i + 1)] = t }
  })
  return e
}

/** 산출단위 + 재료표 -> {rows, warns} */
export function build(units, book) {
  const prec = Math.trunc(numOf(book.설정['산출근거자리'], 4))
  const dec = Math.trunc(numOf(book.설정['수량자리'], 3))
  const rules = {}
  for (const r of book.재료표) {
    const k = txt(r['부재'])
    ;(rules[k] = rules[k] || []).push(r)
  }
  const rows = [], warns = []
  const seen = {}

  // 단위가 섞였는지 «먼저» 훑습니다 (밀리미터를 그대로 넣은 것 잡기)
  const basket = {}
  for (const u of units) {
    for (const [k, v] of Object.entries(u)) {
      const x = numOf(v)
      if (x !== null && x !== 0 && k !== '번호' && k !== '개소') (basket[k] = basket[k] || []).push(Math.abs(x))
    }
  }
  const mixed = {}
  for (const [k, vs] of Object.entries(basket)) {
    const small = vs.filter((x) => x < 10)
    if (small.length && Math.max(...vs) > MM_DOUBT && Math.max(...vs) / Math.min(...vs) >= 100)
      mixed[k] = small.reduce((a, b) => a + b, 0) / small.length
  }

  for (const u of units) {
    const no = txt(u['번호']), kind = txt(u['부재']), mark = txt(u['부호'])
    const where = (no || '?') + '번 ' + kind + ' ' + mark
    if (no) (seen[no] = seen[no] || []).push(where)
    if (!kind) { warns.push(['부재없음', where, '부재 칸이 비었습니다 — 건너뜁니다']); continue }
    if (!(kind in rules)) {
      warns.push(['재료표없음', where, '재료표에 «' + kind + '» 부재가 없습니다 — 건너뜁니다'])
      continue
    }
    if (mark && book.일람부재.has(kind) && !(kind + '\u0000' + mark in book.일람)) {
      const have = Object.keys(book.일람).filter((x) => x.split('\u0000')[0] === kind)
        .map((x) => x.split('\u0000')[1]).sort().slice(0, 6)
      warns.push(['일람표없음', where,
        '일람표에 «' + kind + ' ' + mark + '» 가 없습니다 (있는 것: ' + (have.join(', ') || '없음') + ')'])
    }
    let n = numOf(u['개소'], 1.0)
    if (n === null) n = 1.0
    if (n === 0) warns.push(['개소0', where, '개소가 0 입니다 — 수량이 0 이 됩니다'])

    const e = envOf(u, book)
    for (const [k, v] of Object.entries(e)) {
      const x = numOf(v)
      if (x === null || k === '번호' || k === '개소') continue
      if (Math.abs(x) >= MM_BIG)
        warns.push(['mm의심', where, '«' + k + '» 가 ' + v + ' 입니다. 미터(m)가 맞습니까? ' +
          '(도면 치수 3000 을 그대로 넣으면 체적이 1000배가 됩니다)'])
      else if (k in mixed && Math.abs(x) > MM_DOUBT)
        warns.push(['단위섞임', where, '«' + k + '» 가 ' + v + ' 인데, 다른 줄에서는 ' +
          fmt(mixed[k], 3) + ' 쯤입니다. 한쪽이 밀리미터로 들어간 것 같습니다'])
    }

    for (const rule of rules[kind]) {
      const cond = txt(rule['조건'])
      if (cond) {
        try {
          const c = calc(cond, e, prec, book.값표)
          if (c.val === 0) continue
        } catch (ex) {
          warns.push(['조건오류', where, '«' + txt(rule['재료']) + '» 조건: ' + ex.message])
          continue
        }
      }
      const susik = txt(rule['수량식'])
      let val, expr, refs
      try {
        const r = calc(susik, e, prec, book.값표)
        val = r.val; expr = r.expr; refs = r.refs
      } catch (ex) {
        rows.push({ u, rule, val: null, expr: susik, note: '', err: ex.message })
        warns.push(['셈못함', where, '«' + txt(rule['재료']) + '» : ' + ex.message])
        continue
      }
      let hwan = numOf(rule['환산'], 1.0)
      if (hwan === null || hwan === 0) hwan = 1.0
      let hal = numOf(rule['할증'], 0.0) || 0.0
      if (hal > 1) hal = hal / 100.0
      if (hwan !== 1.0) { expr = '(' + expr + ')*' + fmt(hwan, prec); val *= hwan }
      if (hal) { expr = '(' + expr + ')*' + fmt(1 + hal, prec); val *= (1 + hal) }
      if (n !== 1.0) { expr = '(' + expr + ')*' + fmt(n, prec); val *= n }
      const note = []
      if (refs && refs.length)
        note.push(refs.map(([g, k, v]) => g + ' ' + k + '=' + fmt(v, prec)).join(' · '))
      if (hal) note.push('할증 ' + fmt(hal * 100, 2) + '%')
      if (n !== 1.0) note.push(fmt(n, 2) + '개소')
      rows.push({ u, rule, val: round(val, dec + 4), expr, note: note.join(' / '), err: null })
    }
  }
  for (const [no, lst] of Object.entries(seen)) {
    if (lst.length > 1)
      warns.push(['번호겹침', lst[0], '번호 ' + no + ' 가 ' + lst.length + '번 나옵니다: ' + lst.join(' , ')])
  }
  return { rows, warns }
}

/* 파이썬 round() 와 같은 «짝수 쪽» 이 아니라, 여기서는 자리만 자릅니다.
   (kqto.py 도 round(val, dec+4) — 소수 7자리라 차이가 나지 않습니다) */
function round(x, n) {
  const m = Math.pow(10, n)
  return Math.round(x * m) / m
}

const SERIOUS = { 부재없음: '✕ ', 재료표없음: '✕ ', 셈못함: '✕ ', 조건오류: '✕ ', 번호겹침: '✕ ' }

/* ───────────────────────────────────────────── 검산 */

export function geomsan(rows, units, book) {
  const out = []
  const prec = Math.trunc(numOf(book.설정['산출근거자리'], 4))
  let bad = 0
  for (const r of rows) {
    if (r.err || r.val === null) continue
    let v2
    try {
      v2 = calc(r.expr, {}, prec, {}).val
    } catch (ex) {
      out.push(['✕ 근거글', txt(r.u['번호']) + ' ' + txt(r.rule['재료']),
        '산출근거를 다시 읽지 못했습니다: ' + ex.message])
      bad++; continue
    }
    if (Math.abs(v2 - r.val) > Math.max(1e-9, Math.abs(r.val) * 1e-6)) {
      out.push(['✕ 근거글', txt(r.u['번호']) + ' ' + txt(r.rule['재료']),
        '적힌 근거로 세면 ' + fmt(v2, 6) + ' 인데 수량은 ' + fmt(r.val, 6) + ' 입니다 (자릿수를 늘리십시오)'])
      bad++
    }
  }
  if (!bad && rows.length)
    out.push(['○ 근거글', rows.filter((r) => !r.err).length + '줄 전부',
      '적힌 산출근거대로 다시 세어 값이 같습니다'])

  // 이상치 — 같은 부재·재료 안에서 가운데값의 30배를 넘는 줄
  const grp = {}
  for (const r of rows) {
    if (r.val === null || r.val <= 0) continue
    const k = txt(r.u['부재']) + '\u0000' + txt(r.rule['재료'])
    ;(grp[k] = grp[k] || []).push(r)
  }
  for (const k of Object.keys(grp).sort()) {
    const lst = grp[k]
    if (lst.length < 4) continue
    const vs = lst.map((x) => x.val).sort((a, b) => a - b)
    const mid = vs[Math.floor(vs.length / 2)]
    if (mid <= 0) continue
    const [kind, mat] = k.split('\u0000')
    for (const r of lst) {
      if (r.val > mid * 30)
        out.push(['△ 유난히 큼', txt(r.u['번호']) + ' ' + kind + ' ' + mat,
          fmt(r.val, 3) + ' — 같은 자리 가운데값 ' + fmt(mid, 3) + ' 의 ' + fmt(r.val / mid, 0) + '배입니다'])
      else if (r.val * 30 < mid)
        out.push(['△ 유난히 작음', txt(r.u['번호']) + ' ' + kind + ' ' + mat,
          fmt(r.val, 3) + ' — 같은 자리 가운데값 ' + fmt(mid, 3) + ' 의 1/' + fmt(mid / r.val, 0) + ' 입니다'])
    }
  }
  for (const r of rows) {
    if (r.val !== null && Math.abs(r.val) >= HUGE)
      out.push(['✕ 터무니없음', txt(r.u['번호']) + ' ' + txt(r.rule['재료']),
        fmt(r.val, 0) + ' ' + txt(r.rule['단위']) + ' 입니다. 도면 치수를 밀리미터 그대로 넣지 않았습니까?'])
  }
  const plus = {}, minus = {}
  for (const r of rows) {
    if (r.val === null) continue
    const key = txt(r.rule['재료']) + '\u0000' + txt(r.rule['단위'])
    if (r.val < 0) minus[key] = (minus[key] || 0) + -r.val
    else plus[key] = (plus[key] || 0) + r.val
  }
  for (const key of Object.keys(minus).sort()) {
    const m = minus[key], p = plus[key] || 0
    if (m > p) {
      const [a, b] = key.split('\u0000')
      out.push(['✕ 공제가 큼', a + '(' + b + ')',
        '빼는 것 ' + fmt(m, 3) + ' 가 더하는 것 ' + fmt(p, 3) + ' 보다 큽니다'])
    }
  }
  book.태그이름.forEach((nm, i) => {
    const need = String(book.설정['태그' + (i + 1) + '필수'] || '').toLowerCase()
    if (['y', 'yes', '예', 'o', '1'].includes(need)) {
      const miss = units.filter((u) => !txt(u['태그' + (i + 1)]))
      if (miss.length)
        out.push(['✕ 태그빠짐', nm, miss.length + ' 줄에 «' + nm + '» 가 비었습니다 (예: ' + txt(miss[0]['번호']) + '번)'])
    }
  })
  return out
}

/* ───────────────────────────────────────────── 엑셀 내보내기 */

export function toXlsx({ rows, warns, checks, units, book, src }) {
  const dec = Math.trunc(numOf(book.설정['수량자리'], 3))
  const tagn = book.태그이름
  const sheets = []

  // ── 산출서
  const head1 = ['번호', '부재', '부호'].concat(tagn)
    .concat(['재료', '규격', '단위', '산출근거', '수량', '비고', '키', '태그키'])
  const r1 = rows.map((x) => {
    const u = x.u
    const key = [txt(x.rule['재료']), txt(x.rule['규격']), txt(x.rule['단위'])].join('|')
    const tkey = [txt(u['태그1']), txt(u['태그2']), txt(u['태그3']),
      txt(x.rule['재료']), txt(x.rule['규격']), txt(x.rule['단위'])].join('|')
    const noV = numOf(u['번호'])
    const base = [noV === null ? txt(u['번호']) : noV, txt(u['부재']), txt(u['부호']),
      txt(u['태그1']), txt(u['태그2']), txt(u['태그3']),
      txt(x.rule['재료']), txt(x.rule['규격']), txt(x.rule['단위'])]
    if (x.err) {
      return base.concat([x.expr, { v: 0, st: ST.RED }, { v: '셈못함 : ' + x.err, st: ST.RED }, key, tkey])
    }
    return base.concat([
      { v: x.expr, st: ST.BOX },                                   // 글로도 한 벌 (감리 인쇄용)
      { f: 'ROUND(' + x.expr + ',' + dec + ')', st: ST.QTY },       // 살아 있는 엑셀 수식
      { v: x.note, st: ST.GRAY }, key, tkey])
  })
  sheets.push({
    name: '산출서', head: head1, rows: r1,
    widths: [6, 10, 10, 10, 10, 10, 14, 10, 6, 46, 12, 30, 2, 2], hide: [13, 14],
  })
  const last = rows.length + 1
  const KR = '산출서!$M$2:$M$' + Math.max(last, 2)
  const VR = '산출서!$K$2:$K$' + Math.max(last, 2)
  const TR = '산출서!$N$2:$N$' + Math.max(last, 2)

  // ── 집계
  const keys = []
  const kseen = new Set()
  for (const x of rows) {
    const k = [txt(x.rule['재료']), txt(x.rule['규격']), txt(x.rule['단위'])].join('|')
    if (!kseen.has(k)) { kseen.add(k); keys.push(k) }
  }
  const r2 = keys.map((k, i) => {
    const r = i + 2
    const [a, b, c] = k.split('|')
    return [a, b, c,
      { f: 'SUMPRODUCT(--(' + KR + '=$H' + r + '))', st: ST.BOX },
      { f: 'SUMPRODUCT((' + KR + '=$H' + r + ')*' + VR + ')', st: ST.QTY },
      { f: 'SUMPRODUCT((' + KR + '=$H' + r + ')*(' + VR + '>0)*' + VR + ')', st: ST.QTY },
      { f: 'SUMPRODUCT((' + KR + '=$H' + r + ')*(' + VR + '<0)*' + VR + ')', st: ST.QTY },
      k]
  })
  sheets.push({
    name: '집계', head: ['재료', '규격', '단위', '줄수', '수량', '더한 것', '뺀 것', '키'],
    rows: r2, widths: [16, 12, 8, 8, 16, 16, 16, 2], hide: [8],
  })

  // ── 태그별
  const combo = []
  const cseen = new Set()
  for (const x of rows) {
    const k = [txt(x.u['태그1']), txt(x.u['태그2']), txt(x.u['태그3']),
      txt(x.rule['재료']), txt(x.rule['규격']), txt(x.rule['단위'])].join('|')
    if (!cseen.has(k)) { cseen.add(k); combo.push(k) }
  }
  // ⚠️ 붙인 «한 덩어리 글» 로 줄세우면 안 됩니다. 「|」 가 한글·숫자보다 뒤라
  //    빈 태그가 있는 줄이 PC 프로그램과 «다른 자리» 로 갑니다.
  //    파이썬이 (가,나,다) 를 칸마다 견주듯이, 여기서도 칸마다 견줍니다.
  combo.sort((a, b) => {
    const x = a.split('|'), y = b.split('|')
    for (let i = 0; i < Math.max(x.length, y.length); i++) {
      const p = x[i] === undefined ? '' : x[i], q = y[i] === undefined ? '' : y[i]
      if (p !== q) return p < q ? -1 : 1
    }
    return 0
  })
  const r3 = combo.map((k, i) => {
    const r = i + 2
    return k.split('|').concat([{ f: 'SUMPRODUCT((' + TR + '=$H' + r + ')*' + VR + ')', st: ST.QTY }, k])
  })
  sheets.push({
    name: '태그별', head: tagn.concat(['재료', '규격', '단위', '수량', '키']),
    rows: r3, widths: [12, 12, 12, 16, 12, 8, 16, 2], hide: [8],
  })

  // ── 검산
  const all = checks.concat(warns.map(([a, b, c]) => [(SERIOUS[a] || '△ ') + a, b, c]))
  const r4 = all.length
    ? all.map(([kind, where, msg]) => {
      const st = String(kind).startsWith('✕') ? ST.RED : ST.BOX
      return [{ v: kind, st }, { v: where, st }, { v: msg, st }]
    })
    : [['○ 이상없음', '', '걸린 것이 없습니다.']]
  sheets.push({ name: '검산', head: ['구분', '어디', '무슨 일'], rows: r4, widths: [16, 30, 90] })

  // ── 쓴표
  const now = new Date()
  const pad = (x) => String(x).padStart(2, '0')
  const when = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()) +
    ' ' + pad(now.getHours()) + ':' + pad(now.getMinutes())
  const r5 = [
    ['K-적산 ' + VER + ' (건설맵 사이트판) 으로 만들었습니다', ''],
    ['만든 때', when],
    ['산출단위', src || ''],
    ['재료표', book.name],
    ['', ''],
    ['[ 설정 ]', ''],
  ]
  for (const k of Object.keys(book.설정).sort()) r5.push([k, book.설정[k]])
  const dump = (title, src2) => {
    r5.push(['', '']); r5.push(['[ ' + title + ' ]', ''])
    if (!src2.length) return
    const cols = []
    for (const rr of src2) for (const c of Object.keys(rr)) if (!cols.includes(c)) cols.push(c)
    r5.push(cols.slice())
    for (const rr of src2) r5.push(cols.map((c) => txt(rr[c])))
  }
  dump('재료표', book.재료표)
  dump('일람표', book.일람표)
  dump('값표', Object.keys(book.값표).sort().map((k) => {
    const [g, kk] = k.split('\u0000')
    return { 분류: g, 키: kk, 값: book.값표[k] }
  }))
  sheets.push({
    name: '쓴표', head: ['항목', '값'], rows: r5,
    widths: [22, 22, 16, 16, 16, 16, 16, 16, 16, 16, 16], freeze: false,
  })

  return writeWorkbook(sheets)
}

/** 화면에서 한 번에 부르는 것 */
export function run(bookBytes, bookName, unitsText, unitsName) {
  const book = new Book(bookBytes, bookName)
  const units = readUnits(unitsText)
  const { rows, warns } = build(units, book)
  const checks = geomsan(rows, units, book)
  const bytes = toXlsx({ rows, warns, checks, units, book, src: unitsName })
  const serious = warns.filter(([k]) => k in SERIOUS).length +
    checks.filter(([k]) => String(k).startsWith('✕')).length
  return { bytes, rows, warns, checks, units, book, serious }
}

export { SusikError }
