/**
 * 📷 사진 → 캐드 · ⑨ 3D (G287 · 2026-10-14) — 소장님 「3D도 가능하게 해줘」
 *   평면(도면 사진 · 캐드 사진 · 손그림)의 벽 선을 «벽 높이» 만큼 세움 → 화면에서 돌려 보기(gl3d.js · WebGL · three.js 없음)
 *   받기: 3D DXF(세운 벽 = 3DFACE · 바닥 · 원래 2D 선 · 치수 그대로) · OBJ(스케치업 · 블렌더 · 맥스 — mm)
 *   ⚠️ 도면을 해석하지 않음: «벽 선» 을 그대로 세움(두 줄 벽은 두 면 · 문 열림 호 · 원 · 점선 · 치수선 · 보조선 · 글씨는 바닥에 그대로)
 *      치수선 · 보조선 = 결과그림 의 «꾸밈»(짝지은 치수선이 건물 몸통 밖 · 거기 닿는 직각 선)
 */

/** 그림(결과그림 · mm · y 위로) → 세울 것들 */
export function 세울것(그림, o = {}) {
  const 높 = Math.max(100, Math.min(100000, o.높이 || 2400))
  let 벽 = (그림.선 || []).filter((s) => (s.층 || 'LINE') === 'LINE' && !s.꾸밈 && isFinite(s.a[0]) && isFinite(s.b[0]) && Math.hypot(s.b[0] - s.a[0], s.b[1] - s.a[1]) > 1)
  // 외톨이 짧은 선(다른 벽에 안 닿는 눈금 · 빗금 · 글씨 조각)은 세우지 않음
  {
    let X0 = Infinity, Y0 = Infinity, X1 = -Infinity, Y1 = -Infinity
    for (const s of 벽) for (const p of [s.a, s.b]) { X0 = Math.min(X0, p[0]); Y0 = Math.min(Y0, p[1]); X1 = Math.max(X1, p[0]); Y1 = Math.max(Y1, p[1]) }
    const 크 = Math.max(X1 - X0, Y1 - Y0) || 1, 허 = 0.012 * 크
    const 점선 = (p, s) => { const dx = s.b[0] - s.a[0], dy = s.b[1] - s.a[1], L2 = dx * dx + dy * dy; let t = L2 ? ((p[0] - s.a[0]) * dx + (p[1] - s.a[1]) * dy) / L2 : 0; t = Math.max(0, Math.min(1, t)); return Math.hypot(p[0] - s.a[0] - t * dx, p[1] - s.a[1] - t * dy) }
    벽 = 벽.filter((s) => Math.hypot(s.b[0] - s.a[0], s.b[1] - s.a[1]) >= 0.08 * 크 || 벽.some((e) => e !== s && (점선(s.a, e) <= 허 || 점선(s.b, e) <= 허)))
  }
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (const s of 벽) for (const p of [s.a, s.b]) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]) }
  if (!isFinite(x0)) return null
  const 면 = 벽.map((s) => ({ 점: [[s.a[0], s.a[1], 0], [s.b[0], s.b[1], 0], [s.b[0], s.b[1], 높], [s.a[0], s.a[1], 높]], 층: 'WALL3D' }))
  const 여 = 0.03 * Math.max(x1 - x0, y1 - y0)
  const 바닥 = { 점: [[x0 - 여, y0 - 여, 0], [x1 + 여, y0 - 여, 0], [x1 + 여, y1 + 여, 0], [x0 - 여, y1 + 여, 0]], 층: 'FLOOR3D' }
  return { 높, 벽, 면, 바닥, 범위: [x0 - 여, y0 - 여, 0, x1 + 여, y1 + 여, 높] }
}

