/**
 * 🧮 엑셀 수식 풀기 — 서식 «사이트에서 작성» 의 자동 계산 (G361 · 2026-10-21)
 *   소장님: 「서식도 사이트에서… 값 없이… 작업하려면 다시 사이트 찾게」 · 「되도록 자동으로」
 *   → 엑셀 서식(tools/forms2/격자.py 가 구운 web/public/forms/g/{slug}.json)의 수식을 «엑셀 그대로» 사이트에서 풉니다.
 *
 * ■ 수식 글(A1 주소)을 읽어 나무로 바꾸고(한 번만), 칸 값이 바뀔 때마다 필요한 칸만 다시 셉니다(게으른 셈 · 한 번 셈 기억).
 * ■ 엑셀 · LibreOffice 와 같은 버릇을 따릅니다 — 빈 칸은 셈에서 0 · 비교에서 "" · 날짜는 일련번호(1899-12-30 = 0) ·
 *   글자 비교는 대소문자 무시 · ROUND 는 0.5 를 0 에서 먼 쪽으로 · 같음 비교는 아주 작은 차이(2^-48)를 같게 봄(LibreOffice).
 * ■ 검증: tools/forms2/격자검증.py — 서식마다 세 벌(작성 예시 · 다른 값 두 벌)을 LibreOffice 로 다시 계산한 값과 대조.
 * ■ 바깥으로 아무것도 보내지 않습니다(네트워크 없음).
 */

/* ── 값 ─────────────────────────────────────────────────────────── */
export class 오류 {
  constructor(e) { this.e = e }
  toString() { return this.e }
}
const E = (e) => new 오류(e)
const DIV0 = E('#DIV/0!'), VALUE = E('#VALUE!'), NA = E('#N/A'), REF = E('#REF!'), NAME = E('#NAME?'), NUM = E('#NUM!')
const isErr = (v) => v instanceof 오류

/** 범위 참조(게으름) */
class 범위 {
  constructor(si, r1, c1, r2, c2) { this.si = si; this.r1 = r1; this.c1 = c1; this.r2 = r2; this.c2 = c2 }
  get rows() { return this.r2 - this.r1 + 1 }
  get cols() { return this.c2 - this.c1 + 1 }
}
/** 배열(값) */
class 배열 {
  constructor(a, r1 = null, c1 = null) { this.a = a; this.r1 = r1; this.c1 = c1 }
  get rows() { return this.a.length }
  get cols() { return this.a[0] ? this.a[0].length : 0 }
}

