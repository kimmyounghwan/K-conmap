/**
 * 💰 G666 카카오 애드핏 광고 칸 (2026-11-13) — 규칙 · 광고단위 · 뺀 쪽은 lib/애드핏.js 한 곳
 *   자리="끝": 모든 쪽 본문 끝(App.jsx — 씀-뒤 다음 · 쿠팡 바닥 줄 앞 · 넉넉히 띄움) · 자리="목록": 1순위 · 공고 목록 카드 사이(다른 광고 줄과 세 장 넘게 떨어짐)
 *   ■ 그리는 차례: ① 뺀 쪽 · 틀(iframe) 안 · 등록 안 한 집이면 아무것도 안 그림
 *     ② 칸 폭을 재서 판(폰 · PC)을 정하고 광고 크기만큼 자리를 «먼저» 잡음(늦게 와도 글이 밀리지 않음 — 운영정책 5.3.1 «광고가 배치되는 공간은 고정»)
 *     ③ 0.4초 뒤 그 쪽에 비밀번호 칸이 보이거나(본인확인 · 입력 중) 검색 제외(noindex — 없는 쪽)면 접음 · 아니면 애드핏이 준 코드 그대로(ins + 스크립트) 넣음
 *     ④ 광고가 없거나(애드핏 NO-AD 콜백) 스크립트를 못 받으면(막힘) 칸을 접음 — 빈 자리를 남기지 않음
 *   ■ 숨은 셈(사이트엔 안 보임 · 소장님이 물으면): |애드핏보임|<자리>-<판>(칸이 반 넘게 보일 때 한 번) · |애드핏채움|<자리>-<판>(광고가 그려짐) · |애드핏빔|<자리>-<판>(광고 없음 · 못 받음)
 *     · «누름» 은 세지 않음 — 운영정책 5.4 «광고를 클릭하는 방문자의 개인정보를 어떤 방식으로든 수집» 금지(누른 수 · 수익은 애드핏 보고서)
 *   ■ 인쇄 · 그림 PDF 에 안 찍힘(no-print · 찍는 판 밖) · 쪽을 옮기면 새로 그림(App.jsx key = 주소)
 *   ⚠️ 시험(tools/시험_애드핏화면.mjs)은 window.__KCM_AFIT_TEST 로 집 검사만 넘기고 스크립트는 가짜로 받음 — 사이트에선 k-conmap.com 에서만 부름
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { 애드핏스크립트, 애드핏단위, 애드핏집, 애드핏쉼, 애드핏판, 애드핏콜백이름 } from './lib/애드핏.js'
import { 세기 } from './lib/받은수.jsx'

const 틀안 = () => { try { return window.self !== window.top } catch (e) { return true } }
const 부를곳 = () => { try { return 애드핏집(window.location.hostname) || window.__KCM_AFIT_TEST === true } catch (e) { return false } }
/** 이 쪽에 지금 보이는 비밀번호 칸(애드핏 칸 밖)이 있나 — 본인확인 · 입력 중인 단계엔 광고 안 띄움(5.3.1) */
const 비번칸 = () => [...document.querySelectorAll('main input[type="password"]')].some((el) => {
  if (el.closest('aside.afit')) return false
  const r = el.getBoundingClientRect()
  return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'
})
const 숨긴쪽 = () => !!document.querySelector('meta[name="robots"][content*="noindex"]')
const 셈 = (k) => { try { 세기(k) } catch (e) { /* 없음 */ } }
/* 광고 칸이 화면에 조금이라도 보이는 동안 html.afit-in — 폰의 떠 있는 «+» 찍기 단추(찍기단추.jsx · 오른쪽 가장자리)를 잠깐 숨김:
   지나가며 광고 오른쪽 끝을 덮거나 «+» 를 누르려다 광고를 누르지 않게(운영정책 5.3.1 «실수로 클릭할 수 있는 버튼 및 기타 객체 가까이에 광고 배치 금지») */
const 보이는칸 = new Set()
const 보임표시 = () => { try { document.documentElement.classList.toggle('afit-in', 보이는칸.size > 0) } catch (e) { /* 없음 */ } }
/* ⚠️ 광고 칸 자체를 투명 · 숨김(visibility · opacity)으로 가리지 않음 — 가린 채 애드핏이 «보임» 으로 셀 수 있음(숨긴 광고 = 부정 노출 · 5.4 무효 활동). 접을 땐 칸을 통째로 뺌 */

