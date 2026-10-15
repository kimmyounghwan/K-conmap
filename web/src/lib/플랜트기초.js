/**
 * 🏭 플랜트식 토목 기초 도면 — 바닥판 · 기초 · 지중보를 «그린 윤곽 그대로» 셈 (🏭 G294 — 2026-10-15)
 *
 * 소장님 「기초 · 바닥판 · 벽 · 기둥을 한꺼번에 읽게 만들기 (가장 큰 일, 내역 가까이) — 해줘」
 *
 * ■ 어떤 도면: 공장 부지 건물의 «FL±0 아래 구조체(토목)» 통합 도면 — 판 이름이 FOUNDATION PLAN (FL±0.000) · FOOTING PLAN · BEAM PLAN 인 판이
 *   한 파일에 다 있고, 바닥판(층 «신설구조물» 같은 것) · 기초 · 지중보가 실제 크기 윤곽선으로, 높이는 지시선 달린 레벨 글자(−1650 · ±0.000)로 적힘.
 *   (실제 현장 5 — 기초 77 · 지중보 127 칸 · 바닥판 60 칸)
 * ■ 예전(골조자동 G248): 바닥판을 «레벨 글자 씨 → 둘레 보 · 벽까지 네모 칸» 으로 잡아, 건물 밖 레벨 글자(바깥 땅 FL±0 · −650)에서도 칸이 생겼고
 *   (건물 왼쪽 6 m 띠 · 오른쪽 위 빈 곳) 안쪽 칸 몇은 못 잡았음. 기초 기호(오각형)가 기초 밖 2 ~ 3 m 에 있어 아래 · 위 줄 기초가 기호 자리에 섰음.
 *   지중보 춤은 일람 단면의 «슬래브 밑 700» 을 보 춤으로 읽어 300 이 모자랐음(B7 계열).
 * ■ 이제: 세 판의 윤곽선으로 닫힌 면을 찾아(lib/면찾기.js) —
 *   바닥판 = 면마다 넓이 × 바닥 두께(«FLOOR TYPICAL SECTION» — 골조자동이 읽은 T300 칸) · 윗면 = 그 면의 레벨 글자(없으면 맞댄 면)
 *   기초 = 윤곽 넓이 × (그 자리 바닥판 밑 − 기초 바닥 레벨) · 지중보 = 두 선 사이 띠(기초 사이 안목) × 폭 × (바닥판 밑 − 보 바닥 레벨)
 *   바닥판 높이가 바뀌는 곳(보가 없는 금) = 단 차이 벽(길이 × 높이 차 × 두께 · 거푸집 한 면)
 *   철근은 골조자동이 읽은 배근(기초 상세 · 보 일람 단면 · 바닥 단면)을 그대로 씀 — 바닥판은 m²당 철근(간격 → 1,000/간격 m).
 * ■ 세 판이 다 없거나, 바닥 두께 · 판 사이 옮김을 못 찾으면 아무것도 안 바꿈(예전 그대로).
 * ■ 일점쇄선 · 숨은선(상세 경계 팔각형 · 숨은 기초선)은 윤곽에서 뺌(골조도면 E.lt → 준비 slt).
 */
import { 도면준비 } from './골조자동.js'
import { 모델만들기, 겹친것빼기 } from './BIM모델.js'
import { 면과테두리, 부호넓이, 둘레, 상자, 안인가, 면안, 안점, 가운데, 토막거리, 경계거리 } from './면찾기.js'

const 붙 = (s) => String(s ?? '').replace(/\s+/g, '').toUpperCase()
const 수 = (v, d = NaN) => { const n = typeof v === 'number' ? v : parseFloat(String(v ?? '').replace(/,/g, '')); return Number.isFinite(n) ? n : d }
const 반 = (v) => Math.round(v)
const 제목 = { 바닥: /^FOUNDATIONPLAN/, 기초: /^FOOTINGPLAN$/, 보: /^BEAMPLAN$/ }
const F기호 = /^F\d{1,3}[A-Z]?$/
const B기호 = /^(?:FT)?B\d{1,3}[A-Z]?$/

/** 레벨 글자 → mm(FL 기준) · 아니면 null — «−1650» «±0.000» «%%P0.000» «FL−650» «+1412» (도면 번호 «−00021» 은 아님) */
export function 레벨값(s) {
  let t = 붙(s).replace(/%%P/g, '±').replace(/[−–]/g, '-')
  t = t.replace(/^(?:FL|EL\.?|LV\.?)/, '')
  if (/^[±]0(?:\.0+)?$/.test(t) || /^0\.0+$/.test(t)) return 0
  const m = /^([+-]?)(0|[1-9]\d{0,4})(?:\.0+)?$/.exec(t)
  if (!m) return null
  if (!m[1] && m[2] !== '0') return null            // 부호 없는 숫자(치수 «2600»)는 레벨로 안 봄
  return (m[1] === '-' ? -1 : 1) * +m[2]
}

/** m²당 철근 — 「HD19@200」 칸들 → 「D19:20」 (한 칸 = 1,000/간격 m) */
export function 간격으로단위(칸들) {
  const 합 = new Map()
  for (const c of 칸들) {
    const m = /D\s*(\d{2})\s*@\s*(\d{2,4})/i.exec(String(c || ''))
    if (!m) continue
    const d = 'D' + m[1], s = +m[2]
    if (!(s > 0)) continue
    합.set(d, (합.get(d) || 0) + 1000 / s)
  }
  return [...합].map(([d, v]) => d + ':' + (Math.round(v * 1000) / 1000)).join(' ')
}

/* ── 판 안의 토막 · 글 ─────────────────────────────────────────────── */
function 판안토막(D, r, 층조건) {
  const out = new Map()          // 층 → [[x0,y0,x1,y1]…]
  const [x0, y0, x1, y1] = r
  const 안 = (x, y) => x >= x0 && x <= x1 && y >= y0 && y <= y1
  for (let s = 0; s < D.sx0.length; s++) {
    if (D.slt && D.slt[s] === 1) continue          // 도형에 따로 준 끊어진 선(상세 경계 · 숨은선)만 뺌 — 층 꼴이 숨은선인 기초 · 보 층은 씀
    if (!안(D.sx0[s], D.sy0[s]) || !안(D.sx1[s], D.sy1[s])) continue
    const ly = D.sly[s]
    if (층조건 && !층조건(ly)) continue
    let a = out.get(ly); if (!a) { a = []; out.set(ly, a) }
    a.push([D.sx0[s], D.sy0[s], D.sx1[s], D.sy1[s]])
  }
  return out
}
function 판안글(D, r) {
  const [x0, y0, x1, y1] = r
  return (D.글자 || []).filter((g) => g.x >= x0 && g.x <= x1 && g.y >= y0 && g.y <= y1)
}
/** 레벨 글자 + 지시선 끝(짧은 꺾임 가운데) — 지시선 = 같은 층 · 같은 도형의 꺾인 선(2 토막 넘게) 중 긴 토막이 글자 곁(글자 높이 1.5배 안) */
function 레벨들(D, r) {
  const 글들 = 판안글(D, r).map((g) => ({ g, v: 레벨값(g.s) })).filter((x) => x.v !== null)
  if (!글들.length) return []
  const 층들 = new Set(글들.map((x) => x.g.ly))
  const 도형 = new Map()
  const [x0, y0, x1, y1] = r
  for (let s = 0; s < D.sx0.length; s++) {
    if (!층들.has(D.sly[s])) continue
    if (D.sx0[s] < x0 || D.sx0[s] > x1 || D.sy0[s] < y0 || D.sy0[s] > y1) continue
    const e = D.se[s]
    let a = 도형.get(e); if (!a) { a = []; 도형.set(e, a) }
    a.push(s)
  }
  const 선들 = []
  for (const [, ss] of 도형) {
    if (ss.length < 2 || ss.length > 4) continue
    const L = ss.map((s) => Math.hypot(D.sx1[s] - D.sx0[s], D.sy1[s] - D.sy0[s]))
    const 합 = L.reduce((t, v) => t + v, 0)
    if (합 > 8000) continue
    const k = L.indexOf(Math.max(...L)), j = L.indexOf(Math.min(...L))
    if (k === j || L[j] > L[k] * 0.5) continue
    const sj = ss[j], sk = ss[k]
    선들.push({ ax: D.sx0[sk], ay: D.sy0[sk], bx: D.sx1[sk], by: D.sy1[sk], ly: D.sly[sk], 끝: [(D.sx0[sj] + D.sx1[sj]) / 2, (D.sy0[sj] + D.sy1[sj]) / 2] })
  }
  return 글들.map(({ g, v }) => {
    let best = null
    for (const l of 선들) {
      if (l.ly !== g.ly) continue
      const d = 토막거리(g.x, g.y, l.ax, l.ay, l.bx, l.by)
      if (d <= g.h * 1.5 + 50 && (!best || d < best.d)) best = { d, l }
    }
    return { v, g, 점: best ? best.l.끝 : [g.x, g.y], 지시: !!best }
  })
}

