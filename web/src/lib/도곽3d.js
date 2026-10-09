/**
 * 🗂 도면 3D — 한 캐드 파일 안의 «박스(도곽)» 나누기 · 박스 종류 가리기 (2026-10-05)
 *
 * 소장님: 「캐드 안에 박스별로 여러 캐드 파일이 있잖아. 그걸 이용해서 3d로 전환시켜 줘야 하는거 아니야?」
 *         「횡단면도, 종단면도는 좌표로 찾기 힘들잖아. 이건 깊이 높이만 찾아 와야 하고」
 *
 * ■ 도곽 찾기 — PDF 도구(lib/dxfplot.js 도곽찾기)와 같은 생각이지만 «크기를 가리지 않습니다».
 *   소장님 도면 08 은 한 파일에 1/1000 종평면도(폭 841)와 1/100 횡단면도(폭 84)가 같이 있어,
 *   «가장 큰 박스의 20% 보다 작으면 뺌» 규칙으로는 횡단면도 박스 22장이 다 빠졌습니다(시험으로 확인).
 *   → 종이 비율(가로:세로 1.33~1.5)의 네모를 크기와 상관없이 찾고, 안에 그림·글자가 있어야 박스로 봅니다.
 * ■ 박스 이름 — 박스 안 글자 중 «…평면도 · 종평면도 · 횡단면도 · 구조도 · 상세도 …» 로 끝나는 가장 큰 글자.
 * ■ 박스 종류 — 이름으로 가립니다(도면을 해석하지 않음). 이름이 없으면 «기타».
 * ■ 종평면도 박스는 위(평면)와 아래(종단 그래프·표)를 «박스 폭을 가로지르는 긴 가로선» 으로 나눕니다.
 */
import { F64, U8 } from './dxf3d.js'

/* ── 박스 종류 ───────────────────────────── */
export const 종류이름 = {
  측량: '📡 측량도면', 평면: '🗺 평면도', 종평: '🗺 종평면도(평면)', 종단: '📈 종단면도', 횡단: '🛣 횡단면도',
  구조: '🏗 구조도', 건축: '🏢 건축', 상세: '🔍 상세·표준도', 표: '📋 표·목록', 기타: '📄 기타',
}
const 제목꼴 = /(평면도|종평면도|종단면도|횡단면도|단면도|구조도|일반도|상세도|표준도|배근도|입면도|배치도|위치도|계획도|현황도|측량도|지형도|조감도|전개도|천장도|골조도|골구도|기초도|단면\s*상세|평면\s*상세|집계표|수량표|목록표?|일람표|조서|표지|범례|도면\s*목록|평면|종단|횡단|측량)\s*(\(\s*\d+\s*\/\s*\d+\s*\)|\d+\s*\/\s*\d+)?\s*$/
/** 박스 이름 → 종류. 파일 이름도 봅니다(박스가 없는 도면). */
export function 도면종류(제목, 파일 = '') {
  const s = String(제목 || '').replace(/\s+/g, '')
  const f = String(파일 || '').replace(/\s+/g, '')
  const 본 = (re) => re.test(s) || (!s && re.test(f))
  if (본(/GPS|측량도|현황측량|지형현황|지형도|측량성과|기준점성과|수준측량/i)) return '측량'
  if (본(/집계|수량표|목록|일람|조서|표지|범례|산출/)) return '표'
  if (본(/횡단/)) return '횡단'
  if (본(/종평면|평면및종단|평[·,]?종단|종[·,]?평면/)) return '종평'
  if (본(/종단/)) return '종단'
  if (본(/(지하|지상|\d)층|옥탑|옥상|입면|천장|창호|기호도|전개도|지붕|주심도|골구조|골조|부재|MEMBER|[정배측]면도|좌측면|우측면/i)) return '건축'
  if (본(/상세|표준|배근|철근|조립도|단면도/)) return '상세'
  /* 🩹 G212 «구조물깨기평면 · 철거계획평면» 은 평면(측량 좌표로 그린 xref) — 구조물 일반도가 아님(현장 A xr-구조물깨기평면) */
  if (본(/깨기|철거/) && 본(/평면|배치/)) return '평면'
  if (본(/구조도|일반도|기초도|구조물/)) return '구조'
  if (본(/평면|배치도|위치도|계획도|현황도/)) return '평면'
  return '기타'
}

