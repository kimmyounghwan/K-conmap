/**
 * 📰 오늘의 건설 소식 — 사랑방 맨 위(이용자 지도 아래) (2026-10-04 · G128)
 *
 * 소장님: 「사랑방이 더 활성화가 되어야」 → 「실시간 검색 붙이면?」 → 「네이버 실시간 검색어」(없음 — 2021 폐지)
 *         → 「건설뉴스?」 → 「클로드가 다 해」
 *
 * ■ 자료: fresh/news (tools/건설소식.py · 깃허브 매시 한 번) — 한 번 받고, 화면을 보고 있으면 10분마다 다시(작음 · 5KB 남짓)
 * ■ 제목 · 언론사 · 몇 시간 전 만. 누르면 언론사 기사로(새 창). 기사 본문은 옮기지 않습니다.
 * ■ 💬 이야기하기 → 사랑방 글쓰기 칸에 «제목 + 기사 주소» 를 넣어 줍니다(바로 올리지 않음 — 쓰는 분이 한마디 보태서 올림)
 * ■ 🔧 도구 칩 → 그 소식과 이어지는 우리 도구(주소·이름은 파이썬 «도구잇기» 한 곳에서만 정함 — 여기선 «/» 로 시작하는 것만 받음)
 * ■ 아직 자료가 없으면 칸을 아예 안 띄웁니다.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const 주소 = 'https://k-conmap-default-rtdb.firebaseio.com/fresh/news.json'
const 처음 = 5
const 더 = 15

export function 언제(d, 지금 = Date.now()) {
  const 분 = Math.max(0, Math.round((지금 - d) / 60000))
  if (분 < 60) return 분 < 2 ? '방금' : `${분}분 전`
  const 시간 = Math.round(분 / 60)
  if (시간 < 24) return `${시간}시간 전`
  return `${Math.round(시간 / 24)}일 전`
}

/** 받은 자료 → 화면에 쓸 줄들 (모양이 틀린 것은 버림) */
export function 소식줄(j) {
  const items = (j && Array.isArray(j.items)) ? j.items : []
  return items.filter((x) => x && typeof x.t === 'string' && typeof x.u === 'string' && /^https:\/\//.test(x.u) && Number.isFinite(x.d))
    .map((x) => ({ t: x.t, s: String(x.s || ''), u: x.u, d: x.d, p: (typeof x.p === 'string' && x.p.startsWith('/') && !x.p.startsWith('//')) ? x.p : null, pl: String(x.pl || '') }))
}

export default function 건설소식({ on이야기 }) {
  const [자료, set자료] = useState(null)
  const [다, set다] = useState(false)
  const [때, set때] = useState(Date.now())

  useEffect(() => {
    let 살 = true
    const 받기 = async () => {
      try {
        const r = await fetch(주소, { cache: 'no-store' })
        const j = r.ok ? await r.json() : null
        if (살) { set자료(j); set때(Date.now()) }
      } catch (e) { /* 인터넷 · 막힘 — 칸 없이 */ }
    }
    받기()
    const 틈 = setInterval(() => { if (document.visibilityState === 'visible') 받기() }, 10 * 60000)
    return () => { 살 = false; clearInterval(틈) }
  }, [])

  const 줄 = 소식줄(자료)
  if (!줄.length) return null
  const 보일 = 줄.slice(0, 다 ? 더 : 처음)
  const 언론사 = [...new Set(줄.map((x) => x.s).filter(Boolean))]

  return (
    <div className="card news">
      <div className="news-head">
        <b>📰 오늘의 건설 소식</b>
        <span className="muted news-src">{언론사.join(' · ')} · 1시간마다 새로</span>
      </div>
      <ul className="news-list">
        {보일.map((x) => (
          <li key={x.u} className="news-row">
            <a className="news-t" href={x.u} target="_blank" rel="noopener noreferrer nofollow">{x.t}</a>
            <div className="news-meta">
              <span className="muted">{x.s} · {언제(x.d, 때)}</span>
              <span className="news-acts">
                {x.p && <Link className="chip news-tool" to={x.p}>🔧 {x.pl || '도구'}</Link>}
                {on이야기 && <button type="button" className="chip news-talk" onClick={() => on이야기(x)}>💬 이야기하기</button>}
              </span>
            </div>
          </li>
        ))}
      </ul>
      {줄.length > 처음 && (
        <button type="button" className="btn line news-more" onClick={() => set다((v) => !v)}>
          {다 ? '접기' : `소식 더 보기 (${Math.min(줄.length, 더) - 처음}개)`}
        </button>
      )}
    </div>
  )
}
