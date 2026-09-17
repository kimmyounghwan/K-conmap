import { useEffect, useMemo, useState } from 'react'
/* ⚠️ firebase 는 «정적으로» 끌어오지 않습니다. 이 화면을 열 때만 받습니다. (Jobs.jsx 와 같은 방식) */
let _fb = null
const loadFb = async () => {
  if (!_fb) {
    const [d, f] = await Promise.all([import('firebase/database'), import('../firebase.js')])
    _fb = { ...d, db: f.db, ensureAnon: f.ensureAnon }
  }
  return _fb
}
import { Empty, Skeleton } from '../components.jsx'
import { pinHash } from '../lib/pin.js'
/* 🏷️ 별명은 **자동** 입니다 — 댓글과 같은 얼개(lib/nickname.js).
   소장님: 「글을 쓰면 별명이 붙게 해줘. 이름 별명을 쓰게 하지 말고.」
   댓글은 이미 그렇게 돌고 있었는데 묻고답하기만 손으로 적게 돼 있었습니다.
   ■ 왜 자동이 나은가
     · 이름칸을 비우면 «익명» 이 줄줄이 쌓여 누가 누구인지 안 보입니다.
     · 적으라고 하면 귀찮아서 안 씁니다.
     · uid 로 만드니 **같은 브라우저면 늘 같은 별명** 이고, 남이 흉내 낼 수 없습니다.
     · 그래서 **누가 자주 답해 주는지** 가 게시판에 그냥 보입니다 (기여도). */
import { nickOf } from '../lib/nickname.js'

/**
 * /qna — 「사랑방」 (2026-09-15, 2026-09-17 게시판 말투 + 이름)
 *
 * 소장님: 「건설맵 이용자가 이용할 수 있는 게시판도 있어야 하지 않아」 · 「묻고 답하기 형식으로」
 *         「답변은 누구나」 · 「이 주소를 저장해 두세요」 는 번거롭다 → 뺐습니다.
 *         「이미 하루 안에 답변을 단다고 했으니」 — 그 약속이 다시 오게 만듭니다.
 *
 * 왜 이 게시판이 필요한가
 *   답변이 곧 실력 증명입니다. 「낙찰하한율이 뭔가요」로 들어온 사람이 답을 읽고,
 *   옆에 있는 「내역서 작성해 드립니다」를 봅니다. 그게 이 화면의 일입니다.
 *
 * ⚠️ 연락처 «칸» 은 여전히 없습니다 — 칸이 있으면 다들 적고, 그 번호로 전화가 갑니다.
 *    다만 2026-09-17 부터 «적지 마세요» 라고 **말하지는 않습니다** (소장님: 「이것도 빼」).
 *    쓰는 자리에 금지어를 붙여 두면, 규칙을 읽히려고 글쓰기를 막는 꼴이 됩니다.
 *    연락처가 필요한 이야기는 /naeyeok 의 문의함(아무도 못 읽는 곳)으로 갑니다.
 * ⚠️ 「내가 쓴 글」은 브라우저가 알아서 기억합니다(구인구직과 같은 방식). 적을 것이 없습니다.
 */
const LIMIT = 300

/* ⚠️ 2026-09-17 — 여기에 «이런 글이 올라옵니다» 보기 일곱 줄이 있었습니다.
 *   (「낙찰됐는데 산출내역서를 언제까지…」 「오늘 개찰 들어갔다가 느낀 것」 …)
 *   소장님: 「**사랑방에도 문장들이 잇는데, 다 제거 해. 그냥 자유롭게 적도록...해줘**」
 *   빈 칸이 무서울까 봐 예시를 깔아 두었는데, 예시를 깔면 «저 중에 골라야 하나» 가 됩니다.
 *   골라 주는 것과 열어 두는 것은 다릅니다 — 열어 둡니다. */
const MINE_KEY = 'kcm_qna_mine'
const loadMine = () => { try { return JSON.parse(localStorage.getItem(MINE_KEY) || '[]') } catch { return [] } }
const addMine = (id) => { try { localStorage.setItem(MINE_KEY, JSON.stringify([...loadMine(), id].slice(-100))) } catch { /* noop */ } }