/* ── 축에 붙은 긴 선 모으기 · 같은 줄 토막 잇기 ─────────── */
function 축선들(raw, 보임) {
  const H = new Map(), V = new Map()
  const put = (m, k, v) => { let a = m.get(k); if (!a) { a = []; m.set(k, a) } a.push(v) }
  for (const [ly, b] of raw.out) {
    if (보임 && !보임(ly)) continue
    const a = b.pos.a
    for (let i = 0; i < b.pos.n; i += 6) {
      const x0 = a[i], y0 = a[i + 1], x1 = a[i + 3], y1 = a[i + 4]
      const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0)
      if (dy <= 1e-7 * dx && dx > 0) put(H, Math.round(y0 * 1e4), [Math.min(x0, x1), Math.max(x0, x1), y0])
      else if (dx <= 1e-7 * dy && dy > 0) put(V, Math.round(x0 * 1e4), [Math.min(y0, y1), Math.max(y0, y1), x0])
    }
  }
  const 잇기 = (m) => {
    const out = []
    for (const [, a] of m) {
      a.sort((p, q) => p[0] - q[0])
      let c = a[0].slice()
      for (let i = 1; i < a.length; i++) {
        const 틈 = Math.max(1e-6, 1e-3 * (c[1] - c[0]))
        if (a[i][0] <= c[1] + 틈) c[1] = Math.max(c[1], a[i][1])
        else { out.push(c); c = a[i].slice() }
      }
      out.push(c)
    }
    return out
  }
  return { H: 잇기(H), V: 잇기(V) }
}

/** 박스 안 그림·글자 세기용 표본 (선 가운데 점 · 30만 개까지) */
function 표본점(raw, 보임) {
  let n = 0
  for (const [ly, b] of raw.out) if (!보임 || 보임(ly)) n += b.pos.n / 6
  const st = Math.max(1, Math.floor(n / 300000))
  const xs = [], ys = []
  let k = 0
  for (const [ly, b] of raw.out) {
    if (보임 && !보임(ly)) continue
    const a = b.pos.a
    for (let i = 0; i < b.pos.n; i += 6, k++) if (k % st === 0) { xs.push((a[i] + a[i + 3]) / 2); ys.push((a[i + 1] + a[i + 4]) / 2) }
  }
  return { xs, ys, st }
}

/** 축 네모 후보 — 끝이 맞는 가로선 둘 + 그 양끝을 잇는 세로선 둘. 맞는꼴(w,h) 로 비율을 거릅니다. [[x0,y0,x1,y1]] */
function 네모후보들(H, V, 맞는꼴) {
  if (H.length < 2 || V.length < 2) return []
  /* 세로선 — x 로 줄 세워 «그 x 근처» 를 빨리 찾습니다 */
  const Vs = V.slice().sort((p, q) => p[2] - q[2])
  const Vx = Vs.map((v) => v[2])
  const 세로있음 = (x, ya, yb, tol) => {
    let lo = 0, hi = Vx.length
    while (lo < hi) { const m = (lo + hi) >> 1; if (Vx[m] < x - tol) lo = m + 1; else hi = m }
    for (let i = lo; i < Vx.length && Vx[i] <= x + tol; i++) if (Vs[i][0] <= ya + tol && Vs[i][1] >= yb - tol) return true
    return false
  }
  /* 가로선 — 길이 무리(0.4% 칸)로 묶어 «같은 길이 짝» 만 봅니다 */
  const LOG = Math.log(1.004)
  const 무리 = new Map()
  for (const h of H) {
    const L = h[1] - h[0]
    if (!(L > 0)) continue
    const k = Math.round(Math.log(L) / LOG)
    let a = 무리.get(k); if (!a) { a = []; 무리.set(k, a) } a.push(h)
  }
  const cand = []
  let 본 = 0
  outer: for (const [k, a] of 무리) {
    const 짝들 = [...(무리.get(k - 1) || []), ...a, ...(무리.get(k + 1) || [])].sort((p, q) => p[2] - q[2])
    for (const h of a) {
      const w = h[1] - h[0], tol = Math.max(w * 0.004, 1e-6)
      for (const g of 짝들) {
        if (g[2] <= h[2]) continue
        const 높 = g[2] - h[2]
        if (높 > w * 1.55) break
        if (++본 > 6_000_000) break outer
        if (Math.abs(g[0] - h[0]) > tol || Math.abs(g[1] - h[1]) > tol) continue
        if (!맞는꼴(w, 높)) continue
        if (세로있음(h[0], h[2], g[2], tol) && 세로있음(h[1], h[2], g[2], tol)) cand.push([h[0], h[2], h[1], g[2]])
      }
    }
  }
  return cand
}
const 종이비율 = (w, h) => { const q = w / h; return (q > 1.33 && q < 1.52) || (1 / q > 1.33 && 1 / q < 1.52) }

