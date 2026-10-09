/* 🔔 알림 안내 쪽지 — 내 조건을 고른 그 순간 «하루 두 번 폰으로 알려 드릴까요?» (G222 · 2026-10-10)
 *   소장님: 「허용 안 한 사람을 못 보내면 의미가 없잖아」 → 고르심 «허용 비율 올리기»
 *           「허용하는 사람은 조건 충족시 알림해」 → 고르심 «신청한 분과 똑같이»
 *   ■ «🔔 알림 받기» = 내 조건 줄 «🔔 새 공고 알림 받기» 와 똑같은 신청(lib/관심알림.js 조건알림 · 하루 두 번 8시 · 13시 · 하던 대로).
 *     누른 그 순간(누름 안에서) 브라우저 허용 창이 뜹니다 — 차가운 첫 누름 허용 창은 없앴습니다(막는 분이 많으면 크롬이 창을 숨김).
 *   ■ 언제 · 몇 번: lib/알림안내.js 띄울까(이 탭에서 한 번 · 사흘에 한 번 · «나중에» 세 번이면 30일 쉼).
 *     지역 · 면허를 고를 때(lib/lic.js «kcm-cond») 1.5초 뒤 · 내 조건이 이미 있으면 화면을 연 지 20초 뒤 · 인사 쪽지가 떠 있으면 사라진 뒤.
 *   ■ 📊 숨은 누적: |알림|안내보임 · |알림|안내받기 · |알림|안내나중 · |알림|허용 · |알림|막음(받기 뒤 고른 것)
 */
import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { loadRegion, loadMine, loadLicCodes, loadLicNone } from './lib/lic.js'
import { 조건알림, 조건알림켜짐 } from './lib/관심알림.js'
import { 알림꺼짐 } from './lib/저절로알림.js'
import { 푸시되나 } from './lib/알림.js'
import { 세기 } from './lib/받은수.jsx'
import { 띄울까, 띄움기록, 나중에기록, 조건글, 안내열쇠, 안내탭열쇠 } from './lib/알림안내.js'

const 읽기 = () => { try { return JSON.parse(localStorage.getItem(안내열쇠) || 'null') } catch (e) { return null } }
const 쓰기 = (v) => { try { localStorage.setItem(안내열쇠, JSON.stringify(v)) } catch (e) { /* 개인 창 */ } }
const 탭봄 = () => { try { return sessionStorage.getItem(안내탭열쇠) === '1' } catch (e) { return true } }
const 지금조건 = () => {
  const rg = loadRegion()
  const 맞춤 = loadMine()
  const lic = 맞춤 ? loadLicCodes().map(String) : []
  return { rg, lic, none: !!(맞춤 && loadLicNone()) }
}
const 조건있나 = (c) => (c.rg && c.rg !== '전국') || c.lic.length > 0

export default function 알림안내() {
  const { pathname } = useLocation()
  const [보일, set보일] = useState(null)        /* null | {글} */
  const [말, set말] = useState('')
  const [바쁨, set바쁨] = useState(false)
  const [바닥, set바닥] = useState(16)
  const 시계 = useRef(null)
  const 길 = useRef(pathname)
  길.current = pathname

  const 해볼까 = (늦게) => {
    clearTimeout(시계.current)
    시계.current = setTimeout(function 보기(남은 = 15) {
      if (/^\/(admin|op)/.test(길.current)) return
      const c = 지금조건()
      const 허용 = typeof Notification === 'undefined' ? 'unsupported' : Notification.permission
      if (!띄울까({ 지원: 푸시되나(), 허용, 신청됨: 조건알림켜짐(), 꺼짐: 알림꺼짐(), 조건있음: 조건있나(c), 기록: 읽기(), 지금: Date.now(), 탭에서봄: 탭봄() })) return
      /* 인사 쪽지 · 다른 떠 있는 쪽지가 있으면 사라진 뒤에(겹치지 않게) */
      if (document.querySelector('.insa') && 남은 > 0) { 시계.current = setTimeout(() => 보기(남은 - 1), 1000); return }
      const tb = document.querySelector('.tabbar')
      const h = tb && getComputedStyle(tb).display !== 'none' ? tb.getBoundingClientRect().height : 0
      set바닥(Math.round(h) + 14)
      try { sessionStorage.setItem(안내탭열쇠, '1') } catch (e) { /* 없음 */ }
      쓰기(띄움기록(읽기(), Date.now()))
      set말('')
      set보일({ 글: 조건글(c.rg, c.lic.length) })
      세기('|알림|안내보임')
    }, 늦게)
  }

  useEffect(() => {
    const 바뀜 = () => 해볼까(1500)
    window.addEventListener('kcm-cond', 바뀜)
    해볼까(20000)                                  /* 내 조건이 이미 있는 분 — 화면을 연 지 20초 뒤 */
    return () => { window.removeEventListener('kcm-cond', 바뀜); clearTimeout(시계.current) }
  }, [])

  if (!보일) return null
  const 닫기 = () => set보일(null)
  const 나중에 = () => { 쓰기(나중에기록(읽기(), Date.now())); 세기('|알림|안내나중'); 닫기() }
  const 받기 = async () => {
    if (바쁨) return
    set바쁨(true)
    세기('|알림|안내받기')
    try {
      const m = await 조건알림(지금조건(), true)          /* ⚠️ 안에서 «await 보다 먼저» 허용 창을 띄움(누름 안) */
      try { window.dispatchEvent(new Event('kcm-cond-on')) } catch (e) { /* 없음 */ }
      const p = typeof Notification === 'undefined' ? '' : Notification.permission
      if (p === 'granted') 세기('|알림|허용')
      else if (p === 'denied') 세기('|알림|막음')
      set말(m || '내 조건 알림을 켰습니다')
      setTimeout(닫기, 6000)
    } finally { set바쁨(false) }
  }

  return (
    <div className="ask-card" role="dialog" aria-label="새 공고 알림 받기" style={{ bottom: 바닥 }}>
      {말 ? (
        <div className="ask-t"><b>✅ 신청했습니다</b><span>{말}</span></div>
      ) : (
        <div className="ask-t">
          <b>🔔 {보일.글 ? `내 조건(${보일.글})` : '내 조건'}에 맞는 새 공고, 폰으로 알려 드릴까요?</b>
          <span>평일 하루 두 번(아침 8시 · 낮 1시) 맞는 새 공고가 있을 때만 · 언제든 끌 수 있음 · 이름 · 전화번호는 받지 않습니다</span>
          <span className="ask-b">
            <button className="btn sm" onClick={받기} disabled={바쁨} data-no-ask="1">🔔 알림 받기</button>
            <button className="btn sm ghost" onClick={나중에} data-no-ask="1">나중에</button>
          </span>
        </div>
      )}
      <button className="ask-x" onClick={말 ? 닫기 : 나중에} aria-label="닫기" data-no-ask="1">✕</button>
    </div>
  )
}
