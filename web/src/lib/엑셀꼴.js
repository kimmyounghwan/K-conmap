/**
 * 🔢 엑셀 숫자 꼴(표시 형식) — 서식 «사이트에서 작성» 종이에 엑셀과 같은 글자로 (G361 · 2026-10-21)
 *   '#,##0;[Red]-#,##0;""' · 'yyyy"년" m"월" d"일"' · '[DBNum4][$-412]"일금 "General"원정";;""' · '0.0%' · '"(₩"#,##0")"' …
 *   엑셀 · LibreOffice 처럼: 칸 나눔(;) 양수 · 음수 · 0 · 글 / [조건] / [Red] / 따옴표 글 / 날짜(y m d h s) / @ 글 자리.
 *   검증: tools/forms2/격자검증.py — LibreOffice 가 보여 주는 글자와 대조.
 */
import { 일반글, 날짜로 } from './엑셀셈.js'

const 캐시 = new Map()

function 나누기(code) {
  const out = []
  let cur = '', q = false, b = false
  for (let i = 0; i < code.length; i++) {
    const ch = code[i]
    if (ch === '\\' && !q) { cur += ch + (code[i + 1] || ''); i++; continue }
    if (ch === '"') q = !q
    else if (!q && ch === '[') b = true
    else if (!q && ch === ']') b = false
    if (ch === ';' && !q && !b) { out.push(cur); cur = ''; continue }
    cur += ch
  }
  out.push(cur)
  return out
}

/** 칸 하나를 낱말로 */
function 칸낱말(sec) {
  const t = []
  let color = null, cond = null, db = 0
  let i = 0
  while (i < sec.length) {
    const ch = sec[i]
    if (ch === '"') { let j = i + 1, s = ''; while (j < sec.length && sec[j] !== '"') s += sec[j++]; t.push({ k: 'lit', v: s }); i = j + 1; continue }
    if (ch === '\\') { t.push({ k: 'lit', v: sec[i + 1] || '' }); i += 2; continue }
    if (ch === '[') {
      const j = sec.indexOf(']', i)
      const inner = sec.slice(i + 1, j)
      if (/^(red|빨강)$/i.test(inner)) color = 'red'
      else if (/^(blue|black|green|white|yellow|magenta|cyan|color\d+)$/i.test(inner)) color = inner.toLowerCase()
      else if (/^[<>=]/.test(inner)) { const m = /^(<=|>=|<>|<|>|=)\s*(-?[\d.]+)$/.exec(inner); if (m) cond = [m[1], Number(m[2])] }
      else if (/^DBNum(\d)$/i.test(inner)) db = Number(inner.slice(5))
      else if (/^h+$|^m+$|^s+$/i.test(inner)) t.push({ k: 'el', v: inner.toLowerCase() })
      i = j + 1; continue
    }
    if (ch === '_') { t.push({ k: 'lit', v: ' ' }); i += 2; continue }
    if (ch === '*') { i += 2; continue }
    if (/^General/i.test(sec.slice(i))) { t.push({ k: 'gen' }); i += 7; continue }
    if (/^(AM\/PM|A\/P|오전\/오후)/i.test(sec.slice(i))) { const m = /^(AM\/PM|A\/P|오전\/오후)/i.exec(sec.slice(i)); t.push({ k: 'ampm', v: m[0] }); i += m[0].length; continue }
    if ('0#?'.includes(ch)) { t.push({ k: 'd', v: ch }); i++; continue }
    if (ch === '.') { t.push({ k: 'dot' }); i++; continue }
    if (ch === ',') { t.push({ k: 'comma' }); i++; continue }
    if (ch === '%') { t.push({ k: 'pct' }); i++; continue }
    if (ch === '@') { t.push({ k: 'at' }); i++; continue }
    if ((ch === 'E' || ch === 'e') && (sec[i + 1] === '+' || sec[i + 1] === '-')) { t.push({ k: 'exp', v: sec[i + 1] }); i += 2; continue }
    const dm = /^(yyyy|yy|y|mmmmm|mmmm|mmm|mm|m|dddd|ddd|dd|d|hh|h|ss|s|aaaa|aaa)/i.exec(sec.slice(i))
    if (dm) { t.push({ k: 'dt', v: dm[0].toLowerCase() }); i += dm[0].length; continue }
    t.push({ k: 'lit', v: ch }); i++
  }
  return { t, color, cond, db, 날짜: t.some((x) => x.k === 'dt' || x.k === 'el'), 수: t.some((x) => x.k === 'd' || x.k === 'gen'), 글: t.some((x) => x.k === 'at') }
}

function 풀이(code) {
  let p = 캐시.get(code)
  if (!p) { p = 나누기(code).map(칸낱말); 캐시.set(code, p) }
  return p
}