/**
 * 도곽 찾기 — [{x0,y0,x1,y1}] (도면 좌표). 크기를 가리지 않습니다.
 * @param raw  parseDxf(…, {raw:true})
 * @param 보임 (레이어) => bool — 꺼 둔 층(수치지도 등)은 빼고 봅니다
 */
export function 도곽찾기3d(raw, 보임 = null) {
  const { H, V } = 축선들(raw, 보임)
  const cand = 네모후보들(H, V, 종이비율)
  if (!cand.length) return []
  /* 박스 안에 그림·글자가 있나 */
  const P = 표본점(raw, 보임)
  const T = raw.texts || []
  const 안선 = (r) => { let c = 0; for (let i = 0; i < P.xs.length; i++) { const x = P.xs[i], y = P.ys[i]; if (x > r[0] && x < r[2] && y > r[1] && y < r[3]) c++ } return c * P.st }
  const 안글 = (r) => { let c = 0; for (const t of T) if (t.x > r[0] && t.x < r[2] && t.y > r[1] && t.y < r[3]) c++; return c }
  const area = (r) => (r[2] - r[0]) * (r[3] - r[1])
  const 안에 = (r, o) => { const tol = Math.max(o[2] - o[0], o[3] - o[1]) * 0.003; return r[0] >= o[0] - tol && r[1] >= o[1] - tol && r[2] <= o[2] + tol && r[3] <= o[3] + tol }
  const 같음 = (r, o) => { const tol = Math.max(o[2] - o[0], o[3] - o[1]) * 0.003; return Math.abs(r[0] - o[0]) < tol && Math.abs(r[1] - o[1]) < tol && Math.abs(r[2] - o[2]) < tol && Math.abs(r[3] - o[3]) < tol }
  const 하나 = []
  for (const r of cand.sort((p, q) => area(q) - area(p))) if (!하나.some((o) => 같음(r, o))) 하나.push(r)
  const 셈 = new Map()
  const 내용 = (r) => { const k = r.join(','); if (!셈.has(k)) 셈.set(k, { 선: 안선(r), 글: 안글(r) }); return 셈.get(k) }
  let 후보 = 하나.filter((r) => { const c = 내용(r); return c.선 >= 40 && c.글 >= 3 })
  /* 둘레(여러 박스를 둘러싼 큰 네모) 빼기 — 안의 박스들이 그림을 거의 다(85%) 담으면 */
  const 둘레 = new Set()
  for (const o of 후보.slice(0, 40)) {
    const 속 = 후보.filter((r) => r !== o && area(r) < area(o) * 0.9 && 안에(r, o))
    const 바깥들 = 속.filter((r) => !속.some((t) => t !== r && area(t) > area(r) && 안에(r, t)))
    if (바깥들.length < 2) continue
    const 전체 = 내용(o).선
    const 담음 = 바깥들.reduce((s, r) => s + 내용(r).선, 0)
    if (전체 > 0 && 담음 >= 전체 * 0.85) 둘레.add(o)
  }
  후보 = 후보.filter((r) => !둘레.has(r))
  /* 안쪽 테두리 · 박스 속 표 → 바깥 것만 */
  const out = []
  for (const r of 후보) if (!out.some((o) => 안에(r, o))) out.push(r)
  return out.map((r) => ({ x0: r[0], y0: r[1], x1: r[2], y1: r[3] }))
}

