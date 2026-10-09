/**
 * 👆 손끝 고르기 (G215 · 2026-10-09) — 검색 목록을 «손가락을 떼는 순간» 고릅니다.
 *
 * ■ 왜: 소장님 「업체분석에서 업체가 나오면 선택하게 해줘야 하는데 지금 그게 아니야」 (아이폰 · 「호남산업」 을 치고 목록이 뜬 채)
 *   아이폰 사파리는 한글을 치는 중(마지막 글자가 아직 «조합 중» — 받침이 더 붙을 수 있어 키보드가 쥐고 있음)에
 *   다른 곳을 누르면 **첫 누름(click)을 보내지 않습니다.** 키보드가 그대로 떠 있으니 다시 눌러도 또 «첫 누름» 이라
 *   목록을 아무리 눌러도 안 골라집니다. (애플 개발자 포럼 2025-10 「first click, blur … not working after typing Korean」 · FB20773704)
 *   손가락이 닿고 떨어지는 것(touchstart · touchend)은 그대로 옵니다 — 그래서 그때 고릅니다.
 * ■ 지키는 것
 *   · 목록을 굴리려고 움직였으면(10px 넘게) 고르지 않습니다 · 두 손가락이면 안 고릅니다.
 *   · 떼는 순간 고른 뒤 뒤따르는 click 은 막습니다(두 번 고르지 않게). 마우스 · 키보드(엔터)는 예전처럼 click 으로.
 *   · 고르기 전에 글칸을 놓아(blur) 조합 중이던 글자를 끝내고 키보드를 내립니다.
 * ■ 쓰는 법: <button {...손끝(() => pick(it), '업체')}> — 둘째 값은 숨은 누적 열쇠(|손끝고름|업체) · 화면엔 안 보임.
 */
import { 세기 } from './받은수.jsx'

let 닿음 = null          // { x, y, el } — 한 번에 한 손가락만
let 고른때 = 0

const 놓기 = () => {
  try {
    const a = document.activeElement
    if (a && a !== document.body && /^(INPUT|TEXTAREA)$/.test(a.tagName) && a.blur) a.blur()
  } catch (e) { /* 못 놓아도 고르기는 합니다 */ }
}

export function 손끝(fn, 이름) {
  return {
    onTouchStart(e) {
      const t = e.touches && e.touches[0]
      닿음 = t && e.touches.length === 1 ? { x: t.clientX, y: t.clientY, el: e.currentTarget } : null
    },
    onTouchMove(e) {
      const t = e.touches && e.touches[0]
      if (닿음 && (!t || e.touches.length > 1 || Math.hypot(t.clientX - 닿음.x, t.clientY - 닿음.y) > 10)) 닿음 = null
    },
    onTouchCancel() { 닿음 = null },
    onTouchEnd(e) {
      const 그 = 닿음
      닿음 = null
      if (!그 || 그.el !== e.currentTarget) return
      if (e.cancelable) e.preventDefault()          // 뒤따르는 click · 초점 옮김을 막음(두 번 안 고르게)
      고른때 = Date.now()
      놓기()
      if (이름) 세기('|손끝고름|' + 이름)
      fn(e)
    },
    onClick(e) {
      if (Date.now() - 고른때 < 700) return          // 방금 손끝으로 골랐음
      fn(e)
    },
  }
}
