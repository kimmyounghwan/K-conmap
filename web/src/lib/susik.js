/**
 * 수량식 엔진 — K-적산의 `kq_susik.py` 를 브라우저로 옮긴 것입니다 (2026-09-16).
 *
 * ⚠️ 이 파일은 PC 의 `K-적산/kq_susik.py` 와 «한 글자도 다르게 셈하면 안 됩니다».
 *    사이트에서 낸 수량과 PC 에서 낸 수량이 다르면 아무도 못 믿습니다.
 *    고칠 일이 생기면 «두 곳을 같이» 고치십시오.
 *
 * 읽는 글자: 숫자 · 이름 · + - * / ^ ( ) , 와 아래 함수
 *   int/trunc/버림  ceil/올림  floor/내림  round/반올림  sqrt  max min abs  pi
 *   if(조건,참,거짓)         값("분류", 키)   ← 「값표」 시트에서 찾아옵니다
 * 이름(변수)은 한글도 됩니다.  글자는 큰따옴표로 묶습니다.
 */

export class SusikError extends Error {}

const KOR = (c) => (c >= '가' && c <= '힣') || (c >= 'ㄱ' && c <= 'ㆎ')
const isDigit = (c) => c >= '0' && c <= '9'
const isAlpha = (c) => /[A-Za-z]/.test(c)
const isAlnum = (c) => /[A-Za-z0-9]/.test(c)
const SPACE = [' ', '\t', '\r', '\n', '　']

export function tokenize(s) {
  const out = []
  let i = 0
  const n = s.length
  while (i < n) {
    const c = s[i]
    if (SPACE.includes(c)) { i++; continue }
    if (c === '"') {
      const j = s.indexOf('"', i + 1)
      if (j < 0) throw new SusikError('큰따옴표가 닫히지 않았습니다')
      out.push(['str', s.slice(i + 1, j), s.slice(i, j + 1)])
      i = j + 1; continue
    }
    if (isDigit(c) || (c === '.' && i + 1 < n && isDigit(s[i + 1]))) {
      let j = i, dot = 0
      while (j < n && (isDigit(s[j]) || s[j] === '.')) {
        if (s[j] === '.') { dot++; if (dot > 1) throw new SusikError('점이 두 개입니다: ' + s.slice(i, j + 1)) }
        j++
      }
      out.push(['num', parseFloat(s.slice(i, j)), s.slice(i, j)])
      i = j; continue
    }
    if (isAlpha(c) || KOR(c) || c === '_') {
      let j = i
      while (j < n && (isAlnum(s[j]) || KOR(s[j]) || s[j] === '_')) j++
      out.push(['name', s.slice(i, j), s.slice(i, j)])
      i = j; continue
    }
    const two = s.slice(i, i + 2)
    if (two === '<=' || two === '>=' || two === '<>' || two === '!=') {
      out.push(['op', two, two]); i += 2; continue
    }
    if ('+-*/^(),<>='.includes(c)) { out.push(['op', c, c]); i++; continue }
    throw new SusikError('쓸 수 없는 글자입니다: «' + c + '»')
  }
  out.push(['end', null, ''])
  return out
}

/* 엑셀 ROUNDUP — 0 에서 «먼» 쪽으로 올립니다 */
const _ceil = (x) => (x ? Math.sign(x) * Math.ceil(Math.abs(x)) : 0)
/* 엑셀 ROUND — 0.5 를 «0 에서 먼» 쪽으로 보냅니다 */
function _xround(x, nn) {
  const m = Math.pow(10, nn || 0)
  const y = x * m
  const f = Math.floor(Math.abs(y))
  const r = Math.abs(y) - f
  const z = f + (r >= 0.5 ? 1 : 0)
  return (y < 0 ? -z : z) / m
}
const _trunc = (x) => Math.trunc(x)

