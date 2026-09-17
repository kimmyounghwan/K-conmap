/* 💬 «한 줄 남겨 주세요» 창 — 받거나 쓴 **직후에** (2026-09-15, 2026-09-17 규칙 확정)
 *
 * 소장님: 「다운 받거나, 바로입찰 사용시 마다. 사용후에 댓글을 달도록 해줘. 창을 띄워줘」
 *         「바로입찰은 5번 정도 클릭하면 하루에 한번… 동일한 기기 일때,
 *          서식은 하나 다운 받을 때마다. 각종 도구나…이런 것은 하나 다운 받을때」
 *         「**모든걸 무료로 제공하는데, 감사표시 한 번 안하는 사람은 필요없다**」
 *         「어차피 떠날 사람은 떠난다. 필요로 하는 사람은 다시온다」
 *
 * ■ 규칙 (표로 적어 둡니다 — 나중에 숫자만 고치면 됩니다)
 *   ┌──────────────────────────┬───────────────────────────────┐
 *   │ 바로투찰(bid)            │ **5번 쓰면** → 그 날 한 번만   │
 *   │ 그 밖(서식·도구·캐드…)   │ **하나 받을 때마다**           │
 *   │ 「나중에」 3번 연달아     │ 그 갈래는 **3일에 한 번**만    │
 *   │ 글을 한 번 쓰면          │ 위 «3번» 셈이 **0 으로**       │
 *   └──────────────────────────┴───────────────────────────────┘
 *
 * ■ 왜 이렇게
 *   · 바로투찰은 공고를 여러 개 돌려 보는 화면입니다. 매번 띄우면 도구를 못 씁니다
 *   · 서식은 한 번 받고 나갑니다. 그때 안 물으면 물을 자리가 없습니다
 *   · 3일 규칙은 «봐 주는 것» 이 아니라 «덜 자주 묻는 것» 입니다. 계속 묻습니다
 *   · **막지 않습니다.** 받은 뒤에 뜹니다. 받기 전에 막으면 그냥 나갑니다
 *   · 닫는 길은 셋 — ✕ · 바깥 누르기 · Esc
 *
 * ■ 어디에 쓰나
 *     import AskStrip, { askAfter, askWrote } from '../AskComment'
 *     <a ... onClick={() => askAfter('forms')}>⬇ 내려받기</a>
 *     <AskStrip />        (화면 아무 데나 한 번)
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const FLAG = 'kcm_ask_now'       // 방금 무엇을 받았나
const SEEN = 'kcm_ask_seen'      // 갈래마다 마지막으로 띄운 때  { forms: 172…, bid: … }
const HITS = 'kcm_ask_hits'      // 바로투찰을 몇 번 썼나 (그 날 셈)
const NOPE = 'kcm_ask_nope'      // 「나중에」를 연달아 몇 번 눌렀나 { forms: 2, … }

const 하루 = 24 * 60 * 60 * 1000
const 사흘 = 3 * 하루
const 묶음 = 2 * 60 * 1000       /* 한 자리에서 연달아 받을 때 — 그 묶음엔 한 번만 */
const 투찰몇번 = 5               /* 바로투찰은 이만큼 쓰면 한 번 묻습니다 */
const 거절몇번 = 3               /* 이만큼 연달아 「나중에」면 3일에 한 번으로 */

const 읽기 = (k) => { try { return JSON.parse(localStorage.getItem(k) || '{}') } catch { return {} } }
const 쓰기 = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* 사생활 모드 */ } }
const 오늘 = () => new Date().toISOString().slice(0, 10)

/** 글을 쓰면 「나중에」 셈을 0 으로 — 글 쓰는 분은 창을 싫어하는 게 아닙니다 */
export function askWrote(kind) {
  const n = 읽기(NOPE)
  if (kind) delete n[kind]; else Object.keys(n).forEach((k) => delete n[k])
  쓰기(NOPE, n)
}

