/**
 * 📐→🧱 도면에서 읽은 BIM 모델 → 골조 모델(통심 위 부재) (G389 · 2026-10-23)
 *
 * 소장님: 「도면을 넣으면 물량이 나오고, 빠진 부분은 세우면 나오는 걸로」 · 「도면을 하나씩 가져오면 되잖아. 그렇게 해서 세우는 거지」 · 「좌표로 하는 거잖아」
 *   BIM 물량 화면이 도면에서 세운 부재(BIM모델.js 모델만들기)를 골조 모델(lib/골조모델.js)의 통심 · 부재로 옮김 —
 *   옮긴 뒤에는 작업 화면에서 눌러 고치고 · 빠진 곳을 세움(셈은 골조 모델 셈 = 골조 셈 규칙).
 * ■ 좌표 mm 그대로 — 통심: 도면 통심 기호(X1 · Y1 …) 자리 + 부재가 통심에서 벗어나면 그 자리에 보조 통심(«X3+2500» 꼴 — 가까운 아래 통심 이름 + 거리)
 * ■ 차례: ① 통심 ② 기둥 가운데 → 교점 ③ 보 · 벽 축 → 줄(기둥 안을 지나는 편심 보는 기둥 줄) ④ 보 · 벽 끝 → 받침(기둥 · 가로지르는 보 · 벽) 줄 · 없으면 그 자리
 *   ⑤ 보 · 벽은 «받침 기둥» 자리에서만 나눔(보조 줄마다 잘게 자르지 않음) ⑥ 슬라브 = 네모 테두리 → 칸(안을 지나는 보 · 벽 줄에서만 나눔)
 * ■ 도면 셈 줄의 높이(지붕 · 단면으로 올린 기둥 · 벽)와 벽 «상부»(잰 값)는 부재에 그대로 — 셈이 BIM 물량 화면과 같게
 * ■ 못 옮기는 것(«못옮김» 에 까닭): 비스듬한 보 · 벽 · 네모가 아닌 슬라브 · MAT(부정형) 기초 · 계단 · 기호가 일람에 없는 것 — 작업 화면에서 손으로
 */
const 글 = (x) => String(x ?? '').trim()
const 수 = (x, d = 0) => { const v = Number(String(x ?? '').replace(/,/g, '')); return Number.isFinite(v) ? v : d }
const 상자 = (판) => { let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity; for (const p of 판 || []) { a = Math.min(a, p[0]); b = Math.min(b, p[1]); c = Math.max(c, p[0]); d = Math.max(d, p[1]) } return [a, b, c, d] }
const 넓이 = (판) => { let s = 0; for (let i = 0; i < 판.length; i++) { const p = 판[i], q = 판[(i + 1) % 판.length]; s += p[0] * q[1] - q[0] * p[1] } return Math.abs(s) / 2 }
/** 판의 변이 모두 가로 · 세로인가(2° 안) */
const 곧은판 = (판) => 판.every((p, i) => { const q = 판[(i + 1) % 판.length]; const dx = Math.abs(q[0] - p[0]), dy = Math.abs(q[1] - p[1]); return dx + dy < 1 || dx <= dy * 0.035 || dy <= dx * 0.035 })

/** 한 축의 줄들 — [{자리, 이름, 본}] (본 = 도면 통심) */
function 줄묶음(축) {
  const 줄 = []
  return {
    줄,
    축,
    본더하기(v, 이름) { if (!줄.some((g) => Math.abs(g.자리 - v) <= 30)) 줄.push({ 자리: v, 이름, 본: true }) },
    찾기(v, 거리) { let best = null, bd = Infinity; for (const g of 줄) { const d = Math.abs(g.자리 - v); if (d <= 거리 && d < bd) { bd = d; best = g } } return best },
    얻기(v, 거리) { const g = this.찾기(v, Math.max(거리, 2.5)); if (g) return g; const 새 = { 자리: Math.round(v / 5) * 5, 이름: '', 본: false }; 줄.push(새); return 새 },
  }
}

/**
 * @param {object} BIM  모델만들기(…) (+ 플랜트모델) 결과 — {부재, 통심, …}
 * @param {object} R    {공사} — 골조읽기 → 층고바꾸기 → 겹친것빼기 뒤의 공사(층 · 배근 · 셈 줄)
 * @param {object} 옵션 { 이름 }
 * @returns {{ M: object, 못옮김: {종류, 층, 기호, 까닭}[], 옮김: number, 보조: number }}
 */
