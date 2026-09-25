/**
 * 🏢 도면에서 «높이» 를 스스로 찾아 건물로 세우기 (2026-09-26)
 *
 * 소장님: 「높이를 나오게 프로그램을 업그레이드 할 수 없을까? 구조물등」 · 「클로드가 도면에서 직접 찾아서 해줘야지」
 *         「지하에 들어서는 구조물이든, 지상에 올라가는 구조물 이든」 · 「높이 등이 나와야 3D같지」
 *         (시험 도면: 여수 새마을금고 — 금동배수장 도면은 쓰지 않습니다. 소장님: 「바뀌기 전 도면」)
 *
 * ■ 무엇을 찾나 — 전부 «도면에 적힌 글자» 에서
 *   ① 층 높이 : 「지상 2층」 같은 층 이름 바로 아래(또는 옆) 「GL +5,200」「FL +5,200」「SL -400」 → 2층 = +5,200
 *               같은 짝이 도면에 여러 번(입면·골구도 여러 장) 나오면 «많이 나온 값» 을 씁니다.
 *   ② 평면도  : 「지상 2층 평면도」「옥상 평면도」 같은 제목 → 그 제목에 가장 가까운 선들이 그 층
 *   ③ 맞추기  : 층마다 도면 자리가 다르니, «통심선(그리드)» 이 서로 겹치게 옮깁니다(없으면 제목 자리로)
 *   ④ 세우기  : 층 선들을 그 층 높이에 놓고, 벽·기둥 층(WALL·COL·벽·기둥)은 다음 층 높이까지 세웁니다
 * ■ 찾은 것은 «어디서 찾았는지» 와 함께 돌려줍니다(근거). 못 찾은 층은 못 찾았다고 적습니다.
 * ⚠️ 도면마다 쓰는 말이 다릅니다. 여기 없는 말(예: 「3F」「3FL」)도 아래 글자 규칙에 넣어 두었지만,
 *    새 도면에서 안 되면 규칙을 늘리십시오 — 짐작으로 높이를 지어내지는 않습니다.
 */

/* ── 층 이름 → 열쇠 (B1 · 1 · 2 … · RF(옥상) · PH(옥탑·옥상지붕)) ── */
export function 층열쇠(s) {
  const t = String(s).replace(/\s+/g, '')
  let m
  if ((m = /지하(\d+)층/.exec(t))) return 'B' + m[1]
  if ((m = /^B(\d+)(F|FL|층)?/i.exec(t))) return 'B' + m[1]
  if ((m = /지상(\d+)층/.exec(t))) return String(+m[1])
  if ((m = /^(\d+)(층|F|FL)(?![A-Za-z가-힣])/.exec(t))) return String(+m[1])
  if (/옥탑지붕|옥상지붕|지붕층|PH(R|ROOF)?$/i.test(t)) return 'PH'
  if (/옥탑/.test(t)) return 'PH'
  if (/옥상|^RF|^ROOF/i.test(t)) return 'RF'
  return null
}
export const 층이름 = (k) => (k == null ? '' : k[0] === 'B' ? `지하 ${k.slice(1)}층` : k === 'RF' ? '옥상' : k === 'PH' ? '옥탑·옥상지붕' : `${k}층`)
const 층차례 = (k) => (k[0] === 'B' ? -(+k.slice(1)) : k === 'RF' ? 900 : k === 'PH' ? 950 : +k)

/* 「GL +5,200」「FL±0」「SL -400」「EL.12.50」 → {종류, 값} (값은 mm 로 봅니다 — 쉼표 천 단위) */
const 높이글 = /\b(FL|GL|SL|TOS|EL)\s*[.:=]?\s*(±|\+\/-|[+-])?\s*(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d+))?/i
export function 높이읽기(s) {
  const m = 높이글.exec(String(s))
  if (!m) return null
  const 종류 = m[1].toUpperCase()
  if (종류 === 'EL' && m[4]) return null                      // EL +81.70 (m, 바다 기준) — 층 높이로 안 씀
  let v = +m[3].replace(/,/g, '')
  if (m[2] === '-') v = -v
  if (m[2] === '±' || m[2] === '+/-') v = 0
  return { 종류, v }
}

