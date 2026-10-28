/**
 * 🛣 K-적산컨맵 작업 화면 «토목» 탭 — 셈만(화면 · 파일 · 그물 없음) · G396 (2026-10-24)
 *
 * 소장님(10/24 0시): 「토목도 되는 거지?」 · 「도구도 따로?」 · 「좌표가 있어야 해」
 *   → 같은 작업 화면에 🏢 건축 | 🛣 토목 탭(따로 안 만듦) · 바탕 = 노선(STA) · 실제 좌표(TM X · Y) · 표고(EL) · 측량점 파일 · 좌표계.
 *   읽기는 BIM 물량 화면과 «같은 길»(도면 3D 일꾼 lib/dxf3d.worker.js → r.활용) — 여기서는 그 결과를 토목 탭에 쓰는 꼴로만 바꿈.
 *
 * ■ 좌표: 일꾼 값 그대로(mm · 가운데 빼기 전 = 측량 자료가 기준이면 실제 TM 좌표 mm). 측량 X = 북 · Y = 동(lib/활용3d.js 측량좌표).
 * ■ 노선 하나에 STA(측점) · X · Y · 지반고 · 계획고(종단 표 안에서만 — 표 밖은 짐작하지 않음) · 땅 면 EL(측량점 삼각망).
 * ■ 측량점 파일 두 가지: ① 좌표 성과표(점 · X · Y · Z — 일꾼 기준으로 씀, lib/성과표.js) ② 측점 성과(위치 NO.n+d · 설계지반고 · 시공 지반고 — 노선마다 맞대기).
 * ■ 좌표계: 숫자만으로는 원점(서부 · 중부 · 동부 · 동해)을 가릴 수 없어 도면 · 파일 글자(GRS80 · Bessel · ○부원점)로 짐작하고 고르게 함 → 경위도(GRS80) · 지도.
 * 시험: node tools/시험_토목탭.mjs
 */
import { 노선자리, 측점찾기, 측점글, 종단높이, 노선길이, 측량좌표, TM원점 } from './활용3d.js'
import { 높이찾개 } from './토공3d.js'
import { 같은건물찾기 } from './건물겹치기.js'
import { 횡단두벌빼기 } from './BIM토목.js'
import { 끊음펴기들 } from './조각맞춤.js'

export const 토목열쇠 = 'kcm.civil.v1'
/** 측점 글 — 0 앞(−)은 도면 꼴 «NO.0-7.00» (활용3d 측점글은 «NO.-1+43.00» 이 됨) */
const 측글 = (s, G = 20) => (Number.isFinite(s) && s < -0.005 ? `NO.0-${(-s).toFixed(2)}` : 측점글(s, G))
const 반 = (v, d = 3) => (Number.isFinite(v) ? Math.round(v * 10 ** d) / 10 ** d : NaN)

/** STA 글 — 186 → «STA 0+186.00» · 1,043 → «STA 1+043.00» · −7 → «STA -0+007.00» */
export function STA글(s) {
  if (!Number.isFinite(s)) return ''
  const 부 = s < -1e-9 ? '-' : ''
  const a = Math.round(Math.abs(s) * 100) / 100
  const k = Math.floor((a + 1e-9) / 1000), m = a - k * 1000
  return `STA ${부}${k}+${m.toFixed(2).padStart(6, '0')}`
}

/* ── 노선 정리 ───────────────────────────── */
const 끝점 = (L) => { const a = L.줄, n = a.length; return n >= 10 ? [a[1], a[2], a[n - 4], a[n - 3]] : null }
/** 종단 표 측점 글(«No.1» 꼴)이 간격과 맞는 몫(0~1) — 같은 노선 두 벌에서 간격이 맞는 쪽을 고름 */
function 간격맞음(L, 종) {
  if (!종 || !L.간격) return 0
  let n = 0, 맞 = 0
  for (const r of 종.줄 || []) {
    const m = /^\s*NO\.?\s*(\d+)\s*$/i.exec(String(r.글 || ''))
    if (!m) continue
    n++
    if (Math.abs(+m[1] * L.간격 - r.m) < 0.05) 맞++
  }
  return n ? 맞 / n : 0
}
/**
 * 같은 자리 노선(시작 · 끝 2 m 안 · 연장 2 m 안)은 하나로 — 평면도마다 같은 노선을 그려 두 벌 · 세 벌로 읽힘
 *   남길 것: 횡단 · 종단이 붙은 이름 → 종단 표 측점(No.n)과 간격이 맞는 것 → 먼저 것.
 *   이름이 같고 시작이 같은데 간격만 다른 두 벌(현장 S 배수장 노선 20 m · 25 m)도 하나로 — 간격이 종단 표와 맞는 쪽.
 * @returns { 노선: 남긴 것, 겹: [{이름, 남김, 까닭}] }
 */
export function 노선정리(활) {
  const 들 = (활 && 활.노선) || []
  const 붙은 = new Set([...(활.횡단 || []).map((t) => t.노선), ...(활.종단 || []).map((z) => z.노선)].filter(Boolean))
  const 점수 = (L) => {
    const 종 = (활.종단 || []).find((z) => z.노선 === L.이름)
    return (붙은.has(L.이름) ? 2 : 0) + 간격맞음(L, 종)
  }
  const 남 = [], 겹 = []
  for (const L of 들) {
    const e = 끝점(L)
    const 짝 = 남.find((K) => {
      const f = 끝점(K)
      if (!e || !f) return false
      const 시작같 = Math.hypot(e[0] - f[0], e[1] - f[1]) < 2000
      const 끝같 = Math.hypot(e[2] - f[2], e[3] - f[3]) < 2000 && Math.abs(노선길이(L) - 노선길이(K)) < 2
      return 시작같 && (끝같 || K.이름 === L.이름)
    })
    if (!짝) { 남.push(L); continue }
    const 새것나음 = 점수(L) > 점수(짝)
    const [버림, 남김] = 새것나음 ? [짝, L] : [L, 짝]
    if (새것나음) 남[남.indexOf(짝)] = L
    겹.push({ 이름: 버림.이름, 남김: 남김.이름, 까닭: 버림.이름 !== 남김.이름 ? `같은 자리 같은 노선 — «${남김.이름}» 하나로` : 버림.간격 !== 남김.간격 ? `같은 노선 두 벌 — 간격 ${남김.간격} m 인 것을 씀(${버림.간격} m 은 종단 표 측점과 안 맞음)` : '같은 노선 두 벌(평면도 두 장) — 하나로' })
  }
  return { 노선: 남, 겹 }
}

/* ── 땅 면 ───────────────────────────── */
/** 측량 땅 면(삼각망) → (x, y mm) → EL m | NaN */
export function 땅찾개(활) {
  const 땅 = 활 && 활.땅
  if (!땅 || !땅.점 || !땅.삼 || 땅.삼.length < 3) return () => NaN
  const 점 = [], 삼 = []
  for (let i = 0; i + 2 < 땅.점.length; i += 3) 점.push([땅.점[i], 땅.점[i + 1], 땅.점[i + 2]])
  for (let i = 0; i + 2 < 땅.삼.length; i += 3) 삼.push([땅.삼[i], 땅.삼[i + 1], 땅.삼[i + 2]])
  const h = 높이찾개(점, 삼)
  return (x, y) => { const z = h(x, y); return Number.isFinite(z) ? z / 1000 : NaN }
}

