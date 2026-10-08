/* 👁 화면마다 · 공고마다 «조회 N» — 2026-10-02 (G121)
 *   소장님: 「공고 클릭 수도 조회 클릭수 보이게 할 수 있어? 사이트 내 모든 것에 클릭수 보이게 할 수 있어?」 → 「공고, 모든 화면 — 누적으로 해줘」
 *
 * ■ 숫자 = 구글 애널리틱스 조회수(2026-09-15 ~ 지금) — 깃허브(tools/이용자지도.py)가 30분마다 넣고, 화면은 읽기만 합니다.
 *   · fresh/pvp/{전체열쇠} — 화면 하나하나(주소 전체). 화면 위 «👁 이 화면 조회 N» (화면조회줄 — App.jsx 한 곳)
 *   · fresh/nv/{공고번호 앞 8자}/{공고번호} — /notice/{공고번호} 조회. 공고 카드 «👁 N»(NoticeLink 옆) · 공고 화면 위
 *   (도구 · 서식 카드는 fresh/pv — lib/받은수.jsx)
 * ■ 목록에서 공고를 «펼치면» 애널리틱스에 그 공고 주소(/notice/{공고번호})로 page_view 를 하나 보냅니다(공고봄) —
 *   그래야 공고 화면을 연 것과 목록에서 펼친 것이 같은 숫자로 쌓입니다. 이 창(탭)에서 공고마다 한 번 · 소장님 브라우저 · 로봇은 안 보냄.
 * ■ 서버에 쓰는 것 없음 · 규칙 안 바뀜(fresh 는 누구나 읽기만). 애널리틱스를 막은 브라우저는 안 셈 · 몇 시간 늦게 오를 수 있음.
 * ⚠️ 전체열쇠 · 공고번호는 파이썬(tools/이용자지도.py)과 «똑같이» — 시험(tools/시험_이용자지도.py)이 대 봅니다.
 */
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 열쇠꼴, 봇, 세기 } from './받은수.jsx'
import { 지역주소, 방문수, 누적시작, 날글 } from './이용자지도.js'

const DB = 'https://k-conmap-default-rtdb.firebaseio.com'
export const 첫마디들 = new Set(['agency', 'analysis', 'cad', 'calc', 'change', 'corp', 'daily', 'ext', 'first', 'forms', 'goods', 'guide', 'how', 'jeoksan', 'jobs',
  'lic', 'live', 'naeyeok', 'pdf', 'qna', 'report', 'safety', 'shareone', 'svc', 'tools', 'about', 'privacy', 'terms', 'contact'])
const 공고모양 = /^[A-Za-z0-9-]{6,30}$/
const 마디풀기 = (path) => String(path || '/').split('?')[0].split('#')[0].split('/').filter(Boolean)
  .map((x) => { try { return decodeURIComponent(x) } catch (e) { return x } })

/** 화면 하나하나의 열쇠(주소 전체) — 사이트 화면이 아니면 null (공고는 공고번호로 따로) */
export function 전체열쇠(path) {
  let m = 마디풀기(path)
  if (!m.length) return '|'
  if (!첫마디들.has(m[0])) return null
  if (m[0] === 'tools' && m[1] === 'tuipbi') m = m.slice(0, 2)     /* 현장 링크는 비밀 — 화면까지만 */
  if (m.length > 3 || m.some((x) => x.length > 60 || /[\u0000-\u001f\u007f]/.test(x))) return null
  return 열쇠꼴('|' + m.join('|')).slice(0, 120)
}
/** /notice/{공고번호} 의 공고번호 — 아니면 null */
export function 공고번호(path) {
  const m = 마디풀기(path)
  return m.length === 2 && m[0] === 'notice' && 공고모양.test(m[1]) ? m[1] : null
}