/* ── 박스 이름 ───────────────────────────── */
const 붙 = (s) => String(s ?? '').replace(/\s+/g, '')
/* 도면 이름 꼴 — 띄어 쓴 «주 심 도» · 뒤에 붙은 «(X3열)» «(1/2)» 를 떼고 «…도 · …표 · …도면» 으로 끝나는 짧은 글 */
const 이름꼴 = (s) => {
  const c = 붙(s).replace(/(\([^()]*\))+$/, '')
  if (c.length < 2 || c.length > 32) return false
  if (/^(경기|강원|충청[남북]|전라[남북]|경상[남북]|제주|전[남북]|경[남북]|충[남북])도$/.test(c)) return false
  if (/^[\d.,:/=+-]+$/.test(c)) return false
  if (/^(제도|설계|검토|확인|승인|주용도|용도|도면번호|도번|도면|축척|도|지도|약도|위도|경도|온도|정도|속도|강도|밀도|빈도|구배도|경사도)$/.test(c)) return false
  return /(도|표|도면|목록|조서)$/.test(c) || 제목꼴.test(s.trim())
}
/** 박스 안 글자에서 도면 이름 — 이름꼴 가운데 가장 큰 글자, 없으면 «도면명 · SHEET TITLE» 칸 옆 글자 */
export function 박스제목(texts, r) {
  const 안 = texts.filter((t) => t.x > r.x0 && t.x < r.x1 && t.y > r.y0 && t.y < r.y1)
  const 후 = 안.filter((t) => 이름꼴(t.s)).sort((a, b) => (b.h || 0) - (a.h || 0))
  if (후.length) return 후[0].s.trim().replace(/\s{2,}/g, ' ')
  const 칸 = 안.find((t) => /^(도면명|도명|TITLE|DRAWINGTITLE|SHEETTITLE)$/i.test(붙(t.s)))
  if (칸) {
    const 옆 = 안.filter((t) => t !== 칸 && Math.abs(t.y - 칸.y) < 3 * (칸.h || 1) && t.x > 칸.x - 2 * (칸.h || 1) && t.s.trim().length >= 2 && !/^(도면명|도명|TITLE|DRAWINGTITLE|SHEETTITLE)$/i.test(붙(t.s)))
      .sort((a, b) => Math.hypot(a.x - 칸.x, a.y - 칸.y) - Math.hypot(b.x - 칸.x, b.y - 칸.y))
    if (옆.length) return 옆[0].s.trim()
  }
  return ''
}
/** «…횡단면도(3/11)» → «…횡단면도» (같은 노선 박스 묶기) */
export const 묶음이름 = (제목) => String(제목 || '').replace(/\s*\(?\s*\d+\s*\/\s*\d+\s*\)?\s*$/, '').replace(/\s+/g, ' ').trim()

/* ── 나누기 ─────────────────────────────── */
const 새버킷 = () => ({ pos: new F64(256), col: new U8(256), pts: new F64(64), pcol: new U8(64) })
/** 빈 조각 도면 */
export function 빈도면(raw) {
  return { out: new Map(), texts: [], layerInfo: raw.layerInfo, stats: { ...raw.stats, skipped: {}, unknown: {}, segs: 0, pts: 0, ents: 0 } }
}
/**
 * 도면을 네모들로 나눕니다 — 선은 가운데 점이, 점·글자는 그 자리가 든 네모로. 어느 네모에도 안 든 것은 «밖».
 * @param 네모들 [{x0,y0,x1,y1}] (겹치지 않는다고 봄 — 먼저 든 쪽)
 * @returns { 조각: [raw…] (네모 차례), 밖: raw }
 */
