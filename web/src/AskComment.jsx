/* 💬 «한 줄 남겨 주세요» 창 — 받거나 쓴 **직후에** (2026-09-15, 2026-09-17 창으로)
 *
 * 소장님: 「무료인 만큼 이용자는 댓글을 하나씩 달아달라고 부탁해 보자.
 *          서식 다운 받을때, 투찰금액 받을때… 등등」
 *         「다운 받거나, 바로입찰 사용시 마다. **사용후에** 댓글을 달도록 해줘. **창을 띄워줘**」
 *
 * ■ 네 가지 규칙
 *   ① **받은 뒤에** 뜹니다. 받기 전에 막지 않습니다 — 막으면 그냥 나갑니다.
 *   ② **쓸 때마다** 뜹니다(2026-09-17 에 «이레에 한 번»에서 바꿨습니다).
 *      ⚠️ 다만 **3분 안에 또 받으면 다시 안 띄웁니다.** 서식 다섯 개를 연달아 받는데
 *         창이 다섯 번 뜨면 그건 쓸 수 없는 화면이 됩니다. 「매번」의 뜻은 그게 아닙니다.
 *   ③ **「한 줄 남겨 주세요」가 아니라 «답할 수 있는 질문»** 으로 묻습니다.
 *      막연히 부탁하면 아무도 안 씁니다. 물어보면 답합니다.
 *   ④ **닫기 쉽게.** Esc · 바깥 누르기 · 「나중에」 셋 다 됩니다.
 *      닫는 길이 좁으면 사이트를 닫습니다.
 *
 * ■ 어디에 쓰나
 *     import AskStrip, { askAfter } from '../AskComment'
 *     <a ... onClick={() => askAfter('forms')}>⬇ 내려받기</a>
 *     <AskStrip />        (화면 아무 데나 한 번)
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const SEEN = 'kcm_ask_seen'      // 마지막으로 띠를 보여 준 때
const FLAG = 'kcm_ask_now'       // 방금 무엇을 받았나
const GAP = 3 * 60 * 1000      /* 연달아 받을 때만 막는 «잠깐 쉬기». 이레가 아닙니다 */

/* 갈래마다 «답할 수 있는 질문». 막연한 부탁은 넣지 않습니다. */
const ASK = {
  forms: ['받으신 서식, 현장에서 쓰시는 것과 다른 데가 있습니까?',
    '어디가 다른지 한 줄만 적어 주시면 그대로 고칩니다.'],
  change: ['설계변경 엑셀, 빠진 시트나 칸이 있습니까?',
    '현장에서 내시는 서류와 다른 데를 알려 주시면 맞추겠습니다.'],
  cad: ['캐드 유틸, 어떤 명령이 하나 더 있으면 좋겠습니까?',
    '자주 쓰시는 계산을 알려 주시면 만들어 붙이겠습니다.'],
  bid: ['권장 투찰금액, 실제 개찰과 얼마나 맞던가요?',
    '맞았는지 빗나갔는지 알려 주시면 셈을 고쳐 나갑니다.'],
  jeoksan: ['나온 수량산출서, 손으로 세신 것과 맞던가요?',
    '어긋난 줄이 있으면 그 줄만 알려 주십시오. 그대로 고칩니다.'],
  shareone: ['쉐어원, 사무실에서 잘 붙던가요?',
    '안 붙으면 어느 대목에서 막혔는지 한 줄만 적어 주십시오.'],
}

export function askAfter(kind) {
  try { sessionStorage.setItem(FLAG, kind) } catch { /* 사생활 모드 */ }
}

export default function AskStrip() {
  const [kind, setKind] = useState('')
  useEffect(() => {
    const t = setInterval(() => {
      let k = ''
      try { k = sessionStorage.getItem(FLAG) || '' } catch { return }
      if (!k || !ASK[k]) return
      let last = 0
      try { last = Number(localStorage.getItem(SEEN) || 0) } catch { /* 무시 */ }
      if (Date.now() - last < GAP) { try { sessionStorage.removeItem(FLAG) } catch { } ; return }
      setKind(k)
      try {
        sessionStorage.removeItem(FLAG)
        localStorage.setItem(SEEN, String(Date.now()))
      } catch { /* 무시 */ }
    }, 800)
    return () => clearInterval(t)
  }, [])
  /* Esc 로 닫기 — 닫는 길을 좁히지 않습니다 */
  useEffect(() => {
    if (!kind) return undefined
    const esc = (e) => { if (e.key === 'Escape') setKind('') }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [kind])

  if (!kind) return null
  const [q, sub] = ASK[kind]
  return (
    <div className="askwrap" onClick={() => setKind('')}>
      <div className="askbox" onClick={(e) => e.stopPropagation()}
        role="dialog" aria-modal="true" aria-label="한 줄 남기기">
        <button className="askx" onClick={() => setKind('')} aria-label="닫기">✕</button>
        <div className="q">💬 {q}</div>
        <div className="s">{sub}</div>
        <div className="b">
          <Link className="btn primary" to={`/qna?ask=${encodeURIComponent(q)}`}
            onClick={() => setKind('')}>✏️ 한 줄 남기기</Link>
          <button className="btn ghost" onClick={() => setKind('')}>나중에</button>
        </div>
        <div className="askft">가입도 이름도 없습니다 · 사랑방에 올라갑니다</div>
      </div>
    </div>
  )
}
