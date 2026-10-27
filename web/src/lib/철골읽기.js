/**
 * 🏗 G425 철골 — 구조평면도의 철골 선 · 이름표(SG1 · SB1 · SC1) · STEEL LIST 규격 · 골조입면도 높이로 철골보 · 철골기둥 · 가새 무게를 셈
 *
 * 소장님: «손으로 잰 것 → 도구가 스스로 재게» — 현장 B 캐노피(2층 평면 철골 · 내역 «철골 가공 조립 1.934 TON»)를 손으로 쟀던 길을 도구로.
 *   (예전: 철골 기호는 철근콘크리트 셈에서 빼고 «철골 무게는 아직 자동으로 안 셉니다» 알림만)
 *
 * ■ 읽기(짐작 안 함 — 도면에 있는 것만 · 다른 것은 ❓)
 *   ① 보: 평면의 철골 층(레이어 이름에 STEEL · STL · 철골) 곧은 선마다, 이름표(철골 목록에 있는 보 기호)가 «가장 가까운 선» 으로 고른 선만 보.
 *      끝이 기둥 자리 · 다른 보 선에서 300 mm 안에 멈췄으면(그리는 버릇 — 기둥 앞 틈) 그 보 선까지 늘여 중심 길이로.
 *   ② 기둥: 기둥 이름표(SC1)를 보 끝점(마디) 1 m 안 가장 가까운 마디로 — 같은 마디는 한 기둥. 그 기호 기둥은 이 평면에서만 셈
 *      (1층 평면 · 확대평면도에 같은 기둥을 또 그렸음).
 *      높이 = 골조입면도의 그 철골보 단면 윗면 − 기둥 밑(입면에서 그 자리 아래 첫 콘크리트 선 · 없으면 아래층 바닥 FL).
 *      입면에서 철골보 단면을 못 찾으면 ❓(셈에서 뺌).
 *   ③ 가새: 이름표 없는 비스듬한 철골 선 — 평면에 «BRACING · 가새 Φ16» 글이 있을 때만 그 규격 · 끝은 가까운 마디(250 mm 안)로.
 *   ④ 퍼린: «PURLIN LC-… @1,000» 글만 있고 선이 없으면 ❓(방향 · 길이가 도면에 없음 — 셈에서 뺌) · 📌 G435 사람이 잰 길이 합(m)을 넣으면 그 길이로 셈.
 *   ⑤ 평면 칸(보 사이)과 입면 칸이 다르면 ❓(현장 B: 마지막 칸 평면 3,358 · 골조입면도-7 3,600) — 셈은 평면 선 그대로.
 * ■ 무게 = KS 단위무게(흙막이.js 강재읽기 — H 형강 KS 표 필렛 · 립 ㄷ형강 · 환봉) × 길이 · 할증은 셈 화면(골조 셈)에서.
 */
import { 강재읽기 } from './흙막이.js'

const 철층 = /(STEEL|STL|철골|강재)/i
const 층글 = (D, ly) => (((D.layers || [])[ly] || {}).name || '')
const 반 = (v) => Math.round(v)
const 쉼 = (v) => Math.round(v).toLocaleString('en-US')

/** 선분 a→b 위에 점 p 를 내린 자리(t 0~1) · 수직 거리 */
function 내림(ax, ay, bx, by, px, py) {
  const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1
  const t = ((px - ax) * dx + (py - ay) * dy) / L2
  const d = Math.abs((px - ax) * dy - (py - ay) * dx) / Math.sqrt(L2)
  return { t, d }
}
/** 두 직선의 만나는 점(평행이면 null) */
function 만남(a, b) {
  const d1x = a.x1 - a.x0, d1y = a.y1 - a.y0, d2x = b.x1 - b.x0, d2y = b.y1 - b.y0
  const den = d1x * d2y - d1y * d2x
  if (Math.abs(den) < 1e-9) return null
  const s = ((b.x0 - a.x0) * d2y - (b.y0 - a.y0) * d2x) / den
  return { x: a.x0 + s * d1x, y: a.y0 + s * d1y }
}
const 길이 = (s) => Math.hypot(s.x1 - s.x0, s.y1 - s.y0)
const 곧은 = (s) => { const L = 길이(s); return Math.abs(s.x1 - s.x0) <= 0.02 * L || Math.abs(s.y1 - s.y0) <= 0.02 * L }
const 가로선 = (s) => Math.abs(s.y1 - s.y0) <= 0.02 * 길이(s)

