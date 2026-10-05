/* 🙏 감사 공지 — 띠(모든 화면 맨 위 한 줄) + 공지 창(들어오면 가운데에 글 전체) (G116 띠 · G117 창 · 2026-10-02)
 *   소장님: 「개설일이 한 달도 되지 않았는데 많은 분들이 찾아 주고 있어 고맙다는 공지글 하나 띄울까? 의견 줘.」
 *          → 「경리 셋 올린 뒤 하고, 클로드가 수정해서 주말 잘 보내라는 말도 잊지 말고.. 작성해서 올려 줘. 닫기 할 수 있게 해주고…」
 *          → (G117) 「후기 건의 쪽으로 해줘. 공지. 그리고 화면에도 띄워 줘. 들어 왔을때 볼 수있게..」 — «들어오면 공지 창»
 *   ■ 공지 창: 사이트에 들어오면(이 창을 연 뒤 처음 한 번) 가운데에 사랑방 공지 글 전체. ✕ · 닫기 · 바깥 누르기 · Esc → 이번엔 닫힘(띠는 남음).
 *     «다시 보지 않기» → 이 브라우저에 «이 공지 판» 을 적어 둠 → 창도 띠도 다시 안 뜸. 띠의 «공지 보기» 를 누르면 창이 다시 열림.
 *   ■ 띠: 한 줄 + «공지 보기»(창) + ✕(다시 안 뜸 — 창과 같은 열쇠).
 *   ■ 끝나는 날(아래 «까지») 이 지나면 저절로 안 뜸. «주말 잘 보내세요» 는 연휴가 끝나는 날까지, 그 뒤엔 «늘 안전한 현장».
 *   ■ 관리자 화면 · 검색 로봇 · 인쇄에는 안 나옵니다. 그 공지 글을 보고 있는 화면(/qna/글번호)에서는 창을 저절로 띄우지 않습니다.
 *   ■ 글은 사랑방 글(«[후기·건의] 📢 공지 · 찾아 주셔서 고맙습니다» · K-건설맵)과 같은 글 — 고치면 둘 다.
 */
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation } from 'react-router-dom'
import { 로봇 as 로봇글 } from './lib/인사.js'

const 판 = '2026-10-감사'
const 까지 = '2026-10-11'          /* 이 날까지 보임 */
const 연휴끝 = '2026-10-05'        /* 개천절 연휴(10.3 토 · 4 일 · 5 월 대체공휴일) */
const 글주소 = '/qna/-P2vCUv665xH_5zFrBr6'   /* 맵톡 공지 글 */
const 열쇠 = 'kcm_notice_hide'      /* 다시 보지 않기(띠 ✕ 도 같음) — localStorage */
const 본열쇠 = 'kcm_notice_seen'    /* 이번에 한 번 봤음 — sessionStorage(창을 닫으면 그 창 동안은 다시 안 띄움) */
const 한국오늘 = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10)
const 로봇 = () => { try { return 로봇글(navigator.userAgent || '') } catch (e) { return false } }
const 닫았나 = () => { try { return localStorage.getItem(열쇠) === 판 } catch (e) { return false } }
const 봤나 = () => { try { return sessionStorage.getItem(본열쇠) === 판 } catch (e) { return false } }

