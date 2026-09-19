/* 💬 «한 줄 남겨 주세요» 창 — 받거나 쓴 **직후에** (2026-09-15, 2026-09-17 규칙 확정)
 *
 * 소장님: 「다운 받거나, 바로입찰 사용시 마다. 사용후에 댓글을 달도록 해줘. 창을 띄워줘」
 *         「**방문자 모두에게 하루에 한번 창이 뜬다...이게 좋은 듯, 한 번이니까**」
 *         「**모든걸 무료로 제공하는데, 감사표시 한 번 안하는 사람은 필요없다**」
 *         「어차피 떠날 사람은 떠난다. 필요로 하는 사람은 다시온다」
 *
 * ■ 규칙 (표로 적어 둡니다 — 나중에 숫자만 고치면 됩니다)
 *   ┌──────────────────────────┬───────────────────────────────────┐
 *   │ 갈래를 가리지 않고       │ **하루에 «딱 한 번»**             │
 *   │ 바로투찰(bid) 만         │ 공고 **5번** 골라야 그 한 번에 낌 │
 *   │ 「나중에」 3번 연달아     │ **3일** 쉼 (하루 한 번이니 사흘)  │
 *   │ 글을 한 번 쓰면          │ 위 «3번» 셈이 **0 으로**          │
 *   └──────────────────────────┴───────────────────────────────────┘
 *
 * ■ 왜 이렇게
 *   · 하루 한 번이면 «오늘 또 뜨나» 걱정이 없습니다. 외울 것도 하나입니다
 *   · 서식을 잇달아 받아도 두 번째부터는 안 뜹니다 — 짜증낼 일이 없습니다
 *   · 바로투찰은 공고를 여러 개 돌려 보는 화면입니다. 받은 것이 있어야 묻습니다
 *   · 3일 규칙은 «봐 주는 것» 이 아니라 «덜 자주 묻는 것» 입니다. 계속 묻습니다
 *   · **막지 않습니다.** 받은 뒤에 뜹니다. 받기 전에 막으면 그냥 나갑니다
 *   · 닫는 길은 셋 — ✕ · 바깥 누르기 · Esc
 *
 * ■ 2026-09-17 — **창 안에서 바로 씁니다**
 *   소장님: 「글쓰기 띄울때, 이용자가 글을 쓰면 사랑방으로 그 글이 가게 하면 안돼?」
 *   전에는 「쓰러 가기」가 사랑방으로 «보내기만» 했습니다. 화면이 바뀌고,
 *   빈 칸이 다시 나오고, 4자리 숫자를 정하라고 하고 — 그 사이에 대부분 나갑니다.
 *   → 이제 이 창이 곧 글칸입니다. 여기서 적고 올리면 **그대로 사랑방에 올라갑니다.**
 *   · 제목칸이 없습니다 — 첫 줄이 제목이 됩니다(사랑방 규칙이 제목을 요구합니다).
 *   · 4자리 숫자는 **안 적어도 됩니다.** 적으면 나중에 내 글을 지울 수 있습니다.
 *   · 별명은 저절로 붙습니다(같은 기기면 늘 같은 별명 — 사랑방과 같은 얼개).
 *
 * ■ 어디에 쓰나
 *     import AskStrip, { askAfter, askWrote } from '../AskComment'
 *     <a ... onClick={() => askAfter('forms')}>⬇ 내려받기</a>
 *     <AskStrip />        (화면 아무 데나 한 번)
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { pinHash } from './lib/pin.js'
import { nickOf } from './lib/nickname.js'
/* 🏷️ 이 창에서 온 글은 사랑방 말머리 「후기·건의」로 갑니다 (2026-09-19, CLAUDE.md 8절 69).
   소장님: 「이용자에게 띄우는 창은 그대로 유지하고, 어디로 올릴건지만」 — 창은 안 바뀝니다. */
import { 갈래붙이기 } from './lib/말머리.js'

/* ⚠️ firebase 는 «정적으로» 끌어오지 않습니다 — 이 창을 실제로 올릴 때만 받습니다.
   (사랑방·구인구직과 같은 방식. 안 그러면 모든 화면이 firebase 를 지고 다닙니다) */
let _fb = null
const loadFb = async () => {
  if (!_fb) {
    const [d, f] = await Promise.all([import('firebase/database'), import('./firebase.js')])
    _fb = { ...d, db: f.db, ensureAnon: f.ensureAnon }
  }
  return _fb
}

