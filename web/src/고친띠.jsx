/* 🆕 «UP» 단추 · 업데이트 내용 창 (G757 띠 · 🔁 G767 2026-11-18 단추로) — 자료 · 셈은 lib/고친것.js (web/public/fixes.json 한 곳)
 *   소장님 11-18 「도구마다 서식마다 업데이트가 되면 조그마한 단추 만들고 클릭하면 업데이트 내용을 보이게 하면 안돼??」
 *     → 기획 → 「화면 안도 작은 단추로」 · 「(빨간 «새로» 표는) 모든 목록에서 뺌」
 *   ■ 목록(도구 · 서식 · 마이컨맵 단축키): 이름 옆 초록 «UP» 이 곧 단추 — 누르면 그 밑에 작은 창(날짜 · 무엇이 좋아졌나 · 새것부터) · 도구로 안 넘어감
 *   ■ 화면 안(고친 도구 · 서식): 옛 띠 대신 제목 옆 같은 «UP» 단추 — 제목 = 본문(#씀-앞 ~ #씀-뒤) 첫 h1 · 서식 .fp-title
 *     (화면을 하나하나 고치지 않음 — 새 화면도 제목만 있으면 붙음) · 제목이 없는 화면은 그 자리(길 줄 밑 · 씀-앞 «밖»)에 단추 한 줄
 *   ■ 창: 바깥을 누르거나 Esc · ✕ 로 닫힘 · 화면 폭 안 · 문서 기준 자리(absolute — 내려도 단추 밑) · 2주 안 고친 것 모두 · 로봇 · 인쇄엔 없음
 *   ■ 🏗 G769 (11-18) 소장님 「적산 컨맵에도 업데이트 내용 기제해줘」 — K-적산컨맵(/jeoksan/model 줄): 적산 첫 화면 카드 · 작업 화면 막대에도 «UP»(pages/Jeoksan.jsx · Model.jsx 업표)
 *     작업 화면은 덮는 판(fixed · z 1200)이라 창을 그 판 위로(판높이)
 *   ■ 숨은 셈: |업그레이드|보임(화면 안 단추가 보일 때 줄마다 한 번) · |업그레이드|단추(창을 열 때)
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation } from 'react-router-dom'
import { use고친것 } from './lib/고친것.js'
import { 이곳 } from './lib/고친것셈.js'
import { 로봇 as 로봇글 } from './lib/인사.js'
import { 세기 } from './lib/받은수.jsx'

const 로봇 = () => { try { return 로봇글(navigator.userAgent || '') } catch (e) { return false } }
const 날짜 = (x) => { const m = String(x && x.d).match(/^\d{4}-(\d{2})-(\d{2})/); return m ? `${+m[1]}. ${+m[2]}.` : '' }
const 센것 = new Set()   // 이 탭에서 «보임» 은 줄마다 한 번만
/* 창 안을 눌러도 카드(링크)로 안 넘어가게 — body 에 붙인 창이라도 React 이벤트는 부모(링크)로 올라감 */
const 막기 = (e) => { e.stopPropagation(); e.preventDefault() }
/* 🩹 G769 (11-18) 덮는 판(적산컨맵 작업 화면 .gmd-ws — fixed · z-index 1200) 안의 단추면 창을 그 판보다 위로 — 아니면 창(62)이 판 뒤에 숨음
   단추에서 위로 올라가며 자리 잡힌 칸(position 이 static 아님)의 z-index 가운데 가장 큰 것 · 보통 쪽은 0 → CSS 62 그대로 */
const 판높이 = (el) => {
  let z = 0
  try {
    for (let n = el; n && n !== document.body; n = n.parentElement) {
      const s = getComputedStyle(n)
      if (s.position !== 'static') { const v = parseInt(s.zIndex, 10); if (v > z) z = v }
    }
  } catch (e) { /* 없음 */ }
  return z
}

/** 업데이트 내용 창 — body 에 붙임(카드 · 링크 · 제목 밖) · 단추 바로 밑 · 화면 폭 안 */
function 업창({ 줄들, 기준, 닫기 }) {
  const 창 = useRef(null)
  const [자리, set자리] = useState(null)
  useLayoutEffect(() => {
    const 맞춤 = () => {
      const b = 기준.current, w = 창.current
      if (!b || !w) return
      const r = b.getBoundingClientRect(), 폭 = w.offsetWidth, 쪽폭 = document.documentElement.clientWidth
      const 왼 = Math.max(8, Math.min(r.left, 쪽폭 - 폭 - 8))
      set자리({ top: Math.round(r.bottom + window.scrollY + 6), left: Math.round(왼 + window.scrollX), z: 판높이(b) })
    }
    맞춤()
    window.addEventListener('resize', 맞춤)
    return () => window.removeEventListener('resize', 맞춤)
  }, [기준])
  useEffect(() => {
    const 밖 = (e) => { const w = 창.current, b = 기준.current; if ((w && w.contains(e.target)) || (b && b.contains(e.target))) return; 닫기() }
    const 키 = (e) => { if (e.key === 'Escape') { 닫기(); try { if (기준.current) 기준.current.focus() } catch (x) { /* 없음 */ } } }
    document.addEventListener('pointerdown', 밖, true)
    document.addEventListener('keydown', 키)
    return () => { document.removeEventListener('pointerdown', 밖, true); document.removeEventListener('keydown', 키) }
  }, [기준, 닫기])
  return createPortal(
    <div className="up-pop" role="dialog" aria-label="업데이트 내용" ref={창} onClick={막기}
         style={자리 ? { top: 자리.top, left: 자리.left, ...(자리.z >= 62 ? { zIndex: 자리.z + 1 } : {}) } : { top: 0, left: 0, visibility: 'hidden' }}>
      <div className="up-pop-h">
        <b>🆕 업데이트</b>
        <button type="button" className="up-pop-x" aria-label="업데이트 내용 닫기" onClick={(e) => { 막기(e); 닫기() }}>✕</button>
      </div>
      <ul className="up-pop-l">
        {줄들.map((x) => <li key={x.p + '|' + x.d}><b>{날짜(x)}</b> {x.m}</li>)}
      </ul>
    </div>,
    document.body)
}