function 공지창({ 오늘, 닫기, 그만 }) {
  const 상자 = useRef(null)
  const 닫기글 = useRef(닫기)
  닫기글.current = 닫기
  useEffect(() => {   /* 열릴 때 한 번 — Esc 로 닫기 · 뒤 화면 굴러가지 않게 · 창에 초점 */
    const 키 = (e) => { if (e.key === 'Escape') 닫기글.current() }
    window.addEventListener('keydown', 키)
    const 전 = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    try { 상자.current && 상자.current.focus({ preventScroll: true }) } catch (e) { /* 옛 브라우저 */ }
    return () => { window.removeEventListener('keydown', 키); document.body.style.overflow = 전 }
  }, [])
  const 연휴 = 오늘 <= 연휴끝
  /* 몸(body)에 바로 붙임 — 화면 틀 안에 두면 아래 탭바(메뉴)가 창 위로 올라옴(폰에서 실제로 그랬음) */
  return createPortal(
    <div className="noticepop" onClick={(e) => { if (e.target === e.currentTarget) 닫기() }}>
      <div className="noticepop-c" role="dialog" aria-modal="true" aria-labelledby="noticepop-h" tabIndex={-1} ref={상자}>
        <button type="button" className="noticepop-x" aria-label="공지 닫기" onClick={닫기}>✕</button>
        <div className="noticepop-tag">📢 공지</div>
        <h2 id="noticepop-h" className="noticepop-h">찾아 주셔서 고맙습니다</h2>
        <div className="noticepop-b">
          <p>안녕하십니까, K-건설맵을 만든 토목 현장소장입니다.</p>
          <p>문을 연 지 아직 한 달이 채 안 됐는데, 생각보다 훨씬 많은 분들이 찾아 주셨습니다. 현장에서, 사무실에서 열어 봐 주시고 글도 남겨 주셔서 <b>정말 고맙습니다.</b></p>
          <p>오늘은 경리·공무 일을 덜어 드릴 프로그램 세 가지를 더 올렸습니다.</p>
          <ul>
            <li><Link to="/tools/singo" onClick={닫기}>📮 매달 신고 정리</Link> — 원천세·지방소득세·근로내용 확인신고·퇴직공제 기한과 넣을 숫자를 한 화면에</li>
            <li><Link to="/tools/toejik" onClick={닫기}>👷 퇴직공제 집계</Link> — 입찰공고일에 맞는 일액으로 근로일수·부금 계산, 계상액과 비교</li>
            <li><Link to="/tools/boheomryo" onClick={닫기}>🧾 고용·산재 보험료</Link> — 개산·확정·분할 납부 기한까지</li>
          </ul>
          <p>노무비 계산기에 적은 출역을 그대로 쓰니 다시 적지 않으셔도 됩니다. 해마다 바뀌는 요율도 원문을 확인해 한 곳에서 챙기겠습니다.</p>
          <p>쓰시다가 불편한 점이나 틀린 곳, «이런 것도 있으면 좋겠다» 싶은 것은 맵톡에 편하게 남겨 주십시오. 하나하나 읽고 고쳐 나가겠습니다.</p>
          <p>{연휴 ? <>이번 주말은 개천절 연휴네요. <b>푹 쉬시고, 즐거운 주말 보내십시오.</b></> : <b>늘 안전한 현장 되십시오.</b>}</p>
          <p className="noticepop-sign">— 토목 현장소장 김명환 · K-건설맵</p>
        </div>
        <div className="noticepop-f">
          <Link className="btn line sm" to={글주소} onClick={닫기}>💬 맵톡에서 보기 · 답글</Link>
          <button type="button" className="btn line sm" onClick={그만}>다시 보지 않기</button>
          <button type="button" className="btn sm" onClick={닫기}>닫기</button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default function 감사공지() {
  const { pathname } = useLocation()
  const [닫힘, set닫힘] = useState(() => 닫았나())
  /* 창 — 이 창(탭)을 연 뒤 처음 한 번 저절로. 그 공지 글을 보는 화면에서는 저절로 안 띄움 */
  const [창, set창] = useState(() => !닫았나() && !봤나() && pathname !== 글주소)
  const 오늘 = 한국오늘()
  if (닫힘 || 오늘 > 까지 || 로봇() || pathname.startsWith('/admin')) return null
  const 본표 = () => { try { sessionStorage.setItem(본열쇠, 판) } catch (e) { /* 사생활 창 */ } }
  const 창닫기 = () => { 본표(); set창(false) }
  const 그만 = () => { try { localStorage.setItem(열쇠, 판) } catch (e) { /* 사생활 창 — 이번만 */ } 본표(); set창(false); set닫힘(true) }
  return (
    <>
      <div className="noticebar" role="note">
        <span className="t">🙏 문을 연 지 한 달도 안 됐는데 많은 분들이 찾아 주셨습니다 — <b>고맙습니다!</b>
          {오늘 <= 연휴끝 ? ' 개천절 연휴, 즐거운 주말 보내십시오.' : ' 늘 안전한 현장 되십시오.'}</span>
        <button type="button" className="go" onClick={() => set창(true)}>공지 보기</button>
        <button type="button" className="x" aria-label="공지 닫기" title="닫기 — 이 공지는 다시 안 뜹니다" onClick={그만}>✕</button>
      </div>
      {창 && <공지창 오늘={오늘} 닫기={창닫기} 그만={그만} />}
    </>
  )
}
