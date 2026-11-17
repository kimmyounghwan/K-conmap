/**
 * 🗺 G756 공사 현황판 — 순수 셈(화면 · 시험이 같이 씀) (2026-11-17)
 *   소장님 「건설맵 공사 현황판 만들어 줘」 · 「아이디어 추가 해서 최대한 이용자 입장에서 편하게」 · 「맵톡 지도를 활용하면 어때???」
 *   자료: /data/now/sum.json · /data/now/{시도}.json (현황판.py — build_json 이 회차마다 굽음)
 *   줄 = [no, k, s, 공사명, 기관, 금액, 마감, 개찰, 1순위, 투찰률, 참가, 면허코드들, 면허이름, 현장, 공고일, 기초금액]
 */

export const 단계표 = [
  { s: 0, 이름: '입찰 중', 짧게: '입찰', 색: '#2563eb', 뜻: '마감 전 — 지금 투찰할 수 있는 공고' },
  { s: 1, 이름: '개찰 대기', 짧게: '대기', 색: '#d97706', 뜻: '마감이 지나 개찰 결과를 기다리는 공고' },
  { s: 2, 이름: '곧 착공', 짧게: '착공', 색: '#16a34a', 뜻: '1순위가 나온 공사(개찰 30일 안) — 곧 현장이 열림' },
]
export const 시도목록 = ['서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종', '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주']

export const 금액칸들 = [
  { k: '', 이름: '금액 전체' },
  { k: 's', 이름: '1억 아래', lo: 0, hi: 1e8 },
  { k: 'm', 이름: '1 ~ 10억', lo: 1e8, hi: 1e9 },
  { k: 'l', 이름: '10억 넘게', lo: 1e9, hi: Infinity },
]

/* 🗺 전국 지도의 시 · 도 핀 자리(한국지도.json vb 603×570 단위) — 161 시 · 군 핀을 전국에 다 찍으면 겹쳐 못 읽어서
   전국은 시 · 도 17 핀 · 시 · 도를 누르면 그 안 시 · 군 핀. 자리: 광역 = 그 곳 점 · 도 = 시 · 군 점 평균(경기 · 충남 · 전남은 광역과 안 겹치게 손 앵커)
   → 겹침 밀어내기(폰 크기 기준 반지름 도 31 · 광역 24) — 바탕 지도를 바꾸면 다시 셈. 시험: tools/시험_현황판.mjs «시도자리» */
export const 시도자리 = {
  서울: [198.2, 113.9], 부산: [366.6, 355.4], 대구: [328.8, 279.8], 인천: [150.9, 97.4], 광주: [187.4, 348.5], 대전: [238.3, 245.4],
  울산: [385.7, 309.1], 세종: [217.8, 199.9], 경기: [252.5, 131.0], 강원: [312.0, 95.3], 충북: [274.5, 196.1], 충남: [170.3, 231.1],
  전북: [211.6, 296.8], 전남: [197.2, 404.6], 경북: [351.4, 227.6], 경남: [307.1, 343.8], 제주: [166.3, 531.6],
}
export const 광역들 = new Set(['서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종'])
/** 시 · 도 핀 반지름(지도 단위) — 많을수록 조금 큼 · 가장 커도 자리 셈의 반지름(도 31 · 광역 24)이라 안 겹침 */
export function 시도핀반지름(d, n, 최대) {
  const R = 광역들.has(d) ? 24 : 31
  const f = 최대 > 0 ? 0.8 + 0.2 * Math.sqrt(Math.max(0, n) / 최대) : 0.8
  return Math.round(R * Math.min(1, f) * 10) / 10
}
/** 시 · 도 핀들 — 전국 지도(고른 단계로 센 수 · 0 은 뺌) */
export function 시도핀들(합, 단계) {
  const out = []
  for (const d of 시도목록) {
    const a = (합 && 합.시도 && 합.시도[d]) || [0, 0, 0, 0]
    let n = 0
    for (let s = 0; s < 3; s++) if (!단계 || !단계.size || 단계.has(s)) n += Number(a[s]) || 0
    if (n > 0 && 시도자리[d]) out.push({ d, n, s: 큰단계(a, 단계), x: 시도자리[d][0], y: 시도자리[d][1] })
  }
  const 최대 = Math.max(0, ...out.map((p) => p.n))
  for (const p of out) p.r = 시도핀반지름(p.d, p.n, 최대)
  return out
}
/** 짧은 수 — 725 · 1.7천 · 1.2만 (좁은 핀 안) */
export function 수짧게(n) {
  const v = Number(n) || 0
  if (v < 1000) return String(v)
  if (v < 10000) return (Math.round(v / 100) / 10).toLocaleString('ko-KR') + '천'
  return (Math.round(v / 1000) / 10).toLocaleString('ko-KR') + '만'
}

