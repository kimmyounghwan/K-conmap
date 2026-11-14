/**
 * 📏 G685 K-적산컨맵 «캐드에서 고른 것» (2026-11-14 소장님 「적산컨맵 업그레이드 … 캐드로 작업할 수 있게」 · 「편하지만 정확하게」 · 「물론 3D 되어야 하고」)
 *   캐드 명령 KCMS(tools/pc연결/kcm.lsp)가 고른 객체를 «보내기\kcms_<번호>.csv»(탭으로 나눈 글)로 쓰고 →
 *   K-적산컨맵 연결 프로그램이 넘김 → 작업 화면(📏 캐드 탭)이 여기서 풀어 줄로 만듦
 *   ■ 자동 읽기가 아니라 «사람이 캐드에서 고른 것» — 셈 · 검사는 건설맵: 길이(볼록 호는 반지름 × 각도) · 닫힌 선 면적(신발끈 + 활꼴) · 블록 개수 ·
 *     치수 글자 대조 · 같은 객체 두 번 고름 · 닫힌 선 안 글자(실 이름) 근거
 *   ■ 짐작 안 함: 도면 단위(INSUNITS)가 없으면 ❓(사람이 고름) · 높이 · 두께가 비면 그 줄 수량은 비움(❓) · 셈 못 하는 객체(해치 · 스플라인 …)는 세어 알림
 *   ■ 길이 · 면적은 저장하지 않고 늘 «원(캐드가 보낸 좌표 · 도면 단위 그대로)» 에서 다시 셈 — 단위를 나중에 골라도 바로 맞음(옛 값이 남지 않게)
 *
 * 글 꼴(판 1 — 바꾸면 kcm.lsp 도 같이 · 시험 tools/시험_캐드고름.mjs · tools/시험_캐드고름리습.py 가 두 벌을 봄):
 *   첫 줄  KCMSEL ⇥ 1 ⇥ 도면 경로 ⇥ INSUNITS ⇥ 적요 ⇥ 고른 수 ⇥ ACADVER ⇥ PRODUCT
 *   객체   종류 ⇥ 레이어 ⇥ 핸들 ⇥ 닫힘(0/1) ⇥ z ⇥ 점들 ⇥ 값들 ⇥ 글 ⇥ 돌출
 *     LINE        점 = 시작;끝(x,y — WCS) · 값 = 시작z,끝z
 *     LWPOLYLINE  점 = x,y,볼록;… (OCS) · z = 높이(38)
 *     POLYLINE    점 = x,y,볼록;… (2D = OCS · 3D = WCS) · 값 = 꼴(70),z1,z2,…
 *     ARC         값 = 가운데x,가운데y,반지름,시작각,끝각(라디안 · OCS)
 *     CIRCLE      값 = 가운데x,가운데y,반지름(OCS)
 *     ELLIPSE     값 = 가운데x,가운데y,긴축x,긴축y,비,시작,끝(WCS · 매개변수 라디안)
 *     INSERT      점 = 넣은 곳(OCS) · 값 = 배율x,배율y,회전,열,행 · 글 = 블록 이름
 *     TEXT/MTEXT  점 = 자리(OCS) · 값 = 높이 · 글 = 글
 *     DIMENSION   점 = 잰 두 점(13;14 — WCS) · 값 = 잰 값(42),꼴(70),회전(50) · 글 = 바꾼 글(1)
 *     그 밖       종류 · 레이어 · 핸들만(셈 못 함 — 세어 알림)
 *     돌출 = 210 이 (0,0,1) 이 아니면 «x,y,z» — (0,0,-1) 이면 OCS x 를 뒤집어 WCS 로 · 기울었으면 셈 못 함(3D 객체)
 */

export const 머리말 = 'KCMSEL'
export const 단위표 = { 1: 25.4, 2: 304.8, 4: 1, 5: 10, 6: 1000 }      // INSUNITS → mm (0 = 없음 → ❓)
export const 단위이름 = { 1: 'inch', 2: 'feet', 4: 'mm', 5: 'cm', 6: 'm' }
export const 고를단위 = [4, 5, 6, 1, 2]
export const 한번최대 = 5000          // 한 번에 받는 객체(넘으면 앞 것만 · 알림)
export const 모두최대 = 20000         // 이 화면에 두는 줄
export const 갈래들 = [
  ['길이', '길이 (m)', 'm'],
  ['길이높이', '길이 × 높이 (㎡)', '㎡'],
  ['면적', '면적 (㎡)', '㎡'],
  ['면적두께', '면적 × 두께 (㎥)', '㎥'],
  ['개수', '개수 (개)', '개'],
]
export const 갈래단위 = Object.fromEntries(갈래들.map((g) => [g[0], g[2]]))
export const 종류이름 = { LINE: '선', LWPOLYLINE: '폴리선', POLYLINE: '폴리선', ARC: '호', CIRCLE: '원', ELLIPSE: '타원', INSERT: '블록', TEXT: '글자', MTEXT: '글자', DIMENSION: '치수',
  HATCH: '해치', SPLINE: '스플라인', REGION: '영역', SOLID: '솔리드', '3DSOLID': '3D 솔리드', '3DFACE': '3D 면', POINT: '점', LEADER: '지시선', MLEADER: '지시선', XLINE: '무한선', RAY: '반무한선', WIPEOUT: '가림', IMAGE: '그림', OLE2FRAME: 'OLE', TABLE: '표', ACAD_TABLE: '표', MLINE: '다중선' }
const 셈종류 = ['LINE', 'LWPOLYLINE', 'POLYLINE', 'ARC', 'CIRCLE', 'ELLIPSE', 'INSERT']
const 글종류 = ['TEXT', 'MTEXT', 'DIMENSION']
const OCS종류 = ['LWPOLYLINE', 'POLYLINE', 'ARC', 'CIRCLE', 'ELLIPSE', 'INSERT', 'TEXT', 'MTEXT']

/** 받은 바이트 → 글(UTF-16 → UTF-8 → EUC-KR(CP949)) — 캐드마다 쓰는 글자 꼴이 달라서(옛 판 = 윈도 기본 · 새 판 = 유니코드) */
export function 글풀기(buf) {
  const u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
  const 풀 = (꼴, b, fatal = false) => new TextDecoder(꼴, fatal ? { fatal: true } : undefined).decode(b)
  if (u8.length >= 2 && u8[0] === 0xff && u8[1] === 0xfe) return 풀('utf-16le', u8.subarray(2))
  if (u8.length >= 2 && u8[0] === 0xfe && u8[1] === 0xff) return 풀('utf-16be', u8.subarray(2))
  if (u8.length >= 4 && u8[0] !== 0 && u8[1] === 0 && u8[2] !== 0 && u8[3] === 0) return 풀('utf-16le', u8)      // 머리말 없는 UTF-16
  if (u8.length >= 4 && u8[0] === 0 && u8[1] !== 0 && u8[2] === 0 && u8[3] !== 0) return 풀('utf-16be', u8)
  try { return 풀('utf-8', u8, true).replace(/^\uFEFF/, '') } catch (e) { /* CP949 */ }
  try { return 풀('euc-kr', u8) } catch (e) { return 풀('utf-8', u8) }
}