/* 🔑 운영자 브라우저 — 답글에 「K-건설맵 답변」 표가 붙는 곳. (2026-09-17)
 *
 * 소장님: 「**답글에 비번이 왜 필요해.. 유료만 필요하지**」 — 맞는 말씀이었습니다.
 *         「**내가 다는 답변도 클로드가 다는 답변도 모두 K-건설맵 으로 하자**」
 *
 * ■ 전에는 어땠나 — 열쇠말을 «화면 안에서» 해시와 맞춰 봤습니다.
 *   그런데 DB 규칙은 op 가 «참/거짓이기만 하면» 통과였습니다.
 *   **개발자도구를 아는 사람은 열쇠말 없이 그냥 표를 달 수 있었습니다.**
 *   즉 그 비번은 소장님만 불편하게 했지, 실제로 막은 것이 없었습니다.
 *
 * ■ 이제 — 비번이 없습니다. **서버(database.rules.json)가 uid 를 봅니다.**
 *   여기 목록에 있는 브라우저면 답글에 표가 저절로 붙습니다. 칠 것이 없습니다.
 *   ⚠️ **database.rules.json 의 op 규칙과 반드시 같아야 합니다.** 한쪽만 고치면
 *      화면은 표를 붙이려 하는데 서버가 막아 「올리지 못했습니다」 가 납니다.
 *   ⚠️ uid 를 여기 적어도 안전합니다 — 익명 로그인은 «원하는 uid 로» 로그인할 수 없습니다.
 *   ⚠️ 브라우저 기록을 지우면 번호가 바뀝니다. 기기를 더하실 땐 아래 목록과 규칙 둘 다에
 *      번호를 넣고 `3_규칙올리기.bat` 을 한 번 돌리면 됩니다.
 *      그 브라우저의 번호는 「이 사랑방 쓰는 법」 맨 아래에 적혀 있습니다.
 *
 * ⚠️ **다른 분들이 글·답글 쓰는 것은 그대로입니다.** 가입도 로그인도 없습니다.
 *    바뀐 것은 «표가 붙느냐» 하나뿐입니다. */
const OPS = [
  'ZglL1g3X5UZFBA2590LirDnEnil1',      // 소장님 (사무실 크롬, 2026-09-17 등록)
]
const isOp = (uid) => !!uid && OPS.includes(uid)

const when = (ms) => {
  if (!ms) return ''
  const d = new Date(ms)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getMonth() + 1}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

