/**
 * 📷 사진 → 캐드 · ⑦ DXF 쓰기 (2026-10-14 G287)
 *
 * ■ R12(AC1009) 글자 DXF — 손잡이(handle)가 없어 가장 단순하고, AutoCAD · ZWCAD · 캐디안 · BricsCAD · LibreCAD 모두 엽니다.
 * ■ 레이어 이름은 영문(한글 레이어 이름은 캐드 판마다 글자 코드가 달라 깨질 수 있음):
 *     LINE 선 · DASH 점선 · TEXT 원래 글씨(그림으로) · DIM 자동 치수 · DIM_SRC 원래 치수선 · PHOTO_FRAME 사진 테두리
 *     WALL3D 세운 벽(3DFACE) · FLOOR3D 바닥(3DFACE) — 3D 로 받을 때만
 * ■ 치수는 진짜 DIMENSION(이름 없는 블록 *D 와 함께) — 캐드에서 치수로 잡히고, 숫자는 «잰 값» (적힌 숫자대로 맞춘 길이와 같음).
 * ■ 좌표는 mm · y 위로.
 */

const 층색 = { 0: 7, LINE: 7, DASH: 8, TEXT: 3, DIM: 1, DIM_SRC: 9, PHOTO_FRAME: 8, ARC: 7, WALL3D: 4, FLOOR3D: 8 }

function 수(v) { const r = Math.round(v * 10000) / 10000; return (Object.is(r, -0) ? 0 : r).toString() }

/**
 * @param 그림 { 선:[{a,b,층}], 호:[{c,r,a0,a1(도·반시계),층}], 원:[{c,r,층}], 줄:[{점:[[x,y]…],닫힘,층}], 글:[{p,높이,글,각,층}], 치수:[{p1,p2,줄,꼴,글?}] }
 * @param o { 글높이(치수 글 높이 mm) }
 */