const 수 = (s) => { const v = parseFloat(String(s ?? '').trim()); return Number.isFinite(v) ? v : NaN }
const 같다 = (a, b, e = 1e-9) => Math.abs(a - b) <= e

/** MTEXT 꾸밈(\P · {\f…;} · \A1; · \L …)과 %% 부호를 뗀 맨 글 */
export function 글다듬기(t) {
  return String(t || '')
    .replace(/\\\\/g, '\u0001').replace(/\\\{/g, '\u0002').replace(/\\\}/g, '\u0003')
    .replace(/\\P/g, ' ').replace(/\\~/g, ' ').replace(/\\[LlOoKk]/g, '')
    .replace(/\\[A-Za-z][^;\\{}]*;/g, '').replace(/[{}]/g, '')
    .replace(/%%[cC]/g, 'Ø').replace(/%%[dD]/g, '°').replace(/%%[pP]/g, '±').replace(/%%[uUoO]/g, '').replace(/%%%/g, '%')
    .replace(/\u0001/g, '\\').replace(/\u0002/g, '{').replace(/\u0003/g, '}')
    .replace(/\s+/g, ' ').trim()
}

/**
 * 글 → {머리:{판, 도면, 단위, 적요, 개수, 캐드}, 객체:[…], 못읽음:n} · 첫 줄이 KCMSEL 이 아니면 null
 *   객체 = {종류, 레이어, 핸들, 닫힘, z, 점:[[x,y,볼록]], 값:[…], 글, 블록, 개수, 높이다름, 못읽음(까닭)} — 돌출(0,0,-1)은 여기서 WCS 로 바꿔 둠
 */
export function 고름읽기(글) {
  const 줄 = String(글 || '').split(/\r?\n|\r/).filter((x) => x.trim())
  if (!줄.length) return null
  const h = 줄[0].split('\t')
  if (h[0].trim() !== 머리말) return null
  const 머리 = { 판: (h[1] || '1').trim(), 도면: (h[2] || '').trim(), 단위: Number.parseInt(h[3], 10) || 0, 적요: 글다듬기(h[4] || ''), 개수: Number.parseInt(h[5], 10) || 0,
    캐드: [(h[7] || '').trim(), (h[6] || '').trim()].filter(Boolean).join(' ') }
  const 객체 = []
  for (const 한 of 줄.slice(1)) {
    const c = 한.split('\t')
    const 종류 = (c[0] || '').trim().toUpperCase()
    if (!종류) continue
    const 점 = (c[5] || '').split(';').filter((x) => x.trim()).map((p) => p.split(',').map(수)).filter((p) => p.length >= 2 && Number.isFinite(p[0]) && Number.isFinite(p[1]))
      .map((p) => [p[0], p[1], Number.isFinite(p[2]) ? p[2] : 0])
    const 값 = (c[6] || '').split(',').filter((x) => x.trim() !== '').map(수)
    const o = { 종류, 레이어: (c[1] || '').trim(), 핸들: (c[2] || '').trim().toUpperCase(), 닫힘: (c[3] || '').trim() === '1', z: Number.isFinite(수(c[4])) ? 수(c[4]) : 0, 점, 값 }
    const 글칸 = c[7] || ''
    /* 돌출(210) — 없음 = (0,0,1) */
    const 돌 = (c[8] || '').split(',').map(수)
    let 뒤집 = false, 기움 = false
    if (돌.length === 3 && 돌.every(Number.isFinite)) {
      if (Math.abs(돌[0]) > 1e-6 || Math.abs(돌[1]) > 1e-6 || Math.abs(Math.abs(돌[2]) - 1) > 1e-6) 기움 = true
      else if (돌[2] < 0) 뒤집 = true
    }
    if (종류 === 'POLYLINE') {
      const 꼴 = Number.isFinite(값[0]) ? 값[0] | 0 : 0
      o.삼차원 = !!(꼴 & 8)
      if (꼴 & (16 | 64)) o.못읽음 = '그물(메시) 폴리선'
      const zs = 값.slice(1).filter(Number.isFinite)
      if (o.삼차원 && zs.length > 1 && Math.max(...zs) - Math.min(...zs) > 1e-6) o.높이다름 = true
    }
    if (종류 === 'LINE' && 값.length >= 2 && Number.isFinite(값[0]) && Number.isFinite(값[1]) && Math.abs(값[0] - 값[1]) > 1e-6) o.높이다름 = true
    if (기움 && OCS종류.includes(종류) && !(종류 === 'POLYLINE' && o.삼차원)) o.못읽음 = '기울어진(3D) 객체'
    if (뒤집 && !o.못읽음 && !(종류 === 'POLYLINE' && o.삼차원)) {
      /* (0,0,-1) — WCS x = −OCS x · 볼록 · 호 방향도 뒤집힘(셈은 같고 그림 자리만 바뀜) */
      if (종류 === 'LWPOLYLINE' || 종류 === 'POLYLINE') o.점 = o.점.map((p) => [-p[0], p[1], -(p[2] || 0)])
      else if (종류 === 'ARC' && 값.length >= 5) o.값 = [-값[0], 값[1], 값[2], Math.PI - 값[4], Math.PI - 값[3]]
      else if (종류 === 'CIRCLE' && 값.length >= 3) o.값 = [-값[0], 값[1], 값[2]]
      else if (종류 === 'ELLIPSE') o.돌z = -1                   // ELLIPSE 는 WCS — 매개변수 도는 쪽만 반대
      else if (종류 === 'INSERT' || 종류 === 'TEXT' || 종류 === 'MTEXT') o.점 = o.점.map((p) => [-p[0], p[1], 0])
    }
    if (종류 === 'INSERT') {
      o.블록 = 글칸.trim()
      const 열 = Number.isFinite(값[3]) ? Math.max(1, 값[3] | 0) : 1, 행 = Number.isFinite(값[4]) ? Math.max(1, 값[4] | 0) : 1
      o.개수 = 열 * 행
    }
    if (글종류.includes(종류)) o.글 = 글다듬기(글칸)
    if (종류 === 'DIMENSION') { o.치수꼴 = Number.isFinite(값[1]) ? (값[1] | 0) & 7 : 0; o.회전 = Number.isFinite(값[2]) ? 값[2] : 0 }
    if (!셈종류.includes(종류) && !글종류.includes(종류)) o.못읽음 = 종류이름[종류] || 종류
    객체.push(o)
  }
  return { 머리, 객체, 못읽음: 객체.filter((o) => o.못읽음).length }
}

