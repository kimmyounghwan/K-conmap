/**
 * ⚡ 도면 물량 자동 — 도면에 «적힌» 물량을 누르지 않고 읽습니다 (2026-09-27)
 *
 * 소장님: 「도면을 주면 수량산출서가 나오게 안돼? 건축이든, 토목이든」 → 「도면에 나와 있는 모든 물량」
 *
 * ■ 세 가지
 *   ① 도면에 적힌 표 — 「철근 재료표」「수량표」「재료표」「집계표」… 제목이 «~표» 인 것을 찾아 칸을 그대로 옮깁니다.
 *       철근 재료표는 직경별 무게(KS D 3504 단위중량)로, 수량표는 품명·규격·단위별로 모읍니다.
 *   ② 횡단면 토공 — 측점(STA·NO)마다 적힌 깎기·쌓기 면적을 읽어 평균단면법으로 셉니다.
 *       한 측점 둘레 표의 «숫자 자리» 를 본으로 삼아, 모든 측점에서 같은 자리의 숫자를 읽습니다.
 *   ③ 레이어·블록·글자 세기 — 레이어별 선 길이·닫힌 면적, 블록 이름별 개수, 글자별 개수 (네모 안만 셀 수 있음)
 *
 * ■ 도면을 «해석» 하지 않습니다. 도면에 적힌 글자·숫자를 자리대로 옮길 뿐입니다.
 *    그래서 결과에는 늘 «어디서 읽었나(네모)» 를 붙여 사람이 도면과 맞춰 보게 합니다.
 * ■ 모델은 골조도면.js 의 도면읽기() 가 만든 것(E·Q·P·T·I·layers). 좌표는 도면 가운데를 뺀 값.
 * ■ 시험: node tools/시험_도면자동.mjs (가상 예시 도면 web/public/jeoksan/토목_예시.dxf)
 */
import { 종류 } from './골조도면.js'
import { 철근표, 규격 } from './골조.js'

/* ───────────────────────────── 글자 도우미 */
export const 붙임 = (s) => String(s ?? '').replace(/\s+/g, '')
const 수식 = /^[-+]?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?$/
/** 순수한 숫자 글자인가 («1,234.5» «-0.9») */
export function 숫자인가(s) { return 수식.test(붙임(s)) }
export function 숫자(s) { const t = 붙임(s).replace(/,/g, ''); return 수식.test(붙임(s)) ? parseFloat(t) : NaN }
/** 칸 글에서 숫자 — 「IP2 4.113」 처럼 곁글이 붙었으면 끝의 숫자 */
export function 칸숫자(s) {
  if (숫자인가(s)) return 숫자(s)
  const tok = String(s ?? '').trim().split(/\s+/).filter((t) => 숫자인가(t))
  return tok.length ? 숫자(tok[tok.length - 1]) : NaN
}
const 같은말 = new Set(['"', '〃', '″', '”', '“', "''", '＂', '〃〃', '"'])
/** 글자 폭(대충) — 한글은 넓게 */
export function 글자폭(T, i) {
  const s = T.s[i]
  let w = 0
  for (const ch of s) w += /[ㄱ-힝]/.test(ch) ? 1.0 : (ch === ' ' ? 0.5 : 0.75)
  return w * T.h[i]
}
function 수평(T, i) { const a = T.a[i]; return Math.abs(Math.sin(a)) < 0.12 && Math.cos(a) > 0 }
function 가운데값(a) { if (!a.length) return 0; const b = a.slice().sort((p, q) => p - q); return b[b.length >> 1] }

/** 글자 칸(index 목록)을 줄로 — 위에서 아래로 · 줄 안은 왼쪽에서 오른쪽 */
export function 줄묶기(T, ids) {
  const a = ids.slice().sort((p, q) => T.y[q] - T.y[p])
  const 줄 = []
  for (const i of a) {
    const last = 줄[줄.length - 1]
    const h = T.h[i]
    if (last && Math.abs(last.y - T.y[i]) <= 0.55 * Math.max(h, last.h)) { last.ids.push(i); last.y = (last.y * (last.ids.length - 1) + T.y[i]) / last.ids.length }
    else 줄.push({ y: T.y[i], h, ids: [i] })
  }
  for (const r of 줄) r.ids.sort((p, q) => T.x[p] - T.x[q])
  return 줄
}

/* ───────────────────────────── ① 도면에 적힌 표 */