export function 네모로나누기(raw, 네모들) {
  const 조각 = 네모들.map(() => 빈도면(raw))
  const 밖 = 빈도면(raw)
  let X0 = Infinity, Y0 = Infinity, X1 = -Infinity, Y1 = -Infinity
  for (const r of 네모들) { X0 = Math.min(X0, r.x0); Y0 = Math.min(Y0, r.y0); X1 = Math.max(X1, r.x1); Y1 = Math.max(Y1, r.y1) }
  const 어디 = (x, y) => {
    if (x < X0 || x > X1 || y < Y0 || y > Y1) return -1
    for (let k = 0; k < 네모들.length; k++) { const r = 네모들[k]; if (x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1) return k }
    return -1
  }
  const 통 = (d, ly) => { let b = d.out.get(ly); if (!b) { b = 새버킷(); d.out.set(ly, b) } return b }
  for (const [ly, b] of raw.out) {
    const a = b.pos.a, c = b.col.a
    for (let i = 0; i < b.pos.n; i += 6) {
      const k = 어디((a[i] + a[i + 3]) / 2, (a[i + 1] + a[i + 4]) / 2)
      const d = k < 0 ? 밖 : 조각[k]
      const t = 통(d, ly)
      t.pos.push6(a[i], a[i + 1], a[i + 2], a[i + 3], a[i + 4], a[i + 5])
      t.col.push3(c[i], c[i + 1], c[i + 2]); t.col.push3(c[i + 3], c[i + 4], c[i + 5])
      d.stats.segs++
    }
    const p = b.pts.a, pc = b.pcol.a
    for (let i = 0; i < b.pts.n; i += 3) {
      const k = 어디(p[i], p[i + 1])
      const d = k < 0 ? 밖 : 조각[k]
      const t = 통(d, ly)
      t.pts.push3(p[i], p[i + 1], p[i + 2]); t.pcol.push3(pc[i], pc[i + 1], pc[i + 2])
      d.stats.pts++
    }
  }
  for (const t of raw.texts || []) { const k = 어디(t.x, t.y); (k < 0 ? 밖 : 조각[k]).texts.push(t) }
  return { 조각, 밖 }
}

/** 조각 도면들 합치기 (같은 노선의 횡단면도 박스들 → 한 도면) */
export function 도면합치기(목록) {
  if (!목록.length) return null
  const d = 빈도면(목록[0])
  for (const r of 목록) {
    for (const [ly, b] of r.out) {
      let t = d.out.get(ly); if (!t) { t = 새버킷(); d.out.set(ly, t) }
      for (let i = 0; i < b.pos.n; i += 3) t.pos.push3(b.pos.a[i], b.pos.a[i + 1], b.pos.a[i + 2])
      for (let i = 0; i < b.col.n; i += 3) t.col.push3(b.col.a[i], b.col.a[i + 1], b.col.a[i + 2])
      for (let i = 0; i < b.pts.n; i += 3) t.pts.push3(b.pts.a[i], b.pts.a[i + 1], b.pts.a[i + 2])
      for (let i = 0; i < b.pcol.n; i += 3) t.pcol.push3(b.pcol.a[i], b.pcol.a[i + 1], b.pcol.a[i + 2])
    }
    d.texts.push(...r.texts)
    d.stats.segs += r.stats.segs || 0; d.stats.pts += r.stats.pts || 0
  }
  return d
}

/* ── 종평면도 박스 → 위(평면) · 아래(종단) ─────────── */
const 표머리 = /^(측점|지반고|계획고|누가거리|추가거리|점간거리|단거리|절토고|성토고|관저고|토피|구배|경사|곡선|기울기|지반|계획|누가|점간|거리)$/
const 평면글 = (s) => /^(NO|STA)\.?\d/i.test(붙(s)) || /^(산)?\d{1,5}(-\d{1,4})?[가-힣]{1,2}$/.test(붙(s))
/**
 * 종평면도 박스 안에서 평면 부분 네모 — 박스 안의 큰 네모(평면 테두리) 가운데, 측점·지번 글자가 가장 많고
 * «측점 · 지반고 · 계획고» 같은 표 머리 글자가 없는 것. 테두리가 없으면 박스 폭을 가로지르는 긴 가로선으로 띠를 나눠 봅니다.
 * ⚠️ 소장님 도면 08: 노선이 짧은 박스는 평면 테두리 폭이 박스의 46% 뿐이라 «박스 폭 80% 가로선» 으로는 못 나눴습니다(시험으로 확인).
 * @returns {x0,y0,x1,y1} | null
 */