/**
 * ① 층 높이 찾기 — 여러 도면의 글자를 한데 모아
 * @returns {{ 높이: {열쇠: mm}, 근거: [{층, 값, 번, 파일, 다른값}], 겹침: [] }}
 */
export function 층높이찾기(파일들) {
  const 표 = new Map()                 // 열쇠 → Map(값 → {번, 파일들})
  for (const { 이름, texts } of 파일들) {
    const 이름글 = texts.filter((t) => 층열쇠(t.s) && !/평면도|입면도|단면도|구조도|주심도|배근|일람/.test(t.s) && t.s.length <= 14)
    const 높이들 = []
    for (const t of texts) { const r = 높이읽기(t.s); if (r) 높이들.push({ ...t, ...r }) }
    if (!이름글.length || !높이들.length) continue
    for (const 글 of 이름글) {
      const h = 글.h || 300
      let 가장 = null, 거리 = Infinity
      for (const q of 높이들) {
        const dx = q.x - 글.x, dy = q.y - 글.y
        if (Math.abs(dx) > 8 * h || dy > 0.6 * h || dy < -4 * h) continue   // 이름 «아래» 가까이 (같은 줄 옆도)
        const d = Math.hypot(dx * 0.5, dy)
        if (d < 거리) { 거리 = d; 가장 = q }
      }
      if (!가장) continue
      const k = 층열쇠(글.s)
      if (!표.has(k)) 표.set(k, new Map())
      const m = 표.get(k)
      const r = m.get(가장.v) || { 번: 0, 파일: new Set(), 글: `${글.s} → ${가장.s}` }
      r.번++; r.파일.add(이름)
      m.set(가장.v, r)
    }
  }
  /* 높이 글자가 없는 도면(입면도 등) — 층 이름이 한 줄로 위아래 늘어서 있으면 «자리의 차이» 가 곧 층 높이입니다
     (1:1 로 그린 모델 공간, mm). 층 사이가 2~10m 일 때만 믿습니다. 글자에서 찾은 값이 있으면 그것이 먼저입니다. */
  for (const { 이름, texts } of 파일들) {
    const 이름글 = texts.filter((t) => 층열쇠(t.s) && t.s.length <= 8 && !/평면|입면|단면/.test(t.s))
    const 줄 = new Map()
    for (const t of 이름글) {
      const 키 = Math.round(t.x / Math.max(1, 4 * (t.h || 300)))
      if (!줄.has(키)) 줄.set(키, [])
      줄.get(키).push(t)
    }
    for (const 무리 of 줄.values()) {
      const 일 = 무리.find((t) => 층열쇠(t.s) === '1')
      if (!일 || 무리.length < 3) continue
      const 차례대로 = [...무리].sort((a, b) => a.y - b.y)
      let 됨 = true
      for (let i = 1; i < 차례대로.length; i++) {
        const d = 차례대로[i].y - 차례대로[i - 1].y
        if (d < 2000 || d > 10000) { 됨 = false; break }
      }
      if (!됨) continue
      for (const t of 무리) {
        const k = 층열쇠(t.s)
        if (표.has(k) && [...표.get(k).values()].some((r) => !r.자리)) continue   // 글자에서 찾은 값이 있으면 그대로
        const v = Math.round((t.y - 일.y) / 10) * 10
        if (!표.has(k)) 표.set(k, new Map())
        const m = 표.get(k)
        const r = m.get(v) || { 번: 0, 파일: new Set(), 글: `${t.s} — 층 이름 자리로 잼(1층에서 ${(v / 1000).toFixed(2)} m)`, 자리: true }
        r.번++; r.파일.add(이름)
        m.set(v, r)
      }
    }
  }
  const 높이 = {}, 근거 = []
  for (const [k, m] of 표) {
    const 후보 = [...m.entries()].sort((a, b) => b[1].번 - a[1].번 || b[0] - a[0])
    let [v, r] = 후보[0]
    // 같은 층에 값이 둘 이상이면(예: 지하 1층 -3,400 · -7,350) — 위층과 가까운 쪽(보통 층 바닥, 먼 쪽은 피트·기초)을 씁니다
    if (후보.length > 1 && 후보[1][1].번 === r.번) {
      const 위 = k[0] === 'B' ? (k === 'B1' ? 0 : null) : null
      if (위 != null) [v, r] = 후보.slice(0, 2).sort((a, b) => Math.abs(a[0] - 위) - Math.abs(b[0] - 위))[0]
    }
    높이[k] = v
    근거.push({ 층: k, 값: v, 번: r.번, 파일: [...r.파일].join(' · '), 글: r.글,
      다른값: 후보.filter(([x]) => x !== v).map(([x, q]) => `${x} (${q.번}번)`).join(' · ') })
  }
  근거.sort((a, b) => 층차례(a.층) - 층차례(b.층))
  return { 높이, 근거 }
}

