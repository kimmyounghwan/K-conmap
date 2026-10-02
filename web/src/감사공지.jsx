/* 🙏 감사 공지 띠 — 모든 화면 맨 위 한 줄, ✕ 로 닫으면 이 공지는 다시 안 뜸 (G116 · 2026-10-02)
 *   소장님: 「개설일이 한 달도 되지 않았는데 많은 분들이 찾아 주고 있어 고맙다는 공지글 하나 띄울까? 의견 줘.」
 *          → 「경리 셋 올린 뒤 하고, 클로드가 수정해서 주말 잘 보내라는 말도 잊지 말고.. 작성해서 올려 줘. 닫기 할 수 있게 해주고…」
 *   ■ 긴 글은 사랑방 «K-건설맵» 글(📌 고정) — 이 띠는 한 줄 + «공지 보기»(사랑방으로).
 *   ■ 닫으면 이 브라우저에 «이 공지 판» 을 적어 둠 → 같은 공지는 다시 안 뜨고, 새 공지(판을 바꾸면)는 다시 뜸.
 *   ■ 끝나는 날(아래 «까지») 이 지나면 저절로 안 뜸. «연휴 잘 보내세요» 는 연휴가 끝나는 날까지만.
 *   ■ 인쇄 · 검색 로봇에는 안 나옵니다.
 */
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 로봇 as 로봇글 } from './lib/인사.js'

const 판 = '2026-10-감사'
const 까지 = '2026-10-11'          /* 이 날까지 보임 */
const 연휴끝 = '2026-10-05'        /* 개천절 연휴(10.3 토 · 4 일 · 5 월 대체공휴일) */
const 열쇠 = 'kcm_notice_hide'
const 한국오늘 = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10)
const 로봇 = () => { try { return 로봇글(navigator.userAgent || '') } catch (e) { return false } }
const 닫았나 = () => { try { return localStorage.getItem(열쇠) === 판 } catch (e) { return false } }

export default function 감사공지() {
  const [닫힘, set닫힘] = useState(() => 닫았나())
  const { pathname } = useLocation()
  const 오늘 = 한국오늘()
  if (닫힘 || 오늘 > 까지 || 로봇() || pathname.startsWith('/admin')) return null
  const 닫기 = () => { try { localStorage.setItem(열쇠, 판) } catch (e) { /* 사생활 창 — 이번만 */ } set닫힘(true) }
  return (
    <div className="noticebar" role="note">
      <span className="t">🙏 문을 연 지 한 달도 안 됐는데 많은 분들이 찾아 주셨습니다 — <b>고맙습니다!</b>
        {오늘 <= 연휴끝 ? ' 개천절 연휴, 즐거운 주말 보내십시오.' : ' 늘 안전한 현장 되십시오.'}</span>
      {!pathname.startsWith('/qna') && <Link className="go" to="/qna">공지 보기</Link>}
      <button type="button" className="x" aria-label="공지 닫기" title="닫기 — 이 공지는 다시 안 뜹니다" onClick={닫기}>✕</button>
    </div>
  )
}
