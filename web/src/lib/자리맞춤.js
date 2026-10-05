/**
 * 📍 도면 3D — 도면끼리 «같은 글자» 로 자리 맞추기 (2026-10-05)
 *
 * 소장님: 「캐드별 좌표가 정확히 일치하지는 않아. 그래서, 가장근사치에 있는 좌표를 기준으로 해야 하지 않을까?」
 *         「계획평면도를 기준으로 해야 할 것 같은데」
 *         「평면도에도 좌표가 안입혀져 있어. 대부분 그래, 그래서 좌표가 있는 측량도면을 측량성과표 도면을 꼭 넣어달라고 해야 하지 않아.」
 *
 * ■ 두 도면에 같이 적힌 글자 — 지번(338-1답) · 측점(NO.3+5.0) · 기준점 이름(TBM-1 · 송금-3) · 측량점 번호 · 표고 숫자 —
 *   은 같은 자리를 가리킵니다. 그런 짝을 모아 «돌리고 옮기는» 값 하나를 찾습니다(축척은 그대로 — 도면 단위는 mm 로 맞춘 뒤).
 * ■ 짝 가운데 엉뚱한 것(다른 노선의 NO.0, 표 안의 같은 숫자)이 섞여 있으므로, 두 짝씩 골라 맞춰 보고 «가장 많은 짝이
 *   맞는 값» 을 고릅니다(RANSAC). 그다음 맞는 짝들로 최소제곱 → 짝마다 남은 오차를 표로 보여 드립니다.
 * ■ 소장님 도면으로 시험: 02 계획평면도 ↔ GPS 측량도면 — 지번 11개가 맞고 회전 −0.31°, 오차 0.02~0.98 m.
 * ■ 좌표는 모두 mm. 결과 T = {a, b, tx, ty} :  x' = a·x − b·y + tx ,  y' = b·x + a·y + ty  (a = s·cosθ, b = s·sinθ)
 */

const 반각 = (s) => String(s ?? '').normalize('NFKC')

/**
 * 글자 → 짝 열쇠 { k, w(무게) } | null
 * @param ly 레이어 이름(정수 글자는 «측량점 번호» 레이어일 때만 씁니다 — 치수·개수 숫자와 헷갈리지 않게)
 */
export function 글열쇠(s, ly = '') {
  const t = 반각(s).trim()
  const c = t.replace(/\s+/g, '').toUpperCase()
  if (!c || c.length > 24) return null
  let m = c.match(/^(?:NO|STA)\.?(\d{1,4})(?:([+-])(\d{1,4}(?:\.\d+)?))?$/)
  if (m) return { k: `측${+m[1]}${m[2] || '+'}${(+(m[3] || 0)).toFixed(1)}`, w: 1, 종: '측점' }
  m = c.match(/^(\d{1,3})\+(\d{3}(?:\.\d+)?)$/)
  if (m) return { k: `km${+m[1]}+${(+m[2]).toFixed(1)}`, w: 1, 종: '측점' }
  if (/^(산)?\d{1,5}(-\d{1,4})?[가-힣]{1,2}$/.test(c)) return { k: '지' + c, w: 1, 종: '지번' }
  if (/^(T\.?B\.?M|B\.?M|C\.?P|도근점?|기준점?|수준점?|삼각점?|보조점?|GPS|IP|BC|EC|SP|EP|BH|NB|M\.?H|맨홀)[-.\s]*(NO\.?)?[-]?\d{1,4}[A-Z]?$/.test(c))
    return { k: '점' + c.replace(/\./g, '').replace(/^(TBM|BM|CP|GPS|IP|BC|EC|SP|EP|BH|NB|MH)-?/, '$1-').replace(/^(도근|기준|수준|삼각|보조)점?-?/, '$1-').replace(/^맨홀-?(NO)?-?/, 'MH-'), w: 1, 종: '기준점' }
  if (/^[가-힣]{1,4}-\d{1,4}$/.test(c)) return { k: '점' + c, w: 1, 종: '기준점' }
  if (/^[-+]?\d{1,4}\.\d{2,3}$/.test(c)) return { k: '높' + (+c).toFixed(3), w: 0.4, 종: '표고' }
  if (/^\d{1,5}$/.test(c)) return /point|pnt|pno|num|번호|점번|측량점|성과/i.test(ly) ? { k: '번' + +c, w: 0.6, 종: '측량점' } : null
  if (c.length >= 2 && c.length <= 20 && /[A-Z가-힣]/.test(c) && !/^[A-Z]$/.test(c)) return { k: '글' + c, w: 0.5, 종: '글자' }
  return null
}

