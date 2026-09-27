/**
 * 🧭 길 기록 — 뒤로가기를 «앱처럼» (2026-09-27)
 *
 * 소장님: 「이제 손님 맞을 준비 완벽하게 해 보자 … 특히 뒤로가기 잘 되어 있나 확인해 주고」
 *
 * 전수조사에서 찾은 것 (휴대폰 폭으로 사이트 안 링크 60개를 기계가 눌러 봄)
 *   ① 화면 위 «← 도구» 같은 단추가 **새로 한 칸을 쌓았습니다.** 목록 맨 위로 가 버리고,
 *      그 뒤 휴대폰 뒤로가기를 누르면 **보던 도구로 되돌아갔습니다**(왔다 갔다).
 *   ② 뒤로 왔을 때 **보던 자리(스크롤)를 잃었습니다** — 1순위 → 공고 → 뒤로 = 맨 위.
 *   ③ 화면 안 단계(골조·마감 탭, 투입비, PDF 도구 고르기)에서 뒤로가기를 누르면 **도구 밖으로** 나갔습니다.
 *
 * 그래서 세 가지를 둡니다.
 *   · 걸음마다 «몇 번째 칸에 어느 주소» 였는지 적어 둡니다(sessionStorage — 이 탭에서만, 새로고침해도 남음).
 *     → 화면 위 «← 」 단추는 «들어온 곳» 으로 **기록을 되감습니다**(쌓지 않음). 스크롤·검색어가 그대로입니다.
 *   · 칸마다 스크롤 자리를 적어 두고, 뒤로·앞으로 왔을 때 되돌립니다(자료가 늦게 와도 기다렸다가).
 *   · 화면 안 단계는 use화면상태() 로 — 단계가 바뀔 때 기록을 한 칸 쌓아, 뒤로가기가 «앞 단계» 로 갑니다.
 *     주소(URL)는 바꾸지 않습니다(검색엔진·공유 주소에 영향 없음).
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useNavigationType } from 'react-router-dom'

const 길열쇠 = 'kcm.길.v1'
const 자리열쇠 = 'kcm.자리.v1'

function 읽기(k) { try { return JSON.parse(sessionStorage.getItem(k) || '{}') || {} } catch (e) { return {} } }
function 쓰기(k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)) } catch (e) { /* 사생활 보호 모드 */ } }

/** 지금 칸 번호 (리액트 라우터가 기록마다 매기는 idx). 모르면 null */
export function 칸번호() {
  try { const i = window.history.state && window.history.state.idx; return typeof i === 'number' ? i : null }
  catch (e) { return null }
}

/** 칸 i 에 주소·제목을 적습니다 */
export function 칸적기(i, 주소, 제목) {
  if (i == null) return
  const m = 읽기(길열쇠)
  const 옛 = m[i]
  m[i] = { p: 주소, t: 제목 != null ? 제목 : (옛 && 옛.p === 주소 ? 옛.t : '') }
  // 너무 쌓이지 않게 — 지금 칸에서 멀리 뒤(200칸 전)는 버립니다
  for (const k of Object.keys(m)) if (+k < i - 200) delete m[k]
  쓰기(길열쇠, m)
}

/** 지금 주소와 «다른 주소» 인 가장 가까운 앞 칸 → { 몇칸: -n, p, t } · 사이트 안에서 걸어 들어온 게 아니면 null */
export function 들어온곳(지금주소) {
  const i = 칸번호()
  /* 공고·날짜별 성적표는 가벼우라고 «통째로 불러오는» 링크(<a href>)라 칸 번호가 0 부터 다시 셉니다.
     그때는 브라우저가 알려 주는 «앞 주소(referrer)» 가 우리 사이트면 그리로 한 걸음 되감습니다. */
  if (i === 0 || i == null) {
    try {
      if (window.history.length < 2 || !document.referrer) return null
      const r = new URL(document.referrer)
      if (r.origin !== window.location.origin) return null
      const p = decodeURIComponent(r.pathname)
      if (p === decodeURIComponent(지금주소)) return null
      return { 몇칸: -1, p, t: '' }
    } catch (e) { return null }
  }
  if (i < 0) return null
  const m = 읽기(길열쇠)
  for (let j = i - 1; j >= 0; j--) {
    const e = m[j]
    if (!e) return null            // 기록이 끊겼으면(다른 사이트를 거쳐 옴 등) 모르는 것으로
    if (e.p !== 지금주소) return { 몇칸: j - i, p: e.p, t: e.t || '' }
  }
  return null
}

