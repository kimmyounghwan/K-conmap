/* 📰 G696 (2026-11-16) 오늘의 건설 뉴스 — 화면 안 두 자리(자료 · 규칙은 lib/건설뉴스.js · 한 장 화면은 pages/News.jsx)
 *   소장님: 자리 넷(① 입찰 화면 — 공사연결 띠 바로 아래 한 줄 ② 맵톡 맨 위 «뉴스» 글 ③ 서식 · 도구 쪽 끝 — 쿠팡 줄 위 한 줄 ④ /news 하루 한 쪽)
 *          · 아래 탭 · 맨 위 줄은 그대로 · 「화면 배열시 이상하지 않게 해줘」
 *   ■ 뉴스띠(①) — App.jsx 공사연결띠 바로 다음 · 입찰 화면(바로투찰 · 1순위 · 공고 — 공사 · 용역 · 물품 세 방)에서만
 *     · 띠 전체가 /news 로 가는 고리(어디를 눌러도 됨) · 줄마다 한 줄(넘치면 … ) → 높이가 늘 같음
 *     · 자료가 오는 동안엔 같은 높이의 빈 틀(kn-wait) — 자료가 늦게 와도 아래 화면(목록 · 계산기)이 밀려 내려가지 않게(누르려던 것을 잘못 누르지 않게)
 *   ■ 뉴스끝줄(③) — App.jsx 씀-뒤 · 도면대행줄 다음(애드핏 · 쿠팡 바닥 줄 위) · 서식 · 도구 쪽에서만(도면 도구 쪽은 도면대행줄이 있어 뺌 — 두 줄 겹쳐 쌓이지 않게)
 *     · 두 줄 높이로 고정(빈 틀도 같은 높이) → 늦게 와도 그 아래 광고 칸이 움직이지 않음(광고를 잘못 누르게 하는 배치 금지 — 애드핏 운영정책)
 *   ■ 안 나오는 때: 로봇 · 인쇄 · 자료를 못 받음 · 자료가 오늘 · 어제 것이 아님(자동 갱신이 멈춰도 옛 뉴스를 «오늘» 로 걸지 않게)
 *   ■ 숨은 셈: |뉴스|띠누름 · |뉴스|끝누름 (뉴스 쪽 안은 pages/News.jsx)
 *   ⚠️ 씀-앞 · 씀-뒤 «밖» — 눌러도 도구 «써 본 횟수» 로 안 셈
 */
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 세기 } from './lib/받은수.jsx'
import { 로봇 as 로봇글 } from './lib/인사.js'
import { 도면줄칸 } from './공사연결띠.jsx'
import { 뉴스받기, 뉴스자료, 날글, 싱싱한가, 띠줄, 갈래표 } from './lib/건설뉴스.js'

/** 뉴스띠를 다는 입찰 화면 — 아래 탭 «바로투찰 · 1순위 · 공고» 의 세 방(공사 · 용역 · 물품) 주소 */
export const 뉴스띠길 = ['/', '/calc', '/first', '/live', '/svc', '/svc/first', '/svc/calc', '/goods', '/goods/first', '/goods/calc']
/** 뉴스끝줄을 다는 쪽 — 서식 · 도구(도면 도구 쪽은 뺌) */
export const 뉴스끝길인가 = (p) => /^\/(forms|tools)(\/|$)/.test(String(p || '')) && !도면줄칸(p)

const 로봇 = () => { try { return 로봇글(navigator.userAgent || '') } catch (e) { return false } }
try { if (typeof window !== 'undefined' && !로봇() && !/^\/admin(\/|$)/.test(window.location.pathname)) 뉴스받기() } catch (e) { /* 없음 */ }

/** 자료 — null 받는 중 · false 없음 · { d, items } */
function use뉴스(켬) {
  const [d, setD] = useState(뉴스자료)
  useEffect(() => {
    if (!켬 || d !== null) return undefined
    let 살아 = true
    뉴스받기().then((x) => { if (살아) setD(x) })
    return () => { 살아 = false }
  }, [켬, d])
  return d
}

const 칸 = (x) => (x ? <><em className={'kn-c kn-' + 갈래표[x.c]}>{x.c}</em> {x.t}</> : null)

export default function 뉴스띠() {
  const { pathname } = useLocation()
  const 켬 = 뉴스띠길.includes(pathname) && !로봇()
  const d = use뉴스(켬)
  if (!켬 || d === false || (d && !싱싱한가(d.d))) return null
  if (d === null) {
    return (
      <div className="kn-strip kn-wait no-print" aria-hidden="true">
        <span className="kn-top"><span className="kn-ic">📰</span><b>오늘의 건설 뉴스</b></span>
        <span className="kn-h">&nbsp;</span>
        <span className="kn-h">&nbsp;</span>
      </div>
    )
  }
  const [a, b, c] = 띠줄(d.items)
  return (
    <Link to="/news" className="kn-strip no-print" onClick={() => 세기('|뉴스|띠누름')}
      aria-label={`오늘의 건설 뉴스 ${날글(d.d)} — 전체 보기`}>
      <span className="kn-top"><span className="kn-ic">📰</span><b>오늘의 건설 뉴스</b><span className="kn-d">{날글(d.d)}</span><span className="kn-all">전체 보기 ▸</span></span>
      <span className="kn-h">{칸(a)}</span>
      <span className="kn-h">{b ? 칸(b) : <>&nbsp;</>}{c ? <> · {칸(c)}</> : null}</span>
    </Link>
  )
}

export function 뉴스끝줄() {
  const { pathname } = useLocation()
  const 켬 = 뉴스끝길인가(pathname) && !로봇()
  const d = use뉴스(켬)
  if (!켬 || d === false || (d && !싱싱한가(d.d))) return null
  if (d === null) {
    return (
      <div className="kn-line kn-wait no-print" aria-hidden="true">
        <span className="kn-top"><span className="kn-ic">📰</span><b>오늘의 건설 뉴스</b></span>
        <span className="kn-one">&nbsp;</span>
      </div>
    )
  }
  const x = d.items[0]
  return (
    <Link to="/news" className="kn-line no-print" onClick={() => 세기('|뉴스|끝누름')}
      aria-label={`오늘의 건설 뉴스 ${날글(d.d)} — 전체 보기`}>
      <span className="kn-top"><span className="kn-ic">📰</span><b>오늘의 건설 뉴스 · {날글(d.d)}</b><span className="kn-all">전체 보기 ▸</span></span>
      <span className="kn-one">{칸(x)}{x.kk ? ` — ${x.kk}` : ''}</span>
    </Link>
  )
}