const FLAG = 'kcm_ask_now'       // 방금 무엇을 받았나
const HITS = 'kcm_ask_hits'      // 오늘 — { day, n(바로투찰 공고 센 것), asked(오늘 물었나) }
const NOPE = 'kcm_ask_nope'      // 「나중에」를 연달아 몇 번 · 마지막이 언제 — { n, at }

/* ══════════════════════════════════════════════════════════════
   ⭐ 규칙 — **하루에 «딱 한 번»** (2026-09-17 확정)

   소장님: 「**방문자 모두에게 하루에 한번 창이 뜬다...이게 좋은 듯, 한 번이니까**」

   ■ 여기까지 온 길 (같은 잘못을 되풀이하지 않으려고 적습니다)
     처음  「서식은 받을 때마다 · 바로투찰은 5번에 하루 한 번」 ← 소장님이 정하심
     그런데 제가 «묶음 2분» 을 **말씀도 안 드리고** 끼워 넣었습니다.
     2분이면 서식 두세 장 받는 시간이라, 사실상 「2분에 한 번」 이 돼 있었습니다.
     소장님: 「딱 한 번만 뜨는데, 다른거 다운 받아도 더 이상 안떠」 — 그게 그 2분이었습니다.
     그래서 「받을 때마다(15초)」 로 고쳐 놓고 보니, 이번엔 이런 그림이 됐습니다:
       착공계·대리인계·공정표를 잇달아 받으면 **3분에 창이 세 번** 뜨고,
       그 세 번을 다 닫으면 「나중에 3번」 이 차서 **그 뒤 3일은 아예 안 뜹니다.**
       사람은 짜증나고, 우리는 한 줄도 못 받고, 물어볼 기회까지 잃습니다.
     → 소장님이 고르신 답: **하루에 한 번.**

   ■ 지금 규칙 — 외울 것이 하나입니다
     · **하루에 한 번.** 갈래를 가리지 않습니다. 서식에서 떴으면 그 날 캐드에서는 안 뜹니다
     · **바로투찰만 «자격»이 따로**: 공고를 5번 골라 계산해야 그 하루 한 번에 낍니다
       (첫 화면이라 그냥 들른 사람에게 묻지 않으려고 — 받은 것이 있어야 묻습니다)
     · **「나중에」 연달아 3번 → 3일 쉼.** 하루 한 번이니 3번 쌓이는 데 «사흘» 걸립니다.
       그건 진짜로 사흘을 권했는데 안 쓰신 것입니다
     · **한 줄 쓰면 그 셈은 0.** 쓰는 분은 창을 싫어하는 게 아닙니다

   ⚠️ 「묶음」 같은 완충을 **다시 넣지 마십시오.** 하루 한 번이면 이미 «한 번» 이라
      덧댈 것이 없습니다. 좋아 보여도 넣기 전에 **먼저 말씀드립니다** (8절 45).
   ══════════════════════════════════════════════════════════════ */
const 하루 = 24 * 60 * 60 * 1000
const 사흘 = 3 * 하루
const 투찰몇번 = 5               /* 바로투찰은 공고를 이만큼 골라야 «자격» 이 생깁니다 */
const 거절몇번 = 3               /* 이만큼 연달아 「나중에」면 3일 쉽니다 */

const 읽기 = (k) => { try { return JSON.parse(localStorage.getItem(k) || '{}') } catch { return {} } }
const 쓰기 = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* 사생활 모드 */ } }
const 오늘 = () => new Date().toISOString().slice(0, 10)

/* 오늘 칸을 꺼냅니다 — 날짜가 바뀌었으면 새로 시작합니다 */
function 오늘칸() {
  const h = 읽기(HITS)
  if (h.day !== 오늘()) return { day: 오늘(), n: 0, asked: 0 }
  return { day: h.day, n: Number(h.n || 0), asked: Number(h.asked || 0) }
}

/** 글을 쓰면 「나중에」 셈을 0 으로 — 글 쓰는 분은 창을 싫어하는 게 아닙니다 */
export function askWrote() {
  쓰기(NOPE, { n: 0, at: 0 })
}

/** 지금 띄워도 되나 — 하루에 «딱 한 번» */
function 띄울까(kind) {
  const now = Date.now()
  const h = 오늘칸()

  /* 바로투찰은 «자격» 부터 — 공고를 5번 골라 계산해야 낍니다.
     ⚠️ 셈은 물었든 안 물었든 올립니다(오늘 몇 번 썼나를 아는 값입니다). */
  if (kind === 'bid') {
    h.n += 1
    쓰기(HITS, h)
    if (h.n < 투찰몇번) return false
  }

  /* 🔑 오늘 이미 물었으면 끝. 갈래를 가리지 않습니다 */
  if (h.asked) return false

  /* 「나중에」 연달아 3번 → 마지막 거절로부터 3일은 쉽니다 */
  const n = 읽기(NOPE)
  if (Number(n.n || 0) >= 거절몇번 && now - Number(n.at || 0) < 사흘) return false

  /* ⚠️ «물었다» 를 여기서 적습니다. 화면 쪽에서 적으면 두 번 뜰 틈이 생깁니다. */
  h.asked = 1
  쓰기(HITS, h)
  return true
}