/* ── 기하(도면 단위 그대로 — mm 바꿈은 k 로) ── */
/** 볼록 토막 하나의 참 길이 (볼록 = tan(θ/4)) */
export function 토막길이(a, c, b) {
  const d = Math.hypot(c[0] - a[0], c[1] - a[1])
  if (!b || d < 1e-12) return d
  const th = 4 * Math.atan(Math.abs(b))
  return (d / (2 * Math.sin(th / 2))) * th
}
/** 볼록 토막의 활꼴 넓이(부호 = 볼록 부호 — 볼록 + 는 가는 쪽 오른편으로 부풂) */
function 활꼴(a, c, b) {
  if (!b) return 0
  const d = Math.hypot(c[0] - a[0], c[1] - a[1])
  if (d < 1e-12) return 0
  const th = 4 * Math.atan(Math.abs(b))
  const r = d / (2 * Math.sin(th / 2))
  return (Math.sign(b) * r * r * (th - Math.sin(th))) / 2
}
/** 꼭짓점 [x, y, 볼록] 들의 길이 · (닫혔으면) 면적 */
export function 폴리기하(P, 닫힘) {
  const n = P.length
  let 길이 = 0
  const 끝 = 닫힘 ? n : n - 1
  for (let i = 0; i < 끝; i++) 길이 += 토막길이(P[i], P[(i + 1) % n], P[i][2] || 0)
  if (!닫힘 || n < 2) return { 길이, 면적: 0 }
  let s = 0, 활 = 0
  for (let i = 0; i < n; i++) { const a = P[i], c = P[(i + 1) % n]; s += a[0] * c[1] - c[0] * a[1]; 활 += 활꼴(a, c, a[2] || 0) }
  return { 길이, 면적: Math.abs(s / 2 + 활) }
}
/** 볼록 토막을 짧은 꺾은선으로(그림 · 안에 든 글자 찾기 — 셈은 폴리기하) */
export function 볼록펴기(P, 닫힘) {
  const out = []
  const n = P.length
  const 끝 = 닫힘 ? n : n - 1
  for (let i = 0; i < 끝; i++) {
    const a = P[i], c = P[(i + 1) % n], b = a[2] || 0
    out.push([a[0], a[1]])
    const d = Math.hypot(c[0] - a[0], c[1] - a[1])
    if (!b || d < 1e-12) continue
    const ux = (c[0] - a[0]) / d, uy = (c[1] - a[1]) / d
    const 옆 = ((d / 2) * (1 - b * b)) / (2 * b)              // 가운데점에서 원 가운데까지(왼쪽 +)
    const cx = (a[0] + c[0]) / 2 - uy * 옆, cy = (a[1] + c[1]) / 2 + ux * 옆
    const r = Math.hypot(a[0] - cx, a[1] - cy)
    const th = 4 * Math.atan(b)
    const t0 = Math.atan2(a[1] - cy, a[0] - cx)
    const k = Math.max(2, Math.ceil(Math.abs(th) / (Math.PI / 36)))
    for (let j = 1; j < k; j++) { const t = t0 + (th * j) / k; out.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]) }
  }
  if (!닫힘 && n) out.push([P[n - 1][0], P[n - 1][1]])
  return out
}
/** 타원 — 매개변수 t 에서 점(돌z −1 이면 짧은 축이 반대) */
function 타원점(v, 돌z, t) {
  const [cx, cy, mx, my, q] = v
  const nx = 돌z < 0 ? my : -my, ny = 돌z < 0 ? -mx : mx      // 돌출 × 긴축
  return [cx + Math.cos(t) * mx + Math.sin(t) * q * nx, cy + Math.cos(t) * my + Math.sin(t) * q * ny]
}

/** 객체 하나 → {길이, 면적(mm · mm²), 개수, 그림:[[x,y]](mm), 닫힘} (k = 도면 단위 → mm) · 셈 못 하면 null */
export function 객체기하(o, k) {
  if (!o || o.못읽음 || !(k > 0)) return null
  const m = (v) => v * k
  const 점 = o.점 || [], 값 = o.값 || []
  if (o.종류 === 'LINE' && 점.length >= 2) {
    const [a, c] = 점
    return { 길이: m(Math.hypot(c[0] - a[0], c[1] - a[1])), 면적: 0, 개수: 0, 그림: [[m(a[0]), m(a[1])], [m(c[0]), m(c[1])]], 닫힘: false }
  }
  if ((o.종류 === 'LWPOLYLINE' || o.종류 === 'POLYLINE') && 점.length >= 2) {
    const g = 폴리기하(점, !!o.닫힘)
    return { 길이: m(g.길이), 면적: g.면적 * k * k, 개수: 0, 그림: 볼록펴기(점, !!o.닫힘).map((p) => [m(p[0]), m(p[1])]), 닫힘: !!o.닫힘 && 점.length >= 3 }
  }
  if (o.종류 === 'ARC' && 값.length >= 5 && 값.slice(0, 5).every(Number.isFinite)) {
    const [cx, cy, r, a0, a1] = 값
    let th = a1 - a0
    while (th <= 1e-12) th += Math.PI * 2
    while (th > Math.PI * 2 + 1e-12) th -= Math.PI * 2
    const 그림 = []
    const n = Math.max(4, Math.ceil(th / (Math.PI / 36)))
    for (let i = 0; i <= n; i++) { const t = a0 + (th * i) / n; 그림.push([m(cx + r * Math.cos(t)), m(cy + r * Math.sin(t))]) }
    return { 길이: m(r * th), 면적: 0, 개수: 0, 그림, 닫힘: false }
  }
  if (o.종류 === 'CIRCLE' && 값.length >= 3 && 값.slice(0, 3).every(Number.isFinite)) {
    const [cx, cy, r] = 값
    const 그림 = []
    for (let i = 0; i < 72; i++) { const t = (i / 72) * Math.PI * 2; 그림.push([m(cx + r * Math.cos(t)), m(cy + r * Math.sin(t))]) }
    return { 길이: m(2 * Math.PI * r), 면적: Math.PI * r * r * k * k, 개수: 0, 그림, 닫힘: true }
  }
  if (o.종류 === 'ELLIPSE' && 값.length >= 7 && 값.slice(0, 7).every(Number.isFinite)) {
    const [, , mx, my, q, p0] = 값
    let p1 = 값[6]
    while (p1 - p0 <= 1e-9) p1 += Math.PI * 2
    if (p1 - p0 > Math.PI * 2 + 1e-9) p1 = p0 + Math.PI * 2
    const a = Math.hypot(mx, my), b = a * q
    const 온 = Math.abs(p1 - p0 - Math.PI * 2) < 1e-6
    /* 둘레 = ∫ √(a² sin² t + b² cos² t) dt (심프슨 720칸 — 손셈 라마누잔과 0.001 % 안) */
    const N = 720, h = (p1 - p0) / N
    let s = 0
    for (let i = 0; i <= N; i++) { const t = p0 + h * i, f = Math.sqrt(a * a * Math.sin(t) ** 2 + b * b * Math.cos(t) ** 2); s += f * (i === 0 || i === N ? 1 : i % 2 ? 4 : 2) }
    const 길이 = (s * h) / 3
    const 그림 = []
    const n = Math.max(8, Math.ceil(((p1 - p0) / (Math.PI * 2)) * 72))
    for (let i = 0; i <= n - (온 ? 1 : 0); i++) { const p = 타원점(값, o.돌z || 1, p0 + ((p1 - p0) * i) / n); 그림.push([m(p[0]), m(p[1])]) }
    return { 길이: m(길이), 면적: 온 ? Math.PI * a * b * k * k : 0, 개수: 0, 그림, 닫힘: 온 }
  }
  if (o.종류 === 'INSERT' && 점.length) return { 길이: 0, 면적: 0, 개수: o.개수 || 1, 그림: [[m(점[0][0]), m(점[0][1])]], 닫힘: false }
  return null
}

