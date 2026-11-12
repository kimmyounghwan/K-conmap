/* 🤝 G659 공사 연결 · 서류 작성 대행 띠 (2026-11-12 22시)
 *   소장님: 「건설맵에 전남 공사 문의하시면 k-건설맵에서 연결해 준다는 내용의 알림을 사이트에 넣었으면 하는데. 아이디어 줘봐」
 *          → 안 하나로 → 「1번 만」 · 「우선 만들어서 보여 줘」 · 「색을 다르게 해서 잘 보이게」(진초록) ·
 *          → 「전국으로 하자」 「공사 연결」 「그리고, 모든 서류 작성 가능」 「견본 제공 후 최저가로 작성」
 *          → 「다시 만들어 줘. 전국 공사 연결 및 설계변경, 안전관리계획서, 등 모든 서류 작성 대행 최저가로」 · 「올리지 말고 다시 작성해서 보여 줘」
 *   ■ 누구에게: 모든 손님(전국 — 처음 시안의 «전남 손님만» 은 뺌) · 로봇 · 인쇄 · 관리자 화면엔 안 나옴
 *   ■ 어디서: 모든 쪽(모든 탭 — 바로투찰 · 1순위 · 공고 · 도구 · 서식 · 내역서 · 적산 · 마이컨맵 · 맵톡 · 자격증 · 용역 · 물품 …) · 관리자(/admin)만 뺌
 *     (처음엔 공고 · 서식 쪽만 → 소장님 「모든칸에 넣어 줘」)
 *   ■ 꼴: 한 줄(진초록 · 흰 글 · 흰 단추) «🤝 전국 공사 연결 · 📄 모든 서류 작성 대행 · 설계변경 · 안전관리계획서 · 유해위험방지계획서 등 — 견본 먼저, 최저가로 · 문의 남기기 ▸»
 *     (소장님 시안 보시고 「유해위험방지계획서」 — 띠 · 문의 안내 · 고르기에 더함)
 *     → «의견 더해서 문장 다시 만들어 달라»: «모든 서류 작성 대행» → «건설 서류 무엇이든 대신 작성»(과장으로 안 읽히게) ·
 *       «견본 먼저, 최저가로» → «견본 먼저 보시고 최저가로 맡기세요»(맡기는 쪽 걱정 덜게) · 단추 «문의 남기기» → «상담 · 견적 받기»(누르면 무엇을 받는지)
 *     → 「빈공간 없이 다시 만들어 줘」(점 칸 없앰 · ✕ 구석 · 폰은 줄 가득) · 「작성대행으로 해줘」(«대신 작성» · «서류 대행» → «작성대행»)
 *     + ✕ = 오늘 하루 안 보임(localStorage kcm.cn.hide = 한국 날짜) · 띄우는 창 없음 — 「광고는 이용자가 불편하지 않게」
 *   ■ 문의: /contact?k=cn — 지금 있는 비공개 문의(운영자 메일로만 · 남에게 안 보임 · 문의함) · 필요한 것(공사 연결 다섯 · 서류 다섯)
 *   ■ 숨은 셈: |공사연결|보임(이 탭에서 한 번) · |공사연결|누름 · |공사연결|닫음 · |공사연결|접수(contact.html 이 보낸 뒤)
 *   ⚠️ 씀-앞 «밖»(App.jsx 쿠팡 맨 위 줄 바로 다음) — 띠를 누른 것이 도구 «써 본 횟수» 로 안 세짐
 */
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { 세기 } from './lib/받은수.jsx'
import { 로봇 as 로봇글 } from './lib/인사.js'

/** 띠를 다는 쪽인가 — 소장님 「모든칸에 넣어 줘」 → 모든 쪽 · 관리자 화면만 뺌 */
export const 띠쪽인가 = (p) => !/^\/admin(\/|$)/.test(String(p || '/'))
export const 닫음열쇠 = 'kcm.cn.hide'
export const 문의주소 = '/contact?k=cn'
const 본열쇠 = 'kcm.cn.seen'
const 한국오늘 = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10)
const 로봇 = () => { try { return 로봇글(navigator.userAgent || '') } catch (e) { return false } }
const 오늘닫음 = () => { try { return localStorage.getItem(닫음열쇠) === 한국오늘() } catch (e) { return false } }

export default function 공사연결띠() {
  const { pathname } = useLocation()
  const [닫음, set닫음] = useState(오늘닫음)
  const 보임 = !닫음 && 띠쪽인가(pathname) && !로봇()
  useEffect(() => {
    if (!보임) return
    try { if (sessionStorage.getItem(본열쇠)) return; sessionStorage.setItem(본열쇠, '1') } catch (e) { /* 이번만 */ }
    세기('|공사연결|보임')
  }, [보임])
  if (!보임) return null
  /* contact.html 은 정적 쪽(새로 읽음) — 셈이 가고 나서 넘어가게 잠깐(0.7초 안) 기다림 */
  const 가기 = async (e) => {
    e.preventDefault()
    try { await Promise.race([세기('|공사연결|누름'), new Promise((r) => setTimeout(r, 700))]) } catch (er) { /* 셈 때문에 막히면 안 됨 */ }
    window.location.href = 문의주소
  }
  const 닫기 = () => {
    try { localStorage.setItem(닫음열쇠, 한국오늘()) } catch (e) { /* 이번만 */ }
    set닫음(true)
    세기('|공사연결|닫음')
  }
  return (
    <div className="noti-band cn" role="note">
      <span className="noti-dot" />
      <a className="noti-go" href={문의주소} onClick={가기}>
        <b>🤝 전국 공사 연결 · 📄 건설 서류 무엇이든 작성대행</b>
        <span className="cn-what">설계변경 · 안전관리계획서 · 유해위험방지계획서 등 — 견본 먼저 보시고 최저가로 맡기세요</span>
        <span className="noti-see">상담 · 견적 받기 ▸</span>
      </a>
      <button type="button" className="noti-x" onClick={닫기} aria-label="오늘 하루 닫기" title="오늘 하루 안 보기">✕</button>
    </div>
  )
}