/** 「나중에」를 눌렀습니다 — 연달아 3번이면 3일 쉽니다
 *  ⚠️ 갈래별로 세지 «않습니다». 하루에 한 번뿐이라 갈래를 나누면 영영 안 찹니다. */
function 나중에(kind, setKind) {
  if (kind) {
    const 몇 = Number(읽기(NOPE).n || 0) + 1
    쓰기(NOPE, { n: 몇, at: Date.now() })
    try { if (window.gtag) window.gtag('event', 'ask_later', { kind, n: 몇 }) } catch { /* 광고차단기 */ }
  }
  setKind('')
}

/* 어디서 눌렀나 — 세는 데만 씁니다.
 *
 * ⚠️ 2026-09-17 — 소장님: 「**말은 클로드가 정해 주지 말자. 괜히 부담일 수 있거든...
 *    그냥 아무말이나 자유롭게 적게 해**」
 *    예전에는 갈래마다 «답할 수 있는 질문» 을 정해 두고 그걸 물었습니다
 *    (「받으신 서식, 현장에서 쓰시는 것과 다른 데가 있습니까?」 같은).
 *    그러면 «그 물음에 답해야 하는 숙제» 가 됩니다.
 *    사랑방을 「아무 말이나」로 만들어 놓고 창에서 문제를 내던 꼴이라 뺐습니다.
 *    → 물음은 없습니다. 자리만 열어 둡니다. 쓸 말은 쓰는 분이 정합니다.
 *
 * ⚠️ 유료는 여기 넣지 않습니다 (소장님: 「유료는 띄우지 말자」).
 *    적산(/jeoksan) · 안전관리계획서(/safety) · 내역서 작성 대행(/naeyeok)
 */
const 무료 = ['forms', 'change', 'cad', 'bid', 'shareone', 'pdf', 'biyul']

/* 첫 줄을 제목으로 삼습니다.
   사랑방(qna)은 제목 t 를 «2~80자» 로 요구합니다(database.rules.json).
   그런데 이 창에서 제목칸을 따로 내밀면 칸이 둘이 되어 다시 «숙제» 가 됩니다.
   → 칸은 하나로 두고, 쓰신 글을 여기서 나눕니다.
     · 줄을 바꿔 쓰셨으면 → 첫 줄이 제목, 나머지가 본문
     · 한 줄인데 짧으면   → 그게 통째로 제목 (본문 없음)
     · 한 줄인데 길면     → 앞 토막을 제목으로, 본문에는 통째로 (잘려 보이지 않게) */
export function 글나누기(v) {
  const t0 = String(v || '').trim().replace(/\r/g, '')
  const nl = t0.indexOf('\n')
  if (nl > 1 && nl <= 80) return { t: t0.slice(0, nl).trim(), b: t0.slice(nl + 1).trim() }
  if (t0.length <= 80) return { t: t0, b: '' }
  let cut = t0.lastIndexOf(' ', 60)
  if (cut < 20) cut = 60
  return { t: t0.slice(0, cut).trim() + '…', b: t0 }
}

export function askAfter(kind) {
  try { sessionStorage.setItem(FLAG, kind) } catch { /* 사생활 모드 */ }
}

