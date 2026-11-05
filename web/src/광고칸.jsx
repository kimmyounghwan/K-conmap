/**
 * 📣 업체 광고 칸 — 한 쪽에 한 번 (2026-11-05 · 자료는 lib/광고자료.js 한 곳)
 *   소장님 「광고는 항상 나오게」 · 「한 페이지에 한번씩만」 · 「구별이 안돼, 광고인지, 사이트 내용인지?」 · 「보증하지 않습니다 … 빼줘」
 *   ■ 꼴: 크림 바탕 · 주황 테두리 · 맨 위 «광고 · 업체 소개» 띠(추천 업체는 «광고 · 👍 K-건설맵 추천» + 이름 아래 추천 한 줄) · 갈색 단추 — 업체를 깎는 말 없음
 *   ■ 📞 단추에 번호가 보임(PC 에서도 읽힘 · 폰은 누르면 전화) · 💬 문자 · 보험은 심의필 줄
 *   ■ 아래 두 칸 표(정보) — 사무실 · 메일 · 주소 · 고객센터(명함 그대로 · 소장님 「다 넣어 줘」 「깔끔하게」) · 메일은 누르면 메일 쓰기 · 정보가 없으면 옛 작은 줄
 *   ■ 숨은 셈(사이트엔 안 보임): |광고보임|<id>(화면에 반 넘게 들어왔을 때 한 번) · |광고전화|<id> · |광고문자|<id>
 *   ■ 인쇄에는 안 나옴(no-print)
 *   ■ 📣 G549 위 띠 오른쪽 «광고 · 제휴 문의 →»(/ad · |광고문의|카드 · 소장님 「광고나 제휴잖아」 — 광고만 적지 않기) — 소장님 「광고, 제휴 문의 한다는 걸 알려야 문의가 들어 오잖아. 모든 페이지에」
 *     광고카드({ a, 견본 }) — /ad 안내 쪽 견본도 같은 꼴(견본은 전화 · 문자 · 메일이 눌리지 않고 셈도 안 함)
 */
import { Fragment, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
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
  return <광고카드 a={a} 칸={칸} />
}

/** 광고 카드 한 장 — 광고칸 · /ad 견본이 같이 씀(견본: 눌리지 않음 · 셈 안 함 · «견본» 띠) */
export function 광고카드({ a, 칸 = null, 견본 = false }) {
  const 번호 = 전화숫자(a.전화)
  const 누름 = (무엇) => () => { if (견본) return; try { 세기(`|광고${무엇}|` + a.id) } catch (e) { /* 없음 */ } }
  const 단추 = (cls, href, 글, 이름) => (견본
    ? <span className={cls} aria-label={이름}>{글}</span>
    : <a className={cls} href={href} onClick={누름(cls === 'adc-call' ? '전화' : '문자')} aria-label={이름}>{글}</a>)
  return (
    <aside className={'adc no-print' + (견본 ? ' adc-demo' : '')} ref={칸} aria-label={`${견본 ? '광고 견본' : '광고'} — ${a.이름}`} data-ad={견본 ? undefined : a.id}>
      <div className="adc-h">
        <span className="adc-tag">광고</span><span className="adc-hs">{견본 ? '견본 — 이렇게 나옵니다' : a.추천 ? '👍 K-건설맵 추천' : '업체 소개'}</span>
        {!견본 && <Link className="adc-ask" to="/ad" onClick={() => { try { 세기('|광고문의|카드') } catch (e) { /* 없음 */ } }}>광고 · 제휴 문의 →</Link>}
      </div>
      <div className="adc-b">
        <div className="adc-nm"><span className="adc-ic" aria-hidden="true">{a.아이콘}</span>{a.이름}</div>
        {a.대표 && <div className="adc-so">대표 {a.대표}</div>}   {/* 소장님 11-05 「대표이름 넣어 줘.」 */}
        {a.소속 && <div className="adc-so">{a.소속}</div>}
        {a.추천 && <div className="adc-rec">{a.추천}</div>}
        <p className="adc-one">{a.한줄}{a.지역 && !(a.정보 || []).some(([k]) => k === '주소') ? <> · 📍 {a.지역}</> : null}</p>
        {a.칩 && a.칩.length > 0 && <div className="adc-chips">{a.칩.map((t) => <span key={t} className="adc-chip">{t}</span>)}</div>}
        <div className="adc-btns">
          {단추('adc-call', 'tel:' + 번호, `📞 ${a.전화}`, `${a.이름}에 전화 ${a.전화}`)}
          {단추('adc-sms', 'sms:' + 번호, '💬 문자', `${a.이름}에 문자`)}
        </div>
        {a.정보 && a.정보.length > 0
          ? <dl className="adc-info">{a.정보.map(([k, v]) => (
              <Fragment key={k}><dt>{k}</dt><dd>{k === '메일' && !견본 ? <a href={'mailto:' + v} onClick={누름('메일')}>{v}</a> : v}</dd></Fragment>
            ))}</dl>
          : a.작은줄 && <div className="adc-sub">{a.작은줄}</div>}
        {a.심의 && <div className="adc-sub adc-sim">{a.심의}</div>}
      </div>
    </aside>
  )
}
