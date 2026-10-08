/* 🏠 한 집 세 방 — 맨 위 «종류 띠» [🏗 공사] [📐 용역] [📦 물품] (G194c · 2026-10-08)
 *
 * 소장님(미리보기 폰 캡처 /svc/first): 「위 쪽에도 아래에도 1순위, 공고가 있잖아. 이건 이상하잖아」
 *   → 「페이지를 완전히 분리 시켜버리면 안돼. 공사 만들어 놓은 것 처럼 용역과 물품을 하나씩 더 만들어 버리면 사용자 입장에서 편하지 않나」
 *   → (폰은 «공사 ▾» 하나로 접자는 안에) 「사용자가 공사를 클릭해야 용역이나, 물품으로 간다면, ...모르는 사용자는」 → 「미리보기 보자」
 *
 * ■ 방(종류)은 맨 위 머리줄 바로 아래 «띠» 하나 — 폰 · PC 같은 모양, 셋 다 늘 보임(접지 않음 · 모르는 사람도 «용역 · 물품도 있구나»)
 *     지금 방만 색을 채움(공사 파랑 · 용역 초록 · 물품 주황) · 나머지는 테두리
 *     🩹 G198 머리줄 «밖» — 위에 붙지 않음(내리면 같이 올라감). 머리줄 안에 두었더니 머리줄이 50→93px 가 되어 «머리줄 아래 붙는 칸» 이 가려졌음
 * ■ 공고 · 1순위는 «아래 탭» 만 — 아래 탭이 지금 방을 따라감(용역 방이면 1순위 → 용역 1순위). 화면 안 두 줄(옛 종류줄)은 뺌.
 * ■ 방 고르기: 띠를 누르면 «보던 쪽» 그대로(공고 ↔ 공고 · 1순위 ↔ 1순위) · 함께 쓰는 화면(맵톡 · 서식 · 도구 …)에서 누르면 그 방 첫 화면
 *     (공사 = 바로투찰 · 용역 · 물품 = 공고 — 용역 · 물품 바로투찰은 아직 없음)
 * ■ 기억: 마지막에 본 방(공사 화면 · 용역 화면 · 물품 화면)을 이 브라우저에 적어 둠 → 함께 쓰는 화면에서도 그 방 색 · 아래 탭이 그 방
 *     다음에 첫 화면(/)으로 들어오면 용역 · 물품 방이던 분은 그 방 공고가 먼저 열림(세션마다 한 번 · 주소에 ? # 가 붙으면 안 바꿈)
 * ■ 처음 온 분께 한 번 «어떤 일을 하세요?» (종류물음) — 다른 조르는 띠(앱 설치 · 처음이세요?)가 떠 있으면 비켜 줌
 * ■ 숨은 누적: |종류띠|공사 · 용역 · 물품(띠 누름) · |종류물음|공사 · 용역 · 물품 · 건너뜀 · |종류|바로열림용역 · 바로열림물품
 */
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { 세기 } from './lib/받은수.jsx'

export const 종류들 = [
  { k: 'con', ic: '🏗', 이름: '공사', live: '/live', first: '/first', calc: '/', home: '/' },
  { k: 'svc', ic: '📐', 이름: '용역', live: '/svc', first: '/svc/first', calc: '/svc/calc', home: '/svc' },     /* 💰 G194d calc = 용역 바로투찰 */
  { k: 'goods', ic: '📦', 이름: '물품', live: '/goods', first: '/goods/first', calc: '/goods/calc', home: '/goods' },
]
export const 종류찾기 = (k) => 종류들.find((x) => x.k === k) || 종류들[0]
const 기억열쇠 = 'kcm.kind'
const 물음열쇠 = 'kcm.kind.asked'
const 열림열쇠 = 'kcm.kind.landed'

/** 그 주소가 «어느 방» 화면인지 — 함께 쓰는 화면이면 null */
export function 쪽종류(path = '') {
  if (path === '/svc' || path.startsWith('/svc/')) return 'svc'
  if (path === '/goods' || path.startsWith('/goods/')) return 'goods'
  if (['/', '/calc', '/live', '/first', '/pre'].includes(path) || path.startsWith('/notice/')) return 'con'
  return null
}
/** 공고 / 1순위 / 바로투찰 / 셋 다 아님 */
export function 쪽보기(path = '') {
  if (path === '/' || path === '/calc' || path === '/svc/calc' || path === '/goods/calc') return 'calc'
  if (path === '/first' || path === '/svc/first' || path === '/goods/first') return 'first'
  if (['/live', '/pre', '/svc', '/svc/live', '/goods', '/goods/live'].includes(path)) return 'live'
  return null
}
export function 기억종류() {
  try { const v = localStorage.getItem(기억열쇠); return 종류들.some((x) => x.k === v) ? v : null } catch (e) { return null }
}
function 기억하기(k) {
  if (기억종류() === k) return
  try { localStorage.setItem(기억열쇠, k) } catch (e) { /* 사생활 창 */ }
  try { window.dispatchEvent(new Event('kcm-kind')) } catch (e) { /* 없음 */ }
}
/** 지금 방(화면이 다시 그려지게 — 방을 기억만 바꿔도 띠 색 · 아래 탭이 따라옴) */
export function use지금종류() {
  const { pathname } = useLocation()
  const [, 틱] = useState(0)
  useEffect(() => {
    const f = () => 틱((n) => n + 1)
    window.addEventListener('kcm-kind', f)
    window.addEventListener('storage', f)
    return () => { window.removeEventListener('kcm-kind', f); window.removeEventListener('storage', f) }
  }, [])
  return 지금종류(pathname)
}
/** 지금 방 — 방 화면이면 그 방 · 함께 쓰는 화면이면 기억한 방(없으면 공사) */
export const 지금종류 = (path) => 쪽종류(path) || 기억종류() || 'con'
/** 방을 바꿀 때 갈 곳 — 보던 쪽(공고/1순위) 그대로, 아니면 그 방 첫 화면 */
export function 갈곳(k, path) {
  const 보기 = 쪽보기(path), 종 = 종류찾기(k)
  return 보기 ? 종[보기] : 종.home
}

