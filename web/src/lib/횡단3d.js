/**
 * 🛣 횡단면도로 세우기 — 2D 횡단면도(높이가 «글자» 로만 적힌 도면)를 3D 로 (2026-09-27)
 *
 * 소장님: 「각각의 dxf캐드를 넣으면 3d로 나와야 하는데...그냥 예전 도면이야. 왜 이러는 거지? 고쳐줘.
 *          그럼, 횡단면도를 넣어 주면 가능하다는 거야? 높이가 있는 도면을 넣어 주면 자동으로 나와.」 · (소장님 도면으로 시험)
 *
 * ■ 무엇을 읽나 (도면마다 따로)
 *   ① 측점 — 「NO.」 옆 「0+10.00」(NO 간격 20m) · 「NO.3+5」 · 「STA.0+020」 · 「0+020.000」
 *   ② 그 측점 표의 「지반고」 값 (없으면 「계획고」)
 *   ③ 표 바로 위에 그려진 단면 — 가운데 표시(TICK·CL·중심) 또는 표 가운데를 중심선으로,
 *      지반선 레이어가 중심선과 만나는 높이 = 지반고 → 도면 높이를 표고(m)로 바꿈
 *   ④ 도면 단위 — 단면 폭이 수백을 넘으면 mm 로 그린 것으로 봄(÷1000). 아니면 m
 * ■ 어떻게 세우나
 *   측점 순서대로 한 줄(곧은 축)에 늘어놓습니다: X = 측점(m), Y = 중심에서 떨어진 거리(도면 오른쪽 +), Z = 표고.
 *   (G138 · 2026-10-05) 평면도에서 같은 이름의 노선을 찾으면 일꾼(dxf3d.worker.js)이 이 곧은 축을 노선 곡선에 얹습니다(노선3d.js).
 *   선은 레이어 그대로, 지반선은 이웃 단면끼리 이어 «땅 면» 을, 계획선(터파기·계획)은 «계획 면» 을 만듭니다.
 * ■ 좌표는 mm 로 냅니다(건물 세우기와 같은 단위 — 화면의 높이·자 표시가 같게).
 */

import { 단면면적 } from './토공3d.js'

const 붙 = (s) => String(s ?? '').replace(/\s+/g, '')
const 수글 = /^[-+]?\(?[-+]?\)?\d+(\.\d+)?$/
function 값(s) {
  // «(-)2.17» · «-2.17» · «+1.5» · «1.96»
  const t = 붙(s).replace(/^EL\.?=?/i, '').replace(/^\(([-+])\)/, '$1')
  return /^[-+]?\d+(\.\d+)?$/.test(t) ? parseFloat(t) : NaN
}

/**
 * 측점 글자 → { n, d }(NO 번호 · 더한 m — 간격은 도면마다 따로 정함) 또는 { m }(km 꼴 «0+020.000» · STA.0+120) | null
 * 🛠 2026-10-05 — 소장님 도면 08: «NO.3+36.00» 처럼 더한 값이 20 을 넘습니다 → NO 간격이 20 m 가 아니라 50 m.
 *   그래서 간격은 그 도면 측점들의 «더한 값» 가운데 가장 큰 것보다 큰 표준 간격(20 · 25 · 50 · 100 m)으로 정합니다(간격고르기).
 */
export function 측점풀기(글, 앞NO = false) {
  const c = 붙(글).toUpperCase().replace(/^측점[:=]?/, '')
  const 더 = (부, 수) => (부 === '-' ? -수 : +수)
  let m = c.match(/^NO\.?(\d{1,4})(?:([+-])(\d{1,4}(?:\.\d+)?))?$/)
  if (m) return { n: +m[1], d: m[3] ? 더(m[2], m[3]) : 0 }
  m = c.match(/^STA\.?(\d{1,3})([+-])(\d{1,4}(?:\.\d+)?)$/)
  if (m) return /^\d{3}/.test(m[3]) ? { m: +m[1] * 1000 + 더(m[2], m[3]) } : { n: +m[1], d: 더(m[2], m[3]) }
  m = c.match(/^(\d{1,4})([+-])(\d{1,4}(?:\.\d+)?)$/)
  if (m) {
    if (앞NO) return { n: +m[1], d: 더(m[2], m[3]) }
    if (/^\d{3}/.test(m[3])) return { m: +m[1] * 1000 + 더(m[2], m[3]) }
  }
  return null
}
/* 🛣 G236 노선 이름 글자(«Ramp-B» · «본선» · «STA.0+63.8(Rramp-B)») — 한 파일 · 한 평면에 노선이 여럿일 때 */
const 노선글꼴 = /^(본선|[A-Z]{0,2}RAMP[A-Z0-9가-힣]{0,3}|연결로[A-Z0-9]{0,3}|부체도로\d{0,2}|측도\d{0,2}|접속도로\d{0,2}|진입도로\d{0,2}|[A-Z0-9]{1,2}(RAMP|LINE|노선)|LINE[A-Z0-9]{1,2})$/
/** 노선 이름 → 맞춰 볼 열쇠(«Ramp-B» · «램프 B» → «RAMPB») */
export function 노선글열쇠(s) {
  return String(s ?? '').normalize('NFKC').toUpperCase().replace(/램프/g, 'RAMP').replace(/[\s\-_.·()（）[\]]/g, '')
}
/** 글자 → 노선 이름 { 이름, 풀이(측점 · 없으면 null) } | null */
export function 노선이름글(s) {
  const t = String(s ?? '').normalize('NFKC').trim()
  if (!t || t.length > 30) return null
  const m = t.match(/^(.*?\d)\s*[(]\s*([^()]{1,16})\s*[)]$/)
  if (m) {
    const q = 측점풀기(m[1])
    if (q && 노선글꼴.test(노선글열쇠(m[2]))) return { 이름: 붙(m[2]), 풀이: q }
  }
  const c = 붙(t).replace(/^[([]+|[)\]]+$/g, '')
  if (노선글꼴.test(노선글열쇠(c))) return { 이름: c, 풀이: null }
  return null
}
const 간격들 = [20, 25, 50, 100, 200]
/** 그 도면의 NO 간격 — 더한 값이 가장 큰 것보다 큰 표준 간격 (없으면 20 m) */
export function 간격고르기(풀이들) {
  let 큰 = 0
  for (const q of 풀이들) if (q && q.n != null) 큰 = Math.max(큰, Math.abs(q.d))
  return 간격들.find((g) => g > 큰 + 1e-9) || 1000
}
const 가운데값 = (a) => { const b = a.slice().sort((x, y) => x - y); return b.length ? b[b.length >> 1] : NaN }
const 풀어m = (q, 간격) => (!q ? NaN : q.m != null ? q.m : q.n * 간격 + q.d)
/** 측점 글자 → m (NO 간격 20m). 못 읽으면 NaN — 옛 시험이 씁니다 */
export function 측점m(글, 앞NO = false) { return 풀어m(측점풀기(글, 앞NO), 20) }