/* ── 노선 목록 · 측점표 ───────────────────────────── */
/** 노선마다 요약 — 이름 · 간격 · STA 범위 · 실제 연장 · 횡단 단면 수 · 종단 줄 수 · 시작 · 끝 좌표 */
export function 노선목록(활) {
  return (활.노선 || []).map((L, i) => {
    const 종 = (활.종단 || []).find((z) => z.노선 === L.이름)
    const 횡 = (활.횡단 || []).filter((t) => t.노선 === L.이름)
    const [s0, s1] = L.범위
    const a = 노선자리(L, s0), b = 노선자리(L, s1)
    const A = a ? 측량좌표(a.x, a.y, 활.바꿈) : null, B = b ? 측량좌표(b.x, b.y, 활.바꿈) : null
    return {
      번: i, 이름: L.이름, 간격: L.간격 || 20, 범위: [s0, s1], 연장: 반(노선길이(L), 2), 측길이: 반(s1 - s0, 2),
      단면수: 횡.reduce((n, t) => n + t.단면.length, 0), 종단줄: 종 ? 종.줄.length : 0,
      밖수: new Set([...(종 ? 종.줄.map((r) => r.m) : []), ...횡.flatMap((t) => t.단면.map((q) => q.측))].filter((m) => m < s0 - 0.01 || m > s1 + 0.01).map((m) => Math.round(m * 100))).size,
      끝측: Math.max(s1, ...(종 ? 종.줄.map((r) => r.m) : []), ...횡.flatMap((t) => t.단면.map((q) => q.측))),
      시작: { 측글: 측글(s0, L.간격 || 20), STA: STA글(s0), X: A ? 반(A.X) : NaN, Y: A ? 반(A.Y) : NaN },
      끝: { 측글: 측글(s1, L.간격 || 20), STA: STA글(s1), X: B ? 반(B.X) : NaN, Y: B ? 반(B.Y) : NaN },
    }
  })
}

/** 종단 표 값 — 표 안에서만(같은 측점은 그 값 · 사이는 이음 · 표 밖은 NaN) */
function 표값(종, s, k) {
  const a = 종 ? 종.줄.filter((r) => Number.isFinite(r[k])) : []
  if (!a.length || s < a[0].m - 0.01 || s > a[a.length - 1].m + 0.01) return NaN
  const r = a.find((q) => Math.abs(q.m - s) <= 0.01)
  return r ? r[k] : 반(종단높이(a, s, k), 3)
}

/**
 * 📍 노선 측점표 — 간격마다 + 종단 표 측점(+36.00 같은 덧점) + 횡단 단면 측점 + 시작 · 끝
 * @returns [{측, 측글, STA, X, Y, 지반고, 계획고, 땅EL, 단면, 밖(평면 노선 밖 — 늘린 자리)}]
 */
export function 측점표(활, 이름, 옵 = {}) {
  const L = (활.노선 || []).find((x) => x.이름 === 이름)
  if (!L) return []
  const G = 옵.간격 || L.간격 || 20
  const 땅 = 옵.땅 || (() => NaN)
  const 종 = (활.종단 || []).find((z) => z.노선 === 이름)
  const 단면측 = new Set()
  for (const t of 활.횡단 || []) if (t.노선 === 이름) for (const s of t.단면) 단면측.add(Math.round(s.측 * 100) / 100)
  const [s0, s1] = L.범위
  const 측들 = [s0, s1]
  for (let s = Math.ceil((s0 - 1e-6) / G) * G; s <= s1 + 1e-6; s += G) 측들.push(s)
  /* 종단 · 횡단 측점은 평면 노선(측점 글자) 범위 밖이어도 넣음 — 밖은 노선 끝 방향으로 늘린 자리(«밖» 표시 · 3D · 횡단도 그 자리에 섬) */
  if (종) for (const r of 종.줄) 측들.push(r.m)
  for (const s of 단면측) 측들.push(s)
  const 고른 = [...new Set(측들.map((s) => Math.round(s * 100) / 100))].sort((p, q) => p - q)
  const 줄 = []
  for (const s of 고른) {
    if (줄.length && Math.abs(줄[줄.length - 1].측 - s) < 0.005) continue
    const p = 노선자리(L, s)
    if (!p) continue
    const c = 측량좌표(p.x, p.y, 활.바꿈)
    줄.push({ 측: s, 측글: 측글(s, L.간격 || 20), STA: STA글(s), X: 반(c.X), Y: 반(c.Y), 지반고: 표값(종, s, '지반고'), 계획고: 표값(종, s, '계획고'), 땅EL: 반(땅(p.x, p.y), 3), 단면: 단면측.has(Math.round(s * 100) / 100), 밖: s < s0 - 0.01 || s > s1 + 0.01 })
  }
  return 줄
}