export function 평면칸(raw, r) {
  const W = r.x1 - r.x0, Hh = r.y1 - r.y0
  const { H, V } = 축선들(raw, null)
  const 점수 = (c) => {
    let s = 0
    const 머리들 = new Set()
    for (const t of raw.texts) {
      if (t.x <= c.x0 || t.x >= c.x1 || t.y <= c.y0 || t.y >= c.y1) continue
      if (표머리.test(붙(t.s))) { s -= 5; 머리들.add(붙(t.s)) }
      else if (평면글(t.s)) s += 1
    }
    /* 표 머리가 둘 넘게(측점 · 지반고 · 계획고 …) 들어 있으면 평면이 아님 — 종단 표의 «측점» 줄(NO.0 · NO.1 …)이 평면 글자로 세어져
       표까지 품은 큰 네모가 평면으로 뽑혔습니다(G138 시험 도면으로 확인) */
    return 머리들.size >= 2 ? -Infinity : s
  }
  let best = null, bs = 2
  /* ① 박스 안 큰 네모(가로 30%·세로 15% 넘고 박스 자신은 아님) */
  const 네모 = 네모후보들(H, V, (w, h) => w >= W * 0.3 && h >= Hh * 0.15 && w * h < W * Hh * 0.9)
  for (const q of 네모) {
    const c = { x0: q[0], y0: q[1], x1: q[2], y1: q[3] }
    if (c.x0 < r.x0 - W * 0.01 || c.x1 > r.x1 + W * 0.01 || c.y0 < r.y0 - Hh * 0.01 || c.y1 > r.y1 + Hh * 0.01) continue
    const s = 점수(c)
    if (s > bs) { bs = s; best = c }
  }
  if (best) return best
  /* ② 띠 — 박스 폭 80% 넘는 가로선으로 나눔 */
  const ys = []
  for (const l of H) {
    if (l[1] - l[0] < W * 0.8) continue
    if (l[0] < r.x0 - W * 0.01 || l[1] > r.x1 + W * 0.01) continue
    if (l[2] <= r.y0 + Hh * 0.02 || l[2] >= r.y1 - Hh * 0.02) continue
    ys.push(l[2])
  }
  ys.sort((a, b) => a - b)
  const 줄 = [r.y0, ...ys.filter((y, i) => i === 0 || y - ys[i - 1] > Hh * 0.03), r.y1]
  for (let i = 0; i + 1 < 줄.length; i++) {
    const c = { x0: r.x0, y0: 줄[i], x1: r.x1, y1: 줄[i + 1] }
    if (c.y1 - c.y0 < Hh * 0.15) continue
    const s = 점수(c)
    if (s > bs) { bs = s; best = c }
  }
  return best
}

/* ── 도면 단위 → mm 배수 ───────────────────── */
/**
 * ⚠️ 도면 머리의 단위(INSUNITS)는 믿을 수 없습니다(소장님 도면 7장 모두 «mm» 로 적혀 있지만 4장은 m 로 그림).
 * 그래서 ① 글자 높이(가운데 값) ② 좌표 크기를 봅니다.
 *   글자 20 넘음 → mm(건축 1/100: 글자 180) · 글자 1.5 아래 → m(측량·종평: 0.3)
 *   그 사이(02 계획평면도: 글자 7 · 좌표 28만)는 좌표 크기로 — 3만~300만 이면 m(측량 좌표·km 단위 도면), 3천만 넘으면 mm
 * @returns {배, 근거}
 */
