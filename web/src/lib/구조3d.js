/**
 * 🏗 구조물 도면(평면도 + 단면 A-A · B-B …)으로 세우기 — «울타리처럼» (2026-09-27)
 *
 * 소장님: 「펌프장 구조물도 안나오고...왜 그러지?」 → 「펌프장 구조물 세우기」 (소장님 도면으로 시험 — 결과물·예시엔 안 실음)
 *
 * ■ 토목 구조물 일반도는 선에 높이(Z)가 없고, 높이는 단면의 «EL(+)1.29 · G.L(+)4.22» 같은 글자로만 적혀 있습니다.
 *   그래서 이렇게 세웁니다(울타리 그림 — 공사 사람이 머릿속으로 맞춰 보는 모양 그대로):
 *   ① 평면도를 땅높이(G.L)에 눕히고
 *   ② 단면마다 EL 글자로 «도면 높이 → 표고(m)» 를 맞춘 뒤
 *   ③ 평면도의 자르는 선(A ─ A 글자 짝)에 그 단면을 «세워» 꽂습니다.
 *      단면 속 벽 자리와 평면도에서 자르는 선을 지나는 벽 자리가 가장 많이 겹치게 옆으로 맞추고(방향도),
 *      짝 글자가 없는 긴 단면(종단면)은 평면도의 긴 쪽 가운데 줄에 세웁니다.
 * ■ 도면은 1:1(mm)로 그린 모델 공간을 봅니다 — EL 두 개 이상이면 기울기로 확인합니다. 좌표는 mm 로 냅니다.
 * ■ 짐작으로 높이를 지어내지 않습니다. EL 글자가 없는 단면·짝을 못 찾은 단면은 «못 세운 것» 으로 알립니다.
 */
import { 관지름 } from './구조물면.js'