/** gl3d.js LineView 층들(가운데를 뺀 좌표) */
export function 보기층(그림, 세) {
  const c = [(세.범위[0] + 세.범위[3]) / 2, (세.범위[1] + 세.범위[4]) / 2, 0]
  const 선 = [], 선색 = []
  const 선넣 = (a, b, rgb) => { 선.push(a[0] - c[0], a[1] - c[1], (a[2] || 0) - c[2], b[0] - c[0], b[1] - c[1], (b[2] || 0) - c[2]); 선색.push(...rgb, ...rgb) }
  const 테 = [38, 72, 170]
  for (const s of 세.벽) {
    선넣([s.a[0], s.a[1], 0], [s.b[0], s.b[1], 0], 테)
    선넣([s.a[0], s.a[1], 세.높], [s.b[0], s.b[1], 세.높], 테)
  }
  // 세운 벽 끝(세로 모서리) — 같은 자리는 한 번
  const 본 = new Set()
  for (const s of 세.벽) for (const p of [s.a, s.b]) { const k = Math.round(p[0] / 5) + ',' + Math.round(p[1] / 5); if (본.has(k)) continue; 본.add(k); 선넣([p[0], p[1], 0], [p[0], p[1], 세.높], 테) }
  // 바닥 그림: 문 열림 호 · 원 · 점선 · 치수선 · 글씨
  const 회 = [150, 160, 180], 주 = [235, 140, 40]
  for (const s of 그림.선 || []) if ((s.층 || 'LINE') !== 'LINE' || s.꾸밈) 선넣([s.a[0], s.a[1], 2], [s.b[0], s.b[1], 2], 회)
  const 호선 = (cx, cy, r, a0, a1, rgb) => { const n = Math.max(8, Math.ceil(Math.abs(a1 - a0) / 8)); for (let i = 0; i < n; i++) { const t0 = (a0 + (a1 - a0) * i / n) * Math.PI / 180, t1 = (a0 + (a1 - a0) * (i + 1) / n) * Math.PI / 180; 선넣([cx + r * Math.cos(t0), cy + r * Math.sin(t0), 2], [cx + r * Math.cos(t1), cy + r * Math.sin(t1), 2], rgb) } }
  for (const a of 그림.호 || []) { let a1 = a.a1; if (a1 < a.a0) a1 += 360; 호선(a.c[0], a.c[1], a.r, a.a0, a1, 주) }
  for (const o of 그림.원 || []) 호선(o.c[0], o.c[1], o.r, 0, 360, 주)
  for (const pl of 그림.줄 || []) for (let i = 0; i + 1 < pl.점.length; i++) 선넣([pl.점[i][0], pl.점[i][1], 2], [pl.점[i + 1][0], pl.점[i + 1][1], 2], [60, 150, 90])
  // 면(세모 둘씩) · 바깥쪽 방향
  const 세모 = [], 법 = [], 면색 = []
  const 면넣 = (q, rgb) => {
    const A = q.map((p) => [p[0] - c[0], p[1] - c[1], p[2] - c[2]])
    const u = [A[1][0] - A[0][0], A[1][1] - A[0][1], A[1][2] - A[0][2]], v = [A[3][0] - A[0][0], A[3][1] - A[0][1], A[3][2] - A[0][2]]
    let n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]; const L = Math.hypot(...n) || 1; n = n.map((x) => x / L)
    for (const k of [0, 1, 2, 0, 2, 3]) { 세모.push(...A[k]); 법.push(...n); 면색.push(...rgb) }
  }
  for (const f of 세.면) 면넣(f.점, [214, 220, 232])
  면넣(세.바닥.점, [70, 80, 100])
  const 층 = {
    name: '벽', pos: new Float32Array(선), col: new Uint8Array(선색), pts: new Float32Array(0), pcol: new Uint8Array(0),
    tri: new Float32Array(세모), trn: new Float32Array(법), trc: new Uint8Array(면색),
  }
  const b = 세.범위
  return { 층들: [층], 상자: [b[0] - c[0], b[1] - c[1], b[2] - c[2], b[3] - c[0], b[4] - c[1], b[5] - c[2]] }
}

/** OBJ(mm · 면 = 벽 + 바닥) */
export function OBJ만들기(세, 이름 = 'K-conmap') {
  const 줄 = [`# ${이름} — 사진 → 캐드 3D (K-건설맵 k-conmap.com) · 단위 mm · 벽 높이 ${세.높}`, 'o walls']
  let n = 0
  const 넣 = (q) => { for (const p of q) 줄.push(`v ${(+p[0]).toFixed(1)} ${(+p[2]).toFixed(1)} ${(-p[1]).toFixed(1)}`); 줄.push(`f ${n + 1} ${n + 2} ${n + 3} ${n + 4}`); n += 4 }
  for (const f of 세.면) 넣(f.점)
  줄.push('o floor'); 넣(세.바닥.점)
  return 줄.join('\n') + '\n'
}