export default function Qna() {
  const [rows, setRows] = useState(null)
  const [ans, setAns] = useState({})        // { 질문id: [답변…] }
  const [del, setDel] = useState({})
  const [open, setOpen] = useState(null)    // 펼친 질문 id
  const [write, setWrite] = useState(false)
  const [mine, setMine] = useState(loadMine)
  const [onlyMine, setOnlyMine] = useState(false)
  const [q, setQ] = useState('')

  const load = async () => {
    try {
      const { ref, get, query, orderByKey, limitToLast, db, ensureAnon } = await loadFb()
      await ensureAnon()
      const [a, b, c] = await Promise.all([
        get(query(ref(db, 'qna'), orderByKey(), limitToLast(LIMIT))),
        get(ref(db, 'qna_del')),
        get(ref(db, 'qna_a')),
      ])
      setDel(b.val() || {})
      setAns(c.val() || {})
      const v = a.val() || {}
      setRows(Object.entries(v).map(([id, x]) => ({ id, ...x })).reverse())
    } catch (e) {
      setRows([])
    }
  }
  useEffect(() => { load() }, [])

  const list = useMemo(() => {
    if (!rows) return null
    const s = q.trim()
    return rows.filter((r) => {
      if (r.deleted || del[r.id]) return false
      if (onlyMine && !mine.includes(r.id)) return false
      if (s && !((r.t || '') + (r.b || '')).includes(s)) return false
      return true
    })
  }, [rows, del, q, onlyMine, mine])

  const nAns = (id) => Object.values(ans[id] || {}).filter((x) => x && !x.deleted).length

  return (
    <div className="wrap">
      {/* 2026-09-17 — 꽉 찬 파랑(.hero) 을 테두리만 있는 칸(.card.outline)으로 바꿉니다.
          게시판은 «어서 눌러라» 가 아니라 «편히 들어오시라» 여야 합니다. */}
      <div className="card outline">
        <h1 style={{ margin: 0, fontSize: 20 }}>💬 사랑방</h1>
        <div className="muted" style={{ marginTop: 6, lineHeight: 1.75, fontSize: 13.5 }}>
          들러 오셔서 아무 말이나 하고 가세요 — 현장 일도, 건설맵에 하고 싶은 말도, 그냥 하소연도.
          <b style={{ color: 'var(--text)' }}> 가입도 이름도 없습니다.</b>
        </div>
      </div>

      {/* ── 단추부터. 규칙은 뒤로 ──────────────────────────────────
          2026-09-17 — 예전에는 여기에 «하세요·하지 마세요» 가 다섯 문단 있었습니다.
          글 한 줄 쓰기 전에 규칙부터 읽히면 대부분 그냥 나갑니다.
          규칙은 아래 «이 게시판 쓰는 법» 으로 접고, 정말 필요한 한 줄
          (전화번호 적지 마세요)만 글 쓰는 칸 옆에 둡니다. */}
      <div className="btn-row" style={{ justifyContent: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        <button className="btn line" onClick={() => setWrite((v) => !v)}>
          {write ? '닫기' : '✏️ 글쓰기'}
        </button>
        <input className="inp" placeholder="찾기 — 낱말" value={q} onChange={(e) => setQ(e.target.value)}
          style={{ flex: '1 1 160px', minWidth: 120 }} />
        {mine.length > 0 && (
          <button className={'btn' + (onlyMine ? ' primary' : '')} onClick={() => setOnlyMine((v) => !v)}>
            내가 쓴 글 {mine.length}
          </button>
        )}
      </div>

      {write && (
        <WriteForm onDone={() => { setWrite(false); load(); setMine(loadMine()) }} />
      )}

      <details className="note" style={{ marginBottom: 10, lineHeight: 1.85 }}>
        <summary style={{ cursor: 'pointer', fontWeight: 700 }}>이 사랑방 쓰는 법 (눌러서 보기)</summary>
        <div style={{ marginTop: 8 }}>
          <b>이름을 안 적으셔도 됩니다</b> — 별명이 저절로 붙습니다.
          같은 기기에서 쓰시면 늘 같은 별명이라 «누가 자주 답해 주는지»가 보입니다.
          글 쓸 때 정한 <b>4자리 숫자</b>로 내 글만 지울 수 있습니다.
          답은 <b>하루 안에</b> 달아 드리는 것을 목표로 합니다.<br />
          <b>물어보시는 글이라면</b> 공사 규모 · 발주처 · 지금 어디까지 —
          이 셋만 있으면 답이 훨씬 정확합니다. 모르면 모르는 대로 적으셔도 됩니다.<br />
          연락처가 오가야 하는 일은 <a href="/naeyeok">내역서 문의</a>로 보내 주세요 — 그건 아무에게도 안 보입니다.<br />
          <b>답글은 누구나 답니다</b> — 글 아래 <b>「💬 답글 쓰기」</b> 를 누르시면 칸이 열립니다.
          K-건설맵이 단 답에는 <b>「K-건설맵 답변」</b> 표가 붙습니다.
          표가 없는 답글은 이용자 의견이니 <b>중요한 건은 발주처에 확인하십시오.</b>{' '}
          광고·홍보 글은 예고 없이 지웁니다.
          {/* 🔑 2026-09-17 — 「이 브라우저 번호」. 소장님이 다른 기기에서도 「K-건설맵 답변」 으로
              답하시려면 그 기기의 번호가 필요합니다. 비번이 없으니 이 번호가 그 자리를 대신합니다.
              ⚠️ 비밀이 아닙니다 — 이 번호를 안다고 그 사람이 될 수 없습니다(익명 로그인은
                 «원하는 uid 로» 로그인할 수 없습니다). 그래서 그냥 보여 줘도 됩니다.
              ⚠️ 이용자에게도 보입니다. 별명이 왜 늘 같은지 설명해 주는 구실도 합니다. */}
          <BrowserId />
        </div>
      </details>

      {list === null && <Skeleton n={4} />}
      {list && list.length === 0 && (
        <Empty>아직 글이 없습니다. 아무 말이나 먼저 남겨 주세요 — 한 줄이어도 됩니다.</Empty>
      )}

      {list && list.map((r) => {
        const n = nAns(r.id)
        const isOpen = open === r.id
        return (
          <div className="card" key={r.id} style={{ marginBottom: 8 }}>
            <div onClick={() => setOpen(isOpen ? null : r.id)} style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {/* 2026-09-17 — 예전엔 답글이 없으면 「답변대기」 라고 붙었습니다.
                    물음이 아닌 글에도 붙어서 «아직 답을 못 받은 글» 처럼 보였습니다.
                    답글이 있을 때만 셈을 보입니다. 없으면 아무 말도 안 붙입니다. */}
                {n > 0 && (
                  <span className="chip ok" style={{
                    fontSize: 11.5, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                    background: 'var(--accent-soft, rgba(26,86,219,.12))',
                    color: 'var(--accent, #1a56db)',
                  }}>답글 {n}</span>
                )}
                <b style={{ flex: '1 1 200px', fontSize: 15 }}>{r.t}</b>
                <span className="muted" style={{ fontSize: 12 }}>
                  {r.nick || '익명'} · {when(r.at)}
                  {mine.includes(r.id) && <b style={{ color: 'var(--accent, #1a56db)' }}> · 내 글</b>}
                </span>
              </div>
              {!isOpen && r.b && (
                <div className="muted" style={{ fontSize: 13, marginTop: 6, lineHeight: 1.6 }}>
                  {String(r.b).slice(0, 90)}{String(r.b).length > 90 ? '…' : ''}
                </div>
              )}
            </div>
            {/* 🚨 2026-09-17 — 소장님: 「이용자가 의견을 적었는데, 답글을 클릭해서 쓸 버튼이 없어」
                맞는 말씀이었습니다. 카드를 «누르면» 답글칸이 나오게 해 두었는데,
                **누르라는 표시가 어디에도 없었습니다.** 글이 0개일 때는 아무도 몰랐고,
                첫 글이 올라오고 나서야 드러났습니다.
                ⚠️ 「누르면 열린다」 는 만든 사람 머릿속에만 있습니다. 눈에 보이는 단추를 답니다. */}
            <div className="btn-row" style={{ justifyContent: 'flex-start', gap: 8, marginTop: 8 }}>
              <button className="btn line sm" onClick={() => setOpen(isOpen ? null : r.id)}>
                {isOpen ? '접기 ▲' : (n > 0 ? `💬 답글 ${n}개 보기 ▼` : '💬 답글 쓰기 ▼')}
              </button>
            </div>
            {isOpen && (
              <Detail row={r} ans={ans[r.id] || {}} mine={mine.includes(r.id)}
                onChange={() => { load(); setMine(loadMine()) }} />
            )}
          </div>
        )
      })}

      {/* ── 내역서로 이어지는 한 줄 ─────────────────────────── */}
      <a href="/naeyeok" className="naeyeok-strip" style={{ marginTop: 14 }}>
        <span className="ns-ic">📋</span>
        <span className="ns-txt"><b>직접 맡기고 싶으시다면</b> — 산출내역서·설계변경 내역을 대신 만들어 드립니다.</span>
        <span className="ns-go">내역서 작성 →</span>
      </a>
    </div>
  )
}

/* ── 질문 펼침 — 본문 + 답변들 + 답변 쓰기 ──────────────────────── */
function Detail({ row, ans, mine, onChange }) {
  const [pin, setPin] = useState('')
  const [msg, setMsg] = useState('')
  const list = Object.entries(ans).map(([id, x]) => ({ id, ...x }))
    .filter((x) => !x.deleted).sort((a, b) => (a.at || 0) - (b.at || 0))

  const remove = async () => {
    if (pin.length !== 4) return setMsg('지울 때 쓰신 4자리를 넣어 주세요.')
    try {
      const { ref, set, db, ensureAnon } = await loadFb()
      await ensureAnon()
      await set(ref(db, `qna_del/${row.id}`), await pinHash(row.id, pin))
      onChange()
    } catch (e) { setMsg('숫자가 맞지 않습니다.') }
  }

  return (
    <div style={{ marginTop: 10, borderTop: '1px solid var(--line)', paddingTop: 10 }}>
      <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.85, fontSize: 14 }}>{row.b}</div>

      {list.map((a) => (
        <div key={a.id} style={{
          marginTop: 10, padding: '10px 12px', borderRadius: 9,
          background: a.op ? 'var(--accent-soft, rgba(26,86,219,.08))' : 'var(--bg-soft, rgba(0,0,0,.03))',
          border: '1px solid var(--line)',
        }}>
          <div style={{ fontSize: 12, marginBottom: 5 }}>
            {a.op
              ? <b style={{ color: 'var(--accent, #1a56db)' }}>K-건설맵 답변</b>
              : <b>{a.nick || '익명'}</b>}
            <span className="muted"> · {when(a.at)}</span>
          </div>
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.85, fontSize: 13.5 }}>{a.b}</div>
        </div>
      ))}

      <AnswerForm qid={row.id} onDone={onChange} />

      {mine && (
        <div className="btn-row" style={{ justifyContent: 'flex-start', gap: 8, marginTop: 10 }}>
          <input className="inp" inputMode="numeric" maxLength={4} placeholder="4자리"
            value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            style={{ width: 90 }} />
          <button className="btn" onClick={remove}>내 글 지우기</button>
          {msg && <span className="muted" style={{ fontSize: 12 }}>{msg}</span>}
        </div>
      )}
    </div>
  )
}