/** 측점표 → CSV(측점 · STA · X(북) · Y(동) · 지반고 · 계획고 · 땅 면 EL) */
export function 측점표CSV(이름, 줄) {
  const z = (v, d = 3) => (Number.isFinite(v) ? v.toFixed(d) : '')
  const 칸 = (s) => (/[",\r\n]/.test(s) ? '"' + String(s).replace(/"/g, '""') + '"' : s)
  return ['노선,측점,STA,X(북),Y(동),지반고,계획고,땅면EL,횡단,비고', ...줄.map((r) => [칸(이름), r.측글, r.STA, z(r.X), z(r.Y), z(r.지반고, 2), z(r.계획고, 2), z(r.땅EL, 2), r.단면 ? '단면' : '', r.밖 ? '평면 노선 밖(노선 끝 방향으로 늘린 자리)' : ''].join(','))].join('\r\n') + '\r\n'
}

/**
 * 📍 고른 자리 — 도면 좌표(mm) → 측량 좌표 X(북) · Y(동) · 땅 면 EL · 가까운 노선의 STA · 옆(진행 방향 오른쪽 +) · 그 측점 지반고 · 계획고
 * @param 한도 노선에서 이만큼(m) 안일 때만 노선 짝으로
 */
export function 자리읽기(활, x, y, 땅 = () => NaN, 한도 = 60) {
  const c = 측량좌표(x, y, 활.바꿈)
  const 후 = []
  for (const L of 활.노선 || []) {
    const q = 측점찾기(L, x, y)
    if (!q || q.d > 한도) continue
    const 종 = (활.종단 || []).find((z) => z.노선 === L.이름)
    const 밖 = q.s < L.범위[0] - 0.01 || q.s > L.범위[1] + 0.01
    후.push({ 이름: L.이름, s: 반(q.s, 2), 측글: 측글(q.s, L.간격 || 20), STA: STA글(q.s), 옆: 반(q.옆, 2), d: 반(q.d, 2), 밖, 지반고: 표값(종, q.s, '지반고'), 계획고: 표값(종, q.s, '계획고') })
  }
  후.sort((a, b) => a.d - b.d)
  return { X: 반(c.X), Y: 반(c.Y), EL: 반(땅(x, y), 3), 노선: 후.slice(0, 3) }
}

/* ── 좌표계 · 경위도 ───────────────────────────── */
/** 고를 수 있는 좌표계 — GRS80(2003 이후 측량 · 가산 북 600 km · 동 200 km) 네 원점 + 도면 좌표 */
export const 좌표계들 = [
  { k: '중부', 이름: '중부원점 · GRS80 (EPSG:5186)', 원: TM원점[1] },
  { k: '서부', 이름: '서부원점 · GRS80 (EPSG:5185)', 원: TM원점[0] },
  { k: '동부', 이름: '동부원점 · GRS80 (EPSG:5187)', 원: TM원점[2] },
  { k: '동해', 이름: '동해원점 · GRS80 (EPSG:5188)', 원: TM원점[3] },
  { k: '도면', 이름: '도면 좌표(측량 좌표 아님 — 경위도 안 셈)', 원: null },
]
/** TM X(북) · Y(동) m → 위도 · 경도(GRS80 · 원점 위도 38° · 축척 1) — lib/활용3d.js 경위도TM 의 거꾸로 */
export function TM경위도(X, Y, 원 = TM원점[1]) {
  if (!원 || !Number.isFinite(X) || !Number.isFinite(Y)) return null
  const a = 6378137, f = 1 / 298.257222101, e2 = 2 * f - f * f, ep2 = e2 / (1 - e2), k0 = 1
  const r = Math.PI / 180, φ0 = 38 * r, λ0 = 원.lon0 * r
  const M = (p) => a * ((1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * e2 ** 3 / 256) * p - (3 * e2 / 8 + 3 * e2 * e2 / 32 + 45 * e2 ** 3 / 1024) * Math.sin(2 * p)
    + (15 * e2 * e2 / 256 + 45 * e2 ** 3 / 1024) * Math.sin(4 * p) - (35 * e2 ** 3 / 3072) * Math.sin(6 * p))
  const Mv = M(φ0) + (X - 원.FN) / k0
  const μ = Mv / (a * (1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * e2 ** 3 / 256))
  const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2))
  const φ1 = μ + (3 * e1 / 2 - 27 * e1 ** 3 / 32) * Math.sin(2 * μ) + (21 * e1 * e1 / 16 - 55 * e1 ** 4 / 32) * Math.sin(4 * μ) + (151 * e1 ** 3 / 96) * Math.sin(6 * μ) + (1097 * e1 ** 4 / 512) * Math.sin(8 * μ)
  const s1 = Math.sin(φ1), c1 = Math.cos(φ1), t1 = Math.tan(φ1)
  const C1 = ep2 * c1 * c1, T1 = t1 * t1, N1 = a / Math.sqrt(1 - e2 * s1 * s1), R1 = a * (1 - e2) / (1 - e2 * s1 * s1) ** 1.5
  const D = (Y - 원.FE) / (N1 * k0)
  const φ = φ1 - (N1 * t1 / R1) * (D * D / 2 - (5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * ep2) * D ** 4 / 24 + (61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * ep2 - 3 * C1 * C1) * D ** 6 / 720)
  const λ = λ0 + (D - (1 + 2 * T1 + C1) * D ** 3 / 6 + (5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * ep2 + 24 * T1 * T1) * D ** 5 / 120) / c1
  return { 위도: φ / r, 경도: λ / r }
}
/**
 * 좌표계 짐작 — 도면 · 파일에 적힌 글자(원점 · 측지계) → 고를 좌표계 + 까닭
 * @param 글들 파일 이름 · 그룹 제목 · 도면에서 찾은 좌표계 글자(«GRS80좌표계» · «Bessel, 중부») 들
 */
export function 좌표계짐작(실좌표, 글들 = []) {
  if (!실좌표) return { k: '도면', 까닭: '측량 도면 · 성과표가 기준이 아니라 도면 좌표입니다 — 측량 자료를 같이 넣으면 실제 좌표가 됩니다' }
  const 글 = 글들.filter(Boolean).join(' ')
  const 원 = /서부\s*원점/.test(글) ? '서부' : /동해\s*원점/.test(글) ? '동해' : /동부\s*원점/.test(글) ? '동부' : /중부\s*원점|중부/.test(글) ? '중부' : ''
  const GRS = /GRS\s*-?\s*80|GES\s*80|세계\s*측지/i.test(글), 베셀 = /bessel|베셀|동경\s*측지/i.test(글)
  const 덧 = [GRS ? '«GRS80»' : '', 베셀 ? '«Bessel»' : '', 원 ? `«${원}»` : ''].filter(Boolean).join(' · ')
  const 말 = 덧 ? `도면 · 파일에 ${덧} 글자가 있습니다` : '숫자만으로는 원점(서부 · 중부 · 동부 · 동해)을 가릴 수 없어 우리나라 대부분인 중부원점으로 둡니다'
  return { k: 원 || '중부', 까닭: 말 + ' — 지도에서 현장 자리가 맞는지 보고, 다르면 고르십시오' + (베셀 ? ' · Bessel(옛 좌표)이면 경위도가 수백 m 어긋납니다(세계측지계로 바꾼 성과를 넣어 주십시오)' : '') }
}
/** 지도 주소(카카오맵) — 위도 · 경도 */
export const 지도주소 = (위도, 경도) => `https://map.kakao.com/link/map/${encodeURIComponent('현장')},${위도.toFixed(6)},${경도.toFixed(6)}`

/* ── 측점 성과(측량점 파일 · STA 꼴) ───────────────────────────── */
const 글 = (v) => String(v ?? '').normalize('NFKC').replace(/\s+/g, ' ').trim()
const 수 = (v) => { if (typeof v === 'number') return Number.isFinite(v) ? v : NaN; const s = 글(v).replace(/,/g, ''); return /^[-+]?\d+(\.\d+)?$/.test(s) ? parseFloat(s) : NaN }
/** «NO.3+36.00» · «NO.0-7.0» · «No 2+16» · «STA 0+186.00» · «0+186.0» → { n, d } 또는 { m } */
export function 측점풀기(s) {
  const t = 글(s).toUpperCase().replace(/\s+/g, '')
  let m = /^(?:NO\.?)(\d+)(?:([+-])(\d+(?:\.\d+)?))?$/.exec(t)
  if (m) return { n: +m[1], d: m[2] ? (m[2] === '-' ? -1 : 1) * +m[3] : 0 }
  m = /^(?:STA\.?)?(\d+)\+(\d+(?:\.\d+)?)$/.exec(t)
  if (m) return { m: +m[1] * 1000 + +m[2] }
  return null
}
/**
 * 표(행) → 측점 성과 { 노선글, 줄: [{글, 측글꼴, 설계, 시공}] } | null
 *   머리 = 위치 · 측점 · STA 칸 + «설계…지반고(계획고)» 칸 (+ «시공 · 측량 …» 칸)
 */
