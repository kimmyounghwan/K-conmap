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

/* ══════════════════════════════════════════════════════════════
   🗺 G144 (2026-10-05) 바로투찰 맨 위로 · 개설일 · 시·도별 누적 · 오늘 · 지금 전국
   소장님: 「실시간 지도를 바로입찰 상단에 … 지역별 누적도」 「개설일 8월 30일, 누적은 9월 15일 부터」
           「애널리틱스 처럼 누적으로 서울 몇명, 부산 몇명, 실시간으로 올라가게」 「오늘도 카운트 할까?」
   ■ fresh/reg (tools/이용자지도.py 가 10분마다): {at, from, d, kr: {a 누적, t 오늘}, r: {지역(영어): {a, t}}}
     지역 = 애널리틱스 region 영어 이름(Seoul · Gyeonggi-do · Jeollanam-do …) → 시·도 줄임 이름(서울 · 경기 · 전남 …)
   ■ fresh/map.n — 지금(30분 안) 전국 사람 수
   ══════════════════════════════════════════════════════════════ */
export const 지역주소 = 'https://k-conmap-default-rtdb.firebaseio.com/fresh/reg.json'
export const 개설일 = '2026-08-30'          // 지금 K-건설맵(새 사이트)이 문을 연 날 — k-conmap.com 연결
export const 누적시작 = '2026-09-15'        // 애널리틱스로 세기 시작한 날(tools/이용자지도.py 조회시작 과 같음)

/* 영어 → 시·도 (앞부분으로 맞춤 · «Gangwon State» «Jeonbuk State» 같은 새 이름도) */
const 시도영어 = [['seoul', '서울'], ['busan', '부산'], ['incheon', '인천'], ['daegu', '대구'], ['daejeon', '대전'], ['gwangju', '광주'],
  ['ulsan', '울산'], ['sejong', '세종'], ['gyeonggi', '경기'], ['gangwon', '강원'], ['chungcheongbuk', '충북'], ['northchungcheong', '충북'],
  ['chungbuk', '충북'], ['chungcheongnam', '충남'], ['southchungcheong', '충남'], ['chungnam', '충남'], ['jeollabuk', '전북'], ['northjeolla', '전북'],
  ['jeonbuk', '전북'], ['jeollanam', '전남'], ['southjeolla', '전남'], ['jeonnam', '전남'], ['gyeongsangbuk', '경북'], ['northgyeongsang', '경북'],
  ['gyeongbuk', '경북'], ['gyeongsangnam', '경남'], ['southgyeongsang', '경남'], ['gyeongnam', '경남'], ['jeju', '제주']]
const 시도한글 = [['서울', '서울'], ['부산', '부산'], ['인천', '인천'], ['대구', '대구'], ['대전', '대전'], ['광주', '광주'], ['울산', '울산'], ['세종', '세종'],
  ['경기', '경기'], ['강원', '강원'], ['충청북', '충북'], ['충북', '충북'], ['충청남', '충남'], ['충남', '충남'], ['전라북', '전북'], ['전북', '전북'],
  ['전라남', '전남'], ['전남', '전남'], ['경상북', '경북'], ['경북', '경북'], ['경상남', '경남'], ['경남', '경남'], ['제주', '제주']]

/** 애널리틱스 지역 이름 → 시·도 줄임 이름 · 모르면 null */
export function 시도찾기(이름) {
  const 글 = String(이름 || '').trim()
  if (/[가-힣]/.test(글)) { for (const [p, n] of 시도한글) if (글.startsWith(p)) return n; return null }
  const s = 글.toLowerCase().replace(/[^a-z]/g, '')
  if (!s) return null
  for (const [p, n] of 시도영어) if (s.startsWith(p)) return n
  return null
}

/** fresh/reg → { 줄: [{n 시도, a 누적, t 오늘}] (누적 많은 차례 · 모르는 곳은 «기타» 맨 끝), 전국: {a, t}, 오늘날: bool, at }
 *  오늘(t)은 자료의 날짜(d)가 한국 오늘일 때만 — 자정 지나 아직 새로 안 받았으면 0 */
export function 지역줄들(자료, 지금시각 = Date.now()) {
  if (!자료 || !자료.r) return null
  const 오늘날 = 자료.d === 한국날(지금시각)
  const 묶음 = new Map()
  for (const [이름, v] of Object.entries(자료.r)) {
    const n = 시도찾기(이름) || '기타'
    const g = 묶음.get(n) || { n, a: 0, t: 0 }
    g.a += Number(v && v.a) || 0
    g.t += 오늘날 ? (Number(v && v.t) || 0) : 0
    묶음.set(n, g)
  }
  const 줄 = [...묶음.values()].filter((x) => x.a > 0 || x.t > 0)
    .sort((x, y) => (x.n === '기타') - (y.n === '기타') || y.a - x.a || y.t - x.t || x.n.localeCompare(y.n, 'ko'))
  const kr = 자료.kr || {}
  return { 줄, 전국: { a: Number(kr.a) || 0, t: 오늘날 ? (Number(kr.t) || 0) : 0 }, 오늘날, at: 자료.at }
}

/** 개설일부터 오늘(한국)까지 며칠째 — 연 날이 1일째 */
export function 날째(지금시각 = Date.now()) {
  const 오늘 = Date.parse(한국날(지금시각) + 'T00:00:00Z')
  const 연날 = Date.parse(개설일 + 'T00:00:00Z')
  return Math.floor((오늘 - 연날) / 86400000) + 1
}

/** '2026-08-30' → '2026. 8. 30.' */
export const 날글 = (s) => { const [y, m, d] = String(s).split('-').map(Number); return `${y}. ${m}. ${d}.` }
