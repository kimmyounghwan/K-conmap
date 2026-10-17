/**
 * 📐 컬러 평면도 · 피난 안내도 → DXF (R2010 · UTF-8 · 2026-10-17)
 *
 * ■ 원래 도면과 같은 좌표(모델 좌표 + ox · oy) — 원래 도면에 «외부 참조» 로 끼우거나 복사해 붙이면 그 자리에 겹칩니다.
 * ■ 층: KCM-벽채움 · KCM-색-<용도> (HATCH · 참색) · KCM-무늬 · KCM-실이름 · KCM-면적 ·
 *        (원래 선 함께) KCM-바탕-벽 · 문 · 창 · 계단 · 위생 · 가구 · 기타 ·
 *        (피난) KCM-피난경로 · KCM-다른경로 · KCM-현위치 · KCM-비상구 · KCM-소방설비 · KCM-피난글
 * ■ 빈 틀은 lib/dxf2010틀.js(tools/dxf2010틀_만들기.py — ezdxf 가 만든 R2010) · 시험: ezdxf 로 다시 읽고 audit 0.
 */
import { 틀, 틀정보 } from './dxf2010틀.js'
import { 색판들, 용도무늬, 용도이름, 색섞기 } from './컬러평면.js'
import { 무늬선 } from './컬러평면장면.js'

