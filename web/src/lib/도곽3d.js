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
  /* 🧭 G240 영어 판 이름(현장 C · D 토목 통합본 «ROAD PAVEMENT & DRAINAGE LAY OUT» · «FOOTING DETAIL PLAN & SECTION-1» · «BEAM LIST-1») 도 같은 차례로 */
  if (본(/GPS|측량도|현황측량|지형현황|지형도|측량성과|기준점성과|수준측량|SURVEY|TOPOGRAPH/i)) return '측량'
  if (본(/집계|수량표|목록|목차|차례|일람|조서|표지|범례|산출|면적표|산정표|마감표|개요|내역|구적|일반사항|LIST$|LIST-?\d|SCHEDULE|INDEX|GENERALNOTE/i)) return '표'
  if (본(/횡단|CROSSSECTION/i)) return '횡단'
  if (본(/종평면|평면및종단|평[·,]?종단|종[·,]?평면|PLAN&PROFILE|PLANANDPROFILE/i)) return '종평'
  if (본(/종단|PROFILE|LONGITUDINAL/i)) return '종단'
  /* 🧭 G241 건물 도면 말 더함 — 구조 평면 · 층 표시 «(1F)» · 건물 주제 평면(방수 · 단열 · 방화구획 · 조적벽 · 천정 · 재료분리 · 부설물) */
  if (본(/(지하|지상|\d)층|옥탑|옥상|입면|천장|천정|창호|기호도|전개도|지붕|주심도|골구조|골구도|골조|부재|구조평면|구조확대평면|ROOF|방수계획|단열계획|방화구획|조적벽|재료분리|부설물|MEMBER|[정배측]면도|좌측면|우측면|ELEVATION|FLOORPLAN|ROOFPLAN|STRUCTURAL|(^|[^A-Z])B?\d{1,2}F($|[^A-Z])/i)) return '건축'
  if (본(/상세|표준|배근|철근|조립도|단면도|하지도|DETAIL|SECTION|TYPICAL|STANDARD|REBAR/i)) return '상세'
  /* 🩹 G212 «구조물깨기평면 · 철거계획평면» 은 평면(측량 좌표로 그린 xref) — 구조물 일반도가 아님(현장 A xr-구조물깨기평면) */
  if (본(/깨기|철거/) && 본(/평면|배치/)) return '평면'
  if (본(/구조도|일반도|기초도|구조물/)) return '구조'
  if (본(/평면|배치도|위치도|계획도|현황도|지적도|PLAN|LAYOUT|ARRANGEMENT|KEYMAP|SITEMAP/i)) return '평면'
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
  /* 🧭 G241 선이 다 찬 뒤 · 다시 읽기 범위 밖의 가로 · 세로 선(raw.틀선 — 판 테두리용) */
  const F = raw.틀선
  if (F && F.n) for (let i = 0; i < F.n; i += 4) {
    const x0 = F.a[i], y0 = F.a[i + 1], x1 = F.a[i + 2], y1 = F.a[i + 3]
    const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0)
    if (dy <= 1e-7 * dx && dx > 0) put(H, Math.round(y0 * 1e4), [Math.min(x0, x1), Math.max(x0, x1), y0])
    else if (dx <= 1e-7 * dy && dy > 0) put(V, Math.round(x0 * 1e4), [Math.min(y0, y1), Math.max(y0, y1), x0])
  }
  /* 🧭 G241 판이 서로 맞붙어 있으면(현장 C · D 건축 통합본: 옆 판 테두리가 같은 줄에 이어짐) 이은 선이 여러 판에 걸쳐 판 하나의 네모가 안 나옴
       → 이은 선과 함께 «이어 붙기 전 토막»(이은 선의 3 % 넘는 것 · 64 개까지 · 같은 토막은 한 번)도 둠 */
  const 잇기 = (m) => {
    const out = []
    for (const [, a] of m) {
      a.sort((p, q) => p[0] - q[0])
      let c = a[0].slice(), 토막 = [a[0]]
      const 내기 = () => {
        out.push(c)
        if (토막.length < 2) return
        const 본 = new Set(), 짧 = 0.03 * (c[1] - c[0])
        let n = 0
        for (const p of 토막) {
          if (p[1] - p[0] < 짧 || (p[0] === c[0] && p[1] === c[1])) continue
          const k = p[0] + ',' + p[1]
          if (본.has(k)) continue
          본.add(k); out.push(p.slice())
          if (++n >= 64) break
        }
      }
      for (let i = 1; i < a.length; i++) {
        const 틈 = Math.max(1e-6, 1e-3 * (c[1] - c[0]))
        if (a[i][0] <= c[1] + 틈) { c[1] = Math.max(c[1], a[i][1]); 토막.push(a[i]) }
        else { 내기(); c = a[i].slice(); 토막 = [a[i]] }
      }
      내기()
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
  /* 🧭 G241 판 181 장 · 선 백만 개 넘는 통합본에서 «짝 보기 600만 번» 에 걸려 판이 빠졌음 → 같은 길이 무리 안에서 왼끝 x 칸으로 나누고 y 로 줄 세워 바로 찾음 */
  outer: for (const [k, a] of 무리) {
    const 짝들 = [...(무리.get(k - 1) || []), ...a, ...(무리.get(k + 1) || [])]
    const 칸폭 = Math.max(Math.exp(k * LOG) * 0.004, 1e-6)
    const 칸 = new Map()
    for (const g of 짝들) { const c = Math.round(g[0] / 칸폭); let l = 칸.get(c); if (!l) { l = []; 칸.set(c, l) } l.push(g) }
    for (const l of 칸.values()) l.sort((p, q) => p[2] - q[2])
    for (const h of a) {
      const w = h[1] - h[0], tol = Math.max(w * 0.004, 1e-6)
      const c0 = Math.round(h[0] / 칸폭)
      for (let c = c0 - 2; c <= c0 + 2; c++) {
        const l = 칸.get(c)
        if (!l) continue
        let lo = 0, hi = l.length
        while (lo < hi) { const m = (lo + hi) >> 1; if (l[m][2] <= h[2]) lo = m + 1; else hi = m }
        for (let i = lo; i < l.length; i++) {
          const g = l[i]
          const 높 = g[2] - h[2]
          if (높 > w * 1.55) break
          if (++본 > 30_000_000) { 네모후보들.넘침 = true; break outer }
          if (Math.abs(g[0] - h[0]) > tol || Math.abs(g[1] - h[1]) > tol) continue
          if (!맞는꼴(w, 높)) continue
          if (세로있음(h[0], h[2], g[2], tol) && 세로있음(h[1], h[2], g[2], tol)) cand.push([h[0], h[2], h[1], g[2]])
        }
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
  const F = raw.틀선
  네모후보들.넘침 = false
  const cand = 네모후보들(H, V, 종이비율)
  if (네모후보들.넘침 && raw.stats) raw.stats.네모넘침 = true
  if (!cand.length) return []
  /* 박스 안에 그림·글자가 있나 */
  const P = 표본점(raw, 보임)
  const T = raw.texts || []
  /* 🧭 G241 판 후보가 수천 개(통합본)라 «박스 안 점 세기» 를 x 로 줄 세운 점에서 x 구간만 봄 — 현장 C · D 건축 통합본 80 초 → 몇 초 */
  const x줄 = (xs, ys) => { const ix = Array.from(xs.keys()).sort((p, q) => xs[p] - xs[q]); return { x: Float64Array.from(ix, (i) => xs[i]), y: Float64Array.from(ix, (i) => ys[i]) } }
  const 줄세기 = (S, r) => {
    let lo = 0, hi = S.x.length
    while (lo < hi) { const m = (lo + hi) >> 1; if (S.x[m] <= r[0]) lo = m + 1; else hi = m }
    let c = 0
    for (let i = lo; i < S.x.length && S.x[i] < r[2]; i++) { const y = S.y[i]; if (y > r[1] && y < r[3]) c++ }
    return c
  }
  const P줄 = x줄(P.xs, P.ys), T줄 = x줄(T.map((t) => t.x), T.map((t) => t.y))
  const 안선 = (r) => 줄세기(P줄, r) * P.st
  const 안글 = (r) => 줄세기(T줄, r)
  const area = (r) => (r[2] - r[0]) * (r[3] - r[1])
  const 안에 = (r, o) => { const tol = Math.max(o[2] - o[0], o[3] - o[1]) * 0.003; return r[0] >= o[0] - tol && r[1] >= o[1] - tol && r[2] <= o[2] + tol && r[3] <= o[3] + tol }
  const 같음 = (r, o) => { const tol = Math.max(o[2] - o[0], o[3] - o[1]) * 0.003; return Math.abs(r[0] - o[0]) < tol && Math.abs(r[1] - o[1]) < tol && Math.abs(r[2] - o[2]) < tol && Math.abs(r[3] - o[3]) < tol }
  const 하나 = []
  /* 같은 네모 한 번 — 크기의 0.3 % 칸으로 반올림한 열쇠(후보 수만 개라 하나하나 견주면 느림 · 경계에 걸린 겹친 것은 아래 «바깥 것만» 에서 빠짐) */
  const 본열쇠 = new Set()
  for (const r of cand.sort((p, q) => area(q) - area(p))) {
    const q = 0.003 * Math.max(r[2] - r[0], r[3] - r[1]) || 1e-9
    const k = Math.round(r[0] / q) + ',' + Math.round(r[1] / q) + ',' + Math.round(r[2] / q) + ',' + Math.round(r[3] / q)
    if (본열쇠.has(k)) continue
    본열쇠.add(k); 하나.push(r)
  }
  void 같음
  const 셈 = new Map()
  const 내용 = (r) => { const k = r.join(','); if (!셈.has(k)) 셈.set(k, { 선: 안선(r), 글: 안글(r) }); return 셈.get(k) }
  /* 🧭 G241 선을 끝까지 못 읽은 큰 통합본 — 뒤쪽 판은 선이 없고 글자만 있음 → 판 테두리 안에 글자 10개 넘으면 판 */
  const 덜읽음 = !!(F && F.n && raw.stats && (raw.stats.capped || raw.stats.범위밖))
  /* 🧭 G246 덜 읽은 판(모양 없음 · 글자 10개 넘음)은 A 종이 비율(√2 ± 3 %)만 — 격자선 · 표가 만든 4:3 · 3:2 네모(현장 D 7.2 × 5.4 m 등)는 판이 아님 */
  const A꼴 = (r) => { const q = Math.max(r[2] - r[0], r[3] - r[1]) / Math.max(1e-9, Math.min(r[2] - r[0], r[3] - r[1])); return q > 1.37 && q < 1.46 }
  const 기본 = (c, r) => (c.선 >= 40 && c.글 >= 3) || (덜읽음 && c.글 >= 10 && (!r || A꼴(r)))
  let 후보 = 하나.filter((r) => 기본(내용(r), r))
  /* 🧭 G246 글만 가득한 판(현장 A «구조일반사항-3»: 테두리 · 표제란 선 39 · 글 104) — 글자 30 넘고 선이 조금(4) 있으면 판.
       단 ① 다른 네모 안에 든 것(표제란 칸 · 판 안 글 상자)은 아님 → 맨 바깥 것만 ② 다른 판이 있으면 그 판들과 같은 크기(1 %)만
       (현장 G 옹벽: 판 밖 글 상자 7.7 × 5.7 m 가 판이 됐었음) ③ 다른 판이 없으면(목차 한 장) 서로 걸친 것은 뺌 */
  {
    const 글만 = 하나.filter((r) => { const c = 내용(r); return !기본(c, r) && c.글 >= 30 && c.선 >= 4 })
    if (글만.length) {
      const 모두 = 후보.concat(글만)
      let 더 = 글만.filter((r) => !모두.some((o) => o !== r && area(o) > area(r) && 안에(r, o)))
      const 판들 = 후보.filter((r) => !후보.some((o) => o !== r && area(o) > area(r) && 안에(r, o)))
      const 같은크기 = (r) => 판들.some((o) => Math.abs((r[2] - r[0]) / (o[2] - o[0]) - 1) < 0.01 && Math.abs((r[3] - r[1]) / (o[3] - o[1]) - 1) < 0.01)
      if (판들.length) 더 = 더.filter(같은크기)
      else {
        const 걸 = (a, b) => !안에(a, b) && !안에(b, a) && Math.min(a[2], b[2]) > Math.max(a[0], b[0]) && Math.min(a[3], b[3]) > Math.max(a[1], b[1])
        더 = 더.filter((r) => !더.some((o) => o !== r && 걸(r, o)))
      }
      if (더.length) 후보 = 후보.concat(더).sort((p, q) => area(q) - area(p))
    }
  }
  /* 둘레(여러 박스를 둘러싼 큰 네모) 빼기 — 안의 박스들이 그림을 거의 다(85%) 담으면 */
  const 둘레 = new Set()
  const 걸침 = (a, b) => Math.min(a[2], b[2]) > Math.max(a[0], b[0]) && Math.min(a[3], b[3]) > Math.max(a[1], b[1])
  /* 박스 여럿 «어느 하나에라도 든» 선 수(한 번씩) */
  const 합집세기 = (rs, o) => {
    const S = P줄
    let lo = 0, hi = S.x.length, c = 0
    while (lo < hi) { const m = (lo + hi) >> 1; if (S.x[m] <= o[0]) lo = m + 1; else hi = m }
    for (let i = lo; i < S.x.length && S.x[i] < o[2]; i++) {
      const x = S.x[i], y = S.y[i]
      if (!(y > o[1] && y < o[3])) continue
      for (const r of rs) if (x > r[0] && x < r[2] && y > r[1] && y < r[3]) { c++; break }
    }
    return c * P.st
  }
  /* 서로 걸친 박스끼리 한 무리 — 무리 수 */
  const 무리수 = (rs) => {
    const 부모 = rs.map((_, i) => i)
    const 뿌리 = (i) => { while (부모[i] !== i) i = 부모[i] = 부모[부모[i]]; return i }
    for (let i = 0; i < rs.length; i++) for (let j = i + 1; j < rs.length; j++) if (걸침(rs[i], rs[j])) 부모[뿌리(i)] = 뿌리(j)
    return new Set(rs.map((_, i) => 뿌리(i))).size
  }
  for (const o of 후보.slice(0, 40)) {
    const 속 = 후보.filter((r) => r !== o && area(r) < area(o) * 0.9 && 안에(r, o))
    /* 🧭 G246 안의 박스끼리 서로 걸치면(현장 A 일반사항 판의 표: 줄마다 종이 비율 네모가 수십 개 · 서로 걸침) 더하면 같은 선을 여러 번 세어
         판 테두리를 «둘레» 로 보고 뺐음(판 4장 빠짐 · 표 하나뿐인 일람표 판도) → 걸치면 «어느 하나에라도 든 선» 을 한 번만 세고,
         서로 걸친 박스 다섯 넘게가 한 무리뿐이고 그 무리가 작으면(네모 넓이의 반 아래 — 판 속 표의 줄 네모들) 둘레가 아님
         (현장 C 토목: 실제 크기 배치도의 큰 네모 셋이 걸쳐 있고 그것을 싼 헛 네모 «SITE PLAN» 은 예전처럼 둘레로 뺌) */
    const 바깥들 = 속.filter((r) => !속.some((t) => t !== r && area(t) > area(r) && 안에(r, t)))
    if (바깥들.length < 2) continue
    const 겹친다 = 바깥들.some((r, i) => 바깥들.some((t, j) => j > i && 걸침(r, t)))
    if (겹친다 && 바깥들.length >= 5 && 무리수(바깥들) < 2) {
      const 무 = [Math.min(...바깥들.map((r) => r[0])), Math.min(...바깥들.map((r) => r[1])), Math.max(...바깥들.map((r) => r[2])), Math.max(...바깥들.map((r) => r[3]))]
      if (area(무) < 0.5 * area(o)) continue
    }
    const 전체 = 내용(o).선
    const 담음 = 겹친다 ? 합집세기(바깥들, o) : 바깥들.reduce((s, r) => s + 내용(r).선, 0)
    if (전체 > 0 && 담음 >= 전체 * 0.85) 둘레.add(o)
  }
  /* 🧭 G241 맞붙은 판 — 판 테두리가 맞닿으면(현장 C · D 건축 «확대평면도» 2×2 · 현장 F A3 판 셋 세로로) 판 둘이 모인 네모도 종이 비율(A3 둘 = A2)이라
       판 여럿을 한 판으로 봤음 → 안쪽 판(둘 넘게, 하나는 75 % 보다 작게)이 그 네모를 92 % 넘게 빈틈없이 덮으면 모인 네모(둘레)로 뺌.
       표 · 그림 칸은 판 둘레 여백 · 표제란이 남아 이렇게 덮지 못함. 작은 것부터(모인 네모 속 모인 네모) */
  const 작은차례 = 후보.slice().sort((p, q) => area(p) - area(q))
  for (const o of 작은차례) {
    if (둘레.has(o)) continue
    const 속 = 후보.filter((r) => r !== o && !둘레.has(r) && area(r) < area(o) * 0.75 && 안에(r, o))
    if (속.length < 2) continue
    const 바깥들 = 속.filter((r) => !속.some((t) => t !== r && area(t) > area(r) && 안에(r, t)))
    if (바깥들.length < 2) continue
    let 덮 = 0
    const N = 24
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const x = o[0] + ((i + 0.5) / N) * (o[2] - o[0]), y = o[1] + ((j + 0.5) / N) * (o[3] - o[1])
      if (바깥들.some((r) => x >= r[0] && x <= r[2] && y >= r[1] && y <= r[3])) 덮++
    }
    if (덮 >= 0.92 * N * N) 둘레.add(o)
  }
  후보 = 후보.filter((r) => !둘레.has(r))
  /* 🧭 G241 겹쳐 쌓인 헛 네모 — 판 테두리는 서로 걸쳐 겹치지 않음. 촘촘한 평행선(현장 B 배치도: 2.5 간격 줄 60여 개)이 만든 네모는
       제 넓이의 30 % 넘게 걸친(품지 않고) 네모가 둘 넘음 → 뺌 (판 안에 걸친 작은 헛 네모 때문에 판이 빠지지 않게 «제 넓이» 로 잼) */
  const 걸친몫 = (a, b) => { if (안에(a, b) || 안에(b, a)) return 0; const w = Math.min(a[2], b[2]) - Math.max(a[0], b[0]), h = Math.min(a[3], b[3]) - Math.max(a[1], b[1]); return w > 0 && h > 0 ? (w * h) / area(a) : 0 }
  /* 🧭 G246 제 넓이의 30 % 보다 작은 네모가 걸친 것은 세지 않음 — 현장 D 건축 A94 판(16 × 11 m)에 격자선 네모(14 × 9.6 m · 7 × 4.8 m)가 걸쳐 판이 빠졌음
       (현장 B 촘촘한 평행선 네모는 서로 크기가 같아 그대로 빠짐) */
  /* 🧭 G246 덜 읽은 큰 도면(모양을 못 담은 판)에서는 선이 하나도 없는 네모(글자만으로 든 격자선 네모)가 판을 빼지 못하게 — 현장 D A94-001 */
  const 셀네모 = (o) => !덜읽음 || 내용(o).선 > 0
  후보 = 후보.filter((r) => 후보.filter((o) => o !== r && 셀네모(o) && area(o) >= 0.3 * area(r) && 걸친몫(r, o) > 0.3).length < 2)
  /* 🧭 G241 판을 품고 옆 판에 걸친 큰 네모(현장 A 흙막이: 판 84 m 간격에 «0현황» 층 102 m 네모 — 판 하나 + 옆 판 자락) —
       걸친 짝 가운데 «짝과 같은 크기(0.8 ~ 1.25 배)의 판» 을 품은 쪽이 겉싸개 → 뺌 (판의 안쪽 테두리는 짝보다 훨씬 작아 판은 남음) */
  {
    const 품은크기 = (A, B) => 후보.some((C) => C !== A && 안에(C, A) && area(C) >= 0.8 * area(B) && area(C) <= 1.25 * area(B))
    const 뺌 = new Set()
    for (let i = 0; i < 후보.length; i++) for (let j = i + 1; j < 후보.length; j++) {
      const A = 후보[i], B = 후보[j]
      if (!(Math.max(걸친몫(A, B), 걸친몫(B, A)) > 0.05)) continue
      /* 🧭 G246 겉싸개와 판은 크기가 비슷함(현장 A 102 m · 84 m) — 판 테두리에 걸친 작은 네모(현장 D 건축: 줄눈 · 격자선이 판 밖까지 나가 생긴 7.5 × 10 m)
           때문에 판(48.8 × 34 m)이 겉싸개로 빠지지 않게 */
      if (Math.min(area(A), area(B)) < 0.3 * Math.max(area(A), area(B))) continue
      const wA = 품은크기(A, B), wB = 품은크기(B, A)
      if (wA && !wB) 뺌.add(A)
      else if (wB && !wA) 뺌.add(B)
    }
    후보 = 후보.filter((r) => !뺌.has(r))
  }
  /* 🧭 G246 덜 읽은 큰 도면(점이 다 차 모양을 못 담은 판)은 글자만으로 판을 고르니, 판 테두리에 걸친 작은 네모(격자선 · 줄눈이 만든 것)도 판이 됨
       → 제 넓이의 두 배 넘는 판에 걸친(품기지 않고) 네모는 뺌 — 판 테두리는 서로 걸치지 않음 */
  if (덜읽음) {
    const 큰걸침 = (r) => 후보.some((o) => o !== r && area(o) > 2 * area(r) && 걸친몫(r, o) > 0)
    후보 = 후보.filter((r) => !큰걸침(r))
  }
  /* 안쪽 테두리 · 박스 속 표 → 바깥 것만 */
  const out = []
  for (const r of 후보) if (!out.some((o) => 안에(r, o))) out.push(r)
  /* 🧭 G241 맞붙은 판(옆 판과 테두리를 같이 씀)은 안쪽 테두리(넓이 80 % 넘게)를 판으로 — 맞닿은 여백엔 옆 판 그림 자락이 섞임(현장 A 흙막이 · 현장 F).
       따로 떨어진 판은 바깥 테두리가 판(현장 E) — 예전 결과 그대로 */
  const 맞붙음 = (r, o) => {
    const tol = 0.003 * Math.max(r[2] - r[0], r[3] - r[1])
    const 세로겹 = Math.min(r[3], o[3]) - Math.max(r[1], o[1]), 가로겹 = Math.min(r[2], o[2]) - Math.max(r[0], o[0])
    return ((Math.abs(r[2] - o[0]) < tol || Math.abs(r[0] - o[2]) < tol) && 세로겹 > 0.5 * (r[3] - r[1])) || ((Math.abs(r[3] - o[1]) < tol || Math.abs(r[1] - o[3]) < tol) && 가로겹 > 0.5 * (r[2] - r[0]))
  }
  const 붙은 = out.map((r) => out.some((o) => o !== r && 맞붙음(r, o)))
  for (let i = 0; i < out.length; i++) {
    if (!붙은[i]) continue
    const r = out[i]
    let 안쪽 = null
    for (const q of 후보) if (q !== r && 안에(q, r) && area(q) >= area(r) * 0.8 && area(q) < area(r) * 0.995 && (!안쪽 || area(q) > area(안쪽))) 안쪽 = q
    if (안쪽) out[i] = 안쪽
  }
  return out.map((r) => ({ x0: r[0], y0: r[1], x1: r[2], y1: r[3] }))
}

/* ── 박스 이름 ───────────────────────────── */
const 붙 = (s) => String(s ?? '').replace(/\s+/g, '')
/* 도면 이름 꼴 — 띄어 쓴 «주 심 도» · 뒤에 붙은 «(X3열)» «(1/2)» 를 떼고 «…도 · …표 · …도면» 으로 끝나는 짧은 글 */
const 이름꼴 = (s) => {
  /* 🧭 G241 끝 번호(«주단면도-1» · «부분 단면도 (15)» · «상세도-A») 는 떼고 봄 · «: 촉지도» 같은 범례 줄(쌍점으로 시작)은 판 이름 아님(현장 B) */
  if (/^\s*[:：]/.test(String(s || ''))) return false
  const c = 붙(s).replace(/(\([^()]*\))+$/, '').replace(/[-–~]?([0-9]{1,3}|[A-Z])$/, '')
  if (c.length < 2 || c.length > 32) return false
  if (/^(경기|강원|충청[남북]|전라[남북]|경상[남북]|제주|전[남북]|경[남북]|충[남북])도$/.test(c)) return false
  if (/^[\d.,:/=+-]+$/.test(c)) return false
  if (/^(제도|설계|검토|확인|승인|주용도|용도|도면번호|도번|도면|축척|도|지도|약도|위도|경도|온도|정도|속도|강도|밀도|빈도|구배도|경사도)$/.test(c)) return false
  /* 🧭 G241 길 · 방 이름(«복 도» · «횡단보도» · «보차도») 은 판 이름이 아님 */
  if (/^[가-힣]{0,6}(복|보|차|인|보차|횡단보|자전거|산책|진입|출입)도$/.test(c)) return false
  /* 🧭 G237 주석 문장은 제목이 아님 — 소장님 현장 B 평면도: «9. 장비패드는 잡상세도 참조» 같은 번호 붙은 주의 글이 가장 큰 «…도» 라 평면도를 상세도로 봤음
       번호(«9.» · «(3)» · «※»)로 시작하고 «는 · 은 · 을 · 를» 이 든 글, 또는 글자 사이 띄움이 넷 넘고 그런 말이 든 글 */
  const t = String(s || '').trim()
  const 조사 = /[가-힣](는|은|을|를)\s/.test(t + ' ')
  if (조사 && (/^(\(?\d{1,2}[.)]|※|\*|-\s)/.test(t) || (t.match(/\s+/g) || []).length >= 4)) return false
  return /(도|표|도면|목록|조서|목차|차례)$/.test(c) || 제목꼴.test(t)
}
/* ── 표제란(판 오른쪽 아래 칸) ───────────────
   🧭 G241 소장님 「도면에 도면이 어디 도면인지 도면명이 없다는 건 말이 안돼. 읽는 방법 업그레이드 해야 할 것 같아」
   현장 C · D 건축 통합본: TITLE 칸 옆에 공사명 «광)…신축공사(rev.1)»(더 큼) · 서명 «P.J.H» · 날짜가 같이 있어 가장 큰 글자를 고르면 공사명이 나왔음.
   → ① 판마다 똑같이 나오는 글(공사명 · 서명 · 지명)은 뺌(흔한) ② 표제란은 판마다 같은 틀이라, «TITLE 칸에서 글자 높이 몇 배 떨어진 자리» 에
     판마다 다른 글이 오는 곳이 도면명 자리(칸자리) — 여러 판에서 그 자리를 배워 판마다 그 자리 글을 읽음 ③ 버금 이름 «[쓰레기 처리장]» 은 붙임 */
/* 🧭 G246 «NAME OF DRAWING» · «DRAWING NAME» 칸(현장 A 구조도서 표제란) 도 */
const 칸꼴 = /^(도면명|도명|도면명칭|TITLE|DRAWINGTITLE|SHEETTITLE|DWGTITLE|NAMEOF(THE)?(DRAWING|SHEET|DWG)|(DRAWING|SHEET|DWG)NAME|도면명(DRAWING|SHEET|DWG)?TITLE|(DRAWING|SHEET|DWG)?TITLE도면명|도면명NAMEOF(DRAWING|SHEET|DWG)|NAMEOF(DRAWING|SHEET|DWG)도면명)$/i
const 이름표 = /^(TITLE|SCALE|DATE|DRAWN|CHECKED|REVIEWED|APPROVED|DESIGNED|SIGNATURE|SIGNA|TURE|PROJECT|PROJECTION|SIZE|DIMENSION|SHEETNO\.?|DRAWINGNO\.?|DWG\.?(NO\.?)?|NO\.?|REV\.?|REVISION.*|POSCO|PLANT|FACILITY|EQUIPMENT|SUPPLIER|UNIT|TOTAL|PERUNIT|QUANTITY|WEIGHT.*|DESCRIPTION|MAT'?.*|REMARK'?S|A[0-4]|MM|축척|일자|설계|제도|검토|승인|도면번호|도번|사업명|공사명)$/i
/* 🧭 G241 칸 이름 낱말만으로 된 글(«일련번호 SHEET NO.» · «도 면 명 DRAWING TITLE» · «특기사항 NOTE» · «수정번호») 도 칸 이름 */
const 칸낱말 = /(일련번호|수정번호|수정내용|수정일|도면번호|도번|특기사항|일자|날짜|축척|제도|설계|심사|검토|승인|확인|공사명|사업명|용역명|도면명|비고|서명|DRAWING|SHEET|DWG|TITLE|SCALE|DATE|DRAWN|CHECKED|REVIEWED|APPROVED|DESIGNED|SIGNATURE|PROJECT|REVISION|REV|NOTES?|REMARKS?|NAMEOF|NAME|NO)/gi
const 이름표같음 = (s) => { const c = 붙(s); return 이름표.test(c) || 이름표.test(c.replace(/\(.*\)$/, '')) || (c.length <= 24 && !c.replace(칸낱말, '').replace(/[.\-_:/()·,]/g, '').length) }
const 다듬 = (s) => String(s || '').trim().replace(/\s{2,}/g, ' ')
/* 칸 값이 될 수 없는 글 — 칸 이름 · 날짜 · 축척 · 도면번호 · 숫자 · 서명(P.J.H) · 공사명(…공사 · …용역 · …사업) */
const 값아님 = (s) => {
  const t = 다듬(s), c = 붙(t)
  return c.length < 3 || 칸꼴.test(c) || 이름표같음(t) || /^[\d\s./:,()-]+$/.test(t) || /^\d{4}[.\-/]\d{1,2}/.test(t) || /^[A-Z]-[A-Z]-\d+$/i.test(t) ||
    /^NONE$/i.test(t) || /^([A-Z]\.){2,3}[A-Z]?\.?$/.test(c) || /^(S\s*=|SCALE|1\s*\/\s*\d+$)/i.test(t) || /(공사|용역|사업)(\(.*\))?$/.test(c) ||
    (/\d/.test(c) && /^[A-Z0-9][A-Z0-9.\-_/]*$/i.test(c) && !/[A-Z]{3,}/i.test(c))   /* 도면번호 꼴 «A - 01-001» · «01K-» */
}
const 판이름다움 = (s) => 이름꼴(s) || /(PLAN|LAY\s*OUT|SECTION|DETAILS?|ELEVATION|PROFILE|LIST|SCHEDULE|ARRANGEMENT|DRAWING|MAP|DIAGRAM|VIEW|NOTES?)\b/i.test(s) ? 1 : 0
/* 층 갈래 — xref 앞머리(«…$0$» · «…|») 를 떼고 작은 글자로: «XR-FORM$0$Form» → «form» */
const 층갈래 = (ly) => String(ly || '').replace(/^.*(\$0\$|\|)/, '').toLowerCase()
const 안글 = (texts, r) => texts.filter((t) => t.x > r.x0 && t.x < r.x1 && t.y > r.y0 && t.y < r.y1)
/** 박스 안 표제란 칸(가장 큰 TITLE · 도면명 글자)과 그 둘레 글 — 자리는 칸에서 글자 높이 몇 배(u 가로 · w 세로) */
function 칸옆들(안, r = null) {
  /* 표제란 칸만 — 같은 줄에 같은 칸 이름이 또 있으면 표 머리(도면 목록표의 «도 면 명» 칸 셋 · 현장 F). «도면명 · DRAWING TITLE» 나란히는 표제란(현장 E) */
  const 칸들0 = 안.filter((t) => 칸꼴.test(붙(t.s)))
  /* 🧭 G246 목록표 머리 — «도면명» 칸 아래로 판 이름다운 글이 셋 넘게 줄줄이(현장 F 목차 «1. 표준단면도 · 2. 가설흙막이 평면도 …») 면 표 머리(표제란 아님) */
  const 표머리 = (t) => { const h = t.h || 1; let n = 0; for (const u of 안) if (u !== t && u.y < t.y - 0.5 * h && t.y - u.y < 40 * h && Math.abs(u.x - t.x) < 8 * h && 판이름다움(u.s) && ++n >= 3) return true; return false }
  const 칸들 = 칸들0.filter((t) => !칸들0.some((u) => u !== t && 붙(u.s) === 붙(t.s) && Math.abs(u.y - t.y) < (t.h || 1)) && !표머리(t))
  if (!칸들.length) return null
  /* 칸이 여럿이면(기호 설명 판의 «DRAWING TITLE» 보기 글) 판 오른쪽 아래 모서리에 가까운 것 — 표제란은 판 오른쪽 아래에 있음 */
  const 모 = (t) => (r ? Math.hypot(r.x1 - t.x, t.y - r.y0) : -(t.h || 0))
  const 칸 = 칸들.reduce((a, b) => (모(b) < 모(a) ? b : a))
  const h = 칸.h || 1
  const 자리 = (t) => [t.ax ?? t.x, t.ay ?? t.y]
  const [kx, ky] = 자리(칸)
  const 옆 = []
  for (const t of 안) {
    if (t === 칸 || Math.abs(t.y - 칸.y) >= 15 * h || Math.abs(t.x - 칸.x) >= 40 * h || 값아님(t.s)) continue
    const [x, y] = 자리(t)
    옆.push({ t, v: 다듬(t.s), k: 붙(t.s), u: (x - kx) / h, w: (y - ky) / h })
  }
  return { 칸, 옆 }
}
/** 박스 안 글자에서 도면 이름 — 표제란 칸 값(판 이름다운 것 · xref 층 아닌 것 · 큰 글자 · 가까운 것 차례), 없으면 이름꼴 가운데 가장 큰 글자 */
export function 박스제목(texts, r, 흔한 = null, 안 = null, c = undefined) {
  안 = 안 || 안글(texts, r)
  if (c === undefined) c = 칸옆들(안, r)
  /* 🧭 G240 표제란 «TITLE · 도면명» 칸 값이 있으면 그것이 판 이름(그림 안의 «좌 표» · «횡단보도» · «…상세도» 같은 글보다 먼저) */
  if (c) {
    /* 🧭 G241 판 이름다운 것 · 칸과 같은 층 갈래(«FORM» = «XR-FORM$0$Form») · 큰 글자 · 가까운 것 차례
         (G240 «xref 층 아닌 것 먼저» 는 뺌 — 흔한 글로 이미 걸러지고, 쓰레기 처리장 판 «입면도» 는 xref 층에 있었음) */
    const 같은층 = (q) => (층갈래(q.t.ly) === 층갈래(c.칸.ly) ? 1 : 0)
    const 옆 = c.옆.filter((q) => !흔한 || !흔한.has(q.k))
    옆.sort((a, b) => 판이름다움(b.v) - 판이름다움(a.v) || 같은층(b) - 같은층(a) || (b.t.h || 0) - (a.t.h || 0) || Math.hypot(a.u, a.w) - Math.hypot(b.u, b.w))
    if (옆.length) return 옆[0].v
  }
  const 후 = 안.filter((t) => 이름꼴(t.s)).sort((a, b) => (b.h || 0) - (a.h || 0))
  if (후.length) return 다듬(후[0].s)
  return ''
}
/** 🧭 G240 · G241 박스 여럿의 이름 한꺼번에 — 흔한 글 빼기 · 도면명 자리 배우기 */
export function 박스제목들(texts, frs) {
  const 안들 = frs.map((r) => 안글(texts, r))
  const 칸 = 안들.map((안, i) => 칸옆들(안, frs[i]))
  const n칸 = 칸.filter(Boolean).length
  /* 흔한 — 셋 넘는 판 · 표제란 있는 판의 40 % 넘게 나오는 같은 글(판 이름다운 글은 빼지 않음: 같은 «횡단면도» 가 여러 판일 수 있음) */
  const 셈 = new Map()
  for (const c of 칸) if (c) for (const k of new Set(c.옆.map((q) => q.k))) 셈.set(k, (셈.get(k) || 0) + 1)
  const 이름글 = new Map(); for (const c of 칸) if (c) for (const q of c.옆) 이름글.set(q.k, q.v)
  const 흔한 = new Set([...셈].filter(([k, n]) => n >= 3 && n >= 0.4 * n칸 && !판이름다움(이름글.get(k))).map(([k]) => k))
  /* 도면명 자리 — 판 셋 넘게 같은 자리(가로 ±2.5 · 세로 ±0.6 글자 높이)에 판마다 다른 글이 오는 곳 */
  let 자리 = null
  if (n칸 >= 3) {
    const 점 = []
    칸.forEach((c, i) => { if (c) for (const q of c.옆) if (!흔한.has(q.k)) 점.push({ ...q, i }) })
    const 걸음 = Math.max(1, Math.ceil(점.length / 4000))
    for (let j = 0; j < 점.length; j += 걸음) {
      const p = 점[j]
      const 판 = new Map()
      for (const q of 점) {
        if (Math.abs(q.u - p.u) > 4 || Math.abs(q.w - p.w) > 0.6) continue
        const o = 판.get(q.i)
        if (!o || Math.hypot(q.u - p.u, q.w - p.w) < Math.hypot(o.u - p.u, o.w - p.w)) 판.set(q.i, q)
      }
      const m = 판.size
      if (m < Math.max(3, 0.3 * n칸)) continue
      const 들 = [...판.values()]
      const 값 = new Set(들.map((q) => q.k)).size
      const 이름 = 들.filter((q) => 판이름다움(q.v)).length
      const 점수 = 값 * (0.3 + 이름 / m)
      if (!자리 || 점수 > 자리.점수) 자리 = { 점수, u: p.u, w: p.w, 판: m, 값 }
    }
  }
  return frs.map((r, i) => {
    const c = 칸[i]
    if (c && 자리) {
      const 거리 = (q) => Math.hypot(q.u - 자리.u, q.w - 자리.w)
      /* 가로는 넉넉히(±8 — 왼쪽 맞춤 · 가운데 맞춤 글이 섞임), 세로는 좁게(±0.8) */
      const 속 = c.옆.filter((q) => !흔한.has(q.k) && Math.abs(q.u - 자리.u) <= 8 && Math.abs(q.w - 자리.w) <= 0.8).sort((a, b) => Math.abs(a.w - 자리.w) - Math.abs(b.w - 자리.w) || 거리(a) - 거리(b))
      if (속.length) {
        const 주 = 속[0]
        const 덧 = c.옆.find((q) => q !== 주 && !흔한.has(q.k) && /^[\[(［【].+[\])］】]$/.test(q.v) && Math.abs(q.u - 주.u) <= 6 && Math.abs(q.w - 주.w) <= 2.2)
        return 덧 ? `${주.v} ${덧.v}` : 주.v
      }
    }
    return 박스제목(texts, r, 흔한, 안들[i], c)
  })
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
  for (const c of raw.circles || []) { const k = 어디(c.x, c.y); const d = k < 0 ? 밖 : 조각[k]; if (!d.circles) d.circles = []; d.circles.push(c) }   /* 🧾 G424 원도 그 네모로 */
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
    if (r.circles && r.circles.length) { if (!d.circles) d.circles = []; for (const c of r.circles) d.circles.push(c) }   /* 🧾 G424 원(덮개 펌프 구멍)도 합침 */
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
  /* 🧭 G237 «ELEV» 레이어라도 입면도(A-ELEV · ELEVATION · 입면)의 글자는 측량점이 아님 — 소장님 현장 B: 입면 xref 를 측량도면(기준)으로 골랐음
       «elev» 만 든 레이어는 높이 숫자(12.34 꼴) 글자만 셈 · «Defpoints»(치수 정의점)는 안 셈 */
  for (const t of raw.texts || []) {
    const ly = t.ly || ''
    if (/defpoints/i.test(ly)) continue                 // 치수 정의점 레이어(캐드 기본) — 측량점 아님
    if (/point|pnt|측량점|표고점|지반고점/i.test(ly)) { 글++; continue }
    const 수 = /^[-+]?\d{1,4}\.\d{1,3}$/.test(String(t.s || '').replace(/\s+/g, ''))
    /* 🧭 G237 현황측량 PTANNOTELE · CP점(기준점) · 수치지형도 표고점·등고선 수치(F001 · F002 코드 레이어)의 높이 숫자 — 소장님 현장 B 현황평면도 */
    if (수 && (/^pt|annotele|기준점|^cp/i.test(ly) || /^F00[12]\d{4}$/i.test(ly))) { 글++; continue }
    if (/elev/i.test(ly) && !/elevation|^a[-_ ]|입면/i.test(ly) && 수) 글++
  }
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