export default function AskStrip() {
  const [kind, setKind] = useState('')
  const [글, set글] = useState('')
  const [숫자, set숫자] = useState('')
  const [보냄, set보냄] = useState(false)     /* 올리는 중 */
  const [끝, set끝] = useState('')            /* 올라간 글의 id — 고맙다는 말로 바뀝니다 */
  const [탈, set탈] = useState('')            /* 잘못됐을 때 한 줄 */

  useEffect(() => {
    const t = setInterval(() => {
      let k = ''
      try { k = sessionStorage.getItem(FLAG) || '' } catch { return }
      if (!k || !무료.includes(k)) return
      try { sessionStorage.removeItem(FLAG) } catch { /* 무시 */ }
      if (!띄울까(k)) return
      set글(''); set숫자(''); set끝(''); set탈('')
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
    const esc = (e) => { if (e.key === 'Escape') 닫기() }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  })

  /* 다 쓰고 올린 뒤에 닫는 것은 «나중에» 가 아닙니다 — 셈을 올리지 않습니다 */
  const 닫기 = () => { if (끝) { setKind(''); return } 나중에(kind, setKind) }

  /* ── 올리기 — 이 창에서 곧장 사랑방(qna)으로 갑니다 ──────────── */
  const 올리기 = async () => {
    const { t, b } = 글나누기(글)
    if (t.length < 2) { set탈('두 글자만이라도 적어 주십시오.'); return }
    set보냄(true); set탈('')
    try {
      const { ref, set, push, db, ensureAnon } = await loadFb()
      const user = await ensureAnon()
      const slot = push(ref(db, 'qna'))
      const id = slot.key
      /* 4자리는 «선택» 입니다. 적으신 분만 나중에 본인 글을 지울 수 있습니다. */
      if (숫자.length === 4) {
        try { await set(ref(db, `qna_pins/${id}`), await pinHash(id, 숫자)) } catch { /* 없어도 글은 올립니다 */ }
      }
      await set(slot, {
        t: 갈래붙이기('후기·건의', t),
        b: b.slice(0, 2000),
        nick: nickOf(user.uid).slice(0, 20),
        uid: user.uid,
        at: Date.now(),
      })
      /* 사랑방 화면이 «내가 쓴 글» 로 알아보게 — 같은 열쇠를 씁니다 (Qna.jsx) */
      try {
        const k = 'kcm_qna_mine'
        const v = JSON.parse(localStorage.getItem(k) || '[]')
        localStorage.setItem(k, JSON.stringify([...v, id].slice(-100)))
      } catch { /* 사생활 모드 */ }
      askWrote()
      try { if (window.gtag) window.gtag('event', 'ask_sent', { kind }) } catch { /* 광고차단기 */ }
      set끝(id)
    } catch (e) {
      set탈('올리지 못했습니다. 잠시 뒤 다시 해 주십시오.')
    } finally { set보냄(false) }
  }

  if (!kind) return null
  return (
    <div className="askwrap" onClick={닫기}>
      <div className="askbox" onClick={(e) => e.stopPropagation()}
        role="dialog" aria-modal="true" aria-label="한 줄 남기기">
        <button className="askx" onClick={닫기} aria-label="닫기">✕</button>

        {끝 ? (
          /* ── 올라갔습니다 ───────────────────────────────────── */
          <>
            <div className="q">고맙습니다 🙏</div>
            <div className="s">사랑방에 올라갔습니다. 답이 달리면 거기에 붙습니다.</div>
            <div className="b">
              <Link className="btn primary" to="/qna" onClick={() => setKind('')}>사랑방에서 보기 →</Link>
              <button className="btn ghost" onClick={() => setKind('')}>닫기</button>
            </div>
          </>
        ) : (
          /* ── 여기가 곧 글칸입니다 ───────────────────────────── */
          <>
            <div className="q">💬 한 줄 남겨 주시겠습니까?</div>
            <div className="s">
              아무 말이나 좋습니다 — 쓰시면서 느낀 것, 고쳤으면 하는 것, 그냥 한마디도.
            </div>
            <textarea className="inp askta" value={글} autoFocus
              onChange={(e) => set글(e.target.value)} maxLength={2000}
              onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) 올리기() }} />
            <div className="askrow">
              <input className="inp" inputMode="numeric" maxLength={4} value={숫자}
                onChange={(e) => set숫자(e.target.value.replace(/\D/g, ''))}
                placeholder="지울 4자리(선택)" aria-label="지울 때 쓸 네 자리 숫자 (안 적으셔도 됩니다)" />
              <button className="btn primary" onClick={올리기} disabled={보냄 || !글.trim()}>
                {보냄 ? '올리는 중…' : '올리기'}
              </button>
              <button className="btn ghost" onClick={닫기}>나중에</button>
            </div>
            {탈 && <div className="askerr">{탈}</div>}
            {/* ⚠️ 2026-09-17 — 여기에 「전화번호·이메일은 적지 마세요」 가 있었습니다.
                소장님: 「이것도 빼」. 한 줄 적어 달라고 열어 놓은 창에 금지어를 붙이면
                그 한 줄이 «규칙을 지켜야 하는 일» 이 됩니다. 남길 말만 남깁니다. */}
            <div className="askft">가입도 이름도 없습니다 · 별명은 저절로 붙습니다</div>
          </>
        )}
      </div>
    </div>
  )
}