/**
 * 📏 높이 눈금자 — 단면 양옆에 세로로 늘어선 숫자(4 · 2 · 0 · -2)
 * 소장님 도면 03 · 08 의 횡단면도는 단면마다 양옆에 눈금자가 있고, 측점 표(«S T A .» · 지반고 · 계획고)는 단면 «오른쪽» 에 있습니다.
 * 눈금자를 찾으면 ① 단면의 가로 범위(왼쪽 자 ~ 오른쪽 자) ② 도면 높이 → 표고(m) 를 바로 알 수 있습니다.
 * @returns [{ ly, xL, xR, y0, y1, a, b, 칸 }]  표고 = a + b·y
 */
export function 눈금자들(T) {
  const 층별 = new Map()
  for (const t of T) {
    if (!수평(t)) continue
    const c = 붙(t.s)
    if (!/^[-+]?\d{1,4}(\.\d+)?$/.test(c)) continue
    let a = 층별.get(t.ly); if (!a) { a = []; 층별.set(t.ly, a) } a.push({ x: t.x, y: t.y, v: parseFloat(c), h: t.h || 1 })
  }
  const 토막 = []
  for (const [ly, a] of 층별) {
    if (a.length < 6) continue
    a.sort((p, q) => p.x - q.x)
    /* 열 — x 가 글자 높이 1.5배 안이면 같은 열(부호 «-» 때문에 조금씩 어긋남) */
    const 열들 = []
    let 열 = [a[0]]
    for (let i = 1; i < a.length; i++) {
      if (a[i].x - 열[열.length - 1].x <= 1.5 * a[i].h) 열.push(a[i])
      else { 열들.push(열); 열 = [a[i]] }
    }
    열들.push(열)
    for (const c of 열들) {
      if (c.length < 3) continue
      c.sort((p, q) => p.y - q.y)
      /* 고른 간격 · 고른 값 차이로 이어진 줄만 (⚠️ 첫 판은 줄이 끊길 때 마지막 숫자 하나를 흘려서 맨 위 눈금이 빠졌습니다 — 시험으로 잡음) */
      const 끊기 = (from, to) => {
        const r = c.slice(from, to)
        if (r.length < 3) return
        const b = (r[r.length - 1].v - r[0].v) / (r[r.length - 1].y - r[0].y)
        const xs = r.map((p) => p.x).sort((p, q) => p - q)
        /* 글자 자리는 글자 «밑줄» 입니다 — 눈금은 글자 가운데에 맞춰 그리므로 글자 높이의 반만 올려 잽니다
           (소장님 도면 08: 반을 안 올리면 눈금자 높이와 표의 지반고가 모든 단면에서 꼭 0.15 m(= 글자 0.3 의 반) 어긋났음) */
        const 반 = r.reduce((s2, p) => s2 + p.h, 0) / r.length / 2
        토막.push({ ly, x: xs[xs.length >> 1], y0: r[0].y + 반, y1: r[r.length - 1].y + 반, b, a: r[0].v - b * (r[0].y + 반), 칸: (r[r.length - 1].y - r[0].y) / (r.length - 1), n: r.length })
      }
      let 시작 = 0
      for (let i = 1; i <= c.length; i++) {
        let 이어짐 = false
        if (i < c.length) {
          const dy = c[i].y - c[i - 1].y, dv = c[i].v - c[i - 1].v
          if (dy > 0 && dv > 0) {
            if (i - 시작 >= 2) {
              const dy0 = c[i - 1].y - c[i - 2].y, dv0 = c[i - 1].v - c[i - 2].v
              이어짐 = Math.abs(dy - dy0) <= 0.15 * dy0 && Math.abs(dv - dv0) <= 0.05 * Math.abs(dv0) + 1e-9
            } else 이어짐 = true
          }
        }
        if (!이어짐) { 끊기(시작, i); 시작 = i }
      }
    }
  }
  /* 짝 — 같은 레이어 · 같은 높이 범위 · 같은 눈금(a, b)인 왼쪽 자와 오른쪽 자 */
  토막.sort((p, q) => p.x - q.x)
  const 쓴 = new Set()
  const 짝 = []
  for (const L of 토막) {
    if (쓴.has(L)) continue
    let best = null
    for (const R of 토막) {
      if (R === L || 쓴.has(R) || R.ly !== L.ly || R.x <= L.x) continue
      if (Math.abs(R.y0 - L.y0) > L.칸 * 0.5 || Math.abs(R.y1 - L.y1) > L.칸 * 0.5) continue
      if (Math.abs(R.b - L.b) > Math.abs(L.b) * 0.02) continue
      if (!best || R.x - L.x < best.x - L.x) best = R
    }
    if (!best) continue
    쓴.add(L); 쓴.add(best)
    짝.push({ ly: L.ly, xL: L.x, xR: best.x, y0: (L.y0 + best.y0) / 2, y1: (L.y1 + best.y1) / 2, a: (L.a + best.a) / 2, b: (L.b + best.b) / 2, 칸: L.칸 })
  }
  return 짝
}

