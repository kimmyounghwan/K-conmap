/**
 * 🛒 쿠팡 «분야별 베스트» 줄 (G654 · 2026-11-12 · 자료는 lib/쿠팡자료.js 한 곳)
 *   소장님 「쿠팡 광고 상품사진 올리자」 · 「쿠팡에 제일 잘 팔리는 상품순으로」 · 「업데이트 매일 매일」 · 「상품이 나오고 그 상품을 클릭하게 해줘」
 *   · 「분야별로 많이 팔린 상품 띄워주고...페이지 마다」 · 「위치도 사람들이 보기 좋은 곳으로」 → (G654) «② 목록 중간 + 나머지 맨 아래»
 *   ■ 자리(G656 · 11-12 14시 · 네이버 카페 · 뽐뿌처럼) — 소장님 「왜 제일 아래에 있어?」 → «다른 쪽은 맨 위로» · 「네이버 카폐처럼 해줘, 그리고, 뿜뿌도 참고해」
 *     («광고 다는 방식») · 「공지보기 제거 해줘」 · 「공지보기 자리에 광고달자」
 *     · 자리="위": 모든 쪽 맨 위 — 공지 띠가 있던 자리(App.jsx · 감사공지 바로 다음 · 머리줄 · 종류띠 아래 첫 줄) · 1순위 · 공고도
 *     · 자리="목록" 차례=1,2,…: 1순위 · 공고 목록 여섯째 카드 다음, 그 뒤 열 장마다(16 · 26 · 36 …) — 카페 · 뽐뿌 글 목록 사이 광고처럼
 *     · 한 쪽에 여러 줄이면 줄마다 다른 분야(lib/쿠팡자료.js 분야정하기 — 쪽에 들어올 때 정한 씨앗 하나로)
 *     · (G654 의 «바닥» 줄 · 목록 줄이 있으면 바닥을 쉬던 장치는 G656 에서 뺌)
 *   ■ 꼴: 업체 광고 칸과 같은 크림 바탕 · «광고» 딱지 · «쿠팡 ○○ 베스트» · 대가성 문구(쿠팡 «반드시 기재») 바로 아래 쿠팡 다이나믹 배너
 *     배너 안 상품 사진은 한 장 한 장 따로 눌리고 누르면 그 상품으로(link.coupang.com/re/…) · 사진은 쿠팡이 주는 가장 큰 사진(11-12 크롬 확인 857×857)
 *   ■ 쿠팡이 준 iframe 코드 그대로(referrerpolicy="unsafe-url" · 테두리 0 · 스크롤 없음) — 폭만 줄 안쪽 폭에 맞춤(폰 390 ≈ 336 · 320 ≈ 266 · PC 680) · 목록 줄은 늦게 불러옴
 *   ■ ⚡ G660 (11-12 23시) 소장님 「광고 물품 처음 뜰때 로딩 없이 바로 할 수 있다고 했지? 약간 늦게 떠」 — 처음 뜨는 속도만 줄임(넘어가는 속도는 쿠팡 몫):
 *     ① index.html 에서 쿠팡 배너 주소에 미리 연결(preconnect · dns-prefetch — ⚡ G665 부터는 dns-prefetch 만: 이 배너는 이제 카드 줄(G663) 자료를 못 받을 때만 나와서
 *        미리 연결은 카드 자료(preload) · 그림 집(preconnect)에 줌) ② 분야를 첫 그림에서 바로 정함(빈 그림 한 번 덜)
 *     ③ 폭을 그리기 전에 잼(useLayoutEffect) ④ 맨 위 줄은 바로 불러옴(eager · 목록 줄은 그대로 lazy)
 *     ⑤ 폭이 20px 안으로만 바뀌면(스크롤 막대가 생길 때 등) 배너를 다시 부르지 않음 — 전엔 key 가 바뀌어 처음부터 다시 받았음(늦게 뜬 까닭 하나)
 *   ■ 쿠팡 운영정책: 링크를 숨기지 않음 · 저절로 넘기지 않음 · 화면을 덮지 않음 · «눌러 주세요» 같은 말 없음
 *   ■ 쪽을 옮길 때마다 분야를 새로 고름(자격증 → 도서 · 서식 · 내역서 → 문구/오피스 · 도구 → 가전디지털 · 나머지는 돌림) · 인쇄에는 안 나옴 · 운영자 문의함(/admin)에는 안 나옴
 *   ■ 숨은 셈(사이트엔 안 보임 · 소장님 「클릭수 광고 숨김으로 해서 카운트 해」 · 물으시면 알려 드림):
 *     |쿠팡보임|<자리>-<분야 id>(줄이 화면에 반 넘게 들어왔을 때 한 번) · 자리 = 위 · 목록1 · 목록2 …
 *     · |쿠팡누름|<자리>-<분야 id>(배너 안을 누르면 — 쿠팡 칸은 남의 창이라 «배너 칸으로 손이 옮겨 간 것» 으로 셈 · 정확한 누른 수 · 산 것은 쿠팡 파트너스 리포트)
 *   ⚠️ 위 줄은 «써 본 횟수»(lib/씀세기.js — 씀-앞 ~ 씀-뒤 사이) 밖에 둠 — 쿠팡 줄을 누른 것이 도구 쓴 수로 세지지 않게
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { 분야정하기, 배너주소, 쿠팡문구 } from './lib/쿠팡자료.js'
import { 세기 } from './lib/받은수.jsx'

/* 씨앗 — 쪽(주소)에 들어올 때 한 번 정함 · 같은 쪽의 위 줄 · 목록 줄이 같은 씨앗으로 서로 다른 분야를 고름 */
let 씨앗 = { 길: null, 값: 0 }
const 씨앗얻기 = (길) => { if (씨앗.길 !== 길) 씨앗 = { 길, 값: Math.floor(Math.random() * 1000000) }; return 씨앗.값 }