/* 점이 꺾은선 안에 드나(짝수 · 홀수 규칙) */
function 안에(p, 꼴) {
  let 안 = false
  for (let i = 0, j = 꼴.length - 1; i < 꼴.length; j = i++) {
    const a = 꼴[i], b = 꼴[j]
    if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < ((b[0] - a[0]) * (p[1] - a[1])) / (b[1] - a[1] + 1e-300) + a[0]) 안 = !안
  }
  return 안
}

/* ── 줄 만들기 ── */
let 줄번 = 0
const 새id = (머) => 머 + Date.now().toString(36) + (줄번++).toString(36)
const 기본갈래 = (o, g) => (o.종류 === 'INSERT' ? '개수' : g && g.닫힘 && g.면적 > 0 ? '면적' : '길이')
const 숫자글 = (t) => /^\s*[-+]?[\d,]*\.?\d+\s*$/.test(String(t || '')) && /\d/.test(String(t || ''))
export const 도면키 = (도면, 핸들) => String(도면 || '').toLowerCase() + '|' + String(핸들 || '').toUpperCase()

/**
 * 받은 묶음 → {묶음, 줄:[…], 알림:[…]}
 * @param 읽 고름읽기 결과 · @param o {층, 있는핸들:Set(도면키), 이름(받은 파일 이름), 때}
 *   줄 = {id, 묶음, 종류, 레이어, 핸들, 블록, 원:{점, 값, 닫힘, 개수, 돌z}, 갈래, 적요, 구간, 층, 높이, 두께, 공제, 횟수, 치수:{도면값, 잰, 글, 다름}, 치수씀, 글근거, 높이다름}
 */
export function 줄만들기(읽, o = {}) {
  const 단위 = 읽.머리.단위
  const k = 단위표[단위] || null
  const 묶음 = { id: 새id('b'), 때: o.때 || Date.now(), 도면: 읽.머리.도면, 이름: o.이름 || '', 단위: k ? 단위 : 0, 적요: 읽.머리.적요 || '', 캐드: 읽.머리.캐드 || '', 받음: 읽.객체.length, 셈못: 0, 두번: 0, 넘침: 0 }
  const 알림 = []
  const 줄 = []
  const 있는 = o.있는핸들 || new Set()
  const 판k = k || 1                      // 단위를 몰라도 «안에 든 글자 · 치수 맞음» 은 도면 단위로 봄(비율이라 같음)
  const 글들 = 읽.객체.filter((x) => (x.종류 === 'TEXT' || x.종류 === 'MTEXT') && x.점.length && x.글)
  const 치수들 = 읽.객체.filter((x) => x.종류 === 'DIMENSION' && x.점.length >= 2 && x.값.length && (x.치수꼴 === 0 || x.치수꼴 === 1))
  const 못종류 = new Map()
  const 닫힌 = []
  for (const ob of 읽.객체) {
    if (글종류.includes(ob.종류)) continue                                  // 글자 · 치수는 근거 · 대조에만 씀
    if (ob.못읽음) { 묶음.셈못++; 못종류.set(ob.못읽음, (못종류.get(ob.못읽음) || 0) + 1); continue }
    const 키 = 도면키(읽.머리.도면, ob.핸들)
    if (ob.핸들 && 있는.has(키)) { 묶음.두번++; continue }
    const g = 객체기하(ob, 판k)
    if (!g) { 묶음.셈못++; 못종류.set(종류이름[ob.종류] || ob.종류, (못종류.get(종류이름[ob.종류] || ob.종류) || 0) + 1); continue }
    if (줄.length >= 한번최대) { 묶음.넘침++; continue }
    if (ob.핸들) 있는.add(키)
    const 원 = { 점: ob.점, 값: ob.값, 닫힘: !!ob.닫힘 }
    if (ob.개수 > 1) 원.개수 = ob.개수
    if (ob.돌z) 원.돌z = ob.돌z
    const r = { id: 새id('c'), 묶음: 묶음.id, 종류: ob.종류, 레이어: ob.레이어, 핸들: ob.핸들, 블록: ob.블록 || '', 원, 갈래: 기본갈래(ob, g),
      적요: '', 구간: '', 층: o.층 || '', 높이: '', 두께: '', 공제: '', 횟수: '1' }
    if (ob.높이다름) r.높이다름 = true
    if (g.닫힘 && g.그림.length >= 3) 닫힌.push({ r, 꼴: g.그림.map((p) => [p[0] / 판k, p[1] / 판k]), 넓: g.면적 })
    /* 치수 대조 — 같이 고른 선형 · 정렬 치수의 두 점이 이 선 끝 가까이(길이 2 % · 20 mm 안)이고 방향이 같으면 견줌 · 다름 = 0.2 % · 10 mm 넘게 */
    if (ob.종류 === 'LINE' || ((ob.종류 === 'LWPOLYLINE' || ob.종류 === 'POLYLINE') && ob.점.length === 2 && !ob.점[0][2] && !ob.닫힘)) {
      const [a, c] = ob.점
      const L = Math.hypot(c[0] - a[0], c[1] - a[1])
      const 붙 = Math.max(L * 0.02, 20 / 판k)
      for (const d of 치수들) {
        const [p, q] = d.점
        const 가까 = (u, v) => Math.hypot(u[0] - v[0], u[1] - v[1]) <= 붙
        if (!((가까(p, a) && 가까(q, c)) || (가까(p, c) && 가까(q, a)))) continue
        if (d.치수꼴 === 0 && L > 1e-9 && Math.abs(Math.sin(Math.atan2(c[1] - a[1], c[0] - a[0]) - d.회전)) > 0.01) continue    // 비스듬한 선의 가로 · 세로 치수(투영)는 견주지 않음
        const 치값 = 숫자글(d.글) ? 수(d.글.replace(/[,\s]/g, '')) : d.값[0]
        if (!Number.isFinite(치값) || 치값 <= 0) continue
        r.치수 = { 도면값: 치값, 잰: L, 글: d.글 || '' }
        if (Math.abs(L - 치값) > Math.max(10 / 판k, L * 0.002)) r.치수.다름 = true
        break
      }
    }
    줄.push(r)
  }
  /* 닫힌 선 안에 든 글자(실 이름 · 부호) — 그 글자를 품은 가장 작은 닫힌 선 하나에만 근거로(건물 테두리 안 방 이름이 테두리에 붙지 않게) · 적요가 비면 그 글 */
  for (const t of 글들) {
    const p = [t.점[0][0], t.점[0][1]]
    let 고 = null
    for (const c of 닫힌) if ((!고 || c.넓 < 고.넓) && 안에(p, c.꼴)) 고 = c
    if (고) (고.글 = 고.글 || []).push(t.글)
  }
  for (const c of 닫힌) if (c.글) c.r.글근거 = [...new Set(c.글)].slice(0, 3).join(' · ')
  if (!k) 알림.push('❓ 도면 단위(INSUNITS)가 없습니다 — 위에서 이 도면의 단위(mm · cm · m)를 골라 주십시오(짐작하지 않음).')
  if (묶음.두번) 알림.push(`이미 받은 객체 ${묶음.두번}개는 빼고 받았습니다(같은 도면 · 같은 핸들 — 두 번 세지 않게).`)
  if (묶음.셈못) 알림.push(`셈할 수 없는 객체 ${묶음.셈못}개(${[...못종류].map(([t, n]) => t + ' ' + n).join(' · ')})는 받지 않았습니다 — 닫힌 폴리선 · 선으로 다시 그리거나 골라 주십시오.`)
  if (묶음.넘침) 알림.push(`한 번에 ${한번최대.toLocaleString('ko-KR')}개까지 받습니다 — 남은 ${묶음.넘침.toLocaleString('ko-KR')}개는 나눠서 다시 보내 주십시오.`)
  const 치다 = 줄.filter((r) => r.치수 && r.치수.다름).length
  if (치다) 알림.push(`⚠ 치수 글자와 그려진 길이가 다른 선 ${치다}줄 — 노란 줄에서 어느 쪽으로 셈할지 골라 주십시오.`)
  const 삼 = 줄.filter((r) => r.높이다름).length
  if (삼) 알림.push(`3D 로 그린 선(끝 높이가 다름) ${삼}줄은 평면 길이로 셉니다.`)
  return { 묶음, 줄, 알림 }
}