export function 도면에서모델(BIM, R, 옵션 = {}) {
  const 못옮김 = []
  const 부재 = ((BIM && BIM.부재) || []).filter((o) => !o.겹침)
  const X = 줄묶음('x'), Y = 줄묶음('y')
  const 공 = (R && R.공사) || {}
  /* ① 도면 통심(세로 줄 = x · 가로 줄 = y) */
  for (const g of (BIM && BIM.통심) || []) {
    const [x0, y0, x1, y1] = g.끝 || []
    if (![x0, y0, x1, y1].every(Number.isFinite)) continue
    if (Math.abs(x1 - x0) < Math.abs(y1 - y0) * 0.035) X.본더하기((x0 + x1) / 2, 글(g.글))
    else if (Math.abs(y1 - y0) < Math.abs(x1 - x0) * 0.035) Y.본더하기((y0 + y1) / 2, 글(g.글))
  }
  /* 층 — FT 맨 앞(층고 0) · 쓴 층 · 층고 있는 층 */
  const 층0 = (공.층 || []).map((f) => ({ 이름: 글(f.이름), 층고: 수(f.층고, 0), 슬라브: 수(f.슬라브, 0) })).filter((f) => f.이름)
  const 쓴층 = new Set(부재.map((o) => 글(o.층)))
  let 층 = 층0.filter((f) => f.이름 === 'FT' || 쓴층.has(f.이름) || f.층고 > 0)
  if (!층.length || 층[0].이름 !== 'FT') 층 = [{ 이름: 'FT', 층고: 0, 슬라브: 0, 내림: 0 }, ...층.filter((f) => f.이름 !== 'FT')]
  else 층[0] = { ...층[0], 층고: 0, 내림: 0 }
  const 맨아래 = (층.find((f) => f.이름 !== 'FT') || {}).이름
  const 받침층 = (f) => (f === 'FT' ? 맨아래 : f)          // 보가 앉는 기둥의 층(골조 모델 규칙 — FT 지중보는 맨 아래층 기둥)

  /* 도면 셈 줄(겹친것빼기 뒤 — 줄마다 _원줄 · _원kk) — 부재(표 · i · kk) → 그 줄: 기둥 · 벽 높이(지붕 · 단면) · 벽 상부(잰 값)를 그대로 옮김 */
  const 줄표 = new Map()
  for (const 동 of 공.동 || []) {
    const 주 = (동 && 동.주자료) || {}
    for (const 표 of Object.keys(주)) (주[표] || []).forEach((r, idx) => {
      const ks = Array.isArray(r._원kk) && Number.isFinite(+r._원줄) ? r._원kk.map((kk) => 표 + '|' + r._원줄 + '|' + kk) : [표 + '|' + idx + '|*']
      for (const k of ks) if (!줄표.has(k)) 줄표.set(k, r)
    })
  }
  const 줄찾기 = (o) => 줄표.get(o.표 + '|' + o.i + '|' + o.kk) || 줄표.get(o.표 + '|' + o.i + '|*') || null
  const 높이들 = (o) => {
    const r = 줄찾기(o)
    if (!r) return {}
    const 덧 = {}
    const h = 수(r.높이, 0)
    if (h > 0) 덧.높이 = Math.round(h)
    if (o.종류 === '벽') { const t = 글(r.상부); if (t === '' || /^\d+(\.\d+)?$/.test(t)) 덧.상부 = 수(t, 0) }   // 기호(G1 …)면 골조 모델 규칙(위 보 춤)
    return 덧
  }

  /* ② 부재 나눔 — 기둥 · 기초 먼저(기둥 자리가 줄이 되게) */
  const 차례 = { 기둥: 0, 기초: 1, 벽: 2, 보: 3, 슬라브: 4 }
  const 판든 = 부재.filter((o) => Array.isArray(o.판) && o.판.length >= 3).sort((a, b) => (차례[a.종류] ?? 9) - (차례[b.종류] ?? 9))
  const 점들 = []      // 기둥 · 기초 {o, 종류, 층, gx, gy, a(x 너비), b(y 너비), 덧}
  const 선들 = []      // 보 · 벽 {o, 종류, 층, 가로, 줄, 축자리, s0, s1, 폭, 덧}
  const 판들 = []      // 슬라브 {o, 층, a, b, c, d}
  const 빼 = (o, 까닭) => 못옮김.push({ 종류: o.종류, 층: o.층, 기호: 글(o.기호), 까닭, id: o.id })
  for (const o of 판든) {
    const 기호 = 글(o.기호)
    const [a, b, c, d] = 상자(o.판)
    if (o.종류 === '기둥' || o.종류 === '기초') {
      if (o.종류 === '기초' && (/^M(AT|F)/i.test(기호) || o.부정형 || !곧은판(o.판) || 넓이(o.판) > 60e6)) { 빼(o, 'MAT · 부정형 기초(손으로 · 골조 수량산출 표)'); continue }
      const cx = (a + c) / 2, cy = (b + d) / 2, 반 = Math.max(c - a, d - b) / 2
      점들.push({ o, 종류: o.종류, 층: o.층, 부호: 기호, gx: X.얻기(cx, 반 + 100), gy: Y.얻기(cy, 반 + 100), a: c - a, b: d - b, 덧: o.종류 === '기둥' ? 높이들(o) : {} })
      continue
    }
    if (o.종류 === '보' || o.종류 === '벽') {
      if (!곧은판(o.판)) { 빼(o, '비스듬한 ' + o.종류); continue }
      const 가로 = c - a >= d - b
      선들.push({ o, 종류: o.종류, 층: o.층, 부호: 기호, 가로, 축자리: 가로 ? (b + d) / 2 : (a + c) / 2, s0: 가로 ? a : b, s1: 가로 ? c : d, 폭: 가로 ? d - b : c - a, 덧: o.종류 === '벽' ? 높이들(o) : {} })
      continue
    }
    if (o.종류 === '슬라브') {
      const 바 = (c - a) * (d - b)
      if (!곧은판(o.판) || !(바 > 0) || 넓이(o.판) < 0.85 * 바) { 빼(o, '네모가 아닌 슬라브'); continue }
      판들.push({ o, 층: o.층, 부호: 기호, a, b, c, d })
      continue
    }
    빼(o, o.종류 === '계단' ? '계단(손으로)' : o.종류 + '(골조 모델에 없는 종류)')
  }
  /* 층마다 기둥 — 받침 찾기 */
  const 기둥층 = new Map()
  for (const p of 점들) if (p.종류 === '기둥') { if (!기둥층.has(p.층)) 기둥층.set(p.층, []); 기둥층.get(p.층).push(p) }
  const 받침기둥 = (m) => 기둥층.get(m.종류 === '보' ? 받침층(m.층) : m.층) || []

  /* ③ 보 · 벽 축 → 줄: 100 mm 안 줄 · 없으면 끝이 기둥 안이고 축이 그 기둥 너비 안이면 그 기둥 줄(편심 보 · 벽) · 없으면 새 보조 줄 */
  for (const m of 선들) {
    const G = m.가로 ? Y : X
    let g = G.찾기(m.축자리, 100)
    if (!g) {
      let best = null, bd = Infinity
      for (const p of 받침기둥(m)) {
        const 축쪽 = m.가로 ? p.gx.자리 : p.gy.자리, 옆줄 = m.가로 ? p.gy : p.gx
        const 축너비 = m.가로 ? p.a : p.b, 옆너비 = m.가로 ? p.b : p.a
        const 끝에 = Math.min(Math.abs(m.s0 - 축쪽), Math.abs(m.s1 - 축쪽)) <= 축너비 / 2 + 150 || (축쪽 > m.s0 && 축쪽 < m.s1)
        const 떨 = Math.abs(옆줄.자리 - m.축자리)
        if (끝에 && 떨 <= Math.max(옆너비 / 2 - m.폭 / 2, 0) + 10 && 떨 < bd) { bd = 떨; best = 옆줄 }
      }
      g = best || G.얻기(m.축자리, 0)
    }
    m.줄 = g
  }
  /* ④ 보 · 벽 끝 → 받침 줄(기둥 · 가로지르는 보 · 벽 — 그 너비 반 + 150 안) · 없으면 30 mm 안 줄 · 없으면 그 자리 보조 줄 */
  const 같은층선 = new Map()
  for (const m of 선들) { const k = m.층 + '|' + m.종류; if (!같은층선.has(k)) 같은층선.set(k, []); 같은층선.get(k).push(m) }
  const 끝줄 = (m, v) => {
    const G = m.가로 ? X : Y
    const 후보 = []
    for (const p of 받침기둥(m)) {
      if ((m.가로 ? p.gy : p.gx) !== m.줄) continue
      후보.push({ g: m.가로 ? p.gx : p.gy, 허용: (m.가로 ? p.a : p.b) / 2 + 150 })
    }
    const 가로지름 = [...(같은층선.get(m.층 + '|보') || []), ...(같은층선.get(m.층 + '|벽') || [])]
    for (const q of 가로지름) {
      if (q === m || q.가로 === m.가로 || (m.종류 === '벽' && q.종류 === '보')) continue      // 벽 끝은 벽 · 기둥에만 앉음
      if (m.줄.자리 < q.s0 - 200 || m.줄.자리 > q.s1 + 200) continue
      후보.push({ g: q.줄, 허용: q.폭 / 2 + 150 })
    }
    let best = null, bd = Infinity
    for (const h of 후보) { const d = Math.abs(h.g.자리 - v); if (d <= h.허용 && d < bd) { bd = d; best = h.g } }
    return best || G.찾기(v, 30) || G.얻기(v, 0)
  }
  for (const m of 선들) { m.g0 = 끝줄(m, m.s0); m.g1 = 끝줄(m, m.s1) }
  /* ⑥ 슬라브 변 → 그 변을 따라가는 같은 층 보 · 벽 줄(450 안) · 없으면 100 mm 안 줄 · 없으면 그 자리 */
  const 변줄 = (s, 세로변, v, 범0, 범1) => {
    const G = 세로변 ? X : Y
    let best = null, bd = Infinity
    for (const q of [...(같은층선.get(s.층 + '|보') || []), ...(같은층선.get(s.층 + '|벽') || [])]) {
      if (q.가로 === 세로변) continue                 // 세로변(x 자리)을 따라가는 것은 세로 부재
      if (Math.min(q.s1, 범1) - Math.max(q.s0, 범0) < Math.min(500, (범1 - 범0) / 3)) continue
      const d = Math.abs(q.줄.자리 - v)
      if (d <= 450 && d < bd) { bd = d; best = q.줄 }
    }
    return best || G.찾기(v, 100) || G.얻기(v, 0)
  }
  for (const s of 판들) {
    s.gx0 = 변줄(s, true, s.a, s.b, s.d); s.gx1 = 변줄(s, true, s.c, s.b, s.d)
    s.gy0 = 변줄(s, false, s.b, s.a, s.c); s.gy1 = 변줄(s, false, s.d, s.a, s.c)
  }

  /* 통심 이름 · id — 본 줄은 도면 이름(없으면 X1 …) · 보조 줄은 «가까운 아래 본 줄 + 거리» */
  const 이름짓기 = (G, 머리) => {
    G.줄.sort((p, q) => p.자리 - q.자리)
    let k = 0
    for (const g of G.줄) if (g.본 && !g.이름) g.이름 = 머리 + (++k)
    const 본들 = G.줄.filter((g) => g.본)
    const 쓴 = new Set()
    G.줄.forEach((g, i) => {
      if (!g.이름) {
        const 아래 = [...본들].reverse().find((q) => q.자리 < g.자리)
        g.이름 = 아래 ? 아래.이름 + '+' + Math.round(g.자리 - 아래.자리) : (본들[0] ? 본들[0].이름 + '−' + Math.round(본들[0].자리 - g.자리) : 머리 + (i + 1))
      }
      let id = G.축 + (i + 1)
      while (쓴.has(id)) id += '_'
      쓴.add(id)
      g.id = id
    })
  }
  이름짓기(X, 'X'); 이름짓기(Y, 'Y')
  const xi = new Map(X.줄.map((g, i) => [g, i])), yi = new Map(Y.줄.map((g, i) => [g, i]))

  /* 배근 */
  const 배근0 = 공.배근 || {}
  const 배근 = {}
  for (const k of ['기둥', '보', '슬라브', '벽', '기초', '계단', '보강근']) 배근[k] = Array.isArray(배근0[k]) ? 배근0[k].map((r) => ({ ...r })) : []
  const 있음 = (종, 부호) => (배근[종] || []).some((r) => 글(r.기호).toUpperCase() === 글(부호).toUpperCase())

  /* ⑤ 부재 — 같은 자리 · 같은 종류는 하나 */
  const 부재들 = []
  let id = 1
  const 열쇠 = (o) => o.종류 + '|' + o.층 + '|' + JSON.stringify(o.점 || o.칸) + '|' + JSON.stringify(o.끝 || '')
  const 본키 = new Map()
  const 넣기 = (o) => {
    const k = 열쇠(o), 앞 = 본키.get(k)
    if (앞) { if (글(앞.부호) !== 글(o.부호)) 못옮김.push({ 종류: o.종류, 층: o.층, 기호: o.부호, 까닭: '같은 자리에 «' + 앞.부호 + '» 가 있어 겹침(도면에 두 번 그려짐 · 확인)' }); return }
    const n = { id: id++, ...o }; 본키.set(k, n); 부재들.push(n)
  }
  const 일람밖 = (t) => { if (있음(t.종류, t.부호)) return false; 못옮김.push({ 종류: t.종류, 층: t.층, 기호: t.부호, 까닭: '일람표에 없는 기호' }); return true }
  for (const p of 점들) { if (일람밖(p)) continue; 넣기({ 종류: p.종류, 층: p.층, 부호: p.부호, 점: [p.gx.id, p.gy.id], ...p.덧 }) }
  for (const m of 선들) {
    if (일람밖(m)) continue
    const I = m.가로 ? xi : yi, 줄들 = m.가로 ? X.줄 : Y.줄
    let i = I.get(m.g0), j = I.get(m.g1)
    if (i > j) [i, j] = [j, i]
    if (i === j) { 빼(m.o, '너무 짧은 ' + m.종류 + '(두 끝이 한 받침 안)'); continue }
    /* 나눌 곳 = 사이의 받침 기둥 자리만 */
    const 기둥줄 = new Set(받침기둥(m).filter((p) => (m.가로 ? p.gy : p.gx) === m.줄).map((p) => (m.가로 ? p.gx : p.gy)))
    const 마디 = [i]
    for (let k = i + 1; k < j; k++) if (기둥줄.has(줄들[k])) 마디.push(k)
    마디.push(j)
    for (let k = 0; k + 1 < 마디.length; k++) {
      const A = 줄들[마디[k]], B = 줄들[마디[k + 1]]
      넣기({ 종류: m.종류, 층: m.층, 부호: m.부호, 점: m.가로 ? [A.id, m.줄.id] : [m.줄.id, A.id], 끝: m.가로 ? [B.id, m.줄.id] : [m.줄.id, B.id], ...m.덧 })
    }
  }
  for (const s of 판들) {
    if (일람밖({ 종류: '슬라브', 층: s.층, 부호: s.부호 })) continue
    let i0 = xi.get(s.gx0), i1 = xi.get(s.gx1), j0 = yi.get(s.gy0), j1 = yi.get(s.gy1)
    if (i0 > i1) [i0, i1] = [i1, i0]
    if (j0 > j1) [j0, j1] = [j1, j0]
    if (i0 === i1 || j0 === j1) { 빼(s.o, '너무 좁은 슬라브'); continue }
    /* 안을 지나는 같은 층 보 · 벽 줄에서만 나눔(보 S-THK · 슬라브 이웃이 맞게) */
    const 안줄 = (세로, a0, a1, 범0, 범1) => {
      const 들 = new Set()
      for (const q of [...(같은층선.get(s.층 + '|보') || []), ...(같은층선.get(s.층 + '|벽') || [])]) {
        if (q.가로 === 세로) continue
        const v = q.줄.자리
        if (v <= a0 || v >= a1) continue
        if (Math.min(q.s1, 범1) - Math.max(q.s0, 범0) <= 0) continue
        들.add(q.줄)
      }
      return 들
    }
    const 세로들 = 안줄(true, X.줄[i0].자리, X.줄[i1].자리, Y.줄[j0].자리, Y.줄[j1].자리)
    const 가로들 = 안줄(false, Y.줄[j0].자리, Y.줄[j1].자리, X.줄[i0].자리, X.줄[i1].자리)
    const xs = [i0]; for (let k = i0 + 1; k < i1; k++) if (세로들.has(X.줄[k])) xs.push(k); xs.push(i1)
    const ys = [j0]; for (let k = j0 + 1; k < j1; k++) if (가로들.has(Y.줄[k])) ys.push(k); ys.push(j1)
    for (let a = 0; a + 1 < xs.length; a++) for (let b = 0; b + 1 < ys.length; b++) 넣기({ 종류: '슬라브', 층: s.층, 부호: s.부호, 칸: [X.줄[xs[a]].id, Y.줄[ys[b]].id, X.줄[xs[a + 1]].id, Y.줄[ys[b + 1]].id] })
  }
  for (const o of 부재들) if (!층.some((f) => f.이름 === o.층)) 층.push({ 이름: o.층, 층고: 3300, 슬라브: 150 })
  const M = {
    이름: 글(옵션.이름),
    통심: { x: X.줄.map((g) => ({ id: g.id, 이름: g.이름, 자리: g.자리 })), y: Y.줄.map((g) => ({ id: g.id, 이름: g.이름, 자리: g.자리 })) },
    층,
    배근,
    부재: 부재들,
    다음: id,
    도면에서: { 부재: 판든.length, 못옮김: 못옮김.length },
  }
  return { M, 못옮김, 옮김: 부재들.length, 보조: X.줄.filter((g) => !g.본).length + Y.줄.filter((g) => !g.본).length }
}