const 수평 = (t) => !t.a || Math.abs(((t.a % 180) + 180) % 180) < 3
const 빼는층 = /^[_#!★\-\s]*(text|글|문자|dim|치수|hatch|해치|defpoints|도곽|sheet|border|form|title|table|테이블|tick|지번)/i
const 땅층 = /지반|원지반|현황지반|현지반|^EG$|^E\.G|GROUND|GRND(?!.*(CEN|CL))|G\.?L\b|토사선/i      /* 🛣 G236 도로 도면 «CC-GRND»(중심 표시 CC-GRND-CEN 은 뺌) */
const 계획층 = /계획|터파기|^FG$|F\.?G\b|FL\b|포장|노면|설계선/i

/** 도면 하나에서 횡단면 찾기 */
export function 단면찾기(raw) {
  const T = raw.texts || []
  const 라벨 = []
  for (let i = 0; i < T.length; i++) {
    const t = T[i]
    if (!수평(t)) continue
    const c = 붙(t.s).toUpperCase()
    if (c.length > 26) continue
    let 풀이 = null, 글 = t.s.trim(), 값칸 = -1
    if (c === 'NO.' || c === 'NO' || c === 'STA.' || c === 'STA') {
      // 같은 줄 오른쪽 가까이의 «0+10.00»
      let best = -1, bd = Infinity
      for (let j = 0; j < T.length; j++) {
        const u = T[j]
        if (j === i || Math.abs(u.y - t.y) > 0.6 * t.h) continue
        const dx = u.x - t.x
        if (dx <= 0 || dx > 14 * t.h) continue
        if (!/^\d+[+-]\d+(\.\d+)?$/.test(붙(u.s))) continue
        if (dx < bd) { bd = dx; best = j }
      }
      if (best < 0) continue
      풀이 = 측점풀기(T[best].s, true); 글 = 'NO.' + 붙(T[best].s); 값칸 = best
    } else if (/^(NO\.?\d|STA\.?\d|측점)/.test(c) || /^\d{1,3}\+\d{3}(\.\d+)?$/.test(c)) {
      풀이 = 측점풀기(c)
    }
    if (!풀이) continue
    라벨.push({ i, 글, 풀이, x: t.x, y: t.y, h: t.h, 값칸 })
  }
  if (라벨.length < 2) return []
  const 간격 = 간격고르기(라벨.map((L) => L.풀이))
  for (const L of 라벨) L.측 = 풀어m(L.풀이, 간격)
  /* 🛣 G236 지반선 · 중심 표시(짧은 세로선) — «오른쪽 표» 꼴 창 찾기에 씀 */
  const 땅선 = [], 표시 = []
  for (const [ly, b] of raw.out || []) {
    const a = b.pos.a
    const 땅 = 땅층.test(ly), 중 = /tick|^cl$|center|cen\b|중심/i.test(ly)
    if (!땅 && !중) continue
    for (let i = 0; i < b.pos.n; i += 6) {
      const ax = a[i], ay = a[i + 1], bx = a[i + 3], by = a[i + 4]
      if (땅) 땅선.push([ax, ay, bx, by])
      if (중 && Math.abs(ax - bx) < 1e-6 * Math.max(1, Math.abs(ax)) && Math.abs(by - ay) > 0) 표시.push([ax, Math.min(ay, by), Math.max(ay, by)])
    }
  }
  const 땅길이 = (W) => { let n = 0; for (const [ax, ay, bx, by] of 땅선) { const mx = (ax + bx) / 2, my = (ay + by) / 2; if (mx > W[0] && mx < W[2] && my > W[1] && my < W[3]) n += Math.hypot(bx - ax, by - ay) } return n }
  /* 주어진 = [cx, cy] — 중심 표시가 없는 단면(같은 열 다른 단면들의 표시 자리로 짐작) */
  const 왼쪽창 = (L, 표, 주어진 = null) => {
    const h = L.h
    let cx, cy
    if (주어진) [cx, cy] = 주어진
    else {
      const 후 = 표시.filter(([x, y0, y1]) => x < 표.x0 - h && x > 표.x0 - 400 * h && (y0 + y1) / 2 < L.y + 3 * h && (y0 + y1) / 2 > L.y - 15 * h)
      if (!후.length) return null
      후.sort((p, q) => Math.abs((p[1] + p[2]) / 2 - L.y) - Math.abs((q[1] + q[2]) / 2 - L.y) || q[0] - p[0])
      cx = 후[0][0]; cy = (후[0][1] + 후[0][2]) / 2
    }
    const 같은줄 = 표시.filter(([x]) => Math.abs(x - cx) < 1e-6 * Math.max(1, Math.abs(cx))).map(([, a0, a1]) => (a0 + a1) / 2).filter((y) => Math.abs(y - cy) > 2 * h)
    const 아래 = 같은줄.filter((y) => y < cy).reduce((m, y) => Math.max(m, y), -Infinity), 위 = 같은줄.filter((y) => y > cy).reduce((m, y) => Math.min(m, y), Infinity)
    const y0 = Number.isFinite(아래) ? (아래 + cy) / 2 : cy - 40 * h, y1 = Number.isFinite(위) ? (위 + cy) / 2 : cy + 30 * h
    const 띠땅 = 땅선.filter(([ax, ay, bx, by]) => { const my = (ay + by) / 2; return !(my < y0 || my > y1 || Math.max(ax, bx) > 표.x0 - 0.3 * h || Math.min(ax, bx) < 표.x0 - 400 * h) })
    /* 가로 범위 = 중심 표시 밑을 지나는 지반선과 이어진 것(끝이 7h 안)만 — 옆에 따로 그린 다른 단면 지반선 · 표까지 창에 들어오지 않게
       (소장님 현장 G 램프 B 0+040: 같은 줄 왼쪽에 따로 그린 0+051 단면 · 표가 창에 들어와 표 선이 3D 에 섰음) */
    const 틈 = 7 * h
    let 쓴 = 띠땅.filter(([ax, , bx]) => Math.min(ax, bx) <= cx && cx <= Math.max(ax, bx))
    if (!쓴.length) return null
    let x0 = Math.min(...쓴.flatMap(([ax, , bx]) => [ax, bx])), x1 = Math.max(...쓴.flatMap(([ax, , bx]) => [ax, bx]))
    const 남땅 = new Set(띠땅.filter((g) => !쓴.includes(g)))
    for (let 바뀜 = true; 바뀜;) {
      바뀜 = false
      for (const g of 남땅) {
        const a = Math.min(g[0], g[2]), b = Math.max(g[0], g[2])
        if (b < x0 - 틈 || a > x1 + 틈) continue
        남땅.delete(g); x0 = Math.min(x0, a); x1 = Math.max(x1, b); 바뀜 = true
      }
    }
    if (!(x1 > x0) || cx < x0 || cx > x1) return null
    return { 창: [x0 - h, y0, Math.min(x1 + h, 표.x0 - 0.3 * h), y1], cx, cy }
  }
  /* 📏 눈금자 짝(단면 양옆 숫자 자) — 있으면 그 단면의 가로 범위와 높이를 눈금자로 정합니다 */
  const 자들 = 눈금자들(T)
  /* 표 안 값: 「지반고」「계획고」 글자와 같은 줄 오른쪽 숫자 */
  const 칸값 = (L, 이름) => {
    const h = L.h
    for (let j = 0; j < T.length; j++) {
      const u = T[j]
      if (붙(u.s) !== 이름) continue
      /* 🛣 G236 도로 횡단 표 — 「측점 STA.0+020 · 지반고 121.12 · 계획고 121.59」 가 한 줄(오른쪽으로 멀리 · 60h 안) */
      const 한줄 = Math.abs(u.y - L.y) < 0.6 * h && u.x > L.x && u.x - L.x < 60 * h
      if (!한줄 && (Math.abs(u.x - L.x) > 20 * h || u.y > L.y + 0.5 * h || u.y < L.y - 6 * h)) continue
      let best = NaN, bd = Infinity
      for (let k = 0; k < T.length; k++) {
        const w = T[k]
        if (Math.abs(w.y - u.y) > 0.6 * h) continue
        const dx = w.x - u.x
        if (dx <= 0 || dx > 16 * h) continue
        const n = 값(w.s)
        if (!Number.isFinite(n)) continue
        if (dx < bd) { bd = dx; best = n }
      }
      if (Number.isFinite(best)) return best
    }
    return NaN
  }
  /* 📋 G234 표에 적힌 면적(㎡) — 「터파기 · 되메우기 · 흙쌓기 · 흙깍기」 글자 바로 오른쪽 칸(«-» · 빈 칸 = 0)
       소장님 현장 E 06 · 07 · 08 횡단면도는 측점 표마다 이 값이 적혀 있습니다(설계자가 셈 — 선으로 잰 값과 맞춰 봄) */
  const 표이름 = { 터파기: /^터파기$/, 되메우기: /^되메우기$/, 성토: /^(흙|총)?쌓기$|^성토$/, 절토: /^(흙|총)?(깎|깍)기$|^절토$/ }
  const 표칸값 = (L, 꼴) => {
    const h = L.h
    for (const u of T) {
      if (!꼴.test(붙(u.s))) continue
      if (Math.abs(u.x - L.x) > 22 * h || u.y > L.y + 0.5 * h || u.y < L.y - 20 * h) continue
      let w = null, bd = Infinity
      for (const v of T) {
        if (v === u || Math.abs(v.y - u.y) > 0.6 * h) continue
        const dx = v.x - u.x
        if (dx <= 0 || dx > 16 * h || dx >= bd) continue
        bd = dx; w = v
      }
      if (!w) return 0                                  // 글자는 있는데 오른쪽 칸이 비었음 = 0
      const t = 붙(w.s).replace(/,/g, '')
      if (/^[-–—]+$/.test(t)) return 0
      const v = 값(t)
      return Number.isFinite(v) ? v : 0                  // 오른쪽이 다음 칸 이름(빈 칸) = 0
    }
    return NaN
  }
  /* 🛣 G236 도로 횡단 토공 표 — 세로로 쓴 칸 제목(«흙 깎 기» · «흙 쌓 기» — 한 글자씩 쌓음)과 그 칸 줄들(토사 · 리핑암 · 발파 … / 노상 · 노체)의 값 합
       소장님 현장 G 02: 측점 줄 아래 표에 흙깎기 · 흙쌓기 · 비탈면 보호 · 층따기 · 노상준비 … 가 칸마다 있음 → 흙깎기 합 = 절토 · 흙쌓기 합 = 성토(㎡)
       표에 터파기 · 되메우기 칸이 없으면 0(도로 토공은 흙깎기 · 흙쌓기로 셈 — 선으로 잰 터파기를 같이 세면 두 번 셈) */
  const 도로칸 = { 절토: /^흙(깎|깍)기$|^절토$/, 성토: /^흙쌓기$|^성토$/, 터파기: /^(구조물)?터파기$/, 되메우기: /^되메우기$/ }
  let 가로선 = null
  const 가로선들 = () => {
    if (가로선) return 가로선
    가로선 = []
    for (const [, b] of raw.out || []) {
      const a = b.pos.a
      for (let i = 0; i < b.pos.n; i += 6) if (Math.abs(a[i + 1] - a[i + 4]) < 1e-6 * Math.max(1, Math.abs(a[i + 1])) && Math.abs(a[i + 3] - a[i]) > 0) 가로선.push([a[i + 1], Math.min(a[i], a[i + 3]), Math.max(a[i], a[i + 3])])
    }
    return 가로선
  }
  const 도로표 = (L) => {
    const h = L.h, X0 = L.x - 15 * h, X1 = L.x + 70 * h, Y1 = L.y + h
    let Y0 = L.y - 60 * h
    for (const M of 라벨) if (M !== L && Math.abs(M.x - L.x) < 2 * h && M.y < L.y - h && M.y + 0.5 * h > Y0) Y0 = M.y + 0.5 * h
    const 안 = T.filter((t) => t.x >= X0 && t.x <= X1 && t.y >= Y0 && t.y <= Y1 && 수평(t))
    const 낱 = 안.filter((t) => /^[가-힣]{1,2}$/.test(붙(t.s)) && Math.abs(t.h - h) < 0.5 * h)
    if (!낱.some((t) => /^흙$/.test(붙(t.s)))) return null
    const 선 = 가로선들().filter(([y, a, b]) => y >= Y0 - h && y <= Y1 + h && b >= X0 && a <= X1)
    /* 세로로 쌓인 글자 → 칸 제목(칸 위아래 가로선 사이 = 그 칸이 덮는 줄들) */
    const 열들 = []
    for (const t of 낱.slice().sort((a, b) => a.x - b.x)) { let c = 열들.find((c) => Math.abs(c.x - t.x) < 0.5 * h); if (!c) { c = { x: t.x, a: [] }; 열들.push(c) } c.a.push(t) }
    const 제목들 = []
    for (const c of 열들) {
      const a = c.a.sort((p, q) => q.y - p.y)
      const 가 = 선.filter(([, x0, x1]) => x0 <= c.x + 0.3 * h && x1 >= c.x + 0.3 * h).map(([y]) => y)
      let 무 = [a[0]]
      const 닫 = () => {
        if (무.length < 2) return
        const 위 = 무[0].y + 0.9 * h, 아 = 무[무.length - 1].y
        const 윗선 = 가.filter((y) => y >= 위).reduce((m, y) => Math.min(m, y), Infinity), 아랫선 = 가.filter((y) => y <= 아).reduce((m, y) => Math.max(m, y), -Infinity)
        if (Number.isFinite(윗선) && Number.isFinite(아랫선)) 제목들.push({ 이름: 무.map((t) => 붙(t.s)).join(''), x: c.x, y0: 아랫선, y1: 윗선 })
      }
      for (let i = 1; i < a.length; i++) {
        if (가.some((y) => y < a[i - 1].y + 0.1 * h && y > a[i].y + 0.9 * h) || a[i - 1].y - a[i].y > 12 * h) { 닫(); 무 = [] }
        무.push(a[i])
      }
      닫()
    }
    const 아는 = (t) => Object.keys(도로칸).find((k) => 도로칸[k].test(t.이름))
    if (!제목들.some((t) => 아는(t) === '절토' || 아는(t) === '성토')) return null
    const 합 = { 절토: 0, 성토: 0, 터파기: 0, 되메우기: 0 }, 세부 = {}
    for (const v of 안) {
      const n = 값(v.s)
      if (!Number.isFinite(n) || v === L || Math.abs(v.y - L.y) < 0.5 * h) continue
      const 글 = 안.filter((t) => t.x < v.x && Math.abs(t.y - v.y) < 0.5 * h && !Number.isFinite(값(t.s))).sort((p, q) => q.x - p.x)[0]
      const 기준x = 글 ? 글.x : v.x, yc = v.y + 0.4 * h
      const 후 = 제목들.filter((t) => t.x < 기준x && yc > t.y0 && yc < t.y1).sort((p, q) => q.x - p.x)
      if (!후.length) continue
      let 칸 = 아는(후[0])
      if (!칸) { const i = 후.findIndex((t) => 아는(t)); if (i > 0 && 후[0].x - 후[i].x < 6 * h) 칸 = 아는(후[i]) }      // «발파암» 처럼 칸 안 작은 제목
      if (!칸) continue
      합[칸] += n
      const 이름 = 글 ? 붙(글.s) : '?'
      ;(세부[칸] || (세부[칸] = {}))[이름] = ((세부[칸] || {})[이름] || 0) + n
    }
    for (const k of Object.keys(합)) 합[k] = Math.round(합[k] * 1000) / 1000
    for (const o of Object.values(세부)) for (const k of Object.keys(o)) o[k] = Math.round(o[k] * 1000) / 1000
    return { ...합, 도로표: 세부 }
  }
  /* 표 네모(그 측점 표의 글자들) — 라벨에서 아래로 */
  const 표네모 = (L) => {
    let x0 = L.x, x1 = L.x, y0 = L.y
    for (const u of T) {
      if (u.y > L.y + 0.6 * L.h || u.y < L.y - 12 * L.h) continue
      if (u.x < L.x - 22 * L.h || u.x > L.x + 40 * L.h) continue
      if (Math.abs(u.h - L.h) > 0.3 * L.h) continue
      x0 = Math.min(x0, u.x); x1 = Math.max(x1, u.x + 붙(u.s).length * u.h * 0.8); y0 = Math.min(y0, u.y)
    }
    return { x0, x1, y0, y1: L.y + L.h }
  }
  /* 열(세로로 쌓인 단면) 간격 — 가로로 가장 가까운 다른 열까지. 옆 열이 없는 끝 열은 다른 열들의 가운데 값 */
  const 폭들 = []
  for (const L of 라벨) {
    const d = 라벨.filter((M) => Math.abs(M.x - L.x) >= 10 * L.h && Math.abs(M.y - L.y) < 30 * L.h).map((M) => Math.abs(M.x - L.x))
    if (d.length) 폭들.push(Math.min(...d))
  }
  폭들.sort((a, b) => a - b)
  const 라벨폭중간 = 폭들.length ? 폭들[폭들.length >> 1] : 0
  const out = []
  for (const L of 라벨) {
    const 지반고 = 칸값(L, '지반고'), 계획고 = 칸값(L, '계획고')
    if (!Number.isFinite(지반고) && !Number.isFinite(계획고)) continue
    let 표면적 = null
    for (const [k, 꼴] of Object.entries(표이름)) { const v = 표칸값(L, 꼴); if (Number.isFinite(v) && v >= 0) (표면적 || (표면적 = {}))[k] = v }
    if (!표면적) { const r = 도로표(L); if (r) { const { 도로표: 세부, ...값들 } = r; 표면적 = 값들; L.표세부 = 세부 } }
    L.표면적 = 표면적
    const 표 = 표네모(L)
    const 위 = 라벨.filter((M) => M !== L && Math.abs(M.x - L.x) < 4 * L.h && M.y > L.y + 2 * L.h).sort((a, b) => a.y - b.y)[0]
    /* 옆 열: 가로로 떨어져 있고 높이가 비슷한(같은 줄의) 측점 표 — 다른 곳(종단면도 표 등)의 측점 글자는 빼고 */
    const 옆 = 라벨.filter((M) => Math.abs(M.x - L.x) >= 10 * L.h && Math.abs(M.y - L.y) < 30 * L.h).map((M) => Math.abs(M.x - L.x))
    const 폭 = 옆.length ? Math.min(...옆) : (라벨폭중간 || 120 * L.h)
    let 윗끝
    if (위) { const 위표 = 표네모(위); 윗끝 = 위표.y0 - 0.5 * L.h } else 윗끝 = 표.y1 + Math.min(폭 * 0.6, 60 * L.h)
    /* 📏 눈금자 꼴 — 표가 단면 «옆» 에 있는 도면(소장님 도면 03 · 08). 표 자리가 자 짝의 가로 범위 안이고, 세로로 가장 가까운 짝 */
    let 자 = null, 자거리 = Infinity
    for (const P of 자들) {
      if (L.x < P.xL || L.x > P.xR) continue
      const 거 = L.y < P.y0 ? P.y0 - L.y : L.y > P.y1 ? L.y - P.y1 : 0
      if (거 > (P.y1 - P.y0) * 1.5 + 10 * L.h) continue
      if (거 < 자거리) { 자거리 = 거; 자 = P }
    }
    if (자) {
      const 높 = 자.y1 - 자.y0
      let 아래 = 자.y0 - 높 * 0.6, 위끝 = 자.y1 + 높 * 0.4
      for (const Q of 자들) {         // 이웃 단면(위·아래 자 짝)과는 반씩 나눔
        if (Q === 자 || Q.xR < 자.xL || Q.xL > 자.xR) continue
        if (Q.y1 <= 자.y0) 아래 = Math.max(아래, (Q.y1 + 자.y0) / 2)
        if (Q.y0 >= 자.y1) 위끝 = Math.min(위끝, (Q.y0 + 자.y1) / 2)
      }
      /* 가운데 — 같은 측점의 단면 이름표(NO.4+000)가 자 범위 안에 있으면 그 x, 없으면 자 가운데 */
      /* 🩹 G225 — 같은 측점 글자가 둘 이상(이름표 «NO.5+000» · 옆 표의 «0+100.00»)이면 자 가운데에 가장 가까운 것
         (전에는 처음 찾은 것 — 옆 표 글자를 가운데로 잡아 단면이 18 m 옆으로 섬) */
      const 자가운데 = (자.xL + 자.xR) / 2
      const 이름표 = 라벨.filter((M) => M !== L && Math.abs(M.측 - L.측) < 1e-6 && M.x > 자.xL && M.x < 자.xR && M.y > 아래 - 높 && M.y < 위끝 + 높)
        .sort((p, q) => Math.abs(p.x - 자가운데) - Math.abs(q.x - 자가운데))[0]
      const cx0 = 이름표 ? 이름표.x : (자.xL + 자.xR) / 2
      out.push({ ...L, 지반고, 계획고, 창: [자.xL, 아래, 자.xR, 위끝], cx0, 눈금: { a: 자.a, b: 자.b }, 표 })
      continue
    }
    const cx0 = (표.x0 + 표.x1) / 2
    const 창A = [cx0 - 폭 * 0.48, 표.y1 + 0.2 * L.h, cx0 + 폭 * 0.48, 윗끝]
    /* 🛣 G236 표가 단면 «오른쪽» 에 붙은 꼴(도로 횡단면도 — 소장님 현장 G): 표 왼쪽, 그 측점 줄 높이 가까이의 중심 표시(TICK · CEN 짧은 세로선)가 단면 가운데
         창 = 그 중심 표시의 위 · 아래 이웃 표시와 반씩 · 가로는 그 띠 안 지반선이 이어진 곳(표 왼쪽까지). 표 위(창A)보다 지반선이 많을 때만 */
    const B = 왼쪽창(L, 표)
    if (B && 땅길이(B.창) > Math.max(5 * L.h, 1.5 * 땅길이(창A))) { out.push({ ...L, 지반고, 계획고, 창: B.창, cx0: B.cx, 표, 꼴: '오른쪽 표', 중dy: B.cy - L.y, 중dx: B.cx - 표.x0 }); continue }
    out.push({ ...L, 지반고, 계획고, 창: 창A, cx0, 표, 오른쪽: B && 땅길이(B.창) > 5 * L.h ? B : null })
  }
  /* 🛣 G236 같은 열(세로로 쌓인 표)에 «오른쪽 표» 꼴이 둘 넘고 열의 30 % 넘으면, 나머지도 그 꼴로 — 단면이 촘촘히 쌓이면 표 위 창(창A)에 이웃 단면 지반선이 들어와 지반선이 더 많아 보임
       (소장님 현장 G 램프 D: 18개 중 9개가 창A 로 잡혀 «중심에서 지반선을 못 찾음») */
  for (const s of out) {
    if (s.꼴 || s.눈금) continue
    const 열 = out.filter((t) => Math.abs(t.x - s.x) < 2 * s.h)
    const 오들 = 열.filter((t) => t.꼴 === '오른쪽 표' && t.중dy != null)
    if (!(오들.length >= 2 && 오들.length >= 0.3 * 열.length)) continue
    /* 중심 표시도 없는 단면(소장님 현장 G 램프 B 0+030 · 0+065) — 같은 열 다른 단면들의 «표 왼쪽 몇 m · 측점 줄 아래 몇 m» 자리를 중심으로 */
    const B = s.오른쪽 || 왼쪽창(s, s.표, [s.표.x0 + 가운데값(오들.map((t) => t.중dx)), s.y + 가운데값(오들.map((t) => t.중dy))])
    if (B && 땅길이(B.창) > 5 * s.h) { s.창 = B.창; s.cx0 = B.cx; s.꼴 = '오른쪽 표'; if (!s.오른쪽) s.중심짐작 = true }
  }
  for (const s of out) { delete s.오른쪽; delete s.중dy; delete s.중dx }
  /* 🛣 G236 노선 제목 — 열 위의 큰 글자(«Ramp-B» · «Ramp-D»). 한 파일에 여러 노선의 횡단이 열로 있으면 측점이 같아도 다른 단면입니다
       (소장님 현장 G 02 횡단면도: 램프 B 열 · 램프 D 열 — 전에는 측점이 같으면 한 벌로 보고 둘을 섞어 세웠음)
       단면 바로 위 가장 가까운 제목(글자 높이가 측점 글자의 3배 넘고, 가로로 그 단면 창 · 표 안팎 반 폭 안) */
  const 제목들 = []
  for (const t of T) { if (!수평(t)) continue; const g = 노선이름글(t.s); if (g && !g.풀이) 제목들.push({ t, 이름: g.이름 }) }
  if (제목들.length) for (const s of out) {
    const W = s.창[2] - s.창[0], x0 = s.창[0] - 0.5 * W, x1 = Math.max(s.창[2], s.표 ? s.표.x1 : s.x) + 0.5 * W
    let best = null
    for (const c of 제목들) {
      if (c.t.h < 3 * s.h || c.t.y <= s.y || c.t.x < x0 || c.t.x > x1) continue
      if (!best || c.t.y < best.t.y) best = c
    }
    if (best) s.노선글 = best.이름
  }
  return out
}

/**
 * 🛣 G236 단면들 → 노선 제목별 묶음 [{ 노선글, 단면 }] — 제목이 하나도 없으면 [{ 노선글: '', 단면 }](예전과 같음)
 *   제목 없는 단면이 제목 있는 단면과 측점 · 지반고 · 계획고가 같으면 사본(도면 옆에 둔 작업 사본)으로 뺍니다
 */
export function 횡단묶기(단면) {
  const 글들 = [...new Set(단면.map((s) => s.노선글 || ''))]
  if (글들.length === 1) return [{ 노선글: 글들[0], 단면 }]
  const 같수 = (a, b) => (Number.isFinite(a) ? Number.isFinite(b) && Math.abs(a - b) < 0.0005 : !Number.isFinite(b))
  const 이름있는 = 단면.filter((s) => s.노선글)
  const 남은 = 단면.filter((s) => s.노선글 || !이름있는.some((t) => Math.abs(t.측 - s.측) < 1e-6 && 같수(t.지반고, s.지반고) && 같수(t.계획고, s.계획고)))
  /* 제목 없는 단면(열 밖에 따로 그린 — 소장님 현장 G 0+051 · 0+053 배수 건너는 곳)은 앞뒤 측점 지반고를 이어 본 값이 한 노선에만 맞으면(0.5 m 안 · 다른 노선은 3배 넘게 어긋남) 그 노선으로 */
  const 이은 = (a, x, k) => {
    const b = a.filter((t) => Number.isFinite(t[k])).sort((p, q) => p.측 - q.측)
    for (let i = 0; i + 1 < b.length; i++) if (b[i].측 <= x && x <= b[i + 1].측) return b[i + 1].측 - b[i].측 > 1e-9 ? b[i][k] + (b[i + 1][k] - b[i][k]) * (x - b[i].측) / (b[i + 1].측 - b[i].측) : b[i][k]
    return NaN
  }
  for (const s of 남은) {
    if (s.노선글) continue
    const k = Number.isFinite(s.지반고) ? '지반고' : '계획고'
    if (!Number.isFinite(s[k])) continue
    const 차 = 글들.filter((g) => g).map((g) => ({ g, d: Math.abs(이은(이름있는.filter((t) => t.노선글 === g), s.측, k) - s[k]) })).filter((c) => Number.isFinite(c.d)).sort((p, q) => p.d - q.d)
    if (차.length && 차[0].d <= 0.5 && (!차[1] || 차[1].d >= 3 * Math.max(차[0].d, 0.01))) { s.노선글 = 차[0].g; s.제목짐작 = true }
  }
  const 글들2 = [...new Set(남은.map((s) => s.노선글 || ''))]
  return 글들2.map((g) => ({ 노선글: g, 단면: 남은.filter((s) => (s.노선글 || '') === g) })).filter((m) => m.단면.length)
}

/** 선분을 네모 안으로 자르기 (Liang–Barsky) → [ax,ay,bx,by] | null */
function 자르기(ax, ay, bx, by, x0, y0, x1, y1) {
  let t0 = 0, t1 = 1
  const dx = bx - ax, dy = by - ay
  const p = [-dx, dx, -dy, dy], q = [ax - x0, x1 - ax, ay - y0, y1 - ay]
  for (let k = 0; k < 4; k++) {
    if (p[k] === 0) { if (q[k] < 0) return null; continue }
    const r = q[k] / p[k]
    if (p[k] < 0) { if (r > t1) return null; if (r > t0) t0 = r } else { if (r < t0) return null; if (r < t1) t1 = r }
  }
  return [ax + t0 * dx, ay + t0 * dy, ax + t1 * dx, ay + t1 * dy]
}
/** 창 안의 선 조각들 (레이어별) — 창에 걸친 선은 창 테두리에서 자릅니다(긴 지반선이 창 밖까지 그려진 도면) */
function 창선(raw, 창) {
  const [x0, y0, x1, y1] = 창
  const 조각 = new Map()
  for (const [ly, b] of raw.out) {
    if (빼는층.test(ly)) continue
    const a = b.pos.a
    let arr = null
    for (let i = 0; i < b.pos.n; i += 6) {
      const ax = a[i], ay = a[i + 1], bx = a[i + 3], by = a[i + 4]
      if (Math.max(ax, bx) < x0 || Math.min(ax, bx) > x1 || Math.max(ay, by) < y0 || Math.min(ay, by) > y1) continue
      const c = 자르기(ax, ay, bx, by, x0, y0, x1, y1)
      if (!c || (Math.abs(c[2] - c[0]) < 1e-9 && Math.abs(c[3] - c[1]) < 1e-9)) continue
      if (!arr) { arr = []; 조각.set(ly, arr) }
      arr.push([c[0], c[1], c[2], c[3], b.col.a[i], b.col.a[i + 1], b.col.a[i + 2]])
    }
  }
  return 조각
}
/** x 에서 선 조각들의 y (여럿이면 가장 위) */
function y에서(조각들, x) {
  let best = NaN
  for (const s of 조각들) {
    const [ax, ay, bx, by] = s
    if (Math.abs(bx - ax) < 1e-12) continue
    const lo = Math.min(ax, bx), hi = Math.max(ax, bx)
    if (x < lo - 1e-9 || x > hi + 1e-9) continue
    const y = ay + (by - ay) * (x - ax) / (bx - ax)
    if (!(y <= best)) best = y
  }
  return best
}
function y에서아래(조각들, x) {
  let best = NaN
  for (const s of 조각들) {
    const [ax, ay, bx, by] = s
    if (Math.abs(bx - ax) < 1e-12) continue
    const lo = Math.min(ax, bx), hi = Math.max(ax, bx)
    if (x < lo - 1e-9 || x > hi + 1e-9) continue
    const y = ay + (by - ay) * (x - ax) / (bx - ax)
    if (!(y >= best)) best = y
  }
  return best
}

/**
 * 도면 하나 → 3D 버킷
 * @param raw     parseDxf(…, {raw:true})
 * @param 새버킷  () => ({pos, col, pts, pcol})
 * @param 어긋    같은 화면에 노선이 여럿일 때 옆으로 비킬 거리(mm)
 * @returns null | { out: Map, 단면: [...], 폭m, 시작, 끝, 빠짐 }
 */
export function 횡단세우기(raw, 새버킷, 어긋 = 0, 머리 = '', 고른 = null) {
  let 단면 = 고른 ? 고른.slice() : 단면찾기(raw)          /* 🛣 G236 고른 = 횡단묶기 의 한 노선 몫 */
  if (단면.length < 2) return null
  /* 같은 측점이 두 벌(도면 사본)이면 표가 먼저 나온 쪽(왼쪽·위) 하나만 */
  const 본 = new Map()
  for (const s of 단면.sort((a, b) => a.x - b.x || b.y - a.y)) if (!본.has(s.측)) 본.set(s.측, s)
  단면 = [...본.values()].sort((a, b) => a.측 - b.측)
  const 쓴 = []
  const 빠짐 = []
  for (const s of 단면) {
    const 조각 = 창선(raw, s.창)
    if (!조각.size) { 빠짐.push(s.글 + ' (선 없음)'); continue }
    /* 중심선: TICK·CL·중심 레이어의 짧은 세로 선 중 표 가운데에 가까운 것
       🏭 G234 측점 표시(TICK)를 먼저 — 소장님 현장 E 06 NO.2+0.00 은 «중심선» 레이어(펌프 축 선)를 가운데로 잡아 단면이 6.8 m 옆으로 섰음 */
    let cx = s.cx0, 중심근거 = '표 가운데'
    let bd = Infinity
    for (const [ly, b] of raw.out) {
      if (!/tick/i.test(ly)) continue
      const a = b.pos.a
      for (let i = 0; i < b.pos.n; i += 6) {
        const ax = a[i], ay = a[i + 1], bx = a[i + 3], by = a[i + 4]
        if (Math.abs(ax - bx) > 1e-6 * Math.max(1, Math.abs(ax))) continue
        if (Math.min(ay, by) < s.창[1] || Math.max(ay, by) > s.창[3]) continue
        const d = Math.abs(ax - s.cx0)
        if (d < bd && d < (s.창[2] - s.창[0]) * 0.2) { bd = d; cx = ax; 중심근거 = ly }
      }
    }
    if (중심근거 === '표 가운데') for (const [ly, arr] of 조각) {
      if (!/tick|^cl$|center|cen\b|중심/i.test(ly)) continue
      for (const [ax, ay, bx, by] of arr) {
        if (Math.abs(ax - bx) > 1e-6 * Math.max(1, Math.abs(ax))) continue
        const d = Math.abs(ax - s.cx0)
        if (d < bd && d < (s.창[2] - s.창[0]) * 0.2) { bd = d; cx = ax; 중심근거 = ly }
      }
    }
    // 빼는층(tick 등)은 창선에서 빠지므로 한 번 더 raw 에서 찾습니다
    if (중심근거 === '표 가운데') {
      for (const [ly, b] of raw.out) {
        if (!/^cl$|center|cen\b|중심/i.test(ly)) continue
        const a = b.pos.a
        for (let i = 0; i < b.pos.n; i += 6) {
          const ax = a[i], ay = a[i + 1], bx = a[i + 3], by = a[i + 4]
          if (Math.abs(ax - bx) > 1e-6 * Math.max(1, Math.abs(ax))) continue
          if (Math.min(ay, by) < s.창[1] || Math.max(ay, by) > s.창[3]) continue
          const d = Math.abs(ax - s.cx0)
          if (d < bd && d < (s.창[2] - s.창[0]) * 0.2) { bd = d; cx = ax; 중심근거 = ly }
        }
      }
    }
    /* 높이 기준: 지반선이 중심선과 만나는 곳 = 지반고 */
    const 땅 = [...조각].filter(([ly]) => 땅층.test(ly)).flatMap(([, a]) => a)
    const 계 = [...조각].filter(([ly]) => 계획층.test(ly) && !땅층.test(ly)).flatMap(([, a]) => a)
    let 기준y = NaN, 기준값 = NaN, 근거 = ''
    /* 📏 눈금자가 있으면 그것이 높이의 정답(도면 높이 → 표고). 지반선이 중심에서 지반고와 얼마나 맞는지는 확인용으로 적습니다 */
    if (s.눈금) {
      const { a, b } = s.눈금
      기준y = -a / b; 기준값 = 0
      const yg = 땅.length ? y에서(땅, cx) : NaN
      const 차 = Number.isFinite(yg) && Number.isFinite(s.지반고) ? Math.abs(a + b * yg - s.지반고) : NaN
      근거 = Number.isFinite(차) ? `눈금자(지반고와 ${차.toFixed(2)} m 차이)` : '눈금자'
    }
    if (!Number.isFinite(기준y) && 땅.length && Number.isFinite(s.지반고)) { 기준y = y에서(땅, cx); 기준값 = s.지반고; 근거 = '지반고' }
    if (!Number.isFinite(기준y) && 계.length && Number.isFinite(s.계획고)) { 기준y = y에서아래(계, cx); 기준값 = s.계획고; 근거 = '계획고' }
    if (!Number.isFinite(기준y)) { 빠짐.push(s.글 + ' (중심에서 지반선을 못 찾음)'); continue }
    쓴.push({ ...s, 조각, cx, 기준y, 기준값, 근거, 땅, 계, 중심근거 })
  }
  if (쓴.length < 2) return null
  /* 도면 단위: 단면 창 폭이 300 을 넘으면 mm 로 그린 것 */
  const 창폭 = 쓴.map((s) => s.창[2] - s.창[0]).sort((a, b) => a - b)[쓴.length >> 1]
  const 배 = 창폭 > 300 ? 0.001 : 1                   // 도면 1 → m
  const out = new Map()
  const 면버킷 = (키) => { let b = out.get(키); if (!b) { b = 새버킷(); out.set(키, b) } if (!b.tri) { b.tri = 새버킷().pos; b.trc = 새버킷().col } return b }
  const M = 1000                                        // m → mm
  const 높 = (s, y) => (s.눈금 ? s.눈금.a + s.눈금.b * y : s.기준값 + (y - s.기준y) * 배)   // 도면 높이 → 표고(m)
  const 점 = (s, x, y) => [s.측 * M, (x - s.cx) * 배 * M + 어긋, 높(s, y) * M]
  for (const s of 쓴) {
    const 층키 = 머리 + s.글
    for (const [ly, arr] of s.조각) {
      const 키 = 층키 + '\u0001' + ly
      let b = out.get(키)
      if (!b) { b = 새버킷(); out.set(키, b) }
      for (const [ax, ay, bx, by, r, g, bl] of arr) {
        const p = 점(s, ax, ay), q = 점(s, bx, by)
        b.pos.push6(p[0], p[1], p[2], q[0], q[1], q[2])
        b.col.push3(r, g, bl); b.col.push3(r, g, bl)
      }
    }
  }
  /* 면 — 이웃 단면끼리 지반선·계획선을 이어 붙임 (0.5m 간격) */
  const 간격 = 0.5
  const 면만들기 = (키, 고르기, 색, 아래쪽) => {
    for (let k = 0; k + 1 < 쓴.length; k++) {
      const A = 쓴[k], B = 쓴[k + 1]
      const a선 = 고르기(A), b선 = 고르기(B)
      if (!a선.length || !b선.length) continue
      const 범위 = (s, 선) => { let lo = Infinity, hi = -Infinity; for (const [ax, , bx] of 선) { lo = Math.min(lo, (ax - s.cx) * 배, (bx - s.cx) * 배); hi = Math.max(hi, (ax - s.cx) * 배, (bx - s.cx) * 배) } return [lo, hi] }
      const [alo, ahi] = 범위(A, a선), [blo, bhi] = 범위(B, b선)
      const lo = Math.max(alo, blo), hi = Math.min(ahi, bhi)
      if (!(hi - lo > 간격)) continue
      const b = 면버킷(키)
      const z = (s, 선, o) => { const x = s.cx + o / 배; const y = 아래쪽 ? y에서아래(선, x) : y에서(선, x); return Number.isFinite(y) ? 높(s, y) : NaN }
      let 앞 = null, 첫 = null
      const 가장자리 = (st) => {       // 면 가장자리 — 측점 사이를 잇는 선(면만 있으면 화면이 그 레이어를 안 그립니다)
        const P = (x, oo, zz) => [x * M, oo * M + 어긋, zz * M]
        const [o, za, zb] = st
        const p = P(A.측, o, za), q = P(B.측, o, zb)
        b.pos.push6(p[0], p[1], p[2], q[0], q[1], q[2])
        b.col.push3(색[0], 색[1], 색[2]); b.col.push3(색[0], 색[1], 색[2])
      }
      for (let o = lo; o <= hi + 1e-9; o += 간격) {
        const za = z(A, a선, o), zb = z(B, b선, o)
        const 지금 = Number.isFinite(za) && Number.isFinite(zb) ? [o, za, zb] : null
        if (지금 && !첫) { 첫 = 지금; 가장자리(지금) }
        if (!지금 && 앞) 가장자리(앞)
        if (앞 && 지금) {
          const [o0, a0, b0] = 앞, [o1, a1, b1] = 지금
          const P = (st, oo, zz) => [st * M, oo * M + 어긋, zz * M]
          const p1 = P(A.측, o0, a0), p2 = P(A.측, o1, a1), p3 = P(B.측, o1, b1), p4 = P(B.측, o0, b0)
          b.tri.push3(...p1); b.tri.push3(...p2); b.tri.push3(...p3)
          b.tri.push3(...p1); b.tri.push3(...p3); b.tri.push3(...p4)
          for (let q = 0; q < 6; q++) b.trc.push3(색[0], 색[1], 색[2])
        }
        앞 = 지금
      }
      if (앞) 가장자리(앞)
    }
  }
  면만들기('땅 면\u0001땅 면', (s) => s.땅, [120, 160, 90], false)
  면만들기('계획 면\u0001계획 면', (s) => s.계, [90, 150, 220], true)
  const 폭들 = 쓴.map((s) => (s.창[2] - s.창[0]) * 배)
  /* 처음엔 끌 레이어 — 선이 거의 다 «세로» 인 레이어(눈금 막대·폴대·지시선). 구조물 벽은 가로선도 있어 남습니다 */
  const 세로 = new Map()
  for (const s of 쓴) {
    const 반폭 = (s.창[2] - s.창[0]) / 2
    for (const [ly, arr] of s.조각) {
      const o = 세로.get(ly) || { 세: 0, 모두: 0, 가: 0 }
      for (const [ax, ay, bx, by] of arr) {
        const L = Math.hypot(bx - ax, by - ay); o.모두 += L
        if (Math.abs(bx - ax) < 1e-6 * Math.max(1, L)) {
          o.세 += L
          if (Math.abs(ax - s.cx) > 0.8 * 반폭) o.가 += L      // 단면 틀의 양옆 세로선(눈금 막대)
        }
      }
      세로.set(ly, o)
    }
  }
  const 끌층 = [...세로].filter(([ly, o]) => !땅층.test(ly) && !계획층.test(ly) && o.모두 > 0 && (o.세 / o.모두 > 0.95 || o.가 / Math.max(o.세, 1e-9) > 0.5 && o.세 > 0)).map(([ly]) => ly)
  return {
    끌층,
    out,
    단면: 쓴.map((s) => {
      /* 📐 (G139) 단면 면적 — 터파기 · 되메우기 · 구조물 · 성토(lib/토공3d.js · 선 모양으로) */
      let 면적 = null
      try { 면적 = 단면면적(s.조각, (ly) => 땅층.test(ly), (y) => 높(s, y), 배, s.cx) } catch (e) { 면적 = null }
      return { 층: 머리 + s.글, 이름: s.글 + ' (' + s.측.toFixed(2).replace(/\.00$/, '') + ' m)', 측: s.측, 풀이: s.풀이, 글: s.글, 지반고: s.지반고, 계획고: s.계획고, 근거: s.근거, 중심: s.중심근거, 면적, 표면적: s.표면적 || null }
    }),
    폭m: Math.max(...폭들),
    시작: 쓴[0].측, 끝: 쓴[쓴.length - 1].측,
    배,
    빠짐,
  }
}
