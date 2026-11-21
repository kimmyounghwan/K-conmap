/**
 * 📄 G818 (2026-11-21) 견본 보기 — 견본 PDF 를 «새 창» 대신 사이트 안 큰 그림(쪽마다 webp)으로 · 위 · 아래 «✕ 닫기»
 *   소장님 11-21 「견본보기 서류대행 닫기가 없어 ㅎㅎ」(폰 바탕화면 아이콘 앱 — 견본 PDF 가 앱 화면을 통째로 덮어 돌아올 길이 없었음)
 *   · 단추는 <a href={pdf}> 그대로 둠(받은 수 셈 — lib/받은수.jsx 가 누름을 엿들어 «|report-sample,pdf» 로 셈 · 그림을 못 쓰면 PDF)
 *     → 누르면 새 창을 막고 덮개를 엶: 위 띠(제목 · ✕ 닫기) · 쪽 그림(늦게 읽기) · 아래 ✕ 닫기 · Esc · 뒤로(브라우저 · 안드로이드)도 닫힘
 *   · 앱(바탕화면 아이콘 · standalone)이 아니면 아래에 «📄 PDF 새 창으로» 도(앱에선 안 보임 — 다시 갇히지 않게)
 *   · 폰에서 A4 글이 작아 «🔍 크게»(그림 폭 250% · 상하좌우로 밀어 봄) ↔ «🔍 작게»
 *   · 그림: web/public/sample/{report|agency}/p1 ~ p7.webp(tools/견본그림.py 가 PDF 에서 구움)
 *   · 같은 일을 contact.html(도면 작성대행 견본 두 장)은 그 쪽 안 스크립트로 — 같은 꼴(위 · 아래 닫기 · Esc · 뒤로)
 *   시험: tools/시험_견본보기화면.mjs
 */
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export const 견본들 = {
  report: { 제목: '업체 입찰 성적표 견본', pdf: '/report-sample.pdf', 쪽: 7, 그림: (i) => `/sample/report/p${i}.webp`, w: 1117, h: 1579 },
  agency: { 제목: '발주기관 분석 견본', pdf: '/agency-sample.pdf', 쪽: 7, 그림: (i) => `/sample/agency/p${i}.webp`, w: 1117, h: 1579 },
}

/** 앱(바탕화면 아이콘)으로 열렸나 — 앱이면 PDF 새 창 길을 안 보임 */
export function 앱으로() {
  try { return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true } catch (e) { return false }
}

function 덮개({ g, 닫기 }) {
  const [크게, set크게] = useState(false)
  const 닫힘 = useRef(false)
  const 끝ref = useRef(() => 닫기())
  useEffect(() => {
    const 전 = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    let 밀었음 = false
    try { history.pushState({ ...(history.state || {}), 견본: 1 }, ''); 밀었음 = true } catch (e) { /* 없음 */ }
    const 뒤로 = () => { 닫힘.current = true; 닫기() }
    const 글쇠 = (e) => { if (e.key === 'Escape') 끝() }
    const 끝 = () => { if (닫힘.current) return; 닫힘.current = true; if (밀었음 && history.state && history.state.견본) { try { history.back(); return } catch (e) { /* 아래 */ } } 닫기() }
    끝ref.current = 끝
    window.addEventListener('popstate', 뒤로)
    window.addEventListener('keydown', 글쇠)
    return () => {
      window.removeEventListener('popstate', 뒤로)
      window.removeEventListener('keydown', 글쇠)
      document.documentElement.style.overflow = 전
    }
  }, [])   // eslint-disable-line react-hooks/exhaustive-deps
  const 닫는단추 = (곳) => <button type="button" className="gb-x" onClick={() => 끝ref.current()} aria-label={`견본 닫기(${곳})`}>✕ 닫기</button>
  return (
    <div className="gb-ov" role="dialog" aria-modal="true" aria-label={g.제목}>
      <div className="gb-top"><b>📄 {g.제목} <small>({g.쪽}쪽)</small></b>
        <button type="button" className="btn ghost gb-zoom" aria-pressed={크게} onClick={() => set크게((v) => !v)}>{크게 ? '🔍 작게' : '🔍 크게'}</button>
        {닫는단추('위')}</div>
      <div className={'gb-body' + (크게 ? ' big' : '')}>
        {Array.from({ length: g.쪽 }, (_, i) => (
          <img key={i} src={g.그림(i + 1)} alt={`${g.제목} ${i + 1}쪽`} width={g.w} height={g.h} loading={i < 2 ? 'eager' : 'lazy'} decoding="async" />
        ))}
        <div className="gb-note">견본입니다 — 업체 · 기관마다 같은 꼴로 만들어 드립니다.</div>
      </div>
      <div className="gb-foot">
        {닫는단추('아래')}
        {!앱으로() && <a className="btn ghost gb-pdf" href={g.pdf} target="_blank" rel="noopener">📄 PDF 새 창으로</a>}
      </div>
    </div>
  )
}

/** 견본 단추 — 무엇: 'report' | 'agency' · 누르면 덮개(새 창 아님) */
export default function 견본단추({ 무엇, className = 'btn primary', children }) {
  const g = 견본들[무엇]
  const [열림, set열림] = useState(false)
  if (!g) return null
  return (
    <>
      <a className={className} href={g.pdf} target="_blank" rel="noopener" onClick={(e) => { e.preventDefault(); set열림(true) }}>{children}</a>
      {열림 && createPortal(<덮개 g={g} 닫기={() => set열림(false)} />, document.body)}
    </>
  )
}
