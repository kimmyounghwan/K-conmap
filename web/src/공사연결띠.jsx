/* 🤝 G659 공사 연결 · 서류 작성대행 띠 (2026-11-12 22시) → 🔁 G662 (2026-11-13 아침) «늘 보이게 · 닫기 없음 · 모든 쪽»
 *   소장님: 「건설맵에 전남 공사 문의하시면 k-건설맵에서 연결해 준다는 내용의 알림을 사이트에 넣었으면 하는데. 아이디어 줘봐」
 *          → 안 하나로 → 「1번 만」 · 「우선 만들어서 보여 줘」 · 「색을 다르게 해서 잘 보이게」(진초록) ·
 *          → 「전국으로 하자」 「공사 연결」 「그리고, 모든 서류 작성 가능」 「견본 제공 후 최저가로 작성」
 *          → 「다시 만들어 줘. 전국 공사 연결 및 설계변경, 안전관리계획서, 등 모든 서류 작성 대행 최저가로」 · 「올리지 말고 다시 작성해서 보여 줘」
 *          → 11-13 「내 밥 줄인데, 항상 보이게 해야지.」 「모든 페이지에 넣고」 「공사 연결 및 서류 작성은 항상 보이게… 모든 페이지에 달기」
 *   ■ 누구에게: 모든 손님(전국) · 로봇 · 인쇄엔 안 나옴
 *   ■ 어디서: 모든 쪽(모든 탭 · 관리자 화면까지 — G662 에서 /admin 도 넣음) · 정적 쪽(소개 · 개인정보 · 약관 · 문의 · ShareOne 설명서)은 public/cn-band.js
 *   ■ 꼴: ① 큰 띠 — 쿠팡 맨 위 줄 바로 다음(진초록 · 흰 글 · 흰 단추) «🤝 전국 공사 연결 · 📄 건설 서류 무엇이든 작성대행 …»
 *         ② 작은 띠 — 내려서 큰 띠가 머리줄 밑으로 지나가면 머리줄 바로 아래에 한 줄(.cn-mini · 머리줄 안에 «매달림» → 머리줄 높이는 그대로)
 *            → 어디까지 내려도 늘 보임. 큰 띠가 다시 보이면 작은 띠는 들어감(두 개가 같이 보이지 않게)
 *         ⚠️ G662: ✕(오늘 하루 닫기) 없앰 — 「항상 보이게」. 예전에 ✕ 를 눌러 둔 값(kcm.cn.hide)은 이제 안 봄
 *         ⚠️ 작은 띠가 보이는 동안 html.cn-mini-on(--cn-h 34px) — 머리줄 밑에 붙는 칸(도면판 · 되돌리기 · 오른쪽 칸 …)은 그만큼 내려 붙음(styles.css «G662»)
 *            (G198 교훈: 머리줄을 키우면 «머리줄 아래 붙는 칸» 이 가려짐 → 머리줄은 그대로 두고 매달기)
 *   ■ 문의: /contact?k=cn — 지금 있는 비공개 문의(운영자 메일로만 · 남에게 안 보임 · 문의함) · 필요한 것(공사 연결 다섯 · 서류 여섯)
 *   ■ 숨은 셈: |공사연결|보임(이 탭에서 한 번) · |공사연결|누름(큰 띠) · |공사연결|작은누름(작은 띠) · |공사연결|접수(contact.html 이 보낸 뒤)
 *   ⚠️ 씀-앞 «밖»(App.jsx 쿠팡 맨 위 줄 바로 다음 · 작은 띠는 머리줄 안) — 띠를 누른 것이 도구 «써 본 횟수» 로 안 세짐
 *   📐 G693 (2026-11-15) 소장님 「도면 및 건설서류 작성 대행 — 작성대행에 도면 문구 삽입 가능해. 아이디어 줘봐」 → 안 여덟 → «그렇게 해»
 *     · 큰 띠 «🤝 전국 공사 연결 · 📐 도면 · 📄 건설서류 작성대행» + «시공상세도 · 준공도면 · 설계변경 도면 · 안전관리계획서 · 유해위험방지계획서 등 — …»
 *     · 작은 띠 «🤝 공사 연결 · 📐 도면 · 📄 서류 작성대행» — 좁은 폰은 그림 글자 · «상담 · » 를 숨겨 안 잘리게(styles.css «G693» · 폭마다 잼)
 *     · 도면 도구 쪽 끝 한 줄(도면대행줄 — 쪽은 도면줄길 · prerender.py 와 두 벌 · 시험_잠금문의 가 대조) · 숨은 셈 |공사연결|도면줄-<쪽>
 *     · «설계» 는 «설계변경 도면» 말고 안 씀 — 건축 허가 · 신고용 설계는 건축사 일(건축법 제23조 · 건축사법) · 시공상세도는 건설사업자가 그리는 것(건설기술 진흥법 제48조)
 */