/** 줄(배열) → 이름 붙은 꼴 */
export function 줄풀기(x) {
  if (!Array.isArray(x)) return null
  const [no, k, s, 이름, 기관, 금액, 마감, 개찰, 일등, 율, 참가, 면허코드, 면허, 현장, 공고일, 기초] = x
  return {
    no: String(no || ''), k: String(k || ''), s: Number(s) || 0, 이름: String(이름 || ''), 기관: String(기관 || ''),
    금액: Number(금액) || 0, 마감: 마감 || '', 개찰: 개찰 || '', 일등: 일등 || '', 율: 율 == null ? null : Number(율),
    참가: 참가 == null ? null : Number(참가), 면허코드: Array.isArray(면허코드) ? 면허코드.map(String) : [], 면허: 면허 || '',
    현장: 현장 || '', 공고일: 공고일 || '', 기초: 기초 == null ? null : Number(기초),
  }
}

/** 거르기 — o: { 단계: Set(0|1|2) · 금액: '' | s | m | l · 면허: [코드] (빈 배열이면 안 거름) · 찾기: 글 · k: 곳 번호 } */
export function 거르기(줄들, o = {}) {
  const 칸 = 금액칸들.find((x) => x.k === (o.금액 || '')) || 금액칸들[0]
  const q = String(o.찾기 || '').trim().replace(/\s+/g, ' ').toLowerCase()
  const 낱말 = q ? q.split(' ') : []
  const 면허 = Array.isArray(o.면허) && o.면허.length ? new Set(o.면허.map(String)) : null
  return (줄들 || []).filter((r) => {
    if (!r) return false
    if (o.단계 && o.단계.size && !o.단계.has(r.s)) return false
    if (o.k && r.k !== o.k) return false
    if (칸.k && !(r.금액 >= 칸.lo && r.금액 < 칸.hi)) return false
    if (면허 && !r.면허코드.some((c) => 면허.has(c))) return false
    if (낱말.length) {
      const 글 = `${r.이름} ${r.기관} ${r.현장} ${r.일등} ${r.면허}`.toLowerCase()
      if (!낱말.every((w) => 글.includes(w))) return false
    }
    return true
  })
}

/** 곳마다 단계 수 — {k: [n0, n1, n2]} (k 없는 줄은 안 셈) */
export function 곳셈(줄들) {
  const out = {}
  for (const r of 줄들 || []) {
    if (!r || !r.k) continue
    const a = out[r.k] || (out[r.k] = [0, 0, 0])
    a[r.s] = (a[r.s] || 0) + 1
  }
  return out
}

/** sum.json 의 곳 셈을 단계로 거름 → {k: 수} */
export function 곳수(곳, 단계) {
  const out = {}
  for (const [k, a] of Object.entries(곳 || {})) {
    let n = 0
    for (let s = 0; s < 3; s++) if (!단계 || !단계.size || 단계.has(s)) n += Number(a[s]) || 0
    if (n > 0) out[k] = n
  }
  return out
}

/** 핀 지름(px) — 공사 수의 제곱근 · 좁은 화면은 조금 작게 */
export function 핀크기(n, 좁음 = false) {
  const lo = 좁음 ? 22 : 26, hi = 좁음 ? 46 : 58
  return Math.round(Math.max(lo, Math.min(hi, lo + Math.sqrt(Math.max(0, n)) * (좁음 ? 2.4 : 3))))
}

/** 핀 줄이기 — 핀이 지도 넓이의 한도(18%)보다 많이 덮으면 다 같이 줄임(경기 31 시 · 군을 폰에서 볼 때 등) · 가장 작아도 최소 px */
export function 핀줄이기(핀들, W, H, 한도 = 0.18, 최소 = 20) {
  const 넓이 = (핀들 || []).reduce((a, p) => a + (Math.PI * p.d * p.d) / 4, 0)
  if (!(W > 0 && H > 0) || !넓이) return 핀들 || []
  const f = Math.min(1, Math.sqrt((한도 * W * H) / 넓이))
  return f >= 1 ? 핀들 : 핀들.map((p) => ({ ...p, d: Math.max(최소, Math.round(p.d * f)) }))
}