/* ── 셈 ── */
const 넣은수 = (s) => { const t = String(s ?? '').replace(/,/g, '').trim(); if (t === '') return null; const v = Number(t); return Number.isFinite(v) ? v : NaN }
const 반 = (v, n = 3) => Math.round((v + Number.EPSILON * Math.sign(v)) * 10 ** n) / 10 ** n
const 쉼표 = (v, n = 3) => (Number.isFinite(v) ? v.toLocaleString('ko-KR', { maximumFractionDigits: n }) : '')

/**
 * 줄 하나 → {수량, 단위, 식, 빈칸:[…], 틀림:[…], 길이, 면적, 개수}
 *   식 = (기본 량 − 공제) × 횟수 · 높이 · 두께 · 닫힌 선 · 도면 단위가 없으면 수량 null(❓)
 * @param g 객체기하(mm) · @param k 도면 단위 → mm (없으면 null)
 */
export function 줄셈(r, g, k) {
  const 빈칸 = [], 틀림 = []
  const 횟 = 넣은수(r.횟수) ?? 1
  const 공 = 넣은수(r.공제) ?? 0
  if (Number.isNaN(횟)) 틀림.push('횟수'); else if (횟 < 0) 틀림.push('횟수(음수)')
  if (Number.isNaN(공)) 틀림.push('공제')
  const 단위 = 갈래단위[r.갈래] || ''
  const 길이 = g ? (r.치수씀 && r.치수 && k ? (r.치수.도면값 * k) / 1000 : g.길이 / 1000) : null
  const 면적 = g ? g.면적 / 1e6 : null
  const 개수 = g ? g.개수 : r.원 && r.원.개수 ? r.원.개수 : r.종류 === 'INSERT' ? 1 : 0
  let 기본 = null, 앞 = ''
  if (r.갈래 === '개수') { 기본 = 개수; 앞 = `${개수}` }
  else if (!k || !g) 빈칸.push('도면 단위')
  else if (r.갈래 === '길이') { 기본 = 길이; 앞 = 쉼표(길이) }
  else if (r.갈래 === '길이높이') {
    const h = 넣은수(r.높이)
    if (h === null) 빈칸.push('높이'); else if (Number.isNaN(h) || h < 0) 틀림.push('높이')
    else { 기본 = 길이 * h; 앞 = `${쉼표(길이)} × ${h}` }
  } else if (r.갈래 === '면적' || r.갈래 === '면적두께') {
    if (!g.닫힘) 빈칸.push('닫힌 선')
    else if (r.갈래 === '면적') { 기본 = 면적; 앞 = 쉼표(면적) }
    else {
      const t = 넣은수(r.두께)
      if (t === null) 빈칸.push('두께'); else if (Number.isNaN(t) || t < 0) 틀림.push('두께')
      else { 기본 = 면적 * t; 앞 = `${쉼표(면적)} × ${t}` }
    }
  }
  let 수량 = null, 식 = ''
  if (기본 !== null && !틀림.length) {
    수량 = (기본 - 공) * 횟
    식 = (공 ? `(${앞} − ${공})` : 앞) + (횟 !== 1 ? ` × ${횟}` : '')
    if (수량 < -1e-9) { 틀림.push('공제가 더 큼'); 수량 = null }
  }
  return { 수량: 수량 === null ? null : 반(수량), 단위, 식, 빈칸, 틀림, 길이, 면적, 개수 }
}

