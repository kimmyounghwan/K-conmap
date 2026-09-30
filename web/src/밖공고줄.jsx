/* 🏗 나라장터 밖 공고로 가는 한 줄 — 공고판(/live) 맨 위 (2026-09-30)
   소장님: 입찰나라에서 가져올 것 4번 «나라장터 밖 공고» · 「편리성, 기능성 유지하면서」
   공고판은 그대로 두고 «한 줄» 만 더합니다. 작은 파일(/data/ext/meta.json · 몇십 바이트)만 받습니다.
   자료가 아직 없으면(첫 수집 전) 아무것도 그리지 않습니다 — 빈 칸을 보여 주지 않습니다. */
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getJSON } from './lib/data.js'
import { num } from './lib/fmt.js'

export default function 밖공고줄() {
  const [m, setM] = useState(null)
  useEffect(() => {
    let 살아 = true
    getJSON('/data/ext/meta.json').then((v) => { if (살아) setM(v) }).catch(() => {})
    return () => { 살아 = false }
  }, [])
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
