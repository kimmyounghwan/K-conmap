/**
 * 🏔 토적컨맵 받기 — 엑셀(토적표 · 유토곡선 · 토공유동표 · 운반집계 · 집계표 · 차수 비교 · 알림) · DXF(유토곡선도) (G571 · 2026-11-06)
 *   셈은 lib/토적.js 토적셈 결과(R)를 그대로 씀 — 여기서 다시 셈하지 않음.
 *   DXF: lib/dxf2010틀.js(R2010 · UTF-8 · KCM 글꼴) · 가로 1 = 1 m · 세로는 «1 = ○ ㎥» (도면 왼쪽 아래에 적음) · 시험: ezdxf 로 다시 읽고 audit 0
 *   G574: «한 운반 구간도 거리별로 나눔» — 유동표 · 운반집계는 마디마다 띠 몫 줄 · 유토곡선 시트와 DXF 에 띠 거리선(KCM-띠선)
 *   G575: 🚛 사토장 · 토취장 — 유동표 사토 · 순성토 · 바로 사토 줄에 곳 · 거리 · 장비 · 운반집계 🚛 줄(장줄들) · 집계표 비고 · DXF ▲ 줄(KCM-사토장 · KCM-토취장)
 *   G576: DXF 유토곡선도 아래에 «토공유동도» — 막대(KCM-남는흙 · KCM-모자라는흙) · 화살(KCM-유동도 — 볼록 폴리선 bulge = 활 높이 0.35 × 길이 · 길이 = 평균운반거리) · 사토 ↓ · 순성토 ↑
 */
import { 틀, 틀정보 } from './dxf2010틀.js'
import { 끝수, 띠글 } from './토적.js'

const 쉼 = (v, d = 2) => (Number.isFinite(v) ? 끝수(v, d).toLocaleString('ko-KR', { maximumFractionDigits: d }) : '')
const 동그라미 = (n) => (n >= 1 && n <= 20 ? String.fromCharCode(0x2460 + n - 1) : '(' + n + ')')
export { 동그라미 }

/** 토공유동표 줄 — 화면 · 엑셀 · 인쇄가 같이 씀 */
export function 유동줄(R) {
  const 줄 = []
  const 토칸 = R.칸.filter((c) => c.종 !== '성' && c.씀 !== false)
  if (R.합.횡 > 1e-9) 줄.push({ 번: '', 구분: '횡방향 유용', 나옴: '같은 측점(줄마다)', 감: '같은 측점', 방향: '', V: R.합.횡, L: null, 토: null })
  for (const q of R.마디) {
    const 방향 = q.방향 === '→' ? '→ 순방향' : '← 역방향'
    const 곳 = (r) => (r ? R.자리(r[0]) + ' ~ ' + R.자리(r[1]) : '')
    if (q.V > 1e-9 && (q.띠별 || []).length > 1) {
      /* 거리별로 나눈 구간 — 띠 몫마다 한 줄(나오는 곳 · 가는 곳도 그 몫의 자리) */
      for (const p of q.띠별) 줄.push({ 번: 동그라미(q.번), 구분: '종방향 유용', 나옴: 곳(p.절x), 감: 곳(p.성x), 방향, V: p.V, L: p.L, 반폭: null, 띠: 띠글(p), 토: 토칸.map((c) => p.토V[c.id] || 0), 최소: p.최소, 최대: p.최대, 몫: true })
    } else if (q.V > 1e-9) 줄.push({ 번: 동그라미(q.번), 구분: '종방향 유용', 나옴: 곳(q.절x), 감: 곳(q.성x), 방향, V: q.V, L: q.L, 반폭: q.반폭, 띠: q.띠 || '', 토: 토칸.map((c) => q.토V[c.id] || 0), 최소: q.최소, 최대: q.최대 })
    for (const m of q.사묶음 || []) if (m.V > 1e-9) 줄.push({ 번: 동그라미(q.번), 구분: '사토(남는 흙)', 나옴: R.자리(m.xa) + ' ~ ' + R.자리(m.xb), 감: m.장이름 || '사토장', 방향: '', V: m.V, L: m.L ?? null, 띠: m.띠 || '', 토: 토칸.map((c) => m.토[c.id] || 0) })
    for (const m of q.순묶음 || []) if (m.V > 1e-9) 줄.push({ 번: 동그라미(q.번), 구분: '순성토(모자라는 흙)', 나옴: m.장이름 || '토취장', 감: R.자리(m.xa) + ' ~ ' + R.자리(m.xb), 방향: '', V: m.V, L: m.L ?? null, 띠: m.띠 || '', 토: null })
  }
  if ((R.직접장 || []).length) {
    for (const e of R.직접장) if (e.V > 1e-9) 줄.push({ 번: '', 구분: '바로 사토(유용 안 함)', 나옴: e.이름 + ' 절토', 감: e.장이름, 방향: '', V: e.V, L: e.L, 띠: e.띠 || '', 토: null, 자연: true })
  } else for (const k of R.합.직접칸) if (k.V > 1e-9) 줄.push({ 번: '', 구분: '바로 사토(유용 안 함)', 나옴: k.이름 + ' 절토 전체', 감: '사토장', 방향: '', V: k.V, L: null, 토: null, 자연: true })
  return 줄
}