export function 도면단위배(raw, 도곽들 = null) {
  /* 도곽이 있으면 그 폭이 가장 믿을 만합니다 — 종이(A1 841 · A3 420 mm)를 축척만큼 키운 것이라
     m 로 그린 도면은 수십~수천(1/100 → 84.1 · 1/1000 → 841), mm 로 그린 도면은 수만 넘음(1/100 → 84,100) */
  if (도곽들 && 도곽들.length) {
    const ws = 도곽들.map((r) => Math.max(r.x1 - r.x0, r.y1 - r.y0)).sort((a, b) => a - b)
    const w = ws[ws.length >> 1]
    if (w < 5000) return { 배: 1000, 근거: '도곽 폭 ' + w.toFixed(0) + ' → m' }
    if (w > 20000) return { 배: 1, 근거: '도곽 폭 ' + Math.round(w).toLocaleString() + ' → mm' }
  }
  const hs = (raw.texts || []).map((t) => t.h || 0).filter((v) => v > 0).sort((a, b) => a - b)
  const h = hs.length >= 5 ? hs[Math.floor(hs.length / 2)] : NaN
  if (h >= 20) return { 배: 1, 근거: '글자 높이 ' + h.toFixed(0) + ' → mm' }
  if (h < 1.5) return { 배: 1000, 근거: '글자 높이 ' + h.toFixed(2) + ' → m' }
  const xs = []
  for (const [ly, b] of raw.out) {
    const info = raw.layerInfo && raw.layerInfo.get(ly)
    if (info && info.off) continue
    const st = Math.max(6, Math.floor(b.pos.n / 2000 / 6) * 6)
    for (let i = 0; i < b.pos.n; i += st) xs.push(Math.max(Math.abs(b.pos.a[i]), Math.abs(b.pos.a[i + 1])))
  }
  xs.sort((a, b) => a - b)
  const x = xs.length ? xs[xs.length >> 1] : NaN
  if (x >= 3e4 && x <= 3e6) return { 배: 1000, 근거: '좌표 크기 ' + Math.round(x).toLocaleString() + ' → m' }
  if (x >= 3e7) return { 배: 1, 근거: '좌표 크기 → mm' }
  const u = raw.stats && raw.stats.units
  return { 배: u === 6 ? 1000 : u === 5 ? 10 : 1, 근거: '도면 머리 단위' }
}

/** 측량도면처럼 보이나 — 측량점(높이 든 점) · 측량점 번호/표고 글자 레이어가 많음 */
export function 측량다움(raw) {
  let 글 = 0, 점 = 0
  for (const t of raw.texts || []) if (/point|pnt|elev|측량점|표고점|지반고점/i.test(t.ly || '')) 글++
  for (const [, b] of raw.out) for (let i = 2; i < b.pts.n; i += 3) if (b.pts.a[i] !== 0) 점++
  return 글 >= 60 || 점 >= 60
}

/**
 * 도곽 테두리 · 안쪽 테두리 · 표제란 윗줄 빼기 — 종이 테두리가 땅 위에 큰 네모로 떠서 3D 화면만 어지럽혔습니다(시험으로 확인).
 * 박스 가장자리에서 10% 안에 있고 그 변 길이의 절반 넘게 뻗은 가로 · 세로선. (그 도면 그대로 고침)
 * ⚠️ 횡단 · 구조물 세우기에는 쓰지 않습니다 — 그쪽은 도곽 선으로 단면 자리를 찾습니다.
 */
export function 테두리빼기(raw, r) {
  const w = r.x1 - r.x0, h = r.y1 - r.y0
  const 테두리선 = (x0, y0, x1, y1) => {
    if (Math.abs(y1 - y0) <= 1e-7 * w && Math.abs(x1 - x0) > 0.5 * w) return y0 - r.y0 < 0.1 * h || r.y1 - y0 < 0.1 * h
    if (Math.abs(x1 - x0) <= 1e-7 * h && Math.abs(y1 - y0) > 0.5 * h) return x0 - r.x0 < 0.1 * w || r.x1 - x0 < 0.1 * w
    return false
  }
  let 뺌 = 0
  for (const [, b] of raw.out) {
    const a = b.pos.a, c = b.col.a
    let j = 0
    for (let i = 0; i < b.pos.n; i += 6) {
      if (테두리선(a[i], a[i + 1], a[i + 3], a[i + 4])) { 뺌++; continue }
      if (j !== i) { for (let k = 0; k < 6; k++) { a[j + k] = a[i + k]; c[j + k] = c[i + k] } }
      j += 6
    }
    b.pos.n = j; b.col.n = j
  }
  return 뺌
}