/** 판 안 철골 선(겹친 것 하나로 — 외부참조로 같은 선이 둘) */
function 철골선들(D, 상) {
  const [x0, y0, x1, y1] = 상
  const 본 = new Set(), out = []
  for (const s of D.찾기(x0, y0, x1, y1)) {
    if (!철층.test(층글(D, D.sly[s]))) continue
    const a = { x0: D.sx0[s], y0: D.sy0[s], x1: D.sx1[s], y1: D.sy1[s] }
    if (길이(a) < 300) continue
    if (Math.min(a.x0, a.x1) < x0 || Math.max(a.x0, a.x1) > x1 || Math.min(a.y0, a.y1) < y0 || Math.max(a.y0, a.y1) > y1) continue
    const k1 = [반(a.x0 / 5), 반(a.y0 / 5), 반(a.x1 / 5), 반(a.y1 / 5)].join(','), k2 = [반(a.x1 / 5), 반(a.y1 / 5), 반(a.x0 / 5), 반(a.y0 / 5)].join(',')
    if (본.has(k1) || 본.has(k2)) continue
    본.add(k1); out.push(a)
  }
  return out
}

/** 입면(골조입면도 · 단면도)의 철골보 단면 — 철골 층 닫힌 선(작은 H 꼴) + 그 밑 · 위 이름표 · 윗면 · 기둥 밑 높이 */
function 입면단면들(D, 보기호들) {
  const 단 = []
  for (const c of D.닫힌 || []) {
    if (c.원 || !(c.n >= 6)) continue
    if (!철층.test(층글(D, c.ly))) continue
    const [x0, y0, x1, y1] = c.b, w = x1 - x0, h = y1 - y0
    if (!(w >= 40 && w <= 800 && h >= 80 && h <= 1300)) continue
    const cx = (x0 + x1) / 2
    /* 이름표 — 단면 위 · 밑 1 m 안 · 가로로 단면 폭 + 1 m 안(가장 가까운 것 — 현장 B 골조입면도-7: 이름이 단면 오른쪽 아래 0.55 m) */
    let best = null
    for (const g of D.글자) {
      if (!보기호들.has(g.u)) continue
      if (Math.abs(g.x - cx) > w / 2 + 1000) continue
      const dy = g.y < y0 ? y0 - g.y : g.y > y1 ? g.y - y1 : 0
      if (dy > 1000) continue
      const d = Math.hypot(g.x - cx, dy)
      if (!best || d < best.d) best = { d, g }
    }
    if (!best) continue
    단.push({ D, c, x0, y0, x1, y1, cx, 기호: best.g.u, 판: D.도곽 && D.도곽.length ? D.도곽번(cx, (y0 + y1) / 2) : -1 })
  }
  return 단
}
/** 입면 판의 높이(1층 바닥 ±0 기준 mm) — «1FL +4,100» 꼴 글 + 그 곁 긴 가로선(레벨선 · 단면 자리 cx 를 지나는 것) ·
 *  글마다 (선 y, 값) 짝의 «값 − y» 가 둘 넘게 같으면(5 mm 안) 그 차이로 · 글 곁에 제 선이 없으면(2·글높이 + 300 넘게 떨어짐) 안 씀 */