/** 시 · 군 핀 펴기 — 시 · 도를 크게 볼 때 이웃 시 · 군 핀이 겹치면(폰에서 누르기 어려움) 조금씩 밀어 벌림.
 *  핀들: [{k, x, y(0~1 지도 비율), d(지름 px)}] · W · H: 지도 크기(px) → {k: [x, y]}(0~1) · 제자리로 당기는 힘이 있어 멀리 안 감
 *  못 재면(W 0) 그대로. 순서와 상관없이 같은 답(k 차례로 셈) */
export function 핀펴기(핀들, W, H, 번 = 90) {
  const out = {}
  const ps = [...(핀들 || [])].sort((a, b) => (a.k < b.k ? -1 : a.k > b.k ? 1 : 0)).map((p) => ({ ...p, px: p.x * W, py: p.y * H, ax: p.x * W, ay: p.y * H }))
  if (!(W > 0 && H > 0)) { for (const p of ps) out[p.k] = [p.x, p.y]; return out }
  const 밀기 = () => {
    for (let i = 0; i < ps.length; i++) {
      for (let j = i + 1; j < ps.length; j++) {
        const a = ps[i], b = ps[j]
        let dx = b.px - a.px, dy = b.py - a.py
        let dd = Math.hypot(dx, dy)
        const 띄움 = (a.d + b.d) / 2 + 2
        if (dd >= 띄움) continue
        if (dd < 0.01) { dx = (j - i) * 0.7; dy = 0.5; dd = Math.hypot(dx, dy) }
        const m = (띄움 - dd) / 2
        a.px -= (dx / dd) * m; a.py -= (dy / dd) * m
        b.px += (dx / dd) * m; b.py += (dy / dd) * m
      }
    }
  }
  const 가두기 = (p) => { p.px = Math.min(W - p.d / 2, Math.max(p.d / 2, p.px)); p.py = Math.min(H - p.d / 2, Math.max(p.d / 2, p.py)) }
  for (let it = 0; it < 번; it++) {
    밀기()
    for (const p of ps) { p.px += (p.ax - p.px) * 0.04; p.py += (p.ay - p.py) * 0.04; 가두기(p) }
  }
  for (let it = 0; it < 24; it++) { 밀기(); for (const p of ps) 가두기(p) }   // 끝손질 — 당김 없이 남은 겹침만 풂
  for (const p of ps) out[p.k] = [p.px / W, p.py / H]
  return out
}

/** 많은 단계(핀 색) — 같으면 입찰 중 > 개찰 대기 > 곧 착공 */
export function 큰단계(a, 단계) {
  let b = -1, s0 = 0
  for (let s = 0; s < 3; s++) {
    if (단계 && 단계.size && !단계.has(s)) continue
    const n = Number(a && a[s]) || 0
    if (n > b) { b = n; s0 = s }
  }
  return s0
}

/** 시도 윤곽 길(d) → 틀 {x0, y0, x1, y1} (못 읽으면 null) */
export function 길틀(d) {
  const ns = String(d || '').match(/-?\d+(?:\.\d+)?/g)
  if (!ns || ns.length < 4) return null
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (let i = 0; i + 1 < ns.length; i += 2) {
    const x = Number(ns[i]), y = Number(ns[i + 1])
    if (x < x0) x0 = x; if (x > x1) x1 = x
    if (y < y0) y0 = y; if (y > y1) y1 = y
  }
  return isFinite(x0) ? { x0, y0, x1, y1 } : null
}

/** 보는 틀(viewBox) — 시도를 고르면 그 시도에 맞춰 크게(바탕 가로:세로 그대로) · 아니면 전국 */
export function 보는틀(바탕, 시도) {
  const [W, H] = (바탕 && 바탕.vb) || [603, 570]
  if (!시도 || !바탕 || !바탕.판 || !바탕.판[시도]) return { x: 0, y: 0, w: W, h: H }
  const t = 길틀(바탕.판[시도])
  if (!t) return { x: 0, y: 0, w: W, h: H }
  const 여 = Math.max(t.x1 - t.x0, t.y1 - t.y0) * 0.12 + 6
  let x = t.x0 - 여, y = t.y0 - 여, w = t.x1 - t.x0 + 여 * 2, h = t.y1 - t.y0 + 여 * 2
  const A = W / H
  if (w / h > A) { const h2 = w / A; y -= (h2 - h) / 2; h = h2 } else { const w2 = h * A; x -= (w2 - w) / 2; w = w2 }
  return { x, y, w, h }
}

