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
 *
 * 🔢 G342 (2026-10-20) 소장님 「그냥, 다른 것도, 건설맵이 조회수 모두 관리하면 안돼?」 → 「일반적으로 사이트 조회하는 방법으로, 나머지도 다. 건설맵이 직접 세는 걸로 하자.
 *   이것도, 자정 12시 부터 바뀌는 걸로 해줘」
 *   ■ 10/21 0시(조회직접시작)부터 화면을 열 때마다 건설맵이 데이터베이스 pv 에 1 을 더합니다(규칙 «1씩만» — database.rules.json "pv"):
 *       pv/a/{전체열쇠}(화면 위 «이 화면 조회») · pv/c/{화면열쇠}(도구 · 서식 카드 «조회 N» — lib/받은수.jsx) · pv/n/{공고번호 앞 8자}/{공고번호}(공고 조회 · 목록에서 펼침도)
 *   ■ 보이는 숫자 = 시작값(애널리틱스 2026-09-15 ~ 10-20 · fresh/pvp · fresh/pv · fresh/nv — 이용자지도.py 가 끝날을 10-20 으로 묶어 계속 채움) + 건설맵이 센 것.
 *   ■ 셈: 🔢 G347 같은 브라우저 · 같은 화면(공고)은 하루(한국 시각) 한 번(10/21 07시 무렵까지는 열 때마다 1 이었음) · 안 셈: 소장님 브라우저 · 자동 브라우저(webdriver · bot).
 *   ■ 비용: 화면 하나 열 때 작은 요청 2~4번(읽고 · 1 더하기 · ETag 로 겹침 막음).
 */
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 열쇠꼴, 봇, 세기, 화면열쇠 } from './받은수.jsx'
import { 지역주소, 방문수, 누적시작, 날글 } from './이용자지도.js'

const DB = 'https://k-conmap-default-rtdb.firebaseio.com'
export const 첫마디들 = new Set(['agency', 'analysis', 'bunseok', 'gongdong', 'cad', 'calc', 'change', 'corp', 'daily', 'ext', 'first', 'forms', 'goods', 'guide', 'how', 'jeoksan', 'jobs',
  'lic', 'live', 'my', 'naeyeok', 'pdf', 'qna', 'report', 'safety', 'shareone', 'svc', 'tools', 'about', 'privacy', 'terms', 'contact'])
/* 🔢 G205 (2026-10-08) 소장님 「마이컨맵은 다른 페이지처럼 누적으로 카운트되게」 — 'my' 를 더함(/my → |my). 공개 페이지 /@주소 는 일부러 안 넣음(숨은 누적 |명함|주소 만 — MyConmap.jsx).
 *   ⚠️ 파이썬 tools/이용자지도.py 첫마디들 과 «똑같이» */
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
  /* 👁 2026-10-17 — 못 읽음(네트워크 · 서버) = undefined · 읽었는데 아직 숫자 없음(새 화면) = null → 화면에서 0 */
  n.p = fetch(url, { cache: 'no-store' }).then((r) => (r.ok ? r.json() : undefined)).catch(() => undefined)
    .then((v) => { n.v = v; n.p = null; n.t = Date.now(); 알림() })
  받은것.set(url, n)
  return n
}
const 화면주소 = (key) => `${DB}/fresh/pvp/${encodeURIComponent(key)}.json`
const 묶음주소 = (no) => `${DB}/fresh/nv/${encodeURIComponent(String(no).slice(0, 8))}.json`
/* 🔢 G342 — 건설맵이 직접 센 것(10/21 0시부터) */
export const 조회직접시작 = Date.parse('2026-10-21T00:00:00+09:00')
export const 조회직접인가 = (t = Date.now()) => t >= 조회직접시작
const 직접화면주소 = (key) => `${DB}/pv/a/${encodeURIComponent(key)}.json`
const 직접카드주소 = (key) => `${DB}/pv/c/${encodeURIComponent(key)}.json`
const 직접공고주소 = (no) => `${DB}/pv/n/${encodeURIComponent(String(no).slice(0, 8))}/${encodeURIComponent(String(no))}.json`
const 직접묶음주소 = (no) => `${DB}/pv/n/${encodeURIComponent(String(no).slice(0, 8))}.json`
function use다시() {
  const [, 다시] = useState(0)
  useEffect(() => { const f = () => 다시((x) => x + 1); 듣는이.add(f); return () => { 듣는이.delete(f) } }, [])
}
/** 이 화면 조회 수 — 못 읽었으면 null */
export function use화면조회(path) {
  use다시()
  const key = path == null ? null : 전체열쇠(path)
  const url = key ? 화면주소(key) : null
  const 직접 = key && 조회직접인가() ? 직접화면주소(key) : null
  useEffect(() => { if (url) 받기(url); if (직접) 받기(직접) }, [url, 직접])
  if (!url) return null
  const 수 = (o) => {
    if (!o) return null
    if (typeof o.v === 'number') return o.v
    /* 👁 2026-10-17 소장님 「조회수는 보이게 해줘. 모든 도구 및 서식에는 다 보이게 해줘...항상」 — 읽었는데 아직 숫자가 없는 새 화면은 0 */
    return !o.p && o.v === null ? 0 : null
  }
  const a = 수(받은것.get(url))
  if (!직접) return a
  const b = 수(받은것.get(직접))
  /* 🔢 G342 시작값 + 건설맵이 센 것 — 한쪽을 못 읽으면 읽은 쪽만(둘 다 못 읽으면 안 그림) */
  return a === null && b === null ? null : (a || 0) + (b || 0)
}
/** 공고 조회 수 — 못 읽었으면 null (같은 묶음은 한 번만 받음) */
export function use공고조회(no) {
  use다시()
  const url = no && 공고모양.test(String(no)) ? 묶음주소(no) : null
  const 직접 = url && 조회직접인가() ? 직접묶음주소(no) : null
  useEffect(() => { if (url) 받기(url); if (직접) 받기(직접) }, [url, 직접])
  if (!url) return null
  const 수 = (u) => { const o = u && 받은것.get(u); const v = o && o.v && typeof o.v === 'object' ? o.v[String(no)] : null; return typeof v === 'number' ? v : null }
  const a = 수(url), b = 수(직접)
  return a === null && b === null ? null : (a || 0) + (b || 0)
}