export function 측점성과풀기(행들, 시트 = '') {
  const rows = (행들 || []).filter((r) => Array.isArray(r))
  let 머 = -1, c위 = -1, c설 = -1, c시 = -1
  for (let i = 0; i < Math.min(25, rows.length) && 머 < 0; i++) {
    const r = rows[i].map(글)
    const 위 = r.findIndex((s) => /^(위\s*치|측\s*점|STA\.?|NO\.?|STATION)$/i.test(s))
    const 설 = r.findIndex((s) => /설\s*계.*(지\s*반\s*고|계\s*획\s*고|고)|^(지\s*반\s*고|G\.?\s*H)$/i.test(s) && !/시\s*공/.test(s))
    if (위 >= 0 && 설 >= 0) { 머 = i; c위 = 위; c설 = 설; c시 = r.findIndex((s, j) => j !== 설 && /(시\s*공|측\s*량|실\s*측|현\s*황).*(지\s*반\s*고|고|EL)/i.test(s)) }
  }
  if (머 < 0) return null
  const 줄 = []
  for (let i = 머 + 1; i < rows.length; i++) {
    const r = rows[i]
    const p = 측점풀기(r[c위])
    const 설 = 수(r[c설])
    if (!p || !Number.isFinite(설)) continue
    줄.push({ 글: 글(r[c위]), ...p, 설계: 설, 시공: c시 >= 0 ? 수(r[c시]) : NaN })
  }
  if (줄.length < 2) return null
  /* 노선 글 — 시트 이름 «측량성과표(1호 배수로)» · 맨 위 제목 «▣ 측량성과표(1호배수로» 의 괄호 안 */
  const 제목 = [시트, ...rows.slice(0, 머).flat().map(글)].join(' ')
  const m = /\(([^()]{2,30})\)?/.exec(시트) || /\(([^()]{2,30})/.exec(제목)
  const 노선글 = 글(m ? m[1] : 시트).replace(/[)▣\s]+$/g, '') || 시트
  return { 시트, 노선글, 줄 }
}
/** 파일 바이트 → [{시트, rows}] — 시트 이름을 지킴(xls · xlsx · csv · txt) */
export async function 표들읽기(이름, bytes) {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  if (u8[0] === 0x50 && u8[1] === 0x4b) {
    const { 엑셀읽기 } = await import('./엑셀읽기.js')
    const 책 = 엑셀읽기(u8)
    return 책.시트들.map((시) => {
      const rows = []
      for (const c of 시.칸.values()) {
        if (c.v == null || c.v === '') continue
        while (rows.length < c.행) rows.push([])
        const row = rows[c.행 - 1]
        while (row.length < c.열 - 1) row.push(null)
        row[c.열 - 1] = c.v
      }
      return { 시트: 시.이름 || '', rows }
    })
  }
  if (u8[0] === 0xD0 && u8[1] === 0xCF) {
    const { xls읽기 } = await import('./xls읽기.js')
    return Object.entries(xls읽기(u8)).map(([시트, rows]) => ({ 시트, rows }))
  }
  const { 글표 } = await import('./성과표.js')
  let t = new TextDecoder('utf-8').decode(u8)
  if (t.includes('�')) { try { t = new TextDecoder('euc-kr').decode(u8) } catch (e) { /* 그대로 */ } }
  return [{ 시트: String(이름 || '').replace(/\.\w+$/, ''), rows: 글표(t) }]
}
/** 파일 → 측점 성과들(시트마다) */
export async function 측점성과읽기(이름, bytes) {
  const 표들 = await 표들읽기(이름, bytes)
  return 표들.map((t) => 측점성과풀기(t.rows, t.시트)).filter(Boolean)
}
/** 노선 이름 짝 — «1호 배수로» ↔ «○○지구 1호(중앙)배수로» (괄호 · 띄어쓰기 빼고 한쪽이 다른 쪽을 품음 · «n호» 는 같아야) */
export function 노선짝(글1, 노선이름들) {
  const 깎 = (s) => 글(s).replace(/\([^)]*\)/g, '').replace(/[\s·.,\-_()]/g, '').toUpperCase()
  const 호 = (s) => { const m = /(\d+)\s*호/.exec(글(s)); return m ? +m[1] : null }
  const a = 깎(글1), h = 호(글1)
  const 후 = 노선이름들.filter((n) => { const b = 깎(n); if (!a || !b) return false; if (h != null && 호(n) !== h) return false; return b.includes(a) || a.includes(b) })
  return 후.sort((p, q) => 깎(p).length - 깎(q).length)[0] || null
}
/**
 * 측점 성과 ↔ 도면(종단 표 지반고) 맞대기 — 노선마다
 *   차 = 파일 설계지반고 − 도면 지반고 · 부호만 다름(|설계| = |도면| · 부호 반대) · 시공차 = 시공 − 설계
 */
export function 측점성과대조(활, 성과들) {
  const 이름들 = (활.노선 || []).map((L) => L.이름)
  return (성과들 || []).map((g) => {
    const 이름 = 노선짝(g.노선글, 이름들)
    const L = 이름 ? 활.노선.find((x) => x.이름 === 이름) : null
    const 종 = 이름 ? (활.종단 || []).find((z) => z.노선 === 이름) : null
    const G = L ? L.간격 || 20 : 20
    const 줄 = g.줄.map((r) => {
      const 측 = r.m != null ? r.m : r.n * G + r.d
      const 도 = 종 ? 표값(종, 측, '지반고') : NaN
      const 차 = 반(r.설계 - 도, 3)
      return { 글: r.글, 측: 반(측, 2), 도면: 도, 설계: r.설계, 차, 부호만: Number.isFinite(도) && Math.abs(도) > 0.005 && Math.abs(r.설계 + 도) < 0.005, 시공: r.시공, 시공차: 반(r.시공 - r.설계, 3) }
    })
    const 본 = 줄.filter((r) => Number.isFinite(r.차))
    return {
      시트: g.시트, 노선글: g.노선글, 노선: 이름, 줄,
      요약: { n: 줄.length, 맞댐: 본.length, 맞음: 본.filter((r) => Math.abs(r.차) <= 0.005).length, 부호만: 본.filter((r) => r.부호만).length,
        최대차: 본.length ? 반(Math.max(...본.map((r) => Math.abs(r.차))), 3) : NaN,
        시공최대: 줄.some((r) => Number.isFinite(r.시공차)) ? 반(Math.max(...줄.filter((r) => Number.isFinite(r.시공차)).map((r) => Math.abs(r.시공차))), 3) : NaN },
    }
  })
}

