/* 📰 G696 (2026-11-16) 오늘의 건설 뉴스 — /news(가장 최근 하루) · /news/:d(그날)
 *   소장님 「뉴스레터 형식으로 건설맵에 띄우고 싶어 …」 → 「뉴스 요약본」 · 갈래 셋(사건 · 사고 / 정책 변경 / 정보) · 「매일로 해야지」 · 자리 ④ «/news 하루 한 쪽»
 *   ■ 꼭지마다: 제목 · 2~3줄 요약(우리 말로 다시 씀) · «👷 현장에선?» · 출처(매체 · 날짜) · «원문 보기 ▸»(새 창 · nofollow)
 *   ■ 자료: public/newsd/*.json (lib/건설뉴스.js) · 검색용 구운 쪽: prerender.py news_page · news_index · 사이트맵 sitemap.py
 *   ■ 숨은 셈: |뉴스|쪽 · |뉴스|원문 · |뉴스|지난날 · |뉴스|맵톡
 */
import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Skeleton } from '../components.jsx'
import { 세기 } from '../lib/받은수.jsx'
import { 날글, 날인가, 날뉴스받기, 목록받기, 갈래묶기, 갈래이름, 갈래그림, 갈래표 } from '../lib/건설뉴스.js'

export default function News() {
  const { d: 고른날 } = useParams()
  const 날 = 고른날 && 날인가(고른날) ? 고른날 : null
  const 틀린주소 = !!고른날 && !날
  const [자, set자] = useState(null)        // null 받는 중 · false 없음 · { d, items }
  const [목, set목] = useState([])
  const 지난칸 = useRef(null)

  useEffect(() => {
    if (틀린주소) { set자(false); return undefined }
    let 살아 = true
    set자(null)
    날뉴스받기(날).then((x) => { if (살아) set자(x) })
    return () => { 살아 = false }
  }, [날, 틀린주소])
  useEffect(() => { let 살아 = true; 목록받기().then((x) => { if (살아) set목(x) }); 세기('|뉴스|쪽'); return () => { 살아 = false } }, [])
  useEffect(() => {
    if (자 && 자.d) document.title = `${날 ? '건설 뉴스' : '오늘의 건설 뉴스'} ${날글(자.d, true)} — 사건 · 사고 · 정책 변경 · 정보 | K-건설맵`
  }, [자, 날])

  const 이날 = 자 && 자.d
  const 차례 = 목.findIndex((x) => x[0] === 이날)
  const 전날 = 차례 >= 0 ? 목[차례 + 1] : null
  const 다음날 = 차례 > 0 ? 목[차례 - 1] : null
  const 지난보기 = () => { const el = 지난칸.current; if (el) { try { el.scrollIntoView({ block: 'start', behavior: 'smooth' }) } catch (e) { el.scrollIntoView() } } }

  return (
    <div className="nw">
      <h1 className="nw-h1"><span className="nw-ic">📰</span>{날 ? '건설 뉴스' : '오늘의 건설 뉴스'}</h1>
      {자 === null && <Skeleton n={3} />}
      {자 === false && (
        <div className="card nw-none">
          <p>{틀린주소 ? '주소가 맞지 않습니다.' : '그날 뉴스가 없습니다.'}</p>
          <Link className="btn" to="/news">📰 오늘의 건설 뉴스 보기</Link>
        </div>
      )}
      {자 && (<>
        <div className="nw-date">
          <b>{날글(자.d, true)}</b><span className="nw-n"> · {자.items.length}건</span>
          {목.length > 1 && <button type="button" className="nw-prev" onClick={지난보기}>‹ 지난 뉴스</button>}
        </div>
        <p className="nw-lead">사건 · 사고 · 정책 변경 · 정보 — 매일 아침 7시쯤. 기사 글은 옮기지 않고 K-건설맵이 짧게 다시 쓰고, 원문은 고리로 둡니다.</p>
        {갈래묶기(자.items).map(([c, a]) => (
          <section key={c} className={'nw-sec nw-' + 갈래표[c]} aria-label={갈래이름[c]}>
            <h2 className="nw-h2"><span aria-hidden="true">{갈래그림[c]}</span> {갈래이름[c]}</h2>
            {a.map((x, i) => (
              <article className="nw-it" key={c + i}>
                <h3 className="nw-t">{x.t}</h3>
                {x.s && <p className="nw-s">{x.s}</p>}
                {x.k && <p className="nw-k"><span aria-hidden="true">👷</span> 현장에선? {x.k}</p>}
                <p className="nw-o">
                  출처 {x.m || '—'}{x.md ? ` · ${날글(x.md)}` : ''}
                  {x.u && <> · <a href={x.u} target="_blank" rel="noopener nofollow noreferrer" onClick={() => 세기('|뉴스|원문')}>원문 보기 ▸</a></>}
                </p>
              </article>
            ))}
          </section>
        ))}
        <div className="nw-talk">
          <Link to="/qna" onClick={() => 세기('|뉴스|맵톡')}>💬 맵톡에서 이야기 나누기 ▸</Link>
          <span className="nw-pn">
            {전날 && <Link to={`/news/${전날[0]}`} onClick={() => 세기('|뉴스|지난날')}>‹ {날글(전날[0])}</Link>}
            {다음날 && <Link to={차례 === 1 ? '/news' : `/news/${다음날[0]}`} onClick={() => 세기('|뉴스|지난날')}>{날글(다음날[0])} ›</Link>}
          </span>
        </div>
      </>)}
      {목.length > 0 && (
        <section className="card nw-days" ref={지난칸} aria-label="지난 뉴스">
          <div className="sec-title" style={{ margin: '0 0 6px' }}>🗓 지난 뉴스</div>
          <div className="nw-dl">
            {목.slice(0, 60).map(([d, n], i) => (
              <Link key={d} to={i === 0 ? '/news' : `/news/${d}`} className={'nw-dd' + (d === 이날 ? ' on' : '')} aria-current={d === 이날 ? 'page' : undefined}
                onClick={() => 세기('|뉴스|지난날')}>{날글(d)}{n ? <em> {n}건</em> : null}</Link>
            ))}
          </div>
        </section>
      )}
      <p className="nw-note">요약은 K-건설맵이 원문을 읽고 다시 쓴 글입니다. 자세한 내용 · 바뀐 내용은 원문과 발표 기관 자료에서 확인하세요.</p>
    </div>
  )
}