function 입면높이(D, 판, 높이글, cx) {
  const 짝 = []
  const 가로 = []
  const 주 = D.주석가로 || []
  for (let i = 0; i + 2 < 주.length; i += 3) if (주[i + 2] - 주[i + 1] >= 3000 && 주[i + 1] - 500 <= cx && cx <= 주[i + 2] + 500) 가로.push({ y: 주[i], x0: 주[i + 1], x1: 주[i + 2] })
  for (const g of D.글자) {
    const h = 높이글(g.s)
    if (!h) continue
    if (!(h.일층기준 || (h.층 === '1' && h.v === 0))) continue
    if (판 >= 0 && D.도곽 && D.도곽.length && D.도곽번(g.x, g.y) !== 판) continue
    let best = null
    for (const L of 가로) {
      if (g.x < L.x0 - 15000 || g.x > L.x1 + 15000) continue
      const d = Math.abs(L.y - g.y)
      if (d > 2 * g.h + 300) continue
      if (!best || d < best.d) best = { d, y: L.y }
    }
    if (best) 짝.push({ y: best.y, v: h.v })
  }
  const 셈 = new Map()
  for (const p of 짝) { const c = p.v - p.y; const k = [...셈.keys()].find((q) => Math.abs(q - c) <= 5); if (k !== undefined) 셈.get(k).add(p.v); else 셈.set(c, new Set([p.v])) }
  let best = null
  for (const [c, vs] of 셈) if (vs.size >= 2 && (!best || vs.size > best.n)) best = { c, n: vs.size }
  if (!best) return null
  return (y) => y + best.c
}
/** 입면 단면 윗면(그 단면 둘레 선 가운데 가장 위 — 플랜지를 딴 선으로 그린 버릇) · 그 밑 첫 선(콘크리트) */
function 단면높이(D, s, 높이) {
  let 위 = s.y1
  for (const k of D.찾기(s.x0 - 30, s.y0 - 30, s.x1 + 30, s.y1 + 60)) {
    for (const y of [D.sy0[k], D.sy1[k]]) {
      const xa = Math.min(D.sx0[k], D.sx1[k]), xb = Math.max(D.sx0[k], D.sx1[k])
      if (xa >= s.x0 - 30 && xb <= s.x1 + 30 && y > 위 && y <= s.y1 + 60) 위 = y
    }
  }
  let 밑 = null
  for (const k of D.찾기(s.cx - 1, s.y0 - 8000, s.cx + 1, s.y0 - 50)) {
    if (철층.test(층글(D, D.sly[k]))) continue
    const ax = D.sx0[k], ay = D.sy0[k], bx = D.sx1[k], by = D.sy1[k]
    if (Math.abs(bx - ax) < 1) continue
    if (s.cx < Math.min(ax, bx) - 1 || s.cx > Math.max(ax, bx) + 1) continue
    const y = ay + (by - ay) * (s.cx - ax) / (bx - ax)
    if (y >= s.y0 - 50 || y < s.y0 - 8000) continue
    if (밑 === null || y > 밑) 밑 = y
  }
  return { 위: 높이(위), 밑: 밑 === null ? null : 높이(밑) }
}

/**
 * @param 도면들 골조읽기 도면(준비한 것 — sx0 … · 글자 · 닫힌 · 찾기 · 주석가로)
 * @param 글목록 [{ D, g, 철: {기호, 종류, 규격}, t: 평면 제목, f: 보 층(골조 셈 층), 아래FL: 기둥 밑 기본 높이(mm) | null }]
 * @param 높이글 골조자동 높이글(«1FL +4,100» 읽기)
 * @param 결정 📌 사람 결정(화면 «바탕셈» 칸 — { '철골|칸|평면|i': {때} } = 그 칸은 입면 칸으로 셈)
 * @returns {{ 줄: [{층, 부재, 기호, 규격, kg, 길이, QT, 근거}], 물음: [{키, 글, kg?}], 기둥기호: Set, 평면: [...] }}
 */
