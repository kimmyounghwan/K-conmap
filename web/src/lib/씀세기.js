/* ✍ 써 본 횟수 — 2026-10-21 소장님 상시 지시 「기능에 세기 넣어」 · 도구 점검 70(10/21)에서 세기가 빠진 곳 47 군데
 *
 * 화면 하나하나에 세기('|…') 를 넣지 않고 여기 한 곳에서 셉니다(새 도구를 만들어도 빠지지 않게).
 * ■ 무엇을 세나 — 화면 «안» (App.jsx 의 <Outlet /> 앞뒤 표시 사이)에서 사람이 처음 손댄 것:
 *   칸에 쓰기 · 고르기 · 단추 누르기 · 체크. 화면에 한 번 들어와 처음 손댈 때 한 번만 +1(같은 화면에서 더 눌러도 그대로).
 *   다른 화면으로 갔다가 다시 와서 손대면 또 +1. 새로고침도 새로 들어온 것.
 * ■ 안 세는 것: 화면을 옮기는 링크 누름 · 위 띠 · 아래 바닥글 · 코드가 채운 것(e.isTrusted 아님) ·
 *   운영자(소장님) 브라우저 · 자동 브라우저 — lib/받은수.jsx 세기 와 같음.
 * ■ 열쇠: dl/p/«|씀|tools-nomubi» — 규칙(database.rules.json dl/p) 그대로 «|두|마디» · 1씩만.
 *   /tools · /forms · /jeoksan · /change · /naeyeok · /goods · /svc · /report · /cad 는 앞 두 마디, 그 밖에 아래 «한 마디» 화면만.
 * ■ 숫자는 이용자 화면 어디에도 안 나옵니다 — 소장님 브라우저의 «🔢 쓴 횟수» 판(lib/쓴수판.jsx)에만.
 * ■ 비용: 화면마다 처음 손댈 때 작은 요청 두 번(읽고 · 1 더하기).
 */
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { 세기 } from './받은수.jsx'
import { 씀열쇠 } from './씀열쇠.js'

export { 씀열쇠 }

const 손댐 = (t) => {
  if (!t || !t.closest) return null
  const a = t.closest('a[href]')
  if (a && !a.hasAttribute('download')) return null          // 화면을 옮기는 링크
  return t.closest('button, input, select, textarea, label, summary, [role=button], [role=tab], [contenteditable=""], [contenteditable=true], a[download]')
}

/** 화면 «안» 인가 — <span id="씀-앞" /> 과 <span id="씀-뒤" /> 사이 */
function 안인가(t) {
  const 앞 = document.getElementById('씀-앞'), 뒤 = document.getElementById('씀-뒤')
  if (!앞 || !뒤 || !t) return false
  return !!(앞.compareDocumentPosition(t) & Node.DOCUMENT_POSITION_FOLLOWING) && !!(뒤.compareDocumentPosition(t) & Node.DOCUMENT_POSITION_PRECEDING)
}

/** App.jsx 에서 한 번 — 화면이 바뀔 때마다 «처음 손댐» 을 새로 기다립니다 */
export function use씀세기() {
  const { pathname } = useLocation()
  useEffect(() => {
    const 열쇠 = 씀열쇠(pathname)
    if (!열쇠 || typeof document === 'undefined') return undefined
    let 셌음 = false
    const 들음 = (e) => {
      try {
        if (셌음 || !e.isTrusted) return
        const t = e.type === 'click' ? 손댐(e.target) : e.target
        if (!t || !안인가(t)) return
        셌음 = true
        끄기()
        세기(열쇠)
      } catch (er) { /* 세는 것 때문에 화면이 막히면 안 됩니다 */ }
    }
    const 갈래 = ['click', 'input', 'change']
    const 끄기 = () => 갈래.forEach((g) => document.removeEventListener(g, 들음, true))
    갈래.forEach((g) => document.addEventListener(g, 들음, true))
    return 끄기
  }, [pathname])
}
