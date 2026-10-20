/* 🤝 공동도급 마당으로 가는 한 줄 — 공고판(/live) 맨 위 (G343 · 2026-10-20)
   소장님 「공동도급 만든거 어디 있지???」 → 「그래. 잘 보이게 해줘」
   전에는 공동 되는 공고를 펼쳐야만 단추가 보였습니다. 공고판 맨 위에 «한 줄»(나라장터 밖 공고 줄과 같은 꼴 · 눈에 띄는 색).
   💸 아무것도 받지 않습니다(글 수를 세려고 데이터베이스를 읽지 않음 — 공고판을 열 때마다 읽기가 늘지 않게).
   숨은 누적 |공동|공고탭줄 */
import { Link } from 'react-router-dom'
import { 세기 } from './lib/받은수.jsx'

export default function 공동마당줄() {
  return (
    <Link to="/gongdong" className="xlink xlink-jv" onClick={() => 세기('|공동|공고탭줄')}>
      <span className="xl-i">🤝</span>
      <span className="xl-t"><b>공동도급 마당 · 같이 넣을 업체 찾기</b>
        <i>구성원 구함 · 참여 글 · 지분 짜기 · 업체 찾기</i></span>
      <span className="xl-go">가기 →</span>
    </Link>
  )
}