/* ── 길잡이 · 도면함 ───────────────────────────── */
const 종이름 = { 측량: '측량', 측량점: '측량 성과표', 평면: '평면', 종평: '종평면', 종단: '종단', 횡단: '횡단', 횡단못: '횡단(표 못 읽음)', 노선: '노선', 땅면: '땅 면', 구조: '구조물', 건물: '건물', 상세: '상세', 표: '표', 건축: '건축', 기타: '기타', 밖: '도곽 밖' }   // 🔰 G441 «횡단못» 이 그대로 보이던 것
/** 그룹(일꾼 r.그룹) → 도면함 줄 { 번, 종류, 이름, 파일, 상태(기준 · 맞춤 · 그대로 · 옆 · 꺼둠 · 높이만), 글 } */
export function 도면함(그룹) {
  const 들 = []
  for (const g of 그룹 || []) {
    if (['땅면', '횡단', '노선'].includes(g.종류)) continue
    const how = g.자리 && g.자리.how
    const 상태 = g.기준 ? '기준' : how === '글자' ? '맞춤' : how === '좌표' ? '그대로' : how === '끼움' ? '끼움' : how === '모양' ? '맞춤' : how === '옆' ? '옆' : ['종단', '상세', '표', '건축'].includes(g.종류) ? '높이만' : g.켬 ? '그대로' : '꺼둠'
    const 글 = 상태 === '기준' ? '기준 — 실제 좌표' : 상태 === '맞춤' ? `${how === '모양' ? '같은 모양 자리로 맞춤' : `같은 글자 ${g.자리.n || ''}개로 맞춤`}${g.자리.회전 && Math.abs(g.자리.회전) > 0.01 ? ` · ${Math.round(g.자리.회전 * 10) / 10}° 돌림` : ''}` : 상태 === '그대로' ? '좌표 그대로' : 상태 === '끼움' ? 'xref 끼움 자리' : 상태 === '옆' ? `자리 못 찾음 — ${(g.자리 && g.자리.까닭) || ''}` : 상태 === '높이만' ? '표 · 높이만 읽음' : '꺼 둠'
    들.push({ 번: g.번, 종류: 종이름[g.종류] || g.종류, 이름: g.제목 && g.제목 !== '도곽 밖' ? g.제목 : String(g.파일 && g.파일[0] || '').replace(/\.(dxf|dwg)$/i, ''), 파일: (g.파일 || []).join(', '), 상태, 글, 켬: !!g.켬, 먼곳: !!(g.자리 && g.자리.먼곳) })
  }
  return 들
}
/**
 * 🧭 토목 길잡이 — ① 측량 자료 → ② 계획평면도(노선 · 측점) → ③ 종단 → ④ 횡단 → ⑤ 구조물 → ⑥ 땅 면 → ⑦ 물량 · 엑셀
 *   상태: ✓(됨) · ▶(지금) · ⚠(빠짐 — 무엇을 넣을지) · –(없어도 됨)
 */
export function 토목길잡이(T) {
  const 활 = (T && T.활용) || {}
  const 노 = 활.노선 || [], 종 = 활.종단 || [], 횡 = (활.횡단 || []).filter((t) => t.노선), 구 = 활.구조 || []
  const 측량 = !!활.실좌표
  const 단면 = 횡.reduce((n, t) => n + t.단면.length, 0)
  const 땅 = 활.땅 ? 활.땅.점.length / 3 : 0
  const 일 = [
    { k: '측량', 이름: '① 측량 자료(GPS · 측량도면 · 성과표)', 됨: 측량, 글: 측량 ? '실제 좌표(TM)로 맞춤' + ((T && T.성과 && T.성과.n) ? ` · 성과표 ${T.성과.n}점` : '') : '측량도면 또는 좌표 성과표를 넣으면 실제 좌표가 됩니다', 꼭: true },
    { k: '노선', 이름: '② 계획평면도 — 노선 · 측점(STA)', 됨: 노.length > 0, 글: 노.length ? `노선 ${노.length}개` : '측점 글자(NO.0 · 0+020)와 중심선이 있는 계획평면도 · 종평면도를 넣어 주십시오', 꼭: true },
    { k: '종단', 이름: '③ 종단 — 지반고 · 계획고', 됨: 종.length > 0, 글: 종.length ? `종단 ${종.length}개` : '종단면도(측점 · 지반고 · 계획고 표)를 넣으면 EL 이 붙습니다', 꼭: true },
    { k: '횡단', 이름: '④ 횡단 — 단면 · 토공', 됨: 단면 > 0, 글: 단면 ? `단면 ${단면.toLocaleString('ko-KR')}개(노선 따라)` : '횡단면도를 넣으면 터파기 · 되메우기 · 구조물이 나옵니다', 꼭: true },
    { k: '구조', 이름: '⑤ 구조물(배수장 · 박스)', 됨: 구.length > 0, 글: 구.length ? `구조물 ${구.length}곳` : '있으면 — 구조물 일반도', 꼭: false },
    { k: '땅', 이름: '⑥ 땅 면(측량점 삼각망)', 됨: 땅 > 0, 글: 땅 ? `측량점 ${땅.toLocaleString('ko-KR')}개` : '높이 든 측량점이 있는 측량도면 · 성과표', 꼭: false },
    { k: '물량', 이름: '⑦ 물량 · 엑셀', 됨: false, 글: '노선마다 평균단면 · 측점표(STA · X · Y · EL) · 엑셀', 꼭: false },
  ]
  let 지금 = 일.findIndex((x) => x.꼭 && !x.됨)
  if (지금 < 0) 지금 = 일.length - 1
  return 일.map((x, i) => ({ ...x, 상태: x.됨 ? '✓' : i === 지금 ? '▶' : x.꼭 ? '⚠' : '–' }))
}

/**
 * 토목을 못 찾았을 때 까닭 — 넣은 도면 제목으로 무엇이 빠졌는지(G396 · 현장 P 플랜트 기초 · 현장 Y 흙막이 설계 도면으로 시험)
 *   골조(FOUNDATION · FOOTING · BEAM PLAN · 기둥 · 보 일람) → 🏢 건축 탭 «도면 넣기» · 흙막이 단면 · 전개도만 → 흙막이 평면도 · 측점 없는 도로 · 배수 · 터파기 평면 → 측점(NO · STA) 든 평면 · 종횡단
 */