/** 작은 «UP» 단추 — 누르면 업데이트 내용 창(목록 카드 · 단축키 · 화면 제목 옆 모두 같은 모양) */
export function 업단추({ 줄들, className = '' }) {
  const [열림, set열림] = useState(false)
  const 기준 = useRef(null)
  const 닫기 = useCallback(() => set열림(false), [])
  const 누름 = (e) => {
    막기(e)
    const 다음 = !열림
    if (다음) 세기('|업그레이드|단추')
    set열림(다음)
  }
  if (!줄들 || !줄들.length) return null
  return (
    <>
      <span ref={기준} role="button" tabIndex={0} aria-haspopup="dialog" aria-expanded={열림} title="눌러서 업데이트 내용 보기"
            className={'tlx-new up-b up-btn' + (className ? ' ' + className : '')}
            onClick={누름} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') 누름(e) }}>UP</span>
      {열림 && <업창 줄들={줄들} 기준={기준} 닫기={닫기} />}
    </>
  )
}

/** 본문(#씀-앞 ~ #씀-뒤) 첫 제목(도구 h1 · 서식 .fp-title)에 단추 자리(span)를 붙임 — 제목이 늦게 뜨는 화면도 지켜보다 붙임 */
function use제목자리(켬, 길) {
  const [자리, set자리] = useState(null)
  useEffect(() => {
    if (!켬) { set자리(null); return undefined }
    let 꺼짐 = false, 틀 = 0, 내자리 = null
    const 찾기 = () => {
      const 앞 = document.getElementById('씀-앞')
      let n = 앞 && 앞.nextElementSibling
      while (n && n.id !== '씀-뒤') {
        const h = n.matches('h1, .fp-title') ? n : n.querySelector('h1, .fp-title')
        if (h) return h
        n = n.nextElementSibling
      }
      return null
    }
    const 맞춤 = () => {
      틀 = 0
      if (꺼짐) return
      const h = 찾기()
      if (내자리 && h && 내자리.parentNode === h) return
      if (내자리 && 내자리.parentNode) 내자리.parentNode.removeChild(내자리)
      내자리 = null
      if (h) { 내자리 = document.createElement('span'); 내자리.className = 'up-slot'; h.appendChild(내자리) }
      set자리(내자리)
    }
    const 곧 = () => { if (!틀) 틀 = requestAnimationFrame(맞춤) }
    맞춤()
    const 앞 = document.getElementById('씀-앞')
    const mo = 앞 && 앞.parentElement ? new MutationObserver(곧) : null
    if (mo) mo.observe(앞.parentElement, { childList: true, subtree: true })
    return () => {
      꺼짐 = true
      if (mo) mo.disconnect()
      if (틀) cancelAnimationFrame(틀)
      if (내자리 && 내자리.parentNode) 내자리.parentNode.removeChild(내자리)
    }
  }, [켬, 길])
  return 자리
}

/** 화면 안 — 고친 도구 · 서식이면 제목 옆 «UP» 단추(App.jsx 한 곳 · 길 줄 밑 · 씀-앞 «밖» 이라 도구 «써 본 횟수» 로 안 셈) */
export default function 고친띠() {
  const { pathname } = useLocation()
  const 요 = use고친것()
  const 줄들 = 이곳(요, pathname)
  const 맨 = 줄들[0]
  const 보임 = !!맨 && !로봇()
  const 열쇠 = 맨 ? `${맨.p}|${맨.d}` : ''
  const 자리 = use제목자리(보임, pathname)
  useEffect(() => {
    if (!보임 || 센것.has(열쇠)) return
    센것.add(열쇠)
    세기('|업그레이드|보임')
  }, [보임, 열쇠])
  if (!보임) return null
  if (자리) return createPortal(<업단추 줄들={줄들} />, 자리)
  return <div className="up-line"><업단추 줄들={줄들} /></div>
}

/** 목록 카드 · 단축키의 «UP» — 2주 안에 좋아진 칸이면(누르면 그 칸의 업데이트 내용) */
export function 업표({ to, className = '' }) {
  const 요 = use고친것()
  if (!to) return null
  return <업단추 줄들={요.filter((x) => x.p === to)} className={className} />
}