/** 지금 이 갈래를 띄워도 되나 */
function 띄울까(kind) {
  const now = Date.now()
  const seen = 읽기(SEEN)
  const last = Number(seen[kind] || 0)

  /* 한 자리에서 연달아 받는 것은 «한 번» 으로 봅니다 */
  if (now - last < 묶음) return false

  /* 「나중에」를 연달아 3번 → 그 갈래는 3일에 한 번 */
  if (Number(읽기(NOPE)[kind] || 0) >= 거절몇번 && now - last < 사흘) return false

  /* 바로투찰: 5번 쓰면 그 날 한 번 */
  if (kind === 'bid') {
    const h = 읽기(HITS)
    if (h.day !== 오늘()) { h.day = 오늘(); h.n = 0; h.asked = 0 }
    h.n = Number(h.n || 0) + 1
    쓰기(HITS, h)
    if (h.asked) return false            // 오늘 이미 물었습니다
    if (h.n < 투찰몇번) return false      // 아직 5번이 안 됐습니다
    h.asked = 1; 쓰기(HITS, h)
  }
  /* ⚠️ «띄운 때» 를 여기서 적습니다.
     예전에는 화면 쪽에서 적었는데, 그러면 «띄울까 → 적기» 순서에 기대는 구조가 됩니다.
     한 자리에서 두 번 연달아 받으면 적히기 전에 또 물어 두 번 뜰 수 있었습니다. */
  const x = 읽기(SEEN); x[kind] = now; 쓰기(SEEN, x)
  return true
}

/** 「나중에」를 눌렀습니다 — 연달아 3번이면 그 갈래는 3일에 한 번으로 */
function 나중에(kind, setKind) {
  if (kind) {
    const n = 읽기(NOPE)
    n[kind] = Number(n[kind] || 0) + 1
    쓰기(NOPE, n)
    try { if (window.gtag) window.gtag('event', 'ask_later', { kind, n: n[kind] }) } catch { /* 광고차단기 */ }
  }
  setKind('')
}

/* 갈래마다 «답할 수 있는 질문». 막연한 부탁은 넣지 않습니다.
 *
 * ⚠️ 2026-09-17 — 소장님: 「적산이나 안전관리계획서 등 이건 유료니까...
 *    뭐 안띄워도 돼. **유료는 띄우지 말자**」
 *    → 값을 받는 것에는 안 묻습니다. 값을 치른 분께 다시 «부탁» 하는 꼴이 됩니다.
 *    여기 없는 갈래(jeoksan 등)는 askAfter 를 불러도 조용히 지나갑니다.
 *    유료: 적산(/jeoksan) · 안전관리계획서(/safety) · 내역서 작성 대행(/naeyeok)
 */
const ASK = {
  forms: ['받으신 서식, 현장에서 쓰시는 것과 다른 데가 있습니까?',
    '어디가 다른지 한 줄만 적어 주시면 그대로 고칩니다.'],
  change: ['설계변경 엑셀, 빠진 시트나 칸이 있습니까?',
    '현장에서 내시는 서류와 다른 데를 알려 주시면 맞추겠습니다.'],
  cad: ['캐드 유틸, 어떤 명령이 하나 더 있으면 좋겠습니까?',
    '자주 쓰시는 계산을 알려 주시면 만들어 붙이겠습니다.'],
  bid: ['권장 투찰금액, 실제 개찰과 얼마나 맞던가요?',
    '맞았는지 빗나갔는지 알려 주시면 셈을 고쳐 나갑니다.'],
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
      try { sessionStorage.removeItem(FLAG) } catch { /* 무시 */ }
      if (!띄울까(k)) return
      setKind(k)
      try {
        if (window.gtag) window.gtag('event', 'ask_open', { kind: k })
      } catch { /* 무시 */ }
    }, 800)
    return () => clearInterval(t)
  }, [])
  /* Esc 로 닫기 — 닫는 길을 좁히지 않습니다 */
  useEffect(() => {
    if (!kind) return undefined
    const esc = (e) => { if (e.key === 'Escape') 나중에(kind, setKind) }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [kind])

  if (!kind) return null
  const [q, sub] = ASK[kind]
  return (
    <div className="askwrap" onClick={() => 나중에(kind, setKind)}>
      <div className="askbox" onClick={(e) => e.stopPropagation()}
        role="dialog" aria-modal="true" aria-label="한 줄 남기기">
        <button className="askx" onClick={() => 나중에(kind, setKind)} aria-label="닫기">✕</button>
        <div className="q">💬 {q}</div>
        <div className="s">{sub}</div>
        <div className="b">
          <Link className="btn primary" to={`/qna?ask=${encodeURIComponent(q)}`}
            onClick={() => {
              askWrote(kind)
              try { if (window.gtag) window.gtag('event', 'ask_go', { kind }) } catch { /* 광고차단기 */ }
              setKind('')
            }}>✏️ 한 줄 남기기</Link>
          <button className="btn ghost" onClick={() => 나중에(kind, setKind)}>나중에</button>
        </div>
        <div className="askft">가입도 이름도 없습니다 · 한 줄이면 됩니다</div>
      </div>
    </div>
  )
}