/** App 에서 한 번 — 방 기억 · 첫 화면(/)으로 다시 온 용역 · 물품 손님은 그 방으로 */
export function use종류기억() {
  const { pathname, search, hash } = useLocation()
  const nav = useNavigate()
  const 처음 = useRef(true)
  useEffect(() => {
    const 첫 = 처음.current
    처음.current = false
    const 기억 = 기억종류()
    if (첫 && pathname === '/' && !search && !hash && (기억 === 'svc' || 기억 === 'goods')) {
      let 이미 = true
      try { 이미 = sessionStorage.getItem(열림열쇠) === '1'; sessionStorage.setItem(열림열쇠, '1') } catch (e) { /* 못 읽으면 안 바꿈 */ }
      if (!이미) { 세기('|종류|바로열림' + 종류찾기(기억).이름); nav(종류찾기(기억).home, { replace: true }); return }
    }
    try { sessionStorage.setItem(열림열쇠, '1') } catch (e) { /* 없음 */ }
    const k = 쪽종류(pathname)
    if (k) 기억하기(k)
  }, [pathname])   // eslint-disable-line react-hooks/exhaustive-deps
}

/** 머리줄 아래 띠 */
export default function 종류띠() {
  const { pathname } = useLocation()
  const 지금 = use지금종류()
  return (
    <nav className="kindstrip" aria-label="공사 · 용역 · 물품">
      <div className="kindstrip-in">
        {종류들.map((x) => (
          <Link key={x.k} to={갈곳(x.k, pathname)} className={'ks ks-' + x.k + (x.k === 지금 ? ' on' : '')}
            aria-current={x.k === 지금 ? 'page' : undefined}
            onClick={() => { 기억하기(x.k); try { localStorage.setItem(물음열쇠, '1') } catch (e) { /* 없음 */ } if (x.k !== 지금) 세기('|종류띠|' + x.이름) }}>
            <span className="ks-ic" aria-hidden="true">{x.ic}</span>{x.이름}
          </Link>
        ))}
      </div>
    </nav>
  )
}

/** 처음 온 분께 한 번 — «어떤 일을 하세요?» */
export function 종류물음() {
  const { pathname } = useLocation()
  const nav = useNavigate()
  const [보임, set보임] = useState(false)
  useEffect(() => {
    let 물음 = true
    try { 물음 = localStorage.getItem(물음열쇠) === '1' } catch (e) { /* 못 읽으면 안 물음 */ }
    if (물음) { set보임(false); return undefined }
    /* 조르는 띠는 한 번에 하나만(FirstBar 와 같은 규칙) — 앱 설치 · 처음이세요? 가 떠 있으면 이번엔 비켜 줌 */
    const t = setTimeout(() => set보임(!document.querySelector('.installbar, .firstbar')), 900)
    return () => clearTimeout(t)
  }, [pathname])
  if (!보임) return null
  const 끝 = () => { try { localStorage.setItem(물음열쇠, '1') } catch (e) { /* 없음 */ } set보임(false) }
  const 고름 = (x) => {
    끝(); 기억하기(x.k); 세기('|종류물음|' + x.이름)
    /* 방 화면(다른 방)에 있을 때만 옮김 — 맵톡 · 서식처럼 함께 쓰는 화면에서는 그 자리 그대로(띠 색 · 아래 탭만 바뀜) */
    const 여기 = 쪽종류(pathname)
    /* 💰 G194d 첫 화면(공사 바로투찰)에서 고르면 그 방 «공고» 로(용역 · 물품 바로투찰 빈 칸보다 공고가 먼저 보이게) */
    if (여기 && 여기 !== x.k) nav(쪽보기(pathname) === 'calc' ? 종류찾기(x.k).home : 갈곳(x.k, pathname))
  }
  return (
    <div className="kindask" role="group" aria-label="어떤 일을 하세요?">
      <div className="kindask-t"><b>어떤 일을 하세요?</b> 고르시면 다음부터 그 화면이 먼저 열립니다.</div>
      <div className="kindask-b">
        {종류들.map((x) => (
          <button key={x.k} type="button" className={'ks ks-' + x.k} onClick={() => 고름(x)}>
            <span className="ks-ic" aria-hidden="true">{x.ic}</span>{x.이름}
          </button>
        ))}
        <button type="button" className="kindask-x" onClick={() => { 끝(); 세기('|종류물음|건너뜀') }}>건너뛰기</button>
      </div>
    </div>
  )
}