/* 한글 숫자(DBNum4 · 한국어) — 1,234 → 일천이백삼십사 */
const 한수 = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구']
function 한글수(n) {
  n = Math.round(Math.abs(n))
  if (n === 0) return '영'
  const 큰 = ['', '만', '억', '조', '경']
  let out = '', k = 0
  while (n > 0) {
    const part = n % 10000
    if (part) {
      let s = ''
      const d = [Math.floor(part / 1000), Math.floor(part / 100) % 10, Math.floor(part / 10) % 10, part % 10]
      const u = ['천', '백', '십', '']
      d.forEach((x, i) => { if (x) s += 한수[x] + u[i] })
      out = s + 큰[k] + out
    }
    n = Math.floor(n / 10000); k++
  }
  return out
}

const 옮김 = (v, n) => { if (v === 0 || !Number.isFinite(v)) return v; const [m, e] = v.toExponential().split('e'); return Number(m + 'e' + (Number(e) + n)) }
function 반올림자리(x, n) { return 옮김(Math.round(옮김(Number(Math.abs(x).toPrecision(15)), n)), -n) }

function 수꼴(v, t, db) {
  // 숫자 자리 범위
  const idx = t.map((x, i) => (['d', 'dot', 'comma', 'exp', 'gen'].includes(x.k) ? i : -1)).filter((i) => i >= 0)
  const pct = t.filter((x) => x.k === 'pct').length
  let x = v * 100 ** pct
  if (!idx.length) return t.map((y) => (y.k === 'lit' ? y.v : y.k === 'pct' ? '%' : '')).join('')
  const a = idx[0], b = idx[idx.length - 1]
  const 몸 = t.slice(a, b + 1)
  let 숫자글
  if (몸.some((y) => y.k === 'gen')) {
    숫자글 = db === 4 ? 한글수(x) : 일반표시(Math.abs(x))
  } else {
    const dotAt = 몸.findIndex((y) => y.k === 'dot')
    const intT = dotAt < 0 ? 몸 : 몸.slice(0, dotAt)
    const decT = dotAt < 0 ? [] : 몸.slice(dotAt + 1).filter((y) => y.k === 'd')
    // 끝 쉼표 = 1000 으로 나눔
    let tail = 0
    for (let i = intT.length - 1; i >= 0 && intT[i].k === 'comma'; i--) tail++
    x = x / 1000 ** tail
    const group = intT.slice(0, intT.length - tail).some((y) => y.k === 'comma')
    const intD = intT.filter((y) => y.k === 'd')
    const min0 = intD.filter((y) => y.v === '0').length
    const nd = decT.length
    const r = 반올림자리(x, nd)
    let [ip, dp = ''] = r.toFixed(nd).split('.')
    if (ip === '0' && min0 === 0) ip = ''
    while (ip.length < min0) ip = '0' + ip
    if (group && ip) ip = ip.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    // 소수: 0 은 꼭, # 은 있으면, ? 는 빈칸
    let ds = dp.split('')
    let end = ds.length
    while (end > 0 && decT[end - 1] && decT[end - 1].v !== '0' && ds[end - 1] === '0') end--
    const dd = ds.slice(0, end).join('') + (decT.slice(end).some((y) => y.v === '?') ? ' '.repeat(decT.slice(end).filter((y) => y.v === '?').length) : '')
    숫자글 = ip + (dd ? '.' + dd : '')
    if (db === 4) 숫자글 = 한글수(r)
  }
  const 앞 = t.slice(0, a).map((y) => (y.k === 'lit' ? y.v : y.k === 'pct' ? '%' : '')).join('')
  const 뒤 = t.slice(b + 1).map((y) => (y.k === 'lit' ? y.v : y.k === 'pct' ? '%' : '')).join('')
  return 앞 + 숫자글 + 뒤
}

export function 일반표시(v) {
  if (typeof v !== 'number') return 일반글(v)
  if (Number.isInteger(v) && Math.abs(v) < 1e11) return String(v)
  const a = Math.abs(v)
  if (a !== 0 && (a < 1e-9 || a >= 1e11)) return v.toExponential(5).replace(/\.?0+e/, 'E').replace('E+', 'E+').toUpperCase()
  return String(Number(v.toPrecision(10)))
}