export function 못찾음글(r, 옵 = {}) {
  const 제목 = ((r && r.그룹) || []).map((g) => g.제목 || '').join(' | ')
  const 말 = []
  /* 🛣🏢 G397 함께 넣기 — 골조를 같이 세웠으면 «세웠습니다», 아니면 어디서 나오는지 */
  if (옵.골조됨) 말.push('골조(기초 · 보 · 기둥)는 같이 세웠습니다 — 🏢 건축 탭 · 이 탭 «골조 같이 보기»')
  else if (/FOUNDATION|FOOTING|BEAM\s*PLAN|COLUMN|기초\s*(평면|구조|일람)|구조\s*평면|보\s*일람|기둥\s*일람/i.test(제목)) 말.push('골조(기초 · 보 · 기둥) 도면이 있습니다 — 골조 물량은 🏢 건축 탭 «📐 도면 넣기» 에서 나옵니다')
  if (/흙막이|가시설|H-?\s*PILE|STRUT|띠장|버팀/i.test(제목) && !(r && r.활용 && (r.활용.흙막이 || []).length)) 말.push('흙막이 도면이 단면 · 전개도 · 상세뿐이라 세우지 못했습니다 — 흙막이 평면도(H-PILE 자리 · 간격 C.T.C)가 든 도면을 같이 넣어 주십시오')
  if (/ROAD|도로|배수|EXCAVATION|터파기|토공/i.test(제목)) 말.push('도로 · 배수 · 터파기 평면 · 단면은 있지만 측점(NO.0 · 0+020) 노선이 없어 노선 토공을 셈하지 못했습니다')
  말.push('토목 탭은 측량도면 · 계획평면도(측점 · 중심선) · 종횡단면도로 노선 · 토공을 세웁니다')
  return 말.join(' / ')
}

/* ── 저장할 자료 ───────────────────────────── */
/** 일꾼 결과 → 바탕 선(Float32 · 원점 빼고 · 30만 줄까지) — BIM 물량 화면 바탕선만들기와 같은 고름 */
const 바탕꼴 = new Set(['측량', '평면', '종평', '노선', '땅면', '측량점'])
const 바탕뺄층 = /콘크리트$|땅 면$|계획 면$|측량점|종단 깃$/
export function 바탕선(r, 원점, 한도 = 300000, 파일번 = null) {
  const 켠 = new Set()
  /* 📚 G440 선마다 어느 도면(r.파일 번호)에서 왔나 — 도면함에서 «그 도면만 보기» 용(파일번 배열을 주면 채움 · 모르면 65535) */
  const 줄기들 = (r.파일 || []).map(도면줄기)
  const 층파일 = new Map()
  for (const g of r.그룹 || []) {
    const fi = 줄기들.indexOf(도면줄기((g.파일 || [])[0]))
    for (const k of g.층들 || []) if (!층파일.has(k)) 층파일.set(k, fi >= 0 ? fi : 65535)
    if (g.켬 && 바탕꼴.has(g.종류) && !(g.자리 && g.자리.how === '옆')) for (const k of g.층들 || []) 켠.add(k)
  }
  const 고른 = []
  let 총 = 0
  for (const l of r.layers || []) {
    if (l.off || !켠.has(l.floor) || 바탕뺄층.test(l.ly || '')) continue
    고른.push(l); 총 += l.pos.length / 6
  }
  const 걸음 = Math.max(1, Math.ceil(총 / 한도))
  const c = r.center || [0, 0, 0]
  const out = new Float32Array(Math.ceil(총 / 걸음 + 1) * 4)
  let n = 0, k = 0
  for (const l of 고른) {
    const p = l.pos
    const fi = 층파일.has(l.floor) ? 층파일.get(l.floor) : 65535
    for (let i = 0; i + 5 < p.length; i += 6) {
      if (k++ % 걸음) continue
      out[n++] = p[i] + c[0] - 원점[0]; out[n++] = p[i + 1] + c[1] - 원점[1]
      out[n++] = p[i + 3] + c[0] - 원점[0]; out[n++] = p[i + 4] + c[1] - 원점[1]
      if (파일번) 파일번.push(fi)
    }
  }
  return out.slice(0, n)
}

/** 📚 G440 도면 이름 줄기 — 확장자(DWG 를 DXF 로 바꾼 이름도) · «이름 · 노선글» 의 뒤는 뺌 → 같은 도면 */
export const 도면줄기 = (n) => String(n || '').split(' · ')[0].replace(/\.(dxf|dwg)$/i, '').trim()

/**
 * 📚 G440 도면함(파일마다) — 소장님 「도면함에서 도면을 선택하면 그 도면만 보여주게」 · 「최대한 간편하게」
 *   넣은 파일 하나가 한 줄: { i, 이름, 줄기, 쓰임: [['구조물', 1], ['횡단', 12] …], 씀(쓴 판 수), 판(전체 판 수), 글 }
 *   쓰임 = 이 도면에서 실제로 나온 것(노선 횡단 단면 · 구조물 · 건물 · 측량점) + 판 갈래(평면 · 종단 · 상세 …)
 */
export function 파일함(T) {
  const 파일 = (T && T.파일) || []
  const 들 = 파일.map((이름, i) => ({ i, 이름, 줄기: 도면줄기(이름), 갈래: {}, 씀: 0, 판: 0, 횡단: 0, 구조: 0, 건물: 0 }))
  const 찾 = new Map(들.map((x) => [x.줄기, x]))
  const 활 = (T && T.활용) || {}
  for (const g of (T && T.그룹) || []) {
    if (g.종류 === '땅면' || g.종류 === '노선') continue
    const x = 찾.get(도면줄기((g.파일 || [])[0])); if (!x) continue
    x.판++
    const 종 = 종이름[g.종류] || g.종류
    x.갈래[종] = (x.갈래[종] || 0) + 1
    if (g.켬 !== false && !(g.자리 && g.자리.how === '옆')) x.씀++
  }
  for (const t of 활.횡단 || []) { if (!t.노선) continue; const x = 찾.get(도면줄기(t.원파일 || t.파일)); if (x) x.횡단 += (t.단면 || []).length }
  for (const q of 활.구조 || []) { const x = 찾.get(도면줄기(Array.isArray(q.파일) ? q.파일[0] : q.파일)); if (x) x.구조++ }
  for (const b of 활.건물 || []) { const x = 찾.get(도면줄기((b.파일 || [])[0] || b.이름)); if (x) x.건물++ }
  for (const x of 들) {
    const 쓰임 = []
    if (x.구조) 쓰임.push(['구조물', x.구조])
    if (x.횡단) 쓰임.push(['횡단 단면', x.횡단])
    if (x.건물) 쓰임.push(['건물', x.건물])
    for (const [k, n] of Object.entries(x.갈래).sort((a, b) => b[1] - a[1])) if (!(k === '횡단' && x.횡단) && !(k === '구조물' && x.구조) && !(k === '건물' && x.건물)) 쓰임.push([k, n])
    x.쓰임 = 쓰임
    /* 🔰 G441 줄 글에는 «도곽 밖» 을 안 씀(거의 모든 도면에 1 — 처음 쓰는 분께는 뜻 없는 말 · 판 자세히에는 그대로) */
    const 보일 = 쓰임.filter(([k]) => k !== '도곽 밖')
    x.글 = !x.판 && !x.구조 && !x.횡단 ? '읽을 것 없음(표지 · 목차 · 그림만)' : 보일.length ? 보일.slice(0, 3).map(([k, n]) => k + ' ' + n).join(' · ') : '읽을 것 없음(도곽 밖 그림만)'
  }
  return 들
}
/** 📚 G440 3D 부재(토목모델) · 구조물이 어느 도면에서 왔나 — 줄기(모르면 '') */
export const 부재도면 = (o) => 도면줄기(o && (o.원파일 || o.파일))
/** 현장 틀(mm) — 노선 · 땅 · 구조물 · 성과점 둘레(바탕 선은 안 봄 — 먼 곳 그림에 끌려가지 않게) */
export function 현장틀(활) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  const 넣 = (x, y) => { if (!Number.isFinite(x) || !Number.isFinite(y)) return; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y }
  for (const L of 활.노선 || []) for (let i = 0; i < L.줄.length; i += 5) 넣(L.줄[i + 1], L.줄[i + 2])
  if (활.땅) for (let i = 0; i + 2 < 활.땅.점.length; i += 3) 넣(활.땅.점[i], 활.땅.점[i + 1])
  for (const q of 활.구조 || []) if (q.자리 !== '옆') for (const r of q.바닥판 || []) for (const [x, y] of r) 넣(x, y)     /* 자리 못 찾아 옆에 둔 구조물은 틀에 안 넣음 */
  for (const p of 활.성과점 || []) { const x = 활.바꿈 ? p.N * 1000 : p.E * 1000, y = 활.바꿈 ? p.E * 1000 : p.N * 1000; 넣(x, y) }
  return Number.isFinite(x0) ? [x0, y0, x1, y1] : null
}
/**
 * 일꾼 결과 r → 토목 탭 자료(브라우저에 저장 · 화면에 쓰는 것만)
 * @param 덧 { 이름, 예시, 성과({파일, 점}), 측점성과([...]), 좌표글([..]) }
 */