/* ── 답변 쓰기 — 누구나 ────────────────────────────────────────── */
function AnswerForm({ qid, onDone }) {
  const [b, setB] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [나운영자, set나운영자] = useState(false)

  /* 이 브라우저가 운영자인지 미리 알아 둡니다 — 올리기 «전에» 화면에 알려 주려고.
     쓰기 전에 「이 답에는 표가 붙습니다」 를 보여 줘야 무게를 알고 씁니다. */
  useEffect(() => {
    let 살아있음 = true
    ;(async () => {
      try {
        const { ensureAnon } = await loadFb()
        const u = await ensureAnon()
        if (살아있음) set나운영자(isOp(u && u.uid))
      } catch { /* 못 물어봐도 그냥 보통 답글입니다 */ }
    })()
    return () => { 살아있음 = false }
  }, [])

  const submit = async () => {
    if (b.trim().length < 2) return setMsg('답글을 적어 주세요.')
    setBusy(true); setMsg('')
    try {
      const { ref, set, push, db, ensureAnon } = await loadFb()
      const user = await ensureAnon()
      /* ⚠️ 여기서 다시 봅니다 — 위의 나운영자는 «보여 주기» 용입니다.
         실제로 올릴 때 쓰는 값은 그때 받은 uid 로 정합니다. */
      const op = isOp(user.uid)
      const slot = push(ref(db, `qna_a/${qid}`))
      await set(slot, {
        b: b.trim().slice(0, 2000),
        nick: (op ? 'K-건설맵' : nickOf(user.uid)).slice(0, 20),
        op,
        uid: user.uid,
        at: Date.now(),
      })
      setB('')
      onDone()
    } catch (e) {
      setMsg('올리지 못했습니다. 잠시 뒤 다시 해 주세요.')
    } finally { setBusy(false) }
  }

  return (
    <div style={{ marginTop: 12 }}>
      <textarea className="inp" value={b} onChange={(e) => setB(e.target.value)}
        placeholder="답글 — 아무 말이나"
        style={{ width: '100%', boxSizing: 'border-box', minHeight: 72 }} maxLength={2000} />
      <div className="btn-row" style={{ justifyContent: 'flex-start', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
        <button className="btn primary" onClick={submit} disabled={busy}>
          {busy ? '올리는 중…' : '답글 올리기'}
        </button>
        {/* 🔑 운영자 브라우저일 때만 — 「이 답에는 표가 붙습니다」 를 미리 알려 줍니다.
            ⚠️ 이용자에게는 아무것도 안 보입니다. 비번 칸이 있던 자리입니다. */}
        {나운영자 && (
          <span className="muted" style={{ fontSize: 12 }}>
            이 답글에는 <b style={{ color: 'var(--accent, #1a56db)' }}>「K-건설맵 답변」</b> 표가 붙습니다
          </span>
        )}
        {msg && <span className="muted" style={{ fontSize: 12 }}>{msg}</span>}
      </div>
    </div>
  )
}

/* ── 질문 쓰기 ─────────────────────────────────────────────────── */
function WriteForm({ onDone }) {
  const [f, setF] = useState({ t: '', b: '', pin: '' })
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const set_ = (k) => (e) => setF((v) => ({ ...v, [k]: e.target.value }))

  const submit = async () => {
    if (f.t.trim().length < 2) return setMsg('제목을 2자 이상 적어 주세요.')
    if (f.pin.length !== 4) return setMsg('지울 때 쓸 4자리 숫자를 정해 주세요.')
    setBusy(true); setMsg('')
    try {
      const { ref, set, push, db, ensureAnon } = await loadFb()
      const user = await ensureAnon()
      const slot = push(ref(db, 'qna'))
      const id = slot.key
      await set(ref(db, `qna_pins/${id}`), await pinHash(id, f.pin))
      await set(slot, {
        t: f.t.trim().slice(0, 80),
        b: f.b.trim().slice(0, 2000),
        nick: nickOf(user.uid).slice(0, 20),
        uid: user.uid,
        at: Date.now(),
      })
      addMine(id)
      onDone()
    } catch (e) {
      setMsg('올리지 못했습니다. 잠시 뒤 다시 해 주세요.')
    } finally { setBusy(false) }
  }

  return (
    <div className="card" style={{ marginBottom: 10 }}>
      <div className="sec-title" style={{ margin: '0 0 10px' }}>글쓰기</div>
      {/* ⚠️ 2026-09-17 — 두 칸 다 «예) …» 로 보기를 깔아 두었습니다. 뺐습니다.
          남은 한 줄(전화번호)은 취향이 아니라 안전입니다 — 그것만 둡니다. */}
      <input className="inp" value={f.t} onChange={set_('t')} maxLength={80}
        placeholder="한 줄로 — 무슨 이야기든"
        style={{ width: '100%', boxSizing: 'border-box', marginBottom: 8 }} />
      <textarea className="inp" value={f.b} onChange={set_('b')} maxLength={2000}
        placeholder="더 적고 싶으시면 여기에 (안 적으셔도 됩니다)"
        style={{ width: '100%', boxSizing: 'border-box', minHeight: 110, marginBottom: 8 }} />
      <div className="btn-row" style={{ justifyContent: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
        <input className="inp" inputMode="numeric" maxLength={4} value={f.pin}
          onChange={(e) => setF((v) => ({ ...v, pin: e.target.value.replace(/\D/g, '') }))}
          placeholder="지울 4자리" style={{ width: 118 }} />
        <button className="btn primary" onClick={submit} disabled={busy}>
          {busy ? '올리는 중…' : '올리기'}
        </button>
        {msg && <span className="muted" style={{ fontSize: 12 }}>{msg}</span>}
      </div>
    </div>
  )
}

/* 🔑 이 브라우저 번호 — 「이 사랑방 쓰는 법」 맨 아래 한 줄. (2026-09-17)
   별명이 왜 늘 같은지 설명해 주고, 소장님이 기기를 더하실 때 그 번호를 알려 줍니다.
   ⚠️ 비밀이 아닙니다. 이 번호로는 누구도 그 사람이 될 수 없습니다. */
function BrowserId() {
  const [uid, setUid] = useState('')
  const [베낌, set베낌] = useState(false)
  useEffect(() => {
    let 살아있음 = true
    ;(async () => {
      try {
        const { ensureAnon } = await loadFb()
        const u = await ensureAnon()
        if (살아있음) setUid((u && u.uid) || '')
      } catch { /* 못 물어보면 그냥 안 보입니다 */ }
    })()
    return () => { 살아있음 = false }
  }, [])
  if (!uid) return null
  return (
    <div className="muted" style={{ marginTop: 10, fontSize: 12, lineHeight: 1.7 }}>
      이 브라우저 번호 · <code style={{ fontSize: 11.5 }}>{uid}</code>{' '}
      <button className="lnk" onClick={() => {
        try { navigator.clipboard.writeText(uid); set베낌(true); setTimeout(() => set베낌(false), 1500) }
        catch { /* 안 되면 손으로 긁어 가시면 됩니다 */ }
      }}>{베낌 ? '베꼈습니다' : '베끼기'}</button>
      <br />
      별명은 이 번호로 만듭니다 — 같은 브라우저면 늘 같은 별명입니다.
      기록을 지우면 번호가 바뀌고 별명도 바뀝니다.
    </div>
  )
}