/**
 * 층 이름은 없고 높이 글자만 줄지어 있을 때(예: 6층 위의 GL +27,600 · +30,400) —
 * 가장 높은 층보다 위에 있는 «남는 높이» 를 옥상(RF)·옥탑(PH) 차례로 채웁니다.
 */
export function 지붕채우기(높이, 파일들, 필요) {
  const 근거 = []
  const 위층 = Object.keys(높이).filter((k) => k !== 'RF' && k !== 'PH').sort((a, b) => 층차례(b) - 층차례(a))[0]
  if (위층 == null) return 근거
  const 꼭대기 = 높이[위층]
  const 남는 = new Map()
  for (const { texts } of 파일들) {
    for (const t of texts) {
      const r = 높이읽기(t.s)
      if (r && r.v > 꼭대기 + 1000) 남는.set(r.v, (남는.get(r.v) || 0) + 1)
    }
  }
  const 값들 = [...남는.entries()].filter(([, n]) => n >= 2).map(([v]) => v).sort((a, b) => a - b)
  for (const k of ['RF', 'PH']) {
    if (!필요.includes(k) || 높이[k] != null) continue
    const v = 값들.shift()
    if (v == null) break
    높이[k] = v
    근거.push({ 층: k, 값: v, 번: 남는.get(v), 파일: '', 글: `${층이름(위층)} 위로 남는 높이 글자`, 다른값: '' })
  }
  return 근거
}

/** ② 평면도 제목 찾기 */
export function 평면제목(texts) {
  const out = []
  for (const t of texts) {
    if (!/평면도\s*$/.test(t.s) || /구조|배근|주심|천정|천장|바닥계획|방화|방수|단열|우수|배수|조명|전기|설비/.test(t.s)) continue
    const k = 층열쇠(t.s.replace(/평면도\s*$/, ''))
    if (k) out.push({ ...t, 층: k })
  }
  // 같은 층 제목이 둘이면 글자가 큰 쪽(도면 제목)을 씁니다
  const by = new Map()
  for (const t of out) if (!by.has(t.층) || (t.h || 0) > (by.get(t.층).h || 0)) by.set(t.층, t)
  return [...by.values()].sort((a, b) => 층차례(a.층) - 층차례(b.층))
}

const 통심층 = /center|grid|통심|중심선|C-GRD|A-GRID/i
const 세울층 = /wall|벽|col(umn)?\b|col$|기둥|conc|옹벽|parapet|파라펫/i
const 빼는층 = /dim|치수|text|글|hatch|해치|sheet|도곽|leader|sym|furn|fur\b|가구|area|구적/i

/**
 * ③④ 층마다 나눠 옮기고 세웁니다.
 * @param raw   parseDxf(…, {raw:true}) 결과 (평면도 파일)
 * @param 제목   평면제목()
 * @param 높이   {열쇠: mm}
 * @returns {out: Map(버킷키 → 버킷), 층들: [{층, 이름, 높이, 층고, 옮김:[dx,dy], 맞춤}], 근거글: []}
 */