/** 모든 줄 셈 + 적요 · 층 · 단위로 모은 집계 + 검사 — 셈 = [{r, b(묶음), k, g, …줄셈}] */
export function 캐드셈(캐드) {
  const 묶음표 = new Map(((캐드 && 캐드.묶음) || []).map((b) => [b.id, b]))
  const 셈 = ((캐드 && 캐드.줄) || []).map((r) => {
    const b = 묶음표.get(r.묶음) || null
    const k = b ? 단위표[b.단위] || null : null
    const g = 객체기하({ 종류: r.종류, ...r.원 }, k || 1)
    return { r, b, k, g: k ? g : null, 판g: g, ...줄셈(r, k ? g : null, k) }
  })
  const 모음 = new Map()
  for (const x of 셈) {
    if (x.수량 === null) continue
    const 적 = 적요글(x.r, x.b)
    const 키 = [x.단위, 적, x.r.층, x.r.구간].join('\u0001')
    const a = 모음.get(키) || { 단위: x.단위, 적요: 적, 층: x.r.층, 구간: x.r.구간, 수량: 0, 줄: 0 }
    a.수량 += x.수량; a.줄++
    모음.set(키, a)
  }
  const 단위차 = ['m', '㎡', '㎥', '개']
  const 집계 = [...모음.values()].map((a) => ({ ...a, 수량: 반(a.수량) })).sort((p, q) => 단위차.indexOf(p.단위) - 단위차.indexOf(q.단위) || p.적요.localeCompare(q.적요, 'ko') || String(p.층).localeCompare(String(q.층), 'ko', { numeric: true }) || String(p.구간).localeCompare(String(q.구간), 'ko'))
  const 합 = {}
  for (const x of 셈) if (x.수량 !== null) 합[x.단위] = (합[x.단위] || 0) + x.수량
  for (const u of Object.keys(합)) 합[u] = 반(합[u])
  const 검사 = {
    빈칸: 셈.filter((x) => x.빈칸.length).length,
    틀림: 셈.filter((x) => x.틀림.length).length,
    치수다름: 셈.filter((x) => 치수남음(x.r)).length,
    단위없음: [...묶음표.values()].filter((b) => !단위표[b.단위] && 셈.some((x) => x.r.묶음 === b.id)).length,     // 줄이 있는 묶음만(다 «이미 받음» 으로 빠진 묶음은 고를 것이 없음)
    높이다름: 셈.filter((x) => x.r.높이다름).length,
    수량: 셈.filter((x) => x.수량 !== null).length,
  }
  return { 셈, 집계, 합, 검사 }
}
/** 치수 글과 잰 길이가 달라 아직 고르지 않은 줄(치수씀 = 치수 값으로 · 치수봄 = 잰 길이 그대로) */
export const 치수남음 = (r) => !!(r && r.치수 && r.치수.다름 && !r.치수씀 && !r.치수봄)
/** 적요(비면 묶음 적요 → 안에 든 글자 → 블록 이름 → 레이어) */
export function 적요글(r, b) {
  const t = String(r.적요 || '').trim()
  if (t) return t
  if (b && b.적요) return b.적요
  if (r.글근거) return r.글근거
  if (r.블록 && !/^\*/.test(r.블록)) return r.블록
  return r.레이어 || '(레이어 없음)'
}

/** 단위를 고름(❓ → mm · cm · m …) — 줄의 «원» 으로 다시 셈하므로 묶음 단위만 바꾸면 됨 */
export function 단위바꾸기(캐드, 묶음id, 단위) {
  if (!단위표[단위]) return 캐드
  return { ...캐드, 묶음: 캐드.묶음.map((b) => (b.id === 묶음id ? { ...b, 단위 } : b)) }
}
/** 묶음 하나를 뺌(그 줄도) */
export function 묶음빼기(캐드, 묶음id) {
  return { 묶음: 캐드.묶음.filter((b) => b.id !== 묶음id), 줄: 캐드.줄.filter((r) => r.묶음 !== 묶음id) }
}
/** 받은 것을 더함 — 모두최대 를 넘으면 넘는 줄은 뺌 */
export function 묶음더하기(캐드, 새) {
  const 앞 = 캐드 || { 묶음: [], 줄: [] }
  const 자리 = Math.max(0, 모두최대 - 앞.줄.length)
  const 줄 = 새.줄.slice(0, 자리)
  return { 캐드: { 묶음: [...앞.묶음, { ...새.묶음, 넘침: (새.묶음.넘침 || 0) + (새.줄.length - 줄.length) }], 줄: [...앞.줄, ...줄] }, 뺌: 새.줄.length - 줄.length }
}
/** 이미 받은 객체(도면 · 핸들) — 두 번 받지 않게 */
export function 있는핸들(캐드) {
  const 도 = new Map(((캐드 && 캐드.묶음) || []).map((b) => [b.id, b.도면]))
  return new Set(((캐드 && 캐드.줄) || []).filter((r) => r.핸들).map((r) => 도면키(도.get(r.묶음), r.핸들)))
}