/** 마감까지 — 'D-3' · '오늘 마감' · '마감 지남' (지금: ms) */
export function 디데이(마감, 지금 = Date.now()) {
  const m = String(마감 || '').match(/^(\d{4})-(\d{2})-(\d{2})(?: (\d{2}):(\d{2}))?/)
  if (!m) return ''
  const t = Date.parse(`${m[1]}-${m[2]}-${m[3]}T${m[4] || '23'}:${m[5] || '59'}:00+09:00`)
  if (!isFinite(t)) return ''
  if (t < 지금) return '마감 지남'
  const 오늘 = new Date(지금 + 9 * 3600e3).toISOString().slice(0, 10)
  const 날 = `${m[1]}-${m[2]}-${m[3]}`
  if (날 === 오늘) return '오늘 마감'
  const 일 = Math.round((Date.parse(날 + 'T00:00:00+09:00') - Date.parse(오늘 + 'T00:00:00+09:00')) / 86400e3)
  return 일 >= 1 ? `D-${일}` : ''
}

/** 짧은 금액 — 12,345,678,900 → '123.5억' · 85,000,000 → '8,500만' */
export function 금액글(v) {
  const n = Number(v) || 0
  if (!n) return ''
  if (n >= 1e8) {
    const 억 = n / 1e8
    return (억 >= 100 ? Math.round(억).toLocaleString('ko-KR') : (Math.round(억 * 10) / 10).toLocaleString('ko-KR')) + '억'
  }
  if (n >= 1e4) return Math.round(n / 1e4).toLocaleString('ko-KR') + '만'
  return n.toLocaleString('ko-KR') + '원'
}

/** 날짜 짧게 — '2026-11-17 10:00' → '11.17 10:00' */
export const 날짧게 = (v) => {
  const m = String(v || '').match(/^\d{4}-(\d{2})-(\d{2})(?: (\d{2}:\d{2}))?/)
  return m ? `${Number(m[1])}.${m[2]}${m[3] ? ' ' + m[3] : ''}` : ''
}

/** 주소 → 상태 · 상태 → 주소 (공유 · 뒤로가기 · 카톡) */
export function 주소읽기(search, 길시도 = '') {
  const p = new URLSearchParams(search || '')
  const r = 시도목록.includes(길시도) ? 길시도 : (시도목록.includes(p.get('r') || '') ? p.get('r') : '')
  const s = String(p.get('s') || '').split(',').filter((x) => /^[012]$/.test(x)).map(Number)
  const a = 금액칸들.some((x) => x.k === p.get('a')) ? p.get('a') : ''
  return { 시도: r, k: String(p.get('k') || '').replace(/[^0-9]/g, '').slice(0, 6), 단계: s, 금액: a, 찾기: String(p.get('q') || '').slice(0, 40), no: String(p.get('no') || '').replace(/[^A-Za-z0-9-]/g, '').slice(0, 30) }
}
export function 주소만들기(st) {
  const p = new URLSearchParams()
  if (st.k) p.set('k', st.k)
  if (st.단계 && st.단계.length && st.단계.length < 3) p.set('s', [...st.단계].sort().join(','))
  if (st.금액) p.set('a', st.금액)
  if (st.찾기) p.set('q', st.찾기)
  if (st.no) p.set('no', st.no)
  const q = p.toString()
  return (st.시도 ? `/map/${encodeURIComponent(st.시도)}` : '/map') + (q ? `?${q}` : '')
}

/** 현황판 가는 길 — 다른 화면(맵톡 · 공고 · 1순위 · 구인구직)의 «🗺 지도로 보기» 가 한 곳에서 주소를 만듦
 *  지역: 공고 탭과 같은 저장(kcm_region — 시도 이름 · '전국') → 그 시도 지도로 · 단계: 0 입찰 중 · 1 개찰 대기 · 2 곧 착공 · 없으면 셋 다 */
export function 지도가는길(지역 = '', 단계 = null) {
  const d = 시도목록.includes(지역) ? 지역 : ''
  return 주소만들기({ 시도: d, k: '', 단계: 단계 == null ? [] : [단계], 금액: '', 찾기: '', no: '' })
}

/** 공유 글 — 카톡 · 문자 */
export function 공유글(r, 곳이름 = '') {
  const 단 = (단계표[r.s] || 단계표[0]).이름
  const 금 = 금액글(r.금액)
  const 때 = r.s === 0 ? (r.마감 ? `마감 ${날짧게(r.마감)}` : '') : r.s === 2 ? (r.일등 ? `1순위 ${r.일등}` : '') : (r.개찰 ? `개찰 ${날짧게(r.개찰)}` : '')
  return [`[${단}] ${r.이름}`, [r.기관, 곳이름, 금].filter(Boolean).join(' · '), 때].filter(Boolean).join('\n')
}
