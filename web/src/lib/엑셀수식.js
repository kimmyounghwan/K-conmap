/**
 * 🧮 엑셀 수식 — 화면에서 엑셀처럼 셉니다 (2026-09-27)
 *
 * 원클릭 서류·수량산출서의 칸은 대부분 수식입니다(엑셀이 열 때 셈). 화면에 그리려면 우리가 셉니다.
 * 쓰는 함수만 넣었습니다(원클릭 틀 389식 · 수량산출서 SUMPRODUCT). 모르는 함수는 #NAME? 으로 보입니다.
 *
 * 값: 숫자 | 글 | 참거짓 | null(빈칸) | {오류:'#DIV/0!'} | {배열:[[...]]}
 * 고친 칸(고침)은 수식보다 먼저입니다 — 엑셀에서 수식 칸에 손으로 적은 것과 같습니다. 그 칸을 쓰는 칸도 따라 바뀝니다.
 */
import { 열번호, 칸이름 } from './엑셀읽기.js'

const 오류 = (e) => ({ 오류: e })
const 오류인가 = (v) => v != null && typeof v === 'object' && '오류' in v
const 배열인가 = (v) => v != null && typeof v === 'object' && '배열' in v

/* ── 낱말 ─────────────────────────── */
function 낱말(f) {
  const t = []
  let i = 0
  const s = String(f).replace(/^=/, '')
  while (i < s.length) {
    const ch = s[i]
    if (ch === ' ' || ch === '\n' || ch === '\r' || ch === '\t') { i++; continue }
    if (ch === '"') {
      let j = i + 1, v = ''
      for (;;) {
        if (j >= s.length) break
        if (s[j] === '"') { if (s[j + 1] === '"') { v += '"'; j += 2; continue } break }
        v += s[j]; j++
      }
      t.push({ k: '글', v }); i = j + 1; continue
    }
    if (ch === '#') {
      const m = /^#(NULL!|DIV\/0!|VALUE!|REF!|NAME\?|NUM!|N\/A|GETTING_DATA)/.exec(s.slice(i))
      if (m) { t.push({ k: '오류', v: m[0] }); i += m[0].length; continue }
    }
    // 시트 이름 붙은 주소: '이름'!A1 · 이름!A1:B2
    let m = /^('(?:[^']|'')+'|[^\s'!:(),+\-*/^&=<>"{};%]+)!(\$?[A-Za-z]{1,3}\$?\d+)(?::(\$?[A-Za-z]{1,3}\$?\d+))?/.exec(s.slice(i))
    if (m) {
      let 시트 = m[1]
      if (시트[0] === "'") 시트 = 시트.slice(1, -1).replace(/''/g, "'")
      t.push({ k: '주소', 시트, a: m[2], b: m[3] || null }); i += m[0].length; continue
    }
    m = /^(\$?[A-Za-z]{1,3}\$?\d+)(?::(\$?[A-Za-z]{1,3}\$?\d+))?(?![\w(])/.exec(s.slice(i))
    if (m) { t.push({ k: '주소', 시트: null, a: m[1], b: m[2] || null }); i += m[0].length; continue }
    m = /^(\d+\.?\d*(?:[eE][+-]?\d+)?|\.\d+(?:[eE][+-]?\d+)?)/.exec(s.slice(i))
    if (m) { t.push({ k: '수', v: parseFloat(m[1]) }); i += m[0].length; continue }
    m = /^(?:_xlfn\.)?([A-Za-z][A-Za-z0-9._]*)\s*\(/.exec(s.slice(i))
    if (m) { t.push({ k: '함수', v: m[1].toUpperCase() }); i += m[0].length; continue }
    m = /^(TRUE|FALSE)(?![\w(])/i.exec(s.slice(i))
    if (m) { t.push({ k: '참', v: m[1].toUpperCase() === 'TRUE' }); i += m[0].length; continue }
    m = /^(<>|<=|>=|[-+*/^&=<>%(),;])/.exec(s.slice(i))
    if (m) { t.push({ k: '표', v: m[1] }); i += m[0].length; continue }
    throw new Error('수식을 못 읽음: ' + s.slice(i, i + 12))
  }
  return t
}

/* ── 짜기 ─────────────────────────── */
export function 수식짜기(f) {
  const t = 낱말(f)
  let p = 0
  const 봄 = () => t[p]
  const 표냐 = (v) => t[p] && t[p].k === '표' && t[p].v === v
  const 먹 = (v) => { if (!표냐(v)) throw new Error('수식: ' + v + ' 가 있어야 합니다'); p++ }
  function 비교() {
    let a = 잇기()
    while (t[p] && t[p].k === '표' && ['=', '<>', '<', '>', '<=', '>='].includes(t[p].v)) { const op = t[p++].v; a = { k: '셈', op, a, b: 잇기() } }
    return a
  }
  function 잇기() {
    let a = 더하기()
    while (표냐('&')) { p++; a = { k: '셈', op: '&', a, b: 더하기() } }
    return a
  }
  function 더하기() {
    let a = 곱하기()
    while (표냐('+') || 표냐('-')) { const op = t[p++].v; a = { k: '셈', op, a, b: 곱하기() } }
    return a
  }
  function 곱하기() {
    let a = 거듭()
    while (표냐('*') || 표냐('/')) { const op = t[p++].v; a = { k: '셈', op, a, b: 거듭() } }
    return a
  }
  function 거듭() {
    let a = 부호()
    while (표냐('^')) { p++; a = { k: '셈', op: '^', a, b: 부호() } }
    return a
  }
  function 부호() {
    if (표냐('-')) { p++; return { k: '음', a: 부호() } }
    if (표냐('+')) { p++; return 부호() }
    return 뒤()
  }
  function 뒤() {
    let a = 알()
    while (표냐('%')) { p++; a = { k: '셈', op: '/', a, b: { k: '수', v: 100 } } }
    return a
  }
  function 알() {
    const x = 봄()
    if (!x) throw new Error('수식이 끝났습니다')
    if (x.k === '수') { p++; return { k: '수', v: x.v } }
    if (x.k === '글') { p++; return { k: '글', v: x.v } }
    if (x.k === '참') { p++; return { k: '참', v: x.v } }
    if (x.k === '오류') { p++; return { k: '오류', v: x.v } }
    if (x.k === '주소') { p++; return { k: '주소', 시트: x.시트, a: x.a.replace(/\$/g, '').toUpperCase(), b: x.b ? x.b.replace(/\$/g, '').toUpperCase() : null } }
    if (x.k === '함수') {
      p++
      const 인자 = []
      if (표냐(')')) { p++; return { k: '함수', 이름: x.v, 인자 } }
      for (;;) {
        if (표냐(',') || 표냐(')')) 인자.push({ k: '빈' }); else 인자.push(비교())
        if (표냐(',')) { p++; continue }
        먹(')'); break
      }
      return { k: '함수', 이름: x.v, 인자 }
    }
    if (표냐('(')) { p++; const a = 비교(); 먹(')'); return a }
    throw new Error('수식: 뜻밖의 ' + (x.v ?? x.k))
  }
  const 나무 = 비교()
  if (p < t.length) throw new Error('수식 뒤에 남은 것: ' + (t[p].v ?? t[p].k))
  return 나무
}

/* ── 값 다루기 ─────────────────────────── */
export function 수로(v) {
  if (v === null || v === undefined || v === '') return 0
  if (typeof v === 'number') return v
  if (typeof v === 'boolean') return v ? 1 : 0
  if (오류인가(v)) return v
  if (typeof v === 'string') {
    const s = v.trim().replace(/,/g, '')
    if (s === '') return 0
    const n = Number(s.endsWith('%') ? s.slice(0, -1) : s)
    if (Number.isFinite(n)) return s.endsWith('%') ? n / 100 : n
    return 오류('#VALUE!')
  }
  return 오류('#VALUE!')
}
/** 엑셀 «일반» 글자로 */
export function 일반글(n) {
  if (!Number.isFinite(n)) return '#NUM!'
  if (Number.isInteger(n) && Math.abs(n) < 1e15) return String(n)
  const s0 = Number(n.toPrecision(15)).toString()
  if (/e/.test(s0) || Math.abs(n) >= 1e15) {
    // 엑셀 «일반» 의 지수 꼴: 1E-10 · 1.23457E+15
    const [m, e] = n.toExponential(5).split('e')
    const 수 = String(Number(m))
    const k = Number(e)
    return 수 + 'E' + (k < 0 ? '-' : '+') + String(Math.abs(k)).padStart(2, '0')
  }
  return s0
}
export function 글로(v) {
  if (v === null || v === undefined) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE'
  if (typeof v === 'number') return 일반글(v)
  if (오류인가(v)) return v
  return ''
}
function 참으로(v) {
  if (v === null || v === undefined) return false
  if (typeof v === 'boolean') return v
  if (typeof v === 'number') return v !== 0
  if (typeof v === 'string') { const u = v.toUpperCase(); if (u === 'TRUE') return true; if (u === 'FALSE' || u === '') return false; return 오류('#VALUE!') }
  return 오류인가(v) ? v : false
}
function 견주기(a, b) {
  // 엑셀: 빈칸은 상대 꼴로 · 숫자 < 글 < 참거짓 · 글은 대소문자 무시
  if (a === null || a === undefined) a = typeof b === 'string' ? '' : typeof b === 'boolean' ? false : 0
  if (b === null || b === undefined) b = typeof a === 'string' ? '' : typeof a === 'boolean' ? false : 0
  const 급 = (x) => (typeof x === 'number' ? 0 : typeof x === 'string' ? 1 : 2)
  if (급(a) !== 급(b)) return 급(a) - 급(b)
  if (typeof a === 'string') { const x = a.toLowerCase(), y = b.toLowerCase(); return x < y ? -1 : x > y ? 1 : 0 }
  const x = +a, y = +b
  return Math.abs(x - y) < 1e-12 * Math.max(1, Math.abs(x), Math.abs(y)) ? 0 : x < y ? -1 : 1
}
function 반올림(x, n) {
  const p = Math.pow(10, n)
  const y = Math.abs(x) * p
  const r = Math.round(Number(y.toPrecision(15)))
  return Math.sign(x) * r / p
}
function 펴기(v, out = []) {
  if (배열인가(v)) { for (const r of v.배열) for (const x of r) out.push(x) } else out.push(v)
  return out
}
function 퍼진(v) { return 배열인가(v) ? v.배열.flat() : [v] }

/* 날짜: 1900 체계 일련번호 ↔ UTC 날짜 */
const 기준 = Date.UTC(1899, 11, 30)
export function 일련을날짜로(n) { return new Date(기준 + Math.floor(n) * 86400000) }
export function 날짜를일련으로(y, m, d) { return Math.round((Date.UTC(y, m - 1, d) - 기준) / 86400000) }

/* 원소별 셈 (배열 끼리·배열과 하나) */
function 원소별(a, b, fn) {
  if (!배열인가(a) && !배열인가(b)) return fn(a, b)
  const A = 배열인가(a) ? a.배열 : null, Bv = 배열인가(b) ? b.배열 : null
  const R = Math.max(A ? A.length : 1, Bv ? Bv.length : 1)
  const C = Math.max(A ? A[0].length : 1, Bv ? Bv[0].length : 1)
  const out = []
  for (let i = 0; i < R; i++) {
    const row = []
    for (let j = 0; j < C; j++) {
      const x = A ? (A[A.length === 1 ? 0 : i] || [])[A[0].length === 1 ? 0 : j] : a
      const y = Bv ? (Bv[Bv.length === 1 ? 0 : i] || [])[Bv[0].length === 1 ? 0 : j] : b
      row.push(x === undefined || y === undefined ? 오류('#N/A') : fn(x, y))
    }
    out.push(row)
  }
  return { 배열: out }
}
function 산수(op, x, y) {
  if (op === '&') { const a = 글로(x), b = 글로(y); if (오류인가(a)) return a; if (오류인가(b)) return b; return a + b }
  if (['=', '<>', '<', '>', '<=', '>='].includes(op)) {
    if (오류인가(x)) return x
    if (오류인가(y)) return y
    const c = 견주기(x, y)
    return op === '=' ? c === 0 : op === '<>' ? c !== 0 : op === '<' ? c < 0 : op === '>' ? c > 0 : op === '<=' ? c <= 0 : c >= 0
  }
  const a = 수로(x), b = 수로(y)
  if (오류인가(a)) return a
  if (오류인가(b)) return b
  if (op === '+') return a + b
  if (op === '-') return a - b
  if (op === '*') return a * b
  if (op === '/') return b === 0 ? 오류('#DIV/0!') : a / b
  if (op === '^') { const r = Math.pow(a, b); return Number.isFinite(r) ? r : 오류('#NUM!') }
  return 오류('#VALUE!')
}

/* ── 함수 ─────────────────────────── */
function 수들(값들) {
  const out = []
  for (const v of 값들) {
    if (배열인가(v)) { for (const x of 펴기(v)) if (typeof x === 'number') out.push(x); else if (오류인가(x)) return x }
    else if (오류인가(v)) return v
    else if (v === null || v === undefined || v === '') continue
    else { const n = 수로(v); if (오류인가(n)) return n; out.push(n) }
  }
  return out
}
function 쉼표(n, 자리) {
  const s = Math.abs(n).toFixed(자리)
  const [a, b] = s.split('.')
  return (n < 0 && Number(s) !== 0 ? '-' : '') + a.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (b ? '.' + b : '')
}
const 함수들 = {
  SUM: (a) => { const n = 수들(a); return 오류인가(n) ? n : n.reduce((x, y) => x + y, 0) },
  MAX: (a) => { const n = 수들(a); return 오류인가(n) ? n : n.length ? Math.max(...n) : 0 },
  MIN: (a) => { const n = 수들(a); return 오류인가(n) ? n : n.length ? Math.min(...n) : 0 },
  AVERAGE: (a) => { const n = 수들(a); return 오류인가(n) ? n : n.length ? n.reduce((x, y) => x + y, 0) / n.length : 오류('#DIV/0!') },
  COUNT: (a) => a.flatMap(퍼진).filter((x) => typeof x === 'number').length,
  COUNTA: (a) => a.flatMap(퍼진).filter((x) => x !== null && x !== undefined && x !== '').length,
  ABS: ([x]) => 한수(x, Math.abs),
  INT: ([x]) => 한수(x, Math.floor),
  TRUNC: ([x, n]) => 한수(x, (v) => { const p = Math.pow(10, n == null ? 0 : 수로(n)); return Math.trunc(v * p) / p }),
  SQRT: ([x]) => 한수(x, (v) => (v < 0 ? 오류('#NUM!') : Math.sqrt(v))),
  PI: () => Math.PI,
  EXP: ([x]) => 한수(x, Math.exp),
  LN: ([x]) => 한수(x, Math.log),
  LOG10: ([x]) => 한수(x, Math.log10),
  SIN: ([x]) => 한수(x, Math.sin), COS: ([x]) => 한수(x, Math.cos), TAN: ([x]) => 한수(x, Math.tan),
  ATAN: ([x]) => 한수(x, Math.atan), ASIN: ([x]) => 한수(x, Math.asin), ACOS: ([x]) => 한수(x, Math.acos),
  RADIANS: ([x]) => 한수(x, (v) => v * Math.PI / 180), DEGREES: ([x]) => 한수(x, (v) => v * 180 / Math.PI),
  POWER: ([x, y]) => 산수('^', x, y),
  MOD: ([x, y]) => { const a = 수로(x), b = 수로(y); if (오류인가(a)) return a; if (오류인가(b)) return b; if (b === 0) return 오류('#DIV/0!'); return a - b * Math.floor(a / b) },
  ROUND: ([x, n]) => 두수(x, n, (v, k) => 반올림(v, Math.trunc(k))),
  ROUNDUP: ([x, n]) => 두수(x, n, (v, k) => { const p = Math.pow(10, Math.trunc(k)); const y = Number((Math.abs(v) * p).toPrecision(15)); return Math.sign(v) * Math.ceil(y) / p }),
  ROUNDDOWN: ([x, n]) => 두수(x, n, (v, k) => { const p = Math.pow(10, Math.trunc(k)); const y = Number((Math.abs(v) * p).toPrecision(15)); return Math.sign(v) * Math.floor(y) / p }),
  CEILING: ([x, s]) => 두수(x, s == null ? 1 : s, (v, k) => (k === 0 ? 0 : Math.ceil(Number((v / k).toPrecision(15))) * k)),
  FLOOR: ([x, s]) => 두수(x, s == null ? 1 : s, (v, k) => (k === 0 ? 0 : Math.floor(Number((v / k).toPrecision(15))) * k)),
  AND: (a) => { let r = true; for (const v of a.flatMap(퍼진)) { if (v === null || v === '') continue; const b = 참으로(v); if (오류인가(b)) return b; r = r && b } return r },
  OR: (a) => { let r = false; for (const v of a.flatMap(퍼진)) { if (v === null || v === '') continue; const b = 참으로(v); if (오류인가(b)) return b; r = r || b } return r },
  NOT: ([x]) => { const b = 참으로(x); return 오류인가(b) ? b : !b },
  ISBLANK: ([x]) => x === null || x === undefined,
  ISNUMBER: ([x]) => typeof x === 'number',
  ISTEXT: ([x]) => typeof x === 'string',
  ISERROR: ([x]) => 오류인가(x),
  LEN: ([x]) => { const s = 글로(x); return 오류인가(s) ? s : s.length },
  LEFT: ([x, n]) => { const s = 글로(x); return 오류인가(s) ? s : s.slice(0, n == null ? 1 : 수로(n)) },
  RIGHT: ([x, n]) => { const s = 글로(x); const k = n == null ? 1 : 수로(n); return 오류인가(s) ? s : k ? s.slice(-k) : '' },
  MID: ([x, a, n]) => { const s = 글로(x); return 오류인가(s) ? s : s.substr(수로(a) - 1, 수로(n)) },
  TRIM: ([x]) => { const s = 글로(x); return 오류인가(s) ? s : s.trim().replace(/ +/g, ' ') },
  CONCATENATE: (a) => { let s = ''; for (const v of a) { const t = 글로(v); if (오류인가(t)) return t; s += t } return s },
  CONCAT: (a) => { let s = ''; for (const v of a.flatMap(퍼진)) { const t = 글로(v); if (오류인가(t)) return t; s += t } return s },
  VALUE: ([x]) => 수로(x),
  REPT: ([x, n]) => { const s = 글로(x); return 오류인가(s) ? s : s.repeat(Math.max(0, Math.floor(수로(n)))) },
  YEAR: ([x]) => 한수(x, (v) => 일련을날짜로(v).getUTCFullYear()),
  MONTH: ([x]) => 한수(x, (v) => 일련을날짜로(v).getUTCMonth() + 1),
  DAY: ([x]) => 한수(x, (v) => 일련을날짜로(v).getUTCDate()),
  WEEKDAY: ([x]) => 한수(x, (v) => 일련을날짜로(v).getUTCDay() + 1),
  DATE: ([y, m, d]) => { const a = 수로(y), b = 수로(m), c = 수로(d); if ([a, b, c].some(오류인가)) return 오류('#VALUE!'); return Math.round((Date.UTC(a, b - 1, c) - 기준) / 86400000) },
  EDATE: ([x, n]) => { const v = 수로(x), k = 수로(n); if (오류인가(v) || 오류인가(k)) return 오류('#VALUE!'); const d = 일련을날짜로(v); const y = d.getUTCFullYear(), mo = d.getUTCMonth() + Math.trunc(k); const 끝 = new Date(Date.UTC(y, mo + 1, 0)).getUTCDate(); return Math.round((Date.UTC(y, mo, Math.min(d.getUTCDate(), 끝)) - 기준) / 86400000) },
  EOMONTH: ([x, n]) => { const v = 수로(x), k = 수로(n); if (오류인가(v) || 오류인가(k)) return 오류('#VALUE!'); const d = 일련을날짜로(v); return Math.round((Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + Math.trunc(k) + 1, 0) - 기준) / 86400000) },
  TODAY: () => { const d = new Date(); return 날짜를일련으로(d.getFullYear(), d.getMonth() + 1, d.getDate()) },
  FIXED: ([x, n, 안쉼]) => { const v = 수로(x); if (오류인가(v)) return v; const k = n == null || n === null ? 2 : 수로(n); const r = 반올림(v, k); const 자 = Math.max(0, k); return 참으로(안쉼) === true ? r.toFixed(자) : 쉼표(r, 자) },
  TEXT: ([x, f]) => { const 형 = 글로(f); if (오류인가(형)) return 형; return 형식글(x, 형).글 },
  SUMPRODUCT: (a) => {
    if (!a.length) return 오류('#VALUE!')
    const 판 = a.map((v) => (배열인가(v) ? v.배열 : [[v]]))
    const R = 판[0].length, C = 판[0][0].length
    if (판.some((m) => m.length !== R || m[0].length !== C)) return 오류('#VALUE!')
    let s = 0
    for (let i = 0; i < R; i++) for (let j = 0; j < C; j++) {
      let p = 1
      for (const m of 판) { const x = m[i][j]; if (오류인가(x)) return x; p *= typeof x === 'number' ? x : typeof x === 'boolean' ? 0 : 0 }
      s += p
    }
    return s
  },
  SUMIF: ([범, 조건, 합범]) => { const A = 퍼진(범), S = 합범 ? 퍼진(합범) : A; let s = 0; for (let i = 0; i < A.length; i++) if (조건맞나(A[i], 조건)) { const n = S[i]; if (typeof n === 'number') s += n } return s },
  COUNTIF: ([범, 조건]) => 퍼진(범).filter((x) => 조건맞나(x, 조건)).length,
  N: ([x]) => (typeof x === 'number' ? x : typeof x === 'boolean' ? (x ? 1 : 0) : 0),
  T: ([x]) => (typeof x === 'string' ? x : ''),
}
function 한수(x, fn) {
  if (배열인가(x)) return { 배열: x.배열.map((r) => r.map((v) => 한수(v, fn))) }
  const v = 수로(x)
  return 오류인가(v) ? v : fn(v)
}
function 두수(x, y, fn) { const a = 수로(x), b = 수로(y); if (오류인가(a)) return a; if (오류인가(b)) return b; return fn(a, b) }
function 조건맞나(v, 조건) {
  if (typeof 조건 === 'string') {
    const m = /^(<=|>=|<>|=|<|>)?(.*)$/.exec(조건)
    const op = m[1] || '=', rhs = m[2]
    const n = Number(rhs)
    const 오른 = rhs !== '' && Number.isFinite(n) ? n : rhs
    const r = 산수(op, v, 오른)
    return r === true
  }
  return 산수('=', v, 조건) === true
}

/* ── 표시 형식 ─────────────────────────── */
const 내장형식 = {
  0: 'General', 1: '0', 2: '0.00', 3: '#,##0', 4: '#,##0.00', 9: '0%', 10: '0.00%', 11: '0.00E+00',
  14: 'yyyy-mm-dd', 15: 'd-mmm-yy', 16: 'd-mmm', 17: 'mmm-yy', 18: 'h:mm AM/PM', 19: 'h:mm:ss AM/PM', 20: 'h:mm', 21: 'h:mm:ss', 22: 'yyyy-mm-dd h:mm',
  37: '#,##0 ;(#,##0)', 38: '#,##0 ;[Red](#,##0)', 39: '#,##0.00;(#,##0.00)', 40: '#,##0.00;[Red](#,##0.00)', 49: '@',
}
export function 형식코드(책, 번호) { return (책 && 책.스타일 && 책.스타일.형식[번호]) || 내장형식[번호] || 'General' }

const 요일 = ['일', '월', '화', '수', '목', '금', '토']
/** 값 + 형식 → { 글, 색 } */
export function 형식글(v, 코드) {
  if (v === null || v === undefined) return { 글: '' }
  if (오류인가(v)) return { 글: v.오류 }
  if (typeof v === 'boolean') return { 글: v ? 'TRUE' : 'FALSE' }
  const 부분 = 나누기(코드 || 'General')
  if (typeof v === 'string') {
    const 글칸 = 부분[3] || (부분.length === 1 && /@/.test(부분[0]) ? 부분[0] : null)
    if (글칸) return { 글: 글칸.replace(/\[[^\]]*\]/g, '').replace(/"([^"]*)"/g, '$1').replace(/\\(.)/g, '$1').replace(/@/g, v) }
    return { 글: v }
  }
  let 칸 = 부분[0], n = v, 음표 = false
  if (부분.length >= 2) {
    if (v < 0) { 칸 = 부분[1]; n = -v } else if (v === 0 && 부분.length >= 3) 칸 = 부분[2]
  } else if (v < 0) 음표 = true
  let 색 = null
  const cm = /\[(Red|Blue|Green|Black|White|Magenta|Cyan|Yellow|빨강|파랑)\]/i.exec(칸)
  if (cm) 색 = { red: '#d00', 빨강: '#d00', blue: '#00c', 파랑: '#00c', green: '#080' }[cm[1].toLowerCase()] || null
  칸 = 칸.replace(/\[(?!h\]|m\]|s\])[^\]]*\]/gi, '')
  if (/^general$/i.test(칸.trim()) || 칸.trim() === '') return { 글: (음표 ? '-' : '') + 일반글(Math.abs(n)).replace(/^-/, ''), 색 }
  if (/^@$/.test(칸.trim())) return { 글: 일반글(v), 색 }
  if (날짜형식인가(칸)) return { 글: 날짜글(n, 칸), 색 }
  return { 글: (음표 ? '-' : '') + 수형식(n, 칸), 색 }
}
function 나누기(코드) {
  const out = []
  let cur = '', q = false
  for (let i = 0; i < 코드.length; i++) {
    const ch = 코드[i]
    if (ch === '"') q = !q
    if (ch === '\\' && !q) { cur += ch + (코드[i + 1] || ''); i++; continue }
    if (ch === ';' && !q) { out.push(cur); cur = ''; continue }
    cur += ch
  }
  out.push(cur)
  return out
}
function 날짜형식인가(s) { return /[ymdhs]/i.test(s.replace(/"[^"]*"/g, '').replace(/\\./g, '').replace(/\[[^\]]*\]/g, '')) && !/[0#?]/.test(s.replace(/"[^"]*"/g, '')) }
function 날짜글(n, 칸) {
  const d = 일련을날짜로(n)
  const 초 = Math.round((n - Math.floor(n)) * 86400)
  const Y = d.getUTCFullYear(), M = d.getUTCMonth() + 1, D = d.getUTCDate(), W = d.getUTCDay()
  const h = Math.floor(초 / 3600), mi = Math.floor(초 / 60) % 60, se = 초 % 60
  const 두 = (x) => String(x).padStart(2, '0')
  let out = '', i = 0, h앞 = false
  const s = 칸
  while (i < s.length) {
    const r = s.slice(i)
    let m
    if (r[0] === '"') { const j = s.indexOf('"', i + 1); out += s.slice(i + 1, j < 0 ? s.length : j); i = j < 0 ? s.length : j + 1; continue }
    if (r[0] === '\\') { out += r[1] || ''; i += 2; continue }
    if ((m = /^yyyy|^yy/i.exec(r))) { out += m[0].length === 4 ? Y : 두(Y % 100); i += m[0].length; continue }
    if ((m = /^aaaa|^aaa/i.exec(r))) { out += 요일[W] + (m[0].length === 4 ? '요일' : ''); i += m[0].length; continue }
    if ((m = /^dddd|^ddd|^dd|^d/i.exec(r))) { out += m[0].length >= 3 ? 요일[W] : m[0].length === 2 ? 두(D) : D; i += m[0].length; continue }
    if ((m = /^hh|^h/i.exec(r))) { out += m[0].length === 2 ? 두(h) : h; h앞 = true; i += m[0].length; continue }
    if ((m = /^mmmm|^mmm|^mm|^m/i.exec(r))) {
      const 분 = h앞 || /^m+:?s/i.test(r.replace(/^m+/, (x) => x + ':').slice(0, 0)) || /^[:]?s/i.test(s.slice(i + m[0].length).replace(/^:/, ''))
      if (분 && m[0].length <= 2) out += m[0].length === 2 ? 두(mi) : mi
      else out += m[0].length >= 3 ? M + '월' : m[0].length === 2 ? 두(M) : M
      h앞 = false; i += m[0].length; continue
    }
    if ((m = /^ss|^s/i.exec(r))) { out += m[0].length === 2 ? 두(se) : se; i += m[0].length; continue }
    if ((m = /^AM\/PM/i.exec(r))) { out += h < 12 ? '오전' : '오후'; i += m[0].length; continue }
    if (r[0] === '_') { out += ' '; i += 2; continue }
    if (r[0] === '*') { i += 2; continue }
    out += r[0]; i++
  }
  return out
}
function 수형식(n, 칸) {
  // 글자 조각(따옴표·\x) 과 숫자 틀을 나눕니다
  let 앞 = '', 뒤 = '', 틀 = '', 단계 = 0
  for (let i = 0; i < 칸.length; i++) {
    const ch = 칸[i]
    if (ch === '"') { const j = 칸.indexOf('"', i + 1); const t = 칸.slice(i + 1, j < 0 ? 칸.length : j); if (단계 === 0) 앞 += t; else { 단계 = 2; 뒤 += t } i = j < 0 ? 칸.length : j; continue }
    if (ch === '\\') { const t = 칸[i + 1] || ''; if (단계 === 0) 앞 += t; else { 단계 = 2; 뒤 += t } i++; continue }
    if (ch === '_') { if (단계 === 0) 앞 += ' '; else 뒤 += ' '; i++; continue }
    if (ch === '*') { i++; continue }
    if ('0#?,.%'.includes(ch) || (/[Ee]/.test(ch) && 단계 === 1)) {
      if (단계 === 2) { 뒤 += ch; continue }
      단계 = 1; 틀 += ch; continue
    }
    if (단계 === 0) 앞 += ch; else { 단계 = 2; 뒤 += ch }
  }
  if (/%/.test(틀) || /%/.test(뒤)) n *= 100
  const 틀2 = 틀.replace(/%/g, '')
  // 끝의 쉼표 = 천 단위로 나눔
  let 나눔 = 0
  let 틀3 = 틀2
  while (/,$/.test(틀3)) { 나눔++; 틀3 = 틀3.slice(0, -1) }
  n = n / Math.pow(1000, 나눔)
  const [정, 소 = ''] = 틀3.split('.')
  const 자리 = (소.match(/[0#?]/g) || []).length
  const 꼭자리 = (소.match(/0/g) || []).length
  let s = Math.abs(n).toFixed(자리)
  if (Number(s) === 0 && n !== 0 && 자리 === 0) s = '0'
  let [a, b = ''] = s.split('.')
  if (자리 > 꼭자리) { b = b.replace(/0+$/, ''); while (b.length < 꼭자리) b += '0' }
  const 쉼 = /,/.test(정)
  const 정최소 = (정.match(/0/g) || []).length
  if (a === '0' && 정최소 === 0) a = ''
  while (a.length < 정최소) a = '0' + a
  if (쉼) a = a.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const 음 = n < 0 && Number(s) !== 0 ? '-' : ''
  const 퍼센트 = /%/.test(틀) ? '%' : ''
  return 앞 + 음 + a + (b ? '.' + b : '') + 퍼센트 + 뒤
}

/* ── 책 셈 ─────────────────────────── */
/**
 * 책(엑셀읽기 결과)을 셉니다.
 * @param 고침  { '시트이름!B5': 값 } — 화면에서 고친 칸
 * @returns { 값(시트, 칸) , 칸값(시트, r, c) }
 */
export function 셈판(책, 고침 = {}) {
  const 시트 = new Map(책.시트들.map((s) => [s.이름, s]))
  const 이름 = new Map()
  for (const d of 책.이름들 || []) if (!/^_xlnm\./.test(d.이름) && d.시트번호 == null) 이름.set(d.이름.toUpperCase(), d.값)
  const 기억 = new Map()
  const 셈중 = new Set()
  const 나무 = new Map()

  function 칸값(시이름, r, c) {
    const k = 시이름 + '!' + 칸이름(r, c)
    if (Object.prototype.hasOwnProperty.call(고침, k)) return 고침[k]
    if (기억.has(k)) return 기억.get(k)
    const s = 시트.get(시이름)
    if (!s) return 오류('#REF!')
    const x = s.칸.get(칸이름(r, c))
    if (!x) return null
    if (!x.f) return x.v
    if (셈중.has(k)) return 0          // 돌고 도는 식 — 엑셀은 경고, 우리는 0
    셈중.add(k)
    let v
    try {
      let t = 나무.get(x.f)
      if (!t) { t = 수식짜기(x.f); 나무.set(x.f, t) }
      v = 풀이(t, 시이름)
      if (배열인가(v)) v = v.배열[0] ? v.배열[0][0] : null   // 칸 하나에는 첫 값
      /* 빈칸을 가리키는 식은 «빈칸» 으로 둡니다 — 엑셀은 0 으로 보이지만, 리브레오피스·구글처럼 ="" 와도 같게.
         (원클릭 틀: 기성일을 안 적으면 엑셀은 「1900년 1월 0일」, 여기는 빈 날짜 칸) */
      if (v === undefined) v = null
    } catch (e) { v = 오류('#NAME?') }
    셈중.delete(k)
    기억.set(k, v)
    return v
  }
  function 범위값(시이름, a, b) {
    const p = /^([A-Z]{1,3})(\d+)$/.exec(a), q = /^([A-Z]{1,3})(\d+)$/.exec(b)
    if (!p || !q) return 오류('#REF!')
    const r1 = Math.min(+p[2], +q[2]), r2 = Math.max(+p[2], +q[2])
    const c1 = Math.min(열번호(p[1]), 열번호(q[1])), c2 = Math.max(열번호(p[1]), 열번호(q[1]))
    const out = []
    for (let r = r1; r <= r2; r++) { const row = []; for (let c = c1; c <= c2; c++) row.push(칸값(시이름, r, c)); out.push(row) }
    return { 배열: out }
  }
  function 풀이(n, 시이름) {
    switch (n.k) {
      case '수': case '글': case '참': return n.v
      case '오류': return 오류(n.v)
      case '빈': return null
      case '음': { const v = 풀이(n.a, 시이름); return 배열인가(v) ? 원소별(v, 0, (x) => 산수('-', 0, x)) : 산수('-', 0, v) }
      case '주소': {
        const 시 = n.시트 || 시이름
        if (n.b) return 범위값(시, n.a, n.b)
        const m = /^([A-Z]{1,3})(\d+)$/.exec(n.a)
        if (!m) {
          const 식 = 이름.get(n.a)
          if (식) return 풀이(수식짜기(식), 시이름)
          return 오류('#NAME?')
        }
        return 칸값(시, +m[2], 열번호(m[1]))
      }
      case '셈': {
        const a = 풀이(n.a, 시이름), b = 풀이(n.b, 시이름)
        return 원소별(a, b, (x, y) => 산수(n.op, x, y))
      }
      case '함수': {
        const 이 = n.이름
        if (이 === 'IF') {
          const c = 풀이(n.인자[0], 시이름)
          if (배열인가(c)) return 원소별(c, 0, (x) => { const b = 참으로(x); return 오류인가(b) ? b : b ? 풀이(n.인자[1] || { k: '참', v: true }, 시이름) : (n.인자[2] ? 풀이(n.인자[2], 시이름) : false) })
          const b = 참으로(c)
          if (오류인가(b)) return b
          if (b) return n.인자.length > 1 ? 풀이(n.인자[1], 시이름) : true
          return n.인자.length > 2 ? 풀이(n.인자[2], 시이름) : false
        }
        if (이 === 'IFERROR') { const v = 풀이(n.인자[0], 시이름); return 오류인가(v) ? 풀이(n.인자[1], 시이름) : v }
        if (이 === 'CHOOSE') {
          const i = 수로(풀이(n.인자[0], 시이름))
          if (오류인가(i)) return i
          const k = Math.floor(i)
          if (k < 1 || k >= n.인자.length) return 오류('#VALUE!')
          return 풀이(n.인자[k], 시이름)
        }
        const fn = 함수들[이]
        if (!fn) return 오류('#NAME?')
        return fn(n.인자.map((x) => 풀이(x, 시이름)))
      }
      default: return 오류('#VALUE!')
    }
  }
  return { 칸값, 값: (시이름, ref) => { const m = /^([A-Z]{1,3})(\d+)$/.exec(ref); return m ? 칸값(시이름, +m[2], 열번호(m[1])) : null } }
}