const 붙 = (s) => String(s ?? '').replace(/\s+/g, '')
const 빼는층 = /^[_#!★\-\s]*(text|글|문자|dim|치수|hatch|해치|defpoints|도곽|sheet|border|form|title|table|테이블|tick|지번|tex$|tit|sym)/i

/* 「EL(+)1.29」「EL. (-)2.17」「G.L(+)4.22」「EL.(+) 7.14m(…)」「섬진강 … 홍수위 EL(+)6.140」「EL=5.156」 → m */
const EL글 = /(?:^|[^A-Z])(E\.?\s?L|G\.?\s?L)\.?\s*[=:]?\s*(?:\(\s*([+-])\s*\)|([+-]))?\s*(\d{1,3}(?:\.\d+)?)\s*(m\b|M\b)?/i
export function EL읽기(s) {
  const m = EL글.exec(String(s))
  if (!m) return null
  let v = parseFloat(m[4])
  if ((m[2] || m[3]) === '-') v = -v
  return { v, GL: /G/i.test(m[1]) }
}

const 제목평면 = (s) => /^(일반)?평면도$/.test(붙(s)) || /^평면도\(?\d?\/?\d?\)?$/.test(붙(s))
/** 단면 제목 → 이름 («A-A» · «A1-A1» · «종단면») */
export function 단면이름(s) {
  const c = 붙(s).toUpperCase()
  let m = /^단면([A-Z]\d?)-\1$/.exec(c)
  if (m) return m[1] + '-' + m[1]
  m = /^(SECTION|SEC\.?)([A-Z]\d?)-\2$/.exec(c)
  if (m) return m[2] + '-' + m[2]
  if (/^(종단면도?|종단도)$/.test(c)) return '종단'
  return null
}

/** 도곽(도면 테두리) — «네모» 로 닫힌 긴 줄들. 장마다 크기가 달라도(A1·A3) 되게, 가로 두 줄 + 양끝 세로 줄이 맞물린 것만 */
function 도곽줄(raw) {
  const 가 = [], 세 = []
  for (const [, b] of raw.out) {
    const a = b.pos.a
    for (let i = 0; i < b.pos.n; i += 6) {
      const x1 = a[i], y1 = a[i + 1], x2 = a[i + 3], y2 = a[i + 4]
      if (Math.abs(y2 - y1) < 1 && Math.abs(x2 - x1) > 8000) 가.push([Math.min(x1, x2), Math.max(x1, x2), y1])
      else if (Math.abs(x2 - x1) < 1 && Math.abs(y2 - y1) > 5000) 세.push([Math.min(y1, y2), Math.max(y1, y2), x1])
    }
  }
  const 무리 = new Map()
  for (const q of 가) { const k = Math.round(q[0]) + ',' + Math.round(q[1]); if (!무리.has(k)) 무리.set(k, []); 무리.get(k).push(q[2]) }
  const 네모 = []
  const 세움 = (x, y0, y1) => 세.some((v) => Math.abs(v[2] - x) < 2 && v[0] <= y0 + 2 && v[1] >= y1 - 2)
  for (const [k, ys] of 무리) {
    if (ys.length < 2) continue
    const [x0, x1] = k.split(',').map(Number)
    const 줄y = [...new Set(ys.map((y) => Math.round(y)))].sort((p, q) => p - q)
    for (let i = 0; i < 줄y.length; i++) for (let j = i + 1; j < 줄y.length; j++) {
      const y0 = 줄y[i], y1 = 줄y[j]
      if (y1 - y0 < 5000) continue
      if (세움(x0, y0, y1) && 세움(x1, y0, y1)) 네모.push([x0, y0, x1, y1])
    }
  }
  return { 가, 세, 네모 }
}
/** 제목이 든 가장 작은 도곽 — 없으면 끝없음 */
function 도곽찾기(줄, x, y) {
  let best = null, ba = Infinity
  for (const r of 줄.네모) {
    if (x < r[0] || x > r[2] || y < r[1] || y > r[3]) continue
    const A = (r[2] - r[0]) * (r[3] - r[1])
    if (A < ba) { ba = A; best = r }
  }
  return best || [-Infinity, -Infinity, Infinity, Infinity]
}

/** 레벨 글자 → 그 아래 가장 가까운 가로줄 높이(표시 선) · 없으면 글자 자리 */
function 레벨줄(가로, t) {
  const h = t.h || 200
  let best = null, bd = Infinity
  for (const q of 가로) {
    if (q[2] > t.y + 0.2 * h || q[2] < t.y - 2.5 * h) continue
    if (q[1] < t.x - 2 * h || q[0] > t.x + 6 * h) continue
    const d = t.y - q[2]
    if (d < bd) { bd = d; best = q }
  }
  return best ? best[2] : t.y
}

/** 모든 세그먼트를 한 번 훑어 창 안의 것만 */
function 창선(raw, W) {
  const out = []
  for (const [ly, b] of raw.out) {
    if (빼는층.test(ly)) continue
    const a = b.pos.a, c = b.col.a
    for (let i = 0; i < b.pos.n; i += 6) {
      const mx = (a[i] + a[i + 3]) / 2, my = (a[i + 1] + a[i + 4]) / 2
      if (mx < W[0] || mx > W[2] || my < W[1] || my > W[3]) continue
      out.push([ly, a[i], a[i + 1], a[i + 3], a[i + 4], c[i], c[i + 1], c[i + 2]])
    }
  }
  return out
}

/** 표 가르기 — 두 자리 목록이 가장 많이 겹치는 옮김 */
/** 선들(평선 [층, x1, y1, x2, y2 …])의 가운데점 좌표(k = 1 x · 2 y)를 길이로 무게 준 가운데값 */
function 가중가운데(선, k) {
  const a = 선.map((s) => [(s[k] + s[k + 2]) / 2, Math.hypot(s[3] - s[1], s[4] - s[2])]).filter((q) => q[1] > 0).sort((p, q) => p[0] - q[0])
  const 합 = a.reduce((t, q) => t + q[1], 0)
  let 누 = 0
  for (const q of a) { 누 += q[1]; if (누 >= 합 / 2) return q[0] }
  return a.length ? a[a.length - 1][0] : 0
}
function 겹침(ts, xs, 틈 = 60, 창 = null) {
  const 표 = new Map()
  for (const t of ts) for (const x of xs) {
    if (창 && (t - x < 창[0] || t - x > 창[1])) continue          // 🧾 G400 종단은 두 끝이 맞는 자리 둘레만
    const d = Math.round((t - x) / 틈)
    표.set(d, (표.get(d) || 0) + 1)
  }
  let best = 0, n = 0
  for (const [d, c] of 표) {
    const 둘 = c + 0.5 * ((표.get(d - 1) || 0) + (표.get(d + 1) || 0))
    if (둘 > n) { n = 둘; best = d }
  }
  return { d: best * 틈, n }
}

/**
 * @returns {null | {out, 단면:[{층, 이름, 놓임, EL:[lo,hi], 맞춤}], 평면EL, 빠짐:[], 제목}}
 */
/** 🧾 G424 평면 자르는 선 짝 고르기 — 같은 글자(A … A) 여럿 중
 *  가장 먼 두 글자. 단, 단면 폭 w(가로)의 0.7 ~ 2.5 배 거리인 짝이 있으면 그중 1.25 배에 가장 가까운 짝
 *  (현장 S 배수장: 평면의 «℄»(C · L 따로 쓴 글) 이 «C» 로 잡혀 C-C 가 구조물 끝에서 끝까지 72 m 가로로 놓였음 — 화살표 C 두 개는 15.9 m 세로) */
export function 자름짝(쌍, w) {
  let a = 쌍[0], b = 쌍[1], m = -1
  for (let i = 0; i < 쌍.length; i++) for (let j = i + 1; j < 쌍.length; j++) { const L = Math.hypot(쌍[i].x - 쌍[j].x, 쌍[i].y - 쌍[j].y); if (L > m) { m = L; a = 쌍[i]; b = 쌍[j] } }
  let 고른 = null
  for (let i = 0; i < 쌍.length; i++) for (let j = i + 1; j < 쌍.length; j++) {
    const L = Math.hypot(쌍[i].x - 쌍[j].x, 쌍[i].y - 쌍[j].y)
    if (w > 0 && L >= 0.7 * w && L <= 2.5 * w && (!고른 || Math.abs(L - 1.25 * w) < Math.abs(고른.L - 1.25 * w))) 고른 = { L, a: 쌍[i], b: 쌍[j] }
  }
  if (고른 && 고른.L < m - 1e-6) return { a: 고른.a, b: 고른.b, L: 고른.L }
  return { a, b, L: m }
}

/** 🧾 G424 단면의 덮개 열린 곳 — 덮개 두께(0.15 ~ 0.6 m)만큼만인 세로 선 짝(위 끝 · 아래 끝에 가로선이 지나감 · 아래로 이어진 벽 면이 아님)
 *  (현장 S 배수장 단면 B-B: 덮개 EL 3.92 ~ 4.22 에 1.8 · 1.8 · 1.8 · 1.5 m 짝 = 평면의 펌프 구멍 원 · C-C: 1.75 m 셋 · 1.35 m = 배관실 덮개 구멍)
 *  선 = [[ly, x1, y1, x2, y2], …] (단면 좌표) · EL(y) · m = 1(m 도면) | 1000(mm) → [{ x1, x2, 밑, 위 }] (x 는 단면 좌표) */
/** 🧾 G424 단면의 중간 슬래브 — 벽 면 둘 사이를 잇는 가로선 둘(사이 0.15 ~ 0.6 m · 같은 끝 ±5 cm) · 두 벽 면이 그 자리에서 끊기고(슬래브 위 · 아래로 방) · 끝은 벽 면에 닿거나 45° 헌치 사선으로 닿음
 *  (현장 S 배관실 — 단면 C-C: EL 0.895 ~ 1.295 가 벽 면 66,503 ~ 77,903 (11.4 m) · 종단 A1-A1: 2.6 m 가로선 + 양끝 0.2 헌치 = 벽 면 사이 3.0 m)
 *  덮개(맨 위) · 바닥판(맨 아래)은 아님 — 위아래로 벽 면이 0.5 m 넘게 이어질 때만 → [{ x1, x2 (벽 면) · 밑 · 위 · 헌치: [{ 끝: '왼'|'오', 쪽: '위'|'아래', 다리 }] }] */
export function 중간판찾기(선, EL, m = 1000) {
  const 거름 = /pile|파일|말뚝|phc|기계|mech|pump|펌프|철근|bar|배관|pipe|전기|elec|hatch|해치|지시|치수|dim|text|글|난간|hand|rail|창호|door|win/i
  const 쓸 = 선.filter((t) => !거름.test(t[0]))
  const e = 0.003 * m, e2 = 0.05 * m
  const 가 = [], 세 = [], 사 = []
  for (const t of 쓸) {
    const dx = t[3] - t[1], dy = t[4] - t[2]
    if (Math.abs(dy) < e && Math.abs(dx) > e) 가.push({ a: Math.min(t[1], t[3]), b: Math.max(t[1], t[3]), y: t[2] })
    else if (Math.abs(dx) < e && Math.abs(dy) > e) 세.push({ x: t[1], lo: Math.min(t[2], t[4]), hi: Math.max(t[2], t[4]) })
    else if (Math.abs(Math.abs(dx) - Math.abs(dy)) <= 0.3 * Math.abs(dy) && Math.abs(dy) >= 0.1 * m && Math.abs(dy) <= 0.65 * m) 사.push(t)
  }
  /* 끝 자리(x, y)에서 벽 면 찾기 — 바로 닿거나(세로선 끝 · 몸통) · 45° 사선으로 바깥쪽(왼 끝은 왼쪽)으로 가서 닿음 */
  const 면찾기 = (x, y, 쪽) => {
    const 닿 = 세.find((v) => Math.abs(v.x - x) < e && v.lo <= y + e && v.hi >= y - e)
    if (닿) return { x: v면(닿), 다리: 0 }
    for (const t of 사) for (const [ax, ay, bx, by] of [[t[1], t[2], t[3], t[4]], [t[3], t[4], t[1], t[2]]]) {
      if (Math.abs(ax - x) > e || Math.abs(ay - y) > e) continue
      if ((쪽 === '왼' && bx >= ax) || (쪽 === '오' && bx <= ax)) continue
      if (세.some((v) => Math.abs(v.x - bx) < e && v.lo <= by + e && v.hi >= by - e)) return { x: bx, 다리: Math.abs(by - ay) / m, 위로: by > ay }
    }
    return null
  }
  function v면(v) { return v.x }
  const 판 = []
  for (const A of 가) for (const B of 가) {
    if (A === B || A.y <= B.y) continue
    const 두 = EL(A.y) - EL(B.y)
    if (두 < 0.15 || 두 > 0.6 || Math.abs(A.a - B.a) > e2 || Math.abs(A.b - B.b) > e2 || A.b - A.a < 0.5 * m) continue
    const 왼위 = 면찾기(A.a, A.y, '왼'), 왼아 = 면찾기(B.a, B.y, '왼'), 오위 = 면찾기(A.b, A.y, '오'), 오아 = 면찾기(B.b, B.y, '오')
    if (!왼위 || !왼아 || !오위 || !오아 || Math.abs(왼위.x - 왼아.x) > e || Math.abs(오위.x - 오아.x) > e) continue
    const xl = 왼위.x, xr = 오위.x
    /* 두 벽 면이 슬래브 자리에서 끊김(슬래브 띠를 가로지르는 세로선 없음) · 위 · 아래로 벽 면이 0.5 m 넘게 */
    const 끊김 = (x) => !세.some((v) => Math.abs(v.x - x) < e && v.lo < B.y - e && v.hi > A.y + e)
    const 위로 = (x) => 세.some((v) => Math.abs(v.x - x) < e && v.lo >= A.y - 0.7 * m && v.hi - Math.max(v.lo, A.y) > 0.5 * m)
    const 아래로 = (x) => 세.some((v) => Math.abs(v.x - x) < e && v.hi <= B.y + 0.7 * m && Math.min(v.hi, B.y) - v.lo > 0.5 * m)
    if (!끊김(xl) || !끊김(xr) || !위로(xl) || !위로(xr) || !아래로(xl) || !아래로(xr)) continue
    if (판.some((q) => Math.abs(q.x1 - xl) < e2 && Math.abs(q.x2 - xr) < e2 && Math.abs(q.밑 - EL(B.y)) < 0.02)) continue
    const 헌치 = []
    for (const [끝, 쪽, r] of [['왼', '위', 왼위], ['왼', '아래', 왼아], ['오', '위', 오위], ['오', '아래', 오아]]) if (r.다리 > 0) 헌치.push({ 끝, 쪽, 다리: +r.다리.toFixed(3) })
    판.push({ x1: xl, x2: xr, 밑: +EL(B.y).toFixed(3), 위: +EL(A.y).toFixed(3), 헌치 })
  }
  return 판
}

export function 열린곳찾기(선, EL, m = 1000) {
  const 거름 = /pile|파일|말뚝|phc|기계|mech|pump|펌프|철근|bar|배관|pipe|전기|elec|hatch|해치|지시|치수|dim|text|글|난간|hand|rail|창호|door|win/i
  const 쓸 = 선.filter((t) => !거름.test(t[0]))
  const e = 0.003 * m
  const 가 = [], 세 = []
  for (const t of 쓸) {
    if (Math.abs(t[2] - t[4]) < e && Math.abs(t[1] - t[3]) > e) 가.push({ a: Math.min(t[1], t[3]), b: Math.max(t[1], t[3]), y: t[2] })
    else if (Math.abs(t[1] - t[3]) < e && Math.abs(t[2] - t[4]) > e) 세.push({ x: t[1], lo: Math.min(t[2], t[4]), hi: Math.max(t[2], t[4]) })
  }
  const 지남 = (x, y) => 가.some((g) => Math.abs(g.y - y) < e && g.a <= x + e && g.b >= x - e)
  const 이어 = (v) => 세.some((u) => u !== v && Math.abs(u.x - v.x) < e && (Math.abs(u.hi - v.lo) < e || Math.abs(u.lo - v.hi) < e))
  const 틱 = []
  for (const v of 세) {
    const L = EL(v.hi) - EL(v.lo)
    if (L < 0.15 || L > 0.6) continue
    if (!지남(v.x, v.hi) || !지남(v.x, v.lo) || 이어(v)) continue
    if (틱.some((q) => Math.abs(q.x - v.x) < e && Math.abs(q.lo - v.lo) < e)) continue
    틱.push(v)
  }
  틱.sort((p, q) => p.x - q.x)
  /* 짝 — 같은 위 · 아래(±2 cm) · 사이 0.3 ~ 4 m · 사이에 덮개 아래로 내려가는 벽 면이 없음 */
  const 벽면 = (a, b, lo) => 세.some((u) => u.x > a + e && u.x < b - e && Math.abs(u.hi - lo) < e && EL(u.hi) - EL(u.lo) > 0.6)
  /* 같은 위 · 아래 끼리 묶어 차례로 짝(다른 높이의 짧은 세로선 — 피트 · 턱 — 이 사이에 끼어도) */
  const 무리 = []
  for (const v of 틱) {
    const g = 무리.find((q) => Math.abs(EL(q[0].hi) - EL(v.hi)) <= 0.02 && Math.abs(EL(q[0].lo) - EL(v.lo)) <= 0.02)
    if (g) g.push(v); else 무리.push([v])
  }
  const 열린 = []
  for (const g of 무리) for (let i = 0; i + 1 < g.length; i++) {
    const A = g[i], B = g[i + 1], w = (B.x - A.x) / m
    if (w < 0.3 || w > 4 || 벽면(A.x, B.x, A.lo)) continue
    열린.push({ x1: A.x, x2: B.x, 밑: +EL(A.lo).toFixed(3), 위: +EL(A.hi).toFixed(3) })
    i++
  }
  열린.sort((p, q) => p.x1 - q.x1)
  return 열린
}

/**
 * 📏 G445 평면의 «끊어 그린» 곳 — 치수에 적은 값이 잰 길이보다 훨씬 크면(현장 S 배수장: «52,600» 을 17.8 m 로 그림) 그 사이를 줄여 그린 것
 *   단위 = 다른 치수들의 «적은 값 ÷ 잰 길이» 가운데값(mm 도면 1 · m 도면 1000) · 같은 곳을 품은 큰 치수(전체 길이)는 빼고 가장 짧은 것만
 * @returns [{ P:[x,y], Q:[x,y], 더: 늘릴 길이(도면 단위), 적은: 값, 잰: 길이(적은 값 단위) }]
 */
export function 끊음찾기(dims, 창 = null, 뺄창 = []) {
  const 수 = (s) => { const t = String(s || '').replace(/\s/g, ''); if (!/^\d{1,3}(,\d{3})+(\.\d+)?$|^\d+(\.\d+)?$/.test(t)) return NaN; return +t.replace(/,/g, '') }
  const 안 = (W, x, y) => x > W[0] && x < W[2] && y > W[1] && y < W[3]
  const 들 = []
  for (const d of dims || []) {
    const mx = (d.x1 + d.x2) / 2, my = (d.y1 + d.y2) / 2
    if (창 && !안(창, mx, my)) continue
    if (뺄창.some((W) => 안(W, mx, my))) continue
    const 잰 = Math.abs((d.x2 - d.x1) * d.ux + (d.y2 - d.y1) * d.uy)
    if (!(잰 > 0)) continue
    들.push({ d, 잰, 적은: 수(d.s) })
  }
  const 비 = 들.filter((x) => Number.isFinite(x.적은) && x.적은 > 0).map((x) => x.적은 / x.잰).sort((a, b) => a - b)
  if (비.length < 3) return []
  const k = 비[Math.floor(비.length / 2)]
  if (!(k > 0)) return []
  const 후 = []
  for (const x of 들) {
    if (!Number.isFinite(x.적은)) continue
    const 잰값 = x.잰 * k
    if (!(x.적은 > 1.5 * 잰값 && x.적은 - 잰값 > 2000)) continue
    const d = x.d
    /* 재는 축 위 두 끝(13 점을 지나는 방향 줄로 내림) */
    const t1 = 0, t2 = (d.x2 - d.x1) * d.ux + (d.y2 - d.y1) * d.uy
    const P = [d.x1 + d.ux * Math.min(t1, t2), d.y1 + d.uy * Math.min(t1, t2)], Q = [d.x1 + d.ux * Math.max(t1, t2), d.y1 + d.uy * Math.max(t1, t2)]
    후.push({ P, Q, 더: (x.적은 - 잰값) / k, 적은: x.적은, 잰: 잰값, ux: d.ux, uy: d.uy })
  }
  후.sort((a, b) => a.잰 - b.잰)
  const 고른 = []
  for (const c of 후) {
    /* 이미 고른 끊음을 품은(같은 축 · 겹친) 큰 치수는 뺌 */
    const 품음 = 고른.some((g) => Math.abs(g.ux * c.uy - g.uy * c.ux) < 0.02 && (() => { const a = (g.P[0] - c.P[0]) * c.ux + (g.P[1] - c.P[1]) * c.uy, b = (g.Q[0] - c.P[0]) * c.ux + (g.Q[1] - c.P[1]) * c.uy, L = Math.hypot(c.Q[0] - c.P[0], c.Q[1] - c.P[1]); return Math.min(a, b) > -1e-6 * L - 1 && Math.max(a, b) < L + 1 })())
    if (!품음) 고른.push(c)
  }
  return 고른.map(({ P, Q, 더, 적은, 잰 }) => ({ P, Q, 더, 적은, 잰 }))
}

export function 구조세우기(raw, 새버킷, 머리 = '') {
  const T = (raw.texts || []).filter((t) => !t.a || Math.abs(((t.a % 180) + 180) % 180) < 3)
  const 평제 = T.filter((t) => 제목평면(t.s)).sort((a, b) => (b.h || 0) - (a.h || 0))[0]
  const 단제 = T.map((t) => ({ t, 이름: 단면이름(t.s) })).filter((q) => q.이름)
  if (!평제 || !단제.length) return null
  const 줄 = 도곽줄(raw)
  const 가로 = []
  for (const [ly, b] of raw.out) {
    if (빼는층.test(ly) && !/el|lev|레벨/i.test(ly)) continue
    const a = b.pos.a
    for (let i = 0; i < b.pos.n; i += 6) if (Math.abs(a[i + 4] - a[i + 1]) < 1 && Math.abs(a[i + 3] - a[i]) > 50) gpush(가로, a, i)
  }
  function gpush(arr, a, i) { arr.push([Math.min(a[i], a[i + 3]), Math.max(a[i], a[i + 3]), a[i + 1]]) }
  const 모든제목 = [평제, ...단제.map((q) => q.t)]
  const ELs = []
  for (const t of T) { const r = EL읽기(t.s); if (r) ELs.push({ t, ...r }) }

  /* ② 단면마다 창 · 표고 맞추기 */
  const 단면들 = []
  const 빠짐 = []
  /* 제목마다 위·아래 창 — 제목이 그림 «위» 에 붙는 도면도, «아래» 에 붙는 도면도 있습니다.
     한쪽에만 EL 이 있는 제목부터 정하고, 그 EL 은 다른 제목이 못 가져가게 합니다(두 단면 사이의 제목이 이웃 그림을 뺏지 않게). */
  const 창들 = 단제.map(({ t, 이름 }) => {
    const h = t.h || 300
    const 틀 = 도곽찾기(줄, t.x, t.y)
    const 같은줄 = 단제.filter((q) => q.t !== t && Math.abs(q.t.y - t.y) < 6 * h)
    let 왼 = t.x - 100 * h, 오 = t.x + 100 * h
    for (const q of 같은줄) { if (q.t.x < t.x) 왼 = Math.max(왼, (q.t.x + t.x) / 2); else 오 = Math.min(오, (q.t.x + t.x) / 2) }
    왼 = Math.max(왼, 틀[0]); 오 = Math.min(오, 틀[2])
    const 위다음 = 모든제목.filter((u) => u !== t && u.y > t.y + h && u.x > 왼 && u.x < 오).reduce((m, u) => Math.min(m, u.y), Math.min(틀[3], t.y + 80 * h))
    const 아래다음 = 모든제목.filter((u) => u !== t && u.y < t.y - h && u.x > 왼 && u.x < 오).reduce((m, u) => Math.max(m, u.y), Math.max(틀[1], t.y - 80 * h))
    const 위창 = [왼, t.y + 0.8 * h, 오, 위다음 - 1.5 * h], 아래창 = [왼, 아래다음 + 1.5 * h, 오, t.y - 0.8 * h]
    const 안 = (W) => ELs.filter((e) => e.t.x > W[0] && e.t.x < W[2] && e.t.y > W[1] && e.t.y < W[3])
    return { t, 이름, h, 위창, 아래창, 위EL: 안(위창), 아래EL: 안(아래창) }
  })
  const 가져감 = new Set()
  const 고름 = new Map()
  for (let 돌 = 0; 돌 < 3; 돌++) {
    for (const c of 창들) {
      if (고름.has(c)) continue
      if (c.이름 === '종단' && 돌 < 2) continue                  // «종단면도» 시트 머리는 맨 나중에(그 아래 단면 제목들이 먼저)
      const 위 = c.위EL.filter((e) => !가져감.has(e)), 아래 = c.아래EL.filter((e) => !가져감.has(e))
      if (돌 < 1 && 위.length && 아래.length) continue            // 두 쪽 다 있으면 나중에
      if (!위.length && !아래.length) { if (돌 === 2) 고름.set(c, null); continue }
      const 쪽 = 위.length >= 아래.length ? [c.위창, 위] : [c.아래창, 아래]
      고름.set(c, 쪽); for (const e of 쪽[1]) 가져감.add(e)
    }
  }
  for (const c of 창들) {
    const { t, 이름, h } = c
    const 쪽 = 고름.get(c)
    if (!쪽) { if (이름 !== '종단') 빠짐.push(`${이름}(EL 글자 없음)`); continue }
    const [W, 표] = 쪽
    /* 표고 = 값 − (줄y − 기준) × 기울기 — 1:1(mm) 이면 기울기 0.001. 두 개 이상이면 확인 */
    const 점 = 표.map((e) => ({ y: 레벨줄(가로, e.t), v: e.v, GL: e.GL }))
    let 기울 = 0.001
    if (점.length >= 2) {
      const 후보 = []
      for (let i = 0; i < 점.length; i++) for (let j = i + 1; j < 점.length; j++) {
        const dy = 점[j].y - 점[i].y
        if (Math.abs(dy) > 5 * h) 후보.push((점[j].v - 점[i].v) / dy)
      }
      후보.sort((a, b) => a - b)
      const 가운데 = 후보.length ? 후보[Math.floor(후보.length / 2)] : 0.001
      if (가운데 > 0.0005 && 가운데 < 0.002) 기울 = 0.001                  // mm 1:1
      else if (가운데 > 0.5 && 가운데 < 2) 기울 = 1                       // m 1:1
    }
    const 앞 = 점.map((p) => p.v - p.y * 기울).sort((a, b) => a - b)
    const 기준 = 앞[Math.floor(앞.length / 2)]
    const 맞음 = 점.filter((p) => Math.abs(p.v - p.y * 기울 - 기준) < 0.35).length
    /* EL 글자끼리 서로 안 맞으면(다른 그림의 글자가 섞였거나 축척이 다름) 세우지 않습니다 — 짐작으로 세우지 않기 */
    if (점.length >= 2 && 맞음 < Math.max(2, 0.5 * 점.length)) { 빠짐.push(`${이름}(EL 글자끼리 안 맞음 ${맞음}/${점.length})`); continue }
    const 선 = 창선(raw, W)
    if (선.length < 10) { 빠짐.push(`${이름}(선 없음)`); continue }
    const EL = (y) => 기준 + y * 기울
    let lo = Infinity, hi = -Infinity
    for (const s of 선) { lo = Math.min(lo, EL(s[2]), EL(s[4])); hi = Math.max(hi, EL(s[2]), EL(s[4])) }
    const 세로 = 선.filter((s) => Math.abs(s[1] - s[3]) < 1 && Math.abs(s[2] - s[4]) > 300).map((s) => s[1])
    let x0 = Infinity, x1 = -Infinity
    for (const s of 선) { x0 = Math.min(x0, s[1], s[3]); x1 = Math.max(x1, s[1], s[3]) }
    const GL = 점.filter((p) => p.GL).map((p) => p.v)
    단면들.push({ 이름, t, W, 선, EL, 기울, lo, hi, 세로, x0, x1, 맞음, 표수: 점.length, GL })
  }
  /* 겹친 창(시트 머리 «종단면도» 가 그 아래 단면들을 다 품는 경우 등) — 더 좁고 이름이 또렷한 쪽만 */
  {
    const 넓이 = (W) => Math.max(0, W[2] - W[0]) * Math.max(0, W[3] - W[1])
    const 겹넓 = (A, B) => 넓이([Math.max(A[0], B[0]), Math.max(A[1], B[1]), Math.min(A[2], B[2]), Math.min(A[3], B[3])])
    for (let i = 단면들.length - 1; i >= 0; i--) {
      const d = 단면들[i]
      const 더나은 = 단면들.some((e, j) => j !== i && 겹넓(d.W, e.W) > 0.5 * Math.min(넓이(d.W), 넓이(e.W)) &&
        ((d.이름 === '종단' && e.이름 !== '종단') || (d.이름 === e.이름 ? j < i && 넓이(e.W) <= 넓이(d.W) : 넓이(e.W) < 넓이(d.W) && e.이름 !== '종단')))
      if (더나은) 단면들.splice(i, 1)
    }
    const 셈 = new Map()
    for (const d of 단면들) { const n = (셈.get(d.이름) || 0) + 1; 셈.set(d.이름, n); d.표시 = n > 1 ? `${d.이름} (${n})` : d.이름 }
  }
  const 디 = globalThis.__구조디버그 ? console.log : () => {}
  디('단면들', 단면들.map((d) => [d.이름, d.표수, d.맞음, d.선.length, d.lo.toFixed(2), d.hi.toFixed(2), d.W.map(Math.round).join(',')]), '빠짐', 빠짐)
  if (!단면들.length) return null

  /* ① 평면도 창 — 제목이 든 도곽(아래 표제란 띠 빼고), 없으면 제목 둘레 */
  const ph = 평제.h || 500
  const 틀 = 도곽찾기(줄, 평제.x, 평제.y)
  let PW = [Math.max(틀[0], 평제.x - 120 * ph), Math.max(틀[1], 평제.y - 80 * ph), Math.min(틀[2], 평제.x + 120 * ph), Math.min(틀[3], 평제.y + 80 * ph)]
  {
    const 띠 = 줄.가.filter((q) => q[2] > PW[1] && q[2] < PW[1] + 0.15 * (PW[3] - PW[1]) && q[0] <= 평제.x && q[1] >= 평제.x).map((q) => q[2])
    if (띠.length) PW[1] = Math.max(...띠)
  }
  /* 🧾 G402 평면 창 안의 관 글자(D2,000mm …) — 구조물면이 그 사이 관 테두리 선을 벽으로 안 읽게 */
  const 관글 = (raw.texts || []).filter((t) => t.x > PW[0] && t.x < PW[2] && t.y > PW[1] && t.y < PW[3]).map((t) => ({ x: t.ax ?? t.x, y: t.ay ?? t.y, D: 관지름(t.s) })).filter((t) => t.D)
  /* 🧾 G424 평면 창 안의 원(덮개 펌프 구멍 등 — 지시 · 치수 · 기계 · 배관 레이어 빼고) */
  const 평원 = (raw.circles || []).filter((c) => c.x > PW[0] && c.x < PW[2] && c.y > PW[1] && c.y < PW[3] && !/지시|치수|dim|text|글|기계|mech|pump|펌프|배관|pipe|전기|elec|철근|bar|hatch|해치/i.test(c.ly || '')).map((c) => ({ x: c.x, y: c.y, r: c.r }))
  const 평선 = 창선(raw, PW).filter((s) => !단면들.some((d) => { const mx = (s[1] + s[3]) / 2, my = (s[2] + s[4]) / 2; return mx > d.W[0] && mx < d.W[2] && my > d.W[1] && my < d.W[3] }))
  디('평면창', PW.map(Math.round), '평선', 평선.length)
  if (평선.length < 20) return null
  let px0 = Infinity, py0 = Infinity, px1 = -Infinity, py1 = -Infinity
  for (const s of 평선) { px0 = Math.min(px0, s[1], s[3]); px1 = Math.max(px1, s[1], s[3]); py0 = Math.min(py0, s[2], s[4]); py1 = Math.max(py1, s[2], s[4]) }
  /* 평면 높이 = 단면들의 G.L 값(가장 많이 나온 것), 없으면 가장 높은 곳 */
  const GL모음 = new Map()
  for (const d of 단면들) for (const g of d.GL) GL모음.set(g, (GL모음.get(g) || 0) + 1)
  const 평면EL = GL모음.size ? [...GL모음.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0][0] : Math.max(...단면들.map((d) => d.hi))

  /* ③ 자르는 선 — 평면 창 안의 같은 글자 짝(A…A) */
  const 글자0 = T.filter((t) => /^[A-Z]\d?$/.test(붙(t.s)) && t.x > PW[0] && t.x < PW[2] && t.y > PW[1] && t.y < PW[3])
  /* 🧾 G424 «℄»(중심선 — C · L 글자를 겹쳐 따로 씀)의 C · L 은 자르는 선 글자가 아님(현장 S 배수장: C-C 가 ℄ 의 C 와 화살표 C 를 짝지어 비스듬히 놓였음 —
       ℄ 두 개 짝이면 구조물 끝 ~ 끝 72 m 가로 · 단면 폭(17.2 m 창)의 1.25 배 짝 고르기만으로는 ℄ 의 C ~ 화살표 C 21.5 m 비스듬한 짝이 골라졌음) */
  const 중심글 = (t) => { const k = 붙(t.s); if (k !== 'C' && k !== 'L') return false; const 짝글 = k === 'C' ? 'L' : 'C', h = t.h || 300; return 글자0.some((u) => 붙(u.s) === 짝글 && Math.hypot(u.x - t.x, u.y - t.y) < 1.5 * h) }
  const 글자 = 글자0.filter((t) => !중심글(t))
  const 짝 = new Map()
  for (const t of 글자) { const k = 붙(t.s); if (!짝.has(k)) 짝.set(k, []); 짝.get(k).push(t) }
  /* 평면 선이 자르는 선을 지나는 자리들(시작점에서 거리) */
  const 지나는자리 = (P, Q) => {
    const ux = Q[0] - P[0], uy = Q[1] - P[1], L = Math.hypot(ux, uy)
    const out = []
    for (const s of 평선) {
      const ax = s[1] - P[0], ay = s[2] - P[1], bx = s[3] - P[0], by = s[4] - P[1]
      const ca = ux * ay - uy * ax, cb = ux * by - uy * bx
      if (ca * cb > 0 || ca === cb) continue
      const k = ca / (ca - cb)
      const ix = ax + (bx - ax) * k, iy = ay + (by - ay) * k
      const t = (ix * ux + iy * uy) / L
      if (t > -0.1 * L && t < 1.1 * L) out.push(t)
    }
    return { out, L }
  }
  const 새 = new Map()
  const 넣기 = (키, ly, x1, y1, z1, x2, y2, z2, r, g, b) => {
    const k = 키 + '\u0001' + ly
    let nb = 새.get(k)
    if (!nb) { nb = 새버킷(); 새.set(k, nb) }
    nb.pos.push6(x1, y1, z1, x2, y2, z2)
    nb.col.push3(r, g, b); nb.col.push3(r, g, b)
  }
  const 평키 = 머리 + '평면'
  const zP = 평면EL * 1000
  for (const s of 평선) 넣기(평키, s[0], s[1], s[2], zP, s[3], s[4], zP, s[5], s[6], s[7])
  const 결과단면 = [{ 층: 평키, 이름: '평면도', 놓임: `G.L ${평면EL.toFixed(2)} m 에 눕힘`, EL: [평면EL, 평면EL], 맞춤: '' }]
  const 본단면 = []                                            // 🧾 G400 같은 단면 두 번 — 앞 단면들(이름 · 표시 · 벽 점)
  const 긴쪽x = px1 - px0 >= py1 - py0
  for (const d of 단면들) {
    const 글 = d.이름.split('-')[0]
    const 쌍 = 짝.get(글)
    let P, Q, 놓임
    if (쌍 && 쌍.length >= 2) {
      /* 가장 먼 두 글자 — 🧾 G424 단, 단면 폭(가로)의 0.7 ~ 2.5 배 거리인 짝이 있으면 그중 1.25 배에 가장 가까운 짝
           (현장 S 배수장: 평면의 «℄»(C · L 따로 쓴 글) 이 «C» 로 잡혀 C-C 가 구조물 끝에서 끝까지 72 m 가로로 놓였음 — 화살표 C 두 개는 15.9 m 세로) */
      const { a, b } = 자름짝(쌍, d.x1 - d.x0)
      P = [a.x, a.y]; Q = [b.x, b.y]; 놓임 = `평면의 ${글} ─ ${글} 선`
    } else if (d.x1 - d.x0 > 0.6 * Math.max(px1 - px0, py1 - py0)) {
      /* 짝이 없는 긴 단면(종단) — 평면 긴 쪽 가운데 줄 */
      /* 🧾 G400 가운데 줄 = 평면 선들의 길이 가중 가운데값(창 끝의 단면 표시 · 화살표 같은 먼 선에 안 끌리게 — 현장 S 배수장은 줄이 구조물 밖으로 나갔음) */
      const c = 가중가운데(평선, 긴쪽x ? 2 : 1)
      P = 긴쪽x ? [px0, c] : [c, py0]; Q = 긴쪽x ? [px1, c] : [c, py1]; 놓임 = '평면 긴 쪽 가운데 줄(종단)'
    } else { 빠짐.push(`${d.이름}(평면에 ${글} ─ ${글} 자르는 선 없음)`); continue }
    const { out: 자리, L } = 지나는자리(P, Q)
    /* 단면 가로 = 자르는 선 방향. 옮김·방향은 벽 자리 겹침으로 (못 맞추면 가운데끼리) */
    /* 🧾 G400 짝 없는 종단이 평면과 길이가 거의 같으면(10 % 안) 두 끝을 맞춘 자리 둘레(±2 % · 1.5 m 넘게)에서만 벽 겹침을 찾음
         — 펌프 칸막이처럼 같은 간격 벽이 많으면 엉뚱한 자리(현장 S 배수장 2.2 m 어긋남)에서도 «15곳 겹침» 이 나옴 */
    const 가운데 = (L - (d.x1 - d.x0)) / 2
    /* 🧾 G400 종단은 «평면에서 벽을 처음 · 마지막 지나는 자리» 와 «단면 첫 · 끝 세로선» 을 맞춘 둘레(±2 % · 1.5 m 넘게)에서만 벽 겹침을 찾음
         — 펌프 칸막이처럼 같은 간격 벽이 많으면 엉뚱한 자리(현장 S 배수장 2.2 m 어긋남)에서도 «15곳 겹침» 이 나옴 */
    const 끝창 = (ts) => {
      if (!/종단/.test(놓임) || ts.length < 2 || d.세로.length < 2) return null
      const o = Math.min(...ts) - (Math.min(...d.세로) - d.x0), w = Math.max(1500, 0.02 * L)
      return [o - w, o + w]
    }
    const 뒤자리 = 자리.map((t) => L - t)
    const 앞 = 겹침(자리, d.세로.map((x) => x - d.x0), 60, 끝창(자리))
    const 뒤 = 겹침(뒤자리, d.세로.map((x) => x - d.x0), 60, 끝창(뒤자리))
    let 뒤집 = false, 옮 = 가운데, 맞춤 = '가운데끼리'
    if (Math.max(앞.n, 뒤.n) >= 3) {
      if (뒤.n > 앞.n) { 뒤집 = true; 옮 = 뒤.d } else 옮 = 앞.d
      맞춤 = `벽 ${Math.round(Math.max(앞.n, 뒤.n))}곳 겹침`
      /* 🧾 G424 벽 겹침이 앞 · 뒤 거의 같으면(대칭 칸막이) 덮개 구멍 가장자리(단면의 덮개 두께만큼 세로 선)가 평면 선과 맞는 쪽
           (현장 S 배수장 C-C: 배관실 구멍 1.75 · 1.75 · 1.75 · 1.35 — 앞뒤를 바꿔 놓아 1.35 구멍이 평면 2.2 × 1.35 반대 끝에 왔음) */
      if (Math.abs(앞.n - 뒤.n) < 1) {
        const mm = d.기울 === 1 ? 1 : 1000, 틈 = 0.06 * mm
        const 틱x = 열린곳찾기(d.선, d.EL, mm).flatMap((q) => [q.x1, q.x2])
        const 셈 = (표, dd) => 틱x.filter((x) => 표.some((t) => Math.abs(t - (x - d.x0 + dd)) < 틈)).length
        const 앞틱 = 셈(자리, 앞.d), 뒤틱 = 셈(뒤자리, 뒤.d)
        if (뒤틱 > 앞틱) { 뒤집 = true; 옮 = 뒤.d; 맞춤 += ` · 덮개 구멍 가장자리 ${뒤틱}곳 맞음` }
        else if (앞틱 > 뒤틱) { 뒤집 = false; 옮 = 앞.d; 맞춤 += ` · 덮개 구멍 가장자리 ${앞틱}곳 맞음` }
      }
    }
    const ux = (Q[0] - P[0]) / L, uy = (Q[1] - P[1]) / L
    const 자리xy = (x) => { let t = x - d.x0 + 옮; if (뒤집) t = L - t; return [P[0] + ux * t, P[1] + uy * t] }
    const 키 = 머리 + d.표시
    for (const s of d.선) {
      const [ax, ay] = 자리xy(s[1]), [bx, by] = 자리xy(s[3])
      넣기(키, s[0], ax, ay, d.EL(s[2]) * 1000, bx, by, d.EL(s[4]) * 1000, s[5], s[6], s[7])
    }
    /* 📐 G234 높이 점 — 이 단면이 선 자리(평면 자르는 선)에서 벽 면(세로선)마다 «위 · 아래 EL» → BIM 구조물 벽을 그 자리 높이로(구조물면 높이별 벽)
         말뚝 · 기계 · 철근 · 배관 레이어와 아주 짧은 세로선(300 mm 아래)은 뺌 · 같은 자리 세로선은 가장 높은 위 · 가장 낮은 아래 */
    {
      const m = d.기울 === 1 ? 1 : 1000, 칸 = 0.05 * m
      const 모음 = new Map()
      for (const s of d.선) {
        if (Math.abs(s[1] - s[3]) > 0.003 * m || Math.abs(s[2] - s[4]) < 0.8 * m) continue         // 세로 · 0.8 m 넘게(난간 기둥 · 계단 턱은 뺌)
        if (/pile|파일|말뚝|phc|기계|mech|pump|펌프|철근|bar|배관|pipe|전기|elec|hatch|해치|지시|치수|dim|text|글|난간|hand|rail|창호|창|문|door|win/i.test(s[0])) continue
        const k = Math.round(s[1] / 칸)
        const lo = d.EL(Math.min(s[2], s[4])), hi = d.EL(Math.max(s[2], s[4]))
        const o = 모음.get(k)
        const yh = Math.max(s[2], s[4]), yl = Math.min(s[2], s[4])
        if (!o) 모음.set(k, { x: s[1], 위: hi, 아래: lo, 길: hi - lo, y위: yh, y아래: yl })
        else { if (hi > o.위) { o.위 = hi; o.y위 = yh } if (lo < o.아래) { o.아래 = lo; o.y아래 = yl } o.길 += hi - lo }
      }
      /* 🧾 G424 헌치 — 벽 면 세로선 위 끝에서 45° 사선(다리 0.1 ~ 0.65 m)이 위로 이어지면 그 사선 위 끝이 벽 면의 위(덮개 · 슬래브 밑)
           (현장 S 배관실 종단 A1-A1: 벽 면 위 3.72 + 헌치 0.2 = 덮개 밑 3.92 — 바깥 4.22 와 짝지어 덮개 0.5 m 로 읽던 것) */
      for (const o of 모음.values()) {
        const e = 0.003 * m
        for (const t of d.선) {
          if (/pile|파일|말뚝|phc|기계|mech|pump|펌프|철근|bar|배관|pipe|전기|elec|hatch|해치|지시|치수|dim|text|글/i.test(t[0])) continue
          for (const [ax, ay, bx, by] of [[t[1], t[2], t[3], t[4]], [t[3], t[4], t[1], t[2]]]) {
            if (Math.abs(ax - o.x) > e || Math.abs(ay - o.y위) > e) continue
            const dy = by - ay, dx = Math.abs(bx - ax)
            if (dy < 0.1 * m || dy > 0.65 * m || dx < 0.7 * dy || dx > 1.3 * dy) continue
            /* 안쪽 헌치만(사선 위 끝 위 0.15 ~ 0.6 m 에 그 자리를 덮는 가로선 = 덮개 · 슬래브 윗면) — 받침 · 기초 모서리를 깎은 사선(바깥 모서리)은 아님 */
            const 덮임 = d.선.some((u) => Math.abs(u[2] - u[4]) < e && Math.min(u[1], u[3]) <= Math.min(ax, bx) + e && Math.max(u[1], u[3]) >= Math.max(ax, bx) - e && u[2] - by >= 0.15 * m && u[2] - by <= 0.6 * m)
            if (!덮임) continue
            if (d.EL(by) > o.위) { o.위 = d.EL(by); o.헌치 = +(dy / m).toFixed(3) }
          }
          /* 🧾 G424 바닥 헌치 — 벽 면 세로선 아래 끝에서 45° 사선이 아래로(바닥판 윗면까지) 이어지면 그 끝이 바닥판 윗면 · 다리 = 헌치 */
          for (const [ax, ay, bx, by] of [[t[1], t[2], t[3], t[4]], [t[3], t[4], t[1], t[2]]]) {
            if (Math.abs(ax - o.x) > e || Math.abs(ay - o.y아래) > e) continue
            const dy = ay - by, dx = Math.abs(bx - ax)
            if (dy < 0.1 * m || dy > 0.65 * m || dx < 0.7 * dy || dx > 1.3 * dy) continue
            const 받침 = d.선.some((u) => Math.abs(u[2] - u[4]) < e && Math.min(u[1], u[3]) <= Math.min(ax, bx) + e && Math.max(u[1], u[3]) >= Math.max(ax, bx) - e && by - u[2] >= 0.15 * m && by - u[2] <= 1.5 * m)
            if (!받침) continue
            if (d.EL(by) < o.아래) { o.아래 = d.EL(by); o.헌치아래 = +(dy / m).toFixed(3) }
          }
        }
      }
      /* 방향 = 자르는 선 방향(이 점은 자르는 선과 만나는 벽 — 대개 그 선에 직각인 벽) */
      /* 아래 = 그 벽 면 둘레(옆 1 m 안) 구조 선의 가장 낮은 곳(바닥판 아랫면 — 바닥판 옆 세로선은 0.8 m 보다 짧아 위에서 빠짐) · 세로선 아래에서 2 m 안(말뚝 · 기초 말단은 뺌) */
      const 둘레 = 1 * m
      const 낮은 = (o) => {
        let v = o.아래
        for (const s of d.선) {
          if (/pile|파일|말뚝|phc|기계|mech|pump|펌프|철근|bar|배관|pipe|전기|elec|hatch|해치|지시|치수|dim|text|글/i.test(s[0])) continue
          for (const [px, py] of [[s[1], s[2]], [s[3], s[4]]]) {
            if (Math.abs(px - o.x) > 둘레) continue
            const e = d.EL(py)
            if (e < v && e > o.아래 - 2) v = e
          }
        }
        /* 🧾 G424 버림 — 가장 낮은 선 바로 위(0.04 ~ 0.16 m)에 이 자리를 지나는 가로선이 또 있으면 그 아래 띠는 버림 콘크리트(바닥판 아래 깔림)라 바닥판 아랫면은 그 위 선
             (현장 S 배수장 단면 B-B: 바닥판 아랫면 EL −2.646 · 버림 −2.746 — 버림 밑을 바닥판 아래로 읽어 바닥판이 0.1 m 내려앉고 두께는 짐작 600 mm 였음) */
        const 걸 = 0.003 * m
        const 위선 = d.선.find((s) => !/pile|파일|말뚝|phc|기계|mech|pump|펌프|철근|bar|배관|pipe|전기|elec|hatch|해치|지시|치수|dim|text|글/i.test(s[0]) && Math.abs(s[2] - s[4]) < 걸 && Math.min(s[1], s[3]) <= o.x + 걸 && Math.max(s[1], s[3]) >= o.x - 걸 && d.EL(s[2]) - v > 0.04 && d.EL(s[2]) - v < 0.16)
        if (위선) { o.버림 = +(d.EL(위선[2]) - v).toFixed(3); v = d.EL(위선[2]) }
        /* 🧾 G424 바닥판 두께 — 바닥판 위에 선 벽 면(안쪽 면 · 세로선 아래 끝 = 바닥판 윗면)의 아래 끝 − 바닥판 아랫면(0.25 ~ 1.5 m) */
        if (o.아래 - v >= 0.25 && o.아래 - v <= 1.5) o.바닥두께 = +(o.아래 - v).toFixed(3)
        return v
      }
      const 쓸점 = [...모음.values()].filter((o) => o.길 >= 1.5)
      /* 🧾 G400 같은 단면을 두 번 그린 도면(«A1-A1» · «A1-A1 (2)» 모양이 같음) — 벽 자리 맞춤이 둘째 것만 15 m 어긋나 펌프장 벽에 토출수조 높이가 붙었음 → 앞의 것만 씀 */
      const 작 = 쓸점.length ? Math.min(...쓸점.map((o) => o.x)) : 0
      const 내점 = 쓸점.map((o) => [(o.x - 작) / m, o.위])                      // m · EL
      const 같은 = 쓸점.length >= 4 && 본단면.find((e) => e.이름 === d.이름 && e.점.length === 내점.length &&
        내점.filter(([x, v]) => e.점.some(([x2, v2]) => Math.abs(x - x2) <= 0.15 && Math.abs(v - v2) <= 0.1)).length >= 0.8 * 내점.length)
      if (같은) { d.높이점 = []; d.같은단면 = 같은.표시 }
      else {
        if (쓸점.length >= 4) 본단면.push({ 이름: d.이름, 표시: d.표시, 점: 내점 })
        /* 🧾 G424 덮개 열린 곳(단면의 덮개 두께만큼인 세로 선 짝) · 이 단면이 평면을 자르는 줄 → 구조물면이 평면의 닫힌 네모 · 원과 맞대 덮개에서 뺌 */
        d.열린곳 = 열린곳찾기(d.선, d.EL, m).map((q) => ({ a: 자리xy(q.x1), b: 자리xy(q.x2), 밑: q.밑, 위: q.위, 단면: d.표시 }))
        d.중간판 = 중간판찾기(d.선, d.EL, m).map((q) => ({ a: 자리xy(q.x1), b: 자리xy(q.x2), 밑: q.밑, 위: q.위, 헌치: q.헌치, 단면: d.표시 }))   /* 🧾 G424 중간 슬래브 */
        d.자름선 = { a: 자리xy(d.x0), b: 자리xy(d.x1), 단면: d.표시 }
        d.높이점 = 쓸점.map((o) => { const [x, y] = 자리xy(o.x), 아 = 낮은(o); return { x, y, 위: +o.위.toFixed(3), 아래: +아.toFixed(3), 방향: [+ux.toFixed(4), +uy.toFixed(4)], ...(o.바닥두께 ? { 바닥두께: o.바닥두께 } : {}), ...(o.버림 ? { 버림: o.버림 } : {}), ...(o.헌치 ? { 헌치위: o.헌치 } : {}), ...(o.헌치아래 ? { 헌치아래: o.헌치아래 } : {}) } })
        /* 🧾 G400 종단 윤곽 — 짝 없는 긴 단면은 0.25 m 마다 «그 자리 가장 높은 구조 선» (뒤로 보이는 벽 위끝 · 경사 벽 포함) → 구조물면이 단면 점에서 먼 벽의 높이를 이 아래로 */
        if (/종단/.test(놓임)) {
          const 거름 = /pile|파일|말뚝|phc|기계|mech|pump|펌프|철근|bar|배관|pipe|전기|elec|hatch|해치|지시|치수|dim|text|글|난간|hand|rail|중심|cen|cntl|창호|door|win/i
          const 걸음 = 0.25 * m, 표 = []
          const 폭 = d.x1 - d.x0
          const 다선 = d.선.filter((t) => !거름.test(t[0]) && !(Math.abs(t[2] - t[4]) < 0.003 * m && Math.abs(t[3] - t[1]) > 0.5 * 폭))   // 단면 반 넘게 긴 가로선(지반선 · G.L) 은 뺌
          /* 구조 레이어(토목구조물 · 구조 · CONC …)가 넉넉하면 그것만 — «1» · «0» 같은 레이어의 땅 선(구조물 사이 G.L) · 그레이팅 무늬가 윤곽을 올림 */
          const 구조선 = 다선.filter((t) => /구조|콘크리트|conc|wall|벽|토목|str|옹벽|box|박스/i.test(t[0]))
          const 쓸선 = 구조선.length >= 20 && 구조선.length >= 0.3 * 다선.length ? 구조선 : 다선
          for (let x = d.x0; x <= d.x1 + 1e-9; x += 걸음) {
            let 위 = -Infinity, 아래 = Infinity
            for (const t of 쓸선) {
              const a = Math.min(t[1], t[3]), b = Math.max(t[1], t[3])
              if (x < a - 걸음 / 2 || x > b + 걸음 / 2) continue
              const y = b - a < 1e-9 ? Math.max(t[2], t[4]) : t[2] + (t[4] - t[2]) * Math.min(1, Math.max(0, (x - t[1]) / (t[3] - t[1])))
              const y아 = b - a < 1e-9 ? Math.min(t[2], t[4]) : y                    // 🧾 G402 가장 낮은 선(바닥판 아랫면) 도 — 구조물면 이 벽 · 바닥 아래로 씀
              위 = Math.max(위, d.EL(y)); 아래 = Math.min(아래, d.EL(y아))
            }
            /* 🧾 G424 덮개 띠 — 이 자리 맨 위에서 1 m 안의 가로선 높이들(구조물면이 가로 단면의 덮개 밑 · 위 두 높이가 다 있는지 봄 — 둘 다 있으면 덮개 · 없으면 열린 곳)
                 (현장 S 배수장 종단: 펌프장 14.45 m 위에만 4.22 · 3.92 두 선 — 앞의 유입부 · 뒤 토출 쪽까지 덮개가 번지던 것 · 펌프 구멍 둘레 턱 4.37 도 있음) */
            let 가 = null
            if (위 > -Infinity) {
              const e = 0.003 * m
              가 = [...new Set(쓸선.filter((t) => Math.abs(t[2] - t[4]) < e && Math.min(t[1], t[3]) <= x + e && Math.max(t[1], t[3]) >= x - e).map((t) => +d.EL(t[2]).toFixed(3)).filter((v) => v >= 위 - 1))].sort((p, q) => q - p)
            }
            /* 벽 자리 — 0.8 m 넘는 세로 구조선이 이 자리(±걸음 반)에 있음(구조물면이 덮개 띠 빈 곳을 메울 때 벽을 넘지 않게) */
            const 벽 = 위 > -Infinity && 쓸선.some((t) => Math.abs(t[1] - t[3]) < 0.003 * m && Math.abs(t[1] - x) <= 걸음 / 2 && Math.abs(t[2] - t[4]) >= 0.8 * m)
            /* 🧾 G424 구조 레이어 선이 이 자리를 둘 넘게 지나는지(구조물면이 «구조물 사이 빈 곳» 을 찾을 때 — 관 · 기계 선뿐이거나 관 이음 짧은 선 하나뿐인 자리는 빈 곳)
                 (현장 S 펌프장 ~ 토출수조: 관 위 45° 짧은 «구조물» 선 하나 때문에 빈 곳이 3.5 m 로 끊겨 토출수조 바닥이 서쪽으로 1.3 m 더 섰음) */
            const 구 = 구조선.filter((t) => Math.min(t[1], t[3]) <= x + 걸음 / 2 && Math.max(t[1], t[3]) >= x - 걸음 / 2).length >= 2    // 덩어리는 위 · 아래 테두리가 있음 — 짧은 선 하나(관 이음 표시 등)는 구조물 아님
            if (위 > -Infinity) { const [px, py] = 자리xy(x); 표.push({ x: px, y: py, 위: +위.toFixed(3), 아래: +아래.toFixed(3), 가, ...(벽 ? { 벽: true } : {}), ...(구조선.length >= 20 && !구 ? { 구: false } : {}) }) }
          }
          d.윤곽 = 표.length >= 4 ? { u: [+ux.toFixed(4), +uy.toFixed(4)], 점: 표 } : null
        }
      }
    }
    결과단면.push({ 층: 키, 이름: `단면 ${d.표시}`, 놓임, EL: [d.lo, d.hi], 맞춤: `${맞춤} · EL 글자 ${d.맞음}/${d.표수} 맞음${d.같은단면 ? ` · «${d.같은단면}» 과 같은 단면이라 높이는 그것만 씀` : ''}`, 높이점: d.높이점 || [], 윤곽: d.윤곽 || null, 열린곳: d.열린곳 || [], 중간판: d.중간판 || [], 자름선: d.자름선 || null, 자름: 쌍 && 쌍.length >= 2 ? 글 : '' })
  }
  if (결과단면.length < 2) return null
  /* m 로 그린 도면(기울기 1)이면 가로·세로도 mm 로 */
  if (단면들.every((d) => d.기울 === 1)) {
    for (const [, b] of 새) for (let i = 0; i < b.pos.n; i += 3) { b.pos.a[i] *= 1000; b.pos.a[i + 1] *= 1000 }
    for (const d of 결과단면) for (const q of d.높이점 || []) { q.x *= 1000; q.y *= 1000 }
    for (const d of 결과단면) if (d.윤곽) for (const q of d.윤곽.점) { q.x *= 1000; q.y *= 1000 }
    for (const d of 결과단면) { for (const q of [...(d.열린곳 || []), ...(d.중간판 || [])]) for (const p of [q.a, q.b]) { p[0] *= 1000; p[1] *= 1000 } if (d.자름선) for (const p of [d.자름선.a, d.자름선.b]) { p[0] *= 1000; p[1] *= 1000 } }
    for (const c of 평원) { c.x *= 1000; c.y *= 1000; c.r *= 1000 }
    for (const q of 관글) { q.x *= 1000; q.y *= 1000 }
  }
  /* 🧾 G424 계단 — 평면 창 안의 «계단» 글자 자리 · 계단상세도 글의 단 높이(«높이는 0.2m») · 연장 */
  const 계단글 = (raw.texts || []).filter((t) => t.x > PW[0] && t.x < PW[2] && t.y > PW[1] && t.y < PW[3] && /계단/.test(t.s || '')).map((t) => ({ x: t.x * (단면들.every((d) => d.기울 === 1) ? 1000 : 1), y: t.y * (단면들.every((d) => d.기울 === 1) ? 1000 : 1), s: String(t.s).replace(/\s+/g, '') }))
  let 계단말 = null
  for (const t of raw.texts || []) { const m = /높이는\s*([\d.]+)\s*m/.exec(t.s || ''); if (m) { const 연 = /연장은\s*([\d.]+)\s*m/.exec(t.s || ''); 계단말 = { 높이: +m[1], 연장: 연 ? +연[1] : null, 글: String(t.s) }; break } }
  /* 📏 G445 평면에서 끊어 그린 곳(치수 값 ≫ 잰 길이) — 3D 로 놓을 때 그 뒤 조각을 제 길이만큼 띄움(lib/조각맞춤.js) */
  let 끊음 = []
  try { 끊음 = 끊음찾기(raw.dims, PW, 단면들.map((d) => d.W)) } catch (e) { 끊음 = [] }
  return { out: 새, 단면: 결과단면, 평면EL, 빠짐, 제목: 평제.s, 관글, 평원, 계단글, 계단말, 끊음 }
}