export function 토목자료(r, 덧 = {}) {
  const 활0 = r.활용 || {}
  const 정 = 노선정리(활0)
  const 두벌 = 횡단두벌빼기(활0.횡단)          // 🛣 G397 같은 횡단면도 두 벌(다른 도면에도 똑같이) → 한 벌
  const 활 = 끊음펴기들({ ...활0, 노선: 정.노선, 횡단: 두벌.횡단 })      // 🏭 G445 일반도 평면에서 끊어 그린 관로 뒤 조각 → 치수 값만큼 띄움(평면 · 3D 같은 자리)
  for (const x of 두벌.뺀) 정.겹.push({ 이름: x.노선 || x.파일, 남김: x.노선 || x.파일, 까닭: `같은 횡단면도 두 벌(단면 ${x.단면}개 — 다른 도면에도 똑같이) — 한 번만 셈` })
  for (const x of 두벌.다른판 || []) 정.겹.push({ 이름: x.노선, 남김: x.노선, 까닭: `횡단 두 판 — 모음 도면(${x.파일})의 옛 사본 단면 ${x.단면}개는 빼고 «${x.남김}» 것으로 셈` })
  const 틀 = 현장틀(활) || [0, 0, 0, 0]
  const 원점 = [Math.round((틀[0] + 틀[2]) / 2), Math.round((틀[1] + 틀[3]) / 2)]
  const 글들 = [...(덧.좌표글 || []), ...(r.파일 || []), ...(r.그룹 || []).map((g) => g.제목)]
  const 바파 = []
  return {
    판: 1, 때: Date.now(), 이름: 덧.이름 || '', 예시: !!덧.예시,
    파일: r.파일 || [], 못읽은: r.못읽은 || [], center: r.center || [0, 0, 0],
    활용: 활, 겹노선: 정.겹, 그룹: (r.그룹 || []).map((g) => ({ 번: g.번, 종류: g.종류, 파일: g.파일, 제목: g.제목, 켬: g.켬, 기준: g.기준, 자리: g.자리 ? { how: g.자리.how, n: g.자리.n, 회전: g.자리.회전, 까닭: g.자리.까닭, 먼곳: g.자리.먼곳 } : null })),
    필요: r.필요 || null, 틀, 원점, 바탕: 바탕선(r, 원점, 300000, 바파), 바탕파일: Uint16Array.from(바파),
    성과: 덧.성과 ? { 파일: 덧.성과.파일, n: 덧.성과.점.length } : null,
    측점성과: 덧.측점성과 || [],
    좌표계: 좌표계짐작(!!활.실좌표, 글들),
  }
}

/* ── 🏢 G397 골조와 함께 ───────────────────────────── */
/**
 * 작업 화면 골조(M · 모델셈 덩어리) → BIM 같은건물찾기 꼴 { 부재: [{층, 판}], 통심: [{글, 끝}], 층: [{이름, 바닥}] }
 * @param 층z lib/골조모델.js 층높이(M) 결과 {표: Map(층 이름 → {z0})} 또는 그 Map
 */
export function 골조모양(M, 덩어리, 층z = null) {
  const 부재 = (덩어리 || []).filter((d) => d.판 && d.판.length >= 3).map((d) => ({ 층: String(d.층), 판: d.판 }))
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (const o of 부재) for (const [x, y] of o.판) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y }
  const 통 = (M && M.통심) || { x: [], y: [] }
  const 통심 = Number.isFinite(x0) ? [
    ...(통.x || []).map((q) => ({ 글: q.이름, 끝: [q.자리, y0 - 1000, q.자리, y1 + 1000] })),
    ...(통.y || []).map((q) => ({ 글: q.이름, 끝: [x0 - 1000, q.자리, x1 + 1000, q.자리] })),
  ] : []
  const 표 = 층z && 층z.표 instanceof Map ? 층z.표 : 층z instanceof Map ? 층z : null     // 골조모델 층높이(M) → {표: Map} · Map 도 받음
  const 층 = ((M && M.층) || []).map((f) => ({ 이름: String(f.이름), 바닥: 표 && 표.get(f.이름) ? 표.get(f.이름).z0 : 0 }))
  return { 부재, 통심, 층, 틀: Number.isFinite(x0) ? [x0, y0, x1, y1] : null }
}
/**
 * 골조를 토목 3D(토목모델 «원점 기준» mm)에 놓을 자리 — BIM 물량 화면(pages/Bim.jsx 건물옮김)과 같은 규칙
 *   ① 같은 건물(통심 · 발자국 — 건물겹치기.js 같은건물찾기): 그 돌림 · 옮김 · 그 층 바닥 높이 (그 건물 평면 덩어리는 참고로 — 두 번 안 셈)
 *   ② 토목 덩어리가 있으면 토목 오른쪽 20 m · 땅 높이(자리 못 찾음)
 *   ③ 토목이 없으면 골조 그대로
 * @returns null | { θ, tx, ty, dz, 방법: 통심|발자국|옆|그대로, 번(같은 건물 번호), 글 }   골조 점 p → R(θ)·p + (tx, ty) · 높이 + dz
 */
