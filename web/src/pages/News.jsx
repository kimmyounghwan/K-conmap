/* 📰 G696 (2026-11-16) 오늘의 건설 뉴스 — /news(가장 최근 하루) · /news/:d(그날)
 *   소장님 「뉴스레터 형식으로 건설맵에 띄우고 싶어 …」 → 「뉴스 요약본」 · 갈래 셋(사건 · 사고 / 정책 변경 / 정보) · 「매일로 해야지」 · 자리 ④ «/news 하루 한 쪽»
 *   ■ 꼭지마다: 제목 · 2~3줄 요약(우리 말로 다시 씀) · «👷 현장에선?» · 출처(매체 · 날짜) · «원문 보기 ▸»(새 창 · nofollow)
 *   ■ 자료: public/newsd/*.json (lib/건설뉴스.js) · 검색용 구운 쪽: prerender.py news_page · news_index · 사이트맵 sitemap.py
 *   ■ 숨은 셈: |뉴스|쪽 · |뉴스|원문 · |뉴스|지난날 · |뉴스|맵톡
 *   ■ G696b 소장님 「간단히 뉴스 라고만 써, 간략히」 · 「이걸 꼭 써야 해」 → 고르심 «건설뉴스» · 제목 «건설뉴스» 만 · 머리 안내 상자(언제 올리는지 · 다시 쓴 글 · 원문 고리 설명) 뺌 — 맨 아래 한 줄 알림은 그대로
 *   ■ 👁💬 G735 (2026-11-17) 소장님 「건설 뉴스 … 클릭수 보이게 해줘. 댓글쓰게도 해주고」
 *     · 👁 = 그날 호를 본 수(건설맵이 셈 · 같은 브라우저 하루 한 번 · 소장님 · 로봇 안 셈 — lib/조회수.jsx «news» 첫마디) — /news(가장 최근)로 봐도 그날 호(/news/{날})로 셈
 *       날짜 줄에 «👁 N» · 화면 맨 위 «👁 이 화면 조회» 줄은 뉴스 쪽에서만 뺌(숫자 둘이 다르게 보이지 않게)
 *     · 💬 = 그날 호 댓글(comments/news-{날} — 공고 댓글과 같은 칸 · 규칙 그대로 · 로그인 없이 · 지울 때 4자리) · 날짜 줄 «💬 댓글 N» 을 누르면 아래 댓글 칸이 열림
 *       댓글 수는 열기 전에도 보임(가벼운 읽기 둘 — comments · comment_del 열쇠만 · 파이어베이스 꾸러미는 댓글을 열 때만 받음)
 */
import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Skeleton } from '../components.jsx'
import { 세기 } from '../lib/받은수.jsx'
import { use화면조회, 조회세기 } from '../lib/조회수.jsx'   /* 👁 G735 그날 호 조회 */
import Comments from '../Comments.jsx'   /* 💬 G735 그날 호 댓글(공고 댓글과 같은 칸) */