/** 🚛 사토장 · 토취장 줄 — 운반집계(화면 · 엑셀)가 같이 씀 · 사토 · 순성토는 다짐 기준 · 바로 사토는 자연 */
export function 장줄들(R) {
  const 줄 = []
  if (!R.장) return 줄
  for (const s of R.장.사) if (s.V > 1e-9) 줄.push({ 글: '🚛 사토 → ' + s.이름, V: s.V, VL: s.VL, 토V: s.토V, 토VL: s.토VL, 띠: s.띠 || '' })
  for (const e of R.직접장 || []) if (e.V > 1e-9) 줄.push({ 글: '🚛 바로 사토(' + e.이름 + ' · 자연) → ' + e.장이름, V: e.V, VL: e.VL, 띠: e.띠 || '' })
  for (const s of R.장.순) if (s.V > 1e-9) 줄.push({ 글: '🚛 순성토 ← ' + s.이름, V: s.V, VL: s.VL, 띠: s.띠 || '' })
  return 줄
}

/* ── 📗 엑셀 ─────────────────────────────────────────────────────── */
export async function 토적엑셀(R, 판, 차수들 = [], 견줌 = null) {
  const { 값엑셀받기, 소수칸, 굵은칸, 흐린칸 } = await import('./값엑셀.js')
  const 칸 = R.칸, 절칸 = 칸.filter((c) => c.종 !== '성'), 씀칸 = 절칸.filter((c) => c.씀 !== false)
  const 지배 = R.방법 === '지배거리'
  const 수 = (v) => (Number.isFinite(v) ? 소수칸(v) : '')
  const 시트 = []
  /* ① 토적표 */
  {
    const head = ['측점', '누가거리(m)', '거리(m)', ...(지배 ? ['평균거리(m)'] : []), ...칸.map((c) => c.이름 + ' 단면(㎡)'), ...칸.map((c) => c.이름 + ' 토량(㎥)'),
      ...씀칸.map((c) => c.이름 + ' 보정(×' + (Number(c.C) > 0 ? c.C : '1') + ')'), '보정 절토 계', '성토 계', '횡방향 유용', '차인', '누가토량', '운반 끊음']
    const rows = R.줄.map((z) => [z.측, 수(z.x), 수(z.d), ...(지배 ? [수(z.평)] : []), ...z.A.map(수), ...z.V.map(수), ...씀칸.map((c) => 수(z.B[칸.indexOf(c)])), 수(z.U), 수(z.F), 수(z.횡), 수(z.차), 수(z.M), z.끊 ? '끊음' : ''])
    rows.push([굵은칸('계'), '', 수(R.합.길이), ...(지배 ? [''] : []), ...칸.map(() => ''), ...R.합.칸.map(수), ...씀칸.map((c) => 수(R.합.보정[칸.indexOf(c)])), 수(R.합.유용), 수(R.합.성), 수(R.합.횡), 수(R.합.유용 - R.합.성), '', ''])
    rows.push([])
    rows.push([흐린칸(`셈: ${지배 ? '지배거리법(단면 × 평균거리)' : '평균단면법((앞 + 뒤) ÷ 2 × 거리)'} · 끝수 ${R.끝 < 0 ? '안 버림' : '소수 ' + R.끝 + '자리(줄마다 반올림)'} · 보정 = 절토 × C(다짐 기준) · 차인 = 보정 절토(유용) − 성토`)])
    시트.push({ name: '토적표', head, rows, widths: [14, 11, 9, ...(지배 ? [9] : []), ...칸.map(() => 10), ...칸.map(() => 11), ...씀칸.map(() => 11), 11, 11, 11, 11, 12, 8], freeze: 1 })
  }
  /* ② 유토곡선 점 */
  {
    const rows = R.점.map((p, i) => [i + 1, 수(p.x), R.자리(p.x), 수(p.m)])
    rows.push([])
    for (const g of R.구간) rows.push([굵은칸('구간 ' + (g.번 + 1) + ' 평형선'), 수(g.b), R.자리(g.xs) + ' ~ ' + R.자리(g.xe), g.꼴 === '최소' ? '운반이 가장 적은 높이' : g.꼴 === '직접' ? '직접 넣은 높이' : '시점 높이'])
    for (const s of R.띠선 || []) rows.push([굵은칸(동그라미(s.마디) + ' 띠 거리선 ' + (s.이름 ? s.이름 + ' ' : '') + 쉼(s.까지) + ' m'), 수(s.m), R.자리(s.xa) + ' ~ ' + R.자리(s.xb), s.꼴 === '아래' ? '선 아래(바닥 쪽)는 짧은 장비 · 위는 긴 장비' : '선 위(봉우리 쪽)는 짧은 장비 · 아래는 긴 장비'])
    시트.push({ name: '유토곡선', head: ['점', '누가거리(m)', '측점', '누가토량(㎥)'], rows, widths: [6, 12, 16, 14] })
  }
  /* ③ 토공유동표 */
  {
    const 유 = 유동줄(R)
    const head = ['번', '구분', '흙 나오는 곳', '가는 곳', '방향', ...씀칸.map((c) => c.이름 + '(㎥)'), '토량(㎥)', '평균운반거리(m)', '참고: ½ 높이 폭(m)', '장비(띠)']
    const rows = 유.map((u) => [u.번, u.구분, u.나옴, u.감, u.방향, ...씀칸.map((c, i) => (u.토 ? 수(u.토[i]) : '')), 수(u.V), u.L !== null && u.L !== undefined ? 수(u.L) : '', u.반폭 ? 수(u.반폭) : '', u.띠 || ''])
    rows.push([])
    rows.push([굵은칸('검산'), `보정 절토(유용) ${쉼(R.합.유용)} = 횡방향 ${쉼(R.합.횡)} + 종방향 ${쉼(R.합.종)} + 사토 ${쉼(R.합.사토)}`, '', '', '', ...씀칸.map(() => ''), R.검산.맞음 ? '맞음' : '안 맞음'])
    rows.push(['', `성토 ${쉼(R.합.성)} = 횡방향 ${쉼(R.합.횡)} + 종방향 ${쉼(R.합.종)} + 순성토 ${쉼(R.합.순성토)}`])
    rows.push(['', '단위: 다짐 기준 ㎥(보정 토량) · «바로 사토» 는 자연 상태 ㎥'])
    시트.push({ name: '토공유동표', head, rows, widths: [5, 18, 26, 26, 10, ...씀칸.map(() => 11), 12, 13, 13, 10] })
  }
  /* ④ 운반집계 */
  {
    const head = ['구간', '방향', ...씀칸.flatMap((c) => [c.이름 + ' L(m)', c.이름 + ' V(㎥)', c.이름 + ' V×L']), '계 V(㎥)', '계 V×L', '평균운반거리(m)', '장비(띠)']
    const 한줄 = (q, o, 띠) => [동그라미(q.번), q.방향, ...씀칸.flatMap((c) => { const v = o.토V[c.id] || 0, vl = o.토VL[c.id] || 0; return [v > 0 ? 수(vl / v) : '', 수(v), 수(vl)] }), 수(o.V), 수(o.VL), 수(o.VL / o.V), 띠]
    const rows = R.마디.filter((q) => q.V > 1e-9).flatMap((q) => ((q.띠별 || []).length > 1 ? q.띠별.map((p) => 한줄(q, p, 띠글(p))) : [한줄(q, q, q.띠 || '')]))
    rows.push([굵은칸('계'), '', ...씀칸.flatMap((c) => { const v = R.합.토V[c.id] || 0, vl = R.합.토VL[c.id] || 0; return [v > 0 ? 수(vl / v) : '', 수(v), 수(vl)] }), 수(R.합.종), 수(R.합.종VL), 수(R.합.L), ''])
    rows.push([])
    for (const t of R.띠) if (t.V > 0) rows.push([굵은칸(t.이름 || '운반'), Number.isFinite(t.까지) ? t.까지 + ' m 까지' : '그 밖', ...씀칸.flatMap(() => ['', '', '']), 수(t.V), 수(t.VL), 수(t.VL / t.V), t.마디.map(동그라미).join(' ')])
    const 장줄 = 장줄들(R)
    if (장줄.length) {
      rows.push([])
      for (const u of 장줄) rows.push([굵은칸(u.글), '', ...씀칸.flatMap((c) => { if (!u.토V) return ['', '', '']; const v = u.토V[c.id] || 0, vl = u.토VL[c.id] || 0; return [v > 0 ? 수(vl / v) : '', 수(v), 수(vl)] }), 수(u.V), 수(u.VL), 수(u.VL / u.V), u.띠])
    }
    rows.push([])
    rows.push(['', '다짐 기준 · 평균운반거리 = V×L ÷ V (유토곡선과 평형선 사이 넓이 ÷ 운반토량)'])
    if (장줄.length) rows.push(['', '🚛 줄: 사토장 · 토취장까지 = 길 따라 진출입 측점까지 평균 거리 + 밖 거리(흙마다 가장 가까운 곳) · 사토 · 순성토는 다짐 기준 · 바로 사토는 자연 상태'])
    if (R.띠.length > 1) rows.push(['', R.띠나눔 === '거리' ? '장비 띠: 한 운반 구간도 거리별로 나눔 — 높이 띠마다 실제 운반거리로 나눠 셈(유토곡선 시트의 «띠 거리선» 위는 짧은 장비 · 아래는 긴 장비)' : '장비 띠: 한 운반 구간 = 한 장비 — 구간의 평균운반거리로 띠를 고름'])
    시트.push({ name: '운반집계', head, rows, widths: [6, 6, ...씀칸.flatMap(() => [10, 11, 13]), 11, 13, 13, 10] })
  }
  /* ⑤ 집계표 */
  {
    const rows = []
    칸.forEach((c, j) => rows.push([c.종 === '성' ? '성토' : '절토', c.이름, 수(R.합.칸[j]), c.종 === '성' ? '다짐' : '자연', c.종 === '성' ? '' : (c.씀 === false ? '유용 안 함(바로 사토)' : 'C ' + (Number(c.C) > 0 ? c.C : '1(비어 있음)') + ' → 보정 ' + 쉼(R.합.보정[j]))]))
    rows.push([], ['유용', '보정 절토(유용)', 수(R.합.유용), '다짐', ''], ['유용', '횡방향 유용', 수(R.합.횡), '다짐', '같은 측점 안'],
      ['유용', '종방향 유용(운반토량)', 수(R.합.종), '다짐', '평균운반거리 ' + 쉼(R.합.L) + ' m'], ['사토', '남는 흙(유토곡선)', 수(R.합.사토), '다짐', [Object.keys(R.합.사토자연).length ? '자연으로 ' + 쉼(Object.values(R.합.사토자연).reduce((a, v) => a + v, 0)) : '', R.합.사토L !== null && R.합.사토L !== undefined ? '사토장까지 평균 ' + 쉼(R.합.사토L) + ' m' : ''].filter(Boolean).join(' · ')],
      ['사토', '바로 사토(유용 안 함)', 수(R.합.직접), '자연', R.합.직접L !== null && R.합.직접L !== undefined ? '사토장까지 평균 ' + 쉼(R.합.직접L) + ' m' : ''], ['순성토', '모자라는 흙(토취)', 수(R.합.순성토), '다짐', [R.합.순성토자연 !== null ? '토취 흙 C 로 자연 ' + 쉼(R.합.순성토자연) : '', R.합.순성토L !== null && R.합.순성토L !== undefined ? '토취장에서 평균 ' + 쉼(R.합.순성토L) + ' m' : ''].filter(Boolean).join(' · ')],
      [], ['검산', R.검산.맞음 ? '맞음' : '안 맞음', '', '', `절토 차 ${끝수(R.검산.절, 4)} · 성토 차 ${끝수(R.검산.성, 4)}`])
    시트.push({ name: '집계표', head: ['구분', '항목', '토량(㎥)', '상태', '비고'], rows, widths: [10, 26, 14, 8, 36] })
  }
  /* ⑥ 차수 비교 */
  if (견줌) {
    const rows = 견줌.표.줄.map((z) => [z.항목, 수(z.a), 수(z.b), 수(z.증)])
    if (견줌.표.단면.length) { rows.push([], [굵은칸('단면이 바뀐 측점'), '', '', '']); for (const s of 견줌.표.단면) rows.push([s.측, `절토 ${s.절a} → ${s.절b}`, `성토 ${s.성a} → ${s.성b}`, '']) }
    if (견줌.표.새.length) rows.push([], ['새로 생긴 측점', 견줌.표.새.join(' · ')])
    if (견줌.표.뺌.length) rows.push(['없어진 측점', 견줌.표.뺌.join(' · ')])
    시트.push({ name: '차수비교', head: ['항목', 견줌.a, 견줌.b, '증감'], rows, widths: [28, 14, 14, 14] })
  }
  /* ⑦ 알림 */
  if (R.오류.length || R.경고.length) 시트.push({ name: '알림', head: ['구분', '내용'], rows: [...R.오류.map((t) => ['오류', t]), ...R.경고.map((t) => ['확인', t])], widths: [8, 120] })
  const 이름 = '토적컨맵_' + ((판.설정 && 판.설정.공사명) || '토적표') + (차수들.length > 1 ? '_' + (판.이름 || '') : '')
  return 값엑셀받기(이름, 시트, { 주소: '/tools/tojeok' })
}