/** 도면 글자들 → 짝 후보 [{k, w, 종, x, y, s, 숨?}] (좌표에 배를 곱해 mm 로 · 숨은층(레이어) 이 참이면 «숨» 표 — 캐드에서 꺼 둔 층) */
export function 글짝들(texts, 배 = 1, 숨은층 = null) {
  const out = []
  for (const t of texts || []) {
    const q = 글열쇠(t.s, t.ly)
    if (q) out.push({ ...q, x: t.x * 배, y: t.y * 배, s: t.s, ...(숨은층 && 숨은층(t.ly) ? { 숨: true } : {}) })
  }
  return out
}

/* ── 변환 ─────────────────────────────── */
export const 그대로 = { a: 1, b: 0, tx: 0, ty: 0 }
export const 변환하기 = (T, x, y) => [T.a * x - T.b * y + T.tx, T.b * x + T.a * y + T.ty]
/** 두 변환 잇기: 먼저 S, 다음 T */
export const 잇기 = (S, T) => ({ a: T.a * S.a - T.b * S.b, b: T.b * S.a + T.a * S.b, tx: T.a * S.tx - T.b * S.ty + T.tx, ty: T.b * S.tx + T.a * S.ty + T.ty })
export const 회전도 = (T) => (Math.atan2(T.b, T.a) * 180) / Math.PI
export const 축척 = (T) => Math.hypot(T.a, T.b)
/** 짝들 [[ax,ay,bx,by]] → 최소제곱 (축척자유면 닮음, 아니면 돌리고 옮기기만) */
export function 짝풀기(짝, 축척자유 = false) {
  const n = 짝.length
  if (!n) return null
  let ax = 0, ay = 0, bx = 0, by = 0
  for (const p of 짝) { ax += p[0]; ay += p[1]; bx += p[2]; by += p[3] }
  ax /= n; ay /= n; bx /= n; by /= n
  let sc = 0, ss = 0, aa = 0
  for (const p of 짝) {
    const x = p[0] - ax, y = p[1] - ay, u = p[2] - bx, v = p[3] - by
    sc += x * u + y * v; ss += x * v - y * u; aa += x * x + y * y
  }
  const th = Math.atan2(ss, sc)
  const s = 축척자유 && aa > 0 ? Math.hypot(sc, ss) / aa : 1
  const a = s * Math.cos(th), b = s * Math.sin(th)
  return { a, b, tx: bx - (a * ax - b * ay), ty: by - (b * ax + a * ay) }
}
/** 두 점 찍기 — A1→B1, A2→B2 (축척은 그대로, 두 점의 가운데를 맞춤) */
export function 두점변환(A1, A2, B1, B2, 축척자유 = false) {
  return 짝풀기([[A1[0], A1[1], B1[0], B1[1]], [A2[0], A2[1], B2[0], B2[1]]], 축척자유)
}

/* 같은 씨앗이면 같은 결과(시험이 매번 같게) */
function 씨앗(n) { let s = n >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296 } }

/**
 * 두 글자 무리(A: 옮길 도면, B: 기준) → 맞춤 | null
 * @param opt.틈  맞은 짝으로 볼 거리(mm) — 기본 2.5 m (도면마다 글자를 놓은 자리가 조금씩 다름)
 * @returns null | { 됨, 까닭, T, 짝:[{k, s, 종, a:[x,y], b:[x,y], e}], n, w, rms, max, 퍼짐, 두께, 축척자유 }  — 됨이 false 면 쓰지 말 것
 */
