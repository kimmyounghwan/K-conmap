/**
 * 📊 입찰 분석실 /bunseok — K-건설맵 대표 입찰 프로그램 (G340 · 2026-10-20)
 *
 * 소장님 「입찰 프로그램, 이렇게 만들 수는 없을까」(비드프로 화면) · 「입찰사이트에서는 대표적인 프로그램이 하나씩 있잖아. 난 그걸 만들고 싶어」 ·
 *        「이용자 입장에서 편하게… 간편하게.. 그러면서 다 되게.. 정말 숙고해서 만들어 줘」
 *
 * ■ 한 화면 셋 칸
 *   왼쪽  공고 목록(분석실목록.jsx) — ⚡ 내 공고 · ⭐ 담음 · ⏰ 마감 임박 · 검색. 누르면 주소 ?no= 만 바뀝니다(뒤로 가기 · 주소 공유가 그대로 됨).
 *   가운데 분석(분석판.jsx) — 이 기관 사정률 흐름 · 분포 · 적중 검사 · 지난 1순위. 점 · 막대를 누르면 그 사정률의 금액 → «이 금액으로 고르기»
 *   오른쪽 투찰(바로투찰 BaroBid 그대로 · 분석실 모양) — 금액 · 복사 · 나라장터 · 넣은 금액 · 금액 고르기(승률 곡선) · 판정
 *   ⚠️ 금액 셈은 바로투찰 한 벌뿐입니다. 이 화면은 셈하지 않고 바로투찰이 «알림» 으로 준 값을 가운데 · 아래 띠에 보여 줍니다.
 * ■ 넓이마다
 *   1200px 넘게 — 셋 칸 나란히(목록 · 분석 · 투찰) · 900~1200 — 고르기 전 목록만 · 고르면 분석 | 투찰(목록은 «◀ 공고 목록»)
 *   폰 — 목록 → 고르면 분석 먼저 · 투찰 아래 + 아래에 «투찰 금액 띠»(금액 · 자세히 ↓ · 복사) — 분석에서 다른 사정률을 골라도 바로 보입니다.
 *        (투찰 칸의 큰 금액이 화면에 보일 때는 띠를 숨깁니다)
 * ■ 숨은 누적: |분석실|보임 · |분석실|고름 · |분석실|목록으로 · |분석실|띠복사 (+ 분석판 · 분석실목록 · 바로투찰 것)
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import BaroBid from './BaroBid.jsx'
import 분석판 from '../분석판.jsx'
import 분석실목록 from '../분석실목록.jsx'
import 분석실설명 from '../분석실설명.jsx'
import { getBidIndex, indexRows } from '../lib/data.js'
import { 세기 } from '../lib/받은수.jsx'
import { won } from '../lib/fmt.js'

export default function Bunseok() {
  const [sp, setSp] = useSearchParams()
  const no = (sp.get('no') || '').trim().toUpperCase()
  const [idx, setIdx] = useState(undefined)
  const [상태, set상태] = useState(null)
  const 위 = useRef(null)
  const 되살림 = useRef(false)
  const [설명, set설명] = useState(false)
  useEffect(() => { getBidIndex().then((v) => setIdx(v || null)).catch(() => setIdx(null)) }, [])
  useEffect(() => { 세기('|분석실|보임') }, [])
  /* 이 탭에서 마지막으로 본 공고 — 다른 화면에 갔다가 «분석실» 로 돌아오면 그 공고로(주소에 no 가 없을 때만) */
  useEffect(() => {
    if (no) { try { sessionStorage.setItem('kcm.bsr.no', no) } catch (e) { /* 없음 */ } return }
    let 남은 = ''
    try { 남은 = sessionStorage.getItem('kcm.bsr.no') || '' } catch (e) { /* 없음 */ }
    if (남은 && !되살림.current) { 되살림.current = true; setSp({ no: 남은 }, { replace: true }) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [no])
  useEffect(() => { document.title = '입찰 분석실 — 사정률 흐름 · 분포 · 투찰 금액 | K-건설맵' }, [])
  const rows = useMemo(() => (idx ? indexRows(idx) : idx), [idx])
  const 알림 = useCallback((v) => set상태(v), [])
  /* 폰 아래 금액 띠 — 오른쪽 투찰 칸의 큰 금액(.hero)이 화면에 보일 때는 숨김(같은 금액이 두 번 보이지 않게) */
  const [큰금액보임, set큰금액보임] = useState(true)
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined
    let ob = null, t = null, 살아 = true
    const 걸기 = () => {
      if (!살아) return
      const el = document.querySelector('.bsr-right .hero')
      if (!el) { t = setTimeout(걸기, 600); return }
      ob = new IntersectionObserver(([e]) => set큰금액보임(e.isIntersecting), { threshold: 0.15 })
      ob.observe(el)
    }
    걸기()
    return () => { 살아 = false; clearTimeout(t); if (ob) ob.disconnect() }
  }, [no, 상태?.ready])

  const 고르기 = (n) => {
    if (String(n).toUpperCase() === no) return
    setSp({ no: n })
    세기('|분석실|고름')
    /* 폰 · 태블릿: 목록이 접히고 분석이 맨 위에 오도록 */
    try { if (window.innerWidth <= 1200) window.scrollTo(0, 0) } catch (e) { /* 없음 */ }
  }
  const 목록으로 = () => { try { sessionStorage.removeItem('kcm.bsr.no') } catch (e) { /* 없음 */ } 되살림.current = true; setSp({}); 세기('|분석실|목록으로'); try { window.scrollTo(0, 0) } catch (e) { /* 없음 */ } }
  const p = 상태?.picked && String(상태.picked.no).toUpperCase() === no ? 상태.picked : null

  return (
    <div className={'bsr-room' + (no ? ' picked' : '')} ref={위}>
      <div className="bsr-top">
        <div className="bsr-title">
          <h1>📊 입찰 분석실</h1>
          <span className="muted">공고 하나 → 투찰 금액 · 이 기관 사정률 흐름 · 분포 · 적중 검사를 한 화면에</span>
        </div>
        <div className="bsr-tools">
          {no && <button type="button" className="bsr-back" onClick={목록으로}>◀ 공고 목록</button>}
          {no && <Link className="bsr-tool" to={`/?no=${encodeURIComponent(no)}${상태?.pickRate === 'own' && 상태?.myRate ? `&r=${Number(상태.myRate).toFixed(3)}` : ''}`} onClick={() => 세기('|분석실|바로투찰로')}>💰 바로투찰로</Link>}
          <button type="button" className={'bsr-tool' + (설명 ? ' on' : '')} aria-expanded={설명}
            onClick={() => { if (!설명) 세기('|분석실|설명서열기'); set설명(!설명) }}>📖 사용설명서</button>
        </div>
        {설명 && <분석실설명 닫기={() => set설명(false)} />}
      </div>
      <aside className="bsr-left" aria-label="공고 목록">
        <분석실목록 rows={rows} 고른번호={no} onPick={고르기} 다시읽기={상태?.bag ?? 0} />
      </aside>
      <section className="bsr-right" aria-label="투찰 금액">
        <BaroBid 분석실 알림={알림} />
      </section>
      <section className="bsr-mid" aria-label="분석">
        {p ? (
          <분석판 inst={p.inst} lo={p.lo} hi={p.hi} base={상태.base} llr={상태.llr} aval={상태.aval} pc={상태.pc || 0}
            sjMid={상태.sjMid} sjSd={상태.sjSd} 지금금액={상태.ready ? 상태.main : 0} 직접={상태.직접} ag={상태.ag} />
        ) : (
          <div className="bsr-box bsr-empty">
            <div className="bsr-h">📊 분석</div>
            <p>공고를 고르면 여기에 나옵니다.</p>
            <ul>
              <li><b>① 사정률 흐름</b> — 이 기관 최근 60건 · 같은 시도 · 가운데값 · «내 금액 하한선»</li>
              <li><b>② 어디에 많이 나왔나</b> — 0.5%p 칸 · 가장 많은 두 칸 · 전국 · 같은 금액대와 견줌</li>
              <li><b>③ 고르는 방법</b> — «최고 · 차순» 같은 방법이 지난 개찰에서 몇 % 맞았나</li>
              <li><b>④ 이 기관 지난 1순위</b> · 자주 이긴 업체</li>
            </ul>
            <p className="muted">점이나 막대를 누르면 그 사정률로 넣었을 때의 금액이 나오고, 누르면 오른쪽 투찰 금액이 그 금액으로 바뀝니다.</p>
          </div>
        )}
      </section>
      {p && 상태?.ready && 상태.main > 0 && !큰금액보임 && (
        <div className={'bsr-dock' + (상태.pass === false ? ' bad' : '')}>
          <span className="k">투찰 금액</span>
          <b className="v">{won(상태.main)}</b>
          <span className="r">{상태.myRate ? `${Number(상태.myRate).toFixed(3)}%` : ''}</span>
          <button type="button" className="go" onClick={() => { const h = document.querySelector('.bsr-right .hero'); if (h) h.scrollIntoView({ block: 'start' }); 세기('|분석실|띠자세히') }}>자세히 ↓</button>
          <button type="button" className="cbtn" onClick={() => { 상태.복사 && 상태.복사(); 세기('|분석실|띠복사') }}>{상태.copied ? '✓ 복사' : '복사'}</button>
        </div>
      )}
    </div>
  )
}
