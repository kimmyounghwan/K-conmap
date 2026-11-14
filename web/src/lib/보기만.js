/**
 * 🧪 G679 (2026-11-14) 잠근 도구 «예시는 보기만» — 화면에서 보는 것 말고는 다 막음
 *   소장님 08:1x 「막아 놓은 것 다시 봐봐 예시 PDF 인쇄 가능해. 예시를 볼 수만 있게 해주고 나머지는 다 막아야지.
 *   공사서류 원클릭은 인쇄 가능하게 되어 있어」 · 「PDF 다운도 가능하고」 · 「다 막아야지. 단 예시만 볼 수 있게」
 *   (G650 은 받기 단추만 잠갔음 — 원클릭 엑셀 화면의 📄 PDF · 🖨 인쇄 단추와 Ctrl+P · 복사가 남아 있었음)
 *
 *   잠근 도구가 예시를 보이는 동안만 켭니다(이용자 · 소장님이 예시로 채운 것 둘 다):
 *   ① Ctrl+P · 브라우저 인쇄 · «PDF로 저장» → 종이엔 «예시는 보기만» 안내 한 줄만(styles.css «G679» — html.kcm-보기만)
 *   ② 예시 판(아래 예시판 — 엑셀 화면 · 쪽 그림 · ESC 예시 · 평면도 · 도면 미리보기) 글 고르기 · 복사 · 잘라내기 · 끌기 · 길게 누르기(오른쪽 단추) 막음
 *   숨은 셈(쪽에 한 번씩 · 소장님 · 로봇 안 셈): |보기만|인쇄-<도구> · |보기만|복사-<도구>
 *   ⚠️ 화면 갈무리(스크린샷 · 폰 캡처)는 웹에서 막을 수 없음.
 *   새로 잠그는 도구는 예시를 보일 때 use보기만(true, '<도구>') 를 부르고, 예시 판의 칸 이름을 아래 예시판 에 더할 것
 *   (styles.css «G679» 의 고르기 막음 줄도 같이 — tools/시험_예시보기만화면.mjs ⑤ 가 두 벌을 맞춰 봄).
 */
import { useEffect } from 'react'
import { 세기 } from './받은수.jsx'

/* 예시 판 — styles.css «G679» 의 user-select 줄과 같은 목록(시험이 두 벌을 맞춰 봄) */
export const 예시판 = '.xv-판, .sg-view, .esc-ex, .cpl-view, .cfx-view, .kcm-예시판'

const 요소 = (n) => (n ? (n.nodeType === 1 ? n : n.parentElement) : null)
const 판안 = (n) => { const el = 요소(n); return !!(el && el.closest && el.closest(예시판)) }

/* 고른 글이 예시 판에 걸쳐 있나(판 안에서 시작 · 끝, 또는 Ctrl+A 처럼 판을 감쌈) */
export function 판고름() {
  const s = typeof window !== 'undefined' && window.getSelection ? window.getSelection() : null
  if (!s || !s.rangeCount || s.isCollapsed) return false
  for (let i = 0; i < s.rangeCount; i++) {
    const r = s.getRangeAt(i)
    if (판안(r.startContainer) || 판안(r.endContainer)) return true
    const 위 = 요소(r.commonAncestorContainer)
    if (위 && [...위.querySelectorAll(예시판)].some((x) => r.intersectsNode(x))) return true
  }
  return false
}

export function use보기만(켬, 도구 = '') {
  useEffect(() => {
    if (!켬 || typeof document === 'undefined') return undefined
    const h = document.documentElement
    h.classList.add('kcm-보기만')
    let 인쇄셈 = false, 복사셈 = false
    const 복사 = (e) => {
      if (!판고름()) return                       // 열쇠말 · 문의 칸 같은 글칸은 그대로
      e.preventDefault()
      if (e.clipboardData) { try { e.clipboardData.setData('text/plain', '') } catch (x) { /* 못 씀 */ } }
      if (!복사셈 && 도구) { 복사셈 = true; 세기(`|보기만|복사-${도구}`) }
    }
    const 판막기 = (e) => { if (판안(e.target)) e.preventDefault() }
    const 앞 = () => { if (!인쇄셈 && 도구) { 인쇄셈 = true; 세기(`|보기만|인쇄-${도구}`) } }
    document.addEventListener('copy', 복사, true)
    document.addEventListener('cut', 복사, true)
    document.addEventListener('dragstart', 판막기, true)
    document.addEventListener('contextmenu', 판막기, true)
    window.addEventListener('beforeprint', 앞)
    return () => {
      h.classList.remove('kcm-보기만')
      document.removeEventListener('copy', 복사, true)
      document.removeEventListener('cut', 복사, true)
      document.removeEventListener('dragstart', 판막기, true)
      document.removeEventListener('contextmenu', 판막기, true)
      window.removeEventListener('beforeprint', 앞)
    }
  }, [켬, 도구])
}
