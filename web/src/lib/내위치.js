/**
 * 📍 내 위치 좌표 — 폰 GPS(위도 · 경도) → 측량 좌표 X(북) · Y(동) (G644 · 2026-11-10)
 *
 * 소장님: 「핸드폰으로 gps 좌표 xy 나오게 할 수 있어?」 · 「다운 받는거 없이 건설맵 들어가서 가능해?」 · 「응 만들어 보자. 오차는 설명해 주고..」
 *
 * ■ 좌표계 — 공간정보의 구축 및 관리 등에 관한 법률 시행령 제7조 · [별표 2] 직각좌표의 기준(법제처 3번 확인 · tools/시험_내위치.mjs)
 *   서부 125° · 중부 127° · 동부 129° · 동해 131°(모두 북위 38°) · 가산 X(N) 600,000 m · Y(E) 200,000 m · 원점축척계수 1.0000 · TM
 *   적용 구역 — 서부 동경 124° ~ 126° · 중부 126° ~ 128° · 동부 128° ~ 130° · 동해 130° ~ 132°
 *   타원체 GRS80(긴반지름 6,378,137 m · 편평률 1/298.257222101 — 시행령 제7조 ①). 폰 GPS(WGS84)와는 몇 cm 차이라 그대로 씀.
 * ■ 셈은 lib/활용3d.js 경위도TM(같은 식 · 도면 3D 보기 사진 위치와 같음) · 거꾸로(TM → 위도 · 경도)는 여기 TM경위도.
 * ■ 폰이 알려 주는 오차(accuracy)는 «이 반경 안일 확률 68%»(W3C Geolocation — 1 표준편차). 3번에 1번은 더 틀릴 수 있음.
 * ■ 위치는 이 기기 안에서만 셈 — 서버 · 통계로 안 보냄(세기는 «눌렀다» 만).
 */
import { TM원점, 경위도TM } from './활용3d.js'

/** 원점 넷([별표 2]) — 이름 · 경도 원점 · 적용 구역 */
export const 원점들 = [
  { 키: '서부', 이름: '서부원점', 경도: 125, 구역: [124, 126], 원: TM원점[0] },
  { 키: '중부', 이름: '중부원점', 경도: 127, 구역: [126, 128], 원: TM원점[1] },
  { 키: '동부', 이름: '동부원점', 경도: 129, 구역: [128, 130], 원: TM원점[2] },
  { 키: '동해', 이름: '동해원점', 경도: 131, 구역: [130, 132], 원: TM원점[3] },
]
/** 경도 → 적용 구역의 원점(경계 126 · 128 · 130 은 동쪽 원점 — 중부 · 동부 · 동해) · 밖이면 가까운 원점 + 밖 표시 */
export function 원점찾기(경도) {
  const i = Math.max(0, Math.min(3, Math.floor((경도 - 124) / 2)))
  return { ...원점들[i], 밖: !(경도 >= 124 && 경도 <= 132) }
}
export const 원점키 = (키) => 원점들.find((o) => o.키 === 키) || 원점들[1]

/** 위도 · 경도 → { X(북), Y(동) } m */
export function 좌표(위도, 경도, 원점 = 원점찾기(경도)) {
  return 경위도TM(위도, 경도, 원점.원)
}