/* ── 주소 ───────────────────────────────────────────────────────── */
export function 열번호(s) { let n = 0; for (const ch of s.toUpperCase()) n = n * 26 + (ch.charCodeAt(0) - 64); return n }
export function 열글(n) { let s = ''; while (n) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26) } return s }
export const 주소 = (r, c) => 열글(c) + r
const 날꼴글 = /(^|[^"\\])[yd]|yyyy|(^|[^"])m+[^"]*d/i
/** 입력칸에 미리 적힌 글이 «자리글»(빈 서식에 찍히는 «년 월 일» 같은 것)인가 — 그렇다면 셈에서는 빈 칸 */
export function 자리글(x) {
  if (typeof x.v !== 'string') return x.v === null || x.v === undefined
  if (/^[\s년월일시분초()~.:\-/]*$/.test(x.v)) return true
  return !!(x.nf && 날꼴글.test(x.nf.replace(/"[^"]*"/g, '')))
}

/* ── 낱말 쪼개기 ────────────────────────────────────────────────── */
const 오류글 = ['#DIV/0!', '#VALUE!', '#N/A', '#REF!', '#NAME?', '#NUM!', '#NULL!']
function 쪼개기(s) {
  const out = []
  let i = 0
  const n = s.length
  const 칸꼴 = /^(\$?[A-Za-z]{1,3}\$?\d+)(?::(\$?[A-Za-z]{1,3}\$?\d+))?/
  const 열꼴 = /^(\$?[A-Za-z]{1,3}):(\$?[A-Za-z]{1,3})(?![\w(])/
  while (i < n) {
    const ch = s[i]
    if (ch === ' ' || ch === '\n' || ch === '\r' || ch === '\t') { i++; continue }
    if (ch === '"') {
      let j = i + 1, t = ''
      while (j < n) { if (s[j] === '"') { if (s[j + 1] === '"') { t += '"'; j += 2; continue } break } t += s[j]; j++ }
      out.push({ k: 'str', v: t }); i = j + 1; continue
    }
    if (ch === '#') {
      const e = 오류글.find((x) => s.startsWith(x, i))
      if (e) { out.push({ k: 'err', v: e }); i += e.length; continue }
    }
    // 시트 이름 붙은 주소
    let sheet = null
    let j = i
    if (ch === "'") {
      let k = i + 1, t = ''
      while (k < n) { if (s[k] === "'") { if (s[k + 1] === "'") { t += "'"; k += 2; continue } break } t += s[k]; k++ }
      if (s[k + 1] === '!') { sheet = t; j = k + 2 }
    } else {
      const m = /^([^\s!'"(),:;&=<>+\-*/^%{}]+)!/.exec(s.slice(i))
      if (m) { sheet = m[1]; j = i + m[0].length }
    }
    {
      const rest = s.slice(j)
      const prevOk = !out.length || !['num', 'str', 'ref', 'rparen'].includes(out[out.length - 1].k) || sheet
      const mc = 열꼴.exec(rest)
      if (mc && prevOk) { out.push({ k: 'ref', sheet, a: mc[1].replace(/\$/g, '') + '1', b: mc[2].replace(/\$/g, '') + '1048576', col: true }); i = j + mc[0].length; continue }
      const m = 칸꼴.exec(rest)
      if (m) {
        const 뒤 = rest[m[0].length]
        const 함수뒤 = /^\s*\(/.test(rest.slice(m[0].length))      // LOG10( 같은 함수 이름은 주소가 아님
        if (!(뒤 && /[A-Za-z0-9_.]/.test(뒤)) && (!함수뒤 || sheet)) {
          out.push({ k: 'ref', sheet, a: m[1].replace(/\$/g, ''), b: m[2] ? m[2].replace(/\$/g, '') : null }); i = j + m[0].length; continue
        }
      }
      if (sheet) throw new Error('주소를 못 읽음: ' + s.slice(i, i + 30))
    }
    if (/[0-9.]/.test(ch)) {
      const m = /^(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/.exec(s.slice(i))
      if (m) { out.push({ k: 'num', v: Number(m[0]) }); i += m[0].length; continue }
    }
    if (/[A-Za-z_]/.test(ch)) {
      const m = /^[A-Za-z_][A-Za-z0-9_.]*/.exec(s.slice(i))
      const w = m[0]
      let k2 = i + w.length
      while (s[k2] === ' ') k2++
      if (s[k2] === '(') { out.push({ k: 'fn', v: w.toUpperCase() }); i = k2 + 1; continue }
      const u = w.toUpperCase()
      if (u === 'TRUE' || u === 'FALSE') { out.push({ k: 'bool', v: u === 'TRUE' }); i += w.length; continue }
      out.push({ k: 'name', v: w }); i += w.length; continue
    }
    const two = s.slice(i, i + 2)
    if (two === '<>' || two === '<=' || two === '>=') { out.push({ k: 'op', v: two }); i += 2; continue }
    if ('+-*/^&=<>%'.includes(ch)) { out.push({ k: 'op', v: ch }); i++; continue }
    if (ch === '(') { out.push({ k: 'lparen' }); i++; continue }
    if (ch === ')') { out.push({ k: 'rparen' }); i++; continue }
    if (ch === ',' || ch === ';') { out.push({ k: 'comma' }); i++; continue }
    if (ch === '{') { out.push({ k: 'lbrace' }); i++; continue }
    if (ch === '}') { out.push({ k: 'rbrace' }); i++; continue }
    throw new Error('모르는 글자: ' + ch + ' @' + i + ' in ' + s)
  }
  return out
}

/* ── 나무 만들기 — 우선순위: 비교 · 이음(&) · 더하기 · 곱하기 · 거듭제곱 · 단항 · 퍼센트 ── */
const 높이 = { '=': 1, '<>': 1, '<': 1, '>': 1, '<=': 1, '>=': 1, '&': 2, '+': 3, '-': 3, '*': 4, '/': 4, '^': 5 }
export function 읽기(f) {
  const t = 쪼개기(f)
  let p = 0
  const peek = () => t[p]
  const next = () => t[p++]
  function 기본() {
    const x = next()
    if (!x) throw new Error('수식이 끝남: ' + f)
    if (x.k === 'num') return { t: 'v', v: x.v }
    if (x.k === 'str') return { t: 'v', v: x.v }
    if (x.k === 'bool') return { t: 'v', v: x.v }
    if (x.k === 'err') return { t: 'v', v: E(x.v) }
    if (x.k === 'ref') return { t: 'ref', sheet: x.sheet, a: x.a, b: x.b }
    if (x.k === 'name') return { t: 'name', v: x.v }
    if (x.k === 'op' && (x.v === '-' || x.v === '+')) { const e = 단항(); return x.v === '-' ? { t: 'neg', e } : { t: 'pos', e } }
    if (x.k === 'lparen') { const e = 식(0); if (next()?.k !== 'rparen') throw new Error(') 없음: ' + f); return e }
    if (x.k === 'lbrace') {
      const rows = [[]]
      while (peek() && peek().k !== 'rbrace') {
        const y = next()
        if (y.k === 'comma') continue
        if (y.k === 'op' && y.v === '-') { const z = next(); rows[rows.length - 1].push(-z.v); continue }
        rows[rows.length - 1].push(y.k === 'err' ? E(y.v) : y.v)
      }
      next()
      return { t: 'v', v: new 배열(rows.map((r) => r)) }
    }
    if (x.k === 'fn') {
      const args = []
      if (peek()?.k === 'rparen') { next(); return { t: 'fn', n: x.v, args } }
      for (;;) {
        if (peek()?.k === 'comma' || peek()?.k === 'rparen') args.push({ t: 'none' })
        else args.push(식(0))
        const y = next()
        if (!y) throw new Error('함수가 안 닫힘: ' + f)
        if (y.k === 'rparen') break
        if (y.k !== 'comma') throw new Error(', 없음: ' + f)
      }
      return { t: 'fn', n: x.v, args }
    }
    throw new Error('모르는 낱말: ' + JSON.stringify(x) + ' in ' + f)
  }
  function 단항() {
    let e = 기본()
    while (peek() && peek().k === 'op' && peek().v === '%') { next(); e = { t: 'pct', e } }
    return e
  }
  function 식(min) {
    let l = 단항()
    for (;;) {
      const x = peek()
      if (!x || x.k !== 'op' || !(x.v in 높이)) break
      const h = 높이[x.v]
      if (h <= min) break          // 엑셀은 ^ 까지 모두 왼쪽부터(2^3^2 = 64)
      next()
      const r = 식(h)
      l = { t: 'bin', o: x.v, l, r }
    }
    return l
  }
  const e = 식(0)
  if (p < t.length) throw new Error('남은 낱말: ' + f)
  return e
}

/* ── 날짜 ───────────────────────────────────────────────────────── */
const DAY = 86400000
const 바탕 = Date.UTC(1899, 11, 30)
export function 날짜로(s) { const d = new Date(바탕 + Math.floor(s) * DAY); return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate(), w: d.getUTCDay() } }
export function 일련(y, m, d) { return Math.round((Date.UTC(y, m - 1, d) - 바탕) / DAY) }
export function 오늘일련() { const n = new Date(Date.now() + 9 * 3600e3); return 일련(n.getUTCFullYear(), n.getUTCMonth() + 1, n.getUTCDate()) }

/* ── 바꾸기 ─────────────────────────────────────────────────────── */
function 수로(v) {
  if (isErr(v)) return v
  if (v === null || v === undefined || v === '') return v === '' ? VALUE : 0
  if (typeof v === 'number') return v
  if (typeof v === 'boolean') return v ? 1 : 0
  if (typeof v === 'string') {
    const t = v.trim().replace(/,/g, '')
    if (/^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?%?$/i.test(t)) return t.endsWith('%') ? Number(t.slice(0, -1)) / 100 : Number(t)
    const m = /^(\d{4})[-./]\s*(\d{1,2})[-./]\s*(\d{1,2})\.?$/.exec(t)
    if (m) return 일련(+m[1], +m[2], +m[3])
    return VALUE
  }
  return VALUE
}
/** 셈(+ - * /)에서 쓰는 수 — 빈 칸 = 0 · "" 는 #VALUE! */
function 셈수(v) { return v === null || v === undefined ? 0 : 수로(v) }
export function 일반글(v) {
  if (v === null || v === undefined) return ''
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE'
  if (typeof v === 'number') {
    if (Number.isInteger(v)) return String(v)
    let s = Number(v.toPrecision(15)).toString()
    if (/e/.test(s)) { const a = Math.abs(v); if (a >= 1e-5 && a < 1e15) s = Number(v.toPrecision(15)).toFixed(20).replace(/\.?0+$/, '') }
    return s
  }
  return String(v)
}
function 참거짓(v) {
  if (isErr(v)) return v
  if (v === null || v === undefined) return false
  if (typeof v === 'boolean') return v
  if (typeof v === 'number') return v !== 0
  if (typeof v === 'string') { const u = v.toUpperCase(); if (u === 'TRUE') return true; if (u === 'FALSE') return false; return VALUE }
  return VALUE
}
const 거의같음 = (a, b) => a === b || Math.abs(a - b) <= Math.max(Math.abs(a), Math.abs(b)) * 3.552713678800501e-15
function 비교(a, b) {
  // 엑셀: 수 < 글 < 참거짓 · 빈 칸은 상대 꼴의 «빈 값»
  if (a === null || a === undefined) a = typeof b === 'string' ? '' : typeof b === 'boolean' ? false : 0
  if (b === null || b === undefined) b = typeof a === 'string' ? '' : typeof a === 'boolean' ? false : 0
  const rank = (v) => (typeof v === 'number' ? 0 : typeof v === 'string' ? 1 : 2)
  const ra = rank(a), rb = rank(b)
  if (ra !== rb) return ra < rb ? -1 : 1
  if (ra === 0) return 거의같음(a, b) ? 0 : a < b ? -1 : 1
  if (ra === 1) { const x = a.toLowerCase(), y = b.toLowerCase(); return x === y ? 0 : x < y ? -1 : 1 }
  return a === b ? 0 : a ? 1 : -1
}

/* 0.1+0.2 같은 부동소수 찌꺼기 — 엑셀은 15자리로 보임. 셈 값은 그대로 두고(엑셀도 그대로) 비교 · 끝전에서만 고려
   🩹 자리 옮김은 지수 글로(2.9e15 · 1e-16 같은 수에서 «…e+15e6» 이 NaN 이 되던 것 — 격자검증 흔듦2 에서 잡음) */
const 옮김 = (v, n) => { if (v === 0 || !Number.isFinite(v)) return v; const [m, e] = v.toExponential().split('e'); return Number(m + 'e' + (Number(e) + n)) }
function 반올림(x, n) {
  if (!Number.isFinite(x)) return x
  n = Math.trunc(n)
  const s = x < 0 ? -1 : 1
  const a = Number(Math.abs(x).toPrecision(15))
  return s * 옮김(Math.round(옮김(a, n)), -n)
}
function 올림(x, n) { if (!Number.isFinite(x)) return x; n = Math.trunc(n); const s = x < 0 ? -1 : 1; const a = Number(옮김(Math.abs(x), n).toPrecision(15)); return s * 옮김(Math.ceil(a), -n) }
function 내림(x, n) { if (!Number.isFinite(x)) return x; n = Math.trunc(n); const s = x < 0 ? -1 : 1; const a = Number(옮김(Math.abs(x), n).toPrecision(15)); return s * 옮김(Math.floor(a), -n) }

/* ── 기준(COUNTIF · SUMIF) ──────────────────────────────────────── */
function 기준(c) {
  if (isErr(c)) return () => false
  if (typeof c === 'number' || typeof c === 'boolean') return (v) => typeof v === typeof c ? 비교(v, c) === 0 : (typeof c === 'number' && typeof v === 'string' && v.trim() !== '' && !isErr(수로(v)) ? 거의같음(수로(v), c) : false)
  let s = c === null || c === undefined ? '' : String(c)
  let op = '='
  const m = /^(<=|>=|<>|<|>|=)/.exec(s)
  if (m) { op = m[1]; s = s.slice(op.length) }
  const 수 = s.trim() !== '' && !isErr(수로(s)) && !/^\d{4}[-./]/.test(s.trim()) ? 수로(s) : null
  if (op === '=' || op === '<>') {
    let f
    if (s === '') f = (v) => v === null || v === undefined || v === ''
    else if (수 !== null) f = (v) => (typeof v === 'number' && 거의같음(v, 수)) || (typeof v === 'string' && v.trim() !== '' && !isErr(수로(v)) && 거의같음(수로(v), 수))
    else if (/[*?~]/.test(s)) {
      const re = new RegExp('^' + s.replace(/~([*?~])|([.+^${}()|[\]\\])|(\*)|(\?)/g, (a, esc, sp, st, q) => esc ? '\\' + esc : sp ? '\\' + sp : st ? '[\\s\\S]*' : '[\\s\\S]') + '$', 'i')
      f = (v) => typeof v === 'string' && re.test(v)
    } else { const lo = s.toLowerCase(); f = (v) => typeof v === 'string' && v.toLowerCase() === lo }
    return op === '=' ? f : (v) => !f(v)
  }
  if (수 !== null) {
    return (v) => {
      if (typeof v !== 'number') return false
      const k = 비교(v, 수)
      return op === '<' ? k < 0 : op === '>' ? k > 0 : op === '<=' ? k <= 0 : k >= 0
    }
  }
  return (v) => {
    if (typeof v !== 'string') return false
    const k = 비교(v, s)
    return op === '<' ? k < 0 : op === '>' ? k > 0 : op === '<=' ? k <= 0 : k >= 0
  }
}

/* ── 책(서식 하나) ──────────────────────────────────────────────── */
/**
 * @param {object} doc  격자.py 가 구운 JSON
 * @returns 책 — 책.값(si, r, c) · 책.넣기(열쇠, 값) · 책.다시() · 책.수식칸들
 */
export function 책만들기(doc) {
  const 시트 = doc.sheets.map((s, si) => {
    const m = new Map()
    let maxr = 0, maxc = 0
    for (const x of s.cells) {
      const [r, c, rs, cs, st, k, v, f, nf] = x
      m.set(r * 16384 + c, { r, c, rs, cs, k, v: v === undefined ? null : v, f: f || null, nf: nf || null, 나무: null })
      maxr = Math.max(maxr, r + rs - 1); maxc = Math.max(maxc, c + cs - 1)
    }
    return { 이름: s.name, si, m, maxr, maxc }
  })
  const 이름번호 = new Map(시트.map((s) => [s.이름.toLowerCase(), s.si]))
  const 입력 = new Map()      // si*… → 이용자 값
  let 기억 = new Map()
  const 도는중 = new Set()
  const 열쇠 = (si, r, c) => si * 1e9 + r * 16384 + c

  function 칸(si, r, c) { const s = 시트[si]; return s ? s.m.get(r * 16384 + c) : undefined }
  const 바꾼수식 = (v) => v !== null && typeof v === 'object' && !(v instanceof 오류) && typeof v.f === 'string'   // 작성 예시만의 수식 { f }
  function 값(si, r, c) {
    const k = 열쇠(si, r, c)
    const 넣은 = 입력.has(k) ? 입력.get(k) : undefined
    if (넣은 !== undefined && !바꾼수식(넣은)) return 넣은
    const x = 칸(si, r, c)
    if (!x && 넣은 === undefined) return null
    if (넣은 === undefined && !x.f) return x.k === 1 && 자리글(x) ? null : x.v      // 입력칸: 미리 적힌 값(법정 요율 · 구분 이름 등)은 값 · «년 월 일» 같은 자리글은 빈 칸
    if (기억.has(k)) return 기억.get(k)
    if (도는중.has(k)) return 0          // 돌고 도는 수식 — 엑셀은 경고 · 여기선 0
    도는중.add(k)
    let v
    try {
      let 나무
      if (넣은 !== undefined) { if (!넣은.나무) Object.defineProperty(넣은, '나무', { value: 읽기(넣은.f), enumerable: false, writable: true }); 나무 = 넣은.나무 }
      else { if (!x.나무) x.나무 = 읽기(x.f); 나무 = x.나무 }
      v = 풀기(나무, { si, r, c })
      v = 낱값(v, { si, r, c })
      if (v === null || v === undefined) v = 0      // 빈 칸을 가리키는 수식 = 0
      if (typeof v === 'number' && !Number.isFinite(v)) v = NUM
    } catch (e) {
      v = NAME
      if (typeof console !== 'undefined' && 책.알림) 책.알림(`${시트[si].이름}!${주소(r, c)} ${(넣은 && 넣은.f) || (x && x.f)}: ${e.message}`)
    }
    도는중.delete(k)
    기억.set(k, v)
    return v
  }
  /** 범위/배열 → 칸 하나(암묵 교차) */
  function 낱값(v, ctx) {
    if (v instanceof 범위) {
      if (v.rows === 1 && v.cols === 1) return 값(v.si, v.r1, v.c1)
      if (v.cols === 1 && ctx.r >= v.r1 && ctx.r <= v.r2) return 값(v.si, ctx.r, v.c1)
      if (v.rows === 1 && ctx.c >= v.c1 && ctx.c <= v.c2) return 값(v.si, v.r1, ctx.c)
      return VALUE
    }
    if (v instanceof 배열) {
      if (v.r1 !== null && v.cols === 1 && ctx.r >= v.r1 && ctx.r < v.r1 + v.rows) return v.a[ctx.r - v.r1][0]
      if (v.c1 !== null && v.rows === 1 && ctx.c >= v.c1 && ctx.c < v.c1 + v.cols) return v.a[0][ctx.c - v.c1]
      return v.a[0] ? v.a[0][0] : VALUE
    }
    return v
  }
  function 펴기(v) {   // 범위 → 배열
    if (v instanceof 범위) {
      const r2 = Math.min(v.r2, 시트[v.si] ? 시트[v.si].maxr : v.r1)
      const a = []
      for (let r = v.r1; r <= Math.max(r2, v.r1); r++) { const row = []; for (let c = v.c1; c <= v.c2; c++) row.push(r <= r2 || v.r1 === v.r2 ? 값(v.si, r, c) : null); a.push(row) }
      return new 배열(a, v.r1, v.c1)
    }
    return v
  }
  /** 함수 인자 값들(범위는 칸마다) — 범위에서 왔는지 같이 */
  function* 모두(args, ctx) {
    for (const a of args) {
      if (a.t === 'none') continue
      const v = 풀기(a, ctx)
      if (v instanceof 범위 || v instanceof 배열) {
        const arr = 펴기(v)
        for (const row of arr.a) for (const x of row) yield [x, true]
      } else yield [v, false]
    }
  }
  function 시트번호(name, ctx) {
    if (name == null) return ctx.si
    const i = 이름번호.get(String(name).toLowerCase())
    return i === undefined ? -1 : i
  }
  function 참조(node, ctx) {
    const si = 시트번호(node.sheet, ctx)
    if (si < 0) return REF
    const ma = /^([A-Za-z]+)(\d+)$/.exec(node.a)
    const r1 = +ma[2], c1 = 열번호(ma[1])
    if (!node.b) return new 범위(si, r1, c1, r1, c1)
    const mb = /^([A-Za-z]+)(\d+)$/.exec(node.b)
    const r2 = +mb[2], c2 = 열번호(mb[1])
    return new 범위(si, Math.min(r1, r2), Math.min(c1, c2), Math.max(r1, r2), Math.max(c1, c2))
  }
  function 둘(o, a, b) {
    if (isErr(a)) return a
    if (isErr(b)) return b
    if (o === '&') return 일반글(a) + 일반글(b)
    if (o === '=' || o === '<>' || o === '<' || o === '>' || o === '<=' || o === '>=') {
      const k = 비교(a, b)
      return o === '=' ? k === 0 : o === '<>' ? k !== 0 : o === '<' ? k < 0 : o === '>' ? k > 0 : o === '<=' ? k <= 0 : k >= 0
    }
    const x = 셈수(a), y = 셈수(b)
    if (isErr(x)) return x
    if (isErr(y)) return y
    switch (o) {
      case '+': return x + y
      case '-': return x - y
      case '*': return x * y
      case '/': return y === 0 ? DIV0 : x / y
      case '^': { const v = Math.pow(x, y); return Number.isFinite(v) ? v : NUM }
    }
    return VALUE
  }
  /** 배열끼리 하나하나(SUMPRODUCT 안 등) */
  function 나란히(fn, a, b) {
    const A = 펴기(a), B = 펴기(b)
    const isA = A instanceof 배열, isB = B instanceof 배열
    if (!isA && !isB) return fn(A, B)
    const rows = Math.max(isA ? A.rows : 1, isB ? B.rows : 1), cols = Math.max(isA ? A.cols : 1, isB ? B.cols : 1)
    const get = (X, isX, r, c) => (!isX ? X : X.rows === 1 && X.cols === 1 ? X.a[0][0] : X.rows === 1 ? (c < X.cols ? X.a[0][c] : NA) : X.cols === 1 ? (r < X.rows ? X.a[r][0] : NA) : (r < X.rows && c < X.cols ? X.a[r][c] : NA))
    const out = []
    for (let r = 0; r < rows; r++) { const row = []; for (let c = 0; c < cols; c++) row.push(fn(get(A, isA, r, c), get(B, isB, r, c))); out.push(row) }
    return new 배열(out, isA ? A.r1 : isB ? B.r1 : null, isA ? A.c1 : isB ? B.c1 : null)
  }
  function 하나씩(v, fn) {
    const A = 펴기(v)
    if (A instanceof 배열) return new 배열(A.a.map((row) => row.map(fn)), A.r1, A.c1)
    return fn(A)
  }

  function 풀기(n, ctx) {
    switch (n.t) {
      case 'v': return n.v
      case 'none': return null
      case 'ref': return 참조(n, ctx)
      case 'name': return NAME
      case 'neg': return 하나씩(배열자리(n.e, ctx), (x) => { if (isErr(x)) return x; const v = 셈수(x); return isErr(v) ? v : -v })
      case 'pos': return 풀기(n.e, ctx)
      case 'pct': return 하나씩(배열자리(n.e, ctx), (x) => { if (isErr(x)) return x; const v = 셈수(x); return isErr(v) ? v : v / 100 })
      case 'bin': {
        const a = 배열자리(n.l, ctx), b = 배열자리(n.r, ctx)
        if (ctx.배열 || a instanceof 배열 || b instanceof 배열) return 나란히((x, y) => 둘(n.o, x, y), a, b)
        return 둘(n.o, 낱값(a, ctx), 낱값(b, ctx))
      }
      case 'fn': return 함수(n.n, n.args, ctx)
    }
    return VALUE
  }
  /** 배열 셈 안에서는 범위를 펴서, 아니면 그대로(나중에 낱값) */
  function 배열자리(node, ctx) {
    const v = 풀기(node, ctx)
    if (ctx.배열 && v instanceof 범위) return 펴기(v)
    return v
  }
  const 낱 = (a, ctx) => 낱값(풀기(a, ctx), ctx)
  const 수인자 = (a, ctx) => { const v = 낱(a, ctx); if (isErr(v)) return v; return 셈수(v) }

  /* 배열 셈(SUMPRODUCT 안 등)에서 낱 값 함수에 범위를 주면 칸마다 — SUMPRODUCT((LEN(B21:B30)>0)*1) (엑셀 · LibreOffice 같음) */
  const 칸마다 = new Set(['LEN', 'LEFT', 'RIGHT', 'MID', 'TRIM', 'UPPER', 'LOWER', 'VALUE', 'ISNUMBER', 'ISTEXT', 'ISBLANK', 'ISERROR', 'ISNA', 'ABS', 'INT', 'ROUND', 'ROUNDUP', 'ROUNDDOWN', 'TRUNC', 'SQRT', 'DAY', 'MONTH', 'YEAR', 'WEEKDAY', 'TEXT', 'NOT', 'EOMONTH', 'EDATE', 'DATE', 'SUBSTITUTE', 'FIND', 'SEARCH', 'MOD', 'SIGN', 'CHAR', 'IFERROR', 'T'])
  function 함수(name, args, ctx) {
    if (ctx.배열 && 칸마다.has(name)) {
      const vals = args.map((a) => (a.t === 'none' ? null : 풀기(a, ctx)))
      if (vals.some((v) => v instanceof 범위 || v instanceof 배열)) {
        const Ar = vals.map((v) => (v instanceof 범위 || v instanceof 배열 ? 펴기(v) : v))
        const 배 = Ar.filter((v) => v instanceof 배열)
        const rows = Math.max(...배.map((v) => v.rows)), cols = Math.max(...배.map((v) => v.cols))
        const 집 = (v, r, c) => (v.rows === 1 && v.cols === 1 ? v.a[0][0] : v.rows === 1 ? v.a[0][c] : v.cols === 1 ? v.a[r][0] : (v.a[r] ? v.a[r][c] : NA))
        const out = []
        for (let r = 0; r < rows; r++) {
          const row = []
          for (let c = 0; c < cols; c++) row.push(함수(name, Ar.map((v, i) => (args[i].t === 'none' ? args[i] : { t: 'v', v: v instanceof 배열 ? 집(v, r, c) ?? null : v })), { ...ctx, 배열: false }))
          out.push(row)
        }
        const 첫 = 배[0]
        return new 배열(out, 첫.r1, 첫.c1)
      }
    }
    const A = (i) => (args[i] && args[i].t !== 'none' ? 낱(args[i], ctx) : null)
    const 있음 = (i) => args[i] && args[i].t !== 'none'
    switch (name) {
      case 'IF': {
        const c0 = 풀기(args[0], ctx)
        if (ctx.배열 && (c0 instanceof 범위 || c0 instanceof 배열)) {
          const C = 펴기(c0)
          return new 배열(C.a.map((row, i) => row.map((x, j) => { const t = 참거짓(x); if (isErr(t)) return t; const pick = t ? args[1] : args[2]; if (!pick || pick.t === 'none') return t ? 0 : false; const v = 펴기(풀기(pick, ctx)); return v instanceof 배열 ? (v.a[i] ? v.a[i][j] ?? v.a[i][0] : v.a[0][0]) : v })), C.r1, C.c1)
        }
        const t = 참거짓(낱값(c0, ctx))
        if (isErr(t)) return t
        if (t) return args.length > 1 ? (args[1].t === 'none' ? 0 : 풀기(args[1], ctx)) : true
        return args.length > 2 ? (args[2].t === 'none' ? 0 : 풀기(args[2], ctx)) : false
      }
      case 'IFERROR': { const v = 낱(args[0], ctx); if (isErr(v)) return args[1].t === 'none' ? 0 : 풀기(args[1], ctx); return 풀기(args[0], ctx) }
      case 'ISERROR': return isErr(A(0))
      case 'ISNA': { const v = A(0); return isErr(v) && v.e === '#N/A' }
      case 'NOT': { const t = 참거짓(A(0)); return isErr(t) ? t : !t }
      case 'AND': case 'OR': {
        let 본 = false, out = name === 'AND'
        for (const [v, 범] of 모두(args, ctx)) {
          if (isErr(v)) return v
          if (범 && (v === null || typeof v === 'string')) continue
          if (v === null) continue
          const t = 참거짓(v)
          if (isErr(t)) return t
          본 = true
          if (name === 'AND' && !t) out = false
          if (name === 'OR' && t) out = true
        }
        return 본 ? out : VALUE
      }
      case 'N': {
        let v = 풀기(args[0], ctx)
        if (v instanceof 범위) v = 값(v.si, v.r1, v.c1)
        else if (v instanceof 배열) { if (ctx.배열) return 하나씩(v, (x) => (isErr(x) ? x : typeof x === 'number' ? x : typeof x === 'boolean' ? (x ? 1 : 0) : 0)); v = v.a[0][0] }
        if (isErr(v)) return v
        return typeof v === 'number' ? v : typeof v === 'boolean' ? (v ? 1 : 0) : 0
      }
      case 'ISNUMBER': { const v = A(0); return typeof v === 'number' }
      case 'ISTEXT': { const v = A(0); return typeof v === 'string' }
      case 'ISBLANK': { const v = A(0); return v === null || v === undefined }
      case 'SUM': case 'SUMA': {
        let s = 0
        for (const [v, 범] of 모두(args, ctx)) {
          if (isErr(v)) return v
          if (범) { if (typeof v === 'number') s += v; continue }
          const x = 셈수(v); if (isErr(x)) return x; s += x
        }
        return s
      }
      case 'SUMPRODUCT': {
        const arrs = args.map((a) => 펴기(풀기(a, { ...ctx, 배열: true })))
        const first = arrs[0]
        if (!(first instanceof 배열)) { let p = 1; for (const x of arrs) { const v = x instanceof 배열 ? x.a[0][0] : x; if (isErr(v)) return v; p *= typeof v === 'number' ? v : 0 } return p }
        let s = 0
        for (let r = 0; r < first.rows; r++) for (let c = 0; c < first.cols; c++) {
          let p = 1
          for (const x of arrs) {
            const v = x instanceof 배열 ? (x.a[r] ? x.a[r][c] : NA) : x
            if (isErr(v)) return v
            p *= typeof v === 'number' ? v : 0          // 글 · 참거짓은 0 (엑셀 SUMPRODUCT)
          }
          s += p
        }
        return s
      }
      case 'COUNT': { let n = 0; for (const [v, 범] of 모두(args, ctx)) { if (typeof v === 'number') n++; else if (!범 && typeof v === 'boolean') n++; else if (!범 && typeof v === 'string' && !isErr(수로(v))) n++ } return n }
      case 'COUNTA': { let n = 0; for (const [v, 범] of 모두(args, ctx)) { if (범 ? v !== null && v !== undefined : true) n++ } return n }
      case 'COUNTBLANK': { let n = 0; for (const [v] of 모두(args, ctx)) if (v === null || v === undefined || v === '') n++; return n }
      case 'MAX': case 'MIN': {
        let best = null
        for (const [v, 범] of 모두(args, ctx)) {
          if (isErr(v)) return v
          let x
          if (범) { if (typeof v !== 'number') continue; x = v } else { x = 셈수(v); if (isErr(x)) return x }
          if (best === null || (name === 'MAX' ? x > best : x < best)) best = x
        }
        return best === null ? 0 : best
      }
      case 'AVERAGE': {
        let s = 0, n = 0
        for (const [v, 범] of 모두(args, ctx)) { if (isErr(v)) return v; if (범) { if (typeof v === 'number') { s += v; n++ } continue } const x = 셈수(v); if (isErr(x)) return x; s += x; n++ }
        return n ? s / n : DIV0
      }
      case 'SUBTOTAL': {
        const k = 수인자(args[0], ctx) % 100
        const map = { 1: 'AVERAGE', 2: 'COUNT', 3: 'COUNTA', 4: 'MAX', 5: 'MIN', 9: 'SUM' }
        return map[k] ? 함수(map[k], args.slice(1), ctx) : VALUE
      }
      case 'ROUND': case 'ROUNDUP': case 'ROUNDDOWN': {
        const x = 수인자(args[0], ctx); if (isErr(x)) return x
        const d = 있음(1) ? 수인자(args[1], ctx) : 0; if (isErr(d)) return d
        return name === 'ROUND' ? 반올림(x, d) : name === 'ROUNDUP' ? 올림(x, d) : 내림(x, d)
      }
      case 'TRUNC': { const x = 수인자(args[0], ctx); if (isErr(x)) return x; const d = 있음(1) ? 수인자(args[1], ctx) : 0; return 내림(x, d) }
      case 'INT': { const x = 수인자(args[0], ctx); if (isErr(x)) return x; return Math.floor(x) }
      case 'ABS': { const x = 수인자(args[0], ctx); return isErr(x) ? x : Math.abs(x) }
      case 'SQRT': { const x = 수인자(args[0], ctx); if (isErr(x)) return x; return x < 0 ? NUM : Math.sqrt(x) }
      case 'MOD': { const x = 수인자(args[0], ctx), y = 수인자(args[1], ctx); if (isErr(x)) return x; if (isErr(y)) return y; if (y === 0) return DIV0; return x - y * Math.floor(x / y) }
      case 'POWER': return 둘('^', A(0), A(1))
      case 'DATE': {
        let y = 수인자(args[0], ctx), m = 수인자(args[1], ctx), d = 수인자(args[2], ctx)
        for (const v of [y, m, d]) if (isErr(v)) return v
        y = Math.trunc(y); m = Math.trunc(m); d = Math.trunc(d)
        if (y < 1900) y += 1900
        const s = Math.round((Date.UTC(y, m - 1, 1) - 바탕) / DAY) + d - 1
        return s < 0 ? NUM : s
      }
      case 'YEAR': case 'MONTH': case 'DAY': case 'WEEKDAY': {
        const v = A(0)
        const x = v === null ? 0 : 수로(v)
        if (isErr(x)) return x
        if (x < 0) return NUM
        const d = 날짜로(x)
        if (name === 'YEAR') return x < 1 ? 1900 : d.y
        if (name === 'MONTH') return x < 1 ? 1 : d.m
        if (name === 'DAY') return x < 1 ? 0 : d.d
        const t = 있음(1) ? 수인자(args[1], ctx) : 1
        const w = d.w   // 0 = 일
        return t === 2 ? (w === 0 ? 7 : w) : t === 3 ? (w === 0 ? 6 : w - 1) : w + 1
      }
      case 'EDATE': case 'EOMONTH': {
        const s = 수인자(args[0], ctx), k = 수인자(args[1], ctx)
        if (isErr(s)) return s
        if (isErr(k)) return k
        const d = 날짜로(s)
        const mm = d.m - 1 + Math.trunc(k)
        const y = d.y + Math.floor(mm / 12), m = ((mm % 12) + 12) % 12 + 1
        const 끝 = new Date(Date.UTC(y, m, 0)).getUTCDate()
        return name === 'EOMONTH' ? 일련(y, m, 끝) : 일련(y, m, Math.min(d.d, 끝))
      }
      case 'TODAY': return 오늘일련()
      case 'NOW': return 오늘일련()
      case 'DAYS': { const a = 수인자(args[0], ctx), b = 수인자(args[1], ctx); if (isErr(a)) return a; if (isErr(b)) return b; return Math.floor(a) - Math.floor(b) }
      case 'LEN': { const v = A(0); if (isErr(v)) return v; return 일반글(v).length }
      case 'LEFT': case 'RIGHT': {
        const f = (v, k) => { if (isErr(v)) return v; const s = 일반글(v); return name === 'LEFT' ? s.slice(0, k) : s.slice(Math.max(0, s.length - k)) }
        const k = 있음(1) ? 수인자(args[1], ctx) : 1
        if (isErr(k)) return k
        return f(A(0), k)
      }
      case 'MID': { const v = A(0); if (isErr(v)) return v; const s = 일반글(v); const a = 수인자(args[1], ctx), k = 수인자(args[2], ctx); if (isErr(a)) return a; if (isErr(k)) return k; if (a < 1 || k < 0) return VALUE; return s.substr(a - 1, k) }
      case 'TRIM': { const v = A(0); if (isErr(v)) return v; return 일반글(v).replace(/ +/g, ' ').trim() }
      case 'UPPER': { const v = A(0); return isErr(v) ? v : 일반글(v).toUpperCase() }
      case 'LOWER': { const v = A(0); return isErr(v) ? v : 일반글(v).toLowerCase() }
      case 'CHAR': { const x = 수인자(args[0], ctx); return isErr(x) ? x : String.fromCharCode(x) }
      case 'CONCATENATE': case 'CONCAT': { let s = ''; for (const [v] of 모두(args, ctx)) { if (isErr(v)) return v; s += 일반글(v) } return s }
      case 'REPT': { const v = A(0), k = 수인자(args[1], ctx); if (isErr(v)) return v; return 일반글(v).repeat(Math.max(0, Math.trunc(k))) }
      case 'SUBSTITUTE': {
        const v = A(0), o = A(1), nw = A(2)
        for (const x of [v, o, nw]) if (isErr(x)) return x
        const s = 일반글(v), os = 일반글(o), ns = 일반글(nw)
        if (os === '') return s
        if (있음(3)) {
          const k = 수인자(args[3], ctx)
          let idx = -1
          for (let i = 0; i < k; i++) { idx = s.indexOf(os, idx + 1); if (idx < 0) return s }
          return s.slice(0, idx) + ns + s.slice(idx + os.length)
        }
        return s.split(os).join(ns)
      }
      case 'FIND': case 'SEARCH': {
        const nd = A(0), hy = A(1)
        if (isErr(nd)) return nd
        if (isErr(hy)) return hy
        const st = 있음(2) ? 수인자(args[2], ctx) : 1
        let a = 일반글(hy), b = 일반글(nd)
        if (name === 'SEARCH') { a = a.toLowerCase(); b = b.toLowerCase() }
        const i = a.indexOf(b, st - 1)
        return i < 0 ? VALUE : i + 1
      }
      case 'VALUE': { const v = A(0); if (isErr(v)) return v; if (typeof v === 'number') return v; const x = 수로(v === null ? '' : v); return x }
      case 'TEXT': {
        const v = A(0), f = A(1)
        if (isErr(v)) return v
        if (책.꼴) return 책.꼴(v, 일반글(f)).t
        return 일반글(v)
      }
      case 'CHOOSE': { const k = Math.trunc(수인자(args[0], ctx)); if (isErr(k)) return k; if (k < 1 || k >= args.length) return VALUE; return 풀기(args[k], ctx) }
      case 'ROW': { if (!있음(0)) return ctx.r; const v = 풀기(args[0], ctx); return v instanceof 범위 ? v.r1 : VALUE }
      case 'COLUMN': { if (!있음(0)) return ctx.c; const v = 풀기(args[0], ctx); return v instanceof 범위 ? v.c1 : VALUE }
      case 'ROWS': { const v = 풀기(args[0], ctx); return v instanceof 범위 || v instanceof 배열 ? v.rows : 1 }
      case 'COLUMNS': { const v = 풀기(args[0], ctx); return v instanceof 범위 || v instanceof 배열 ? v.cols : 1 }
      case 'INDIRECT': {
        const t = A(0)
        if (isErr(t)) return t
        const s = 일반글(t).trim()
        try {
          const nd = 읽기(s)
          if (nd.t !== 'ref') return REF
          return 참조(nd, ctx)
        } catch (e) { return REF }
      }
      case 'INDEX': {
        const v = 풀기(args[0], ctx)
        const r = 있음(1) ? 수인자(args[1], ctx) : 0, c = 있음(2) ? 수인자(args[2], ctx) : 0
        if (isErr(r)) return r
        if (isErr(c)) return c
        if (v instanceof 범위) {
          let rr = r, cc = c
          if (v.rows === 1 && !있음(2)) { cc = r; rr = 1 }
          if (rr === 0 && cc === 0) return v
          if (rr === 0) return new 범위(v.si, v.r1, v.c1 + cc - 1, v.r2, v.c1 + cc - 1)
          if (cc === 0) cc = 1
          if (rr > v.rows || cc > v.cols || rr < 1 || cc < 1) return REF
          return new 범위(v.si, v.r1 + rr - 1, v.c1 + cc - 1, v.r1 + rr - 1, v.c1 + cc - 1)
        }
        const arr = 펴기(v)
        if (arr instanceof 배열) { let rr = r || 1, cc = c || 1; if (arr.rows === 1 && !있음(2)) { cc = r; rr = 1 } return arr.a[rr - 1] && arr.a[rr - 1][cc - 1] !== undefined ? arr.a[rr - 1][cc - 1] : REF }
        return r <= 1 && c <= 1 ? v : REF
      }
      case 'MATCH': {
        const look = A(0)
        if (isErr(look)) return look
        const arr = 펴기(풀기(args[1], ctx))
        const list = arr instanceof 배열 ? (arr.cols === 1 ? arr.a.map((x) => x[0]) : arr.a[0]) : [arr]
        const t = 있음(2) ? 수인자(args[2], ctx) : 1
        if (t === 0) {
          const ok = typeof look === 'string' ? 기준(look) : (x) => x !== null && 비교(x, look) === 0 && typeof x === typeof look
          for (let i = 0; i < list.length; i++) if (ok(list[i])) return i + 1
          return NA
        }
        let best = -1
        for (let i = 0; i < list.length; i++) {
          const x = list[i]
          if (x === null || x === undefined || typeof x !== typeof look) continue
          const k = 비교(x, look)
          if (t > 0 ? k <= 0 : k >= 0) best = i
          else break
        }
        return best < 0 ? NA : best + 1
      }
      case 'VLOOKUP': case 'HLOOKUP': {
        const look = A(0)
        if (isErr(look)) return look
        const arr = 펴기(풀기(args[1], ctx))
        if (!(arr instanceof 배열)) return NA
        const k = 수인자(args[2], ctx)
        const approx = 있음(3) ? 참거짓(A(3)) : true
        const V = name === 'VLOOKUP'
        const n = V ? arr.rows : arr.cols
        const key = (i) => (V ? arr.a[i][0] : arr.a[0][i])
        const pick = (i) => (V ? arr.a[i][k - 1] : arr.a[k - 1] ? arr.a[k - 1][i] : REF)
        if (k < 1 || (V ? k > arr.cols : k > arr.rows)) return REF
        if (!approx) {
          const ok = typeof look === 'string' ? 기준(look) : (x) => x !== null && typeof x === typeof look && 비교(x, look) === 0
          for (let i = 0; i < n; i++) if (ok(key(i))) { const v = pick(i); return v === null ? 0 : v }
          return NA
        }
        let best = -1
        for (let i = 0; i < n; i++) { const x = key(i); if (x === null || typeof x !== typeof look) continue; if (비교(x, look) <= 0) best = i; else break }
        if (best < 0) return NA
        const v = pick(best)
        return v === null ? 0 : v
      }
      case 'COUNTIF': case 'SUMIF': case 'AVERAGEIF': {
        const rg = 펴기(풀기(args[0], ctx))
        const cr = A(1)
        const ok = 기준(cr)
        const sr = name === 'COUNTIF' ? null : 있음(2) ? 풀기(args[2], ctx) : 풀기(args[0], ctx)
        let srA = null
        if (sr) {
          if (sr instanceof 범위 && rg instanceof 배열) srA = 펴기(new 범위(sr.si, sr.r1, sr.c1, sr.r1 + rg.rows - 1, sr.c1 + rg.cols - 1))
          else srA = 펴기(sr)
        }
        let n = 0, s = 0
        const A2 = rg instanceof 배열 ? rg.a : [[rg]]
        for (let i = 0; i < A2.length; i++) for (let j = 0; j < A2[i].length; j++) {
          if (!ok(A2[i][j])) continue
          n++
          if (srA) { const v = srA instanceof 배열 ? (srA.a[i] ? srA.a[i][j] : null) : srA; if (isErr(v)) return v; if (typeof v === 'number') s += v }
        }
        return name === 'COUNTIF' ? n : name === 'SUMIF' ? s : n ? s / n : DIV0
      }
      case 'COUNTIFS': case 'SUMIFS': {
        const off = name === 'SUMIFS' ? 1 : 0
        const sr = off ? 펴기(풀기(args[0], ctx)) : null
        const pairs = []
        for (let i = off; i + 1 < args.length; i += 2) pairs.push([펴기(풀기(args[i], ctx)), 기준(A(i + 1))])
        const base = pairs[0][0]
        const R = base instanceof 배열 ? base.rows : 1, C = base instanceof 배열 ? base.cols : 1
        let n = 0, s = 0
        for (let i = 0; i < R; i++) for (let j = 0; j < C; j++) {
          let all = true
          for (const [rg, ok] of pairs) { const v = rg instanceof 배열 ? (rg.a[i] ? rg.a[i][j] : null) : rg; if (!ok(v)) { all = false; break } }
          if (!all) continue
          n++
          if (sr) { const v = sr instanceof 배열 ? (sr.a[i] ? sr.a[i][j] : null) : sr; if (isErr(v)) return v; if (typeof v === 'number') s += v }
        }
        return off ? s : n
      }
      case 'T': { const v = A(0); return typeof v === 'string' ? v : '' }
      case 'NA': return NA
      case 'PI': return Math.PI
      case 'SIGN': { const x = 수인자(args[0], ctx); return isErr(x) ? x : Math.sign(x) }
    }
    return NAME
  }

  const 책 = {
    시트,
    doc,
    알림: null,
    꼴: null,
    /** 칸 값(셈까지) */
    값,
    칸,
    /** 이용자 값 넣기 — undefined 면 처음 값으로 · '' · null 이면 빈 칸 */
    넣기(si, r, c, v) {
      const k = 열쇠(si, r, c)
      if (v === undefined) 입력.delete(k)            // 처음(미리 적힌 값)으로
      else 입력.set(k, v === '' ? null : v)          // 지운 칸은 빈 칸
      기억 = new Map()
    },
    입력값(si, r, c) { const k = 열쇠(si, r, c); return 입력.has(k) ? 입력.get(k) : undefined },
    모두지우기() { 입력.clear(); 기억 = new Map() },
    다시() { 기억 = new Map() },
    /** 이용자 값 전부 { 'si!A1': 값 } */
    내보내기() {
      const o = {}
      for (const [k, v] of 입력) { const si = Math.floor(k / 1e9), rc = k % 1e9; o[`${si}!${주소(Math.floor(rc / 16384), rc % 16384)}`] = v }
      return o
    },
    들여오기(o) {
      입력.clear()
      for (const [k, v] of Object.entries(o || {})) {
        const m = /^(\d+)!([A-Z]+)(\d+)$/.exec(k)
        if (m) 입력.set(열쇠(+m[1], +m[3], 열번호(m[2])), v)
      }
      기억 = new Map()
    },
  }
  return 책
}