/* ── 읽기 (5분 동안 다시 안 받음) ── */
const 듣는이 = new Set()
const 알림 = () => 듣는이.forEach((f) => f())
const 받은것 = new Map()          // 주소 → { v, t, p }
function 받기(url) {
  const o = 받은것.get(url)
  if (o && (o.p || Date.now() - o.t < 5 * 60000)) return o
  const n = { v: o ? o.v : undefined, t: Date.now(), p: null }
  n.p = fetch(url, { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)).catch(() => null)
    .then((v) => { n.v = v; n.p = null; n.t = Date.now(); 알림() })
  받은것.set(url, n)
  return n
}
const 화면주소 = (key) => `${DB}/fresh/pvp/${encodeURIComponent(key)}.json`
const 묶음주소 = (no) => `${DB}/fresh/nv/${encodeURIComponent(String(no).slice(0, 8))}.json`
function use다시() {
  const [, 다시] = useState(0)
  useEffect(() => { const f = () => 다시((x) => x + 1); 듣는이.add(f); return () => { 듣는이.delete(f) } }, [])
}
/** 이 화면 조회 수 — 못 읽었으면 null */
export function use화면조회(path) {
  use다시()
  const key = path == null ? null : 전체열쇠(path)
  const url = key ? 화면주소(key) : null
  useEffect(() => { if (url) 받기(url) }, [url])
  if (!url) return null
  const o = 받은것.get(url)
  return o && typeof o.v === 'number' ? o.v : null
}
/** 공고 조회 수 — 못 읽었으면 null (같은 묶음은 한 번만 받음) */
export function use공고조회(no) {
  use다시()
  const url = no && 공고모양.test(String(no)) ? 묶음주소(no) : null
  useEffect(() => { if (url) 받기(url) }, [url])
  if (!url) return null
  const o = 받은것.get(url)
  const v = o && o.v && typeof o.v === 'object' ? o.v[String(no)] : null
  return typeof v === 'number' ? v : null
}

/* ── 목록에서 공고를 펼침 → 애널리틱스에 그 공고 주소로 page_view 하나 ── */
let 운영자 = null
export async function 공고봄(no, 이름) {
  try {
    no = String(no || '')
    if (!공고모양.test(no) || 봇() || typeof window === 'undefined' || !window.gtag) return
    const k = 'kcm_nv_' + no
    try { if (sessionStorage.getItem(k)) return; sessionStorage.setItem(k, '1') } catch (e) { /* 사생활 창 — 그냥 보냄 */ }
    if (운영자 === null) {
      try { const m = await import('./운영자.js'); 운영자 = !!(await m.나운영자()) } catch (e) { 운영자 = false }
    }
    if (운영자) return
    window.gtag('event', 'page_view', {
      page_location: `${location.origin}/notice/${encodeURIComponent(no)}`,
      page_title: `${이름 || no} — 목록에서 펼침 | K-건설맵`,
    })
  } catch (e) { /* 세는 것 때문에 화면이 막히면 안 됩니다 */ }
}

/* ── 👥 G172 방문자 «오늘 · 어제 · 누적» (2026-10-06) ──────────────────
   소장님: 「일 접속자 공개하는 사이트 많아. 건설맵처럼」 → 「해줘」
   ■ 자료: fresh/reg.kr (tools/이용자지도.py · 10분마다 · 애널리틱스 «활성 사용자» · 대한민국) — 이 화면은 5분에 한 번만 받음(작음)
   ■ 자리: 바닥글 한 줄(🩹 G197 화면 위 줄에서는 뺌 — 소장님 「화면이 지져분해 보여」). 누르면 바로투찰 맨 위 이용자 지도(시·도별).
   ■ 누르면 숨은 누적 «|방문자|누름» (탭마다 한 번 · 화면엔 안 보임 — 물으면 클로드가 dl/p 를 읽어 알려 드림)
   ■ 애널리틱스를 막은 브라우저는 안 셈 · 몇십 분 늦게 오름. 소장님 브라우저도 애널리틱스엔 들어갑니다. */