/** 저장 정돈 — 모양이 틀린 것은 버림(손으로 고친 저장 · 옛 판에도 화면이 멈추지 않게) */
export function 캐드정돈(x) {
  if (!x || typeof x !== 'object') return null
  const 글 = (v) => (v === null || v === undefined ? '' : String(v))
  const 수n = (v, d = 0) => (Number.isFinite(+v) ? +v : d)
  const 묶음 = (Array.isArray(x.묶음) ? x.묶음 : []).filter((b) => b && typeof b.id === 'string').map((b) => ({
    id: b.id, 때: 수n(b.때, 0), 도면: 글(b.도면), 이름: 글(b.이름), 단위: 단위표[b.단위] ? +b.단위 : 0, 적요: 글(b.적요), 캐드: 글(b.캐드),
    받음: 수n(b.받음), 셈못: 수n(b.셈못), 두번: 수n(b.두번), 넘침: 수n(b.넘침), ...(b.예시 ? { 예시: true } : {}) }))
  const 있 = new Set(묶음.map((b) => b.id))
  const 점들 = (a) => (Array.isArray(a) ? a.filter((p) => Array.isArray(p) && p.length >= 2 && Number.isFinite(+p[0]) && Number.isFinite(+p[1])).map((p) => [+p[0], +p[1], Number.isFinite(+p[2]) ? +p[2] : 0]) : [])
  const 줄 = (Array.isArray(x.줄) ? x.줄 : []).filter((r) => r && typeof r.id === 'string' && 있.has(r.묶음) && 갈래단위[r.갈래] !== undefined && r.원 && typeof r.원 === 'object' && 셈종류.includes(r.종류)).slice(0, 모두최대).map((r) => {
    const 원 = { 점: 점들(r.원.점), 값: (Array.isArray(r.원.값) ? r.원.값 : []).map((v) => (Number.isFinite(+v) ? +v : NaN)), 닫힘: !!r.원.닫힘 }
    if (r.원.개수 > 1) 원.개수 = Math.floor(r.원.개수)
    if (r.원.돌z) 원.돌z = r.원.돌z < 0 ? -1 : 1
    const o = { id: r.id, 묶음: r.묶음, 종류: r.종류, 레이어: 글(r.레이어), 핸들: 글(r.핸들), 블록: 글(r.블록), 원, 갈래: r.갈래,
      적요: 글(r.적요), 구간: 글(r.구간), 층: 글(r.층), 높이: 글(r.높이), 두께: 글(r.두께), 공제: 글(r.공제), 횟수: r.횟수 === undefined ? '1' : 글(r.횟수) }
    if (r.치수 && Number.isFinite(+r.치수.도면값)) o.치수 = { 도면값: +r.치수.도면값, 잰: 수n(r.치수.잰), 글: 글(r.치수.글), ...(r.치수.다름 ? { 다름: true } : {}) }
    if (r.치수씀 && o.치수) o.치수씀 = true
    if (r.치수봄 && o.치수) o.치수봄 = true
    if (r.글근거) o.글근거 = 글(r.글근거)
    if (r.높이다름) o.높이다름 = true
    return o
  })
  return { 묶음: 묶음.filter((b) => 줄.some((r) => r.묶음 === b.id) || b.셈못 || b.두번), 줄 }
}

/**
 * 3D 덩어리(bim3d set부재 꼴) — 길이 줄은 선을 따라 세운 얇은 판 · 면적 줄은 그 모양 판 · 개수는 작은 기둥
 *   그림은 «물량에 안 셈»(높이 · 두께가 비면 30 mm 띠 · 판) · 자리는 고른 것 가운데를 0 으로(먼 좌표에서 3D 가 떨리지 않게)
 * @param 셈 캐드셈(…).셈 · @param 바닥 (층 이름) → 그 층 바닥 높이 mm · @returns {덩, 줄id: Map(덩 id → 줄 id), 가운데}
 */
export function 캐드3D(셈, 바닥 = () => 0, { 시작id = 3000000, 고른 = null, 최대 = 15000 } = {}) {
  const 덩 = []
  const 줄id = new Map()
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (const x of 셈) for (const p of (x.g && x.g.그림) || []) { if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1] }
  const 가운데 = Number.isFinite(x0) ? [(x0 + x1) / 2, (y0 + y1) / 2] : [0, 0]
  const 옮 = (p) => [p[0] - 가운데[0], p[1] - 가운데[1]]
  let id = 시작id
  let 넘침 = 0
  const 넣기 = (r, 판, z0, z1, 색) => { if (덩.length >= 최대) { 넘침++; return } 덩.push({ id, 판, z0, z1, 색 }); 줄id.set(id, r.id); id++ }
  for (const x of 셈) {
    const r = x.r, g = x.g
    if (!g || !g.그림 || !g.그림.length) continue
    const z0 = 바닥(r.층) || 0
    const h = Math.max(0, (넣은수(r.높이) || 0) * 1000)
    const t = Math.max(0, (넣은수(r.두께) || 0) * 1000)
    const 노랑 = 치수남음(r)
    const 색 = 고른 === r.id ? [0.98, 0.62, 0.10] : x.수량 === null ? [0.92, 0.78, 0.25] : 노랑 ? [0.95, 0.85, 0.15] : r.갈래 === '개수' ? [0.2, 0.55, 0.9] : r.갈래 === '면적' || r.갈래 === '면적두께' ? [0.3, 0.7, 0.45] : [0.85, 0.42, 0.25]
    if (r.갈래 === '개수') {
      const [px, py] = 옮(g.그림[0])
      넣기(r, [[px - 150, py - 150], [px + 150, py - 150], [px + 150, py + 150], [px - 150, py + 150]], z0, z0 + Math.max(h, 300), 색)
      continue
    }
    if ((r.갈래 === '면적' || r.갈래 === '면적두께') && g.닫힘 && g.그림.length >= 3) {
      넣기(r, g.그림.map(옮), z0, z0 + Math.max(t, 30), 색)
      continue
    }
    /* 길이 · 길이높이 — 토막마다 두께 60 mm 판(높이가 없으면 30 mm 띠) */
    const 높 = r.갈래 === '길이높이' && h > 0 ? h : 30
    const P = g.그림.map(옮)
    const 끝 = g.닫힘 ? P.length : P.length - 1
    for (let i = 0; i < 끝; i++) {
      const a = P[i], c = P[(i + 1) % P.length]
      const dx = c[0] - a[0], dy = c[1] - a[1], L = Math.hypot(dx, dy)
      if (L < 1) continue
      const nx = (-dy / L) * 30, ny = (dx / L) * 30
      넣기(r, [[a[0] + nx, a[1] + ny], [c[0] + nx, c[1] + ny], [c[0] - nx, c[1] - ny], [a[0] - nx, a[1] - ny]], z0, z0 + 높, 색)
    }
  }
  return { 덩, 줄id, 가운데, 넘침 }
}

/* ── 엑셀(작업 화면 꼴 — lib/qtoxlsx.js 시트) · 받기 전 검사 맞댈 값 ── */
/**
 * @returns {{ sheets, 맞댈 }} — «캐드고름»(줄마다 · 근거) · «캐드집계»(단위 · 적요 · 층 · 구간 + 단위마다 «합계 ㎡» 줄)
 */
