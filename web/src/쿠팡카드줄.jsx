/* 🛒 G663 (2026-11-13) 쿠팡 «카페형 상품 카드» 줄 — 큰 사진 · 상품 이름 · 할인 · 값 · 별점 · 옆으로 넘김(규칙 · 자료 풀기는 lib/쿠팡카드.js · 자료는 public/coupang/cards.json)
 *   소장님: 「쿠팡을 쪽에 맞는 상품으로 하고, 최대한 상품 많이 보이게 해줘」 · 「카페는 이렇게 하잖아」 · 「화질도 좋고」 · 「가격이 안보이는 거야?」
 *          「과일만 쭉… 제철 과일… 옷 만 쭉… 각 카테고리 별로. 모두 건설맵에 넣는 거지」 · 「이용자가 클릭을 하게 해야지…」
 *   ■ 자리: 위(모든 쪽 맨 위 — 예전 쿠팡 배너 자리 · 작은 카드 · 쪽에 맞는 주제) · 목록(1순위 · 공고 목록 사이 — 예전 배너 자리 · 큰 카드) · 바닥(바닥글 바로 위 · 큰 카드)
 *   ■ 한 줄 = 한 주제(제철 과일만 · 겨울 옷만 · 자격증 수험서만 …) · 같은 쪽 안에서는 줄마다 주제가 다름 · 들어올 때마다 첫 상품이 바뀜
 *   ■ 누르면 쿠팡 «상품 링크»(정식 · 수수료) 새 창 · «광고» 딱지 · 머리에 «쿠팡 · ○월 ○일 가격» · 대가성 문구(쿠팡 «반드시 기재») + «가격은 바뀔 수 있습니다»
 *   ■ 숨은 셈: |쿠팡보임|카드-<자리>-<주제>(반 넘게 · 한 번) · |쿠팡누름|카드-<자리>-<주제> — 자리 = 위 · 목록1 · 목록2 … · 바닥
 *   ■ 관리자 화면(/admin) · 인쇄엔 안 나옴 · 씀-앞 «밖»(App.jsx) — 쿠팡을 누른 것은 도구 «써 본 횟수» 로 안 셈
 *   ■ 자료(cards.json)를 못 받으면 맨 위 · 목록 줄은 예전 쿠팡 배너(쿠팡칸.jsx)로 돌아감 — 광고 자리가 빈 채로 남지 않게 · 바닥 줄은 안 그림
 *   ■ 맨 위 줄은 자료가 오는 동안 같은 짜임의 빈 틀(cpc-wait)로 자리를 잡아 둠 — 글이 밀려 내려가는 일(덜컥임) 없게
 *   ⚠️ 쿠팡 운영정책: 링크를 숨기지 않음 · 저절로 넘기지 않음 · 화면을 덮지 않음 · «눌러 주세요» 같은 말 없음
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { 세기 } from './lib/받은수.jsx'
import { 쿠팡문구 } from './lib/쿠팡자료.js'
import { 카드자료풀기, 카드주제정하기, 자리차례, 그림크기, 원, 기준글 } from './lib/쿠팡카드.js'
import 쿠팡칸 from './쿠팡칸.jsx'

/* 자료 — 앱이 뜰 때 바로 받기 시작(첫 그림 전에 오는 일이 많음) · 한 번만 받음 · 못 받으면 false */
let 자료 = null, 받는중 = null
const 받기 = () => {
  if (자료 !== null) return Promise.resolve(자료)
  if (!받는중) {
    받는중 = fetch('/coupang/cards.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { 자료 = 카드자료풀기(j) || false; return 자료 })
      .catch(() => { 자료 = false; return 자료 })
  }
  return 받는중
}
try { if (typeof window !== 'undefined' && !/^\/admin(\/|$)/.test(window.location.pathname)) 받기() } catch (e) { /* 없음 */ }

/* 씨앗 — 쪽(주소)에 들어올 때 한 번 정함 · 같은 쪽의 줄들이 같은 씨앗으로 서로 다른 주제를 고름 */
let 씨앗 = { 길: null, 값: 0 }
const 씨앗얻기 = (길) => { if (씨앗.길 !== 길) 씨앗 = { 길, 값: Math.floor(Math.random() * 1000000) }; return 씨앗.값 }

/* 맨 위 줄 빈 틀 — 자료가 오는 동안 진짜 줄과 같은 짜임(머리 · 작은 카드 여섯 · 문구)으로 같은 높이를 잡아 둠(폭마다 따로 재지 않아도 맞음) */
const 빈틀 = () => (
  <aside className="cpc cpc-sm cpc-wait no-print" aria-hidden="true">
    <div className="cpc-h"><span className="adc-tag">광고</span><b className="cpc-t">&nbsp;</b><span className="cpc-nav"><button type="button" tabIndex={-1} disabled>‹</button><button type="button" tabIndex={-1} disabled>›</button></span></div>
    <div className="cpc-row">{[0, 1, 2, 3, 4, 5].map((i) => <span className="cpc-c" key={i}><span className="cpc-img" /><span className="cpc-n" /><span className="cpc-p"><b>&nbsp;</b></span></span>)}</div>
    <p className="cpc-dis">{쿠팡문구} 가격은 바뀔 수 있습니다.</p>
  </aside>
)

export default function 쿠팡카드줄({ 자리 = '바닥', 차례 = 0 }) {
  const { pathname } = useLocation()
  const 쉼 = /^\/admin(\/|$)/.test(pathname)
  const [d, setD] = useState(자료)
  const 줄 = useRef(null)
  const 칸 = useRef(null)
  useEffect(() => { if (쉼 || d !== null) return undefined; let 살아 = true; 받기().then((x) => { if (살아) setD(x) }); return () => { 살아 = false } }, [쉼, d])
  const 씨 = 씨앗얻기(pathname)
  const 이름 = 자리 === '목록' ? '목록' + (차례 || 1) : 자리   /* 숨은 셈 자리 이름 — 위 · 목록1 · 목록2 … · 바닥 */
  const 주제 = useMemo(() => {
    if (!d) return null
    const id = 카드주제정하기(pathname, 자리차례(자리, 차례), 씨, d.주제들.map((t) => t.id))
    return d.주제들.find((t) => t.id === id) || null
  }, [d, pathname, 자리, 차례, 씨])
  const 상품들 = useMemo(() => {
    if (!d || !주제) return []
    const 모두 = d.상품.filter((p) => p.주제 === 주제.id)
    const s = 모두.length ? 씨 % 모두.length : 0
    return [...모두.slice(s), ...모두.slice(0, s)]
  }, [d, 주제, 씨])
  const 셈이름 = 주제 ? `카드-${이름}-${주제.id}` : ''
  /* 숨은 셈 — 보임(반 넘게 · 한 번) */
  useEffect(() => {
    const el = 칸.current
    if (!셈이름 || !el) return undefined
    let 셌음 = false
    const 보임 = () => { if (셌음) return; 셌음 = true; try { 세기('|쿠팡보임|' + 셈이름) } catch (e) { /* 없음 */ } }
    if (typeof IntersectionObserver === 'undefined') { 보임(); return undefined }
    const io = new IntersectionObserver(([e]) => { if (e && e.isIntersecting) { 보임(); io.disconnect() } }, { threshold: 0.5 })
    io.observe(el)
    return () => io.disconnect()
  }, [셈이름])
  /* 다른 쪽으로 옮기면 줄을 맨 앞으로 */
  useEffect(() => { if (줄.current) 줄.current.scrollLeft = 0 }, [셈이름])
  if (쉼) return null
  if (d === false) return 자리 === '바닥' ? null : <쿠팡칸 자리={자리} 차례={차례} />
  const 작게 = 자리 === '위'
  if (d === null) return 작게 ? <빈틀 /> : null
  if (!주제 || !상품들.length) return null
  const 넘기기 = (k) => { const r = 줄.current; if (r) r.scrollBy({ left: k * Math.max(200, r.clientWidth * 0.8), behavior: 'smooth' }) }
  const 누름 = () => { try { 세기('|쿠팡누름|' + 셈이름) } catch (e) { /* 없음 */ } }
  const 크기 = 작게 ? 320 : 492
  return (
    <aside className={'cpc no-print' + (작게 ? ' cpc-sm' : '')} ref={칸} aria-label={`광고 — 쿠팡 ${주제.이름.replace(/^\S+\s/, '')}`} data-cpc={주제.id} data-cpg-at={자리} data-cpg-n={이름}>
      <div className="cpc-h">
        <span className="adc-tag">광고</span>
        <b className="cpc-t">{주제.이름}</b>
        <span className="cpc-hs">쿠팡 · {기준글(d.기준)} 가격</span>
        <span className="cpc-nav">
          <button type="button" tabIndex={-1} aria-hidden="true" onClick={() => 넘기기(-1)}>‹</button>
          <button type="button" tabIndex={-1} aria-hidden="true" onClick={() => 넘기기(1)}>›</button>
        </span>
      </div>
      <div className="cpc-row" ref={줄}>
        {상품들.map((p, i) => (
          <a key={p.짧은} className="cpc-c" href={p.짧은} target="_blank" rel="sponsored nofollow noopener" referrerPolicy="unsafe-url" onClick={누름} title={p.이름}>
            <span className="cpc-img"><img src={그림크기(p.그림, 크기)} alt="" loading={i < 3 ? 'eager' : 'lazy'} decoding="async" width={작게 ? 104 : 156} height={작게 ? 104 : 156}
              onError={(e) => { e.currentTarget.style.visibility = 'hidden' }} /></span>
            <span className="cpc-n">{p.이름}</span>
            <span className="cpc-p">{p.할인 > 0 && <em>{p.할인}%</em>}<b>{원(p.값)}원</b></span>
            {!작게 && p.원값 > p.값 && <s className="cpc-o">{원(p.원값)}원</s>}
            {!작게 && p.별 > 0 && <span className="cpc-r"><i aria-hidden="true">★</i> {p.별.toFixed(1)} <span>({원(p.평)})</span></span>}
          </a>
        ))}
      </div>
      <p className="cpc-dis">{쿠팡문구} 가격은 바뀔 수 있습니다.</p>
    </aside>
  )
}