export function 쌓기(raw, 제목, 높이, 새버킷) {
  const 층들 = 제목.filter((t) => 높이[t.층] != null)
  const 빠진 = 제목.filter((t) => 높이[t.층] == null).map((t) => 층이름(t.층))
  if (층들.length < 2) return null
  /* 도곽(도면 테두리) 찾기 — 모델 공간에는 잘라 쓴 외부참조(XCLIP)가 «통째로» 들어 있어
     대지 현황·지형이 수백 m 밖까지 퍼져 있습니다. 층마다 «제 도곽 안의 것만» 씁니다.
     도곽 = 제목을 감싸는 가장 가까운 긴 가로·세로 줄(제목 사이 거리의 40% 넘는 줄) */
  const 사이 = (() => {
    const d = []
    for (let i = 0; i < 층들.length; i++) {
      let m = Infinity
      for (let j = 0; j < 층들.length; j++) if (i !== j) m = Math.min(m, Math.hypot(층들[i].x - 층들[j].x, 층들[i].y - 층들[j].y))
      d.push(m)
    }
    d.sort((a, b) => a - b)
    return d[Math.floor(d.length / 2)]
  })()
  const 긴가로 = [], 긴세로 = []
  for (const [, b] of raw.out) {
    const a = b.pos.a
    for (let i = 0; i < b.pos.n; i += 6) {
      const x1 = a[i], y1 = a[i + 1], x2 = a[i + 3], y2 = a[i + 4]
      if (Math.abs(y2 - y1) < 1 && Math.abs(x2 - x1) > 0.3 * 사이) 긴가로.push([Math.min(x1, x2), Math.max(x1, x2), y1, Math.abs(x2 - x1)])
      else if (Math.abs(x2 - x1) < 1 && Math.abs(y2 - y1) > 0.2 * 사이) 긴세로.push([Math.min(y1, y2), Math.max(y1, y2), x1, Math.abs(y2 - y1)])
    }
  }
  /* 제목 둘레의 긴 줄 가운데 «제목을 사이에 두고, 폭이 제목 사이 거리쯤인 짝» — 가장 긴 짝(도곽 바깥 선) */
  const 짝찾기 = (줄, c, lo, hi) => {
    const 후보 = 줄.filter((q) => Math.abs(q[2] - c) < 1.2 * 사이).sort((p, q) => p[2] - q[2])
    let best = null, 점 = -1
    for (let i = 0; i < 후보.length; i++) {
      if (후보[i][2] >= c) break
      for (let j = 후보.length - 1; j > i; j--) {
        if (후보[j][2] <= c) break
        const w = 후보[j][2] - 후보[i][2]
        if (w < lo * 사이 || w > hi * 사이) continue
        const sc = Math.min(후보[i][3], 후보[j][3]) + w * 1e-3
        if (sc > 점) { 점 = sc; best = [후보[i][2], 후보[j][2]] }
      }
    }
    return best
  }
  const 도곽 = 층들.map((t) => {
    const X = 짝찾기(긴세로.filter((q) => q[0] <= t.y && t.y <= q[1]), t.x, 0.6, 1.1)
    const Y = 짝찾기(긴가로.filter((q) => q[0] <= t.x && t.x <= q[1]), t.y, 0.3, 1.2)
    return X && Y ? [X[0], Y[0], X[1], Y[1]] : null
  })
  const 주인 = (x, y) => {
    let b = -1, bd = Infinity
    for (let i = 0; i < 층들.length; i++) {
      const f = 도곽[i]
      if (f) { if (x >= f[0] && x <= f[2] && y >= f[1] && y <= f[3]) return i; continue }
      const d = Math.hypot(x - 층들[i].x, y - 층들[i].y)
      if (d < bd && d < 0.75 * 사이) { bd = d; b = i }
    }
    return b
  }
  /* 통심선 모으기 (층별, 제목 기준 상대 좌표) — «중심선» 층에는 계단·설비 중심선도 섞여 있어
     그 층에서 가장 긴 줄의 60% 넘는 것만 통심선으로 봅니다(통심선은 건물을 가로지릅니다) */
  const 날것 = 층들.map(() => [])
  for (const [ly, b] of raw.out) {
    if (!통심층.test(ly)) continue
    const a = b.pos.a
    for (let i = 0; i < b.pos.n; i += 6) {
      const x1 = a[i], y1 = a[i + 1], x2 = a[i + 3], y2 = a[i + 4]
      const L = Math.hypot(x2 - x1, y2 - y1)
      if (L < 5000) continue
      const k = 주인((x1 + x2) / 2, (y1 + y2) / 2)
      if (k < 0) continue
      if (Math.abs(x2 - x1) < 1) 날것[k].push(['v', x1 - 층들[k].x, L])
      else if (Math.abs(y2 - y1) < 1) 날것[k].push(['h', y1 - 층들[k].y, L])
    }
  }
  const 통 = 날것.map((arr) => {
    const 긴v = Math.max(0, ...arr.filter((q) => q[0] === 'v').map((q) => q[2]))
    const 긴h = Math.max(0, ...arr.filter((q) => q[0] === 'h').map((q) => q[2]))
    return {
      v: arr.filter((q) => q[0] === 'v' && q[2] >= 0.6 * 긴v).map((q) => q[1]),
      h: arr.filter((q) => q[0] === 'h' && q[2] >= 0.6 * 긴h).map((q) => q[1]),
    }
  })
  /* 기준 층 = 통심선이 가장 많은 층. 나머지는 «겹치는 줄이 가장 많은 만큼» 옮깁니다(표 가르기) */
  const 기준 = 통.reduce((bi, t, i, arr) => (t.v.length + t.h.length > arr[bi].v.length + arr[bi].h.length ? i : bi), 0)
  const 표가르기 = (내것, 기준것) => {
    if (!내것.length || !기준것.length) return { d: 0, 표: 0 }
    const 표 = new Map()
    for (const a of 기준것) for (const b of 내것) {
      const d = Math.round((a - b) / 5) * 5
      if (Math.abs(d) > 3000) continue
      표.set(d, (표.get(d) || 0) + 1)
    }
    let best = 0, n = 0
    for (const [d, c] of 표) if (c > n || (c === n && Math.abs(d) < Math.abs(best))) { best = d; n = c }
    return { d: best, 표: n }
  }
  const 옮김 = 층들.map((t, i) => {
    if (i === 기준) return { dx: 0, dy: 0, 맞춤: '기준' }
    const X = 표가르기(통[i].v, 통[기준].v), Y = 표가르기(통[i].h, 통[기준].h)
    const 맞춤 = (X.표 >= 2 || Y.표 >= 2) ? `통심선 ${X.표 + Y.표}줄 겹침` : '제목 자리로'
    return { dx: X.표 >= 2 ? X.d : 0, dy: Y.표 >= 2 ? Y.d : 0, 맞춤 }
  })
  /* 층고: 다음 층 높이 − 이 층 (맨 위는 0) */
  const 차례 = 층들.map((t, i) => ({ i, v: 높이[t.층] })).sort((a, b) => a.v - b.v)
  const 층고 = new Array(층들.length).fill(0)
  for (let j = 0; j < 차례.length - 1; j++) 층고[차례[j].i] = 차례[j + 1].v - 차례[j].v
  /* 옮기기 · 세우기 */
  const 새 = new Map()
  const 기준점 = [층들[기준].x, 층들[기준].y]
  /* 건물 둘레 — 벽·기둥이 있는 네모(모든 층을 겹친 것)에 여유 4m. 도곽 안이라도 그 밖(대지 현황·범례·열쇠 평면)은 뺍니다 */
  let 둘레 = null
  {
    const xs = [], ys = []
    for (const [ly, b] of raw.out) {
      if (!세울층.test(ly) || 통심층.test(ly)) continue
      const a = b.pos.a
      for (let i = 0; i < b.pos.n; i += 3) {
        const k = 주인(a[i], a[i + 1])
        if (k < 0) continue
        const f = 도곽[k]
        if (f && (a[i] < f[0] || a[i] > f[2] || a[i + 1] < f[1] || a[i + 1] > f[3])) continue
        xs.push(a[i] - 층들[k].x + 기준점[0] + 옮김[k].dx); ys.push(a[i + 1] - 층들[k].y + 기준점[1] + 옮김[k].dy)
      }
    }
    if (xs.length > 20) {
      xs.sort((p, q) => p - q); ys.sort((p, q) => p - q)
      const q = (v, f) => v[Math.floor(f * (v.length - 1))]
      둘레 = [q(xs, 0.002) - 4000, q(ys, 0.002) - 4000, q(xs, 0.998) + 4000, q(ys, 0.998) + 4000]
    }
  }
  let 세운벽 = 0
  for (const [ly, b] of raw.out) {
    if (빼는층.test(ly) && !세울층.test(ly)) continue
    const a = b.pos.a, c = b.col.a
    const 세움 = 세울층.test(ly) && !통심층.test(ly)
    for (let i = 0, ci = 0; i < b.pos.n; i += 6, ci += 6) {
      const mx = (a[i] + a[i + 3]) / 2, my = (a[i + 1] + a[i + 4]) / 2
      const k = 주인(mx, my)
      if (k < 0) continue
      /* 도곽에 걸친 줄은 도곽 선에서 자릅니다 */
      if (도곽[k]) {
        const f = 도곽[k]
        if (a[i] < f[0] || a[i] > f[2] || a[i + 1] < f[1] || a[i + 1] > f[3] || a[i + 3] < f[0] || a[i + 3] > f[2] || a[i + 4] < f[1] || a[i + 4] > f[3]) continue
      }
      const t = 층들[k], o = 옮김[k], z = 높이[t.층]
      const ox = -t.x + 기준점[0] + o.dx, oy = -t.y + 기준점[1] + o.dy
      const x1 = a[i] + ox, y1 = a[i + 1] + oy, x2 = a[i + 3] + ox, y2 = a[i + 4] + oy
      if (둘레 && (Math.max(x1, x2) < 둘레[0] || Math.min(x1, x2) > 둘레[2] || Math.max(y1, y2) < 둘레[1] || Math.min(y1, y2) > 둘레[3] ||
        x1 < 둘레[0] || x1 > 둘레[2] || y1 < 둘레[1] || y1 > 둘레[3] || x2 < 둘레[0] || x2 > 둘레[2] || y2 < 둘레[1] || y2 > 둘레[3])) continue
      const 키 = t.층 + '\u0001' + ly
      let nb = 새.get(키)
      if (!nb) { nb = 새버킷(); 새.set(키, nb) }
      nb.pos.push6(x1, y1, z, x2, y2, z)
      nb.col.push3(c[ci], c[ci + 1], c[ci + 2]); nb.col.push3(c[ci], c[ci + 1], c[ci + 2])
      const H = 층고[k]
      if (세움 && H > 0 && Math.hypot(x2 - x1, y2 - y1) > 1) {
        nb.pos.push6(x1, y1, z + H, x2, y2, z + H)                       // 윗선
        nb.col.push3(c[ci], c[ci + 1], c[ci + 2]); nb.col.push3(c[ci], c[ci + 1], c[ci + 2])
        if (!nb.tri) nb.tri = 새버킷().pos, nb.trc = 새버킷().col
        // 벽 한 장 = 세모 둘
        nb.tri.push3(x1, y1, z); nb.tri.push3(x2, y2, z); nb.tri.push3(x2, y2, z + H)
        nb.tri.push3(x1, y1, z); nb.tri.push3(x2, y2, z + H); nb.tri.push3(x1, y1, z + H)
        for (let q = 0; q < 6; q++) nb.trc.push3(c[ci], c[ci + 1], c[ci + 2])
        세운벽++
      }
    }
  }
  for (const [, b] of raw.out) void b
  return {
    out: 새,
    층들: 층들.map((t, i) => ({ 층: t.층, 이름: 층이름(t.층), 높이: 높이[t.층], 층고: 층고[i], 옮김: [옮김[i].dx, 옮김[i].dy], 맞춤: 옮김[i].맞춤, 제목: t.s, 도곽: !!도곽[i] })),
    세운벽,
    빠진,
    둘레: 둘레 ? [(둘레[2] - 둘레[0]) / 1000, (둘레[3] - 둘레[1]) / 1000] : null,
  }
}

export { 층차례 }