const DB = 'https://k-conmap-default-rtdb.firebaseio.com'
/** 💬 G735 그날 호 댓글 수 — 쓴 것 − 지운 것(열쇠만 읽음 · shallow) · 못 읽으면 null(«댓글» 만 보임) */
function use댓글수(no) {
  const [n, setN] = useState(null)
  const [다시, set다시] = useState(0)
  useEffect(() => {
    if (!no) { setN(null); return undefined }
    let 살아 = true
    const 열쇠들 = (길) => fetch(`${DB}/${길}/${encodeURIComponent(no)}.json?shallow=true`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('못 읽음')))).then((j) => Object.keys(j || {}))
    Promise.all([열쇠들('comments'), 열쇠들('comment_del')])
      .then(([쓴, 지운]) => { if (살아) { const 뺌 = new Set(지운); setN(쓴.filter((k) => !뺌.has(k)).length) } })
      .catch(() => { if (살아) setN(null) })
    return () => { 살아 = false }
  }, [no, 다시])
  return [n, useCallback(() => set다시((x) => x + 1), [])]
}
import { 날글, 날인가, 날뉴스받기, 목록받기, 갈래묶기, 갈래이름, 갈래그림, 갈래표 } from '../lib/건설뉴스.js'
import 애드핏칸 from '../애드핏칸.jsx'   /* 💰 11-16 애드핏 «가운데» 칸 — 소장님 「페이지 마다」 · 광고단위 · 규칙은 lib/애드핏.js */
import 쿠팡카드줄 from '../쿠팡카드줄.jsx'   /* 🛒 11-16 쿠팡 «가운데» 줄 — 소장님 「페이지마다 다 넣어 쿠팡도 넣고, 상품은 겹치지 않게 다양하게」 */
import { 가운데칸 } from '../lib/애드핏.js'   /* 💰 11-16 글 칸 가운데 자리(⌈n/2⌉째 칸 다음) */

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
    if (자 && 자.d) document.title = `건설뉴스 ${날글(자.d, true)} — 사건 · 사고 · 정책 변경 · 정보 | K-건설맵`
  }, [자, 날])

  const 이날 = 자 && 자.d
  /* 👁 G735 그날 호 조회 — /news(가장 최근)로 열었으면 그날 호 열쇠(|news|{날})로도 셈(/news/{날} 로 연 것은 App.jsx use조회세기 가 이미 셈) */
  const 조회 = use화면조회(이날 ? `/news/${이날}` : null)
  useEffect(() => { if (이날 && !고른날) 조회세기(`/news/${이날}`) }, [이날, 고른날])
  /* 💬 G735 그날 호 댓글 */
  const 댓글번호 = 이날 ? `news-${이날}` : null
  const [댓글수, 댓글수다시] = use댓글수(댓글번호)
  const 댓글칸 = useRef(null)
  const [댓글열기, set댓글열기] = useState(0)
  const 댓글로 = () => {
    set댓글열기((x) => x + 1)
    세기('|뉴스|댓글')
    const el = 댓글칸.current
    if (el) { try { el.scrollIntoView({ block: 'start', behavior: 'smooth' }) } catch (e) { el.scrollIntoView() } }
  }
  const 차례 = 목.findIndex((x) => x[0] === 이날)
  const 전날 = 차례 >= 0 ? 목[차례 + 1] : null
  const 다음날 = 차례 > 0 ? 목[차례 - 1] : null
  const 지난보기 = () => { const el = 지난칸.current; if (el) { try { el.scrollIntoView({ block: 'start', behavior: 'smooth' }) } catch (e) { el.scrollIntoView() } } }

  return (
    <div className="nw">
      <h1 className="nw-h1"><span className="nw-ic">📰</span>건설뉴스</h1>
      {자 === null && <Skeleton n={3} />}
      {자 === false && (
        <div className="card nw-none">
          <p>{틀린주소 ? '주소가 맞지 않습니다.' : '그날 뉴스가 없습니다.'}</p>
          <Link className="btn" to="/news">📰 건설뉴스 보기</Link>
        </div>
      )}
      {자 && (<>
        <div className="nw-date">
          <b>{날글(자.d, true)}</b><span className="nw-n"> · {자.items.length}건</span>
          {/* 👁💬 G735 — 그날 호 조회 · 댓글(누르면 아래 댓글 칸이 열림) */}
          {조회 != null && <span className="nw-v" title="이 날 뉴스를 본 수(같은 브라우저 하루 한 번)">👁 {조회.toLocaleString('ko-KR')}</span>}
          <button type="button" className="nw-cmn" onClick={댓글로}>💬 댓글{댓글수 ? ` ${댓글수.toLocaleString('ko-KR')}` : ''}</button>
          {목.length > 1 && <button type="button" className="nw-prev" onClick={지난보기}>‹ 지난 뉴스</button>}
        </div>
        {/* 💰🛒 11-16 소장님 「페이지 마다」 — 갈래 가운데쯤(⌈n/2⌉째 칸 다음) 애드핏 «가운데» · 마지막 칸 다음 쿠팡 «가운데» 줄(칸이 둘 넘을 때 · 둘 사이에 갈래을 두고) */}
        {갈래묶기(자.items).map(([c, a], gi, 모두) => (
          <Fragment key={c}>
          <section className={'nw-sec nw-' + 갈래표[c]} aria-label={갈래이름[c]}>
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
          {gi === 가운데칸(모두.length) && <애드핏칸 key={'mid-news-' + 자.d} 자리="중" />}
          {gi === 모두.length - 1 && gi > 가운데칸(모두.length) && <쿠팡카드줄 key={'cmid-news-' + 자.d} 자리="중" />}
          </Fragment>
        ))}
        {/* 💬 G735 그날 호 댓글 칸 — 로그인 없이 · 지울 때 4자리(공고 댓글과 같은 칸 · 규칙 comments/{번호}) */}
        <section className="card nw-cm" ref={댓글칸} aria-label="댓글">
          <h2 className="nw-cm-h">💬 이 날 뉴스 이야기{댓글수 ? <em> {댓글수.toLocaleString('ko-KR')}</em> : null}</h2>
          <Comments key={댓글번호} no={댓글번호} title={`건설뉴스 ${날글(자.d)}`} 열기={댓글열기} 셈={댓글수}
            place="이 날 뉴스에 한마디 — 현장 이야기 · 질문 · 정보 나눔" 바뀜={댓글수다시} />
        </section>
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