export function use방문수() {
  use다시()
  useEffect(() => { 받기(지역주소) }, [])
  const o = 받은것.get(지역주소)
  return 방문수(o && o.v)
}
const 쉼표 = (n) => Number(n).toLocaleString('ko-KR')
let 방문셌다 = false
const 방문누름 = () => { if (!방문셌다) { 방문셌다 = true; 세기('|방문자|누름') } }
const 방문설명 = `구글 애널리틱스 «사용자» · 대한민국 · ${날글(누적시작)}부터 누적 · 10분마다 고침(몇십 분 늦을 수 있음)`
/** «오늘 N · 어제 N · 누적 N명» — 바닥글(길게) */
function 방문글({ v, 길게 }) {
  const 칸 = []
  if (v.오늘 != null) 칸.push(<span key="t">오늘 <b>{쉼표(v.오늘)}</b>{길게 ? '명' : ''}</span>)
  if (v.어제 != null) 칸.push(<span key="y">어제 <b>{쉼표(v.어제)}</b>{길게 ? '명' : ''}</span>)
  칸.push(<span key="a">누적 <b>{쉼표(v.누적)}</b>명</span>)
  return 칸.flatMap((x, i) => (i ? [<span key={'d' + i} className="vsdot">·</span>, x] : [x]))
}
/** 바닥글 한 줄 — 🩹 G199 (2026-10-08) App.jsx 에서 뺌(소장님 「방문자 수 빼줘. 지도위에만」) · 지금은 아무 데서도 안 씀(다시 쓸 때를 위해 남김) */
export function 방문자바닥() {
  const v = use방문수()
  if (!v) return null
  return (
    <div className="vsfoot" title={방문설명}>
      <Link to="/" onClick={방문누름}>👥 <b>방문자</b></Link>
      <span className="dot">·</span><방문글 v={v} 길게 />
      {' '}<span className="vsnote">({날글(누적시작)}부터 · 구글 애널리틱스)</span>
    </div>
  )
}

/* ── 그리기 ── */
const 숨김 = (p) => p.startsWith('/admin') || p.startsWith('/tools/tuipbi/v')
/** 화면 위 «👁 이 화면 조회 N» — App.jsx 에 한 번(모든 화면) */
/* 🩹 G197 (2026-10-08) 소장님(폰 /my 캡처): 「위에 갑자기 없던게 떠있어… 이거 고쳐줘 화면이 지져분해 보여」
 *   → 화면 위 줄에서 «👥 오늘 · 어제 · 누적» 을 뺌(바닥글 방문자바닥 한 곳에만). 위 줄은 G121 그대로 «👁 이 화면 조회 N» 만 —
 *     조회 수가 없는 화면(마이컨맵 등)은 위 줄 자체가 없음. */
export function 화면조회줄() {
  const { pathname } = useLocation()
  const no = 공고번호(pathname)
  const 화면 = use화면조회(no || 숨김(pathname) ? null : pathname)
  const 공고 = use공고조회(no)
  const n = no ? 공고 : 화면
  if (숨김(pathname) || !n) return null
  return (
    <div className="pvline">
      <span className="pvnum" title="이 화면을 연 횟수 (2026-09-15부터 · 구글 애널리틱스 · 30분마다 고침)">
        👁 {no ? '이 공고' : '이 화면'} 조회 {n.toLocaleString('ko-KR')}
      </span>
    </div>
  )
}
/** 공고 카드 «👁 N» — 0 이거나 못 읽었으면 안 그림 */
export function 공고조회({ no }) {
  const n = use공고조회(no)
  if (!n) return null
  return <span className="nvcount" title="이 공고를 연 횟수 (공고 화면 + 목록에서 펼친 것 · 2026-09-15부터 · 30분마다 고침)">👁 {n.toLocaleString('ko-KR')}</span>
}