const 제목말 = /(재료|수량|물량|자재|집계|가공|철근|산출|토공|일람|내역|마감|조서|공종|총괄|면적|구적)/
/** 표 제목인가 — 「철 근 재 료 표」「수량집계표(1)」「주요 자재표」 */
export function 표제목인가(s) {
  const t = 붙임(s).replace(/\(.*?\)$/, '').replace(/\[.*?\]$/, '').replace(/[-–_#]?\d{1,2}$/, '')
  if (t.length < 3 || t.length > 24) return false
  if (!/표$/.test(t)) return false
  return 제목말.test(t)
}

const 칸이름 = {
  기호: /^(기호|부호|번호|철근번호|NO\.?|MARK)$/i,
  직경: /^(직경|규격|지름|철근경|철근규격|DIA\.?|SIZE)$/i,
  길이: /^(길이|1본길이|단위길이|LENGTH)$/i,
  개수: /^(개수|수량|본수|갯수|EA|Q'?TY)$/i,
  총길이: /^(총길이|총연장|총장|합계길이|TOTALLENGTH)$/i,
  단위무게: /^(단위무게|단위중량|단위질량|UNITWEIGHT)$/i,
  총무게: /^(총무게|총중량|중량|무게|WEIGHT|총질량)$/i,
  할증: /^(할증|할증량|할증포함)$/i,
  품명: /^(품명|공종|명칭|재료|재료명|항목|구분|종류|자재명|품목|공종명)$/,
  단위: /^(단위|UNIT)$/i,
  수량: /^(수량|물량|계|합계|QUANTITY|총수량)$/i,
}
/** 머리 글에서 괄호(단위) 떼고 뜻 찾기 */
function 칸뜻(머리) {
  const t = 붙임(머리).replace(/\(.*?\)/g, '').replace(/[[\]]/g, '')
  for (const [k, re] of Object.entries(칸이름)) if (re.test(t)) return k
  return ''
}

/**
 * 도면의 표를 모두 찾습니다.
 * @returns [{id, 제목, 종류:'철근'|'수량'|'기타', 머리:[...], 뜻:[...], 줄:[[글...]], 줄y, r:[x0,y0,x1,y1], 글자:[ids], 단위길이:'m'|'mm'}]
 */
export function 표찾기(모델) {
  const T = 모델.T
  const n = T.s.length
  const 표들 = []
  const 제목들 = []
  for (let i = 0; i < n; i++) if (수평(T, i) && 표제목인가(T.s[i])) 제목들.push(i)
  const 쓴 = new Set()
  for (const ti of 제목들) {
    const 표 = 제목아래표(모델, ti, 제목들)
    if (!표) continue
    if (표.글자.some((i) => 쓴.has(i))) continue          // 같은 표를 두 번 잡지 않게
    for (const i of 표.글자) 쓴.add(i)
    표.id = 표들.length
    표들.push(표)
  }
  return 표들
}

function 제목아래표(모델, ti, 제목들) {
  const T = 모델.T
  const th = T.h[ti]
  const tw = 글자폭(T, ti)
  const cx = T.x[ti] + tw / 2
  const 반폭 = Math.max(28 * th, 3 * tw)
  const X0 = cx - 반폭, X1 = cx + 반폭
  const 아래끝 = T.y[ti] - 400 * th
  const 후보 = []
  const 딴제목 = new Set(제목들.filter((j) => j !== ti))
  for (let i = 0; i < T.s.length; i++) {
    if (i === ti || !수평(T, i)) continue
    const y = T.y[i]
    if (y >= T.y[ti] - 0.3 * th || y < 아래끝) continue
    const x = T.x[i], w = 글자폭(T, i)
    if (x + w < X0 || x > X1) continue
    후보.push(i)
  }
  if (!후보.length) return null
  const 줄 = 줄묶기(T, 후보)
  // 제목 바로 아래 줄들: 머리(숫자 없는 줄) → 몸통(숫자 있는 줄)
  const 머리줄 = []
  const 몸줄 = []
  let 앞y = T.y[ti]
  let 간격들 = []
  for (const r of 줄) {
    if (r.ids.some((i) => 딴제목.has(i))) break
    const gap = 앞y - r.y
    const h = Math.max(r.h, th * 0.3)
    if (!몸줄.length) {
      if (gap > Math.max(10 * h, 3 * th)) { if (!머리줄.length) return null; break }
    } else {
      const 보통 = 가운데값(간격들) || 3 * h
      if (gap > Math.max(2.6 * 보통, 5 * h)) break
    }
    const 숫자있음 = r.ids.some((i) => 숫자인가(T.s[i]))
    if (!몸줄.length && !숫자있음) { if (머리줄.length >= 5) return null; 머리줄.push(r) }
    else { 몸줄.push(r); if (몸줄.length > 1) 간격들.push(gap) }
    앞y = r.y
    if (몸줄.length > 400) break
  }
  if (!머리줄.length || !몸줄.length) return null
  // 머리 줄에 섞여 든 «딴 레이어의 떨어진 글자» 는 뺌 — 표 옆 평면의 기호(AW2)가 머리와 같은 높이에 있을 때 (9/27 마감 예시에서 잡음)
  {
    const E = 모델.E
    const 층수 = new Map()
    for (const r of 머리줄) for (const i of r.ids) { const L = E.ly[T.e[i]]; 층수.set(L, (층수.get(L) || 0) + 1) }
    let 큰층 = -1, 큰수 = -1
    for (const [L, n] of 층수) if (n > 큰수) { 큰수 = n; 큰층 = L }
    const 표층글 = 머리줄.flatMap((r) => r.ids.filter((i) => E.ly[T.e[i]] === 큰층))
    const hh0 = 가운데값(머리줄.flatMap((r) => r.ids.map((i) => T.h[i])))
    for (const r of 머리줄) {
      r.ids = r.ids.filter((i) => {
        if (E.ly[T.e[i]] === 큰층) return true
        const a0 = T.x[i], a1 = T.x[i] + 글자폭(T, i)
        let d = Infinity
        for (const j of 표층글) { const b0 = T.x[j], b1 = T.x[j] + 글자폭(T, j); d = Math.min(d, Math.max(0, b0 - a1, a0 - b1)) }
        return d <= 6 * hh0
      })
    }
  }
  // 머리의 가로 넓이 → 몸통은 그 안의 글자만
  let hx0 = Infinity, hx1 = -Infinity
  for (const r of 머리줄) for (const i of r.ids) { hx0 = Math.min(hx0, T.x[i]); hx1 = Math.max(hx1, T.x[i] + 글자폭(T, i)) }
  const hh = 가운데값(머리줄.flatMap((r) => r.ids.map((i) => T.h[i])))
  // 머리가 한 글자뿐이면(예: 강종 표시) 몸통 넓이로
  if (머리줄.flatMap((r) => r.ids).length < 2) return null
  const 여유 = 1.5 * hh
  const 안 = (i) => T.x[i] + 글자폭(T, i) / 2 >= hx0 - 여유 && T.x[i] + 글자폭(T, i) / 2 <= hx1 + 여유
  // 칸: 머리 글자의 가운데로 묶음
  const 머리글 = 머리줄.flatMap((r) => r.ids.filter(안))
  const 가운데 = 머리글.map((i) => ({ i, c: T.x[i] + 글자폭(T, i) / 2 })).sort((a, b) => a.c - b.c)
  const 칸 = []
  for (const g of 가운데) {
    const last = 칸[칸.length - 1]
    if (last && Math.abs(g.c - last.c) < 1.6 * hh) { last.ids.push(g.i); last.c = (last.c + g.c) / 2 } else 칸.push({ c: g.c, ids: [g.i] })
  }
  if (칸.length < 2) return null
  const 머리 = 칸.map((k) => k.ids.slice().sort((a, b) => T.y[b] - T.y[a]).map((i) => 붙임(T.s[i])).join(' '))
  const 뜻 = 칸.map((k) => { for (const i of k.ids.slice().sort((a, b) => T.y[b] - T.y[a])) { const f = 칸뜻(T.s[i]); if (f) return f } return '' })
  // 몸통 칸 채우기
  const 표줄 = []
  const 줄y = []
  const 글자 = [ti, ...머리글]
  for (const r of 몸줄) {
    const ids = r.ids.filter(안)
    if (!ids.length) continue
    const row = 칸.map(() => '')
    for (const i of ids) {
      const c = T.x[i] + 글자폭(T, i) / 2
      let best = 0, bd = Infinity
      칸.forEach((k, j) => { const d = Math.abs(k.c - c); if (d < bd) { bd = d; best = j } })
      // 오른쪽 맞춤 숫자는 가운데가 조금 비킴 — 그래도 가장 가까운 칸
      row[best] = row[best] ? row[best] + ' ' + T.s[i].trim() : T.s[i].trim()
      글자.push(i)
    }
    표줄.push(row); 줄y.push(r.y)
  }
  // 같음표(〃) → 위 칸 값
  for (let a = 1; a < 표줄.length; a++) for (let j = 0; j < 칸.length; j++) if (같은말.has(붙임(표줄[a][j]))) 표줄[a][j] = 표줄[a - 1][j]
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (const i of 글자) { x0 = Math.min(x0, T.x[i]); x1 = Math.max(x1, T.x[i] + 글자폭(T, i)); y0 = Math.min(y0, T.y[i]); y1 = Math.max(y1, T.y[i] + T.h[i]) }
  const 제목 = 붙임(T.s[ti])
  const 종 = 표종류(제목, 뜻)
  const 표 = { 제목, 제목글: T.s[ti].trim(), 종류: 종, 머리, 뜻, 줄: 표줄, 줄y, r: [x0 - hh, y0 - hh, x1 + hh, y1 + hh], 글자 }
  if (종 === '철근') 표.단위길이 = 길이단위(표)
  return 표
}

function 표종류(제목, 뜻) {
  const 있 = (k) => 뜻.includes(k)
  if ((/철근/.test(제목) || 있('직경')) && 있('직경') && (있('길이') || 있('총길이'))) return '철근'
  if (있('품명') && 있('단위') && (있('수량') || 있('개수'))) return '수량'
  return '기타'
}

/** 철근표 길이 단위 — 머리에 (MM)·(M) 이 있으면 그것, 없으면 값 크기로 */
function 길이단위(표) {
  const j = 표.뜻.indexOf('길이')
  const 머 = j >= 0 ? 표.머리[j].toUpperCase() : ''
  if (/\(MM\)/.test(머)) return 'mm'
  if (/\(M\)/.test(머)) return 'm'
  const vs = 표.줄.map((r) => 숫자(r[j])).filter((v) => v > 0)
  return 가운데값(vs) > 60 ? 'mm' : 'm'
}

const 소계말 = /(소계|합계|총계|계$|TOTAL|SUB)/i

/**
 * 철근 재료표 → 직경별 모음
 * @returns {{줄:[{표, 기호, 규격, d, 길이m, 개수, 총길이m, kg, 식}], 합:[{규격, d, 총길이m, kg}], 검산:[글]}}
 */
export function 철근모으기(표들) {
  const 줄 = []
  const 검산 = []
  for (const 표 of 표들) {
    if (표.종류 !== '철근') continue
    const j = (k) => 표.뜻.indexOf(k)
    const jd = j('직경'), jl = j('길이'), jn = j('개수'), jt = j('총길이'), jg = j('기호'), jw = j('총무게')
    const 배 = 표.단위길이 === 'mm' ? 0.001 : 1
    let 소계길이 = 0
    let 앞d = ''
    for (const r of 표.줄) {
      const 첫 = 붙임(r[0] || '') + 붙임(r[jg] || '')
      if (소계말.test(첫) || r.every((c, k) => !c || k === jt || k === jw || 숫자인가(c) || 소계말.test(붙임(c))) && 소계말.test(r.join(''))) {
        // 소계 줄: 적힌 총길이와 우리 합을 맞춰 봄
        const 적힌 = jt >= 0 ? 칸숫자(r[jt]) : NaN
        if (Number.isFinite(적힌) && 소계길이 > 0 && !/총/.test(첫) && Math.abs(적힌 * 배 - 소계길이) > 0.02 + 소계길이 * 0.002) {
          검산.push(표.제목 + ' 소계(' + (앞d || '') + '): 표에 적힌 총길이 ' + r[jt] + ' · 줄마다 더한 값 ' + 소계길이.toFixed(3) + ' m')
        }
        소계길이 = 0
        continue
      }
      const d = 규격(r[jd])
      if (!d) continue
      const L = 칸숫자(r[jl]) * 배
      const n = 칸숫자(r[jn])
      let 총 = Number.isFinite(L) && Number.isFinite(n) ? L * n : NaN
      const 적힌총 = jt >= 0 ? 칸숫자(r[jt]) * 배 : NaN
      if (Number.isFinite(적힌총)) {
        if (Number.isFinite(총) && Math.abs(총 - 적힌총) > 0.01 + 적힌총 * 0.002) 검산.push(표.제목 + ' ' + (r[jg] || '') + ': 길이×개수 ' + 총.toFixed(3) + ' ≠ 적힌 총길이 ' + r[jt])
        if (!Number.isFinite(총)) 총 = 적힌총
      }
      if (!Number.isFinite(총) || 총 <= 0) continue
      const kgm = 철근표[d][1]
      const 식 = Number.isFinite(L) && Number.isFinite(n) ? 수글(L) + '*' + n + '*' + kgm : 수글(총) + '*' + kgm
      줄.push({ 표: 표.id, 제목: 표.제목, 기호: r[jg] || '', 규격: (r[jd] || '').trim(), d, 길이m: L, 개수: n, 총길이m: 총, kg: 총 * kgm, 식 })
      소계길이 += 총
      앞d = r[jd]
    }
  }
  const m = new Map()
  for (const x of 줄) { const a = m.get(x.d) || { d: x.d, 규격들: new Set(), 총길이m: 0, kg: 0, n: 0 }; a.규격들.add(x.규격); a.총길이m += x.총길이m; a.kg += x.kg; a.n++; m.set(x.d, a) }
  const 합 = [...m.values()].sort((a, b) => parseInt(a.d.slice(1), 10) - parseInt(b.d.slice(1), 10)).map((a) => ({ ...a, 규격들: [...a.규격들].join('·') }))
  return { 줄, 합, 검산 }
}

/** 수량표 → 품명·규격·단위별 */
export function 수량모으기(표들) {
  const 줄 = []
  for (const 표 of 표들) {
    if (표.종류 !== '수량') continue
    const j = (k) => 표.뜻.indexOf(k)
    const jp = j('품명'), ju = j('단위')
    let jq = j('수량'); if (jq < 0) jq = j('개수')
    const jg = 표.뜻.indexOf('직경')
    for (const r of 표.줄) {
      const 품 = (r[jp] || '').trim()
      if (!품 || 소계말.test(붙임(품))) continue
      const q = 칸숫자(r[jq])
      if (!Number.isFinite(q)) continue
      줄.push({ 표: 표.id, 제목: 표.제목, 품명: 품, 규격: jg >= 0 ? (r[jg] || '').trim() : '', 단위: (r[ju] || '').trim(), 수량: q })
    }
  }
  const m = new Map()
  for (const x of 줄) { const k = x.품명 + '|' + x.규격 + '|' + x.단위; const a = m.get(k) || { 품명: x.품명, 규격: x.규격, 단위: x.단위, 수량: 0, 식: [] }; a.수량 += x.수량; a.식.push(수글(x.수량)); m.set(k, a) }
  return { 줄, 합: [...m.values()].map((a) => ({ ...a, 식: a.식.join('+') })) }
}

export function 수글(v, 자리 = 3) {
  if (!Number.isFinite(v)) return ''
  const r = Math.round(v * 10 ** 자리) / 10 ** 자리
  return String(Object.is(r, -0) ? 0 : r)
}

/* ───────────────────────────── ② 횡단면 토공 */

/** 측점 글자 → m. 「STA.0+020.00」 20 · 「STA.1-120」 −880? 아님 → 「0-020」 은 −20 · 「NO.5+10」 110 · 「NO.5」 100 */
export function 측점값(s) {
  const t = 붙임(s).toUpperCase().replace(/^측점[:=]?/, '')
  let m = t.match(/^(?:STA\.?|STA:)?(\d{1,3})([+-])(\d{1,4}(?:\.\d+)?)$/)
  if (m) { const km = +m[1], mm = +m[3]; return m[2] === '+' ? km * 1000 + mm : km * 1000 - mm }
  m = t.match(/^NO\.?(\d{1,4})(?:([+-])(\d{1,3}(?:\.\d+)?))?$/)
  if (m) { const v = +m[1] * 20; return m[3] ? (m[2] === '+' ? v + +m[3] : v - +m[3]) : v }
  return NaN
}
/** STA 가 «−» 로 적힌 것(0-020)은 시점 앞쪽 −20m 입니다. */

/** 도면의 측점 글자들 → [{i, 글, 측(m), x, y, h}] */
export function 측점찾기(모델) {
  const T = 모델.T
  const out = []
  for (let i = 0; i < T.s.length; i++) {
    if (!수평(T, i)) continue
    const s = T.s[i]
    if (s.length > 24) continue
    if (!/(STA|NO\.?|측점|\d[+-]\d)/i.test(s)) continue
    const v = 측점값(s)
    if (!Number.isFinite(v)) continue
    // «1+2» 같은 식 글자를 막으려고: STA·NO 가 없으면 소수점 자리(0+020.000)나 3자리(0+020)가 있어야 함
    if (!/(STA|NO|측점)/i.test(s) && !/[+-]\d{3}/.test(붙임(s))) continue
    out.push({ i, 글: s.trim(), 측: v, x: T.x[i], y: T.y[i], h: T.h[i] })
  }
  return out
}

/** 측점들을 «세로 줄(같은 x)» 로 묶어 노선 후보로 */
export function 노선묶기(측점) {
  const 묶음 = []
  const 차례 = 측점.slice().sort((a, b) => a.x - b.x)
  for (const s of 차례) {
    const g = 묶음.find((b) => Math.abs(b.x - s.x) < 3 * s.h)
    if (g) { g.점.push(s); g.x = (g.x * (g.점.length - 1) + s.x) / g.점.length } else 묶음.push({ x: s.x, 점: [s] })
  }
  // 두 개 이하 짜리는, 겹치는 측점이 없는 가장 가까운 묶음에 붙임
  const 큰 = 묶음.filter((g) => g.점.length > 2)
  if (큰.length) {
    for (const g of 묶음.filter((b) => b.점.length <= 2)) {
      let best = null, bd = Infinity
      for (const b of 큰) {
        if (b.점.some((p) => g.점.some((q) => Math.abs(p.측 - q.측) < 1e-6))) continue
        const d = Math.abs(b.x - g.x)
        if (d < bd) { bd = d; best = b }
      }
      if (best) { best.점.push(...g.점); g.점 = [] }
    }
  }
  return 묶음.filter((g) => g.점.length).map((g, k) => ({ 번호: k + 1, 점: g.점.sort((a, b) => a.측 - b.측) }))
}

/** 본으로 삼을 측점 — 노선에서 가장 많은 측점이 놓인 세로 줄의 가운데 것 */
export function 본측점고르기(노선) {
  const 점 = 노선.점
  if (!점.length) return null
  let best = null, bn = -1
  for (const p of 점) { const n = 점.filter((q) => Math.abs(q.x - p.x) < 3 * p.h).length; if (n > bn) { bn = n; best = p } }
  const 줄 = 점.filter((q) => Math.abs(q.x - best.x) < 3 * best.h).sort((a, b) => b.y - a.y)
  return 줄[줄.length >> 1]
}

/** 측점 둘레 표의 네모를 짐작 — 같은 줄(측점 글자 줄)의 넓이 × 측점 사이 간격의 «가장 큰 빈 틈» 사이 */
export function 본네모짐작(모델, s, 같은줄측점) {
  const T = 모델.T
  const h = s.h
  // 가로: 측점 글자와 같은 줄에 붙은 글자들
  const row = []
  for (let i = 0; i < T.s.length; i++) if (수평(T, i) && Math.abs(T.y[i] - s.y) < 0.9 * h && Math.abs(T.x[i] - s.x) < 200 * h) row.push(i)
  row.sort((a, b) => T.x[a] - T.x[b])
  // 측점 글자에서 좌우로 틈이 30h 넘지 않게 이어진 것 (표 머리 줄: 측점 · 지반고 · 계획고 …)
  let k = row.indexOf(s.i)
  let lo = k, hi = k
  while (lo > 0 && T.x[row[lo]] - (T.x[row[lo - 1]] + 글자폭(T, row[lo - 1])) < 30 * h) lo--
  while (hi < row.length - 1 && T.x[row[hi + 1]] - (T.x[row[hi]] + 글자폭(T, row[hi])) < 30 * h) hi++
  const x0 = T.x[row[lo]] - 4 * h, x1 = T.x[row[hi]] + 글자폭(T, row[hi]) + 4 * h
  // 세로: 위아래 측점과의 간격(P) 안에서 글자 없는 가장 큰 틈 둘
  // P: 같은 세로 줄 측점 사이의 가장 좁은 간격 (표 하나의 높이는 이보다 클 수 없음)
  const 줄y = (같은줄측점 || []).map((p) => p.y).sort((a, b) => a - b)
  let P = Infinity
  for (let j = 1; j < 줄y.length; j++) { const d = 줄y[j] - 줄y[j - 1]; if (d > h && d < P) P = d }
  if (!Number.isFinite(P)) P = 40 * h
  const 안ys = []
  for (let i = 0; i < T.s.length; i++) {
    const cx = T.x[i] + 글자폭(T, i) / 2
    if (cx < x0 || cx > x1) continue
    if (Math.abs(T.y[i] - s.y) > P) continue
    안ys.push(T.y[i])
  }
  안ys.push(s.y - P, s.y + P)                // 끝의 빈자리도 틈으로 셈
  안ys.sort((a, b) => a - b)
  // s.y 위쪽 틈 · 아래쪽 틈
  let 위 = s.y + P / 2, 아래 = s.y - P / 2
  let 큰위 = 0, 큰아래 = 0
  for (let j = 1; j < 안ys.length; j++) {
    const a = 안ys[j - 1], b = 안ys[j], gap = b - a, mid = (a + b) / 2
    if (a >= s.y - 0.1 * h && gap > 큰위 && mid <= s.y + P) { 큰위 = gap; 위 = mid }
    if (b <= s.y + 0.1 * h && gap > 큰아래 && mid >= s.y - P) { 큰아래 = gap; 아래 = mid }
  }
  // 위·아래로 틈이 없으면 반 간격
  if (!(큰위 > 1.2 * h)) 위 = s.y + P / 2
  if (!(큰아래 > 1.2 * h)) 아래 = s.y - P / 2
  // 네모 안 글자의 실제 위아래 + 여유(남는 간격의 반) — 이웃 측점의 표를 넘보지 않게
  let ymin = Infinity, ymax = -Infinity
  for (let i = 0; i < T.s.length; i++) {
    const cx = T.x[i] + 글자폭(T, i) / 2
    if (cx < x0 || cx > x1 || T.y[i] < 아래 || T.y[i] > 위) continue
    ymin = Math.min(ymin, T.y[i]); ymax = Math.max(ymax, T.y[i] + T.h[i])
  }
  if (Number.isFinite(ymin)) {
    const 여 = Math.max(0.3 * h, Math.min((P - (ymax - ymin)) / 2 - 0.1 * h, 3 * h))
    아래 = ymin - 여; 위 = ymax + 여
  }
  return [x0, 아래, x1, 위]
}

/**
 * 본 만들기 — 네모 안 숫자 글자의 자리(측점 글자에서 떨어진 만큼)와 이름
 * 같은 노선의 모든 측점에서 같은 네모(측점 기준)를 보고, 한 번이라도 숫자가 있던 자리를 모두 칸으로 삼습니다
 * (어떤 측점에서는 비어 있는 칸도 빠지지 않게).
 */
export function 본만들기(모델, s, 네모, 점들) {
  const T = 모델.T
  const 상대 = [네모[0] - s.x, 네모[1] - s.y, 네모[2] - s.x, 네모[3] - s.y]
  const 측점글자 = new Set((점들 || []).map((p) => p.i).concat([s.i]))
  const 네모안 = (p) => {
    const [x0, y0, x1, y1] = [p.x + 상대[0], p.y + 상대[1], p.x + 상대[2], p.y + 상대[3]]
    const out = []
    for (let i = 0; i < T.s.length; i++) {
      if (측점글자.has(i) || !수평(T, i)) continue
      const cx = T.x[i] + 글자폭(T, i) / 2, cy = T.y[i] + T.h[i] / 2
      if (cx >= x0 && cx <= x1 && cy >= y0 && cy <= y1) out.push(i)
    }
    return out
  }
  const 칸 = []
  const 보기점 = [s].concat((점들 || []).filter((p) => p.i !== s.i))
  for (const p of 보기점) {
    const 안 = 네모안(p)
    const 숫자들 = 안.filter((i) => 숫자인가(T.s[i]))
    for (const i of 숫자들) {
      const dx = T.x[i] - p.x, 끝dx = T.x[i] + 글자폭(T, i) - p.x, dy = T.y[i] - p.y, h = T.h[i]
      const c = 칸.find((k) => Math.abs(k.dy - dy) < 0.6 * h && (Math.abs(k.dx - dx) < 0.9 * h || Math.abs(k.끝dx - 끝dx) < 0.9 * h))
      if (c) { c.n++; continue }
      칸.push({ dx, 끝dx, dy, h, n: 1, 이름: 이름짓기(T, 안, 숫자들, i), 무리: '', 본값: p === s ? 숫자(T.s[i]) : null })
    }
  }
  // 무리(세로로 쌓은 말) 이름 — s 네모 안에서
  const 안s = 네모안(s)
  const 세로 = 세로말찾기(T, 안s.filter((i) => !숫자인가(T.s[i])))
  for (const c of 칸) {
    // s 기준 자리에서 이름 글자를 다시 찾아 무리를 붙임
    const y = s.y + c.dy
    let 이름i = -1, best = -Infinity
    for (const j of 안s) {
      if (숫자인가(T.s[j]) || 붙임(T.s[j]).length === 1) continue
      if (Math.abs(T.y[j] - y) > 0.8 * c.h) continue
      const 끝 = T.x[j] + 글자폭(T, j)
      if (끝 > s.x + c.dx + 0.5 * c.h || 끝 <= best) continue
      best = 끝; 이름i = j
    }
    if (이름i < 0) continue
    const lx = T.x[이름i], ly = T.y[이름i]
    let bw = null, bd = Infinity
    for (const w of 세로) {
      if (w.x >= lx) continue
      const d = lx - w.x
      if (d > 6 * c.h) continue
      // 세로 글자는 합친 칸의 가운데에 놓이므로 위아래로 넉넉히
      const 늘 = (w.y1 - w.y0) * 0.6 + 1.5 * c.h
      if (ly < w.y0 - 늘 || ly > w.y1 + 늘) continue
      if (d < bd) { bd = d; bw = w }
    }
    if (bw) c.무리 = bw.글
  }
  // 이름 겹치면 무리 붙이고, 그래도 겹치면 번호
  칸.sort((a, b) => b.dy - a.dy || a.dx - b.dx)
  const 셈 = new Map()
  for (const c of 칸) { const k = c.이름 || '?'; 셈.set(k, (셈.get(k) || 0) + 1) }
  for (const c of 칸) { if (!c.이름) c.이름 = c.무리 || '칸'; else if (셈.get(c.이름) > 1 && c.무리) c.이름 = c.무리 + '·' + c.이름 }
  const 또 = new Map()
  for (const c of 칸) 또.set(c.이름, (또.get(c.이름) || 0) + 1)
  const 번 = new Map()
  for (const c of 칸) { if (또.get(c.이름) > 1) { const n = (번.get(c.이름) || 0) + 1; 번.set(c.이름, n); c.이름 = c.이름 + '(' + n + ')' } }
  for (const c of 칸) {
    c.쓰기 = !/(지반고|계획고|EL|표고|높이|폭|구배|경사|측점)/i.test(c.이름)
    c.단위 = /(길이|연장|\(M\)$)/i.test(c.이름) ? 'm' : '㎡'
  }
  return { 측점: s.i, 네모, 네모상대: 상대, 칸 }
}

/** 숫자 i 의 이름 — 같은 줄 왼쪽의 가장 가까운 글(사이에 다른 숫자가 끼면 없음) */
function 이름짓기(T, 안, 숫자들, i) {
  const h = T.h[i]
  let 이름i = -1, best = -Infinity
  for (const j of 안) {
    if (숫자인가(T.s[j]) || 붙임(T.s[j]).length === 1) continue
    if (Math.abs(T.y[j] - T.y[i]) > 0.8 * Math.max(h, T.h[j])) continue
    const 끝 = T.x[j] + 글자폭(T, j)
    if (끝 > T.x[i] + 0.5 * h) continue
    if (끝 > best) { best = 끝; 이름i = j }
  }
  if (이름i < 0) return ''
  const 사이숫자 = 숫자들.some((q) => q !== i && Math.abs(T.y[q] - T.y[i]) < 0.6 * h && T.x[q] < T.x[i] && T.x[q] > best - 0.5 * h)
  return 사이숫자 ? '' : 붙임(T.s[이름i])
}

/** 한 글자씩 세로로 쌓은 말(「흙/쌓/기」) */
function 세로말찾기(T, 글들) {
  const 외자 = 글들.filter((i) => 붙임(T.s[i]).length === 1).sort((a, b) => T.x[a] - T.x[b] || T.y[b] - T.y[a])
  const 세로말 = []
  for (const i of 외자) {
    const g = 세로말.find((w) => Math.abs(w.x - T.x[i]) < 0.4 * T.h[i] && w.ids.some((j) => Math.abs(T.y[j] - T.y[i]) < 3.2 * T.h[i]))
    if (g) g.ids.push(i); else 세로말.push({ x: T.x[i], ids: [i] })
  }
  for (const w of 세로말) { w.ids.sort((a, b) => T.y[b] - T.y[a]); w.글 = w.ids.map((i) => 붙임(T.s[i])).join(''); w.y0 = Math.min(...w.ids.map((i) => T.y[i])); w.y1 = Math.max(...w.ids.map((i) => T.y[i] + T.h[i])) }
  return 세로말.filter((w) => w.ids.length >= 2)
}

/** 모든 측점에서 본의 자리를 읽음 */
export function 본읽기(모델, 본, 측점) {
  const T = 모델.T
  // 글자 찾기판(세로 칸)
  const hmax = Math.max(...본.칸.map((c) => c.h), 1e-9)
  const 칸높이 = hmax * 2
  const 판 = new Map()
  for (let i = 0; i < T.s.length; i++) {
    if (!숫자인가(T.s[i])) continue
    const k = Math.floor(T.y[i] / 칸높이)
    const a = 판.get(k); if (a) a.push(i); else 판.set(k, [i])
  }
  const out = []
  for (const s of 측점) {
    const 값 = []
    let 찾음 = 0
    const 글자 = []
    for (const c of 본.칸) {
      const y = s.y + c.dy, x = s.x + c.dx, 끝 = s.x + c.끝dx
      let hit = -1
      for (const k of [Math.floor(y / 칸높이) - 1, Math.floor(y / 칸높이), Math.floor(y / 칸높이) + 1]) {
        for (const i of 판.get(k) || []) {
          if (Math.abs(T.y[i] - y) > 0.6 * c.h) continue
          if (Math.abs(T.x[i] - x) < 0.9 * c.h || Math.abs(T.x[i] + 글자폭(T, i) - 끝) < 0.9 * c.h) { hit = i; break }
        }
        if (hit >= 0) break
      }
      if (hit >= 0) { 값.push(숫자(T.s[hit])); 찾음++; 글자.push(hit) } else 값.push(0)
    }
    out.push({ ...s, 값, 찾음, 글자 })
  }
  return out
}

/**
 * 평균단면법
 * @param 읽음 본읽기 결과(한 노선, 측점 차례)
 * @returns {구간:[{a, b, L, 수량:[..]}], 합:[..]}
 */
export function 평균단면(읽음, 칸) {
  const 점 = 읽음.filter((p) => p.쓰기 !== false).slice().sort((a, b) => a.측 - b.측)
  // 같은 측점이 둘이면 많이 찾은 것
  const 하나 = []
  for (const p of 점) {
    const last = 하나[하나.length - 1]
    if (last && Math.abs(last.측 - p.측) < 1e-6) { if (p.찾음 > last.찾음) 하나[하나.length - 1] = p } else 하나.push(p)
  }
  const 구간 = []
  const 합 = 칸.map(() => 0)
  for (let k = 1; k < 하나.length; k++) {
    const a = 하나[k - 1], b = 하나[k]
    const L = b.측 - a.측
    const 수량 = 칸.map((c, j) => (a.값[j] + b.값[j]) / 2 * L)
    수량.forEach((v, j) => { 합[j] += v })
    구간.push({ a, b, L, 수량 })
  }
  return { 점: 하나, 구간, 합 }
}

/* ───────────────────────────── ③ 레이어·블록·글자 세기 */

/** 도형마다 상자 [x0,y0,x1,y1]·4 (글자는 글자 상자) */
export function 도형상자(모델) {
  const { E, Q, P, T } = 모델
  const n = E.t.length
  const B = new Float64Array(n * 4)
  for (let e = 0; e < n; e++) { B[e * 4] = Infinity; B[e * 4 + 1] = Infinity; B[e * 4 + 2] = -Infinity; B[e * 4 + 3] = -Infinity }
  for (let q = 0; q < Q.e.length; q++) {
    const e = Q.e[q], s = Q.p0[q], m = Q.pn[q]
    for (let k = 0; k < m; k++) {
      const x = P[(s + k) * 2], y = P[(s + k) * 2 + 1]
      if (x < B[e * 4]) B[e * 4] = x
      if (y < B[e * 4 + 1]) B[e * 4 + 1] = y
      if (x > B[e * 4 + 2]) B[e * 4 + 2] = x
      if (y > B[e * 4 + 3]) B[e * 4 + 3] = y
    }
  }
  for (let i = 0; i < T.s.length; i++) {
    const e = T.e[i]
    if (E.t[e] !== 종류.글자) continue
    const w = 글자폭(T, i)
    B[e * 4] = Math.min(B[e * 4], T.x[i]); B[e * 4 + 1] = Math.min(B[e * 4 + 1], T.y[i])
    B[e * 4 + 2] = Math.max(B[e * 4 + 2], T.x[i] + w); B[e * 4 + 3] = Math.max(B[e * 4 + 3], T.y[i] + T.h[i])
  }
  return B
}

const 길이도형 = new Set([종류.선, 종류.폴리선, 종류.닫힌폴리선, 종류.호, 종류.원, 종류.곡선])
const 면도형 = new Set([종류.닫힌폴리선, 종류.원, 종류.해치, 종류.채움, 종류.곡선])

/**
 * @param o {네모:[x0,y0,x1,y1]|null, 끈층:Set, k: 도면단위→mm, 상자: 도형상자()}
 */
export function 세기(모델, o = {}) {
  const { E, T, I, layers } = 모델
  const k = o.k || 1
  const B = o.상자 || 도형상자(모델)
  const 네모 = o.네모
  const 끈 = o.끈층 || new Set()
  const 안 = (e) => {
    if (!네모) return true
    return B[e * 4] >= 네모[0] && B[e * 4 + 1] >= 네모[1] && B[e * 4 + 2] <= 네모[2] && B[e * 4 + 3] <= 네모[3]
  }
  const 층 = layers.map((L, i) => ({ i, 이름: L.name, 길이m: 0, 선수: 0, 면적m2: 0, 면수: 0, 글수: 0, 수: 0 }))
  /* 🧭 G132 — 블록을 0.5배보다 작게(도곽 귀퉁이 위치도 · 축소 사본) 또는 2배보다 크게 넣은 도형은 물량이 아님 → 뺌 */
  const SC = E.sc
  const 사본 = (e) => SC && (SC[e] < 0.5 || SC[e] > 2)
  let 뺀사본 = 0
  for (let e = 0; e < E.t.length; e++) {
    const ly = E.ly[e]
    if (끈.has(ly)) continue
    if (!안(e)) continue
    if (사본(e)) { 뺀사본++; continue }
    const t = E.t[e]
    const a = 층[ly]
    a.수++
    if (t === 종류.글자) { a.글수++; continue }
    if (길이도형.has(t) && E.len[e] > 0) { a.길이m += E.len[e] * k / 1000; a.선수++ }
    if (면도형.has(t) && E.area[e] > 0) { a.면적m2 += E.area[e] * k * k / 1e6; a.면수++ }
  }
  const 블 = new Map()
  for (const ins of I) {
    if (!ins || /^\*/.test(ins.name)) continue
    if (끈.has(ins.ly)) continue
    if (네모 && (ins.x < 네모[0] || ins.x > 네모[2] || ins.y < 네모[1] || ins.y > 네모[3])) continue
    const key = ins.name
    const b = 블.get(key) || { 이름: key, 수: 0, 층: new Map(), 참조수: 0 }
    b.수++
    if (ins.참조) b.참조수++
    const ln = layers[ins.ly] ? layers[ins.ly].name : ''
    b.층.set(ln, (b.층.get(ln) || 0) + 1)
    블.set(key, b)
  }
  const 글 = new Map()
  for (let i = 0; i < T.s.length; i++) {
    const e = T.e[i]
    if (E.t[e] !== 종류.글자) continue
    if (끈.has(E.ly[e])) continue
    if (사본(e)) continue
    if (네모 && !(T.x[i] >= 네모[0] && T.x[i] <= 네모[2] && T.y[i] >= 네모[1] && T.y[i] <= 네모[3])) continue
    const s = T.s[i].trim()
    if (!s || s.length > 30) continue
    글.set(s, (글.get(s) || 0) + 1)
  }
  return {
    층: 층.filter((a) => a.수 > 0).sort((a, b) => b.길이m - a.길이m),
    블록: [...블.values()].map((b) => ({ 이름: b.이름, 수: b.수, 참조수: b.참조수, 층이름: [...b.층.keys()], 층: [...b.층.entries()].map(([n, c]) => n + (b.층.size > 1 ? '(' + c + ')' : '')).join(', ') })).sort((a, b) => b.수 - a.수),
    글: [...글.entries()].map(([s, n]) => ({ 글: s, 수: n, 숫자: 숫자인가(s) })).sort((a, b) => b.수 - a.수 || a.글.localeCompare(b.글)),
    뺀사본,
  }
}

/* ───────────────────────────── ④ 엑셀 */

function 열(n) { let s = ''; n++; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26) } return s }
function 시트이름(s, 쓴) {
  let t = String(s || '시트').replace(/[[\]:*?/\\]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 28) || '시트'
  let k = t, n = 2
  while (쓴.has(k)) k = t.slice(0, 25) + ' ' + n++
  쓴.add(k)
  return k
}
const 셋 = (v) => Math.round(v * 1000) / 1000

/**
 * @param 자료 {줄:[{구분, 품명, 규격, 단위, 수량, 식?, 근거, 도면, 비고?}], 철근줄:[...], 토공들:[{이름, 칸:[{이름, 단위}], 점:[{글, 측, 값:[]}]}], 표들:[{제목, 도면, 머리, 줄}]}
 * @param 쓰기 qtoxlsx.writeWorkbook · 모양 qtoxlsx.ST
 */
export function 자동엑셀(자료, 쓰기, 모양) {
  const sheets = []
  const 쓴 = new Set()
  const 줄 = 자료.줄 || []
  const 첫이름 = 시트이름('산출서', 쓴)
  const 철이름 = (자료.철근줄 || []).length ? 시트이름('철근 재료표', 쓴) : ''
  const 토이름 = (자료.토공들 || []).map((t) => 시트이름('토공 ' + t.이름, 쓴))
  /** 산출서의 토공 줄 → 토공 시트 합계 칸을 가리키는 식 (x.토공 = {t, j}) */
  const 토공칸 = (x) => {
    const t = (자료.토공들 || [])[x.토공.t]
    if (!t) return null
    return "ROUND('" + 토이름[x.토공.t] + "'!" + 열(5 + x.토공.j * 3) + (t.점.length + 2) + ',3)'
  }
  sheets.push({
    name: 첫이름,
    head: ['번호', '구분', '품명', '규격', '단위', '산출근거', '수량', '도면', '비고'],
    rows: 줄.map((x, i) => [i + 1, x.구분, x.품명, x.규격 || '', x.단위, { v: x.근거 || '', st: 모양.BOX },
      x.토공 && 토공칸(x) ? { f: 토공칸(x), st: 모양.QTY } : x.식 ? { f: 'ROUND(' + x.식 + ',3)', st: 모양.QTY } : { v: 셋(x.수량), st: 모양.QTY }, x.도면 || '', { v: x.비고 || '', st: 모양.GRAY }]),
    widths: [6, 22, 22, 16, 6, 46, 12, 22, 30], freeze: 1,
  })
  const 철 = 자료.철근줄 || []
  if (철.length) {
    sheets.push({
      name: 철이름,
      head: ['도면', '표', '기호', '도면 규격', '규격(KS)', '길이(m)', '개수', '총길이(m)', '단위무게(kg/m)', '무게(kg)'],
      rows: 철.map((x, i) => {
        const r = i + 2
        const 총 = Number.isFinite(x.길이m) && Number.isFinite(x.개수) ? { f: 'F' + r + '*G' + r, st: 모양.QTY } : { v: 셋(x.총길이m), st: 모양.QTY }
        return [x.도면 || '', x.제목, x.기호, x.규격, x.d, Number.isFinite(x.길이m) ? x.길이m : '', Number.isFinite(x.개수) ? x.개수 : '', 총, 철근표[x.d][1], { f: 'ROUND(H' + r + '*I' + r + ',3)', st: 모양.QTY }]
      }),
      widths: [22, 14, 8, 10, 8, 10, 8, 12, 12, 12], freeze: 1,
    })
  }
  ;(자료.토공들 || []).forEach((t, ti) => {
    const 칸 = t.칸
    const head = ['측점', '거리(m)', '구간(m)']
    for (const c of 칸) head.push(c.이름 + ' 단면', c.이름 + ' 평균', c.이름 + ' 수량(' + (c.단위 === 'm' ? 'm²' : 'm³') + ')')
    const rows = []
    t.점.forEach((p, k) => {
      const r = k + 2
      const row = [p.글, p.측, k ? { f: 'B' + r + '-B' + (r - 1), st: 모양.QTY } : '']
      칸.forEach((c, j) => {
        const a = 3 + j * 3
        row.push(p.값[j] || 0)
        if (k) {
          row.push({ f: '(' + 열(a) + r + '+' + 열(a) + (r - 1) + ')/2', st: 모양.QTY })
          row.push({ f: 'ROUND(' + 열(a + 1) + r + '*C' + r + ',3)', st: 모양.QTY })
        } else row.push('', '')
      })
      rows.push(row)
    })
    const 끝 = t.점.length + 1
    const 합 = ['합계', '', { f: 'SUM(C2:C' + 끝 + ')', st: 모양.QTY }]
    칸.forEach((c, j) => { const a = 3 + j * 3; 합.push('', '', { f: 'SUM(' + 열(a + 2) + '2:' + 열(a + 2) + 끝 + ')', st: 모양.QTY }) })
    rows.push(합)
    sheets.push({ name: 토이름[ti], head, rows, widths: [16, 10, 9].concat(칸.flatMap(() => [10, 10, 12])), freeze: 1 })
  })
  for (const t of 자료.표들 || []) {
    sheets.push({
      name: 시트이름('표 ' + t.제목, 쓴),
      head: t.머리.map((h, j) => h || '칸' + (j + 1)),
      rows: t.줄.map((r) => r.map((c) => (숫자인가(c) ? 숫자(c) : c))),
      widths: t.머리.map(() => 12),
    })
  }
  for (const t of 자료.추가 || []) sheets.push({ ...t, name: 시트이름(t.name, 쓴) })      // 실·마감·창호·내역 대조 (도면전부.js · 내역대조.js)
  if (자료.세기줄 && 자료.세기줄.length) {
    sheets.push({
      name: 시트이름('세기', 쓴),
      head: ['구분', '이름', '단위', '수량', '범위', '도면'],
      rows: 자료.세기줄.map((x) => [x.구분, x.이름, x.단위, { v: 셋(x.수량), st: 모양.QTY }, x.범위 || '도면 전체', x.도면 || '']),
      widths: [14, 30, 6, 12, 24, 22],
    })
  }
  return 쓰기(sheets)
}
