/* ══════════════════════════════════════════════════════════════
   마이쓴곳.js — 🗂 마이컨맵 «내 도구 · 서식» — 이 브라우저에서 연 도구 · 서식을 셉니다 (G188 · 2026-10-07)

   소장님: 「여기서 자기가 이용하는 도구 및 서식을 여기서 볼 수 있어야 하는 거잖아. 아니면 그쪽으로 바로가게 해주거나」
   ■ 화면이 바뀔 때마다(App.jsx) 주소가 «도구 · 서식 · 내역서 · 적산 · 설계변경 · 캐드» 쪽이면 한 번 셉니다.
     서버로 보내지 않습니다 — 이 브라우저(localStorage)에만. 마이컨맵 «주인 면» 이 «자주 쓴 순» 으로 띄웁니다.
   ■ 📌 고정 — 이용자가 고른 것은 «자주 쓴 것» 보다 먼저, 고른 차례대로.
   ⚠️ 첫 화면 덩어리에 들어가므로 작게 둡니다(파이어베이스 · 큰 목록을 부르지 않음).
   ══════════════════════════════════════════════════════════════ */
const 열쇠 = 'kcm.my.쓴곳'
const 고정열쇠 = 'kcm.my.고정'
const 최대 = 60

/* 셀 주소 — 한 칸 아래까지만(/tools/tuipbi/v/… 같은 속 화면은 안 셈) */
const 셀곳 = /^\/(?:tools\/[^/]+|forms\/[^/]+|change(?:\/[^/]+)?|naeyeok(?:\/[^/]+)?|jeoksan(?:\/[^/]+)?|cad(?:\/[^/]+)?|safety|pdf|lic|guide\/[^/]+)$/
export const 셀주소 = (p) => 셀곳.test(String(p || ''))

const 읽 = (k, 기본) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? 기본 : v } catch (e) { return 기본 } }
const 쓰 = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch (e) { /* 개인 창 · 가득 참 */ } }

let 앞 = ''
/** 화면이 바뀔 때 부름 — 같은 주소를 잇달아 세지 않음(새로고침 · 뒤로가기로 같은 칸) */
export function 쓴곳기록(path) {
  const p = String(path || '').replace(/\/+$/, '')
  if (!셀주소(p) || p === 앞) return
  앞 = p
  const d = 읽(열쇠, {})
  const 지금 = Date.now()
  const x = d[p] || { n: 0, t: 0 }
  d[p] = { n: x.n + 1, t: 지금 }
  const 키들 = Object.keys(d)
  if (키들.length > 최대) {
    키들.sort((a, b) => (d[a].n - d[b].n) || (d[a].t - d[b].t))
    for (const k of 키들.slice(0, 키들.length - 최대)) delete d[k]
  }
  쓰(열쇠, d)
}
/** [{p, n, t}] — 자주 쓴 순(같으면 최근 순) */
export function 쓴곳읽기() {
  const d = 읽(열쇠, {})
  return Object.entries(d).filter(([p, v]) => 셀주소(p) && v && v.n > 0)
    .map(([p, v]) => ({ p, n: v.n, t: v.t })).sort((a, b) => (b.n - a.n) || (b.t - a.t))
}
export function 쓴곳빼기(p) { const d = 읽(열쇠, {}); delete d[p]; 쓰(열쇠, d); 고정바꾸기(p, false) }
export const 고정읽기 = () => (Array.isArray(읽(고정열쇠, [])) ? 읽(고정열쇠, []).filter(셀주소).slice(0, 12) : [])
export function 고정바꾸기(p, 켬) {
  const L = 고정읽기().filter((x) => x !== p)
  const 새 = 켬 ? [...L, p].slice(-12) : L
  쓰(고정열쇠, 새)
  return 새
}

/* ⚡ G188 «내 단축키» — 소장님 「건설맵 프로그램을 마이컨맵에 연결 … 단축키 형식으로 클릭하면 바로 가기해서 일을 처리」 → 「모두 다 하자」
   ■ 주소(그 일로 바로 가는 #go-… 포함)를 차례대로 16개까지 · 이 브라우저에만(비용 0). 한 번도 안 고쳤으면 «자주 쓴 것» 으로 저절로 채움. */
const 단축열쇠 = 'kcm.my.단축키'
export const 단축최대 = 16
/** 그 일로 바로 — 프로그램 첫 화면이 아니라 하려는 일 자리로(App.jsx 가 #go-… 칸으로 내려가 커서) */
export const 그일들 = [
  { p: '/calc#go-base', i: '💰', n: '바로투찰 — 기초금액 넣기' },
  { p: '/tools/nomubi#go-myeongse', i: '👷', n: '노무비 — 이 달 지급명세서' },
  { p: '/tools/singo', i: '📮', n: '매달 신고 정리' },
  { p: '/tools/ilbo', i: '📝', n: '작업일보 쓰기' },
  { p: '/tools/tuipbi', i: '🏗', n: '투입비 · 공사일보' },
  { p: '/forms/chakgong', i: '📄', n: '서식 — 착공계' },
  { p: '/forms/jungong', i: '📄', n: '서식 — 준공계' },
  { p: '/qna#go-mt-say', i: '💬', n: '맵톡에 글쓰기' },
  { p: '/first', i: '🏆', n: '오늘 1순위 개찰' },
  { p: '/live', i: '📋', n: '입찰 공고' },
]
const 처음단축 = ['/calc#go-base', '/tools/nomubi', '/forms', '/qna#go-mt-say']
const 단축맞나 = (p) => typeof p === 'string' && /^\/[^\s]{0,120}$/.test(p)
/** 저장한 단축키(없으면 null) */
export function 단축저장읽기() { const v = 읽(단축열쇠, null); return Array.isArray(v) ? v.filter(단축맞나).slice(0, 단축최대) : null }
/** 보일 단축키 — 저장한 것 · 없으면 고정 + 자주 쓴 8개 · 그것도 없으면 처음 넷 */
export function 단축읽기() {
  const v = 단축저장읽기()
  if (v) return v
  const 자동 = [...고정읽기(), ...쓴곳읽기().map((x) => x.p)].filter((p, i, a) => a.indexOf(p) === i).slice(0, 8)
  return 자동.length ? 자동 : 처음단축
}
export function 단축쓰기(L) { const v = (L || []).filter(단축맞나).filter((p, i, a) => a.indexOf(p) === i).slice(0, 단축최대); 쓰(단축열쇠, v); return v }