export function 캐드시트(캐드, ST, C = 캐드셈(캐드)) {
  const 수칸 = (v, n = 3) => (v === null || v === undefined || !Number.isFinite(v) ? '' : { v: +v.toFixed(n), st: ST.QTY })
  const 단위글 = (b) => (b && 단위이름[b.단위]) || '❓'
  const rows = C.셈.map((x, i) => {
    const r = x.r, b = x.b
    const p = r.원.점 && r.원.점[0] ? r.원.점[0] : r.원.값 && r.원.값.length >= 2 ? r.원.값 : null
    const 근거 = [(b && (b.이름 || b.도면.split(/[\\/]/).pop())) || '', '레이어 ' + (r.레이어 || '—'), '핸들 ' + (r.핸들 || '—'), p ? `(${(+p[0]).toFixed(1)}, ${(+p[1]).toFixed(1)}) ${단위글(b)}` : '',
      r.글근거 ? '안 글자 «' + r.글근거 + '»' : '', r.치수 ? (r.치수.다름 ? '⚠ ' : '') + '치수 ' + r.치수.도면값.toLocaleString('ko-KR') + (r.치수.다름 ? ' ≠ 잰 ' + (+r.치수.잰.toFixed(1)).toLocaleString('ko-KR') : ' = 잰 길이') + (r.치수씀 ? ' → 치수 값으로 셈' : r.치수.다름 ? ' → 잰 길이로 셈' : '') : '',
      r.높이다름 ? '3D 선 — 평면 길이' : ''].filter(Boolean).join(' · ')
    return [i + 1, 적요글(r, b), r.층, r.구간, (갈래들.find((g) => g[0] === r.갈래) || ['', r.갈래])[1],
      x.수량 === null ? '❓ ' + [...x.빈칸, ...x.틀림].join(' · ') : 수칸(x.수량), x.단위, x.식,
      수칸(x.길이), 수칸(x.면적), x.개수 || '', r.높이, r.두께, r.공제, r.횟수, 종류이름[r.종류] || r.종류, r.레이어, r.핸들, (b && b.도면) || '', 근거]
  })
  const 집 = []
  for (const u of ['m', '㎡', '㎥', '개']) {
    const 줄 = C.집계.filter((a) => a.단위 === u)
    if (!줄.length) continue
    for (const a of 줄) 집.push([u, a.적요, a.층, a.구간, a.줄, 수칸(a.수량)])
    집.push(['합계 ' + u, '', '', '', 줄.reduce((n, a) => n + a.줄, 0), 수칸(C.합[u] || 0)])
  }
  const sheets = [
    { name: '캐드고름', head: ['번호', '적요', '층', '구간', '갈래', '수량', '단위', '산출식', '길이(m)', '면적(㎡)', '개수', '높이(m)', '두께(m)', '공제', '횟수', '종류', '레이어', '핸들', '도면', '근거 · 검사'], rows, widths: [6, 22, 6, 8, 16, 12, 5, 26, 10, 10, 6, 8, 8, 7, 6, 7, 14, 9, 30, 60], freeze: 1 },
    { name: '캐드집계', head: ['단위', '적요', '층', '구간', '줄 수', '수량'], rows: 집, widths: [9, 28, 8, 10, 7, 14], freeze: 1 },
  ]
  const 맞댈 = []
  const 줄들 = C.셈.map((x, i) => ({ 줄: [String(i + 1)], 값: x.수량 })).filter((x) => x.값 !== null)
  if (줄들.length) 맞댈.push({ 이름: '📏 캐드 고름 줄마다 수량', 시트: '캐드고름', 열: '수량', 여럿: 줄들, 오차: 0.0006 })
  for (const u of Object.keys(C.합)) {
    const n = C.집계.filter((a) => a.단위 === u).length
    맞댈.push({ 이름: `📏 캐드 고름 합(${u})`, 시트: '캐드집계', 줄: '합계 ' + u, 열: '수량', 값: C.합[u], 단위: u, 자리: 3, 오차: 0.0006 + n * 0.0005 })
    맞댈.push({ 이름: `📏 캐드 집계 줄 합(${u}) = 화면`, 시트: '캐드집계', 줄: u, 열: '수량', 값: C.합[u], 단위: u, 자리: 3, 줄합: true, 오차: 0.0006 + n * 0.0005 })
  }
  return { sheets, 맞댈 }
}

/* ── 🧪 예시(가상 평면 — 실제 현장이 아님) · 캐드가 없어도 화면을 해 보게 ── */
export const 예시이름 = '🧪 가상 예시 평면.dwg'
export function 예시고름글() {
  const T = '\t'
  const 줄 = [['KCMSEL', '1', 'C:\\가상\\' + 예시이름.replace('🧪 ', ''), '4', '', '0', '', '예시']]
  const 선 = (h, la, a, c) => ['LINE', la, h, '0', '0', `${a[0]},${a[1]};${c[0]},${c[1]}`, '0,0', '', '']
  const 폴 = (h, la, P, 닫) => ['LWPOLYLINE', la, h, 닫 ? '1' : '0', '0', P.map((p) => `${p[0]},${p[1]},${p[2] || 0}`).join(';'), '', '', '']
  const 블 = (h, la, 이름, p, 열 = 0, 행 = 0) => ['INSERT', la, h, '0', '0', `${p[0]},${p[1]}`, `1,1,0,${열},${행}`, 이름, '']
  const 글 = (h, la, t, p) => ['TEXT', la, h, '0', '0', `${p[0]},${p[1]}`, '250', t, '']
  줄.push(선('1A1', '외벽', [0, 0], [10000, 0]), 선('1A2', '외벽', [10000, 0], [10000, 7500]), 선('1A3', '외벽', [10000, 7500], [0, 7500]), 선('1A4', '외벽', [0, 7500], [0, 0]))
  줄.push(선('1A5', '내벽', [6000, 0], [6000, 7500]), 선('1A6', '내벽', [0, 4500], [6000, 4500]))
  줄.push(['DIMENSION', '치수', '1B1', '0', '0', '6000,0;6000,7500', '7500,1,1.5707963268', '7,400', ''])          // 바꾼 글 «7,400» ≠ 그려진 7,500 (일부러 — 검사 보기)
  줄.push(폴('1C1', '실', [[0, 0], [6000, 0], [6000, 4500], [0, 4500]], true), 폴('1C2', '실', [[6000, 0], [10000, 0], [10000, 7500], [6000, 7500]], true), 폴('1C3', '실', [[0, 4500], [6000, 4500], [6000, 7500], [0, 7500]], true))
  줄.push(글('1D1', '실이름', '거실', [3000, 2250]), 글('1D2', '실이름', '방1', [8000, 3750]), 글('1D3', '실이름', '방2', [3000, 6000]))
  줄.push(폴('1E1', '발코니', [[10000, 1500, 1], [10000, 4500, 0]], false))                                           // 반원 난간(볼록 1 — 지름 3 m)
  줄.push(['CIRCLE', '기둥', '1F1', '0', '0', '', '0,0,300', '', ''], ['CIRCLE', '기둥', '1F2', '0', '0', '', '10000,0,300', '', ''])
  줄.push(블('1G1', '문', 'D1', [1000, 4500]), 블('1G2', '문', 'D1', [6000, 2000]), 블('1G3', '문', 'D1', [6000, 6000]), 블('1G4', '창', 'W1', [2000, 0], 2, 1))
  줄.push(['HATCH', '바닥무늬', '1H1', '0', '0', '', '', '', ''])
  줄[0][5] = String(줄.length - 1)
  return 줄.map((c) => c.join(T)).join('\r\n') + '\r\n'
}