/* ── 면 · 띠 도움 ─────────────────────────────────────────────────── */
/** 면의 방향 · 폭 · 길이(가장 긴 변 방향으로 잰 상자) */
function 띠재기(r) {
  let bi = 0, bl = -1
  for (let i = 0; i < r.length; i++) { const a = r[i], b = r[(i + 1) % r.length]; const l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l > bl) { bl = l; bi = i } }
  const a = r[bi], b = r[(bi + 1) % r.length]
  const ux = (b[0] - a[0]) / bl, uy = (b[1] - a[1]) / bl
  let s0 = Infinity, s1 = -Infinity, t0 = Infinity, t1 = -Infinity
  for (const p of r) { const s = p[0] * ux + p[1] * uy, t = -p[0] * uy + p[1] * ux; s0 = Math.min(s0, s); s1 = Math.max(s1, s); t0 = Math.min(t0, t); t1 = Math.max(t1, t) }
  const L = s1 - s0, w = t1 - t0
  const sm = (s0 + s1) / 2, tm = (t0 + t1) / 2
  const cx = sm * ux - tm * uy, cy = sm * uy + tm * ux
  return { ux, uy, L, w, cx, cy, 축: [cx - ux * L / 2, cy - uy * L / 2, cx + ux * L / 2, cy + uy * L / 2] }
}
/** 고리 정리 — 같은 줄 위 점 · 겹친 점 뺌 */
function 다듬기(r, tol = 1) {
  const out = []
  for (let i = 0; i < r.length; i++) {
    const a = out.length ? out[out.length - 1] : r[(i - 1 + r.length) % r.length], p = r[i], b = r[(i + 1) % r.length]
    if (Math.hypot(p[0] - a[0], p[1] - a[1]) < tol) continue
    const cr = (p[0] - a[0]) * (b[1] - p[1]) - (p[1] - a[1]) * (b[0] - p[0])
    if (Math.abs(cr) <= tol * Math.hypot(b[0] - a[0], b[1] - a[1])) continue
    out.push(p)
  }
  return out.length >= 3 ? out : r
}
const 네모인가 = (r) => r.length === 4 && r.every((p, i) => { const q = r[(i + 1) % 4]; return Math.abs(p[0] - q[0]) < 2 || Math.abs(p[1] - q[1]) < 2 })
/** 무리 바깥 고리 가운데 다른 고리 안에 든 것은 뺌(기초 안 피트 금) */
function 맨바깥(바깥들) {
  return 바깥들.filter((h) => !바깥들.some((g) => g !== h && g.넓이 > h.넓이 && 안인가(안점(h.점), g.점)))
}
/** 판 사이 옮김 — 두 판의 기초 윤곽(넓이 5 % 안) 가운데 차이를 10 mm 칸으로 투표 */
function 옮김찾기(A, B) {
  const 표 = new Map()
  for (const a of A) for (const b of B) {
    if (Math.abs(a.넓이 - b.넓이) > 0.05 * Math.max(a.넓이, b.넓이)) continue
    const ca = 가운데(a.점), cb = 가운데(b.점)
    const k = Math.round((cb[0] - ca[0]) / 10) + ',' + Math.round((cb[1] - ca[1]) / 10)
    표.set(k, (표.get(k) || 0) + 1)
  }
  let best = null
  for (const [k, n] of 표) if (!best || n > best.n) best = { k, n }
  if (!best || best.n < Math.max(4, 0.25 * Math.min(A.length, B.length))) return null
  const [x, y] = best.k.split(',').map((v) => +v * 10)
  return { x, y, n: best.n }
}
const 옮기기 = (r, o) => r.map((p) => [p[0] + o.x, p[1] + o.y])
const 기호다듬 = (s) => 붙(s).replace(/[()]/g, '')
/* 층 이름으로 먼저 고름(있으면) — 없으면 점수로 */
const 층말 = {
  기초: /FOOT|FTG|FDN|FOUND|기초/i,
  바닥: /구조물|구조|CONC|SLAB|STRU|콘크리트|슬래브|슬라브|바닥/i,
  보: /BEAM|GIRDER|보$|지중보|^보|GB|FB/i,
}
const 안쓸층 = /CENTER|GRID|CEN\b|통심|중심|DIM|치수|TEXT|글|NO$|-NO|LEVEL|HATCH|해치|철근|REBAR|단열|버림|점선|HIDDEN/i
/**
 * 보 띠의 열린 끝 닫기 — 보 판에서 보 밑 기초를 숨은선으로 그려(빠짐) 두 나란한 선이 기초 자리에서 그냥 끝난 곳(현장 6 아래 줄 B2A · B5)
 * 끝이 아무 선에도 안 닿은(2 mm) 두 끝점이 서로 마주 보면(두 선이 나란 · 같은 쪽으로 뻗음 · 사이 = 폭 150 ~ 1,500 · 선에 직각) 그 사이를 이음
 * @returns 더할 토막 [[x0,y0,x1,y1]…]
 */
export function 띠끝닫기(ss, 다른 = []) {
  const 다 = ss.concat(다른)
  const 칸 = 2000, 통 = new Map()
  const 넣 = (k, i) => { let a = 통.get(k); if (!a) { a = []; 통.set(k, a) } a.push(i) }
  다.forEach((t, i) => {
    const gx0 = Math.floor(Math.min(t[0], t[2]) / 칸), gx1 = Math.floor(Math.max(t[0], t[2]) / 칸)
    const gy0 = Math.floor(Math.min(t[1], t[3]) / 칸), gy1 = Math.floor(Math.max(t[1], t[3]) / 칸)
    if ((gx1 - gx0 + 1) * (gy1 - gy0 + 1) > 400) { 넣('긴', i); return }
    for (let gx = gx0; gx <= gx1; gx++) for (let gy = gy0; gy <= gy1; gy++) 넣(gx + ',' + gy, i)
  })
  const 곁 = (x, y) => [...(통.get(Math.floor(x / 칸) + ',' + Math.floor(y / 칸)) || []), ...(통.get('긴') || [])]
  const 끝들 = []
  ss.forEach((t, i) => {
    for (const e of [0, 1]) {
      const x = e ? t[2] : t[0], y = e ? t[3] : t[1], ox = e ? t[0] : t[2], oy = e ? t[1] : t[3]
      const L = Math.hypot(ox - x, oy - y); if (L < 100) continue
      if (곁(x, y).some((j) => j !== i && 토막거리(x, y, ...다[j]) <= 2)) continue
      끝들.push({ x, y, ux: (ox - x) / L, uy: (oy - y) / L, i })
    }
  })
  const 더 = [], 쓴 = new Set()
  for (let a = 0; a < 끝들.length; a++) {
    if (쓴.has(a)) continue
    const A = 끝들[a]
    let 고른 = -1, 가까 = Infinity
    for (let b = 0; b < 끝들.length; b++) {
      if (b === a || 쓴.has(b)) continue
      const B = 끝들[b]
      if (A.ux * B.ux + A.uy * B.uy < 0.995) continue            // 나란 · 같은 쪽으로 뻗음
      const dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy)
      if (d < 150 || d > 1500) continue
      if (Math.abs((dx * A.ux + dy * A.uy) / d) > 0.02) continue  // 선에 직각
      if (d < 가까) { 가까 = d; 고른 = b }
    }
    if (고른 >= 0) { 쓴.add(a); 쓴.add(고른); 더.push([A.x, A.y, 끝들[고른].x, 끝들[고른].y]) }
  }
  return 더
}
/** 격자처럼 긴 선(20 m 넘는 토막)이 길이의 60 % 넘는 층 */
function 긴선층(ss) { let 합 = 0, 긴 = 0; for (const s of ss) { const L = Math.hypot(s[2] - s[0], s[3] - s[1]); 합 += L; if (L >= 20000) 긴 += L } return 합 > 0 && 긴 / 합 > 0.6 }
/** 글자 틀(기호 오각형 · 원 — 글자를 품은 작은 고리, 곧은 변만이 아님) */
function 글틀인가(h, 글들) {
  if (h.넓이 > 6e6) return false
  const r = h.점
  const 곧 = r.every((p, i) => { const q = r[(i + 1) % r.length]; return Math.abs(p[0] - q[0]) < 2 || Math.abs(p[1] - q[1]) < 2 })
  if (곧) return false
  return 글들.some((g) => 안인가([g.x, g.y], r))
}

