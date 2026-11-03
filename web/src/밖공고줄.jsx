/* 🏗 나라장터 밖 공고로 가는 한 줄 — 공고판(/live) 맨 위 (2026-09-30)
   소장님: 입찰나라에서 가져올 것 4번 «나라장터 밖 공고» · 「편리성, 기능성 유지하면서」
   공고판은 그대로 두고 «한 줄» 만 더합니다. 작은 파일(/data/ext/meta.json · 몇십 바이트)만 받습니다.
   자료가 아직 없으면(첫 수집 전) 아무것도 그리지 않습니다 — 빈 칸을 보여 주지 않습니다.
   🏆 kind="first" — 1순위 현황판(/first) 맨 위에도 같은 한 줄 → /ext?t=first (2026-09-30 «나라장터 밖 1순위»)
      건수는 같은 meta.json 의 «first» (extres.publish_first 가 얹음). */
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getJSON } from './lib/data.js'
import { num } from './lib/fmt.js'

/* 🧭 G521 (2026-11-03 «이용자에게 편한걸로») 작게 — 1순위 현황판 결과 줄의 작은 단추(날짜별 성적표 옆). 큰 카드가 목록을 밀어내던 것을 줄임 */
export default function 밖공고줄({ kind = 'live', 작게 = false }) {
  const [m, setM] = useState(null)
  useEffect(() => {
    let 살아 = true
    getJSON('/data/ext/meta.json').then((v) => { if (살아) setM(v) }).catch(() => {})
    return () => { 살아 = false }
  }, [])
  if (kind === 'first') {
    if (!m || !(m.first > 0)) return null
    if (작게) return <Link to="/ext?t=first" className="daylink xchip" title="LH · 수자원 · 국방 · 아파트 · 민간 공사 · 최근 30일">🏆 나라장터 밖 1순위 {num(m.first)}건 →</Link>
    return (
      <Link to="/ext?t=first" className="xlink">
        <span className="xl-i">🏆</span>
        <span className="xl-t"><b>나라장터 밖 1순위 · 낙찰 {num(m.first)}건</b>
          <i>LH · 수자원 · 국방 · 아파트 · 민간 공사 · 최근 30일</i></span>
        <span className="xl-go">보기 →</span>
      </Link>
    )
  }
  if (!m || !(m.n > 0)) return null
  return (
    <Link to="/ext" className="xlink">
      <span className="xl-i">🏗</span>
      <span className="xl-t"><b>나라장터 밖 공고 {num(m.n)}건</b>
        <i>LH · 수자원 · 국방 · 아파트 · 민간 공사</i></span>
      <span className="xl-go">보기 →</span>
    </Link>
  )
}