/* ── 🔢 G342 건설맵이 직접 셈 — 화면을 열 때마다 1 ── */
async function 더하기(url) {
  for (let i = 0; i < 4; i++) {
    const r = await fetch(url, { headers: { 'X-Firebase-ETag': 'true' }, cache: 'no-store' })
    if (!r.ok) return false
    const tag = r.headers.get('ETag')
    const v = Number(await r.json()) || 0
    const w = await fetch(url, { method: 'PUT', headers: { 'if-match': tag }, body: String(v + 1) })
    if (w.ok) return true
    if (w.status !== 412) return false             // 412 = 그 사이 누가 먼저 더함 → 다시
  }
  return false
}
/* 🔢 G347 (2026-10-21) 소장님 「입찰 분석실이 계속 카운팅 되는데, 브라우저 하나당 한번 아니야???」 → 고르심 «하루 한 번»
   같은 브라우저가 같은 화면 · 같은 공고를 하루(한국 시각)에 여러 번 열어도(새로 고침 · 다시 열기) 1 만 — 다음 날 다시 오면 또 1.
   이 기기(localStorage)에 «오늘 센 것» 만 적어 둡니다(날이 바뀌면 통째로 새로). 못 쓰는 창(사생활 등)은 이 탭 동안만 기억. */
const 본날열쇠 = 'kcm.pv.본날'
const 한국날 = (t = Date.now()) => new Date(t + 9 * 3600e3).toISOString().slice(0, 10)
let 본날메모 = null
export function 오늘처음(열쇠, 지금 = Date.now()) {
  const d = 한국날(지금)
  try {
    const o = JSON.parse(localStorage.getItem(본날열쇠) || 'null')
    const 표 = o && o.d === d && o.k && typeof o.k === 'object' ? o.k : {}
    if (표[열쇠]) return false
    표[열쇠] = 1
    localStorage.setItem(본날열쇠, JSON.stringify({ d, k: 표 }))
    return true
  } catch (e) {
    if (!본날메모 || 본날메모.d !== d) 본날메모 = { d, k: {} }
    if (본날메모.k[열쇠]) return false
    본날메모.k[열쇠] = 1
    return true
  }
}
let 운영자확인 = null
const 운영자인가 = () => (운영자확인 || (운영자확인 = import('./운영자.js').then((m) => m.나운영자()).then((v) => !!v).catch(() => false)))
/** 시험에서 바꿔 끼움 */
export function _운영자바꿈(f) { 운영자확인 = f ? Promise.resolve(!!f()) : null }
const 다시받게 = (url) => { const o = 받은것.get(url); if (o) { if (o.p) { o.p.then(() => { o.t = 0; 받기(url) }); return } o.t = 0 } 받기(url) }   /* 옛 숫자는 둔 채 다시 읽음(읽는 중이면 끝난 뒤) */
/** 화면 하나를 연 것 — 주소(pathname) · 공고 화면(/notice/{번호})은 공고 조회로 · 사이트 밖 주소는 안 셈 */
export async function 조회세기(path, 지금 = Date.now()) {
  try {
    if (!조회직접인가(지금) || 봇()) return []
    if (await 운영자인가()) return []
    const no = 공고번호(path)
    const 일 = []
    if (no) 일.push(직접공고주소(no))
    else {
      const k = 전체열쇠(path)
      if (!k) return []
      일.push(직접화면주소(k))
      const c = 화면열쇠(path)
      if (c) 일.push(직접카드주소(c))
    }
    const 셀 = 일.filter((u) => 오늘처음(u, 지금))      /* 🔢 G347 하루 한 번 — 오늘 이 브라우저가 이미 센 화면 · 공고는 안 더함 */
    if (!셀.length) return []
    const 됨 = await Promise.all(셀.map((u) => 더하기(u).catch(() => false)))
    if (no) 다시받게(직접묶음주소(no)); else 다시받게(셀[0])
    return 셀.filter((_, i) => 됨[i])
  } catch (e) { return [] /* 세는 것 때문에 화면이 막히면 안 됩니다 */ }
}
/** App.jsx 에 한 번 — 주소(pathname)가 바뀔 때마다 */
export function use조회세기() {
  const { pathname } = useLocation()
  useEffect(() => { 조회세기(pathname) }, [pathname])
}