/* ── 📐 DXF 유토곡선도 ────────────────────────────────────────────── */
const 좋은간 = (v) => { if (!(v > 0)) return 1; const p = 10 ** Math.floor(Math.log10(v)); const f = v / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p }

export function 토적DXF(R, 판 = {}) {
  let h = Math.max(0x200, 틀정보.큰손잡이 + 1)
  const 손 = () => (h++).toString(16).toUpperCase()
  const 층들 = new Map()
  const 층 = (이름, aci) => { if (!층들.has(이름)) 층들.set(이름, aci); return 이름 }
  const E = []
  const P = (c, v) => { E.push(c < 10 ? '  ' + c : c < 100 ? ' ' + c : String(c), String(v)) }
  const 수 = (v) => { const r = Math.round(v * 1000) / 1000; return String(Object.is(r, -0) ? 0 : r) }
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  const 넓 = (x, y) => { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y }
  const 머리 = (종, 층n) => { P(0, 종); P(5, 손()); P(330, 틀정보.모델); P(100, 'AcDbEntity'); P(8, 층n) }
  const 선 = (층n, a, b) => { 머리('LINE', 층n); P(100, 'AcDbLine'); P(10, 수(a[0])); P(20, 수(a[1])); P(30, 0); P(11, 수(b[0])); P(21, 수(b[1])); P(31, 0); 넓(a[0], a[1]); 넓(b[0], b[1]) }
  const 줄 = (층n, 점들, 닫힘) => {
    if (점들.length < 2) return
    머리('LWPOLYLINE', 층n); P(100, 'AcDbPolyline'); P(90, 점들.length); P(70, 닫힘 ? 1 : 0)
    for (const [x, y] of 점들) { P(10, 수(x)); P(20, 수(y)); 넓(x, y) }
  }
  const 글 = (층n, s, x, y, 높이, o = {}) => {
    if (!s) return
    머리('TEXT', 층n); P(100, 'AcDbText'); P(10, 수(x)); P(20, 수(y)); P(30, 0); P(40, 수(높이)); P(1, String(s).replace(/[\r\n]+/g, ' '))
    if (o.돌림) P(50, 수(o.돌림))
    P(7, 'KCM'); P(72, o.가로 ?? 1); P(11, 수(x)); P(21, 수(y)); P(31, 0); P(100, 'AcDbText'); P(73, o.세로 ?? 2)
    넓(x, y)
  }
  const 점 = R.점
  if (점.length < 2) throw new Error('측점이 둘 이상 있어야 유토곡선도를 그립니다')
  const xs = 점[0].x, xe = 점[점.length - 1].x, L = Math.max(1, xe - xs)
  let mn = Math.min(0, ...점.map((p) => p.m), ...R.구간.map((g) => g.b)), mx = Math.max(0, ...점.map((p) => p.m), ...R.구간.map((g) => g.b))
  if (!(mx > mn)) { mx = mn + 1 }
  /* 세로 배율: 그림 높이가 길이의 0.4 쯤 — «1 = k ㎥» 의 k 를 1 · 2 · 5 꼴로 */
  const k = 좋은간((mx - mn) / (0.4 * L))
  const Y = (m) => m / k
  const 글높 = Math.max(0.5, 좋은간(L / 160))
  const 간y = 좋은간((mx - mn) / 8)
  const ya = Math.floor(mn / 간y) * 간y, yb = Math.ceil(mx / 간y) * 간y
  /* 격자 · 눈금 */
  const 격 = 층('KCM-격자', 8), 글층 = 층('KCM-글자', 7)
  for (let v = ya; v <= yb + 간y * 1e-9; v += 간y) { 선(격, [xs, Y(v)], [xe, Y(v)]); 글(글층, 쉼(v, 0), xs - 글높 * 0.8, Y(v), 글높, { 가로: 2 }) }
  const 측들 = R.줄.filter((z) => z.측)
  let 앞x = -Infinity
  for (const z of 측들) {
    선(격, [z.x, Y(ya)], [z.x, Y(ya) - 글높 * 0.6])
    if (z.x - 앞x >= 글높 * 1.6) { 글(글층, z.측, z.x, Y(ya) - 글높 * 1.0, 글높 * 0.8, { 돌림: 90, 가로: 2, 세로: 2 }); 앞x = z.x }
  }
  선(층('KCM-테두리', 7), [xs, Y(ya)], [xe, Y(ya)]); 선('KCM-테두리', [xs, Y(ya)], [xs, Y(yb)])
  if (ya < 0 && yb > 0) 선(층('KCM-영선', 8), [xs, 0], [xe, 0])
  /* 곡선 · 평형선 · 끊음 */
  줄(층('KCM-곡선', 5), 점.map((p) => [p.x, Y(p.m)]))
  const 평층 = 층('KCM-평형선', 1), 끊층 = 층('KCM-끊음', 8)
  for (const g of R.구간) {
    선(평층, [g.xs, Y(g.b)], [g.xe, Y(g.b)])
    글(평층, '평형선 ' + 쉼(g.b, 1), g.xs + 글높 * 0.5, Y(g.b) + 글높 * 0.6, 글높 * 0.8, { 가로: 0, 세로: 1 })
    if (g.번 > 0) { 선(끊층, [g.xs, Y(ya)], [g.xs, Y(yb)]); 글(끊층, '운반 못 건넘', g.xs, Y(yb) + 글높 * 0.8, 글높 * 0.8) }
  }
  /* 띠 거리선(G574 — 한 운반 구간을 거리별 장비로 나눈 높이 · 길이 = 띠 거리) */
  if ((R.띠선 || []).length) {
    const 띠층 = 층('KCM-띠선', 30)
    for (const s of R.띠선) {
      선(띠층, [s.xa, Y(s.m)], [s.xb, Y(s.m)])
      const g = R.구간[s.구간], 붙음 = !!g && Math.abs(Y(s.m) - Y(g.b)) < 글높 * 1.4
      const 아래글 = (s.꼴 === '아래') === 붙음
      글(띠층, (s.이름 ? s.이름 + ' ' : '') + 쉼(s.까지) + ' m', (s.xa + s.xb) / 2, Y(s.m) + (아래글 ? -글높 * 0.7 : 글높 * 0.7), 글높 * 0.7)
    }
  }
  /* ▲ 사토장 · 토취장 진출입 측점(G575) — 측점 글 아래 따로 한 줄 */
  let 장있음 = false
  for (const [장들, 층이름, aci] of [[(R.장 && R.장.사) || [], 'KCM-사토장', 6], [(R.장 && R.장.순) || [], 'KCM-토취장', 200]]) {
    for (const s of 장들) {
      if (!Number.isFinite(s.x) || s.x < xs - 1e-9 || s.x > xe + 1e-9) continue
      const 장층 = 층(층이름, aci), y0 = Y(ya) - 글높 * 11
      줄(장층, [[s.x, y0 + 글높 * 0.6], [s.x - 글높 * 0.4, y0 - 글높 * 0.2], [s.x + 글높 * 0.4, y0 - 글높 * 0.2]], true)
      const 오른 = s.x > xs + 0.8 * L
      글(장층, s.이름 + (s.밖 > 0 ? ' · 밖 ' + 쉼(s.밖, 0) + ' m' : ''), s.x + (오른 ? -0.7 : 0.7) * 글높, y0 + 글높 * 0.2, 글높 * 0.7, { 가로: 오른 ? 2 : 0, 세로: 2 })
      장있음 = true
    }
  }
  /* 마디 글 */
  const 운층 = 층('KCM-운반', 3), 사층 = 층('KCM-사토', 6)
  for (const q of R.마디) {
    const g = R.구간[q.구간], 안 = g.점.filter((p) => p.x >= q.xa && p.x <= q.xb)
    const 끝점 = 안.length ? 안.reduce((a, p) => (Math.abs(p.m - g.b) > Math.abs(a.m - g.b) ? p : a), 안[0]) : { x: (q.xa + q.xb) / 2, m: g.b }
    const 위 = q.꼴 !== '아래'
    const ty = Y(끝점.m) + (위 ? 글높 * 1.6 : -글높 * 1.6)
    const 말 = [동그라미(q.번) + (q.V > 1e-9 ? ' ' + q.방향 + ' V=' + 쉼(q.V) + '㎥ L=' + 쉼(q.L) + 'm' : '')]
    if (q.사 > 1e-9) 말.push('사토 ' + 쉼(q.사) + '㎥')
    if (q.순 > 1e-9) 말.push('순성토 ' + 쉼(q.순) + '㎥')
    글(q.V > 1e-9 ? 운층 : 사층, 말.join(' · '), 끝점.x, ty, 글높 * 0.9)
  }
  /* 토공유동도(G576) — 유토곡선도 아래 · 가로는 같은 누가거리 */
  {
    const 활 = []
    for (const q of R.마디) if (q.V > 1e-9) for (const p of q.띠별 || []) if (Number.isFinite(p.절c) && Number.isFinite(p.성c) && p.V > 1e-9 && Math.abs(p.성c - p.절c) > 1e-6) 활.push({ q, p })
    const 칸 = []
    for (let i = 0; i < R.줄.length; i++) {
      const z = R.줄[i]
      let a, b
      if (R.방법 === '평균단면') { if (i === 0) continue; a = R.줄[i - 1].x; b = z.x }
      else { a = z.x - (z.d || 0) / 2; b = z.x + (i + 1 < R.줄.length ? R.줄[i + 1].d : 0) / 2 }
      if (!(b - a > 1e-9) || !z.차) continue
      칸.push({ a, b, v: z.차 / (b - a) })
    }
    if (활.length || 칸.length) {
      const 최대솟 = Math.max(글높 * 1.5, ...활.map((a) => 0.35 * Math.abs(a.p.성c - a.p.절c)))
      const 막대높 = 글높 * 2.5, 최대v = Math.max(1e-9, ...칸.map((c) => Math.abs(c.v)))
      const 꼭대기 = Y(ya) - 글높 * (장있음 ? 16 : 12)
      const y유 = 꼭대기 - 최대솟 - 글높 * 3
      const 유층 = 층('KCM-유동도', 4), 남층 = 층('KCM-남는흙', 2), 모층 = 층('KCM-모자라는흙', 5)
      글(글층, '토공유동도 — 화살: 깎는 곳 무게중심 → 쌓는 곳 무게중심(길이 = 평균운반거리) · 막대: 측점 사이 1 m 당 남는(위) · 모자라는(아래) 흙', xs, 꼭대기, 글높 * 0.9, { 가로: 0, 세로: 2 })
      선(유층, [xs, y유], [xe, y유])
      for (const c of 칸) {
        const h = (Math.abs(c.v) / 최대v) * 막대높
        줄(c.v > 0 ? 남층 : 모층, c.v > 0 ? [[c.a, y유], [c.a, y유 + h], [c.b, y유 + h], [c.b, y유]] : [[c.a, y유], [c.a, y유 - h], [c.b, y유 - h], [c.b, y유]], true)
      }
      for (const { q, p } of 활) {
        const x1 = p.절c, x2 = p.성c, c = Math.abs(x2 - x1), s = 0.35 * c
        const 볼록 = (x2 > x1 ? -1 : 1) * (2 * s) / c
        머리('LWPOLYLINE', 유층); P(100, 'AcDbPolyline'); P(90, 2); P(70, 0)
        P(10, 수(x1)); P(20, 수(y유)); P(42, 수(볼록)); P(10, 수(x2)); P(20, 수(y유))
        넓(x1, y유); 넓(x2, y유); 넓((x1 + x2) / 2, y유 + s)
        /* 화살촉 — 끝에서 활의 접선(현과 θ/2 · θ = 4 atan(0.7)) 반대로 ±25° */
        const 반각 = 2 * Math.atan(2 * s / c), 방 = x2 > x1 ? 1 : -1
        const tx = 방 * Math.cos(반각), ty = -Math.sin(반각)
        for (const 돌 of [0.44, -0.44]) {
          const cx = Math.cos(돌), sx = Math.sin(돌)
          const bx = -(tx * cx - ty * sx), by = -(tx * sx + ty * cx)
          선(유층, [x2, y유], [x2 + bx * 글높 * 0.8, y유 + by * 글높 * 0.8])
        }
        글(유층, 동그라미(q.번) + ' ' + 쉼(p.V, 0) + '㎥ · ' + 쉼(p.L, 1) + 'm' + (p.이름 && (q.띠별 || []).length > 1 ? ' · ' + p.이름 : ''), (x1 + x2) / 2, y유 + s + 글높 * 0.6, 글높 * 0.7)
      }
      const 아래들 = R.마디.flatMap((q) => [...(q.사묶음 || []).map((m) => ['사', m]), ...(q.순묶음 || []).map((m) => ['순', m])]).filter(([, m]) => m.V > 1e-9).sort((a, b) => a[1].c - b[1].c)
      아래들.forEach(([꼴, m], k) => {
        const 층n = 꼴 === '사' ? 층('KCM-사토', 6) : 층('KCM-토취장', 200)
        const y끝 = y유 - 막대높 - 글높 * (3 + (k % 2) * 1.6)
        선(층n, [m.c, y유], [m.c, y끝])
        const [ya2, yb2] = 꼴 === '사' ? [y끝, 1] : [y유, -1]
        선(층n, [m.c, ya2], [m.c - 글높 * 0.3, ya2 + yb2 * 글높 * 0.6]); 선(층n, [m.c, ya2], [m.c + 글높 * 0.3, ya2 + yb2 * 글높 * 0.6])
        const 말 = 꼴 === '사' ? '사토 ' + 쉼(m.V, 0) + '㎥' + (m.장이름 ? ' → ' + m.장이름 + ' ' + 쉼(m.L, 0) + 'm' : '') : '순성토 ' + 쉼(m.V, 0) + '㎥' + (m.장이름 ? ' ← ' + m.장이름 + ' ' + 쉼(m.L, 0) + 'm' : '')
        글(층n, 말, m.c, y끝 - 글높 * 0.8, 글높 * 0.7)
      })
    }
  }
  /* 제목 · 배율 */
  const 제목 = '유토곡선도' + (판.설정 && 판.설정.공사명 ? ' — ' + 판.설정.공사명 : '') + (판.이름 ? ' (' + 판.이름 + ')' : '')
  글(글층, 제목, (xs + xe) / 2, Y(yb) + 글높 * 3.2, 글높 * 1.8)
  글(글층, `가로 1 = 1 m · 세로 1 = ${쉼(k, 3)} ㎥ · 운반 ${쉼(R.합.종)} ㎥ · 평균운반거리 ${쉼(R.합.L)} m · 사토 ${쉼(R.합.사토)} ㎥ · 순성토 ${쉼(R.합.순성토)} ㎥ (다짐 기준) · K-건설맵 토적컨맵`, xs, Y(ya) - 글높 * (장있음 ? 13 : 9), 글높 * 0.8, { 가로: 0, 세로: 2 })
  /* 층 표 */
  const 층글 = []
  for (const [이름, aci] of 층들) 층글.push('  0', 'LAYER', '  5', 손(), '330', 틀정보.층표, '100', 'AcDbSymbolTableRecord', '100', 'AcDbLayerTableRecord', '  2', 이름, ' 70', '0', ' 62', String(aci), '  6', 'Continuous', '370', '-3', '390', '13', '347', '21')
  if (!Number.isFinite(x0)) { x0 = 0; y0 = 0; x1 = 1; y1 = 1 }
  return 틀
    .replace('@@LAYERN@@', String(2 + 층들.size))
    .replace('@@LAYERS@@', 층글.length ? 층글.join('\n') + '\n' : '')
    .replace('@@ENTITIES@@', E.length ? E.join('\n') + '\n' : '')
    .replace('@@HANDSEED@@', 손())
    .replace('@@EXMINX@@', 수(x0)).replace('@@EXMINY@@', 수(y0)).replace('@@EXMAXX@@', 수(x1)).replace('@@EXMAXY@@', 수(y1))
}

/** 파일 받기(<a download> — 받은수가 저절로 셈) */
export function 글받기(이름, 글, 타입 = 'application/dxf') {
  const url = URL.createObjectURL(new Blob([new TextEncoder().encode(글)], { type: 타입 }))
  const a = document.createElement('a')
  a.href = url
  a.download = String(이름).replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_').slice(0, 80)
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 30000)
  return a.download
}