/** 바로 앞 칸이 같은 주소(화면 안 단계)인가 */
export function 앞칸같은주소(지금주소) {
  const i = 칸번호()
  if (i == null || i <= 0) return false
  const e = 읽기(길열쇠)[i - 1]
  return !!(e && e.p === 지금주소)
}

/* ── 스크롤 자리 ─────────────────────────────── */
function 자리쓰기(열쇠, y) {
  const m = 읽기(자리열쇠)
  m[열쇠] = Math.max(0, Math.round(y))
  const ks = Object.keys(m)
  if (ks.length > 300) for (const k of ks.slice(0, ks.length - 300)) delete m[k]
  쓰기(자리열쇠, m)
}
function 자리읽기(열쇠) { const v = 읽기(자리열쇠)[열쇠]; return typeof v === 'number' ? v : null }

/**
 * App 에 한 번 둡니다. ① 칸마다 주소·제목 적기 ② 스크롤 자리 적기·되돌리기
 * ⚠️ 옛 App 의 «주소가 바뀌면 맨 위로» 를 대신합니다(앞으로 가기 = 맨 위, 뒤로 = 보던 자리).
 */
export function use길지킴이() {
  const loc = useLocation()
  const 종류 = useNavigationType()
  const 앞 = useRef(null)
  const 열쇠 = loc.key + '|' + loc.pathname

  useLayoutEffect(() => {
    try { if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual' } catch (e) { /* 옛 브라우저 */ }
  }, [])

  /* ① 칸 적기 — 제목은 화면이 제목을 정한 뒤(늦게) 한 번 더, 떠날 때 한 번 더 */
  useEffect(() => {
    const i = 칸번호()
    const 주소 = loc.pathname
    칸적기(i, 주소)
    const t1 = setTimeout(() => { if (칸번호() === i) 칸적기(i, 주소, document.title) }, 1500)
    return () => { clearTimeout(t1); if (i != null) 칸적기(i, 주소, document.title) }
  }, [loc.key, loc.pathname])

  /* ② 자리 적기 — 굴릴 때(0.15초 모아서) · 누를 때(떠나기 직전) · 뒤로가기 직전 */
  useEffect(() => {
    let t = 0
    const 지금적기 = () => { if (t) { clearTimeout(t); t = 0 } 자리쓰기(열쇠, window.scrollY) }
    const 굴림 = () => { if (!t) t = setTimeout(() => { t = 0; 자리쓰기(열쇠, window.scrollY) }, 150) }
    window.addEventListener('scroll', 굴림, { passive: true })
    window.addEventListener('click', 지금적기, true)
    window.addEventListener('popstate', 지금적기, true)
    window.addEventListener('pagehide', 지금적기)
    return () => {
      if (t) clearTimeout(t)
      window.removeEventListener('scroll', 굴림)
      window.removeEventListener('click', 지금적기, true)
      window.removeEventListener('popstate', 지금적기, true)
      window.removeEventListener('pagehide', 지금적기)
    }
  }, [열쇠])

  /* ③ 되돌리기 */
  useLayoutEffect(() => {
    const 같은화면 = !!(앞.current && 앞.current === loc.pathname)
    앞.current = loc.pathname
    if (종류 !== 'POP') {                 // 앞으로 가기(링크) — 다른 화면이면 맨 위, 화면 안 단계면 그대로
      if (!같은화면 && !loc.hash) window.scrollTo(0, 0)
      return undefined
    }
    const y = 자리읽기(열쇠)
    if (y == null) { if (!같은화면) window.scrollTo(0, 0); return undefined }
    /* 자료가 늦게 와서 화면이 짧으면 닿을 때까지 기다립니다(최대 3초). 그사이 손가락이 움직이면 그만둡니다. */
    let 그만 = false, n = 0, tm = 0
    const 멈춤 = () => { 그만 = true }
    window.addEventListener('wheel', 멈춤, { passive: true })
    window.addEventListener('touchstart', 멈춤, { passive: true })
    window.addEventListener('keydown', 멈춤)
    const 시도 = () => {
      if (그만) return
      const 끝 = document.documentElement.scrollHeight - window.innerHeight
      window.scrollTo(0, Math.min(y, Math.max(0, 끝)))
      if (끝 >= y - 2 || n++ > 50) { 멈춤해제(); return }
      tm = setTimeout(시도, 60)
    }
    const 멈춤해제 = () => {
      window.removeEventListener('wheel', 멈춤); window.removeEventListener('touchstart', 멈춤); window.removeEventListener('keydown', 멈춤)
    }
    시도()
    return () => { 그만 = true; clearTimeout(tm); 멈춤해제() }
  }, [열쇠])
}

/**
 * 화면 안 단계(탭·하위 화면)를 뒤로가기와 잇습니다.
 *   const [탭, set탭, 앞단계로] = use화면상태('탭', '개요')
 *   set탭('주')              → 기록 한 칸 쌓음 → 휴대폰 뒤로가기 = 앞 단계
 *   set탭('주', {replace:true}) → 쌓지 않고 바꿈(스스로 넘어갈 때)
 *   앞단계로('홈')             → 앞 칸이 이 화면이면 기록을 되감고, 아니면 '홈' 으로 바꿈(쌓지 않음)
 * 값은 기록(history.state)에 담깁니다 — 주소는 그대로, 새로고침해도 남습니다. 글자·숫자·참거짓만 담으십시오.
 */
export function use화면상태(열쇠, 기본) {
  const loc = useLocation()
  const navigate = useNavigate()
  const 담 = (loc.state && loc.state.화면) || null
  const 값 = 담 && Object.prototype.hasOwnProperty.call(담, 열쇠) ? 담[열쇠] : 기본

  /* ⚠️ 닫힌 값(loc)이 아니라 «지금 기록» 을 읽습니다 — 비동기(서버에서 불러온 뒤) 로 바꿔도,
        한 번에 두 번 바꿔도 앞의 것을 덮어쓰지 않게. 리액트 라우터는 state 를 history.state.usr 에 둡니다. */
  const 바꾸기 = useCallback((v, 옵션 = {}) => {
    const 지금st = (window.history.state && window.history.state.usr) || {}
    const 지금담 = 지금st.화면 || {}
    const 옛값 = Object.prototype.hasOwnProperty.call(지금담, 열쇠) ? 지금담[열쇠] : 기본
    const 다음 = typeof v === 'function' ? v(옛값) : v
    const 찾기 = 옵션.search != null ? 옵션.search : window.location.search
    if (다음 === 옛값 && 찾기 === window.location.search) return
    navigate({ pathname: window.location.pathname, search: 찾기, hash: window.location.hash },
      { replace: !!옵션.replace, state: { ...지금st, 화면: { ...지금담, [열쇠]: 다음 } } })
  }, [navigate, 열쇠, 기본])

  const 앞단계로 = useCallback((기본값) => {
    if (앞칸같은주소(window.location.pathname)) navigate(-1)
    else 바꾸기(기본값 === undefined ? 기본 : 기본값, { replace: true })
  }, [navigate, 바꾸기, 기본])

  /* 기록에 아직 없으면(처음 들어옴) 지금 보이는 값을 적어 둡니다 — 다른 화면에 갔다가 뒤로 오면 «보던 탭» 으로.
     (안 적으면 그 사이 바뀐 기본값 — 예: 저장이 생겨 골조가 «③ 주자료» 로 여는 것 — 으로 열립니다) */
  useEffect(() => {
    const 지금st = (window.history.state && window.history.state.usr) || {}
    const 지금담 = 지금st.화면 || {}
    if (Object.prototype.hasOwnProperty.call(지금담, 열쇠)) return
    navigate({ pathname: window.location.pathname, search: window.location.search, hash: window.location.hash },
      { replace: true, state: { ...지금st, 화면: { ...지금담, [열쇠]: 기본 } } })
  }, [])   // eslint-disable-line react-hooks/exhaustive-deps

  return [값, 바꾸기, 앞단계로]
}

/** 기록에 담긴 것(화면 단계)은 그대로 두고 주소의 ?뒤만 바꿉니다 — setSearchParams 는 state 를 지워 버립니다 */
export function 찾기만바꾸기(navigate, search, replace = true) {
  const st = (window.history.state && window.history.state.usr) || undefined
  navigate({ pathname: window.location.pathname, search, hash: window.location.hash }, { replace, state: st })
}

/**
 * 적은 것 남기기 — useState 와 같게 쓰되 브라우저에 남습니다.
 *   곳 'local'   : 이 기기에 계속(도구에 적은 값)
 *   곳 'session' : 이 탭을 닫을 때까지(검색어 — 뒤로 왔을 때 그대로)
 */
export function use남김(열쇠, 기본, 곳 = 'local') {
  const 창고 = () => { try { return 곳 === 'session' ? window.sessionStorage : window.localStorage } catch (e) { return null } }
  const [v, setV] = useState(() => {
    try {
      const s = 창고() && 창고().getItem(열쇠)
      if (s == null) return typeof 기본 === 'function' ? 기본() : 기본
      return JSON.parse(s)
    } catch (e) { return typeof 기본 === 'function' ? 기본() : 기본 }
  })
  const 최신 = useRef(v)
  최신.current = v
  const 대기 = useRef(0)
  const 저장 = (x) => { try { 창고() && 창고().setItem(열쇠, JSON.stringify(x)) } catch (e) { /* 가득 참 */ } }
  useEffect(() => {
    if (대기.current) clearTimeout(대기.current)
    대기.current = setTimeout(() => { 대기.current = 0; 저장(최신.current) }, 250)
  }, [열쇠, v])
  /* 적자마자 다른 화면으로 가도 마지막 글자까지 남게 — 떠날 때 바로 적습니다 */
  useEffect(() => () => { if (대기.current) { clearTimeout(대기.current); 대기.current = 0; 저장(최신.current) } }, [])
  return [v, setV]
}

/**
 * 이 탭에 머무는 동안만 남기기 — 사이트 안에서 다른 화면에 갔다 와도 그대로(새로고침하면 처음부터).
 * 도면·PDF 처럼 커서 창고에 넣기 어려운 것(읽은 도면, 만든 PDF 주소)에 씁니다.
 *   const [결과, set결과] = use머무름('dxfpdf.결과', null)
 *   되살릴때: 되살린 값을 손볼 함수(예: 하던 중 → 멈춤)
 */
const 머무는곳 = new Map()
export function use머무름(열쇠, 기본, 되살릴때) {
  const [v, setV] = useState(() => {
    if (머무는곳.has(열쇠)) { const x = 머무는곳.get(열쇠); return 되살릴때 ? 되살릴때(x) : x }
    return typeof 기본 === 'function' ? 기본() : 기본
  })
  useEffect(() => { 머무는곳.set(열쇠, v) }, [열쇠, v])
  return [v, setV]
}