export function 짝맞추기(A, B, opt = {}) {
  const 틈 = opt.틈 || 2500
  const 최소퍼짐 = opt.최소퍼짐 || 10000
  const 묶 = (L) => { const m = new Map(); for (const p of L) { let a = m.get(p.k); if (!a) { a = []; m.set(p.k, a) } a.push(p) } return m }
  const MA = 묶(A), MB = 묶(B)
  /* 짝 후보 — 양쪽에 다 있고, 한쪽에 너무 많지 않은 열쇠 */
  const 열쇠 = []
  for (const [k, a] of MA) {
    const b = MB.get(k)
    if (!b) continue
    const 한도 = a[0].w >= 1 ? 6 : 3
    if (a.length > 한도 || b.length > 한도) continue
    열쇠.push({ k, a, b, w: a[0].w, 하나: a.length === 1 && b.length === 1 })
  }
  if (열쇠.length < 2) return null
  /* 무거운(측점·지번·기준점) · 하나뿐인 열쇠부터 — 가설은 그 짝들로 세웁니다 */
  열쇠.sort((p, q) => (q.w - p.w) || (Number(q.하나) - Number(p.하나)))
  const 짝 = []
  for (const e of 열쇠) for (const a of e.a) for (const b of e.b) { 짝.push({ e, a, b }); if (짝.length >= 4000) break }
  const 가설짝 = 짝.slice(0, 300)

  const 점수 = (T) => {
    let w = 0, n = 0
    const 쓴 = new Set()
    for (const p of 짝) {
      if (쓴.has(p.e)) continue
      const [x, y] = 변환하기(T, p.a.x, p.a.y)
      if (Math.abs(x - p.b.x) <= 틈 && Math.abs(y - p.b.y) <= 틈 && Math.hypot(x - p.b.x, y - p.b.y) <= 틈) { 쓴.add(p.e); w += p.e.w; n++ }
    }
    return { w, n }
  }
  const 해보기 = (축척자유) => {
    let best = null
    const 시험 = (p, q) => {
      if (p.e === q.e) return
      const dax = q.a.x - p.a.x, day = q.a.y - p.a.y, dbx = q.b.x - p.b.x, dby = q.b.y - p.b.y
      const 길a = Math.hypot(dax, day), 길b = Math.hypot(dbx, dby)
      if (!(길a > 0) || 길b < 최소퍼짐 / 4) return
      const s = 길b / 길a
      if (!축척자유 && Math.abs(s - 1) > 0.02) return
      if (축척자유 && (s < 1e-4 || s > 1e4)) return
      const th = Math.atan2(dby, dbx) - Math.atan2(day, dax)
      const k = 축척자유 ? s : 1
      const a = k * Math.cos(th), b = k * Math.sin(th)
      const T = { a, b, tx: p.b.x - (a * p.a.x - b * p.a.y), ty: p.b.y - (b * p.a.x + a * p.a.y) }
      const sc = 점수(T)
      if (!best || sc.w > best.sc.w + 1e-9) best = { T, sc }
    }
    const 가 = 축척자유 ? 가설짝.slice(0, 120) : 가설짝
    const G = 가.length
    if (G * G <= 90000) { for (let i = 0; i < G; i++) for (let j = i + 1; j < G; j++) 시험(가[i], 가[j]) }
    else { const r = 씨앗(G * 7919 + 짝.length); for (let t = 0; t < 45000; t++) 시험(가[Math.floor(r() * G)], 가[Math.floor(r() * G)]) }
    if (!best) return null
    /* 맞은 짝들로 다시 풀고, 그 값으로 다시 고르기 (두 번) */
    let T = best.T, 고른 = []
    for (let 번 = 0; 번 < 3; 번++) {
      고른 = []
      const 쓴 = new Map()
      for (const p of 짝) {
        const [x, y] = 변환하기(T, p.a.x, p.a.y)
        const e = Math.hypot(x - p.b.x, y - p.b.y)
        if (e > 틈) continue
        const 앞 = 쓴.get(p.e)
        if (!앞 || e < 앞.e) 쓴.set(p.e, { p, e })
      }
      고른 = [...쓴.values()].map((v) => v.p)
      if (고른.length < 2) return null
      const 새 = 짝풀기(고른.map((p) => [p.a.x, p.a.y, p.b.x, p.b.y]), 축척자유)
      if (!새) return null
      T = 새
    }
    const 결과짝 = 고른.map((p) => {
      const [x, y] = 변환하기(T, p.a.x, p.a.y)
      return { k: p.e.k, s: p.a.s || p.b.s || p.e.k, 종: p.a.종, a: [p.a.x, p.a.y], b: [p.b.x, p.b.y], e: Math.hypot(x - p.b.x, y - p.b.y) }
    }).sort((p, q) => q.e - p.e)
    const n = 결과짝.length
    const w = 고른.reduce((s, p) => s + p.e.w, 0)
    const rms = Math.sqrt(결과짝.reduce((s, p) => s + p.e * p.e, 0) / n)
    /* 퍼짐 · 두께 — 기준 쪽 점들의 크기와 «한 줄로만 늘어선 것» 인지(작은 축 표준편차) */
    let mx = 0, my = 0
    for (const p of 결과짝) { mx += p.b[0]; my += p.b[1] }
    mx /= n; my /= n
    let sxx = 0, syy = 0, sxy = 0
    for (const p of 결과짝) { const x = p.b[0] - mx, y = p.b[1] - my; sxx += x * x; syy += y * y; sxy += x * y }
    sxx /= n; syy /= n; sxy /= n
    const 반 = (sxx + syy) / 2, 차 = Math.sqrt(((sxx - syy) / 2) ** 2 + sxy * sxy)
    const 긴 = Math.sqrt(Math.max(0, 반 + 차)), 두께 = Math.sqrt(Math.max(0, 반 - 차))
    return { T, 짝: 결과짝, n, w, rms, max: 결과짝[0].e, 퍼짐: 긴 * 2, 두께, 축척자유 }
  }
  /* 받아들이는 조건 — 짝 3개(축척이 다르면 4개) 넘고, 무게(측점·지번·기준점 = 1, 글자 0.5, 표고 0.4) 2.5 넘고,
     10 m 넘게 퍼져 있고, «한 줄» 이 아닐 것.
     ⚠️ 소장님 도면 08 ↔ GPS 측량도면: 곧은 배수로의 측점(NO.1~5, 50 m 간격)만 맞은 박스는 다른 노선(3호·4호)도 똑같이 맞았습니다.
        곧은 줄 위의 점들은 «그 줄의 어디인지» 를 못 정하므로, 작은 축 두께가 1.5 m(또는 긴 축의 4%) 안 되면 받지 않습니다. */
  const 판정 = (r, 최소) => {
    if (!r) return null
    let 까닭 = ''
    if (r.n < 최소 || r.w < 2.5) 까닭 = '같은 글자 짝이 모자람'
    else if (r.퍼짐 < 최소퍼짐) 까닭 = '맞은 글자가 한곳에 몰려 있음'
    else if (r.두께 < Math.max(1500, 0.04 * r.퍼짐 / 2)) 까닭 = '맞은 글자가 한 줄로만 늘어서 방향을 정할 수 없음(곧은 노선의 측점만 맞음)'
    return { ...r, 됨: !까닭, 까닭 }
  }
  const r1 = 판정(해보기(false), 3)
  if (r1 && r1.됨) return r1
  /* 축척이 다른 도면(단위를 잘못 읽었거나 종이 축척으로 줄여 그린 것) — 짝이 더 많아야 받아들이고, 무거운 짝(측점·지번·기준점)이 3개 넘어야 합니다 */
  let r2 = opt.축척자유 === false ? null : 판정(해보기(true), 4)
  /* 축척이 10 의 거듭제곱(×1000 = m 와 mm)에 1% 안으로 맞으면 «단위가 달랐던 것» — 그 배수로 딱 맞추고 다시 풉니다 */
  if (r2 && r2.됨) {
    const s = 축척(r2.T), k = Math.pow(10, Math.round(Math.log10(s)))
    if (k !== 1 && Math.abs(s / k - 1) < 0.01) {
      const 짝k = r2.짝.map((p) => [p.a[0] * k, p.a[1] * k, p.b[0], p.b[1]])
      const T0 = 짝풀기(짝k, false)
      if (T0) {
        const T = { a: T0.a * k, b: T0.b * k, tx: T0.tx, ty: T0.ty }
        const 짝 = r2.짝.map((p) => { const [x, y] = 변환하기(T, p.a[0], p.a[1]); return { ...p, e: Math.hypot(x - p.b[0], y - p.b[1]) } }).sort((p, q) => q.e - p.e)
        r2 = { ...r2, T, 짝, 단위배: k, rms: Math.sqrt(짝.reduce((t, p) => t + p.e * p.e, 0) / 짝.length), max: 짝[0].e }
      }
    }
  }
  if (r2 && r2.됨 && !r2.단위배 && r2.짝.filter((p) => p.종 === '측점' || p.종 === '지번' || p.종 === '기준점').length < 3) r2 = { ...r2, 됨: false, 까닭: '축척이 다른 짝은 측점·지번·기준점이 3개 넘어야 받습니다' }
  if (r2 && r2.됨) return r2
  return r1 || r2
}