export function 골조자리(골, 토) {
  if (!골 || !골.부재.length || !골.틀) return null
  const 덩 = 토 ? (토.부재 || []).filter((o) => o.종류 !== '지형') : []
  if (토 && (토.건물들 || []).length && 골.부재.length >= 20) {
    let r = null
    try { r = 같은건물찾기(골, 토.건물들) } catch (e) { r = null }
    if (r && r.같음) return { θ: r.θ, tx: r.tx, ty: r.ty, dz: r.dz || 0, 방법: r.방법 === '통심' ? '통심' : '발자국', 번: r.번, 글: `같은 건물(${r.방법 === '통심' ? '통심 ' + ((r.통심 && r.통심.줄수) || '') + '줄' : '발자국 겹침 ' + Math.round((r.몫 || 0) * 100) + ' %'}) — «${토.건물들[r.번].이름}» 자리에` }
  }
  if (토 && 토.틀 && (덩.length || (토.부재 || []).length)) {
    const 땅 = Number.isFinite(토.땅높이) ? 토.땅높이 : 0
    return { θ: 0, tx: Math.round(토.틀[3] + 20000 - 골.틀[0]), ty: Math.round(토.틀[1] - 골.틀[1]), dz: Math.round(땅), 방법: '옆', 글: '같은 건물 자리를 못 찾아 토목 오른쪽 20 m · 땅 높이에 세움(건축 평면 · 배치도를 같이 넣으면 제자리)' }
  }
  return { θ: 0, tx: 0, ty: 0, dz: 0, 방법: '그대로', 글: '토목 덩어리가 없어 골조만 그대로' }
}
/** 골조 판 옮기기 — R(θ)·p + (tx, ty) */
export function 판옮기기(판, 자) {
  if (!자 || (!자.θ && !자.tx && !자.ty)) return 판
  const c = Math.cos(자.θ || 0), s = Math.sin(자.θ || 0)
  return 판.map(([x, y]) => [c * x - s * y + 자.tx, s * x + c * y + 자.ty])
}
/**
 * 골조 덩어리(모델셈 S.덩어리) → 토목 3D 자리 부재 [{id, 판, z0, z1, 면?, 선?, 색, 종류, 층, 이름, 부피}]
 *   판 · 계단 면 · 선을 R(θ)·p + (tx, ty) · 높이 + dz 로 옮김 · 보 · 기둥 · 벽 윗면은 그림에서만 3 mm 낮춤(건축 탭 3D 와 같음 — 물량은 그대로)
 */
export function 골조덩어리옮기기(덩어리, 자, 첫번 = 3000000) {
  if (!자) return []
  const c = Math.cos(자.θ || 0), s = Math.sin(자.θ || 0), dz = 자.dz || 0
  const 점 = (a) => {
    if (!a) return a
    const b = new Array(a.length)
    for (let i = 0; i + 2 < a.length; i += 3) { const x = a[i], y = a[i + 1]; b[i] = c * x - s * y + 자.tx; b[i + 1] = s * x + c * y + 자.ty; b[i + 2] = a[i + 2] + dz }
    return b
  }
  return (덩어리 || []).filter((d) => d.판 && d.판.length >= 3).map((d, i) => ({
    id: 첫번 + i, 판: 판옮기기(d.판, 자), z0: d.z0 + dz,
    z1: (d.종류 === '슬라브' || d.종류 === '기초' || d.종류 === '계단' ? d.z1 : d.z1 - 3) + dz,
    ...(d.면 ? { 면: 점(d.면), 선: 점(d.선) } : {}),
    색: d.색, 종류: d.종류, 층: d.층, 부피: d.부피,
    이름: `${d.층 === 'FT' ? '기초' : d.층 + '층'} ${d.종류} ${d.부호 || ''}`.trim(),
  }))
}
/**
 * 📐 함께 합 — 골조(모델셈 합) + 토목(노선 · 구조물 · 토공) + 건물 평면(개략 · 골조 없는 건물)
 * @param 골합 모델셈 S.합 {콘크리트, 거푸집, 철근, 버림} | null · 토 토목모델 결과 | null · 뺄건물번 같은 건물(참고)
 */
export function 함께합(골합, 토, 뺄건물번 = -1) {
  const 골 = 골합 ? { 콘크리트: 골합.콘크리트 || 0, 거푸집: 골합.거푸집 || 0, 철근: (골합.철근 || 0) / 1000, 버림: 골합.버림 || 0 } : null
  const 토목 = 토 ? { 콘크리트: (토.합 && 토.합.콘크리트) || 0, 거푸집: (토.합 && 토.합.거푸집) || 0, 터파기: (토.합 && 토.합.터파기) || 0, 되메우기: (토.합 && 토.합.되메우기) || 0, 성토: (토.합 && 토.합.성토) || 0 } : null
  const 건 = 토 ? (토.건물들 || []).filter((b, i) => i !== 뺄건물번).reduce((a, b) => ({ 콘크리트: a.콘크리트 + ((b.합 && b.합.콘크리트) || 0), 거푸집: a.거푸집 + ((b.합 && b.합.거푸집) || 0), 수: a.수 + 1 }), { 콘크리트: 0, 거푸집: 0, 수: 0 }) : { 콘크리트: 0, 거푸집: 0, 수: 0 }
  const 합 = { 콘크리트: (골 ? 골.콘크리트 : 0) + (토목 ? 토목.콘크리트 : 0) + 건.콘크리트, 거푸집: (골 ? 골.거푸집 : 0) + (토목 ? 토목.거푸집 : 0) + 건.거푸집, 철근: 골 ? 골.철근 : 0 }
  return { 골조: 골, 토목, 건물: 건.수 ? 건 : null, 합 }
}

/**
 * 📐 G399 배근도 «철근 재료표» → 파일마다 철근 톤(도면자동.js 표찾기 · 철근모으기 — /jeoksan/auto 와 같은 셈)
 *   «1m당» 표(표준도 — 연장을 곱해야 하는 단위 수량)는 합에 안 넣고 수만 셈(현장 S 모음 도면 «철근재료표(1m당)»)
 * @returns [{파일, t, 직경:[{d, t}], 표, 미터당, 검산:[글]}]
 */
export const 미터당표 = (t) => /(1\s*m|미터|M)\s*당/i.test(String(t.제목 || '') + ' ' + (t.머리 || []).join(' '))
export async function 재료표철근(들) {
  const 자 = await import('./도면자동.js')
  const 결과 = []
  const 미터당 = 미터당표
  for (const d of 들 || []) {
    if (!d || !d.모델) continue
    let 표 = []
    try { 표 = 자.표찾기(d.모델) } catch (e) { continue }
    const 철 = 표.filter((t) => t.종류 === '철근')
    if (!철.length) continue
    const 쓸 = 철.filter((t) => !미터당(t))
    const r = 쓸.length ? 자.철근모으기(쓸) : { 합: [], 검산: [] }
    const kg = r.합.reduce((a, x) => a + x.kg, 0)
    결과.push({ 파일: d.이름, t: kg / 1000, 직경: r.합.map((x) => ({ d: x.d, t: x.kg / 1000 })), 표: 쓸.length, 미터당: 철.length - 쓸.length, 검산: (r.검산 || []).slice(0, 5) })
  }
  return 결과
}