export default function 애드핏칸({ 자리 = '끝' }) {
  const { pathname } = useLocation()
  const 칸 = useRef(null)
  const 상자 = useRef(null)
  const [끔, set끔] = useState(() => 애드핏쉼(pathname) || 틀안() || !부를곳())
  const [판, set판] = useState(null)
  const [채움, set채움] = useState(false)

  /* ② 폭 → 판(그리기 전에 · 한 번만 — 창 크기를 바꿔도 이 쪽에선 그대로: 광고 자리가 바뀌지 않게) · 칸(aside) 폭 = 본문 폭 */
  useLayoutEffect(() => {
    if (끔 || 판 || !칸.current) return
    set판(애드핏판(칸.current.getBoundingClientRect().width))
  }, [끔, 판])

  /* 화면을 돌려(가로 → 세로) 칸이 PC 광고(728)보다 좁아지면 폰 광고로 한 번 바꿈 — 화면 밖으로 넘치지 않게(그때 새 광고를 부름 · 사람이 돌렸을 때만) */
  useEffect(() => {
    if (끔 || 판 !== 'PC' || !칸.current || typeof ResizeObserver === 'undefined') return undefined
    const ro = new ResizeObserver(() => { const el = 칸.current; if (el && el.getBoundingClientRect().width + 28 < 애드핏단위.끝.PC.w) { set채움(false); set판('폰') } })
    ro.observe(칸.current)
    return () => ro.disconnect()
  }, [끔, 판])

  /* ③ ④ 넣기 · 접기 · 셈 */
  useEffect(() => {
    if (끔 || !판 || !상자.current) return undefined
    const u = (애드핏단위[자리] || 애드핏단위.끝)[판]
    const 셈이름 = `${자리}-${판}`
    let 살아 = true
    let 다셈 = false
    const 접기 = () => { if (!살아) return; if (!다셈) { 다셈 = true; 셈('|애드핏빔|' + 셈이름) } set끔(true) }
    const 실패 = 애드핏콜백이름(자리, 'fail')
    const 받음 = 애드핏콜백이름(자리, 'load')
    let ins = null
    let 몇번 = 0
    /* 쪽 몸통(늦게 받는 쪽 — 빈 틀 .skel)이 다 뜬 뒤에 본다: 비밀번호 칸이 늦게 그려져도 놓치지 않게 · 10초 넘게 안 뜨면(끊김) 접음 */
    const 해보기 = () => {
      if (!살아 || !상자.current) return
      const 뜨는중 = [...document.querySelectorAll('main .skel')].some((x) => !x.closest('aside.afit'))
      if (뜨는중 && 몇번++ < 33) { 때 = setTimeout(해보기, 300); return }
      if (뜨는중 || 비번칸() || 숨긴쪽()) { set끔(true); return }
      ins = document.createElement('ins')
      ins.className = 'kakao_ad_area'
      ins.style.display = 'none'
      ins.setAttribute('data-ad-unit', u.id)
      ins.setAttribute('data-ad-width', String(u.w))
      ins.setAttribute('data-ad-height', String(u.h))
      ins.setAttribute('data-ad-onfail', 실패)
      ins.setAttribute('data-ad-onload', 받음)
      window[실패] = (el) => { if (el === ins || !el) 접기() }
      window[받음] = (el) => { if ((el === ins || !el) && 살아 && !다셈) { 다셈 = true; set채움(true); 셈('|애드핏채움|' + 셈이름) } }
      const s = document.createElement('script')
      s.type = 'text/javascript'
      s.async = true
      s.src = 애드핏스크립트
      s.onerror = 접기
      상자.current.appendChild(ins)
      상자.current.appendChild(s)
    }
    let 때 = setTimeout(해보기, 400)
    /* 보임 — 칸이 반 넘게 화면에 들어오면 한 번 */
    let io = null, io2 = null
    const 나 = 칸.current
    if (나 && typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(([e]) => { if (e && e.isIntersecting) { 셈('|애드핏보임|' + 셈이름); io.disconnect() } }, { threshold: 0.5 })
      io.observe(나)
      io2 = new IntersectionObserver(([e]) => { if (e && e.isIntersecting) 보이는칸.add(나); else 보이는칸.delete(나); 보임표시() }, { threshold: 0 })
      io2.observe(나)
    }
    const 상자칸 = 상자.current
    return () => { 살아 = false; clearTimeout(때); if (io) io.disconnect(); if (io2) io2.disconnect(); 보이는칸.delete(나); 보임표시(); if (상자칸) 상자칸.textContent = '' }
  }, [끔, 판, 자리])

  if (끔) return null
  const u = 판 ? (애드핏단위[자리] || 애드핏단위.끝)[판] : null
  return (
    <aside ref={칸} className={'afit no-print afit-' + (자리 === '목록' ? 'list' : 'end') + (채움 ? ' on' : '')} aria-label="광고" data-afit={자리} data-afit-pan={판 || ''} data-afit-unit={u ? u.id : ''}>
      <div className="afit-h">광고</div>
      {/* 가운데(styles.css .afit — 세로 flex · 가운데 맞춤) · 본문보다 넓으면(폰 320 — 본문 292) 양옆 여백으로 고르게 내밂(화면 밖으로는 안 나감) */}
      <div ref={상자} className="afit-box" style={u ? { width: u.w, height: u.h } : { height: 0 }} />
    </aside>
  )
}