export default function 쿠팡칸({ 자리 = '위', 차례 = 0 }) {
  const { pathname } = useLocation()
  const 쉼 = /^\/admin(\/|$)/.test(pathname)
  const 이름 = 자리 === '목록' ? '목록' + (차례 || 1) : 자리   /* 숨은 셈 자리 이름 — 위 · 목록1 · 목록2 … */
  /* ⚡ G660 ② 첫 그림에서 바로 분야(전엔 null 로 한 번 그린 뒤 정함) */
  const [분야, set분야] = useState(() => (쉼 ? null : 분야정하기(pathname, 자리 === '목록' ? (차례 || 1) : 0, 씨앗얻기(pathname))))
  const [폭, set폭] = useState(0)
  const 칸 = useRef(null)
  const 틀 = useRef(null)
  useEffect(() => { set분야(쉼 ? null : 분야정하기(pathname, 자리 === '목록' ? (차례 || 1) : 0, 씨앗얻기(pathname))) }, [pathname, 쉼, 자리, 차례])
  /* 폭 — 줄 안쪽 폭에 맞춤(240 ~ 680 · 좁은 폰 320 에서도 안 잘림) · 화면을 돌리거나 창 크기를 바꾸면 다시 */
  /* ⚡ G660 ③ 그리기 전에 잼 · ⑤ 20px 안 바뀜은 그대로(배너를 다시 안 부름 · 여유 22px 안이라 넘치지 않음) */
  useLayoutEffect(() => {
    const el = 칸.current
    if (!분야 || !el) return undefined
    const 재기 = () => { const w = Math.max(240, Math.min(680, Math.floor(el.clientWidth - 22))); set폭((옛) => (옛 > 0 && Math.abs(옛 - w) < 20 ? 옛 : w)) }
    재기()
    if (typeof ResizeObserver === 'undefined') return undefined
    const ro = new ResizeObserver(재기)
    ro.observe(el)
    return () => ro.disconnect()
  }, [분야])
  /* 숨은 셈 — 보임(반 넘게 · 한 번) · 누름(배너 칸으로 손이 옮겨 감 = 창 blur 때 배너가 활성 요소) */
  useEffect(() => {
    const el = 칸.current
    if (!분야 || !el) return undefined
    const 셈이름 = 이름 + '-' + 분야.id
    let 보임셈 = false, 누름셈 = false
    const 보임 = () => { if (보임셈) return; 보임셈 = true; try { 세기('|쿠팡보임|' + 셈이름) } catch (e) { /* 없음 */ } }
    const 누름 = () => {
      setTimeout(() => {
        if (누름셈 || !틀.current || document.activeElement !== 틀.current) return
        누름셈 = true
        try { 세기('|쿠팡누름|' + 셈이름) } catch (e) { /* 없음 */ }
      }, 0)
    }
    window.addEventListener('blur', 누름)
    let io = null
    if (typeof IntersectionObserver === 'undefined') 보임()
    else {
      io = new IntersectionObserver(([e]) => { if (e && e.isIntersecting) { 보임(); io.disconnect() } }, { threshold: 0.5 })
      io.observe(el)
    }
    return () => { window.removeEventListener('blur', 누름); if (io) io.disconnect() }
  }, [분야, 이름])
  if (쉼 || !분야) return null
  return (
    <aside className="cpg no-print" ref={칸} aria-label={`광고 — 쿠팡 ${분야.이름} 베스트`} data-cpg={분야.id} data-cpg-at={자리} data-cpg-n={이름}>
      <div className="adc-h">
        <span className="adc-tag">광고</span><span className="adc-hs">쿠팡 {분야.이름} 베스트</span>
      </div>
      <p className="cpg-dis">{쿠팡문구}</p>
      <div className="cpg-fr">
        {폭 > 0 && (
          <iframe ref={틀} key={분야.id + '|' + 폭} title={`쿠팡 ${분야.이름} 베스트 상품`} src={배너주소(분야, 폭, 140)}
            width={폭} height="140" frameBorder="0" scrolling="no" referrerPolicy="unsafe-url" loading={자리 === '위' ? 'eager' : 'lazy'} />
        )}
      </div>
    </aside>
  )
}
