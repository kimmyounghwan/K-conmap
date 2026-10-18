/**
 * 📷 옆에 붙은 «+» 찍기 단추 (G322 · 2026-10-18) — 폰에서만 · 어느 화면에서나 한 번 눌러 바로 찍기
 *   소장님: 「옆에 붙어 있는 + 표시가 사진 찍는 거거든 우리도 할 수 있어?」 → 「3번으로 해보자」(찍고 나서 고르기) 「해보자 보여줘」
 * ■ 누르면 폰 카메라가 바로 뜸(input capture) → 찍은 뒤 «🗺 맵톡에 올리기 · 📐 사진→캐드로 바꾸기 · 📷 다시 찍기 · 닫기»
 *   맵톡: 글쓰기에 사진이 붙은 채로 열림(제목 · 내용을 적고 «올리기» 를 눌러야 올라감)
 *   캐드: 사진→캐드가 그 사진으로 바로 시작
 * ■ 사진은 «올리기» 를 누르기 전까지 이 폰 밖으로 나가지 않습니다(lib/찍은사진.js — 탭 메모리).
 * ■ 폰의 모든 화면(소장님 「모든 화면에 뜨게 해줘」 — 맵톡 · 사진→캐드 포함). PC(마우스)에서는 그리지 않음 — 카메라 대신 파일 고르기 창이 떠서.
 * ■ 쓴 횟수(소장님만 · 사이트 전체 줄): |찍기|열기 · |찍기|찍음 · |찍기|맵톡 · |찍기|캐드 · |찍기|다시 · |찍기|닫음
 */
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { 세기 } from './lib/받은수.jsx'
import { 맡기기 } from './lib/찍은사진.js'

const 숨길곳 = []   /* 소장님 「모든 화면에 뜨게 해줘」 — 사진→캐드 화면에도(같은 화면이면 사건으로 바로 받음) */
const 폰인가 = () => {
  try { return window.matchMedia('(hover: none) and (pointer: coarse)').matches } catch (e) { return false }
}

export default function 찍기단추() {
  const [폰, set폰] = useState(폰인가)
  const [찍은, set찍은] = useState(null)      /* { 파일, 미리 } */
  const 칸 = useRef(null)
  const 길 = useLocation()
  const 가기 = useNavigate()

  useEffect(() => {
    let m
    try { m = window.matchMedia('(hover: none) and (pointer: coarse)') } catch (e) { return undefined }
    const 바뀜 = () => set폰(m.matches)
    m.addEventListener ? m.addEventListener('change', 바뀜) : m.addListener(바뀜)
    return () => { m.removeEventListener ? m.removeEventListener('change', 바뀜) : m.removeListener(바뀜) }
  }, [])
  useEffect(() => () => { if (찍은) URL.revokeObjectURL(찍은.미리) }, [찍은])
  /* 화면을 옮기면 창은 닫음(사진을 넘긴 뒤 · 뒤로 가기) */
  useEffect(() => { set찍은(null) }, [길.pathname])

  if (!폰 || 숨길곳.some((p) => 길.pathname === p || 길.pathname.startsWith(p + '/'))) return null

  const 찍기 = () => { 세기('|찍기|열기'); 칸.current?.click() }
  const 받음 = (e) => {
    const f = e.target.files && e.target.files[0]
    e.target.value = ''
    if (!f) return
    if (!/^image\//.test(f.type || '')) return
    set찍은({ 파일: f, 미리: URL.createObjectURL(f) })
    세기('|찍기|찍음')
  }
  const 보내기 = (곳) => {
    if (!찍은) return
    맡기기(찍은.파일, 곳)
    세기(곳 === '맵톡' ? '|찍기|맵톡' : '|찍기|캐드')
    const 갈 = 곳 === '맵톡' ? '/qna' : '/tools/sajincad'
    if (길.pathname === 갈) set찍은(null)      /* 같은 화면이면 사건으로 바로 받음 */
    else 가기(갈)
  }

  return (
    <>
      <button type="button" className="cam-tab" onClick={찍기} aria-label="사진 찍기 — 찍은 뒤 맵톡에 올리거나 캐드로 바꿉니다">
        <span className="cam-tab-plus" aria-hidden="true">+</span>
        <svg className="cam-tab-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>
      </button>
      <input ref={칸} type="file" accept="image/*" capture="environment" className="sr-only" tabIndex={-1} onChange={받음} />
      {찍은 && (
        <div className="cam-dim" onClick={() => { set찍은(null); 세기('|찍기|닫음') }}>
          <div className="cam-sheet" role="dialog" aria-label="찍은 사진 — 어디로 보낼까요" onClick={(e) => e.stopPropagation()}>
            <div className="cam-grab" aria-hidden="true" />
            <img className="cam-img" src={찍은.미리} alt="방금 찍은 사진" />
            <div className="cam-q">이 사진을 어디로 보낼까요?</div>
            <div className="cam-btns">
              <button type="button" className="btn primary" onClick={() => 보내기('맵톡')}>🗺 맵톡에 올리기</button>
              <button type="button" className="btn line" onClick={() => 보내기('캐드')}>📐 사진→캐드로 바꾸기</button>
            </div>
            <div className="cam-btns sub">
              <button type="button" className="btn line sm" onClick={() => { 세기('|찍기|다시'); 칸.current?.click(); set찍은(null) }}>📷 다시 찍기</button>
              <button type="button" className="btn line sm" onClick={() => { set찍은(null); 세기('|찍기|닫음') }}>닫기</button>
            </div>
            <div className="cam-note">맵톡은 글쓰기에 사진이 붙은 채로 열립니다 — 제목 · 내용을 적고 «올리기» 를 누르셔야 올라갑니다. 그 전에는 사진이 이 폰 밖으로 나가지 않습니다.</div>
          </div>
        </div>
      )}
    </>
  )
}