const 요일 = ['일', '월', '화', '수', '목', '금', '토']
const 요일영 = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const 달영 = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
function 날꼴(v, t) {
  if (v < 0) return '#####'
  const d = 날짜로(v)
  let sec = Math.round((v - Math.floor(v)) * 86400)
  if (sec >= 86400) sec = 86399
  const H = Math.floor(sec / 3600), M = Math.floor(sec / 60) % 60, S = sec % 60
  const ampm = t.some((x) => x.k === 'ampm')
  const two = (n) => String(n).padStart(2, '0')
  let out = ''
  for (let i = 0; i < t.length; i++) {
    const x = t[i]
    if (x.k === 'lit') { out += x.v; continue }
    if (x.k === 'ampm') { out += /오전/.test(x.v) ? (H < 12 ? '오전' : '오후') : H < 12 ? 'AM' : 'PM'; continue }
    if (x.k === 'el') { out += x.v[0] === 'h' ? String(Math.floor(v * 24)) : x.v[0] === 'm' ? String(Math.floor(v * 1440)) : String(Math.round(v * 86400)); continue }
    if (x.k === 'dt') {
      const k = x.v
      if (k[0] === 'y') { out += k.length <= 2 ? two(d.y % 100) : String(d.y); continue }
      if (k[0] === 'd') { out += k === 'd' ? d.d : k === 'dd' ? two(d.d) : k === 'ddd' ? 요일영[d.w] : 요일영[d.w] + 'day'; continue }
      if (k[0] === 'a') { out += k === 'aaa' ? 요일[d.w] : 요일[d.w] + '요일'; continue }
      if (k[0] === 'h') { const h = ampm ? (H % 12 || 12) : H; out += k === 'hh' ? two(h) : h; continue }
      if (k[0] === 's') { out += k === 'ss' ? two(S) : S; continue }
      if (k[0] === 'm') {
        // h 뒤 · s 앞의 m 은 분
        let prev = null, nx = null
        for (let j = i - 1; j >= 0; j--) if (t[j].k === 'dt') { prev = t[j].v; break }
        for (let j = i + 1; j < t.length; j++) if (t[j].k === 'dt') { nx = t[j].v; break }
        const 분 = (prev && prev[0] === 'h') || (nx && nx[0] === 's')
        if (분 && k.length <= 2) out += k === 'mm' ? two(M) : M
        else out += k === 'm' ? d.m : k === 'mm' ? two(d.m) : k === 'mmm' ? 달영[d.m - 1] : k === 'mmmmm' ? 달영[d.m - 1][0] : 달영[d.m - 1]
        continue
      }
    }
    if (x.k === 'dot') { out += '.'; continue }
    if (x.k === 'comma') { out += ','; continue }
    if (x.k === 'pct') { out += '%'; continue }
    if (x.k === 'd') out += x.v === '0' ? '0' : ''
  }
  return out
}

/**
 * 값 → 보이는 글
 * @returns {{t:string, color:string|null, 수:boolean}}
 */
export function 꼴(v, code) {
  if (v && typeof v === 'object' && 'e' in v) return { t: v.e, color: null, 수: false }
  if (v === null || v === undefined) return { t: '', color: null, 수: false }
  if (typeof v === 'boolean') return { t: v ? 'TRUE' : 'FALSE', color: null, 수: false }
  if (!code || code === 'General') {
    if (typeof v === 'number') return { t: 일반표시(v), color: null, 수: true }
    return { t: String(v), color: null, 수: false }
  }
  const secs = 풀이(code)
  if (typeof v === 'string') {
    const s4 = secs.length >= 4 ? secs[3] : secs.find((s) => s.글 && !s.수 && !s.날짜) || null
    if (!s4) return { t: v, color: null, 수: false }
    return { t: s4.t.map((x) => (x.k === 'lit' ? x.v : x.k === 'at' ? v : '')).join(''), color: s4.color, 수: false }
  }
  // 수 — 어느 칸?
  let sec, 빼기 = false
  const conds = secs.some((s) => s.cond)
  if (conds) {
    const ok = (s) => { if (!s.cond) return false; const [o, n] = s.cond; return o === '<' ? v < n : o === '>' ? v > n : o === '<=' ? v <= n : o === '>=' ? v >= n : o === '=' ? v === n : v !== n }
    sec = secs.find((s, i) => i < 2 && ok(s))
    if (!sec) sec = secs.filter((s) => !s.cond)[0] || secs[secs.length - 1]
    빼기 = v < 0 && !sec.cond
  } else if (secs.length === 1 || (secs.length >= 1 && secs[0].글 && !secs[0].수)) {
    sec = secs[0]; 빼기 = v < 0
  } else if (secs.length === 2) {
    sec = v < 0 ? secs[1] : secs[0]
  } else {
    sec = v > 0 ? secs[0] : v < 0 ? secs[1] : secs[2]
  }
  if (!sec) return { t: '', color: null, 수: true }
  let t
  if (sec.날짜) t = 날꼴(v, sec.t)
  else if (sec.수) t = 수꼴(v, sec.t, sec.db)
  else t = sec.t.map((x) => (x.k === 'lit' ? x.v : x.k === 'at' ? 일반표시(v) : x.k === 'pct' ? '%' : '')).join('')
  if (빼기 && sec.수 && /[1-9]/.test(t)) t = '-' + t
  else if (빼기 && sec.수 && !sec.날짜) t = '-' + t
  return { t, color: sec.color, 수: true }
}