/**
 * 골조읽기 결과(R)를 플랜트식 기초 도면이면 윤곽 그대로 다시 셈. 아니면 R 그대로.
 * @param 들 골조읽기에 넣은 도면들 [{모델, 이름, k}]
 * @returns R(바뀌었으면 새 객체 · R.플랜트 = 3D 부재 · 요약)
 */
export function 플랜트다듬기(들, R) {
  if (!R || !R.있음 || !R.공사 || !R.공사.동 || !R.공사.동.length) return R
  const 공 = R.공사
  const 배 = 공.배근 || {}
  /* 바닥 두께 — 골조자동이 바닥 일반 단면(FLOOR TYPICAL SECTION)으로 만든 «T300(…)» 칸 */
  const 바닥형 = (배.슬라브 || []).filter((s) => /^T\d+\(/.test(String(s.기호 || '')) && 수(s.두께) > 0 && s._흙)
  if (!바닥형.length) return R
  const 두께들 = [...new Set(바닥형.map((s) => 수(s.두께)))]
  if (두께들.length !== 1) return R
  const t = 두께들[0]
  for (let 번 = 0; 번 < 들.length; 번++) {
    let 결과 = null
    try { 결과 = 한도면(들, 번, R, t) } catch (e) { 결과 = { 실패: '플랜트 기초 읽기 멈춤: ' + e.message } }
    if (결과 && 결과.R) return 결과.R
    if (결과 && 결과.실패) R = { ...R, 경고: [...(R.경고 || []), '🏭 ' + 결과.실패] }
  }
  return R
}

function 한도면(들, 번, R, t) {
  const 배 = R.공사.배근 || {}
  const 바닥형 = (배.슬라브 || []).filter((s) => /^T\d+\(/.test(String(s.기호 || '')) && 수(s.두께) > 0 && s._흙)
  const d = 들[번]
  if (!d || !d.모델) return null
  const D = 도면준비(d.모델, d.k || 1, 번)
  const 판 = {}
  ;(D.판제목 || []).forEach((s, p) => { const u = 붙(s); for (const [k, re] of Object.entries(제목)) if (re.test(u) && !판[k]) 판[k] = { p, r: D.도곽[p], 제목: u } })
  if (!판.바닥 || !판.기초 || !판.보) return null
  const 키 = (x) => 번 + '|' + x.p + '|' + x.제목 + '|' + x.p
  const 층이름 = (ly) => String((D.layers || D.모델.layers || [])[ly]?.name || (D.모델.layers[ly] || {}).name || '')

  /* ① 기초 층 — 기초 판에서 F 기호 곁(3 m 안)에 윤곽이 가장 많이 잡히는 층 */
  const F글 = 판안글(D, 판.기초.r).filter((g) => F기호.test(g.u))
  if (F글.length < 3) return { 실패: '기초 판(' + 판.기초.제목 + ')에서 F 기호를 못 찾음' }
  const 기초토막 = 판안토막(D, 판.기초.r)
  let 기초층 = null
  const 이름맞 = (k, 토막) => { const a = [...토막.keys()].filter((ly) => 층말[k].test(층이름(ly)) && !안쓸층.test(층이름(ly))); return a.length ? new Set(a) : null }
  /* 층 이름이 맞는 층(있으면)에서 먼저 — 거기서 못 찾으면 모든 층에서(현장 6: 바닥판을 «3_철콘옹벽» 층에 그림) */
  const 두번 = (후보, 고르기) => (후보 && 고르기(후보)) || 고르기(null)
  기초층 = 두번(이름맞('기초', 기초토막), (기초후보) => {
    let 고른 = null
    for (const [ly, ss] of 기초토막) {
      if (ss.length < 8 || 긴선층(ss)) continue
      if (기초후보 ? !기초후보.has(ly) : 안쓸층.test(층이름(ly))) continue
      const { 바깥들 } = 면과테두리(ss, { tol: 2 })
      const 고리 = 맨바깥(바깥들.filter((h) => h.넓이 > 0.2e6 && h.넓이 < 300e6 && !글틀인가(h, F글)))
      if (고리.length < 3) continue
      let n = 0
      for (const g of F글) if (고리.some((h) => 경계거리([g.x, g.y], h.점) < 3500)) n++
      const 점수 = n * 1000 - Math.abs(고리.length - F글.length)
      if (!고른 || 점수 > 고른.점수) 고른 = { ly, 점수, 고리, n }
    }
    return 고른 && 고른.n >= 0.5 * F글.length ? 고른 : null
  })
  if (!기초층) return { 실패: '기초 판에서 기초 윤곽 층을 못 찾음' }
  const 기초ly = 기초층.ly

  /* ② 바닥판 층 — 바닥 판에서 레벨 글자(지시선 끝)를 가장 많이 품는 닫힌 면 층 */
  const 바닥토막 = 판안토막(D, 판.바닥.r)
  const 바닥레벨 = 레벨들(D, 판.바닥.r)
  const 바닥층 = 두번(이름맞('바닥', 바닥토막), (바닥후보) => {
    let 고른 = null
    for (const [ly, ss] of 바닥토막) {
      if (ly === 기초ly || ss.length < 8 || 긴선층(ss)) continue
      if (바닥후보 ? !바닥후보.has(ly) : 안쓸층.test(층이름(ly))) continue
      const { 면들 } = 면과테두리(ss, { tol: 2 })
      const 큰 = 면들.filter((f) => f.넓이 > 0.05e6)
      const A = 큰.reduce((s, f) => s + f.넓이, 0)
      if (A < 50e6) continue
      let n = 0
      for (const L of 바닥레벨) if (L.v <= 0 && 큰.some((f) => 면안(L.점, f))) n++
      const 점수 = n * 1e9 + A
      if (!고른 || 점수 > 고른.점수) 고른 = { ly, 점수, 면들: 큰, n, A }
    }
    return 고른 && 고른.n >= 3 ? 고른 : null
  })
  if (!바닥층) return { 실패: '바닥 판에서 바닥판 윤곽 층을 못 찾음' }

  /* ③ 보 층 — 보 판에서 B 기호 곁(1.5 m 안)에 좁은 띠(폭 150 ~ 1,500)가 가장 많이 잡히는 층(기초 층 선과 함께 면을 찾음) */
  const B글 = 판안글(D, 판.보.r).filter((g) => B기호.test(g.u))
  const 보토막 = 판안토막(D, 판.보.r)
  const 보판기초 = 보토막.get(기초ly) || []
  const 보층 = 두번(이름맞('보', 보토막), (보후보) => {
  let 보층 = null
  for (const [ly, ss] of 보토막) {
    if (ly === 기초ly || ss.length < 8 || 긴선층(ss)) continue
    if (보후보 ? !보후보.has(ly) : 안쓸층.test(층이름(ly))) continue
    const { 면들, 바깥들 } = 면과테두리(ss.concat(보판기초, 띠끝닫기(ss, 보판기초)), { tol: 2 })
    const 기고리 = 맨바깥(면과테두리(보판기초, { tol: 2 }).바깥들.filter((h) => h.넓이 > 0.2e6))
    const 띠 = []
    for (const f of 면들) {
      const z = 띠재기(f.점)
      if (z.w < 150 || z.w > 1500 || z.L < 1.5 * z.w) continue
      if (기고리.some((h) => 안인가([z.cx, z.cy], h.점))) continue
      띠.push({ f, z })
    }
    let n = 0
    for (const g of B글) if (띠.some((x) => 토막거리(g.x, g.y, ...x.z.축) < 1500 + x.z.w / 2)) n++
    const 점수 = n * 1e6 + 띠.length
    if (!보층 || 점수 > 보층.점수) 보층 = { ly, 점수, 띠, n, 기고리 }
    void 바깥들
  }
  return 보층 && 보층.띠.length >= 3 ? 보층 : null
  })
  if (!보층) return { 실패: '보 판에서 지중보 띠를 못 찾음' }

  /* ④ 판 사이 옮김 — 기초 윤곽을 바닥 판 · 보 판에도 그렸음 */
  const 바닥판기초 = 맨바깥(면과테두리(바닥토막.get(기초ly) || [], { tol: 2 }).바깥들.filter((h) => h.넓이 > 0.2e6))
  const 기바 = 옮김찾기(기초층.고리, 바닥판기초)
  const 보바 = 옮김찾기(보층.기고리, 바닥판기초)
  if (!기바 || !보바) return { 실패: '기초 · 보 판을 바닥 판 자리에 맞추지 못함(기초 윤곽 투표)' }

  /* ⑤ 바닥판 면마다 윗면 레벨 */
  const 면 = 바닥층.면들.map((f, i) => ({ i, f, 레벨: [], 윗: null }))
  for (const L of 바닥레벨) {
    const m = 면.find((x) => 면안(L.점, x.f)) || (L.지시 ? 면.find((x) => 경계거리(L.점, x.f.점) < 150) : null)
    if (m) m.레벨.push(L.v)
  }
  for (const m of 면) {
    if (!m.레벨.length) continue
    /* FL 위(+) 글자(벽 · 단 윗면 «+1412»)보다 FL 아래 · ±0 글자를 먼저 */
    const 쓸 = m.레벨.some((v) => v <= 0) ? m.레벨.filter((v) => v <= 0) : m.레벨
    const 셈 = new Map(); for (const v of 쓸) 셈.set(v, (셈.get(v) || 0) + 1)
    m.윗 = [...셈].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0][0]
  }
  /* 맞댄 변(같은 점 둘) — 이웃 · 맞댄 길이 */
  const 변키 = (a, b) => { const p = Math.round(a[0]) + ',' + Math.round(a[1]), q = Math.round(b[0]) + ',' + Math.round(b[1]); return p < q ? p + '|' + q : q + '|' + p }
  const 변면 = new Map()
  for (const m of 면) {
    const rs = [m.f.점, ...m.f.구멍]
    for (const r of rs) for (let k = 0; k < r.length; k++) { const a = r[k], b = r[(k + 1) % r.length]; const key = 변키(a, b); const x = 변면.get(key); const v = { m, a, b, L: Math.hypot(b[0] - a[0], b[1] - a[1]) }; if (x) x.push(v); else 변면.set(key, [v]) }
  }
  const 이웃 = new Map(면.map((m) => [m, new Map()]))
  for (const vs of 변면.values()) if (vs.length === 2 && vs[0].m !== vs[1].m) {
    const [p, q] = vs
    이웃.get(p.m).set(q.m, (이웃.get(p.m).get(q.m) || 0) + p.L)
    이웃.get(q.m).set(p.m, (이웃.get(q.m).get(p.m) || 0) + p.L)
  }
  let 짐작레벨 = 0
  for (let n = 0, 더 = true; 더 && n < 50; n++) {
    더 = false
    for (const m of 면) {
      if (m.윗 !== null) continue
      let best = null
      for (const [q, L] of 이웃.get(m)) if (q.윗 !== null && (!best || L > best.L)) best = { q, L }
      if (best) { m.윗 = best.q.윗; m.물려 = true; 더 = true }
    }
  }
  for (const m of 면) if (m.윗 === null) { m.윗 = 0; m.물려 = true; 짐작레벨++ }
  /* 기초 · 지중보 윗면 = 그 자리 바닥판 밑 — FL 위로 올린 바닥(단)은 FL 바닥 밑(−두께)까지만 */
  const 바닥밑 = (p) => { const v = 바닥밑0(p); return v === null ? null : Math.min(v, -t) }
  const 바닥밑0 = (p) => {
    const m = 면.find((x) => 면안(p, x.f))
    if (m) return m.윗 - t
    /* 금(면 사이 선) 위면 곁 네 점 — 높은 쪽 */
    let best = null
    for (const [ox, oy] of [[150, 0], [-150, 0], [0, 150], [0, -150], [300, 300], [-300, -300], [300, -300], [-300, 300]]) {
      const q = 면.find((x) => 면안([p[0] + ox, p[1] + oy], x.f))
      if (q && (best === null || q.윗 > best)) best = q.윗
    }
    return best === null ? null : best - t
  }

  /* ⑥ 기초 — 윤곽 · 기호 · 바닥 레벨 */
  const 기초레벨 = 레벨들(D, 판.기초.r)
  const 기초들 = 기초층.고리.map((h) => ({ h, r: 다듬기(h.점), 기호: null, 바닥: [], 맞닿음: 0 }))
  for (const g of F글) {
    let best = null
    for (const x of 기초들) { const dd = 경계거리([g.x, g.y], x.h.점) * (안인가([g.x, g.y], x.h.점) ? 0 : 1); if (dd < 3500 && (!best || dd < best.d)) best = { x, d: dd } }
    if (best && (!best.x.기호 || best.d < best.x.d)) { best.x.기호 = g.u; best.x.d = best.d }
  }
  for (const L of 기초레벨) {
    let best = null
    for (const x of 기초들) { const dd = 안인가(L.점, x.h.점) ? 0 : 경계거리(L.점, x.h.점); if (dd < 300 && (!best || dd < best.d)) best = { x, d: dd } }
    if (best) best.x.바닥.push(L.v)
  }
  /* 🏭 G295 기호가 3.5 m 안에 없는 기초(깊은 피트 밑 기초 — 기호를 피트 밖에 씀)는 8 m 안 가장 가까운 F 기호(짐작) */
  let 기호짐작 = 0
  for (const x of 기초들) {
    if (x.기호 || !x.바닥.length) continue
    let best = null
    for (const g of F글) { const dd = 경계거리([g.x, g.y], x.h.점); if (dd < 8000 && (!best || dd < best.d)) best = { g, d: dd } }
    if (best) { x.기호 = best.g.u; x.기호짐작 = true; 기호짐작++ }
  }
  /* ⑦ 지중보 띠 — 기호 · 바닥 레벨 · (같은 줄 이웃에게서 물려받기) */
  const 보레벨 = 레벨들(D, 판.보.r)
  const 띠 = 보층.띠.map((x) => ({ ...x, 기호: null, 바닥: [] }))
  for (const g of B글) {
    let best = null
    for (const x of 띠) {
      const { ux, uy, L, w, cx, cy } = x.z
      const s = (g.x - cx) * ux + (g.y - cy) * uy, n = Math.abs(-(g.x - cx) * uy + (g.y - cy) * ux)
      if (Math.abs(s) > L / 2 + 1000 || n > 1500 + w / 2) continue
      const dd = n + Math.max(0, Math.abs(s) - L / 2)
      if (!best || dd < best.d) best = { x, d: dd }
    }
    if (best && (!best.x.기호 || best.d < best.x.d)) { best.x.기호 = g.u.replace(/^FT/, ''); best.x.d = best.d }
  }
  for (const L of 보레벨) {
    let best = null
    for (const x of 띠) { const dd = 안인가(L.점, x.f.점) ? 0 : 경계거리(L.점, x.f.점); if (dd < 300 && (!best || dd < best.d)) best = { x, d: dd } }
    if (best) best.x.바닥.push(L.v)
  }
  /* 같은 줄(축이 한 줄 · 폭 같음 · 끝이 기초 하나만큼 떨어짐)이면 이웃 — 기호 · 바닥을 물려받음 */
  const 같은줄 = (a, b) => {
    if (Math.abs(a.z.ux * b.z.uy - a.z.uy * b.z.ux) > 0.02 || Math.abs(a.z.w - b.z.w) > 30) return false
    const n = Math.abs(-(b.z.cx - a.z.cx) * a.z.uy + (b.z.cy - a.z.cy) * a.z.ux)
    if (n > 60) return false
    const s = Math.abs((b.z.cx - a.z.cx) * a.z.ux + (b.z.cy - a.z.cy) * a.z.uy)
    return s - (a.z.L + b.z.L) / 2 < 6000
  }
  let 물린보 = 0
  for (let n = 0, 더 = true; 더 && n < 30; n++) {
    더 = false
    for (const x of 띠) {
      if (x.기호 && x.바닥.length) continue
      const 곁 = 띠.filter((y) => y !== x && 같은줄(x, y) && y.기호 && y.바닥.length)
        .sort((p, q) => Math.hypot(p.z.cx - x.z.cx, p.z.cy - x.z.cy) - Math.hypot(q.z.cx - x.z.cx, q.z.cy - x.z.cy))[0]
      if (!곁) continue
      if (!x.기호) x.기호 = 곁.기호
      if (!x.바닥.length) x.바닥 = 곁.바닥.slice()
      x.물려 = true; 물린보++; 더 = true
    }
  }

  /* ⑧ 산출서 줄 만들기 */
  const 주0 = 공사주(R)
  const 판키 = new Set([키(판.바닥), 키(판.기초), 키(판.보)])
  const 이판 = (row) => Array.isArray(row._자리) && row._자리.length && row._자리.every((z) => z && 판키.has(z.p))
  const 남기 = (표) => (주0[표] || []).filter((row) => !이판(row))
  const 새주 = { ...주0, 슬라브: 남기('슬라브'), 기초: 남기('기초'), 보: 남기('보'), 보강: (주0.보강 || []).slice() }
  const 새배 = { ...R.공사.배근, 슬라브: (배.슬라브 || []).map((s) => ({ ...s })), 기초: (배.기초 || []).map((s) => ({ ...s })), 보: (배.보 || []).map((s) => ({ ...s })) }
  const 찾배 = (표, 기호) => { const u = 기호다듬(기호); return 새배[표].find((x) => 기호다듬(x.기호) === u) || 새배[표].find((x) => 기호다듬(x.기호) === 'FT' + u) || null }
  const 부재 = []          // 3D(바닥 판 좌표 · mm) — {종류, 표, i, kk, 기호, 점, z0, z1}
  const 짐작 = []
  const 원 = (x) => String(Math.round(x))

  /* 바닥판 — 바닥 철근은 칸을 건너 이어지므로 이음은 바닥판 전체 크기(둘러싼 네모)로 셈(_길x · _길y) */
  const 전체 = [Infinity, Infinity, -Infinity, -Infinity]
  for (const m of 면) { const b = m.f.상자; 전체[0] = Math.min(전체[0], b[0]); 전체[1] = Math.min(전체[1], b[1]); 전체[2] = Math.max(전체[2], b[2]); 전체[3] = Math.max(전체[3], b[3]) }
  const 바닥칸 = new Map()          // 기호 → 배근
  const 바닥줄 = []
  for (const m of 면) {
    if (m.f.넓이 < 0.2e6) continue
    const 기호 = 'T' + t + '(' + (m.윗 === 0 ? '±0' : m.윗) + ')'
    let s = 바닥칸.get(기호)
    if (!s) {
      const 본 = 새배.슬라브.find((x) => x.기호 === 기호) || 바닥형[0]
      const 단위 = 간격으로단위([본.단변하부, 본.단변상부, 본.장변하부, 본.장변상부])
      s = { ...본, 기호, 두께: String(t), 종류: '부정형', 단위철근: 단위, _윗면: String(m.윗), _흙: '1', _길x: 원(전체[2] - 전체[0]), _길y: 원(전체[3] - 전체[1]), 만든: '플랜트 기초 읽기: 바닥판 윤곽 그대로 · m²당 철근 = 단면 배근 간격(' + 단위 + ')' }
      바닥칸.set(기호, s)
    }
    const b = m.f.상자
    const W = b[2] - b[0], H = b[3] - b[1]
    const 구멍 = Math.max(0, (W * H - m.f.넓이) / 1e6)
    바닥줄.push({ 층: 'FT', 기호, 단변: 원(Math.min(W, H)), 장변: 원(Math.max(W, H)), 개구부: 구멍 > 0.0005 ? String(Math.round(구멍 * 1000) / 1000) : '', 단변정착: '0', 장변정착: '0', QT: '1', C: '', F: '', R: '',
      _자리: [{ n: d.이름, r: b.map(반), p: 키(판.바닥) }], _플랜트: true, _m: m })
  }
  새배.슬라브 = 새배.슬라브.filter((x) => !바닥칸.has(x.기호)).concat([...바닥칸.values()])

  /* 기초 — 윗면 = 그 자리 바닥판 밑 · 두께 = 윗면 − 바닥 레벨 */
  const 기초칸 = new Map(), 기초줄 = []
  let 기초못 = 0, 두께짐작 = 0
  for (const x of 기초들) {
    if (!x.기호 || !x.바닥.length) { 기초못++; continue }
    const 바닥 = Math.min(...x.바닥)
    const r바 = 옮기기(x.r, 기바)
    const 본 = 찾배('기초', x.기호)
    /* 바닥판 밖(건물 밖 따로 선 기초)은 상세에서 읽은 윗면(골조자동 _윗면) */
    const 윗 = 바닥밑(안점(r바)) ?? (본 && Number.isFinite(수(본._윗면)) ? 수(본._윗면) : null)
    if (윗 === null) { 기초못++; continue }
    let T = 윗 - 바닥
    /* 🏭 G295 바닥 레벨 글이 그 자리 바닥판 밑보다 높으면(피트 안 기초 — 레벨 글이 피트 바닥판 윗면) 상세의 두께로(짐작) */
    if (!(T > 100) && 본 && 수(본.두께) > 100) { T = 수(본.두께); 두께짐작++ }
    if (!(T > 100)) { 기초못++; continue }
    const 네 = 네모인가(x.r)
    const bx = 상자(x.r)
    const 이름 = x.기호
    const 꼴키 = 네 ? 'N' + 반(bx[2] - bx[0]) + 'x' + 반(bx[3] - bx[1]) : 'P' + 반(x.h.넓이 / 1e4)
    const 칸키 = 이름 + '|' + 꼴키 + '|' + 반(T)
    let 칸 = 기초칸.get(칸키)
    if (!칸) {
      const 같은이름 = [...기초칸.values()].filter((c) => c.기호0 === 이름).length
      const 기호 = 같은이름 ? 이름 + '-' + (같은이름 + 1) : 이름
      const 철 = 본 ? { 하부가로: 본.하부가로 || '', 하부세로: 본.하부세로 || '', 상부가로: 본.상부가로 || '', 상부세로: 본.상부세로 || '', 지지근: 본.지지근 || '' } : {}
      const 배근 = 네
        ? { ...(본 || {}), 기호, 종류: '독립', 가로: 원(bx[2] - bx[0]), 세로: 원(bx[3] - bx[1]), 두께: 원(T), ...철, 버림: (본 && 본.버림) || '50' }
        : { ...(본 || {}), 기호, 종류: '부정형', 면적: String(Math.round(x.h.넓이 / 1e3) / 1e3), 둘레: String(Math.round(x.h.둘레) / 1e3), 두께: 원(T), 단위철근: 간격으로단위([철.하부가로, 철.하부세로, 철.상부가로, 철.상부세로]), 버림: (본 && 본.버림) || '50' }
      배근.만든 = '플랜트 기초 읽기: 기초 평면 윤곽 ' + (네 ? 배근.가로 + '×' + 배근.세로 : '부정형 ' + 배근.면적 + 'm²') + ' · 두께 = 바닥판 밑(' + 윗 + ') − 기초 바닥(' + 바닥 + ')' + (본 ? '' : ' · 철근은 상세를 못 찾아 비었음')
      delete 배근._윗면
      if (!본) 짐작.push('기초 «' + 이름 + '» 철근 상세를 못 찾아 철근은 비었습니다')
      칸 = { 기호, 기호0: 이름, 배근, 자리: [], 맞닿음: [] }
      기초칸.set(칸키, 칸)
    }
    칸.자리.push({ x, r바, 윗, 바닥: 윗 - T })
  }
  /* 보와 맞닿은 길이(기초 거푸집 공제) — 보 띠 끝이 기초 윤곽에 닿으면 보 폭만큼 */
  const 기초바 = [...기초칸.values()].flatMap((c) => c.자리.map((z) => ({ c, z })))
  for (const c of 기초칸.values()) {
    const rows = []
    for (const z of c.자리) rows.push(z)
    for (const z of rows) {
      z.닿음 = 0
      for (const y of 띠) {
        const 끝들 = [[y.z.축[0], y.z.축[1]], [y.z.축[2], y.z.축[3]]].map((p) => [p[0] + 보바.x, p[1] + 보바.y])
        for (const p of 끝들) if (경계거리(p, z.r바) < 60) z.닿음 += y.z.w
      }
    }
  }
  void 기초바
  for (const c of 기초칸.values()) {
    const 닿음 = [...new Set(c.자리.map((z) => 반(z.닿음)))]
    /* 맞닿은 길이가 같은 것끼리 한 줄 */
    for (const 길 of 닿음) {
      const zs = c.자리.filter((z) => 반(z.닿음) === 길)
      기초줄.push({ 층: 'FT', 기호: c.기호, 줄기초: '', MAT단변: '', MAT장변: '', 형틀공제: c.배근.종류 === '독립' && 길 > 0 ? String(길) : '', 추가: '', 단부공제: '', QT: String(zs.length), C: '', F: '', 공제F: '', R: '',
        _자리: zs.map((z) => ({ n: d.이름, r: 상자(z.x.r).map(반), p: 키(판.기초) })), _플랜트: true, _z: zs })
    }
  }
  새배.기초 = 새배.기초.filter((x) => ![...기초칸.values()].some((c) => c.기호 === x.기호)).concat([...기초칸.values()].map((c) => c.배근))

  /* 지중보 — 띠마다 · 춤 = 바닥판 밑 − 보 바닥 + 바닥 두께(셈이 «춤 − 슬래브» 로 셈함) */
  const 보칸 = new Map(), 보줄 = []
  let 보못 = 0
  for (const x of 띠) {
    if (!x.기호 || !x.바닥.length) { 보못++; continue }
    const 바닥 = Math.min(...x.바닥)
    const c = [x.z.cx + 보바.x, x.z.cy + 보바.y]
    const 본 = 찾배('보', x.기호)
    /* 바닥판 밖 보(건물 밖 따로 선 보 — 일람 단면 윗면 «−1050»)는 일람에서 읽은 윗면 · 그때는 춤 = 윗면 − 바닥(슬래브 없음) */
    const 바닥위 = 바닥밑(c)
    const 홀로 = 바닥위 === null
    const 밑 = 홀로 ? (본 && Number.isFinite(수(본._윗면)) ? 수(본._윗면) : null) : 바닥위
    if (밑 === null) { 보못++; continue }
    const 깊 = 밑 - 바닥
    if (!(깊 > 50)) { 보못++; continue }
    const W = Math.round(x.z.w / 5) * 5
    const 칸키 = x.기호 + '|' + W + '|' + 반(깊) + (홀로 ? '|홀로' : '')
    let 칸 = 보칸.get(칸키)
    if (!칸) {
      const 같은이름 = [...보칸.values()].filter((k) => k.기호0 === x.기호).length
      const 기호 = 같은이름 ? x.기호 + '-' + (같은이름 + 1) : x.기호
      const 배근 = { ...(본 || { 상부: '', 하부: '', 늑근단부: '', 늑근중앙: '' }), 기호, 폭: String(W), 춤: 원(깊 + (홀로 ? 0 : t)), 버림: (본 && 본.버림) || '50',
        만든: '플랜트 기초 읽기: 보 평면 두 선 사이 폭 ' + W + ' · 춤 = 바닥판 밑(' + 밑 + ') − 보 바닥(' + 바닥 + ') + 바닥 두께 ' + t + (본 ? '' : ' · 철근은 일람을 못 찾아 비었음') }
      delete 배근._밑; delete 배근._윗면; delete 배근._춤후보
      if (!본) 짐작.push('보 «' + x.기호 + '» 일람 철근을 못 찾아 철근은 비었습니다')
      칸 = { 기호, 기호0: x.기호, 배근 }
      보칸.set(칸키, 칸)
    }
    보줄.push({ 층: 'FT', 열: '', 기호: 칸.기호, 길이: 원(x.z.L), 좌단: '', 우단: '', S: 홀로 ? '0' : String(t), QT: '1', C: '', F: '', 공제F: '', R: '',
      _자리: [{ n: d.이름, r: 상자(x.f.점).map(반), p: 키(판.보), 축: [...x.z.축.map(반), 반(x.z.w)] }], _플랜트: true, _x: x, _밑: 밑, _바닥: 바닥 })
  }
  새배.보 = 새배.보.filter((x) => ![...보칸.values()].some((k) => k.기호 === x.기호)).concat([...보칸.values()].map((k) => k.배근))

  /* 바닥판 단 차이 — 맞댄 두 면의 윗면이 다르고 그 금 위에 보가 없으면: 길이 × 높이 차 × 두께 · 거푸집 한 면 */
  const 보띠바 = 띠.map((x) => 옮기기(x.f.점, 보바))
  const 단 = new Map()          // 높이 차 → 길이 mm
  for (const vs of 변면.values()) {
    if (vs.length !== 2 || vs[0].m === vs[1].m) continue
    const [p, q] = vs
    const Δ = Math.abs(p.m.윗 - q.m.윗)
    if (!(Δ >= 50) || p.m.f.넓이 < 0.2e6 || q.m.f.넓이 < 0.2e6) continue
    const mid = [(p.a[0] + p.b[0]) / 2, (p.a[1] + p.b[1]) / 2]
    if (보띠바.some((r) => 안인가(mid, r) || 경계거리(mid, r) < 30)) continue
    단.set(Δ, (단.get(Δ) || 0) + p.L)
  }
  const 단줄 = []
  for (const [Δ, L] of [...단].sort((a, b) => a[0] - b[0])) {
    if (L < 300) continue
    const 식L = (Math.round(L) / 1000).toFixed(3), 식H = (Δ / 1000).toFixed(3), 식T = (t / 1000).toFixed(3)
    단줄.push({ 동: 판.바닥.제목 + ' 바닥판 단 차이(높이 차 ' + Δ + ')', 층: 'FT', 부재: 'S-콘크리트', 산출식: 식L + '*' + 식H + '*' + 식T, _플랜트: true })
    단줄.push({ 동: 판.바닥.제목 + ' 바닥판 단 차이(높이 차 ' + Δ + ')', 층: 'FT', 부재: 'S-거푸집', 산출식: 식L + '*' + 식H, _플랜트: true })
  }

  /* 🏭 G295 기둥 받침 철근 — 기둥은 건축 몫(FL 위)이지만 받침 철근(FL 아래 기초 바닥까지 + FL 위 이음 길이)은 토목 몫.
     «C1, C1a 철근 배근 상세» 처럼 기둥 상세 판: 가장 많은 «16-HD22» = FL 아래 받침 · 가장 적은 «8-HD22» = FL 위로 1,000 이어 올림.
     기둥 자리 = 바닥 판 기둥 줄 자리(같은 자리 0.5 m 안은 하나) · 길이 = (FL − 그 밑 기초 바닥) − 피복 75 + 갈고리 12d */
  const 받침줄 = []
  const 받침상세 = D.글자.filter((g) => /배근상세/.test(g.u) && /C\d/.test(g.u))
  for (const 제 of 받침상세) {
    const 종류들 = [...new Set(제.u.replace(/배근상세.*/, '').match(/C\d+[A-Z]?/g) || [])]
    if (!종류들.length) continue
    const p0 = D.도곽번(제.x, 제.y)
    const 철 = D.글자.filter((g) => D.도곽번(g.x, g.y) === p0 && Math.abs(g.x - 제.x) <= 6000 && g.y < 제.y && 제.y - g.y <= 6000).map((g) => /^(\d{1,2})-H?D(\d{2})$/.exec(g.u)).filter(Boolean).map((k) => ({ n: +k[1], d: +k[2] }))
    if (!철.length) continue
    const 받 = 철.reduce((a, b) => (b.n > a.n ? b : a)), 위 = 철.reduce((a, b) => (b.n < a.n ? b : a))
    const 자리 = []
    for (const row of 주0.기둥 || []) {
      if (!종류들.includes(기호다듬(row.기호))) continue
      for (const z of row._자리 || []) {
        if (!z || z.p !== 키(판.바닥) || !Array.isArray(z.r)) continue
        const c = [(z.r[0] + z.r[2]) / 2, (z.r[1] + z.r[3]) / 2]
        if (!자리.some((q) => Math.hypot(q.c[0] - c[0], q.c[1] - c[1]) < 500)) 자리.push({ c, 기호: 기호다듬(row.기호) })
      }
    }
    const 기초자리 = 기초줄.flatMap((row) => row._z.map((z) => ({ r: z.r바, 바닥: z.바닥 })))
    const 묶 = new Map()
    for (const q of 자리) {
      let f = 기초자리.find((z) => 안인가(q.c, z.r))
      if (!f) { let bd = 2000; for (const z of 기초자리) { const dd = 경계거리(q.c, z.r); if (dd < bd) { bd = dd; f = z } } }
      if (!f) continue
      const k = q.기호 + '|' + f.바닥
      묶.set(k, (묶.get(k) || 0) + 1)
    }
    for (const [k, n] of 묶) {
      const [기호, 바닥] = k.split('|')
      const 깊 = (-+바닥 - 75 + 12 * 받.d) / 1000
      받침줄.push({ 동: '기둥 받침 철근 ' + 기호 + ' (기초 바닥 ' + 바닥 + ' · ' + n + '곳 · ' + 받.n + '-D' + 받.d + ' FL 아래 · ' + 위.n + '-D' + 위.d + ' FL 위 1,000 — «' + 제.s.trim() + '»)', 층: 'FT', 부재: 'C-D' + 받.d,
        산출식: '(' + 받.n + '*' + 깊.toFixed(3) + (위.d === 받.d ? '+' + 위.n + '*1' : '') + ')*' + n, _플랜트: true })
      if (위.d !== 받.d) 받침줄.push({ 동: '기둥 받침 철근 ' + 기호 + ' FL 위 이음', 층: 'FT', 부재: 'C-D' + 위.d, 산출식: '(' + 위.n + '*1)*' + n, _플랜트: true })
    }
  }

  /* 🏭 G295 조립근 — 도면 주기 «조립근은 WALL, SLAB, MAT 두께가 1.0m 이상은 HD16@1000, 1.0m 미만은 HD13@1000» (윗 · 아래 철근 사이를 받치는 철근)
     개수 = 넓이 ÷ (간격 × 간격) · 한 개 길이 = 두께 − 피복 2 × 75 + 다리 2 × 200 · 바닥판과 기초(두께별) */
  const 조립줄 = []
  const 조글 = D.글자.map((g) => /조립근.*?1\.0M?이상은?H?D(\d{2})@(\d{3,4}).*?미만은?H?D(\d{2})@(\d{3,4})/.exec(g.u)).find(Boolean)
  if (조글) {
    const 큰 = { d: +조글[1], s: +조글[2] }, 작 = { d: +조글[3], s: +조글[4] }
    const 한줄 = (이름, A, T) => {
      if (!(A > 0 && T > 0)) return
      const k = T >= 1000 ? 큰 : 작, 개 = 1e6 / (k.s * k.s), L = (T - 150 + 400) / 1000
      조립줄.push({ 동: '조립근 ' + 이름 + ' 두께 ' + T + ' (' + (T >= 1000 ? '1.0m 이상' : '1.0m 미만') + ' HD' + k.d + '@' + k.s + ' — 도면 주기)', 층: 'FT', 부재: (이름 === '바닥판' ? 'S' : 'F') + '-D' + k.d,
        산출식: (A / 1e6).toFixed(3) + '*' + (Math.round(개 * 1e4) / 1e4) + '*' + L.toFixed(3), _플랜트: true })
    }
    한줄('바닥판', 바닥줄.reduce((a2, r) => a2 + r._m.f.넓이, 0), t)
    const 기T = new Map()
    for (const c of 기초칸.values()) { const T = 수(c.배근.두께); const A = c.자리.reduce((a2, z) => a2 + z.x.h.넓이, 0); 기T.set(T, (기T.get(T) || 0) + A) }
    for (const [T, A] of [...기T].sort((p, q) => p[0] - q[0])) 한줄('기초', A, T)
  }

  /* ⑨ 새 공사 — 줄 번호를 맞춰 3D 부재(표 · i · kk) */
  const 줄붙 = (표, rows) => { const i0 = 새주[표].length; 새주[표] = 새주[표].concat(rows.map(({ _m, _z, _x, _밑, _바닥, ...r }) => r)); return i0 }
  const 슬i0 = 줄붙('슬라브', 바닥줄), 기i0 = 줄붙('기초', 기초줄), 보i0 = 줄붙('보', 보줄)
  새주.보강 = 새주.보강.concat(단줄, 받침줄, 조립줄)
  바닥줄.forEach((row, k) => 부재.push({ 종류: '슬라브', 표: '슬라브', i: 슬i0 + k, kk: 0, 기호: row.기호, 점: row._m.f.점, 구멍: row._m.f.구멍, 넓이: row._m.f.넓이, z1: row._m.윗, z0: row._m.윗 - t, 판키: 키(판.바닥) }))
  기초줄.forEach((row, k) => row._z.forEach((z, kk) => 부재.push({ 종류: '기초', 표: '기초', i: 기i0 + k, kk, 기호: row.기호, 점: z.r바, z1: z.윗, z0: z.바닥, 판키: 키(판.기초) })))
  보줄.forEach((row, k) => 부재.push({ 종류: '보', 표: '보', i: 보i0 + k, kk: 0, 기호: row.기호, 점: 옮기기(row._x.f.점, 보바), z1: row._밑, z0: row._바닥, 판키: 키(판.보), 폭: +새배.보.find((b) => b.기호 === row.기호).폭, 길이: row._x.z.L }))
  const 공2 = { ...R.공사, 배근: 새배, 동: [{ ...R.공사.동[0], 주자료: 새주 }, ...R.공사.동.slice(1)], 층: (R.공사.층 || []).map((f) => (String(f.이름) === 'FT' ? { ...f, 슬라브: f.슬라브 || t, 둘레: 바깥둘레(면, t) } : f)) }

  const 바닥A = 바닥줄.reduce((s, r) => s + r._m.f.넓이, 0) / 1e6
  const 글 = '🏭 플랜트식 기초 도면(' + [판.바닥.제목, 판.보.제목, 판.기초.제목].join(' · ') + ')을 윤곽 그대로 다시 셈했습니다 — 바닥판 ' + 바닥줄.length + '칸 ' + (Math.round(바닥A * 10) / 10) + ' ㎡(두께 ' + t + ') · 기초 ' + 기초줄.reduce((s, r) => s + +r.QT, 0) + '개 · 지중보 ' + 보줄.length + '칸' + (단줄.length ? ' · 바닥판 단 차이 ' + 단줄.length / 2 + '줄' : '')
  const 알림 = [글]
  if (짐작레벨) 알림.push('바닥판 ' + 짐작레벨 + '칸은 레벨 글자가 없고 맞댄 칸도 없어 FL±0 으로 봤습니다')
  if (기초못) 알림.push('기초 윤곽 ' + 기초못 + '개는 기호 · 바닥 레벨 · 바닥판을 못 찾아 뺐습니다')
  if (두께짐작) 알림.push('기초 ' + 두께짐작 + '개는 바닥 레벨 글이 그 자리 바닥판 밑보다 높아(피트 안) 상세의 두께로 셈했습니다(짐작)')
  if (기호짐작) 알림.push('기초 윤곽 ' + 기호짐작 + '개는 3.5 m 안에 기호가 없어 8 m 안 가장 가까운 기호의 철근으로 셈했습니다(짐작 — 배근표에서 한 번 보아 주세요)')
  if (조립줄.length) 알림.push('조립근(도면 주기 «조립근은 … 1.0m 이상 HD' + 조글[1] + '@' + 조글[2] + ' · 미만 HD' + 조글[3] + '@' + 조글[4] + '»)을 바닥판 · 기초 넓이로 셈했습니다 — 한 개 길이 = 두께 − 피복 150 + 다리 400')
  if (받침줄.length) 알림.push('기둥 받침 철근(FL 아래 기초 바닥까지 + FL 위 이음 1,000)을 기둥 상세 판 철근으로 셈했습니다 — ' + 받침줄.filter((r) => !/이음$/.test(r.동)).map((r) => r.동.replace(/ — .*$/, ')')).join(' · '))
  if (보못) 알림.push('지중보 띠 ' + 보못 + '칸은 기호 · 바닥 레벨 · 바닥판을 못 찾아 뺐습니다')
  if (물린보) 짐작.push('지중보 ' + 물린보 + '칸은 기호 · 바닥 레벨 글자가 없어 같은 줄 이웃 보의 것을 썼습니다')
  const 경고 = (R.경고 || []).filter((w) => !/바닥 슬래브 \d+칸|바닥 슬래브.*FLOOR TYPICAL/.test(String(w)))
  return {
    R: { ...R, 공사: 공2, 경고: [...알림, ...경고], 플랜트: { 번, 판키: [...판키], 판: { 바닥: 키(판.바닥), 기초: 키(판.기초), 보: 키(판.보) }, 부재, 짐작, 두께: t, 옮김: { 기초: 기바, 보: 보바 },
      요약: { 바닥칸: 바닥줄.length, 바닥넓이: 바닥A, 기초: 기초줄.reduce((s, r) => s + +r.QT, 0), 보: 보줄.length, 단: 단줄.length / 2, 바닥층: 층이름(바닥층.ly), 기초층: 층이름(기초ly), 보층: 층이름(보층.ly) } } },
  }
}

/** 바닥판 바깥 둘레(m) — 맞댄 변이 없는 변의 길이 합 */
function 바깥둘레(면, t) {
  void t
  const 변키 = (a, b) => { const p = Math.round(a[0]) + ',' + Math.round(a[1]), q = Math.round(b[0]) + ',' + Math.round(b[1]); return p < q ? p + '|' + q : q + '|' + p }
  const 셈 = new Map()
  for (const m of 면) {
    for (const r of [m.f.점, ...m.f.구멍]) for (let k = 0; k < r.length; k++) { const a = r[k], b = r[(k + 1) % r.length]; const key = 변키(a, b); const x = 셈.get(key); if (x) x.n++; else 셈.set(key, { n: 1, L: Math.hypot(b[0] - a[0], b[1] - a[1]) }) }
  }
  let L = 0
  for (const v of 셈.values()) if (v.n === 1) L += v.L
  return String(Math.round(L) / 1000)
}

function 공사주(R) { return R.공사.동[0].주자료 || {} }

/**
 * 모델만들기 결과에 플랜트 부재를 넣음 — 세 판의 바닥판 · 기초 · 지중보 부재를 빼고 윤곽 그대로 다시(3D 좌표 = 바닥 판 좌표 + 맞춤 옮김 − 원점)
 * @returns 새 모델(안 바뀌면 그대로)
 */
export function 플랜트모델(모델, R) {
  const P = R && R.플랜트
  if (!모델 || !P || !P.부재 || !P.부재.length) return 모델
  const 원점 = 모델.원점 || { x: 0, y: 0 }
  /* 바닥 판의 옮김 — 맞춤 줄(층 FT · 그 도면 · 종류에 슬라브) · 없으면 기초 판 맞춤에서 */
  const 줄 = (모델.맞춤 || []).find((z) => z.번 === P.번 && z.층 === 'FT' && /슬라브/.test(z.종류 || '') && Array.isArray(z.옮김))
  let 옮 = null
  if (줄) 옮 = { x: 줄.옮김[0], y: 줄.옮김[1] }
  else {
    const 기 = (모델.맞춤 || []).find((z) => z.번 === P.번 && z.층 === 'FT' && /기초/.test(z.종류 || '') && Array.isArray(z.옮김))
    if (기 && P.옮김 && P.옮김.기초) 옮 = { x: 기.옮김[0] - P.옮김.기초.x, y: 기.옮김[1] - P.옮김.기초.y }
  }
  if (!옮) return { ...모델, 짐작: [...(모델.짐작 || []), '🏭 플랜트 기초 부재의 3D 자리를 못 맞춰 예전 부재로 보였습니다(물량은 윤곽 그대로)'] }
  const dx = 옮.x - 원점.x, dy = 옮.y - 원점.y
  const 판키 = new Set(P.판키)
  const 뺄 = (o) => (o.표 === '슬라브' || o.표 === '기초' || o.표 === '보') && 판키.has(o.평면)
  const 남 = 모델.부재.filter((o) => !뺄(o))
  const 뺀 = (모델.뺀 || []).filter((o) => !뺄(o))
  let id = Math.max(-1, ...모델.부재.map((o) => o.id), ...(모델.뺀 || []).map((o) => o.id || 0)) + 1
  const 새 = P.부재.map((q) => {
    const 판 = q.점.map((p) => [반(p[0] + dx), 반(p[1] + dy)])
    const A = q.넓이 > 0 ? q.넓이 : Math.abs(부호넓이(판))
    const c = 가운데(판)
    return {
      id: id++, 종류: q.종류, 표: q.표, i: q.i, kk: q.kk, 층: 'FT', 기호: q.기호, 몸: '', 근거: { n: '', r: 상자(q.점).map(반) }, 짐작: [], 평면: q.판키,
      판, z0: q.z0, z1: q.z1, 넓이: A, 부피: A * (q.z1 - q.z0) / 1e9, 자리: [반(c[0]), 반(c[1])], 플랜트: true,
      ...(q.종류 === '보' ? { 폭: q.폭, 길이: q.길이, 춤: q.z1 - q.z0 } : {}),
    }
  })
  /* 바닥 판에 그린 받침 기둥(일람 단면 윗면 FL ±0 · 앵커 볼트)은 기초 윗면(= 바닥판 밑) ~ FL 이라 바닥판 안 — 바닥판이 셈하므로 뺌(두 번 안 셈) */
  const 바닥키 = P.판 && P.판.바닥
  const 남2 = [], 뺀2 = []
  for (const o of 남) {
    if (o.종류 === '기둥' && o.평면 === 바닥키 && !(o.z1 > 50)) { o.겹침 = '바닥판 안 받침 기둥(FL 아래) — 바닥판 · 기초가 셈'; 뺀2.push(o) }
    else 남2.push(o)
  }
  if (뺀2.length) { 뺀.push(...뺀2); P.짐작 = [...(P.짐작 || []), '바닥 판의 받침 기둥 ' + 뺀2.length + '개는 바닥판 안(기초 윗면 ~ FL)이라 바닥판 · 기초 몫으로 봤습니다'] }
  const 부재 = [...남2, ...새]
  let 틀 = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity]
  for (const o of 부재) for (const p of o.판) { 틀[0] = Math.min(틀[0], p[0]); 틀[1] = Math.min(틀[1], p[1]); 틀[3] = Math.max(틀[3], p[0]); 틀[4] = Math.max(틀[4], p[1]); 틀[2] = Math.min(틀[2], o.z0); 틀[5] = Math.max(틀[5], o.z1) }
  const 층 = (모델.층 || []).map((f) => (f.이름 === 'FT' ? { ...f, 부재수: 부재.filter((o) => o.층 === 'FT').length } : f))
  if (!층.some((f) => f.이름 === 'FT')) 층.unshift({ 이름: 'FT', 바닥: Math.min(...새.map((o) => o.z0)), 위: 0, 짐작: false, 부재수: 새.length })
  return { ...모델, 부재, 뺀, 틀, 층, 짐작: [...(P.짐작 || []), ...(모델.짐작 || [])] }
}

/**
 * 🏭 G295 — 적산 자동 · 골조 화면도 BIM 화면과 같은 물량으로: 3D 로 세워 잰 받침 기둥 높이(기초 윗면 ~ 바닥) · 바닥판 안 받침(뺀) 을 공사에 입힘
 *   (전엔 BIM 화면만 3D 높이를 써서 같은 도면인데 화면마다 거푸집이 4 % 쯤 달랐음) · 플랜트식 도면이 아니면 R.공사 그대로
 */
export function 플랜트공사(들, R) {
  if (!R || !R.공사) return R ? R.공사 : null
  if (!R.플랜트) return R.공사
  try { return 겹친것빼기(R.공사, 플랜트모델(모델만들기(들, R, { 높이: {} }), R)) } catch (e) { return R.공사 }
}