// 이름 -> [셈, 엑셀이름, 인자개수(null=여러개)]
const FUNCS = {
  int: [(a) => _trunc(a[0]), 'TRUNC', 1],
  trunc: [(a) => _trunc(a[0]), 'TRUNC', 1],
  '버림': [(a) => _trunc(a[0]), 'TRUNC', 1],
  rounddown: [(a) => _trunc(a[0]), 'ROUNDDOWN', null],
  floor: [(a) => _trunc(a[0]), 'ROUNDDOWN', 1],
  '내림': [(a) => _trunc(a[0]), 'ROUNDDOWN', 1],
  ceil: [(a) => _ceil(a[0]), 'ROUNDUP', 1],
  '올림': [(a) => _ceil(a[0]), 'ROUNDUP', 1],
  roundup: [(a) => _ceil(a[0]), 'ROUNDUP', null],
  round: [(a) => (a.length === 1 ? _xround(a[0], 0) : _xround(a[0], Math.trunc(a[1]))), 'ROUND', null],
  '반올림': [(a) => (a.length === 1 ? _xround(a[0], 0) : _xround(a[0], Math.trunc(a[1]))), 'ROUND', null],
  sqrt: [(a) => { if (a[0] < 0) throw new SusikError('음수의 제곱근은 없습니다'); return Math.sqrt(a[0]) }, 'SQRT', 1],
  max: [(a) => Math.max.apply(null, a), 'MAX', null],
  min: [(a) => Math.min.apply(null, a), 'MIN', null],
  abs: [(a) => Math.abs(a[0]), 'ABS', 1],
  pi: [() => Math.PI, 'PI', 0],
  if: [null, 'IF', 3],
}
const CONSTS = { pi: [Math.PI, 'PI()'], PI: [Math.PI, 'PI()'] }