import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { 세기 } from './lib/받은수.jsx'
import { 로봇 as 로봇글 } from './lib/인사.js'

/** 띠를 다는 쪽인가 — 소장님 「모든 페이지에 넣고」 → 모든 쪽(관리자 화면까지) */
export const 띠쪽인가 = () => true
export const 문의주소 = '/contact?k=cn'
const 본열쇠 = 'kcm.cn.seen'
const 로봇 = () => { try { return 로봇글(navigator.userAgent || '') } catch (e) { return false } }

/* contact.html 은 정적 쪽(새로 읽음) — 셈이 가고 나서 넘어가게 잠깐(0.7초 안) 기다림 */
const 가기 = async (e, 열쇠, 갈곳 = 문의주소) => {
  e.preventDefault()
  try { await Promise.race([세기(열쇠), new Promise((r) => setTimeout(r, 700))]) } catch (er) { /* 셈 때문에 막히면 안 됨 */ }
  window.location.href = 갈곳
}

/* 큰 띠가 머리줄 밑으로 지나갔나 → html.cn-mini-on (작은 띠 보임 · --cn-h)
   ⚠️ html 표시 이름을 작은 띠 칸 이름(.cn-mini)과 같게 쓰면 .cn-mini{display:none} 이 html 에도 걸려 화면이 통째로 사라짐(시험이 잡음) */
const 작은띠맞춤 = (띠) => {
  const r = document.documentElement
  let 켬 = false
  try {
    const 머리 = document.querySelector('.topbar')
    const 머리밑 = 머리 ? 머리.getBoundingClientRect().bottom : 0
    const 칸 = 띠 && 띠.isConnected ? 띠.getBoundingClientRect() : null
    켬 = !!칸 && 칸.height > 0 && 칸.bottom <= 머리밑 + 1      // 큰 띠가 안 그려졌으면(인쇄 · 숨김) 작은 띠도 안 냄
  } catch (e) { 켬 = false }
  if (r.classList.contains('cn-mini-on') !== 켬) r.classList.toggle('cn-mini-on', 켬)
}

export default function 공사연결띠() {
  const { pathname } = useLocation()
  const 띠 = useRef(null)
  const 보임 = 띠쪽인가(pathname) && !로봇()
  useEffect(() => {
    if (!보임) return
    try { if (sessionStorage.getItem(본열쇠)) return; sessionStorage.setItem(본열쇠, '1') } catch (e) { /* 이번만 */ }
    세기('|공사연결|보임')
  }, [보임])
  useEffect(() => {
    if (!보임) return undefined
    let 줄 = 0
    const 봄 = () => { if (!줄) 줄 = requestAnimationFrame(() => { 줄 = 0; 작은띠맞춤(띠.current) }) }
    봄()
    window.addEventListener('scroll', 봄, { passive: true })
    window.addEventListener('resize', 봄)
    const 늦게 = setTimeout(봄, 400)        // 쪽을 옮긴 뒤 글이 다 그려지고 한 번 더
    return () => {
      window.removeEventListener('scroll', 봄); window.removeEventListener('resize', 봄); clearTimeout(늦게)
      if (줄) cancelAnimationFrame(줄)
      document.documentElement.classList.remove('cn-mini-on')
    }
  }, [보임, pathname])
  if (!보임) return null
  return (
    <div className="noti-band cn" role="note" ref={띠}>
      <span className="noti-dot" />
      <a className="noti-go" href={문의주소} onClick={(e) => 가기(e, '|공사연결|누름')}>
        <b>🤝 전국 공사 연결 · 📐 도면 · 📄 건설서류 작성대행</b>
        <span className="cn-what">시공상세도 · 준공도면 · 설계변경 도면 · 안전관리계획서 · 유해위험방지계획서 등 — 견본 먼저 보시고 최저가로 맡기세요</span>
        <span className="noti-see">상담 · 견적 받기 ▸</span>
      </a>
    </div>
  )
}

