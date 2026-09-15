/* 💬 «한 줄 남겨 주세요» 띠 — 서식·캐드·엑셀을 **받은 직후에만** (2026-09-15)
 *
 * 소장님: 「무료인 만큼 이용자는 댓글을 하나씩 달아달라고 부탁해 보자.
 *          서식 다운 받을때, 투찰금액 받을때… 등등」
 *
 * ■ 세 가지 규칙
 *   ① **받은 직후에만** 뜹니다. 화면에 들어오자마자 조르지 않습니다.
 *   ② **이레에 한 번만.** 같은 사람에게 매번 뜨면 그게 광고입니다.
 *   ③ **「한 줄 남겨 주세요」가 아니라 «답할 수 있는 질문»** 으로 묻습니다.
 *      막연히 부탁하면 아무도 안 씁니다. 물어보면 답합니다.
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
const GAP = 7 * 24 * 60 * 60 * 1000

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
  if (!kind) return null
  const [q, sub] = ASK[kind]
  return (
    <div className="askstrip">
      <div className="q">💬 {q}</div>
      <div className="s">{sub}</div>
      <div className="b">
        <Link className="btn primary" to={`/qna?ask=${encodeURIComponent(q)}`}>한 줄 남기기</Link>
        <button className="btn ghost" onClick={() => setKind('')}>나중에</button>
      </div>
    </div>
  )
}