class Parser {
  constructor(toks, env, prec, table) {
    this.t = toks; this.i = 0; this.env = env || {}
    this.prec = prec == null ? 4 : prec
    this.table = table || {}          // {"분류\u0000키": 값}
    this.used = {}; this.refs = []
  }
  peek() { return this.t[this.i] }
  take() { return this.t[this.i++] }
  expect(ch) {
    const [k, v] = this.take()
    if (!(k === 'op' && v === ch)) throw new SusikError('«' + ch + '» 가 있어야 합니다')
  }
  num(a, what) {
    if (typeof a[0] === 'string') throw new SusikError('글자 «' + a[0] + '» 로는 ' + (what || '셈') + '을 할 수 없습니다')
    return a[0]
  }
  fmt(x) {
    if (typeof x === 'string') return '"' + x + '"'
    let s = Number(x).toFixed(this.prec)
    if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '')
    return (s === '' || s === '-') ? '0' : s
  }
  /* 알림글에 적을 수 — 자릿수가 터무니없이 크면 수 대신 말로 적습니다
     (파이썬과 자바스크립트가 큰 수를 다르게 적어서 알림글이 갈립니다) */
  small(x) { return Math.abs(x) >= 1e15 ? '아주 큰 수' : this.fmt(x) }
  parse() {
    const r = this.cmp()
    if (this.peek()[0] !== 'end') throw new SusikError('식이 «' + this.peek()[2] + '» 에서 끝나지 않았습니다')
    return r
  }
  cmp() {
    const a = this.add()
    const [k, v] = this.peek()
    if (k === 'op' && ['>=', '<=', '>', '<', '=', '<>', '!='].includes(v)) {
      this.take()
      const b = this.add()
      const xl = v === '!=' ? '<>' : v
      let x = a[0], y = b[0]
      if (typeof x === 'string' || typeof y === 'string') {
        if (['>', '<', '>=', '<='].includes(v)) throw new SusikError('글자끼리는 크고 작음을 견줄 수 없습니다')
        x = String(x); y = String(y)
      }
      const ok = { '>=': x >= y, '<=': x <= y, '>': x > y, '<': x < y, '=': x === y, '<>': x !== y, '!=': x !== y }[v]
      return [ok ? 1 : 0, a[1] + xl + b[1]]
    }
    return a
  }
  add() {
    let a = this.mul()
    for (;;) {
      const [k, v] = this.peek()
      if (k === 'op' && (v === '+' || v === '-')) {
        this.take()
        const b = this.mul()
        const x = this.num(a, '더하기'), y = this.num(b, '더하기')
        a = [v === '+' ? x + y : x - y, a[1] + v + b[1]]
      } else return a
    }
  }
  mul() {
    let a = this.pow()
    for (;;) {
      const [k, v] = this.peek()
      if (k === 'op' && (v === '*' || v === '/')) {
        this.take()
        const b = this.pow()
        const x = this.num(a, '곱하기'), y = this.num(b, '곱하기')
        if (v === '/' && y === 0) throw new SusikError('0 으로 나눕니다')
        a = [v === '*' ? x * y : x / y, a[1] + v + b[1]]
      } else return a
    }
  }
  pow() {
    // 엑셀과 같이 «왼쪽부터» 묶습니다: 2^3^2 = (2^3)^2 = 64
    let a = this.unary()
    for (;;) {
      const [k, v] = this.peek()
      if (!(k === 'op' && v === '^')) return a
      this.take()
      const b = this.unary()
      const base = this.num(a, '제곱'), ex = this.num(b, '제곱')
      const got = Math.pow(base, ex)
      // 엑셀은 (-1)^0.5 를 #NUM! 로, 0^-1 을 #DIV/0! 로 냅니다.
      // 그냥 두면 NaN·Infinity 가 엑셀 칸에 그대로 들어가 파일이 깨집니다.
      if (!Number.isFinite(got)) {
        if (base < 0 && !Number.isInteger(ex))
          throw new SusikError('음수(' + this.small(base) + ')는 ' + this.small(ex) + ' 제곱을 할 수 없습니다')
        if (base === 0 && ex < 0) throw new SusikError('0 을 음수 제곱하면 0 으로 나누는 셈이 됩니다')
        throw new SusikError('제곱이 너무 커서 셀 수 없습니다')
      }
      a = [got, a[1] + '^' + b[1]]
    }
  }
  unary() {
    const [k, v] = this.peek()
    if (k === 'op' && (v === '+' || v === '-')) {
      this.take()
      const a = this.unary()
      if (v === '-') return [-this.num(a, '부호'), '-' + a[1]]
      return [this.num(a, '부호'), a[1]]
    }
    return this.atom()
  }
  atom() {
    const [k, v, raw] = this.take()
    if (k === 'num') return [v, this.fmt(v)]
    if (k === 'str') return [v, '"' + v + '"']
    if (k === 'op' && v === '(') {
      const a = this.cmp()
      this.expect(')')
      return [a[0], '(' + a[1] + ')']
    }
    if (k === 'name') {
      const [nk, nv] = this.peek()
      if (nk === 'op' && nv === '(') return this.call(v)
      if (Object.prototype.hasOwnProperty.call(CONSTS, v)) return CONSTS[v].slice()
      const x = this.lookup(v)
      return [x, this.fmt(x)]
    }
    throw new SusikError('식이 이상합니다 (' + (raw || '끝') + ')')
  }
  lookup(v) {
    if (!Object.prototype.hasOwnProperty.call(this.env, v)) throw new SusikError('«' + v + '» 가 무엇인지 모릅니다')
    let x = this.env[v]
    if (x === null || x === undefined || (typeof x === 'string' && x.trim() === ''))
      throw new SusikError('«' + v + '» 칸이 비어 있습니다')
    if (typeof x === 'string') {
      const t = x.trim().replace(/,/g, '')
      // 파이썬 float() 가 받아 주는 꼴만 숫자로 봅니다 (빈 글자·「1 2」 는 글자)
      if (/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(t)) x = parseFloat(t)
      else { this.used[v] = x.trim(); return x.trim() }
    }
    x = Number(x)
    this.used[v] = x
    return x
  }
  call(name) {
    const low = name.toLowerCase()
    if (name === '값' || name === '찾기' || low === 'ref') return this.callRef(name)
    if (!Object.prototype.hasOwnProperty.call(FUNCS, low)) throw new SusikError('«' + name + '» 라는 함수는 없습니다')
    const [fn, xl, cnt] = FUNCS[low]
    this.expect('(')
    const args = []
    if (!(this.peek()[0] === 'op' && this.peek()[1] === ')')) {
      args.push(this.cmp())
      while (this.peek()[0] === 'op' && this.peek()[1] === ',') { this.take(); args.push(this.cmp()) }
    }
    this.expect(')')
    if (cnt !== null && args.length !== cnt)
      throw new SusikError(name + '() 에는 값이 ' + cnt + '개 있어야 합니다 (' + args.length + '개 넣었습니다)')
    if (low === 'pi') return [Math.PI, 'PI()']
    if (!args.length) throw new SusikError(name + '() 안이 비었습니다')
    const txts = args.map((a) => a[1])
    if (low === 'if') {
      const cond = this.num(args[0], 'if 의 조건')
      return [cond !== 0 ? args[1][0] : args[2][0], 'IF(' + txts[0] + ',' + txts[1] + ',' + txts[2] + ')']
    }
    const vals = args.map((a) => this.num(a, name + '()'))
    const guard = (x) => {
      if (typeof x === 'number' && !Number.isFinite(x))
        throw new SusikError('«' + name + '()» 의 결과가 숫자가 아닙니다')
      return x
    }
    if (['ceil', 'floor', '올림', '내림'].includes(low)) return [guard(fn(vals)), xl + '(' + txts[0] + ',0)']
    if (low === 'roundup' || low === 'rounddown') {
      if (vals.length !== 1 && vals.length !== 2) throw new SusikError(name + '() 에는 값이 1~2개 있어야 합니다')
      const nn = vals.length === 2 ? Math.trunc(vals[1]) : 0
      const m = Math.pow(10, nn)
      const got = (low === 'roundup' ? _ceil(vals[0] * m) : _trunc(vals[0] * m)) / m
      return [guard(got), xl + '(' + txts.join(',') + ')']
    }
    if (['int', 'trunc', '버림'].includes(low)) return [guard(fn(vals)), 'TRUNC(' + txts[0] + ')']
    if ((low === 'round' || low === '반올림') && vals.length === 1) return [guard(fn(vals)), 'ROUND(' + txts[0] + ',0)']
    return [guard(fn(vals)), xl + '(' + txts.join(',') + ')']
  }
  callRef(name) {
    this.expect('(')
    const a = this.cmp()
    this.expect(',')
    const b = this.cmp()
    this.expect(')')
    const grp = String(a[0]).trim()
    let key = String(b[0]).trim()
    if (typeof b[0] === 'number') key = this.fmt(b[0])
    const kk = grp + '\u0000' + key
    if (!Object.prototype.hasOwnProperty.call(this.table, kk)) {
      const near = Object.keys(this.table).filter((x) => x.split('\u0000')[0] === grp)
        .map((x) => x.split('\u0000')[1]).sort()
      if (!near.length) throw new SusikError('값표에 «' + grp + '» 분류가 없습니다')
      throw new SusikError('값표 «' + grp + '» 에 «' + key + '» 가 없습니다 (있는 것: ' + near.slice(0, 8).join(', ') + ')')
    }
    const x = this.table[kk]
    this.refs.push([grp, key, x])
    return [x, this.fmt(x)]
  }
}

/** 수량식 한 줄을 셉니다. 돌려주는 것: {val, expr, used, refs} */
export function calc(susik, env, prec, table) {
  if (susik === null || susik === undefined || String(susik).trim() === '')
    throw new SusikError('수량식이 비어 있습니다')
  const p = new Parser(tokenize(String(susik)), env, prec == null ? 4 : prec, table)
  const [val, txt] = p.parse()
  if (typeof val === 'string') throw new SusikError('셈한 결과가 숫자가 아니라 글자(«' + val + '») 입니다')
  if (!Number.isFinite(val)) throw new SusikError('셈한 결과가 숫자가 아닙니다 (' + String(val) + ')')
  return { val, expr: txt, used: p.used, refs: p.refs }
}
