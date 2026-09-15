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

/**
 * /qna — 「묻고 답하기」 (2026-09-15)
 *
 * 소장님: 「건설맵 이용자가 이용할 수 있는 게시판도 있어야 하지 않아」 · 「묻고 답하기 형식으로」
 *         「답변은 누구나」 · 「이 주소를 저장해 두세요」 는 번거롭다 → 뺐습니다.
 *         「이미 하루 안에 답변을 단다고 했으니」 — 그 약속이 다시 오게 만듭니다.
 *
 * 왜 이 게시판이 필요한가
 *   답변이 곧 실력 증명입니다. 「낙찰하한율이 뭔가요」로 들어온 사람이 답을 읽고,
 *   옆에 있는 「내역서 작성해 드립니다」를 봅니다. 그게 이 화면의 일입니다.
 *
 * ⚠️ 연락처 칸이 «없습니다». 공개 게시판에 전화번호를 적으면 광고 전화가 갑니다.
 *    연락처가 필요한 이야기는 /naeyeok 의 문의함(아무도 못 읽는 곳)으로 보냅니다.
 * ⚠️ 「내가 쓴 글」은 브라우저가 알아서 기억합니다(구인구직과 같은 방식). 적을 것이 없습니다.
 */
const LIMIT = 300
const MINE_KEY = 'kcm_qna_mine'
const loadMine = () => { try { return JSON.parse(localStorage.getItem(MINE_KEY) || '[]') } catch { return [] } }
const addMine = (id) => { try { localStorage.setItem(MINE_KEY, JSON.stringify([...loadMine(), id].slice(-100))) } catch { /* noop */ } }

/* 운영자 열쇠 — 이 값과 맞으면 답변에 「K-건설맵 답변」 표가 붙습니다.
   ⚠️ 완벽한 자물쇠가 아닙니다(화면 안에 해시가 있습니다). 지금 규모에는 충분하고,
      사람이 늘면 진짜 로그인으로 바꿔야 합니다. 그래서 4자리가 아니라 «긴 말»을 씁니다. */
