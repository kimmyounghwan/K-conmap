/**
 * 📣 업체 광고 칸 — 한 쪽에 한 번 (2026-11-05 · 자료는 lib/광고자료.js 한 곳)
 *   소장님 「광고는 항상 나오게」 · 「한 페이지에 한번씩만」 · 「구별이 안돼, 광고인지, 사이트 내용인지?」 · 「보증하지 않습니다 … 빼줘」
 *   ■ 꼴: 크림 바탕 · 주황 테두리 · 맨 위 «광고 · 업체 소개» 띠(추천 업체는 «광고 · 👍 K-건설맵 추천» + 이름 아래 추천 한 줄) · 갈색 단추 — 업체를 깎는 말 없음
 *   ■ 📞 단추에 번호가 보임(PC 에서도 읽힘 · 폰은 누르면 전화) · 💬 문자 · 작은 줄(사무실 · 팩스) · 보험은 심의필 줄
 *   ■ 숨은 셈(사이트엔 안 보임): |광고보임|<id>(화면에 반 넘게 들어왔을 때 한 번) · |광고전화|<id> · |광고문자|<id>
 *   ■ 인쇄에는 안 나옴(no-print)
 */
import { useEffect, useRef, useState } from 'react'
import { 자리광고, 전화숫자 } from './lib/광고자료.js'
import { 세기 } from './lib/받은수.jsx'

export default function 광고칸({ 자리, 오늘, 고르기 }) {
  const [a] = useState(() => 자리광고(자리, 오늘, 고르기))
  const 칸 = useRef(null)
  useEffect(() => {
    const el = 칸.current
    if (!a || !el) return undefined
    let 셈 = false
    const 보임 = () => { if (셈) return; 셈 = true; try { 세기('|광고보임|' + a.id) } catch (e) { /* 없음 */ } }
    if (typeof IntersectionObserver === 'undefined') { 보임(); return undefined }
    const io = new IntersectionObserver(([e]) => { if (e && e.isIntersecting) { 보임(); io.disconnect() } }, { threshold: 0.5 })
    io.observe(el)
    return () => io.disconnect()
  }, [a])
  if (!a) return null
  const 번호 = 전화숫자(a.전화)
  const 누름 = (무엇) => () => { try { 세기(`|광고${무엇}|` + a.id) } catch (e) { /* 없음 */ } }
  return (
    <aside className="adc no-print" ref={칸} aria-label={`광고 — ${a.이름}`} data-ad={a.id}>
      <div className="adc-h"><span className="adc-tag">광고</span><span className="adc-hs">{a.추천 ? '👍 K-건설맵 추천' : '업체 소개'}</span></div>
      <div className="adc-b">
        <div className="adc-nm"><span className="adc-ic" aria-hidden="true">{a.아이콘}</span>{a.이름}</div>
        {a.소속 && <div className="adc-so">{a.소속}</div>}
        {a.추천 && <div className="adc-rec">{a.추천}</div>}
        <p className="adc-one">{a.한줄}{a.지역 ? <> · 📍 {a.지역}</> : null}</p>
        {a.칩 && a.칩.length > 0 && <div className="adc-chips">{a.칩.map((t) => <span key={t} className="adc-chip">{t}</span>)}</div>}
        <div className="adc-btns">
          <a className="adc-call" href={'tel:' + 번호} onClick={누름('전화')} aria-label={`${a.이름}에 전화 ${a.전화}`}>📞 {a.전화}</a>
          <a className="adc-sms" href={'sms:' + 번호} onClick={누름('문자')} aria-label={`${a.이름}에 문자`}>💬 문자</a>
        </div>
        {a.작은줄 && <div className="adc-sub">{a.작은줄}</div>}
        {a.심의 && <div className="adc-sub adc-sim">{a.심의}</div>}
      </div>
    </aside>
  )
}