export function 철골읽기(도면들, 글목록, 높이글, 결정 = {}) {
  const 줄 = [], 물음 = [], 기둥기호 = new Set(), 평면 = []
  /* 평면(제목)마다 */
  const 묶 = new Map()
  for (const x of 글목록) { const a = 묶.get(x.t); if (a) a.push(x); else 묶.set(x.t, [x]) }
  const 보기호들 = new Set(글목록.filter((x) => x.철.종류 === '보').map((x) => x.철.기호))
  const 입면들 = []
  for (const D of 도면들) for (const s of 입면단면들(D, 보기호들)) 입면들.push(s)
  for (const [t, 들0] of 묶) {
    /* 같은 자리 같은 기호(외부참조로 겹친 글)는 하나 */
    const 들 = []
    for (const x of 들0) if (!들.some((y) => y.D === x.D && y.철.기호 === x.철.기호 && Math.hypot(y.g.x - x.g.x, y.g.y - x.g.y) < 60)) 들.push(x)
    const 보글 = 들.filter((x) => x.철.종류 === '보'), 기글 = 들.filter((x) => x.철.종류 === '기둥')
    if (!보글.length) continue
    const D = 보글[0].D
    const xs = 들.map((x) => x.g.x), ys = 들.map((x) => x.g.y)
    const 상 = [Math.min(...xs) - 3000, Math.min(...ys) - 3000, Math.max(...xs) + 3000, Math.max(...ys) + 3000]
    const 선 = 철골선들(D, 상)
    const 곧 = 선.filter(곧은), 비 = 선.filter((s) => !곧은(s))
    /* ① 이름표 → 가장 가까운 곧은 선 */
    const 짝 = new Map()        // 선 → {x(글), d}
    for (const x of 보글) {
      let best = null
      for (const s of 곧) {
        const { t: tt, d } = 내림(s.x0, s.y0, s.x1, s.y1, x.g.x, x.g.y)
        if (tt < -0.05 || tt > 1.05 || d > Math.max(1000, 6 * x.g.h)) continue
        if (!best || d < best.d) best = { s, d }
      }
      if (!best) continue
      const 앞 = 짝.get(best.s)
      if (!앞 || best.d < 앞.d) 짝.set(best.s, { x, d: best.d })
    }
    const 보 = [...짝].map(([s, v]) => ({ ...s, 기호: v.x.철.기호, 규격글: v.x.철.규격, f: v.x.f, 그린: 길이(s) }))
    /* 끝 늘이기 — 다른 보 선(평행 아님)의 직선과 만나는 점이 끝에서 300 mm 안이고 그 보 선 안(±300)이면 */
    for (const a of 보) {
      for (const 끝 of [0, 1]) {
        const px = 끝 ? a.x1 : a.x0, py = 끝 ? a.y1 : a.y0
        let best = null
        for (const b of 보) {
          if (b === a) continue
          const ux = (a.x1 - a.x0) / a.그린, uy = (a.y1 - a.y0) / a.그린, Lb = 길이(b), vx = (b.x1 - b.x0) / Lb, vy = (b.y1 - b.y0) / Lb
          if (Math.abs(ux * vx + uy * vy) > 0.2) continue
          const X = 만남(a, b); if (!X) continue
          const d = Math.hypot(X.x - px, X.y - py)
          if (d > 300) continue
          const { t: tb } = 내림(b.x0, b.y0, b.x1, b.y1, X.x, X.y)
          if (tb * Lb < -300 || tb * Lb > Lb + 300) continue
          if (!best || d < best.d) best = { d, X }
        }
        if (best) { if (끝) { a.x1 = best.X.x; a.y1 = best.X.y } else { a.x0 = best.X.x; a.y0 = best.X.y } }
      }
      a.L = 길이(a); a.L0 = a.L
    }
    /* 마디 = 보 끝점(50 mm 안은 하나) */
    const 마디 = []
    const 마디넣기 = (x, y) => { if (!마디.some((p) => Math.hypot(p.x - x, p.y - y) < 50)) 마디.push({ x, y }) }
    for (const a of 보) { 마디넣기(a.x0, a.y0); 마디넣기(a.x1, a.y1) }
    const 제목 = t.g ? t.g.s : '(제목 없는 평면)'
    const 판P = { 제목, 보: 보.length, 기둥: 0, 가새: 0 }
    const 판줄 = [], 판물 = [], 퍼린줄 = []      // 퍼린줄 — 평면 겹침(같은 철골 두 번) 견줌에서 뺌(사람이 넣은 길이)
    /* 이름 없는 곧은 철골 선 */
    const 남곧 = 곧.filter((s) => !짝.has(s) && 길이(s) >= 1000)
    /* ③ 가새 — 비스듬한 선 · 평면의 BRACING 글 */
    const 글들 = D.글자.filter((g) => g.x >= 상[0] - 5000 && g.x <= 상[2] + 5000 && g.y >= 상[1] - 5000 && g.y <= 상[3] + 5000)
    const 가새글 = 글들.find((g) => /BRAC|브레이싱|가새/i.test(g.s) && 강재읽기(g.s))
    const 퍼린글 = 글들.find((g) => /PURLIN|퍼린|중도리/i.test(g.s) && 강재읽기(g.s))
    const 가새 = []
    if (비.length && 가새글) {
      const 규 = 강재읽기(가새글.s)
      for (const s0 of 비) {
        const s = { ...s0 }
        for (const 끝 of [0, 1]) {
          const px = 끝 ? s.x1 : s.x0, py = 끝 ? s.y1 : s.y0
          let best = null
          for (const p of 마디) { const d = Math.hypot(p.x - px, p.y - py); if (d <= 250 && (!best || d < best.d)) best = { d, p } }
          if (best) { if (끝) { s.x1 = best.p.x; s.y1 = best.p.y } else { s.x0 = best.p.x; s.y0 = best.p.y } }
        }
        가새.push({ ...s, L: 길이(s), L0: 길이(s), 규 })
      }
    } else if (비.length) 판물.push({ 키: '철골|가새|' + 제목, 글: `${제목} 비스듬한 철골 선 ${비.length}개 — 규격 글(BRACING · 가새)이 없어 셈에서 뺐습니다` })
    if (남곧.length) 판물.push({ 키: '철골|이름없음|' + 제목, 글: `${제목} 이름표 없는 철골 선 ${남곧.length}개(${쉼(남곧.reduce((n, s) => n + 길이(s), 0))} mm) — 어느 부재인지 도면에 없어 셈에서 뺐습니다` })
    if (퍼린글) {
      /* 📌 G435 퍼린 — 선이 없어 ❓ · 사람이 도면(지붕 · 입면)을 보고 잰 길이 합(m)을 넣으면 그 길이 × 단위무게로 셈(같은 기억 칸 · 되돌릴 수 있음) */
      const 규 = 강재읽기(퍼린글.s), 키 = '철골|퍼린|' + 제목
      const 값 = 결정 && 결정[키] && +결정[키].값 > 0 ? +결정[키].값 : 0
      const 간 = (/@\s*([\d,]+)/.exec(퍼린글.s) || [])[1]
      if (값) {
        퍼린줄.push({ 층: 보글[0].f, 부재: '퍼린', 기호: 규.규격, 규격: 규.규격, kg: 규.kg, 길이: 반(값 * 1000), QT: 1, 근거: `${제목} «${퍼린글.s.trim()}» · 📌 사람이 잰 길이 합 ${값} m` })
        판P.퍼린 = 값
      }
      판물.push({ 키, 셈: !!값, 값: 값 || null, 단위: 'm', 규격: 규.규격, kg: 규.kg, 간격: 간 ? +간.replace(/,/g, '') : null,
        글: `${제목} «${퍼린글.s.trim()}» — 퍼린 선이 평면에 없어(방향 · 길이 없음) ` + (값 ? `📌 사람이 잰 길이 합 ${값} m × ${규.kg} kg/m 로 셈` : `셈에서 뺐습니다 · ${규.규격} ${규.kg} kg/m — 길이 합(m)을 넣으면 셈`) })
    }
    /* ⑤ 입면과 맞추기 — 같은 방향 보(나란한 것)를 그 직각 자리로 줄 세운 이름 차례 = 입면 단면 이름 차례(같은 판 · 같은 높이 줄) */
    const 줄세움 = (가) => {
      const 들2 = 보.filter((a) => 가로선(a) === 가)
      const 자 = new Map()
      for (const a of 들2) { const v = 가 ? (a.y0 + a.y1) / 2 : (a.x0 + a.x1) / 2; const k = [...자.keys()].find((q) => Math.abs(q - v) < 50); if (k !== undefined) 자.get(k).push(a); else 자.set(v, [a]) }
      return [...자].sort((p, q) => p[0] - q[0]).map(([v, a]) => ({ v, 기호: a[0].기호, 보: a }))
    }
    let 맞 = null
    for (const 가 of [true, false]) {
      const P = 줄세움(가)
      if (P.length < 2) continue
      const 이름 = P.map((p) => p.기호).join(',')
      /* 입면 줄 — 같은 D · 같은 판 · 윗면(y1)이 50 mm 안 */
      const 무리 = new Map()
      for (const s of 입면들) { const k = s.D.번 + '|' + s.판 + '|' + Math.round(s.y1 / 100); const a = 무리.get(k); if (a) a.push(s); else 무리.set(k, [s]) }
      for (const a of 무리.values()) {
        if (a.length !== P.length) continue
        a.sort((p, q) => p.cx - q.cx)
        for (const 거꾸 of [false, true]) {
          const E = 거꾸 ? a.slice().reverse() : a
          if (E.map((s) => s.기호).join(',') !== 이름) continue
          const 높이 = 입면높이(E[0].D, E[0].판, 높이글, E[0].cx)
          if (!높이) continue
          맞 = { 가, P, E, 높이 }
          break
        }
        if (맞) break
      }
      if (맞) break
    }
    let 입면이름 = ''
    if (맞) {
      const { P, E, 높이 } = 맞
      /* 입면 이름 — 단면 무리 곁(25 m 안) «…입면도 · 단면도 · ELEVATION · SECTION» 글(가장 가까운 것) · 없으면 판 이름 · 파일 이름 */
      {
        const D2 = E[0].D, mx = (E[0].cx + E[E.length - 1].cx) / 2, my = E[0].y0
        let best = null
        for (const g of D2.글자) { if (!/입면도|단면도|ELEVATION|SECTION/i.test(g.s) || g.s.length > 30) continue; const d = Math.hypot(g.x - mx, g.y - my); if (d < 25000 && (!best || d < best.d)) best = { d, s: g.s.trim() } }
        입면이름 = (best && best.s) || (D2.판제목 && E[0].판 >= 0 ? D2.판제목[E[0].판] : '') || D2.이름 || '골조입면도'
      }
      P.forEach((p, i) => { p.단 = 단면높이(E[i].D, E[i], 높이); p.ex = E[i].cx })
      for (let i = 1; i < P.length; i++) {
        const 평 = Math.abs(P[i].v - P[i - 1].v), 입 = Math.abs(E[i].cx - E[i - 1].cx)
        if (!(Math.abs(평 - 입) > Math.max(30, 0.01 * 입))) continue
        const 키 = '철골|칸|' + 제목 + '|' + i, 셈 = !!(결정 && 결정[키])
        const 머리 = `${제목} ${P[i - 1].기호} ~ ${P[i].기호} 칸 — 평면 ${쉼(평)} · ${입면이름} ${쉼(입)}(${쉼(입 - 평)} 다름)`
        판물.push({ 키, 셈, 평, 입, 글: 머리 + (셈 ? ` — 📌 입면 칸 ${쉼(입)} 으로 셈(사람 결정)` : ' — 셈은 평면 선 그대로') })
        if (!셈) continue
        /* 📌 그 칸을 가로지르는 보(이 줄과 직각 · 두 끝이 그 칸 두 줄) · 가새(두 끝이 그 두 줄)만 입면 칸 길이로 */
        const a0 = Math.min(P[i - 1].v, P[i].v), a1 = Math.max(P[i - 1].v, P[i].v), Δ = 입 - 평
        const 자 = (x, y) => (맞.가 ? y : x)
        for (const b of 보) {
          if (가로선(b) === 맞.가) continue
          const u0 = Math.min(자(b.x0, b.y0), 자(b.x1, b.y1)), u1 = Math.max(자(b.x0, b.y0), 자(b.x1, b.y1))
          if (Math.abs(u0 - a0) <= 50 && Math.abs(u1 - a1) <= 50) { b.L += Δ; b.결정 = 입 }
        }
        for (const g2 of 가새) {
          const u0 = 자(g2.x0, g2.y0), u1 = 자(g2.x1, g2.y1)
          if (Math.abs(Math.min(u0, u1) - a0) <= 50 && Math.abs(Math.max(u0, u1) - a1) <= 50) {
            const 옆 = 맞.가 ? Math.abs(g2.x1 - g2.x0) : Math.abs(g2.y1 - g2.y0)
            g2.L = Math.hypot(옆, Math.abs(u1 - u0) + Δ); g2.결정 = 입
          }
        }
      }
    }
    /* ② 기둥 — 이름표 → 가장 가까운 마디(1 m 안) */
    const 기둥 = new Map()
    for (const x of 기글) {
      let best = null
      for (const p of 마디) { const d = Math.hypot(p.x - x.g.x, p.y - x.g.y); if (d <= 1000 && (!best || d < best.d)) best = { d, p } }
      if (!best) continue
      if (!기둥.has(best.p)) 기둥.set(best.p, x)
    }
    for (const [p, x] of 기둥) {
      기둥기호.add(x.철.기호)
      const 규 = 강재읽기(x.철.규격)
      if (!규) { 판물.push({ 키: '철골|규격|' + x.철.기호, 글: `철골 기둥 ${x.철.기호} 규격 «${x.철.규격}» 을 몰라 셈에서 뺐습니다` }); continue }
      /* 이 마디를 지나는 줄(입면과 맞춘 보 줄) */
      let 위 = null, 밑 = null, 근 = ''
      if (맞) {
        const q = 맞.P.find((pp) => Math.abs((맞.가 ? p.y : p.x) - pp.v) < 50)
        if (q && q.단) { 위 = q.단.위; 밑 = q.단.밑; 근 = `${입면이름} ${q.기호} 윗면 ${q.단.위 >= 0 ? '+' : '−'}${쉼(Math.abs(q.단.위))}` }
      }
      if (위 === null) { 판물.push({ 키: '철골|기둥높이|' + 제목 + '|' + 반(p.x) + ',' + 반(p.y), 글: `${제목} 철골 기둥 ${x.철.기호} — 위 철골보 높이(입면 · 단면)가 도면에 없어 셈에서 뺐습니다` }); continue }
      let 밑글
      if (밑 !== null) 밑글 = `밑 콘크리트 ${밑 >= 0 ? '+' : '−'}${쉼(Math.abs(밑))}`
      else if (x.아래FL !== null && x.아래FL !== undefined) { 밑 = x.아래FL; 밑글 = `밑 아래층 바닥 ${밑 >= 0 ? '+' : '−'}${쉼(Math.abs(밑))}` }
      else { 판물.push({ 키: '철골|기둥밑|' + 제목 + '|' + 반(p.x) + ',' + 반(p.y), 글: `${제목} 철골 기둥 ${x.철.기호} — 기둥 밑 높이가 도면에 없어 셈에서 뺐습니다` }); continue }
      const L = 위 - 밑
      if (!(L > 100)) continue
      판줄.push({ 층: x.f, 부재: '철골기둥', 기호: x.철.기호, 규격: 규.규격, kg: 규.kg, 길이: 반(L), QT: 1, 근거: `${근} − ${밑글} = ${쉼(L)}` })
      판P.기둥++
    }
    for (const a of 보) {
      const 규 = 강재읽기(a.규격글)
      if (!규) { 판물.push({ 키: '철골|규격|' + a.기호, 글: `철골 보 ${a.기호} 규격 «${a.규격글}» 을 몰라 셈에서 뺐습니다` }); continue }
      판줄.push({ 층: a.f, 부재: '철골보', 기호: a.기호, 규격: 규.규격, kg: 규.kg, 길이: 반(a.L), 원: 반(a.L0), QT: 1, 근거: `${제목} 선 ${쉼(a.그린)}${a.결정 ? ' → 📌 입면 칸 ' + 쉼(a.결정) + ' 으로 ' + 쉼(a.L) : Math.abs(a.L - a.그린) > 1 ? ' → 마디까지 ' + 쉼(a.L) : ''}` })
    }
    for (const s of 가새) {
      판줄.push({ 층: 보글[0].f, 부재: '가새', 기호: s.규.규격, 규격: s.규.규격, kg: s.규.kg, 길이: 반(s.L), 원: 반(s.L0), QT: 1, 근거: `${제목} 비스듬한 선 · «${가새글.s.trim()}»${s.결정 ? ' · 📌 입면 칸 ' + 쉼(s.결정) : ''}` })
      판P.가새++
    }
    평면.push({ ...판P, 층: 보글[0].f, 확대: /확대/.test(제목), 줄: 판줄, 물음: 판물, 퍼린줄 })
  }
  /* 같은 층 평면 둘에 같은 철골을 또 그렸으면(구조평면도 + 확대평면도) 한 번만 — 부재 · 기호 · 길이 모음이 다른 평면 것 안에 다 들면 뺌(확대평면도 · 적은 쪽 먼저 뺌) */
  const 모음 = (P) => { const m = new Map(); for (const r of P.줄) { const k = r.부재 + '|' + r.기호 + '|' + (r.원 ?? r.길이); m.set(k, (m.get(k) || 0) + 1) } return m }
  const 차례 = 평면.slice().sort((p, q) => (p.확대 ? 1 : 0) - (q.확대 ? 1 : 0) || q.줄.length - p.줄.length)
  const 쓴 = []
  for (const P of 차례) {
    const m = 모음(P)
    const 안 = 쓴.find((A) => A.층 === P.층 && [...m].every(([k, n]) => (A.m.get(k) || 0) >= n))
    if (안 && m.size) { P.같음 = 안.P.제목; continue }
    쓴.push({ P, m, 층: P.층 })
    줄.push(...P.줄, ...P.퍼린줄); 물음.push(...P.물음)
  }
  for (const P of 평면) { delete P.줄; delete P.물음; delete P.퍼린줄 }
  for (const r of 줄) delete r.원
  /* 같은 부재 · 기호 · 규격 · 길이 · 근거는 한 줄(QT) */
  const 모 = new Map()
  for (const r of 줄) { const k = [r.층, r.부재, r.기호, r.규격, r.길이, r.근거].join('|'); const a = 모.get(k); if (a) a.QT++; else 모.set(k, { ...r }) }
  return { 줄: [...모.values()], 물음, 기둥기호, 평면 }
}