/** TM { X(북), Y(동) } → 위도 · 경도(GRS80 · 원점 위도 38° · 축척 1) — 찾아가기 · 지도 보기 */
export function TM경위도(X, Y, 원점 = 원점들[1]) {
  const o = 원점.원
  const a = 6378137, f = 1 / 298.257222101, e2 = 2 * f - f * f, ep2 = e2 / (1 - e2), k0 = 1
  const r = Math.PI / 180, φ0 = 38 * r, λ0 = o.lon0 * r
  const M = (p) => a * ((1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * e2 ** 3 / 256) * p - (3 * e2 / 8 + 3 * e2 * e2 / 32 + 45 * e2 ** 3 / 1024) * Math.sin(2 * p)
    + (15 * e2 * e2 / 256 + 45 * e2 ** 3 / 1024) * Math.sin(4 * p) - (35 * e2 ** 3 / 3072) * Math.sin(6 * p))
  const M1 = M(φ0) + (X - o.FN) / k0
  const μ = M1 / (a * (1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * e2 ** 3 / 256))
  const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2))
  const φ1 = μ + (3 * e1 / 2 - 27 * e1 ** 3 / 32) * Math.sin(2 * μ) + (21 * e1 * e1 / 16 - 55 * e1 ** 4 / 32) * Math.sin(4 * μ)
    + (151 * e1 ** 3 / 96) * Math.sin(6 * μ) + (1097 * e1 ** 4 / 512) * Math.sin(8 * μ)
  const s1 = Math.sin(φ1), c1 = Math.cos(φ1), t1 = Math.tan(φ1)
  const N1 = a / Math.sqrt(1 - e2 * s1 * s1), R1 = a * (1 - e2) / (1 - e2 * s1 * s1) ** 1.5
  const T1 = t1 * t1, C1 = ep2 * c1 * c1, D = (Y - o.FE) / (N1 * k0)
  const φ = φ1 - (N1 * t1 / R1) * (D * D / 2 - (5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * ep2) * D ** 4 / 24
    + (61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * ep2 - 3 * C1 * C1) * D ** 6 / 720)
  const λ = λ0 + (D - (1 + 2 * T1 + C1) * D ** 3 / 6 + (5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * ep2 + 24 * T1 * T1) * D ** 5 / 120) / c1
  return { 위도: φ / r, 경도: λ / r }
}

/** 도 → «37° 33′ 59.40″» */
export function 도분초(도, 소수 = 2) {
  if (!Number.isFinite(도)) return '—'
  const 부호 = 도 < 0 ? '-' : ''
  let d = Math.abs(도)
  let 도수 = Math.floor(d)
  let 분 = Math.floor((d - 도수) * 60)
  let 초 = ((d - 도수) * 60 - 분) * 60
  const 끝 = 10 ** 소수
  초 = Math.round(초 * 끝) / 끝
  if (초 >= 60) { 초 -= 60; 분 += 1 }
  if (분 >= 60) { 분 -= 60; 도수 += 1 }
  return `${부호}${도수}° ${String(분).padStart(2, '0')}′ ${초.toFixed(소수).padStart(소수 + 3, '0')}″`
}

/** 오차(m) → 등급 — 좋음(≤ 5) · 보통(≤ 15) · 나쁨 */
export function 오차등급(m) {
  if (!Number.isFinite(m)) return { 키: '모름', 글: '모름' }
  if (m <= 5) return { 키: '좋음', 글: '좋음' }
  if (m <= 15) return { 키: '보통', 글: '보통' }
  return { 키: '나쁨', 글: '나쁨 — 하늘이 트인 곳에서 잠시 기다려 보세요' }
}

/**
 * 표본들 평균 — 오차 반경 제곱의 거꾸로를 무게로(작은 오차 표본을 더 믿음) · 오차가 한도보다 큰 것은 뺌
 * @param {{X:number, Y:number, 위도:number, 경도:number, 오차:number}[]} 표본
 * @returns {null | {X, Y, 위도, 경도, 수, 뺀, 흩어짐, 가장작은오차, 중앙오차}}   흩어짐 = 평균에서 떨어진 거리의 제곱평균제곱근(m) ·
 *   중앙오차 = 쓴 값들의 오차 가운데값(평균한 점의 «오차» 칸 — 흩어짐은 치우침을 못 보므로 작게 적지 않음)
 */
