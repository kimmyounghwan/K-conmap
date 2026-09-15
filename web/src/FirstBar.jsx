/* 🧭 «처음이세요?» 띠 — 처음 온 사람에게 딱 한 번 (2026-09-15)
 *
 * 소장님: 「보는 방법이 눈에 안 띄지 않아…제일 아래에 있어…좋은 자리 없을까?」
 *
 * ■ 자리를 넓히지 않고 «눈에 띄게» 하는 길
 *   하단 탭은 10개로 꽉 찼고(11개면 세 줄이 되어 본문을 가립니다 — 09-15 에 겪었습니다),
 *   상단 막대에도 이미 로고·사라사·앱으로가 있습니다. 자리가 없습니다.
 *   → 그래서 **늘 있는 자리** 대신 **처음 온 사람에게만 한 번** 보여 줍니다.
 *     늘 있으면 자리를 먹고, 한 번만 있으면 눈에 띕니다.
 *
 * ■ 규칙
 *   ① 이 브라우저에서 «처음» 일 때만. 한 번 닫거나 /how 를 보고 나면 다시 안 뜹니다
 *   ② 검색으로 안쪽 페이지에 내려앉은 사람에게도 보입니다 — 그런 사람이 제일 헤맵니다
 *   ③ 「홈 화면에 추가」 띠와 겹치지 않게, 그 띠가 떠 있으면 이번에는 비켜 줍니다
 *      (한 화면에 조르는 띠가 둘이면 둘 다 안 읽힙니다)
 */
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

const KEY = 'kcm_how_seen'

const seen = () => {
  try { return !!localStorage.getItem(KEY) } catch { return true }   // 못 읽으면 안 보여 줍니다
}
const mark = () => { try { localStorage.setItem(KEY, '1') } catch { /* noop */ } }

export default function FirstBar() {
  const { pathname } = useLocation()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (pathname === '/how' || pathname === '/about') { mark(); setShow(false); return }
    if (seen()) { setShow(false); return }
    /* 「홈 화면에 추가」 띠가 떠 있으면 비켜 줍니다 — 조르는 띠는 한 번에 하나만. */
    const t = setTimeout(() => {
      const busy = document.querySelector('.installbar')
      setShow(!busy)
    }, 700)
    return () => clearTimeout(t)
  }, [pathname])

  if (!show) return null
  const close = () => { mark(); setShow(false) }
  return (
    <div className="firstbar">
      <div className="t">
        <b>처음이세요?</b> 어디서 뭘 하는지 <b>한 장</b>으로 적어 두었습니다 —
        투찰금액 정하기 · 개찰 결과 보기 · 서식 받기.
      </div>
      <Link className="go" to="/how" onClick={mark}>📖 보는 방법</Link>
      <button className="x" onClick={close} aria-label="닫기">✕</button>
    </div>
  )
}