const 수 = (v) => { const r = Math.round(v * 1000) / 1000; return String(Object.is(r, -0) ? 0 : r) }
const rgb = (hex) => parseInt(String(hex || '#000000').slice(1), 16) || 0
/* 참색에 가까운 ACI(옛 프로그램용) — 빨강 1 · 노랑 2 · 초록 3 · 하늘 4 · 파랑 5 · 자홍 6 · 흰/검 7 · 회 8 · 9 */
function 가까운ACI(hex) {
  const n = rgb(hex), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255
  const 표 = [[1, 255, 0, 0], [2, 255, 255, 0], [3, 0, 255, 0], [4, 0, 255, 255], [5, 0, 0, 255], [6, 255, 0, 255], [7, 255, 255, 255], [8, 128, 128, 128], [9, 192, 192, 192], [250, 51, 51, 51], [30, 255, 127, 0]]
  let best = 7, bd = Infinity
  for (const [c, R, G, B] of 표) { const d = (R - r) ** 2 + (G - g) ** 2 + (B - b) ** 2; if (d < bd) { bd = d; best = c } }
  return best
}
const 층이름 = (s) => String(s).replace(/[<>/\\":;?*|=`,]/g, '_').slice(0, 60)

export function DXF만들기(D, 모델, o = {}) {
  const ox = 모델.ox || 0, oy = 모델.oy || 0
  const k = D.k
  const N = o.축척 || 100                         /* 글 · 기호 크기 — 종이 mm × N = 실제 mm */
  const 모 = (mm) => (mm * N) / k                 /* 종이 mm → 모델 단위 */
  const 판 = 색판들[o.색판] || 색판들.부드럽게
  let h = Math.max(0x200, 틀정보.큰손잡이 + 1)
  const 손 = () => (h++).toString(16).toUpperCase()
  const 층들 = new Map()                          /* 이름 → 색 */
  const 층 = (이름, 색) => { const n = 층이름(이름); if (!층들.has(n)) 층들.set(n, 색); return n }
  const E = []
  const P = (c, v) => { E.push(c < 10 ? '  ' + c : c < 100 ? ' ' + c : String(c), String(v)) }
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  const 넓 = (x, y) => { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y }
  const 머리 = (종, 층n, 색) => {
    P(0, 종); P(5, 손()); P(330, 틀정보.모델); P(100, 'AcDbEntity'); P(8, 층n)
    if (색) { P(62, 가까운ACI(색)); P(420, rgb(색)) }
  }
  const 해치 = (층n, 고리들, 색) => {
    const 고 = 고리들.filter((r) => r.length >= 3)
    if (!고.length) return
    머리('HATCH', 층n, 색)
    P(100, 'AcDbHatch'); P(10, 0); P(20, 0); P(30, 0); P(210, 0); P(220, 0); P(230, 1)
    P(2, 'SOLID'); P(70, 1); P(71, 0); P(91, 고.length)
    고.forEach((r, i) => {
      P(92, i === 0 ? 3 : 2); P(72, 0); P(73, 1); P(93, r.length)
      for (const [x, y] of r) { P(10, 수(x + ox)); P(20, 수(y + oy)); 넓(x + ox, y + oy) }
      P(97, 0)
    })
    P(75, 0); P(76, 1); P(98, 0)
  }
  const 줄 = (층n, 점들, 색, o2 = {}) => {
    if (점들.length < 2) return
    머리('LWPOLYLINE', 층n, 색)
    P(100, 'AcDbPolyline'); P(90, 점들.length); P(70, o2.닫힘 ? 1 : 0)
    if (o2.폭) P(43, 수(o2.폭))
    for (const [x, y] of 점들) { P(10, 수(x + ox)); P(20, 수(y + oy)); 넓(x + ox, y + oy) }
  }
  const 선 = (층n, a, b, 색) => {
    머리('LINE', 층n, 색)
    P(100, 'AcDbLine'); P(10, 수(a[0] + ox)); P(20, 수(a[1] + oy)); P(30, 0); P(11, 수(b[0] + ox)); P(21, 수(b[1] + oy)); P(31, 0)
  }
  const 원 = (층n, c, r, 색) => { 머리('CIRCLE', 층n, 색); P(100, 'AcDbCircle'); P(10, 수(c[0] + ox)); P(20, 수(c[1] + oy)); P(30, 0); P(40, 수(r)) }
  const 글 = (층n, s, x, y, 높이, 색) => {
    if (!s) return
    머리('TEXT', 층n, 색)
    P(100, 'AcDbText'); P(10, 수(x + ox)); P(20, 수(y + oy)); P(30, 0); P(40, 수(높이)); P(1, String(s).replace(/[\r\n]+/g, ' ')); P(7, 'KCM'); P(72, 1)
    P(11, 수(x + ox)); P(21, 수(y + oy)); P(31, 0); P(100, 'AcDbText'); P(73, 2)
  }
  const 네모해치 = (층n, cx, cy, w, 색) => 해치(층n, [[[cx - w / 2, cy - w / 2], [cx + w / 2, cy - w / 2], [cx + w / 2, cy + w / 2], [cx - w / 2, cy + w / 2]]], 색)

  /* ① 벽 채움 · 방 색 · 무늬 */
  if (o.벽채움 !== false && D.외곽.length) 해치(층('KCM-벽채움', 판.벽), D.외곽, 판.벽)
  const 바꿈 = o.방바꿈 || {}
  for (const R of D.방들) {
    const 바 = 바꿈[R.번호] || {}
    if (바.숨김) continue
    const 용 = 바.용도 || R.용도
    const 색 = 바.색 || (R.이름없음 ? 판.빈곳 : 판.색[용] || 판.색.기타)
    해치(층(`KCM-색-${(용도이름[용] || 용).replace(/\s*·\s*/g, '·')}`, 색), R.고리들, 색)
    if (o.무늬 && !R.이름없음) {
      const 키 = 바.무늬 !== undefined ? 바.무늬 : 용도무늬[용] || ''
      const 무색 = 색섞기(색, '#000000', 0.18)
      const 무층 = 층('KCM-무늬', '#9a8f80')
      for (const [ax, ay, bx, by] of 무늬선(R, 키, k)) 선(무층, [ax, ay], [bx, by], 무색)
    }
  }
  /* ② 원래 선 */
  if (o.원선 !== false) {
    const 색표 = { 벽: '#222222', 문: '#2f2f2f', 창: '#3d7fb8', 계단: '#333333', 위생: '#5b7183', 가구: '#8a8a8a', 기타: '#9a9a9a' }
    for (const s of D.선들) {
      if ((s.종 === '가구' || s.종 === '위생') && o.가구 === false) continue
      const 점들 = []
      for (let i = 0; i < s.점.length; i += 2) 점들.push([s.점[i], s.점[i + 1]])
      줄(층('KCM-바탕-' + s.종, 색표[s.종] || '#999999'), 점들, null, { 닫힘: s.닫힘 })
    }
  }
  /* ③ 실 이름 · 면적 */
  const 쉼 = (v, d = 2) => Number(v || 0).toFixed(d)
  for (const R of D.방들) {
    const 바 = 바꿈[R.번호] || {}
    if (바.숨김 || R.이름없음) continue
    const 이름 = (바.이름 ?? R.이름 ?? '').replace(/\(추정\)$/, '')
    const A = o.면적기준 === '도면' && R.도면면적 ? R.도면면적 : o.면적기준 === '면적선' && R.면적선 ? R.면적선 : R.면적
    const [x, y] = R.라벨
    if (o.이름 !== false && 이름) 글(층('KCM-실이름', 판.글), 이름, x, y + 모(1.6), 모(3.0), null)
    if (o.면적) 글(층('KCM-면적', '#4b5563'), o.면적 === '평' ? `${쉼(A / 3.305785, 1)}평` : o.면적 === '㎡평' ? `${쉼(A)}㎡ (${쉼(A / 3.305785, 1)}평)` : `${쉼(A)}㎡`, x, y - 모(2.2), 모(2.2), null)
  }
  /* ④ 피난 */
  const 피 = o.피난
  if (피) {
    const 초록 = '#0B8A44', 주황 = '#F08A00', 빨강 = '#D7262B'
    const 화살 = (층n, 점들, 색, z) => {
      const n = 점들.length; if (n < 2) return
      const a = 점들[n - 2], b = 점들[n - 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
      const ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L, nx = -uy, ny = ux
      해치(층n, [[[b[0] + ux * z * 0.35, b[1] + uy * z * 0.35], [b[0] - ux * z * 0.65 + nx * z * 0.5, b[1] - uy * z * 0.65 + ny * z * 0.5], [b[0] - ux * z * 0.65 - nx * z * 0.5, b[1] - uy * z * 0.65 - ny * z * 0.5]]], 색)
    }
    const 경층 = 층('KCM-피난경로', 초록)
    for (const g of 피.나무 || []) { 줄(경층, g.점들, '#36a76a', { 폭: 모(0.9) }); if (!g.닿음) 화살(경층, g.점들, '#36a76a', 모(3)) }
    if (피.둘) { const 다층 = 층('KCM-다른경로', 주황); 줄(다층, 피.둘.점들, 주황, { 폭: 모(1.0) }); 화살(다층, 피.둘.점들, 주황, 모(3.4)) }
    if (피.첫) { 줄(경층, 피.첫.점들, 초록, { 폭: 모(1.8) }); 화살(경층, 피.첫.점들, 초록, 모(5)) }
    const 출층 = 층('KCM-비상구', 초록), 글층 = 층('KCM-피난글', '#222222')
    for (const x of 피.출구들 || []) {
      if (x.켬 === false) continue
      네모해치(출층, x.x, x.y, 모(8), 초록)
      글(글층, x.종류 === '계단' ? '계단 Stairs' : x.종류 === '출입구' ? '출입구 Exit' : '비상구 Exit', x.x, x.y - 모(7), 모(2.4), 초록)
    }
    const 설층 = 층('KCM-소방설비', 빨강)
    const 이름표 = { 소화기: '소화기', 소화전: '옥내소화전', 발신기: '발신기', 완강기: '완강기' }
    for (const e of 피.장비들 || []) {
      if (e.종류 === '발신기') 원(설층, [e.x, e.y], 모(2.6), 빨강)
      else 네모해치(설층, e.x, e.y, 모(5), e.종류 === '완강기' ? 초록 : 빨강)
      글(글층, 이름표[e.종류] || e.종류, e.x, e.y - 모(4.6), 모(1.8), null)
    }
    if (피.현위치) {
      const 현층 = 층('KCM-현위치', 빨강)
      원(현층, 피.현위치, 모(3.2), 빨강)
      해치(현층, [원고리(피.현위치, 모(1.6))], 빨강)
      글(현층, '현위치 YOU ARE HERE', 피.현위치[0], 피.현위치[1] - 모(6), 모(2.6), 빨강)
    }
  }
  /* 층 표 */
  const 층글 = []
  for (const [이름, 색] of 층들) {
    층글.push('  0', 'LAYER', '  5', 손(), '330', 틀정보.층표, '100', 'AcDbSymbolTableRecord', '100', 'AcDbLayerTableRecord', '  2', 이름, ' 70', '0',
      ' 62', String(가까운ACI(색)), '420', String(rgb(색)), '  6', 'Continuous', '370', '-3', '390', '13', '347', '21')
  }
  if (!isFinite(x0)) { x0 = 0; y0 = 0; x1 = 1; y1 = 1 }
  const 본 = 틀
    .replace('@@LAYERN@@', String(2 + 층들.size))
    .replace('@@LAYERS@@', 층글.length ? 층글.join('\n') + '\n' : '')
    .replace('@@ENTITIES@@', E.length ? E.join('\n') + '\n' : '')
    .replace('@@HANDSEED@@', 손())
    .replace('@@EXMINX@@', 수(x0)).replace('@@EXMINY@@', 수(y0)).replace('@@EXMAXX@@', 수(x1)).replace('@@EXMAXY@@', 수(y1))
  return 본
}
function 원고리(c, r) { const out = []; for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; out.push([c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)]) } return out }
