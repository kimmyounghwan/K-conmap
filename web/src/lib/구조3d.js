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
function 겹침(ts, xs, 틈 = 60) {
  const 표 = new Map()
  for (const t of ts) for (const x of xs) {
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
  const 글자 = T.filter((t) => /^[A-Z]\d?$/.test(붙(t.s)) && t.x > PW[0] && t.x < PW[2] && t.y > PW[1] && t.y < PW[3])
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
  const 긴쪽x = px1 - px0 >= py1 - py0
  for (const d of 단면들) {
    const 글 = d.이름.split('-')[0]
    const 쌍 = 짝.get(글)
    let P, Q, 놓임
    if (쌍 && 쌍.length >= 2) {
      /* 가장 먼 두 글자 */
      let a = 쌍[0], b = 쌍[1], m = -1
      for (let i = 0; i < 쌍.length; i++) for (let j = i + 1; j < 쌍.length; j++) { const L = Math.hypot(쌍[i].x - 쌍[j].x, 쌍[i].y - 쌍[j].y); if (L > m) { m = L; a = 쌍[i]; b = 쌍[j] } }
      P = [a.x, a.y]; Q = [b.x, b.y]; 놓임 = `평면의 ${글} ─ ${글} 선`
    } else if (d.x1 - d.x0 > 0.6 * Math.max(px1 - px0, py1 - py0)) {
      /* 짝이 없는 긴 단면(종단) — 평면 긴 쪽 가운데 줄 */
      const c = 긴쪽x ? (py0 + py1) / 2 : (px0 + px1) / 2
      P = 긴쪽x ? [px0, c] : [c, py0]; Q = 긴쪽x ? [px1, c] : [c, py1]; 놓임 = '평면 긴 쪽 가운데 줄(종단)'
    } else { 빠짐.push(`${d.이름}(평면에 ${글} ─ ${글} 자르는 선 없음)`); continue }
    const { out: 자리, L } = 지나는자리(P, Q)
    /* 단면 가로 = 자르는 선 방향. 옮김·방향은 벽 자리 겹침으로 (못 맞추면 가운데끼리) */
    const 앞 = 겹침(자리, d.세로.map((x) => x - d.x0))
    const 뒤 = 겹침(자리.map((t) => L - t), d.세로.map((x) => x - d.x0))
    let 뒤집 = false, 옮 = (L - (d.x1 - d.x0)) / 2, 맞춤 = '가운데끼리'
    if (Math.max(앞.n, 뒤.n) >= 3) {
      if (뒤.n > 앞.n) { 뒤집 = true; 옮 = 뒤.d } else 옮 = 앞.d
      맞춤 = `벽 ${Math.round(Math.max(앞.n, 뒤.n))}곳 겹침`
    }
    const ux = (Q[0] - P[0]) / L, uy = (Q[1] - P[1]) / L
    const 자리xy = (x) => { let t = x - d.x0 + 옮; if (뒤집) t = L - t; return [P[0] + ux * t, P[1] + uy * t] }
    const 키 = 머리 + d.표시
    for (const s of d.선) {
      const [ax, ay] = 자리xy(s[1]), [bx, by] = 자리xy(s[3])
      넣기(키, s[0], ax, ay, d.EL(s[2]) * 1000, bx, by, d.EL(s[4]) * 1000, s[5], s[6], s[7])
    }
    결과단면.push({ 층: 키, 이름: `단면 ${d.표시}`, 놓임, EL: [d.lo, d.hi], 맞춤: `${맞춤} · EL 글자 ${d.맞음}/${d.표수} 맞음` })
  }
  if (결과단면.length < 2) return null
  /* m 로 그린 도면(기울기 1)이면 가로·세로도 mm 로 */
  if (단면들.every((d) => d.기울 === 1)) {
    for (const [, b] of 새) for (let i = 0; i < b.pos.n; i += 3) { b.pos.a[i] *= 1000; b.pos.a[i + 1] *= 1000 }
  }
  return { out: 새, 단면: 결과단면, 평면EL, 빠짐, 제목: 평제.s }
}