/* ── 목록에서 공고를 펼침 → 애널리틱스에 그 공고 주소로 page_view 하나 ── */
let 운영자 = null
export async function 공고봄(no, 이름) {
  try {
    no = String(no || '')
    if (!공고모양.test(no) || 봇() || typeof window === 'undefined') return
    const k = 'kcm_nv_' + no
    let 탭처음 = true
    try { if (sessionStorage.getItem(k)) 탭처음 = false; else sessionStorage.setItem(k, '1') } catch (e) { /* 사생활 창 — 그냥 보냄 */ }
    if (운영자 === null) {
      try { const m = await import('./운영자.js'); 운영자 = !!(await m.나운영자()) } catch (e) { 운영자 = false }
    }
    if (운영자) return
    /* 🔢 G342 — 10/21 0시부터 건설맵이 직접 +1(공고 화면을 연 것과 같은 숫자) · G347 같은 브라우저는 하루 한 번(공고 화면을 연 것과 같은 열쇠) */
    if (조회직접인가() && 오늘처음(직접공고주소(no))) 더하기(직접공고주소(no)).then(() => 다시받게(직접묶음주소(no))).catch(() => {})
    if (!탭처음 || !window.gtag) return
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
const 방문설명 = `구글 애널리틱스 «사용자» · 대한민국 + 해외(로봇 뺌) · ${날글(누적시작)}부터 누적 · 10분마다 고침(몇십 분 늦을 수 있음)`
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
 *     조회 수가 없는 화면은 위 줄 자체가 없음(마이컨맵 /my 는 G205 부터 조회 N 이 뜸 · 공개 페이지 /@주소 는 안 뜸). */
export function 화면조회줄() {
  const { pathname } = useLocation()
  const no = 공고번호(pathname)
  const 화면 = use화면조회(no || 숨김(pathname) ? null : pathname)
  const 공고 = use공고조회(no)
  const n = no ? 공고 : 화면
  /* 👁 2026-10-17 «항상» — 화면은 0 이어도 보임(못 읽었을 때만 안 그림) · 공고는 전처럼 숫자가 있을 때만 */
  if (숨김(pathname) || n === null || n === undefined || (no && !n)) return null
  return (
    <div className="pvline">
      <span className="pvnum" title={조회직접인가() ? "이 화면을 연 횟수 (2026-09-15 ~ 10-20 애널리틱스 + 10-21부터 건설맵이 직접 셈 · 소장님 · 로봇 뺌)" : "이 화면을 연 횟수 (2026-09-15부터 · 구글 애널리틱스 · 30분마다 고침)"}>
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