export function 평균(표본, 한도 = 50) {
  const 쓸 = 표본.filter((s) => Number.isFinite(s.X) && Number.isFinite(s.Y) && Number.isFinite(s.오차) && s.오차 > 0 && s.오차 <= 한도)
  if (!쓸.length) return null
  let w = 0, X = 0, Y = 0, 위 = 0, 경 = 0
  for (const s of 쓸) { const k = 1 / (s.오차 * s.오차); w += k; X += k * s.X; Y += k * s.Y; 위 += k * s.위도; 경 += k * s.경도 }
  X /= w; Y /= w; 위 /= w; 경 /= w
  const 흩어짐 = Math.sqrt(쓸.reduce((t, s) => t + (s.X - X) ** 2 + (s.Y - Y) ** 2, 0) / 쓸.length)
  const 오차들 = 쓸.map((s) => s.오차).sort((x, y) => x - y)
  const 중앙오차 = 오차들.length % 2 ? 오차들[(오차들.length - 1) / 2] : (오차들[오차들.length / 2 - 1] + 오차들[오차들.length / 2]) / 2
  return { X, Y, 위도: 위, 경도: 경, 수: 쓸.length, 뺀: 표본.length - 쓸.length, 흩어짐, 가장작은오차: 오차들[0], 중앙오차 }
}

/** 두 점(TM) → 거리(m) · 방위각(북 0° · 시계 방향) · 북 · 동 차이 */
export function 거리방향(A, B) {
  const dX = B.X - A.X, dY = B.Y - A.Y
  const 거리 = Math.hypot(dX, dY)
  let 방위 = Math.atan2(dY, dX) * 180 / Math.PI
  if (방위 < 0) 방위 += 360
  return { 거리, 방위, dX, dY }
}
const 여덟 = ['북', '북동', '동', '남동', '남', '남서', '서', '북서']
export const 방위글 = (도) => (Number.isFinite(도) ? 여덟[Math.round(도 / 45) % 8] : '—')

/** 숫자 칸 — 소수 자리 고정(쉼표 없음 · 복사 · 엑셀에 그대로) */
export const 수 = (n, d = 2) => (Number.isFinite(n) ? Number(n).toFixed(d) : '')

/** 저장한 점들 → 표(머리 + 줄) — 복사(TSV) · 엑셀 같은 칸 */
export const 표머리 = ['이름', 'X(북) m', 'Y(동) m', '원점', '위도', '경도', '오차 ±m', '높이 m', '평균', '잰 때', '메모']
export function 표줄(p) {
  return [p.이름 || '', 수(p.X), 수(p.Y), p.원점 || '', 수(p.위도, 7), 수(p.경도, 7), 수(p.오차, 1), Number.isFinite(p.높이) ? 수(p.높이, 1) : '',
    p.평균 ? `${p.평균}개 평균` : '', p.때 || '', p.메모 || '']
}
/** TSV(탭) — 엑셀 · 한글 표에 바로 붙여 넣기 */
export function 점TSV(점들) {
  const 칸 = (s) => String(s).replace(/[\t\r\n]+/g, ' ')
  return [표머리, ...점들.map(표줄)].map((r) => r.map(칸).join('\t')).join('\n')
}
/** 한 점 한 줄 복사 글 — «X 543210.12  Y 210987.65 (중부원점)» */
export const 한줄 = (p) => `X ${수(p.X)}  Y ${수(p.Y)} (${p.원점 || '중부원점'})`

/** 시각 → «11. 10. 23:05:12» */
export function 때글(ms) {
  const d = new Date(ms)
  const 두 = (n) => String(n).padStart(2, '0')
  return `${d.getMonth() + 1}. ${d.getDate()}. ${두(d.getHours())}:${두(d.getMinutes())}:${두(d.getSeconds())}`
}

/** 카카오맵 지도 바로가기(apis.map.kakao.com «지도 바로가기» — /link/map/이름,위도,경도) */
export const 지도주소 = (이름, 위도, 경도) => `https://map.kakao.com/link/map/${encodeURIComponent(String(이름 || '내 위치').replace(/,/g, ' '))},${수(위도, 7)},${수(경도, 7)}`

/** 저장 열쇠(이 기기 localStorage) */
export const 열쇠 = 'kcm.내위치.점'