const OP_HASH = 'd671f1a9b6573fc9ed93ef3842550c6dc6167795796f6a4869bb97563f9a2c02'
async function isOp(key) {
  if (!key || key.length < 8) return false
  try { return (await pinHash('kcm-op', key)) === OP_HASH } catch { return false }
}

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
  // 💬 서식·캐드를 받고 «한 줄 남기기» 로 들어오면 물음을 미리 채워 둡니다 (AskComment.jsx).
  //    빈 칸을 마주하면 대부분 그냥 나갑니다 — 물음이 적혀 있으면 답을 씁니다.
  const preset = (() => {
    try { return new URLSearchParams(window.location.search).get('ask') || '' }
    catch { return '' }
  })()
  useEffect(() => { if (preset) setWrite(true) }, [preset])
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
      <div className="card hero">
        <h1 style={{ margin: 0, fontSize: 20 }}>💬 묻고 답하기</h1>
        <div style={{ marginTop: 6, lineHeight: 1.75, color: 'rgba(255,255,255,.92)', fontSize: 13.5 }}>
          입찰 · 내역서 · 설계변경 — 현장에서 막히는 것을 물어보세요.
          <b style={{ color: '#fff' }}> 회원가입 없습니다.</b>
        </div>
      </div>

      {/* ── 안내 ─────────────────────────────────────────────── */}
      <div className="note" style={{ marginBottom: 10, lineHeight: 1.85 }}>
        글 쓸 때 정한 <b>4자리 숫자</b>로 내 글만 지울 수 있습니다.
        답은 <b>하루 안에</b> 달아 드리는 것을 목표로 합니다.<br />
        <b>이렇게 적어 주시면 답이 정확합니다</b> — 공사 규모 · 발주처 · 지금 어디까지 진행됐는지.<br />
        <b style={{ color: 'var(--bad, #c0392b)' }}>전화번호·이메일은 적지 마세요.</b> 공개 게시판이라 광고 전화가 갑니다.
        연락처가 필요한 일은 <a href="/naeyeok">내역서 문의</a>로 보내 주세요 — 그건 아무에게도 안 보입니다.<br />
        답변은 누구나 달 수 있습니다. K-건설맵이 단 답에는 <b>「K-건설맵 답변」</b> 표가 붙습니다.
        표가 없는 답은 이용자 의견이니 <b>중요한 건은 발주처에 확인하십시오.</b>
        광고·홍보 글은 예고 없이 지웁니다.
      </div>

      <div className="btn-row" style={{ justifyContent: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        <button className="btn primary" onClick={() => setWrite((v) => !v)}>
          {write ? '닫기' : '✏️ 질문하기'}
        </button>
        <input className="inp" placeholder="찾기 — 낱말" value={q} onChange={(e) => setQ(e.target.value)}
          style={{ flex: '1 1 160px', minWidth: 120 }} />
        {mine.length > 0 && (
          <button className={'btn' + (onlyMine ? ' primary' : '')} onClick={() => setOnlyMine((v) => !v)}>
            내가 쓴 글 {mine.length}
          </button>
        )}
      </div>

      {write && <WriteForm preset={preset} onDone={() => { setWrite(false); load(); setMine(loadMine()) }} />}

      {list === null && <Skeleton n={4} />}
      {list && list.length === 0 && (
        <Empty>아직 글이 없습니다. 첫 질문을 남겨 주세요.</Empty>
      )}

      {list && list.map((r) => {
        const n = nAns(r.id)
        const isOpen = open === r.id
        return (
          <div className="card" key={r.id} style={{ marginBottom: 8 }}>
            <div onClick={() => setOpen(isOpen ? null : r.id)} style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span className={'chip ' + (n ? 'ok' : 'wait')} style={{
                  fontSize: 11.5, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                  background: n ? 'var(--accent-soft, rgba(26,86,219,.12))' : 'var(--warn-soft, rgba(234,179,8,.15))',
                  color: n ? 'var(--accent, #1a56db)' : 'var(--text)',
                }}>{n ? `답변 ${n}` : '답변대기'}</span>
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
  const [nick, setNick] = useState('')
  const [key, setKey] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  const submit = async () => {
    if (b.trim().length < 2) return setMsg('답변을 적어 주세요.')
    setBusy(true); setMsg('')
    try {
      const { ref, set, push, db, ensureAnon } = await loadFb()
      const user = await ensureAnon()
      const op = await isOp(key)
      const slot = push(ref(db, `qna_a/${qid}`))
      await set(slot, {
        b: b.trim().slice(0, 2000),
        nick: (op ? 'K-건설맵' : (nick.trim() || '익명')).slice(0, 20),
        op,
        uid: user.uid,
        at: Date.now(),
      })
      setB(''); setNick(''); setKey('')
      onDone()
    } catch (e) {
      setMsg('올리지 못했습니다. 잠시 뒤 다시 해 주세요.')
    } finally { setBusy(false) }
  }

  return (
    <div style={{ marginTop: 12 }}>
      <textarea className="inp" value={b} onChange={(e) => setB(e.target.value)}
        placeholder="아는 만큼 답해 주세요. 근거(조문·기관 이름)를 같이 적어 주시면 더 좋습니다."
        style={{ width: '100%', boxSizing: 'border-box', minHeight: 72 }} maxLength={2000} />
      <div className="btn-row" style={{ justifyContent: 'flex-start', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
        <input className="inp" placeholder="닉네임(없으면 익명)" value={nick}
          onChange={(e) => setNick(e.target.value)} maxLength={20} style={{ width: 168 }} />
        <input className="inp" type="password" placeholder="운영자 열쇠(있으면)" value={key}
          onChange={(e) => setKey(e.target.value)} maxLength={40} style={{ width: 160 }} />
        <button className="btn primary" onClick={submit} disabled={busy}>
          {busy ? '올리는 중…' : '답변 올리기'}
        </button>
        {msg && <span className="muted" style={{ fontSize: 12 }}>{msg}</span>}
      </div>
    </div>
  )
}

/* ── 질문 쓰기 ─────────────────────────────────────────────────── */
function WriteForm({ onDone, preset }) {
  const [f, setF] = useState({ t: preset || '', b: '', nick: '', pin: '' })
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
        nick: (f.nick.trim() || '익명').slice(0, 20),
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
      <div className="sec-title" style={{ margin: '0 0 10px' }}>질문하기</div>
      <input className="inp" value={f.t} onChange={set_('t')} maxLength={80}
        placeholder="예) 낙찰됐는데 산출내역서를 언제까지 내야 하나요?"
        style={{ width: '100%', boxSizing: 'border-box', marginBottom: 8 }} />
      <textarea className="inp" value={f.b} onChange={set_('b')} maxLength={2000}
        placeholder="공사 규모 · 발주처 · 지금 어디까지 진행됐는지를 적어 주시면 답이 정확합니다.&#10;전화번호·이메일은 적지 마세요."
        style={{ width: '100%', boxSizing: 'border-box', minHeight: 110, marginBottom: 8 }} />
      <div className="btn-row" style={{ justifyContent: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
        <input className="inp" value={f.nick} onChange={set_('nick')} maxLength={20}
          placeholder="닉네임(없으면 익명)" style={{ width: 168 }} />
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