export function DXF만들기(그림, o = {}) {
  const 줄 = []
  const P = (k, v) => { 줄.push(String(k)); 줄.push(String(v)) }
  // 범위
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  const 넓 = (p) => { if (!p || !isFinite(p[0]) || !isFinite(p[1])) return; x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]) }
  for (const s of 그림.선 || []) { 넓(s.a); 넓(s.b) }
  for (const a of [...(그림.호 || []), ...(그림.원 || [])]) { 넓([a.c[0] - a.r, a.c[1] - a.r]); 넓([a.c[0] + a.r, a.c[1] + a.r]) }
  for (const d of 그림.치수 || []) { 넓(d.p1); 넓(d.p2); 넓(d.줄) }
  if (!isFinite(x0)) { x0 = 0; y0 = 0; x1 = 1000; y1 = 1000 }
  const 크기 = Math.max(x1 - x0, y1 - y0)
  const 좋은 = [50, 60, 80, 100, 120, 150, 200, 250, 300, 350, 400, 500, 600, 800, 1000, 1500, 2000]
  const 글높 = o.글높이 || 좋은.reduce((b, v) => (Math.abs(v - 크기 / 70) < Math.abs(b - 크기 / 70) ? v : b), 좋은[0])
  const 빗 = 글높 * 0.6

  // HEADER
  P(0, 'SECTION'); P(2, 'HEADER')
  P(9, '$ACADVER'); P(1, 'AC1009')
  P(9, '$INSBASE'); P(10, 0); P(20, 0); P(30, 0)
  P(9, '$EXTMIN'); P(10, 수(x0)); P(20, 수(y0)); P(30, 0)
  P(9, '$EXTMAX'); P(10, 수(x1)); P(20, 수(y1)); P(30, 0)
  P(9, '$LIMMIN'); P(10, 수(x0)); P(20, 수(y0))
  P(9, '$LIMMAX'); P(10, 수(x1)); P(20, 수(y1))
  P(9, '$LUNITS'); P(70, 2)
  P(9, '$LUPREC'); P(70, 0)
  P(9, '$DIMSCALE'); P(40, 1)
  P(9, '$DIMTXT'); P(40, 수(글높))
  P(9, '$DIMTSZ'); P(40, 수(빗))
  P(9, '$DIMASZ'); P(40, 수(빗))
  P(9, '$DIMEXO'); P(40, 수(글높 * 0.4))
  P(9, '$DIMEXE'); P(40, 수(글높 * 0.5))
  P(9, '$DIMGAP'); P(40, 수(글높 * 0.3))
  P(9, '$DIMTAD'); P(70, 1)
  P(9, '$DIMTIH'); P(70, 0)
  P(9, '$DIMTOH'); P(70, 0)
  P(9, '$DIMDEC'); P(70, 0)
  P(0, 'ENDSEC')

  // TABLES
  P(0, 'SECTION'); P(2, 'TABLES')
  P(0, 'TABLE'); P(2, 'LTYPE'); P(70, 2)
  P(0, 'LTYPE'); P(2, 'CONTINUOUS'); P(70, 0); P(3, 'Solid line'); P(72, 65); P(73, 0); P(40, 0)
  P(0, 'LTYPE'); P(2, 'DASHED'); P(70, 0); P(3, '__ __ __'); P(72, 65); P(73, 2); P(40, 수(글높 * 3)); P(49, 수(글높 * 2)); P(49, 수(-글높)); P(0, 'ENDTAB')
  const 층들 = Object.keys(층색)
  P(0, 'TABLE'); P(2, 'LAYER'); P(70, 층들.length)
  for (const n of 층들) { P(0, 'LAYER'); P(2, n); P(70, 0); P(62, 층색[n]); P(6, n === 'DASH' ? 'DASHED' : 'CONTINUOUS') }
  P(0, 'ENDTAB')
  P(0, 'TABLE'); P(2, 'STYLE'); P(70, 1)
  P(0, 'STYLE'); P(2, 'STANDARD'); P(70, 0); P(40, 0); P(41, 1); P(50, 0); P(71, 0); P(42, 수(글높)); P(3, 'txt'); P(4, '')
  P(0, 'ENDTAB')
  P(0, 'TABLE'); P(2, 'DIMSTYLE'); P(70, 1)
  P(0, 'DIMSTYLE'); P(2, 'STANDARD'); P(70, 0)
  for (const [k, v] of [[3, ''], [4, ''], [5, ''], [6, ''], [7, ''], [40, 1], [41, 수(빗)], [42, 수(글높 * 0.4)], [43, 수(글높 * 1.5)], [44, 수(글높 * 0.5)], [45, 0], [46, 0], [47, 0], [48, 0], [140, 수(글높)], [141, 0], [142, 수(빗)], [143, 25.4], [144, 1], [145, 0], [146, 1], [147, 수(글높 * 0.3)], [71, 0], [72, 0], [73, 0], [74, 0], [75, 0], [76, 0], [77, 1], [78, 0], [170, 0], [171, 2], [172, 0], [173, 0], [174, 0], [175, 0], [176, 0], [177, 0], [178, 0]]) P(k, v)
  P(0, 'ENDTAB')
  P(0, 'ENDSEC')

  // BLOCKS — 치수마다 이름 없는 블록
  const 치 = 그림.치수 || []
  P(0, 'SECTION'); P(2, 'BLOCKS')
  const 선쓰 = (a, b, 층 = '0') => { P(0, 'LINE'); P(8, 층); P(10, 수(a[0])); P(20, 수(a[1])); P(30, 0); P(11, 수(b[0])); P(21, 수(b[1])); P(31, 0) }
  const 글쓰 = (p, h, t, 각 = 0, 층 = '0') => { P(0, 'TEXT'); P(8, 층); P(10, 수(p[0])); P(20, 수(p[1])); P(30, 0); P(40, 수(h)); P(1, t); if (각) P(50, 수(각)); P(72, 1); P(11, 수(p[0])); P(21, 수(p[1])); P(31, 0) }
  const 치정보 = 치.map((d, i) => {
    const 가로 = d.꼴 === 'H'
    // 치수선 자리 = d.줄 (가로면 y, 세로면 x)
    const A = 가로 ? [d.p1[0], d.줄[1]] : [d.줄[0], d.p1[1]]
    const B = 가로 ? [d.p2[0], d.줄[1]] : [d.줄[0], d.p2[1]]
    const 길 = 가로 ? Math.abs(d.p2[0] - d.p1[0]) : Math.abs(d.p2[1] - d.p1[1])
    const 글 = d.글 || String(Math.round(길))
    const 가운 = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2]
    // 글 자리: 선 위(가로) · 선 왼쪽(세로, 반시계로 돌린 글)
    const 글자리 = 가로 ? [가운[0], 가운[1] + 글높 * 0.8] : [가운[0] - 글높 * 0.8, 가운[1]]
    return { 이름: `*D${i + 1}`, A, B, 글, 글자리, 가로 }
  })
  치정보.forEach((q, i) => {
    const d = 치[i]
    P(0, 'BLOCK'); P(8, '0'); P(2, q.이름); P(70, 1); P(10, 0); P(20, 0); P(30, 0); P(3, q.이름)
    선쓰(q.A, q.B, 'DIM')
    // 보조선: 재는 점에서 치수선까지 (틈 · 넘침)
    for (const [p, e] of [[d.p1, q.A], [d.p2, q.B]]) {
      const v = [e[0] - p[0], e[1] - p[1]], L = Math.hypot(v[0], v[1])
      if (L > 글높 * 0.5) {
        const u = [v[0] / L, v[1] / L]
        선쓰([p[0] + u[0] * 글높 * 0.4, p[1] + u[1] * 글높 * 0.4], [e[0] + u[0] * 글높 * 0.5, e[1] + u[1] * 글높 * 0.5], 'DIM')
      }
      // 빗금
      선쓰([e[0] - 빗 / 2, e[1] - 빗 / 2], [e[0] + 빗 / 2, e[1] + 빗 / 2], 'DIM')
    }
    글쓰(q.글자리, 글높, q.글, q.가로 ? 0 : 90, 'DIM')
    P(0, 'ENDBLK'); P(8, '0')
  })
  P(0, 'ENDSEC')

  // ENTITIES
  P(0, 'SECTION'); P(2, 'ENTITIES')
  for (const s of 그림.선 || []) {
    if (!isFinite(s.a[0]) || !isFinite(s.b[0])) continue
    P(0, 'LINE'); P(8, s.층 || 'LINE'); P(10, 수(s.a[0])); P(20, 수(s.a[1])); P(30, 0); P(11, 수(s.b[0])); P(21, 수(s.b[1])); P(31, 0)
  }
  for (const a of 그림.호 || []) {
    P(0, 'ARC'); P(8, a.층 || 'LINE'); P(10, 수(a.c[0])); P(20, 수(a.c[1])); P(30, 0); P(40, 수(a.r)); P(50, 수(((a.a0 % 360) + 360) % 360)); P(51, 수(((a.a1 % 360) + 360) % 360))
  }
  for (const c of 그림.원 || []) { P(0, 'CIRCLE'); P(8, c.층 || 'LINE'); P(10, 수(c.c[0])); P(20, 수(c.c[1])); P(30, 0); P(40, 수(c.r)) }
  for (const pl of 그림.줄 || []) {
    if (!pl.점 || pl.점.length < 2) continue
    P(0, 'POLYLINE'); P(8, pl.층 || 'TEXT'); P(66, 1); P(70, pl.닫힘 ? 1 : 0); P(10, 0); P(20, 0); P(30, 0)
    for (const p of pl.점) { P(0, 'VERTEX'); P(8, pl.층 || 'TEXT'); P(10, 수(p[0])); P(20, 수(p[1])); P(30, 0) }
    P(0, 'SEQEND'); P(8, pl.층 || 'TEXT')
  }
  for (const t of 그림.글 || []) 글쓰(t.p, t.높이 || 글높, String(t.글).replace(/[^\x20-\x7e]/g, '?'), t.각 || 0, t.층 || 'TEXT')
  // 3D 면(3DFACE · 네 점 — 세모면 넷째 = 셋째)
  for (const f of 그림.면 || []) {
    const q = f.점.length === 3 ? [...f.점, f.점[2]] : f.점
    P(0, '3DFACE'); P(8, f.층 || 'WALL3D')
    q.forEach((p, k) => { P(10 + k, 수(p[0])); P(20 + k, 수(p[1])); P(30 + k, 수(p[2] || 0)) })
  }
  치정보.forEach((q, i) => {
    const d = 치[i]
    P(0, 'DIMENSION'); P(8, 'DIM'); P(2, q.이름)
    P(10, 수(q.B[0])); P(20, 수(q.B[1])); P(30, 0)
    P(11, 수(q.글자리[0])); P(21, 수(q.글자리[1])); P(31, 0)
    P(70, 0)
    if (d.글) P(1, d.글)
    P(13, 수(d.p1[0])); P(23, 수(d.p1[1])); P(33, 0)
    P(14, 수(d.p2[0])); P(24, 수(d.p2[1])); P(34, 0)
    P(50, q.가로 ? 0 : 90)
    P(3, 'STANDARD')
  })
  P(0, 'ENDSEC')
  P(0, 'EOF')
  return 줄.join('\r\n') + '\r\n'
}
