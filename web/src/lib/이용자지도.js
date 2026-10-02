/* ══════════════════════════════════════════════════════════════
   이용자지도.js — 애널리틱스 도시 이름 → 지도 자리 (2026-10-02 · G114)

   소장님: 「건설맵 이용자 지도 만들 수 있어? 실시간으로」 → 사랑방 맨 위 · 숫자 없이 점만
   ■ fresh/map (tools/이용자지도.py 가 10분마다): {at, now: {도시: 1~3}, day: {d, c: {도시: 1}}}
     도시 = 애널리틱스 영어 이름 그대로(Anyang-si · Gwangju · Seoul …)
   ■ 자리: web/src/data/한국지도.json 곳[] = {k, n 한글, d 시도, e 영어 줄기, x, y} (tools/지도만들기.py)
   ■ 맞추기: 소문자 · 영문자만 남김 → 그대로 찾고(gwangjusi = 경기 광주) → 없으면 끝의 -si · -gun · -gu ·
     city · county 를 떼고 다시. 못 찾은 이름은 점을 찍지 않습니다(외국 · 모르는 이름).
   ══════════════════════════════════════════════════════════════ */
export const 지도주소 = 'https://k-conmap-default-rtdb.firebaseio.com/fresh/map.json'
export const 지금유효분 = 45      // 지금 점은 마지막으로 받은 지 45분 안일 때만 (밤에 사슬이 늦으면 «오늘» 만)

const 꼬리 = ['metropolitancity', 'specialselfgoverningcity', 'specialcity', 'county', 'city', 'gun', 'si', 'gu']

export function 지도이름표(곳, 별 = {}) {
  const m = new Map()
  for (const p of 곳 || []) if (p.e && !m.has(p.e)) m.set(p.e, p)
  for (const [a, e] of Object.entries(별 || {})) if (!m.has(a) && m.has(e)) m.set(a, m.get(e))   // 구 · 동네 별명 → 그 도시
  return m
}

export function 지도자리찾기(표, 이름) {
  const s = String(이름 || '').toLowerCase().replace(/[^a-z]/g, '')
  if (!s) return null
  if (표.has(s)) return 표.get(s)
  for (const t of 꼬리) {
    if (s.length > t.length + 2 && s.endsWith(t)) {
      const r = s.slice(0, -t.length)
      if (표.has(r)) return 표.get(r)
    }
  }
  return null
}

/** 점 크기(지도 단위) — 소장님 「파란색 점도 더 크게 … 애널리틱스처럼」(2026-10-02)
 *  점은 «화면 픽셀» 로 정합니다: 지금 9 · 12 · 15px, 오늘 5px, 고리는 지금 점 + 5px.
 *  배율 = 지도 폭/600 을 0.75(폰) ~ 1.15(PC) 안에 — 폰에서 수도권 점이 너무 겹치지 않게.
 *  화면 = {w, h}(그려진 px, viewBox 는 비율을 지키며 가운데 맞춤) · 아직 못 쟀으면 480px 로 봄 */
export function 지도점크기(vw, vh, 화면) {
  const pw = 화면 && 화면.w > 0 ? 화면.w : 480
  const ph = 화면 && 화면.h > 0 ? 화면.h : 480 * vh / vw
  const 픽셀당 = Math.min(pw / vw, ph / vh)             // 지도 1단위 = 몇 px
  const 그림폭 = vw * 픽셀당
  const 배율 = Math.max(0.75, Math.min(1.15, 그림폭 / 600))
  const 단위 = (px) => (px * 배율) / 픽셀당
  return {
    지금: (n) => 단위(6 + 3 * Math.max(1, Math.min(3, n))),
    오늘: 단위(5),
    고리: 단위(5),
    배율,
  }
}

const 한국날 = (t) => new Date(t + 9 * 3600000).toISOString().slice(0, 10)

/** fresh/map → 찍을 점 [{p 자리, 지금 0~3, 오늘 bool}] · 지금시각(ms) */
export function 지도점들(자료, 표, 지금시각 = Date.now()) {
  const 점 = new Map()
  if (!자료) return []
  const 새것 = typeof 자료.at === 'number' && 지금시각 - 자료.at < 지금유효분 * 60000
  const 오늘 = 자료.day && 자료.day.d === 한국날(지금시각) ? (자료.day.c || {}) : {}
  for (const 이름 of Object.keys(오늘)) {
    const p = 지도자리찾기(표, 이름)
    if (p) 점.set(p.k, { p, 지금: 0, 오늘: true })
  }
  if (새것) {
    for (const [이름, 크기] of Object.entries(자료.now || {})) {
      const p = 지도자리찾기(표, 이름)
      if (!p) continue
      const 옛 = 점.get(p.k)
      const n = Math.max(1, Math.min(3, Number(크기) || 1))
      점.set(p.k, { p, 지금: Math.max(n, 옛 ? 옛.지금 : 0), 오늘: true })
    }
  }
  return [...점.values()].sort((a, b) => a.지금 - b.지금)      // 지금 점이 위에 그려지게
}