/** 작은 띠 — 머리줄(.topbar) 안 맨 아래에 매달림(App.jsx) · html.cn-mini-on 일 때만 보임(styles.css) */
export function 공사연결작은띠() {
  if (로봇()) return null
  return (
    <a className="cn-mini" href={문의주소} onClick={(e) => 가기(e, '|공사연결|작은누름')} aria-label="전국 공사 연결 · 도면 · 건설서류 작성대행 — 상담 · 견적 받기">
      <span className="cn-mini-in">
        <span className="cn-mini-t"><b>🤝 공사 연결 · <span className="cn-mini-e">📐 </span>도면 · <span className="cn-mini-e">📄 </span>서류 작성대행</b><span className="cn-mini-s"> — 견본 먼저 · 최저가</span></span>
        <span className="cn-mini-go"><span className="cn-mini-g2">상담 · </span>견적 ▸</span>
      </span>
    </a>
  )
}

/* 📐 G693 도면 도구 쪽 끝 한 줄 — 소장님 «그렇게 해»(안 ④ «도면 도구 쪽 결과 아래 한 줄») · App.jsx 씀-뒤 바로 다음(씀 밖 — 누른 것이 도구 «써 본 횟수» 로 안 세짐)
 *   쪽 = 도면줄길(⚠️ prerender.py 도면줄길 · 도면줄글 과 두 벌 — 구운 쪽(구글)에도 같은 줄 · 시험_잠금문의 가 대조) · 잠근 도구(캐드 고치기 · 컬러 평면도)는 잠금 상자가 문의라 뺌
 *   누르면 /contact?k=cn&t=도면 («자세히» 에 ««도면» 작성대행 · 견적 문의합니다.» · 도면 묶음은 이용자가 고름) · 숨은 셈 |공사연결|도면줄-<쪽> */
export const 도면줄길 = ['/cad', '/cad/*', '/tools/dxfpdf', '/tools/dwgdxf', '/tools/dxf3d', '/tools/sajincad', '/tools/tojeok', '/jeoksan', '/jeoksan/golgo', '/jeoksan/magam', '/jeoksan/auto', '/jeoksan/model', '/jeoksan/bim']
export const 도면줄글 = '📐 도면 작성 · 캐드 대행이 필요하시면 — 시공상세도 · 준공도면 · 설계변경 도면 · 캐드 정리까지 K-건설맵이 그려 드립니다(견본 먼저 · 최저가).'
export const 도면줄주소 = '/contact?k=cn&t=' + encodeURIComponent('도면')
/** 이 쪽의 도면줄길 한 칸('/cad/*' 는 /cad/아무거나) — 없으면 '' */
export const 도면줄칸 = (p) => {
  const 길 = String(p || '')
  return 도면줄길.find((g) => (g.endsWith('/*') ? 길.startsWith(g.slice(0, -1)) && 길.length > g.length - 1 : 길 === g)) || ''
}
export function 도면대행줄() {
  const { pathname } = useLocation()
  const 칸 = 도면줄칸(pathname)
  if (!칸) return null
  const 쪽 = 칸.replace('/*', '').replace(/^\//, '').replace(/\//g, '-')
  return (
    <div className="dm-line" role="note">
      <span className="dm-t">{도면줄글}</span>
      <a className="dm-go" href={도면줄주소} onClick={(e) => 가기(e, `|공사연결|도면줄-${쪽}`, 도면줄주소)}>📐 도면 작성대행 문의 ▸</a>
    </div>
  )
}
